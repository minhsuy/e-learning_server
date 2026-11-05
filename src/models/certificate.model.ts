import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: CERTIFICATE
 * 
 * Single Source of Truth for Certificate domain validation and types at Application Layer.
 * Conforms to AGENTS.md and application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma (model Certificate)
 * Legacy Mongoose Model: src/models/legacy/certificate.legacy.model.ts
 */

// ==========================================
// 1. BASE DOMAIN SCHEMA
// ==========================================

export const certificateBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().optional().nullable(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  grade: z.number().min(0).max(100),
  certificateUrl: z.string().url(),
  issuedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. INPUT / MUTATION SCHEMAS
// ==========================================

export const createCertificateInputSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid()
})

export const createCertificateDataSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  code: z.string().optional(),
  grade: z.number().min(0).max(100),
  certificateUrl: z.string(),
  issuedAt: z.date().optional()
})

// ==========================================
// 3. RESPONSE / DTO SCHEMAS
// ==========================================

export const certificatePublicResponseSchema = z.object({
  id: z.string().uuid(),
  _id: z.string().optional(),
  code: z.string().optional().nullable(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  grade: z.number(),
  certificateUrl: z.string(),
  issuedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================

export type Certificate = z.infer<typeof certificateBaseSchema>
export type CreateCertificateInput = z.infer<typeof createCertificateInputSchema>
export type CreateCertificateData = z.infer<typeof createCertificateDataSchema>
export type CertificatePublicResponse = z.infer<typeof certificatePublicResponseSchema>
