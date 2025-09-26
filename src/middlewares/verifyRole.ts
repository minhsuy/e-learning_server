import { NextFunction, Request, Response } from 'express'
import { UserRole } from '~/types/enum'
import asyncHandler from 'express-async-handler'

export const isAdmin = asyncHandler((req: Request, res: Response, next: NextFunction): any => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'UNAUTHORIZED - No user found in request'
    })
  }

  const { role } = req.user

  if (role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'FORBIDDEN - Admin role required'
    })
  }

  next()
})
export const isTeacher = asyncHandler((req: Request, res: Response, next: NextFunction): any => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'UNAUTHORIZED - No user found in request'
    })
  }

  const { role } = req.user

  if (role !== UserRole.TEACHER) {
    return res.status(403).json({
      success: false,
      message: 'FORBIDDEN - Teacher role required'
    })
  }

  next()
})
export const isTeacherOrAdmin = asyncHandler((req: Request, res: Response, next: NextFunction): any => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'UNAUTHORIZED - No user found in request'
    })
  }

  const { role } = req.user

  if (role !== UserRole.ADMIN && role !== UserRole.TEACHER) {
    return res.status(403).json({
      success: false,
      message: 'FORBIDDEN - Teacher or Admin role required'
    })
  }

  next()
})
