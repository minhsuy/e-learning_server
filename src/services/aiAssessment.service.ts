import { ExerciseDifficulty, ExerciseSource, ExerciseStatus, Prisma, QuestionType } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { findLessonById } from '~/repositories/lesson.repository'
import { findCourseById } from '~/repositories/course.repository'
import {
  findQuizByLessonId,
  createQuiz,
  updateQuiz,
  deleteQuiz
} from '~/repositories/quiz.repository'
import {
  createQuestion,
  deleteQuestionsByQuizId
} from '~/repositories/question.repository'
import { findSubmissionsByQuizId } from '~/repositories/quizSubmission.repository'
import {
  createCodingExerciseService,
  updateCodingExerciseService
} from '~/services/codingExercise.service'
import {
  findCodingExercisesByLesson
} from '~/repositories/codingExercise.repository'
import { verifyReferenceSolution } from '~/services/codeExecution.service'
import { defaultE2BClient, IE2BClient } from '~/integrations/e2b/e2b.client'
import {
  aiServiceClient,
  AiServiceClient,
  AiServiceError,
  FastApiQuizGenerateRequest,
  FastApiCodingExerciseGenerateRequest,
  FastApiQuizGenerateResponse,
  FastApiCodingExerciseGenerateResponse,
  FastApiJobCreate
} from '~/services/aiServiceClient.service'
import {
  GenerateAiQuizRequest,
  generateAiQuizRequestSchema,
  GenerateAiCodingExerciseRequest,
  generateAiCodingExerciseRequestSchema,
  SaveApprovedAiQuizRequest,
  saveApprovedAiQuizRequestSchema,
  SaveApprovedAiCodingExerciseRequest,
  saveApprovedAiCodingExerciseRequestSchema
} from '~/models/aiAssessment.model'
import { UserRole } from '~/types/enum'
import { ServiceResponse } from '~/types/type'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { DEFAULT_AI_MODEL_ID, isValidAiModelId, resolveAiModelId } from '~/config/aiModels.config'

/**
 * TMDEMY — AI ASSESSMENT INTEGRATION SERVICE (STEP 7C)
 * 
 * Orchestrates AI-driven assessment generation from FastAPI to Node.js / PostgreSQL:
 * 1. AI Quiz Generation (Step 7A integration)
 * 2. AI Coding Exercise Generation (Step 7B integration)
 * 3. E2B Sandbox Reference Solution Verification
 * 4. Submission-history preservation and revision protection
 * 5. Draft-first teacher review lifecycle (never published directly to students)
 */

// ==========================================
// 0. LESSON AUTHORIZATION & CONTENT RESOLUTION
// ==========================================

interface LessonContentResolution {
  success: boolean
  statusCode?: number
  message?: string
  lesson?: any
  course?: any
  transcript?: string
  summary?: string | null
}

