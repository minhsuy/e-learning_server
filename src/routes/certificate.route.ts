import { handleValidationErrors } from '~/middlewares/validate'
import express, { Request, Response } from 'express'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { createQuizValidator, quizIdValidator, updateQuizValidator } from '~/middlewares/quiz.middleware'
import { createCertificateController } from '~/controller/certificate.controller'

const certificateRouter = express.Router()
certificateRouter.post('/', verifyAccessToken, handleValidationErrors, createCertificateController)
export default certificateRouter
