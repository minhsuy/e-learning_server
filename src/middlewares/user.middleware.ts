import { body, param, query } from 'express-validator'
import dotenv from 'dotenv'
import { isValidUUID } from '~/utils/uuid'

dotenv.config()

// REGISTER VALIDATOR (Public Registration)
export const registerValidator = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .isLength({ min: 6 })
    .withMessage('Confirm password must be at least 6 characters long')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    }),

  body('phone').optional().isMobilePhone('vi-VN').withMessage('Invalid phone number'),

  body('bio').optional().isLength({ max: 200 }).withMessage('Bio must not exceed 200 characters')
]

// VERIFY OTP VALIDATOR
export const verifyOtpValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('otp')
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải đúng 6 số')
    .isNumeric()
    .withMessage('Mã OTP chỉ chứa số')
]

// LOGIN VALIDATOR (Syntactic checks only; DB lookups moved to Service)
export const loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
]

// FORGOT PASSWORD VALIDATOR
export const forgotPasswordValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
]

// RESET PASSWORD VALIDATOR
export const resetPasswordValidator = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .isLength({ min: 6 })
    .withMessage('Confirm password must be at least 6 characters long')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    })
]

// CHANGE PASSWORD VALIDATOR
export const changePasswordValidator = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Old password is required')
    .isLength({ min: 6 })
    .withMessage('Old password must be at least 6 characters long'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .isLength({ min: 6 })
    .withMessage('Confirm password must be at least 6 characters long')
    .custom((confirmPassword, { req }) => {
      if (confirmPassword !== req.body.password) {
        throw new Error('Passwords do not match')
      }
      return true
    })
]

// UPDATE ME VALIDATOR
export const updateMeValidator = [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),

  body('phone').optional().isMobilePhone('vi-VN').withMessage('Invalid phone number'),

  body('bio').optional().isLength({ max: 200 }).withMessage('Bio must not exceed 200 characters'),

  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),

  body('socialLinks.facebook').optional().isURL().withMessage('Facebook link must be a valid URL'),

  body('socialLinks.instagram').optional().isURL().withMessage('Instagram link must be a valid URL'),

  body('socialLinks.github').optional().isURL().withMessage('Github link must be a valid URL')
]

// LIST TEACHERS VALIDATOR
export const listTeachersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string')
]

// USER ID PARAM VALIDATOR
export const userIdValidator = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid User ID')
]

// REFRESH TOKEN VALIDATOR
export const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string')
]

// GOOGLE LOGIN VALIDATOR
export const googleLoginValidator = [
  body().custom((_, { req }) => {
    const candidate =
      req.body?.idToken ||
      req.body?.id_token ||
      req.body?.credential ||
      req.body?.token ||
      req.body?.code ||
      req.body?.accessToken ||
      req.body?.access_token

    if (!candidate || typeof candidate !== 'string' || candidate.trim() === '') {
      throw new Error('Google credential (idToken / credential / code / accessToken) is required')
    }
    return true
  })
]
