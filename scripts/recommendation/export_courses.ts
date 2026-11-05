import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { CourseLevel, CourseStatus, CourseType, Prisma } from '@prisma/client'
import { prisma } from '../../src/config/prisma'

export interface ExportedCourseRecord {
  course_id: string
  title: string
  slug: string
  description: string
  category_id: string
  category_name: string
  category_slug: string
  level: CourseLevel
  type: CourseType
  price: number
  old_price: number
  techniques: string[]
  requirements: string[]
  benefits: string[]
  teacher_id: string
  teacher_name: string
  created_at: string
  updated_at: string
}

export interface ExportManifest {
  manifest_version: string
  dataset_version: string
  exported_at: string
  source_database: {
    engine: string
    database_name: string
    host_obfuscated: string
  }
  export_script: {
    name: string
    version: string
  }
  eligibility_policy: {
    status: string
    is_destroyed: boolean
    category_is_destroyed: boolean
    category_id_required: boolean
    description: string
  }
  record_counts: {
    total_eligible_courses: number
    represented_categories: number
    active_categories_in_db: number
    free_courses: number
    paid_courses: number
  }
  field_mapping: Record<string, { prisma_model: string; prisma_field: string; data_type: string; nullability: string }>
  null_statistics: Record<string, number>
  content_fingerprint_sha256: string
  files: {
    csv: {
      path: string
      size_bytes: number
      sha256: string
    }
    json: {
      path: string
      size_bytes: number
      sha256: string
    }
  }
  warnings: string[]
}

// Convert a row into RFC 4180 compliant CSV line
function formatCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""'
  let str: string
  if (Array.isArray(val)) {
    str = JSON.stringify(val)
  } else if (typeof val === 'object') {
    str = JSON.stringify(val)
  } else {
    str = String(val)
  }
  // Escape quotes
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

export function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

