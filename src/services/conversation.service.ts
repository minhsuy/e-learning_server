import { prisma } from '~/config/prisma'
import { ServiceResponse } from '~/types/type'
import { withCompatId } from '~/utils/uuid'
import {
  createConversationWithParticipants,
  findCourseGroupConversation,
  findPrivateConversationBetweenUsers,
  findUserConversations,
  findConversationById
} from '~/repositories/conversation.repository'
import { findMessageById } from '~/repositories/message.repository'
import { fromPrismaMessageType } from '~/models/chat.model'

/**
 * Format Conversation payload for backward compatible HTTP & Socket response
 */
export const formatConversationResponse = (
  conv: any,
  currentUserId?: string,
  lastMessagePayload?: any
) => {
  const participants = (conv.participants || []).map((p: any) => {
    const user = p.user || {}
    const userId = p.userId || user.id
    return withCompatId({
      id: userId,
      username: user.username || '',
      avatar: user.avatar ?? null,
      joinedAt: p.joinedAt
    })
  })

  let displayName = conv.name ?? null
  let avatar = null
  if (!conv.isGroup && currentUserId) {
    const otherUser = participants.find((p: any) => p.id !== currentUserId)
    if (otherUser) {
      displayName = otherUser.username
      avatar = otherUser.avatar
    } else {
      displayName = 'Unknown User'
    }
  }

  const lastMessage = lastMessagePayload
    ? withCompatId({
        id: lastMessagePayload.id,
        conversationId: lastMessagePayload.conversationId,
        conversation: lastMessagePayload.conversationId,
        senderId: lastMessagePayload.senderId,
        sender: lastMessagePayload.senderId,
        content: lastMessagePayload.content,
        type: typeof lastMessagePayload.type === 'string'
          ? (fromPrismaMessageType(lastMessagePayload.type as any) ?? lastMessagePayload.type.toLowerCase())
          : 'text',
        createdAt: lastMessagePayload.createdAt
      })
    : null

  return withCompatId({
    id: conv.id,
    isGroup: conv.isGroup,
    name: conv.name,
    courseId: conv.courseId,
    course: conv.courseId,
    lastMessageId: conv.lastMessageId,
    lastMessage,
    participants,
    displayName,
    avatar,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt
  })
}

export const createConversationService = async ({
  senderId,
  receiverId,
  isGroup,
  name,
  course,
  courseId
}: {
  senderId: string
  receiverId?: string
  isGroup?: boolean
  name?: string
  course?: string
  courseId?: string
}): Promise<ServiceResponse> => {
  const targetCourseId = courseId || course

  if (isGroup) {
    if (!targetCourseId) {
      return { success: false, statusCode: 400, message: 'Course ID is required for group chat' }
    }

    const existingGroup = await findCourseGroupConversation(targetCourseId)
    if (existingGroup) {
      return {
        success: true,
        statusCode: 200,
        message: 'Group conversation already exists',
        data: formatConversationResponse(existingGroup, senderId)
      }
    }

    // Find course author and enrolled students from PostgreSQL
    const courseRecord = await prisma.course.findUnique({
      where: { id: targetCourseId },
      select: { id: true, title: true, authorId: true }
    })

    if (!courseRecord) {
      return { success: false, statusCode: 404, message: 'Course not found' }
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: targetCourseId },
      select: { userId: true }
    })

    const studentIds = enrollments.map((e) => e.userId)
    const participantIds = [courseRecord.authorId, ...studentIds, senderId]

    const group = await createConversationWithParticipants(
      {
        isGroup: true,
        name: name || `Q&A - ${courseRecord.title || 'Course'}`,
        courseId: targetCourseId
      },
      participantIds
    )

    return {
      success: true,
      statusCode: 200,
      message: 'Group conversation created successfully',
      data: formatConversationResponse(group, senderId)
    }
  }

  // 1-on-1 private chat
  if (!receiverId) {
    return { success: false, statusCode: 400, message: 'receiverId is required for private chat' }
  }

  if (senderId === receiverId) {
    return { success: false, statusCode: 400, message: 'Cannot create conversation with yourself' }
  }

  const existing = await findPrivateConversationBetweenUsers(senderId, receiverId)
  if (existing) {
    return {
      success: true,
      statusCode: 200,
      message: 'Conversation already exists',
      data: formatConversationResponse(existing, senderId)
    }
  }

  const newConversation = await createConversationWithParticipants(
    {
      isGroup: false,
      name: null,
      courseId: null
    },
    [senderId, receiverId]
  )

  return {
    success: true,
    statusCode: 200,
    message: 'Private conversation created successfully',
    data: formatConversationResponse(newConversation, senderId)
  }
}

export const getUserConversationsService = async ({
  userId
}: {
  userId: string
}): Promise<ServiceResponse> => {
  const conversations = await findUserConversations(userId)

  // Fetch lastMessages in batch or parallel
  const result = await Promise.all(
    conversations.map(async (conv) => {
      let lastMessage: any = null
      if (conv.lastMessageId) {
        lastMessage = await findMessageById(conv.lastMessageId)
      }
      return formatConversationResponse(conv, userId, lastMessage)
    })
  )

  return {
    success: true,
    data: result,
    message: 'Conversations fetched successfully',
    statusCode: 200
  }
}
