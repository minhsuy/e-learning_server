import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { getLeaderboardService, getUserLeaderboardPositionService } from '~/services/leaderboard.service'

/**
 * TMDEMY — CONTROLLER: LEADERBOARD
 *
 * Handles HTTP transport for global leaderboard and ranking queries.
 */

export const getLeaderboardController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const page = req.query.page ? Number(req.query.page) : 1
  const limit = req.query.limit ? Number(req.query.limit) : 20
  const includeMe = req.query.includeMe === 'true'

  const currentUserId = includeMe && req.user ? (req.user as { userId: string }).userId : undefined

  const result = await getLeaderboardService({ page, limit, currentUserId })
  return res.status(result.statusCode || 200).json(result)
})

export const getUserLeaderboardPositionController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const result = await getUserLeaderboardPositionService(userId)
  return res.status(result.statusCode || 200).json(result)
})
