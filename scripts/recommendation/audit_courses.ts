import fs from 'fs'
import path from 'path'
import { CourseLevel, CourseStatus, CourseType, Prisma } from '@prisma/client'
import { prisma } from '../../src/config/prisma'

interface DuplicatePair {
  courseIdA: string
  titleA: string
  categoryA: string
  courseIdB: string
  titleB: string
  categoryB: string
  similarity: number
  type: 'EXACT_TITLE' | 'NORMALIZED_TITLE' | 'EXACT_DESCRIPTION' | 'NEAR_DUPLICATE_DESCRIPTION'
}

interface TextLengthStats {
  min: number
  max: number
  mean: number
  median: number
  stdDev: number
}

function calculateStats(numbers: number[]): TextLengthStats {
  if (numbers.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 }
  }
  const sorted = [...numbers].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const sum = sorted.reduce((acc, val) => acc + val, 0)
  const mean = Number((sum / sorted.length).toFixed(2))
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0
      ? Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2))
      : sorted[mid]

  const variance =
    sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length
  const stdDev = Number(Math.sqrt(variance).toFixed(2))

  return { min, max, mean, median, stdDev }
}

// Tokenize text into words (whitespace-based for Vietnamese syllables/tokens)
function tokenizeWhitespace(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
}

// Generate shingles of size n
function getShingles(tokens: string[], n: number = 3): Set<string> {
  const shingles = new Set<string>()
  if (tokens.length < n) {
    shingles.add(tokens.join(' '))
    return shingles
  }
  for (let i = 0; i <= tokens.length - n; i++) {
    shingles.add(tokens.slice(i, i + n).join(' '))
  }
  return shingles
}

// Jaccard similarity between two sets of shingles
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0
  if (setA.size === 0 || setB.size === 0) return 0.0

  let intersectionSize = 0
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++
    }
  }
  const unionSize = setA.size + setB.size - intersectionSize
  return Number((intersectionSize / unionSize).toFixed(4))
}

