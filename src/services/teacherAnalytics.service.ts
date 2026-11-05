import { PrismaTransactionClient } from '~/config/prisma'
import { findUserById } from '~/repositories/user.repository'
import {
  getTeacherDetailedCourseAnalytics,
  getTeacherOrderAnalyticsData,
  getTeacherRevenueByCourseInDateRange,
  getTeacherStudentAnalyticsData
} from '~/repositories/teacherAnalytics.repository'
import {
  getTeacherOverviewMetrics,
  getTeacherRevenueStats
} from '~/repositories/teacherStatistic.repository'
import {
  DateRangeOptions,
  resolveAnalyticsDateRange
} from '~/utils/analyticsDateRange'
import {
  TeacherCourseAnalytics,
  TeacherDashboardSummary,
  TeacherOrderAnalytics,
  TeacherRevenueAnalytics,
  TeacherStudentAnalytics
} from '~/models/teacherAnalytics.model'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — TEACHER ANALYTICS CORE SERVICE (TG-03A)
 *
 * Implements centralized, multi-tenant analytics business logic for TMdemy teachers.
 * Powers:
 * - REST APIs
 * - TG-03B Telegram Bot commands (/revenue, /orders, /students, /courses)
 * - TG-04 Gemini natural-language analysis
 * - TG-05 Scheduled daily/weekly reports
 *
 * SECURITY INVARIANTS:
 * 1. Strict Authorization: Every call re-verifies teacher existence, TEACHER role, and ACTIVE status.
 * 2. Multi-Tenant Scoping: All underlying database queries strictly filter by `c.author_id = teacherId`.
 * 3. Zero SQL Injection: All raw queries use Prisma.sql parameters.
 * 4. Deterministic Timezone: All boundaries computed in `Asia/Ho_Chi_Minh` (UTC+7).
 */

/**
 * Re-verifies teacher existence, role, and active status in PostgreSQL.
 * Throws an Error if unauthorized or invalid.
 */
