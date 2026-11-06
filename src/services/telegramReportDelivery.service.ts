import { z } from 'zod'
import { getTelegramBotInstance } from '~/telegram/bot'
import {
  escapeMarkdown,
  formatCount,
  formatVND
} from '~/telegram/utils/analyticsFormatter'
import {
  getVietnamCalendarDate,
  resolveDailySnapshotRange,
  resolvePreviousCompletedWeekRange,
  resolvePriorWeekComparisonRange,
  calculateNextRunAt,
  calculateSubsequentRunAt
} from '~/utils/analyticsDateRange'
import {
  getTeacherRevenueStats,
  getTeacherOverviewMetrics
} from '~/repositories/teacherStatistic.repository'
import {
  getTeacherOrderAnalyticsData,
  getTeacherRevenueByCourseInDateRange,
  getTeacherStudentAnalyticsData
} from '~/repositories/teacherAnalytics.repository'
import {
  DueScheduleWithTeacher,
  claimOrInspectReportDelivery,
  tryClaimReportDelivery,
  updateReportDeliveryStatus,
  updateScheduleRunMetadata
} from '~/repositories/telegramReportSchedule.repository'
import { generateGeminiInsightExplanation } from './geminiClient.service'
import { getGeminiConfig } from '~/config/gemini.config'

/**
 * TMDEMY — TELEGRAM REPORT DELIVERY & GENERATION SERVICE (TG-05)
 *
 * Implements report content generation, atomic delivery claiming,
 * Telegram message dispatching, and run metadata updating.
 *
 * RESILIENCE INVARIANTS:
 * 1. STRICT IDEMPOTENCY: Atomic PostgreSQL claim prevents duplicate sends.
 * 2. ZERO TIMEZONE FOOTERS: User-facing messages strictly omit any timezone lines.
 * 3. FAIL-SAFE AI: Optional Gemini commentary failure never blocks report delivery.
 * 4. DETERMINISTIC MATH: All revenue deltas and percentages are calculated in TypeScript.
 */

export interface ReportGenerationResult {
  messageText: string
  periodKey: string
}

export interface DispatchDeliveryResult {
  scheduleId: string
  reportType: string
  teacherId: string
  periodKey: string
  status: 'DELIVERED' | 'FAILED' | 'SKIPPED'
  reason?: string
  responseMessageId?: number | null
}

export interface ReportGenerationOptions {
  skipAi?: boolean
  mockAiResponse?: unknown
}

export const ReportAiInsightSchema = z.object({
  observation: z.string().min(1),
  recommendation: z.string().nullable().optional()
})

export type ReportAiInsight = z.infer<typeof ReportAiInsightSchema>

/**
 * Strips markdown code fences (```json ... ``` or ``` ... ```) if present.
 */
export function stripMarkdownCodeFences(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n')
    if (lines.length >= 2 && lines[lines.length - 1].trim().startsWith('```')) {
      return lines.slice(1, -1).join('\n').trim()
    }
    return lines.slice(1).join('\n').trim()
  }
  return trimmed
}

/**
 * Parses and formats Gemini insight payload for automated reports.
 *
 * Rules:
 * 1. Supports raw JSON strings, structured objects, or markdown code-fenced strings.
 * 2. Never exposes raw JSON, code fences, field names, or curly braces in output.
 * 3. Validates with ReportAiInsightSchema.
 * 4. Returns formatted array of Markdown lines according to specification:
 *    💡 *NHẬN ĐỊNH NHANH AI*
 *
 *    📊 *Tình hình kinh doanh:*
 *    [observation]
 *
 *    🚀 *Đề xuất cải thiện:*
 *    [recommendation]
 *
 * 5. Returns null if input is invalid/malformed so report delivery proceeds deterministically.
 */
