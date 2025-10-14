import express from 'express'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { handleValidationErrors } from '~/middlewares/validate'
import { getNotificationsValidator, notificationIdValidator } from '~/middlewares/notification.middleware'
import { getNotificationsController, markNotificationReadController } from '~/controller/notification.controller'

const notificationRouter = express.Router()

// GET /api/notifications -> get all notifications
notificationRouter.get(
  '/',
  verifyAccessToken,
  getNotificationsValidator,
  handleValidationErrors,
  getNotificationsController
)

// GET /api/notifications/read/:id -> mark notification as read
notificationRouter.patch(
  '/read/:id',
  verifyAccessToken,
  notificationIdValidator,
  handleValidationErrors,
  markNotificationReadController
)
export default notificationRouter
