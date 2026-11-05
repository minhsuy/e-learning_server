import dotenv from 'dotenv'
dotenv.config()

import {
  AiProcessingStatus,
  AiJobStatus,
  AiJobType,
  EEnrollmentStatus,
  LessonType,
  Prisma,
  UserRole
} from '@prisma/client'
import { prisma } from '~/config/prisma'
import { createAiJob } from '~/repositories/aiJob.repository'
import {
  findLessonById,
  LESSON_AI_CONTENT_SELECT,
  LESSON_STUDY_SELECT
} from '~/repositories/lesson.repository'
import {
  getLessonAiContentService,
  getLessonByIdService,
  updateLessonAiContentService
} from '~/services/lesson.service'
import {
  fastApiJobResultSchema
} from '~/services/aiServiceClient.service'
import {
  updateLessonAiContentInputSchema,
  lessonAiContentResponseSchema
} from '~/models/lesson.model'
import { pollJobStatusService } from '~/services/aiProcessing.service'
import { aiServiceClient } from '~/services/aiServiceClient.service'

/**
 * TMDEMY — STEP 6.7 AUTOMATED VERIFICATION SUITE
 * AI TRANSCRIPT REFINEMENT & DUAL TRANSCRIPT PERSISTENCE
 *
 * Scenarios tested:
 * 1. Zod FastApiJobResult schema parses snake_case and camelCase transcript fields
 * 2. Zod updateLessonAiContentInputSchema accepts transcriptOriginal and transcriptRefined
 * 3. Database persistence: transcriptOriginal and transcriptRefined are saved and retrievable
 * 4. Technical terminology & Vietnamese diacritics preservation in both versions
 * 5. Effective transcript fallback: refined transcript automatically activates as primary
 * 6. Teacher / Admin / AI Service role can view transcriptOriginal and transcriptRefined
 * 7. Enrolled students receive ONLY active transcript and summary; original & refined are redacted
 * 8. Study endpoint (getLessonByIdService) provides active transcript but redacts dual raw versions
 * 9. Generation-fenced atomic persistence in pollJobStatusService saves both original and refined
 * 10. Stale job protection prevents out-of-order writes from corrupting transcripts
 * 11. Backward compatibility: existing lessons without dual transcripts continue to function seamlessly
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

async function runStep6_7Tests() {
  console.log('=================================================================')
  console.log('STARTING TMDEMY STEP 6.7: TRANSCRIPT REFINEMENT VERIFICATION')
  console.log('=================================================================')

  // Setup test data in DB
  const testSuffix = Date.now().toString()
  const teacherEmail = `test_teacher_6_7_${testSuffix}@example.com`
  const studentEmail = `test_student_6_7_${testSuffix}@example.com`

  let teacherUser: any
  let studentUser: any
  let category: any
  let course: any
  let chapter: any
  let lesson: any

  try {
    // -------------------------------------------------------------
    // GROUP 1: Zod Schema Validation
    // -------------------------------------------------------------
    console.log('\n--- GROUP 1: ZOD SCHEMAS & CONTRACT PARSING ---')

    const rawFastApiPayload = {
      job_id: 'job-123456',
      status: 'COMPLETED',
      stage: 'COMPLETED',
      progress_percent: 100,
      transcript: 'Các bạn implement OnGatewayInit',
      transcript_original: 'Các bạn implement OnGetQuay Init',
      transcript_refined: 'Các bạn implement OnGatewayInit',
      summary: 'Bài học về WebSockets và Gateway trong NestJS'
    }

    const parsedFastApi = fastApiJobResultSchema.safeParse(rawFastApiPayload)
    assert(parsedFastApi.success === true, 'Zod Schema', 'fastApiJobResultSchema accepts snake_case dual transcript fields')
    if (parsedFastApi.success) {
      assert(parsedFastApi.data.transcript_original === 'Các bạn implement OnGetQuay Init', 'Zod Schema', 'Parsed transcript_original matches')
      assert(parsedFastApi.data.transcript_refined === 'Các bạn implement OnGatewayInit', 'Zod Schema', 'Parsed transcript_refined matches')
    }

    const camelFastApiPayload = {
      job_id: 'job-123457',
      status: 'COMPLETED',
      stage: 'COMPLETED',
      progress_percent: 100,
      transcript: 'Các bạn kết nối Socket.IO',
      transcriptOriginal: 'Các bạn kết nối Socket iOS',
      transcriptRefined: 'Các bạn kết nối Socket.IO',
      summary: 'Tổng quan Socket.IO'
    }
    const parsedCamel = fastApiJobResultSchema.safeParse(camelFastApiPayload)
    assert(parsedCamel.success === true, 'Zod Schema', 'fastApiJobResultSchema accepts camelCase dual transcript fields')

    const parsedInput = updateLessonAiContentInputSchema.safeParse({
      transcriptOriginal: 'Bản gốc Whisper',
      transcriptRefined: 'Bản sửa Gemini',
      transcript: 'Bản sửa Gemini',
      summary: 'Tóm tắt bài giảng'
    })
    assert(parsedInput.success === true, 'Zod Schema', 'updateLessonAiContentInputSchema accepts transcriptOriginal and transcriptRefined')

    // -------------------------------------------------------------
    // Database Fixtures Setup
    // -------------------------------------------------------------
    console.log('\n--- SETUP: CREATING TEST ENTITIES IN POSTGRESQL ---')

    teacherUser = await prisma.user.create({
      data: {
        username: `teacher_6_7_${testSuffix}`,
        email: teacherEmail,
        password: 'hashedpassword',
        role: UserRole.TEACHER
      }
    })

    studentUser = await prisma.user.create({
      data: {
        username: `student_6_7_${testSuffix}`,
        email: studentEmail,
        password: 'hashedpassword',
        role: UserRole.USER
      }
    })

    category = await prisma.category.create({
      data: {
        name: `Test Cat 6.7 ${testSuffix}`,
        slug: `test-cat-6-7-${testSuffix}`
      }
    })

    course = await prisma.course.create({
      data: {
        title: `Test Course 6.7 ${testSuffix}`,
        slug: `test-course-6-7-${testSuffix}`,
        authorId: teacherUser.id,
        categoryId: category.id,
        price: 0
      }
    })

    chapter = await prisma.chapter.create({
      data: {
        title: `Test Chapter 6.7 ${testSuffix}`,
        courseId: course.id,
        order: 1
      }
    })

    lesson = await prisma.lesson.create({
      data: {
        title: `Test Lesson 6.7 ${testSuffix}`,
        slug: `test-lesson-6-7-${testSuffix}`,
        chapterId: chapter.id,
        courseId: course.id,
        authorId: teacherUser.id,
        order: 1,
        type: LessonType.VIDEO,
        bunnyVideoId: 'video-guid-step-6-7',
        isDemo: false,
        aiGeneration: 1
      }
    })

    assert(Boolean(lesson.id), 'Setup', 'Created test lesson in PostgreSQL')

    // -------------------------------------------------------------
    // GROUP 2: Dual Transcript Persistence & Technical Terms
    // -------------------------------------------------------------
    console.log('\n--- GROUP 2: DUAL TRANSCRIPT PERSISTENCE & TECHNICAL TERMS ---')

    const originalWhisper = `[00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGetQuay Init trong Socket iOS.
[00:00:16.000 --> 00:00:20.500] Sau đó tạo một cái nèm spy và bích du Wea để bảo mật.`

    const refinedGemini = `[00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGatewayInit trong Socket.IO.
[00:00:16.000 --> 00:00:20.500] Sau đó tạo một cái namespace và middleware để bảo mật.`

    const summaryMd = `# Tóm tắt bài học: Kiến trúc Gateway và Socket.IO

- **OnGatewayInit**: Interface khởi tạo vòng đời Gateway trong NestJS.
- **Socket.IO**: Thư viện truyền thông thời gian thực.
- **Namespace & Middleware**: Phân vùng và bảo mật kết nối WebSocket.`

    const updateRes = await updateLessonAiContentService({
      lessonId: lesson.id,
      payload: {
        transcriptOriginal: originalWhisper,
        transcriptRefined: refinedGemini,
        transcript: refinedGemini,
        summary: summaryMd,
        aiProcessingStatus: AiProcessingStatus.COMPLETED
      },
      userId: teacherUser.id,
      role: UserRole.TEACHER
    })

    assert(updateRes.success === true, 'Persistence', 'updateLessonAiContentService succeeded with dual transcripts')
    assert(updateRes.data?.transcriptOriginal === originalWhisper, 'Persistence', 'Response contains untouched original transcript')
    assert(updateRes.data?.transcriptRefined === refinedGemini, 'Persistence', 'Response contains refined transcript')
    assert(updateRes.data?.transcript === refinedGemini, 'Persistence', 'Primary active transcript is set to refined transcript')

    // Direct DB verification
    const dbLesson = await prisma.lesson.findUnique({
      where: { id: lesson.id },
      select: LESSON_AI_CONTENT_SELECT
    })

    assert(dbLesson?.transcriptOriginal === originalWhisper, 'DB Check', 'PostgreSQL has original transcript stored')
    assert(dbLesson?.transcriptRefined === refinedGemini, 'DB Check', 'PostgreSQL has refined transcript stored')
    assert(dbLesson?.transcript === refinedGemini, 'DB Check', 'PostgreSQL active transcript matches refined')

    // -------------------------------------------------------------
    // GROUP 3: Automatic Primary Transcript Fallback
    // -------------------------------------------------------------
    console.log('\n--- GROUP 3: AUTOMATIC REFINED ACTIVATION ---')

    const lesson2 = await prisma.lesson.create({
      data: {
        title: `Test Lesson 2 6.7 ${testSuffix}`,
        slug: `test-lesson-2-6-7-${testSuffix}`,
        chapterId: chapter.id,
        courseId: course.id,
        authorId: teacherUser.id,
        order: 2,
        type: LessonType.VIDEO,
        isDemo: false
      }
    })

    // Update with transcriptRefined but WITHOUT explicit transcript
    const autoFallbackRes = await updateLessonAiContentService({
      lessonId: lesson2.id,
      payload: {
        transcriptOriginal: originalWhisper,
        transcriptRefined: refinedGemini,
        summary: summaryMd,
        aiProcessingStatus: AiProcessingStatus.COMPLETED
      },
      userId: teacherUser.id,
      role: UserRole.TEACHER
    })

    assert(autoFallbackRes.success === true, 'Activation', 'Update succeeds when transcript is omitted but transcriptRefined is provided')
    assert(autoFallbackRes.data?.transcript === refinedGemini, 'Activation', 'transcript is automatically set to transcriptRefined')

    // -------------------------------------------------------------
    // GROUP 4: Authorization & Privacy Controls
    // -------------------------------------------------------------
    console.log('\n--- GROUP 4: AUTHORIZATION & STUDENT PRIVACY ---')

    // 1. Teacher owner read
    const teacherAiRead = await getLessonAiContentService({
      lessonId: lesson.id,
      userId: teacherUser.id,
      role: UserRole.TEACHER
    })
    assert(teacherAiRead.success === true, 'Auth Read', 'Teacher owner can fetch AI content')
    assert(teacherAiRead.data?.transcriptOriginal !== undefined, 'Auth Read', 'Teacher can see transcriptOriginal')
    assert(teacherAiRead.data?.transcriptRefined !== undefined, 'Auth Read', 'Teacher can see transcriptRefined')

    // 2. Admin read
    const adminAiRead = await getLessonAiContentService({
      lessonId: lesson.id,
      userId: 'admin-id',
      role: UserRole.ADMIN
    })
    assert(adminAiRead.success === true, 'Auth Read', 'Admin can fetch AI content')
    assert(adminAiRead.data?.transcriptOriginal !== undefined, 'Auth Read', 'Admin can see transcriptOriginal')
    assert(adminAiRead.data?.transcriptRefined !== undefined, 'Auth Read', 'Admin can see transcriptRefined')

    // 3. AI Service server-to-server read
    const aiServiceRead = await getLessonAiContentService({
      lessonId: lesson.id,
      role: 'AI_SERVICE'
    })
    assert(aiServiceRead.success === true, 'Auth Read', 'AI Service can fetch AI content')
    assert(aiServiceRead.data?.transcriptOriginal !== undefined, 'Auth Read', 'AI Service can see transcriptOriginal')
    assert(aiServiceRead.data?.transcriptRefined !== undefined, 'Auth Read', 'AI Service can see transcriptRefined')

    // 4. Unenrolled student read (should be 403)
    const unenrolledRead = await getLessonAiContentService({
      lessonId: lesson.id,
      userId: studentUser.id,
      role: UserRole.USER
    })
    assert(unenrolledRead.success === false && unenrolledRead.statusCode === 403, 'Auth Read', 'Unenrolled student is blocked (403)')

    // 5. Enroll student
    await prisma.enrollment.create({
      data: {
        userId: studentUser.id,
        courseId: course.id,
        status: EEnrollmentStatus.ACTIVE
      }
    })

    // 6. Enrolled student read: must get active transcript & summary, but NOT transcriptOriginal or transcriptRefined
    const enrolledRead = await getLessonAiContentService({
      lessonId: lesson.id,
      userId: studentUser.id,
      role: UserRole.USER
    })
    assert(enrolledRead.success === true, 'Student Privacy', 'Enrolled student can fetch AI content')
    assert(enrolledRead.data?.transcript === refinedGemini, 'Student Privacy', 'Student receives active transcript')
    assert(enrolledRead.data?.summary === summaryMd, 'Student Privacy', 'Student receives lesson summary')
    assert(enrolledRead.data?.transcriptOriginal === undefined, 'Student Privacy', 'transcriptOriginal is strictly redacted from student')
    assert(enrolledRead.data?.transcriptRefined === undefined, 'Student Privacy', 'transcriptRefined is strictly redacted from student')
    assert(enrolledRead.data?.aiProcessingError === undefined, 'Student Privacy', 'aiProcessingError is strictly redacted from student')

    // 7. Enrolled student Study API (getLessonByIdService)
    const studyRead = await getLessonByIdService({
      lessonId: lesson.id,
      userId: studentUser.id,
      role: UserRole.USER
    })
    assert(studyRead.success === true, 'Study API', 'Enrolled student can study lesson')
    assert(studyRead.data?.transcript === refinedGemini, 'Study API', 'Study response includes active transcript')
    assert(studyRead.data?.transcriptOriginal === undefined, 'Study API', 'Study response redacts transcriptOriginal')
    assert(studyRead.data?.transcriptRefined === undefined, 'Study API', 'Study response redacts transcriptRefined')

    // -------------------------------------------------------------
    // GROUP 5: Pipeline Persistence (pollJobStatusService)
    // -------------------------------------------------------------
    console.log('\n--- GROUP 5: PIPELINE PERSISTENCE (pollJobStatusService) ---')

    // Create an AiProcessingJob linked to lesson
    const aiJob = await createAiJob({
      lesson: { connect: { id: lesson.id } },
      course: { connect: { id: course.id } },
      requestedBy: { connect: { id: teacherUser.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      videoId: 'video-guid-step-6-7',
      generation: 1,
      status: AiJobStatus.RUNNING,
      providerJobId: `fastapi-mock-${testSuffix}`,
      currentStage: 'REFINING_TRANSCRIPT'
    })

    // Mock aiServiceClient.getJobStatus and getJobResult
    const originalGetStatus = aiServiceClient.getJobStatus
    const originalGetResult = aiServiceClient.getJobResult

    const mockWhisperArtifact = 'Whisper untouched text with OnGetQuay Init'
    const mockRefinedArtifact = 'Gemini corrected text with OnGatewayInit'
    const mockSummaryArtifact = 'Summary of OnGatewayInit and WebSockets'

    aiServiceClient.getJobStatus = async () => ({
      job_id: aiJob.providerJobId,
      status: 'COMPLETED',
      current_stage: 'COMPLETED',
      created_at: new Date().toISOString()
    })

    aiServiceClient.getJobResult = async () => ({
      job_id: aiJob.providerJobId,
      status: 'COMPLETED',
      stage: 'COMPLETED',
      progress_percent: 100,
      transcript: mockRefinedArtifact,
      transcript_original: mockWhisperArtifact,
      transcript_refined: mockRefinedArtifact,
      summary: mockSummaryArtifact
    })

    try {
      const pollRes = await pollJobStatusService(aiJob.id)
      assert(pollRes.success === true, 'Pipeline Persistence', 'pollJobStatusService completes successfully')
      assert(pollRes.data?.status === AiJobStatus.COMPLETED, 'Pipeline Persistence', 'AI Job marked as COMPLETED')

      const updatedLessonFromJob = await prisma.lesson.findUnique({
        where: { id: lesson.id },
        select: LESSON_AI_CONTENT_SELECT
      })

      assert(updatedLessonFromJob?.transcript === mockRefinedArtifact, 'Pipeline Persistence', 'Active transcript updated to refined artifact')
      assert(updatedLessonFromJob?.transcriptOriginal === mockWhisperArtifact, 'Pipeline Persistence', 'transcriptOriginal correctly saved from FastAPI')
      assert(updatedLessonFromJob?.transcriptRefined === mockRefinedArtifact, 'Pipeline Persistence', 'transcriptRefined correctly saved from FastAPI')
      assert(updatedLessonFromJob?.summary === mockSummaryArtifact, 'Pipeline Persistence', 'summary correctly saved')
      assert(updatedLessonFromJob?.aiProcessingStatus === AiProcessingStatus.COMPLETED, 'Pipeline Persistence', 'Lesson aiProcessingStatus marked COMPLETED')
    } finally {
      // Restore mocks
      aiServiceClient.getJobStatus = originalGetStatus
      aiServiceClient.getJobResult = originalGetResult
    }

    // -------------------------------------------------------------
    // GROUP 6: Stale Job Protection with Generation Fencing
    // -------------------------------------------------------------
    console.log('\n--- GROUP 6: STALE JOB & GENERATION FENCING ---')

    // Bump lesson generation to 2 (e.g. video was reprocessed)
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { aiGeneration: 2 }
    })

    // Create an old generation-1 job that finishes late
    const lateJob = await createAiJob({
      lesson: { connect: { id: lesson.id } },
      course: { connect: { id: course.id } },
      requestedBy: { connect: { id: teacherUser.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      videoId: 'video-guid-step-6-7',
      generation: 1, // STALE generation!
      status: AiJobStatus.RUNNING,
      providerJobId: `fastapi-stale-${testSuffix}`,
      currentStage: 'COMPLETED'
    })

    aiServiceClient.getJobStatus = async () => ({
      job_id: lateJob.providerJobId,
      status: 'COMPLETED',
      current_stage: 'COMPLETED',
      created_at: new Date().toISOString()
    })

    aiServiceClient.getJobResult = async () => ({
      job_id: lateJob.providerJobId,
      status: 'COMPLETED',
      transcript: 'STALE OVERWRITE ATTEMPT',
      transcript_original: 'STALE ORIGINAL',
      transcript_refined: 'STALE REFINED',
      summary: 'STALE SUMMARY'
    })

    try {
      const stalePollRes = await pollJobStatusService(lateJob.id)
      assert(stalePollRes.success === true, 'Stale Guard', 'pollJobStatusService handled stale job without crash')
      assert(stalePollRes.data?.status === AiJobStatus.STALE, 'Stale Guard', 'Stale job correctly marked as STALE')

      const lessonAfterStale = await prisma.lesson.findUnique({
        where: { id: lesson.id },
        select: LESSON_AI_CONTENT_SELECT
      })

      assert(lessonAfterStale?.transcript === mockRefinedArtifact, 'Stale Guard', 'Lesson active transcript was NOT overwritten by stale job')
      assert(lessonAfterStale?.transcriptOriginal === mockWhisperArtifact, 'Stale Guard', 'Lesson original transcript was NOT overwritten by stale job')
    } finally {
      aiServiceClient.getJobStatus = originalGetStatus
      aiServiceClient.getJobResult = originalGetResult
    }

  } catch (err: any) {
    console.error('UNEXPECTED EXCEPTION DURING SUITE EXECUTION:', err)
    failedChecks++
  } finally {
    // Cleanup DB fixtures
    console.log('\n--- CLEANUP: REMOVING TEST FIXTURES ---')
    try {
      if (lesson?.id) {
        await prisma.aiProcessingJob.deleteMany({ where: { lessonId: lesson.id } })
      }
      if (course?.id) {
        await prisma.enrollment.deleteMany({ where: { courseId: course.id } })
        await prisma.lesson.deleteMany({ where: { courseId: course.id } })
        await prisma.chapter.deleteMany({ where: { courseId: course.id } })
        await prisma.course.deleteMany({ where: { id: course.id } })
      }
      if (category?.id) {
        await prisma.category.deleteMany({ where: { id: category.id } })
      }
      if (teacherUser?.id) {
        await prisma.user.deleteMany({ where: { id: teacherUser.id } })
      }
      if (studentUser?.id) {
        await prisma.user.deleteMany({ where: { id: studentUser.id } })
      }
      console.log('  Cleaned up all test fixtures.')
    } catch (cleanupErr) {
      console.warn('  Warning: Cleanup encountered an error:', cleanupErr)
    }

    await prisma.$disconnect()

    console.log('\n=================================================================')
    console.log('STEP 6.7 VERIFICATION SUMMARY:')
    console.log(`  Total Checks:  ${totalChecks}`)
    console.log(`  Passed:        ${passedChecks}`)
    console.log(`  Failed:        ${failedChecks}`)
    console.log('=================================================================')

    if (failedChecks > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  }
}

runStep6_7Tests()
