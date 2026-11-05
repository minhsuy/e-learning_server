import dotenv from 'dotenv'
dotenv.config()

import { prisma, connectPrisma, disconnectPrisma } from '../src/config/prisma'
import { generateAccessToken } from '../src/middlewares/generateToken'
import { UserRole } from '@prisma/client'

/**
 * TMDEMY — STEP 7F REAL END-TO-END INTEGRATION TEST SUITE
 * 
 * Validates:
 * 1. Teacher Lesson Summary Retrieval & Status
 * 2. Teacher Summary Editing & Markdown Persistence
 * 3. Teacher Ownership & Role Authorization on Summary
 * 4. Anti-Cheat: Teacher Quiz with Answers vs. Student Quiz with Hidden Answers
 * 5. Student Quiz Submission & Authoritative Grading
 * 6. Teacher Coding Exercise Management & Draft/Publish Statuses
 * 7. Student Public Coding Exercise Discovery (Drafts Filtered Out)
 * 8. Student Anti-Cheat: Reference Solution & Hidden Tests Concealed
 * 9. Real E2B Code Execution: Ephemeral Run Code & Graded Submit Code
 * 10. Student Coding Submission History Tracking
 */

const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:3002'

interface TestContext {
  teacher: { id: string; role: string; token: string }
  otherTeacher: { id: string; role: string; token: string }
  student: { id: string; role: string; token: string }
  courseId: string
  chapterId: string
  testLesson: { id: string; title: string }
  quiz?: any
  codingExercise?: any
}

let ctx: TestContext

let passedScenarios = 0
let failedScenarios = 0
const results: { scenario: number; name: string; status: 'PASS' | 'FAIL'; error?: string }[] = []

function recordTest(scenario: number, name: string, status: 'PASS' | 'FAIL', error?: string) {
  if (status === 'PASS') {
    passedScenarios++
    console.log(`  [PASS] Scenario ${scenario}: ${name}`)
  } else {
    failedScenarios++
    console.error(`  [FAIL] Scenario ${scenario}: ${name}`)
    if (error) console.error(`         Reason: ${error}`)
  }
  results.push({ scenario, name, status, error })
}

