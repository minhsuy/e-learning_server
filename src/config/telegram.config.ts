import dotenv from 'dotenv'

dotenv.config()

/**
 * TMDEMY — TELEGRAM TEACHER BOT CONFIGURATION (TG-01)
 *
 * Centralized configuration loader for the Telegram Teacher Analytics Bot.
 * Manages bot tokens, enablement flags, polling options, and secret sanitization.
 *
 * SECURITY INVARIANTS:
 * - TELEGRAM_BOT_TOKEN must never be hardcoded or logged in plaintext.
 * - Missing or invalid tokens must never crash the Express application.
 */

export interface TelegramConfig {
  /**
   * Telegram Bot API Token obtained from @BotFather.
   * Format: <number>:<alphanumeric-secret>
   */
  botToken: string

  /**
   * Whether the Telegram bot service is enabled.
   * Controlled via TELEGRAM_BOT_ENABLED ('true' | 'false').
   */
  enabled: boolean

  /**
   * Whether the loaded configuration is syntactically valid for initialization.
   */
  isValid: boolean

  /**
   * Polling timeout in seconds (for long polling getUpdates).
   * Default: 30 seconds.
   */
  pollingTimeoutSeconds: number
}

/**
 * Masks a Telegram bot token for safe logging (e.g., 123456:ABC...XYZ -> 123456:***XYZ).
 */
export function maskTelegramToken(token?: string): string {
  if (!token || typeof token !== 'string') return '[EMPTY_TOKEN]'
  const trimmed = token.trim()
  if (trimmed.length < 10) return '***'
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx > 0) {
    const prefix = trimmed.slice(0, colonIdx)
    const suffix = trimmed.slice(-4)
    return `${prefix}:***${suffix}`
  }
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-3)}`
}

/**
 * Validates the syntax of a Telegram Bot token.
 * A standard Telegram bot token matches: ^\d{6,12}:[A-Za-z0-9_-]{30,50}$
 */
export function isValidTelegramTokenSyntax(token?: string): boolean {
  if (!token || typeof token !== 'string') return false
  const trimmed = token.trim()
  // Relaxed regex matching standard Telegram Bot API token syntax
  return /^\d{6,12}:[A-Za-z0-9_-]{25,}$/.test(trimmed)
}

/**
 * Retrieves and validates the Telegram Bot configuration from environment variables.
 * Safe to call at any time; never throws exceptions.
 */
export function getTelegramConfig(): TelegramConfig {
  const rawToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || ''
  const rawEnabled = process.env.TELEGRAM_BOT_ENABLED?.trim().toLowerCase()

  // Default enabled to true if TELEGRAM_BOT_ENABLED is not explicitly false/0
  const isExplicitlyDisabled = rawEnabled === 'false' || rawEnabled === '0'
  const hasToken = rawToken.length > 0
  const enabled = !isExplicitlyDisabled && hasToken

  const isValid = hasToken && isValidTelegramTokenSyntax(rawToken)

  const pollingTimeoutSeconds = 30

  return {
    botToken: rawToken,
    enabled,
    isValid,
    pollingTimeoutSeconds
  }
}

