import { body, param, query } from 'express-validator'
import { UserRole, UserStatus } from '~/types/enum'

export const getAllUsersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('role')
    .optional({ checkFalsy: true, nullable: true })
    .customSanitizer((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
    .isIn(Object.values(UserRole))
    .withMessage('Invalid role'),

  query('status')
    .optional({ checkFalsy: true, nullable: true })
    .customSanitizer((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
    .isIn(Object.values(UserStatus))
    .withMessage('Invalid status'),

  query('sortBy')
    .optional({ checkFalsy: true, nullable: true })
    .trim()
    .isIn(['createdAt', 'username', 'email'])
    .withMessage('Invalid sort field')
]
export const getUserDetailValidator = [param('id').isMongoId().withMessage('Invalid user id')]

export const updateUserByAdminValidator = [
  param('id').isMongoId().withMessage('Invalid user id'),

  body('email').not().exists().withMessage('Email cannot be updated here'),
  body('password').not().exists().withMessage('Password cannot be updated here'),
  body('refresh_token').not().exists().withMessage('Not allowed'),
  body('reset_password_token').not().exists().withMessage('Not allowed'),
  body('reset_password_expires').not().exists().withMessage('Not allowed'),

  body('username')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('role').optional({ nullable: true, checkFalsy: true }).isIn(Object.values(UserRole)).withMessage('Invalid role'),

  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(Object.values(UserStatus))
    .withMessage('Invalid status'),

  body('phone').optional({ nullable: true, checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),

  body('bio')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Bio must not exceed 200 characters'),

  body('avatar').optional({ nullable: true, checkFalsy: true }).isURL().withMessage('Avatar must be a valid URL'),

  body('socialLinks.facebook')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Facebook link must be a valid URL'),

  body('socialLinks.instagram')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Instagram link must be a valid URL'),

  body('socialLinks.github')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Github link must be a valid URL'),

  body().custom((value) => {
    const allowed = ['username', 'role', 'status', 'phone', 'bio', 'avatar', 'socialLinks']
    const hasAny = Object.keys(value || {}).some((k) => allowed.includes(k))
    if (!hasAny) {
      throw new Error('At least one updatable field is required')
    }
    return true
  })
]

export const createTeacherValidator = [
  body('role').not().exists().withMessage('Role is not allowed. This endpoint only creates teachers'),

  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),

  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

  body('confirm_password')
    .isLength({ min: 8 })
    .withMessage('Confirm password must be at least 8 characters long')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),
  body('phone').optional({ nullable: true, checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),

  body('bio')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('Bio must not exceed 200 characters'),

  body('avatar').optional({ nullable: true, checkFalsy: true }).isURL().withMessage('Avatar must be a valid URL'),

  body('socialLinks.facebook')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Facebook link must be a valid URL'),

  body('socialLinks.instagram')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Instagram link must be a valid URL'),

  body('socialLinks.github')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Github link must be a valid URL')
]
