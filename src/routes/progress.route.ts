import express from 'express'
import {
  getProgressByCourseController,
  markLessonCompleteController,
  unmarkLessonCompleteController
} from '~/controller/progress.controller'
import {
  markLessonCompleteValidator,
  progressCourseIdValidator
} from '~/middlewares/progress.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const progressRouter = express.Router()

// POST /api/progress/complete
progressRouter.post(
  '/complete',
  verifyAccessToken,
  markLessonCompleteValidator,
  handleValidationErrors,
  markLessonCompleteController
)

// POST /api/progress/uncomplete
progressRouter.post(
  '/uncomplete',
  verifyAccessToken,
  markLessonCompleteValidator,
  handleValidationErrors,
  unmarkLessonCompleteController
)

// GET /api/progress/:courseId  : get progress by course
progressRouter.get(
  '/:courseId',
  verifyAccessToken,
  progressCourseIdValidator,
  handleValidationErrors,
  getProgressByCourseController
)

export default progressRouter
