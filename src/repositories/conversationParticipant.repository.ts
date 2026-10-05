import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { Prisma } from '@prisma/client'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: CONVERSATION PARTICIPANT
 * 
 * Strict functional architecture for conversation_participants PostgreSQL table.
 * Conforms to AGENTS.md, rules, and Prisma ORM 6.4.1.
 */

export const PARTICIPANT_USER_SELECT = {
  id: true,
  username: true,
  avatar: true
} as const satisfies Prisma.UserSelect

export const PARTICIPANT_SELECT = {
  conversationId: true,
  userId: true,
  joinedAt: true,
  user: {
    select: PARTICIPANT_USER_SELECT
  }
} as const satisfies Prisma.ConversationParticipantSelect

export type ParticipantPayload = Prisma.ConversationParticipantGetPayload<{
  select: typeof PARTICIPANT_SELECT
}>

/**
 * Check if a user is an active participant in a specific conversation
 */
export const isUserInConversation = async (
  conversationId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx ?? prisma
  const participant = await client.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    },
    select: {
      userId: true
    }
  })
  return participant !== null
}

/**
 * Add a single participant to a conversation (idempotent upsert)
 */
export const addParticipant = async (
  conversationId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<void> => {
  const client = tx ?? prisma
  await client.conversationParticipant.upsert({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    },
    create: {
      conversationId,
      userId
    },
    update: {}
  })
}

/**
 * Add multiple participants to a conversation (idempotent skip duplicates)
 */
export const addParticipants = async (
  conversationId: string,
  userIds: string[],
  tx?: PrismaTransactionClient
): Promise<void> => {
  const client = tx ?? prisma
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)))
  if (uniqueUserIds.length === 0) return

  await client.conversationParticipant.createMany({
    data: uniqueUserIds.map((userId) => ({
      conversationId,
      userId
    })),
    skipDuplicates: true
  })
}

/**
 * Get all participants of a conversation with compact user details
 */
export const getConversationParticipants = async (
  conversationId: string,
  tx?: PrismaTransactionClient
): Promise<ParticipantPayload[]> => {
  const client = tx ?? prisma
  return client.conversationParticipant.findMany({
    where: { conversationId },
    select: PARTICIPANT_SELECT,
    orderBy: { joinedAt: 'asc' }
  })
}

/**
 * Find all conversation IDs where a user is a participant
 */
export const findConversationIdsByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<string[]> => {
  const client = tx ?? prisma
  const rows = await client.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true }
  })
  return rows.map((r) => r.conversationId)
}

/**
 * Remove a participant from a conversation
 */
export const removeParticipant = async (
  conversationId: string,
  userId: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx ?? prisma
  try {
    await client.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    })
    return true
  } catch {
    return false
  }
}
