import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { getUserXpSummaryService, getUserXpHistoryService } from '~/services/xp.service'
import { getUserStreakService } from '~/services/streak.service'
import { XPTransactionType } from '~/models/xp.model'

/**
 * TMDEMY — CONTROLLER: GAMIFICATION (XP & STREAK)
 *
 * Handles HTTP transport for personal Gamification read operations (XP summary, Streak, XP history).
 */

export const getUserXpSummaryController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const result = await getUserXpSummaryService(userId)
  return res.status(result.statusCode || 200).json(result)
})

export const getUserStreakController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const result = await getUserStreakService(userId)
  return res.status(result.statusCode || 200).json(result)
})

export const getUserXpHistoryController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const page = req.query.page ? Number(req.query.page) : 1
  const limit = req.query.limit ? Number(req.query.limit) : 20
  const type = req.query.type as XPTransactionType | undefined

  const result = await getUserXpHistoryService({ userId, page, limit, type })
  return res.status(result.statusCode || 200).json(result)
})
