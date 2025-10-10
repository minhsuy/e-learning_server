import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  createCommentService,
  deleteCommentByAdminOrTeacherService,
  deleteCommentService,
  dislikeCommentService,
  getCommentsByAdminOrTeacherService,
  getCommentsByLessonService,
  likeCommentService,
  updateCommentService
} from '~/services/comment.service'

export const createCommentController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }

  const result = await createCommentService({
    ...req.body,
    userId
  })

  return res.status(result.statusCode || 200).json(result)
})

export const getCommentsByLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { lessonId } = req.params
  const result = await getCommentsByLessonService({ lessonId })
  return res.status(result.statusCode || 200).json(result)
})
// delete comment :
export const deleteCommentController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const { id } = req.params

  const result = await deleteCommentService({ commentId: id, userId, role })
  return res.status(result.statusCode || 200).json(result)
})
// get comments by admin or teacher
export const getCommentsByAdminOrTeacherController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { page, limit, search, status, courseId } = req.query
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await getCommentsByAdminOrTeacherService({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search: search ? String(search) : undefined,
    status: status ? String(status) : undefined,
    courseId: courseId ? String(courseId) : undefined,
    userId,
    role
  })

  return res.status(200).json(result)
})
// update-comment :

export const updateCommentController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { content } = req.body

  const { userId, role } = req.user as { userId: string; role: string }

  const result = await updateCommentService({
    commentId: id,
    content,
    userId,
    role
  })

  return res.status(result.statusCode || 200).json(result)
})
export const likeCommentController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { commentId } = req.params
  const { userId } = req.user as { userId: string }

  const result = await likeCommentService({
    commentId,
    userId
  })

  return res.status(result.statusCode || 200).json(result)
})

export const dislikeCommentController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { commentId } = req.params
  const { userId } = req.user as { userId: string }

  const result = await dislikeCommentService({
    commentId,
    userId
  })

  return res.status(result.statusCode || 200).json(result)
})

// delete comment by admin or teacher
export const deleteCommentByAdminOrTeacherController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params // Lấy commentId từ URL
    const { userId, role } = req.user as { userId: string; role: string }

    const result = await deleteCommentByAdminOrTeacherService({
      commentId: id,
      userId,
      role
    })

    return res.status(result.statusCode || 200).json(result)
  }
)
