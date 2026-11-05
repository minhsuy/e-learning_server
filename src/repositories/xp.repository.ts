import { Prisma, XPTransaction } from '@prisma/client'
import { XPTransactionType } from '~/models/xp.model'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: XP & GAMIFICATION
 *
 * Provides database operations on PostgreSQL `xp_transactions` and `users.xp_total`
 * via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const XP_TRANSACTION_PUBLIC_SELECT = {
  id: true,
  userId: true,
  amount: true,
  type: true,
  eventKey: true,
  createdAt: true
} as const satisfies Prisma.XPTransactionSelect

export type XPTransactionPublicPayload = Prisma.XPTransactionGetPayload<{
  select: typeof XP_TRANSACTION_PUBLIC_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Find an XP transaction by its unique deterministic eventKey.
 */
export const findXPTransactionByEventKey = async (
  eventKey: string,
  tx?: PrismaTransactionClient
): Promise<XPTransactionPublicPayload | null> => {
  const client = tx || prisma
  return client.xPTransaction.findUnique({
    where: { eventKey },
    select: XP_TRANSACTION_PUBLIC_SELECT
  })
}

/**
 * Create a new XP transaction record.
 */
export const createXPTransaction = async (
  data: {
    userId: string
    amount: number
    type: XPTransactionType
    eventKey: string
  },
  tx?: PrismaTransactionClient
): Promise<XPTransactionPublicPayload> => {
  const client = tx || prisma
  return client.xPTransaction.create({
    data: {
      userId: data.userId,
      amount: data.amount,
      type: data.type,
      eventKey: data.eventKey
    },
    select: XP_TRANSACTION_PUBLIC_SELECT
  })
}

/**
 * Atomically increment a user's xpTotal.
 */
export const incrementUserXp = async (
  userId: string,
  amount: number,
  tx?: PrismaTransactionClient
): Promise<{ id: string; xpTotal: number }> => {
  const client = tx || prisma
  return client.user.update({
    where: { id: userId },
    data: {
      xpTotal: {
        increment: amount
      }
    },
    select: {
      id: true,
      xpTotal: true
    }
  })
}

/**
 * Find XP transactions for a user, ordered by creation date descending.
 */
export const findXPTransactionsByUser = async (
  userId: string,
  options?: {
    limit?: number
    skip?: number
    type?: XPTransactionType
  },
  tx?: PrismaTransactionClient
): Promise<XPTransactionPublicPayload[]> => {
  const client = tx || prisma
  return client.xPTransaction.findMany({
    where: {
      userId,
      ...(options?.type ? { type: options.type } : {})
    },
    select: XP_TRANSACTION_PUBLIC_SELECT,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: options?.limit,
    skip: options?.skip
  })
}

/**
 * Count total XP transactions for a user.
 */
export const countXPTransactionsByUser = async (
  userId: string,
  type?: XPTransactionType,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.xPTransaction.count({
    where: {
      userId,
      ...(type ? { type } : {})
    }
  })
}

export interface UpdateUserStreakData {
  currentStreak: number
  longestStreak: number
  lastActivityAt: Date
  xpIncrement?: number
}

export interface UserStreakInfoPayload {
  id: string
  currentStreak: number
  longestStreak: number
  lastActivityAt: Date | null
  xpTotal: number
}

/**
 * Fetch a user's streak and XP status.
 */
export const getUserStreakInfo = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<UserStreakInfoPayload | null> => {
  const client = tx || prisma
  return client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      lastActivityAt: true,
      xpTotal: true
    }
  })
}

/**
 * Atomically update a user's currentStreak, longestStreak, lastActivityAt,
 * and optionally increment xpTotal if daily streak XP was awarded.
 */
export const updateUserStreakAndXp = async (
  userId: string,
  data: UpdateUserStreakData,
  tx?: PrismaTransactionClient
): Promise<UserStreakInfoPayload> => {
  const client = tx || prisma
  return client.user.update({
    where: { id: userId },
    data: {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActivityAt: data.lastActivityAt,
      ...(data.xpIncrement && data.xpIncrement > 0 ? { xpTotal: { increment: data.xpIncrement } } : {})
    },
    select: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      lastActivityAt: true,
      xpTotal: true
    }
  })
}
