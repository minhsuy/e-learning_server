import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  createTeacherService,
  deleteCourseByAdminService,
  deleteUserByAdminService,
  getAllUsersService,
  getCoursesByAdminService,
  getUserDetailService,
  updateCourseByAdminService,
  updateUserByAdminService
} from '~/services/admin.service'
import { createCourseService } from '~/services/course.service'

// get all users

export const getAllUsersController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await getAllUsersService(req.query)
  return res.status(200).json(result)
})

// update user

export const updateUserByAdminController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params

  const result = await updateUserByAdminService({ id, payload: req.body })

  if (!result.success) {
    const status = result.statusCode ?? 400
    return res.status(status).json(result)
  }

  return res.status(200).json(result)
})

// delete user

export const deleteUserByAdminController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const performedBy = (req.user as any)?.userId

  const result = await deleteUserByAdminService({ id, performedBy })

  if (!result.success) {
    return res.status(result.statusCode ?? 400).json(result)
  }
  return res.status(200).json(result)
})

// add user(only teacher)

export const createTeacherController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await createTeacherService({ payload: req.body })
  if (!result.success) {
    return res.status(result.statusCode ?? 400).json(result)
  }
  return res.status(201).json(result)
})

// ---------- COURSE ----------

// create course by admin
export const createCourseByAdminController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await createCourseService({ author: userId, payload: req.body, role })
  return res.status(result.success ? 201 : (result.statusCode ?? 400)).json(result)
})

// update course by admin

export const updateCourseByAdminController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const result = await updateCourseByAdminService({ courseId: id, payload: req.body })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

// delete course by admin

export const deleteCourseByAdminController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params
  const result = await deleteCourseByAdminService({ courseId: id })
  return res.status(result.success ? 200 : result.statusCode || 400).json(result)
})

// get all course by admin
export const getCoursesByAdminController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const result = await getCoursesByAdminService({ params: req.query })
  return res.status(200).json(result)
})
