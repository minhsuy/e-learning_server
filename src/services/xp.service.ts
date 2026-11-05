import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  createXPTransaction,
  findXPTransactionByEventKey,
  findXPTransactionsByUser,
  countXPTransactionsByUser,
  incrementUserXp
} from '~/repositories/xp.repository'
import { findUserById } from '~/repositories/user.repository'
import { XP_REWARDS, CODING_EXERCISE_REWARDS, XPTransactionType, getRankFromXp, getRankDetailFromXp } from '~/models/xp.model'
import { isValidUUID } from '~/utils/uuid'
import { ServiceResponse } from '~/types/type'

/**
 * TMDEMY — XP & GAMIFICATION SERVICE
 *
 * Manages XP awards, idempotency guarantees, and atomic transactions.
 * Single source of truth: PostgreSQL via Functional Repositories.
 */

export interface AwardLessonXpResult {
  success: boolean
  awarded: boolean
  amount: number
  eventKey: string
  newXpTotal?: number
  message: string
  data?: any
}

/**
 * Deterministic event key generator for lesson completion.
 * Format: lesson-complete:{userId}:{lessonId}
 */
export function buildLessonCompletionEventKey(userId: string, lessonId: string): string {
  return `lesson-complete:${userId}:${lessonId}`
}

/**
 * Awards XP for lesson completion with strict database-level idempotency and atomicity.
 *
 * Flow:
 * 1. Validate inputs (userId, lessonId)
 * 2. Generate deterministic eventKey: lesson-complete:{userId}:{lessonId}
 * 3. Inside atomic transaction:
 *    - Check if eventKey already exists -> if so, return idempotent success (no extra XP)
 *    - Create XPTransaction (+70 XP, LESSON_COMPLETED)
 *    - Increment User.xpTotal (+70 XP)
 *    - If race condition occurs (Prisma P2002 on eventKey) -> handle gracefully as idempotent success
 *
 * Both operations succeed together or fail together (rollback).
 */
export const awardLessonCompletionXP = async (
  {
    userId,
    lessonId
  }: {
    userId: string
    lessonId: string
  },
  tx?: PrismaTransactionClient
): Promise<AwardLessonXpResult> => {
  if (!userId || !isValidUUID(userId)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid userId for XP award'
    }
  }

  if (!lessonId || !isValidUUID(lessonId)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid lessonId for XP award'
    }
  }

  const eventKey = buildLessonCompletionEventKey(userId, lessonId)
  const xpAmount = XP_REWARDS.LESSON_COMPLETED

  const executeAtomicAward = async (clientTx: PrismaTransactionClient): Promise<AwardLessonXpResult> => {
    // 1. Check existing transaction by deterministic eventKey (pre-check)
    const existing = await findXPTransactionByEventKey(eventKey, clientTx)
    if (existing) {
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'XP already awarded for this lesson completion',
        data: existing
      }
    }

    // 2. Create XPTransaction record
    const transaction = await createXPTransaction(
      {
        userId,
        amount: xpAmount,
        type: XPTransactionType.LESSON_COMPLETED,
        eventKey
      },
      clientTx
    )

    // 3. Atomically increment User.xpTotal
    const updatedUser = await incrementUserXp(userId, xpAmount, clientTx)

    return {
      success: true,
      awarded: true,
      amount: xpAmount,
      eventKey,
      newXpTotal: updatedUser.xpTotal,
      message: `Awarded +${xpAmount} XP for lesson completion`,
      data: {
        transaction,
        newXpTotal: updatedUser.xpTotal
      }
    }
  }

  // Use provided transaction client or wrap in isolated atomic transaction
  if (tx) {
    try {
      return await executeAtomicAward(tx)
    } catch (err: any) {
      if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
        const fallback = await findXPTransactionByEventKey(eventKey, tx)
        return {
          success: true,
          awarded: false,
          amount: 0,
          eventKey,
          message: 'XP already awarded for this lesson completion (concurrent conflict resolved)',
          data: fallback
        }
      }
      throw err
    }
  }

  try {
    return await prisma.$transaction(async (clientTx) => {
      return executeAtomicAward(clientTx)
    })
  } catch (err: any) {
    // Handle concurrent duplicate race condition (Prisma P2002 on unique eventKey)
    if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
      const fallback = await findXPTransactionByEventKey(eventKey)
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'XP already awarded for this lesson completion (concurrent conflict resolved)',
        data: fallback
      }
    }
    // Re-throw any other database errors
    throw err
  }
}

