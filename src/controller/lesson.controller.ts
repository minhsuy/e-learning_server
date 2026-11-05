import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import {
  createLessonService,
  deleteLessonService,
  getLessonAiContentService,
  getLessonByIdService,
  getLessonsByChapterService,
  updateLessonAiContentService,
  updateLessonService
} from '~/services/lesson.service'

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || ''
  return param || ''
}

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
  const id = getParam(req.params.id)
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await updateLessonService({ lessonId: id, payload: req.body, userId, role })
  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})

// delete lesson
export const deleteLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = getParam(req.params.id)
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await deleteLessonService({ lessonId: id, userId, role })
  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})

// get lesson by chapter
export const getLessonsByChapterController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const chapterId = getParam(req.params.chapterId)
  const result = await getLessonsByChapterService(chapterId)

  return res.status(result.success ? 200 : (result.statusCode ?? 400)).json(result)
})

// get lesson detail
export const getLessonByIdController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = getParam(req.params.id)
  const { userId, role } = (req.user || {}) as { userId?: string; role?: string }

  const result = await getLessonByIdService({ lessonId: id, userId, role })
  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})

// update lesson AI transcript and summary
export const updateLessonAiContentController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = getParam(req.params.id)
  const { userId, role } = (req.user || {}) as { userId: string; role: string }

  const result = await updateLessonAiContentService({
    lessonId: id,
    payload: req.body,
    userId,
    role
  })

  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})

// get lesson AI transcript and summary
export const getLessonAiContentController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = getParam(req.params.id)
  const { userId, role } = (req.user || {}) as { userId?: string; role?: string }

  const result = await getLessonAiContentService({
    lessonId: id,
    userId,
    role
  })

  return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
})


