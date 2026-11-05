import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

/**
 * TMDEMY — AI MICROSERVICE CONFIGURATION (STEP 7H)
 *
 * Centralized configuration loader for the FastAPI AI Microservice integration
 * and single default AI model (gemini-3.1-flash-lite).
 * Handles service URLs, client timeouts, polling intervals, and service-to-service credentials.
 * Rejects insecure fallbacks and validates network boundary parameters.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'

export interface AiServiceConfig {
  serviceUrl: string
  apiKey: string
  callbackSecret?: string
  timeoutMs: number
  pollIntervalMs: number
  maxPollAttempts: number
  defaultModelId: string
}

/**
 * Validates and retrieves the AI Microservice configuration.
 * When `requireApiKey` is true, throws an error if `AI_SERVICE_API_KEY` is missing or empty.
 */
export function getAiServiceConfig(requireApiKey = true): AiServiceConfig {
  const rawUrl = process.env.AI_SERVICE_URL?.trim() || 'http://127.0.0.1:8000'

  // Validate URL format and protocol
  let serviceUrl: string
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`AI_SERVICE_URL must use HTTP or HTTPS protocol, got: ${parsed.protocol}`)
    }
    // Remove trailing slash for consistency
    serviceUrl = parsed.origin + parsed.pathname.replace(/\/+$/, '')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid AI_SERVICE_URL: ${msg}`)
  }

  const apiKey = process.env.AI_SERVICE_API_KEY?.trim() || ''
  if (requireApiKey && !apiKey) {
    throw new Error(
      'Missing or empty AI_SERVICE_API_KEY in server environment. Hardcoded secrets are prohibited.'
    )
  }

  // Optional dedicated callback secret for inbound FastAPI -> Node.js callbacks
  // Falls back to AI_SERVICE_API_KEY if configured, but NEVER a hardcoded default string!
  const callbackSecret = (
    process.env.AI_SERVICE_CALLBACK_SECRET?.trim() ||
    apiKey ||
    undefined
  )

  const rawTimeout = Number(process.env.AI_SERVICE_TIMEOUT_MS)
  const timeoutMs = (!isNaN(rawTimeout) && rawTimeout >= 1000 && rawTimeout <= 300000)
    ? rawTimeout
    : 30000 // 30s default

  const rawPollInterval = Number(process.env.AI_JOB_POLL_INTERVAL_MS)
  const pollIntervalMs = (!isNaN(rawPollInterval) && rawPollInterval >= 1000 && rawPollInterval <= 60000)
    ? rawPollInterval
    : 5000 // 5s default

  const rawMaxAttempts = Number(process.env.AI_JOB_MAX_POLL_ATTEMPTS)
  const maxPollAttempts = (!isNaN(rawMaxAttempts) && rawMaxAttempts >= 1 && rawMaxAttempts <= 720)
    ? rawMaxAttempts
    : 60 // 60 attempts (5 minutes at 5s)

  return {
    serviceUrl,
    apiKey,
    callbackSecret,
    timeoutMs,
    pollIntervalMs,
    maxPollAttempts,
    defaultModelId: GEMINI_MODEL
  }
}

/**
 * Validates inbound AI callback secret without exposing secrets.
 * Fails closed if no secret is configured or if keys do not match.
 */
export function verifyInboundAiSecret(providedKey: unknown): boolean {
  if (typeof providedKey !== 'string' || !providedKey.trim()) {
    return false
  }

  const config = getAiServiceConfig(false)
  const secret = config.callbackSecret

  if (!secret) {
    // Fail closed: No secret configured on server, cannot authenticate
    return false
  }

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(providedKey.trim(), 'utf8')
  const b = Buffer.from(secret, 'utf8')
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(a, b)
}
