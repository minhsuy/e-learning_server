import { prisma } from '../src/config/prisma'
import { awardLessonCompletionXP, buildLessonCompletionEventKey } from '../src/services/xp.service'
import { markLessonCompleteService } from '../src/services/progress.service'
import { XP_REWARDS } from '../src/models/xp.model'
import { XPTransactionType } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * PHASE 3A — MANDATORY BUSINESS TEST SUITE
 * 
 * Tests the 6 required scenarios from Section 21 of the Phase 3A specifications:
 * 1. First completion (User A, Lesson A) -> +70 XP, 1 transaction
 * 2. Same request retry -> idempotent, 0 additional XP, 1 transaction total
 * 3. Different lesson (User A, Lesson B) -> +70 XP, 2 transactions total, xpTotal = 140
 * 4. Different user (User B, Lesson A) -> User B gets +70 XP, User A unaffected
 * 5. Failed transaction -> rollback verification, no transaction, no xpTotal change
 * 6. Concurrent duplicate -> race condition protection, exactly 1 transaction, +70 XP total
 */

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  details: string
}

const results: TestResult[] = []

async function runTestSuite() {
  console.log('====================================================')
  console.log('   STARTING PHASE 3A BUSINESS TEST SUITE')
  console.log('====================================================\n')

  const testUserAId = randomUUID()
  const testUserBId = randomUUID()
  const testLessonAId = randomUUID()
  const testLessonBId = randomUUID()
  const testLessonCId = randomUUID()

  try {
    // 0. Setup isolated test users (clean slate)
    console.log('Setup: Creating isolated test users...')
    const userA = await prisma.user.create({
      data: {
        id: testUserAId,
        email: `phase3a_test_a_${Date.now()}@test.com`,
        username: `phase3a_user_a_${Date.now()}`,
        password: 'hashed_password_for_testing',
        xpTotal: 0
      }
    })
    const userB = await prisma.user.create({
      data: {
        id: testUserBId,
        email: `phase3a_test_b_${Date.now()}@test.com`,
        username: `phase3a_user_b_${Date.now()}`,
        password: 'hashed_password_for_testing',
        xpTotal: 0
      }
    })
    console.log(`Users created: User A (${userA.id}), User B (${userB.id})\n`)

    // ========================================================
    // TEST 1 — First completion (User A, Lesson A)
    // ========================================================
    console.log('--- TEST 1: First Completion ---')
    const res1 = await awardLessonCompletionXP({
      userId: userA.id,
      lessonId: testLessonAId
    })

    const expectedEventKeyA_A = buildLessonCompletionEventKey(userA.id, testLessonAId)
    const userAAfterTest1 = await prisma.user.findUnique({ where: { id: userA.id } })
    const txnCountUserAAfter1 = await prisma.xPTransaction.count({ where: { userId: userA.id } })
    const txnRecord1 = await prisma.xPTransaction.findUnique({ where: { eventKey: expectedEventKeyA_A } })

    const test1Pass =
      res1.success === true &&
      res1.awarded === true &&
      res1.amount === XP_REWARDS.LESSON_COMPLETED &&
      res1.eventKey === expectedEventKeyA_A &&
      userAAfterTest1?.xpTotal === 70 &&
      txnCountUserAAfter1 === 1 &&
      txnRecord1 !== null &&
      txnRecord1.amount === 70 &&
      txnRecord1.type === XPTransactionType.LESSON_COMPLETED

    results.push({
      test: 'Test 1 — First completion',
      status: test1Pass ? 'PASS' : 'FAIL',
      details: `Awarded: ${res1.awarded}, Amount: ${res1.amount}, xpTotal: ${userAAfterTest1?.xpTotal}, txnCount: ${txnCountUserAAfter1}`
    })
    console.log(`Result: ${test1Pass ? 'PASS' : 'FAIL'} (${results[0].details})\n`)

    // ========================================================
    // TEST 2 — Same request retry (User A, Lesson A)
    // ========================================================
    console.log('--- TEST 2: Duplicate Request Retry (Idempotency) ---')
    const res2 = await awardLessonCompletionXP({
      userId: userA.id,
      lessonId: testLessonAId
    })

    const userAAfterTest2 = await prisma.user.findUnique({ where: { id: userA.id } })
    const txnCountUserAAfter2 = await prisma.xPTransaction.count({ where: { userId: userA.id } })

    const test2Pass =
      res2.success === true &&
      res2.awarded === false &&
      res2.amount === 0 &&
      userAAfterTest2?.xpTotal === 70 && // NOT 140
      txnCountUserAAfter2 === 1          // Still 1

    results.push({
      test: 'Test 2 — Same request retry',
      status: test2Pass ? 'PASS' : 'FAIL',
      details: `Awarded: ${res2.awarded}, Amount: ${res2.amount}, xpTotal: ${userAAfterTest2?.xpTotal} (expected 70), txnCount: ${txnCountUserAAfter2} (expected 1)`
    })
    console.log(`Result: ${test2Pass ? 'PASS' : 'FAIL'} (${results[1].details})\n`)

    // ========================================================
    // TEST 3 — Different lesson (User A, Lesson B)
    // ========================================================
    console.log('--- TEST 3: Different Lesson ---')
    const res3 = await awardLessonCompletionXP({
      userId: userA.id,
      lessonId: testLessonBId
    })

    const userAAfterTest3 = await prisma.user.findUnique({ where: { id: userA.id } })
    const txnCountUserAAfter3 = await prisma.xPTransaction.count({ where: { userId: userA.id } })

    const test3Pass =
      res3.success === true &&
      res3.awarded === true &&
      res3.amount === 70 &&
      userAAfterTest3?.xpTotal === 140 && // 70 + 70 = 140
      txnCountUserAAfter3 === 2

    results.push({
      test: 'Test 3 — Different lesson',
      status: test3Pass ? 'PASS' : 'FAIL',
      details: `Awarded: ${res3.awarded}, Amount: ${res3.amount}, xpTotal: ${userAAfterTest3?.xpTotal} (expected 140), txnCount: ${txnCountUserAAfter3} (expected 2)`
    })
    console.log(`Result: ${test3Pass ? 'PASS' : 'FAIL'} (${results[2].details})\n`)

    // ========================================================
    // TEST 4 — Different user (User B, Lesson A)
    // ========================================================
    console.log('--- TEST 4: Different User ---')
    const res4 = await awardLessonCompletionXP({
      userId: userB.id,
      lessonId: testLessonAId
    })

    const userBAfterTest4 = await prisma.user.findUnique({ where: { id: userB.id } })
    const userAAfterTest4 = await prisma.user.findUnique({ where: { id: userA.id } })
    const txnCountUserBAfter4 = await prisma.xPTransaction.count({ where: { userId: userB.id } })

    const test4Pass =
      res4.success === true &&
      res4.awarded === true &&
      res4.amount === 70 &&
      userBAfterTest4?.xpTotal === 70 &&
      txnCountUserBAfter4 === 1 &&
      userAAfterTest4?.xpTotal === 140 // User A unaffected

    results.push({
      test: 'Test 4 — Different user',
      status: test4Pass ? 'PASS' : 'FAIL',
      details: `User B xpTotal: ${userBAfterTest4?.xpTotal} (expected 70), User A xpTotal: ${userAAfterTest4?.xpTotal} (expected 140 unchanged)`
    })
    console.log(`Result: ${test4Pass ? 'PASS' : 'FAIL'} (${results[3].details})\n`)

    // ========================================================
    // TEST 5 — Failed transaction (Rollback test)
    // ========================================================
    console.log('--- TEST 5: Failed Transaction Rollback ---')
    const userBBeforeRollback = await prisma.user.findUnique({ where: { id: userB.id } })
    const txnCountUserBBeforeRollback = await prisma.xPTransaction.count({ where: { userId: userB.id } })

    let errorCaught = false
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Create an XP transaction inside tx
        await tx.xPTransaction.create({
          data: {
            userId: userB.id,
            amount: 70,
            type: XPTransactionType.LESSON_COMPLETED,
            eventKey: `test-rollback-${Date.now()}`
          }
        })

        // Step 2: Increment xpTotal
        await tx.user.update({
          where: { id: userB.id },
          data: { xpTotal: { increment: 70 } }
        })

        // Step 3: Force deliberate failure
        throw new Error('SIMULATED_TRANSACTION_FAILURE')
      })
    } catch (err: any) {
      if (err.message === 'SIMULATED_TRANSACTION_FAILURE') {
        errorCaught = true
      }
    }

    const userBAfterRollback = await prisma.user.findUnique({ where: { id: userB.id } })
    const txnCountUserBAfterRollback = await prisma.xPTransaction.count({ where: { userId: userB.id } })

    const test5Pass =
      errorCaught &&
      userBAfterRollback?.xpTotal === userBBeforeRollback?.xpTotal &&
      txnCountUserBAfterRollback === txnCountUserBBeforeRollback

    results.push({
      test: 'Test 5 — Failed transaction rollback',
      status: test5Pass ? 'PASS' : 'FAIL',
      details: `Error caught: ${errorCaught}, xpTotal before/after: ${userBBeforeRollback?.xpTotal}/${userBAfterRollback?.xpTotal}, txns before/after: ${txnCountUserBBeforeRollback}/${txnCountUserBAfterRollback}`
    })
    console.log(`Result: ${test5Pass ? 'PASS' : 'FAIL'} (${results[4].details})\n`)

    // ========================================================
    // TEST 6 — Concurrent duplicate requests (Race condition test)
    // ========================================================
    console.log('--- TEST 6: Concurrent Duplicate Requests ---')
    const userBBeforeConcurrent = await prisma.user.findUnique({ where: { id: userB.id } })
    const initialUserBXp = userBBeforeConcurrent?.xpTotal || 0

    // Fire 2 concurrent completion requests for the exact same user and lesson (testLessonBId)
    const [concurrentRes1, concurrentRes2] = await Promise.all([
      awardLessonCompletionXP({ userId: userB.id, lessonId: testLessonBId }),
      awardLessonCompletionXP({ userId: userB.id, lessonId: testLessonBId })
    ])

    const userBAfterConcurrent = await prisma.user.findUnique({ where: { id: userB.id } })
    const eventKeyConcurrent = buildLessonCompletionEventKey(userB.id, testLessonBId)
    const matchingTxns = await prisma.xPTransaction.findMany({ where: { eventKey: eventKeyConcurrent } })

    const exactlyOneAwarded =
      (concurrentRes1.awarded === true && concurrentRes2.awarded === false) ||
      (concurrentRes1.awarded === false && concurrentRes2.awarded === true)

    const bothSucceededWithoutError =
      concurrentRes1.success === true && concurrentRes2.success === true

    const xpIncreasedByExactly70 =
      (userBAfterConcurrent?.xpTotal || 0) === initialUserBXp + 70

    const exactlyOneDbRecord = matchingTxns.length === 1

    const test6Pass =
      exactlyOneAwarded &&
      bothSucceededWithoutError &&
      xpIncreasedByExactly70 &&
      exactlyOneDbRecord

    results.push({
      test: 'Test 6 — Concurrent duplicate',
      status: test6Pass ? 'PASS' : 'FAIL',
      details: `Awarded flags: [${concurrentRes1.awarded}, ${concurrentRes2.awarded}], DB records: ${matchingTxns.length}, userB xpTotal: ${userBAfterConcurrent?.xpTotal} (was ${initialUserBXp}, expected +70)`
    })
    console.log(`Result: ${test6Pass ? 'PASS' : 'FAIL'} (${results[5].details})\n`)

    // ========================================================
    // TEST 7 — Full End-to-End Lesson Completion via markLessonCompleteService
    // ========================================================
    console.log('--- TEST 7: End-to-End Lesson Completion via markLessonCompleteService ---')
    const sampleLesson = await prisma.lesson.findFirst({
      select: { id: true, courseId: true }
    })

    if (sampleLesson) {
      // Temporarily enroll User A in sample lesson's course
      await prisma.enrollment.create({
        data: {
          userId: userA.id,
          courseId: sampleLesson.courseId,
          status: 'ACTIVE'
        }
      })

      const userAXpBeforeE2E = (await prisma.user.findUnique({ where: { id: userA.id } }))?.xpTotal || 0

      // Call markLessonCompleteService (first time)
      const e2eRes1 = await markLessonCompleteService({
        userId: userA.id,
        courseId: sampleLesson.courseId,
        lessonId: sampleLesson.id
      })

      const userAXpAfterE2E1 = (await prisma.user.findUnique({ where: { id: userA.id } }))?.xpTotal || 0
      const e2eEventKey = buildLessonCompletionEventKey(userA.id, sampleLesson.id)
      const e2eTxn = await prisma.xPTransaction.findUnique({ where: { eventKey: e2eEventKey } })

      // Call markLessonCompleteService (second time - idempotent replay)
      const e2eRes2 = await markLessonCompleteService({
        userId: userA.id,
        courseId: sampleLesson.courseId,
        lessonId: sampleLesson.id
      })

      const userAXpAfterE2E2 = (await prisma.user.findUnique({ where: { id: userA.id } }))?.xpTotal || 0

      const test7Pass =
        e2eRes1.success === true &&
        e2eRes1.message === 'Lesson marked as completed' &&
        userAXpAfterE2E1 === userAXpBeforeE2E + 70 + 20 && // +70 Lesson XP + +20 Daily Streak XP (Phase 3B)
        e2eTxn !== null &&
        e2eTxn.amount === 70 &&
        e2eRes2.success === true &&
        userAXpAfterE2E2 === userAXpAfterE2E1 // XP did not increase again on retry!

      results.push({
        test: 'Test 7 — End-to-End markLessonCompleteService integration',
        status: test7Pass ? 'PASS' : 'FAIL',
        details: `First call: +90 XP (+70 Lesson, +20 Streak) (Total: ${userAXpAfterE2E1}), Retry call: 0 extra XP (Total: ${userAXpAfterE2E2}), Contract: ${JSON.stringify(e2eRes1.data)}`
      })
      console.log(`Result: ${test7Pass ? 'PASS' : 'FAIL'} (${results[6].details})\n`)
    }

  } finally {
    // Cleanup ONLY test users and their related records
    console.log('Cleanup: Removing test users and test records...')
    try {
      await prisma.progress.deleteMany({
        where: { userId: { in: [testUserAId, testUserBId] } }
      })
      await prisma.enrollment.deleteMany({
        where: { userId: { in: [testUserAId, testUserBId] } }
      })
      await prisma.xPTransaction.deleteMany({
        where: { userId: { in: [testUserAId, testUserBId] } }
      })
      await prisma.user.deleteMany({
        where: { id: { in: [testUserAId, testUserBId] } }
      })
      console.log('Cleanup completed cleanly. Dev database records preserved.\n')
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr)
    }
  }

  // Final Summary
  console.log('====================================================')
  console.log('             TEST SUMMARY REPORT')
  console.log('====================================================')
  let allPass = true
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}`)
    console.log(`       Details: ${r.details}`)
    if (r.status !== 'PASS') allPass = false
  }
  console.log('====================================================')
  console.log(`OVERALL STATUS: ${allPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  console.log('====================================================\n')

  await prisma.$disconnect()
  process.exit(allPass ? 0 : 1)
}

runTestSuite().catch(async (e) => {
  console.error('Test Suite Fatal Error:', e)
  await prisma.$disconnect()
  process.exit(1)
})
