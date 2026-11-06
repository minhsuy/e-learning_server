import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { Prisma } from '@prisma/client'

/**
 * TMDEMY — TELEGRAM REPORT SCHEDULE & DELIVERY FUNCTIONAL REPOSITORY (TG-05)
 *
 * Implements pure functional database access for:
 * - telegram_report_schedules table
 * - telegram_report_deliveries table
 *
 * All operations accept an optional `tx` (PrismaTransactionClient).
 */

export const TELEGRAM_SCHEDULE_PUBLIC_SELECT = {
  id: true,
  teacherId: true,
  reportType: true,
  isEnabled: true,
  deliveryTime: true,
  dayOfWeek: true,
  timezone: true,
  nextRunAt: true,
  lastRunAt: true,
  lastStatus: true,
  failureReason: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.TelegramReportScheduleSelect

export type TelegramReportSchedulePayload = Prisma.TelegramReportScheduleGetPayload<{
  select: typeof TELEGRAM_SCHEDULE_PUBLIC_SELECT
}>

export type DueScheduleWithTeacher = Prisma.TelegramReportScheduleGetPayload<{
  select: typeof TELEGRAM_SCHEDULE_PUBLIC_SELECT & {
    user: {
      select: {
        id: true
        username: true
        email: true
        role: true
        status: true
        telegramAccount: {
          select: {
            id: true
            telegramUserId: true
            telegramChatId: true
            telegramUsername: true
          }
        }
      }
    }
  }
}>

/**
 * Finds all schedules for a given teacher.
 */
export const findSchedulesByTeacherId = async (
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<TelegramReportSchedulePayload[]> => {
  const client = tx ?? prisma
  return client.telegramReportSchedule.findMany({
    where: { teacherId },
    select: TELEGRAM_SCHEDULE_PUBLIC_SELECT,
    orderBy: { reportType: 'asc' }
  })
}

/**
 * Finds a schedule for a teacher and reportType.
 */
export const findScheduleByTeacherAndType = async (
  teacherId: string,
  reportType: 'DAILY' | 'WEEKLY' | string,
  tx?: PrismaTransactionClient
): Promise<TelegramReportSchedulePayload | null> => {
  const client = tx ?? prisma
  return client.telegramReportSchedule.findUnique({
    where: {
      teacherId_reportType: {
        teacherId,
        reportType
      }
    },
    select: TELEGRAM_SCHEDULE_PUBLIC_SELECT
  })
}

/**
 * Upserts a DAILY schedule for a teacher.
 */
export const upsertDailySchedule = async (
  params: {
    teacherId: string
    isEnabled?: boolean
    deliveryTime?: string
    nextRunAt?: Date | null
  },
  tx?: PrismaTransactionClient
): Promise<TelegramReportSchedulePayload> => {
  const client = tx ?? prisma
  const { teacherId, isEnabled, deliveryTime, nextRunAt } = params

  return client.telegramReportSchedule.upsert({
    where: {
      teacherId_reportType: {
        teacherId,
        reportType: 'DAILY'
      }
    },
    update: {
      ...(isEnabled !== undefined ? { isEnabled } : {}),
      ...(deliveryTime !== undefined ? { deliveryTime } : {}),
      ...(nextRunAt !== undefined ? { nextRunAt } : {})
    },
    create: {
      teacherId,
      reportType: 'DAILY',
      isEnabled: isEnabled ?? false,
      deliveryTime: deliveryTime ?? '20:00',
      dayOfWeek: null,
      timezone: 'Asia/Ho_Chi_Minh',
      nextRunAt: nextRunAt ?? null
    },
    select: TELEGRAM_SCHEDULE_PUBLIC_SELECT
  })
}

/**
 * Upserts a WEEKLY schedule for a teacher.
 */
export const upsertWeeklySchedule = async (
  params: {
    teacherId: string
    isEnabled?: boolean
    deliveryTime?: string
    dayOfWeek?: number
    nextRunAt?: Date | null
  },
  tx?: PrismaTransactionClient
): Promise<TelegramReportSchedulePayload> => {
  const client = tx ?? prisma
  const { teacherId, isEnabled, deliveryTime, dayOfWeek, nextRunAt } = params

  return client.telegramReportSchedule.upsert({
    where: {
      teacherId_reportType: {
        teacherId,
        reportType: 'WEEKLY'
      }
    },
    update: {
      ...(isEnabled !== undefined ? { isEnabled } : {}),
      ...(deliveryTime !== undefined ? { deliveryTime } : {}),
      ...(dayOfWeek !== undefined ? { dayOfWeek } : {}),
      ...(nextRunAt !== undefined ? { nextRunAt } : {})
    },
    create: {
      teacherId,
      reportType: 'WEEKLY',
      isEnabled: isEnabled ?? false,
      deliveryTime: deliveryTime ?? '08:00',
      dayOfWeek: dayOfWeek ?? 1,
      timezone: 'Asia/Ho_Chi_Minh',
      nextRunAt: nextRunAt ?? null
    },
    select: TELEGRAM_SCHEDULE_PUBLIC_SELECT
  })
}

/**
 * Finds due schedules (isEnabled = true AND nextRunAt <= referenceDate).
 * Includes teacher user and telegram account info for dispatching.
 */
export const findDueSchedules = async (
  referenceDate: Date = new Date(),
  limit: number = 50,
  tx?: PrismaTransactionClient
): Promise<DueScheduleWithTeacher[]> => {
  const client = tx ?? prisma
  return client.telegramReportSchedule.findMany({
    where: {
      isEnabled: true,
      nextRunAt: {
        not: null,
        lte: referenceDate
      }
    },
    select: {
      ...TELEGRAM_SCHEDULE_PUBLIC_SELECT,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          telegramAccount: {
            select: {
              id: true,
              telegramUserId: true,
              telegramChatId: true,
              telegramUsername: true
            }
          }
        }
      }
    },
    take: limit,
    orderBy: { nextRunAt: 'asc' }
  })
}

