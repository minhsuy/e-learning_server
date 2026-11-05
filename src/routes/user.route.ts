import express from 'express'
import {
  changePasswordController,
  verifyOtpController,
  forgotPasswordController,
  getAccessTokenController,
  getListTeachersController,
  getMeController,
  getUserDetailController,
  loginController,
  googleLoginController,
  logoutController,
  registerController,
  resetPasswordController,
  updateMeController
} from '~/controller/user.controller'
import { getUserDetailValidator } from '~/middlewares/admin.middleware'
import {
  changePasswordValidator,
  verifyOtpValidator,
  forgotPasswordValidator,
  listTeachersValidator,
  loginValidator,
  googleLoginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator
} from '~/middlewares/user.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken, verifyRefreshToken } from '~/middlewares/verifyToken'
import { isAdmin } from '~/middlewares/verifyRole'
import { updateUserByAdminController } from '~/controller/admin.controller'
import {
  getUserXpSummaryController,
  getUserStreakController,
  getUserXpHistoryController
} from '~/controller/gamification.controller'
import { getUserLeaderboardPositionController } from '~/controller/leaderboard.controller'
import { xpHistoryQueryValidator } from '~/middlewares/gamification.middleware'

const usersRouter = express.Router()

// Register POST /api/users/register
usersRouter.post('/register', registerValidator, handleValidationErrors, registerController)

// Verify OTP POST /api/users/verify-otp
usersRouter.post('/verify-otp', verifyOtpValidator, handleValidationErrors, verifyOtpController)

// Login POST /api/users/login
usersRouter.post('/login', loginValidator, handleValidationErrors, loginController)

// Google Login POST /api/users/google-login
usersRouter.post('/google-login', googleLoginValidator, handleValidationErrors, googleLoginController)

// Google Login Alias POST /api/users/google
usersRouter.post('/google', googleLoginValidator, handleValidationErrors, googleLoginController)

// Get user GET /api/users/me

usersRouter.get('/me', verifyAccessToken, getMeController)

// Gamification: XP Summary GET /api/users/me/xp-summary
usersRouter.get('/me/xp-summary', verifyAccessToken, getUserXpSummaryController)

// Gamification: Streak GET /api/users/me/streak
usersRouter.get('/me/streak', verifyAccessToken, getUserStreakController)

// Gamification: XP History GET /api/users/me/xp-history
usersRouter.get(
  '/me/xp-history',
  verifyAccessToken,
  xpHistoryQueryValidator,
  handleValidationErrors,
  getUserXpHistoryController
)

// Gamification: Leaderboard Position GET /api/users/me/leaderboard-position
usersRouter.get('/me/leaderboard-position', verifyAccessToken, getUserLeaderboardPositionController)

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
// get access_token
usersRouter.post('/access_token', verifyRefreshToken, getAccessTokenController)

// Admin user lock & role update with self-protection (BE-F9.11-008)
// PATCH /api/users/admin/lock/:id
usersRouter.patch(
  '/admin/lock/:id',
  verifyAccessToken,
  isAdmin,
  getUserDetailValidator,
  handleValidationErrors,
  updateUserByAdminController
)

// PATCH /api/users/admin/role/:id
usersRouter.patch(
  '/admin/role/:id',
  verifyAccessToken,
  isAdmin,
  getUserDetailValidator,
  handleValidationErrors,
  updateUserByAdminController
)

export default usersRouter
