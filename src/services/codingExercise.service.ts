import slugify from 'slugify'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  archiveCodingExercise,
  countSubmissionsByRevisionId,
  createCodingExercise,
  createCodingExerciseRevision,
  createManyCodingTestCases,
  deleteTestCasesByRevisionId,
  findCodingExerciseById,
  findCodingExercisesByLesson,
  findCodingExerciseWithRevisions,
  findLatestPublishedRevision,
  findLatestRevision,
  findPublishedCodingExercisesByLesson,
  findPublishedExerciseById,
  findTestCasesByRevisionId,
  isExerciseSlugTakenInLesson,
  updateCodingExercise,
  updateCodingExerciseRevision
} from '~/repositories/codingExercise.repository'
import { findCourseById } from '~/repositories/course.repository'
import { findEnrollmentByUserAndCourse } from '~/repositories/enrollment.repository'
import { findLessonById } from '~/repositories/lesson.repository'
import {
  CreateCodingExerciseRequest,
  createCodingExerciseRequestSchema,
  UpdateCodingExerciseRequest,
  updateCodingExerciseRequestSchema
} from '~/models/codingExercise.model'
import { CodeExecutionResult, ExecutionContract, TestCaseExecutionResult } from '~/models/codeExecution.model'
import { defaultE2BClient, IE2BClient } from '~/integrations/e2b/e2b.client'
import { verifyReferenceSolution } from '~/services/codeExecution.service'
import { UserRole } from '~/types/enum'
import { ServiceResponse } from '~/types/type'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { ExerciseDifficulty, ExerciseSource, ExerciseStatus, Prisma } from '@prisma/client'

/**
 * TMDEMY — SERVICE LAYER: CODING EXERCISE
 * 
 * Implements business logic, cross-entity integrity, ownership validation,
 * immutable revision versioning, and student-safe response projection.
 */

// ==========================================
// 0. AUTHORIZATION HELPER
// ==========================================

function isCourseOwnerOrAdmin(role: string, courseAuthorId: string, userId: string): boolean {
  const normalized = String(role || '').toUpperCase()
  if (normalized === 'ADMIN') return true
  if (normalized === 'TEACHER') return courseAuthorId === userId
  return false
}

// ==========================================
// 1. TEACHER: CREATE CODING EXERCISE
// ==========================================

