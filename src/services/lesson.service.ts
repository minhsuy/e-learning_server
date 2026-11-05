import { AiProcessingStatus, LessonType, Prisma } from '@prisma/client'
import slugify from 'slugify'
import { PrismaTransactionClient } from '~/config/prisma'
import {
  findActiveEnrolledUserIdsByCourseId,
  findEnrollmentByUserAndCourse
} from '~/repositories/enrollment.repository'
import { findChapterById } from '~/repositories/chapter.repository'
import { findCourseById } from '~/repositories/course.repository'
import {
  addLesson,
  deleteLesson,
  findLessonById,
  findLessonsByChapter,
  findMaxLessonOrderByChapter,
  isLessonSlugTakenInCourse,
  LESSON_STUDY_SELECT,
  updateLesson,
  updateLessonAiContent
} from '~/repositories/lesson.repository'
import { ENotificationType, UserRole } from '~/types/enum'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { pushNotificationService } from './notification.service'
import {
  CreateLessonInput,
  UpdateLessonAiContentInput,
  updateLessonAiContentInputSchema,
  UpdateLessonInput
} from '~/models/lesson.model'
import {
  deleteBunnyVideo,
  generatePlaybackInfo,
  getBunnyConfig,
  verifyVideoUploadedToBunny
} from './bunny.service'
import {
  countLessonsUsingBunnyVideoId,
  deleteVideoUploadRecord,
  findLessonByBunnyVideoId,
  updateVideoUploadStatus
} from '~/repositories/video.repository'
import {
  findActiveAiJobByLessonId,
  markActiveJobsStaleForLesson
} from '~/repositories/aiJob.repository'
import {
  autoTriggerLessonAiSummaryIfNeeded,
  pollJobStatusService
} from './aiProcessing.service'

/**
 * Checks if a string is a 24-character hexadecimal MongoDB ObjectId.
 */
function isLegacyObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * Maps incoming lesson type to Prisma LessonType enum.
 */
export function toPrismaLessonType(type?: string): LessonType {
  if (!type) return LessonType.VIDEO
  const upper = String(type).toUpperCase()
  if (upper === 'TEXT') return LessonType.TEXT
  return LessonType.VIDEO
}

/**
 * Normalizes a lesson object into backward-compatible response data.
 * Enhances response with Bunny Stream playback URLs when bunnyVideoId is present.
 * Strictly redacts internal operational fields like aiProcessingError from public/student payloads.
 */
function formatSafeLesson(lesson: any, includePrivateFields = false) {
  if (!lesson) return null

  let playback = null
  if (lesson.bunnyVideoId) {
    try {
      playback = generatePlaybackInfo(lesson.bunnyVideoId, lesson.videoStatus || 'READY')
    } catch {
      // Graceful fallback if Bunny env vars not configured in test
    }
  }

  const safeData: any = {
    ...withCompatId(lesson),
    chapter: lesson.chapterId || lesson.chapter,
    course: lesson.courseId || lesson.course,
    author: lesson.authorId || lesson.author,
    playback
  }

  if (!includePrivateFields) {
    delete safeData.aiProcessingError
    delete safeData.transcriptOriginal
    delete safeData.transcriptRefined
  }

  return safeData
}

