import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: FAVORITE COURSE
 * 
 * Single Source of Truth for FavoriteCourse domain validation and types at Application Layer.
 * Conforms to AGENTS.md and application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma (model FavoriteCourse)
 * Legacy Mongoose Model: src/models/legacy/favoriteCourse.legacy.model.ts
 */

// ==========================================
// 1. NESTED / COMPACT RELATIONS SCHEMAS
// ==========================================

export const favoriteCourseItemSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  image: z.string().default(''),
  price: z.number().default(0),
  level: z.string().optional(),
  type: z.string().optional(),
  sold: z.number().int().default(0),
  view: z.number().int().default(0)
})

// ==========================================
// 2. BASE DOMAIN SCHEMA
// ==========================================

export const favoriteCourseBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  createdAt: z.date()
})

// ==========================================
// 3. INPUT / MUTATION SCHEMAS
// ==========================================

export const toggleFavoriteInputSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid()
})

export const getFavoritesQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

// ==========================================
// 4. RESPONSE / DTO SCHEMAS
// ==========================================

export const favoriteCourseRecordResponseSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  createdAt: z.date(),
  course: favoriteCourseItemSchema.optional()
})

export const getFavoritesResponseSchema = z.object({
  favorites: z.array(favoriteCourseRecordResponseSchema),
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

export type FavoriteCourse = z.infer<typeof favoriteCourseBaseSchema>
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteInputSchema>
export type GetFavoritesQuery = z.infer<typeof getFavoritesQuerySchema>
export type FavoriteCourseItem = z.infer<typeof favoriteCourseItemSchema>
export type FavoriteCourseRecordResponse = z.infer<typeof favoriteCourseRecordResponseSchema>
export type GetFavoritesResponse = z.infer<typeof getFavoritesResponseSchema>
