import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  getAllQuizSubmissionsService,
  getQuizAnalyticsService,
  getQuizSubmissionService,
  submitQuizService
} from '~/services/quizSubmission.service'

export const submitQuizController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string; role: string }
  const { quizId, answers } = req.body

  const result = await submitQuizService({ userId, quizId, answers })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

// get quiz
export const getQuizSubmissionController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { quizId } = req.params
  const result = await getQuizSubmissionService(quizId, userId)
  res.status(result.success ? 200 : 400).json(result)
})
// get all quiz foor teacher
export const getAllQuizSubmissionsController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { quizId } = req.params
  const result = await getAllQuizSubmissionsService(quizId)
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})
// get quiz analysis
export const getQuizAnalyticsController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { quizId } = req.params
  const result = await getQuizAnalyticsService(quizId)
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})
