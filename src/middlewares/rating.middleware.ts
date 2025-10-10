import { body, param, query } from 'express-validator'
import mongoose from 'mongoose'
import { ERatingStatus } from '~/types/enum'

export const createNewRatingValidator = [
  body('courseId').notEmpty().withMessage('Course ID is required').isMongoId().withMessage('Invalid Course ID'),
  body('rate')
    .notEmpty()
    .withMessage('Rate is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rate must be between 1 and 5'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Content max length is 500 characters')
]
export const queryRatingValidator = [
  query('courseId')
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid courseId'),
  query('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer')
]
export const ratingIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Rating ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Rating ID')
]
export const updateRatingStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(ERatingStatus))
    .withMessage('Invalid status value')
]