export interface AwardQuizXpResult {
  success: boolean
  awarded: boolean
  amount: number
  eventKey: string
  newXpTotal?: number
  message: string
  data?: unknown
}

/**
 * Deterministic event key generator for quiz completion.
 * Format: quiz-complete:{userId}:{quizId}
 */
export function buildQuizCompletionEventKey(userId: string, quizId: string): string {
  return `quiz-complete:${userId}:${quizId}`
}

/**
 * Awards XP for quiz completion (+100 XP) with strict database-level idempotency and atomicity.
 * Format: quiz-complete:{userId}:{quizId}
 */
export const awardQuizCompletionXP = async (
  {
    userId,
    quizId
  }: {
    userId: string
    quizId: string
  },
  tx?: PrismaTransactionClient
): Promise<AwardQuizXpResult> => {
  if (!userId || !isValidUUID(userId)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid userId for Quiz XP award'
    }
  }

  if (!quizId || !isValidUUID(quizId)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid quizId for Quiz XP award'
    }
  }

  const eventKey = buildQuizCompletionEventKey(userId, quizId)
  const xpAmount = XP_REWARDS.QUIZ_COMPLETED

  const executeAtomicAward = async (clientTx: PrismaTransactionClient): Promise<AwardQuizXpResult> => {
    // 1. Check existing transaction by deterministic eventKey (pre-check)
    const existing = await findXPTransactionByEventKey(eventKey, clientTx)
    if (existing) {
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'XP already awarded for this quiz completion',
        data: existing
      }
    }

    // 2. Create XPTransaction record
    const transaction = await createXPTransaction(
      {
        userId,
        amount: xpAmount,
        type: XPTransactionType.QUIZ_COMPLETED,
        eventKey
      },
      clientTx
    )

    // 3. Atomically increment User.xpTotal
    const updatedUser = await incrementUserXp(userId, xpAmount, clientTx)

    return {
      success: true,
      awarded: true,
      amount: xpAmount,
      eventKey,
      newXpTotal: updatedUser.xpTotal,
      message: `Awarded +${xpAmount} XP for quiz completion`,
      data: {
        transaction,
        newXpTotal: updatedUser.xpTotal
      }
    }
  }

  if (tx) {
    try {
      return await executeAtomicAward(tx)
    } catch (err: any) {
      if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
        const fallback = await findXPTransactionByEventKey(eventKey, tx)
        return {
          success: true,
          awarded: false,
          amount: 0,
          eventKey,
          message: 'XP already awarded for this quiz completion (concurrent conflict resolved)',
          data: fallback
        }
      }
      throw err
    }
  }

  try {
    return await prisma.$transaction(async (clientTx) => {
      return executeAtomicAward(clientTx)
    })
  } catch (err: any) {
    if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
      const fallback = await findXPTransactionByEventKey(eventKey)
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'XP already awarded for this quiz completion (concurrent conflict resolved)',
        data: fallback
      }
    }
    throw err
  }
}

export interface AwardCodingExerciseXpResult {
  success: boolean
  awarded: boolean
  amount: number
  eventKey: string
  newXpTotal?: number
  message: string
  data?: unknown
}

/**
 * Deterministic event key generator for coding exercise completion reward.
 * Format: coding-exercise-complete:{userId}:{exerciseId}
 */
export function buildCodingExerciseCompletionEventKey(userId: string, exerciseId: string): string {
  return `coding-exercise-complete:${userId}:${exerciseId}`
}

