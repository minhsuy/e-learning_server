import express, { Request, Response } from 'express'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { quizIdValidator } from '~/middlewares/quiz.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { submitQuizValidator } from '~/middlewares/quizSubmission.middleware'
import {
  getAllQuizSubmissionsController,
  getQuizAnalyticsController,
  getQuizSubmissionController,
  submitQuizController
} from '~/controller/quizSubmission.controller'
const quizSubmissionRouter = express.Router()

// POST /api/submissions ->  submit quiz
quizSubmissionRouter.post('/', verifyAccessToken, submitQuizValidator, handleValidationErrors, submitQuizController)

// GET /api/submissions/teacher/analytics/:quizId -> get quiz analytics (teacher view)
quizSubmissionRouter.get(
  '/teacher/analytics/:quizId',
  verifyAccessToken,
  isTeacherOrAdmin,
  quizIdValidator,
  handleValidationErrors,
  getQuizAnalyticsController
)

// GET /api/submissions/teacher/:quizId -> get all submissions for a specific quiz (teacher view)
quizSubmissionRouter.get(
  '/teacher/:quizId',
  verifyAccessToken,
  isTeacherOrAdmin,
  quizIdValidator,
  handleValidationErrors,
  getAllQuizSubmissionsController
)

// GET /api/submissions/:quizId -> get quiz submission result for a specific user
quizSubmissionRouter.get(
  '/:quizId',
  verifyAccessToken,
  quizIdValidator,
  handleValidationErrors,
  getQuizSubmissionController
)

export default quizSubmissionRouter
