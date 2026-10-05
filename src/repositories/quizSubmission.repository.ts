import { Prisma, QuizSubmission } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: QUIZ SUBMISSION & SUBMISSION ANSWERS
 * 
 * Single source of database operations for QuizSubmission and QuizSubmissionAnswer entities
 * on PostgreSQL via Prisma ORM.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 * - Zero Mongoose / MongoDB dependencies
 */

// ==========================================
// 1. PRISMA SELECT CONSTANTS (PROJECTIONS)
// ==========================================

export const SUBMISSION_DETAIL_SELECT = {
  id: true,
  quizId: true,
  userId: true,
  score: true,
  totalPoints: true,
  percentage: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  answers: {
    select: {
      id: true,
      submissionId: true,
      questionId: true,
      selectedAnswer: true,
      isCorrect: true,
      question: {
        select: {
          id: true,
          quizId: true,
          title: true,
          type: true,
          points: true
        }
      }
    }
  }
} as const satisfies Prisma.QuizSubmissionSelect

export type SubmissionDetailPayload = Prisma.QuizSubmissionGetPayload<{
  select: typeof SUBMISSION_DETAIL_SELECT
}>

export const TEACHER_SUBMISSION_LIST_SELECT = {
  id: true,
  quizId: true,
  userId: true,
  score: true,
  totalPoints: true,
  percentage: true,
  completedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true
    }
  }
} as const satisfies Prisma.QuizSubmissionSelect

export type TeacherSubmissionListPayload = Prisma.QuizSubmissionGetPayload<{
  select: typeof TEACHER_SUBMISSION_LIST_SELECT
}>

// ==========================================
// 2. INPUT DATA TYPES
// ==========================================

export interface CreateSubmissionAnswerInput {
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
}

export interface CreateSubmissionData {
  quizId: string
  userId: string
  score: number
  totalPoints: number
  percentage: number
  completedAt?: Date
  answers: CreateSubmissionAnswerInput[]
}

// ==========================================
// 3. READ OPERATIONS
// ==========================================

/**
 * Find submission by ID without nested answers.
 */
export const findSubmissionById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<QuizSubmission | null> => {
  const client = tx || prisma
  return client.quizSubmission.findUnique({
    where: { id }
  })
}

/**
 * Find basic submission by composite unique [quizId, userId].
 */
export const findSubmissionByQuizAndUser = async (
  quizId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<QuizSubmission | null> => {
  const client = tx || prisma
  return client.quizSubmission.findUnique({
    where: {
      quizId_userId: {
        quizId,
        userId
      }
    }
  })
}

/**
 * Find submission detail including all answers and question details by [quizId, userId].
 */
export const findSubmissionDetailByQuizAndUser = async (
  quizId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<SubmissionDetailPayload | null> => {
  const client = tx || prisma
  return client.quizSubmission.findUnique({
    where: {
      quizId_userId: {
        quizId,
        userId
      }
    },
    select: SUBMISSION_DETAIL_SELECT
  })
}

/**
 * Find all submissions for a quiz (Teacher view) with user username.
 */
export const findSubmissionsByQuizId = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<TeacherSubmissionListPayload[]> => {
  const client = tx || prisma
  return client.quizSubmission.findMany({
    where: { quizId },
    select: TEACHER_SUBMISSION_LIST_SELECT,
    orderBy: { completedAt: 'desc' }
  })
}

/**
 * Find raw submissions for analytics calculation.
 */
export const findSubmissionsForAnalytics = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<{ score: number; completedAt: Date }[]> => {
  const client = tx || prisma
  return client.quizSubmission.findMany({
    where: { quizId },
    select: {
      score: true,
      completedAt: true
    }
  })
}

// ==========================================
// 4. WRITE OPERATIONS
// ==========================================

/**
 * Atomically create a QuizSubmission and its child QuizSubmissionAnswer records.
 */
export const createSubmissionWithAnswers = async (
  data: CreateSubmissionData,
  tx?: PrismaTransactionClient
): Promise<SubmissionDetailPayload> => {
  const execute = async (client: PrismaTransactionClient) => {
    return client.quizSubmission.create({
      data: {
        quizId: data.quizId,
        userId: data.userId,
        score: data.score,
        totalPoints: data.totalPoints,
        percentage: data.percentage,
        completedAt: data.completedAt ?? new Date(),
        answers: {
          create: data.answers.map((ans) => ({
            questionId: ans.questionId,
            selectedAnswer: ans.selectedAnswer,
            isCorrect: ans.isCorrect
          }))
        }
      },
      select: SUBMISSION_DETAIL_SELECT
    })
  }

  if (tx) {
    return execute(tx)
  }
  return prisma.$transaction((innerTx) => execute(innerTx as PrismaTransactionClient))
}

/**
 * Delete a submission by UUID (used for testing or admin maintenance).
 */
export const deleteSubmission = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<QuizSubmission> => {
  const client = tx || prisma
  return client.quizSubmission.delete({
    where: { id }
  })
}
