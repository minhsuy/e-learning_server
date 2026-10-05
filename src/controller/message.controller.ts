import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { createMessageService, getMessagesByConversationService } from '~/services/message.service'

export const createMessageController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string }
  const { conversationId, content, type } = req.body

  const result = await createMessageService({ senderId: userId, conversationId, content, type })
  res.status(result.statusCode || 200).json(result)
})

export const getMessagesByConversationController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string }
  const conversationId = String(req.params.conversationId)

  const result = await getMessagesByConversationService(conversationId, userId)
  res.status(result.statusCode || 200).json(result)
})
