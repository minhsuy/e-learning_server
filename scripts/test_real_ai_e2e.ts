import dotenv from 'dotenv'
dotenv.config()

import jwt from 'jsonwebtoken'

async function runRealEndToEndTest() {
  console.log('====================================================')
  console.log('STEP 7E: REAL END-TO-END COMMUNICATION TEST')
  console.log('====================================================\n')

  const accessSecret = process.env.JWT_SECRECT_ACCESS_TOKEN as string
  if (!accessSecret) {
    throw new Error('JWT_SECRECT_ACCESS_TOKEN is missing in server .env')
  }

  // 1. Health checks of real running services
  console.log('1. Checking running services...')
  const feRes = await fetch('http://localhost:3000').catch((e) => ({ ok: false, statusText: e.message }))
  const beRes = await fetch('http://localhost:3002/api/categories').catch((e) => ({ ok: false, statusText: e.message }))
  const aiRes = await fetch('http://127.0.0.1:8000/health').catch((e) => ({ ok: false, statusText: e.message }))

  console.log(`- Next.js (port 3000): ${'status' in feRes ? feRes.status : 'OK'}`)
  console.log(`- Express (port 3002): ${'status' in beRes ? beRes.status : 'OK'}`)
  console.log(`- FastAPI (port 8000): ${'status' in aiRes ? aiRes.status : 'OK'}`)

  if (!feRes.ok || !beRes.ok || !aiRes.ok) {
    throw new Error('One or more services are not reachable on expected ports')
  }

  // 2. Auth tokens
  const { prisma } = await import('../src/config/prisma')
  const lesson = await prisma.lesson.findFirst({
    where: { transcriptRefined: { not: null } },
    include: { course: true }
  })
  if (!lesson) {
    throw new Error('No lesson with refined transcript found')
  }

  const lessonId = lesson.id
  const teacherId = lesson.course.authorId
  console.log(`Found target lesson: ${lessonId}, Course: ${lesson.courseId}, Author: ${teacherId}`)

  const teacherToken = jwt.sign(
    { userId: teacherId, role: 'teacher' },
    accessSecret,
    { expiresIn: '1h' }
  )

  // 3. Real AI Quiz Generation via Next.js / Express -> FastAPI -> Gemini
  console.log('\n2. Testing Real AI Quiz Generation (Express -> FastAPI -> Gemini)...')
  const quizRes = await fetch(`http://localhost:3002/api/lessons/${lessonId}/ai-quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      questionCount: 2,
      difficulty: 'EASY',
      previewOnly: true
    })
  })

  const quizData = await quizRes.json()
  console.log(`- Quiz Generation HTTP Status: ${quizRes.status}`)
  console.log(`- Quiz Generation Success: ${quizData.success}`)
  if (!quizData.success) {
    console.log(`- Quiz Error detail:`, JSON.stringify(quizData))
  }
  console.log(`- Quiz Title: ${quizData.data?.title}`)
  console.log(`- Questions generated: ${quizData.data?.questions?.length}`)
  if (quizData.data?.questions?.length > 0) {
    const q1 = quizData.data.questions[0]
    console.log(`- Sample Question: "${q1.question}"`)
    console.log(`- Options count: ${q1.options?.length}`)
    console.log(`- Correct Answer: "${q1.correctAnswer}"`)
  }

  // 4. Real AI Coding Exercise Generation via Express -> FastAPI -> Gemini -> E2B
  console.log('\n3. Testing Real AI Coding Exercise Generation (Express -> FastAPI -> Gemini -> E2B)...')
  const codingRes = await fetch(`http://localhost:3002/api/lessons/${lessonId}/ai-coding-exercise/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      language: 'javascript',
      difficulty: 'EASY',
      previewOnly: true,
      verifyWithE2b: true
    })
  })

  // Direct FastAPI call to diagnose with programming concepts
  console.log('\n--- Testing FastAPI Coding Exercise Generation with Code Transcript ---')
  const codeTranscript = 'Trong bài giảng hôm nay, chúng ta sẽ viết hàm JavaScript để xử lý mảng và lọc các số nguyên dương, tính toán tổng các phần tử chẵn trong mảng sử dụng thuật toán tối ưu và trả về kết quả qua lệnh return.'
  const fastApiDirectRes = await fetch('http://127.0.0.1:8000/api/v1/coding-exercises/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.AI_SERVICE_API_KEY as string
    },
    body: JSON.stringify({
      lesson_title: 'Bài tập hàm và mảng trong JavaScript',
      transcript: codeTranscript,
      summary: 'Bài học thực hành viết hàm xử lý mảng và số chẵn',
      language: 'javascript',
      difficulty: 'EASY',
      exercise_count: 1,
      teacher_instructions: 'Tạo bài tập viết hàm tính tổng các số chẵn trong mảng số nguyên',
      async_mode: false
    })
  })
  console.log('FastAPI Direct Status:', fastApiDirectRes.status)
  const fastApiJson = await fastApiDirectRes.json()
  if (fastApiDirectRes.ok) {
    console.log('FastAPI Generated Title:', fastApiJson.exercise?.title)
    console.log('FastAPI Function Name:', fastApiJson.exercise?.executionContract?.functionName)
    console.log('FastAPI Starter Code:', fastApiJson.exercise?.starterCode)
    console.log('FastAPI Reference Solution:', fastApiJson.exercise?.referenceSolution)
    console.log('FastAPI Test Cases count:', fastApiJson.exercise?.testCases?.length)

    // REAL E2B SANDBOX VERIFICATION TEST
    console.log('\n--- 4. Testing REAL E2B Sandbox Execution of Reference Solution ---')
    const { defaultE2BClient } = await import('../src/integrations/e2b/e2b.client')
    const { verifyReferenceSolution } = await import('../src/services/codeExecution.service')

    const ex = fastApiJson.exercise
    const testCases = ex.testCases.map((tc: any, idx: number) => ({
      testCaseId: `tc_real_${idx}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      order: tc.order ?? idx,
      weight: tc.weight ?? 25
    }))

    console.log('Calling E2B Sandbox microVM...')
    const verification = await verifyReferenceSolution(
      {
        sourceCode: ex.referenceSolution,
        executionContract: ex.executionContract,
        testCases,
        timeLimit: 2000,
        memoryLimit: 128000
      },
      defaultE2BClient
    )

    console.log('- E2B Verification isValid:', verification.isValid)
    console.log('- E2B Score:', verification.score)
    console.log('- E2B Pass Rate:', verification.passRate + '%')
    console.log('- E2B Passed Tests:', verification.result.passedTests, '/', verification.result.totalTests)
    console.log('- E2B Total Execution Time:', verification.result.totalExecutionTimeMs, 'ms')
  } else {
    console.log('FastAPI Direct Error:', JSON.stringify(fastApiJson, null, 2))
  }

  await prisma['$disconnect']()

  console.log('\n====================================================')
  console.log('REAL SERVICE INTEGRATION CALLS COMPLETED')
  console.log('====================================================')
}

runRealEndToEndTest().catch((err) => {
  console.error('Real E2E Test Failure:', err)
  process.exit(1)
})
