/**
 * Phase 2 - Step 4 Verification Test Suite
 * Authentication, Validators & Admin User Services Migration
 *
 * Scope:
 * 1. Express Validator Syntactic Validation (No DB calls in validators)
 * 2. UUID Validation on migrated entities (categoryIdValidator, userIdValidator, getUserDetailValidator, updateUserByAdminValidator)
 * 3. Public Registration Security (role is strictly defaulted to USER, ignored from body)
 * 4. Duplicate Email on Registration (returns HTTP 400 with { errors: { email: 'Email already in use' } })
 * 5. Login Flow - Option B (Unverified user returns HTTP 400 with { errors: { email: 'Vui lòng xác thực email trước khi đăng nhập' } })
 * 6. Login Flow - Non-existent user (returns HTTP 400 with { errors: { email: 'Email không tồn tại' } })
 * 7. Admin User Services Migration (getAllUsers, getUserDetail, updateUserByAdmin, deleteUserByAdmin, createTeacher)
 * 8. Zero database pollution (runs with rollback or clean transaction)
 */

import { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import prisma from '../../src/config/prisma'
import {
  registerValidator,
  loginValidator,
  userIdValidator,
} from '../../src/middlewares/user.middleware'
import { categoryIdValidator } from '../../src/middlewares/category.middleware'
import {
  getUserDetailValidator,
  updateUserByAdminValidator,
} from '../../src/middlewares/admin.middleware'
import {
  registerUserService,
  loginUserService,
} from '../../src/services/user.service'
import {
  getAllUsersService,
  getUserDetailService,
  updateUserByAdminService,
  deleteUserByAdminService,
  createTeacherService,
} from '../../src/services/admin.service'
import { findUserByEmail, deleteUser } from '../../src/repositories/user.repository'

// Helper to run express-validator chains against a mock request
async function runValidation(chains: any[], req: Partial<Request>): Promise<any[]> {
  const mockReq = {
    headers: {},
    params: {},
    query: {},
    body: {},
    ...req
  } as Request
  for (const middleware of chains) {
    await new Promise<void>((resolve) => {
      middleware(mockReq, {} as Response, () => {
        resolve()
      })
    })
  }
  const result = validationResult(mockReq)
  return result.array()
}

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`)
    failed++
  }
}

async function runStep04Tests() {
  console.log('===============================================================')
  console.log('PHASE 2 - STEP 4 VERIFICATION TEST SUITE')
  console.log('Authentication, Validators & Admin User Services Migration')
  console.log('===============================================================\n')

  const initialUserCount = await prisma.user.count()
  const initialCategoryCount = await prisma.category.count()
  console.log(`Initial DB State: ${initialUserCount} users, ${initialCategoryCount} categories\n`)

  // -------------------------------------------------------------
  // SUITE 1: UUID Validation for Category & User Middlewares
  // -------------------------------------------------------------
  console.log('--- Suite 1: UUID Param Validators (Category & User) ---')

  const validUUID = 'a0000000-0000-4000-8000-000000000001' // RFC 4122 compliant v4 UUID
  const invalidUUID = '507f1f77bcf86cd799439011' // 24-char Mongo ObjectId
  const garbageId = 'not-a-uuid-at-all'

  // 1.1 categoryIdValidator
  const catErrorsValid = await runValidation(categoryIdValidator, { params: { id: validUUID } as any })
  assert(catErrorsValid.length === 0, 'categoryIdValidator accepts valid UUID')

  const catErrorsMongo = await runValidation(categoryIdValidator, { params: { id: invalidUUID } as any })
  assert(catErrorsMongo.length > 0 && catErrorsMongo[0].msg === 'Invalid Category ID', 'categoryIdValidator rejects Mongo ObjectId')

  const catErrorsGarbage = await runValidation(categoryIdValidator, { params: { id: garbageId } as any })
  assert(catErrorsGarbage.length > 0 && catErrorsGarbage[0].msg === 'Invalid Category ID', 'categoryIdValidator rejects garbage string')

  // 1.2 userIdValidator (uses param 'userId')
  const userErrorsValid = await runValidation(userIdValidator, { params: { userId: validUUID } as any })
  assert(userErrorsValid.length === 0, 'userIdValidator accepts valid UUID')

  const userErrorsMongo = await runValidation(userIdValidator, { params: { userId: invalidUUID } as any })
  assert(userErrorsMongo.length > 0 && userErrorsMongo[0].msg === 'Invalid User ID', 'userIdValidator rejects Mongo ObjectId')

  // 1.3 getUserDetailValidator (admin, uses param 'id')
  const adminDetailValid = await runValidation(getUserDetailValidator, { params: { id: validUUID } as any })
  assert(adminDetailValid.length === 0, 'getUserDetailValidator accepts valid UUID')

  const adminDetailMongo = await runValidation(getUserDetailValidator, { params: { id: invalidUUID } as any })
  assert(adminDetailMongo.length > 0 && adminDetailMongo[0].msg === 'Invalid user id', 'getUserDetailValidator rejects Mongo ObjectId')

  // 1.4 updateUserByAdminValidator (admin, uses param 'id')
  const adminUpdateValid = await runValidation(updateUserByAdminValidator, {
    params: { id: validUUID } as any,
    body: { username: 'valid_user' }
  })
  assert(adminUpdateValid.length === 0, 'updateUserByAdminValidator accepts valid UUID with optional fields')

  const adminUpdateMongo = await runValidation(updateUserByAdminValidator, {
    params: { id: invalidUUID } as any,
    body: { username: 'valid_user' }
  })
  assert(adminUpdateMongo.length > 0 && adminUpdateMongo[0].msg === 'Invalid user id', 'updateUserByAdminValidator rejects Mongo ObjectId')

  // -------------------------------------------------------------
  // SUITE 2: Syntactic Express Validator (No DB Queries in Middleware)
  // -------------------------------------------------------------
  console.log('\n--- Suite 2: Syntactic Express Validation ---')

  // 2.1 registerValidator syntactic checks
  const regInvalid = await runValidation(registerValidator, {
    body: { username: 'a', email: 'not-an-email', password: '123' }
  })
  assert(regInvalid.length >= 3, 'registerValidator catches invalid syntax (username, email, password length)')

  const regValidSyntax = await runValidation(registerValidator, {
    body: {
      username: 'valid_user_123',
      email: 'test-syntax@example.com',
      password: 'password123',
      confirm_password: 'password123'
    }
  })
  assert(regValidSyntax.length === 0, 'registerValidator passes valid syntax without DB access')

  // 2.2 loginValidator syntactic checks
  const loginInvalid = await runValidation(loginValidator, {
    body: { email: 'bad-email', password: '' }
  })
  assert(loginInvalid.length >= 2, 'loginValidator catches invalid syntax')

  const loginValidSyntax = await runValidation(loginValidator, {
    body: { email: 'admin@tmdemy.com', password: 'secretpassword' }
  })
  assert(loginValidSyntax.length === 0, 'loginValidator passes valid syntax without DB access')

  // -------------------------------------------------------------
  // SUITE 3: Public Registration Security & Duplicate Email Checks
  // -------------------------------------------------------------
  console.log('\n--- Suite 3: Public Registration Security & Duplicate Email Handling ---')

  const testRegEmail = `test-reg-${Date.now()}@example.com`
  const testRegUsername = `testreg_${Date.now().toString().slice(-6)}`
  let createdUserId: string | null = null

  try {
    // 3.1 Role stripping / defaulting to USER
    const regResult = await registerUserService({
      username: testRegUsername,
      email: testRegEmail,
      password: 'StrongPassword123!',
      role: 'admin' as any // Attempt privilege escalation!
    })

    assert(Boolean(regResult && (regResult as any).id), 'registerUserService succeeded')
    assert((regResult as any)?.role === 'user', 'registerUserService forces role to USER, ignoring requested admin role')

    // Verify in database
    const dbUser = await findUserByEmail(testRegEmail)
    assert(dbUser !== null && dbUser.role === 'USER', 'Database record has role USER')
    if (dbUser) createdUserId = dbUser.id

    // 3.2 Duplicate email detection in registerUserService
    const dupResult = await registerUserService({
      username: `another_${Date.now().toString().slice(-6)}`,
      email: testRegEmail,
      password: 'StrongPassword123!'
    })
    assert((dupResult as any)?.success === false, 'registerUserService rejects duplicate email')
    assert((dupResult as any)?.statusCode === 400, 'Duplicate email returns HTTP 400')
    assert((dupResult as any)?.errors?.email === 'Email already in use', 'Duplicate email returns exact legacy error contract { errors: { email: "Email already in use" } }')

  } finally {
    // Clean up created user
    if (createdUserId) {
      await deleteUser(createdUserId)
      createdUserId = null
    }
  }

  // -------------------------------------------------------------
  // SUITE 4: Login Flow - Option B (Unverified Email & Non-existent Email)
  // -------------------------------------------------------------
  console.log('\n--- Suite 4: Login Flow Preservation (Option B) ---')

  // 4.1 Non-existent email
  const loginNonExistent = await loginUserService({
    email: 'non-existent-user-123456@tmdemy.com',
    password: 'password123'
  })
  assert(loginNonExistent.success === false, 'loginUserService fails for non-existent email')
  assert(loginNonExistent.statusCode === 400, 'Non-existent email returns HTTP 400')
  assert(loginNonExistent.errors?.email === 'Email không tồn tại', 'Returns legacy error contract { errors: { email: "Email không tồn tại" } }')

  // 4.2 Unverified user login
  const unverifiedEmail = `test-unverified-${Date.now()}@example.com`
  const unverifiedUsername = `unverified_${Date.now().toString().slice(-6)}`
  let unverifiedUserId: string | null = null

  try {
    // Register unverified user
    await registerUserService({
      username: unverifiedUsername,
      email: unverifiedEmail,
      password: 'Password123!'
    })
    const unverifiedDb = await findUserByEmail(unverifiedEmail)
    if (unverifiedDb) unverifiedUserId = unverifiedDb.id

    assert(unverifiedDb?.isVerified === false, 'Created user is unverified by default')

    // Attempt login
    const loginUnverified = await loginUserService({
      email: unverifiedEmail,
      password: 'Password123!'
    })
    assert(loginUnverified.success === false, 'loginUserService rejects unverified user')
    assert(loginUnverified.statusCode === 400, 'Option B: Unverified user returns HTTP 400')
    assert(loginUnverified.errors?.email === 'Vui lòng xác thực email trước khi đăng nhập',
      'Option B: Preserves exact error message "Vui lòng xác thực email trước khi đăng nhập"')

  } finally {
    if (unverifiedUserId) {
      await deleteUser(unverifiedUserId)
      unverifiedUserId = null
    }
  }

  // -------------------------------------------------------------
  // SUITE 5: Admin User Services Migration
  // -------------------------------------------------------------
  console.log('\n--- Suite 5: Admin User Services (Prisma + Functional Repository) ---')

  // 5.1 getAllUsersService
  const allUsersRes = await getAllUsersService({ page: 1, limit: 5 })
  assert(allUsersRes.success === true, 'getAllUsersService returns success')
  assert(Array.isArray(allUsersRes.data?.users), 'getAllUsersService returns users array')
  assert(typeof allUsersRes.data?.pagination?.total === 'number', 'getAllUsersService returns total in pagination')

  // 5.2 getUserDetailService
  const existingUser = allUsersRes.data?.users[0]
  if (existingUser) {
    const detailRes = await getUserDetailService({ id: existingUser.id })
    assert(detailRes.success === true, 'getUserDetailService succeeds for valid ID')
    assert(detailRes.data?.id === existingUser.id, 'getUserDetailService returns correct user')
    assert((detailRes.data as any)?.password === undefined, 'getUserDetailService does NOT expose password')
  }

  // Non-existent user
  const nonExistentDetail = await getUserDetailService({ id: validUUID })
  assert(nonExistentDetail.success === false && nonExistentDetail.statusCode === 404, 'getUserDetailService returns 404 for missing user')

  // 5.3 createTeacherService (Admin-only role creation)
  const teacherEmail = `test-teacher-${Date.now()}@example.com`
  const teacherUsername = `teacher_${Date.now().toString().slice(-6)}`
  let teacherId: string | null = null

  try {
    const teacherRes = await createTeacherService({
      payload: {
        username: teacherUsername,
        email: teacherEmail,
        password: 'TeacherPassword123!',
        bio: 'Expert teacher bio'
      }
    })

    assert(teacherRes.success === true, 'createTeacherService succeeds')
    assert(teacherRes.data?.role === 'teacher', 'createTeacherService creates user with role teacher')

    const dbTeacher = await findUserByEmail(teacherEmail)
    assert(dbTeacher !== null && dbTeacher.role === 'TEACHER', 'Database record has Prisma enum role TEACHER')
    assert(dbTeacher !== null && dbTeacher.isVerified === true, 'Database record has isVerified = true')
    if (dbTeacher) teacherId = dbTeacher.id

    // 5.4 updateUserByAdminService
    if (teacherId) {
      const updateRes = await updateUserByAdminService({
        id: teacherId,
        payload: {
          username: `upd_${teacherUsername}`,
          status: 'blocked'
        }
      })
      assert(updateRes.success === true, 'updateUserByAdminService succeeds')
      assert(updateRes.data?.username === `upd_${teacherUsername}`, 'updateUserByAdminService updates username')
      assert(updateRes.data?.status === 'inactive', 'updateUserByAdminService returns mapped status inactive')

      const updatedDb = await findUserByEmail(teacherEmail)
      assert(updatedDb?.status === 'INACTIVE', 'Database record maps status blocked to INACTIVE')
    }

    // 5.5 deleteUserByAdminService
    if (teacherId) {
      const deleteRes = await deleteUserByAdminService({ id: teacherId })
      assert(deleteRes.success === true, 'deleteUserByAdminService succeeds')

      const deletedDb = await findUserByEmail(teacherEmail)
      assert(deletedDb === null, 'User is completely removed from database')
      teacherId = null
    }

  } finally {
    if (teacherId) {
      await deleteUser(teacherId)
    }
  }

  // -------------------------------------------------------------
  // SUITE 6: Database Isolation Verification
  // -------------------------------------------------------------
  console.log('\n--- Suite 6: Database Isolation Verification ---')
  const finalUserCount = await prisma.user.count()
  const finalCategoryCount = await prisma.category.count()
  console.log(`Final DB State: ${finalUserCount} users, ${finalCategoryCount} categories`)
  assert(finalUserCount === initialUserCount, 'User count is strictly preserved (zero test pollution)')
  assert(finalCategoryCount === initialCategoryCount, 'Category count is strictly preserved')

  console.log('\n===============================================================')
  console.log(`STEP 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('===============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runStep04Tests()
  .catch((err) => {
    console.error('Fatal test error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
