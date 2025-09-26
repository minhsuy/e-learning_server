import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  createTeacherService,
  deleteUserByAdminService,
  getAllUsersService,
  getUserDetailService,
  updateUserByAdminService
} from '~/services/admin.service'

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
