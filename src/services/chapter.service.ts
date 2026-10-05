import { Prisma } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import {
  addChapter,
  findChapterById,
  findChaptersByCourse,
  findMaxChapterOrderByCourse,
  softDeleteChapter,
  updateChapter
} from '~/repositories/chapter.repository'
import { findCourseById } from '~/repositories/course.repository'
import { UserRole } from '~/types/enum'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { CreateChapterInput, UpdateChapterInput } from '~/models/chapter.model'

/**
 * Checks if a string is a 24-character hexadecimal MongoDB ObjectId.
 */
function isLegacyObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// CREATE CHAPTER
export const createChapterService = async (
  {
    courseId,
    title,
    order,
    userId,
    role
  }: {
    courseId: string
    title: string
    order?: number
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!courseId || (!isValidUUID(courseId) && !isLegacyObjectId(courseId))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await findCourseById(courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if ((role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  let finalOrder = order
  if (finalOrder === undefined) {
    const maxOrder = await findMaxChapterOrderByCourse(courseId, tx)
    finalOrder = maxOrder + 1
  }

  const chapter = await addChapter(
    {
      title,
      order: finalOrder,
      course: { connect: { id: courseId } }
    },
    tx
  )

  return {
    success: true,
    message: 'Chapter created successfully!',
    data: {
      ...withCompatId(chapter),
      course: chapter.courseId,
      _destroy: chapter.isDestroyed
    }
  }
}

// UPDATE CHAPTER
export const updateChapterService = async (
  {
    chapterId,
    userId,
    role,
    payload
  }: {
    chapterId: string
    userId: string
    role: string
    payload: UpdateChapterInput & { _destroy?: boolean }
  },
  tx?: PrismaTransactionClient
) => {
  if (!chapterId || (!isValidUUID(chapterId) && !isLegacyObjectId(chapterId))) {
    return { success: false, statusCode: 400, message: 'Invalid chapter ID' }
  }

  const chapter = await findChapterById(chapterId, tx)
  if (!chapter) {
    return { success: false, statusCode: 404, message: 'Chapter not found' }
  }

  const course = await findCourseById(chapter.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if ((role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const updateData: Prisma.ChapterUpdateInput = {}
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.order !== undefined) updateData.order = payload.order
  if (payload._destroy !== undefined) updateData.isDestroyed = payload._destroy

  const updated = await updateChapter(chapterId, updateData, tx)

  return {
    success: true,
    message: 'Chapter updated successfully!',
    data: {
      ...withCompatId(updated),
      course: updated.courseId,
      _destroy: updated.isDestroyed
    }
  }
}

// DELETE CHAPTER (SOFT DELETE)
export const deleteChapterService = async (
  {
    chapterId,
    userId,
    role
  }: {
    chapterId: string
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!chapterId || (!isValidUUID(chapterId) && !isLegacyObjectId(chapterId))) {
    return { success: false, statusCode: 400, message: 'Invalid chapter ID' }
  }

  const chapter = await findChapterById(chapterId, tx)
  if (!chapter) {
    return { success: false, statusCode: 404, message: 'Chapter not found' }
  }

  const course = await findCourseById(chapter.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if ((role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const deleted = await softDeleteChapter(chapterId, tx)

  return {
    success: true,
    message: 'Chapter deleted successfully!',
    data: {
      ...withCompatId(deleted),
      course: deleted.courseId,
      _destroy: deleted.isDestroyed
    }
  }
}

// GET CHAPTERS BY COURSE
export const getChaptersByCourseService = async (
  {
    courseId,
    userId,
    role
  }: {
    courseId: string
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!courseId || (!isValidUUID(courseId) && !isLegacyObjectId(courseId))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await findCourseById(courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if ((role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const chapters = await findChaptersByCourse(courseId, true, tx)

  return {
    success: true,
    message: 'Fetched chapters successfully!',
    data: chapters.map((ch) => ({
      ...withCompatId(ch),
      course: ch.courseId,
      _destroy: ch.isDestroyed,
      lessons: ch.lessons
        ? ch.lessons.map((ls: any) => ({
            ...withCompatId(ls),
            chapter: ls.chapterId,
            course: ls.courseId
          }))
        : []
    }))
  }
}
