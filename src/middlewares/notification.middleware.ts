import { param, query } from 'express-validator'
import mongoose from 'mongoose'

export const notificationIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Notification ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Notification ID')
]

export const getNotificationsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  query('type').optional().isIn(['system', 'order', 'comment', 'rating', 'message']).withMessage('Invalid type')
]
