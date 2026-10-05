import { prisma, connectPrisma, disconnectPrisma } from '../src/config/prisma'
import { isValidUUID, normalizeUUID, withCompatId } from '../src/utils/uuid'
import { mapPrismaError } from '../src/utils/prismaError'
import { categoryRepository, userRepository } from '../src/repositories'
import * as directUserRepo from '../src/repositories/user.repository'
import * as directCategoryRepo from '../src/repositories/category.repository'

interface TestResult {
  suite: string
  name: string
  passed: boolean
  detail?: string
}

const results: TestResult[] = []

function assert(condition: boolean, suite: string, name: string, detail?: string) {
  if (condition) {
    results.push({ suite, name, passed: true })
    console.log(`  PASS: [${suite}] ${name}`)
  } else {
    results.push({ suite, name, passed: false, detail })
    console.error(` FAIL: [${suite}] ${name} - ${detail || 'Assertion failed'}`)
  }
}

async function runTests() {
  console.log('\n=================================================================')
  console.log(' PHASE 1 TEST SUITE: FUNCTIONAL REPOSITORY & PRISMA INFRASTRUCTURE')
  console.log('=================================================================\n')

  // -------------------------------------------------------------------------
  // TEST SUITE 1: PRISMA CLIENT INITIALIZATION & CONNECTION
  // -------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Connection & Initialization ---')
  try {
    await connectPrisma()
    const pgVersion: any = await prisma.$queryRaw`SELECT version();`
    assert(Array.isArray(pgVersion) && pgVersion.length > 0, 'Connection', 'PostgreSQL Handshake', 'Query executed')
  } catch (error: any) {
    assert(false, 'Connection', 'PostgreSQL Handshake', error.message)
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: UUID UTILITIES & FRONTEND COMPATIBILITY
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: UUID Utilities & Compatibility ---')
  const validV4 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const validV5 = 'c55de839-f059-519c-8820-b16aa17fb9c3' // Deterministic user UUID from Phase 1 migration
  const invalidObjectId = '68cade1dc90d6a22b6820cbc' // 24-hex Mongo ID
  const invalidRandom = 'invalid-uuid-string'

  assert(isValidUUID(validV4), 'UUID', 'Accept valid UUID v4')
  assert(isValidUUID(validV5), 'UUID', 'Accept valid UUID v5')
  assert(!isValidUUID(invalidObjectId), 'UUID', 'Reject 24-character MongoDB ObjectId')
  assert(!isValidUUID(invalidRandom), 'UUID', 'Reject malformed random string')
  assert(!isValidUUID(null), 'UUID', 'Reject null value')
  assert(!isValidUUID(12345), 'UUID', 'Reject number value')

  // Normalization
  try {
    const normalized = normalizeUUID('  A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11  ')
    assert(normalized === validV4.toLowerCase(), 'UUID', 'Normalize trimmed lowercase UUID')
  } catch (err: any) {
    assert(false, 'UUID', 'Normalize trimmed lowercase UUID', err.message)
  }

  try {
    normalizeUUID('invalid')
    assert(false, 'UUID', 'Throw on normalizing invalid UUID')
  } catch (err: any) {
    assert(true, 'UUID', 'Throw on normalizing invalid UUID')
  }

  // Frontend _id Compatibility
  const mockEntity = { id: validV5, name: 'Test Course' }
  const compatEntity = withCompatId(mockEntity)
  assert(compatEntity._id === validV5 && compatEntity.id === validV5, 'Compat', 'Decorate single entity with _id')

  const mockList = [{ id: validV4 }, { id: validV5 }]
  const compatList = withCompatId(mockList)
  assert(
    compatList.length === 2 && compatList[0]._id === validV4 && compatList[1]._id === validV5,
    'Compat',
    'Decorate array of entities with _id'
  )

  // -------------------------------------------------------------------------
  // TEST SUITE 3: FUNCTIONAL REPOSITORY & TRANSACTIONAL CRUD
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Functional Repository Architecture & Isolated CRUD ---')

  // Capture existing counts before testing to guarantee zero mutation
  const userCountBefore = await userRepository.countUsers()
  const categoryCountBefore = await categoryRepository.countCategories()
  console.log(`  [Data Check] Users before: ${userCountBefore}, Categories before: ${categoryCountBefore}`)

  // Run CRUD inside a transaction that is guaranteed to rollback
  let rollbackSucceeded = false
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Category Repository (Namespace import style)
      const testCategorySlug = `temp-test-category-${Date.now()}`
      const createdCategory = await categoryRepository.addCategory(
        {
          name: `Temp Test Category ${Date.now()}`,
          slug: testCategorySlug,
          description: 'Created during Phase 1 automated repository testing'
        },
        tx
      )
      assert(isValidUUID(createdCategory.id), 'FunctionalRepo', 'categoryRepository.addCategory generates valid UUID')
      assert(createdCategory.slug === testCategorySlug, 'FunctionalRepo', 'categoryRepository.addCategory populates fields')

      // FindCategoryById
      const foundCategory = await categoryRepository.findCategoryById(createdCategory.id, undefined, tx)
      assert(foundCategory !== null && foundCategory.id === createdCategory.id, 'FunctionalRepo', 'categoryRepository.findCategoryById resolves record')

      // FindCategoryBySlug (Domain-specific function)
      const foundSlug = await categoryRepository.findCategoryBySlug(testCategorySlug, tx)
      assert(foundSlug !== null && foundSlug.slug === testCategorySlug, 'FunctionalRepo', 'categoryRepository.findCategoryBySlug works')

      // UpdateCategory
      const updatedCategory = await categoryRepository.updateCategory(createdCategory.id, { description: 'Updated in test' }, tx)
      assert(updatedCategory.description === 'Updated in test', 'FunctionalRepo', 'categoryRepository.updateCategory updates fields')

      // SoftDeleteCategory (Domain-specific function)
      const softDeleted = await categoryRepository.softDeleteCategory(createdCategory.id, tx)
      assert(softDeleted.isDestroyed === true, 'FunctionalRepo', 'categoryRepository.softDeleteCategory sets isDestroyed')

      // RestoreCategory (Domain-specific function)
      const restored = await categoryRepository.restoreCategory(createdCategory.id, tx)
      assert(restored.isDestroyed === false, 'FunctionalRepo', 'categoryRepository.restoreCategory sets isDestroyed false')

      // DeleteCategory (Hard delete)
      const deletedCategory = await categoryRepository.deleteCategory(createdCategory.id, tx)
      assert(deletedCategory.id === createdCategory.id, 'FunctionalRepo', 'categoryRepository.deleteCategory removes record')

      const reFoundCategory = await categoryRepository.findCategoryById(createdCategory.id, undefined, tx)
      assert(reFoundCategory === null, 'FunctionalRepo', 'Category record is null after deletion')

      // 2. User Repository (Direct functional import style)
      const testEmail = `test-user-${Date.now()}@example.com`
      const testUsername = `tempuser_${Date.now()}`
      const createdUser = await directUserRepo.addUser(
        {
          username: testUsername,
          email: testEmail,
          password: 'hashed-test-password'
        },
        tx
      )
      assert(isValidUUID(createdUser.id), 'FunctionalRepo', 'directUserRepo.addUser creates user with valid UUID')

      // FindUserById
      const foundUser = await directUserRepo.findUserById(createdUser.id, undefined, tx)
      assert(foundUser !== null && foundUser.email === testEmail, 'FunctionalRepo', 'directUserRepo.findUserById finds user')

      // FindUserByEmail
      const foundByEmail = await directUserRepo.findUserByEmail(testEmail, tx)
      assert(foundByEmail !== null && foundByEmail.id === createdUser.id, 'FunctionalRepo', 'directUserRepo.findUserByEmail finds user')

      // IsUsernameTaken
      const taken = await directUserRepo.isUsernameTaken(testUsername, undefined, tx)
      assert(taken === true, 'FunctionalRepo', 'directUserRepo.isUsernameTaken returns true for existing user')

      // UpdateUser
      const updatedUser = await directUserRepo.updateUser(createdUser.id, { bio: 'Functional test bio' }, tx)
      assert(updatedUser.bio === 'Functional test bio', 'FunctionalRepo', 'directUserRepo.updateUser updates fields')

      // MarkUserAsVerified
      const verifiedUser = await directUserRepo.markUserAsVerified(createdUser.id, tx)
      assert(verifiedUser.isVerified === true, 'FunctionalRepo', 'directUserRepo.markUserAsVerified sets isVerified true')

      // DeleteUser
      const deletedUser = await directUserRepo.deleteUser(createdUser.id, tx)
      assert(deletedUser.id === createdUser.id, 'FunctionalRepo', 'directUserRepo.deleteUser deletes user')

      // Force intentional rollback
      throw new Error('INTENTIONAL_ROLLBACK_CONFIRMATION')
    })
  } catch (err: any) {
    if (err.message === 'INTENTIONAL_ROLLBACK_CONFIRMATION') {
      rollbackSucceeded = true
    } else {
      console.error('Unexpected error in repository transaction:', err)
    }
  }

  assert(rollbackSucceeded, 'FunctionalRepo', 'Transaction rollback executed cleanly')

  // Verify counts after test are 100% identical
  const userCountAfter = await userRepository.countUsers()
  const categoryCountAfter = await categoryRepository.countCategories()
  assert(userCountBefore === userCountAfter, 'Isolation', 'Zero user records mutated', `Count: ${userCountAfter}`)
  assert(
    categoryCountBefore === categoryCountAfter,
    'Isolation',
    'Zero category records mutated',
    `Count: ${categoryCountAfter}`
  )

  // -------------------------------------------------------------------------
  // TEST SUITE 4: PRISMA DATABASE ERROR HANDLING
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Prisma Database Error Mapping ---')

  // Test P2002: Unique constraint violation mapping
  try {
    await prisma.$transaction(async (tx) => {
      const duplicateSlug = `dup-slug-${Date.now()}`
      await tx.category.create({
        data: { name: `Name 1 ${Date.now()}`, slug: duplicateSlug }
      })
      // Trigger duplicate slug violation
      await tx.category.create({
        data: { name: `Name 2 ${Date.now()}`, slug: duplicateSlug }
      })
    })
  } catch (err: any) {
    const mapped = mapPrismaError(err)
    assert(mapped !== null, 'ErrorMapping', 'Intercept Prisma P2002 Unique Violation')
    assert(mapped?.statusCode === 409, 'ErrorMapping', 'Map P2002 to HTTP 409 Conflict')
    assert(mapped?.errorCode === 'P2002_UNIQUE_VIOLATION', 'ErrorMapping', 'Set proper errorCode')
  }

  // Test P2025: Record not found mapping
  try {
    await categoryRepository.deleteCategory('00000000-0000-0000-0000-000000000000')
  } catch (err: any) {
    const mapped = mapPrismaError(err)
    assert(mapped !== null, 'ErrorMapping', 'Intercept Prisma P2025 Record Not Found')
    assert(mapped?.statusCode === 404, 'ErrorMapping', 'Map P2025 to HTTP 404 Not Found')
    assert(mapped?.errorCode === 'P2025_RECORD_NOT_FOUND', 'ErrorMapping', 'Set proper errorCode')
  }

  // Test Foreign Key Violation P2003
  try {
    await prisma.$transaction(async (tx) => {
      await tx.course.create({
        data: {
          title: 'Orphan Course Test',
          slug: `orphan-course-${Date.now()}`,
          authorId: '00000000-0000-0000-0000-000000000000' // Non-existent user
        }
      })
    })
  } catch (err: any) {
    const mapped = mapPrismaError(err)
    assert(mapped !== null, 'ErrorMapping', 'Intercept Prisma P2003 Foreign Key Violation')
    assert(mapped?.statusCode === 400, 'ErrorMapping', 'Map P2003 to HTTP 400 Bad Request')
    assert(mapped?.errorCode === 'P2003_FOREIGN_KEY_VIOLATION', 'ErrorMapping', 'Set proper errorCode')
  }

  // -------------------------------------------------------------------------
  // FINAL REPORT & CLEANUP
  // -------------------------------------------------------------------------
  await disconnectPrisma()

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length

  console.log('\n=================================================================')
  console.log(` SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (${results.length} total)`)
  console.log('=================================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err)
  process.exit(1)
})
