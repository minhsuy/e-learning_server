/**
 * TMDEMY — PHASE 3 STEP 3 TEST SUITE
 * Course, Chapter & Lesson Services Verification with Prisma Functional Repositories
 *
 * File: scripts/migration-utils/step-03-phase3-services.test.ts
 */

import { CourseLevel, CourseStatus, CourseType, UserRole } from '@prisma/client'
import { connectPrisma, disconnectPrisma, prisma } from '../../src/config/prisma'
import {
  deleteCourseByAdminService,
  getCoursesByAdminService,
  updateCourseByAdminService,
  updateCourseStatusForTeacherService
} from '../../src/services/admin.service'
import {
  createChapterService,
  deleteChapterService,
  getChaptersByCourseService,
  updateChapterService
} from '../../src/services/chapter.service'
import {
  createCourseService,
  getCourseDetailPublicService,
  getListCoursesService
} from '../../src/services/course.service'
import {
  createLessonService,
  deleteLessonService,
  getLessonsByChapterService,
  updateLessonService
} from '../../src/services/lesson.service'
import {
  deleteCoursesByTeacherService,
  getCoursesByTeacherService,
  updateCourseByTeacherService
} from '../../src/services/teacher.service'

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

async function runStep3Tests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 3 STEP 3 — COURSE, CHAPTER & LESSON SERVICES MIGRATION')
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

  console.log(
    `\n  Initial State: Users=${initialCounts.users}, Categories=${initialCounts.categories}, ` +
      `Courses=${initialCounts.courses}, CourseFaqs=${initialCounts.course_faqs}, ` +
      `Chapters=${initialCounts.chapters}, Lessons=${initialCounts.lessons}\n`
  )

  // Fetch reference entities for read-only tests
  const approvedCourse = await prisma.course.findFirst({
    where: { status: CourseStatus.APPROVED, isDestroyed: false },
    include: { author: true, category: true, chapters: { where: { isDestroyed: false } } }
  })
  assert(approvedCourse !== null, '[Setup] Found approved course for testing')
  const testSlug = approvedCourse?.slug || ''
  const testCourseId = approvedCourse?.id || ''
  const testTeacherId = approvedCourse?.authorId || ''

  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } })
  const adminId = adminUser?.id || ''

  const anotherTeacher = await prisma.user.findFirst({
    where: { role: UserRole.TEACHER, id: { not: testTeacherId } }
  })
  const otherTeacherId = anotherTeacher?.id || '00000000-0000-4000-8000-000000000099'

  // ==========================================
  // SUITE 1: READ-ONLY SERVICES (COURSE & LESSON)
  // ==========================================
  console.log('--- SUITE 1: Read-Only Public Services ---')

  // 1.1 getCourseDetailPublicService
  const initialView = approvedCourse?.view ?? 0
  const detailRes = await getCourseDetailPublicService({ slug: testSlug, increaseView: true })
  assert(detailRes.success === true, '[CourseDetail] getCourseDetailPublicService returns success')
  assert(detailRes.data.id === testCourseId, '[CourseDetail] Course ID matches')
  assert(detailRes.data._id === testCourseId, '[CourseDetail] Course _id compat matches')
  assert(typeof detailRes.data.price === 'number', '[CourseDetail] Price is Decimal mapped to Number')
  assert(typeof detailRes.data.old_price === 'number', '[CourseDetail] old_price is Number')
  assert(detailRes.data.view === initialView + 1, '[CourseDetail] View count incremented atomically')
  assert(detailRes.data.author !== null, '[CourseDetail] Author is populated')
  assert(Array.isArray(detailRes.data.chapters), '[CourseDetail] Chapters is an array')

  // 1.2 getCourseDetailPublicService with invalid slug
  const notFoundDetail = await getCourseDetailPublicService({ slug: 'non-existent-course-slug-12345' })
  assert(notFoundDetail.success === false, '[CourseDetail] Returns false for unknown slug')
  assert(notFoundDetail.statusCode === 404, '[CourseDetail] Returns 404 for unknown slug')

  // 1.3 getListCoursesService
  const listRes = await getListCoursesService({ page: 1, limit: 10, sortBy: 'createdAt' })
  assert(listRes.success === true, '[CourseList] getListCoursesService returns success')
  assert(Array.isArray(listRes.data.courses), '[CourseList] courses is an array')
  assert(listRes.data.courses.length > 0, '[CourseList] courses array has items')
  assert(typeof listRes.data.courses[0].price === 'number', '[CourseList] Item price is Number')
  assert(listRes.data.courses[0]._id !== undefined, '[CourseList] Item contains _id compat')
  assert(listRes.data.pagination.page === 1, '[CourseList] Pagination page is 1')

  // 1.4 getChaptersByCourseService
  const chListRes = await getChaptersByCourseService({
    courseId: testCourseId,
    userId: testTeacherId,
    role: 'TEACHER'
  })
  assert(chListRes.success === true, '[ChapterList] getChaptersByCourseService returns success')
  assert(Array.isArray(chListRes.data), '[ChapterList] Chapters returned as array')
  if (chListRes.data.length > 0) {
    assert(chListRes.data[0]._id !== undefined, '[ChapterList] Chapter contains _id compat')
    assert(Array.isArray(chListRes.data[0].lessons), '[ChapterList] Chapter contains nested lessons')
  }

  // 1.5 getLessonsByChapterService
  const testChapter = await prisma.chapter.findFirst({
    where: { courseId: testCourseId, isDestroyed: false }
  })
  if (testChapter) {
    const lessonListRes = await getLessonsByChapterService(testChapter.id)
    if (lessonListRes.success) {
      assert(Array.isArray(lessonListRes.data), '[LessonList] getLessonsByChapterService returns array')
      assert(lessonListRes.data[0]._id !== undefined, '[LessonList] Lesson contains _id compat')
    } else {
      assert(lessonListRes.statusCode === 404, '[LessonList] Returns 404 if chapter has no lessons')
    }
  }

  // ==========================================
  // SUITE 2: ISOLATED TRANSACTIONAL MUTATIONS
  // ==========================================
  console.log('\n--- SUITE 2: Isolated Transactional Mutation Suite (Guaranteed Rollback) ---')

  try {
    await prisma.$transaction(async (tx) => {
      // ----------------------------------------------------
      // 2.1 COURSE SERVICE MUTATIONS
      // ----------------------------------------------------
      console.log('  -> Testing Course Service Mutations...')

      // Teacher creates course -> Status MUST BE PENDING
      const teacherCreateRes = await createCourseService(
        {
          author: testTeacherId,
          role: 'TEACHER',
          payload: {
            title: 'Tx Test Teacher Course',
            slug: 'tx-test-teacher-course',
            price: 49.99,
            old_price: 99.99,
            type: CourseType.PAID,
            level: CourseLevel.INTERMEDIATE,
            description: 'Created during test transaction',
            info: {
              requirements: ['Basic JS'],
              benefits: ['Become Fullstack'],
              qa: [
                { question: 'Is certificate included?', answer: 'Yes' },
                { question: 'Duration?', answer: '10 hours' }
              ]
            }
          }
        },
        tx as any
      )

      assert(teacherCreateRes.success === true, '[TxCourse] Teacher creates course successfully')
      assert(teacherCreateRes.data.status === CourseStatus.PENDING, '[TxCourse] Teacher course status defaults to PENDING')
      assert(teacherCreateRes.data.price === 49.99, '[TxCourse] Created price correctly mapped to number')
      assert(teacherCreateRes.data.old_price === 99.99, '[TxCourse] Created old_price correctly mapped to number')
      assert(teacherCreateRes.data.info.qa.length === 2, '[TxCourse] Course FAQs created with course atomically')

      const createdCourseId = teacherCreateRes.data.id

      // Duplicate slug rejection
      const dupSlugRes = await createCourseService(
        {
          author: testTeacherId,
          role: 'TEACHER',
          payload: {
            title: 'Tx Test Duplicate Slug',
            slug: 'tx-test-teacher-course'
          }
        },
        tx as any
      )
      assert(dupSlugRes.success === false, '[TxCourse] Rejects duplicate slug')
      assert(dupSlugRes.statusCode === 409, '[TxCourse] Duplicate slug returns statusCode 409')
      assert(dupSlugRes.errorCode === 'SLUG_CONFLICT', '[TxCourse] Duplicate slug returns SLUG_CONFLICT')

      // Admin creates course -> Status MUST BE APPROVED
      const adminCreateRes = await createCourseService(
        {
          author: adminId,
          role: 'ADMIN',
          payload: {
            title: 'Tx Test Admin Course',
            slug: 'tx-test-admin-course',
            price: 0,
            type: CourseType.FREE
          }
        },
        tx as any
      )
      assert(adminCreateRes.success === true, '[TxCourse] Admin creates course successfully')
      assert(adminCreateRes.data.status === CourseStatus.APPROVED, '[TxCourse] Admin course status is APPROVED')

      // ----------------------------------------------------
      // 2.2 CHAPTER SERVICE MUTATIONS
      // ----------------------------------------------------
      console.log('  -> Testing Chapter Service Mutations...')

      // Chapter creation with auto-increment order
      const chapter1Res = await createChapterService(
        {
          courseId: createdCourseId,
          title: 'Tx Chapter 1',
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(chapter1Res.success === true, '[TxChapter] createChapterService creates Chapter 1')
      assert(chapter1Res.data.order === 1, '[TxChapter] Auto-increment sets order = 1')
      const createdChapter1Id = chapter1Res.data.id

      const chapter2Res = await createChapterService(
        {
          courseId: createdCourseId,
          title: 'Tx Chapter 2',
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(chapter2Res.success === true, '[TxChapter] createChapterService creates Chapter 2')
      assert(chapter2Res.data.order === 2, '[TxChapter] Auto-increment sets order = 2')
      const createdChapter2Id = chapter2Res.data.id

      // Non-owner teacher blocked from creating chapter
      const nonOwnerChRes = await createChapterService(
        {
          courseId: createdCourseId,
          title: 'Hacked Chapter',
          userId: otherTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(nonOwnerChRes.success === false, '[TxChapter] Non-owner teacher blocked with 403')
      assert(nonOwnerChRes.statusCode === 403, '[TxChapter] Non-owner returns statusCode 403')

      // Update chapter
      const updateChRes = await updateChapterService(
        {
          chapterId: createdChapter1Id,
          userId: testTeacherId,
          role: 'TEACHER',
          payload: { title: 'Tx Chapter 1 Updated' }
        },
        tx as any
      )
      assert(updateChRes.success === true, '[TxChapter] updateChapterService updates title')
      assert(updateChRes.data.title === 'Tx Chapter 1 Updated', '[TxChapter] Updated title matches')

      // Soft delete chapter
      const deleteChRes = await deleteChapterService(
        {
          chapterId: createdChapter2Id,
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(deleteChRes.success === true, '[TxChapter] deleteChapterService soft-deletes chapter')
      assert(deleteChRes.data._destroy === true, '[TxChapter] Deleted chapter has _destroy = true')

      // ----------------------------------------------------
      // 2.3 LESSON SERVICE MUTATIONS
      // ----------------------------------------------------
      console.log('  -> Testing Lesson Service Mutations...')

      // Lesson creation
      const lesson1Res = await createLessonService(
        {
          payload: {
            title: 'Tx Lesson 1 Introduction',
            chapter: createdChapter1Id,
            course: createdCourseId,
            duration: 300,
            type: 'VIDEO',
            isDemo: true,
            videoUrl: 'https://cdn.example.com/video1.mp4'
          },
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(lesson1Res.success === true, '[TxLesson] createLessonService creates Lesson 1')
      assert(lesson1Res.data.order === 1, '[TxLesson] Lesson auto-order = 1')
      assert(lesson1Res.data.isDemo === true, '[TxLesson] Lesson isDemo flag preserved')
      const createdLesson1Id = lesson1Res.data.id

      // Lesson 2 auto order = 2
      const lesson2Res = await createLessonService(
        {
          payload: {
            title: 'Tx Lesson 2 Deep Dive',
            chapter: createdChapter1Id,
            course: createdCourseId,
            duration: 600,
            type: 'VIDEO'
          },
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(lesson2Res.success === true, '[TxLesson] createLessonService creates Lesson 2')
      assert(lesson2Res.data.order === 2, '[TxLesson] Lesson auto-order = 2')
      const createdLesson2Id = lesson2Res.data.id

      // CRITICAL INTEGRITY CHECK: Reject lesson if Chapter does NOT belong to specified Course
      const mismatchRes = await createLessonService(
        {
          payload: {
            title: 'Mismatched Lesson',
            chapter: createdChapter1Id, // Belongs to createdCourseId
            course: testCourseId // Different course!
          },
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(mismatchRes.success === false, '[TxLesson] Rejects lesson when chapter does not belong to course')
      assert(mismatchRes.statusCode === 400, '[TxLesson] Chapter-Course mismatch returns statusCode 400')
      assert(
        mismatchRes.message === 'Chapter does not belong to the specified course',
        '[TxLesson] Exact mismatch error message verified'
      )

      // Update lesson
      const updateLessonRes = await updateLessonService(
        {
          lessonId: createdLesson1Id,
          payload: { title: 'Tx Lesson 1 Updated', duration: 450 },
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(updateLessonRes.success === true, '[TxLesson] updateLessonService updates lesson')
      assert(updateLessonRes.data.duration === 450, '[TxLesson] Updated duration matches')

      // Delete lesson
      const deleteLessonRes = await deleteLessonService(
        {
          lessonId: createdLesson2Id,
          userId: testTeacherId,
          role: 'TEACHER'
        },
        tx as any
      )
      assert(deleteLessonRes.success === true, '[TxLesson] deleteLessonService deletes lesson')

      // ----------------------------------------------------
      // 2.4 TEACHER SERVICE MUTATIONS
      // ----------------------------------------------------
      console.log('  -> Testing Teacher Service Mutations...')

      // Teacher updates own course
      const teacherUpdateRes = await updateCourseByTeacherService(
        {
          courseId: createdCourseId,
          teacherId: testTeacherId,
          payload: { title: 'Tx Teacher Course Updated', price: 59.99 }
        },
        tx as any
      )
      assert(teacherUpdateRes.success === true, '[TxTeacher] Teacher updates own course successfully')
      assert(teacherUpdateRes.data.title === 'Tx Teacher Course Updated', '[TxTeacher] Updated title matches')

      // Teacher blocked from updating another teacher's course
      const nonOwnerUpdateRes = await updateCourseByTeacherService(
        {
          courseId: createdCourseId,
          teacherId: otherTeacherId,
          payload: { title: 'Hacked Title' }
        },
        tx as any
      )
      assert(nonOwnerUpdateRes.success === false, '[TxTeacher] Teacher blocked from updating other teacher course')
      assert(nonOwnerUpdateRes.statusCode === 403, '[TxTeacher] Returns 403 Forbidden')

      // Teacher deletes pending course -> SUCCESS
      const teacherDeleteRes = await deleteCoursesByTeacherService(
        {
          courseId: createdCourseId,
          teacherId: testTeacherId
        },
        tx as any
      )
      assert(teacherDeleteRes.success === true, '[TxTeacher] Teacher deletes PENDING course successfully')

      // Teacher blocked from deleting APPROVED course
      const deleteApprovedRes = await deleteCoursesByTeacherService(
        {
          courseId: testCourseId, // approved course
          teacherId: testTeacherId
        },
        tx as any
      )
      assert(deleteApprovedRes.success === false, '[TxTeacher] Teacher blocked from deleting APPROVED course')
      assert(deleteApprovedRes.statusCode === 403, '[TxTeacher] Returns 403 for approved course deletion')

      // ----------------------------------------------------
      // 2.5 ADMIN SERVICE MUTATIONS
      // ----------------------------------------------------
      console.log('  -> Testing Admin Service Mutations...')

      // Admin updates course
      const adminUpdateRes = await updateCourseByAdminService(
        {
          courseId: testCourseId,
          payload: { description: 'Admin updated description' }
        },
        tx as any
      )
      assert(adminUpdateRes.success === true, '[TxAdmin] Admin updates course description')

      // Admin changes course status
      const adminStatusRes = await updateCourseStatusForTeacherService(
        {
          courseId: testCourseId,
          payload: { status: CourseStatus.PENDING }
        },
        tx as any
      )
      assert(adminStatusRes.success === true, '[TxAdmin] Admin updates course status')
      assert(adminStatusRes.data.status === CourseStatus.PENDING, '[TxAdmin] Status is updated to PENDING')

      // Admin soft deletes course
      const adminDeleteRes = await deleteCourseByAdminService(
        {
          courseId: testCourseId
        },
        tx as any
      )
      assert(adminDeleteRes.success === true, '[TxAdmin] Admin soft-deletes course')

      // Force rollback so database remains completely unmutated
      throw new Error('ROLLBACK_INTENTIONAL_PHASE3_STEP3')
    })
  } catch (err: any) {
    if (err.message === 'ROLLBACK_INTENTIONAL_PHASE3_STEP3') {
      assert(true, '[Isolation] Transaction successfully intercepted and rolled back cleanly')
    } else {
      throw err
    }
  }

  // ==========================================
  // SUITE 3: DATABASE ZERO-MUTATION ASSERTION
  // ==========================================
  console.log('\n--- SUITE 3: Database Zero-Mutation Verification ---')

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
  console.log(`  STEP 3 TEST RESULTS: TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`)
  console.log('='.repeat(80) + '\n')

  await disconnectPrisma()

  if (failedTests > 0) {
    process.exit(1)
  }
}

runStep3Tests().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
