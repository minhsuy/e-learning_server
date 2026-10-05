/**
 * Phase 2 - Step 4: Post-Implementation HTTP API Test Audit Script
 * Executes real HTTP requests against the live running server (http://localhost:3002)
 *
 * Checks:
 * 1. Public & Auth Endpoints (Register validation, Login Option B, Get Teachers, Categories)
 * 2. Protected User Endpoints (Get Me, Profile, Update Me, Token Refresh)
 * 3. Protected Admin Endpoints (Get All Users, User Detail, Self-Delete Protection, Category CRUD)
 * 4. Authorization Guards (Missing Token -> 401, User calling Admin -> 403)
 * 5. UUID Param Validation (Valid UUID vs Mongo ObjectId vs Garbage String)
 * 6. Information Leakage (Strictly no password, otpCode, refreshToken in responses)
 * 7. Historic Duplicate Username 'thaiminh' Analysis
 */

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = process.env.URL_SERVER || 'http://localhost:3002'
const ACCESS_SECRET = process.env.JWT_SECRECT_ACCESS_TOKEN || 'thaiminh061206'
const REFRESH_SECRET = process.env.JWT_SECRECT_REFRESH_TOKEN || 'thaiminh0612060504'

// Known existing IDs from PostgreSQL DB
const ADMIN_USER_ID = '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8'
const NORMAL_USER_ID = 'c55de839-f059-519c-8820-b16aa17fb9c3'
const TEACHER_USER_ID = '13608f92-8acf-53e3-adcb-0d832e9cb1d4'
const KNOWN_CAT_ID = 'fc5d66a4-7468-5328-a6a9-16c3a9e49881'
const KNOWN_CAT_SLUG = 'lap-trinh-web'
const MONGO_OBJECT_ID = '507f1f77bcf86cd799439011'
const GARBAGE_ID = 'invalid-not-uuid'

// Tokens
const adminToken = jwt.sign({ userId: ADMIN_USER_ID, role: 'admin' }, ACCESS_SECRET, { expiresIn: '1h' })
const userToken = jwt.sign({ userId: NORMAL_USER_ID, role: 'user' }, ACCESS_SECRET, { expiresIn: '1h' })
const teacherToken = jwt.sign({ userId: TEACHER_USER_ID, role: 'teacher' }, ACCESS_SECRET, { expiresIn: '1h' })
const validRefreshToken = jwt.sign({ userId: NORMAL_USER_ID }, REFRESH_SECRET, { expiresIn: '7d' })

export interface ITestResult {
  id: string
  name: string
  endpoint: string
  method: string
  expectedStatus: number
  actualStatus?: number
  status: 'PASS' | 'FAIL' | 'NOT EXECUTED'
  reason?: string
  responseSnippet?: string
}

const auditResults: ITestResult[] = []

