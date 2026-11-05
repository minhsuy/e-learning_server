import { CourseLevel, CourseStatus, CourseType, Prisma, UserRole as PrismaUserRole } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  addCourse,
  addCourseFaqs,
  COURSE_PUBLIC_SELECT,
  findCatalogCoursesWithPagination,
  findCourseDetailBySlug,
  findCoursesWithPagination,
  isCourseSlugTaken
} from '~/repositories/course.repository'
import { findUserById, findUsersWithPagination } from '~/repositories/user.repository'
import { ENotificationType, UserRole } from '~/types/enum'
import { ListQuery } from '~/types/type'
import { toBaseSlug } from '~/utils/ultis'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { pushNotificationService } from './notification.service'
import { CreateCourseInput, UpdateCourseInput } from '~/models/course.model'

/**
 * Helper to map level string to Prisma CourseLevel enum
 */
export function toPrismaCourseLevel(level?: string): CourseLevel {
  if (!level) return CourseLevel.BEGINNER
  const upper = String(level).toUpperCase()
  if (upper === 'BEGINNER') return CourseLevel.BEGINNER
  if (upper === 'INTERMEDIATE') return CourseLevel.INTERMEDIATE
  if (upper === 'ADVANCED') return CourseLevel.ADVANCED
  return CourseLevel.BEGINNER
}

/**
 * Helper to map type string to Prisma CourseType enum
 */
export function toPrismaCourseType(type?: string): CourseType {
  if (!type) return CourseType.PAID
  const upper = String(type).toUpperCase()
  if (upper === 'FREE') return CourseType.FREE
  if (upper === 'PAID') return CourseType.PAID
  return CourseType.PAID
}

/**
 * Helper to map status string to Prisma CourseStatus enum
 */
export function toPrismaCourseStatus(status?: string): CourseStatus {
  if (!status) return CourseStatus.PENDING
  const upper = String(status).toUpperCase()
  if (upper === 'APPROVED') return CourseStatus.APPROVED
  if (upper === 'REJECTED') return CourseStatus.REJECTED
  if (upper === 'PENDING') return CourseStatus.PENDING
  return CourseStatus.PENDING
}

/**
 * Checks if a string is a 24-character hexadecimal MongoDB ObjectId.
 * Retained for backward compatibility with legacy token payload IDs.
 */
function isLegacyObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * Normalizes and formats a course record into a consistent, backward-compatible API payload.
 * Converts Prisma Decimal values to numbers and populates both camelCase and snake_case properties.
 */
