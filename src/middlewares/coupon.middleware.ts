import { body, param, query } from 'express-validator'
import mongoose from 'mongoose'
import CouponModel from '~/models/coupon.model'
import { ECouponType } from '~/types/enum'

export const createCouponValidator = [
  body('title').notEmpty().withMessage('Title is required'),

  body('code')
    .notEmpty()
    .withMessage('Coupon code is required')
    .custom(async (value) => {
      const exists = await CouponModel.findOne({ code: value })
      if (exists) throw new Error('Coupon code already exists')
      return true
    }),

  body('value').isFloat({ min: 1 }).withMessage('Value must be a positive number'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(ECouponType)).withMessage('Invalid coupon type'),

  body('limit').optional().isInt({ min: 1 }).withMessage('Limit must be at least 1'),

  body('startDate').optional().isISO8601().toDate(),
  body('endDate').optional().isISO8601().toDate(),

  body('courses').optional().isArray().withMessage('Courses must be an array of course IDs')
]
export const updateCouponValidator = [
  param('id')
    .notEmpty()
    .withMessage('Coupon ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Coupon ID'),

  body('title').optional().isLength({ min: 2 }).withMessage('Title must be at least 2 characters'),

  body('code').optional().isLength({ min: 3 }).withMessage('Code must be at least 3 characters'),

  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be >= 0'),

  body('limit').optional().isInt({ min: 0 }).withMessage('Limit must be >= 0'),

  body('startDate').optional().isISO8601().toDate().withMessage('Invalid startDate'),

  body('endDate').optional().isISO8601().toDate().withMessage('Invalid endDate'),

  body('courses').optional().isArray().withMessage('Courses must be array of course IDs'),

  body('active').optional().isBoolean().withMessage('Active must be true/false')
]
export const couponIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Coupon ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Coupon ID')
]
export const listCouponsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('active').optional().isBoolean().withMessage('Active must be true/false'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'title']).withMessage('Invalid sortBy')
]
export const checkCouponValidator = [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('courseId').notEmpty().isMongoId().withMessage('Course ID is required')
]
