import { body, param } from 'express-validator'
import mongoose from 'mongoose'
import { LessonType } from '~/types/enum'

export const createLessonValidator = [
  body('title')
    .notEmpty()
    .withMessage('Lesson title is required')
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters'),

  body('slug').optional({ checkFalsy: true }).isSlug().withMessage('Slug must be valid (kebab-case)'),

  body('chapter')
    .notEmpty()
    .withMessage('Chapter ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Chapter ID'),

  body('course')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Course ID'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(LessonType)).withMessage('Invalid lesson type'),

  body('duration').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Duration must be >= 0'),

  body('content').optional({ checkFalsy: true }).isString(),

  body('videoUrl').optional({ checkFalsy: true }).isURL().withMessage('Video URL must be valid'),

  body('isDemo').optional().isBoolean().withMessage('isDemo must be true/false')
]
export const updateLessonValidator = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Lesson ID'),

  body('title').optional({ checkFalsy: true }).isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(LessonType)).withMessage('Invalid lesson type'),

  body('duration').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Duration must be >= 0'),

  body('content').optional({ checkFalsy: true }).isString(),

  body('videoUrl').optional({ checkFalsy: true }).isURL().withMessage('Video URL must be valid'),

  body('isDemo').optional().isBoolean().withMessage('isDemo must be true/false')
]
export const chapterIdValidator = [
  param('chapterId')
    .notEmpty()
    .withMessage('Chapter ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Chapter ID')
]
