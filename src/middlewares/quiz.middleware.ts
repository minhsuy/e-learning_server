import { body, param } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

export const createQuizValidator = [
  body('lesson')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Lesson ID'),
  body('title').notEmpty().withMessage('Quiz title is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('passing_grade').optional().isNumeric().withMessage('Passing grade must be a number'),
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Course ID')
]

export const updateQuizValidator = [
  param('quizId')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Quiz ID'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('passing_grade').optional().isNumeric().withMessage('Passing grade must be a number')
]

export const quizIdValidator = [
  param('quizId')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid quiz ID')
]

export const lessonIdValidator = [
  param('lessonId')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid lesson ID')
]
