import { InlineKeyboard } from 'grammy'
import {
  consumeLinkTokenAndBindService,
  getTeacherProfileByTelegramIdService,
  unlinkFromTelegramService
} from '~/services/telegramTeacher.service'
import { TeacherBotContext } from '../types'

/**
 * TMDEMY — TELEGRAM BOT COMMAND HANDLERS (TG-02A)
 *
 * Implements:
 * - /start: Deep link linking handler (/start link_<token>) & general welcome
 * - /link <token>: One-time token binding handler
 * - /account: Verified teacher profile viewer
 * - /unlink: Two-step confirmation unlinking handler
 * - /help: Updated command guide
 * - /status: System & linking diagnostics
 */

/**
 * Helper to execute token consumption and reply with standardized messages.
 */
async function processTokenLinking(ctx: TeacherBotContext, rawToken: string): Promise<void> {
  const telegramUserId = ctx.from?.id
  const telegramChatId = ctx.chat?.id || telegramUserId
  const telegramUsername = ctx.from?.username || null
  const telegramFirstName = ctx.from?.first_name || null

  if (!telegramUserId) {
    await ctx.reply('⚠️ Không thể xác định Telegram User ID của bạn.')
    return
  }

  const result = await consumeLinkTokenAndBindService({
    rawToken,
    telegramUserId,
    telegramChatId: telegramChatId || telegramUserId,
    telegramUsername,
    telegramFirstName
  })

  if (!result.success) {
    await ctx.reply(
      [
        '❌ *LIÊN KẾT TÀI KHOẢN THẤT BẠI*',
        '',
        result.message,
        '',
        '💡 *Lưu ý:* Mã liên kết chỉ có hiệu lực trong vòng 15 phút và chỉ sử dụng được 1 lần duy nhất. Hãy đăng nhập lại trang Giảng viên TMdemy để tạo mã mới nếu cần.'
      ].join('\n'),
      { parse_mode: 'Markdown' }
    )
    return
  }

  const teacher = result.teacher!
  await ctx.reply(
    [
      '🎉 *LIÊN KẾT TÀI KHOẢN THÀNH CÔNG!*',
      '',
      `Chào mừng Giảng viên: *${teacher.username}*!`,
      `• Telegram User ID: \`${telegramUserId}\``,
      `• Trạng thái liên kết: ✅ Đã kích hoạt`,
      '',
      'Từ bây giờ, bạn có thể sử dụng các lệnh:',
      '• /account - Xem thông tin tài khoản đã liên kết',
      '• /unlink - Hủy liên kết tài khoản khi cần',
      '• /help - Xem danh sách hướng dẫn sử dụng',
      '',
      '🔒 *Bảo mật dữ liệu:* Bot được bảo vệ với mức bảo mật phân quyền Giảng viên cao nhất. Mọi truy vấn thống kê trong tương lai chỉ truy cập dữ liệu thuộc về khóa học của chính bạn.'
    ].join('\n'),
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handler for /start command. Supports deep linking: /start link_<token>
 */
export const handleStartCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const match = ctx.match
  const telegramId = ctx.from?.id ? String(ctx.from.id) : 'Không xác định'

  // 1. Check for deep linking token parameter
  if (match && typeof match === 'string' && match.startsWith('link_')) {
    const rawToken = match.replace(/^link_/, '').trim()
    if (rawToken) {
      await processTokenLinking(ctx, rawToken)
      return
    }
  }

  // 2. Regular /start without deep link parameter
  const profile = ctx.from?.id ? await getTeacherProfileByTelegramIdService(ctx.from.id) : null
  const firstName = ctx.from?.first_name || 'Quý Thầy/Cô'

  if (profile) {
    const message = [
      `👋 *Xin chào, Giảng viên ${profile.username}!*`,
      `Chào mừng bạn quay lại với *TMdemy Teacher Analytics Bot* 🎓`,
      '',
      `✅ *Trạng thái:* Đã liên kết tài khoản Giảng viên TMdemy`,
      `• Email: \`${profile.maskedEmail}\``,
      `• Telegram ID: \`${telegramId}\``,
      '',
      `📋 *Các lệnh khả dụng:*`,
      `• /account - Xem thông tin tài khoản đã liên kết`,
      `• /status - Kiểm tra trạng thái hệ thống`,
      `• /unlink - Hủy liên kết tài khoản Telegram`,
      `• /help - Hướng dẫn sử dụng chi tiết`
    ].join('\n')

    await ctx.reply(message, { parse_mode: 'Markdown' })
    return
  }

  const message = [
    `👋 *Xin chào, ${firstName}!*`,
    `Chào mừng bạn đến với *TMdemy Teacher Analytics Bot* 🎓`,
    '',
    `🤖 *Giới thiệu:*`,
    `Đây là trợ lý phân tích và thống kê dành riêng cho Giảng viên trên nền tảng giáo dục trực tuyến TMdemy.`,
    '',
    `🔒 *Yêu cầu liên kết tài khoản:*`,
    `• Telegram User ID của bạn: \`${telegramId}\``,
    `Để bảo mật dữ liệu doanh thu và khóa học, bạn cần liên kết tài khoản Telegram này với tài khoản Giảng viên TMdemy.`,
    '',
    `👉 *Cách thức liên kết:*`,
    `1. Đăng nhập trang quản trị Giảng viên trên TMdemy.`,
    `2. Vào mục "Cài đặt tài khoản" > "Liên kết Telegram" để lấy mã.`,
    `3. Gửi lệnh \`/link <mã_liên_kết>\` hoặc nhấp vào nút "Mở Bot Telegram" từ trang web.`,
    '',
    `📋 *Các lệnh cơ bản:*`,
    `• /link <mã> - Liên kết tài khoản Giảng viên`,
    `• /account - Kiểm tra trạng thái liên kết`,
    `• /help - Xem hướng dẫn sử dụng`,
    `• /status - Kiểm tra trạng thái Bot`
  ].join('\n')

  await ctx.reply(message, { parse_mode: 'Markdown' })
}

/**
 * Handler for /link <token> command.
 */
export const handleLinkCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const rawToken = (ctx.match as string)?.trim()

  if (!rawToken) {
    await ctx.reply(
      [
        '⚠️ *THIẾU MÃ LIÊN KẾT*',
        '',
        'Cú pháp chuẩn: `/link <mã_liên_kết>`',
        'Ví dụ: `/link a1b2c3d4e5f6...`',
        '',
        '👉 Bạn có thể lấy mã liên kết bằng cách đăng nhập vào cổng thông tin Giảng viên trên website TMdemy.'
      ].join('\n'),
      { parse_mode: 'Markdown' }
    )
    return
  }

  await processTokenLinking(ctx, rawToken)
}