export function formatReportAiInsight(input: unknown): string[] | null {
  if (!input) return null

  let parsedObject: unknown = null

  if (typeof input === 'object' && input !== null) {
    if ('rawText' in input && typeof (input as { rawText: unknown }).rawText === 'string') {
      const cleaned = stripMarkdownCodeFences((input as { rawText: string }).rawText)
      try {
        parsedObject = JSON.parse(cleaned)
      } catch {
        return null
      }
    } else {
      parsedObject = input
    }
  } else if (typeof input === 'string') {
    const cleaned = stripMarkdownCodeFences(input)
    try {
      parsedObject = JSON.parse(cleaned)
    } catch {
      return null
    }
  } else {
    return null
  }

  const parseResult = ReportAiInsightSchema.safeParse(parsedObject)
  if (!parseResult.success) {
    return null
  }

  const { observation, recommendation } = parseResult.data

  const cleanObs = observation.trim()
  if (!cleanObs) return null

  // Security guard: Ensure observation does not leak raw JSON artifacts
  if (
    cleanObs.startsWith('{') ||
    cleanObs.endsWith('}') ||
    cleanObs.includes('"observation":') ||
    cleanObs.includes('"recommendation":')
  ) {
    return null
  }

  const cleanRec = (recommendation || '').trim()
  if (
    cleanRec.startsWith('{') ||
    cleanRec.endsWith('}') ||
    cleanRec.includes('"observation":') ||
    cleanRec.includes('"recommendation":')
  ) {
    return null
  }

  const lines: string[] = [
    '',
    '💡 *NHẬN ĐỊNH NHANH AI*',
    '',
    '📊 *Tình hình kinh doanh:*',
    escapeMarkdown(cleanObs)
  ]

  if (cleanRec && cleanRec !== 'null' && cleanRec !== 'undefined') {
    lines.push('', '🚀 *Đề xuất cải thiện:*', escapeMarkdown(cleanRec))
  }

  return lines
}

/**
 * Calculates percentage growth safely avoiding division by zero.
 */
function calculateGrowthPercent(current: number, previous: number): {
  percent: number | null
  formattedDelta: string
} {
  const diff = current - previous
  if (previous <= 0) {
    if (current <= 0) return { percent: 0, formattedDelta: '0%' }
    return { percent: null, formattedDelta: `+${formatVND(diff)}` }
  }

  const growth = Math.round(((current - previous) / previous) * 1000) / 10
  const sign = growth > 0 ? '+' : ''
  const icon = growth > 0 ? '🟢 ' : growth < 0 ? '🔴 ' : '⚪ '
  return {
    percent: growth,
    formattedDelta: `${icon}${sign}${growth}%`
  }
}

/**
 * Generates Daily Report content for a teacher.
 */
