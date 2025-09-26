import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { createCourseService, getCourseDetailPublicService, getListCoursesService } from '~/services/course.service'

// course detail

export const getCourseDetailPublicController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { slug } = req.params
  const result = await getCourseDetailPublicService({ slug, increaseView: true })

  if (!result.success) {
    return res.status(result.statusCode ?? 404).json(result)
  }
  return res.status(200).json(result)
})

// course list

export const getListCoursesController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await getListCoursesService(req.query)
  return res.status(200).json(result)
})
