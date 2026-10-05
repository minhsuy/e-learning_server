import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { CommentReaction, CommentReactionType, Prisma } from '@prisma/client'

/**
 * TMDEMY — COMMENT REACTION FUNCTIONAL REPOSITORY
 * 
 * Interacts exclusively with PostgreSQL table `comment_reactions` via Prisma ORM 6.4.1.
 * Strict functional style (no classes, no this, optional transaction client).
 */

export const COMMENT_REACTION_SELECT = {
  id: true,
  commentId: true,
  userId: true,
  type: true,
  createdAt: true
} as const satisfies Prisma.CommentReactionSelect

export type CommentReactionPayload = Prisma.CommentReactionGetPayload<{
  select: typeof COMMENT_REACTION_SELECT
}>

export const findReaction = async (
  commentId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<CommentReactionPayload | null> => {
  const client = tx ?? prisma
  return client.commentReaction.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId
      }
    },
    select: COMMENT_REACTION_SELECT
  })
}

export const createReaction = async (
  commentId: string,
  userId: string,
  type: CommentReactionType,
  tx?: PrismaTransactionClient
): Promise<CommentReactionPayload> => {
  const client = tx ?? prisma
  return client.commentReaction.create({
    data: {
      commentId,
      userId,
      type
    },
    select: COMMENT_REACTION_SELECT
  })
}

export const updateReactionType = async (
  commentId: string,
  userId: string,
  type: CommentReactionType,
  tx?: PrismaTransactionClient
): Promise<CommentReactionPayload> => {
  const client = tx ?? prisma
  return client.commentReaction.update({
    where: {
      commentId_userId: {
        commentId,
        userId
      }
    },
    data: {
      type
    },
    select: COMMENT_REACTION_SELECT
  })
}

export const deleteReaction = async (
  commentId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<CommentReactionPayload> => {
  const client = tx ?? prisma
  return client.commentReaction.delete({
    where: {
      commentId_userId: {
        commentId,
        userId
      }
    },
    select: COMMENT_REACTION_SELECT
  })
}

export const findReactionsByCommentId = async (
  commentId: string,
  tx?: PrismaTransactionClient
): Promise<CommentReactionPayload[]> => {
  const client = tx ?? prisma
  return client.commentReaction.findMany({
    where: { commentId },
    select: COMMENT_REACTION_SELECT,
    orderBy: { createdAt: 'asc' }
  })
}

export const findReactionsByCommentIds = async (
  commentIds: string[],
  tx?: PrismaTransactionClient
): Promise<CommentReactionPayload[]> => {
  const client = tx ?? prisma
  if (commentIds.length === 0) return []
  return client.commentReaction.findMany({
    where: {
      commentId: { in: commentIds }
    },
    select: COMMENT_REACTION_SELECT
  })
}

export const countReactionsByCommentId = async (
  commentId: string,
  type?: CommentReactionType,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx ?? prisma
  return client.commentReaction.count({
    where: {
      commentId,
      ...(type ? { type } : {})
    }
  })
}
