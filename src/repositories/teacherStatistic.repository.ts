import { CourseStatus, EEnrollmentStatus, EOrderStatus, ERatingStatus, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: TEACHER STATISTICS
 *
 * Implements high-performance database aggregations for Teacher Dashboard.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

export interface TeacherOverviewMetrics {
  courses: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
  students: {
    totalStudents: number
    totalEnrollments: number
    activeStudents: number
    completedStudents: number
  }
  revenue: {
    totalRevenue: number
    totalOrders: number
    completedOrders: number
    averageOrderValue: number
    currency: string
  }
  rating: {
    averageRating: number
    totalReviews: number
  }
  engagement: {
    averageRating: number
    totalReviews: number
    certificatesIssued: number
  }
}

export interface RevenueTimelinePoint {
  date: string
  revenue: number
  orderCount: number
  ordersCount: number
}

export interface TeacherRevenueStats {
  summary: {
    totalRevenue: number
    totalOrders: number
    completedOrders: number
    totalDiscount: number
    averageOrderValue: number
    currency: string
  }
  timeline: RevenueTimelinePoint[]
}

export interface CourseStatItem {
  id: string
  _id: string
  title: string
  slug: string
  image: string
  price: number
  status: string
  view: number
  sold: number
  totalStudents: number
  totalRevenue: number
  completedOrders: number
  averageRating: number
  totalReviews: number
  averageProgress: number
  completionRate: number
  createdAt: Date
  stats: {
    totalStudents: number
    totalRevenue: number
    completedOrders: number
    averageRating: number
    totalReviews: number
    averageProgress: number
    completionRate: number
  }
}

export interface TeacherCoursesStatsResult {
  courses: CourseStatItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface EnrollmentTimelinePoint {
  date: string
  count: number
  enrollmentsCount: number
}

export interface RecentEnrollmentItem {
  id: string
  enrolledAt: Date
  progress: number
  status: string
  course: {
    id: string
    title: string
  }
  student: {
    id: string
    username: string
    avatar: string
  }
}

export interface TeacherEnrollmentStats {
  summary: {
    totalEnrollments: number
    activeCount: number
    completedCount: number
    canceledCount: number
  }
  statusSummary: {
    active: number
    completed: number
    canceled: number
    total: number
  }
  timeline: EnrollmentTimelinePoint[]
  recentEnrollments: RecentEnrollmentItem[]
}

export interface CoursePerformanceData {
  course: {
    id: string
    _id: string
    title: string
    slug: string
    image: string
    price: number
    oldPrice: number
    status: string
    level: string
    type: string
    view: number
    sold: number
    rawSold?: number
    authorId: string
    isDestroyed: boolean
    createdAt: Date
    updatedAt: Date
    category: {
      id: string
      _id?: string
      name: string
      slug: string
    } | null
  }
  overview: {
    revenue: {
      totalRevenue: number
      completedOrders: number
      totalDiscount: number
      averageOrderValue: number
      currency: string
    }
    students: {
      totalStudents: number
      activeStudents: number
      completedStudents: number
      canceledStudents: number
      completionRate: number
      averageProgress: number
    }
    engagement: {
      averageRating: number
      totalReviews: number
      ratingDistribution: {
        '1': number
        '2': number
        '3': number
        '4': number
        '5': number
      }
      certificatesIssued: number
      certificateRate: number
      averageCertificateGrade: number
    }
  }
  curriculum: {
    totalChapters: number
    totalLessons: number
    totalDuration: number
  }
  quizzes: {
    summary: {
      totalQuizzes: number
      totalSubmissions: number
      averageScore: number
      passRate: number
    }
    items: Array<{
      quizId: string
      title: string
      lessonId: string
      lessonTitle: string
      passingGrade: number
      totalQuestions: number
      submissionsCount: number
      averageScore: number
      passCount: number
      passRate: number
    }>
  }
  lessonsFunnel: Array<{
    lessonId: string
    lessonTitle: string
    order: number
    duration: number
    type: string
    isDemo: boolean
    chapter: {
      id: string
      title: string
      order: number
    }
    hasQuiz: boolean
    completedStudents: number
    completionRate: number
    dropOffFromPrevious: number
  }>
}

export interface TeacherLearningStats {
  totalStudents: number
  averageProgress: number
  completedStudents: number
  completionRate: number
  certificatesIssued: number
  certificateRate: number
  progressOverview: {
    averageProgress: number
    completionRate: number
    totalCertificatesIssued: number
  }
  quizAssessment: {
    totalQuizzes: number
    totalSubmissions: number
    averageScorePercentage: number
    passRate: number
  }
}

/**
 * 1. Overview metrics for Teacher Dashboard
 */
export const getTeacherOverviewMetrics = async (
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<TeacherOverviewMetrics> => {
  const client = tx ?? prisma

  const [
    totalCourses,
    approvedCourses,
    pendingCourses,
    rejectedCourses,
    totalEnrollments,
    studentsGroup,
    activeStudents,
    completedStudents,
    revenueAgg,
    ratingAgg,
    certificatesIssued
  ] = await Promise.all([
    client.course.count({
      where: { authorId: teacherId, isDestroyed: false }
    }),
    client.course.count({
      where: { authorId: teacherId, status: CourseStatus.APPROVED, isDestroyed: false }
    }),
    client.course.count({
      where: { authorId: teacherId, status: CourseStatus.PENDING, isDestroyed: false }
    }),
    client.course.count({
      where: { authorId: teacherId, status: CourseStatus.REJECTED, isDestroyed: false }
    }),
    client.enrollment.count({
      where: { course: { authorId: teacherId, isDestroyed: false } }
    }),
    client.enrollment.groupBy({
      by: ['userId'],
      where: { course: { authorId: teacherId, isDestroyed: false } }
    }),
    client.enrollment.count({
      where: { course: { authorId: teacherId, isDestroyed: false }, status: EEnrollmentStatus.ACTIVE }
    }),
    client.enrollment.count({
      where: { course: { authorId: teacherId, isDestroyed: false }, status: EEnrollmentStatus.COMPLETED }
    }),
    client.order.aggregate({
      where: {
        course: { authorId: teacherId, isDestroyed: false },
        status: EOrderStatus.COMPLETED
      },
      _sum: { total: true },
      _count: { id: true }
    }),
    client.rating.aggregate({
      where: {
        course: { authorId: teacherId, isDestroyed: false },
        status: ERatingStatus.ACTIVE
      },
      _avg: { rate: true },
      _count: { id: true }
    }),
    client.certificate.count({
      where: { course: { authorId: teacherId, isDestroyed: false } }
    })
  ])

  const totalRevenue = Number(revenueAgg._sum.total || 0)
  const completedOrders = revenueAgg._count.id || 0
  const totalOrders = completedOrders
  const averageOrderValue =
    completedOrders > 0 ? Math.round((totalRevenue / completedOrders) * 100) / 100 : 0
  const averageRating =
    ratingAgg._avg.rate !== null ? Math.round(Number(ratingAgg._avg.rate) * 100) / 100 : 0
  const totalReviews = ratingAgg._count.id || 0
  const totalStudents = studentsGroup.length

  return {
    courses: {
      total: totalCourses,
      approved: approvedCourses,
      pending: pendingCourses,
      rejected: rejectedCourses
    },
    students: {
      totalStudents,
      totalEnrollments,
      activeStudents,
      completedStudents
    },
    revenue: {
      totalRevenue,
      totalOrders,
      completedOrders,
      averageOrderValue,
      currency: 'VND'
    },
    rating: {
      averageRating,
      totalReviews
    },
    engagement: {
      averageRating,
      totalReviews,
      certificatesIssued
    }
  }
}

/**
 * 2. Revenue statistics with timeline and summary
 */
export const getTeacherRevenueStats = async (
  params: {
    teacherId: string
    startDate: Date
    endDate: Date
    courseId?: string
    isMonthly?: boolean
  },
  tx?: PrismaTransactionClient
): Promise<TeacherRevenueStats> => {
  const client = tx ?? prisma
  const { teacherId, startDate, endDate, courseId, isMonthly } = params

  // Summary aggregation
  const summaryAgg = await client.order.aggregate({
    where: {
      course: {
        authorId: teacherId,
        isDestroyed: false,
        ...(courseId ? { id: courseId } : {})
      },
      status: EOrderStatus.COMPLETED,
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    },
    _sum: {
      total: true,
      discount: true
    },
    _count: {
      id: true
    }
  })

  const totalRevenue = Number(summaryAgg._sum.total || 0)
  const totalDiscount = Number(summaryAgg._sum.discount || 0)
  const totalOrders = summaryAgg._count.id || 0
  const completedOrders = totalOrders
  const averageOrderValue =
    totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0

  // Timeline aggregation using safe parameterized SQL
  const truncDateSql = isMonthly
    ? Prisma.sql`DATE_TRUNC('month', o.created_at)`
    : Prisma.sql`DATE_TRUNC('day', o.created_at)`
  const dateFormat = isMonthly ? 'YYYY-MM' : 'YYYY-MM-DD'

  const courseFilter = courseId
    ? Prisma.sql`AND c.id = ${courseId}::uuid`
    : Prisma.empty

  const timelineRaw = await client.$queryRaw<Array<{ date: string; revenue: number; orderCount: number }>>`
    SELECT 
      TO_CHAR(${truncDateSql}, ${dateFormat}) AS "date",
      COALESCE(SUM(o.total), 0)::float AS "revenue",
      COUNT(o.id)::int AS "orderCount"
    FROM orders o
    JOIN courses c ON o.course_id = c.id
    WHERE c.author_id = ${teacherId}::uuid
      AND c.is_destroyed = false
      ${courseFilter}
      AND o.status = 'completed'::"EOrderStatus"
      AND o.created_at >= ${startDate}
      AND o.created_at < ${endDate}
    GROUP BY 1
    ORDER BY 1 ASC;
  `

  const timeline: RevenueTimelinePoint[] = timelineRaw.map((row) => ({
    date: row.date,
    revenue: Number(row.revenue || 0),
    orderCount: Number(row.orderCount || 0),
    ordersCount: Number(row.orderCount || 0)
  }))

  return {
    summary: {
      totalRevenue,
      totalOrders,
      completedOrders,
      totalDiscount,
      averageOrderValue,
      currency: 'VND'
    },
    timeline
  }
}

/**
 * 3. Course statistics breakdown per course
 */
export const getTeacherCoursesStats = async (
  params: {
    teacherId: string
    page: number
    limit: number
    sortBy: string
    order: 'asc' | 'desc'
    status?: CourseStatus
  },
  tx?: PrismaTransactionClient
): Promise<TeacherCoursesStatsResult> => {
  const client = tx ?? prisma
  const { teacherId, page, limit, sortBy, order, status } = params
  const offset = (page - 1) * limit

  const isAsc = order.toLowerCase() === 'asc'
  let orderBySql: Prisma.Sql
  switch (sortBy) {
    case 'revenue':
      orderBySql = isAsc ? Prisma.sql`"totalRevenue" ASC` : Prisma.sql`"totalRevenue" DESC`
      break
    case 'students':
      orderBySql = isAsc ? Prisma.sql`"totalStudents" ASC` : Prisma.sql`"totalStudents" DESC`
      break
    case 'rating':
      orderBySql = isAsc ? Prisma.sql`"averageRating" ASC` : Prisma.sql`"averageRating" DESC`
      break
    case 'createdAt':
    default:
      orderBySql = isAsc ? Prisma.sql`c.created_at ASC` : Prisma.sql`c.created_at DESC`
      break
  }

  const statusSql = status
    ? Prisma.sql`AND c.status = ${status}::"CourseStatus"`
    : Prisma.empty

  // Total count for pagination
  const total = await client.course.count({
    where: {
      authorId: teacherId,
      isDestroyed: false,
      ...(status ? { status } : {})
    }
  })

  const totalPages = Math.ceil(total / limit) || 1

  // Optimized single-pass aggregation query
  const rawCourses = await client.$queryRaw<
    Array<{
      id: string
      title: string
      slug: string
      image: string
      price: number
      status: string
      view: number
      createdAt: Date
      totalStudents: number
      totalRevenue: number
      completedOrders: number
      averageRating: number
      totalReviews: number
      averageProgress: number
      completionRate: number
    }>
  >`
    SELECT 
      c.id,
      c.title,
      c.slug,
      c.image,
      c.price::float AS "price",
      c.status::text AS "status",
      c.view::int AS "view",
      c.created_at AS "createdAt",
      COALESCE(e_agg.total_students, 0)::int AS "totalStudents",
      COALESCE(o_agg.total_revenue, 0)::float AS "totalRevenue",
      COALESCE(o_agg.completed_orders, 0)::int AS "completedOrders",
      COALESCE(r_agg.avg_rating, 0)::float AS "averageRating",
      COALESCE(r_agg.total_reviews, 0)::int AS "totalReviews",
      COALESCE(e_agg.avg_progress, 0)::float AS "averageProgress",
      CASE 
        WHEN COALESCE(e_agg.total_students, 0) = 0 THEN 0::float
        ELSE ROUND((COALESCE(e_agg.completed_students, 0)::numeric / e_agg.total_students::numeric) * 100, 2)::float
      END AS "completionRate"
    FROM courses c
    LEFT JOIN (
      SELECT 
        course_id,
        COUNT(id) AS total_students,
        COUNT(CASE WHEN status = 'completed'::"EEnrollmentStatus" OR progress = 100 THEN 1 END) AS completed_students,
        ROUND(AVG(progress), 2) AS avg_progress
      FROM enrollments
      GROUP BY course_id
    ) e_agg ON c.id = e_agg.course_id
    LEFT JOIN (
      SELECT 
        course_id,
        SUM(total) AS total_revenue,
        COUNT(id) AS completed_orders
      FROM orders
      WHERE status = 'completed'::"EOrderStatus"
      GROUP BY course_id
    ) o_agg ON c.id = o_agg.course_id
    LEFT JOIN (
      SELECT 
        course_id,
        ROUND(AVG(rate), 2) AS avg_rating,
        COUNT(id) AS total_reviews
      FROM ratings
      WHERE status = 'active'::"ERatingStatus"
      GROUP BY course_id
    ) r_agg ON c.id = r_agg.course_id
    WHERE c.author_id = ${teacherId}::uuid
      AND c.is_destroyed = false
      ${statusSql}
    ORDER BY ${orderBySql}
    LIMIT ${limit} OFFSET ${offset};
  `

  const courses: CourseStatItem[] = rawCourses.map((c) => {
    const totalStudents = Number(c.totalStudents || 0)
    const totalRevenue = Number(c.totalRevenue || 0)
    const completedOrders = Number(c.completedOrders || 0)
    const averageRating = Number(c.averageRating || 0)
    const totalReviews = Number(c.totalReviews || 0)
    const averageProgress = Number(c.averageProgress || 0)
    const completionRate = Number(c.completionRate || 0)
    const view = Number(c.view || 0)

    return {
      id: c.id,
      _id: c.id,
      title: c.title,
      slug: c.slug,
      image: c.image || '',
      price: Number(c.price || 0),
      status: c.status,
      view,
      sold: totalStudents,
      totalStudents,
      totalRevenue,
      completedOrders,
      averageRating,
      totalReviews,
      averageProgress,
      completionRate,
      createdAt: c.createdAt,
      stats: {
        totalStudents,
        totalRevenue,
        completedOrders,
        averageRating,
        totalReviews,
        averageProgress,
        completionRate
      }
    }
  })

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  }
}

/**
 * 4. Enrollment statistics with status summary, timeline, and recent enrollments
 */
export const getTeacherEnrollmentStats = async (
  params: {
    teacherId: string
    startDate: Date
    endDate: Date
    courseId?: string
    isMonthly?: boolean
  },
  tx?: PrismaTransactionClient
): Promise<TeacherEnrollmentStats> => {
  const client = tx ?? prisma
  const { teacherId, startDate, endDate, courseId, isMonthly } = params

  const courseWhere = {
    authorId: teacherId,
    isDestroyed: false,
    ...(courseId ? { id: courseId } : {})
  }

  // Status summary counts
  const [active, completed, canceled] = await Promise.all([
    client.enrollment.count({
      where: {
        course: courseWhere,
        status: EEnrollmentStatus.ACTIVE
      }
    }),
    client.enrollment.count({
      where: {
        course: courseWhere,
        status: EEnrollmentStatus.COMPLETED
      }
    }),
    client.enrollment.count({
      where: {
        course: courseWhere,
        status: EEnrollmentStatus.CANCELED
      }
    })
  ])

  const total = active + completed + canceled

  // Timeline
  const truncDateSql = isMonthly
    ? Prisma.sql`DATE_TRUNC('month', e.enrolled_at)`
    : Prisma.sql`DATE_TRUNC('day', e.enrolled_at)`
  const dateFormat = isMonthly ? 'YYYY-MM' : 'YYYY-MM-DD'
  const courseFilter = courseId
    ? Prisma.sql`AND c.id = ${courseId}::uuid`
    : Prisma.empty

  const timelineRaw = await client.$queryRaw<Array<{ date: string; enrollmentsCount: number }>>`
    SELECT 
      TO_CHAR(${truncDateSql}, ${dateFormat}) AS "date",
      COUNT(e.id)::int AS "enrollmentsCount"
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE c.author_id = ${teacherId}::uuid
      ${courseFilter}
      AND e.enrolled_at >= ${startDate}
      AND e.enrolled_at < ${endDate}
    GROUP BY 1
    ORDER BY 1 ASC;
  `

  const timeline: EnrollmentTimelinePoint[] = timelineRaw.map((row) => {
    const enrollmentsCount = Number(row.enrollmentsCount || 0)
    return {
      date: row.date,
      count: enrollmentsCount,
      enrollmentsCount
    }
  })

  // Recent enrollments (safe fields: NO password, NO token)
  const recentRaw = await client.enrollment.findMany({
    where: {
      course: courseWhere
    },
    orderBy: { enrolledAt: 'desc' },
    take: 10,
    select: {
      id: true,
      enrolledAt: true,
      progress: true,
      status: true,
      course: {
        select: {
          id: true,
          title: true
        }
      },
      user: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    }
  })

  const recentEnrollments: RecentEnrollmentItem[] = recentRaw.map((r) => ({
    id: r.id,
    enrolledAt: r.enrolledAt,
    progress: r.progress,
    status: r.status,
    course: {
      id: r.course.id,
      title: r.course.title
    },
    student: {
      id: r.user.id,
      username: r.user.username,
      avatar: r.user.avatar || ''
    }
  }))

  return {
    summary: {
      totalEnrollments: total,
      activeCount: active,
      completedCount: completed,
      canceledCount: canceled
    },
    statusSummary: {
      active,
      completed,
      canceled,
      total
    },
    timeline,
    recentEnrollments
  }
}

/**
 * 5. Learning & Assessment statistics (Progress & Quizzes)
 */
export const getTeacherLearningStats = async (
  params: {
    teacherId: string
    courseId?: string
  },
  tx?: PrismaTransactionClient
): Promise<TeacherLearningStats> => {
  const client = tx ?? prisma
  const { teacherId, courseId } = params

  const courseWhere = {
    authorId: teacherId,
    isDestroyed: false,
    ...(courseId ? { id: courseId } : {})
  }

  const [progressAgg, totalEnrollments, completedEnrollments, totalCertificatesIssued, totalQuizzes] =
    await Promise.all([
      client.enrollment.aggregate({
        where: { course: courseWhere },
        _avg: { progress: true }
      }),
      client.enrollment.count({
        where: { course: courseWhere }
      }),
      client.enrollment.count({
        where: { course: courseWhere, status: EEnrollmentStatus.COMPLETED }
      }),
      client.certificate.count({
        where: { course: { authorId: teacherId, ...(courseId ? { id: courseId } : {}) } }
      }),
      client.quiz.count({
        where: { course: { authorId: teacherId, ...(courseId ? { id: courseId } : {}) } }
      })
    ])

  const averageProgress =
    progressAgg._avg.progress !== null ? Math.round(Number(progressAgg._avg.progress) * 100) / 100 : 0
  const completionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 10000) / 100
      : 0

  // Quiz submissions and pass rate aggregation
  const courseFilter = courseId
    ? Prisma.sql`AND c.id = ${courseId}::uuid`
    : Prisma.empty

  const quizAgg = await client.$queryRaw<
    Array<{
      totalSubmissions: number
      avgScore: number
      passedSubmissions: number
    }>
  >`
    SELECT 
      COUNT(qs.id)::int AS "totalSubmissions",
      COALESCE(ROUND(AVG(qs.percentage), 2), 0)::float AS "avgScore",
      COUNT(CASE WHEN qs.percentage >= q.passing_grade THEN 1 END)::int AS "passedSubmissions"
    FROM quiz_submissions qs
    JOIN quizzes q ON qs.quiz_id = q.id
    JOIN courses c ON q.course_id = c.id
    WHERE c.author_id = ${teacherId}::uuid
      ${courseFilter};
  `

  const quizRow = quizAgg[0]
  const totalSubmissions = Number(quizRow?.totalSubmissions || 0)
  const averageScorePercentage = totalSubmissions > 0 ? Number(quizRow?.avgScore || 0) : 0
  const passRate =
    totalSubmissions > 0
      ? Math.round((Number(quizRow?.passedSubmissions || 0) / totalSubmissions) * 10000) / 100
      : 0

  const certificateRate =
    totalEnrollments > 0
      ? Math.round((totalCertificatesIssued / totalEnrollments) * 10000) / 100
      : 0

  return {
    totalStudents: totalEnrollments,
    averageProgress,
    completedStudents: completedEnrollments,
    completionRate,
    certificatesIssued: totalCertificatesIssued,
    certificateRate,
    progressOverview: {
      averageProgress,
      completionRate,
      totalCertificatesIssued
    },
    quizAssessment: {
      totalQuizzes,
      totalSubmissions,
      averageScorePercentage,
      passRate
    }
  }
}

/**
 * 6. Course Performance Snapshot (Detailed Analytics for a Single Course)
 */
export const getCoursePerformanceStats = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<CoursePerformanceData | null> => {
  const client = tx ?? prisma

  // 1. Fetch course details
  const course = await client.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      image: true,
      price: true,
      oldPrice: true,
      status: true,
      level: true,
      type: true,
      view: true,
      sold: true,
      authorId: true,
      isDestroyed: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  if (!course || course.isDestroyed) {
    return null
  }

  // 2. Parallel data fetching
  const [
    orderAgg,
    [totalStudents, activeStudents, completedStudents, canceledStudents, progressAgg],
    [ratingAgg, ratingDistRaw],
    [certificatesIssued, certGradeAgg],
    totalChapters,
    lessons,
    progressGroup,
    quizzes,
    quizSubsRaw
  ] = await Promise.all([
    // Group A: Orders / Revenue
    client.order.aggregate({
      where: { courseId, status: EOrderStatus.COMPLETED },
      _sum: { total: true, discount: true },
      _count: { id: true }
    }),
    // Group B: Enrollments
    Promise.all([
      client.enrollment.count({ where: { courseId } }),
      client.enrollment.count({ where: { courseId, status: EEnrollmentStatus.ACTIVE } }),
      client.enrollment.count({ where: { courseId, status: EEnrollmentStatus.COMPLETED } }),
      client.enrollment.count({ where: { courseId, status: EEnrollmentStatus.CANCELED } }),
      client.enrollment.aggregate({ where: { courseId }, _avg: { progress: true } })
    ]),
    // Group C: Ratings
    Promise.all([
      client.rating.aggregate({
        where: { courseId, status: ERatingStatus.ACTIVE },
        _avg: { rate: true },
        _count: { id: true }
      }),
      client.rating.groupBy({
        by: ['rate'],
        where: { courseId, status: ERatingStatus.ACTIVE },
        _count: { id: true }
      })
    ]),
    // Group D: Certificates
    Promise.all([
      client.certificate.count({ where: { courseId } }),
      client.certificate.aggregate({ where: { courseId }, _avg: { grade: true } })
    ]),
    // Group E1: Chapters count (non-destroyed)
    client.chapter.count({
      where: { courseId, isDestroyed: false }
    }),
    // Group E2: Lessons (in non-destroyed chapters)
    client.lesson.findMany({
      where: {
        courseId,
        chapter: { isDestroyed: false }
      },
      orderBy: [
        { chapter: { order: 'asc' } },
        { order: 'asc' }
      ],
      select: {
        id: true,
        title: true,
        order: true,
        duration: true,
        type: true,
        isDemo: true,
        chapter: {
          select: {
            id: true,
            title: true,
            order: true
          }
        },
        quiz: {
          select: { id: true }
        }
      }
    }),
    // Group E3: Lesson progress counts
    client.progress.groupBy({
      by: ['lessonId'],
      where: { courseId, completed: true },
      _count: { id: true }
    }),
    // Group F1: Quizzes
    client.quiz.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        passingGrade: true,
        lessonId: true,
        lesson: {
          select: { id: true, title: true }
        },
        _count: {
          select: { questions: true }
        }
      }
    }),
    // Group F2: Quiz submissions aggregation (safe raw SQL, zero N+1)
    client.$queryRaw<
      Array<{
        quizId: string
        submissionsCount: number
        averageScore: number
        passCount: number
      }>
    >`
      SELECT 
        qs.quiz_id AS "quizId",
        COUNT(qs.id)::int AS "submissionsCount",
        COALESCE(ROUND(AVG(qs.percentage), 2), 0)::float AS "averageScore",
        COUNT(CASE WHEN qs.percentage >= q.passing_grade THEN 1 END)::int AS "passCount"
      FROM quiz_submissions qs
      JOIN quizzes q ON qs.quiz_id = q.id
      WHERE q.course_id = ${courseId}::uuid
      GROUP BY qs.quiz_id;
    `
  ])

  // Process Revenue
  const totalRevenue = Number(orderAgg._sum.total || 0)
  const completedOrders = orderAgg._count.id || 0
  const totalDiscount = Number(orderAgg._sum.discount || 0)
  const averageOrderValue =
    completedOrders > 0 ? Math.round((totalRevenue / completedOrders) * 100) / 100 : 0

  // Process Students
  const completionRate =
    totalStudents > 0
      ? Math.round((completedStudents / totalStudents) * 10000) / 100
      : 0
  const averageProgress =
    progressAgg._avg.progress !== null
      ? Math.round(Number(progressAgg._avg.progress) * 100) / 100
      : 0

  // Process Ratings
  const averageRating =
    ratingAgg._avg.rate !== null ? Math.round(Number(ratingAgg._avg.rate) * 100) / 100 : 0
  const totalReviews = ratingAgg._count.id || 0
  const ratingDistribution = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0
  }
  for (const r of ratingDistRaw) {
    const star = String(r.rate)
    if (star in ratingDistribution) {
      ratingDistribution[star as keyof typeof ratingDistribution] = r._count.id
    }
  }

  // Process Certificates
  const certificateRate =
    totalStudents > 0
      ? Math.round((certificatesIssued / totalStudents) * 10000) / 100
      : 0
  const averageCertificateGrade =
    certGradeAgg._avg.grade !== null
      ? Math.round(Number(certGradeAgg._avg.grade) * 100) / 100
      : 0

  // Process Curriculum & Lesson Funnel
  const totalLessons = lessons.length
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0)
  const completedMap = new Map<string, number>(
    progressGroup.map((p) => [p.lessonId, p._count.id])
  )

  let prevCompleted: number | null = null
  const lessonsFunnel = lessons.map((l, index) => {
    const lessonCompleted = completedMap.get(l.id) || 0
    const lessonCompRate =
      totalStudents > 0
        ? Math.round((lessonCompleted / totalStudents) * 10000) / 100
        : 0

    let dropOffFromPrevious = 0
    if (index > 0 && prevCompleted !== null && prevCompleted > 0) {
      const dropDiff = prevCompleted - lessonCompleted
      dropOffFromPrevious =
        dropDiff > 0 ? Math.round((dropDiff / prevCompleted) * 10000) / 100 : 0
    }
    prevCompleted = lessonCompleted

    return {
      lessonId: l.id,
      lessonTitle: l.title,
      order: l.order,
      duration: l.duration || 0,
      type: l.type,
      isDemo: l.isDemo,
      chapter: {
        id: l.chapter.id,
        title: l.chapter.title,
        order: l.chapter.order
      },
      hasQuiz: l.quiz !== null,
      completedStudents: lessonCompleted,
      completionRate: lessonCompRate,
      dropOffFromPrevious
    }
  })

  // Process Quizzes
  const subMap = new Map<
    string,
    { submissionsCount: number; averageScore: number; passCount: number }
  >(
    quizSubsRaw.map((s) => [
      s.quizId,
      {
        submissionsCount: Number(s.submissionsCount || 0),
        averageScore: Number(s.averageScore || 0),
        passCount: Number(s.passCount || 0)
      }
    ])
  )

  let totalQuizSubmissions = 0
  let totalQuizPassCount = 0
  let weightedScoreSum = 0

  const quizItems = quizzes.map((q) => {
    const stats = subMap.get(q.id) || {
      submissionsCount: 0,
      averageScore: 0,
      passCount: 0
    }
    const submissionsCount = stats.submissionsCount
    const passCount = stats.passCount
    const averageScore = stats.averageScore
    const passRate =
      submissionsCount > 0
        ? Math.round((passCount / submissionsCount) * 10000) / 100
        : 0

    totalQuizSubmissions += submissionsCount
    totalQuizPassCount += passCount
    weightedScoreSum += averageScore * submissionsCount

    return {
      quizId: q.id,
      title: q.title,
      lessonId: q.lessonId,
      lessonTitle: q.lesson?.title || '',
      passingGrade: q.passingGrade,
      totalQuestions: q._count.questions,
      submissionsCount,
      averageScore,
      passCount,
      passRate
    }
  })

  const overallAvgScore =
    totalQuizSubmissions > 0
      ? Math.round((weightedScoreSum / totalQuizSubmissions) * 100) / 100
      : 0
  const overallPassRate =
    totalQuizSubmissions > 0
      ? Math.round((totalQuizPassCount / totalQuizSubmissions) * 10000) / 100
      : 0

  return {
    course: {
      id: course.id,
      _id: course.id,
      title: course.title,
      slug: course.slug,
      image: course.image || '',
      price: Number(course.price || 0),
      oldPrice: Number(course.oldPrice || 0),
      status: course.status,
      level: course.level,
      type: course.type,
      view: course.view,
      sold: totalStudents,
      rawSold: course.sold,
      authorId: course.authorId,
      isDestroyed: course.isDestroyed,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      category: course.category
        ? {
            id: course.category.id,
            _id: course.category.id,
            name: course.category.name,
            slug: course.category.slug
          }
        : null
    },
    overview: {
      revenue: {
        totalRevenue,
        completedOrders,
        totalDiscount,
        averageOrderValue,
        currency: 'VND'
      },
      students: {
        totalStudents,
        activeStudents,
        completedStudents,
        canceledStudents,
        completionRate,
        averageProgress
      },
      engagement: {
        averageRating,
        totalReviews,
        ratingDistribution,
        certificatesIssued,
        certificateRate,
        averageCertificateGrade
      }
    },
    curriculum: {
      totalChapters,
      totalLessons,
      totalDuration
    },
    quizzes: {
      summary: {
        totalQuizzes: quizzes.length,
        totalSubmissions: totalQuizSubmissions,
        averageScore: overallAvgScore,
        passRate: overallPassRate
      },
      items: quizItems
    },
    lessonsFunnel
  }
}