export async function generateDailyReportMessage(
  teacherId: string,
  teacherName: string,
  referenceDate: Date = new Date(),
  options?: ReportGenerationOptions
): Promise<ReportGenerationResult> {
  const { startDate, endDate, dateLabel, periodKey } = resolveDailySnapshotRange(referenceDate)

  // Fetch today's metrics concurrently
  const [todayRevenue, todayOrders, todayStudents, byCourse, allTimeMetrics] = await Promise.all([
    getTeacherRevenueStats({ teacherId, startDate, endDate, isMonthly: false }),
    getTeacherOrderAnalyticsData({ teacherId, startDate, endDate, isMonthly: false }),
    getTeacherStudentAnalyticsData({ teacherId, startDate, endDate }),
    getTeacherRevenueByCourseInDateRange({ teacherId, startDate, endDate }),
    getTeacherOverviewMetrics(teacherId)
  ])

  const netRevenue = todayRevenue.summary.totalRevenue
  const completedOrders = todayOrders.summary.completedOrders
  const pendingOrders = todayOrders.summary.pendingOrders
  const pendingRevenue = todayOrders.summary.pendingRevenue
  const newStudents = todayStudents.newStudents

  const topCourse = byCourse.length > 0 ? byCourse[0] : null
  const topCourseSection = topCourse
    ? [
        '',
        '🏆 *Khóa học tiêu biểu trong ngày:*',
        `• *${escapeMarkdown(topCourse.title)}*: ${formatVND(topCourse.revenue)} (${formatCount(topCourse.soldCount)} lượt bán)`
      ]
    : []

  const pendingSection =
    pendingOrders > 0
      ? [`• Đơn chờ xử lý: ⏳ *${formatCount(pendingOrders)}* đơn (${formatVND(pendingRevenue)})`]
      : []

  const lines = [
    '📊 *BÁO CÁO KINH DOANH HÀNG NGÀY*',
    `📅 Ngày: *${dateLabel}*`,
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    '💰 *Kết quả kinh doanh trong ngày:*',
    `• Doanh thu thực nhận: *${formatVND(netRevenue)}*`,
    `• Đơn hàng thành công: *${formatCount(completedOrders)}* đơn`,
    `• Học viên mới: *+${formatCount(newStudents)}* học viên`,
    ...pendingSection,
    ...topCourseSection,
    '',
    '🌐 *Tiến độ toàn thời gian:*',
    `• Doanh thu tích lũy: *${formatVND(allTimeMetrics.revenue.totalRevenue)}*`,
    `• Tổng đơn thành công: *${formatCount(allTimeMetrics.revenue.completedOrders)}* đơn`
  ]

  // Optional AI commentary (fail-safe)
  if (options?.mockAiResponse !== undefined) {
    const aiLines = formatReportAiInsight(options.mockAiResponse)
    if (aiLines && aiLines.length > 0) {
      lines.push(...aiLines)
    }
  } else {
    const geminiConfig = getGeminiConfig()
    if (!options?.skipAi && geminiConfig.isConfigured && geminiConfig.isValid) {
      try {
        const prompt = `Bạn là trợ lý AI chuyên gia phân tích kinh doanh TMdemy. Hãy đưa ra 1-2 câu nhận xét ngắn gọn, thực tế và mang tính khích lệ cho giảng viên dựa trên số liệu ngày hôm nay:
- Doanh thu hôm nay: ${formatVND(netRevenue)}
- Số đơn hôm nay: ${completedOrders}
- Học viên mới: ${newStudents}
- Đơn chờ xử lý: ${pendingOrders}
- Khóa học bán chạy nhất: ${topCourse ? topCourse.title : 'Chưa phát sinh'}
Yêu cầu: Không đề cập múi giờ. Ngắn gọn dưới 60 từ.`

        const aiResponse = await generateGeminiInsightExplanation(prompt, { timeoutMs: 3500 })
        const aiLines = formatReportAiInsight(aiResponse)
        if (aiLines && aiLines.length > 0) {
          lines.push(...aiLines)
        }
      } catch {
        // Fail-safe: ignore Gemini error and deliver deterministic report
      }
    }
  }

  return {
    messageText: lines.join('\n'),
    periodKey
  }
}

/**
 * Generates Weekly Report content for a teacher summarizing the last completed week.
 */
