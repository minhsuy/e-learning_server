import { Course, CourseFaq, CourseLevel, CourseStatus, CourseType, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

// ==========================================
// 1. PRISMA SELECT CONSTANTS (PROJECTIONS)
// ==========================================

/**
 * Public Course projection for storefront listing and discovery.
 * Aligned with API contracts for course catalogue.
 */
export const COURSE_PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  price: true,
  oldPrice: true,
  level: true,
  type: true,
  sold: true,
  view: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      role: true
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
} as const satisfies Prisma.CourseSelect

export type CoursePublicPayload = Prisma.CourseGetPayload<{
  select: typeof COURSE_PUBLIC_SELECT
}>

/**
 * Compact projection for embedding course info in orders, coupons, enrollments.
 */
export const COURSE_COMPACT_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  price: true,
  type: true,
  status: true
} as const satisfies Prisma.CourseSelect

export type CourseCompactPayload = Prisma.CourseGetPayload<{
  select: typeof COURSE_COMPACT_SELECT
}>

/**
 * Complete course detail projection for single course landing page.
 */
export const COURSE_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  introUrl: true,
  description: true,
  price: true,
  oldPrice: true,
  type: true,
  status: true,
  level: true,
  view: true,
  sold: true,
  requirements: true,
  benefits: true,
  techniques: true,
  documents: true,
  categoryId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      avatar: true,
      role: true
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  faqs: {
    select: {
      id: true,
      question: true,
      answer: true,
      order: true
    },
    orderBy: {
      order: 'asc'
    }
  },
  chapters: {
    where: {
      isDestroyed: false
    },
    orderBy: {
      order: 'asc'
    },
    select: {
      id: true,
      title: true,
      order: true,
      lessons: {
        orderBy: {
          order: 'asc'
        },
        select: {
          id: true,
          title: true,
          slug: true,
          duration: true,
          isDemo: true,
          order: true,
          type: true
        }
      }
    }
  }
} as const satisfies Prisma.CourseSelect

export type CourseDetailPayload = Prisma.CourseGetPayload<{
  select: typeof COURSE_DETAIL_SELECT
}>

/**
 * Administrative course projection for backoffice management dashboards.
 */
export const COURSE_ADMIN_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  price: true,
  oldPrice: true,
  level: true,
  type: true,
  status: true,
  sold: true,
  view: true,
  isDestroyed: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      role: true
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
} as const satisfies Prisma.CourseSelect

export type CourseAdminPayload = Prisma.CourseGetPayload<{
  select: typeof COURSE_ADMIN_SELECT
}>

/**
 * Teacher course projection for educator management workspace.
 */
export const COURSE_TEACHER_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  image: true,
  price: true,
  oldPrice: true,
  level: true,
  type: true,
  sold: true,
  view: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
} as const satisfies Prisma.CourseSelect

export type CourseTeacherPayload = Prisma.CourseGetPayload<{
  select: typeof COURSE_TEACHER_SELECT
}>

// Helper to resolve client and options polymorphic arguments
function resolveCourseClientAndOptions(
  optionsOrTx?: { include?: Prisma.CourseInclude; select?: Prisma.CourseSelect } | PrismaTransactionClient,
  explicitTx?: PrismaTransactionClient
): { client: PrismaTransactionClient | typeof prisma; options?: { include?: Prisma.CourseInclude; select?: Prisma.CourseSelect } } {
  if (!optionsOrTx) {
    return { client: explicitTx || prisma }
  }
  if ('course' in optionsOrTx) {
    return { client: optionsOrTx as PrismaTransactionClient }
  }
  return {
    client: explicitTx || prisma,
    options: optionsOrTx
  }
}

// ==========================================
// 2. COURSE MUTATION FUNCTIONS
// ==========================================

/**
 * Insert a new course into PostgreSQL.
 */
export const addCourse = async (
  data: Prisma.CourseCreateInput,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.create({ data })
}

export const createCourse = addCourse

/**
 * Update an existing course by primary key UUID.
 */
