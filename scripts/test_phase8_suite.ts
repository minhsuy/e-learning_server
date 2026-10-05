import { prisma } from '../src/config/prisma'
import { CommentReactionType, CommentStatus, UserRole } from '@prisma/client'
import {
  createComment,
  deleteCommentById,
  findCommentById,
  findCommentsByLessonId,
  findCommentsWithFilter,
  countCommentsWithFilter,
  updateCommentContent
} from '../src/repositories/comment.repository'
import {
  createReaction,
  deleteReaction,
  findReaction,
  findReactionsByCommentId,
  countReactionsByCommentId,
  updateReactionType
} from '../src/repositories/commentReaction.repository'
import {
  createCommentService,
  deleteCommentByAdminOrTeacherService,
  deleteCommentService,
  dislikeCommentService,
  getCommentsByAdminOrTeacherService,
  getCommentsByLessonService,
  likeCommentService,
  updateCommentService
} from '../src/services/comment.service'

async function runTestSuite() {
  console.log('====================================================')
  console.log('PHASE 8: COMMENT & COMMENT REACTION TEST SUITE')
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
  console.log('\n--- 1. DATABASE BASELINE CHECK ---')
  const initialCommentCount = await prisma.comment.count()
  const initialReactionCount = await prisma.commentReaction.count()
  console.log(`Initial comments: ${initialCommentCount}`)
  console.log(`Initial comment_reactions: ${initialReactionCount}`)
  assert(initialCommentCount === 8, 'Initial comments count equals 8 historical records')
  assert(initialReactionCount === 1, 'Initial comment_reactions count equals 1 historical record')

  // Find fixtures in database
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
    throw new Error('No active lesson with course found in database')
  }

  const course = lesson.course
  const teacherId = course.authorId
  const enrolledUser = course.enrollments[0]?.user

  // Find an admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN }
  })

  // Find a user who is NOT enrolled in this course and NOT the teacher
  const nonEnrolledUser = await prisma.user.findFirst({
    where: {
      id: { notIn: [teacherId, ...(course.enrollments.map((e) => e.userId))] },
      role: UserRole.USER
    }
  })

  // Find a different teacher
  const otherTeacher = await prisma.user.findFirst({
    where: {
      id: { not: teacherId },
      role: UserRole.TEACHER
    }
  })

  console.log(`Fixture Course: ${course.id} ("${course.title}")`)
  console.log(`Fixture Lesson: ${lesson.id} ("${lesson.title}")`)
  console.log(`Fixture Teacher: ${teacherId}`)
  console.log(`Fixture Enrolled User: ${enrolledUser ? enrolledUser.id : 'N/A'}`)
  console.log(`Fixture Non-Enrolled User: ${nonEnrolledUser ? nonEnrolledUser.id : 'N/A'}`)
  console.log(`Fixture Admin: ${adminUser ? adminUser.id : 'N/A'}`)
  console.log(`Fixture Other Teacher: ${otherTeacher ? otherTeacher.id : 'N/A'}`)

  // ====================================================
  // 2. COMMENT REPOSITORY TESTS
  // ====================================================
  console.log('\n--- 2. COMMENT REPOSITORY TESTS ---')

  let testCommentId = ''
  try {
    const created = await createComment({
      content: 'Automated test comment repository',
      lessonId: lesson.id,
      courseId: course.id,
      userId: teacherId,
      level: 0,
      status: CommentStatus.APPROVED
    })
    testCommentId = created.id
    assert(Boolean(created.id), 'createComment successfully creates comment')
    assert(created.content === 'Automated test comment repository', 'Comment content matches')
    assert(created.level === 0, 'Comment level is 0')

    const fetched = await findCommentById(testCommentId)
    assert(fetched !== null && fetched.id === testCommentId, 'findCommentById finds created comment')

    const byLesson = await findCommentsByLessonId(lesson.id)
    assert(byLesson.some((c) => c.id === testCommentId), 'findCommentsByLessonId includes test comment')

    const updated = await updateCommentContent(testCommentId, 'Updated repository content')
    assert(updated !== null && updated.content === 'Updated repository content', 'updateCommentContent updates content')

    const filterResult = await findCommentsWithFilter({
      courseId: course.id,
      search: 'Updated repository',
      skip: 0,
      take: 5
    })
    assert(filterResult.some((c) => c.id === testCommentId), 'findCommentsWithFilter finds comment by search term')

    const countFiltered = await countCommentsWithFilter({
      courseId: course.id,
      search: 'Updated repository'
    })
    assert(countFiltered >= 1, 'countCommentsWithFilter counts matching comments')
  } finally {
    if (testCommentId) {
      await deleteCommentById(testCommentId)
      const checkDeleted = await findCommentById(testCommentId)
      assert(checkDeleted === null, 'deleteCommentById successfully cleans up repository test comment')
    }
  }

  // ====================================================
  // 3. COMMENT REACTION REPOSITORY TESTS
  // ====================================================
  console.log('\n--- 3. COMMENT REACTION REPOSITORY TESTS ---')

  let reactionTestCommentId = ''
  try {
    const commentForReaction = await createComment({
      content: 'Comment for reaction tests',
      lessonId: lesson.id,
      courseId: course.id,
      userId: teacherId,
      level: 0,
      status: CommentStatus.APPROVED
    })
    reactionTestCommentId = commentForReaction.id

    const createdReaction = await createReaction(
      reactionTestCommentId,
      teacherId,
      CommentReactionType.LIKE
    )
    assert(createdReaction.type === CommentReactionType.LIKE, 'createReaction creates LIKE reaction')

    const foundReaction = await findReaction(reactionTestCommentId, teacherId)
    assert(foundReaction !== null && foundReaction.type === CommentReactionType.LIKE, 'findReaction retrieves reaction')

    const updatedReaction = await updateReactionType(
      reactionTestCommentId,
      teacherId,
      CommentReactionType.DISLIKE
    )
    assert(updatedReaction.type === CommentReactionType.DISLIKE, 'updateReactionType updates to DISLIKE')

    const listReactions = await findReactionsByCommentId(reactionTestCommentId)
    assert(listReactions.length === 1, 'findReactionsByCommentId returns 1 reaction')

    const countDislikes = await countReactionsByCommentId(
      reactionTestCommentId,
      CommentReactionType.DISLIKE
    )
    assert(countDislikes === 1, 'countReactionsByCommentId returns 1 DISLIKE')

    await deleteReaction(reactionTestCommentId, teacherId)
    const afterDelete = await findReaction(reactionTestCommentId, teacherId)
    assert(afterDelete === null, 'deleteReaction deletes reaction')
  } finally {
    if (reactionTestCommentId) {
      await deleteCommentById(reactionTestCommentId)
    }
  }

  // ====================================================
  // 4. COMMENT SERVICE BUSINESS LOGIC TESTS
  // ====================================================
  console.log('\n--- 4. COMMENT SERVICE BUSINESS LOGIC TESTS ---')

  // 4.1. Non-enrolled user blocked
  if (nonEnrolledUser) {
    const unEnrolledResult = await createCommentService({
      content: 'This should fail because I am not enrolled',
      lesson: lesson.id,
      course: course.id,
      userId: nonEnrolledUser.id,
      role: UserRole.USER
    })
    assert(
      unEnrolledResult.success === false && unEnrolledResult.statusCode === 403,
      'createCommentService blocks non-enrolled user with 403'
    )
  }

  // 4.2. Other teacher blocked from commenting on course they do not own
  if (otherTeacher) {
    const otherTeacherResult = await createCommentService({
      content: 'This should fail because I am not the course teacher',
      lesson: lesson.id,
      course: course.id,
      userId: otherTeacher.id,
      role: UserRole.TEACHER
    })
    assert(
      otherTeacherResult.success === false && otherTeacherResult.statusCode === 403,
      'createCommentService blocks teacher who is not the course author with 403'
    )
  }

  // 4.3. Course author (Teacher) can create comment
  let createdCommentId = ''
  const teacherCommentResult = await createCommentService({
    content: 'Teacher announcement comment test',
    lesson: lesson.id,
    course: course.id,
    userId: teacherId,
    role: UserRole.TEACHER
  })
  assert(teacherCommentResult.success === true, 'Teacher can create comment on own course')
  createdCommentId = teacherCommentResult.data?.id

  // 4.4. Verify serialized structure (likes and dislikes arrays, compat _id)
  const commentData = teacherCommentResult.data
  assert(Array.isArray(commentData.likes), 'Comment response data has likes array')
  assert(Array.isArray(commentData.dislikes), 'Comment response data has dislikes array')
  assert(commentData._id === commentData.id, 'Comment response has _id backward compatibility')
  assert(commentData.user._id === commentData.user.id, 'Nested user has _id alias')
  assert(commentData.course._id === commentData.course.id, 'Nested course has _id alias')
  assert(commentData.lesson._id === commentData.lesson.id, 'Nested lesson has _id alias')

  // 4.5. Create reply comment
  let replyCommentId = ''
  const replyResult = await createCommentService({
    content: 'Reply to teacher announcement',
    lesson: lesson.id,
    course: course.id,
    parentId: createdCommentId,
    userId: teacherId,
    role: UserRole.TEACHER
  })
  assert(replyResult.success === true, 'Can create reply with valid parentId')
  assert(replyResult.data.level === 1, 'Reply comment level is parent.level + 1 = 1')
  assert(replyResult.data.parentId === createdCommentId, 'Reply parentId matches createdCommentId')
  replyCommentId = replyResult.data?.id

  // 4.6. Reply with non-existent parentId returns 404
  const invalidParentResult = await createCommentService({
    content: 'Reply to non-existent parent comment',
    lesson: lesson.id,
    course: course.id,
    parentId: '00000000-0000-0000-0000-000000000000',
    userId: teacherId,
    role: UserRole.TEACHER
  })
  assert(
    invalidParentResult.success === false && invalidParentResult.statusCode === 404,
    'Reply with non-existent parentId returns 404'
  )

  // 4.7. Update comment
  const updateResult = await updateCommentService({
    commentId: createdCommentId,
    content: 'Teacher announcement updated content',
    userId: teacherId,
    role: UserRole.TEACHER
  })
  assert(updateResult.success === true, 'Author can update own comment')
  assert(updateResult.data.content === 'Teacher announcement updated content', 'Updated content is reflected')

  // 4.8. Non-author cannot update comment
  if (nonEnrolledUser) {
    const unauthorizedUpdate = await updateCommentService({
      commentId: createdCommentId,
      content: 'Unauthorized modification attempt',
      userId: nonEnrolledUser.id,
      role: UserRole.USER
    })
    assert(
      unauthorizedUpdate.success === false && unauthorizedUpdate.statusCode === 403,
      'Non-author user is blocked from updating comment with 403'
    )
  }

  // 4.9. Admin CAN update comment
  if (adminUser) {
    const adminUpdate = await updateCommentService({
      commentId: createdCommentId,
      content: 'Admin moderated content',
      userId: adminUser.id,
      role: UserRole.ADMIN
    })
    assert(adminUpdate.success === true, 'Admin can update any comment')
  }

  // ====================================================
  // 5. COMMENT REACTION SERVICE TESTS
  // ====================================================
  console.log('\n--- 5. COMMENT REACTION SERVICE TESTS ---')

  // 5.1. Like first time -> Success
  const like1 = await likeCommentService({
    commentId: createdCommentId,
    userId: teacherId
  })
  assert(like1.success === true, 'Like first time succeeds')
  assert(like1.data.likes.includes(teacherId), 'Likes array includes user ID')
  assert(!like1.data.dislikes.includes(teacherId), 'Dislikes array does not include user ID')

  // 5.2. Like second time -> 400 'You have already liked this comment'
  const like2 = await likeCommentService({
    commentId: createdCommentId,
    userId: teacherId
  })
  assert(
    like2.success === false &&
      like2.statusCode === 400 &&
      like2.message === 'You have already liked this comment',
    'Like second time fails with 400 and exact message'
  )

  // 5.3. Dislike after Like -> switches to DISLIKE
  const dislike1 = await dislikeCommentService({
    commentId: createdCommentId,
    userId: teacherId
  })
  assert(dislike1.success === true, 'Dislike after Like succeeds')
  assert(!dislike1.data.likes.includes(teacherId), 'Likes array no longer includes user ID')
  assert(dislike1.data.dislikes.includes(teacherId), 'Dislikes array now includes user ID')

  // 5.4. Dislike second time -> 400 'You have already disliked this comment'
  const dislike2 = await dislikeCommentService({
    commentId: createdCommentId,
    userId: teacherId
  })
  assert(
    dislike2.success === false &&
      dislike2.statusCode === 400 &&
      dislike2.message === 'You have already disliked this comment',
    'Dislike second time fails with 400 and exact message'
  )

  // 5.5. Like after Dislike -> switches to LIKE
  const like3 = await likeCommentService({
    commentId: createdCommentId,
    userId: teacherId
  })
  assert(like3.success === true, 'Like after Dislike succeeds and switches back to LIKE')
  assert(like3.data.likes.includes(teacherId), 'Likes array includes user ID again')
  assert(!like3.data.dislikes.includes(teacherId), 'Dislikes array does not include user ID')

  // 5.6. Reaction on non-existent comment -> 404
  const nonExistentLike = await likeCommentService({
    commentId: '00000000-0000-0000-0000-000000000000',
    userId: teacherId
  })
  assert(
    nonExistentLike.success === false && nonExistentLike.statusCode === 404,
    'Like on non-existent comment returns 404'
  )

  // 5.7. Concurrent reaction attempts on fresh comment do not duplicate
  let concurrentCommentId = ''
  try {
    const concurrentComment = await createComment({
      content: 'Concurrent reaction test comment',
      lessonId: lesson.id,
      courseId: course.id,
      userId: teacherId,
      level: 0,
      status: CommentStatus.APPROVED
    })
    concurrentCommentId = concurrentComment.id

    const [res1, res2] = await Promise.all([
      likeCommentService({ commentId: concurrentCommentId, userId: teacherId }),
      likeCommentService({ commentId: concurrentCommentId, userId: teacherId })
    ])

    const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0)
    const errorCount = (!res1.success ? 1 : 0) + (!res2.success ? 1 : 0)
    assert(successCount === 1, 'Exactly 1 concurrent like request succeeds')
    assert(errorCount === 1, 'Exactly 1 concurrent like request is rejected with 400')

    const reactionRows = await findReactionsByCommentId(concurrentCommentId)
    assert(reactionRows.length === 1, 'PostgreSQL maintains exactly 1 reaction row (no duplicates)')
  } finally {
    if (concurrentCommentId) {
      await deleteCommentById(concurrentCommentId)
    }
  }

  // ====================================================
  // 6. ADMIN & TEACHER MANAGEMENT SERVICE TESTS
  // ====================================================
  console.log('\n--- 6. ADMIN & TEACHER MANAGEMENT SERVICE TESTS ---')

  const mgmtComments = await getCommentsByAdminOrTeacherService({
    page: 1,
    limit: 10,
    courseId: course.id,
    userId: teacherId,
    role: UserRole.TEACHER
  })
  assert(mgmtComments.success === true, 'Teacher can fetch comments for course')
  assert(
    mgmtComments.data.comments.length > 0 &&
      mgmtComments.data.pagination.page === 1 &&
      mgmtComments.data.pagination.total >= 1,
    'Management query returns comments array and pagination metadata'
  )

  // ====================================================
  // 7. CASCADE DELETE & CLEANUP TESTS
  // ====================================================
  console.log('\n--- 7. CASCADE DELETE & CLEANUP TESTS ---')

  // Deleting parent comment (createdCommentId) must cascade delete replyCommentId and reaction
  const deleteResult = await deleteCommentService({
    commentId: createdCommentId,
    userId: teacherId
  })
  assert(deleteResult.success === true, 'deleteCommentService deletes parent comment successfully')

  // Check parent deleted
  const checkParent = await findCommentById(createdCommentId)
  assert(checkParent === null, 'Parent comment is deleted in PostgreSQL')

  // Check child reply automatically CASCADE deleted
  const checkReply = await findCommentById(replyCommentId)
  assert(checkReply === null, 'Reply comment was automatically CASCADE deleted by PostgreSQL')

  // Check reaction automatically CASCADE deleted
  const checkReaction = await findReaction(createdCommentId, teacherId)
  assert(checkReaction === null, 'CommentReaction was automatically CASCADE deleted by PostgreSQL')

  // ====================================================
  // 8. FINAL DATABASE INTEGRITY CHECK
  // ====================================================
  console.log('\n--- 8. FINAL DATABASE INTEGRITY CHECK ---')
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
  console.log(`RESULTS: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('====================================================')

  await prisma.$disconnect()

  if (failCount > 0) {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
