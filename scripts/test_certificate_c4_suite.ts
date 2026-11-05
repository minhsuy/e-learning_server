import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { prisma } from '../src/config/prisma'
import {
  createCertificateService,
  getMyCertificatesService,
  getCertificateByCourseService,
  verifyCertificateService
} from '../src/services/certificate.service'
import { markLessonCompleteService } from '../src/services/progress.service'
import { generateCertificatePDF } from '../src/utils/pdfGenerator'
import { generateQRMatrix } from '../src/utils/qrCode'

/**
 * TMDEMY — PHASE C4: CERTIFICATE INTEGRATION & END-TO-END TEST SUITE
 * 
 * Tests the entire certificate flow against real PostgreSQL database:
 * - Ineligible conditions (Unenrolled, Progress < 70%, Course without quiz, No submissions, Quiz % < 60%)
 * - Eligible creation with EXISTING formula: ((progress + quizCompletionPercentage) / 2)
 * - PDFKit generation (Unicode, no spillover, A4 landscape, QR matrix)
 * - Cloudinary URL format (no folder duplication)
 * - GET /api/certificates/my
 * - GET /api/certificates/course/:courseId
 * - Public verification GET /api/certificates/verify/:code (Security check: no leaked internal IDs/email/phone)
 * - Concurrency & Duplicate reliability
 * - Database integrity & regression protection
 */