/**
 * Handler for /account command.
 */
export const handleAccountCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const telegramUserId = ctx.from?.id

  if (!telegramUserId) {
    await ctx.reply('⚠️ Không thể xác định Telegram User ID của bạn.')
    return
  }

  const profile = await getTeacherProfileByTelegramIdService(telegramUserId)

  if (!profile) {
    await ctx.reply(
      [
        'ℹ️ *TÀI KHOẢN CHƯA ĐƯỢC LIÊN KẾT*',
        '',
        `Telegram User ID: \`${telegramUserId}\``,
        'Trạng thái: ⚪ Chưa liên kết với TMdemy',
        '',
        '👉 Để liên kết:',
        '1. Đăng nhập cổng quản trị Giảng viên TMdemy trên website.',
        '2. Lấy mã liên kết tại mục "Cài đặt tài khoản" > "Liên kết Telegram".',
        '3. Gửi lệnh `/link <mã_liên_kết>` tại đây.'
      ].join('\n'),
      { parse_mode: 'Markdown' }
    )
    return
  }

  const linkedDateStr = new Date(profile.linkedAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh'
  })

  await ctx.reply(
    [
      '👤 *THÔNG TIN TÀI KHOẢN GIẢNG VIÊN ĐÃ LIÊN KẾT*',
      '',
      `• *Giảng viên:* ${profile.username}`,
      `• *Email:* \`${profile.maskedEmail}\``,
      `• *Vai trò hệ thống:* ${profile.role} (Teacher)`,
      `• *Trạng thái tài khoản:* ✅ Đang hoạt động (${profile.status})`,
      `• *Telegram User ID:* \`${profile.telegramUserId}\``,
      `• *Thời điểm liên kết:* ${linkedDateStr}`,
      '',
      '🔒 *Quyền riêng tư:* Email và dữ liệu tài khoản được bảo vệ nghiêm ngặt. Khi cần ngắt kết nối, sử dụng lệnh `/unlink`.'
    ].join('\n'),
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handler for /unlink command.
 */
export const handleUnlinkCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const telegramUserId = ctx.from?.id

  if (!telegramUserId) {
    await ctx.reply('⚠️ Không thể xác định Telegram User ID của bạn.')
    return
  }

  const profile = await getTeacherProfileByTelegramIdService(telegramUserId)

  if (!profile) {
    await ctx.reply(
      'ℹ️ Tài khoản Telegram này hiện chưa được liên kết với bất kỳ tài khoản Giảng viên TMdemy nào.'
    )
    return
  }

  // Check if confirmation argument was directly passed: /unlink confirm
  const arg = (ctx.match as string)?.trim().toLowerCase()
  if (arg === 'confirm') {
    const result = await unlinkFromTelegramService(telegramUserId)
    if (result.success) {
      await ctx.reply(
        [
          '✅ *ĐÃ HỦY LIÊN KẾT THÀNH CÔNG*',
          '',
          `Tài khoản Telegram đã được gỡ bỏ khỏi tài khoản Giảng viên *${profile.username}*.`,
          'Bạn sẽ không còn nhận được các thông báo hay truy cập dữ liệu thống kê qua tài khoản Telegram này nữa.'
        ].join('\n'),
        { parse_mode: 'Markdown' }
      )
    } else {
      await ctx.reply(result.message)
    }
    return
  }

  // Interactive inline keyboard confirmation
  const keyboard = new InlineKeyboard()
    .text('⚠️ Xác nhận hủy liên kết', 'unlink_confirm')
    .text('❌ Hủy bỏ', 'unlink_cancel')

  await ctx.reply(
    [
      '⚠️ *XÁC NHẬN HỦY LIÊN KẾT TÀI KHOẢN*',
      '',
      `Bạn có chắc chắn muốn hủy liên kết tài khoản Telegram này khỏi Giảng viên *${profile.username}* (\`${profile.maskedEmail}\`) không?`,
      '',
      '• Sau khi hủy, tài khoản Telegram này sẽ mất quyền truy vấn dữ liệu thống kê.',
      '• Bạn có thể liên kết lại bất cứ lúc nào từ trang quản trị TMdemy.',
      '',
      '_Gợi ý: Bạn cũng có thể gửi `/unlink confirm` để xác nhận nhanh._'
    ].join('\n'),
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  )
}

