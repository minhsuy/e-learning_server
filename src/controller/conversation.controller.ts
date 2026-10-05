import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { createConversationService, getUserConversationsService } from '~/services/conversation.service'

// Create or retrieve conversation
export const createConversationController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string }
  const { receiverId, isGroup, name, course, courseId } = req.body

  const result = await createConversationService({
    senderId: userId,
    receiverId,
    isGroup,
    name,
    course,
    courseId
  })

  res.status(result.statusCode || 200).json(result)
})

// Get user conversations
export const getUserConversationsController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user as { userId: string }
  const result = await getUserConversationsService({ userId })
  res.status(result.statusCode || 200).json(result)
})
