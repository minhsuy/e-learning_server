/**
 * TMDEMY — STEP 7H: CENTRALIZED SINGLE AI MODEL CONFIGURATION
 *
 * Hệ thống sử dụng duy nhất mô hình mặc định `gemini-3.1-flash-lite`
 * cho toàn bộ các tác vụ AI (Lesson Summary, AI Quiz, AI Coding Exercise).
 */

import { GEMINI_MODEL } from '~/config/ai.config'

export const DEFAULT_AI_MODEL_ID: string = GEMINI_MODEL

/**
 * Kiểm tra xem modelId truyền lên có hợp lệ không.
 * Step 7H: Chỉ chấp nhận không truyền (dùng mặc định) hoặc truyền đúng DEFAULT_AI_MODEL_ID.
 */
export function isValidAiModelId(modelId?: string | null): boolean {
  if (!modelId || !modelId.trim()) return true
  return modelId.trim() === DEFAULT_AI_MODEL_ID
}

/**
 * Chuẩn hóa model ID về mô hình mặc định duy nhất của hệ thống.
 */
export function resolveAiModelId(_modelId?: string | null): string {
  return DEFAULT_AI_MODEL_ID
}
