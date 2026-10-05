import { z } from 'zod'
import { EEnrollmentStatus } from '~/types/enum'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: ENROLLMENT
 * 
 * Single Source of Truth for Enrollment domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/enrollment.legacy.model.ts
 */

// ==========================================
// 1. NESTED / COMPACT RELATIONS SCHEMAS
// ==========================================

export const enrollmentCourseCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  title: z.string(),
  slug: z.string(),
  image: z.string().default(''),
  price: z.number().nonnegative().default(0),
  level: z.string().optional(),
  type: z.string().optional(),
  sold: z.number().int().nonnegative().default(0),
  view: z.number().int().nonnegative().default(0)
})

export const enrollmentUserCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  username: z.string(),
  email: z.string(),
  avatar: z.string().default('')
})

// ==========================================
// 2. BASE DOMAIN SCHEMA
// ==========================================

export const enrollmentBaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  progress: z.number().int().min(0).max(100).default(0),
  status: z.nativeEnum(EEnrollmentStatus).default(EEnrollmentStatus.ACTIVE),
  enrolledAt: z.date(),
  completedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. INPUT / MUTATION SCHEMAS
// ==========================================

export const createEnrollmentInputSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  progress: z.number().int().min(0).max(100).optional().default(0),
  status: z.nativeEnum(EEnrollmentStatus).optional().default(EEnrollmentStatus.ACTIVE),
  enrolledAt: z.date().optional()
})

export const updateEnrollmentProgressInputSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  progress: z.number().int().min(0).max(100)
})

// ==========================================
// 4. PUBLIC / RESPONSE SCHEMAS
// ==========================================

export const enrollmentPublicSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  progress: z.number().int().default(0),
  enrolledAt: z.date(),
  course: enrollmentCourseCompactSchema.nullable().optional()
})

export const enrollmentStudentSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  progress: z.number().int().default(0),
  enrolledAt: z.date(),
  user: enrollmentUserCompactSchema.nullable().optional()
})

// ==========================================
// 5. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Enrollment = z.infer<typeof enrollmentBaseSchema>
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentInputSchema>
export type UpdateEnrollmentProgressInput = z.infer<typeof updateEnrollmentProgressInputSchema>
export type EnrollmentPublicResponse = z.infer<typeof enrollmentPublicSchema>
export type EnrollmentStudentResponse = z.infer<typeof enrollmentStudentSchema>
