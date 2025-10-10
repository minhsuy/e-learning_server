import express from 'express'
import {
  createCommentController,
  deleteCommentByAdminOrTeacherController,
  deleteCommentController,
  dislikeCommentController,
  getCommentsByAdminOrTeacherController,
  getCommentsByLessonController,
  likeCommentController,
  updateCommentController
} from '~/controller/comment.controller'
import {
  commentIdValidator,
  createCommentValidator,
  getCommentsQueryValidator,
  lessonIdValidator,
  updateCommentValidator
} from '~/middlewares/comment.middleware'

import { courseIdValidator } from '~/middlewares/course.middleware'
import { userIdValidator } from '~/middlewares/user.middleware'

import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin, isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const commentRouter = express.Router()
// CREATE COMMENT : POST /api/comments
commentRouter.post('/', verifyAccessToken, createCommentValidator, handleValidationErrors, createCommentController)
// GET COMMENTS BY LESSON : GET /api/comments/lesson/:lessonId
commentRouter.get('/lesson/:lessonId', lessonIdValidator, handleValidationErrors, getCommentsByLessonController)

// DELETE COMMENT : DELETE /api/comments/:id (user)
commentRouter.delete('/:id', verifyAccessToken, commentIdValidator, handleValidationErrors, deleteCommentController)
// UPDATE COMMENT : PUT /api/comments/:id
commentRouter.put(
  '/:id',
  verifyAccessToken,
  commentIdValidator,
  updateCommentValidator,
  handleValidationErrors,
  updateCommentController
)
// Like comment : POST /api/comments/:commentId/like
commentRouter.post('/like/:commentId', verifyAccessToken, likeCommentController)

// Dislike comment : POST /api/comments/:commentId/dislike
commentRouter.post('/dislike/:commentId', verifyAccessToken, dislikeCommentController)
// GET COMMENTS (Admin / Teacher) : GET /api/comments
commentRouter.get(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  getCommentsQueryValidator,
  handleValidationErrors,
  getCommentsByAdminOrTeacherController
)
// DELETE COMMENT BY ADMIN : DELETE /api/admin/comments/:id
commentRouter.delete(
  '/admin/:id',
  verifyAccessToken,
  isAdmin,
  commentIdValidator,
  handleValidationErrors,
  deleteCommentByAdminOrTeacherController
)

// DELETE COMMENT BY TEACHER : DELETE /api/teacher/comments/:id
commentRouter.delete(
  '/teacher/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  commentIdValidator,
  handleValidationErrors,
  deleteCommentByAdminOrTeacherController
)
export default commentRouter
