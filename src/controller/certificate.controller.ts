import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  createCertificateService,
  getMyCertificatesService,
  getCertificateByCourseService,
  verifyCertificateService
} from '~/services/certificate.service'

/**
 * TMDEMY — CONTROLLER: CERTIFICATE
 */

export const createCertificateController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const { courseId } = req.body

  const result = await createCertificateService(userId, courseId)

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } else {
    return res.status(result.statusCode || 400).json({
      success: false,
      message: result.message
    })
  }
})

export const getMyCertificatesController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }

  const result = await getMyCertificatesService(userId)

  return res.status(200).json({
    success: true,
    message: result.message,
    data: result.data
  })
})

export const getCertificateByCourseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as { userId: string }
  const courseId = req.params.courseId as string

  const result = await getCertificateByCourseService(userId, courseId)

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } else {
    return res.status(result.statusCode || 404).json({
      success: false,
      message: result.message
    })
  }
})

export const verifyCertificateController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const code = req.params.code as string

  const result = await verifyCertificateService(code)

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    })
  } else {
    return res.status(result.statusCode || 404).json({
      success: false,
      message: result.message
    })
  }
})