async function runStep7fE2ESuite() {
  console.log('===================================================================================')
  console.log(' TMDEMY — STEP 7F REAL INTEGRATION TEST SUITE: SUMMARY, QUIZ & CODING')
  console.log('===================================================================================')

  await connectPrisma()

  try {
    // -------------------------------------------------------------
    // PHASE 1: SERVICE CONNECTIVITY & HEALTH CHECKS
    // -------------------------------------------------------------
    console.log('\n--- PHASE 1: Service Health Checks ---')

    const healthRes = await fetch(`${BACKEND_URL}/api/categories`, { method: 'GET' })
    if (healthRes.status === 200) {
      console.log(`  ✓ Node.js Express Backend is ONLINE at ${BACKEND_URL}`)
    } else {
      throw new Error(`Node.js Express Backend returned unexpected status ${healthRes.status}`)
    }

    // -------------------------------------------------------------
    // PHASE 2: TEST FIXTURES PREPARATION
    // -------------------------------------------------------------
    console.log('\n--- PHASE 2: Test Fixtures & Tokens Preparation ---')

    const courseWithTeacher = await prisma.course.findFirst({
      where: {
        isDestroyed: false,
        chapters: { some: {} }
      },
      include: {
        chapters: {
          include: { lessons: true }
        }
      }
    })

    if (!courseWithTeacher || !courseWithTeacher.authorId) {
      throw new Error('No course with authorId found in database')
    }

    const teacherUser = await prisma.user.findUnique({
      where: { id: courseWithTeacher.authorId }
    })
    if (!teacherUser) throw new Error('Teacher user not found')

    const studentUser = await prisma.user.findFirst({
      where: { role: UserRole.USER }
    })
    if (!studentUser) throw new Error('Student user not found')

    const otherTeacherUser = await prisma.user.findFirst({
      where: {
        role: UserRole.TEACHER,
        id: { not: teacherUser.id }
      }
    })
    if (!otherTeacherUser) throw new Error('Secondary teacher user not found')

    const teacherToken = generateAccessToken({ userId: teacherUser.id, role: 'teacher' })
    const otherTeacherToken = generateAccessToken({ userId: otherTeacherUser.id, role: 'teacher' })
    const studentToken = generateAccessToken({ userId: studentUser.id, role: 'user' })

    // Ensure student is enrolled in course
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentUser.id,
        courseId: courseWithTeacher.id
      }
    })
    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          userId: studentUser.id,
          courseId: courseWithTeacher.id
        }
      })
    }

    const chapter = courseWithTeacher.chapters[0]
    if (!chapter) throw new Error('Course has no chapters')

    const randomSuffix = Date.now()
    const testLesson = await prisma.lesson.create({
      data: {
        chapterId: chapter.id,
        courseId: courseWithTeacher.id,
        authorId: teacherUser.id,
        title: `[STEP 7F TEST] Integration Lesson ${randomSuffix}`,
        slug: `step-7f-test-lesson-${randomSuffix}`,
        order: 99,
        videoStatus: 'READY',
        duration: 300,
        content: 'Nội dung bài học kiểm thử tích hợp 7F.',
        transcript: 'Hôm nay chúng ta sẽ tìm hiểu về hàm tính tổng hai số nguyên trong JavaScript. Hàm sum nhận hai tham số a và b, sau đó trả về tổng của chúng.',
        aiProcessingStatus: null
      }
    })

    ctx = {
      teacher: { id: teacherUser.id, role: 'teacher', token: teacherToken },
      otherTeacher: { id: otherTeacherUser.id, role: 'teacher', token: otherTeacherToken },
      student: { id: studentUser.id, role: 'user', token: studentToken },
      courseId: courseWithTeacher.id,
      chapterId: chapter.id,
      testLesson: { id: testLesson.id, title: testLesson.title }
    }

    console.log(`  ✓ Test Context initialized: Lesson ID = ${testLesson.id}`)

    // -------------------------------------------------------------
    // PHASE 3: TEACHER LESSON SUMMARY MANAGEMENT
    // -------------------------------------------------------------
    console.log('\n--- PHASE 3: Teacher Lesson Summary Integration ---')

    // Scenario 1: Retrieve Summary when empty
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-content`, {
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const data = await res.json()
      if (res.status === 200 && data.success && data.data.summary === null) {
        recordTest(1, 'Teacher retrieves AI content when summary is empty', 'PASS')
      } else {
        recordTest(1, 'Teacher retrieves AI content when summary is empty', 'FAIL', `Status: ${res.status}, summary: ${data.data?.summary}`)
      }
    } catch (err: any) {
      recordTest(1, 'Teacher retrieves AI content when summary is empty', 'FAIL', err.message)
    }

    // Scenario 2: Teacher saves edited Markdown Summary
    const testMarkdown = `## Tóm tắt bài học: Tính tổng hai số
Bài học hướng dẫn cách viết hàm tính tổng hai số nguyên trong JavaScript.

