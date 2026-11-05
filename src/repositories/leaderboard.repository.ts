import { Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: LEADERBOARD & RANKING
 *
 * Interacts with PostgreSQL `users` table for competition leaderboard ranking.
 * Implements Standard Competition Ranking (RANK() 1224) via PostgreSQL window function.
 *
 * Strict Security Policy:
 * - Only selects public fields: id, username, avatar, xp_total, current_streak
 * - Excludes password, email, phone, tokens, and private fields at database engine level.
 */

export interface LeaderboardUserRow {
  id: string
  username: string
  avatar: string
  xpTotal: number
  currentStreak: number
  rank: number
}

export interface UserLeaderboardPositionRow {
  id: string
  username: string
  avatar: string
  xpTotal: number
  currentStreak: number
  rank: number
}

/**
 * Get paginated leaderboard users with deterministic competition ranking.
 * Ordering: xp_total DESC, id ASC
 */
export const getLeaderboardUsers = async (
  options: { skip: number; limit: number },
  tx?: PrismaTransactionClient
): Promise<LeaderboardUserRow[]> => {
  const client = tx || prisma
  return client.$queryRaw<LeaderboardUserRow[]>(
    Prisma.sql`
      SELECT * FROM (
        SELECT
          id,
          username,
          avatar,
          xp_total AS "xpTotal",
          current_streak AS "currentStreak",
          RANK() OVER (ORDER BY xp_total DESC)::int AS rank
        FROM users
      ) ranked
      ORDER BY "xpTotal" DESC, id ASC
      LIMIT ${options.limit} OFFSET ${options.skip}
    `
  )
}

/**
 * Count total eligible users on the leaderboard.
 */
export const countLeaderboardUsers = async (tx?: PrismaTransactionClient): Promise<number> => {
  const client = tx || prisma
  return client.user.count()
}

/**
 * Fetch a specific user's leaderboard position with global competition rank.
 */
export const getUserLeaderboardPosition = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<UserLeaderboardPositionRow | null> => {
  const client = tx || prisma
  const rows = await client.$queryRaw<UserLeaderboardPositionRow[]>(
    Prisma.sql`
      SELECT * FROM (
        SELECT
          id,
          username,
          avatar,
          xp_total AS "xpTotal",
          current_streak AS "currentStreak",
          RANK() OVER (ORDER BY xp_total DESC)::int AS rank
        FROM users
      ) ranked
      WHERE id = ${userId}::uuid
      LIMIT 1
    `
  )
  return rows[0] || null
}
