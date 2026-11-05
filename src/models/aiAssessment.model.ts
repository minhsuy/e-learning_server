import { z } from 'zod'
import { ExerciseDifficultyEnum, executionContractSchema } from './codingExercise.model'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: AI ASSESSMENT GENERATION
 * 
 * Single source of truth for Step 7C AI Assessment Integration:
 * - Validates teacher request inputs
 * - Enforces boundaries and defaults
 * - Formats teacher-reviewable preview and persisted response DTOs
 */

// ==========================================
// 1. QUIZ GENERATION INPUT SCHEMAS
// ==========================================

export const QuizDifficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED'])
export type QuizDifficulty = z.infer<typeof QuizDifficultyEnum>

export const generateAiQuizRequestSchema = z.object({
  questionCount: z.coerce.number().int().min(1, 'Question count must be at least 1').max(30, 'Question count cannot exceed 30').default(5),
  difficulty: QuizDifficultyEnum.default('MEDIUM'),
  teacherInstructions: z.string().max(1000, 'Teacher instructions cannot exceed 1000 characters').optional().nullable(),
  language: z.string().min(2).max(10).default('vi'),
  previewOnly: z.boolean().default(false),
  confirmOverwrite: z.boolean().default(false),
  asyncMode: z.boolean().default(false),
  model: z.string().optional()
})

export type GenerateAiQuizRequest = z.infer<typeof generateAiQuizRequestSchema>

// ==========================================
// 2. CODING EXERCISE GENERATION INPUT SCHEMAS
// ==========================================

export const CodingLanguageEnum = z.enum(['javascript', 'typescript', 'python'])
export type CodingLanguage = z.infer<typeof CodingLanguageEnum>

export const generateAiCodingExerciseRequestSchema = z.object({
  language: CodingLanguageEnum.default('javascript'),
  difficulty: ExerciseDifficultyEnum.default('EASY'),
  teacherInstructions: z.string().max(1000, 'Teacher instructions cannot exceed 1000 characters').optional().nullable(),
  exerciseCount: z.coerce.number().int().min(1).max(5).default(1),
  previewOnly: z.boolean().default(false),
  verifyWithE2b: z.boolean().default(true),
  asyncMode: z.boolean().default(false),
  previewToken: z.string().optional(),
  model: z.string().optional()
})

export type GenerateAiCodingExerciseRequest = z.infer<typeof generateAiCodingExerciseRequestSchema>

// ==========================================
// 3. EXACT PREVIEW PERSISTENCE SCHEMAS (PHASE 4 & PHASE 6)
// ==========================================

export const saveApprovedAiQuizQuestionSchema = z.object({
  question: z.string().min(3, 'Question title must be at least 3 characters').max(500),
  options: z.array(z.string().min(1, 'Option cannot be empty').max(500)).length(4, 'Exactly 4 options required'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().max(2000).optional().nullable(),
  sourceTimestamp: z.string().max(50).optional().nullable()
}).refine((data) => data.options.includes(data.correctAnswer), {
  message: 'Correct answer must match one of the 4 options',
  path: ['correctAnswer']
}).refine((data) => {
  const set = new Set(data.options.map((o) => o.trim().toLowerCase()))
  return set.size === 4
}, {
  message: 'All 4 options must be distinct',
  path: ['options']
})

export const saveApprovedAiQuizRequestSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  duration: z.coerce.number().int().min(1).max(360).optional(),
  passingGrade: z.coerce.number().int().min(0).max(100).optional(),
  confirmOverwrite: z.boolean().default(false),
  questions: z.array(saveApprovedAiQuizQuestionSchema).min(1, 'At least 1 question is required').max(30, 'Maximum 30 questions')
})

export type SaveApprovedAiQuizQuestion = z.infer<typeof saveApprovedAiQuizQuestionSchema>
export type SaveApprovedAiQuizRequest = z.infer<typeof saveApprovedAiQuizRequestSchema>

export const saveApprovedAiCodingExerciseRequestSchema = z.object({
  previewToken: z.string().min(1, 'previewToken is required')
})

export type SaveApprovedAiCodingExerciseRequest = z.infer<typeof saveApprovedAiCodingExerciseRequestSchema>

// ==========================================
// 3. TEACHER REVIEW & PREVIEW RESPONSE SCHEMAS
// ==========================================

export const aiGeneratedQuizQuestionPreviewSchema = z.object({
  question: z.string(),
  type: z.string().default('MULTIPLE_CHOICE'),
  difficulty: z.string().default('MEDIUM'),
  options: z.array(z.string()).length(4),
  optionsDetailed: z.array(z.object({
    id: z.string().optional().nullable(),
    text: z.string(),
    isCorrect: z.boolean()
  })).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  sourceTimestamp: z.string().nullable().optional()
})

export const aiQuizPreviewResponseSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  difficulty: z.string(),
  questions: z.array(aiGeneratedQuizQuestionPreviewSchema),
  metadata: z.record(z.unknown()).optional()
})

export const aiCodingExercisePreviewResponseSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  programmingLanguage: z.string(),
  difficulty: z.string(),
  starterCode: z.string(),
  referenceSolution: z.string(),
  executionContract: executionContractSchema,
  timeLimit: z.number().int(),
  memoryLimit: z.number().int(),
  order: z.number().int(),
  testCases: z.array(z.object({
    input: z.array(z.unknown()),
    expectedOutput: z.unknown(),
    isHidden: z.boolean(),
    order: z.number().int(),
    weight: z.number().int(),
    explanation: z.string().nullable().optional()
  })),
  verificationStatus: z.enum(['UNVERIFIED', 'VERIFIED', 'FAILED']),
  verificationFeedback: z.unknown().nullable().optional(),
  explanation: z.string().nullable().optional(),
  sourceTimestamp: z.string().nullable().optional(),
  sourceInfo: z.record(z.unknown()).optional()
})

export type AiGeneratedQuizQuestionPreview = z.infer<typeof aiGeneratedQuizQuestionPreviewSchema>
export type AiQuizPreviewResponse = z.infer<typeof aiQuizPreviewResponseSchema>
export type AiCodingExercisePreviewResponse = z.infer<typeof aiCodingExercisePreviewResponseSchema>
