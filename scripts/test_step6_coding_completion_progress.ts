import dotenv from 'dotenv'
dotenv.config()

import {
  EEnrollmentStatus,
  ExerciseDifficulty,
  ExerciseStatus,
  Prisma,
  SubmissionStatus,
  TestCaseStatus,
  UserRole,
  XPTransactionType
} from '@prisma/client'
import { prisma } from '~/config/prisma'
import {
  findCompletionByUserAndExercise,
  findCompletionsByUserAndLesson
} from '~/repositories/codingCompletion.repository'
import {
  findCodingExerciseById,
  findLatestPublishedRevision,
  findLatestRevision
} from '~/repositories/codingExercise.repository'
import {
  findCodingSubmissionById
} from '~/repositories/codingSubmission.repository'
import {
  createCodingExerciseService,
  publishCodingExerciseService,
  unpublishCodingExerciseService,
  updateCodingExerciseService,
  archiveCodingExerciseService
} from '~/services/codingExercise.service'
import {
  getExerciseCompletionService,
  getLessonCodingProgressService
} from '~/services/codingCompletion.service'
import {
  runCodeService,
  submitCodeService
} from '~/services/codingSubmission.service'
import { markLessonCompleteService } from '~/services/progress.service'
import {
  E2BExecutionResponse,
  IE2BClient
} from '~/integrations/e2b/e2b.client'
import codingExerciseRouter from '~/routes/codingExercise.route'