export async function resolveLessonAiContentAndAuth(
  lessonId: string,
  userId: string,
  role: string,
  tx?: PrismaTransactionClient
): Promise<LessonContentResolution> {
  // 1. UUID syntax check
  if (!isValidUUID(lessonId)) {
    return { success: false, statusCode: 400, message: 'Invalid Lesson UUID format' }
  }

  // 2. Fetch Lesson
  const lesson = await findLessonById(lessonId, tx)
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  // 3. Fetch Course
  const course = await findCourseById(lesson.courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 4. Role Authorization & Ownership Check
  const normalizedRole = String(role || '').toUpperCase()
  const isAdmin = normalizedRole === 'ADMIN'
  const isTeacher = normalizedRole === 'TEACHER'

  if (!isAdmin && !isTeacher) {
    return {
      success: false,
      statusCode: 403,
      message: 'FORBIDDEN - Only teachers or administrators can generate assessments'
    }
  }

  if (isTeacher && course.authorId !== userId) {
    return {
      success: false,
      statusCode: 403,
      message: 'FORBIDDEN - You do not own the course containing this lesson'
    }
  }

  // 5. Canonical Content Resolution
  // Policy: Prefer refined transcript, fallback to original or legacy transcript
  const transcript = (
    lesson.transcriptRefined?.trim() ||
    lesson.transcriptOriginal?.trim() ||
    lesson.transcript?.trim() ||
    ''
  )

  const summary = lesson.summary?.trim() || null

  if (!transcript || transcript.length < 50) {
    return {
      success: false,
      statusCode: 400,
      message: 'Bài học chưa có nội dung phiên âm (transcript) đạt chuẩn để tạo bài kiểm tra.'
    }
  }

  return {
    success: true,
    lesson,
    course,
    transcript,
    summary
  }
}

// ==========================================
// 1. QUIZ GENERATION SERVICE (STEP 7A)
// ==========================================

export const generateAiQuizForLessonService = async (
  {
    lessonId,
    userId,
    role,
    input
  }: {
    lessonId: string
    userId: string
    role: string
    input: unknown
  },
  aiClient: AiServiceClient = aiServiceClient,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  // 1. Validate Input Payload with Zod
  const parseResult = generateAiQuizRequestSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed for AI quiz generation request',
      errors: parseResult.error.flatten().fieldErrors
    }
  }
  const data: GenerateAiQuizRequest = parseResult.data

  // 2. Authorization & Content Resolution
  const contentRes = await resolveLessonAiContentAndAuth(lessonId, userId, role, tx)
  if (!contentRes.success || !contentRes.lesson || !contentRes.transcript) {
    return {
      success: false,
      statusCode: contentRes.statusCode || 400,
      message: contentRes.message || 'Failed to resolve lesson content'
    }
  }
  const { lesson, transcript, summary } = contentRes

  // 3. Existing Quiz & Submission Protection (Mandatory Safe Strategy)
  const existingQuiz = await findQuizByLessonId(lesson.id, tx)
  if (existingQuiz) {
    const submissions = await findSubmissionsByQuizId(existingQuiz.id, tx)
    if (submissions && submissions.length > 0) {
      if (!data.previewOnly) {
        return {
          success: false,
          statusCode: 409,
          message: 'Bài học đã có Quiz với lượt làm bài của học viên. Không thể ghi đè Quiz này để bảo toàn lịch sử chấm điểm.'
        }
      }
    } else if (!data.confirmOverwrite && !data.previewOnly) {
      return {
        success: false,
        statusCode: 409,
        message: 'Bài học đã có Quiz. Vui lòng bật confirmOverwrite: true để ghi đè hoặc previewOnly: true để xem trước.'
      }
    }
  }

  // 4. Validate Model selection if provided
  if (data.model) {
    if (!isValidAiModelId(data.model)) {
      return {
        success: false,
        statusCode: 400,
        message: `Mô hình AI '${data.model}' không hợp lệ. Hệ thống chỉ sử dụng duy nhất mô hình mặc định (${DEFAULT_AI_MODEL_ID}).`
      }
    }
  }

  // 5. FastAPI Request Dispatching
  const fastApiPayload: FastApiQuizGenerateRequest = {
    lesson_title: lesson.title,
    transcript,
    summary,
    question_count: data.questionCount,
    difficulty: data.difficulty,
    teacher_instructions: data.teacherInstructions,
    language: data.language,
    async_mode: data.asyncMode,
    model: resolveAiModelId(data.model)
  }

  let aiRes: FastApiQuizGenerateResponse | FastApiJobCreate
  try {
    aiRes = await aiClient.generateQuizFromAI(fastApiPayload)
  } catch (err: unknown) {
    if (err instanceof AiServiceError) {
      const statusCode = err.statusCode || 502
      return {
        success: false,
        statusCode,
        message: `FastAPI AI microservice failed: ${err.message}`
      }
    }
    const genericMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      statusCode: 502,
      message: `Failed to connect to FastAPI AI microservice: ${genericMsg}`
    }
  }

  // Handle Async Mode
  if (data.asyncMode) {
    return {
      success: true,
      statusCode: 202,
      message: 'AI Quiz generation job submitted successfully',
      data: aiRes
    }
  }

  const syncResult = aiRes as FastApiQuizGenerateResponse

  // 5. Post-AI Domain Checks (Options & Uniqueness validation)
  const questions = syncResult.data.questions
  if (!questions || questions.length === 0) {
    return {
      success: false,
      statusCode: 502,
      message: 'AI microservice returned empty question set'
    }
  }

  // Check for duplicate questions or options within any question
  const questionTitles = new Set<string>()
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (questionTitles.has(q.content.toLowerCase().trim())) {
      return {
        success: false,
        statusCode: 502,
        message: `AI generated duplicate question: "${q.content}"`
      }
    }
    questionTitles.add(q.content.toLowerCase().trim())

    const optionTexts = new Set(q.options.map((o) => o.content.toLowerCase().trim()))
    if (optionTexts.size !== 4) {
      return {
        success: false,
        statusCode: 502,
        message: `Question "${q.content}" has duplicate options among the 4 choices`
      }
    }
  }

  // 6. Preview Mode Check
  if (data.previewOnly) {
    return {
      success: true,
      statusCode: 200,
      message: 'AI Quiz generated successfully (Preview Mode)',
      data: {
        previewOnly: true,
        lessonId: lesson.id,
        title: syncResult.data.title,
        description: syncResult.data.description,
        difficulty: syncResult.data.difficulty,
        questions: questions.map((q) => ({
          question: q.content,
          type: q.type,
          difficulty: q.difficulty,
          options: q.options.map((o) => o.content),
          optionsDetailed: q.options.map((o) => ({
            id: o.id,
            text: o.content,
            isCorrect: o.isCorrect
          })),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          sourceTimestamp: q.sourceTimestamp
        })),
        metadata: syncResult.metadata
      }
    }
  }

  // 7. Atomic Database Persistence
  const executePersistence = async (innerTx: PrismaTransactionClient) => {
    let quiz = existingQuiz

    if (existingQuiz) {
      // Overwrite existing questions
      await deleteQuestionsByQuizId(existingQuiz.id, innerTx)
      quiz = await updateQuiz(
        existingQuiz.id,
        {
          title: syncResult.data.title,
          description: syncResult.data.description || '',
          passingGrade: 70
        },
        innerTx
      )
    } else {
      quiz = await createQuiz(
        {
          lessonId: lesson.id,
          courseId: lesson.courseId,
          createdById: userId,
          title: syncResult.data.title,
          description: syncResult.data.description || '',
          duration: Math.max(5, questions.length * 2),
          passingGrade: 70
        },
        innerTx
      )
    }

    const createdQuestions = []
    for (const q of questions) {
      const qRecord = await createQuestion(
        {
          quizId: quiz.id,
          type: QuestionType.MULTIPLE_CHOICE,
          title: q.content,
          answer: q.correctAnswer,
          points: 1,
          options: q.options.map((o) => o.content)
        },
        innerTx
      )
      createdQuestions.push({
        ...withCompatId(qRecord),
        explanation: q.explanation,
        sourceTimestamp: q.sourceTimestamp
      })
    }

    return { quiz, createdQuestions }
  }

  const persisted = tx
    ? await executePersistence(tx)
    : await prisma.$transaction(executePersistence)

  return {
    success: true,
    statusCode: existingQuiz ? 200 : 201,
    message: existingQuiz
      ? 'Existing Quiz updated with AI-generated questions successfully'
      : 'AI Quiz created and saved successfully',
    data: {
      ...withCompatId(persisted.quiz),
      lesson: lesson.id,
      courseId: lesson.courseId,
      questionCount: persisted.createdQuestions.length,
      questions: persisted.createdQuestions,
      metadata: syncResult.metadata
    }
  }
}

