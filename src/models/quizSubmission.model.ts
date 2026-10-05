import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: QUIZ SUBMISSION & EVALUATION
 * 
 * Single Source of Truth for QuizSubmission domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md & AGENTS.md rules.
 * 
 * Physical Database constraints:
 * - prisma/schema.prisma (models QuizSubmission, QuizSubmissionAnswer)
 * Legacy Mongoose Model:
 * - src/models/legacy/quizSubmission.legacy.model.ts
 * 
 * Architecture Rules:
 * - Pure Zod Application Model
 * - Inferred TypeScript types via z.infer
 * - Zero dependency on Mongoose
 * - Zero dependency on Prisma Client
 * - Zero database queries
 */

// ==========================================
// 1. NESTED / VALUE OBJECT SCHEMAS
// ==========================================

/**
 * Base schema for an individual submission answer record
 */
export const submissionAnswerSchema = z.object({
  id: z.string().uuid('Answer ID must be a valid UUID'),
  submissionId: z.string().uuid('Submission ID must be a valid UUID'),
  questionId: z.string().uuid('Question ID must be a valid UUID'),
  selectedAnswer: z.string().min(1, 'Selected answer is required'),
  isCorrect: z.boolean().default(false)
})

/**
 * Input schema for a single question answer in a client submission payload
 */
export const submitQuizAnswerInputSchema = z.object({
  question: z.string().uuid('Question ID must be a valid UUID'),
  selectedAnswer: z.string().min(1, 'Selected answer is required')
})

/**
 * Detailed nested answer schema for submission responses (with optional question details)
 */
export const submissionAnswerDetailSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  questionId: z.string().uuid(),
  selectedAnswer: z.string(),
  isCorrect: z.boolean(),
  question: z.union([
    z.string().uuid(),
    z.object({
      id: z.string().uuid(),
      _id: z.string().uuid().optional(),
      title: z.string(),
      type: z.string(),
      points: z.number()
    })
  ]).optional()
})

// ==========================================
// 2. BASE DOMAIN SCHEMAS (Reflects pure domain entity)
// ==========================================

/**
 * Base schema representing the core QuizSubmission domain entity
 */
export const quizSubmissionSchema = z.object({
  id: z.string().uuid('Submission ID must be a valid UUID'),
  quizId: z.string().uuid('Quiz ID must be a valid UUID'),
  userId: z.string().uuid('User ID must be a valid UUID'),
  score: z.number().int().nonnegative('Score must be non-negative').default(0),
  totalPoints: z.number().int().nonnegative('Total points must be non-negative').default(0),
  percentage: z.number().int().min(0).max(100, 'Percentage must be between 0 and 100').default(0),
  completedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  answers: z.array(submissionAnswerSchema).optional()
})

// ==========================================
// 3. PUBLIC / RESPONSE SCHEMAS
// ==========================================

/**
 * Public response schema for single submission details with backward compatibility aliases
 */
export const quizSubmissionDetailResponseSchema = quizSubmissionSchema.extend({
  _id: z.string().uuid().optional(),
  quiz: z.string().uuid().optional(),
  user: z.string().uuid().optional(),
  answers: z.array(submissionAnswerDetailSchema).optional()
})

/**
 * Response schema for student submission evaluation result
 */
export const submitQuizResultDataSchema = z.object({
  submission: quizSubmissionDetailResponseSchema,
  scoreDisplay: z.string(),
  percentage: z.number().int().min(0).max(100)
})

/**
 * Schema for teacher submission list item
 */
export const teacherQuizSubmissionItemSchema = z.object({
  user: z.string(),
  score: z.number(),
  totalPoints: z.number(),
  percentage: z.number(),
  completedAt: z.date().or(z.string())
})

/**
 * Schema for teacher quiz analytics aggregate
 */
export const teacherQuizAnalyticsSchema = z.object({
  totalStudents: z.number().int().nonnegative(),
  avgScore: z.number().nonnegative(),
  minScore: z.number(),
  maxScore: z.number(),
  completionRate: z.number().min(0).max(100)
})

// ==========================================
// 4. INPUT ACTION SCHEMAS
// ==========================================

/**
 * HTTP request body schema for submitting quiz answers from Client
 */
export const submitQuizInputSchema = z.object({
  quizId: z.string().uuid('Quiz ID must be a valid UUID'),
  answers: z.array(submitQuizAnswerInputSchema).min(1, 'Answers array must contain at least 1 answer')
})

/**
 * Service-level input schema combining client submission with authenticated user identity
 */
export const createQuizSubmissionInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  quizId: z.string().uuid('Quiz ID must be a valid UUID'),
  answers: z.array(submitQuizAnswerInputSchema)
})

// ==========================================
// 5. INFERRED TYPESCRIPT TYPES
// ==========================================

export type SubmissionAnswer = z.infer<typeof submissionAnswerSchema>
export type SubmitQuizAnswerInput = z.infer<typeof submitQuizAnswerInputSchema>
export type SubmissionAnswerDetail = z.infer<typeof submissionAnswerDetailSchema>
export type QuizSubmission = z.infer<typeof quizSubmissionSchema>
export type QuizSubmissionDetailResponse = z.infer<typeof quizSubmissionDetailResponseSchema>
export type SubmitQuizResultData = z.infer<typeof submitQuizResultDataSchema>
export type TeacherQuizSubmissionItem = z.infer<typeof teacherQuizSubmissionItemSchema>
export type TeacherQuizAnalytics = z.infer<typeof teacherQuizAnalyticsSchema>
export type SubmitQuizInput = z.infer<typeof submitQuizInputSchema>
export type CreateQuizSubmissionInput = z.infer<typeof createQuizSubmissionInputSchema>

// ==========================================
// 6. BACKWARD COMPATIBILITY EXPORTS
// ==========================================

export const quizSubmissionAnswerSchema = submissionAnswerSchema
export type QuizSubmissionAnswer = SubmissionAnswer
export const submitQuizInputAnswerSchema = submitQuizAnswerInputSchema
export type SubmitQuizInputAnswer = SubmitQuizAnswerInput
export const quizSubmissionResponseSchema = quizSubmissionDetailResponseSchema
export type QuizSubmissionResponse = QuizSubmissionDetailResponse