export async function runComprehensiveAudit() {
  console.log('====================================================')
  console.log('       REC-01: COMPREHENSIVE DATASET AUDIT')
  console.log('====================================================\n')

  const startTime = Date.now()

  // 1. Database-wide counts (Read-Only)
  const totalCoursesInDb = await prisma.course.count()
  const activeCoursesInDb = await prisma.course.count({ where: { isDestroyed: false } })
  const destroyedCoursesInDb = await prisma.course.count({ where: { isDestroyed: true } })
  const approvedCoursesInDb = await prisma.course.count({ where: { status: CourseStatus.APPROVED } })
  const pendingCoursesInDb = await prisma.course.count({ where: { status: CourseStatus.PENDING } })
  const rejectedCoursesInDb = await prisma.course.count({ where: { status: CourseStatus.REJECTED } })

  const totalCategoriesInDb = await prisma.category.count()
  const activeCategoriesInDb = await prisma.category.count({ where: { isDestroyed: false } })
  const destroyedCategoriesInDb = await prisma.category.count({ where: { isDestroyed: true } })

  console.log('--- 1. DATABASE BASELINE COUNTS ---')
  console.log(`Total Courses: ${totalCoursesInDb} (Active: ${activeCoursesInDb}, Destroyed: ${destroyedCoursesInDb})`)
  console.log(`Status Breakdown: Approved=${approvedCoursesInDb}, Pending=${pendingCoursesInDb}, Rejected=${rejectedCoursesInDb}`)
  console.log(`Total Categories: ${totalCategoriesInDb} (Active: ${activeCategoriesInDb}, Destroyed: ${destroyedCategoriesInDb})\n`)

  // 2. Fetch all eligible courses under the defined policy:
  // Policy: status === APPROVED, isDestroyed === false, category.isDestroyed === false
  const eligibleCourses = await prisma.course.findMany({
    where: {
      status: CourseStatus.APPROVED,
      isDestroyed: false,
      category: {
        isDestroyed: false
      }
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          isDestroyed: true
        }
      },
      author: {
        select: {
          id: true,
          username: true,
          role: true,
          isVerified: true
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  })

  console.log('--- 2. ELIGIBILITY AUDIT ---')
  console.log(`Eligible Courses Count: ${eligibleCourses.length}`)
  console.log(`Expected Baseline: 610 courses`)
  console.log(`Delta: ${eligibleCourses.length - 610} courses\n`)

  // Detailed eligibility breakdown
  const approvedDestroyedCourses = await prisma.course.findMany({
    where: { status: CourseStatus.APPROVED, isDestroyed: true },
    select: { id: true, title: true, status: true, isDestroyed: true, categoryId: true }
  })

  const approvedNullCatCourses = await prisma.course.findMany({
    where: { status: CourseStatus.APPROVED, isDestroyed: false, categoryId: null },
    select: { id: true, title: true, status: true, isDestroyed: true, categoryId: true }
  })

  const approvedDestroyedCatCourses = await prisma.course.findMany({
    where: {
      status: CourseStatus.APPROVED,
      isDestroyed: false,
      category: { isDestroyed: true }
    },
    select: { id: true, title: true, status: true, isDestroyed: true, categoryId: true, category: { select: { id: true, name: true, isDestroyed: true } } }
  })

  console.log(`Approved but soft-deleted courses (${approvedDestroyedCourses.length}):`, approvedDestroyedCourses)
  console.log(`Approved active with categoryId === null (${approvedNullCatCourses.length}):`, approvedNullCatCourses)
  console.log(`Approved active with category.isDestroyed === true (${approvedDestroyedCatCourses.length}):`, approvedDestroyedCatCourses)

  // 3. Load DATA-02 mutation manifest if available to establish course provenance
  const manifestPath = path.resolve(__dirname, '../migration-logs/data02-mutation-manifest.json')
  let data02CourseIds = new Set<string>()
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      if (Array.isArray(manifest.insertedCourseBatches)) {
        for (const batch of manifest.insertedCourseBatches) {
          if (Array.isArray(batch.courseIds)) {
            for (const id of batch.courseIds) {
              data02CourseIds.add(id)
            }
          }
        }
      }
      console.log(`Loaded DATA-02 Provenance: ${data02CourseIds.size} course IDs identified.`)
    } catch (e) {
      console.warn('Could not parse DATA-02 manifest:', e)
    }
  } else {
    console.warn(`Manifest not found at ${manifestPath}. Provenance comparison will be skipped.`)
  }

  // 4. Distribution and Completeness
  console.log('\n--- 3. COMPLETENESS & DISTRIBUTION AUDIT ---')

  const categoryCounts: Record<string, { id: string; name: string; count: number }> = {}
  const teacherCounts: Record<string, { username: string; count: number; role: string }> = {}
  const levelCounts: Record<string, number> = { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0 }
  const typeCounts: Record<string, number> = { FREE: 0, PAID: 0 }

  const priceRanges = {
    free: 0,
    under200k: 0,
    from200kTo500k: 0,
    from500kTo1M: 0,
    over1M: 0
  }

  const missingFields = {
    image: 0,
    introUrl: 0,
    description: 0,
    techniques: 0,
    requirements: 0,
    benefits: 0,
    documents: 0
  }

  const titleCharLengths: number[] = []
  const titleWordLengths: number[] = []
  const descCharLengths: number[] = []
  const descWordLengths: number[] = []

  const legacyDescWords: number[] = []
  const data02DescWords: number[] = []

  const legacyVocab = new Set<string>()
  const data02Vocab = new Set<string>()
  const overallVocab = new Set<string>()

  let shortDescriptionsCount = 0 // < 100 words
  let veryShortDescriptionsCount = 0 // < 50 words

  for (const c of eligibleCourses) {
    // Category distribution
    const catName = c.category?.name || 'Unknown'
    const catId = c.category?.id || 'unknown'
    if (!categoryCounts[catName]) {
      categoryCounts[catName] = { id: catId, name: catName, count: 0 }
    }
    categoryCounts[catName].count++

    // Teacher distribution
    const teacherName = c.author?.username || 'Unknown'
    if (!teacherCounts[teacherName]) {
      teacherCounts[teacherName] = { username: teacherName, count: 0, role: c.author?.role || 'TEACHER' }
    }
    teacherCounts[teacherName].count++

    // Level distribution
    if (c.level in levelCounts) {
      levelCounts[c.level]++
    }

    // Type distribution
    if (c.type in typeCounts) {
      typeCounts[c.type]++
    }

    // Price distribution
    const price = Number(c.price)
    if (price === 0) {
      priceRanges.free++
    } else if (price < 200000) {
      priceRanges.under200k++
    } else if (price < 500000) {
      priceRanges.from200kTo500k++
    } else if (price <= 1000000) {
      priceRanges.from500kTo1M++
    } else {
      priceRanges.over1M++
    }

    // Missing fields audit
    if (!c.image || c.image.trim() === '') missingFields.image++
    if (!c.introUrl || c.introUrl.trim() === '') missingFields.introUrl++
    if (!c.description || c.description.trim() === '') missingFields.description++
    if (!c.techniques || c.techniques.length === 0) missingFields.techniques++
    if (!c.requirements || c.requirements.length === 0) missingFields.requirements++
    if (!c.benefits || c.benefits.length === 0) missingFields.benefits++
    if (!c.documents || c.documents.length === 0) missingFields.documents++

    // Text lengths
    const titleTokens = tokenizeWhitespace(c.title)
    const descTokens = tokenizeWhitespace(c.description)

    titleCharLengths.push(c.title.length)
    titleWordLengths.push(titleTokens.length)
    descCharLengths.push(c.description.length)
    descWordLengths.push(descTokens.length)

    if (descTokens.length < 50) veryShortDescriptionsCount++
    if (descTokens.length < 100) shortDescriptionsCount++

    // Vocabulary & Provenance tracking
    const isData02 = data02CourseIds.has(c.id)
    for (const t of descTokens) {
      overallVocab.add(t)
      if (isData02) {
        data02Vocab.add(t)
      } else {
        legacyVocab.add(t)
      }
    }
    if (isData02) {
      data02DescWords.push(descTokens.length)
    } else {
      legacyDescWords.push(descTokens.length)
    }
  }

  console.log(`Active Categories Represented: ${Object.keys(categoryCounts).length} / ${activeCategoriesInDb}`)
  console.log(`Teachers Represented: ${Object.keys(teacherCounts).length}`)
  console.log(`Levels: BEGINNER=${levelCounts.BEGINNER}, INTERMEDIATE=${levelCounts.INTERMEDIATE}, ADVANCED=${levelCounts.ADVANCED}`)
  console.log(`Types: FREE=${typeCounts.FREE}, PAID=${typeCounts.PAID}`)
  console.log(`Price Ranges: Free=${priceRanges.free}, <200k=${priceRanges.under200k}, 200k-500k=${priceRanges.from200kTo500k}, 500k-1M=${priceRanges.from500kTo1M}, >1M=${priceRanges.over1M}`)
  console.log(`Missing Fields:`, missingFields)

  // 5. Text Quality Metrics
  console.log('\n--- 4. TEXT QUALITY STATISTICS ---')
  const titleCharStats = calculateStats(titleCharLengths)
  const titleWordStats = calculateStats(titleWordLengths)
  const descCharStats = calculateStats(descCharLengths)
  const descWordStats = calculateStats(descWordLengths)

  console.log(`Title Characters: min=${titleCharStats.min}, max=${titleCharStats.max}, mean=${titleCharStats.mean}, median=${titleCharStats.median}, stdDev=${titleCharStats.stdDev}`)
  console.log(`Title Words: min=${titleWordStats.min}, max=${titleWordStats.max}, mean=${titleWordStats.mean}, median=${titleWordStats.median}, stdDev=${titleWordStats.stdDev}`)
  console.log(`Description Characters: min=${descCharStats.min}, max=${descCharStats.max}, mean=${descCharStats.mean}, median=${descCharStats.median}, stdDev=${descCharStats.stdDev}`)
  console.log(`Description Words: min=${descWordStats.min}, max=${descWordStats.max}, mean=${descWordStats.mean}, median=${descWordStats.median}, stdDev=${descWordStats.stdDev}`)
  console.log(`Short Descriptions (<100 words): ${shortDescriptionsCount} (${((shortDescriptionsCount / eligibleCourses.length) * 100).toFixed(1)}%)`)
  console.log(`Very Short Descriptions (<50 words): ${veryShortDescriptionsCount} (${((veryShortDescriptionsCount / eligibleCourses.length) * 100).toFixed(1)}%)`)

  // 6. Duplicate Detection
  console.log('\n--- 5. DUPLICATE & NEAR-DUPLICATE DETECTION ---')
  const exactTitleMap = new Map<string, typeof eligibleCourses[0][]>()
  const normTitleMap = new Map<string, typeof eligibleCourses[0][]>()
  const exactDescMap = new Map<string, typeof eligibleCourses[0][]>()

  const courseShingles: {
    id: string
    title: string
    category: string
    shingles: Set<string>
    tokens: string[]
  }[] = []

  for (const c of eligibleCourses) {
    // Exact title
    const exactTitle = c.title.trim()
    if (!exactTitleMap.has(exactTitle)) exactTitleMap.set(exactTitle, [])
    exactTitleMap.get(exactTitle)!.push(c)

    // Normalized title
    const normTitle = exactTitle.toLowerCase().replace(/\s+/g, ' ')
    if (!normTitleMap.has(normTitle)) normTitleMap.set(normTitle, [])
    normTitleMap.get(normTitle)!.push(c)

    // Exact description
    const exactDesc = c.description.trim()
    if (!exactDescMap.has(exactDesc)) exactDescMap.set(exactDesc, [])
    exactDescMap.get(exactDesc)!.push(c)

    // Shingles for near duplicate detection
    const tokens = tokenizeWhitespace(c.description)
    courseShingles.push({
      id: c.id,
      title: c.title,
      category: c.category?.name || 'Unknown',
      shingles: getShingles(tokens, 3),
      tokens
    })
  }

  const duplicates: DuplicatePair[] = []

  // Check exact titles
  for (const [title, list] of exactTitleMap.entries()) {
    if (list.length > 1) {
      for (let i = 0; i < list.length - 1; i++) {
        for (let j = i + 1; j < list.length; j++) {
          duplicates.push({
            courseIdA: list[i].id,
            titleA: list[i].title,
            categoryA: list[i].category?.name || 'Unknown',
            courseIdB: list[j].id,
            titleB: list[j].title,
            categoryB: list[j].category?.name || 'Unknown',
            similarity: 1.0,
            type: 'EXACT_TITLE'
          })
        }
      }
    }
  }

  // Check exact descriptions
  for (const [desc, list] of exactDescMap.entries()) {
    if (list.length > 1 && desc.length > 0) {
      for (let i = 0; i < list.length - 1; i++) {
        for (let j = i + 1; j < list.length; j++) {
          duplicates.push({
            courseIdA: list[i].id,
            titleA: list[i].title,
            categoryA: list[i].category?.name || 'Unknown',
            courseIdB: list[j].id,
            titleB: list[j].title,
            categoryB: list[j].category?.name || 'Unknown',
            similarity: 1.0,
            type: 'EXACT_DESCRIPTION'
          })
        }
      }
    }
  }

  // Near duplicate descriptions (Jaccard similarity >= 0.8)
  const JACCARD_THRESHOLD = 0.8
  const highSimilarityPairs: DuplicatePair[] = []

  console.log(`Comparing pairwise 3-gram Jaccard similarity across ${courseShingles.length} courses...`)
  for (let i = 0; i < courseShingles.length - 1; i++) {
    for (let j = i + 1; j < courseShingles.length; j++) {
      const sim = jaccardSimilarity(courseShingles[i].shingles, courseShingles[j].shingles)
      if (sim >= JACCARD_THRESHOLD) {
        highSimilarityPairs.push({
          courseIdA: courseShingles[i].id,
          titleA: courseShingles[i].title,
          categoryA: courseShingles[i].category,
          courseIdB: courseShingles[j].id,
          titleB: courseShingles[j].title,
          categoryB: courseShingles[j].category,
          similarity: sim,
          type: 'NEAR_DUPLICATE_DESCRIPTION'
        })
      }
    }
  }

  console.log(`Exact Duplicate Titles: ${duplicates.filter((d) => d.type === 'EXACT_TITLE').length}`)
  if (duplicates.filter((d) => d.type === 'EXACT_TITLE').length > 0) {
    console.log('Exact Duplicate Title Pairs:', JSON.stringify(duplicates.filter((d) => d.type === 'EXACT_TITLE'), null, 2))
  }
  console.log(`Exact Duplicate Descriptions: ${duplicates.filter((d) => d.type === 'EXACT_DESCRIPTION').length}`)
  console.log(`Near-Duplicate Descriptions (Jaccard >= ${JACCARD_THRESHOLD}): ${highSimilarityPairs.length}`)

  // 7. Synthetic Content Comparison (DATA-02 vs Legacy)
  console.log('\n--- 6. SYNTHETIC CONTENT BIAS (DATA-02 vs LEGACY) ---')
  const legacyDescStats = calculateStats(legacyDescWords)
  const data02DescStats = calculateStats(data02DescWords)

  console.log(`Legacy Courses (N=${legacyDescWords.length}): Mean Words=${legacyDescStats.mean}, Median=${legacyDescStats.median}, Vocab Size=${legacyVocab.size}`)
  console.log(`DATA-02 Courses (N=${data02DescWords.length}): Mean Words=${data02DescStats.mean}, Median=${data02DescStats.median}, Vocab Size=${data02Vocab.size}`)
  console.log(`Overall Unique Vocabulary (Syllables/Words): ${overallVocab.size}`)

  // 8. Category Imbalance
  console.log('\n--- 7. CATEGORY IMBALANCE METRICS ---')
  const sortedCategories = Object.values(categoryCounts).sort((a, b) => b.count - a.count)
  for (const cat of sortedCategories) {
    const pct = ((cat.count / eligibleCourses.length) * 100).toFixed(1)
    console.log(`  - ${cat.name}: ${cat.count} courses (${pct}%)`)
  }

  const auditReport = {
    generatedAt: new Date().toISOString(),
    executionDurationMs: Date.now() - startTime,
    databaseBaseline: {
      totalCourses: totalCoursesInDb,
      activeCourses: activeCoursesInDb,
      destroyedCourses: destroyedCoursesInDb,
      approvedCourses: approvedCoursesInDb,
      pendingCourses: pendingCoursesInDb,
      rejectedCourses: rejectedCoursesInDb,
      totalCategories: totalCategoriesInDb,
      activeCategories: activeCategoriesInDb,
      destroyedCategories: destroyedCategoriesInDb
    },
    eligibilitySummary: {
      totalApprovedCoursesInDb: approvedCoursesInDb,
      eligibleCoursesCount: eligibleCourses.length,
      expectedBaseline: 610,
      delta: eligibleCourses.length - 610,
      excludedReasons: {
        approvedSoftDeletedCoursesCount: approvedDestroyedCourses.length,
        approvedSoftDeletedCourses: approvedDestroyedCourses,
        approvedNullCategoryCoursesCount: approvedNullCatCourses.length,
        approvedNullCategoryCourses: approvedNullCatCourses,
        approvedDestroyedCategoryCoursesCount: approvedDestroyedCatCourses.length
      }
    },
    completeness: {
      activeCategoriesInDb,
      representedCategoriesCount: Object.keys(categoryCounts).length,
      categories: sortedCategories,
      teachers: teacherCounts,
      levels: levelCounts,
      types: typeCounts,
      priceRanges,
      missingFields
    },
    textQuality: {
      wordCountMethodology: 'Whitespace tokenization of Vietnamese space-delimited tokens/syllables',
      titleCharacters: titleCharStats,
      titleWords: titleWordStats,
      descriptionCharacters: descCharStats,
      descriptionWords: descWordStats,
      shortDescriptionsCount,
      veryShortDescriptionsCount,
      overallVocabularySize: overallVocab.size
    },
    duplicates: {
      exactTitlesCount: duplicates.filter((d) => d.type === 'EXACT_TITLE').length,
      exactDescriptionsCount: duplicates.filter((d) => d.type === 'EXACT_DESCRIPTION').length,
      nearDuplicatesCount: highSimilarityPairs.length,
      jaccardThreshold: JACCARD_THRESHOLD,
      topNearDuplicatePairs: highSimilarityPairs.slice(0, 10),
      exactDuplicateTitlePairs: duplicates.filter((d) => d.type === 'EXACT_TITLE')
    },
    syntheticComparison: {
      legacyCourseCount: legacyDescWords.length,
      legacyWordStats: legacyDescStats,
      legacyVocabSize: legacyVocab.size,
      data02CourseCount: data02DescWords.length,
      data02WordStats: data02DescStats,
      data02VocabSize: data02Vocab.size
    }
  }

  const outDir = path.resolve(__dirname, '../../data/recommendation')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'audit_summary.json'), JSON.stringify(auditReport, null, 2), 'utf8')
  console.log(`\nAudit summary JSON written to: ${path.join(outDir, 'audit_summary.json')}`)

  return auditReport
}

if (require.main === module) {
  runComprehensiveAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Audit failed with error:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
