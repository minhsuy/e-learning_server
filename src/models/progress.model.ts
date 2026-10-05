import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: PROGRESS
 * 
 * Single Source of Truth for Progress domain validation and types at Application Layer.
 * Conforms to AGENTS.md and application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma (model Progress)
 * Legacy Mongoose Model: src/models/legacy/progress.legacy.model.ts
 */

// ==========================================
// 1. BASE DOMAIN SCHEMA
// ==========================================

export const progressBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  completed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. INPUT / MUTATION SCHEMAS
// ==========================================

export const markLessonCompleteInputSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  lessonId: z.string().uuid()
})

export const getProgressByCourseInputSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid()
})

// ==========================================
// 3. RESPONSE / DTO SCHEMAS
// ==========================================

export const progressLessonItemSchema = z.object({
  _id: z.string(),
  id: z.string().optional(),
  title: z.string(),
  order: z.number().int(),
  completed: z.boolean()
})

export const progressByCourseResponseSchema = z.object({
  totalLessons: z.number().int().min(0),
  completedLessons: z.number().int().min(0),
  percent: z.number().int().min(0).max(100),
  lessons: z.array(progressLessonItemSchema)
})

export const markLessonCompleteResultSchema = z.object({
  progress: z.number().int().min(0).max(100)
})

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Progress = z.infer<typeof progressBaseSchema>
export type MarkLessonCompleteInput = z.infer<typeof markLessonCompleteInputSchema>
export type GetProgressByCourseInput = z.infer<typeof getProgressByCourseInputSchema>
export type ProgressLessonItem = z.infer<typeof progressLessonItemSchema>
export type ProgressByCourseResponse = z.infer<typeof progressByCourseResponseSchema>
export type MarkLessonCompleteResult = z.infer<typeof markLessonCompleteResultSchema>
