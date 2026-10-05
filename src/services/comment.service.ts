import { CommentReactionType, CommentStatus, Prisma, UserRole } from '@prisma/client'
import {
  CommentDetailPayload,
  countCommentsWithFilter,
  createComment,
  deleteCommentById,
  findCommentById,
  findCommentsByLessonId,
  findCommentsWithFilter,
  updateCommentContent
} from '~/repositories/comment.repository'
import {
  createReaction,
  findReaction,
  updateReactionType
} from '~/repositories/commentReaction.repository'
import { findCourseById, findCoursesByAuthor } from '~/repositories/course.repository'
import { findLessonById } from '~/repositories/lesson.repository'
import { findUserById } from '~/repositories/user.repository'
import { findEnrollmentByUserAndCourse } from '~/repositories/enrollment.repository'
import { ENotificationType } from '~/types/enum'
import { ServiceResponse } from '~/types/type'
import { withCompatId } from '~/utils/uuid'
import { pushNotificationService } from './notification.service'

/**
 * TMDEMY — COMMENT SERVICE
 * 
 * Manages lesson comments and reactions for students, instructors, and admins.
 * Single source of truth: PostgreSQL via Functional Repositories and Prisma ORM.
 * Zero Mongoose / MongoDB dependencies in the comment domain.
 */

export interface SerializedCommentResponse {
  id: string
  _id: string
  content: string
  lesson: { id: string; _id: string; title: string }
  course: { id: string; _id: string; title: string; slug: string }
  user: { id: string; _id: string; username: string; avatar: string }
  status: CommentStatus
  parentId: string | null
  level: number
  likes: string[]
  dislikes: string[]
  createdAt: Date
  updatedAt: Date
}

export const serializeComment = (comment: CommentDetailPayload): SerializedCommentResponse => {
  const likes = comment.reactions
    .filter((r) => r.type === CommentReactionType.LIKE)
    .map((r) => r.userId)

  const dislikes = comment.reactions
    .filter((r) => r.type === CommentReactionType.DISLIKE)
    .map((r) => r.userId)

  return withCompatId({
    id: comment.id,
    content: comment.content,
    lesson: withCompatId({
      id: comment.lesson.id,
      title: comment.lesson.title
    }),
    course: withCompatId({
      id: comment.course.id,
      title: comment.course.title,
      slug: comment.course.slug
    }),
    user: withCompatId({
      id: comment.user.id,
      username: comment.user.username,
      avatar: comment.user.avatar || ''
    }),
    status: comment.status,
    parentId: comment.parentId,
    level: comment.level,
    likes,
    dislikes,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  })
}

export const createCommentService = async ({
  content,
  lesson,
  course,
  parentId,
  userId,
  role
}: {
  content: string
  lesson: string
  course: string
  parentId?: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  // 1. Verify Course exists
  const courseDoc = await findCourseById(course)
  if (!courseDoc) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  // 2. Authorization checks
  const normRole = (role || '').toUpperCase()
  const isTeacher = normRole === 'TEACHER'
  const isAdmin = normRole === 'ADMIN'

  if (isTeacher && courseDoc.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  if (!isTeacher && !isAdmin) {
    const enrollment = await findEnrollmentByUserAndCourse(userId, course)
    if (!enrollment) {
      return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
    }
  }

  // 3. Verify Lesson exists
  const lessonDoc = await findLessonById(lesson)
  if (!lessonDoc) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  // 4. Verify parent comment if this is a reply
  let level = 0
  let parentComment: CommentDetailPayload | null = null
  if (parentId) {
    parentComment = await findCommentById(parentId)
    if (!parentComment) {
      return { success: false, statusCode: 404, message: 'Parent comment not found' }
    }
    level = parentComment.level + 1
  }

  // 5. Create comment in PostgreSQL
  const comment = await createComment({
    content,
    lessonId: lesson,
    courseId: course,
    userId,
    parentId: parentId || null,
    level,
    status: CommentStatus.APPROVED
  })

  // 6. Push notification (Non-blocking: failures must never fail comment creation)
  try {
    if (parentId && parentComment && parentComment.userId !== userId) {
      const senderUser = await findUserById(userId)
      await pushNotificationService({
        senderId: userId,
        receiverId: parentComment.userId,
        type: ENotificationType.COMMENT_REPLY,
        message: `${senderUser?.username || 'Người dùng'} vừa trả lời bình luận của bạn: "${content}"`,
        relatedId: lesson
      })
    } else if (!parentId && courseDoc.authorId !== userId) {
      const commenter = await findUserById(userId)
      await pushNotificationService({
        senderId: userId,
        receiverId: courseDoc.authorId,
        type: ENotificationType.COMMENT,
        message: `Học viên ${commenter?.username || 'Người dùng'} vừa bình luận về khóa học "${courseDoc.title}"`,
        relatedId: lesson
      })
    }
  } catch (notifErr) {
    // Non-blocking notification fail-safe
  }

  return {
    success: true,
    message: 'Comment created successfully',
    data: serializeComment(comment)
  }
}

export const getCommentsByLessonService = async ({
  lessonId
}: {
  lessonId: string
}): Promise<ServiceResponse> => {
  const comments = await findCommentsByLessonId(lessonId, CommentStatus.APPROVED)

  return {
    success: true,
    message: 'Fetched comments successfully',
    data: comments.map(serializeComment)
  }
}

export const deleteCommentService = async ({
  commentId,
  userId
}: {
  commentId: string
  userId: string
  role?: string
}): Promise<ServiceResponse> => {
  const comment = await findCommentById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  if (comment.userId !== userId) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not allowed to delete this comment'
    }
  }

  await deleteCommentById(commentId)

  return {
    success: true,
    message: 'Comment deleted successfully'
  }
}