export async function runDatasetExport() {
  console.log('====================================================')
  console.log('       REC-01: DETERMINISTIC DATASET EXPORT')
  console.log('====================================================\n')

  const startTime = Date.now()

  // 1. Fetch eligible records using the verified eligibility policy
  // Strict Read-Only Query
  const courses = await prisma.course.findMany({
    where: {
      status: CourseStatus.APPROVED,
      isDestroyed: false,
      categoryId: { not: null },
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
          username: true
        }
      }
    },
    orderBy: {
      id: 'asc' // Deterministic sorting by primary key UUID
    }
  })

  console.log(`Fetched ${courses.length} eligible course records from PostgreSQL.`)

  // 2. Map to standard export schema
  const exportedRecords: ExportedCourseRecord[] = courses.map((c) => ({
    course_id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    category_id: c.categoryId!,
    category_name: c.category?.name || '',
    category_slug: c.category?.slug || '',
    level: c.level,
    type: c.type,
    price: Number(c.price),
    old_price: Number(c.oldPrice),
    techniques: Array.isArray(c.techniques) ? c.techniques : [],
    requirements: Array.isArray(c.requirements) ? c.requirements : [],
    benefits: Array.isArray(c.benefits) ? c.benefits : [],
    teacher_id: c.authorId,
    teacher_name: c.author?.username || '',
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString()
  }))

  // 3. Compute deterministic content fingerprint (excluding volatile metadata)
  const canonicalDataString = JSON.stringify(
    exportedRecords.map((r) => ({
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
  const contentFingerprint = computeSha256(canonicalDataString)
  console.log(`Computed Content Fingerprint (SHA-256): ${contentFingerprint}`)

  // 4. Directory preparation
  const rawDir = path.resolve(__dirname, '../../data/recommendation/raw')
  const baseDir = path.resolve(__dirname, '../../data/recommendation')
  if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true })

  const jsonFilePath = path.join(rawDir, 'courses.json')
  const csvFilePath = path.join(rawDir, 'courses.csv')
  const manifestFilePath = path.join(baseDir, 'manifest.json')

  // 5. Generate JSON Export (UTF-8, formatted with 2 spaces)
  const jsonContent = JSON.stringify(exportedRecords, null, 2) + '\n'
  fs.writeFileSync(jsonFilePath, jsonContent, 'utf8')
  console.log(`  ✓ Written JSON: ${jsonFilePath} (${Buffer.byteLength(jsonContent, 'utf8')} bytes)`)

  // 6. Generate CSV Export (RFC 4180 compliant)
  const headers = [
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

  const csvRows: string[] = [headers.join(',')]
  for (const r of exportedRecords) {
    const row = [
      formatCsvField(r.course_id),
      formatCsvField(r.title),
      formatCsvField(r.slug),
      formatCsvField(r.description),
      formatCsvField(r.category_id),
      formatCsvField(r.category_name),
      formatCsvField(r.category_slug),
      formatCsvField(r.level),
      formatCsvField(r.type),
      formatCsvField(r.price),
      formatCsvField(r.old_price),
      formatCsvField(r.techniques),
      formatCsvField(r.requirements),
      formatCsvField(r.benefits),
      formatCsvField(r.teacher_id),
      formatCsvField(r.teacher_name),
      formatCsvField(r.created_at),
      formatCsvField(r.updated_at)
    ]
    csvRows.push(row.join(','))
  }
  const csvContent = csvRows.join('\r\n') + '\r\n'
  fs.writeFileSync(csvFilePath, csvContent, 'utf8')
  console.log(`  ✓ Written CSV: ${csvFilePath} (${Buffer.byteLength(csvContent, 'utf8')} bytes)`)

  // 7. Calculate file hashes
  const jsonSha256 = computeSha256(jsonContent)
  const csvSha256 = computeSha256(csvContent)

  // 8. Calculate null / empty statistics
  const nullStats: Record<string, number> = {
    empty_description: 0,
    empty_techniques: 0,
    empty_requirements: 0,
    empty_benefits: 0
  }
  for (const r of exportedRecords) {
    if (!r.description || r.description.trim() === '') nullStats.empty_description++
    if (!r.techniques || r.techniques.length === 0) nullStats.empty_techniques++
    if (!r.requirements || r.requirements.length === 0) nullStats.empty_requirements++
    if (!r.benefits || r.benefits.length === 0) nullStats.empty_benefits++
  }

  const uniqueCategories = new Set(exportedRecords.map((r) => r.category_id))
  const freeCount = exportedRecords.filter((r) => r.type === CourseType.FREE || r.price === 0).length

  // 9. Generate Manifest
  const manifest: ExportManifest = {
    manifest_version: '1.0.0',
    dataset_version: '1.0.0',
    exported_at: new Date().toISOString(),
    source_database: {
      engine: 'PostgreSQL 16.11',
      database_name: 'tmdemy',
      host_obfuscated: 'localhost:5432 (local development)'
    },
    export_script: {
      name: 'scripts/recommendation/export_courses.ts',
      version: '1.0.0'
    },
    eligibility_policy: {
      status: 'APPROVED',
      is_destroyed: false,
      category_is_destroyed: false,
      category_id_required: true,
      description: 'Active approved courses belonging to active, non-destroyed categories.'
    },
    record_counts: {
      total_eligible_courses: exportedRecords.length,
      represented_categories: uniqueCategories.size,
      active_categories_in_db: 22,
      free_courses: freeCount,
      paid_courses: exportedRecords.length - freeCount
    },
    field_mapping: {
      course_id: { prisma_model: 'Course', prisma_field: 'id', data_type: 'UUID (string)', nullability: 'NOT NULL' },
      title: { prisma_model: 'Course', prisma_field: 'title', data_type: 'VarChar(255)', nullability: 'NOT NULL' },
      slug: { prisma_model: 'Course', prisma_field: 'slug', data_type: 'VarChar(255)', nullability: 'NOT NULL' },
      description: { prisma_model: 'Course', prisma_field: 'description', data_type: 'Text', nullability: 'NOT NULL' },
      category_id: { prisma_model: 'Course', prisma_field: 'categoryId', data_type: 'UUID (string)', nullability: 'NOT NULL' },
      category_name: { prisma_model: 'Category', prisma_field: 'name', data_type: 'VarChar(200)', nullability: 'NOT NULL' },
      category_slug: { prisma_model: 'Category', prisma_field: 'slug', data_type: 'VarChar(250)', nullability: 'NOT NULL' },
      level: { prisma_model: 'Course', prisma_field: 'level', data_type: 'CourseLevel (enum)', nullability: 'NOT NULL' },
      type: { prisma_model: 'Course', prisma_field: 'type', data_type: 'CourseType (enum)', nullability: 'NOT NULL' },
      price: { prisma_model: 'Course', prisma_field: 'price', data_type: 'Decimal(12,2) -> number', nullability: 'NOT NULL' },
      old_price: { prisma_model: 'Course', prisma_field: 'oldPrice', data_type: 'Decimal(12,2) -> number', nullability: 'NOT NULL' },
      techniques: { prisma_model: 'Course', prisma_field: 'techniques', data_type: 'String[]', nullability: 'NOT NULL' },
      requirements: { prisma_model: 'Course', prisma_field: 'requirements', data_type: 'String[]', nullability: 'NOT NULL' },
      benefits: { prisma_model: 'Course', prisma_field: 'benefits', data_type: 'String[]', nullability: 'NOT NULL' },
      teacher_id: { prisma_model: 'Course', prisma_field: 'authorId', data_type: 'UUID (string)', nullability: 'NOT NULL' },
      teacher_name: { prisma_model: 'User', prisma_field: 'username', data_type: 'VarChar(100)', nullability: 'NOT NULL' },
      created_at: { prisma_model: 'Course', prisma_field: 'createdAt', data_type: 'DateTime -> ISO 8601 string', nullability: 'NOT NULL' },
      updated_at: { prisma_model: 'Course', prisma_field: 'updatedAt', data_type: 'DateTime -> ISO 8601 string', nullability: 'NOT NULL' }
    },
    null_statistics: nullStats,
    content_fingerprint_sha256: contentFingerprint,
    files: {
      csv: {
        path: 'data/recommendation/raw/courses.csv',
        size_bytes: Buffer.byteLength(csvContent, 'utf8'),
        sha256: csvSha256
      },
      json: {
        path: 'data/recommendation/raw/courses.json',
        size_bytes: Buffer.byteLength(jsonContent, 'utf8'),
        sha256: jsonSha256
      }
    },
    warnings: [
      'Two approved courses excluded from dataset: 1 soft-deleted course (19253682-4aa1-51c7-82cc-076d6c37772c) and 1 course with null categoryId (fdf556cd-89f3-4aad-a041-cb74fdc2a0f2).',
      'One duplicate title pair detected between legacy and DATA-02 cohorts: "Giám Sát Hệ Thống Toàn Diện Với Prometheus và Grafana".',
      'Legacy descriptions are short (mean ~25 words) while DATA-02 descriptions are comprehensive (mean ~308 words).'
    ]
  }

  fs.writeFileSync(manifestFilePath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  console.log(`  ✓ Written Manifest: ${manifestFilePath}`)
  console.log(`\nExport completed in ${Date.now() - startTime}ms.`)

  return manifest
}

if (require.main === module) {
  runDatasetExport()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Export failed with error:', err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

