import {
  ExerciseStatus,
  Prisma,
  SubmissionStatus,
  TestCaseStatus
} from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  findCodingExerciseById,
  findLatestPublishedRevision,
  findTestCasesByRevisionId
} from '~/repositories/codingExercise.repository'
import {
  countCodingSubmissionsByUserAndExercise,
  createCodingSubmission,
  createManyCodingTestResults,
  findCodingSubmissionById,
  findCodingSubmissionsByUserAndExercise,
  updateCodingSubmission,
  updateManyStaleSubmissions
} from '~/repositories/codingSubmission.repository'
import { findCourseById } from '~/repositories/course.repository'
import { findEnrollmentByUserAndCourse } from '~/repositories/enrollment.repository'
import { findLessonById } from '~/repositories/lesson.repository'
import { defaultE2BClient, IE2BClient } from '~/integrations/e2b/e2b.client'
import {
  CodeExecutionResult,
  ExecutionContract,
  TestCaseExecutionResult
} from '~/models/codeExecution.model'
import { executeTestSuite } from '~/services/codeExecution.service'
import {
  findCompletionByUserAndExercise,
  createCodingExerciseCompletion
} from '~/repositories/codingCompletion.repository'
import { findProgress } from '~/repositories/progress.repository'
import { awardCodingExerciseCompletionXP } from '~/services/xp.service'
import { recordLearningActivityStreak } from '~/services/streak.service'
import { UserRole } from '~/types/enum'
import { ServiceResponse } from '~/types/type'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — CODING SUBMISSION SERVICE (STEP 4)
 * 
 * Implements business workflows for:
 * 1. Student Run (`POST /api/coding-exercises/:id/run`)
 * 2. Student Submit (`POST /api/coding-exercises/:id/submit`)
 * 3. Submission History (`GET /api/coding-exercises/:id/submissions`)
 * 4. Submission Detail (`GET /api/coding-exercises/:id/submissions/:submissionId`)
 * 
 * Strict Architectural Guarantees:
 * - Course enrollment & lesson access enforced before sandbox execution.
 * - Anti-cheat redaction: Hidden test inputs/outputs are never leaked to students.
 * - Database transactions are NEVER held open during external E2B cloud execution.
 * - E2B infrastructure errors produce INTERNAL_ERROR and are never blamed on student code.
 */

interface ExerciseAccessResult {
  allowed: boolean
  statusCode?: number
  message?: string
  exercise?: any
  lesson?: any
  revision?: any
}

/**
 * Centralized authorization helper verifying that a user has valid access
 * to run or submit against a published coding exercise.
 */
