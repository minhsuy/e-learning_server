import express from 'express'
import {
  createLessonController,
  deleteLessonController,
  getLessonAiContentController,
  getLessonByIdController,
  getLessonsByChapterController,
  updateLessonAiContentController,
  updateLessonController
} from '~/controller/lesson.controller'
import {
  authenticateAiOrTeacherAdmin,
  chapterIdValidator,
  createLessonValidator,
  lessonIdValidator,
  optionalAuthMiddleware,
  updateLessonAiContentValidator,
  updateLessonValidator
} from '~/middlewares/lesson.middleware'
import {
  jobIdValidator,
  triggerAiJobValidator
} from '~/middlewares/aiJob.middleware'
import {
  getAiJobDetailController,

  getLatestLessonAiJobController,
  getLessonAiJobsController,
  pollAiJobController,
  recoverOrGenerateLessonSummaryController,
  triggerLessonAiProcessController
} from '~/controller/aiJob.controller'
import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import {
  generateAiQuizController,
  generateAiCodingExerciseController,
  saveApprovedAiQuizController,
  saveApprovedAiCodingExerciseController
} from '~/controller/aiAssessment.controller'
import {
  generateAiQuizValidator,
  generateAiCodingExerciseValidator,
  saveApprovedAiQuizValidator,
  saveApprovedAiCodingExerciseValidator
} from '~/middlewares/aiAssessment.middleware'

const lessonRouter = express.Router()

// CREATE LESSON : POST /api/lessons
lessonRouter.post(
  '/',
  verifyAccessToken,
  isTeacherOrAdmin,
  createLessonValidator,
  handleValidationErrors,
  createLessonController
)

// GET LESSON BY CHAPTER : GET /api/lessons/chapter/:chapterId
lessonRouter.get(
  '/chapter/:chapterId',
  chapterIdValidator,
  handleValidationErrors,
  getLessonsByChapterController
)



// GET LESSON AI CONTENT : GET /api/lessons/:id/ai-content
lessonRouter.get(
  '/:id/ai-content',
  optionalAuthMiddleware,
  lessonIdValidator,
  handleValidationErrors,
  getLessonAiContentController
)

// UPDATE LESSON AI CONTENT : PATCH & PUT /api/lessons/:id/ai-content
lessonRouter.patch(
  '/:id/ai-content',
  authenticateAiOrTeacherAdmin,
  updateLessonAiContentValidator,
  handleValidationErrors,
  updateLessonAiContentController
)
lessonRouter.put(
  '/:id/ai-content',
  authenticateAiOrTeacherAdmin,
  updateLessonAiContentValidator,
  handleValidationErrors,
  updateLessonAiContentController
)

// GET LESSON DETAIL : GET /api/lessons/:id
lessonRouter.get(
  '/:id',
  optionalAuthMiddleware,
  lessonIdValidator,
  handleValidationErrors,
  getLessonByIdController
)

// UPDATE LESSON : PUT /api/lessons/:id
lessonRouter.put(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  updateLessonValidator,
  handleValidationErrors,
  updateLessonController
)

// DELETE LESSON : DELETE /api/lessons/:id
lessonRouter.delete(
  '/:id',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  handleValidationErrors,
  deleteLessonController
)

// ==========================================
// AI JOB ORCHESTRATION ENDPOINTS (STEP 6.6A)
// ==========================================

// TRIGGER AI PROCESSING : POST /api/lessons/:id/ai-process
lessonRouter.post(
  '/:id/ai-process',
  verifyAccessToken,
  isTeacherOrAdmin,
  triggerAiJobValidator,
  handleValidationErrors,
  triggerLessonAiProcessController
)

// GET LATEST AI JOB STATUS : GET /api/lessons/:id/ai-process
lessonRouter.get(
  '/:id/ai-process',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  handleValidationErrors,
  getLatestLessonAiJobController
)

// LIST LESSON AI JOBS : GET /api/lessons/:id/ai-jobs
lessonRouter.get(
  '/:id/ai-jobs',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  handleValidationErrors,
  getLessonAiJobsController
)

