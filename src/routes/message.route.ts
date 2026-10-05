import express from 'express'
import { getMessagesByConversationController } from '~/controller/message.controller'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'
import { validateRouteUUIDParam } from '~/utils/uuid'

const messageRouter = express.Router()

// get messages by conversation : GET /api/messages/:conversationId
messageRouter.get(
  '/:conversationId',
  verifyAccessToken,
  validateRouteUUIDParam('conversationId'),
  handleValidationErrors,
  getMessagesByConversationController
)

export default messageRouter
