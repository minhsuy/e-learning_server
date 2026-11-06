import { GoogleGenAI } from '@google/genai'
import { getGeminiConfig, maskGeminiApiKey } from '~/config/gemini.config'
import { buildGeminiIntentSystemInstruction } from './geminiPrompt'

/**
 * TMDEMY — GEMINI CLIENT SERVICE (TG-04A)
 *
 * Encapsulates communication with Google Gen AI SDK (@google/genai).
 * Handles structured JSON generation, request timeouts, error categorization,
 * and test mock injection without exposing sensitive credentials.
 */

export interface GeminiCallOptions {
  model?: string
  timeoutMs?: number
  mockResponse?: string
  mockError?: Error
}

export interface GeminiClientRawResponse {
  rawText: string
  modelUsed: string
}

/**
 * Categorizes and sanitizes upstream Gemini API errors into safe, actionable messages.
 */
export function sanitizeGeminiError(err: unknown, configuredModel: string): string {
  if (err instanceof Error) {
    const msg = err.message || ''

    // 1. Model availability / 404 Not Found
    if (msg.includes('404') || msg.includes('not found') || msg.includes('is no longer available')) {
      return `Mô hình Gemini được cấu hình (${configuredModel}) hiện không khả dụng trên Google GenAI API. Vui lòng kiểm tra lại GEMINI_MODEL.`
    }

    // 2. Authentication & API Key errors
    if (msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('unregistered')) {
      return 'Khóa API Gemini (GEMINI_API_KEY) không hợp lệ hoặc không có quyền truy cập.'
    }

    // 3. Service Unavailable / High demand / 503
    if (
      msg.includes('503') ||
      msg.includes('UNAVAILABLE') ||
      msg.includes('high demand') ||
      msg.includes('Overloaded')
    ) {
      return 'Hệ thống AI đang tạm thời quá tải do nhu cầu cao (503 Service Unavailable). Vui lòng thử lại sau giây lát.'
    }

    // 4. Rate limiting & Quota
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return 'Hệ thống AI đang tạm thời vượt quá giới hạn tần suất yêu cầu (Rate Limit). Vui lòng thử lại sau.'
    }

    // 5. Request timeout
    if (msg.includes('timed out') || msg.includes('ETIMEDOUT') || msg.includes('ECONNABORTED')) {
      return 'Yêu cầu tới dịch vụ Gemini AI bị quá thời gian phản hồi (Timeout).'
    }

    return `Lỗi dịch vụ Gemini AI: ${msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '***KEY***')}`
  }

  return `Lỗi không xác định từ nhà cung cấp AI: ${String(err)}`
}

/**
 * Executes a Gemini API call with automatic retry on transient upstream errors (503 / 429 / high demand).
 */
