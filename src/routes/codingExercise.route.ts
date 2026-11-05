import express from 'express'
import {
  archiveCodingExerciseController,
  createCodingExerciseController,
  getCodingExerciseDetailManageController,
  getPublishedCodingExerciseDetailController,
  getSubmissionDetailController,
  getSubmissionHistoryController,
  getExerciseCompletionController,
  getLessonCodingProgressController,
  listCodingExercisesByLessonController,
  listPublishedCodingExercisesByLessonController,
  publishCodingExerciseController,
  reverifyCodingExerciseController,
  runCodeController,
  submitCodeController,
  unpublishCodingExerciseController,
  updateCodingExerciseController
} from '~/controller/codingExercise.controller'
import {
  createCodingExerciseZodValidator,
  exerciseIdParamValidator,
  lessonIdParamValidator,
  runCodeZodValidator,
  submissionIdParamValidator,
  submissionPaginationValidator,
  submitCodeZodValidator,
  updateCodingExerciseZodValidator
} from '~/middlewares/codingExercise.middleware'
import {
  runCodeRateLimiter,
  submitCodeRateLimiter
} from '~/middlewares/codingExerciseRateLimit.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const codingExerciseRouter = express.Router()

// ==========================================
// 1. TEACHER / ADMIN ROUTES
// ==========================================

// POST /api/coding-exercises -> Create new exercise (DRAFT)
codingExerciseRouter.post(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  createCodingExerciseZodValidator,
  createCodingExerciseController
)

// GET /api/coding-exercises/lesson/:lessonId/public -> Student view: list published exercises
codingExerciseRouter.get(
  '/lesson/:lessonId/public',
  verifyAccessToken,
  lessonIdParamValidator,
  handleValidationErrors,
  listPublishedCodingExercisesByLessonController
)

// GET /api/coding-exercises/lesson/:lessonId/progress -> Student view: lesson coding progress
codingExerciseRouter.get(
  '/lesson/:lessonId/progress',
  verifyAccessToken,
  lessonIdParamValidator,
  handleValidationErrors,
  getLessonCodingProgressController
)

// GET /api/coding-exercises/lesson/:lessonId -> Teacher view: list all exercises (including drafts/archived)
codingExerciseRouter.get(
  '/lesson/:lessonId',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdParamValidator,
  handleValidationErrors,
  listCodingExercisesByLessonController
)

// GET /api/coding-exercises/:id/manage -> Teacher view: full details, all testcases & revisions
codingExerciseRouter.get(
  '/:id/manage',
  verifyAccessToken,
  isTeacherOrAdmin,
  exerciseIdParamValidator,
  handleValidationErrors,
  getCodingExerciseDetailManageController
)

// POST /api/coding-exercises/:id/reverify -> Teacher view: test reference solution without publishing
codingExerciseRouter.post(
  '/:id/reverify',
  verifyAccessToken,
  isTeacherOrAdmin,
  exerciseIdParamValidator,
  handleValidationErrors,
  reverifyCodingExerciseController
)

// POST /api/coding-exercises/:id/publish -> Teacher view: verify reference solution & publish exercise
codingExerciseRouter.post(
  '/:id/publish',
  verifyAccessToken,
  isTeacherOrAdmin,
  exerciseIdParamValidator,
  handleValidationErrors,
  publishCodingExerciseController
)

// POST /api/coding-exercises/:id/unpublish -> Teacher view: revert published exercise to DRAFT
codingExerciseRouter.post(
  '/:id/unpublish',
  verifyAccessToken,
  isTeacherOrAdmin,
  exerciseIdParamValidator,
  handleValidationErrors,
  unpublishCodingExerciseController
)

// ==========================================
// 2. STEP 4 STUDENT EXECUTION & SUBMISSION ROUTES
// ==========================================

// POST /api/coding-exercises/:id/run -> Practice run against public test cases (ephemeral)
codingExerciseRouter.post(
  '/:id/run',
  verifyAccessToken,
  exerciseIdParamValidator,
  handleValidationErrors,
  runCodeRateLimiter,
  runCodeZodValidator,
  runCodeController
)

// POST /api/coding-exercises/:id/submit -> Official graded submission
codingExerciseRouter.post(
  '/:id/submit',
  verifyAccessToken,
  exerciseIdParamValidator,
  handleValidationErrors,
  submitCodeRateLimiter,
  submitCodeZodValidator,
  submitCodeController
)

// GET /api/coding-exercises/:id/submissions/:submissionId -> View submission detail (sanitized)
codingExerciseRouter.get(
  '/:id/submissions/:submissionId',
  verifyAccessToken,
  exerciseIdParamValidator,
  submissionIdParamValidator,
  handleValidationErrors,
  getSubmissionDetailController
)

// GET /api/coding-exercises/:id/submissions -> View student's submission history
codingExerciseRouter.get(
  '/:id/submissions',
  verifyAccessToken,
  exerciseIdParamValidator,
  handleValidationErrors,
  submissionPaginationValidator,
  getSubmissionHistoryController
)

// ==========================================
// 3. EXERCISE RESOURCE ROUTES
// ==========================================

// GET /api/coding-exercises/:id/completion -> Student view: exercise completion status & dedicated XP
codingExerciseRouter.get(
  '/:id/completion',
  verifyAccessToken,
  exerciseIdParamValidator,
  handleValidationErrors,
  getExerciseCompletionController
)

// GET /api/coding-exercises/:id -> Student view: get published exercise (anti-cheat safe)
codingExerciseRouter.get(
  '/:id',
  verifyAccessToken,
  exerciseIdParamValidator,
  handleValidationErrors,
  getPublishedCodingExerciseDetailController
)

// PUT /api/coding-exercises/:id -> Teacher view: update exercise / revision management
codingExerciseRouter.put(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  exerciseIdParamValidator,
  handleValidationErrors,
  updateCodingExerciseZodValidator,
  updateCodingExerciseController
)

// DELETE /api/coding-exercises/:id -> Teacher view: soft-archive exercise
codingExerciseRouter.delete(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  exerciseIdParamValidator,
  handleValidationErrors,
  archiveCodingExerciseController
)

export default codingExerciseRouter

