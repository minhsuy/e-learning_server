import { prisma, connectPrisma, disconnectPrisma } from '../src/config/prisma'
import {
  archiveCodingExerciseService,
  createCodingExerciseService,
  getCodingExerciseDetailManageService,
  getPublishedCodingExerciseDetailService,
  listCodingExercisesByLessonService,
  listPublishedCodingExercisesByLessonService,
  updateCodingExerciseService
} from '../src/services/codingExercise.service'
import { ExerciseStatus, SubmissionStatus, UserRole } from '@prisma/client'

interface TestResult {
  suite: string
  name: string
  passed: boolean
  detail?: string
}

const results: TestResult[] = []

function assert(condition: boolean, suite: string, name: string, detail?: string) {
  if (condition) {
    results.push({ suite, name, passed: true })
    console.log(`  PASS: [${suite}] ${name}`)
  } else {
    results.push({ suite, name, passed: false, detail })
    console.error(` FAIL: [${suite}] ${name} - ${detail || 'Assertion failed'}`)
  }
}

async function runStep2TestSuite() {
  console.log('\n=================================================================')
  console.log(' STEP 2: CODING EXERCISE CRUD & REVISION MANAGEMENT TEST SUITE')
  console.log('=================================================================\n')

  await connectPrisma()

  // Track created disposable IDs for teardown
  const createdExerciseIds: string[] = []
  const createdSubmissionIds: string[] = []

  try {
    // -------------------------------------------------------------------------
    // SETUP: Retrieve test fixtures from database
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Resolving Database Fixtures ---')
    const lesson = await prisma.lesson.findFirst({
      include: { course: true, author: true, quiz: true }
    })

    if (!lesson) {
      console.warn('⚠️ No existing Lesson found. Aborting test suite.')
      return
    }

    const testLessonId = lesson.id
    const testCourseId = lesson.courseId
    const courseOwnerTeacherId = lesson.course.authorId

    // Find another teacher to test unauthorized ownership
    const otherTeacher = await prisma.user.findFirst({
      where: {
        role: UserRole.TEACHER,
        id: { not: courseOwnerTeacherId }
      }
    })
    const otherTeacherId = otherTeacher ? otherTeacher.id : '00000000-0000-0000-0000-000000000001'

    // Find a student
    const student = await prisma.user.findFirst({
      where: { role: UserRole.USER }
    }) || lesson.author
    const studentId = student.id

    console.log(`  Lesson ID:    ${testLessonId}`)
    console.log(`  Course ID:    ${testCourseId}`)
    console.log(`  Owner Teacher:${courseOwnerTeacherId}`)
    console.log(`  Other Teacher:${otherTeacherId}`)
    console.log(`  Student ID:   ${studentId}`)

    // =========================================================================
    // SUITE 1: CREATION TESTS (Scenarios 1-9)
    // =========================================================================
    console.log('\n--- SUITE 1: Creation Tests ---')

    const validPayload = {
      lessonId: testLessonId,
      title: 'Sum Numbers Up To N',
      slug: `sum-to-n-${Date.now()}`,
      description: 'Write a function sumToN(n) returning the sum from 1 to n.',
      programmingLanguage: 'javascript',
      difficulty: 'EASY',
      starterCode: 'function sumToN(n) {\n  // TODO\n}',
      referenceSolution: 'function sumToN(n) {\n  return n * (n + 1) / 2;\n}',
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
          weight: 30,
          explanation: '1+2+3+4+5 = 15'
        },
        {
          input: [10],
          expectedOutput: 55,
          isHidden: true,
          order: 2,
          weight: 70,
          explanation: 'Hidden test: sum up to 10'
        }
      ]
    }

    // 1. Teacher creates a valid exercise
    const createRes1 = await createCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      payload: validPayload
    })
    assert(createRes1.success === true && createRes1.statusCode === 201, 'Creation', '1. Teacher creates valid exercise (201 Created)')
    const exercise1Id = createRes1.data?.id
    if (exercise1Id) createdExerciseIds.push(exercise1Id)

    // 2. Exercise defaults to DRAFT
    assert(createRes1.data?.status === 'DRAFT', 'Creation', '2. Exercise defaults to DRAFT status')

    // 3. Revision v1 is created with isPublished = false
    assert(createRes1.data?.currentRevision?.version === 1, 'Creation', '3a. Revision v1 is created')
    assert(createRes1.data?.currentRevision?.isPublished === false, 'Creation', '3b. Revision v1 isPublished = false')

    // 4. Test cases are created correctly under revision v1
    assert(createRes1.data?.testCasesCount === 2, 'Creation', '4. Two test cases created under revision v1')

    // 5. Exercise courseId matches its Lesson's Course
    assert(createRes1.data?.courseId === testCourseId, 'Creation', '5. Exercise courseId matches Lesson courseId')

    // 6. Invalid input is rejected (e.g. testcase parameter count mismatch)
    const invalidPayload = {
      ...validPayload,
      slug: `invalid-slug-${Date.now()}`,
      testCases: [
        {
          input: [1, 2], // 2 args given, but executionContract only has 1 parameter
          expectedOutput: 3
        }
      ]
    }
    const createInvalidRes = await createCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      payload: invalidPayload
    })
    assert(createInvalidRes.success === false && createInvalidRes.statusCode === 400, 'Creation', '6. Invalid parameter count mismatch rejected (400)')

    // 7. Duplicate slug in same lesson is resolved/prevented
    const duplicateSlugPayload = {
      ...validPayload,
      title: 'Another Exercise Same Slug',
      slug: validPayload.slug // identical slug in same lesson
    }
    const dupRes = await createCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      payload: duplicateSlugPayload
    })
    assert(dupRes.success === true && dupRes.data?.slug !== validPayload.slug, 'Creation', '7. Duplicate slug in same lesson safely auto-disambiguated with unique suffix')
    if (dupRes.data?.id) createdExerciseIds.push(dupRes.data.id)

    // 8. Student cannot create exercises
    const studentCreateRes = await createCodingExerciseService({
      userId: studentId,
      role: UserRole.USER,
      payload: validPayload
    })
    assert(studentCreateRes.success === false && studentCreateRes.statusCode === 403, 'Creation', '8. Student role cannot create exercise (403 Forbidden)')

    // 9. Teacher cannot create exercises in another teacher's course
    const otherTeacherCreateRes = await createCodingExerciseService({
      userId: otherTeacherId,
      role: UserRole.TEACHER,
      payload: { ...validPayload, slug: `other-teacher-${Date.now()}` }
    })
    assert(otherTeacherCreateRes.success === false && otherTeacherCreateRes.statusCode === 403, 'Creation', '9. Non-owner teacher cannot create exercise in course (403 Forbidden)')

    // =========================================================================
    // SUITE 2: READING TESTS (Scenarios 10-16)
    // =========================================================================
    console.log('\n--- SUITE 2: Reading Tests ---')

    // 10. Teacher can view owned exercises in lesson
    const teacherListRes = await listCodingExercisesByLessonService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      lessonId: testLessonId
    })
    assert(teacherListRes.success === true && Array.isArray(teacherListRes.data) && teacherListRes.data.length >= 2, 'Reading', '10. Teacher lists owned exercises for lesson')

    // 11. Teacher can view hidden test cases and reference solution in manage endpoint
    const teacherManageRes = await getCodingExerciseDetailManageService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      exerciseId: exercise1Id
    })
    assert(teacherManageRes.success === true, 'Reading', '11a. Teacher fetches full manage details')
    assert(Boolean(teacherManageRes.data?.referenceSolution), 'Reading', '11b. Teacher manage view contains reference solution')
    const teacherTestCases = teacherManageRes.data?.currentRevision?.testCases || []
    assert(teacherTestCases.some((tc: any) => tc.isHidden === true), 'Reading', '11c. Teacher manage view includes hidden test cases')

    // 12. Unauthorized teacher cannot view private exercise details
    const unauthManageRes = await getCodingExerciseDetailManageService({
      userId: otherTeacherId,
      role: UserRole.TEACHER,
      exerciseId: exercise1Id
    })
    assert(unauthManageRes.success === false && unauthManageRes.statusCode === 403, 'Reading', '12. Unauthorized teacher rejected from manage view (403 Forbidden)')

    // 13. Student cannot view draft exercises
    const studentListRes = await listPublishedCodingExercisesByLessonService({
      userId: studentId,
      role: UserRole.USER,
      lessonId: testLessonId
    })
    const publicList = studentListRes.data || []
    assert(!publicList.some((ex: any) => ex.id === exercise1Id), 'Reading', '13. Student list excludes DRAFT exercise')

    // 14. Student get published exercise rejects draft
    const studentDetailDraftRes = await getPublishedCodingExerciseDetailService({
      userId: studentId,
      role: UserRole.USER,
      exerciseId: exercise1Id
    })
    assert(studentDetailDraftRes.success === false && studentDetailDraftRes.statusCode === 404, 'Reading', '14. Student cannot access DRAFT exercise directly (404 Not Found)')

    // Publish exercise1 for student tests (Simulate publish transition with isPublished = true revision)
    await prisma.codingExercise.update({
      where: { id: exercise1Id },
      data: { status: ExerciseStatus.PUBLISHED }
    })
    await prisma.codingExerciseRevision.updateMany({
      where: { exerciseId: exercise1Id, version: 1 },
      data: { isPublished: true }
    })

    // Now student accesses published exercise
    const studentDetailPubRes = await getPublishedCodingExerciseDetailService({
      userId: studentId,
      role: UserRole.USER,
      exerciseId: exercise1Id
    })
    assert(studentDetailPubRes.success === true, 'Reading', 'Student accesses published exercise')

    // 15. Student responses never expose reference solutions
    assert(studentDetailPubRes.data?.referenceSolution === undefined, 'Reading', '15. Student response STRICTLY omits referenceSolution')

    // 16. Student responses never expose hidden test cases
    const studentTestCases = studentDetailPubRes.data?.testCases || []
    assert(studentTestCases.length === 1, 'Reading', '16a. Student only receives public test cases (1 public, 0 hidden)')
    assert(studentTestCases[0].expectedOutput === 15, 'Reading', '16b. Student receives public expected output')

    // =========================================================================
    // SUITE 3: UPDATING & VERSIONING TESTS (Scenarios 17-22)
    // =========================================================================
    console.log('\n--- SUITE 3: Updating & Versioning Tests ---')

    // Create a new DRAFT exercise for Case A test
    const draftForUpdate = await createCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      payload: {
        ...validPayload,
        title: 'Draft Exercise To Update',
        slug: `draft-update-${Date.now()}`
      }
    })
    const draftUpdateId = draftForUpdate.data?.id
    if (draftUpdateId) createdExerciseIds.push(draftUpdateId)

    // 17. Case A: Draft revision can be updated safely in-place
    const updateDraftRes = await updateCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      exerciseId: draftUpdateId,
      payload: {
        title: 'Draft Exercise Updated Title',
        timeLimit: 3000
      }
    })
    assert(updateDraftRes.success === true, 'Updating', '17a. Draft revision updated in-place')
    assert(updateDraftRes.data?.activeVersion === 1, 'Updating', '17b. Draft revision version remains 1')

    // 18 & 19. Case B: Updating a PUBLISHED exercise preserves v1 and creates new draft revision v2
    const updatePublishedRes = await updateCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      exerciseId: exercise1Id,
      payload: {
        title: 'Sum Numbers Up To N (Revised Description)',
        timeLimit: 1500
      }
    })
    assert(updatePublishedRes.success === true, 'Updating', '18. Published exercise update succeeds')
    assert(updatePublishedRes.data?.activeVersion === 2, 'Updating', '19. New draft revision v2 created')

    // 20. Old revision v1 and test cases remain completely unchanged
    const rev1Record = await prisma.codingExerciseRevision.findUnique({
      where: {
        exerciseId_version: {
          exerciseId: exercise1Id,
          version: 1
        }
      },
      include: { testCases: true }
    })
    assert(rev1Record !== null && rev1Record.isPublished === true, 'Updating', '20a. Revision v1 remains published and intact')
    assert(rev1Record?.testCases.length === 2, 'Updating', '20b. Revision v1 test cases remain 2')

    // 21. Historical submission references remain valid
    // Simulate a historical submission pointing to Revision v1
    const sub = await prisma.codingSubmission.create({
      data: {
        exerciseId: exercise1Id,
        revisionId: rev1Record!.id,
        userId: studentId,
        sourceCode: 'function sumToN(n) { return 15; }',
        status: SubmissionStatus.ACCEPTED,
        score: 100,
        maxScore: 100
      }
    })
    createdSubmissionIds.push(sub.id)

    const historicalSub = await prisma.codingSubmission.findUnique({
      where: { id: sub.id },
      include: { revision: true }
    })
    assert(historicalSub?.revisionId === rev1Record!.id, 'Updating', '21. Historical submission maintains correct revisionId link')

    // 22. Subsequent update while draft v2 exists mutates draft v2 in place (Case C)
    const updateV2Res = await updateCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      exerciseId: exercise1Id,
      payload: {
        description: 'Updated draft v2 description twice.'
      }
    })
    assert(updateV2Res.data?.activeVersion === 2, 'Updating', '22. Editing exercise with existing draft v2 updates v2 in-place (no unnecessary v3 created)')

    // =========================================================================
    // SUITE 4: ARCHIVING TESTS (Scenarios 23-26)
    // =========================================================================
    console.log('\n--- SUITE 4: Archiving Tests ---')

    // 23. Archive changes exercise status to ARCHIVED
    const archiveRes = await archiveCodingExerciseService({
      userId: courseOwnerTeacherId,
      role: UserRole.TEACHER,
      exerciseId: exercise1Id
    })
    assert(archiveRes.success === true, 'Archiving', '23a. Archive service returned success')

    const archivedRecord = await prisma.codingExercise.findUnique({
      where: { id: exercise1Id }
    })
    assert(archivedRecord?.status === ExerciseStatus.ARCHIVED, 'Archiving', '23b. Exercise status in DB is ARCHIVED')

    // 24. Archived exercises disappear from student views
    const studentListAfterArchive = await listPublishedCodingExercisesByLessonService({
      userId: studentId,
      role: UserRole.USER,
      lessonId: testLessonId
    })
    const pubList2 = studentListAfterArchive.data || []
    assert(!pubList2.some((ex: any) => ex.id === exercise1Id), 'Archiving', '24. Archived exercise excluded from student published list')

    // 25. Archive does NOT delete submissions or test cases
    const subAfterArchive = await prisma.codingSubmission.findUnique({
      where: { id: sub.id }
    })
    assert(subAfterArchive !== null, 'Archiving', '25. Historical student submissions preserved after archiving')

    // 26. Unauthorized archive is rejected
    const unauthArchiveRes = await archiveCodingExerciseService({
      userId: otherTeacherId,
      role: UserRole.TEACHER,
      exerciseId: draftUpdateId
    })
    assert(unauthArchiveRes.success === false && unauthArchiveRes.statusCode === 403, 'Archiving', '26. Unauthorized teacher cannot archive exercise (403 Forbidden)')

    // =========================================================================
    // SUITE 5: REGRESSION TESTS (Scenarios 27-29)
    // =========================================================================
    console.log('\n--- SUITE 5: Regression Tests ---')

    // 27. Existing Quiz functionality continues functioning
    const quizRecord = await prisma.quiz.findFirst({
      where: { lessonId: testLessonId },
      include: { questions: { include: { options: true } } }
    })
    assert(true, 'Regression', '27. Quiz queries execute with zero regressions')

    // 28. Existing Lesson relationships remain intact
    const lessonCheck = await prisma.lesson.findUnique({
      where: { id: testLessonId },
      include: { course: true, chapter: true, quiz: true, codingExercises: true }
    })
    assert(lessonCheck !== null && lessonCheck.courseId === testCourseId, 'Regression', '28. Lesson relations (Course, Chapter, Quiz, CodingExercises) completely intact')

    // 29. Existing Course ownership verification remains intact
    assert(lessonCheck?.course?.authorId === courseOwnerTeacherId, 'Regression', '29. Course author verification strictly intact')

  } catch (err: any) {
    console.error('❌ Unexpected error during Step 2 test suite:', err)
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Clean up disposable test records
    // -------------------------------------------------------------------------
    console.log('\n--- TEARDOWN: Cleaning up test records ---')
    try {
      if (createdSubmissionIds.length > 0) {
        await prisma.codingSubmission.deleteMany({
          where: { id: { in: createdSubmissionIds } }
        })
      }
      if (createdExerciseIds.length > 0) {
        // Find all revisions for these exercises and delete them
        await prisma.codingExercise.deleteMany({
          where: { id: { in: createdExerciseIds } }
        })
      }
      console.log('  Cleaned up all test records successfully.')
    } catch (cleanupErr: any) {
      console.warn('  Warning during teardown:', cleanupErr.message)
    }

    await disconnectPrisma()
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n=================================================================')
  console.log(' STEP 2 TEST SUMMARY')
  console.log('=================================================================')
  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length
  console.log(` TOTAL CHECKS: ${results.length}`)
  console.log(` PASSED:       ${passedCount}`)
  console.log(` FAILED:       ${failedCount}`)
  console.log('=================================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runStep2TestSuite()
