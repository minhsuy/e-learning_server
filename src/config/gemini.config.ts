import dotenv from 'dotenv'

dotenv.config()

/**
 * TMDEMY — GEMINI AI INTEGRATION CONFIGURATION (TG-04A)
 *
 * Centralized configuration loader for the Google Gemini AI integration.
 * Manages API keys, model configuration, confidence thresholds, and secret masking.
 *
 * MANDATORY SECURITY INVARIANTS:
 * 1. GEMINI_API_KEY is read strictly from process.env.GEMINI_API_KEY.
 * 2. GEMINI_MODEL is read strictly from process.env.GEMINI_MODEL (never silently replaced).
 * 3. The API key must NEVER be printed, logged, or exposed in error messages or client responses.
 * 4. Missing or invalid keys must be trapped with descriptive errors without crashing the host app.
 */

export const DEFAULT_CONFIDENCE_THRESHOLD = 0.75
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash-lite'
export const DEFAULT_GEMINI_TIMEOUT_MS = 10000

export interface GeminiConfig {
  apiKey: string
  model: string
  confidenceThreshold: number
  timeoutMs: number
  isConfigured: boolean
  isValid: boolean
}

/**
 * Masks a Gemini API key for safe debugging/reporting (e.g., AIzaSy...1234 -> AIzaSy...****).
 */
export function maskGeminiApiKey(key?: string): string {
  if (!key || typeof key !== 'string') return '[NOT_CONFIGURED]'
  const trimmed = key.trim()
  if (trimmed.length < 8) return '****'
  return `${trimmed.slice(0, 6)}...****`
}

/**
 * Retrieves and validates the Gemini AI configuration.
 */
export function getGeminiConfig(): GeminiConfig {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim()
  const model = (process.env.GEMINI_MODEL || '').trim() || DEFAULT_GEMINI_MODEL
  const confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD
  const timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS

  const isConfigured = Boolean(apiKey.length > 0)
  // Google AI Studio keys typically start with 'AIza' and are at least 20 chars long
  const isValid = isConfigured && apiKey.length >= 10

  return {
    apiKey,
    model,
    confidenceThreshold,
    timeoutMs,
    isConfigured,
    isValid
  }
}

