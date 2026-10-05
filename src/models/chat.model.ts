import { z } from 'zod'
import { EMessageType } from '@prisma/client'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: CHAT & REALTIME
 * 
 * Single Source of Truth for Conversation & Message domain validation at Application Layer.
 * Conforms to AGENTS.md, application-model-design.md, and PostgreSQL schema constraints.
 */

// ==========================================
// 1. ENUM MAPPING & HELPERS
// ==========================================

export const messageTypeEnum = z.nativeEnum(EMessageType)

export type ApiMessageType = 'text' | 'image' | 'file'

export const toPrismaMessageType = (type?: string): EMessageType => {
  if (!type) return EMessageType.TEXT
  const upper = type.trim().toUpperCase()
  if (upper === 'IMAGE') return EMessageType.IMAGE
  if (upper === 'FILE') return EMessageType.FILE
  return EMessageType.TEXT
}

export const fromPrismaMessageType = (type: EMessageType): ApiMessageType => {
  switch (type) {
    case EMessageType.IMAGE:
      return 'image'
    case EMessageType.FILE:
      return 'file'
    case EMessageType.TEXT:
    default:
      return 'text'
  }
}

// ==========================================
// 2. COMPACT SCHEMAS & RELATIONS
// ==========================================

export const chatUserCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  username: z.string(),
  avatar: z.string().nullable().optional()
})

export type ChatUserCompact = z.infer<typeof chatUserCompactSchema>

export const conversationParticipantSchema = z.object({
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
  joinedAt: z.date(),
  user: chatUserCompactSchema.optional()
})

export type ConversationParticipant = z.infer<typeof conversationParticipantSchema>

// ==========================================
// 3. CONVERSATION SCHEMAS
// ==========================================

export const conversationBaseSchema = z.object({
  id: z.string().uuid(),
  isGroup: z.boolean().default(false),
  name: z.string().max(255).nullable().optional(),
  courseId: z.string().uuid().nullable().optional(),
  lastMessageId: z.string().uuid().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ConversationBase = z.infer<typeof conversationBaseSchema>

export const createConversationInputSchema = z.object({
  senderId: z.string().uuid({ message: 'senderId must be a valid UUID' }),
  receiverId: z.string().uuid({ message: 'receiverId must be a valid UUID' }).optional(),
  isGroup: z.boolean().optional().default(false),
  name: z.string().trim().max(255).optional(),
  course: z.string().optional(),
  courseId: z.string().optional()
})

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>

// ==========================================
// 4. MESSAGE SCHEMAS
// ==========================================

export const messageBaseSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1),
  type: messageTypeEnum.default(EMessageType.TEXT),
  isEdited: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type MessageBase = z.infer<typeof messageBaseSchema>

export const createMessageInputSchema = z.object({
  conversationId: z.string().uuid({ message: 'conversationId must be a valid UUID' }),
  senderId: z.string().uuid({ message: 'senderId must be a valid UUID' }),
  content: z.string().trim().min(1, { message: 'Content cannot be empty' }),
  type: z.string().optional().default('text')
})

export type CreateMessageInput = z.infer<typeof createMessageInputSchema>

export const updateMessageInputSchema = z.object({
  messageId: z.string().uuid({ message: 'messageId must be a valid UUID' }),
  senderId: z.string().uuid({ message: 'senderId must be a valid UUID' }),
  content: z.string().trim().min(1, { message: 'Content cannot be empty' })
})

export type UpdateMessageInput = z.infer<typeof updateMessageInputSchema>

export const deleteMessageInputSchema = z.object({
  messageId: z.string().uuid({ message: 'messageId must be a valid UUID' }),
  senderId: z.string().uuid({ message: 'senderId must be a valid UUID' })
})

export type DeleteMessageInput = z.infer<typeof deleteMessageInputSchema>
