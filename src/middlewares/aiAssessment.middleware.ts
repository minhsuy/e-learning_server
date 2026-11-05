import { body, param } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — MIDDLEWARE: AI ASSESSMENT VALIDATORS (STEP 7C)
 * 
 * Syntactic HTTP transport validation for AI Assessment Generation endpoints.
 * Reuses isValidUUID from ~/utils/uuid.
 */

export const validateAssessmentLessonParam = [
  param().custom((value, { req }) => {
    const rawId = req.params?.id || req.params?.lessonId
    if (!isValidUUID(rawId)) {
      throw new Error('Invalid Lesson ID format, must be UUID')
    }
    return true
  })
]

export const generateAiQuizValidator = [
  ...validateAssessmentLessonParam,

  body('questionCount')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('questionCount must be an integer between 1 and 30'),

  body('difficulty')
    .optional()
    .isIn(['EASY', 'MEDIUM', 'HARD', 'MIXED'])
    .withMessage('difficulty must be one of: EASY, MEDIUM, HARD, MIXED'),

  body('teacherInstructions')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage('teacherInstructions must be a string up to 1000 characters'),

  body('language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('language must be between 2 and 10 characters'),

  body('previewOnly')
    .optional()
    .isBoolean()
    .withMessage('previewOnly must be boolean'),

  body('confirmOverwrite')
    .optional()
    .isBoolean()
    .withMessage('confirmOverwrite must be boolean'),

  body('asyncMode')
    .optional()
    .isBoolean()
    .withMessage('asyncMode must be boolean')
]

export const generateAiCodingExerciseValidator = [
  ...validateAssessmentLessonParam,

  body('language')
    .optional()
    .isIn(['javascript', 'typescript', 'python'])
    .withMessage('language must be one of: javascript, typescript, python'),

  body('difficulty')
    .optional()
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('difficulty must be one of: EASY, MEDIUM, HARD'),

  body('teacherInstructions')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage('teacherInstructions must be a string up to 1000 characters'),

  body('exerciseCount')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('exerciseCount must be an integer between 1 and 5'),

  body('previewOnly')
    .optional()
    .isBoolean()
    .withMessage('previewOnly must be boolean'),

  body('verifyWithE2b')
    .optional()
    .isBoolean()
    .withMessage('verifyWithE2b must be boolean'),

  body('asyncMode')
    .optional()
    .isBoolean()
    .withMessage('asyncMode must be boolean'),

  body('previewToken')
    .optional()
    .isString()
    .withMessage('previewToken must be a string')
]

export const saveApprovedAiQuizValidator = [
  ...validateAssessmentLessonParam,

  body('title')
    .optional()
    .isString()
    .isLength({ min: 3, max: 255 })
    .withMessage('title must be between 3 and 255 characters'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage('description cannot exceed 1000 characters'),

  body('duration')
    .optional()
    .isInt({ min: 1, max: 360 })
    .withMessage('duration must be an integer between 1 and 360 minutes'),

  body('passingGrade')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('passingGrade must be an integer between 0 and 100'),

  body('confirmOverwrite')
    .optional()
    .isBoolean()
    .withMessage('confirmOverwrite must be boolean'),

  body('questions')
    .isArray({ min: 1, max: 30 })
    .withMessage('questions must be an array of 1 to 30 questions')
]

export const saveApprovedAiCodingExerciseValidator = [
  ...validateAssessmentLessonParam,

  body('previewToken')
    .isString()
    .notEmpty()
    .withMessage('previewToken is required and cannot be empty')
]

