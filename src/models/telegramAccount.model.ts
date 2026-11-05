import { z } from 'zod'

/**
 * TMDEMY — TELEGRAM TEACHER ACCOUNT APPLICATION MODELS (TG-02A)
 *
 * Defines Zod schemas and TypeScript types for:
 * - TelegramAccount entity representation
 * - One-time linking token generation & responses
 * - Linking status and unlinking payloads
 *
 * BigInt handling: Telegram IDs (User ID & Chat ID) are serialized
 * as strings to prevent JSON serialization errors while preserving 64-bit precision.
 */

export const TelegramAccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  telegramUserId: z.string().regex(/^\d+$/, 'telegramUserId must be a numeric string'),
  telegramChatId: z.string().regex(/^-?\d+$/, 'telegramChatId must be a numeric string'),
  telegramUsername: z.string().nullable().optional(),
  telegramFirstName: z.string().nullable().optional(),
  linkedAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type TelegramAccountDTO = z.infer<typeof TelegramAccountSchema>

export const TelegramLinkTokenResponseSchema = z.object({
  token: z.string().min(32),
  deepLink: z.string().url(),
  expiresAt: z.string().datetime(),
  expiresInMinutes: z.number().int().positive()
})

export type TelegramLinkTokenResponse = z.infer<typeof TelegramLinkTokenResponseSchema>

export const TelegramLinkingStatusSchema = z.object({
  isLinked: z.boolean(),
  account: TelegramAccountSchema.nullable().optional()
})

export type TelegramLinkingStatus = z.infer<typeof TelegramLinkingStatusSchema>

export const TelegramTeacherProfileSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  maskedEmail: z.string(),
  role: z.string(),
  status: z.string(),
  telegramUserId: z.string(),
  telegramUsername: z.string().nullable().optional(),
  linkedAt: z.coerce.date()
})

export type TelegramTeacherProfile = z.infer<typeof TelegramTeacherProfileSchema>

