import bcrypt from 'bcryptjs'
import { CourseLevel as PrismaCourseLevel, CourseStatus as PrismaCourseStatus, CourseType as PrismaCourseType, Prisma, UserRole as PrismaUserRole, UserStatus as PrismaUserStatus } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import { createTeacherPayloadSchema } from '~/models/user.model'
import {
  COURSE_ADMIN_SELECT,
  CourseAdminPayload,
  findCourseById as findCourseByIdRepo,
  findCoursesWithPagination as findCoursesWithPaginationRepo,
  softDeleteCourse,
  updateCourse as updateCourseRepo,
  updateCourseStatus
} from '~/repositories/course.repository'
import {
  addUser,
  countAdminsExcluding,
  deleteUser,
  findUserById,
  findUserConflict,
  findUsersWithPagination,
  isUsernameTaken,
  updateUser,
  USER_ADMIN_SELECT
} from '~/repositories/user.repository'
import { CourseStatus, ENotificationType, UserRole, UserStatus } from '~/types/enum'
import { GetAllUsersParams, ICreateTeacherInput, ListQuery } from '~/types/type'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { formatSafeCourse, toPrismaCourseLevel, toPrismaCourseStatus, toPrismaCourseType } from './course.service'
import { pushNotificationService } from './notification.service'

function isLegacyObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// Helper to map role string to Prisma enum
function toPrismaRole(role?: string): PrismaUserRole | undefined {
  if (!role) return undefined
  const upper = role.toUpperCase()
  if (upper === 'ADMIN') return PrismaUserRole.ADMIN
  if (upper === 'TEACHER') return PrismaUserRole.TEACHER
  if (upper === 'USER') return PrismaUserRole.USER
  return undefined
}

// Helper to map status string to Prisma enum
function toPrismaStatus(status?: string): PrismaUserStatus | undefined {
  if (!status) return undefined
  const upper = status.toUpperCase()
  if (upper === 'ACTIVE') return PrismaUserStatus.ACTIVE
  if (upper === 'INACTIVE' || upper === 'BLOCKED') return PrismaUserStatus.INACTIVE
  return undefined
}

// GET ALL USERS (ADMIN)
export const getAllUsersService = async (params: GetAllUsersParams, tx?: PrismaTransactionClient) => {
  const { page = 1, limit = 10, role, status, search, sortBy = 'createdAt' } = params

  const prismaRole = toPrismaRole(role)
  const prismaStatus = toPrismaStatus(status)

  const { users, total, page: pageNum, limit: limitNum, totalPages } = await findUsersWithPagination(
    {
      page: Number(page),
      limit: Number(limit),
      search: search ? String(search) : undefined,
      role: prismaRole,
      status: prismaStatus,
      sortBy: String(sortBy),
      sortOrder: 'desc',
      select: USER_ADMIN_SELECT
    },
    tx
  )

  const formattedUsers = users.map((u) => {
    const userWithSocial = {
      id: u.id,
      username: u.username,
      email: u.email,
      role: (u.role || 'USER').toLowerCase(),
      status: (u.status || 'ACTIVE').toLowerCase(),
      avatar: u.avatar || '',
      phone: u.phone || '',
      bio: u.bio || '',
      socialLinks: {
        facebook: u.socialFacebook || '',
        instagram: u.socialInstagram || '',
        github: u.socialGithub || ''
      },
      createdAt: u.createdAt
    }
    return withCompatId(userWithSocial)
  })

  return {
    success: true,
    message: 'Fetched users successfully !',
    data: {
      users: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    }
  }
}

// GET USER DETAIL (ADMIN & PUBLIC PROFILE)
export const getUserDetailService = async ({ id }: { id: string }, tx?: PrismaTransactionClient) => {
  if (!isValidUUID(id)) {
    return { success: false, statusCode: 400, message: 'Invalid user id' }
  }

  const user = await findUserById(id, { select: USER_ADMIN_SELECT }, tx)

  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: (user.role || 'USER').toLowerCase(),
    status: (user.status || 'ACTIVE').toLowerCase(),
    avatar: user.avatar || '',
    phone: user.phone || '',
    bio: user.bio || '',
    socialLinks: {
      facebook: user.socialFacebook || '',
      instagram: user.socialInstagram || '',
      github: user.socialGithub || ''
    },
    createdAt: user.createdAt
  }

  return { success: true, message: 'Get user info successfully !', data: withCompatId(safeUser) }
}

