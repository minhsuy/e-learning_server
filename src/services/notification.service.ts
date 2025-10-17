import NotificationModel from '~/models/notification.model'
import { ServiceResponse } from '~/types/type'
import { getIO } from '~/socket/initSocket'

// Get notifications
export const getNotificationsService = async (
  userId: string,
  page = 1,
  limit = 10,
  type?: string
): Promise<ServiceResponse> => {
  const skip = (page - 1) * limit
  const filter: any = { receiver: userId }
  if (type) filter.type = type

  const [notifications, total] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar'),
    NotificationModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched notifications successfully',
    data: { notifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }
}
// Mark notification as read
export const markNotificationReadService = async (notificationId: string, userId: string): Promise<ServiceResponse> => {
  const notification = await NotificationModel.findById(notificationId)
  if (!notification || notification.receiver.toString() !== userId) {
    return { success: false, statusCode: 404, message: 'Notification not found' }
  }
  notification.read = true
  await notification.save()
  return { success: true, message: 'Notification marked as read', data: notification }
}
// Push notification
export const pushNotificationService = async ({
  senderId,
  receiverId,
  type,
  message,
  relatedId
}: {
  senderId?: string | null
  receiverId: string
  type: string
  message: string
  relatedId?: string
}): Promise<ServiceResponse> => {
  const notification = await NotificationModel.create({
    sender: senderId ? senderId : null,
    receiver: receiverId,
    type,
    message,
    relatedId
  })

  const io = getIO()
  io.to(`${receiverId}`).emit('new_notification', notification)

  return { success: true, message: 'Notification pushed', data: notification }
}
