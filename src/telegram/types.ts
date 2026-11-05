import { Context } from 'grammy'
import { TelegramTeacherProfile } from '~/models/telegramAccount.model'

/**
 * TMDEMY — TELEGRAM BOT TYPES (TG-02A)
 *
 * Defines context extensions, session shapes, and shared types for the
 * TMdemy Telegram Teacher Analytics Bot.
 */

export interface TeacherBotContext extends Context {
  /**
   * Verified Telegram numeric user ID.
   * Immutable 64-bit integer assigned by Telegram.
   * This is the ONLY trusted identifier for teacher account linking.
   */
  telegramUserId?: number

  /**
   * Verified TMdemy Teacher Profile, populated by authorization middleware.
   */
  teacherProfile?: TelegramTeacherProfile | null
}

export interface BotStatusResponse {
  isOnline: boolean
  botUsername?: string
  runningSince?: Date
  uptimeSeconds?: number
}