/**
 * Awards dedicated Coding Exercise XP (+30 for EASY, +50 for MEDIUM, +80 for HARD)
 * with strict database-level idempotency and atomicity.
 * Format: coding-exercise-complete:{userId}:{exerciseId}
 */
export const awardCodingExerciseCompletionXP = async (
  {
    userId,
    exerciseId,
    difficulty = 'EASY'
  }: {
    userId: string
    exerciseId: string
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string
  },
  tx?: PrismaTransactionClient
): Promise<AwardCodingExerciseXpResult> => {
  if (!userId || !isValidUUID(userId)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid userId for Coding Exercise XP award'
    }
  }

  if (!exerciseId || !isValidUUID(exerciseId)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid exerciseId for Coding Exercise XP award'
    }
  }

  const eventKey = buildCodingExerciseCompletionEventKey(userId, exerciseId)
  const normDiff = (difficulty || 'EASY').toUpperCase()
  const xpAmount =
    normDiff === 'HARD'
      ? CODING_EXERCISE_REWARDS.HARD
      : normDiff === 'MEDIUM'
        ? CODING_EXERCISE_REWARDS.MEDIUM
        : CODING_EXERCISE_REWARDS.EASY

  const executeAtomicAward = async (clientTx: PrismaTransactionClient): Promise<AwardCodingExerciseXpResult> => {
    // 1. Check existing transaction by deterministic eventKey (pre-check)
    const existing = await findXPTransactionByEventKey(eventKey, clientTx)
    if (existing) {
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'XP already awarded for this coding exercise completion',
        data: existing
      }
    }

    // 2. Create XPTransaction record
    const transaction = await createXPTransaction(
      {
        userId,
        amount: xpAmount,
        type: XPTransactionType.CODING_EXERCISE_COMPLETED,
        eventKey
      },
      clientTx
    )

    // 3. Atomically increment User.xpTotal
    const updatedUser = await incrementUserXp(userId, xpAmount, clientTx)

    return {
      success: true,
      awarded: true,
      amount: xpAmount,
      eventKey,
      newXpTotal: updatedUser.xpTotal,
      message: `Awarded +${xpAmount} XP for coding exercise completion (${normDiff})`,
      data: {
        transaction,
        newXpTotal: updatedUser.xpTotal
      }
    }
  }

  if (tx) {
    try {
      return await executeAtomicAward(tx)
    } catch (err: any) {
      if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
        const fallback = await findXPTransactionByEventKey(eventKey, tx)
        return {
          success: true,
          awarded: false,
          amount: 0,
          eventKey,
          message: 'XP already awarded for this coding exercise completion (concurrent conflict resolved)',
          data: fallback
        }
      }
      throw err
    }
  }

  try {
    return await prisma.$transaction(async (clientTx) => {
      return executeAtomicAward(clientTx)
    })
  } catch (err: any) {
    if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
      const fallback = await findXPTransactionByEventKey(eventKey)
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'XP already awarded for this coding exercise completion (concurrent conflict resolved)',
        data: fallback
      }
    }
    throw err
  }
}

export interface AwardDailyStreakXpResult {
  success: boolean
  awarded: boolean
  amount: number
  eventKey: string
  newXpTotal?: number
  message: string
  data?: unknown
}

/**
 * Deterministic event key generator for daily streak reward.
 * Format: daily-streak:{userId}:{YYYY-MM-DD}
 */
export function buildDailyStreakEventKey(userId: string, dateStr: string): string {
  return `daily-streak:${userId}:${dateStr}`
}

/**
 * Awards Daily Streak XP (+20 XP) for the first learning activity of a business day.
 * Format: daily-streak:{userId}:{YYYY-MM-DD}
 */
