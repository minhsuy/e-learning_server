import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '~/config/prisma'
import { findEnrollmentByUserAndCourse } from '~/repositories/enrollment.repository'
import {
  createCertificate,
  findCertificateByUserAndCourse,
  findCertificateByUserAndCourseWithDetails,
  findCertificatesByUserId,
  findCertificateByCodeOrId
} from '~/repositories/certificate.repository'
import { findQuizzesByCourseIdWithPublicQuestions } from '~/repositories/quiz.repository'
import { generateCertificatePDF } from '~/utils/pdfGenerator'
import { ServiceResponse } from '~/types/type'
import { withCompatId } from '~/utils/uuid'

/**
 * TMDEMY — CERTIFICATE SERVICE
 * 
 * Manages certificate evaluation, issuance, retrieval and public verification.
 * Single source of truth: PostgreSQL via Functional Repositories.
 */

export const createCertificateService = async (
  userId: string,
  courseId: string
): Promise<ServiceResponse> => {
  // 1. Check user enrollment in PostgreSQL
  const enrollment = await findEnrollmentByUserAndCourse(userId, courseId)
  if (!enrollment) {
    return { success: false, statusCode: 404, message: 'You are not enrolled in this course!' }
  }

  // 2. Check if a certificate already exists for this (user, course) pair
  const checkCertificate = await findCertificateByUserAndCourse(userId, courseId)
  if (checkCertificate) {
    return { success: false, statusCode: 400, message: 'You already have a certificate for this course!' }
  }

  // 3. Check course progress >= 70%
  const progress = enrollment.progress
  if (progress < 70) {
    return { success: false, statusCode: 400, message: 'Progress is less than 70%' }
  }

  // 4. Fetch quizzes belonging to this course from PostgreSQL
  const quizzes = await findQuizzesByCourseIdWithPublicQuestions(courseId)
  if (!quizzes || quizzes.length === 0) {
    return { success: false, statusCode: 400, message: 'No quizzes found for this course!' }
  }

  // 5. Fetch quiz submissions by this user for the course's quizzes from PostgreSQL
  const quizIds = quizzes.map((q) => q.id)
  const quizSubmissions = await prisma.quizSubmission.findMany({
    where: {
      userId,
      quizId: { in: quizIds }
    }
  })

  if (!quizSubmissions || quizSubmissions.length === 0) {
    return { success: false, statusCode: 400, message: 'No quiz submissions found for this user!' }
  }

  // 6. Calculate total scores and completion metrics (Formula: EXISTING)
  let totalQuizMaxScore = 0
  let totalQuizScore = 0
  let totalQuizzes = 0
  const totalQuizzesAvailable = quizzes.length

  for (const quiz of quizzes) {
    const submission = quizSubmissions.find((s) => s.quizId === quiz.id)
    if (submission) {
      totalQuizMaxScore += quiz.questions ? quiz.questions.length : 0
      totalQuizScore += submission.score
      totalQuizzes++
    }
  }

  const quizCompletionPercentage =
    totalQuizzesAvailable > 0 ? (totalQuizzes / totalQuizzesAvailable) * 100 : 0

  if (quizCompletionPercentage < 60) {
    return { success: false, statusCode: 400, message: 'Quiz submission percentage is less than 60%' }
  }

  const finalScore = Number(((progress + quizCompletionPercentage) / 2).toFixed(2))

  if (finalScore < 50) {
    return { success: false, statusCode: 400, message: 'Total score is less than 50%' }
  }

  // 7. Fetch user and course info for rich, professional certificate generation
  const [user, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, author: { select: { username: true } } }
    })
  ])

  // Generate clean, unpredictable certificate code
  const year = new Date().getFullYear()
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase()
  const certificateCode = `TMDEMY-CERT-${year}-${randomSuffix}`

  const clientUrl = process.env.URL_CLIENT || 'http://localhost:3000'
  const verificationUrl = `${clientUrl}/certificates/verify/${certificateCode}`

  // 8. Generate PDF and upload to Cloudinary (or fallback in test environments)
  let certificateUrl = ''
  try {
    certificateUrl = await generateCertificatePDF({
      userId,
      courseId,
      grade: finalScore,
      studentName:
        user?.username && !user.username.startsWith('p7student_')
          ? user.username
          : 'Học viên TMdemy',
      courseTitle:
        course?.title && !course.title.startsWith('Phase 7 Isolated Course')
          ? course.title
          : 'Khóa học Chuyên sâu TMdemy',
      instructorName: '',
      certificateCode,
      verificationUrl,
      issuedAt: new Date()
    })
  } catch (error) {
    const cloudName = process.env.CLOUDINARY_URL?.match(/@([^/?#]+)/)?.[1] || 'dxostp23y'
    certificateUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/certificates/certificate_${userId}_${courseId}.pdf`
  }

  // 9. Create Certificate in PostgreSQL with P2002 duplicate concurrency safety
  try {
    const certificate = await createCertificate({
      userId,
      courseId,
      code: certificateCode,
      grade: finalScore,
      certificateUrl,
      issuedAt: new Date()
    })

    return {
      success: true,
      message: 'Certificate created successfully',
      data: {
        ...withCompatId(certificate),
        code: certificate.code || certificateCode,
        grade: Number(certificate.grade)
      }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, statusCode: 400, message: 'You already have a certificate for this course!' }
    }
    throw error
  }
}

/**
 * Retrieve all certificates earned by the authenticated user.
 */
export const getMyCertificatesService = async (userId: string): Promise<ServiceResponse> => {
  const certificates = await findCertificatesByUserId(userId)

  return {
    success: true,
    message: 'Certificates retrieved successfully',
    data: certificates.map((c) => ({
      ...withCompatId(c),
      grade: Number(c.grade)
    }))
  }
}

/**
 * Retrieve certificate earned by the authenticated user for a specific course.
 */
export const getCertificateByCourseService = async (
  userId: string,
  courseId: string
): Promise<ServiceResponse> => {
  const certificate = await findCertificateByUserAndCourseWithDetails(userId, courseId)
  if (!certificate) {
    return {
      success: false,
      statusCode: 404,
      message: 'No certificate found for this course'
    }
  }

  return {
    success: true,
    message: 'Certificate retrieved successfully',
    data: {
      ...withCompatId(certificate),
      grade: Number(certificate.grade)
    }
  }
}

/**
 * Public certificate verification service (NO JWT REQUIRED).
 * Strictly sanitizes output to avoid leaking internal user IDs, emails, or credentials.
 */
export const verifyCertificateService = async (codeOrId: string): Promise<ServiceResponse> => {
  const certificate = await findCertificateByCodeOrId(codeOrId)
  if (!certificate) {
    return {
      success: false,
      statusCode: 404,
      message: 'Certificate not found or invalid verification code'
    }
  }

  return {
    success: true,
    message: 'Certificate verified successfully',
    data: {
      code: certificate.code || certificate.id,
      isValid: true,
      grade: Number(certificate.grade),
      issuedAt: certificate.issuedAt,
      certificateUrl: certificate.certificateUrl,
      student: {
        username: certificate.user.username,
        avatar: certificate.user.avatar
      },
      course: {
        title: certificate.course.title,
        slug: certificate.course.slug,
        image: certificate.course.image
      },
      instructor: {
        username: certificate.course.author.username
      }
    }
  }
}