// UPDATE USER BY ADMIN
export const updateUserByAdminService = async (
  { id, payload, performedBy }: { id: string; payload: Record<string, any>; performedBy?: string },
  tx?: PrismaTransactionClient
) => {
  if (!isValidUUID(id)) {
    return { success: false, statusCode: 400, message: 'Invalid user id' }
  }

  const user = await findUserById(id, undefined, tx)
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  if (payload.locked !== undefined && payload.status === undefined) {
    payload.status = payload.locked ? 'inactive' : 'active'
  }

  if (performedBy && user.id === performedBy) {
    if (payload.status) {
      const s = toPrismaStatus(payload.status)
      if (s === PrismaUserStatus.INACTIVE) {
        return {
          success: false,
          statusCode: 400,
          errorCode: 'SELF_LOCK_BLOCKED',
          message: 'Không thể tự khóa hoặc thay đổi vai trò của chính tài khoản quản trị đang đăng nhập'
        }
      }
    }
    if (payload.role) {
      const r = toPrismaRole(payload.role)
      if (r && r !== PrismaUserRole.ADMIN) {
        return {
          success: false,
          statusCode: 400,
          errorCode: 'SELF_DEMOTE_BLOCKED',
          message: 'Không thể tự khóa hoặc thay đổi vai trò của chính tài khoản quản trị đang đăng nhập'
        }
      }
    }
  }

  if (payload.username && payload.username.trim() !== user.username) {
    const exists = await isUsernameTaken(payload.username.trim(), id, tx)
    if (exists) {
      return {
        success: false,
        statusCode: 409,
        errorCode: 'USERNAME_CONFLICT',
        message: 'Username is already in use'
      }
    }
  }

  const updateData: Prisma.UserUpdateInput = {}

  if (payload.username) updateData.username = payload.username.trim()
  if (payload.role) {
    const r = toPrismaRole(payload.role)
    if (r) updateData.role = r
  }
  if (payload.status) {
    const s = toPrismaStatus(payload.status)
    if (s) updateData.status = s
  }
  if (payload.phone !== undefined) updateData.phone = payload.phone
  if (payload.bio !== undefined) updateData.bio = payload.bio
  if (payload.avatar !== undefined) updateData.avatar = payload.avatar

  if (payload.socialLinks && typeof payload.socialLinks === 'object') {
    if (payload.socialLinks.facebook !== undefined) updateData.socialFacebook = payload.socialLinks.facebook
    if (payload.socialLinks.instagram !== undefined) updateData.socialInstagram = payload.socialLinks.instagram
    if (payload.socialLinks.github !== undefined) updateData.socialGithub = payload.socialLinks.github
  }

  const updated = await updateUser(id, updateData, tx)

  const safeUpdated = {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    role: (updated.role || 'USER').toLowerCase(),
    status: (updated.status || 'ACTIVE').toLowerCase(),
    avatar: updated.avatar || '',
    phone: updated.phone || '',
    bio: updated.bio || '',
    socialLinks: {
      facebook: updated.socialFacebook || '',
      instagram: updated.socialInstagram || '',
      github: updated.socialGithub || ''
    },
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  }

  return {
    success: true,
    message: 'User updated successfully',
    data: withCompatId(safeUpdated)
  }
}

// DELETE USER BY ADMIN
export const deleteUserByAdminService = async (
  { id, performedBy }: { id: string; performedBy?: string },
  tx?: PrismaTransactionClient
) => {
  if (!isValidUUID(id)) {
    return { success: false, statusCode: 400, message: 'Invalid user id' }
  }

  const user = await findUserById(id, { select: { id: true, role: true } }, tx)
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  if (performedBy && user.id === performedBy) {
    return {
      success: false,
      statusCode: 400,
      errorCode: 'SELF_DELETE_BLOCKED',
      message: 'Cannot delete your own account'
    }
  }

  if (user.role === PrismaUserRole.ADMIN) {
    const remainingAdmins = await countAdminsExcluding(id, tx)
    if (remainingAdmins === 0) {
      return { success: false, statusCode: 409, errorCode: 'LAST_ADMIN', message: 'Cannot delete the last admin' }
    }
  }

  await deleteUser(id, tx)

  return { success: true, message: 'User deleted successfully' }
}

