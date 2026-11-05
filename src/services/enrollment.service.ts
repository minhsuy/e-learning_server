import { prisma } from '~/config/prisma'
import {
  countStudentsByCourseId,
  deleteEnrollment,
  findEnrollmentById,
  findEnrollmentByUserAndCourse,
  findEnrollmentsByUserId,
  findStudentsByCourseId
} from '~/repositories/enrollment.repository'
import { findCourseById, incrementCourseSoldCount } from '~/repositories/course.repository'
import { findCompletedLessonsDetailByUserAndCourse } from '~/repositories/progress.repository'
import { findSubmissionsByUserAndCourse } from '~/repositories/quizSubmission.repository'
import { StudentLearningProgressData } from '~/models/enrollment.model'
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

/**
 * Get detailed student learning progress in a specific course (for Teacher or Admin).
 * Returns enrollment metadata, completed lessons with timestamp, and quiz submissions history.
 */
export const getStudentProgressInCourseService = async ({
  courseId,
  studentUserId,
  currentUserId,
  role
}: {
  courseId: string
  studentUserId: string
  currentUserId: string
  role: string
}): Promise<ServiceResponse<StudentLearningProgressData>> => {
  if (!isValidUUID(courseId)) {
    return { success: false, statusCode: 400, message: 'Invalid Course ID' }
  }
  if (!isValidUUID(studentUserId)) {
    return { success: false, statusCode: 400, message: 'Invalid Student ID' }
  }

  const course = await findCourseById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  const isTeacher = String(role).toLowerCase() === 'teacher'
  if (isTeacher && course.authorId !== currentUserId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const enrollment = await findEnrollmentByUserAndCourse(studentUserId, courseId)
  if (!enrollment) {
    return { success: false, statusCode: 404, message: 'Enrollment not found' }
  }

  const [completedProgress, quizSubmissions] = await Promise.all([
    findCompletedLessonsDetailByUserAndCourse(studentUserId, courseId),
    findSubmissionsByUserAndCourse(studentUserId, courseId)
  ])

  const formattedLessons = completedProgress.map((p) => ({
    id: p.lessonId,
    _id: p.lessonId,
    lessonId: p.lessonId,
    title: p.lesson?.title || '',
    completed: p.completed,
    completedAt: p.updatedAt
  }))

  const formattedSubmissions = quizSubmissions.map((sub) => {
    const passingGrade = sub.quiz?.passingGrade ?? 0
    const passed = passingGrade === 0 ? true : sub.percentage >= passingGrade
    return {
      id: sub.id,
      _id: sub.id,
      quizId: sub.quizId,
      quizTitle: sub.quiz?.title || '',
      score: sub.score,
      maxScore: sub.totalPoints,
      passed,
      submittedAt: sub.completedAt
    }
  })

  return {
    success: true,
    message: 'Fetched student learning progress successfully',
    data: {
      enrollment: {
        ...withCompatId(enrollment),
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        progress: enrollment.progress,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt
      },
      completedLessons: formattedLessons,
      quizSubmissions: formattedSubmissions
    }
  }
}

/**
 * Get detailed student learning progress by enrollment UUID (for Teacher or Admin).
 */
export const getStudentProgressByEnrollmentIdService = async ({
  enrollmentId,
  currentUserId,
  role
}: {
  enrollmentId: string
  currentUserId: string
  role: string
}): Promise<ServiceResponse<StudentLearningProgressData>> => {
  if (!isValidUUID(enrollmentId)) {
    return { success: false, statusCode: 400, message: 'Invalid Enrollment ID' }
  }

  const enrollment = await findEnrollmentById(enrollmentId)
  if (!enrollment) {
    return { success: false, statusCode: 404, message: 'Enrollment not found' }
  }

  return getStudentProgressInCourseService({
    courseId: enrollment.courseId,
    studentUserId: enrollment.userId,
    currentUserId,
    role
  })
}
