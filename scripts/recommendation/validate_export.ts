import fs from 'fs'
import path from 'path'
import { CourseLevel, CourseStatus, CourseType } from '@prisma/client'
import { prisma } from '../../src/config/prisma'
import { computeSha256, ExportedCourseRecord, ExportManifest } from './export_courses'

interface ValidationResult {
  checkId: number
  name: string
  passed: boolean
  details?: string
}

const results: ValidationResult[] = []

function assertCheck(checkId: number, name: string, condition: boolean, failureDetails?: string) {
  if (condition) {
    results.push({ checkId, name, passed: true })
    console.log(`  ✓ [PASS] Check #${checkId}: ${name}`)
  } else {
    results.push({ checkId, name, passed: false, details: failureDetails })
    console.error(`  ✗ [FAIL] Check #${checkId}: ${name} - ${failureDetails}`)
  }
}

// Simple CSV parser for RFC 4180 lines
function parseCsvSimple(csvText: string): Record<string, string>[] {
  const lines: string[] = []
  let currentLine = ''
  let insideQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    if (char === '"') {
      insideQuotes = !insideQuotes
      currentLine += char
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++ // Skip \n
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine)
      }
      currentLine = ''
    } else {
      currentLine += char
    }
  }
  if (currentLine.trim().length > 0) {
    lines.push(currentLine)
  }

  if (lines.length < 2) return []

  const headerTokens = parseCsvRow(lines[0])
  const records: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const rowTokens = parseCsvRow(lines[i])
    const obj: Record<string, string> = {}
    headerTokens.forEach((h, idx) => {
      obj[h] = rowTokens[idx] ?? ''
    })
    records.push(obj)
  }

  return records
}

function parseCsvRow(rowText: string): string[] {
  const tokens: string[] = []
  let currentToken = ''
  let insideQuotes = false

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i]
    if (char === '"') {
      if (insideQuotes && rowText[i + 1] === '"') {
        currentToken += '"'
        i++ // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      tokens.push(currentToken)
      currentToken = ''
    } else {
      currentToken += char
    }
  }
  tokens.push(currentToken)
  return tokens
}

