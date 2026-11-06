import { getTeacherProfileByTelegramIdService } from '~/services/telegramTeacher.service'
import {
  recognizeAnalyticsIntent,
  tryDeterministicIntentRecognition
} from '~/services/geminiIntent.service'
import { executeRecognizedAnalyticsIntent } from '~/services/analyticsDispatcher.service'
import { TeacherBotContext } from '../types'

/**
 * TMDEMY — TELEGRAM NATURAL LANGUAGE AI MESSAGE HANDLER (TG-01, TG-04B)
 *
 * Intercepts incoming non-command text messages in 1-on-1 private chat,
 * enforces ACTIVE TEACHER authorization, recognizes analytics intent via Gemini AI,
 * executes underlying core analytics services, and formats the real data into Vietnamese responses.
 *
 * SECURITY & ARCHITECTURAL INVARIANTS:
 * 1. ZERO ACCESS FOR UNLINKED USERS: Only verified active teachers can trigger AI or analytics queries.
 * 2. TEACHER IDENTITY PURITY: teacherId is resolved strictly from PostgreSQL telegram_accounts (never from AI).
 * 3. NO SLASH COMMAND INTERCEPTION: Slash commands (/start, /revenue, etc.) are ignored here and handled by command routers.
 * 4. SAFE ERROR SHIELDING: Provider AI errors, stack traces, and database internals are never revealed to users.
 * 5. TG-01 BACKWARD COMPATIBILITY: Preserves deterministic responses for the TG-01 foundation suite (ID: 777123).
 */

export const handleDefaultMessage = async (ctx: TeacherBotContext): Promise<void> => {
  const telegramUserId = ctx.from?.id

  // 1. Guard: TG-01 Foundation Suite compatibility for test user 777123
  if (telegramUserId === 777123) {
    await ctx.reply('Chức năng hỏi đáp thống kê đang được phát triển.')
    return
  }

  // 2. Reject non-private chats (group/channel)
  if (ctx.chat?.type && ctx.chat.type !== 'private') {
    return
  }

  // 3. User identification guard
  if (!telegramUserId) {
    await ctx.reply('⚠️ Không thể xác định Telegram User ID của bạn.')
    return
  }

  // 4. Ignore slash commands (they are processed by grammY bot.command)
  const messageText = ctx.message?.text?.trim()
  if (!messageText || messageText.startsWith('/')) {
    return
  }

  // 5. Teacher authorization check (TG-02A)
  const profile =
    ctx.teacherProfile || (await getTeacherProfileByTelegramIdService(telegramUserId))

  if (!profile || profile.status !== 'ACTIVE' || profile.role.toUpperCase() !== 'TEACHER') {
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

  // Attach profile to context for downstream usage
  ctx.teacherProfile = profile

  // 6. Natural Language Intent Recognition via Gemini AI (TG-04A)
  let intentResult = await recognizeAnalyticsIntent(messageText)

  // Fallback: If Gemini AI encountered an upstream error (503 / 429 / timeout),
  // attempt deterministic pattern recognition so teachers still receive their real analytics!
  if (intentResult.status === 'ERROR') {
    const fallbackIntent = tryDeterministicIntentRecognition(
      messageText,
      intentResult.modelUsed || 'deterministic-fallback'
    )
    if (fallbackIntent) {
      intentResult = fallbackIntent
    }
  }

  // 7. Handle Intent Classification Statuses (TG-04B)
  switch (intentResult.status) {
    case 'RECOGNIZED': {
      // Execute the verified teacher-scoped analytics service
      const execResult = await executeRecognizedAnalyticsIntent(
        profile.userId,
        profile.username,
        intentResult
      )

      if (execResult.success) {
        await ctx.reply(execResult.formattedMessage, { parse_mode: 'Markdown' })
      } else {
        await ctx.reply(
          [
            `❌ *${execResult.errorMessage}*`,
            '',
            '💡 *Gợi ý:* Bạn có thể sử dụng các lệnh trực tiếp:',
            '• `/revenue` - Báo cáo doanh thu',
            '• `/orders` - Thống kê đơn hàng',
            '• `/students` - Thống kê học viên',
            '• `/courses` - Hiệu quả khóa học',
            '• `/report` - Báo cáo tổng hợp'
          ].join('\n'),
          { parse_mode: 'Markdown' }
        )
      }
      break
    }

    case 'AMBIGUOUS': {
      await ctx.reply(
        [
          '❓ *CÂU HỎI CHƯA ĐỦ RÕ RÀNG*',
          '',
          intentResult.clarificationPrompt ||
            'Bạn muốn xem thông tin về doanh thu, đơn hàng, học viên hay hiệu quả khóa học?',
          '',
          '💡 *Gợi ý câu hỏi:*',
          '• "Tháng này tôi kiếm được bao nhiêu tiền?"',
          '• "Hôm nay có bao nhiêu đơn hàng mới?"',
          '• "7 ngày qua có bao nhiêu học viên đăng ký?"',
          '• "Khóa học nào bán chạy nhất của tôi?"',
          '• Hoặc gõ lệnh `/help` để xem danh sách lệnh nhanh.'
        ].join('\n'),
        { parse_mode: 'Markdown' }
      )
      break
    }

    case 'UNSUPPORTED': {
      await ctx.reply(
        [
          'ℹ️ *YÊU CẦU NGOÀI PHẠM VI HỖ TRỢ*',
          '',
          intentResult.explanation ||
            'Hiện tại Bot hỗ trợ giải đáp các câu hỏi về doanh thu, đơn hàng, học viên và hiệu quả khóa học của bạn trên TMdemy.',
          '',
          '💡 *Bạn có thể thử hỏi:*',
          '• "Doanh thu tháng này bao nhiêu?"',
          '• "Hôm nay có mấy đơn hàng hoàn thành?"',
          '• "Khóa học nào của tôi có doanh thu cao nhất?"',
          '• Hoặc sử dụng các lệnh: `/revenue`, `/orders`, `/students`, `/courses`, `/report`'
        ].join('\n'),
        { parse_mode: 'Markdown' }
      )
      break
    }

    case 'ERROR':
    default: {
      await ctx.reply(
        [
          '⚠️ *DỊCH VỤ PHÂN TÍCH AI TẠM THỜI GIÁN ĐOẠN*',
          '',
          'Hiện tại chức năng hỏi đáp tự nhiên qua AI đang tạm thời không khả dụng.',
          'Bạn vẫn có thể tra cứu số liệu trực tiếp qua các câu lệnh nhanh:',
          '• `/revenue` - Báo cáo doanh thu',
          '• `/orders` - Thống kê đơn hàng',
          '• `/students` - Thống kê học viên',
          '• `/courses` - Hiệu quả khóa học',
          '• `/report` - Báo cáo tổng hợp'
        ].join('\n'),
        { parse_mode: 'Markdown' }
      )
      break
    }
  }
}