// CREATE TEACHER (ADMIN)
export const createTeacherService = async ({ payload }: ICreateTeacherInput, tx?: PrismaTransactionClient) => {
  const parseResult = createTeacherPayloadSchema.safeParse(payload)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Invalid teacher input data',
      errors: parseResult.error.flatten().fieldErrors
    }
  }

  const { username, email, password, avatar, phone, bio, socialLinks } = parseResult.data

  const { emailConflict, usernameConflict } = await findUserConflict({ email, username }, tx)

  if (emailConflict || usernameConflict) {
    return {
      success: false,
      statusCode: 409,
      errorCode: emailConflict ? 'EMAIL_CONFLICT' : 'USERNAME_CONFLICT',
      message: emailConflict ? 'Email is already in use' : 'Username is already in use'
    }
  }

  const hashed = await bcrypt.hash(password, 10)

  const newUser = await addUser(
    {
      username,
      email,
      password: hashed,
      avatar: avatar || '',
      phone: phone || null,
      bio: bio || null,
      socialFacebook: socialLinks?.facebook || '',
      socialInstagram: socialLinks?.instagram || '',
      socialGithub: socialLinks?.github || '',
      role: PrismaUserRole.TEACHER,
      status: PrismaUserStatus.ACTIVE,
      isVerified: true
    },
    tx
  )

  const safe = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    avatar: newUser.avatar,
    phone: newUser.phone || '',
    bio: newUser.bio || '',
    socialLinks: {
      facebook: newUser.socialFacebook || '',
      instagram: newUser.socialInstagram || '',
      github: newUser.socialGithub || ''
    },
    role: 'teacher',
    status: 'active',
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt
  }

  return {
    success: true,
    message: 'Teacher created successfully',
    data: withCompatId(safe)
  }
}

// -------- COURSE (ADMIN) ---------

