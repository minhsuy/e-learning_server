import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import {
  createOrderService,
  getMyOrdersService,
  getOrdersService,
  updateOrderStatusService
} from '~/services/order.service'

export const createOrderController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { courseId, couponCode } = req.body
  const result = await createOrderService({
    userId,
    courseId,
    couponCode
  })
  return res.status(result.statusCode || 200).json(result)
})

// get my orders :

export const getMyOrdersController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }

  const { page = 1, limit = 10, status } = req.query

  const result = await getMyOrdersService({
    userId,
    page: Number(page),
    limit: Number(limit),
    status: status as string
  })

  return res.status(200).json(result)
})

// update order (teacher or admin)
export const updateOrderStatusController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { status } = req.body
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await updateOrderStatusService({ orderId: id, status, userId, role })
  return res.status(result.statusCode || 200).json(result)
})

// get orders by admin or teacher
export const getOrdersController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { page, limit, search, status, sortBy } = req.query

  const { userId, role } = req.user as { userId: string; role: string }

  const result = await getOrdersService({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search: search ? String(search) : undefined,
    status: status ? String(status) : undefined,
    sortBy: sortBy ? String(sortBy) : 'createdAt',
    userId,
    role
  })

  return res.status(200).json(result)
})
