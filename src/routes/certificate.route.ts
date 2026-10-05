import express from 'express'
import { createCertificateController } from '~/controller/certificate.controller'
import { createCertificateValidator } from '~/middlewares/certificate.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const certificateRouter = express.Router()

// POST /api/certificates
certificateRouter.post(
  '/',
  verifyAccessToken,
  createCertificateValidator,
  handleValidationErrors,
  createCertificateController
)

export default certificateRouter
