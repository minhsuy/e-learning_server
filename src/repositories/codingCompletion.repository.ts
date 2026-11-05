import { Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: CODING EXERCISE COMPLETION
 *
 * Provides database operations on PostgreSQL `coding_exercise_completions` table.
 * Adheres strictly to AGENTS.md Functional Repository standards.
 */

export const CODING_COMPLETION_PUBLIC_SELECT = {
  id: true,
  userId: true,
  exerciseId: true,
  firstAcceptedSubmissionId: true,
  completedAt: true,
  bestScore: true,
  totalAttempts: true,
  xpAwarded: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.CodingExerciseCompletionSelect

export type CodingExerciseCompletionPublicPayload = Prisma.CodingExerciseCompletionGetPayload<{
  select: typeof CODING_COMPLETION_PUBLIC_SELECT
}>

/**
 * Find completion record by unique compound key (userId, exerciseId).
 */
export const findCompletionByUserAndExercise = async (
  userId: string,
  exerciseId: string,
  tx?: PrismaTransactionClient
): Promise<CodingExerciseCompletionPublicPayload | null> => {
  const client = tx || prisma
  return client.codingExerciseCompletion.findUnique({
    where: {
      userId_exerciseId: {
        userId,
        exerciseId
      }
    },
    select: CODING_COMPLETION_PUBLIC_SELECT
  })
}

/**
 * Find all completion records for a user in a given lesson.
 */
export const findCompletionsByUserAndLesson = async (
  userId: string,
  lessonId: string,
  tx?: PrismaTransactionClient
): Promise<CodingExerciseCompletionPublicPayload[]> => {
  const client = tx || prisma
  return client.codingExerciseCompletion.findMany({
    where: {
      userId,
      exercise: {
        lessonId
      }
    },
    select: CODING_COMPLETION_PUBLIC_SELECT
  })
}

/**
 * Find completions for a user given a list of exercise IDs (batch query to avoid N+1).
 */
export const findCompletionsByUserAndExerciseIds = async (
  userId: string,
  exerciseIds: string[],
  tx?: PrismaTransactionClient
): Promise<CodingExerciseCompletionPublicPayload[]> => {
  const client = tx || prisma
  if (exerciseIds.length === 0) return []
  return client.codingExerciseCompletion.findMany({
    where: {
      userId,
      exerciseId: { in: exerciseIds }
    },
    select: CODING_COMPLETION_PUBLIC_SELECT
  })
}

/**
 * Create a new completion record.
 */
export const createCodingExerciseCompletion = async (
  data: {
    userId: string
    exerciseId: string
    firstAcceptedSubmissionId: string
    completedAt?: Date
    bestScore?: number
    totalAttempts?: number
    xpAwarded?: number
  },
  tx?: PrismaTransactionClient
): Promise<CodingExerciseCompletionPublicPayload> => {
  const client = tx || prisma
  return client.codingExerciseCompletion.create({
    data: {
      userId: data.userId,
      exerciseId: data.exerciseId,
      firstAcceptedSubmissionId: data.firstAcceptedSubmissionId,
      completedAt: data.completedAt ?? new Date(),
      bestScore: data.bestScore ?? 100,
      totalAttempts: data.totalAttempts ?? 1,
      xpAwarded: data.xpAwarded ?? 0
    },
    select: CODING_COMPLETION_PUBLIC_SELECT
  })
}

/**
 * Upsert completion record: create if new, or increment attempts and update best score if exists.
 */
export const upsertCodingExerciseCompletion = async (
  data: {
    userId: string
    exerciseId: string
    firstAcceptedSubmissionId: string
    completedAt?: Date
    bestScore?: number
    totalAttempts?: number
    xpAwarded?: number
  },
  tx?: PrismaTransactionClient
): Promise<CodingExerciseCompletionPublicPayload> => {
  const client = tx || prisma
  return client.codingExerciseCompletion.upsert({
    where: {
      userId_exerciseId: {
        userId: data.userId,
        exerciseId: data.exerciseId
      }
    },
    create: {
      userId: data.userId,
      exerciseId: data.exerciseId,
      firstAcceptedSubmissionId: data.firstAcceptedSubmissionId,
      completedAt: data.completedAt ?? new Date(),
      bestScore: data.bestScore ?? 100,
      totalAttempts: data.totalAttempts ?? 1,
      xpAwarded: data.xpAwarded ?? 0
    },
    update: {
      totalAttempts: { increment: 1 },
      ...(data.bestScore !== undefined ? { bestScore: { set: data.bestScore } } : {})
    },
    select: CODING_COMPLETION_PUBLIC_SELECT
  })
}
