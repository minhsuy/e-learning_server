import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { findCourseById } from '~/repositories/course.repository'
import { findChapterById } from '~/repositories/chapter.repository'
import { findEnrollmentByUserAndCourse } from '~/repositories/enrollment.repository'
import { findLessonById, updateLesson } from '~/repositories/lesson.repository'
import {
  countLessonsUsingBunnyVideoId,
  createVideoUploadRecord,
  deleteVideoUploadRecord,
  findLessonByBunnyVideoId,
  findVideoUploadByBunnyId,
  updateVideoUploadStatus
} from '~/repositories/video.repository'
import {
  createBunnyVideo,
  deleteBunnyVideo,
  generatePlaybackInfo,
  generateTusUploadCredentials,
  getBunnyVideoDetails
} from '~/services/bunny.service'
import { autoTriggerLessonAiSummaryIfNeeded } from '~/services/aiProcessing.service'
import { UserRole } from '~/types/enum'

/**
 * Authorizes a direct TUS video upload to Bunny Stream.
 * POST /api/videos/upload-signature
 * Access: TEACHER (course owner) or ADMIN
 */
export const createUploadSignatureController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId, role } = req.user as { userId: string; role: string }
    const { title, courseId, chapterId } = req.body

    // 1. Verify Course existence
    const course = await findCourseById(courseId)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Khóa học không tồn tại'
      })
    }

    // 2. Ownership check: Teacher must own the course
    const isTeacher = role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER'
    if (isTeacher && course.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tải video cho khóa học của giảng viên khác'
      })
    }

    // 3. Optional Chapter verification
    if (chapterId) {
      const chapter = await findChapterById(chapterId)
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: 'Chương học không tồn tại'
        })
      }
      if (chapter.courseId !== courseId) {
        return res.status(400).json({
          success: false,
          message: 'Chương học không thuộc về khóa học được chỉ định'
        })
      }
    }

    // 4. Create Bunny video placeholder
    const bunnyVideo = await createBunnyVideo(title)

    // 5. Generate TUS credentials (2 hours expiry)
    const credentials = generateTusUploadCredentials(bunnyVideo.guid, 7200)

    // 6. Record upload lifecycle in PostgreSQL
    await createVideoUploadRecord({
      bunnyVideoId: bunnyVideo.guid,
      title: title.trim(),
      status: 'CREATED',
      course: { connect: { id: courseId } },
      chapterId: chapterId || null,
      user: { connect: { id: userId } },
      uploadUrl: credentials.uploadUrl,
      expiresAt: new Date(credentials.expiresAt)
    })

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo upload video thành công. Vui lòng tải trực tiếp lên Bunny CDN qua TUS.',
      data: credentials
    })
  }
)

/**
 * Checks the real-time transcoding and processing status of a Bunny video.
 * GET /api/videos/:videoId/status
 * Access: TEACHER (owner) or ADMIN
 */
export const getVideoStatusController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { videoId } = req.params as { videoId: string }
    const { userId, role } = req.user as { userId: string; role: string }

    // 1. Check local record
    const uploadRecord = await findVideoUploadByBunnyId(videoId)
    const lessonRecord = await findLessonByBunnyVideoId(videoId)

    const isTeacher = role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER'
    if (isTeacher) {
      const isOwner =
        (uploadRecord && uploadRecord.userId === userId) ||
        (lessonRecord && lessonRecord.authorId === userId)

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập trạng thái của video này'
        })
      }
    }

    // 2. Query Bunny Stream API for real-time status
    try {
      const details = await getBunnyVideoDetails(videoId)

      // Sync status to local DB if changed
      if (uploadRecord && uploadRecord.status !== details.status) {
        await updateVideoUploadStatus(videoId, {
          status: details.status,
          duration: details.duration
        })
      }

      // If associated with a lesson, also update lesson's videoStatus & duration if finished
      if (lessonRecord && lessonRecord.videoStatus !== details.status) {
        await updateLesson(lessonRecord.id, {
          videoStatus: details.status,
          ...(details.duration > 0 ? { duration: details.duration } : {})
        })
      }

      // Step 7H: Automatic Lesson Summary Trigger
      // When video becomes READY and is associated with a lesson, automatically trigger summary pipeline
      if ((details.status === 'READY' || (details as any).rawStatus === 4) && lessonRecord) {
        autoTriggerLessonAiSummaryIfNeeded(
          lessonRecord.id,
          lessonRecord.authorId,
          'AI_SERVICE'
        ).catch((aiErr) => {
          console.warn(
            `[Auto-AI-Summary] Non-blocking trigger notice for lesson ${lessonRecord.id}:`,
            aiErr?.message || aiErr
          )
        })
      }

      return res.status(200).json({
        success: true,
        data: details
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi truy vấn trạng thái Bunny Video'
      return res.status(400).json({
        success: false,
        message
      })
    }
  }
)

