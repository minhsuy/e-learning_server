import { z } from 'zod'
import { CourseLevel, CourseStatus, CourseType } from '@prisma/client'
import { userCompactSchema } from './user.model'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: COURSE
 * 
 * Single Source of Truth for Course domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/course.legacy.model.ts
 */

// ==========================================
// 1. NESTED / VALUE OBJECT SCHEMAS
// ==========================================

export const courseFaqSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int().default(0),
  createdAt: z.date()
})

export const courseFaqItemInputSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int().optional().default(0)
})

/**
 * Legacy API compatibility schema for course `info`
 * Reflects MongoDB embedded structure: requirements, benefits, techniques, documents, qa
 */
export const courseInfoCompatibilitySchema = z.object({
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  techniques: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([]),
  qa: z.array(
    z.object({
      question: z.string(),
      answer: z.string()
    })
  ).default([])
})

// ==========================================
// 2. BASE DOMAIN SCHEMA (Reflects pure domain entity)
// ==========================================

export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  image: z.string().default(''),
  introUrl: z.string().default(''),
  description: z.string().default(''),
  price: z.number().min(0).default(0),
  oldPrice: z.number().min(0).default(0),
  type: z.nativeEnum(CourseType).default(CourseType.PAID),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.PENDING),
  level: z.nativeEnum(CourseLevel).default(CourseLevel.BEGINNER),
  view: z.number().int().nonnegative().default(0),
  sold: z.number().int().nonnegative().default(0),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  techniques: z.array(z.string()).default([]),
  documents: z.array(z.string()).default([]),
  categoryId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid(),
  isDestroyed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. PUBLIC / RESPONSE SCHEMAS
// ==========================================

export const coursePublicSchema = courseSchema.pick({
  id: true,
  title: true,
  slug: true,
  image: true,
  introUrl: true,
  description: true,
  price: true,
  oldPrice: true,
  type: true,
  status: true,
  level: true,
  view: true,
  sold: true,
  requirements: true,
  benefits: true,
  techniques: true,
  documents: true,
  categoryId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true
})

export const courseCompactSchema = courseSchema.pick({
  id: true,
  title: true,
  slug: true,
  image: true,
  price: true,
  type: true,
  status: true
})

export const courseDetailResponseSchema = coursePublicSchema.extend({
  author: userCompactSchema.optional(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string()
  }).nullable().optional(),
  faqs: z.array(courseFaqSchema).optional(),
  info: courseInfoCompatibilitySchema.optional()
})

// ==========================================
// 4. INPUT ACTION SCHEMAS
// ==========================================

export const createCourseInputSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  image: z.string().optional().default(''),
  introUrl: z.string().optional().default(''),
  description: z.string().optional().default(''),
  price: z.number().min(0).optional().default(0),
  oldPrice: z.number().min(0).optional().default(0),
  type: z.nativeEnum(CourseType).optional().default(CourseType.PAID),
  level: z.nativeEnum(CourseLevel).optional().default(CourseLevel.BEGINNER),
  requirements: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  techniques: z.array(z.string()).optional().default([]),
  documents: z.array(z.string()).optional().default([]),
  categoryId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid(),
  faqs: z.array(courseFaqItemInputSchema).optional().default([])
})

export const updateCourseInputSchema = createCourseInputSchema.partial().omit({ authorId: true })

export const updateCourseStatusInputSchema = z.object({
  status: z.nativeEnum(CourseStatus)
})

// ==========================================
// 5. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Course = z.infer<typeof courseSchema>
export type CourseFaq = z.infer<typeof courseFaqSchema>
export type CourseFaqItemInput = z.infer<typeof courseFaqItemInputSchema>
export type CourseInfoCompatibility = z.infer<typeof courseInfoCompatibilitySchema>
export type CoursePublic = z.infer<typeof coursePublicSchema>
export type CourseCompact = z.infer<typeof courseCompactSchema>
export type CourseDetailResponse = z.infer<typeof courseDetailResponseSchema>
export type CreateCourseInput = z.infer<typeof createCourseInputSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>
export type UpdateCourseStatusInput = z.infer<typeof updateCourseStatusInputSchema>
