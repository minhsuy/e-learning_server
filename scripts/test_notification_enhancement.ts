import { ENotificationType } from '@prisma/client'
import { prisma } from '../src/config/prisma'
import {
  createNotification,
  findNotificationById,
  deleteNotification,
  findNotificationsByUser
} from '../src/repositories/notification.repository'
import {
  getNotificationsService,
  pushNotificationService
} from '../src/services/notification.service'
import { createLessonService } from '../src/services/lesson.service'
import { createCommentService } from '../src/services/comment.service'
import { isValidUUID } from '../src/utils/uuid'

/**
 * TMDEMY — NOTIFICATION ENHANCEMENT CONTEXTUAL NAVIGATION TEST SUITE
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

async function runTests() {
  console.log('\n=============================================================')
  console.log('🚀 TMDEMY — NOTIFICATION ENHANCEMENT VERIFICATION SUITE')
  console.log('=============================================================\n')

  const createdNotificationIds: string[] = []
  const createdLessonIds: string[] = []
  const createdCommentIds: string[] = []

  const initialCount = await prisma.notification.count()
  console.log(`Baseline notification count in DB: ${initialCount}`)

  // Retrieve test users
  const users = await prisma.user.findMany({ take: 3 })
  if (users.length < 2) {
    throw new Error('Need at least 2 users in DB for testing.')
  }
  const teacher = users.find((u) => u.role === 'TEACHER') || users[0]
  const student = users.find((u) => u.id !== teacher.id) || users[1]
  const student2 = users.find((u) => u.id !== teacher.id && u.id !== student.id) || users[2] || student

  try {
    // =========================================================================
    // SECTION 1: UNIT / REPOSITORY METADATA CRUD
    // =========================================================================
    console.log('\n--- SECTION 1: Notification Repository & Service Metadata CRUD ---')

    // 1.1 Create notification with metadata
    const testMetadata = {
      courseId: 'c1111111-2222-3333-4444-555555555555',
      courseSlug: 'test-course-slug',
      lessonId: 'l1111111-2222-3333-4444-555555555555'
    }
    const notifWithMeta = await createNotification({
      senderId: teacher.id,
      receiverId: student.id,
      type: ENotificationType.LESSON,
      message: 'Test lesson notification with metadata',
      relatedId: testMetadata.lessonId,
      metadata: testMetadata
    })
    createdNotificationIds.push(notifWithMeta.id)

    assert(isValidUUID(notifWithMeta.id), '1.1 createNotification returns valid UUID')
    assert(notifWithMeta.metadata !== null, '1.1 notification.metadata is not null')
    assert(
      (notifWithMeta.metadata as any)?.courseSlug === 'test-course-slug',
      '1.1 metadata.courseSlug matches input'
    )
    assert(
      (notifWithMeta.metadata as any)?.courseId === testMetadata.courseId,
      '1.1 metadata.courseId matches input'
    )

    // 1.2 Create notification without metadata (null fallback)
    const notifWithoutMeta = await createNotification({
      senderId: null,
      receiverId: student.id,
      type: ENotificationType.SYSTEM,
      message: 'Test system notification without metadata',
      relatedId: null
    })
    createdNotificationIds.push(notifWithoutMeta.id)
    assert(notifWithoutMeta.metadata === null, '1.2 notification without metadata has null metadata in DB')

    // 1.3 pushNotificationService returns metadata in response
    const pushResult = await pushNotificationService({
      senderId: teacher.id,
      receiverId: student.id,
      type: ENotificationType.COMMENT,
      message: 'Test comment notification via pushNotificationService',
      relatedId: 'lesson-uuid-test',
      metadata: {
        courseId: 'course-uuid-test',
        courseSlug: 'course-slug-test',
        lessonId: 'lesson-uuid-test',
        commentId: 'comment-uuid-test'
      }
    })
    assert(pushResult.success === true, '1.3 pushNotificationService succeeds')
    assert(pushResult.data?.metadata !== null, '1.3 pushNotificationService response includes metadata')
    assert(
      (pushResult.data?.metadata as any)?.commentId === 'comment-uuid-test',
      '1.3 pushNotificationService metadata has commentId'
    )
    if (pushResult.data?.id) createdNotificationIds.push(pushResult.data.id)

    // =========================================================================
    // SECTION 2: LESSON NOTIFICATION ENHANCEMENT
    // =========================================================================
    console.log('\n--- SECTION 2: Lesson Notification with Contextual Metadata ---')

    // Find a chapter and its course
    const sampleChapter = await prisma.chapter.findFirst({
      include: {
        course: true
      }
    })

    if (sampleChapter) {
      const courseWithEnrollment = sampleChapter.course
      const courseTeacherId = courseWithEnrollment.authorId
      const chapterId = sampleChapter.id

      // Ensure student is actively enrolled
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: student.id,
            courseId: courseWithEnrollment.id
          }
        },
        create: {
          userId: student.id,
          courseId: courseWithEnrollment.id,
          status: 'ACTIVE'
        },
        update: {
          status: 'ACTIVE'
        }
      })

      const uniqueLessonTitle = `Test Lesson Enhancement ${Date.now()}`
      const lessonResult = await createLessonService({
        payload: {
          title: uniqueLessonTitle,
          course: courseWithEnrollment.id,
          chapter: chapterId,
          duration: 10,
          type: 'video',
          content: 'Test content',
          videoUrl: 'https://example.com/test.mp4'
        },
        userId: courseTeacherId,
        role: 'TEACHER'
      })

      assert(lessonResult.success === true, '2.1 createLessonService creates lesson successfully')
      if (lessonResult.data?.id) {
        createdLessonIds.push(lessonResult.data.id)

        // Find the notification dispatched to the student
        const studentNotif = await prisma.notification.findFirst({
          where: {
            receiverId: student.id,
            type: ENotificationType.LESSON,
            relatedId: lessonResult.data.id
          },
          orderBy: { createdAt: 'desc' }
        })

        assert(studentNotif !== null, '2.2 Student received LESSON notification')
        assert(studentNotif?.relatedId === lessonResult.data.id, '2.2 relatedId is lesson.id')
        assert(studentNotif?.metadata !== null, '2.2 metadata is present on LESSON notification')

        const meta = studentNotif?.metadata as any
        assert(meta?.courseId === courseWithEnrollment.id, '2.2 metadata.courseId matches course ID')
        assert(meta?.courseSlug === courseWithEnrollment.slug, '2.2 metadata.courseSlug matches course slug')
        assert(meta?.lessonId === lessonResult.data.id, '2.2 metadata.lessonId matches lesson ID')

        if (studentNotif) createdNotificationIds.push(studentNotif.id)
      }
    } else {
      console.log('  ⚠️ Skipping live addLessonService test (no chapter found)')
    }

    // =========================================================================
    // SECTION 3: COMMENT & COMMENT_REPLY NOTIFICATION ENHANCEMENT
    // =========================================================================
    console.log('\n--- SECTION 3: Comment & Comment Reply Notifications with Metadata ---')

    // Find any course and lesson
    const sampleLesson = await prisma.lesson.findFirst({
      include: { course: true }
    })

    if (sampleLesson) {
      const courseId = sampleLesson.courseId
      const courseAuthorId = sampleLesson.course.authorId

      // Ensure student is enrolled so they can comment
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: student.id,
            courseId
          }
        },
        create: {
          userId: student.id,
          courseId,
          status: 'ACTIVE'
        },
        update: {
          status: 'ACTIVE'
        }
      })

      // 3.1 Student creates root comment -> Teacher gets COMMENT notification
      const rootCommentResult = await createCommentService({
        userId: student.id,
        content: `Root comment test ${Date.now()}`,
        lesson: sampleLesson.id,
        course: courseId,
        role: 'USER'
      })

      assert(rootCommentResult.success === true, '3.1 Root comment created successfully')
      if (rootCommentResult.data?.id) {
        createdCommentIds.push(rootCommentResult.data.id)

        // If author is different from commenter, notification was sent
        if (courseAuthorId !== student.id) {
          const authorNotif = await prisma.notification.findFirst({
            where: {
              receiverId: courseAuthorId,
              type: ENotificationType.COMMENT,
              relatedId: sampleLesson.id
            },
            orderBy: { createdAt: 'desc' }
          })

          assert(authorNotif !== null, '3.2 Course author received COMMENT notification')
          assert(authorNotif?.relatedId === sampleLesson.id, '3.2 relatedId is lesson.id')
          assert(authorNotif?.metadata !== null, '3.2 metadata is present on COMMENT notification')

          const meta = authorNotif?.metadata as any
          assert(meta?.courseId === courseId, '3.2 metadata.courseId matches course ID')
          assert(meta?.courseSlug === sampleLesson.course.slug, '3.2 metadata.courseSlug matches course slug')
          assert(meta?.lessonId === sampleLesson.id, '3.2 metadata.lessonId matches lesson ID')
          assert(meta?.commentId === rootCommentResult.data.id, '3.2 metadata.commentId matches comment ID')

          if (authorNotif) createdNotificationIds.push(authorNotif.id)
        }

        // 3.3 Another user replies to root comment -> Root commenter gets COMMENT_REPLY notification
        // Ensure student2 is enrolled
        await prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: student2.id,
              courseId
            }
          },
          create: {
            userId: student2.id,
            courseId,
            status: 'ACTIVE'
          },
          update: {
            status: 'ACTIVE'
          }
        })

        const replyCommentResult = await createCommentService({
          userId: student2.id,
          content: `Reply to comment test ${Date.now()}`,
          lesson: sampleLesson.id,
          course: courseId,
          parentId: rootCommentResult.data.id,
          role: 'USER'
        })

        assert(replyCommentResult.success === true, '3.3 Reply comment created successfully')
        if (replyCommentResult.data?.id) {
          createdCommentIds.push(replyCommentResult.data.id)

          if (student.id !== student2.id) {
            const replyNotif = await prisma.notification.findFirst({
              where: {
                receiverId: student.id,
                type: ENotificationType.COMMENT_REPLY,
                relatedId: sampleLesson.id
              },
              orderBy: { createdAt: 'desc' }
            })

            assert(replyNotif !== null, '3.4 Parent comment author received COMMENT_REPLY notification')
            assert(replyNotif?.relatedId === sampleLesson.id, '3.4 relatedId is lesson.id')
            assert(replyNotif?.metadata !== null, '3.4 metadata is present on COMMENT_REPLY notification')

            const meta = replyNotif?.metadata as any
            assert(meta?.courseId === courseId, '3.4 metadata.courseId matches course ID')
            assert(meta?.courseSlug === sampleLesson.course.slug, '3.4 metadata.courseSlug matches course slug')
            assert(meta?.lessonId === sampleLesson.id, '3.4 metadata.lessonId matches lesson ID')
            assert(meta?.commentId === replyCommentResult.data.id, '3.4 metadata.commentId matches reply comment ID')
            assert(meta?.parentId === rootCommentResult.data.id, '3.4 metadata.parentId matches root comment ID')

            if (replyNotif) createdNotificationIds.push(replyNotif.id)
          }

          // 3.5 User replying to their own comment does NOT send notification to themselves
          const selfReplyResult = await createCommentService({
            userId: student.id,
            content: `Self reply test ${Date.now()}`,
            lesson: sampleLesson.id,
            course: courseId,
            parentId: rootCommentResult.data.id,
            role: 'USER'
          })
          if (selfReplyResult.data?.id) createdCommentIds.push(selfReplyResult.data.id)

          // Verify no notification sent to self
          const selfNotifs = await prisma.notification.findMany({
            where: {
              receiverId: student.id,
              senderId: student.id,
              type: ENotificationType.COMMENT_REPLY
            }
          })
          assert(selfNotifs.length === 0, '3.5 Self-reply does not trigger notification to oneself')
        }
      }
    } else {
      console.log('  ⚠️ Skipping live comment test (no sample lesson found)')
    }

    // =========================================================================
    // SECTION 4: BACKWARD COMPATIBILITY & REGRESSION
    // =========================================================================
    console.log('\n--- SECTION 4: Backward Compatibility & Regression ---')

    // 4.1 Historical notifications with null metadata return metadata: null cleanly
    const historicalNotifs = await getNotificationsService(student.id, 1, 10)
    assert(historicalNotifs.success === true, '4.1 getNotificationsService succeeds')
    if (historicalNotifs.data?.notifications?.length > 0) {
      for (const n of historicalNotifs.data.notifications) {
        assert('metadata' in n, '4.1 notification response contains metadata key')
        assert(n.metadata === null || typeof n.metadata === 'object', '4.1 metadata is null or object')
      }
    }

    // 4.2 Other notification types continue to work (e.g. ORDER)
    const orderNotif = await pushNotificationService({
      senderId: student.id,
      receiverId: teacher.id,
      type: ENotificationType.ORDER,
      message: 'Test order notification',
      relatedId: 'order-uuid-test'
    })
    assert(orderNotif.success === true, '4.2 ORDER notification works without metadata')
    assert(orderNotif.data?.metadata === null, '4.2 ORDER notification metadata defaults to null')
    if (orderNotif.data?.id) createdNotificationIds.push(orderNotif.data.id)

  } finally {
    // =========================================================================
    // SECTION 5: CLEANUP TEST RECORDS
    // =========================================================================
    console.log('\n--- SECTION 5: Cleaning up test artifacts ---')

    // Delete any notifications linked to created lessons
    if (createdLessonIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { relatedId: { in: createdLessonIds } }
      })
    }
    for (const nid of createdNotificationIds) {
      await prisma.notification.delete({ where: { id: nid } }).catch(() => {})
    }
    for (const cid of createdCommentIds.reverse()) {
      await prisma.comment.delete({ where: { id: cid } }).catch(() => {})
    }
    for (const lid of createdLessonIds) {
      await prisma.lesson.delete({ where: { id: lid } }).catch(() => {})
    }

    const finalCount = await prisma.notification.count()
    console.log(`Final notification count in DB: ${finalCount} (Initial: ${initialCount})`)
    assert(finalCount === initialCount, '5.1 Zero residual test records left in notifications table')
  }

  console.log('\n=============================================================')
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`)
  console.log('=============================================================\n')

  await prisma.$disconnect()

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
