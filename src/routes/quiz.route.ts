import express, { Request, Response } from 'express'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { createQuizValidator, quizIdValidator, updateQuizValidator } from '~/middlewares/quiz.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import {
  createQuizController,
  deleteQuizController,
  getQuizzesByLessonController,
  updateQuizController
} from '~/controller/quiz.controller'
import { lessonIdValidator } from '~/middlewares/comment.middleware'
const quizRouter = express.Router()

// POST /api/quiz -> create a new quiz
quizRouter.post(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  createQuizValidator,
  handleValidationErrors,
  createQuizController
)
// PUT /api/quiz/:quizId -> update quiz
quizRouter.put(
  '/:quizId',
  verifyAccessToken,
  isTeacherOrAdmin,
  updateQuizValidator,
  handleValidationErrors,
  updateQuizController
)
// Delete quiz : DELETE /api/quiz/:quizId
quizRouter.delete(
  '/:quizId',
  verifyAccessToken,
  isTeacherOrAdmin,
  quizIdValidator,
  handleValidationErrors,
  deleteQuizController
)
// GET /api/quiz/lesson/:lessonId -> Get quizzes for a specific lesson
quizRouter.get('/lesson/:lessonId', lessonIdValidator, handleValidationErrors, getQuizzesByLessonController)

export default quizRouter
