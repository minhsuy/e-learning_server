import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  findCompletionByUserAndExercise,
  findCompletionsByUserAndExerciseIds
} from '~/repositories/codingCompletion.repository'
import {
  findCodingExerciseById,
  findPublishedCodingExercisesByLesson,
  findPublishedExerciseById
} from '~/repositories/codingExercise.repository'
import { countCodingSubmissionsByUserAndExercise } from '~/repositories/codingSubmission.repository'
import { findCourseById } from '~/repositories/course.repository'
import { findEnrollmentByUserAndCourse } from '~/repositories/enrollment.repository'
import { findLessonById } from '~/repositories/lesson.repository'
import { UserRole } from '~/types/enum'
import { ServiceResponse } from '~/types/type'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — SERVICE: CODING EXERCISE COMPLETION & PROGRESS
 *
 * Implements completion tracking, dedicated XP reporting, and lesson coding progress.
 * Decouples exercise completion from lesson completion.
 */

// ==========================================
// 1. GET EXERCISE COMPLETION STATUS
// ==========================================

export const getExerciseCompletionService = async (
  {
    userId,
    role,
    exerciseId,
    targetUserId
  }: {
    userId: string
    role: string
    exerciseId: string
    targetUserId?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  // Determine which user's completion is being inspected
  const effectiveUserId = targetUserId && isValidUUID(targetUserId) ? targetUserId : userId

  // Prevent students from reading another student's completion
  if (effectiveUserId !== userId && role === UserRole.USER) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not authorized to view another student\'s completion status'
    }
  }

  // Verify exercise existence
  const exercise = await findCodingExerciseById(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  // Verify lesson and enrollment if the subject user is a student
  const lesson = await findLessonById(exercise.lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  if (role === UserRole.USER && !lesson.isDemo) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, lesson.courseId, tx)
    if (!enrollment) {
      return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
    }
  }

  // Check physical completion record
  const completion = await findCompletionByUserAndExercise(effectiveUserId, exerciseId, tx)

  if (completion) {
    return {
      success: true,
      statusCode: 200,
      message: 'Fetched exercise completion status successfully',
      data: {
        exerciseId,
        userId: effectiveUserId,
        completed: true,
        completedAt: completion.completedAt,
        bestScore: completion.bestScore,
        totalAttempts: completion.totalAttempts,
        codingXpEarned: completion.xpAwarded
      }
    }
  }

  // Not completed yet: retrieve submission attempt counts and best score
  const totalAttempts = await countCodingSubmissionsByUserAndExercise(effectiveUserId, exerciseId, tx)
  let bestScore = 0
  if (totalAttempts > 0) {
    const client = tx || prisma
    const bestSub = await client.codingSubmission.findFirst({
      where: { userId: effectiveUserId, exerciseId },
      orderBy: { score: 'desc' },
      select: { score: true }
    })
    bestScore = bestSub?.score ?? 0
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched exercise completion status successfully',
    data: {
      exerciseId,
      userId: effectiveUserId,
      completed: false,
      completedAt: null,
      bestScore,
      totalAttempts,
      codingXpEarned: 0
    }
  }
}

// ==========================================
// 2. GET LESSON CODING PROGRESS
// ==========================================

export const getLessonCodingProgressService = async (
  {
    userId,
    role,
    lessonId,
    targetUserId
  }: {
    userId: string
    role: string
    lessonId: string
    targetUserId?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(lessonId)) {
    return { success: false, statusCode: 400, message: 'Invalid Lesson ID' }
  }

  const effectiveUserId = targetUserId && isValidUUID(targetUserId) ? targetUserId : userId

  if (effectiveUserId !== userId && role === UserRole.USER) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not authorized to view another student\'s progress'
    }
  }

  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  if (role === UserRole.USER && !lesson.isDemo) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, lesson.courseId, tx)
    if (!enrollment) {
      return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
    }
  }

  // Fetch only PUBLISHED exercises in this lesson
  const exercises = await findPublishedCodingExercisesByLesson(lessonId, tx)
  const validExercises = exercises.filter((ex) => ex.revisions.length > 0)
  const exerciseIds = validExercises.map((ex) => ex.id)

  // Batch lookup all completions for this student to avoid N+1 queries
  const completions = await findCompletionsByUserAndExerciseIds(effectiveUserId, exerciseIds, tx)
  const completionMap = new Map<string, (typeof completions)[number]>()
  for (const c of completions) {
    completionMap.set(c.exerciseId, c)
  }

  const exerciseProgressItems = validExercises.map((ex) => {
    const comp = completionMap.get(ex.id)
    return {
      exerciseId: ex.id,
      title: ex.title,
      difficulty: ex.difficulty,
      order: ex.order,
      completed: !!comp,
      completedAt: comp?.completedAt ?? null,
      bestScore: comp?.bestScore ?? 0,
      totalAttempts: comp?.totalAttempts ?? 0,
      xpAwarded: comp?.xpAwarded ?? 0
    }
  })

  const totalExercises = validExercises.length
  const completedExercises = exerciseProgressItems.filter((item) => item.completed).length
  const completionPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched lesson coding progress successfully',
    data: {
      lessonId,
      userId: effectiveUserId,
      totalExercises,
      completedExercises,
      completionPercentage,
      exercises: exerciseProgressItems
    }
  }
}