/**
 * Updates execution metadata and calculates the next run timestamp for a schedule.
 */
export const updateScheduleRunMetadata = async (
  scheduleId: string,
  params: {
    nextRunAt?: Date | null
    lastRunAt?: Date
    lastStatus?: string
    failureReason?: string | null
  },
  tx?: PrismaTransactionClient
): Promise<TelegramReportSchedulePayload> => {
  const client = tx ?? prisma
  return client.telegramReportSchedule.update({
    where: { id: scheduleId },
    data: params,
    select: TELEGRAM_SCHEDULE_PUBLIC_SELECT
  })
}

/**
 * Pauses (disables) all schedules for a specific teacher.
 */
export const pauseAllSchedulesForTeacher = async (
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<{ count: number }> => {
  const client = tx ?? prisma
  return client.telegramReportSchedule.updateMany({
    where: { teacherId },
    data: {
      isEnabled: false,
      nextRunAt: null
    }
  })
}

/**
 * Finds a specific delivery record by compound unique key (scheduleId, periodKey).
 */
export const findDeliveryByScheduleAndPeriod = async (
  scheduleId: string,
  periodKey: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx ?? prisma
  return client.telegramReportDelivery.findUnique({
    where: {
      scheduleId_periodKey: {
        scheduleId,
        periodKey
      }
    }
  })
}

export type DeliveryClaimAction =
  | 'CLAIMED'
  | 'ALREADY_DELIVERED'
  | 'CURRENTLY_PROCESSING'
  | 'MAX_RETRIES_EXCEEDED'

export interface DeliveryClaimResult {
  action: DeliveryClaimAction
  delivery: Prisma.TelegramReportDeliveryGetPayload<{}>
  isRetry?: boolean
  staleRecovered?: boolean
}

/**
 * Atomically claims or inspects a delivery record for (scheduleId, periodKey).
 *
 * Implements comprehensive delivery lifecycle & idempotency:
 * 1. Checks if record exists.
 * 2. If not found: attempts create with status 'CLAIMED', attemptCount 1.
 *    If P2002 occurs (concurrent creation race), catches cleanly without unhandled error and re-inspects.
 * 3. If found:
 *    - DELIVERED: returns ALREADY_DELIVERED (safe idempotency, no duplicate sends).
 *    - FAILED: if attemptCount < maxRetries (default 3), reclaims atomically for retry with attemptCount incremented.
 *              if attemptCount >= maxRetries, returns MAX_RETRIES_EXCEEDED.
 *    - CLAIMED: checks if stale (> staleTimeoutMs, default 5 mins).
 *               if stale and attemptCount < maxRetries, reclaims as recovered stale claim.
 *               if not stale (< 5 mins), returns CURRENTLY_PROCESSING.
 */
export const claimOrInspectReportDelivery = async (
  params: {
    scheduleId: string
    teacherId: string
    reportType: string
    periodKey: string
  },
  options?: {
    maxRetries?: number
    staleTimeoutMs?: number
  },
  tx?: PrismaTransactionClient
): Promise<DeliveryClaimResult> => {
  const client = tx ?? prisma
  const maxRetries = options?.maxRetries ?? 3
  const staleTimeoutMs = options?.staleTimeoutMs ?? 5 * 60 * 1000

  // 1. Look up existing delivery first
  let existing = await client.telegramReportDelivery.findUnique({
    where: {
      scheduleId_periodKey: {
        scheduleId: params.scheduleId,
        periodKey: params.periodKey
      }
    }
  })

  // 2. If no record exists, attempt to create one
  if (!existing) {
    try {
      const created = await client.telegramReportDelivery.create({
        data: {
          scheduleId: params.scheduleId,
          teacherId: params.teacherId,
          reportType: params.reportType,
          periodKey: params.periodKey,
          status: 'CLAIMED',
          attemptCount: 1,
          claimedAt: new Date()
        }
      })
      return { action: 'CLAIMED', delivery: created, isRetry: false }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        // Concurrent race condition: another instance just created the delivery record
        existing = await client.telegramReportDelivery.findUnique({
          where: {
            scheduleId_periodKey: {
              scheduleId: params.scheduleId,
              periodKey: params.periodKey
            }
          }
        })
      } else {
        throw err
      }
    }
  }

  // If existing is still null (should never happen), fail gracefully
  if (!existing) {
    throw new Error('Failed to claim or inspect delivery record.')
  }

  // 3. Inspect existing record state
  if (existing.status === 'DELIVERED') {
    return { action: 'ALREADY_DELIVERED', delivery: existing }
  }

  if (existing.status === 'FAILED') {
    if (existing.attemptCount >= maxRetries) {
      return { action: 'MAX_RETRIES_EXCEEDED', delivery: existing }
    }
    // Re-claim for bounded retry
    const updated = await client.telegramReportDelivery.update({
      where: { id: existing.id },
      data: {
        status: 'CLAIMED',
        attemptCount: { increment: 1 },
        claimedAt: new Date(),
        errorMessage: null
      }
    })
    return { action: 'CLAIMED', delivery: updated, isRetry: true }
  }

  if (existing.status === 'CLAIMED') {
    const elapsedMs = Date.now() - new Date(existing.claimedAt).getTime()
    if (elapsedMs >= staleTimeoutMs) {
      // Stale / abandoned claim from crashed worker (> 5 minutes)
      if (existing.attemptCount >= maxRetries) {
        return { action: 'MAX_RETRIES_EXCEEDED', delivery: existing }
      }
      const updated = await client.telegramReportDelivery.update({
        where: { id: existing.id },
        data: {
          status: 'CLAIMED',
          attemptCount: { increment: 1 },
          claimedAt: new Date(),
          errorMessage: `Recovered from stale claim (${Math.round(elapsedMs / 1000)}s old)`
        }
      })
      return { action: 'CLAIMED', delivery: updated, staleRecovered: true }
    }
    // Still actively processing
    return { action: 'CURRENTLY_PROCESSING', delivery: existing }
  }

  return { action: 'CURRENTLY_PROCESSING', delivery: existing }
}

