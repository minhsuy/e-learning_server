import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  getAllQuizSubmissionsService,
  getQuizAnalyticsService,
  getQuizSubmissionService,
  submitQuizService
} from '~/services/quizSubmission.service'
import { SubmitQuizInput } from '~/models/quizSubmission.model'

/**
 * Controller: POST /api/submissions (submit quiz)
 */
export const submitQuizController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { userId?: string; id?: string; role?: string } | undefined
  const userId = user?.userId || user?.id || ''
  const { quizId, answers } = req.body as SubmitQuizInput

  const result = await submitQuizService({ userId, quizId, answers })
  res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

/**
 * Controller: GET /api/submissions/:quizId (student view submission)
 */
export const getQuizSubmissionController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { userId?: string; id?: string } | undefined
  const userId = user?.userId || user?.id || ''
  const quizId = Array.isArray(req.params.quizId) ? req.params.quizId[0] : req.params.quizId
  const result = await getQuizSubmissionService(quizId, userId)
  res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

/**
 * Controller: GET /api/submissions/teacher/:quizId (teacher view all submissions)
 */
export const getAllQuizSubmissionsController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const quizId = Array.isArray(req.params.quizId) ? req.params.quizId[0] : req.params.quizId
  const result = await getAllQuizSubmissionsService(quizId)
  res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

/**
 * Controller: GET /api/submissions/teacher/analytics/:quizId (teacher view quiz analytics)
 */
export const getQuizAnalyticsController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const quizId = Array.isArray(req.params.quizId) ? req.params.quizId[0] : req.params.quizId
  const result = await getQuizAnalyticsService(quizId)
  res.status(result.success ? 200 : result.statusCode || 400).json(result)
})
