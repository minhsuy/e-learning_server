import { z } from 'zod'
import { UserRole, UserStatus } from '@prisma/client'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: USER
 * 
 * Single Source of Truth for User domain validation and types at Application Layer.
 * Conforms to ADR docs/architecture/application-model-design.md
 * 
 * Physical Database constraints: prisma/schema.prisma
 * Legacy Mongoose Model: src/models/legacy/user.legacy.model.ts
 */

// ==========================================
// 1. NESTED / VALUE OBJECT SCHEMAS
// ==========================================

export const socialLinksSchema = z.object({
  facebook: z.string().default(''),
  instagram: z.string().default(''),
  github: z.string().default('')
})

// ==========================================
// 2. BASE DOMAIN SCHEMA (Reflects pure domain entity)
// ==========================================

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(100),
  email: z.string().email().max(255),
  status: z.nativeEnum(UserStatus),
  role: z.nativeEnum(UserRole),
  avatar: z.string().default(''),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  socialFacebook: z.string().default(''),
  socialInstagram: z.string().default(''),
  socialGithub: z.string().default(''),
  isVerified: z.boolean().default(false),
  xpTotal: z.number().int().default(0),
  currentStreak: z.number().int().default(0),
  longestStreak: z.number().int().default(0),
  lastActivityAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 3. PUBLIC / RESPONSE SCHEMAS (Client-safe, zero sensitive fields)
// ==========================================

export const userPublicSchema = userSchema.pick({
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialFacebook: true,
  socialInstagram: true,
  socialGithub: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
})

/**
 * Compact schema used when embedding author / user details in courses, lessons, comments
 */
export const userCompactSchema = userSchema.pick({
  id: true,
  username: true,
  avatar: true,
  role: true
})

// ==========================================
// 4. INTERNAL SCHEMA (For service authentication/verification)
// ==========================================

export const userInternalSchema = userSchema.extend({
  password: z.string(),
  otpCode: z.string().nullable().optional(),
  otpExpires: z.date().nullable().optional(),
  refreshToken: z.string().nullable().optional(),
  resetPasswordToken: z.string().nullable().optional(),
  resetPasswordExpires: z.date().nullable().optional()
})

// ==========================================
// 5. INPUT ACTION SCHEMAS
// ==========================================

export const createUserInputSchema = z.object({
  username: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(6),
  phone: z.string().max(30).optional(),
  bio: z.string().optional(),
  role: z.nativeEnum(UserRole).optional()
})

export const updateUserInputSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar: z.string().optional(),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialGithub: z.string().optional()
})

export const createTeacherPayloadSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(100)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  bio: z.string().max(200, 'Bio must not exceed 200 characters').optional().or(z.literal('')),
  socialLinks: z
    .object({
      facebook: z.string().url('Facebook link must be a valid URL').optional().or(z.literal('')),
      instagram: z.string().url('Instagram link must be a valid URL').optional().or(z.literal('')),
      github: z.string().url('Github link must be a valid URL').optional().or(z.literal(''))
    })
    .optional()
})

export const createTeacherInputSchema = z.object({
  payload: createTeacherPayloadSchema
})

export const googleLoginInputSchema = z
  .object({
    idToken: z.string().optional(),
    id_token: z.string().optional(),
    credential: z.string().optional(),
    token: z.string().optional(),
    code: z.string().optional(),
    redirectUri: z.string().optional(),
    redirect_uri: z.string().optional(),
    accessToken: z.string().optional(),
    access_token: z.string().optional()
  })
  .refine(
    (data) =>
      Boolean(
        data.idToken ||
          data.id_token ||
          data.credential ||
          data.token ||
          data.code ||
          data.accessToken ||
          data.access_token
      ),
    {
      message: 'Google credential (idToken / credential / code / accessToken) is required'
    }
  )

// ==========================================
// 6. INFERRED TYPESCRIPT TYPES
// ==========================================

export type User = z.infer<typeof userSchema>
export type UserPublic = z.infer<typeof userPublicSchema>
export type UserCompact = z.infer<typeof userCompactSchema>
export type UserInternal = z.infer<typeof userInternalSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>
export type CreateUserInput = z.infer<typeof createUserInputSchema>
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>
export type CreateTeacherPayload = z.infer<typeof createTeacherPayloadSchema>
export type CreateTeacherInput = z.infer<typeof createTeacherInputSchema>
export type GoogleLoginInput = z.infer<typeof googleLoginInputSchema>