export async function generateWeeklyReportMessage(
  teacherId: string,
  teacherName: string,
  referenceDate: Date = new Date(),
  options?: ReportGenerationOptions
): Promise<ReportGenerationResult> {
  const completedWeek = resolvePreviousCompletedWeekRange(referenceDate)
  const priorWeek = resolvePriorWeekComparisonRange(referenceDate)

  // Fetch metrics for completed week and comparison week concurrently
  const [
    weekRevenue,
    priorRevenue,
    weekOrders,
    priorOrders,
    weekStudents,
    weekCourses
  ] = await Promise.all([
    getTeacherRevenueStats({
      teacherId,
      startDate: completedWeek.startDate,
      endDate: completedWeek.endDate,
      isMonthly: false
    }),
    getTeacherRevenueStats({
      teacherId,
      startDate: priorWeek.startDate,
      endDate: priorWeek.endDate,
      isMonthly: false
    }),
    getTeacherOrderAnalyticsData({
      teacherId,
      startDate: completedWeek.startDate,
      endDate: completedWeek.endDate,
      isMonthly: false
    }),
    getTeacherOrderAnalyticsData({
      teacherId,
      startDate: priorWeek.startDate,
      endDate: priorWeek.endDate,
      isMonthly: false
    }),
    getTeacherStudentAnalyticsData({
      teacherId,
      startDate: completedWeek.startDate,
      endDate: completedWeek.endDate
    }),
    getTeacherRevenueByCourseInDateRange({
      teacherId,
      startDate: completedWeek.startDate,
      endDate: completedWeek.endDate
    })
  ])

  const curNetRevenue = weekRevenue.summary.totalRevenue
  const prevNetRevenue = priorRevenue.summary.totalRevenue
  const curCompletedOrders = weekOrders.summary.completedOrders
  const prevCompletedOrders = priorOrders.summary.completedOrders
  const conversionRate = weekOrders.summary.conversionRate
  const newStudents = weekStudents.newStudents

  const revenueGrowth = calculateGrowthPercent(curNetRevenue, prevNetRevenue)
  const orderDiff = curCompletedOrders - prevCompletedOrders
  const orderGrowthSign = orderDiff > 0 ? ` (+${orderDiff} đơn)` : orderDiff < 0 ? ` (${orderDiff} đơn)` : ''

  const topCoursesSection =
    weekCourses.length > 0
      ? [
          '',
          '🏆 *Top khóa học tuần qua:*',
          ...weekCourses.slice(0, 3).map((c, idx) => {
            const title = escapeMarkdown(c.title)
            return `${idx + 1}. *${title}*: ${formatVND(c.revenue)} (${formatCount(c.soldCount)} đơn)`
          })
        ]
      : ['', '🏆 *Top khóa học tuần qua:* _Chưa phát sinh doanh thu_']

  const lines = [
    '📊 *BÁO CÁO KINH DOANH HÀNG TUẦN*',
    `📅 Kỳ báo cáo: *${completedWeek.weekLabel}*`,
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    '💰 *Hiệu quả tuần qua so với tuần trước:*',
    `• Doanh thu thực nhận: *${formatVND(curNetRevenue)}* (${revenueGrowth.formattedDelta} so với tuần trước)`,
    `• Đơn hàng thành công: *${formatCount(curCompletedOrders)}* đơn${orderGrowthSign}`,
    `• Tỷ lệ chuyển đổi: *${conversionRate.toFixed(1)}%*`,
    `• Học viên mới đăng ký: *+${formatCount(newStudents)}* học viên`,
    ...topCoursesSection
  ]

  // Optional AI commentary (fail-safe)
  if (options?.mockAiResponse !== undefined) {
    const aiLines = formatReportAiInsight(options.mockAiResponse)
    if (aiLines && aiLines.length > 0) {
      lines.push(...aiLines)
    }
  } else {
    const geminiConfig = getGeminiConfig()
    if (!options?.skipAi && geminiConfig.isConfigured && geminiConfig.isValid) {
      try {
        const prompt = `Bạn là trợ lý AI chuyên gia phân tích kinh doanh TMdemy. Hãy đưa ra 2-3 câu nhận xét đánh giá tuần qua và gợi ý 1 hành động thiết thực cho tuần mới:
- Doanh thu tuần qua: ${formatVND(curNetRevenue)} (tuần trước: ${formatVND(prevNetRevenue)})
- Tăng trưởng: ${revenueGrowth.formattedDelta}
- Đơn hàng hoàn thành: ${curCompletedOrders}
- Tỷ lệ chuyển đổi: ${conversionRate.toFixed(1)}%
- Học viên mới: ${newStudents}
Yêu cầu: Không đề cập múi giờ. Ngắn gọn dưới 80 từ.`

        const aiResponse = await generateGeminiInsightExplanation(prompt, { timeoutMs: 3500 })
        const aiLines = formatReportAiInsight(aiResponse)
        if (aiLines && aiLines.length > 0) {
          lines.push(...aiLines)
        }
      } catch {
        // Fail-safe
      }
    }
  }

  return {
    messageText: lines.join('\n'),
    periodKey: completedWeek.periodKey
  }
}

