/**
 * Test Suite for Phase 3 Step 1: Course, Chapter, Lesson Zod Application Models & Legacy Mongoose Isolation
 *
 * File: scripts/migration-utils/step-01-phase3-zod-models.test.ts
 */

import {
  courseSchema,
  coursePublicSchema,
  courseCompactSchema,
  courseDetailResponseSchema,
  courseFaqSchema,
  courseInfoCompatibilitySchema,
  createCourseInputSchema,
  updateCourseInputSchema,
  updateCourseStatusInputSchema
} from '../../src/models/course.model'
import CourseModelLegacy, { courseSchema as legacyCourseSchema } from '../../src/models/legacy/course.legacy.model'

import {
  chapterSchema,
  chapterPublicSchema,
  chapterCompactSchema,
  createChapterInputSchema,
  updateChapterInputSchema
} from '../../src/models/chapter.model'
import ChapterModelLegacy, { ChapterSchema as legacyChapterSchema } from '../../src/models/legacy/chapter.legacy.model'

import {
  lessonSchema,
  lessonPublicSchema,
  lessonStudySchema,
  lessonCompactSchema,
  createLessonInputSchema,
  updateLessonInputSchema
} from '../../src/models/lesson.model'
import LessonModelLegacy, { lessonSchema as legacyLessonSchema } from '../../src/models/legacy/lesson.legacy.model'