export const createCodingExerciseService = async (
  {
    userId,
    role,
    payload
  }: {
    userId: string
    role: string
    payload: unknown
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  // 1. Zod runtime validation
  const parseResult = createCodingExerciseRequestSchema.safeParse(payload)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: parseResult.error.flatten().fieldErrors
    }
  }
  const data: CreateCodingExerciseRequest = parseResult.data

  // 2. Verify Lesson existence
  const lesson = await findLessonById(data.lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  // 3. Resolve Course through Lesson and verify Course existence
  const courseId = lesson.courseId
  const course = await findCourseById(courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 4. Verify Course ownership for Teacher role
  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  // 5. Generate / Validate unique slug within lesson
  let finalSlug = data.slug
    ? slugify(data.slug, { lower: true, strict: true })
    : slugify(data.title, { lower: true, strict: true })

  const slugExists = await isExerciseSlugTakenInLesson(finalSlug, data.lessonId, undefined, tx)
  if (slugExists) {
    finalSlug = `${finalSlug}-${Date.now().toString(16).slice(-4)}`
  }

  // 6. Execute atomic creation within Prisma Transaction
  const executeCreation = async (clientTx: PrismaTransactionClient) => {
    // 6.1 Create CodingExercise parent entity (DRAFT status, MANUAL source)
    const exercise = await createCodingExercise(
      {
        lessonId: data.lessonId,
        courseId,
        title: data.title,
        slug: finalSlug,
        description: data.description,
        programmingLanguage: 'javascript',
        difficulty: data.difficulty as ExerciseDifficulty,
        starterCode: data.starterCode,
        referenceSolution: data.referenceSolution,
        executionContract: data.executionContract as Prisma.InputJsonValue,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        status: ExerciseStatus.DRAFT,
        source: ExerciseSource.MANUAL,
        order: data.order,
        createdById: userId
      },
      clientTx
    )

    // 6.2 Create CodingExerciseRevision v1 (isPublished = false)
    const revision = await createCodingExerciseRevision(
      {
        exerciseId: exercise.id,
        version: 1,
        title: data.title,
        description: data.description,
        starterCode: data.starterCode,
        referenceSolution: data.referenceSolution,
        executionContract: data.executionContract as Prisma.InputJsonValue,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        isPublished: false,
        createdById: userId
      },
      clientTx
    )

    // 6.3 Create all test cases under Revision v1
    const testCasesData: Prisma.CodingTestCaseCreateManyInput[] = data.testCases.map((tc, index) => ({
      revisionId: revision.id,
      input: tc.input as Prisma.InputJsonValue,
      expectedOutput: tc.expectedOutput as Prisma.InputJsonValue,
      isHidden: Boolean(tc.isHidden),
      order: tc.order ?? index,
      weight: tc.weight ?? 1,
      explanation: tc.explanation || null
    }))

    await createManyCodingTestCases(testCasesData, clientTx)

    return { exercise, revision, testCasesCount: testCasesData.length }
  }

  const result = tx ? await executeCreation(tx) : await prisma.$transaction(executeCreation)

  return {
    success: true,
    statusCode: 201,
    message: 'Coding exercise created successfully as DRAFT',
    data: {
      ...withCompatId(result.exercise),
      currentRevision: {
        id: result.revision.id,
        version: result.revision.version,
        isPublished: result.revision.isPublished
      },
      testCasesCount: result.testCasesCount
    }
  }
}

// ==========================================
// 2. TEACHER: LIST EXERCISES BY LESSON
// ==========================================

export const listCodingExercisesByLessonService = async (
  {
    userId,
    role,
    lessonId
  }: {
    userId: string
    role: string
    lessonId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(lessonId)) {
    return { success: false, statusCode: 400, message: 'Invalid Lesson ID' }
  }

  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = await findCourseById(lesson.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const exercises = await findCodingExercisesByLesson(lessonId, tx)

  const formattedExercises = exercises.map((ex) => {
    const latestRev = ex.revisions[0] || null
    return {
      ...withCompatId(ex),
      latestVersion: latestRev?.version || 1,
      isPublished: ex.revisions.some((r) => r.isPublished),
      hasDraftRevision: ex.revisions.some((r) => !r.isPublished),
      revisions: ex.revisions
    }
  })

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched coding exercises successfully',
    data: formattedExercises
  }
}

// ==========================================
// 3. TEACHER: GET FULL EXERCISE DETAILS (MANAGE)
// ==========================================

export const getCodingExerciseDetailManageService = async (
  {
    userId,
    role,
    exerciseId
  }: {
    userId: string
    role: string
    exerciseId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  const exercise = await findCodingExerciseWithRevisions(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  const course = await findCourseById(exercise.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  // Resolve current active working revision:
  // Preference order: latest draft revision if exists, else latest published revision, else highest version
  const draftRevision = exercise.revisions.find((r) => !r.isPublished)
  const publishedRevision = exercise.revisions.find((r) => r.isPublished)
  const targetRevision = draftRevision || publishedRevision || exercise.revisions[0]

    const isTargetPublished = Boolean(targetRevision?.isPublished)
    const formattedDetail = {
      ...withCompatId(exercise),
      currentRevision: targetRevision
        ? {
          ...withCompatId(targetRevision),
          testCases: targetRevision.testCases.map((tc) => withCompatId(tc))
        }
        : null,
      verification: {
        status: isTargetPublished ? 'VERIFIED' : 'UNVERIFIED',
        score: isTargetPublished ? 100 : 0,
        passRate: isTargetPublished ? 100 : 0,
        passedTests: isTargetPublished ? (targetRevision?.testCases.length || 0) : 0,
        totalTests: targetRevision?.testCases.length || 0,
        details: []
      },
      revisions: exercise.revisions.map((r) => ({
        id: r.id,
        version: r.version,
        title: r.title,
        isPublished: r.isPublished,
        createdAt: r.createdAt
      }))
    }

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched exercise management details successfully',
    data: formattedDetail
  }
}

// ==========================================
// 4. TEACHER: UPDATE EXERCISE (REVISION RULES A, B, C)
// ==========================================

export const updateCodingExerciseService = async (
  {
    userId,
    role,
    exerciseId,
    payload
  }: {
    userId: string
    role: string
    exerciseId: string
    payload: unknown
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  // 1. Zod runtime validation
  const parseResult = updateCodingExerciseRequestSchema.safeParse(payload)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: parseResult.error.flatten().fieldErrors
    }
  }
  const data: UpdateCodingExerciseRequest = parseResult.data

  // 2. Verify Exercise existence with revisions
  const exercise = await findCodingExerciseWithRevisions(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  // 3. Reject modification of ARCHIVED exercises
  if (exercise.status === ExerciseStatus.ARCHIVED) {
    return { success: false, statusCode: 400, message: 'Cannot modify an archived exercise' }
  }

  // 4. Verify Course ownership for Teacher role
  const course = await findCourseById(exercise.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }
  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  // 5. Slug uniqueness check if slug provided
  let newSlug = exercise.slug
  if (data.slug) {
    newSlug = slugify(data.slug, { lower: true, strict: true })
    const isTaken = await isExerciseSlugTakenInLesson(newSlug, exercise.lessonId, exerciseId, tx)
    if (isTaken) {
      return { success: false, statusCode: 409, message: 'Exercise slug already exists in this lesson' }
    }
  }

  // 6. REVISION DECISION LOGIC
  // Identify the latest revision (highest version)
  const latestRevision = exercise.revisions[0] || null
  if (!latestRevision) {
    return { success: false, statusCode: 500, message: 'Exercise has no revisions attached' }
  }

  // Check if latest revision has any student submissions
  const submissionCount = await countSubmissionsByRevisionId(latestRevision.id, tx)
  const isLatestRevisionFrozen = latestRevision.isPublished || submissionCount > 0

  const executeUpdate = async (clientTx: PrismaTransactionClient) => {
    let activeRevisionId = latestRevision.id
    let activeVersion = latestRevision.version

    if (!isLatestRevisionFrozen) {
      // -------------------------------------------------------------
      // CASE A: Editing an unpublished draft revision (No submissions)
      // Mutate the draft revision and replace test cases transactionally
      // -------------------------------------------------------------
      await updateCodingExerciseRevision(
        latestRevision.id,
        {
          title: data.title ?? latestRevision.title,
          description: data.description ?? latestRevision.description,
          starterCode: data.starterCode ?? latestRevision.starterCode,
          referenceSolution: data.referenceSolution ?? latestRevision.referenceSolution,
          executionContract: (data.executionContract as Prisma.InputJsonValue) ?? (latestRevision.executionContract as Prisma.InputJsonValue),
          timeLimit: data.timeLimit ?? latestRevision.timeLimit,
          memoryLimit: data.memoryLimit ?? latestRevision.memoryLimit
        },
        clientTx
      )

      if (data.testCases && data.testCases.length > 0) {
        // Replace test cases under this draft revision
        await deleteTestCasesByRevisionId(latestRevision.id, clientTx)
        const newTestCases: Prisma.CodingTestCaseCreateManyInput[] = data.testCases.map((tc, index) => ({
          revisionId: latestRevision.id,
          input: tc.input as Prisma.InputJsonValue,
          expectedOutput: tc.expectedOutput as Prisma.InputJsonValue,
          isHidden: Boolean(tc.isHidden),
          order: tc.order ?? index,
          weight: tc.weight ?? 1,
          explanation: tc.explanation || null
        }))
        await createManyCodingTestCases(newTestCases, clientTx)
      }
    } else {
      // -------------------------------------------------------------
      // CASE B & C: Latest revision is published or referenced by submissions
      // Create a brand new revision v(N+1), keep it unpublished (isPublished = false)
      // -------------------------------------------------------------
      activeVersion = latestRevision.version + 1

      const newRevision = await createCodingExerciseRevision(
        {
          exerciseId,
          version: activeVersion,
          title: data.title ?? latestRevision.title,
          description: data.description ?? latestRevision.description,
          starterCode: data.starterCode ?? latestRevision.starterCode,
          referenceSolution: data.referenceSolution ?? latestRevision.referenceSolution,
          executionContract: (data.executionContract as Prisma.InputJsonValue) ?? (latestRevision.executionContract as Prisma.InputJsonValue),
          timeLimit: data.timeLimit ?? latestRevision.timeLimit,
          memoryLimit: data.memoryLimit ?? latestRevision.memoryLimit,
          isPublished: false,
          createdById: userId
        },
        clientTx
      )
      activeRevisionId = newRevision.id

      // Test cases: use newly provided test cases or copy from previous revision
      let testCasesToInsert: Prisma.CodingTestCaseCreateManyInput[] = []
      if (data.testCases && data.testCases.length > 0) {
        testCasesToInsert = data.testCases.map((tc, index) => ({
          revisionId: newRevision.id,
          input: tc.input as Prisma.InputJsonValue,
          expectedOutput: tc.expectedOutput as Prisma.InputJsonValue,
          isHidden: Boolean(tc.isHidden),
          order: tc.order ?? index,
          weight: tc.weight ?? 1,
          explanation: tc.explanation || null
        }))
      } else {
        // Copy previous test cases to the new revision
        testCasesToInsert = latestRevision.testCases.map((tc) => ({
          revisionId: newRevision.id,
          input: tc.input as Prisma.InputJsonValue,
          expectedOutput: tc.expectedOutput as Prisma.InputJsonValue,
          isHidden: tc.isHidden,
          order: tc.order,
          weight: tc.weight,
          explanation: tc.explanation
        }))
      }

      await createManyCodingTestCases(testCasesToInsert, clientTx)
    }

    // Update parent CodingExercise working metadata
    const updatedExercise = await updateCodingExercise(
      exerciseId,
      {
        title: data.title ?? exercise.title,
        slug: newSlug,
        description: data.description ?? exercise.description,
        difficulty: (data.difficulty as ExerciseDifficulty) ?? exercise.difficulty,
        order: data.order ?? exercise.order,
        starterCode: data.starterCode ?? exercise.starterCode,
        referenceSolution: data.referenceSolution ?? exercise.referenceSolution,
        executionContract: (data.executionContract as Prisma.InputJsonValue) ?? (exercise.executionContract as Prisma.InputJsonValue),
        timeLimit: data.timeLimit ?? exercise.timeLimit,
        memoryLimit: data.memoryLimit ?? exercise.memoryLimit
        // Note: Exercise status is PRESERVED (does not revert to DRAFT if already PUBLISHED)
      },
      clientTx
    )

    return { updatedExercise, activeRevisionId, activeVersion }
  }

  const result = tx ? await executeUpdate(tx) : await prisma.$transaction(executeUpdate)

  return {
    success: true,
    statusCode: 200,
    message: isLatestRevisionFrozen
      ? `Published revision preserved. Created new draft revision v${result.activeVersion}.`
      : 'Draft exercise revision updated successfully.',
    data: {
      ...withCompatId(result.updatedExercise),
      activeRevisionId: result.activeRevisionId,
      activeVersion: result.activeVersion
    }
  }
}

// ==========================================
// 5. STUDENT: LIST PUBLISHED EXERCISES
// ==========================================

export const listPublishedCodingExercisesByLessonService = async (
  {
    userId,
    role,
    lessonId
  }: {
    userId: string
    role: string
    lessonId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(lessonId)) {
    return { success: false, statusCode: 400, message: 'Invalid Lesson ID' }
  }

  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  // Student enrollment check (if not teacher/admin and not demo lesson)
  if (role === UserRole.USER && !lesson.isDemo) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, lesson.courseId, tx)
    if (!enrollment) {
      return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
    }
  }

  // Fetch only PUBLISHED exercises with their active published revision
  const exercises = await findPublishedCodingExercisesByLesson(lessonId, tx)

  // Filter out any exercise lacking an active published revision
  const validPublishedExercises = exercises.filter((ex) => ex.revisions.length > 0)

  // Map to student-safe public item DTO
  const publicItems = validPublishedExercises.map((ex) => ({
    id: ex.id,
    _id: ex.id,
    lessonId: ex.lessonId,
    title: ex.title,
    slug: ex.slug,
    difficulty: ex.difficulty,
    programmingLanguage: ex.programmingLanguage,
    order: ex.order,
    status: ex.status
  }))

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched published coding exercises successfully',
    data: publicItems
  }
}