export const awardDailyStreakXP = async (
  {
    userId,
    dateStr
  }: {
    userId: string
    dateStr: string
  },
  tx?: PrismaTransactionClient
): Promise<AwardDailyStreakXpResult> => {
  if (!userId || !isValidUUID(userId)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid userId for Daily Streak XP award'
    }
  }

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return {
      success: false,
      awarded: false,
      amount: 0,
      eventKey: '',
      message: 'Invalid dateStr format (expected YYYY-MM-DD)'
    }
  }

  const eventKey = buildDailyStreakEventKey(userId, dateStr)
  const xpAmount = XP_REWARDS.DAILY_STREAK

  const executeAtomicAward = async (clientTx: PrismaTransactionClient): Promise<AwardDailyStreakXpResult> => {
    // 1. Check existing transaction by deterministic eventKey (pre-check)
    const existing = await findXPTransactionByEventKey(eventKey, clientTx)
    if (existing) {
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'Daily streak XP already awarded for this date',
        data: existing
      }
    }

    // 2. Create XPTransaction record
    const transaction = await createXPTransaction(
      {
        userId,
        amount: xpAmount,
        type: XPTransactionType.DAILY_STREAK,
        eventKey
      },
      clientTx
    )

    // 3. Atomically increment User.xpTotal
    const updatedUser = await incrementUserXp(userId, xpAmount, clientTx)

    return {
      success: true,
      awarded: true,
      amount: xpAmount,
      eventKey,
      newXpTotal: updatedUser.xpTotal,
      message: `Awarded +${xpAmount} XP for daily streak`,
      data: {
        transaction,
        newXpTotal: updatedUser.xpTotal
      }
    }
  }

  if (tx) {
    try {
      return await executeAtomicAward(tx)
    } catch (err: any) {
      if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
        const fallback = await findXPTransactionByEventKey(eventKey, tx)
        return {
          success: true,
          awarded: false,
          amount: 0,
          eventKey,
          message: 'Daily streak XP already awarded for this date (concurrent conflict resolved)',
          data: fallback
        }
      }
      throw err
    }
  }

  try {
    return await prisma.$transaction(async (clientTx) => {
      return executeAtomicAward(clientTx)
    })
  } catch (err: any) {
    if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
      const fallback = await findXPTransactionByEventKey(eventKey)
      return {
        success: true,
        awarded: false,
        amount: 0,
        eventKey,
        message: 'Daily streak XP already awarded for this date (concurrent conflict resolved)',
        data: fallback
      }
    }
    throw err
  }
}

/**
 * Service to get a user's XP summary (total XP and dynamically derived rank).
 */
export const getUserXpSummaryService = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!userId || !isValidUUID(userId)) {
    return { success: false, statusCode: 400, message: 'Invalid userId' }
  }

  const user = await findUserById(userId, tx)
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  const xpTotal = user.xpTotal || 0
  const rankDetail = getRankDetailFromXp(xpTotal)

  return {
    success: true,
    message: 'Fetched user XP summary successfully',
    data: {
      userId: user.id,
      username: user.username,
      avatar: user.avatar || '',
      xpTotal,
      rank: {
        name: rankDetail.rank.name,
        minXP: rankDetail.rank.minXp,
        maxXP: rankDetail.rank.maxXp
      },
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActivityAt: user.lastActivityAt,
      nextRank: rankDetail.nextRank
        ? {
            name: rankDetail.nextRank.name,
            minXP: rankDetail.nextRank.minXp
          }
        : null,
      xpToNextRank: rankDetail.xpToNextRank
    }
  }
}

/**
 * Service to get a user's XP transaction history with pagination.
 */
export const getUserXpHistoryService = async (
  {
    userId,
    page = 1,
    limit = 20,
    type
  }: {
    userId: string
    page?: number
    limit?: number
    type?: XPTransactionType
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!userId || !isValidUUID(userId)) {
    return { success: false, statusCode: 400, message: 'Invalid userId' }
  }

  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20))
  const skip = (safePage - 1) * safeLimit

  const [transactions, total] = await Promise.all([
    findXPTransactionsByUser(userId, { skip, limit: safeLimit, type }, tx),
    countXPTransactionsByUser(userId, type, tx)
  ])

  return {
    success: true,
    message: 'Fetched XP history successfully',
    data: {
      transactions,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  }
}
