import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { EMessageType, Prisma } from '@prisma/client'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: MESSAGE
 * 
 * Strict functional architecture for messages PostgreSQL table.
 * Conforms to AGENTS.md, rules, and Prisma ORM 6.4.1.
 */

export const MESSAGE_SENDER_SELECT = {
  id: true,
  username: true,
  avatar: true
} as const satisfies Prisma.UserSelect

export const MESSAGE_DETAIL_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  type: true,
  isEdited: true,
  createdAt: true,
  updatedAt: true,
  sender: {
    select: MESSAGE_SENDER_SELECT
  }
} as const satisfies Prisma.MessageSelect

export type MessageDetailPayload = Prisma.MessageGetPayload<{
  select: typeof MESSAGE_DETAIL_SELECT
}>

/**
 * Create a new message and atomically update conversation's lastMessageId
 */
export const createMessage = async (
  data: {
    conversationId: string
    senderId: string
    content: string
    type?: EMessageType
  },
  tx?: PrismaTransactionClient
): Promise<MessageDetailPayload> => {
  const execute = async (client: PrismaTransactionClient) => {
    // 1. Create message
    const message = await client.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        type: data.type ?? EMessageType.TEXT
      },
      select: MESSAGE_DETAIL_SELECT
    })

    // 2. Update conversation lastMessageId and touch updatedAt
    await client.conversation.update({
      where: { id: data.conversationId },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date()
      }
    })

    return message
  }

  if (tx) {
    return execute(tx)
  }
  return prisma.$transaction(async (newTx) => execute(newTx))
}

/**
 * Find message by ID with sender info
 */
export const findMessageById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<MessageDetailPayload | null> => {
  const client = tx ?? prisma
  return client.message.findUnique({
    where: { id },
    select: MESSAGE_DETAIL_SELECT
  })
}

/**
 * Find all messages in a conversation sorted by createdAt ASC
 */
export const findMessagesByConversationId = async (
  conversationId: string,
  tx?: PrismaTransactionClient
): Promise<MessageDetailPayload[]> => {
  const client = tx ?? prisma
  return client.message.findMany({
    where: { conversationId },
    select: MESSAGE_DETAIL_SELECT,
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Find the latest message in a conversation, optionally excluding a specific messageId
 */
export const findLatestMessageInConversation = async (
  conversationId: string,
  excludeMessageId?: string,
  tx?: PrismaTransactionClient
): Promise<MessageDetailPayload | null> => {
  const client = tx ?? prisma
  return client.message.findFirst({
    where: {
      conversationId,
      ...(excludeMessageId ? { id: { not: excludeMessageId } } : {})
    },
    select: MESSAGE_DETAIL_SELECT,
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Update message content and set isEdited = true
 */
export const updateMessageContent = async (
  id: string,
  content: string,
  tx?: PrismaTransactionClient
): Promise<MessageDetailPayload> => {
  const client = tx ?? prisma
  return client.message.update({
    where: { id },
    data: {
      content,
      isEdited: true
    },
    select: MESSAGE_DETAIL_SELECT
  })
}

/**
 * Delete message and maintain conversation lastMessageId integrity
 */
export const deleteMessageWithLastMessageSync = async (
  messageId: string,
  conversationId: string,
  tx?: PrismaTransactionClient
): Promise<{ success: boolean }> => {
  const execute = async (client: PrismaTransactionClient) => {
    // 1. Check conversation's current lastMessageId
    const conv = await client.conversation.findUnique({
      where: { id: conversationId },
      select: { lastMessageId: true }
    })

    // 2. Delete message
    await client.message.delete({
      where: { id: messageId }
    })

    // 3. If deleted message was the lastMessageId, re-sync to the remaining latest message
    if (conv?.lastMessageId === messageId) {
      const remainingLatest = await client.message.findFirst({
        where: { conversationId },
        select: { id: true },
        orderBy: { createdAt: 'desc' }
      })

      await client.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: remainingLatest?.id ?? null
        }
      })
    }

    return { success: true }
  }

  if (tx) {
    return execute(tx)
  }
  return prisma.$transaction(async (newTx) => execute(newTx))
}
