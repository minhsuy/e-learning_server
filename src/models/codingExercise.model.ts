import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: CODING EXERCISE
 * 
 * Single Source of Truth for Coding Exercise domain validation, DTOs, and type definitions.
 * Follows AGENTS.md rules and strict security boundaries:
 * - Pure Zod schemas
 * - Zero dependency on Prisma Client or Express
 * - Complete isolation of student-safe DTOs from teacher/internal secrets
 */

// ==========================================
// 1. ENUMS & VALUE OBJECT SCHEMAS
// ==========================================

export const ExerciseDifficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD'])
export type ExerciseDifficulty = z.infer<typeof ExerciseDifficultyEnum>

export const ExerciseStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
export type ExerciseStatus = z.infer<typeof ExerciseStatusEnum>

export const ExerciseSourceEnum = z.enum(['MANUAL', 'AI'])
export type ExerciseSource = z.infer<typeof ExerciseSourceEnum>

export const executionContractParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required').regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, 'Parameter name must be a valid identifier'),
  type: z.string().min(1, 'Parameter type is required')
})

export const executionContractSchema = z.object({
  functionName: z.string().min(1, 'Function name is required').regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, 'Function name must be a valid JavaScript identifier'),
  parameters: z.array(executionContractParameterSchema),
  returnType: z.string().min(1, 'Return type is required')
})
export type ExecutionContract = z.infer<typeof executionContractSchema>

// ==========================================
// 2. TEST CASE SCHEMAS
// ==========================================

export const codingTestCaseInputSchema = z.object({
  input: z.array(z.any(), { required_error: 'Test case input must be an array of arguments' }),
  expectedOutput: z.any({ required_error: 'Test case expectedOutput is required' }),
  isHidden: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  weight: z.number().int().min(1, 'Weight must be at least 1').default(1),
  explanation: z.string().optional().nullable().default(null)
})
export type CodingTestCaseInput = z.infer<typeof codingTestCaseInputSchema>

export const codingTestCasePublicSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  input: z.array(z.any()),
  expectedOutput: z.any(),
  order: z.number().int(),
  weight: z.number().int(),
  explanation: z.string().nullable().optional()
})
export type CodingTestCasePublic = z.infer<typeof codingTestCasePublicSchema>

export const codingTestCaseTeacherSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  revisionId: z.string().uuid(),
  input: z.array(z.any()),
  expectedOutput: z.any(),
  isHidden: z.boolean(),
  order: z.number().int(),
  weight: z.number().int(),
  explanation: z.string().nullable().optional(),
  createdAt: z.date().optional()
})
export type CodingTestCaseTeacher = z.infer<typeof codingTestCaseTeacherSchema>

// ==========================================
// 3. HTTP REQUEST DTO SCHEMAS
// ==========================================

