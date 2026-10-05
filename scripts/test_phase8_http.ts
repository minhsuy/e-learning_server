import { prisma } from '../src/config/prisma'
import { generateAccessToken } from '../src/middlewares/generateToken'
import { UserRole } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = process.env.URL_SERVER || 'http://localhost:3002'

async function runHttpTests() {
  console.log('====================================================')
  console.log('PHASE 8: LIVE HTTP API INTEGRATION TESTS')
  console.log(`Server URL: ${BASE_URL}`)
  console.log('====================================================')

  let passCount = 0
  let failCount = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  [PASS] ${message}`)
      passCount++
    } else {
      console.error(`  [FAIL] ${message}`)
      failCount++
    }
  }

  // 1. Initial Baseline Count Check
  const initialCommentCount = await prisma.comment.count()
  const initialReactionCount = await prisma.commentReaction.count()
  console.log(`Initial comments count: ${initialCommentCount}`)
  console.log(`Initial comment_reactions count: ${initialReactionCount}`)
  assert(initialCommentCount === 8, 'PostgreSQL starts with 8 comments')
  assert(initialReactionCount === 1, 'PostgreSQL starts with 1 comment_reaction')

  // Find fixtures
  const lesson = await prisma.lesson.findFirst({
    include: {
      course: {
        include: {
          author: true,
          enrollments: { include: { user: true } }
        }
      }
    }
  })

  if (!lesson || !lesson.course) {
    throw new Error('No fixture lesson/course found')
  }

  const course = lesson.course
  const teacherId = course.authorId
  const teacherToken = generateAccessToken({ userId: teacherId, role: 'teacher' })

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const adminToken = adminUser
    ? generateAccessToken({ userId: adminUser.id, role: 'admin' })
    : ''

  console.log(`Using Teacher: ${teacherId}`)
  console.log(`Using Course: ${course.id}`)
  console.log(`Using Lesson: ${lesson.id}`)

  let createdHttpCommentId = ''

  try {
    // Test 1: POST /api/comments
    console.log('\n--- Test 1: POST /api/comments (Create Comment) ---')
    const createRes = await fetch(`${BASE_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        content: 'Live HTTP automated test comment',
        course: course.id,
        lesson: lesson.id
      })
    })

    const createBody = (await createRes.json()) as any
    console.log('Create Comment status:', createRes.status, 'body:', JSON.stringify(createBody))
    assert(createRes.status === 200, `POST /api/comments returned HTTP 200 (Got ${createRes.status})`)
    assert(createBody.success === true, 'Response envelope has success: true')
    assert(createBody.message === 'Comment created successfully', 'Response message matches contract')
    assert(Boolean(createBody.data?.id), 'Response data contains id')
    assert(createBody.data?._id === createBody.data?.id, 'Response data contains matching _id alias')
    assert(Array.isArray(createBody.data?.likes), 'Response data contains likes array')
    assert(Array.isArray(createBody.data?.dislikes), 'Response data contains dislikes array')
    createdHttpCommentId = createBody.data?.id
    console.log('Created ID:', createdHttpCommentId)

    // Test 2: GET /api/comments/lesson/:lessonId
    console.log('\n--- Test 2: GET /api/comments/lesson/:lessonId (Get by Lesson) ---')
    const getLessonRes = await fetch(`${BASE_URL}/api/comments/lesson/${lesson.id}`)
    const getLessonBody = (await getLessonRes.json()) as any
    console.log('Get Lesson status:', getLessonRes.status, 'item count:', getLessonBody.data?.length)
    if (getLessonBody.data?.length > 0) {
      console.log('First lesson comment id:', getLessonBody.data[0].id)
    }
    assert(getLessonRes.status === 200, `GET /api/comments/lesson/:lessonId returned HTTP 200`)
    assert(getLessonBody.success === true, 'Response has success: true')
    assert(Array.isArray(getLessonBody.data), 'Response data is an array')
    assert(
      getLessonBody.data.some((c: any) => c.id === createdHttpCommentId),
      'Created comment is present in lesson comments list'
    )

    // Test 3: PUT /api/comments/:id (Update Comment)
    console.log('\n--- Test 3: PUT /api/comments/:id (Update Comment) ---')
    const updateRes = await fetch(`${BASE_URL}/api/comments/${createdHttpCommentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        content: 'Updated Live HTTP automated test comment'
      })
    })
    const updateBody = (await updateRes.json()) as any
    console.log('Update status:', updateRes.status, 'body:', JSON.stringify(updateBody))
    assert(updateRes.status === 200, `PUT /api/comments/:id returned HTTP 200`)
    assert(updateBody.success === true, 'Response has success: true')
    assert(
      updateBody.data?.content === 'Updated Live HTTP automated test comment',
      'Comment content successfully updated'
    )

    // Test 4: POST /api/comments/like/:commentId
    console.log('\n--- Test 4: POST /api/comments/like/:commentId (Like Comment) ---')
    const likeRes1 = await fetch(`${BASE_URL}/api/comments/like/${createdHttpCommentId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    })
    const likeBody1 = (await likeRes1.json()) as any
    assert(likeRes1.status === 200, `POST /api/comments/like/:commentId returned HTTP 200`)
    assert(likeBody1.success === true, 'Like response has success: true')
    assert(likeBody1.data?.likes.includes(teacherId), 'Likes array includes teacher userId')

    // Test 5: POST /api/comments/like/:commentId (Duplicate Like -> 400)
    console.log('\n--- Test 5: POST /api/comments/like/:commentId (Duplicate Like -> 400) ---')
    const likeRes2 = await fetch(`${BASE_URL}/api/comments/like/${createdHttpCommentId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    })
    const likeBody2 = (await likeRes2.json()) as any
    assert(likeRes2.status === 400, `Duplicate like returned HTTP 400 (Got ${likeRes2.status})`)
    assert(
      likeBody2.message === 'You have already liked this comment',
      'Duplicate like error message matches contract'
    )

    // Test 6: POST /api/comments/dislike/:commentId (Switch to Dislike)
    console.log('\n--- Test 6: POST /api/comments/dislike/:commentId (Switch to Dislike) ---')
    const dislikeRes1 = await fetch(`${BASE_URL}/api/comments/dislike/${createdHttpCommentId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    })
    const dislikeBody1 = (await dislikeRes1.json()) as any
    assert(dislikeRes1.status === 200, `POST /api/comments/dislike/:commentId returned HTTP 200`)
    assert(dislikeBody1.success === true, 'Dislike response has success: true')
    assert(
      dislikeBody1.data?.dislikes.includes(teacherId),
      'Dislikes array now includes teacher userId'
    )
    assert(
      !dislikeBody1.data?.likes.includes(teacherId),
      'Likes array no longer includes teacher userId'
    )

    // Test 7: POST /api/comments/dislike/:commentId (Duplicate Dislike -> 400)
    console.log('\n--- Test 7: POST /api/comments/dislike/:commentId (Duplicate Dislike -> 400) ---')
    const dislikeRes2 = await fetch(`${BASE_URL}/api/comments/dislike/${createdHttpCommentId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    })
    const dislikeBody2 = (await dislikeRes2.json()) as any
    assert(dislikeRes2.status === 400, `Duplicate dislike returned HTTP 400`)
    assert(
      dislikeBody2.message === 'You have already disliked this comment',
      'Duplicate dislike error message matches contract'
    )

    // Test 8: GET /api/comments (Admin/Teacher Management Query)
    console.log('\n--- Test 8: GET /api/comments (Teacher Query) ---')
    const mgmtRes = await fetch(`${BASE_URL}/api/comments?courseId=${course.id}`, {
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    })
    const mgmtBody = (await mgmtRes.json()) as any
    console.log('Test 8 status:', mgmtRes.status, 'body:', JSON.stringify(mgmtBody))
    assert(mgmtRes.status === 200, `GET /api/comments returned HTTP 200`)
    assert(mgmtBody.success === true, 'Management response has success: true')
    assert(Array.isArray(mgmtBody.data?.comments), 'Response data contains comments array')
    assert(Boolean(mgmtBody.data?.pagination), 'Response data contains pagination metadata')

    // Test 9: DELETE /api/comments/:id (Delete Own Comment)
    console.log('\n--- Test 9: DELETE /api/comments/:id (Delete Comment) ---')
    const deleteRes = await fetch(`${BASE_URL}/api/comments/${createdHttpCommentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    })
    const deleteBody = (await deleteRes.json()) as any
    assert(deleteRes.status === 200, `DELETE /api/comments/:id returned HTTP 200`)
    assert(deleteBody.success === true, 'Response has success: true')
    assert(deleteBody.message === 'Comment deleted successfully', 'Delete message matches contract')
    createdHttpCommentId = '' // cleared after successful deletion
  } finally {
    if (createdHttpCommentId) {
      await prisma.comment.delete({ where: { id: createdHttpCommentId } }).catch(() => {})
    }
  }

  // 10. Database Integrity Verification
  console.log('\n--- 10. DATABASE INTEGRITY VERIFICATION ---')
  const finalCommentCount = await prisma.comment.count()
  const finalReactionCount = await prisma.commentReaction.count()
  console.log(`Final comments count: ${finalCommentCount}`)
  console.log(`Final comment_reactions count: ${finalReactionCount}`)
  assert(
    finalCommentCount === initialCommentCount,
    `Comments count preserved exactly (${finalCommentCount} === ${initialCommentCount})`
  )
  assert(
    finalReactionCount === initialReactionCount,
    `Comment reactions count preserved exactly (${finalReactionCount} === ${initialReactionCount})`
  )

  console.log('\n====================================================')
  console.log(`HTTP TESTS RESULTS: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('====================================================')

  await prisma.$disconnect()

  if (failCount > 0) {
    process.exit(1)
  }
}

runHttpTests().catch((err) => {
  console.error('Fatal HTTP test error:', err)
  process.exit(1)
})
