import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  createQuizService,
  deleteQuizService,
  getQuizzesByLessonService,
  updateQuizService
} from '~/services/quiz.service'

export const createQuizController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }

  const payload = req.body

  const result = await createQuizService({ userId, role, payload })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

// update quiz
export const updateQuizController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const quizId = Array.isArray(req.params.quizId) ? req.params.quizId[0] : req.params.quizId
  const { userId, role } = req.user as { userId: string; role: string }

  const payload = req.body

  const result = await updateQuizService({ quizId, userId, role, payload })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})
// delete quiz
export const deleteQuizController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const quizId = Array.isArray(req.params.quizId) ? req.params.quizId[0] : req.params.quizId
  const result = await deleteQuizService({ quizId, userId, role })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

// get quiz for lesson :
export const getQuizzesByLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId

  const result = await getQuizzesByLessonService(lessonId)

  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})