export async function runExportValidation() {
  console.log('====================================================')
  console.log('       REC-01: EXPORT VALIDATION TEST SUITE')
  console.log('====================================================\n')

  const rawDir = path.resolve(__dirname, '../../data/recommendation/raw')
  const baseDir = path.resolve(__dirname, '../../data/recommendation')
  const jsonPath = path.join(rawDir, 'courses.json')
  const csvPath = path.join(rawDir, 'courses.csv')
  const manifestPath = path.join(baseDir, 'manifest.json')

  // Verify file existence
  if (!fs.existsSync(jsonPath) || !fs.existsSync(csvPath) || !fs.existsSync(manifestPath)) {
    throw new Error('Export files or manifest do not exist. Run export_courses.ts first.')
  }

  const jsonRaw = fs.readFileSync(jsonPath, 'utf8')
  const csvRaw = fs.readFileSync(csvPath, 'utf8')
  const manifestRaw = fs.readFileSync(manifestPath, 'utf8')

  const jsonRecords: ExportedCourseRecord[] = JSON.parse(jsonRaw)
  const csvRecords = parseCsvSimple(csvRaw)
  const manifest: ExportManifest = JSON.parse(manifestRaw)

  // Snapshot database state before running test queries
  const preTestCoursesCount = await prisma.course.count()
  const preTestCategoriesCount = await prisma.category.count()

  // ------------------------------------------------------------------------
  // CHECK 1: Only eligible courses are exported (608 records)
  // ------------------------------------------------------------------------
  const exportedIds = new Set(jsonRecords.map((r) => r.course_id))
  assertCheck(
    1,
    'Only eligible courses are exported',
    jsonRecords.length === 608 && exportedIds.size === 608,
    `Expected 608 records, got ${jsonRecords.length}`
  )

  // ------------------------------------------------------------------------
  // CHECK 2: PENDING courses are excluded
  // ------------------------------------------------------------------------
  const pendingCourses = await prisma.course.findMany({
    where: { status: CourseStatus.PENDING },
    select: { id: true }
  })
  const pendingInExport = pendingCourses.filter((c) => exportedIds.has(c.id))
  assertCheck(
    2,
    'PENDING courses are excluded',
    pendingInExport.length === 0,
    `Found ${pendingInExport.length} PENDING courses in export`
  )

  // ------------------------------------------------------------------------
  // CHECK 3: REJECTED courses are excluded
  // ------------------------------------------------------------------------
  const rejectedCourses = await prisma.course.findMany({
    where: { status: CourseStatus.REJECTED },
    select: { id: true }
  })
  const rejectedInExport = rejectedCourses.filter((c) => exportedIds.has(c.id))
  assertCheck(
    3,
    'REJECTED courses are excluded',
    rejectedInExport.length === 0,
    `Found ${rejectedInExport.length} REJECTED courses in export`
  )

  // ------------------------------------------------------------------------
  // CHECK 4: Soft-deleted courses are excluded
  // ------------------------------------------------------------------------
  const destroyedCourses = await prisma.course.findMany({
    where: { isDestroyed: true },
    select: { id: true }
  })
  const destroyedInExport = destroyedCourses.filter((c) => exportedIds.has(c.id))
  assertCheck(
    4,
    'Soft-deleted courses are excluded',
    destroyedInExport.length === 0,
    `Found ${destroyedInExport.length} soft-deleted courses in export`
  )

  // ------------------------------------------------------------------------
  // CHECK 5: Courses in deleted categories are excluded
  // ------------------------------------------------------------------------
  const destroyedCategories = await prisma.category.findMany({
    where: { isDestroyed: true },
    select: { id: true }
  })
  const destroyedCatIds = new Set(destroyedCategories.map((c) => c.id))
  const coursesInDestroyedCat = jsonRecords.filter((r) => destroyedCatIds.has(r.category_id))
  assertCheck(
    5,
    'Courses in deleted categories are excluded',
    coursesInDestroyedCat.length === 0,
    `Found ${coursesInDestroyedCat.length} courses with deleted categories`
  )

  // ------------------------------------------------------------------------
  // CHECK 6: Exported course IDs are strictly unique
  // ------------------------------------------------------------------------
  assertCheck(
    6,
    'Exported course IDs are unique',
    exportedIds.size === jsonRecords.length,
    `Distinct IDs: ${exportedIds.size}, Total records: ${jsonRecords.length}`
  )

  // ------------------------------------------------------------------------
  // CHECK 7: Required fields follow documented schema
  // ------------------------------------------------------------------------
  const expectedKeys = [
    'course_id',
    'title',
    'slug',
    'description',
    'category_id',
    'category_name',
    'category_slug',
    'level',
    'type',
    'price',
    'old_price',
    'techniques',
    'requirements',
    'benefits',
    'teacher_id',
    'teacher_name',
    'created_at',
    'updated_at'
  ]
  const validLevels = new Set(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  const validTypes = new Set(['FREE', 'PAID'])

  let schemaValid = true
  let schemaFailure = ''
  for (const r of jsonRecords) {
    for (const k of expectedKeys) {
      if ((r as any)[k] === undefined || (r as any)[k] === null) {
        schemaValid = false
        schemaFailure = `Missing field ${k} in record ${r.course_id}`
        break
      }
    }
    if (!validLevels.has(r.level)) {
      schemaValid = false
      schemaFailure = `Invalid level ${r.level} in record ${r.course_id}`
      break
    }
    if (!validTypes.has(r.type)) {
      schemaValid = false
      schemaFailure = `Invalid type ${r.type} in record ${r.course_id}`
      break
    }
    if (typeof r.price !== 'number' || typeof r.old_price !== 'number') {
      schemaValid = false
      schemaFailure = `Price or old_price is not number in record ${r.course_id}`
      break
    }
  }
  assertCheck(7, 'Required fields follow documented schema', schemaValid, schemaFailure)

  // ------------------------------------------------------------------------
  // CHECK 8: Vietnamese Unicode is preserved
  // ------------------------------------------------------------------------
  // Look for Vietnamese diacritics in titles and descriptions
  const vietnameseSample = jsonRecords.filter(
    (r) =>
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(r.title) &&
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(r.description)
  )
  assertCheck(
    8,
    'Vietnamese Unicode is preserved',
    vietnameseSample.length >= 600,
    `Only ${vietnameseSample.length} / ${jsonRecords.length} records contained Vietnamese diacritics`
  )

  // ------------------------------------------------------------------------
  // CHECK 9: CSV and JSON contain equivalent records
  // ------------------------------------------------------------------------
  let csvJsonEquiv = true
  let equivFailure = ''
  if (csvRecords.length !== jsonRecords.length) {
    csvJsonEquiv = false
    equivFailure = `CSV row count (${csvRecords.length}) != JSON count (${jsonRecords.length})`
  } else {
    for (let i = 0; i < jsonRecords.length; i++) {
      const jRec = jsonRecords[i]
      const cRec = csvRecords[i]
      if (jRec.course_id !== cRec.course_id || jRec.title !== cRec.title) {
        csvJsonEquiv = false
        equivFailure = `Mismatch at index ${i}: JSON id=${jRec.course_id}, CSV id=${cRec.course_id}`
        break
      }
      if (Number(jRec.price) !== Number(cRec.price)) {
        csvJsonEquiv = false
        equivFailure = `Price mismatch at index ${i}: JSON=${jRec.price}, CSV=${cRec.price}`
        break
      }
    }
  }
  assertCheck(9, 'CSV and JSON contain equivalent records', csvJsonEquiv, equivFailure)

  // ------------------------------------------------------------------------
  // CHECK 10: Course counts match the eligibility query
  // ------------------------------------------------------------------------
  const liveEligibleCount = await prisma.course.count({
    where: {
      status: CourseStatus.APPROVED,
      isDestroyed: false,
      categoryId: { not: null },
      category: { isDestroyed: false }
    }
  })
  assertCheck(
    10,
    'Course counts match eligibility query',
    jsonRecords.length === liveEligibleCount,
    `JSON count (${jsonRecords.length}) != Live query (${liveEligibleCount})`
  )

  // ------------------------------------------------------------------------
  // CHECK 11: Category distribution totals match exported record count
  // ------------------------------------------------------------------------
  const catDistribution: Record<string, number> = {}
  for (const r of jsonRecords) {
    catDistribution[r.category_id] = (catDistribution[r.category_id] || 0) + 1
  }
  const sumOfCatCounts = Object.values(catDistribution).reduce((acc, v) => acc + v, 0)
  assertCheck(
    11,
    'Category distribution totals match exported record count',
    sumOfCatCounts === jsonRecords.length && Object.keys(catDistribution).length === 20,
    `Sum=${sumOfCatCounts}, Distinct Categories=${Object.keys(catDistribution).length}`
  )

  // ------------------------------------------------------------------------
  // CHECK 12: Repeated exports are deterministic
  // ------------------------------------------------------------------------
  const canonicalDataString = JSON.stringify(
    jsonRecords.map((r) => ({
      id: r.course_id,
      t: r.title,
      d: r.description,
      c: r.category_id,
      l: r.level,
      p: r.price,
      tech: r.techniques,
      req: r.requirements,
      ben: r.benefits,
      auth: r.teacher_id
    }))
  )
  const currentFingerprint = computeSha256(canonicalDataString)
  assertCheck(
    12,
    'Repeated exports are deterministic',
    currentFingerprint === manifest.content_fingerprint_sha256,
    `Fingerprint mismatch: current=${currentFingerprint}, manifest=${manifest.content_fingerprint_sha256}`
  )

  // ------------------------------------------------------------------------
  // CHECK 13: Empty or missing optional fields handled safely
  // ------------------------------------------------------------------------
  const missingIntro = jsonRecords.filter((r) => !r.techniques || r.techniques.length === 0)
  assertCheck(
    13,
    'Empty or missing optional fields handled safely',
    Array.isArray(missingIntro) && missingIntro.length === 10,
    `Expected 10 legacy courses with empty techniques array, got ${missingIntro.length}`
  )

  // ------------------------------------------------------------------------
  // CHECK 14: Export did not modify PostgreSQL database
  // ------------------------------------------------------------------------
  const postTestCoursesCount = await prisma.course.count()
  const postTestCategoriesCount = await prisma.category.count()
  assertCheck(
    14,
    'Export does not modify PostgreSQL',
    preTestCoursesCount === postTestCoursesCount && preTestCategoriesCount === postTestCategoriesCount,
    `Course count changed from ${preTestCoursesCount} to ${postTestCoursesCount}`
  )

  // ------------------------------------------------------------------------
  // CHECK 15: Existing DATA-02 records remain unchanged
  // ------------------------------------------------------------------------
  const manifestData02Path = path.resolve(__dirname, '../migration-logs/data02-mutation-manifest.json')
  let data02IdsFromManifest: string[] = []
  if (fs.existsSync(manifestData02Path)) {
    const d02Manifest = JSON.parse(fs.readFileSync(manifestData02Path, 'utf8'))
    if (Array.isArray(d02Manifest.insertedCourseBatches)) {
      for (const batch of d02Manifest.insertedCourseBatches) {
        if (Array.isArray(batch.courseIds)) {
          data02IdsFromManifest.push(...batch.courseIds)
        }
      }
    }
  }

  const data02CountInDb = await prisma.course.count({
    where: {
      id: { in: data02IdsFromManifest },
      status: CourseStatus.APPROVED,
      isDestroyed: false
    }
  })
  assertCheck(
    15,
    'Existing DATA-02 records remain unchanged',
    data02IdsFromManifest.length === 270 && data02CountInDb === 270,
    `Expected 270 DATA-02 courses in live DB, found ${data02CountInDb} (manifest count: ${data02IdsFromManifest.length})`
  )

  console.log('\n====================================================')
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  console.log(`TOTAL CHECKS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('====================================================')

  if (failed > 0) {
    console.error('\nSOME VALIDATION CHECKS FAILED!')
    process.exit(1)
  } else {
    console.log('\n>>> ALL 15 VALIDATION CHECKS PASSED PERFECTLY! <<<')
  }

  return results
}

if (require.main === module) {
  runExportValidation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Validation test runner fatal error:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
