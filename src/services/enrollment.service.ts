import { prisma } from '~/config/prisma'
import {
  countStudentsByCourseId,
  deleteEnrollment,
  findEnrollmentsByUserId,
  findStudentsByCourseId
} from '~/repositories/enrollment.repository'
import { findCourseById, incrementCourseSoldCount } from '~/repositories/course.repository'
import { UserRole } from '~/types/enum'
import { ServiceResponse } from '~/types/type'
import { isValidUUID, withCompatId } from '~/utils/uuid'


/**
 * Format course inside an enrollment response to ensure Number prices and MongoDB _id compatibility.
 */
const formatEnrollmentCourse = (course: any) => {
  if (!course) return null
  return {
    ...withCompatId(course),
    price: Number(course.price)
  }
}

/**
 * Get enrollments belonging to the current authenticated user.
 */
export const getMyEnrollmentsService = async ({ userId }: { userId: string }): Promise<ServiceResponse> => {
  if (!isValidUUID(userId)) {
    return { success: false, statusCode: 401, message: 'User not found' }
  }

  const enrollments = await findEnrollmentsByUserId(userId)

  return {
    success: true,
    message: 'Fetched enrolled courses successfully',
    data: enrollments.map((e) => ({
      ...withCompatId(e),
      course: formatEnrollmentCourse(e.course)
    }))
  }
}

/**
 * Get students enrolled in a specific course (for Teacher or Admin).
 */
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
  if (!isValidUUID(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Course ID' }
  }

  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const isTeacher = String(role).toLowerCase() === 'teacher'
  if (isTeacher && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const [students, total] = await Promise.all([
    findStudentsByCourseId({
      courseId,
      search: search.trim() || undefined,
      page: Number(page),
      limit: Number(limit)
    }),
    countStudentsByCourseId({
      courseId,
      search: search.trim() || undefined
    })
  ])

  return {
    success: true,
    message: 'Fetched enrolled students successfully!',
    data: {
      students: students.map((s) => ({
        ...withCompatId(s),
        user: s.user ? withCompatId(s.user) : null
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1
      }
    }
  }
}

/**
 * Remove (kick) a student from a course.
 * Performs atomic deletion & sold decrement on PostgreSQL, then dual-writes to MongoDB.
 */
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
  if (!isValidUUID(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Course ID' }
  }
  if (!isValidUUID(targetUserId)) {
    return { success: false, statusCode: 400, message: 'Invalid Student ID' }
  }

  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const isTeacher = String(role).toLowerCase() === 'teacher'
  if (isTeacher && course.authorId !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  // Execute PostgreSQL modifications atomically inside a transaction
  const deletedEnrollment = await prisma.$transaction(async (tx) => {
    const enrollment = await deleteEnrollment(targetUserId, courseId, tx)
    if (!enrollment) {
      return null
    }

    // Decrement course sold count on PostgreSQL
    await incrementCourseSoldCount(courseId, -1, tx)

    // Remove any corresponding Order on PostgreSQL
    await tx.order.deleteMany({
      where: {
        userId: targetUserId,
        courseId
      }
    })

    return enrollment
  })

  if (!deletedEnrollment) {
    return { success: false, statusCode: 404, message: 'Student not found in this course' }
  }



  return {
    success: true,
    message: 'Student has been removed from the course successfully!'
  }
}
