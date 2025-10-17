import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { createConversationService, getUserConversationsService } from '~/services/conversation.service'

// create  conversation
export const createConversationController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string }
  const { receiverId, isGroup, name, course } = req.body

  const result = await createConversationService({
    senderId: userId,
    receiverId,
    isGroup,
    name,
    course
  })

  res.status(200).json(result)
})

// get user conversations
export const getUserConversationsController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string }
  const result = await getUserConversationsService({ userId })
  res.status(result.statusCode || 200).json(result)
})
