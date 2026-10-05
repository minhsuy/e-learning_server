import { prisma } from '../src/config/prisma'
import { EEnrollmentStatus, ERatingStatus, UserRole } from '@prisma/client'
import {
  markLessonCompleteService,
  unmarkLessonCompleteService,
  getProgressByCourseService
} from '../src/services/progress.service'
import { createCertificateService } from '../src/services/certificate.service'
import {
  addFavoriteService,
  removeFavoriteService,
  getFavoritesService
} from '../src/services/favoriteCourse.service'
import {
  createNewRatingService,
  getCourseRatingsService,
  getRatingsForAdminOrTeacherService,
  deleteRatingService,
  updateRatingStatusService
} from '../src/services/rating.service'
import dotenv from 'dotenv'

dotenv.config()

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passedTests++
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ''}`)
    failedTests++
  }
}

async function runPhase7TestSuite() {
  console.log('\n======================================================')
  console.log('   TMDEMY — PHASE 7 COMPREHENSIVE TEST SUITE')
  console.log('   Progress, Certificate, FavoriteCourse & Rating')
  console.log('======================================================\n')

  // 1. RECORD BASELINE COUNTS
  const baseline = {
    progress: await prisma.progress.count(),
    certificates: await prisma.certificate.count(),
    ratings: await prisma.rating.count(),
    favorites: await prisma.favoriteCourse.count(),
    enrollments: await prisma.enrollment.count(),
    orders: await prisma.order.count(),
    coupons: await prisma.coupon.count(),
    couponCourses: await prisma.couponCourse.count()
  }

  console.log('Baseline Database Record Counts:', baseline)

  // 2. DISCOVER BASELINE FIXTURES
  // User Minh (student who already has enrollment & progress on ReactJS)
  const student = await prisma.user.findFirst({
    where: { email: 'thaiminh061204@gmail.com' }
  })
  if (!student) throw new Error('Student fixture not found!')

  // Teacher 1 (owner of ReactJS Advanced)
  const teacher1 = await prisma.user.findFirst({
    where: { role: UserRole.TEACHER }
  })
  if (!teacher1) throw new Error('Teacher fixture not found!')

  // Admin
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN }
  })
  if (!admin) throw new Error('Admin fixture not found!')

  // ReactJS Advanced Course (f0dde7bb-1bf6-5602-a489-cd324132c68a)
  const reactCourse = await prisma.course.findFirst({
    where: { id: 'f0dde7bb-1bf6-5602-a489-cd324132c68a' },
    include: { lessons: true }
  })
  if (!reactCourse) throw new Error('React course fixture not found!')

  // Another Course for isolation testing (e.g. TailwindCSS or Node.js)
  const otherCourse = await prisma.course.findFirst({
    where: { id: { not: reactCourse.id } },
    include: { lessons: true }
  })
  if (!otherCourse) throw new Error('Other course fixture not found!')

  console.log(`Using Student: ${student.email} (${student.id})`)
  console.log(`Using Course: ${reactCourse.title} (${reactCourse.id})`)
  console.log(`Using Other Course: ${otherCourse.title} (${otherCourse.id})\n`)

  // Create an isolated test student user for mutation tests to ensure zero pollution to Minh's data
  const testStudent = await prisma.user.create({
    data: {
      email: `phase7_test_student_${Date.now()}@tmdemy.test`,
      username: `p7student_${Date.now()}`,
      password: 'hashed_password_test',
      role: UserRole.USER
    }
  })

  // Create an isolated test teacher user
  const testTeacher = await prisma.user.create({
    data: {
      email: `phase7_test_teacher_${Date.now()}@tmdemy.test`,
      username: `p7teacher_${Date.now()}`,
      password: 'hashed_password_test',
      role: UserRole.TEACHER
    }
  })

  // Create an isolated test course owned by testTeacher with 2 lessons
  const testCourse = await prisma.course.create({
    data: {
      title: `Phase 7 Isolated Course ${Date.now()}`,
      slug: `phase-7-isolated-course-${Date.now()}`,
      authorId: testTeacher.id,
      price: 0,
      status: 'APPROVED',
      isDestroyed: false
    }
  })

  const testChapter = await prisma.chapter.create({
    data: {
      title: 'Chapter 1',
      courseId: testCourse.id,
      order: 1
    }
  })

  const testLesson1 = await prisma.lesson.create({
    data: {
      title: 'Lesson 1',
      slug: `lesson-1-${Date.now()}`,
      chapterId: testChapter.id,
      courseId: testCourse.id,
      authorId: testTeacher.id,
      order: 1
    }
  })

  const testLesson2 = await prisma.lesson.create({
    data: {
      title: 'Lesson 2',
      slug: `lesson-2-${Date.now()}`,
      chapterId: testChapter.id,
      courseId: testCourse.id,
      authorId: testTeacher.id,
      order: 2
    }
  })

  try {
    // ==========================================
    // SECTION 1: PROGRESS TESTS
    // ==========================================
    console.log('--- SECTION 1: PROGRESS TESTS ---')

    // Test 1: User not enrolled cannot mark lesson complete -> 403
    const pRes1 = await markLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson1.id
    })
    assert(pRes1.statusCode === 403 && pRes1.success === false, 'Progress: User not enrolled rejected with 403')

    // Test 2: Lesson not belonging to course -> 404
    const pRes2 = await markLessonCompleteService({
      userId: student.id,
      courseId: reactCourse.id,
      lessonId: testLesson1.id // belongs to testCourse, not reactCourse
    })
    assert(pRes2.statusCode === 404 && pRes2.message.includes('not found in this course'), 'Progress: Lesson not in course rejected with 404')

    // Now enroll testStudent into testCourse for legitimate progress testing
    const testEnrollment = await prisma.enrollment.create({
      data: {
        userId: testStudent.id,
        courseId: testCourse.id,
        progress: 0,
        status: EEnrollmentStatus.ACTIVE
      }
    })

    // Test 3: Complete Lesson 1 (1 of 2 lessons = 50%)
    const pRes3 = await markLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson1.id
    })
    assert(pRes3.success === true && pRes3.data.progress === 50, 'Progress: Mark lesson 1 completed returns 50%')

    const enrCheck1 = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: testStudent.id, courseId: testCourse.id } }
    })
    assert(enrCheck1?.progress === 50 && enrCheck1?.status === EEnrollmentStatus.ACTIVE, 'Progress: Enrollment table updated to 50% in PostgreSQL')

    // Test 4: Idempotency (marking lesson 1 again does not duplicate or change percentage)
    const pRes4 = await markLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson1.id
    })
    assert(pRes4.success === true && pRes4.data.progress === 50, 'Progress: Idempotent mark complete maintains 50%')

    // Test 5: Complete Lesson 2 (2 of 2 lessons = 100%) -> Enrollment becomes COMPLETED
    const pRes5 = await markLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson2.id
    })
    assert(pRes5.success === true && pRes5.data.progress === 100, 'Progress: Mark lesson 2 completed reaches 100%')

    const enrCheck2 = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: testStudent.id, courseId: testCourse.id } }
    })
    assert(enrCheck2?.progress === 100 && enrCheck2?.status === EEnrollmentStatus.COMPLETED && enrCheck2?.completedAt !== null, 'Progress: Enrollment status automatically marked COMPLETED at 100%')

    // Test 6: Uncomplete Lesson 2 -> Progress drops back to 50%, Enrollment status reverts to ACTIVE
    const pRes6 = await unmarkLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson2.id
    })
    assert(pRes6.success === true && pRes6.data.progress === 50, 'Progress: Unmark lesson 2 drops progress to 50%')

    const enrCheck3 = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: testStudent.id, courseId: testCourse.id } }
    })
    assert(enrCheck3?.progress === 50 && enrCheck3?.status === EEnrollmentStatus.ACTIVE && enrCheck3?.completedAt === null, 'Progress: Enrollment status automatically reverts to ACTIVE when < 100%')

    // Test 7: Get progress by course
    const pRes7 = await getProgressByCourseService({
      userId: testStudent.id,
      courseId: testCourse.id
    })
    assert(
      pRes7.success === true &&
      pRes7.data.totalLessons === 2 &&
      pRes7.data.completedLessons === 1 &&
      pRes7.data.percent === 50 &&
      pRes7.data.lessons.length === 2 &&
      pRes7.data.lessons[0].completed === true &&
      pRes7.data.lessons[1].completed === false,
      'Progress: Get progress by course returns full formatted lessons hierarchy'
    )

    // ==========================================
    // SECTION 2: CERTIFICATE TESTS
    // ==========================================
    console.log('\n--- SECTION 2: CERTIFICATE TESTS ---')

    // Test 8: Not enrolled user requesting certificate -> 404
    const cRes1 = await createCertificateService(testTeacher.id, reactCourse.id)
    assert(cRes1.statusCode === 404 && cRes1.message.includes('not enrolled'), 'Certificate: Unenrolled user rejected with 404')

    // Test 9: Enrolled user with progress < 70% -> 400
    // testStudent has 50% on testCourse
    const cRes2 = await createCertificateService(testStudent.id, testCourse.id)
    assert(cRes2.statusCode === 400 && cRes2.message.includes('less than 70%'), 'Certificate: Progress < 70% rejected with 400')

    // Test 10: Enrolled user with progress >= 70% but course has no quizzes -> 400
    // Update testStudent to 100% on testCourse (which has no quiz)
    await markLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson2.id
    })
    const cRes3 = await createCertificateService(testStudent.id, testCourse.id)
    assert(cRes3.statusCode === 400 && cRes3.message.includes('No quizzes found'), 'Certificate: Course without quizzes rejected with 400')

    // Test 11: Course has quiz, but user has no quiz submission -> 400
    // Add a quiz to testLesson1
    const testQuiz = await prisma.quiz.create({
      data: {
        title: 'Test Quiz',
        lessonId: testLesson1.id,
        courseId: testCourse.id,
        createdById: testTeacher.id,
        duration: 10,
        passingGrade: 70
      }
    })

    const cRes4 = await createCertificateService(testStudent.id, testCourse.id)
    assert(cRes4.statusCode === 400 && cRes4.message.includes('No quiz submissions found'), 'Certificate: No quiz submissions rejected with 400')

    // Test 12: Quiz submission percentage < 60% (e.g. 2 quizzes available, only 0 submitted)
    // Add second quiz to testLesson2
    const testQuiz2 = await prisma.quiz.create({
      data: {
        title: 'Test Quiz 2',
        lessonId: testLesson2.id,
        courseId: testCourse.id,
        createdById: testTeacher.id,
        duration: 10,
        passingGrade: 70
      }
    })

    // Now submit 1 out of 2 quizzes (50% < 60%)
    const testSubmission1 = await prisma.quizSubmission.create({
      data: {
        quizId: testQuiz.id,
        userId: testStudent.id,
        score: 10,
        totalPoints: 10,
        percentage: 100
      }
    })

    const cRes5 = await createCertificateService(testStudent.id, testCourse.id)
    assert(cRes5.statusCode === 400 && cRes5.message.includes('less than 60%'), 'Certificate: Quiz submission percentage < 60% rejected with 400')

    // Test 13: Submit second quiz so completion = 100% -> Certificate granted successfully!
    const testSubmission2 = await prisma.quizSubmission.create({
      data: {
        quizId: testQuiz2.id,
        userId: testStudent.id,
        score: 8,
        totalPoints: 10,
        percentage: 80
      }
    })

    const cRes6 = await createCertificateService(testStudent.id, testCourse.id)
    assert(
      cRes6.success === true &&
      typeof cRes6.data.grade === 'number' &&
      cRes6.data.certificateUrl.length > 0 &&
      cRes6.data.id.length > 0,
      'Certificate: Eligible student successfully receives certificate with Decimal-as-Number grade'
    )

    // Test 14: Duplicate certificate request -> 400
    const cRes7 = await createCertificateService(testStudent.id, testCourse.id)
    assert(cRes7.statusCode === 400 && cRes7.message.includes('already have a certificate'), 'Certificate: Duplicate certificate request rejected with 400')

    // ==========================================
    // SECTION 3: FAVORITE COURSE TESTS
    // ==========================================
    console.log('\n--- SECTION 3: FAVORITE COURSE TESTS ---')

    // Test 15: Add favorite for non-existent course -> 404
    const fRes1 = await addFavoriteService(testStudent.id, '00000000-0000-0000-0000-000000000000')
    assert(fRes1.statusCode === 404 && fRes1.message.includes('Course not found'), 'Favorite: Non-existent course rejected with 404')

    // Test 16: Add favorite valid course -> 200 / success
    const fRes2 = await addFavoriteService(testStudent.id, testCourse.id)
    assert(fRes2.success === true && fRes2.data.courseId === testCourse.id, 'Favorite: Add favorite course succeeded')

    // Test 17: Add duplicate favorite -> 400
    const fRes3 = await addFavoriteService(testStudent.id, testCourse.id)
    assert(fRes3.statusCode === 400 && fRes3.message.includes('already in favorites'), 'Favorite: Duplicate favorite rejected with 400')

    // Test 18: Get favorites list with pagination
    const fRes4 = await getFavoritesService(testStudent.id, 1, 10)
    assert(
      fRes4.success === true &&
      fRes4.data.favorites.length === 1 &&
      fRes4.data.pagination.total === 1 &&
      fRes4.data.favorites[0].course.title === testCourse.title,
      'Favorite: Get favorites returns paginated list with populated course details'
    )

    // Test 19: Remove non-existent favorite -> 404
    const fRes5 = await removeFavoriteService(testTeacher.id, testCourse.id)
    assert(fRes5.statusCode === 404 && fRes5.message.includes('Favorite not found'), 'Favorite: Remove non-existent favorite returns 404')

    // Test 20: Remove existing favorite -> success
    const fRes6 = await removeFavoriteService(testStudent.id, testCourse.id)
    assert(fRes6.success === true && fRes6.message.includes('removed from favorites'), 'Favorite: Remove favorite succeeded')

    // Verify it is gone
    const fRes7 = await getFavoritesService(testStudent.id, 1, 10)
    assert(fRes7.data.favorites.length === 0, 'Favorite: Favorites list is empty after removal')

    // ==========================================
    // SECTION 4: RATING TESTS
    // ==========================================
    console.log('\n--- SECTION 4: RATING TESTS ---')

    // Test 21: Rating on non-existent course -> 404
    const rRes1 = await createNewRatingService({
      userId: testStudent.id,
      courseId: '00000000-0000-0000-0000-000000000000',
      rate: 5,
      content: 'Great non-existent course'
    })
    assert(rRes1.statusCode === 404 && rRes1.message.includes('Course not found'), 'Rating: Non-existent course rejected with 404')

    // Test 22: Rating without enrollment -> 403
    const rRes2 = await createNewRatingService({
      userId: testTeacher.id,
      courseId: testCourse.id,
      rate: 5,
      content: 'Great course by author'
    })
    assert(rRes2.statusCode === 403 && rRes2.message.includes('not enrolled'), 'Rating: Unenrolled user rejected with 403')

    // Test 23: Create valid rating by enrolled testStudent
    const rRes3 = await createNewRatingService({
      userId: testStudent.id,
      courseId: testCourse.id,
      rate: 5,
      content: 'Khóa học xuất sắc, giảng viên nhiệt tình!'
    })
    assert(rRes3.success === true && rRes3.data.rate === 5 && rRes3.data.status === ERatingStatus.ACTIVE, 'Rating: Create rating succeeded with status ACTIVE')

    const createdRatingId = rRes3.data.id

    // Test 24: Duplicate rating on same course -> 400
    const rRes4 = await createNewRatingService({
      userId: testStudent.id,
      courseId: testCourse.id,
      rate: 4,
      content: 'Đánh giá lần 2 bị chặn'
    })
    assert(rRes4.statusCode === 400 && rRes4.message.includes('already rated'), 'Rating: Duplicate rating rejected with 400')

    // Test 25: Public get course ratings (calculates average and filters active)
    const rRes5 = await getCourseRatingsService(testCourse.id)
    assert(
      rRes5.success === true &&
      rRes5.data.totalRatings === 1 &&
      rRes5.data.averageRating === 5 &&
      rRes5.data.ratings[0].content.includes('Khóa học xuất sắc'),
      'Rating: Get course ratings returns accurate average and rating items'
    )

    // Test 26: Teacher cannot manage rating of another teacher's course -> 403
    const rRes6 = await deleteRatingService({
      ratingId: createdRatingId,
      userId: teacher1.id, // Teacher1 does NOT own testCourse
      role: UserRole.TEACHER
    })
    assert(rRes6.statusCode === 403 && rRes6.message.includes('not allowed'), 'Rating: Teacher cannot delete rating of another teacher course (403)')

    // Test 27: Teacher can update status of their own course rating
    const rRes7 = await updateRatingStatusService({
      ratingId: createdRatingId,
      status: ERatingStatus.INACTIVE,
      userId: testTeacher.id, // testTeacher owns testCourse
      role: UserRole.TEACHER
    })
    assert(rRes7.success === true && rRes7.data.status === ERatingStatus.INACTIVE, 'Rating: Course owner teacher can update rating status')

    // Test 28: Public get ratings does NOT display INACTIVE ratings
    const rRes8 = await getCourseRatingsService(testCourse.id)
    assert(rRes8.data.totalRatings === 0 && rRes8.data.ratings.length === 0, 'Rating: Public get ratings excludes INACTIVE ratings')

    // Test 29: Admin can manage and delete any rating
    const rRes9 = await deleteRatingService({
      ratingId: createdRatingId,
      userId: admin.id,
      role: UserRole.ADMIN
    })
    assert(rRes9.success === true && rRes9.message.includes('deleted successfully'), 'Rating: Admin can delete rating')

  } finally {
    // 3. CLEAN UP TEST FIXTURES
    console.log('\n--- CLEANING UP TEST FIXTURES ---')
    try {
      await prisma.certificate.deleteMany({ where: { userId: testStudent.id } })
      await prisma.quizSubmission.deleteMany({ where: { userId: testStudent.id } })
      await prisma.quiz.deleteMany({ where: { courseId: testCourse.id } })
      await prisma.progress.deleteMany({ where: { userId: testStudent.id } })
      await prisma.favoriteCourse.deleteMany({ where: { userId: testStudent.id } })
      await prisma.rating.deleteMany({ where: { userId: testStudent.id } })
      await prisma.enrollment.deleteMany({ where: { userId: testStudent.id } })
      await prisma.lesson.deleteMany({ where: { courseId: testCourse.id } })
      await prisma.chapter.deleteMany({ where: { courseId: testCourse.id } })
      await prisma.course.deleteMany({ where: { id: testCourse.id } })
      await prisma.user.deleteMany({ where: { id: { in: [testStudent.id, testTeacher.id] } } })
      console.log('Cleanup completed successfully.')
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr)
    }
  }

  // 4. VERIFY DATABASE INTEGRITY (BASELINE COUNTS MUST MATCH)
  console.log('\n--- VERIFYING BASELINE RECORD COUNTS ---')
  const after = {
    progress: await prisma.progress.count(),
    certificates: await prisma.certificate.count(),
    ratings: await prisma.rating.count(),
    favorites: await prisma.favoriteCourse.count(),
    enrollments: await prisma.enrollment.count(),
    orders: await prisma.order.count(),
    coupons: await prisma.coupon.count(),
    couponCourses: await prisma.couponCourse.count()
  }

  console.log('Post-test Database Record Counts:', after)

  assert(after.progress === baseline.progress, `Database Integrity: progress count matches (${after.progress} == ${baseline.progress})`)
  assert(after.certificates === baseline.certificates, `Database Integrity: certificates count matches (${after.certificates} == ${baseline.certificates})`)
  assert(after.ratings === baseline.ratings, `Database Integrity: ratings count matches (${after.ratings} == ${baseline.ratings})`)
  assert(after.favorites === baseline.favorites, `Database Integrity: favorite_courses count matches (${after.favorites} == ${baseline.favorites})`)
  assert(after.enrollments === baseline.enrollments, `Database Integrity: enrollments count matches (${after.enrollments} == ${baseline.enrollments})`)
  assert(after.orders === baseline.orders, `Database Integrity: orders count matches (${after.orders} == ${baseline.orders})`)
  assert(after.coupons === baseline.coupons, `Database Integrity: coupons count matches (${after.coupons} == ${baseline.coupons})`)
  assert(after.couponCourses === baseline.couponCourses, `Database Integrity: coupon_courses count matches (${after.couponCourses} == ${baseline.couponCourses})`)

  console.log(`\n======================================================`)
  console.log(`   TOTAL TESTS: ${passedTests + failedTests}`)
  console.log(`   PASSED:      ${passedTests}`)
  console.log(`   FAILED:      ${failedTests}`)
  console.log(`======================================================\n`)

  if (failedTests > 0) {
    process.exit(1)
  }
}

runPhase7TestSuite().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
