import { z } from 'zod'
import { EOrderStatus } from '~/types/enum'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: ORDER
 * 
 * Single Source of Truth for Order domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/order.legacy.model.ts
 */

// ==========================================
// 1. NESTED / COMPACT RELATIONS SCHEMAS
// ==========================================

export const orderCourseCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  image: z.string().default(''),
  price: z.number().nonnegative().default(0)
})

export const orderCouponCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  code: z.string(),
  value: z.number().nonnegative(),
  type: z.string()
})

export const orderUserCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  username: z.string(),
  email: z.string()
})

// ==========================================
// 2. BASE DOMAIN SCHEMA
// ==========================================

export const orderBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(50),
  amount: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
  couponId: z.string().uuid().nullable().optional(),
  courseId: z.string().uuid().nullable().optional(), // Nullable to safely support 3 legacy orphan orders
  userId: z.string().uuid(),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.nativeEnum(EOrderStatus)
  ).default(EOrderStatus.PENDING),
  rejectedReason: z.string().nullable().optional(),
  rejectedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. INPUT / MUTATION SCHEMAS
// ==========================================

export const createOrderInputSchema = z.object({
  courseId: z.string().uuid({ message: 'Invalid Course ID' }),
  couponCode: z.string().trim().min(1).optional()
})

export const updateOrderStatusInputSchema = z.object({
  orderId: z.string().uuid({ message: 'Invalid Order ID' }).optional(),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.nativeEnum(EOrderStatus, { errorMap: () => ({ message: 'Invalid order status' }) })
  ),
  rejectedReason: z.string().trim().optional()
})

// ==========================================
// 4. PUBLIC / RESPONSE SCHEMAS
// ==========================================

export const orderPublicSchema = orderBaseSchema.extend({
  _id: z.string().optional()
})

export const orderWithRelationsSchema = orderPublicSchema.extend({
  course: orderCourseCompactSchema.nullable().optional(),
  coupon: orderCouponCompactSchema.nullable().optional(),
  user: orderUserCompactSchema.optional()
})

// ==========================================
// 5. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Order = z.infer<typeof orderBaseSchema>
export type OrderCourseCompact = z.infer<typeof orderCourseCompactSchema>
export type OrderCouponCompact = z.infer<typeof orderCouponCompactSchema>
export type OrderUserCompact = z.infer<typeof orderUserCompactSchema>
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>
export type OrderPublicResponse = z.infer<typeof orderPublicSchema>
export type OrderWithRelations = z.infer<typeof orderWithRelationsSchema>
