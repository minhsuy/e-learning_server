import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import crypto from 'crypto'
import {
  AiJobStatus,
  AiJobType,
  AiProcessingStatus,
  Prisma,
  UserRole
} from '@prisma/client'
import { prisma } from '~/config/prisma'
import { getAiServiceConfig } from '~/config/ai.config'
import {
  AiServiceClient,
  aiServiceClient,
  AiJobStillRunningError,
  AiServiceError,
  FastApiRemoteMediaJobRequest
} from '~/services/aiServiceClient.service'
import {
  createAiJob,
  findActiveAiJobByLessonId,
  findAiJobById,
  findJobsPendingReconciliation,
  updateAiJob
} from '~/repositories/aiJob.repository'
import {
  findLessonById,
  LESSON_STUDY_SELECT
} from '~/repositories/lesson.repository'
import {
  getAiJobDetailService,
  getLatestLessonAiJobService,
  getLessonAiJobsService,
  pollJobStatusService,
  reconcileActiveJobsService,
  triggerLessonAiProcessService
} from '~/services/aiProcessing.service'
import {
  createLessonService,
  getLessonAiContentService,
  getLessonByIdService,
  updateLessonAiContentService,
  updateLessonService
} from '~/services/lesson.service'
import {
  getBunnyConfig,
  resolveBunnyMediaUrl,
  sanitizeUrlForLogging,
  verifyVideoUploadedToBunny
} from '~/services/bunny.service'

/**
 * TMDEMY — STEP 6.6C AUTOMATED VERIFICATION SUITE
 * NODE.JS <-> FASTAPI END-TO-END AI VIDEO PROCESSING INTEGRATION
 * 
 * Verifies:
 * 1. FastAPI Remote Media Client (POST /api/v1/jobs/from-media-source, 202 Accepted, 200 Replay, 409 Conflict, 400 SSRF, 401 Auth, 422 Validation, Timeout)
 * 2. Bunny Stream Video Resolution (MP4 Fallback, Transcoding states, Signed URL generation, Expiration TTL, Error handling)
 * 3. End-to-End AI Job Lifecycle (Queuing, Remote dispatch, Polling, Progress stages, Result persistence)
 * 4. Safe Retry & Idempotency Recovery (Replay with same key and canonical payload hash, Ambiguous timeout recovery)
 * 5. Stale-Result Fencing & Atomic Concurrency Safety (Generation fencing, Atomic conditional update, Stale overwrite rejection)
 * 6. Background Reconciliation & Regression Safety
 */

let totalChecks = 0
let passedChecks = 0
let failedChecks = 0

function assert(condition: boolean, group: string, message: string) {
  totalChecks++
  if (condition) {
    passedChecks++
    console.log(`  PASS: [${group}] ${message}`)
  } else {
    failedChecks++
    console.error(`  FAIL: [${group}] ${message}`)
  }
}