// ==========================================
// 2. CODING EXERCISE PREVIEW TOKEN STORE (PHASE 6)
// ==========================================

interface CodingPreviewTokenRecord {
  token: string
  teacherId: string
  lessonId: string
  exercise: any
  verificationStatus: 'VERIFIED' | 'FAILED' | 'UNVERIFIED'
  verificationFeedback: unknown
  sourceInfo: unknown
  expiresAt: number
}

const codingPreviewStore = new Map<string, CodingPreviewTokenRecord>()

export function createCodingPreviewToken(params: {
  teacherId: string
  lessonId: string
  exercise: any
  verificationStatus: 'VERIFIED' | 'FAILED' | 'UNVERIFIED'
  verificationFeedback: unknown
  sourceInfo: unknown
}): string {
  const now = Date.now()
  for (const [key, item] of codingPreviewStore.entries()) {
    if (item.expiresAt <= now) {
      codingPreviewStore.delete(key)
    }
  }

  const token = `prev_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
  codingPreviewStore.set(token, {
    token,
    teacherId: params.teacherId,
    lessonId: params.lessonId,
    exercise: params.exercise,
    verificationStatus: params.verificationStatus,
    verificationFeedback: params.verificationFeedback,
    sourceInfo: params.sourceInfo,
    expiresAt: now + 30 * 60 * 1000 // 30 minutes TTL
  })
  return token
}

export function consumeCodingPreviewToken(
  token: string,
  userId: string,
  role: string,
  lessonId: string
): CodingPreviewTokenRecord | null {
  const item = codingPreviewStore.get(token)
  if (!item) return null

  if (item.expiresAt <= Date.now()) {
    codingPreviewStore.delete(token)
    return null
  }

  const normalizedRole = String(role || '').toUpperCase()
  const isAdmin = normalizedRole === 'ADMIN'

  if (!isAdmin && item.teacherId !== userId) {
    return null
  }

  if (item.lessonId !== lessonId) {
    return null
  }

  codingPreviewStore.delete(token)
  return item
}

// ==========================================
// 3. CODING EXERCISE GENERATION SERVICE (STEP 7B + E2B)
// ==========================================

export const generateAiCodingExerciseForLessonService = async (
  {
    lessonId,
    userId,
    role,
    input
  }: {
    lessonId: string
    userId: string
    role: string
    input: unknown
  },
  aiClient: AiServiceClient = aiServiceClient,
  e2bClient: IE2BClient = defaultE2BClient,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  // 1. Validate Input Payload with Zod
  const parseResult = generateAiCodingExerciseRequestSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed for AI coding exercise generation request',
      errors: parseResult.error.flatten().fieldErrors
    }
  }
  const data: GenerateAiCodingExerciseRequest = parseResult.data

  // 2. Authorization & Content Resolution
  const contentRes = await resolveLessonAiContentAndAuth(lessonId, userId, role, tx)
  if (!contentRes.success || !contentRes.lesson || !contentRes.transcript) {
    return {
      success: false,
      statusCode: contentRes.statusCode || 400,
      message: contentRes.message || 'Failed to resolve lesson content'
    }
  }
  const { lesson, transcript, summary } = contentRes

  // 2.1 Handle Preview Token Commit (Exact reviewed exercise persistence without re-calling Gemini)
  if (data.previewToken) {
    const tokenRecord = consumeCodingPreviewToken(data.previewToken, userId, role, lesson.id)
    if (!tokenRecord) {
      return {
        success: false,
        statusCode: 400,
        message: 'Preview token không hợp lệ hoặc đã hết hạn (30 phút). Vui lòng sinh bản xem trước mới.'
      }
    }

    const generated = tokenRecord.exercise
    const verificationStatus = tokenRecord.verificationStatus
    const verificationFeedback = tokenRecord.verificationFeedback
    const sourceInfo = tokenRecord.sourceInfo

    const mappedPayload = {
      lessonId: lesson.id,
      title: generated.title,
      slug: generated.slug,
      description: generated.description,
      programmingLanguage: generated.programmingLanguage || data.language || 'javascript',
      difficulty: generated.difficulty,
      starterCode: generated.starterCode,
      referenceSolution: generated.referenceSolution,
      executionContract: generated.executionContract,
      timeLimit: generated.timeLimit,
      memoryLimit: generated.memoryLimit,
      order: generated.order ?? 0,
      testCases: generated.testCases.map((tc: any, idx: number) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        order: tc.order ?? idx,
        weight: tc.weight ?? 50,
        explanation: tc.explanation || null
      }))
    }

    const existingExercises = await findCodingExercisesByLesson(lesson.id, tx)
    const matchingExercise = existingExercises.find((e) => e.slug === generated.slug)

    let saveResult: ServiceResponse
    if (matchingExercise) {
      saveResult = await updateCodingExerciseService(
        {
          userId,
          role,
          exerciseId: matchingExercise.id,
          payload: mappedPayload
        },
        tx
      )
    } else {
      saveResult = await createCodingExerciseService(
        {
          userId,
          role,
          payload: mappedPayload
        },
        tx
      )
    }

    if (!saveResult.success) {
      return saveResult
    }

    return {
      success: true,
      statusCode: saveResult.statusCode || 201,
      message: 'Đã lưu chính xác bài tập Coding Exercise AI dạng DRAFT thành công',
      data: {
        ...saveResult.data,
        verificationStatus,
        verificationFeedback,
        verification: {
          status: verificationStatus,
          score: verificationStatus === 'VERIFIED' ? 100 : (verificationFeedback as any)?.score ?? 0,
          passRate: verificationStatus === 'VERIFIED' ? 100 : (verificationFeedback as any)?.passRate ?? 0,
          passedTests: (verificationFeedback as any)?.passedTests ?? (verificationStatus === 'VERIFIED' ? generated.testCases.length : 0),
          totalTests: (verificationFeedback as any)?.totalTests ?? generated.testCases.length,
          details: (verificationFeedback as any)?.failures ?? []
        },
        sourceInfo
      }
    }
  }

  // 3. Validate Model selection if provided
  if (data.model) {
    if (!isValidAiModelId(data.model)) {
      return {
        success: false,
        statusCode: 400,
        message: `Mô hình AI '${data.model}' không hợp lệ. Hệ thống chỉ sử dụng duy nhất mô hình mặc định (${DEFAULT_AI_MODEL_ID}).`
      }
    }
  }

  // 4. FastAPI Request Dispatching
  const fastApiPayload: FastApiCodingExerciseGenerateRequest = {
    lesson_title: lesson.title,
    transcript,
    summary,
    language: data.language,
    difficulty: data.difficulty,
    exercise_count: data.exerciseCount,
    teacher_instructions: data.teacherInstructions,
    async_mode: data.asyncMode,
    model: resolveAiModelId(data.model)
  }

  let aiRes: FastApiCodingExerciseGenerateResponse | FastApiJobCreate
  try {
    aiRes = await aiClient.generateCodingExerciseFromAI(fastApiPayload)
  } catch (err: unknown) {
    if (err instanceof AiServiceError) {
      const statusCode = err.statusCode || 502
      const isTheoretical = err.message.includes('UNSUPPORTED_THEORETICAL_CONTENT') || statusCode === 422
      return {
        success: false,
        statusCode,
        message: isTheoretical
          ? 'Nội dung bài giảng thuần lý thuyết và không chứa khái niệm lập trình để tạo bài tập thực hành. Vui lòng chọn bài giảng có nội dung lập trình hoặc nhập chỉ dẫn cụ thể cho AI.'
          : `FastAPI AI microservice failed: ${err.message}`
      }
    }
    const genericMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      statusCode: 502,
      message: `Failed to connect to FastAPI AI microservice: ${genericMsg}`
    }
  }

  // Handle Async Mode
  if (data.asyncMode) {
    return {
      success: true,
      statusCode: 202,
      message: 'AI Coding Exercise generation job submitted successfully',
      data: aiRes
    }
  }

  const syncResult = aiRes as FastApiCodingExerciseGenerateResponse
  const generated = syncResult.exercise

  // 4. Validate Positional Arguments Alignment
  const paramCount = generated.executionContract.parameters.length
  const isAligned = generated.testCases.every(
    (tc) => Array.isArray(tc.input) && tc.input.length === paramCount
  )
  if (!isAligned) {
    return {
      success: false,
      statusCode: 502,
      message: 'AI generated test case inputs do not match execution contract parameter count'
    }
  }

  // 5. E2B Sandbox Reference Solution Verification (Phase 6)
  let verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'FAILED' = 'UNVERIFIED'
  let verificationFeedback: unknown = null

  if (data.verifyWithE2b) {
    if (data.language !== 'javascript') {
      verificationStatus = 'UNVERIFIED'
      verificationFeedback = {
        message: `Xác thực Sandbox tự động hiện hỗ trợ cho JavaScript. Ngôn ngữ '${data.language}' được lưu dạng UNVERIFIED để giảng viên tự thẩm duyệt.`
      }
    } else {
      const e2bHealth = await e2bClient.checkHealth().catch(() => ({ ok: false, message: 'Offline' }))

      if (e2bHealth.ok) {
        try {
          const testCaseItems = generated.testCases.map((tc, idx) => ({
            testCaseId: `tc_gen_${idx}`,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            order: tc.order ?? idx,
            weight: tc.weight ?? 50
          }))

          const verification = await verifyReferenceSolution(
            {
              sourceCode: generated.referenceSolution,
              executionContract: generated.executionContract,
              testCases: testCaseItems,
              timeLimit: generated.timeLimit,
              memoryLimit: generated.memoryLimit
            },
            e2bClient
          )

          if (verification.isValid && verification.score === 100) {
            verificationStatus = 'VERIFIED'
            verificationFeedback = {
              score: 100,
              passRate: 100,
              passedTests: verification.result.passedTests,
              totalTests: verification.result.totalTests,
              executionTimeMs: verification.result.totalExecutionTimeMs
            }
          } else {
            verificationStatus = 'FAILED'
            verificationFeedback = {
              score: verification.score,
              passRate: verification.passRate,
              passedTests: verification.result.passedTests,
              totalTests: verification.result.totalTests,
              compilationError: verification.result.compilationError,
              infrastructureError: verification.result.infrastructureError,
              failures: verification.result.results.filter((r) => r.status !== 'PASSED')
            }
          }
        } catch (execErr: unknown) {
          verificationStatus = 'FAILED'
          verificationFeedback = {
            error: execErr instanceof Error ? execErr.message : String(execErr)
          }
        }
      } else {
        verificationStatus = 'UNVERIFIED'
        verificationFeedback = {
          message: 'E2B Sandbox runner is offline or unauthenticated. Preserved as UNVERIFIED for teacher review.'
        }
      }
    }
  }

  // 6. Preview Mode Check
  if (data.previewOnly) {
    const previewToken = createCodingPreviewToken({
      teacherId: userId,
      lessonId: lesson.id,
      exercise: generated,
      verificationStatus,
      verificationFeedback,
      sourceInfo: syncResult.sourceInfo
    })

    return {
      success: true,
      statusCode: 200,
      message: 'AI Coding Exercise generated successfully (Preview Mode)',
      data: {
        previewOnly: true,
        previewToken,
        lessonId: lesson.id,
        title: generated.title,
        slug: generated.slug,
        description: generated.description,
        language: data.language,
        difficulty: generated.difficulty,
        starterCode: generated.starterCode,
        referenceSolution: generated.referenceSolution,
        executionContract: generated.executionContract,
        testCases: generated.testCases,
        verificationStatus,
        verificationFeedback,
        verification: {
          status: verificationStatus,
          score: verificationStatus === 'VERIFIED' ? 100 : (verificationFeedback as any)?.score ?? 0,
          passRate: verificationStatus === 'VERIFIED' ? 100 : (verificationFeedback as any)?.passRate ?? 0,
          passedTests: (verificationFeedback as any)?.passedTests ?? (verificationStatus === 'VERIFIED' ? generated.testCases.length : 0),
          totalTests: (verificationFeedback as any)?.totalTests ?? generated.testCases.length,
          details: (verificationFeedback as any)?.failures ?? []
        },
        exercise: generated,
        sourceInfo: syncResult.sourceInfo
      }
    }
  }

  // 7. Domain Mapping & Revision Management (Direct Persist)
  const mappedPayload = {
    lessonId: lesson.id,
    title: generated.title,
    slug: generated.slug,
    description: generated.description,
    programmingLanguage: generated.programmingLanguage || data.language || 'javascript',
    difficulty: generated.difficulty,
    starterCode: generated.starterCode,
    referenceSolution: generated.referenceSolution,
    executionContract: generated.executionContract,
    timeLimit: generated.timeLimit,
    memoryLimit: generated.memoryLimit,
    order: generated.order ?? 0,
    testCases: generated.testCases.map((tc, idx) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      order: tc.order ?? idx,
      weight: tc.weight ?? 50,
      explanation: tc.explanation || null
    }))
  }

  const existingExercises = await findCodingExercisesByLesson(lesson.id, tx)
  const matchingExercise = existingExercises.find((e) => e.slug === generated.slug)

  let saveResult: ServiceResponse
  if (matchingExercise) {
    saveResult = await updateCodingExerciseService(
      {
        userId,
        role,
        exerciseId: matchingExercise.id,
        payload: mappedPayload
      },
      tx
    )
  } else {
    saveResult = await createCodingExerciseService(
      {
        userId,
        role,
        payload: mappedPayload
      },
      tx
    )
  }

  if (!saveResult.success) {
    return saveResult
  }

  return {
    success: true,
    statusCode: saveResult.statusCode || 201,
    message: saveResult.message,
    data: {
      ...saveResult.data,
      verificationStatus,
      verificationFeedback,
      verification: {
        status: verificationStatus,
        score: verificationStatus === 'VERIFIED' ? 100 : (verificationFeedback as any)?.score ?? 0,
        passRate: verificationStatus === 'VERIFIED' ? 100 : (verificationFeedback as any)?.passRate ?? 0,
        passedTests: (verificationFeedback as any)?.passedTests ?? (verificationStatus === 'VERIFIED' ? generated.testCases.length : 0),
        totalTests: (verificationFeedback as any)?.totalTests ?? generated.testCases.length,
        details: (verificationFeedback as any)?.failures ?? []
      },
      sourceInfo: syncResult.sourceInfo
    }
  }
}

// ==========================================
// 4. ATOMIC SAVE APPROVED AI QUIZ (PHASE 4)
// ==========================================

export const saveApprovedAiQuizForLessonService = async (
  {
    lessonId,
    userId,
    role,
    input
  }: {
    lessonId: string
    userId: string
    role: string
    input: unknown
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  // 1. Validate Input Payload with Zod
  const parseResult = saveApprovedAiQuizRequestSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed for approved quiz save request',
      errors: parseResult.error.flatten().fieldErrors
    }
  }
  const data: SaveApprovedAiQuizRequest = parseResult.data

  // 2. Authorization & Lesson Existence
  const contentRes = await resolveLessonAiContentAndAuth(lessonId, userId, role, tx)
  if (!contentRes.success || !contentRes.lesson) {
    return {
      success: false,
      statusCode: contentRes.statusCode || 400,
      message: contentRes.message || 'Failed to resolve lesson content'
    }
  }
  const { lesson } = contentRes

  // 3. Existing Quiz & Submission Protection
  const existingQuiz = await findQuizByLessonId(lesson.id, tx)
  if (existingQuiz) {
    const submissions = await findSubmissionsByQuizId(existingQuiz.id, tx)
    if (submissions && submissions.length > 0) {
      return {
        success: false,
        statusCode: 409,
        message: 'Bài học đã có Quiz với lượt làm bài của học viên. Không thể ghi đè Quiz này để bảo toàn lịch sử chấm điểm.'
      }
    }
    if (!data.confirmOverwrite) {
      return {
        success: false,
        statusCode: 409,
        message: 'Bài học đã có Quiz. Vui lòng bật confirmOverwrite: true để ghi đè.'
      }
    }
  }

  // 4. Atomic Database Persistence in a single Prisma transaction
  const executePersistence = async (innerTx: PrismaTransactionClient) => {
    let quiz = existingQuiz

    if (existingQuiz) {
      await deleteQuestionsByQuizId(existingQuiz.id, innerTx)
      quiz = await updateQuiz(
        existingQuiz.id,
        {
          title: data.title || existingQuiz.title,
          description: data.description ?? existingQuiz.description,
          duration: data.duration ?? existingQuiz.duration,
          passingGrade: data.passingGrade ?? existingQuiz.passingGrade
        },
        innerTx
      )
    } else {
      quiz = await createQuiz(
        {
          lessonId: lesson.id,
          courseId: lesson.courseId,
          createdById: userId,
          title: data.title || `Quiz - ${lesson.title}`,
          description: data.description || 'Bài kiểm tra trắc nghiệm sinh bởi AI',
          duration: data.duration ?? Math.max(5, data.questions.length * 2),
          passingGrade: data.passingGrade ?? 70
        },
        innerTx
      )
    }

    const createdQuestions = []
    for (const q of data.questions) {
      const qRecord = await createQuestion(
        {
          quizId: quiz.id,
          type: QuestionType.MULTIPLE_CHOICE,
          title: q.question,
          answer: q.correctAnswer,
          points: 1,
          options: q.options
        },
        innerTx
      )
      createdQuestions.push({
        ...withCompatId(qRecord),
        explanation: q.explanation || null,
        sourceTimestamp: q.sourceTimestamp || null
      })
    }

    return { quiz, createdQuestions }
  }

  const persisted = tx
    ? await executePersistence(tx)
    : await prisma.$transaction(executePersistence)

  return {
    success: true,
    statusCode: existingQuiz ? 200 : 201,
    message: existingQuiz
      ? 'Đã cập nhật bài Quiz với bộ câu hỏi đã duyệt thành công'
      : 'Đã lưu bộ câu hỏi vào bài Quiz thành công',
    data: {
      ...withCompatId(persisted.quiz),
      lesson: lesson.id,
      courseId: lesson.courseId,
      questionCount: persisted.createdQuestions.length,
      questions: persisted.createdQuestions
    }
  }
}

// ==========================================
// 5. ATOMIC SAVE APPROVED AI CODING EXERCISE (PHASE 6)
// ==========================================

export const saveApprovedAiCodingExerciseForLessonService = async (
  {
    lessonId,
    userId,
    role,
    input
  }: {
    lessonId: string
    userId: string
    role: string
    input: unknown
  },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const parseResult = saveApprovedAiCodingExerciseRequestSchema.safeParse(input)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation failed for approved coding exercise save request',
      errors: parseResult.error.flatten().fieldErrors
    }
  }

  return generateAiCodingExerciseForLessonService(
    {
      lessonId,
      userId,
      role,
      input: {
        previewToken: parseResult.data.previewToken,
        previewOnly: false
      }
    },
    aiServiceClient,
    defaultE2BClient,
    tx
  )
}

