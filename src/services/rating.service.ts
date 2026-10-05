import { ENotificationType, ERatingStatus, Prisma, UserRole } from '@prisma/client'
import { prisma } from '~/config/prisma'
import { findCourseById } from '~/repositories/course.repository'
import { findUserById } from '~/repositories/user.repository'
import { findEnrollmentByUserAndCourse } from '~/repositories/enrollment.repository'
import {
  countRatingsWithFilter,
  createRating,
  deleteRating,
  findRatingById,
  findRatingByUserAndCourse,
  findRatingsByCourseId,
  findRatingsWithFilter,
  updateRatingStatus
} from '~/repositories/rating.repository'
import { pushNotificationService } from './notification.service'
import { ServiceResponse } from '~/types/type'
import { withCompatId } from '~/utils/uuid'

/**
 * TMDEMY — RATING SERVICE
 * 
 * Manages course ratings and reviews for students, instructors, and admins.
 * Single source of truth: PostgreSQL via Functional Repositories.
 */

export const createNewRatingService = async ({
  courseId,
  rate,
  content,
  userId
}: {
  courseId: string
  rate: number
  content: string
  userId: string
}): Promise<ServiceResponse> => {
  // 1. Verify Course exists in PostgreSQL
  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 2. Verify User exists in PostgreSQL
  const user = await findUserById(userId)
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  // 3. Verify Enrollment in PostgreSQL (replaces MongoDB user.courses)
  const enrollment = await findEnrollmentByUserAndCourse(userId, courseId)
  if (!enrollment) {
    return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
  }

  // 4. Verify user has not already rated this course
  const existingRating = await findRatingByUserAndCourse(userId, courseId)
  if (existingRating) {
    return { success: false, statusCode: 400, message: 'You have already rated this course' }
  }

  // 5. Create Rating in PostgreSQL
  try {
    const rating = await createRating({
      rate,
      content,
      userId,
      courseId,
      status: ERatingStatus.ACTIVE
    })

    // 6. Send notification to Course author (non-blocking)
    if (course.authorId !== userId) {
      try {
        await pushNotificationService({
          senderId: userId,
          receiverId: course.authorId,
          type: ENotificationType.RATING,
          message: `${user.username} vừa đánh giá khóa học "${course.title}" với ${rate} sao: "${content}"`,
          relatedId: rating.id
        })
      } catch (notifErr) {
        // Notification failure must not fail the rating creation
      }
    }

    return {
      success: true,
      message: 'Rating created successfully',
      data: withCompatId(rating)
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, statusCode: 400, message: 'You have already rated this course' }
    }
    throw error
  }
}

export const getCourseRatingsService = async (courseId: string): Promise<ServiceResponse> => {
  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const ratings = await findRatingsByCourseId(courseId, ERatingStatus.ACTIVE)

  const totalRatings = ratings.length
  const averageRating =
    totalRatings === 0
      ? 0
      : Math.round((ratings.reduce((sum, r) => sum + r.rate, 0) / totalRatings) * 100) / 100

  const formattedRatings = ratings.map((r) => ({
    _id: r.id,
    id: r.id,
    rate: r.rate,
    content: r.content,
    createdAt: r.createdAt,
    user: r.user
      ? {
          _id: r.user.id,
          id: r.user.id,
          username: r.user.username,
          avatar: r.user.avatar
        }
      : null
  }))

  return {
    success: true,
    message: 'Fetched course ratings successfully',
    data: {
      averageRating,
      totalRatings,
      ratings: formattedRatings
    }
  }
}

export const getRatingsForAdminOrTeacherService = async ({
  courseId,
  status,
  page = 1,
  limit = 10,
  userId,
  role
}: {
  courseId?: string
  status?: string
  page?: number
  limit?: number
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const parsedStatus = status ? (status.toUpperCase() as ERatingStatus) : undefined
  let targetCourseIds: string[] | undefined

  if (role === UserRole.TEACHER) {
    const teacherCourses = await prisma.course.findMany({
      where: { authorId: userId },
      select: { id: true }
    })
    const teacherCourseIdList = teacherCourses.map((c) => c.id)

    if (courseId) {
      if (!teacherCourseIdList.includes(courseId)) {
        return { success: false, statusCode: 403, message: 'You are not allowed to view ratings of this course' }
      }
      targetCourseIds = [courseId]
    } else {
      targetCourseIds = teacherCourseIdList
    }
  } else if (role === UserRole.ADMIN && courseId) {
    const courseExists = await findCourseById(courseId)
    if (!courseExists) {
      return { success: false, statusCode: 404, message: 'Course not found' }
    }
    targetCourseIds = [courseId]
  }

  const [ratings, total] = await Promise.all([
    findRatingsWithFilter({
      courseIds: targetCourseIds,
      status: parsedStatus,
      page,
      limit
    }),
    countRatingsWithFilter({
      courseIds: targetCourseIds,
      status: parsedStatus
    })
  ])

  const formattedRatings = ratings.map((r) => ({
    ...withCompatId(r),
    user: r.user ? withCompatId(r.user) : null,
    course: r.course ? withCompatId(r.course) : null
  }))

  return {
    success: true,
    message: 'Fetched ratings successfully',
    data: {
      ratings: formattedRatings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

export const deleteRatingService = async ({
  ratingId,
  userId,
  role
}: {
  ratingId: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const rating = await findRatingById(ratingId)
  if (!rating) {
    return { success: false, statusCode: 404, message: 'Rating not found' }
  }

  if (role === UserRole.TEACHER) {
    if (rating.course?.authorId !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not allowed to delete this rating'
      }
    }
  }

  await deleteRating(ratingId)

  return {
    success: true,
    message: 'Rating deleted successfully'
  }
}

export const updateRatingStatusService = async ({
  ratingId,
  status,
  userId,
  role
}: {
  ratingId: string
  status: ERatingStatus
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const rating = await findRatingById(ratingId)
  if (!rating) {
    return { success: false, statusCode: 404, message: 'Rating not found' }
  }

  if (role === UserRole.TEACHER) {
    if (rating.course?.authorId !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not allowed to update this rating'
      }
    }
  }

  const updatedRating = await updateRatingStatus(ratingId, status)

  return {
    success: true,
    message: 'Rating status updated successfully',
    data: updatedRating ? withCompatId(updatedRating) : null
  }
}
