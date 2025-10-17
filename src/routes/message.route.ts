import express from 'express'
import { createConversationController, getUserConversationsController } from '~/controller/conversation.controller'
import { createMessageController, getMessagesByConversationController } from '~/controller/message.controller'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const messageRouter = express.Router()

// create a new message : POST /api/messages
messageRouter.post('/', verifyAccessToken, createMessageController)

// get messages by conversation : GET /api/messages/:conversationId
messageRouter.get('/:conversationId', verifyAccessToken, getMessagesByConversationController)

export default messageRouter
