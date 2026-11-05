import { body, param } from 'express-validator'
import { validateUUIDParam } from '~/utils/uuid'
import { AiJobType } from '~/models/aiJob.model'

/**
 * TMDEMY — AI PROCESSING JOB MIDDLEWARES & VALIDATORS
 * 
 * Express Validator chains for AI Job endpoints.
 * Conforms to AGENTS.md Transport Layer rules.
 */

export const jobIdValidator = [
  param('jobId')
    .notEmpty()
    .withMessage('Job ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Job UUID format')
]

export const triggerAiJobValidator = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Lesson UUID format'),

  body('jobType')
    .optional()
    .isIn(Object.values(AiJobType))
    .withMessage(`Invalid jobType. Allowed: ${Object.values(AiJobType).join(', ')}`),

  body('videoFingerprint')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('videoFingerprint cannot exceed 255 characters'),

  body('model')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('model name cannot exceed 100 characters')
]
