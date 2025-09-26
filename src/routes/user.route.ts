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

// Register
usersRouter.post('/register', registerValidator, handleValidationErrors, registerController)

// Final Register
usersRouter.get('/finalregister/:token', finalRegisterValidator, finalRegisterController)

// Login
usersRouter.post('/login', loginValidator, handleValidationErrors, loginController)

// Get user

usersRouter.get('/me', verifyAccessToken, getMeController)

// Get user course

usersRouter.get('/me/courses', verifyAccessToken, getUserCoursesController)

// Logout
usersRouter.post('/logout', verifyAccessToken, logoutController)

// Forgot password

usersRouter.post('/forgot-password', forgotPasswordValidator, handleValidationErrors, forgotPasswordController)

// Reset password

usersRouter.put('/reset-password', resetPasswordValidator, handleValidationErrors, resetPasswordController)

// Update me

usersRouter.put('/update-me', verifyAccessToken, updateMeValidator, handleValidationErrors, updateMeController)

// Change password

usersRouter.put(
  '/change-password',
  verifyAccessToken,
  changePasswordValidator,
  handleValidationErrors,
  changePasswordController
)

// Profile
usersRouter.get('/profile/:id', getUserDetailValidator, handleValidationErrors, getUserDetailController)

// Get list teacher

usersRouter.get('/teachers', listTeachersValidator, handleValidationErrors, getListTeachersController)
export default usersRouter
