import { z } from 'zod'
import { questionPublicSchema } from './question.model'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: QUIZ
 * 
 * Single Source of Truth for Quiz domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md & AGENTS.md rules.
 * 
 * Physical Database constraints: prisma/schema.prisma (model Quiz)
 * Legacy Mongoose Model: src/models/legacy/quiz.legacy.model.ts
 * 
 * Architecture Rules:
 * - Pure Zod Application Model
 * - Zero dependency on Mongoose
 * - Zero dependency on Prisma Client
 * - Zero database queries
 */

// ==========================================
// 1. BASE DOMAIN SCHEMA (Reflects pure domain entity)
// ==========================================

export const quizSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Quiz title is required').max(255),
  description: z.string().default(''),
  duration: z.number().int().nonnegative('Duration must be a non-negative integer').default(0),
  passingGrade: z.number().int().min(0).max(100, 'Passing grade must be between 0 and 100').default(0),
  lessonId: z.string().uuid('Lesson ID must be a valid UUID'),
  courseId: z.string().uuid('Course ID must be a valid UUID'),
  createdById: z.string().uuid('Created By ID must be a valid UUID'),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. PUBLIC / DETAIL RESPONSE SCHEMAS
// ==========================================

/**
 * Public schema for Student / Client view of a Quiz
 */
export const quizPublicSchema = quizSchema.pick({
  id: true,
  title: true,
  description: true,
  duration: true,
  passingGrade: true,
  lessonId: true,
  courseId: true,
  createdAt: true,
  updatedAt: true
})

/**
 * Detail Response schema:
 * Embeds questions in student-safe public format (no answers)
 */
export const quizDetailResponseSchema = quizSchema.extend({
  questions: z.array(questionPublicSchema).default([])
})

// ==========================================
// 3. HTTP TRANSPORT DTO SCHEMAS (Client Request Body)
// ==========================================

/**
 * HTTP Request DTO for creating a Quiz:
 * Exactly reflects the incoming API contract:
 * - Uses `lesson` (not `lessonId`)
 * - Uses `passing_grade` (not `passingGrade`)
 * - Note: `createdById` is NEVER accepted from client request body.
 */
export const createQuizRequestSchema = z.object({
  lesson: z.string().min(1, 'Lesson ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Quiz title is required').max(255),
  description: z.string().optional().default(''),
  duration: z.coerce.number().int().nonnegative().optional().default(0),
  passing_grade: z.coerce.number().int().min(0).max(100).optional().default(0)
})

/**
 * HTTP Request DTO for updating a Quiz:
 * In the existing API contract, only content/metadata fields are updatable.
 * Neither `lesson` nor `courseId` can be modified.
 */
export const updateQuizRequestSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
  description: z.string().optional(),
  duration: z.coerce.number().int().nonnegative().optional(),
  passing_grade: z.coerce.number().int().min(0).max(100).optional()
})

// ==========================================
// 4. DOMAIN APPLICATION ACTION SCHEMAS
// ==========================================

export const createQuizInputSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(255),
  description: z.string().optional().default(''),
  duration: z.number().int().nonnegative().optional().default(0),
  passingGrade: z.number().int().min(0).max(100).optional().default(0),
  lessonId: z.string().uuid('Lesson ID must be a valid UUID'),
  courseId: z.string().uuid('Course ID must be a valid UUID'),
  createdById: z.string().uuid('Created By ID must be a valid UUID')
})

export const updateQuizInputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
  description: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  passingGrade: z.number().int().min(0).max(100).optional()
})

// ==========================================
// 5. MAPPERS: HTTP DTO -> DOMAIN APPLICATION INPUT
// ==========================================

/**
 * Maps incoming HTTP Request DTO to internal Domain Application Input.
 * Strictly injects `createdById` from the authenticated user context (never client input).
 */
export function mapCreateQuizRequestToInput(
  rawBody: unknown,
  authenticatedUserId: string
): CreateQuizInput {
  const parsed = createQuizRequestSchema.parse(rawBody)
  return createQuizInputSchema.parse({
    title: parsed.title,
    description: parsed.description,
    duration: parsed.duration,
    passingGrade: parsed.passing_grade,
    lessonId: parsed.lesson,
    courseId: parsed.courseId,
    createdById: authenticatedUserId
  })
}

/**
 * Maps incoming HTTP Update Request DTO to internal Domain Update Input.
 */
export function mapUpdateQuizRequestToInput(rawBody: unknown): UpdateQuizInput {
  const parsed = updateQuizRequestSchema.parse(rawBody)
  return updateQuizInputSchema.parse({
    title: parsed.title,
    description: parsed.description,
    duration: parsed.duration,
    passingGrade: parsed.passing_grade
  })
}

// ==========================================
// 6. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Quiz = z.infer<typeof quizSchema>
export type QuizPublic = z.infer<typeof quizPublicSchema>
export type QuizDetailResponse = z.infer<typeof quizDetailResponseSchema>

export type CreateQuizRequest = z.infer<typeof createQuizRequestSchema>
export type UpdateQuizRequest = z.infer<typeof updateQuizRequestSchema>

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizInputSchema>
