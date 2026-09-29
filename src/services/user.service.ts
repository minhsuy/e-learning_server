import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import UserModel from '~/models/user.model'
import bcrypt from 'bcryptjs'
import { resetPasswordEmail, welcomeEmail } from '~/styles/sendEmailTemplate'
import { sendEmail } from '~/utils/nodeMailer'
import { generateAccessToken, generateRefreshToken } from '~/middlewares/generateToken'
import { ServiceResponse, UpdateMeParams } from '~/types/type'
import dotenv from 'dotenv'
import { hashToken } from '~/utils/ultis'
import { UserRole } from '~/types/enum'
import { FilterQuery } from 'mongoose'

dotenv.config()
export const registerUserService = async (payload: {
  username: string
  email: string
  password: string
  phone?: string
  bio?: string
  role?: string
}) => {
  const { username, email, password, phone, bio, role } = payload

  const hashedPassword = await bcrypt.hash(password, 10)

  // Sinh OTP 6 số ngẫu nhiên
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const hashedOtp = hashToken(otp)
  const otpExpires = new Date(Date.now() + 1000 * 60 * 10) // hết hạn sau 10 phút

  const newUser = new UserModel({
    username,
    email,
    password: hashedPassword,
    phone,
    bio,
    role,
    isVerified: false,
    otp_code: hashedOtp,
    otp_expires: otpExpires
  })

  await newUser.save()

  const { subject, text, html } = welcomeEmail(username, otp)
  await sendEmail({ to: email, subject, text, html })

  return newUser
}

export const verifyOtpService = async ({ email, otp }: { email: string; otp: string }) => {
  const user = await UserModel.findOne({ email })
  if (!user) {
    throw new Error('Người dùng không tồn tại')
  }

  if (user.isVerified) {
    return { success: true, message: 'Tài khoản đã được xác thực trước đó' }
  }

  if (!user.otp_code || !user.otp_expires) {
    throw new Error('OTP không tồn tại')
  }

  if (user.otp_expires < new Date()) {
    // Xóa user khi OTP hết hạn (tương đương logic cũ)
    await UserModel.findByIdAndDelete(user._id)
    throw new Error('OTP đã hết hạn, vui lòng đăng ký lại')
  }

  const hashedInput = hashToken(otp)
  if (hashedInput !== user.otp_code) {
    throw new Error('Mã OTP không đúng')
  }

  user.isVerified = true
  user.otp_code = undefined
  user.otp_expires = undefined
  await user.save()

  return { success: true, message: 'Xác thực email thành công!' }
}

export const loginUserService = async (payload: { email: string; password: string }): Promise<ServiceResponse> => {
  const { email, password } = payload
  const user = await UserModel.findOne({ email })

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return { success: false, message: 'Incorrect password' }
  }

  const access_token = generateAccessToken({ userId: user._id.toString(), role: user.role })
  const refresh_token = generateRefreshToken({ userId: user._id.toString() })

  // Hash token trước khi lưu DB — client vẫn nhận raw token
  user.refresh_token = hashToken(refresh_token)
  await user.save()

  return { success: true, access_token, refresh_token, message: 'Login successfully !' }
}

export const getMeService = async ({ userId }: { userId: string }): Promise<ServiceResponse> => {
  if (!userId) {
    return {
      success: false,
      message: 'User not found !'
    }
  }
  const user = await UserModel.findById(userId).select('-password -refresh_token -isVerified -otp_code -otp_expires')

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  return {
    success: true,
    message: 'Get user info successfully !',
    data: user
  }
}

// logout service

export const logoutUserService = async ({ userId }: { userId: string }): Promise<ServiceResponse> => {
  const user = await UserModel.findById(userId)
  if (!user) {
    return {
      success: false,
      message: 'User not found'
    }
  }
  user.refresh_token = ''
  await user.save()
  return {
    success: true,
    message: 'Logout successfully !'
  }
}

// forgot password
export const forgotPasswordService = async (email: string) => {
  const user = await UserModel.findOne({ email })
  if (!user) return { message: 'Email does not exist !', success: false }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashed = hashToken(resetToken)

  user.reset_password_token = hashed
  user.reset_password_expires = new Date(Date.now() + 1000 * 60 * 15)
  await user.save()

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${email}`
  const { subject, text, html } = resetPasswordEmail(resetLink)
  await sendEmail({ to: email, subject, text, html })

  return { message: 'Reset password email sent  , please check your email !', success: true }
}

// reset password

export const resetPasswordService = async ({ token, newPassword }: { token: string; newPassword: string }) => {
  const hashed = hashToken(token)

  const user = await UserModel.findOne({
    reset_password_token: hashed,
    reset_password_expires: { $gt: new Date() }
  })

  if (!user) {
    return { success: false, message: 'Invalid or expired reset token !' }
  }

  user.password = await bcrypt.hash(newPassword, 10)
  user.reset_password_token = undefined
  user.reset_password_expires = undefined
  user.refresh_token = undefined
  await user.save()

  return { success: true, message: 'Password reset successfully!' }
}

// update me
export const updateMeService = async ({ userId, username, avatar, phone, bio, socialLinks }: UpdateMeParams) => {
  const user = await UserModel.findById(userId)

  if (!user) {
    return {
      success: false,
      message: 'User not found'
    }
  }

  if (username) user.username = username
  if (avatar) user.avatar = avatar
  if (phone) user.phone = phone
  if (bio) user.bio = bio
  if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks }

  await user.save()

  const { password, refresh_token, reset_password_token, reset_password_expires, ...safeUser } = user.toObject()

  return {
    success: true,
    message: 'Profile updated successfully',
    data: safeUser
  }
}

// Change password
export const changePasswordService = async ({
  userId,
  oldPassword,
  newPassword
}: {
  userId: string
  oldPassword: string
  newPassword: string
}) => {
  const user = await UserModel.findById(userId).select('+password')

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password)
  if (!isMatch) {
    return { success: false, message: 'Old password is incorrect' }
  }

  user.password = await bcrypt.hash(newPassword, 10)
  user.refresh_token = undefined
  await user.save()

  return { success: true, message: 'Password changed successfully' }
}

// get list teacher service

export const getListTeachersService = async (params: any) => {
  const { page = 1, limit = 10, search, sortBy = 'createdAt' } = params

  const filter: FilterQuery<typeof UserModel> = {
    role: UserRole.TEACHER,
    isVerified: ''
  }

  if (search) {
    filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
  }

  const skip = (page - 1) * limit

  const [teachers, total] = await Promise.all([
    UserModel.find(filter)
      .select('_id username avatar bio socialLinks createdAt')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit),
    UserModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched teachers successfully!',
    data: {
      teachers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

// get acess token

export const getAccessTokenService = async ({ userId, refresh_token }: { userId: string; refresh_token: string }) => {
  const user = await UserModel.findById(userId)
  if (!user) {
    return { success: false, message: 'User not found' }
  }

  // So sánh hashed token trong DB với hash của raw token từ client
  const hashedIncoming = hashToken(refresh_token)
  if (!user.refresh_token || user.refresh_token !== hashedIncoming) {
    return { success: false, message: 'Refresh token không hợp lệ hoặc đã bị thu hồi' }
  }

  const access_token = generateAccessToken({ userId: user._id.toString(), role: user.role })
  return {
    success: true,
    access_token
  }
}
