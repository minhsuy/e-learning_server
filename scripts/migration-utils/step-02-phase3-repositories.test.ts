/**
 * Test Suite for Phase 3 Step 2: Functional Course, Chapter & Lesson Repositories
 *
 * File: scripts/migration-utils/step-02-phase3-repositories.test.ts
 */

import { CourseLevel, CourseStatus, CourseType, LessonType, Prisma } from '@prisma/client'
import prisma from '../../src/config/prisma'
import {
  COURSE_PUBLIC_SELECT,
  COURSE_COMPACT_SELECT,
  COURSE_DETAIL_SELECT,
  COURSE_ADMIN_SELECT,
  COURSE_TEACHER_SELECT,
  addCourse,
  updateCourse,
  updateCourseStatus,
  softDeleteCourse,
  restoreCourse,
  deleteCourse,
  incrementCourseView,
  incrementCourseSold,
  decrementCourseSold,
  findCourseById,
  findCourseBySlug,
  findCourseDetailBySlug,
  isCourseSlugTaken,
  findCoursesWithPagination,
  findCoursesByAuthor,
  countCourses,
  addCourseFaq,
  addCourseFaqs,
  findFaqsByCourseId,
  deleteFaqsByCourseId
} from '../../src/repositories/course.repository'

import {
  CHAPTER_PUBLIC_SELECT,
  CHAPTER_WITH_LESSONS_SELECT,
  addChapter,
  updateChapter,
  softDeleteChapter,
  restoreChapter,
  deleteChapter,
  findChapterById,
  findChaptersByCourse,
  findMaxChapterOrderByCourse,
  countChapters
} from '../../src/repositories/chapter.repository'

