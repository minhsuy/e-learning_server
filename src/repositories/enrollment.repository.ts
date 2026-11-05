import { EEnrollmentStatus, Enrollment, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: ENROLLMENT
 * 
 * Provides database operations on PostgreSQL `enrollments` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const ENROLLMENT_COURSE_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  price: true,
  level: true,
  type: true,
  sold: true,
  view: true
} as const satisfies Prisma.CourseSelect

export const ENROLLMENT_PUBLIC_SELECT = {
  id: true,
  userId: true,
  courseId: true,
  progress: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  course: {
    select: ENROLLMENT_COURSE_SELECT
  }
} as const satisfies Prisma.EnrollmentSelect

export type EnrollmentPublicPayload = Prisma.EnrollmentGetPayload<{
  select: typeof ENROLLMENT_PUBLIC_SELECT
}>

export const ENROLLMENT_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  avatar: true
} as const satisfies Prisma.UserSelect

export const ENROLLMENT_STUDENT_SELECT = {
  id: true,
  userId: true,
  courseId: true,
  progress: true,
  status: true,
  enrolledAt: true,
  user: {
    select: ENROLLMENT_USER_SELECT
  }
} as const satisfies Prisma.EnrollmentSelect

export type EnrollmentStudentPayload = Prisma.EnrollmentGetPayload<{
  select: typeof ENROLLMENT_STUDENT_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Find an enrollment record by composite unique key [userId, courseId].
 * Preserved for Phase 5 Quiz Submission compatibility.
 */
export const findEnrollmentByUserAndCourse = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Enrollment | null> => {
  const client = tx || prisma
  return client.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  })
}

/**
 * Find an enrollment record by its primary key UUID.
 */
export const findEnrollmentById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Enrollment | null> => {
  const client = tx || prisma
  return client.enrollment.findUnique({
    where: { id }
  })
}

/**
 * Count active/total enrollments for a specific course UUID.
 * Preserved for Phase 5 Quiz Submission compatibility.
 */
export const countEnrollmentsByCourseId = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.enrollment.count({
    where: { courseId }
  })
}

/**
 * Create a new enrollment record.
 */
export const createEnrollment = async (
  data: {
    userId: string
    courseId: string
    progress?: number
    status?: EEnrollmentStatus
    enrolledAt?: Date
  },
  tx?: PrismaTransactionClient
): Promise<Enrollment> => {
  const client = tx || prisma
  return client.enrollment.create({
    data: {
      userId: data.userId,
      courseId: data.courseId,
      progress: data.progress ?? 0,
      status: data.status ?? EEnrollmentStatus.ACTIVE,
      enrolledAt: data.enrolledAt ?? new Date()
    }
  })
}

/**
 * Upsert an enrollment record by composite unique key [userId, courseId].
 */
export const upsertEnrollment = async (
  userId: string,
  courseId: string,
  data?: {
    progress?: number
    enrolledAt?: Date
    status?: EEnrollmentStatus
  },
  tx?: PrismaTransactionClient
): Promise<Enrollment> => {
  const client = tx || prisma
  const now = data?.enrolledAt ?? new Date()
  return client.enrollment.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    },
    update: {
      enrolledAt: now,
      ...(data?.progress !== undefined && { progress: data.progress }),
      ...(data?.status !== undefined && { status: data.status })
    },
    create: {
      userId,
      courseId,
      progress: data?.progress ?? 0,
      status: data?.status ?? EEnrollmentStatus.ACTIVE,
      enrolledAt: now
    }
  })
}

/**
 * Update enrollment progress and completion status.
 */
export const updateEnrollmentProgress = async (
  userId: string,
  courseId: string,
  progress: number,
  status?: EEnrollmentStatus,
  completedAt?: Date | null,
  tx?: PrismaTransactionClient
): Promise<Enrollment> => {
  const client = tx || prisma
  return client.enrollment.update({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    },
    data: {
      progress,
      ...(status !== undefined && { status }),
      ...(completedAt !== undefined && { completedAt })
    }
  })
}

/**
 * Find all enrollments for a student user with course details.
 */
export const findEnrollmentsByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<EnrollmentPublicPayload[]> => {
  const client = tx || prisma
  return client.enrollment.findMany({
    where: { userId },
    select: ENROLLMENT_PUBLIC_SELECT,
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Find students enrolled in a specific course with optional username/email search and pagination.
 */
export const findStudentsByCourseId = async (
  params: {
    courseId: string
    search?: string
    page?: number
    limit?: number
  },
  tx?: PrismaTransactionClient
): Promise<EnrollmentStudentPayload[]> => {
  const client = tx || prisma
  const { courseId, search, page = 1, limit = 10 } = params
  const skip = (page - 1) * limit

  const where: Prisma.EnrollmentWhereInput = {
    courseId,
    ...(search && {
      user: {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    })
  }

  return client.enrollment.findMany({
    where,
    select: ENROLLMENT_STUDENT_SELECT,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Count total students enrolled in a specific course with optional search.
 */
export const countStudentsByCourseId = async (
  params: {
    courseId: string
    search?: string
  },
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  const { courseId, search } = params

  const where: Prisma.EnrollmentWhereInput = {
    courseId,
    ...(search && {
      user: {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    })
  }

  return client.enrollment.count({ where })
}

/**
 * Delete an enrollment record by composite key [userId, courseId].
 */
export const deleteEnrollment = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Enrollment | null> => {
  const client = tx || prisma
  try {
    return await client.enrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}

/**
 * Find enrolled user IDs (ACTIVE and COMPLETED) for a given course UUID.
 * Used for course/lesson notification dispatching. Excludes CANCELED.
 */
export const findActiveEnrolledUserIdsByCourseId = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<string[]> => {
  const client = tx || prisma
  const enrollments = await client.enrollment.findMany({
    where: {
      courseId,
      status: {
        in: [EEnrollmentStatus.ACTIVE, EEnrollmentStatus.COMPLETED]
      }
    },
    select: {
      userId: true
    }
  })
  return enrollments.map((e) => e.userId)
}
