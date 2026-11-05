import { z } from 'zod'
import { AiProcessingStatus, LessonType } from '@prisma/client'

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
  bunnyVideoId: z.string().nullable().optional(),
  videoStatus: z.string().nullable().optional(),
  transcript: z.string().nullable().optional(),
  transcriptOriginal: z.string().nullable().optional(),
  transcriptRefined: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  aiProcessingStatus: z.nativeEnum(AiProcessingStatus).nullable().optional(),
  aiProcessedAt: z.date().nullable().optional(),
  aiProcessingError: z.string().nullable().optional(),
  aiGeneration: z.number().int().default(1),
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
  bunnyVideoId: true,
  videoStatus: true,
  createdAt: true,
  updatedAt: true
})

/**
 * Study schema: includes videoUrl, content, and safe AI content for authorized students / demo access.
 * Sensitive operational fields like aiProcessingError are strictly excluded.
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
  bunnyVideoId: true,
  videoStatus: true,
  transcript: true,
  transcriptOriginal: true,
  transcriptRefined: true,
  summary: true,
  aiProcessingStatus: true,
  aiProcessedAt: true,
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
  videoUrl: z.string().optional().default(''),
  bunnyVideoId: z.string().optional(),
  videoStatus: z.string().optional()
})

export const updateLessonInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  order: z.number().int().optional(),
  duration: z.number().int().optional(),
  type: z.nativeEnum(LessonType).optional(),
  content: z.string().optional(),
  isDemo: z.boolean().optional(),
  videoUrl: z.string().optional(),
  bunnyVideoId: z.string().nullable().optional(),
  videoStatus: z.string().optional()
})

/**
 * AI Content Payload schema for Step 6.5
 */
export const updateLessonAiContentInputSchema = z.object({
  transcript: z.string().nullable().optional(),
  transcriptOriginal: z.string().nullable().optional(),
  transcriptRefined: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  aiProcessingStatus: z.nativeEnum(AiProcessingStatus).optional(),
  aiProcessingError: z.string().nullable().optional(),
  bunnyVideoId: z.string().optional(),
  clientTimestamp: z.string().or(z.date()).optional()
})

export const lessonAiContentResponseSchema = z.object({
  id: z.string().uuid(),
  transcript: z.string().nullable(),
  transcriptOriginal: z.string().nullable().optional(),
  transcriptRefined: z.string().nullable().optional(),
  summary: z.string().nullable(),
  aiProcessingStatus: z.nativeEnum(AiProcessingStatus).nullable(),
  aiProcessedAt: z.date().nullable(),
  aiProcessingError: z.string().nullable().optional(),
  updatedAt: z.date()
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
export type UpdateLessonAiContentInput = z.infer<typeof updateLessonAiContentInputSchema>
export type LessonAiContentResponse = z.infer<typeof lessonAiContentResponseSchema>

