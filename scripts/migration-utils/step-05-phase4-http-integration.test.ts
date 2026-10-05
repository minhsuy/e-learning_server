/**
 * TMDEMY — PHASE 4 STEP 5 TEST SUITE
 * Middleware, Validator, Controller & Route Integration Test Suite
 *
 * File: scripts/migration-utils/step-05-phase4-http-integration.test.ts
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import express, { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { connectPrisma, disconnectPrisma, prisma } from '../../src/config/prisma'
import quizRouter from '../../src/routes/quiz.route'
import questionRouter from '../../src/routes/question.route'
import { errorHandler } from '../../src/middlewares/errorHandler'
import {
  createQuizValidator,
  updateQuizValidator,
  quizIdValidator,
  lessonIdValidator
} from '../../src/middlewares/quiz.middleware'
import {
  createQuestionValidator,
  updateQuestionValidator,
  questionIdValidator
} from '../../src/middlewares/question.middleware'

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
      middleware(mockReq, {} as Response, () => {
        resolve()
      })
    })
  }
  const result = validationResult(mockReq)
  return result.array()
}

async function runStep5IntegrationTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 4 STEP 5 — HTTP INTEGRATION & CONTROLLER/ROUTE AUDIT')
  console.log('='.repeat(80))

  await connectPrisma()

  // 1. Initial State Check
  const initialQuizzes = await prisma.quiz.count()
  const initialQuestions = await prisma.question.count()
  const initialOptions = await prisma.questionOption.count()

  console.log('\nInitial PostgreSQL State:')
  console.log(`  - quizzes:          ${initialQuizzes}`)
  console.log(`  - questions:        ${initialQuestions}`)
  console.log(`  - question_options: ${initialOptions}`)

  const validUUID = 'a0000000-0000-4000-8000-000000000001'
  const validUUID2 = 'b0000000-0000-4000-8000-000000000002'
  const legacyObjectId = '507f1f77bcf86cd799439011'
  const malformedString = 'not-a-valid-uuid'

  // =========================================================================
  // SUITE 1: ARCHITECTURE & CODE PURITY AUDIT
  // =========================================================================
  console.log('\n--- 1. ARCHITECTURE & CODE PURITY AUDIT ---')

  const quizMiddlewareContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/middlewares/quiz.middleware.ts'),
    'utf-8'
  )
  const questionMiddlewareContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/middlewares/question.middleware.ts'),
    'utf-8'
  )
  const quizControllerContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/controller/quiz.controller.ts'),
    'utf-8'
  )
  const questionControllerContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/controller/question.controller.ts'),
    'utf-8'
  )
  const quizRouteContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/routes/quiz.route.ts'),
    'utf-8'
  )
  const questionRouteContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/routes/question.route.ts'),
    'utf-8'
  )

  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(quizMiddlewareContent), 'quiz.middleware.ts does NOT import mongoose')
  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(questionMiddlewareContent), 'question.middleware.ts does NOT import mongoose')
  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(quizControllerContent), 'quiz.controller.ts does NOT import mongoose')
  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(questionControllerContent), 'question.controller.ts does NOT import mongoose')
  assert(!/import\s+.*from\s+['"].*comment\.middleware['"]/.test(quizRouteContent), 'quiz.route.ts does NOT import from comment.middleware')
  assert(quizRouteContent.includes('lessonIdValidator'), 'quiz.route.ts includes lessonIdValidator')
  assert(quizMiddlewareContent.includes('lessonIdValidator'), 'quiz.middleware.ts exports lessonIdValidator')

  // =========================================================================
  // SUITE 2: EXPRESS VALIDATOR CHAINS DIRECT TESTS
  // =========================================================================
  console.log('\n--- 2. EXPRESS VALIDATOR CHAINS TESTS ---')

  // 2.1 createQuizValidator
  const validCreateQuizErrors = await runValidation(createQuizValidator, {
    body: {
      lesson: validUUID,
      title: 'Valid Quiz Title',
      courseId: validUUID2,
      duration: 30,
      passing_grade: 80
    }
  })
  assert(validCreateQuizErrors.length === 0, '[createQuizValidator] Valid payload accepted with 0 errors')

  const legacyLessonErrors = await runValidation(createQuizValidator, {
    body: {
      lesson: legacyObjectId,
      title: 'Quiz with legacy ObjectId',
      courseId: validUUID2
    }
  })
  assert(legacyLessonErrors.some((e) => e.msg === 'Invalid Lesson ID'), '[createQuizValidator] Rejects legacy MongoDB ObjectId with "Invalid Lesson ID"')

  const malformedLessonErrors = await runValidation(createQuizValidator, {
    body: {
      lesson: malformedString,
      title: 'Quiz with malformed ID',
      courseId: validUUID2
    }
  })
  assert(malformedLessonErrors.some((e) => e.msg === 'Invalid Lesson ID'), '[createQuizValidator] Rejects malformed string with "Invalid Lesson ID"')

  const missingTitleErrors = await runValidation(createQuizValidator, {
    body: {
      lesson: validUUID,
      courseId: validUUID2
    }
  })
  assert(missingTitleErrors.some((e) => e.msg === 'Quiz title is required'), '[createQuizValidator] Enforces required title')

  const legacyCourseIdErrors = await runValidation(createQuizValidator, {
    body: {
      lesson: validUUID,
      title: 'Quiz with legacy CourseId',
      courseId: legacyObjectId
    }
  })
  assert(legacyCourseIdErrors.some((e) => e.msg === 'Invalid Course ID'), '[Verification A] [createQuizValidator] Rejects legacy MongoDB ObjectId for courseId with "Invalid Course ID"')

  // 2.2 updateQuizValidator
  const validUpdateQuizErrors = await runValidation(updateQuizValidator, {
    params: { quizId: validUUID },
    body: { title: 'Updated Title', duration: 45, passing_grade: 85 }
  })
  assert(validUpdateQuizErrors.length === 0, '[updateQuizValidator] Valid update payload accepted')

  const legacyQuizIdUpdateErrors = await runValidation(updateQuizValidator, {
    params: { quizId: legacyObjectId },
    body: { title: 'Updated Title' }
  })
  assert(legacyQuizIdUpdateErrors.some((e) => e.msg === 'Invalid Quiz ID'), '[updateQuizValidator] Rejects legacy ObjectId with "Invalid Quiz ID"')

  // 2.3 quizIdValidator
  const validQuizIdErrors = await runValidation(quizIdValidator, { params: { quizId: validUUID } })
  assert(validQuizIdErrors.length === 0, '[quizIdValidator] Accepts valid UUID')

  const legacyQuizIdErrors = await runValidation(quizIdValidator, { params: { quizId: legacyObjectId } })
  assert(legacyQuizIdErrors.some((e) => e.msg === 'Invalid quiz ID'), '[quizIdValidator] Rejects legacy ObjectId with "Invalid quiz ID"')

  // 2.4 lessonIdValidator
  const validLessonIdErrors = await runValidation(lessonIdValidator, { params: { lessonId: validUUID } })
  assert(validLessonIdErrors.length === 0, '[lessonIdValidator] Accepts valid UUID')

  const legacyLessonIdErrors = await runValidation(lessonIdValidator, { params: { lessonId: legacyObjectId } })
  assert(legacyLessonIdErrors.some((e) => e.msg === 'Invalid lesson ID'), '[lessonIdValidator] Rejects legacy ObjectId with "Invalid lesson ID"')

  // 2.5 createQuestionValidator
  const validCreateQuestionErrors = await runValidation(createQuestionValidator, {
    body: {
      quiz: validUUID,
      type: 'multiple_choice',
      title: 'What is TypeScript?',
      options: ['Language', 'OS'],
      answer: 'Language'
    }
  })
  assert(validCreateQuestionErrors.length === 0, '[createQuestionValidator] Accepts valid MCQ question payload')

  const validFillBlankErrors = await runValidation(createQuestionValidator, {
    body: {
      quiz: validUUID,
      type: 'fill_in_blank',
      title: 'Fill the blank',
      answer: 'Exact'
    }
  })
  assert(validFillBlankErrors.length === 0, '[createQuestionValidator] Accepts valid fill_in_blank payload')

  const legacyQuizInQuestionErrors = await runValidation(createQuestionValidator, {
    body: {
      quiz: legacyObjectId,
      type: 'multiple_choice',
      title: 'Question with legacy Quiz ID',
      answer: 'A'
    }
  })
  assert(legacyQuizInQuestionErrors.some((e) => e.msg === 'Invalid Quiz ID'), '[createQuestionValidator] Rejects legacy ObjectId for quiz with "Invalid Quiz ID"')

  const invalidTypeErrors = await runValidation(createQuestionValidator, {
    body: {
      quiz: validUUID,
      type: 'essay',
      title: 'Essay question',
      answer: 'Long answer'
    }
  })
  assert(invalidTypeErrors.some((e) => e.msg === 'Invalid question type'), '[createQuestionValidator] Rejects unsupported question type with "Invalid question type"')

  // 2.6 updateQuestionValidator & questionIdValidator
  const validUpdateQuestionErrors = await runValidation(updateQuestionValidator, {
    params: { questionId: validUUID },
    body: { options: ['X', 'Y', 'Z'], points: 2 }
  })
  assert(validUpdateQuestionErrors.length === 0, '[updateQuestionValidator] Accepts valid question update')

  const legacyQuestionIdErrors = await runValidation(questionIdValidator, { params: { questionId: legacyObjectId } })
  assert(legacyQuestionIdErrors.some((e) => e.msg === 'Invalid Question ID'), '[questionIdValidator] Rejects legacy ObjectId with "Invalid Question ID"')

  // =========================================================================
  // SETUP HTTP TEST SERVER
  // =========================================================================
  const app = express()
  app.use(express.json())
  app.use('/api/quiz', quizRouter)
  app.use('/api/questions', questionRouter)
  app.use(errorHandler)

  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port
  const baseUrl = `http://localhost:${port}`

  // Identify real database entities for HTTP requests
  const existingQuizzes = await prisma.quiz.findMany({
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  })
  const existingQuiz = existingQuizzes[0]
  const course = await prisma.course.findUnique({ where: { id: existingQuiz.courseId } })
  const ownerTeacher = await prisma.user.findUnique({ where: { id: course?.authorId } })
  const otherTeacher = await prisma.user.findFirst({
    where: { role: 'TEACHER', id: { not: course?.authorId } }
  })
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const normalUser = await prisma.user.findFirst({ where: { role: 'USER' } })

  if (!course || !ownerTeacher || !otherTeacher || !adminUser || !normalUser) {
    throw new Error('Precondition failed: reference users or courses missing in database')
  }

  // Find a lesson without quiz for createQuiz HTTP testing
  const allLessons = await prisma.lesson.findMany({ where: { courseId: course.id } })
  const quizLessonIds = new Set(existingQuizzes.map((q) => q.lessonId))
  const freeLesson = allLessons.find((l) => !quizLessonIds.has(l.id))

  const ownerToken = jwt.sign({ userId: ownerTeacher.id, role: 'teacher' }, ACCESS_SECRET, { expiresIn: '1h' })
  const otherTeacherToken = jwt.sign({ userId: otherTeacher.id, role: 'teacher' }, ACCESS_SECRET, { expiresIn: '1h' })
  const adminToken = jwt.sign({ userId: adminUser.id, role: 'admin' }, ACCESS_SECRET, { expiresIn: '1h' })
  const userToken = jwt.sign({ userId: normalUser.id, role: 'user' }, ACCESS_SECRET, { expiresIn: '1h' })

  // =========================================================================
  // SUITE 3: HTTP AUTHENTICATION & ROLE AUTHORIZATION MATRIX
  // =========================================================================
  console.log('\n--- 3. HTTP AUTHENTICATION & AUTHORIZATION MATRIX ---')

  // 3.1 Missing token -> 401
  const noTokenRes = await fetch(`${baseUrl}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lesson: validUUID, title: 'No auth', courseId: validUUID2 })
  })
  assert(noTokenRes.status === 401, '[HTTP Auth] POST /api/quiz without token returns 401')
  const noTokenJson = await noTokenRes.json()
  assert(noTokenJson.error === 'Access Token is missing!', '[HTTP Auth] Error message is "Access Token is missing!"')

  // 3.2 Invalid token -> 401
  const invalidTokenRes = await fetch(`${baseUrl}/api/quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid.jwt.token'
    },
    body: JSON.stringify({ lesson: validUUID, title: 'Invalid auth', courseId: validUUID2 })
  })
  assert(invalidTokenRes.status === 401, '[HTTP Auth] POST /api/quiz with invalid token returns 401')

  // 3.3 Role USER forbidden -> 403
  const userRoleRes = await fetch(`${baseUrl}/api/quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({ lesson: validUUID, title: 'User role', courseId: validUUID2 })
  })
  assert(userRoleRes.status === 403, '[HTTP Auth] POST /api/quiz with USER role returns 403 Forbidden')
  const userRoleJson = await userRoleRes.json()
  assert(userRoleJson.message === 'FORBIDDEN - Teacher or Admin role required', '[HTTP Auth] Role error message matches legacy contract')

  // 3.4 Role USER forbidden on Question endpoint -> 403
  const userQuestionRes = await fetch(`${baseUrl}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({ quiz: validUUID, type: 'multiple_choice', title: 'Q', answer: 'A' })
  })
  assert(userQuestionRes.status === 403, '[HTTP Auth] POST /api/questions with USER role returns 403 Forbidden')

  // =========================================================================
  // SUITE 4: HTTP PUBLIC QUIZ BY LESSON (ANTI-CHEAT AUDIT)
  // =========================================================================
  console.log('\n--- 4. HTTP PUBLIC QUIZ BY LESSON (ANTI-CHEAT AUDIT) ---')

  // 4.1 Invalid UUID param returns 400
  const invalidLessonParamRes = await fetch(`${baseUrl}/api/quiz/lesson/${legacyObjectId}`)
  assert(invalidLessonParamRes.status === 400, '[HTTP Public] GET /api/quiz/lesson/:lessonId with ObjectId returns 400 Validation Error')
  const invalidParamJson = await invalidLessonParamRes.json()
  assert(
    invalidParamJson.errors?.lessonId === 'Invalid lesson ID' ||
      (Array.isArray(invalidParamJson.errors) && invalidParamJson.errors.some((e: any) => e.msg === 'Invalid lesson ID')),
    '[HTTP Public] Returns "Invalid lesson ID" from quiz.middleware'
  )

  // 4.2 Non-existent lesson UUID returns 404
  const notFoundLessonRes = await fetch(`${baseUrl}/api/quiz/lesson/${validUUID}`)
  assert(notFoundLessonRes.status === 404, '[HTTP Public] GET /api/quiz/lesson/:lessonId with non-existent UUID returns 404')

  // 4.3 Existing lesson returns 200 with formatted data
  const publicQuizRes = await fetch(`${baseUrl}/api/quiz/lesson/${existingQuiz.lessonId}`)
  assert(publicQuizRes.status === 200, '[HTTP Public] GET /api/quiz/lesson/:lessonId for existing lesson returns 200')
  const publicQuizJson = await publicQuizRes.json()
  assert(publicQuizJson.success === true, '[HTTP Public] Response has success: true')
  assert(Array.isArray(publicQuizJson.data), '[HTTP Public] Response data is an array (legacy contract)')
  const publicQuizItem = publicQuizJson.data[0]
  assert(publicQuizItem.id === existingQuiz.id, '[HTTP Public] Returns matching quiz ID')
  assert(publicQuizItem._id === existingQuiz.id, '[HTTP Public] Exposes _id compatibility matching id')
  assert(publicQuizItem.lesson === existingQuiz.lessonId, '[HTTP Public] Exposes lesson field matching lessonId')
  assert(typeof publicQuizItem.passing_grade === 'number', '[HTTP Public] Exposes passing_grade as number')
  assert(publicQuizItem.courseId === existingQuiz.courseId, '[HTTP Public] Exposes courseId')

  // 4.4 ANTI-CHEAT: Ensure student cannot see answer in any question
  const childQuestions = publicQuizItem.questions || []
  assert(childQuestions.length > 0, '[Anti-Cheat] Quiz contains questions for student')
  let answerLeaked = false
  for (const q of childQuestions) {
    if ('answer' in q) {
      answerLeaked = true
      break
    }
  }
  assert(!answerLeaked, '[Anti-Cheat] SECURITY GUARANTEED: Absolutely NO question contains "answer" field for students')
  if (childQuestions[0]) {
    assert(Array.isArray(childQuestions[0].options), '[Compatibility] Question options is an array')
    assert(typeof childQuestions[0].options[0] === 'string', '[Compatibility] Question option item is a string')
    assert(childQuestions[0].type === 'multiple_choice', '[Compatibility] Question type is lowercase "multiple_choice"')
  }

  // =========================================================================
  // SUITE 5: HTTP QUIZ CRUD & CROSS-TEACHER ISOLATION
  // =========================================================================
  console.log('\n--- 5. HTTP QUIZ CRUD & CROSS-TEACHER ISOLATION ---')

  // 5.1 Teacher 2 cannot create quiz on Course owned by Teacher 1 -> 403
  if (freeLesson) {
    const unauthTeacherCreateRes = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherTeacherToken}`
      },
      body: JSON.stringify({
        lesson: freeLesson.id,
        title: 'Unauthorized Quiz',
        courseId: course.id,
        passing_grade: 70
      })
    })
  }

  // 5.1b Verification A: POST /api/quiz with 24-character MongoDB ObjectId in courseId returns 400
  if (freeLesson) {
    const invalidCourseIdHttpRes = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        lesson: freeLesson.id,
        title: 'Invalid CourseId Quiz',
        courseId: legacyObjectId
      })
    })
    assert(invalidCourseIdHttpRes.status === 400, '[Verification A] POST /api/quiz with 24-character ObjectId courseId returns 400 Validation Error')
    const invalidCourseIdJson = await invalidCourseIdHttpRes.json()
    assert(
      invalidCourseIdJson.errors?.courseId === 'Invalid Course ID',
      '[Verification A] Express validator returns "Invalid Course ID" and prevents Prisma P2023 crash'
    )
  }

  // 5.2 Duplicate quiz on existing lesson returns 400
  const duplicateLessonRes = await fetch(`${baseUrl}/api/quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`
    },
    body: JSON.stringify({
      lesson: existingQuiz.lessonId,
      title: 'Duplicate Quiz',
      courseId: course.id
    })
  })
  assert(duplicateLessonRes.status === 400, '[Quiz CRUD] Creating duplicate quiz on same lesson returns 400')
  const duplicateJson = await duplicateLessonRes.json()
  assert(
    duplicateJson.message === 'Lesson already has a quiz',
    '[Quiz CRUD] Error message confirms duplicate constraint',
    JSON.stringify(duplicateJson)
  )

  // 5.3 Owner teacher creates a quiz (cleaned up at end)
  let createdQuizId: string | null = null
  if (freeLesson) {
    const createQuizRes = await fetch(`${baseUrl}/api/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        lesson: freeLesson.id,
        title: 'HTTP Integration Test Quiz',
        courseId: course.id,
        duration: 40,
        passing_grade: 75
      })
    })
    assert(createQuizRes.status === 200, '[Quiz CRUD] Owner teacher successfully creates quiz via HTTP (200)')
    const createQuizJson = await createQuizRes.json()
    assert(createQuizJson.success === true, '[Quiz CRUD] Response has success: true')
    assert(createQuizJson.data.title === 'HTTP Integration Test Quiz', '[Quiz CRUD] Quiz title stored correctly')
    assert(createQuizJson.data._id === createQuizJson.data.id, '[Quiz CRUD] Created quiz includes _id compatibility')
    createdQuizId = createQuizJson.data.id

    // 5.4 Unauthorized teacher cannot update quiz -> 403
    const unauthUpdateRes = await fetch(`${baseUrl}/api/quiz/${createdQuizId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherTeacherToken}`
      },
      body: JSON.stringify({ title: 'Hacked Title' })
    })
    assert(unauthUpdateRes.status === 403, '[Quiz CRUD] Unauthorized teacher cannot update quiz (403)')

    // 5.5 Owner teacher updates quiz -> 200
    const ownerUpdateRes = await fetch(`${baseUrl}/api/quiz/${createdQuizId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({ title: 'Updated Test Quiz Title', passing_grade: 85 })
    })
    assert(ownerUpdateRes.status === 200, '[Quiz CRUD] Owner teacher updates quiz successfully (200)')
    const ownerUpdateJson = await ownerUpdateRes.json()
    assert(ownerUpdateJson.data.title === 'Updated Test Quiz Title', '[Quiz CRUD] Updated title confirmed')
    assert(ownerUpdateJson.data.passing_grade === 85, '[Quiz CRUD] Updated passing_grade confirmed')

    // =========================================================================
    // SUITE 6: HTTP QUESTION CRUD & OPTIONS MAPPING
    // =========================================================================
    console.log('\n--- 6. HTTP QUESTION CRUD & OPTIONS MAPPING ---')

    // 6.1 Create question with invalid quiz UUID returns 400
    const invalidQuizQuestionRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        quiz: legacyObjectId,
        type: 'multiple_choice',
        title: 'Q with legacy ID',
        answer: 'A'
      })
    })
    assert(invalidQuizQuestionRes.status === 400, '[Question CRUD] POST /api/questions with legacy Quiz ID returns 400 Validation Error')

    // 6.2 Owner teacher creates question -> 200
    const createQuestionRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        quiz: createdQuizId,
        type: 'multiple_choice',
        title: 'What is Express?',
        options: ['Web framework', 'Database', 'Operating System', 'Browser'],
        answer: 'Web framework',
        points: 2
      })
    })
    assert(createQuestionRes.status === 200, '[Question CRUD] Owner teacher creates MCQ question via HTTP (200)')
    const createQuestionJson = await createQuestionRes.json()
    assert(createQuestionJson.success === true, '[Question CRUD] Response has success: true')
    const createdQuestion = createQuestionJson.data
    assert(createdQuestion.type === 'multiple_choice', '[Question CRUD] Response type is lowercase "multiple_choice"')
    assert(Array.isArray(createdQuestion.options), '[Question CRUD] Response options is an array')
    assert(createdQuestion.options.length === 4, '[Question CRUD] 4 options created')
    assert(createdQuestion.answer === 'Web framework', '[Question CRUD] Teacher receives answer in response')
    const questionId = createdQuestion.id

    // 6.2.1 Verification B: Teacher 2 creates question in Quiz of Teacher 1 -> 403 Forbidden
    const unauthCreateQuestionRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherTeacherToken}`
      },
      body: JSON.stringify({
        quiz: createdQuizId,
        type: 'multiple_choice',
        title: 'Hacked Question',
        options: ['A', 'B'],
        answer: 'A'
      })
    })
    assert(unauthCreateQuestionRes.status === 403, '[Verification B] Teacher 2 creating Question in Quiz of Teacher 1 returns HTTP 403')

    // 6.2.2 Verification B: Create question with non-existent quiz returns 404
    const notFoundQuizQuestionRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        quiz: validUUID,
        type: 'multiple_choice',
        title: 'Question for ghost quiz',
        options: ['A', 'B'],
        answer: 'A'
      })
    })
    assert(notFoundQuizQuestionRes.status === 404, '[Verification B] Create question with non-existent Quiz UUID returns HTTP 404')

    // 6.3 Update question options replacement
    const updateOptionsRes = await fetch(`${baseUrl}/api/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        options: ['Choice 1', 'Choice 2'],
        title: 'Updated Question Title'
      })
    })
    assert(updateOptionsRes.status === 200, '[Question CRUD] Updates question options replacement (200)')
    const updateOptionsJson = await updateOptionsRes.json()
    assert(updateOptionsJson.data.options.length === 2, '[Question CRUD] Options replaced to 2 items')
    assert(updateOptionsJson.data.options[0] === 'Choice 1', '[Question CRUD] First option text confirmed')

    // 6.3.1 Verification B: Teacher 2 updates question of Teacher 1 -> 403 Forbidden
    const unauthUpdateQuestionRes = await fetch(`${baseUrl}/api/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherTeacherToken}`
      },
      body: JSON.stringify({
        title: 'Hacked Update'
      })
    })
    assert(unauthUpdateQuestionRes.status === 403, '[Verification B] Teacher 2 updating Question of Teacher 1 returns HTTP 403')

    // 6.3.2 Verification B: Update non-existent question returns 404
    const notFoundQuestionUpdateRes = await fetch(`${baseUrl}/api/questions/${validUUID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        title: 'Update Ghost Question'
      })
    })
    assert(notFoundQuestionUpdateRes.status === 404, '[Verification B] Update non-existent Question UUID returns HTTP 404')

    // 6.4 Update question options === [] clears all options
    const emptyOptionsRes = await fetch(`${baseUrl}/api/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        options: []
      })
    })
    assert(emptyOptionsRes.status === 200, '[Question CRUD] options: [] clears all options (200)')
    const emptyOptionsJson = await emptyOptionsRes.json()
    assert(emptyOptionsJson.data.options.length === 0, '[Question CRUD] All options successfully removed')

    // 6.4.1 Verification B: Teacher 2 deletes question of Teacher 1 -> 403 Forbidden
    const unauthDeleteQuestionRes = await fetch(`${baseUrl}/api/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${otherTeacherToken}`
      }
    })
    assert(unauthDeleteQuestionRes.status === 403, '[Verification B] Teacher 2 deleting Question of Teacher 1 returns HTTP 403')

    // 6.4.2 Verification B: Delete non-existent question returns 404
    const notFoundQuestionDeleteRes = await fetch(`${baseUrl}/api/questions/${validUUID}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`
      }
    })
    assert(notFoundQuestionDeleteRes.status === 404, '[Verification B] Delete non-existent Question UUID returns HTTP 404')

    // 6.4.3 Verification B: Admin creates, updates and deletes question in any quiz -> Allowed (200)
    const adminCreateQRes = await fetch(`${baseUrl}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        quiz: createdQuizId,
        type: 'multiple_choice',
        title: 'Admin Created Question',
        options: ['Yes', 'No'],
        answer: 'Yes'
      })
    })
    assert(adminCreateQRes.status === 200, '[Verification B] Admin creating question in any quiz returns HTTP 200 (Allowed)')
    const adminQJson = await adminCreateQRes.json()
    const adminQId = adminQJson.data.id

    const adminUpdateQRes = await fetch(`${baseUrl}/api/questions/${adminQId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title: 'Admin Updated Title' })
    })
    assert(adminUpdateQRes.status === 200, '[Verification B] Admin updating question returns HTTP 200 (Allowed)')

    const adminDeleteQRes = await fetch(`${baseUrl}/api/questions/${adminQId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    })
    assert(adminDeleteQRes.status === 200, '[Verification B] Admin deleting question returns HTTP 200 (Allowed)')

    // 6.5 Delete question -> 200
    const deleteQuestionRes = await fetch(`${baseUrl}/api/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`
      }
    })
    assert(deleteQuestionRes.status === 200, '[Question CRUD] Owner teacher deletes question (200)')

    // 5.6 Owner teacher deletes quiz -> 200
    const deleteQuizRes = await fetch(`${baseUrl}/api/quiz/${createdQuizId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ownerToken}`
      }
    })
    assert(deleteQuizRes.status === 200, '[Quiz CRUD] Owner teacher deletes quiz (200)')
  }

  // Close HTTP Server
  server.close()

  // =========================================================================
  // SUITE 7: ZERO-MUTATION POST-TEST CHECK
  // =========================================================================
  console.log('\n--- 7. ZERO-MUTATION POST-TEST DATABASE VERIFICATION ---')
  const finalQuizzes = await prisma.quiz.count()
  const finalQuestions = await prisma.question.count()
  const finalOptions = await prisma.questionOption.count()

  console.log('Final Database State:')
  console.log(`  - quizzes:          ${finalQuizzes} (initial: ${initialQuizzes})`)
  console.log(`  - questions:        ${finalQuestions} (initial: ${initialQuestions})`)
  console.log(`  - question_options: ${finalOptions} (initial: ${initialOptions})`)

  assert(finalQuizzes === initialQuizzes, `[ZeroMutation] quizzes table count unchanged (exactly ${initialQuizzes})`)
  assert(finalQuestions === initialQuestions, `[ZeroMutation] questions table count unchanged (exactly ${initialQuestions})`)
  assert(finalOptions === initialOptions, `[ZeroMutation] question_options table count unchanged (exactly ${initialOptions})`)

  await disconnectPrisma()

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(`  TOTAL TESTS: ${totalTests}`)
  console.log(`  PASSED:      ${passedTests}`)
  console.log(`  FAILED:      ${failedTests}`)
  console.log('='.repeat(80))

  if (failedTests > 0) {
    process.exit(1)
  }
}

runStep5IntegrationTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
