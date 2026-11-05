import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  getAdminCouponStatsService,
  getAdminDashboardSummaryService,
  getAdminFinancialStatsService
} from '~/services/adminStatistic.service'

/**
 * TMDEMY — ADMIN STATISTIC CONTROLLER
 *
 * Handles HTTP requests for:
 * - GET /api/admin/statistics/financial (BE-F9.11-001)
 * - GET /api/coupons/admin/statistics (BE-F9.11-005)
 * - GET /api/admin/dashboard/summary (BE-F9.11-007)
 */

export const getAdminFinancialStatsController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { timeRange, startDate, endDate } = req.query as {
      timeRange?: string
      startDate?: string
      endDate?: string
    }

    const result = await getAdminFinancialStatsService({
      timeRange,
      startDate,
      endDate
    })

    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)

export const getAdminCouponStatsController = asyncHandler(
  async (_req: Request, res: Response): Promise<any> => {
    const result = await getAdminCouponStatsService()
    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)

export const getAdminDashboardSummaryController = asyncHandler(
  async (_req: Request, res: Response): Promise<any> => {
    const result = await getAdminDashboardSummaryService()
    return res.status(result.success ? 200 : result.statusCode || 400).json(result)
  }
)
