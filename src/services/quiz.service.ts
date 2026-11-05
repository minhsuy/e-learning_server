import { Prisma } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import {
  findQuizById,
  findQuizByLessonId,
  findQuizByLessonIdWithPublicQuestions,
  findQuizByLessonIdWithDetail,
  createQuiz,
  updateQuiz,
  deleteQuiz
} from '~/repositories/quiz.repository'
import { deleteQuestionsByQuizId } from '~/repositories/question.repository'
import { findLessonById } from '~/repositories/lesson.repository'
import { findCourseById } from '~/repositories/course.repository'
import { withCompatId } from '~/utils/uuid'
import { UserRole } from '~/types/enum'
import { CreateQuizParams, ServiceResponse, UpdateQuizParams } from '~/types/type'
import { Quiz } from '~/models/quiz.model'

/**
 * Format quiz entity to maintain 100% backward compatibility with API contract:
 * - Adds `_id` alias matching `id` via `withCompatId`
 * - Exposes `lesson: quiz.lessonId`
 * - Exposes `courseId: quiz.courseId`
 * - Exposes `passing_grade: quiz.passingGrade`
 * - Exposes `created_by: quiz.createdById`
 * - Exposes `questions: []`
 */
function formatSafeQuiz(quiz: Quiz | null) {
  if (!quiz) return null
  return {
    ...withCompatId(quiz),
    lesson: quiz.lessonId,
    courseId: quiz.courseId,
    passing_grade: quiz.passingGrade,
    created_by: quiz.createdById,
    questions: []
  }
}

/**
 * Create a new quiz for a lesson:
 * - Checks lesson existence
 * - Verifies course ownership for Teacher role
 * - Enforces 1-to-1 lesson-quiz constraint
 * - Saves quiz to PostgreSQL via Quiz Repository
 */
export const createQuizService = async (
  {
    userId,
    role,
    payload
  }: CreateQuizParams,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { lesson, title, description, duration, passing_grade, courseId } = payload

  // 1. Verify Lesson exists
  const lessonDoc = await findLessonById(lesson, tx)
  if (!lessonDoc) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  // 2. Verify Course existence & ownership for Teacher role
  if (courseId && courseId !== lessonDoc.courseId) {
    return { success: false, statusCode: 400, message: 'Course ID does not match lesson course' }
  }

  const targetCourseId = lessonDoc.courseId
  const courseDoc = await findCourseById(targetCourseId, tx)
  if (!courseDoc) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && courseDoc.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  // 3. Enforce 1-to-1 constraint: Lesson can have at most one Quiz
  const existingQuiz = await findQuizByLessonId(lessonDoc.id, tx)
  if (existingQuiz) {
    return { success: false, statusCode: 400, message: 'Lesson already has a quiz' }
  }

  // 4. Create Quiz in PostgreSQL
  const quiz = await createQuiz(
    {
      lessonId: lessonDoc.id,
      courseId: targetCourseId,
      createdById: userId,
      title,
      description: description || '',
      duration: duration ? Number(duration) : 0,
      passingGrade: passing_grade !== undefined ? Number(passing_grade) : 0
    },
    tx
  )

  return {
    success: true,
    message: 'Quiz created successfully',
    data: formatSafeQuiz(quiz)
  }
}

/**
 * Update an existing quiz:
 * - Verifies quiz existence
 * - Verifies course ownership for Teacher role
 * - Mutates allowed scalar fields via Quiz Repository
 */
export const updateQuizService = async (
  {
    quizId,
    userId,
    role,
    payload
  }: UpdateQuizParams,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const quiz = await findQuizById(quizId, tx)
  if (!quiz) {
    return { success: false, statusCode: 404, message: 'Quiz not found' }
  }

  // Verify ownership for Teacher role
  if (role === UserRole.TEACHER) {
    const lessonDoc = await findLessonById(quiz.lessonId, tx)
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

  const updateData: Prisma.QuizUncheckedUpdateInput = {}
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.description !== undefined) updateData.description = payload.description
  if (payload.duration !== undefined) updateData.duration = Number(payload.duration)
  if (payload.passing_grade !== undefined) updateData.passingGrade = Number(payload.passing_grade)

  const updatedQuiz = await updateQuiz(quizId, updateData, tx)

  return {
    success: true,
    message: 'Quiz updated successfully',
    data: formatSafeQuiz(updatedQuiz)
  }
}

