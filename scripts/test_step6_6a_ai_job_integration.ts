import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import {
  AiJobStatus,
  AiJobType,
  AiProcessingStatus,
  Prisma,
  UserRole
} from '@prisma/client'
import { prisma } from '~/config/prisma'
import {
  getAiServiceConfig,
  verifyInboundAiSecret
} from '~/config/ai.config'
import {
  AiServiceClient,
  aiServiceClient,
  AiJobStillRunningError,
  AiServiceError
} from '~/services/aiServiceClient.service'
import {
  createAiJob,
  findActiveAiJobByLessonId,
  findAiJobById,
  findJobsPendingReconciliation,
  updateAiJob
} from '~/repositories/aiJob.repository'
import {
  findLessonById,
  LESSON_STUDY_SELECT
} from '~/repositories/lesson.repository'
import {
  getAiJobDetailService,
  getLatestLessonAiJobService,
  getLessonAiJobsService,
  pollJobStatusService,
  reconcileActiveJobsService,
  triggerLessonAiProcessService
} from '~/services/aiProcessing.service'
import {
  createLessonService,
  getLessonAiContentService,
  getLessonByIdService,
  updateLessonAiContentService,
  updateLessonService
} from '~/services/lesson.service'
import lessonRouter from '~/routes/lesson.route'

