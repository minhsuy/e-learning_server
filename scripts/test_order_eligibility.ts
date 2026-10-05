import { prisma } from '~/config/prisma'
import { createOrderService, updateOrderStatusService } from '~/services/order.service'
import { createCouponService } from '~/services/coupon.service'
import { CourseStatus, CourseType } from '@prisma/client'

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition: boolean, message: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ PASS: ${message}`)
  } else {
    failedTests++
    console.error(`  ✗ FAIL: ${message}`)
  }
}

async function runEligibilityTests() {
  console.log('=====================================================')
  console.log('PHASE 6: ORDER PURCHASE ELIGIBILITY VERIFICATION')
  console.log('Testing isDestroyed and status === PENDING constraints')
  console.log('=====================================================\n')

  // Capture initial database state
  const [initOrders, initCoupons, initCouponCourses, initEnrollments] = await Promise.all([
    prisma.order.count(),
    prisma.coupon.count(),
    prisma.couponCourse.count(),
    prisma.enrollment.count()
  ])

  console.log(`Initial DB State: orders=${initOrders}, coupons=${initCoupons}, coupon_courses=${initCouponCourses}, enrollments=${initEnrollments}\n`)

  const authorId = 'c55de839-f059-519c-8820-b16aa17fb9c3' // Admin
  const buyerId = '02e8e13a-dab2-5fb6-a14f-933ac125edca' // Student

  // We will track all temporary IDs created to ensure 100% cleanup
  const createdCourseIds: string[] = []
  const createdCouponIds: string[] = []
  const createdOrderIds: string[] = []
  const createdEnrollmentKeys: { userId: string; courseId: string }[] = []

  try {
    // -----------------------------------------------------------------------
    // Setup 100% Discount Coupon Fixture
    // -----------------------------------------------------------------------
    const coupon100Res = await createCouponService({
      payload: {
        title: '100% Off Promo',
        code: `FREE100_${Date.now().toString().slice(-4)}`,
        type: 'PERCENTAGE',
        value: 100,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 86400000),
        limit: 100,
        active: true,
        courses: []
      },
      userId: authorId,
      role: 'ADMIN'
    })
    const coupon100Code = coupon100Res.data.code
    createdCouponIds.push(coupon100Res.data.id)

    // =======================================================================
    // A. DESTROYED COURSE TESTS
    // =======================================================================
    console.log('--- A. DESTROYED COURSE TESTS ---')

    // Test 1: Course with isDestroyed = true, price > 0
    const destroyedPaid = await prisma.course.create({
      data: {
        title: 'Test Course Destroyed Paid',
        slug: `destroyed-paid-${Date.now()}`,
        price: 150,
        type: CourseType.PAID,
        status: CourseStatus.APPROVED,
        isDestroyed: true,
        authorId
      }
    })
    createdCourseIds.push(destroyedPaid.id)

    const preOrderCountT1 = await prisma.order.count()
    const preEnrollCountT1 = await prisma.enrollment.count()
    const resT1 = await createOrderService({
      payload: { courseId: destroyedPaid.id },
      userId: buyerId
    })
    const postOrderCountT1 = await prisma.order.count()
    const postEnrollCountT1 = await prisma.enrollment.count()

    assert(
      resT1.success === false && resT1.statusCode === 400 && resT1.message.includes('deleted or no longer available'),
      'Test 1: isDestroyed=true, price>0 -> Order rejected with 400'
    )
    assert(postOrderCountT1 === preOrderCountT1, 'Test 1: Zero new orders created in DB')
    assert(postEnrollCountT1 === preEnrollCountT1, 'Test 1: Zero new enrollments created in DB')

    // Test 2: Course with isDestroyed = true, price = 0 (Free)
    const destroyedFree = await prisma.course.create({
      data: {
        title: 'Test Course Destroyed Free',
        slug: `destroyed-free-${Date.now()}`,
        price: 0,
        type: CourseType.FREE,
        status: CourseStatus.APPROVED,
        isDestroyed: true,
        authorId
      }
    })
    createdCourseIds.push(destroyedFree.id)

    const preOrderCountT2 = await prisma.order.count()
    const preEnrollCountT2 = await prisma.enrollment.count()
    const resT2 = await createOrderService({
      payload: { courseId: destroyedFree.id },
      userId: buyerId
    })
    const postOrderCountT2 = await prisma.order.count()
    const postEnrollCountT2 = await prisma.enrollment.count()

    assert(
      resT2.success === false && resT2.statusCode === 400 && resT2.message.includes('deleted or no longer available'),
      'Test 2: isDestroyed=true, price=0 -> Order rejected with 400'
    )
    assert(postOrderCountT2 === preOrderCountT2, 'Test 2: Zero new orders created in DB')
    assert(postEnrollCountT2 === preEnrollCountT2, 'Test 2: Zero auto-enrollment performed')

    // Test 3: Course with isDestroyed = true, 100% coupon discount
    const preCouponUsedT3 = (await prisma.coupon.findUnique({ where: { id: coupon100Res.data.id } }))?.used ?? 0
    const resT3 = await createOrderService({
      payload: { courseId: destroyedPaid.id, couponCode: coupon100Code },
      userId: buyerId
    })
    const postCouponUsedT3 = (await prisma.coupon.findUnique({ where: { id: coupon100Res.data.id } }))?.used ?? 0

    assert(
      resT3.success === false && resT3.statusCode === 400 && resT3.message.includes('deleted or no longer available'),
      'Test 3: isDestroyed=true, 100% coupon -> Order rejected with 400'
    )
    assert(postCouponUsedT3 === preCouponUsedT3, 'Test 3: Coupon usage count unchanged')

    // =======================================================================
    // B. PENDING COURSE TESTS
    // =======================================================================
    console.log('\n--- B. PENDING COURSE TESTS ---')

    // Test 4: Course with status = PENDING, price > 0
    const pendingPaid = await prisma.course.create({
      data: {
        title: 'Test Course Pending Paid',
        slug: `pending-paid-${Date.now()}`,
        price: 200,
        type: CourseType.PAID,
        status: CourseStatus.PENDING,
        isDestroyed: false,
        authorId
      }
    })
    createdCourseIds.push(pendingPaid.id)

    const preOrderCountT4 = await prisma.order.count()
    const resT4 = await createOrderService({
      payload: { courseId: pendingPaid.id },
      userId: buyerId
    })
    const postOrderCountT4 = await prisma.order.count()

    assert(
      resT4.success === false && resT4.statusCode === 400 && resT4.message.includes('pending approval'),
      'Test 4: status=PENDING, price>0 -> Order rejected with 400'
    )
    assert(postOrderCountT4 === preOrderCountT4, 'Test 4: Zero new orders created in DB')

    // Test 5: Course with status = PENDING, price = 0 (Free)
    const pendingFree = await prisma.course.create({
      data: {
        title: 'Test Course Pending Free',
        slug: `pending-free-${Date.now()}`,
        price: 0,
        type: CourseType.FREE,
        status: CourseStatus.PENDING,
        isDestroyed: false,
        authorId
      }
    })
    createdCourseIds.push(pendingFree.id)

    const preEnrollCountT5 = await prisma.enrollment.count()
    const resT5 = await createOrderService({
      payload: { courseId: pendingFree.id },
      userId: buyerId
    })
    const postEnrollCountT5 = await prisma.enrollment.count()

    assert(
      resT5.success === false && resT5.statusCode === 400 && resT5.message.includes('pending approval'),
      'Test 5: status=PENDING, price=0 -> Order rejected with 400'
    )
    assert(postEnrollCountT5 === preEnrollCountT5, 'Test 5: Zero new enrollments created in DB')

    // Test 6: Course with status = PENDING, 100% coupon discount
    const preCouponUsedT6 = (await prisma.coupon.findUnique({ where: { id: coupon100Res.data.id } }))?.used ?? 0
    const resT6 = await createOrderService({
      payload: { courseId: pendingPaid.id, couponCode: coupon100Code },
      userId: buyerId
    })
    const postCouponUsedT6 = (await prisma.coupon.findUnique({ where: { id: coupon100Res.data.id } }))?.used ?? 0

    assert(
      resT6.success === false && resT6.statusCode === 400 && resT6.message.includes('pending approval'),
      'Test 6: status=PENDING, 100% coupon -> Order rejected with 400'
    )
    assert(postCouponUsedT6 === preCouponUsedT6, 'Test 6: Coupon usage count unchanged')

    // =======================================================================
    // C. ELIGIBLE COURSE TESTS
    // =======================================================================
    console.log('\n--- C. ELIGIBLE COURSE TESTS ---')

    // Test 7: Eligible Course (APPROVED, not destroyed), price > 0
    const eligiblePaid = await prisma.course.create({
      data: {
        title: 'Test Course Eligible Paid',
        slug: `eligible-paid-${Date.now()}`,
        price: 99.99,
        type: CourseType.PAID,
        status: CourseStatus.APPROVED,
        isDestroyed: false,
        authorId
      }
    })
    createdCourseIds.push(eligiblePaid.id)

    const resT7 = await createOrderService({
      payload: { courseId: eligiblePaid.id },
      userId: buyerId
    })
    assert(
      resT7.success === true && resT7.data.status === 'PENDING' && Number(resT7.data.total) === 99.99,
      'Test 7: Eligible paid course creates PENDING order successfully'
    )
    createdOrderIds.push(resT7.data.id)

    // Clean up T7 order using approved REJECTED hard-delete to verify rollback
    await updateOrderStatusService({
      id: resT7.data.id,
      payload: { status: 'REJECTED' },
      userId: authorId,
      role: 'ADMIN'
    })

    // Test 8: Eligible Course (APPROVED, not destroyed), price = 0 (Free auto-enroll)
    const eligibleFree = await prisma.course.create({
      data: {
        title: 'Test Course Eligible Free',
        slug: `eligible-free-${Date.now()}`,
        price: 0,
        type: CourseType.FREE,
        status: CourseStatus.APPROVED,
        isDestroyed: false,
        authorId
      }
    })
    createdCourseIds.push(eligibleFree.id)
    const initSoldT8 = eligibleFree.sold

    const resT8 = await createOrderService({
      payload: { courseId: eligibleFree.id },
      userId: buyerId
    })
    assert(
      resT8.success === true && resT8.data.status === 'COMPLETED' && Number(resT8.data.total) === 0,
      'Test 8: Eligible free course automatically completes order (COMPLETED)'
    )
    createdOrderIds.push(resT8.data.id)
    createdEnrollmentKeys.push({ userId: buyerId, courseId: eligibleFree.id })

    // Check enrollment created and sold count incremented exactly once
    const enrollmentT8 = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: buyerId, courseId: eligibleFree.id } }
    })
    const courseAfterT8 = await prisma.course.findUnique({ where: { id: eligibleFree.id } })
    assert(enrollmentT8 !== null, 'Test 8: Enrollment record created for free order')
    assert(courseAfterT8?.sold === initSoldT8 + 1, 'Test 8: Course.sold incremented by exactly 1')

    // Rollback T8 using REJECTED
    await updateOrderStatusService({
      id: resT8.data.id,
      payload: { status: 'REJECTED' },
      userId: authorId,
      role: 'ADMIN'
    })

    // Test 9: Eligible Course (APPROVED, not destroyed), price > 0, 100% coupon discount
    const eligibleCoupon = await prisma.course.create({
      data: {
        title: 'Test Course Eligible Coupon 100',
        slug: `eligible-coupon-${Date.now()}`,
        price: 120,
        type: CourseType.PAID,
        status: CourseStatus.APPROVED,
        isDestroyed: false,
        authorId
      }
    })
    createdCourseIds.push(eligibleCoupon.id)
    const initSoldT9 = eligibleCoupon.sold
    const initUsedT9 = (await prisma.coupon.findUnique({ where: { id: coupon100Res.data.id } }))?.used ?? 0

    const resT9 = await createOrderService({
      payload: { courseId: eligibleCoupon.id, couponCode: coupon100Code },
      userId: buyerId
    })
    assert(
      resT9.success === true && resT9.data.status === 'COMPLETED' && Number(resT9.data.total) === 0,
      'Test 9: 100% coupon discount on eligible course results in COMPLETED order'
    )
    createdOrderIds.push(resT9.data.id)
    createdEnrollmentKeys.push({ userId: buyerId, courseId: eligibleCoupon.id })

    const enrollmentT9 = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: buyerId, courseId: eligibleCoupon.id } }
    })
    const courseAfterT9 = await prisma.course.findUnique({ where: { id: eligibleCoupon.id } })
    const couponAfterT9 = await prisma.coupon.findUnique({ where: { id: coupon100Res.data.id } })
    assert(enrollmentT9 !== null, 'Test 9: Enrollment record created for 100% coupon order')
    assert(courseAfterT9?.sold === initSoldT9 + 1, 'Test 9: Course.sold incremented by exactly 1')
    assert(couponAfterT9?.used === initUsedT9 + 1, 'Test 9: Coupon.used incremented by exactly 1')

    // Rollback T9 using REJECTED
    await updateOrderStatusService({
      id: resT9.data.id,
      payload: { status: 'REJECTED' },
      userId: authorId,
      role: 'ADMIN'
    })

    // =======================================================================
    // D. REGRESSION TESTS
    // =======================================================================
    console.log('\n--- D. REGRESSION TESTS ---')

    // Duplicate completed order check
    const dupCompletedRes = await createOrderService({
      payload: { courseId: 'f0dde7bb-1bf6-5602-a489-cd324132c68a' }, // minhsuyyyyy already completed
      userId: 'c55de839-f059-519c-8820-b16aa17fb9c3'
    })
    assert(
      dupCompletedRes.success === false && dupCompletedRes.statusCode === 400 && dupCompletedRes.message.includes('already enrolled'),
      'Regression: Duplicate completed order check remains active'
    )

    // Self-purchase check
    const selfPurchaseRes = await createOrderService({
      payload: { courseId: 'f0dde7bb-1bf6-5602-a489-cd324132c68a' },
      userId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4' // Author
    })
    assert(
      selfPurchaseRes.success === false && selfPurchaseRes.statusCode === 400 && selfPurchaseRes.message.includes('own course'),
      'Regression: Self-purchase check remains active'
    )

    // Orphan Order checks
    const orphanTeacherRes = await updateOrderStatusService({
      id: '5bc2c64a-9759-5776-bc4e-693908008d91', // DH-7806607
      payload: { status: 'COMPLETED' },
      userId: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
      role: 'TEACHER'
    })
    assert(
      orphanTeacherRes.success === false && orphanTeacherRes.statusCode === 403,
      'Regression: Teacher forbidden on orphan order (403)'
    )

  } finally {
    // -----------------------------------------------------------------------
    // Comprehensive Clean-up to Guarantee 100% Database Safety
    // -----------------------------------------------------------------------
    console.log('\n--- CLEANING UP FIXTURES ---')

    // Clean any remaining orders created in test
    for (const orderId of createdOrderIds) {
      await prisma.order.deleteMany({ where: { id: orderId } })
    }

    // Clean any remaining enrollments created in test
    for (const key of createdEnrollmentKeys) {
      await prisma.enrollment.deleteMany({ where: { userId: key.userId, courseId: key.courseId } })
    }

    // Clean coupons created in test
    for (const couponId of createdCouponIds) {
      await prisma.couponCourse.deleteMany({ where: { couponId } })
      await prisma.coupon.deleteMany({ where: { id: couponId } })
    }

    // Clean test notifications created during test orders
    for (const orderId of createdOrderIds) {
      await prisma.notification.deleteMany({ where: { relatedId: orderId } })
    }

    // Clean courses created in test
    for (const courseId of createdCourseIds) {
      await prisma.course.deleteMany({ where: { id: courseId } })
    }

    // Verify final baseline invariant
    const [finalOrders, finalCoupons, finalCouponCourses, finalEnrollments] = await Promise.all([
      prisma.order.count(),
      prisma.coupon.count(),
      prisma.couponCourse.count(),
      prisma.enrollment.count()
    ])

    console.log(`Final DB State: orders=${finalOrders}, coupons=${finalCoupons}, coupon_courses=${finalCouponCourses}, enrollments=${finalEnrollments}`)

    assert(finalOrders === initOrders, `Database Safety: orders count preserved (initial: ${initOrders}, final: ${finalOrders})`)
    assert(finalCoupons === initCoupons, `Database Safety: coupons count preserved (initial: ${initCoupons}, final: ${finalCoupons})`)
    assert(finalCouponCourses === initCouponCourses, `Database Safety: coupon_courses count preserved (initial: ${initCouponCourses}, final: ${finalCouponCourses})`)
    assert(finalEnrollments === initEnrollments, `Database Safety: enrollments count preserved (initial: ${initEnrollments}, final: ${finalEnrollments})`)
  }

  console.log('\n=====================================================')
  console.log(`TOTAL ELIGIBILITY TESTS: ${totalTests}`)
  console.log(`PASSED: ${passedTests}`)
  console.log(`FAILED: ${failedTests}`)
  console.log('=====================================================\n')

  await prisma.$disconnect()
  if (failedTests > 0) process.exit(1)
}

runEligibilityTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
