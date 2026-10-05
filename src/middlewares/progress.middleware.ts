import { body, param } from 'express-validator'
import { isValidUUID, validateUUIDParam } from '~/utils/uuid'

export const markLessonCompleteValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid courseId'),

  body('lessonId')
    .notEmpty()
    .withMessage('lessonId is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid lessonId')
]

export const progressCourseIdValidator = [
  param('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid courseId')
]
