import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  getCoursePerformanceService,
  getTeacherCoursesStatsService,
  getTeacherEnrollmentStatsService,
  getTeacherLearningStatsService,
  getTeacherOverviewService,
  getTeacherRevenueService
} from '~/services/teacherStatistic.service'

/**
 * TMDEMY — TEACHER STATISTIC CONTROLLER
 *
 * Receives HTTP requests, extracts authenticated teacher identity (req.user.userId),
 * and delegates to the Service layer.
 */

// 1. GET /api/teacher/statistics/overview
export const getTeacherOverviewController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.user as { userId: string }
    const result = await getTeacherOverviewService(userId)
    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)

// 2. GET /api/teacher/statistics/revenue
export const getTeacherRevenueController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.user as { userId: string }
    const { period, startDate, endDate, courseId } = req.query as {
      period?: string
      startDate?: string
      endDate?: string
      courseId?: string
    }

    const result = await getTeacherRevenueService({
      teacherId: userId,
      period,
      startDate,
      endDate,
      courseId
    })

    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)

// 3. GET /api/teacher/statistics/courses
export const getTeacherCoursesStatsController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.user as { userId: string }
    const { page, limit, sortBy, order, status } = req.query as {
      page?: string
      limit?: string
      sortBy?: string
      order?: string
      status?: string
    }

    const result = await getTeacherCoursesStatsService({
      teacherId: userId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      order,
      status
    })

    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)

// 4. GET /api/teacher/statistics/enrollments
export const getTeacherEnrollmentStatsController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.user as { userId: string }
    const { period, startDate, endDate, courseId } = req.query as {
      period?: string
      startDate?: string
      endDate?: string
      courseId?: string
    }

    const result = await getTeacherEnrollmentStatsService({
      teacherId: userId,
      period,
      startDate,
      endDate,
      courseId
    })

    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)

// 5. GET /api/teacher/statistics/learning
export const getTeacherLearningStatsController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.user as { userId: string }
    const { courseId } = req.query as { courseId?: string }

    const result = await getTeacherLearningStatsService({
      teacherId: userId,
      courseId
    })

    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)

// 6. GET /api/teacher/statistics/course-performance/:courseId
export const getCoursePerformanceController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.user as { userId: string }
    const { courseId } = req.params as { courseId: string }

    const result = await getCoursePerformanceService({
      teacherId: userId,
      courseId
    })

    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)
