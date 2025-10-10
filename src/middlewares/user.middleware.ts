import { body, param, query } from 'express-validator'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import UserModel from '~/models/user.model'
import { UserRole } from '~/types/enum'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()
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
    .withMessage('Invalid email format')
    .custom(async (email) => {
      const existingUser = await UserModel.findOne({ email })
      if (existingUser) {
        throw new Error('Email already in use')
      }
      return true
    }),

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

  body('bio').optional().isLength({ max: 200 }).withMessage('Bio must not exceed 200 characters'),

  body('role').optional().isIn(Object.values(UserRole)).withMessage('Invalid role')
]

export const finalRegisterValidator = [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
    .isString()
    .withMessage('Token must be a string')
    .custom(async (token) => {
      const secret = process.env.JWT_SECRET_VERIFIED_EMAIL as string
      try {
        jwt.verify(token, secret)
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          const decoded = jwt.decode(token) as { userId?: string }
          if (decoded?.userId) {
            await UserModel.findByIdAndDelete(decoded.userId)
          }
          throw new Error('Token expired, user deleted')
        }
        throw new Error('Invalid token')
      }
      return true
    })
]

export const loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(async (email) => {
      const user = await UserModel.findOne({ email })
      if (!user) {
        throw new Error('Email không tồn tại')
      }
      if (user.isVerified !== '') {
        throw new Error('Vui lòng xác thực email trước khi đăng nhập')
      }
      return true
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
]

export const forgotPasswordValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .custom(async (value) => {
      const user = await UserModel.findOne({ email: value })
      if (!user) {
        throw new Error('Email not found')
      }
    })
]

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

export const updateMeValidator = [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),

  body('phone').optional().isMobilePhone('vi-VN').withMessage('Invalid phone number'),

  body('bio').optional().isLength({ max: 200 }).withMessage('Bio must not exceed 200 characters'),

  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),

  body('socialLinks.facebook').optional().isURL().withMessage('Facebook link must be a valid URL'),

  body('socialLinks.instagram').optional().isURL().withMessage('Instagram link must be a valid URL'),

  body('socialLinks.github').optional().isURL().withMessage('Github link must be a valid URL')
]
export const listTeachersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string')
]

export const userIdValidator = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid User ID')
]
