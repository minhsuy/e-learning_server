import { CourseStatus } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import { findCourseById } from '~/repositories/course.repository'
import {
  getCoursePerformanceStats,
  getTeacherCoursesStats,
  getTeacherEnrollmentStats,
  getTeacherLearningStats,
  getTeacherOverviewMetrics,
  getTeacherRevenueStats
} from '~/repositories/teacherStatistic.repository'
import { toPrismaCourseStatus } from './course.service'
import { ServiceResponse } from '~/types/type'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — TEACHER STATISTIC SERVICE
 *
 * Implements business rules and authorization for Teacher Statistics APIs.
 * Strictly enforces data isolation: Teacher can ONLY view statistics of their own courses.
 */

/**
 * Parses and computes date boundaries for period queries.
 * Ensures the entire endDate is included by setting end boundary to next day at 00:00:00 UTC.
 */
function resolveDateRange(params: {
  period?: string
  startDate?: string
  endDate?: string
}): { startDate: Date; endDate: Date; isMonthly: boolean; error?: string } {
  const period = params.period ? params.period.toLowerCase() : '30days'
  const now = new Date()

  if (period === '7days') {
    const start = new Date(now)
    start.setDate(now.getDate() - 7)
    start.setUTCHours(0, 0, 0, 0)

    const end = new Date(now)
    end.setDate(now.getDate() + 1)
    end.setUTCHours(0, 0, 0, 0)

    return { startDate: start, endDate: end, isMonthly: false }
  }

  if (period === '12months') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))

    return { startDate: start, endDate: end, isMonthly: true }
  }

  if (period === 'custom') {
    if (!params.startDate || !params.endDate) {
      return {
        startDate: now,
        endDate: now,
        isMonthly: false,
        error: 'Both startDate and endDate are required for custom period'
      }
    }

    const start = new Date(`${params.startDate}T00:00:00.000Z`)
    const end = new Date(`${params.endDate}T00:00:00.000Z`)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        startDate: now,
        endDate: now,
        isMonthly: false,
        error: 'Invalid date format. Expected YYYY-MM-DD'
      }
    }

    if (start > end) {
      return {
        startDate: now,
        endDate: now,
        isMonthly: false,
        error: 'startDate cannot be after endDate'
      }
    }

    // Include entire endDate by shifting to next day 00:00:00
    end.setUTCDate(end.getUTCDate() + 1)
    return { startDate: start, endDate: end, isMonthly: false }
  }

  // Default: '30days'
  const start = new Date(now)
  start.setDate(now.getDate() - 30)
  start.setUTCHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setDate(now.getDate() + 1)
  end.setUTCHours(0, 0, 0, 0)

  return { startDate: start, endDate: end, isMonthly: false }
}

/**
 * 1. Overview Statistics Service
 */
export const getTeacherOverviewService = async (
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(teacherId)) {
    return { success: false, statusCode: 400, message: 'Invalid teacher ID' }
  }

  const metrics = await getTeacherOverviewMetrics(teacherId, tx)

  return {
    success: true,
    message: 'Fetched teacher overview statistics successfully',
    data: metrics
  }
}

/**
 * 2. Revenue Statistics Service
 */
export const getTeacherRevenueService = async (
  params: {
    teacherId: string
    period?: string
    startDate?: string
    endDate?: string
    courseId?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { teacherId, period, startDate, endDate, courseId } = params

  if (!isValidUUID(teacherId)) {
    return { success: false, statusCode: 400, message: 'Invalid teacher ID' }
  }

  // Strict ownership check if courseId is passed
  if (courseId) {
    if (!isValidUUID(courseId)) {
      return { success: false, statusCode: 400, message: 'Invalid course ID' }
    }
    const course = await findCourseById(courseId, tx)
    if (!course || course.isDestroyed || course.authorId !== teacherId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You can only view statistics of your own courses'
      }
    }
  }

  const dateRange = resolveDateRange({ period, startDate, endDate })
  if (dateRange.error) {
    return { success: false, statusCode: 400, message: dateRange.error }
  }

  const result = await getTeacherRevenueStats(
    {
      teacherId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      courseId,
      isMonthly: dateRange.isMonthly
    },
    tx
  )

  return {
    success: true,
    message: 'Fetched teacher revenue statistics successfully',
    data: result
  }
}

