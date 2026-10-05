/**
 * Test Suite for Phase 2 Step 1: Zod Application Model & Legacy Mongoose Isolation
 *
 * File: scripts/migration-utils/step-01-zod-model.test.ts
 */

import {
  userSchema,
  userPublicSchema,
  userCompactSchema,
  userInternalSchema,
  socialLinksSchema,
  createUserInputSchema,
  updateUserInputSchema
} from '../../src/models/user.model'
import UserModelLegacy, { userSchema as legacyUserSchema } from '../../src/models/legacy/user.legacy.model'
import { UserRole, UserStatus } from '@prisma/client'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: STEP 1 — ZOD APPLICATION MODEL & LEGACY MONGOOSE ISOLATION')
  console.log('='.repeat(80))

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  PASSED: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAILED: ${testName}`)
      failed++
    }
  }

  // --- GROUP 1: ZOD SCHEMAS ---
  console.log('\n[1. ZOD DOMAIN SCHEMAS VALIDATION]:')

  const validUserData = {
    id: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    username: 'test_user',
    email: 'test@example.com',
    status: UserStatus.ACTIVE,
    role: UserRole.USER,
    avatar: 'https://example.com/avatar.jpg',
    phone: '0912345678',
    bio: 'Software engineer',
    socialFacebook: 'https://facebook.com/test',
    socialInstagram: '',
    socialGithub: 'https://github.com/test',
    isVerified: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z')
  }

  // Test 1.1: userSchema parses valid data
  const parsedUser = userSchema.safeParse(validUserData)
  assert(parsedUser.success, 'userSchema successfully parses valid domain User object')

  // Test 1.2: userSchema rejects invalid UUID
  const invalidUUIDUser = userSchema.safeParse({ ...validUserData, id: 'invalid-id-format' })
  assert(!invalidUUIDUser.success, 'userSchema correctly rejects non-UUID id')

  // Test 1.3: userSchema rejects invalid email
  const invalidEmailUser = userSchema.safeParse({ ...validUserData, email: 'not-an-email' })
  assert(!invalidEmailUser.success, 'userSchema correctly rejects invalid email format')

  // Test 1.4: userPublicSchema output filtering
  const publicUser = userPublicSchema.parse(validUserData)
  assert(publicUser.id === validUserData.id && publicUser.email === validUserData.email, 'userPublicSchema preserves public fields')

  // Test 1.5: userCompactSchema output filtering
  const compactUser = userCompactSchema.parse(validUserData)
  const compactKeys = Object.keys(compactUser).sort()
  assert(
    JSON.stringify(compactKeys) === JSON.stringify(['avatar', 'id', 'role', 'username']),
    `userCompactSchema contains only [avatar, id, role, username] (got ${compactKeys.join(', ')})`
  )

  // Test 1.6: userInternalSchema validation with sensitive fields
  const internalData = {
    ...validUserData,
    password: 'hashed_password_123',
    otpCode: 'hashed_otp_999',
    otpExpires: new Date('2026-10-01T23:59:59Z'),
    refreshToken: 'hashed_refresh_token_xyz',
    resetPasswordToken: null,
    resetPasswordExpires: null
  }
  const parsedInternal = userInternalSchema.safeParse(internalData)
  assert(parsedInternal.success, 'userInternalSchema successfully parses and retains sensitive fields')

  // Test 1.7: socialLinksSchema defaults
  const parsedLinks = socialLinksSchema.parse({})
  assert(
    parsedLinks.facebook === '' && parsedLinks.instagram === '' && parsedLinks.github === '',
    'socialLinksSchema defaults empty strings for all 3 platforms'
  )

  // Test 1.8: createUserInputSchema requires password >= 6
  const shortPass = createUserInputSchema.safeParse({
    username: 'abc',
    email: 'abc@example.com',
    password: '123'
  })
  assert(!shortPass.success, 'createUserInputSchema rejects password < 6 characters')

  const validCreate = createUserInputSchema.safeParse({
    username: 'abc',
    email: 'abc@example.com',
    password: 'securePassword123'
  })
  assert(validCreate.success, 'createUserInputSchema accepts valid registration payload')

  // --- GROUP 2: LEGACY MONGOOSE MODEL ISOLATION ---
  console.log('\n[2. LEGACY MONGOOSE USER MODEL ISOLATION]:')

  // Test 2.1: Legacy model exists and has correct modelName
  assert(UserModelLegacy.modelName === 'User', 'Legacy UserModel has modelName "User"')

  // Test 2.2: Legacy schema paths verification
  const paths = Object.keys(legacyUserSchema.paths)
  assert(paths.includes('username'), 'Legacy userSchema contains "username" path')
  assert(paths.includes('email'), 'Legacy userSchema contains "email" path')
  assert(paths.includes('password'), 'Legacy userSchema contains "password" path')
  assert(paths.includes('role'), 'Legacy userSchema contains "role" path')
  assert(paths.includes('isVerified'), 'Legacy userSchema contains "isVerified" path')
  assert(paths.includes('socialLinks.facebook'), 'Legacy userSchema contains "socialLinks.facebook" path')
  assert(paths.includes('socialLinks.github'), 'Legacy userSchema contains "socialLinks.github" path')

  console.log('\n' + '-'.repeat(80))
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('-'.repeat(80))

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
