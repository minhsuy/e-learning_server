import { z } from 'zod'
import { AiJobStatus, AiJobType } from '@prisma/client'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: AI PROCESSING JOB
 * 
 * Single Source of Truth for AI job domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 */

// ==========================================
// 1. BASE DOMAIN SCHEMA
// ==========================================

export const aiProcessingJobSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  requestedById: z.string().uuid(),
  jobType: z.nativeEnum(AiJobType).default(AiJobType.TRANSCRIBE_AND_SUMMARIZE),
  status: z.nativeEnum(AiJobStatus).default(AiJobStatus.PENDING),
  providerJobId: z.string().nullable().optional(),
  generation: z.number().int().default(1),
  videoId: z.string().nullable().optional(),
  videoFingerprint: z.string().nullable().optional(),
  attemptCount: z.number().int().default(0),
  currentStage: z.string().nullable().optional(),
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  lastPolledAt: z.date().nullable().optional(),
  nextPollAt: z.date().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  rawMetadata: z.unknown().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. INPUT SCHEMAS
// ==========================================

export const createAiJobInputSchema = z.object({
  lessonId: z.string().uuid(),
  jobType: z.nativeEnum(AiJobType).optional().default(AiJobType.TRANSCRIBE_AND_SUMMARIZE),
  videoFingerprint: z.string().max(255).optional()
})

export const triggerLessonAiProcessInputSchema = z.object({
  jobType: z.nativeEnum(AiJobType).optional().default(AiJobType.TRANSCRIBE_AND_SUMMARIZE),
  videoFingerprint: z.string().max(255).optional(),
  model: z.string().optional()
})

// ==========================================
// 3. RESPONSE SCHEMAS
// ==========================================

export const aiJobResponseSchema = aiProcessingJobSchema.pick({
  id: true,
  lessonId: true,
  courseId: true,
  requestedById: true,
  jobType: true,
  status: true,
  providerJobId: true,
  generation: true,
  videoId: true,
  currentStage: true,
  startedAt: true,
  completedAt: true,
  lastPolledAt: true,
  nextPollAt: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true
})

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================

export type AiProcessingJob = z.infer<typeof aiProcessingJobSchema>
export type CreateAiJobInput = z.infer<typeof createAiJobInputSchema>
export type TriggerLessonAiProcessInput = z.infer<typeof triggerLessonAiProcessInputSchema>
export type AiJobResponse = z.infer<typeof aiJobResponseSchema>
export { AiJobType, AiJobStatus }
