import { CourseLevel, CourseStatus, CourseType } from '@prisma/client'
import {
  APPROVED_TEACHER_POOL,
  CourseBlueprint,
  Data02CourseSeedRecord,
  generateDeterministicUuidV5,
  NEW_CATEGORIES,
  createSeededRng,
  deterministicShuffle
} from './categories-data'
import { COURSES_TECH } from './courses-tech'
import { COURSES_TECH_PART2 } from './courses-tech-part2'
import { COURSES_TECH_PART3 } from './courses-tech-part3'
import { COURSES_DB } from './courses-db'
import { COURSES_DESIGN } from './courses-design'
import { COURSES_BUSINESS_MARKETING } from './courses-business-marketing'
import { COURSES_FINANCE_PROJECT } from './courses-finance-project'
import { COURSES_PRODUCTIVITY } from './courses-productivity'
import { COURSES_LANGUAGES } from './courses-languages'
import { COURSES_CREATIVE_WELLNESS } from './courses-creative-wellness'

// Aggregate all course blueprints
export const ALL_BLUEPRINTS: readonly CourseBlueprint[] = [
  ...COURSES_TECH,
  ...COURSES_TECH_PART2,
  ...COURSES_TECH_PART3,
  ...COURSES_DB,
  ...COURSES_DESIGN,
  ...COURSES_BUSINESS_MARKETING,
  ...COURSES_FINANCE_PROJECT,
  ...COURSES_PRODUCTIVITY,
  ...COURSES_LANGUAGES,
  ...COURSES_CREATIVE_WELLNESS
]

/**
 * Format a rich, multi-paragraph Vietnamese course description (250-400 words)
 * adhering strictly to TMdemy domain depth without generic filler.
 */
export function compileRichCourseDescription(bp: CourseBlueprint): string {
  const topicsList = bp.coreTopics.map((topic, idx) => `${idx + 1}. ${topic}`).join('\n')

  return `### Tổng Quan Khóa Học
${bp.leadSummary}

### Bối Cảnh Thực Tiễn & Tầm Quan Trọng
${bp.industryContext}

### Nội Dung Chuyên Môn Cốt Lõi
${topicsList}

### Dự Án Thực Chiến (Hands-on Capstone Project)
${bp.handsOnProject}

### Đối Tượng Phù Hợp & Ứng Dụng Nghề Nghiệp
Khóa học được thiết kế đặc thù dành cho: ${bp.targetAudience}
Hoàn tất chương trình, học viên sẽ được trang bị nền tảng vững vàng để: ${bp.careerApplication}`
}

/**
 * Validates blueprints and builds the complete 270 course records
 * with deterministic UUIDv5, category-stratified teacher assignment,
 * and verified status APPROVED.
 */
