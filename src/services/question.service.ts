import { QuestionType } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import {
  findQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  UpdateQuestionData,
  QuestionWithOptionRecords
} from '~/repositories/question.repository'
import { findQuizById } from '~/repositories/quiz.repository'
import { findLessonById } from '~/repositories/lesson.repository'
import { findCourseById } from '~/repositories/course.repository'
import { withCompatId } from '~/utils/uuid'
import { UserRole } from '~/types/enum'
import { CreateQuestionParams, ServiceResponse } from '~/types/type'

/**
 * Normalizes question type into legacy API lowercase string representation.
 */
function formatQuestionType(type?: string): 'multiple_choice' | 'fill_in_blank' {
  if (!type) return 'multiple_choice'
  const lower = String(type).toLowerCase()
  if (lower === 'fill_in_blank') return 'fill_in_blank'
  return 'multiple_choice'
}

/**
 * Serializes question record to preserve 100% backward compatibility with API contract:
 * - Adds `_id` alias matching `id` via `withCompatId`
 * - Exposes `quiz: question.quizId`
 * - Flattens `QuestionOption[]` to legacy `options: string[]`
 * - Formats enum type to lowercase string
 */
function formatSafeQuestion(question: QuestionWithOptionRecords | null) {
  if (!question) return null
  const options = Array.isArray(question.options)
    ? question.options.map((o) => (typeof o === 'string' ? o : o.optionText))
    : []

  return {
    ...withCompatId(question),
    quiz: question.quizId,
    type: formatQuestionType(question.type),
    title: question.title,
    options,
    answer: question.answer,
    points: question.points
  }
}

/**
 * Create a new question:
 * - Checks quiz existence
 * - Checks lesson & course ownership for Teacher role
 * - Saves question and child options via Question Repository
 */
export const createQuestionService = async (
  {
    userId,
    role,
    payload
  }: CreateQuestionParams,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { quiz, type, title, options, answer, points } = payload

  // 1. Verify Quiz exists
  const quizDoc = await findQuizById(quiz, tx)
  if (!quizDoc) {
    return { success: false, statusCode: 404, message: 'Quiz not found' }
  }

  // 2. Verify Course ownership for Teacher role
  if (role?.toLowerCase() === 'teacher') {
    const lessonDoc = await findLessonById(quizDoc.lessonId, tx)
    if (!lessonDoc) {
      return { success: false, statusCode: 404, message: 'Lesson not found' }
    }

    const courseDoc = await findCourseById(lessonDoc.courseId, tx)
    if (!courseDoc) {
      return { success: false, statusCode: 404, message: 'Course not found' }
    }

    if (courseDoc.authorId !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  // 3. Create question and options in PostgreSQL
  const question = await createQuestion(
    {
      quizId: quizDoc.id,
      type: type === 'fill_in_blank' ? QuestionType.FILL_IN_BLANK : QuestionType.MULTIPLE_CHOICE,
      title,
      options: Array.isArray(options) ? options : [],
      answer,
      points: points ? Number(points) : 1
    },
    tx
  )

  return {
    success: true,
    message: 'Question created successfully',
    data: formatSafeQuestion(question)
  }
}

/**
 * Update an existing question:
 * - Checks question and quiz existence
 * - Checks course ownership for Teacher role
 * - Preserves three distinct options behaviors:
 *   * options === undefined: keep options unchanged
 *   * options === []: clear all options
 *   * options = [...]: replace options with new elements
 */
export const updateQuestionService = async (
  {
    userId,
    role,
    questionId,
    payload
  }: {
    userId: string
    role: string
    questionId: string
    payload: any
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  // 1. Verify Question exists
  const question = await findQuestionById(questionId, tx)
  if (!question) {
    return { success: false, statusCode: 404, message: 'Question not found' }
  }

  // 2. Verify Quiz exists
  const quizDoc = await findQuizById(question.quizId, tx)
  if (!quizDoc) {
    return { success: false, statusCode: 404, message: 'Quiz not found' }
  }

  // 3. Verify Course ownership for Teacher role
  if (role?.toLowerCase() === 'teacher') {
    const lessonDoc = await findLessonById(quizDoc.lessonId, tx)
    if (!lessonDoc) {
      return { success: false, statusCode: 404, message: 'Lesson not found' }
    }

    const courseDoc = await findCourseById(lessonDoc.courseId, tx)
    if (!courseDoc) {
      return { success: false, statusCode: 404, message: 'Course not found' }
    }

    if (courseDoc.authorId !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  // 4. Prepare update payload
  const updateData: UpdateQuestionData = {}
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.answer !== undefined) updateData.answer = payload.answer
  if (payload.points !== undefined) updateData.points = Number(payload.points)
  if (payload.type !== undefined) {
    updateData.type = payload.type === 'fill_in_blank' ? QuestionType.FILL_IN_BLANK : QuestionType.MULTIPLE_CHOICE
  }
  if (payload.options !== undefined) {
    updateData.options = Array.isArray(payload.options) ? payload.options : []
  }

  const updatedQuestion = await updateQuestion(questionId, updateData, tx)

  return {
    success: true,
    message: 'Question updated successfully',
    data: formatSafeQuestion(updatedQuestion)
  }
}

/**
 * Delete a question:
 * - Checks question and quiz existence
 * - Checks course ownership for Teacher role
 * - Deletes question and cascades child options in PostgreSQL
 */
export const deleteQuestionService = async (
  {
    userId,
    role,
    questionId
  }: {
    userId: string
    role: string
    questionId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const question = await findQuestionById(questionId, tx)
  if (!question) {
    return { success: false, statusCode: 404, message: 'Question not found' }
  }

  const quizDoc = await findQuizById(question.quizId, tx)
  if (!quizDoc) {
    return { success: false, statusCode: 404, message: 'Quiz not found' }
  }

  if (role?.toLowerCase() === 'teacher') {
    const lessonDoc = await findLessonById(quizDoc.lessonId, tx)
    if (!lessonDoc) {
      return { success: false, statusCode: 404, message: 'Lesson not found' }
    }

    const courseDoc = await findCourseById(lessonDoc.courseId, tx)
    if (!courseDoc) {
      return { success: false, statusCode: 404, message: 'Course not found' }
    }

    if (courseDoc.authorId !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  await deleteQuestion(questionId, tx)

  return { success: true, message: 'Question deleted successfully' }
}
