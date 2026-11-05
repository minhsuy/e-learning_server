import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  getAiJobDetailService,
  getLatestLessonAiJobService,
  getLessonAiJobsService,
  pollJobStatusService,
  recoverOrGenerateLessonSummaryService,
  triggerLessonAiProcessService
} from '~/services/aiProcessing.service'
import { AiJobType } from '~/models/aiJob.model'

/**
 * TMDEMY — AI PROCESSING JOB CONTROLLERS
 *
 * Transport Layer for AI Job orchestration.
 * Handles HTTP requests, parameter extraction, and status codes.
 * Conforms to AGENTS.md Architecture.
 */

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || ''
  return param || ''
}

/**
 * Trigger AI processing for a lesson.
 * POST /api/lessons/:id/ai-process
 */
export const triggerLessonAiProcessController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const lessonId = getParam(req.params.id)
    const { userId, role } = req.user as { userId: string; role: string }
    const { jobType, videoFingerprint, model, forceReprocess } = req.body || {}

    const result = await triggerLessonAiProcessService({
      lessonId,
      userId,
      role,
      jobType: jobType as AiJobType,
      videoFingerprint,
      model,
      forceReprocess: Boolean(forceReprocess)
    })

    return res.status(result.statusCode ?? (result.success ? 202 : 400)).json(result)
  }
)

/**
 * Get the latest or active AI processing job for a lesson.
 * GET /api/lessons/:id/ai-process
 */
export const getLatestLessonAiJobController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const lessonId = getParam(req.params.id)
    const { userId, role } = req.user as { userId: string; role: string }

    const result = await getLatestLessonAiJobService(lessonId, userId, role)
    return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
  }
)

/**
 * List all AI processing jobs for a lesson.
 * GET /api/lessons/:id/ai-jobs
 */
export const getLessonAiJobsController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const lessonId = getParam(req.params.id)
    const { userId, role } = req.user as { userId: string; role: string }

    const result = await getLessonAiJobsService(lessonId, userId, role)
    return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
  }
)

/**
 * Get detail of a specific AI processing job.
 * GET /api/lessons/:id/ai-jobs/:jobId
 */
export const getAiJobDetailController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const lessonId = getParam(req.params.id)
    const jobId = getParam(req.params.jobId)
    const { userId, role } = req.user as { userId: string; role: string }

    const result = await getAiJobDetailService(lessonId, jobId, userId, role)
    return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
  }
)

/**
 * Trigger immediate polling and reconciliation on an AI job.
 * POST /api/lessons/:id/ai-jobs/:jobId/poll
 */
export const pollAiJobController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const jobId = getParam(req.params.jobId)

    const result = await pollJobStatusService(jobId)
    return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
  }
)

/**
 * Recover or generate lesson summary directly from transcript.
 * POST /api/lessons/:id/ai-summary/generate
 * POST /api/lessons/:id/ai-summary/retry
 */
export const recoverOrGenerateLessonSummaryController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const lessonId = getParam(req.params.id) || getParam(req.params.lessonId)
    const { userId, role } = req.user as { userId: string; role: string }
    const { model } = req.body || {}

    const result = await recoverOrGenerateLessonSummaryService({
      lessonId,
      userId,
      role,
      model
    })
    return res.status(result.statusCode ?? (result.success ? 200 : 400)).json(result)
  }
)