export const getCommentsByAdminOrTeacherService = async ({
  page = 1,
  limit = 10,
  search,
  status,
  courseId,
  userId,
  role
}: {
  page?: number
  limit?: number
  search?: string
  status?: string
  courseId?: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  let filterCourseId: string | undefined = undefined
  let filterCourseIds: string[] | undefined = undefined

  const isTeacher = (role || '').toUpperCase() === 'TEACHER'

  if (isTeacher) {
    if (courseId) {
      const course = await findCourseById(courseId)
      if (!course || course.authorId !== userId) {
        return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
      }
      filterCourseId = courseId
    } else {
      const teacherCoursesResult = await findCoursesByAuthor(userId, { limit: 1000 })
      filterCourseIds = teacherCoursesResult.courses.map((c) => c.id)
    }
  } else if (courseId) {
    filterCourseId = courseId
  }

  let filterStatus: CommentStatus | undefined = undefined
  if (status) {
    const s = status.toLowerCase()
    if (s === 'active' || s === 'approved') {
      filterStatus = CommentStatus.APPROVED
    } else if (s === 'pending') {
      filterStatus = CommentStatus.PENDING
    } else if (s === 'inactive' || s === 'rejected') {
      filterStatus = CommentStatus.REJECTED
    }
  }

  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, limit)
  const skip = (safePage - 1) * safeLimit

  const [comments, total] = await Promise.all([
    findCommentsWithFilter({
      courseId: filterCourseId,
      courseIds: filterCourseIds,
      status: filterStatus,
      search,
      skip,
      take: safeLimit
    }),
    countCommentsWithFilter({
      courseId: filterCourseId,
      courseIds: filterCourseIds,
      status: filterStatus,
      search
    })
  ])

  return {
    success: true,
    message: 'Fetched comments successfully!',
    data: {
      comments: comments.map(serializeComment),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  }
}

export const updateCommentService = async ({
  commentId,
  content,
  userId,
  role
}: {
  commentId: string
  content: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const comment = await findCommentById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  const isAdmin = (role || '').toUpperCase() === 'ADMIN'

  if (comment.userId !== userId && !isAdmin) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not allowed to edit this comment'
    }
  }

  const updatedComment = await updateCommentContent(commentId, content)
  if (!updatedComment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  return {
    success: true,
    message: 'Comment updated successfully',
    data: serializeComment(updatedComment)
  }
}

export const likeCommentService = async ({
  commentId,
  userId
}: {
  commentId: string
  userId: string
}): Promise<ServiceResponse> => {
  const comment = await findCommentById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  const existingReaction = await findReaction(commentId, userId)

  if (existingReaction?.type === CommentReactionType.LIKE) {
    return { success: false, statusCode: 400, message: 'You have already liked this comment' }
  }

  try {
    if (existingReaction?.type === CommentReactionType.DISLIKE) {
      await updateReactionType(commentId, userId, CommentReactionType.LIKE)
    } else {
      await createReaction(commentId, userId, CommentReactionType.LIKE)
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, statusCode: 400, message: 'You have already liked this comment' }
    }
    throw err
  }

  const updatedComment = await findCommentById(commentId)
  if (!updatedComment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  return {
    success: true,
    message: 'Comment liked successfully',
    data: serializeComment(updatedComment)
  }
}

export const dislikeCommentService = async ({
  commentId,
  userId
}: {
  commentId: string
  userId: string
}): Promise<ServiceResponse> => {
  const comment = await findCommentById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  const existingReaction = await findReaction(commentId, userId)

  if (existingReaction?.type === CommentReactionType.DISLIKE) {
    return { success: false, statusCode: 400, message: 'You have already disliked this comment' }
  }

  try {
    if (existingReaction?.type === CommentReactionType.LIKE) {
      await updateReactionType(commentId, userId, CommentReactionType.DISLIKE)
    } else {
      await createReaction(commentId, userId, CommentReactionType.DISLIKE)
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { success: false, statusCode: 400, message: 'You have already disliked this comment' }
    }
    throw err
  }

  const updatedComment = await findCommentById(commentId)
  if (!updatedComment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  return {
    success: true,
    message: 'Comment disliked successfully',
    data: serializeComment(updatedComment)
  }
}

export const deleteCommentByAdminOrTeacherService = async ({
  commentId,
  userId,
  role
}: {
  commentId: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const comment = await findCommentById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  const isTeacher = (role || '').toUpperCase() === 'TEACHER'

  if (isTeacher) {
    if (comment.course.authorId !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not allowed to delete this comment'
      }
    }
  }

  await deleteCommentById(commentId)

  return {
    success: true,
    message: 'Comment deleted successfully'
  }
}
