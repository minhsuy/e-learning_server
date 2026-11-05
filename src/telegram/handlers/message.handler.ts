import { TeacherBotContext } from '../types'

/**
 * TMDEMY — TELEGRAM DEFAULT MESSAGE HANDLER (TG-01)
 *
 * Catches all non-command text messages sent by teachers or prospective users.
 * Provides a standardized Vietnamese response explaining that natural language
 * statistical Q&A and AI assistant capabilities are currently under development.
 */
export const handleDefaultMessage = async (ctx: TeacherBotContext): Promise<void> => {
  // Required exact text response as specified by TG-01
  await ctx.reply('Chức năng hỏi đáp thống kê đang được phát triển.')
}

