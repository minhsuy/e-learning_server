import { body, param, query } from 'express-validator'
import mongoose from 'mongoose'
import { CourseLevel, CourseStatus, CourseType } from '~/types/enum'

export const createCourseValidator = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3 })
    .withMessage('Slug must be at least 3 characters'),

  body('image').optional({ checkFalsy: true }).isURL().withMessage('Image must be a valid URL'),
  body('intro_url').optional({ checkFalsy: true }).isURL().withMessage('Intro URL must be a valid URL'),
  body('description').optional({ checkFalsy: true }).trim(),

  body('category').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid category id'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(CourseType)).withMessage('Invalid course type'),
  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('old_price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Old price must be >= 0'),

  body('level').optional({ checkFalsy: true }).isIn(Object.values(CourseLevel)).withMessage('Invalid course level'),

  // info.*
  body('info.requirements').optional({ checkFalsy: true }).isArray().withMessage('requirements must be array'),
  body('info.benefits').optional({ checkFalsy: true }).isArray().withMessage('benefits must be array'),
  body('info.qa').optional({ checkFalsy: true }).isArray().withMessage('qa must be array'),

  body('view').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('View must be >= 0'),
  body('sold').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Sold must be >= 0'),
  // dangerous
  body('status').not().exists().withMessage('status cannot be set here'),
  body('_destroy').not().exists(),
  body('rating').not().exists(),
  body('author').not().exists()
]

export const listPublicCoursesValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  query('search').optional().trim(),

  query('category').optional().isMongoId(),
  query('level').optional().isIn(Object.values(CourseLevel)),
  query('type').optional().isIn(Object.values(CourseType)),

  query('priceMin').optional().isFloat({ min: 0 }).toFloat(),
  query('priceMax').optional().isFloat({ min: 0 }).toFloat(),

  query('sortBy').optional().isString(),

  // riêng cho admin
  query('status').optional().isIn(Object.values(CourseStatus)),
  query('author').optional().isMongoId(),
  query('_destroy').optional().isBoolean().toBoolean()
]

export const updateCourseValidator = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid course ID'),

  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters'),

  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3 })
    .withMessage('Slug must be at least 3 characters'),

  body('image').optional({ checkFalsy: true }).isURL().withMessage('Image must be a valid URL'),

  body('intro_url').optional({ checkFalsy: true }).isURL().withMessage('Intro URL must be a valid URL'),

  body('description').optional({ checkFalsy: true }).trim(),

  body('category').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid category id'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(CourseType)).withMessage('Invalid course type'),

  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be >= 0'),

  body('old_price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Old price must be >= 0'),

  body('level').optional({ checkFalsy: true }).isIn(Object.values(CourseLevel)).withMessage('Invalid course level'),

  // info.*
  body('info.requirements').optional({ checkFalsy: true }).isArray().withMessage('requirements must be array'),

  body('info.benefits').optional({ checkFalsy: true }).isArray().withMessage('benefits must be array'),

  body('info.qa').optional({ checkFalsy: true }).isArray().withMessage('qa must be array'),
  body('view').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('View must be >= 0'),
  body('sold').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Sold must be >= 0'),

  // dangerous
  body('status').not().exists().withMessage('status cannot be set here'),
  body('_destroy').not().exists(),
  body('rating').not().exists(),
  body('author').not().exists()
]

export const courseIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid course ID')
]

export const updateCourseByAdminValidator = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid course ID'),

  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters'),

  body('slug')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3 })
    .withMessage('Slug must be at least 3 characters'),

  body('image').optional({ checkFalsy: true }).isURL().withMessage('Image must be a valid URL'),

  body('intro_url').optional({ checkFalsy: true }).isURL().withMessage('Intro URL must be a valid URL'),

  body('description').optional({ checkFalsy: true }).trim(),

  body('category').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid category id'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(CourseType)).withMessage('Invalid course type'),

  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be >= 0'),

  body('old_price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Old price must be >= 0'),

  body('level').optional({ checkFalsy: true }).isIn(Object.values(CourseLevel)).withMessage('Invalid course level'),

  // info.*
  body('info.requirements').optional({ checkFalsy: true }).isArray().withMessage('requirements must be array'),

  body('info.benefits').optional({ checkFalsy: true }).isArray().withMessage('benefits must be array'),

  body('info.qa').optional({ checkFalsy: true }).isArray().withMessage('qa must be array'),
  body('view').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('View must be >= 0'),
  body('sold').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Sold must be >= 0'),

  body('status').optional({ checkFalsy: true }).isIn(Object.values(CourseStatus)).withMessage('Invalid course status'),
  body('_destroy').optional().isBoolean().withMessage('Invalid _destroy value').toBoolean(),
  // dangerous
  body('rating').not().exists(),
  body('author').not().exists()
]
