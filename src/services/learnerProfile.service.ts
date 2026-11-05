import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { LearnerInteraction, LearnerLevel, LearnerProfile } from '~/models/recommendation.model'

export interface ProfileBuildOverrides {
  preferred_level?: LearnerLevel | null
  preferred_category_names?: string[]
  preferred_topics?: string[]
}

/**
 * TMDEMY — LEARNER PROFILE BUILDER SERVICE (REC-09)
 *
 * Aggregates multi-table learning signals from PostgreSQL via Prisma:
 * - Active & historical enrollments (progress, completion, enrollment date)
 * - Explicit course ratings (1-5 stars)
 * - Wishlist / Favorite courses
 * - Certificates of completion
 *
 * Produces a validated LearnerProfile contract conforming to REC-06 and REC-08.
 * Avoids N+1 queries by executing parallel index-backed lookups.
 */
export class LearnerProfileBuilder {
  /**
   * Build a complete LearnerProfile for an authenticated user.
   */
  public async build(
    userId: string,
    overrides?: ProfileBuildOverrides,
    tx?: PrismaTransactionClient
  ): Promise<LearnerProfile> {
    const client = tx || prisma

    // 1. Parallel retrieval of learner interaction signals
    const [enrollments, ratings, favorites, certificates] = await Promise.all([
      client.enrollment.findMany({
        where: { userId },
        select: {
          courseId: true,
          progress: true,
          status: true,
          enrolledAt: true,
          completedAt: true
        }
      }),
      client.rating.findMany({
        where: { userId, status: 'ACTIVE' },
        select: {
          courseId: true,
          rate: true
        }
      }),
      client.favoriteCourse.findMany({
        where: { userId },
        select: {
          courseId: true
        }
      }),
      client.certificate.findMany({
        where: { userId },
        select: {
          courseId: true,
          issuedAt: true
        }
      })
    ])

    // 2. Build lookup maps for rapid aggregation
    const ratingMap = new Map<string, number>()
    for (const r of ratings) {
      if (r.rate >= 1 && r.rate <= 5) {
        ratingMap.set(r.courseId, r.rate)
      }
    }

    const favoriteSet = new Set<string>()
    for (const f of favorites) {
      favoriteSet.add(f.courseId)
    }

    const certificateMap = new Map<string, Date>()
    for (const cert of certificates) {
      certificateMap.set(cert.courseId, cert.issuedAt)
    }

    // 3. Aggregate distinct course interactions
    const interactionMap = new Map<string, LearnerInteraction>()
    const completedCourseIdSet = new Set<string>()

    // Process enrollments
    for (const enr of enrollments) {
      const courseId = enr.courseId
      const progressClamped = Math.min(100, Math.max(0, enr.progress ?? 0))
      const statusUpper = String(enr.status || 'ACTIVE').toUpperCase()
      const rating = ratingMap.get(courseId) ?? null
      const isFavorite = favoriteSet.has(courseId)
      const enrolledAt = enr.enrolledAt ? enr.enrolledAt.toISOString() : null

      let completedAt = enr.completedAt ? enr.completedAt.toISOString() : null
      if (!completedAt && certificateMap.has(courseId)) {
        completedAt = certificateMap.get(courseId)!.toISOString()
      }

      const isCompleted =
        statusUpper === 'COMPLETED' ||
        progressClamped >= 100 ||
        completedAt !== null ||
        certificateMap.has(courseId)

      if (isCompleted) {
        completedCourseIdSet.add(courseId)
      }

      interactionMap.set(courseId, {
        course_id: courseId,
        progress: progressClamped,
        status: statusUpper,
        rating,
        is_favorite: isFavorite,
        enrolled_at: enrolledAt,
        completed_at: completedAt
      })
    }

    // Process non-enrolled ratings or favorites
    for (const [courseId, rate] of ratingMap.entries()) {
      if (!interactionMap.has(courseId)) {
        interactionMap.set(courseId, {
          course_id: courseId,
          progress: 0,
          status: 'ACTIVE',
          rating: rate,
          is_favorite: favoriteSet.has(courseId),
          enrolled_at: null,
          completed_at: null
        })
      }
    }

    for (const courseId of favoriteSet) {
      if (!interactionMap.has(courseId)) {
        interactionMap.set(courseId, {
          course_id: courseId,
          progress: 0,
          status: 'ACTIVE',
          rating: ratingMap.get(courseId) ?? null,
          is_favorite: true,
          enrolled_at: null,
          completed_at: null
        })
      }
    }

    // 4. Resolve explicit category / topic / level preferences
    // PostgreSQL schema currently has no dedicated user preferences table;
    // defaults to empty or optional request overrides
    const preferredCategoryNames = Array.isArray(overrides?.preferred_category_names)
      ? overrides.preferred_category_names.filter((n) => typeof n === 'string' && n.trim().length > 0)
      : []

    const preferredTopics = Array.isArray(overrides?.preferred_topics)
      ? overrides.preferred_topics.filter((t) => typeof t === 'string' && t.trim().length > 0)
      : []

    const preferredLevel = overrides?.preferred_level || null

    return {
      user_id: userId,
      preferred_category_ids: [],
      preferred_category_names: preferredCategoryNames,
      preferred_topics: preferredTopics,
      preferred_level: preferredLevel,
      interactions: Array.from(interactionMap.values()),
      completed_course_ids: Array.from(completedCourseIdSet).sort()
    }
  }
}

export const defaultLearnerProfileBuilder = new LearnerProfileBuilder()

