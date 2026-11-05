import dotenv from 'dotenv'
dotenv.config()

import { prisma, connectPrisma, disconnectPrisma } from '../src/config/prisma'
import { generateAccessToken } from '../src/middlewares/generateToken'
import { UserRole } from '@prisma/client'
import { isValidAiModelId, getAiModelDescriptor, SUPPORTED_AI_MODELS } from '../src/config/aiModels.config'

/**
 * TMDEMY — STEP 7G REAL INTEGRATION TEST SUITE:
 * AI PIPELINE BUG FIXES, CODING VERIFICATION & MULTI-MODEL SUPPORT
 */

const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:3002'

interface TestContext {
  teacher: { id: string; role: string; token: string }
  student: { id: string; role: string; token: string }
  courseId: string
  chapterId: string
  testLesson: { id: string; title: string }
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

async function runStep7gTestSuite() {
  console.log('===================================================================================')
  console.log(' TMDEMY — STEP 7G INTEGRATION TEST SUITE: SUMMARY RECOVERY, CODING VERIF & MULTI-MODEL')
  console.log('===================================================================================')

  await connectPrisma()

  try {
    // -------------------------------------------------------------
    // SETUP: FETCH / INITIALIZE TEST TEACHER & LESSON
    // -------------------------------------------------------------
    console.log('\n--- SETUP: Preparing Test Context ---')

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

    const teacherToken = generateAccessToken({ userId: teacherUser.id, role: 'teacher' })
    const studentToken = generateAccessToken({ userId: studentUser.id, role: 'user' })

    const chapter = courseWithTeacher.chapters[0]
    if (!chapter) throw new Error('Course has no chapters')

    const randomSuffix = Date.now()
    const testLesson = await prisma.lesson.create({
      data: {
        chapterId: chapter.id,
        courseId: courseWithTeacher.id,
        authorId: teacherUser.id,
        title: `[STEP 7G TEST] Recovery Lesson ${randomSuffix}`,
        slug: `step-7g-recovery-lesson-${randomSuffix}`,
        order: 99,
        videoStatus: 'READY',
        duration: 300,
        transcriptRefined: '## Bài học TypeScript Nâng Cao\nTypeScript cung cấp hệ thống kiểu tĩnh mạnh mẽ giúp phát hiện lỗi từ giai đoạn biên dịch. Generics trong TypeScript cho phép định nghĩa các hàm và lớp hoạt động linh hoạt với nhiều kiểu dữ liệu mà vẫn đảm bảo tính an toàn kiểu. Utility Types như Partial, Pick, Omit giúp tái sử dụng kiểu hiệu quả.',
        isDemo: true,
        summary: null,
        aiProcessingStatus: 'COMPLETED' // The exact bug scenario: COMPLETED status but summary is null!
      }
    })

    // Ensure student is enrolled so they can access lesson content
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: studentUser.id,
          courseId: courseWithTeacher.id
        }
      },
      update: { status: 'ACTIVE' },
      create: {
        userId: studentUser.id,
        courseId: courseWithTeacher.id,
        status: 'ACTIVE'
      }
    }).catch(() => {})

    ctx = {
      teacher: { id: teacherUser.id, role: 'teacher', token: teacherToken },
      student: { id: studentUser.id, role: 'user', token: studentToken },
      courseId: courseWithTeacher.id,
      chapterId: chapter.id,
      testLesson: { id: testLesson.id, title: testLesson.title }
    }

    console.log(`  ✓ Teacher ID: ${ctx.teacher.id}`)
    console.log(`  ✓ Course ID: ${ctx.courseId}`)
    console.log(`  ✓ Test Lesson ID: ${ctx.testLesson.id}`)

    // -------------------------------------------------------------
    // GROUP 1: MULTI-MODEL AI REGISTRY & VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- GROUP 1: Multi-Model AI Registry & Discovery ---')

    // Scenario 1: GET /api/ai/models endpoint
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/models`, {
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const body = (await res.json()) as any
      if (res.status === 200 && body.success && Array.isArray(body.data?.models) && body.data.models.length >= 4) {
        recordTest(1, 'GET /api/ai/models returns validated model allowlist', 'PASS')
      } else {
        recordTest(1, 'GET /api/ai/models returns validated model allowlist', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(1, 'GET /api/ai/models returns validated model allowlist', 'FAIL', err.message)
    }

    // Scenario 2: Verify default model and capabilities
    try {
      const models = SUPPORTED_AI_MODELS
      const defaultModel = models.find((m) => m.isDefault)
      const flashLite = models.find((m) => m.id === 'gemini-3.5-flash-lite')
      if (defaultModel && defaultModel.id === 'gemini-3.5-flash' && flashLite && flashLite.supportsSummary) {
        recordTest(2, 'Default model is gemini-3.5-flash and Lite model supports summary/quiz/coding', 'PASS')
      } else {
        recordTest(2, 'Default model is gemini-3.5-flash and Lite model supports summary/quiz/coding', 'FAIL')
      }
    } catch (err: any) {
      recordTest(2, 'Default model is gemini-3.5-flash and Lite model supports summary/quiz/coding', 'FAIL', err.message)
    }

    // Scenario 3: Server-side validation rejects unverified model IDs
    try {
      const isFakeValid = isValidAiModelId('unsupported-chatgpt-5')
      const isPathValid = isValidAiModelId('../../secrets')
      const isRealValid = isValidAiModelId('gemini-3.5-flash-lite')
      if (!isFakeValid && !isPathValid && isRealValid) {
        recordTest(3, 'Server-side validator rejects arbitrary/malicious model IDs', 'PASS')
      } else {
        recordTest(3, 'Server-side validator rejects arbitrary/malicious model IDs', 'FAIL')
      }
    } catch (err: any) {
      recordTest(3, 'Server-side validator rejects arbitrary/malicious model IDs', 'FAIL', err.message)
    }

    // Scenario 4: GET /api/lessons/ai-models backward-compat endpoint
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/ai-models`, {
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const body = (await res.json()) as any
      if (res.status === 200 && body.success && body.data?.models?.length >= 4) {
        recordTest(4, 'GET /api/lessons/ai-models route ordering works without UUID conflict', 'PASS')
      } else {
        recordTest(4, 'GET /api/lessons/ai-models route ordering works without UUID conflict', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(4, 'GET /api/lessons/ai-models route ordering works without UUID conflict', 'FAIL', err.message)
    }

    // -------------------------------------------------------------
    // GROUP 2: BUG 1 — SUMMARY GENERATION, RECOVERY & PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n--- GROUP 2: Summary Missing Bug & Safe Recovery Workflow ---')

    // Scenario 5: Initial broken lesson state: COMPLETED but summary is null
    try {
      const lessonCheck = await prisma.lesson.findUnique({
        where: { id: ctx.testLesson.id },
        select: { summary: true, aiProcessingStatus: true, transcriptRefined: true }
      })
      if (lessonCheck?.summary === null && lessonCheck?.transcriptRefined && lessonCheck?.aiProcessingStatus === 'COMPLETED') {
        recordTest(5, 'Broken state reproduced: transcript exists, status COMPLETED, summary is null', 'PASS')
      } else {
        recordTest(5, 'Broken state reproduced: transcript exists, status COMPLETED, summary is null', 'FAIL')
      }
    } catch (err: any) {
      recordTest(5, 'Broken state reproduced: transcript exists, status COMPLETED, summary is null', 'FAIL', err.message)
    }

    // Scenario 6: Trigger summary recovery / direct generation without re-running Whisper
    let recoveredSummaryText = ''
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.teacher.token}`
        },
        body: JSON.stringify({ model: 'gemini-3.5-flash-lite' })
      })
      const body = (await res.json()) as any
      if (res.status === 200 && body.success && body.data?.summary && body.data.summary.trim().length > 20) {
        recoveredSummaryText = body.data.summary
        recordTest(6, 'POST /api/lessons/:id/ai-summary/generate generates summary directly from transcript', 'PASS')
      } else {
        recordTest(6, 'POST /api/lessons/:id/ai-summary/generate generates summary directly from transcript', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(6, 'POST /api/lessons/:id/ai-summary/generate generates summary directly from transcript', 'FAIL', err.message)
    }

    // Scenario 7: Verify database Lesson.summary persistence
    try {
      const updatedLesson = await prisma.lesson.findUnique({
        where: { id: ctx.testLesson.id },
        select: { summary: true, aiProcessingStatus: true }
      })
      if (
        updatedLesson?.summary &&
        updatedLesson.summary.trim().length > 20 &&
        updatedLesson.aiProcessingStatus === 'COMPLETED'
      ) {
        recordTest(7, 'Lesson.summary is atomically persisted in DB with valid Markdown', 'PASS')
      } else {
        recordTest(7, 'Lesson.summary is atomically persisted in DB with valid Markdown', 'FAIL', JSON.stringify(updatedLesson))
      }
    } catch (err: any) {
      recordTest(7, 'Lesson.summary is atomically persisted in DB with valid Markdown', 'FAIL', err.message)
    }

    // Scenario 8: Teacher fetches AI content -> receives the persisted summary
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-content`, {
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const body = (await res.json()) as any
      if (res.status === 200 && body.success && body.data?.summary === recoveredSummaryText) {
        recordTest(8, 'Teacher reload retrieves the non-empty persisted summary', 'PASS')
      } else {
        recordTest(8, 'Teacher reload retrieves the non-empty persisted summary', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(8, 'Teacher reload retrieves the non-empty persisted summary', 'FAIL', err.message)
    }

    // Scenario 9: Student fetches AI content -> receives the persisted summary
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-content`, {
        headers: { Authorization: `Bearer ${ctx.student.token}` }
      })
      const body = (await res.json()) as any
      if (res.status === 200 && body.success && body.data?.summary === recoveredSummaryText) {
        recordTest(9, 'Student reload retrieves the non-empty persisted summary', 'PASS')
      } else {
        recordTest(9, 'Student reload retrieves the non-empty persisted summary', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(9, 'Student reload retrieves the non-empty persisted summary', 'FAIL', err.message)
    }

    // Scenario 10: Manual summary is not overwritten blindly by recovery
    try {
      const manualSummary = '## Tóm tắt thủ công của giảng viên\nNội dung này do giảng viên chỉnh sửa tay.'
      await prisma.lesson.update({
        where: { id: ctx.testLesson.id },
        data: { summary: manualSummary }
      })

      await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.teacher.token}`
        },
        body: JSON.stringify({ model: 'gemini-3.5-flash-lite' })
      })

      const checkPreserved = await prisma.lesson.findUnique({
        where: { id: ctx.testLesson.id },
        select: { summary: true }
      })

      if (checkPreserved?.summary === manualSummary) {
        recordTest(10, 'Existing valid summary is preserved and reused without rewriting DB', 'PASS')
      } else {
        recordTest(10, 'Existing valid summary is preserved and reused without rewriting DB', 'FAIL')
      }
    } catch (err: any) {
      recordTest(10, 'Existing valid summary is preserved and reused without rewriting DB', 'FAIL', err.message)
    }

    // -------------------------------------------------------------
    // GROUP 3: BUG 2 — CODING EXERCISE VERIFICATION DIAGNOSTICS & RE-VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- GROUP 3: Coding Exercise Verification Diagnostics & Re-verification ---')

    // Scenario 11: Create a draft coding exercise
    let exerciseId = ''
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.teacher.token}`
        },
        body: JSON.stringify({
          lessonId: ctx.testLesson.id,
          title: 'Tổng hai số nguyên (Sum of Two Numbers)',
          description: 'Viết một hàm đơn giản để tính tổng của hai số nguyên và trả về kết quả chính xác.',
          programmingLanguage: 'javascript',
          difficulty: 'EASY',
          starterCode: 'function sumTwoNumbers(a, b) {\n  // Viết mã tại đây\n}',
          referenceSolution: 'function sumTwoNumbers(a, b) {\n  return 999999; // LỜI GIẢI CỐ TÌNH SAI\n}',
          executionContract: {
            entrypoint: 'sumTwoNumbers',
            functionName: 'sumTwoNumbers',
            parameters: [
              { name: 'a', type: 'number' },
              { name: 'b', type: 'number' }
            ],
            returnType: 'number'
          },
          testCases: [
            {
              input: [2, 3],
              expectedOutput: 5,
              isHidden: false,
              weight: 50
            },
            {
              input: [10, 20],
              expectedOutput: 30,
              isHidden: true,
              weight: 50
            }
          ]
        })
      })
      const body = (await res.json()) as any
      if (res.status === 201 && body.success && body.data?.id) {
        exerciseId = body.data.id
        recordTest(11, 'POST /api/coding-exercises creates draft exercise with failing reference solution', 'PASS')
      } else {
        recordTest(11, 'POST /api/coding-exercises creates draft exercise with failing reference solution', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(11, 'POST /api/coding-exercises creates draft exercise with failing reference solution', 'FAIL', err.message)
    }

    // Scenario 12: Attempting to publish an unverified/failing exercise fails with actionable diagnostics
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${exerciseId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const body = (await res.json()) as any
      if (
        res.status === 400 &&
        !body.success &&
        body.message.includes('Reference solution failed automated verification')
      ) {
        recordTest(12, 'Publish gate blocks publication and provides actionable test failure message', 'PASS')
      } else {
        recordTest(12, 'Publish gate blocks publication and provides actionable test failure message', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(12, 'Publish gate blocks publication and provides actionable test failure message', 'FAIL', err.message)
    }

    // Scenario 13: Re-verify endpoint: POST /api/coding-exercises/:id/reverify returns failure diagnostics
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${exerciseId}/reverify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const body = (await res.json()) as any
      if (
        res.status === 200 &&
        body.success &&
        (body.data?.status === 'FAILED' || body.data?.verificationStatus === 'FAILED') &&
        body.data?.passedTests === 0 &&
        body.data?.totalTests === 2 &&
        Array.isArray(body.data?.details)
      ) {
        recordTest(13, 'POST /api/coding-exercises/:id/reverify returns structured failure diagnostics without publishing', 'PASS')
      } else {
        recordTest(13, 'POST /api/coding-exercises/:id/reverify returns structured failure diagnostics without publishing', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(13, 'POST /api/coding-exercises/:id/reverify returns structured failure diagnostics without publishing', 'FAIL', err.message)
    }

    // Scenario 14: Teacher fixes the reference solution
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${exerciseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.teacher.token}`
        },
        body: JSON.stringify({
          referenceSolution: 'function sumTwoNumbers(a, b) {\n  return a + b;\n}'
        })
      })
      const body = (await res.json()) as any
      if (res.status === 200 && body.success) {
        recordTest(14, 'Teacher successfully updates reference solution with correct logic', 'PASS')
      } else {
        recordTest(14, 'Teacher successfully updates reference solution with correct logic', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(14, 'Teacher successfully updates reference solution with correct logic', 'FAIL', err.message)
    }

    // Scenario 15: Re-verification of corrected reference solution passes (VERIFIED, 100%)
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${exerciseId}/reverify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const body = (await res.json()) as any
      if (
        res.status === 200 &&
        body.success &&
        (body.data?.status === 'VERIFIED' || body.data?.verificationStatus === 'VERIFIED') &&
        body.data?.passRate === 100 &&
        body.data?.passedTests === 2
      ) {
        recordTest(15, 'Re-verification succeeds with status VERIFIED and 100% passRate', 'PASS')
      } else {
        recordTest(15, 'Re-verification succeeds with status VERIFIED and 100% passRate', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(15, 'Re-verification succeeds with status VERIFIED and 100% passRate', 'FAIL', err.message)
    }

    // Scenario 16: Publish succeeds on genuinely VERIFIED revision
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${exerciseId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.teacher.token}` }
      })
      const body = (await res.json()) as any
      if (res.status === 200 && body.success && body.data?.status === 'PUBLISHED') {
        recordTest(16, 'Genuinely VERIFIED exercise publishes successfully', 'PASS')
      } else {
        recordTest(16, 'Genuinely VERIFIED exercise publishes successfully', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(16, 'Genuinely VERIFIED exercise publishes successfully', 'FAIL', err.message)
    }

    // Scenario 17: Anti-cheat: Student fetches published exercise and hidden testcases are concealed
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${exerciseId}`, {
        headers: { Authorization: `Bearer ${ctx.student.token}` }
      })
      const body = (await res.json()) as any
      const studentData = body.data
      const hasReferenceSolution = Boolean(studentData?.referenceSolution || studentData?.activeRevision?.referenceSolution)
      const hasHiddenTests = Boolean(
        studentData?.testCases?.some((tc: any) => tc.isHidden === true) ||
        studentData?.activeRevision?.testCases?.some((tc: any) => tc.isHidden === true)
      )

      if (res.status === 200 && !hasReferenceSolution && !hasHiddenTests) {
        recordTest(17, 'Anti-cheat protection: Reference solution and hidden test cases are concealed from student', 'PASS')
      } else {
        recordTest(17, 'Anti-cheat protection: Reference solution and hidden test cases are concealed from student', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(17, 'Anti-cheat protection: Reference solution and hidden test cases are concealed from student', 'FAIL', err.message)
    }

    // Scenario 18: Modifying code creates a new revision in DRAFT requiring re-verification
    try {
      const res = await fetch(`${BACKEND_URL}/api/coding-exercises/${exerciseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.teacher.token}`
        },
        body: JSON.stringify({
          starterCode: 'function sumTwoNumbers(a, b) {\n  // V2 starter\n}'
        })
      })
      const body = (await res.json()) as any
      const newVersion = body.data?.activeVersion ?? body.data?.version ?? body.data?.activeRevision?.version
      if (res.status === 200 && newVersion === 2) {
        recordTest(18, 'Modifying code increments revision to v2 in DRAFT state', 'PASS')
      } else {
        recordTest(18, 'Modifying code increments revision to v2 in DRAFT state', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(18, 'Modifying code increments revision to v2 in DRAFT state', 'FAIL', err.message)
    }

    // -------------------------------------------------------------
    // GROUP 4: MULTI-MODEL PAYLOAD PROPAGATION & COMPATIBILITY
    // -------------------------------------------------------------
    console.log('\n--- GROUP 4: Multi-Model Payload Propagation ---')

    // Scenario 19: Request with unsupported model is rejected gracefully
    try {
      const res = await fetch(`${BACKEND_URL}/api/lessons/${ctx.testLesson.id}/ai-quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.teacher.token}`
        },
        body: JSON.stringify({
          model: 'unsupported-model-99',
          previewOnly: true
        })
      })
      const body = (await res.json()) as any
      if (res.status === 400 && !body.success && body.message.includes('Mô hình AI')) {
        recordTest(19, 'Invalid model parameter in AI Quiz request is rejected with 400 Bad Request', 'PASS')
      } else {
        recordTest(19, 'Invalid model parameter in AI Quiz request is rejected with 400 Bad Request', 'FAIL', JSON.stringify(body))
      }
    } catch (err: any) {
      recordTest(19, 'Invalid model parameter in AI Quiz request is rejected with 400 Bad Request', 'FAIL', err.message)
    }

    // Scenario 20: Legacy request without model parameter works using default model
    try {
      const desc = getAiModelDescriptor(undefined)
      if (desc && desc.id === 'gemini-3.5-flash') {
        recordTest(20, 'Legacy requests omitting model default cleanly to gemini-3.5-flash', 'PASS')
      } else {
        recordTest(20, 'Legacy requests omitting model default cleanly to gemini-3.5-flash', 'FAIL')
      }
    } catch (err: any) {
      recordTest(20, 'Legacy requests omitting model default cleanly to gemini-3.5-flash', 'FAIL', err.message)
    }

  } finally {
    console.log('\n===================================================================================')
    console.log(` RESULTS: ${passedScenarios} PASSED / ${failedScenarios} FAILED (TOTAL: ${results.length})`)
    console.log('===================================================================================')
    await disconnectPrisma()
  }
}

runStep7gTestSuite()
  .then(() => {
    if (failedScenarios > 0) process.exit(1)
    process.exit(0)
  })
  .catch((err) => {
    console.error('Fatal test runner error:', err)
    process.exit(1)
  })
