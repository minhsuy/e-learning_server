import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '~/config/prisma'
import { generateAccessToken } from '~/middlewares/generateToken'
import {
  createBunnyVideo,
  deleteBunnyVideo,
  generatePlaybackInfo,
  generateTusUploadCredentials,
  getBunnyConfig,
  getBunnyVideoDetails,
  mapBunnyStatusToDomain
} from '~/services/bunny.service'

const BASE_URL = process.env.URL_SERVER || 'http://localhost:3002'

async function runTestSuite() {
  console.log('===============================================================')
  console.log('       TMDEMY BUNNY STREAM VIDEO UPLOAD & PLAYBACK SUITE       ')
  console.log('===============================================================')

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, desc: string, detail?: any) {
    totalTests++
    if (condition) {
      console.log(`  [PASS] ${desc}`)
      passedTests++
    } else {
      console.error(`  [FAIL] ${desc}`)
      if (detail) console.error('         Details:', detail)
    }
  }

  // 1. Prepare Test Users & Course in DB
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  if (!adminUser) throw new Error('No admin user found!')

  const teacherUser = await prisma.user.findFirst({
    where: { role: 'TEACHER' }
  })
  if (!teacherUser) throw new Error('No teacher user found!')

  const otherTeacher = await prisma.user.findFirst({
    where: { role: 'TEACHER', id: { not: teacherUser.id } }
  })

  const studentUser = await prisma.user.findFirst({
    where: { role: 'USER' }
  })
  if (!studentUser) throw new Error('No student user found!')

  // Tokens
  const adminToken = generateAccessToken({ userId: adminUser.id, role: 'admin' })
  const teacherToken = generateAccessToken({ userId: teacherUser.id, role: 'teacher' })
  const otherTeacherToken = otherTeacher
    ? generateAccessToken({ userId: otherTeacher.id, role: 'teacher' })
    : null
  const studentToken = generateAccessToken({ userId: studentUser.id, role: 'user' })

  console.log(`✓ Admin: ${adminUser.username} (${adminUser.id})`)
  console.log(`✓ Teacher: ${teacherUser.username} (${teacherUser.id})`)
  console.log(`✓ Student: ${studentUser.username} (${studentUser.id})`)

  // Find or create a course authored by teacherUser
  let teacherCourse = await prisma.course.findFirst({
    where: { authorId: teacherUser.id },
    include: { chapters: true }
  })

  if (!teacherCourse) {
    teacherCourse = await prisma.course.create({
      data: {
        title: 'Bunny Stream Test Course',
        slug: `bunny-stream-test-course-${Date.now()}`,
        authorId: teacherUser.id,
        chapters: {
          create: {
            title: 'Chương 1: Kiểm thử Bunny Stream',
            order: 1
          }
        }
      },
      include: { chapters: true }
    })
  }

  let teacherChapter = teacherCourse.chapters[0]
  if (!teacherChapter) {
    teacherChapter = await prisma.chapter.create({
      data: {
        title: 'Chương 1: Kiểm thử Bunny Stream',
        order: 1,
        courseId: teacherCourse.id
      }
    })
  }

  console.log(`✓ Test Course: ${teacherCourse.title} (${teacherCourse.id})`)
  console.log(`✓ Test Chapter: ${teacherChapter.title} (${teacherChapter.id})`)

  // -------------------------------------------------------------------------
  // SECTION 1: UNIT / SERVICE LOGIC TESTS
  // -------------------------------------------------------------------------
  console.log('\n--- [SECTION 1] Bunny Service Unit & TUS Signature Logic ---')
  {
    // Test 1.1: Env configuration retrieval
    const config = getBunnyConfig()
    assert(Boolean(config.apiKey && config.libraryId && config.cdnHostname), 'Bunny config loaded correctly')

    // Test 1.2: Status mapping
    assert(mapBunnyStatusToDomain(0) === 'CREATED', 'Status 0 maps to CREATED')
    assert(mapBunnyStatusToDomain(1) === 'UPLOADING', 'Status 1 maps to UPLOADING')
    assert(mapBunnyStatusToDomain(2) === 'PROCESSING', 'Status 2 maps to PROCESSING')
    assert(mapBunnyStatusToDomain(3) === 'PROCESSING', 'Status 3 maps to PROCESSING')
    assert(mapBunnyStatusToDomain(4) === 'READY', 'Status 4 maps to READY')
    assert(mapBunnyStatusToDomain(5) === 'FAILED', 'Status 5 maps to FAILED')

    // Test 1.3: TUS Signature generation
    const fakeGuid = '11111111-2222-3333-4444-555555555555'
    const creds = generateTusUploadCredentials(fakeGuid, 3600)
    assert(creds.videoId === fakeGuid, 'Credentials videoId matches')
    assert(creds.uploadUrl === 'https://video.bunnycdn.com/tusupload', 'Credentials uploadUrl is Bunny TUS endpoint')
    assert(typeof creds.authorizationSignature === 'string' && creds.authorizationSignature.length === 64, 'Signature is 64-char SHA256 hex')
    assert(creds.authorizationExpire > Math.floor(Date.now() / 1000), 'Expiration is in future')

    // Test 1.4: Playback URLs construction
    const playback = generatePlaybackInfo(fakeGuid, 'READY')
    assert(playback.embedUrl.includes(fakeGuid), 'Embed URL contains videoId')
    assert(playback.hlsUrl.includes('.m3u8'), 'HLS URL ends with .m3u8')
    assert(playback.thumbnailUrl.includes('thumbnail.jpg'), 'Thumbnail URL points to thumbnail.jpg')
    assert(playback.previewUrl.includes('preview.webp'), 'Preview URL points to preview.webp')
  }

  // -------------------------------------------------------------------------
  // SECTION 2: LIVE BUNNY STREAM API INTEGRATION
  // -------------------------------------------------------------------------
  console.log('\n--- [SECTION 2] Live Bunny Stream API Video Lifecycle ---')
  let liveVideoGuid: string | null = null
  {
    // Test 2.1: Create video on Bunny Stream
    try {
      const liveVideo = await createBunnyVideo('Automated Test Video - TMDEMY')
      liveVideoGuid = liveVideo.guid
      assert(Boolean(liveVideoGuid), `Live Bunny Video created successfully: ${liveVideoGuid}`)

      // Test 2.2: Retrieve video details
      const details = await getBunnyVideoDetails(liveVideoGuid)
      assert(details.videoId === liveVideoGuid, 'Video details matched created GUID')
      assert(details.status === 'CREATED', 'New video status is CREATED (status 0)')
    } catch (err: any) {
      assert(false, `Bunny Live API create failed: ${err.message}`)
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 3: HTTP API - POST /api/videos/upload-signature
  // -------------------------------------------------------------------------
  console.log('\n--- [SECTION 3] POST /api/videos/upload-signature ---')
  let authorizedVideoId: string | null = null
  {
    // Test 3.1: 401 Unauthorized
    const resNoAuth = await fetch(`${BASE_URL}/api/videos/upload-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Video', courseId: teacherCourse.id })
    })
    assert(resNoAuth.status === 401, '401 on unauthenticated upload signature request')

    // Test 3.2: 403 Forbidden for Student (USER role)
    const resStudent = await fetch(`${BASE_URL}/api/videos/upload-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ title: 'Test Video', courseId: teacherCourse.id })
    })
    assert(resStudent.status === 403, '403 Forbidden when Student attempts upload')

    // Test 3.3: 403 Forbidden when Other Teacher attempts to upload to this teacher course
    if (otherTeacherToken) {
      const resOtherTeacher = await fetch(`${BASE_URL}/api/videos/upload-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherTeacherToken}`
        },
        body: JSON.stringify({ title: 'Unauthorized Video', courseId: teacherCourse.id })
      })
      assert(resOtherTeacher.status === 403, '403 Forbidden when Teacher uploads to another teacher course')
    }

    // Test 3.4: 400 Bad Request on invalid Course ID
    const resBadCourse = await fetch(`${BASE_URL}/api/videos/upload-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ title: 'Test Video', courseId: 'invalid-uuid' })
    })
    assert(resBadCourse.status === 400, '400 Bad Request on invalid Course UUID')

    // Test 3.5: 201 Created for Course Owner Teacher
    const resSuccess = await fetch(`${BASE_URL}/api/videos/upload-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'Bài 1: Giới thiệu Bunny Stream TUS',
        courseId: teacherCourse.id,
        chapterId: teacherChapter.id
      })
    })
    const successData = await resSuccess.json()
    assert(resSuccess.status === 201 && successData.success === true, '201 Created on valid upload signature request')
    assert(Boolean(successData.data?.videoId), 'Response contains videoId GUID')
    assert(Boolean(successData.data?.authorizationSignature), 'Response contains authorizationSignature')
    assert(Boolean(successData.data?.authorizationExpire), 'Response contains authorizationExpire')
    assert(successData.data?.apiKey === undefined, 'Security: BUNNY_API_KEY is NEVER exposed to frontend')

    authorizedVideoId = successData.data?.videoId
  }

  // -------------------------------------------------------------------------
  // SECTION 4: HTTP API - GET /api/videos/:videoId/status
  // -------------------------------------------------------------------------
  console.log('\n--- [SECTION 4] GET /api/videos/:videoId/status ---')
  if (authorizedVideoId) {
    // Test 4.1: 401 Unauthorized
    const resNoAuth = await fetch(`${BASE_URL}/api/videos/${authorizedVideoId}/status`)
    assert(resNoAuth.status === 401, '401 Unauthorized on get video status')

    // Test 4.2: 200 OK for Owner Teacher
    const resStatus = await fetch(`${BASE_URL}/api/videos/${authorizedVideoId}/status`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    })
    const statusData = await resStatus.json()
    assert(resStatus.status === 200 && statusData.success === true, '200 OK on get video status for owner')
    assert(statusData.data?.status === 'CREATED', 'Initial status of video is CREATED')
    assert(statusData.data?.videoId === authorizedVideoId, 'Status response matches requested videoId')
  }

  // -------------------------------------------------------------------------
  // SECTION 5: LESSON CREATION WITH BUNNY VIDEO INTEGRATION
  // -------------------------------------------------------------------------
  console.log('\n--- [SECTION 5] POST /api/lessons (Create Lesson Integration) ---')
  let createdLessonId: string | null = null
  {
    // Test 5.1: Legacy lesson creation without bunnyVideoId (Backward Compatibility)
    const resLegacy = await fetch(`${BASE_URL}/api/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'Bài học video truyền thống Cloudinary',
        course: teacherCourse.id,
        chapter: teacherChapter.id,
        type: 'video',
        duration: 360,
        videoUrl: 'https://res.cloudinary.com/test/video.mp4',
        isDemo: true
      })
    })
    const legacyData = await resLegacy.json()
    assert(resLegacy.status === 201 && legacyData.success === true, '201 Created for legacy lesson without Bunny video')
    if (legacyData.data?.id) {
      await prisma.lesson.delete({ where: { id: legacyData.data.id } })
    }

    // Test 5.2: Reject lesson creation with un-uploaded Bunny video GUID
    if (authorizedVideoId) {
      const resUnfinished = await fetch(`${BASE_URL}/api/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: 'Bài học chưa tải video lên',
          course: teacherCourse.id,
          chapter: teacherChapter.id,
          type: 'video',
          bunnyVideoId: authorizedVideoId
        })
      })
      const unfinishedData = await resUnfinished.json()
      assert(resUnfinished.status === 400, '400 Bad Request when trying to link un-uploaded Bunny video')
      assert(
        unfinishedData.message?.includes('TUS upload not completed') ||
          unfinishedData.message?.includes('chưa hoàn thành'),
        'Descriptive error returned for incomplete upload'
      )
    }

    // Test 5.3: Reject fake/non-existent Bunny video GUID
    const resFakeGuid = await fetch(`${BASE_URL}/api/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'Bài học với Fake Bunny GUID',
        course: teacherCourse.id,
        chapter: teacherChapter.id,
        type: 'video',
        bunnyVideoId: 'ffffffff-ffff-ffff-ffff-ffffffffffff'
      })
    })
    assert(resFakeGuid.status === 400, '400 Bad Request on non-existent Bunny Video GUID')

    // Test 5.4: Successful lesson creation with attached Bunny video (simulating finished upload in DB)
    const mockReadyBunnyId = `ready-${Date.now()}`
    const resSuccessLesson = await prisma.lesson.create({
      data: {
        title: 'Bài 2: Thực hành Bunny Stream HLS',
        slug: `bai-2-thuc-hanh-bunny-stream-hls-${Date.now()}`,
        courseId: teacherCourse.id,
        chapterId: teacherChapter.id,
        authorId: teacherUser.id,
        duration: 720,
        type: 'VIDEO',
        isDemo: true,
        bunnyVideoId: mockReadyBunnyId,
        videoStatus: 'READY'
      }
    })
    createdLessonId = resSuccessLesson.id
    assert(Boolean(createdLessonId), 'Lesson created with Bunny metadata in PostgreSQL')
    assert(resSuccessLesson.bunnyVideoId === mockReadyBunnyId, 'Lesson bunnyVideoId stored correctly')
    assert(resSuccessLesson.videoStatus === 'READY', 'Lesson videoStatus stored as READY')
  }

  // -------------------------------------------------------------------------
  // SECTION 6: HTTP API - GET /api/videos/lesson/:lessonId/playback
  // -------------------------------------------------------------------------
  console.log('\n--- [SECTION 6] GET /api/videos/lesson/:lessonId/playback ---')
  if (createdLessonId) {
    // Test 6.1: 401 Unauthorized without token
    const resNoAuth = await fetch(`${BASE_URL}/api/videos/lesson/${createdLessonId}/playback`)
    assert(resNoAuth.status === 401, '401 on unauthenticated playback request')

    // Test 6.2: 200 OK for Author Teacher
    const resTeacher = await fetch(`${BASE_URL}/api/videos/lesson/${createdLessonId}/playback`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    })
    const teacherData = await resTeacher.json()
    assert(resTeacher.status === 200 && teacherData.success === true, '200 OK for Author Teacher')
    assert(Boolean(teacherData.data?.playback?.embedUrl), 'Playback contains embedUrl iframe link')
    assert(Boolean(teacherData.data?.playback?.hlsUrl), 'Playback contains hlsUrl .m3u8 link')
    assert(Boolean(teacherData.data?.playback?.thumbnailUrl), 'Playback contains thumbnailUrl link')

    // Test 6.3: 200 OK for Student on demo lesson
    const resDemoStudent = await fetch(`${BASE_URL}/api/videos/lesson/${createdLessonId}/playback`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    })
    const demoData = await resDemoStudent.json()
    assert(resDemoStudent.status === 200 && demoData.success === true, '200 OK for Student accessing Demo lesson')

    // Test 6.4: 403 Forbidden for non-enrolled student on non-demo lesson
    await prisma.lesson.update({
      where: { id: createdLessonId },
      data: { isDemo: false }
    })
    const resLockedStudent = await fetch(`${BASE_URL}/api/videos/lesson/${createdLessonId}/playback`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    })
    assert(resLockedStudent.status === 403, '403 Forbidden for non-enrolled Student on non-demo lesson')
  }

  // -------------------------------------------------------------------------
  // SECTION 7: CLEANUP & VIDEO DELETION
  // -------------------------------------------------------------------------
  console.log('\n--- [SECTION 7] Video Deletion & Cleanup ---')
  {
    // Test 7.1: Delete via API
    if (authorizedVideoId) {
      const resDel = await fetch(`${BASE_URL}/api/videos/${authorizedVideoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${teacherToken}` }
      })
      const delData = await resDel.json()
      assert(resDel.status === 200 && delData.success === true, '200 OK on video deletion for owner teacher')
    }

    // Clean up live video created in Section 2 if still on Bunny
    if (liveVideoGuid) {
      try {
        await deleteBunnyVideo(liveVideoGuid)
        assert(true, `Cleaned up live Bunny test video: ${liveVideoGuid}`)
      } catch (err: any) {
        console.warn('Cleanup warning:', err.message)
      }
    }

    // Clean up created lesson
    if (createdLessonId) {
      await prisma.lesson.delete({ where: { id: createdLessonId } })
      console.log('✓ Cleaned up test lesson record')
    }
  }

  // -------------------------------------------------------------------------
  // SUITE SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n===============================================================')
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
  console.log('===============================================================')

  await prisma.$disconnect()

  if (totalTests === passedTests) {
    console.log('\n🎉 ALL BUNNY STREAM INTEGRATION TESTS PASSED!')
  } else {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Test Suite Fatal Error:', err)
  prisma.$disconnect()
  process.exit(1)
})
