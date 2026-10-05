import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: CHAPTER
 * 
 * Single Source of Truth for Chapter domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/chapter.legacy.model.ts
 */

// ==========================================
// 1. BASE DOMAIN SCHEMA (Reflects pure domain entity)
// ==========================================

export const chapterSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  courseId: z.string().uuid(),
  order: z.number().int().default(0),
  isDestroyed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. PUBLIC / RESPONSE SCHEMAS
// ==========================================

export const chapterPublicSchema = chapterSchema.pick({
  id: true,
  title: true,
  courseId: true,
  order: true,
  createdAt: true,
  updatedAt: true
})

export const chapterCompactSchema = chapterSchema.pick({
  id: true,
  title: true,
  order: true
})

// ==========================================
// 3. INPUT ACTION SCHEMAS
// ==========================================

export const createChapterInputSchema = z.object({
  title: z.string().min(1).max(255),
  courseId: z.string().uuid(),
  order: z.number().int().optional()
})

export const updateChapterInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  order: z.number().int().optional()
})

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Chapter = z.infer<typeof chapterSchema>
export type ChapterPublic = z.infer<typeof chapterPublicSchema>
export type ChapterCompact = z.infer<typeof chapterCompactSchema>
export type CreateChapterInput = z.infer<typeof createChapterInputSchema>
export type UpdateChapterInput = z.infer<typeof updateChapterInputSchema>
