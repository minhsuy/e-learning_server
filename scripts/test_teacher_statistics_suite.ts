import express from 'express'
import http from 'http'
import dotenv from 'dotenv'
import { prisma } from '../src/config/prisma'
import { indexRoutes } from '../src/routes/index.route'
import { errorHandler } from '../src/middlewares/errorHandler'
import { generateAccessToken } from '../src/middlewares/generateToken'

dotenv.config()

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL'
  details?: string
}

const results: TestResult[] = []

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, status: 'PASS', details })
    console.log(`  ✅ [PASS] ${name}`)
  } else {
    results.push({ name, status: 'FAIL', details })
    console.error(`  ❌ [FAIL] ${name} — ${details}`)
  }
}

async function runTestSuite() {
  console.log('\n===============================================================')
  console.log('🧪 TMDEMY: TEACHER STATISTICS API COMPREHENSIVE TEST SUITE')
  console.log('===============================================================\n')

  // Setup Express test server on random high port
  const app = express()
  app.use(express.json())
  indexRoutes(app)
  app.use(errorHandler)

  const TEST_PORT = 3995
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()))
  const BASE_URL = `http://localhost:${TEST_PORT}`
  console.log(`Test server running at ${BASE_URL}\n`)

  try {
    // 1. Fixture Discovery
    console.log('--- Step 1: Discover Test Fixtures ---')
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', status: 'ACTIVE' },
      take: 3
    })

    const studentUser = await prisma.user.findFirst({
      where: { role: 'USER', status: 'ACTIVE' }
    })

    assert(teachers.length >= 2, 'Found at least 2 active teachers in database', `Found ${teachers.length}`)
    assert(studentUser !== null, 'Found student user in database')

    const teacherA = teachers[0]
    const teacherB = teachers[1]
    const student = studentUser!

    // Ensure Teacher A has at least one course for meaningful testing
    let courseA = await prisma.course.findFirst({
      where: { authorId: teacherA.id, isDestroyed: false }
    })

    if (!courseA) {
      // Find any course and temporarily use its author as Teacher A
      const anyCourse = await prisma.course.findFirst({
        where: { isDestroyed: false }
      })
      if (anyCourse) {
        courseA = anyCourse
        teacherA.id = anyCourse.authorId
      }
    }

    // Ensure Teacher B has a distinct course
    let courseB = await prisma.course.findFirst({
      where: { authorId: teacherB.id, isDestroyed: false }
    })

    if (!courseB && courseA) {
      // Create a test course for teacher B if none exists
      courseB = await prisma.course.create({
        data: {
          title: 'Teacher B Exclusive Course For Testing',
          slug: `teacher-b-test-course-${Date.now()}`,
          price: 200000,
          status: 'APPROVED',
          authorId: teacherB.id
        }
      })
    }

    const teacherAToken = generateAccessToken({ userId: teacherA.id, role: 'teacher' })
    const teacherBToken = generateAccessToken({ userId: teacherB.id, role: 'teacher' })
    const studentToken = generateAccessToken({ userId: student.id, role: 'user' })

    console.log(`Teacher A ID: ${teacherA.id}`)
    console.log(`Teacher B ID: ${teacherB.id}`)
    console.log(`Course A ID: ${courseA?.id}`)
    console.log(`Course B ID: ${courseB?.id}\n`)

    // 2. Test Requirement 1 & 4: Overview API
    console.log('--- Test Requirement 1 & 4: Overview Statistics ---')
    const resOverview = await fetch(`${BASE_URL}/api/teacher/statistics/overview`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    })
    const dataOverview = await resOverview.json()

    assert(resOverview.status === 200, 'GET /api/teacher/statistics/overview returns 200 OK', `Status: ${resOverview.status}`)
    assert(dataOverview.success === true, 'Response has success: true')
    assert(typeof dataOverview.data.courses.total === 'number', 'data.courses.total is a number')
    assert(typeof dataOverview.data.courses.approved === 'number', 'data.courses.approved is a number')
    assert(typeof dataOverview.data.students.totalStudents === 'number', 'data.students.totalStudents is a number')
    assert(typeof dataOverview.data.students.totalEnrollments === 'number', 'data.students.totalEnrollments is a number')
    assert(typeof dataOverview.data.revenue.totalRevenue === 'number', 'data.revenue.totalRevenue is a number')
    assert(typeof dataOverview.data.revenue.totalOrders === 'number', 'data.revenue.totalOrders is a number')
    assert(dataOverview.data.revenue.currency === 'VND', 'data.revenue.currency is "VND"')
    assert(typeof dataOverview.data.engagement.averageRating === 'number', 'data.engagement.averageRating is a number')
    assert(typeof dataOverview.data.engagement.totalReviews === 'number', 'data.engagement.totalReviews is a number')
    assert(typeof dataOverview.data.engagement.certificatesIssued === 'number', 'data.engagement.certificatesIssued is a number')

    // 3. Test Requirement 2: Teacher A only sees courses of Teacher A
    console.log('\n--- Test Requirement 2: Courses Statistics & Ownership ---')
    const resCourses = await fetch(`${BASE_URL}/api/teacher/statistics/courses?page=1&limit=50`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    })
    const dataCourses = await resCourses.json()

    assert(resCourses.status === 200, 'GET /api/teacher/statistics/courses returns 200 OK')
    assert(Array.isArray(dataCourses.data.courses), 'data.courses is an array')

    let allBelongToA = true
    for (const c of dataCourses.data.courses) {
      const dbCourse = await prisma.course.findUnique({ where: { id: c.id } })
      if (!dbCourse || dbCourse.authorId !== teacherA.id) {
        allBelongToA = false
        break
      }
    }
    assert(allBelongToA, 'All courses in Teacher A list belong strictly to Teacher A')

    // 4. Test Requirement 3 & 4: Data Isolation (Teacher A cannot see Teacher B data or use B courseId)
    console.log('\n--- Test Requirement 3 & 4: Authorization & Course ID Ownership ---')
    if (courseB) {
      const resBypassRevenue = await fetch(`${BASE_URL}/api/teacher/statistics/revenue?courseId=${courseB.id}`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      assert(
        resBypassRevenue.status === 403,
        'Teacher A requesting statistics with Teacher B courseId returns 403 Forbidden',
        `Received: ${resBypassRevenue.status}`
      )

      const resBypassEnroll = await fetch(`${BASE_URL}/api/teacher/statistics/enrollments?courseId=${courseB.id}`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      assert(
        resBypassEnroll.status === 403,
        'Teacher A requesting enrollments with Teacher B courseId returns 403 Forbidden',
        `Received: ${resBypassEnroll.status}`
      )

      const resBypassLearning = await fetch(`${BASE_URL}/api/teacher/statistics/learning?courseId=${courseB.id}`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      assert(
        resBypassLearning.status === 403,
        'Teacher A requesting learning stats with Teacher B courseId returns 403 Forbidden',
        `Received: ${resBypassLearning.status}`
      )
    }

    // 5. Test Requirement 5: Non-teacher role is forbidden
    console.log('\n--- Test Requirement 5: Non-Teacher Role Protection ---')
    const resForbidden = await fetch(`${BASE_URL}/api/teacher/statistics/overview`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    })
    assert(resForbidden.status === 403, 'Student token calling teacher statistics returns 403 Forbidden')

    // 6. Test Requirement 6: Missing and invalid token rejection
    console.log('\n--- Test Requirement 6: Token Verification ---')
    const resNoToken = await fetch(`${BASE_URL}/api/teacher/statistics/overview`)
    assert(resNoToken.status === 401, 'Request without token returns 401 Unauthorized')

    const resInvalidToken = await fetch(`${BASE_URL}/api/teacher/statistics/overview`, {
      headers: { Authorization: 'Bearer this.is.invalid.jwt' }
    })
    assert(resInvalidToken.status === 401, 'Request with invalid token returns 401 Unauthorized')

    // 7. Test Requirement 7 & 8: Revenue & Rating Business Logic
    console.log('\n--- Test Requirement 7 & 8: Revenue Periods & Completed Status ---')
    const resRev30 = await fetch(`${BASE_URL}/api/teacher/statistics/revenue?period=30days`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    })
    const dataRev30 = await resRev30.json()
    assert(resRev30.status === 200, 'GET /api/teacher/statistics/revenue?period=30days returns 200')
    assert(dataRev30.data.summary !== undefined, 'Revenue response contains summary')
    assert(Array.isArray(dataRev30.data.timeline), 'Revenue response contains timeline array')

    const resRev12m = await fetch(`${BASE_URL}/api/teacher/statistics/revenue?period=12months`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    })
    assert(resRev12m.status === 200, 'GET /api/teacher/statistics/revenue?period=12months returns 200')

    // 8. Test Requirement 10: Custom Date Range (Including Entire End Date)
    console.log('\n--- Test Requirement 10: Custom Date Range Calculation ---')
    const resCustom = await fetch(
      `${BASE_URL}/api/teacher/statistics/revenue?period=custom&startDate=2026-09-01&endDate=2026-09-30`,
      { headers: { Authorization: `Bearer ${teacherAToken}` } }
    )
    const dataCustom = await resCustom.json()
    assert(resCustom.status === 200, 'Custom period with valid startDate & endDate returns 200')
    assert(dataCustom.success === true, 'Custom period query succeeded')

    const resCustomInvalid = await fetch(
      `${BASE_URL}/api/teacher/statistics/revenue?period=custom&startDate=2026-09-30&endDate=2026-09-01`,
      { headers: { Authorization: `Bearer ${teacherAToken}` } }
    )
    assert(resCustomInvalid.status === 400, 'Custom period with startDate > endDate returns 400 Bad Request')

    // 9. Test Requirement 9 & 11: Course Metrics & Zero-Division Safety
    console.log('\n--- Test Requirement 9 & 11: Zero-Division & Metric Integrity ---')
    if (dataCourses.data.courses.length > 0) {
      for (const course of dataCourses.data.courses) {
        assert(!isNaN(course.stats.completionRate), `Course ${course.title} completionRate is not NaN`)
        assert(isFinite(course.stats.completionRate), `Course ${course.title} completionRate is finite`)
        assert(!isNaN(course.stats.averageProgress), `Course ${course.title} averageProgress is not NaN`)
        assert(!isNaN(course.stats.averageRating), `Course ${course.title} averageRating is not NaN`)
      }
    }

    // 10. Test Requirement 8: Enrollment Statistics Endpoint
    console.log('\n--- Test Requirement: Enrollment Statistics Endpoint ---')
    const resEnroll = await fetch(`${BASE_URL}/api/teacher/statistics/enrollments?period=30days`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    })
    const dataEnroll = await resEnroll.json()
    assert(resEnroll.status === 200, 'GET /api/teacher/statistics/enrollments returns 200')
    assert(typeof dataEnroll.data.statusSummary.total === 'number', 'enrollments statusSummary.total is a number')
    assert(Array.isArray(dataEnroll.data.timeline), 'enrollments timeline is an array')
    assert(Array.isArray(dataEnroll.data.recentEnrollments), 'enrollments recentEnrollments is an array')

    // Verify recent enrollments do not leak sensitive credentials
    if (dataEnroll.data.recentEnrollments.length > 0) {
      const firstRecent = dataEnroll.data.recentEnrollments[0]
      assert(firstRecent.student.password === undefined, 'recentEnrollments does NOT leak password')
      assert(firstRecent.student.refreshToken === undefined, 'recentEnrollments does NOT leak refreshToken')
      assert(firstRecent.student.username !== undefined, 'recentEnrollments provides student username')
    }

    // 11. Test Requirement 9: Learning & Quiz Statistics Endpoint
    console.log('\n--- Test Requirement: Learning Statistics Endpoint ---')
    const resLearn = await fetch(`${BASE_URL}/api/teacher/statistics/learning`, {
      headers: { Authorization: `Bearer ${teacherAToken}` }
    })
    const dataLearn = await resLearn.json()
    assert(resLearn.status === 200, 'GET /api/teacher/statistics/learning returns 200')
    assert(typeof dataLearn.data.progressOverview.averageProgress === 'number', 'averageProgress is a number')
    assert(!isNaN(dataLearn.data.progressOverview.completionRate), 'progress completionRate is not NaN')
    assert(typeof dataLearn.data.quizAssessment.totalQuizzes === 'number', 'totalQuizzes is a number')
    assert(!isNaN(dataLearn.data.quizAssessment.passRate), 'quiz passRate is not NaN')

    // 12. Test Requirement 12: Teacher with zero data receives valid zero metrics
    console.log('\n--- Test Requirement 12: Teacher with Zero Data ---')
    const emptyTeacherToken = generateAccessToken({
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'teacher'
    })
    const resZeroOverview = await fetch(`${BASE_URL}/api/teacher/statistics/overview`, {
      headers: { Authorization: `Bearer ${emptyTeacherToken}` }
    })
    const dataZeroOverview = await resZeroOverview.json()
    assert(resZeroOverview.status === 200, 'Teacher with zero data receives 200 OK')
    assert(dataZeroOverview.data.courses.total === 0, 'Zero teacher has total courses = 0')
    assert(dataZeroOverview.data.revenue.totalRevenue === 0, 'Zero teacher has total revenue = 0')
    assert(dataZeroOverview.data.students.totalStudents === 0, 'Zero teacher has total students = 0')
    assert(dataZeroOverview.data.engagement.averageRating === 0, 'Zero teacher has averageRating = 0')

    const resZeroLearn = await fetch(`${BASE_URL}/api/teacher/statistics/learning`, {
      headers: { Authorization: `Bearer ${emptyTeacherToken}` }
    })
    const dataZeroLearn = await resZeroLearn.json()
    assert(resZeroLearn.status === 200, 'Zero teacher learning stats returns 200 OK')
    assert(dataZeroLearn.data.quizAssessment.passRate === 0, 'Zero teacher quiz passRate is 0')
    assert(dataZeroLearn.data.quizAssessment.averageScorePercentage === 0, 'Zero teacher avg score is 0')

    // 13. Test Requirement: Course Performance Snapshot API (/statistics/course-performance/:courseId)
    console.log('\n--- Test Requirement 13: Course Performance Snapshot API ---')
    if (courseA) {
      // 13.1. Successful access to own course
      const resPerf = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/${courseA.id}`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      const dataPerf = await resPerf.json()

      assert(resPerf.status === 200, 'GET /api/teacher/statistics/course-performance/:courseId returns 200 for owner')
      assert(dataPerf.success === true, 'Performance response has success: true')
      assert(dataPerf.data.course.id === courseA.id, 'data.course.id matches requested courseId')
      assert(typeof dataPerf.data.course.price === 'number', 'data.course.price is serialized as number')
      assert(typeof dataPerf.data.course.oldPrice === 'number', 'data.course.oldPrice is serialized as number')

      // 13.2. Overview - Revenue
      assert(typeof dataPerf.data.overview.revenue.totalRevenue === 'number', 'revenue.totalRevenue is a number')
      assert(typeof dataPerf.data.overview.revenue.completedOrders === 'number', 'revenue.completedOrders is a number')
      assert(typeof dataPerf.data.overview.revenue.averageOrderValue === 'number', 'revenue.averageOrderValue is a number')
      assert(!isNaN(dataPerf.data.overview.revenue.averageOrderValue), 'revenue.averageOrderValue is not NaN')
      assert(dataPerf.data.overview.revenue.currency === 'VND', 'revenue.currency is "VND"')

      // 13.3. Overview - Students
      assert(typeof dataPerf.data.overview.students.totalStudents === 'number', 'students.totalStudents is a number')
      assert(typeof dataPerf.data.overview.students.activeStudents === 'number', 'students.activeStudents is a number')
      assert(typeof dataPerf.data.overview.students.completedStudents === 'number', 'students.completedStudents is a number')
      assert(typeof dataPerf.data.overview.students.completionRate === 'number', 'students.completionRate is a number')
      assert(!isNaN(dataPerf.data.overview.students.completionRate), 'students.completionRate is not NaN')
      assert(typeof dataPerf.data.overview.students.averageProgress === 'number', 'students.averageProgress is a number')

      // 13.4. Overview - Engagement & Rating distribution
      assert(typeof dataPerf.data.overview.engagement.averageRating === 'number', 'engagement.averageRating is a number')
      assert(typeof dataPerf.data.overview.engagement.totalReviews === 'number', 'engagement.totalReviews is a number')
      const ratingDist = dataPerf.data.overview.engagement.ratingDistribution
      assert(ratingDist !== undefined, 'engagement contains ratingDistribution')
      assert(
        typeof ratingDist['1'] === 'number' &&
        typeof ratingDist['2'] === 'number' &&
        typeof ratingDist['3'] === 'number' &&
        typeof ratingDist['4'] === 'number' &&
        typeof ratingDist['5'] === 'number',
        'ratingDistribution contains all 1..5 star keys'
      )
      assert(typeof dataPerf.data.overview.engagement.certificatesIssued === 'number', 'certificatesIssued is a number')
      assert(!isNaN(dataPerf.data.overview.engagement.certificateRate), 'certificateRate is not NaN')

      // 13.5. Curriculum
      assert(typeof dataPerf.data.curriculum.totalChapters === 'number', 'curriculum.totalChapters is a number')
      assert(typeof dataPerf.data.curriculum.totalLessons === 'number', 'curriculum.totalLessons is a number')
      assert(typeof dataPerf.data.curriculum.totalDuration === 'number', 'curriculum.totalDuration is a number')

      // 13.6. Quizzes
      assert(typeof dataPerf.data.quizzes.summary.totalQuizzes === 'number', 'quizzes.summary.totalQuizzes is a number')
      assert(typeof dataPerf.data.quizzes.summary.totalSubmissions === 'number', 'quizzes.summary.totalSubmissions is a number')
      assert(!isNaN(dataPerf.data.quizzes.summary.averageScore), 'quizzes.summary.averageScore is not NaN')
      assert(!isNaN(dataPerf.data.quizzes.summary.passRate), 'quizzes.summary.passRate is not NaN')
      assert(Array.isArray(dataPerf.data.quizzes.items), 'quizzes.items is an array')

      // 13.7. Lesson Funnel
      assert(Array.isArray(dataPerf.data.lessonsFunnel), 'data.lessonsFunnel is an array')
      if (dataPerf.data.lessonsFunnel.length > 0) {
        const firstLesson = dataPerf.data.lessonsFunnel[0]
        assert(firstLesson.dropOffFromPrevious === 0, 'First lesson in funnel has dropOffFromPrevious = 0')
        assert(!isNaN(firstLesson.completionRate), 'First lesson completionRate is not NaN')
        for (const lf of dataPerf.data.lessonsFunnel) {
          assert(!isNaN(lf.completionRate), `Lesson ${lf.lessonTitle} completionRate is not NaN`)
          assert(!isNaN(lf.dropOffFromPrevious), `Lesson ${lf.lessonTitle} dropOffFromPrevious is not NaN`)
          assert(isFinite(lf.dropOffFromPrevious), `Lesson ${lf.lessonTitle} dropOffFromPrevious is finite`)
          assert(lf.chapter !== undefined && lf.chapter.title !== undefined, `Lesson ${lf.lessonTitle} includes chapter info`)
        }
      }

      // 13.8. Security & Data Isolation
      if (courseB) {
        const resOtherTeacher = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/${courseB.id}`, {
          headers: { Authorization: `Bearer ${teacherAToken}` }
        })
        const dataOther = await resOtherTeacher.json()
        assert(resOtherTeacher.status === 403, 'Teacher A accessing Teacher B course returns 403 Forbidden')
        assert(dataOther.message === 'You can only view performance of your own courses', 'Forbidden message is exact')
      }

      const resStudentAccess = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/${courseA.id}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      })
      assert(resStudentAccess.status === 403, 'Student accessing course-performance returns 403 Forbidden')

      const resNoTokenPerf = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/${courseA.id}`)
      assert(resNoTokenPerf.status === 401, 'No token accessing course-performance returns 401 Unauthorized')

      const resInvalidUUID = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/not-a-valid-uuid`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      assert(resInvalidUUID.status === 400, 'Invalid course UUID returns 400 Bad Request')

      const resNotFound = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/00000000-0000-4000-8000-000000000099`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      assert(resNotFound.status === 404, 'Non-existent course UUID returns 404 Not Found')

      // Test soft-deleted / destroyed course
      const destroyedCourse = await prisma.course.create({
        data: {
          title: 'Destroyed Course Test',
          slug: `destroyed-course-test-${Date.now()}`,
          price: 100000,
          status: 'APPROVED',
          authorId: teacherA.id,
          isDestroyed: true
        }
      })
      const resDestroyed = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/${destroyedCourse.id}`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      assert(resDestroyed.status === 404, 'Destroyed course returns 404 Not Found')
      await prisma.course.delete({ where: { id: destroyedCourse.id } })

      // Test zero-data course
      const zeroCourse = await prisma.course.create({
        data: {
          title: 'Brand New Zero Data Course',
          slug: `zero-data-course-${Date.now()}`,
          price: 0,
          status: 'PENDING',
          authorId: teacherA.id,
          isDestroyed: false
        }
      })
      const resZeroCourse = await fetch(`${BASE_URL}/api/teacher/statistics/course-performance/${zeroCourse.id}`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      })
      const dataZeroCourse = await resZeroCourse.json()
      assert(resZeroCourse.status === 200, 'Zero-data course returns 200 OK')
      assert(dataZeroCourse.data.overview.revenue.totalRevenue === 0, 'Zero-data course has totalRevenue = 0')
      assert(dataZeroCourse.data.overview.students.totalStudents === 0, 'Zero-data course has totalStudents = 0')
      assert(dataZeroCourse.data.overview.students.completionRate === 0, 'Zero-data course has completionRate = 0 (no NaN)')
      assert(dataZeroCourse.data.overview.engagement.averageRating === 0, 'Zero-data course has averageRating = 0')
      assert(dataZeroCourse.data.quizzes.summary.totalQuizzes === 0, 'Zero-data course has totalQuizzes = 0')
      assert(dataZeroCourse.data.lessonsFunnel.length === 0, 'Zero-data course has empty lessonsFunnel')
      await prisma.course.delete({ where: { id: zeroCourse.id } })
    }

    // Cleanup test course created for Teacher B if applicable
    if (courseB && courseB.title === 'Teacher B Exclusive Course For Testing') {
      await prisma.course.delete({ where: { id: courseB.id } })
    }
  } catch (err: any) {
    console.error('Test suite error:', err)
    assert(false, 'Test suite execution completed without fatal errors', err.message)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await prisma.$disconnect()
  }

  // Summary
  console.log('\n===============================================================')
  console.log('📊 TEST SUMMARY')
  console.log('===============================================================')
  const total = results.length
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  console.log(`Total Tests: ${total}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failed}`)

  if (failed > 0) {
    console.error('\n❌ SOME TESTS FAILED!')
    process.exit(1)
  } else {
    console.log('\n🎉 ALL 12 MANDATORY TEST REQUIREMENTS PASSED WITH 100% SUCCESS!')
    process.exit(0)
  }
}

runTestSuite()
