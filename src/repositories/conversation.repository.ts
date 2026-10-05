import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { Prisma } from '@prisma/client'
import { PARTICIPANT_USER_SELECT } from './conversationParticipant.repository'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: CONVERSATION
 * 
 * Strict functional architecture for conversations PostgreSQL table.
 * Conforms to AGENTS.md, rules, and Prisma ORM 6.4.1.
 */

export const CONVERSATION_BASE_SELECT = {
  id: true,
  isGroup: true,
  name: true,
  courseId: true,
  lastMessageId: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.ConversationSelect

export const CONVERSATION_DETAIL_SELECT = {
  ...CONVERSATION_BASE_SELECT,
  course: {
    select: {
      id: true,
      title: true,
      authorId: true
    }
  },
  participants: {
    select: {
      conversationId: true,
      userId: true,
      joinedAt: true,
      user: {
        select: PARTICIPANT_USER_SELECT
      }
    },
    orderBy: { joinedAt: 'asc' }
  }
} as const satisfies Prisma.ConversationSelect

export type ConversationDetailPayload = Prisma.ConversationGetPayload<{
  select: typeof CONVERSATION_DETAIL_SELECT
}>

/**
 * Find conversation by ID with full details
 */
export const findConversationById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<ConversationDetailPayload | null> => {
  const client = tx ?? prisma
  return client.conversation.findUnique({
    where: { id },
    select: CONVERSATION_DETAIL_SELECT
  })
}

/**
 * Find existing private (1-on-1) conversation between two users
 */
export const findPrivateConversationBetweenUsers = async (
  userId1: string,
  userId2: string,
  tx?: PrismaTransactionClient
): Promise<ConversationDetailPayload | null> => {
  const client = tx ?? prisma
  return client.conversation.findFirst({
    where: {
      isGroup: false,
      participants: {
        some: { userId: userId1 }
      },
      AND: [
        {
          participants: {
            some: { userId: userId2 }
          }
        }
      ]
    },
    select: CONVERSATION_DETAIL_SELECT
  })
}

/**
 * Find course group conversation by courseId
 */
export const findCourseGroupConversation = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<ConversationDetailPayload | null> => {
  const client = tx ?? prisma
  return client.conversation.findFirst({
    where: {
      courseId,
      isGroup: true
    },
    select: CONVERSATION_DETAIL_SELECT
  })
}

/**
 * Create a new conversation with participants in a single transaction
 */
export const createConversationWithParticipants = async (
  data: {
    isGroup?: boolean
    name?: string | null
    courseId?: string | null
  },
  participantUserIds: string[],
  tx?: PrismaTransactionClient
): Promise<ConversationDetailPayload> => {
  const execute = async (client: PrismaTransactionClient) => {
    const uniqueUserIds = Array.from(new Set(participantUserIds.filter(Boolean)))

    const conv = await client.conversation.create({
      data: {
        isGroup: data.isGroup ?? false,
        name: data.name ?? null,
        courseId: data.courseId ?? null,
        participants: {
          create: uniqueUserIds.map((userId) => ({
            userId
          }))
        }
      },
      select: CONVERSATION_DETAIL_SELECT
    })

    return conv
  }

  if (tx) {
    return execute(tx)
  }
  return prisma.$transaction(async (newTx) => execute(newTx))
}

/**
 * Find all conversations where a user is participant, ordered by updatedAt DESC
 */
export const findUserConversations = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<ConversationDetailPayload[]> => {
  const client = tx ?? prisma
  return client.conversation.findMany({
    where: {
      participants: {
        some: { userId }
      }
    },
    select: CONVERSATION_DETAIL_SELECT,
    orderBy: { updatedAt: 'desc' }
  })
}

/**
 * Update lastMessageId and updatedAt timestamp of conversation
 */
export const updateConversationLastMessage = async (
  conversationId: string,
  lastMessageId: string | null,
  tx?: PrismaTransactionClient
): Promise<void> => {
  const client = tx ?? prisma
  await client.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageId,
      updatedAt: new Date()
    }
  })
}

/**
 * Touch conversation updatedAt timestamp
 */
export const touchConversationUpdatedAt = async (
  conversationId: string,
  tx?: PrismaTransactionClient
): Promise<void> => {
  const client = tx ?? prisma
  await client.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date()
    }
  })
}
