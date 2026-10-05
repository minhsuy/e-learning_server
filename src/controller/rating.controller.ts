import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  createNewRatingService,
  deleteRatingService,
  getCourseRatingsService,
  getRatingsForAdminOrTeacherService,
  updateRatingStatusService
} from '~/services/rating.service'
import { ERatingStatus } from '@prisma/client'

export const createNewRatingController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { courseId, rate, content } = req.body
  const { userId } = req.user as { userId: string }

  const result = await createNewRatingService({
    courseId,
    rate: Number(rate),
    content,
    userId
  })

  return res.status(result.statusCode || 200).json(result)
})

export const getCourseRatingsController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = String(req.params.id)

  const result = await getCourseRatingsService(id)

  return res.status(result.statusCode || 200).json(result)
})

export const getRatingsForAdminOrTeacherController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { courseId, status, page, limit } = req.query
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await getRatingsForAdminOrTeacherService({
    courseId: courseId ? String(courseId) : undefined,
    status: status ? String(status) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    userId,
    role
  })

  return res.status(result.statusCode || 200).json(result)
})

export const deleteRatingController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = String(req.params.id)
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await deleteRatingService({ ratingId: id, userId, role })

  return res.status(result.statusCode || 200).json(result)
})

export const updateRatingStatusController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = String(req.params.id)
  const { status } = req.body
  const { userId, role } = req.user as { userId: string; role: string }

  const parsedStatus = String(status).toUpperCase() as ERatingStatus

  const result = await updateRatingStatusService({
    ratingId: id,
    status: parsedStatus,
    userId,
    role
  })

  return res.status(result.statusCode || 200).json(result)
})
