import { z } from 'zod'

/**
 * TMDEMY — ZOD APPLICATION DOMAIN MODEL: VIDEO & BUNNY STREAM
 * 
 * Single Source of Truth for Video Domain validation and types at Application Layer.
 * Manages Bunny Stream upload authorizations, video metadata, and playback info.
 */

export const VideoUploadStatusEnum = z.enum([
  'CREATED',
  'UPLOADING',
  'PROCESSING',
  'READY',
  'FAILED'
])

export type VideoUploadStatus = z.infer<typeof VideoUploadStatusEnum>

// ==========================================
// 1. BASE DOMAIN SCHEMA
// ==========================================

export const videoUploadSchema = z.object({
  id: z.string().uuid(),
  bunnyVideoId: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  status: VideoUploadStatusEnum.default('CREATED'),
  courseId: z.string().uuid(),
  chapterId: z.string().uuid().nullable().optional(),
  userId: z.string().uuid(),
  duration: z.number().int().default(0),
  uploadUrl: z.string().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// ==========================================
// 2. INPUT SCHEMAS
// ==========================================

export const createUploadSignatureInputSchema = z.object({
  title: z.string().min(3, 'Video title must be at least 3 characters').max(255),
  courseId: z.string().uuid('Invalid Course ID'),
  chapterId: z.string().uuid('Invalid Chapter ID').optional()
})

export const checkVideoStatusQuerySchema = z.object({
  refresh: z.enum(['true', 'false']).optional()
})

// ==========================================
// 3. OUTPUT / CREDENTIAL SCHEMAS
// ==========================================

export const tusUploadCredentialsSchema = z.object({
  videoId: z.string(),
  libraryId: z.string(),
  uploadUrl: z.string().url(),
  authorizationSignature: z.string(),
  authorizationExpire: z.number().int(),
  expiresAt: z.string()
})

export const videoPlaybackInfoSchema = z.object({
  videoId: z.string(),
  libraryId: z.string(),
  embedUrl: z.string().url(),
  hlsUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  previewUrl: z.string().url(),
  videoStatus: z.string()
})

// ==========================================
// 4. INFERRED TYPESCRIPT TYPES
// ==========================================

export type VideoUpload = z.infer<typeof videoUploadSchema>
export type CreateUploadSignatureInput = z.infer<typeof createUploadSignatureInputSchema>
export type TusUploadCredentials = z.infer<typeof tusUploadCredentialsSchema>
export type VideoPlaybackInfo = z.infer<typeof videoPlaybackInfoSchema>
