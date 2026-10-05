/**
 * Test Suite for Phase 4 Step 2: Quiz & Question Zod Application Models & Legacy Mongoose Isolation
 * Includes Compatibility Verification & API Contract Audit Tests
 *
 * File: scripts/migration-utils/step-02-phase4-zod-models.test.ts
 */

import {
  quizSchema,
  quizPublicSchema,
  quizDetailResponseSchema,
  createQuizRequestSchema,
  updateQuizRequestSchema,
  createQuizInputSchema,
  updateQuizInputSchema,
  mapCreateQuizRequestToInput,
  mapUpdateQuizRequestToInput,
  Quiz,
  QuizPublic,
  QuizDetailResponse,
  CreateQuizRequest,
  UpdateQuizRequest,
  CreateQuizInput,
  UpdateQuizInput
} from '../../src/models/quiz.model'
import QuizModelLegacy from '../../src/models/legacy/quiz.legacy.model'

import {
  questionSchema,
  questionPublicSchema,
  questionStudySchema,
  createQuestionRequestSchema,
  updateQuestionRequestSchema,
  createQuestionInputSchema,
  updateQuestionInputSchema,
  mapCreateQuestionRequestToInput,
  mapUpdateQuestionRequestToInput,
  questionTypeSchema,
  QuestionTypeValues,
  Question,
  QuestionPublic,
  QuestionStudy,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CreateQuestionInput,
  UpdateQuestionInput
} from '../../src/models/question.model'
import QuestionModelLegacy from '../../src/models/legacy/question.legacy.model'

