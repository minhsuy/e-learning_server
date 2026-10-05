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
 * Find all certificates earned by a user.
 */
export const findCertificatesByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<CertificatePublicPayload[]> => {
  const client = tx || prisma
  return client.certificate.findMany({
    where: { userId },
    select: CERTIFICATE_PUBLIC_SELECT,
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
