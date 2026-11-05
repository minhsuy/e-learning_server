import express from 'express'
import {
  bunnyWebhookController,
  createUploadSignatureController,
  deleteVideoController,
  getLessonPlaybackController,
  getVideoStatusController
} from '~/controller/video.controller'
import { handleValidationErrors } from '~/middlewares/validate'
import {
  createUploadSignatureValidator,
  lessonIdParamValidator,
  videoIdParamValidator
} from '~/middlewares/video.middleware'
import { isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const videoRouter = express.Router()

// 1. Authorize Direct TUS Video Upload: POST /api/videos/upload-signature
videoRouter.post(
  '/upload-signature',
  verifyAccessToken,
  isTeacherOrAdmin,
  createUploadSignatureValidator,
  handleValidationErrors,
  createUploadSignatureController
)

// 2. Check Video Transcoding Status: GET /api/videos/:videoId/status
videoRouter.get(
  '/:videoId/status',
  verifyAccessToken,
  isTeacherOrAdmin,
  videoIdParamValidator,
  handleValidationErrors,
  getVideoStatusController
)

// 3. Delete Video Asset: DELETE /api/videos/:videoId
videoRouter.delete(
  '/:videoId',
  verifyAccessToken,
  isTeacherOrAdmin,
  videoIdParamValidator,
  handleValidationErrors,
  deleteVideoController
)

// 4. Retrieve Secure Playback Info for a Lesson: GET /api/videos/lesson/:lessonId/playback
videoRouter.get(
  '/lesson/:lessonId/playback',
  verifyAccessToken,
  lessonIdParamValidator,
  handleValidationErrors,
  getLessonPlaybackController
)

// 5. Optional Webhook from Bunny Stream: POST /api/videos/webhook
videoRouter.post('/webhook', bunnyWebhookController)

export default videoRouter
