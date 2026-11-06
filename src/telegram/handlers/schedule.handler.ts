import {
  ConfigureDailyScheduleSchema,
  ConfigureWeeklyScheduleSchema,
  formatDayOfWeek,
  parseDayOfWeek
} from '~/models/telegramSchedule.model'
import {
  configureDailyScheduleService,
  configureWeeklyScheduleService,
  getTeacherSchedulesService,
  pauseAllTeacherSchedulesService
} from '~/services/telegramReportSchedule.service'
import { escapeMarkdown } from '~/telegram/utils/analyticsFormatter'
import { TeacherBotContext } from '~/telegram/types'
import { getVietnamCalendarDate } from '~/utils/analyticsDateRange'

/**
 * TMDEMY — TELEGRAM /SCHEDULE COMMAND HANDLER (TG-05)
 *
 * Implements teacher-facing command control for automated reports:
 * - /schedule, /schedule status
 * - /schedule daily <on|off|HH:mm>
 * - /schedule weekly <on|off|day HH:mm>
 * - /schedule pause
 *
 * INVARIANTS:
 * 1. Zero Timezone Footers in all messages.
 * 2. Protected by requireTeacherAuth upstream.
 * 3. Safe Markdown escaping.
 */

function formatDateTimeVN(date: Date | null | undefined): string {
  if (!date) return 'Chưa xác định'
  const vn = getVietnamCalendarDate(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(vn.hours)}:${pad(vn.minutes)} ngày ${pad(vn.day)}/${pad(vn.month + 1)}/${vn.year}`
}

/**
 * Formats schedules summary into a friendly Telegram message.
 */
function formatSchedulesStatusMessage(
  teacherName: string,
  summary: Awaited<ReturnType<typeof getTeacherSchedulesService>>
): string {
  const { daily, weekly, isTelegramLinked, telegramUsername } = summary

  const dailyStatus = daily.isEnabled ? '🟢 *Đang BẬT*' : '⚪ *Đang TẮT*'
  const weeklyStatus = weekly.isEnabled ? '🟢 *Đang BẬT*' : '⚪ *Đang TẮT*'

  const dailyNext = daily.isEnabled && daily.nextRunAt ? `\n  └ Lần gửi tới: *${formatDateTimeVN(daily.nextRunAt)}*` : ''
  const weeklyNext = weekly.isEnabled && weekly.nextRunAt ? `\n  └ Lần gửi tới: *${formatDateTimeVN(weekly.nextRunAt)}*` : ''

  const linkStatusLine = isTelegramLinked
    ? `🔗 Tài khoản: *${escapeMarkdown(teacherName)}* (@${escapeMarkdown(telegramUsername || 'linked')})`
    : `⚠️ *Chưa liên kết Telegram*`

  const lines = [
    '⚙️ *CẤU HÌNH LỊCH BÁO CÁO TỰ ĐỘNG*',
    linkStatusLine,
    '',
    '📅 *1. Báo cáo hàng ngày (Daily Report):*',
    `• Trạng thái: ${dailyStatus}`,
    `• Giờ gửi: *${daily.deliveryTime}*`,
    `• Nội dung: Doanh thu, đơn hàng, học viên mới và tiến độ trong ngày${dailyNext}`,
    '',
    '📆 *2. Báo cáo hàng tuần (Weekly Report):*',
    `• Trạng thái: ${weeklyStatus}`,
    `• Lịch gửi: *${weekly.dayOfWeekLabel || 'Thứ Hai'}* lúc *${weekly.deliveryTime}*`,
    `• Nội dung: Tổng kết tuần qua so với tuần trước đó, xếp hạng khóa học${weeklyNext}`,
    '',
    '💡 *Lệnh điều khiển nhanh:*',
    '• `/schedule daily on` / `/schedule daily off`',
    '• `/schedule daily 20:30` _(đặt giờ gửi hàng ngày)_',
    '• `/schedule weekly on` / `/schedule weekly off`',
    '• `/schedule weekly t2 08:00` _(gửi Thứ 2 lúc 08:00)_',
    '• `/schedule pause` _(tạm dừng toàn bộ)_'
  ]

  return lines.join('\n')
}

export async function handleScheduleCommand(ctx: TeacherBotContext): Promise<void> {
  const teacherId = ctx.teacherProfile?.userId
  const teacherName = ctx.teacherProfile?.username || 'Giảng viên'

  if (!teacherId) {
    await ctx.reply('⚠️ Không tìm thấy thông tin Giảng viên được liên kết.', { parse_mode: 'Markdown' })
    return
  }

  const rawText = (ctx.message?.text || '').trim()
  const tokens = rawText.split(/\s+/).slice(1) // drop "/schedule"
  const subcommand = (tokens[0] || 'status').toLowerCase()

  try {
    // 1. /schedule pause
    if (subcommand === 'pause') {
      await pauseAllTeacherSchedulesService(teacherId)
      await ctx.reply(
        '⏸️ *Đã tạm dừng toàn bộ lịch báo cáo tự động.*\n\nBạn có thể bật lại bất kỳ lúc nào bằng lệnh `/schedule daily on` hoặc `/schedule weekly on`.',
        { parse_mode: 'Markdown' }
      )
      return
    }

    // 2. /schedule daily ...
    if (subcommand === 'daily') {
      const arg1 = (tokens[1] || '').toLowerCase()
      const arg2 = (tokens[2] || '').toLowerCase()

      let isEnabled: boolean | undefined
      let deliveryTime: string | undefined

      if (arg1 === 'on') {
        isEnabled = true
        if (arg2 && /^([01]\d|2[0-3]):[0-5]\d$/.test(arg2)) {
          deliveryTime = arg2
        }
      } else if (arg1 === 'off') {
        isEnabled = false
      } else if (/^([01]\d|2[0-3]):[0-5]\d$/.test(arg1)) {
        deliveryTime = arg1
        isEnabled = true
      } else if (!arg1) {
        // Toggle on if no args
        isEnabled = true
      } else {
        await ctx.reply(
          '⚠️ *Cú pháp không hợp lệ.*\nVí dụ:\n• `/schedule daily on`\n• `/schedule daily off`\n• `/schedule daily 20:30`',
          { parse_mode: 'Markdown' }
        )
        return
      }

      const updated = await configureDailyScheduleService(teacherId, {
        isEnabled,
        deliveryTime
      })

      const statusText = updated.isEnabled ? '🟢 ĐÃ BẬT' : '⚪ ĐÃ TẮT'
      const nextRunLine = updated.isEnabled && updated.nextRunAt
        ? `\n⏰ Lần gửi tiếp theo: *${formatDateTimeVN(updated.nextRunAt)}*`
        : ''

      await ctx.reply(
        `✅ *Cập nhật lịch báo cáo hàng ngày thành công!*\n\n• Trạng thái: *${statusText}*\n• Giờ gửi: *${updated.deliveryTime}*${nextRunLine}`,
        { parse_mode: 'Markdown' }
      )
      return
    }

    // 3. /schedule weekly ...
    if (subcommand === 'weekly') {
      const remainingArgs = tokens.slice(1)
      let isEnabled: boolean | undefined
      let dayOfWeek: number | undefined
      let deliveryTime: string | undefined

      if (remainingArgs.length === 0) {
        isEnabled = true
      } else {
        let idx = 0
        const first = remainingArgs[0].toLowerCase()

        if (first === 'on') {
          isEnabled = true
          idx = 1
        } else if (first === 'off') {
          isEnabled = false
          idx = 1
        }

        while (idx < remainingArgs.length) {
          const item = remainingArgs[idx].toLowerCase()
          if (/^([01]\d|2[0-3]):[0-5]\d$/.test(item)) {
            deliveryTime = item
            if (isEnabled === undefined) isEnabled = true
          } else {
            const parsedDay = parseDayOfWeek(item)
            if (parsedDay !== null) {
              dayOfWeek = parsedDay
              if (isEnabled === undefined) isEnabled = true
            }
          }
          idx++
        }
      }

      const updated = await configureWeeklyScheduleService(teacherId, {
        isEnabled,
        dayOfWeek,
        deliveryTime
      })

      const statusText = updated.isEnabled ? '🟢 ĐÃ BẬT' : '⚪ ĐÃ TẮT'
      const nextRunLine = updated.isEnabled && updated.nextRunAt
        ? `\n⏰ Lần gửi tiếp theo: *${formatDateTimeVN(updated.nextRunAt)}*`
        : ''

      await ctx.reply(
        `✅ *Cập nhật lịch báo cáo hàng tuần thành công!*\n\n• Trạng thái: *${statusText}*\n• Ngày gửi: *${updated.dayOfWeekLabel || 'Thứ Hai'}*\n• Giờ gửi: *${updated.deliveryTime}*${nextRunLine}`,
        { parse_mode: 'Markdown' }
      )
      return
    }

    // 4. Default: /schedule or /schedule status
    const summary = await getTeacherSchedulesService(teacherId)
    const message = formatSchedulesStatusMessage(teacherName, summary)
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await ctx.reply(`❌ *Lỗi cấu hình lịch báo cáo:* ${escapeMarkdown(errorMsg)}`, {
      parse_mode: 'Markdown'
    })
  }
}

