import { body, param, query } from 'express-validator'
import mongoose, { Types } from 'mongoose'
import CommentModel from '~/models/comment.model'

export const createCommentValidator = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 6, max: 500 })
    .withMessage('Comment must be between 6 and 500 characters'),

  body('lesson')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid lesson ID'),

  body('course')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid course ID'),

  body('parentId')
    .optional({ checkFalsy: true })
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) throw new Error('Invalid parent ID')
      const parent = await CommentModel.findById(value)
      if (!parent) throw new Error('Parent comment not found')
      return true
    })
]

export const lessonIdValidator = [
  param('lessonId')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid lesson ID')
]
export const commentIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Comment ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Comment ID')
]
export const courseIdValidator = [
  query('courseId')
    .optional()
    .custom((value) => value && Types.ObjectId.isValid(value))
    .withMessage('Invalid courseId format')
]
export const getCommentsQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('courseId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
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
