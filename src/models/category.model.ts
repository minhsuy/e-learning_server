import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: CATEGORY
 * 
 * Single Source of Truth for Category domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/category.legacy.model.ts
 */

// ==========================================
// 1. BASE DOMAIN SCHEMA (Reflects pure domain entity)
// ==========================================

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(250),
  description: z.string().nullable().optional(),
  createdById: z.string().uuid().nullable().optional(),
  isDestroyed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. PUBLIC / RESPONSE SCHEMAS
// ==========================================

export const categoryPublicSchema = categorySchema.pick({
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true
}).extend({
  courseCount: z.number().int().nonnegative().optional()
})

export const categoryCompactSchema = categorySchema.pick({
  id: true,
  name: true,
  slug: true
})

// ==========================================
// 3. INPUT ACTION SCHEMAS
// ==========================================

export const createCategoryInputSchema = z.object({
  name: z.string({ required_error: 'Category name is required', invalid_type_error: 'Category name is required' }).min(1, 'Category name is required').max(200),
  slug: z.string().max(250).optional(),
  description: z.string().optional()
})

export const updateCategoryInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(250).optional(),
  description: z.string().optional(),
  isDestroyed: z.boolean().optional()
})

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Category = z.infer<typeof categorySchema>
export type CategoryPublic = z.infer<typeof categoryPublicSchema>
export type CategoryCompact = z.infer<typeof categoryCompactSchema>
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>
