import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { Prisma } from '@prisma/client'
import { isValidUUID } from '~/utils/uuid'
import {
  DateRangeOptions,
  resolveAnalyticsDateRange,
  getVietnamCalendarDate
} from '~/utils/analyticsDateRange'
import { AnalyticsPeriod, CourseMetric } from '~/models/analyticsIntent.model'
import { calculatePercentageChange } from './analyticsInsight.service'
import { ResolvedCourseEntity } from './courseEntityResolver.service'
import { assertTeacherAuthorization } from './teacherAnalytics.service'

/**
 * TMDEMY — COURSE-SPECIFIC ANALYTICS SERVICE (TG-04D)
 *
 * Implements teacher-scoped, course-specific analytics for TMdemy teachers.
 * Powers:
 * - Specific course revenue, sales, enrollments, and conversion analytics
 * - Course time-period filtering (today, this_month, last_month, custom, all_time)
 * - Period-over-period comparative course performance
 * - Natural-language Telegram bot course inquiries
 *
 * SECURITY INVARIANTS:
 * 1. Strict Ownership: Re-verifies that `c.id = courseId` AND `c.author_id = teacherId`.
 * 2. Multi-Tenant Scoping: Orders and enrollments are queried strictly by verified `courseId`.
 * 3. Realized Revenue: Only `completed` orders are counted towards realized earnings.
 * 4. Zero Timezone Footers: Calculations adhere to Asia/Ho_Chi_Minh internally with zero client-facing timezone footers.
 */

export interface CourseSpecificAnalytics {
  course: ResolvedCourseEntity
  summary: {
    period: AnalyticsPeriod
    periodLabel: string
    startDate: string
    endDate: string
    realizedRevenue: number
    grossRevenue: number
    totalDiscount: number
    pendingRevenue: number
    completedOrders: number
    pendingOrders: number
    rejectedOrders: number
    totalOrders: number
    averageOrderValue: number
    conversionRate: number
    periodEnrollments: number
    totalEnrollments: number
    averageRating: number
  }
  allTime: {
    revenue: number
    completedOrders: number
    totalEnrollments: number
  }
}

export interface CourseComparisonAnalytics {
  course: ResolvedCourseEntity
  metric: CourseMetric
  primaryPeriod: {
    period: AnalyticsPeriod
    label: string
    revenue: number
    completedOrders: number
    enrollments: number
  }
  comparisonPeriod: {
    period: AnalyticsPeriod
    label: string
    revenue: number
    completedOrders: number
    enrollments: number
  }
  calculation: {
    absoluteChange: number
    percentageChange: number | null
    isIncrease: boolean
    isDecrease: boolean
    isFlat: boolean
    isZeroBaseline: boolean
  }
  isPartialMonth: boolean
  partialMonthDisclaimer?: string
}

/**
 * Retrieves course-specific analytics for a given time period.
 */
