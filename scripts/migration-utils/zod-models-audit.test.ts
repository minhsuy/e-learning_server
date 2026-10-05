/**
 * TMDEMY — ZOD APPLICATION MODELS AUDIT & RUNTIME VALIDATION TEST SUITE
 *
 * Verifies:
 * 1. User Application Model schemas & types
 * 2. Category Application Model schemas & types
 * 3. Course, Chapter, Lesson Application Model schemas & types
 * 4. Runtime validation in createTeacherService at Service boundary
 * 5. Runtime validation in createCategoryService at Service boundary
 * 6. Database state preservation (no unwanted mutations)
 *
 * File: scripts/migration-utils/zod-models-audit.test.ts
 */

import { prisma, connectPrisma, disconnectPrisma } from '../../src/config/prisma'
import {
  userSchema,
  userPublicSchema,
  userInternalSchema,
  createTeacherPayloadSchema,
  createTeacherInputSchema
} from '../../src/models/user.model'
import {
  categorySchema,
  categoryPublicSchema,
  categoryCompactSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema
} from '../../src/models/category.model'
import {
  courseSchema,
  createCourseInputSchema
} from '../../src/models/course.model'
import {
  chapterSchema,
  createChapterInputSchema
} from '../../src/models/chapter.model'
import {
  lessonSchema,
  createLessonInputSchema
} from '../../src/models/lesson.model'
import { createTeacherService } from '../../src/services/admin.service'
import { createCategoryService } from '../../src/services/category.service'
import { UserRole } from '@prisma/client'

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

