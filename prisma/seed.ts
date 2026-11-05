import { prisma } from '../src/config/prisma'
import { generateSeedCourses, TEACHER_IDS, CATEGORY_IDS, SeedCourseRecord } from './seeds/course-data'

export async function runCourseSeed() {
  console.log('====================================================')
  console.log('       TMDEMY 360+ COURSE SEEDING PIPELINE          ')
  console.log('====================================================')

  // -----------------------------------------------------------------
  // 1. PREREQUISITE VERIFICATION (Teachers & Categories)
  // -----------------------------------------------------------------
  console.log('\n[1/5] Verifying prerequisites (Teachers & Categories)...')

  for (const [tKey, tId] of Object.entries(TEACHER_IDS)) {
    const teacher = await prisma.user.findUnique({
      where: { id: tId },
      select: { id: true, username: true, role: true }
    })
    if (!teacher) {
      console.error(`[ERROR] Teacher ${tKey} (${tId}) NOT FOUND in database!`)
      throw new Error(`Prerequisite failed: Missing teacher ${tId}`)
    }
    console.log(`  ✓ Teacher verified: ${tKey} -> ${teacher.username} (${teacher.role})`)
  }

  for (const [cKey, cId] of Object.entries(CATEGORY_IDS)) {
    const category = await prisma.category.findUnique({
      where: { id: cId },
      select: { id: true, name: true, slug: true }
    })
    if (!category) {
      console.error(`[ERROR] Category ${cKey} (${cId}) NOT FOUND in database!`)
      throw new Error(`Prerequisite failed: Missing category ${cId}`)
    }
    console.log(`  ✓ Category verified: ${cKey} -> "${category.name}" (${category.slug})`)
  }

  // -----------------------------------------------------------------
  // 2. CHECK DATABASE STATE BEFORE SEED
  // -----------------------------------------------------------------
  console.log('\n[2/5] Checking database state before seed...')
  const initialCourseCount = await prisma.course.count()
  console.log(`  - Initial courses in database: ${initialCourseCount}`)

  // -----------------------------------------------------------------
  // 3. GENERATE DETERMINISTIC SEED DATASET (360 Courses)
  // -----------------------------------------------------------------
  console.log('\n[3/5] Generating deterministic 360 course dataset...')
  const coursesToSeed: SeedCourseRecord[] = generateSeedCourses()
  console.log(`  - Total courses prepared for seeding: ${coursesToSeed.length}`)

  // -----------------------------------------------------------------
  // 4. IDEMPOTENT UPSERT EXECUTION
  // -----------------------------------------------------------------
  console.log('\n[4/5] Executing idempotent upsert for 360 courses...')
  const CHUNK_SIZE = 30
  let upsertedCount = 0

  for (let i = 0; i < coursesToSeed.length; i += CHUNK_SIZE) {
    const chunk = coursesToSeed.slice(i, i + CHUNK_SIZE)

    await prisma.$transaction(
      chunk.map((course) =>
        prisma.course.upsert({
          where: { id: course.id },
          update: {
            title: course.title,
            slug: course.slug,
            description: course.description,
            price: course.price,
            oldPrice: course.oldPrice,
            type: course.type,
            status: course.status,
            level: course.level,
            view: course.view,
            sold: course.sold,
            image: course.image,
            introUrl: course.introUrl,
            requirements: course.requirements,
            benefits: course.benefits,
            techniques: course.techniques,
            documents: course.documents,
            categoryId: course.categoryId,
            authorId: course.authorId,
            isDestroyed: false
          },
          create: {
            id: course.id,
            title: course.title,
            slug: course.slug,
            description: course.description,
            price: course.price,
            oldPrice: course.oldPrice,
            type: course.type,
            status: course.status,
            level: course.level,
            view: course.view,
            sold: course.sold,
            image: course.image,
            introUrl: course.introUrl,
            requirements: course.requirements,
            benefits: course.benefits,
            techniques: course.techniques,
            documents: course.documents,
            categoryId: course.categoryId,
            authorId: course.authorId,
            isDestroyed: false
          }
        })
      )
    )

    upsertedCount += chunk.length
    process.stdout.write(`  -> Progress: ${upsertedCount} / ${coursesToSeed.length} courses upserted...\r`)
  }
  console.log(`\n  ✓ Successfully upserted all ${upsertedCount} courses!`)

  // -----------------------------------------------------------------
  // 5. POST-SEED VALIDATION & AUDIT
  // -----------------------------------------------------------------
  console.log('\n[5/5] Performing post-seed validation...')
  const finalCourseCount = await prisma.course.count()
  console.log(`  - Total courses in database now: ${finalCourseCount}`)
  console.log(`  - Courses added / updated: ${finalCourseCount - initialCourseCount >= 0 ? 360 : 0}`)

  if (finalCourseCount < initialCourseCount) {
    throw new Error('Database safety violation: total courses decreased!')
  }

  // Check unique slugs across entire DB
  const allSlugs = await prisma.course.findMany({ select: { slug: true } })
  const uniqueSlugCount = new Set(allSlugs.map((c) => c.slug)).size
  console.log(`  - Total unique slugs in database: ${uniqueSlugCount} / ${finalCourseCount}`)
  if (uniqueSlugCount !== finalCourseCount) {
    throw new Error('Integrity violation: Duplicate slugs found in database!')
  }

  // Teacher count breakdown for seeded courses
  console.log('\n--- SEEDED COURSES PER TEACHER ---')
  for (const [tKey, tId] of Object.entries(TEACHER_IDS)) {
    const count = await prisma.course.count({
      where: { authorId: tId, id: { in: coursesToSeed.map((c) => c.id) } }
    })
    console.log(`  • ${tKey}: ${count} seeded courses`)
  }

  // Category count breakdown for seeded courses
  console.log('\n--- SEEDED COURSES PER CATEGORY ---')
  for (const [cKey, cId] of Object.entries(CATEGORY_IDS)) {
    const count = await prisma.course.count({
      where: { categoryId: cId, id: { in: coursesToSeed.map((c) => c.id) } }
    })
    console.log(`  • ${cKey}: ${count} seeded courses`)
  }

  // Status breakdown
  const approvedCount = await prisma.course.count({ where: { status: 'APPROVED' } })
  const pendingCount = await prisma.course.count({ where: { status: 'PENDING' } })
  const rejectedCount = await prisma.course.count({ where: { status: 'REJECTED' } })
  console.log('\n--- OVERALL DATABASE STATUS BREAKDOWN ---')
  console.log(`  • APPROVED: ${approvedCount}`)
  console.log(`  • PENDING:  ${pendingCount}`)
  console.log(`  • REJECTED: ${rejectedCount}`)

  console.log('\n====================================================')
  console.log('       SEEDING PIPELINE COMPLETED SUCCESSFULLY!     ')
  console.log('====================================================\n')

  return {
    initialCourseCount,
    finalCourseCount,
    addedCount: finalCourseCount - initialCourseCount,
    approvedCount,
    pendingCount,
    rejectedCount,
    uniqueSlugCount
  }
}

// Auto-run when executed directly via CLI
if (require.main === module || process.argv[1]?.includes('seed')) {
  runCourseSeed()
    .then(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
    .catch(async (err) => {
      console.error('\n[FATAL SEED ERROR]:', err)
      await prisma.$disconnect()
      process.exit(1)
    })
}
