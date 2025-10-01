import { FilterQuery, Types } from 'mongoose'
import OrderModel from '~/models/order.model'
import CourseModel from '~/models/course.model'
import CouponModel from '~/models/coupon.model'
import { ECouponType, EOrderStatus, UserRole } from '~/types/enum'
import UserModel from '~/models/user.model'

export const createOrderService = async ({
  userId,
  courseId,
  couponCode = undefined
}: {
  userId: string
  courseId: string
  couponCode?: string
}) => {
  const course = await CourseModel.findById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (course.author.toString() === userId) {
    return { success: false, statusCode: 400, message: 'You cannot buy your own course' }
  }

  const existingOrder = await OrderModel.findOne({
    user: userId,
    course: courseId,
    status: EOrderStatus.COMPLETED
  })
  if (existingOrder) {
    return { success: false, statusCode: 400, message: 'You already enrolled in this course' }
  }

  const pendingOrder = await OrderModel.findOne({
    user: userId,
    course: courseId,
    status: EOrderStatus.PENDING
  })
  if (pendingOrder) {
    return {
      success: false,
      statusCode: 400,
      message: 'You already have a pending order for this course',
      data: pendingOrder
    }
  }

  // Total
  let total = course.price
  let discount = 0
  let coupon: any = null

  if (couponCode) {
    coupon = await CouponModel.findOne({ code: couponCode, active: true })
    if (!coupon) {
      return { success: false, statusCode: 400, message: 'Invalid coupon code' }
    }

    if (coupon.limit && coupon.used >= coupon.limit) {
      return { success: false, statusCode: 400, message: 'Coupon usage limit reached' }
    }

    const now = new Date()
    if (coupon.startDate && coupon.startDate > now) {
      return { success: false, statusCode: 400, message: 'Coupon not started yet' }
    }
    if (coupon.endDate && coupon.endDate < now) {
      return { success: false, statusCode: 400, message: 'Coupon expired' }
    }

    // Check coupon apply to course
    if (coupon.courses.length > 0 && !coupon.courses.includes(course._id)) {
      return { success: false, statusCode: 400, message: 'Coupon not valid for this course' }
    }

    // Tính discount
    if (coupon.type === ECouponType.PERCENTAGE) {
      discount = Math.floor((course.price * coupon.value) / 100)
    } else {
      discount = coupon.value
    }

    if (discount > total) discount = total
    total = total - discount

    coupon.used += 1
    await coupon.save()
  }

  // Free course
  const status = total === 0 ? EOrderStatus.COMPLETED : EOrderStatus.PENDING

  const orderCode = `DH-${Date.now().toString().slice(6)}`

  const order = await OrderModel.create({
    code: orderCode,
    total,
    discount,
    coupon: coupon?._id,
    course: new Types.ObjectId(courseId),
    user: new Types.ObjectId(userId),
    status
  })

  if (status === EOrderStatus.COMPLETED) {
    await Promise.all([
      UserModel.findByIdAndUpdate(userId, { $addToSet: { courses: courseId } }),
      CourseModel.findByIdAndUpdate(courseId, { $inc: { sold: 1 } })
    ])
  }

  return {
    success: true,
    message: 'Order created successfully',
    data: order
  }
}

// get my orders

export const getMyOrdersService = async ({
  userId,
  page = 1,
  limit = 10,
  status
}: {
  userId: string
  page?: number
  limit?: number
  status?: string
}) => {
  const filter: FilterQuery<typeof OrderModel> = { user: userId }
  if (status) filter.status = status

  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .populate({ path: 'course', select: 'title slug image price' })
      .populate({ path: 'coupon', select: 'code value type' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    OrderModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched my orders successfully',
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

// update order status (teacher or admin)

export const updateOrderStatusService = async ({
  orderId,
  status,
  userId,
  role
}: {
  orderId: string
  status: EOrderStatus
  userId: string
  role: string
}) => {
  const order = await OrderModel.findById(orderId).populate('course')
  if (!order) {
    return { success: false, statusCode: 404, message: 'Order not found' }
  }

  if (role === UserRole.TEACHER) {
    const course = order.course as any
    if (course.author.toString() !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  if (status === EOrderStatus.REJECTED) {
    if (order.status === EOrderStatus.COMPLETED) {
      const ops: Promise<any>[] = [
        UserModel.findByIdAndUpdate(order.user, { $pull: { courses: order.course } }),
        CourseModel.findByIdAndUpdate(order.course, { $inc: { sold: -1 } })
      ]
      if (order.coupon) {
        ops.push(CouponModel.findByIdAndUpdate(order.coupon, { $inc: { used: -1 } }))
      }
      await Promise.all(ops)
    }

    await OrderModel.findByIdAndDelete(orderId)
    return {
      success: true,
      message: 'Order rejected and deleted successfully!'
    }
  }

  if (status === EOrderStatus.COMPLETED) {
    const ops: Promise<any>[] = [
      UserModel.findByIdAndUpdate(order.user, { $addToSet: { courses: order.course } }),
      CourseModel.findByIdAndUpdate(order.course, { $inc: { sold: 1 } })
    ]
    if (order.coupon) {
      ops.push(CouponModel.findByIdAndUpdate(order.coupon, { $inc: { used: 1 } }))
    }

    order.status = EOrderStatus.COMPLETED
    ops.push(order.save())

    await Promise.all(ops)
    return {
      success: true,
      message: 'Order completed successfully!'
    }
  }
  order.status = status
  await order.save()
  return {
    success: true,
    message: `Order updated to ${status}`
  }
}

// get orders by admin/ teacher
export const getOrdersService = async ({
  page = 1,
  limit = 10,
  search,
  status,
  sortBy = 'createdAt',
  userId,
  role
}: {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string
  userId: string
  role: string
}) => {
  const filter: FilterQuery<typeof OrderModel> = {}

  if (status) filter.status = status

  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: 'i' } },
      { 'course.title': { $regex: search, $options: 'i' } },
      { 'user.username': { $regex: search, $options: 'i' } }
    ]
  }

  if (role === UserRole.TEACHER) {
    const teacherCourses = await CourseModel.find({ author: new Types.ObjectId(userId) }).select('_id')
    filter.course = { $in: teacherCourses.map((c) => c._id) }
  }

  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .populate('user', 'username email')
      .populate('course', 'title price')
      .populate('coupon', 'code value type')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit),
    OrderModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched orders successfully!',
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
