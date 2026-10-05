import { z } from 'zod'
import { LessonType } from '@prisma/client'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: LESSON
 * 
 * Single Source of Truth for Lesson domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/lesson.legacy.model.ts
 */

// ==========================================
// 1. BASE DOMAIN SCHEMA (Reflects pure domain entity)
// ==========================================

export const lessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  chapterId: z.string().uuid(),
  courseId: z.string().uuid(),
  authorId: z.string().uuid(),
  order: z.number().int().default(0),
  duration: z.number().int().default(0),
  type: z.nativeEnum(LessonType).default(LessonType.VIDEO),
  content: z.string().default(''),
  isDemo: z.boolean().default(false),
  videoUrl: z.string().default(''),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. PUBLIC / RESPONSE SCHEMAS
// ==========================================

/**
 * Public schema: videoUrl and full content are omitted or restricted unless isDemo is true
 */
export const lessonPublicSchema = lessonSchema.pick({
  id: true,
  title: true,
  slug: true,
  chapterId: true,
  courseId: true,
  authorId: true,
  order: true,
  duration: true,
  type: true,
  isDemo: true,
  createdAt: true,
  updatedAt: true
})

/**
 * Study schema: includes videoUrl and content for authorized students / demo access
 */
export const lessonStudySchema = lessonSchema.pick({
  id: true,
  title: true,
  slug: true,
  chapterId: true,
  courseId: true,
  authorId: true,
  order: true,
  duration: true,
  type: true,
  content: true,
  isDemo: true,
  videoUrl: true,
  createdAt: true,
  updatedAt: true
})

export const lessonCompactSchema = lessonSchema.pick({
  id: true,
  title: true,
  slug: true,
  order: true,
  duration: true,
  type: true,
  isDemo: true
})

// ==========================================
// 3. INPUT ACTION SCHEMAS
// ==========================================

export const createLessonInputSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  chapterId: z.string().uuid(),
  courseId: z.string().uuid(),
  authorId: z.string().uuid(),
  order: z.number().int().optional(),
  duration: z.number().int().optional().default(0),
  type: z.nativeEnum(LessonType).optional().default(LessonType.VIDEO),
  content: z.string().optional().default(''),
  isDemo: z.boolean().optional().default(false),
  videoUrl: z.string().optional().default('')
})

export const updateLessonInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  order: z.number().int().optional(),
  duration: z.number().int().optional(),
  type: z.nativeEnum(LessonType).optional(),
  content: z.string().optional(),
  isDemo: z.boolean().optional(),
  videoUrl: z.string().optional()
})

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Lesson = z.infer<typeof lessonSchema>
export type LessonPublic = z.infer<typeof lessonPublicSchema>
export type LessonStudy = z.infer<typeof lessonStudySchema>
export type LessonCompact = z.infer<typeof lessonCompactSchema>
export type CreateLessonInput = z.infer<typeof createLessonInputSchema>
export type UpdateLessonInput = z.infer<typeof updateLessonInputSchema>
