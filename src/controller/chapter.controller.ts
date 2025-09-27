import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import {
  createChapterService,
  deleteChapterService,
  getChaptersByCourseService,
  updateChapterService
} from '~/services/chapter.service'

export const createChapterController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { courseId } = req.params
  const { title, order } = req.body
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await createChapterService({
    courseId,
    title,
    order,
    userId,
    role
  })

  return res.status(result.success ? 201 : (result.statusCode ?? 400)).json(result)
})
// update chapter
export const updateChapterController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await updateChapterService({ chapterId: id, userId, role, payload: req.body })

  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})

// delete chapter
export const deleteChapterController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await deleteChapterService({ chapterId: id, userId, role })

  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})
// get list chapter

export const getChaptersByCourseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await getChaptersByCourseService({ courseId: id, userId, role })
  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})
