import express from 'express'
import { getCourseDetailPublicController, getListCoursesController } from '~/controller/course.controller'
import { listPublicCoursesValidator } from '~/middlewares/course.middleware'
import { handleValidationErrors } from '~/middlewares/validate'

const courseRouter = express.Router()

// Course detail
courseRouter.get('/:slug', getCourseDetailPublicController)

// List course

courseRouter.get('/', listPublicCoursesValidator, handleValidationErrors, getListCoursesController)

export default courseRouter
