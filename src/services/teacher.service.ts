import { FilterQuery, Types } from 'mongoose'
import CourseModel from '~/models/course.model'
import { CourseStatus } from '~/types/enum'
import { ListQuery } from '~/types/type'

// update course
export const updateCourseByTeacherService = async ({
  courseId,
  teacherId,
  payload
}: {
  courseId: string
  teacherId: string
  payload: Record<string, any>
}) => {
  if (!Types.ObjectId.isValid(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await CourseModel.findById(courseId)
  if (!course || course._destroy) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (String(course.author) !== String(teacherId)) {
    return { success: false, statusCode: 403, message: 'You can only update your own courses' }
  }
  if (payload.title) course.title = payload.title
  if (payload.description) course.description = payload.description
  if (payload.image) course.image = payload.image
  if (payload.intro_url) course.intro_url = payload.intro_url
  if (payload.category) course.category = payload.category
  if (payload.type) course.type = payload.type
  if (payload.price !== undefined) course.price = payload.price
  if (payload.old_price !== undefined) course.old_price = payload.old_price
  if (payload.level) course.level = payload.level
  if (payload.view !== undefined) course.view = payload.view
  if (payload.sold !== undefined) course.sold = payload.sold
  if (payload.info) {
    course.info = {
      ...course.info,
      ...payload.info
    }
  }

  await course.save()

  return {
    success: true,
    message: 'Course updated successfully!',
    data: course
  }
}

// get courses by teacher

export const deleteCoursesByTeacherService = async ({
  courseId,
  teacherId
}: {
  courseId: string
  teacherId: string
}) => {
  const course = await CourseModel.findOne({ _id: courseId, author: teacherId })

  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (course.status !== CourseStatus.PENDING) {
    return { success: false, statusCode: 403, message: 'Only pending courses can be deleted by teacher' }
  }

  await course.deleteOne()

  return { success: true, message: 'Course deleted successfully (by teacher)' }
}

// get courses by teacher
export const getCoursesByTeacherService = async ({ teacherId, params }: { teacherId: string; params: ListQuery }) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
    level,
    type,
    priceMin,
    priceMax,
    sortBy = 'createdAt'
  } = params

  const filter: FilterQuery<typeof CourseModel> = {
    author: teacherId
  }

  if (search) {
    filter.$or = [{ title: { $regex: search, $options: 'i' } }]
  }

  if (category) filter.category = category
  if (level) filter.level = level
  if (type) filter.type = type
  if (status) filter.status = status

  if (priceMin || priceMax) {
    filter.price = {}
    if (priceMin) (filter.price as any).$gte = Number(priceMin)
    if (priceMax) (filter.price as any).$lte = Number(priceMax)
  }

  const skip = (page - 1) * limit

  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .select('title slug status image price old_price level type sold view createdAt updatedAt')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit),
    CourseModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched teacher courses successfully!',
    data: {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