/**
 * Callback query handler for inline button: unlink_confirm
 */
export const handleUnlinkConfirmCallback = async (ctx: TeacherBotContext): Promise<void> => {
  await ctx.answerCallbackQuery()
  const telegramUserId = ctx.from?.id

  if (!telegramUserId) {
    await ctx.editMessageText('⚠️ Không thể xác thực Telegram User ID của bạn.')
    return
  }

  const result = await unlinkFromTelegramService(telegramUserId)

  if (result.success) {
    await ctx.editMessageText(
      [
        '✅ *ĐÃ HỦY LIÊN KẾT THÀNH CÔNG*',
        '',
        'Tài khoản Telegram của bạn đã được gỡ bỏ an toàn khỏi hệ thống Giảng viên TMdemy.',
        'Để liên kết lại trong tương lai, vui lòng tạo mã liên kết mới từ website TMdemy.'
      ].join('\n'),
      { parse_mode: 'Markdown' }
    )
  } else {
    await ctx.editMessageText(result.message)
  }
}

/**
 * Callback query handler for inline button: unlink_cancel
 */
export const handleUnlinkCancelCallback = async (ctx: TeacherBotContext): Promise<void> => {
  await ctx.answerCallbackQuery()
  await ctx.editMessageText(
    '❌ *ĐÃ HỦY THAO TÁC*\n\nTài khoản Giảng viên của bạn vẫn được giữ liên kết an toàn.',
    { parse_mode: 'Markdown' }
  )
}

/**
 * Handler for /help command.
 */
