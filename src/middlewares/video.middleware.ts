import { body, param } from 'express-validator'
import { validateUUIDParam } from '~/utils/uuid'

/**
 * Validator for requesting a direct TUS upload signature to Bunny Stream.
 */
export const createUploadSignatureValidator = [
  body('title')
    .notEmpty()
    .withMessage('Video title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),

  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Course ID (must be a valid UUID)'),

  body('chapterId')
    .optional({ checkFalsy: true })
    .custom(validateUUIDParam)
    .withMessage('Invalid Chapter ID (must be a valid UUID)')
]

/**
 * Validator for videoId route parameters (Bunny GUID).
 */
export const videoIdParamValidator = [
  param('videoId')
    .notEmpty()
    .withMessage('Video ID (GUID) is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Invalid Video ID format')
]

/**
 * Validator for lessonId route parameters when requesting playback info.
 */
export const lessonIdParamValidator = [
  param('lessonId')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Lesson ID')
]
