import crypto from 'crypto'

/**
 * Danh sách entity scope hợp lệ tương ứng với các bảng PostgreSQL đích.
 * (Các bảng trung gian composite PK như coupon_courses, conversation_participants, message_reads
 * không có UUID riêng nên không nằm trong danh sách này).
 */
export const MIGRATION_ENTITIES = [
  'users',
  'categories',
  'courses',
  'course_faqs',
  'chapters',
  'lessons',
  'quizzes',
  'questions',
  'question_options',
  'quiz_submissions',
  'quiz_submission_answers',
  'orders',
  'coupons',
  'enrollments',
  'progress',
  'certificates',
  'ratings',
  'favorite_courses',
  'comments',
  'comment_reactions',
  'conversations',
  'messages',
  'notifications'
] as const

export type MigrationEntity = (typeof MIGRATION_ENTITIES)[number]

const ENTITY_SET = new Set<string>(MIGRATION_ENTITIES)

/**
 * Namespace cố định của dự án đã được phê duyệt trong UUID_MAPPING_DECISION.md
 */
export const DEFAULT_PROJECT_NAMESPACE = '7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c'

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const MONGO_OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

// ==========================================
// CUSTOM ERROR CLASSES
// ==========================================

export class InvalidEntityError extends Error {
  constructor(entity: string) {
    super(`Invalid entity scope "${entity}". Must be one of the approved entities:\n  ${MIGRATION_ENTITIES.join(', ')}`)
    this.name = 'InvalidEntityError'
  }
}

export class MissingSourceIdError extends Error {
  constructor(entity: string) {
    super(`Source ID for entity "${entity}" is missing, empty, or contains only whitespace.`)
    this.name = 'MissingSourceIdError'
  }
}

export class InvalidSourceIdError extends Error {
  constructor(entity: string, sourceId: string) {
    super(`Invalid MongoDB ObjectId "${sourceId}" for entity "${entity}". Must be a 24-character hexadecimal string.`)
    this.name = 'InvalidSourceIdError'
  }
}

export class InvalidNamespaceError extends Error {
  constructor(namespace: string) {
    super(
      `Invalid UUID namespace configured in MIGRATION_UUID_NAMESPACE: "${namespace}". Must be a valid 36-character canonical UUID.`
    )
    this.name = 'InvalidNamespaceError'
  }
}

// ==========================================
// CORE HELPERS
// ==========================================

/**
 * Lấy namespace UUID đang hoạt động.
 * Mặc định sử dụng DEFAULT_PROJECT_NAMESPACE.
 * Nếu có biến môi trường MIGRATION_UUID_NAMESPACE, bắt buộc phải là UUID hợp lệ,
 * nếu không hợp lệ sẽ ném lỗi InvalidNamespaceError (không silently fallback).
 */
export function getProjectNamespace(): string {
  const envNamespace = process.env.MIGRATION_UUID_NAMESPACE
  if (envNamespace !== undefined && envNamespace !== '') {
    const trimmed = envNamespace.trim()
    if (!UUID_REGEX.test(trimmed)) {
      throw new InvalidNamespaceError(envNamespace)
    }
    return trimmed.toLowerCase()
  }
  return DEFAULT_PROJECT_NAMESPACE
}

/**
 * Sinh UUID v5 theo chuẩn RFC 4122 sử dụng Node.js native crypto.
 * Thuật toán: SHA-1(namespaceBytes || nameBytes), set version 5 và variant RFC 4122.
 */
export function generateUuidV5(namespace: string, name: string): string {
  const nsClean = namespace.replace(/-/g, '')
  const nsBuffer = Buffer.from(nsClean, 'hex')
  const nameBuffer = Buffer.from(name, 'utf8')

  const hash = crypto.createHash('sha1').update(nsBuffer).update(nameBuffer).digest()

  const bytes = Buffer.alloc(16)
  hash.copy(bytes, 0, 0, 16)

  // Set version 5 (0101b in high 4 bits of byte 6)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  // Set variant RFC 4122 (10xxb in high 2 bits of byte 8)
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString('hex')
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-')
}

/**
 * Chuyển đổi sourceId (dạng string hoặc ObjectId object) thành chuỗi trần.
 */
function extractSourceIdString(sourceId: unknown): string {
  if (sourceId === null || sourceId === undefined) {
    return ''
  }
  if (typeof sourceId === 'object' && 'toHexString' in (sourceId as Record<string, unknown>)) {
    return (sourceId as { toHexString(): string }).toHexString()
  }
  return String(sourceId)
}

// ==========================================
// PUBLIC API
// ==========================================

