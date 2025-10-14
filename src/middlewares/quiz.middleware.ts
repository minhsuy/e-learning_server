import { body, param } from 'express-validator'
import { Types } from 'mongoose'

export const createQuizValidator = [
  body('lesson')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('Invalid Lesson ID'),
  body('title').notEmpty().withMessage('Quiz title is required'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('passing_grade').optional().isNumeric().withMessage('Passing grade must be a number')
]

export const updateQuizValidator = [
  param('quizId')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .custom((value) => Types.ObjectId.isValid(value))
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
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('Invalid quiz ID')
]
