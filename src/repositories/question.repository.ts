import { Prisma, Question, QuestionType } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: QUESTION & QUESTION OPTION
 * 
 * Single source of database operations for Question and QuestionOption entities on PostgreSQL via Prisma ORM.
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

/**
 * Public question projection for Students (Anti-Cheat: STRICTLY OMITS `answer`).
 */
export const QUESTION_PUBLIC_SELECT = {
  id: true,
  quizId: true,
  type: true,
  title: true,
  points: true,
  createdAt: true,
  updatedAt: true,
  options: {
    orderBy: { order: 'asc' },
    select: {
      id: true,
      optionText: true,
      order: true
    }
  }
} as const satisfies Prisma.QuestionSelect

export type QuestionPublicPayload = Prisma.QuestionGetPayload<{
  select: typeof QUESTION_PUBLIC_SELECT
}>

/**
 * Complete study/management question projection INCLUDING `answer` (Teacher/Admin).
 */
export const QUESTION_STUDY_SELECT = {
  id: true,
  quizId: true,
  type: true,
  title: true,
  answer: true,
  points: true,
  createdAt: true,
  updatedAt: true,
  options: {
    orderBy: { order: 'asc' },
    select: {
      id: true,
      optionText: true,
      order: true
    }
  }
} as const satisfies Prisma.QuestionSelect

export type QuestionStudyPayload = Prisma.QuestionGetPayload<{
  select: typeof QUESTION_STUDY_SELECT
}>

/**
 * Default question payload including full child options ordered sequentially.
 */
export type QuestionWithOptionRecords = Prisma.QuestionGetPayload<{
  include: {
    options: {
      orderBy: { order: 'asc' }
    }
  }
}>

/**
 * Application-level formatted question with legacy `options: string[]` compatibility.
 */
export interface FormattedQuestion extends Omit<QuestionWithOptionRecords, 'options'> {
  options: string[]
  optionRecords: QuestionWithOptionRecords['options']
}

export function formatQuestionOptions(question: QuestionWithOptionRecords): FormattedQuestion {
  return {
    ...question,
    options: (question.options || []).map((o) => o.optionText),
    optionRecords: question.options
  }
}

// ==========================================
// 2. INPUT DATA TYPES
// ==========================================

export interface CreateQuestionData {
  quizId: string
  type?: QuestionType
  title: string
  answer: string
  points?: number
  options?: string[]
}

export interface UpdateQuestionData {
  type?: QuestionType
  title?: string
  answer?: string
  points?: number
  options?: string[]
}

// ==========================================
// 3. READ OPERATIONS
// ==========================================

/**
 * Find a single question by UUID with its options ordered sequentially.
 */
export const findQuestionById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<QuestionWithOptionRecords | null> => {
  const client = tx || prisma
  return client.question.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: { order: 'asc' }
      }
    }
  })
}

/**
 * Find all questions for a quiz, ordered by [createdAt ASC, id ASC] with options.
 */
export const findQuestionsByQuizId = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<QuestionWithOptionRecords[]> => {
  const client = tx || prisma
  return client.question.findMany({
    where: { quizId },
    include: {
      options: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  })
}

/**
 * Find student-safe public questions for a quiz (STRICTLY NO ANSWERS).
 */
export const findQuestionsByQuizIdPublic = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<QuestionPublicPayload[]> => {
  const client = tx || prisma
  return client.question.findMany({
    where: { quizId },
    select: QUESTION_PUBLIC_SELECT,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  })
}

/**
 * Find questions for a quiz including answers for authorized teachers/admins.
 */
export const findQuestionsByQuizIdStudy = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<QuestionStudyPayload[]> => {
  const client = tx || prisma
  return client.question.findMany({
    where: { quizId },
    select: QUESTION_STUDY_SELECT,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  })
}

// ==========================================
// 4. WRITE OPERATIONS
// ==========================================

/**
 * Create a question and its options transactionally.
 * Maps string[] options into question_options table with order: index.
 */
export const createQuestion = async (
  data: CreateQuestionData,
  tx?: PrismaTransactionClient
): Promise<QuestionWithOptionRecords> => {
  const execute = async (client: PrismaTransactionClient) => {
    const rawOptions = Array.isArray(data.options) ? data.options : []

    return client.question.create({
      data: {
        quizId: data.quizId,
        type: data.type || QuestionType.MULTIPLE_CHOICE,
        title: data.title,
        answer: data.answer,
        points: data.points ?? 1,
        options: rawOptions.length > 0
          ? {
              create: rawOptions.map((optText, index) => ({
                optionText: optText,
                order: index
              }))
            }
          : undefined
      },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  if (tx) {
    return execute(tx)
  }
  return prisma.$transaction((innerTx) => execute(innerTx as PrismaTransactionClient))
}

/**
 * Update a question and conditionally manage its options atomically:
 * - If `options === undefined`: options are NOT touched.
 * - If `options === []`: all existing options are removed.
 * - If `options` has elements: existing options are replaced with new elements ordered by index.
 */
export const updateQuestion = async (
  id: string,
  data: UpdateQuestionData,
  tx?: PrismaTransactionClient
): Promise<QuestionWithOptionRecords> => {
  const execute = async (client: PrismaTransactionClient) => {
    // 1. Prepare scalar fields for Question update
    const questionUpdatePayload: Prisma.QuestionUpdateInput = {}
    if (data.type !== undefined) questionUpdatePayload.type = data.type
    if (data.title !== undefined) questionUpdatePayload.title = data.title
    if (data.answer !== undefined) questionUpdatePayload.answer = data.answer
    if (data.points !== undefined) questionUpdatePayload.points = data.points

    // 2. Handle options replacement if explicitly provided
    if (data.options !== undefined) {
      // Delete old options
      await client.questionOption.deleteMany({
        where: { questionId: id }
      })

      // Insert new options if any
      if (data.options.length > 0) {
        await client.questionOption.createMany({
          data: data.options.map((optText, index) => ({
            questionId: id,
            optionText: optText,
            order: index
          }))
        })
      }
    }

    // 3. Update Question record & return with latest options
    return client.question.update({
      where: { id },
      data: questionUpdatePayload,
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  if (tx) {
    return execute(tx)
  }
  return prisma.$transaction((innerTx) => execute(innerTx as PrismaTransactionClient))
}

/**
 * Delete a single question by UUID.
 * Child question_options are cascaded automatically by PostgreSQL schema.
 */
export const deleteQuestion = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Question> => {
  const client = tx || prisma
  return client.question.delete({
    where: { id }
  })
}

/**
 * Delete all questions belonging to a specific quiz UUID.
 */
export const deleteQuestionsByQuizId = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<Prisma.BatchPayload> => {
  const client = tx || prisma
  return client.question.deleteMany({
    where: { quizId }
  })
}
