import { CourseStatus, EOrderStatus, Prisma, UserRole } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — ADMIN STATISTIC FUNCTIONAL REPOSITORY
 *
 * Implements high-performance database aggregations for Admin Portal:
 * - Financial & Platform Revenue (BE-F9.11-001)
 * - Coupon Platform Analytics (BE-F9.11-005)
 * - All-in-One Dashboard Summary (BE-F9.11-007)
 */

export interface AdminFinancialStatsResult {
  grossRevenue: number
  netRevenue: number
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  rejectedOrders: number
  averageOrderValue: number
  revenueByMonth: Array<{
    month: string
    revenue: number
    orderCount: number
  }>
}

export interface AdminCouponStatsResult {
  totalCoupons: number
  activeCoupons: number
  expiredCoupons: number
  disabledCoupons: number
  totalUsageCount: number
  totalDiscountAmount: number
}

export interface AdminDashboardSummaryResult {
  counts: {
    totalUsers: number
    totalStudents: number
    totalTeachers: number
    totalAdmins: number
    totalCourses: number
    pendingCourses: number
    approvedCourses: number
    rejectedCourses: number
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    rejectedOrders: number
    totalComments: number
  }
  financials: {
    totalRevenue: number
    conversionRate: number
  }
  pendingTasks: Array<{
    type: string
    count: number
    actionUrl: string
  }>
  recentUsers: Array<{
    id: string
    fullName: string
    email: string
    role: string
    avatar: string
    createdAt: Date
  }>
}

export const getAdminFinancialStatsRepo = async (
  params: {
    timeRange?: string
    startDate?: Date
    endDate?: Date
  },
  tx?: PrismaTransactionClient
): Promise<AdminFinancialStatsResult> => {
  const client = tx ?? prisma
  const { timeRange = 'all', startDate, endDate } = params

  const dateFilter: Prisma.DateTimeFilter | undefined = (() => {
    if (startDate && endDate) {
      return { gte: startDate, lt: endDate }
    }
    if (startDate) {
      return { gte: startDate }
    }
    if (endDate) {
      return { lt: endDate }
    }
    if (timeRange && timeRange !== 'all') {
      const now = new Date()
      const start = new Date(now)
      if (timeRange === '7days') {
        start.setDate(now.getDate() - 7)
      } else if (timeRange === '30days') {
        start.setDate(now.getDate() - 30)
      } else if (timeRange === '1year') {
        start.setFullYear(now.getFullYear() - 1)
      }
      return { gte: start }
    }
    return undefined
  })()

  const orderWhere = dateFilter ? { createdAt: dateFilter } : {}

  const [completedAgg, totalOrders, pendingOrders, rejectedOrders] = await Promise.all([
    client.order.aggregate({
      where: {
        status: EOrderStatus.COMPLETED,
        ...orderWhere
      },
      _sum: {
        amount: true,
        total: true,
        discount: true
      },
      _count: {
        id: true
      }
    }),
    client.order.count({ where: orderWhere }),
    client.order.count({ where: { status: EOrderStatus.PENDING, ...orderWhere } }),
    client.order.count({ where: { status: EOrderStatus.REJECTED, ...orderWhere } })
  ])

  const completedOrders = completedAgg._count.id || 0
  const grossRevenue = Number(completedAgg._sum.amount || completedAgg._sum.total || 0)
  const netRevenue = Number(completedAgg._sum.total || 0)
  const averageOrderValue =
    completedOrders > 0 ? Math.round((netRevenue / completedOrders) * 100) / 100 : 0

  let timelineFilter = Prisma.sql``
  if (dateFilter?.gte && dateFilter?.lt) {
    timelineFilter = Prisma.sql`AND created_at >= ${dateFilter.gte} AND created_at < ${dateFilter.lt}`
  } else if (dateFilter?.gte) {
    timelineFilter = Prisma.sql`AND created_at >= ${dateFilter.gte}`
  } else if (dateFilter?.lt) {
    timelineFilter = Prisma.sql`AND created_at < ${dateFilter.lt}`
  }

  const timelineRaw = await client.$queryRaw<
    Array<{ month: string; revenue: number; orderCount: number }>
  >`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS "month",
      COALESCE(SUM(total), 0)::float AS "revenue",
      COUNT(id)::int AS "orderCount"
    FROM orders
    WHERE status = 'completed'::"EOrderStatus"
      ${timelineFilter}
    GROUP BY 1
    ORDER BY 1 ASC;
  `

  const revenueByMonth = timelineRaw.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue || 0),
    orderCount: Number(row.orderCount || 0)
  }))

  return {
    grossRevenue,
    netRevenue,
    totalOrders,
    completedOrders,
    pendingOrders,
    rejectedOrders,
    averageOrderValue,
    revenueByMonth
  }
}

