import { EEnrollmentStatus, ENotificationType, UserRole } from '@prisma/client'
import { prisma } from '../src/config/prisma'
import { findActiveEnrolledUserIdsByCourseId } from '../src/repositories/enrollment.repository'
import { createLessonService } from '../src/services/lesson.service'
import { getNotificationsService } from '../src/services/notification.service'
import { initSocket, getIO } from '../src/socket/initSocket'
import { createServer } from 'http'
import express from 'express'

let passed = 0
let failed = 0

function assert(condition: boolean, desc: string, detail?: string) {
  if (condition) {
    passed++
    console.log(`  ✅ [PASS] ${desc}`)
  } else {
    failed++
    console.error(`  ❌ [FAIL] ${desc}${detail ? ` -> ${detail}` : ''}`)
  }
}

async function run() {
  console.log('=============================================================')
  console.log('🧪 TEST SUITE: F7.5-B.3 LESSON NOTIFICATION FIX VERIFICATION')
  console.log('=============================================================\n')

  // Clean any stale test courses if present
  await prisma.course.deleteMany({
    where: { title: { startsWith: 'Test Course Lesson Notif Fix' } }
  })

  // Setup Socket.IO mock server to track emissions
  const app = express()
  const server = createServer(app)
  initSocket(server)
  const io = getIO()

  const capturedEmits: { room: string; event: string; payload: any }[] = []
  io.to = ((room: string | string[]) => {
    const roomStr = Array.isArray(room) ? room.join(',') : room
    return {
      emit: (event: string, payload: any) => {
        capturedEmits.push({ room: roomStr, event, payload })
        return true
      }
    } as any
  }) as any

  // Find or setup test course, chapter, teacher, and students
  const teacher = await prisma.user.findFirst({
    where: { role: UserRole.TEACHER }
  })
  if (!teacher) throw new Error('No teacher found in DB')

  // Find users for testing
  const allUsers = await prisma.user.findMany({
    where: { id: { not: teacher.id } },
    take: 4
  })
  if (allUsers.length < 3) throw new Error('Need at least 3 non-teacher users')

  const studentActive = allUsers[0]
  const studentCompleted = allUsers[1]
  const studentCanceled = allUsers[2]

  console.log(`Teacher: ${teacher.username} (${teacher.id})`)
  console.log(`Student ACTIVE: ${studentActive.username} (${studentActive.id})`)
  console.log(`Student COMPLETED: ${studentCompleted.username} (${studentCompleted.id})`)
  console.log(`Student CANCELED: ${studentCanceled.username} (${studentCanceled.id})`)

  // Create temporary course and chapter for clean isolated testing
  const testCategory = await prisma.category.findFirst()
  if (!testCategory) throw new Error('No category found')

  const course = await prisma.course.create({
    data: {
      title: `Test Course Lesson Notif Fix ${Date.now()}`,
      slug: `test-course-notif-fix-${Date.now()}`,
      authorId: teacher.id,
      categoryId: testCategory.id,
      description: 'Test course description'
    }
  })

  const chapter = await prisma.chapter.create({
    data: {
      title: 'Chapter 1: Intro',
      order: 1,
      courseId: course.id
    }
  })

  // Set up enrollments:
  // 1. studentActive -> ACTIVE
  // 2. studentCompleted -> COMPLETED
  // 3. studentCanceled -> CANCELED
  // 4. teacher -> ACTIVE (to verify teacher self-notification is blocked!)
  await prisma.enrollment.createMany({
    data: [
      { userId: studentActive.id, courseId: course.id, status: EEnrollmentStatus.ACTIVE, progress: 20 },
      { userId: studentCompleted.id, courseId: course.id, status: EEnrollmentStatus.COMPLETED, progress: 100 },
      { userId: studentCanceled.id, courseId: course.id, status: EEnrollmentStatus.CANCELED, progress: 0 },
      { userId: teacher.id, courseId: course.id, status: EEnrollmentStatus.ACTIVE, progress: 0 }
    ]
  })

  let createdLessonId = ''
  const createdNotificationIds: string[] = []

  try {
    // -------------------------------------------------------------------------
    // TEST 1: REPOSITORY QUERY
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing findActiveEnrolledUserIdsByCourseId ---')
    const enrolledIds = await findActiveEnrolledUserIdsByCourseId(course.id)

    assert(
      enrolledIds.includes(studentActive.id),
      'Repository includes ACTIVE student'
    )
    assert(
      enrolledIds.includes(studentCompleted.id),
      'Repository includes COMPLETED student'
    )
    assert(
      !enrolledIds.includes(studentCanceled.id),
      'Repository EXCLUDES CANCELED student'
    )
    assert(
      enrolledIds.includes(teacher.id),
      'Repository returns all active/completed enrolled IDs (teacher included at repository level)'
    )
    assert(
      enrolledIds.length === 3,
      `Repository returns exactly 3 enrolled users (ACTIVE + COMPLETED), got ${enrolledIds.length}`
    )

    // -------------------------------------------------------------------------
    // TEST 2: CREATE LESSON SERVICE WITH NOTIFICATION DISPATCH
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing createLessonService & Notification Dispatch ---')
    capturedEmits.length = 0 // reset emits

    const lessonResult = await createLessonService({
      payload: {
        title: 'New Lesson for Notification Test',
        chapter: chapter.id,
        course: course.id,
        duration: 15,
        type: 'video',
        content: 'Test content',
        isDemo: false
      },
      userId: teacher.id,
      role: 'TEACHER'
    })

    assert(lessonResult.success === true, 'createLessonService succeeded')
    createdLessonId = lessonResult.data?.id

    // Check notifications created in DB
    const notifications = await prisma.notification.findMany({
      where: {
        type: ENotificationType.LESSON,
        relatedId: createdLessonId
      }
    })

    notifications.forEach((n) => createdNotificationIds.push(n.id))

    console.log(`Total notifications generated: ${notifications.length}`)

    const activeNotif = notifications.find((n) => n.receiverId === studentActive.id)
    assert(activeNotif !== undefined, 'ACTIVE student received notification in PostgreSQL')
    assert(
      (activeNotif?.metadata as any)?.courseId === course.id,
      'Notification metadata has correct courseId'
    )
    assert(
      (activeNotif?.metadata as any)?.lessonId === createdLessonId,
      'Notification metadata has correct lessonId'
    )

    const completedNotif = notifications.find((n) => n.receiverId === studentCompleted.id)
    assert(completedNotif !== undefined, 'COMPLETED student received notification in PostgreSQL')

    const canceledNotif = notifications.find((n) => n.receiverId === studentCanceled.id)
    assert(canceledNotif === undefined, 'CANCELED student did NOT receive notification')

    const teacherNotif = notifications.find((n) => n.receiverId === teacher.id)
    assert(teacherNotif === undefined, 'Teacher who created lesson did NOT receive notification (self-suppression)')

    // -------------------------------------------------------------------------
    // TEST 3: REST API GET /api/notifications
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing GET /api/notifications for Students ---')
    const activeApiResult = await getNotificationsService(studentActive.id, 1, 10)
    const activeItems = (activeApiResult.data as any)?.notifications || []
    const hasActiveNotif = activeItems.some((n: any) => n.relatedId === createdLessonId)
    assert(hasActiveNotif, 'ACTIVE student sees new lesson notification via getNotificationsService')

    const completedApiResult = await getNotificationsService(studentCompleted.id, 1, 10)
    const completedItems = (completedApiResult.data as any)?.notifications || []
    const hasCompletedNotif = completedItems.some((n: any) => n.relatedId === createdLessonId)
    assert(hasCompletedNotif, 'COMPLETED student sees new lesson notification via getNotificationsService')

    const canceledApiResult = await getNotificationsService(studentCanceled.id, 1, 10)
    const canceledItems = (canceledApiResult.data as any)?.notifications || []
    const hasCanceledNotif = canceledItems.some((n: any) => n.relatedId === createdLessonId)
    assert(!hasCanceledNotif, 'CANCELED student does NOT see new lesson notification via getNotificationsService')

    // -------------------------------------------------------------------------
    // TEST 4: SOCKET.IO REALTIME EMISSION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Socket.IO Realtime Events ---')
    const activeSocketEmit = capturedEmits.find(
      (e) => e.event === 'new_notification' && e.room === studentActive.id
    )
    assert(activeSocketEmit !== undefined, 'Socket.IO emitted "new_notification" to ACTIVE student room')

    const completedSocketEmit = capturedEmits.find(
      (e) => e.event === 'new_notification' && e.room === studentCompleted.id
    )
    assert(completedSocketEmit !== undefined, 'Socket.IO emitted "new_notification" to COMPLETED student room')

    const canceledSocketEmit = capturedEmits.find(
      (e) => e.event === 'new_notification' && e.room === studentCanceled.id
    )
    assert(canceledSocketEmit === undefined, 'Socket.IO did NOT emit event to CANCELED student room')

    const teacherSocketEmit = capturedEmits.find(
      (e) => e.event === 'new_notification' && e.room === teacher.id
    )
    assert(teacherSocketEmit === undefined, 'Socket.IO did NOT emit event to Teacher room')

    // -------------------------------------------------------------------------
    // TEST 5: NO DUPLICATE NOTIFICATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Duplicate Suppression ---')
    const recipientIds = notifications.map((n) => n.receiverId)
    const uniqueRecipientIds = new Set(recipientIds)
    assert(
      recipientIds.length === uniqueRecipientIds.size,
      `No duplicate notifications generated (${recipientIds.length} total === ${uniqueRecipientIds.size} unique)`
    )

  } finally {
    // Cleanup temporary test data
    console.log('\n--- Cleaning up temporary test data ---')
    if (createdNotificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: createdNotificationIds } }
      })
    }
    if (createdLessonId) {
      await prisma.lesson.deleteMany({
        where: { id: createdLessonId }
      })
    }
    await prisma.enrollment.deleteMany({
      where: { courseId: course.id }
    })
    await prisma.chapter.deleteMany({
      where: { courseId: course.id }
    })
    await prisma.course.deleteMany({
      where: { id: course.id }
    })
    console.log('Cleanup completed.')
  }

  console.log('\n=============================================================')
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('=============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

run()
  .catch((e) => {
    console.error('Fatal test error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
