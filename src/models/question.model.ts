import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: QUESTION
 * 
 * Single Source of Truth for Question domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md & AGENTS.md rules.
 * 
 * Physical Database constraints: prisma/schema.prisma (model Question, model QuestionOption)
 * Legacy Mongoose Model: src/models/legacy/question.legacy.model.ts
 * 
 * Architecture Rules:
 * - Pure Zod Application Model
 * - Zero dependency on Mongoose
 * - Zero dependency on Prisma Client
 * - Zero database queries
 */

// ==========================================
// 1. QUESTION TYPE ENUM & VALUES
// ==========================================

export const QuestionTypeValues = ['multiple_choice', 'fill_in_blank'] as const

/**
 * QuestionType schema:
 * Supports lowercase transport representations ('multiple_choice', 'fill_in_blank')
 * and Prisma uppercase enum ('MULTIPLE_CHOICE', 'FILL_IN_BLANK') normalized to lowercase.
 */
export const questionTypeSchema = z.union([
  z.enum(QuestionTypeValues),
  z.enum(['MULTIPLE_CHOICE', 'FILL_IN_BLANK']).transform((val) => {
    return val === 'MULTIPLE_CHOICE' ? ('multiple_choice' as const) : ('fill_in_blank' as const)
  })
])

export type QuestionType = z.infer<typeof questionTypeSchema>

// ==========================================
// 2. BASE DOMAIN SCHEMA (Reflects pure domain entity)
// ==========================================

export const questionSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  type: questionTypeSchema.default('multiple_choice'),
  title: z.string().min(1, 'Question title is required'),
  options: z.array(z.string()).default([]),
  answer: z.string().min(1, 'Answer is required'),
  points: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. PUBLIC & STUDY SCHEMAS (API Security)
// ==========================================

/**
 * Public schema for Students taking a quiz:
 * STRICT RULE: Absolute omission of `answer` to prevent cheating.
 */
export const questionPublicSchema = questionSchema.omit({
  answer: true
})

/**
 * Study / Instructor schema:
 * Includes `answer` for instructors, teachers, and admins to review or grade.
 */
export const questionStudySchema = questionSchema.pick({
  id: true,
  quizId: true,
  type: true,
  title: true,
  options: true,
  answer: true,
  points: true,
  createdAt: true,
  updatedAt: true
})

// ==========================================
// 4. HTTP TRANSPORT DTO SCHEMAS (Client Request Body)
// ==========================================

/**
 * HTTP Request DTO for creating a Question:
 * Exactly reflects the incoming API contract:
 * - Uses `quiz` (not `quizId`)
 * - Accepts `options` as an optional string array
 */
export const createQuestionRequestSchema = z.object({
  quiz: z.string().min(1, 'Quiz ID is required'),
  type: questionTypeSchema.default('multiple_choice'),
  title: z.string().min(1, 'Title is required'),
  options: z.array(z.string()).optional().default([]),
  answer: z.string().min(1, 'Answer is required'),
  points: z.coerce.number().int().min(1).optional().default(1)
})

/**
 * HTTP Request DTO for updating a Question:
 */
export const updateQuestionRequestSchema = z.object({
  type: questionTypeSchema.optional(),
  title: z.string().min(1, 'Title cannot be empty').optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1, 'Answer cannot be empty').optional(),
  points: z.coerce.number().int().min(1).optional()
})

// ==========================================
// 5. DOMAIN APPLICATION ACTION SCHEMAS
// ==========================================

export const createQuestionInputSchema = z.object({
  quizId: z.string().uuid('Invalid Quiz ID format, must be UUID'),
  type: questionTypeSchema.default('multiple_choice'),
  title: z.string().min(1, 'Title is required'),
  options: z.array(z.string()).optional().default([]),
  answer: z.string().min(1, 'Answer is required'),
  points: z.number().int().min(1, 'Points must be at least 1').optional().default(1)
})

export const updateQuestionInputSchema = z.object({
  type: questionTypeSchema.optional(),
  title: z.string().min(1, 'Title cannot be empty').optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1, 'Answer cannot be empty').optional(),
  points: z.number().int().min(1, 'Points must be at least 1').optional()
})

// ==========================================
// 6. MAPPERS: HTTP DTO -> DOMAIN APPLICATION INPUT
// ==========================================

/**
 * Maps incoming HTTP Request DTO to internal Domain Application Input.
 * Maps client field `quiz` -> `quizId`.
 */
export function mapCreateQuestionRequestToInput(rawBody: unknown): CreateQuestionInput {
  const parsed = createQuestionRequestSchema.parse(rawBody)
  return createQuestionInputSchema.parse({
    quizId: parsed.quiz,
    type: parsed.type,
    title: parsed.title,
    options: parsed.options,
    answer: parsed.answer,
    points: parsed.points
  })
}

/**
 * Maps incoming HTTP Update Request DTO to internal Domain Update Input.
 */
export function mapUpdateQuestionRequestToInput(rawBody: unknown): UpdateQuestionInput {
  const parsed = updateQuestionRequestSchema.parse(rawBody)
  return updateQuestionInputSchema.parse({
    type: parsed.type,
    title: parsed.title,
    options: parsed.options,
    answer: parsed.answer,
    points: parsed.points
  })
}

// ==========================================
// 7. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Question = z.infer<typeof questionSchema>
export type QuestionPublic = z.infer<typeof questionPublicSchema>
export type QuestionStudy = z.infer<typeof questionStudySchema>

export type CreateQuestionRequest = z.infer<typeof createQuestionRequestSchema>
export type UpdateQuestionRequest = z.infer<typeof updateQuestionRequestSchema>

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>
