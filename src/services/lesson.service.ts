import { LessonType, Prisma } from '@prisma/client'
import slugify from 'slugify'
import { PrismaTransactionClient } from '~/config/prisma'
import { findActiveEnrolledUserIdsByCourseId } from '~/repositories/enrollment.repository'
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
  updateLesson
} from '~/repositories/lesson.repository'
import { ENotificationType, UserRole } from '~/types/enum'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { pushNotificationService } from './notification.service'
import { CreateLessonInput, UpdateLessonInput } from '~/models/lesson.model'

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
 */
function formatSafeLesson(lesson: any) {
  if (!lesson) return null
  return {
    ...withCompatId(lesson),
    chapter: lesson.chapterId || lesson.chapter,
    course: lesson.courseId || lesson.course,
    author: lesson.authorId || lesson.author
  }
}

// CREATE LESSON
export const createLessonService = async (
  {
    payload,
    userId,
    role
  }: {
    payload: Partial<CreateLessonInput> & { chapter?: string; course?: string } | Record<string, any>
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

  const lesson = await addLesson(
    {
      title,
      slug,
      order: finalOrder,
      duration: Number(duration || 0),
      type: toPrismaLessonType(type),
      content: content || '',
      isDemo: Boolean(isDemo),
      videoUrl: videoUrl || '',
      chapter: { connect: { id: chapter } },
      course: { connect: { id: course } },
      author: { connect: { id: userId } }
    },
    tx
  )

  // Non-blocking notification dispatch to active enrolled students
  try {
    const enrolledUserIds = await findActiveEnrolledUserIdsByCourseId(course)
    for (const studentId of enrolledUserIds) {
      try {
        await pushNotificationService({
          senderId: userId,
          receiverId: studentId,
          type: ENotificationType.LESSON,
          message: `Có bài học mới "${lesson.title}" trong khóa học "${courseDoc.title}"`,
          relatedId: lesson.id
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
    payload: UpdateLessonInput & { chapter?: string } | Record<string, any>
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

  const updated = await updateLesson(lessonId, updateData, tx)

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