/**
 * 3. Course Breakdown Statistics Service
 */
export const getTeacherCoursesStatsService = async (
  params: {
    teacherId: string
    page?: number
    limit?: number
    sortBy?: string
    order?: string
    status?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { teacherId, page = 1, limit = 10, sortBy = 'revenue', order = 'desc', status } = params

  if (!isValidUUID(teacherId)) {
    return { success: false, statusCode: 400, message: 'Invalid teacher ID' }
  }

  const validSortBy = ['revenue', 'students', 'rating', 'createdAt'].includes(sortBy)
    ? sortBy
    : 'revenue'
  const validOrder = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc'
  const validStatus = status ? toPrismaCourseStatus(status) : undefined

  const result = await getTeacherCoursesStats(
    {
      teacherId,
      page: Math.max(1, Number(page)),
      limit: Math.min(100, Math.max(1, Number(limit))),
      sortBy: validSortBy,
      order: validOrder,
      status: validStatus
    },
    tx
  )

  return {
    success: true,
    message: 'Fetched course statistics successfully',
    data: result
  }
}

/**
 * 4. Enrollment Statistics Service
 */
export const getTeacherEnrollmentStatsService = async (
  params: {
    teacherId: string
    period?: string
    startDate?: string
    endDate?: string
    courseId?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { teacherId, period, startDate, endDate, courseId } = params

  if (!isValidUUID(teacherId)) {
    return { success: false, statusCode: 400, message: 'Invalid teacher ID' }
  }

  // Strict ownership check if courseId is passed
  if (courseId) {
    if (!isValidUUID(courseId)) {
      return { success: false, statusCode: 400, message: 'Invalid course ID' }
    }
    const course = await findCourseById(courseId, tx)
    if (!course || course.isDestroyed || course.authorId !== teacherId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You can only view statistics of your own courses'
      }
    }
  }

  const dateRange = resolveDateRange({ period, startDate, endDate })
  if (dateRange.error) {
    return { success: false, statusCode: 400, message: dateRange.error }
  }

  const result = await getTeacherEnrollmentStats(
    {
      teacherId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      courseId,
      isMonthly: dateRange.isMonthly
    },
    tx
  )

  return {
    success: true,
    message: 'Fetched enrollment statistics successfully',
    data: result
  }
}

/**
 * 5. Learning & Quiz Assessment Statistics Service
 */
export const getTeacherLearningStatsService = async (
  params: {
    teacherId: string
    courseId?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { teacherId, courseId } = params

  if (!isValidUUID(teacherId)) {
    return { success: false, statusCode: 400, message: 'Invalid teacher ID' }
  }

  // Strict ownership check if courseId is passed
  if (courseId) {
    if (!isValidUUID(courseId)) {
      return { success: false, statusCode: 400, message: 'Invalid course ID' }
    }
    const course = await findCourseById(courseId, tx)
    if (!course || course.isDestroyed || course.authorId !== teacherId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You can only view statistics of your own courses'
      }
    }
  }

  const result = await getTeacherLearningStats({ teacherId, courseId }, tx)

  return {
    success: true,
    message: 'Fetched learning statistics successfully',
    data: result
  }
}

/**
 * 6. Course Performance Snapshot Service
 */
export const getCoursePerformanceService = async (
  params: {
    teacherId: string
    courseId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { teacherId, courseId } = params

  if (!isValidUUID(teacherId)) {
    return { success: false, statusCode: 400, message: 'Invalid teacher ID' }
  }

  if (!isValidUUID(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Course ID' }
  }

  const result = await getCoursePerformanceStats(courseId, tx)

  if (!result) {
    return {
      success: false,
      statusCode: 404,
      message: 'Course not found'
    }
  }

  // Strict ownership check: only course author can view its performance
  if (result.course.authorId !== teacherId) {
    return {
      success: false,
      statusCode: 403,
      message: 'You can only view performance of your own courses'
    }
  }

  return {
    success: true,
    message: 'Fetched course performance statistics successfully',
    data: result
  }
}
