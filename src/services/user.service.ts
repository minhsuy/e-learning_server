import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import UserModel from '~/models/user.model'
import bcrypt from 'bcryptjs'
import { resetPasswordEmail, welcomeEmail } from '~/styles/sendEmailTemplate'
import { sendEmail } from '~/utils/nodeMailer'
import { generateAccessToken, generateRefreshToken, generateVerificationToken } from '~/middlewares/generateToken'
import { ServiceResponse, UpdateMeParams } from '~/types/type'
import dotenv from 'dotenv'
import { hashToken } from '~/utils/ultis'

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

  const verificationToken = generateVerificationToken(email)

  const newUser = new UserModel({
    username,
    email,
    password: hashedPassword,
    phone,
    bio,
    role,
    isVerified: verificationToken
  })

  await newUser.save()

  const { subject, text, html } = welcomeEmail(username, verificationToken)
  await sendEmail({ to: email, subject, text, html })

  return newUser
}

export const verifyUserService = async (token: string) => {
  const secret = process.env.JWT_SECRET_VERIFIED_EMAIL as string
  const decoded = jwt.verify(token, secret) as { userId: string }

  const user = await UserModel.findOne({ email: decoded.userId })
  if (!user) {
    throw new Error('Người dùng không tồn tại')
  }

  if (user.isVerified !== token) {
    throw new Error('Token không khớp')
  }

  user.isVerified = ''
  await user.save()

  return user
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

  user.refresh_token = refresh_token
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
  const user = await UserModel.findById(userId).select('-password -refresh_token -isVerified')

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  return {
    success: true,
    message: 'Get user info successfully !',
    data: user
  }
}

export const getUserCoursesService = async ({ userId }: { userId: string }): Promise<ServiceResponse> => {
  if (!userId) {
    return {
      success: false,
      message: 'User not found !'
    }
  }

  const user = await UserModel.findById(userId)
    .populate({
      path: 'courses',
      populate: {
        path: 'chapters',
        populate: {
          path: 'lessons'
        }
      }
    })
    .select('courses')
    .lean()

  if (!user) {
    return {
      success: false,
      message: 'User not found'
    }
  }

  return {
    success: true,
    message: 'Get my courses successfully !',
    data: user.courses
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
