import { z } from 'zod'

/**
 * TMDEMY — RECOMMENDATION DATA MODELS & SCHEMAS (REC-09)
 *
 * Defines runtime validation schemas (Zod) and inferred TypeScript types
 * matching the REC-08 FastAPI microservice contracts and TMdemy application layer.
 */

// ==========================================
// 1. LEARNER PROFILE SCHEMAS (REC-06 / REC-08)
// ==========================================

export const LearnerLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
export type LearnerLevel = z.infer<typeof LearnerLevelEnum>

export const LearnerInteractionSchema = z.object({
  course_id: z.string(),
  progress: z.number().int().min(0).max(100).default(0),
  status: z.string().default('ACTIVE'),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  is_favorite: z.boolean().default(false),
  enrolled_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional()
})
export type LearnerInteraction = z.infer<typeof LearnerInteractionSchema>

export const LearnerProfileSchema = z.object({
  user_id: z.string().nullable().optional(),
  preferred_category_ids: z.array(z.string()).default([]),
  preferred_category_names: z.array(z.string()).default([]),
  preferred_topics: z.array(z.string()).default([]),
  preferred_level: LearnerLevelEnum.nullable().optional(),
  interactions: z.array(LearnerInteractionSchema).default([]),
  completed_course_ids: z.array(z.string()).default([])
})
export type LearnerProfile = z.infer<typeof LearnerProfileSchema>

// ==========================================
// 2. MICROSERVICE REQUEST SCHEMAS (REC-08)
// ==========================================

export const HybridSimilarRequestSchema = z.object({
  course_id: z.string(),
  top_k: z.number().int().min(1).max(50).optional(),
  retrieval_depth: z.number().int().min(10).max(200).optional(),
  enable_diversity: z.boolean().optional(),
  max_courses_per_category: z.number().int().min(1).max(10).optional()
})
export type HybridSimilarRequest = z.infer<typeof HybridSimilarRequestSchema>

export const HybridPersonalizedRequestSchema = z.object({
  profile: LearnerProfileSchema,
  top_k: z.number().int().min(1).max(50).optional(),
  retrieval_depth: z.number().int().min(10).max(200).optional(),
  filter_completed: z.boolean().optional(),
  filter_enrolled: z.boolean().optional(),
  enable_diversity: z.boolean().optional(),
  max_courses_per_category: z.number().int().min(1).max(10).optional()
})
export type HybridPersonalizedRequest = z.infer<typeof HybridPersonalizedRequestSchema>

// ==========================================
// 3. MICROSERVICE RESPONSE SCHEMAS (REC-08)
// ==========================================

export const HybridScoreBreakdownSchema = z.object({
  bm25_rank: z.number().nullable().optional(),
  e5_rank: z.number().nullable().optional(),
  bm25_score: z.number().nullable().optional(),
  e5_score: z.number().nullable().optional(),
  rrf_score: z.number(),
  normalized_hybrid_score: z.number(),
  personalization_score: z.number().nullable().optional(),
  final_score: z.number()
})
export type HybridScoreBreakdown = z.infer<typeof HybridScoreBreakdownSchema>

export const HybridRecommendationItemSchema = z.object({
  course_id: z.string(),
  title: z.string(),
  category_name: z.string(),
  category_id: z.string(),
  level: z.string(),
  price: z.number(),
  rank: z.number().int(),
  score: z.number(),
  score_breakdown: HybridScoreBreakdownSchema,
  explanation: z.string()
})
export type HybridRecommendationItem = z.infer<typeof HybridRecommendationItemSchema>

export const HybridRecommendationResponseSchema = z.object({
  mode: z.enum(['item_to_item', 'personalized']),
  strategy_used: z.string(),
  target_course_id: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  total_candidates_retrieved: z.number().int(),
  filtered_courses_count: z.number().int(),
  recommendations: z.array(HybridRecommendationItemSchema),
  models_used: z.array(z.string()),
  fusion_method: z.string().default('rrf'),
  fallback_used: z.boolean().default(false),
  fallback_reason: z.string().nullable().optional(),
  inference_latency_ms: z.number()
})
export type HybridRecommendationResponse = z.infer<typeof HybridRecommendationResponseSchema>

// ==========================================
// 4. FRONTEND HYDRATED DTO CONTRACTS
// ==========================================

export interface HydratedRecommendationItem {
  course: Record<string, any>
  rank: number
  score: number
  explanation: string
  score_breakdown?: HybridScoreBreakdown
}

export interface HydratedRecommendationResponse {
  mode: string
  strategy_used: string
  models_used: string[]
  fusion_method: string
  fallback_used: boolean
  fallback_reason?: string | null
  total_candidates_retrieved: number
  filtered_courses_count: number
  recommendations: HydratedRecommendationItem[]
}
