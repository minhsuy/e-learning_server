import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { getNotificationsService, markNotificationReadService } from '~/services/notification.service'

export const getNotificationsController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const page = req.query.page ? Number(req.query.page) : 1
  const limit = req.query.limit ? Number(req.query.limit) : 10
  const type = req.query.type ? String(req.query.type) : undefined

  const result = await getNotificationsService(userId, page, limit, type)
  return res.status(result.statusCode || 200).json(result)
})

export const markNotificationReadController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { id } = req.params

  const result = await markNotificationReadService(id, userId)
  return res.status(result.statusCode || 200).json(result)
})
