import { prisma, connectPrisma, disconnectPrisma } from '../src/config/prisma'
import {
  ExerciseDifficulty,
  ExerciseStatus,
  ExerciseSource,
  SubmissionStatus,
  TestCaseStatus
} from '@prisma/client'

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

async function runStep1Verification() {
  console.log('\n=================================================================')
  console.log(' STEP 1: CODING EXERCISE DATABASE & IMMUTABLE REVISION VERIFICATION')
  console.log('=================================================================\n')

  await connectPrisma()

  // Track created disposable IDs for clean teardown
  const createdTestResultIds: string[] = []
  const createdSubmissionIds: string[] = []
  const createdTestCaseIds: string[] = []
  const createdRevisionIds: string[] = []
  const createdExerciseIds: string[] = []

  try {
    // -------------------------------------------------------------------------
    // SETUP: Locate existing Teacher/User, Course, and Lesson fixtures
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Inspecting Existing DB Fixtures ---')
    const existingLesson = await prisma.lesson.findFirst({
      include: { course: true, author: true, quiz: true }
    })

    if (!existingLesson) {
      console.warn('⚠️ No existing Lesson found in database. Skipping live fixture tests.')
      return
    }

    const testLessonId = existingLesson.id
    const testCourseId = existingLesson.courseId
    const testAuthorId = existingLesson.authorId

    const studentUser = await prisma.user.findFirst({
      where: { role: 'USER' }
    }) || existingLesson.author

    const testStudentId = studentUser.id

    console.log(`  Using Lesson: ${testLessonId} (Course: ${testCourseId}, Author: ${testAuthorId})`)
    console.log(`  Using Student: ${testStudentId}`)

    // -------------------------------------------------------------------------
    // TEST 1: Create a CodingExercise linked to an existing Lesson
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Create CodingExercise with Revision v1 ---')
    const uniqueSlug1 = `test-two-sum-${Date.now()}`
    const exercise1 = await prisma.codingExercise.create({
      data: {
        lessonId: testLessonId,
        courseId: testCourseId,
        title: 'Two Sum Problem',
        slug: uniqueSlug1,
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        programmingLanguage: 'javascript',
        difficulty: ExerciseDifficulty.EASY,
        starterCode: 'function twoSum(nums, target) {\n  // TODO\n}',
        referenceSolution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
        executionContract: {
          functionName: 'twoSum',
          parameters: [
            { name: 'nums', type: 'number[]' },
            { name: 'target', type: 'number' }
          ],
          returnType: 'number[]'
        },
        timeLimit: 2000,
        memoryLimit: 128000,
        status: ExerciseStatus.DRAFT,
        source: ExerciseSource.MANUAL,
        order: 1,
        createdById: testAuthorId
      }
    })
    createdExerciseIds.push(exercise1.id)

    assert(Boolean(exercise1 && exercise1.id), 'ExerciseCreation', 'Create Exercise in DRAFT', `ID: ${exercise1.id}`)
    assert(exercise1.lessonId === testLessonId, 'ExerciseCreation', 'Linked to correct Lesson')
    assert(exercise1.courseId === testCourseId, 'ExerciseCreation', 'Linked to correct Course')

    // Create Revision v1
    const revision1 = await prisma.codingExerciseRevision.create({
      data: {
        exerciseId: exercise1.id,
        version: 1,
        title: exercise1.title,
        description: exercise1.description,
        starterCode: exercise1.starterCode,
        referenceSolution: exercise1.referenceSolution,
        executionContract: exercise1.executionContract as any,
        timeLimit: exercise1.timeLimit,
        memoryLimit: exercise1.memoryLimit,
        isPublished: true,
        createdById: testAuthorId
      }
    })
    createdRevisionIds.push(revision1.id)
    assert(revision1.version === 1 && revision1.isPublished === true, 'ExerciseCreation', 'Create Revision v1 (Published)')

    // -------------------------------------------------------------------------
    // TEST 2: Create multiple test cases under Revision v1
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Create Test Cases (Public + Hidden) ---')
    const testCase1 = await prisma.codingTestCase.create({
      data: {
        revisionId: revision1.id,
        input: [[2, 7, 11, 15], 9],
        expectedOutput: [0, 1],
        isHidden: false,
        order: 1,
        weight: 30,
        explanation: 'Basic example: 2 + 7 = 9'
      }
    })
    createdTestCaseIds.push(testCase1.id)

    const testCase2 = await prisma.codingTestCase.create({
      data: {
        revisionId: revision1.id,
        input: [[3, 2, 4], 6],
        expectedOutput: [1, 2],
        isHidden: true,
        order: 2,
        weight: 70,
        explanation: 'Hidden test: indices 1 and 2'
      }
    })
    createdTestCaseIds.push(testCase2.id)

    const revisionTestCases = await prisma.codingTestCase.findMany({
      where: { revisionId: revision1.id },
      orderBy: { order: 'asc' }
    })
    assert(revisionTestCases.length === 2, 'TestCases', 'Revision v1 has 2 test cases')
    assert(revisionTestCases[0].isHidden === false, 'TestCases', 'First test case is public')
    assert(revisionTestCases[1].isHidden === true, 'TestCases', 'Second test case is hidden')

    // -------------------------------------------------------------------------
    // TEST 3: Verify one Lesson can contain multiple exercises (0..N)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Verify 1 Lesson -> Multiple Coding Exercises ---')
    const uniqueSlug2 = `test-palindrome-${Date.now()}`
    const exercise2 = await prisma.codingExercise.create({
      data: {
        lessonId: testLessonId,
        courseId: testCourseId,
        title: 'Valid Palindrome',
        slug: uniqueSlug2,
        description: 'Check if a given string is a palindrome.',
        programmingLanguage: 'javascript',
        difficulty: ExerciseDifficulty.EASY,
        starterCode: 'function isPalindrome(s) {}',
        referenceSolution: 'function isPalindrome(s) { return s === s.split("").reverse().join(""); }',
        executionContract: {
          functionName: 'isPalindrome',
          parameters: [{ name: 's', type: 'string' }],
          returnType: 'boolean'
        },
        timeLimit: 1500,
        memoryLimit: 64000,
        status: ExerciseStatus.PUBLISHED,
        order: 2,
        createdById: testAuthorId
      }
    })
    createdExerciseIds.push(exercise2.id)

    const lessonExercises = await prisma.codingExercise.findMany({
      where: { lessonId: testLessonId }
    })
    assert(lessonExercises.length >= 2, 'Cardinality', 'Lesson contains >= 2 coding exercises', `Count: ${lessonExercises.length}`)

    // -------------------------------------------------------------------------
    // TEST 4: Verify one User can have multiple submissions for the same exercise
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Multiple Submissions per User per Exercise ---')
    // Attempt 1: Failed
    const submission1 = await prisma.codingSubmission.create({
      data: {
        exerciseId: exercise1.id,
        revisionId: revision1.id,
        userId: testStudentId,
        sourceCode: 'function twoSum(nums, target) { return [0, 0]; }',
        language: 'javascript',
        status: SubmissionStatus.WRONG_ANSWER,
        score: 0,
        maxScore: 100,
        passedTests: 0,
        totalTests: 2,
        executionTime: 12,
        memoryUsage: 8400,
        completedAt: new Date()
      }
    })
    createdSubmissionIds.push(submission1.id)

    // Attempt 2: Passed 100%
    const submission2 = await prisma.codingSubmission.create({
      data: {
        exerciseId: exercise1.id,
        revisionId: revision1.id,
        userId: testStudentId,
        sourceCode: exercise1.referenceSolution,
        language: 'javascript',
        status: SubmissionStatus.ACCEPTED,
        score: 100,
        maxScore: 100,
        passedTests: 2,
        totalTests: 2,
        executionTime: 8,
        memoryUsage: 7800,
        completedAt: new Date()
      }
    })
    createdSubmissionIds.push(submission2.id)

    const userSubmissions = await prisma.codingSubmission.findMany({
      where: { exerciseId: exercise1.id, userId: testStudentId },
      orderBy: { createdAt: 'asc' }
    })
    assert(userSubmissions.length === 2, 'MultipleSubmissions', 'Student has 2 attempts on same exercise without collision')
    assert(userSubmissions[0].status === SubmissionStatus.WRONG_ANSWER, 'MultipleSubmissions', 'Attempt 1 is WRONG_ANSWER')
    assert(userSubmissions[1].status === SubmissionStatus.ACCEPTED, 'MultipleSubmissions', 'Attempt 2 is ACCEPTED')

    // -------------------------------------------------------------------------
    // TEST 5: Verify Submission Results reference test cases & revision correctly
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: CodingTestResult evaluation mapping ---')
    const result1 = await prisma.codingTestResult.create({
      data: {
        submissionId: submission2.id,
        testCaseId: testCase1.id,
        status: TestCaseStatus.PASSED,
        actualOutput: [0, 1],
        executionTime: 3,
        memoryUsage: 2100,
        stdout: ''
      }
    })
    createdTestResultIds.push(result1.id)

    const result2 = await prisma.codingTestResult.create({
      data: {
        submissionId: submission2.id,
        testCaseId: testCase2.id,
        status: TestCaseStatus.PASSED,
        actualOutput: [1, 2],
        executionTime: 5,
        memoryUsage: 2200,
        stdout: ''
      }
    })
    createdTestResultIds.push(result2.id)

    const detailedSubmission = await prisma.codingSubmission.findUnique({
      where: { id: submission2.id },
      include: {
        revision: true,
        results: { include: { testCase: true } }
      }
    })
    assert(detailedSubmission !== null, 'SubmissionResults', 'Found submission with results')
    assert(detailedSubmission?.revision.version === 1, 'SubmissionResults', 'Submission references Revision v1')
    assert(detailedSubmission?.results.length === 2, 'SubmissionResults', 'Submission contains 2 test results linked to test cases')

    // -------------------------------------------------------------------------
    // TEST 6: Immutable Revisioning: Teacher edits exercise -> Revision v2 created
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Immutable Revision v2 creation & Historical Protection ---')
    // Teacher updates the exercise metadata and creates Revision v2 with altered test cases
    const revision2 = await prisma.codingExerciseRevision.create({
      data: {
        exerciseId: exercise1.id,
        version: 2,
        title: 'Two Sum Problem (Revised)',
        description: 'Updated problem description with additional constraints.',
        starterCode: exercise1.starterCode,
        referenceSolution: exercise1.referenceSolution,
        executionContract: exercise1.executionContract as any,
        timeLimit: 1000, // stricter time limit in v2
        memoryLimit: 64000,
        isPublished: true,
        createdById: testAuthorId
      }
    })
    createdRevisionIds.push(revision2.id)

    const testCaseV2_1 = await prisma.codingTestCase.create({
      data: {
        revisionId: revision2.id,
        input: [[1, 2, 3, 4], 7],
        expectedOutput: [2, 3],
        isHidden: false,
        order: 1,
        weight: 50
      }
    })
    createdTestCaseIds.push(testCaseV2_1.id)

    // Check historical submission from earlier: MUST still point to Revision v1 and its test cases!
    const historicalSubmission = await prisma.codingSubmission.findUnique({
      where: { id: submission2.id },
      include: {
        revision: { include: { testCases: true } },
        results: true
      }
    })
    assert(historicalSubmission?.revision.version === 1, 'ImmutableVersioning', 'Historical submission STILL points to Revision v1')
    assert(historicalSubmission?.revision.title === 'Two Sum Problem', 'ImmutableVersioning', 'Historical revision title unchanged')
    assert(historicalSubmission?.revision.testCases.length === 2, 'ImmutableVersioning', 'Historical test cases for v1 unchanged')

    // -------------------------------------------------------------------------
    // TEST 7: Archiving & Foreign Key Restrict on Deletion with Submissions
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Archiving & Deletion Restrict Protection ---')
    // 7.1 Soft delete via ARCHIVED
    const archivedEx = await prisma.codingExercise.update({
      where: { id: exercise1.id },
      data: { status: ExerciseStatus.ARCHIVED }
    })
    assert(archivedEx.status === ExerciseStatus.ARCHIVED, 'HistoricalPreservation', 'Exercise successfully archived')

    // 7.2 Attempting hard delete on exercise with submissions MUST fail due to onDelete: Restrict
    let deleteFailedAsExpected = false
    try {
      await prisma.codingExercise.delete({
        where: { id: exercise1.id }
      })
    } catch (err: any) {
      deleteFailedAsExpected = true
      console.log('  Confirmed: Hard delete blocked by PostgreSQL foreign key constraint (onDelete: Restrict)')
    }
    assert(deleteFailedAsExpected, 'HistoricalPreservation', 'onDelete: Restrict protects exercise from hard deletion when submissions exist')

    // -------------------------------------------------------------------------
    // TEST 8: Unique Constraints Validation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Unique Constraints Validation ---')
    // 8.1 Duplicate slug in same lesson must fail
    let duplicateSlugFailed = false
    try {
      await prisma.codingExercise.create({
        data: {
          lessonId: testLessonId,
          courseId: testCourseId,
          title: 'Duplicate Slug Test',
          slug: uniqueSlug1, // same slug as exercise1
          description: 'test',
          executionContract: {},
          createdById: testAuthorId
        }
      })
    } catch (err) {
      duplicateSlugFailed = true
    }
    assert(duplicateSlugFailed, 'Constraints', 'Unique constraint [lessonId, slug] enforced')

    // 8.2 Duplicate version in same exercise must fail
    let duplicateVersionFailed = false
    try {
      await prisma.codingExerciseRevision.create({
        data: {
          exerciseId: exercise1.id,
          version: 1, // already exists
          title: 'Duplicate Version',
          description: 'test',
          starterCode: '',
          referenceSolution: '',
          executionContract: {}
        }
      })
    } catch (err) {
      duplicateVersionFailed = true
    }
    assert(duplicateVersionFailed, 'Constraints', 'Unique constraint [exerciseId, version] enforced')

    // -------------------------------------------------------------------------
    // TEST 9: Existing Quiz Relations Intact
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Existing Quiz Functionality Check ---')
    const lessonWithQuizAndExercises = await prisma.lesson.findUnique({
      where: { id: testLessonId },
      include: {
        quiz: true,
        codingExercises: true
      }
    })
    assert(lessonWithQuizAndExercises !== null, 'QuizCompatibility', 'Lesson query with quiz & codingExercises succeeds')
    console.log(`  Lesson has quiz: ${lessonWithQuizAndExercises?.quiz ? 'YES' : 'NO'}`)
    console.log(`  Lesson has coding exercises: ${lessonWithQuizAndExercises?.codingExercises.length}`)

  } catch (err: any) {
    console.error('❌ Unexpected error during Step 1 verification:', err)
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Safely clean up all disposable test records
    // -------------------------------------------------------------------------
    console.log('\n--- TEARDOWN: Cleaning up disposable records ---')
    try {
      if (createdTestResultIds.length > 0) {
        await prisma.codingTestResult.deleteMany({
          where: { id: { in: createdTestResultIds } }
        })
      }
      if (createdSubmissionIds.length > 0) {
        await prisma.codingSubmission.deleteMany({
          where: { id: { in: createdSubmissionIds } }
        })
      }
      if (createdTestCaseIds.length > 0) {
        await prisma.codingTestCase.deleteMany({
          where: { id: { in: createdTestCaseIds } }
        })
      }
      // Clean up exercise 2 (has no submissions)
      if (createdExerciseIds.length > 0) {
        await prisma.codingExercise.deleteMany({
          where: { id: { in: createdExerciseIds } }
        })
      }
      console.log('  Cleaned up all disposable test records successfully.')
    } catch (cleanupErr: any) {
      console.warn('  Warning during teardown cleanup:', cleanupErr.message)
    }

    await disconnectPrisma()
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n=================================================================')
  console.log(' STEP 1 VERIFICATION SUMMARY')
  console.log('=================================================================')
  const passedCount = results.filter(r => r.passed).length
  const failedCount = results.filter(r => !r.passed).length
  console.log(` TOTAL CHECKS: ${results.length}`)
  console.log(` PASSED:       ${passedCount}`)
  console.log(` FAILED:       ${failedCount}`)
  console.log('=================================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runStep1Verification()