// GET SPECIFIC AI JOB DETAIL : GET /api/lessons/:id/ai-jobs/:jobId
lessonRouter.get(
  '/:id/ai-jobs/:jobId',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  jobIdValidator,
  handleValidationErrors,
  getAiJobDetailController
)

// TRIGGER IMMEDIATE JOB POLL : POST /api/lessons/:id/ai-jobs/:jobId/poll
lessonRouter.post(
  '/:id/ai-jobs/:jobId/poll',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  jobIdValidator,
  handleValidationErrors,
  pollAiJobController
)

// ==========================================
// AI MODEL REGISTRY & SUMMARY RECOVERY (STEP 7G)
// ==========================================


// RECOVER / RETRY AI SUMMARY : POST /api/lessons/:id/ai-summary/generate & /retry
lessonRouter.post(
  '/:id/ai-summary/generate',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  handleValidationErrors,
  recoverOrGenerateLessonSummaryController
)

lessonRouter.post(
  '/:id/ai-summary/retry',
  verifyAccessToken,
  isTeacherOrAdmin,
  lessonIdValidator,
  handleValidationErrors,
  recoverOrGenerateLessonSummaryController
)

lessonRouter.post(
  '/:lessonId/ai-summary/generate',
  verifyAccessToken,
  isTeacherOrAdmin,
  handleValidationErrors,
  recoverOrGenerateLessonSummaryController
)

lessonRouter.post(
  '/:lessonId/ai-summary/retry',
  verifyAccessToken,
  isTeacherOrAdmin,
  handleValidationErrors,
  recoverOrGenerateLessonSummaryController
)

// ==========================================
// AI ASSESSMENT GENERATION ENDPOINTS (STEP 7C)
// ==========================================

// GENERATE AI QUIZ : POST /api/lessons/:id/ai-quiz/generate
lessonRouter.post(
  '/:id/ai-quiz/generate',
  verifyAccessToken,
  isTeacherOrAdmin,
  generateAiQuizValidator,
  handleValidationErrors,
  generateAiQuizController
)

// GENERATE AI CODING EXERCISE : POST /api/lessons/:id/ai-coding-exercise/generate
lessonRouter.post(
  '/:id/ai-coding-exercise/generate',
  verifyAccessToken,
  isTeacherOrAdmin,
  generateAiCodingExerciseValidator,
  handleValidationErrors,
  generateAiCodingExerciseController
)

// Also support :lessonId parameter alias for exact contract match
lessonRouter.post(
  '/:lessonId/ai-quiz/generate',
  verifyAccessToken,
  isTeacherOrAdmin,
  generateAiQuizValidator,
  handleValidationErrors,
  generateAiQuizController
)

lessonRouter.post(
  '/:lessonId/ai-coding-exercise/generate',
  verifyAccessToken,
  isTeacherOrAdmin,
  generateAiCodingExerciseValidator,
  handleValidationErrors,
  generateAiCodingExerciseController
)

// SAVE APPROVED AI QUIZ (PHASE 4 ATOMIC PERSISTENCE)
lessonRouter.post(
  '/:id/ai-quiz/save-approved',
  verifyAccessToken,
  isTeacherOrAdmin,
  saveApprovedAiQuizValidator,
  handleValidationErrors,
  saveApprovedAiQuizController
)

lessonRouter.post(
  '/:lessonId/ai-quiz/save-approved',
  verifyAccessToken,
  isTeacherOrAdmin,
  saveApprovedAiQuizValidator,
  handleValidationErrors,
  saveApprovedAiQuizController
)

// SAVE APPROVED AI CODING EXERCISE (PHASE 6 EXACT PREVIEW PERSISTENCE)
lessonRouter.post(
  '/:id/ai-coding-exercise/save-approved',
  verifyAccessToken,
  isTeacherOrAdmin,
  saveApprovedAiCodingExerciseValidator,
  handleValidationErrors,
  saveApprovedAiCodingExerciseController
)

lessonRouter.post(
  '/:lessonId/ai-coding-exercise/save-approved',
  verifyAccessToken,
  isTeacherOrAdmin,
  saveApprovedAiCodingExerciseValidator,
  handleValidationErrors,
  saveApprovedAiCodingExerciseController
)

export default lessonRouter

