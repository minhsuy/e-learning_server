import { body, param, query } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

export const createCommentValidator = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 6, max: 500 })
    .withMessage('Comment must be between 6 and 500 characters'),

  body('lesson')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid lesson ID'),

  body('course')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid course ID'),

  body('parentId')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!isValidUUID(value)) throw new Error('Invalid parent ID')
      return true
    })
]

export const lessonIdValidator = [
  param('lessonId')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid lesson ID')
]

export const commentIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Comment ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Comment ID')
]

export const commentIdParamValidator = [
  param('commentId')
    .notEmpty()
    .withMessage('Comment ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Comment ID')
]

export const courseIdValidator = [
  query('courseId')
    .optional()
    .custom((value) => !value || isValidUUID(value))
    .withMessage('Invalid courseId format')
]

export const getCommentsQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status')
    .optional()
    .custom((value) => {
      const allowed = ['active', 'inactive', 'approved', 'pending', 'rejected', 'APPROVED', 'PENDING', 'REJECTED']
      if (!allowed.includes(value)) {
        throw new Error('Invalid status')
      }
      return true
    }),
  query('courseId')
    .optional()
    .custom((value) => {
      if (value && !isValidUUID(value)) {
        throw new Error('Invalid courseId format')
      }
      return true
    })
    .withMessage('Invalid courseId format')
]

export const updateCommentValidator = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 3 })
    .withMessage('Content must be at least 3 characters long')
]
