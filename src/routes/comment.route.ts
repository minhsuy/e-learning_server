import express from 'express'
import {
  createCommentController,
  deleteCommentByAdminOrTeacherController,
  deleteCommentController,
  dislikeCommentController,
  getCommentsByAdminOrTeacherController,
  getCommentsByLessonController,
  likeCommentController,
  updateCommentController,
  updateCommentStatusController
} from '~/controller/comment.controller'
import {
  commentIdParamValidator,
  commentIdValidator,
  createCommentValidator,
  getCommentsQueryValidator,
  lessonIdValidator,
  updateCommentStatusValidator,
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
commentRouter.post(
  '/like/:commentId',
  verifyAccessToken,
  commentIdParamValidator,
  handleValidationErrors,
  likeCommentController
)

// Dislike comment : POST /api/comments/:commentId/dislike
commentRouter.post(
  '/dislike/:commentId',
  verifyAccessToken,
  commentIdParamValidator,
  handleValidationErrors,
  dislikeCommentController
)
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

// UPDATE COMMENT STATUS BY ADMIN : PATCH /api/comments/admin/:id/status
commentRouter.patch(
  '/admin/:id/status',
  verifyAccessToken,
  isAdmin,
  updateCommentStatusValidator,
  handleValidationErrors,
  updateCommentStatusController
)

export default commentRouter