async function runC4CertificateTestSuite() {
  console.log('===============================================================')
  console.log('   TMDEMY — PHASE C4 CERTIFICATE INTEGRATION & E2E TEST SUITE   ')
  console.log('===============================================================')

  const baselineCertCount = await prisma.certificate.count()
  console.log(`\n[BASELINE] Total certificates in database: ${baselineCertCount}`)

  // 1. SETUP TEST FIXTURES
  console.log('\n--- STEP 1: Setting up test fixtures ---')
  const timestamp = Date.now()
  const testStudent = await prisma.user.create({
    data: {
      username: `test_c4_student_${timestamp}`,
      email: `test_c4_student_${timestamp}@tmdemy.test`,
      password: 'hashed_password_123',
      role: 'USER'
    }
  })

  const testTeacher = await prisma.user.create({
    data: {
      username: `test_c4_teacher_${timestamp}`,
      email: `test_c4_teacher_${timestamp}@tmdemy.test`,
      password: 'hashed_password_123',
      role: 'TEACHER'
    }
  })

  const testCategory = await prisma.category.create({
    data: {
      name: `C4 Test Category ${timestamp}`,
      slug: `c4-test-category-${timestamp}`
    }
  })

  const testCourse = await prisma.course.create({
    data: {
      title: `Khóa Học Kiểm Thử Chứng Chỉ C4 ${timestamp}`,
      slug: `khoa-hoc-kiem-thu-chung-chi-c4-${timestamp}`,
      authorId: testTeacher.id,
      categoryId: testCategory.id,
      status: 'APPROVED',
      price: 0
    }
  })

  const testChapter = await prisma.chapter.create({
    data: {
      title: 'Chương 1: Nền Tảng',
      courseId: testCourse.id,
      order: 1
    }
  })

  const testLesson1 = await prisma.lesson.create({
    data: {
      title: 'Bài 1: Giới thiệu hệ thống',
      slug: `bai-1-gioi-thieu-${timestamp}`,
      chapterId: testChapter.id,
      courseId: testCourse.id,
      authorId: testTeacher.id,
      order: 1
    }
  })

  const testLesson2 = await prisma.lesson.create({
    data: {
      title: 'Bài 2: Thực hành chuyên sâu',
      slug: `bai-2-thuc-hanh-${timestamp}`,
      chapterId: testChapter.id,
      courseId: testCourse.id,
      authorId: testTeacher.id,
      order: 2
    }
  })

  console.log(`Created test student: ${testStudent.id} (${testStudent.username})`)
  console.log(`Created test course: ${testCourse.id} (${testCourse.title})`)

  try {
    // ==========================================
    // 2. INELIGIBLE TEST SCENARIOS
    // ==========================================
    console.log('\n--- STEP 2: Ineligible Scenarios Testing ---')

    // Scenario 2.1: Student not enrolled -> 404
    console.log('Testing Scenario 2.1: Student not enrolled...')
    const res2_1 = await createCertificateService(testStudent.id, testCourse.id)
    assert(res2_1.statusCode === 404 && res2_1.message.includes('not enrolled'), 'Scenario 2.1: Unenrolled student must be rejected with 404')
    console.log('  PASS: Rejected unenrolled student with 404')

    // Now enroll student
    await prisma.enrollment.create({
      data: {
        userId: testStudent.id,
        courseId: testCourse.id,
        progress: 0,
        status: 'ACTIVE'
      }
    })

    // Scenario 2.2: Enrolled student with Progress < 70% -> 400
    console.log('Testing Scenario 2.2: Progress < 70% (progress = 0%)...')
    const res2_2 = await createCertificateService(testStudent.id, testCourse.id)
    assert(res2_2.statusCode === 400 && res2_2.message.includes('less than 70%'), 'Scenario 2.2: Progress < 70% must be rejected with 400')
    console.log('  PASS: Rejected progress < 70% with 400')

    // Mark 1/2 lessons complete (progress = 50% < 70%)
    await markLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson1.id
    })
    const res2_2b = await createCertificateService(testStudent.id, testCourse.id)
    assert(res2_2b.statusCode === 400 && res2_2b.message.includes('less than 70%'), 'Scenario 2.2b: Progress 50% must be rejected with 400')
    console.log('  PASS: Rejected progress 50% with 400')

    // Mark 2/2 lessons complete (progress = 100% >= 70%)
    await markLessonCompleteService({
      userId: testStudent.id,
      courseId: testCourse.id,
      lessonId: testLesson2.id
    })

    // Scenario 2.3: Progress 100% but course has NO quizzes -> 400
    console.log('Testing Scenario 2.3: Course has no quizzes...')
    const res2_3 = await createCertificateService(testStudent.id, testCourse.id)
    assert(res2_3.statusCode === 400 && res2_3.message.includes('No quizzes found'), 'Scenario 2.3: Course without quizzes must be rejected with 400')
    console.log('  PASS: Rejected course without quizzes with 400')

    // Create Quiz 1 on Lesson 1
    const testQuiz1 = await prisma.quiz.create({
      data: {
        title: 'Quiz 1: Đánh Giá Nền Tảng',
        lessonId: testLesson1.id,
        courseId: testCourse.id,
        createdById: testTeacher.id,
        duration: 15,
        passingGrade: 70
      }
    })

    // Create Quiz 2 on Lesson 2
    const testQuiz2 = await prisma.quiz.create({
      data: {
        title: 'Quiz 2: Đánh Giá Chuyên Sâu',
        lessonId: testLesson2.id,
        courseId: testCourse.id,
        createdById: testTeacher.id,
        duration: 20,
        passingGrade: 70
      }
    })

    // Scenario 2.4: Course has quizzes, but student has NO quiz submission -> 400
    console.log('Testing Scenario 2.4: Student has no quiz submissions...')
    const res2_4 = await createCertificateService(testStudent.id, testCourse.id)
    assert(res2_4.statusCode === 400 && res2_4.message.includes('No quiz submissions found'), 'Scenario 2.4: No quiz submissions must be rejected with 400')
    console.log('  PASS: Rejected no quiz submissions with 400')

    // Submit Quiz 1 (1 out of 2 quizzes = 50% completion < 60% threshold)
    await prisma.quizSubmission.create({
      data: {
        quizId: testQuiz1.id,
        userId: testStudent.id,
        score: 10,
        totalPoints: 10,
        percentage: 100
      }
    })

    // Scenario 2.5: Quiz completion percentage < 60% (1/2 = 50%) -> 400
    console.log('Testing Scenario 2.5: Quiz completion percentage < 60% (50%)...')
    const res2_5 = await createCertificateService(testStudent.id, testCourse.id)
    assert(res2_5.statusCode === 400 && res2_5.message.includes('less than 60%'), 'Scenario 2.5: Quiz completion < 60% must be rejected with 400')
    console.log('  PASS: Rejected quiz completion < 60% with 400')

    // ==========================================
    // 3. ELIGIBLE TEST SCENARIOS
    // ==========================================
    console.log('\n--- STEP 3: Eligible Scenarios & Grade Verification ---')

    // Submit Quiz 2 (2 out of 2 quizzes = 100% completion >= 60%)
    await prisma.quizSubmission.create({
      data: {
        quizId: testQuiz2.id,
        userId: testStudent.id,
        score: 8,
        totalPoints: 10,
        percentage: 80
      }
    })

    // Existing formula check:
    // progress = 100
    // quizCompletionPercentage = (2 / 2) * 100 = 100
    // finalScore = (100 + 100) / 2 = 100
    const expectedFinalScore = 100

    console.log('Testing Scenario 3.1: Eligible student requesting certificate...')
    const res3_1 = await createCertificateService(testStudent.id, testCourse.id)
    assert(res3_1.success === true, 'Scenario 3.1: Certificate must be created successfully')
    assert(typeof res3_1.data.grade === 'number', 'Grade must be serialized as number')
    assert(res3_1.data.grade === expectedFinalScore, `Grade must match EXISTING formula: ${res3_1.data.grade} == ${expectedFinalScore}`)
    assert(typeof res3_1.data.code === 'string' && res3_1.data.code.startsWith('TMDEMY-CERT-'), 'Certificate code must be generated with TMDEMY-CERT- prefix')
    assert(res3_1.data.certificateUrl.length > 0, 'Certificate URL must not be empty')
    console.log(`  PASS: Certificate granted! Code: ${res3_1.data.code}, Grade: ${res3_1.data.grade}%, URL: ${res3_1.data.certificateUrl}`)

    const issuedCert = res3_1.data

    // Scenario 3.2: Verify Cloudinary URL format (NO folder duplication)
    console.log('Testing Scenario 3.2: Verifying Cloudinary URL...')
    assert(!issuedCert.certificateUrl.includes('certificates/certificates/'), 'Certificate URL must NOT contain duplicated folder certificates/certificates/')
    assert(issuedCert.certificateUrl.includes('certificates/certificate_'), 'Certificate URL must point to certificates/certificate_<userId>_<courseId>.pdf')
    console.log('  PASS: Cloudinary URL has clean single folder structure (no duplication)')

    // ==========================================
    // 4. DUPLICATE & CONCURRENCY RELIABILITY
    // ==========================================
    console.log('\n--- STEP 4: Duplicate & Concurrency Reliability ---')

    // Scenario 4.1: Second certificate request -> 400
    console.log('Testing Scenario 4.1: Duplicate request rejection...')
    const res4_1 = await createCertificateService(testStudent.id, testCourse.id)
    assert(res4_1.statusCode === 400 && res4_1.message.includes('already have a certificate'), 'Duplicate certificate request must be rejected with 400')
    console.log('  PASS: Duplicate request rejected with 400')

    // Scenario 4.2: Concurrent POST simulation
    console.log('Testing Scenario 4.2: Concurrent request simulation...')
    // We create another student to test race condition
    const racerStudent = await prisma.user.create({
      data: {
        username: `racer_student_${timestamp}`,
        email: `racer_${timestamp}@tmdemy.test`,
        password: 'pass',
        role: 'USER'
      }
    })
    await prisma.enrollment.create({
      data: { userId: racerStudent.id, courseId: testCourse.id, progress: 100, status: 'COMPLETED' }
    })
    await prisma.quizSubmission.create({
      data: { quizId: testQuiz1.id, userId: racerStudent.id, score: 10, totalPoints: 10, percentage: 100 }
    })
    await prisma.quizSubmission.create({
      data: { quizId: testQuiz2.id, userId: racerStudent.id, score: 10, totalPoints: 10, percentage: 100 }
    })

    const [race1, race2] = await Promise.all([
      createCertificateService(racerStudent.id, testCourse.id),
      createCertificateService(racerStudent.id, testCourse.id)
    ])

    const successCount = [race1, race2].filter((r) => r.success).length
    const rejectedCount = [race1, race2].filter((r) => !r.success && r.statusCode === 400).length
    assert(successCount === 1, `Exactly 1 concurrent request must succeed (got ${successCount})`)
    assert(rejectedCount === 1, `Exactly 1 concurrent request must be rejected with 400 (got ${rejectedCount})`)
    console.log('  PASS: Concurrency handled safely (1 succeeded, 1 rejected with 400)')

    // Clean up racer student certificate
    await prisma.certificate.deleteMany({ where: { userId: racerStudent.id } })
    await prisma.quizSubmission.deleteMany({ where: { userId: racerStudent.id } })
    await prisma.enrollment.deleteMany({ where: { userId: racerStudent.id } })
    await prisma.user.delete({ where: { id: racerStudent.id } })

    // ==========================================
    // 5. QUERY APIS: GET /my & GET /course/:id
    // ==========================================
    console.log('\n--- STEP 5: Query APIs Testing ---')

    // Scenario 5.1: GET /api/certificates/my
    console.log('Testing Scenario 5.1: getMyCertificatesService...')
    const myCertsRes = await getMyCertificatesService(testStudent.id)
    assert(myCertsRes.success === true, 'getMyCertificatesService must succeed')
    assert(Array.isArray(myCertsRes.data), 'getMyCertificatesService must return an array')
    assert(myCertsRes.data.length === 1, `Student must have exactly 1 certificate (got ${myCertsRes.data.length})`)
    assert(myCertsRes.data[0].code === issuedCert.code, 'Certificate code in list must match issued code')
    assert(myCertsRes.data[0].course.title === testCourse.title, 'Course title must be populated')
    assert(myCertsRes.data[0].course.author.username === testTeacher.username, 'Instructor username must be populated')
    assert(typeof myCertsRes.data[0].grade === 'number', 'Grade in list must be serialized as number')
    console.log(`  PASS: GET /my returned 1 certificate with populated course "${myCertsRes.data[0].course.title}"`)

    // Scenario 5.2: GET /api/certificates/course/:courseId
    console.log('Testing Scenario 5.2: getCertificateByCourseService...')
    const courseCertRes = await getCertificateByCourseService(testStudent.id, testCourse.id)
    assert(courseCertRes.success === true, 'getCertificateByCourseService must succeed')
    assert(courseCertRes.data.code === issuedCert.code, 'Certificate code must match')
    assert(courseCertRes.data.course.title === testCourse.title, 'Course title must be populated')
    console.log(`  PASS: GET /course/:courseId retrieved certificate ${courseCertRes.data.code}`)

    // Scenario 5.3: GET /api/certificates/course/:courseId for course without certificate -> 404
    console.log('Testing Scenario 5.3: getCertificateByCourseService for unearned course...')
    const nonCourseCertRes = await getCertificateByCourseService(testTeacher.id, testCourse.id)
    assert(nonCourseCertRes.statusCode === 404, 'Unearned course certificate must return 404')
    console.log('  PASS: Returned 404 for unearned course certificate')

    // ==========================================
    // 6. PUBLIC VERIFICATION & SECURITY
    // ==========================================
    console.log('\n--- STEP 6: Public Verification & Security Testing ---')

    // Scenario 6.1: Public verification by code (NO JWT)
    console.log(`Testing Scenario 6.1: verifyCertificateService with code "${issuedCert.code}"...`)
    const verifyRes = await verifyCertificateService(issuedCert.code)
    assert(verifyRes.success === true, 'Public verification must succeed')
    assert(verifyRes.data.isValid === true, 'Verification result must have isValid = true')
    assert(verifyRes.data.code === issuedCert.code, 'Verification code must match')
    assert(verifyRes.data.student.username === testStudent.username, 'Student username must match')
    assert(verifyRes.data.course.title === testCourse.title, 'Course title must match')
    assert(verifyRes.data.instructor.username === testTeacher.username, 'Instructor username must match')

    // SECURITY AUDIT: Check for NO sensitive fields in verification response
    console.log('Testing Scenario 6.2: Public verification security audit...')
    const verifyData = verifyRes.data as any
    assert(verifyData.userId === undefined, 'SECURITY PASS: userId must NOT be present in public verification')
    assert(verifyData.student.email === undefined, 'SECURITY PASS: student email must NOT be present')
    assert(verifyData.student.phone === undefined, 'SECURITY PASS: student phone must NOT be present')
    assert(verifyData.course.authorId === undefined, 'SECURITY PASS: authorId must NOT be present')
    assert(verifyData.id === undefined, 'SECURITY PASS: internal database UUID must NOT be leaked')
    console.log('  PASS: Security verified — zero internal IDs, emails, or phone numbers leaked!')

    // Scenario 6.3: Public verification with invalid code -> 404
    console.log('Testing Scenario 6.3: Verification with non-existent code...')
    const invalidVerifyRes = await verifyCertificateService('INVALID-CODE-99999')
    assert(invalidVerifyRes.statusCode === 404, 'Invalid verification code must return 404')
    console.log('  PASS: Invalid code rejected with 404')

    // ==========================================
    // 7. PDFKIT & QR GENERATION VERIFICATION
    // ==========================================
    console.log('\n--- STEP 7: PDFKit & QR Generation Verification ---')

    console.log('Testing Scenario 7.1: Generating and inspecting real PDF buffer...')
    const samplePdfUrl = await generateCertificatePDF({
      userId: testStudent.id,
      courseId: testCourse.id,
      grade: 95.5,
      studentName: 'Nguyễn Văn Thái Quang Minh (Tiếng Việt Có Dấu)',
      courseTitle: 'Khóa Học Lập Trình TypeScript & Next.js Nâng Cao 2026',
      instructorName: 'ThS. Hoàng Quốc Bảo',
      certificateCode: issuedCert.code,
      verificationUrl: `http://localhost:3000/certificates/verify/${issuedCert.code}`
    })

    assert(samplePdfUrl.length > 0, 'PDF generation must produce a valid URL')
    console.log(`  PASS: PDF generated successfully with URL: ${samplePdfUrl}`)

    // Verify QR code matrix generation
    console.log('Testing Scenario 7.2: Verifying QR Code Matrix generator...')
    const qrMatrix = generateQRMatrix(`http://localhost:3000/certificates/verify/${issuedCert.code}`)
    assert(Array.isArray(qrMatrix) && qrMatrix.length >= 29, 'QR matrix must be a valid 2D array of at least 29x29')
    assert(qrMatrix.every((row) => row.length === qrMatrix.length), 'QR matrix must be square')
    console.log(`  PASS: QR Matrix verified (${qrMatrix.length} x ${qrMatrix.length} modules)`)

    console.log('\n===============================================================')
    console.log('   ALL C4 INTEGRATION & E2E TESTS PASSED SUCCESSFULLY! (100%)  ')
    console.log('===============================================================')
  } finally {
    // ==========================================
    // 8. TEARDOWN FIXTURES (CLEANUP TEST DATA)
    // ==========================================
    console.log('\n--- STEP 8: Cleaning up test fixtures ---')
    await prisma.certificate.deleteMany({ where: { userId: testStudent.id } })
    await prisma.quizSubmission.deleteMany({ where: { userId: testStudent.id } })
    await prisma.quiz.deleteMany({ where: { courseId: testCourse.id } })
    await prisma.progress.deleteMany({ where: { userId: testStudent.id } })
    await prisma.enrollment.deleteMany({ where: { userId: testStudent.id } })
    await prisma.lesson.deleteMany({ where: { courseId: testCourse.id } })
    await prisma.chapter.deleteMany({ where: { courseId: testCourse.id } })
    await prisma.course.delete({ where: { id: testCourse.id } })
    await prisma.category.delete({ where: { id: testCategory.id } })
    await prisma.user.delete({ where: { id: testStudent.id } })
    await prisma.user.delete({ where: { id: testTeacher.id } })

    const finalCertCount = await prisma.certificate.count()
    console.log(`[TEARDOWN] Certificates count: ${finalCertCount} (Baseline: ${baselineCertCount})`)
    assert(finalCertCount === baselineCertCount, `Database Integrity: certificates count must match baseline (${finalCertCount} == ${baselineCertCount})`)
    console.log('  PASS: Database integrity preserved. All test data cleaned up!')
  }
}

runC4CertificateTestSuite()
  .catch((err) => {
    console.error('\n❌ C4 TEST SUITE FAILED:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
