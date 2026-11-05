import { MiddlewareFn } from 'grammy'
import { TeacherBotContext } from '../types'

/**
 * TMDEMY — TELEGRAM PRIVATE CHAT ENFORCEMENT MIDDLEWARE (TG-01)
 *
 * Enforces that all interactions with the Teacher Analytics Bot occur strictly
 * within private (1-on-1) chats between the teacher and the bot.
 *
 * SECURITY & PRIVACY RATIONALE:
 * - Teacher analytics include confidential business metrics: course revenues,
 *   student enrollment counts, order histories, and personal payout figures.
 * - Processing commands or queries inside public or shared groups/supergroups/channels
 *   risks severe financial and pedagogical data leakage to third parties.
 */
export const requirePrivateChat: MiddlewareFn<TeacherBotContext> = async (ctx, next) => {
  const chatType = ctx.chat?.type

  if (chatType && chatType !== 'private') {
    await ctx.reply(
      '⚠️ Vì lý do bảo mật dữ liệu doanh thu và thống kê khóa học, TMdemy Teacher Bot chỉ hoạt động trong tin nhắn riêng tư (1-on-1).\n\nVui lòng nhắn tin trực tiếp với Bot để tiếp tục.'
    )
    return
  }

  // Populate numeric Telegram User ID for downstream handlers if available
  if (ctx.from?.id) {
    ctx.telegramUserId = ctx.from.id
  }

  return next()
}

