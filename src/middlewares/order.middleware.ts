import { body, param, query } from 'express-validator'
import { EOrderStatus } from '~/types/enum'
import { isValidUUID } from '~/utils/uuid'

export const createOrderValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Course ID'),

  body('couponCode').optional().notEmpty().withMessage('Coupon is required')
]

export const orderIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Order ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Order ID')
]

export const updateOrderStatusValidator = [
  param('id')
    .notEmpty()
    .withMessage('Order ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid Order ID'),

  body('status')
    .notEmpty()
    .custom((val) => {
      const s = String(val).toLowerCase()
      return Object.values(EOrderStatus).includes(s as EOrderStatus)
    })
    .withMessage('Invalid order status')
]

export const getOrdersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional({ checkFalsy: true })
    .custom((val) => {
      const s = String(val).toLowerCase()
      return Object.values(EOrderStatus).includes(s as EOrderStatus)
    })
    .withMessage('Invalid status'),
  query('search').optional().isString(),
  query('sortBy').optional().isString()
]
