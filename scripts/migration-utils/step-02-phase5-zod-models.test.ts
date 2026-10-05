/**
 * Test Suite for Phase 5 Step 2: QuizSubmission Zod Application Model & Legacy Mongoose Isolation
 * File: scripts/migration-utils/step-02-phase5-zod-models.test.ts
 */

import {
  quizSubmissionSchema,
  quizSubmissionAnswerSchema,
  submitQuizInputSchema,
  submitQuizInputAnswerSchema,
  quizSubmissionResponseSchema,
  teacherQuizSubmissionItemSchema,
  teacherQuizAnalyticsSchema,
  QuizSubmission,
  QuizSubmissionAnswer,
  SubmitQuizInput
} from '../../src/models/quizSubmission.model'
import QuizSubmissionModelLegacy from '../../src/models/legacy/quizSubmission.legacy.model'
import fs from 'fs'
import path from 'path'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 5 STEP 2 — QUIZ SUBMISSION ZOD APPLICATION MODEL & LEGACY ISOLATION')
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

  // 1. Zod Base Domain Schema Tests
  console.log('\n--- 1. Base Domain Schema Validation ---')
  const validSubmission = {
    id: 'e18994c4-b95d-5cfe-b771-0640b7daaa16',
    quizId: 'd40087b3-0917-5e3c-bc44-0f36d3d8d127',
    userId: 'c55de839-f059-519c-8820-b16aa17fb9c3',
    score: 4,
    totalPoints: 4,
    percentage: 100,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const parsedSub = quizSubmissionSchema.safeParse(validSubmission)
  assert(parsedSub.success, 'quizSubmissionSchema parses valid submission object')

  const invalidSub = { ...validSubmission, id: 'not-a-uuid' }
  const parsedInvalid = quizSubmissionSchema.safeParse(invalidSub)
  assert(!parsedInvalid.success, 'quizSubmissionSchema rejects non-UUID id')

  // 2. Answer Schema Tests
  console.log('\n--- 2. QuizSubmissionAnswer Schema Validation ---')
  const validAnswer = {
    id: 'b83225c5-d311-56c6-98f0-075b8af9d3ca',
    submissionId: 'e18994c4-b95d-5cfe-b771-0640b7daaa16',
    questionId: 'ae9f84cd-eadb-5719-91d5-57986523aa5a',
    selectedAnswer: 'function myFunc() {}',
    isCorrect: true
  }
  const parsedAns = quizSubmissionAnswerSchema.safeParse(validAnswer)
  assert(parsedAns.success, 'quizSubmissionAnswerSchema parses valid answer object')

  // 3. Input Validation Schema Tests
  console.log('\n--- 3. SubmitQuizInput Schema Validation ---')
  const validPayload = {
    quizId: 'd40087b3-0917-5e3c-bc44-0f36d3d8d127',
    answers: [
      {
        question: 'ae9f84cd-eadb-5719-91d5-57986523aa5a',
        selectedAnswer: 'function myFunc() {}'
      }
    ]
  }
  const parsedInput = submitQuizInputSchema.safeParse(validPayload)
  assert(parsedInput.success, 'submitQuizInputSchema parses valid input payload')

  const emptyAnswersInput = { quizId: 'd40087b3-0917-5e3c-bc44-0f36d3d8d127', answers: [] }
  assert(!submitQuizInputSchema.safeParse(emptyAnswersInput).success, 'submitQuizInputSchema rejects empty answers array')

  // 4. Response Schemas Tests
  console.log('\n--- 4. Response Schemas Validation ---')
  const teacherItem = {
    user: 'minhsuyyyyy',
    score: 4,
    totalPoints: 4,
    percentage: 100,
    completedAt: new Date().toISOString()
  }
  assert(teacherQuizSubmissionItemSchema.safeParse(teacherItem).success, 'teacherQuizSubmissionItemSchema parses valid item')

  const analyticsItem = {
    totalStudents: 10,
    avgScore: 3.5,
    minScore: 1,
    maxScore: 4,
    completionRate: 80
  }
  assert(teacherQuizAnalyticsSchema.safeParse(analyticsItem).success, 'teacherQuizAnalyticsSchema parses valid analytics')

  // 5. Legacy Mongoose Isolation Verification
  console.log('\n--- 5. Legacy Mongoose Isolation Tests ---')
  assert(typeof QuizSubmissionModelLegacy === 'function', 'Legacy QuizSubmissionModel is exported correctly from legacy folder')
  assert(QuizSubmissionModelLegacy.modelName === 'QuizSubmission', 'Legacy QuizSubmissionModel has modelName "QuizSubmission"')

  const legacyFilePath = path.resolve(__dirname, '../../src/models/legacy/quizSubmission.legacy.model.ts')
  assert(fs.existsSync(legacyFilePath), 'src/models/legacy/quizSubmission.legacy.model.ts exists on disk')

  const certServicePath = path.resolve(__dirname, '../../src/services/certificate.service.ts')
  const certContent = fs.readFileSync(certServicePath, 'utf8')
  assert(
    certContent.includes("from '~/models/legacy/quizSubmission.legacy.model'"),
    'certificate.service.ts imports QuizSubmissionModel from legacy model path'
  )

  console.log('\n' + '='.repeat(80))
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('='.repeat(80))

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
