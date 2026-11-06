import { PrismaTransactionClient } from '~/config/prisma'
import {
  ConfigureDailyScheduleInput,
  ConfigureDailyScheduleSchema,
  ConfigureWeeklyScheduleInput,
  ConfigureWeeklyScheduleSchema,
  formatDayOfWeek,
  TeacherSchedulesSummary,
  TelegramReportScheduleItem
} from '~/models/telegramSchedule.model'
import {
  findDeliveryByScheduleAndPeriod,
  findScheduleByTeacherAndType,
  findSchedulesByTeacherId,
  pauseAllSchedulesForTeacher,
  TelegramReportSchedulePayload,
  upsertDailySchedule,
  upsertWeeklySchedule
} from '~/repositories/telegramReportSchedule.repository'
import { findTelegramAccountByUserId } from '~/repositories/telegramAccount.repository'
import { assertTeacherAuthorization } from '~/services/teacherAnalytics.service'
import {
  calculateNextRunAt,
  calculateSubsequentRunAt,
  resolveDailySnapshotRange,
  resolvePreviousCompletedWeekRange
} from '~/utils/analyticsDateRange'

/**
 * TMDEMY — TELEGRAM REPORT SCHEDULE SERVICE (TG-05)
 *
 * Implements business logic for managing teacher automated report schedules:
 * - Query current schedule status (Daily & Weekly)
 * - Configure / Enable / Disable Daily Reports
 * - Configure / Enable / Disable Weekly Reports
 * - Pause all schedules
 *
 * Invariants:
 * 1. Multi-Tenant Teacher Security: Only verified teachers can manage schedules.
 * 2. Unlinked Account Protection: Enabling schedules requires a linked Telegram account.
 * 3. Deterministic Next Run: nextRunAt is strictly calculated using Asia/Ho_Chi_Minh time.
 */