export function buildData02CourseDataset(): Data02CourseSeedRecord[] {
  // 1. Validate count
  if (ALL_BLUEPRINTS.length !== 270) {
    throw new Error(
      `[DATA-02] Blueprint count mismatch: expected 270, got ${ALL_BLUEPRINTS.length}`
    )
  }

  // 2. Validate category mapping
  const categoryMap = new Map<string, string>()
  for (const cat of NEW_CATEGORIES) {
    categoryMap.set(cat.slug, cat.id)
  }

  // 3. Uniqueness check on slugs and titles
  const slugSet = new Set<string>()
  const titleSet = new Set<string>()
  for (const bp of ALL_BLUEPRINTS) {
    if (slugSet.has(bp.slug)) {
      throw new Error(`[DATA-02] Duplicate blueprint slug detected: ${bp.slug}`)
    }
    slugSet.add(bp.slug)

    if (titleSet.has(bp.title)) {
      throw new Error(`[DATA-02] Duplicate blueprint title detected: ${bp.title}`)
    }
    titleSet.add(bp.title)

    if (!categoryMap.has(bp.categorySlug)) {
      throw new Error(
        `[DATA-02] Unknown categorySlug in blueprint: ${bp.categorySlug} for course ${bp.slug}`
      )
    }
  }

  // 4. Stratified teacher allocation
  // Group blueprints by categorySlug to ensure balanced teacher coverage per category
  const coursesByCategory = new Map<string, CourseBlueprint[]>()
  for (const bp of ALL_BLUEPRINTS) {
    if (!coursesByCategory.has(bp.categorySlug)) {
      coursesByCategory.set(bp.categorySlug, [])
    }
    coursesByCategory.get(bp.categorySlug)!.push(bp)
  }

  // Seeded PRNG for deterministic assignment
  const rng = createSeededRng('20261028-tmdemy-data02-seed')
  const teacherCounts: Record<string, number> = {
    [APPROVED_TEACHER_POOL[0].id]: 0,
    [APPROVED_TEACHER_POOL[1].id]: 0,
    [APPROVED_TEACHER_POOL[2].id]: 0
  }

  const assignedRecords: Data02CourseSeedRecord[] = []

  // Global round-robin index offset across categories
  let teacherPointer = 0
  const teacherIds = APPROVED_TEACHER_POOL.map((t) => t.id)

  for (const [catSlug, blueprints] of coursesByCategory.entries()) {
    const categoryId = categoryMap.get(catSlug)!
    // Deterministically shuffle within category
    const shuffled = deterministicShuffle(blueprints, rng)

    for (const bp of shuffled) {
      // Find candidate teachers that haven't hit their 90 quota
      // Prefer the round-robin pointer if eligible
      let chosenTeacherId = teacherIds[teacherPointer % teacherIds.length]
      if (teacherCounts[chosenTeacherId] >= 90) {
        // Find teacher with lowest count < 90
        const eligible = teacherIds
          .filter((id) => teacherCounts[id] < 90)
          .sort((a, b) => teacherCounts[a] - teacherCounts[b])
        if (eligible.length === 0) {
          throw new Error('[DATA-02] Teacher pool exhausted before all courses assigned')
        }
        chosenTeacherId = eligible[0]
      }

      teacherCounts[chosenTeacherId]++
      teacherPointer++

      const courseId = generateDeterministicUuidV5(`seed-course-v2:${bp.slug}`)
      const richDescription = compileRichCourseDescription(bp)

      const teacher = APPROVED_TEACHER_POOL.find((t) => t.id === chosenTeacherId)!
      const cat = NEW_CATEGORIES.find((c) => c.slug === catSlug)!

      assignedRecords.push({
        id: courseId,
        title: bp.title,
        slug: bp.slug,
        description: richDescription,
        price: bp.price,
        oldPrice: bp.oldPrice,
        type: bp.price === 0 ? CourseType.FREE : CourseType.PAID,
        status: CourseStatus.APPROVED,
        level: bp.level,
        view: 0,
        sold: 0,
        image: `https://images.unsplash.com/photo-course-${bp.slug.substring(0, 18)}?auto=format&fit=crop&w=800&q=80`,
        introUrl: '',
        requirements: [...bp.requirements],
        benefits: [...bp.benefits],
        techniques: [...bp.techniques],
        documents: [...bp.documents],
        categoryId,
        categorySlug: catSlug,
        categoryName: cat.name,
        authorId: chosenTeacherId,
        authorUsername: teacher.username
      })
    }
  }

  // 5. Final Quota Checks
  for (const teacher of APPROVED_TEACHER_POOL) {
    const count = teacherCounts[teacher.id]
    if (count !== 90) {
      throw new Error(
        `[DATA-02] Teacher quota violation for ${teacher.username} (${teacher.id}): expected 90, got ${count}`
      )
    }
  }

  if (assignedRecords.length !== 270) {
    throw new Error(
      `[DATA-02] Record count mismatch: expected 270, got ${assignedRecords.length}`
    )
  }

  return assignedRecords
}
