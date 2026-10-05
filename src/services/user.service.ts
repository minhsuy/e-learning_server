import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { Prisma, UserRole } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import {
  addUser,
  deleteUser,
  findActiveTeachers,
  findUserByEmail,
  findUserById,
  findUserByResetToken,
  findUserWithCredentials,
  isEmailTaken,
  isUsernameTaken,
  markUserAsVerified,
  updateRefreshToken,
  updateUser,
  USER_PUBLIC_SELECT
} from '~/repositories/user.repository'
import { generateAccessToken, generateRefreshToken } from '~/middlewares/generateToken'
import { resetPasswordEmail, welcomeEmail } from '~/styles/sendEmailTemplate'
import { sendEmail } from '~/utils/nodeMailer'
import { ServiceResponse, UpdateMeParams } from '~/types/type'
import { hashToken } from '~/utils/ultis'
import { isValidUUID, withCompatId } from '~/utils/uuid'

dotenv.config()

/**
 * Normalizes input role string to Prisma UserRole enum.
 * Defaults to UserRole.USER.
 */
function toPrismaRole(role?: string): UserRole {
  if (!role) return UserRole.USER
  const upper = role.toUpperCase()
  if (upper === 'ADMIN') return UserRole.ADMIN
  if (upper === 'TEACHER') return UserRole.TEACHER
  return UserRole.USER
}

/**
 * Formats a raw Prisma User record into a public, client-safe User DTO.
 * Guarantees lowercase role string and socialLinks object for frontend compatibility.
 */
function formatSafeUser(user: any): any {
  const {
    password: _p,
    refreshToken: _rt,
    resetPasswordToken: _rpt,
    resetPasswordExpires: _rpe,
    otpCode: _oc,
    otpExpires: _oe,
    ...rest
  } = user

  const safe = {
    ...rest,
    role: (user.role || 'USER').toLowerCase(),
    socialLinks: {
      facebook: user.socialFacebook || '',
      instagram: user.socialInstagram || '',
      github: user.socialGithub || ''
    }
  }

  return withCompatId(safe)
}

// REGISTER USER
export const registerUserService = async (
  payload: {
    username: string
    email: string
    password: string
    phone?: string
    bio?: string
    role?: string
  },
  tx?: PrismaTransactionClient
) => {
  const { username, email, password, phone, bio } = payload

  // Force default UserRole.USER for public registration (Privilege Escalation protection)
  const userRole = UserRole.USER

  // Check email conflict at service layer (transferred from registerValidator)
  const emailExists = await isEmailTaken(email, undefined, tx)
  if (emailExists) {
    return {
      success: false,
      statusCode: 400,
      errors: { email: 'Email already in use' },
      message: 'Email already in use'
    } as any
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  // 6-digit random OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const hashedOtp = hashToken(otp)
  const otpExpires = new Date(Date.now() + 1000 * 60 * 10) // expires in 10 mins

  const newUser = await addUser(
    {
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      bio: bio || null,
      role: userRole,
      isVerified: false,
      otpCode: hashedOtp,
      otpExpires
    },
    tx
  )

  try {
    const { subject, text, html } = welcomeEmail(username, otp)
    await sendEmail({ to: email, subject, text, html })
  } catch (emailErr) {
    // Non-blocking email dispatch failure in test/dev
    console.warn('[UserService] Warning: Welcome email dispatch error:', (emailErr as any)?.message || emailErr)
  }

  return withCompatId({
    ...newUser,
    role: newUser.role.toLowerCase()
  })
}

// VERIFY OTP
export const verifyOtpService = async (
  { email, otp }: { email: string; otp: string },
  tx?: PrismaTransactionClient
) => {
  const user = await findUserByEmail(
    email,
    {
      select: {
        id: true,
        email: true,
        isVerified: true,
        otpCode: true,
        otpExpires: true
      }
    },
    tx
  )

  if (!user) {
    throw new Error('Người dùng không tồn tại')
  }

  if (user.isVerified) {
    return { success: true, message: 'Tài khoản đã được xác thực trước đó' }
  }

  if (!user.otpCode || !user.otpExpires) {
    throw new Error('OTP không tồn tại')
  }

  if (user.otpExpires < new Date()) {
    // Delete newly registered user record when OTP expires
    await deleteUser(user.id, tx)
    throw new Error('OTP đã hết hạn, vui lòng đăng ký lại')
  }

  const hashedInput = hashToken(otp)
  if (hashedInput !== user.otpCode) {
    throw new Error('Mã OTP không đúng')
  }

  await markUserAsVerified(user.id, tx)

  return { success: true, message: 'Xác thực email thành công!' }
}

// LOGIN USER
export const loginUserService = async (
  payload: { email: string; password: string },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  const { email, password } = payload
  const user = await findUserWithCredentials(email, tx)

  if (!user) {
    return {
      success: false,
      statusCode: 400,
      errors: { email: 'Email không tồn tại' },
      message: 'Email không tồn tại'
    }
  }

  if (!user.isVerified) {
    return {
      success: false,
      statusCode: 400,
      errors: { email: 'Vui lòng xác thực email trước khi đăng nhập' },
      message: 'Vui lòng xác thực email trước khi đăng nhập'
    }
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return { success: false, statusCode: 401, message: 'Incorrect password' }
  }

  const roleString = (user.role || 'USER').toLowerCase()
  const access_token = generateAccessToken({ userId: user.id, role: roleString })
  const refresh_token = generateRefreshToken({ userId: user.id })

  // Hash token before storing in DB — client receives raw token
  await updateRefreshToken(user.id, hashToken(refresh_token), tx)

  return { success: true, access_token, refresh_token, message: 'Login successfully !' }
}

// GET ME
export const getMeService = async (
  { userId }: { userId: string },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!userId) {
    return {
      success: false,
      message: 'User not found !'
    }
  }

  if (!isValidUUID(userId)) {
    return {
      success: false,
      message: 'User not found'
    }
  }

  const user = await findUserById(userId, { select: USER_PUBLIC_SELECT }, tx)

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  return {
    success: true,
    message: 'Get user info successfully !',
    data: formatSafeUser(user)
  }
}

