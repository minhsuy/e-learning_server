import { getRecommendationConfig, RecommendationServiceConfig } from '~/config/recommendation.config'
import {
  HybridPersonalizedRequest,
  HybridRecommendationResponse,
  HybridRecommendationResponseSchema,
  HybridSimilarRequest
} from '~/models/recommendation.model'

/**
 * Custom error class for Recommendation Microservice communication failures.
 */
export class RecommendationServiceError extends Error {
  public readonly statusCode: number
  public readonly errorCode: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message)
    this.name = 'RecommendationServiceError'
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.isOperational = true
    Object.setPrototypeOf(this, RecommendationServiceError.prototype)
  }
}

/**
 * TMDEMY — RECOMMENDATION MICROSERVICE HTTP CLIENT (REC-09)
 *
 * Dedicated, resilient HTTP client for interacting with the Python FastAPI Recommendation Microservice.
 * Enforces:
 * - Shared secret authentication via X-API-Key header
 * - Strict timeout boundaries via AbortController
 * - Runtime response validation via Zod
 * - Granular error translation for 401, 404, 422, 500, 503, and network timeouts
 * - Prevention of sensitive profile data leakage in error logs
 */
export class RecommendationMicroserviceClient {
  private readonly config: RecommendationServiceConfig
  private readonly customFetch?: typeof fetch

  constructor(customConfig?: Partial<RecommendationServiceConfig>, customFetch?: typeof fetch) {
    const baseConfig = getRecommendationConfig()
    this.config = {
      ...baseConfig,
      ...customConfig
    }
    this.customFetch = customFetch
  }

  private get fetchFn(): typeof fetch {
    return this.customFetch || globalThis.fetch
  }

  /**
   * Internal HTTP request helper with timeout and sanitization.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true
  ): Promise<T> {
    if (!this.config.enabled) {
      throw new RecommendationServiceError(
        'Recommendation service is disabled by server configuration.',
        503,
        'SERVICE_DISABLED'
      )
    }

    if (requiresAuth && !this.config.apiKey) {
      throw new RecommendationServiceError(
        'Recommendation service authentication key is not configured.',
        503,
        'AUTH_KEY_MISSING'
      )
    }

    const url = `${this.config.serviceUrl}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    if (requiresAuth && this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey
    }

    try {
      const response = await this.fetchFn(url, {
        ...options,
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Handle non-2xx HTTP responses
      if (!response.ok) {
        let errorDetail = ''
        try {
          const errorJson = await response.json()
          if (typeof errorJson?.detail === 'string') {
            errorDetail = errorJson.detail
          } else if (Array.isArray(errorJson?.validation_errors)) {
            errorDetail = JSON.stringify(errorJson.validation_errors)
          } else if (errorJson?.detail) {
            errorDetail = JSON.stringify(errorJson.detail)
          }
        } catch {
          errorDetail = response.statusText || `HTTP ${response.status}`
        }

        switch (response.status) {
          case 401:
            throw new RecommendationServiceError(
              'Recommendation service authentication failure.',
              503,
              'AUTHENTICATION_FAILURE'
            )
          case 404:
            throw new RecommendationServiceError(
              errorDetail || 'Requested resource not found in recommendation catalog.',
              404,
              'NOT_FOUND'
            )
          case 422:
            throw new RecommendationServiceError(
              `Recommendation request validation error: ${errorDetail}`,
              400,
              'UNPROCESSABLE_ENTITY'
            )
          case 503:
            throw new RecommendationServiceError(
              'Recommendation service is currently not ready or unavailable.',
              503,
              'SERVICE_UNAVAILABLE'
            )
          default:
            throw new RecommendationServiceError(
              `Recommendation service error (${response.status}): ${errorDetail}`,
              502,
              'BAD_GATEWAY'
            )
        }
      }

      // Parse JSON body
      let data: unknown
      try {
        data = await response.json()
      } catch (jsonErr: unknown) {
        throw new RecommendationServiceError(
          'Recommendation service returned malformed JSON response.',
          502,
          'MALFORMED_RESPONSE'
        )
      }

      return data as T
    } catch (err: unknown) {
      clearTimeout(timeoutId)

      if (err instanceof RecommendationServiceError) {
        throw err
      }

      // Check for AbortError (timeout)
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
        throw new RecommendationServiceError(
          `Recommendation service request timed out after ${this.config.timeoutMs}ms.`,
          504,
          'TIMEOUT'
        )
      }

      // Network / Connection Refused
      const msg = err instanceof Error ? err.message : String(err)
      throw new RecommendationServiceError(
        `Failed to connect to recommendation service: ${msg}`,
        503,
        'CONNECTION_FAILED'
      )
    }
  }

  /**
   * Request Item-to-Item Similar Course recommendations.
   * POST /api/v1/recommendations/hybrid/similar
   */
  public async getSimilarCourses(
    request: HybridSimilarRequest
  ): Promise<HybridRecommendationResponse> {
    const rawData = await this.request<unknown>(
      '/api/v1/recommendations/hybrid/similar',
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
      true
    )

    const parseResult = HybridRecommendationResponseSchema.safeParse(rawData)
    if (!parseResult.success) {
      throw new RecommendationServiceError(
        `Invalid response schema from recommendation service: ${parseResult.error.message}`,
        502,
        'SCHEMA_VALIDATION_ERROR'
      )
    }

    return parseResult.data
  }

  /**
   * Request User-to-Item Personalized recommendations.
   * POST /api/v1/recommendations/hybrid/personalized
   */
  public async getPersonalizedRecommendations(
    request: HybridPersonalizedRequest
  ): Promise<HybridRecommendationResponse> {
    const rawData = await this.request<unknown>(
      '/api/v1/recommendations/hybrid/personalized',
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
      true
    )

    const parseResult = HybridRecommendationResponseSchema.safeParse(rawData)
    if (!parseResult.success) {
      throw new RecommendationServiceError(
        `Invalid response schema from recommendation service: ${parseResult.error.message}`,
        502,
        'SCHEMA_VALIDATION_ERROR'
      )
    }

    return parseResult.data
  }

  /**
   * Check service liveness probe.
   * GET /health
   */
  public async checkHealth(): Promise<{ status: string; service?: string; version?: string }> {
    return this.request<{ status: string; service?: string; version?: string }>(
      '/health',
      { method: 'GET' },
      false
    )
  }

  /**
   * Check service engine readiness probe.
   * GET /ready
   */
  public async checkReadiness(): Promise<{
    status: string
    ready: boolean
    catalog_course_count?: number
    bm25_doc_count?: number
    embedding_shape?: number[]
  }> {
    return this.request<{
      status: string
      ready: boolean
      catalog_course_count?: number
      bm25_doc_count?: number
      embedding_shape?: number[]
    }>('/ready', { method: 'GET' }, false)
  }
}

export const defaultRecommendationClient = new RecommendationMicroserviceClient()

