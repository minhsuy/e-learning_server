import express from 'express'
import {
  createOrderController,
  getMyOrdersController,
  getOrdersController,
  updateOrderStatusController
} from '~/controller/order.controller'
import { createOrderValidator, getOrdersValidator, updateOrderStatusValidator } from '~/middlewares/order.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin, isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const orderRouter = express.Router()

// create order : POST /api/orders  (Teacher or Admin)
orderRouter.post('/', verifyAccessToken, createOrderValidator, handleValidationErrors, createOrderController)
export default orderRouter

// get my order : GET /api/orders/my
orderRouter.get('/my', verifyAccessToken, getMyOrdersController)

// update order : PUT /api/orders/:id (Teacher or Admin)
orderRouter.put(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  updateOrderStatusValidator,
  handleValidationErrors,
  updateOrderStatusController
)

// get orders (Admin , Teacher) : GET /api/orders

orderRouter.get(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  getOrdersValidator,
  handleValidationErrors,
  getOrdersController
)
