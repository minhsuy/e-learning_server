import { Coupon, ECouponType, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: COUPON & COUPON_COURSE
 * 
 * Provides database operations on PostgreSQL `coupons` and `coupon_courses` tables via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const COUPON_COURSE_DETAIL_SELECT = {
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      price: true
    }
  }
} as const satisfies Prisma.CouponCourseSelect

export const COUPON_AUTHOR_SELECT = {
  id: true,
  username: true,
  role: true
} as const satisfies Prisma.UserSelect

export const COUPON_PUBLIC_SELECT = {
  id: true,
  title: true,
  code: true,
  type: true,
  value: true,
  limit: true,
  used: true,
  startDate: true,
  endDate: true,
  active: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  courses: {
    select: {
      courseId: true
    }
  }
} as const satisfies Prisma.CouponSelect

export type CouponPublicPayload = Prisma.CouponGetPayload<{
  select: typeof COUPON_PUBLIC_SELECT
}>

export const COUPON_DETAIL_SELECT = {
  id: true,
  title: true,
  code: true,
  type: true,
  value: true,
  limit: true,
  used: true,
  startDate: true,
  endDate: true,
  active: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  courses: {
    select: COUPON_COURSE_DETAIL_SELECT
  },
  author: {
    select: COUPON_AUTHOR_SELECT
  }
} as const satisfies Prisma.CouponSelect

export type CouponDetailPayload = Prisma.CouponGetPayload<{
  select: typeof COUPON_DETAIL_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Find a coupon by its unique UUID.
 */
export const findCouponById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<CouponDetailPayload | null> => {
  const client = tx || prisma
  return client.coupon.findUnique({
    where: { id },
    select: COUPON_DETAIL_SELECT
  })
}

/**
 * Find a coupon by its unique coupon code.
 */
export const findCouponByCode = async (
  code: string,
  tx?: PrismaTransactionClient
): Promise<CouponDetailPayload | null> => {
  const client = tx || prisma
  return client.coupon.findUnique({
    where: { code },
    select: COUPON_DETAIL_SELECT
  })
}

/**
 * Find coupon with assigned course IDs for validation during checkout.
 */
export const findCouponWithCoursesByCode = async (
  code: string,
  tx?: PrismaTransactionClient
): Promise<CouponPublicPayload | null> => {
  const client = tx || prisma
  return client.coupon.findUnique({
    where: { code },
    select: COUPON_PUBLIC_SELECT
  })
}

/**
 * Create a new coupon and optionally link it to applicable courses in `coupon_courses`.
 */
export const createCoupon = async (
  data: {
    title: string
    code: string
    value: number
    type?: ECouponType
    limit?: number | null
    startDate?: Date | null
    endDate?: Date | null
    active?: boolean
    authorId?: string | null
    courses?: string[]
  },
  tx?: PrismaTransactionClient
): Promise<CouponDetailPayload> => {
  const client = tx || prisma
  const { courses = [], ...couponData } = data

  return client.coupon.create({
    data: {
      title: couponData.title,
      code: couponData.code,
      value: new Prisma.Decimal(couponData.value),
      type: couponData.type ?? ECouponType.PERCENTAGE,
      limit: couponData.limit ?? null,
      startDate: couponData.startDate ?? null,
      endDate: couponData.endDate ?? null,
      active: couponData.active ?? false,
      authorId: couponData.authorId ?? null,
      used: 0,
      ...(courses.length > 0 && {
        courses: {
          create: courses.map((courseId) => ({ courseId }))
        }
      })
    },
    select: COUPON_DETAIL_SELECT
  })
}

/**
 * Update a coupon and optionally sync its assigned courses in `coupon_courses`.
 */
export const updateCoupon = async (
  id: string,
  data: {
    title?: string
    code?: string
    value?: number
    type?: ECouponType
    limit?: number | null
    startDate?: Date | null
    endDate?: Date | null
    active?: boolean
    courses?: string[]
  },
  tx?: PrismaTransactionClient
): Promise<CouponDetailPayload> => {
  const client = tx || prisma
  const { courses, ...couponFields } = data

  // If courses list is provided, sync coupon_courses inside transaction
  if (courses !== undefined) {
    await client.couponCourse.deleteMany({
      where: { couponId: id }
    })
    if (courses.length > 0) {
      await client.couponCourse.createMany({
        data: courses.map((courseId) => ({
          couponId: id,
          courseId
        }))
      })
    }
  }

  return client.coupon.update({
    where: { id },
    data: {
      ...(couponFields.title !== undefined && { title: couponFields.title }),
      ...(couponFields.code !== undefined && { code: couponFields.code }),
      ...(couponFields.value !== undefined && { value: new Prisma.Decimal(couponFields.value) }),
      ...(couponFields.type !== undefined && { type: couponFields.type }),
      ...(couponFields.limit !== undefined && { limit: couponFields.limit }),
      ...(couponFields.startDate !== undefined && { startDate: couponFields.startDate }),
      ...(couponFields.endDate !== undefined && { endDate: couponFields.endDate }),
      ...(couponFields.active !== undefined && { active: couponFields.active })
    },
    select: COUPON_DETAIL_SELECT
  })
}

/**
 * Delete a coupon by UUID. Related records in `coupon_courses` cascade delete.
 */
export const deleteCouponById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Coupon | null> => {
  const client = tx || prisma
  try {
    return await client.coupon.delete({
      where: { id }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}

/**
 * List coupons with filters (search, active, authorId, pagination, sorting).
 */
export const listCoupons = async (
  params: {
    page?: number
    limit?: number
    search?: string
    active?: boolean
    authorId?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
  },
  tx?: PrismaTransactionClient
): Promise<CouponPublicPayload[]> => {
  const client = tx || prisma
  const { page = 1, limit = 10, search, active, authorId, sortBy = 'createdAt' } = params
  const skip = (page - 1) * limit

  const where: Prisma.CouponWhereInput = {
    ...(authorId && { authorId }),
    ...(active !== undefined && { active }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  return client.coupon.findMany({
    where,
    select: COUPON_PUBLIC_SELECT,
    skip,
    take: limit,
    orderBy: { [sortBy]: 'desc' }
  })
}

/**
 * Count total coupons matching filter criteria.
 */
export const countCoupons = async (
  params: {
    search?: string
    active?: boolean
    authorId?: string
  },
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const { search, active, authorId } = params

  const where: Prisma.CouponWhereInput = {
    ...(authorId && { authorId }),
    ...(active !== undefined && { active }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  return client.coupon.count({ where })
}

/**
 * Atomically increment coupon used count.
 */
export const incrementCouponUsed = async (
  id: string,
  amount: number = 1,
  tx?: PrismaTransactionClient
): Promise<Coupon> => {
  const client = tx || prisma
  return client.coupon.update({
    where: { id },
    data: {
      used: { increment: amount }
    }
  })
}

/**
 * Atomically decrement coupon used count.
 */
export const decrementCouponUsed = async (
  id: string,
  amount: number = 1,
  tx?: PrismaTransactionClient
): Promise<Coupon> => {
  const client = tx || prisma
  return client.coupon.update({
    where: { id },
    data: {
      used: { decrement: amount }
    }
  })
}
