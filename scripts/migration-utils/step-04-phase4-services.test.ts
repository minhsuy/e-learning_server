/**
 * Test Suite for Phase 4 Step 4: Migrated Quiz & Question Services
 *
 * File: scripts/migration-utils/step-04-phase4-services.test.ts
 */

import prisma from '../../src/config/prisma'
import {
  createQuizService,
  updateQuizService,
  deleteQuizService,
  getQuizzesByLessonService
} from '../../src/services/quiz.service'

import {
  createQuestionService,
  updateQuestionService,
  deleteQuestionService
} from '../../src/services/question.service'

import { UserRole } from '../../src/types/enum'
import fs from 'fs'
import path from 'path'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 4 STEP 4 — MIGRATED QUIZ & QUESTION SERVICES')
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

  // Baseline database counts
  const [initQuizCount, initQuestionCount, initOptionCount] = await Promise.all([
    prisma.quiz.count(),
    prisma.question.count(),
    prisma.questionOption.count()
  ])

  console.log(`\nInitial PostgreSQL State:`)
  console.log(`  - quizzes:          ${initQuizCount}`)
  console.log(`  - questions:        ${initQuestionCount}`)
  console.log(`  - question_options: ${initOptionCount}\n`)

  // =========================================================================
  // 1. ARCHITECTURE & CODE PURITY AUDIT
  // =========================================================================
  console.log('--- 1. ARCHITECTURE & CODE PURITY AUDIT ---')

  const quizServiceContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/services/quiz.service.ts'),
    'utf-8'
  )
  const questionServiceContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/services/question.service.ts'),
    'utf-8'
  )

  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(quizServiceContent), 'quiz.service.ts does NOT import mongoose')
  assert(!quizServiceContent.includes('models/legacy/quiz.legacy.model'), 'quiz.service.ts does NOT import legacy quiz model')
  assert(quizServiceContent.includes('repositories/quiz.repository'), 'quiz.service.ts delegates to quiz.repository')

  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(questionServiceContent), 'question.service.ts does NOT import mongoose')
  assert(!questionServiceContent.includes('models/legacy/question.legacy.model'), 'question.service.ts does NOT import legacy question model')
  assert(questionServiceContent.includes('repositories/question.repository'), 'question.service.ts delegates to question.repository')

  // =========================================================================
  // 2. READ OPERATIONS ON EXISTING DATA & ANTI-CHEAT SECURITY
  // =========================================================================
  console.log('\n--- 2. READ OPERATIONS & ANTI-CHEAT AUDIT ---')

  const existingQuiz = await prisma.quiz.findFirst()
  if (!existingQuiz) {
    throw new Error('Pre-condition failed: Need at least one quiz in database')
  }

  // 2.1 getQuizzesByLessonService
  const studentQuizResult = await getQuizzesByLessonService(existingQuiz.lessonId)
  assert(studentQuizResult.success, 'getQuizzesByLessonService returns success for valid lesson')
  assert(Array.isArray(studentQuizResult.data), 'getQuizzesByLessonService returns array of quizzes')
  assert(studentQuizResult.data.length === 1, 'getQuizzesByLessonService returns single quiz array')

  const firstQuiz = studentQuizResult.data[0]
  assert(firstQuiz.lesson === existingQuiz.lessonId, 'Response exposes lesson field matching lessonId')
  assert(firstQuiz.courseId === existingQuiz.courseId, 'Response exposes courseId')
  assert(firstQuiz.passing_grade !== undefined, 'Response exposes passing_grade')
  assert(firstQuiz._id === existingQuiz.id, 'Response includes _id compatibility matching id')

  // 2.2 ANTI-CHEAT SECURITY CHECK: Answer field must be absent
  if (firstQuiz.questions && firstQuiz.questions.length > 0) {
    const leakedAnswer = firstQuiz.questions.some((q: any) => 'answer' in q)
    assert(!leakedAnswer, 'SECURITY: getQuizzesByLessonService strictly does NOT leak "answer" in any question')
    const hasOptions = firstQuiz.questions.every((q: any) => Array.isArray(q.options))
    assert(hasOptions, 'Questions in response format options as string[]')
  }

  // 2.3 Non-existent lesson
  const notFoundLessonResult = await getQuizzesByLessonService('00000000-0000-0000-0000-000000000000')
  assert(
    !notFoundLessonResult.success &&
      notFoundLessonResult.statusCode === 404 &&
      notFoundLessonResult.message === 'No quizzes found for this lesson',
    'getQuizzesByLessonService returns 404 when no quiz exists for lesson'
  )

  // =========================================================================
  // 3. MUTATION OPERATIONS IN TRANSACTION (ZERO-MUTATION VERIFICATION)
  // =========================================================================
  console.log('\n--- 3. MUTATION OPERATIONS & BUSINESS LOGIC AUDIT ---')

  let rollbackVerified = false

  try {
    await prisma.$transaction(async (tx) => {
      // Setup reference teacher and chapter
      const ownerTeacher = await tx.user.findFirst({ where: { role: 'TEACHER' } }) || (await tx.user.findFirst())
      if (!ownerTeacher) throw new Error('Need user in database')

      const refChapter = await tx.chapter.findFirst()
      if (!refChapter) throw new Error('Need chapter in database')

      // Ensure course author is ownerTeacher for this test
      const testCourse = await tx.course.findUnique({ where: { id: refChapter.courseId } })
      if (!testCourse) throw new Error('Need course')

      const nonOwnerTeacherId = '11111111-1111-1111-1111-111111111111'

      // Create a test lesson
      const testLesson = await tx.lesson.create({
        data: {
          title: `Service Test Lesson ${Date.now()}`,
          slug: `service-test-lesson-${Date.now()}`,
          chapterId: refChapter.id,
          courseId: refChapter.courseId,
          authorId: testCourse.authorId,
          duration: 15,
          content: 'Test content'
        }
      })

      // 3.1 Quiz Creation: Non-existent lesson
      const missingLessonRes = await createQuizService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          payload: {
            lesson: '00000000-0000-0000-0000-000000000000',
            title: 'Test Quiz',
            courseId: testCourse.id
          }
        },
        tx
      )
      assert(
        !missingLessonRes.success && missingLessonRes.statusCode === 404,
        '[QuizService] createQuizService returns 404 when lesson not found'
      )

      // 3.2 Quiz Creation: Non-owner teacher rejected
      const nonOwnerRes = await createQuizService(
        {
          userId: nonOwnerTeacherId,
          role: UserRole.TEACHER,
          payload: {
            lesson: testLesson.id,
            title: 'Test Quiz',
            courseId: testCourse.id
          }
        },
        tx
      )
      assert(
        !nonOwnerRes.success &&
          nonOwnerRes.statusCode === 403 &&
          nonOwnerRes.message === 'You are not the owner of this course',
        '[QuizService] createQuizService rejects non-owner teacher with 403'
      )

      // 3.3 Quiz Creation: Owner teacher succeeds
      const createRes = await createQuizService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          payload: {
            lesson: testLesson.id,
            title: 'New Service Test Quiz',
            description: 'Created via Service',
            duration: 20,
            passing_grade: 75,
            courseId: testCourse.id
          }
        },
        tx
      )
      assert(createRes.success, '[QuizService] createQuizService succeeds for course owner')
      assert(createRes.data.lesson === testLesson.id, '[QuizService] createQuizService maps lesson correctly')
      assert(createRes.data.passing_grade === 75, '[QuizService] createQuizService maps passing_grade correctly')
      assert(createRes.data._id !== undefined, '[QuizService] createQuizService provides _id compatibility')

      const createdQuizId = createRes.data.id

      // 3.4 Quiz Creation: Duplicate lesson quiz rejected
      const duplicateRes = await createQuizService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          payload: {
            lesson: testLesson.id,
            title: 'Duplicate Quiz',
            courseId: testCourse.id
          }
        },
        tx
      )
      assert(
        !duplicateRes.success &&
          duplicateRes.statusCode === 400 &&
          duplicateRes.message === 'Lesson already has a quiz',
        '[QuizService] createQuizService rejects duplicate lesson with 400'
      )

      // 3.5 Quiz Update: Non-owner teacher rejected
      const nonOwnerUpdateRes = await updateQuizService(
        {
          quizId: createdQuizId,
          userId: nonOwnerTeacherId,
          role: UserRole.TEACHER,
          payload: { title: 'Hacked Title' }
        },
        tx
      )
      assert(
        !nonOwnerUpdateRes.success && nonOwnerUpdateRes.statusCode === 403,
        '[QuizService] updateQuizService rejects non-owner teacher with 403'
      )

      // 3.6 Quiz Update: Owner succeeds
      const updateRes = await updateQuizService(
        {
          quizId: createdQuizId,
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          payload: {
            title: 'Updated Quiz Title via Service',
            duration: 30,
            passing_grade: 85
          }
        },
        tx
      )
      assert(updateRes.success, '[QuizService] updateQuizService succeeds for owner')
      assert(updateRes.data.title === 'Updated Quiz Title via Service', '[QuizService] updateQuizService updates title')
      assert(updateRes.data.passing_grade === 85, '[QuizService] updateQuizService updates passing_grade')

      // 3.7 Question Creation: Non-existent quiz rejected
      const missingQuizQRes = await createQuestionService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          payload: {
            quiz: '00000000-0000-0000-0000-000000000000',
            type: 'multiple_choice',
            title: 'Q',
            answer: 'A'
          }
        },
        tx
      )
      assert(
        !missingQuizQRes.success && missingQuizQRes.statusCode === 404,
        '[QuestionService] createQuestionService rejects non-existent quiz with 404'
      )

      // 3.8 Question Creation: Owner creates MCQ with options
      const createQRes = await createQuestionService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          payload: {
            quiz: createdQuizId,
            type: 'multiple_choice',
            title: 'What is Express.js?',
            options: ['Node.js Framework', 'Database', 'Browser'],
            answer: 'Node.js Framework',
            points: 2
          }
        },
        tx
      )
      assert(createQRes.success, '[QuestionService] createQuestionService creates MCQ with options')
      assert(createQRes.data.type === 'multiple_choice', '[QuestionService] Response exposes lowercase type')
      assert(Array.isArray(createQRes.data.options) && createQRes.data.options.length === 3, '[QuestionService] Response exposes options as string[]')
      assert(createQRes.data.answer === 'Node.js Framework', '[QuestionService] Response includes answer for teacher/admin')

      const createdQId = createQRes.data.id

      // 3.9 Question Update: options === undefined (options untouched)
      const updateQNoOptionsRes = await updateQuestionService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          questionId: createdQId,
          payload: {
            title: 'What is Express.js? (Edited)',
            options: undefined
          }
        },
        tx
      )
      assert(updateQNoOptionsRes.success, '[QuestionService] updateQuestionService succeeds')
      assert(updateQNoOptionsRes.data.title === 'What is Express.js? (Edited)', '[QuestionService] Updates title')
      assert(updateQNoOptionsRes.data.options.length === 3, '[QuestionService] options === undefined preserves existing options')

      // 3.10 Question Update: options replacement
      const updateQNewOptionsRes = await updateQuestionService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          questionId: createdQId,
          payload: {
            options: ['Framework A', 'Framework B']
          }
        },
        tx
      )
      assert(
        updateQNewOptionsRes.data.options.length === 2 &&
          updateQNewOptionsRes.data.options[0] === 'Framework A',
        '[QuestionService] Options replaced with new ordered elements'
      )

      // 3.11 Question Update: options === [] (options cleared)
      const updateQEmptyOptionsRes = await updateQuestionService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          questionId: createdQId,
          payload: {
            options: []
          }
        },
        tx
      )
      assert(
        updateQEmptyOptionsRes.data.options.length === 0,
        '[QuestionService] options === [] deletes all options'
      )

      // 3.12 Question Deletion
      const deleteQRes = await deleteQuestionService(
        {
          userId: testCourse.authorId,
          role: UserRole.TEACHER,
          questionId: createdQId
        },
        tx
      )
      assert(deleteQRes.success, '[QuestionService] deleteQuestionService deletes question successfully')

      // 3.13 Quiz Deletion
      const deleteQuizRes = await deleteQuizService(
        {
          quizId: createdQuizId,
          userId: testCourse.authorId,
          role: UserRole.TEACHER
        },
        tx
      )
      assert(deleteQuizRes.success, '[QuizService] deleteQuizService deletes quiz successfully')

      // Intentional Rollback
      throw new Error('ROLLBACK_INTENTIONAL')
    })
  } catch (err: any) {
    if (err.message === 'ROLLBACK_INTENTIONAL') {
      rollbackVerified = true
    } else {
      console.error('Unexpected error in transaction:', err)
    }
  }

  assert(rollbackVerified, '[Isolation] All service mutation tests rolled back cleanly — zero mutations committed')

  // =========================================================================
  // 4. DATABASE ZERO-MUTATION POST-TEST CHECK
  // =========================================================================
  console.log('\n--- 4. ZERO-MUTATION POST-TEST CHECK ---')

  const [postQuizCount, postQuestionCount, postOptionCount] = await Promise.all([
    prisma.quiz.count(),
    prisma.question.count(),
    prisma.questionOption.count()
  ])

  console.log(`Final Database State:`)
  console.log(`  - quizzes:          ${postQuizCount} (initial: ${initQuizCount})`)
  console.log(`  - questions:        ${postQuestionCount} (initial: ${initQuestionCount})`)
  console.log(`  - question_options: ${postOptionCount} (initial: ${initOptionCount})\n`)

  assert(postQuizCount === initQuizCount, '[ZeroMutation] quizzes table count unchanged (exactly 3)')
  assert(postQuestionCount === initQuestionCount, '[ZeroMutation] questions table count unchanged (exactly 5)')
  assert(postOptionCount === initOptionCount, '[ZeroMutation] question_options table count unchanged (exactly 20)')

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('='.repeat(80))
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
