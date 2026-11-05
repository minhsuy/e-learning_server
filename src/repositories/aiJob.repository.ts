import { Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { AiJobStatus } from '~/models/aiJob.model'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: AI PROCESSING JOB
 * 
 * Interacts with PostgreSQL `ai_processing_jobs` table via Prisma Client Singleton.
 * Pure functional functions supporting optional transaction clients.
 * Conforms to AGENTS.md Functional Repository standards.
 */

// ==========================================
// 1. SELECT PROJECTIONS
// ==========================================

export const AI_JOB_PUBLIC_SELECT = {
  id: true,
  lessonId: true,
  courseId: true,
  requestedById: true,
  jobType: true,
  status: true,
  providerJobId: true,
  generation: true,
  videoId: true,
  videoFingerprint: true,
  attemptCount: true,
  currentStage: true,
  startedAt: true,
  completedAt: true,
  lastPolledAt: true,
  nextPollAt: true,
  errorMessage: true,
  rawMetadata: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.AiProcessingJobSelect

export type AiJobPublicPayload = Prisma.AiProcessingJobGetPayload<{
  select: typeof AI_JOB_PUBLIC_SELECT
}>

// ==========================================
// 2. MUTATION FUNCTIONS
// ==========================================

/**
 * Insert a new AI processing job into PostgreSQL.
 */
export const createAiJob = async (
  data: Prisma.AiProcessingJobCreateInput,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload> => {
  const client = tx || prisma
  return client.aiProcessingJob.create({
    data,
    select: AI_JOB_PUBLIC_SELECT
  })
}

/**
 * Update an existing AI processing job by primary key UUID.
 */
export const updateAiJob = async (
  id: string,
  data: Prisma.AiProcessingJobUpdateInput,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload> => {
  const client = tx || prisma
  return client.aiProcessingJob.update({
    where: { id },
    data,
    select: AI_JOB_PUBLIC_SELECT
  })
}

/**
 * Marks any active jobs (PENDING, SUBMITTING, QUEUED, RUNNING) for a lesson as STALE.
 * Used during video replacements and generation advances.
 */
export const markActiveJobsStaleForLesson = async (
  lessonId: string,
  reason = 'Lesson video replaced or new generation started',
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const result = await client.aiProcessingJob.updateMany({
    where: {
      lessonId,
      status: {
        in: [
          AiJobStatus.PENDING,
          AiJobStatus.SUBMITTING,
          AiJobStatus.QUEUED,
          AiJobStatus.RUNNING
        ]
      }
    },
    data: {
      status: AiJobStatus.STALE,
      errorMessage: reason
    }
  })
  return result.count
}

// ==========================================
// 3. QUERY FUNCTIONS
// ==========================================

/**
 * Find AI processing job by primary key UUID.
 */
export const findAiJobById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload | null> => {
  const client = tx || prisma
  return client.aiProcessingJob.findUnique({
    where: { id },
    select: AI_JOB_PUBLIC_SELECT
  })
}

/**
 * Find AI processing job by provider job ID (FastAPI job ID).
 */
export const findAiJobByProviderJobId = async (
  providerJobId: string,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload | null> => {
  const client = tx || prisma
  return client.aiProcessingJob.findFirst({
    where: { providerJobId },
    select: AI_JOB_PUBLIC_SELECT
  })
}

/**
 * Find currently active AI job for a lesson (if any).
 */
export const findActiveAiJobByLessonId = async (
  lessonId: string,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload | null> => {
  const client = tx || prisma
  return client.aiProcessingJob.findFirst({
    where: {
      lessonId,
      status: {
        in: [
          AiJobStatus.PENDING,
          AiJobStatus.SUBMITTING,
          AiJobStatus.QUEUED,
          AiJobStatus.RUNNING
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
    select: AI_JOB_PUBLIC_SELECT
  })
}

/**
 * Find the latest AI job for a lesson regardless of status.
 */
export const findLatestAiJobByLessonId = async (
  lessonId: string,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload | null> => {
  const client = tx || prisma
  return client.aiProcessingJob.findFirst({
    where: { lessonId },
    orderBy: { createdAt: 'desc' },
    select: AI_JOB_PUBLIC_SELECT
  })
}

/**
 * List AI jobs for a lesson with order and limit.
 */
export const findAiJobsByLessonId = async (
  lessonId: string,
  limit = 20,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload[]> => {
  const client = tx || prisma
  return client.aiProcessingJob.findMany({
    where: { lessonId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(100, Math.max(1, limit)),
    select: AI_JOB_PUBLIC_SELECT
  })
}

/**
 * Query jobs that are due for polling reconciliation.
 * Selects QUEUED or RUNNING jobs whose nextPollAt is past or null.
 */
export const findJobsPendingReconciliation = async (
  limit = 10,
  tx?: PrismaTransactionClient
): Promise<AiJobPublicPayload[]> => {
  const client = tx || prisma
  const now = new Date()
  return client.aiProcessingJob.findMany({
    where: {
      status: {
        in: [AiJobStatus.QUEUED, AiJobStatus.RUNNING]
      },
      OR: [
        { nextPollAt: null },
        { nextPollAt: { lte: now } }
      ]
    },
    orderBy: { createdAt: 'asc' },
    take: Math.min(50, Math.max(1, limit)),
    select: AI_JOB_PUBLIC_SELECT
  })
}
