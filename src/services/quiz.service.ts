import QuizModel from '~/models/quiz.model'
import LessonModel, { Lesson } from '~/models/lesson.model'
import { Types } from 'mongoose'
import { CreateQuizParams, ServiceResponse, UpdateQuizParams } from '~/types/type'
import { UserRole } from '~/types/enum'
import { Course } from '~/models/course.model'
import { User } from '~/models/user.model'
import QuestionModel from '~/models/question.model'

export const createQuizService = async ({ userId, role, payload }: CreateQuizParams): Promise<ServiceResponse> => {
  const { lesson, title, description, duration, passing_grade } = payload

  const lessonDoc = await LessonModel.findById(lesson)
    .populate<{ course: Course & { author: User } }>('course', 'author _id title')
    .populate({
      path: 'course.author',
      select: '_id username'
    })
  if (!lessonDoc) return { success: false, statusCode: 404, message: 'Lesson not found' }
  if (role === UserRole.TEACHER && lessonDoc.course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const existingQuiz = await QuizModel.findOne({ lesson: lessonDoc._id })
  if (existingQuiz) return { success: false, statusCode: 400, message: 'Lesson already has a quiz' }

  const quiz = await QuizModel.create({
    lesson: new Types.ObjectId(lesson),
    title,
    description: description || '',
    duration: duration || 0,
    passing_grade: passing_grade || 0,
    questions: [],
    created_by: new Types.ObjectId(userId)
  })

  return { success: true, message: 'Quiz created successfully', data: quiz }
}

// update quiz

export const updateQuizService = async ({
  quizId,
  userId,
  role,
  payload
}: UpdateQuizParams): Promise<ServiceResponse> => {
  const quiz = await QuizModel.findById(quizId).populate<{ lesson: Lesson }>('lesson')

  if (!quiz) return { success: false, statusCode: 404, message: 'Quiz not found' }

  if (role === UserRole.TEACHER) {
    const lessonDoc = await LessonModel.findById(quiz.lesson._id)
      .populate<{ course: Course & { author: any } }>('course', 'author _id title')
      .populate({
        path: 'course.author',
        select: '_id username'
      })
    if (!lessonDoc) return { success: false, statusCode: 404, message: 'Lesson not found' }

    if (lessonDoc.course.author.toString() !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  if (payload.title !== undefined) quiz.title = payload.title
  if (payload.description !== undefined) quiz.description = payload.description
  if (payload.duration !== undefined) quiz.duration = payload.duration
  if (payload.passing_grade !== undefined) quiz.passing_grade = payload.passing_grade

  await quiz.save()

  return { success: true, message: 'Quiz updated successfully', data: quiz }
}

// Delete Quiz
export const deleteQuizService = async ({
  quizId,
  userId,
  role
}: {
  quizId: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const quiz = await QuizModel.findById(quizId).populate<{ lesson: any }>('lesson')
  if (!quiz) return { success: false, statusCode: 404, message: 'Quiz not found' }

  if (role === UserRole.TEACHER) {
    const lessonDoc = await LessonModel.findById(quiz.lesson._id).populate<{ course: any }>('course', 'author')
    if (!lessonDoc) return { success: false, statusCode: 404, message: 'Lesson not found' }
    if (lessonDoc.course.author.toString() !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  await QuestionModel.deleteMany({ quiz: quiz._id })

  await quiz.deleteOne()

  return { success: true, message: 'Quiz and its questions deleted successfully' }
}
