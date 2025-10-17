// controller/certificate.controller.ts
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { createCertificateService } from '~/services/certificate.service'

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