async function runStep6_6CTests() {
  console.log('=================================================================')
  console.log('STARTING TMDEMY STEP 6.6C: END-TO-END AI INTEGRATION TEST SUITE')
  console.log('=================================================================')

  const timestamp = Date.now()

  // --------------------------------------------------------------------------
  // SETUP TEST DATA
  // --------------------------------------------------------------------------
  console.log('\n--- Setting Up Database Test Entities ---')

  const teacherOwner = await prisma.user.create({
    data: {
      username: `s66c_owner_${timestamp}`,
      email: `s66c_owner_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  const teacherOther = await prisma.user.create({
    data: {
      username: `s66c_other_${timestamp}`,
      email: `s66c_other_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  const adminUser = await prisma.user.create({
    data: {
      username: `s66c_admin_${timestamp}`,
      email: `s66c_admin_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.ADMIN
    }
  })

  const studentUser = await prisma.user.create({
    data: {
      username: `s66c_student_${timestamp}`,
      email: `s66c_student_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER
    }
  })

  const testCourse = await prisma.course.create({
    data: {
      title: `Step 6.6C Integration Course ${timestamp}`,
      slug: `step-66c-integration-course-${timestamp}`,
      authorId: teacherOwner.id
    }
  })

  const testChapter = await prisma.chapter.create({
    data: {
      title: `Chapter 1: Media Processing ${timestamp}`,
      courseId: testCourse.id,
      order: 1
    }
  })

  const lessonWithBunnyVideo = await prisma.lesson.create({
    data: {
      title: `Lesson 1: Bunny Stream AI ${timestamp}`,
      slug: `lesson-1-bunny-stream-ai-${timestamp}`,
      chapterId: testChapter.id,
      courseId: testCourse.id,
      authorId: teacherOwner.id,
      duration: 720,
      bunnyVideoId: `bunny-guid-66c-${timestamp}-A`,
      videoStatus: 'READY',
      aiGeneration: 1
    }
  })

  const lessonWithoutVideo = await prisma.lesson.create({
    data: {
      title: `Lesson 2: No Video ${timestamp}`,
      slug: `lesson-2-no-video-${timestamp}`,
      chapterId: testChapter.id,
      courseId: testCourse.id,
      authorId: teacherOwner.id,
      duration: 0,
      aiGeneration: 1
    }
  })

  console.log(`Created fixtures: Course ${testCourse.id}, Lesson 1 ${lessonWithBunnyVideo.id}`)

  // --------------------------------------------------------------------------
  // SUITE 1: FASTAPI REMOTE MEDIA CLIENT (ISOLATED MOCK HTTP SERVER)
  // --------------------------------------------------------------------------
  console.log('\n--- SUITE 1: FastAPI Remote Media Client & Protocol Contract ---')

  const mockPort = 8899
  let lastReceivedHeaders: http.IncomingHttpHeaders = {}
  let lastReceivedMethod = ''
  let lastReceivedUrl = ''
  let lastReceivedBody: any = null
  let mockStatusCode = 202
  let mockResponseBody: any = {}

  const mockServer = http.createServer((req, res) => {
    lastReceivedMethod = req.method || ''
    lastReceivedUrl = req.url || ''
    lastReceivedHeaders = req.headers

    let rawBody = ''
    req.on('data', (chunk) => {
      rawBody += chunk
    })
    req.on('end', () => {
      try {
        lastReceivedBody = rawBody ? JSON.parse(rawBody) : null
      } catch {
        lastReceivedBody = rawBody
      }

      res.writeHead(mockStatusCode, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(mockResponseBody))
    })
  })

  await new Promise<void>((resolve) => {
    mockServer.listen(mockPort, () => resolve())
  })

  const mockClient = new AiServiceClient(`http://127.0.0.1:${mockPort}`, 2000)

  try {
    // 1. Successful 202 Accepted submission
    mockStatusCode = 202
    mockResponseBody = {
      job_id: 'fastapi-job-uuid-1111',
      status: 'QUEUED',
      message: 'Media processing job accepted and queued',
      is_replay: false,
      idempotency_key: 'idem-key-1'
    }

    const payload1: FastApiRemoteMediaJobRequest = {
      mediaUrl: 'https://vz-test.b-cdn.net/video-1/play_720p.mp4',
      sourceType: 'bunny_stream',
      title: 'Test Lecture',
      lessonId: lessonWithBunnyVideo.id,
      sourceGeneration: 1,
      sourceVideoId: 'video-1'
    }

    const res202 = await mockClient.createRemoteMediaJob(payload1, 'idem-key-1')
    assert(res202.job_id === 'fastapi-job-uuid-1111', 'Suite 1', '1a. Successful 202 returns job_id')
    assert(res202.is_replay === false, 'Suite 1', '1b. is_replay is false for new submission')
    assert(lastReceivedMethod === 'POST', 'Suite 1', '1c. Method is POST')
    assert(lastReceivedUrl === '/api/v1/jobs/from-media-source', 'Suite 1', '1d. Endpoint is /api/v1/jobs/from-media-source')
    assert(lastReceivedHeaders['idempotency-key'] === 'idem-key-1', 'Suite 1', '1e. Idempotency-Key header attached')
    assert(lastReceivedHeaders['x-api-key'] !== undefined, 'Suite 1', '1f. X-API-Key header attached')

    // 2. Successful 200 OK idempotent replay
    mockStatusCode = 200
    mockResponseBody = {
      job_id: 'fastapi-job-uuid-1111',
      status: 'QUEUED',
      message: 'Idempotent replay: Job đã tồn tại và đang được xử lý hoặc đã hoàn thành',
      is_replay: true,
      idempotency_key: 'idem-key-1'
    }

    const res200 = await mockClient.createRemoteMediaJob(payload1, 'idem-key-1')
    assert(res200.job_id === 'fastapi-job-uuid-1111', 'Suite 1', '2a. Idempotent replay returns same job_id')
    assert(res200.is_replay === true, 'Suite 1', '2b. is_replay is true for replayed request')

    // 3. 409 Conflict: idempotency key reused with different payload
    mockStatusCode = 409
    mockResponseBody = {
      detail: "Idempotency-Key 'idem-key-1' đã được sử dụng với nội dung payload khác."
    }

    let conflictCaught = false
    try {
      await mockClient.createRemoteMediaJob(
        { ...payload1, mediaUrl: 'https://vz-test.b-cdn.net/video-DIFF/play_720p.mp4' },
        'idem-key-1'
      )
    } catch (err: unknown) {
      conflictCaught = true
      assert(err instanceof AiServiceError, 'Suite 1', '3a. Throws typed AiServiceError on 409')
      assert((err as AiServiceError).statusCode === 409, 'Suite 1', '3b. Status code is 409')
      assert((err as Error).message.includes('Idempotency-Key'), 'Suite 1', '3c. Error detail preserved')
      assert(!(err as AiServiceError).isRetryable, 'Suite 1', '3d. 409 conflict is not retryable')
    }
    assert(conflictCaught, 'Suite 1', '3e. 409 conflict rejected')

    // 4. 400 Bad Request: SSRF violation (untrusted domain or private IP)
    mockStatusCode = 400
    mockResponseBody = {
      detail: "Tên miền 'malicious-host.com' không nằm trong danh sách máy chủ Bunny/CDN được tin cậy."
    }

    let ssrfCaught = false
    try {
      await mockClient.createRemoteMediaJob(
        { ...payload1, mediaUrl: 'https://malicious-host.com/video.mp4' },
        'idem-key-ssrf'
      )
    } catch (err: unknown) {
      ssrfCaught = true
      assert((err as AiServiceError).statusCode === 400, 'Suite 1', '4a. SSRF error returns 400')
      assert((err as Error).message.includes('không nằm trong danh sách'), 'Suite 1', '4b. SSRF rejection detail returned')
      assert(!(err as AiServiceError).isRetryable, 'Suite 1', '4c. SSRF error is not retryable')
    }
    assert(ssrfCaught, 'Suite 1', '4d. SSRF protection confirmed')

    // 5. 401 Unauthorized: Invalid X-API-Key
    mockStatusCode = 401
    mockResponseBody = { detail: 'API Key không hợp lệ hoặc bị thiếu' }

    let auth401Caught = false
    try {
      await mockClient.createRemoteMediaJob(payload1, 'idem-key-auth')
    } catch (err: unknown) {
      auth401Caught = true
      assert((err as AiServiceError).statusCode === 401, 'Suite 1', '5a. Auth error returns 401')
      assert(!(err as AiServiceError).isRetryable, 'Suite 1', '5b. 401 is not retryable')
    }
    assert(auth401Caught, 'Suite 1', '5c. 401 auth rejection confirmed')

    // 6. 422 Unprocessable Entity: Schema validation failure
    mockStatusCode = 422
    mockResponseBody = {
      detail: [{ loc: ['body', 'mediaUrl'], msg: 'field required', type: 'value_error.missing' }]
    }

    let val422Caught = false
    try {
      await mockClient.createRemoteMediaJob(payload1, 'idem-key-val')
    } catch (err: unknown) {
      val422Caught = true
      assert((err as AiServiceError).statusCode === 422, 'Suite 1', '6a. Schema validation error returns 422')
    }
    assert(val422Caught, 'Suite 1', '6b. 422 validation failure confirmed')

    // 7. Network timeout handling
    const hangingPort = 8898
    const hangingServer = http.createServer((_req, _res) => {
      // Intentionally never respond to trigger AbortController timeout
    })
    await new Promise<void>((r) => hangingServer.listen(hangingPort, () => r()))

    const timeoutClient = new AiServiceClient(`http://127.0.0.1:${hangingPort}`, 500)
    let timeoutCaught = false
    try {
      await timeoutClient.createRemoteMediaJob(payload1, 'idem-key-timeout')
    } catch (err: unknown) {
      timeoutCaught = true
      assert(err instanceof AiServiceError, 'Suite 1', '7a. Timeout throws AiServiceError')
      assert((err as AiServiceError).statusCode === 504, 'Suite 1', '7b. Timeout status is 504')
      assert((err as AiServiceError).isRetryable === true, 'Suite 1', '7c. Timeout is retryable')
    }
    assert(timeoutCaught, 'Suite 1', '7d. Timeout boundary enforced via AbortController')
    hangingServer.close()

    // 8. Sanitization: No signed URL credentials or token query parameters in logs
    const sensitiveUrl = 'https://vz-test.b-cdn.net/video.mp4?token=super_secret_token_12345&expires=1799999999'
    const sanitized = sanitizeUrlForLogging(sensitiveUrl)
    assert(!sanitized.includes('super_secret_token_12345'), 'Suite 1', '8a. Token query stripped by sanitizeUrlForLogging')
    assert(!sanitized.includes('expires='), 'Suite 1', '8b. Expiry query stripped')
    assert(sanitized === 'https://vz-test.b-cdn.net/video.mp4', 'Suite 1', '8c. Clean base URL preserved')

    // ========================================================================
    // SUITE 2: BUNNY STREAM VIDEO RESOLUTION & TOKEN AUTHENTICATION
    // ========================================================================
    console.log('\n--- SUITE 2: Bunny Stream Video Resolution & Token Signing ---')

    // 9. Valid Bunny video resolution
    const resolvedVideo = await resolveBunnyMediaUrl(`test-video-uuid-${timestamp}`, {
      expiresInSeconds: 14400,
      preferredResolution: '720p'
    })
    assert(resolvedVideo.sourceType === 'bunny_stream', 'Suite 2', '9a. Source type is bunny_stream')
    assert(resolvedVideo.mediaUrl.includes('.b-cdn.net'), 'Suite 2', '9b. Resolved URL points to Bunny CDN host')
    assert(resolvedVideo.mediaUrl.includes('play_720p.mp4'), 'Suite 2', '9c. Direct MP4 rendition is targeted (no m3u8)')
    assert(resolvedVideo.duration > 0, 'Suite 2', '9d. Video duration resolved')

    // 10. Signed URL and Token Expiry
    if (resolvedVideo.expiresAt) {
      const nowSec = Math.floor(Date.now() / 1000)
      const expSec = Math.floor(resolvedVideo.expiresAt.getTime() / 1000)
      const diffSec = expSec - nowSec
      assert(diffSec >= 14300 && diffSec <= 14500, 'Suite 2', '10a. Signed token expiration TTL is ~4 hours (14400s)')
      assert(resolvedVideo.mediaUrl.includes('token=') && resolvedVideo.mediaUrl.includes('expires='), 'Suite 2', '10b. URL has signed token and expires parameters')
    } else {
      // If BUNNY_TOKEN_SECURITY_KEY is not configured in test env, verify unsigned URL is clean
      assert(!resolvedVideo.mediaUrl.includes('token='), 'Suite 2', '10a. Unsigned URL is clean without token')
    }

    // 11. Empty or invalid Video ID rejected
    let emptyIdCaught = false
    try {
      await resolveBunnyMediaUrl('')
    } catch {
      emptyIdCaught = true
    }
    assert(emptyIdCaught, 'Suite 2', '11. Empty videoId is strictly rejected')

    // ========================================================================
    // SUITE 3: END-TO-END AI JOB LIFECYCLE & RESULTS PERSISTENCE
    // ========================================================================
    console.log('\n--- SUITE 3: End-to-End AI Job Lifecycle & Result Persistence ---')

    // Point active aiServiceClient singleton to our mock server for integration tests
    aiServiceClient.setBaseUrl(`http://127.0.0.1:${mockPort}`)

    // 12. Trigger AI job with Bunny video: creates local job and calls FastAPI
    mockStatusCode = 202
    mockResponseBody = {
      job_id: `fastapi-e2e-job-${timestamp}`,
      status: 'QUEUED',
      message: 'Media processing job accepted and queued',
      is_replay: false,
      idempotency_key: ''
    }

    const triggerRes = await triggerLessonAiProcessService({
      lessonId: lessonWithBunnyVideo.id,
      userId: teacherOwner.id,
      role: UserRole.TEACHER,
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE
    })

    assert(triggerRes.success, 'Suite 3', '12a. triggerLessonAiProcessService succeeds')
    assert(triggerRes.statusCode === 202, 'Suite 3', '12b. Returns 202 Accepted')
    assert(triggerRes.data?.status === AiJobStatus.QUEUED, 'Suite 3', '12c. Local job status is QUEUED')
    assert(triggerRes.data?.providerJobId === `fastapi-e2e-job-${timestamp}`, 'Suite 3', '12d. providerJobId recorded from FastAPI')
    assert(triggerRes.data?.generation === 1, 'Suite 3', '12e. Job generation matches Lesson aiGeneration (1)')
    assert(triggerRes.data?.videoId === lessonWithBunnyVideo.bunnyVideoId, 'Suite 3', '12f. Job videoId matches Lesson bunnyVideoId')

    const jobId = triggerRes.data!.id

    // 13. Poll status: DOWNLOADING_MEDIA stage
    mockStatusCode = 200
    mockResponseBody = {
      job_id: `fastapi-e2e-job-${timestamp}`,
      status: 'RUNNING',
      current_stage: 'DOWNLOADING_MEDIA',
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString()
    }

    const pollStage1 = await pollJobStatusService(jobId)
    assert(pollStage1.success, 'Suite 3', '13a. Polling succeeds')
    assert(pollStage1.data?.status === AiJobStatus.RUNNING, 'Suite 3', '13b. Job status is RUNNING')
    assert(pollStage1.data?.currentStage === 'DOWNLOADING_MEDIA', 'Suite 3', '13c. currentStage maps DOWNLOADING_MEDIA')

    // 14. Poll status: VALIDATING_MEDIA & EXTRACTING_AUDIO stages
    mockResponseBody.current_stage = 'EXTRACTING_AUDIO'
    const pollStage2 = await pollJobStatusService(jobId)
    assert(pollStage2.data?.currentStage === 'EXTRACTING_AUDIO', 'Suite 3', '14. currentStage maps EXTRACTING_AUDIO')

    // 15. Poll status: TRANSCRIBING & SUMMARIZING stages
    mockResponseBody.current_stage = 'SUMMARIZING'
    const pollStage3 = await pollJobStatusService(jobId)
    assert(pollStage3.data?.currentStage === 'SUMMARIZING', 'Suite 3', '15. currentStage maps SUMMARIZING')

    // 16. Poll status: COMPLETED & Atomic Result Persistence
    mockResponseBody = {
      job_id: `fastapi-e2e-job-${timestamp}`,
      status: 'COMPLETED',
      current_stage: 'COMPLETED',
      created_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    }

    // Prepare mock result response for GET /result
    const expectedTranscript = '# BÀI GIẢNG: BUNNY STREAM AI INTEGRATION\n[00:00:00.00] Xin chào các bạn...'
    const expectedSummary = '# TỔNG QUAN BÀI HỌC\n## 1. Kiến thức cốt lõi\n- Quy trình nạp media Bunny Stream...'

    // Update mock server to route GET /result
    mockServer.removeAllListeners('request')
    mockServer.on('request', (req, res) => {
      const url = req.url || ''
      if (url.includes('/result')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            job_id: `fastapi-e2e-job-${timestamp}`,
            status: 'COMPLETED',
            transcript: expectedTranscript,
            summary: expectedSummary,
            metadata: {
              language: 'vi',
              duration_seconds: 35.5,
              stage_durations: {
                downloading_media: 2.1,
                extracting_audio: 1.4,
                transcribing: 22.0,
                summarizing: 10.0
              }
            }
          })
        )
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            job_id: `fastapi-e2e-job-${timestamp}`,
            status: 'COMPLETED',
            current_stage: 'COMPLETED',
            created_at: new Date().toISOString(),
            finished_at: new Date().toISOString()
          })
        )
      }
    })

    const pollComplete = await pollJobStatusService(jobId)
    assert(pollComplete.success, 'Suite 3', '16a. Polling completion succeeds')
    assert(pollComplete.data?.status === AiJobStatus.COMPLETED, 'Suite 3', '16b. Job status is COMPLETED')

    // 17. Verify database fields on Lesson
    const updatedLesson = await findLessonById(lessonWithBunnyVideo.id)
    assert(updatedLesson?.transcript === expectedTranscript, 'Suite 3', '17a. Transcript persisted in Lesson')
    assert(updatedLesson?.summary === expectedSummary, 'Suite 3', '17b. Summary persisted in Lesson')
    assert(updatedLesson?.aiProcessingStatus === AiProcessingStatus.COMPLETED, 'Suite 3', '17c. aiProcessingStatus is COMPLETED')
    assert(!!updatedLesson?.aiProcessedAt, 'Suite 3', '17d. aiProcessedAt timestamp populated')
    assert(updatedLesson?.aiProcessingError === null, 'Suite 3', '17e. aiProcessingError is null on success')

    // 18. Idempotent polling: Repeated poll on COMPLETED does not trigger side-effects
    const repeatPoll = await pollJobStatusService(jobId)
    assert(repeatPoll.success, 'Suite 3', '18a. Repeat poll returns success immediately')
    assert(repeatPoll.data?.status === AiJobStatus.COMPLETED, 'Suite 3', '18b. Status remains COMPLETED')

    // ========================================================================
    // SUITE 4: SAFE RETRY & IDEMPOTENCY RECOVERY
    // ========================================================================
    console.log('\n--- SUITE 4: Safe Retry & Idempotency Recovery ---')

    const recoveryLesson = await prisma.lesson.create({
      data: {
        title: `Recovery Lesson ${timestamp}`,
        slug: `recovery-lesson-${timestamp}`,
        chapterId: testChapter.id,
        courseId: testCourse.id,
        authorId: teacherOwner.id,
        duration: 300,
        bunnyVideoId: `bunny-guid-recovery-${timestamp}`,
        videoStatus: 'READY',
        aiGeneration: 1
      }
    })

    // Simulate ambiguous timeout scenario:
    // Client sent job, but server timed out or hung before returning 202
    // Local job was created in SUBMITTING status with stored canonical submissionPayload
    const initialJob = await createAiJob({
      lesson: { connect: { id: recoveryLesson.id } },
      course: { connect: { id: testCourse.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.SUBMITTING,
      generation: 1,
      videoId: recoveryLesson.bunnyVideoId,
      currentStage: 'SUBMISSION_PENDING_RETRY',
      rawMetadata: {
        submissionPayload: {
          mediaUrl: 'https://vz-test.b-cdn.net/recovery/play_720p.mp4?token=abc&expires=1799999999',
          sourceType: 'bunny_stream',
          idempotencyKey: 'will-be-overwritten-by-job-id',
          title: recoveryLesson.title,
          lessonId: recoveryLesson.id,
          sourceGeneration: 1,
          sourceVideoId: recoveryLesson.bunnyVideoId
        }
      }
    })

    // Fix idempotencyKey to match job id
    const fixedPayload = {
      ...(initialJob.rawMetadata as any).submissionPayload,
      idempotencyKey: initialJob.id
    }
    await updateAiJob(initialJob.id, {
      rawMetadata: {
        submissionPayload: fixedPayload
      }
    })

    // Setup mock server to receive the recovery retry and respond with 200 OK replay
    let recoveryCallCount = 0
    let receivedRecoveryIdempotencyKey = ''
    mockServer.removeAllListeners('request')
    mockServer.on('request', (req, res) => {
      recoveryCallCount++
      receivedRecoveryIdempotencyKey = (req.headers['idempotency-key'] as string) || ''

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          job_id: `recovered-fastapi-job-${timestamp}`,
          status: 'QUEUED',
          message: 'Idempotent replay: Job đã tồn tại và đang được xử lý hoặc đã hoàn thành',
          is_replay: true,
          idempotency_key: receivedRecoveryIdempotencyKey
        })
      )
    })

    // 19. Recover ambiguous submission via pollJobStatusService
    const recoveryResult = await pollJobStatusService(initialJob.id)
    assert(recoveryResult.success, 'Suite 4', '19a. Polling job in SUBMITTING recovers submission')
    assert(recoveryCallCount === 1, 'Suite 4', '19b. Exactly one recovery HTTP call made')
    assert(receivedRecoveryIdempotencyKey === initialJob.id, 'Suite 4', '19c. Reused exact same Idempotency-Key (job.id)')
    assert(recoveryResult.data?.status === AiJobStatus.QUEUED, 'Suite 4', '19d. Job advanced to QUEUED')
    assert(recoveryResult.data?.providerJobId === `recovered-fastapi-job-${timestamp}`, 'Suite 4', '19e. Acquired remote providerJobId from replay')

    // ========================================================================
    // SUITE 5: CONCURRENCY, GENERATION FENCING & STALE OVERWRITE DEFENSE
    // ========================================================================
    console.log('\n--- SUITE 5: Stale-Job Fencing & Atomic Concurrency Safety ---')

    const fencingLesson = await prisma.lesson.create({
      data: {
        title: `Fencing Lesson ${timestamp}`,
        slug: `fencing-lesson-${timestamp}`,
        chapterId: testChapter.id,
        courseId: testCourse.id,
        authorId: teacherOwner.id,
        duration: 500,
        bunnyVideoId: `bunny-guid-fencing-${timestamp}-VideoA`,
        videoStatus: 'READY',
        transcript: 'Original Video A Transcript',
        summary: 'Original Video A Summary',
        aiGeneration: 1
      }
    })

    // Job 1 created for Video A with generation = 1
    const jobVideoA = await createAiJob({
      lesson: { connect: { id: fencingLesson.id } },
      course: { connect: { id: testCourse.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.RUNNING,
      providerJobId: `fastapi-video-a-${timestamp}`,
      generation: 1,
      videoId: `bunny-guid-fencing-${timestamp}-VideoA`,
      currentStage: 'TRANSCRIBING'
    })

    // Teacher replaces Video A with Video B
    // In TMdemy, updating bunnyVideoId increments aiGeneration and marks active jobs STALE
    await updateLessonService({
      lessonId: fencingLesson.id,
      payload: {
        bunnyVideoId: `bunny-guid-fencing-${timestamp}-VideoB`
      },
      userId: teacherOwner.id,
      role: UserRole.TEACHER
    })

    const lessonAfterVideoB = await findLessonById(fencingLesson.id)
    assert(lessonAfterVideoB?.aiGeneration === 2, 'Suite 5', '20a. Video replacement automatically increments aiGeneration to 2')
    assert(lessonAfterVideoB?.bunnyVideoId === `bunny-guid-fencing-${timestamp}-VideoB`, 'Suite 5', '20b. Video B attached to Lesson')

    const priorJob = await findAiJobById(jobVideoA.id)
    assert(priorJob?.status === AiJobStatus.STALE, 'Suite 5', '20c. Prior active job automatically transitioned to STALE on video update')

    // 21. Simulate late-arriving completion from an old generation job that attempts completion
    const lateJobOldGen = await createAiJob({
      lesson: { connect: { id: fencingLesson.id } },
      course: { connect: { id: testCourse.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.RUNNING,
      providerJobId: `fastapi-late-video-a-${timestamp}`,
      generation: 1, // OLD GENERATION (Lesson is on generation 2)
      videoId: `bunny-guid-fencing-${timestamp}-VideoA`, // OLD VIDEO
      currentStage: 'TRANSCRIBING'
    })

    // Mock server returns completed result for Video A
    mockServer.removeAllListeners('request')
    mockServer.on('request', (req, res) => {
      const url = req.url || ''
      if (url.includes('/result')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            job_id: `fastapi-late-video-a-${timestamp}`,
            status: 'COMPLETED',
            transcript: 'STALE VIDEO A TRANSCRIPT THAT MUST NEVER PERSIST',
            summary: 'STALE VIDEO A SUMMARY THAT MUST NEVER PERSIST'
          })
        )
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            job_id: `fastapi-late-video-a-${timestamp}`,
            status: 'COMPLETED',
            current_stage: 'COMPLETED',
            created_at: new Date().toISOString()
          })
        )
      }
    })

    // Poll late job: executePersistence discovers generation/video mismatch
    const stalePollRes = await pollJobStatusService(lateJobOldGen.id)
    assert(stalePollRes.success, 'Suite 5', '21a. Late stale poll returns gracefully')
    assert(stalePollRes.data?.status === AiJobStatus.STALE, 'Suite 5', '21b. Late job Video A is marked STALE')
    assert(stalePollRes.data?.currentStage === 'STALE_OVERWRITTEN', 'Suite 5', '21c. currentStage is STALE_OVERWRITTEN')

    // 22. CRITICAL: Verify Video A NEVER overwrote Lesson data
    const finalLessonCheck = await findLessonById(fencingLesson.id)
    assert(finalLessonCheck?.transcript !== 'STALE VIDEO A TRANSCRIPT THAT MUST NEVER PERSIST', 'Suite 5', '22a. Stale transcript was NOT written')
    assert(finalLessonCheck?.summary !== 'STALE VIDEO A SUMMARY THAT MUST NEVER PERSIST', 'Suite 5', '22b. Stale summary was NOT written')
    assert(finalLessonCheck?.bunnyVideoId === `bunny-guid-fencing-${timestamp}-VideoB`, 'Suite 5', '22c. Video B identity strictly preserved')

    // 23. Concurrency check: Duplicate active request rejected with 409
    // Create an active job in QUEUED for lessonWithBunnyVideo
    const activeTestJob = await createAiJob({
      lesson: { connect: { id: lessonWithBunnyVideo.id } },
      course: { connect: { id: testCourse.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.QUEUED,
      providerJobId: `active-job-check-${timestamp}`,
      generation: 1,
      videoId: lessonWithBunnyVideo.bunnyVideoId
    })

    const duplicateTrigger = await triggerLessonAiProcessService({
      lessonId: lessonWithBunnyVideo.id,
      userId: teacherOwner.id,
      role: UserRole.TEACHER
    })
    assert(!duplicateTrigger.success, 'Suite 5', '23a. Duplicate active request is rejected')
    assert(duplicateTrigger.statusCode === 409, 'Suite 5', '23b. Returns 409 Conflict')
    assert(duplicateTrigger.data?.id === activeTestJob.id, 'Suite 5', '23c. Identifies existing active job')

    // Clean up activeTestJob
    await updateAiJob(activeTestJob.id, { status: AiJobStatus.COMPLETED })

    // ========================================================================
    // SUITE 6: BACKGROUND RECONCILIATION & RECOVERY OVER RESTARTS
    // ========================================================================
    console.log('\n--- SUITE 6: Background Reconciliation & Recovery ---')

    // 24. reconcileActiveJobsService executes bounded batch
    const reconSummary = await reconcileActiveJobsService(10)
    assert(reconSummary.processed >= 0, 'Suite 6', '24a. reconcileActiveJobsService runs cleanly')
    assert(typeof reconSummary.completed === 'number', 'Suite 6', '24b. Reports completed count')
    assert(typeof reconSummary.failed === 'number', 'Suite 6', '24c. Reports failed count')

    // 25. FastAPI 404 handling: Server restart recovery
    const orphanJob = await createAiJob({
      lesson: { connect: { id: lessonWithBunnyVideo.id } },
      course: { connect: { id: testCourse.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.RUNNING,
      providerJobId: `orphan-job-${timestamp}`,
      generation: 1
    })

    mockServer.removeAllListeners('request')
    mockServer.on('request', (_req, res) => {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ detail: 'Job not found' }))
    })

    const orphanPoll = await pollJobStatusService(orphanJob.id)
    assert(!orphanPoll.success, 'Suite 6', '25a. 404 returns not found')
    assert(orphanPoll.data?.status === AiJobStatus.FAILED, 'Suite 6', '25b. Job marked FAILED')
    assert(orphanPoll.data?.currentStage === 'NOT_FOUND_ON_PROVIDER', 'Suite 6', '25c. Stage marked NOT_FOUND_ON_PROVIDER')
    assert(orphanPoll.data?.errorMessage?.includes('not found on AI microservice'), 'Suite 6', '25d. Clear restart error message stored')

  } finally {
    mockServer.close()
    // Restore default client URL
    aiServiceClient.setBaseUrl(undefined)

    // ------------------------------------------------------------------------
    // CLEANUP DATABASE TEST FIXTURES
    // ------------------------------------------------------------------------
    console.log('\n--- Cleaning Up Database Test Fixtures ---')
    try {
      await prisma.aiProcessingJob.deleteMany({
        where: { courseId: testCourse.id }
      })
      await prisma.lesson.deleteMany({
        where: { courseId: testCourse.id }
      })
      await prisma.chapter.deleteMany({
        where: { courseId: testCourse.id }
      })
      await prisma.course.delete({
        where: { id: testCourse.id }
      })
      await prisma.user.deleteMany({
        where: {
          id: { in: [teacherOwner.id, teacherOther.id, adminUser.id, studentUser.id] }
        }
      })
      console.log('Test fixtures cleaned up successfully.')
    } catch (cleanupErr) {
      console.warn('Warning during cleanup:', cleanupErr)
    }
  }

  console.log('\n=================================================================')
  console.log(`STEP 6.6C VERIFICATION COMPLETE: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`)
  console.log('=================================================================\n')

  if (failedChecks > 0) {
    process.exit(1)
  }
}

runStep6_6CTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err)
  process.exit(1)
})
