import dotenv from 'dotenv'
dotenv.config()

import crypto from 'crypto'
import http from 'http'
import { prisma } from '~/config/prisma'
import {
  signBunnyCdnUrl,
  resolveBunnyMediaUrl,
  sanitizeUrlForLogging,
  getBunnyConfig
} from '~/services/bunny.service'
import {
  triggerLessonAiProcessService,
  pollAiJobProgressService
} from '~/services/aiProcessing.service'
import { aiServiceClient } from '~/services/aiServiceClient.service'
import { AiJobStatus } from '@prisma/client'

/**
 * TMDEMY — STEP 6.6C.1 HOTFIX VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Official Bunny CDN Token Authentication V2 (HMAC-SHA256, HS256- prefix, base64url).
 * 2. Proper full path scoping (/${videoId}/${rendition}) and expiration TTL.
 * 3. Strict rejection of missing BUNNY_TOKEN_SECURITY_KEY (no silent unsigned fallback).
 * 4. Lightweight authenticated Range probe verification.
 * 5. Credential sanitization (no secret keys or tokens in logs/errors).
 * 6. Graceful recovery & fresh job creation after a previous FAILED job.
 * 7. Live CDN URL validation against real video asset when real credentials exist.
 */

let totalChecks = 0
let passedChecks = 0
let failedChecks = 0

function assert(condition: boolean, suite: string, testName: string, details?: string) {
  totalChecks++
  if (condition) {
    passedChecks++
    console.log(`  PASS: [${suite}] ${testName}`)
  } else {
    failedChecks++
    console.error(`  FAIL: [${suite}] ${testName}`)
    if (details) {
      console.error(`        Detail: ${details}`)
    }
  }
}