// ==========================================
// 6. STUDENT: GET PUBLISHED EXERCISE DETAIL
// ==========================================

export const getPublishedCodingExerciseDetailService = async (
  {
    userId,
    role,
    exerciseId
  }: {
    userId: string
    role: string
    exerciseId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  const exercise = await findPublishedExerciseById(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  const lesson = await findLessonById(exercise.lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  // Enrollment check
  if (role === UserRole.USER && !lesson.isDemo) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, exercise.courseId, tx)
    if (!enrollment) {
      return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
    }
  }
  // @ts-check
  const publishedRevision = exercise.revisions[0] || null
  if (!publishedRevision) {
    return { success: false, statusCode: 404, message: 'No published revision available for this exercise' }
  }

  // Strictly Student-Safe DTO: NO referenceSolution, NO hidden tests, NO internal fields
  const publicDetail = {
    id: exercise.id,
    _id: exercise.id,
    lessonId: exercise.lessonId,
    courseId: exercise.courseId,
    title: exercise.title,
    slug: exercise.slug,
    description: exercise.description,
    programmingLanguage: exercise.programmingLanguage,
    difficulty: exercise.difficulty,
    starterCode: exercise.starterCode,
    executionContract: exercise.executionContract,
    timeLimit: exercise.timeLimit,
    memoryLimit: exercise.memoryLimit,
    order: exercise.order,
    version: publishedRevision.version,
    testCases: publishedRevision.testCases.map((tc) => ({
      id: tc.id,
      _id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      order: tc.order,
      weight: tc.weight,
      explanation: tc.explanation
    }))
  }

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched exercise details successfully',
    data: publicDetail
  }
}

