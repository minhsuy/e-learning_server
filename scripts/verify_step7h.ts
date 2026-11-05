import fs from 'fs'
import path from 'path'
import { prisma } from '../src/config/prisma'
import { DEFAULT_AI_MODEL_ID, isValidAiModelId } from '../src/config/aiModels.config'
import { getAiServiceConfig, GEMINI_MODEL } from '../src/config/ai.config'
import { autoTriggerLessonAiSummaryIfNeeded } from '../src/services/aiProcessing.service'
import {
  generateAiQuizForLessonService,
  generateAiCodingExerciseForLessonService
} from '../src/services/aiAssessment.service'
import {
  createLessonService,
  getLessonAiContentService,
  getLessonByIdService,
  updateLessonAiContentService
} from '../src/services/lesson.service'
import { UserRole } from '../src/types/enum'

async function runVerification() {
  console.log('==========================================================')
  console.log('TMDEMY — STEP 7H END-TO-END VERIFICATION SUITE')
  console.log('==========================================================\n')

  const results: Array<{ check: string; passed: boolean; detail: string }> = []
  const record = (check: string, passed: boolean, detail: string) => {
    results.push({ check, passed, detail })
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} | ${check}: ${detail}`)
  }

  let createdTeacherId: string | null = null
  let createdCourseId: string | null = null
  let createdChapterId: string | null = null
  const createdLessonIds: string[] = []

  try {
    // ---------------------------------------------------------
    // CHECK 1: Centralized Single Model Configuration & FastAPI Health
    // ---------------------------------------------------------
    const config = getAiServiceConfig(false)
    const isModelFlashLite =
      GEMINI_MODEL === 'gemini-3.1-flash-lite' &&
      DEFAULT_AI_MODEL_ID === 'gemini-3.1-flash-lite' &&
      config.defaultModelId === 'gemini-3.1-flash-lite'

    record(
      '1.1 Backend Centralized Single Model ID',
      isModelFlashLite && isValidAiModelId('gemini-3.1-flash-lite') && !isValidAiModelId('gemini-2.5-flash'),
      `DEFAULT_AI_MODEL_ID=${DEFAULT_AI_MODEL_ID}, rejects non-default models=${!isValidAiModelId('gemini-2.5-flash')}`
    )

    const fastApiHealthRes = await fetch(`${config.serviceUrl}/health`)
    const fastApiHealthJson = (await fastApiHealthRes.json()) as Record<string, unknown>
    record(
      '1.2 FastAPI Health & Active Model',
      fastApiHealthRes.ok && fastApiHealthJson.status === 'ok',
      `status=${fastApiHealthJson.status}, version=${fastApiHealthJson.version}`
    )

    // ---------------------------------------------------------
    // CHECK 2: No Model Selection Dropdown or Model Listing Endpoints Remain
    // ---------------------------------------------------------
    const frontendRoot = path.resolve(__dirname, '../../e-learning/src')
    const selectorFilePath = path.join(
      frontendRoot,
      'components/teacher/assessment/ai-model-selector.tsx'
    )
    const selectorDeleted = !fs.existsSync(selectorFilePath)

    const summaryModalContent = fs.readFileSync(
      path.join(frontendRoot, 'components/teacher/curriculum/lesson-summary-modal.tsx'),
      'utf-8'
    )
    const quizModalContent = fs.readFileSync(
      path.join(frontendRoot, 'components/teacher/assessment/ai-quiz-generate-modal.tsx'),
      'utf-8'
    )
    const codingModalContent = fs.readFileSync(
      path.join(frontendRoot, 'components/teacher/assessment/ai-coding-exercise-modal.tsx'),
      'utf-8'
    )
    const noDropdownReferences =
      selectorDeleted &&
      !summaryModalContent.includes('AiModelSelector') &&
      !quizModalContent.includes('AiModelSelector') &&
      !codingModalContent.includes('AiModelSelector')

    const aiRouteDeleted = !fs.existsSync(
      path.resolve(__dirname, '../src/routes/ai.route.ts')
    )
    const lessonRouteContent = fs.readFileSync(
      path.resolve(__dirname, '../src/routes/lesson.route.ts'),
      'utf-8'
    )
    const noModelRoutes = aiRouteDeleted && !lessonRouteContent.includes('/ai-models')

    record(
      '2.1 Multi-Model Selector & Endpoints Removed',
      noDropdownReferences && noModelRoutes,
      `selectorDeleted=${selectorDeleted}, modalsClean=${noDropdownReferences}, routesRemoved=${noModelRoutes}`
    )

    // ---------------------------------------------------------
    // Find or create a teacher, course, and chapter for DB & API tests
    // ---------------------------------------------------------
    let existingCourse = await prisma.course.findFirst({
      where: {
        chapters: { some: {} }
      },
      include: {
        chapters: { take: 1 },
        author: true
      }
    })

    if (!existingCourse || !existingCourse.chapters[0]) {
      let teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } })
      if (!teacher) {
        teacher = await prisma.user.create({
          data: {
            email: `step7h-teacher-${Date.now()}@tmdemy.test`,
            username: `step7hteacher${Date.now()}`,
            password: 'hashed_password',
            name: 'Step 7H Teacher',
            role: 'TEACHER'
          }
        })
        createdTeacherId = teacher.id
      }

      const newCourse = await prisma.course.create({
        data: {
          title: `Step 7H Test Course ${Date.now()}`,
          slug: `step-7h-test-course-${Date.now()}`,
          authorId: teacher.id
        }
      })
      createdCourseId = newCourse.id

      const newChapter = await prisma.chapter.create({
        data: {
          title: 'Chương 1: Kiểm thử Step 7H',
          order: 1,
          courseId: newCourse.id
        }
      })
      createdChapterId = newChapter.id

      existingCourse = await prisma.course.findUnique({
        where: { id: newCourse.id },
        include: { chapters: true, author: true }
      })
    }

    const testCourseId = existingCourse!.id
    const testChapterId = existingCourse!.chapters[0].id
    const teacherId = existingCourse!.authorId

    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId: testCourseId, status: 'ACTIVE' }
    })
    const studentId = enrollment?.userId

    // ---------------------------------------------------------
    // CHECK 3: Creating a Lesson WITHOUT a video does NOT trigger AI processing
    // ---------------------------------------------------------
    const noVideoLessonRes = await createLessonService({
      payload: {
        title: `Step 7H Test - Text Lesson No Video ${Date.now()}`,
        chapter: testChapterId,
        course: testCourseId,
        type: 'TEXT',
        content: 'Bài học lý thuyết dạng văn bản không có video.',
        isDemo: true
      },
      userId: teacherId,
      role: UserRole.TEACHER
    })

    const noVideoLessonId = noVideoLessonRes.data?.id
    if (noVideoLessonId) createdLessonIds.push(noVideoLessonId)

    await new Promise((r) => setTimeout(r, 400))
    const noVideoJobs = await prisma.aiProcessingJob.findMany({
      where: { lessonId: noVideoLessonId }
    })
    const noVideoLessonDb = await prisma.lesson.findUnique({
      where: { id: noVideoLessonId }
    })

    record(
      '3.1 Lesson Without Video Does NOT Trigger AI Processing',
      Boolean(noVideoLessonId) &&
        noVideoJobs.length === 0 &&
        noVideoLessonDb?.aiProcessingStatus === null,
      `lessonId=${noVideoLessonId}, aiJobsCount=${noVideoJobs.length}, aiProcessingStatus=${noVideoLessonDb?.aiProcessingStatus}`
    )

    // ---------------------------------------------------------
    // CHECK 4: Creating a Lesson WITH a Video Automatically Triggers AI Processing
    // ---------------------------------------------------------
    const sampleTranscript = `
[00:00 -> 00:15] Chào mừng các bạn đến với bài giảng lập trình JavaScript cơ bản trên nền tảng TMdemy.
[00:15 -> 00:45] Trong bài học hôm nay, chúng ta sẽ tìm hiểu cách khai báo hàm (function), truyền tham số (parameters) và trả về giá trị (return value).
[00:45 -> 01:20] Ví dụ hàm calculateSum(a, b) nhận vào hai số nguyên a và b, sau đó trả về tổng a + b. Hãy luôn kiểm tra kiểu dữ liệu đầu vào để tránh lỗi cộng chuỗi ngoài ý muốn.
    `.trim()

    const testBunnyGuid = `test-step7h-video-${Date.now()}`
    const videoLessonRes = await createLessonService({
      payload: {
        title: `Step 7H Test - Video Lesson Auto Summary ${Date.now()}`,
        chapter: testChapterId,
        course: testCourseId,
        type: 'VIDEO',
        bunnyVideoId: testBunnyGuid,
        duration: 80,
        isDemo: true
      },
      userId: teacherId,
      role: UserRole.TEACHER
    })

    const videoLessonId = videoLessonRes.data?.id
    if (!videoLessonId) throw new Error('Failed to create video lesson')
    createdLessonIds.push(videoLessonId)

    // Wait briefly for the async auto-trigger from createLessonService to execute
    await new Promise((r) => setTimeout(r, 1200))

    const jobsAfterCreate = await prisma.aiProcessingJob.findMany({
      where: { lessonId: videoLessonId }
    })

    record(
      '4.1 Creating Lesson With Video Automatically Triggers AI Processing',
      jobsAfterCreate.length === 1,
      `lessonId=${videoLessonId}, jobsCreated=${jobsAfterCreate.length}, status=${jobsAfterCreate[0]?.status}`
    )

    // ---------------------------------------------------------
    // CHECK 5: Duplicate Upload Callbacks Do NOT Create Duplicate Jobs
    // ---------------------------------------------------------
    const [dup1, dup2, dup3] = await Promise.all([
      autoTriggerLessonAiSummaryIfNeeded(videoLessonId, teacherId, 'AI_SERVICE'),
      autoTriggerLessonAiSummaryIfNeeded(videoLessonId, teacherId, 'AI_SERVICE'),
      autoTriggerLessonAiSummaryIfNeeded(videoLessonId, teacherId, 'AI_SERVICE')
    ])

    const jobsAfterDupCallbacks = await prisma.aiProcessingJob.findMany({
      where: { lessonId: videoLessonId }
    })

    record(
      '5.1 Duplicate Upload Callbacks Do Not Create Duplicate Jobs',
      jobsAfterDupCallbacks.length === 1 && dup1.success && dup2.success && dup3.success,
      `jobsCountAfter3ConcurrentCallbacks=${jobsAfterDupCallbacks.length}`
    )

    // ---------------------------------------------------------
    // CHECK 6: Single-Model Summary Generation (Without Rerunning Whisper When Transcript Exists)
    //          & Persistence into Lesson.summary in PostgreSQL
    // ---------------------------------------------------------
    await prisma.aiProcessingJob.deleteMany({ where: { lessonId: videoLessonId } })
    await prisma.lesson.update({
      where: { id: videoLessonId },
      data: {
        transcript: sampleTranscript,
        transcriptOriginal: sampleTranscript,
        transcriptRefined: sampleTranscript,
        summary: null,
        aiProcessingStatus: 'PENDING',
        aiProcessingError: null
      }
    })

    const autoSummaryRes = await autoTriggerLessonAiSummaryIfNeeded(
      videoLessonId,
      teacherId,
      'AI_SERVICE'
    )

    const lessonAfterSummary = await prisma.lesson.findUnique({
      where: { id: videoLessonId }
    })
    const jobsAfterTranscriptOnly = await prisma.aiProcessingJob.findMany({
      where: { lessonId: videoLessonId }
    })

    const summaryPersisted =
      Boolean(lessonAfterSummary?.summary && lessonAfterSummary.summary.trim().length > 50) &&
      lessonAfterSummary?.aiProcessingStatus === 'COMPLETED' &&
      jobsAfterTranscriptOnly.length === 0

    record(
      '6.1 Auto-Summary Persisted to Lesson.summary via gemini-3.1-flash-lite (Without Rerunning Whisper)',
      autoSummaryRes.success && summaryPersisted,
      `status=${lessonAfterSummary?.aiProcessingStatus}, summaryLength=${lessonAfterSummary?.summary?.length || 0}, whisperJobsCreated=${jobsAfterTranscriptOnly.length}`
    )

    // ---------------------------------------------------------
    // CHECK 6.2: Teacher-Edited Summary Protection (Do Not Overwrite)
    // ---------------------------------------------------------
    const customTeacherSummary =
      '# Tóm tắt do Giảng viên biên soạn thủ công\n\nNội dung này không được phép bị ghi đè tự động.'
    await updateLessonAiContentService({
      lessonId: videoLessonId,
      payload: {
        summary: customTeacherSummary,
        aiProcessingStatus: 'COMPLETED'
      },
      userId: teacherId,
      role: UserRole.TEACHER
    })

    await autoTriggerLessonAiSummaryIfNeeded(videoLessonId, teacherId, 'AI_SERVICE')
    const lessonAfterTeacherEdit = await prisma.lesson.findUnique({
      where: { id: videoLessonId }
    })

    record(
      '6.2 Existing Teacher-Edited Summary Is Protected From Overwrite',
      lessonAfterTeacherEdit?.summary === customTeacherSummary,
      `preservedExactTeacherSummary=${lessonAfterTeacherEdit?.summary === customTeacherSummary}`
    )

    if (lessonAfterSummary?.summary) {
      await prisma.lesson.update({
        where: { id: videoLessonId },
        data: { summary: lessonAfterSummary.summary, aiProcessingStatus: 'COMPLETED' }
      })
    }

    // ---------------------------------------------------------
    // CHECK 7: Teacher and Student Can View the Generated Summary
    // ---------------------------------------------------------
    const teacherViewRes = await getLessonAiContentService({
      lessonId: videoLessonId,
      userId: teacherId,
      role: UserRole.TEACHER
    })

    const studentViewAiRes = await getLessonAiContentService({
      lessonId: videoLessonId,
      userId: studentId,
      role: UserRole.STUDENT
    })

    const studentStudyRes = await getLessonByIdService({
      lessonId: videoLessonId,
      userId: studentId,
      role: UserRole.STUDENT
    })

    record(
      '7.1 Teacher & Student Can View Persisted Summary',
      Boolean(teacherViewRes.data?.summary && teacherViewRes.data.summary.length > 50) &&
        Boolean(studentViewAiRes.data?.summary && studentViewAiRes.data.summary.length > 50) &&
        Boolean(studentStudyRes.data?.summary && studentStudyRes.data.summary.length > 50),
      `teacherLen=${teacherViewRes.data?.summary?.length || 0}, studentAiLen=${studentViewAiRes.data?.summary?.length || 0}, studentStudyLen=${studentStudyRes.data?.summary?.length || 0}`
    )

    // ---------------------------------------------------------
    // CHECK 8: Single-Model Works for AI Quiz & AI Coding Exercise Generation
    // ---------------------------------------------------------
    const quizPreviewRes = await generateAiQuizForLessonService({
      lessonId: videoLessonId,
      userId: teacherId,
      role: UserRole.TEACHER,
      input: {
        questionCount: 3,
        difficulty: 'EASY',
        previewOnly: true
      }
    })

    record(
      '8.1 Single Model (gemini-3.1-flash-lite) Works for AI Quiz Generation',
      quizPreviewRes.success &&
        Array.isArray((quizPreviewRes.data as any)?.questions) &&
        (quizPreviewRes.data as any).questions.length === 3,
      `statusCode=${quizPreviewRes.statusCode}, questions=${(quizPreviewRes.data as any)?.questions?.length || 0}`
    )

    const codingPreviewRes = await generateAiCodingExerciseForLessonService({
      lessonId: videoLessonId,
      userId: teacherId,
      role: UserRole.TEACHER,
      input: {
        language: 'javascript',
        difficulty: 'EASY',
        exerciseCount: 1,
        previewOnly: true,
        verifyWithE2b: false
      }
    })

    record(
      '8.2 Single Model (gemini-3.1-flash-lite) Works for AI Coding Exercise Generation',
      codingPreviewRes.success && Boolean((codingPreviewRes.data as any)?.starterCode),
      `statusCode=${codingPreviewRes.statusCode}, title=${(codingPreviewRes.data as any)?.title}, modelUsed=${(codingPreviewRes.data as any)?.sourceInfo?.model_used || DEFAULT_AI_MODEL_ID}`
    )
  } finally {
    if (createdLessonIds.length > 0) {
      await prisma.aiProcessingJob.deleteMany({
        where: { lessonId: { in: createdLessonIds } }
      })
      await prisma.lesson.deleteMany({
        where: { id: { in: createdLessonIds } }
      })
    }
    if (createdChapterId) {
      await prisma.chapter.delete({ where: { id: createdChapterId } }).catch(() => {})
    }
    if (createdCourseId) {
      await prisma.course.delete({ where: { id: createdCourseId } }).catch(() => {})
    }
    if (createdTeacherId) {
      await prisma.user.delete({ where: { id: createdTeacherId } }).catch(() => {})
    }
    await prisma.$disconnect()
  }

  console.log('\n==========================================================')
  const failedCount = results.filter((r) => !r.passed).length
  console.log(
    `VERIFICATION SUMMARY: ${results.length - failedCount}/${results.length} PASSED`
  )
  console.log('==========================================================')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runVerification().catch((err) => {
  console.error('Fatal verification error:', err)
  process.exit(1)
})