async function executeHttpTest(
  id: string,
  name: string,
  endpoint: string,
  method: string,
  options: {
    headers?: Record<string, string>
    body?: any
    expectedStatus: number
    validateBody?: (body: any) => { ok: boolean; message?: string }
  }
) {
  const url = `${BASE_URL}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    })

    const status = res.status
    let data: any
    try {
      data = await res.json()
    } catch {
      data = await res.text()
    }

    const snippet = typeof data === 'string' ? data.slice(0, 150) : JSON.stringify(data).slice(0, 150)

    if (status !== options.expectedStatus) {
      auditResults.push({
        id,
        name,
        endpoint,
        method,
        expectedStatus: options.expectedStatus,
        actualStatus: status,
        status: 'FAIL',
        reason: `Status mismatch: expected ${options.expectedStatus}, got ${status}`,
        responseSnippet: snippet
      })
      console.log(`  ✗ [FAIL] ${id} - ${name} (Status: ${status}, Expected: ${options.expectedStatus})`)
      return
    }

    if (options.validateBody) {
      const validation = options.validateBody(data)
      if (!validation.ok) {
        auditResults.push({
          id,
          name,
          endpoint,
          method,
          expectedStatus: options.expectedStatus,
          actualStatus: status,
          status: 'FAIL',
          reason: `Body validation failed: ${validation.message}`,
          responseSnippet: snippet
        })
        console.log(`  ✗ [FAIL] ${id} - ${name} (Body error: ${validation.message})`)
        return
      }
    }

    auditResults.push({
      id,
      name,
      endpoint,
      method,
      expectedStatus: options.expectedStatus,
      actualStatus: status,
      status: 'PASS',
      responseSnippet: snippet
    })
    console.log(`  ✓ [PASS] ${id} - ${name} (HTTP ${status})`)
  } catch (err: any) {
    auditResults.push({
      id,
      name,
      endpoint,
      method,
      expectedStatus: options.expectedStatus,
      status: 'FAIL',
      reason: `Network/Fetch error: ${err.message}`
    })
    console.log(`  ✗ [FAIL] ${id} - ${name} (Error: ${err.message})`)
  }
}

async function runAudit() {
  console.log('========================================================================')
  console.log('PHASE 2 - STEP 4: POST-IMPLEMENTATION API TEST AUDIT')
  console.log(`Target Server: ${BASE_URL}`)
  console.log('========================================================================\n')

  // --- GROUP 1: PUBLIC & AUTHENTICATION ENDPOINTS ---
  console.log('--- Group 1: Public & Authentication Endpoints ---')

  // TC-01: Register validation error (Missing fields)
  await executeHttpTest('TC-01', 'Register validation syntax error', '/api/users/register', 'POST', {
    body: { username: '', email: 'not-an-email', password: '123' },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: typeof b.errors === 'object' && Boolean(b.errors?.username && b.errors?.email && b.errors?.password),
      message: `Expected mapped errors for username, email, password; got: ${JSON.stringify(b)}`
    })
  })

  // TC-02: Register duplicate email collision check
  await executeHttpTest('TC-02', 'Register duplicate email error contract', '/api/users/register', 'POST', {
    body: {
      username: 'any_user_123',
      email: 'thaiminh0612@gmail.com', // Already taken by Admin
      password: 'Password123!',
      confirm_password: 'Password123!'
    },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.email === 'Email already in use',
      message: `Expected errors.email = "Email already in use", got ${JSON.stringify(b.errors)}`
    })
  })

  // TC-03: Register Happy Path (NOT EXECUTED - prevents sending unintended real emails via Nodemailer)
  auditResults.push({
    id: 'TC-03',
    name: 'Register successful user creation & welcome email',
    endpoint: '/api/users/register',
    method: 'POST',
    expectedStatus: 200,
    status: 'NOT EXECUTED',
    reason: 'Skipped to prevent sending real emails and uncontrolled database records during audit.'
  })
  console.log('  - [NOT EXECUTED] TC-03 - Register successful user creation (Email dispatch boundary)')

  // TC-04: Login validation error (missing password)
  await executeHttpTest('TC-04', 'Login syntax validation error', '/api/users/login', 'POST', {
    body: { email: 'admin@tmdemy.com' },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: typeof b.errors === 'object' && Boolean(b.errors?.password),
      message: `Expected errors.password, got: ${JSON.stringify(b)}`
    })
  })

  // TC-05: Login non-existent email
  await executeHttpTest('TC-05', 'Login non-existent email error contract', '/api/users/login', 'POST', {
    body: { email: 'nonexistent-user-xyz@tmdemy.com', password: 'password123' },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.email === 'Email không tồn tại',
      message: `Expected errors.email = "Email không tồn tại", got ${JSON.stringify(b.errors)}`
    })
  })

  // TC-06: Login wrong password on existing user
  await executeHttpTest('TC-06', 'Login wrong password on existing user', '/api/users/login', 'POST', {
    body: { email: 'thaiminh0612@gmail.com', password: 'WrongPassword999!' },
    expectedStatus: 401,
    validateBody: (b) => ({
      ok: b.success === false && b.message === 'Incorrect password',
      message: `Expected message="Incorrect password", got ${JSON.stringify(b)}`
    })
  })

  // TC-07: Forgot Password validation error (empty email)
  await executeHttpTest('TC-07', 'Forgot password validation error', '/api/users/forgot-password', 'POST', {
    body: { email: '' },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: typeof b.errors === 'object' && Boolean(b.errors?.email),
      message: `Expected errors.email, got: ${JSON.stringify(b)}`
    })
  })

  // TC-08: Forgot Password non-existent email
  await executeHttpTest('TC-08', 'Forgot password non-existent email', '/api/users/forgot-password', 'POST', {
    body: { email: 'nonexistent-user-reset@tmdemy.com' },
    expectedStatus: 404,
    validateBody: (b) => ({
      ok: b.success === false && b.message === 'Email does not exist !',
      message: `Expected message="Email does not exist !", got ${JSON.stringify(b)}`
    })
  })

  // TC-09: Forgot Password Happy Path (NOT EXECUTED - prevents sending real reset password emails)
  auditResults.push({
    id: 'TC-09',
    name: 'Forgot password dispatch real email',
    endpoint: '/api/users/forgot-password',
    method: 'POST',
    expectedStatus: 200,
    status: 'NOT EXECUTED',
    reason: 'Skipped to prevent sending real reset password email to user mailbox.'
  })
  console.log('  - [NOT EXECUTED] TC-09 - Forgot password dispatch real email (Email safety boundary)')

  // TC-10: Refresh Token endpoint - valid token against un-stored refresh_token
  await executeHttpTest('TC-10', 'Access token renewal with un-stored refresh_token rejected', '/api/users/access_token', 'POST', {
    body: { refresh_token: validRefreshToken },
    expectedStatus: 401,
    validateBody: (b) => ({
      ok: b.success === false && b.message === 'Refresh token không hợp lệ hoặc đã bị thu hồi',
      message: `Expected invalid/revoked rejection, got ${JSON.stringify(b)}`
    })
  })

  // TC-11: Refresh Token endpoint - missing token
  await executeHttpTest('TC-11', 'Access token renewal missing token', '/api/users/access_token', 'POST', {
    body: {},
    expectedStatus: 401,
    validateBody: (b) => ({ ok: b.success === false && b.message === 'Refresh token is missing' })
  })

  // TC-12: Get Public Teachers list
  await executeHttpTest('TC-12', 'Get public teachers list', '/api/users/teachers?page=1&limit=5', 'GET', {
    expectedStatus: 200,
    validateBody: (b) => ({
      ok: b.success === true && Array.isArray(b.data?.teachers) && typeof b.data?.pagination?.total === 'number',
      message: `Expected success=true, teachers array and pagination`
    })
  })

  // TC-13: Get Public Categories list
  await executeHttpTest('TC-13', 'Get public categories list', '/api/categories', 'GET', {
    expectedStatus: 200,
    validateBody: (b) => ({
      ok: b.success === true && Array.isArray(b.data?.categories) && b.data.categories.length > 0,
      message: `Expected categories array with data`
    })
  })

  // TC-14: Get Category Detail by valid slug
  await executeHttpTest('TC-14', 'Get category detail by valid slug', `/api/categories/${KNOWN_CAT_SLUG}`, 'GET', {
    expectedStatus: 200,
    validateBody: (b) => ({
      ok: b.success === true && b.data?.slug === KNOWN_CAT_SLUG && Boolean(b.data?._id && b.data?.id),
      message: `Expected category matching slug with id and _id compat`
    })
  })

  // TC-15: Get Category Detail by non-existent slug
  await executeHttpTest('TC-15', 'Get category detail by unknown slug', '/api/categories/non-existent-category-slug-xyz', 'GET', {
    expectedStatus: 404,
    validateBody: (b) => ({ ok: b.success === false })
  })

  // --- GROUP 2: PROTECTED USER ENDPOINTS & AUTHORIZATION GUARDS ---
  console.log('\n--- Group 2: Protected User Endpoints & Auth Guards ---')

  // TC-16: Get Me without token -> 401
  await executeHttpTest('TC-16', 'Get Me without token (Auth guard)', '/api/users/me', 'GET', {
    expectedStatus: 401,
    validateBody: (b) => ({ ok: b.success === false && b.error === 'Access Token is missing!' })
  })

  // TC-17: Get Me with invalid token -> 401
  await executeHttpTest('TC-17', 'Get Me with malformed token', '/api/users/me', 'GET', {
    headers: { Authorization: 'Bearer bad.token.value' },
    expectedStatus: 401,
    validateBody: (b) => ({ ok: b.success === false && b.error === 'invalid token' })
  })

  // TC-18: Get Me with valid User token -> 200 & verify zero sensitive data leakage
  await executeHttpTest('TC-18', 'Get Me valid user & zero information disclosure', '/api/users/me', 'GET', {
    headers: { Authorization: `Bearer ${userToken}` },
    expectedStatus: 200,
    validateBody: (b) => {
      const u = b.data
      if (!u) return { ok: false, message: 'Missing data in response' }
      if (u.id !== NORMAL_USER_ID) return { ok: false, message: `Expected id=${NORMAL_USER_ID}, got ${u.id}` }
      if (!u._id) return { ok: false, message: 'Missing _id compat field' }
      if (u.password !== undefined) return { ok: false, message: 'LEAK: password found in response!' }
      if (u.otpCode !== undefined) return { ok: false, message: 'LEAK: otpCode found in response!' }
      if (u.refreshToken !== undefined) return { ok: false, message: 'LEAK: refreshToken found in response!' }
      if (typeof u.socialLinks !== 'object' || u.socialLinks === null) {
        return { ok: false, message: 'socialLinks must be an object' }
      }
      return { ok: true }
    }
  })

  // TC-19: Get User Profile by valid UUID
  await executeHttpTest('TC-19', 'Get public profile by valid UUID', `/api/users/profile/${ADMIN_USER_ID}`, 'GET', {
    expectedStatus: 200,
    validateBody: (b) => ({
      ok: b.success === true && b.data?.id === ADMIN_USER_ID && b.data?.password === undefined,
      message: `Expected public profile without password`
    })
  })

  // TC-20: Get User Profile by MongoDB ObjectId -> 400
  await executeHttpTest('TC-20', 'Get profile rejects Mongo ObjectId (UUID validator)', `/api/users/profile/${MONGO_OBJECT_ID}`, 'GET', {
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.id === 'Invalid user id',
      message: `Expected b.errors.id = "Invalid user id", got ${JSON.stringify(b)}`
    })
  })

  // TC-21: Update Me validation error (disallowed fields or invalid syntax)
  await executeHttpTest('TC-21', 'Update Me validation syntax checks', '/api/users/update-me', 'PUT', {
    headers: { Authorization: `Bearer ${userToken}` },
    body: { phone: 'not-a-phone-number' },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: typeof b.errors === 'object' && Boolean(b.errors?.phone),
      message: `Expected errors.phone, got ${JSON.stringify(b)}`
    })
  })

  // TC-22: Logout with valid token
  await executeHttpTest('TC-22', 'Logout user session', '/api/users/logout', 'POST', {
    headers: { Authorization: `Bearer ${userToken}` },
    expectedStatus: 200,
    validateBody: (b) => ({ ok: b.success === true && b.message === 'Logout successfully !' })
  })

  // --- GROUP 3: PROTECTED ADMIN ENDPOINTS & ROLE GUARDS ---
  console.log('\n--- Group 3: Protected Admin Endpoints & Role Guards ---')

  // TC-23: Admin endpoint called by normal User -> 403 Forbidden
  await executeHttpTest('TC-23', 'Admin endpoint called by User (Role guard)', '/api/admin/users', 'GET', {
    headers: { Authorization: `Bearer ${userToken}` },
    expectedStatus: 403,
    validateBody: (b) => ({ ok: b.success === false && b.message === 'FORBIDDEN - Admin role required' })
  })

  // TC-24: Admin endpoint called by Teacher -> 403 Forbidden
  await executeHttpTest('TC-24', 'Admin endpoint called by Teacher (Role guard)', '/api/admin/users', 'GET', {
    headers: { Authorization: `Bearer ${teacherToken}` },
    expectedStatus: 403,
    validateBody: (b) => ({ ok: b.success === false && b.message === 'FORBIDDEN - Admin role required' })
  })

  // TC-25: Get All Users with Admin token -> 200
  await executeHttpTest('TC-25', 'Get all users with Admin token', '/api/admin/users?page=1&limit=5', 'GET', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200,
    validateBody: (b) => ({
      ok: b.success === true && Array.isArray(b.data?.users) && typeof b.data?.pagination?.total === 'number',
      message: `Expected users array and pagination metadata`
    })
  })

  // TC-26: Get User Detail with Admin token by valid UUID
  await executeHttpTest('TC-26', 'Get user detail by valid UUID (Admin)', `/api/admin/users/${NORMAL_USER_ID}`, 'GET', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200,
    validateBody: (b) => ({
      ok: b.success === true && b.data?.id === NORMAL_USER_ID && b.data?.password === undefined,
      message: `Expected user detail without password`
    })
  })

  // TC-27: Get User Detail with Mongo ObjectId -> 400 (UUID validator)
  await executeHttpTest('TC-27', 'Get user detail rejects Mongo ObjectId (Admin)', `/api/admin/users/${MONGO_OBJECT_ID}`, 'GET', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.id === 'Invalid user id',
      message: `Expected b.errors.id = "Invalid user id", got ${JSON.stringify(b)}`
    })
  })

  // TC-28: Admin Self-Delete Protection (Admin deletes their own account) -> 400 SELF_DELETE_BLOCKED
  await executeHttpTest('TC-28', 'Admin self-delete account blocked', `/api/admin/users/${ADMIN_USER_ID}`, 'DELETE', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.success === false && b.errorCode === 'SELF_DELETE_BLOCKED',
      message: `Expected errorCode = SELF_DELETE_BLOCKED, got ${JSON.stringify(b)}`
    })
  })

  // TC-29: Admin Delete User with Mongo ObjectId -> 400 (UUID validator)
  await executeHttpTest('TC-29', 'Admin delete rejects Mongo ObjectId', `/api/admin/users/${MONGO_OBJECT_ID}`, 'DELETE', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.id === 'Invalid user id',
      message: `Expected b.errors.id = "Invalid user id", got ${JSON.stringify(b)}`
    })
  })

  // TC-30: Admin Delete Category with Mongo ObjectId -> 400 (D3 fix verification)
  await executeHttpTest('TC-30', 'Admin delete category rejects Mongo ObjectId (D3 fix)', `/api/admin/categories/${MONGO_OBJECT_ID}`, 'DELETE', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.id === 'Invalid Category ID',
      message: `Expected b.errors.id = "Invalid Category ID", got ${JSON.stringify(b)}`
    })
  })

  // TC-31: Admin Delete Category with Garbage string -> 400
  await executeHttpTest('TC-31', 'Admin delete category rejects garbage string', `/api/admin/categories/${GARBAGE_ID}`, 'DELETE', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.id === 'Invalid Category ID',
      message: `Expected b.errors.id = "Invalid Category ID", got ${JSON.stringify(b)}`
    })
  })

  // TC-32: Admin Update Category with Mongo ObjectId -> 400
  await executeHttpTest('TC-32', 'Admin update category rejects Mongo ObjectId', `/api/admin/categories/${MONGO_OBJECT_ID}`, 'PUT', {
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: 'New Name' },
    expectedStatus: 400,
    validateBody: (b) => ({
      ok: b.errors?.id === 'Invalid Category ID',
      message: `Expected b.errors.id = "Invalid Category ID", got ${JSON.stringify(b)}`
    })
  })

  // TC-33: Admin Create Category duplicate name/slug conflict -> 409
  await executeHttpTest('TC-33', 'Admin create category duplicate name/slug conflict', '/api/admin/categories/', 'POST', {
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { name: 'Lập trình web' }, // Already exists
    expectedStatus: 409,
    validateBody: (b) => ({
      ok: b.success === false && (b.errorCode === 'SLUG_CONFLICT' || b.errorCode === 'NAME_CONFLICT'),
      message: `Expected errorCode = SLUG_CONFLICT or NAME_CONFLICT, got ${JSON.stringify(b)}`
    })
  })

  // TC-34: Admin Create Teacher duplicate email conflict -> 409
  await executeHttpTest('TC-34', 'Admin create teacher duplicate email conflict', '/api/admin/users', 'POST', {
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      username: 'teacher_new_demo',
      email: 'thaiminh0612@gmail.com', // Admin email
      password: 'StrongPassword123!',
      confirm_password: 'StrongPassword123!'
    },
    expectedStatus: 409,
    validateBody: (b) => ({
      ok: b.success === false && b.errorCode === 'EMAIL_CONFLICT',
      message: `Expected errorCode = EMAIL_CONFLICT, got ${JSON.stringify(b)}`
    })
  })

  // TC-35: Admin Create Teacher duplicate username conflict -> 409
  await executeHttpTest('TC-35', 'Admin create teacher duplicate username conflict', '/api/admin/users', 'POST', {
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      username: 'new_username123', // Admin username
      email: 'unique_teacher_new_test@example.com',
      password: 'StrongPassword123!',
      confirm_password: 'StrongPassword123!'
    },
    expectedStatus: 409,
    validateBody: (b) => ({
      ok: b.success === false && b.errorCode === 'USERNAME_CONFLICT',
      message: `Expected errorCode = USERNAME_CONFLICT, got ${JSON.stringify(b)}`
    })
  })

  // TC-36: Historic duplicate username 'thaiminh' audit
  await executeHttpTest('TC-36', 'Historic duplicate username thaiminh search query', '/api/admin/users?search=thaiminh', 'GET', {
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200,
    validateBody: (b) => ({
      ok: b.success === true && Array.isArray(b.data?.users) && b.data.users.length >= 2,
      message: `Expected at least 2 users matching historic duplicate thaiminh, got ${b.data?.users?.length}`
    })
  })

  // Summary
  const passed = auditResults.filter((r) => r.status === 'PASS').length
  const failed = auditResults.filter((r) => r.status === 'FAIL').length
  const notExecuted = auditResults.filter((r) => r.status === 'NOT EXECUTED').length

  console.log('\n========================================================================')
  console.log(`AUDIT EXECUTION SUMMARY: ${passed} PASSED | ${failed} FAILED | ${notExecuted} NOT EXECUTED`)
  console.log('========================================================================\n')

  return auditResults
}

runAudit()
  .then((results) => {
    console.log('Audit completed successfully.')
  })
  .catch((err) => {
    console.error('Fatal audit execution error:', err)
  })
