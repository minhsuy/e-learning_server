import { z } from 'zod'
import { CommentStatus } from '@prisma/client'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: COMMENT
 * 
 * Single Source of Truth for Comment domain validation and types at Application Layer.
 * Conforms to AGENTS.md and application-model-design.md
 * Physical Database constraints: prisma/schema.prisma (model Comment)
 */

export const commentStatusEnum = z.nativeEnum(CommentStatus)

// ==========================================
// 1. NESTED / COMPACT RELATIONS SCHEMAS
// ==========================================

export const commentUserCompactSchema = z.object({
  id: z.string().uuid().optional(),
  _id: z.string().optional(),
  username: z.string(),
  avatar: z.string().default('')
})

export const commentCourseCompactSchema = z.object({
  id: z.string().uuid().optional(),
  _id: z.string().optional(),
  title: z.string(),
  slug: z.string()
})

export const commentLessonCompactSchema = z.object({
  id: z.string().uuid().optional(),
  _id: z.string().optional(),
  title: z.string()
})

// ==========================================
// 2. BASE DOMAIN SCHEMA
// ==========================================

export const commentBaseSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  userId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  level: z.number().int().min(0).default(0),
  status: commentStatusEnum.default(CommentStatus.APPROVED),
  moderationNote: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. INPUT / MUTATION SCHEMAS
// ==========================================

export const createCommentInputSchema = z.object({
  content: z.string().min(6).max(500),
  lesson: z.string().uuid(),
  course: z.string().uuid(),
  userId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable()
})

export const updateCommentInputSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(3),
  userId: z.string().uuid(),
  role: z.string()
})

// ==========================================
// 4. SERIALIZED / API RESPONSE TYPE
// ==========================================

export interface SerializedComment {
  id: string
  _id?: string
  content: string
  lesson: string | { id?: string; _id?: string; title: string }
  course: string | { id?: string; _id?: string; title: string; slug?: string }
  user: string | { id?: string; _id?: string; username: string; avatar: string }
  status: CommentStatus | string
  moderationNote?: string | null
  parentId: string | null
  level: number
  likes: string[]
  dislikes: string[]
  createdAt: Date | string
  updatedAt: Date | string
}

export type CommentBase = z.infer<typeof commentBaseSchema>
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>
export type CommentUserCompact = z.infer<typeof commentUserCompactSchema>
export type CommentCourseCompact = z.infer<typeof commentCourseCompactSchema>
export type CommentLessonCompact = z.infer<typeof commentLessonCompactSchema>
