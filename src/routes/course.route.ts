import express from 'express'
import { getCourseDetailPublicController, getListCoursesController } from '~/controller/course.controller'
import { listPublicCoursesValidator } from '~/middlewares/course.middleware'
import { handleValidationErrors } from '~/middlewares/validate'

const courseRouter = express.Router()

// Course detail GET /api/courses/:slug
courseRouter.get('/:slug', getCourseDetailPublicController)

// List course GET /api/courses

courseRouter.get('/', listPublicCoursesValidator, handleValidationErrors, getListCoursesController)

export default courseRouter
