import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  getUserStreakInfo,
  updateUserStreakAndXp,
  createXPTransaction,
  findXPTransactionByEventKey
} from '~/repositories/xp.repository'
import { BUSINESS_TIMEZONE, XP_REWARDS, XPTransactionType } from '~/models/xp.model'
import { isValidUUID } from '~/utils/uuid'
import { buildDailyStreakEventKey } from '~/services/xp.service'
import { ServiceResponse } from '~/types/type'

/**
 * TMDEMY — STREAK & LEARNING ACTIVITY SERVICE
 *
 * Manages learning activity streak calculations, streak transitions,
 * timezone boundaries (Asia/Ho_Chi_Minh), and atomic daily streak XP awards.
 *
 * Rules:
 * - Timezone: Asia/Ho_Chi_Minh (UTC+7)
 * - First activity ever -> currentStreak = 1, longestStreak = 1, +20 XP
 * - Same business day -> streak unchanged, 0 additional Daily XP
 * - Consecutive day -> currentStreak + 1, longestStreak = max(longest, current), +20 XP
 * - Broken streak (gap > 1 day) -> currentStreak = 1, longestStreak preserved, +20 XP
 */

/**
 * Format a Date into YYYY-MM-DD string in Asia/Ho_Chi_Minh timezone.
 */
export function getHoChiMinhDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIMEZONE }).format(date)
}

/**
 * Calculate difference in calendar days between two YYYY-MM-DD date strings.
 * Returns > 0 if toYmd is after fromYmd, 0 if same day, < 0 if earlier.
 */
export function getDayDifference(fromYmd: string, toYmd: string): number {
  const [y1, m1, d1] = fromYmd.split('-').map(Number)
  const [y2, m2, d2] = toYmd.split('-').map(Number)
  const utc1 = Date.UTC(y1, m1 - 1, d1)
  const utc2 = Date.UTC(y2, m2 - 1, d2)
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  return Math.round((utc2 - utc1) / MS_PER_DAY)
}

export interface StreakTransitionResult {
  currentStreak: number
  longestStreak: number
  isFirstActivityToday: boolean
}

/**
 * Pure transition function calculating streak updates from user state and activity date.
 */
export function calculateStreakTransition(params: {
  currentStreak: number
  longestStreak: number
  lastActivityAt: Date | null
  activityDate: Date
}): StreakTransitionResult {
  const { currentStreak, longestStreak, lastActivityAt, activityDate } = params
  const todayStr = getHoChiMinhDateString(activityDate)

  if (!lastActivityAt) {
    const newCurrent = 1
    const newLongest = Math.max(longestStreak || 0, newCurrent)
    return {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      isFirstActivityToday: true
    }
  }

  const lastDateStr = getHoChiMinhDateString(lastActivityAt)
  const diffInDays = getDayDifference(lastDateStr, todayStr)

  if (diffInDays === 0) {
    // Same business day: streak does not increment, no new daily reward
    return {
      currentStreak,
      longestStreak: Math.max(longestStreak || 0, currentStreak),
      isFirstActivityToday: false
    }
  }

  if (diffInDays === 1) {
    // Consecutive day: streak increments by 1
    const newCurrent = (currentStreak || 0) + 1
    const newLongest = Math.max(longestStreak || 0, newCurrent)
    return {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      isFirstActivityToday: true
    }
  }

  if (diffInDays > 1) {
    // Broken streak: streak resets to 1, longest streak preserved
    const newCurrent = 1
    const newLongest = Math.max(longestStreak || 0, newCurrent)
    return {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      isFirstActivityToday: true
    }
  }

  // diffInDays < 0: Past activity timestamp
  return {
    currentStreak,
    longestStreak,
    isFirstActivityToday: false
  }
}

export interface RecordStreakResult {
  success: boolean
  currentStreak: number
  longestStreak: number
  lastActivityAt: Date | null
  dailyXpAwarded: number
  isFirstActivityToday: boolean
  eventKey?: string
  message: string
}

/**
 * Records a learning activity for a user, updates streak fields,
 * and atomically awards Daily Streak XP (+20 XP) if it is the first activity of the business day.
 */