export const updateCourse = async (
  id: string,
  data: Prisma.CourseUpdateInput,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.update({
    where: { id },
    data
  })
}

/**
 * Update approval status of a course.
 */
export const updateCourseStatus = async (
  id: string,
  status: CourseStatus,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.update({
    where: { id },
    data: { status }
  })
}

/**
 * Soft delete a course by setting `isDestroyed = true`.
 */
export const softDeleteCourse = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.update({
    where: { id },
    data: { isDestroyed: true }
  })
}

/**
 * Restore a soft-deleted course.
 */
export const restoreCourse = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.update({
    where: { id },
    data: { isDestroyed: false }
  })
}

/**
 * Hard delete a course by primary key UUID.
 * Cascades to faqs, chapters, and lessons according to schema.
 */
export const deleteCourse = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.delete({
    where: { id }
  })
}

/**
 * Atomically increment course view counter.
 */
export const incrementCourseView = async (
  id: string,
  amount = 1,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.update({
    where: { id },
    data: {
      view: { increment: amount }
    }
  })
}

/**
 * Atomically increment course sold counter.
 */
export const incrementCourseSold = async (
  id: string,
  amount = 1,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.update({
    where: { id },
    data: {
      sold: { increment: amount }
    }
  })
}

/**
 * Atomically decrement course sold counter.
 */
export const decrementCourseSold = async (
  id: string,
  amount = 1,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  return client.course.update({
    where: { id },
    data: {
      sold: { decrement: amount }
    }
  })
}

// ==========================================
// 3. COURSE QUERY FUNCTIONS
// ==========================================

/**
 * Find a course by its primary key UUID.
 */
