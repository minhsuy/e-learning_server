import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { isValidUUID } from '~/utils/uuid'
import { toBaseSlug } from '~/utils/ultis'

/**
 * TMDEMY — COURSE ENTITY RESOLVER SERVICE (TG-04D)
 *
 * Securely resolves course titles extracted from teacher natural-language messages
 * to verified PostgreSQL course entities owned strictly by the authenticated teacher.
 *
 * SECURITY INVARIANTS:
 * 1. STRICT MULTI-TENANT ISOLATION: Queries are strictly scoped to `author_id = teacherId`.
 * 2. NO CROSS-TEACHER LEAKAGE: Courses belonging to other teachers are never searched or exposed.
 * 3. ZERO UNVERIFIED IDS: Course identifiers must come from verified database records, never from AI.
 * 4. SAFE MATCHING: Ambiguous or non-existent titles return clear status without guessing.
 */

export type CourseResolutionStatus = 'FOUND' | 'AMBIGUOUS' | 'NOT_FOUND'

export interface ResolvedCourseEntity {
  id: string
  title: string
  slug: string
  price: number
  status: string
}

export interface CourseResolutionResult {
  status: CourseResolutionStatus
  course?: ResolvedCourseEntity
  candidates?: ResolvedCourseEntity[]
  searchTerm: string
  message?: string
}

/**
 * Strips Vietnamese diacritics / accents, converts to lowercase,
 * and strips common punctuation.
 */
export function normalizeVietnameseString(text: string): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/**
 * Strips common Vietnamese course prefixes (e.g., "khóa học", "khoa hoc", "course")
 * for cleaner entity title matching.
 */
export function stripCourseNoiseWords(text: string): string {
  const norm = normalizeVietnameseString(text)
  return norm
    .replace(/^(?:khoa hoc|khoa|course|lop hoc|lop)\s+/i, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolves a natural-language course search term against teacher-owned courses in PostgreSQL.
 */
export async function resolveCourseEntityService(
  teacherId: string,
  rawCourseName: string,
  tx?: PrismaTransactionClient
): Promise<CourseResolutionResult> {
  const searchTerm = (rawCourseName || '').trim()

  if (!searchTerm) {
    return {
      status: 'NOT_FOUND',
      searchTerm,
      message: 'Tên khóa học cần tra cứu không được để trống.'
    }
  }

  if (!teacherId || !isValidUUID(teacherId)) {
    throw new Error('Mã định danh Giảng viên không hợp lệ (Invalid UUID).')
  }

  const client = tx ?? prisma

  // 1. Fetch only courses owned by this teacher and not destroyed
  const teacherCourses = await client.course.findMany({
    where: {
      authorId: teacherId,
      isDestroyed: false
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      status: true
    }
  })

  if (!teacherCourses || teacherCourses.length === 0) {
    return {
      status: 'NOT_FOUND',
      searchTerm,
      message: 'Bạn hiện chưa có khóa học nào trong danh mục giảng dạy.'
    }
  }

  const courseEntities: ResolvedCourseEntity[] = teacherCourses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    price: Number(c.price),
    status: c.status
  }))

  const cleanSearch = stripCourseNoiseWords(searchTerm)
  const searchSlug = toBaseSlug(searchTerm)
  const searchLower = searchTerm.toLowerCase()

  // Match Stage 1: Exact Title Match (case-insensitive)
  const exactTitleMatches = courseEntities.filter(
    (c) => c.title.trim().toLowerCase() === searchLower
  )
  if (exactTitleMatches.length === 1) {
    return {
      status: 'FOUND',
      course: exactTitleMatches[0],
      searchTerm
    }
  }

  // Match Stage 2: Exact Slug Match
  const exactSlugMatches = courseEntities.filter(
    (c) => c.slug.toLowerCase() === searchSlug || c.slug.toLowerCase() === searchLower
  )
  if (exactSlugMatches.length === 1) {
    return {
      status: 'FOUND',
      course: exactSlugMatches[0],
      searchTerm
    }
  }

  // Match Stage 3: Accent-Insensitive Exact Cleaned Match
  const exactCleanMatches = courseEntities.filter(
    (c) => stripCourseNoiseWords(c.title) === cleanSearch
  )
  if (exactCleanMatches.length === 1) {
    return {
      status: 'FOUND',
      course: exactCleanMatches[0],
      searchTerm
    }
  } else if (exactCleanMatches.length > 1) {
    return {
      status: 'AMBIGUOUS',
      candidates: exactCleanMatches.slice(0, 5),
      searchTerm,
      message: 'Tìm thấy nhiều khóa học trùng tên trong danh mục của bạn.'
    }
  }

  // Match Stage 4: Substring Containment
  // Course title contains clean search, or clean search contains cleaned course title
  const substringMatches = courseEntities.filter((c) => {
    const cleanTitle = stripCourseNoiseWords(c.title)
    if (!cleanTitle || !cleanSearch) return false
    return cleanTitle.includes(cleanSearch) || cleanSearch.includes(cleanTitle)
  })

  if (substringMatches.length === 1) {
    return {
      status: 'FOUND',
      course: substringMatches[0],
      searchTerm
    }
  } else if (substringMatches.length > 1) {
    // If one candidate matches the full slug or contains significantly more tokens, prioritize
    const perfectSlug = substringMatches.filter((c) => c.slug.includes(searchSlug))
    if (perfectSlug.length === 1) {
      return {
        status: 'FOUND',
        course: perfectSlug[0],
        searchTerm
      }
    }

    return {
      status: 'AMBIGUOUS',
      candidates: substringMatches.slice(0, 5),
      searchTerm,
      message: `Tìm thấy ${substringMatches.length} khóa học có tên tương tự "${searchTerm}".`
    }
  }

  // Match Stage 5: Token Intersection (all significant tokens in search query exist in course title)
  const searchTokens = cleanSearch
    .split(/\s+/)
    .filter((token) => token.length >= 2)

  if (searchTokens.length > 0) {
    const tokenMatches = courseEntities.filter((c) => {
      const cleanTitle = stripCourseNoiseWords(c.title)
      return searchTokens.every((token) => cleanTitle.includes(token))
    })

    if (tokenMatches.length === 1) {
      return {
        status: 'FOUND',
        course: tokenMatches[0],
        searchTerm
      }
    } else if (tokenMatches.length > 1) {
      return {
        status: 'AMBIGUOUS',
        candidates: tokenMatches.slice(0, 5),
        searchTerm,
        message: `Tìm thấy ${tokenMatches.length} khóa học chứa các từ khóa bạn yêu cầu.`
      }
    }
  }

  // If no match was found
  return {
    status: 'NOT_FOUND',
    searchTerm,
    message: `Không tìm thấy khóa học nào phù hợp với "${searchTerm}" trong danh mục của bạn.`
  }
}

