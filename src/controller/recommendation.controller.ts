import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { LearnerLevel } from '~/models/recommendation.model'
import { defaultRecommendationService } from '~/services/recommendation.service'

/**
 * TMDEMY — RECOMMENDATION CONTROLLERS (REC-09)
 *
 * Transport Layer for course recommendation endpoints.
 * Extracts route/query parameters, authenticates caller identity,
 * invokes service orchestration, and sends standardized JSON responses.
 */

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || ''
  return param || ''
}

function parseOptionalInt(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined
  const parsed = Number(val)
  return !isNaN(parsed) && Number.isInteger(parsed) ? parsed : undefined
}

function parseOptionalBoolean(val: unknown): boolean | undefined {
  if (val === undefined || val === null || val === '') return undefined
  if (typeof val === 'boolean') return val
  const str = String(val).trim().toLowerCase()
  if (str === 'true' || str === '1') return true
  if (str === 'false' || str === '0') return false
  return undefined
}

function parseOptionalStringArray(val: unknown): string[] | undefined {
  if (val === undefined || val === null || val === '') return undefined
  if (Array.isArray(val)) {
    return val.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return undefined
}

/**
 * Item-to-Item Similar Course Recommendation.
 * GET /api/recommendations/courses/:courseId/similar
 */
export const getSimilarCoursesController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const courseId = getParam(req.params.courseId)
    const top_k = parseOptionalInt(req.query.top_k)
    const retrieval_depth = parseOptionalInt(req.query.retrieval_depth)
    const enable_diversity = parseOptionalBoolean(req.query.enable_diversity)
    const max_courses_per_category = parseOptionalInt(req.query.max_courses_per_category)

    const result = await defaultRecommendationService.getSimilarCourses({
      courseId,
      top_k,
      retrieval_depth,
      enable_diversity,
      max_courses_per_category
    })

    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
  }
)

/**
 * User-to-Item Personalized Course Recommendation.
 * Requires Authentication (verifyAccessToken).
 * GET /api/recommendations/personalized
 */
export const getPersonalizedRecommendationsController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const user = req.user as { userId?: string; id?: string } | undefined
    const userId = user?.userId || user?.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required. Missing user identity in session token.'
      })
    }

    const top_k = parseOptionalInt(req.query.top_k)
    const retrieval_depth = parseOptionalInt(req.query.retrieval_depth)
    const filter_completed = parseOptionalBoolean(req.query.filter_completed)
    const filter_enrolled = parseOptionalBoolean(req.query.filter_enrolled)
    const enable_diversity = parseOptionalBoolean(req.query.enable_diversity)
    const max_courses_per_category = parseOptionalInt(req.query.max_courses_per_category)

    const preferredLevelRaw = req.query.preferred_level
      ? String(req.query.preferred_level).toUpperCase()
      : undefined
    const preferred_level =
      preferredLevelRaw === 'BEGINNER' ||
      preferredLevelRaw === 'INTERMEDIATE' ||
      preferredLevelRaw === 'ADVANCED'
        ? (preferredLevelRaw as LearnerLevel)
        : undefined

    const preferred_category_names = parseOptionalStringArray(req.query.preferred_category_names)
    const preferred_topics = parseOptionalStringArray(req.query.preferred_topics)

    const result = await defaultRecommendationService.getPersonalizedRecommendations({
      userId,
      top_k,
      retrieval_depth,
      filter_completed,
      filter_enrolled,
      enable_diversity,
      max_courses_per_category,
      preferred_level,
      preferred_category_names,
      preferred_topics
    })

    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
  }
)

/**
 * Health & Readiness Check for Recommendation Integration Layer.
 * GET /api/recommendations/health
 */
export const getRecommendationHealthController = asyncHandler(
  async (_req: Request, res: Response): Promise<any> => {
    const result = await defaultRecommendationService.getHealth()
    return res.status(result.statusCode || (result.success ? 200 : 503)).json(result)
  }
)