import { CourseLevel, CourseStatus, CourseType, LessonType } from '@prisma/client'
import prisma from '../../src/config/prisma'
import fs from 'fs'
import path from 'path'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 3 STEP 1 — ZOD APPLICATION MODELS & LEGACY ISOLATION')
  console.log('='.repeat(80))

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  PASSED: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAILED: ${testName}`)
      failed++
    }
  }

  // ==========================================
  // GROUP 1: COURSE ZOD DOMAIN SCHEMAS
  // ==========================================
  console.log('\n[1. COURSE ZOD DOMAIN SCHEMAS VALIDATION]:')

  const validCourseData = {
    id: '11111111-1111-5111-8111-111111111111',
    title: 'Khóa học Lập trình TypeScript Toàn diện',
    slug: 'khoa-hoc-lap-trinh-typescript-toan-dien',
    image: 'https://example.com/course.png',
    introUrl: 'https://example.com/intro.mp4',
    description: 'Khóa học TypeScript từ cơ bản đến nâng cao',
    price: 499000,
    oldPrice: 999000,
    type: CourseType.PAID,
    status: CourseStatus.APPROVED,
    level: CourseLevel.INTERMEDIATE,
    view: 1250,
    sold: 85,
    requirements: ['Biết cơ bản JavaScript', 'Có máy tính cá nhân'],
    benefits: ['Làm chủ TypeScript', 'Tự tin ứng tuyển công việc'],
    techniques: ['TypeScript', 'Express', 'Prisma'],
    documents: ['Slide bài giảng', 'Source code GitHub'],
    categoryId: '22222222-2222-5222-8222-222222222222',
    authorId: '33333333-3333-5333-8333-333333333333',
    isDestroyed: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z')
  }

  // Test 1.1: courseSchema parses valid data
  const parsedCourse = courseSchema.safeParse(validCourseData)
  assert(parsedCourse.success, 'courseSchema successfully parses valid domain Course object')

  // Test 1.2: courseSchema rejects invalid UUID
  const invalidUUIDCourse = courseSchema.safeParse({ ...validCourseData, id: 'not-a-valid-uuid' })
  assert(!invalidUUIDCourse.success, 'courseSchema correctly rejects non-UUID id')

  // Test 1.3: courseSchema rejects negative price
  const invalidPriceCourse = courseSchema.safeParse({ ...validCourseData, price: -500 })
  assert(!invalidPriceCourse.success, 'courseSchema correctly rejects negative price')

  // Test 1.4: courseSchema rejects invalid enum value
  const invalidEnumCourse = courseSchema.safeParse({ ...validCourseData, type: 'UNKNOWN_TYPE' as any })
  assert(!invalidEnumCourse.success, 'courseSchema correctly rejects invalid CourseType enum')

  // Test 1.5: coursePublicSchema preserves all public fields
  const publicCourse = coursePublicSchema.parse(validCourseData)
  assert(
    publicCourse.id === validCourseData.id &&
      publicCourse.title === validCourseData.title &&
      publicCourse.slug === validCourseData.slug &&
      publicCourse.price === 499000,
    'coursePublicSchema preserves required public fields'
  )

  // Test 1.6: courseCompactSchema contains only essential summary fields
  const compactCourse = courseCompactSchema.parse(validCourseData)
  const compactKeys = Object.keys(compactCourse).sort()
  assert(
    JSON.stringify(compactKeys) === JSON.stringify(['id', 'image', 'price', 'slug', 'status', 'title', 'type']),
    `courseCompactSchema contains expected keys (got: ${compactKeys.join(', ')})`
  )

  // Test 1.7: courseFaqSchema validation
  const validFaq = {
    id: '44444444-4444-5444-8444-444444444444',
    courseId: validCourseData.id,
    question: 'Khóa học có cấp chứng chỉ không?',
    answer: 'Có, hoàn thành 100% bài học sẽ được cấp chứng chỉ điện tử.',
    order: 1,
    createdAt: new Date()
  }
  const parsedFaq = courseFaqSchema.safeParse(validFaq)
  assert(parsedFaq.success, 'courseFaqSchema validates CourseFaq correctly')

  // Test 1.8: courseInfoCompatibilitySchema validation
  const validInfo = {
    requirements: ['Node.js v20+'],
    benefits: ['Fullstack skills'],
    techniques: ['PostgreSQL'],
    documents: ['Cheatsheet'],
    qa: [
      {
        question: 'Ai nên học?',
        answer: 'Tất cả mọi người'
      }
    ]
  }
  const parsedInfo = courseInfoCompatibilitySchema.safeParse(validInfo)
  assert(parsedInfo.success, 'courseInfoCompatibilitySchema validates legacy nested info structure')

  // Test 1.9: courseDetailResponseSchema validation
  const detailData = {
    ...publicCourse,
    author: {
      id: validCourseData.authorId,
      username: 'teacher_minh',
      avatar: 'https://example.com/avatar.jpg',
      role: 'USER' as any
    },
    category: {
      id: validCourseData.categoryId,
      name: 'Lập trình Web',
      slug: 'lap-trinh-web'
    },
    faqs: [validFaq],
    info: validInfo
  }
  const parsedDetail = courseDetailResponseSchema.safeParse(detailData)
  assert(parsedDetail.success, 'courseDetailResponseSchema validates full course detail structure')

  // Test 1.10: createCourseInputSchema validation
  const validCreateInput = {
    title: 'Khóa học React Native Mới',
    authorId: '33333333-3333-5333-8333-333333333333',
    price: 399000,
    type: CourseType.PAID
  }
  const parsedCreate = createCourseInputSchema.safeParse(validCreateInput)
  assert(parsedCreate.success, 'createCourseInputSchema validates valid course creation input')

  // ==========================================
  // GROUP 2: CHAPTER ZOD DOMAIN SCHEMAS
  // ==========================================
  console.log('\n[2. CHAPTER ZOD DOMAIN SCHEMAS VALIDATION]:')

  const validChapterData = {
    id: '55555555-5555-5555-8555-555555555555',
    title: 'Chương 1: Giới thiệu kiến trúc Clean Architecture',
    courseId: validCourseData.id,
    order: 1,
    isDestroyed: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z')
  }

  // Test 2.1: chapterSchema parses valid data
  const parsedChapter = chapterSchema.safeParse(validChapterData)
  assert(parsedChapter.success, 'chapterSchema successfully parses valid domain Chapter object')

  // Test 2.2: chapterSchema rejects invalid UUID
  const invalidChapterUUID = chapterSchema.safeParse({ ...validChapterData, id: 'invalid-chapter-id' })
  assert(!invalidChapterUUID.success, 'chapterSchema correctly rejects non-UUID id')

  // Test 2.3: chapterPublicSchema filtering
  const publicChapter = chapterPublicSchema.parse(validChapterData)
  assert(
    publicChapter.id === validChapterData.id &&
      publicChapter.title === validChapterData.title &&
      publicChapter.order === 1,
    'chapterPublicSchema correctly filters public fields'
  )

  // Test 2.4: chapterCompactSchema keys
  const compactChapter = chapterCompactSchema.parse(validChapterData)
  const compactChapterKeys = Object.keys(compactChapter).sort()
  assert(
    JSON.stringify(compactChapterKeys) === JSON.stringify(['id', 'order', 'title']),
    `chapterCompactSchema contains exactly [id, order, title] (got: ${compactChapterKeys.join(', ')})`
  )

  // Test 2.5: createChapterInputSchema
  const parsedCreateChapter = createChapterInputSchema.safeParse({
    title: 'Chương 2: Thiết lập Prisma Singleton',
    courseId: validCourseData.id,
    order: 2
  })
  assert(parsedCreateChapter.success, 'createChapterInputSchema validates chapter creation input')

  // ==========================================
  // GROUP 3: LESSON ZOD DOMAIN SCHEMAS
  // ==========================================
  console.log('\n[3. LESSON ZOD DOMAIN SCHEMAS VALIDATION]:')

  const validLessonData = {
    id: '66666666-6666-5666-8666-666666666666',
    title: 'Bài 1: Khởi tạo Project & TypeScript Config',
    slug: 'bai-1-khoi-tao-project-typescript-config',
    chapterId: validChapterData.id,
    courseId: validCourseData.id,
    authorId: validCourseData.authorId,
    order: 1,
    duration: 650,
    type: LessonType.VIDEO,
    content: 'Hướng dẫn cài đặt Node.js, pnpm, tsconfig.json và eslint.',
    isDemo: true,
    videoUrl: 'https://youtube.com/watch?v=demo123',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z')
  }

  // Test 3.1: lessonSchema parses valid data
  const parsedLesson = lessonSchema.safeParse(validLessonData)
  assert(parsedLesson.success, 'lessonSchema successfully parses valid domain Lesson object')

  // Test 3.2: lessonSchema rejects non-UUID courseId
  const invalidLessonCourseId = lessonSchema.safeParse({ ...validLessonData, courseId: 'non-uuid' })
  assert(!invalidLessonCourseId.success, 'lessonSchema rejects non-UUID courseId')

  // Test 3.3: lessonPublicSchema excludes private videoUrl & content
  const publicLesson = lessonPublicSchema.parse(validLessonData)
  assert(
    !('videoUrl' in publicLesson) && !('content' in publicLesson),
    'lessonPublicSchema correctly omits videoUrl and full content'
  )

  // Test 3.4: lessonStudySchema retains videoUrl & content for enrolled/authorized access
  const studyLesson = lessonStudySchema.parse(validLessonData)
  assert(
    studyLesson.videoUrl === validLessonData.videoUrl && studyLesson.content === validLessonData.content,
    'lessonStudySchema retains videoUrl and content for study sessions'
  )

  // Test 3.5: lessonCompactSchema keys
  const compactLesson = lessonCompactSchema.parse(validLessonData)
  const compactLessonKeys = Object.keys(compactLesson).sort()
  assert(
    JSON.stringify(compactLessonKeys) === JSON.stringify(['duration', 'id', 'isDemo', 'order', 'slug', 'title', 'type']),
    `lessonCompactSchema contains expected compact keys (got: ${compactLessonKeys.join(', ')})`
  )

  // Test 3.6: createLessonInputSchema
  const parsedCreateLesson = createLessonInputSchema.safeParse({
    title: 'Bài 2: Tạo Prisma Schema',
    chapterId: validChapterData.id,
    courseId: validCourseData.id,
    authorId: validCourseData.authorId,
    type: LessonType.VIDEO,
    isDemo: false
  })
  assert(parsedCreateLesson.success, 'createLessonInputSchema validates lesson creation input')

  // ==========================================
  // GROUP 4: LEGACY MONGOOSE MODELS ISOLATION
  // ==========================================
  console.log('\n[4. LEGACY MONGOOSE MODELS REGISTRATION & ISOLATION]:')

  assert(typeof CourseModelLegacy !== 'undefined', 'Legacy CourseModel is defined and importable')
  assert(CourseModelLegacy.modelName === 'Course', `Legacy CourseModel registered as 'Course' (got '${CourseModelLegacy.modelName}')`)

  assert(typeof ChapterModelLegacy !== 'undefined', 'Legacy ChapterModel is defined and importable')
  assert(ChapterModelLegacy.modelName === 'Chapter', `Legacy ChapterModel registered as 'Chapter' (got '${ChapterModelLegacy.modelName}')`)

  assert(typeof LessonModelLegacy !== 'undefined', 'Legacy LessonModel is defined and importable')
  assert(LessonModelLegacy.modelName === 'Lesson', `Legacy LessonModel registered as 'Lesson' (got '${LessonModelLegacy.modelName}')`)

  // Verify timestamps option in legacy schemas
  assert((legacyCourseSchema as any).options?.timestamps === true, 'Legacy courseSchema preserves timestamps: true')
  assert((legacyChapterSchema as any).options?.timestamps === true, 'Legacy chapterSchema preserves timestamps: true')
  assert((legacyLessonSchema as any).options?.timestamps === true, 'Legacy lessonSchema preserves timestamps: true')

  // ==========================================
  // GROUP 5: PURITY CHECK (NO MONGOOSE IN APPLICATION MODELS)
  // ==========================================
  console.log('\n[5. APPLICATION MODELS PURITY AUDIT]:')

  const courseModelContent = fs.readFileSync(path.resolve(__dirname, '../../src/models/course.model.ts'), 'utf-8')
  assert(!courseModelContent.includes("from 'mongoose'"), 'course.model.ts does NOT import from mongoose')
  assert(!courseModelContent.includes("PrismaClient"), 'course.model.ts does NOT import PrismaClient class')

  const chapterModelContent = fs.readFileSync(path.resolve(__dirname, '../../src/models/chapter.model.ts'), 'utf-8')
  assert(!chapterModelContent.includes("from 'mongoose'"), 'chapter.model.ts does NOT import from mongoose')
  assert(!chapterModelContent.includes("PrismaClient"), 'chapter.model.ts does NOT import PrismaClient class')

  const lessonModelContent = fs.readFileSync(path.resolve(__dirname, '../../src/models/lesson.model.ts'), 'utf-8')
  assert(!lessonModelContent.includes("from 'mongoose'"), 'lesson.model.ts does NOT import from mongoose')
  assert(!lessonModelContent.includes("PrismaClient"), 'lesson.model.ts does NOT import PrismaClient class')

  // ==========================================
  // GROUP 6: DATABASE INTEGRITY VERIFICATION (0 MUTATION)
  // ==========================================
  console.log('\n[6. DATABASE RECORD COUNTS INTEGRITY CHECK]:')

  const [coursesCount, courseFaqsCount, chaptersCount, lessonsCount, usersCount, categoriesCount] = await Promise.all([
    prisma.course.count(),
    prisma.courseFaq.count(),
    prisma.chapter.count(),
    prisma.lesson.count(),
    prisma.user.count(),
    prisma.category.count()
  ])

  console.log(`  Current counts in PostgreSQL:`)
  console.log(`    - courses: ${coursesCount} (baseline: 8)`)
  console.log(`    - course_faqs: ${courseFaqsCount} (baseline: 8)`)
  console.log(`    - chapters: ${chaptersCount} (baseline: 12)`)
  console.log(`    - lessons: ${lessonsCount} (baseline: 7)`)
  console.log(`    - users: ${usersCount} (baseline: 11 [8 migrated + 3 Phase 2 Step 4 test users])`)
  console.log(`    - categories: ${categoriesCount} (baseline: 3)`)

  assert(coursesCount === 8, 'PostgreSQL courses count unchanged (exactly 8)')
  assert(courseFaqsCount === 8, 'PostgreSQL course_faqs count unchanged (exactly 8)')
  assert(chaptersCount === 12, 'PostgreSQL chapters count unchanged (exactly 12)')
  assert(lessonsCount === 7, 'PostgreSQL lessons count unchanged (exactly 7)')
  assert(usersCount === 11, 'PostgreSQL users count unchanged (exactly 11)')
  assert(categoriesCount === 3, 'PostgreSQL categories count unchanged (exactly 3)')

  console.log('='.repeat(80))
  console.log(`  RESULT: ${passed} PASSED | ${failed} FAILED`)
  console.log('='.repeat(80))

  await prisma.$disconnect()

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