export const verifyStudentExerciseAccess = async (
  userId: string,
  role: string,
  exerciseId: string,
  tx?: PrismaTransactionClient
): Promise<ExerciseAccessResult> => {
  if (!isValidUUID(exerciseId)) {
    return { allowed: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  const exercise = await findCodingExerciseById(exerciseId, tx)
  if (!exercise) {
    return { allowed: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  // Only PUBLISHED exercises are accessible for students
  if (exercise.status !== ExerciseStatus.PUBLISHED) {
    return {
      allowed: false,
      statusCode: 404,
      message: 'Coding exercise not found or not published'
    }
  }

  const lesson = await findLessonById(exercise.lessonId, tx)
  if (!lesson) {
    return { allowed: false, statusCode: 404, message: 'Lesson not found' }
  }

  // Course access / Enrollment checks
  const isStudent = String(role).toLowerCase() === 'user'
  const isTeacher = String(role).toLowerCase() === 'teacher'
  const isAdmin = String(role).toLowerCase() === 'admin'

  if (isStudent && !lesson.isDemo) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, exercise.courseId, tx)
    if (!enrollment) {
      return { allowed: false, statusCode: 403, message: 'You are not enrolled in this course' }
    }
  } else if (isTeacher) {
    // If teacher is author of the course -> full access
    const course = await findCourseById(exercise.courseId, tx)
    if (course && course.authorId !== userId) {
      const enrollment = await findEnrollmentByUserAndCourse(userId, exercise.courseId, tx)
      if (!enrollment && !lesson.isDemo) {
        return { allowed: false, statusCode: 403, message: 'You do not have access to this course' }
      }
    }
  }

  // Resolve active published revision
  const revision = await findLatestPublishedRevision(exerciseId, tx)
  if (!revision) {
    return {
      allowed: false,
      statusCode: 404,
      message: 'No published revision available for this exercise'
    }
  }

  return {
    allowed: true,
    exercise,
    lesson,
    revision
  }
}

// ==========================================
// 1. RUN CODE SERVICE
// ==========================================

export const runCodeService = async (
  {
    userId,
    role,
    exerciseId,
    sourceCode
  }: {
    userId: string
    role: string
    exerciseId: string
    sourceCode: string
  },
  e2bClient: IE2BClient = defaultE2BClient
): Promise<ServiceResponse> => {
  const access = await verifyStudentExerciseAccess(userId, role, exerciseId)
  if (!access.allowed) {
    return {
      success: false,
      statusCode: access.statusCode || 403,
      message: access.message || 'Access denied'
    }
  }

  const { revision } = access

  // Fetch ONLY public test cases for run mode
  const publicTestCases = await findTestCasesByRevisionId(revision.id, true)

  // Handle zero public test cases explicitly
  if (publicTestCases.length === 0) {
    return {
      success: true,
      statusCode: 200,
      message: 'No public test cases available for practice run',
      data: {
        status: 'NO_TEST_CASES',
        passedTests: 0,
        totalTests: 0,
        score: 0,
        maxScore: 100,
        totalExecutionTimeMs: 0,
        results: []
      }
    }
  }

  // Execute in isolated E2B Cloud Sandbox
  const executionResult = await executeTestSuite(
    {
      sourceCode,
      executionContract: revision.executionContract as ExecutionContract,
      testCases: publicTestCases.map((tc) => ({
        testCaseId: tc.id,
        input: tc.input as unknown[],
        expectedOutput: tc.expectedOutput,
        isHidden: false,
        order: tc.order,
        weight: tc.weight
      })),
      timeLimit: revision.timeLimit,
      memoryLimit: revision.memoryLimit
    },
    e2bClient
  )

  // RUN IS EPHEMERAL: Zero database writes (no CodingSubmission or CodingTestResult)

  return {
    success: true,
    statusCode: 200,
    message: 'Code executed successfully',
    data: {
      status: executionResult.status,
      passedTests: executionResult.passedTests,
      totalTests: executionResult.totalTests,
      score: executionResult.score,
      maxScore: 100,
      totalExecutionTimeMs: executionResult.totalExecutionTimeMs,
      results: executionResult.results.map((r: TestCaseExecutionResult) => ({
        testCaseId: r.testCaseId,
        order: r.order,
        weight: r.weight,
        isHidden: false,
        status: r.status,
        executionTimeMs: r.executionTimeMs ?? 0,
        actualOutput: r.actualOutput,
        expectedOutput: r.expectedOutput,
        stdout: r.stdout,
        errorMessage: r.errorMessage,
        comparisonReason: r.comparisonReason
      })),
      compilationError: executionResult.compilationError,
      infrastructureError: executionResult.infrastructureError
    }
  }
}

// ==========================================
// 2. SUBMIT CODE SERVICE
// ==========================================

export const submitCodeService = async (
  {
    userId,
    role,
    exerciseId,
    sourceCode
  }: {
    userId: string
    role: string
    exerciseId: string
    sourceCode: string
  },
  e2bClient: IE2BClient = defaultE2BClient
): Promise<ServiceResponse> => {
  const access = await verifyStudentExerciseAccess(userId, role, exerciseId)
  if (!access.allowed) {
    return {
      success: false,
      statusCode: access.statusCode || 403,
      message: access.message || 'Access denied'
    }
  }

  const { exercise, revision } = access

  // Fetch ALL test cases (both public and hidden)
  const allTestCases = await findTestCasesByRevisionId(revision.id, false)
  if (allTestCases.length === 0) {
    return {
      success: false,
      statusCode: 400,
      message: 'Exercise has no test cases configured for grading'
    }
  }

  // Step 1: Create initial submission with PENDING status
  const submission = await createCodingSubmission({
    exerciseId: exercise.id,
    revisionId: revision.id,
    userId,
    sourceCode,
    language: 'javascript',
    status: SubmissionStatus.PENDING,
    score: 0,
    maxScore: 100,
    passedTests: 0,
    totalTests: allTestCases.length
  })

  // Step 2: Execute all test cases via E2B Sandbox (OUTSIDE DATABASE TRANSACTION)
  let executionResult: CodeExecutionResult
  try {
    executionResult = await executeTestSuite(
      {
        sourceCode,
        executionContract: revision.executionContract as ExecutionContract,
        testCases: allTestCases.map((tc) => ({
          testCaseId: tc.id,
          input: tc.input as unknown[],
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          order: tc.order,
          weight: tc.weight
        })),
        timeLimit: revision.timeLimit,
        memoryLimit: revision.memoryLimit
      },
      e2bClient
    )
  } catch (err: any) {
    // E2B infrastructure failure: recorded as INTERNAL_ERROR (not student WRONG_ANSWER)
    executionResult = {
      status: 'INTERNAL_ERROR',
      passedTests: 0,
      totalTests: allTestCases.length,
      score: 0,
      maxScore: 100,
      totalExecutionTimeMs: 0,
      maxMemoryUsageKb: 0,
      results: [],
      infrastructureError: err.message || 'Execution infrastructure failure'
    }
  }

  // Step 3: Short Prisma Transaction to persist results & finalize submission status
  await prisma.$transaction(async (tx) => {
    await updateCodingSubmission(
      submission.id,
      {
        status: executionResult.status as SubmissionStatus,
        score: executionResult.score,
        passedTests: executionResult.passedTests,
        totalTests: executionResult.totalTests,
        executionTime: executionResult.totalExecutionTimeMs,
        memoryUsage: executionResult.maxMemoryUsageKb,
        errorMessage: executionResult.infrastructureError || executionResult.compilationError || null,
        completedAt: new Date()
      },
      tx
    )

    if (executionResult.results.length > 0) {
      await createManyCodingTestResults(
        executionResult.results.map((r) => ({
          submissionId: submission.id,
          testCaseId: r.testCaseId!,
          status: r.status as TestCaseStatus,
          actualOutput: r.actualOutput !== undefined ? (r.actualOutput as Prisma.InputJsonValue) : Prisma.JsonNull,
          executionTime: r.executionTimeMs ?? 0,
          memoryUsage: r.memoryUsageKb ?? 0,
          errorMessage: r.errorMessage || null,
          stdout: r.stdout || null
        })),
        tx
      )
    }
  })

  // Step 4: Sanitize student-facing response (ANTI-CHEAT REDACTION)
  const sanitizedResults = executionResult.results.map((r: TestCaseExecutionResult) => {
    if (r.isHidden) {
      // Hidden test: Strict redaction of input, expected output, actual output, stdout, and error
      return {
        testCaseId: r.testCaseId,
        order: r.order,
        weight: r.weight,
        isHidden: true,
        status: r.status,
        executionTimeMs: r.executionTimeMs ?? 0
      }
    }
    // Public test: Safe to expose all details
    return {
      testCaseId: r.testCaseId,
      order: r.order,
      weight: r.weight,
      isHidden: false,
      status: r.status,
      executionTimeMs: r.executionTimeMs ?? 0,
      actualOutput: r.actualOutput,
      expectedOutput: r.expectedOutput,
      stdout: r.stdout,
      errorMessage: r.errorMessage,
      comparisonReason: r.comparisonReason
    }
  })

  // Step 5: Completion Tracking, Dedicated XP & Streak Integration (STEP 6)
  let completionInfo = {
    exerciseCompleted: executionResult.status === SubmissionStatus.ACCEPTED,
    firstCompletion: false,
    completedAt: null as Date | null
  }

  let rewardsInfo = {
    codingXpAwarded: 0,
    dailyStreakXpAwarded: 0,
    totalXpAwarded: 0
  }

  let streakInfo: {
    currentStreak: number
    longestStreak: number
    dailyXpAwarded: number
    isFirstActivityToday: boolean
  } | undefined = undefined

  let progressInfo: {
    courseProgress: number
    lessonCompleted: boolean
  } | undefined = undefined

  if (executionResult.status === SubmissionStatus.ACCEPTED) {
    try {
      // 1. Completion tracking & Dedicated Coding Exercise XP
      // Run in transaction to guarantee atomicity of completion record + XP transaction
      await prisma.$transaction(async (tx) => {
        const existingCompletion = await findCompletionByUserAndExercise(userId, exercise.id, tx)
        if (!existingCompletion) {
          // First time completion! Award dedicated Coding Exercise XP (+30 EASY, +50 MEDIUM, +80 HARD)
          const xpRes = await awardCodingExerciseCompletionXP(
            {
              userId,
              exerciseId: exercise.id,
              difficulty: exercise.difficulty
            },
            tx
          )

          const xpAmount = xpRes.awarded ? xpRes.amount : 0
          rewardsInfo.codingXpAwarded = xpAmount

          const newCompletion = await createCodingExerciseCompletion(
            {
              userId,
              exerciseId: exercise.id,
              firstAcceptedSubmissionId: submission.id,
              completedAt: new Date(),
              bestScore: executionResult.score,
              totalAttempts: 1,
              xpAwarded: xpAmount
            },
            tx
          )

          completionInfo = {
            exerciseCompleted: true,
            firstCompletion: true,
            completedAt: newCompletion.completedAt
          }
        } else {
          // Already completed in past (repeated accepted submission)
          // Award ZERO coding XP, update attempts count / best score
          await tx.codingExerciseCompletion.update({
            where: {
              userId_exerciseId: {
                userId,
                exerciseId: exercise.id
              }
            },
            data: {
              totalAttempts: { increment: 1 },
              bestScore: Math.max(existingCompletion.bestScore, executionResult.score)
            }
          })

          completionInfo = {
            exerciseCompleted: true,
            firstCompletion: false,
            completedAt: existingCompletion.completedAt
          }
          rewardsInfo.codingXpAwarded = 0
        }
      })
    } catch (err: any) {
      // In case of concurrent race condition (e.g. P2002 on unique user_id + exercise_id)
      const existing = await findCompletionByUserAndExercise(userId, exercise.id)
      if (existing) {
        completionInfo = {
          exerciseCompleted: true,
          firstCompletion: false,
          completedAt: existing.completedAt
        }
        rewardsInfo.codingXpAwarded = 0
      }
    }

    try {
      // 2. Record Learning Activity Streak (Idempotent per calendar day in Asia/Ho_Chi_Minh)
      const streakRes = await recordLearningActivityStreak({ userId })
      if (streakRes.success) {
        const dailyXp = streakRes.dailyXpAwarded || 0
        rewardsInfo.dailyStreakXpAwarded = dailyXp
        streakInfo = {
          currentStreak: streakRes.currentStreak,
          longestStreak: streakRes.longestStreak,
          dailyXpAwarded: dailyXp,
          isFirstActivityToday: streakRes.isFirstActivityToday
        }
      }
    } catch {
      // Streak non-blocking fallback
    }

    rewardsInfo.totalXpAwarded = rewardsInfo.codingXpAwarded + rewardsInfo.dailyStreakXpAwarded

    try {
      // 3. Backward-compatible Progress Info: Reflect actual lesson progress WITHOUT auto-completing
      const [enrollment, lessonProg] = await Promise.all([
        findEnrollmentByUserAndCourse(userId, exercise.courseId),
        findProgress(userId, exercise.lessonId)
      ])
      if (enrollment) {
        progressInfo = {
          courseProgress: Number(enrollment.progress || 0),
          lessonCompleted: !!lessonProg?.completed
        }
      }
    } catch {
      // Progress non-blocking fallback
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Submission graded successfully',
    data: {
      id: submission.id,
      _id: submission.id,
      exerciseId: exercise.id,
      revisionId: revision.id,
      revisionVersion: revision.version,
      status: executionResult.status,
      score: executionResult.score,
      maxScore: 100,
      passedTests: executionResult.passedTests,
      totalTests: executionResult.totalTests,
      totalExecutionTimeMs: executionResult.totalExecutionTimeMs,
      completedAt: new Date(),
      results: sanitizedResults,
      compilationError: executionResult.compilationError,
      infrastructureError: executionResult.infrastructureError,
      completion: completionInfo,
      rewards: rewardsInfo,
      streak: streakInfo,
      progress: progressInfo
    }
  }
}

// ==========================================
// 3. SUBMISSION HISTORY SERVICE
// ==========================================

export const getSubmissionHistoryService = async ({
  userId,
  role,
  exerciseId,
  page = 1,
  limit = 10
}: {
  userId: string
  role: string
  exerciseId: string
  page?: number
  limit?: number
}): Promise<ServiceResponse> => {
  const access = await verifyStudentExerciseAccess(userId, role, exerciseId)
  if (!access.allowed) {
    return {
      success: false,
      statusCode: access.statusCode || 403,
      message: access.message || 'Access denied'
    }
  }

  const [submissions, total] = await Promise.all([
    findCodingSubmissionsByUserAndExercise({
      userId,
      exerciseId,
      page: Number(page),
      limit: Number(limit)
    }),
    countCodingSubmissionsByUserAndExercise(userId, exerciseId)
  ])

  const totalPages = Math.ceil(total / Number(limit)) || 1

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched submission history successfully',
    data: {
      items: submissions.map((s) => ({
        id: s.id,
        _id: s.id,
        exerciseId: s.exerciseId,
        revisionId: s.revisionId,
        revisionVersion: s.revision?.version ?? 1,
        status: s.status,
        score: s.score,
        maxScore: s.maxScore,
        passedTests: s.passedTests,
        totalTests: s.totalTests,
        executionTime: s.executionTime,
        createdAt: s.createdAt,
        completedAt: s.completedAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      }
    }
  }
}

// ==========================================
// 4. SUBMISSION DETAIL SERVICE
// ==========================================

export const getSubmissionDetailService = async ({
  userId,
  role,
  exerciseId,
  submissionId
}: {
  userId: string
  role: string
  exerciseId: string
  submissionId: string
}): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }
  if (!isValidUUID(submissionId)) {
    return { success: false, statusCode: 400, message: 'Invalid Submission ID' }
  }

  const submission = await findCodingSubmissionById(submissionId)
  if (!submission || submission.exerciseId !== exerciseId) {
    return { success: false, statusCode: 404, message: 'Submission not found' }
  }

  // Step 5: Stale PENDING recovery check (> 5 minutes)
  if (submission.status === SubmissionStatus.PENDING) {
    const ageMs = Date.now() - new Date(submission.createdAt).getTime()
    if (ageMs > 5 * 60 * 1000) {
      const errorMessage = 'Submission execution timed out or worker restarted'
      const completedAt = new Date()
      await updateCodingSubmission(submission.id, {
        status: SubmissionStatus.INTERNAL_ERROR,
        errorMessage,
        completedAt
      })
      ;(submission as any).status = SubmissionStatus.INTERNAL_ERROR
      ;(submission as any).errorMessage = errorMessage
      ;(submission as any).completedAt = completedAt
    }
  }

  // Ownership verification:
  // - Students can ONLY view their own submission
  // - Teachers can view if course owner or authorized
  // - Admins can view any submission
  const isOwner = submission.userId === userId
  const isAdmin = String(role).toLowerCase() === 'admin'
  const isTeacher = String(role).toLowerCase() === 'teacher'

  if (!isOwner && !isAdmin) {
    if (isTeacher) {
      const exercise = await findCodingExerciseById(exerciseId)
      if (exercise) {
        const course = await findCourseById(exercise.courseId)
        if (!course || course.authorId !== userId) {
          return { success: false, statusCode: 403, message: 'You do not have permission to view this submission' }
        }
      } else {
        return { success: false, statusCode: 403, message: 'You do not have permission to view this submission' }
      }
    } else {
      return { success: false, statusCode: 403, message: 'You do not have permission to view this submission' }
    }
  }

  // Anti-cheat redaction:
  // If the requester is a student (not admin / teacher), redact hidden test cases
  const sanitizedResults = submission.results.map((r) => {
    const isHidden = r.testCase?.isHidden ?? false

    if (isHidden && !isAdmin && !isTeacher) {
      return {
        id: r.id,
        testCaseId: r.testCaseId,
        status: r.status,
        isHidden: true,
        order: r.testCase?.order ?? 0,
        weight: r.testCase?.weight ?? 1,
        executionTime: r.executionTime
      }
    }

    return {
      id: r.id,
      testCaseId: r.testCaseId,
      status: r.status,
      isHidden,
      order: r.testCase?.order ?? 0,
      weight: r.testCase?.weight ?? 1,
      input: r.testCase?.input,
      expectedOutput: r.testCase?.expectedOutput,
      actualOutput: r.actualOutput,
      executionTime: r.executionTime,
      stdout: r.stdout,
      errorMessage: r.errorMessage,
      explanation: r.testCase?.explanation
    }
  })

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched submission details successfully',
    data: {
      id: submission.id,
      _id: submission.id,
      exerciseId: submission.exerciseId,
      revisionId: submission.revisionId,
      revisionVersion: submission.revision?.version ?? 1,
      sourceCode: submission.sourceCode,
      language: submission.language,
      status: submission.status,
      score: submission.score,
      maxScore: submission.maxScore,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      executionTime: submission.executionTime,
      memoryUsage: submission.memoryUsage,
      errorMessage: submission.errorMessage,
      createdAt: submission.createdAt,
      completedAt: submission.completedAt,
      results: sanitizedResults
    }
  }
}

// ==========================================
// 5. STALE PENDING SUBMISSIONS RECOVERY
// ==========================================

export const recoverStalePendingSubmissionsService = async (
  thresholdMinutes: number = 5
): Promise<ServiceResponse> => {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000)
  const result = await updateManyStaleSubmissions(cutoff, {
    status: SubmissionStatus.INTERNAL_ERROR,
    errorMessage: 'Submission execution timed out or worker restarted',
    completedAt: new Date()
  })

  return {
    success: true,
    statusCode: 200,
    message: `Recovered ${result.count} stale submission(s)`,
    data: {
      recoveredCount: result.count,
      cutoffTime: cutoff
    }
  }
}

