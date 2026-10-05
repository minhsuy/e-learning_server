import { z } from 'zod'
import { ENotificationType } from '~/types/enum'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: NOTIFICATION
 * 
 * Single Source of Truth for Notification domain validation and types at Application Layer.
 * Conforms to AGENTS.md and application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma (model Notification)
 * Legacy Mongoose Model: src/models/legacy/notification.legacy.model.ts
 */

// ==========================================
// 1. NESTED / COMPACT RELATIONS SCHEMAS
// ==========================================

export const notificationSenderCompactSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  username: z.string(),
  avatar: z.string().nullable().optional()
})

// ==========================================
// 2. BASE DOMAIN SCHEMA
// ==========================================

export const notificationBaseSchema = z.object({
  id: z.string().uuid(),
  senderId: z.string().uuid().nullable().optional(),
  receiverId: z.string().uuid(),
  type: z.nativeEnum(ENotificationType),
  message: z.string().min(1),
  relatedId: z.string().max(255).nullable().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. INPUT / MUTATION SCHEMAS
// ==========================================

export const createNotificationInputSchema = z.object({
  senderId: z.string().uuid().nullable().optional(),
  receiverId: z.string().uuid(),
  type: z.nativeEnum(ENotificationType),
  message: z.string().min(1),
  relatedId: z.string().max(255).nullable().optional()
})

export const getNotificationsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  type: z.nativeEnum(ENotificationType).optional()
})

// ==========================================
// 4. RESPONSE / DTO SCHEMAS
// ==========================================

export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().uuid().optional(),
  senderId: z.string().uuid().nullable().optional(),
  receiverId: z.string().uuid(),
  receiver: z.string().uuid().optional(),
  type: z.nativeEnum(ENotificationType),
  message: z.string(),
  relatedId: z.string().nullable().optional(),
  read: z.boolean(),
  isRead: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  sender: notificationSenderCompactSchema.nullable().optional()
})

export const getNotificationsResponseSchema = z.object({
  notifications: z.array(notificationResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int()
  })
})

// ==========================================
// 5. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Notification = z.infer<typeof notificationBaseSchema>
export type NotificationSenderCompact = z.infer<typeof notificationSenderCompactSchema>
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>
export type NotificationResponse = z.infer<typeof notificationResponseSchema>
export type GetNotificationsResponse = z.infer<typeof getNotificationsResponseSchema>
