import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { createCourseService } from '~/services/course.service'
import {
  deleteCoursesByTeacherService,
  getCoursesByTeacherService,
  updateCourseByTeacherService
} from '~/services/teacher.service'

// create course
export const createCourseByTeacherController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await createCourseService({ author: userId, payload: req.body, role })
  return res.status(result.success ? 201 : (result.statusCode ?? 400)).json(result)
})

// update course

export const updateCourseByTeacherController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await updateCourseByTeacherService({ courseId: id, teacherId: userId, payload: req.body })

  return res.status(result.success ? 200 : (result.statusCode ?? 400)).json(result)
})

// get my course(teacher)
export const getCoursesByTeacherController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const result = await getCoursesByTeacherService({ teacherId: userId, params: req.query })
  return res.status(200).json(result)
})

// delete course

export const deleteCourseByTeacherController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const { userId } = req.user as { userId: string }
  const result = await deleteCoursesByTeacherService({ courseId: id, teacherId: userId })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})
