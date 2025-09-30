import express, { Request, Response } from 'express'
import {
  createLessonController,
  deleteLessonController,
  getLessonsByChapterController,
  updateLessonController
} from '~/controller/lesson.controller'
import { courseIdValidator } from '~/middlewares/course.middleware'
import { chapterIdValidator, createLessonValidator, updateLessonValidator } from '~/middlewares/lesson.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin, isTeacherOrAdmin } from '~/middlewares/verifyRole'
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
  chapterIdValidator,
  handleValidationErrors,
  deleteLessonController
)

// get lesson by chapter
lessonRouter.get('/chapter/:chapterId', chapterIdValidator, handleValidationErrors, getLessonsByChapterController)
export default lessonRouter
