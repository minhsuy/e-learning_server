import { Request, Response } from 'express'

import asyncHandler from 'express-async-handler'

import dotenv from 'dotenv'
import {
  changePasswordService,
  forgotPasswordService,
  getAccessTokenService,
  getListTeachersService,
  getMeService,
  loginUserService,
  loginWithGoogleService,
  logoutUserService,
  registerUserService,
  resetPasswordService,
  updateMeService,
  verifyOtpService
} from '~/services/user.service'
import { getUserDetailService } from '~/services/admin.service'

dotenv.config()

//  Register user
export const registerController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await registerUserService(req.body)
  if (!result || (result as any).success === false) {
    if ((result as any)?.errors) {
      return res.status((result as any).statusCode || 400).json({ errors: (result as any).errors })
    }
    return res.status(400).json({ success: false, message: (result as any)?.message || 'Đăng ký không thành công !' })
  }
  return res
    .status(200)
    .json({ success: true, message: 'Đăng ký tài khoản thành công . Vui lòng check email để xác thực !' })
})

// Verify OTP POST /api/users/verify-otp
export const verifyOtpController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { email, otp } = req.body

  const result = await verifyOtpService({ email, otp })

  return res.status(200).json(result)
})

//  Login user

export const loginController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body
  const result = await loginUserService({ email, password })

  if (!result.success) {
    if (result.errors) {
      return res.status(result.statusCode ?? 400).json({ errors: result.errors })
    }
    return res.status(result.statusCode ?? 401).json({
      success: false,
      message: result.message
    })
  }

  res.status(200).json({
    success: true,
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    message: result.message
  })
})

// Google Login POST /api/users/google-login
export const googleLoginController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await loginWithGoogleService(req.body)

  if (!result.success) {
    if (result.errors) {
      return res.status(result.statusCode ?? 400).json({ errors: result.errors })
    }
    return res.status(result.statusCode ?? 400).json({
      success: false,
      message: result.message
    })
  }

  res.status(200).json({
    success: true,
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    data: result.data,
    user: result.data,
    message: result.message
  })
})

//  Get user

export const getMeController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const user = await getMeService({ userId })
  if (!user.success) {
    return res.status(400).json({
      success: false,
      message: user.message
    })
  }

  res.status(200).json({
    success: true,
    message: user.message,
    data: user.data
  })
})

// Logout user
export const logoutController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }

  const result = await logoutUserService({ userId })

  if (!result.success) {
    return res.status(404).json(result)
  }
  return res.status(200).json(result)
})

// Forgot password :
export const forgotPasswordController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body
  const result = await forgotPasswordService(email)

  if (!result.success) {
    return res.status(404).json(result)
  }
  return res.status(200).json(result)
})

// Reset password

export const resetPasswordController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { token, password } = req.body

  const result = await resetPasswordService({
    token,
    newPassword: password
  })

  if (!result.success) {
    return res.status(400).json(result)
  }

  return res.status(200).json(result)
})

// Update me

export const updateMeController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }

  const result = await updateMeService({
    userId,
    ...req.body
  })

  if (!result.success) {
    return res.status(404).json(result)
  }

  return res.status(200).json(result)
})

// Change password

export const changePasswordController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { oldPassword, password } = req.body

  const result = await changePasswordService({
    userId,
    oldPassword,
    newPassword: password
  })

  if (!result.success) {
    return res.status(400).json(result)
  }

  return res.status(200).json(result)
})

// get user detail
export const getUserDetailController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const result = await getUserDetailService({ id } as any)
  if (!result.success) {
    return res.status(404).json(result)
  }
  return res.status(200).json(result)
})

// get list teacher

export const getListTeachersController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await getListTeachersService(req.query)
  return res.status(200).json(result)
})

// get access token
export const getAccessTokenController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { refresh_token } = req.body
  const result = await getAccessTokenService({ userId, refresh_token })
  if (!result.success) {
    return res.status(401).json(result)
  }
  return res.status(200).json(result)
})
