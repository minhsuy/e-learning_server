import { Prisma, VideoUpload } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

/**
 * TMDEMY — FUNCTIONAL REPOSITORY: VIDEO UPLOADS
 * 
 * Provides database operations on PostgreSQL `video_uploads` table via Prisma Client singleton.
 * Conforms to AGENTS.md Functional Repository standards.
 */

// ==========================================
// 1. SELECT CONSTANTS (PROJECTIONS)
// ==========================================

export const VIDEO_UPLOAD_SELECT = {
  id: true,
  bunnyVideoId: true,
  title: true,
  status: true,
  courseId: true,
  chapterId: true,
  userId: true,
  duration: true,
  uploadUrl: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.VideoUploadSelect

export type VideoUploadPayload = Prisma.VideoUploadGetPayload<{
  select: typeof VIDEO_UPLOAD_SELECT
}>

// ==========================================
// 2. QUERY & MUTATION FUNCTIONS
// ==========================================

/**
 * Create a new VideoUpload tracking record in PostgreSQL.
 */
export const createVideoUploadRecord = async (
  data: Prisma.VideoUploadCreateInput,
  tx?: PrismaTransactionClient
): Promise<VideoUpload> => {
  const client = tx || prisma
  return client.videoUpload.create({
    data
  })
}

/**
 * Find a video upload record by Bunny Video GUID.
 */
export const findVideoUploadByBunnyId = async (
  bunnyVideoId: string,
  tx?: PrismaTransactionClient
): Promise<VideoUpload | null> => {
  const client = tx || prisma
  return client.videoUpload.findUnique({
    where: { bunnyVideoId },
    select: VIDEO_UPLOAD_SELECT
  })
}

/**
 * Update the processing status and optional duration of a video upload record.
 */
export const updateVideoUploadStatus = async (
  bunnyVideoId: string,
  data: {
    status?: string
    duration?: number
    title?: string
  },
  tx?: PrismaTransactionClient
): Promise<VideoUpload> => {
  const client = tx || prisma
  return client.videoUpload.update({
    where: { bunnyVideoId },
    data
  })
}

/**
 * Delete a VideoUpload tracking record by Bunny Video GUID.
 */
export const deleteVideoUploadRecord = async (
  bunnyVideoId: string,
  tx?: PrismaTransactionClient
): Promise<VideoUpload | null> => {
  const client = tx || prisma
  try {
    return await client.videoUpload.delete({
      where: { bunnyVideoId }
    })
  } catch (error: unknown) {
    // If already deleted or record doesn't exist, return null
    return null
  }
}

/**
 * Count how many lessons are currently referencing a specific Bunny Video GUID.
 * Crucial for safe video deletion (prevents deleting an asset shared by multiple lessons).
 */
export const countLessonsUsingBunnyVideoId = async (
  bunnyVideoId: string,
  excludeLessonId?: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.lesson.count({
    where: {
      bunnyVideoId,
      ...(excludeLessonId ? { id: { not: excludeLessonId } } : {})
    }
  })
}

/**
 * Find the lesson associated with a specific Bunny Video GUID.
 */
export const findLessonByBunnyVideoId = async (
  bunnyVideoId: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx || prisma
  return client.lesson.findUnique({
    where: { bunnyVideoId },
    select: {
      id: true,
      title: true,
      courseId: true,
      chapterId: true,
      authorId: true,
      videoStatus: true,
      summary: true,
      aiProcessingStatus: true
    }
  })
}
