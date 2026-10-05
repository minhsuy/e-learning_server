import { CourseStatus, ECouponType, EOrderStatus } from '@prisma/client'
import { ENotificationType, UserRole } from '~/types/enum'
import { prisma } from '~/config/prisma'
import {
  checkExistingCompletedOrder,
  checkExistingPendingOrder,
  countMyOrders,
  countOrdersWithFilter,
  createOrder,
  deleteOrderById,
  findMyOrders,
  findOrderById,
  findOrdersWithFilter,
  updateOrderStatus
} from '~/repositories/order.repository'
import {
  decrementCouponUsed,
  findCouponWithCoursesByCode,
  incrementCouponUsed
} from '~/repositories/coupon.repository'
import {
  findCourseById,
  findCoursesWithPagination,
  incrementCourseSoldCount
} from '~/repositories/course.repository'

/**
 * Map status string to Prisma EOrderStatus enum
 */
export const toPrismaOrderStatus = (status?: string): EOrderStatus => {
  if (!status) return EOrderStatus.PENDING
  const upper = String(status).toUpperCase()
  if (upper === 'COMPLETED') return EOrderStatus.COMPLETED
  if (upper === 'REJECTED') return EOrderStatus.REJECTED
  return EOrderStatus.PENDING
}
import {
  deleteEnrollment,
  upsertEnrollment
} from '~/repositories/enrollment.repository'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { ServiceResponse } from '~/types/type'
import { pushNotificationService } from './notification.service'
import {
  findCourseGroupConversation,
  createConversationWithParticipants
} from '~/repositories/conversation.repository'
import { addParticipant } from '~/repositories/conversationParticipant.repository'


/**
 * Format order entity for API response, converting Decimal types to Numbers
 * and adding MongoDB backward-compatible `_id` aliases.
 * Safely handles orphan orders where `course` is null.
 */
const formatOrderResponse = (order: any) => {
  return {
    ...withCompatId(order),
    amount: Number(order.amount),
    discount: Number(order.discount),
    total: Number(order.total),
    course: order.course
      ? {
          ...withCompatId(order.course),
          price: Number(order.course.price)
        }
      : null,
    coupon: order.coupon
      ? {
          ...withCompatId(order.coupon),
          value: Number(order.coupon.value)
        }
      : null,
    user: order.user ? withCompatId(order.user) : null
  }
}

/**
 * Create a new order (with optional coupon and free course handling).
 */
export const createOrderService = async (params: {
  userId: string
  payload?: {
    courseId: string
    couponCode?: string
  }
  courseId?: string
  couponCode?: string
}): Promise<ServiceResponse> => {
  const userId = params.userId
  const courseId = params.courseId || params.payload?.courseId || ''
  const couponCode = params.couponCode || params.payload?.couponCode

  if (!isValidUUID(userId)) {
    return { success: false, statusCode: 401, message: 'Invalid user' }
  }
  if (!isValidUUID(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Course ID' }
  }

  // 1. Verify course existence
  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 2. Reject destroyed / soft-deleted courses
  if (course.isDestroyed) {
    return { success: false, statusCode: 400, message: 'Course is deleted or no longer available' }
  }

  // 3. Reject pending approval courses
  if (course.status === CourseStatus.PENDING || String(course.status).toUpperCase() === 'PENDING') {
    return { success: false, statusCode: 400, message: 'Course is pending approval and cannot be ordered' }
  }

  // 4. Prevent purchasing own course
  if (course.authorId === userId) {
    return { success: false, statusCode: 400, message: 'You cannot buy your own course' }
  }

  // 3. Prevent duplicate completed order
  const existingOrder = await checkExistingCompletedOrder(userId, courseId)
  if (existingOrder) {
    return { success: false, statusCode: 400, message: 'You already enrolled in this course' }
  }

  // 4. Prevent duplicate pending order
  const pendingOrder = await checkExistingPendingOrder(userId, courseId)
  if (pendingOrder) {
    return {
      success: false,
      statusCode: 400,
      message: 'You already have a pending order for this course',
      data: formatOrderResponse(pendingOrder)
    }
  }

  // 5. Coupon calculation
  let discount = 0
  let couponRecord: any = null

  if (couponCode && couponCode.trim()) {
    const coupon = await findCouponWithCoursesByCode(couponCode.trim())
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
      const isEligible = coupon.courses.some((c) => c.courseId === courseId)
      if (!isEligible) {
        return { success: false, statusCode: 400, message: 'Coupon not valid for this course' }
      }
    }

    const coursePrice = Number(course.price)
    const couponValue = Number(coupon.value)

    if (coupon.type === ECouponType.PERCENTAGE) {
      discount = (coursePrice * couponValue) / 100
    } else {
      discount = couponValue
    }
    couponRecord = coupon
  }

  const coursePrice = Number(course.price)
  const total = Math.max(coursePrice - discount, 0)
  const status = total === 0 ? EOrderStatus.COMPLETED : EOrderStatus.PENDING
  const orderCode = `DH-${Date.now().toString().slice(6)}`

  // 6. Execute PostgreSQL transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await createOrder(
      {
        code: orderCode,
        amount: coursePrice,
        discount,
        total,
        couponId: couponRecord?.id ?? null,
        courseId,
        userId,
        status
      },
      tx
    )

    if (status === EOrderStatus.COMPLETED) {
      // Free order: immediately activate enrollment and increment sold count
      await incrementCourseSoldCount(courseId, 1, tx)
      await upsertEnrollment(userId, courseId, { progress: 0, status: 'ACTIVE' as any }, tx)
      if (couponRecord) {
        await incrementCouponUsed(couponRecord.id, 1, tx)
      }
    }

    return newOrder
  })



  // 8. Push notification to course author
  try {
    await pushNotificationService({
      senderId: userId,
      receiverId: course.authorId,
      type: ENotificationType.ORDER,
      message: `Học viên vừa đăng ký khóa học "${course.title}"`,
      relatedId: order.id
    })
  } catch (err) {
    console.error('[Notification Error in createOrderService]:', err)
  }

  return {
    success: true,
    statusCode: 201,
    message: 'Order created successfully',
    data: formatOrderResponse(order)
  }
}

