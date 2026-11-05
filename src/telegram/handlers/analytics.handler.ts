import {
  getCourseAnalyticsService,
  getOrderAnalyticsService,
  getRevenueAnalyticsService,
  getStudentAnalyticsService,
  getTeacherDashboardSummaryService
} from '~/services/teacherAnalytics.service'
import { TeacherBotContext } from '../types'
import {
  formatCoursesMessage,
  formatOrdersMessage,
  formatReportMessage,
  formatRevenueMessage,
  formatStudentsMessage
} from '../utils/analyticsFormatter'
import { parseDateRangeArgs } from '../utils/commandParser'

/**
 * TMDEMY — TELEGRAM TEACHER ANALYTICS COMMAND HANDLERS (TG-03B)
 *
 * Implements handlers for analytics commands:
 * - /revenue [period | custom YYYY-MM-DD YYYY-MM-DD]
 * - /orders [period | custom YYYY-MM-DD YYYY-MM-DD]
 * - /students [period | custom YYYY-MM-DD YYYY-MM-DD]
 * - /courses
 * - /report
 *
 * IN-PROCESS INTEGRATION:
 * Handlers directly call the TG-03A core analytics services without HTTP overhead,
 * maintaining strict teacher isolation (authorId = teacherId) and Asia/Ho_Chi_Minh time semantics.
 */

/**
 * /revenue [period | custom YYYY-MM-DD YYYY-MM-DD]
 */
export const handleRevenueCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const profile = ctx.teacherProfile
  if (!profile?.userId) {
    await ctx.reply('⚠️ Không thể xác định tài khoản Giảng viên của bạn.')
    return
  }

  const rawArgs = ctx.match as string | undefined
  const parseResult = parseDateRangeArgs(rawArgs, 'revenue')

  if (!parseResult.isValid) {
    await ctx.reply(parseResult.errorMessage, { parse_mode: 'Markdown' })
    return
  }

  try {
    const analytics = await getRevenueAnalyticsService(profile.userId, parseResult.options)
    const message = formatRevenueMessage(profile.username, analytics)
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramAnalytics Error - /revenue] ${errorMsg}`)
    await ctx.reply(
      '❌ Không thể trích xuất báo cáo doanh thu lúc này. Vui lòng kiểm tra lại tham số hoặc thử lại sau.'
    )
  }
}

/**
 * /orders [period | custom YYYY-MM-DD YYYY-MM-DD]
 */
export const handleOrdersCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const profile = ctx.teacherProfile
  if (!profile?.userId) {
    await ctx.reply('⚠️ Không thể xác định tài khoản Giảng viên của bạn.')
    return
  }

  const rawArgs = ctx.match as string | undefined
  const parseResult = parseDateRangeArgs(rawArgs, 'orders')

  if (!parseResult.isValid) {
    await ctx.reply(parseResult.errorMessage, { parse_mode: 'Markdown' })
    return
  }

  try {
    const analytics = await getOrderAnalyticsService(profile.userId, parseResult.options)
    const message = formatOrdersMessage(profile.username, analytics)
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramAnalytics Error - /orders] ${errorMsg}`)
    await ctx.reply(
      '❌ Không thể trích xuất thống kê đơn hàng lúc này. Vui lòng thử lại sau.'
    )
  }
}

/**
 * /students [period | custom YYYY-MM-DD YYYY-MM-DD]
 */
export const handleStudentsCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const profile = ctx.teacherProfile
  if (!profile?.userId) {
    await ctx.reply('⚠️ Không thể xác định tài khoản Giảng viên của bạn.')
    return
  }

  const rawArgs = ctx.match as string | undefined
  const parseResult = parseDateRangeArgs(rawArgs, 'students')

  if (!parseResult.isValid) {
    await ctx.reply(parseResult.errorMessage, { parse_mode: 'Markdown' })
    return
  }

  try {
    const analytics = await getStudentAnalyticsService(profile.userId, parseResult.options)
    const message = formatStudentsMessage(profile.username, analytics)
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramAnalytics Error - /students] ${errorMsg}`)
    await ctx.reply(
      '❌ Không thể trích xuất thống kê học viên lúc này. Vui lòng thử lại sau.'
    )
  }
}

/**
 * /courses
 */
export const handleCoursesCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const profile = ctx.teacherProfile
  if (!profile?.userId) {
    await ctx.reply('⚠️ Không thể xác định tài khoản Giảng viên của bạn.')
    return
  }

  try {
    const analytics = await getCourseAnalyticsService(profile.userId)
    const message = formatCoursesMessage(profile.username, analytics)
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramAnalytics Error - /courses] ${errorMsg}`)
    await ctx.reply(
      '❌ Không thể trích xuất danh mục khóa học lúc này. Vui lòng thử lại sau.'
    )
  }
}

/**
 * /report
 */
export const handleReportCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const profile = ctx.teacherProfile
  if (!profile?.userId) {
    await ctx.reply('⚠️ Không thể xác định tài khoản Giảng viên của bạn.')
    return
  }

  try {
    const summary = await getTeacherDashboardSummaryService(profile.userId)
    const message = formatReportMessage(profile.username, summary)
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramAnalytics Error - /report] ${errorMsg}`)
    await ctx.reply(
      '❌ Không thể tạo báo cáo tổng hợp lúc này. Vui lòng thử lại sau.'
    )
  }
}

