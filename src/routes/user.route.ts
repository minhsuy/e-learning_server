import express, { Request, Response } from 'express'
import {
  changePasswordController,
  finalRegisterController,
  forgotPasswordController,
  getListTeachersController,
  getMeController,
  getUserCoursesController,
  getUserDetailController,
  loginController,
  logoutController,
  registerController,
  resetPasswordController,
  updateMeController
} from '~/controller/user.controller'
import { getUserDetailValidator } from '~/middlewares/admin.middleware'
import {
  changePasswordValidator,
  finalRegisterValidator,
  forgotPasswordValidator,
  listTeachersValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator
} from '~/middlewares/user.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const usersRouter = express.Router()

// Register POST /api/users/register
usersRouter.post('/register', registerValidator, handleValidationErrors, registerController)

// Final Register GET /api/users/finalregister
usersRouter.get('/finalregister/:token', finalRegisterValidator, finalRegisterController)

// Login POST /api/users/login
usersRouter.post('/login', loginValidator, handleValidationErrors, loginController)

// Get user GET /api/users/me

usersRouter.get('/me', verifyAccessToken, getMeController)

// Get user course GET /api/users/me/courses

usersRouter.get('/me/courses', verifyAccessToken, getUserCoursesController)

// Logout POST /api/users/logout
usersRouter.post('/logout', verifyAccessToken, logoutController)

// Forgot password POST /api/users/forgot-password

usersRouter.post('/forgot-password', forgotPasswordValidator, handleValidationErrors, forgotPasswordController)

// Reset password PUT /api/users/reset-password

usersRouter.put('/reset-password', resetPasswordValidator, handleValidationErrors, resetPasswordController)

// Update me PUT /api/users/update-me

usersRouter.put('/update-me', verifyAccessToken, updateMeValidator, handleValidationErrors, updateMeController)

// Change password PUT /api/users/change-password

usersRouter.put(
  '/change-password',
  verifyAccessToken,
  changePasswordValidator,
  handleValidationErrors,
  changePasswordController
)

// Profile GET /api/users/profile/:id
usersRouter.get('/profile/:id', getUserDetailValidator, handleValidationErrors, getUserDetailController)

// Get list teacher GET /api/users/teachers

usersRouter.get('/teachers', listTeachersValidator, handleValidationErrors, getListTeachersController)
export default usersRouter
