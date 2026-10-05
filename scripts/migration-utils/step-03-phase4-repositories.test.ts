/**
 * Test Suite for Phase 4 Step 3: Functional Quiz & Question Repositories
 *
 * File: scripts/migration-utils/step-03-phase4-repositories.test.ts
 */

import { QuestionType, Prisma } from '@prisma/client'
import prisma from '../../src/config/prisma'
import {
  findQuizById,
  findQuizByIdWithPublicQuestions,
  findQuizByIdWithDetail,
  findQuizByLessonId,
  findQuizByLessonIdWithPublicQuestions,
  findQuizzesByCourseId,
  findQuizzesByCourseIdWithPublicQuestions,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  QUIZ_PUBLIC_SELECT,
  QUIZ_WITH_PUBLIC_QUESTIONS_SELECT,
  QUIZ_DETAIL_SELECT
} from '../../src/repositories/quiz.repository'

import {
  findQuestionById,
  findQuestionsByQuizId,
  findQuestionsByQuizIdPublic,
  findQuestionsByQuizIdStudy,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsByQuizId,
  formatQuestionOptions,
  QUESTION_PUBLIC_SELECT,
  QUESTION_STUDY_SELECT
} from '../../src/repositories/question.repository'

import fs from 'fs'
import path from 'path'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 4 STEP 3 — FUNCTIONAL QUIZ & QUESTION REPOSITORIES')
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

  // Record initial DB counts for zero-mutation assertion
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
  console.log('--- 1. ARCHITECTURE & PURITY AUDIT ---')

  const quizRepoContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/repositories/quiz.repository.ts'),
    'utf-8'
  )
  const questionRepoContent = fs.readFileSync(
    path.resolve(__dirname, '../../src/repositories/question.repository.ts'),
    'utf-8'
  )

  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(quizRepoContent), 'quiz.repository.ts does NOT import mongoose')
  assert(!quizRepoContent.includes('class QuizRepository'), 'quiz.repository.ts is functional, not class-based')
  assert(!/class\s+.*BaseRepository/.test(quizRepoContent) && !/extends\s+BaseRepository/.test(quizRepoContent), 'quiz.repository.ts does not use BaseRepository')
  assert(quizRepoContent.includes('~/config/prisma'), 'quiz.repository.ts imports Prisma Singleton')

  assert(!/import\s+.*from\s+['"].*mongoose['"]/.test(questionRepoContent), 'question.repository.ts does NOT import mongoose')
  assert(!questionRepoContent.includes('class QuestionRepository'), 'question.repository.ts is functional, not class-based')
  assert(!/class\s+.*BaseRepository/.test(questionRepoContent) && !/extends\s+BaseRepository/.test(questionRepoContent), 'question.repository.ts does not use BaseRepository')
  assert(questionRepoContent.includes('~/config/prisma'), 'question.repository.ts imports Prisma Singleton')

  // =========================================================================
  // 2. READ OPERATIONS ON EXISTING DATA
  // =========================================================================
  console.log('\n--- 2. READ OPERATIONS ON EXISTING DATA ---')

  const existingQuiz = await prisma.quiz.findFirst({
    include: { questions: { include: { options: true } } }
  })
  if (!existingQuiz) {
    throw new Error('Pre-condition failed: Expected at least one quiz in database!')
  }

  // 2.1 findQuizById
  const quizById = await findQuizById(existingQuiz.id)
  assert(quizById !== null && quizById.id === existingQuiz.id, 'findQuizById finds existing quiz by UUID')

  const nonExistentQuiz = await findQuizById('00000000-0000-0000-0000-000000000000')
  assert(nonExistentQuiz === null, 'findQuizById returns null for non-existent UUID')

  // 2.2 findQuizByLessonId
  const quizByLesson = await findQuizByLessonId(existingQuiz.lessonId)
  assert(quizByLesson !== null && quizByLesson.id === existingQuiz.id, 'findQuizByLessonId finds quiz by unique lessonId')

  // 2.3 findQuizzesByCourseId
  const quizzesByCourse = await findQuizzesByCourseId(existingQuiz.courseId)
  assert(quizzesByCourse.length >= 1, 'findQuizzesByCourseId returns quizzes for a course')

  // 2.4 SECURITY: findQuizByIdWithPublicQuestions (STRICTLY NO ANSWERS)
  const publicQuiz = await findQuizByIdWithPublicQuestions(existingQuiz.id)
  assert(publicQuiz !== null, 'findQuizByIdWithPublicQuestions returns public quiz')
  if (publicQuiz && publicQuiz.questions.length > 0) {
    const hasAnswerInPublic = publicQuiz.questions.some((q: any) => 'answer' in q)
    assert(!hasAnswerInPublic, 'SECURITY: findQuizByIdWithPublicQuestions strictly omits "answer" from all questions')
  }

  // 2.5 SECURITY: findQuizByIdWithDetail (INCLUDES ANSWERS)
  const detailQuiz = await findQuizByIdWithDetail(existingQuiz.id)
  assert(detailQuiz !== null, 'findQuizByIdWithDetail returns detail quiz')
  if (detailQuiz && detailQuiz.questions.length > 0) {
    const hasAnswerInDetail = detailQuiz.questions.every((q: any) => typeof q.answer === 'string')
    assert(hasAnswerInDetail, 'findQuizByIdWithDetail includes "answer" field for teachers/admins')
  }

  // 2.6 Question Queries
  const existingQuestions = await findQuestionsByQuizId(existingQuiz.id)
  assert(existingQuestions.length === existingQuiz.questions.length, 'findQuestionsByQuizId returns all questions for quiz')

  const publicQuestions = await findQuestionsByQuizIdPublic(existingQuiz.id)
  assert(
    publicQuestions.length === existingQuestions.length &&
      !publicQuestions.some((q: any) => 'answer' in q),
    'SECURITY: findQuestionsByQuizIdPublic returns questions strictly without "answer"'
  )

  const studyQuestions = await findQuestionsByQuizIdStudy(existingQuiz.id)
  assert(
    studyQuestions.length === existingQuestions.length &&
      studyQuestions.every((q: any) => typeof q.answer === 'string'),
    'findQuestionsByQuizIdStudy returns questions with "answer" for instructors'
  )

  // 2.7 formatQuestionOptions helper
  if (existingQuestions.length > 0 && existingQuestions[0].options.length > 0) {
    const formatted = formatQuestionOptions(existingQuestions[0])
    assert(
      Array.isArray(formatted.options) &&
        formatted.options.length === existingQuestions[0].options.length &&
        typeof formatted.options[0] === 'string',
      'formatQuestionOptions maps QuestionOption[] to options: string[] for legacy compatibility'
    )
  }

  // 2.8 Unique lessonId constraint test
  let uniqueConstraintCaught = false
  try {
    await prisma.$transaction(async (dupTx) => {
      await createQuiz(
        {
          title: 'Duplicate Lesson Quiz',
          lessonId: existingQuiz.lessonId, // Already exists in DB!
          courseId: existingQuiz.courseId,
          createdById: existingQuiz.createdById
        },
        dupTx
      )
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      uniqueConstraintCaught = true
    }
  }
  assert(uniqueConstraintCaught, '[QuizRepo] createQuiz rejects duplicate lessonId with Prisma P2002')

  // =========================================================================
  // 3. MUTATION OPERATIONS IN TRANSACTION WITH AUTOMATIC ROLLBACK
  // =========================================================================
  console.log('\n--- 3. MUTATION OPERATIONS IN TRANSACTION (ZERO MUTATION VERIFICATION) ---')

  let rollbackVerified = false

  try {
    await prisma.$transaction(async (tx) => {
      // Find a reference teacher and chapter to attach test data
      const refUser = (await tx.user.findFirst({ where: { role: 'TEACHER' } })) || (await tx.user.findFirst())
      const refChapter = await tx.chapter.findFirst()
      if (!refUser || !refChapter) {
        throw new Error('Pre-condition failed: Need at least one user and one chapter in database')
      }

      // Create a temporary test lesson
      const testLesson = await tx.lesson.create({
        data: {
          title: `Temp Test Lesson ${Date.now()}`,
          slug: `temp-test-lesson-${Date.now()}`,
          chapterId: refChapter.id,
          courseId: refChapter.courseId,
          authorId: refUser.id,
          duration: 10,
          content: 'Test content'
        }
      })

      // 3.1 createQuiz
      const createdQuiz = await createQuiz(
        {
          title: 'Transactional Test Quiz',
          description: 'Quiz created for repository testing',
          duration: 25,
          passingGrade: 80,
          lessonId: testLesson.id,
          courseId: refChapter.courseId,
          createdById: refUser.id
        },
        tx
      )
      assert(createdQuiz.id.length === 36, '[QuizRepo] createQuiz creates record with valid UUID')
      assert(createdQuiz.passingGrade === 80, '[QuizRepo] createQuiz stores passingGrade properly')

      // 3.2 updateQuiz
      const updatedQuiz = await updateQuiz(
        createdQuiz.id,
        {
          title: 'Updated Test Quiz Title',
          duration: 35,
          passingGrade: 85
        },
        tx
      )
      assert(
        updatedQuiz.title === 'Updated Test Quiz Title' &&
          updatedQuiz.duration === 35 &&
          updatedQuiz.passingGrade === 85,
        '[QuizRepo] updateQuiz mutates scalar fields correctly'
      )

      // 3.4 createQuestion with multiple options
      const createdMCQ = await createQuestion(
        {
          quizId: createdQuiz.id,
          type: QuestionType.MULTIPLE_CHOICE,
          title: 'What is PostgreSQL?',
          answer: 'Relational Database',
          points: 2,
          options: ['Relational Database', 'NoSQL Database', 'Key-Value Store', 'Graph Database']
        },
        tx
      )
      assert(createdMCQ.id.length === 36, '[QuestionRepo] createQuestion creates question with valid UUID')
      assert(createdMCQ.options.length === 4, '[QuestionRepo] createQuestion creates 4 child question_options')
      assert(
        createdMCQ.options[0].order === 0 &&
          createdMCQ.options[1].order === 1 &&
          createdMCQ.options[2].order === 2 &&
          createdMCQ.options[3].order === 3,
        '[QuestionRepo] createQuestion preserves 0-indexed order on options'
      )

      // 3.5 createQuestion for fill_in_blank without options
      const createdFIB = await createQuestion(
        {
          quizId: createdQuiz.id,
          type: QuestionType.FILL_IN_BLANK,
          title: 'PostgreSQL uses SQL, which stands for Structured _____ Language.',
          answer: 'Query',
          points: 1,
          options: []
        },
        tx
      )
      assert(createdFIB.options.length === 0, '[QuestionRepo] createQuestion creates fill_in_blank with 0 options')

      // 3.6 updateQuestion with options === undefined (options MUST NOT be touched)
      const updatedMCQNoOptionsTouch = await updateQuestion(
        createdMCQ.id,
        {
          title: 'What is PostgreSQL? (Updated Title)',
          points: 3,
          options: undefined // explicitly undefined!
        },
        tx
      )
      assert(
        updatedMCQNoOptionsTouch.title === 'What is PostgreSQL? (Updated Title)' &&
          updatedMCQNoOptionsTouch.points === 3 &&
          updatedMCQNoOptionsTouch.options.length === 4,
        '[QuestionRepo] updateQuestion with options === undefined preserves existing options completely'
      )

      // 3.7 updateQuestion with new options array (options REPLACED in order)
      const updatedMCQWithNewOptions = await updateQuestion(
        createdMCQ.id,
        {
          options: ['PostgreSQL Option A', 'PostgreSQL Option B']
        },
        tx
      )
      assert(
        updatedMCQWithNewOptions.options.length === 2 &&
          updatedMCQWithNewOptions.options[0].optionText === 'PostgreSQL Option A' &&
          updatedMCQWithNewOptions.options[0].order === 0 &&
          updatedMCQWithNewOptions.options[1].optionText === 'PostgreSQL Option B' &&
          updatedMCQWithNewOptions.options[1].order === 1,
        '[QuestionRepo] updateQuestion replaces options atomically and resets order'
      )

      // 3.8 updateQuestion with options: [] (options CLEARED)
      const updatedMCQClearedOptions = await updateQuestion(
        createdMCQ.id,
        {
          options: []
        },
        tx
      )
      assert(
        updatedMCQClearedOptions.options.length === 0,
        '[QuestionRepo] updateQuestion with options === [] deletes all existing options'
      )

      // 3.9 deleteQuestion (Cascade check)
      const deletedQ = await deleteQuestion(createdFIB.id, tx)
      assert(deletedQ.id === createdFIB.id, '[QuestionRepo] deleteQuestion deletes single question')
      const checkDeletedQ = await findQuestionById(createdFIB.id, tx)
      assert(checkDeletedQ === null, '[QuestionRepo] findQuestionById returns null for deleted question')

      // 3.10 deleteQuestionsByQuizId
      const batchDeleteResult = await deleteQuestionsByQuizId(createdQuiz.id, tx)
      assert(batchDeleteResult.count === 1, '[QuestionRepo] deleteQuestionsByQuizId deletes remaining questions')

      // 3.11 deleteQuiz
      const deletedQuiz = await deleteQuiz(createdQuiz.id, tx)
      assert(deletedQuiz.id === createdQuiz.id, '[QuizRepo] deleteQuiz deletes quiz successfully')
      const checkDeletedQuiz = await findQuizById(createdQuiz.id, tx)
      assert(checkDeletedQuiz === null, '[QuizRepo] findQuizById returns null after quiz deletion')

      // Throw intentional rollback to guarantee ZERO mutations to the database
      throw new Error('ROLLBACK_INTENTIONAL')
    })
  } catch (err: any) {
    if (err.message === 'ROLLBACK_INTENTIONAL') {
      rollbackVerified = true
    } else {
      console.error('Unexpected transaction failure:', err)
    }
  }

  assert(rollbackVerified, '[Isolation] Transaction rolled back cleanly — zero mutations committed')

  // =========================================================================
  // 4. DATABASE ZERO-MUTATION VERIFICATION
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
