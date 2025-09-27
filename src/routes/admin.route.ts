import express, { Request, Response } from 'express'
import {
  createCourseByAdminController,
  createTeacherController,
  deleteCourseByAdminController,
  deleteUserByAdminController,
  getAllUsersController,
  getCoursesByAdminController,
  updateCourseByAdminController,
  updateUserByAdminController
} from '~/controller/admin.controller'
import {
  createCategoryController,
  deleteCategoryController,
  updateCategoryController
} from '~/controller/category.controller'
import { getUserDetailController } from '~/controller/user.controller'
import {
  createTeacherValidator,
  getAllUsersValidator,
  getUserDetailValidator,
  updateUserByAdminValidator
} from '~/middlewares/admin.middleware'
import { createCategoryValidator, updateCategoryValidator } from '~/middlewares/category.middleware'
import {
  courseIdValidator,
  createCourseValidator,
  listPublicCoursesValidator,
  updateCourseByAdminValidator
} from '~/middlewares/course.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const adminRouter = express.Router()
// -------- USER ---------------------------------------------------------------------------------------
// Get all users  GET /api/admin/users
adminRouter.get(
  '/users',
  verifyAccessToken,
  isAdmin,
  getAllUsersValidator,
  handleValidationErrors,
  getAllUsersController
)

// Get detail user GET /api/admin/users/:id

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

// --------- COURSE --------------------------------------------------------------------------------------

// add course by admin   POST /api/admin/courses
adminRouter.post(
  '/courses',
  verifyAccessToken,
  isAdmin,
  createCourseValidator,
  handleValidationErrors,
  createCourseByAdminController
)

// update course by admin PUT /api/admin/courses/:id
adminRouter.put(
  '/courses/:id',
  verifyAccessToken,
  isAdmin,
  updateCourseByAdminValidator,
  handleValidationErrors,
  updateCourseByAdminController
)

// delete course by admin DELETE /api/admin/courses/:id
adminRouter.delete(
  '/courses/:id',
  verifyAccessToken,
  isAdmin,
  courseIdValidator,
  handleValidationErrors,
  deleteCourseByAdminController
)

// get all course by admin GET /api/admin/courses

adminRouter.get(
  '/courses',
  verifyAccessToken,
  isAdmin,
  listPublicCoursesValidator,
  handleValidationErrors,
  getCoursesByAdminController
)

// -------- CATEGORY  ---------------------------------------------------------------------------------------

// CREATE CATEGORY  POST /api/admin/categories
adminRouter.post(
  '/categories/',
  verifyAccessToken,
  isAdmin,
  createCategoryValidator,
  handleValidationErrors,
  createCategoryController
)

// DELETE CATEGORY DELETE /api/admin/categories/:id

adminRouter.delete(
  '/categories/:id',
  verifyAccessToken,
  isAdmin,
  courseIdValidator,
  handleValidationErrors,
  deleteCategoryController
)

// UPDATE CATEGORY PUT /api/admin/categories/:id
adminRouter.put(
  '/categories/:id',
  verifyAccessToken,
  isAdmin,
  updateCategoryValidator,
  handleValidationErrors,
  updateCategoryController
)

export default adminRouter
