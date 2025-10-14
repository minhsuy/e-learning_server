import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { createQuestionService, deleteQuestionService, updateQuestionService } from '~/services/question.service'

export const createQuestionController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const payload = req.body

  const result = await createQuestionService({ userId, role, payload })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

export const updateQuestionController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const { questionId } = req.params
  const result = await updateQuestionService({ userId, role, questionId, payload: req.body })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

export const deleteQuestionController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const { questionId } = req.params
  const result = await deleteQuestionService({ userId, role, questionId })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})
