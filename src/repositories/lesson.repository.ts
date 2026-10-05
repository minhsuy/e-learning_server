import { Lesson, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

// ==========================================
// 1. PRISMA SELECT CONSTANTS (PROJECTIONS)
// ==========================================

/**
 * Public lesson projection for syllabus overview and curriculum table of contents.
 * Excludes protected full content and video URLs for non-demo items.
 */
export const LESSON_PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  chapterId: true,
  courseId: true,
  authorId: true,
  order: true,
  duration: true,
  type: true,
  isDemo: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.LessonSelect

export type LessonPublicPayload = Prisma.LessonGetPayload<{
  select: typeof LESSON_PUBLIC_SELECT
}>

/**
 * Full lesson study projection for authorized enrolled users and instructors.
 * Contains instructional content and video streaming URL.
 */
export const LESSON_STUDY_SELECT = {
  id: true,
  title: true,
  slug: true,
  chapterId: true,
  courseId: true,
  authorId: true,
  order: true,
  duration: true,
  type: true,
  content: true,
  isDemo: true,
  videoUrl: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.LessonSelect

export type LessonStudyPayload = Prisma.LessonGetPayload<{
  select: typeof LESSON_STUDY_SELECT
}>

/**
 * Compact lesson projection for navigation indices and sequence references.
 */
export const LESSON_COMPACT_SELECT = {
  id: true,
  title: true,
  slug: true,
  order: true,
  duration: true,
  type: true,
  isDemo: true
} as const satisfies Prisma.LessonSelect

export type LessonCompactPayload = Prisma.LessonGetPayload<{
  select: typeof LESSON_COMPACT_SELECT
}>

// Helper to resolve client and options polymorphic arguments
function resolveLessonClientAndOptions(
  optionsOrTx?: { include?: Prisma.LessonInclude; select?: Prisma.LessonSelect } | PrismaTransactionClient,
  explicitTx?: PrismaTransactionClient
): { client: PrismaTransactionClient | typeof prisma; options?: { include?: Prisma.LessonInclude; select?: Prisma.LessonSelect } } {
  if (!optionsOrTx) {
    return { client: explicitTx || prisma }
  }
  if ('lesson' in optionsOrTx) {
    return { client: optionsOrTx as PrismaTransactionClient }
  }
  return {
    client: explicitTx || prisma,
    options: optionsOrTx
  }
}

// ==========================================
// 2. LESSON MUTATION FUNCTIONS
// ==========================================

/**
 * Insert a new lesson into PostgreSQL.
 */
export const addLesson = async (
  data: Prisma.LessonCreateInput,
  tx?: PrismaTransactionClient
): Promise<Lesson> => {
  const client = tx || prisma
  return client.lesson.create({ data })
}

export const createLesson = addLesson

/**
 * Update an existing lesson by primary key UUID.
 */
export const updateLesson = async (
  id: string,
  data: Prisma.LessonUpdateInput,
  tx?: PrismaTransactionClient
): Promise<Lesson> => {
  const client = tx || prisma
  return client.lesson.update({
    where: { id },
    data
  })
}

/**
 * Hard delete a lesson by primary key UUID.
 */
export const deleteLesson = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Lesson> => {
  const client = tx || prisma
  return client.lesson.delete({
    where: { id }
  })
}

// ==========================================
// 3. LESSON QUERY FUNCTIONS
// ==========================================

/**
 * Find a lesson by its primary key UUID.
 */
export const findLessonById = async <T = Lesson>(
  id: string,
  optionsOrTx?: {
    include?: Prisma.LessonInclude
    select?: Prisma.LessonSelect
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveLessonClientAndOptions(optionsOrTx, tx)
  return client.lesson.findUnique({
    where: { id },
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find a lesson by unique compound key (slug + courseId).
 */
export const findLessonBySlugAndCourse = async (
  slug: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Lesson | null> => {
  const client = tx || prisma
  return client.lesson.findUnique({
    where: {
      slug_courseId: {
        slug: slug.trim().toLowerCase(),
        courseId
      }
    }
  })
}

/**
 * Find all lessons belonging to a chapter, ordered by sequence.
 */
export const findLessonsByChapter = async <T = Lesson>(
  chapterId: string,
  optionsOrTx?: {
    select?: Prisma.LessonSelect
    include?: Prisma.LessonInclude
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T[]> => {
  const { client, options } = resolveLessonClientAndOptions(optionsOrTx, tx)
  return client.lesson.findMany({
    where: { chapterId },
    orderBy: { order: 'asc' },
    ...(options?.select ? { select: options.select } : {}),
    ...(options?.include ? { include: options.include } : {})
  }) as Promise<T[]>
}

/**
 * Find all lessons belonging to a course, ordered by chapter and sequence.
 */
export const findLessonsByCourse = async <T = Lesson>(
  courseId: string,
  optionsOrTx?: {
    select?: Prisma.LessonSelect
    include?: Prisma.LessonInclude
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T[]> => {
  const { client, options } = resolveLessonClientAndOptions(optionsOrTx, tx)
  return client.lesson.findMany({
    where: { courseId },
    orderBy: [
      { chapter: { order: 'asc' } },
      { order: 'asc' }
    ],
    ...(options?.select ? { select: options.select } : {}),
    ...(options?.include ? { include: options.include } : {})
  }) as Promise<T[]>
}

/**
 * Find the maximum `order` among lessons in a specific chapter.
 * Used for auto-incrementing lesson sequence when creating without explicit order.
 */
export const findMaxLessonOrderByChapter = async (
  chapterId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const topLesson = await client.lesson.findFirst({
    where: { chapterId },
    orderBy: { order: 'desc' },
    select: { order: true }
  })
  return topLesson?.order ?? 0
}

/**
 * Check if a lesson slug is already taken within a specific course.
 */
export const isLessonSlugTakenInCourse = async (
  slug: string,
  courseId: string,
  excludeId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma
  const count = await client.lesson.count({
    where: {
      slug: slug.trim().toLowerCase(),
      courseId,
      ...(excludeId ? { id: { not: excludeId } } : {})
    }
  })
  return count > 0
}

/**
 * Count lessons with arbitrary filter.
 */
export const countLessons = async (
  where?: Prisma.LessonWhereInput,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.lesson.count({ where })
}
