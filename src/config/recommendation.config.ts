import dotenv from 'dotenv'

dotenv.config()

/**
 * TMDEMY — RECOMMENDATION MICROSERVICE CONFIGURATION (REC-09)
 *
 * Centralized configuration loader for the Python FastAPI Recommendation Microservice.
 * Handles service URLs, client timeouts, API keys, and feature enablement.
 * Validates network boundaries and prevents hardcoded secrets in production.
 */

export interface RecommendationServiceConfig {
  serviceUrl: string
  apiKey: string
  timeoutMs: number
  enabled: boolean
}

/**
 * Validates and retrieves the Recommendation Microservice configuration.
 * When `requireApiKey` is true, throws an error if `RECOMMENDATION_API_KEY` is missing or empty.
 */
export function getRecommendationConfig(requireApiKey = false): RecommendationServiceConfig {
  const rawUrl = process.env.RECOMMENDATION_SERVICE_URL?.trim() || 'http://127.0.0.1:8000'

  // Validate URL format and protocol
  let serviceUrl: string
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`RECOMMENDATION_SERVICE_URL must use HTTP or HTTPS protocol, got: ${parsed.protocol}`)
    }
    // Remove trailing slash for consistency
    serviceUrl = parsed.origin + parsed.pathname.replace(/\/+$/, '')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid RECOMMENDATION_SERVICE_URL: ${msg}`)
  }

  const apiKey = process.env.RECOMMENDATION_API_KEY?.trim() || ''
  if (requireApiKey && !apiKey) {
    throw new Error(
      'Missing or empty RECOMMENDATION_API_KEY in server environment. Hardcoded secrets are prohibited.'
    )
  }

  const rawTimeout = Number(process.env.RECOMMENDATION_TIMEOUT_MS)
  const timeoutMs =
    !isNaN(rawTimeout) && rawTimeout >= 500 && rawTimeout <= 60000
      ? rawTimeout
      : 5000 // 5s default

  const rawEnabled = process.env.RECOMMENDATION_ENABLED?.trim().toLowerCase()
  const enabled = rawEnabled !== 'false' && rawEnabled !== '0'

  return {
    serviceUrl,
    apiKey,
    timeoutMs,
    enabled
  }
}

