import { body, param } from 'express-validator'
import { Types } from 'mongoose'

export const createQuestionValidator = [
  body('quiz')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('Invalid Quiz ID'),
  body('type')
    .notEmpty()
    .withMessage('Question type is required')
    .isIn(['multiple_choice', 'fill_in_blank'])
    .withMessage('Invalid question type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('options').optional().isArray().withMessage('Options must be an array of strings'),
  body('answer').notEmpty().withMessage('Answer is required')
]
export const updateQuestionValidator = [
  param('questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('Invalid Question ID'),
  body('title').optional().isString(),
  body('options').optional().isArray(),
  body('answer').optional().isString(),
  body('points').optional().isNumeric(),
  body('type').optional().isIn(['multiple_choice', 'fill_in_blank'])
]

export const questionIdValidator = [
  param('questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('Invalid Question ID')
]
