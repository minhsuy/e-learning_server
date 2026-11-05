import { Course, CourseFaq, CourseLevel, CourseStatus, CourseType, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { isValidUUID } from '~/utils/uuid'

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
  rejectionReason: true,
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
  rejectionReason: true,
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
  },
  _count: {
    select: {
      enrollments: true
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
  options?: { rejectionReason?: string | null } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<Course> => {
  const actualTx = options && 'course' in options ? (options as PrismaTransactionClient) : tx
  const client = actualTx || prisma
  const opts = options && !('course' in options) ? (options as { rejectionReason?: string | null }) : undefined

  return client.course.update({
    where: { id },
    data: {
      status,
      ...(opts?.rejectionReason !== undefined
        ? { rejectionReason: opts.rejectionReason }
        : status === CourseStatus.APPROVED
          ? { rejectionReason: null }
          : {})
    }
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

export interface FindCatalogCoursesParams {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  level?: CourseLevel | string
  type?: CourseType | string
  priceMin?: number
  priceMax?: number
  minRating?: number
  durationRange?: 'lt-5' | '5-15' | 'gt-15' | string
  durationMin?: number
  durationMax?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: CourseStatus | string
  authorId?: string
  isDestroyed?: boolean
}

export interface CatalogCourseRow {
  id: string
  title: string
  slug: string
  image: string
  introUrl: string
  description: string
  price: number
  oldPrice: number
  level: string
  type: string
  status: string
  sold: number
  view: number
  createdAt: Date
  updatedAt: Date
  isDestroyed: boolean
  author: {
    id: string
    username: string
    email: string
    avatar: string
    role: string
  } | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  averageRating: number
  ratingCount: number
  totalDuration: number
}

/**
 * Filtered query for public catalog courses with aggregated rating and duration stats.
 */
export const findCatalogCoursesWithPagination = async (
  params: FindCatalogCoursesParams,
  tx?: PrismaTransactionClient
): Promise<{
  courses: CatalogCourseRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}> => {
  const client = tx || prisma
  const page = Math.max(1, params.page || 1)
  const limit = Math.max(1, Math.min(100, params.limit || 10))
  const offset = (page - 1) * limit

  const conditions: Prisma.Sql[] = [
    params.isDestroyed !== undefined
      ? Prisma.sql`c.is_destroyed = ${params.isDestroyed}`
      : Prisma.sql`c.is_destroyed = false`
  ]

  if (params.status) {
    conditions.push(Prisma.sql`c.status = ${String(params.status).toLowerCase()}::"CourseStatus"`)
  } else {
    conditions.push(Prisma.sql`c.status = 'approved'::"CourseStatus"`)
  }

  if (params.search && params.search.trim()) {
    conditions.push(Prisma.sql`c.title ILIKE ${'%' + params.search.trim() + '%'}`)
  }

  if (params.categoryId && isValidUUID(params.categoryId)) {
    conditions.push(Prisma.sql`c.category_id = ${params.categoryId}::uuid`)
  }

  if (params.authorId && isValidUUID(params.authorId)) {
    conditions.push(Prisma.sql`c.author_id = ${params.authorId}::uuid`)
  }

  if (params.level) {
    conditions.push(Prisma.sql`c.level = ${String(params.level).toLowerCase()}::"CourseLevel"`)
  }

  if (params.type) {
    conditions.push(Prisma.sql`c.type = ${String(params.type).toLowerCase()}::"CourseType"`)
  }

  if (params.priceMin !== undefined && !isNaN(params.priceMin)) {
    conditions.push(Prisma.sql`c.price >= ${params.priceMin}`)
  }

  if (params.priceMax !== undefined && !isNaN(params.priceMax)) {
    conditions.push(Prisma.sql`c.price <= ${params.priceMax}`)
  }

  if (params.minRating !== undefined && !isNaN(params.minRating)) {
    conditions.push(Prisma.sql`COALESCE(r_agg.rating_count, 0) > 0 AND r_agg.avg_rating >= ${params.minRating}`)
  }

  if (params.durationRange) {
    if (params.durationRange === 'lt-5') {
      conditions.push(Prisma.sql`COALESCE(l_agg.total_duration, 0) < 18000`)
    } else if (params.durationRange === '5-15') {
      conditions.push(Prisma.sql`COALESCE(l_agg.total_duration, 0) >= 18000 AND COALESCE(l_agg.total_duration, 0) <= 54000`)
    } else if (params.durationRange === 'gt-15') {
      conditions.push(Prisma.sql`COALESCE(l_agg.total_duration, 0) > 54000`)
    }
  }

  if (params.durationMin !== undefined && !isNaN(params.durationMin)) {
    conditions.push(Prisma.sql`COALESCE(l_agg.total_duration, 0) >= ${params.durationMin}`)
  }

  if (params.durationMax !== undefined && !isNaN(params.durationMax)) {
    conditions.push(Prisma.sql`COALESCE(l_agg.total_duration, 0) <= ${params.durationMax}`)
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

  let orderBySql: Prisma.Sql
  const isAsc = params.sortOrder === 'asc'
  switch (params.sortBy) {
    case 'rating':
      orderBySql = isAsc
        ? Prisma.sql`"averageRating" ASC, "ratingCount" ASC, c.created_at ASC`
        : Prisma.sql`"averageRating" DESC, "ratingCount" DESC, c.created_at DESC`
      break
    case 'price':
      orderBySql = isAsc ? Prisma.sql`c.price ASC, c.created_at DESC` : Prisma.sql`c.price DESC, c.created_at DESC`
      break
    case 'view':
      orderBySql = isAsc ? Prisma.sql`c.view ASC, c.created_at DESC` : Prisma.sql`c.view DESC, c.created_at DESC`
      break
    case 'sold':
      orderBySql = isAsc ? Prisma.sql`c.sold ASC, c.created_at DESC` : Prisma.sql`c.sold DESC, c.created_at DESC`
      break
    case 'title':
      orderBySql = isAsc ? Prisma.sql`c.title ASC` : Prisma.sql`c.title DESC`
      break
    case 'updatedAt':
      orderBySql = isAsc ? Prisma.sql`c.updated_at ASC` : Prisma.sql`c.updated_at DESC`
      break
    case 'createdAt':
    default:
      orderBySql = isAsc ? Prisma.sql`c.created_at ASC` : Prisma.sql`c.created_at DESC`
      break
  }

  const [courses, countRes] = await Promise.all([
    client.$queryRaw<CatalogCourseRow[]>`
      SELECT 
        c.id,
        c.title,
        c.slug,
        c.image,
        c.intro_url AS "introUrl",
        c.description,
        c.price::float AS "price",
        c.old_price::float AS "oldPrice",
        UPPER(c.level::text) AS "level",
        UPPER(c.type::text) AS "type",
        UPPER(c.status::text) AS "status",
        c.sold::int AS "sold",
        c.view::int AS "view",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        c.is_destroyed AS "isDestroyed",
        CASE 
          WHEN u.id IS NOT NULL THEN json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email,
            'avatar', u.avatar,
            'role', UPPER(u.role::text)
          )
          ELSE NULL 
        END AS "author",
        CASE 
          WHEN cat.id IS NOT NULL THEN json_build_object('id', cat.id, 'name', cat.name, 'slug', cat.slug)
          ELSE NULL 
        END AS "category",
        COALESCE(r_agg.avg_rating, 0)::float AS "averageRating",
        COALESCE(r_agg.rating_count, 0)::int AS "ratingCount",
        COALESCE(l_agg.total_duration, 0)::int AS "totalDuration"
      FROM courses c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN (
        SELECT 
          course_id,
          ROUND(AVG(rate)::numeric, 1)::float AS avg_rating,
          COUNT(id)::int AS rating_count
        FROM ratings
        WHERE status = 'active'::"ERatingStatus"
        GROUP BY course_id
      ) r_agg ON c.id = r_agg.course_id
      LEFT JOIN (
        SELECT 
          l.course_id,
          COALESCE(SUM(l.duration), 0)::int AS total_duration
        FROM lessons l
        INNER JOIN chapters ch ON l.chapter_id = ch.id
        WHERE ch.is_destroyed = false
        GROUP BY l.course_id
      ) l_agg ON c.id = l_agg.course_id
      ${whereSql}
      ORDER BY ${orderBySql}
      LIMIT ${limit} OFFSET ${offset};
    `,
    client.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(c.id)::int AS count
      FROM courses c
      LEFT JOIN (
        SELECT 
          course_id,
          ROUND(AVG(rate)::numeric, 1)::float AS avg_rating,
          COUNT(id)::int AS rating_count
        FROM ratings
        WHERE status = 'active'::"ERatingStatus"
        GROUP BY course_id
      ) r_agg ON c.id = r_agg.course_id
      LEFT JOIN (
        SELECT 
          l.course_id,
          COALESCE(SUM(l.duration), 0)::int AS total_duration
        FROM lessons l
        INNER JOIN chapters ch ON l.chapter_id = ch.id
        WHERE ch.is_destroyed = false
        GROUP BY l.course_id
      ) l_agg ON c.id = l_agg.course_id
      ${whereSql}
    `
  ])

  const total = countRes[0]?.count || 0
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

