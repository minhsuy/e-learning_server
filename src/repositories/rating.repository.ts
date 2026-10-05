import { ERatingStatus, Prisma, Rating } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: RATING
 * 
 * Provides database operations on PostgreSQL `ratings` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const RATING_USER_SELECT = {
  id: true,
  username: true,
  avatar: true
} as const satisfies Prisma.UserSelect

export const RATING_COURSE_SELECT = {
  id: true,
  title: true,
  slug: true,
  authorId: true
} as const satisfies Prisma.CourseSelect

export const RATING_PUBLIC_SELECT = {
  id: true,
  rate: true,
  content: true,
  userId: true,
  courseId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: RATING_USER_SELECT
  }
} as const satisfies Prisma.RatingSelect

export type RatingPublicPayload = Prisma.RatingGetPayload<{
  select: typeof RATING_PUBLIC_SELECT
}>

export const RATING_MANAGE_SELECT = {
  id: true,
  rate: true,
  content: true,
  userId: true,
  courseId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: RATING_USER_SELECT
  },
  course: {
    select: RATING_COURSE_SELECT
  }
} as const satisfies Prisma.RatingSelect

export type RatingManagePayload = Prisma.RatingGetPayload<{
  select: typeof RATING_MANAGE_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Find rating by composite unique [userId, courseId].
 */
export const findRatingByUserAndCourse = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Rating | null> => {
  const client = tx || prisma
  return client.rating.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  })
}

/**
 * Find rating by primary key UUID with course author relation for authorization check.
 */
export const findRatingById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<RatingManagePayload | null> => {
  const client = tx || prisma
  return client.rating.findUnique({
    where: { id },
    select: RATING_MANAGE_SELECT
  })
}

/**
 * Create a new rating record in PostgreSQL.
 */
export const createRating = async (
  data: {
    rate: number
    content: string
    userId: string
    courseId: string
    status?: ERatingStatus
  },
  tx?: PrismaTransactionClient
): Promise<Rating> => {
  const client = tx || prisma
  return client.rating.create({
    data: {
      rate: data.rate,
      content: data.content,
      userId: data.userId,
      courseId: data.courseId,
      status: data.status ?? ERatingStatus.ACTIVE
    }
  })
}

/**
 * Find active ratings of a course for public view.
 */
export const findRatingsByCourseId = async (
  courseId: string,
  status: ERatingStatus = ERatingStatus.ACTIVE,
  tx?: PrismaTransactionClient
): Promise<RatingPublicPayload[]> => {
  const client = tx || prisma
  return client.rating.findMany({
    where: {
      courseId,
      status
    },
    select: RATING_PUBLIC_SELECT,
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Filter ratings for Admin and Teacher with pagination.
 */
export const findRatingsWithFilter = async (
  params: {
    courseId?: string
    courseIds?: string[]
    status?: ERatingStatus
    page?: number
    limit?: number
  },
  tx?: PrismaTransactionClient
): Promise<RatingManagePayload[]> => {
  const client = tx || prisma
  const { courseId, courseIds, status, page = 1, limit = 10 } = params
  const skip = (page - 1) * limit

  const where: Prisma.RatingWhereInput = {
    ...(status && { status }),
    ...(courseId && { courseId }),
    ...(courseIds && { courseId: { in: courseIds } })
  }

  return client.rating.findMany({
    where,
    select: RATING_MANAGE_SELECT,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  })
}

/**
 * Count total ratings matching filter.
 */
export const countRatingsWithFilter = async (
  params: {
    courseId?: string
    courseIds?: string[]
    status?: ERatingStatus
  },
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const { courseId, courseIds, status } = params

  const where: Prisma.RatingWhereInput = {
    ...(status && { status }),
    ...(courseId && { courseId }),
    ...(courseIds && { courseId: { in: courseIds } })
  }

  return client.rating.count({ where })
}

/**
 * Update rating status.
 */
export const updateRatingStatus = async (
  id: string,
  status: ERatingStatus,
  tx?: PrismaTransactionClient
): Promise<Rating | null> => {
  const client = tx || prisma
  try {
    return await client.rating.update({
      where: { id },
      data: { status }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}

/**
 * Delete a rating by primary key UUID.
 */
export const deleteRating = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Rating | null> => {
  const client = tx || prisma
  try {
    return await client.rating.delete({
      where: { id }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}
