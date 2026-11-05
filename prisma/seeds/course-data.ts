import crypto from 'crypto'
import { CourseLevel, CourseStatus, CourseType } from '@prisma/client'
import { WEB_COURSES } from './web-courses'
import { PROGRAMMING_COURSES } from './programming-courses'
import { DATA_COURSES } from './data-courses'
import { AI_COURSES } from './ai-courses'

// ==========================================
// CONSTANTS & IDS
// ==========================================

export const TEACHER_IDS = {
  TEACHER_02: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
  TEACHER_CNTT: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
  NEW_USERNAME123: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
  GIAOVIENTRUNGQUOC: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb'
} as const

export const CATEGORY_IDS = {
  WEB_DEV: 'fc5d66a4-7468-5328-a6a9-16c3a9e49881', // Lập trình web
  PROGRAMMING: 'dddf433f-347b-5024-b70d-2398aaed3660', // Lập trình
  DATA_SCIENCE: '2ec199fc-a7e0-531e-b79d-14b479f74853', // Khoa học dữ liệuu
  AI: '084d6053-7823-4cb8-a7e7-7dba3e6a78bf' // AI
} as const

// Stable curated high-resolution tech image URLs from Unsplash
export const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80',
  'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=1200&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80'
]

export const DEFAULT_INTRO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

/**
 * Deterministic UUIDv5 generator using RFC 4122
 */
const SEED_COURSE_NAMESPACE = '7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c'

