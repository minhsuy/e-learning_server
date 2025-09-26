import express, { Request, Response } from 'express'
import {
  createCourseByTeacherController,
  deleteCourseByTeacherController,
  getCoursesByTeacherController,
  updateCourseByTeacherController
} from '~/controller/teacher.controller'
import {
  courseIdValidator,
  createCourseValidator,
  listPublicCoursesValidator,
  updateCourseValidator
} from '~/middlewares/course.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacher } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const teacherRouter = express.Router()

// Create new course

teacherRouter.post(
  '/courses/',
  verifyAccessToken,
  isTeacher,
  createCourseValidator,
  handleValidationErrors,
  createCourseByTeacherController
)

// Update course (Teacher)
teacherRouter.put(
  '/courses/:id',
  verifyAccessToken,
  isTeacher,
  updateCourseValidator,
  handleValidationErrors,
  updateCourseByTeacherController
)

// Delete course (Teacher)
teacherRouter.delete(
  'courses//:id',
  verifyAccessToken,
  isTeacher,
  courseIdValidator,
  handleValidationErrors,
  deleteCourseByTeacherController
)

// Get list course by teacher
teacherRouter.get(
  '/courses/',
  verifyAccessToken,
  isTeacher,
  listPublicCoursesValidator,
  handleValidationErrors,
  getCoursesByTeacherController
)

export default teacherRouter