import {
  LESSON_PUBLIC_SELECT,
  LESSON_STUDY_SELECT,
  LESSON_COMPACT_SELECT,
  addLesson,
  updateLesson,
  deleteLesson,
  findLessonById,
  findLessonBySlugAndCourse,
  findLessonsByChapter,
  findLessonsByCourse,
  findMaxLessonOrderByChapter,
  isLessonSlugTakenInCourse,
  countLessons
} from '../../src/repositories/lesson.repository'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 3 STEP 2 — FUNCTIONAL COURSE, CHAPTER & LESSON REPOSITORIES')
  console.log('='.repeat(80))

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${testName}`)
      failed++
    }
  }

  // --- Initial Database Baseline ---
  const [initCourses, initFaqs, initChapters, initLessons, initUsers, initCategories] = await Promise.all([
    prisma.course.count(),
    prisma.courseFaq.count(),
    prisma.chapter.count(),
    prisma.lesson.count(),
    prisma.user.count(),
    prisma.category.count()
  ])

  console.log(`\n  Initial Database State:`)
  console.log(`    - courses: ${initCourses} (expected: 8)`)
  console.log(`    - course_faqs: ${initFaqs} (expected: 8)`)
  console.log(`    - chapters: ${initChapters} (expected: 12)`)
  console.log(`    - lessons: ${initLessons} (expected: 7)`)
  console.log(`    - users: ${initUsers} (expected: 11)`)
  console.log(`    - categories: ${initCategories} (expected: 3)\n`)

  // Retrieve an existing reference lesson, chapter, course, teacher, and category for read tests
  const refLesson = await prisma.lesson.findFirst()
  if (!refLesson) throw new Error('Cannot find reference lesson for testing')

  const refChapter = await prisma.chapter.findUnique({
    where: { id: refLesson.chapterId }
  })
  if (!refChapter) throw new Error('Cannot find reference chapter for testing')

  const refCourse = await prisma.course.findUnique({
    where: { id: refLesson.courseId },
    include: { author: true, category: true, faqs: true, chapters: true }
  })
  if (!refCourse) throw new Error('Cannot find reference course for testing')

  const refTeacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } })
  if (!refTeacher) throw new Error('Cannot find reference teacher for testing')

  const refCategory = await prisma.category.findFirst({ where: { isDestroyed: false } })
  if (!refCategory) throw new Error('Cannot find reference category for testing')

  // ==========================================
  // GROUP 1: PROJECTIONS & INFORMATION PROTECTION
  // ==========================================
  console.log('--- GROUP 1: Prisma Select Constants & Projections ---')

  assert('title' in COURSE_PUBLIC_SELECT && 'slug' in COURSE_PUBLIC_SELECT && 'price' in COURSE_PUBLIC_SELECT, '[Projections] COURSE_PUBLIC_SELECT contains storefront discovery fields')
  assert(!('isDestroyed' in COURSE_PUBLIC_SELECT), '[Projections] COURSE_PUBLIC_SELECT excludes internal isDestroyed flag')
  assert('author' in COURSE_PUBLIC_SELECT && 'category' in COURSE_PUBLIC_SELECT, '[Projections] COURSE_PUBLIC_SELECT includes author and category relations')

  assert('id' in COURSE_COMPACT_SELECT && 'slug' in COURSE_COMPACT_SELECT && !('description' in COURSE_COMPACT_SELECT), '[Projections] COURSE_COMPACT_SELECT is lightweight')

  assert('faqs' in COURSE_DETAIL_SELECT && 'chapters' in COURSE_DETAIL_SELECT, '[Projections] COURSE_DETAIL_SELECT includes nested syllabus and faqs')
  assert('isDestroyed' in COURSE_ADMIN_SELECT, '[Projections] COURSE_ADMIN_SELECT includes admin audit flags')

  assert('id' in CHAPTER_PUBLIC_SELECT && 'title' in CHAPTER_PUBLIC_SELECT && 'order' in CHAPTER_PUBLIC_SELECT, '[Projections] CHAPTER_PUBLIC_SELECT contains chapter metadata')
  assert('lessons' in CHAPTER_WITH_LESSONS_SELECT, '[Projections] CHAPTER_WITH_LESSONS_SELECT nests lesson array')

  assert(!('content' in LESSON_PUBLIC_SELECT) && !('videoUrl' in LESSON_PUBLIC_SELECT), '[Projections] LESSON_PUBLIC_SELECT strictly protects premium content and video URL')
  assert('content' in LESSON_STUDY_SELECT && 'videoUrl' in LESSON_STUDY_SELECT, '[Projections] LESSON_STUDY_SELECT provides study materials for authorized learners')
  assert('isDemo' in LESSON_COMPACT_SELECT, '[Projections] LESSON_COMPACT_SELECT provides navigation attributes')

  // ==========================================
  // GROUP 2: QUERY OPERATIONS (ROOT CLIENT)
  // ==========================================
  console.log('\n--- GROUP 2: Query Operations on Root Prisma Client ---')

  // Course Queries
  const foundCourseById = await findCourseById(refCourse.id)
  assert(foundCourseById !== null && foundCourseById.id === refCourse.id, '[CourseQuery] findCourseById locates course by primary UUID')

  const missingCourse = await findCourseById('00000000-0000-0000-0000-000000000000')
  assert(missingCourse === null, '[CourseQuery] findCourseById returns null for unknown UUID')

  const foundCourseBySlug = await findCourseBySlug(refCourse.slug)
  assert(foundCourseBySlug !== null && foundCourseBySlug.slug === refCourse.slug, '[CourseQuery] findCourseBySlug locates course by unique slug')

  const courseDetail = await findCourseDetailBySlug(refCourse.slug, false)
  assert(courseDetail !== null && Array.isArray(courseDetail.chapters), '[CourseQuery] findCourseDetailBySlug resolves detail with chapters')

  const slugTaken = await isCourseSlugTaken(refCourse.slug)
  assert(slugTaken === true, '[CourseQuery] isCourseSlugTaken returns true for existing slug')

  const slugAvailable = await isCourseSlugTaken('completely-non-existent-unique-slug-12345')
  assert(slugAvailable === false, '[CourseQuery] isCourseSlugTaken returns false for available slug')

  const slugSelfExclude = await isCourseSlugTaken(refCourse.slug, refCourse.id)
  assert(slugSelfExclude === false, '[CourseQuery] isCourseSlugTaken respects excludeId for self')

  const paginatedCourses = await findCoursesWithPagination({ page: 1, limit: 5 })
  assert(paginatedCourses.courses.length <= 5 && paginatedCourses.total >= 1 && paginatedCourses.page === 1, '[CourseQuery] findCoursesWithPagination returns structured paginated payload')

  const searchCourses = await findCoursesWithPagination({ search: refCourse.title.slice(0, 5) })
  assert(searchCourses.courses.length > 0, '[CourseQuery] findCoursesWithPagination filters by title search')

  const totalCourseCount = await countCourses()
  assert(totalCourseCount === initCourses, '[CourseQuery] countCourses matches total courses in database')

  const faqs = await findFaqsByCourseId(refCourse.id)
  assert(Array.isArray(faqs), '[CourseQuery] findFaqsByCourseId returns FAQs array')

  // Chapter Queries
  const foundChapterById = await findChapterById(refChapter.id)
  assert(foundChapterById !== null && foundChapterById.id === refChapter.id, '[ChapterQuery] findChapterById locates chapter by UUID')

  const chaptersForCourse = await findChaptersByCourse(refCourse.id)
  assert(Array.isArray(chaptersForCourse) && chaptersForCourse.length > 0, '[ChapterQuery] findChaptersByCourse returns chapters for course')

  const maxChapterOrder = await findMaxChapterOrderByCourse(refCourse.id)
  assert(typeof maxChapterOrder === 'number' && maxChapterOrder >= 1, '[ChapterQuery] findMaxChapterOrderByCourse returns valid integer order')

  const totalChapterCount = await countChapters()
  assert(totalChapterCount === initChapters, '[ChapterQuery] countChapters matches total chapters in database')

  // Lesson Queries
  const foundLessonById = await findLessonById(refLesson.id)
  assert(foundLessonById !== null && foundLessonById.id === refLesson.id, '[LessonQuery] findLessonById locates lesson by UUID')

  const foundLessonBySlug = await findLessonBySlugAndCourse(refLesson.slug, refLesson.courseId)
  assert(foundLessonBySlug !== null && foundLessonBySlug.id === refLesson.id, '[LessonQuery] findLessonBySlugAndCourse locates lesson by compound key')

  const lessonsForChapter = await findLessonsByChapter(refLesson.chapterId)
  assert(Array.isArray(lessonsForChapter) && lessonsForChapter.length > 0, '[LessonQuery] findLessonsByChapter returns lessons')

  const lessonsForCourse = await findLessonsByCourse(refLesson.courseId)
  assert(Array.isArray(lessonsForCourse) && lessonsForCourse.length > 0, '[LessonQuery] findLessonsByCourse returns lessons')

  const maxLessonOrder = await findMaxLessonOrderByChapter(refLesson.chapterId)
  assert(typeof maxLessonOrder === 'number' && maxLessonOrder >= 1, '[LessonQuery] findMaxLessonOrderByChapter returns valid integer order')

  const lessonSlugTaken = await isLessonSlugTakenInCourse(refLesson.slug, refLesson.courseId)
  assert(lessonSlugTaken === true, '[LessonQuery] isLessonSlugTakenInCourse returns true for existing slug in course')

  const lessonSlugAvailable = await isLessonSlugTakenInCourse('random-new-lesson-slug-xyz', refLesson.courseId)
  assert(lessonSlugAvailable === false, '[LessonQuery] isLessonSlugTakenInCourse returns false for unused slug')

  const totalLessonCount = await countLessons()
  assert(totalLessonCount === initLessons, '[LessonQuery] countLessons matches total lessons in database')

  // ==========================================
  // GROUP 3: TRANSACTIONAL MUTATIONS (GUARANTEED ROLLBACK)
  // ==========================================
  console.log('\n--- GROUP 3: Transactional Mutation Suite (Guaranteed Rollback) ---')

  let rollbackVerified = false

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Course Mutations in Tx
      const testCourseSlug = `test-repo-course-${Date.now()}`
      const createdCourse = await addCourse(
        {
          title: 'Khóa học Test Repository Transactional',
          slug: testCourseSlug,
          description: 'Khóa học phục vụ kiểm thử đơn vị',
          price: 199000,
          oldPrice: 399000,
          type: CourseType.PAID,
          status: CourseStatus.PENDING,
          level: CourseLevel.BEGINNER,
          author: { connect: { id: refTeacher.id } },
          category: { connect: { id: refCategory.id } }
        },
        tx
      )
      assert(createdCourse.id.length === 36, '[TxCourse] addCourse creates course with valid UUID')
      assert(createdCourse.status === CourseStatus.PENDING, '[TxCourse] addCourse defaults status to PENDING')

      // Update Course
      const updatedCourse = await updateCourse(
        createdCourse.id,
        {
          description: 'Mô tả đã được cập nhật qua updateCourse',
          price: 249000
        },
        tx
      )
      assert(updatedCourse.description === 'Mô tả đã được cập nhật qua updateCourse', '[TxCourse] updateCourse mutates description')
      assert(Number(updatedCourse.price) === 249000, '[TxCourse] updateCourse mutates price')

      // Update Course Status
      const approvedCourse = await updateCourseStatus(createdCourse.id, CourseStatus.APPROVED, tx)
      assert(approvedCourse.status === CourseStatus.APPROVED, '[TxCourse] updateCourseStatus updates status to APPROVED')

      // Counter increments
      const viewCourse = await incrementCourseView(createdCourse.id, 10, tx)
      assert(viewCourse.view === 10, '[TxCourse] incrementCourseView atomically increments view count')

      const soldCourse = await incrementCourseSold(createdCourse.id, 3, tx)
      assert(soldCourse.sold === 3, '[TxCourse] incrementCourseSold atomically increments sold count')

      const decSoldCourse = await decrementCourseSold(createdCourse.id, 1, tx)
      assert(decSoldCourse.sold === 2, '[TxCourse] decrementCourseSold atomically decrements sold count')

      // Soft Delete & Restore
      const softDeleted = await softDeleteCourse(createdCourse.id, tx)
      assert(softDeleted.isDestroyed === true, '[TxCourse] softDeleteCourse sets isDestroyed = true')

      const restored = await restoreCourse(createdCourse.id, tx)
      assert(restored.isDestroyed === false, '[TxCourse] restoreCourse sets isDestroyed = false')

      // FAQs in Tx
      const faq1 = await addCourseFaq(
        {
          question: 'FAQ Test 1?',
          answer: 'Answer Test 1',
          order: 1,
          course: { connect: { id: createdCourse.id } }
        },
        tx
      )
      assert(faq1.id.length === 36, '[TxCourseFaq] addCourseFaq creates single FAQ linked to course')

      const batchFaqs = await addCourseFaqs(
        [
          { question: 'FAQ Batch 2?', answer: 'Answer Batch 2', order: 2, courseId: createdCourse.id },
          { question: 'FAQ Batch 3?', answer: 'Answer Batch 3', order: 3, courseId: createdCourse.id }
        ],
        tx
      )
      assert(batchFaqs.count === 2, '[TxCourseFaq] addCourseFaqs inserts multiple FAQs in batch')

      const createdFaqs = await findFaqsByCourseId(createdCourse.id, tx)
      assert(createdFaqs.length === 3, '[TxCourseFaq] findFaqsByCourseId retrieves all 3 created FAQs')

      const deletedFaqs = await deleteFaqsByCourseId(createdCourse.id, tx)
      assert(deletedFaqs.count === 3, '[TxCourseFaq] deleteFaqsByCourseId purges all FAQs')

      // 2. Chapter Mutations in Tx
      const createdChapter1 = await addChapter(
        {
          title: 'Chương 1: Khởi động kiểm thử',
          order: 1,
          course: { connect: { id: createdCourse.id } }
        },
        tx
      )
      assert(createdChapter1.id.length === 36, '[TxChapter] addChapter creates chapter with valid UUID')
      assert(createdChapter1.order === 1, '[TxChapter] addChapter sets order correctly')

      const createdChapter2 = await addChapter(
        {
          title: 'Chương 2: Phát triển chuyên sâu',
          order: 2,
          course: { connect: { id: createdCourse.id } }
        },
        tx
      )

      const maxChapterOrderInTx = await findMaxChapterOrderByCourse(createdCourse.id, tx)
      assert(maxChapterOrderInTx === 2, '[TxChapter] findMaxChapterOrderByCourse calculates max sequence in tx')

      const updatedChapter = await updateChapter(createdChapter1.id, { title: 'Chương 1: Tiêu đề mới' }, tx)
      assert(updatedChapter.title === 'Chương 1: Tiêu đề mới', '[TxChapter] updateChapter mutates chapter title')

      const softDeletedChapter = await softDeleteChapter(createdChapter1.id, tx)
      assert(softDeletedChapter.isDestroyed === true, '[TxChapter] softDeleteChapter sets isDestroyed = true')

      const restoredChapter = await restoreChapter(createdChapter1.id, tx)
      assert(restoredChapter.isDestroyed === false, '[TxChapter] restoreChapter sets isDestroyed = false')

      // 3. Lesson Mutations in Tx
      const testLessonSlug = `bai-hoc-test-${Date.now()}`
      const createdLesson1 = await addLesson(
        {
          title: 'Bài học 1: Giới thiệu cấu trúc',
          slug: testLessonSlug,
          order: 1,
          duration: 300,
          type: LessonType.VIDEO,
          content: 'Nội dung bài học test trong transaction',
          isDemo: true,
          videoUrl: 'https://youtube.com/watch?v=tx-test-video',
          chapter: { connect: { id: createdChapter1.id } },
          course: { connect: { id: createdCourse.id } },
          author: { connect: { id: refTeacher.id } }
        },
        tx
      )
      assert(createdLesson1.id.length === 36, '[TxLesson] addLesson creates lesson with valid UUID')
      assert(createdLesson1.isDemo === true, '[TxLesson] addLesson preserves boolean flags')

      const maxLessonOrderInTx = await findMaxLessonOrderByChapter(createdChapter1.id, tx)
      assert(maxLessonOrderInTx === 1, '[TxLesson] findMaxLessonOrderByChapter calculates max sequence')

      const updatedLesson = await updateLesson(createdLesson1.id, { duration: 450, isDemo: false }, tx)
      assert(updatedLesson.duration === 450 && updatedLesson.isDemo === false, '[TxLesson] updateLesson mutates duration and isDemo')

      // Delete Lesson
      const deletedLesson = await deleteLesson(createdLesson1.id, tx)
      assert(deletedLesson.id === createdLesson1.id, '[TxLesson] deleteLesson hard deletes lesson')

      const lessonAfterDelete = await findLessonById(createdLesson1.id, tx)
      assert(lessonAfterDelete === null, '[TxLesson] Deleted lesson is null in subsequent tx query')

      // 4. Cascade Delete Test
      // Create a lesson in Chapter 2, then delete Chapter 2 to verify cascade
      const cascadeLesson = await addLesson(
        {
          title: 'Bài học Cascade Chapter',
          slug: `cascade-lesson-${Date.now()}`,
          order: 1,
          chapter: { connect: { id: createdChapter2.id } },
          course: { connect: { id: createdCourse.id } },
          author: { connect: { id: refTeacher.id } }
        },
        tx
      )
      assert(cascadeLesson.id.length === 36, '[TxCascade] Lesson created for cascade test')

      await deleteChapter(createdChapter2.id, tx)
      const chapterCheck = await findChapterById(createdChapter2.id, tx)
      assert(chapterCheck === null, '[TxCascade] deleteChapter hard deletes chapter')

      const lessonCheck = await findLessonById(cascadeLesson.id, tx)
      assert(lessonCheck === null, '[TxCascade] Lessons in deleted chapter are cascaded by PostgreSQL foreign key')

      // Hard delete Course and verify everything remaining is cleaned
      await deleteCourse(createdCourse.id, tx)
      const courseCheck = await findCourseById(createdCourse.id, tx)
      assert(courseCheck === null, '[TxCascade] deleteCourse hard deletes course and its remaining relations')

      // Intentional Rollback
      throw new Error('ROLLBACK_INTENTIONAL')
    })
  } catch (err: any) {
    if (err.message === 'ROLLBACK_INTENTIONAL') {
      rollbackVerified = true
    } else {
      console.error('Unexpected transaction error:', err)
    }
  }

  assert(rollbackVerified === true, '[Isolation] Transaction successfully intercepted and rolled back cleanly')

  // ==========================================
  // GROUP 4: DATABASE INTEGRITY VERIFICATION (0 MUTATION)
  // ==========================================
  console.log('\n--- GROUP 4: Database Zero-Mutation Verification ---')

  const [postCourses, postFaqs, postChapters, postLessons, postUsers, postCategories] = await Promise.all([
    prisma.course.count(),
    prisma.courseFaq.count(),
    prisma.chapter.count(),
    prisma.lesson.count(),
    prisma.user.count(),
    prisma.category.count()
  ])

  console.log(`  Final Database State:`)
  console.log(`    - courses: ${postCourses} (initial: ${initCourses})`)
  console.log(`    - course_faqs: ${postFaqs} (initial: ${initFaqs})`)
  console.log(`    - chapters: ${postChapters} (initial: ${initChapters})`)
  console.log(`    - lessons: ${postLessons} (initial: ${initLessons})`)
  console.log(`    - users: ${postUsers} (initial: ${initUsers})`)
  console.log(`    - categories: ${postCategories} (initial: ${initCategories})\n`)

  assert(postCourses === initCourses, '[Isolation] Database zero-mutation assertion: courses count unchanged (8)')
  assert(postFaqs === initFaqs, '[Isolation] Database zero-mutation assertion: course_faqs count unchanged (8)')
  assert(postChapters === initChapters, '[Isolation] Database zero-mutation assertion: chapters count unchanged (12)')
  assert(postLessons === initLessons, '[Isolation] Database zero-mutation assertion: lessons count unchanged (7)')
  assert(postUsers === initUsers, '[Isolation] Database zero-mutation assertion: users count unchanged (11)')
  assert(postCategories === initCategories, '[Isolation] Database zero-mutation assertion: categories count unchanged (3)')

  console.log('='.repeat(80))
  console.log(`  STEP 2 TEST RESULTS: TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
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
