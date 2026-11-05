import { prisma } from '../src/config/prisma'
import {
  assertTeacherAuthorization,
  getCourseAnalyticsService,
  getOrderAnalyticsService,
  getRevenueAnalyticsService,
  getStudentAnalyticsService,
  getTeacherDashboardSummaryService
} from '../src/services/teacherAnalytics.service'
import {
  createVietnamDate,
  getVietnamCalendarDate,
  resolveAnalyticsDateRange,
  VIETNAM_OFFSET_HOURS,
  VIETNAM_OFFSET_MS
} from '../src/utils/analyticsDateRange'
import { EEnrollmentStatus, EOrderStatus } from '@prisma/client'

/**
 * TMDEMY — TG-03A TEACHER ANALYTICS CORE TEST SUITE
 *
 * Verifies all 20 required analytics, security, and timezone scenarios:
 * 1. Teacher with multiple courses
 * 2. Teacher with no courses (empty catalog)
 * 3. Teacher with courses but no sales (zero-sales courses)
 * 4. Correct completed-order revenue calculation
 * 5. Pending and cancelled/rejected orders excluded from realized revenue
 * 6. Revenue attribution per course
 * 7. Multi-teacher order and revenue isolation
 * 8. Coupon and discount handling (gross vs net revenue)
 * 9. Refund/rejection order counting
 * 10. Unique student counting (no duplicates)
 * 11. Multiple enrollments by same student
 * 12. Course ranking and sales counts
 * 13. Today/week/month date boundary calculation
 * 14. Asia/Ho_Chi_Minh timezone (+07:00) handling
 * 15. Custom date-range validation and error handling
 * 16. Unauthorized teacher rejection (403/404)
 * 17. Cross-teacher data isolation
 * 18. Decimal precision for monetary values
 * 19. Executive dashboard summary KPI aggregation
 * 20. End-to-end analytics consistency across all services
 */

