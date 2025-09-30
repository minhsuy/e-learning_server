import { FilterQuery, Types } from 'mongoose'
import CouponModel from '~/models/coupon.model'
import CourseModel from '~/models/course.model'
import { ECouponType, UserRole } from '~/types/enum'

export const createCouponService = async ({
  payload,
  userId,
  role
}: {
  payload: Record<string, any>
  userId: string
  role: string
}) => {
  if (!Types.ObjectId.isValid(userId)) {
    return { success: false, statusCode: 401, message: 'Invalid user' }
  }

  const { title, code, value, type, startDate, endDate, limit, active, courses = [] } = payload

  if (role === UserRole.TEACHER) {
    if (!courses.length) {
      return { success: false, statusCode: 400, message: 'Teacher must assign coupon to at least one course' }
    }

    const teacherCourses = await CourseModel.find({ author: userId }).select('_id')
    const teacherCourseIds = teacherCourses.map((c) => c._id.toString())

    const invalidCourse = courses.find((c: string) => !teacherCourseIds.includes(c))
    if (invalidCourse) {
      return { success: false, statusCode: 403, message: 'You cannot assign coupon to courses you do not own' }
    }
  }

  const coupon = await CouponModel.create({
    title,
    code,
    value,
    type,
    startDate,
    endDate,
    limit,
    courses,
    author: new Types.ObjectId(userId),
    active
  })

  return {
    success: true,
    statusCode: 201,
    message: 'Coupon created successfully',
    data: coupon
  }
}
// update coupon

export const updateCouponService = async ({
  id,
  payload,
  userId,
  role
}: {
  id: string
  payload: Record<string, any>
  userId: string
  role: string
}) => {
  const coupon = await CouponModel.findById(id)
  if (!coupon) {
    return { success: false, statusCode: 404, message: 'Coupon not found' }
  }

  if (role === UserRole.TEACHER && coupon.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You cannot update this coupon' }
  }

  if (payload.title) coupon.title = payload.title
  if (payload.code) coupon.code = payload.code
  if (payload.value !== undefined) coupon.value = payload.value
  if (payload.limit !== undefined) coupon.limit = payload.limit
  if (payload.startDate) coupon.startDate = payload.startDate
  if (payload.endDate) coupon.endDate = payload.endDate
  if (payload.courses) coupon.courses = payload.courses
  if (payload.active !== undefined) coupon.active = payload.active
  if (payload.type) coupon.type = payload.type

  await coupon.save()

  return {
    success: true,
    message: 'Coupon updated successfully',
    data: coupon
  }
}
// delete coupon
export const deleteCouponService = async ({ id, userId, role }: { id: string; userId: string; role: string }) => {
  const coupon = await CouponModel.findById(id)
  if (!coupon) {
    return { success: false, statusCode: 404, message: 'Coupon not found' }
  }

  if (role === UserRole.TEACHER && coupon.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You cannot delete this coupon' }
  }

  await coupon.deleteOne()

  return {
    success: true,
    message: 'Coupon deleted successfully'
  }
}

// get all coupon
export const getCouponsService = async ({ params, userId, role }: { params: any; userId: string; role: string }) => {
  const { page = 1, limit = 10, search, active, sortBy = 'createdAt' } = params

  const filter: FilterQuery<typeof CouponModel> = {}

  if (role === UserRole.TEACHER) {
    filter.author = userId
  }

  if (search) {
    filter.$or = [{ title: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }]
  }

  if (active !== undefined) {
    filter.active = active === 'true'
  }

  const skip = (page - 1) * limit

  const [coupons, total] = await Promise.all([
    CouponModel.find(filter)
      .select('title code active value type startDate endDate limit used courses createdAt updatedAt')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit),
    CouponModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched coupons successfully!',
    data: {
      coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
// get detail coupon
export const getCouponDetailService = async ({ id, userId, role }: { id: string; userId: string; role: string }) => {
  const coupon = await CouponModel.findById(id)
    .populate({ path: 'courses', select: 'title slug price' })
    .populate({ path: 'author', select: 'username role' })

  if (!coupon) {
    return { success: false, statusCode: 404, message: 'Coupon not found' }
  }

  if (role === UserRole.TEACHER && coupon.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You cannot view this coupon' }
  }

  return {
    success: true,
    message: 'Fetched coupon detail successfully',
    data: coupon
  }
}
// check coupon to use
export const checkCouponService = async ({ code, courseId }: { code: string; courseId: string }) => {
  const coupon = await CouponModel.findOne({ code }).populate({
    path: 'courses',
    select: '_id title price'
  })

  if (!coupon) {
    return { success: false, statusCode: 404, message: 'Coupon not found or inactive' }
  }

  const now = new Date()
  if (coupon.startDate && coupon.startDate > now) {
    return { success: false, statusCode: 400, message: 'Coupon has not started yet' }
  }
  if (coupon.endDate && coupon.endDate < now) {
    return { success: false, statusCode: 400, message: 'Coupon has expired' }
  }

  if (coupon.limit && coupon.used >= coupon.limit) {
    return { success: false, statusCode: 400, message: 'Coupon usage limit reached' }
  }

  if (coupon.courses.length > 0) {
    const validCourse = coupon.courses.find((c: any) => c._id.toString() === courseId)
    if (!validCourse) {
      return { success: false, statusCode: 400, message: 'Coupon not valid for this course' }
    }
  }

  const course = await CourseModel.findById(courseId).select('price')
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  let discount = 0
  if (coupon.type === ECouponType.PERCENTAGE) {
    discount = (course.price * coupon.value) / 100
  } else {
    discount = coupon.value
  }

  const finalPrice = Math.max(course.price - discount, 0)

  return {
    success: true,
    message: 'Coupon is valid',
    data: {
      courseId,
      coursePrice: course.price,
      discount,
      finalPrice,
      coupon: {
        _id: coupon._id,
        title: coupon.title,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      }
    }
  }
}
