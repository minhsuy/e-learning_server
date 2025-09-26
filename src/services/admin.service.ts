import bcrypt from 'bcryptjs'
import { FilterQuery, Types } from 'mongoose'
import CourseModel from '~/models/course.model'
import UserModel from '~/models/user.model'
import { UserRole, UserStatus } from '~/types/enum'
import { GetAllUsersParams, ICreateTeacherInput, ListQuery } from '~/types/type'

// get all users
export const getAllUsersService = async (params: GetAllUsersParams) => {
  const { page = 1, limit = 10, role, status, search, sortBy = 'createdAt' } = params

  const filter: FilterQuery<typeof UserModel> = {
    isVerified: ''
  }

  if (role) filter.role = role
  if (status) filter.status = status
  if (search) {
    filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
  }

  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .select('-password -refresh_token -reset_password_token -reset_password_expires -isVerified -favorites')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit),
    UserModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched users successfully !',
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

// get user detail
export const getUserDetailService = async ({ id }: { id: string }) => {
  const user = await UserModel.findById(id).select(
    '-password -refresh_token -reset_password_token -reset_password_expires -isVerified -favorites'
  )

  if (!user) {
    return { success: false, message: 'User not found' }
  }

  return { success: true, message: 'Get user info successfully !', data: user }
}

// update
export const updateUserByAdminService = async ({ id, payload }: { id: string; payload: Record<string, any> }) => {
  if (!Types.ObjectId.isValid(id)) {
    return { success: false, statusCode: 400, message: 'Invalid user id' }
  }

  const user = await UserModel.findById(id)
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  const allowedFields = ['username', 'role', 'status', 'phone', 'bio', 'avatar', 'socialLinks']
  const updateData: Record<string, any> = {}

  for (const key of allowedFields) {
    if (typeof payload[key] !== 'undefined' && payload[key] !== null) {
      if (key === 'socialLinks' && typeof payload.socialLinks === 'object') {
        updateData.socialLinks = {
          ...user.socialLinks,
          ...payload.socialLinks
        }
      } else {
        updateData[key] = payload[key]
      }
    }
  }

  if (updateData.username) {
    const exists = await UserModel.findOne({ username: updateData.username, _id: { $ne: id } })
    if (exists) {
      return {
        success: false,
        statusCode: 409,
        errorCode: 'USERNAME_CONFLICT',
        message: 'Username is already in use'
      }
    }
  }

  const updated = await UserModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select(
    '-password -refresh_token -reset_password_token -reset_password_expires'
  )

  return {
    success: true,
    message: 'User updated successfully',
    data: updated
  }
}

// delete user
export const deleteUserByAdminService = async ({ id, performedBy }: { id: string; performedBy?: string }) => {
  if (!Types.ObjectId.isValid(id)) {
    return { success: false, statusCode: 400, message: 'Invalid user id' }
  }

  const user = await UserModel.findById(id).select('_id role')
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  if (performedBy && String(user._id) === String(performedBy)) {
    return {
      success: false,
      statusCode: 400,
      errorCode: 'SELF_DELETE_BLOCKED',
      message: 'Cannot delete your own account'
    }
  }

  if (user.role === UserRole.ADMIN) {
    const remainingAdmins = await UserModel.countDocuments({ role: UserRole.ADMIN, _id: { $ne: id } })
    if (remainingAdmins === 0) {
      return { success: false, statusCode: 409, errorCode: 'LAST_ADMIN', message: 'Cannot delete the last admin' }
    }
  }

  await UserModel.findByIdAndDelete(id)

  return { success: true, message: 'User deleted successfully' }
}

// add teacher

export const createTeacherService = async ({ payload }: ICreateTeacherInput) => {
  const { username, email, password, avatar, phone, bio, socialLinks } = payload

  // Check trùng email/username
  const conflict = await UserModel.findOne({
    $or: [{ email }, { username }]
  }).select('_id email username')

  if (conflict) {
    const isEmail = conflict.email === email
    return {
      success: false,
      statusCode: 409,
      errorCode: isEmail ? 'EMAIL_CONFLICT' : 'USERNAME_CONFLICT',
      message: isEmail ? 'Email is already in use' : 'Username is already in use'
    }
  }

  const hashed = await bcrypt.hash(password, 10)

  const doc = await UserModel.create({
    username,
    email,
    password: hashed,
    avatar: avatar || '',
    phone: phone || '',
    bio: bio || '',
    socialLinks: {
      facebook: socialLinks?.facebook || '',
      instagram: socialLinks?.instagram || '',
      github: socialLinks?.github || ''
    },
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    isVerified: ''
  })

  const {
    password: _pw,
    refresh_token,
    reset_password_token,
    reset_password_expires,
    isVerified,
    ...safe
  } = doc.toObject()

  return {
    success: true,
    message: 'Teacher created successfully',
    data: safe
  }
}

// -------- COURSE ---------

export const updateCourseByAdminService = async ({
  courseId,
  payload
}: {
  courseId: string
  payload: Record<string, any>
}) => {
  if (!Types.ObjectId.isValid(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }
  const course = await CourseModel.findById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (payload.title) course.title = payload.title
  if (payload.description) course.description = payload.description
  if (payload.image) course.image = payload.image
  if (payload.intro_url) course.intro_url = payload.intro_url
  if (payload.category) course.category = payload.category
  if (payload.type) course.type = payload.type
  if (payload.price !== undefined) course.price = payload.price
  if (payload.old_price !== undefined) course.old_price = payload.old_price
  if (payload.level) course.level = payload.level
  if (payload.view !== undefined) course.view = payload.view
  if (payload.sold !== undefined) course.sold = payload.sold
  if (payload.status !== undefined) course.status = payload.status
  if (payload._destroy !== undefined) course._destroy = payload._destroy
  if (payload.info) {
    course.info = {
      ...course.info,
      ...payload.info
    }
  }

  await course.save()

  return {
    success: true,
    message: 'Course updated successfully (by admin)!',
    data: course
  }
}

// delete course by admin

export const deleteCourseByAdminService = async ({ courseId }: { courseId: string }) => {
  if (!Types.ObjectId.isValid(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await CourseModel.findById(courseId)

  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // Soft delete
  course._destroy = true
  await course.save()

  return {
    success: true,
    message: 'Course soft-deleted successfully (by admin)!'
  }
}

// get course by admin

export const getCoursesByAdminService = async ({ params }: { params: ListQuery }) => {
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

  const filter: FilterQuery<typeof CourseModel> = {}

  if (search) {
    filter.$or = [{ title: { $regex: search, $options: 'i' } }]
  }

  if (category) filter.category = category
  if (level) filter.level = level
  if (type) filter.type = type
  if (status) filter.status = status
  if (author) filter.author = author
  if (_destroy !== undefined) filter._destroy = _destroy

  if (priceMin || priceMax) {
    filter.price = {}
    if (priceMin) (filter.price as any).$gte = Number(priceMin)
    if (priceMax) (filter.price as any).$lte = Number(priceMax)
  }

  const skip = (page - 1) * limit

  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .select('title slug status image price old_price level type sold view createdAt updatedAt _destroy')
      .populate({ path: 'author', select: '_id username email avatar role' })
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit),
    CourseModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched all courses successfully!',
    data: {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