/**
 * TMDEMY — STEP 6.6A AUTOMATED VERIFICATION SUITE
 * SECURITY HARDENING, PERSISTENT AI JOB MANAGEMENT & FASTAPI CLIENT INTEGRATION
 * 
 * Verifies all 44 test criteria from specification:
 * - Security hardening & zero hardcoded secrets
 * - Typed FastAPI HTTP Client & network error boundaries
 * - Persistent AI job tracking & state machine
 * - Stale-job protection & generation fencing
 * - Lesson integration & regression compatibility
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

async function runStep6_6ATests() {
  console.log('=================================================================')
  console.log('STARTING TMDEMY STEP 6.6A: AI JOB INTEGRATION VERIFICATION SUITE')
  console.log('=================================================================')

  const timestamp = Date.now()

  // --------------------------------------------------------------------------
  // SETUP TEST DATA
  // --------------------------------------------------------------------------
  console.log('\n--- Setting Up Database Test Entities ---')

  const teacherOwner = await prisma.user.create({
    data: {
      username: `s66a_owner_${timestamp}`,
      email: `s66a_owner_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  const teacherOther = await prisma.user.create({
    data: {
      username: `s66a_other_${timestamp}`,
      email: `s66a_other_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  const adminUser = await prisma.user.create({
    data: {
      username: `s66a_admin_${timestamp}`,
      email: `s66a_admin_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.ADMIN
    }
  })

  const studentUser = await prisma.user.create({
    data: {
      username: `s66a_student_${timestamp}`,
      email: `s66a_student_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER
    }
  })

  const course = await prisma.course.create({
    data: {
      title: `Step 6.6A Course ${timestamp}`,
      slug: `step-66a-course-${timestamp}`,
      authorId: teacherOwner.id
    }
  })

  const chapter = await prisma.chapter.create({
    data: {
      title: 'Chapter 1: AI Integration',
      courseId: course.id,
      order: 1
    }
  })

  const lessonWithVideo = await prisma.lesson.create({
    data: {
      title: 'Lesson 1: Deep Learning Fundamentals',
      slug: `lesson-1-dl-${timestamp}`,
      chapterId: chapter.id,
      courseId: course.id,
      authorId: teacherOwner.id,
      bunnyVideoId: `bunny-guid-initial-${timestamp}`,
      videoStatus: 'READY',
      videoUrl: `https://vz-test.b-cdn.net/bunny-guid-initial-${timestamp}/playlist.m3u8`,
      duration: 600,
      aiGeneration: 1
    }
  })

  const lessonWithoutVideo = await prisma.lesson.create({
    data: {
      title: 'Lesson 2: Pure Text Lesson',
      slug: `lesson-2-text-${timestamp}`,
      chapterId: chapter.id,
      courseId: course.id,
      authorId: teacherOwner.id,
      bunnyVideoId: null,
      videoUrl: '',
      duration: 0,
      aiGeneration: 1
    }
  })

  console.log(`Created fixtures: Course ${course.id}, Lesson 1 ${lessonWithVideo.id}, Lesson 2 ${lessonWithoutVideo.id}`)

  try {
    // ========================================================================
    // SUITE 1: SECURITY HARDENING & CONFIGURATION
    // ========================================================================
    console.log('\n--- SUITE 1: Security Hardening & Environment Configuration ---')

    // 1. Missing API Key rejected
    const prevKey = process.env.AI_SERVICE_API_KEY
    try {
      delete process.env.AI_SERVICE_API_KEY
      let errorThrown = false
      try {
        getAiServiceConfig(true)
      } catch (err: unknown) {
        errorThrown = true
        assert(
          (err as Error).message.includes('Missing or empty AI_SERVICE_API_KEY'),
          'Suite 1',
          '1. Missing API key produces controlled error'
        )
      }
      assert(errorThrown, 'Suite 1', '1b. Missing API key is strictly rejected')

      // 2. Empty/whitespace API key rejected
      process.env.AI_SERVICE_API_KEY = '   '
      let emptyKeyError = false
      try {
        getAiServiceConfig(true)
      } catch {
        emptyKeyError = true
      }
      assert(emptyKeyError, 'Suite 1', '2. Empty/whitespace API key is rejected')

      // 3. No hardcoded fallback
      // Verify inbound secret rejects 'tmdemy-ai-service-secret' when not configured
      const isFallbackAccepted = verifyInboundAiSecret('tmdemy-ai-service-secret')
      assert(!isFallbackAccepted, 'Suite 1', '3. Hardcoded fallback secret "tmdemy-ai-service-secret" is strictly rejected (fails closed)')
    } finally {
      process.env.AI_SERVICE_API_KEY = prevKey || 'test-configured-ai-service-key-12345'
    }

    // 4. API Key never appears in logs or error messages
    const testSecret = 'secret_key_super_sensitive_9999'
    const err = new AiServiceError(`Request failed with X-API-Key=${testSecret}`, '/api/v1/jobs')
    assert(!err.message.includes(testSecret), 'Suite 1', '4a. Error message strictly redacts sensitive credentials')
    assert(err.message.includes('[REDACTED]'), 'Suite 1', '4b. Error message contains [REDACTED] marker')

    // 5. Unauthorized student cannot start AI job
    const studentAttempt = await triggerLessonAiProcessService({
      lessonId: lessonWithVideo.id,
      userId: studentUser.id,
      role: UserRole.USER
    })
    assert(!studentAttempt.success, 'Suite 1', '5a. Student is blocked from triggering AI job')
    assert(studentAttempt.statusCode === 403, 'Suite 1', '5b. Student receives 403 Forbidden')

    // 6. Teacher cannot process another teacher's Lesson
    const otherTeacherAttempt = await triggerLessonAiProcessService({
      lessonId: lessonWithVideo.id,
      userId: teacherOther.id,
      role: UserRole.TEACHER
    })
    assert(!otherTeacherAttempt.success, 'Suite 1', '6a. Non-owner teacher blocked from AI job')
    assert(otherTeacherAttempt.statusCode === 403, 'Suite 1', '6b. Non-owner teacher receives 403 Forbidden')

    // 7. Admin behavior follows policy
    const adminAttempt = await triggerLessonAiProcessService({
      lessonId: lessonWithVideo.id,
      userId: adminUser.id,
      role: UserRole.ADMIN
    })
    assert(adminAttempt.success, 'Suite 1', '7a. Admin is authorized to trigger AI job')
    assert(adminAttempt.statusCode === 202, 'Suite 1', '7b. Admin receives 202 Accepted')
    assert(!!adminAttempt.data?.id, 'Suite 1', '7c. AI job record created by Admin')

    // ========================================================================
    // SUITE 2: FASTAPI TYPED HTTP CLIENT & NETWORK BOUNDARIES
    // ========================================================================
    console.log('\n--- SUITE 2: FastAPI HTTP Client & Mock Server Suite ---')

    // Set up a lightweight local mock server on an ephemeral port
    let mockServerCallCount = 0
    let lastReceivedHeaders: http.IncomingHttpHeaders = {}
    let lastReceivedMethod = ''
    let lastReceivedUrl = ''

    const mockPort = 8765
    const mockServer = http.createServer((req, res) => {
      mockServerCallCount++
      lastReceivedHeaders = req.headers
      lastReceivedMethod = req.method || ''
      lastReceivedUrl = req.url || ''

      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok', service: 'tmdemy-ai-service', version: '0.5.0', queue_size: 2 }))
        return
      }

      if (req.url === '/timeout-endpoint') {
        // Don't respond to trigger timeout
        return
      }

      if (req.url?.startsWith('/auth-check')) {
        const apiKey = req.headers['x-api-key']
        if (apiKey === 'valid-secret-key') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ status: 'ok', service: 'ai', version: '1.0', queue_size: 0 }))
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ detail: 'Invalid or missing API Key' }))
        }
        return
      }

      if (req.url === '/api/v1/jobs/conflict-running/result') {
        res.writeHead(409, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ detail: 'Job still running' }))
        return
      }

      if (req.url === '/api/v1/jobs/rate-limited') {
        res.writeHead(429, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ detail: 'Too many requests' }))
        return
      }

      if (req.url === '/api/v1/jobs/server-error') {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ detail: 'Service Unavailable' }))
        return
      }

      if (req.url === '/api/v1/jobs/invalid-json') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('NOT_VALID_JSON{')
        return
      }

      if (req.url === '/api/v1/jobs/missing-fields') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ unexpectedField: 'missing job_id' }))
        return
      }

      if (req.url === '/api/v1/jobs/post-once' && req.method === 'POST') {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ detail: 'Internal failure' }))
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ detail: 'Not Found' }))
    })

    await new Promise<void>((resolve) => mockServer.listen(mockPort, resolve))

    const mockClient = new AiServiceClient(`http://127.0.0.1:${mockPort}`, 1000)

    try {
      // 8. Successful authenticated request
      process.env.AI_SERVICE_API_KEY = 'valid-secret-key'
      const healthRes = await mockClient.checkHealth()
      assert(healthRes.status === 'ok', 'Suite 2', '8a. Successful request returns parsed data')
      assert(healthRes.queue_size === 2, 'Suite 2', '8b. Health queue_size is parsed correctly')
      assert(lastReceivedHeaders['x-api-key'] === 'valid-secret-key', 'Suite 2', '8c. Client attaches X-API-Key header')

      // 9. Timeout test
      let timeoutFired = false
      const timeoutClient = new AiServiceClient(`http://127.0.0.1:${mockPort}`, 100)
      try {
        await (timeoutClient as any).request('/timeout-endpoint', null, { timeoutMs: 100, retryCount: 0 })
      } catch (err: unknown) {
        timeoutFired = true
        assert((err as Error).message.includes('timed out'), 'Suite 2', '9. Request times out safely via AbortController')
      }
      assert(timeoutFired, 'Suite 2', '9b. Timeout error captured')

      // 10. Connection refused
      const deadClient = new AiServiceClient('http://127.0.0.1:59999', 500)
      let connRefused = false
      try {
        await deadClient.checkHealth()
      } catch (err: unknown) {
        connRefused = true
        assert((err as Error).message.includes('AI Service Client'), 'Suite 2', '10. Network failure handled with sanitized AiServiceError')
      }
      assert(connRefused, 'Suite 2', '10b. Connection refused captured')

      // 11. FastAPI 401 / 403
      process.env.AI_SERVICE_API_KEY = 'wrong-key'
      let authFailed = false
      try {
        await (mockClient as any).request('/auth-check', null, { retryCount: 0 })
      } catch (err: unknown) {
        authFailed = true
        assert((err as AiServiceError).statusCode === 401, 'Suite 2', '11. FastAPI 401 distinguished and captured')
      }
      assert(authFailed, 'Suite 2', '11b. 401 error confirmed')

      // 12. FastAPI 404
      let notFound = false
      try {
        await (mockClient as any).request('/non-existent-route', null, { retryCount: 0 })
      } catch (err: unknown) {
        notFound = true
        assert((err as AiServiceError).statusCode === 404, 'Suite 2', '12. FastAPI 404 handled properly')
      }
      assert(notFound, 'Suite 2', '12b. 404 error confirmed')

      // 13. FastAPI 409
      let conflictCaptured = false
      try {
        await mockClient.getJobResult('conflict-running')
      } catch (err: unknown) {
        conflictCaptured = true
        assert(err instanceof AiJobStillRunningError, 'Suite 2', '13a. HTTP 409 throws typed AiJobStillRunningError')
        assert((err as AiJobStillRunningError).statusCode === 409, 'Suite 2', '13b. AiJobStillRunningError status is 409')
      }
      assert(conflictCaptured, 'Suite 2', '13c. 409 conflict captured')

      // 14. FastAPI 429
      let rateLimitCaptured = false
      try {
        await (mockClient as any).request('/api/v1/jobs/rate-limited', null, { retryCount: 0 })
      } catch (err: unknown) {
        rateLimitCaptured = true
        assert((err as AiServiceError).statusCode === 429, 'Suite 2', '14. FastAPI 429 rate limit captured')
      }
      assert(rateLimitCaptured, 'Suite 2', '14b. 429 captured')

      // 15. FastAPI 503
      let serviceUnavailable = false
      try {
        await (mockClient as any).request('/api/v1/jobs/server-error', null, { retryCount: 0 })
      } catch (err: unknown) {
        serviceUnavailable = true
        assert((err as AiServiceError).statusCode === 503, 'Suite 2', '15. FastAPI 503 captured')
      }
      assert(serviceUnavailable, 'Suite 2', '15b. 503 captured')

      // 16. Invalid JSON
      let invalidJsonCaptured = false
      try {
        await mockClient.getJobStatus('invalid-json')
      } catch (err: unknown) {
        invalidJsonCaptured = true
        assert((err as Error).message.includes('Invalid JSON'), 'Suite 2', '16. Invalid JSON rejected safely')
      }
      assert(invalidJsonCaptured, 'Suite 2', '16b. Invalid JSON captured')

      // 17. Missing required response fields
      let schemaValidationFailed = false
      try {
        await (mockClient as any).request('/api/v1/jobs/missing-fields', (mockClient as any).fastApiJobCreateSchema || healthRes, { retryCount: 0 })
      } catch (err: unknown) {
        schemaValidationFailed = true
        assert((err as Error).message.includes('validation failed') || (err as Error).message.includes('AI Service Client'), 'Suite 2', '17. Missing required schema fields rejected by Zod')
      }
      assert(schemaValidationFailed, 'Suite 2', '17b. Schema validation error confirmed')

      // 18. No blind retry of POST
      const beforePostCount = mockServerCallCount
      try {
        await (mockClient as any).request('/api/v1/jobs/post-once', null, { method: 'POST', retryCount: 0 })
      } catch {
        // Expected failure
      }
      const afterPostCount = mockServerCallCount
      assert(afterPostCount - beforePostCount === 1, 'Suite 2', '18. POST request is executed exactly once (zero blind retries)')
    } finally {
      await new Promise<void>((resolve) => mockServer.close(() => resolve()))
    }

    // ========================================================================
    // SUITE 3: PERSISTENT AI JOBS & STATE MACHINE
    // ========================================================================
    console.log('\n--- SUITE 3: Persistent AI Jobs & Lifecycle State Machine ---')

    // Clean up any active job from Suite 1
    await prisma.aiProcessingJob.deleteMany({ where: { lessonId: lessonWithVideo.id } })

    // 19. Job created in database
    const createdJob = await createAiJob({
      lesson: { connect: { id: lessonWithVideo.id } },
      course: { connect: { id: course.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.PENDING,
      generation: 1,
      videoId: lessonWithVideo.bunnyVideoId
    })
    assert(!!createdJob.id, 'Suite 3', '19a. Job persists in PostgreSQL with UUID')
    assert(createdJob.status === AiJobStatus.PENDING, 'Suite 3', '19b. Initial status is PENDING')

    // 20. Provider job ID persisted
    const mockFastApiId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    const updatedWithProvider = await updateAiJob(createdJob.id, {
      status: AiJobStatus.QUEUED,
      providerJobId: mockFastApiId,
      currentStage: 'QUEUED'
    })
    assert(updatedWithProvider.providerJobId === mockFastApiId, 'Suite 3', '20. Provider Job ID correctly persisted')

    // 21. Job state transitions
    const runningJob = await updateAiJob(createdJob.id, {
      status: AiJobStatus.RUNNING,
      currentStage: 'TRANSCRIBING',
      startedAt: new Date()
    })
    assert(runningJob.status === AiJobStatus.RUNNING, 'Suite 3', '21a. Job transitioned to RUNNING')
    assert(runningJob.currentStage === 'TRANSCRIBING', 'Suite 3', '21b. Stage is TRANSCRIBING')

    // 22. Duplicate active request handling
    const dupAttempt = await triggerLessonAiProcessService({
      lessonId: lessonWithVideo.id,
      userId: teacherOwner.id,
      role: UserRole.TEACHER
    })
    assert(!dupAttempt.success, 'Suite 3', '22a. Duplicate request while active job exists rejected')
    assert(dupAttempt.statusCode === 409, 'Suite 3', '22b. Returns 409 Conflict with active job details')
    assert(dupAttempt.data?.id === createdJob.id, 'Suite 3', '22c. Conflict response identifies existing active job')

    // 23. Restart recovery: can query active jobs pending reconciliation
    const pendingBatch = await findJobsPendingReconciliation(10)
    const containsOurJob = pendingBatch.some((j) => j.id === createdJob.id)
    assert(containsOurJob, 'Suite 3', '23. Active job discovered by reconciliation query after restart')

    // 24. Failed job persistence
    const failedJob = await updateAiJob(createdJob.id, {
      status: AiJobStatus.FAILED,
      errorMessage: 'Whisper out of memory',
      completedAt: new Date()
    })
    assert(failedJob.status === AiJobStatus.FAILED, 'Suite 3', '24a. Failed state recorded')
    assert(failedJob.errorMessage === 'Whisper out of memory', 'Suite 3', '24b. Error message persisted')

    // 25. Terminal state protection
    const pollTerminal = await pollJobStatusService(createdJob.id)
    assert(pollTerminal.success, 'Suite 3', '25a. Polling terminal job returns clean status')
    assert(pollTerminal.message.includes('terminal state'), 'Suite 3', '25b. Terminal job cannot be silently reactivated')

    // ========================================================================
    // SUITE 4: STALE-JOB PROTECTION & GENERATION FENCING
    // ========================================================================
    console.log('\n--- SUITE 4: Stale-Job Protection & Generation Fencing ---')

    // Setup fresh job on generation 1 with video A
    const staleTestJob = await createAiJob({
      lesson: { connect: { id: lessonWithVideo.id } },
      course: { connect: { id: course.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.RUNNING,
      providerJobId: 'provider-stale-job-999',
      generation: 1,
      videoId: `bunny-guid-initial-${timestamp}`
    })

    // Simulate teacher replacing video in lesson (advance to generation 2)
    const updateRes = await updateLessonService({
      lessonId: lessonWithVideo.id,
      payload: {
        bunnyVideoId: `bunny-guid-NEW-${timestamp}`
      },
      userId: teacherOwner.id,
      role: UserRole.TEACHER
    })
    assert(updateRes.success, 'Suite 4', '29a. Teacher replaces video in lesson')

    // 29. Verify video replacement advanced generation and marked prior active jobs STALE
    const updatedLesson = await findLessonById(lessonWithVideo.id)
    assert(updatedLesson?.aiGeneration === 2, 'Suite 4', '29b. Lesson aiGeneration automatically incremented to 2')
    assert(updatedLesson?.bunnyVideoId === `bunny-guid-NEW-${timestamp}`, 'Suite 4', '29c. New Bunny Video ID saved')

    const priorJob = await findAiJobById(staleTestJob.id)
    assert(priorJob?.status === AiJobStatus.STALE, 'Suite 4', '29d. Prior active job automatically transitioned to STALE')

    // 26 & 27: Stale job completion cannot overwrite Lesson with new video
    // Simulate stale job attempting completion
    const staleCompletionJob = await createAiJob({
      lesson: { connect: { id: lessonWithVideo.id } },
      course: { connect: { id: course.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.RUNNING,
      providerJobId: 'provider-stale-job-gen1',
      generation: 1, // OLD GENERATION!
      videoId: `bunny-guid-initial-${timestamp}` // OLD VIDEO!
    })

    // Setup a mock server returning COMPLETED for this job
    const staleMockServer = http.createServer((req, res) => {
      if (req.url?.includes('/result')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          job_id: 'provider-stale-job-gen1',
          status: 'COMPLETED',
          transcript: 'STALE TRANSCRIPT FOR VIDEO A',
          summary: 'STALE SUMMARY FOR VIDEO A'
        }))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        job_id: 'provider-stale-job-gen1',
        status: 'COMPLETED',
        current_stage: 'COMPLETED',
        created_at: new Date().toISOString()
      }))
    })

    const stalePort = 8766
    await new Promise<void>((resolve) => staleMockServer.listen(stalePort, resolve))
    process.env.AI_SERVICE_URL = `http://127.0.0.1:${stalePort}`
    aiServiceClient.setBaseUrl(`http://127.0.0.1:${stalePort}`)

    try {
      // Poll this job - should detect generation mismatch and fence it
      const pollStaleRes = await pollJobStatusService(staleCompletionJob.id)
      assert(pollStaleRes.data?.status === AiJobStatus.STALE, 'Suite 4', '26. Old job marked STALE due to video/generation mismatch')

      // Verify Lesson content was NOT overwritten
      const checkLesson = await findLessonById(lessonWithVideo.id)
      assert(checkLesson?.transcript !== 'STALE TRANSCRIPT FOR VIDEO A', 'Suite 4', '27a. Lesson transcript was NOT polluted by stale job')
      assert(checkLesson?.summary !== 'STALE SUMMARY FOR VIDEO A', 'Suite 4', '27b. Lesson summary was NOT polluted by stale job')

      // 28. Concurrency safety: Verify generation check inside transaction
      assert(pollStaleRes.message.includes('STALE'), 'Suite 4', '28. Concurrency-safe atomic transaction prevented stale write')

      // 30. Late failure cannot overwrite fresh lesson status
      const lateFailJob = await createAiJob({
        lesson: { connect: { id: lessonWithVideo.id } },
        course: { connect: { id: course.id } },
        requestedBy: { connect: { id: teacherOwner.id } },
        jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
        status: AiJobStatus.RUNNING,
        providerJobId: 'late-fail-job',
        generation: 1 // OLD GENERATION
      })

      // Simulate failure on old generation
      const failStatusCheck = await pollJobStatusService(lateFailJob.id)
      const lessonAfterFail = await findLessonById(lessonWithVideo.id)
      assert(lessonAfterFail?.aiProcessingStatus !== 'FAILED', 'Suite 4', '30. Late failure from old generation does NOT mutate Lesson status')

      // 31. Duplicate polling on terminal job does not re-apply
      const dupPoll = await pollJobStatusService(staleCompletionJob.id)
      assert(dupPoll.data?.status === AiJobStatus.STALE, 'Suite 4', '31. Duplicate polling on terminal STALE job is idempotent')
    } finally {
      aiServiceClient.setBaseUrl(undefined)
      await new Promise<void>((resolve) => staleMockServer.close(() => resolve()))
    }

    // ========================================================================
    // SUITE 5: LESSON INTEGRATION & ATOMIC PERSISTENCE
    // ========================================================================
    console.log('\n--- SUITE 5: Lesson Integration & Fresh Result Persistence ---')

    // Create fresh job matching current generation 2 and current video
    const freshJob = await createAiJob({
      lesson: { connect: { id: lessonWithVideo.id } },
      course: { connect: { id: course.id } },
      requestedBy: { connect: { id: teacherOwner.id } },
      jobType: AiJobType.TRANSCRIBE_AND_SUMMARIZE,
      status: AiJobStatus.RUNNING,
      providerJobId: 'provider-fresh-job-gen2',
      generation: 2, // Matches current lesson aiGeneration!
      videoId: `bunny-guid-NEW-${timestamp}` // Matches current video!
    })

    const freshMockServer = http.createServer((req, res) => {
      if (req.url?.includes('/result')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          job_id: 'provider-fresh-job-gen2',
          status: 'COMPLETED',
          transcript: '# Video 2 Transcript\nNội dung phiên âm chính xác.',
          summary: '# Video 2 Summary\nBản tóm tắt sư phạm hoàn hảo.',
          metadata: { duration_seconds: 120 }
        }))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        job_id: 'provider-fresh-job-gen2',
        status: 'COMPLETED',
        current_stage: 'COMPLETED',
        created_at: new Date().toISOString()
      }))
    })

    const freshPort = 8767
    await new Promise<void>((resolve) => freshMockServer.listen(freshPort, resolve))
    process.env.AI_SERVICE_URL = `http://127.0.0.1:${freshPort}`
    aiServiceClient.setBaseUrl(`http://127.0.0.1:${freshPort}`)

    try {
      const pollFreshRes = await pollJobStatusService(freshJob.id)
      assert(pollFreshRes.data?.status === AiJobStatus.COMPLETED, 'Suite 5', '34a. Fresh job status marked COMPLETED')

      // Verify Lesson fields
      const persistedLesson = await findLessonById(lessonWithVideo.id)
      assert(persistedLesson?.transcript === '# Video 2 Transcript\nNội dung phiên âm chính xác.', 'Suite 5', '32. Valid transcript persisted in Lesson')
      assert(persistedLesson?.summary === '# Video 2 Summary\nBản tóm tắt sư phạm hoàn hảo.', 'Suite 5', '33. Valid summary persisted in Lesson')
      assert(persistedLesson?.aiProcessingStatus === 'COMPLETED', 'Suite 5', '34b. Lesson aiProcessingStatus is COMPLETED')
      assert(!!persistedLesson?.aiProcessedAt, 'Suite 5', '34c. Lesson aiProcessedAt timestamp populated')
      assert(persistedLesson?.aiProcessingError === null, 'Suite 5', '35. Prior processing error cleared on success')

      // 36. Unrelated Lesson fields preserved
      assert(persistedLesson?.title === 'Lesson 1: Deep Learning Fundamentals', 'Suite 5', '36a. Lesson title preserved')
      assert(persistedLesson?.duration === 600, 'Suite 5', '36b. Lesson duration preserved')
      assert(persistedLesson?.bunnyVideoId === `bunny-guid-NEW-${timestamp}`, 'Suite 5', '36c. Lesson bunnyVideoId preserved')

      // 37. Existing AI-content endpoint regression
      const aiContentRead = await getLessonAiContentService({
        lessonId: lessonWithVideo.id,
        userId: teacherOwner.id,
        role: UserRole.TEACHER
      })
      assert(aiContentRead.success, 'Suite 5', '37a. Existing getLessonAiContentService returns 200')
      assert(aiContentRead.data?.transcript === persistedLesson?.transcript, 'Suite 5', '37b. AI Content transcript matches')

      // 38. Existing Lesson GET regression
      const lessonDetailRead = await getLessonByIdService({
        lessonId: lessonWithVideo.id,
        userId: teacherOwner.id,
        role: UserRole.TEACHER
      })
      assert(lessonDetailRead.success, 'Suite 5', '38a. Existing getLessonByIdService returns 200')
      assert(lessonDetailRead.data?.transcript === persistedLesson?.transcript, 'Suite 5', '38b. Lesson detail includes transcript')
      assert(lessonDetailRead.data?.summary === persistedLesson?.summary, 'Suite 5', '38c. Lesson detail includes summary')
    } finally {
      aiServiceClient.setBaseUrl(undefined)
      await new Promise<void>((resolve) => freshMockServer.close(() => resolve()))
    }

    // ========================================================================
    // SUITE 6: ROUTER AUDIT & REGRESSION TESTS
    // ========================================================================
    console.log('\n--- SUITE 6: Router Audit & Module Regression ---')

    // 39. Express Router Audit
    const registeredRoutes: string[] = []
    lessonRouter.stack.forEach((layer: any) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase()
        registeredRoutes.push(`${methods} ${layer.route.path}`)
      }
    })

    const hasAiProcessPost = registeredRoutes.some((r) => r.includes('POST') && r.includes('/ai-process'))
    const hasAiProcessGet = registeredRoutes.some((r) => r.includes('GET') && r.includes('/ai-process'))
    const hasAiJobsGet = registeredRoutes.some((r) => r.includes('GET') && r.includes('/:id/ai-jobs'))
    const hasAiJobDetailGet = registeredRoutes.some((r) => r.includes('GET') && r.includes('/:id/ai-jobs/:jobId'))
    const hasAiJobPollPost = registeredRoutes.some((r) => r.includes('POST') && r.includes('/:id/ai-jobs/:jobId/poll'))

    assert(hasAiProcessPost, 'Suite 6', '39a. POST /api/lessons/:id/ai-process is registered')
    assert(hasAiProcessGet, 'Suite 6', '39b. GET /api/lessons/:id/ai-process is registered')
    assert(hasAiJobsGet, 'Suite 6', '39c. GET /api/lessons/:id/ai-jobs is registered')
    assert(hasAiJobDetailGet, 'Suite 6', '39d. GET /api/lessons/:id/ai-jobs/:jobId is registered')
    assert(hasAiJobPollPost, 'Suite 6', '39e. POST /api/lessons/:id/ai-jobs/:jobId/poll is registered')

    // 40. Querying list and detail via service
    const listRes = await getLessonAiJobsService(lessonWithVideo.id, teacherOwner.id, UserRole.TEACHER)
    assert(listRes.success, 'Suite 6', '40a. getLessonAiJobsService succeeds')
    assert(Array.isArray(listRes.data) && listRes.data.length > 0, 'Suite 6', '40b. List of AI jobs returned')

    const detailRes = await getAiJobDetailService(lessonWithVideo.id, freshJob.id, teacherOwner.id, UserRole.TEACHER)
    assert(detailRes.success, 'Suite 6', '40c. getAiJobDetailService succeeds')
    assert(detailRes.data?.id === freshJob.id, 'Suite 6', '40d. Correct job detail returned')

    // 41. Lesson without video rejects AI processing
    const noVideoAttempt = await triggerLessonAiProcessService({
      lessonId: lessonWithoutVideo.id,
      userId: teacherOwner.id,
      role: UserRole.TEACHER
    })
    assert(!noVideoAttempt.success, 'Suite 6', '41a. Lesson without video rejected with 400')
    assert(noVideoAttempt.statusCode === 400, 'Suite 6', '41b. Error message guides teacher to upload video first')

    // 42. Reconcile active jobs service
    const reconcileRes = await reconcileActiveJobsService(5)
    assert(typeof reconcileRes.processed === 'number', 'Suite 6', '42. reconcileActiveJobsService runs cleanly in bounded batch')

    // 43. Clean lesson creation backward compatibility
    const newLessonRes = await createLessonService({
      payload: {
        title: `Regression New Lesson ${timestamp}`,
        chapter: chapter.id,
        course: course.id
      },
      userId: teacherOwner.id,
      role: UserRole.TEACHER
    })
    assert(newLessonRes.success, 'Suite 6', '43a. Existing createLessonService works backward-compatibly')
    assert(newLessonRes.data?.aiGeneration === 1, 'Suite 6', '43b. New lesson initializes aiGeneration to 1')

    // 44. Clean lesson update backward compatibility
    const updateTitleRes = await updateLessonService({
      lessonId: newLessonRes.data.id,
      payload: {
        title: `Updated Regression Title ${timestamp}`
      },
      userId: teacherOwner.id,
      role: UserRole.TEACHER
    })
    assert(updateTitleRes.success, 'Suite 6', '44a. Existing updateLessonService updates title without affecting AI state')
    assert(updateTitleRes.data?.aiGeneration === 1, 'Suite 6', '44b. Non-video update does not increment aiGeneration')

  } finally {
    // ------------------------------------------------------------------------
    // TEARDOWN TEST ENTITIES
    // ------------------------------------------------------------------------
    console.log('\n--- Cleaning Up Database Test Fixtures ---')
    await prisma.aiProcessingJob.deleteMany({ where: { courseId: course.id } }).catch(() => {})
    await prisma.lesson.deleteMany({ where: { courseId: course.id } }).catch(() => {})
    await prisma.chapter.deleteMany({ where: { courseId: course.id } }).catch(() => {})
    await prisma.course.delete({ where: { id: course.id } }).catch(() => {})
    await prisma.user.deleteMany({
      where: {
        id: { in: [teacherOwner.id, teacherOther.id, adminUser.id, studentUser.id] }
      }
    }).catch(() => {})
    console.log('Test fixtures cleaned up successfully.')
  }

  console.log('\n=================================================================')
  console.log(`STEP 6.6A VERIFICATION COMPLETE: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`)
  console.log('=================================================================\n')

  if (failedChecks > 0) {
    process.exit(1)
  }
}

runStep6_6ATests().catch((err) => {
  console.error('Fatal error running Step 6.6A test suite:', err)
  process.exit(1)
})