export async function executeWithTransientRetry<T>(
  apiFn: () => Promise<T>,
  maxRetries = 2,
  baseDelayMs = 800
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiFn()
    } catch (err: unknown) {
      lastError = err
      const msg = err instanceof Error ? err.message : String(err)
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('Overloaded')

      if (!isTransient || attempt === maxRetries) {
        throw err
      }

      const delay = baseDelayMs * (attempt + 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

/**
 * Dispatches a prompt to Gemini and retrieves raw JSON text.
 */
export async function generateGeminiStructuredIntent(
  userMessage: string,
  options: GeminiCallOptions = {}
): Promise<GeminiClientRawResponse> {
  const config = getGeminiConfig()
  const targetModel = options.model || config.model
  const timeoutMs = options.timeoutMs || config.timeoutMs

  // 1. Mock support for deterministic automated testing
  if (options.mockError) {
    const sanitizedMsg = sanitizeGeminiError(options.mockError, targetModel)
    const wrappedError = new Error(sanitizedMsg)
    ;(wrappedError as any).cause = options.mockError
    throw wrappedError
  }
  if (options.mockResponse !== undefined) {
    return {
      rawText: options.mockResponse,
      modelUsed: targetModel
    }
  }

  // 2. Load and validate configuration
  if (!config.isConfigured || !config.isValid) {
    throw new Error(
      `GEMINI_API_KEY chưa được cấu hình hoặc cú pháp không hợp lệ (${maskGeminiApiKey(config.apiKey)}).`
    )
  }

  // 3. Initialize SDK
  const ai = new GoogleGenAI({ apiKey: config.apiKey })
  const systemInstruction = buildGeminiIntentSystemInstruction()

  // 4. Execute request with strict timeout protection and transient retry
  let timer: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Yêu cầu phân tích ý định quá thời gian phản hồi (${timeoutMs}ms).`))
    }, timeoutMs)
    if (typeof timer.unref === 'function') timer.unref()
  })

  try {
    const apiCallPromise = executeWithTransientRetry(() =>
      ai.models.generateContent({
        model: targetModel,
        contents: userMessage,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 500
        }
      })
    )

    const response = await Promise.race([apiCallPromise, timeoutPromise])

    const text = response.text?.trim()
    if (!text) {
      throw new Error('Dịch vụ Gemini AI trả về phản hồi rỗng (Empty response).')
    }

    return {
      rawText: text,
      modelUsed: targetModel
    }
  } catch (err: unknown) {
    const sanitizedMsg = sanitizeGeminiError(err, targetModel)
    const wrappedError = new Error(sanitizedMsg)
    // Preserve original error cause for debugging
    ;(wrappedError as any).cause = err
    throw wrappedError
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * System instruction for generating business analytics insights and grounded explanations.
 */
export function buildGeminiInsightSystemInstruction(): string {
  return `Bạn là Chuyên gia Phân tích Dữ liệu Kinh doanh (Business Analytics Specialist) cho nền tảng giáo dục TMdemy.
Nhiệm vụ của bạn là đọc Bằng chứng Thống kê (Evidence Payload) đã được hệ thống backend tính toán và tạo ra một giải thích ngắn gọn, súc tích, hoàn toàn dựa trên dữ liệu thực tế bằng tiếng Việt.

=== NGUYÊN TẮC BẢO VỆ CHỐNG HALLUCINATION (GROUNDING INVARIANTS) ===
1. CHỈ sử dụng dữ liệu có trong Evidence Payload được cung cấp.
2. TUYỆT ĐỐI KHÔNG tự bịa ra bất kỳ con số, tỷ lệ % hay số liệu tài chính/học viên nào khác.
3. TUYỆT ĐỐI KHÔNG suy đoán nguyên nhân chủ quan chưa được kiểm chứng (như "marketing tốt", "bài giảng hay", "học viên hài lòng", "thời tiết").
4. ĐỐI VỚI SO SÁNH:
   - Nếu kỳ trước bằng 0, nêu rõ không xác định được tỷ lệ % tăng trưởng từ mức 0.
   - Nếu so sánh tháng này với tháng trước khi tháng này chưa hết, hãy nhắc nhở đây là tiến độ tạm tính.
5. ĐỐI VỚI KHÓA HỌC: Chỉ nêu lý do có thể đo lường được (như doanh thu cao nhất, số lượt bán nhiều nhất).
6. ĐỐI VỚI ĐỀ XUẤT (RECOMMENDATION): Đưa ra các gợi ý cẩn trọng, thực tế (ví dụ: rà soát các khóa chưa bán được để cập nhật nội dung/giá, tạo coupon kích cầu). TUYỆT ĐỐI KHÔNG cam kết hay hứa hẹn tăng doanh thu.

=== ĐỊNH DẠNG ĐẦU RA BẮT BUỘC ===
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ, không chứa markdown formatting (\`\`\`json):
{
  "observation": "Nhận xét phân tích khách quan (1-3 câu ngắn gọn, súc tích)",
  "recommendation": "Gợi ý hành động thực tế (1-2 câu, hoặc null nếu không cần thiết)"
}`
}

/**
 * Dispatches an analytics insight evidence payload to Gemini for qualitative explanation generation.
 */
export async function generateGeminiInsightExplanation(
  evidencePrompt: string,
  options: GeminiCallOptions = {}
): Promise<GeminiClientRawResponse> {
  const config = getGeminiConfig()
  const targetModel = options.model || config.model
  const timeoutMs = options.timeoutMs || config.timeoutMs

  // 1. Mock support for deterministic testing
  if (options.mockError) {
    const sanitizedMsg = sanitizeGeminiError(options.mockError, targetModel)
    const wrappedError = new Error(sanitizedMsg)
    ;(wrappedError as any).cause = options.mockError
    throw wrappedError
  }
  if (options.mockResponse !== undefined) {
    return {
      rawText: options.mockResponse,
      modelUsed: targetModel
    }
  }

  // 2. Validate configuration
  if (!config.isConfigured || !config.isValid) {
    throw new Error(
      `GEMINI_API_KEY chưa được cấu hình hoặc cú pháp không hợp lệ (${maskGeminiApiKey(config.apiKey)}).`
    )
  }

  // 3. Initialize SDK
  const ai = new GoogleGenAI({ apiKey: config.apiKey })
  const systemInstruction = buildGeminiInsightSystemInstruction()

  // 4. Timeout protection and transient retry
  let timer: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Yêu cầu tạo nhận xét phân tích quá thời gian phản hồi (${timeoutMs}ms).`))
    }, timeoutMs)
    if (typeof timer.unref === 'function') timer.unref()
  })

  try {
    const apiCallPromise = executeWithTransientRetry(() =>
      ai.models.generateContent({
        model: targetModel,
        contents: evidencePrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 600
        }
      })
    )

    const response = await Promise.race([apiCallPromise, timeoutPromise])
    const text = response.text?.trim()
    if (!text) {
      throw new Error('Dịch vụ Gemini AI trả về phản hồi nhận xét rỗng (Empty response).')
    }

    return {
      rawText: text,
      modelUsed: targetModel
    }
  } catch (err: unknown) {
    const sanitizedMsg = sanitizeGeminiError(err, targetModel)
    const wrappedError = new Error(sanitizedMsg)
    ;(wrappedError as any).cause = err
    throw wrappedError
  } finally {
    if (timer) clearTimeout(timer)
  }
}
