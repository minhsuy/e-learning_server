import { EOrderStatus, Order, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: ORDER
 * 
 * Provides database operations on PostgreSQL `orders` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const ORDER_COURSE_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  price: true
} as const satisfies Prisma.CourseSelect

export const ORDER_COUPON_SELECT = {
  id: true,
  code: true,
  value: true,
  type: true
} as const satisfies Prisma.CouponSelect

export const ORDER_USER_SELECT = {
  id: true,
  username: true,
  email: true
} as const satisfies Prisma.UserSelect

export const ORDER_DETAIL_SELECT = {
  id: true,
  code: true,
  amount: true,
  discount: true,
  total: true,
  status: true,
  couponId: true,
  courseId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  course: {
    select: ORDER_COURSE_SELECT
  },
  coupon: {
    select: ORDER_COUPON_SELECT
  },
  user: {
    select: ORDER_USER_SELECT
  }
} as const satisfies Prisma.OrderSelect

export type OrderDetailPayload = Prisma.OrderGetPayload<{
  select: typeof ORDER_DETAIL_SELECT
}>

export const ORDER_PUBLIC_SELECT = {
  id: true,
  code: true,
  amount: true,
  discount: true,
  total: true,
  status: true,
  couponId: true,
  courseId: true,
  userId: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.OrderSelect

export type OrderPublicPayload = Prisma.OrderGetPayload<{
  select: typeof ORDER_PUBLIC_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Create a new order record.
 */
export const createOrder = async (
  data: {
    code: string
    amount: number
    discount?: number
    total: number
    couponId?: string | null
    courseId?: string | null
    userId: string
    status?: EOrderStatus
  },
  tx?: PrismaTransactionClient
): Promise<OrderDetailPayload> => {
  const client = tx || prisma
  return client.order.create({
    data: {
      code: data.code,
      amount: new Prisma.Decimal(data.amount),
      discount: new Prisma.Decimal(data.discount ?? 0),
      total: new Prisma.Decimal(data.total),
      couponId: data.couponId ?? null,
      courseId: data.courseId ?? null,
      userId: data.userId,
      status: data.status ?? EOrderStatus.PENDING
    },
    select: ORDER_DETAIL_SELECT
  })
}

/**
 * Find order by UUID with populated relations.
 * Safely handles orphan orders where `course` is null.
 */
export const findOrderById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<OrderDetailPayload | null> => {
  const client = tx || prisma
  return client.order.findUnique({
    where: { id },
    select: ORDER_DETAIL_SELECT
  })
}

/**
 * Find order by unique order code.
 */
export const findOrderByCode = async (
  code: string,
  tx?: PrismaTransactionClient
): Promise<OrderDetailPayload | null> => {
  const client = tx || prisma
  return client.order.findUnique({
    where: { code },
    select: ORDER_DETAIL_SELECT
  })
}

/**
 * Check if a user already owns a course via a completed order.
 */
export const checkExistingCompletedOrder = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Order | null> => {
  const client = tx || prisma
  return client.order.findFirst({
    where: {
      userId,
      courseId,
      status: EOrderStatus.COMPLETED
    }
  })
}

/**
 * Check if a user has a pending order for a specific course.
 */
export const checkExistingPendingOrder = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Order | null> => {
  const client = tx || prisma
  return client.order.findFirst({
    where: {
      userId,
      courseId,
      status: EOrderStatus.PENDING
    }
  })
}

/**
 * Find my orders with optional status filter, sorted newest first, with pagination.
 */
export const findMyOrders = async (
  params: {
    userId: string
    page?: number
    limit?: number
    status?: EOrderStatus
  },
  tx?: PrismaTransactionClient
): Promise<OrderDetailPayload[]> => {
  const client = tx || prisma
  const { userId, page = 1, limit = 10, status } = params
  const skip = (page - 1) * limit

  return client.order.findMany({
    where: {
      userId,
      ...(status && { status })
    },
    select: ORDER_DETAIL_SELECT,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Count total orders for my orders listing.
 */
export const countMyOrders = async (
  params: {
    userId: string
    status?: EOrderStatus
  },
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const { userId, status } = params
  return client.order.count({
    where: {
      userId,
      ...(status && { status })
    }
  })
}

/**
 * Find orders for Admin or Teacher view with search, filter, and pagination.
 */
export const findOrdersWithFilter = async (
  params: {
    page?: number
    limit?: number
    search?: string
    status?: EOrderStatus
    sortBy?: 'createdAt' | 'updatedAt' | 'total'
    teacherCourseIds?: string[]
  },
  tx?: PrismaTransactionClient
): Promise<OrderDetailPayload[]> => {
  const client = tx || prisma
  const { page = 1, limit = 10, search, status, sortBy = 'createdAt', teacherCourseIds } = params
  const skip = (page - 1) * limit

  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(teacherCourseIds && {
      courseId: { in: teacherCourseIds }
    }),
    ...(search && {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { course: { title: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } }
      ]
    })
  }

  return client.order.findMany({
    where,
    select: ORDER_DETAIL_SELECT,
    skip,
    take: limit,
    orderBy: { [sortBy]: 'desc' }
  })
}

/**
 * Count total orders matching admin/teacher filter criteria.
 */
export const countOrdersWithFilter = async (
  params: {
    search?: string
    status?: EOrderStatus
    teacherCourseIds?: string[]
  },
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const { search, status, teacherCourseIds } = params

  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(teacherCourseIds && {
      courseId: { in: teacherCourseIds }
    }),
    ...(search && {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { course: { title: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } }
      ]
    })
  }

  return client.order.count({ where })
}

/**
 * Update order status.
 */
export const updateOrderStatus = async (
  id: string,
  status: EOrderStatus,
  tx?: PrismaTransactionClient
): Promise<OrderDetailPayload> => {
  const client = tx || prisma
  return client.order.update({
    where: { id },
    data: { status },
    select: ORDER_DETAIL_SELECT
  })
}

/**
 * Delete an order by UUID.
 * Used when an order is REJECTED (Preserving Legacy MongoDB hard-delete behavior per Owner decision).
 */
export const deleteOrderById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Order | null> => {
  const client = tx || prisma
  try {
    return await client.order.delete({
      where: { id }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}