export const createCodingExerciseRequestSchema = z.object({
  lessonId: z.string().uuid('Invalid Lesson ID format'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-kebab-case').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  programmingLanguage: z.enum(['javascript', 'typescript', 'python', 'cpp', 'java']).default('javascript'),
  difficulty: ExerciseDifficultyEnum.default('EASY'),
  starterCode: z.string().min(1, 'Starter code is required').max(65536, 'Starter code exceeds maximum length (64KB)'),
  referenceSolution: z.string().min(1, 'Reference solution is required').max(65536, 'Reference solution exceeds maximum length (64KB)'),
  executionContract: executionContractSchema,
  timeLimit: z.number().int().min(500, 'Time limit must be at least 500ms').max(5000, 'Time limit cannot exceed 5000ms').default(2000),
  memoryLimit: z.number().int().min(32000, 'Memory limit must be at least 32000KB (32MB)').max(512000, 'Memory limit cannot exceed 512000KB (512MB)').default(128000),
  order: z.number().int().min(0).default(0),
  testCases: z.array(codingTestCaseInputSchema).min(1, 'At least one testcase is required')
}).refine((data) => {
  const paramCount = data.executionContract.parameters.length
  return data.testCases.every((tc) => Array.isArray(tc.input) && tc.input.length === paramCount)
}, {
  message: 'Each testcase input array length must match parameter count defined in executionContract',
  path: ['testCases']
})

export type CreateCodingExerciseRequest = z.infer<typeof createCodingExerciseRequestSchema>

export const updateCodingExerciseRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-kebab-case').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  difficulty: ExerciseDifficultyEnum.optional(),
  order: z.number().int().min(0).optional(),
  starterCode: z.string().min(1).max(65536).optional(),
  referenceSolution: z.string().min(1).max(65536).optional(),
  executionContract: executionContractSchema.optional(),
  timeLimit: z.number().int().min(500).max(5000).optional(),
  memoryLimit: z.number().int().min(32000).max(512000).optional(),
  testCases: z.array(codingTestCaseInputSchema).min(1).optional()
}).refine((data) => {
  if (data.executionContract && data.testCases) {
    const paramCount = data.executionContract.parameters.length
    return data.testCases.every((tc) => Array.isArray(tc.input) && tc.input.length === paramCount)
  }
  return true
}, {
  message: 'Each testcase input array length must match parameter count defined in executionContract',
  path: ['testCases']
})

export type UpdateCodingExerciseRequest = z.infer<typeof updateCodingExerciseRequestSchema>

// ==========================================
// 4. STUDENT-SAFE PUBLIC RESPONSE SCHEMAS
// ==========================================

export const codingExercisePublicItemSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  difficulty: ExerciseDifficultyEnum,
  programmingLanguage: z.string(),
  order: z.number().int(),
  status: ExerciseStatusEnum
})
export type CodingExercisePublicItem = z.infer<typeof codingExercisePublicItemSchema>

export const codingExercisePublicDetailSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  programmingLanguage: z.string(),
  difficulty: ExerciseDifficultyEnum,
  starterCode: z.string(),
  executionContract: executionContractSchema,
  timeLimit: z.number().int(),
  memoryLimit: z.number().int(),
  order: z.number().int(),
  version: z.number().int(),
  testCases: z.array(codingTestCasePublicSchema)
})
export type CodingExercisePublicDetail = z.infer<typeof codingExercisePublicDetailSchema>

// ==========================================
// 5. TEACHER / ADMIN RESPONSE SCHEMAS
// ==========================================

export const revisionSummarySchema = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  title: z.string(),
  isPublished: z.boolean(),
  createdAt: z.date()
})

export const codingExerciseTeacherItemSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  difficulty: ExerciseDifficultyEnum,
  status: ExerciseStatusEnum,
  source: ExerciseSourceEnum,
  order: z.number().int(),
  latestVersion: z.number().int(),
  isPublished: z.boolean(),
  hasDraftRevision: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type CodingExerciseTeacherItem = z.infer<typeof codingExerciseTeacherItemSchema>

export const codingExerciseTeacherDetailSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  programmingLanguage: z.string(),
  difficulty: ExerciseDifficultyEnum,
  starterCode: z.string(),
  referenceSolution: z.string(),
  executionContract: executionContractSchema,
  timeLimit: z.number().int(),
  memoryLimit: z.number().int(),
  status: ExerciseStatusEnum,
  source: ExerciseSourceEnum,
  order: z.number().int(),
  createdById: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  currentRevision: z.object({
    id: z.string().uuid(),
    version: z.number().int(),
    isPublished: z.boolean(),
    title: z.string(),
    description: z.string(),
    starterCode: z.string(),
    referenceSolution: z.string(),
    executionContract: executionContractSchema,
    timeLimit: z.number().int(),
    memoryLimit: z.number().int(),
    testCases: z.array(codingTestCaseTeacherSchema)
  }),
  revisions: z.array(revisionSummarySchema)
})
export type CodingExerciseTeacherDetail = z.infer<typeof codingExerciseTeacherDetailSchema>
