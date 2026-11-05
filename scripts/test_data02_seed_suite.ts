import { prisma } from '../src/config/prisma'
import {
  NEW_CATEGORIES_DATA02,
  APPROVED_CATEGORY_NORMALIZATIONS,
  CONFIRMED_TEST_CATEGORIES_TO_SOFT_DELETE,
  APPROVED_TEACHER_POOL,
  CATEGORY_CREATOR_ADMIN_ID
} from '../prisma/seeds/data02/categories-data'
import { buildData02CourseDataset } from '../prisma/seeds/data02/dataset-builder'

interface TestResult {
  suite: string
  name: string
  passed: boolean
  message?: string
}

const results: TestResult[] = []

function assert(condition: boolean, suite: string, name: string, failureMessage?: string): void {
  if (condition) {
    results.push({ suite, name, passed: true })
    console.log(`  ✓ [PASS] ${suite} -> ${name}`)
  } else {
    results.push({ suite, name, passed: false, message: failureMessage })
    console.error(`  ✗ [FAIL] ${suite} -> ${name}: ${failureMessage}`)
  }
}

async function runTests(): Promise<void> {
  console.log('====================================================')
  console.log('       DATA-02: AUTOMATED VERIFICATION TEST SUITE')
  console.log('====================================================\n')

  // ----------------------------------------------------
  // SUITE 1: CATEGORY INTEGRITY & CLEANUP AUDIT
  // ----------------------------------------------------
  console.log('--- SUITE 1: CATEGORY INTEGRITY & CLEANUP AUDIT ---')

  const totalCategories = await prisma.category.count()
  const activeCategories = await prisma.category.count({ where: { isDestroyed: false } })
  const destroyedCategories = await prisma.category.count({ where: { isDestroyed: true } })

  assert(
    totalCategories === 30,
    'Suite 1: Category Totals',
    'Total categories must be exactly 30',
    `Expected 30, got ${totalCategories}`
  )
  assert(
    activeCategories === 22,
    'Suite 1: Category Totals',
    'Active categories must be exactly 22',
    `Expected 22, got ${activeCategories}`
  )
  assert(
    destroyedCategories === 8,
    'Suite 1: Category Totals',
    'Soft-deleted categories must be exactly 8',
    `Expected 8, got ${destroyedCategories}`
  )

  // Verify 16 new categories
  for (const cat of NEW_CATEGORIES_DATA02) {
    const dbCat = await prisma.category.findUnique({ where: { id: cat.id } })
    assert(
      dbCat !== null && dbCat.name === cat.name && dbCat.slug === cat.slug && !dbCat.isDestroyed,
      'Suite 1: New Categories',
      `Category [${cat.code}] "${cat.name}" exists and is active`,
      `Mismatch for category ${cat.id}: ${JSON.stringify(dbCat)}`
    )
    assert(
      dbCat?.createdById === CATEGORY_CREATOR_ADMIN_ID,
      'Suite 1: Category Admin Attribution',
      `Category [${cat.code}] createdById is admin_tmdemy`,
      `Expected ${CATEGORY_CREATOR_ADMIN_ID}, got ${dbCat?.createdById}`
    )
  }

  // Verify 3 normalized categories
  for (const norm of APPROVED_CATEGORY_NORMALIZATIONS) {
    const dbCat = await prisma.category.findUnique({ where: { id: norm.id } })
    assert(
      dbCat !== null && dbCat.name === norm.newName && dbCat.description === norm.newDescription,
      'Suite 1: Category Normalization',
      `Normalized category "${norm.newName}" has correct name and description`,
      `Mismatch for normalized category ${norm.id}: ${JSON.stringify(dbCat)}`
    )
  }

  // Verify 7 soft-deleted test categories
  for (const testCat of CONFIRMED_TEST_CATEGORIES_TO_SOFT_DELETE) {
    const dbCat = await prisma.category.findUnique({ where: { id: testCat.id } })
    assert(
      dbCat !== null && dbCat.isDestroyed === true,
      'Suite 1: Test Category Soft-Delete',
      `Test category "${testCat.expectedName}" is soft-deleted`,
      `Mismatch for test category ${testCat.id}: isDestroyed=${dbCat?.isDestroyed}`
    )
  }

  // ----------------------------------------------------
  // SUITE 2: COURSE DATASET POST-EXECUTION METRICS
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: COURSE DATASET POST-EXECUTION METRICS ---')

  const totalCourses = await prisma.course.count()
  const activeCourses = await prisma.course.count({ where: { isDestroyed: false } })
  const approvedCourses = await prisma.course.count({ where: { status: 'APPROVED' } })
  const pendingCourses = await prisma.course.count({ where: { status: 'PENDING' } })
  const rejectedCourses = await prisma.course.count({ where: { status: 'REJECTED' } })

  assert(
    totalCourses === 648,
    'Suite 2: Course Totals',
    'Total courses in database must be exactly 648',
    `Expected 648, got ${totalCourses}`
  )
  assert(
    activeCourses === 647,
    'Suite 2: Course Totals',
    'Active courses must be exactly 647',
    `Expected 647, got ${activeCourses}`
  )
  assert(
    approvedCourses === 610,
    'Suite 2: Course Totals',
    'Approved courses must be exactly 610',
    `Expected 610, got ${approvedCourses}`
  )
  assert(
    pendingCourses === 30,
    'Suite 2: Course Totals',
    'Pending courses remain unchanged at 30',
    `Expected 30, got ${pendingCourses}`
  )
  assert(
    rejectedCourses === 8,
    'Suite 2: Course Totals',
    'Rejected courses remain unchanged at 8',
    `Expected 8, got ${rejectedCourses}`
  )

  // Verify 270 new seeded courses
  const dataset = buildData02CourseDataset()
  const newCourseIds = dataset.map((c) => c.id)

  const dbNewCourses = await prisma.course.findMany({
    where: { id: { in: newCourseIds } },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      type: true,
      level: true,
      authorId: true,
      categoryId: true,
      isDestroyed: true,
      requirements: true,
      benefits: true,
      techniques: true,
      price: true,
      oldPrice: true
    }
  })

  assert(
    dbNewCourses.length === 270,
    'Suite 2: New Seeded Courses Count',
    'All 270 new seeded courses exist in PostgreSQL',
    `Expected 270, found ${dbNewCourses.length}`
  )

  // Status must be APPROVED and isDestroyed false
  const nonApproved = dbNewCourses.filter((c) => c.status !== 'APPROVED' || c.isDestroyed)
  assert(
    nonApproved.length === 0,
    'Suite 2: Course Status Invariant',
    'All 270 new courses have status APPROVED and isDestroyed false',
    `Found ${nonApproved.length} non-approved or destroyed courses`
  )

  // Verify description length and quality
  const shortDescriptions = dbNewCourses.filter((c) => c.description.split(/\s+/).length < 200)
  assert(
    shortDescriptions.length === 0,
    'Suite 2: Text Quality & Richness',
    'All 270 new courses have comprehensive descriptions (>= 200 words)',
    `Found ${shortDescriptions.length} courses with short descriptions`
  )

  // Verify structured arrays
  const missingArrays = dbNewCourses.filter(
    (c) =>
      !Array.isArray(c.requirements) ||
      c.requirements.length === 0 ||
      !Array.isArray(c.benefits) ||
      c.benefits.length === 0 ||
      !Array.isArray(c.techniques) ||
      c.techniques.length === 0
  )
  assert(
    missingArrays.length === 0,
    'Suite 2: Course Metadata Completeness',
    'All 270 new courses have non-empty requirements, benefits, and techniques',
    `Found ${missingArrays.length} courses with missing metadata arrays`
  )

  // ----------------------------------------------------
  // SUITE 3: TEACHER QUOTA ALLOCATION INVARIANTS
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: TEACHER QUOTA ALLOCATION INVARIANTS ---')

  const teacherNewCourseCounts: Record<string, number> = {}
  for (const t of APPROVED_TEACHER_POOL) {
    teacherNewCourseCounts[t.username] = dbNewCourses.filter((c) => c.authorId === t.id).length
    assert(
      teacherNewCourseCounts[t.username] === 90,
      'Suite 3: Teacher Quota Distribution',
      `Teacher "${t.username}" assigned exactly 90 new courses`,
      `Expected 90, got ${teacherNewCourseCounts[t.username]}`
    )
  }

  // Verify overall teacher totals in DB
  const t02Total = await prisma.course.count({
    where: { authorId: '13608f92-8acf-53e3-adcb-0d832e9cb1d4' }
  })
  const tCnttTotal = await prisma.course.count({
    where: { authorId: '6dd1ccd9-420b-5c6d-8322-75223e67e549' }
  })
  const tGiaoVienTotal = await prisma.course.count({
    where: { authorId: 'c79ee551-3b2e-48ca-9105-c0669f04e6bb' }
  })

  assert(
    t02Total === 185,
    'Suite 3: Total Teacher Counts',
    'teacher02 total courses is 185 (95 legacy + 90 new)',
    `Expected 185, got ${t02Total}`
  )
  assert(
    tCnttTotal === 181,
    'Suite 3: Total Teacher Counts',
    'teacher_cntt total courses is 181 (91 legacy + 90 new)',
    `Expected 181, got ${tCnttTotal}`
  )
  assert(
    tGiaoVienTotal === 181,
    'Suite 3: Total Teacher Counts',
    'giaovientrungquoc total courses is 181 (91 legacy + 90 new)',
    `Expected 181, got ${tGiaoVienTotal}`
  )

  // ----------------------------------------------------
  // SUITE 4: CATEGORY DISTRIBUTION ACROSS 16 NEW CATEGORIES
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: CATEGORY DISTRIBUTION ACROSS 16 NEW CATEGORIES ---')

  for (const cat of NEW_CATEGORIES_DATA02) {
    const count = dbNewCourses.filter((c) => c.categoryId === cat.id).length
    assert(
      count === cat.targetNewCourses,
      'Suite 4: Category Course Distribution',
      `Category [${cat.code}] "${cat.name}" has exactly ${cat.targetNewCourses} courses`,
      `Expected ${cat.targetNewCourses}, got ${count}`
    )
  }

  // ----------------------------------------------------
  // SUITE 5: CATALOG DISCOVERABILITY & QUERY SAFETY
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: CATALOG DISCOVERABILITY & QUERY SAFETY ---')

  // Query catalog API equivalent: Active categories with course count
  const activeCatalogCategories = await prisma.category.findMany({
    where: { isDestroyed: false },
    include: {
      _count: {
        select: {
          courses: {
            where: { isDestroyed: false, status: 'APPROVED' }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  assert(
    activeCatalogCategories.length === 22,
    'Suite 5: Public Catalog Queries',
    'Public active categories query returns exactly 22 categories',
    `Expected 22, got ${activeCatalogCategories.length}`
  )

  const categoriesWithZeroCourses = activeCatalogCategories.filter((c) => c._count.courses === 0)
  // Exactly 2 categories (Vibe Coding and hardware) were preserved as empty per Decision B
  const zeroCourseSlugs = categoriesWithZeroCourses.map((c) => c.slug).sort()
  assert(
    categoriesWithZeroCourses.length === 2 &&
      zeroCourseSlugs.includes('vibe-coding') &&
      zeroCourseSlugs.includes('hardware'),
    'Suite 5: Public Catalog Queries',
    'Exactly 2 legacy categories (vibe-coding and hardware) are empty as approved in Decision B',
    `Expected [hardware, vibe-coding], got ${JSON.stringify(zeroCourseSlugs)}`
  )

  // Verify all 16 new categories have active courses
  const newCatCourseCounts = activeCatalogCategories.filter((c) =>
    NEW_CATEGORIES_DATA02.some((nc) => nc.id === c.id)
  )
  const newCatsWithoutCourses = newCatCourseCounts.filter((c) => c._count.courses === 0)
  assert(
    newCatsWithoutCourses.length === 0,
    'Suite 5: Public Catalog Queries',
    'All 16 newly added categories have > 0 approved courses',
    `Found ${newCatsWithoutCourses.length} new categories with 0 courses`
  )

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================')
  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`)
  console.log('====================================================')

  if (failedCount > 0) {
    console.error('\nSOME TESTS FAILED!')
    process.exit(1)
  } else {
    console.log('\n>>> ALL POST-SEED VERIFICATION TESTS PASSED PERFECTLY! <<<')
  }
}

runTests()
  .catch((err) => {
    console.error('Test runner fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
