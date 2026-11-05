import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  generateAiQuizForLessonService,
  generateAiCodingExerciseForLessonService,
  saveApprovedAiQuizForLessonService,
  saveApprovedAiCodingExerciseForLessonService
} from '~/services/aiAssessment.service'

/**
 * TMDEMY — CONTROLLER: AI ASSESSMENT GENERATION (STEP 7C)
 * 
 * Transport layer for teacher-requested assessment generation:
 * - Extracts authenticated identity from req.user
 * - Extracts lesson ID from route parameters (supports :id and :lessonId)
 * - Invokes AI assessment services and serializes HTTP responses
 */

// Helper to reliably extract authenticated user context
function getUserContext(req: Request) {
  const user = req.user as { userId?: string; id?: string; role?: string } | undefined
  const userId = user?.userId || user?.id || ''
  const role = user?.role || ''
  return { userId, role }
}

// POST /api/lessons/:id/ai-quiz/generate
export const generateAiQuizController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawParam = req.params.id || req.params.lessonId
    const lessonId = typeof rawParam === 'string' ? rawParam.trim() : ''
    const { userId, role } = getUserContext(req)

    const result = await generateAiQuizForLessonService({
      lessonId,
      userId,
      role,
      input: req.body
    })

    res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
  }
)

// POST /api/lessons/:id/ai-coding-exercise/generate
export const generateAiCodingExerciseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawParam = req.params.id || req.params.lessonId
    const lessonId = typeof rawParam === 'string' ? rawParam.trim() : ''
    const { userId, role } = getUserContext(req)

    const result = await generateAiCodingExerciseForLessonService({
      lessonId,
      userId,
      role,
      input: req.body
    })

    res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
  }
)

// POST /api/lessons/:id/ai-quiz/save-approved
export const saveApprovedAiQuizController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawParam = req.params.id || req.params.lessonId || req.body.lesson || req.body.lessonId
    const lessonId = typeof rawParam === 'string' ? rawParam.trim() : ''
    const { userId, role } = getUserContext(req)

    const result = await saveApprovedAiQuizForLessonService({
      lessonId,
      userId,
      role,
      input: req.body
    })

    res.status(result.statusCode || (result.success ? 201 : 400)).json(result)
  }
)

// POST /api/lessons/:id/ai-coding-exercise/save-approved
export const saveApprovedAiCodingExerciseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawParam = req.params.id || req.params.lessonId || req.body.lesson || req.body.lessonId
    const lessonId = typeof rawParam === 'string' ? rawParam.trim() : ''
    const { userId, role } = getUserContext(req)

    const result = await saveApprovedAiCodingExerciseForLessonService({
      lessonId,
      userId,
      role,
      input: req.body
    })

    res.status(result.statusCode || (result.success ? 201 : 400)).json(result)
  }
)

