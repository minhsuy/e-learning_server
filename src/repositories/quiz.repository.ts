import { Prisma, Quiz } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: QUIZ
 * 
 * Single source of database operations for the Quiz entity on PostgreSQL via Prisma ORM.
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
 * Public quiz projection for syllabus overview and lesson preview.
 */
export const QUIZ_PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  duration: true,
  passingGrade: true,
  lessonId: true,
  courseId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.QuizSelect

export type QuizPublicPayload = Prisma.QuizGetPayload<{
  select: typeof QUIZ_PUBLIC_SELECT
}>

/**
 * Public quiz with nested public questions (Anti-Cheat: STRICTLY NO ANSWERS).
 * Used when students fetch quiz details for study sessions or testing.
 */
export const QUIZ_WITH_PUBLIC_QUESTIONS_SELECT = {
  id: true,
  title: true,
  description: true,
  duration: true,
  passingGrade: true,
  lessonId: true,
  courseId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  questions: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
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
    }
  }
} as const satisfies Prisma.QuizSelect

export type QuizWithPublicQuestionsPayload = Prisma.QuizGetPayload<{
  select: typeof QUIZ_WITH_PUBLIC_QUESTIONS_SELECT
}>

/**
 * Detail quiz projection with complete question details INCLUDING answers.
 * Authorized strictly for instructors, course owners, and administrators.
 */
export const QUIZ_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  duration: true,
  passingGrade: true,
  lessonId: true,
  courseId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  questions: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
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
    }
  }
} as const satisfies Prisma.QuizSelect

export type QuizDetailPayload = Prisma.QuizGetPayload<{
  select: typeof QUIZ_DETAIL_SELECT
}>

// ==========================================
// 2. READ OPERATIONS
// ==========================================

/**
 * Find a quiz by its primary key UUID.
 */
export const findQuizById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Quiz | null> => {
  const client = tx || prisma
  return client.quiz.findUnique({
    where: { id }
  })
}

/**
 * Find a quiz by UUID with public questions (Anti-Cheat: no answers included).
 */
export const findQuizByIdWithPublicQuestions = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<QuizWithPublicQuestionsPayload | null> => {
  const client = tx || prisma
  return client.quiz.findUnique({
    where: { id },
    select: QUIZ_WITH_PUBLIC_QUESTIONS_SELECT
  })
}

/**
 * Find a quiz by UUID with full question details including answers (Teacher/Admin).
 */
export const findQuizByIdWithDetail = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<QuizDetailPayload | null> => {
  const client = tx || prisma
  return client.quiz.findUnique({
    where: { id },
    select: QUIZ_DETAIL_SELECT
  })
}

/**
 * Find a quiz by lesson UUID.
 * Respects the physical @unique constraint on lessonId.
 */
export const findQuizByLessonId = async (
  lessonId: string,
  tx?: PrismaTransactionClient
): Promise<Quiz | null> => {
  const client = tx || prisma
  return client.quiz.findUnique({
    where: { lessonId }
  })
}

/**
 * Find a quiz by lesson UUID with student-safe public questions (no answers).
 */
export const findQuizByLessonIdWithPublicQuestions = async (
  lessonId: string,
  tx?: PrismaTransactionClient
): Promise<QuizWithPublicQuestionsPayload | null> => {
  const client = tx || prisma
  return client.quiz.findUnique({
    where: { lessonId },
    select: QUIZ_WITH_PUBLIC_QUESTIONS_SELECT
  })
}

/**
 * Find a quiz by lesson UUID with complete question details including answers (Teacher/Admin).
 */
export const findQuizByLessonIdWithDetail = async (
  lessonId: string,
  tx?: PrismaTransactionClient
): Promise<QuizDetailPayload | null> => {
  const client = tx || prisma
  return client.quiz.findUnique({
    where: { lessonId },
    select: QUIZ_DETAIL_SELECT
  })
}

/**
 * Find all quizzes belonging to a specific course UUID.
 */
export const findQuizzesByCourseId = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Quiz[]> => {
  const client = tx || prisma
  return client.quiz.findMany({
    where: { courseId },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Find all quizzes belonging to a course UUID with student-safe public questions.
 */
export const findQuizzesByCourseIdWithPublicQuestions = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<QuizWithPublicQuestionsPayload[]> => {
  const client = tx || prisma
  return client.quiz.findMany({
    where: { courseId },
    select: QUIZ_WITH_PUBLIC_QUESTIONS_SELECT,
    orderBy: { createdAt: 'asc' }
  })
}

// ==========================================
// 3. WRITE OPERATIONS
// ==========================================

/**
 * Create a new quiz in PostgreSQL.
 */
export const createQuiz = async (
  data: Prisma.QuizUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<Quiz> => {
  const client = tx || prisma
  return client.quiz.create({
    data
  })
}

/**
 * Update an existing quiz by primary key UUID.
 */
export const updateQuiz = async (
  id: string,
  data: Prisma.QuizUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<Quiz> => {
  const client = tx || prisma
  return client.quiz.update({
    where: { id },
    data
  })
}

/**
 * Delete a quiz by primary key UUID.
 * Note: PostgreSQL foreign key cascading automatically deletes child questions
 * and question_options as configured in prisma/schema.prisma.
 */
export const deleteQuiz = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Quiz> => {
  const client = tx || prisma
  return client.quiz.delete({
    where: { id }
  })
}
