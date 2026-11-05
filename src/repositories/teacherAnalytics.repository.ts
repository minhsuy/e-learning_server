import { CourseStatus, EEnrollmentStatus, EOrderStatus, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  CourseDetailedAnalyticsItem,
  CourseOrderItem,
  CourseRevenueItem,
  CourseStudentItem,
  OrderTimelinePoint,
  RevenueTimelinePointDTO,
  StudentTimelinePoint
} from '~/models/teacherAnalytics.model'

/**
 * TMDEMY — TEACHER ANALYTICS FUNCTIONAL REPOSITORY (TG-03A)
 *
 * Implements targeted, high-performance database aggregations for Teacher Analytics.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton with transaction client propagation (`tx?: PrismaTransactionClient`)
 * - Strict author scoping (`authorId = teacherId`) on all Course and Order queries.
 */

/**
 * Aggregates revenue by course for a specific teacher within a date range.
 */
export const getTeacherRevenueByCourseInDateRange = async (
  params: {
    teacherId: string
    startDate: Date
    endDate: Date
  },
  tx?: PrismaTransactionClient
): Promise<CourseRevenueItem[]> => {
  const client = tx ?? prisma
  const { teacherId, startDate, endDate } = params

  const rows = await client.$queryRaw<
    Array<{
      courseId: string
      title: string
      price: number
      soldCount: number
      revenue: number
    }>
  >`
    SELECT 
      c.id AS "courseId",
      c.title AS "title",
      c.price::float AS "price",
      COUNT(o.id)::int AS "soldCount",
      COALESCE(SUM(o.total), 0)::float AS "revenue"
    FROM courses c
    JOIN orders o ON o.course_id = c.id
    WHERE c.author_id = ${teacherId}::uuid
      AND c.is_destroyed = false
      AND o.status = 'completed'::"EOrderStatus"
      AND o.created_at >= ${startDate}
      AND o.created_at < ${endDate}
    GROUP BY c.id, c.title, c.price
    ORDER BY "revenue" DESC;
  `

  return rows.map((r) => ({
    courseId: r.courseId,
    title: r.title,
    price: Number(r.price || 0),
    soldCount: Number(r.soldCount || 0),
    revenue: Number(r.revenue || 0)
  }))
}

/**
 * Aggregates order analytics across all statuses (COMPLETED, PENDING, REJECTED).
 */
