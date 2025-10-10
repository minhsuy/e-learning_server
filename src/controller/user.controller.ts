import { Request, Response } from 'express'

import asyncHandler from 'express-async-handler'

import dotenv from 'dotenv'
import {
  changePasswordService,
  forgotPasswordService,
  getListTeachersService,
  getMeService,
  loginUserService,
  logoutUserService,
  registerUserService,
  resetPasswordService,
  updateMeService,
  verifyUserService
} from '~/services/user.service'
import { getUserDetailService } from '~/services/admin.service'

dotenv.config()

//  Register user
export const registerController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const newUser = await registerUserService(req.body)
  if (!newUser) return res.status(400).json({ success: false, message: 'Đăng ký không thành công !' })
  return res
    .status(200)
    .json({ success: true, message: 'Đăng ký tài khoản thành công . Vui lòng check email để xác thực !' })
})

export const finalRegisterController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { token } = req.params

  await verifyUserService(token)

  return res.status(200).json({
    success: true,
    message: 'Xác thực email thành công!'
  })
})

//  Login user

export const loginController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body
  const result = await loginUserService({ email, password })

  if (!result.success) {
    return res.status(400).json({
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
  const result = await getUserDetailService({ id })
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
