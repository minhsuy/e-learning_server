import { ENotificationType } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import {
  countNotificationsByUser,
  createNotification,
  findNotificationById,
  findNotificationsByUser,
  markAllAsRead,
  markAsRead,
  NotificationPublicPayload
} from '~/repositories/notification.repository'
import { getIO } from '~/socket/initSocket'
import { ServiceResponse } from '~/types/type'
import { isValidUUID, withCompatId } from '~/utils/uuid'

/**
 * TMDEMY — NOTIFICATION SERVICE (PostgreSQL / Prisma ORM)
 * 
 * Replaces legacy Mongoose Notification service.
 * Handles business logic, query pagination, format serialization, and realtime Socket.IO emission.
 */

// ==========================================
// 1. BACKWARD-COMPATIBLE SERIALIZER
// ==========================================

export const formatNotificationResponse = (notification: NotificationPublicPayload) => {
  return {
    ...withCompatId(notification),
    senderId: notification.senderId,
    receiverId: notification.receiverId,
    receiver: notification.receiverId, // MongoDB compatibility alias
    sender: notification.sender
      ? {
          ...withCompatId(notification.sender),
          username: notification.sender.username,
          avatar: notification.sender.avatar
        }
      : null,
    type: notification.type,
    message: notification.message,
    relatedId: notification.relatedId,
    read: notification.isRead, // MongoDB compatibility alias
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  }
}

// ==========================================
// 2. QUERY & MUTATION SERVICES
// ==========================================

/**
 * Get paginated notifications for the authenticated user.
 */
export const getNotificationsService = async (
  userId: string,
  page = 1,
  limit = 10,
  type?: string
): Promise<ServiceResponse> => {
  if (!isValidUUID(userId)) {
    return { success: false, statusCode: 400, message: 'Invalid user ID' }
  }

  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10))

  let notificationType: ENotificationType | undefined
  if (type) {
    const upperType = type.toUpperCase()
    if (Object.values(ENotificationType).includes(upperType as ENotificationType)) {
      notificationType = upperType as ENotificationType
    }
  }

  const [notifications, total] = await Promise.all([
    findNotificationsByUser({
      receiverId: userId,
      page: safePage,
      limit: safeLimit,
      type: notificationType
    }),
    countNotificationsByUser({
      receiverId: userId,
      type: notificationType
    })
  ])

  const totalPages = Math.ceil(total / safeLimit) || 1

  return {
    success: true,
    message: 'Fetched notifications successfully',
    data: {
      notifications: notifications.map(formatNotificationResponse),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages
      }
    }
  }
}

/**
 * Mark a single notification as read by authenticated receiver.
 */
export const markNotificationReadService = async (
  notificationId: string,
  userId: string
): Promise<ServiceResponse> => {
  if (!isValidUUID(notificationId) || !isValidUUID(userId)) {
    return { success: false, statusCode: 422, message: 'Invalid Notification ID' }
  }

  const notification = await findNotificationById(notificationId)
  if (!notification) {
    return { success: false, statusCode: 404, message: 'Notification not found' }
  }

  if (notification.receiverId !== userId) {
    return { success: false, statusCode: 403, message: 'Forbidden: You do not own this notification' }
  }

  const updated = await markAsRead(notificationId, userId)
  if (!updated) {
    return { success: false, statusCode: 404, message: 'Notification not found' }
  }

  return {
    success: true,
    message: 'Notification marked as read',
    data: formatNotificationResponse(updated)
  }
}

/**
 * Mark all notifications as read for the authenticated user.
 */
export const markAllNotificationsReadService = async (
  userId: string
): Promise<ServiceResponse> => {
  if (!isValidUUID(userId)) {
    return { success: false, statusCode: 400, message: 'Invalid user ID' }
  }

  const result = await markAllAsRead(userId)
  return {
    success: true,
    message: 'All notifications marked as read',
    data: { count: result.count }
  }
}

/**
 * Centralized notification creation service with non-blocking realtime Socket.IO broadcast.
 * Preserves exact function signature for callers across Phases 2–9.
 */
export const pushNotificationService = async ({
  senderId,
  receiverId,
  type,
  message,
  relatedId,
  tx
}: {
  senderId?: string | null
  receiverId: string
  type: string | ENotificationType
  message: string
  relatedId?: string | null
  tx?: PrismaTransactionClient
}): Promise<ServiceResponse> => {
  if (!receiverId || !isValidUUID(receiverId)) {
    return { success: false, statusCode: 400, message: 'Invalid receiver ID' }
  }

  const normalizedSenderId = senderId && isValidUUID(senderId) ? senderId : null

  // Normalize type to Prisma ENotificationType
  const upperType = String(type).toUpperCase()
  const validTypes = Object.values(ENotificationType) as string[]
  const notificationType = validTypes.includes(upperType)
    ? (upperType as ENotificationType)
    : ENotificationType.SYSTEM

  const created = await createNotification(
    {
      senderId: normalizedSenderId,
      receiverId,
      type: notificationType,
      message,
      relatedId: relatedId ? String(relatedId) : null
    },
    tx
  )

  const formatted = formatNotificationResponse(created)

  // Realtime Socket.IO dispatch (Non-blocking and safe)
  try {
    const io = getIO()
    if (io) {
      io.to(receiverId).emit('new_notification', formatted)
    }
  } catch (socketErr) {
    console.warn('[Notification Socket.IO Dispatch Error]:', socketErr)
  }

  return {
    success: true,
    message: 'Notification pushed',
    data: formatted
  }
}
