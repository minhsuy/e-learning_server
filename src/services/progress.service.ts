import { EEnrollmentStatus } from '@prisma/client'
import {
  countCompletedLessons,
  findCompletedLessonsByUserAndCourse,
  findProgress,
  upsertProgress
} from '~/repositories/progress.repository'
import { countLessons, findLessonById, findLessonsByCourse } from '~/repositories/lesson.repository'
import { findCourseById } from '~/repositories/course.repository'
import { findEnrollmentByUserAndCourse, updateEnrollmentProgress } from '~/repositories/enrollment.repository'
import { awardLessonCompletionXP } from '~/services/xp.service'
import { recordLearningActivityStreak } from '~/services/streak.service'
import { ServiceResponse } from '~/types/type'
import { withCompatId } from '~/utils/uuid'

/**
 * TMDEMY — PROGRESS SERVICE
 *
 * Manages lesson completion and course progress tracking.
 * Single source of truth: PostgreSQL via Functional Repositories.
 */

export const markLessonCompleteService = async ({
  userId,
  courseId,
  lessonId
}: {
  userId: string
  courseId: string
  lessonId: string
}): Promise<ServiceResponse> => {
  // 1. Verify Lesson exists and belongs to the given Course
  const lesson = await findLessonById(lessonId)
  if (!lesson || lesson.courseId !== courseId) {
    return { success: false, statusCode: 404, message: 'Lesson not found in this course' }
  }

  // 2. Verify Course exists
  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 3. Verify User Enrollment in PostgreSQL
  const enrollment = await findEnrollmentByUserAndCourse(userId, courseId)
  if (!enrollment) {
    return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
  }

  // 4. Check whether lesson was already completed (prevent double-counting)
  const existingProgress = await findProgress(userId, lessonId)
  const wasAlreadyCompleted = existingProgress?.completed === true

  // 5. Upsert Progress record
  await upsertProgress({
    userId,
    courseId,
    lessonId,
    completed: true
  })

  // 6. Recalculate Course progress percentage
  const totalLessons = await countLessons({ courseId })
  const completedLessons = await countCompletedLessons(userId, courseId)
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // 7. Update Enrollment progress in PostgreSQL
  const isCompleted = percent === 100
  await updateEnrollmentProgress(
    userId,
    courseId,
    percent,
    isCompleted ? EEnrollmentStatus.COMPLETED : enrollment.status,
    isCompleted ? enrollment.completedAt || new Date() : enrollment.completedAt
  )

  // 8. Award Lesson Completion XP and update Streak atomically if not already completed
  if (!wasAlreadyCompleted) {
    try {
      await awardLessonCompletionXP({ userId, lessonId })
      await recordLearningActivityStreak({ userId })
    } catch {
      // Non-blocking fallback for edge cases; gamification services handle
      // idempotency and database unique conflicts internally.
    }
  }

  return {
    success: true,
    message: 'Lesson marked as completed',
    data: { progress: percent }
  }
}

export const unmarkLessonCompleteService = async ({
  userId,
  courseId,
  lessonId
}: {
  userId: string
  courseId: string
  lessonId: string
}): Promise<ServiceResponse> => {
  // 1. Verify Lesson exists and belongs to the given Course
  const lesson = await findLessonById(lessonId)
  if (!lesson || lesson.courseId !== courseId) {
    return { success: false, statusCode: 404, message: 'Lesson not found in this course' }
  }

  // 2. Verify Course exists
  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 3. Verify User Enrollment in PostgreSQL
  const enrollment = await findEnrollmentByUserAndCourse(userId, courseId)
  if (!enrollment) {
    return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
  }

  // 4. Update Progress to completed = false
  await upsertProgress({
    userId,
    courseId,
    lessonId,
    completed: false
  })

  // 5. Recalculate Course progress percentage
  const totalLessons = await countLessons({ courseId })
  const completedLessons = await countCompletedLessons(userId, courseId)
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // 6. Update Enrollment progress in PostgreSQL (revert completed status if progress drops below 100%)
  const wasCompleted = enrollment.status === EEnrollmentStatus.COMPLETED
  const newStatus = percent < 100 && wasCompleted ? EEnrollmentStatus.ACTIVE : enrollment.status
  const newCompletedAt = percent < 100 && wasCompleted ? null : enrollment.completedAt

  await updateEnrollmentProgress(userId, courseId, percent, newStatus, newCompletedAt)

  return {
    success: true,
    message: 'Lesson unmarked as completed',
    data: { progress: percent }
  }
}

export const getProgressByCourseService = async ({
  userId,
  courseId
}: {
  userId: string
  courseId: string
}): Promise<ServiceResponse> => {
  // 1. Fetch all lessons belonging to the course
  const lessons = await findLessonsByCourse(courseId)

  // 2. Fetch completed progress records for the user
  const completedProgress = await findCompletedLessonsByUserAndCourse(userId, courseId)
  const completedIds = new Set(completedProgress.map((p) => p.lessonId))

  // 3. Format lessons list with completion flag
  const formattedLessons = lessons.map((lesson) => ({
    _id: lesson.id,
    id: lesson.id,
    title: lesson.title,
    order: lesson.order,
    completed: completedIds.has(lesson.id)
  }))

  const totalLessons = lessons.length
  const completedCount = completedProgress.length
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return {
    success: true,
    message: 'Fetched course progress successfully',
    data: {
      totalLessons,
      completedLessons: completedCount,
      percent,
      lessons: formattedLessons
    }
  }
}
