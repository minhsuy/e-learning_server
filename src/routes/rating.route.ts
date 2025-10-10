import express from 'express'
import {
  createNewRatingController,
  deleteRatingController,
  getCourseRatingsController,
  getRatingsForAdminOrTeacherController,
  updateRatingStatusController
} from '~/controller/raing.controller'
import { courseIdValidator } from '~/middlewares/course.middleware'
import {
  createNewRatingValidator,
  queryRatingValidator,
  ratingIdValidator,
  updateRatingStatusValidator
} from '~/middlewares/rating.middleware'

import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const ratingRouter = express.Router()

// Create a new rating for course : POSt : /api/ratings
ratingRouter.post('/', verifyAccessToken, createNewRatingValidator, handleValidationErrors, createNewRatingController)

// GET /api/ratings/course/:courseId -> get all ratings of a course
ratingRouter.get('/course/:id', courseIdValidator, handleValidationErrors, getCourseRatingsController)
// GET /api/ratings/manage -> get all ratings for admin or teacher
ratingRouter.get(
  '/manage/',
  verifyAccessToken,
  isTeacherOrAdmin,
  queryRatingValidator,
  handleValidationErrors,
  getRatingsForAdminOrTeacherController
)
// DELETE /api/ratings/manage/:id  (Teacher/Admin)
ratingRouter.delete(
  '/manage/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  ratingIdValidator,
  handleValidationErrors,
  deleteRatingController
)
// PATCH /api/ratings/manage/:id (Teacher/Admin)
ratingRouter.put(
  '/manage/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  ratingIdValidator,
  updateRatingStatusValidator,
  handleValidationErrors,
  updateRatingStatusController
)
export default ratingRouter
