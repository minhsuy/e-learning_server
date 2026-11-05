import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  archiveCodingExerciseService,
  createCodingExerciseService,
  getCodingExerciseDetailManageService,
  getPublishedCodingExerciseDetailService,
  listCodingExercisesByLessonService,
  listPublishedCodingExercisesByLessonService,
  publishCodingExerciseService,
  reverifyCodingExerciseService,
  unpublishCodingExerciseService,
  updateCodingExerciseService
} from '~/services/codingExercise.service'
import {
  getSubmissionDetailService,
  getSubmissionHistoryService,
  runCodeService,
  submitCodeService
} from '~/services/codingSubmission.service'
import {
  getExerciseCompletionService,
  getLessonCodingProgressService
} from '~/services/codingCompletion.service'

/**
 * TMDEMY — CONTROLLER: CODING EXERCISE
 * 
 * Handles incoming HTTP requests for Coding Exercise CRUD,
 * delegating business logic to codingExercise.service.
 */

// Helper to reliably extract authenticated user context
function getUserContext(req: Request) {
  const user = req.user as { userId?: string; id?: string; role?: string } | undefined
  const userId = user?.userId || user?.id || ''
  const role = user?.role || ''
  return { userId, role }
}

// 1. POST /api/coding-exercises (Teacher: Create Exercise)
export const createCodingExerciseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const result = await createCodingExerciseService({ userId, role, payload: req.body })
  return res.status(result.statusCode || (result.success ? 201 : 400)).json(result)
})

// 2. GET /api/coding-exercises/lesson/:lessonId (Teacher: List all exercises for lesson)
export const listCodingExercisesByLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId
  const result = await listCodingExercisesByLessonService({ userId, role, lessonId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 3. GET /api/coding-exercises/:id/manage (Teacher: Full exercise details & test cases)
export const getCodingExerciseDetailManageController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await getCodingExerciseDetailManageService({ userId, role, exerciseId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 4. PUT /api/coding-exercises/:id (Teacher: Update exercise & revision management)
export const updateCodingExerciseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await updateCodingExerciseService({ userId, role, exerciseId, payload: req.body })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 5. GET /api/coding-exercises/lesson/:lessonId/public (Student: List published exercises)
export const listPublishedCodingExercisesByLessonController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId
  const result = await listPublishedCodingExercisesByLessonService({ userId, role, lessonId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 6. GET /api/coding-exercises/:id (Student: Get published exercise detail)
export const getPublishedCodingExerciseDetailController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await getPublishedCodingExerciseDetailService({ userId, role, exerciseId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 7. DELETE /api/coding-exercises/:id (Teacher: Soft archive exercise)
export const archiveCodingExerciseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await archiveCodingExerciseService({ userId, role, exerciseId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// ==========================================
// STEP 4 STUDENT EXECUTION & SUBMISSION CONTROLLERS
// ==========================================

// 8. POST /api/coding-exercises/:id/run (Student: Practice run against public test cases)
export const runCodeController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await runCodeService({
    userId,
    role,
    exerciseId,
    sourceCode: req.body.sourceCode
  })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 9. POST /api/coding-exercises/:id/submit (Student: Official graded submission)
export const submitCodeController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await submitCodeService({
    userId,
    role,
    exerciseId,
    sourceCode: req.body.sourceCode
  })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 10. GET /api/coding-exercises/:id/submissions (Student: View submission history)
export const getSubmissionHistoryController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const result = await getSubmissionHistoryService({
    userId,
    role,
    exerciseId,
    page,
    limit
  })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 11. GET /api/coding-exercises/:id/submissions/:submissionId (Student: View submission detail)
export const getSubmissionDetailController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const submissionId = Array.isArray(req.params.submissionId) ? req.params.submissionId[0] : req.params.submissionId
  const result = await getSubmissionDetailService({
    userId,
    role,
    exerciseId,
    submissionId
  })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// ==========================================
// STEP 5 TEACHER PUBLISH / UNPUBLISH CONTROLLERS
// ==========================================

// 12. POST /api/coding-exercises/:id/publish (Teacher: Publish with verification gate)
export const publishCodingExerciseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await publishCodingExerciseService({ userId, role, exerciseId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// POST /api/coding-exercises/:id/reverify (Teacher: Re-verify reference solution without publishing)
export const reverifyCodingExerciseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await reverifyCodingExerciseService({ userId, role, exerciseId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 13. POST /api/coding-exercises/:id/unpublish (Teacher: Unpublish exercise back to DRAFT)
export const unpublishCodingExerciseController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await unpublishCodingExerciseService({ userId, role, exerciseId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// ==========================================
// STEP 6 COMPLETION TRACKING & PROGRESS CONTROLLERS
// ==========================================

// 14. GET /api/coding-exercises/:id/completion (Student: Exercise completion status)
export const getExerciseCompletionController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const targetUserId = typeof req.query.targetUserId === 'string' ? req.query.targetUserId : undefined
  const result = await getExerciseCompletionService({ userId, role, exerciseId, targetUserId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})

// 15. GET /api/coding-exercises/lesson/:lessonId/progress (Student: Lesson coding progress)
export const getLessonCodingProgressController = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = getUserContext(req)
  const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId
  const targetUserId = typeof req.query.targetUserId === 'string' ? req.query.targetUserId : undefined
  const result = await getLessonCodingProgressService({ userId, role, lessonId, targetUserId })
  return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
})
