/**
 * Test Suite for Phase 5 Step 3: QuizSubmission Functional Repository
 * File: scripts/migration-utils/step-03-phase5-repositories.test.ts
 */

import { prisma } from '../../src/config/prisma'
import {
  findSubmissionById,
  findSubmissionByQuizAndUser,
  findSubmissionDetailByQuizAndUser,
  findSubmissionsByQuizId,
  findSubmissionsForAnalytics,
  createSubmissionWithAnswers,
  deleteSubmission
} from '../../src/repositories/quizSubmission.repository'
import { findEnrollmentByUserAndCourse, countEnrollmentsByCourseId } from '../../src/repositories/enrollment.repository'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 5 STEP 3 — QUIZ SUBMISSION FUNCTIONAL REPOSITORY')
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

  // Known historical IDs from Data Migration
  const historicalSubId = 'e18994c4-b95d-5cfe-b771-0640b7daaa16'
  const historicalQuizId = 'd40087b3-0917-5e3c-bc44-0f36d3d8d127'
  const historicalUserId = 'c55de839-f059-519c-8820-b16aa17fb9c3'
  const historicalCourseId = 'f0dde7bb-1bf6-5602-a489-cd324132c68a'

  // 1. Read operations on historical data
  console.log('\n--- 1. Read Operations on Historical Data ---')
  const subByQuizUser = await findSubmissionByQuizAndUser(historicalQuizId, historicalUserId)
  assert(subByQuizUser !== null, 'findSubmissionByQuizAndUser finds submission by compound key')
  assert(subByQuizUser?.quizId === historicalQuizId, 'Historical submission has correct quizId')
  assert(subByQuizUser?.userId === historicalUserId, 'Historical submission has correct userId')

  const subById = await findSubmissionById(subByQuizUser!.id)
  assert(subById !== null, 'findSubmissionById finds existing historical submission')
  assert(subById?.id === subByQuizUser!.id, 'Compound key matches expected submission ID')

  const subDetail = await findSubmissionDetailByQuizAndUser(historicalQuizId, historicalUserId)
  assert(subDetail !== null, 'findSubmissionDetailByQuizAndUser retrieves submission')
  assert(Array.isArray(subDetail?.answers) && subDetail!.answers.length === 3, 'Submission detail includes 3 nested answers')
  assert(subDetail!.answers[0].question !== null, 'Nested answer includes question details')

  const teacherList = await findSubmissionsByQuizId(historicalQuizId)
  assert(Array.isArray(teacherList) && teacherList.length >= 1, 'findSubmissionsByQuizId returns list for teacher')
  assert(teacherList.some((t: any) => t.user?.username === 'minhsuyyyyy'), 'Teacher list contains user username')

  const analytics = await findSubmissionsForAnalytics(historicalQuizId)
  assert(Array.isArray(analytics) && analytics.length >= 1, 'findSubmissionsForAnalytics returns scores')

  // 2. Enrollment Repository checks
  console.log('\n--- 2. Enrollment Repository Helper Checks ---')
  const enrollment = await findEnrollmentByUserAndCourse(historicalUserId, historicalCourseId)
  assert(enrollment !== null, 'findEnrollmentByUserAndCourse finds active enrollment for user')

  const enrollCount = await countEnrollmentsByCourseId(historicalCourseId)
  assert(enrollCount >= 1, `countEnrollmentsByCourseId returns valid count (found ${enrollCount})`)

  // 3. Write operations & Transaction rollback (Isolated Test Record)
  console.log('\n--- 3. Create & Cleanup Test Submission ---')
  // Find a quiz and user that do NOT currently have a submission
  // Quiz 3: b9e14796-def1-59ae-8f7a-b54ad53a8392
  const testQuizId = 'b9e14796-def1-59ae-8f7a-b54ad53a8392'
  const testQuestions = await prisma.question.findMany({ where: { quizId: testQuizId } })

  if (testQuestions.length > 0) {
    const createdSub = await createSubmissionWithAnswers({
      quizId: testQuizId,
      userId: historicalUserId,
      score: 1,
      totalPoints: 1,
      percentage: 100,
      answers: [
        {
          questionId: testQuestions[0].id,
          selectedAnswer: testQuestions[0].answer,
          isCorrect: true
        }
      ]
    })

    assert(createdSub !== null, 'createSubmissionWithAnswers successfully creates submission atomically')
    assert(createdSub.answers.length === 1, 'Created submission contains child answers')
    assert(createdSub.answers[0].isCorrect === true, 'Child answer stores isCorrect true')

    // Clean up test record to keep database pristine
    await deleteSubmission(createdSub.id)
    const checkDeleted = await findSubmissionById(createdSub.id)
    assert(checkDeleted === null, 'Test submission was cleaned up successfully')
  } else {
    console.log('  [SKIP] Test quiz has no questions for test submission creation')
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
