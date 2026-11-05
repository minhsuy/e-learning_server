import { body, param, query } from 'express-validator'
import { CourseLevel, CourseStatus, CourseType } from '~/types/enum'
import { isValidUUID, validateUUIDParam } from '~/utils/uuid'

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

  body('category')
    .optional({ checkFalsy: true })
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid category id'),

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

  query('category')
    .optional()
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid category id'),
  query('level').optional().isIn(Object.values(CourseLevel)),
  query('type').optional().isIn(Object.values(CourseType)),

  query('priceMin').optional().isFloat({ min: 0 }).toFloat(),
  query('priceMax').optional().isFloat({ min: 0 }).toFloat(),

  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('minRating must be a number between 0 and 5')
    .toFloat(),
  query('durationRange')
    .optional()
    .isIn(['lt-5', '5-15', 'gt-15'])
    .withMessage('durationRange must be lt-5, 5-15, or gt-15'),
  query('durationMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('durationMin must be >= 0')
    .toFloat(),
  query('durationMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('durationMax must be >= 0')
    .toFloat(),

  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),

  // riêng cho admin
  query('status').optional().isIn(Object.values(CourseStatus)),
  query('author')
    .optional()
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid author id'),
  query('_destroy').optional().isBoolean().toBoolean()
]

export const updateCourseValidator = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom(validateUUIDParam)
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

  body('category')
    .optional({ checkFalsy: true })
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid category id'),

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
    .custom(validateUUIDParam)
    .withMessage('Invalid course ID')
]

export const updateCourseByAdminValidator = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom(validateUUIDParam)
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

  body('category')
    .optional({ checkFalsy: true })
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid category id'),

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

export const updateCourseStatusValidator = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid course ID'),

  body('status')
    .notEmpty()
    .withMessage('Course status is required')
    .isIn(Object.values(CourseStatus))
    .withMessage('Invalid course status'),

  body('rejectionReason')
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .withMessage('Rejection reason must be a string'),

  body('reason')
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .withMessage('Reason must be a string')
]

