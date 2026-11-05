import { Certificate, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: CERTIFICATE
 * 
 * Provides database operations on PostgreSQL `certificates` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards:
 * - Pure exported async functions
 * - No class, no `this`, no BaseRepository
 * - Prisma Client singleton from ~/config/prisma
 * - Optional transaction client support (tx?: PrismaTransactionClient)
 */

// ==========================================
// 1. PRISMA PROJECTION SELECT CONSTANTS
// ==========================================

export const CERTIFICATE_PUBLIC_SELECT = {
  id: true,
  code: true,
  userId: true,
  courseId: true,
  grade: true,
  certificateUrl: true,
  issuedAt: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.CertificateSelect

export type CertificatePublicPayload = Prisma.CertificateGetPayload<{
  select: typeof CERTIFICATE_PUBLIC_SELECT
}>

export const CERTIFICATE_WITH_COURSE_SELECT = {
  id: true,
  code: true,
  userId: true,
  courseId: true,
  grade: true,
  certificateUrl: true,
  issuedAt: true,
  createdAt: true,
  updatedAt: true,
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      image: true,
      author: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      }
    }
  }
} as const satisfies Prisma.CertificateSelect

export type CertificateWithCoursePayload = Prisma.CertificateGetPayload<{
  select: typeof CERTIFICATE_WITH_COURSE_SELECT
}>

export const CERTIFICATE_VERIFY_SELECT = {
  id: true,
  code: true,
  grade: true,
  certificateUrl: true,
  issuedAt: true,
  user: {
    select: {
      username: true,
      avatar: true
    }
  },
  course: {
    select: {
      title: true,
      slug: true,
      image: true,
      author: {
        select: {
          username: true
        }
      }
    }
  }
} as const satisfies Prisma.CertificateSelect

export type CertificateVerifyPayload = Prisma.CertificateGetPayload<{
  select: typeof CERTIFICATE_VERIFY_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Find certificate by composite unique key [userId, courseId].
 */
export const findCertificateByUserAndCourse = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Certificate | null> => {
  const client = tx || prisma
  return client.certificate.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  })
}

/**
 * Find certificate with course details by composite unique key [userId, courseId].
 */
export const findCertificateByUserAndCourseWithDetails = async (
  userId: string,
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<CertificateWithCoursePayload | null> => {
  const client = tx || prisma
  return client.certificate.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    },
    select: CERTIFICATE_WITH_COURSE_SELECT
  })
}

/**
 * Find certificate by primary key UUID.
 */
export const findCertificateById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Certificate | null> => {
  const client = tx || prisma
  return client.certificate.findUnique({
    where: { id }
  })
}

/**
 * Find certificate for public verification by unique certificate code or ID.
 */
export const findCertificateByCodeOrId = async (
  codeOrId: string,
  tx?: PrismaTransactionClient
): Promise<CertificateVerifyPayload | null> => {
  const client = tx || prisma
  // Search first by code
  const byCode = await client.certificate.findUnique({
    where: { code: codeOrId },
    select: CERTIFICATE_VERIFY_SELECT
  })
  if (byCode) return byCode

  // Fallback search by id if valid UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(codeOrId)
  if (isUUID) {
    return client.certificate.findUnique({
      where: { id: codeOrId },
      select: CERTIFICATE_VERIFY_SELECT
    })
  }

  return null
}

/**
 * Find all certificates earned by a user with course details.
 */
export const findCertificatesByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<CertificateWithCoursePayload[]> => {
  const client = tx || prisma
  return client.certificate.findMany({
    where: { userId },
    select: CERTIFICATE_WITH_COURSE_SELECT,
    orderBy: { issuedAt: 'desc' }
  })
}

/**
 * Create a new Certificate record in PostgreSQL.
 */
export const createCertificate = async (
  data: {
    userId: string
    courseId: string
    code?: string
    grade: number | Prisma.Decimal
    certificateUrl: string
    issuedAt?: Date
  },
  tx?: PrismaTransactionClient
): Promise<Certificate> => {
  const client = tx || prisma
  return client.certificate.create({
    data: {
      userId: data.userId,
      courseId: data.courseId,
      code: data.code,
      grade: typeof data.grade === 'number' ? new Prisma.Decimal(data.grade.toFixed(2)) : data.grade,
      certificateUrl: data.certificateUrl,
      issuedAt: data.issuedAt || new Date()
    }
  })
}

/**
 * Delete a certificate by primary key UUID.
 */
export const deleteCertificate = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Certificate | null> => {
  const client = tx || prisma
  try {
    return await client.certificate.delete({
      where: { id }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}
