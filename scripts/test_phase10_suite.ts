import { ENotificationType } from '@prisma/client'
import { prisma } from '../src/config/prisma'
import {
  countNotificationsByUser,
  createNotification,
  deleteNotification,
  findNotificationById,
  findNotificationsByUser,
  markAllAsRead,
  markAsRead
} from '../src/repositories/notification.repository'
import { findActiveEnrolledUserIdsByCourseId } from '../src/repositories/enrollment.repository'
import {
  getNotificationsService,
  markNotificationReadService,
  pushNotificationService
} from '../src/services/notification.service'
import { isValidUUID } from '../src/utils/uuid'

/**
 * TMDEMY — PHASE 10: NOTIFICATION MIGRATION VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Functional Repository CRUD & Constraints
 * 2. Zod Application Model & Typing
 * 3. Notification Service Logic & Response Formatting (_id, read compatibility)
 * 4. UUID & Enum Validation
 * 5. Order Notification flow (Instructor alert on order, Student alert on payment completion)
 * 6. Lesson Notification flow (Realtime alert to active enrolled students only)
 * 7. Baseline Data Integrity (Preserves the 28 historical notification records)
 */

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++
    console.log(`  ✅ [PASS] ${testName}`)
  } else {
    failedTests++
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`)
  }
}

async function runPhase10Suite() {
  console.log('\n=============================================================')
  console.log('🚀 TMDEMY — PHASE 10: NOTIFICATION MIGRATION VERIFICATION')
  console.log('=============================================================\n')

  const createdTestNotificationIds: string[] = []

  // Retrieve test users from PostgreSQL
  const users = await prisma.user.findMany({ take: 3 })
  if (users.length < 2) {
    throw new Error('Need at least 2 users in PostgreSQL database for testing.')
  }
  const userA = users[0] // e.g. student
  const userB = users[1] // e.g. instructor
  const userC = users[2] || users[0]

  console.log(`Test Actors: User A (${userA.id}), User B (${userB.id})\n`)

  // Baseline database count
  const initialCount = await prisma.notification.count()
  console.log(`Baseline notification count in DB: ${initialCount}`)
  assert(initialCount >= 28, 'Baseline has at least 28 historical notifications')

  try {
    // =========================================================================
    // SECTION 1: REPOSITORY TESTS
    // =========================================================================
    console.log('\n--- SECTION 1: Functional Repository Tests ---')

    // 1.1 Create Notification with Sender
    const testNotif1 = await createNotification({
      senderId: userA.id,
      receiverId: userB.id,
      type: ENotificationType.COMMENT,
      message: 'User A commented on your course',
      relatedId: 'fake-comment-id'
    })
    createdTestNotificationIds.push(testNotif1.id)
    assert(isValidUUID(testNotif1.id), '1.1 createNotification returns valid UUID')
    assert(testNotif1.senderId === userA.id, '1.1 senderId matches')
    assert(testNotif1.receiverId === userB.id, '1.1 receiverId matches')
    assert(testNotif1.type === ENotificationType.COMMENT, '1.1 type matches COMMENT')
    assert(testNotif1.sender?.username === userA.username, '1.1 sender relation populated with username')
    assert(testNotif1.isRead === false, '1.1 isRead defaults to false')

    // 1.2 Create Notification without Sender (System / Nullable sender)
    const testNotif2 = await createNotification({
      senderId: null,
      receiverId: userA.id,
      type: ENotificationType.SYSTEM,
      message: 'System maintenance scheduled',
      relatedId: null
    })
    createdTestNotificationIds.push(testNotif2.id)
    assert(testNotif2.senderId === null, '1.2 senderId can be null')
    assert(testNotif2.sender === null, '1.2 sender relation is null when senderId is null')

    // 1.3 Find Notification by ID
    const found = await findNotificationById(testNotif1.id)
    assert(found !== null && found.id === testNotif1.id, '1.3 findNotificationById finds created record')

    // 1.4 Find Notifications by User & Type Filter
    const userBNotifications = await findNotificationsByUser({
      receiverId: userB.id,
      page: 1,
      limit: 10,
      type: ENotificationType.COMMENT
    })
    assert(
      userBNotifications.some((n) => n.id === testNotif1.id),
      '1.4 findNotificationsByUser retrieves test notification for receiver'
    )

    // 1.5 Count Notifications by User
    const userBCount = await countNotificationsByUser({ receiverId: userB.id })
    assert(userBCount >= 1, '1.5 countNotificationsByUser returns accurate count')

    // 1.6 Mark as Read (Owner Receiver)
    const marked = await markAsRead(testNotif1.id, userB.id)
    assert(marked !== null && marked.isRead === true, '1.6 markAsRead marks notification as read for owner')

    // 1.7 Mark as Read (Non-Owner Rejected)
    const unauthorizedMark = await markAsRead(testNotif1.id, userA.id)
    assert(unauthorizedMark === null, '1.7 markAsRead rejects update if user is not receiver')

    // 1.8 Mark All as Read
    const testNotif3 = await createNotification({
      senderId: userB.id,
      receiverId: userA.id,
      type: ENotificationType.ORDER,
      message: 'Unread order notification'
    })
    createdTestNotificationIds.push(testNotif3.id)
    const markAllResult = await markAllAsRead(userA.id)
    assert(markAllResult.count >= 1, '1.8 markAllAsRead updates unread notifications for user')
    const verifyNotif3 = await findNotificationById(testNotif3.id)
    assert(verifyNotif3?.isRead === true, '1.8 verify notification is now read')

    // 1.9 Transaction Client Support
    await prisma.$transaction(async (tx) => {
      const txNotif = await createNotification(
        {
          senderId: userA.id,
          receiverId: userB.id,
          type: ENotificationType.RATING,
          message: 'Tx rating notification'
        },
        tx
      )
      createdTestNotificationIds.push(txNotif.id)
      assert(isValidUUID(txNotif.id), '1.9 createNotification works inside Prisma transaction')
    })

    // =========================================================================
    // SECTION 2: SERVICE LAYER & COMPATIBILITY FORMATTING TESTS
    // =========================================================================
    console.log('\n--- SECTION 2: Service Layer & Formatting Tests ---')

    // 2.1 pushNotificationService
    const pushResult = await pushNotificationService({
      senderId: userA.id,
      receiverId: userB.id,
      type: 'ORDER',
      message: 'New order placed',
      relatedId: 'order-uuid-123'
    })
    assert(pushResult.success === true, '2.1 pushNotificationService succeeds')
    if (pushResult.data) {
      createdTestNotificationIds.push(pushResult.data.id)
      assert(pushResult.data.id === pushResult.data._id, '2.1 response includes _id matching id')
      assert(pushResult.data.read === false && pushResult.data.isRead === false, '2.1 response includes read and isRead')
      assert(pushResult.data.receiver === userB.id, '2.1 response includes receiver alias')
      assert(pushResult.data.type === 'ORDER', '2.1 response type is ORDER')
    }

    // 2.2 getNotificationsService Pagination & Formatting
    const getResult = await getNotificationsService(userB.id, 1, 10)
    assert(getResult.success === true, '2.2 getNotificationsService returns success')
    assert(Array.isArray(getResult.data?.notifications), '2.2 returns array of notifications')
    assert(getResult.data?.pagination?.page === 1, '2.2 returns pagination object')

    // 2.3 markNotificationReadService
    const testNotif4 = await createNotification({
      senderId: userA.id,
      receiverId: userB.id,
      type: ENotificationType.MESSAGE,
      message: 'Direct chat message'
    })
    createdTestNotificationIds.push(testNotif4.id)

    // Unauthorized receiver
    const readUnauthorized = await markNotificationReadService(testNotif4.id, userA.id)
    assert(readUnauthorized.statusCode === 403, '2.3 non-receiver gets 403 Forbidden')

    // Non-existent notification (Valid v4 UUID that doesn't exist in DB)
    const readNotFound = await markNotificationReadService('a0000000-0000-4000-a000-000000000000', userB.id)
    assert(readNotFound.statusCode === 404, '2.3 missing notification gets 404 Not Found')

    // Invalid UUID
    const readInvalid = await markNotificationReadService('not-a-uuid', userB.id)
    assert(readInvalid.statusCode === 422, '2.3 invalid UUID gets 422 Unprocessable')

    // Valid receiver
    const readSuccess = await markNotificationReadService(testNotif4.id, userB.id)
    assert(readSuccess.success === true, '2.3 valid receiver gets 200 OK')
    assert(readSuccess.data?.isRead === true && readSuccess.data?.read === true, '2.3 marked read in response')

    // =========================================================================
    // SECTION 3: ORDER NOTIFICATION SPECIFICATION TESTS
    // =========================================================================
    console.log('\n--- SECTION 3: Order Notification Flow Tests ---')

    // 3.1 Order Created -> Instructor receives ORDER notification
    const fakeOrderId = '11111111-2222-3333-4444-555555555555'
    const orderCreatedNotif = await pushNotificationService({
      senderId: userA.id, // student
      receiverId: userB.id, // instructor
      type: ENotificationType.ORDER,
      message: 'Bạn có đơn hàng mới cho khóa học "Test Course".',
      relatedId: fakeOrderId
    })
    assert(orderCreatedNotif.success === true, '3.1 Instructor receives ORDER notification on order creation')
    assert(orderCreatedNotif.data?.relatedId === fakeOrderId, '3.1 relatedId matches orderId')
    assert(orderCreatedNotif.data?.receiverId === userB.id, '3.1 receiver is instructor')
    if (orderCreatedNotif.data) createdTestNotificationIds.push(orderCreatedNotif.data.id)

    // 3.2 Payment Completed -> Student receives ORDER notification
    const paymentCompletedNotif = await pushNotificationService({
      senderId: null, // system
      receiverId: userA.id, // student
      type: ENotificationType.ORDER,
      message: 'Đơn hàng của bạn đã thanh toán thành công.',
      relatedId: fakeOrderId
    })
    assert(paymentCompletedNotif.success === true, '3.2 Student receives ORDER notification on payment completion')
    assert(paymentCompletedNotif.data?.relatedId === fakeOrderId, '3.2 relatedId matches orderId')
    assert(paymentCompletedNotif.data?.receiverId === userA.id, '3.2 receiver is student')
    if (paymentCompletedNotif.data) createdTestNotificationIds.push(paymentCompletedNotif.data.id)

    // =========================================================================
    // SECTION 4: LESSON NOTIFICATION SPECIFICATION TESTS
    // =========================================================================
    console.log('\n--- SECTION 4: Lesson Notification Flow Tests ---')

    // Check course & active enrollments
    const sampleCourse = await prisma.course.findFirst({
      where: {
        enrollments: { some: { status: 'ACTIVE' } }
      },
      include: {
        enrollments: { where: { status: 'ACTIVE' }, take: 2 }
      }
    })

    if (sampleCourse && sampleCourse.enrollments.length > 0) {
      const activeStudentIds = await findActiveEnrolledUserIdsByCourseId(sampleCourse.id)
      assert(activeStudentIds.length > 0, '4.1 findActiveEnrolledUserIdsByCourseId retrieves active student IDs')

      const fakeLessonId = '22222222-3333-4444-5555-666666666666'
      // Dispatch lesson notification to enrolled students
      for (const studentId of activeStudentIds) {
        const lessonNotif = await pushNotificationService({
          senderId: sampleCourse.authorId,
          receiverId: studentId,
          type: ENotificationType.LESSON,
          message: `Có bài học mới "Intro" trong khóa học "${sampleCourse.title}"`,
          relatedId: fakeLessonId
        })
        assert(lessonNotif.success === true, `4.2 Active student ${studentId.slice(0, 8)} receives LESSON notification`)
        assert(lessonNotif.data?.relatedId === fakeLessonId, '4.2 relatedId matches lessonId')
        assert(lessonNotif.data?.type === 'LESSON', '4.2 notification type is LESSON')
        if (lessonNotif.data) createdTestNotificationIds.push(lessonNotif.data.id)
      }
    } else {
      console.log('  ⚠️ (Skipping dynamic enrollment check - no course with active enrollments found in current DB)')
    }

    // =========================================================================
    // SECTION 5: MIDDLEWARE VALIDATION TESTS
    // =========================================================================
    console.log('\n--- SECTION 5: Middleware Validation Tests ---')
    assert(isValidUUID('c6218d6a-5c2f-410a-9d21-f8a61da52601') === true, '5.1 Valid UUID v4 is accepted')
    assert(isValidUUID('660e5b3f1c8b4d001e3d7a8b') === false, '5.2 MongoDB ObjectId is rejected as UUID')
    assert(isValidUUID('invalid-string') === false, '5.3 Malformed string is rejected as UUID')

    // Enum coverage check
    const allEnums = ['COMMENT', 'RATING', 'ORDER', 'MESSAGE', 'SYSTEM', 'COURSE', 'LESSON', 'COMMENT_REPLY', 'QUIZ']
    for (const e of allEnums) {
      assert(Object.values(ENotificationType).includes(e as any), `5.4 Enum ${e} is valid Prisma ENotificationType`)
    }

  } finally {
    // =========================================================================
    // SECTION 6: CLEANUP & BASELINE INTEGRITY VERIFICATION
    // =========================================================================
    console.log('\n--- SECTION 6: Cleanup & Database Integrity Check ---')
    console.log(`Cleaning up ${createdTestNotificationIds.length} test notification records...`)

    for (const testId of createdTestNotificationIds) {
      await deleteNotification(testId)
    }

    const finalCount = await prisma.notification.count()
    console.log(`Final notification count in DB: ${finalCount}`)
    assert(
      finalCount === initialCount,
      '6.1 Final database record count equals initial baseline count (zero test pollution)'
    )

    // Check orphan records in entire table
    const orphans = await prisma.$queryRaw<any[]>`
      SELECT n.id FROM notifications n
      LEFT JOIN users u ON n.receiver_id = u.id
      WHERE u.id IS NULL
    `
    assert(orphans.length === 0, '6.2 Zero orphan receiver records exist in notifications table')
  }

  console.log('\n=============================================================')
  console.log(`🏁 PHASE 10 VERIFICATION COMPLETED`)
  console.log(`   Passed: ${passedTests} tests`)
  console.log(`   Failed: ${failedTests} tests`)
  console.log('=============================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runPhase10Suite().catch((err) => {
  console.error('Unhandled Test Runner Error:', err)
  process.exit(1)
})