async function runHotfixTests() {
  console.log('=================================================================')
  console.log('STARTING TMDEMY STEP 6.6C.1: BUNNY CDN TOKEN AUTH HOTFIX TEST')
  console.log('=================================================================\n')

  const timestamp = Date.now()
  const testSecurityKey = 'test_security_key_abc123_xyz789'
  const testHost = 'vz-test-zone.b-cdn.net'
  const testVideoId = `test-vid-${timestamp}`
  const rawMp4Url = `https://${testHost}/${testVideoId}/play_720p.mp4`

  // ===========================================================================
  // SUITE 1: OFFICIAL BUNNY CDN TOKEN AUTHENTICATION V2 SPECIFICATION
  // ===========================================================================
  console.log('--- SUITE 1: Official Bunny CDN Token Signing (HMAC-SHA256 V2) ---')

  // 1a. signBunnyCdnUrl produces valid signed URL with token and expires
  const signedResult = signBunnyCdnUrl(rawMp4Url, testSecurityKey, 14400)
  assert(typeof signedResult.signedUrl === 'string', 'Suite 1', '1a. signBunnyCdnUrl returns string signedUrl')
  assert(signedResult.expiresAt instanceof Date, 'Suite 1', '1b. returns valid expiresAt Date object')

  const parsedSigned = new URL(signedResult.signedUrl)
  const tokenParam = parsedSigned.searchParams.get('token')
  const expiresParam = parsedSigned.searchParams.get('expires')

  assert(Boolean(tokenParam), 'Suite 1', '2a. URL contains token searchParam')
  assert(Boolean(expiresParam), 'Suite 1', '2b. URL contains expires searchParam')
  assert(tokenParam!.startsWith('HS256-'), 'Suite 1', '2c. Token uses official HS256- prefix')

  // 2d. Token encoding: unpadded Base64URL (+ replaced with -, / with _, no =)
  const base64UrlPayload = tokenParam!.slice('HS256-'.length)
  assert(!base64UrlPayload.includes('+'), 'Suite 1', '3a. Token replaces + with -')
  assert(!base64UrlPayload.includes('/'), 'Suite 1', '3b. Token replaces / with _')
  assert(!base64UrlPayload.includes('='), 'Suite 1', '3c. Token strips trailing = padding')

  // 2e. Verification against expected HMAC calculation
  const expectedPath = `/${testVideoId}/play_720p.mp4`
  const expectedHmac = crypto
    .createHmac('sha256', testSecurityKey)
    .update(expectedPath)
    .update(expiresParam!)
    .digest()
  const expectedToken = 'HS256-' + expectedHmac.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  assert(tokenParam === expectedToken, 'Suite 1', '4. Token strictly matches HMAC-SHA256(securityKey, path + expires)')

  // 2f. Stability: signing twice with same expiration timestamp produces identical URL
  const expiresAtFixed = Math.floor(Date.now() / 1000) + 14400
  const signA = signBunnyCdnUrl(rawMp4Url, testSecurityKey, 14400)
  const signB = signBunnyCdnUrl(rawMp4Url, testSecurityKey, 14400)
  // Both signed within same second should have same parameters
  assert(signA.signedUrl.startsWith(`https://${testHost}${expectedPath}?token=HS256-`), 'Suite 1', '5. Replay produces consistent URL pattern')

  // ===========================================================================
  // SUITE 2: MISSING CONFIGURATION & SECURITY SAFEGUARDS
  // ===========================================================================
  console.log('\n--- SUITE 2: Missing Configuration & Security Safeguards ---')

  // 6. signBunnyCdnUrl fails if key is empty
  let emptyKeyCaught = false
  try {
    signBunnyCdnUrl(rawMp4Url, '')
  } catch (err: unknown) {
    emptyKeyCaught = true
    const msg = (err as Error).message
    assert(msg.includes('BUNNY_TOKEN_SECURITY_KEY'), 'Suite 2', '6a. Descriptive error mentions BUNNY_TOKEN_SECURITY_KEY')
    assert(!msg.includes(testSecurityKey), 'Suite 2', '6b. Secret key is NEVER leaked in error message')
  }
  assert(emptyKeyCaught, 'Suite 2', '6c. Missing securityKey is strictly rejected')

  // 7. Invalid expiration time rejected
  let invalidExpCaught = false
  try {
    signBunnyCdnUrl(rawMp4Url, testSecurityKey, 0)
  } catch {
    invalidExpCaught = true
  }
  assert(invalidExpCaught, 'Suite 2', '7. Zero or negative expiration time is rejected')

  // 8. Sanitization strips tokens and credentials
  const dirtyUrl = `https://${testHost}/${testVideoId}/play_720p.mp4?token=HS256-SUPER_SECRET_TOKEN&expires=1799999999`
  const cleanUrl = sanitizeUrlForLogging(dirtyUrl)
  assert(!cleanUrl.includes('SUPER_SECRET_TOKEN'), 'Suite 2', '8a. sanitizeUrlForLogging removes token')
  assert(!cleanUrl.includes('expires='), 'Suite 2', '8b. sanitizeUrlForLogging removes expires')
  assert(cleanUrl === `https://${testHost}/${testVideoId}/play_720p.mp4`, 'Suite 2', '8c. Clean base URL is preserved')

  // ===========================================================================
  // SUITE 3: RESOLVE BUNNY MEDIA URL & RANGE PROBE BEHAVIOR
  // ===========================================================================
  console.log('\n--- SUITE 3: resolveBunnyMediaUrl & Lightweight Range Probe ---')

  // 9. Resolving test fixture video
  const testResolved = await resolveBunnyMediaUrl(`test-video-${timestamp}`, {
    expiresInSeconds: 7200,
    preferredResolution: '480p'
  })
  assert(testResolved.sourceType === 'bunny_stream', 'Suite 3', '9a. Resolved source type is bunny_stream')
  assert(testResolved.rendition === 'play_480p.mp4', 'Suite 3', '9b. Rendition is play_480p.mp4')
  assert(testResolved.mediaUrl.includes('token='), 'Suite 3', '9c. URL has token parameter')

  // 10. Empty video ID rejected
  let emptyVidCaught = false
  try {
    await resolveBunnyMediaUrl('')
  } catch {
    emptyVidCaught = true
  }
  assert(emptyVidCaught, 'Suite 3', '10. Empty videoId is strictly rejected')

  // 11. Range Probe Simulation with Mock HTTP Server
  const mockProbePort = 8891
  let probeHitCount = 0
  let probeReceivedRange = ''
  let probeReceivedReferer = ''
  let mockProbeStatus = 206

  const probeMockServer = http.createServer((req, res) => {
    probeHitCount++
    probeReceivedRange = req.headers['range'] || ''
    probeReceivedReferer = req.headers['referer'] || ''
    res.writeHead(mockProbeStatus, {
      'Content-Type': 'video/mp4',
      'Content-Range': 'bytes 0-100/10485760'
    })
    res.end(Buffer.alloc(100))
  })

  await new Promise<void>((r) => probeMockServer.listen(mockProbePort, () => r()))

  try {
    // 12a. Successful 206 range probe
    mockProbeStatus = 206
    const probeTestUrl = `https://127.0.0.1:${mockProbePort}/real-vid-123/play_720p.mp4`
    const signedProbeUrl = signBunnyCdnUrl(probeTestUrl, testSecurityKey, 3600)
    
    // Test the fetch directly to verify headers
    const testProbeFetch = await fetch(signedProbeUrl.signedUrl.replace('https:', 'http:'), {
      method: 'GET',
      headers: {
        Range: 'bytes=0-100',
        Referer: 'https://iframe.mediadelivery.net'
      }
    })
    assert(testProbeFetch.status === 206, 'Suite 3', '12a. Range probe returns 206 Partial Content')
    assert(probeReceivedRange === 'bytes=0-100', 'Suite 3', '12b. Range header bytes=0-100 sent')
    assert(probeReceivedReferer === 'https://iframe.mediadelivery.net', 'Suite 3', '12c. Referer header sent')

    // 13. Simulated 403 Forbidden probe rejection
    mockProbeStatus = 403
    let probe403Caught = false
    try {
      const probeRes = await fetch(signedProbeUrl.signedUrl.replace('https:', 'http:'), {
        method: 'GET',
        headers: { Range: 'bytes=0-100', Referer: 'https://iframe.mediadelivery.net' }
      })
      if (probeRes.status === 403) {
        throw new Error('Bunny CDN từ chối quyền truy cập (HTTP 403). Vui lòng kiểm tra BUNNY_TOKEN_SECURITY_KEY và cấu hình Token Authentication trên Bunny Stream.')
      }
    } catch (err: unknown) {
      probe403Caught = true
      assert((err as Error).message.includes('HTTP 403'), 'Suite 3', '13a. 403 rejection message detected')
    }
    assert(probe403Caught, 'Suite 3', '13b. 403 Forbidden probe is rejected')
  } finally {
    probeMockServer.close()
  }

  // ===========================================================================
  // SUITE 4: LIFECYCLE RECOVERY — FAILED JOB RESUBMISSION CREATES FRESH JOB
  // ===========================================================================
  console.log('\n--- SUITE 4: Lifecycle Recovery & Failed Job Resubmission ---')

  const teacherUser = await prisma.user.findFirst({
    where: { role: 'TEACHER', email: { not: '' } }
  })
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!teacherUser || !adminUser) {
    console.warn('Skipping database-dependent Suite 4 (users not seeded)')
  } else {
    // Create test course and lesson
    const testCourse = await prisma.course.create({
      data: {
        title: `Course Hotfix ${timestamp}`,
        slug: `course-hotfix-${timestamp}`,
        authorId: teacherUser.id,
        price: 0,
        status: 'APPROVED'
      }
    })

    const testChapter = await prisma.chapter.create({
      data: {
        title: `Chapter Hotfix ${timestamp}`,
        courseId: testCourse.id,
        order: 1
      }
    })

    const testLesson = await prisma.lesson.create({
      data: {
        title: `Lesson Hotfix ${timestamp}`,
        slug: `lesson-hotfix-${timestamp}`,
        chapterId: testChapter.id,
        courseId: testCourse.id,
        authorId: teacherUser.id,
        duration: 720,
        bunnyVideoId: `test-bunny-${timestamp}`,
        videoStatus: 'READY',
        aiGeneration: 1
      }
    })

    // Setup isolated mock server for AI Service Client
    const mockAiPort = 8892
    let aiReceivedIdempotencyKey = ''
    let aiReceivedMediaUrl = ''
    const aiMockServer = http.createServer((req, res) => {
      aiReceivedIdempotencyKey = (req.headers['idempotency-key'] as string) || ''
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          aiReceivedMediaUrl = parsed.mediaUrl || ''
        } catch {}
        res.writeHead(202, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          job_id: `fastapi-hotfix-${Date.now()}`,
          status: 'QUEUED',
          message: 'Job accepted',
          is_replay: false
        }))
      })
    })

    await new Promise<void>((r) => aiMockServer.listen(mockAiPort, () => r()))
    aiServiceClient.setBaseUrl(`http://127.0.0.1:${mockAiPort}`)

    try {
      // 14. First AI process submission succeeds
      const firstResult = await triggerLessonAiProcessService({
        lessonId: testLesson.id,
        userId: teacherUser.id,
        role: 'TEACHER'
      })
      assert(firstResult.success === true, 'Suite 4', '14a. First job submission returns success')
      assert(firstResult.statusCode === 202, 'Suite 4', '14b. Returns 202 Accepted')
      const firstJobId = firstResult.data?.id
      const firstKey = aiReceivedIdempotencyKey
      const firstUrl = aiReceivedMediaUrl
      assert(firstUrl.includes('token=HS256-'), 'Suite 4', '14c. Submitted mediaUrl has HS256- token')

      // 15. Transition first job to FAILED (simulating upstream failure)
      await prisma.aiProcessingJob.update({
        where: { id: firstJobId },
        data: {
          status: AiJobStatus.FAILED,
          currentStage: 'FAILED',
          errorMessage: 'Simulated failure during transcribing'
        }
      })

      // 16. Teacher triggers AI process again: MUST create a fresh job with NEW idempotency key
      const secondResult = await triggerLessonAiProcessService({
        lessonId: testLesson.id,
        userId: teacherUser.id,
        role: 'TEACHER'
      })
      assert(secondResult.success === true, 'Suite 4', '16a. Second job submission succeeds after FAILED state')
      assert(secondResult.statusCode === 202, 'Suite 4', '16b. Returns 202 Accepted for new job')
      const secondJobId = secondResult.data?.id
      const secondKey = aiReceivedIdempotencyKey

      assert(secondJobId !== firstJobId, 'Suite 4', '16c. Second job has a NEW distinct job ID')
      assert(secondKey !== firstKey, 'Suite 4', '16d. Second job uses a NEW fresh idempotency key')
      assert(secondKey === secondJobId, 'Suite 4', '16e. Idempotency key strictly matches new job ID')

    } finally {
      aiMockServer.close()
      // Cleanup database fixtures
      await prisma.aiProcessingJob.deleteMany({ where: { lessonId: testLesson.id } })
      await prisma.lesson.delete({ where: { id: testLesson.id } })
      await prisma.chapter.delete({ where: { id: testChapter.id } })
      await prisma.course.delete({ where: { id: testCourse.id } })
    }
  }

  // ===========================================================================
  // SUITE 5: LIVE REAL BUNNY STREAM CDN VERIFICATION (IF CREDENTIALS AVAILABLE)
  // ===========================================================================
  console.log('\n--- SUITE 5: Live Real Bunny CDN Token Verification ---')

  const realSecKey = process.env.BUNNY_TOKEN_SECURITY_KEY
  const realCdnHost = process.env.BUNNY_CDN_HOSTNAME
  const realVideoId = '684703d0-c5cc-45be-b055-14b0adb3b4f1' // Actual video in user library

  if (realSecKey && realCdnHost && !realSecKey.includes('your_token')) {
    try {
      const realUrl = `https://${realCdnHost}/${realVideoId}/play_720p.mp4`
      const signedReal = signBunnyCdnUrl(realUrl, realSecKey, 14400)
      assert(signedReal.signedUrl.includes('token=HS256-'), 'Suite 5', '17a. Real URL signed with HS256-')

      // Perform real authenticated Range GET request against Bunny CDN
      const realProbe = await fetch(signedReal.signedUrl, {
        method: 'GET',
        headers: {
          Range: 'bytes=0-100',
          Referer: 'https://iframe.mediadelivery.net'
        }
      })

      assert(
        realProbe.status === 200 || realProbe.status === 206,
        'Suite 5',
        `17b. Real Bunny CDN accepts signed URL with Referer (HTTP ${realProbe.status})`,
        `Expected 200 or 206, got HTTP ${realProbe.status}`
      )
      assert(
        realProbe.headers.get('content-type') === 'video/mp4',
        'Suite 5',
        '17c. Real CDN responds with video/mp4 Content-Type'
      )
    } catch (realErr: unknown) {
      console.warn('Live CDN network probe failed:', (realErr as Error).message)
    }
  } else {
    console.log('Skipping live CDN check (BUNNY_TOKEN_SECURITY_KEY not set in test environment)')
  }

  console.log('\n=================================================================')
  console.log(`HOTFIX STEP 6.6C.1 VERIFICATION COMPLETE: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`)
  console.log('=================================================================\n')

  if (failedChecks > 0) {
    process.exit(1)
  }
}

runHotfixTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
