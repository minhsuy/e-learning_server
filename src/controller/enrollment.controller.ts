import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  getMyEnrollmentsService,
  getStudentProgressByEnrollmentIdService,
  getStudentProgressInCourseService,
  getStudentsByCourseService,
  removeStudentFromCourseService
} from '~/services/enrollment.service'

// get my enrollments
export const getMyEnrollmentsController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }

  const result = await getMyEnrollmentsService({ userId })

  return res.status(result.statusCode || 200).json(result)
})

// get students by specific course
export const getStudentsByCourseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = req.params.id as string
  const { page = 1, limit = 10, search } = req.query
  const { userId, role } = req.user as { userId: string; role: string }

  const result = await getStudentsByCourseService({
    courseId: id,
    userId,
    role,
    page: Number(page),
    limit: Number(limit),
    search: typeof search === 'string' ? search : undefined
  })

  return res.status(result.statusCode || 200).json(result)
})

// kick a student from a course
export const removeStudentFromCourseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const id = req.params.id as string
  const targetUserId = req.params.userId as string
  const { userId, role } = req.user as { userId: string; role: string }
  const result = await removeStudentFromCourseService({
    courseId: id,
    targetUserId,
    userId,
    role
  })

  return res.status(result.statusCode || 200).json(result)
})

// get detailed student learning progress in a course (Teacher/Admin)
export const getStudentProgressInCourseController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const courseId = (req.params.courseId || req.params.id) as string
    const studentUserId = req.params.userId as string
    const { userId, role } = req.user as { userId: string; role: string }

    const result = await getStudentProgressInCourseService({
      courseId,
      studentUserId,
      currentUserId: userId,
      role
    })

    return res.status(result.statusCode || 200).json(result)
  }
)

// get detailed student learning progress by enrollment ID (Teacher/Admin)
export const getStudentProgressByEnrollmentIdController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const enrollmentId = req.params.enrollmentId as string
    const { userId, role } = req.user as { userId: string; role: string }

    const result = await getStudentProgressByEnrollmentIdService({
      enrollmentId,
      currentUserId: userId,
      role
    })

    return res.status(result.statusCode || 200).json(result)
  }
)
