import express from 'express'
import {
  getMyEnrollmentsController,
  getStudentsByCourseController,
  removeStudentFromCourseController
} from '~/controller/enrollment.controller'
import { courseIdValidator } from '~/middlewares/course.middleware'
import { userIdValidator } from '~/middlewares/user.middleware'

import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const enrollmentRouter = express.Router()

// get my enrollments : GET /api/enrollments/my
enrollmentRouter.get('/my', verifyAccessToken, getMyEnrollmentsController)

// Get students in a specific course (Teacher or Admin) : GET /api/enrollments/course/:courseId   id (courseId)
enrollmentRouter.get(
  '/course/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  courseIdValidator,
  handleValidationErrors,
  getStudentsByCourseController
)
// DELETE - kick a student from a course (Teacher/Admin)    id (courseId)
enrollmentRouter.delete(
  '/course/:id/:userId',
  verifyAccessToken,
  isTeacherOrAdmin,
  courseIdValidator,
  userIdValidator,
  handleValidationErrors,
  removeStudentFromCourseController
)

export default enrollmentRouter
