import EnrollmentModel from '~/models/enrollment.model'
import QuizSubmissionModel from '~/models/quizSubmission.model'
import CertificateModel from '~/models/certificate.model'
import { generateCertificatePDF } from '~/utils/pdfGenerator'
import { ServiceResponse } from '~/types/type'
import QuizModel from '~/models/quiz.model'
import { pushNotificationService } from './notification.service'

export const createCertificateService = async (userId: string, courseId: string): Promise<ServiceResponse> => {
  const enrollment = await EnrollmentModel.findOne({ user: userId, course: courseId })
  if (!enrollment) {
    return { success: false, statusCode: 404, message: 'You are not enrolled in this course!' }
  }

  const checkCertificate = await CertificateModel.findOne({ user: userId, course: courseId })
  if (checkCertificate) {
    return { success: false, statusCode: 400, message: 'You already have a certificate for this course!' }
  }

  const progress = enrollment.progress
  if (progress < 70) {
    return { success: false, statusCode: 400, message: 'Progress is less than 70%' }
  }

  const quizzes = await QuizModel.find({ courseId })
  if (!quizzes || quizzes.length === 0) {
    return { success: false, statusCode: 400, message: 'No quizzes found for this course!' }
  }

  let totalQuizMaxScore = 0
  let totalQuizScore = 0
  let totalQuizzes = 0
  const totalQuizzesAvailable = quizzes.length

  const quizSubmissions = await QuizSubmissionModel.find({
    user: userId,
    quiz: { $in: quizzes.map((q) => q._id) }
  })
  if (!quizSubmissions || quizSubmissions.length === 0) {
    return { success: false, statusCode: 400, message: 'No quiz submissions found for this user!' }
  }

  for (const quiz of quizzes) {
    const quizSubmission = quizSubmissions.find((submission) => submission.quiz.toString() === quiz._id.toString())

    if (quizSubmission) {
      totalQuizMaxScore += quiz.questions.length
      totalQuizScore += quizSubmission.score
      totalQuizzes++
    }
  }

  const quizCompletionPercentage = totalQuizzesAvailable > 0 ? (totalQuizzes / totalQuizzesAvailable) * 100 : 0

  const quizPercentage = totalQuizMaxScore > 0 ? (totalQuizScore / totalQuizMaxScore) * 100 : 0

  if (quizCompletionPercentage < 60) {
    return { success: false, statusCode: 400, message: 'Quiz submission percentage is less than 60%' }
  }

  const finalScore = (progress + quizCompletionPercentage) / 2

  if (finalScore < 50) {
    return { success: false, statusCode: 400, message: 'Total score is less than 50%' }
  }

  const certificate = await CertificateModel.create({
    user: userId,
    course: courseId,
    grade: finalScore,
    issuedAt: new Date(),
    certificateUrl: await generateCertificatePDF(userId, courseId, finalScore)
  })

  return { success: true, message: 'Certificate created successfully', data: certificate }
}
