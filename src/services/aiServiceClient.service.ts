import { z } from 'zod'
import { getAiServiceConfig } from '~/config/ai.config'

/**
 * TMDEMY — FASTAPI AI MICROSERVICE HTTP CLIENT
 * 
 * Reusable, typed HTTP client for orchestrating asynchronous AI tasks:
 * - Whisper speech-to-text transcription
 * - Gemini pedagogical summarization
 * - Gemini quiz generation
 * 
 * Enforces:
 * - X-API-Key service-to-service authentication
 * - Strict request timeout via AbortController
 * - Zod validation on external responses
 * - Idempotency boundaries (no blind POST retries, safe bounded GET retries)
 * - Credential and payload sanitization in errors/logs
 */

// ==========================================
// 1. ZOD SCHEMAS FOR FASTAPI RESPONSES
// ==========================================

export const fastApiHealthSchema = z.object({
  status: z.string(),
  service: z.string(),
  version: z.string(),
  queue_size: z.number().int()
})

export const fastApiJobCreateSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  message: z.string(),
  is_replay: z.boolean().default(false),
  idempotency_key: z.string().nullable().optional()
})

export const fastApiJobStatusEnum = z.enum([
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'PARTIAL_SUCCESS',
  'FAILED'
])

export const fastApiJobStageEnum = z.enum([
  'QUEUED',
  'DOWNLOADING_MEDIA',
  'VALIDATING_MEDIA',
  'EXTRACTING_AUDIO',
  'TRANSCRIBING',
  'EXPORTING',
  'SUMMARIZING',
  'GENERATING_QUIZ',
  'GENERATING_CODING_EXERCISE',
  'COMPLETED',
  'FAILED'
])

export const fastApiJobStatusSchema = z.object({
  job_id: z.string(),
  status: fastApiJobStatusEnum,
  current_stage: z.string(),
  created_at: z.string(),
  started_at: z.string().nullable().optional(),
  finished_at: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  idempotency_key: z.string().nullable().optional()
})

export const fastApiJobResultSchema = z.object({
  job_id: z.string(),
  status: fastApiJobStatusEnum,
  transcript: z.string().nullable().optional(),
  transcript_original: z.string().nullable().optional(),
  transcript_refined: z.string().nullable().optional(),
  transcriptOriginal: z.string().nullable().optional(),
  transcriptRefined: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  quiz: z.unknown().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  error_message: z.string().nullable().optional()
})

export const fastApiRemoteMediaJobRequestSchema = z.object({
  mediaUrl: z.string().url(),
  sourceType: z.enum(['bunny_stream', 'direct_url']).default('bunny_stream'),
  idempotencyKey: z.string().optional(),
  title: z.string().optional(),
  lessonId: z.string().optional(),
  sourceGeneration: z.number().int().optional(),
  sourceVideoId: z.string().optional(),
  model: z.string().optional()
})

export const fastApiRemoteMediaJobResponseSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  message: z.string(),
  is_replay: z.boolean().default(false),
  idempotency_key: z.string().nullable().optional()
})

// ==========================================
// STEP 7G: SUMMARY GENERATION DIRECT SCHEMAS
// ==========================================

export const fastApiSummaryGenerateResponseSchema = z.object({
  summary: z.string(),
  model_used: z.string(),
  duration_seconds: z.number().optional()
})
export type FastApiSummaryGenerateResponse = z.infer<typeof fastApiSummaryGenerateResponseSchema>

// ==========================================
// STEP 7A: QUIZ GENERATION SCHEMAS
// ==========================================

export const fastApiQuizOptionSchema = z.object({
  content: z.string().optional().default(''),
  text: z.string().optional().default(''),
  id: z.string().optional().nullable(),
  isCorrect: z.boolean().optional().default(false)
}).transform((opt) => ({
  content: opt.content || opt.text || '',
  text: opt.text || opt.content || '',
  id: opt.id,
  isCorrect: opt.isCorrect
}))

