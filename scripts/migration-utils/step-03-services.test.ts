/**
 * TMDEMY — PHASE 2 STEP 3 TEST SUITE
 * User & Category Service Verification with Prisma Functional Repositories
 *
 * File: scripts/migration-utils/step-03-services.test.ts
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma, connectPrisma, disconnectPrisma } from '../../src/config/prisma'
import {
  createCategoryService,
  deleteCategoryService,
  getCategoriesService,
  getCategoryDetailService,
  updateCategoryService
} from '../../src/services/category.service'
import {
  changePasswordService,
  forgotPasswordService,
  getAccessTokenService,
  getListTeachersService,
  getMeService,
  loginUserService,
  logoutUserService,
  registerUserService,
  resetPasswordService,
  updateMeService,
  verifyOtpService
} from '../../src/services/user.service'
import { UserRole, UserStatus } from '@prisma/client'
import { hashToken } from '../../src/utils/ultis'

// Test runner state
let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  PASSED: ${testName}`)
  } else {
    failedTests++
    console.error(`  FAILED: ${testName}${detail ? ` — ${detail}` : ''}`)
  }
}

async function runStep3Tests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PHASE 2 STEP 3 — USER & CATEGORY SERVICE MIGRATION')
  console.log('='.repeat(80))

  await connectPrisma()

  const initialUserCount = await prisma.user.count()
  const initialCatCount = await prisma.category.count()
  console.log(`\n  Initial Database State: Users = ${initialUserCount}, Categories = ${initialCatCount}\n`)

  // Reference data for queries
  const existingUser = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN }
  })
  const adminId = existingUser ? existingUser.id : '00000000-0000-4000-8000-000000000001'

  // ==========================================
  // SUITE 1: READ-ONLY SERVICES (CATEGORY & USER)
  // ==========================================
  console.log('--- SUITE 1: Read-Only Services (Storefront & Profile Queries) ---')

  // 1.1 Category listing
  const categoriesResult = await getCategoriesService({ page: 1, limit: 10 })
  assert(categoriesResult.success === true, '[CategoryService] getCategoriesService returns success')
  assert(Array.isArray(categoriesResult.data.categories), '[CategoryService] categories is an array')
  assert(
    categoriesResult.data.categories.length > 0
      ? categoriesResult.data.categories.every((c: any) => c.id && c._id && c._destroy === false)
      : true,
    '[CategoryService] every category has id, _id and _destroy: false'
  )
  assert(categoriesResult.data.pagination.page === 1, '[CategoryService] pagination metadata page is 1')

  // 1.2 Category detail
  const existingCat = await prisma.category.findFirst({
    where: { isDestroyed: false }
  })
  if (existingCat) {
    const detailResult = await getCategoryDetailService(existingCat.slug)
    assert(detailResult.success === true, '[CategoryService] getCategoryDetailService resolves existing category')
    assert(detailResult.data.id === existingCat.id, '[CategoryService] detail id matches')
    assert(detailResult.data._id === existingCat.id, '[CategoryService] detail _id compat matches')
    assert(detailResult.data.isDestroyed === undefined, '[CategoryService] internal isDestroyed flag stripped')
  }

  const notFoundCat = await getCategoryDetailService('non-existent-slug-xyz-999')
  assert(
    notFoundCat.success === false && notFoundCat.statusCode === 404,
    '[CategoryService] getCategoryDetailService returns 404 for unknown slug'
  )

  // 1.3 User getMeService
  if (existingUser) {
    const meResult = await getMeService({ userId: existingUser.id })
    assert(meResult.success === true, '[UserService] getMeService returns success for valid userId')
    assert(meResult.data.id === existingUser.id, '[UserService] getMeService id matches')
    assert(meResult.data._id === existingUser.id, '[UserService] getMeService _id compat matches')
    assert(meResult.data.role === existingUser.role.toLowerCase(), '[UserService] getMeService returns lowercase role')
    assert(meResult.data.socialLinks !== undefined, '[UserService] getMeService includes socialLinks object')
    assert(meResult.data.password === undefined, '[UserService] getMeService strictly excludes password')
    assert(meResult.data.refreshToken === undefined, '[UserService] getMeService strictly excludes refreshToken')
  }

  const notFoundMe = await getMeService({ userId: '00000000-0000-4000-8000-000000000000' })
  assert(notFoundMe.success === false, '[UserService] getMeService returns false for unknown userId')

  // 1.4 User getListTeachersService
  const teachersResult = await getListTeachersService({ page: 1, limit: 10 })
  assert(teachersResult.success === true, '[UserService] getListTeachersService returns success')
  assert(Array.isArray(teachersResult.data.teachers), '[UserService] teachers is an array')
  if (teachersResult.data.teachers.length > 0) {
    const t = teachersResult.data.teachers[0]
    assert(t.id && t._id && t.socialLinks, '[UserService] teacher record contains id, _id and socialLinks')
  }

  // ==========================================
  // SUITE 2: ISOLATED TRANSACTIONAL MUTATIONS
  // ==========================================
  console.log('\n--- SUITE 2: Isolated Transactional Mutation Suite (Guaranteed Rollback) ---')

  let txRollbackCaught = false

  try {
    await prisma.$transaction(
      async (tx) => {
        // ----------------------------------------------------
        // 2.1 Category Service Mutations
        // ----------------------------------------------------
        console.log('  -> Testing Category Service Mutations inside transaction...')

        // Create Category: Invalid user
        const invalidUserCat = await createCategoryService(
          { payload: { name: 'Invalid Cat' }, created_by: 'invalid-id-not-uuid' },
          tx
        )
        assert(
          invalidUserCat.success === false && invalidUserCat.statusCode === 401,
          '[TxCat] createCategoryService rejects invalid user ID with 401'
        )

        // Create Category: Valid
        const createCatResult = await createCategoryService(
          {
            payload: {
              name: 'Step 3 Test DevOps Masterclass',
              description: 'DevOps learning path'
            },
            created_by: adminId
          },
          tx
        )
        assert(createCatResult.success === true, '[TxCat] createCategoryService successfully creates category')
        assert(createCatResult.data.slug === 'step-3-test-devops-masterclass', '[TxCat] slug generated correctly')
        assert(createCatResult.data._id === createCatResult.data.id, '[TxCat] _id compat populated')
        assert(createCatResult.data._destroy === false, '[TxCat] _destroy compat defaults to false')

        const newCatId = createCatResult.data.id
        const newCatSlug = createCatResult.data.slug

        // Create Category: Duplicate Slug Conflict
        const dupSlugCat = await createCategoryService(
          {
            payload: {
              name: 'Another DevOps Course',
              slug: newCatSlug
            },
            created_by: adminId
          },
          tx
        )
        assert(
          dupSlugCat.success === false && dupSlugCat.statusCode === 409 && dupSlugCat.errorCode === 'SLUG_CONFLICT',
          '[TxCat] createCategoryService rejects duplicate slug with 409 SLUG_CONFLICT'
        )

        // Create Category: Duplicate Name Conflict (with distinct slug)
        const dupNameCat = await createCategoryService(
          {
            payload: {
              name: 'Step 3 Test DevOps Masterclass',
              slug: 'unique-slug-for-duplicate-name-test'
            },
            created_by: adminId
          },
          tx
        )
        assert(
          dupNameCat.success === false && dupNameCat.statusCode === 409 && dupNameCat.errorCode === 'NAME_CONFLICT',
          '[TxCat] createCategoryService rejects duplicate name with 409 NAME_CONFLICT'
        )

      // Update Category: Name & Description
      const updateCatResult = await updateCategoryService(
        {
          id: newCatId,
          payload: {
            name: 'Step 3 Test DevOps & Cloud Masterclass',
            description: 'Updated description for cloud path'
          }
        },
        tx
      )
      assert(updateCatResult.success === true, '[TxCat] updateCategoryService updates name and description')
      assert(
        updateCatResult.data.name === 'Step 3 Test DevOps & Cloud Masterclass',
        '[TxCat] updated name matches payload'
      )

      // Delete Category: Soft Delete
      const deleteCatResult = await deleteCategoryService(newCatId, tx)
      assert(deleteCatResult.success === true, '[TxCat] deleteCategoryService soft-deletes category')
      assert(deleteCatResult.data.isDestroyed === true, '[TxCat] isDestroyed is true')
      assert(deleteCatResult.data._destroy === true, '[TxCat] _destroy compat is true')

      // Delete Category: Already deleted rejection
      const redeleteCat = await deleteCategoryService(newCatId, tx)
      assert(
        redeleteCat.success === false && redeleteCat.statusCode === 400,
        '[TxCat] deleteCategoryService returns 400 when category already deleted'
      )

      // Get Category Detail: Soft-deleted category hidden from public
      const hiddenCatDetail = await getCategoryDetailService(newCatSlug, tx)
      assert(
        hiddenCatDetail.success === false && hiddenCatDetail.statusCode === 404,
        '[TxCat] getCategoryDetailService returns 404 for soft-deleted category'
      )

      // ----------------------------------------------------
      // 2.2 User Service Mutations & Authentication Flow
      // ----------------------------------------------------
      console.log('  -> Testing User Service Authentication Flow inside transaction...')

      const testEmail = 'step3.tester@tmdemy.internal'
      const testPassword = 'Password123!'
      const testUsername = 'step3tester'

      // Register User
      const registerResult = await registerUserService(
        {
          username: testUsername,
          email: testEmail,
          password: testPassword,
          role: 'user',
          bio: 'Step 3 test account'
        },
        tx
      )
      assert(registerResult.id !== undefined, '[TxUser] registerUserService returns created user')
      assert(registerResult._id === registerResult.id, '[TxUser] registerUserService includes _id compat')
      assert(registerResult.isVerified === false, '[TxUser] registerUserService creates unverified user')
      assert(registerResult.role === 'user', '[TxUser] registerUserService returns lowercase role')

      const newUserId = registerResult.id

      // Fetch internal OTP from DB to simulate user email verification
      const unverifiedUser = await tx.user.findUnique({
        where: { id: newUserId },
        select: { id: true, otpCode: true, otpExpires: true }
      })
      assert(unverifiedUser?.otpCode !== null, '[TxUser] OTP code hash was stored in DB')

      // Verify OTP: Wrong OTP
      let wrongOtpThrown = false
      try {
        await verifyOtpService({ email: testEmail, otp: '000000' }, tx)
      } catch (err: any) {
        wrongOtpThrown = true
        assert(err.message === 'Mã OTP không đúng', '[TxUser] verifyOtpService throws for wrong OTP')
      }
      assert(wrongOtpThrown, '[TxUser] verifyOtpService rejected invalid OTP')

      // To verify with correct OTP, we can temporarily set a known OTP hash
      const knownOtp = '123456'
      const knownOtpHash = hashToken(knownOtp)
      await tx.user.update({
        where: { id: newUserId },
        data: { otpCode: knownOtpHash }
      })

      // Verify OTP: Correct OTP
      const verifyResult = await verifyOtpService({ email: testEmail, otp: knownOtp }, tx)
      assert(verifyResult.success === true, '[TxUser] verifyOtpService successfully verified OTP')

      const verifiedUserInDb = await tx.user.findUnique({
        where: { id: newUserId },
        select: { isVerified: true, otpCode: true }
      })
      assert(verifiedUserInDb?.isVerified === true, '[TxUser] user isVerified is now true in DB')
      assert(verifiedUserInDb?.otpCode === null, '[TxUser] user otpCode is cleared after verification')

      // Login: Wrong Password
      const wrongPwLogin = await loginUserService(
        {
          email: testEmail,
          password: 'WrongPassword999'
        },
        tx
      )
      assert(
        wrongPwLogin.success === false && wrongPwLogin.message === 'Incorrect password',
        '[TxUser] loginUserService rejects incorrect password'
      )

      // Login: Correct Credentials
      const loginResult = await loginUserService(
        {
          email: testEmail,
          password: testPassword
        },
        tx
      )
      assert(loginResult.success === true, '[TxUser] loginUserService succeeds with correct credentials')
      assert(typeof loginResult.access_token === 'string', '[TxUser] access_token is returned')
      assert(typeof loginResult.refresh_token === 'string', '[TxUser] refresh_token is returned')

      // Verify Access Token contains lowercase role
      const decodedAccess: any = jwt.decode(loginResult.access_token!)
      assert(decodedAccess.userId === newUserId, '[TxUser] access token payload userId matches')
      assert(decodedAccess.role === 'user', '[TxUser] access token payload role is lowercase "user"')

      // Refresh Token Exchange
      const refreshResult = await getAccessTokenService(
        {
          userId: newUserId,
          refresh_token: loginResult.refresh_token!
        },
        tx
      )
      assert(refreshResult.success === true, '[TxUser] getAccessTokenService issues new access_token')
      assert(typeof refreshResult.access_token === 'string', '[TxUser] new access_token is valid string')

      // Update Me: Profile Update
      const updateMeRes = await updateMeService(
        {
          userId: newUserId,
          bio: 'Updated bio for step 3 testing',
          phone: '+84988776655',
          socialLinks: {
            facebook: 'https://facebook.com/step3tester',
            github: 'https://github.com/step3tester'
          }
        },
        tx
      )
      assert(updateMeRes.success === true, '[TxUser] updateMeService updates bio and social links')
      assert(updateMeRes.data.bio === 'Updated bio for step 3 testing', '[TxUser] updated bio matches')
      assert(updateMeRes.data.socialLinks.facebook === 'https://facebook.com/step3tester', '[TxUser] facebook link stored')
      assert(updateMeRes.data.socialLinks.github === 'https://github.com/step3tester', '[TxUser] github link stored')
      assert(updateMeRes.data._id === newUserId, '[TxUser] updateMeService returns _id compat')

      // Update Me: Username Conflict Check
      // Try to rename to another existing username
      if (existingUser && existingUser.username) {
        const conflictUsernameRes = await updateMeService(
          {
            userId: newUserId,
            username: existingUser.username
          },
          tx
        )
        assert(
          conflictUsernameRes.success === false && conflictUsernameRes.message === 'Username already taken',
          '[TxUser] updateMeService blocks username collision with another user'
        )
      }

      // Change Password
      const newPasswordVal = 'NewSecretPassword456!'
      const changePwRes = await changePasswordService(
        {
          userId: newUserId,
          oldPassword: testPassword,
          newPassword: newPasswordVal
        },
        tx
      )
      assert(changePwRes.success === true, '[TxUser] changePasswordService successfully changed password')

      // Login with New Password
      const newLoginResult = await loginUserService(
        {
          email: testEmail,
          password: newPasswordVal
        },
        tx
      )
      assert(newLoginResult.success === true, '[TxUser] loginUserService succeeds with new password')

      // Forgot Password & Reset Password Flow
      const forgotRes = await forgotPasswordService(testEmail, tx)
      assert(forgotRes.success === true, '[TxUser] forgotPasswordService generates reset token')

      const userWithResetToken = await tx.user.findUnique({
        where: { id: newUserId },
        select: { resetPasswordToken: true }
      })
      assert(userWithResetToken?.resetPasswordToken !== null, '[TxUser] reset password token hash was saved')

      // Logout User
      const logoutRes = await logoutUserService({ userId: newUserId }, tx)
      assert(logoutRes.success === true, '[TxUser] logoutUserService succeeds')

      const loggedOutUser = await tx.user.findUnique({
        where: { id: newUserId },
        select: { refreshToken: true }
      })
      assert(loggedOutUser?.refreshToken === null, '[TxUser] user refreshToken is cleared in DB after logout')

      // Intentional Rollback
      throw new Error('ROLLBACK_STEP_3_ISOLATION_VERIFIED')
    }, { maxWait: 20000, timeout: 30000 })
  } catch (err: any) {
    if (err.message === 'ROLLBACK_STEP_3_ISOLATION_VERIFIED') {
      txRollbackCaught = true
    } else {
      console.error('Unexpected error in transaction:', err)
    }
  }

  assert(txRollbackCaught, '[Isolation] Transaction successfully intercepted and rolled back cleanly')

  // Verify Zero Permanent Mutations
  const finalUserCount = await prisma.user.count()
  const finalCatCount = await prisma.category.count()

  assert(
    finalUserCount === initialUserCount,
    `[Isolation] Database zero mutation assertion: Users count stayed ${finalUserCount} (initial ${initialUserCount})`
  )
  assert(
    finalCatCount === initialCatCount,
    `[Isolation] Database zero mutation assertion: Categories count stayed ${finalCatCount} (initial ${initialCatCount})`
  )

  await disconnectPrisma()

  console.log('\n' + '='.repeat(80))
  console.log(`  STEP 3 TEST RESULTS: TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`)
  console.log('='.repeat(80) + '\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runStep3Tests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