export const getTeacherOrderAnalyticsData = async (
  params: {
    teacherId: string
    startDate: Date
    endDate: Date
    isMonthly?: boolean
  },
  tx?: PrismaTransactionClient
): Promise<{
  summary: {
    totalOrders: number
    completedOrders: number
    pendingOrders: number
    rejectedOrders: number
    realizedRevenue: number
    pendingRevenue: number
    conversionRate: number
  }
  timeline: OrderTimelinePoint[]
  salesByCourse: CourseOrderItem[]
}> => {
  const client = tx ?? prisma
  const { teacherId, startDate, endDate, isMonthly } = params

  // 1. Status count and revenue aggregation in range
  const statusAgg = await client.$queryRaw<
    Array<{
      status: string
      count: number
      totalAmount: number
    }>
  >`
    SELECT 
      o.status::text AS "status",
      COUNT(o.id)::int AS "count",
      COALESCE(SUM(o.total), 0)::float AS "totalAmount"
    FROM orders o
    JOIN courses c ON o.course_id = c.id
    WHERE c.author_id = ${teacherId}::uuid
      AND c.is_destroyed = false
      AND o.created_at >= ${startDate}
      AND o.created_at < ${endDate}
    GROUP BY o.status;
  `

  let completedOrders = 0
  let pendingOrders = 0
  let rejectedOrders = 0
  let realizedRevenue = 0
  let pendingRevenue = 0

  for (const row of statusAgg) {
    const s = row.status.toLowerCase()
    if (s === 'completed') {
      completedOrders = row.count
      realizedRevenue = Number(row.totalAmount || 0)
    } else if (s === 'pending') {
      pendingOrders = row.count
      pendingRevenue = Number(row.totalAmount || 0)
    } else if (s === 'rejected') {
      rejectedOrders = row.count
    }
  }

  const totalOrders = completedOrders + pendingOrders + rejectedOrders
  const conversionRate =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 10000) / 100 : 0

  // 2. Timeline aggregation
  const truncDateSql = isMonthly
    ? Prisma.sql`DATE_TRUNC('month', o.created_at)`
    : Prisma.sql`DATE_TRUNC('day', o.created_at)`
  const dateFormat = isMonthly ? 'YYYY-MM' : 'YYYY-MM-DD'

  const timelineRaw = await client.$queryRaw<
    Array<{
      date: string
      totalOrders: number
      completed: number
      pending: number
      rejected: number
    }>
  >`
    SELECT 
      TO_CHAR(${truncDateSql}, ${dateFormat}) AS "date",
      COUNT(o.id)::int AS "totalOrders",
      COUNT(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN 1 END)::int AS "completed",
      COUNT(CASE WHEN o.status = 'pending'::"EOrderStatus" THEN 1 END)::int AS "pending",
      COUNT(CASE WHEN o.status = 'rejected'::"EOrderStatus" THEN 1 END)::int AS "rejected"
    FROM orders o
    JOIN courses c ON o.course_id = c.id
    WHERE c.author_id = ${teacherId}::uuid
      AND c.is_destroyed = false
      AND o.created_at >= ${startDate}
      AND o.created_at < ${endDate}
    GROUP BY 1
    ORDER BY 1 ASC;
  `

  const timeline: OrderTimelinePoint[] = timelineRaw.map((r) => ({
    date: r.date,
    totalOrders: Number(r.totalOrders || 0),
    completed: Number(r.completed || 0),
    pending: Number(r.pending || 0),
    rejected: Number(r.rejected || 0)
  }))

  // 3. Sales per course
  const courseSalesRaw = await client.$queryRaw<
    Array<{
      courseId: string
      title: string
      totalOrders: number
      completedOrders: number
      pendingOrders: number
      rejectedOrders: number
      realizedRevenue: number
    }>
  >`
    SELECT 
      c.id AS "courseId",
      c.title AS "title",
      COUNT(o.id)::int AS "totalOrders",
      COUNT(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN 1 END)::int AS "completedOrders",
      COUNT(CASE WHEN o.status = 'pending'::"EOrderStatus" THEN 1 END)::int AS "pendingOrders",
      COUNT(CASE WHEN o.status = 'rejected'::"EOrderStatus" THEN 1 END)::int AS "rejectedOrders",
      COALESCE(SUM(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN o.total ELSE 0 END), 0)::float AS "realizedRevenue"
    FROM courses c
    LEFT JOIN orders o ON o.course_id = c.id AND o.created_at >= ${startDate} AND o.created_at < ${endDate}
    WHERE c.author_id = ${teacherId}::uuid
      AND c.is_destroyed = false
    GROUP BY c.id, c.title
    ORDER BY "completedOrders" DESC, "realizedRevenue" DESC;
  `

  const salesByCourse: CourseOrderItem[] = courseSalesRaw.map((r) => ({
    courseId: r.courseId,
    title: r.title,
    totalOrders: Number(r.totalOrders || 0),
    completedOrders: Number(r.completedOrders || 0),
    pendingOrders: Number(r.pendingOrders || 0),
    rejectedOrders: Number(r.rejectedOrders || 0),
    realizedRevenue: Number(r.realizedRevenue || 0)
  }))

  return {
    summary: {
      totalOrders,
      completedOrders,
      pendingOrders,
      rejectedOrders,
      realizedRevenue,
      pendingRevenue,
      conversionRate
    },
    timeline,
    salesByCourse
  }
}

/**
 * Calculates student metrics including distinct all-time students, period unique students,
 * and first-time new students for this teacher.
 */