// LOGOUT USER
export const logoutUserService = async (
  { userId }: { userId: string },
  tx?: PrismaTransactionClient
): Promise<ServiceResponse> => {
  if (!userId || !isValidUUID(userId)) {
    return {
      success: false,
      message: 'User not found'
    }
  }

  const user = await findUserById(userId, undefined, tx)
  if (!user) {
    return {
      success: false,
      message: 'User not found'
    }
  }

  await updateRefreshToken(userId, null, tx)

  return {
    success: true,
    message: 'Logout successfully !'
  }
}

// FORGOT PASSWORD
export const forgotPasswordService = async (email: string, tx?: PrismaTransactionClient) => {
  const user = await findUserByEmail(email, undefined, tx)
  if (!user) return { message: 'Email does not exist !', success: false }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashed = hashToken(resetToken)
  const resetExpires = new Date(Date.now() + 1000 * 60 * 15) // 15 mins

  await updateUser(
    user.id,
    {
      resetPasswordToken: hashed,
      resetPasswordExpires: resetExpires
    },
    tx
  )

  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${email}`
    const { subject, text, html } = resetPasswordEmail(resetLink)
    await sendEmail({ to: email, subject, text, html })
  } catch (emailErr) {
    console.warn('[UserService] Warning: Reset email dispatch error:', (emailErr as any)?.message || emailErr)
  }

  return { message: 'Reset password email sent  , please check your email !', success: true }
}

// RESET PASSWORD
export const resetPasswordService = async (
  { token, newPassword }: { token: string; newPassword: string },
  tx?: PrismaTransactionClient
) => {
  const hashed = hashToken(token)

  const user = await findUserByResetToken(hashed, tx)

  if (!user) {
    return { success: false, message: 'Invalid or expired reset token !' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await updateUser(
    user.id,
    {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null
    },
    tx
  )

  return { success: true, message: 'Password reset successfully!' }
}

// UPDATE ME
export const updateMeService = async (
  { userId, username, avatar, phone, bio, socialLinks }: UpdateMeParams,
  tx?: PrismaTransactionClient
) => {
  if (!userId || !isValidUUID(userId)) {
    return {
      success: false,
      message: 'User not found'
    }
  }

  const user = await findUserById(userId, undefined, tx)

  if (!user) {
    return {
      success: false,
      message: 'User not found'
    }
  }

  // Check username uniqueness if changed, respecting duplicate username history
  if (username && username.trim() !== user.username) {
    const taken = await isUsernameTaken(username.trim(), userId, tx)
    if (taken) {
      return {
        success: false,
        message: 'Username already taken'
      }
    }
  }

  const updateData: Prisma.UserUpdateInput = {}
  if (username) updateData.username = username.trim()
  if (avatar !== undefined) updateData.avatar = avatar
  if (phone !== undefined) updateData.phone = phone
  if (bio !== undefined) updateData.bio = bio

  if (socialLinks) {
    if (socialLinks.facebook !== undefined) updateData.socialFacebook = socialLinks.facebook
    if (socialLinks.instagram !== undefined) updateData.socialInstagram = socialLinks.instagram
    if (socialLinks.github !== undefined) updateData.socialGithub = socialLinks.github
  }

  const updatedUser = await updateUser(userId, updateData, tx)

  return {
    success: true,
    message: 'Profile updated successfully',
    data: formatSafeUser(updatedUser)
  }
}

// CHANGE PASSWORD
export const changePasswordService = async (
  {
    userId,
    oldPassword,
    newPassword
  }: {
    userId: string
    oldPassword: string
    newPassword: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!userId || !isValidUUID(userId)) {
    return { success: false, message: 'User not found' }
  }

  const user = await findUserById(userId, { select: { id: true, password: true } }, tx)

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password)
  if (!isMatch) {
    return { success: false, message: 'Old password is incorrect' }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await updateUser(
    userId,
    {
      password: hashedPassword,
      refreshToken: null
    },
    tx
  )

  return { success: true, message: 'Password changed successfully' }
}

// GET LIST TEACHER
export const getListTeachersService = async (params: any, tx?: PrismaTransactionClient) => {
  const { page = 1, limit = 10, search, sortBy = 'createdAt' } = params

  const { teachers, total, page: pageNum, limit: limitNum, totalPages } =
    await findActiveTeachers(
      {
        search: search ? String(search) : undefined,
        page: Number(page),
        limit: Number(limit),
        sortBy: String(sortBy),
        sortOrder: 'desc'
      },
      tx
    )

  const formattedTeachers = teachers.map((teacher) => {
    const formatted = {
      id: teacher.id,
      username: teacher.username,
      avatar: teacher.avatar,
      bio: teacher.bio,
      phone: teacher.phone,
      socialLinks: {
        facebook: teacher.socialFacebook || '',
        instagram: teacher.socialInstagram || '',
        github: teacher.socialGithub || ''
      },
      createdAt: teacher.createdAt
    }
    return withCompatId(formatted)
  })

  return {
    success: true,
    message: 'Fetched teachers successfully!',
    data: {
      teachers: formattedTeachers,
      pagination: {
        page: Number(pageNum),
        limit: Number(limitNum),
        total,
        totalPages: Math.ceil(total / Number(limitNum))
      }
    }
  }
}

// GET ACCESS TOKEN
export const getAccessTokenService = async (
  { userId, refresh_token }: { userId: string; refresh_token: string },
  tx?: PrismaTransactionClient
) => {
  if (!userId || !isValidUUID(userId)) {
    return { success: false, message: 'User not found' }
  }

  const user = await findUserById(
    userId,
    {
      select: {
        id: true,
        role: true,
        refreshToken: true
      }
    },
    tx
  )

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  // Compare hashed token in DB with hash of raw incoming token
  const hashedIncoming = hashToken(refresh_token)
  if (!user.refreshToken || user.refreshToken !== hashedIncoming) {
    return { success: false, message: 'Refresh token không hợp lệ hoặc đã bị thu hồi' }
  }

  const roleString = (user.role || 'USER').toLowerCase()
  const access_token = generateAccessToken({ userId: user.id, role: roleString })

  return {
    success: true,
    access_token
  }
}