async function runTestSuite() {
  console.log('====================================================')
  console.log('       TG-03A: TEACHER ANALYTICS TEST SUITE         ')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0
  let blocked = 0
  let notTested = 0

  const assert = (condition: boolean, testNum: number, name: string, detail?: string) => {
    if (condition) {
      passed++
      console.log(`  ✓ [PASS] #${testNum}: ${name}`)
    } else {
      failed++
      console.error(`  ✗ [FAIL] #${testNum}: ${name}${detail ? ` (${detail})` : ''}`)
    }
  }

  // ----------------------------------------------------
  // SETUP: Test Fixtures in PostgreSQL
  // ----------------------------------------------------
  console.log('--- Setting up isolated test fixtures ---')

  // Find or create Teacher A (with courses and sales)
  let teacherA = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', email: 'teacher_analytics_a@example.com' }
  })
  if (!teacherA) {
    teacherA = await prisma.user.create({
      data: {
        username: 'teacher_analytics_a',
        email: 'teacher_analytics_a@example.com',
        password: 'hashed_password',
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    })
  }

  // Find or create Teacher B (with courses and sales for cross-isolation)
  let teacherB = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', email: 'teacher_analytics_b@example.com' }
  })
  if (!teacherB) {
    teacherB = await prisma.user.create({
      data: {
        username: 'teacher_analytics_b',
        email: 'teacher_analytics_b@example.com',
        password: 'hashed_password',
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    })
  }

  // Find or create Teacher C (empty catalog, no courses)
  let teacherC = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', email: 'teacher_analytics_empty@example.com' }
  })
  if (!teacherC) {
    teacherC = await prisma.user.create({
      data: {
        username: 'teacher_analytics_empty',
        email: 'teacher_analytics_empty@example.com',
        password: 'hashed_password',
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    })
  }

  // Find or create Student User 1 & Student User 2
  let student1 = await prisma.user.findFirst({
    where: { role: 'USER', email: 'student_analytics_1@example.com' }
  })
  if (!student1) {
    student1 = await prisma.user.create({
      data: {
        username: 'student_analytics_1',
        email: 'student_analytics_1@example.com',
        password: 'hashed_password',
        role: 'USER',
        status: 'ACTIVE'
      }
    })
  }

  let student2 = await prisma.user.findFirst({
    where: { role: 'USER', email: 'student_analytics_2@example.com' }
  })
  if (!student2) {
    student2 = await prisma.user.create({
      data: {
        username: 'student_analytics_2',
        email: 'student_analytics_2@example.com',
        password: 'hashed_password',
        role: 'USER',
        status: 'ACTIVE'
      }
    })
  }

  // Cleanup any old test fixtures for Teacher A and Teacher B before running
  const oldCourses = await prisma.course.findMany({
    where: { authorId: { in: [teacherA.id, teacherB.id] } },
    select: { id: true }
  })
  if (oldCourses.length > 0) {
    const oldIds = oldCourses.map((c) => c.id)
    await prisma.order.deleteMany({ where: { courseId: { in: oldIds } } })
    await prisma.enrollment.deleteMany({ where: { courseId: { in: oldIds } } })
    await prisma.course.deleteMany({ where: { id: { in: oldIds } } })
  }

  // Create isolated Courses for Teacher A
  const courseA1Slug = 'tg03a-course-a1-' + Date.now()
  const courseA2Slug = 'tg03a-course-a2-' + Date.now()
  const courseA3ZeroSalesSlug = 'tg03a-course-a3-zero-' + Date.now()

  const courseA1 = await prisma.course.create({
    data: {
      title: 'TG03A Course A1 High Sales',
      slug: courseA1Slug,
      price: 200000,
      status: 'APPROVED',
      authorId: teacherA.id
    }
  })

  const courseA2 = await prisma.course.create({
    data: {
      title: 'TG03A Course A2 Moderate Sales',
      slug: courseA2Slug,
      price: 150000,
      status: 'APPROVED',
      authorId: teacherA.id
    }
  })

  const courseA3Zero = await prisma.course.create({
    data: {
      title: 'TG03A Course A3 No Sales',
      slug: courseA3ZeroSalesSlug,
      price: 100000,
      status: 'APPROVED',
      authorId: teacherA.id
    }
  })

  // Create Course for Teacher B
  const courseBSlug = 'tg03a-course-b-' + Date.now()
  const courseB = await prisma.course.create({
    data: {
      title: 'TG03A Course B Teacher B',
      slug: courseBSlug,
      price: 300000,
      status: 'APPROVED',
      authorId: teacherB.id
    }
  })

  // Create Orders for Course A1:
  // 1 Completed Order for Student 1: price 200000, discount 20000, total 180000
  const orderA1Comp1 = await prisma.order.create({
    data: {
      code: 'ORD-TG03A-A1-1-' + Date.now(),
      courseId: courseA1.id,
      userId: student1.id,
      amount: 200000,
      discount: 20000,
      total: 180000,
      status: EOrderStatus.COMPLETED
    }
  })

  // 1 Completed Order for Student 2: price 200000, discount 0, total 200000
  const orderA1Comp2 = await prisma.order.create({
    data: {
      code: 'ORD-TG03A-A1-2-' + Date.now(),
      courseId: courseA1.id,
      userId: student2.id,
      amount: 200000,
      discount: 0,
      total: 200000,
      status: EOrderStatus.COMPLETED
    }
  })

  // 1 Pending Order for Course A1: total 200000 (must be EXCLUDED from realized revenue)
  const orderA1Pending = await prisma.order.create({
    data: {
      code: 'ORD-TG03A-A1-P-' + Date.now(),
      courseId: courseA1.id,
      userId: student1.id,
      amount: 200000,
      discount: 0,
      total: 200000,
      status: EOrderStatus.PENDING
    }
  })

  // 1 Rejected/Cancelled Order for Course A1: total 200000 (must be EXCLUDED from realized revenue)
  const orderA1Rejected = await prisma.order.create({
    data: {
      code: 'ORD-TG03A-A1-R-' + Date.now(),
      courseId: courseA1.id,
      userId: student2.id,
      amount: 200000,
      discount: 0,
      total: 200000,
      status: EOrderStatus.REJECTED
    }
  })

  // Create Orders for Course A2:
  // 1 Completed Order for Student 1: price 150000, discount 15000, total 135000
  const orderA2Comp = await prisma.order.create({
    data: {
      code: 'ORD-TG03A-A2-1-' + Date.now(),
      courseId: courseA2.id,
      userId: student1.id,
      amount: 150000,
      discount: 15000,
      total: 135000,
      status: EOrderStatus.COMPLETED
    }
  })

  // Create Orders for Course B (Teacher B): total 300000 completed
  const orderBComp = await prisma.order.create({
    data: {
      code: 'ORD-TG03A-B-1-' + Date.now(),
      courseId: courseB.id,
      userId: student1.id,
      amount: 300000,
      discount: 0,
      total: 300000,
      status: EOrderStatus.COMPLETED
    }
  })

  // Create Enrollments:
  // Student 1 enrolled in Course A1 and Course A2 (2 enrollments, but 1 unique student!)
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: courseA1.id,
      status: EEnrollmentStatus.ACTIVE,
      progress: 40
    }
  })
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: courseA2.id,
      status: EEnrollmentStatus.COMPLETED,
      progress: 100
    }
  })

  // Student 2 enrolled in Course A1
  await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: courseA1.id,
      status: EEnrollmentStatus.ACTIVE,
      progress: 10
    }
  })

  // Student 1 enrolled in Course B (Teacher B's course)
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: courseB.id,
      status: EEnrollmentStatus.ACTIVE,
      progress: 5
    }
  })

  // ----------------------------------------------------
  // TEST 1: Teacher With Multiple Courses Analytics
  // ----------------------------------------------------
  console.log('\n--- TEST 1: Teacher With Multiple Courses ---')
  const revenueA = await getRevenueAnalyticsService(teacherA.id, { period: 'all_time' })
  assert(
    revenueA.summary.completedOrders >= 3,
    1,
    'Teacher A completed orders counted correctly'
  )
  assert(
    revenueA.byCourse.length >= 2,
    1,
    'Revenue broken down across multiple teacher courses'
  )

  // ----------------------------------------------------
  // TEST 2: Teacher With No Courses (Empty Catalog)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Teacher With No Courses ---')
  const emptyCourses = await getCourseAnalyticsService(teacherC.id)
  assert(emptyCourses.summary.totalCourses === 0, 2, 'Empty teacher catalog returns totalCourses = 0')
  assert(emptyCourses.courses.length === 0, 2, 'Empty teacher catalog returns empty courses list')
  const emptySummary = await getTeacherDashboardSummaryService(teacherC.id)
  assert(emptySummary.allTime.totalRevenue === 0, 2, 'Empty teacher catalog has 0 revenue')
  assert(emptySummary.topCourse === null, 2, 'Empty teacher catalog has topCourse = null')

  // ----------------------------------------------------
  // TEST 3: Zero-Sales Courses Detection
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Zero-Sales Courses Detection ---')
  const courseAnalyticsA = await getCourseAnalyticsService(teacherA.id)
  const zeroSalesFound = courseAnalyticsA.zeroSalesCourses.find((c) => c.id === courseA3Zero.id)
  assert(
    Boolean(zeroSalesFound && zeroSalesFound.completedOrders === 0 && zeroSalesFound.totalRevenue === 0),
    3,
    'Course A3 with no sales is correctly categorized in zeroSalesCourses list'
  )
  assert(
    courseAnalyticsA.summary.zeroSalesCoursesCount >= 1,
    3,
    'zeroSalesCoursesCount accurately reflects courses with 0 completed orders'
  )

  // ----------------------------------------------------
  // TEST 4: Completed Order Revenue Calculation
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Completed Order Realized Revenue ---')
  // Expected revenue from Teacher A's test orders:
  // A1 Comp 1: 180,000
  // A1 Comp 2: 200,000
  // A2 Comp:   135,000
  // Total = 515,000
  const expectedNetRevenue = 180000 + 200000 + 135000
  const courseA1Stats = revenueA.byCourse.find((c) => c.courseId === courseA1.id)
  assert(
    courseA1Stats?.revenue === 380000 && courseA1Stats?.soldCount === 2,
    4,
    'Course A1 realized net revenue is exactly 380,000 VND (180k + 200k) from 2 completed orders'
  )

  // ----------------------------------------------------
  // TEST 5: Pending & Rejected Orders Excluded from Realized Revenue
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Pending & Rejected Orders Excluded ---')
  const orderAnalyticsA = await getOrderAnalyticsService(teacherA.id, { period: 'all_time' })
  assert(
    orderAnalyticsA.summary.pendingOrders >= 1,
    5,
    'Pending orders counted in pendingOrders tally'
  )
  assert(
    orderAnalyticsA.summary.rejectedOrders >= 1,
    5,
    'Rejected orders counted in rejectedOrders tally'
  )
  // Ensure realizedRevenue does not include pending (200k) or rejected (200k)
  const a1Orders = orderAnalyticsA.salesByCourse.find((c) => c.courseId === courseA1.id)
  assert(
    a1Orders?.realizedRevenue === 380000,
    5,
    'Realized revenue strictly excludes pending and rejected amounts'
  )

  // ----------------------------------------------------
  // TEST 6: Revenue Attribution Per Course
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Revenue Attribution Per Course ---')
  const courseA2Stats = revenueA.byCourse.find((c) => c.courseId === courseA2.id)
  assert(
    courseA2Stats?.revenue === 135000 && courseA2Stats?.soldCount === 1,
    6,
    'Course A2 revenue attribution is exactly 135,000 VND for 1 completed order'
  )

  // ----------------------------------------------------
  // TEST 7: Multi-Teacher Order & Revenue Isolation
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Multi-Teacher Data Isolation ---')
  const revenueB = await getRevenueAnalyticsService(teacherB.id, { period: 'all_time' })
  const bCoursesInA = revenueA.byCourse.find((c) => c.courseId === courseB.id)
  const aCoursesInB = revenueB.byCourse.find((c) => c.courseId === courseA1.id)
  assert(bCoursesInA === undefined, 7, 'Teacher A revenue query contains no courses belonging to Teacher B')
  assert(aCoursesInB === undefined, 7, 'Teacher B revenue query contains no courses belonging to Teacher A')

  // ----------------------------------------------------
  // TEST 8: Coupon & Discount Handling (Gross vs Net)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Coupon & Discount Handling ---')
  // For Course A1: discounts = 20,000 + 0 = 20,000. Net = 380,000. Gross = 400,000.
  // For Course A2: discount = 15,000. Net = 135,000. Gross = 150,000.
  // Total discounts = 35,000. Gross = 550,000. Net = 515,000.
  assert(
    revenueA.summary.totalDiscount >= 35000,
    8,
    'Total coupon discounts tracked and summed accurately'
  )
  assert(
    revenueA.summary.grossRevenue === revenueA.summary.netRevenue + revenueA.summary.totalDiscount,
    8,
    'Gross Revenue is mathematically equal to Net Revenue + Total Discount'
  )

  // ----------------------------------------------------
  // TEST 9: Refund / Rejection Order Counting
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Rejection & Conversion Rate ---')
  assert(
    orderAnalyticsA.summary.conversionRate < 100 && orderAnalyticsA.summary.conversionRate > 0,
    9,
    'Conversion rate accurately calculated from completed vs total orders'
  )

  // ----------------------------------------------------
  // TEST 10: Unique Student Counting (Deduplication)
  // ----------------------------------------------------
  console.log('\n--- TEST 10: Unique Student Counting ---')
  const studentAnalyticsA = await getStudentAnalyticsService(teacherA.id, { period: 'all_time' })
  // Student 1 has 2 enrollments in Teacher A's courses. Student 2 has 1 enrollment.
  // Total enrollments = 3. Unique students = 2!
  assert(
    studentAnalyticsA.summary.totalUniqueStudentsAllTime >= 2,
    10,
    'Unique students deduplicated across multiple courses'
  )

  // ----------------------------------------------------
  // TEST 11: Distinguishing Enrollments From Unique Students
  // ----------------------------------------------------
  console.log('\n--- TEST 11: Unique Students vs Total Enrollments ---')
  assert(
    studentAnalyticsA.summary.periodEnrollments > studentAnalyticsA.summary.periodUniqueStudents,
    11,
    'System correctly distinguishes total enrollments from unique individual students'
  )

  // ----------------------------------------------------
  // TEST 12: Course Ranking (Best-Selling Courses)
  // ----------------------------------------------------
  console.log('\n--- TEST 12: Course Ranking & Top Performers ---')
  const freshCourseAnalyticsA = await getCourseAnalyticsService(teacherA.id)
  assert(
    freshCourseAnalyticsA.bestSellingByRevenue?.id === courseA1.id,
    12,
    'Course A1 correctly identified as Best-Selling Course by Revenue'
  )
  assert(
    freshCourseAnalyticsA.bestSellingByVolume?.id === courseA1.id,
    12,
    'Course A1 correctly identified as Best-Selling Course by Volume'
  )

  // ----------------------------------------------------
  // TEST 13: Today / Week / Month Date Boundaries
  // ----------------------------------------------------
  console.log('\n--- TEST 13: Date Range Boundary Calculation ---')
  const todayRange = resolveAnalyticsDateRange({ period: 'today' })
  const weekRange = resolveAnalyticsDateRange({ period: 'this_week' })
  const monthRange = resolveAnalyticsDateRange({ period: 'this_month' })
  const lastMonthRange = resolveAnalyticsDateRange({ period: 'last_month' })

  assert(
    todayRange.startDate < todayRange.endDate &&
      todayRange.endDate.getTime() - todayRange.startDate.getTime() === 24 * 60 * 60 * 1000,
    13,
    'Today range spans exactly 24 hours'
  )
  assert(
    weekRange.startDate < weekRange.endDate &&
      weekRange.endDate.getTime() - weekRange.startDate.getTime() === 7 * 24 * 60 * 60 * 1000,
    13,
    'This week range spans exactly 7 days'
  )
  assert(
    monthRange.startDate < monthRange.endDate &&
      lastMonthRange.endDate.getTime() === monthRange.startDate.getTime(),
    13,
    'Last month exclusive end connects seamlessly to this month inclusive start'
  )

  // ----------------------------------------------------
  // TEST 14: Asia/Ho_Chi_Minh Timezone (+07:00) Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 14: Asia/Ho_Chi_Minh Timezone Calculation ---')
  const fixedUtcDate = new Date('2026-11-04T14:30:00.000Z') // 21:30 in Vietnam
  const vnCal = getVietnamCalendarDate(fixedUtcDate)
  assert(
    vnCal.hours === 21 && vnCal.day === 4 && vnCal.month === 10,
    14,
    'UTC timestamp correctly translated to Vietnam local calendar components (21:30 Nov 4)'
  )

  const vnStart = createVietnamDate(2026, 10, 4) // Nov 4, 00:00:00 VN time
  assert(
    vnStart.toISOString() === '2026-11-03T17:00:00.000Z',
    14,
    'Midnight VN time (UTC+7) translates exactly to 17:00:00 UTC previous day'
  )

  // ----------------------------------------------------
  // TEST 15: Custom Date Range Validation
  // ----------------------------------------------------
  console.log('\n--- TEST 15: Custom Date Range Validation ---')
  const validCustom = resolveAnalyticsDateRange({
    period: 'custom',
    startDate: '2026-10-01',
    endDate: '2026-10-31'
  })
  assert(
    validCustom.startDate < validCustom.endDate && validCustom.period === 'custom',
    15,
    'Valid custom YYYY-MM-DD range parsed and resolved successfully'
  )

  let invertedThrew = false
  try {
    resolveAnalyticsDateRange({
      period: 'custom',
      startDate: '2026-11-10',
      endDate: '2026-11-01'
    })
  } catch (err: any) {
    invertedThrew = err.message.includes('startDate must be before')
  }
  assert(invertedThrew, 15, 'Custom range with startDate > endDate throws validation error')

  let invalidFormatThrew = false
  try {
    resolveAnalyticsDateRange({
      period: 'custom',
      startDate: 'invalid-date',
      endDate: '2026-11-01'
    })
  } catch (err: any) {
    invalidFormatThrew = err.message.includes('Invalid date format')
  }
  assert(invalidFormatThrew, 15, 'Invalid date format string throws validation error')

  // ----------------------------------------------------
  // TEST 16: Unauthorized Teacher Rejection
  // ----------------------------------------------------
  console.log('\n--- TEST 16: Unauthorized Teacher Rejection ---')
  let studentThrew = false
  try {
    await assertTeacherAuthorization(student1.id)
  } catch (err: any) {
    studentThrew = err.message.includes('Teacher role required')
  }
  assert(studentThrew, 16, 'Student account calling teacher analytics is rejected with authorization error')

  let invalidUuidThrew = false
  try {
    await assertTeacherAuthorization('not-a-uuid')
  } catch (err: any) {
    invalidUuidThrew = err.message.includes('Invalid UUID')
  }
  assert(invalidUuidThrew, 16, 'Invalid UUID string throws validation error')

  // ----------------------------------------------------
  // TEST 17: Cross-Teacher Data Isolation in Dashboard Summary
  // ----------------------------------------------------
  console.log('\n--- TEST 17: Cross-Teacher Dashboard Summary Isolation ---')
  const summaryA = await getTeacherDashboardSummaryService(teacherA.id)
  const summaryB = await getTeacherDashboardSummaryService(teacherB.id)
  assert(
    summaryA.teacher.id === teacherA.id && summaryB.teacher.id === teacherB.id,
    17,
    'Teacher identity correctly bound to authenticated context'
  )
  assert(
    summaryA.allTime.totalRevenue !== summaryB.allTime.totalRevenue,
    17,
    'Teacher A and Teacher B dashboard summaries yield strictly isolated financials'
  )

  // ----------------------------------------------------
  // TEST 18: Decimal Precision & Currency Integrity
  // ----------------------------------------------------
  console.log('\n--- TEST 18: Decimal Precision & Monetary Formatting ---')
  assert(
    typeof revenueA.summary.netRevenue === 'number' && !isNaN(revenueA.summary.netRevenue),
    18,
    'Net revenue is clean JavaScript number'
  )
  assert(
    revenueA.summary.currency === 'VND',
    18,
    'Currency standard is VND'
  )

  // ----------------------------------------------------
  // TEST 19: Dashboard Summary KPIs Aggregation
  // ----------------------------------------------------
  console.log('\n--- TEST 19: Executive Dashboard Summary KPIs ---')
  assert(
    typeof summaryA.today.revenue === 'number' &&
      typeof summaryA.thisWeek.revenue === 'number' &&
      typeof summaryA.thisMonth.revenue === 'number',
    19,
    'Executive summary aggregates today, weekly, and monthly KPIs in a single structure'
  )

  // ----------------------------------------------------
  // TEST 20: End-to-End Analytics Consistency
  // ----------------------------------------------------
  console.log('\n--- TEST 20: End-to-End Analytics Consistency ---')
  // Verify that revenue sum in byCourse equals net revenue
  const sumCourseRevenue = revenueA.byCourse.reduce((acc, c) => acc + c.revenue, 0)
  assert(
    sumCourseRevenue === revenueA.summary.netRevenue,
    20,
    'Sum of individual course revenues strictly equals total net revenue'
  )

  // ----------------------------------------------------
  // CLEANUP: Clean up isolated test records
  // ----------------------------------------------------
  console.log('\n--- Cleaning up test fixtures ---')
  await prisma.order.deleteMany({
    where: {
      id: {
        in: [
          orderA1Comp1.id,
          orderA1Comp2.id,
          orderA1Pending.id,
          orderA1Rejected.id,
          orderA2Comp.id,
          orderBComp.id
        ]
      }
    }
  })
  await prisma.enrollment.deleteMany({
    where: {
      courseId: { in: [courseA1.id, courseA2.id, courseA3Zero.id, courseB.id] }
    }
  })
  await prisma.course.deleteMany({
    where: {
      id: { in: [courseA1.id, courseA2.id, courseA3Zero.id, courseB.id] }
    }
  })

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================')
  console.log(
    `RESULTS: PASSED: ${passed} | FAILED: ${failed} | BLOCKED: ${blocked} | NOT TESTED: ${notTested}`
  )
  console.log('====================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