function toScheduleItem(
  raw: TelegramReportSchedulePayload | null,
  teacherId: string,
  reportType: 'DAILY' | 'WEEKLY'
): TelegramReportScheduleItem {
  if (!raw) {
    return {
      id: '',
      teacherId,
      reportType,
      isEnabled: false,
      deliveryTime: reportType === 'DAILY' ? '20:00' : '08:00',
      dayOfWeek: reportType === 'WEEKLY' ? 1 : null,
      dayOfWeekLabel: reportType === 'WEEKLY' ? formatDayOfWeek(1) : undefined,
      timezone: 'Asia/Ho_Chi_Minh',
      nextRunAt: null,
      lastRunAt: null,
      lastStatus: null,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  return {
    id: raw.id,
    teacherId: raw.teacherId,
    reportType: raw.reportType as 'DAILY' | 'WEEKLY',
    isEnabled: raw.isEnabled,
    deliveryTime: raw.deliveryTime,
    dayOfWeek: raw.dayOfWeek,
    dayOfWeekLabel: raw.dayOfWeek ? formatDayOfWeek(raw.dayOfWeek) : undefined,
    timezone: raw.timezone,
    nextRunAt: raw.nextRunAt,
    lastRunAt: raw.lastRunAt,
    lastStatus: raw.lastStatus,
    failureReason: raw.failureReason,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  }
}

/**
 * Retrieves teacher's daily & weekly report schedules alongside Telegram link status.
 */
export async function getTeacherSchedulesService(
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<TeacherSchedulesSummary> {
  await assertTeacherAuthorization(teacherId, tx)

  const [telegramAccount, schedules] = await Promise.all([
    findTelegramAccountByUserId(teacherId, tx),
    findSchedulesByTeacherId(teacherId, tx)
  ])

  const dailySchedule = schedules.find((s) => s.reportType === 'DAILY') || null
  const weeklySchedule = schedules.find((s) => s.reportType === 'WEEKLY') || null

  return {
    teacherId,
    isTelegramLinked: Boolean(telegramAccount),
    telegramUsername: telegramAccount?.telegramUsername ?? null,
    daily: toScheduleItem(dailySchedule, teacherId, 'DAILY'),
    weekly: toScheduleItem(weeklySchedule, teacherId, 'WEEKLY')
  }
}

/**
 * Configures or toggles the teacher's Daily Report schedule.
 */
export async function configureDailyScheduleService(
  teacherId: string,
  input: ConfigureDailyScheduleInput,
  tx?: PrismaTransactionClient
): Promise<TelegramReportScheduleItem> {
  await assertTeacherAuthorization(teacherId, tx)

  const validated = ConfigureDailyScheduleSchema.parse(input)

  // Verify Telegram account linkage if schedule is being enabled
  const telegramAccount = await findTelegramAccountByUserId(teacherId, tx)
  const existingSchedule = await findScheduleByTeacherAndType(teacherId, 'DAILY', tx)

  const targetIsEnabled =
    validated.isEnabled !== undefined ? validated.isEnabled : (existingSchedule?.isEnabled ?? false)

  if (targetIsEnabled && !telegramAccount) {
    throw new Error(
      'Tài khoản Giảng viên chưa liên kết Telegram. Vui lòng kết nối Telegram trước khi kích hoạt báo cáo tự động.'
    )
  }

  const targetDeliveryTime = validated.deliveryTime ?? existingSchedule?.deliveryTime ?? '20:00'

  let nextRunAt: Date | null = null
  if (targetIsEnabled) {
    let isAlreadyDelivered = false
    if (existingSchedule) {
      const todayPeriodKey = resolveDailySnapshotRange().periodKey
      const existingDelivery = await findDeliveryByScheduleAndPeriod(
        existingSchedule.id,
        todayPeriodKey,
        tx
      )
      if (existingDelivery && existingDelivery.status === 'DELIVERED') {
        isAlreadyDelivered = true
      }
    }

    if (isAlreadyDelivered) {
      // Current day's report was already delivered. Schedule strictly for tomorrow to prevent false promise.
      nextRunAt = calculateSubsequentRunAt('DAILY', targetDeliveryTime)
    } else {
      nextRunAt = calculateNextRunAt('DAILY', targetDeliveryTime)
    }
  }

  const updated = await upsertDailySchedule(
    {
      teacherId,
      isEnabled: targetIsEnabled,
      deliveryTime: targetDeliveryTime,
      nextRunAt
    },
    tx
  )

  return toScheduleItem(updated, teacherId, 'DAILY')
}

/**
 * Configures or toggles the teacher's Weekly Report schedule.
 */
export async function configureWeeklyScheduleService(
  teacherId: string,
  input: ConfigureWeeklyScheduleInput,
  tx?: PrismaTransactionClient
): Promise<TelegramReportScheduleItem> {
  await assertTeacherAuthorization(teacherId, tx)

  const validated = ConfigureWeeklyScheduleSchema.parse(input)

  const telegramAccount = await findTelegramAccountByUserId(teacherId, tx)
  const existingSchedule = await findScheduleByTeacherAndType(teacherId, 'WEEKLY', tx)

  const targetIsEnabled =
    validated.isEnabled !== undefined ? validated.isEnabled : (existingSchedule?.isEnabled ?? false)

  if (targetIsEnabled && !telegramAccount) {
    throw new Error(
      'Tài khoản Giảng viên chưa liên kết Telegram. Vui lòng kết nối Telegram trước khi kích hoạt báo cáo tự động.'
    )
  }

  const targetDeliveryTime = validated.deliveryTime ?? existingSchedule?.deliveryTime ?? '08:00'
  const targetDayOfWeek = validated.dayOfWeek ?? existingSchedule?.dayOfWeek ?? 1

  let nextRunAt: Date | null = null
  if (targetIsEnabled) {
    let isAlreadyDelivered = false
    if (existingSchedule) {
      const thisWeekPeriodKey = resolvePreviousCompletedWeekRange().periodKey
      const existingDelivery = await findDeliveryByScheduleAndPeriod(
        existingSchedule.id,
        thisWeekPeriodKey,
        tx
      )
      if (existingDelivery && existingDelivery.status === 'DELIVERED') {
        isAlreadyDelivered = true
      }
    }

    if (isAlreadyDelivered) {
      // Current week's report was already delivered. Schedule strictly for next week.
      nextRunAt = calculateSubsequentRunAt('WEEKLY', targetDeliveryTime, targetDayOfWeek)
    } else {
      nextRunAt = calculateNextRunAt('WEEKLY', targetDeliveryTime, targetDayOfWeek)
    }
  }

  const updated = await upsertWeeklySchedule(
    {
      teacherId,
      isEnabled: targetIsEnabled,
      deliveryTime: targetDeliveryTime,
      dayOfWeek: targetDayOfWeek,
      nextRunAt
    },
    tx
  )

  return toScheduleItem(updated, teacherId, 'WEEKLY')
}

/**
 * Pauses all automated schedules for a teacher.
 */
export async function pauseAllTeacherSchedulesService(
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<{ message: string; pausedCount: number }> {
  await assertTeacherAuthorization(teacherId, tx)

  const result = await pauseAllSchedulesForTeacher(teacherId, tx)

  return {
    message: 'Đã tạm dừng tất cả lịch báo cáo tự động.',
    pausedCount: result.count
  }
}

