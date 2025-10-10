import express from 'express'
import { getCategoriesController, getCategoryDetailController } from '~/controller/category.controller'
import {
  getProgressByCourseController,
  markLessonCompleteController,
  unmarkLessonCompleteController
} from '~/controller/progress.controller'
import { getCategoryDetailValidator, listCategoriesValidator } from '~/middlewares/category.middleware'
import { markLessonCompleteValidator } from '~/middlewares/progress.middleware'
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
progressRouter.get('/:courseId', verifyAccessToken, getProgressByCourseController)

export default progressRouter