/**
 * Get orders belonging to the current user.
 */
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
}): Promise<ServiceResponse> => {
  if (!isValidUUID(userId)) {
    return { success: false, statusCode: 401, message: 'Invalid user' }
  }

  const orderStatus = status ? toPrismaOrderStatus(status) : undefined

  const [orders, total] = await Promise.all([
    findMyOrders({
      userId,
      page: Number(page),
      limit: Number(limit),
      status: orderStatus
    }),
    countMyOrders({
      userId,
      status: orderStatus
    })
  ])

  return {
    success: true,
    message: 'Fetched my orders successfully',
    data: {
      orders: orders.map(formatOrderResponse),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1
      }
    }
  }
}

/**
 * Update order status (for Teacher or Admin).
 * Preserves legacy MongoDB hard-delete behavior when status is REJECTED per Owner approval.
 */
export const updateOrderStatusService = async (params: {
  id?: string
  orderId?: string
  payload?: { status: EOrderStatus | string }
  status?: EOrderStatus | string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const orderId = params.id || params.orderId || ''
  const rawStatus = params.status || params.payload?.status || ''
  const { userId, role } = params
  const isTeacher = String(role).toLowerCase() === 'teacher'

  if (!isValidUUID(orderId)) {
    return { success: false, statusCode: 400, message: 'Invalid Order ID' }
  }

  const targetStatus = toPrismaOrderStatus(rawStatus as string)

  const order = await findOrderById(orderId)
  if (!order) {
    return { success: false, statusCode: 404, message: 'Order not found' }
  }

  // Idempotency guard: prevent duplicate processing and duplicate notifications if order is already in target status
  if (order.status === targetStatus) {
    return {
      success: true,
      message: `Order status is already ${targetStatus}`,
      data: formatOrderResponse(order)
    }
  }

  // ==========================================
  // Defensive guard for historical orphan orders (course is null)
  // ==========================================
  if (!order.course || !order.courseId) {
    if (isTeacher) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not the owner of this course or the course no longer exists'
      }
    }

    if (targetStatus === EOrderStatus.COMPLETED) {
      return {
        success: false,
        statusCode: 400,
        message: 'Cannot mark order as completed because its course no longer exists'
      }
    }

    if (targetStatus === EOrderStatus.REJECTED && order.status === EOrderStatus.COMPLETED) {
      return {
        success: false,
        statusCode: 400,
        message: 'Cannot rollback or reject a completed order whose course no longer exists'
      }
    }

    if (targetStatus === EOrderStatus.REJECTED) {
      await prisma.$transaction(async (tx) => {
        if (order.couponId) {
          await decrementCouponUsed(order.couponId, 1, tx)
        }
        await deleteOrderById(orderId, tx)
      })

      return {
        success: true,
        message: 'Orphan pending order rejected and deleted successfully!'
      }
    }

    const updated = await updateOrderStatus(orderId, targetStatus)
    return {
      success: true,
      message: `Order updated to ${targetStatus}`,
      data: formatOrderResponse(updated)
    }
  }

  // ==========================================
  // Normal order verification
  // ==========================================
  const course = await findCourseById(order.courseId)
  if (isTeacher) {
    if (!course || course.authorId !== userId) {
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
    }
  }

  // ==========================================
  // Handle REJECTED (Preserve Legacy Hard Delete per Owner Decision)
  // ==========================================
  if (targetStatus === EOrderStatus.REJECTED) {
    await prisma.$transaction(async (tx) => {
      if (order.status === EOrderStatus.COMPLETED) {
        // Rollback sold count and enrollment on PostgreSQL
        await incrementCourseSoldCount(order.courseId!, -1, tx)
        await deleteEnrollment(order.userId, order.courseId!, tx)
        if (order.couponId) {
          await decrementCouponUsed(order.couponId, 1, tx)
        }
      }
      await deleteOrderById(orderId, tx)
    })



    return {
      success: true,
      message: 'Order rejected and deleted successfully!'
    }
  }

  // ==========================================
  // Handle COMPLETED
  // ==========================================
  if (targetStatus === EOrderStatus.COMPLETED) {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Increment sold count
      await incrementCourseSoldCount(order.courseId!, 1, tx)

      // 2. Upsert enrollment
      await upsertEnrollment(order.userId, order.courseId!, { progress: 0, status: 'ACTIVE' as any }, tx)

      // 3. Increment coupon usage if used
      if (order.couponId) {
        await incrementCouponUsed(order.couponId, 1, tx)
      }

      // 4. Update status to COMPLETED
      return updateOrderStatus(orderId, EOrderStatus.COMPLETED, tx)
    })



    // 6. Join or create group conversation in PostgreSQL (Phase 9 Chat Migration)
    try {
      const courseConversation = await findCourseGroupConversation(order.courseId)

      if (courseConversation) {
        await addParticipant(courseConversation.id, order.userId)
      } else {
        const participants = [order.userId]
        if (course?.authorId) {
          participants.push(course.authorId)
        }
        await createConversationWithParticipants(
          {
            courseId: order.courseId,
            name: `Q&A - ${course?.title || 'Course'}`,
            isGroup: true
          },
          participants
        )
      }
    } catch (err) {
      console.error('[Conversation Integration Error in updateOrderStatusService]:', err)
    }

    // 7. Push notification to student
    try {
      await pushNotificationService({
        senderId: null,
        receiverId: order.userId,
        type: ENotificationType.ORDER,
        message: `Đơn hàng "${order.code}" của bạn đã được hoàn tất !`,
        relatedId: order.id
      })
    } catch (err) {
      console.error('[Notification Error in updateOrderStatusService]:', err)
    }

    return {
      success: true,
      message: 'Order completed successfully!',
      data: formatOrderResponse(updated)
    }
  }

  // Other status transitions
  const updated = await updateOrderStatus(orderId, targetStatus)
  return {
    success: true,
    message: `Order updated to ${targetStatus}`,
    data: formatOrderResponse(updated)
  }
}

/**
 * Get orders list for Admin or Teacher with search, filter, and pagination.
 */
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
}): Promise<ServiceResponse> => {
  let teacherCourseIds: string[] | undefined

  if (role === UserRole.TEACHER) {
    const teacherCourses = await findCoursesWithPagination({
      authorId: userId,
      limit: 1000
    })
    teacherCourseIds = teacherCourses.courses.map((c: any) => c.id)
  }

  const orderStatus = status ? toPrismaOrderStatus(status) : undefined

  const [orders, total] = await Promise.all([
    findOrdersWithFilter({
      page: Number(page),
      limit: Number(limit),
      search: search ? String(search).trim() : undefined,
      status: orderStatus,
      sortBy: sortBy as any,
      teacherCourseIds
    }),
    countOrdersWithFilter({
      search: search ? String(search).trim() : undefined,
      status: orderStatus,
      teacherCourseIds
    })
  ])

  return {
    success: true,
    message: 'Fetched orders successfully!',
    data: {
      orders: orders.map(formatOrderResponse),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1
      }
    }
  }
}
