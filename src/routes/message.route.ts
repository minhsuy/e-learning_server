import express from 'express'
import { getMessagesByConversationController } from '~/controller/message.controller'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const messageRouter = express.Router()

// get messages by conversation : GET /api/messages/:conversationId
messageRouter.get('/:conversationId', verifyAccessToken, getMessagesByConversationController)

export default messageRouter