export const getAdminCouponStatsRepo = async (
  tx?: PrismaTransactionClient
): Promise<AdminCouponStatsResult> => {
  const client = tx ?? prisma
  const now = new Date()

  const [totalCoupons, activeCoupons, expiredCoupons, disabledCoupons, usageAgg, discountAgg] =
    await Promise.all([
      client.coupon.count(),
      client.coupon.count({
        where: {
          active: true,
          OR: [{ endDate: null }, { endDate: { gte: now } }]
        }
      }),
      client.coupon.count({
        where: {
          endDate: { lt: now }
        }
      }),
      client.coupon.count({
        where: {
          active: false
        }
      }),
      client.coupon.aggregate({
        _sum: {
          used: true
        }
      }),
      client.order.aggregate({
        where: {
          status: EOrderStatus.COMPLETED
        },
        _sum: {
          discount: true
        }
      })
    ])

  return {
    totalCoupons,
    activeCoupons,
    expiredCoupons,
    disabledCoupons,
    totalUsageCount: Number(usageAgg._sum.used || 0),
    totalDiscountAmount: Number(discountAgg._sum.discount || 0)
  }
}

export const getAdminDashboardSummaryRepo = async (
  tx?: PrismaTransactionClient
): Promise<AdminDashboardSummaryResult> => {
  const client = tx ?? prisma

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalCourses,
    pendingCourses,
    approvedCourses,
    rejectedCourses,
    totalOrders,
    pendingOrders,
    completedOrders,
    rejectedOrders,
    totalComments,
    revenueAgg,
    recentUsersRaw
  ] = await Promise.all([
    client.user.count(),
    client.user.count({ where: { role: UserRole.USER } }),
    client.user.count({ where: { role: UserRole.TEACHER } }),
    client.user.count({ where: { role: UserRole.ADMIN } }),
    client.course.count({ where: { isDestroyed: false } }),
    client.course.count({ where: { isDestroyed: false, status: CourseStatus.PENDING } }),
    client.course.count({ where: { isDestroyed: false, status: CourseStatus.APPROVED } }),
    client.course.count({ where: { isDestroyed: false, status: CourseStatus.REJECTED } }),
    client.order.count(),
    client.order.count({ where: { status: EOrderStatus.PENDING } }),
    client.order.count({ where: { status: EOrderStatus.COMPLETED } }),
    client.order.count({ where: { status: EOrderStatus.REJECTED } }),
    client.comment.count(),
    client.order.aggregate({
      where: { status: EOrderStatus.COMPLETED },
      _sum: { total: true }
    }),
    client.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    })
  ])

  const totalRevenue = Number(revenueAgg._sum.total || 0)
  const conversionRate =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 1000) / 10 : 0

  const pendingTasks = [
    {
      type: 'course_approval',
      count: pendingCourses,
      actionUrl: '/admin/courses?status=pending'
    },
    {
      type: 'order_fulfillment',
      count: pendingOrders,
      actionUrl: '/admin/orders?status=pending'
    }
  ]

  const recentUsers = recentUsersRaw.map((u) => ({
    id: u.id,
    fullName: u.username,
    email: u.email,
    role: (u.role || 'user').toLowerCase(),
    avatar: u.avatar || '',
    createdAt: u.createdAt
  }))

  return {
    counts: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalCourses,
      pendingCourses,
      approvedCourses,
      rejectedCourses,
      totalOrders,
      pendingOrders,
      completedOrders,
      rejectedOrders,
      totalComments
    },
    financials: {
      totalRevenue,
      conversionRate
    },
    pendingTasks,
    recentUsers
  }
}
