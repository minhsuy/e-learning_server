import { FilterQuery, Types } from 'mongoose'
import CommentModel from '~/models/comment.model'
import CourseModel from '~/models/course.model'
import UserModel from '~/models/user.model'
import { CommentStatus, UserRole } from '~/types/enum'
import { ServiceResponse } from '~/types/type'

export const createCommentService = async ({
  content,
  lesson,
  course,
  parentId,
  userId
}: {
  content: string
  lesson: string
  course: string
  parentId?: string
  userId: string
}): Promise<ServiceResponse> => {
  const checkUserCourse = await UserModel.findById(userId).select('courses')
  if (!checkUserCourse) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }
  const isEnrolled = checkUserCourse.courses.some((course: any) => course._id.toString() === course.toString())

  if (!isEnrolled) {
    return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
  }
  let level = 0
  if (parentId) {
    const parentComment = await CommentModel.findById(parentId)
    if (!parentComment) {
      return { success: false, statusCode: 404, message: 'Parent comment not found' }
    }
    level = parentComment.level + 1
  }

  const comment = await CommentModel.create({
    content,
    lesson: new Types.ObjectId(lesson),
    course: new Types.ObjectId(course),
    user: new Types.ObjectId(userId),
    parentId: parentId ? new Types.ObjectId(parentId) : null,
    level,
    status: CommentStatus.APPROVED
  })

  return {
    success: true,
    message: 'Comment created successfully',
    data: comment
  }
}

export const getCommentsByLessonService = async ({ lessonId }: { lessonId: string }): Promise<ServiceResponse> => {
  const comments = await CommentModel.find({ lesson: lessonId, status: CommentStatus.APPROVED })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 })

  return {
    success: true,
    message: 'Fetched comments successfully',
    data: comments
  }
}

// delete comment :
export const deleteCommentService = async ({
  commentId,
  userId
}: {
  commentId: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const comment = await CommentModel.findById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  if (comment.user.toString() !== userId) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not allowed to delete this comment'
    }
  }

  await CommentModel.findByIdAndDelete(commentId)

  return {
    success: true,
    message: 'Comment deleted successfully'
  }
}
// get comments by admin or teacher
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
}) => {
  const filter: any = {}

  if (status) filter.status = status

  if (search) {
    filter.$or = [
      { content: { $regex: search, $options: 'i' } },
      { 'course.title': { $regex: search, $options: 'i' } },
      { 'user.username': { $regex: search, $options: 'i' } }
    ]
  }

  if (role === UserRole.TEACHER) {
    if (courseId && Types.ObjectId.isValid(courseId)) {
      const course = await CourseModel.findOne({
        _id: new Types.ObjectId(courseId),
        author: new Types.ObjectId(userId)
      })
      if (!course) {
        return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
      }
      filter.course = new Types.ObjectId(courseId)
    } else {
      const teacherCourses = await CourseModel.find({ author: new Types.ObjectId(userId) }).select('_id')
      filter.course = { $in: teacherCourses.map((c) => c._id) }
    }
  }

  if (courseId && Types.ObjectId.isValid(courseId) && role !== UserRole.TEACHER) {
    filter.course = new Types.ObjectId(courseId)
  }

  const skip = (page - 1) * limit

  const [comments, total] = await Promise.all([
    CommentModel.find(filter)
      .populate('user', 'username avatar')
      .populate('course', 'title slug')
      .populate('lesson', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    CommentModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched comments successfully!',
    data: {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

// update comment :
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
  const comment = await CommentModel.findById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  if (comment.user.toString() !== userId && role !== UserRole.ADMIN) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not allowed to edit this comment'
    }
  }

  comment.content = content
  await comment.save()

  return {
    success: true,
    message: 'Comment updated successfully',
    data: comment
  }
}
// like comment :
export const likeCommentService = async ({
  commentId,
  userId
}: {
  commentId: string
  userId: string
}): Promise<ServiceResponse> => {
  const comment = await CommentModel.findById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  const userObjectId = new Types.ObjectId(userId)

  if (comment.likes.includes(userObjectId)) {
    return { success: false, statusCode: 400, message: 'You have already liked this comment' }
  }

  if (comment.dislikes.includes(userObjectId)) {
    comment.dislikes = comment.dislikes.filter((user) => user.toString() !== userObjectId.toString())
  }

  comment.likes.push(userObjectId)
  await comment.save()

  return { success: true, message: 'Comment liked successfully', data: comment }
}

export const dislikeCommentService = async ({
  commentId,
  userId
}: {
  commentId: string
  userId: string
}): Promise<ServiceResponse> => {
  const comment = await CommentModel.findById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  const userObjectId = new Types.ObjectId(userId)

  if (comment.dislikes.includes(userObjectId)) {
    return { success: false, statusCode: 400, message: 'You have already disliked this comment' }
  }

  if (comment.likes.includes(userObjectId)) {
    comment.likes = comment.likes.filter((user) => user.toString() !== userObjectId.toString())
  }

  comment.dislikes.push(userObjectId)
  await comment.save()

  return { success: true, message: 'Comment disliked successfully', data: comment }
}

// delete comment by admin or teacher
export const deleteCommentByAdminOrTeacherService = async ({
  commentId,
  userId,
  role
}: {
  commentId: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const comment = await CommentModel.findById(commentId)
  if (!comment) {
    return { success: false, statusCode: 404, message: 'Comment not found' }
  }

  if (role === UserRole.TEACHER) {
    const course = await CourseModel.findById(comment.course)
    if (!course || course.author.toString() !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not allowed to delete this comment'
      }
    }
  }

  await CommentModel.findByIdAndDelete(commentId)

  return {
    success: true,
    message: 'Comment deleted successfully'
  }
}
