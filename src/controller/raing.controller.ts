import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  createNewRatingService,
  deleteRatingService,
  getCourseRatingsService,
  getRatingsForAdminOrTeacherService,
  updateRatingStatusService
} from '~/services/rating.service'

export const createNewRatingController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { courseId, rate, content } = req.body
  const { userId } = req.user as { userId: string }

  const result = await createNewRatingService({
    courseId,
    rate,
    content,
    userId
  })

  return res.status(result.statusCode || 200).json(result)
})

// get course rating
export const getCourseRatingsController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params

  const result = await getCourseRatingsService(id)

  return res.status(result.statusCode || 200).json(result)
})

// manage rating for admin or teacher
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
// delete rating by admin or teacher
export const deleteRatingController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await deleteRatingService({ ratingId: id, userId, role })

  return res.status(result.statusCode || 200).json(result)
})
// update rating by admin or teacher
export const updateRatingStatusController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { status } = req.body
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await updateRatingStatusService({ ratingId: id, status, userId, role })

  return res.status(result.statusCode || 200).json(result)
})
