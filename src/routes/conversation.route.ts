import express from 'express'
import { createConversationController, getUserConversationsController } from '~/controller/conversation.controller'
import { handleValidationErrors } from '~/middlewares/validate'
import { isAdmin, isTeacherOrAdmin } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const conversationRouter = express.Router()
// create or get conversation : POST /api/conversations
conversationRouter.post('/', verifyAccessToken, handleValidationErrors, createConversationController)

// get user conversations : GET /api/conversations/:userId
conversationRouter.get('/', verifyAccessToken, getUserConversationsController)

export default conversationRouter