export const handleHelpCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const message = [
    '📖 *HƯỚNG DẪN SỬ DỤNG — TMDEMY TEACHER BOT*',
    '',
    '📊 *Lệnh Thống Kê & Báo Cáo Kinh Doanh:*',
    '🔹 `/revenue [kỳ]` - Báo cáo doanh thu thực nhận (Net), doanh thu gốc, coupon, đơn hàng, top khóa học.',
    '🔹 `/orders [kỳ]` - Thống kê chi tiết đơn hàng (thành công, chờ xử lý, bị hủy, tỷ lệ chuyển đổi).',
    '🔹 `/students [kỳ]` - Thống kê học viên (học viên mới, đang học, hoàn thành, hủy ghi danh).',
    '🔹 `/courses` - Danh mục khóa học toàn diện, tỷ lệ phát sinh doanh số, khóa học bán chạy nhất.',
    '🔹 `/report` - Báo cáo tổng hợp nhanh (Executive Summary) kết hợp mọi mốc thời gian.',
    '🔹 `/schedule` - Quản lý lịch nhận báo cáo kinh doanh tự động (hàng ngày & hàng tuần).',
    '',
    '⚙️ *Lệnh Cơ Bản & Tài Khoản:*',
    '🔹 `/start` - Bắt đầu tương tác với Bot hoặc kích hoạt liên kết deep-link.',
    '🔹 `/account` - Xem thông tin chi tiết tài khoản Giảng viên đã liên kết.',
    '🔹 `/link <mã>` - Liên kết Telegram với tài khoản Giảng viên TMdemy.',
    '🔹 `/unlink` - Hủy liên kết tài khoản Telegram an toàn.',
    '🔹 `/status` - Kiểm tra trạng thái kết nối và định danh Telegram.',
    '🔹 `/help` - Xem danh sách hướng dẫn này.',
    '',
    '💡 *Gợi ý tham số `[kỳ]` cho các lệnh /revenue, /orders, /students:*',
    '• `today` (hoặc `hom_nay`): Hôm nay',
    '• `yesterday` (hoặc `hom_qua`): Hôm qua',
    '• `this_week` (hoặc `tuan_nay`): Tuần này',
    '• `last_7_days` (hoặc `7_ngay`): 7 ngày qua',
    '• `this_month` (hoặc `thang_nay`): Tháng này (Mặc định khi không điền)',
    '• `last_month` (hoặc `thang_truoc`): Tháng trước',
    '• `all_time` (hoặc `toan_thoi_gian`): Toàn thời gian',
    '• `custom YYYY-MM-DD YYYY-MM-DD`: Tùy chỉnh (Ví dụ: `custom 2026-01-01 2026-03-31`)',
    '',
    '🔒 *Bảo mật:* Dữ liệu hiển thị được cô lập nghiêm ngặt, chỉ thuộc về các khóa học do chính bạn giảng dạy.'
  ].join('\n')

  await ctx.reply(message, { parse_mode: 'Markdown' })
}

/**
 * Handler for /status command.
 */
export const handleStatusCommand = async (ctx: TeacherBotContext): Promise<void> => {
  const telegramId = ctx.from?.id ? String(ctx.from.id) : 'Không xác định'
  const chatType = ctx.chat?.type || 'private'
  const isPrivate = chatType === 'private' ? '✅ Tin nhắn riêng tư (An toàn)' : '⚠️ Kênh công khai'

  const profile = ctx.from?.id ? await getTeacherProfileByTelegramIdService(ctx.from.id) : null
  const linkStatus = profile
    ? `✅ Đã liên kết với Giảng viên *${profile.username}* (\`${profile.maskedEmail}\`)`
    : '⚪ Chưa liên kết tài khoản Giảng viên'

  const message = [
    `🟢 *TRẠNG THÁI HỆ THỐNG — TMDEMY TEACHER BOT*`,
    '',
    `• *Trạng thái Bot:* Đang hoạt động bình thường (Online)`,
    `• *Kênh bảo mật:* ${isPrivate}`,
    `• *Telegram User ID:* \`${telegramId}\``,
    `• *Tình trạng liên kết:* ${linkStatus}`,
    `• *Thời gian phản hồi:* ${new Date().toISOString()}`,
    '',
    `_Hệ thống backend Express & cơ sở dữ liệu TMdemy hoạt động ổn định._`
  ].join('\n')

  await ctx.reply(message, { parse_mode: 'Markdown' })
}
