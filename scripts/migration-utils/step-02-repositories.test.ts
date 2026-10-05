/**
 * TMDEMY — PHASE 2 STEP 2 TEST SUITE
 * Functional User Repository & Category Repository Verification
 *
 * File: scripts/migration-utils/step-02-repositories.test.ts
 */

import { prisma, connectPrisma, disconnectPrisma } from '../../src/config/prisma'
import {
  // User repository functions & constants
  addUser,
  findUserById,
  findUserPublicById,
  findUserInternalById,
  findUserByEmail,
  findUserPublicByEmail,
  findUserByUsername,
  findUserByEmailOrUsername,
  findUserWithCredentials,
  findUserByResetToken,
  isUsernameTaken,
  isEmailTaken,
  findUserConflict,
  findAllUsers,
  findUsersWithPagination,
  countUsers,
  countAdminsExcluding,
  findActiveTeachers,
  findTeachersWithPagination,
  updateUser,
  updateRefreshToken,
  markUserAsVerified,
  deleteUser,
  deleteUnverifiedUsersBeforeCutoff,
  MIGRATION_CUTOFF_DATE,
  USER_PUBLIC_SELECT,
  USER_COMPACT_SELECT,
  USER_ADMIN_SELECT,
  USER_AUTH_SELECT,
  USER_INTERNAL_SELECT,
  TEACHER_PUBLIC_SELECT,
  // Category repository functions & constants
  addCategory,
  findCategoryById,
  findCategoryBySlug,
  findCategoryByName,
  isCategoryNameTaken,
  isCategorySlugTaken,
  findAllCategories,
  findActiveCategories,
  findCategoriesWithPagination,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  deleteCategory,
  countCategories,
  CATEGORY_PUBLIC_SELECT,
  CATEGORY_ADMIN_SELECT
} from '../../src/repositories'
import { UserRole, UserStatus } from '@prisma/client'
import { isValidUUID } from '../../src/utils/uuid'

interface TestCaseResult {
  group: string
  name: string
  passed: boolean
  detail?: string
}

const testResults: TestCaseResult[] = []

function assert(condition: boolean, group: string, name: string, detail?: string) {
  if (condition) {
    testResults.push({ group, name, passed: true })
    console.log(`  PASSED: [${group}] ${name}`)
  } else {
    testResults.push({ group, name, passed: false, detail })
    console.error(`❌ FAILED: [${group}] ${name} - ${detail || 'Assertion failed'}`)
  }
}

