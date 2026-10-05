import { z } from 'zod'
import { ERatingStatus } from '~/types/enum'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: RATING
 * 
 * Single Source of Truth for Rating domain validation and types at Application Layer.
 * Conforms to AGENTS.md and application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma (model Rating)
 * Legacy Mongoose Model: src/models/legacy/rating.legacy.model.ts
 */

// ==========================================
// 1. NESTED / COMPACT RELATIONS SCHEMAS
// ==========================================

export const ratingUserCompactSchema = z.object({
  id: z.string().uuid().optional(),
  _id: z.string().optional(),
  username: z.string(),
  avatar: z.string().default('')
})

export const ratingCourseCompactSchema = z.object({
  id: z.string().uuid().optional(),
  _id: z.string().optional(),
  title: z.string(),
  slug: z.string()
})

// ==========================================
// 2. BASE DOMAIN SCHEMA
// ==========================================

export const ratingBaseSchema = z.object({
  id: z.string().uuid(),
  rate: z.number().int().min(1).max(5),
  content: z.string().min(5).max(255),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  status: z.nativeEnum(ERatingStatus).default(ERatingStatus.INACTIVE),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. INPUT / MUTATION SCHEMAS
// ==========================================

export const createRatingInputSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  rate: z.number().int().min(1).max(5),
  content: z.string().min(5).max(100) // Preserving legacy 100 char limit at application boundary
})

export const updateRatingStatusInputSchema = z.object({
  ratingId: z.string().uuid(),
  status: z.nativeEnum(ERatingStatus),
  userId: z.string().uuid(),
  role: z.string()
})

export const deleteRatingInputSchema = z.object({
  ratingId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string()
})

export const queryRatingInputSchema = z.object({
  courseId: z.string().uuid().optional(),
  status: z.nativeEnum(ERatingStatus).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  userId: z.string().uuid(),
  role: z.string()
})

// ==========================================
// 4. RESPONSE / DTO SCHEMAS
// ==========================================

export const ratingItemResponseSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  rate: z.number().int(),
  content: z.string(),
  userId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: z.nativeEnum(ERatingStatus).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  user: ratingUserCompactSchema.optional(),
  course: ratingCourseCompactSchema.optional()
})

export const getCourseRatingsResponseSchema = z.object({
  averageRating: z.number(),
  totalRatings: z.number().int(),
  ratings: z.array(ratingItemResponseSchema)
})

export const getRatingsManageResponseSchema = z.object({
  ratings: z.array(ratingItemResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int()
  })
})

// ==========================================
// 5. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Rating = z.infer<typeof ratingBaseSchema>
export type CreateRatingInput = z.infer<typeof createRatingInputSchema>
export type UpdateRatingStatusInput = z.infer<typeof updateRatingStatusInputSchema>
export type DeleteRatingInput = z.infer<typeof deleteRatingInputSchema>
export type QueryRatingInput = z.infer<typeof queryRatingInputSchema>
export type RatingItemResponse = z.infer<typeof ratingItemResponseSchema>
export type GetCourseRatingsResponse = z.infer<typeof getCourseRatingsResponseSchema>
export type GetRatingsManageResponse = z.infer<typeof getRatingsManageResponseSchema>