export const fastApiQuizQuestionSchema = z.object({
  content: z.string().optional().default(''),
  question: z.string().optional().default(''),
  type: z.string().optional().default('SINGLE_CHOICE'),
  difficulty: z.string().optional().default('MEDIUM'),
  options: z.array(fastApiQuizOptionSchema).length(4, 'Exactly 4 options required'),
  correctAnswer: z.string().optional().nullable(),
  explanation: z.string().min(1, 'Explanation is required'),
  sourceTimestamp: z.string().optional().nullable()
}).transform((q) => {
  const content = q.content || q.question || ''
  // Determine correct answer: either from option with isCorrect = true, or option matching correctAnswer letter
  let resolvedCorrectAnswer = ''
  const correctOpt = q.options.find((o) => o.isCorrect)
  if (correctOpt) {
    resolvedCorrectAnswer = correctOpt.content
  } else if (q.correctAnswer && /^[A-D]$/i.test(q.correctAnswer)) {
    const letterIdx = q.correctAnswer.toUpperCase().charCodeAt(0) - 65
    if (q.options[letterIdx]) {
      resolvedCorrectAnswer = q.options[letterIdx].content
    }
  }

  return {
    content,
    question: content,
    type: q.type,
    difficulty: q.difficulty,
    options: q.options,
    correctAnswer: resolvedCorrectAnswer || q.options[0].content,
    explanation: q.explanation,
    sourceTimestamp: q.sourceTimestamp || null
  }
})

export const fastApiQuizDataSchema = z.object({
  schemaVersion: z.string().optional().default('1.0'),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  language: z.string().optional().default('vi'),
  difficulty: z.string().optional().default('MEDIUM'),
  questions: z.array(fastApiQuizQuestionSchema).min(1),
  metadata: z.record(z.unknown()).optional()
})

export const fastApiQuizGenerateResponseSchema = z.object({
  success: z.boolean().default(true),
  data: fastApiQuizDataSchema,
  metadata: z.record(z.unknown()).optional()
})

export const fastApiQuizGenerateRequestSchema = z.object({
  lesson_title: z.string().min(1),
  transcript: z.string().min(1),
  summary: z.string().nullable().optional(),
  question_count: z.number().int().min(1).max(30).default(5),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED']).default('MEDIUM'),
  teacher_instructions: z.string().nullable().optional(),
  language: z.string().default('vi'),
  model: z.string().nullable().optional(),
  video_duration_seconds: z.number().nullable().optional(),
  async_mode: z.boolean().default(false)
})

export type FastApiQuizGenerateRequest = z.infer<typeof fastApiQuizGenerateRequestSchema>
export type FastApiQuizGenerateResponse = z.infer<typeof fastApiQuizGenerateResponseSchema>

// ==========================================
// STEP 7B: CODING EXERCISE GENERATION SCHEMAS
// ==========================================

export const fastApiContractParameterSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1)
})

export const fastApiExecutionContractSchema = z.object({
  type: z.string().default('function_call'),
  functionName: z.string().min(1),
  parameters: z.array(fastApiContractParameterSchema),
  returnType: z.string().min(1)
})

export const fastApiCodingTestCaseSchema = z.object({
  input: z.array(z.unknown()),
  expectedOutput: z.unknown(),
  isHidden: z.boolean().default(false),
  order: z.number().int().default(1),
  weight: z.number().int().min(1).max(100).default(50),
  explanation: z.string().optional().nullable().default(null)
})

