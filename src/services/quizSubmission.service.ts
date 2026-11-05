import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  findSubmissionDetailByQuizAndUser,
  findSubmissionByQuizAndUser,
  findSubmissionsByQuizId,
  findSubmissionsForAnalytics,
  createSubmissionWithAnswers,
  SubmissionDetailPayload
} from '~/repositories/quizSubmission.repository'
import { findEnrollmentByUserAndCourse, countEnrollmentsByCourseId } from '~/repositories/enrollment.repository'
import { findQuizById } from '~/repositories/quiz.repository'
import { findQuestionsByQuizIdStudy } from '~/repositories/question.repository'
import { findUserById } from '~/repositories/user.repository'
import { findCourseById } from '~/repositories/course.repository'
import { awardQuizCompletionXP } from './xp.service'
import { recordLearningActivityStreak } from './streak.service'
import { pushNotificationService } from './notification.service'
import { ENotificationType } from '~/types/enum'
import { ServiceResponse } from '~/types/type'
import { withCompatId } from '~/utils/uuid'
import {
  CreateQuizSubmissionInput,
  QuizSubmissionDetailResponse,
  SubmitQuizResultData,
  TeacherQuizSubmissionItem,
  TeacherQuizAnalytics
} from '~/models/quizSubmission.model'

/**
 * Format submission entity to preserve 100% backward compatibility with API contract:
 * - Adds `_id` alias matching `id` via `withCompatId`
 * - Exposes `quiz: submission.quizId`
 * - Exposes `user: submission.userId`
 * - Exposes answers array with compatible structure conforming to QuizSubmissionDetailResponse
 */
function formatSafeSubmission(sub: SubmissionDetailPayload): QuizSubmissionDetailResponse {
  return {
    ...withCompatId(sub),
    quiz: sub.quizId,
    user: sub.userId,
    answers: sub.answers.map((a) => ({
      ...withCompatId(a),
      questionId: a.questionId,
      question: a.question ? { ...withCompatId(a.question) } : a.questionId,
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect
    }))
  }
}

/**
 * Submit quiz answers and evaluate score:
 * - Accepts strongly-typed CreateQuizSubmissionInput from Application Model
 * - Verifies User exists
 * - Verifies Quiz exists
 * - Verifies User is enrolled in the Course
 * - Enforces single submission policy: @@unique([quizId, userId])
 * - Validates submitted questions belong to this Quiz (No foreign/duplicate questions)
 * - Evaluates score strictly comparing question.answer === selectedAnswer
 * - Persists QuizSubmission and QuizSubmissionAnswer[] atomically in PostgreSQL
 * - Sends notification to course instructor (non-blocking)
 */
export const submitQuizService = async (
  { userId, quizId, answers }: CreateQuizSubmissionInput,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse<SubmitQuizResultData>> => {
  // 1. Verify User exists
  const user = await findUserById(userId, tx)
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  // 2. Verify Quiz exists
  const quiz = await findQuizById(quizId, tx)
  if (!quiz) {
    return { success: false, statusCode: 404, message: 'Quiz not found' }
  }

  // 3. Verify Course enrollment
  const targetCourseId = quiz.courseId
  const enrollment = await findEnrollmentByUserAndCourse(userId, targetCourseId, tx)
  if (!enrollment) {
    return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
  }

  // 4. Verify Single Submission policy (pre-check)
  const existing = await findSubmissionByQuizAndUser(quizId, userId, tx)
  if (existing) {
    return { success: false, statusCode: 400, message: 'You have already submitted this quiz' }
  }

  // 5. Fetch questions with answers for grading
  const quizQuestions = await findQuestionsByQuizIdStudy(quizId, tx)
  if (!quizQuestions || quizQuestions.length === 0) {
    return { success: false, statusCode: 400, message: 'No questions found for this quiz' }
  }

  const questionMap = new Map(quizQuestions.map((q) => [q.id, q]))

  // 6. Security check on submitted questions
  const seenQuestionIds = new Set<string>()
  for (const ans of answers) {
    if (seenQuestionIds.has(ans.question)) {
      return { success: false, statusCode: 400, message: 'Duplicate question submitted' }
    }
    seenQuestionIds.add(ans.question)
    if (!questionMap.has(ans.question)) {
      return { success: false, statusCode: 400, message: 'Question does not belong to this quiz' }
    }
  }

  // 7. Calculate score & total points (Strict algorithm preservation)
  let totalPoints = 0
  for (const q of quizQuestions) {
    totalPoints += q.points || 1
  }

  let score = 0
  const submissionAnswers: Array<{
    questionId: string
    selectedAnswer: string
    isCorrect: boolean
  }> = []
  for (const ans of answers) {
    const question = questionMap.get(ans.question)
    const isCorrect = question ? question.answer === ans.selectedAnswer : false
    if (isCorrect && question) {
      score += question.points || 1
    }
    submissionAnswers.push({
      questionId: ans.question,
      selectedAnswer: String(ans.selectedAnswer),
      isCorrect
    })
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0

  // 8. Atomically persist submission, answers, Quiz XP, and Streak in PostgreSQL
  let submission: SubmissionDetailPayload
  try {
    const executeSubmissionWithGamification = async (clientTx: PrismaTransactionClient) => {
      const created = await createSubmissionWithAnswers(
        {
          quizId,
          userId,
          score,
          totalPoints,
          percentage,
          completedAt: new Date(),
          answers: submissionAnswers
        },
        clientTx
      )

      // Award Quiz XP (+100 XP) and update Streak (+20 XP if first activity today) within the same atomic transaction
      await awardQuizCompletionXP({ userId, quizId }, clientTx)
      await recordLearningActivityStreak({ userId }, clientTx)

      return created
    }

    if (tx) {
      submission = await executeSubmissionWithGamification(tx)
    } else {
      submission = await prisma.$transaction(async (clientTx) => {
        return executeSubmissionWithGamification(clientTx)
      })
    }
  } catch (err: unknown) {
    // Handle concurrent submission race conditions via code inspection
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { success: false, statusCode: 400, message: 'You have already submitted this quiz' }
    }
    throw err
  }

  // 9. Non-blocking Notification to Instructor
  try {
    const courseDoc = await findCourseById(targetCourseId, tx)
    const teacherId = courseDoc?.authorId
    if (teacherId && teacherId !== userId) {
      await pushNotificationService({
        senderId: userId,
        receiverId: teacherId,
        type: ENotificationType.QUIZ,
        message: `Học viên ${user.username}  vừa hoàn thành quiz "${quiz.title}"`,
        relatedId: submission.id
      })
    }
  } catch (notifErr: unknown) {
    // Non-blocking notification logging (Notification module will be migrated in Phase 10)
    const errorMessage = notifErr instanceof Error ? notifErr.message : String(notifErr)
    console.warn(`[Non-blocking] pushNotification skipped (${errorMessage})`)
  }

  return {
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      submission: formatSafeSubmission(submission),
      scoreDisplay: `${score}/${totalPoints}`,
      percentage
    }
  }
}

