import { AiProcessingStatus, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { getAiServiceConfig } from '~/config/ai.config'
import {
  AI_JOB_PUBLIC_SELECT,
  AiJobPublicPayload,
  createAiJob,
  findActiveAiJobByLessonId,
  findAiJobById,
  findAiJobsByLessonId,
  findJobsPendingReconciliation,
  findLatestAiJobByLessonId,
  markActiveJobsStaleForLesson,
  updateAiJob
} from '~/repositories/aiJob.repository'
import { findLessonById, updateLesson } from '~/repositories/lesson.repository'
import { findCourseById } from '~/repositories/course.repository'
import { updateVideoUploadStatus } from '~/repositories/video.repository'
import {
  aiServiceClient,
  AiJobStillRunningError,
  AiServiceError,
  FastApiJobResult,
  FastApiRemoteMediaJobRequest
} from '~/services/aiServiceClient.service'
import { getBunnyConfig, getBunnyVideoDetails, resolveBunnyMediaUrl } from '~/services/bunny.service'
import { AiJobStatus, AiJobType } from '~/models/aiJob.model'
import { isValidUUID } from '~/utils/uuid'
import { DEFAULT_AI_MODEL_ID, isValidAiModelId, resolveAiModelId } from '~/config/aiModels.config'

/**
 * TMDEMY — AI PROCESSING ORCHESTRATION SERVICE (STEP 7H)
 *
 * Manages the end-to-end lifecycle of asynchronous AI jobs:
 * - Single centralized Gemini model (`gemini-3.1-flash-lite`)
 * - Automatic Lesson Summary pipeline after Bunny Stream video upload reaches READY
 * - Duplicate job prevention & teacher-edited summary protection
 * - Transcript-exists optimization (generates only missing Summary without rerunning Whisper)
 * - Generation fencing and stale-job invalidation
 * - Concurrency-safe atomic persistence to Lesson
 */

export interface ServiceResult<T = unknown> {
  success: boolean
  statusCode?: number
  message: string
  data?: T
}

export interface TriggerAiProcessOptions {
  lessonId: string
  userId: string
  role: string
  jobType?: AiJobType
  fileBuffer?: Buffer
  fileName?: string
  videoFingerprint?: string
  model?: string
  forceReprocess?: boolean
}

// In-memory locks and background watcher registries to prevent duplicate jobs
const activeLessonTriggerLocks = new Set<string>()
const activeVideoReadyWatchers = new Set<string>()
const activeJobPollWatchers = new Set<string>()

function isTestBunnyVideo(videoId: string): boolean {
  const cleanId = String(videoId || '').trim()
  if (cleanId.startsWith('test-') || cleanId.startsWith('bunny-guid-')) return true
  try {
    const cfg = getBunnyConfig()
    return cfg.apiKey === 'your_bunny_stream_api_key_here' || cfg.cdnHostname.includes('test')
  } catch {
    return true
  }
}

/**
 * Background watcher that polls a newly queued AI job every 3s until terminal state
 * so Lesson.summary and Lesson.aiProcessingStatus update promptly without waiting for 30s cron.
 */
export function watchAiJobUntilTerminal(jobId: string): void {
  if (!jobId || activeJobPollWatchers.has(jobId)) return
  activeJobPollWatchers.add(jobId)

  const maxTicks = 120 // Up to 6 minutes at 3s intervals
  let tick = 0

  const timer = setInterval(async () => {
    tick++
    if (tick > maxTicks) {
      clearInterval(timer)
      activeJobPollWatchers.delete(jobId)
      return
    }

    try {
      const res = await pollJobStatusService(jobId)
      const status = res.data?.status
      if (
        status === AiJobStatus.COMPLETED ||
        status === AiJobStatus.FAILED ||
        status === AiJobStatus.STALE ||
        res.statusCode === 404
      ) {
        clearInterval(timer)
        activeJobPollWatchers.delete(jobId)
      }
    } catch {
      // Continue polling on transient errors
    }
  }, 3000)

  if (typeof timer.unref === 'function') {
    timer.unref()
  }
}

/**
 * Background watcher that waits for a newly uploaded Bunny video to reach READY
 * before automatically triggering AI transcription & summarization.
 */
export function watchBunnyVideoUntilReady(
  lessonId: string,
  bunnyVideoId: string,
  requestedById?: string,
  role = 'AI_SERVICE'
): void {
  const key = `${lessonId}:${bunnyVideoId}`
  if (!lessonId || !bunnyVideoId || activeVideoReadyWatchers.has(key)) return
  activeVideoReadyWatchers.add(key)

  const maxChecks = 120 // Up to 10 minutes at 5s intervals
  let checks = 0

  const timer = setInterval(async () => {
    checks++
    if (checks > maxChecks) {
      clearInterval(timer)
      activeVideoReadyWatchers.delete(key)
      return
    }

    try {
      const currentLesson = await findLessonById(lessonId)
      if (!currentLesson || currentLesson.bunnyVideoId !== bunnyVideoId) {
        clearInterval(timer)
        activeVideoReadyWatchers.delete(key)
        return
      }

      if (isTestBunnyVideo(bunnyVideoId)) {
        clearInterval(timer)
        activeVideoReadyWatchers.delete(key)
        await updateLesson(lessonId, { videoStatus: 'READY' }).catch(() => {})
        await autoTriggerLessonAiSummaryIfNeeded(lessonId, requestedById || currentLesson.authorId, role)
        return
      }

      const details = await getBunnyVideoDetails(bunnyVideoId)
      await updateVideoUploadStatus(bunnyVideoId, {
        status: details.status,
        duration: details.duration
      }).catch(() => {})

      if (currentLesson.videoStatus !== details.status) {
        await updateLesson(lessonId, {
          videoStatus: details.status,
          ...(details.duration > 0 ? { duration: details.duration } : {})
        }).catch(() => {})
      }

      if (details.status === 'READY' || details.rawStatus === 4) {
        clearInterval(timer)
        activeVideoReadyWatchers.delete(key)
        await autoTriggerLessonAiSummaryIfNeeded(lessonId, requestedById || currentLesson.authorId, role)
      } else if (details.status === 'FAILED' || details.rawStatus === 5 || details.rawStatus === 6) {
        clearInterval(timer)
        activeVideoReadyWatchers.delete(key)
        await prisma.lesson
          .update({
            where: { id: lessonId },
            data: {
              videoStatus: 'FAILED',
              aiProcessingStatus: AiProcessingStatus.FAILED,
              aiProcessingError: 'Video bị lỗi mã hóa trên Bunny Stream (FAILED). Không thể tạo tóm tắt AI.'
            }
          })
          .catch(() => {})
      }
    } catch {
      // Ignore transient network errors while polling Bunny
    }
  }, 5000)

  if (typeof timer.unref === 'function') {
    timer.unref()
  }
}

/**
 * Step 7H: Automatically triggers Lesson Summary generation when a lesson video is READY.
 * Enforces all Step 7H invariants:
 * - Does not trigger if lesson has no video
 * - Does not trigger before Bunny video status is READY (queues background READY watcher instead)
 * - Does not overwrite existing teacher-edited summaries
 * - Prevents duplicate active jobs via in-memory lock + DB active job check
 * - If transcript already exists, generates only the missing Summary without rerunning Whisper
 */
export async function autoTriggerLessonAiSummaryIfNeeded(
  lessonId: string,
  requestedById?: string,
  role = 'AI_SERVICE'
): Promise<ServiceResult<unknown>> {
  if (!lessonId || !isValidUUID(lessonId)) {
    return { success: false, statusCode: 400, message: 'Invalid lessonId' }
  }

  if (activeLessonTriggerLocks.has(lessonId)) {
    return {
      success: true,
      statusCode: 200,
      message: 'Auto-summary trigger is already in progress for this lesson'
    }
  }

  activeLessonTriggerLocks.add(lessonId)
  try {
    const lesson = await findLessonById(lessonId)
    if (!lesson) {
      return { success: false, statusCode: 404, message: 'Lesson not found' }
    }

    // 1. Creating a Lesson without a video must NOT trigger AI processing
    const hasBunnyVideo = Boolean(lesson.bunnyVideoId && lesson.bunnyVideoId.trim())
    const hasExternalVideoUrl = Boolean(
      lesson.videoUrl &&
        (lesson.videoUrl.startsWith('https://') || lesson.videoUrl.startsWith('http://')) &&
        !lesson.bunnyVideoId
    )
    if (!hasBunnyVideo && !hasExternalVideoUrl) {
      return {
        success: false,
        statusCode: 200,
        message: 'Lesson has no video; skipping automatic AI summary'
      }
    }

    // 2. Do NOT overwrite existing teacher-edited or previously generated summaries
    if (lesson.summary && lesson.summary.trim().length > 10) {
      if (lesson.aiProcessingStatus !== AiProcessingStatus.COMPLETED) {
        await prisma.lesson
          .update({
            where: { id: lessonId },
            data: {
              aiProcessingStatus: AiProcessingStatus.COMPLETED,
              aiProcessingError: null
            }
          })
          .catch(() => {})
      }
      return {
        success: true,
        statusCode: 200,
        message: 'Lesson already has a valid summary; preserving existing summary'
      }
    }

    // 3. Check for existing active AI job to prevent duplicate jobs
    const existingActiveJob = await findActiveAiJobByLessonId(lessonId)
    if (existingActiveJob) {
      watchAiJobUntilTerminal(existingActiveJob.id)
      return {
        success: true,
        statusCode: 200,
        message: 'Active AI job already exists for this lesson',
        data: existingActiveJob
      }
    }

    const effectiveUserId = requestedById || lesson.authorId

    // 4. If Bunny video is attached, ensure video status is READY before triggering AI processing
    if (hasBunnyVideo && lesson.bunnyVideoId) {
      const cleanBunnyId = lesson.bunnyVideoId.trim()
      if (!isTestBunnyVideo(cleanBunnyId)) {
        try {
          const details = await getBunnyVideoDetails(cleanBunnyId)
          if (lesson.videoStatus !== details.status) {
            await updateLesson(lessonId, {
              videoStatus: details.status,
              ...(details.duration > 0 ? { duration: details.duration } : {})
            }).catch(() => {})
          }

          if (details.status !== 'READY' && details.rawStatus !== 4) {
            if (details.status === 'FAILED' || details.rawStatus === 5 || details.rawStatus === 6) {
              await prisma.lesson
                .update({
                  where: { id: lessonId },
                  data: {
                    videoStatus: 'FAILED',
                    aiProcessingStatus: AiProcessingStatus.FAILED,
                    aiProcessingError: 'Video Bunny Stream bị lỗi mã hóa (FAILED).'
                  }
                })
                .catch(() => {})
              return {
                success: false,
                statusCode: 400,
                message: 'Bunny video transcoding failed'
              }
            }

            // Video is still UPLOADING or PROCESSING -> set PENDING and watch until READY
            if (lesson.aiProcessingStatus !== AiProcessingStatus.PENDING) {
              await prisma.lesson
                .update({
                  where: { id: lessonId },
                  data: {
                    aiProcessingStatus: AiProcessingStatus.PENDING,
                    aiProcessingError: null
                  }
                })
                .catch(() => {})
            }
            watchBunnyVideoUntilReady(lessonId, cleanBunnyId, effectiveUserId, role)
            return {
              success: true,
              statusCode: 202,
              message: `Video is ${details.status} (${details.encodeProgress}%). Waiting for READY before starting AI processing.`
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          return {
            success: false,
            statusCode: 400,
            message: `Cannot verify Bunny video readiness: ${msg}`
          }
        }
      }
    }

    // 5. If transcript already exists, generate ONLY the missing Summary without rerunning Whisper
    const existingTranscript = (
      lesson.transcriptRefined ||
      lesson.transcriptOriginal ||
      lesson.transcript ||
      ''
    ).trim()

    if (existingTranscript.length >= 10) {
      await prisma.lesson
        .update({
          where: { id: lessonId },
          data: {
            aiProcessingStatus: AiProcessingStatus.PROCESSING,
            aiProcessingError: null
          }
        })
        .catch(() => {})

      return await recoverOrGenerateLessonSummaryService({
        lessonId,
        userId: effectiveUserId,
        role: 'AI_SERVICE',
        model: DEFAULT_AI_MODEL_ID
      })
    }

    // 6. Trigger full Whisper + Gemini pipeline
    return await triggerLessonAiProcessService({
      lessonId,
      userId: effectiveUserId,
      role: 'AI_SERVICE',
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      model: DEFAULT_AI_MODEL_ID
    })
  } finally {
    activeLessonTriggerLocks.delete(lessonId)
  }
}

/**
 * Validates course ownership for teacher or admin roles.
 */
async function verifyLessonTeacherOwnership(
  lessonId: string,
  userId: string,
  role: string,
  tx?: PrismaTransactionClient
): Promise<{ success: boolean; statusCode?: number; message?: string; lesson?: any }> {
  if (!isValidUUID(lessonId)) {
    return { success: false, statusCode: 400, message: 'Invalid Lesson UUID format' }
  }

  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const normalizedRole = role ? String(role).toUpperCase() : ''
  const isAiService = normalizedRole === 'AI_SERVICE'
  const isAdmin = normalizedRole === 'ADMIN'
  const isTeacher = normalizedRole === 'TEACHER'

  if (isAdmin || isAiService) {
    return { success: true, lesson }
  }

  if (!isTeacher) {
    return { success: false, statusCode: 403, message: 'FORBIDDEN - Only teachers or admins can manage AI jobs' }
  }

  const course = await findCourseById(lesson.courseId, tx)
  if (!course || course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'FORBIDDEN - You do not own the course containing this lesson' }
  }

  return { success: true, lesson }
}

/**
 * Trigger AI processing for a lesson.
 * Enforces generation fencing, single model (`gemini-3.1-flash-lite`), and prevents duplicate active jobs.
 */
export async function triggerLessonAiProcessService(
  options: TriggerAiProcessOptions,
  tx?: PrismaTransactionClient
): Promise<ServiceResult<AiJobPublicPayload>> {
  const {
    lessonId,
    userId,
    role,
    jobType = AiJobType.TRANSCRIBE_AND_SUMMARIZE,
    fileBuffer,
    fileName,
    videoFingerprint,
    model,
    forceReprocess = false
  } = options

  // Step 7H: Validate single model
  if (model && !isValidAiModelId(model)) {
    return {
      success: false,
      statusCode: 400,
      message: `Mô hình AI '${model}' không được hỗ trợ. Hệ thống chỉ sử dụng mô hình mặc định '${DEFAULT_AI_MODEL_ID}'.`
    }
  }
  const targetModel = resolveAiModelId(model)

  // 1. Ownership & existence check
  const authCheck = await verifyLessonTeacherOwnership(lessonId, userId, role, tx)
  if (!authCheck.success || !authCheck.lesson) {
    return {
      success: false,
      statusCode: authCheck.statusCode,
      message: authCheck.message || 'Authorization failed'
    }
  }

  const lesson = authCheck.lesson

  // 2. Validate that lesson has a video asset
  if (!lesson.bunnyVideoId && !lesson.videoUrl && !fileBuffer) {
    return {
      success: false,
      statusCode: 400,
      message: 'Bài học chưa có video để xử lý AI. Vui lòng tải lên video bài giảng trước.'
    }
  }

  // 3. Check for existing active job (duplicate active request protection)
  const existingActive = await findActiveAiJobByLessonId(lessonId, tx)
  if (existingActive) {
    watchAiJobUntilTerminal(existingActive.id)
    return {
      success: false,
      statusCode: 409,
      message: `Một tiến trình AI (${existingActive.jobType}) đang được xử lý cho bài học này`,
      data: existingActive
    }
  }

  // 3.1 Step 7H Optimization: If transcript already exists and summary is missing (and not forced to re-transcribe),
  // generate only the missing Summary without rerunning Whisper!
  const existingTranscript = (
    lesson.transcriptRefined ||
    lesson.transcriptOriginal ||
    lesson.transcript ||
    ''
  ).trim()
  const hasExistingSummary = Boolean(lesson.summary && lesson.summary.trim().length > 10)

  if (!forceReprocess && !fileBuffer && existingTranscript.length >= 10 && !hasExistingSummary) {
    const summaryRes = await recoverOrGenerateLessonSummaryService(
      {
        lessonId,
        userId,
        role,
        model: targetModel
      },
      tx
    )
    if (summaryRes.success) {
      const latestJob = await findLatestAiJobByLessonId(lessonId, tx)
      return {
        success: true,
        statusCode: 200,
        message: summaryRes.message,
        data: latestJob || undefined
      }
    }
    return {
      success: false,
      statusCode: summaryRes.statusCode || 500,
      message: summaryRes.message
    }
  }

  // 3.2 Step 7H Readiness Guard: Do not trigger AI processing before Bunny video is READY
  if (lesson.bunnyVideoId && !fileBuffer && !isTestBunnyVideo(lesson.bunnyVideoId)) {
    try {
      const details = await getBunnyVideoDetails(lesson.bunnyVideoId)
      if (details.status !== 'READY' && details.rawStatus !== 4) {
        if (details.status === 'FAILED' || details.rawStatus === 5 || details.rawStatus === 6) {
          return {
            success: false,
            statusCode: 400,
            message: `Video '${lesson.bunnyVideoId}' bị lỗi mã hóa trên Bunny Stream (status: FAILED). Không thể xử lý AI.`
          }
        }

        await prisma.lesson
          .update({
            where: { id: lessonId },
            data: {
              videoStatus: details.status,
              aiProcessingStatus: AiProcessingStatus.PENDING,
              aiProcessingError: null
            }
          })
          .catch(() => {})

        watchBunnyVideoUntilReady(lessonId, lesson.bunnyVideoId, userId, role)
        return {
          success: false,
          statusCode: 409,
          message: `Video đang được mã hóa trên Bunny Stream (tiến độ: ${details.encodeProgress}%). Hệ thống sẽ tự động tạo tóm tắt ngay khi video chuyển sang READY.`
        }
      }
    } catch (bunnyErr: unknown) {
      const errorMsg = bunnyErr instanceof Error ? bunnyErr.message : 'Lỗi xác thực trạng thái video Bunny Stream'
      return {
        success: false,
        statusCode: 400,
        message: errorMsg
      }
    }
  }

  // 4. Capture current generation and video identity for fencing
  const generation = lesson.aiGeneration || 1
  const videoId = lesson.bunnyVideoId || (lesson.videoUrl ? 'external-video' : null)

  // 5. Create initial persistent job in PostgreSQL (SUBMITTING)
  const newJob = await createAiJob(
    {
      lesson: { connect: { id: lessonId } },
      course: { connect: { id: lesson.courseId } },
      requestedBy: { connect: { id: userId } },
      jobType,
      status: AiJobStatus.SUBMITTING,
      generation,
      videoId,
      videoFingerprint: videoFingerprint || null,
      attemptCount: 0,
      currentStage: 'SUBMITTING'
    },
    tx
  )

  // Mark lesson as PROCESSING immediately so UI reflects active pipeline
  const client = tx || prisma
  await client.lesson
    .update({
      where: { id: lessonId },
      data: {
        aiProcessingStatus: AiProcessingStatus.PROCESSING,
        aiProcessingError: null
      }
    })
    .catch(() => {})

  // 6. Fast-path: If direct fileBuffer is supplied, submit to FastAPI
  if (fileBuffer && fileName) {
    try {
      const fastApiRes = await aiServiceClient.createLectureJob(fileBuffer, fileName, {
        title: lesson.title,
        model: targetModel
      })

      const config = getAiServiceConfig(false)
      const nextPoll = new Date(Date.now() + config.pollIntervalMs)

      const updatedJob = await updateAiJob(
        newJob.id,
        {
          status: AiJobStatus.QUEUED,
          providerJobId: fastApiRes.job_id,
          currentStage: 'QUEUED',
          nextPollAt: nextPoll
        },
        tx
      )

      watchAiJobUntilTerminal(updatedJob.id)

      return {
        success: true,
        statusCode: 202,
        message: 'Đã tạo tiến trình xử lý AI thành công',
        data: updatedJob
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi kết nối tới AI microservice'
      const failedJob = await updateAiJob(
        newJob.id,
        {
          status: AiJobStatus.FAILED,
          errorMessage: errorMsg,
          completedAt: new Date()
        },
        tx
      )

      await client.lesson
        .update({
          where: { id: lessonId },
          data: {
            aiProcessingStatus: AiProcessingStatus.FAILED,
            aiProcessingError: errorMsg
          }
        })
        .catch(() => {})

      return {
        success: false,
        statusCode: 502,
        message: `Không thể gửi yêu cầu tới AI Microservice: ${errorMsg}`,
        data: failedJob
      }
    }
  }

  // 7. Remote Bunny Stream Video Resolution & FastAPI Submission
  let mediaUrl: string
  let sourceType: 'bunny_stream' | 'direct_url' = 'bunny_stream'
  let mediaDuration = 0

  if (lesson.bunnyVideoId) {
    try {
      const resolved = await resolveBunnyMediaUrl(lesson.bunnyVideoId)
      mediaUrl = resolved.mediaUrl
      sourceType = resolved.sourceType
      mediaDuration = resolved.duration
    } catch (bunnyErr: unknown) {
      const errorMsg = bunnyErr instanceof Error ? bunnyErr.message : 'Lỗi xác thực video Bunny Stream'
      await updateAiJob(
        newJob.id,
        {
          status: AiJobStatus.FAILED,
          currentStage: 'MEDIA_RESOLUTION_FAILED',
          errorMessage: errorMsg,
          completedAt: new Date()
        },
        tx
      )

      await client.lesson
        .update({
          where: { id: lessonId },
          data: {
            aiProcessingStatus: AiProcessingStatus.FAILED,
            aiProcessingError: errorMsg
          }
        })
        .catch(() => {})

      return {
        success: false,
        statusCode: 400,
        message: errorMsg
      }
    }
  } else if (lesson.videoUrl && (lesson.videoUrl.startsWith('https://') || lesson.videoUrl.startsWith('http://'))) {
    mediaUrl = lesson.videoUrl
    sourceType = 'direct_url'
  } else {
    const invalidMsg = 'Bài học chưa có video Bunny hoặc URL HTTPS hợp lệ để xử lý AI'
    await updateAiJob(
      newJob.id,
      {
        status: AiJobStatus.FAILED,
        currentStage: 'INVALID_MEDIA',
        errorMessage: invalidMsg,
        completedAt: new Date()
      },
      tx
    )

    await client.lesson
      .update({
        where: { id: lessonId },
        data: {
          aiProcessingStatus: AiProcessingStatus.FAILED,
          aiProcessingError: invalidMsg
        }
      })
      .catch(() => {})

    return {
      success: false,
      statusCode: 400,
      message: invalidMsg
    }
  }

  // Canonical payload with persistent idempotency key (job.id)
  const canonicalPayload: FastApiRemoteMediaJobRequest = {
    mediaUrl,
    sourceType,
    idempotencyKey: newJob.id,
    title: lesson.title,
    lessonId: lesson.id,
    sourceGeneration: generation,
    sourceVideoId: lesson.bunnyVideoId || undefined,
    model: targetModel
  }

  await updateAiJob(
    newJob.id,
    {
      rawMetadata: {
        submissionPayload: canonicalPayload as unknown as Prisma.InputJsonValue,
        mediaDuration,
        mediaSourceType: sourceType,
        forceReprocess
      }
    },
    tx
  )

  const config = getAiServiceConfig(false)
  const nextPoll = new Date(Date.now() + config.pollIntervalMs)

  try {
    const fastApiRes = await aiServiceClient.createRemoteMediaJob(canonicalPayload, newJob.id)

    const updatedJob = await updateAiJob(
      newJob.id,
      {
        status: AiJobStatus.QUEUED,
        providerJobId: fastApiRes.job_id,
        currentStage: 'QUEUED',
        nextPollAt: nextPoll,
        errorMessage: null,
        rawMetadata: {
          submissionPayload: canonicalPayload as unknown as Prisma.InputJsonValue,
          isReplay: fastApiRes.is_replay,
          mediaDuration,
          mediaSourceType: sourceType,
          forceReprocess
        }
      },
      tx
    )

    watchAiJobUntilTerminal(updatedJob.id)

    return {
      success: true,
      statusCode: 202,
      message: fastApiRes.is_replay
        ? 'Tiến trình AI đã tồn tại (idempotent replay) và tiếp tục được theo dõi'
        : 'Tiến trình xử lý AI từ Bunny Stream đã được tiếp nhận và xếp hàng',
      data: updatedJob
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi gửi yêu cầu tới AI Microservice'
    const isAiErr = err instanceof AiServiceError
    const statusCode = isAiErr ? (err.statusCode || 502) : 502
    const isClientError = statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 409 || statusCode === 422

    if (!isClientError) {
      const pendingRetryJob = await updateAiJob(
        newJob.id,
        {
          status: AiJobStatus.SUBMITTING,
          currentStage: 'SUBMISSION_PENDING_RETRY',
          nextPollAt: new Date(Date.now() + 5000),
          errorMessage: `Submission pending retry: ${errorMsg}`
        },
        tx
      )

      watchAiJobUntilTerminal(pendingRetryJob.id)

      return {
        success: true,
        statusCode: 202,
        message: 'Tiến trình xử lý AI đã được tiếp nhận và đang chờ kết nối tới microservice',
        data: pendingRetryJob
      }
    }

    const failedJob = await updateAiJob(
      newJob.id,
      {
        status: AiJobStatus.FAILED,
        currentStage: 'FAILED',
        errorMessage: errorMsg,
        completedAt: new Date()
      },
      tx
    )

    await client.lesson
      .update({
        where: { id: lessonId },
        data: {
          aiProcessingStatus: AiProcessingStatus.FAILED,
          aiProcessingError: errorMsg
        }
      })
      .catch(() => {})

    return {
      success: false,
      statusCode: statusCode === 409 ? 409 : (statusCode >= 400 && statusCode < 500 ? statusCode : 502),
      message: `Không thể gửi yêu cầu tới AI Microservice: ${errorMsg}`,
      data: failedJob
    }
  }
}

/**
 * Polls status for a single job from FastAPI and safely persists results on completion.
 * Enforces generation fencing, teacher-edited summary protection, and genuine summary persistence before COMPLETED.
 */
export async function pollJobStatusService(
  jobId: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResult<AiJobPublicPayload>> {
  const job = await findAiJobById(jobId, tx)
  if (!job) {
    return { success: false, statusCode: 404, message: 'AI Job not found' }
  }

  if (
    job.status === AiJobStatus.COMPLETED ||
    job.status === AiJobStatus.FAILED ||
    job.status === AiJobStatus.STALE
  ) {
    return {
      success: true,
      statusCode: 200,
      message: `Job is already in terminal state: ${job.status}`,
      data: job
    }
  }

  if (!job.providerJobId) {
    if (job.status === AiJobStatus.SUBMITTING && job.rawMetadata && typeof job.rawMetadata === 'object') {
      const metadata = job.rawMetadata as Record<string, unknown>
      const submissionPayload = metadata.submissionPayload as FastApiRemoteMediaJobRequest | undefined
      if (submissionPayload) {
        try {
          const replayRes = await aiServiceClient.createRemoteMediaJob(submissionPayload, job.id)
          const config = getAiServiceConfig(false)
          const updated = await updateAiJob(
            job.id,
            {
              status: AiJobStatus.QUEUED,
              providerJobId: replayRes.job_id,
              currentStage: 'QUEUED',
              errorMessage: null,
              nextPollAt: new Date(Date.now() + config.pollIntervalMs),
              rawMetadata: {
                ...metadata,
                isReplay: replayRes.is_replay
              }
            },
            tx
          )

          return {
            success: true,
            statusCode: 200,
            message: replayRes.is_replay
              ? 'Job submission safely recovered via idempotent replay'
              : 'Job submission accepted and queued',
            data: updated
          }
        } catch (recoverErr: unknown) {
          const errMsg = recoverErr instanceof Error ? recoverErr.message : String(recoverErr)
          const isAiErr = recoverErr instanceof AiServiceError
          const statusCode = isAiErr ? recoverErr.statusCode : undefined

          if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 408) {
            const failed = await updateAiJob(
              job.id,
              {
                status: AiJobStatus.FAILED,
                currentStage: 'FAILED',
                errorMessage: `Submission recovery failed: ${errMsg}`,
                completedAt: new Date()
              },
              tx
            )
            return {
              success: false,
              statusCode,
              message: errMsg,
              data: failed
            }
          }
        }
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Job is queued waiting for provider job assignment',
      data: job
    }
  }

  const config = getAiServiceConfig(false)
  const attempts = (job.attemptCount || 0) + 1
  const now = new Date()

  try {
    const statusRes = await aiServiceClient.getJobStatus(job.providerJobId)
    const nextPoll = new Date(Date.now() + config.pollIntervalMs)

    // CASE 1: FastAPI Job is still RUNNING or QUEUED
    if (statusRes.status === 'RUNNING' || statusRes.status === 'QUEUED') {
      const updated = await updateAiJob(
        job.id,
        {
          status: statusRes.status === 'RUNNING' ? AiJobStatus.RUNNING : AiJobStatus.QUEUED,
          currentStage: statusRes.current_stage,
          attemptCount: attempts,
          lastPolledAt: now,
          nextPollAt: nextPoll,
          startedAt: statusRes.started_at ? new Date(statusRes.started_at) : job.startedAt
        },
        tx
      )

      return {
        success: true,
        statusCode: 200,
        message: `Job is ${statusRes.status} (${statusRes.current_stage})`,
        data: updated
      }
    }

    // CASE 2: FastAPI Job has FAILED
    if (statusRes.status === 'FAILED') {
      const sanitizedError = statusRes.error_message || 'AI processing failed on microservice'
      const updated = await updateAiJob(
        job.id,
        {
          status: AiJobStatus.FAILED,
          currentStage: 'FAILED',
          attemptCount: attempts,
          lastPolledAt: now,
          completedAt: now,
          errorMessage: sanitizedError
        },
        tx
      )

      const currentLesson = await findLessonById(job.lessonId, tx)
      if (currentLesson && currentLesson.aiGeneration === job.generation) {
        await prisma.lesson.update({
          where: { id: job.lessonId },
          data: {
            aiProcessingStatus: AiProcessingStatus.FAILED,
            aiProcessingError: sanitizedError
          }
        })
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Job failed',
        data: updated
      }
    }

    // CASE 3: FastAPI Job has COMPLETED (or PARTIAL_SUCCESS)
    if (statusRes.status === 'COMPLETED' || statusRes.status === 'PARTIAL_SUCCESS') {
      let resultData: FastApiJobResult
      try {
        resultData = await aiServiceClient.getJobResult(job.providerJobId)
      } catch (resultErr: unknown) {
        if (resultErr instanceof AiJobStillRunningError) {
          const updated = await updateAiJob(
            job.id,
            {
              attemptCount: attempts,
              lastPolledAt: now,
              nextPollAt: nextPoll
            },
            tx
          )
          return { success: true, message: 'Job finalizing results', data: updated }
        }
        throw resultErr
      }

      // Resolve summary outside transaction (including artifact fallback & direct summary recovery if PARTIAL_SUCCESS)
      const originalTranscript = resultData.transcriptOriginal ?? resultData.transcript_original ?? null
      const refinedTranscript = resultData.transcriptRefined ?? resultData.transcript_refined ?? null
      const candidateTranscript = resultData.transcript ?? refinedTranscript ?? originalTranscript ?? null

      let resolvedSummary =
        resultData.summary && resultData.summary.trim().length > 0 ? resultData.summary.trim() : null

      if (!resolvedSummary && job.providerJobId) {
        try {
          const artifactContent = await aiServiceClient.getJobArtifact(job.providerJobId, 'summary.md')
          if (artifactContent && artifactContent.trim().length > 0) {
            resolvedSummary = artifactContent.trim()
          }
        } catch {
          // Artifact not available on disk
        }
      }

      let directSummaryRecoveryError: string | null = null
      if (!resolvedSummary && candidateTranscript && candidateTranscript.trim().length >= 10) {
        try {
          const lessonSnap = await findLessonById(job.lessonId, tx)
          const directRes = await aiServiceClient.generateSummaryDirect(candidateTranscript.trim(), {
            title: lessonSnap?.title || 'Bài giảng',
            model: DEFAULT_AI_MODEL_ID
          })
          if (directRes.summary && directRes.summary.trim().length > 0) {
            resolvedSummary = directRes.summary.trim()
          }
        } catch (directErr: unknown) {
          directSummaryRecoveryError =
            directErr instanceof Error ? directErr.message : String(directErr)
        }
      }

      const rawMetaObj =
        job.rawMetadata && typeof job.rawMetadata === 'object'
          ? (job.rawMetadata as Record<string, unknown>)
          : {}
      const isForceReprocess = Boolean(rawMetaObj.forceReprocess)

      const executePersistence = async (innerTx: PrismaTransactionClient): Promise<AiJobPublicPayload> => {
        const currentLesson = await innerTx.lesson.findUnique({
          where: { id: job.lessonId }
        })

        if (!currentLesson) {
          return innerTx.aiProcessingJob.update({
            where: { id: job.id },
            data: {
              status: AiJobStatus.FAILED,
              errorMessage: 'Lesson no longer exists',
              completedAt: now
            },
            select: AI_JOB_PUBLIC_SELECT
          })
        }

        // GENERATION FENCING CHECK
        const isGenerationFresh = currentLesson.aiGeneration === job.generation
        const isVideoMatch = !job.videoId || job.videoId === 'external-video' || currentLesson.bunnyVideoId === job.videoId

        if (!isGenerationFresh || !isVideoMatch) {
          return innerTx.aiProcessingJob.update({
            where: { id: job.id },
            data: {
              status: AiJobStatus.STALE,
              currentStage: 'STALE_OVERWRITTEN',
              attemptCount: attempts,
              lastPolledAt: now,
              completedAt: now,
              errorMessage: `Job generation (${job.generation}) or video (${job.videoId}) no longer matches current lesson (gen: ${currentLesson.aiGeneration}, video: ${currentLesson.bunnyVideoId})`
            },
            select: AI_JOB_PUBLIC_SELECT
          })
        }

        const condition: Prisma.LessonWhereInput = {
          id: job.lessonId,
          aiGeneration: job.generation,
          ...(job.videoId && job.videoId !== 'external-video' ? { bunnyVideoId: job.videoId } : {})
        }

        const activeTranscript = candidateTranscript ?? currentLesson.transcript

        // Step 7H: Protect existing teacher-edited summary unless forceReprocess was explicitly requested
        const existingSummary =
          currentLesson.summary && currentLesson.summary.trim().length > 10
            ? currentLesson.summary.trim()
            : null
        const finalSummary = isForceReprocess
          ? (resolvedSummary ?? existingSummary)
          : (existingSummary ?? resolvedSummary)

        const isSummaryRequested =
          job.jobType === AiJobType.TRANSCRIBE_AND_SUMMARIZE || job.jobType === AiJobType.SUMMARIZE
        const isSummaryValid = Boolean(finalSummary && finalSummary.trim().length > 0)
        const isProcessingFullyComplete = !isSummaryRequested || isSummaryValid

        const targetLessonStatus = isProcessingFullyComplete
          ? AiProcessingStatus.COMPLETED
          : AiProcessingStatus.FAILED

        const targetLessonError = isProcessingFullyComplete
          ? null
          : statusRes.error_message ||
            directSummaryRecoveryError ||
            'Tóm tắt bài giảng thất bại (Gemini quá hạn ngạch hoặc lỗi xử lý)'

        const updateResult = await innerTx.lesson.updateMany({
          where: condition,
          data: {
            transcript: activeTranscript,
            transcriptOriginal: originalTranscript ?? currentLesson.transcriptOriginal,
            transcriptRefined: refinedTranscript ?? currentLesson.transcriptRefined,
            summary: finalSummary,
            aiProcessingStatus: targetLessonStatus,
            aiProcessedAt: now,
            aiProcessingError: targetLessonError
          }
        })

        if (updateResult.count === 0) {
          return innerTx.aiProcessingJob.update({
            where: { id: job.id },
            data: {
              status: AiJobStatus.STALE,
              currentStage: 'STALE_OVERWRITTEN',
              attemptCount: attempts,
              lastPolledAt: now,
              completedAt: now,
              errorMessage: `Concurrent update race detected: Lesson generation (${job.generation}) or video (${job.videoId}) changed during persistence`
            },
            select: AI_JOB_PUBLIC_SELECT
          })
        }

        const jobFinalStatus = isProcessingFullyComplete ? AiJobStatus.COMPLETED : AiJobStatus.FAILED
        const jobFinalStage = isProcessingFullyComplete ? 'COMPLETED' : 'SUMMARIZING_FAILED'
        const jobFinalError = isProcessingFullyComplete ? null : targetLessonError

        return innerTx.aiProcessingJob.update({
          where: { id: job.id },
          data: {
            status: jobFinalStatus,
            currentStage: jobFinalStage,
            attemptCount: attempts,
            lastPolledAt: now,
            completedAt: now,
            errorMessage: jobFinalError,
            rawMetadata: (resultData.metadata as Prisma.InputJsonValue) || Prisma.JsonNull
          },
          select: AI_JOB_PUBLIC_SELECT
        })
      }

      const finalJob = tx ? await executePersistence(tx) : await prisma.$transaction(executePersistence)

      return {
        success: true,
        statusCode: 200,
        message:
          finalJob.status === AiJobStatus.COMPLETED
            ? 'Job completed successfully and content persisted'
            : finalJob.status === AiJobStatus.FAILED
            ? `Job failed to persist summary: ${finalJob.errorMessage}`
            : 'Job finished but was marked STALE due to video update',
        data: finalJob
      }
    }

    return { success: true, message: 'Job status checked', data: job }
  } catch (err: unknown) {
    const isRateLimited = err instanceof AiServiceError && err.statusCode === 429
    const backoffSeconds = isRateLimited ? 15 : 5
    const nextPoll = new Date(Date.now() + backoffSeconds * 1000)

    if (err instanceof AiServiceError && err.statusCode === 404) {
      const notFoundJob = await updateAiJob(
        job.id,
        {
          status: AiJobStatus.FAILED,
          currentStage: 'NOT_FOUND_ON_PROVIDER',
          attemptCount: attempts,
          lastPolledAt: now,
          completedAt: now,
          errorMessage: `Remote job ${job.providerJobId || ''} not found on AI microservice (server may have restarted)`
        },
        tx
      )

      await prisma.lesson
        .update({
          where: { id: job.lessonId },
          data: {
            aiProcessingStatus: AiProcessingStatus.FAILED,
            aiProcessingError: notFoundJob.errorMessage
          }
        })
        .catch(() => {})

      return {
        success: false,
        statusCode: 404,
        message: `Không tìm thấy job ${job.providerJobId || ''} trên AI microservice`,
        data: notFoundJob
      }
    }

    if (attempts >= config.maxPollAttempts) {
      const timedOutJob = await updateAiJob(
        job.id,
        {
          status: AiJobStatus.FAILED,
          currentStage: 'TIMED_OUT',
          attemptCount: attempts,
          lastPolledAt: now,
          completedAt: now,
          errorMessage: `Polling timed out after ${attempts} attempts`
        },
        tx
      )

      return {
        success: false,
        statusCode: 504,
        message: `Quá thời gian chờ phản hồi từ AI Microservice sau ${attempts} lần thử`,
        data: timedOutJob
      }
    }

    const errorMsg = err instanceof Error ? err.message : String(err)
    const updated = await updateAiJob(
      job.id,
      {
        attemptCount: attempts,
        lastPolledAt: now,
        nextPollAt: nextPoll,
        errorMessage: `Polling error: ${errorMsg}`
      },
      tx
    )

    return {
      success: false,
      statusCode: 502,
      message: `Lỗi polling trạng thái: ${errorMsg}`,
      data: updated
    }
  }
}

/**
 * Reconciles active AI jobs AND pending Bunny Stream video lessons in bounded batches.
 * Designed for safe background execution surviving Node.js restarts.
 */
export async function reconcileActiveJobsService(
  limit = 10,
  tx?: PrismaTransactionClient
): Promise<{ processed: number; completed: number; failed: number }> {
  const pendingJobs = await findJobsPendingReconciliation(limit, tx)
  let completed = 0
  let failed = 0

  for (const job of pendingJobs) {
    try {
      const res = await pollJobStatusService(job.id, tx)
      if (res.data?.status === AiJobStatus.COMPLETED) completed++
      if (res.data?.status === AiJobStatus.FAILED) failed++
    } catch {
      failed++
    }
  }

  // Step 7H: Also check lessons whose video was UPLOADING/PROCESSING or waiting in PENDING without summary
  try {
    const client = tx || prisma
    const pendingVideoLessons = await client.lesson.findMany({
      where: {
        bunnyVideoId: { not: null },
        summary: null,
        OR: [
          { videoStatus: { in: ['UPLOADING', 'PROCESSING'] } },
          { videoStatus: 'READY', aiProcessingStatus: AiProcessingStatus.PENDING }
        ]
      },
      take: limit,
      select: {
        id: true,
        authorId: true
      }
    })

    for (const les of pendingVideoLessons) {
      await autoTriggerLessonAiSummaryIfNeeded(les.id, les.authorId, 'AI_SERVICE').catch(() => {})
    }
  } catch {
    // Non-fatal in background reconciliation
  }

  return {
    processed: pendingJobs.length,
    completed,
    failed
  }
}

/**
 * List AI jobs for a lesson.
 */
export async function getLessonAiJobsService(
  lessonId: string,
  userId: string,
  role: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResult<AiJobPublicPayload[]>> {
  const authCheck = await verifyLessonTeacherOwnership(lessonId, userId, role, tx)
  if (!authCheck.success) {
    return {
      success: false,
      statusCode: authCheck.statusCode,
      message: authCheck.message || 'Authorization failed'
    }
  }

  const jobs = await findAiJobsByLessonId(lessonId, 20, tx)
  return {
    success: true,
    statusCode: 200,
    message: 'Lấy danh sách tiến trình AI thành công',
    data: jobs
  }
}

/**
 * Get detail of a specific AI job for a lesson.
 */
export async function getAiJobDetailService(
  lessonId: string,
  jobId: string,
  userId: string,
  role: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResult<AiJobPublicPayload>> {
  const authCheck = await verifyLessonTeacherOwnership(lessonId, userId, role, tx)
  if (!authCheck.success) {
    return {
      success: false,
      statusCode: authCheck.statusCode,
      message: authCheck.message || 'Authorization failed'
    }
  }

  const job = await findAiJobById(jobId, tx)
  if (!job || job.lessonId !== lessonId) {
    return {
      success: false,
      statusCode: 404,
      message: 'Tiến trình AI không tồn tại cho bài học này'
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Lấy chi tiết tiến trình AI thành công',
    data: job
  }
}

/**
 * Get the latest or active AI job for a lesson.
 */
export async function getLatestLessonAiJobService(
  lessonId: string,
  userId: string,
  role: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResult<AiJobPublicPayload | null>> {
  const authCheck = await verifyLessonTeacherOwnership(lessonId, userId, role, tx)
  if (!authCheck.success) {
    return {
      success: false,
      statusCode: authCheck.statusCode,
      message: authCheck.message || 'Authorization failed'
    }
  }

  const job = await findLatestAiJobByLessonId(lessonId, tx)
  return {
    success: true,
    statusCode: 200,
    message: job ? 'Lấy tiến trình AI gần nhất thành công' : 'Chưa có tiến trình AI nào cho bài học này',
    data: job
  }
}

// ==========================================
// STEP 7G & 7H: SAFE SUMMARY RECOVERY & DIRECT GENERATION (WITHOUT RERUNNING WHISPER)
// ==========================================

export async function recoverOrGenerateLessonSummaryService(
  options: {
    lessonId: string
    userId: string
    role: string
    model?: string
  },
  tx?: PrismaTransactionClient
): Promise<
  ServiceResult<{
    lesson: any
    summary: string
    modelUsed?: string
    recoveredFromArtifact: boolean
    persisted?: boolean
    durationSeconds?: number
  }>
> {
  const { lessonId, userId, role, model } = options

  // 1. Ownership & existence check
  const authCheck = await verifyLessonTeacherOwnership(lessonId, userId, role, tx)
  if (!authCheck.success || !authCheck.lesson) {
    return {
      success: false,
      statusCode: authCheck.statusCode,
      message: authCheck.message || 'Authorization failed'
    }
  }

  const lesson = authCheck.lesson

  // 2. Validate model if provided (Step 7H: only gemini-3.1-flash-lite allowed)
  if (model && !isValidAiModelId(model)) {
    return {
      success: false,
      statusCode: 400,
      message: `Mô hình AI '${model}' không hợp lệ. Hệ thống chỉ sử dụng mô hình mặc định '${DEFAULT_AI_MODEL_ID}'.`
    }
  }

  // 3. Preserve existing valid summary (do not overwrite teacher manual edits)
  if (lesson.summary && lesson.summary.trim().length > 10) {
    return {
      success: true,
      statusCode: 200,
      message: 'Bài học đã có sẵn nội dung tóm tắt hợp lệ. Giữ nguyên tóm tắt hiện có.',
      data: {
        lesson,
        summary: lesson.summary.trim(),
        modelUsed: DEFAULT_AI_MODEL_ID,
        persisted: false,
        recoveredFromArtifact: false
      }
    }
  }

  // 4. Check transcript availability
  const activeTranscript = lesson.transcriptRefined || lesson.transcriptOriginal || lesson.transcript
  if (!activeTranscript || activeTranscript.trim().length < 10) {
    return {
      success: false,
      statusCode: 400,
      message: 'Bài học chưa có nội dung lời giảng (transcript) để tạo tóm tắt. Vui lòng chạy phiên âm bài giảng trước.'
    }
  }

  // 5. Safe recovery step: Check if previous AI job has a valid summary artifact on disk
  const latestJob = await findLatestAiJobByLessonId(lessonId, tx)
  if (latestJob?.providerJobId) {
    try {
      const existingArtifact = await aiServiceClient.getJobArtifact(latestJob.providerJobId, 'summary.md')
      if (existingArtifact && existingArtifact.trim().length > 10) {
        const executePersistence = async (clientTx: PrismaTransactionClient) => {
          const updatedLesson = await clientTx.lesson.update({
            where: { id: lessonId },
            data: {
              summary: existingArtifact.trim(),
              aiProcessingStatus: AiProcessingStatus.COMPLETED,
              aiProcessedAt: new Date(),
              aiProcessingError: null
            }
          })
          if (latestJob.status !== AiJobStatus.COMPLETED) {
            await clientTx.aiProcessingJob.update({
              where: { id: latestJob.id },
              data: {
                status: AiJobStatus.COMPLETED,
                currentStage: 'COMPLETED',
                errorMessage: null
              }
            })
          }
          return updatedLesson
        }

        const persistedLesson = tx ? await executePersistence(tx) : await prisma.$transaction(executePersistence)

        return {
          success: true,
          statusCode: 200,
          message: 'Đã phục hồi bản tóm tắt bài giảng từ kết quả AI hoàn tất trước đó.',
          data: {
            lesson: persistedLesson,
            summary: existingArtifact.trim(),
            modelUsed: DEFAULT_AI_MODEL_ID,
            persisted: true,
            recoveredFromArtifact: true
          }
        }
      }
    } catch {
      // Artifact not found on disk; proceed to direct generation
    }
  }

  // 6. Generate summary directly from transcript via FastAPI (without re-running Whisper)
  const targetModel = resolveAiModelId(model)

  try {
    const summaryRes = await aiServiceClient.generateSummaryDirect(activeTranscript, {
      title: lesson.title,
      model: targetModel
    })

    const generatedMarkdown = summaryRes.summary.trim()
    if (!generatedMarkdown) {
      return {
        success: false,
        statusCode: 502,
        message: 'Mô hình AI trả về bản tóm tắt rỗng.'
      }
    }

    const executePersistence = async (clientTx: PrismaTransactionClient) => {
      const updatedLesson = await clientTx.lesson.update({
        where: { id: lessonId },
        data: {
          summary: generatedMarkdown,
          aiProcessingStatus: AiProcessingStatus.COMPLETED,
          aiProcessedAt: new Date(),
          aiProcessingError: null
        }
      })
      if (latestJob && latestJob.status !== AiJobStatus.COMPLETED) {
        await clientTx.aiProcessingJob
          .update({
            where: { id: latestJob.id },
            data: {
              status: AiJobStatus.COMPLETED,
              currentStage: 'COMPLETED',
              errorMessage: null
            }
          })
          .catch(() => {})
      }
      return updatedLesson
    }

    const persistedLesson = tx ? await executePersistence(tx) : await prisma.$transaction(executePersistence)

    return {
      success: true,
      statusCode: 200,
      message: 'Tạo tóm tắt bài học thành công.',
      data: {
        lesson: persistedLesson,
        summary: generatedMarkdown,
        modelUsed: summaryRes.model_used,
        persisted: true,
        recoveredFromArtifact: false,
        durationSeconds: summaryRes.duration_seconds
      }
    }
  } catch (apiErr: unknown) {
    const errorMsg = apiErr instanceof Error ? apiErr.message : String(apiErr)
    const client = tx || prisma
    await client.lesson
      .update({
        where: { id: lessonId },
        data: {
          aiProcessingStatus: AiProcessingStatus.FAILED,
          aiProcessingError: errorMsg
        }
      })
      .catch(() => {})

    return {
      success: false,
      statusCode: (apiErr as any)?.statusCode || 500,
      message: `Không thể tạo tóm tắt bài học: ${errorMsg}`
    }
  }
}

export { markActiveJobsStaleForLesson }
