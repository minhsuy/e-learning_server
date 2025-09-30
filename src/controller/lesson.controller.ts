import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import {
  createLessonService,
  deleteLessonService,
  getLessonsByChapterService,
  updateLessonService
} from '~/services/lesson.service'

export const createLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await createLessonService({
    payload: req.body,
    userId,
    role
  })

  return res.status(result.statusCode ?? (result.success ? 201 : 400)).json(result)
})

// update lesson

export const updateLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await updateLessonService({ lessonId: id, payload: req.body, userId, role })
  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})

// delete lesson
export const deleteLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await deleteLessonService({ lessonId: id, userId, role })
  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})
// get lesson by chapter
export const getLessonsByChapterController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { chapterId } = req.params
  const result = await getLessonsByChapterService(chapterId)

  return res.status(result.success ? 200 : (result.statusCode ?? 400)).json(result)
})
