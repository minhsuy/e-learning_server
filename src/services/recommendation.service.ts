import { CourseStatus } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  HydratedRecommendationItem,
  HydratedRecommendationResponse,
  LearnerLevel
} from '~/models/recommendation.model'
import { COURSE_PUBLIC_SELECT } from '~/repositories/course.repository'
import { formatSafeCourse } from '~/services/course.service'
import {
  defaultLearnerProfileBuilder,
  LearnerProfileBuilder
} from '~/services/learnerProfile.service'
import {
  defaultRecommendationClient,
  RecommendationMicroserviceClient,
  RecommendationServiceError
} from '~/services/recommendationClient.service'
import { ServiceResponse } from '~/types/type'
import { isValidUUID } from '~/utils/uuid'

export interface SimilarCoursesParams {
  courseId: string
  top_k?: number
  retrieval_depth?: number
  enable_diversity?: boolean
  max_courses_per_category?: number
}

export interface PersonalizedRecommendationsParams {
  userId: string
  top_k?: number
  retrieval_depth?: number
  filter_completed?: boolean
  filter_enrolled?: boolean
  enable_diversity?: boolean
  max_courses_per_category?: number
  preferred_level?: LearnerLevel
  preferred_category_names?: string[]
  preferred_topics?: string[]
}

/**
 * TMDEMY — RECOMMENDATION INTEGRATION SERVICE (REC-09)
 *
 * Orchestrates:
 * 1. Source course validation / LearnerProfile synthesis from PostgreSQL
 * 2. Communication with the Python Recommendation Microservice
 * 3. PostgreSQL course hydration and publication rule enforcement
 * 4. Preservation of recommendation ranking, confidence scores, and explanations
 */
export class RecommendationService {
  private readonly client: RecommendationMicroserviceClient
  private readonly profileBuilder: LearnerProfileBuilder

  constructor(
    client: RecommendationMicroserviceClient = defaultRecommendationClient,
    profileBuilder: LearnerProfileBuilder = defaultLearnerProfileBuilder
  ) {
    this.client = client
    this.profileBuilder = profileBuilder
  }

  /**
   * Hydrates an array of course recommendations with live PostgreSQL data.
   * Enforces:
   * - Course must have status APPROVED
   * - Course must not be soft-deleted (isDestroyed === false)
   * - Parent category must not be soft-deleted
   * - Preserves the exact ranking order returned by the Python microservice
   * - Applies TMdemy formatSafeCourse DTO serialization
   */
  private async hydrateRecommendations(
    items: Array<{
      course_id: string
      rank: number
      score: number
      explanation: string
      score_breakdown?: any
    }>,
    tx?: PrismaTransactionClient
  ): Promise<HydratedRecommendationItem[]> {
    if (!items || items.length === 0) {
      return []
    }

    const client = tx || prisma
    const courseIds = items.map((it) => it.course_id)
    const validCourseIds = courseIds.filter(isValidUUID)

    if (validCourseIds.length === 0) {
      return []
    }

    // Single efficient batch lookup
    const dbCourses = await client.course.findMany({
      where: {
        id: { in: validCourseIds },
        status: CourseStatus.APPROVED,
        isDestroyed: false,
        categoryId: { not: null },
        category: {
          isDestroyed: false
        }
      },
      select: COURSE_PUBLIC_SELECT
    })

    const dbMap = new Map<string, any>()
    for (const c of dbCourses) {
      dbMap.set(c.id, c)
    }

    // Reconstruct ranking maintaining original Python ordering
    const hydratedList: HydratedRecommendationItem[] = []
    let currentRank = 1

    for (const rec of items) {
      const dbCourse = dbMap.get(rec.course_id)
      if (dbCourse) {
        const formatted = formatSafeCourse(dbCourse)
        if (formatted) {
          hydratedList.push({
            course: formatted,
            rank: currentRank++,
            score: Number(rec.score.toFixed(4)),
            explanation: rec.explanation,
            score_breakdown: rec.score_breakdown
          })
        }
      }
    }

    return hydratedList
  }

