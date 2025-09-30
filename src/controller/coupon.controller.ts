import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import {
  checkCouponService,
  createCouponService,
  deleteCouponService,
  getCouponDetailService,
  getCouponsService,
  updateCouponService
} from '~/services/coupon.service'
export const createCouponController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await createCouponService({ payload: req.body, userId, role })
  return res.status(result.statusCode || (result.success ? 201 : 400)).json(result)
})
// update coupon

export const updateCouponController = asyncHandler(async (req, res): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await updateCouponService({ id, payload: req.body, userId, role })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// delete coupon
export const deleteCouponController = asyncHandler(async (req, res): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await deleteCouponService({ id, userId, role })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})
// get all coupon
export const getCouponsController = asyncHandler(async (req, res): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await getCouponsService({ params: req.query, userId, role })
  return res.status(200).json(result)
})

// get detail coupon by id
export const getCouponDetailController = asyncHandler(async (req, res): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await getCouponDetailService({ id, userId, role })
  return res.status(result.statusCode || 200).json(result)
})
// check coupon to use
export const checkCouponController = asyncHandler(async (req, res): Promise<any> => {
  const { code, courseId } = req.body
  const result = await checkCouponService({ code, courseId })
  return res.status(result.statusCode || 200).json(result)
})
