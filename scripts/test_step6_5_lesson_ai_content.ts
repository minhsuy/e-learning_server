import dotenv from 'dotenv'
dotenv.config()

import {
  AiProcessingStatus,
  EEnrollmentStatus,
  LessonType,
  Prisma,
  UserRole
} from '@prisma/client'
import { prisma } from '~/config/prisma'
import {
  findLessonById,
  LESSON_AI_CONTENT_SELECT,
  LESSON_STUDY_SELECT
} from '~/repositories/lesson.repository'
import {
  createLessonService,
  getLessonAiContentService,
  getLessonByIdService,
  getLessonsByChapterService,
  updateLessonAiContentService,
  updateLessonService
} from '~/services/lesson.service'
import lessonRouter from '~/routes/lesson.route'

/**
 * TMDEMY — STEP 6.5 AUTOMATED VERIFICATION SUITE
 * LESSON AI TRANSCRIPT & SUMMARY STORAGE
 *
 * Scenarios tested:
 * 1. Existing Lesson records remain valid without AI content
 * 2. Transcript Markdown is stored correctly
 * 3. Summary Markdown is stored correctly
 * 4. Vietnamese Unicode content is preserved (UTF-8)
 * 5. Long Markdown content is supported (>50KB)
 * 6. Partial updates do not erase unrelated data
 * 7. AI Processing Lifecycle: PENDING -> PROCESSING -> COMPLETED
 * 8. FAILED state and error persistence
 * 9. Unauthorized students cannot update AI content (403)
 * 10. Non-owner teachers cannot update AI content (403)
 * 11. Authorized teacher and Admin can update AI content (200)
 * 12. Student read access follows enrollment / demo policy (redacting error)
 * 13. Existing Lesson APIs remain backward compatible
 * 14. Prisma schema and migration integrity
 * 15. Stale AI jobs cannot overwrite newer content (video mismatch & timestamp guard)
 * 16. Server-to-server AI service authorization
 * 17. Guard against marking COMPLETED without output content (400)
 * 18. Route registration audit
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

async function runStep6_5Tests() {
  console.log('=================================================================')
  console.log('STARTING TMDEMY STEP 6.5: LESSON AI TRANSCRIPT & SUMMARY SUITE')
  console.log('=================================================================')

  const timestamp = Date.now()

  // --------------------------------------------------------------------------
  // SETUP TEST DATA
  // --------------------------------------------------------------------------
  console.log('\n--- Setting Up Database Test Entities ---')

  // 1. Users
  const teacherOwner = await prisma.user.create({
    data: {
      username: `s65_owner_${timestamp}`,
      email: `s65_owner_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  const teacherOther = await prisma.user.create({
    data: {
      username: `s65_other_${timestamp}`,
      email: `s65_other_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.TEACHER
    }
  })

  const adminUser = await prisma.user.create({
    data: {
      username: `s65_admin_${timestamp}`,
      email: `s65_admin_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.ADMIN
    }
  })

  const studentEnrolled = await prisma.user.create({
    data: {
      username: `s65_st_en_${timestamp}`,
      email: `s65_st_en_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER
    }
  })

  const studentUnenrolled = await prisma.user.create({
    data: {
      username: `s65_st_unen_${timestamp}`,
      email: `s65_st_unen_${timestamp}@tmdemy.com`,
      password: 'hashedpassword',
      role: UserRole.USER
    }
  })

  // 2. Category
  const category = await prisma.category.create({
    data: {
      name: `S65 Category ${timestamp}`,
      slug: `s65-category-${timestamp}`
    }
  })

  // 3. Course
  const course = await prisma.course.create({
    data: {
      title: `Course AI Storage ${timestamp}`,
      slug: `course-ai-storage-${timestamp}`,
      authorId: teacherOwner.id,
      categoryId: category.id,
      price: new Prisma.Decimal(199000),
      description: 'Test course for AI content storage'
    }
  })

  // 4. Chapter
  const chapter = await prisma.chapter.create({
    data: {
      title: 'Chương 1: Khởi động AI',
      courseId: course.id,
      order: 1
    }
  })

  // 5. Active Enrollment for studentEnrolled
  await prisma.enrollment.create({
    data: {
      userId: studentEnrolled.id,
      courseId: course.id,
      status: EEnrollmentStatus.ACTIVE,
      progress: 0
    }
  })

  // 6. Non-demo lesson
  const lessonNonDemo = await prisma.lesson.create({
    data: {
      title: 'Bài 1: Kiến trúc Backend TMDEMY',
      slug: `bai-1-kien-truc-backend-tmdemy-${timestamp}`,
      chapterId: chapter.id,
      courseId: course.id,
      authorId: teacherOwner.id,
      isDemo: false,
      bunnyVideoId: 'video-asset-alpha-123',
      order: 1,
      duration: 600,
      content: 'Nội dung bài học ban đầu'
    }
  })

  // 7. Demo lesson
  const lessonDemo = await prisma.lesson.create({
    data: {
      title: 'Bài 2: Trải nghiệm Demo TMDEMY',
      slug: `bai-2-trai-nghiem-demo-tmdemy-${timestamp}`,
      chapterId: chapter.id,
      courseId: course.id,
      authorId: teacherOwner.id,
      isDemo: true,
      bunnyVideoId: 'video-asset-demo-456',
      order: 2,
      duration: 300,
      content: 'Nội dung bài học demo công khai'
    }
  })

  console.log(`Created fixtures: Course ${course.id}, Lesson 1 ${lessonNonDemo.id}, Lesson 2 ${lessonDemo.id}`)

  // --------------------------------------------------------------------------
  // GROUP 1: EXISTING LESSON RECORDS & PRISMA SCHEMA INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- Group 1: Existing Lesson Records & Prisma Schema Integrity ---')

  const fetchedLesson = await prisma.lesson.findUnique({
    where: { id: lessonNonDemo.id }
  })

  assert(Boolean(fetchedLesson), 'Group 1', 'Existing lesson record is readable from PostgreSQL')
  assert(fetchedLesson?.transcript === null, 'Group 1', 'Newly created lesson has null transcript by default')
  assert(fetchedLesson?.summary === null, 'Group 1', 'Newly created lesson has null summary by default')
  assert(fetchedLesson?.aiProcessingStatus === AiProcessingStatus.PENDING, 'Group 1', 'Default aiProcessingStatus is PENDING')
  assert(fetchedLesson?.aiProcessedAt === null, 'Group 1', 'Default aiProcessedAt is null')
  assert(fetchedLesson?.aiProcessingError === null, 'Group 1', 'Default aiProcessingError is null')

  // Verify LESSON_STUDY_SELECT includes AI fields
  const studySelectTest = await findLessonById(lessonNonDemo.id, { select: LESSON_STUDY_SELECT })
  assert('transcript' in (studySelectTest || {}), 'Group 1', 'LESSON_STUDY_SELECT includes transcript')
  assert('summary' in (studySelectTest || {}), 'Group 1', 'LESSON_STUDY_SELECT includes summary')
  assert('aiProcessingStatus' in (studySelectTest || {}), 'Group 1', 'LESSON_STUDY_SELECT includes aiProcessingStatus')

  // --------------------------------------------------------------------------
  // GROUP 2: MARKDOWN STORAGE & VIETNAMESE UNICODE PRESERVATION
  // --------------------------------------------------------------------------
  console.log('\n--- Group 2: Markdown & Vietnamese Unicode Preservation ---')

  const vietnameseTranscript = `# BẢN GHI PHỤ ĐỀ (TRANSCRIPT) — BÀI HỌC 1
## 1. Mở đầu & Giới thiệu
Chào mừng các bạn học viên đến với hệ thống **TMdemy** — Nền tảng học trực tuyến hiện đại.
Trong video này, giảng viên sẽ hướng dẫn:
- Phân tích kiến trúc *Functional Repository*.
- Cơ chế xử lý giao dịch nguyên tử với \`PrismaClient\`.
- Ánh xạ lỗi database \`P2002\` và chuẩn hóa dữ liệu tiếng Việt có dấu: "Hà Nội, TP. Hồ Chí Minh, Đắk Lắk".

\`\`\`typescript
const greeting = "Xin chào các kỹ sư tương lai!";
console.log(greeting);
\`\`\`
`

  const vietnameseSummary = `## Tóm Tắt Bài Học
### Điểm kiến thức cốt lõi:
1. **Kiến trúc phân tầng đơn hướng**: Router -> Controller -> Service -> Repository -> PostgreSQL.
2. **Khóa học tiếng Việt**: Bảo toàn đầy đủ bảng mã UTF-8 và ký tự đặc biệt.
3. **Hiệu năng cao**: Tối ưu hóa truy vấn với Prisma Select projections.
`

  const updateRes1 = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: {
      transcript: vietnameseTranscript,
      summary: vietnameseSummary,
      aiProcessingStatus: AiProcessingStatus.COMPLETED
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })

  assert(updateRes1.success === true, 'Group 2', 'Teacher owner can update AI transcript and summary')
  assert(updateRes1.data?.transcript === vietnameseTranscript, 'Group 2', 'Vietnamese transcript with markdown formatting stored intact')
  assert(updateRes1.data?.summary === vietnameseSummary, 'Group 2', 'Vietnamese summary with markdown formatting stored intact')
  assert(updateRes1.data?.aiProcessingStatus === AiProcessingStatus.COMPLETED, 'Group 2', 'aiProcessingStatus set to COMPLETED')
  assert(updateRes1.data?.aiProcessedAt !== null, 'Group 2', 'aiProcessedAt timestamp populated upon COMPLETED')

  // Direct DB check
  const dbVerify = await prisma.lesson.findUnique({ where: { id: lessonNonDemo.id } })
  assert(dbVerify?.transcript?.includes('BẢN GHI PHỤ ĐỀ') === true, 'Group 2', 'Database verifies Vietnamese title in transcript')
  assert(dbVerify?.transcript?.includes('Đắk Lắk') === true, 'Group 2', 'Database verifies complex Vietnamese diacritics in transcript')

  // --------------------------------------------------------------------------
  // GROUP 3: LONG MARKDOWN CONTENT (>50KB)
  // --------------------------------------------------------------------------
  console.log('\n--- Group 3: Large Markdown Content (>50KB) ---')

  let largeMarkdown = '# PHỤ ĐỀ DÀI DÀNH CHO VIDEO BÀI GIẢNG 120 PHÚT\n\n'
  for (let i = 1; i <= 350; i++) {
    largeMarkdown += `### Đoạn ${i}: Nội dung bài giảng chuyên sâu về phân tích hệ thống và kiến trúc Microservices\n`
    largeMarkdown += `Vào mốc thời gian ${Math.floor(i * 20)} giây: Giảng viên trình bày về cơ chế caching và message queue RabbitMQ. `
    largeMarkdown += `Học viên cần chú ý tối ưu hóa hiệu năng cơ sở dữ liệu PostgreSQL 16.\n`
    largeMarkdown += `| Chỉ mục | Thuộc tính | Giá trị | Mô tả |\n|---|---|---|---|\n| ${i} | latency | <15ms | Phản hồi siêu nhanh |\n\n`
  }

  const byteLength = Buffer.byteLength(largeMarkdown, 'utf8')
  assert(byteLength > 50000, 'Group 3', `Generated large markdown content size is ${byteLength} bytes (>50KB)`)

  const updateLargeRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: {
      transcript: largeMarkdown,
      aiProcessingStatus: AiProcessingStatus.COMPLETED
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })

  assert(updateLargeRes.success === true, 'Group 3', 'Long markdown transcript (>50KB) stored successfully in PostgreSQL TEXT column')
  const dbLargeVerify = await prisma.lesson.findUnique({ where: { id: lessonNonDemo.id } })
  assert(
    Buffer.byteLength(dbLargeVerify?.transcript || '', 'utf8') === byteLength,
    'Group 3',
    'PostgreSQL retrieved exact byte length without truncation'
  )

  // --------------------------------------------------------------------------
  // GROUP 4: PARTIAL UPDATES PRESERVATION
  // --------------------------------------------------------------------------
  console.log('\n--- Group 4: Partial Updates & Field Isolation ---')

  // Update only summary, keeping transcript unchanged
  const newSummary = '### Tóm tắt đã cập nhật mới nhất cho bài 1'
  const partialRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: {
      summary: newSummary
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })

  assert(partialRes.success === true, 'Group 4', 'Partial update of summary succeeded')
  const partialDb = await prisma.lesson.findUnique({ where: { id: lessonNonDemo.id } })
  assert(partialDb?.summary === newSummary, 'Group 4', 'Summary was updated to new value')
  assert(partialDb?.transcript === largeMarkdown, 'Group 4', 'Existing transcript was NOT erased or mutated during partial update')
  assert(partialDb?.title === 'Bài 1: Kiến trúc Backend TMDEMY', 'Group 4', 'Existing lesson title preserved')
  assert(partialDb?.duration === 600, 'Group 4', 'Existing lesson duration preserved')
  assert(partialDb?.bunnyVideoId === 'video-asset-alpha-123', 'Group 4', 'Existing bunnyVideoId preserved')

  // --------------------------------------------------------------------------
  // GROUP 5: AI PROCESSING LIFECYCLE (PENDING -> PROCESSING -> COMPLETED & FAILED)
  // --------------------------------------------------------------------------
  console.log('\n--- Group 5: AI Processing Lifecycle State Machine ---')

  // Reset to PENDING
  const resetRes = await updateLessonAiContentService({
    lessonId: lessonDemo.id,
    payload: {
      aiProcessingStatus: AiProcessingStatus.PENDING,
      transcript: null,
      summary: null,
      aiProcessingError: null
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(resetRes.data?.aiProcessingStatus === AiProcessingStatus.PENDING, 'Group 5', 'Status transitioned to PENDING')

  // Transition to PROCESSING
  const processingRes = await updateLessonAiContentService({
    lessonId: lessonDemo.id,
    payload: {
      aiProcessingStatus: AiProcessingStatus.PROCESSING
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(processingRes.data?.aiProcessingStatus === AiProcessingStatus.PROCESSING, 'Group 5', 'Status transitioned to PROCESSING')

  // Transition to FAILED with error persistence
  const failureError = 'Whisper speech-to-text audio decode failure: unsupported codec'
  const failedRes = await updateLessonAiContentService({
    lessonId: lessonDemo.id,
    payload: {
      aiProcessingStatus: AiProcessingStatus.FAILED,
      aiProcessingError: failureError
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(failedRes.data?.aiProcessingStatus === AiProcessingStatus.FAILED, 'Group 5', 'Status transitioned to FAILED')
  assert(failedRes.data?.aiProcessingError === failureError, 'Group 5', 'Operational error persisted upon FAILED state')

  // Guard: Cannot mark COMPLETED if required output is missing
  const invalidCompletedRes = await updateLessonAiContentService({
    lessonId: lessonDemo.id,
    payload: {
      aiProcessingStatus: AiProcessingStatus.COMPLETED,
      transcript: '',
      summary: ''
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(
    invalidCompletedRes.success === false && invalidCompletedRes.statusCode === 400,
    'Group 5',
    'Cannot mark COMPLETED without transcript or summary content (rejected with 400)'
  )

  // Retry from FAILED -> PROCESSING -> COMPLETED (clears error, sets timestamp)
  const retryCompletedRes = await updateLessonAiContentService({
    lessonId: lessonDemo.id,
    payload: {
      transcript: '# Phụ đề bài học Demo',
      summary: '## Tóm tắt bài học Demo',
      aiProcessingStatus: AiProcessingStatus.COMPLETED
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(retryCompletedRes.success === true, 'Group 5', 'Retry successfully marked COMPLETED with content')
  assert(retryCompletedRes.data?.aiProcessingError === null, 'Group 5', 'Stale processing error was automatically cleared on COMPLETED')
  assert(retryCompletedRes.data?.aiProcessedAt !== null, 'Group 5', 'aiProcessedAt recorded correctly')

  // --------------------------------------------------------------------------
  // GROUP 6: AUTHORIZATION & SECURITY CONTROLS
  // --------------------------------------------------------------------------
  console.log('\n--- Group 6: Authorization & Security Controls ---')

  // 1. Student cannot update AI content
  const studentUpdateRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: { summary: 'Hacked by student' },
    userId: studentEnrolled.id,
    role: UserRole.USER
  })
  assert(
    studentUpdateRes.success === false && studentUpdateRes.statusCode === 403,
    'Group 6',
    'Ordinary student cannot update AI content (403 Forbidden)'
  )

  // 2. Non-owner teacher cannot update AI content
  const otherTeacherUpdateRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: { summary: 'Hacked by non-owner' },
    userId: teacherOther.id,
    role: UserRole.TEACHER
  })
  assert(
    otherTeacherUpdateRes.success === false && otherTeacherUpdateRes.statusCode === 403,
    'Group 6',
    'Non-owner teacher cannot update AI content (403 Forbidden)'
  )

  // 3. Admin CAN update AI content
  const adminUpdateRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: { summary: '### Admin verified summary' },
    userId: adminUser.id,
    role: UserRole.ADMIN
  })
  assert(adminUpdateRes.success === true, 'Group 6', 'Admin can update AI content (200 OK)')

  // 4. Server-to-server AI service CAN update AI content
  const aiServiceUpdateRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: { summary: '### FastAPI microservice summary' },
    userId: 'ai-microservice',
    role: 'AI_SERVICE'
  })
  assert(aiServiceUpdateRes.success === true, 'Group 6', 'Server-to-server AI service can update content')

  // --------------------------------------------------------------------------
  // GROUP 7: STUDENT READ ACCESS & ANTI-LEAK POLICY
  // --------------------------------------------------------------------------
  console.log('\n--- Group 7: Student Read Access & Anti-Leak Policy ---')

  // Populate lessonNonDemo with an internal error for testing redaction
  await prisma.lesson.update({
    where: { id: lessonNonDemo.id },
    data: { aiProcessingError: 'Internal server secret error: connection to internal-gemini.cluster failed' }
  })

  // 1. Enrolled student reading non-demo lesson
  const enrolledReadRes = await getLessonAiContentService({
    lessonId: lessonNonDemo.id,
    userId: studentEnrolled.id,
    role: UserRole.USER
  })
  assert(enrolledReadRes.success === true, 'Group 7', 'Enrolled student can read AI content of purchased course')
  assert(enrolledReadRes.data?.transcript !== undefined, 'Group 7', 'Enrolled student receives transcript')
  assert(!('aiProcessingError' in (enrolledReadRes.data || {})), 'Group 7', 'Strict anti-leak: aiProcessingError is REDACTED from student')

  // 2. Unenrolled student reading non-demo lesson
  const unenrolledReadRes = await getLessonAiContentService({
    lessonId: lessonNonDemo.id,
    userId: studentUnenrolled.id,
    role: UserRole.USER
  })
  assert(
    unenrolledReadRes.success === false && unenrolledReadRes.statusCode === 403,
    'Group 7',
    'Unenrolled student cannot read AI content of non-demo lesson (403 Forbidden)'
  )

  // 3. Unauthenticated public caller reading non-demo lesson
  const anonymousReadRes = await getLessonAiContentService({
    lessonId: lessonNonDemo.id
  })
  assert(
    anonymousReadRes.success === false && anonymousReadRes.statusCode === 401,
    'Group 7',
    'Unauthenticated caller cannot read non-demo lesson AI content (401 Unauthorized)'
  )

  // 4. Unenrolled student reading DEMO lesson
  const demoReadRes = await getLessonAiContentService({
    lessonId: lessonDemo.id,
    userId: studentUnenrolled.id,
    role: UserRole.USER
  })
  assert(demoReadRes.success === true, 'Group 7', 'Unenrolled student CAN read AI content of demo lesson')

  // 5. Anonymous public caller reading DEMO lesson
  const anonDemoReadRes = await getLessonAiContentService({
    lessonId: lessonDemo.id
  })
  assert(anonDemoReadRes.success === true, 'Group 7', 'Anonymous public caller CAN read AI content of demo lesson')

  // 6. Teacher owner reading lesson sees operational error
  const teacherReadRes = await getLessonAiContentService({
    lessonId: lessonNonDemo.id,
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(teacherReadRes.success === true, 'Group 7', 'Teacher owner can read lesson AI content')
  assert(
    teacherReadRes.data?.aiProcessingError?.includes('Internal server secret error') === true,
    'Group 7',
    'Teacher owner can view aiProcessingError for operational debugging'
  )

  // 7. Full Lesson detail endpoint (GET /api/lessons/:id)
  const lessonDetailRes = await getLessonByIdService({
    lessonId: lessonNonDemo.id,
    userId: studentEnrolled.id,
    role: UserRole.USER
  })
  assert(lessonDetailRes.success === true, 'Group 7', 'GET /api/lessons/:id returns lesson detail for enrolled student')
  assert(lessonDetailRes.data?.transcript !== undefined, 'Group 7', 'Lesson detail includes transcript')
  assert(lessonDetailRes.data?.summary !== undefined, 'Group 7', 'Lesson detail includes summary')
  assert(!('aiProcessingError' in (lessonDetailRes.data || {})), 'Group 7', 'Lesson detail redacts aiProcessingError')

  // --------------------------------------------------------------------------
  // GROUP 8: STALE AI JOB CONFLICT PREVENTION
  // --------------------------------------------------------------------------
  console.log('\n--- Group 8: Stale AI Job Conflict Prevention ---')

  // 1. Mismatched bunnyVideoId
  const mismatchedVideoRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: {
      transcript: '# New transcript from obsolete video',
      bunnyVideoId: 'obsolete-video-999',
      aiProcessingStatus: AiProcessingStatus.COMPLETED
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(
    mismatchedVideoRes.success === false && mismatchedVideoRes.statusCode === 409,
    'Group 8',
    'Stale AI job with mismatched bunnyVideoId rejected with 409 Conflict'
  )

  // 2. Timestamp older than current aiProcessedAt
  const currentProcessedAt = (await prisma.lesson.findUnique({ where: { id: lessonNonDemo.id } }))?.aiProcessedAt
  const olderTimestamp = new Date((currentProcessedAt?.getTime() || Date.now()) - 100000).toISOString()

  const staleTimeRes = await updateLessonAiContentService({
    lessonId: lessonNonDemo.id,
    payload: {
      transcript: '# Very old transcript',
      clientTimestamp: olderTimestamp,
      aiProcessingStatus: AiProcessingStatus.COMPLETED
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(
    staleTimeRes.success === false && staleTimeRes.statusCode === 409,
    'Group 8',
    'Stale AI job with older clientTimestamp rejected with 409 Conflict'
  )

  // --------------------------------------------------------------------------
  // GROUP 9: BACKWARD COMPATIBILITY OF EXISTING LESSON APIS
  // --------------------------------------------------------------------------
  console.log('\n--- Group 9: Backward Compatibility of Existing Lesson APIs ---')

  // 1. Create a lesson with generic payload
  const createGenericRes = await createLessonService({
    payload: {
      title: `Bài học kiểm thử tương thích ${timestamp}`,
      chapter: chapter.id,
      course: course.id,
      type: LessonType.VIDEO,
      duration: 120,
      content: 'Nội dung thông thường'
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(createGenericRes.success === true, 'Group 9', 'Existing createLessonService works backward-compatibly')
  assert(createGenericRes.data?.id !== undefined, 'Group 9', 'New lesson created with UUID')

  // 2. Update lesson generic fields
  const updateGenericRes = await updateLessonService({
    lessonId: createGenericRes.data.id,
    payload: {
      title: `Bài học đã cập nhật ${timestamp}`,
      duration: 150
    },
    userId: teacherOwner.id,
    role: UserRole.TEACHER
  })
  assert(updateGenericRes.success === true, 'Group 9', 'Existing updateLessonService works backward-compatibly')
  assert(updateGenericRes.data?.duration === 150, 'Group 9', 'Lesson duration updated successfully')

  // 3. Get lessons by chapter (list endpoint)
  const listByChapterRes = await getLessonsByChapterService(chapter.id)
  assert(listByChapterRes.success === true, 'Group 9', 'getLessonsByChapterService works backward-compatibly')
  assert(Array.isArray(listByChapterRes.data), 'Group 9', 'Lessons by chapter returned as list')
  // Ensure large list items do not leak internal operational errors
  const firstItem = listByChapterRes.data?.[0]
  assert(!('aiProcessingError' in (firstItem || {})), 'Group 9', 'Lessons list does not leak aiProcessingError')

  // --------------------------------------------------------------------------
  // GROUP 10: EXPRESS ROUTE REGISTRATION AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- Group 10: Express Route Registration Audit ---')

  const registeredRoutes = lessonRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route?.path,
      methods: Object.keys(layer.route?.methods || {})
    }))

  const hasPatchAiContent = registeredRoutes.some(
    (r) => r.path === '/:id/ai-content' && r.methods.includes('patch')
  )
  const hasGetAiContent = registeredRoutes.some(
    (r) => r.path === '/:id/ai-content' && r.methods.includes('get')
  )
  const hasGetDetail = registeredRoutes.some(
    (r) => r.path === '/:id' && r.methods.includes('get')
  )

  assert(hasPatchAiContent, 'Group 10', 'PATCH /api/lessons/:id/ai-content is registered in lessonRouter')
  assert(hasGetAiContent, 'Group 10', 'GET /api/lessons/:id/ai-content is registered in lessonRouter')
  assert(hasGetDetail, 'Group 10', 'GET /api/lessons/:id is registered in lessonRouter')

  // --------------------------------------------------------------------------
  // CLEANUP TEST ENTITIES
  // --------------------------------------------------------------------------
  console.log('\n--- Cleaning Up Database Fixtures ---')
  await prisma.lesson.deleteMany({ where: { courseId: course.id } }).catch(() => {})
  await prisma.chapter.deleteMany({ where: { courseId: course.id } }).catch(() => {})
  await prisma.enrollment.deleteMany({ where: { courseId: course.id } }).catch(() => {})
  await prisma.course.delete({ where: { id: course.id } }).catch(() => {})
  await prisma.category.delete({ where: { id: category.id } }).catch(() => {})
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [teacherOwner.id, teacherOther.id, adminUser.id, studentEnrolled.id, studentUnenrolled.id]
      }
    }
  }).catch(() => {})

  console.log('Test fixtures cleaned up successfully.')

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n=================================================================')
  console.log(`STEP 6.5 VERIFICATION COMPLETE: ${passedChecks}/${totalChecks} PASSED (${failedChecks} FAILED)`)
  console.log('=================================================================')

  if (failedChecks > 0) {
    process.exit(1)
  }
}

runStep6_5Tests()
  .catch((err) => {
    console.error('FATAL TEST ERROR:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