export const recordLearningActivityStreak = async (
  {
    userId,
    activityDate = new Date()
  }: {
    userId: string
    activityDate?: Date
  },
  tx?: PrismaTransactionClient
): Promise<RecordStreakResult> => {
  if (!userId || !isValidUUID(userId)) {
    return {
      success: false,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null,
      dailyXpAwarded: 0,
      isFirstActivityToday: false,
      message: 'Invalid userId for streak recording'
    }
  }

  const executeAtomicStreak = async (
    clientTx: PrismaTransactionClient,
    skipDailyXpAttempt = false
  ): Promise<RecordStreakResult> => {
    // 1. Fetch current user streak state
    const user = await getUserStreakInfo(userId, clientTx)
    if (!user) {
      return {
        success: false,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityAt: null,
        dailyXpAwarded: 0,
        isFirstActivityToday: false,
        message: 'User not found'
      }
    }

    const todayStr = getHoChiMinhDateString(activityDate)
    const transition = calculateStreakTransition({
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActivityAt: user.lastActivityAt,
      activityDate
    })

    let dailyXpAwarded = 0
    let dailyEventKey: string | undefined

    // 2. Award Daily Streak XP (+20 XP) if first activity of the day
    if (transition.isFirstActivityToday && !skipDailyXpAttempt) {
      dailyEventKey = buildDailyStreakEventKey(userId, todayStr)

      // Pre-check for duplicate transaction
      const existingTxn = await findXPTransactionByEventKey(dailyEventKey, clientTx)
      if (!existingTxn) {
        await createXPTransaction(
          {
            userId,
            amount: XP_REWARDS.DAILY_STREAK,
            type: XPTransactionType.DAILY_STREAK,
            eventKey: dailyEventKey
          },
          clientTx
        )
        dailyXpAwarded = XP_REWARDS.DAILY_STREAK
      } else {
        dailyXpAwarded = 0
      }
    }

    // 3. Atomically update user streak and xp
    const updatedUser = await updateUserStreakAndXp(
      userId,
      {
        currentStreak: transition.currentStreak,
        longestStreak: transition.longestStreak,
        lastActivityAt: activityDate,
        xpIncrement: dailyXpAwarded
      },
      clientTx
    )

    return {
      success: true,
      currentStreak: updatedUser.currentStreak,
      longestStreak: updatedUser.longestStreak,
      lastActivityAt: updatedUser.lastActivityAt,
      dailyXpAwarded,
      isFirstActivityToday: transition.isFirstActivityToday,
      eventKey: dailyEventKey,
      message:
        dailyXpAwarded > 0
          ? `Streak updated to ${updatedUser.currentStreak} (+${dailyXpAwarded} XP daily streak)`
          : `Streak maintained at ${updatedUser.currentStreak}`
    }
  }

  if (tx) {
    try {
      return await executeAtomicStreak(tx)
    } catch (err: any) {
      if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
        // Fallback in case of race condition: retry without inserting duplicate XPTransaction
        return executeAtomicStreak(tx, true)
      }
      throw err
    }
  }

  try {
    return await prisma.$transaction(async (clientTx) => {
      return executeAtomicStreak(clientTx)
    })
  } catch (err: any) {
    // Handle concurrent duplicate race condition on daily streak eventKey
    if (err.code === 'P2002' || (err.message && err.message.includes('event_key'))) {
      return prisma.$transaction(async (clientTx) => {
        return executeAtomicStreak(clientTx, true)
      })
    }
    throw err
  }
}

/**
 * Read-side service to fetch authenticated user's streak status.
 */
export const getUserStreakService = async (userId: string, tx?: PrismaTransactionClient): Promise<ServiceResponse> => {
  if (!userId || !isValidUUID(userId)) {
    return { success: false, statusCode: 400, message: 'Invalid userId' }
  }

  const user = await getUserStreakInfo(userId, tx)
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  return {
    success: true,
    message: 'Fetched user streak successfully',
    data: {
      userId: user.id,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActivityAt: user.lastActivityAt,
      timezone: BUSINESS_TIMEZONE
    }
  }
}
