import express from 'express'
import {
  createCertificateController,
  getMyCertificatesController,
  getCertificateByCourseController,
  verifyCertificateController
} from '~/controller/certificate.controller'
import {
  createCertificateValidator,
  certificateCourseIdParamValidator,
  verifyCertificateCodeParamValidator
} from '~/middlewares/certificate.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const certificateRouter = express.Router()

// 1. POST /api/certificates - Request new certificate
certificateRouter.post(
  '/',
  verifyAccessToken,
  createCertificateValidator,
  handleValidationErrors,
  createCertificateController
)

// 2. GET /api/certificates/my - List all certificates of authenticated user
certificateRouter.get(
  '/my',
  verifyAccessToken,
  getMyCertificatesController
)

// 3. GET /api/certificates/course/:courseId - Get certificate for specific course
certificateRouter.get(
  '/course/:courseId',
  verifyAccessToken,
  certificateCourseIdParamValidator,
  handleValidationErrors,
  getCertificateByCourseController
)

// 4. GET /api/certificates/verify/:code - Public certificate verification (NO JWT)
certificateRouter.get(
  '/verify/:code',
  verifyCertificateCodeParamValidator,
  handleValidationErrors,
  verifyCertificateController
)

export default certificateRouter
