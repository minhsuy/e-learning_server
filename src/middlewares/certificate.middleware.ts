import { body } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

export const createCertificateValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid courseId')
]