export async function getCourseSpecificAnalyticsService(
  teacherId: string,
  courseId: string,
  options: DateRangeOptions = {},
  tx?: PrismaTransactionClient
): Promise<CourseSpecificAnalytics> {
  await assertTeacherAuthorization(teacherId, tx)

  if (!courseId || !isValidUUID(courseId)) {
    throw new Error('Mã khóa học không hợp lệ (Invalid UUID).')
  }

  const client = tx ?? prisma

  // 1. Verify course ownership
  const course = await client.course.findFirst({
    where: {
      id: courseId,
      authorId: teacherId,
      isDestroyed: false
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      status: true
    }
  })

  if (!course) {
    throw new Error('Khóa học không tồn tại hoặc không thuộc danh mục giảng dạy của bạn.')
  }

  const courseEntity: ResolvedCourseEntity = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    price: Number(course.price),
    status: course.status
  }

  // 2. Resolve date boundaries
  const resolvedRange = resolveAnalyticsDateRange(options)
  const { startDate, endDate, period, label } = resolvedRange

  // 3. Query orders within period
  const orderRows = await client.$queryRaw<
    Array<{
      completedOrders: number
      pendingOrders: number
      rejectedOrders: number
      realizedRevenue: number
      grossRevenue: number
      totalDiscount: number
      pendingRevenue: number
    }>
  >`
    SELECT 
      COUNT(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN 1 END)::int AS "completedOrders",
      COUNT(CASE WHEN o.status = 'pending'::"EOrderStatus" THEN 1 END)::int AS "pendingOrders",
      COUNT(CASE WHEN o.status = 'rejected'::"EOrderStatus" THEN 1 END)::int AS "rejectedOrders",
      COALESCE(SUM(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN o.total ELSE 0 END), 0)::float AS "realizedRevenue",
      COALESCE(SUM(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN o.amount ELSE 0 END), 0)::float AS "grossRevenue",
      COALESCE(SUM(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN o.discount ELSE 0 END), 0)::float AS "totalDiscount",
      COALESCE(SUM(CASE WHEN o.status = 'pending'::"EOrderStatus" THEN o.total ELSE 0 END), 0)::float AS "pendingRevenue"
    FROM orders o
    WHERE o.course_id = ${courseId}::uuid
      AND o.created_at >= ${startDate}
      AND o.created_at <= ${endDate};
  `

  const orderStats = orderRows[0] || {
    completedOrders: 0,
    pendingOrders: 0,
    rejectedOrders: 0,
    realizedRevenue: 0,
    grossRevenue: 0,
    totalDiscount: 0,
    pendingRevenue: 0
  }

  // 4. Query enrollments within period and all-time
  const enrollmentRows = await client.$queryRaw<
    Array<{
      totalEnrollments: number
      periodEnrollments: number
    }>
  >`
    SELECT 
      COUNT(DISTINCT e.user_id)::int AS "totalEnrollments",
      COUNT(DISTINCT CASE WHEN e.created_at >= ${startDate} AND e.created_at <= ${endDate} THEN e.user_id END)::int AS "periodEnrollments"
    FROM enrollments e
    WHERE e.course_id = ${courseId}::uuid;
  `

  const enrollStats = enrollmentRows[0] || {
    totalEnrollments: 0,
    periodEnrollments: 0
  }

  // 5. Query all-time course revenue & orders
  const allTimeRows = await client.$queryRaw<
    Array<{
      allTimeRevenue: number
      allTimeOrders: number
    }>
  >`
    SELECT 
      COALESCE(SUM(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN o.total ELSE 0 END), 0)::float AS "allTimeRevenue",
      COUNT(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN 1 END)::int AS "allTimeOrders"
    FROM orders o
    WHERE o.course_id = ${courseId}::uuid;
  `

  const allTimeStats = allTimeRows[0] || {
    allTimeRevenue: 0,
    allTimeOrders: 0
  }

  // 6. Query rating
  const ratingRows = await client.$queryRaw<
    Array<{
      averageRating: number
    }>
  >`
    SELECT 
      COALESCE(ROUND(AVG(rate), 2), 0)::float AS "averageRating"
    FROM ratings
    WHERE course_id = ${courseId}::uuid
      AND status = 'active'::"ERatingStatus";
  `
  const averageRating = ratingRows[0]?.averageRating || 0

  const totalOrders =
    orderStats.completedOrders + orderStats.pendingOrders + orderStats.rejectedOrders
  const averageOrderValue =
    orderStats.completedOrders > 0
      ? Math.round(orderStats.realizedRevenue / orderStats.completedOrders)
      : 0
  const conversionRate =
    totalOrders > 0
      ? Math.round((orderStats.completedOrders / totalOrders) * 1000) / 10
      : 0

  return {
    course: courseEntity,
    summary: {
      period,
      periodLabel: label,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      realizedRevenue: orderStats.realizedRevenue,
      grossRevenue: orderStats.grossRevenue,
      totalDiscount: orderStats.totalDiscount,
      pendingRevenue: orderStats.pendingRevenue,
      completedOrders: orderStats.completedOrders,
      pendingOrders: orderStats.pendingOrders,
      rejectedOrders: orderStats.rejectedOrders,
      totalOrders,
      averageOrderValue,
      conversionRate,
      periodEnrollments: enrollStats.periodEnrollments,
      totalEnrollments: enrollStats.totalEnrollments,
      averageRating
    },
    allTime: {
      revenue: allTimeStats.allTimeRevenue,
      completedOrders: allTimeStats.allTimeOrders,
      totalEnrollments: enrollStats.totalEnrollments
    }
  }
}

/**
 * Compares course performance across two distinct time periods.
 */
export async function compareCourseSpecificAnalyticsService(
  teacherId: string,
  courseId: string,
  options: {
    period: AnalyticsPeriod
    comparisonPeriod: AnalyticsPeriod
    metric?: CourseMetric
  },
  tx?: PrismaTransactionClient
): Promise<CourseComparisonAnalytics> {
  const metric = options.metric || 'revenue'

  const [currStats, prevStats] = await Promise.all([
    getCourseSpecificAnalyticsService(teacherId, courseId, { period: options.period }, tx),
    getCourseSpecificAnalyticsService(
      teacherId,
      courseId,
      { period: options.comparisonPeriod },
      tx
    )
  ])

  let currVal = currStats.summary.realizedRevenue
  let prevVal = prevStats.summary.realizedRevenue

  if (metric === 'sales') {
    currVal = currStats.summary.completedOrders
    prevVal = prevStats.summary.completedOrders
  } else if (metric === 'students') {
    currVal = currStats.summary.periodEnrollments
    prevVal = prevStats.summary.periodEnrollments
  }

  const calc = calculatePercentageChange(currVal, prevVal)

  // Partial-month awareness
  let isPartialMonth = false
  let partialMonthDisclaimer: string | undefined

  if (options.period === 'this_month' && options.comparisonPeriod === 'last_month') {
    const vnDate = getVietnamCalendarDate(new Date())
    if (vnDate.day < 28) {
      isPartialMonth = true
      partialMonthDisclaimer = `⚠️ Lưu ý: Tháng này hiện mới ghi nhận dữ liệu đến ngày ${vnDate.day}, so sánh với toàn bộ tháng trước mang tính chất đối chiếu tiến độ.`
    }
  }

  return {
    course: currStats.course,
    metric,
    primaryPeriod: {
      period: options.period,
      label: currStats.summary.periodLabel,
      revenue: currStats.summary.realizedRevenue,
      completedOrders: currStats.summary.completedOrders,
      enrollments: currStats.summary.periodEnrollments
    },
    comparisonPeriod: {
      period: options.comparisonPeriod,
      label: prevStats.summary.periodLabel,
      revenue: prevStats.summary.realizedRevenue,
      completedOrders: prevStats.summary.completedOrders,
      enrollments: prevStats.summary.periodEnrollments
    },
    calculation: {
      absoluteChange: calc.absoluteChange,
      percentageChange: calc.percentageChange,
      isIncrease: calc.absoluteChange > 0,
      isDecrease: calc.absoluteChange < 0,
      isFlat: calc.absoluteChange === 0,
      isZeroBaseline: calc.isZeroBaseline
    },
    isPartialMonth,
    partialMonthDisclaimer
  }
}

