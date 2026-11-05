import crypto from 'crypto'
import { CourseLevel, CourseStatus, CourseType } from '@prisma/client'

// ==========================================
// 1. DETERMINISTIC UUIDv5 & PRNG UTILITIES
// ==========================================

export const DATA02_SEED_NAMESPACE = '7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c'
export const DATA02_DATASET_VERSION = 'DATA-02-v1.0.0-2026-10-28'
export const TEACHER_ASSIGNMENT_SEED = 'TMDEMY-DATA-02-TEACHER-ASSIGNMENT-SEED-2026'

/**
 * Generates an RFC 4122 compliant deterministic UUIDv5 from a logical key.
 * Never depends on array indices or insertion order.
 */
export function generateDeterministicUuidV5(logicalKey: string): string {
  const nsClean = DATA02_SEED_NAMESPACE.replace(/-/g, '')
  const nsBuffer = Buffer.from(nsClean, 'hex')
  const nameBuffer = Buffer.from(logicalKey, 'utf8')
  const hash = crypto.createHash('sha1').update(nsBuffer).update(nameBuffer).digest()

  const bytes = Buffer.alloc(16)
  hash.copy(bytes, 0, 0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50 // Version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // RFC 4122 Variant

  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Pure deterministic Mulberry32 PRNG seeded from SHA-256 of seedString.
 */
export function createSeededRng(seedString: string): () => number {
  const hash = crypto.createHash('sha256').update(seedString, 'utf8').digest()
  let state = hash.readUInt32LE(0)
  return function nextRandom(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministic Fisher-Yates shuffle using a provided PRNG function.
 */
export function deterministicShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

// ==========================================
// 2. APPROVED ELIGIBLE TEACHER POOL
// ==========================================

export interface ApprovedTeacherSpec {
  key: 'TEACHER_02' | 'TEACHER_CNTT' | 'GIAOVIENTRUNGQUOC'
  id: string
  expectedUsername: string
  targetNewCourses: number
}

export const APPROVED_ELIGIBLE_TEACHERS: readonly ApprovedTeacherSpec[] = [
  {
    key: 'TEACHER_02',
    id: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    expectedUsername: 'teacher02',
    targetNewCourses: 90
  },
  {
    key: 'TEACHER_CNTT',
    id: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    expectedUsername: 'teacher_cntt',
    targetNewCourses: 90
  },
  {
    key: 'GIAOVIENTRUNGQUOC',
    id: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb',
    expectedUsername: 'giaovientrungquoc',
    targetNewCourses: 90
  }
] as const

export const APPROVED_TEACHER_POOL = APPROVED_ELIGIBLE_TEACHERS.map((t) => ({
  id: t.id,
  username: t.expectedUsername,
  targetNewCourses: t.targetNewCourses
}))

export const CATEGORY_CREATOR_ADMIN_ID = '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8' // admin_tmdemy

// ==========================================
// 3. EXISTING CATEGORY CLEANUP SPECIFICATIONS
// ==========================================

export interface CategoryNormalizationSpec {
  id: string
  slug: string
  expectedPreviousName: string
  newName: string
  expectedPreviousDescription: string
  newDescription: string
  reason: string
}

export const APPROVED_CATEGORY_NORMALIZATIONS: readonly CategoryNormalizationSpec[] = [
  {
    id: '2ec199fc-a7e0-531e-b79d-14b479f74853',
    slug: 'khoa-hoc-du-lieu',
    expectedPreviousName: 'Khoa học dữ liệuu',
    newName: 'Khoa học dữ liệu',
    expectedPreviousDescription: 'Danh mục các khóa học về Data Science, Machine Learning',
    newDescription: 'Danh mục các khóa học về Data Science, Machine Learning',
    reason: 'Fix trailing duplicate character typo in display name ("Khoa học dữ liệuu" -> "Khoa học dữ liệu")'
  },
  {
    id: '084d6053-7823-4cb8-a7e7-7dba3e6a78bf',
    slug: 'ai-course',
    expectedPreviousName: 'ai course',
    newName: 'Trí tuệ nhân tạo (AI)',
    expectedPreviousDescription: 'Danh mục các khóa học về AI',
    newDescription: 'Danh mục các khóa học về Trí tuệ nhân tạo (AI), Học máy và Học sâu',
    reason: 'Standardize lowercase English display name ("ai course" -> "Trí tuệ nhân tạo (AI)") while preserving slug'
  },
  {
    id: 'dddf433f-347b-5024-b70d-2398aaed3660',
    slug: 'lap-trinh',
    expectedPreviousName: 'Lập trình',
    newName: 'Lập trình',
    expectedPreviousDescription: 'Danh mục các khóa học về lập trình web',
    newDescription: 'Danh mục các khóa học ngôn ngữ lập trình, thuật toán và phát triển phần mềm',
    reason: 'Fix copy-pasted web development description on general Programming category'
  }
] as const

export const EXISTING_CATEGORY_NORMALIZATIONS = APPROVED_CATEGORY_NORMALIZATIONS

export interface TestCategorySoftDeleteSpec {
  id: string
  expectedName: string
  expectedSlug: string
  expectedAssociatedCourseId: string
  expectedAssociatedCourseTitle: string
  provenance: string
}

export const CONFIRMED_TEST_CATEGORIES_TO_SOFT_DELETE: readonly TestCategorySoftDeleteSpec[] = [
  {
    id: '9d32771f-67e8-4b08-864d-7cbfea0208f3',
    expectedName: 'Step 5 Category 1792845835347',
    expectedSlug: 'step-5-category-1792845835347',
    expectedAssociatedCourseId: '9ac56f5c-429b-4163-b8eb-5d0b4f6e8a28',
    expectedAssociatedCourseTitle: 'Step 5 Course for Coding Exercises',
    provenance: 'scripts/test_step5_coding_exercise_publish_gamification.ts run 1792845835347'
  },
  {
    id: '030a3e73-7ed7-4269-b8fd-479110c1fda4',
    expectedName: 'Step 5 Category 1792845863604',
    expectedSlug: 'step-5-category-1792845863604',
    expectedAssociatedCourseId: '657f29e4-0ae5-47e5-b8ca-e0883650b80a',
    expectedAssociatedCourseTitle: 'Step 5 Course for Coding Exercises',
    provenance: 'scripts/test_step5_coding_exercise_publish_gamification.ts run 1792845863604'
  },
  {
    id: '3f904a91-88b0-42ff-95ad-371a432d0ee7',
    expectedName: 'Step 5 Category 1792845903273',
    expectedSlug: 'step-5-category-1792845903273',
    expectedAssociatedCourseId: 'e3ca84d4-b8f0-4afa-be41-4883328b873f',
    expectedAssociatedCourseTitle: 'Step 5 Course for Coding Exercises',
    provenance: 'scripts/test_step5_coding_exercise_publish_gamification.ts run 1792845903273'
  },
  {
    id: '7b4599cf-843d-4010-941a-6380c012df16',
    expectedName: 'Step 5 Category 1792845942349',
    expectedSlug: 'step-5-category-1792845942349',
    expectedAssociatedCourseId: 'dba8bf25-ab65-4211-a692-836e5c40badb',
    expectedAssociatedCourseTitle: 'Step 5 Course for Coding Exercises',
    provenance: 'scripts/test_step5_coding_exercise_publish_gamification.ts run 1792845942349'
  },
  {
    id: 'eddb30e9-ff76-4c00-ba39-d4a1b96678a2',
    expectedName: 'Step 6 Category 1792897579436',
    expectedSlug: 'step-6-cat-1792897579436',
    expectedAssociatedCourseId: '590ce289-2f34-445c-9030-de54aee09c54',
    expectedAssociatedCourseTitle: 'Step 6 Course: Algorithms',
    provenance: 'scripts/test_step6_coding_completion_progress.ts run 1792897579436'
  },
  {
    id: 'b69ff7cb-f9d8-47d8-9d11-909b5b4a30fb',
    expectedName: 'Step 6 Category 1792897656271',
    expectedSlug: 'step-6-cat-1792897656271',
    expectedAssociatedCourseId: '9805d55c-f896-4ff8-8a1e-b423b49ca9b0',
    expectedAssociatedCourseTitle: 'Step 6 Course: Algorithms',
    provenance: 'scripts/test_step6_coding_completion_progress.ts run 1792897656271'
  },
  {
    id: 'b6243dac-63cc-4775-98a5-03b3b58af153',
    expectedName: 'Step 6 Category 1792897801842',
    expectedSlug: 'step-6-cat-1792897801842',
    expectedAssociatedCourseId: '16ae4cc8-0dd6-49c8-98a2-d57cf2c0b0d5',
    expectedAssociatedCourseTitle: 'Step 6 Course: Algorithms',
    provenance: 'scripts/test_step6_coding_completion_progress.ts run 1792897801842'
  }
] as const

// ==========================================
// 4. 16 NEW MULTI-DOMAIN CATEGORIES (DATA-02)
// ==========================================

export interface NewCategorySeedSpec {
  code: string
  id: string
  name: string
  slug: string
  domain: string
  description: string
  targetNewCourses: number
  levelQuota: {
    BEGINNER: number
    INTERMEDIATE: number
    ADVANCED: number
  }
  typeQuota: {
    FREE: number
    PAID: number
  }
  teacherQuota: {
    TEACHER_02: number
    TEACHER_CNTT: number
    GIAOVIENTRUNGQUOC: number
  }
  thumbnails: readonly string[]
}

const RAW_NEW_CATEGORIES: Array<Omit<NewCategorySeedSpec, 'id'>> = [
  {
    code: 'CAT-05',
    name: 'Phát triển ứng dụng di động',
    slug: 'phat-trien-ung-dung-di-dong',
    domain: 'Technology',
    description: 'Xây dựng ứng dụng di động đa nền tảng và native trên iOS, Android với Flutter, React Native, SwiftUI và Kotlin.',
    targetNewCourses: 18,
    levelQuota: { BEGINNER: 6, INTERMEDIATE: 8, ADVANCED: 4 },
    typeQuota: { FREE: 2, PAID: 16 },
    teacherQuota: { TEACHER_02: 6, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80',
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&q=80',
      'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-06',
    name: 'An ninh mạng & Bảo mật',
    slug: 'an-ninh-mang-va-bao-mat',
    domain: 'Technology',
    description: 'Bảo mật hệ thống, kiểm thử xâm nhập (Pentest), SOC, bảo mật ứng dụng web, đám mây và phòng chống mã độc.',
    targetNewCourses: 16,
    levelQuota: { BEGINNER: 5, INTERMEDIATE: 7, ADVANCED: 4 },
    typeQuota: { FREE: 2, PAID: 14 },
    teacherQuota: { TEACHER_02: 5, TEACHER_CNTT: 5, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-07',
    name: 'Điện toán đám mây & DevOps',
    slug: 'dien-toan-dam-may-va-devops',
    domain: 'Technology',
    description: 'Kiến trúc đám mây AWS, Azure, GCP, tự động hóa CI/CD, Kubernetes, Terraform, giám sát hệ thống và SRE.',
    targetNewCourses: 18,
    levelQuota: { BEGINNER: 5, INTERMEDIATE: 8, ADVANCED: 5 },
    typeQuota: { FREE: 2, PAID: 16 },
    teacherQuota: { TEACHER_02: 6, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80',
      'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-08',
    name: 'Cơ sở dữ liệu & Kỹ thuật dữ liệu',
    slug: 'co-so-du-lieu-va-ky-thuat-du-lieu',
    domain: 'Data & AI',
    description: 'Thiết kế cơ sở dữ liệu SQL/NoSQL, tối ưu truy vấn, xây dựng Data Pipeline, Apache Spark, Kafka và Lakehouse.',
    targetNewCourses: 16,
    levelQuota: { BEGINNER: 5, INTERMEDIATE: 7, ADVANCED: 4 },
    typeQuota: { FREE: 2, PAID: 14 },
    teacherQuota: { TEACHER_02: 5, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 5 },
    thumbnails: [
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-09',
    name: 'Thiết kế UI/UX & Sản phẩm số',
    slug: 'thiet-ke-ui-ux-va-san-pham-so',
    domain: 'Design',
    description: 'Nghiên cứu người dùng (UX Research), thiết kế giao diện trên Figma, xây dựng Design System và Prototyping.',
    targetNewCourses: 20,
    levelQuota: { BEGINNER: 8, INTERMEDIATE: 8, ADVANCED: 4 },
    typeQuota: { FREE: 2, PAID: 18 },
    teacherQuota: { TEACHER_02: 7, TEACHER_CNTT: 7, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80',
      'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1200&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-10',
    name: 'Thiết kế đồ họa & Truyền thông thị giác',
    slug: 'thiet-ke-do-hoa',
    domain: 'Design',
    description: 'Thiết kế nhận diện thương hiệu, ấn phẩm truyền thông, minh họa kỹ thuật số với Photoshop, Illustrator, InDesign.',
    targetNewCourses: 16,
    levelQuota: { BEGINNER: 7, INTERMEDIATE: 6, ADVANCED: 3 },
    typeQuota: { FREE: 2, PAID: 14 },
    teacherQuota: { TEACHER_02: 5, TEACHER_CNTT: 5, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&q=80',
      'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=1200&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-11',
    name: 'Digital Marketing & Tăng trưởng',
    slug: 'digital-marketing',
    domain: 'Business & Marketing',
    description: 'Chiến lược tiếp thị số đa kênh, SEO, Google Ads, Facebook/TikTok Ads, Content Marketing, CRM và Growth Hacking.',
    targetNewCourses: 22,
    levelQuota: { BEGINNER: 9, INTERMEDIATE: 9, ADVANCED: 4 },
    typeQuota: { FREE: 2, PAID: 20 },
    teacherQuota: { TEACHER_02: 7, TEACHER_CNTT: 7, GIAOVIENTRUNGQUOC: 8 },
    thumbnails: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
      'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=1200&q=80',
      'https://images.unsplash.com/photo-1557838923-2985c318be48?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-12',
    name: 'Quản trị kinh doanh & Khởi nghiệp',
    slug: 'quan-tri-kinh-doanh-va-khoi-nghiep',
    domain: 'Business & Marketing',
    description: 'Chiến lược kinh doanh, phát triển sản phẩm, xây dựng mô hình khởi nghiệp, quản trị vận hành và lãnh đạo đội ngũ.',
    targetNewCourses: 20,
    levelQuota: { BEGINNER: 8, INTERMEDIATE: 8, ADVANCED: 4 },
    typeQuota: { FREE: 2, PAID: 18 },
    teacherQuota: { TEACHER_02: 7, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 7 },
    thumbnails: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-13',
    name: 'Tài chính, Kế toán & Đầu tư',
    slug: 'tai-chinh-ke-toan-va-dau-tu',
    domain: 'Finance & Business',
    description: 'Phân tích báo cáo tài chính doanh nghiệp, kế toán thực hành, lập mô hình tài chính (Financial Modeling) và đầu tư.',
    targetNewCourses: 18,
    levelQuota: { BEGINNER: 7, INTERMEDIATE: 7, ADVANCED: 4 },
    typeQuota: { FREE: 2, PAID: 16 },
    teacherQuota: { TEACHER_02: 6, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80',
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-14',
    name: 'Quản lý dự án & Vận hành Agile',
    slug: 'quan-ly-du-an-va-van-hanh',
    domain: 'Business & Operations',
    description: 'Quản trị dự án chuyên nghiệp theo chuẩn PMP, Agile, Scrum, Kanban, quản lý rủi ro với Jira và Confluence.',
    targetNewCourses: 16,
    levelQuota: { BEGINNER: 6, INTERMEDIATE: 7, ADVANCED: 3 },
    typeQuota: { FREE: 2, PAID: 14 },
    teacherQuota: { TEACHER_02: 5, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 5 },
    thumbnails: [
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&q=80',
      'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=1200&q=80',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-15',
    name: 'Tin học văn phòng & Tự động hóa',
    slug: 'tin-hoc-van-phong-va-tu-dong-hoa',
    domain: 'Productivity',
    description: 'Làm chủ Excel nâng cao, Google Sheets, Word, PowerPoint, VBA, Power Automate và ứng dụng AI tối ưu công việc.',
    targetNewCourses: 18,
    levelQuota: { BEGINNER: 8, INTERMEDIATE: 7, ADVANCED: 3 },
    typeQuota: { FREE: 2, PAID: 16 },
    teacherQuota: { TEACHER_02: 6, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-16',
    name: 'Phát triển bản thân & Kỹ năng mềm',
    slug: 'phat-trien-ban-than-va-ky-nang-mem',
    domain: 'Personal Growth',
    description: 'Kỹ năng giao tiếp, thuyết trình trước đám đông, tư duy phản biện, đàm phán, quản lý thời gian và trí tuệ cảm xúc.',
    targetNewCourses: 18,
    levelQuota: { BEGINNER: 9, INTERMEDIATE: 7, ADVANCED: 2 },
    typeQuota: { FREE: 2, PAID: 16 },
    teacherQuota: { TEACHER_02: 6, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 6 },
    thumbnails: [
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-17',
    name: 'Ngoại ngữ ứng dụng & Giao tiếp quốc tế',
    slug: 'ngoai-ngu-ung-dung',
    domain: 'Languages',
    description: 'Tiếng Anh thương mại, luyện thi IELTS/TOEIC, tiếng Nhật, tiếng Hàn, tiếng Trung giao tiếp trong môi trường làm việc.',
    targetNewCourses: 20,
    levelQuota: { BEGINNER: 9, INTERMEDIATE: 8, ADVANCED: 3 },
    typeQuota: { FREE: 2, PAID: 18 },
    teacherQuota: { TEACHER_02: 7, TEACHER_CNTT: 6, GIAOVIENTRUNGQUOC: 7 },
    thumbnails: [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-18',
    name: 'Nhiếp ảnh, Dựng phim & Sáng tạo nội dung',
    slug: 'nhiep-anh-va-dung-phim',
    domain: 'Creative Media',
    description: 'Kỹ thuật nhiếp ảnh, quay dựng video chuyên nghiệp với Premiere Pro, CapCut, DaVinci Resolve và After Effects.',
    targetNewCourses: 14,
    levelQuota: { BEGINNER: 6, INTERMEDIATE: 6, ADVANCED: 2 },
    typeQuota: { FREE: 2, PAID: 12 },
    teacherQuota: { TEACHER_02: 5, TEACHER_CNTT: 5, GIAOVIENTRUNGQUOC: 4 },
    thumbnails: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-19',
    name: 'Âm nhạc & Nghệ thuật sáng tạo',
    slug: 'am-nhac-va-nghe-thuat-sang-tao',
    domain: 'Creative Media',
    description: 'Nhạc lý ứng dụng, đệm hát Guitar, Piano, sản xuất âm nhạc (Music Production), hòa âm phối khí và luyện thanh.',
    targetNewCourses: 10,
    levelQuota: { BEGINNER: 5, INTERMEDIATE: 4, ADVANCED: 1 },
    typeQuota: { FREE: 2, PAID: 8 },
    teacherQuota: { TEACHER_02: 3, TEACHER_CNTT: 4, GIAOVIENTRUNGQUOC: 3 },
    thumbnails: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
      'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=1200&q=80'
    ]
  },
  {
    code: 'CAT-20',
    name: 'Sức khỏe, Thể chất & Lối sống',
    slug: 'suc-khoe-the-chat-va-loi-song',
    domain: 'Lifestyle & Wellness',
    description: 'Dinh dưỡng khoa học, Yoga phục hồi, huấn luyện thể lực cá nhân, chăm sóc sức khỏe tinh thần và công thái học.',
    targetNewCourses: 10,
    levelQuota: { BEGINNER: 5, INTERMEDIATE: 4, ADVANCED: 1 },
    typeQuota: { FREE: 2, PAID: 8 },
    teacherQuota: { TEACHER_02: 4, TEACHER_CNTT: 3, GIAOVIENTRUNGQUOC: 3 },
    thumbnails: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80'
    ]
  }
]

export const NEW_CATEGORIES_DATA02: readonly NewCategorySeedSpec[] = RAW_NEW_CATEGORIES.map((cat) => ({
  ...cat,
  id: generateDeterministicUuidV5(`seed-category:${cat.slug}`)
}))

export const NEW_CATEGORIES = NEW_CATEGORIES_DATA02

// ==========================================
// 5. COURSE BLUEPRINT & RECORD INTERFACES
// ==========================================

export interface CourseBlueprint {
  title: string
  slug: string
  categorySlug: string
  level: CourseLevel
  price: number
  oldPrice: number
  leadSummary: string
  industryContext: string
  coreTopics: [string, string, string, string]
  handsOnProject: string
  targetAudience: string
  careerApplication: string
  requirements: string[]
  benefits: string[]
  techniques: string[]
  documents: string[]
}

export interface Data02CourseSeedRecord {
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
  categorySlug: string
  categoryName: string
  authorId: string
  authorUsername: string
}

