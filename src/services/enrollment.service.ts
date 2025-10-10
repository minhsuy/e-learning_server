import { FilterQuery, Types } from 'mongoose'
import CourseModel from '~/models/course.model'
import EnrollmentModel from '~/models/enrollment.model'
import OrderModel from '~/models/order.model'
import UserModel from '~/models/user.model'
import { UserRole } from '~/types/enum'
import { ServiceResponse } from '~/types/type'

export const getMyEnrollmentsService = async ({ userId }: { userId: string }): Promise<ServiceResponse> => {
  if (!userId) {
    return { success: false, statusCode: 401, message: 'User not found' }
  }

  const enrollments = await EnrollmentModel.find({ user: userId })
    .populate({
      path: 'course',
      select: 'title slug image price level type sold view'
    })
    .select('progress enrolledAt')
    .sort({ createdAt: -1 })

  return {
    success: true,
    message: 'Fetched enrolled courses successfully',
    data: enrollments
  }
}

// get students by specific course
export const getStudentsByCourseService = async ({
  courseId,
  userId,
  role,
  page = 1,
  limit = 10,
  search = ''
}: {
  courseId: string
  userId: string
  role: string
  page?: number
  limit?: number
  search?: string
}): Promise<ServiceResponse> => {
  const course = await CourseModel.findById(courseId).select('author title')
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const skip = (page - 1) * limit

  const filter: FilterQuery<typeof EnrollmentModel> = {
    course: new Types.ObjectId(courseId)
  }

  const matchUser: any = search
    ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {}

  const [students, total] = await Promise.all([
    EnrollmentModel.find(filter)
      .populate({
        path: 'user',
        match: matchUser,
        select: '_id username email avatar'
      })
      .select('progress enrolledAt')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean(),
    EnrollmentModel.countDocuments(filter)
  ])

  const filteredStudents = students.filter((e: any) => e.user)

  return {
    success: true,
    message: 'Fetched enrolled students successfully!',
    data: {
      students: filteredStudents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredStudents.length,
        totalPages: Math.ceil(filteredStudents.length / limit)
      }
    }
  }
}
// kick a student from a course
export const removeStudentFromCourseService = async ({
  courseId,
  targetUserId,
  userId,
  role
}: {
  courseId: string
  targetUserId: string
  userId: string
  role: string
}): Promise<ServiceResponse> => {
  const course = await CourseModel.findById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const enrollment = await EnrollmentModel.findOneAndDelete({
    course: new Types.ObjectId(courseId),
    user: new Types.ObjectId(targetUserId)
  })
  if (!enrollment) {
    return { success: false, statusCode: 404, message: 'Student not found in this course' }
  }

  await Promise.all([
    UserModel.findByIdAndUpdate(targetUserId, { $pull: { courses: courseId } }),
    CourseModel.findByIdAndUpdate(courseId, { $inc: { sold: -1 } }),
    OrderModel.findOneAndDelete({ course: new Types.ObjectId(courseId), user: new Types.ObjectId(targetUserId) })
  ])

  return {
    success: true,
    message: 'Student has been removed from the course successfully!'
  }
}