// ==========================================
// 7. TEACHER: ARCHIVE CODING EXERCISE
// ==========================================

export const archiveCodingExerciseService = async (
  {
    userId,
    role,
    exerciseId
  }: {
    userId: string
    role: string
    exerciseId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  const exercise = await findCodingExerciseById(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  const course = await findCourseById(exercise.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  // Idempotent: if already archived, return immediately
  if (exercise.status === ExerciseStatus.ARCHIVED) {
    return {
      success: true,
      statusCode: 200,
      message: 'Exercise is already archived'
    }
  }

  // Soft-delete by updating status to ARCHIVED
  await archiveCodingExercise(exerciseId, tx)

  return {
    success: true,
    statusCode: 200,
    message: 'Coding exercise archived successfully'
  }
}

// ==========================================
// 8. TEACHER: PUBLISH CODING EXERCISE (STEP 5)
// ==========================================

export const publishCodingExerciseService = async (
  {
    userId,
    role,
    exerciseId
  }: {
    userId: string
    role: string
    exerciseId: string
  },
  e2bClient: IE2BClient = defaultE2BClient,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  const exercise = await findCodingExerciseById(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  const course = await findCourseById(exercise.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  if (exercise.status === ExerciseStatus.ARCHIVED) {
    return {
      success: false,
      statusCode: 400,
      message: 'Cannot publish an archived exercise. Update or recreate the exercise first.'
    }
  }

  // Fetch latest revision to publish
  const latestRevision = await findLatestRevision(exerciseId, tx)
  if (!latestRevision) {
    return {
      success: false,
      statusCode: 400,
      message: 'No revision available to publish for this exercise'
    }
  }

  // Fetch all test cases under this revision
  const testCases = await findTestCasesByRevisionId(latestRevision.id, false, tx)
  if (!testCases || testCases.length === 0) {
    return {
      success: false,
      statusCode: 400,
      message: 'Exercise must have at least one test case before it can be published'
    }
  }

  // Mandatory Safety Gate: Automated verification of reference solution against all test cases in E2B
  const verification = await verifyReferenceSolution(
    {
      sourceCode: latestRevision.referenceSolution,
      executionContract: latestRevision.executionContract as unknown as ExecutionContract,
      testCases: testCases.map((tc) => ({
        testCaseId: tc.id,
        input: tc.input as unknown[],
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        order: tc.order,
        weight: tc.weight
      })),
      timeLimit: latestRevision.timeLimit,
      memoryLimit: latestRevision.memoryLimit
    },
    e2bClient
  )

  if (!verification.isValid || verification.score < 100) {
    const failureSummary = buildActionableVerificationSummary(verification)
    const formattedDetails = verification.result.results.map((r, idx) => ({
      testCaseIndex: r.order ?? idx + 1,
      testCaseId: r.testCaseId,
      passed: r.status === 'PASSED',
      status: r.status,
      errorMessage: r.errorMessage || null,
      actualOutput: r.actualOutput !== undefined ? r.actualOutput : null,
      comparisonReason: r.comparisonReason || null,
      executionTimeMs: r.executionTimeMs || 0
    }))

    return {
      success: false,
      statusCode: 400,
      message: `Reference solution failed automated verification. Cannot publish exercise. ${failureSummary}`,
      data: {
        score: verification.score,
        passRate: verification.passRate,
        passedTests: verification.result.passedTests,
        totalTests: verification.result.totalTests,
        compilationError: verification.result.compilationError,
        infrastructureError: verification.result.infrastructureError,
        failures: verification.result.results.filter((r) => r.status !== 'PASSED'),
        diagnostics: {
          summary: failureSummary,
          details: formattedDetails
        },
        verification: {
          status: 'FAILED',
          score: verification.score,
          passRate: verification.passRate,
          passedTests: verification.result.passedTests,
          totalTests: verification.result.totalTests,
          details: formattedDetails
        }
      }
    }
  }

  // Verification passed 100%! Publish revision and exercise in an atomic transaction
  const executePublish = async (clientTx: PrismaTransactionClient) => {
    // Demote any previously published revisions for this exercise
    await clientTx.codingExerciseRevision.updateMany({
      where: { exerciseId, isPublished: true },
      data: { isPublished: false }
    })

    // Set the latest revision as the active published revision
    const publishedRevision = await updateCodingExerciseRevision(
      latestRevision.id,
      { isPublished: true },
      clientTx
    )

    // Set exercise status to PUBLISHED
    const publishedExercise = await updateCodingExercise(
      exerciseId,
      { status: ExerciseStatus.PUBLISHED },
      clientTx
    )

    return { publishedExercise, publishedRevision }
  }

  const result = tx ? await executePublish(tx) : await prisma.$transaction(executePublish)

  return {
    success: true,
    statusCode: 200,
    message: 'Exercise verified against reference solution and published successfully',
    data: {
      ...withCompatId(result.publishedExercise),
      publishedRevisionId: result.publishedRevision.id,
      version: result.publishedRevision.version,
      verification: {
        score: verification.score,
        passRate: verification.passRate,
        passedTests: verification.result.passedTests,
        totalTests: verification.result.totalTests
      }
    }
  }
}

// ==========================================
// 9. TEACHER: UNPUBLISH CODING EXERCISE (STEP 5)
// ==========================================

export const unpublishCodingExerciseService = async (
  {
    userId,
    role,
    exerciseId
  }: {
    userId: string
    role: string
    exerciseId: string
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  const exercise = await findCodingExerciseById(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  const course = await findCourseById(exercise.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  if (exercise.status === ExerciseStatus.DRAFT) {
    return {
      success: true,
      statusCode: 200,
      message: 'Exercise is already in DRAFT status',
      data: withCompatId(exercise)
    }
  }

  const executeUnpublish = async (clientTx: PrismaTransactionClient) => {
    // Revert exercise status to DRAFT
    const unpublishedExercise = await updateCodingExercise(
      exerciseId,
      { status: ExerciseStatus.DRAFT },
      clientTx
    )
    return unpublishedExercise
  }

  const result = tx ? await executeUnpublish(tx) : await prisma.$transaction(executeUnpublish)

  return {
    success: true,
    statusCode: 200,
    message: 'Coding exercise unpublished successfully (reverted to DRAFT)',
    data: withCompatId(result)
  }
}

// ==========================================
// STEP 7G: VERIFICATION DIAGNOSTICS & RE-VERIFICATION (PHASE 2)
// ==========================================

export function buildActionableVerificationSummary(verification: {
  isValid: boolean
  score: number
  passRate: number
  result: CodeExecutionResult
}): string {
  const { result } = verification
  if (result.infrastructureError) {
    return `Lỗi hạ tầng Sandbox E2B: ${result.infrastructureError}`
  }
  if (result.compilationError) {
    return `Lỗi cú pháp/biên dịch: ${result.compilationError}`
  }
  const failedTests = result.results.filter((r: TestCaseExecutionResult) => r.status !== 'PASSED')
  if (failedTests.length > 0) {
    const firstFail = failedTests[0]
    const failReason = firstFail.errorMessage
      ? `: ${firstFail.errorMessage}`
      : firstFail.comparisonReason
        ? `: ${firstFail.comparisonReason}`
        : ''
    return `Lời giải mẫu không vượt qua ${failedTests.length} trên tổng số ${result.totalTests} bài test${failReason}`
  }
  if (result.status === 'TIME_LIMIT_EXCEEDED') {
    return 'Lời giải mẫu vượt quá thời gian thực thi (Execution timed out).'
  }
  return `Lời giải mẫu không đạt điểm tuyệt đối (${verification.score}/100 điểm).`
}

/**
 * STEP 7G: TEACHER RE-VERIFY CODING EXERCISE (PHASE 2.3)
 * Allows teachers to test and verify the current draft revision against E2B sandbox without publishing.
 * Returns actionable diagnostics and pass/fail breakdown.
 */
export const reverifyCodingExerciseService = async (
  {
    userId,
    role,
    exerciseId
  }: {
    userId: string
    role: string
    exerciseId: string
  },
  e2bClient: IE2BClient = defaultE2BClient,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!isValidUUID(exerciseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Exercise ID' }
  }

  const exercise = await findCodingExerciseById(exerciseId, tx)
  if (!exercise) {
    return { success: false, statusCode: 404, message: 'Coding exercise not found' }
  }

  const course = await findCourseById(exercise.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (!isCourseOwnerOrAdmin(role, course.authorId, userId)) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const latestRevision = await findLatestRevision(exerciseId, tx)
  if (!latestRevision) {
    return {
      success: false,
      statusCode: 400,
      message: 'Không tìm thấy phiên bản nào của bài tập để nghiệm thu.'
    }
  }

  const testCases = await findTestCasesByRevisionId(latestRevision.id, false, tx)
  if (!testCases || testCases.length === 0) {
    return {
      success: false,
      statusCode: 400,
      message: 'Bài tập chưa có test case nào để nghiệm thu.'
    }
  }

  // Execute verification in sandbox
  const verification = await verifyReferenceSolution(
    {
      sourceCode: latestRevision.referenceSolution,
      executionContract: latestRevision.executionContract as unknown as ExecutionContract,
      testCases: testCases.map((tc) => ({
        testCaseId: tc.id,
        input: tc.input as unknown[],
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        order: tc.order,
        weight: tc.weight
      })),
      timeLimit: latestRevision.timeLimit,
      memoryLimit: latestRevision.memoryLimit
    },
    e2bClient
  )

  const isVerified = verification.isValid && verification.score === 100
  const verificationStatus = isVerified ? 'VERIFIED' : 'FAILED'
  const summaryMessage = isVerified
    ? `Lời giải mẫu đã vượt qua 100% (${verification.result.passedTests}/${verification.result.totalTests}) bài test trong Sandbox E2B.`
    : buildActionableVerificationSummary(verification)

  // Map failure details with actionable diagnostics (teacher-only authorized)
  const formattedDetails = verification.result.results.map((r, idx) => ({
    testCaseIndex: r.order ?? idx + 1,
    testCaseId: r.testCaseId,
    passed: r.status === 'PASSED',
    status: r.status,
    errorMessage: r.errorMessage || null,
    actualOutput: r.actualOutput !== undefined ? r.actualOutput : null,
    comparisonReason: r.comparisonReason || null,
    executionTimeMs: r.executionTimeMs || 0
  }))

  return {
    success: true,
    statusCode: 200,
    message: summaryMessage,
    data: {
      exerciseId,
      revisionId: latestRevision.id,
      version: latestRevision.version,
      verificationStatus,
      status: verificationStatus,
      isVerified,
      score: verification.score,
      passRate: verification.passRate,
      passedTests: verification.result.passedTests,
      totalTests: verification.result.totalTests,
      details: formattedDetails,
      compilationError: verification.result.compilationError || null,
      infrastructureError: verification.result.infrastructureError || null,
      diagnostics: {
        summary: summaryMessage,
        details: formattedDetails
      },
      verification: {
        status: verificationStatus,
        score: verification.score,
        passRate: verification.passRate,
        passedTests: verification.result.passedTests,
        totalTests: verification.result.totalTests,
        details: formattedDetails
      }
    }
  }
}


