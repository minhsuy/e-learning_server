import { Router } from 'express'
import { query } from 'express-validator'
import {
  getPersonalizedRecommendationsController,
  getRecommendationHealthController,
  getSimilarCoursesController
} from '~/controller/recommendation.controller'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { validateRouteUUIDParam } from '~/utils/uuid'

const recommendationRouter = Router()

/**
 * @route   GET /api/recommendations/health
 * @desc    Check liveness and readiness of the Recommendation Integration Layer
 * @access  Public / Internal
 */
recommendationRouter.get('/health', getRecommendationHealthController)

/**
 * @route   GET /api/recommendations/courses/:courseId/similar
 * @desc    Item-to-Item Similar Course Recommendation
 * @access  Public
 */
recommendationRouter.get(
  '/courses/:courseId/similar',
  [
    validateRouteUUIDParam('courseId'),
    query('top_k')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('top_k must be an integer between 1 and 50'),
    query('retrieval_depth')
      .optional()
      .isInt({ min: 10, max: 200 })
      .withMessage('retrieval_depth must be an integer between 10 and 200'),
    query('enable_diversity')
      .optional()
      .isBoolean()
      .withMessage('enable_diversity must be a boolean (true or false)'),
    query('max_courses_per_category')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('max_courses_per_category must be an integer between 1 and 10'),
    handleValidationErrors
  ],
  getSimilarCoursesController
)

/**
 * @route   GET /api/recommendations/personalized
 * @desc    User-to-Item Personalized Course Recommendation
 * @access  Private (Authenticated Learners)
 */
recommendationRouter.get(
  '/personalized',
  [
    verifyAccessToken,
    query('top_k')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('top_k must be an integer between 1 and 50'),
    query('retrieval_depth')
      .optional()
      .isInt({ min: 10, max: 200 })
      .withMessage('retrieval_depth must be an integer between 10 and 200'),
    query('filter_completed')
      .optional()
      .isBoolean()
      .withMessage('filter_completed must be a boolean (true or false)'),
    query('filter_enrolled')
      .optional()
      .isBoolean()
      .withMessage('filter_enrolled must be a boolean (true or false)'),
    query('enable_diversity')
      .optional()
      .isBoolean()
      .withMessage('enable_diversity must be a boolean (true or false)'),
    query('max_courses_per_category')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('max_courses_per_category must be an integer between 1 and 10'),
    query('preferred_level')
      .optional()
      .customSanitizer((v) => (typeof v === 'string' ? v.toUpperCase() : v))
      .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
      .withMessage('preferred_level must be one of: BEGINNER, INTERMEDIATE, ADVANCED'),
    handleValidationErrors
  ],
  getPersonalizedRecommendationsController
)

export default recommendationRouter