  /**
   * Retrieve similar courses for a target course.
   */
  public async getSimilarCourses(
    params: SimilarCoursesParams,
    tx?: PrismaTransactionClient
  ): Promise<ServiceResponse<HydratedRecommendationResponse>> {
    const client = tx || prisma

    try {
      // 1. Verify target course exists and is publicly accessible
      const sourceCourse = await client.course.findFirst({
        where: {
          id: params.courseId,
          status: CourseStatus.APPROVED,
          isDestroyed: false,
          categoryId: { not: null },
          category: {
            isDestroyed: false
          }
        },
        select: {
          id: true,
          title: true
        }
      })

      if (!sourceCourse) {
        return {
          success: false,
          statusCode: 404,
          message: 'Target course not found or is not currently available for recommendation.'
        }
      }

      // 2. Query Python recommendation microservice
      const pythonResponse = await this.client.getSimilarCourses({
        course_id: params.courseId,
        top_k: params.top_k,
        retrieval_depth: params.retrieval_depth,
        enable_diversity: params.enable_diversity,
        max_courses_per_category: params.max_courses_per_category
      })

      // 3. Hydrate course metadata from PostgreSQL
      const hydratedRecommendations = await this.hydrateRecommendations(
        pythonResponse.recommendations,
        tx
      )

      return {
        success: true,
        statusCode: 200,
        data: {
          mode: pythonResponse.mode,
          strategy_used: pythonResponse.strategy_used,
          models_used: pythonResponse.models_used,
          fusion_method: pythonResponse.fusion_method,
          fallback_used: pythonResponse.fallback_used,
          fallback_reason: pythonResponse.fallback_reason,
          total_candidates_retrieved: pythonResponse.total_candidates_retrieved,
          filtered_courses_count: pythonResponse.filtered_courses_count,
          recommendations: hydratedRecommendations
        }
      }
    } catch (err: unknown) {
      if (err instanceof RecommendationServiceError) {
        return {
          success: false,
          statusCode: err.statusCode,
          message: err.message
        }
      }

      const msg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        statusCode: 500,
        message: `Internal recommendation error: ${msg}`
      }
    }
  }

  /**
   * Retrieve personalized course recommendations tailored to an authenticated learner.
   */
  public async getPersonalizedRecommendations(
    params: PersonalizedRecommendationsParams,
    tx?: PrismaTransactionClient
  ): Promise<ServiceResponse<HydratedRecommendationResponse>> {
    try {
      // 1. Build LearnerProfile from live PostgreSQL state
      const profile = await this.profileBuilder.build(
        params.userId,
        {
          preferred_level: params.preferred_level,
          preferred_category_names: params.preferred_category_names,
          preferred_topics: params.preferred_topics
        },
        tx
      )

      // 2. Call Python recommendation microservice
      const pythonResponse = await this.client.getPersonalizedRecommendations({
        profile,
        top_k: params.top_k,
        retrieval_depth: params.retrieval_depth,
        filter_completed: params.filter_completed,
        filter_enrolled: params.filter_enrolled,
        enable_diversity: params.enable_diversity,
        max_courses_per_category: params.max_courses_per_category
      })

      // 3. Hydrate course metadata from PostgreSQL
      const hydratedRecommendations = await this.hydrateRecommendations(
        pythonResponse.recommendations,
        tx
      )

      return {
        success: true,
        statusCode: 200,
        data: {
          mode: pythonResponse.mode,
          strategy_used: pythonResponse.strategy_used,
          models_used: pythonResponse.models_used,
          fusion_method: pythonResponse.fusion_method,
          fallback_used: pythonResponse.fallback_used,
          fallback_reason: pythonResponse.fallback_reason,
          total_candidates_retrieved: pythonResponse.total_candidates_retrieved,
          filtered_courses_count: pythonResponse.filtered_courses_count,
          recommendations: hydratedRecommendations
        }
      }
    } catch (err: unknown) {
      if (err instanceof RecommendationServiceError) {
        return {
          success: false,
          statusCode: err.statusCode,
          message: err.message
        }
      }

      const msg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        statusCode: 500,
        message: `Internal recommendation error: ${msg}`
      }
    }
  }

  /**
   * Internal Health check probe for Recommendation integration.
   */
  public async getHealth(): Promise<ServiceResponse<any>> {
    try {
      const readyRes = await this.client.checkReadiness()
      return {
        success: true,
        statusCode: 200,
        data: {
          status: 'ready',
          service: 'TMdemy Recommendation Integration Layer',
          ready: readyRes.ready,
          catalog_course_count: readyRes.catalog_course_count
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        statusCode: 503,
        message: `Recommendation service health check failed: ${msg}`
      }
    }
  }
}

export const defaultRecommendationService = new RecommendationService()
