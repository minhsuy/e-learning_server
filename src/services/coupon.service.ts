import { ECouponType } from '@prisma/client'
import { UserRole } from '~/types/enum'
import {
  countCoupons,
  createCoupon,
  deleteCouponById,
  findCouponByCode,
  findCouponById,
  findCouponWithCoursesByCode,
  listCoupons,
  updateCoupon
} from '~/repositories/coupon.repository'
import { findCourseById, findCoursesWithPagination } from '~/repositories/course.repository'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { ServiceResponse } from '~/types/type'

/**
 * Format a coupon payload for public/admin response, ensuring Decimal to Number conversion
 * and MongoDB backward-compatible `_id` alias.
 */
const formatCouponResponse = (coupon: any) => {
  return {
    ...withCompatId(coupon),
    value: Number(coupon.value),
    courses: coupon.courses
      ? coupon.courses.map((c: any) => {
          if (c.course) {
            return {
              ...withCompatId(c.course),
              price: Number(c.course.price)
            }
          }
          return c.courseId || c
        })
      : [],
    author: coupon.author ? withCompatId(coupon.author) : coupon.authorId || null
  }
}

const toPrismaCouponType = (type?: string): 'PERCENTAGE' | 'NUMBER' => {
  if (type && String(type).toUpperCase() === 'NUMBER') {
    return 'NUMBER'
  }
  return 'PERCENTAGE'
}

export const createCouponService = async ({
  payload,
  userId,
  role
}: {
  payload: Record<string, any>
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  if (!isValidUUID(userId)) {
    return { success: false, statusCode: 401, message: 'Invalid user' }
  }

  const { title, code, value, type, startDate, endDate, limit, active, courses = [] } = payload
  const isTeacher = String(role).toLowerCase() === 'teacher'

  // Validate teacher ownership of assigned courses
  if (isTeacher) {
    if (!courses.length) {
      return { success: false, statusCode: 400, message: 'Teacher must assign coupon to at least one course' }
    }

    const teacherCourses = await findCoursesWithPagination({
      authorId: userId,
      limit: 1000
    })
    const teacherCourseIds = teacherCourses.courses.map((c: any) => c.id)

    const invalidCourse = courses.find((c: string) => !teacherCourseIds.includes(c))
    if (invalidCourse) {
      return { success: false, statusCode: 403, message: 'You cannot assign coupon to courses you do not own' }
    }
  }

  // Check unique coupon code
  const existingCoupon = await findCouponByCode(code)
  if (existingCoupon) {
    return { success: false, statusCode: 400, message: 'Coupon code already exists' }
  }

  const coupon = await createCoupon({
    title,
    code,
    value: Number(value),
    type: toPrismaCouponType(type),
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    limit: limit !== undefined ? Number(limit) : null,
    active: active ?? false,
    authorId: userId,
    courses
  })

  return {
    success: true,
    statusCode: 201,
    message: 'Coupon created successfully',
    data: formatCouponResponse(coupon)
  }
}

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
}): Promise<ServiceResponse> => {
  if (!isValidUUID(id)) {
    return { success: false, statusCode: 400, message: 'Invalid Coupon ID' }
  }

  const coupon = await findCouponById(id)
  if (!coupon) {
    return { success: false, statusCode: 404, message: 'Coupon not found' }
  }

  const isTeacher = String(role).toLowerCase() === 'teacher'
  if (isTeacher && coupon.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You cannot update this coupon' }
  }

  // If code is being changed, verify uniqueness
  if (payload.code && payload.code !== coupon.code) {
    const existing = await findCouponByCode(payload.code)
    if (existing && existing.id !== id) {
      return { success: false, statusCode: 400, message: 'Coupon code already exists' }
    }
  }

  // If teacher is updating courses, verify ownership
  if (isTeacher && payload.courses) {
    const teacherCourses = await findCoursesWithPagination({
      authorId: userId,
      limit: 1000
    })
    const teacherCourseIds = teacherCourses.courses.map((c: any) => c.id)

    const invalidCourse = payload.courses.find((c: string) => !teacherCourseIds.includes(c))
    if (invalidCourse) {
      return { success: false, statusCode: 403, message: 'You cannot assign coupon to courses you do not own' }
    }
  }

  const updated = await updateCoupon(id, {
    title: payload.title,
    code: payload.code,
    value: payload.value !== undefined ? Number(payload.value) : undefined,
    type: payload.type !== undefined ? toPrismaCouponType(payload.type) : undefined,
    limit: payload.limit !== undefined ? Number(payload.limit) : undefined,
    startDate: payload.startDate ? new Date(payload.startDate) : undefined,
    endDate: payload.endDate ? new Date(payload.endDate) : undefined,
    active: payload.active,
    courses: payload.courses
  })

  return {
    success: true,
    message: 'Coupon updated successfully',
    data: formatCouponResponse(updated)
  }
}