/**
 * Get quiz submission result for a specific student:
 * - Queries PostgreSQL by composite key [quizId, userId]
 * - Returns detailed answers conforming to QuizSubmissionDetailResponse
 */
export const getQuizSubmissionService = async (
  quizId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse<{ submission: QuizSubmissionDetailResponse }>> => {
  const submission = await findSubmissionDetailByQuizAndUser(quizId, userId, tx)

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
      submission: formatSafeSubmission(submission)
    }
  }
}

/**
 * Get all submissions for a quiz (Teacher view):
 * - Returns list of submissions with user, score, totalPoints, percentage, completedAt
 * - Conforms to TeacherQuizSubmissionItem[]
 */
export const getAllQuizSubmissionsService = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse<TeacherQuizSubmissionItem[]>> => {
  const submissions = await findSubmissionsByQuizId(quizId, tx)

  if (!submissions || submissions.length === 0) {
    return {
      success: false,
      statusCode: 404,
      message: 'No submissions found for this quiz'
    }
  }

  const submissionResults: TeacherQuizSubmissionItem[] = submissions.map((sub) => ({
    user: sub.user?.username || '',
    score: sub.score,
    totalPoints: sub.totalPoints,
    percentage: sub.percentage,
    completedAt: sub.completedAt
  }))

  return {
    success: true,
    message: 'Quiz submissions fetched successfully',
    data: submissionResults
  }
}

/**
 * Get quiz analytics (Teacher view):
 * - Calculates totalStudents, avgScore, minScore, maxScore, completionRate
 * - Conforms to TeacherQuizAnalytics
 */
export const getQuizAnalyticsService = async (
  quizId: string,
  tx?: PrismaTransactionClient
): Promise<ServiceResponse<TeacherQuizAnalytics>> => {
  const quiz = await findQuizById(quizId, tx)
  if (!quiz) {
    return {
      success: false,
      statusCode: 404,
      message: 'No submissions found for this quiz'
    }
  }

  const submissions = await findSubmissionsForAnalytics(quizId, tx)
  if (!submissions || submissions.length === 0) {
    return {
      success: false,
      statusCode: 404,
      message: 'No submissions found for this quiz'
    }
  }

  const totalStudents = await countEnrollmentsByCourseId(quiz.courseId, tx)

  let completedCount = 0
  let totalScore = 0
  let minScore = Infinity
  let maxScore = -Infinity

  for (const sub of submissions) {
    if (sub.completedAt) {
      completedCount += 1
    }
    const score = sub.score
    totalScore += score
    if (score < minScore) minScore = score
    if (score > maxScore) maxScore = score
  }

  const avgScore = totalScore / submissions.length
  const completionRate = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0

  const analyticsData: TeacherQuizAnalytics = {
    totalStudents,
    avgScore,
    minScore,
    maxScore,
    completionRate
  }

  return {
    success: true,
    message: 'Quiz analytics fetched successfully',
    data: analyticsData
  }
}