import fs from 'fs'
import path from 'path'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 4 STEP 2 — QUIZ & QUESTION ZOD APPLICATION MODELS & LEGACY ISOLATION')
  console.log('  WITH API CONTRACT & COMPATIBILITY VERIFICATION AUDIT')
  console.log('='.repeat(80))

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`)
      passed++
    } else {
      console.error(`  ❌ FAILED: ${testName}`)
      failed++
    }
  }

  const validQuizUUID = '9ef997e1-8848-4cb9-9599-4d643efb3438'
  const validLessonUUID = '9da46f1e-f3b7-4a6c-941e-355b9e15967b'
  const validCourseUUID = '008a0d01-e2fb-4ce9-8041-3b77dc4a84be'
  const validUserUUID = '0624ae65-a82f-48d6-9fd1-4bc54ba1d48c'
  const validQuestionUUID = '0c231737-f131-4df2-a9b0-c6c7b96317bc'
  const invalidUUID = 'not-a-valid-uuid'
  const mongoObjectId = '507f1f77bcf86cd799439011'

  // =========================================================================
  // 1. QUIZ DOMAIN & TRANSPORT MODEL TESTS
  // =========================================================================
  console.log('\n--- 1. QUIZ APPLICATION & TRANSPORT MODEL TESTS ---')

  // 1.1 Valid UUID & Base Domain Schema
  const validQuizData = {
    id: validQuizUUID,
    title: 'Introduction to HTML Quiz',
    description: 'Test your understanding of basic HTML tags',
    duration: 15,
    passingGrade: 80,
    lessonId: validLessonUUID,
    courseId: validCourseUUID,
    createdById: validUserUUID,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const parsedQuiz = quizSchema.safeParse(validQuizData)
  assert(parsedQuiz.success, 'quizSchema accepts valid Quiz domain object with UUIDs')

  // 1.2 Invalid UUID rejection
  const invalidQuizUUIDResult = quizSchema.safeParse({
    ...validQuizData,
    id: invalidUUID
  })
  assert(!invalidQuizUUIDResult.success, 'quizSchema rejects invalid id UUID')

  const mongoIdQuizResult = quizSchema.safeParse({
    ...validQuizData,
    lessonId: mongoObjectId
  })
  assert(!mongoIdQuizResult.success, 'quizSchema rejects MongoDB ObjectId for lessonId (must be UUID)')

  // 1.3 Required Fields
  const missingTitleQuizResult = quizSchema.safeParse({
    ...validQuizData,
    title: ''
  })
  assert(!missingTitleQuizResult.success, 'quizSchema rejects empty title')

  const missingLessonQuizResult = quizSchema.safeParse({
    id: validQuizUUID,
    title: 'Quiz without lesson',
    courseId: validCourseUUID,
    createdById: validUserUUID,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  assert(!missingLessonQuizResult.success, 'quizSchema requires lessonId')

  // 1.4 Optional fields defaults
  const minimalQuizData = {
    id: validQuizUUID,
    title: 'Minimal Quiz',
    lessonId: validLessonUUID,
    courseId: validCourseUUID,
    createdById: validUserUUID,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const parsedMinimalQuiz = quizSchema.safeParse(minimalQuizData)
  assert(
    parsedMinimalQuiz.success &&
      parsedMinimalQuiz.data.description === '' &&
      parsedMinimalQuiz.data.duration === 0 &&
      parsedMinimalQuiz.data.passingGrade === 0,
    'quizSchema applies default values for description (""), duration (0), passingGrade (0)'
  )

  // 1.5 Create Quiz Input Schema
  const validCreateQuiz = {
    title: 'New Quiz',
    description: 'New Quiz Description',
    duration: 30,
    passingGrade: 75,
    lessonId: validLessonUUID,
    courseId: validCourseUUID,
    createdById: validUserUUID
  }
  const parsedCreateQuiz = createQuizInputSchema.safeParse(validCreateQuiz)
  assert(parsedCreateQuiz.success, 'createQuizInputSchema accepts valid domain input')

  const invalidCreateQuiz = createQuizInputSchema.safeParse({
    title: '',
    lessonId: invalidUUID,
    courseId: validCourseUUID,
    createdById: validUserUUID
  })
  assert(!invalidCreateQuiz.success, 'createQuizInputSchema rejects invalid data')

  // 1.6 Update Quiz Input Schema — Immutable lessonId and courseId
  const validUpdateQuiz = {
    title: 'Updated Quiz Title',
    duration: 45,
    passingGrade: 85
  }
  const parsedUpdateQuiz = updateQuizInputSchema.safeParse(validUpdateQuiz)
  assert(parsedUpdateQuiz.success, 'updateQuizInputSchema allows partial field updates (title, duration, passingGrade)')

  const updateQuizWithImmutableFields = updateQuizInputSchema.safeParse({
    title: 'Updated Quiz',
    lessonId: validLessonUUID,
    courseId: validCourseUUID
  })
  assert(
    updateQuizWithImmutableFields.success &&
      !('lessonId' in (updateQuizWithImmutableFields.data as any)) &&
      !('courseId' in (updateQuizWithImmutableFields.data as any)),
    'updateQuizInputSchema strictly strips immutable relation fields (lessonId, courseId)'
  )

  // 1.7 Public Response Schema
  const parsedPublicQuiz = quizPublicSchema.safeParse(validQuizData)
  assert(
    parsedPublicQuiz.success && !('createdById' in (parsedPublicQuiz.data as any)),
    'quizPublicSchema successfully extracts public student fields and omits createdById'
  )

  // 1.8 Detail Response Schema (with questions array)
  const detailQuizData = {
    ...validQuizData,
    questions: [
      {
        id: validQuestionUUID,
        quizId: validQuizUUID,
        type: 'multiple_choice' as const,
        title: 'What does HTML stand for?',
        options: ['Hyper Text Markup Language', 'High Tech Modern Language'],
        points: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }
  const parsedDetailQuiz = quizDetailResponseSchema.safeParse(detailQuizData)
  assert(
    parsedDetailQuiz.success && parsedDetailQuiz.data.questions.length === 1,
    'quizDetailResponseSchema parses nested public questions successfully'
  )

  // =========================================================================
  // 2. QUIZ HTTP DTO & MAPPER VERIFICATION (API CONTRACT COMPATIBILITY)
  // =========================================================================
  console.log('\n--- 2. QUIZ HTTP DTO & MAPPER VERIFICATION ---')

  const clientCreateQuizBody = {
    lesson: validLessonUUID, // legacy API field name
    courseId: validCourseUUID,
    title: 'Quiz from Client',
    description: 'A comprehensive quiz',
    duration: '20', // string from HTTP form/json coerced to number
    passing_grade: '80', // legacy API snake_case field name coerced to number
    createdById: 'malicious-injected-id' // client should NOT be trusted with creator ID
  }

  const mappedCreateQuiz = mapCreateQuizRequestToInput(clientCreateQuizBody, validUserUUID)
  assert(
    mappedCreateQuiz.lessonId === validLessonUUID &&
      mappedCreateQuiz.passingGrade === 80 &&
      mappedCreateQuiz.duration === 20 &&
      mappedCreateQuiz.createdById === validUserUUID,
    'mapCreateQuizRequestToInput: Maps lesson -> lessonId, passing_grade -> passingGrade, and injects auth userId as createdById'
  )

  const clientUpdateQuizBody = {
    title: 'Updated Quiz Title via API',
    passing_grade: 90,
    duration: 30
  }
  const mappedUpdateQuiz = mapUpdateQuizRequestToInput(clientUpdateQuizBody)
  assert(
    mappedUpdateQuiz.title === 'Updated Quiz Title via API' &&
      mappedUpdateQuiz.passingGrade === 90 &&
      mappedUpdateQuiz.duration === 30,
    'mapUpdateQuizRequestToInput: Correctly maps passing_grade -> passingGrade'
  )

  // =========================================================================
  // 3. QUESTION APPLICATION & TRANSPORT MODEL TESTS
  // =========================================================================
  console.log('\n--- 3. QUESTION APPLICATION & TRANSPORT MODEL TESTS ---')

  // 3.1 Valid UUID & Base Domain Schema
  const validQuestionData = {
    id: validQuestionUUID,
    quizId: validQuizUUID,
    type: 'multiple_choice' as const,
    title: 'What does CSS stand for?',
    options: ['Cascading Style Sheets', 'Creative Style System', 'Computer Style Sheet'],
    answer: 'Cascading Style Sheets',
    points: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const parsedQuestion = questionSchema.safeParse(validQuestionData)
  assert(parsedQuestion.success, 'questionSchema accepts valid Question domain object with UUIDs')

  // 3.2 Question Types
  assert(
    questionTypeSchema.safeParse('multiple_choice').success,
    'questionTypeSchema accepts "multiple_choice"'
  )
  assert(
    questionTypeSchema.safeParse('fill_in_blank').success,
    'questionTypeSchema accepts "fill_in_blank"'
  )
  const prismaMultipleChoice = questionTypeSchema.safeParse('MULTIPLE_CHOICE')
  assert(
    prismaMultipleChoice.success && prismaMultipleChoice.data === 'multiple_choice',
    'questionTypeSchema normalizes Prisma uppercase "MULTIPLE_CHOICE" to lowercase "multiple_choice"'
  )
  const prismaFillInBlank = questionTypeSchema.safeParse('FILL_IN_BLANK')
  assert(
    prismaFillInBlank.success && prismaFillInBlank.data === 'fill_in_blank',
    'questionTypeSchema normalizes Prisma uppercase "FILL_IN_BLANK" to lowercase "fill_in_blank"'
  )
  assert(!questionTypeSchema.safeParse('essay').success, 'questionTypeSchema rejects invalid type "essay"')
  assert(!questionTypeSchema.safeParse('boolean').success, 'questionTypeSchema rejects invalid type "boolean"')

  // 3.3 Multiple Choice vs Fill in Blank
  const fillInBlankData = {
    id: validQuestionUUID,
    quizId: validQuizUUID,
    type: 'fill_in_blank' as const,
    title: 'The primary protocol of the web is HTTP, which stands for HyperText Transfer _____?',
    options: [],
    answer: 'Protocol',
    points: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const parsedFillInBlank = questionSchema.safeParse(fillInBlankData)
  assert(parsedFillInBlank.success, 'questionSchema supports fill_in_blank with empty options')

  // 3.4 Options format & Legacy Compatibility
  const singleOptionQuestion = createQuestionInputSchema.safeParse({
    quizId: validQuizUUID,
    type: 'multiple_choice' as const,
    title: 'Question with single option in draft',
    options: ['Choice 1'],
    answer: 'Choice 1'
  })
  assert(
    singleOptionQuestion.success,
    'createQuestionInputSchema accepts array with any length to preserve legacy Express Validator behavior'
  )

  const invalidOptionsQuestion = questionSchema.safeParse({
    ...validQuestionData,
    options: [123, 456] // numbers instead of strings
  })
  assert(!invalidOptionsQuestion.success, 'questionSchema rejects options containing non-strings')

  // 3.5 Points
  const defaultPointsQuestion = questionSchema.safeParse({
    id: validQuestionUUID,
    quizId: validQuizUUID,
    title: 'Question without points',
    answer: 'Ans',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  assert(
    defaultPointsQuestion.success && defaultPointsQuestion.data.points === 1,
    'questionSchema defaults points to 1'
  )

  const invalidPointsQuestion = questionSchema.safeParse({
    ...validQuestionData,
    points: 0 // points must be >= 1
  })
  assert(!invalidPointsQuestion.success, 'questionSchema rejects points < 1')

  // 3.6 SECURITY: Public Schema MUST OMIT answer
  const parsedPublicQuestion = questionPublicSchema.safeParse(validQuestionData)
  assert(
    parsedPublicQuestion.success && !('answer' in parsedPublicQuestion.data),
    'SECURITY: questionPublicSchema strictly strips the answer field for students'
  )

  // 3.7 Study Schema INCLUDES answer
  const parsedStudyQuestion = questionStudySchema.safeParse(validQuestionData)
  assert(
    parsedStudyQuestion.success &&
      'answer' in parsedStudyQuestion.data &&
      parsedStudyQuestion.data.answer === 'Cascading Style Sheets',
    'questionStudySchema includes answer field for authorized teachers/admins'
  )

  // 3.8 Question HTTP DTO & Mapper (API Contract Compatibility)
  const clientCreateQuestionBody = {
    quiz: validQuizUUID, // legacy API field name
    type: 'multiple_choice',
    title: 'What is TypeScript?',
    options: ['Typed superset of JS', 'A style sheet language'],
    answer: 'Typed superset of JS',
    points: '2' // coerced from string
  }
  const mappedCreateQuestion = mapCreateQuestionRequestToInput(clientCreateQuestionBody)
  assert(
    mappedCreateQuestion.quizId === validQuizUUID &&
      mappedCreateQuestion.points === 2 &&
      mappedCreateQuestion.title === 'What is TypeScript?',
    'mapCreateQuestionRequestToInput: Correctly maps quiz -> quizId and coerces points'
  )

  // =========================================================================
  // 4. ARCHITECTURE & ISOLATION AUDIT
  // =========================================================================
  console.log('\n--- 4. ARCHITECTURE & ISOLATION AUDIT ---')

  const quizModelContent = fs.readFileSync(path.resolve(__dirname, '../../src/models/quiz.model.ts'), 'utf-8')
  const questionModelContent = fs.readFileSync(path.resolve(__dirname, '../../src/models/question.model.ts'), 'utf-8')

  // 4.1 Pure Zod Models (No mongoose, no prisma client)
  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(quizModelContent), 'src/models/quiz.model.ts does NOT import mongoose')
  assert(!/import\s+.*from\s+['"].*@prisma\/client['"]/.test(quizModelContent), 'src/models/quiz.model.ts does NOT import @prisma/client')
  assert(!/import\s+.*from\s+['"].*config\/prisma['"]/.test(quizModelContent), 'src/models/quiz.model.ts does NOT import prisma singleton')

  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(questionModelContent), 'src/models/question.model.ts does NOT import mongoose')
  assert(!/import\s+.*from\s+['"].*@prisma\/client['"]/.test(questionModelContent), 'src/models/question.model.ts does NOT import @prisma/client')
  assert(!/import\s+.*from\s+['"].*config\/prisma['"]/.test(questionModelContent), 'src/models/question.model.ts does NOT import prisma singleton')

  // 4.2 Legacy Files Exist
  const legacyQuizExists = fs.existsSync(path.resolve(__dirname, '../../src/models/legacy/quiz.legacy.model.ts'))
  const legacyQuestionExists = fs.existsSync(path.resolve(__dirname, '../../src/models/legacy/question.legacy.model.ts'))
  assert(legacyQuizExists, 'Legacy model exists at src/models/legacy/quiz.legacy.model.ts')
  assert(legacyQuestionExists, 'Legacy model exists at src/models/legacy/question.legacy.model.ts')

  // 4.3 QuizSubmission Legacy Dependency preserved
  const quizSubmissionServiceContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/services/quizSubmission.service.ts'),
    'utf-8'
  )
  assert(
    quizSubmissionServiceContent.includes('models/legacy/quiz.legacy.model'),
    'src/services/quizSubmission.service.ts imports QuizModel from legacy model'
  )
  assert(
    quizSubmissionServiceContent.includes('models/legacy/question.legacy.model'),
    'src/services/quizSubmission.service.ts imports QuestionModel from legacy model'
  )

  // 4.4 Certificate Service legacy dependency preserved
  const certServiceContent = fs.readFileSync(path.resolve(__dirname, '../../src/services/certificate.service.ts'), 'utf-8')
  assert(
    certServiceContent.includes('models/legacy/quiz.legacy.model'),
    'src/services/certificate.service.ts imports QuizModel from legacy model'
  )

  // 4.5 Quiz Service and Question Service migrated to Repositories (Step 4)
  const quizServiceContent = fs.readFileSync(path.resolve(__dirname, '../../src/services/quiz.service.ts'), 'utf-8')
  assert(
    !quizServiceContent.includes('models/legacy/quiz.legacy.model'),
    'src/services/quiz.service.ts no longer imports QuizModel from legacy model (migrated to repository)'
  )
  assert(
    quizServiceContent.includes('repositories/quiz.repository'),
    'src/services/quiz.service.ts imports quiz.repository'
  )

  const questionServiceContent = fs.readFileSync(path.resolve(__dirname, '../../src/services/question.service.ts'), 'utf-8')
  assert(
    !questionServiceContent.includes('models/legacy/question.legacy.model'),
    'src/services/question.service.ts no longer imports QuestionModel from legacy model (migrated to repository)'
  )
  assert(
    questionServiceContent.includes('repositories/question.repository'),
    'src/services/question.service.ts imports question.repository'
  )

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80))
  console.log(`  TOTAL TESTS: ${passed + failed}`)
  console.log(`  PASSED:      ${passed}`)
  console.log(`  FAILED:      ${failed}`)
  console.log('='.repeat(80))

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
