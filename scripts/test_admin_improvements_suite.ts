import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '~/config/prisma'
import { generateAccessToken } from '~/middlewares/generateToken'

const BASE_URL = 'http://localhost:3002'

async function runTestSuite() {
  console.log('===============================================================')
  console.log('       TMDEMY ADMIN PORTAL API IMPROVEMENTS TEST SUITE         ')
  console.log('===============================================================')

  // 1. Prepare Admin & Student Tokens
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    throw new Error('No admin user found in database!')
  }

  const studentUser = await prisma.user.findFirst({
    where: { role: 'USER' }
  })

  if (!studentUser) {
    throw new Error('No student user found in database!')
  }

  const adminToken = generateAccessToken({ userId: adminUser.id, role: 'admin' })
  const studentToken = generateAccessToken({ userId: studentUser.id, role: 'user' })

  console.log(`✓ Admin User: ${adminUser.username} (${adminUser.id})`)
  console.log(`✓ Student User: ${studentUser.username} (${studentUser.id})`)

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, desc: string) {
    totalTests++
    if (condition) {
      console.log(`  [PASS] ${desc}`)
      passedTests++
    } else {
      console.error(`  [FAIL] ${desc}`)
    }
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-001: Financial Statistics API
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-001] Financial Statistics API ---')
  {
    // Test 1.1: 401 Unauthorized
    const resUnauth = await fetch(`${BASE_URL}/api/admin/statistics/financial`)
    assert(resUnauth.status === 401, '401 on unauthenticated request')

    // Test 1.2: 403 Forbidden
    const resForbidden = await fetch(`${BASE_URL}/api/admin/statistics/financial`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    })
    assert(resForbidden.status === 403, '403 on non-admin role request')

    // Test 1.3: 200 OK default
    const resDefault = await fetch(`${BASE_URL}/api/admin/statistics/financial`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    const jsonDefault = await resDefault.json()
    console.log('resDefault status:', resDefault.status, 'body:', jsonDefault)
    assert(jsonDefault.success === true, 'Response success is true')
    assert(typeof jsonDefault.data.grossRevenue === 'number', 'grossRevenue is number')
    assert(typeof jsonDefault.data.netRevenue === 'number', 'netRevenue is number')
    assert(typeof jsonDefault.data.totalOrders === 'number', 'totalOrders is number')
    assert(typeof jsonDefault.data.completedOrders === 'number', 'completedOrders is number')
    assert(typeof jsonDefault.data.pendingOrders === 'number', 'pendingOrders is number')
    assert(typeof jsonDefault.data.rejectedOrders === 'number', 'rejectedOrders is number')
    assert(Array.isArray(jsonDefault.data.revenueByMonth), 'revenueByMonth is array')
    console.log(`    Total Orders: ${jsonDefault.data.totalOrders}, Completed: ${jsonDefault.data.completedOrders}, Revenue: ${jsonDefault.data.netRevenue}`)

    // Test 1.4: Query with timeRange
    const res30d = await fetch(`${BASE_URL}/api/admin/statistics/financial?timeRange=30days`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert(res30d.status === 200, '200 OK with timeRange=30days')
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-002: Course Rejection Reason
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-002] Course Rejection Reason ---')
  {
    const course = await prisma.course.findFirst({
      where: { isDestroyed: false }
    })
    if (!course) throw new Error('No course found!')

    const testReason = 'Chất lượng âm thanh bài học 3 và 4 quá rè, thiếu tài liệu đính kèm.'

    const resReject = await fetch(`${BASE_URL}/api/admin/courses/teacher/${course.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'rejected',
        rejectionReason: testReason
      })
    })

    assert(resReject.status === 200, '200 OK updating course status to rejected')
    const jsonReject = await resReject.json()
    assert(String(jsonReject.data.status).toLowerCase() === 'rejected', 'Course status is rejected')
    assert(jsonReject.data.rejectionReason === testReason, 'rejectionReason returned in response')

    // Verify stored in DB
    const dbCourse = await prisma.course.findUnique({ where: { id: course.id } })
    assert(dbCourse?.rejectionReason === testReason, 'rejectionReason persisted in PostgreSQL')

    // Restore course status
    await prisma.course.update({
      where: { id: course.id },
      data: { status: course.status, rejectionReason: null }
    })
    console.log(`    ✓ Restored course ${course.id} back to original status ${course.status}`)
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-003: Comment Moderation
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-003] Comment Moderation ---')
  {
    const comment = await prisma.comment.findFirst()
    if (!comment) throw new Error('No comment found!')

    const note = 'Chứa từ ngữ không phù hợp'
    const resMod = await fetch(`${BASE_URL}/api/comments/admin/${comment.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'HIDDEN',
        moderationNote: note
      })
    })

    assert(resMod.status === 200, '200 OK changing comment status to HIDDEN')
    const jsonMod = await resMod.json()
    assert(jsonMod.data.status === 'HIDDEN', 'Comment status updated to HIDDEN')
    assert(jsonMod.data.moderationNote === note, 'moderationNote returned in response')

    // Verify filter by status
    const resListHidden = await fetch(`${BASE_URL}/api/comments?status=hidden`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert(resListHidden.status === 200, '200 OK listing comments with ?status=hidden')
    const jsonListHidden = await resListHidden.json()
    const foundInHidden = jsonListHidden.data.comments.some((c: any) => c.id === comment.id)
    assert(foundInHidden, 'Hidden comment is returned when filtered by ?status=hidden')

    // Verify classroom does not show hidden comment
    const resLesson = await fetch(`${BASE_URL}/api/comments/lesson/${comment.lessonId}`)
    const jsonLesson = await resLesson.json()
    const foundInLesson = (jsonLesson.data || []).some((c: any) => c.id === comment.id)
    assert(!foundInLesson, 'Hidden comment is EXCLUDED from lesson classroom response')

    // Restore comment to APPROVED
    const resRestore = await fetch(`${BASE_URL}/api/comments/admin/${comment.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'APPROVED',
        moderationNote: null
      })
    })
    assert(resRestore.status === 200, '200 OK restoring comment to APPROVED')
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-004: Category Course Count
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-004] Category Course Count ---')
  {
    const resCats = await fetch(`${BASE_URL}/api/categories`)
    assert(resCats.status === 200, '200 OK fetching categories')
    const jsonCats = await resCats.json()
    const categories = jsonCats.data.categories
    assert(Array.isArray(categories) && categories.length > 0, 'Categories list returned')
    assert(typeof categories[0].courseCount === 'number', `courseCount is number (first category: ${categories[0].name} has ${categories[0].courseCount} courses)`)

    // Check single category detail
    const sampleSlug = categories[0].slug
    const resDetail = await fetch(`${BASE_URL}/api/categories/${sampleSlug}`)
    assert(resDetail.status === 200, `200 OK fetching category detail for ${sampleSlug}`)
    const jsonDetail = await resDetail.json()
    assert(typeof jsonDetail.data.courseCount === 'number', `courseCount is present in detail: ${jsonDetail.data.courseCount}`)
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-005: Coupon Platform Analytics
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-005] Coupon Platform Analytics ---')
  {
    const resCouponStats = await fetch(`${BASE_URL}/api/coupons/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert(resCouponStats.status === 200, '200 OK fetching coupon statistics at /api/coupons/admin/statistics')
    const jsonCouponStats = await resCouponStats.json()
    assert(jsonCouponStats.success === true, 'Response success is true')
    assert(typeof jsonCouponStats.data.totalCoupons === 'number', 'totalCoupons is number')
    assert(typeof jsonCouponStats.data.activeCoupons === 'number', 'activeCoupons is number')
    assert(typeof jsonCouponStats.data.expiredCoupons === 'number', 'expiredCoupons is number')
    assert(typeof jsonCouponStats.data.disabledCoupons === 'number', 'disabledCoupons is number')
    assert(typeof jsonCouponStats.data.totalUsageCount === 'number', 'totalUsageCount is number')
    assert(typeof jsonCouponStats.data.totalDiscountAmount === 'number', 'totalDiscountAmount is number')
    console.log(`    Total Coupons: ${jsonCouponStats.data.totalCoupons}, Active: ${jsonCouponStats.data.activeCoupons}, Total Used: ${jsonCouponStats.data.totalUsageCount}`)

    // Also check alias route at /api/admin/coupons/statistics
    const resAlias = await fetch(`${BASE_URL}/api/admin/coupons/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert(resAlias.status === 200, '200 OK on alias route /api/admin/coupons/statistics')
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-006: Order Rejection Lifecycle
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-006] Order Rejection Lifecycle ---')
  {
    // Find a non-orphan order with an existing course
    const order = await prisma.order.findFirst({
      where: {
        course: {
          isNot: null
        }
      }
    })
    if (!order) throw new Error('No valid order found!')

    const testRejectionReason = 'Học viên yêu cầu hủy đơn do thanh toán nhầm'
    const resRejectOrder = await fetch(`${BASE_URL}/api/orders/${order.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'rejected',
        rejectedReason: testRejectionReason
      })
    })

    const jsonRejectOrder = await resRejectOrder.json()
    assert(resRejectOrder.status === 200, '200 OK updating order status to rejected')
    assert(String(jsonRejectOrder.data.status).toLowerCase() === 'rejected', 'Order status is rejected')
    assert(jsonRejectOrder.data.rejectedReason === testRejectionReason, 'rejectedReason returned in response')
    assert(jsonRejectOrder.data.rejectedAt !== null, 'rejectedAt timestamp is populated')

    // CRITICAL: Ensure order still exists in Database (NOT deleted!)
    const dbOrder = await prisma.order.findUnique({ where: { id: order.id } })
    assert(dbOrder !== null, 'ORDER IS RETAINED IN DATABASE (NOT DELETED!)')
    assert(dbOrder?.status === 'REJECTED', 'Database record has status REJECTED')
    assert(dbOrder?.rejectedReason === testRejectionReason, 'rejectedReason is persisted')

    // Query filter ?status=rejected
    const resFilterRejected = await fetch(`${BASE_URL}/api/orders?status=rejected`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert(resFilterRejected.status === 200, '200 OK querying /api/orders?status=rejected')
    const jsonFilterRejected = await resFilterRejected.json()
    const foundInList = jsonFilterRejected.data.orders.some((o: any) => o.id === order.id)
    assert(foundInList, 'Rejected order is retrieved by ?status=rejected filter')

    // Restore original status
    await prisma.order.update({
      where: { id: order.id },
      data: { status: order.status, rejectedReason: null, rejectedAt: null }
    })
    console.log(`    ✓ Restored order ${order.id} back to original status ${order.status}`)
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-007: Admin Dashboard Summary
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-007] Admin Dashboard Summary ---')
  {
    const resSummary = await fetch(`${BASE_URL}/api/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
    assert(resSummary.status === 200, '200 OK fetching /api/admin/dashboard/summary')
    const jsonSummary = await resSummary.json()
    assert(jsonSummary.success === true, 'Response success is true')
    assert(typeof jsonSummary.data.counts.totalUsers === 'number', 'counts.totalUsers is number')
    assert(typeof jsonSummary.data.counts.totalStudents === 'number', 'counts.totalStudents is number')
    assert(typeof jsonSummary.data.counts.totalTeachers === 'number', 'counts.totalTeachers is number')
    assert(typeof jsonSummary.data.counts.totalAdmins === 'number', 'counts.totalAdmins is number')
    assert(typeof jsonSummary.data.counts.totalCourses === 'number', 'counts.totalCourses is number')
    assert(typeof jsonSummary.data.counts.pendingCourses === 'number', 'counts.pendingCourses is number')
    assert(typeof jsonSummary.data.counts.approvedCourses === 'number', 'counts.approvedCourses is number')
    assert(typeof jsonSummary.data.counts.rejectedCourses === 'number', 'counts.rejectedCourses is number')
    assert(typeof jsonSummary.data.counts.totalOrders === 'number', 'counts.totalOrders is number')
    assert(typeof jsonSummary.data.counts.totalComments === 'number', 'counts.totalComments is number')
    assert(typeof jsonSummary.data.financials.totalRevenue === 'number', 'financials.totalRevenue is number')
    assert(typeof jsonSummary.data.financials.conversionRate === 'number', 'financials.conversionRate is number')
    assert(Array.isArray(jsonSummary.data.pendingTasks), 'pendingTasks is array')
    assert(Array.isArray(jsonSummary.data.recentUsers), 'recentUsers is array')
    console.log(`    Dashboard summary metrics: Users=${jsonSummary.data.counts.totalUsers}, Courses=${jsonSummary.data.counts.totalCourses}, Orders=${jsonSummary.data.counts.totalOrders}, Revenue=${jsonSummary.data.financials.totalRevenue}`)
  }

  // -------------------------------------------------------------------------
  // BE-F9.11-008: Server-side Self-Lockout Protection
  // -------------------------------------------------------------------------
  console.log('\n--- [BE-F9.11-008] Server-side Self-Lockout Protection ---')
  {
    // Try to lock own account
    const resSelfLock = await fetch(`${BASE_URL}/api/users/admin/lock/${adminUser.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'inactive' })
    })
    assert(resSelfLock.status === 400, '400 Bad Request when admin tries to lock own account')
    const jsonSelfLock = await resSelfLock.json()
    assert(jsonSelfLock.errorCode === 'SELF_LOCK_BLOCKED', 'Error code is SELF_LOCK_BLOCKED')
    console.log(`    Message: "${jsonSelfLock.message}"`)

    // Try to demote own account
    const resSelfDemote = await fetch(`${BASE_URL}/api/users/admin/role/${adminUser.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'user' })
    })
    assert(resSelfDemote.status === 400, '400 Bad Request when admin tries to demote own role')
    const jsonSelfDemote = await resSelfDemote.json()
    assert(jsonSelfDemote.errorCode === 'SELF_DEMOTE_BLOCKED', 'Error code is SELF_DEMOTE_BLOCKED')
    console.log(`    Message: "${jsonSelfDemote.message}"`)

    // Verify PUT /api/admin/users/:id also protects
    const resAdminPutLock = await fetch(`${BASE_URL}/api/admin/users/${adminUser.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'inactive' })
    })
    assert(resAdminPutLock.status === 400, '400 Bad Request on PUT /api/admin/users/:id self-lock attempt')
  }

  console.log('\n===============================================================')
  console.log(`TEST SUITE RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%)`)
  console.log('===============================================================')

  await prisma.$disconnect()
  process.exit(passedTests === totalTests ? 0 : 1)
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err)
  process.exit(1)
})
