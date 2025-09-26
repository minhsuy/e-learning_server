import { body, param, query } from 'express-validator'
import mongoose from 'mongoose'
import CategoryModel from '~/models/category.model'
import { handleValidationErrors } from './validate'

export const createCategoryValidator = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2 })
    .withMessage('Category name must be at least 2 characters')
    .custom(async (value) => {
      const exists = await CategoryModel.findOne({ name: value })
      if (exists) {
        throw new Error('Category name already exists')
      }
      return true
    }),

  body('slug').optional({ checkFalsy: true }).isSlug().withMessage('Slug must be valid (kebab-case)'),

  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
]

export const updateCategoryValidator = [
  param('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Category ID'),

  body('name')
    .optional({ checkFalsy: true })
    .isLength({ min: 2 })
    .withMessage('Category name must be at least 2 characters')
    .custom(async (value, { req }) => {
      const exists = await CategoryModel.findOne({ name: value })
      if (exists) {
        throw new Error('Category name already exists')
      }
      return true
    }),

  body('slug').optional({ checkFalsy: true }).isSlug().withMessage('Slug must be valid (kebab-case)'),

  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),

  body('_destroy').optional().isBoolean().withMessage('_destroy must be true/false')
]

// list categories (optional: pagination)
export const listCategoriesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim()
]

export const getCategoryDetailValidator = [param('slug').notEmpty().withMessage('Category slug is required')]
