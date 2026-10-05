import { Prisma } from '@prisma/client'
import { findCourseById } from '~/repositories/course.repository'
import {
  countFavoritesByUserId,
  createFavorite,
  deleteFavorite,
  findFavorite,
  findFavoritesByUserId
} from '~/repositories/favoriteCourse.repository'
import { ServiceResponse } from '~/types/type'
import { withCompatId } from '~/utils/uuid'

/**
 * TMDEMY — FAVORITE COURSE SERVICE
 * 
 * Manages user course wishlist / bookmarks.
 * Single source of truth: PostgreSQL via Functional Repositories.
 */

export const addFavoriteService = async (
  userId: string,
  courseId: string
): Promise<ServiceResponse> => {
  // 1. Verify Course exists in PostgreSQL
  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 2. Check if already favorited
  const existing = await findFavorite(userId, courseId)
  if (existing) {
    return { success: false, statusCode: 400, message: 'Course already in favorites' }
  }

  // 3. Create Favorite in PostgreSQL
  try {
    const favorite = await createFavorite(userId, courseId)
    return {
      success: true,
      message: 'Course added to favorites',
      data: withCompatId(favorite)
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, statusCode: 400, message: 'Course already in favorites' }
    }
    throw error
  }
}

export const removeFavoriteService = async (
  userId: string,
  courseId: string
): Promise<ServiceResponse> => {
  // 1. Check if favorite exists
  const existing = await findFavorite(userId, courseId)
  if (!existing) {
    return { success: false, statusCode: 404, message: 'Favorite not found' }
  }

  // 2. Delete Favorite
  await deleteFavorite(userId, courseId)

  return {
    success: true,
    message: 'Course removed from favorites'
  }
}

export const getFavoritesService = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse> => {
  const [favorites, total] = await Promise.all([
    findFavoritesByUserId(userId, page, limit),
    countFavoritesByUserId(userId)
  ])

  const formattedFavorites = favorites.map((fav) => ({
    ...withCompatId(fav),
    course: fav.course
      ? {
          ...withCompatId(fav.course),
          price: Number(fav.course.price)
        }
      : null
  }))

  return {
    success: true,
    message: 'Fetched favorites successfully',
    data: {
      favorites: formattedFavorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
