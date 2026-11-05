import { body, param } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

export const createCertificateValidator = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid courseId')
]

export const certificateCourseIdParamValidator = [
  param('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid courseId')
]

export const verifyCertificateCodeParamValidator = [
  param('code')
    .notEmpty()
    .withMessage('Certificate code or ID is required')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Invalid certificate verification code length')
]
