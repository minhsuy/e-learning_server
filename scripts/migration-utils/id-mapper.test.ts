import assert from 'assert'
import {
  toPostgresUuid,
  toSubEntityUuid,
  resolveNotificationRelatedId,
  MIGRATION_ENTITIES,
  DEFAULT_PROJECT_NAMESPACE,
  InvalidEntityError,
  MissingSourceIdError,
  InvalidSourceIdError,
  InvalidNamespaceError,
  getProjectNamespace
} from './id-mapper'

const SAMPLE_ID_1 = '68dcf8f9e3617ec76053b4d7'
const SAMPLE_ID_2 = '68d3f862e710d52ff77262a7'

let totalTests = 0
let passedTests = 0

function test(description: string, fn: () => void) {
  totalTests++
  try {
    fn()
    passedTests++
    console.log(`  ✔ [PASS] ${description}`)
  } catch (error) {
    console.error(`  ✖ [FAIL] ${description}`)
    console.error(error)
    process.exitCode = 1
  }
}

console.log('\n=============================================')
console.log(' RUNNING ID MAPPER UNIT TESTS (TEST MATRIX) ')
console.log('=============================================\n')

// -------------------------------------------------------------
// GROUP 1: CORE TEST MATRIX
// -------------------------------------------------------------
console.log('--- Group 1: Core Test Matrix ---')

