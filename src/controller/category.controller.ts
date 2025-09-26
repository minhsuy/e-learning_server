import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import {
  createCategoryService,
  deleteCategoryService,
  getCategoriesService,
  getCategoryDetailService,
  updateCategoryService
} from '~/services/category.service'

// admin ----------------------------------------
export const createCategoryController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const result = await createCategoryService({ payload: req.body, created_by: userId })
  return res.status(result.success ? 201 : (result.statusCode ?? 400)).json(result)
})

// delete category

export const deleteCategoryController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const result = await deleteCategoryService(id)
  return res.status(result.success ? 200 : (result.statusCode ?? 400)).json(result)
})

// update category
export const updateCategoryController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const result = await updateCategoryService({ id, payload: req.body })
  return res.status(result.success ? 200 : (result.statusCode ?? 400)).json(result)
})

// public ----------------------------------------// list categories
export const getCategoriesController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await getCategoriesService(req.query)
  return res.status(result.success ? 200 : 400).json(result)
})

// category detail
export const getCategoryDetailController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { slug } = req.params
  const result = await getCategoryDetailService(slug)
  return res.status(result.success ? 200 : (result.statusCode ?? 400)).json(result)
})
