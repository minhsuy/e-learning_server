import QuestionModel from '~/models/question.model'
import QuizModel from '~/models/quiz.model'
import LessonModel from '~/models/lesson.model'
import { Types } from 'mongoose'
import { CreateQuestionParams, ServiceResponse } from '~/types/type'
import { UserRole } from '~/types/enum'
export const createQuestionService = async ({
  userId,
  role,
  payload
}: CreateQuestionParams): Promise<ServiceResponse> => {
  const { quiz, type, title, options, answer, points } = payload

  const quizDoc = await QuizModel.findById(quiz).populate<{ lesson: any }>('lesson')
  if (!quizDoc) return { success: false, statusCode: 404, message: 'Quiz not found' }

  if (role === UserRole.TEACHER) {
    const lessonDoc = await LessonModel.findById(quizDoc.lesson._id).populate<{ course: any }>('course', 'author')
    if (!lessonDoc) return { success: false, statusCode: 404, message: 'Lesson not found' }
    if (lessonDoc.course.author.toString() !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  const question = await QuestionModel.create({
    quiz: new Types.ObjectId(quiz),
    type,
    title,
    options: options || [],
    answer,
    points: points || 1
  })

  quizDoc.questions.push(question._id as any)
  await quizDoc.save()

  return { success: true, message: 'Question created successfully', data: question }
}

// Update Question
export const updateQuestionService = async ({
  userId,
  role,
  questionId,
  payload
}: {
  userId: string
  role: string
  questionId: string
  payload: any
}): Promise<ServiceResponse> => {
  const question = await QuestionModel.findById(questionId)
  if (!question) return { success: false, statusCode: 404, message: 'Question not found' }

  const quizDoc = await QuizModel.findById(question.quiz).populate<{ lesson: any }>('lesson')
  if (!quizDoc) return { success: false, statusCode: 404, message: 'Quiz not found' }

  if (role === UserRole.TEACHER) {
    const lessonDoc = await LessonModel.findById(quizDoc.lesson).populate<{ course: any }>('course', 'author')
    if (!lessonDoc) return { success: false, statusCode: 404, message: 'Lesson not found' }
    if (lessonDoc.course.author.toString() !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  if (payload.title !== undefined) question.title = payload.title
  if (payload.options !== undefined) question.options = payload.options
  if (payload.answer !== undefined) question.answer = payload.answer
  if (payload.points !== undefined) question.points = payload.points
  if (payload.type !== undefined) question.type = payload.type

  await question.save()
  return { success: true, message: 'Question updated successfully', data: question }
}

// Delete Question
export const deleteQuestionService = async ({
  userId,
  role,
  questionId
}: {
  userId: string
  role: string
  questionId: string
}): Promise<ServiceResponse> => {
  const question = await QuestionModel.findById(questionId)
  if (!question) return { success: false, statusCode: 404, message: 'Question not found' }

  const quizDoc = await QuizModel.findById(question.quiz).populate<{ lesson: any }>('lesson')
  if (!quizDoc) return { success: false, statusCode: 404, message: 'Quiz not found' }

  if (role === UserRole.TEACHER) {
    const lessonDoc = await LessonModel.findById(quizDoc.lesson).populate<{ course: any }>('course', 'author')
    if (!lessonDoc) return { success: false, statusCode: 404, message: 'Lesson not found' }
    if (lessonDoc.course.author.toString() !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  await QuizModel.findByIdAndUpdate(quizDoc._id, { $pull: { questions: question._id } })
  await question.deleteOne()

  return { success: true, message: 'Question deleted successfully' }
}