export const deleteCouponService = async ({
  id,
  userId,
  role
}: {
  id: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  if (!isValidUUID(id)) {
    return { success: false, statusCode: 400, message: 'Invalid Coupon ID' }
  }

  const coupon = await findCouponById(id)
  if (!coupon) {
    return { success: false, statusCode: 404, message: 'Coupon not found' }
  }

  if (role === UserRole.TEACHER && coupon.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You cannot delete this coupon' }
  }

  await deleteCouponById(id)

  return {
    success: true,
    message: 'Coupon deleted successfully'
  }
}

export const getCouponsService = async ({
  params,
  userId,
  role
}: {
  params: any
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const { page = 1, limit = 10, search, active, sortBy = 'createdAt' } = params

  const authorId = role === UserRole.TEACHER ? userId : undefined
  const activeBool = active !== undefined ? active === 'true' || active === true : undefined

  const [coupons, total] = await Promise.all([
    listCoupons({
      page: Number(page),
      limit: Number(limit),
      search,
      active: activeBool,
      authorId,
      sortBy: sortBy as any
    }),
    countCoupons({
      search,
      active: activeBool,
      authorId
    })
  ])

  return {
    success: true,
    message: 'Fetched coupons successfully!',
    data: {
      coupons: coupons.map((c) => ({
        ...withCompatId(c),
        value: Number(c.value),
        courses: c.courses.map((item) => item.courseId)
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  }
}

export const getCouponDetailService = async ({
  id,
  userId,
  role
}: {
  id: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  if (!isValidUUID(id)) {
    return { success: false, statusCode: 400, message: 'Invalid Coupon ID' }
  }

  const coupon = await findCouponById(id)
  if (!coupon) {
    return { success: false, statusCode: 404, message: 'Coupon not found' }
  }

  const isTeacher = String(role).toLowerCase() === 'teacher'
  if (isTeacher && coupon.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You cannot view this coupon' }
  }

  return {
    success: true,
    message: 'Fetched coupon detail successfully',
    data: formatCouponResponse(coupon)
  }
}

export const checkCouponService = async ({
  code,
  courseId
}: {
  code: string
  courseId: string
}): Promise<ServiceResponse> => {
  if (!isValidUUID(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Course ID' }
  }

  const coupon = await findCouponWithCoursesByCode(code)
  if (!coupon || !coupon.active) {
    return { success: false, statusCode: 404, message: 'Coupon not found or inactive' }
  }

  const now = new Date()
  if (coupon.startDate && coupon.startDate > now) {
    return { success: false, statusCode: 400, message: 'Coupon has not started yet' }
  }
  if (coupon.endDate && coupon.endDate < now) {
    return { success: false, statusCode: 400, message: 'Coupon has expired' }
  }

  if (coupon.limit !== null && coupon.limit !== undefined && coupon.used >= coupon.limit) {
    return { success: false, statusCode: 400, message: 'Coupon usage limit reached' }
  }

  if (coupon.courses.length > 0) {
    const validCourse = coupon.courses.find((c) => c.courseId === courseId)
    if (!validCourse) {
      return { success: false, statusCode: 400, message: 'Coupon not valid for this course' }
    }
  }

  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const coursePrice = Number(course.price)
  const couponValue = Number(coupon.value)
  let discount = 0

  const isPercentage = String(coupon.type).toLowerCase() === 'percentage'
  if (isPercentage) {
    discount = (coursePrice * couponValue) / 100
  } else {
    discount = couponValue
  }

  const finalPrice = Math.max(coursePrice - discount, 0)

  return {
    success: true,
    message: 'Coupon is valid',
    data: {
      courseId,
      coursePrice,
      discount,
      finalPrice,
      coupon: {
        _id: coupon.id,
        id: coupon.id,
        title: coupon.title,
        code: coupon.code,
        type: coupon.type,
        value: couponValue
      }
    }
  }
}
