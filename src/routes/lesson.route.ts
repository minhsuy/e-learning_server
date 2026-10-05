import express from 'express'
import {
  createLessonController,
  deleteLessonController,
  getLessonsByChapterController,
  updateLessonController
} from '~/controller/lesson.controller'
import {
  chapterIdValidator,
  createLessonValidator,
  lessonIdValidator,
  updateLessonValidator
} from '~/middlewares/lesson.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const lessonRouter = express.Router()

// CREATE LESSON : POST /api/lessons
lessonRouter.post(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  createLessonValidator,
  handleValidationErrors,
  createLessonController
)

// UPDATE LESSON : PUT /api/lessons/:id
lessonRouter.put(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  updateLessonValidator,
  handleValidationErrors,
  updateLessonController
)

// DELETE LESSON : DELETE /api/lessons/:id
lessonRouter.delete(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  handleValidationErrors,
  deleteLessonController
)

// GET LESSON BY CHAPTER
lessonRouter.get('/chapter/:chapterId', chapterIdValidator, handleValidationErrors, getLessonsByChapterController)

export default lessonRouter