export function formatSafeCourse(course: any) {
  if (!course) return null
  const priceNum = course.price !== undefined && course.price !== null ? Number(course.price) : 0
  const oldPriceNum =
    course.oldPrice !== undefined && course.oldPrice !== null
      ? Number(course.oldPrice)
      : course.old_price !== undefined && course.old_price !== null
        ? Number(course.old_price)
        : 0

  const safe: Record<string, any> = {
    id: course.id,
    _id: course.id,
    title: course.title,
    slug: course.slug,
    image: course.image || '',
    intro_url: course.introUrl || course.intro_url || '',
    introUrl: course.introUrl || course.intro_url || '',
    description: course.description || '',
    type: course.type,
    status: course.status,
    level: course.level,
    price: priceNum,
    old_price: oldPriceNum,
    oldPrice: oldPriceNum,
    view: course.view ?? 0,
    sold: course.sold ?? 0,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    _destroy: course.isDestroyed !== undefined ? course.isDestroyed : (course._destroy ?? false),
    averageRating:
      course.averageRating !== undefined && course.averageRating !== null
        ? Number(Number(course.averageRating).toFixed(1))
        : 0,
    ratingCount:
      course.ratingCount !== undefined && course.ratingCount !== null
        ? Number(course.ratingCount)
        : 0,
    totalDuration:
      course.totalDuration !== undefined && course.totalDuration !== null
        ? Number(course.totalDuration)
        : 0,
    rejectionReason: course.rejectionReason || null
  }

  if (course.category) {
    safe.category = typeof course.category === 'object' ? withCompatId(course.category) : course.category
  } else if (course.categoryId) {
    safe.category = course.categoryId
  }

  if (course.author) {
    safe.author = typeof course.author === 'object' ? withCompatId(course.author) : course.author
  } else if (course.authorId) {
    safe.author = course.authorId
  }

  if (
    course.requirements !== undefined ||
    course.benefits !== undefined ||
    course.techniques !== undefined ||
    course.documents !== undefined ||
    course.faqs !== undefined ||
    course.info !== undefined
  ) {
    safe.info = {
      requirements: course.requirements || course.info?.requirements || [],
      benefits: course.benefits || course.info?.benefits || [],
      techniques: course.techniques || course.info?.techniques || [],
      documents: course.documents || course.info?.documents || [],
      qa: course.faqs
        ? course.faqs.map((f: any) => ({ question: f.question, answer: f.answer }))
        : (course.info?.qa || [])
    }
  }

  if (course.chapters) {
    safe.chapters = course.chapters.map((ch: any) => ({
      ...withCompatId(ch),
      _destroy: ch.isDestroyed ?? false,
      lessons: ch.lessons ? withCompatId(ch.lessons) : []
    }))
    if (course.totalDuration === undefined) {
      safe.totalDuration = course.chapters.reduce((sum: number, ch: any) => {
        if (ch.isDestroyed || ch._destroy) return sum
        const chSum = (ch.lessons || []).reduce((lSum: number, l: any) => lSum + (Number(l.duration) || 0), 0)
        return sum + chSum
      }, 0)
    }
  }

  return safe
}

// CREATE COURSE
export const createCourseService = async (
  {
    author,
    payload,
    role
  }: {
    author: string
    payload: Record<string, any>
    role: string
  },
  tx?: PrismaTransactionClient
) => {
  if (!author || (!isValidUUID(author) && !isLegacyObjectId(author))) {
    return { success: false, statusCode: 401, message: 'Invalid author' }
  }

  const {
    title,
    slug: providedSlug,
    image = '',
    intro_url = '',
    description = '',
    category,
    type = CourseType.PAID,
    price = 0,
    old_price = 0,
    level = CourseLevel.BEGINNER,
    info = {}
  } = payload

  const baseSlugSource = providedSlug && String(providedSlug).trim().length > 0 ? String(providedSlug) : String(title)
  const baseSlug = toBaseSlug(baseSlugSource)
  if (!baseSlug) {
    return { success: false, statusCode: 400, message: 'Invalid slug/title' }
  }

  const runWithTx = async (clientTx: PrismaTransactionClient) => {
    const slugExists = await isCourseSlugTaken(baseSlug, undefined, clientTx)
    if (slugExists) {
      return {
        success: false,
        statusCode: 409,
        errorCode: 'SLUG_CONFLICT',
        message: 'Slug already exists. Please provide a different slug or change the title.'
      }
    }

    const normalizedType = toPrismaCourseType(type)
    const normalizedLevel = toPrismaCourseLevel(level)
    const finalPrice = normalizedType === CourseType.FREE ? 0 : Number(price || 0)
    const finalOldPrice = normalizedType === CourseType.FREE ? 0 : Number(old_price || 0)

    const requirements = Array.isArray(info?.requirements) ? info.requirements : []
    const benefits = Array.isArray(info?.benefits) ? info.benefits : []
    const techniques = Array.isArray(info?.techniques) ? info.techniques : []
    const documents = Array.isArray(info?.documents) ? info.documents : []
    const qa = Array.isArray(info?.qa) ? info.qa : []

    const validCategoryId = category && isValidUUID(category) ? category : null

    const courseCreateData: Prisma.CourseCreateInput = {
      title,
      slug: baseSlug,
      image,
      introUrl: intro_url,
      description,
      type: normalizedType,
      price: finalPrice,
      oldPrice: finalOldPrice,
      level: normalizedLevel,
      status: role === UserRole.ADMIN || role?.toUpperCase() === 'ADMIN' ? CourseStatus.APPROVED : CourseStatus.PENDING,
      requirements,
      benefits,
      techniques,
      documents,
      author: { connect: { id: author } },
      ...(validCategoryId ? { category: { connect: { id: validCategoryId } } } : {})
    }

    const doc = await addCourse(courseCreateData, clientTx)

    if (qa.length > 0) {
      const faqBatch: Prisma.CourseFaqCreateManyInput[] = qa.map((item: any, idx: number) => ({
        courseId: doc.id,
        question: String(item.question || ''),
        answer: String(item.answer || ''),
        order: idx
      }))
      await addCourseFaqs(faqBatch, clientTx)
    }

    // Push notification to admins if created by teacher
    if (role === UserRole.TEACHER || role?.toUpperCase() === 'TEACHER') {
      try {
        const admins = await findUsersWithPagination({ role: PrismaUserRole.ADMIN }, clientTx)
        const teacher = await findUserById(author, clientTx)
        for (const admin of admins.users) {
          try {
            await pushNotificationService({
              senderId: author,
              receiverId: admin.id,
              type: ENotificationType.COURSE,
              message: `Teacher ${teacher?.username || 'Teacher'} vừa tạo khóa học "${doc.title}"`,
              relatedId: doc.id
            })
          } catch {
            // Non-blocking notification dispatch
          }
        }
      } catch {
        // Non-blocking notification dispatch
      }
    }

    const createdWithFaqs = {
      ...doc,
      faqs: qa.map((item: any, idx: number) => ({
        id: `faq-${idx}`,
        courseId: doc.id,
        question: String(item.question || ''),
        answer: String(item.answer || ''),
        order: idx
      }))
    }

    return {
      success: true,
      message: 'Course created (pending approval)',
      data: formatSafeCourse(createdWithFaqs)
    }
  }

  return tx ? runWithTx(tx) : prisma.$transaction(runWithTx)
}

