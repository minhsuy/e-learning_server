import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: XP & GAMIFICATION FOUNDATION
 *
 * Single Source of Truth for XP, Rank, Streak, and XPTransaction at Application Layer.
 * Physical Database constraints: prisma/schema.prisma
 */

export const XPTransactionType = {
  LESSON_COMPLETED: 'LESSON_COMPLETED',
  QUIZ_COMPLETED: 'QUIZ_COMPLETED',
  DAILY_STREAK: 'DAILY_STREAK',
  CODING_EXERCISE_COMPLETED: 'CODING_EXERCISE_COMPLETED'
} as const

export type XPTransactionType = (typeof XPTransactionType)[keyof typeof XPTransactionType]

// ==========================================
// 1. BUSINESS CONSTANTS & CONFIGURATION
// ==========================================

export const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh'

export const XP_REWARDS = {
  LESSON_COMPLETED: 70,
  QUIZ_COMPLETED: 100,
  DAILY_STREAK: 20
} as const

export const CODING_EXERCISE_REWARDS = {
  EASY: 30,
  MEDIUM: 50,
  HARD: 80
} as const

export interface RankDefinition {
  level: number
  name: string
  minXp: number
  maxXp?: number
}

export const XP_RANKS: readonly RankDefinition[] = [
  { level: 1, name: 'Beginner', minXp: 0, maxXp: 499 },
  { level: 2, name: 'Explorer', minXp: 500, maxXp: 1499 },
  { level: 3, name: 'Learner', minXp: 1500, maxXp: 2999 },
  { level: 4, name: 'Skilled', minXp: 3000, maxXp: 5999 },
  { level: 5, name: 'Advanced', minXp: 6000, maxXp: 9999 },
  { level: 6, name: 'Expert', minXp: 10000, maxXp: 19999 },
  { level: 7, name: 'Master', minXp: 20000 }
] as const

/**
 * Derives user Rank dynamically from xpTotal.
 * Rank is NEVER stored statically in the database.
 */
export function getRankFromXp(xpTotal: number): RankDefinition {
  const safeXp = Math.max(0, xpTotal || 0)
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (safeXp >= XP_RANKS[i].minXp) {
      return XP_RANKS[i]
    }
  }
  return XP_RANKS[0]
}

export interface RankDetailResult {
  rank: {
    level: number
    name: string
    minXp: number
    maxXp?: number
  }
  nextRank: {
    level: number
    name: string
    minXp: number
  } | null
  xpToNextRank: number
}

/**
 * Derives comprehensive rank details including next rank threshold and progress gap.
 */
export function getRankDetailFromXp(xpTotal: number): RankDetailResult {
  const safeXp = Math.max(0, xpTotal || 0)
  let currentIndex = 0
  for (let i = XP_RANKS.length - 1; i >= 0; i--) {
    if (safeXp >= XP_RANKS[i].minXp) {
      currentIndex = i
      break
    }
  }

  const currentRank = XP_RANKS[currentIndex]
  const nextRank = currentIndex < XP_RANKS.length - 1 ? XP_RANKS[currentIndex + 1] : null
  const xpToNextRank = nextRank ? Math.max(0, nextRank.minXp - safeXp) : 0

  return {
    rank: currentRank,
    nextRank: nextRank
      ? {
          level: nextRank.level,
          name: nextRank.name,
          minXp: nextRank.minXp
        }
      : null,
    xpToNextRank
  }
}

// ==========================================
// 2. DOMAIN SCHEMAS
// ==========================================

export const xpTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().int(),
  type: z.nativeEnum(XPTransactionType),
  eventKey: z.string().min(1).max(255),
  createdAt: z.date()
})

export type XPTransactionDomain = z.infer<typeof xpTransactionSchema>

export const createXPTransactionInputSchema = xpTransactionSchema.pick({
  userId: true,
  amount: true,
  type: true,
  eventKey: true
})

export type CreateXPTransactionInput = z.infer<typeof createXPTransactionInputSchema>
