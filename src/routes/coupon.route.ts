import express from 'express'
import {
  checkCouponController,
  createCouponController,
  deleteCouponController,
  getCouponDetailController,
  getCouponsController,
  updateCouponController
} from '~/controller/coupon.controller'
import {
  checkCouponValidator,
  couponIdValidator,
  createCouponValidator,
  listCouponsValidator,
  updateCouponValidator
} from '~/middlewares/coupon.middleware'

import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin, isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const couponRouter = express.Router()
// CREATE COUPON : POST /api/coupons
couponRouter.post(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  createCouponValidator,
  handleValidationErrors,
  createCouponController
)
// UPDATE COUPON : PUT /api/coupons/:id
couponRouter.put(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  updateCouponValidator,
  handleValidationErrors,
  updateCouponController
)
// DELETE COUPON : DELETE /api/coupons/:id
couponRouter.delete(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  couponIdValidator,
  handleValidationErrors,
  deleteCouponController
)
// GET COUPONS : GET /api/coupons
couponRouter.get(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  listCouponsValidator,
  handleValidationErrors,
  getCouponsController
)
// CHECK COUPON : POST /api/coupons/check
couponRouter.post('/use', verifyAccessToken, checkCouponValidator, handleValidationErrors, checkCouponController)
// GET COUPON DETAIL : GET /api/coupons/:id
couponRouter.get(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  couponIdValidator,
  handleValidationErrors,
  getCouponDetailController
)
export default couponRouter