test('Test 1 — Deterministic: Same entity + same ObjectId must produce the same UUID', () => {
  const uuid1 = toPostgresUuid('users', SAMPLE_ID_1)
  const uuid2 = toPostgresUuid('users', SAMPLE_ID_1)
  assert.strictEqual(uuid1, uuid2)
  assert.match(uuid1, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})

test('Test 2 — Entity Isolation: Different entities with same ObjectId must produce different UUIDs', () => {
  const userUuid = toPostgresUuid('users', SAMPLE_ID_1)
  const courseUuid = toPostgresUuid('courses', SAMPLE_ID_1)
  const orderUuid = toPostgresUuid('orders', SAMPLE_ID_1)

  assert.notStrictEqual(userUuid, courseUuid)
  assert.notStrictEqual(userUuid, orderUuid)
  assert.notStrictEqual(courseUuid, orderUuid)
})

test('Test 3 — Different ObjectId: Different ObjectIds on same entity must produce different UUIDs', () => {
  const uuidA = toPostgresUuid('courses', SAMPLE_ID_1)
  const uuidB = toPostgresUuid('courses', SAMPLE_ID_2)
  assert.notStrictEqual(uuidA, uuidB)
})

test('Test 4 — Case Normalization: Uppercase/lowercase/mixed ObjectId must produce the exact same UUID', () => {
  const lower = toPostgresUuid('users', '68dcf8f9e3617ec76053b4d7')
  const upper = toPostgresUuid('users', '68DCF8F9E3617EC76053B4D7')
  const mixed = toPostgresUuid('users', '68Dcf8F9e3617eC76053b4d7')
  assert.strictEqual(lower, upper)
  assert.strictEqual(lower, mixed)
})

test('Test 5 — Entity Whitelist: Non-whitelisted entity must throw InvalidEntityError', () => {
  assert.throws(
    () => toPostgresUuid('invalid_table_name' as any, SAMPLE_ID_1),
    (err: unknown) => err instanceof InvalidEntityError
  )
})

test('Test 6 — Missing Source ID: null, undefined, empty, or whitespace-only must throw MissingSourceIdError', () => {
  assert.throws(
    () => toPostgresUuid('users', null),
    (err: unknown) => err instanceof MissingSourceIdError
  )
  assert.throws(
    () => toPostgresUuid('users', undefined),
    (err: unknown) => err instanceof MissingSourceIdError
  )
  assert.throws(
    () => toPostgresUuid('users', ''),
    (err: unknown) => err instanceof MissingSourceIdError
  )
  assert.throws(
    () => toPostgresUuid('users', '   \t\n  '),
    (err: unknown) => err instanceof MissingSourceIdError
  )
})

test('Test 7 — Sub-entity Determinism: Same parent ID + same suffix must produce identical UUIDs', () => {
  const uuid1 = toSubEntityUuid('question_options', SAMPLE_ID_1, 0)
  const uuid2 = toSubEntityUuid('question_options', SAMPLE_ID_1, 0)
  assert.strictEqual(uuid1, uuid2)
})

test('Test 8 — Sub-entity Distinct: Different suffixes under same parent must produce different UUIDs', () => {
  const opt0 = toSubEntityUuid('question_options', SAMPLE_ID_1, 0)
  const opt1 = toSubEntityUuid('question_options', SAMPLE_ID_1, 1)
  const opt2 = toSubEntityUuid('question_options', SAMPLE_ID_1, 'custom_key')
  assert.notStrictEqual(opt0, opt1)
  assert.notStrictEqual(opt1, opt2)
})

test('Test 8b — Sub-entity comment_reactions: Deterministic UUID from commentId and userId', () => {
  const commentId = '68ecccf11ad0a8e2a36f9913'
  const userId = '68dcf8f9e3617ec76053b4d7'
  const uuid1 = toSubEntityUuid('comment_reactions', commentId, userId)
  const uuid2 = toSubEntityUuid('comment_reactions', commentId, userId)
  assert.strictEqual(uuid1, uuid2)
  assert.match(uuid1, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})

test('Test 9 — Notification Order: type=order with valid ObjectId resolves to orders UUID', () => {
  const expectedUuid = toPostgresUuid('orders', SAMPLE_ID_1)
  const resolved = resolveNotificationRelatedId('order', SAMPLE_ID_1)
  assert.strictEqual(resolved, expectedUuid)
})

test('Test 10 — Notification Non-ObjectId: arbitrary string is preserved untouched', () => {
  const rawAnnouncement = 'SYSTEM_ANNOUNCEMENT_2026'
  const resolved = resolveNotificationRelatedId('system', rawAnnouncement)
  assert.strictEqual(resolved, rawAnnouncement)

  const numericCode = '123456'
  assert.strictEqual(resolveNotificationRelatedId('order', numericCode), numericCode)
})

// -------------------------------------------------------------
// GROUP 2: EXTENDED VALIDATION & EDGE CASES
// -------------------------------------------------------------
console.log('\n--- Group 2: Extended Validation & Edge Cases ---')

test('Test 11 — ObjectId Object vs String: Mock Types.ObjectId object matches plain string', () => {
  const mockObjectId = {
    toHexString: () => SAMPLE_ID_1,
    toString: () => SAMPLE_ID_1
  }
  const fromObj = toPostgresUuid('users', mockObjectId)
  const fromStr = toPostgresUuid('users', SAMPLE_ID_1)
  assert.strictEqual(fromObj, fromStr)
})

test('Test 12 — Whitespace trimming: Leading/trailing whitespace is trimmed before hashing', () => {
  const clean = toPostgresUuid('courses', SAMPLE_ID_2)
  const padded = toPostgresUuid('courses', `  ${SAMPLE_ID_2}  \n`)
  assert.strictEqual(clean, padded)
})

test('Test 13 — Invalid ObjectId format: Non-24 hex string throws InvalidSourceIdError', () => {
  // Too short (23 chars)
  assert.throws(
    () => toPostgresUuid('users', '68dcf8f9e3617ec76053b4d'),
    (err: unknown) => err instanceof InvalidSourceIdError
  )
  // Non-hex characters
  assert.throws(
    () => toPostgresUuid('users', '68dcf8f9e3617ec76053b4z9'),
    (err: unknown) => err instanceof InvalidSourceIdError
  )
  // Too long (25 chars)
  assert.throws(
    () => toPostgresUuid('users', '68dcf8f9e3617ec76053b4d7a'),
    (err: unknown) => err instanceof InvalidSourceIdError
  )
})

test('Test 14 — All 23 Entities: Every entity in MIGRATION_ENTITIES generates valid UUID v5', () => {
  assert.strictEqual(MIGRATION_ENTITIES.length, 23)
  for (const entity of MIGRATION_ENTITIES) {
    const uuid = toPostgresUuid(entity, SAMPLE_ID_1)
    assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  }
})

test('Test 15 — Notification Polymorphic Types: All registered types resolve to correct entity UUID', () => {
  assert.strictEqual(resolveNotificationRelatedId('order', SAMPLE_ID_1), toPostgresUuid('orders', SAMPLE_ID_1))
  assert.strictEqual(resolveNotificationRelatedId('rating', SAMPLE_ID_1), toPostgresUuid('ratings', SAMPLE_ID_1))
  assert.strictEqual(resolveNotificationRelatedId('quiz', SAMPLE_ID_1), toPostgresUuid('quiz_submissions', SAMPLE_ID_1))
  assert.strictEqual(resolveNotificationRelatedId('course', SAMPLE_ID_1), toPostgresUuid('courses', SAMPLE_ID_1))
  assert.strictEqual(resolveNotificationRelatedId('lesson', SAMPLE_ID_1), toPostgresUuid('lessons', SAMPLE_ID_1))
  assert.strictEqual(resolveNotificationRelatedId('comment', SAMPLE_ID_1), toPostgresUuid('lessons', SAMPLE_ID_1))
  assert.strictEqual(
    resolveNotificationRelatedId('comment_reply', SAMPLE_ID_1),
    toPostgresUuid('lessons', SAMPLE_ID_1)
  )
  assert.strictEqual(resolveNotificationRelatedId('message', SAMPLE_ID_1), toPostgresUuid('messages', SAMPLE_ID_1))

  // Null / empty cases
  assert.strictEqual(resolveNotificationRelatedId('order', null), null)
  assert.strictEqual(resolveNotificationRelatedId('order', undefined), null)
  assert.strictEqual(resolveNotificationRelatedId('order', ''), null)
  assert.strictEqual(resolveNotificationRelatedId('order', '   '), null)
})

test('Test 16 — Environment Namespace Override: Valid env UUID overrides namespace, invalid throws', () => {
  const originalEnv = process.env.MIGRATION_UUID_NAMESPACE
  try {
    // 1. Default namespace
    delete process.env.MIGRATION_UUID_NAMESPACE
    assert.strictEqual(getProjectNamespace(), DEFAULT_PROJECT_NAMESPACE)

    // 2. Custom valid namespace
    const customNamespace = '11111111-2222-4333-8444-555555555555'
    process.env.MIGRATION_UUID_NAMESPACE = customNamespace
    assert.strictEqual(getProjectNamespace(), customNamespace)

    const uuidWithCustom = toPostgresUuid('users', SAMPLE_ID_1)
    delete process.env.MIGRATION_UUID_NAMESPACE
    const uuidWithDefault = toPostgresUuid('users', SAMPLE_ID_1)
    assert.notStrictEqual(uuidWithCustom, uuidWithDefault)

    // 3. Invalid namespace in env must throw InvalidNamespaceError
    process.env.MIGRATION_UUID_NAMESPACE = 'not-a-valid-uuid'
    assert.throws(
      () => getProjectNamespace(),
      (err: unknown) => err instanceof InvalidNamespaceError
    )
  } finally {
    if (originalEnv !== undefined) {
      process.env.MIGRATION_UUID_NAMESPACE = originalEnv
    } else {
      delete process.env.MIGRATION_UUID_NAMESPACE
    }
  }
})

console.log('\n=============================================')
console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED `)
console.log('=============================================\n')

if (passedTests !== totalTests) {
  process.exit(1)
}
