import { Chapter, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

// ==========================================
// 1. PRISMA SELECT CONSTANTS (PROJECTIONS)
// ==========================================

/**
 * Public chapter projection for navigation and syllabus outline.
 */
export const CHAPTER_PUBLIC_SELECT = {
  id: true,
  title: true,
  courseId: true,
  order: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.ChapterSelect

export type ChapterPublicPayload = Prisma.ChapterGetPayload<{
  select: typeof CHAPTER_PUBLIC_SELECT
}>

/**
 * Chapter with structured lessons list ordered by sequence.
 */
export const CHAPTER_WITH_LESSONS_SELECT = {
  id: true,
  title: true,
  courseId: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  lessons: {
    orderBy: {
      order: 'asc'
    },
    select: {
      id: true,
      title: true,
      slug: true,
      order: true,
      duration: true,
      type: true,
      isDemo: true,
      createdAt: true
    }
  }
} as const satisfies Prisma.ChapterSelect

export type ChapterWithLessonsPayload = Prisma.ChapterGetPayload<{
  select: typeof CHAPTER_WITH_LESSONS_SELECT
}>

export type ChapterWithAllLessons = Prisma.ChapterGetPayload<{
  include: {
    lessons: {
      orderBy: {
        order: 'asc'
      }
    }
  }
}>

// Helper to resolve client and options polymorphic arguments
function resolveChapterClientAndOptions(
  optionsOrTx?: { include?: Prisma.ChapterInclude; select?: Prisma.ChapterSelect } | PrismaTransactionClient,
  explicitTx?: PrismaTransactionClient
): { client: PrismaTransactionClient | typeof prisma; options?: { include?: Prisma.ChapterInclude; select?: Prisma.ChapterSelect } } {
  if (!optionsOrTx) {
    return { client: explicitTx || prisma }
  }
  if ('chapter' in optionsOrTx) {
    return { client: optionsOrTx as PrismaTransactionClient }
  }
  return {
    client: explicitTx || prisma,
    options: optionsOrTx
  }
}

// ==========================================
// 2. CHAPTER MUTATION FUNCTIONS
// ==========================================

/**
 * Insert a new chapter into PostgreSQL.
 */
export const addChapter = async (
  data: Prisma.ChapterCreateInput,
  tx?: PrismaTransactionClient
): Promise<Chapter> => {
  const client = tx || prisma
  return client.chapter.create({ data })
}

export const createChapter = addChapter

/**
 * Update an existing chapter by primary key UUID.
 */
export const updateChapter = async (
  id: string,
  data: Prisma.ChapterUpdateInput,
  tx?: PrismaTransactionClient
): Promise<Chapter> => {
  const client = tx || prisma
  return client.chapter.update({
    where: { id },
    data
  })
}

/**
 * Soft delete a chapter by setting `isDestroyed = true`.
 */
export const softDeleteChapter = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Chapter> => {
  const client = tx || prisma
  return client.chapter.update({
    where: { id },
    data: { isDestroyed: true }
  })
}

/**
 * Restore a soft-deleted chapter.
 */
export const restoreChapter = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Chapter> => {
  const client = tx || prisma
  return client.chapter.update({
    where: { id },
    data: { isDestroyed: false }
  })
}

/**
 * Hard delete a chapter by primary key UUID.
 * Cascades to lessons according to schema.
 */
export const deleteChapter = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Chapter> => {
  const client = tx || prisma
  return client.chapter.delete({
    where: { id }
  })
}

// ==========================================
// 3. CHAPTER QUERY FUNCTIONS
// ==========================================

/**
 * Find a chapter by its primary key UUID.
 */
export const findChapterById = async <T = Chapter>(
  id: string,
  optionsOrTx?: {
    include?: Prisma.ChapterInclude
    select?: Prisma.ChapterSelect
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveChapterClientAndOptions(optionsOrTx, tx)
  return client.chapter.findUnique({
    where: { id },
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find all chapters for a given course.
 * Defaults to filtering out soft-deleted chapters (`isDestroyed: false`).
 */
export const findChaptersByCourse = async (
  courseId: string,
  activeOnly = true,
  tx?: PrismaTransactionClient
): Promise<ChapterWithAllLessons[]> => {
  const client = tx || prisma
  return client.chapter.findMany({
    where: {
      courseId,
      ...(activeOnly ? { isDestroyed: false } : {})
    },
    orderBy: {
      order: 'asc'
    },
    include: {
      lessons: {
        orderBy: {
          order: 'asc'
        }
      }
    }
  })
}

/**
 * Find the maximum `order` among chapters in a course.
 * Used for auto-incrementing chapter sequence when creating without explicit order.
 */
export const findMaxChapterOrderByCourse = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const topChapter = await client.chapter.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
    select: { order: true }
  })
  return topChapter?.order ?? 0
}

/**
 * Count chapters with arbitrary filter.
 */
export const countChapters = async (
  where?: Prisma.ChapterWhereInput,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.chapter.count({ where })
}