/**
 * Dispatches a due schedule report to a teacher via Telegram.
 */
export async function dispatchScheduleReport(
  schedule: DueScheduleWithTeacher,
  referenceDate: Date = new Date(),
  deliveryOptions?: {
    mockTelegramSender?: (chatId: string | number | bigint, text: string) => Promise<{ message_id: number }>
    skipAi?: boolean
    mockAiResponse?: unknown
  }
): Promise<DispatchDeliveryResult> {
  const teacher = schedule.user
  const telegramAccount = teacher.telegramAccount

  // 1. Resolve Period Key based on report type
  const periodKey =
    schedule.reportType === 'DAILY'
      ? resolveDailySnapshotRange(referenceDate).periodKey
      : resolvePreviousCompletedWeekRange(referenceDate).periodKey

  // Structured Logging: Due schedule detected
  console.log(
    `[ReportScheduler] Due schedule detected: type=${schedule.reportType}, scheduleId=${schedule.id}, teacherId=${schedule.teacherId}, periodKey=${periodKey}, nextRunAt=${schedule.nextRunAt ? schedule.nextRunAt.toISOString() : 'NULL'}`
  )

  // 2. Guard: Active Telegram Account check
  if (!telegramAccount || !telegramAccount.telegramChatId) {
    const errorMsg = 'Giảng viên chưa liên kết tài khoản Telegram hoặc thiếu Chat ID.'
    const subsequentNextRun = calculateSubsequentRunAt(
      schedule.reportType as 'DAILY' | 'WEEKLY',
      schedule.deliveryTime,
      schedule.dayOfWeek,
      referenceDate
    )
    await updateScheduleRunMetadata(schedule.id, {
      nextRunAt: subsequentNextRun,
      lastRunAt: new Date(),
      lastStatus: 'FAILED',
      failureReason: errorMsg
    })
    console.error(
      `[ReportScheduler] Telegram account unlinked: type=${schedule.reportType}, teacherId=${schedule.teacherId}, nextRunAt=${subsequentNextRun.toISOString()}`
    )
    return {
      scheduleId: schedule.id,
      reportType: schedule.reportType,
      teacherId: schedule.teacherId,
      periodKey,
      status: 'FAILED',
      reason: errorMsg
    }
  }

  // 3. Atomic Claim & Idempotency Inspection
  const claimResult = await claimOrInspectReportDelivery({
    scheduleId: schedule.id,
    teacherId: schedule.teacherId,
    reportType: schedule.reportType,
    periodKey
  })

  console.log(
    `[ReportScheduler] Claim result: type=${schedule.reportType}, status=${claimResult.action}`
  )

  // 3.1 Handle ALREADY_DELIVERED: advance nextRunAt to subsequent cycle and skip
  if (claimResult.action === 'ALREADY_DELIVERED') {
    const subsequentNextRun = calculateSubsequentRunAt(
      schedule.reportType as 'DAILY' | 'WEEKLY',
      schedule.deliveryTime,
      schedule.dayOfWeek,
      referenceDate
    )
    await updateScheduleRunMetadata(schedule.id, {
      nextRunAt: subsequentNextRun
    })
    console.log(
      `[ReportScheduler] Duplicate period claim: type=${schedule.reportType}, periodKey=${periodKey}, existingStatus=${claimResult.delivery.status}, action=SKIPPED_ALREADY_DELIVERED`
    )
    console.log(
      `[ReportScheduler] Next execution updated: type=${schedule.reportType}, nextRunAt=${subsequentNextRun.toISOString()}`
    )
    return {
      scheduleId: schedule.id,
      reportType: schedule.reportType,
      teacherId: schedule.teacherId,
      periodKey,
      status: 'SKIPPED',
      reason: 'Already delivered for this period.'
    }
  }

  // 3.2 Handle CURRENTLY_PROCESSING: skip without advancing nextRunAt
  if (claimResult.action === 'CURRENTLY_PROCESSING') {
    console.log(
      `[ReportScheduler] Concurrent period claim: type=${schedule.reportType}, periodKey=${periodKey}, status=CURRENTLY_PROCESSING`
    )
    return {
      scheduleId: schedule.id,
      reportType: schedule.reportType,
      teacherId: schedule.teacherId,
      periodKey,
      status: 'SKIPPED',
      reason: 'Currently being processed by another worker.'
    }
  }

  // 3.3 Handle MAX_RETRIES_EXCEEDED: advance to subsequent period so scheduler isn't blocked
  if (claimResult.action === 'MAX_RETRIES_EXCEEDED') {
    const subsequentNextRun = calculateSubsequentRunAt(
      schedule.reportType as 'DAILY' | 'WEEKLY',
      schedule.deliveryTime,
      schedule.dayOfWeek,
      referenceDate
    )
    const reason = `Quá số lần thử lại tối đa (${claimResult.delivery.attemptCount}) cho kỳ báo cáo này.`
    await updateScheduleRunMetadata(schedule.id, {
      nextRunAt: subsequentNextRun,
      lastRunAt: new Date(),
      lastStatus: 'FAILED',
      failureReason: reason
    })
    console.warn(
      `[ReportScheduler] Max retries exceeded: type=${schedule.reportType}, periodKey=${periodKey}, attempts=${claimResult.delivery.attemptCount}, nextRunAt=${subsequentNextRun.toISOString()}`
    )
    return {
      scheduleId: schedule.id,
      reportType: schedule.reportType,
      teacherId: schedule.teacherId,
      periodKey,
      status: 'FAILED',
      reason
    }
  }

  const deliveryClaim = claimResult.delivery

  // 4. Generate Content
  let reportText: string
  try {
    if (schedule.reportType === 'DAILY') {
      const generated = await generateDailyReportMessage(
        schedule.teacherId,
        teacher.username,
        referenceDate,
        {
          skipAi: deliveryOptions?.skipAi,
          mockAiResponse: deliveryOptions?.mockAiResponse
        }
      )
      reportText = generated.messageText
    } else {
      const generated = await generateWeeklyReportMessage(
        schedule.teacherId,
        teacher.username,
        referenceDate,
        {
          skipAi: deliveryOptions?.skipAi,
          mockAiResponse: deliveryOptions?.mockAiResponse
        }
      )
      reportText = generated.messageText
    }
  } catch (genErr: unknown) {
    const msg = genErr instanceof Error ? genErr.message : String(genErr)
    await updateReportDeliveryStatus(deliveryClaim.id, {
      status: 'FAILED',
      errorMessage: `Lỗi tạo nội dung báo cáo: ${msg}`
    })

    const attemptCount = deliveryClaim.attemptCount
    let nextRun: Date
    if (attemptCount < 3) {
      // Bounded retry in 2 minutes
      nextRun = new Date(Date.now() + 2 * 60 * 1000)
      console.warn(
        `[ReportScheduler] Report generation failed, scheduled retry: type=${schedule.reportType}, attempt=${attemptCount}, nextRunAt=${nextRun.toISOString()}`
      )
    } else {
      nextRun = calculateSubsequentRunAt(
        schedule.reportType as 'DAILY' | 'WEEKLY',
        schedule.deliveryTime,
        schedule.dayOfWeek,
        referenceDate
      )
      console.warn(
        `[ReportScheduler] Report generation failed, max retries reached: type=${schedule.reportType}, nextRunAt=${nextRun.toISOString()}`
      )
    }

    await updateScheduleRunMetadata(schedule.id, {
      nextRunAt: nextRun,
      lastRunAt: new Date(),
      lastStatus: 'FAILED',
      failureReason: msg
    })

    return {
      scheduleId: schedule.id,
      reportType: schedule.reportType,
      teacherId: schedule.teacherId,
      periodKey,
      status: 'FAILED',
      reason: msg
    }
  }

  // 5. Deliver Message via Telegram Bot API
  try {
    let messageId: number | null = null

    if (deliveryOptions?.mockTelegramSender) {
      const mockResult = await deliveryOptions.mockTelegramSender(
        telegramAccount.telegramChatId,
        reportText
      )
      messageId = mockResult.message_id
    } else {
      const bot = getTelegramBotInstance()
      if (!bot) {
        throw new Error('Telegram Bot instance is not currently active.')
      }
      const sent = await bot.api.sendMessage(
        Number(telegramAccount.telegramChatId),
        reportText,
        { parse_mode: 'Markdown' }
      )
      messageId = sent.message_id
    }

    // 6. Update Delivery & Schedule Success
    await updateReportDeliveryStatus(deliveryClaim.id, {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      responseMessageId: messageId
    })

    const subsequentNextRun = calculateSubsequentRunAt(
      schedule.reportType as 'DAILY' | 'WEEKLY',
      schedule.deliveryTime,
      schedule.dayOfWeek,
      referenceDate
    )

    await updateScheduleRunMetadata(schedule.id, {
      nextRunAt: subsequentNextRun,
      lastRunAt: new Date(),
      lastStatus: 'SUCCESS',
      failureReason: null
    })

    console.log(
      `[ReportScheduler] Telegram delivery confirmed: type=${schedule.reportType}, status=SUCCESS, messageId=${messageId}`
    )
    console.log(
      `[ReportScheduler] Next execution updated: type=${schedule.reportType}, nextRunAt=${subsequentNextRun.toISOString()}`
    )

    return {
      scheduleId: schedule.id,
      reportType: schedule.reportType,
      teacherId: schedule.teacherId,
      periodKey,
      status: 'DELIVERED',
      responseMessageId: messageId
    }
  } catch (sendErr: unknown) {
    const errorMsg = sendErr instanceof Error ? sendErr.message : String(sendErr)

    await updateReportDeliveryStatus(deliveryClaim.id, {
      status: 'FAILED',
      errorMessage: errorMsg
    })

    const attemptCount = deliveryClaim.attemptCount
    let nextRun: Date
    if (attemptCount < 3) {
      // Bounded retry in 2 minutes
      nextRun = new Date(Date.now() + 2 * 60 * 1000)
      console.warn(
        `[ReportScheduler] Telegram delivery failed, scheduled retry: type=${schedule.reportType}, attempt=${attemptCount}, nextRunAt=${nextRun.toISOString()}`
      )
    } else {
      nextRun = calculateSubsequentRunAt(
        schedule.reportType as 'DAILY' | 'WEEKLY',
        schedule.deliveryTime,
        schedule.dayOfWeek,
        referenceDate
      )
      console.warn(
        `[ReportScheduler] Telegram delivery failed, max retries reached: type=${schedule.reportType}, nextRunAt=${nextRun.toISOString()}`
      )
    }

    await updateScheduleRunMetadata(schedule.id, {
      nextRunAt: nextRun,
      lastRunAt: new Date(),
      lastStatus: 'FAILED',
      failureReason: errorMsg
    })

    return {
      scheduleId: schedule.id,
      reportType: schedule.reportType,
      teacherId: schedule.teacherId,
      periodKey,
      status: 'FAILED',
      reason: errorMsg
    }
  }
}

