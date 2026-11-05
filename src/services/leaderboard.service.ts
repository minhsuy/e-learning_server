import { PrismaTransactionClient } from '~/config/prisma'
import {
  getLeaderboardUsers,
  countLeaderboardUsers,
  getUserLeaderboardPosition
} from '~/repositories/leaderboard.repository'
import { getRankFromXp } from '~/models/xp.model'
import { isValidUUID } from '~/utils/uuid'
import { ServiceResponse } from '~/types/type'

/**
 * TMDEMY — LEADERBOARD & RANKING SERVICE
 *
 * Provides read-side leaderboard queries, pagination, competition ranking,
 * and current user ranking position.
 */

export interface LeaderboardItemResponse {
  rank: number
  userId: string
  username: string
  avatar: string
  xpTotal: number
  currentStreak: number
  rankName: string
  rankLevel: number
}

/**
 * Fetch paginated leaderboard with competition ranking.
 * Supports optional `currentUserId` to resolve user's own ranking on the board.
 */
export const getLeaderboardService = async (
  {
    page = 1,
    limit = 20,
    currentUserId
  }: {
    page?: number
    limit?: number
    currentUserId?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const rawPage = Number(page)
  const safePage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const rawLimit = Number(limit)
  const safeLimit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(100, rawLimit)
  const skip = (safePage - 1) * safeLimit

  const [rows, total, currentUserPos] = await Promise.all([
    getLeaderboardUsers({ skip, limit: safeLimit }, tx),
    countLeaderboardUsers(tx),
    currentUserId && isValidUUID(currentUserId) ? getUserLeaderboardPosition(currentUserId, tx) : Promise.resolve(null)
  ])

  const leaderboard: LeaderboardItemResponse[] = rows.map((row) => {
    const rankInfo = getRankFromXp(row.xpTotal)
    return {
      rank: Number(row.rank),
      userId: row.id,
      username: row.username,
      avatar: row.avatar || '',
      xpTotal: row.xpTotal,
      currentStreak: row.currentStreak,
      rankName: rankInfo.name,
      rankLevel: rankInfo.level
    }
  })

  let currentUserData: LeaderboardItemResponse | undefined
  if (currentUserPos) {
    const myRankInfo = getRankFromXp(currentUserPos.xpTotal)
    currentUserData = {
      rank: Number(currentUserPos.rank),
      userId: currentUserPos.id,
      username: currentUserPos.username,
      avatar: currentUserPos.avatar || '',
      xpTotal: currentUserPos.xpTotal,
      currentStreak: currentUserPos.currentStreak,
      rankName: myRankInfo.name,
      rankLevel: myRankInfo.level
    }
  }

  return {
    success: true,
    message: 'Fetched leaderboard successfully',
    data: {
      leaderboard,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      },
      ...(currentUserData ? { currentUser: currentUserData } : {})
    }
  }
}

/**
 * Fetch a specific authenticated user's leaderboard position.
 */
export const getUserLeaderboardPositionService = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!userId || !isValidUUID(userId)) {
    return { success: false, statusCode: 400, message: 'Invalid userId' }
  }

  const pos = await getUserLeaderboardPosition(userId, tx)
  if (!pos) {
    return { success: false, statusCode: 404, message: 'User not found on leaderboard' }
  }

  const rankInfo = getRankFromXp(pos.xpTotal)

  return {
    success: true,
    message: 'Fetched user leaderboard position successfully',
    data: {
      userId: pos.id,
      username: pos.username,
      avatar: pos.avatar || '',
      xpTotal: pos.xpTotal,
      rank: Number(pos.rank),
      rankName: rankInfo.name,
      rankLevel: rankInfo.level,
      currentStreak: pos.currentStreak
    }
  }
}
