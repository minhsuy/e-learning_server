import { ENotificationType, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: NOTIFICATION
 * 
 * Provides database operations on PostgreSQL `notifications` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const NOTIFICATION_SENDER_SELECT = {
  id: true,
  username: true,
  avatar: true
} as const satisfies Prisma.UserSelect

export const NOTIFICATION_PUBLIC_SELECT = {
  id: true,
  senderId: true,
  receiverId: true,
  type: true,
  message: true,
  relatedId: true,
  isRead: true,
  createdAt: true,
  updatedAt: true,
  sender: {
    select: NOTIFICATION_SENDER_SELECT
  }
} as const satisfies Prisma.NotificationSelect

export type NotificationPublicPayload = Prisma.NotificationGetPayload<{
  select: typeof NOTIFICATION_PUBLIC_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Create a new notification in PostgreSQL.
 */
export const createNotification = async (
  data: {
    senderId?: string | null
    receiverId: string
    type: ENotificationType
    message: string
    relatedId?: string | null
  },
  tx?: PrismaTransactionClient
): Promise<NotificationPublicPayload> => {
  const client = tx || prisma
  return client.notification.create({
    data: {
      senderId: data.senderId ?? null,
      receiverId: data.receiverId,
      type: data.type,
      message: data.message,
      relatedId: data.relatedId ?? null
    },
    select: NOTIFICATION_PUBLIC_SELECT
  })
}

/**
 * Find notification by UUID.
 */
export const findNotificationById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<NotificationPublicPayload | null> => {
  const client = tx || prisma
  return client.notification.findUnique({
    where: { id },
    select: NOTIFICATION_PUBLIC_SELECT
  })
}

/**
 * Find notifications for a specific user with pagination and optional type filter.
 * Results are ordered by createdAt descending.
 */
export const findNotificationsByUser = async (
  params: {
    receiverId: string
    page?: number
    limit?: number
    type?: ENotificationType
  },
  tx?: PrismaTransactionClient
): Promise<NotificationPublicPayload[]> => {
  const client = tx || prisma
  const { receiverId, page = 1, limit = 10, type } = params
  const skip = (page - 1) * limit

  return client.notification.findMany({
    where: {
      receiverId,
      ...(type ? { type } : {})
    },
    select: NOTIFICATION_PUBLIC_SELECT,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  })
}

/**
 * Count notifications for a specific user with optional type and read status filters.
 */
export const countNotificationsByUser = async (
  params: {
    receiverId: string
    type?: ENotificationType
    isRead?: boolean
  },
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const { receiverId, type, isRead } = params

  return client.notification.count({
    where: {
      receiverId,
      ...(type ? { type } : {}),
      ...(isRead !== undefined ? { isRead } : {})
    }
  })
}

/**
 * Mark a specific notification as read, ensuring ownership authorization.
 */
export const markAsRead = async (
  id: string,
  receiverId: string,
  tx?: PrismaTransactionClient
): Promise<NotificationPublicPayload | null> => {
  const client = tx || prisma

  // Check existence and ownership
  const existing = await client.notification.findUnique({
    where: { id },
    select: { id: true, receiverId: true }
  })

  if (!existing || existing.receiverId !== receiverId) {
    return null
  }

  return client.notification.update({
    where: { id },
    data: { isRead: true },
    select: NOTIFICATION_PUBLIC_SELECT
  })
}

/**
 * Mark all unread notifications as read for a given user.
 */
export const markAllAsRead = async (
  receiverId: string,
  tx?: PrismaTransactionClient
): Promise<{ count: number }> => {
  const client = tx || prisma
  const result = await client.notification.updateMany({
    where: {
      receiverId,
      isRead: false
    },
    data: { isRead: true }
  })
  return { count: result.count }
}

/**
 * Delete a notification by ID with optional receiver ownership verification.
 */
export const deleteNotification = async (
  id: string,
  receiverId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma

  if (receiverId) {
    const existing = await client.notification.findUnique({
      where: { id },
      select: { receiverId: true }
    })
    if (!existing || existing.receiverId !== receiverId) {
      return false
    }
  }

  try {
    await client.notification.delete({
      where: { id }
    })
    return true
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false
    }
    throw error
  }
}
