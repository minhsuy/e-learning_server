import { ServiceResponse } from '~/types/type'
import { getIO } from '~/socket/initSocket'
import { withCompatId } from '~/utils/uuid'
import {
  createMessage,
  deleteMessageWithLastMessageSync,
  findMessageById,
  findMessagesByConversationId,
  updateMessageContent
} from '~/repositories/message.repository'
import { isUserInConversation } from '~/repositories/conversationParticipant.repository'
import { findConversationById } from '~/repositories/conversation.repository'
import { fromPrismaMessageType, toPrismaMessageType } from '~/models/chat.model'

/**
 * Format message payload to preserve full legacy HTTP & Socket response contract
 */
export const formatMessageResponse = (msg: any) => {
  const senderObj = msg.sender || { id: msg.senderId }
  const formattedSender = withCompatId({
    id: senderObj.id,
    username: senderObj.username || '',
    avatar: senderObj.avatar ?? null
  })

  const apiType = typeof msg.type === 'string'
    ? fromPrismaMessageType(msg.type as any)
    : 'text'

  return withCompatId({
    id: msg.id,
    conversationId: msg.conversationId,
    conversation: msg.conversationId, // Mongo compatibility
    senderId: msg.senderId,
    sender: formattedSender,
    content: msg.content,
    type: apiType,
    isEdited: msg.isEdited ?? false,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt
  })
}

export const createMessageService = async ({
  conversationId,
  senderId,
  content,
  type
}: {
  conversationId: string
  senderId: string
  content: string
  type?: string
}): Promise<ServiceResponse> => {
  // 1. Verify conversation existence
  const conv = await findConversationById(conversationId)
  if (!conv) {
    return { success: false, statusCode: 404, message: 'Conversation not found' }
  }

  // 2. Verify sender is a participant
  const isParticipant = await isUserInConversation(conversationId, senderId)
  if (!isParticipant) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not a participant in this conversation'
    }
  }

  // 3. Create message and atomically sync conversation lastMessageId
  const prismaType = toPrismaMessageType(type)
  const message = await createMessage({
    conversationId,
    senderId,
    content: content.trim(),
    type: prismaType
  })

  const formatted = formatMessageResponse(message)

  // 4. Emit realtime event to room
  try {
    const io = getIO()
    io.to(conversationId).emit('receiveMessage', formatted)
  } catch (err) {
    console.error('[Socket Broadcast Error in createMessageService]:', err)
  }

  return { success: true, statusCode: 200, data: formatted }
}

export const getMessagesByConversationService = async (
  conversationId: string,
  userId?: string
): Promise<ServiceResponse> => {
  // 1. Verify conversation exists
  const conv = await findConversationById(conversationId)
  if (!conv) {
    return { success: false, statusCode: 404, message: 'Conversation not found' }
  }

  // 2. Authorization check: user must be a participant
  if (userId) {
    const isParticipant = await isUserInConversation(conversationId, userId)
    if (!isParticipant) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not authorized to view messages in this conversation'
      }
    }
  }

  // 3. Retrieve messages ordered chronologically
  const messages = await findMessagesByConversationId(conversationId)
  const data = messages.map(formatMessageResponse)

  return {
    success: true,
    statusCode: 200,
    message: 'Messages fetched successfully',
    data
  }
}

export const updateMessageService = async ({
  messageId,
  senderId,
  content
}: {
  messageId: string
  senderId: string
  content: string
}): Promise<ServiceResponse> => {
  const message = await findMessageById(messageId)
  if (!message) {
    return { success: false, statusCode: 404, message: 'Message not found' }
  }

  if (message.senderId !== senderId) {
    return { success: false, statusCode: 403, message: 'You can only edit your own message' }
  }

  const updated = await updateMessageContent(messageId, content.trim())
  const formatted = formatMessageResponse(updated)

  try {
    const io = getIO()
    io.to(message.conversationId).emit('messageUpdated', formatted)
  } catch (err) {
    console.error('[Socket Broadcast Error in updateMessageService]:', err)
  }

  return { success: true, statusCode: 200, data: formatted }
}

export const deleteMessageService = async ({
  messageId,
  senderId
}: {
  messageId: string
  senderId: string
}): Promise<ServiceResponse> => {
  const message = await findMessageById(messageId)
  if (!message) {
    return { success: false, statusCode: 404, message: 'Message not found' }
  }

  if (message.senderId !== senderId) {
    return { success: false, statusCode: 403, message: 'You can only delete your own message' }
  }

  await deleteMessageWithLastMessageSync(messageId, message.conversationId)

  try {
    const io = getIO()
    io.to(message.conversationId).emit('messageDeleted', { messageId })
  } catch (err) {
    console.error('[Socket Broadcast Error in deleteMessageService]:', err)
  }

  return { success: true, statusCode: 200, message: 'Message deleted successfully' }
}