/**
 * Chuyển đổi MongoDB ObjectId thành PostgreSQL UUID v5 tất định theo Entity Scope.
 * Canonical key: "<entity>:<normalized_source_id>"
 *
 * @param entity Tên bảng PostgreSQL thuộc whitelist
 * @param sourceId MongoDB ObjectId (chuỗi 24 hex hoặc Types.ObjectId)
 * @returns PostgreSQL UUID dạng xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function toPostgresUuid(entity: MigrationEntity | string, sourceId: unknown): string {
  // 1. Validate Entity Whitelist
  if (!ENTITY_SET.has(entity)) {
    throw new InvalidEntityError(entity)
  }

  // 2. Extract & Validate Source ID Presence
  const rawId = extractSourceIdString(sourceId).trim()
  if (rawId.length === 0) {
    throw new MissingSourceIdError(entity)
  }

  // 3. Validate MongoDB ObjectId Format (24 hex characters)
  if (!MONGO_OBJECT_ID_REGEX.test(rawId)) {
    throw new InvalidSourceIdError(entity, rawId)
  }

  const normalizedId = rawId.toLowerCase()
  const canonicalKey = `${entity}:${normalizedId}`
  const namespace = getProjectNamespace()

  return generateUuidV5(namespace, canonicalKey)
}

/**
 * Sinh UUID v5 cho các sub-entity dựa vào Parent ID và chỉ mục/hậu tố.
 * Dùng cho các thực thể mảng như question_options (index), course_faqs (index nếu không có _id).
 * Canonical key: "<entity>:<normalized_parent_id>:<normalized_suffix>"
 *
 * @param entity Tên bảng PostgreSQL thuộc whitelist
 * @param parentId MongoDB ObjectId của thực thể cha
 * @param suffix Index dạng số hoặc chuỗi phân biệt (ví dụ: 0, 1, 2)
 */
export function toSubEntityUuid(entity: MigrationEntity | string, parentId: unknown, suffix: string | number): string {
  // 1. Validate Entity Whitelist
  if (!ENTITY_SET.has(entity)) {
    throw new InvalidEntityError(entity)
  }

  // 2. Extract & Validate Parent ID
  const rawParentId = extractSourceIdString(parentId).trim()
  if (rawParentId.length === 0) {
    throw new MissingSourceIdError(entity)
  }
  if (!MONGO_OBJECT_ID_REGEX.test(rawParentId)) {
    throw new InvalidSourceIdError(entity, rawParentId)
  }

  // 3. Validate Suffix
  if (suffix === null || suffix === undefined || String(suffix).trim().length === 0) {
    throw new Error(`Suffix for sub-entity "${entity}" under parent "${rawParentId}" is required.`)
  }

  const normalizedParentId = rawParentId.toLowerCase()
  const normalizedSuffix = String(suffix).trim().toLowerCase()
  const canonicalKey = `${entity}:${normalizedParentId}:${normalizedSuffix}`
  const namespace = getProjectNamespace()

  return generateUuidV5(namespace, canonicalKey)
}

/**
 * Phân giải polymorphic relatedId của Notification sang PostgreSQL UUID tương ứng.
 * Nếu relatedId rỗng -> trả về null.
 * Nếu relatedId không phải ObjectId 24 hex -> giữ nguyên chuỗi gốc.
 * Nếu là ObjectId -> ánh xạ theo notification type.
 *
 * @param type Loại notification (order, rating, quiz, course, lesson, comment, message...)
 * @param relatedId Giá trị chuỗi relatedId từ MongoDB document
 */
export function resolveNotificationRelatedId(
  type: string | undefined | null,
  relatedId: string | undefined | null
): string | null {
  if (relatedId === null || relatedId === undefined) {
    return null
  }

  const trimmed = String(relatedId).trim()
  if (trimmed.length === 0) {
    return null
  }

  // Nếu không phải 24 hex ObjectId thì bảo toàn nguyên dạng chuỗi
  if (!MONGO_OBJECT_ID_REGEX.test(trimmed)) {
    return trimmed
  }

  const normalizedType = String(type ?? '')
    .trim()
    .toLowerCase()

  switch (normalizedType) {
    case 'order':
      return toPostgresUuid('orders', trimmed)
    case 'rating':
      return toPostgresUuid('ratings', trimmed)
    case 'quiz':
      return toPostgresUuid('quiz_submissions', trimmed)
    case 'course':
      return toPostgresUuid('courses', trimmed)
    case 'lesson':
      return toPostgresUuid('lessons', trimmed)
    case 'comment':
    case 'comment_reply':
      // Business logic in comment.service.ts stores lesson ID in relatedId so notification clicks navigate to the lesson
      return toPostgresUuid('lessons', trimmed)
    case 'message':
      return toPostgresUuid('messages', trimmed)
    default:
      // Các type không tham chiếu bảng cụ thể (ví dụ: system, v.v.)
      return trimmed
  }
}
