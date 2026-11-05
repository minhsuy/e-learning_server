import { MiddlewareFn } from 'grammy'
import { getTeacherProfileByTelegramIdService } from '~/services/telegramTeacher.service'
import { TeacherBotContext } from '../types'

/**
 * TMDEMY — TELEGRAM TEACHER AUTHORIZATION MIDDLEWARE (TG-02A)
 *
 * Reusable middleware that resolves the TMdemy Teacher account from the verified
 * Telegram numeric User ID (ctx.from.id).
 *
 * SECURITY INVARIANTS:
 * 1. Never trusts username, first_name, or client-supplied IDs.
 * 2. Queries PostgreSQL in real-time to re-verify teacher role and active status.
 * 3. Halts update propagation for unlinked or disabled accounts.
 */
export const requireTeacherAuth: MiddlewareFn<TeacherBotContext> = async (ctx, next) => {
  const telegramUserId = ctx.from?.id

  if (!telegramUserId) {
    await ctx.reply('⚠️ Không thể xác định Telegram User ID của bạn.')
    return
  }

  const profile = await getTeacherProfileByTelegramIdService(telegramUserId)

  if (!profile) {
    await ctx.reply(
      [
        '🔒 *YÊU CẦU XÁC THỰC GIẢNG VIÊN*',
        '',
        'Tài khoản Telegram của bạn chưa được liên kết với bất kỳ tài khoản Giảng viên nào trên TMdemy, hoặc tài khoản đã bị vô hiệu hóa.',
        '',
        '👉 *Hướng dẫn liên kết:*',
        '1. Đăng nhập trang quản trị Giảng viên trên TMdemy.',
        '2. Vào mục "Cài đặt tài khoản" > "Liên kết Telegram" để lấy mã liên kết.',
        '3. Nhấp vào liên kết trực tiếp hoặc gửi lệnh `/link <mã_liên_kết>` tại đây.'
      ].join('\n'),
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Attach verified teacher profile to context
  ctx.teacherProfile = profile

  return next()
}

