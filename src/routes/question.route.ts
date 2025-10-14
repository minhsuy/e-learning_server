import express, { Request, Response } from 'express'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { handleValidationErrors } from '~/middlewares/validate'
import {
  createQuestionValidator,
  questionIdValidator,
  updateQuestionValidator
} from '~/middlewares/question.middleware'
import {
  createQuestionController,
  deleteQuestionController,
  updateQuestionController
} from '~/controller/question.controller'
const questionRouter = express.Router()
questionRouter.post(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  createQuestionValidator,
  handleValidationErrors,
  createQuestionController
)
// update question : PUT /api/questions/:questionId
questionRouter.put(
  '/:questionId',
  verifyAccessToken,
  isTeacherOrAdmin,
  updateQuestionValidator,
  handleValidationErrors,
  updateQuestionController
)

// delete question : DELETE /api/questions/:questionId
questionRouter.delete(
  '/:questionId',
  verifyAccessToken,
  isTeacherOrAdmin,
  questionIdValidator,
  handleValidationErrors,
  deleteQuestionController
)
export default questionRouter
