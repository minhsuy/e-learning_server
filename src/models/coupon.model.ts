import { z } from 'zod'
import { ECouponType } from '~/types/enum'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: COUPON & COUPON_COURSE
 * 
 * Single Source of Truth for Coupon domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/coupon.legacy.model.ts
 */

// ==========================================
// 1. NESTED / COMPACT RELATIONS SCHEMAS
// ==========================================

export const couponCourseCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  price: z.number().nonnegative().default(0)
})

export const couponAuthorCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  username: z.string(),
  role: z.string()
})

// ==========================================
// 2. BASE DOMAIN SCHEMAS
// ==========================================

export const couponBaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  code: z.string().min(1).max(100),
  type: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.nativeEnum(ECouponType)
  ).default(ECouponType.PERCENTAGE),
  value: z.number().nonnegative(),
  limit: z.number().int().nonnegative().nullable().optional(),
  used: z.number().int().nonnegative().default(0),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  active: z.boolean().default(false),
  authorId: z.string().uuid().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const couponCourseBaseSchema = z.object({
  couponId: z.string().uuid(),
  courseId: z.string().uuid()
})

// ==========================================
// 3. INPUT / MUTATION SCHEMAS
// ==========================================

export const createCouponInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  code: z.string().trim().min(1, 'Coupon code is required'),
  value: z.number().positive('Value must be a positive number'),
  type: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.nativeEnum(ECouponType)
  ).optional().default(ECouponType.PERCENTAGE),
  limit: z.number().int().min(1).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  active: z.boolean().optional().default(false),
  courses: z.array(z.string().uuid('Invalid Course ID')).optional().default([])
})

export const updateCouponInputSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').optional(),
  code: z.string().trim().min(3, 'Code must be at least 3 characters').optional(),
  value: z.number().min(0, 'Value must be >= 0').optional(),
  type: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.nativeEnum(ECouponType)
  ).optional(),
  limit: z.number().int().min(0, 'Limit must be >= 0').optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  active: z.boolean().optional(),
  courses: z.array(z.string().uuid('Invalid Course ID')).optional()
})

export const checkCouponInputSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required'),
  courseId: z.string().uuid('Invalid Course ID')
})

export const checkCouponResultSchema = z.object({
  courseId: z.string().uuid().optional(),
  coursePrice: z.number().nonnegative().optional(),
  discount: z.number().nonnegative(),
  finalPrice: z.number().nonnegative().optional(),
  coupon: z.object({
    id: z.string().uuid().optional(),
    _id: z.string().optional(),
    title: z.string().optional(),
    code: z.string(),
    type: z.preprocess(
      (val) => (typeof val === 'string' ? val.toLowerCase() : val),
      z.nativeEnum(ECouponType)
    ),
    value: z.number()
  })
})

// ==========================================
// 4. PUBLIC / RESPONSE SCHEMAS
// ==========================================

export const couponPublicSchema = couponBaseSchema.extend({
  _id: z.string().optional(),
  courses: z.array(z.string().uuid()).optional()
})

export const couponDetailSchema = couponPublicSchema.extend({
  courses: z.array(couponCourseCompactSchema).default([]),
  author: couponAuthorCompactSchema.nullable().optional()
})

// ==========================================
// 5. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Coupon = z.infer<typeof couponBaseSchema>
export type CouponCourse = z.infer<typeof couponCourseBaseSchema>
export type CreateCouponInput = z.infer<typeof createCouponInputSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponInputSchema>
export type CheckCouponInput = z.infer<typeof checkCouponInputSchema>
export type CheckCouponResult = z.infer<typeof checkCouponResultSchema>
export type CouponPublicResponse = z.infer<typeof couponPublicSchema>
export type CouponDetailResponse = z.infer<typeof couponDetailSchema>
