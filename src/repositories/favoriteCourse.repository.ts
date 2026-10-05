import { FavoriteCourse, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: FAVORITE COURSE
 * 
 * Provides database operations on PostgreSQL `favorite_courses` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const FAVORITE_COURSE_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  price: true,
  level: true,
  type: true,
  sold: true,
  view: true
} as const satisfies Prisma.CourseSelect

export const FAVORITE_RECORD_SELECT = {
  id: true,
  userId: true,
  courseId: true,
  createdAt: true,
  course: {
    select: FAVORITE_COURSE_SELECT
  }
} as const satisfies Prisma.FavoriteCourseSelect

export type FavoriteCourseRecordPayload = Prisma.FavoriteCourseGetPayload<{
  select: typeof FAVORITE_RECORD_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Find favorite course relation by composite unique [userId, courseId].
 */
export const findFavorite = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<FavoriteCourse | null> => {
  const client = tx || prisma
  return client.favoriteCourse.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  })
}

/**
 * Create a favorite course relation.
 */
export const createFavorite = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<FavoriteCourse> => {
  const client = tx || prisma
  return client.favoriteCourse.create({
    data: {
      userId,
      courseId
    }
  })
}

/**
 * Delete a favorite course relation by composite unique [userId, courseId].
 */
export const deleteFavorite = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<FavoriteCourse | null> => {
  const client = tx || prisma
  try {
    return await client.favoriteCourse.delete({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}

/**
 * Find paginated favorite courses of a user with course details.
 */
export const findFavoritesByUserId = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  tx?: PrismaTransactionClient
): Promise<FavoriteCourseRecordPayload[]> => {
  const client = tx || prisma
  const skip = (page - 1) * limit
  return client.favoriteCourse.findMany({
    where: { userId },
    select: FAVORITE_RECORD_SELECT,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  })
}

/**
 * Count total favorite courses of a user.
 */
export const countFavoritesByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.favoriteCourse.count({
    where: { userId }
  })
}
