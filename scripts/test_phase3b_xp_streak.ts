import { prisma } from '../src/config/prisma'
import {
  awardQuizCompletionXP,
  awardLessonCompletionXP,
  buildQuizCompletionEventKey,
  buildDailyStreakEventKey
} from '../src/services/xp.service'
import {
  recordLearningActivityStreak,
  getHoChiMinhDateString,
  getDayDifference,
  calculateStreakTransition
} from '../src/services/streak.service'
import { XP_REWARDS } from '../src/models/xp.model'
import { XPTransactionType } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * TMDEMY — PHASE 3B COMPREHENSIVE TEST SUITE
 * 
 * Tests all 12 mandatory test cases from Section 28 of Phase 3B specifications:
 * 1. First Quiz Completion (+100 XP, QUIZ_COMPLETED, eventKey)
 * 2. Quiz Duplicate / Retry (idempotency, no double XP)
 * 3. First Activity of Day (streak 1, longest 1, +20 Daily streak XP, +120 total with quiz)
 * 4. Same Day Activity (streak unchanged, 0 extra daily streak XP, activity XP awarded)
 * 5. Consecutive Day (streak increments, longest updated, +20 daily streak XP)
 * 6. Broken Streak (gap > 1 day -> streak reset to 1, longest preserved, +20 daily streak XP)
 * 7. Longest Streak (Day 1 -> 2 -> 3: longest=3; break: current=1, longest=3)
 * 8. Timezone Boundary (Asia/Ho_Chi_Minh 23:59 vs 00:00 transition)
 * 9. Concurrent Quiz Duplicate (race condition protection -> exactly 1 quiz transaction, +100 XP)
 * 10. Concurrent Daily Streak (race condition protection -> exactly 1 daily streak transaction, +20 XP)
 * 11. Transaction Rollback (atomic rollback on forced failure)
 * 12. Lesson XP Regression (Phase 3A lesson completion regression check)
 */

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  details: string
}

const results: TestResult[] = []

