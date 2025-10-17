import MessageModel from '~/models/message.model'
import ConversationModel from '~/models/conversation.model'
import { ServiceResponse } from '~/types/type'
import { getIO } from '~/socket/initSocket'

export const createMessageService = async ({
  conversationId,
  senderId,
  content,
  type
}: {
  conversationId: string
  senderId: string
  content: string
  type: string
}) => {
  const message = await MessageModel.create({
    conversation: conversationId,
    sender: senderId,
    content,
    type
  })

  await ConversationModel.findByIdAndUpdate(conversationId, { lastMessage: message._id })

  const io = getIO()
  io.to(conversationId).emit('receiveMessage', message)

  return { success: true, data: message }
}

export const getMessagesByConversationService = async (conversationId: string): Promise<ServiceResponse> => {
  const messages = await MessageModel.find({ conversation: conversationId })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 })

  return { success: true, statusCode: 200, message: 'Messages fetched successfully', data: messages }
}

export const updateMessageService = async ({
  messageId,
  senderId,
  content
}: {
  messageId: string
  senderId: string
  content: string
}) => {
  const message = await MessageModel.findById(messageId)
  if (!message) return { success: false, statusCode: 404, message: 'Message not found' }

  if (message.sender.toString() !== senderId) {
    return { success: false, statusCode: 403, message: 'You can only edit your own message' }
  }

  message.content = content
  message.isEdited = true
  await message.save()

  const io = getIO()
  io.to(message.conversation.toString()).emit('messageUpdated', message)

  return { success: true, data: message }
}

export const deleteMessageService = async ({ messageId, senderId }: { messageId: string; senderId: string }) => {
  const message = await MessageModel.findById(messageId)
  if (!message) return { success: false, statusCode: 404, message: 'Message not found' }

  if (message.sender.toString() !== senderId) {
    return { success: false, statusCode: 403, message: 'You can only delete your own message' }
  }

  await message.deleteOne()

  const io = getIO()
  io.to(message.conversation.toString()).emit('messageDeleted', { messageId })

  return { success: true, message: 'Message deleted successfully' }
}