// CREATE LESSON
export const createLessonService = async (
  {
    payload,
    userId,
    role
  }: {
    payload: (Partial<CreateLessonInput> & { chapter?: string; course?: string }) | Record<string, any>
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  const {
    title,
    chapter,
    course,
    type = LessonType.VIDEO,
    duration = 0,
    content = '',
    isDemo = false,
    videoUrl = ''
  } = payload

  if (!course || (!isValidUUID(course) && !isLegacyObjectId(course))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const courseDoc = await findCourseById(course, tx)
  if (!courseDoc) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if ((role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && courseDoc.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  if (!chapter || (!isValidUUID(chapter) && !isLegacyObjectId(chapter))) {
    return { success: false, statusCode: 400, message: 'Invalid chapter ID' }
  }

  const chapterDoc = await findChapterById(chapter, tx)
  if (!chapterDoc) {
    return { success: false, statusCode: 404, message: 'Chapter not found' }
  }

  // Cross-entity integrity check: Chapter must belong to the specified Course
  if (chapterDoc.courseId !== course) {
    return { success: false, statusCode: 400, message: 'Chapter does not belong to the specified course' }
  }

  let slug = slugify(title, { lower: true, strict: true })
  const exists = await isLessonSlugTakenInCourse(slug, course, undefined, tx)
  if (exists) {
    slug = `${slug}-${Date.now().toString(16).slice(2)}`
  }

  let finalOrder = payload.order
  if (finalOrder === undefined) {
    const lastOrder = await findMaxLessonOrderByChapter(chapter, tx)
    finalOrder = lastOrder + 1
  }

  let finalDuration = Number(duration || 0)
  let finalVideoStatus: string | null = null
  let finalVideoUrl = videoUrl || ''
  const cleanBunnyId = payload.bunnyVideoId ? String(payload.bunnyVideoId).trim() : null

  if (cleanBunnyId) {
    // 1. Verify that no other lesson is already using this Bunny Video GUID
    const existingWithBunny = await findLessonByBunnyVideoId(cleanBunnyId, tx)
    if (existingWithBunny) {
      return {
        success: false,
        statusCode: 409,
        message: 'Bunny Video ID đã được gắn với một bài học khác'
      }
    }

    // 2. Verify with Bunny Stream API that video belongs to library and was uploaded
    try {
      const bunnyVerification = await verifyVideoUploadedToBunny(cleanBunnyId)
      if (!bunnyVerification.uploaded) {
        return {
          success: false,
          statusCode: 400,
          message:
            'Video chưa hoàn thành tải lên (TUS upload not completed). Vui lòng hoàn tất tải video trước khi tạo bài học.'
        }
      }

      finalVideoStatus = bunnyVerification.status
      if (finalDuration === 0 && bunnyVerification.duration > 0) {
        finalDuration = bunnyVerification.duration
      }

      if (!finalVideoUrl) {
        try {
          const { cdnHostname } = getBunnyConfig()
          finalVideoUrl = `https://${cdnHostname}/${cleanBunnyId}/playlist.m3u8`
        } catch {
          finalVideoUrl = `https://vz-test-cdn.b-cdn.net/${cleanBunnyId}/playlist.m3u8`
        }
      }

      // Sync status to VideoUpload tracking record if present
      await updateVideoUploadStatus(
        cleanBunnyId,
        {
          status: finalVideoStatus,
          duration: finalDuration
        },
        tx
      ).catch(() => {})
    } catch (bunnyErr: unknown) {
      const msg = bunnyErr instanceof Error ? bunnyErr.message : 'Lỗi xác thực video Bunny Stream'
      return {
        success: false,
        statusCode: 400,
        message: msg
      }
    }
  }

  const resolvedLessonType = toPrismaLessonType(type)
  const hasExternalVideo =
    !cleanBunnyId &&
    resolvedLessonType === LessonType.VIDEO &&
    Boolean(finalVideoUrl && (finalVideoUrl.startsWith('https://') || finalVideoUrl.startsWith('http://')))

  // Step 7H: Determine initial aiProcessingStatus for newly created video lessons
  let initialAiStatus: AiProcessingStatus | null = null
  if (cleanBunnyId) {
    initialAiStatus =
      finalVideoStatus === 'READY' ? AiProcessingStatus.PROCESSING : AiProcessingStatus.PENDING
  } else if (hasExternalVideo) {
    initialAiStatus = AiProcessingStatus.PROCESSING
  }

  const lesson = await addLesson(
    {
      title,
      slug,
      order: finalOrder,
      duration: finalDuration,
      type: resolvedLessonType,
      content: content || '',
      isDemo: Boolean(isDemo),
      videoUrl: finalVideoUrl,
      bunnyVideoId: cleanBunnyId,
      videoStatus: finalVideoStatus,
      aiProcessingStatus: initialAiStatus,
      chapter: { connect: { id: chapter } },
      course: { connect: { id: course } },
      author: { connect: { id: userId } }
    },
    tx
  )

  // Step 7H: Automatically trigger AI transcription & summarization asynchronously
  // ONLY when the newly created lesson has a video asset.
  if (cleanBunnyId || hasExternalVideo) {
    autoTriggerLessonAiSummaryIfNeeded(lesson.id, userId, role).catch((aiErr) => {
      console.warn(
        `[CreateLesson Auto-AI-Summary] Non-blocking notice for lesson ${lesson.id}:`,
        aiErr?.message || aiErr
      )
    })
  }

  // Non-blocking notification dispatch to active enrolled students
  try {
    const enrolledUserIds = await findActiveEnrolledUserIdsByCourseId(course)
    for (const studentId of enrolledUserIds) {
      if (studentId === userId) {
        continue
      }
      try {
        await pushNotificationService({
          senderId: userId,
          receiverId: studentId,
          type: ENotificationType.LESSON,
          message: `Có bài học mới "${lesson.title}" trong khóa học "${courseDoc.title}"`,
          relatedId: lesson.id,
          metadata: {
            courseId: courseDoc.id,
            courseSlug: courseDoc.slug,
            lessonId: lesson.id
          }
        })
      } catch (notifErr) {
        console.warn(`[Lesson Notification Dispatch Error to student ${studentId}]:`, notifErr)
      }
    }
  } catch (err) {
    console.warn('[Lesson Notification Query Error]:', err)
  }

  return {
    success: true,
    message: 'Lesson created successfully!',
    data: formatSafeLesson(lesson)
  }
}

// UPDATE LESSON
export const updateLessonService = async (
  {
    lessonId,
    payload,
    userId,
    role
  }: {
    lessonId: string
    payload: (UpdateLessonInput & { chapter?: string; bunnyVideoId?: string | null }) | Record<string, any>
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!lessonId || (!isValidUUID(lessonId) && !isLegacyObjectId(lessonId))) {
    return { success: false, statusCode: 400, message: 'Invalid lesson ID' }
  }

  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = await findCourseById(lesson.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if ((role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const updateData: Prisma.LessonUpdateInput = {}
  let shouldAutoTriggerAi = false

  if (payload.chapter && payload.chapter !== lesson.chapterId) {
    const newChapter = await findChapterById(payload.chapter, tx)
    if (!newChapter) {
      return { success: false, statusCode: 404, message: 'Chapter not found' }
    }
    if (newChapter.courseId !== lesson.courseId) {
      return { success: false, statusCode: 400, message: 'Chapter does not belong to the specified course' }
    }
    updateData.chapter = { connect: { id: payload.chapter } }
  }

  if (payload.title) {
    updateData.title = payload.title
    let newSlug = slugify(payload.title, { lower: true, strict: true })
    const exists = await isLessonSlugTakenInCourse(newSlug, lesson.courseId, lessonId, tx)
    if (exists) {
      newSlug = `${newSlug}-${Date.now().toString(16).slice(2)}`
    }
    updateData.slug = newSlug
  }

  if (payload.type) updateData.type = toPrismaLessonType(payload.type)
  if (payload.duration !== undefined) updateData.duration = Number(payload.duration)
  if (payload.content !== undefined) updateData.content = payload.content
  if (payload.videoUrl !== undefined) updateData.videoUrl = payload.videoUrl
  if (payload.isDemo !== undefined) updateData.isDemo = Boolean(payload.isDemo)
  if (payload.order !== undefined) updateData.order = Number(payload.order)

  if (payload.bunnyVideoId !== undefined) {
    const cleanBunnyId = payload.bunnyVideoId ? String(payload.bunnyVideoId).trim() : null
    const isVideoChanged = cleanBunnyId !== (lesson.bunnyVideoId || null)

    if (cleanBunnyId) {
      const existingWithBunny = await findLessonByBunnyVideoId(cleanBunnyId, tx)
      if (existingWithBunny && existingWithBunny.id !== lessonId) {
        return {
          success: false,
          statusCode: 409,
          message: 'Bunny Video ID đã được gắn với một bài học khác'
        }
      }

      try {
        const bunnyVerification = await verifyVideoUploadedToBunny(cleanBunnyId)
        updateData.bunnyVideoId = cleanBunnyId
        updateData.videoStatus = bunnyVerification.status
        if (bunnyVerification.duration > 0 && (!payload.duration || Number(payload.duration) === 0)) {
          updateData.duration = bunnyVerification.duration
        }
        if (!payload.videoUrl && !lesson.videoUrl) {
          try {
            const { cdnHostname } = getBunnyConfig()
            updateData.videoUrl = `https://${cdnHostname}/${cleanBunnyId}/playlist.m3u8`
          } catch {
            updateData.videoUrl = `https://vz-test-cdn.b-cdn.net/${cleanBunnyId}/playlist.m3u8`
          }
        }

        // Step 7H: If a new video is uploaded to this lesson and no teacher-edited summary exists, auto-trigger summary
        const hasTeacherSummary = Boolean(lesson.summary && lesson.summary.trim().length > 10)
        if (isVideoChanged && !hasTeacherSummary) {
          updateData.aiProcessingStatus =
            bunnyVerification.status === 'READY'
              ? AiProcessingStatus.PROCESSING
              : AiProcessingStatus.PENDING
          updateData.aiProcessingError = null
          shouldAutoTriggerAi = true
        }
      } catch (bunnyErr: unknown) {
        const msg = bunnyErr instanceof Error ? bunnyErr.message : 'Lỗi xác thực video Bunny Stream'
        return {
          success: false,
          statusCode: 400,
          message: msg
        }
      }
    } else {
      updateData.bunnyVideoId = null
      updateData.videoStatus = null
    }

    // STALE-JOB PROTECTION & GENERATION FENCING:
    // If the video asset actually changed, advance generation and invalidate prior AI jobs
    if (isVideoChanged) {
      updateData.aiGeneration = { increment: 1 }
      await markActiveJobsStaleForLesson(
        lessonId,
        `Video asset replaced (${lesson.bunnyVideoId || 'none'} -> ${cleanBunnyId || 'none'})`,
        tx
      )
    }
  }

  const updated = await updateLesson(lessonId, updateData, tx)

  if (shouldAutoTriggerAi) {
    autoTriggerLessonAiSummaryIfNeeded(updated.id, userId, role).catch((aiErr) => {
      console.warn(
        `[UpdateLesson Auto-AI-Summary] Non-blocking notice for lesson ${updated.id}:`,
        aiErr?.message || aiErr
      )
    })
  }

  return {
    success: true,
    message: 'Lesson updated successfully!',
    data: formatSafeLesson(updated)
  }
}

// DELETE LESSON
export const deleteLessonService = async (
  {
    lessonId,
    userId,
    role
  }: {
    lessonId: string
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!lessonId || (!isValidUUID(lessonId) && !isLegacyObjectId(lessonId))) {
    return { success: false, statusCode: 400, message: 'Invalid lesson ID' }
  }

  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = await findCourseById(lesson.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if ((role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  // If lesson has a Bunny video, check if other lessons are using it before deleting Bunny asset
  if (lesson.bunnyVideoId) {
    const usageCount = await countLessonsUsingBunnyVideoId(lesson.bunnyVideoId, lessonId, tx)
    if (usageCount === 0) {
      try {
        await deleteBunnyVideo(lesson.bunnyVideoId)
      } catch (err: unknown) {
        console.warn(`[Lesson Service] Warning deleting Bunny asset ${lesson.bunnyVideoId}:`, err)
      }
      await deleteVideoUploadRecord(lesson.bunnyVideoId, tx).catch(() => {})
    }
  }

  await deleteLesson(lessonId, tx)

  return {
    success: true,
    message: 'Lesson deleted successfully!'
  }
}

// GET LESSONS BY CHAPTER
export const getLessonsByChapterService = async (chapterId: string, tx?: PrismaTransactionClient) => {
  if (!chapterId || (!isValidUUID(chapterId) && !isLegacyObjectId(chapterId))) {
    return { success: false, statusCode: 400, message: 'Invalid chapter ID' }
  }

  const lessons = await findLessonsByChapter(chapterId, { select: LESSON_STUDY_SELECT }, tx)

  if (!lessons || lessons.length === 0) {
    return { success: false, statusCode: 404, message: 'No lessons found for this chapter' }
  }

  return {
    success: true,
    message: 'Fetched lessons successfully',
    data: lessons.map((ls) => formatSafeLesson(ls))
  }
}

// ==========================================
// STEP 6.5 & 7H: AI TRANSCRIPT & SUMMARY SERVICES
// ==========================================

/**
 * Update AI-generated transcript, summary, and processing lifecycle for a Lesson.
 * Enforces course ownership, validates status transitions, and guards against stale AI jobs.
 */
export const updateLessonAiContentService = async (
  {
    lessonId,
    payload,
    userId,
    role
  }: {
    lessonId: string
    payload: UpdateLessonAiContentInput | Record<string, any>
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!lessonId || (!isValidUUID(lessonId) && !isLegacyObjectId(lessonId))) {
    return { success: false, statusCode: 400, message: 'Invalid lesson ID' }
  }

  const parsed = updateLessonAiContentInputSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      statusCode: 400,
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
    }
  }
  const validData = parsed.data

  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = await findCourseById(lesson.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // Authorization check
  const isAiService = role === 'AI_SERVICE' || role?.toUpperCase() === 'AI_SERVICE'
  const isAdmin = role === UserRole.ADMIN || role?.toUpperCase() === 'ADMIN'
  const isTeacher = role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER'

  if (!isAiService && !isAdmin) {
    if (!isTeacher) {
      return { success: false, statusCode: 403, message: 'Only instructors and administrators can modify AI content' }
    }
    if (course.authorId !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  // Stale AI job protection 1: Video asset mismatch
  if (validData.bunnyVideoId && lesson.bunnyVideoId) {
    if (validData.bunnyVideoId.trim() !== lesson.bunnyVideoId.trim()) {
      return {
        success: false,
        statusCode: 409,
        message: 'Stale AI job: bunnyVideoId does not match current lesson video'
      }
    }
  }

  // Stale AI job protection 2: Timestamp monotonicity check
  if (validData.clientTimestamp && lesson.aiProcessedAt) {
    const clientTime = new Date(validData.clientTimestamp).getTime()
    const processedTime = new Date(lesson.aiProcessedAt).getTime()
    if (!isNaN(clientTime) && clientTime < processedTime) {
      return {
        success: false,
        statusCode: 409,
        message: `Stale AI job: newer AI content was already processed at ${lesson.aiProcessedAt.toISOString()}`
      }
    }
  }

  const updateData: Prisma.LessonUpdateInput = {}

  if (validData.transcript !== undefined) {
    updateData.transcript = validData.transcript
  } else if (validData.transcriptRefined !== undefined) {
    updateData.transcript = validData.transcriptRefined
  } else if (validData.transcriptOriginal !== undefined && !lesson.transcript) {
    updateData.transcript = validData.transcriptOriginal
  }

  if (validData.transcriptOriginal !== undefined) {
    updateData.transcriptOriginal = validData.transcriptOriginal
  }
  if (validData.transcriptRefined !== undefined) {
    updateData.transcriptRefined = validData.transcriptRefined
  }

  if (validData.summary !== undefined) {
    updateData.summary = validData.summary
  }

  const targetStatus = validData.aiProcessingStatus

  if (targetStatus) {
    if (targetStatus === AiProcessingStatus.COMPLETED) {
      const effectiveTranscript =
        validData.transcript !== undefined
          ? validData.transcript
          : validData.transcriptRefined || validData.transcriptOriginal || lesson.transcript
      const effectiveSummary = validData.summary !== undefined ? validData.summary : lesson.summary

      const hasTranscript = Boolean(effectiveTranscript && effectiveTranscript.trim().length > 0)
      const hasSummary = Boolean(effectiveSummary && effectiveSummary.trim().length > 0)

      if (!hasTranscript && !hasSummary) {
        return {
          success: false,
          statusCode: 400,
          message: 'Cannot mark AI processing as COMPLETED without transcript or summary content'
        }
      }

      updateData.aiProcessingStatus = AiProcessingStatus.COMPLETED
      updateData.aiProcessedAt = new Date()
      updateData.aiProcessingError = null
    } else if (targetStatus === AiProcessingStatus.FAILED) {
      updateData.aiProcessingStatus = AiProcessingStatus.FAILED
      updateData.aiProcessingError = validData.aiProcessingError || 'AI processing job failed'
    } else if (targetStatus === AiProcessingStatus.PROCESSING) {
      updateData.aiProcessingStatus = AiProcessingStatus.PROCESSING
      updateData.aiProcessingError = null
    } else if (targetStatus === AiProcessingStatus.PENDING) {
      updateData.aiProcessingStatus = AiProcessingStatus.PENDING
    }
  } else if (validData.aiProcessingError !== undefined) {
    updateData.aiProcessingError = validData.aiProcessingError
  }

  const updated = await updateLessonAiContent(lessonId, updateData, tx)

  return {
    success: true,
    message: 'Lesson AI content updated successfully',
    data: {
      id: updated.id,
      transcript: updated.transcript,
      ...(isAdmin || isTeacher || isAiService
        ? {
            transcriptOriginal: updated.transcriptOriginal,
            transcriptRefined: updated.transcriptRefined
          }
        : {}),
      summary: updated.summary,
      aiProcessingStatus: updated.aiProcessingStatus,
      aiProcessedAt: updated.aiProcessedAt,
      aiProcessingError: isAdmin || isTeacher || isAiService ? updated.aiProcessingError : null,
      updatedAt: updated.updatedAt
    }
  }
}

/**
 * Dedicated read service for Lesson AI transcript and summary.
 * Enforces course enrollment / demo access for students.
 * Strictly redacts internal operational errors from students and public viewers.
 * Step 7H: On-read reconciliation of active AI jobs so polling GET /api/lessons/:id/ai-content
 * immediately reflects completed summaries.
 */
export const getLessonAiContentService = async (
  {
    lessonId,
    userId,
    role
  }: {
    lessonId: string
    userId?: string
    role?: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!lessonId || (!isValidUUID(lessonId) && !isLegacyObjectId(lessonId))) {
    return { success: false, statusCode: 400, message: 'Invalid lesson ID' }
  }

  let lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = await findCourseById(lesson.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const isAiService = role === 'AI_SERVICE' || role?.toUpperCase() === 'AI_SERVICE'
  const isAdmin = role === UserRole.ADMIN || role?.toUpperCase() === 'ADMIN'
  const isTeacherOwner = (role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId === userId
  const canViewOperationalDetails = isAiService || isAdmin || isTeacherOwner

  let isAllowed = false

  if (canViewOperationalDetails) {
    isAllowed = true
  } else if (lesson.isDemo) {
    isAllowed = true
  } else if (userId) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, lesson.courseId, tx)
    if (enrollment && enrollment.status === 'ACTIVE') {
      isAllowed = true
    }
  }

  if (!isAllowed) {
    if (!userId) {
      return {
        success: false,
        statusCode: 401,
        message: 'Authentication required to access lesson AI content'
      }
    }
    return {
      success: false,
      statusCode: 403,
      message: 'You are not enrolled in this course and this lesson is not a demo'
    }
  }

  // Step 7H: Reconcile active AI job on read if lesson is PROCESSING or PENDING
  if (
    !tx &&
    (lesson.aiProcessingStatus === AiProcessingStatus.PROCESSING ||
      lesson.aiProcessingStatus === AiProcessingStatus.PENDING)
  ) {
    try {
      const activeJob = await findActiveAiJobByLessonId(lessonId)
      if (activeJob) {
        await pollJobStatusService(activeJob.id).catch(() => {})
        const refreshed = await findLessonById(lessonId)
        if (refreshed) {
          lesson = refreshed
        }
      } else if (lesson.bunnyVideoId && !lesson.summary) {
        autoTriggerLessonAiSummaryIfNeeded(lessonId, lesson.authorId, 'AI_SERVICE').catch(() => {})
      }
    } catch {
      // Ignore transient poll errors during read
    }
  }

  return {
    success: true,
    message: 'Fetched lesson AI content successfully',
    data: {
      id: lesson.id,
      transcript: lesson.transcript,
      summary: lesson.summary,
      aiProcessingStatus: lesson.aiProcessingStatus,
      aiProcessedAt: lesson.aiProcessedAt,
      ...(canViewOperationalDetails
        ? {
            transcriptOriginal: lesson.transcriptOriginal,
            transcriptRefined: lesson.transcriptRefined,
            aiProcessingError: lesson.aiProcessingError
          }
        : {})
    }
  }
}

/**
 * Get full Lesson detail for study purposes (includes transcript & summary for enrolled students).
 */
export const getLessonByIdService = async (
  {
    lessonId,
    userId,
    role
  }: {
    lessonId: string
    userId?: string
    role?: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!lessonId || (!isValidUUID(lessonId) && !isLegacyObjectId(lessonId))) {
    return { success: false, statusCode: 400, message: 'Invalid lesson ID' }
  }

  const lesson = await findLessonById(lessonId, { select: LESSON_STUDY_SELECT }, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = await findCourseById(lesson.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const isTeacherOwner = (role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId === userId
  const isAdmin = role === UserRole.ADMIN || role?.toUpperCase() === 'ADMIN'

  let canAccessFull = lesson.isDemo || isAdmin || isTeacherOwner

  if (!canAccessFull && userId) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, lesson.courseId, tx)
    if (enrollment && enrollment.status === 'ACTIVE') {
      canAccessFull = true
    }
  }

  if (!canAccessFull) {
    if (!userId) {
      return { success: false, statusCode: 401, message: 'Authentication required to access lesson content' }
    }
    return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
  }

  return {
    success: true,
    message: 'Fetched lesson detail successfully',
    data: formatSafeLesson(lesson)
  }
}
