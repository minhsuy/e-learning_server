import dotenv from 'dotenv'

dotenv.config()

/**
 * TMDEMY — E2B SANDBOX CONFIGURATION
 * 
 * Centralized configuration loader for the E2B isolated code execution engine.
 * Reads API credentials, template definitions, and execution boundaries.
 */

export interface E2BConfig {
  apiKey: string
  template?: string
  sandboxTimeoutMs: number
  commandTimeoutMs: number
  maxConcurrency: number
}

export const getE2BConfig = (): E2BConfig => {
  // Support standard E2B_API_KEY and legacy tmdemy-sandbox key
  const apiKey = (process.env.E2B_API_KEY || process.env['tmdemy-sandbox'] || '').trim()

  // Support standard E2B_TEMPLATE and E2B_TEMPLATE_ID
  const rawTemplate = (
    process.env.E2B_TEMPLATE ||
    process.env.E2B_TEMPLATE_ID ||
    ''
  ).trim()

  // Use custom template if provided, otherwise undefined defaults to E2B base template
  const template = rawTemplate || undefined

  const sandboxTimeoutMs = Math.max(
    10000,
    Number(process.env.E2B_SANDBOX_TIMEOUT_MS) || 60000
  )

  const commandTimeoutMs = Math.max(
    500,
    Number(process.env.E2B_COMMAND_TIMEOUT_MS) || 10000
  )

  const maxConcurrency = Math.min(
    5,
    Math.max(1, Number(process.env.E2B_MAX_CONCURRENCY) || 2)
  )

  return {
    apiKey,
    template,
    sandboxTimeoutMs,
    commandTimeoutMs,
    maxConcurrency
  }
}
