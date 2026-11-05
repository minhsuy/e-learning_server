import { z } from 'zod'

/**
 * TMDEMY — TEACHER ANALYTICS APPLICATION MODELS (TG-03A)
 *
 * Defines Zod schemas and TypeScript types for multi-tenant teacher analytics:
 * - Revenue Analytics (gross, net, discounts, by course, top courses)
 * - Order Analytics (completed, pending, rejected, conversion rate, sales by course)
 * - Student Analytics (unique students, new students, enrollments, timeline)
 * - Course Analytics (status breakdown, best-selling, zero-sales courses)
 * - Executive Dashboard Summary (all-time + today + weekly + monthly KPIs)
 */

export const CourseRevenueItemSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string(),
  price: z.number(),
  soldCount: z.number().int().nonnegative(),
  revenue: z.number().nonnegative()
})

export type CourseRevenueItem = z.infer<typeof CourseRevenueItemSchema>

export const RevenueTimelinePointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  orderCount: z.number().int()
})

export type RevenueTimelinePointDTO = z.infer<typeof RevenueTimelinePointSchema>

export const TeacherRevenueAnalyticsSchema = z.object({
  summary: z.object({
    period: z.string(),
    periodLabel: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    netRevenue: z.number().nonnegative(),
    grossRevenue: z.number().nonnegative(),
    totalDiscount: z.number().nonnegative(),
    completedOrders: z.number().int().nonnegative(),
    averageOrderValue: z.number().nonnegative(),
    currency: z.literal('VND')
  }),
  kpis: z.object({
    allTimeRevenue: z.number().nonnegative(),
    todayRevenue: z.number().nonnegative(),
    thisWeekRevenue: z.number().nonnegative(),
    thisMonthRevenue: z.number().nonnegative(),
    lastMonthRevenue: z.number().nonnegative()
  }),
  timeline: z.array(RevenueTimelinePointSchema),
  byCourse: z.array(CourseRevenueItemSchema),
  topCourses: z.array(CourseRevenueItemSchema)
})

export type TeacherRevenueAnalytics = z.infer<typeof TeacherRevenueAnalyticsSchema>

export const OrderTimelinePointSchema = z.object({
  date: z.string(),
  totalOrders: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative()
})

export type OrderTimelinePoint = z.infer<typeof OrderTimelinePointSchema>

export const CourseOrderItemSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string(),
  totalOrders: z.number().int().nonnegative(),
  completedOrders: z.number().int().nonnegative(),
  pendingOrders: z.number().int().nonnegative(),
  rejectedOrders: z.number().int().nonnegative(),
  realizedRevenue: z.number().nonnegative()
})

export type CourseOrderItem = z.infer<typeof CourseOrderItemSchema>

export const TeacherOrderAnalyticsSchema = z.object({
  summary: z.object({
    period: z.string(),
    periodLabel: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    totalOrders: z.number().int().nonnegative(),
    completedOrders: z.number().int().nonnegative(),
    pendingOrders: z.number().int().nonnegative(),
    rejectedOrders: z.number().int().nonnegative(),
    realizedRevenue: z.number().nonnegative(),
    pendingRevenue: z.number().nonnegative(),
    conversionRate: z.number().min(0).max(100)
  }),
  allTimeTotalOrders: z.number().int().nonnegative(),
  timeline: z.array(OrderTimelinePointSchema),
  salesByCourse: z.array(CourseOrderItemSchema)
})

export type TeacherOrderAnalytics = z.infer<typeof TeacherOrderAnalyticsSchema>

export const CourseStudentItemSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string(),
  totalEnrollments: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  canceledCount: z.number().int().nonnegative()
})

export type CourseStudentItem = z.infer<typeof CourseStudentItemSchema>

export const StudentTimelinePointSchema = z.object({
  date: z.string(),
  enrollmentsCount: z.number().int().nonnegative()
})

export type StudentTimelinePoint = z.infer<typeof StudentTimelinePointSchema>

export const TeacherStudentAnalyticsSchema = z.object({
  summary: z.object({
    period: z.string(),
    periodLabel: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    totalUniqueStudentsAllTime: z.number().int().nonnegative(),
    periodUniqueStudents: z.number().int().nonnegative(),
    newStudents: z.number().int().nonnegative(),
    periodEnrollments: z.number().int().nonnegative(),
    activeEnrollments: z.number().int().nonnegative(),
    completedEnrollments: z.number().int().nonnegative(),
    canceledEnrollments: z.number().int().nonnegative()
  }),
  timeline: z.array(StudentTimelinePointSchema),
  enrollmentsByCourse: z.array(CourseStudentItemSchema)
})

export type TeacherStudentAnalytics = z.infer<typeof TeacherStudentAnalyticsSchema>

export const CourseDetailedAnalyticsItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  price: z.number().nonnegative(),
  status: z.string(),
  totalRevenue: z.number().nonnegative(),
  completedOrders: z.number().int().nonnegative(),
  totalStudents: z.number().int().nonnegative(),
  averageRating: z.number().nonnegative(),
  hasSales: z.boolean()
})

export type CourseDetailedAnalyticsItem = z.infer<typeof CourseDetailedAnalyticsItemSchema>

export const TeacherCourseAnalyticsSchema = z.object({
  summary: z.object({
    totalCourses: z.number().int().nonnegative(),
    approvedCourses: z.number().int().nonnegative(),
    pendingCourses: z.number().int().nonnegative(),
    rejectedCourses: z.number().int().nonnegative(),
    coursesWithSalesCount: z.number().int().nonnegative(),
    zeroSalesCoursesCount: z.number().int().nonnegative()
  }),
  bestSellingByRevenue: CourseDetailedAnalyticsItemSchema.nullable(),
  bestSellingByVolume: CourseDetailedAnalyticsItemSchema.nullable(),
  courses: z.array(CourseDetailedAnalyticsItemSchema),
  zeroSalesCourses: z.array(CourseDetailedAnalyticsItemSchema)
})

export type TeacherCourseAnalytics = z.infer<typeof TeacherCourseAnalyticsSchema>

export const TeacherDashboardSummarySchema = z.object({
  teacher: z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string()
  }),
  allTime: z.object({
    totalRevenue: z.number().nonnegative(),
    totalOrders: z.number().int().nonnegative(),
    completedOrders: z.number().int().nonnegative(),
    uniqueStudents: z.number().int().nonnegative(),
    totalCourses: z.number().int().nonnegative(),
    averageRating: z.number().nonnegative()
  }),
  today: z.object({
    revenue: z.number().nonnegative(),
    orders: z.number().int().nonnegative(),
    newStudents: z.number().int().nonnegative()
  }),
  thisWeek: z.object({
    revenue: z.number().nonnegative(),
    orders: z.number().int().nonnegative(),
    newStudents: z.number().int().nonnegative()
  }),
  thisMonth: z.object({
    revenue: z.number().nonnegative(),
    orders: z.number().int().nonnegative(),
    newStudents: z.number().int().nonnegative()
  }),
  topCourse: z.object({
    id: z.string().uuid(),
    title: z.string(),
    revenue: z.number().nonnegative(),
    soldCount: z.number().int().nonnegative()
  }).nullable()
})

export type TeacherDashboardSummary = z.infer<typeof TeacherDashboardSummarySchema>

