import { body } from 'express-validator'
import mongoose from 'mongoose'

export const markLessonCompleteValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid courseId'),

  body('lessonId')
    .notEmpty()
    .withMessage('lessonId is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid lessonId')
]
