import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { CommentStatus, Prisma } from '@prisma/client'

/**
 * TMDEMY — COMMENT FUNCTIONAL REPOSITORY
 * 
 * Interacts exclusively with PostgreSQL table `comments` via Prisma ORM 6.4.1.
 * Strict functional style (no classes, no this, optional transaction client).
 */

export const COMMENT_DETAIL_SELECT = {
  id: true,
  content: true,
  lessonId: true,
  courseId: true,
  userId: true,
  parentId: true,
  level: true,
  status: true,
  moderationNote: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      avatar: true
    }
  },
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      authorId: true
    }
  },
  lesson: {
    select: {
      id: true,
      title: true
    }
  },
  reactions: {
    select: {
      id: true,
      userId: true,
      type: true
    }
  }
} as const satisfies Prisma.CommentSelect

export type CommentDetailPayload = Prisma.CommentGetPayload<{
  select: typeof COMMENT_DETAIL_SELECT
}>

export const findCommentById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<CommentDetailPayload | null> => {
  const client = tx ?? prisma
  return client.comment.findUnique({
    where: { id },
    select: COMMENT_DETAIL_SELECT
  })
}

export const findCommentsByLessonId = async (
  lessonId: string,
  status: CommentStatus = CommentStatus.APPROVED,
  tx?: PrismaTransactionClient
): Promise<CommentDetailPayload[]> => {
  const client = tx ?? prisma
  return client.comment.findMany({
    where: {
      lessonId,
      status
    },
    select: COMMENT_DETAIL_SELECT,
    orderBy: { createdAt: 'desc' }
  })
}

export interface CommentFilterParams {
  courseId?: string
  courseIds?: string[]
  status?: CommentStatus
  search?: string
  skip?: number
  take?: number
}

const buildWhereFilter = (params: CommentFilterParams): Prisma.CommentWhereInput => {
  const where: Prisma.CommentWhereInput = {}

  if (params.status) {
    where.status = params.status
  }

  if (params.courseId) {
    where.courseId = params.courseId
  } else if (params.courseIds && params.courseIds.length > 0) {
    where.courseId = { in: params.courseIds }
  } else if (params.courseIds && params.courseIds.length === 0) {
    // Empty list of courses for a teacher means no comments should match
    where.courseId = '00000000-0000-0000-0000-000000000000'
  }

  if (params.search && params.search.trim().length > 0) {
    const term = params.search.trim()
    where.OR = [
      { content: { contains: term, mode: 'insensitive' } },
      { course: { title: { contains: term, mode: 'insensitive' } } },
      { user: { username: { contains: term, mode: 'insensitive' } } }
    ]
  }

  return where
}

export const findCommentsWithFilter = async (
  params: CommentFilterParams,
  tx?: PrismaTransactionClient
): Promise<CommentDetailPayload[]> => {
  const client = tx ?? prisma
  const where = buildWhereFilter(params)

  return client.comment.findMany({
    where,
    select: COMMENT_DETAIL_SELECT,
    skip: params.skip ?? 0,
    take: params.take ?? 10,
    orderBy: { createdAt: 'desc' }
  })
}

export const countCommentsWithFilter = async (
  params: CommentFilterParams,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx ?? prisma
  const where = buildWhereFilter(params)
  return client.comment.count({ where })
}

export const createComment = async (
  data: Prisma.CommentUncheckedCreateInput,
  tx?: PrismaTransactionClient
): Promise<CommentDetailPayload> => {
  const client = tx ?? prisma
  const created = await client.comment.create({
    data,
    select: { id: true }
  })

  const full = await client.comment.findUnique({
    where: { id: created.id },
    select: COMMENT_DETAIL_SELECT
  })

  if (!full) {
    throw new Error('Failed to retrieve created comment')
  }

  return full
}

export const updateCommentContent = async (
  id: string,
  content: string,
  tx?: PrismaTransactionClient
): Promise<CommentDetailPayload | null> => {
  const client = tx ?? prisma
  return client.comment.update({
    where: { id },
    data: { content },
    select: COMMENT_DETAIL_SELECT
  })
}

export const deleteCommentById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<CommentDetailPayload | null> => {
  const client = tx ?? prisma
  return client.comment.delete({
    where: { id },
    select: COMMENT_DETAIL_SELECT
  })
}

export const updateCommentStatus = async (
  id: string,
  status: CommentStatus,
  moderationNote?: string | null,
  tx?: PrismaTransactionClient
): Promise<CommentDetailPayload | null> => {
  const client = tx ?? prisma
  return client.comment.update({
    where: { id },
    data: {
      status,
      ...(moderationNote !== undefined ? { moderationNote } : {})
    },
    select: COMMENT_DETAIL_SELECT
  })
}
