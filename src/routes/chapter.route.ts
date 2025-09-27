import express from 'express'
import {
  createChapterController,
  deleteChapterController,
  getChaptersByCourseController,
  updateChapterController
} from '~/controller/chapter.controller'
import { createChapterValidator, updateChapterValidator } from '~/middlewares/chapter.middleware'
import { courseIdValidator } from '~/middlewares/course.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin, isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const chapterRouter = express.Router()

// CREATE CHAPTER : POST /api/chapters/:courseId
chapterRouter.post(
  '/:courseId',
  verifyAccessToken,
  isTeacherOrAdmin,
  createChapterValidator,
  handleValidationErrors,
  createChapterController
)

// UPDATE CHAPTER : PUT /api/chapters/:chapterId
chapterRouter.put(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  updateChapterValidator,
  handleValidationErrors,
  updateChapterController
)

// DELETE CHAPTER : DELETE /api/chapters/:chapterId
chapterRouter.delete(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  courseIdValidator,
  handleValidationErrors,
  deleteChapterController
)

//
// GET LIST CHAPTERS BY COURSE ID : GET /api/chapters/course/:courseId
chapterRouter.get(
  '/course/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  courseIdValidator,
  handleValidationErrors,
  getChaptersByCourseController
)

export default chapterRouter