export function generateDeterministicUuid(seedKey: string): string {
  const nsClean = SEED_COURSE_NAMESPACE.replace(/-/g, '')
  const nsBuffer = Buffer.from(nsClean, 'hex')
  const nameBuffer = Buffer.from(seedKey, 'utf8')
  const hash = crypto.createHash('sha1').update(nsBuffer).update(nameBuffer).digest()

  const bytes = Buffer.alloc(16)
  hash.copy(bytes, 0, 0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50 // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant RFC 4122

  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export interface SeedCourseRecord {
  id: string
  title: string
  slug: string
  description: string
  price: number
  oldPrice: number
  type: CourseType
  status: CourseStatus
  level: CourseLevel
  view: number
  sold: number
  image: string
  introUrl: string
  requirements: string[]
  benefits: string[]
  techniques: string[]
  documents: string[]
  categoryId: string
  authorId: string
}

/**
 * Generates all 360 deterministic course records.
 * 
 * Distribution:
 * - 4 Categories: exactly 90 courses each (90 * 4 = 360)
 * - 4 Teachers: exactly 90 courses each (90 * 4 = 360)
 * - Status: 328 APPROVED (82/cat), 24 PENDING (6/cat), 8 REJECTED (2/cat)
 * - Types: 40 FREE (10/cat), 320 PAID (80/cat)
 */
export function generateSeedCourses(): SeedCourseRecord[] {
  const categoriesConfig = [
    {
      categoryId: CATEGORY_IDS.WEB_DEV,
      courses: WEB_COURSES,
      // Teacher allocation for 90 courses: T1: 23, T2: 23, T3: 22, T4: 22 (Sum = 90)
      teacherDistribution: [
        { teacherId: TEACHER_IDS.TEACHER_02, count: 23 },
        { teacherId: TEACHER_IDS.TEACHER_CNTT, count: 23 },
        { teacherId: TEACHER_IDS.NEW_USERNAME123, count: 22 },
        { teacherId: TEACHER_IDS.GIAOVIENTRUNGQUOC, count: 22 }
      ]
    },
    {
      categoryId: CATEGORY_IDS.PROGRAMMING,
      courses: PROGRAMMING_COURSES,
      // Teacher allocation for 90 courses: T1: 22, T2: 23, T3: 23, T4: 22 (Sum = 90)
      teacherDistribution: [
        { teacherId: TEACHER_IDS.TEACHER_02, count: 22 },
        { teacherId: TEACHER_IDS.TEACHER_CNTT, count: 23 },
        { teacherId: TEACHER_IDS.NEW_USERNAME123, count: 23 },
        { teacherId: TEACHER_IDS.GIAOVIENTRUNGQUOC, count: 22 }
      ]
    },
    {
      categoryId: CATEGORY_IDS.DATA_SCIENCE,
      courses: DATA_COURSES,
      // Teacher allocation for 90 courses: T1: 22, T2: 22, T3: 23, T4: 23 (Sum = 90)
      teacherDistribution: [
        { teacherId: TEACHER_IDS.TEACHER_02, count: 22 },
        { teacherId: TEACHER_IDS.TEACHER_CNTT, count: 22 },
        { teacherId: TEACHER_IDS.NEW_USERNAME123, count: 23 },
        { teacherId: TEACHER_IDS.GIAOVIENTRUNGQUOC, count: 23 }
      ]
    },
    {
      categoryId: CATEGORY_IDS.AI,
      courses: AI_COURSES,
      // Teacher allocation for 90 courses: T1: 23, T2: 22, T3: 22, T4: 23 (Sum = 90)
      teacherDistribution: [
        { teacherId: TEACHER_IDS.TEACHER_02, count: 23 },
        { teacherId: TEACHER_IDS.TEACHER_CNTT, count: 22 },
        { teacherId: TEACHER_IDS.NEW_USERNAME123, count: 22 },
        { teacherId: TEACHER_IDS.GIAOVIENTRUNGQUOC, count: 23 }
      ]
    }
  ]

  const records: SeedCourseRecord[] = []

  categoriesConfig.forEach((catCfg, catIdx) => {
    if (catCfg.courses.length !== 90) {
      throw new Error(`Category index ${catIdx} must have exactly 90 courses, got ${catCfg.courses.length}`)
    }

    // Build the teacher list for this category
    const teacherAssignments: string[] = []
    catCfg.teacherDistribution.forEach((dist) => {
      for (let i = 0; i < dist.count; i++) {
        teacherAssignments.push(dist.teacherId)
      }
    })

    if (teacherAssignments.length !== 90) {
      throw new Error(`Teacher assignment for category ${catIdx} must equal 90, got ${teacherAssignments.length}`)
    }

    catCfg.courses.forEach((raw, idx) => {
      const authorId = teacherAssignments[idx]
      const categoryId = catCfg.categoryId

      // Status distribution per category of 90:
      // 0..81 -> APPROVED (82)
      // 82..87 -> PENDING (6)
      // 88..89 -> REJECTED (2)
      let status: CourseStatus = CourseStatus.APPROVED
      if (idx >= 88) {
        status = CourseStatus.REJECTED
      } else if (idx >= 82) {
        status = CourseStatus.PENDING
      }

      // Type & Price normalization
      const isFree = raw.price === 0
      const type = isFree ? CourseType.FREE : CourseType.PAID
      const price = isFree ? 0 : raw.price
      const oldPrice = isFree ? 0 : Math.max(raw.oldPrice, raw.price)

      // Deterministic natural views and sold numbers
      let view = 0
      let sold = 0
      if (status === CourseStatus.REJECTED) {
        view = 12 + (idx % 15)
        sold = 0
      } else if (status === CourseStatus.PENDING) {
        view = 35 + ((idx * 7) % 40)
        sold = 0
      } else {
        if (isFree) {
          view = 3200 + ((idx * 379 + catIdx * 113) % 18000)
          sold = Math.floor(view * 0.18)
        } else {
          view = 850 + ((idx * 263 + catIdx * 149) % 9500)
          const conversionRate = 0.04 + ((idx % 5) * 0.01)
          sold = Math.floor(view * conversionRate)
        }
      }

      // Curated image
      const image = CURATED_IMAGES[(catIdx * 25 + idx) % CURATED_IMAGES.length]

      // Requirements and benefits
      const requirements = [
        'Máy tính cá nhân có kết nối Internet ổn định',
        'Cài đặt môi trường phát triển (VS Code / Python / Node.js)',
        'Tư duy logic và tinh thần chủ động thực hành dự án'
      ]

      const benefits = [
        'Nắm vững kiến thức chuyên sâu và thực chiến ngay trong công việc',
        'Sở hữu mã nguồn dự án hoàn chỉnh để đưa vào Portfolio cá nhân',
        'Cấp chứng chỉ hoàn thành khóa học có giá trị từ TMDEMY',
        'Hỗ trợ giải đáp thắc mắc chuyên môn trong quá trình học tập'
      ]

      const documents = [
        'Slide bài giảng chi tiết và giáo trình tóm tắt kiến thức cốt lõi',
        'Kho mã nguồn bài tập và tài liệu tham khảo chính thức trên GitHub'
      ]

      // Deterministic UUID
      const id = generateDeterministicUuid(`seed-course:${raw.slug}`)

      records.push({
        id,
        title: raw.title,
        slug: raw.slug,
        description: raw.desc,
        price,
        oldPrice,
        type,
        status,
        level: raw.level,
        view,
        sold,
        image,
        introUrl: DEFAULT_INTRO_URL,
        requirements,
        benefits,
        techniques: raw.techs,
        documents,
        categoryId,
        authorId
      })
    })
  })

  return records
}
