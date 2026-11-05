import {
  CodingExercise,
  CodingExerciseRevision,
  CodingTestCase,
  ExerciseStatus,
  Prisma
} from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: CODING EXERCISE
 * 
 * Pure functional data access layer for CodingExercise, CodingExerciseRevision, and CodingTestCase.
 * Conforms to AGENTS.md:
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PROJECTIONS
// ==========================================

export const CODING_EXERCISE_PUBLIC_LIST_SELECT = {
  id: true,
  lessonId: true,
  title: true,
  slug: true,
  difficulty: true,
  programmingLanguage: true,
  order: true,
  status: true
} as const satisfies Prisma.CodingExerciseSelect

export const CODING_TEST_CASE_PUBLIC_SELECT = {
  id: true,
  input: true,
  expectedOutput: true,
  order: true,
  weight: true,
  explanation: true
} as const satisfies Prisma.CodingTestCaseSelect

export const CODING_TEST_CASE_TEACHER_SELECT = {
  id: true,
  revisionId: true,
  input: true,
  expectedOutput: true,
  isHidden: true,
  order: true,
  weight: true,
  explanation: true,
  createdAt: true
} as const satisfies Prisma.CodingTestCaseSelect

export const CODING_REVISION_TEACHER_SELECT = {
  id: true,
  exerciseId: true,
  version: true,
  title: true,
  description: true,
  starterCode: true,
  referenceSolution: true,
  executionContract: true,
  timeLimit: true,
  memoryLimit: true,
  isPublished: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  testCases: {
    orderBy: { order: 'asc' },
    select: CODING_TEST_CASE_TEACHER_SELECT
  }
} as const satisfies Prisma.CodingExerciseRevisionSelect

// ==========================================
// 2. READ OPERATIONS
// ==========================================

export const findCodingExerciseById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<CodingExercise | null> => {
  const client = tx || prisma
  return client.codingExercise.findUnique({
    where: { id }
  })
}


// @fix-lints
export const findCodingExerciseWithRevisions = async (
  id: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingExercise.findUnique({
    where: { id },
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        include: {
          testCases: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })
}

export const findCodingExercisesByLesson = async (
  lessonId: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingExercise.findMany({
    where: { lessonId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        select: {
          id: true,
          version: true,
          title: true,
          isPublished: true,
          createdAt: true
        }
      }
    }
  })
}

export const findPublishedCodingExercisesByLesson = async (
  lessonId: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingExercise.findMany({
    where: {
      lessonId,
      status: ExerciseStatus.PUBLISHED
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      lessonId: true,
      title: true,
      slug: true,
      difficulty: true,
      programmingLanguage: true,
      order: true,
      status: true,
      revisions: {
        where: { isPublished: true },
        orderBy: { version: 'desc' },
        take: 1,
        select: {
          id: true,
          version: true
        }
      }
    }
  })
}

export const findPublishedExerciseById = async (
  id: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingExercise.findFirst({
    where: {
      id,
      status: ExerciseStatus.PUBLISHED
    },
    include: {
      revisions: {
        where: { isPublished: true },
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          testCases: {
            where: { isHidden: false },
            orderBy: { order: 'asc' },
            select: CODING_TEST_CASE_PUBLIC_SELECT
          }
        }
      }
    }
  })
}

export const findLatestRevision = async (
  exerciseId: string,
  tx?: PrismaTransactionClient
): Promise<CodingExerciseRevision | null> => {
  const client = tx || prisma
  return client.codingExerciseRevision.findFirst({
    where: { exerciseId },
    orderBy: { version: 'desc' }
  })
}

export const findLatestPublishedRevision = async (
  exerciseId: string,
  tx?: PrismaTransactionClient
): Promise<CodingExerciseRevision | null> => {
  const client = tx || prisma
  return client.codingExerciseRevision.findFirst({
    where: { exerciseId, isPublished: true },
    orderBy: { version: 'desc' }
  })
}

export const findTestCasesByRevisionId = async (
  revisionId: string,
  onlyPublic = false,
  tx?: PrismaTransactionClient
): Promise<CodingTestCase[]> => {
  const client = tx || prisma
  return client.codingTestCase.findMany({
    where: {
      revisionId,
      ...(onlyPublic ? { isHidden: false } : {})
    },
    orderBy: { order: 'asc' }
  })
}

export const countSubmissionsByRevisionId = async (
  revisionId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.codingSubmission.count({
    where: { revisionId }
  })
}

export const isExerciseSlugTakenInLesson = async (
  slug: string,
  lessonId: string,
  excludeId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma
  const existing = await client.codingExercise.findFirst({
    where: {
      slug,
      lessonId,
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true }
  })
  return Boolean(existing)
}

// ==========================================
// 3. WRITE OPERATIONS
// ==========================================

export const createCodingExercise = async (
  data: Prisma.CodingExerciseUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<CodingExercise> => {
  const client = tx || prisma
  return client.codingExercise.create({
    data
  })
}

export const createCodingExerciseRevision = async (
  data: Prisma.CodingExerciseRevisionUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<CodingExerciseRevision> => {
  const client = tx || prisma
  return client.codingExerciseRevision.create({
    data
  })
}

export const createManyCodingTestCases = async (
  data: Prisma.CodingTestCaseCreateManyInput[],
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingTestCase.createMany({
    data
  })
}

export const updateCodingExercise = async (
  id: string,
  data: Prisma.CodingExerciseUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<CodingExercise> => {
  const client = tx || prisma
  return client.codingExercise.update({
    where: { id },
    data
  })
}

export const updateCodingExerciseRevision = async (
  id: string,
  data: Prisma.CodingExerciseRevisionUncheckedUpdateInput,
  tx?: PrismaTransactionClient
): Promise<CodingExerciseRevision> => {
  const client = tx || prisma
  return client.codingExerciseRevision.update({
    where: { id },
    data
  })
}

export const deleteTestCasesByRevisionId = async (
  revisionId: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.codingTestCase.deleteMany({
    where: { revisionId }
  })
}

export const archiveCodingExercise = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<CodingExercise> => {
  const client = tx || prisma
  return client.codingExercise.update({
    where: { id },
    data: {
      status: ExerciseStatus.ARCHIVED
    }
  })
}