/**
 * Delete a quiz:
 * - Verifies quiz existence
 * - Verifies course ownership for Teacher role
 * - Atomically deletes child questions and quiz via Repositories
 */
export const deleteQuizService = async (
  {
    quizId,
    userId,
    role
  }: {
    quizId: string
    userId: string
    role: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const quiz = await findQuizById(quizId, tx)
  if (!quiz) {
    return { success: false, statusCode: 404, message: 'Quiz not found' }
  }

  if (role === UserRole.TEACHER) {
    const lessonDoc = await findLessonById(quiz.lessonId, tx)
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

  // Delete child questions and then the quiz
  await deleteQuestionsByQuizId(quizId, tx)
  await deleteQuiz(quizId, tx)

  return { success: true, message: 'Quiz and its questions deleted successfully' }
}

/**
 * Get quizzes for a specific lesson:
 * - When requested by the course author (Teacher) or Admin: includes `answer` for management
 * - When requested by Student or Public: Anti-Cheat rule STRICTLY OMITS `answer` field
 * - Returns legacy array structure `data: [quiz]`
 */
export const getQuizzesByLessonService = async (
  lessonId: string,
  userContext?: { userId?: string; role?: string },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  let isAuthorizedTeacherOrAdmin = false

  if (userContext?.userId && userContext?.role) {
    const normalizedRole = userContext.role.toLowerCase()
    if (normalizedRole === 'admin') {
      isAuthorizedTeacherOrAdmin = true
    } else if (normalizedRole === 'teacher') {
      const lessonDoc = await findLessonById(lessonId, tx)
      if (lessonDoc) {
        const courseDoc = await findCourseById(lessonDoc.courseId, tx)
        if (courseDoc && courseDoc.authorId === userContext.userId) {
          isAuthorizedTeacherOrAdmin = true
        }
      }
    }
  }

  if (isAuthorizedTeacherOrAdmin) {
    const quizDetail = await findQuizByLessonIdWithDetail(lessonId, tx)
    if (!quizDetail) {
      return { success: false, statusCode: 404, message: 'No quizzes found for this lesson' }
    }

    const formattedQuiz = {
      ...withCompatId(quizDetail),
      lesson: quizDetail.lessonId,
      courseId: quizDetail.courseId,
      passing_grade: quizDetail.passingGrade,
      created_by: quizDetail.createdById,
      questions: quizDetail.questions.map((q) => ({
        ...withCompatId(q),
        quiz: q.quizId,
        type: q.type.toLowerCase(),
        title: q.title,
        options: q.options.map((opt) => opt.optionText),
        answer: q.answer,
        points: q.points
      }))
    }

    return {
      success: true,
      message: 'Quizzes fetched successfully',
      data: [formattedQuiz]
    }
  }

  // Student / Public access (Anti-Cheat: STRICTLY OMITS `answer` field)
  const quiz = await findQuizByLessonIdWithPublicQuestions(lessonId, tx)

  if (!quiz) {
    return { success: false, statusCode: 404, message: 'No quizzes found for this lesson' }
  }

  const formattedQuiz = {
    ...withCompatId(quiz),
    lesson: quiz.lessonId,
    courseId: quiz.courseId,
    passing_grade: quiz.passingGrade,
    created_by: quiz.createdById,
    questions: quiz.questions.map((q) => ({
      ...withCompatId(q),
      quiz: q.quizId,
      type: q.type.toLowerCase(),
      title: q.title,
      options: q.options.map((opt) => opt.optionText),
      points: q.points
      // Strictly NO `answer` field for students / public!
    }))
  }

  return {
    success: true,
    message: 'Quizzes fetched successfully',
    data: [formattedQuiz]
  }
}
