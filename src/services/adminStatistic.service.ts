import { PrismaTransactionClient } from '~/config/prisma'
import {
  AdminCouponStatsResult,
  AdminDashboardSummaryResult,
  AdminFinancialStatsResult,
  getAdminCouponStatsRepo,
  getAdminDashboardSummaryRepo,
  getAdminFinancialStatsRepo
} from '~/repositories/adminStatistic.repository'
import { ServiceResponse } from '~/types/type'

/**
 * TMDEMY — ADMIN STATISTIC SERVICE
 *
 * Implements business logic for:
 * - Admin Platform Financial Stats (BE-F9.11-001)
 * - Admin Coupon Stats (BE-F9.11-005)
 * - Admin Dashboard Summary (BE-F9.11-007)
 */

export const getAdminFinancialStatsService = async (
  params: {
    timeRange?: string
    startDate?: string
    endDate?: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse<AdminFinancialStatsResult>> => {
  const { timeRange = 'all', startDate, endDate } = params

  let parsedStartDate: Date | undefined
  let parsedEndDate: Date | undefined

  if (startDate) {
    parsedStartDate = new Date(startDate)
    if (isNaN(parsedStartDate.getTime())) {
      return { success: false, statusCode: 400, message: 'Định dạng startDate không hợp lệ' }
    }
  }

  if (endDate) {
    parsedEndDate = new Date(endDate)
    if (isNaN(parsedEndDate.getTime())) {
      return { success: false, statusCode: 400, message: 'Định dạng endDate không hợp lệ' }
    }
    // Include the entire end day if it's just YYYY-MM-DD
    parsedEndDate.setUTCDate(parsedEndDate.getUTCDate() + 1)
  }

  if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
    return { success: false, statusCode: 400, message: 'startDate không thể lớn hơn endDate' }
  }

  const result = await getAdminFinancialStatsRepo(
    {
      timeRange,
      startDate: parsedStartDate,
      endDate: parsedEndDate
    },
    tx
  )

  return {
    success: true,
    message: 'Lấy thống kê tài chính thành công',
    data: result
  }
}

export const getAdminCouponStatsService = async (
  tx?: PrismaTransactionClient
): Promise<ServiceResponse<AdminCouponStatsResult>> => {
  const result = await getAdminCouponStatsRepo(tx)

  return {
    success: true,
    message: 'Lấy thống kê coupon toàn sàn thành công',
    data: result
  }
}

export const getAdminDashboardSummaryService = async (
  tx?: PrismaTransactionClient
): Promise<ServiceResponse<AdminDashboardSummaryResult>> => {
  const result = await getAdminDashboardSummaryRepo(tx)

  return {
    success: true,
    message: 'Lấy dữ liệu tổng quan admin dashboard thành công',
    data: result
  }
}