/**
 * TMDEMY — STEP 6 AUTOMATED VERIFICATION SUITE
 *
 * Verifies:
 * Group 1: Completion Tracking (First vs Repeated ACCEPTED, WRONG_ANSWER, RUN, Isolation)
 * Group 2: Dedicated XP Rewards (EASY +30, MEDIUM +50, HARD +80, Idempotency, Concurrency)
 * Group 3: Streak Integration (+20 daily streak XP, idempotent calendar day)
 * Group 4: Progress Decoupling & Lesson Coding Progress (No auto-completion, manual completion works)
 * Group 5: Authorization & Security (Enrollment checks, student isolation, teacher inspection)
 * Group 6: Revision & History (New revision preserves completion, unpublish/archive safety)
 * Group 7: Express Router Route Registration Audit (15 total endpoints)
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
// MOCK E2B CLIENT FOR FAST, DETERMINISTIC EXECUTION
// ============================================================================

class MockE2BClient implements IE2BClient {
  async checkHealth(): Promise<{ ok: boolean; version?: string; message?: string }> {
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
    return items.map((item) => {
      // Check for wrong answer
      if (item.harnessSource.includes('WRONG_ANSWER')) {
        const payload = JSON.stringify({
          success: true,
          hasReturned: true,
          returnValue: -999, // mismatch
          userStdout: 'Wrong answer\n'
        })
        const stdout = `__TM_GRADING_RESULT_START__${item.nonce}__\n${payload}\n__TM_GRADING_RESULT_END__${item.nonce}__\n`
        return {
          stdout,
          stderr: '',
          exitCode: 0,
          timedOut: false,
          executionTimeMs: 15
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

      let returnValue = (n * (n + 1)) / 2
      if (item.harnessSource.includes('fibonacci')) {
        returnValue = 55
      } else if (item.harnessSource.includes('graphSearch')) {
        returnValue = 15
      }

      const payload = JSON.stringify({
        success: true,
        hasReturned: true,
        returnValue,
        userStdout: `Result: ${returnValue}\n`
      })

      const stdout = `__TM_GRADING_RESULT_START__${item.nonce}__\n${payload}\n__TM_GRADING_RESULT_END__${item.nonce}__\n`
      return {
        stdout,
        stderr: '',
        exitCode: 0,
        timedOut: false,
        executionTimeMs: 25
      }
    })
  }
}

async function runStep6Tests() {
  console.log('=================================================================')
  console.log('STARTING TMDEMY STEP 6 AUTOMATED VERIFICATION SUITE')
  console.log('=================================================================')

  const mockE2B = new MockE2BClient()

  // --------------------------------------------------------------------------
  // TEST DATA SETUP
  // --------------------------------------------------------------------------
  console.log('\n--- Setting Up Database Test Entities ---')

  const timestamp = Date.now()

  // 1. Teachers
  const teacher1 = await prisma.user.create({
    data: {
      username: `s6_t1_${timestamp}`,
      email: `s6_t1_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  const teacher2 = await prisma.user.create({
    data: {
      username: `s6_t2_${timestamp}`,
      email: `s6_t2_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  // 2. Students
  const student1 = await prisma.user.create({
    data: {
      username: `s6_s1_${timestamp}`,
      email: `s6_s1_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER,
      currentStreak: 0,
      longestStreak: 0,
      xpTotal: 0
    }
  })

  const student2 = await prisma.user.create({
    data: {
      username: `s6_s2_${timestamp}`,
      email: `s6_s2_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER,
      currentStreak: 0,
      longestStreak: 0,
      xpTotal: 0
    }
  })

  const student3 = await prisma.user.create({
    data: {
      username: `s6_s3_${timestamp}`,
      email: `s6_s3_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER,
      currentStreak: 0,
      longestStreak: 0,
      xpTotal: 0
    }
  })

  // 3. Category & Course
  const category = await prisma.category.create({
    data: {
      name: `Step 6 Category ${timestamp}`,
      slug: `step-6-cat-${timestamp}`,
      description: 'Step 6 Category'
    }
  })

  const course = await prisma.course.create({
    data: {
      title: 'Step 6 Course: Algorithms',
      slug: `step-6-course-${timestamp}`,
      description: 'Test course for Step 6',
      authorId: teacher1.id,
      categoryId: category.id,
      price: new Prisma.Decimal(0)
    }
  })

  const chapter = await prisma.chapter.create({
    data: {
      title: 'Chapter 1: Algorithms',
      order: 1,
      courseId: course.id
    }
  })

  const lesson = await prisma.lesson.create({
    data: {
      title: 'Lesson 1: Classic Problems',
      slug: `lesson-1-classic-${timestamp}`,
      order: 1,
      courseId: course.id,
      chapterId: chapter.id,
      authorId: teacher1.id,
      isDemo: false
    }
  })

  // Enroll Student1 and Student2 (Student3 is NOT enrolled)
  await prisma.enrollment.create({
    data: {
      userId: student1.id,
      courseId: course.id,
      status: EEnrollmentStatus.ACTIVE,
      progress: 0
    }
  })

  await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: course.id,
      status: EEnrollmentStatus.ACTIVE,
      progress: 0
    }
  })

  // 4. Create 3 Exercises in this Lesson with EASY, MEDIUM, HARD
  // Exercise 1: EASY (Sum to N)
  const resEx1 = await createCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    payload: {
      lessonId: lesson.id,
      title: 'Exercise 1: Sum to N',
      slug: `ex1-sum-${timestamp}`,
      description: 'Calculate sum from 1 to n',
      programmingLanguage: 'javascript',
      difficulty: 'EASY',
      starterCode: 'function sumToN(n) {}',
      referenceSolution: 'function sumToN(n) { return (n * (n + 1)) / 2; }',
      executionContract: {
        functionName: 'sumToN',
        parameters: [{ name: 'n', type: 'number' }],
        returnType: 'number'
      },
      order: 1,
      testCases: [
        { input: [5], expectedOutput: 15, isHidden: false, order: 1, weight: 1 },
        { input: [10], expectedOutput: 55, isHidden: true, order: 2, weight: 1 }
      ]
    }
  })
  const exercise1 = resEx1.data!

  // Exercise 2: MEDIUM (Fibonacci)
  const resEx2 = await createCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    payload: {
      lessonId: lesson.id,
      title: 'Exercise 2: Fibonacci',
      slug: `ex2-fib-${timestamp}`,
      description: 'Calculate nth Fibonacci number',
      programmingLanguage: 'javascript',
      difficulty: 'MEDIUM',
      starterCode: 'function fibonacci(n) {}',
      referenceSolution: 'function fibonacci(n) { return 55; }',
      executionContract: {
        functionName: 'fibonacci',
        parameters: [{ name: 'n', type: 'number' }],
        returnType: 'number'
      },
      order: 2,
      testCases: [
        { input: [10], expectedOutput: 55, isHidden: false, order: 1, weight: 1 }
      ]
    }
  })
  const exercise2 = resEx2.data!

  // Exercise 3: HARD (Graph Search)
  const resEx3 = await createCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    payload: {
      lessonId: lesson.id,
      title: 'Exercise 3: Graph Search',
      slug: `ex3-graph-${timestamp}`,
      description: 'Perform advanced graph traversal',
      programmingLanguage: 'javascript',
      difficulty: 'HARD',
      starterCode: 'function graphSearch(nodes) {}',
      referenceSolution: 'function graphSearch(nodes) { return 15; }',
      executionContract: {
        functionName: 'graphSearch',
        parameters: [{ name: 'nodes', type: 'number' }],
        returnType: 'number'
      },
      order: 3,
      testCases: [
        { input: [5], expectedOutput: 15, isHidden: false, order: 1, weight: 1 }
      ]
    }
  })
  const exercise3 = resEx3.data!

  // Publish all 3 exercises
  await publishCodingExerciseService({ userId: teacher1.id, role: 'teacher', exerciseId: exercise1.id }, mockE2B)
  await publishCodingExerciseService({ userId: teacher1.id, role: 'teacher', exerciseId: exercise2.id }, mockE2B)
  await publishCodingExerciseService({ userId: teacher1.id, role: 'teacher', exerciseId: exercise3.id }, mockE2B)

  console.log('Database test setup complete.')

  // ==========================================================================
  // GROUP 1: COMPLETION TRACKING
  // ==========================================================================
  console.log('\n--- GROUP 1: Completion Tracking ---')

  // Case 1.1: RUN does not create completion record
  const resRun = await runCodeService(
    {
      userId: student1.id,
      role: 'user',
      exerciseId: exercise1.id,
      sourceCode: 'function sumToN(n) { return (n * (n + 1)) / 2; }'
    },
    mockE2B
  )
  assert(resRun.statusCode === 200, 'Group 1', 'RUN execution succeeded')
  const completionAfterRun = await findCompletionByUserAndExercise(student1.id, exercise1.id)
  assert(completionAfterRun === null, 'Group 1', 'RUN never creates a completion record')

  // Case 1.2: WRONG_ANSWER does not create completion record
  const resWrongSubmit = await submitCodeService(
    {
      userId: student1.id,
      role: 'user',
      exerciseId: exercise1.id,
      sourceCode: 'function sumToN(n) { return WRONG_ANSWER; }'
    },
    mockE2B
  )
  assert((resWrongSubmit.data as any)?.status === SubmissionStatus.WRONG_ANSWER, 'Group 1', 'WRONG_ANSWER submission graded')
  assert((resWrongSubmit.data as any)?.completion?.exerciseCompleted === false, 'Group 1', 'Response indicates exerciseCompleted: false')
  const completionAfterWrong = await findCompletionByUserAndExercise(student1.id, exercise1.id)
  assert(completionAfterWrong === null, 'Group 1', 'WRONG_ANSWER does not complete the exercise')

  // Case 1.3: First ACCEPTED submission records completion
  const resAcceptedSubmit1 = await submitCodeService(
    {
      userId: student1.id,
      role: 'user',
      exerciseId: exercise1.id,
      sourceCode: 'function sumToN(n) { return (n * (n + 1)) / 2; }'
    },
    mockE2B
  )
  assert(resAcceptedSubmit1.statusCode === 200, 'Group 1', 'First submission accepted with 200')
  assert((resAcceptedSubmit1.data as any)?.status === SubmissionStatus.ACCEPTED, 'Group 1', 'Status is ACCEPTED')
  assert((resAcceptedSubmit1.data as any)?.completion?.exerciseCompleted === true, 'Group 1', 'Response completion.exerciseCompleted is true')
  assert((resAcceptedSubmit1.data as any)?.completion?.firstCompletion === true, 'Group 1', 'Response completion.firstCompletion is true')

  // Verify physical completion row in database
  const completionDb1 = await findCompletionByUserAndExercise(student1.id, exercise1.id)
  assert(completionDb1 !== null, 'Group 1', 'Physical CodingExerciseCompletion record created')
  assert(completionDb1?.userId === student1.id, 'Group 1', 'Completion associated with correct userId')
  assert(completionDb1?.exerciseId === exercise1.id, 'Group 1', 'Completion associated with correct exerciseId')
  assert(completionDb1?.firstAcceptedSubmissionId === (resAcceptedSubmit1.data as any)?.id, 'Group 1', 'firstAcceptedSubmissionId matches submission ID')
  assert(completionDb1?.bestScore === 100, 'Group 1', 'bestScore is recorded as 100')
  assert(completionDb1?.totalAttempts === 1, 'Group 1', 'totalAttempts is initialized to 1')

  // Case 1.4: Repeated ACCEPTED submission preserves first completion
  const firstCompletedAt = completionDb1!.completedAt
  const firstSubmissionId = completionDb1!.firstAcceptedSubmissionId

  const resRepeatedSubmit = await submitCodeService(
    {
      userId: student1.id,
      role: 'user',
      exerciseId: exercise1.id,
      sourceCode: 'function sumToN(n) { return (n * (n + 1)) / 2; }'
    },
    mockE2B
  )
  assert(resRepeatedSubmit.statusCode === 200, 'Group 1', 'Repeated submission accepted with 200')
  assert((resRepeatedSubmit.data as any)?.completion?.exerciseCompleted === true, 'Group 1', 'Repeated completion.exerciseCompleted is true')
  assert((resRepeatedSubmit.data as any)?.completion?.firstCompletion === false, 'Group 1', 'Repeated completion.firstCompletion is false')

  const completionDbRepeated = await findCompletionByUserAndExercise(student1.id, exercise1.id)
  assert(
    completionDbRepeated?.firstAcceptedSubmissionId === firstSubmissionId,
    'Group 1',
    'firstAcceptedSubmissionId is preserved on repeated completion'
  )
  assert(
    completionDbRepeated?.completedAt.getTime() === firstCompletedAt.getTime(),
    'Group 1',
    'completedAt timestamp is preserved on repeated completion'
  )
  assert(completionDbRepeated?.totalAttempts === 2, 'Group 1', 'totalAttempts incremented to 2')

  // Case 1.5: Different students have independent completion records
  const student2Before = await findCompletionByUserAndExercise(student2.id, exercise1.id)
  assert(student2Before === null, 'Group 1', 'Student2 has no completion prior to submitting')

  const resStudent2Submit = await submitCodeService(
    {
      userId: student2.id,
      role: 'user',
      exerciseId: exercise1.id,
      sourceCode: 'function sumToN(n) { return (n * (n + 1)) / 2; }'
    },
    mockE2B
  )
  assert((resStudent2Submit.data as any)?.completion?.firstCompletion === true, 'Group 1', 'Student2 gets firstCompletion: true')

  const student2After = await findCompletionByUserAndExercise(student2.id, exercise1.id)
  assert(student2After !== null, 'Group 1', 'Student2 gets independent completion record')
  assert(student2After?.id !== completionDb1?.id, 'Group 1', 'Student1 and Student2 have distinct completion row IDs')

  // ==========================================================================
  // GROUP 2: DEDICATED XP REWARDS
  // ==========================================================================
  console.log('\n--- GROUP 2: Dedicated XP Rewards ---')

  // Case 2.1: EASY grants +30 XP
  // Verified from Exercise 1 above
  assert((resAcceptedSubmit1.data as any)?.rewards?.codingXpAwarded === 30, 'Group 2', 'EASY exercise grants exactly 30 coding XP')

  const xpTxEASY = await prisma.xPTransaction.findUnique({
    where: { eventKey: `coding-exercise-complete:${student1.id}:${exercise1.id}` }
  })
  assert(xpTxEASY !== null, 'Group 2', 'XPTransaction created with deterministic eventKey')
  assert(xpTxEASY?.amount === 30, 'Group 2', 'XPTransaction amount is 30')
  assert(xpTxEASY?.type === XPTransactionType.CODING_EXERCISE_COMPLETED, 'Group 2', 'XPTransaction type is CODING_EXERCISE_COMPLETED')

  // Case 2.2: Second accepted submission grants ZERO coding XP
  assert((resRepeatedSubmit.data as any)?.rewards?.codingXpAwarded === 0, 'Group 2', 'Repeated accepted submission grants 0 coding XP')

  // Case 2.3: MEDIUM grants +50 XP
  const resEx2Submit = await submitCodeService(
    {
      userId: student1.id,
      role: 'user',
      exerciseId: exercise2.id,
      sourceCode: 'function fibonacci(n) { return 55; }'
    },
    mockE2B
  )
  assert((resEx2Submit.data as any)?.rewards?.codingXpAwarded === 50, 'Group 2', 'MEDIUM exercise grants exactly 50 coding XP')

  const xpTxMEDIUM = await prisma.xPTransaction.findUnique({
    where: { eventKey: `coding-exercise-complete:${student1.id}:${exercise2.id}` }
  })
  assert(xpTxMEDIUM?.amount === 50, 'Group 2', 'MEDIUM XPTransaction amount is 50')

  // Case 2.4: HARD grants +80 XP
  const resEx3Submit = await submitCodeService(
    {
      userId: student1.id,
      role: 'user',
      exerciseId: exercise3.id,
      sourceCode: 'function graphSearch(nodes) { return 15; }'
    },
    mockE2B
  )
  assert((resEx3Submit.data as any)?.rewards?.codingXpAwarded === 80, 'Group 2', 'HARD exercise grants exactly 80 coding XP')

  const xpTxHARD = await prisma.xPTransaction.findUnique({
    where: { eventKey: `coding-exercise-complete:${student1.id}:${exercise3.id}` }
  })
  assert(xpTxHARD?.amount === 80, 'Group 2', 'HARD XPTransaction amount is 80')

  // Case 2.5: User total XP consistency
  const student1InDb = await prisma.user.findUnique({ where: { id: student1.id } })
  const allStudent1XpTxns = await prisma.xPTransaction.findMany({ where: { userId: student1.id } })
  const expectedTotal = allStudent1XpTxns.reduce((sum, t) => sum + t.amount, 0)
  assert(student1InDb?.xpTotal === expectedTotal, 'Group 2', `User.xpTotal (${student1InDb?.xpTotal}) equals sum of transactions (${expectedTotal})`)

  // Case 2.6: Concurrent submission race safety (Idempotency under concurrency)
  // Student2 submits Exercise 2 concurrently twice
  const [conc1, conc2] = await Promise.all([
    submitCodeService(
      { userId: student2.id, role: 'user', exerciseId: exercise2.id, sourceCode: 'function fibonacci(n) { return 55; }' },
      mockE2B
    ),
    submitCodeService(
      { userId: student2.id, role: 'user', exerciseId: exercise2.id, sourceCode: 'function fibonacci(n) { return 55; }' },
      mockE2B
    )
  ])

  const concXpTxns = await prisma.xPTransaction.findMany({
    where: {
      userId: student2.id,
      eventKey: `coding-exercise-complete:${student2.id}:${exercise2.id}`
    }
  })
  assert(concXpTxns.length === 1, 'Group 2', 'Concurrent submissions produced exactly 1 XPTransaction (no duplicate XP)')
  const totalAwarded = (conc1.data as any)?.rewards?.codingXpAwarded + (conc2.data as any)?.rewards?.codingXpAwarded
  assert(totalAwarded === 50, 'Group 2', 'Exactly 50 XP was awarded across concurrent submissions')

  // ==========================================================================
  // GROUP 3: STREAK INTEGRATION
  // ==========================================================================
  console.log('\n--- GROUP 3: Streak Integration ---')

  // First submission today for student1 earned daily streak (+20 XP)
  assert((resAcceptedSubmit1.data as any)?.rewards?.dailyStreakXpAwarded === 20, 'Group 3', 'First activity today awarded 20 daily streak XP')
  assert((resAcceptedSubmit1.data as any)?.streak?.currentStreak === 1, 'Group 3', 'Streak is 1')

  // Subsequent submissions on same day earned 0 daily streak XP
  assert((resRepeatedSubmit.data as any)?.rewards?.dailyStreakXpAwarded === 0, 'Group 3', 'Subsequent activity today awarded 0 streak XP')
  assert((resEx2Submit.data as any)?.rewards?.dailyStreakXpAwarded === 0, 'Group 3', 'Third activity today awarded 0 streak XP')

  const student1Streak = await prisma.user.findUnique({ where: { id: student1.id } })
  assert(student1Streak?.currentStreak === 1, 'Group 3', 'Student currentStreak remains 1 (did not double)')

  // Check daily streak XPTransaction eventKey format: daily-streak:{userId}:{YYYY-MM-DD}
  const streakTxns = await prisma.xPTransaction.findMany({
    where: { userId: student1.id, type: XPTransactionType.DAILY_STREAK }
  })
  assert(streakTxns.length === 1, 'Group 3', 'Exactly 1 daily streak transaction created for student today')
  assert(streakTxns[0].eventKey.startsWith(`daily-streak:${student1.id}:`), 'Group 3', 'Streak eventKey format conforms to standard')

  // ==========================================================================
  // GROUP 4: PROGRESS DECOUPLING & LESSON PROGRESS
  // ==========================================================================
  console.log('\n--- GROUP 4: Progress Decoupling & Lesson Progress ---')

  // Case 4.1: CRITICAL RULE: Coding submission does NOT mark entire lesson completed
  const progressRecord = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId: student1.id,
        lessonId: lesson.id
      }
    }
  })
  assert(progressRecord === null || progressRecord.completed === false, 'Group 4', 'CRITICAL: Lesson is NOT marked complete after coding submissions!')

  const enrollmentRecord = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student1.id,
        courseId: course.id
      }
    }
  })
  assert(Number(enrollmentRecord?.progress) === 0, 'Group 4', 'Enrollment progress is NOT falsely incremented to 100%')
  assert(enrollmentRecord?.status === EEnrollmentStatus.ACTIVE, 'Group 4', 'Enrollment status remains ACTIVE')

  // Case 4.2: Get Exercise Completion Status API
  const resCompletionApi = await getExerciseCompletionService({
    userId: student1.id,
    role: 'user',
    exerciseId: exercise1.id
  })
  assert(resCompletionApi.statusCode === 200, 'Group 4', 'GET completion status returns 200')
  const completionData = (resCompletionApi.data as any)
  assert(completionData.completed === true, 'Group 4', 'API reports completed: true')
  assert(completionData.bestScore === 100, 'Group 4', 'API reports bestScore: 100')
  assert(completionData.codingXpEarned === 30, 'Group 4', 'API reports codingXpEarned: 30')
  assert(completionData.totalAttempts === 2, 'Group 4', 'API reports totalAttempts: 2')

  // Case 4.3: Lesson Coding Progress API for Student1 (3 of 3 completed)
  const resLessonProgress1 = await getLessonCodingProgressService({
    userId: student1.id,
    role: 'user',
    lessonId: lesson.id
  })
  assert(resLessonProgress1.statusCode === 200, 'Group 4', 'GET lesson coding progress returns 200')
  const progData1 = (resLessonProgress1.data as any)
  assert(progData1.totalExercises === 3, 'Group 4', 'Lesson has 3 total exercises')
  assert(progData1.completedExercises === 3, 'Group 4', 'Student1 completed 3 of 3 exercises')
  assert(progData1.completionPercentage === 100, 'Group 4', 'completionPercentage is 100%')
  assert(progData1.exercises.length === 3, 'Group 4', 'Detailed exercises array contains 3 items')

  // Case 4.4: Lesson Coding Progress API for Student2 (2 of 3 completed: Ex1 and Ex2)
  const resLessonProgress2 = await getLessonCodingProgressService({
    userId: student2.id,
    role: 'user',
    lessonId: lesson.id
  })
  const progData2 = (resLessonProgress2.data as any)
  assert(progData2.totalExercises === 3, 'Group 4', 'Lesson has 3 total exercises for Student2')
  assert(progData2.completedExercises === 2, 'Group 4', 'Student2 completed 2 of 3 exercises')
  assert(progData2.completionPercentage === 67, 'Group 4', 'completionPercentage is 67% (2/3)')

  // Case 4.5: Existing manual lesson completion remains fully functional
  const resManualComplete = await markLessonCompleteService({
    userId: student1.id,
    courseId: course.id,
    lessonId: lesson.id
  })
  assert(resManualComplete.success === true, 'Group 4', 'Manual markLessonCompleteService succeeds')

  const progressAfterManual = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId: student1.id,
        lessonId: lesson.id
      }
    }
  })
  assert(progressAfterManual?.completed === true, 'Group 4', 'Progress record marked completed after manual completion')

  const enrollmentAfterManual = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student1.id,
        courseId: course.id
      }
    }
  })
  assert(Number(enrollmentAfterManual?.progress) === 100, 'Group 4', 'Enrollment progress is now 100% after legitimate lesson completion')
  assert(enrollmentAfterManual?.status === EEnrollmentStatus.COMPLETED, 'Group 4', 'Enrollment status updated to COMPLETED')

  // ==========================================================================
  // GROUP 5: AUTHORIZATION & SECURITY
  // ==========================================================================
  console.log('\n--- GROUP 5: Authorization & Security ---')

  // Case 5.1: Student3 (not enrolled) blocked from viewing lesson progress
  const resProgUnenrolled = await getLessonCodingProgressService({
    userId: student3.id,
    role: 'user',
    lessonId: lesson.id
  })
  assert(resProgUnenrolled.statusCode === 403, 'Group 5', 'Unenrolled student blocked from lesson progress (403)')

  // Case 5.2: Student3 (not enrolled) blocked from viewing exercise completion
  const resCompUnenrolled = await getExerciseCompletionService({
    userId: student3.id,
    role: 'user',
    exerciseId: exercise1.id
  })
  assert(resCompUnenrolled.statusCode === 403, 'Group 5', 'Unenrolled student blocked from exercise completion (403)')

  // Case 5.3: Student cannot inspect another student's completion
  const resSpyCompletion = await getExerciseCompletionService({
    userId: student1.id,
    role: 'user',
    exerciseId: exercise1.id,
    targetUserId: student2.id
  })
  assert(resSpyCompletion.statusCode === 403, 'Group 5', 'Student cannot spy on another student\'s completion (403)')

  // Case 5.4: Teacher (author) CAN inspect student completion
  const resTeacherInspect = await getExerciseCompletionService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: exercise1.id,
    targetUserId: student1.id
  })
  assert(resTeacherInspect.statusCode === 200, 'Group 5', 'Teacher can inspect enrolled student completion (200)')
  assert((resTeacherInspect.data as any)?.userId === student1.id, 'Group 5', 'Inspected data belongs to student1')

  // Case 5.5: Anti-cheat verification: Hidden test outputs redacted in submission response
  assert(resAcceptedSubmit1.data!.results[1].isHidden === true, 'Group 5', 'Hidden test marked isHidden: true')
  assert((resAcceptedSubmit1.data!.results[1] as any).input === undefined, 'Group 5', 'Hidden test input is strictly redacted')
  assert((resAcceptedSubmit1.data!.results[1] as any).expectedOutput === undefined, 'Group 5', 'Hidden test expectedOutput is strictly redacted')

  // ==========================================================================
  // GROUP 6: REVISION & HISTORY
  // ==========================================================================
  console.log('\n--- GROUP 6: Revision & History ---')

  // Case 6.1: New revision preserves historical completion
  const updateRes = await updateCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: exercise1.id,
    payload: {
      title: 'Exercise 1: Sum to N (Revised)',
      description: 'Updated problem description',
      referenceSolution: 'function sumToN(n) { return (n * (n + 1)) / 2; }'
    }
  })
  assert(updateRes.statusCode === 200, 'Group 6', 'Exercise updated with new revision')

  // Historical completion MUST still be completed for student1
  const compAfterRev = await findCompletionByUserAndExercise(student1.id, exercise1.id)
  assert(compAfterRev !== null, 'Group 6', 'Completion record preserved across revisions')
  assert(compAfterRev?.completedAt.getTime() === firstCompletedAt.getTime(), 'Group 6', 'Original completedAt preserved')
  assert(compAfterRev?.xpAwarded === 30, 'Group 6', 'Original XP awarded preserved')

  // Case 6.2: Unpublishing exercise does not erase earned XP or completion
  const unpubRes = await unpublishCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: exercise3.id
  })
  assert(unpubRes.statusCode === 200, 'Group 6', 'Exercise 3 unpublished back to DRAFT')

  const compAfterUnpub = await findCompletionByUserAndExercise(student1.id, exercise3.id)
  assert(compAfterUnpub !== null, 'Group 6', 'Completion record preserved after unpublish')

  const xpAfterUnpub = await prisma.xPTransaction.findUnique({
    where: { eventKey: `coding-exercise-complete:${student1.id}:${exercise3.id}` }
  })
  assert(xpAfterUnpub !== null, 'Group 6', 'XP transaction preserved after unpublish')

  // Case 6.3: Lesson coding progress excludes unpublished exercise from denominator
  const resProgressAfterUnpub = await getLessonCodingProgressService({
    userId: student1.id,
    role: 'user',
    lessonId: lesson.id
  })
  const progAfterUnpubData = (resProgressAfterUnpub.data as any)
  assert(progAfterUnpubData.totalExercises === 2, 'Group 6', 'Unpublished exercise excluded from active denominator (now 2)')
  assert(progAfterUnpubData.completedExercises === 2, 'Group 6', 'Completed exercises among published is 2/2')
  assert(progAfterUnpubData.completionPercentage === 100, 'Group 6', 'Progress is 100% of currently published syllabus')

  // Case 6.4: Archiving exercise preserves historical submissions
  const archiveRes = await archiveCodingExerciseService({
    userId: teacher1.id,
    role: 'teacher',
    exerciseId: exercise3.id
  })
  assert(archiveRes.statusCode === 200, 'Group 6', 'Exercise 3 archived')

  const subDb = await findCodingSubmissionById((resEx3Submit.data as any)?.id)
  assert(subDb !== null, 'Group 6', 'Historical submission for archived exercise preserved in database')

  // ==========================================================================
  // GROUP 7: EXPRESS ROUTER ROUTE REGISTRATION AUDIT
  // ==========================================================================
  console.log('\n--- GROUP 7: Express Router Route Registration Audit ---')

  const routes: Array<{ path: string; method: string }> = []
  codingExerciseRouter.stack.forEach((middleware) => {
    if (middleware.route) {
      const path = middleware.route.path
      const methods = Object.keys(middleware.route.methods)
      methods.forEach((method) => {
        routes.push({ path, method: method.toUpperCase() })
      })
    }
  })

  console.log(`Registered Coding Exercise Routes (${routes.length}):`)
  routes.forEach((r) => console.log(`  ${r.method.padEnd(6)} /api/coding-exercises${r.path}`))

  assert(routes.length === 15, 'Group 7', `Exactly 15 endpoints registered (found ${routes.length})`)

  const hasCompletionRoute = routes.some((r) => r.path === '/:id/completion' && r.method === 'GET')
  assert(hasCompletionRoute, 'Group 7', 'GET /:id/completion is properly registered')

  const hasProgressRoute = routes.some((r) => r.path === '/lesson/:lessonId/progress' && r.method === 'GET')
  assert(hasProgressRoute, 'Group 7', 'GET /lesson/:lessonId/progress is properly registered')

  // --------------------------------------------------------------------------
  // TEST CLEANUP
  // --------------------------------------------------------------------------
  console.log('\n--- Cleaning Up Database Test Fixtures ---')
  try {
    // Delete entities in foreign key dependency order
    await prisma.codingTestResult.deleteMany({ where: { submission: { exercise: { courseId: course.id } } } })
    await prisma.codingExerciseCompletion.deleteMany({ where: { exercise: { courseId: course.id } } })
    await prisma.codingSubmission.deleteMany({ where: { exercise: { courseId: course.id } } })
    await prisma.codingExercise.deleteMany({ where: { courseId: course.id } })
    await prisma.course.deleteMany({ where: { id: course.id } })
    await prisma.category.deleteMany({ where: { id: category.id } })
    await prisma.user.deleteMany({
      where: {
        id: { in: [teacher1.id, teacher2.id, student1.id, student2.id, student3.id] }
      }
    })
    console.log('Cleanup finished cleanly.')
  } catch (err: any) {
    console.warn('Cleanup warning (non-fatal):', err.message)
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n=================================================================')
  console.log(`STEP 6 VERIFICATION SUMMARY: ${passedChecks}/${totalChecks} PASSED, ${failedChecks} FAILED`)
  console.log('=================================================================')

  if (failedChecks > 0) {
    process.exit(1)
  }
}

runStep6Tests().catch((err) => {
  console.error('Fatal unhandled error in Step 6 test suite:', err)
  process.exit(1)
})
