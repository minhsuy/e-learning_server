/**
 * Test Suite for Phase 5 Step 4: QuizSubmission Service & Evaluation Logic
 * File: scripts/migration-utils/step-04-phase5-services.test.ts
 */

import { prisma } from '../../src/config/prisma'
import {
  submitQuizService,
  getQuizSubmissionService,
  getAllQuizSubmissionsService,
  getQuizAnalyticsService
} from '../../src/services/quizSubmission.service'
import { deleteSubmission } from '../../src/repositories/quizSubmission.repository'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 5 STEP 4 — QUIZ SUBMISSION SERVICE & EVALUATION LOGIC')
  console.log('='.repeat(80))

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`)
      passed++
    } else {
      console.error(`  [FAIL] ${testName}`)
      if (details) console.error(`         ${details}`)
      failed++
    }
  }

  const historicalQuizId = 'd40087b3-0917-5e3c-bc44-0f36d3d8d127'
  const historicalUserId = 'c55de839-f059-519c-8820-b16aa17fb9c3'

  // 1. Test getQuizSubmissionService
  console.log('\n--- 1. getQuizSubmissionService Tests ---')
  const resGet = await getQuizSubmissionService(historicalQuizId, historicalUserId)
  assert(resGet.success === true, 'getQuizSubmissionService returns success true for existing submission')
  assert(resGet.data?.submission?._id !== undefined, 'getQuizSubmissionService provides _id compatibility alias')
  assert(resGet.data?.submission?.answers?.length === 3, 'getQuizSubmissionService returns 3 answers')

  const resNotFound = await getQuizSubmissionService('00000000-0000-0000-0000-000000000000', historicalUserId)
  assert(resNotFound.success === false && resNotFound.statusCode === 404, 'getQuizSubmissionService returns 404 for non-existent submission')

  // 2. Test getAllQuizSubmissionsService
  console.log('\n--- 2. getAllQuizSubmissionsService Tests ---')
  const resTeacherAll = await getAllQuizSubmissionsService(historicalQuizId)
  assert(resTeacherAll.success === true, 'getAllQuizSubmissionsService returns success true')
  console.log('  DEBUG resTeacherAll:', JSON.stringify(resTeacherAll.data))
  assert(typeof resTeacherAll.data[0].user === 'string' && resTeacherAll.data[0].user.length > 0, 'getAllQuizSubmissionsService exposes user username', `Got user: "${resTeacherAll.data[0]?.user}"`)

  // 3. Test getQuizAnalyticsService
  console.log('\n--- 3. getQuizAnalyticsService Tests ---')
  const resAnalytics = await getQuizAnalyticsService(historicalQuizId)
  assert(resAnalytics.success === true, 'getQuizAnalyticsService returns success true')
  assert(resAnalytics.data.totalStudents >= 1, 'Analytics totalStudents is non-zero')
  assert(resAnalytics.data.avgScore > 0, 'Analytics avgScore is calculated')
  assert(resAnalytics.data.completionRate > 0, 'Analytics completionRate is calculated')

  // 4. Test submitQuizService validations
  console.log('\n--- 4. submitQuizService Validation & Security Tests ---')
  // Already submitted check
  const resAlready = await submitQuizService({
    userId: historicalUserId,
    quizId: historicalQuizId,
    answers: []
  })
  assert(resAlready.success === false && resAlready.statusCode === 400, 'Rejects already submitted quiz with 400')
  assert(resAlready.message === 'You have already submitted this quiz', 'Exact error message: "You have already submitted this quiz"')

  // User not found
  const resUserNotFound = await submitQuizService({
    userId: '00000000-0000-0000-0000-000000000000',
    quizId: historicalQuizId,
    answers: []
  })
  assert(resUserNotFound.success === false && resUserNotFound.statusCode === 404, 'Returns 404 when user does not exist')

  // Quiz not found
  const resQuizNotFound = await submitQuizService({
    userId: historicalUserId,
    quizId: '00000000-0000-0000-0000-000000000000',
    answers: []
  })
  assert(resQuizNotFound.success === false && resQuizNotFound.statusCode === 404, 'Returns 404 when quiz does not exist')

  // Not enrolled check
  // Find a user who is truly not enrolled in course of quiz
  const enrolledUserIds = (
    await prisma.enrollment.findMany({
      where: { courseId: 'f0dde7bb-1bf6-5602-a489-cd324132c68a' },
      select: { userId: true }
    })
  ).map((e) => e.userId)

  const nonEnrolledUser = await prisma.user.findFirst({
    where: {
      id: { notIn: enrolledUserIds }
    }
  })
  if (nonEnrolledUser) {
    const resNotEnrolled = await submitQuizService({
      userId: nonEnrolledUser.id,
      quizId: historicalQuizId,
      answers: []
    })
    console.log('  DEBUG resNotEnrolled:', resNotEnrolled)
    assert(resNotEnrolled.success === false && resNotEnrolled.statusCode === 403, 'Returns 403 when user is not enrolled', `Status: ${resNotEnrolled.statusCode}, msg: ${resNotEnrolled.message}`)
    assert(resNotEnrolled.message === 'You are not enrolled in this course', 'Exact error message: "You are not enrolled in this course"')
  }

  // 5. Test Evaluation logic & submission creation on unsubmitted quiz
  console.log('\n--- 5. Evaluation Logic & Atomic Submission Test ---')
  const testQuizId = 'b9e14796-def1-59ae-8f7a-b54ad53a8392' // Quiz 3 in React course where minhsuyyyyy is enrolled
  const questions = await prisma.question.findMany({ where: { quizId: testQuizId } })

  if (questions.length > 0) {
    // 5.1 Test duplicate question in request
    const resDuplicateQ = await submitQuizService({
      userId: historicalUserId,
      quizId: testQuizId,
      answers: [
        { question: questions[0].id, selectedAnswer: 'opt1' },
        { question: questions[0].id, selectedAnswer: 'opt2' }
      ]
    })
    assert(resDuplicateQ.success === false && resDuplicateQ.statusCode === 400, 'Rejects duplicate question in submission')

    // 5.2 Test question belonging to different quiz
    const otherQuizQuestion = await prisma.question.findFirst({
      where: { quizId: { not: testQuizId } }
    })
    if (otherQuizQuestion) {
      const resWrongQ = await submitQuizService({
        userId: historicalUserId,
        quizId: testQuizId,
        answers: [{ question: otherQuizQuestion.id, selectedAnswer: 'any' }]
      })
      assert(resWrongQ.success === false && resWrongQ.statusCode === 400, 'Rejects question from a different quiz')
    }

    // 5.3 Submit with correct answer
    const submitResult = await submitQuizService({
      userId: historicalUserId,
      quizId: testQuizId,
      answers: [
        {
          question: questions[0].id,
          selectedAnswer: questions[0].answer
        }
      ]
    })

    assert(submitResult.success === true, 'submitQuizService succeeds with valid answers')
    assert(submitResult.data?.percentage === 100, 'Correct answer scores 100%')
    assert(submitResult.data?.scoreDisplay === '1/1', 'Score display matches "1/1"')
    assert(submitResult.data?.submission?.answers?.[0]?.isCorrect === true, 'Answer recorded with isCorrect: true')

    // Clean up test submission
    const createdId = submitResult.data?.submission?.id
    if (createdId) {
      await deleteSubmission(createdId)
      console.log('  [CLEANUP] Deleted test submission successfully')
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('='.repeat(80))

  await prisma.$disconnect()
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(async (err) => {
  console.error('Test execution failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})