async function runPhase3BTestSuite() {
  console.log('====================================================')
  console.log('   STARTING PHASE 3B BUSINESS TEST SUITE')
  console.log('====================================================\n')

  const testUserAId = randomUUID()
  const testUserBId = randomUUID()
  const testUserCId = randomUUID()
  const testQuizAId = randomUUID()
  const testQuizBId = randomUUID()
  const testLessonAId = randomUUID()

  try {
    // 0. Setup isolated test users
    console.log('Setup: Creating isolated test users...')
    const [userA, userB, userC] = await Promise.all([
      prisma.user.create({
        data: {
          id: testUserAId,
          email: `phase3b_test_a_${Date.now()}@test.com`,
          username: `phase3b_user_a_${Date.now()}`,
          password: 'test_password_hash',
          xpTotal: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      }),
      prisma.user.create({
        data: {
          id: testUserBId,
          email: `phase3b_test_b_${Date.now()}@test.com`,
          username: `phase3b_user_b_${Date.now()}`,
          password: 'test_password_hash',
          xpTotal: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      }),
      prisma.user.create({
        data: {
          id: testUserCId,
          email: `phase3b_test_c_${Date.now()}@test.com`,
          username: `phase3b_user_c_${Date.now()}`,
          password: 'test_password_hash',
          xpTotal: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      })
    ])
    console.log(`Users created: User A (${userA.id}), User B (${userB.id}), User C (${userC.id})\n`)

    // ========================================================
    // TEST 1 — First Quiz Completion
    // ========================================================
    console.log('--- TEST 1: First Quiz Completion ---')
    const res1 = await awardQuizCompletionXP({
      userId: userA.id,
      quizId: testQuizAId
    })

    const expectedEventKeyQuizA = buildQuizCompletionEventKey(userA.id, testQuizAId)
    const userAAfterTest1 = await prisma.user.findUnique({ where: { id: userA.id } })
    const txnRecord1 = await prisma.xPTransaction.findUnique({ where: { eventKey: expectedEventKeyQuizA } })

    const test1Pass =
      res1.success === true &&
      res1.awarded === true &&
      res1.amount === XP_REWARDS.QUIZ_COMPLETED &&
      res1.eventKey === expectedEventKeyQuizA &&
      userAAfterTest1?.xpTotal === 100 &&
      txnRecord1 !== null &&
      txnRecord1.amount === 100 &&
      txnRecord1.type === XPTransactionType.QUIZ_COMPLETED

    results.push({
      test: 'Test 1 — First Quiz Completion',
      status: test1Pass ? 'PASS' : 'FAIL',
      details: `Awarded: ${res1.awarded}, Amount: ${res1.amount}, xpTotal: ${userAAfterTest1?.xpTotal}, txn: ${txnRecord1?.type}`
    })
    console.log(`Result: ${test1Pass ? 'PASS' : 'FAIL'} (${results[0].details})\n`)

    // ========================================================
    // TEST 2 — Quiz Retry / Duplicate
    // ========================================================
    console.log('--- TEST 2: Quiz Retry / Duplicate ---')
    const res2 = await awardQuizCompletionXP({
      userId: userA.id,
      quizId: testQuizAId
    })

    const userAAfterTest2 = await prisma.user.findUnique({ where: { id: userA.id } })
    const quizTxnCountUserA = await prisma.xPTransaction.count({
      where: { userId: userA.id, type: XPTransactionType.QUIZ_COMPLETED }
    })

    const test2Pass =
      res2.success === true &&
      res2.awarded === false &&
      res2.amount === 0 &&
      userAAfterTest2?.xpTotal === 100 && // Stays at 100, not 200
      quizTxnCountUserA === 1

    results.push({
      test: 'Test 2 — Quiz Duplicate / Retry',
      status: test2Pass ? 'PASS' : 'FAIL',
      details: `Awarded: ${res2.awarded}, Amount: ${res2.amount}, xpTotal: ${userAAfterTest2?.xpTotal} (expected 100), txnCount: ${quizTxnCountUserA}`
    })
    console.log(`Result: ${test2Pass ? 'PASS' : 'FAIL'} (${results[1].details})\n`)

    // ========================================================
    // TEST 3 — First Activity of Day
    // ========================================================
    console.log('--- TEST 3: First Activity of Day ---')
    // User B performs first activity today: award Quiz XP (+100) + Streak (+20)
    const userBBeforeTest3 = await prisma.user.findUnique({ where: { id: userB.id } })
    const quizResUserB = await awardQuizCompletionXP({ userId: userB.id, quizId: testQuizAId })
    const streakResUserB = await recordLearningActivityStreak({ userId: userB.id })

    const userBAfterTest3 = await prisma.user.findUnique({ where: { id: userB.id } })
    const todayStr = getHoChiMinhDateString(new Date())
    const dailyTxnUserB = await prisma.xPTransaction.findUnique({
      where: { eventKey: buildDailyStreakEventKey(userB.id, todayStr) }
    })

    const test3Pass =
      quizResUserB.awarded === true &&
      streakResUserB.success === true &&
      streakResUserB.currentStreak === 1 &&
      streakResUserB.longestStreak === 1 &&
      streakResUserB.dailyXpAwarded === 20 &&
      streakResUserB.isFirstActivityToday === true &&
      userBAfterTest3?.xpTotal === 120 && // 100 (quiz) + 20 (streak)
      dailyTxnUserB !== null &&
      dailyTxnUserB.amount === 20 &&
      dailyTxnUserB.type === XPTransactionType.DAILY_STREAK

    results.push({
      test: 'Test 3 — First Activity of Day',
      status: test3Pass ? 'PASS' : 'FAIL',
      details: `currentStreak: ${userBAfterTest3?.currentStreak}, longestStreak: ${userBAfterTest3?.longestStreak}, xpTotal: ${userBAfterTest3?.xpTotal} (expected 120: +100 Quiz +20 Streak)`
    })
    console.log(`Result: ${test3Pass ? 'PASS' : 'FAIL'} (${results[2].details})\n`)

    // ========================================================
    // TEST 4 — Same Day Second Activity
    // ========================================================
    console.log('--- TEST 4: Same Day Second Activity ---')
    // User B completes Lesson A on the same business day
    const lessonResUserB = await awardLessonCompletionXP({ userId: userB.id, lessonId: testLessonAId })
    const secondStreakResUserB = await recordLearningActivityStreak({ userId: userB.id })

    const userBAfterTest4 = await prisma.user.findUnique({ where: { id: userB.id } })
    const dailyTxnCountUserB = await prisma.xPTransaction.count({
      where: { userId: userB.id, type: XPTransactionType.DAILY_STREAK }
    })

    const test4Pass =
      lessonResUserB.awarded === true &&
      lessonResUserB.amount === 70 &&
      secondStreakResUserB.success === true &&
      secondStreakResUserB.currentStreak === 1 && // Streak does NOT increment again on same day
      secondStreakResUserB.dailyXpAwarded === 0 && // No duplicate daily streak XP
      secondStreakResUserB.isFirstActivityToday === false &&
      dailyTxnCountUserB === 1 && // Still exactly 1 daily streak transaction
      userBAfterTest4?.xpTotal === 190 // 120 + 70 = 190

    results.push({
      test: 'Test 4 — Same Day Second Activity',
      status: test4Pass ? 'PASS' : 'FAIL',
      details: `currentStreak: ${userBAfterTest4?.currentStreak} (expected 1), dailyXpAwarded: ${secondStreakResUserB.dailyXpAwarded} (expected 0), xpTotal: ${userBAfterTest4?.xpTotal} (expected 190)`
    })
    console.log(`Result: ${test4Pass ? 'PASS' : 'FAIL'} (${results[3].details})\n`)

    // ========================================================
    // TEST 5 — Consecutive Day
    // ========================================================
    console.log('--- TEST 5: Consecutive Day Simulation ---')
    // Simulate activity on day 2 for User C
    const day1Date = new Date('2026-10-01T10:00:00+07:00')
    const day2Date = new Date('2026-10-02T10:00:00+07:00')

    const streakDay1 = await recordLearningActivityStreak({ userId: userC.id, activityDate: day1Date })
    const userCAfterDay1 = await prisma.user.findUnique({ where: { id: userC.id } })

    const streakDay2 = await recordLearningActivityStreak({ userId: userC.id, activityDate: day2Date })
    const userCAfterDay2 = await prisma.user.findUnique({ where: { id: userC.id } })

    const test5Pass =
      streakDay1.currentStreak === 1 &&
      streakDay2.currentStreak === 2 &&
      streakDay2.longestStreak === 2 &&
      streakDay2.dailyXpAwarded === 20 &&
      userCAfterDay2?.xpTotal === 40 // 20 + 20

    results.push({
      test: 'Test 5 — Consecutive Day',
      status: test5Pass ? 'PASS' : 'FAIL',
      details: `Day 1 streak: ${streakDay1.currentStreak}, Day 2 streak: ${streakDay2.currentStreak} (expected 2), xpTotal: ${userCAfterDay2?.xpTotal}`
    })
    console.log(`Result: ${test5Pass ? 'PASS' : 'FAIL'} (${results[4].details})\n`)

    // ========================================================
    // TEST 6 — Broken Streak
    // ========================================================
    console.log('--- TEST 6: Broken Streak Simulation ---')
    // User C skips 2026-10-03 and returns on 2026-10-04 (gap > 1 day)
    const day4Date = new Date('2026-10-04T10:00:00+07:00')
    const streakDay4 = await recordLearningActivityStreak({ userId: userC.id, activityDate: day4Date })
    const userCAfterDay4 = await prisma.user.findUnique({ where: { id: userC.id } })

    const test6Pass =
      streakDay4.currentStreak === 1 && // Reset to 1
      streakDay4.longestStreak === 2 && // Longest streak (2) preserved
      userCAfterDay4?.currentStreak === 1 &&
      userCAfterDay4?.longestStreak === 2 &&
      streakDay4.dailyXpAwarded === 20

    results.push({
      test: 'Test 6 — Broken Streak',
      status: test6Pass ? 'PASS' : 'FAIL',
      details: `currentStreak after break: ${userCAfterDay4?.currentStreak} (expected 1), longestStreak: ${userCAfterDay4?.longestStreak} (expected 2 preserved)`
    })
    console.log(`Result: ${test6Pass ? 'PASS' : 'FAIL'} (${results[5].details})\n`)

    // ========================================================
    // TEST 7 — Longest Streak
    // ========================================================
    console.log('--- TEST 7: Longest Streak Progression & Preservation ---')
    // Advance User C from day 4 -> day 5 -> day 6 -> streak = 3, longest = 3
    const day5Date = new Date('2026-10-05T10:00:00+07:00')
    const day6Date = new Date('2026-10-06T10:00:00+07:00')
    await recordLearningActivityStreak({ userId: userC.id, activityDate: day5Date })
    const streakDay6 = await recordLearningActivityStreak({ userId: userC.id, activityDate: day6Date })

    // Break streak again by skipping to day 10
    const day10Date = new Date('2026-10-10T10:00:00+07:00')
    const streakDay10 = await recordLearningActivityStreak({ userId: userC.id, activityDate: day10Date })
    const userCAfterDay10 = await prisma.user.findUnique({ where: { id: userC.id } })

    const test7Pass =
      streakDay6.currentStreak === 3 &&
      streakDay6.longestStreak === 3 &&
      streakDay10.currentStreak === 1 &&
      streakDay10.longestStreak === 3 && // Preserved at 3
      userCAfterDay10?.currentStreak === 1 &&
      userCAfterDay10?.longestStreak === 3

    results.push({
      test: 'Test 7 — Longest Streak',
      status: test7Pass ? 'PASS' : 'FAIL',
      details: `Peak streak: ${streakDay6.currentStreak}, streak after gap: ${streakDay10.currentStreak} (expected 1), longest: ${userCAfterDay10?.longestStreak} (expected 3 preserved)`
    })
    console.log(`Result: ${test7Pass ? 'PASS' : 'FAIL'} (${results[6].details})\n`)

    // ========================================================
    // TEST 8 — Midnight / Timezone Boundary (Asia/Ho_Chi_Minh)
    // ========================================================
    console.log('--- TEST 8: Midnight / Timezone Boundary ---')
    // 2026-10-07T16:59:59.000Z UTC = 2026-10-07 23:59:59 in Asia/Ho_Chi_Minh (UTC+7)
    // 2026-10-07T17:00:01.000Z UTC = 2026-10-08 00:00:01 in Asia/Ho_Chi_Minh (UTC+7)
    const t2359Utc = new Date('2026-10-07T16:59:59.000Z')
    const t0001Utc = new Date('2026-10-07T17:00:01.000Z')

    const dateStr1 = getHoChiMinhDateString(t2359Utc)
    const dateStr2 = getHoChiMinhDateString(t0001Utc)
    const diff = getDayDifference(dateStr1, dateStr2)

    // Transition test on pure function
    const transitionMidnight = calculateStreakTransition({
      currentStreak: 1,
      longestStreak: 1,
      lastActivityAt: t2359Utc,
      activityDate: t0001Utc
    })

    const test8Pass =
      dateStr1 === '2026-10-07' &&
      dateStr2 === '2026-10-08' &&
      diff === 1 &&
      transitionMidnight.currentStreak === 2 &&
      transitionMidnight.longestStreak === 2 &&
      transitionMidnight.isFirstActivityToday === true

    results.push({
      test: 'Test 8 — Timezone Boundary (Asia/Ho_Chi_Minh)',
      status: test8Pass ? 'PASS' : 'FAIL',
      details: `23:59 date: ${dateStr1}, 00:00 date: ${dateStr2}, day diff: ${diff}, consecutive streak: ${transitionMidnight.currentStreak}`
    })
    console.log(`Result: ${test8Pass ? 'PASS' : 'FAIL'} (${results[7].details})\n`)

    // ========================================================
    // TEST 9 — Concurrent Quiz Duplicate Requests
    // ========================================================
    console.log('--- TEST 9: Concurrent Quiz Duplicate Requests ---')
    const userABeforeConcurrent = await prisma.user.findUnique({ where: { id: userA.id } })
    const initialUserAXp = userABeforeConcurrent?.xpTotal || 0

    // Fire 2 concurrent requests for User A on Quiz B
    const [cQuizRes1, cQuizRes2] = await Promise.all([
      awardQuizCompletionXP({ userId: userA.id, quizId: testQuizBId }),
      awardQuizCompletionXP({ userId: userA.id, quizId: testQuizBId })
    ])

    const userAAfterConcurrent = await prisma.user.findUnique({ where: { id: userA.id } })
    const quizBEventKey = buildQuizCompletionEventKey(userA.id, testQuizBId)
    const quizBTxns = await prisma.xPTransaction.findMany({ where: { eventKey: quizBEventKey } })

    const exactlyOneQuizAwarded =
      (cQuizRes1.awarded === true && cQuizRes2.awarded === false) ||
      (cQuizRes1.awarded === false && cQuizRes2.awarded === true)

    const bothQuizRequestsSucceeded =
      cQuizRes1.success === true && cQuizRes2.success === true

    const xpIncreasedByExactly100 =
      (userAAfterConcurrent?.xpTotal || 0) === initialUserAXp + 100

    const test9Pass =
      exactlyOneQuizAwarded &&
      bothQuizRequestsSucceeded &&
      xpIncreasedByExactly100 &&
      quizBTxns.length === 1

    results.push({
      test: 'Test 9 — Concurrent Quiz Duplicate',
      status: test9Pass ? 'PASS' : 'FAIL',
      details: `Awarded flags: [${cQuizRes1.awarded}, ${cQuizRes2.awarded}], DB txns: ${quizBTxns.length}, xpTotal: ${userAAfterConcurrent?.xpTotal} (was ${initialUserAXp}, expected +100)`
    })
    console.log(`Result: ${test9Pass ? 'PASS' : 'FAIL'} (${results[8].details})\n`)

    // ========================================================
    // TEST 10 — Concurrent Daily Streak Requests
    // ========================================================
    console.log('--- TEST 10: Concurrent Daily Streak Requests ---')
    // Create isolated user D for concurrent streak test
    const testUserDId = randomUUID()
    const userD = await prisma.user.create({
      data: {
        id: testUserDId,
        email: `phase3b_test_d_${Date.now()}@test.com`,
        username: `phase3b_user_d_${Date.now()}`,
        password: 'test_password_hash',
        xpTotal: 0
      }
    })

    const concurrentSimulatedDate = new Date('2026-10-15T10:00:00+07:00')
    const [cStreakRes1, cStreakRes2] = await Promise.all([
      recordLearningActivityStreak({ userId: userD.id, activityDate: concurrentSimulatedDate }),
      recordLearningActivityStreak({ userId: userD.id, activityDate: concurrentSimulatedDate })
    ])

    const userDAfterConcurrent = await prisma.user.findUnique({ where: { id: userD.id } })
    const dailyEventKeyD = buildDailyStreakEventKey(userD.id, '2026-10-15')
    const dailyTxnsD = await prisma.xPTransaction.findMany({ where: { eventKey: dailyEventKeyD } })

    const exactlyOneDailyAwarded =
      (cStreakRes1.dailyXpAwarded === 20 && cStreakRes2.dailyXpAwarded === 0) ||
      (cStreakRes1.dailyXpAwarded === 0 && cStreakRes2.dailyXpAwarded === 20)

    const test10Pass =
      cStreakRes1.success === true &&
      cStreakRes2.success === true &&
      exactlyOneDailyAwarded &&
      dailyTxnsD.length === 1 &&
      userDAfterConcurrent?.xpTotal === 20

    results.push({
      test: 'Test 10 — Concurrent Daily Streak',
      status: test10Pass ? 'PASS' : 'FAIL',
      details: `Daily XP awarded: [${cStreakRes1.dailyXpAwarded}, ${cStreakRes2.dailyXpAwarded}], DB txns: ${dailyTxnsD.length}, xpTotal: ${userDAfterConcurrent?.xpTotal} (expected 20)`
    })
    console.log(`Result: ${test10Pass ? 'PASS' : 'FAIL'} (${results[9].details})\n`)

    // ========================================================
    // TEST 11 — Transaction Rollback (Atomic integrity)
    // ========================================================
    console.log('--- TEST 11: Transaction Rollback ---')
    const userDBeforeRollback = await prisma.user.findUnique({ where: { id: userD.id } })
    const txnCountDBeforeRollback = await prisma.xPTransaction.count({ where: { userId: userD.id } })

    let caughtError = false
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Create a quiz XP transaction
        await tx.xPTransaction.create({
          data: {
            userId: userD.id,
            amount: 100,
            type: XPTransactionType.QUIZ_COMPLETED,
            eventKey: `test-rollback-quiz-${Date.now()}`
          }
        })
        // Step 2: Increment xpTotal
        await tx.user.update({
          where: { id: userD.id },
          data: { xpTotal: { increment: 100 } }
        })
        // Step 3: Deliberate failure
        throw new Error('FORCE_PHASE3B_ROLLBACK')
      })
    } catch (e: any) {
      if (e.message === 'FORCE_PHASE3B_ROLLBACK') {
        caughtError = true
      }
    }

    const userDAfterRollback = await prisma.user.findUnique({ where: { id: userD.id } })
    const txnCountDAfterRollback = await prisma.xPTransaction.count({ where: { userId: userD.id } })

    const test11Pass =
      caughtError &&
      userDAfterRollback?.xpTotal === userDBeforeRollback?.xpTotal &&
      txnCountDAfterRollback === txnCountDBeforeRollback

    results.push({
      test: 'Test 11 — Transaction Rollback',
      status: test11Pass ? 'PASS' : 'FAIL',
      details: `Error caught: ${caughtError}, xpTotal before/after: ${userDBeforeRollback?.xpTotal}/${userDAfterRollback?.xpTotal}, txns before/after: ${txnCountDBeforeRollback}/${txnCountDAfterRollback}`
    })
    console.log(`Result: ${test11Pass ? 'PASS' : 'FAIL'} (${results[10].details})\n`)

    // ========================================================
    // TEST 12 — Lesson XP Regression (Phase 3A behavior)
    // ========================================================
    console.log('--- TEST 12: Lesson XP Regression ---')
    const userDBeforeLesson = await prisma.user.findUnique({ where: { id: userD.id } })
    const xpBeforeLesson = userDBeforeLesson?.xpTotal || 0

    // First completion of lesson -> +70 XP
    const lessonRes1 = await awardLessonCompletionXP({ userId: userD.id, lessonId: testLessonAId })
    const userDAfterLesson1 = await prisma.user.findUnique({ where: { id: userD.id } })

    // Duplicate replay -> 0 extra XP
    const lessonRes2 = await awardLessonCompletionXP({ userId: userD.id, lessonId: testLessonAId })
    const userDAfterLesson2 = await prisma.user.findUnique({ where: { id: userD.id } })

    const test12Pass =
      lessonRes1.awarded === true &&
      lessonRes1.amount === 70 &&
      userDAfterLesson1?.xpTotal === xpBeforeLesson + 70 &&
      lessonRes2.awarded === false &&
      lessonRes2.amount === 0 &&
      userDAfterLesson2?.xpTotal === userDAfterLesson1?.xpTotal

    results.push({
      test: 'Test 12 — Lesson XP Regression',
      status: test12Pass ? 'PASS' : 'FAIL',
      details: `First call: awarded=${lessonRes1.awarded} (+${lessonRes1.amount} XP), Retry call: awarded=${lessonRes2.awarded} (0 XP), xpTotal: ${userDAfterLesson2?.xpTotal}`
    })
    console.log(`Result: ${test12Pass ? 'PASS' : 'FAIL'} (${results[11].details})\n`)

    // Cleanup isolated user D
    await prisma.xPTransaction.deleteMany({ where: { userId: testUserDId } })
    await prisma.user.delete({ where: { id: testUserDId } })

  } finally {
    // Cleanup isolated test users A, B, C
    console.log('Cleanup: Removing test users and test XP transactions...')
    try {
      await prisma.xPTransaction.deleteMany({
        where: { userId: { in: [testUserAId, testUserBId, testUserCId] } }
      })
      await prisma.user.deleteMany({
        where: { id: { in: [testUserAId, testUserBId, testUserCId] } }
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
  console.log(`OVERALL STATUS: ${allPass ? '✅ ALL 12 TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  console.log('====================================================\n')

  await prisma.$disconnect()
  process.exit(allPass ? 0 : 1)
}

runPhase3BTestSuite().catch(async (e) => {
  console.error('Phase 3B Test Suite Fatal Error:', e)
  await prisma.$disconnect()
  process.exit(1)
})