export const updateCourseByAdminService = async (
  {
    courseId,
    payload
  }: {
    courseId: string
    payload: Record<string, any>
  },
  tx?: PrismaTransactionClient
) => {
  if (!courseId || (!isValidUUID(courseId) && !isLegacyObjectId(courseId))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await findCourseByIdRepo(courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const updateData: Prisma.CourseUpdateInput = {}
  if (payload.title) updateData.title = payload.title
  if (payload.description !== undefined) updateData.description = payload.description
  if (payload.image !== undefined) updateData.image = payload.image
  if (payload.intro_url !== undefined) updateData.introUrl = payload.intro_url
  if (payload.category !== undefined) {
    updateData.category = payload.category && isValidUUID(payload.category)
      ? { connect: { id: payload.category } }
      : { disconnect: true }
  }
  if (payload.type !== undefined) updateData.type = toPrismaCourseType(payload.type)
  if (payload.price !== undefined) updateData.price = Number(payload.price)
  if (payload.old_price !== undefined) updateData.oldPrice = Number(payload.old_price)
  if (payload.level !== undefined) updateData.level = toPrismaCourseLevel(payload.level)
  if (payload.view !== undefined) updateData.view = Number(payload.view)
  if (payload.sold !== undefined) updateData.sold = Number(payload.sold)
  if (payload.status !== undefined) updateData.status = toPrismaCourseStatus(payload.status)
  if (payload._destroy !== undefined) updateData.isDestroyed = Boolean(payload._destroy)
  if (payload.info) {
    if (Array.isArray(payload.info.requirements)) updateData.requirements = payload.info.requirements
    if (Array.isArray(payload.info.benefits)) updateData.benefits = payload.info.benefits
    if (Array.isArray(payload.info.techniques)) updateData.techniques = payload.info.techniques
    if (Array.isArray(payload.info.documents)) updateData.documents = payload.info.documents
  }

  const updated = await updateCourseRepo(courseId, updateData, tx)

  return {
    success: true,
    message: 'Course updated successfully (by admin)!',
    data: formatSafeCourse(updated)
  }
}

// delete course by admin (soft-delete)
export const deleteCourseByAdminService = async ({ courseId }: { courseId: string }, tx?: PrismaTransactionClient) => {
  if (!courseId || (!isValidUUID(courseId) && !isLegacyObjectId(courseId))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await findCourseByIdRepo(courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  await softDeleteCourse(courseId, tx)

  return {
    success: true,
    message: 'Course soft-deleted successfully (by admin)!'
  }
}

// get course by admin
export const getCoursesByAdminService = async ({ params }: { params: ListQuery }, tx?: PrismaTransactionClient) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    level,
    type,
    priceMin,
    priceMax,
    sortBy = 'createdAt',
    status,
    author,
    _destroy
  } = params

  const result = await findCoursesWithPaginationRepo<CourseAdminPayload>(
    {
      page: Number(page),
      limit: Number(limit),
      search: search ? String(search) : undefined,
      categoryId: category ? String(category) : undefined,
      level: level ? toPrismaCourseLevel(level as string) : undefined,
      type: type ? toPrismaCourseType(type as string) : undefined,
      status: status ? toPrismaCourseStatus(status as string) : undefined,
      authorId: author ? String(author) : undefined,
      isDestroyed: _destroy !== undefined ? Boolean(_destroy) : undefined,
      priceMin: priceMin !== undefined ? Number(priceMin) : undefined,
      priceMax: priceMax !== undefined ? Number(priceMax) : undefined,
      sortBy: sortBy as string,
      select: COURSE_ADMIN_SELECT
    },
    tx
  )

  return {
    success: true,
    message: 'Fetched all courses successfully!',
    data: {
      courses: result.courses.map((c) => ({
        ...withCompatId(c),
        price: Number(c.price),
        old_price: Number(c.oldPrice),
        oldPrice: Number(c.oldPrice),
        author: c.author ? withCompatId(c.author) : null,
        category: c.category ? withCompatId(c.category) : null,
        _destroy: c.isDestroyed
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    }
  }
}

// update status course for teacher
export const updateCourseStatusForTeacherService = async (
  {
    courseId,
    payload
  }: {
    courseId: string
    payload: Record<string, any>
  },
  tx?: PrismaTransactionClient
) => {
  if (!courseId || (!isValidUUID(courseId) && !isLegacyObjectId(courseId))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await findCourseByIdRepo(courseId, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const previousStatus = course.status
  const targetStatus = payload.status !== undefined ? toPrismaCourseStatus(payload.status) : previousStatus
  const rejectionReason = payload.rejectionReason || payload.reason || null

  const updated = await updateCourseStatus(courseId, targetStatus, { rejectionReason }, tx)

  if (previousStatus !== PrismaCourseStatus.APPROVED && targetStatus === PrismaCourseStatus.APPROVED) {
    const teacherId = course.authorId

    try {
      await pushNotificationService({
        senderId: null,
        receiverId: teacherId,
        type: ENotificationType.COURSE,
        message: `Khóa học "${course.title}" của bạn đã được admin duyệt!`,
        relatedId: course.id
      })
    } catch {
      // Non-blocking notification dispatch
    }
  } else if (previousStatus !== PrismaCourseStatus.REJECTED && targetStatus === PrismaCourseStatus.REJECTED) {
    const teacherId = course.authorId

    try {
      await pushNotificationService({
        senderId: null,
        receiverId: teacherId,
        type: ENotificationType.COURSE,
        message: rejectionReason
          ? `Khóa học "${course.title}" bị từ chối với lý do: ${rejectionReason}`
          : `Khóa học "${course.title}" của bạn đã bị từ chối duyệt.`,
        relatedId: course.id
      })
    } catch {
      // Non-blocking notification dispatch
    }
  }

  return {
    success: true,
    message: 'Course updated successfully (by teacher/admin)!',
    data: formatSafeCourse(updated)
  }
}