export const fastApiCodingExerciseDataSchema = z.object({
  schemaVersion: z.string().optional().default('1.0'),
  verificationStatus: z.string().optional().default('UNVERIFIED'),
  title: z.string().min(3),
  slug: z.string().min(1),
  description: z.string().min(10),
  programmingLanguage: z.string().default('javascript'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
  starterCode: z.string().min(10),
  referenceSolution: z.string().min(10),
  executionContract: fastApiExecutionContractSchema,
  timeLimit: z.number().int().min(100).max(10000).default(2000),
  memoryLimit: z.number().int().min(16000).max(512000).default(128000),
  order: z.number().int().default(1),
  testCases: z.array(fastApiCodingTestCaseSchema).min(2),
  explanation: z.string().optional().nullable(),
  sourceTimestamp: z.string().optional().nullable(),
  verificationMetadata: z.record(z.unknown()).optional()
})

export const fastApiCodingExerciseGenerateResponseSchema = z.object({
  exercise: fastApiCodingExerciseDataSchema,
  verificationStatus: z.string().optional().default('UNVERIFIED'),
  verification_status: z.string().optional(),
  verificationMetadata: z.record(z.unknown()).optional().default({}),
  verification_metadata: z.record(z.unknown()).optional(),
  sourceInfo: z.record(z.unknown()).optional().default({}),
  source_info: z.record(z.unknown()).optional()
}).transform((res) => ({
  exercise: res.exercise,
  verificationStatus: res.verificationStatus || res.verification_status || 'UNVERIFIED',
  verificationMetadata: res.verificationMetadata || res.verification_metadata || {},
  sourceInfo: res.sourceInfo || res.source_info || {}
}))

export const fastApiCodingExerciseGenerateRequestSchema = z.object({
  lesson_title: z.string().min(1),
  transcript: z.string().min(1),
  summary: z.string().nullable().optional(),
  language: z.string().default('javascript'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
  exercise_count: z.number().int().min(1).max(5).default(1),
  teacher_instructions: z.string().nullable().optional(),
  async_mode: z.boolean().default(false),
  model: z.string().nullable().optional()
})

export type FastApiCodingExerciseGenerateRequest = z.infer<typeof fastApiCodingExerciseGenerateRequestSchema>
export type FastApiCodingExerciseGenerateResponse = z.infer<typeof fastApiCodingExerciseGenerateResponseSchema>

export type FastApiHealth = z.infer<typeof fastApiHealthSchema>
export type FastApiJobCreate = z.infer<typeof fastApiJobCreateSchema>
export type FastApiJobStatus = z.infer<typeof fastApiJobStatusSchema>
export type FastApiJobResult = z.infer<typeof fastApiJobResultSchema>
export type FastApiRemoteMediaJobRequest = z.infer<typeof fastApiRemoteMediaJobRequestSchema>
export type FastApiRemoteMediaJobResponse = z.infer<typeof fastApiRemoteMediaJobResponseSchema>

// ==========================================
// 2. ERROR CLASSES
// ==========================================

export class AiServiceError extends Error {
  public readonly statusCode?: number
  public readonly endpoint: string
  public readonly isRetryable: boolean

  constructor(message: string, endpoint: string, statusCode?: number, isRetryable = false) {
    // Sanitize any potential API keys from message
    const sanitizedMsg = message.replace(/(X-API-Key|[a-zA-Z0-9_-]+key|[a-zA-Z0-9_-]+secret)=[\w-]+/gi, '[REDACTED]')
    super(`[AI Service Client] ${sanitizedMsg}`)
    this.name = 'AiServiceError'
    this.endpoint = endpoint
    this.statusCode = statusCode
    this.isRetryable = isRetryable
  }
}

export class AiJobStillRunningError extends AiServiceError {
  constructor(jobId: string) {
    super(`Job ${jobId} is still in progress (HTTP 409 Conflict)`, `/api/v1/jobs/${jobId}/result`, 409, true)
    this.name = 'AiJobStillRunningError'
  }
}

// ==========================================
// 3. FASTAPI CLIENT CLASS / FUNCTIONS
// ==========================================

interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: BodyInit
  timeoutMs?: number
  retryCount?: number
}

export class AiServiceClient {
  private customBaseUrl?: string
  private customTimeoutMs?: number

  constructor(customBaseUrl?: string, defaultTimeoutMs?: number) {
    this.customBaseUrl = customBaseUrl
    this.customTimeoutMs = defaultTimeoutMs
  }

  public getBaseUrl(): string {
    if (this.customBaseUrl) return this.customBaseUrl
    return getAiServiceConfig(false).serviceUrl
  }

  public setBaseUrl(url?: string): void {
    this.customBaseUrl = url
  }

  /**
   * Helper to perform authenticated HTTP requests to FastAPI.
   */
  private async request<T>(
    endpoint: string,
    schema: z.ZodType<T, z.ZodTypeDef, unknown> | null,
    options: RequestOptions = {}
  ): Promise<T> {
    const config = getAiServiceConfig(true)
    const activeBaseUrl = this.getBaseUrl()
    const url = `${activeBaseUrl}${endpoint}`
    const method = options.method || 'GET'
    const timeoutMs = options.timeoutMs || this.customTimeoutMs || config.timeoutMs
    const maxRetries = options.retryCount ?? (method === 'GET' ? 2 : 0)

    const headers: Record<string, string> = {
      'X-API-Key': config.apiKey,
      ...options.headers
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: options.body,
          signal: controller.signal
        })

        clearTimeout(timer)

        // Handle 409 Conflict for getJobResult
        if (response.status === 409 && endpoint.includes('/result')) {
          const match = endpoint.match(/\/jobs\/([^/]+)\/result/)
          const jobId = match ? match[1] : 'unknown'
          throw new AiJobStillRunningError(jobId)
        }

        // Handle HTTP errors
        if (!response.ok) {
          const errorBody = (await response.json().catch(() => ({}))) as {
            detail?: unknown
            message?: string
          }
          const errorsDetail = (errorBody as Record<string, unknown>).errors
            ? ` | Errors: ${JSON.stringify((errorBody as Record<string, unknown>).errors)}`
            : ''
          const detailMsg =
            (typeof errorBody.detail === 'string'
              ? errorBody.detail
              : Array.isArray(errorBody.detail)
              ? JSON.stringify(errorBody.detail)
              : errorBody.message || `HTTP ${response.status} ${response.statusText}`) + errorsDetail

          const isRetryableStatus = [502, 503, 504].includes(response.status)
          throw new AiServiceError(
            `Request to ${endpoint} failed (${response.status}): ${detailMsg}`,
            endpoint,
            response.status,
            isRetryableStatus
          )
        }

        // Return raw text if no schema specified (e.g. for artifacts)
        if (!schema) {
          return (await response.text()) as unknown as T
        }

        // Parse and validate response JSON
        const rawJson = await response.json().catch((jsonErr) => {
          throw new AiServiceError(`Invalid JSON response: ${jsonErr.message}`, endpoint, 502)
        })

        const parseResult = schema.safeParse(rawJson)
        if (!parseResult.success) {
          throw new AiServiceError(
            `Response schema validation failed: ${parseResult.error.message}`,
            endpoint,
            502
          )
        }

        return parseResult.data
      } catch (err: unknown) {
        clearTimeout(timer)

        // Don't retry AiJobStillRunningError
        if (err instanceof AiJobStillRunningError) {
          throw err
        }

        const isAbort = (err as Error)?.name === 'AbortError'
        const isNetworkErr = (err as Error)?.message?.includes('fetch failed') || (err as Error)?.message?.includes('ECONNREFUSED')
        const isRetryable = isAbort || isNetworkErr || (err instanceof AiServiceError && err.isRetryable)

        lastError = isAbort
          ? new AiServiceError(`Request timed out after ${timeoutMs}ms`, endpoint, 504, true)
          : err instanceof AiServiceError
          ? err
          : new AiServiceError((err as Error)?.message || 'Network failure', endpoint, 503, true)

        // Only retry idempotent requests on transient errors
        if (method === 'GET' && isRetryable && attempt < maxRetries) {
          const backoffMs = Math.min(2000, 300 * Math.pow(2, attempt))
          await new Promise((resolve) => setTimeout(resolve, backoffMs))
          continue
        }

        throw lastError
      }
    }

    throw lastError || new AiServiceError('Unknown request failure', endpoint)
  }

  /**
   * Check system health and queue status of FastAPI microservice.
   * Endpoint: GET /health
   */
  public async checkHealth(): Promise<FastApiHealth> {
    return this.request('/health', fastApiHealthSchema, {
      method: 'GET'
    })
  }

  /**
   * Submit lecture video/audio file for asynchronous transcription & summarization.
   * Endpoint: POST /api/v1/jobs
   * Note: NEVER blindly retries POST requests to prevent duplicate FIFO jobs.
   */
  public async createLectureJob(
    fileBuffer: Buffer,
    fileName: string,
    options: {
      title?: string
      overwrite?: boolean
      model?: string
      reload?: boolean
    } = {}
  ): Promise<FastApiJobCreate> {
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(fileBuffer)])
    formData.append('file', blob, fileName)

    if (options.title) {
      formData.append('title', options.title)
    }
    if (options.overwrite !== undefined) {
      formData.append('overwrite', String(options.overwrite))
    }
    if (options.model) {
      formData.append('model', options.model)
    }

    const query = options.reload ? '?reload=true' : ''
    return this.request(`/api/v1/jobs${query}`, fastApiJobCreateSchema, {
      method: 'POST',
      body: formData,
      retryCount: 0 // Explicitly 0 retries on POST
    })
  }

  /**
   * Submit remote Bunny Stream or direct media job for asynchronous processing.
   * Supports distributed idempotency via Idempotency-Key header or payload field.
   * Endpoint: POST /api/v1/jobs/from-media-source
   * 
   * Handles:
   * - 202 Accepted: new job accepted and queued (is_replay = false)
   * - 200 OK: idempotent replay of existing job (is_replay = true)
   * - 409 Conflict: idempotency key reused with mismatched payload hash
   * - 400 / 422: SSRF defense or payload schema validation failure
   * - 401 / 403: authentication failure
   * - 429: queue full
   * - Timeout / Network error
   */
  public async createRemoteMediaJob(
    payload: FastApiRemoteMediaJobRequest,
    idempotencyKey?: string,
    options: { reload?: boolean } = {}
  ): Promise<FastApiRemoteMediaJobResponse> {
    const effectiveKey = idempotencyKey || payload.idempotencyKey
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (effectiveKey) {
      headers['Idempotency-Key'] = effectiveKey
    }

    const bodyPayload = {
      ...payload,
      idempotencyKey: effectiveKey
    }

    const query = options.reload ? '?reload=true' : ''
    return this.request(
      `/api/v1/jobs/from-media-source${query}`,
      fastApiRemoteMediaJobResponseSchema,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
        retryCount: 0 // Zero blind retries; idempotency recovery is explicitly orchestrated
      }
    )
  }

  /**
   * Check the current processing status and stage of a job.
   * Endpoint: GET /api/v1/jobs/{job_id}
   */
  public async getJobStatus(jobId: string, reload = false): Promise<FastApiJobStatus> {
    const query = reload ? '?reload=true' : ''
    return this.request(`/api/v1/jobs/${encodeURIComponent(jobId)}${query}`, fastApiJobStatusSchema, {
      method: 'GET'
    })
  }

  /**
   * Retrieve completed results (transcript, summary, quiz) of a job.
   * Throws AiJobStillRunningError (HTTP 409) if job has not finished yet.
   * Endpoint: GET /api/v1/jobs/{job_id}/result
   */
  public async getJobResult(jobId: string, reload = false): Promise<FastApiJobResult> {
    const query = reload ? '?reload=true' : ''
    return this.request(`/api/v1/jobs/${encodeURIComponent(jobId)}/result${query}`, fastApiJobResultSchema, {
      method: 'GET'
    })
  }

  /**
   * Download a raw artifact file (transcript.md, summary.md, quiz.json).
   * Endpoint: GET /api/v1/jobs/{job_id}/artifacts/{artifact_name}
   */
  public async getJobArtifact(jobId: string, artifactName: string): Promise<string> {
    return this.request(
      `/api/v1/jobs/${encodeURIComponent(jobId)}/artifacts/${encodeURIComponent(artifactName)}`,
      null,
      { method: 'GET' }
    )
  }

  /**
   * Retry summarization using existing transcript.
   * Endpoint: POST /api/v1/jobs/{job_id}/retry-summary
   */
  public async retrySummary(jobId: string, model?: string): Promise<FastApiJobCreate> {
    const params = new URLSearchParams()
    if (model) {
      params.append('model', model)
    }

    return this.request(
      `/api/v1/jobs/${encodeURIComponent(jobId)}/retry-summary`,
      fastApiJobCreateSchema,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        retryCount: 0
      }
    )
  }

  /**
   * Request direct Lesson Summary generation from transcript via FastAPI AI microservice.
   * Endpoint: POST /api/v1/summary/generate
   */
  public async generateSummaryDirect(
    transcript: string,
    options?: { title?: string; model?: string }
  ): Promise<FastApiSummaryGenerateResponse> {
    return this.request(
      '/api/v1/summary/generate',
      fastApiSummaryGenerateResponseSchema,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          title: options?.title,
          model: options?.model
        }),
        retryCount: 0
      }
    )
  }

  /**
   * Request Quiz generation from FastAPI AI microservice (Step 7A).
   * Supports synchronous direct generation (default) or asynchronous job submission.
   * Endpoint: POST /api/v1/quiz/generate
   */
  public async generateQuizFromAI(
    payload: FastApiQuizGenerateRequest,
    options: { timeoutMs?: number } = {}
  ): Promise<FastApiQuizGenerateResponse | FastApiJobCreate> {
    const isAsync = Boolean(payload.async_mode)
    const timeoutMs = options.timeoutMs ?? (isAsync ? 15000 : 90000)

    if (isAsync) {
      return this.request(
        '/api/v1/quiz/generate',
        fastApiJobCreateSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeoutMs,
          retryCount: 0
        }
      )
    }

    return this.request(
      '/api/v1/quiz/generate',
      fastApiQuizGenerateResponseSchema,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs,
        retryCount: 0
      }
    )
  }

  /**
   * Request Coding Exercise generation from FastAPI AI microservice (Step 7B).
   * Supports synchronous direct generation (default) or asynchronous job submission.
   * Endpoint: POST /api/v1/coding-exercises/generate
   */
  public async generateCodingExerciseFromAI(
    payload: FastApiCodingExerciseGenerateRequest,
    options: { timeoutMs?: number } = {}
  ): Promise<FastApiCodingExerciseGenerateResponse | FastApiJobCreate> {
    const isAsync = Boolean(payload.async_mode)
    const timeoutMs = options.timeoutMs ?? (isAsync ? 15000 : 90000)

    if (isAsync) {
      return this.request(
        '/api/v1/coding-exercises/generate',
        fastApiJobCreateSchema,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeoutMs,
          retryCount: 0
        }
      )
    }

    return this.request(
      '/api/v1/coding-exercises/generate',
      fastApiCodingExerciseGenerateResponseSchema,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs,
        retryCount: 0
      }
    )
  }
}

// Export default singleton instance
export const aiServiceClient = new AiServiceClient()