/**
 * Atomically attempts to claim a delivery record for a (scheduleId, periodKey).
 * Returns the TelegramReportDelivery record if CLAIMED, or null if ALREADY_DELIVERED / CURRENTLY_PROCESSING.
 * Uses claimOrInspectReportDelivery internally to prevent raw unhandled Prisma P2002 errors.
 */
export const tryClaimReportDelivery = async (
  params: {
    scheduleId: string
    teacherId: string
    reportType: string
    periodKey: string
  },
  tx?: PrismaTransactionClient
) => {
  const result = await claimOrInspectReportDelivery(params, undefined, tx)
  if (result.action === 'CLAIMED') {
    return result.delivery
  }
  return null
}

/**
 * Updates a delivery record after sending attempt (DELIVERED or FAILED).
 */
export const updateReportDeliveryStatus = async (
  deliveryId: string,
  params: {
    status: 'DELIVERED' | 'FAILED'
    deliveredAt?: Date | null
    errorMessage?: string | null
    responseMessageId?: number | null
    attemptCountIncrement?: boolean
  },
  tx?: PrismaTransactionClient
) => {
  const client = tx ?? prisma
  const { status, deliveredAt, errorMessage, responseMessageId, attemptCountIncrement } = params

  return client.telegramReportDelivery.update({
    where: { id: deliveryId },
    data: {
      status,
      deliveredAt: deliveredAt !== undefined ? deliveredAt : status === 'DELIVERED' ? new Date() : null,
      errorMessage: errorMessage ?? null,
      responseMessageId: responseMessageId ?? null,
      ...(attemptCountIncrement ? { attemptCount: { increment: 1 } } : {})
    }
  })
}

/**
 * Finds delivery history for a teacher, ordered by claimedAt desc.
 */
export const findDeliveriesByTeacherId = async (
  teacherId: string,
  limit: number = 20,
  tx?: PrismaTransactionClient
) => {
  const client = tx ?? prisma
  return client.telegramReportDelivery.findMany({
    where: { teacherId },
    orderBy: { claimedAt: 'desc' },
    take: limit
  })
}

