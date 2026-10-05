/**
 * TMDEMY — PHASE 3 STEP 4 TEST SUITE
 * Course, Chapter & Lesson Middleware & Validators Verification
 *
 * File: scripts/migration-utils/step-04-phase3-middleware.test.ts
 */

import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { connectPrisma, disconnectPrisma, prisma } from '../../src/config/prisma'
import {
  chapterIdValidator,
  createChapterValidator,
  updateChapterValidator
} from '../../src/middlewares/chapter.middleware'
import {
  courseIdValidator,
  createCourseValidator,
  listPublicCoursesValidator,
  updateCourseByAdminValidator,
  updateCourseStatusValidator,
  updateCourseValidator
} from '../../src/middlewares/course.middleware'
import {
  chapterIdValidator as lessonChapterIdValidator,
  createLessonValidator,
  lessonIdValidator,
  updateLessonValidator
} from '../../src/middlewares/lesson.middleware'
import { createNewRatingValidator } from '../../src/middlewares/rating.middleware'

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  PASSED: ${testName}`)
  } else {
    failedTests++
    console.error(`  FAILED: ${testName}${detail ? ` — ${detail}` : ''}`)
  }
}

// Helper to run express-validator chains against a mock request
async function runValidation(chains: any[], req: Partial<Request>): Promise<any[]> {
  const mockReq = {
    headers: {},
    params: {},
    query: {},
    body: {},
    ...req
  } as Request
  for (const middleware of chains) {
    await new Promise<void>((resolve) => {
      middleware(mockReq, {} as Response, () => {
        resolve()
      })
    })
  }
  const result = validationResult(mockReq)
  return result.array()
}

async function runStep4Tests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 3 STEP 4 — COURSE, CHAPTER & LESSON MIDDLEWARE & VALIDATORS')
  console.log('='.repeat(80))

  await connectPrisma()

  const initialCounts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    courses: await prisma.course.count(),
    course_faqs: await prisma.courseFaq.count(),
    chapters: await prisma.chapter.count(),
    lessons: await prisma.lesson.count()
  }

  const validUUID = 'a0000000-0000-4000-8000-000000000001'
  const validUUID2 = 'b0000000-0000-4000-8000-000000000002'
  const legacyObjectId = '507f1f77bcf86cd799439011'
  const malformedId = 'not-a-valid-uuid-or-id'

  // ==========================================
  // SUITE 1: COURSE VALIDATORS
  // ==========================================
  console.log('\n--- SUITE 1: Course Validators ---')

  // 1.1 courseIdValidator
  const validCourseIdErrors = await runValidation(courseIdValidator, { params: { id: validUUID } })
  assert(validCourseIdErrors.length === 0, '[courseIdValidator] Valid UUID accepted with 0 errors')

  const legacyCourseIdErrors = await runValidation(courseIdValidator, { params: { id: legacyObjectId } })
  assert(legacyCourseIdErrors.length > 0, '[courseIdValidator] Rejects legacy MongoDB ObjectId')
  assert(
    legacyCourseIdErrors.some((e) => e.msg === 'Invalid course ID'),
    '[courseIdValidator] Returns "Invalid course ID" for legacy ObjectId'
  )

  const malformedCourseIdErrors = await runValidation(courseIdValidator, { params: { id: malformedId } })
  assert(malformedCourseIdErrors.length > 0, '[courseIdValidator] Rejects malformed ID string')

  const missingCourseIdErrors = await runValidation(courseIdValidator, { params: {} })
  assert(
    missingCourseIdErrors.some((e) => e.msg === 'Course ID is required'),
    '[courseIdValidator] Requires Course ID parameter'
  )

  // 1.2 createCourseValidator
  const validCourseBody = {
    title: 'Modern TypeScript Bootcamp',
    description: 'Master TypeScript from scratch',
    category: validUUID,
    type: 'paid',
    price: 99.99,
    old_price: 199.99,
    level: 'beginner',
    info: {
      requirements: ['Basic JS'],
      benefits: ['Type safety'],
      qa: [{ question: 'Q1', answer: 'A1' }]
    }
  }
  const validCreateCourseErrors = await runValidation(createCourseValidator, { body: validCourseBody })
  assert(validCreateCourseErrors.length === 0, '[createCourseValidator] Valid course body accepted')

  // Reject legacy ObjectId for category
  const legacyCatCourseErrors = await runValidation(createCourseValidator, {
    body: { ...validCourseBody, category: legacyObjectId }
  })
  assert(
    legacyCatCourseErrors.some((e) => e.msg === 'Invalid category id'),
    '[createCourseValidator] Rejects legacy ObjectId for category'
  )

  // Reject invalid course type enum
  const badTypeCourseErrors = await runValidation(createCourseValidator, {
    body: { ...validCourseBody, type: 'invalid_type' }
  })
  assert(
    badTypeCourseErrors.some((e) => e.msg === 'Invalid course type'),
    '[createCourseValidator] Rejects invalid course type enum'
  )

  // Reject dangerous client fields
  const dangerousFields = ['status', '_destroy', 'author', 'rating']
  for (const field of dangerousFields) {
    const dangerousErrors = await runValidation(createCourseValidator, {
      body: { ...validCourseBody, [field]: 'hacked' }
    })
    assert(dangerousErrors.length > 0, `[createCourseValidator] Blocks client override of dangerous field "${field}"`)
  }

  // 1.3 listPublicCoursesValidator
  const validListQuery = {
    page: '1',
    limit: '20',
    category: validUUID,
    author: validUUID2,
    level: 'beginner',
    type: 'paid'
  }
  const validListErrors = await runValidation(listPublicCoursesValidator, { query: validListQuery })
  assert(validListErrors.length === 0, '[listPublicCoursesValidator] Valid query parameters accepted')

  const legacyCatQueryErrors = await runValidation(listPublicCoursesValidator, {
    query: { category: legacyObjectId }
  })
  assert(
    legacyCatQueryErrors.some((e) => e.msg === 'Invalid category id'),
    '[listPublicCoursesValidator] Rejects legacy ObjectId for category query'
  )

  const legacyAuthorQueryErrors = await runValidation(listPublicCoursesValidator, {
    query: { author: legacyObjectId }
  })
  assert(
    legacyAuthorQueryErrors.some((e) => e.msg === 'Invalid author id'),
    '[listPublicCoursesValidator] Rejects legacy ObjectId for author query'
  )

  // 1.4 updateCourseValidator
  const validUpdateCourseErrors = await runValidation(updateCourseValidator, {
    params: { id: validUUID },
    body: { title: 'Updated Title' }
  })
  assert(validUpdateCourseErrors.length === 0, '[updateCourseValidator] Valid course update accepted')

  const legacyUpdateCourseErrors = await runValidation(updateCourseValidator, {
    params: { id: legacyObjectId },
    body: { title: 'Updated Title' }
  })
  assert(
    legacyUpdateCourseErrors.some((e) => e.msg === 'Invalid course ID'),
    '[updateCourseValidator] Rejects legacy ObjectId for route parameter'
  )

  // 1.5 updateCourseStatusValidator
  const validStatusErrors = await runValidation(updateCourseStatusValidator, {
    params: { id: validUUID },
    body: { status: 'approved' }
  })
  assert(validStatusErrors.length === 0, '[updateCourseStatusValidator] Valid course status payload accepted')

  const invalidStatusEnumErrors = await runValidation(updateCourseStatusValidator, {
    params: { id: validUUID },
    body: { status: 'INVALID_STATUS' }
  })
  assert(
    invalidStatusEnumErrors.some((e) => e.msg === 'Invalid course status'),
    '[updateCourseStatusValidator] Rejects invalid status enum'
  )

  const missingStatusErrors = await runValidation(updateCourseStatusValidator, {
    params: { id: validUUID },
    body: {}
  })
  assert(
    missingStatusErrors.some((e) => e.msg === 'Course status is required'),
    '[updateCourseStatusValidator] Requires status field'
  )

  const legacyStatusIdErrors = await runValidation(updateCourseStatusValidator, {
    params: { id: legacyObjectId },
    body: { status: 'approved' }
  })
  assert(
    legacyStatusIdErrors.some((e) => e.msg === 'Invalid course ID'),
    '[updateCourseStatusValidator] Rejects legacy ObjectId for course ID'
  )

  // ==========================================
  // SUITE 2: CHAPTER VALIDATORS
  // ==========================================
  console.log('\n--- SUITE 2: Chapter Validators ---')

  // 2.1 createChapterValidator
  const validChapterBody = {
    title: 'Chapter 1: Getting Started',
    order: 1
  }
  const validCreateChErrors = await runValidation(createChapterValidator, {
    params: { courseId: validUUID },
    body: validChapterBody
  })
  assert(validCreateChErrors.length === 0, '[createChapterValidator] Valid chapter creation payload accepted')

  const legacyCourseIdChErrors = await runValidation(createChapterValidator, {
    params: { courseId: legacyObjectId },
    body: validChapterBody
  })
  assert(
    legacyCourseIdChErrors.some((e) => e.msg === 'Invalid course ID'),
    '[createChapterValidator] Rejects legacy ObjectId for courseId param'
  )

  const shortTitleChErrors = await runValidation(createChapterValidator, {
    params: { courseId: validUUID },
    body: { title: 'ab' }
  })
  assert(
    shortTitleChErrors.some((e) => e.msg === 'Chapter title must be at least 3 characters'),
    '[createChapterValidator] Rejects chapter title < 3 characters'
  )

  // 2.2 updateChapterValidator
  const validUpdateChErrors = await runValidation(updateChapterValidator, {
    params: { id: validUUID },
    body: { title: 'Chapter 1: Revised' }
  })
  assert(validUpdateChErrors.length === 0, '[updateChapterValidator] Valid chapter update payload accepted')

  const legacyUpdateChErrors = await runValidation(updateChapterValidator, {
    params: { id: legacyObjectId },
    body: { title: 'Chapter 1: Revised' }
  })
  assert(
    legacyUpdateChErrors.some((e) => e.msg === 'Invalid Chapter ID'),
    '[updateChapterValidator] Rejects legacy ObjectId for chapter id'
  )

  // 2.3 chapterIdValidator (used in DELETE /api/chapters/:id)
  const validChapterIdErrors = await runValidation(chapterIdValidator, { params: { id: validUUID } })
  assert(validChapterIdErrors.length === 0, '[chapterIdValidator] Valid Chapter UUID accepted with 0 errors')

  const legacyChapterIdErrors = await runValidation(chapterIdValidator, { params: { id: legacyObjectId } })
  assert(
    legacyChapterIdErrors.some((e) => e.msg === 'Invalid Chapter ID'),
    '[chapterIdValidator] Rejects legacy ObjectId for chapter id'
  )

  const missingChapterIdErrors = await runValidation(chapterIdValidator, { params: {} })
  assert(
    missingChapterIdErrors.some((e) => e.msg === 'Chapter ID is required'),
    '[chapterIdValidator] Requires Chapter ID parameter'
  )

  // ==========================================
  // SUITE 3: LESSON VALIDATORS
  // ==========================================
  console.log('\n--- SUITE 3: Lesson Validators ---')

  // 3.1 createLessonValidator
  const validLessonBody = {
    title: 'Lesson 1: Introduction to Prisma',
    chapter: validUUID,
    course: validUUID2,
    type: 'video',
    duration: 300,
    isDemo: true,
    videoUrl: 'https://cdn.example.com/video.mp4'
  }
  const validCreateLessonErrors = await runValidation(createLessonValidator, { body: validLessonBody })
  assert(validCreateLessonErrors.length === 0, '[createLessonValidator] Valid lesson creation payload accepted')

  // Reject legacy ObjectId for chapter
  const legacyChapterLessonErrors = await runValidation(createLessonValidator, {
    body: { ...validLessonBody, chapter: legacyObjectId }
  })
  assert(
    legacyChapterLessonErrors.some((e) => e.msg === 'Invalid Chapter ID'),
    '[createLessonValidator] Rejects legacy ObjectId for chapter field'
  )

  // Reject legacy ObjectId for course
  const legacyCourseLessonErrors = await runValidation(createLessonValidator, {
    body: { ...validLessonBody, course: legacyObjectId }
  })
  assert(
    legacyCourseLessonErrors.some((e) => e.msg === 'Invalid Course ID'),
    '[createLessonValidator] Rejects legacy ObjectId for course field'
  )

  // Reject title < 5 characters
  const shortTitleLessonErrors = await runValidation(createLessonValidator, {
    body: { ...validLessonBody, title: 'Test' }
  })
  assert(
    shortTitleLessonErrors.some((e) => e.msg === 'Title must be at least 5 characters'),
    '[createLessonValidator] Rejects title < 5 characters'
  )

  // 3.2 updateLessonValidator
  const validUpdateLessonErrors = await runValidation(updateLessonValidator, {
    params: { id: validUUID },
    body: { title: 'Lesson 1: Updated' }
  })
  assert(validUpdateLessonErrors.length === 0, '[updateLessonValidator] Valid lesson update accepted')

  const legacyUpdateLessonErrors = await runValidation(updateLessonValidator, {
    params: { id: legacyObjectId },
    body: { title: 'Lesson 1: Updated' }
  })
  assert(
    legacyUpdateLessonErrors.some((e) => e.msg === 'Invalid Lesson ID'),
    '[updateLessonValidator] Rejects legacy ObjectId for lesson id'
  )

  // 3.3 lessonChapterIdValidator (GET /api/lessons/chapter/:chapterId)
  const validLessonChErrors = await runValidation(lessonChapterIdValidator, {
    params: { chapterId: validUUID }
  })
  assert(validLessonChErrors.length === 0, '[lessonChapterIdValidator] Valid chapterId param accepted')

  const legacyLessonChErrors = await runValidation(lessonChapterIdValidator, {
    params: { chapterId: legacyObjectId }
  })
  assert(
    legacyLessonChErrors.some((e) => e.msg === 'Invalid Chapter ID'),
    '[lessonChapterIdValidator] Rejects legacy ObjectId for chapterId param'
  )

  // 3.4 lessonIdValidator (used in DELETE /api/lessons/:id)
  const validLessonIdErrors = await runValidation(lessonIdValidator, { params: { id: validUUID } })
  assert(validLessonIdErrors.length === 0, '[lessonIdValidator] Valid Lesson UUID accepted with 0 errors')

  const legacyLessonIdParamErrors = await runValidation(lessonIdValidator, { params: { id: legacyObjectId } })
  assert(
    legacyLessonIdParamErrors.some((e) => e.msg === 'Invalid Lesson ID'),
    '[lessonIdValidator] Rejects legacy ObjectId for lesson id'
  )

  const missingLessonIdErrors = await runValidation(lessonIdValidator, { params: {} })
  assert(
    missingLessonIdErrors.some((e) => e.msg === 'Lesson ID is required'),
    '[lessonIdValidator] Requires Lesson ID parameter'
  )

  // ==========================================
  // SUITE 4: UNMIGRATED MODULE LEGACY COMPATIBILITY
  // ==========================================
  console.log('\n--- SUITE 4: Unmigrated Module Legacy Compatibility ---')

  // Rating module still expects ObjectId for courseId until Phase 7
  const legacyRatingValidErrors = await runValidation(createNewRatingValidator, {
    body: {
      courseId: legacyObjectId,
      rate: 5,
      content: 'Great course'
    }
  })
  assert(
    !legacyRatingValidErrors.some((e) => e.path === 'courseId'),
    '[Unmigrated: Rating] Continues to accept MongoDB ObjectId for unmigrated courseId field'
  )

  const legacyRatingBadErrors = await runValidation(createNewRatingValidator, {
    body: {
      courseId: 'invalid-not-object-id',
      rate: 5,
      content: 'Great course'
    }
  })
  assert(
    legacyRatingBadErrors.some((e) => e.path === 'courseId' && e.msg === 'Invalid Course ID'),
    '[Unmigrated: Rating] Continues to reject malformed string for unmigrated courseId'
  )

  // ==========================================
  // SUITE 5: DATABASE ZERO-MUTATION VERIFICATION
  // ==========================================
  console.log('\n--- SUITE 5: Database Zero-Mutation Verification ---')

  const finalCounts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    courses: await prisma.course.count(),
    course_faqs: await prisma.courseFaq.count(),
    chapters: await prisma.chapter.count(),
    lessons: await prisma.lesson.count()
  }

  assert(finalCounts.users === initialCounts.users, `[DB Integrity] users count unchanged (${finalCounts.users})`)
  assert(
    finalCounts.categories === initialCounts.categories,
    `[DB Integrity] categories count unchanged (${finalCounts.categories})`
  )
  assert(finalCounts.courses === initialCounts.courses, `[DB Integrity] courses count unchanged (${finalCounts.courses})`)
  assert(
    finalCounts.course_faqs === initialCounts.course_faqs,
    `[DB Integrity] course_faqs count unchanged (${finalCounts.course_faqs})`
  )
  assert(
    finalCounts.chapters === initialCounts.chapters,
    `[DB Integrity] chapters count unchanged (${finalCounts.chapters})`
  )
  assert(finalCounts.lessons === initialCounts.lessons, `[DB Integrity] lessons count unchanged (${finalCounts.lessons})`)

  console.log('\n' + '='.repeat(80))
  console.log(`  STEP 4 TEST RESULTS: TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`)
  console.log('='.repeat(80) + '\n')

  await disconnectPrisma()

  if (failedTests > 0) {
    process.exit(1)
  }
}

runStep4Tests().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
