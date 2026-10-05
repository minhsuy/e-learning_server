/**
 * TMDEMY — PHASE 5 STEP 5 TEST SUITE
 * Complete HTTP Integration, Evaluation, Security, Concurrency & Regression Audit
 *
 * File: scripts/migration-utils/step-05-phase5-http-integration.test.ts
 */

import http from 'http'
import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { prisma } from '../../src/config/prisma'
import quizSubmissionRouter from '../../src/routes/quizSubmission.route'
import { submitQuizValidator } from '../../src/middlewares/quizSubmission.middleware'
import { quizIdValidator } from '../../src/middlewares/quiz.middleware'
import { deleteSubmission } from '../../src/repositories/quizSubmission.repository'

dotenv.config()

const ACCESS_SECRET = process.env.JWT_SECRECT_ACCESS_TOKEN || 'thaiminh061206'

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✅ PASSED: ${testName}`)
  } else {
    failedTests++
    console.error(`  ❌ FAILED: ${testName}${detail ? ` — ${detail}` : ''}`)
  }
}

// Helper to run express-validator chains against a mock request
async function runValidation(chains: any[], req: Partial<Request>): Promise<any[]> {
  const mockReq = {
    headers: {},
    params: {},
    query: {},
    body: {},
    ...req
  } as Request
  for (const middleware of chains) {
    await new Promise<void>((resolve) => {
      middleware(mockReq, {} as Response, () => resolve())
    })
  }
  const { validationResult } = await import('express-validator')
  return validationResult(mockReq).array()
}

// Generate JWT for mock test users
function generateTestToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: '1h' })
}

// HTTP request helper
function sendRequest(
  port: number,
  method: string,
  path: string,
  token?: string,
  body?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : ''
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString()
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {}
            resolve({ status: res.statusCode || 500, body: parsed })
          } catch {
            resolve({ status: res.statusCode || 500, body: data })
          }
        })
      }
    )

    req.on('error', reject)
    if (body) {
      req.write(payload)
    }
    req.end()
  })
}

async function runTestSuite() {
  console.log('='.repeat(80))
  console.log('  PHASE 5 — HTTP INTEGRATION, SECURITY, CONCURRENCY & REGRESSION TEST SUITE')
  console.log('='.repeat(80))

  // 1. Validator Unit Tests
  console.log('\n--- 1. Middleware & Express Validator Unit Tests ---')
  const validUUID1 = 'd40087b3-0917-5e3c-bc44-0f36d3d8d127'
  const validUUID2 = 'ae9f84cd-eadb-5719-91d5-57986523aa5a'
  const invalidId = '68ef69853c8bd4c6638d55fe' // 24-char ObjectId

  const valSuccess = await runValidation(submitQuizValidator, {
    body: {
      quizId: validUUID1,
      answers: [{ question: validUUID2, selectedAnswer: 'color' }]
    }
  })
  assert(valSuccess.length === 0, 'submitQuizValidator passes valid payload with UUIDs')

  const valInvalidQuizId = await runValidation(submitQuizValidator, {
    body: {
      quizId: invalidId,
      answers: [{ question: validUUID2, selectedAnswer: 'color' }]
    }
  })
  assert(
    valInvalidQuizId.some((e: any) => e.msg === 'Invalid quiz ID'),
    'submitQuizValidator rejects MongoDB ObjectId for quizId'
  )

  const valInvalidQuestionId = await runValidation(submitQuizValidator, {
    body: {
      quizId: validUUID1,
      answers: [{ question: invalidId, selectedAnswer: 'color' }]
    }
  })
  assert(
    valInvalidQuestionId.some((e: any) => e.msg === 'Invalid question ID'),
    'submitQuizValidator rejects MongoDB ObjectId for questionId'
  )

  const valEmptyAnswers = await runValidation(submitQuizValidator, {
    body: {
      quizId: validUUID1,
      answers: []
    }
  })
  assert(
    valEmptyAnswers.some((e: any) => e.msg === 'Answers array is required'),
    'submitQuizValidator rejects empty answers array'
  )

  const valQuizParamSuccess = await runValidation(quizIdValidator, {
    params: { quizId: validUUID1 }
  })
  assert(valQuizParamSuccess.length === 0, 'quizIdValidator passes valid UUID route param')

  const valQuizParamFail = await runValidation(quizIdValidator, {
    params: { quizId: invalidId }
  })
  assert(valQuizParamFail.length > 0, 'quizIdValidator rejects non-UUID route param')

  // 2. Set up Express Server for Integration Tests
  console.log('\n--- 2. Setting Up Express App for HTTP Integration Tests ---')
  const app = express()
  app.use(express.json())
  app.use('/api/submissions', quizSubmissionRouter)

  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port
  console.log(`  🚀 Test server running on port ${port}`)

  const initialSubCount = await prisma.quizSubmission.count()
  const initialAnsCount = await prisma.quizSubmissionAnswer.count()

  // Known entities from PostgreSQL:
  const studentUser = await prisma.user.findFirst({ where: { username: 'minhsuyyyyy' } })
  const teacherUser = await prisma.user.findFirst({ where: { role: 'TEACHER' } })
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

  if (!studentUser) throw new Error('Student user minhsuyyyyy not found')
  const studentToken = generateTestToken(studentUser.id, studentUser.role.toLowerCase())
  const teacherToken = teacherUser ? generateTestToken(teacherUser.id, teacherUser.role.toLowerCase()) : ''
  const nonEnrolledToken = nonEnrolledUser ? generateTestToken(nonEnrolledUser.id, nonEnrolledUser.role.toLowerCase()) : ''

  // Quiz 1 (historical submitted): d40087b3-0917-5e3c-bc44-0f36d3d8d127
  // Quiz 3 (unsubmitted for studentUser): b9e14796-def1-59ae-8f7a-b54ad53a8392
  const historicalQuizId = 'd40087b3-0917-5e3c-bc44-0f36d3d8d127'
  const unsubmittedQuizId = 'b9e14796-def1-59ae-8f7a-b54ad53a8392'

  // 3. GET /api/submissions/:quizId (Student view)
  console.log('\n--- 3. GET /api/submissions/:quizId (Student View) ---')
  const getSubRes = await sendRequest(port, 'GET', `/api/submissions/${historicalQuizId}`, studentToken)
  assert(getSubRes.status === 200, 'GET /api/submissions/:quizId returns 200 for student')
  assert(getSubRes.body.success === true, 'Response body has success: true')
  assert(getSubRes.body.data?.submission?.id !== undefined, 'Response body includes submission id')
  assert(getSubRes.body.data?.submission?._id !== undefined, 'Response body includes _id backward compat')
  assert(Array.isArray(getSubRes.body.data?.submission?.answers), 'Response includes answers array')

  const getSubNotFound = await sendRequest(port, 'GET', `/api/submissions/ffffffff-ffff-4fff-8fff-ffffffffffff`, studentToken)
  assert(getSubNotFound.status === 404, 'GET /api/submissions/:quizId returns 404 for non-existent submission', `Got status: ${getSubNotFound.status}`)

  const getSubInvalidUUID = await sendRequest(port, 'GET', `/api/submissions/${invalidId}`, studentToken)
  assert(getSubInvalidUUID.status === 400, 'GET /api/submissions/:quizId returns 400 for invalid UUID param')

  // 4. GET /api/submissions/teacher/:quizId (Teacher view)
  console.log('\n--- 4. GET /api/submissions/teacher/:quizId (Teacher View) ---')
  if (teacherToken) {
    const teacherListRes = await sendRequest(port, 'GET', `/api/submissions/teacher/${historicalQuizId}`, teacherToken)
    assert(teacherListRes.status === 200, 'GET /api/submissions/teacher/:quizId returns 200 for teacher', `Got status: ${teacherListRes.status}`)
    assert(Array.isArray(teacherListRes.body.data), 'Returns array of student submissions')
    assert(teacherListRes.body.data?.[0]?.user !== undefined, 'Exposes user property')
    assert(teacherListRes.body.data?.[0]?.percentage !== undefined, 'Exposes percentage property')
  }

  // Unauthorized access check
  const studentAccessTeacher = await sendRequest(port, 'GET', `/api/submissions/teacher/${historicalQuizId}`, studentToken)
  assert(studentAccessTeacher.status === 403, 'Students are forbidden (403) from teacher endpoint')

  // 5. GET /api/submissions/teacher/analytics/:quizId
  console.log('\n--- 5. GET /api/submissions/teacher/analytics/:quizId ---')
  if (teacherToken) {
    const analyticsRes = await sendRequest(port, 'GET', `/api/submissions/teacher/analytics/${historicalQuizId}`, teacherToken)
    assert(analyticsRes.status === 200, 'GET /api/submissions/teacher/analytics/:quizId returns 200')
    assert(analyticsRes.body.data?.totalStudents >= 1, 'Analytics data contains totalStudents')
    assert(analyticsRes.body.data?.avgScore !== undefined, 'Analytics data contains avgScore')
    assert(analyticsRes.body.data?.completionRate !== undefined, 'Analytics data contains completionRate')
  }

  // 6. POST /api/submissions (Submission & Evaluation Tests)
  console.log('\n--- 6. POST /api/submissions (Submission & Evaluation) ---')

  // Test: Submit already submitted quiz
  const resAlready = await sendRequest(port, 'POST', '/api/submissions', studentToken, {
    quizId: historicalQuizId,
    answers: [{ question: validUUID2, selectedAnswer: 'color' }]
  })
  assert(resAlready.status === 400, 'Rejects already submitted quiz with 400')
  assert(resAlready.body.message === 'You have already submitted this quiz', 'Exact message: "You have already submitted this quiz"')

  // Test: Submit by non-enrolled user
  if (nonEnrolledToken && nonEnrolledUser) {
    const resNotEnrolled = await sendRequest(port, 'POST', '/api/submissions', nonEnrolledToken, {
      quizId: historicalQuizId,
      answers: [{ question: validUUID2, selectedAnswer: 'color' }]
    })
    assert(resNotEnrolled.status === 403, 'Rejects non-enrolled user with 403')
    assert(resNotEnrolled.body.message === 'You are not enrolled in this course', 'Exact message: "You are not enrolled in this course"')
  }

  // Test: Submit valid answers for unsubmitted quiz
  const unsubmittedQuestions = await prisma.question.findMany({ where: { quizId: unsubmittedQuizId } })
  let createdSubmissionId: string | null = null

  if (unsubmittedQuestions.length > 0) {
    const q1 = unsubmittedQuestions[0]

    // 6.1 Test duplicate question in request
    const resDup = await sendRequest(port, 'POST', '/api/submissions', studentToken, {
      quizId: unsubmittedQuizId,
      answers: [
        { question: q1.id, selectedAnswer: 'opt1' },
        { question: q1.id, selectedAnswer: 'opt2' }
      ]
    })
    assert(resDup.status === 400, 'Rejects request with duplicate question IDs')
    assert(resDup.body.message === 'Duplicate question submitted', 'Exact error message for duplicate question')

    // 6.2 Test question belonging to different quiz
    const resForeignQ = await sendRequest(port, 'POST', '/api/submissions', studentToken, {
      quizId: unsubmittedQuizId,
      answers: [{ question: validUUID2, selectedAnswer: 'any' }]
    })
    assert(resForeignQ.status === 400, 'Rejects question belonging to different quiz')
    assert(resForeignQ.body.message === 'Question does not belong to this quiz', 'Exact error message for foreign question')

    // 6.3 Test successful submission with exact score
    const resSuccess = await sendRequest(port, 'POST', '/api/submissions', studentToken, {
      quizId: unsubmittedQuizId,
      answers: [
        {
          question: q1.id,
          selectedAnswer: q1.answer
        }
      ]
    })

    assert(resSuccess.status === 200, 'POST /api/submissions succeeds with 200')
    assert(resSuccess.body.data?.scoreDisplay === '1/1', 'Score display equals "1/1"')
    assert(resSuccess.body.data?.percentage === 100, 'Percentage equals 100%')
    assert(resSuccess.body.data?.submission?._id !== undefined, 'Submission data contains _id alias')
    assert(resSuccess.body.data?.submission?.answers?.[0]?.isCorrect === true, 'Answer marked isCorrect: true')

    createdSubmissionId = resSuccess.body.data?.submission?.id

    // Cleanup submission
    if (createdSubmissionId) {
      await deleteSubmission(createdSubmissionId)
      console.log('  🧹 Cleaned up successful test submission')
    }
  }

  // 7. Concurrency Test: 2 simultaneous submissions for same user and quiz
  console.log('\n--- 7. Concurrency Test: Parallel Submissions ---')
  if (unsubmittedQuestions.length > 0) {
    const q1 = unsubmittedQuestions[0]
    const [req1, req2] = await Promise.all([
      sendRequest(port, 'POST', '/api/submissions', studentToken, {
        quizId: unsubmittedQuizId,
        answers: [{ question: q1.id, selectedAnswer: q1.answer }]
      }),
      sendRequest(port, 'POST', '/api/submissions', studentToken, {
        quizId: unsubmittedQuizId,
        answers: [{ question: q1.id, selectedAnswer: q1.answer }]
      })
    ])

    const successCount = (req1.status === 200 ? 1 : 0) + (req2.status === 200 ? 1 : 0)
    const rejectCount = (req1.status === 400 ? 1 : 0) + (req2.status === 400 ? 1 : 0)

    assert(successCount === 1, 'Concurrency: Exactly 1 concurrent request succeeded (HTTP 200)')
    assert(rejectCount === 1, 'Concurrency: Exactly 1 concurrent request was rejected (HTTP 400)')

    const rejectedReq = req1.status === 400 ? req1 : req2
    assert(
      rejectedReq.body.message === 'You have already submitted this quiz',
      'Concurrency: Rejected request received "You have already submitted this quiz"'
    )

    // Cleanup the one that succeeded
    const createdId = req1.status === 200 ? req1.body.data?.submission?.id : req2.body.data?.submission?.id
    if (createdId) {
      await deleteSubmission(createdId)
      console.log('  🧹 Cleaned up concurrent test submission')
    }
  }

  // 8. Database Integrity Check
  console.log('\n--- 8. Database Integrity Verification ---')
  const finalSubCount = await prisma.quizSubmission.count()
  const finalAnsCount = await prisma.quizSubmissionAnswer.count()

  assert(finalSubCount === initialSubCount, `Final quiz_submissions count is pristine (expected ${initialSubCount}, got ${finalSubCount})`)
  assert(finalAnsCount === initialAnsCount, `Final quiz_submission_answers count is pristine (expected ${initialAnsCount}, got ${finalAnsCount})`)

  // Close test server
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await prisma.$disconnect()

  console.log('\n' + '='.repeat(80))
  console.log(`  FINAL RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`)
  console.log('='.repeat(80))

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTestSuite().catch(async (err) => {
  console.error('Test suite failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})
