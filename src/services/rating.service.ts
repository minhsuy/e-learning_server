import RatingModel from '../models/rating.model'
import CourseModel from '../models/course.model'
import UserModel from '../models/user.model'
import { FilterQuery, Types } from 'mongoose'
import { ServiceResponse } from '~/types/type'
import { ERatingStatus, UserRole } from '~/types/enum'

export const createNewRatingService = async ({
  courseId,
  rate,
  content,
  userId
}: {
  courseId: string
  rate: number
  content: string
  userId: string
}): Promise<ServiceResponse> => {
  const course = await CourseModel.findById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const user = await UserModel.findById(userId).select('courses')
  if (!user) {
    return { success: false, statusCode: 404, message: 'User not found' }
  }

  const isEnrolled = user.courses.some((c) => c.toString() === courseId)
  if (!isEnrolled) {
    return { success: false, statusCode: 403, message: 'You are not enrolled in this course' }
  }

  const existingRating = await RatingModel.findOne({ user: userId, course: courseId })
  if (existingRating) {
    return { success: false, statusCode: 400, message: 'You have already rated this course' }
  }

  const rating = await RatingModel.create({
    rate,
    content,
    user: new Types.ObjectId(userId),
    course: new Types.ObjectId(courseId),
    status: ERatingStatus.ACTIVE
  })
  course.rating.push(rating._id)
  await course.save()

  return {
    success: true,
    message: 'Rating created successfully',
    data: rating
  }
}

// get course rating
export const getCourseRatingsService = async (courseId: string): Promise<ServiceResponse> => {
  const course = await CourseModel.findById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const ratings = await RatingModel.find({ course: courseId, status: ERatingStatus.ACTIVE })
    .select('rate content user')
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 })

  const totalRatings = ratings.length
  const averageRating = totalRatings === 0 ? 0 : ratings.reduce((sum, r) => sum + r.rate, 0) / totalRatings

  return {
    success: true,
    message: 'Fetched course ratings successfully',
    data: {
      averageRating: Number(averageRating.toFixed(2)),
      totalRatings,
      ratings
    }
  }
}
// manage rating for admin or teacher
export const getRatingsForAdminOrTeacherService = async ({
  courseId,
  status,
  page = 1,
  limit = 10,
  userId,
  role
}: {
  courseId?: string
  status?: string
  page?: number
  limit?: number
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const skip = (page - 1) * limit
  const filter: FilterQuery<typeof RatingModel> = {}

  if (status) filter.status = status
  if (role === UserRole.TEACHER) {
    const teacherCourses = await CourseModel.find({ author: new Types.ObjectId(userId) }).select('_id')
    const teacherCourseIds = teacherCourses.map((c) => c._id.toString())

    if (courseId) {
      if (!teacherCourseIds.includes(courseId)) {
        return { success: false, statusCode: 403, message: 'You are not allowed to view ratings of this course' }
      }
      filter.course = new Types.ObjectId(courseId)
    } else {
      filter.course = { $in: teacherCourseIds }
    }
  }
  if (role === UserRole.ADMIN && courseId) {
    const courseExists = await CourseModel.findById(courseId)
    if (!courseExists) {
      return { success: false, statusCode: 404, message: 'Course not found' }
    }
    filter.course = new Types.ObjectId(courseId)
  }

  const [ratings, total] = await Promise.all([
    RatingModel.find(filter)
      .populate('user', 'username avatar')
      .populate('course', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    RatingModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched ratings successfully',
    data: {
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
// delete rating
export const deleteRatingService = async ({
  ratingId,
  userId,
  role
}: {
  ratingId: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const rating = await RatingModel.findById(ratingId)
  if (!rating) {
    return { success: false, statusCode: 404, message: 'Rating not found' }
  }

  if (role === UserRole.TEACHER) {
    const course = await CourseModel.findById(rating.course)
    if (!course || course.author.toString() !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not allowed to delete this rating'
      }
    }
  }

  await RatingModel.findByIdAndDelete(ratingId)

  await CourseModel.findByIdAndUpdate(rating.course, { $pull: { rating: rating._id } })

  return {
    success: true,
    message: 'Rating deleted successfully'
  }
}
// update rating by admin or teacher
export const updateRatingStatusService = async ({
  ratingId,
  status,
  userId,
  role
}: {
  ratingId: string
  status: ERatingStatus
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const rating = await RatingModel.findById(ratingId)
  if (!rating) {
    return { success: false, statusCode: 404, message: 'Rating not found' }
  }

  if (role === UserRole.TEACHER) {
    const course = await CourseModel.findById(rating.course)
    if (!course || course.author.toString() !== userId) {
      return {
        success: false,
        statusCode: 403,
        message: 'You are not allowed to update this rating'
      }
    }
  }

  rating.status = status
  await rating.save()

  return {
    success: true,
    message: 'Rating status updated successfully',
    data: rating
  }
}
