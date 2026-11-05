import { NextFunction, Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { body, param } from 'express-validator'
import { LessonType, UserRole } from '~/types/enum'
import { validateUUIDParam } from '~/utils/uuid'
import { verifyToken } from '~/middlewares/verifyToken'
import { verifyInboundAiSecret } from '~/config/ai.config'

export const createLessonValidator = [
  body('title')
    .notEmpty()
    .withMessage('Lesson title is required')
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters'),

  body('slug').optional({ checkFalsy: true }).isSlug().withMessage('Slug must be valid (kebab-case)'),

  body('chapter')
    .notEmpty()
    .withMessage('Chapter ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Chapter ID'),

  body('course')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Course ID'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(LessonType)).withMessage('Invalid lesson type'),

  body('duration').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Duration must be >= 0'),

  body('content').optional({ checkFalsy: true }).isString(),

  body('videoUrl').optional({ checkFalsy: true }).isURL().withMessage('Video URL must be valid'),

  body('isDemo').optional().isBoolean().withMessage('isDemo must be true/false'),

  body('bunnyVideoId')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Invalid Bunny Video ID format')
]

export const updateLessonValidator = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Lesson ID'),

  body('title').optional({ checkFalsy: true }).isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),

  body('type').optional({ checkFalsy: true }).isIn(Object.values(LessonType)).withMessage('Invalid lesson type'),

  body('duration').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Duration must be >= 0'),

  body('content').optional({ checkFalsy: true }).isString(),

  body('videoUrl').optional({ checkFalsy: true }).isURL().withMessage('Video URL must be valid'),

  body('isDemo').optional().isBoolean().withMessage('isDemo must be true/false'),

  body('bunnyVideoId')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Invalid Bunny Video ID format')
]

export const chapterIdValidator = [
  param('chapterId')
    .notEmpty()
    .withMessage('Chapter ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Chapter ID')
]

export const lessonIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Lesson ID')
]

/**
 * Transport-layer validator for PATCH /api/lessons/:id/ai-content
 */
export const updateLessonAiContentValidator = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required')
    .custom(validateUUIDParam)
    .withMessage('Invalid Lesson ID'),

  body('transcript')
    .optional({ nullable: true })
    .isString()
    .withMessage('Transcript must be a string or null'),

  body('transcriptOriginal')
    .optional({ nullable: true })
    .isString()
    .withMessage('transcriptOriginal must be a string or null'),

  body('transcriptRefined')
    .optional({ nullable: true })
    .isString()
    .withMessage('transcriptRefined must be a string or null'),

  body('summary')
    .optional({ nullable: true })
    .isString()
    .withMessage('Summary must be a string or null'),

  body('aiProcessingStatus')
    .optional()
    .isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
    .withMessage('Invalid aiProcessingStatus value'),

  body('aiProcessingError')
    .optional({ nullable: true })
    .isString()
    .withMessage('aiProcessingError must be a string or null'),

  body('bunnyVideoId')
    .optional()
    .isString()
    .withMessage('bunnyVideoId must be a string'),

  body('clientTimestamp')
    .optional()
    .custom((val) => !isNaN(Date.parse(val)))
    .withMessage('clientTimestamp must be a valid date string')
]

/**
 * Multi-mode authentication for AI Content updates:
 * Supports server-to-server x-ai-service-key header OR Teacher/Admin Bearer JWT.
 * Ordinary students are strictly blocked.
 */
export const authenticateAiOrTeacherAdmin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // 1. Check for server-to-server AI microservice key
    const aiKey = req.headers['x-ai-service-key']
    if (aiKey !== undefined) {
      if (verifyInboundAiSecret(aiKey)) {
        req.user = {
          userId: 'ai-microservice',
          role: 'AI_SERVICE'
        }
        return next()
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid AI Service API Key'
      })
    }

    // 2. Otherwise require valid Bearer JWT
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access Token is missing!'
      })
    }

    const token = authHeader.split(' ')[1]

    try {
      const decoded: any = await verifyToken({
        token,
        privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string
      })

      if (decoded.role !== UserRole.ADMIN && decoded.role !== UserRole.TEACHER) {
        return res.status(403).json({
          success: false,
          message: 'FORBIDDEN - Teacher or Admin role required'
        })
      }

      req.user = decoded
      next()
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: err.name === 'TokenExpiredError' ? 'jwt expired' : 'invalid token'
      })
    }
  }
)

/**
 * Optional authentication middleware for lesson reading.
 * If token or AI service key is present, decodes it into req.user.
 * If absent, proceeds as unauthenticated public caller.
 */
export const optionalAuthMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const aiKey = req.headers['x-ai-service-key']
    if (aiKey !== undefined && verifyInboundAiSecret(aiKey)) {
      req.user = {
        userId: 'ai-microservice',
        role: 'AI_SERVICE'
      }
      return next()
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    try {
      const decoded: any = await verifyToken({
        token,
        privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string
      })
      req.user = decoded
      next()
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: err.name === 'TokenExpiredError' ? 'jwt expired' : 'invalid token'
      })
    }
  }
)