// COURSE DETAIL (PUBLIC)
export const getCourseDetailPublicService = async (
  {
    slug,
    increaseView = true
  }: {
    slug: string
    increaseView?: boolean
  },
  tx?: PrismaTransactionClient
) => {
  if (!slug || !slug.trim()) {
    return { success: false, statusCode: 400, message: 'Invalid slug' }
  }

  const course = await findCourseDetailBySlug(slug, increaseView, tx)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  return {
    success: true,
    message: 'Fetched course detail successfully',
    data: formatSafeCourse(course)
  }
}

// LIST COURSES (PUBLIC)
export const getListCoursesService = async (params: ListQuery, tx?: PrismaTransactionClient) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    level,
    type,
    priceMin,
    priceMax,
    minRating,
    durationRange,
    durationMin,
    durationMax,
    sortBy = 'createdAt',
    sortOrder
  } = params

  const parseNumber = (val: unknown): number | undefined => {
    if (val === undefined || val === null || val === '') return undefined
    const n = Number(val)
    return isNaN(n) ? undefined : n
  }

  const result = await findCatalogCoursesWithPagination(
    {
      page: parseNumber(page) || 1,
      limit: parseNumber(limit) || 10,
      search: search ? String(search) : undefined,
      categoryId: category ? String(category) : undefined,
      level: level ? toPrismaCourseLevel(level as string) : undefined,
      type: type ? toPrismaCourseType(type as string) : undefined,
      status: CourseStatus.APPROVED,
      isDestroyed: false,
      priceMin: parseNumber(priceMin),
      priceMax: parseNumber(priceMax),
      minRating: parseNumber(minRating),
      durationRange: durationRange ? String(durationRange) : undefined,
      durationMin: parseNumber(durationMin),
      durationMax: parseNumber(durationMax),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    },
    tx
  )

  const courses = result.courses.map((c) => formatSafeCourse(c))

  return {
    success: true,
    message: 'Fetched courses successfully!',
    data: {
      courses,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    }
  }
}
