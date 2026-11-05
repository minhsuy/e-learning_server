import dotenv from 'dotenv'
dotenv.config()

import {
  EEnrollmentStatus,
  ExerciseDifficulty,
  ExerciseStatus,
  Prisma,
  SubmissionStatus,
  TestCaseStatus,
  UserRole
} from '@prisma/client'
import { prisma } from '~/config/prisma'
import {
  archiveCodingExercise,
  createCodingExercise,
  createCodingExerciseRevision,
  createManyCodingTestCases,
  findCodingExerciseById,
  findLatestPublishedRevision,
  findLatestRevision
} from '~/repositories/codingExercise.repository'
import {
  createCodingSubmission,
  findCodingSubmissionById
} from '~/repositories/codingSubmission.repository'
import {
  ConcurrencySemaphore,
  verifyReferenceSolution
} from '~/services/codeExecution.service'
import {
  createCodingExerciseService,
  publishCodingExerciseService,
  unpublishCodingExerciseService
} from '~/services/codingExercise.service'
import {
  getSubmissionDetailService,
  recoverStalePendingSubmissionsService,
  submitCodeService
} from '~/services/codingSubmission.service'
import {
  E2BError,
  E2BExecutionResponse,
  IE2BClient
} from '~/integrations/e2b/e2b.client'
import codingExerciseRouter from '~/routes/codingExercise.route'

/**
 * TMDEMY — STEP 5 AUTOMATED VERIFICATION SUITE
 * 
 * Verifies:
 * Group 1: Concurrency Semaphore Unit & Stress Tests
 * Group 2: Teacher Publish Authorization & Validation Gates
 * Group 3: Automated Reference Solution Verification Gate (Failures & 100% Pass)
 * Group 4: Teacher Unpublish Workflows
 * Group 5: Student Submission Gamification & Course Progress Integration
 * Group 6: Idempotency & Reward De-duplication Verification (No Double Rewards)
 * Group 7: Stale PENDING Submission Recovery (Single & Batch)
 * Group 8: Express Router Route Registration Audit
 */

let totalChecks = 0
let passedChecks = 0
let failedChecks = 0

function assert(condition: boolean, group: string, message: string) {
  totalChecks++
  if (condition) {
    passedChecks++
    console.log(`  PASS: [${group}] ${message}`)
  } else {
    failedChecks++
    console.error(`  FAIL: [${group}] ${message}`)
  }
}

// ============================================================================
// MOCK E2B CLIENT FOR DETERMINISTIC STEP 5 TESTING
// ============================================================================

class MockE2BClient implements IE2BClient {
  public simulateOffline = false
  public simulateTimeout = false
  public simulateSyntaxError = false

  async checkHealth(): Promise<{ ok: boolean; version?: string; message?: string }> {
    if (this.simulateOffline) return { ok: false, message: 'Mock E2B offline' }
    return { ok: true, version: 'E2B v2.x (Mock)', message: 'Mock E2B online' }
  }

  async executeJavaScript(
    harnessSource: string,
    nonce: string,
    options?: { timeLimitMs?: number }
  ): Promise<E2BExecutionResponse> {
    const res = await this.executeTestSuite([{ harnessSource, nonce, timeLimitMs: options?.timeLimitMs }])
    return res[0]
  }

