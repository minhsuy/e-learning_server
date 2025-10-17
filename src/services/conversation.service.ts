import ConversationModel from '~/models/conversation.model'
import CourseModel from '~/models/course.model'
import EnrollmentModel from '~/models/enrollment.model'

export const createConversationService = async ({
  senderId,
  receiverId,
  isGroup,
  name,
  course
}: {
  senderId: string
  receiverId?: string
  isGroup?: boolean
  name?: string
  course?: string
}) => {
  if (isGroup) {
    if (!course) {
      return { success: false, statusCode: 400, message: 'Course ID is required for group chat' }
    }

    const existingGroup = await ConversationModel.findOne({ course, isGroup: true })
    if (existingGroup) {
      return { success: true, message: 'Group conversation already exists', data: existingGroup }
    }

    const courseData = await CourseModel.findById(course).select('author')
    const enrollments = await EnrollmentModel.find({ course }).select('user')
    const students = enrollments.map((e) => e.user)

    const participants = [courseData?.author, ...students]

    const group = await ConversationModel.create({
      participants,
      isGroup: true,
      name: name || 'Course Q&A Group',
      course
    })

    return { success: true, message: 'Group conversation created successfully', data: group }
  }

  // 1 - 1
  if (!receiverId) {
    return { success: false, statusCode: 400, message: 'receiverId is required for private chat' }
  }

  if (senderId === receiverId) {
    return { success: false, statusCode: 400, message: 'Cannot create conversation with yourself' }
  }

  const existing = await ConversationModel.findOne({
    participants: { $all: [senderId, receiverId] },
    isGroup: false
  })

  if (existing) {
    return { success: true, message: 'Conversation already exists', data: existing }
  }

  const newConversation = await ConversationModel.create({
    participants: [senderId, receiverId],
    isGroup: false
  })

  return { success: true, message: 'Private conversation created successfully', data: newConversation }
}

export const getUserConversationsService = async ({ userId }: { userId: string }) => {
  const conversations = await ConversationModel.find({
    participants: userId
  })
    .populate('participants', 'name avatar role')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })

  return {
    success: true,
    statusCode: 200,
    message: 'Fetched user conversations successfully',
    data: conversations
  }
}