async function runStep02TestSuite() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 2 STEP 2 — FUNCTIONAL USER & CATEGORY REPOSITORIES')
  console.log('='.repeat(80))

  await connectPrisma()

  const initialUserCount = await countUsers()
  const initialCategoryCount = await countCategories()
  console.log(`\n  Initial State: Users = ${initialUserCount}, Categories = ${initialCategoryCount}\n`)

  // =========================================================================
  // GROUP 1: PRISMA SELECT CONSTANTS & PROJECTION AUDIT
  // =========================================================================
  console.log('--- GROUP 1: Prisma Select Constants & Information Disclosure Protection ---')

  // Check 1.1: USER_PUBLIC_SELECT excludes sensitive fields
  assert(
    USER_PUBLIC_SELECT.password === undefined &&
      USER_PUBLIC_SELECT.otpCode === undefined &&
      USER_PUBLIC_SELECT.otpExpires === undefined &&
      USER_PUBLIC_SELECT.refreshToken === undefined &&
      USER_PUBLIC_SELECT.resetPasswordToken === undefined &&
      USER_PUBLIC_SELECT.resetPasswordExpires === undefined,
    'Projections',
    'USER_PUBLIC_SELECT strictly excludes all password, token, and OTP fields'
  )

  // Check 1.2: USER_COMPACT_SELECT contains exactly 4 fields
  const compactKeys = Object.keys(USER_COMPACT_SELECT).sort()
  assert(
    JSON.stringify(compactKeys) === JSON.stringify(['avatar', 'id', 'role', 'username']),
    'Projections',
    'USER_COMPACT_SELECT contains only avatar, id, role, username'
  )

  // Check 1.3: USER_AUTH_SELECT includes credential fields for login
  assert(
    USER_AUTH_SELECT.password === true &&
      USER_AUTH_SELECT.isVerified === true &&
      USER_AUTH_SELECT.refreshToken === true &&
      USER_AUTH_SELECT.role === true &&
      USER_AUTH_SELECT.status === true,
    'Projections',
    'USER_AUTH_SELECT contains password, isVerified, refreshToken, role, status'
  )

  // Check 1.4: USER_INTERNAL_SELECT includes all internal tokens
  assert(
    USER_INTERNAL_SELECT.otpCode === true &&
      USER_INTERNAL_SELECT.resetPasswordToken === true &&
      USER_INTERNAL_SELECT.refreshToken === true,
    'Projections',
    'USER_INTERNAL_SELECT contains all verification and recovery tokens'
  )

  // Check 1.5: CATEGORY_PUBLIC_SELECT excludes audit & relation metadata
  assert(
    CATEGORY_PUBLIC_SELECT.isDestroyed === undefined &&
      CATEGORY_PUBLIC_SELECT.createdById === undefined,
    'Projections',
    'CATEGORY_PUBLIC_SELECT excludes internal audit flags'
  )

  // =========================================================================
  // GROUP 2: READ OPERATIONS ON EXISTING DATABASE STATE
  // =========================================================================
  console.log('\n--- GROUP 2: Query Operations on Root Prisma Client ---')

  // Test 2.1: Find non-existent user returns null
  const nonExistentUser = await findUserById('00000000-0000-0000-0000-000000000000')
  assert(nonExistentUser === null, 'UserQuery', 'findUserById returns null for non-existent UUID')

  const nonExistentEmail = await findUserByEmail('non_existent_email_12345@example.com')
  assert(nonExistentEmail === null, 'UserQuery', 'findUserByEmail returns null for unknown email')

  // Test 2.2: Existing user queries
  // Choose user with unique username to test exact 1-to-1 match
  const targetUser = (await findUserByEmail('nab@gmail.com')) || (await findAllUsers({ take: 1 }))[0]
  assert(targetUser !== null, 'UserQuery', 'findUserByEmail locates existing reference user')

  if (targetUser) {
    // Find by UUID
    const foundById = await findUserById(targetUser.id)
    assert(foundById !== null && foundById.id === targetUser.id, 'UserQuery', 'findUserById locates user by UUID')

    // Find public by UUID
    const publicUser = await findUserPublicById(targetUser.id)
    assert(
      publicUser !== null && (publicUser as any).password === undefined && publicUser.id === targetUser.id,
      'UserQuery',
      'findUserPublicById returns sanitized UserPublic object without password'
    )

    // Find by Email
    const foundByEmail = await findUserByEmail(targetUser.email)
    assert(foundByEmail !== null && foundByEmail.email === targetUser.email, 'UserQuery', 'findUserByEmail locates user')

    // Find public by Email
    const publicByEmail = await findUserPublicByEmail(targetUser.email)
    assert(
      publicByEmail !== null && (publicByEmail as any).password === undefined,
      'UserQuery',
      'findUserPublicByEmail returns sanitized UserPublic object'
    )

    // Find by Username
    const foundByUsername = await findUserByUsername(targetUser.username)
    assert(foundByUsername !== null && foundByUsername.username === targetUser.username, 'UserQuery', 'findUserByUsername locates user')

    // Find by Email or Username
    const foundByOrEmail = await findUserByEmailOrUsername(targetUser.email)
    assert(foundByOrEmail !== null && foundByOrEmail.id === targetUser.id, 'UserQuery', 'findUserByEmailOrUsername matches by email')

    const foundByOrUsername = await findUserByEmailOrUsername(targetUser.username)
    assert(foundByOrUsername !== null && foundByOrUsername.id === targetUser.id, 'UserQuery', 'findUserByEmailOrUsername matches by username')

    // Check taken statuses
    const isTaken = await isEmailTaken(targetUser.email)
    assert(isTaken === true, 'UserQuery', 'isEmailTaken returns true for existing email')

    const isNotTaken = await isEmailTaken(targetUser.email, targetUser.id)
    assert(isNotTaken === false, 'UserQuery', 'isEmailTaken with excludeUserId returns false for self')

    const usernameTaken = await isUsernameTaken(targetUser.username)
    assert(usernameTaken === true, 'UserQuery', 'isUsernameTaken returns true for existing username')

    // Conflict detection for unique user
    const conflict = await findUserConflict({ email: targetUser.email, username: targetUser.username })
    assert(
      conflict.emailConflict === true && conflict.usernameConflict === true,
      'UserQuery',
      'findUserConflict identifies both email and username collisions'
    )

    const excludedConflict = await findUserConflict({
      email: targetUser.email,
      username: targetUser.username,
      excludeUserId: targetUser.id
    })
    assert(
      excludedConflict.emailConflict === false && excludedConflict.usernameConflict === false,
      'UserQuery',
      'findUserConflict respects excludeUserId'
    )

    // Test duplicate username in legacy database
    const thaiminhUsers = await findAllUsers({ where: { username: 'thaiminh' } })
    if (thaiminhUsers.length >= 2) {
      const duplicateConflict = await findUserConflict({
        username: 'thaiminh',
        excludeUserId: thaiminhUsers[0].id
      })
      assert(
        duplicateConflict.usernameConflict === true,
        'UserQuery',
        'findUserConflict accurately detects collision when duplicate username exists across different users'
      )
    }
  }

  // Test 2.3: Admin and Pagination Queries
  const paginatedUsers = await findUsersWithPagination({ page: 1, limit: 5 })
  assert(
    paginatedUsers.users.length <= 5 && paginatedUsers.total >= paginatedUsers.users.length,
    'UserQuery',
    'findUsersWithPagination returns structured pagination payload'
  )

  const adminCount = await countAdminsExcluding('00000000-0000-0000-0000-000000000000')
  assert(adminCount >= 1, 'UserQuery', 'countAdminsExcluding accurately counts administrative accounts')

  const teachers = await findActiveTeachers({ limit: 5 })
  assert(teachers !== null && Array.isArray(teachers.teachers), 'UserQuery', 'findActiveTeachers returns teachers array')

  // Test 2.4: Category Queries
  const existingCategories = await findAllCategories({ take: 1 })
  assert(existingCategories.length > 0, 'CategoryQuery', 'findAllCategories retrieves category records')

  if (existingCategories.length > 0) {
    const targetCategory = existingCategories[0]

    const catById = await findCategoryById(targetCategory.id)
    assert(catById !== null && catById.id === targetCategory.id, 'CategoryQuery', 'findCategoryById locates category by UUID')

    const catBySlug = await findCategoryBySlug(targetCategory.slug)
    assert(catBySlug !== null && catBySlug.slug === targetCategory.slug, 'CategoryQuery', 'findCategoryBySlug locates category by slug')

    const catByName = await findCategoryByName(targetCategory.name)
    assert(catByName !== null && catByName.name === targetCategory.name, 'CategoryQuery', 'findCategoryByName locates category by name')

    const nameTaken = await isCategoryNameTaken(targetCategory.name)
    assert(nameTaken === true, 'CategoryQuery', 'isCategoryNameTaken returns true for existing category name')

    const slugTaken = await isCategorySlugTaken(targetCategory.slug)
    assert(slugTaken === true, 'CategoryQuery', 'isCategorySlugTaken returns true for existing category slug')
  }

  const paginatedCats = await findCategoriesWithPagination({ page: 1, limit: 10 })
  assert(
    paginatedCats.categories.length <= 10 && paginatedCats.totalPages >= 1,
    'CategoryQuery',
    'findCategoriesWithPagination returns categories with pagination metadata'
  )

  // =========================================================================
  // GROUP 3: ISOLATED TRANSACTION MUTATIONS & INTEGRATION CHECKS
  // =========================================================================
  console.log('\n--- GROUP 3: Transactional Mutation Suite (Guaranteed Rollback) ---')

  let rollbackVerified = false

  try {
    await prisma.$transaction(async (tx) => {
      const timestamp = Date.now()

      // --- USER MUTATIONS ---
      const testEmail = `tx_test_${timestamp}@example.com`
      const testUsername = `txtest_${timestamp}`
      const testPasswordHash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890'

      // 3.1: Add User
      const createdUser = await addUser(
        {
          username: testUsername,
          email: testEmail,
          password: testPasswordHash,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          isVerified: false,
          phone: '0987654321',
          bio: 'Step 2 test bio'
        },
        tx
      )
      assert(isValidUUID(createdUser.id), 'TxUser', 'addUser creates user record with valid UUID')
      assert(createdUser.isVerified === false, 'TxUser', 'addUser sets initial unverified status')

      // 3.2: Update Profile
      const updatedUser = await updateUser(
        createdUser.id,
        {
          bio: 'Updated bio in transaction',
          socialFacebook: 'https://facebook.com/txuser'
        },
        tx
      )
      assert(updatedUser.bio === 'Updated bio in transaction', 'TxUser', 'updateUser mutates bio field')
      assert(updatedUser.socialFacebook === 'https://facebook.com/txuser', 'TxUser', 'updateUser mutates social links')

      // 3.3: Update Refresh Token
      const refreshedUser = await updateRefreshToken(createdUser.id, 'hashed_refresh_token_tx', tx)
      assert(refreshedUser.refreshToken === 'hashed_refresh_token_tx', 'TxUser', 'updateRefreshToken stores token')

      // 3.4: Query with credentials for login verification
      const authUser = await findUserWithCredentials(testEmail, tx)
      assert(
        authUser !== null && authUser.password === testPasswordHash && authUser.refreshToken === 'hashed_refresh_token_tx',
        'TxUser',
        'findUserWithCredentials retrieves credentials required for login'
      )

      // 3.5: Mark as Verified
      const verifiedUser = await markUserAsVerified(createdUser.id, tx)
      assert(verifiedUser.isVerified === true && verifiedUser.otpCode === null, 'TxUser', 'markUserAsVerified sets isVerified and clears OTP')

      // 3.6: Password Reset Token workflow
      const resetTokenHash = `reset_hash_${timestamp}`
      await updateUser(
        createdUser.id,
        {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000)
        },
        tx
      )
      const userByReset = await findUserByResetToken(resetTokenHash, tx)
      assert(userByReset !== null && userByReset.id === createdUser.id, 'TxUser', 'findUserByResetToken locates record by active reset token')

      // 3.7: Delete User
      const deletedUser = await deleteUser(createdUser.id, tx)
      assert(deletedUser.id === createdUser.id, 'TxUser', 'deleteUser performs hard delete of user record')

      const reCheckUser = await findUserById(createdUser.id, tx)
      assert(reCheckUser === null, 'TxUser', 'Deleted user is inaccessible in subsequent query')

      // --- CATEGORY MUTATIONS ---
      const testCatSlug = `tx-cat-slug-${timestamp}`
      const testCatName = `Tx Cat Name ${timestamp}`

      // 3.8: Add Category
      const createdCat = await addCategory(
        {
          name: testCatName,
          slug: testCatSlug,
          description: 'Tx test description'
        },
        tx
      )
      assert(isValidUUID(createdCat.id), 'TxCategory', 'addCategory creates category with valid UUID')
      assert(createdCat.isDestroyed === false, 'TxCategory', 'addCategory defaults isDestroyed = false')

      // 3.9: Update Category
      const updatedCat = await updateCategory(
        createdCat.id,
        {
          description: 'Updated category description'
        },
        tx
      )
      assert(updatedCat.description === 'Updated category description', 'TxCategory', 'updateCategory updates description')

      // 3.10: Soft Delete Category
      const softDeletedCat = await softDeleteCategory(createdCat.id, tx)
      assert(softDeletedCat.isDestroyed === true, 'TxCategory', 'softDeleteCategory toggles isDestroyed = true')

      // Verify active category query excludes soft-deleted
      const activeCats = await findActiveCategories({ search: testCatName }, tx)
      assert(activeCats.length === 0, 'TxCategory', 'findActiveCategories filters out soft-deleted category')

      // 3.11: Restore Category
      const restoredCat = await restoreCategory(createdCat.id, tx)
      assert(restoredCat.isDestroyed === false, 'TxCategory', 'restoreCategory resets isDestroyed = false')

      // 3.12: Hard Delete Category
      const hardDeletedCat = await deleteCategory(createdCat.id, tx)
      assert(hardDeletedCat.id === createdCat.id, 'TxCategory', 'deleteCategory removes category from PostgreSQL')

      const reCheckCat = await findCategoryById(createdCat.id, tx)
      assert(reCheckCat === null, 'TxCategory', 'Deleted category is null in database')

      // --- CRON CLEANUP QUERY LOGIC ---
      // Test 3.13: deleteUnverifiedUsersBeforeCutoff with safe cutoff
      const cleanupResult = await deleteUnverifiedUsersBeforeCutoff(
        {
          expireThreshold: new Date('2026-10-02T00:00:00.000Z'),
          cutoffDate: MIGRATION_CUTOFF_DATE
        },
        tx
      )
      assert(
        typeof cleanupResult.count === 'number',
        'TxCron',
        'deleteUnverifiedUsersBeforeCutoff executes with safe cutoff predicates'
      )

      // Trigger intentional rollback
      throw new Error('INTENTIONAL_STEP02_ROLLBACK')
    })
  } catch (error: any) {
    if (error.message === 'INTENTIONAL_STEP02_ROLLBACK') {
      rollbackVerified = true
    } else {
      console.error('Unexpected transaction error:', error)
    }
  }

  assert(rollbackVerified, 'Isolation', 'Transaction successfully intercepted and rolled back')

  // Verify final counts match initial counts
  const finalUserCount = await countUsers()
  const finalCategoryCount = await countCategories()

  assert(
    finalUserCount === initialUserCount,
    'Isolation',
    `Database zero mutation assertion: Users count stayed ${finalUserCount} (initial ${initialUserCount})`
  )
  assert(
    finalCategoryCount === initialCategoryCount,
    'Isolation',
    `Database zero mutation assertion: Categories count stayed ${finalCategoryCount} (initial ${initialCategoryCount})`
  )

  await disconnectPrisma()

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const total = testResults.length
  const passed = testResults.filter((t) => t.passed).length
  const failed = testResults.filter((t) => !t.passed).length

  console.log('\n' + '='.repeat(80))
  console.log(`  STEP 2 TEST RESULTS: TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('='.repeat(80) + '\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runStep02TestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
