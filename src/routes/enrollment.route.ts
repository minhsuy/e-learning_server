import express from 'express'
import {
  getMyEnrollmentsController,
  getStudentProgressByEnrollmentIdController,
  getStudentProgressInCourseController,
  getStudentsByCourseController,
  removeStudentFromCourseController
} from '~/controller/enrollment.controller'
import { courseIdValidator } from '~/middlewares/course.middleware'
import { userIdValidator } from '~/middlewares/user.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { validateRouteUUIDParam } from '~/utils/uuid'

const enrollmentRouter = express.Router()

// get my enrollments : GET /api/enrollments/my
enrollmentRouter.get('/my', verifyAccessToken, getMyEnrollmentsController)

// Get students in a specific course (Teacher or Admin) : GET /api/enrollments/course/:id   id (courseId)
enrollmentRouter.get(
  '/course/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  courseIdValidator,
  handleValidationErrors,
  getStudentsByCourseController
)

// Get detailed student learning progress in a course (Teacher or Admin) : GET /api/enrollments/course/:courseId/students/:userId/progress
enrollmentRouter.get(
  '/course/:courseId/students/:userId/progress',
  verifyAccessToken,
  isTeacherOrAdmin,
  validateRouteUUIDParam('courseId'),
  validateRouteUUIDParam('userId'),
  handleValidationErrors,
  getStudentProgressInCourseController
)

// Get detailed student learning progress by enrollment ID (Teacher or Admin) : GET /api/enrollments/:enrollmentId/progress
enrollmentRouter.get(
  '/:enrollmentId/progress',
  verifyAccessToken,
  isTeacherOrAdmin,
  validateRouteUUIDParam('enrollmentId'),
  handleValidationErrors,
  getStudentProgressByEnrollmentIdController
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
