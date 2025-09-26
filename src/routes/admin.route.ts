import express, { Request, Response } from 'express'
import {
  createTeacherController,
  deleteUserByAdminController,
  getAllUsersController,
  updateUserByAdminController
} from '~/controller/admin.controller'
import { getUserDetailController } from '~/controller/user.controller'
import {
  createTeacherValidator,
  getAllUsersValidator,
  getUserDetailValidator,
  updateUserByAdminValidator
} from '~/middlewares/admin.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const adminRouter = express.Router()
// -------- USER ---------
// Get all users
adminRouter.get(
  '/users',
  verifyAccessToken,
  isAdmin,
  getAllUsersValidator,
  handleValidationErrors,
  getAllUsersController
)

// Get detail user

adminRouter.get(
  '/users/:id',
  verifyAccessToken,
  isAdmin,
  getUserDetailValidator,
  handleValidationErrors,
  getUserDetailController
)

// PATCH /api/admin/users/:id
adminRouter.put(
  '/users/:id',
  verifyAccessToken,
  isAdmin,
  updateUserByAdminValidator,
  handleValidationErrors,
  updateUserByAdminController
)

// DELETE /api/admin/users/:id
adminRouter.delete(
  '/users/:id',
  verifyAccessToken,
  isAdmin,
  getUserDetailValidator,
  handleValidationErrors,
  deleteUserByAdminController
)

// POST /api/admin/users  (chỉ tạo teacher)
adminRouter.post(
  '/users',
  verifyAccessToken,
  isAdmin,
  createTeacherValidator,
  handleValidationErrors,
  createTeacherController
)
export default adminRouter
