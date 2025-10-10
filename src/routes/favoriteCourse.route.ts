import express from 'express'
import {
  addFavoriteController,
  getFavoritesController,
  removeFavoriteController
} from '~/controller/favoriteCourse.controller'
import { courseIdValidator } from '~/middlewares/course.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const favoriteCourseRouter = express.Router()
// POST /api/favorites/:courseId -> add favorite
favoriteCourseRouter.post('/:id', verifyAccessToken, courseIdValidator, handleValidationErrors, addFavoriteController)

// DELETE /api/favorites/:courseId -> remove favorite
favoriteCourseRouter.delete(
  '/:id',
  verifyAccessToken,
  courseIdValidator,
  handleValidationErrors,
  removeFavoriteController
)
// GET /api/favorites
favoriteCourseRouter.get('/', verifyAccessToken, handleValidationErrors, getFavoritesController)

export default favoriteCourseRouter
