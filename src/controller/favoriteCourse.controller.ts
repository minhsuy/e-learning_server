import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { addFavoriteService, getFavoritesService, removeFavoriteService } from '~/services/favoriteCourse.service'

export const addFavoriteController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId } = req.user as { userId: string }

  const result = await addFavoriteService(userId, id)
  return res.status(result.statusCode || 200).json(result)
})

export const removeFavoriteController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId } = req.user as { userId: string }

  const result = await removeFavoriteService(userId, id)
  return res.status(result.statusCode || 200).json(result)
})
export const getFavoritesController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const page = req.query.page ? Number(req.query.page) : 1
  const limit = req.query.limit ? Number(req.query.limit) : 10

  const result = await getFavoritesService(userId, page, limit)
  return res.status(result.statusCode || 200).json(result)
})