### Các điểm chính:
- Sử dụng toán tử cộng \`+\`
- Xử lý tham số đầu vào \`a\` và \`b\`

\`\`\`javascript
function sum(a, b) {
  return a + b;
}
\`\`\`
`
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.teacher.token}`
        },
        body: JSON.stringify({ summary: testMarkdown, aiProcessingStatus: 'COMPLETED' })
      })
      const data = await res.json()
      if (res.status === 200 && data.success && data.data.summary === testMarkdown) {
        recordTest(2, 'Teacher saves and persists Markdown summary', 'PASS')
      } else {
        recordTest(2, 'Teacher saves and persists Markdown summary', 'FAIL', `Status: ${res.status}, message: ${data.message}`)
      }
    } catch (err: any) {
      recordTest(2, 'Teacher saves and persists Markdown summary', 'FAIL', err.message)
    }

    // Scenario 3: Verify persisted summary in database and retrieval
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-content`, {
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const data = await res.json()
      if (res.status === 200 && data.data.summary === testMarkdown && data.data.aiProcessingStatus === 'COMPLETED') {
        recordTest(3, 'Persisted Markdown summary retrieved accurately', 'PASS')
      } else {
        recordTest(3, 'Persisted Markdown summary retrieved accurately', 'FAIL', `Data mismatch: ${JSON.stringify(data)}`)
      }
    } catch (err: any) {
      recordTest(3, 'Persisted Markdown summary retrieved accurately', 'FAIL', err.message)
    }

    // Scenario 4: Authorization check - unauthorized teacher cannot edit summary
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.otherTeacher.token}`
        },
        body: JSON.stringify({ summary: 'Hacked Summary' })
      })
      if (res.status === 403) {
        recordTest(4, 'Unauthorized teacher is forbidden from updating summary (403)', 'PASS')
      } else {
        recordTest(4, 'Unauthorized teacher is forbidden from updating summary (403)', 'FAIL', `Expected 403, got ${res.status}`)
      }
    } catch (err: any) {
      recordTest(4, 'Unauthorized teacher is forbidden from updating summary (403)', 'FAIL', err.message)
    }

    // Scenario 5: Student fetches lesson summary
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}`, {
        headers: { Authorization: `Bearer ${ctx.student.token}` }
      })
      const data = await res.json()
      if (res.status === 200 && data.data && data.data.summary === testMarkdown) {
        recordTest(5, 'Student fetches persisted lesson summary for classroom tab', 'PASS')
      } else {
        recordTest(5, 'Student fetches persisted lesson summary for classroom tab', 'FAIL', `Status: ${res.status}, summary: ${data.data?.summary}`)
      }
    } catch (err: any) {
      recordTest(5, 'Student fetches persisted lesson summary for classroom tab', 'FAIL', err.message)
    }

    // -------------------------------------------------------------
    // PHASE 4: TEACHER QUIZ INTEGRATION & ANTI-CHEAT ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- PHASE 4: Quiz Integration & Anti-Cheat Validation ---')

    // Create a real persisted Quiz for the test lesson
    const createdQuiz = await prisma.quiz.create({
      data: {
        title: `Bài kiểm tra trắc nghiệm: ${ctx.testLesson.title}`,
        description: 'Kiểm tra kiến thức hàm sum',
        duration: 15,
        passingGrade: 70,
        lesson: { connect: { id: ctx.testLesson.id } },
        course: { connect: { id: ctx.courseId } },
        createdBy: { connect: { id: ctx.teacher.id } },
        questions: {
          create: [
            {
              title: 'Toán tử nào được dùng để cộng hai số trong JavaScript?',
              type: 'MULTIPLE_CHOICE',
              answer: '+',
              points: 1,
              options: {
                create: [
                  { optionText: '+', order: 0 },
                  { optionText: '-', order: 1 },
                  { optionText: '*', order: 2 },
                  { optionText: '/', order: 3 }
                ]
              }
            },
            {
              title: 'Kết quả của sum(2, 3) là gì?',
              type: 'MULTIPLE_CHOICE',
              answer: '5',
              points: 1,
              options: {
                create: [
                  { optionText: '4', order: 0 },
                  { optionText: '5', order: 1 },
                  { optionText: '6', order: 2 },
                  { optionText: 'undefined', order: 3 }
                ]
              }
            }
          ]
        }
      },
      include: {
        questions: {
          include: { options: true }
        }
      }
    })
    ctx.quiz = createdQuiz

    // Scenario 6: Teacher views Quiz with questions AND correct answers for editing
    try {
      const res = await fetch(`${BACKEND_URL}/api/quiz/lesson/${ctx.testLesson.id}`, {
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const data = await res.json()
      const returnedQuiz = data.data?.[0]
      const questions = returnedQuiz?.questions || []
      const hasAnswers = questions.length === 2 && questions.every((q: any) => typeof q.answer === 'string' && q.answer.length > 0)
      if (res.status === 200 && returnedQuiz && hasAnswers) {
        recordTest(6, 'Teacher retrieves Quiz with correct answers for management', 'PASS')
      } else {
        recordTest(6, 'Teacher retrieves Quiz with correct answers for management', 'FAIL', `Expected answers in questions, got: ${JSON.stringify(questions)}`)
      }
    } catch (err: any) {
      recordTest(6, 'Teacher retrieves Quiz with correct answers for management', 'FAIL', err.message)
    }

    // Scenario 7: Anti-Cheat - Student views Quiz strictly WITHOUT answer field
    try {
      const res = await fetch(`${BACKEND_URL}/api/quiz/lesson/${ctx.testLesson.id}`, {
        headers: { Authorization: `Bearer ${ctx.student.token}` }
      })
      const data = await res.json()
      const returnedQuiz = data.data?.[0]
      const questions = returnedQuiz?.questions || []
      const allAnswersOmitted = questions.length === 2 && questions.every((q: any) => q.answer === undefined)
      if (res.status === 200 && returnedQuiz && allAnswersOmitted) {
        recordTest(7, 'Anti-Cheat: Student views Quiz with answer keys strictly omitted', 'PASS')
      } else {
        recordTest(7, 'Anti-Cheat: Student views Quiz with answer keys strictly omitted', 'FAIL', `Answer was leaked to student: ${JSON.stringify(questions)}`)
      }
    } catch (err: any) {
      recordTest(7, 'Anti-Cheat: Student views Quiz with answer keys strictly omitted', 'FAIL', err.message)
    }

    // Scenario 8: Student submits Quiz and receives backend authoritative grade
    try {
      const q1 = ctx.quiz.questions.find((q: any) => q.answer === '+')
      const q2 = ctx.quiz.questions.find((q: any) => q.answer === '5')
      const res = await fetch(`${BACKEND_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.student.token}`
        },
        body: JSON.stringify({
          quizId: ctx.quiz.id,
          answers: [
            { question: q1.id, selectedAnswer: '+' }, // correct
            { question: q2.id, selectedAnswer: '5' }  // correct
          ]
        })
      })
      const data = await res.json()
      const isHundred = data.data?.percentage === 100 || data.data?.submission?.percentage === 100
      if ((res.status === 200 || res.status === 201) && data.success && isHundred) {
        recordTest(8, 'Student submits Quiz, gets 100% score graded authoritatively by backend', 'PASS')
      } else {
        recordTest(8, 'Student submits Quiz, gets 100% score graded authoritatively by backend', 'FAIL', `Status: ${res.status}, response: ${JSON.stringify(data)}`)
      }
    } catch (err: any) {
      recordTest(8, 'Student submits Quiz, gets 100% score graded authoritatively by backend', 'FAIL', err.message)
    }

    // -------------------------------------------------------------
    // PHASE 5: CODING EXERCISE MANAGEMENT & SANDBOX EXECUTION
    // -------------------------------------------------------------
    console.log('\n--- PHASE 5: Coding Exercise Management & Execution ---')

    // Create a real Coding Exercise with a published revision
    const createdExercise = await prisma.codingExercise.create({
      data: {
        lessonId: ctx.testLesson.id,
        courseId: ctx.courseId,
        createdById: ctx.teacher.id,
        title: 'Tính tổng hai số JavaScript',
        slug: `tinh-tong-hai-so-js-${randomSuffix}`,
        description: 'Viết hàm solution(a, b) nhận vào hai số nguyên a và b, trả về tổng của chúng.',
        difficulty: 'EASY',
        programmingLanguage: 'javascript',
        status: 'PUBLISHED',
        starterCode: 'function solution(a, b) {\n  return 0;\n}',
        referenceSolution: 'function solution(a, b) {\n  return a + b;\n}',
        executionContract: {
          functionName: 'solution',
          parameters: [
            { name: 'a', type: 'number' },
            { name: 'b', type: 'number' }
          ],
          returnType: 'number'
        },
        timeLimit: 2000,
        memoryLimit: 128000,
        order: 1,
        revisions: {
          create: [
            {
              version: 1,
              title: 'Tính tổng hai số JavaScript v1',
              description: 'Viết hàm solution(a, b) nhận vào hai số nguyên a và b, trả về tổng của chúng.',
              isPublished: true,
              createdById: ctx.teacher.id,
              starterCode: 'function solution(a, b) {\n  return 0;\n}',
              referenceSolution: 'function solution(a, b) {\n  return a + b;\n}',
              executionContract: {
                functionName: 'solution',
                parameters: [
                  { name: 'a', type: 'number' },
                  { name: 'b', type: 'number' }
                ],
                returnType: 'number'
              },
              timeLimit: 2000,
              memoryLimit: 128000,
              testCases: {
                create: [
                  {
                    isHidden: false,
                    order: 1,
                    weight: 1,
                    input: [2, 3],
                    expectedOutput: 5,
                    explanation: '2 + 3 = 5'
                  },
                  {
                    isHidden: false,
                    order: 2,
                    weight: 1,
                    input: [-1, 5],
                    expectedOutput: 4,
                    explanation: '-1 + 5 = 4'
                  },
                  {
                    isHidden: true, // Hidden test case!
                    order: 3,
                    weight: 1,
                    input: [100, 200],
                    expectedOutput: 300,
                    explanation: 'Hidden test 1'
                  }
                ]
              }
            }
          ]
        }
      },
      include: {
        revisions: {
          include: { testCases: true }
        }
      }
    })
    ctx.codingExercise = createdExercise

    // Scenario 9: Teacher views Coding Exercises for lesson (shows PUBLISHED status)
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/lesson/${ctx.testLesson.id}`, {
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const data = await res.json()
      if (res.status === 200 && data.success && Array.isArray(data.data) && data.data.length > 0) {
        const ex = data.data.find((e: any) => e.id === ctx.codingExercise.id)
        if (ex && ex.status === 'PUBLISHED') {
          recordTest(9, 'Teacher views coding exercises list with published status', 'PASS')
        } else {
          recordTest(9, 'Teacher views coding exercises list with published status', 'FAIL', `Exercise not found or wrong status: ${JSON.stringify(ex)}`)
        }
      } else {
        recordTest(9, 'Teacher views coding exercises list with published status', 'FAIL', `Status: ${res.status}`)
      }
    } catch (err: any) {
      recordTest(9, 'Teacher views coding exercises list with published status', 'FAIL', err.message)
    }

    // Scenario 10: Student views published Coding Exercises
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/lesson/${ctx.testLesson.id}/public`, {
        headers: { Authorization: `Bearer ${ctx.student.token}` }
      })
      const data = await res.json()
      if (res.status === 200 && data.success && Array.isArray(data.data) && data.data.length > 0) {
        recordTest(10, 'Student views published coding exercises list', 'PASS')
      } else {
        recordTest(10, 'Student views published coding exercises list', 'FAIL', `Status: ${res.status}`)
      }
    } catch (err: any) {
      recordTest(10, 'Student views published coding exercises list', 'FAIL', err.message)
    }

    // Scenario 11: Anti-Cheat - Student views exercise detail without reference solution or hidden tests
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${ctx.codingExercise.id}`, {
        headers: { Authorization: `Bearer ${ctx.student.token}` }
      })
      const data = await res.json()
      const exDetail = data.data
      const hasReferenceSolution = exDetail?.referenceSolution !== undefined
      const hasHiddenTests = exDetail?.testCases?.some((tc: any) => tc.isPublic === false)
      const testCasesCount = exDetail?.testCases?.length

      if (res.status === 200 && !hasReferenceSolution && !hasHiddenTests && testCasesCount === 2) {
        recordTest(11, 'Anti-Cheat: Reference solution and hidden tests strictly hidden from student', 'PASS')
      } else {
        recordTest(11, 'Anti-Cheat: Reference solution and hidden tests strictly hidden from student', 'FAIL', `RefSolution: ${hasReferenceSolution}, hiddenTests: ${hasHiddenTests}, count: ${testCasesCount}`)
      }
    } catch (err: any) {
      recordTest(11, 'Anti-Cheat: Reference solution and hidden tests strictly hidden from student', 'FAIL', err.message)
    }

    // Scenario 12: Student Practice Run Code (Ephemeral execution against public test cases)
    try {
      const studentCorrectCode = 'function solution(a, b) {\n  return a + b;\n}'
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${ctx.codingExercise.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.student.token}`
        },
        body: JSON.stringify({ sourceCode: studentCorrectCode })
      })
      const data = await res.json()
      if (res.status === 200 && data.success && data.data.passedTests === 2 && data.data.totalTests === 2) {
        recordTest(12, 'Student runs code in E2B sandbox against public tests (2/2 passed)', 'PASS')
      } else {
        recordTest(12, 'Student runs code in E2B sandbox against public tests (2/2 passed)', 'FAIL', `Status: ${res.status}, response: ${JSON.stringify(data)}`)
      }
    } catch (err: any) {
      recordTest(12, 'Student runs code in E2B sandbox against public tests (2/2 passed)', 'FAIL', err.message)
    }

    // Scenario 13: Student Submits Code for Official Grading (Evaluates all 3 tests including hidden test)
    try {
      const studentCorrectCode = 'function solution(a, b) {\n  return a + b;\n}'
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${ctx.codingExercise.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.student.token}`
        },
        body: JSON.stringify({ sourceCode: studentCorrectCode })
      })
      const data = await res.json()
      if (res.status === 200 && data.success && data.data.score === 100 && data.data.status === 'ACCEPTED') {
        recordTest(13, 'Student submits code, graded ACCEPTED with 100% score via E2B sandbox', 'PASS')
      } else {
        recordTest(13, 'Student submits code, graded ACCEPTED with 100% score via E2B sandbox', 'FAIL', `Status: ${res.status}, response: ${JSON.stringify(data)}`)
      }
    } catch (err: any) {
      recordTest(13, 'Student submits code, graded ACCEPTED with 100% score via E2B sandbox', 'FAIL', err.message)
    }

    // Scenario 14: Student Views Submission History
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${ctx.codingExercise.id}/submissions`, {
        headers: { Authorization: `Bearer ${ctx.student.token}` }
      })
      const data = await res.json()
      const submissions = Array.isArray(data.data) ? data.data : data.data?.items
      if (res.status === 200 && Array.isArray(submissions) && submissions.length > 0) {
        const latest = submissions[0]
        if (latest.status === 'ACCEPTED' && latest.score === 100) {
          recordTest(14, 'Student views submission history showing recent ACCEPTED score', 'PASS')
        } else {
          recordTest(14, 'Student views submission history showing recent ACCEPTED score', 'FAIL', `Latest submission mismatch: ${JSON.stringify(latest)}`)
        }
      } else {
        recordTest(14, 'Student views submission history showing recent ACCEPTED score', 'FAIL', `Status: ${res.status}, data: ${JSON.stringify(data)}`)
      }
    } catch (err: any) {
      recordTest(14, 'Student views submission history showing recent ACCEPTED score', 'FAIL', err.message)
    }

  } finally {
    // -------------------------------------------------------------
    // PHASE 6: CLEANUP TEST FIXTURES
    // -------------------------------------------------------------
    console.log('\n--- PHASE 6: Cleaning Up Test Fixtures ---')
    try {
      if (ctx?.codingExercise?.id) {
        await prisma.codingExerciseCompletion.deleteMany({ where: { exerciseId: ctx.codingExercise.id } })
        await prisma.codingTestResult.deleteMany({ where: { submission: { exerciseId: ctx.codingExercise.id } } })
        await prisma.codingSubmission.deleteMany({ where: { exerciseId: ctx.codingExercise.id } })
        await prisma.codingTestCase.deleteMany({ where: { revision: { exerciseId: ctx.codingExercise.id } } })
        await prisma.codingExerciseRevision.deleteMany({ where: { exerciseId: ctx.codingExercise.id } })
        await prisma.codingExercise.delete({ where: { id: ctx.codingExercise.id } })
      }
      if (ctx?.quiz?.id) {
        await prisma.quizSubmissionAnswer.deleteMany({ where: { submission: { quizId: ctx.quiz.id } } })
        await prisma.quizSubmission.deleteMany({ where: { quizId: ctx.quiz.id } })
        await prisma.questionOption.deleteMany({ where: { question: { quizId: ctx.quiz.id } } })
        await prisma.question.deleteMany({ where: { quizId: ctx.quiz.id } })
        await prisma.quiz.delete({ where: { id: ctx.quiz.id } })
      }
      if (ctx?.testLesson?.id) {
        await prisma.lesson.delete({ where: { id: ctx.testLesson.id } })
      }
      console.log('  ✓ Test fixtures cleaned up successfully.')
    } catch (cleanupErr: any) {
      console.warn('  ⚠️ Fixture cleanup warning:', cleanupErr.message)
    }

    await disconnectPrisma()
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===================================================================================')
  console.log(` STEP 7F INTEGRATION TEST SUMMARY: ${passedScenarios}/${results.length} PASSED`)
  console.log('===================================================================================')
  if (failedScenarios > 0) {
    console.error(`❌ ${failedScenarios} scenarios FAILED.`)
    process.exit(1)
  } else {
    console.log('🎉 ALL STEP 7F INTEGRATION TEST SCENARIOS PASSED WITH 100% SUCCESS!')
    process.exit(0)
  }
}

void runStep7fE2ESuite()
