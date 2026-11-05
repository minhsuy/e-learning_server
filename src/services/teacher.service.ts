import { CourseLevel, CourseStatus, CourseType, Prisma } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import { deleteCourse, findCourseById, findCoursesByAuthor, updateCourse } from '~/repositories/course.repository'
import { ListQuery } from '~/types/type'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { formatSafeCourse, toPrismaCourseLevel, toPrismaCourseStatus, toPrismaCourseType } from './course.service'
import { UpdateCourseInput } from '~/models/course.model'

/**
 * Checks if a string is a 24-character hexadecimal MongoDB ObjectId.
 */
function isLegacyObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// UPDATE COURSE BY TEACHER
export const updateCourseByTeacherService = async (
  {
    courseId,
    teacherId,
    payload
  }: {
    courseId: string
    teacherId: string
    payload: Record<string, any>
  },
  tx?: PrismaTransactionClient
) => {
  if (!courseId || (!isValidUUID(courseId) && !isLegacyObjectId(courseId))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await findCourseById(courseId, tx)
  if (!course || course.isDestroyed) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (String(course.authorId) !== String(teacherId)) {
    return { success: false, statusCode: 403, message: 'You can only update your own courses' }
  }

  const updateData: Prisma.CourseUpdateInput = {}
  if (payload.title) updateData.title = payload.title
  if (payload.description !== undefined) updateData.description = payload.description
  if (payload.image !== undefined) updateData.image = payload.image
  if (payload.intro_url !== undefined) updateData.introUrl = payload.intro_url
  if (payload.category !== undefined) {
    updateData.category = payload.category && isValidUUID(payload.category)
      ? { connect: { id: payload.category } }
      : { disconnect: true }
  }
  if (payload.type !== undefined) updateData.type = toPrismaCourseType(payload.type)
  if (payload.price !== undefined) updateData.price = Number(payload.price)
  if (payload.old_price !== undefined) updateData.oldPrice = Number(payload.old_price)
  if (payload.level !== undefined) updateData.level = toPrismaCourseLevel(payload.level)
  if (payload.view !== undefined) updateData.view = Number(payload.view)
  if (payload.sold !== undefined) updateData.sold = Number(payload.sold)

  if (payload.info) {
    if (Array.isArray(payload.info.requirements)) updateData.requirements = payload.info.requirements
    if (Array.isArray(payload.info.benefits)) updateData.benefits = payload.info.benefits
    if (Array.isArray(payload.info.techniques)) updateData.techniques = payload.info.techniques
    if (Array.isArray(payload.info.documents)) updateData.documents = payload.info.documents
  }

  const updated = await updateCourse(courseId, updateData, tx)

  return {
    success: true,
    message: 'Course updated successfully!',
    data: formatSafeCourse(updated)
  }
}

// DELETE COURSE BY TEACHER (ONLY PENDING COURSES)
export const deleteCoursesByTeacherService = async (
  {
    courseId,
    teacherId
  }: {
    courseId: string
    teacherId: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!courseId || (!isValidUUID(courseId) && !isLegacyObjectId(courseId))) {
    return { success: false, statusCode: 400, message: 'Invalid course ID' }
  }

  const course = await findCourseById(courseId, tx)
  if (!course || course.authorId !== teacherId) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (course.status !== CourseStatus.PENDING) {
    return { success: false, statusCode: 403, message: 'Only pending courses can be deleted by teacher' }
  }

  await deleteCourse(courseId, tx)

  return { success: true, message: 'Course deleted successfully (by teacher)' }
}

// GET COURSES BY TEACHER
export const getCoursesByTeacherService = async (
  {
    teacherId,
    params
  }: {
    teacherId: string
    params: ListQuery
  },
  tx?: PrismaTransactionClient
) => {
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

  const result = await findCoursesByAuthor(
    teacherId,
    {
      page: Number(page),
      limit: Number(limit),
      search: search ? String(search) : undefined,
      status: status ? toPrismaCourseStatus(status as string) : undefined,
      categoryId: category ? String(category) : undefined,
      level: level ? toPrismaCourseLevel(level as string) : undefined,
      type: type ? toPrismaCourseType(type as string) : undefined,
      priceMin: priceMin !== undefined ? Number(priceMin) : undefined,
      priceMax: priceMax !== undefined ? Number(priceMax) : undefined,
      sortBy: sortBy as string
    },
    tx
  )

  return {
    success: true,
    message: 'Fetched teacher courses successfully!',
    data: {
      courses: result.courses.map((c: any) => {
        const studentCount = c._count?.enrollments ?? Number(c.sold || 0)
        return {
          ...withCompatId(c),
          price: Number(c.price),
          old_price: Number(c.oldPrice),
          oldPrice: Number(c.oldPrice),
          sold: studentCount,
          totalStudents: studentCount,
          category: c.category ? withCompatId(c.category) : null
        }
      }),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    }
  }
}
