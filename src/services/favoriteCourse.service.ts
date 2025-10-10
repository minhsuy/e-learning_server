import FavoriteCourseModel from '~/models/favoriteCourse.model'
import CourseModel from '~/models/course.model'
import { ServiceResponse } from '~/types/type'
import { Types } from 'mongoose'

export const addFavoriteService = async (userId: string, courseId: string): Promise<ServiceResponse> => {
  const course = await CourseModel.findById(courseId)
  if (!course) return { success: false, statusCode: 404, message: 'Course not found' }

  const existing = await FavoriteCourseModel.findOne({ user: userId, course: courseId })
  if (existing) return { success: false, statusCode: 400, message: 'Course already in favorites' }

  const favorite = await FavoriteCourseModel.create({
    user: new Types.ObjectId(userId),
    course: new Types.ObjectId(courseId)
  })

  return { success: true, message: 'Course added to favorites', data: favorite }
}

export const removeFavoriteService = async (userId: string, courseId: string): Promise<ServiceResponse> => {
  const existing = await FavoriteCourseModel.findOne({ user: userId, course: courseId })
  if (!existing) return { success: false, statusCode: 404, message: 'Favorite not found' }

  await FavoriteCourseModel.findByIdAndDelete(existing._id)

  return { success: true, message: 'Course removed from favorites' }
}

export const getFavoritesService = async (userId: string, page = 1, limit = 10): Promise<ServiceResponse> => {
  const skip = (page - 1) * limit
  const [favorites, total] = await Promise.all([
    FavoriteCourseModel.find({ user: userId })
      .populate('course', 'title slug image price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    FavoriteCourseModel.countDocuments({ user: userId })
  ])

  return {
    success: true,
    message: 'Fetched favorites successfully',
    data: {
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