async function runZodAuditTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: ZOD APPLICATION MODELS AUDIT & RUNTIME VALIDATION')
  console.log('='.repeat(80))

  await connectPrisma()

  const initialUserCount = await prisma.user.count()
  const initialCatCount = await prisma.category.count()
  const initialCourseCount = await prisma.course.count()
  const initialChapterCount = await prisma.chapter.count()
  const initialLessonCount = await prisma.lesson.count()

  console.log(
    `\n  Initial DB: Users=${initialUserCount}, Categories=${initialCatCount}, ` +
      `Courses=${initialCourseCount}, Chapters=${initialChapterCount}, Lessons=${initialLessonCount}\n`
  )

  // ==========================================
  // SUITE 1: USER APPLICATION MODEL SCHEMAS
  // ==========================================
  console.log('--- SUITE 1: User Application Model Schemas ---')

  // 1.1 Valid createTeacherPayload
  const validTeacherPayload = {
    username: 'test_teacher_zod',
    email: 'test_teacher_zod@tmdemy.com',
    password: 'password123',
    avatar: 'https://example.com/avatar.jpg',
    phone: '0901234567',
    bio: 'Experienced instructor in software development',
    socialLinks: {
      facebook: 'https://facebook.com/teacher',
      github: 'https://github.com/teacher'
    }
  }
  const teacherParseSuccess = createTeacherPayloadSchema.safeParse(validTeacherPayload)
  assert(teacherParseSuccess.success === true, '[User] createTeacherPayloadSchema parses valid payload')

  // 1.2 Invalid password (too short)
  const invalidPwdPayload = { ...validTeacherPayload, password: '123' }
  const pwdParseResult = createTeacherPayloadSchema.safeParse(invalidPwdPayload)
  assert(pwdParseResult.success === false, '[User] createTeacherPayloadSchema rejects password < 6 chars')

  // 1.3 Invalid username (spaces / special chars)
  const invalidUserPayload = { ...validTeacherPayload, username: 'invalid name with spaces!' }
  const userParseResult = createTeacherPayloadSchema.safeParse(invalidUserPayload)
  assert(userParseResult.success === false, '[User] createTeacherPayloadSchema rejects invalid username regex')

  // 1.4 Invalid email
  const invalidEmailPayload = { ...validTeacherPayload, email: 'not-an-email' }
  const emailParseResult = createTeacherPayloadSchema.safeParse(invalidEmailPayload)
  assert(emailParseResult.success === false, '[User] createTeacherPayloadSchema rejects invalid email')

  // 1.5 createTeacherInputSchema with wrapper
  const inputWrapperParse = createTeacherInputSchema.safeParse({ payload: validTeacherPayload })
  assert(inputWrapperParse.success === true, '[User] createTeacherInputSchema parses wrapped payload')

  // 1.6 userPublicSchema ignores/rejects invalid UUID
  const validPublicUser = {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'valid_user',
    email: 'valid_user@example.com',
    role: 'USER',
    status: 'ACTIVE',
    avatar: '',
    phone: null,
    bio: null,
    socialLinks: { facebook: '', instagram: '', github: '' },
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const publicParse = userPublicSchema.safeParse(validPublicUser)
  assert(publicParse.success === true, '[User] userPublicSchema validates public user')

  const invalidPublicUser = { ...validPublicUser, id: 'not-a-uuid' }
  const badPublicParse = userPublicSchema.safeParse(invalidPublicUser)
  assert(badPublicParse.success === false, '[User] userPublicSchema rejects non-UUID id')

  // ==========================================
  // SUITE 2: CATEGORY APPLICATION MODEL SCHEMAS
  // ==========================================
  console.log('\n--- SUITE 2: Category Application Model Schemas ---')

  // 2.1 createCategoryInputSchema valid
  const validCatInput = {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Learn modern web technologies'
  }
  const catInputParse = createCategoryInputSchema.safeParse(validCatInput)
  assert(catInputParse.success === true, '[Category] createCategoryInputSchema parses valid input')

  // 2.2 createCategoryInputSchema missing name
  const missingNameCat = { description: 'Missing name' }
  const missingNameParse = createCategoryInputSchema.safeParse(missingNameCat)
  assert(missingNameParse.success === false, '[Category] createCategoryInputSchema rejects missing name')
  if (!missingNameParse.success) {
    assert(
      missingNameParse.error.errors[0]?.message === 'Category name is required',
      '[Category] createCategoryInputSchema produces "Category name is required" message'
    )
  }

  // 2.3 createCategoryInputSchema empty name string
  const emptyNameCat = { name: '' }
  const emptyNameParse = createCategoryInputSchema.safeParse(emptyNameCat)
  assert(emptyNameParse.success === false, '[Category] createCategoryInputSchema rejects empty name string')

  // 2.4 categorySchema base domain validation
  const validCategoryDomain = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Frontend',
    slug: 'frontend',
    description: 'HTML, CSS, JS',
    createdById: null,
    isDestroyed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const catDomainParse = categorySchema.safeParse(validCategoryDomain)
  assert(catDomainParse.success === true, '[Category] categorySchema validates base domain model')

  // 2.5 updateCategoryInputSchema partial updates
  const partialCatUpdate = { description: 'Updated description only' }
  const updateCatParse = updateCategoryInputSchema.safeParse(partialCatUpdate)
  assert(updateCatParse.success === true, '[Category] updateCategoryInputSchema allows partial fields')

  // ==========================================
  // SUITE 3: COURSE, CHAPTER & LESSON APPLICATION MODEL SCHEMAS
  // ==========================================
  console.log('\n--- SUITE 3: Course, Chapter & Lesson Application Model Schemas ---')

  // 3.1 Course schema
  const courseInputParse = createCourseInputSchema.safeParse({
    title: 'NodeJS Masterclass',
    description: 'Complete backend course',
    price: 99.99,
    authorId: '55555555-5555-4555-8555-555555555555'
  })
  assert(courseInputParse.success === true, '[Course] createCourseInputSchema parses valid input')

  // 3.2 Chapter schema
  const chapterInputParse = createChapterInputSchema.safeParse({
    title: 'Introduction to Express',
    courseId: '33333333-3333-4333-8333-333333333333',
    position: 1
  })
  assert(chapterInputParse.success === true, '[Chapter] createChapterInputSchema parses valid input')

  // 3.3 Lesson schema
  const lessonInputParse = createLessonInputSchema.safeParse({
    title: 'Installing dependencies',
    chapterId: '44444444-4444-4444-8444-444444444444',
    courseId: '33333333-3333-4333-8333-333333333333',
    authorId: '55555555-5555-4555-8555-555555555555',
    order: 1
  })
  assert(lessonInputParse.success === true, '[Lesson] createLessonInputSchema parses valid input')

  // ==========================================
  // SUITE 4: SERVICE BOUNDARY RUNTIME VALIDATION (createTeacherService)
  // ==========================================
  console.log('\n--- SUITE 4: Service Boundary Runtime Validation (createTeacherService) ---')

  // 4.1 createTeacherService rejects payload with short password directly at service boundary
  const badPwdResult = await createTeacherService({
    payload: {
      username: 'teacher_bad_pwd',
      email: 'teacher_bad_pwd@tmdemy.com',
      password: '123'
    } as any
  })
  assert(badPwdResult.success === false, '[createTeacherService] rejects short password at service boundary')
  assert(badPwdResult.statusCode === 400, '[createTeacherService] returns statusCode 400 for invalid data')
  assert(
    badPwdResult.message === 'Invalid teacher input data',
    '[createTeacherService] returns "Invalid teacher input data" message'
  )

  // 4.2 createTeacherService rejects payload with invalid username regex
  const badUserResult = await createTeacherService({
    payload: {
      username: 'invalid user with space',
      email: 'valid_email@tmdemy.com',
      password: 'validpassword123'
    } as any
  })
  assert(badUserResult.success === false, '[createTeacherService] rejects invalid username at service boundary')
  assert(badUserResult.statusCode === 400, '[createTeacherService] returns statusCode 400 for bad username')

  // 4.3 createTeacherService in transaction rollback (verifying successful creation and strict system control of role/status)
  try {
    await prisma.$transaction(async (tx) => {
      const validCreationResult = await createTeacherService(
        {
          payload: {
            username: 'audit_teacher_valid',
            email: 'audit_teacher_valid@tmdemy.com',
            password: 'validpassword123',
            bio: 'Test teacher for audit'
          }
        },
        tx as any
      )

      assert(validCreationResult.success === true, '[createTeacherService] successfully creates teacher with valid payload')
      if (validCreationResult.success && validCreationResult.data) {
        assert(
          validCreationResult.data.role === 'teacher',
          '[createTeacherService] strictly assigns TEACHER role (system controlled)'
        )
        assert(
          validCreationResult.data.status === 'active',
          '[createTeacherService] strictly assigns ACTIVE status (system controlled)'
        )
      }

      // Force rollback so database remains 100% clean
      throw new Error('ROLLBACK_AUDIT_TRANSACTION')
    })
  } catch (err: any) {
    if (err.message !== 'ROLLBACK_AUDIT_TRANSACTION') throw err
  }

  // ==========================================
  // SUITE 5: SERVICE BOUNDARY RUNTIME VALIDATION (createCategoryService)
  // ==========================================
  console.log('\n--- SUITE 5: Service Boundary Runtime Validation (createCategoryService) ---')

  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } })
  const validAdminId = adminUser ? adminUser.id : '00000000-0000-4000-8000-000000000001'

  // 5.1 createCategoryService rejects missing name
  const badCatResult = await createCategoryService({
    payload: { description: 'Missing name' },
    created_by: validAdminId
  })
  assert(badCatResult.success === false, '[createCategoryService] rejects missing name at service boundary')
  assert(badCatResult.statusCode === 400, '[createCategoryService] returns statusCode 400')
  assert(
    badCatResult.message === 'Category name is required',
    '[createCategoryService] returns exact "Category name is required" message'
  )

  // 5.2 createCategoryService in transaction rollback
  try {
    await prisma.$transaction(async (tx) => {
      const validCatResult = await createCategoryService(
        {
          payload: {
            name: 'Audit Valid Category',
            slug: 'audit-valid-cat',
            description: 'Category created during audit'
          },
          created_by: validAdminId
        },
        tx as any
      )

      assert(validCatResult.success === true, '[createCategoryService] successfully creates category with valid payload')
      throw new Error('ROLLBACK_AUDIT_TRANSACTION')
    })
  } catch (err: any) {
    if (err.message !== 'ROLLBACK_AUDIT_TRANSACTION') throw err
  }

  // ==========================================
  // SUITE 6: DATABASE STATE VERIFICATION
  // ==========================================
  console.log('\n--- SUITE 6: Database State Preservation ---')

  const finalUserCount = await prisma.user.count()
  const finalCatCount = await prisma.category.count()
  const finalCourseCount = await prisma.course.count()
  const finalChapterCount = await prisma.chapter.count()
  const finalLessonCount = await prisma.lesson.count()

  assert(finalUserCount === initialUserCount, `[DB Integrity] User count unchanged (${finalUserCount})`)
  assert(finalCatCount === initialCatCount, `[DB Integrity] Category count unchanged (${finalCatCount})`)
  assert(finalCourseCount === initialCourseCount, `[DB Integrity] Course count unchanged (${finalCourseCount})`)
  assert(finalChapterCount === initialChapterCount, `[DB Integrity] Chapter count unchanged (${finalChapterCount})`)
  assert(finalLessonCount === initialLessonCount, `[DB Integrity] Lesson count unchanged (${finalLessonCount})`)

  // ==========================================
  // FINAL SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(80))
  console.log(`  ZOD APPLICATION MODELS AUDIT: ${passedTests}/${totalTests} TESTS PASSED`)
  if (failedTests > 0) {
    console.error(`  FAILURES: ${failedTests}`)
  } else {
    console.log('  ALL TESTS COMPLETED SUCCESSFULLY WITH ZERO FAILURES')
  }
  console.log('='.repeat(80) + '\n')

  await disconnectPrisma()

  if (failedTests > 0) {
    process.exit(1)
  }
}

runZodAuditTests().catch((err) => {
  console.error('Unhandled test execution error:', err)
  process.exit(1)
})
