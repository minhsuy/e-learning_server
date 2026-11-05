import { z } from 'zod'
import { ExecutionContract, executionContractSchema } from './codingExercise.model'

/**
 * TMDEMY — CODE EXECUTION DOMAIN MODEL
 * 
 * Defines schemas, interfaces, and validation rules for the code execution engine,
 * test case execution results, and E2B sandbox integration contracts.
 */

// ==========================================
// 1. EXECUTION STATUS ENUMS
// ==========================================

export const TestCaseStatusEnum = z.enum([
  'PASSED',
  'FAILED',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILATION_ERROR',
  'INTERNAL_ERROR'
])
export type TestCaseStatus = z.infer<typeof TestCaseStatusEnum>

export const SubmissionStatusEnum = z.enum([
  'PENDING',
  'RUNNING',
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILATION_ERROR',
  'INTERNAL_ERROR'
])
export type SubmissionStatus = z.infer<typeof SubmissionStatusEnum>

// ==========================================
// 2. RESOURCE LIMITS & CONSTRAINTS
// ==========================================

export const EXECUTION_LIMITS = {
  MAX_SOURCE_CODE_BYTES: 65536, // 64 KB
  MAX_TEST_CASES_COUNT: 50,
  DEFAULT_TIME_LIMIT_MS: 2000,
  MIN_TIME_LIMIT_MS: 500,
  MAX_TIME_LIMIT_MS: 10000,
  DEFAULT_MEMORY_LIMIT_KB: 128000, // 128 MB
  MIN_MEMORY_LIMIT_KB: 32000,     // 32 MB
  MAX_MEMORY_LIMIT_KB: 512000,    // 512 MB
  MAX_STDOUT_CAPTURE_BYTES: 16384 // 16 KB
} as const

// ==========================================
// 3. EXECUTION DATA SCHEMAS
// ==========================================

export const testCaseExecutionInputSchema = z.object({
  testCaseId: z.string().optional(),
  input: z.array(z.any(), { required_error: 'Test case input array is required' }),
  expectedOutput: z.any({ required_error: 'Expected output is required' }),
  isHidden: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  weight: z.number().int().min(1).default(1)
})
export type TestCaseExecutionInput = z.infer<typeof testCaseExecutionInputSchema>

export const testCaseExecutionResultSchema = z.object({
  testCaseId: z.string().optional(),
  order: z.number().int().default(0),
  weight: z.number().int().min(1).default(1),
  isHidden: z.boolean().default(false),
  status: TestCaseStatusEnum,
  executionTimeMs: z.number().nonnegative().optional(),
  memoryUsageKb: z.number().nonnegative().optional(),
  actualOutput: z.any().optional(),
  expectedOutput: z.any().optional(),
  stdout: z.string().optional(),
  errorMessage: z.string().optional(),
  comparisonReason: z.string().optional()
})
export type TestCaseExecutionResult = z.infer<typeof testCaseExecutionResultSchema>

export const codeExecutionResultSchema = z.object({
  status: SubmissionStatusEnum,
  passedTests: z.number().int().nonnegative(),
  totalTests: z.number().int().nonnegative(),
  score: z.number().int().min(0).max(100),
  maxScore: z.number().int().default(100),
  totalExecutionTimeMs: z.number().nonnegative().default(0),
  maxMemoryUsageKb: z.number().nonnegative().default(0),
  results: z.array(testCaseExecutionResultSchema),
  compilationError: z.string().optional(),
  infrastructureError: z.string().optional()
})
export type CodeExecutionResult = z.infer<typeof codeExecutionResultSchema>

export interface ExecuteSingleTestCaseParams {
  sourceCode: string
  executionContract: ExecutionContract
  testCase: TestCaseExecutionInput
  timeLimit?: number
  memoryLimit?: number
}

export interface ExecuteTestSuiteParams {
  sourceCode: string
  executionContract: ExecutionContract
  testCases: TestCaseExecutionInput[]
  timeLimit?: number
  memoryLimit?: number
  options?: {
    maxConcurrency?: number
    stopOnFirstFailure?: boolean
  }
}

// ==========================================
// 4. STEP 4 STUDENT REQUEST & RESPONSE DTOs
// ==========================================

export const runCodeRequestSchema = z.object({
  sourceCode: z
    .string({ required_error: 'Source code is required' })
    .min(1, 'Source code cannot be empty')
    .max(
      EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES,
      `Source code exceeds maximum permitted size of ${EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES / 1024} KB`
    )
})
export type RunCodeRequest = z.infer<typeof runCodeRequestSchema>

export const submitCodeRequestSchema = z.object({
  sourceCode: z
    .string({ required_error: 'Source code is required' })
    .min(1, 'Source code cannot be empty')
    .max(
      EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES,
      `Source code exceeds maximum permitted size of ${EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES / 1024} KB`
    )
})
export type SubmitCodeRequest = z.infer<typeof submitCodeRequestSchema>

export const submissionPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
})
export type SubmissionPaginationQuery = z.infer<typeof submissionPaginationQuerySchema>

export const studentSubmissionSummarySchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  exerciseId: z.string().uuid(),
  revisionId: z.string().uuid(),
  revisionVersion: z.number().int(),
  status: SubmissionStatusEnum,
  score: z.number().int(),
  maxScore: z.number().int().default(100),
  passedTests: z.number().int(),
  totalTests: z.number().int(),
  executionTime: z.number().int().nullable().optional(),
  createdAt: z.date(),
  completedAt: z.date().nullable().optional()
})
export type StudentSubmissionSummary = z.infer<typeof studentSubmissionSummarySchema>

export const studentSubmissionDetailSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  exerciseId: z.string().uuid(),
  revisionId: z.string().uuid(),
  revisionVersion: z.number().int(),
  sourceCode: z.string(),
  language: z.string(),
  status: SubmissionStatusEnum,
  score: z.number().int(),
  maxScore: z.number().int().default(100),
  passedTests: z.number().int(),
  totalTests: z.number().int(),
  executionTime: z.number().int().nullable().optional(),
  memoryUsage: z.number().int().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.date(),
  completedAt: z.date().nullable().optional(),
  results: z.array(testCaseExecutionResultSchema)
})
export type StudentSubmissionDetail = z.infer<typeof studentSubmissionDetailSchema>

export { ExecutionContract, executionContractSchema }