export async function assertTeacherAuthorization(
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<{ id: string; username: string; email: string }> {
  if (!teacherId || !isValidUUID(teacherId)) {
    throw new Error('Mã định danh Giảng viên không hợp lệ (Invalid UUID).')
  }

  const user = await findUserById(teacherId, tx)
  if (!user || user.status !== 'ACTIVE') {
    throw new Error('Tài khoản Giảng viên không tồn tại hoặc đã bị khóa.')
  }

  const role = (user.role || '').toLowerCase()
  if (role !== 'teacher') {
    throw new Error('Tài khoản không có quyền Giảng viên (Teacher role required).')
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email
  }
}

/**
 * A. REVENUE ANALYTICS
 * Calculates net revenue, gross sales, coupon discounts, order counts,
 * timeline trends, and revenue attribution per course.
 */
export async function getRevenueAnalyticsService(
  teacherId: string,
  options: DateRangeOptions = {},
  tx?: PrismaTransactionClient
): Promise<TeacherRevenueAnalytics> {
  await assertTeacherAuthorization(teacherId, tx)

  const resolvedRange = resolveAnalyticsDateRange(options)
  const { startDate, endDate, period, isMonthly, label } = resolvedRange

  // 1. Fetch period stats and course revenue breakdown concurrently
  const [periodStats, byCourse, todayRange, weekRange, monthRange, lastMonthRange, allTimeStats] =
    await Promise.all([
      getTeacherRevenueStats(
        {
          teacherId,
          startDate,
          endDate,
          isMonthly
        },
        tx
      ),
      getTeacherRevenueByCourseInDateRange(
        {
          teacherId,
          startDate,
          endDate
        },
        tx
      ),
      // KPI ranges for comparative cards
      Promise.resolve(resolveAnalyticsDateRange({ period: 'today' })),
      Promise.resolve(resolveAnalyticsDateRange({ period: 'this_week' })),
      Promise.resolve(resolveAnalyticsDateRange({ period: 'this_month' })),
      Promise.resolve(resolveAnalyticsDateRange({ period: 'last_month' })),
      getTeacherOverviewMetrics(teacherId, tx)
    ])

  // 2. Compute KPI values for today, week, month, last month
  const [todayStats, weekStats, monthStats, lastMonthStats] = await Promise.all([
    getTeacherRevenueStats({ teacherId, startDate: todayRange.startDate, endDate: todayRange.endDate }, tx),
    getTeacherRevenueStats({ teacherId, startDate: weekRange.startDate, endDate: weekRange.endDate }, tx),
    getTeacherRevenueStats({ teacherId, startDate: monthRange.startDate, endDate: monthRange.endDate }, tx),
    getTeacherRevenueStats({ teacherId, startDate: lastMonthRange.startDate, endDate: lastMonthRange.endDate }, tx)
  ])

  const netRevenue = periodStats.summary.totalRevenue
  const totalDiscount = periodStats.summary.totalDiscount
  const grossRevenue = Math.round((netRevenue + totalDiscount) * 100) / 100
  const completedOrders = periodStats.summary.completedOrders
  const averageOrderValue = periodStats.summary.averageOrderValue

  const topCourses = byCourse.slice(0, 5)

  return {
    summary: {
      period,
      periodLabel: label,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      netRevenue,
      grossRevenue,
      totalDiscount,
      completedOrders,
      averageOrderValue,
      currency: 'VND'
    },
    kpis: {
      allTimeRevenue: allTimeStats.revenue.totalRevenue,
      todayRevenue: todayStats.summary.totalRevenue,
      thisWeekRevenue: weekStats.summary.totalRevenue,
      thisMonthRevenue: monthStats.summary.totalRevenue,
      lastMonthRevenue: lastMonthStats.summary.totalRevenue
    },
    timeline: periodStats.timeline.map((t) => ({
      date: t.date,
      revenue: t.revenue,
      orderCount: t.orderCount
    })),
    byCourse,
    topCourses
  }
}

/**
 * B. ORDER ANALYTICS
 * Calculates order volumes across COMPLETED, PENDING, and REJECTED statuses,
 * conversion rates, timelines, and sales counts per course.
 */
export async function getOrderAnalyticsService(
  teacherId: string,
  options: DateRangeOptions = {},
  tx?: PrismaTransactionClient
): Promise<TeacherOrderAnalytics> {
  await assertTeacherAuthorization(teacherId, tx)

  const resolvedRange = resolveAnalyticsDateRange(options)
  const { startDate, endDate, period, isMonthly, label } = resolvedRange

  const [orderData, allTimeOverview] = await Promise.all([
    getTeacherOrderAnalyticsData(
      {
        teacherId,
        startDate,
        endDate,
        isMonthly
      },
      tx
    ),
    getTeacherOverviewMetrics(teacherId, tx)
  ])

  return {
    summary: {
      period,
      periodLabel: label,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalOrders: orderData.summary.totalOrders,
      completedOrders: orderData.summary.completedOrders,
      pendingOrders: orderData.summary.pendingOrders,
      rejectedOrders: orderData.summary.rejectedOrders,
      realizedRevenue: orderData.summary.realizedRevenue,
      pendingRevenue: orderData.summary.pendingRevenue,
      conversionRate: orderData.summary.conversionRate
    },
    allTimeTotalOrders: allTimeOverview.revenue.totalOrders,
    timeline: orderData.timeline,
    salesByCourse: orderData.salesByCourse
  }
}

/**
 * C. STUDENT ANALYTICS
 * Calculates all-time unique students, period unique students, first-time new students,
 * total enrollments, and course-level enrollment breakdowns.
 */
export async function getStudentAnalyticsService(
  teacherId: string,
  options: DateRangeOptions = {},
  tx?: PrismaTransactionClient
): Promise<TeacherStudentAnalytics> {
  await assertTeacherAuthorization(teacherId, tx)

  const resolvedRange = resolveAnalyticsDateRange(options)
  const { startDate, endDate, period, label } = resolvedRange

  const studentData = await getTeacherStudentAnalyticsData(
    {
      teacherId,
      startDate,
      endDate
    },
    tx
  )

  return {
    summary: {
      period,
      periodLabel: label,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalUniqueStudentsAllTime: studentData.totalUniqueStudentsAllTime,
      periodUniqueStudents: studentData.periodUniqueStudents,
      newStudents: studentData.newStudents,
      periodEnrollments: studentData.periodEnrollments,
      activeEnrollments: studentData.activeEnrollments,
      completedEnrollments: studentData.completedEnrollments,
      canceledEnrollments: studentData.canceledEnrollments
    },
    timeline: studentData.timeline,
    enrollmentsByCourse: studentData.enrollmentsByCourse
  }
}

/**
 * D. COURSE ANALYTICS
 * Calculates course publication breakdown, total sales and revenue per course,
 * best-selling courses by revenue & volume, and zero-sales courses.
 */
export async function getCourseAnalyticsService(
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<TeacherCourseAnalytics> {
  await assertTeacherAuthorization(teacherId, tx)

  return getTeacherDetailedCourseAnalytics(teacherId, tx)
}

/**
 * EXECUTIVE DASHBOARD SUMMARY
 * High-performance executive overview aggregating all-time, today, weekly, and monthly KPIs
 * in a single unified call for Telegram bot /status or /report commands.
 */
export async function getTeacherDashboardSummaryService(
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<TeacherDashboardSummary> {
  const teacher = await assertTeacherAuthorization(teacherId, tx)

  const todayRange = resolveAnalyticsDateRange({ period: 'today' })
  const weekRange = resolveAnalyticsDateRange({ period: 'this_week' })
  const monthRange = resolveAnalyticsDateRange({ period: 'this_month' })

  const [
    allTimeOverview,
    todayRevenue,
    todayOrders,
    todayStudents,
    weekRevenue,
    weekOrders,
    weekStudents,
    monthRevenue,
    monthOrders,
    monthStudents,
    courseData
  ] = await Promise.all([
    getTeacherOverviewMetrics(teacherId, tx),
    // Today
    getTeacherRevenueStats({ teacherId, startDate: todayRange.startDate, endDate: todayRange.endDate }, tx),
    getTeacherOrderAnalyticsData({ teacherId, startDate: todayRange.startDate, endDate: todayRange.endDate }, tx),
    getTeacherStudentAnalyticsData({ teacherId, startDate: todayRange.startDate, endDate: todayRange.endDate }, tx),
    // Week
    getTeacherRevenueStats({ teacherId, startDate: weekRange.startDate, endDate: weekRange.endDate }, tx),
    getTeacherOrderAnalyticsData({ teacherId, startDate: weekRange.startDate, endDate: weekRange.endDate }, tx),
    getTeacherStudentAnalyticsData({ teacherId, startDate: weekRange.startDate, endDate: weekRange.endDate }, tx),
    // Month
    getTeacherRevenueStats({ teacherId, startDate: monthRange.startDate, endDate: monthRange.endDate }, tx),
    getTeacherOrderAnalyticsData({ teacherId, startDate: monthRange.startDate, endDate: monthRange.endDate }, tx),
    getTeacherStudentAnalyticsData({ teacherId, startDate: monthRange.startDate, endDate: monthRange.endDate }, tx),
    // Course ranking
    getTeacherDetailedCourseAnalytics(teacherId, tx)
  ])

  const topCourseItem = courseData.bestSellingByRevenue
  const topCourse = topCourseItem
    ? {
        id: topCourseItem.id,
        title: topCourseItem.title,
        revenue: topCourseItem.totalRevenue,
        soldCount: topCourseItem.completedOrders
      }
    : null

  return {
    teacher,
    allTime: {
      totalRevenue: allTimeOverview.revenue.totalRevenue,
      totalOrders: allTimeOverview.revenue.totalOrders,
      completedOrders: allTimeOverview.revenue.completedOrders,
      uniqueStudents: allTimeOverview.students.totalStudents,
      totalCourses: allTimeOverview.courses.total,
      averageRating: allTimeOverview.rating.averageRating
    },
    today: {
      revenue: todayRevenue.summary.totalRevenue,
      orders: todayOrders.summary.completedOrders,
      newStudents: todayStudents.newStudents
    },
    thisWeek: {
      revenue: weekRevenue.summary.totalRevenue,
      orders: weekOrders.summary.completedOrders,
      newStudents: weekStudents.newStudents
    },
    thisMonth: {
      revenue: monthRevenue.summary.totalRevenue,
      orders: monthOrders.summary.completedOrders,
      newStudents: monthStudents.newStudents
    },
    topCourse
  }
}

