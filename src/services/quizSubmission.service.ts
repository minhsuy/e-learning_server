import EnrollmentModel from '~/models/enrollment.model'
import QuizSubmissionModel, { QuizSubmission } from '~/models/quizSubmission.model'
import QuizModel from '~/models/quiz.model'
import QuestionModel from '~/models/question.model'
import { Types } from 'mongoose'
import { ServiceResponse } from '~/types/type'
import LessonModel from '~/models/lesson.model'
import { pushNotificationService } from './notification.service'
import { ENotificationType } from '~/types/enum'
import UserModel from '~/models/user.model'

export const submitQuizService = async ({
  userId,
  quizId,
  answers
}: {
  userId: string
  quizId: string
  answers: { question: string; selectedAnswer: string }[]
}): Promise<ServiceResponse> => {
  const user = await UserModel.findById(userId).select('username')
  if (!user) return { success: false, statusCode: 404, message: 'User not found' }
  const quiz = await QuizModel.findById(quizId).populate<{ lesson: any }>('lesson')
  if (!quiz) return { success: false, statusCode: 404, message: 'Quiz not found' }

  const lesson = quiz.lesson
  const enrollment = await EnrollmentModel.findOne({ user: userId, course: lesson.course })
  if (!enrollment) return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }

  const existing = await QuizSubmissionModel.findOne({ quiz: quizId, user: userId })
  if (existing) return { success: false, statusCode: 400, message: 'You have already submitted this quiz' }

  let score = 0
  let totalPoints = 0
  for (const question of quiz.questions) {
    const q = await QuestionModel.findById(question)
    if (q) {
      totalPoints += q.points || 1
    }
  }
  for (const ans of answers) {
    const question = await QuestionModel.findById(ans.question)
    if (question && question.answer === ans.selectedAnswer) {
      score += question.points || 1
    }
  }
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

  const submission = await QuizSubmissionModel.create({
    quiz: new Types.ObjectId(quizId),
    user: new Types.ObjectId(userId),
    answers: answers.map((a) => ({ question: new Types.ObjectId(a.question), selectedAnswer: a.selectedAnswer })),
    score,
    totalPoints,
    percentage,
    completedAt: new Date()
  })
  const lessonDoc = await LessonModel.findById(lesson._id).populate<{ course: any }>('course', 'author')
  const teacherId = lessonDoc?.course?.author.toString()
  if (teacherId && teacherId !== userId) {
    await pushNotificationService({
      senderId: userId,
      receiverId: teacherId,
      type: ENotificationType.QUIZ,
      message: `Học viên ${user.username}  vừa hoàn thành quiz "${quiz.title}"`,
      relatedId: submission._id.toString()
    })
  }

  return {
    success: true,
    message: 'Quiz submitted successfully',
    data: { submission, scoreDisplay: `${score}/${totalPoints}`, percentage }
  }
}

// get quiz submission result for a specific user
export const getQuizSubmissionService = async (quizId: string, userId: string): Promise<ServiceResponse> => {
  const submission = await QuizSubmissionModel.findOne({
    quiz: quizId,
    user: userId
  }).populate<{ answers: { question: any; selectedAnswer: string }[] }>('answers.question')

  if (!submission) {
    return {
      success: false,
      statusCode: 404,
      message: 'No submission found for this quiz'
    }
  }

  return {
    success: true,
    message: 'Quiz submission fetched successfully',
    data: {
      submission
    }
  }
}

// get all quiz for teacher
export const getAllQuizSubmissionsService = async (quizId: string): Promise<ServiceResponse> => {
  // Lấy tất cả submissions của quizId này
  const submissions = await QuizSubmissionModel.find({ quiz: quizId })
    .populate<{ user: any }>('user', 'username')
    .populate<{ quiz: any }>('quiz', 'title')
    .populate<{ answers: { question: any; selectedAnswer: string }[] }>('answers.question', 'title')

  if (!submissions || submissions.length === 0) {
    return {
      success: false,
      statusCode: 404,
      message: 'No submissions found for this quiz'
    }
  }

  const submissionResults = submissions.map((submission) => ({
    user: submission.user.username,
    score: submission.score,
    totalPoints: submission.totalPoints,
    percentage: submission.percentage,
    completedAt: submission.completedAt
  }))

  return {
    success: true,
    message: 'Quiz submissions fetched successfully',
    data: submissionResults
  }
}

// get quiz analysis
export const getQuizAnalyticsService = async (quizId: string): Promise<ServiceResponse> => {
  // Lấy tất cả submissions của quizId này
  const submissions = await QuizSubmissionModel.find({ quiz: quizId })

  if (!submissions || submissions.length === 0) {
    return {
      success: false,
      statusCode: 404,
      message: 'No submissions found for this quiz'
    }
  }

  const quiz = await QuizModel.findById(quizId).populate<{ lesson: any }>('lesson')

  const totalStudents = await EnrollmentModel.countDocuments({
    course: quiz && quiz.lesson.course
  })

  let completedCount = 0
  submissions.forEach((submission) => {
    if (submission.completedAt) {
      completedCount += 1
    }
  })

  let totalScore = 0
  let minScore = Infinity
  let maxScore = -Infinity

  submissions.forEach((submission) => {
    const score = submission.score
    totalScore += score

    if (score < minScore) minScore = score
    if (score > maxScore) maxScore = score
  })

  const avgScore = totalScore / submissions.length

  const completionRate = (completedCount / totalStudents) * 100

  return {
    success: true,
    message: 'Quiz analytics fetched successfully',
    data: {
      totalStudents,
      avgScore,
      minScore,
      maxScore,
      completionRate
    }
  }
}
