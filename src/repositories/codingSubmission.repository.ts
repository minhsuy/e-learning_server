import {
  CodingSubmission,
  CodingTestResult,
  Prisma,
  SubmissionStatus
} from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: CODING SUBMISSION & TEST RESULTS
 * 
 * Pure functional database operations for student coding submissions and test case results
 * on PostgreSQL via Prisma ORM.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PROJECTIONS
// ==========================================

export const CODING_SUBMISSION_SUMMARY_SELECT = {
  id: true,
  exerciseId: true,
  revisionId: true,
  userId: true,
  status: true,
  score: true,
  maxScore: true,
  passedTests: true,
  totalTests: true,
  executionTime: true,
  createdAt: true,
  completedAt: true,
  revision: {
    select: {
      version: true
    }
  }
} as const satisfies Prisma.CodingSubmissionSelect

export type CodingSubmissionSummaryPayload = Prisma.CodingSubmissionGetPayload<{
  select: typeof CODING_SUBMISSION_SUMMARY_SELECT
}>

export const CODING_SUBMISSION_DETAIL_SELECT = {
  id: true,
  exerciseId: true,
  revisionId: true,
  userId: true,
  sourceCode: true,
  language: true,
  status: true,
  score: true,
  maxScore: true,
  passedTests: true,
  totalTests: true,
  executionTime: true,
  memoryUsage: true,
  errorMessage: true,
  createdAt: true,
  completedAt: true,
  revision: {
    select: {
      version: true
    }
  },
  results: {
    select: {
      id: true,
      testCaseId: true,
      status: true,
      actualOutput: true,
      executionTime: true,
      memoryUsage: true,
      errorMessage: true,
      stdout: true,
      testCase: {
        select: {
          id: true,
          input: true,
          expectedOutput: true,
          isHidden: true,
          order: true,
          weight: true,
          explanation: true
        }
      }
    },
    orderBy: {
      testCase: {
        order: 'asc'
      }
    }
  }
} as const satisfies Prisma.CodingSubmissionSelect

export type CodingSubmissionDetailPayload = Prisma.CodingSubmissionGetPayload<{
  select: typeof CODING_SUBMISSION_DETAIL_SELECT
}>

// ==========================================
// 2. READ OPERATIONS
// ==========================================

export const findCodingSubmissionById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<CodingSubmissionDetailPayload | null> => {
  const client = tx || prisma
  return client.codingSubmission.findUnique({
    where: { id },
    select: CODING_SUBMISSION_DETAIL_SELECT
  })
}

export const findCodingSubmissionsByUserAndExercise = async (
  {
    userId,
    exerciseId,
    page = 1,
    limit = 10
  }: {
    userId: string
    exerciseId: string
    page?: number
    limit?: number
  },
  tx?: PrismaTransactionClient
): Promise<CodingSubmissionSummaryPayload[]> => {
  const client = tx || prisma
  const skip = (Math.max(1, page) - 1) * limit
  return client.codingSubmission.findMany({
    where: {
      userId,
      exerciseId
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    select: CODING_SUBMISSION_SUMMARY_SELECT
  })
}

export const countCodingSubmissionsByUserAndExercise = async (
  userId: string,
  exerciseId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.codingSubmission.count({
    where: {
      userId,
      exerciseId
    }
  })
}

// ==========================================
// 3. WRITE OPERATIONS
// ==========================================

export const createCodingSubmission = async (
  data: Prisma.CodingSubmissionUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<CodingSubmission> => {
  const client = tx || prisma
  return client.codingSubmission.create({
    data
  })
}

export const updateCodingSubmission = async (
  id: string,
  data: Prisma.CodingSubmissionUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<CodingSubmission> => {
  const client = tx || prisma
  return client.codingSubmission.update({
    where: { id },
    data
  })
}

export const createManyCodingTestResults = async (
  data: Prisma.CodingTestResultCreateManyInput[],
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingTestResult.createMany({
    data
  })
}

export const updateManyStaleSubmissions = async (
  thresholdDate: Date,
  data: Prisma.CodingSubmissionUncheckedUpdateInput,
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingSubmission.updateMany({
    where: {
      status: SubmissionStatus.PENDING,
      createdAt: { lt: thresholdDate }
    },
    data
  })
}