  async executeTestSuite(
    items: Array<{ harnessSource: string; nonce: string; timeLimitMs?: number }>
  ): Promise<E2BExecutionResponse[]> {
    if (this.simulateOffline) {
      throw new E2BError('E2B Cloud API unreachable: ECONNREFUSED', 'API_ERROR')
    }

    return items.map((item) => {
      if (this.simulateTimeout) {
        return {
          stdout: '',
          stderr: 'Execution timed out',
          exitCode: 124,
          timedOut: true,
          executionTimeMs: item.timeLimitMs || 2000,
          error: 'Execution timed out'
        }
      }

      if (this.simulateSyntaxError || item.harnessSource.includes('SYNTAX_ERROR')) {
        return {
          stdout: '',
          stderr: 'SyntaxError: Unexpected token ;',
          exitCode: 1,
          timedOut: false,
          executionTimeMs: 20,
          error: 'SyntaxError: Unexpected token ;'
        }
      }

      // Check for faulty reference solution
      if (item.harnessSource.includes('FAILING_REFERENCE_SOLUTION')) {
        const payload = JSON.stringify({
          success: true,
          hasReturned: true,
          returnValue: -999, // Wrong answer
          userStdout: 'Faulty calculation\n'
        })
        const stdout = `__TM_GRADING_RESULT_START__${item.nonce}__\n${payload}\n__TM_GRADING_RESULT_END__${item.nonce}__\n`
        return {
          stdout,
          stderr: '',
          exitCode: 0,
          timedOut: false,
          executionTimeMs: 35
        }
      }

      // Parse test input
      const match = item.harnessSource.match(/const __testInputs = JSON\.parse\(([\s\S]*?)\);/)
      let n = 5
      if (match) {
        try {
          const parsed = JSON.parse(JSON.parse(match[1]))
          n = Number(parsed[0])
        } catch {
          n = 5
        }
      }

      const isWrongAnswer = item.harnessSource.includes('WRONG_STUDENT_CODE')
      const returnValue = isWrongAnswer ? 0 : (n * (n + 1)) / 2

      const payload = JSON.stringify({
        success: true,
        hasReturned: true,
        returnValue,
        userStdout: `Calculated sum for n=${n}\n`
      })

      const stdout = `__TM_GRADING_RESULT_START__${item.nonce}__\n${payload}\n__TM_GRADING_RESULT_END__${item.nonce}__\n`

      return {
        stdout,
        stderr: '',
        exitCode: 0,
        timedOut: false,
        executionTimeMs: 35
      }
    })
  }
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

async function runStep5TestSuite() {
  console.log('====================================================================')
  console.log('TMDEMY — STEP 5 AUTOMATED VERIFICATION SUITE')
  console.log('Testing: Concurrency Semaphore, Publish/Unpublish, Gamification & Progress')
  console.log('====================================================================\n')

  const mockE2B = new MockE2BClient()

  // --------------------------------------------------------------------------
  // GROUP 1: CONCURRENCY SEMAPHORE UNIT & STRESS TESTS
  // --------------------------------------------------------------------------
  console.log('--- GROUP 1: Concurrency Semaphore Unit & Stress Tests ---')
  const semaphore = new ConcurrencySemaphore(3)

  assert(semaphore.activeCount === 0, 'Group 1', 'Initial active count is 0')
  assert(semaphore.waitingCount === 0, 'Group 1', 'Initial waiting count is 0')

  // Run 6 tasks through semaphore with max concurrency 3
  let runningPeak = 0
  let currentRunning = 0
  const executedTaskIds: number[] = []

  const tasks = Array.from({ length: 6 }, (_, i) => async () => {
    return semaphore.run(async () => {
      currentRunning++
      if (currentRunning > runningPeak) runningPeak = currentRunning
      await new Promise((r) => setTimeout(r, 50))
      executedTaskIds.push(i)
      currentRunning--
      return i
    })
  })

  const taskResults = await Promise.all(tasks.map((t) => t()))
  assert(taskResults.length === 6, 'Group 1', 'All 6 tasks resolved successfully')
  assert(runningPeak <= 3, 'Group 1', `Peak concurrency was ${runningPeak} (bounded by limit of 3)`)
  assert(semaphore.activeCount === 0, 'Group 1', 'Active count returned to 0 after all tasks')
  assert(semaphore.waitingCount === 0, 'Group 1', 'Waiting count returned to 0')

  // Error handling in semaphore
  try {
    await semaphore.run(async () => {
      throw new Error('Simulated task error')
    })
  } catch (err: any) {
    assert(err.message === 'Simulated task error', 'Group 1', 'Semaphore correctly propagates errors')
  }
  assert(semaphore.activeCount === 0, 'Group 1', 'Active count decremented after error')

  // --------------------------------------------------------------------------
  // TEST DATA SETUP
  // --------------------------------------------------------------------------
  console.log('\n--- Setting Up Database Test Entities ---')

  // 1. Create Teacher 1 (Author)
  const teacher1 = await prisma.user.create({
    data: {
      username: `teacher1_${Date.now()}`,
      email: `step5_teacher_${Date.now()}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER,
      currentStreak: 0,
      longestStreak: 0
    }
  })

  // 2. Create Teacher 2 (Other teacher)
  const teacher2 = await prisma.user.create({
    data: {
      username: `teacher2_${Date.now()}`,
      email: `step5_other_teacher_${Date.now()}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  // 3. Create Student
  const student = await prisma.user.create({
    data: {
      username: `student_${Date.now()}`,
      email: `step5_student_${Date.now()}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null
    }
  })

  // 4. Create Category
  const category = await prisma.category.create({
    data: {
      name: `Step 5 Category ${Date.now()}`,
      slug: `step-5-category-${Date.now()}`,
      description: 'Step 5 Category'
    }
  })

  // 5. Create Course
  const course = await prisma.course.create({
    data: {
      title: 'Step 5 Course for Coding Exercises',
      slug: `step-5-course-${Date.now()}`,
      description: 'Test course for Step 5',
      authorId: teacher1.id,
      categoryId: category.id,
      price: new Prisma.Decimal(0)
    }
  })

  // 6. Create Chapter
  const chapter = await prisma.chapter.create({
    data: {
      title: 'Chapter 1: Coding Fundamentals',
      order: 1,
      courseId: course.id
    }
  })

  // 7. Create Lesson
  const lesson = await prisma.lesson.create({
    data: {
      title: 'Lesson 1: Sum to N',
      slug: `lesson-1-sum-to-n-${Date.now()}`,
      order: 1,
      courseId: course.id,
      chapterId: chapter.id,
      authorId: teacher1.id,
      isDemo: false
    }
  })

  // 8. Create Enrollment for Student
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
      status: EEnrollmentStatus.ACTIVE,
      progress: 0
    }
  })

  console.log('Test database environment initialized successfully.')

  // --------------------------------------------------------------------------
  // GROUP 2: TEACHER PUBLISH AUTHORIZATION & VALIDATION GATES
  // --------------------------------------------------------------------------
  console.log('\n--- GROUP 2: Teacher Publish Authorization & Validation Gates ---')

  // Create a valid exercise in DRAFT via createCodingExerciseService
  const createRes1 = await createCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    payload: {
      lessonId: lesson.id,
      title: 'Sum to N Function',
      slug: `sum-to-n-${Date.now()}`,
      description: 'Calculate sum from 1 to n',
      programmingLanguage: 'javascript',
      difficulty: 'EASY',
      starterCode: 'function sumToN(n) {\n  // your code\n}',
      referenceSolution: 'function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}',
      executionContract: {
        functionName: 'sumToN',
        parameters: [{ name: 'n', type: 'number' }],
        returnType: 'number'
      },
      timeLimit: 2000,
      memoryLimit: 128000,
      order: 1,
      testCases: [
        {
          input: [5],
          expectedOutput: 15,
          isHidden: false,
          order: 1,
          weight: 1
        },
        {
          input: [10],
          expectedOutput: 55,
          isHidden: true,
          order: 2,
          weight: 1
        }
      ]
    }
  })
  const draftExercise = createRes1.data!
  const rev1 = draftExercise.currentRevision!

  // Case 2.1: Invalid UUID
  const resInvalidId = await publishCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: 'not-a-valid-uuid'
  })
  assert(resInvalidId.statusCode === 400, 'Group 2', 'Invalid exercise UUID rejected with 400')

  // Case 2.2: Exercise not found
  const resNotFound = await publishCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: '11111111-2222-4333-8444-555555555555'
  })
  assert(resNotFound.statusCode === 404, 'Group 2', 'Non-existent exercise rejected with 404')

  // Case 2.3: Non-author teacher cannot publish
  const resNonAuthor = await publishCodingExerciseService({
    userId: teacher2.id,
    role: 'teacher',
    exerciseId: draftExercise.id
  })
  assert(resNonAuthor.statusCode === 403, 'Group 2', 'Non-author teacher publishing rejected with 403 Forbidden')

  // Create an exercise with 0 test cases to verify rejection of publishing with 0 tests
  const createResEmpty = await createCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    payload: {
      lessonId: lesson.id,
      title: 'Empty Tests Exercise',
      slug: `empty-tests-${Date.now()}`,
      description: 'Exercise with 0 test cases',
      programmingLanguage: 'javascript',
      difficulty: 'EASY',
      starterCode: 'function sumToN(n) {}',
      referenceSolution: 'function sumToN(n) {}',
      executionContract: {
        functionName: 'sumToN',
        parameters: [{ name: 'n', type: 'number' }],
        returnType: 'number'
      },
      timeLimit: 2000,
      memoryLimit: 128000,
      order: 2,
      testCases: [
        {
          input: [1],
          expectedOutput: 1,
          isHidden: false,
          order: 1,
          weight: 1
        }
      ]
    }
  })
  const emptyExercise = createResEmpty.data!
  // Delete all test cases for empty exercise
  await prisma.codingTestCase.deleteMany({
    where: { revisionId: emptyExercise.currentRevision!.id }
  })

  // Case 2.4: Exercise with 0 test cases
  const resNoTests = await publishCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: emptyExercise.id
  })
  assert(resNoTests.statusCode === 400, 'Group 2', 'Exercise with 0 test cases rejected with 400')

  // --------------------------------------------------------------------------
  // GROUP 3: AUTOMATED REFERENCE SOLUTION VERIFICATION GATE
  // --------------------------------------------------------------------------
  console.log('\n--- GROUP 3: Automated Reference Solution Verification Gate ---')

  // Create faulty exercise whose reference solution FAILS
  const createResFaulty = await createCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    payload: {
      lessonId: lesson.id,
      title: 'Faulty Sum to N Exercise',
      slug: `faulty-sum-to-n-${Date.now()}`,
      description: 'Calculate sum from 1 to n',
      programmingLanguage: 'javascript',
      difficulty: 'MEDIUM',
      starterCode: 'function sumToN(n) {}',
      referenceSolution: 'function sumToN(n) { return FAILING_REFERENCE_SOLUTION; }',
      executionContract: {
        functionName: 'sumToN',
        parameters: [{ name: 'n', type: 'number' }],
        returnType: 'number'
      },
      timeLimit: 2000,
      memoryLimit: 128000,
      order: 3,
      testCases: [
        {
          input: [5],
          expectedOutput: 15,
          isHidden: false,
          order: 1,
          weight: 1
        }
      ]
    }
  })
  const faultyExercise = createResFaulty.data!

  // Case 3.1: Faulty reference solution fails verification gate
  const resFaultyPublish = await publishCodingExerciseService(
    {
      userId: teacher1.id,
      role: 'teacher',
      exerciseId: faultyExercise.id
    },
    mockE2B
  )
  assert(resFaultyPublish.statusCode === 400, 'Group 3', 'Failing reference solution rejected with 400')
  assert(
    resFaultyPublish.message.includes('Reference solution failed automated verification'),
    'Group 3',
    'Error message clearly explains verification failure'
  )
  assert((resFaultyPublish.data as any)?.failures?.length > 0, 'Group 3', 'Verification report contains failed test cases')

  // Check database: status must STILL be DRAFT
  const faultyInDb = await findCodingExerciseById(faultyExercise.id)
  assert(faultyInDb?.status === ExerciseStatus.DRAFT, 'Group 3', 'Exercise status remains DRAFT on verification failure')

  // Case 3.2: Valid reference solution passes verification gate and publishes
  const resValidPublish = await publishCodingExerciseService(
    {
      userId: teacher1.id,
      role: 'teacher',
      exerciseId: draftExercise.id
    },
    mockE2B
  )
  assert(resValidPublish.statusCode === 200, 'Group 3', 'Valid exercise published successfully with 200')
  assert((resValidPublish.data as any)?.verification?.score === 100, 'Group 3', 'Verification score is 100%')

  // Check database after successful publish
  const publishedInDb = await findCodingExerciseById(draftExercise.id)
  assert(publishedInDb?.status === ExerciseStatus.PUBLISHED, 'Group 3', 'Exercise status transitioned to PUBLISHED')

  const publishedRevInDb = await findLatestPublishedRevision(draftExercise.id)
  assert(publishedRevInDb?.id === rev1.id, 'Group 3', 'Active published revision correctly set to rev1')
  assert(publishedRevInDb?.isPublished === true, 'Group 3', 'Revision marked isPublished: true')

  // --------------------------------------------------------------------------
  // GROUP 4: TEACHER UNPUBLISH WORKFLOWS
  // --------------------------------------------------------------------------
  console.log('\n--- GROUP 4: Teacher Unpublish Workflows ---')

  // Case 4.1: Non-author cannot unpublish
  const resUnpubNonAuthor = await unpublishCodingExerciseService({
    userId: teacher2.id,
    role: 'teacher',
    exerciseId: draftExercise.id
  })
  assert(resUnpubNonAuthor.statusCode === 403, 'Group 4', 'Non-author teacher cannot unpublish (403)')

  // Case 4.2: Author successfully unpublishes
  const resUnpublish = await unpublishCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: draftExercise.id
  })
  assert(resUnpublish.statusCode === 200, 'Group 4', 'Author successfully unpublishes exercise')

  const unpublishedInDb = await findCodingExerciseById(draftExercise.id)
  assert(unpublishedInDb?.status === ExerciseStatus.DRAFT, 'Group 4', 'Exercise reverted to DRAFT status')

  // Case 4.3: Idempotent unpublish
  const resIdempotentUnpublish = await unpublishCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: draftExercise.id
  })
  assert(resIdempotentUnpublish.statusCode === 200, 'Group 4', 'Re-unpublishing already DRAFT exercise is idempotent')

  // Re-publish exercise for student submission tests
  await publishCodingExerciseService(
    {
      userId: teacher1.id,
      role: 'teacher',
      exerciseId: draftExercise.id
    },
    mockE2B
  )

  // --------------------------------------------------------------------------
  // GROUP 5: STUDENT SUBMISSION GAMIFICATION & PROGRESS INTEGRATION
  // --------------------------------------------------------------------------
  console.log('\n--- GROUP 5: Student Submission Gamification & Progress Integration ---')

  // Initial user state
  const initialStudent = await prisma.user.findUnique({ where: { id: student.id } })
  assert(initialStudent?.currentStreak === 0, 'Group 5', 'Initial streak is 0')

  // Passing student submission
  const validStudentCode = 'function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}'
  const resSubmit1 = await submitCodeService(
    {
      userId: student.id,
      role: 'user',
      exerciseId: draftExercise.id,
      sourceCode: validStudentCode
    },
    mockE2B
  )

  assert(resSubmit1.statusCode === 200, 'Group 5', 'Submission graded successfully with 200')
  assert((resSubmit1.data as any)?.status === SubmissionStatus.ACCEPTED, 'Group 5', 'Status is ACCEPTED')
  assert((resSubmit1.data as any)?.score === 100, 'Group 5', 'Score is 100/100')

  // Verify Streak returned in response
  const streak1 = (resSubmit1.data as any)?.streak
  assert(streak1 !== undefined, 'Group 5', 'Streak info present in response')
  assert(streak1?.currentStreak === 1, 'Group 5', 'currentStreak incremented to 1')
  assert(streak1?.dailyXpAwarded === 20, 'Group 5', 'dailyXpAwarded is +20 XP on first activity of the day')
  assert(streak1?.isFirstActivityToday === true, 'Group 5', 'isFirstActivityToday is true')

  // Verify Course Progress returned in response (Step 6: decoupled, does NOT auto-complete lesson)
  const progress1 = (resSubmit1.data as any)?.progress
  assert(progress1 !== undefined, 'Group 5', 'Progress info present in response')
  assert(progress1?.lessonCompleted === false, 'Group 5', 'Step 6 policy: lessonCompleted remains false (decoupled from coding submission)')
  assert(progress1?.courseProgress === 0, 'Group 5', 'courseProgress remains 0% until lesson itself is completed')

  // Verify Database State: User Streak, Progress, and XP
  const studentAfterSubmit1 = await prisma.user.findUnique({ where: { id: student.id } })
  assert(studentAfterSubmit1?.currentStreak === 1, 'Group 5', 'Database user.currentStreak is 1')

  const progressRecord = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId: student.id,
        lessonId: lesson.id
      }
    }
  })
  assert(progressRecord === null || progressRecord.completed === false, 'Group 5', 'Step 6 policy: Database progress record NOT falsely marked complete')

  const enrollmentRecord = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id
      }
    }
  })
  assert(Number(enrollmentRecord?.progress) === 0, 'Group 5', 'Database enrollment progress remains 0%')
  assert(enrollmentRecord?.status === EEnrollmentStatus.ACTIVE, 'Group 5', 'Database enrollment status remains ACTIVE')

  // Verify XP Transactions: 1 daily streak (+20) + 1 coding exercise completion (+30 for EASY)
  const xpTxns = await prisma.xPTransaction.findMany({
    where: { userId: student.id },
    orderBy: { createdAt: 'asc' }
  })
  assert(xpTxns.length === 2, 'Group 5', 'Exactly 2 XP transactions recorded (+20 daily streak, +30 coding exercise completion)')
  const totalXp1 = xpTxns.reduce((sum, t) => sum + t.amount, 0)
  assert(totalXp1 === 50, 'Group 5', 'Total XP awarded is 50 XP (20 daily streak + 30 EASY coding exercise)')

  // --------------------------------------------------------------------------
  // GROUP 6: IDEMPOTENCY & REWARD DE-DUPLICATION VERIFICATION
  // --------------------------------------------------------------------------
  console.log('\n--- GROUP 6: Idempotency & Reward De-duplication Verification ---')

  // Submit passing code AGAIN on the same day
  const resSubmit2 = await submitCodeService(
    {
      userId: student.id,
      role: 'user',
      exerciseId: draftExercise.id,
      sourceCode: validStudentCode
    },
    mockE2B
  )

  assert(resSubmit2.statusCode === 200, 'Group 6', 'Second submission graded successfully with 200')
  assert((resSubmit2.data as any)?.status === SubmissionStatus.ACCEPTED, 'Group 6', 'Second submission status is ACCEPTED')

  // Verify NO duplicate daily XP
  const streak2 = (resSubmit2.data as any)?.streak
  assert(streak2?.dailyXpAwarded === 0, 'Group 6', 'No second daily XP awarded (dailyXpAwarded === 0)')
  assert(streak2?.isFirstActivityToday === false, 'Group 6', 'isFirstActivityToday is false')
  assert(streak2?.currentStreak === 1, 'Group 6', 'Streak remains 1 on same day (not doubled)')

  // Verify NO duplicate XP transactions created in DB
  const xpTxnsAfterSecond = await prisma.xPTransaction.findMany({
    where: { userId: student.id }
  })
  assert(xpTxnsAfterSecond.length === 2, 'Group 6', 'Zero new XP transactions created on re-submission (strictly idempotent)')

  // Submitting WRONG solution does NOT trigger rewards or progress
  const resWrongSubmit = await submitCodeService(
    {
      userId: student.id,
      role: 'user',
      exerciseId: draftExercise.id,
      sourceCode: 'function sumToN(n) { return WRONG_STUDENT_CODE; }'
    },
    mockE2B
  )

  assert((resWrongSubmit.data as any)?.status === SubmissionStatus.WRONG_ANSWER, 'Group 6', 'Wrong submission graded as WRONG_ANSWER')
  assert((resWrongSubmit.data as any)?.streak === undefined, 'Group 6', 'Wrong answer does not award streak')
  assert((resWrongSubmit.data as any)?.progress === undefined, 'Group 6', 'Wrong answer does not update progress')

  // --------------------------------------------------------------------------
  // GROUP 7: STALE PENDING SUBMISSION RECOVERY
  // --------------------------------------------------------------------------
  console.log('\n--- GROUP 7: Stale PENDING Submission Recovery ---')

  // Create a simulated stuck submission from 10 minutes ago
  const stuckSubmission = await createCodingSubmission({
    exerciseId: draftExercise.id,
    revisionId: rev1.id,
    userId: student.id,
    sourceCode: validStudentCode,
    language: 'javascript',
    status: SubmissionStatus.PENDING,
    score: 0,
    maxScore: 100,
    passedTests: 0,
    totalTests: 2
  })

  // Manually update createdAt to 10 minutes ago
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  await prisma.codingSubmission.update({
    where: { id: stuckSubmission.id },
    data: { createdAt: tenMinutesAgo }
  })

  // Case 7.1: Single recovery via getSubmissionDetailService
  const resDetailRecovery = await getSubmissionDetailService({
    userId: student.id,
    role: 'user',
    exerciseId: draftExercise.id,
    submissionId: stuckSubmission.id
  })

  assert(resDetailRecovery.statusCode === 200, 'Group 7', 'Submission detail fetched successfully')
  assert(
    (resDetailRecovery.data as any)?.status === SubmissionStatus.INTERNAL_ERROR,
    'Group 7',
    'Stale PENDING submission auto-recovered to INTERNAL_ERROR'
  )
  assert(
    (resDetailRecovery.data as any)?.errorMessage?.includes('timed out or worker restarted'),
    'Group 7',
    'Clear timeout error message applied to auto-recovered submission'
  )

  // Verify in DB
  const dbStuck = await findCodingSubmissionById(stuckSubmission.id)
  assert(dbStuck?.status === SubmissionStatus.INTERNAL_ERROR, 'Group 7', 'Database status updated to INTERNAL_ERROR')

  // Case 7.2: Batch recovery via recoverStalePendingSubmissionsService
  const stuck2 = await createCodingSubmission({
    exerciseId: draftExercise.id,
    revisionId: rev1.id,
    userId: student.id,
    sourceCode: validStudentCode,
    language: 'javascript',
    status: SubmissionStatus.PENDING,
    score: 0,
    maxScore: 100,
    passedTests: 0,
    totalTests: 2
  })
  await prisma.codingSubmission.update({
    where: { id: stuck2.id },
    data: { createdAt: tenMinutesAgo }
  })

  const batchRecoverRes = await recoverStalePendingSubmissionsService(5)
  assert(batchRecoverRes.statusCode === 200, 'Group 7', 'Batch recovery executed with 200 OK')
  assert((batchRecoverRes.data as any)?.recoveredCount >= 1, 'Group 7', 'At least 1 stale submission recovered')

  const dbStuck2 = await findCodingSubmissionById(stuck2.id)
  assert(dbStuck2?.status === SubmissionStatus.INTERNAL_ERROR, 'Group 7', 'Batch recovered submission is INTERNAL_ERROR')

  // --------------------------------------------------------------------------
  // GROUP 8: EXPRESS ROUTER ROUTE REGISTRATION AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- GROUP 8: Express Router Route Registration Audit ---')

  const registeredRoutes = codingExerciseRouter.stack
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route?.path,
      methods: Object.keys(layer.route?.methods || {})
    }))

  const hasPublishRoute = registeredRoutes.some(
    (r) => r.path === '/:id/publish' && r.methods.includes('post')
  )
  const hasUnpublishRoute = registeredRoutes.some(
    (r) => r.path === '/:id/unpublish' && r.methods.includes('post')
  )

  assert(hasPublishRoute, 'Group 8', 'POST /:id/publish is correctly registered in codingExerciseRouter')
  assert(hasUnpublishRoute, 'Group 8', 'POST /:id/unpublish is correctly registered in codingExerciseRouter')

  // Total routes check: 15 endpoints registered (7 CRUD + 4 Execution/Submission + 2 Publish/Unpublish + 2 Completion/Progress)
  assert(registeredRoutes.length === 15, 'Group 8', `Registered 15 endpoints in Coding Exercise router (found: ${registeredRoutes.length})`)

  // --------------------------------------------------------------------------
  // CLEANUP
  // --------------------------------------------------------------------------
  console.log('\n--- Cleaning Up Database Test Entities ---')
  const testExerciseIds = [draftExercise.id, emptyExercise.id, faultyExercise.id]
  await prisma.codingTestResult.deleteMany({
    where: { submission: { exerciseId: { in: testExerciseIds } } }
  })
  await prisma.codingSubmission.deleteMany({
    where: { exerciseId: { in: testExerciseIds } }
  })
  await prisma.codingTestCase.deleteMany({
    where: { revision: { exerciseId: { in: testExerciseIds } } }
  })
  await prisma.codingExerciseRevision.deleteMany({
    where: { exerciseId: { in: testExerciseIds } }
  })
  await prisma.codingExercise.deleteMany({
    where: { id: { in: testExerciseIds } }
  })
  await prisma.progress.deleteMany({
    where: { userId: student.id }
  })
  await prisma.xPTransaction.deleteMany({
    where: { userId: student.id }
  })
  await prisma.enrollment.deleteMany({
    where: { userId: student.id }
  })
  await prisma.lesson.deleteMany({
    where: { id: lesson.id }
  })
  await prisma.chapter.deleteMany({
    where: { id: chapter.id }
  })
  await prisma.course.deleteMany({
    where: { id: course.id }
  })
  await prisma.category.deleteMany({
    where: { id: category.id }
  })
  await prisma.user.deleteMany({
    where: { id: { in: [teacher1.id, teacher2.id, student.id] } }
  })
  console.log('Cleanup completed successfully.')

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================================')
  console.log(`STEP 5 VERIFICATION RESULTS: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`)
  console.log('====================================================================')

  if (failedChecks > 0) {
    process.exit(1)
  }
}

runStep5TestSuite()
  .catch((err) => {
    console.error('Unhandled test suite error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