/**
 * Deletes a video asset from Bunny Stream and cleans up local database references.
 * DELETE /api/videos/:videoId
 * Access: TEACHER (owner) or ADMIN
 */
export const deleteVideoController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { videoId } = req.params as { videoId: string }
    const { userId, role } = req.user as { userId: string; role: string }

    const uploadRecord = await findVideoUploadByBunnyId(videoId)
    const lessonRecord = await findLessonByBunnyVideoId(videoId)

    if (!uploadRecord && !lessonRecord) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin video cần xóa'
      })
    }

    // Verify ownership for TEACHER
    const isTeacher = role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER'
    if (isTeacher) {
      const isOwner =
        (uploadRecord && uploadRecord.userId === userId) ||
        (lessonRecord && lessonRecord.authorId === userId)

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa video này'
        })
      }
    }

    // Check if multiple lessons are referencing this video
    const lessonCount = await countLessonsUsingBunnyVideoId(videoId)
    if (lessonCount > 1) {
      return res.status(400).json({
        success: false,
        message: 'Video đang được sử dụng bởi nhiều bài học. Không thể xóa.'
      })
    }

    // 1. Delete from Bunny Stream
    try {
      await deleteBunnyVideo(videoId)
    } catch (err: unknown) {
      console.warn(`[Bunny Stream] Warning deleting video ${videoId}:`, err)
    }

    // 2. Clean up database records
    await deleteVideoUploadRecord(videoId)

    if (lessonRecord) {
      await updateLesson(lessonRecord.id, {
        bunnyVideoId: null,
        videoStatus: null
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa video Bunny thành công'
    })
  }
)

/**
 * Retrieves secure playback information for an authorized student or instructor.
 * GET /api/videos/lesson/:lessonId/playback
 * Access: Enrolled students, Course Instructor, Admin, or Public if isDemo=true
 */
export const getLessonPlaybackController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { lessonId } = req.params as { lessonId: string }
    const user = req.user as { userId: string; role: string } | undefined
    const userId = user?.userId
    const role = user?.role

    const lesson = await findLessonById(lessonId)
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Bài học không tồn tại'
      })
    }

    // Check Authorization:
    // 1. Demo lesson is public
    const isDemo = Boolean(lesson.isDemo)
    let isAuthorized = isDemo

    if (userId && !isAuthorized) {
      const isAdmin = role === UserRole.ADMIN || role?.toUpperCase() === 'ADMIN'
      const isAuthor = lesson.authorId === userId

      if (isAdmin || isAuthor) {
        isAuthorized = true
      } else {
        // Check student active enrollment
        const enrollment = await findEnrollmentByUserAndCourse(userId, lesson.courseId)
        if (enrollment && (enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED')) {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa mua hoặc chưa được cấp quyền xem bài học này'
      })
    }

    // Construct response
    let playbackInfo = null
    if (lesson.bunnyVideoId) {
      playbackInfo = generatePlaybackInfo(
        lesson.bunnyVideoId,
        lesson.videoStatus || 'READY'
      )
    }

    return res.status(200).json({
      success: true,
      data: {
        lessonId: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        isDemo: lesson.isDemo,
        type: lesson.type,
        duration: lesson.duration,
        playback: playbackInfo,
        videoUrl: lesson.videoUrl || null
      }
    })
  }
)

/**
 * Optional Webhook handler for Bunny Stream transcoding and upload events.
 * POST /api/videos/webhook
 */
export const bunnyWebhookController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { VideoGuid, Status } = req.body as {
      VideoGuid?: string
      Status?: number
      EncodeProgress?: number
    }

    if (!VideoGuid) {
      return res.status(200).json({ success: true, message: 'Ignored: No VideoGuid' })
    }

    if (Status !== undefined) {
      let domainStatus = 'PROCESSING'
      if (Status === 4) domainStatus = 'READY'
      else if (Status === 5 || Status === 6) domainStatus = 'FAILED'

      await updateVideoUploadStatus(VideoGuid, {
        status: domainStatus
      })

      const lesson = await findLessonByBunnyVideoId(VideoGuid)
      if (lesson) {
        await updateLesson(lesson.id, {
          videoStatus: domainStatus
        })

        // Step 7H: Automatically trigger AI transcription & summarization when Bunny webhook reports Status === 4 (READY)
        if (domainStatus === 'READY') {
          autoTriggerLessonAiSummaryIfNeeded(lesson.id, lesson.authorId, 'AI_SERVICE').catch((aiErr) => {
            console.warn(
              `[Bunny-Webhook Auto-AI-Summary] Non-blocking notice for lesson ${lesson.id}:`,
              aiErr?.message || aiErr
            )
          })
        }
      }
    }

    return res.status(200).json({ success: true, received: true })
  }
)