export const getTeacherStudentAnalyticsData = async (
  params: {
    teacherId: string
    startDate: Date
    endDate: Date
  },
  tx?: PrismaTransactionClient
): Promise<{
  totalUniqueStudentsAllTime: number
  periodUniqueStudents: number
  newStudents: number
  periodEnrollments: number
  activeEnrollments: number
  completedEnrollments: number
  canceledEnrollments: number
  timeline: StudentTimelinePoint[]
  enrollmentsByCourse: CourseStudentItem[]
}> => {
  const client = tx ?? prisma
  const { teacherId, startDate, endDate } = params

  const [
    allTimeUniqueGroup,
    periodUniqueGroup,
    newStudentsRaw,
    statusCountsRaw,
    timelineRaw,
    courseEnrollmentsRaw
  ] = await Promise.all([
    // 1. All-time unique students
    client.enrollment.groupBy({
      by: ['userId'],
      where: {
        course: {
          authorId: teacherId,
          isDestroyed: false
        }
      }
    }),

    // 2. Period unique students
    client.enrollment.groupBy({
      by: ['userId'],
      where: {
        course: {
          authorId: teacherId,
          isDestroyed: false
        },
        enrolledAt: {
          gte: startDate,
          lt: endDate
        }
      }
    }),

    // 3. First-time new students of this teacher in range
    client.$queryRaw<Array<{ newStudents: number }>>`
      SELECT COUNT(*)::int AS "newStudents"
      FROM (
        SELECT e.user_id
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE c.author_id = ${teacherId}::uuid
          AND c.is_destroyed = false
        GROUP BY e.user_id
        HAVING MIN(e.enrolled_at) >= ${startDate} AND MIN(e.enrolled_at) < ${endDate}
      ) t;
    `,

    // 4. Enrollments status counts in range
    client.$queryRaw<Array<{ status: string; count: number }>>`
      SELECT 
        e.status::text AS "status",
        COUNT(e.id)::int AS "count"
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.author_id = ${teacherId}::uuid
        AND c.is_destroyed = false
        AND e.enrolled_at >= ${startDate}
        AND e.enrolled_at < ${endDate}
      GROUP BY e.status;
    `,

    // 5. Timeline of daily enrollments
    client.$queryRaw<Array<{ date: string; enrollmentsCount: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('day', e.enrolled_at), 'YYYY-MM-DD') AS "date",
        COUNT(e.id)::int AS "enrollmentsCount"
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.author_id = ${teacherId}::uuid
        AND c.is_destroyed = false
        AND e.enrolled_at >= ${startDate}
        AND e.enrolled_at < ${endDate}
      GROUP BY 1
      ORDER BY 1 ASC;
    `,

    // 6. Course-level enrollment breakdown
    client.$queryRaw<
      Array<{
        courseId: string
        title: string
        totalEnrollments: number
        activeCount: number
        completedCount: number
        canceledCount: number
      }>
    >`
      SELECT 
        c.id AS "courseId",
        c.title AS "title",
        COUNT(e.id)::int AS "totalEnrollments",
        COUNT(CASE WHEN e.status = 'active'::"EEnrollmentStatus" THEN 1 END)::int AS "activeCount",
        COUNT(CASE WHEN e.status = 'completed'::"EEnrollmentStatus" THEN 1 END)::int AS "completedCount",
        COUNT(CASE WHEN e.status = 'canceled'::"EEnrollmentStatus" THEN 1 END)::int AS "canceledCount"
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.enrolled_at >= ${startDate} AND e.enrolled_at < ${endDate}
      WHERE c.author_id = ${teacherId}::uuid
        AND c.is_destroyed = false
      GROUP BY c.id, c.title
      ORDER BY "totalEnrollments" DESC;
    `
  ])

  let activeEnrollments = 0
  let completedEnrollments = 0
  let canceledEnrollments = 0

  for (const s of statusCountsRaw) {
    const st = s.status.toLowerCase()
    if (st === 'active') activeEnrollments = s.count
    else if (st === 'completed') completedEnrollments = s.count
    else if (st === 'canceled') canceledEnrollments = s.count
  }

  const periodEnrollments = activeEnrollments + completedEnrollments + canceledEnrollments
  const totalUniqueStudentsAllTime = allTimeUniqueGroup.length
  const periodUniqueStudents = periodUniqueGroup.length
  const newStudents = Number(newStudentsRaw[0]?.newStudents || 0)

  const timeline: StudentTimelinePoint[] = timelineRaw.map((r) => ({
    date: r.date,
    enrollmentsCount: Number(r.enrollmentsCount || 0)
  }))

  const enrollmentsByCourse: CourseStudentItem[] = courseEnrollmentsRaw.map((r) => ({
    courseId: r.courseId,
    title: r.title,
    totalEnrollments: Number(r.totalEnrollments || 0),
    activeCount: Number(r.activeCount || 0),
    completedCount: Number(r.completedCount || 0),
    canceledCount: Number(r.canceledCount || 0)
  }))

  return {
    totalUniqueStudentsAllTime,
    periodUniqueStudents,
    newStudents,
    periodEnrollments,
    activeEnrollments,
    completedEnrollments,
    canceledEnrollments,
    timeline,
    enrollmentsByCourse
  }
}

/**
 * Fetches all courses owned by a teacher with revenue, sales, student counts, and zero-sales metrics.
 */
export const getTeacherDetailedCourseAnalytics = async (
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<{
  summary: {
    totalCourses: number
    approvedCourses: number
    pendingCourses: number
    rejectedCourses: number
    coursesWithSalesCount: number
    zeroSalesCoursesCount: number
  }
  courses: CourseDetailedAnalyticsItem[]
  bestSellingByRevenue: CourseDetailedAnalyticsItem | null
  bestSellingByVolume: CourseDetailedAnalyticsItem | null
  zeroSalesCourses: CourseDetailedAnalyticsItem[]
}> => {
  const client = tx ?? prisma

  const rows = await client.$queryRaw<
    Array<{
      id: string
      title: string
      slug: string
      price: number
      status: string
      totalRevenue: number
      completedOrders: number
      totalStudents: number
      averageRating: number
    }>
  >`
    SELECT 
      c.id,
      c.title,
      c.slug,
      c.price::float AS "price",
      c.status::text AS "status",
      COALESCE(SUM(CASE WHEN o.status = 'completed'::"EOrderStatus" THEN o.total ELSE 0 END), 0)::float AS "totalRevenue",
      COUNT(DISTINCT CASE WHEN o.status = 'completed'::"EOrderStatus" THEN o.id END)::int AS "completedOrders",
      COUNT(DISTINCT e.user_id)::int AS "totalStudents",
      COALESCE(r.avg_rating, 0)::float AS "averageRating"
    FROM courses c
    LEFT JOIN orders o ON o.course_id = c.id
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN (
      SELECT 
        course_id,
        ROUND(AVG(rate), 2) AS avg_rating
      FROM ratings
      WHERE status = 'active'::"ERatingStatus"
      GROUP BY course_id
    ) r ON r.course_id = c.id
    WHERE c.author_id = ${teacherId}::uuid
      AND c.is_destroyed = false
    GROUP BY c.id, c.title, c.slug, c.price, c.status, r.avg_rating
    ORDER BY "totalRevenue" DESC, "completedOrders" DESC;
  `

  let approvedCourses = 0
  let pendingCourses = 0
  let rejectedCourses = 0
  let coursesWithSalesCount = 0
  let zeroSalesCoursesCount = 0

  const courses: CourseDetailedAnalyticsItem[] = rows.map((r) => {
    const st = r.status.toUpperCase()
    if (st === 'APPROVED') approvedCourses++
    else if (st === 'PENDING') pendingCourses++
    else if (st === 'REJECTED') rejectedCourses++

    const completedOrders = Number(r.completedOrders || 0)
    const hasSales = completedOrders > 0
    if (hasSales) coursesWithSalesCount++
    else zeroSalesCoursesCount++

    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      price: Number(r.price || 0),
      status: r.status,
      totalRevenue: Number(r.totalRevenue || 0),
      completedOrders,
      totalStudents: Number(r.totalStudents || 0),
      averageRating: Math.round(Number(r.averageRating || 0) * 100) / 100,
      hasSales
    }
  })

  const totalCourses = courses.length
  const zeroSalesCourses = courses.filter((c) => !c.hasSales)

  // Sort for best-selling by revenue and volume
  const sortedByRevenue = [...courses].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const sortedByVolume = [...courses].sort((a, b) => b.completedOrders - a.completedOrders)

  const bestSellingByRevenue = sortedByRevenue[0]?.hasSales ? sortedByRevenue[0] : null
  const bestSellingByVolume = sortedByVolume[0]?.hasSales ? sortedByVolume[0] : null

  return {
    summary: {
      totalCourses,
      approvedCourses,
      pendingCourses,
      rejectedCourses,
      coursesWithSalesCount,
      zeroSalesCoursesCount
    },
    courses,
    bestSellingByRevenue,
    bestSellingByVolume,
    zeroSalesCourses
  }
}
