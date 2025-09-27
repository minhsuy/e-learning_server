import { body, param } from 'express-validator'
import mongoose from 'mongoose'

export const createChapterValidator = [
  param('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid course ID'),

  body('title')
    .notEmpty()
    .withMessage('Chapter title is required')
    .isLength({ min: 3 })
    .withMessage('Chapter title must be at least 3 characters'),

  body('order').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Order must be a positive integer')
]

export const updateChapterValidator = [
  param('id')
    .notEmpty()
    .withMessage('Chapter ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Chapter ID'),

  body('title').optional({ checkFalsy: true }).isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),

  body('order').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Order must be a positive integer'),

  body('_destroy').optional().isBoolean().withMessage('_destroy must be true/false')
]
