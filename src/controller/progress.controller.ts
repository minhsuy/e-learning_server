import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  getProgressByCourseService,
  markLessonCompleteService,
  unmarkLessonCompleteService
} from '~/services/progress.service'

export const markLessonCompleteController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { courseId, lessonId } = req.body

  const result = await markLessonCompleteService({ userId, courseId, lessonId })
  return res.status(result.statusCode || 200).json(result)
})

// uncomplete

export const unmarkLessonCompleteController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { courseId, lessonId } = req.body

  const result = await unmarkLessonCompleteService({ userId, courseId, lessonId })
  return res.status(result.statusCode || 200).json(result)
})

// get progess by course
export const getProgressByCourseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { courseId } = req.params
  const result = await getProgressByCourseService({ userId, courseId })
  return res.status(result.statusCode || 200).json(result)
})
