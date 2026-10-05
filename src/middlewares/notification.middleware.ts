import { param, query } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — NOTIFICATION VALIDATION MIDDLEWARE
 * 
 * Validates request parameters and queries for notification endpoints.
 * Pure syntactic validation — zero database queries.
 */

const VALID_NOTIFICATION_TYPES = [
  'COMMENT',
  'RATING',
  'ORDER',
  'MESSAGE',
  'SYSTEM',
  'COURSE',
  'LESSON',
  'COMMENT_REPLY',
  'QUIZ',
  'comment',
  'rating',
  'order',
  'message',
  'system',
  'course',
  'lesson',
  'comment_reply',
  'quiz'
]

export const notificationIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Notification ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Notification ID')
]

export const getNotificationsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer'),
  query('type')
    .optional()
    .isIn(VALID_NOTIFICATION_TYPES)
    .withMessage('Invalid notification type')
]
