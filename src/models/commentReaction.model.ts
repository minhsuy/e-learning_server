import { z } from 'zod'
import { CommentReactionType } from '@prisma/client'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: COMMENT REACTION
 * 
 * Single Source of Truth for CommentReaction domain validation and types.
 * Target Database: PostgreSQL 16 (model CommentReaction)
 */

export const commentReactionTypeEnum = z.nativeEnum(CommentReactionType)

export const commentReactionBaseSchema = z.object({
  id: z.string().uuid(),
  commentId: z.string().uuid(),
  userId: z.string().uuid(),
  type: commentReactionTypeEnum,
  createdAt: z.date()
})

export const createCommentReactionInputSchema = z.object({
  commentId: z.string().uuid(),
  userId: z.string().uuid(),
  type: commentReactionTypeEnum
})

export type CommentReactionBase = z.infer<typeof commentReactionBaseSchema>
export type CreateCommentReactionInput = z.infer<typeof createCommentReactionInputSchema>