export const findCourseById = async <T = Course>(
  id: string,
  optionsOrTx?: {
    include?: Prisma.CourseInclude
    select?: Prisma.CourseSelect
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveCourseClientAndOptions(optionsOrTx, tx)
  return client.course.findUnique({
    where: { id },
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find a course by its unique URL slug.
 */
export const findCourseBySlug = async <T = Course>(
  slug: string,
  optionsOrTx?: {
    include?: Prisma.CourseInclude
    select?: Prisma.CourseSelect
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveCourseClientAndOptions(optionsOrTx, tx)
  return client.course.findUnique({
    where: { slug },
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find course detail by slug for public landing page.
 * Optionally increments view count atomically.
 */
export const findCourseDetailBySlug = async (
  slug: string,
  increaseView = true,
  tx?: PrismaTransactionClient
): Promise<CourseDetailPayload | null> => {
  const client = tx || prisma
  const normalizedSlug = slug.trim().toLowerCase()

  if (increaseView) {
    // Atomically find, update view count and load detail relations
    const exists = await client.course.findFirst({
      where: {
        slug: normalizedSlug,
        status: CourseStatus.APPROVED,
        isDestroyed: false
      },
      select: { id: true }
    })

    if (!exists) return null

    return client.course.update({
      where: { id: exists.id },
      data: { view: { increment: 1 } },
      select: COURSE_DETAIL_SELECT
    })
  }

  return client.course.findFirst({
    where: {
      slug: normalizedSlug,
      status: CourseStatus.APPROVED,
      isDestroyed: false
    },
    select: COURSE_DETAIL_SELECT
  })
}

/**
 * Check if a course slug already exists.
 */
export const isCourseSlugTaken = async (
  slug: string,
  excludeId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma
  const count = await client.course.count({
    where: {
      slug: slug.trim().toLowerCase(),
      ...(excludeId ? { id: { not: excludeId } } : {})
    }
  })
  return count > 0
}

/**
 * Filtered query for courses with pagination.
 */
export const findCoursesWithPagination = async <T = CoursePublicPayload>(
  params: {
    page?: number
    limit?: number
    search?: string
    categoryId?: string
    level?: CourseLevel
    type?: CourseType
    status?: CourseStatus
    authorId?: string
    isDestroyed?: boolean
    priceMin?: number
    priceMax?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    select?: Prisma.CourseSelect
    include?: Prisma.CourseInclude
  },
  tx?: PrismaTransactionClient
): Promise<{
  courses: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}> => {
  const client = tx || prisma
  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, Math.min(100, params.limit || 10))
  const skip = (page - 1) * limit

  const where: Prisma.CourseWhereInput = {
    ...(params.isDestroyed !== undefined ? { isDestroyed: params.isDestroyed } : { isDestroyed: false }),
    ...(params.status ? { status: params.status } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.authorId ? { authorId: params.authorId } : {}),
    ...(params.level ? { level: params.level } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.search
      ? {
          title: { contains: params.search, mode: 'insensitive' }
        }
      : {})
  }

  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    where.price = {
      ...(params.priceMin !== undefined ? { gte: params.priceMin } : {}),
      ...(params.priceMax !== undefined ? { lte: params.priceMax } : {})
    }
  }

  const validSortFields = ['createdAt', 'updatedAt', 'price', 'view', 'sold', 'title']
  const sortField = validSortFields.includes(params.sortBy || '') ? (params.sortBy as string) : 'createdAt'
  const sortDirection: Prisma.SortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc'
  const orderBy: Prisma.CourseOrderByWithRelationInput = { [sortField]: sortDirection }

  const [courses, total] = await Promise.all([
    client.course.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      ...(params.select ? { select: params.select } : { select: COURSE_PUBLIC_SELECT })
    }) as Promise<T[]>,
    client.course.count({ where })
  ])

  return {
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Find courses authored by a specific teacher with filters and pagination.
 */
export const findCoursesByAuthor = async (
  authorId: string,
  params?: {
    page?: number
    limit?: number
    search?: string
    categoryId?: string
    level?: CourseLevel
    type?: CourseType
    status?: CourseStatus
    priceMin?: number
    priceMax?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  },
  tx?: PrismaTransactionClient
): Promise<{
  courses: CourseTeacherPayload[]
  total: number
  page: number
  limit: number
  totalPages: number
}> => {
  return findCoursesWithPagination<CourseTeacherPayload>(
    {
      authorId,
      isDestroyed: false,
      select: COURSE_TEACHER_SELECT,
      ...params
    },
    tx
  )
}

/**
 * Count courses with arbitrary filter.
 */
export const countCourses = async (
  where?: Prisma.CourseWhereInput,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.course.count({ where })
}

// ==========================================
// 4. COURSE FAQ FUNCTIONS
// ==========================================

/**
 * Add a new FAQ to a course.
 */
export const addCourseFaq = async (
  data: Prisma.CourseFaqCreateInput,
  tx?: PrismaTransactionClient
): Promise<CourseFaq> => {
  const client = tx || prisma
  return client.courseFaq.create({ data })
}

/**
 * Add multiple FAQs in batch for a course.
 */
export const addCourseFaqs = async (
  data: Prisma.CourseFaqCreateManyInput[],
  tx?: PrismaTransactionClient
): Promise<Prisma.BatchPayload> => {
  const client = tx || prisma
  return client.courseFaq.createMany({ data })
}

/**
 * Find all FAQs belonging to a course, ordered by sequence.
 */
export const findFaqsByCourseId = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<CourseFaq[]> => {
  const client = tx || prisma
  return client.courseFaq.findMany({
    where: { courseId },
    orderBy: { order: 'asc' }
  })
}

/**
 * Delete all FAQs of a course.
 */
export const deleteFaqsByCourseId = async (
  courseId: string,
  tx?: PrismaTransactionClient
): Promise<Prisma.BatchPayload> => {
  const client = tx || prisma
  return client.courseFaq.deleteMany({
    where: { courseId }
  })
}

/**
 * Increment or decrement the sold count of a course.
 * Used when an order is completed, rejected, or student removed.
 */
export const incrementCourseSoldCount = async (
  courseId: string,
  amount: number = 1,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const client = tx || prisma
  if (amount >= 0) {
    return client.course.update({
      where: { id: courseId },
      data: {
        sold: { increment: amount }
      }
    })
  } else {
    return client.course.update({
      where: { id: courseId },
      data: {
        sold: { decrement: Math.abs(amount) }
      }
    })
  }
}

