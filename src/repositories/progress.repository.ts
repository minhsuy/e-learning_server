import { Prisma, Progress } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: PROGRESS
 * 
 * Provides database operations on PostgreSQL `progress` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const PROGRESS_PUBLIC_SELECT = {
  id: true,
  userId: true,
  courseId: true,
  lessonId: true,
  completed: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.ProgressSelect

export type ProgressPublicPayload = Prisma.ProgressGetPayload<{
  select: typeof PROGRESS_PUBLIC_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Find progress for a specific user and lesson by composite unique key [userId, lessonId].
 */
export const findProgress = async (
  userId: string,
  lessonId: string,
  tx?: PrismaTransactionClient
): Promise<Progress | null> => {
  const client = tx || prisma
  return client.progress.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    }
  })
}

/**
 * Find all progress records for a user within a specific course.
 */
export const findProgressByCourse = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Progress[]> => {
  const client = tx || prisma
  return client.progress.findMany({
    where: {
      userId,
      courseId
    }
  })
}

/**
 * Find only completed lesson IDs for a user within a specific course.
 */
export const findCompletedLessonsByUserAndCourse = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<{ lessonId: string }[]> => {
  const client = tx || prisma
  return client.progress.findMany({
    where: {
      userId,
      courseId,
      completed: true
    },
    select: {
      lessonId: true
    }
  })
}

/**
 * Count completed lessons for a user within a course.
 */
export const countCompletedLessons = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.progress.count({
    where: {
      userId,
      courseId,
      completed: true
    }
  })
}

/**
 * Upsert progress record using the physical unique constraint @@unique([userId, lessonId]).
 */
export const upsertProgress = async (
  data: {
    userId: string
    courseId: string
    lessonId: string
    completed: boolean
  },
  tx?: PrismaTransactionClient
): Promise<Progress> => {
  const client = tx || prisma
  return client.progress.upsert({
    where: {
      userId_lessonId: {
        userId: data.userId,
        lessonId: data.lessonId
      }
    },
    update: {
      completed: data.completed,
      courseId: data.courseId
    },
    create: {
      userId: data.userId,
      courseId: data.courseId,
      lessonId: data.lessonId,
      completed: data.completed
    }
  })
}
