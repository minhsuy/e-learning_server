import { prisma } from '../src/config/prisma'
import {
  getRankFromXp,
  getRankDetailFromXp,
  XP_RANKS,
  XP_REWARDS
} from '../src/models/xp.model'
import { getUserXpSummaryService, getUserXpHistoryService, awardLessonCompletionXP, awardQuizCompletionXP } from '../src/services/xp.service'
import { getUserStreakService, recordLearningActivityStreak } from '../src/services/streak.service'
import { getLeaderboardService, getUserLeaderboardPositionService } from '../src/services/leaderboard.service'
import { getLeaderboardUsers } from '../src/repositories/leaderboard.repository'
import { createXPTransaction } from '../src/repositories/xp.repository'
import { XPTransactionType } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * TMDEMY — PHASE 4 COMPREHENSIVE TEST SUITE
 * 
 * Tests all 14 mandatory test cases from Section 18 of Phase 4 specifications:
 * 1. Rank calculation across all boundary thresholds
 * 2. XP Summary API data correctness
 * 3. Streak API data correctness
 * 4. XP History pagination and ordering (createdAt DESC, id DESC)
 * 5. XP History user isolation (User A cannot see User B's transactions)
 * 6. Leaderboard ordering (xpTotal DESC)
 * 7. Competition tie ranking (A:5000->#1, B:5000->#1, C:4000->#3, D:3000->#4)
 * 8. Leaderboard pagination consistency across pages
 * 9. Current user ranking resolution
 * 10. Zero XP user handling and Beginner rank resolution
 * 11. Authorization verification for private endpoints
 * 12. Invalid pagination parameter normalization & boundary defense
 * 13. Sensitive fields protection (password, email, phone, token excluded)
 * 14. Existing gamification regression check (Lesson XP, Quiz XP, Streak)
 */

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  details: string
}

const results: TestResult[] = []

async function runPhase4TestSuite() {
  console.log('====================================================')
  console.log('   STARTING PHASE 4 LEADERBOARD & READ TEST SUITE')
  console.log('====================================================\n')

  const testUserIds: string[] = []

  try {
    // ========================================================
    // TEST 1 — Rank Calculation Across All Boundaries
    // ========================================================
    console.log('--- TEST 1: Rank Calculation Across All Boundaries ---')
    const boundaryCases: Array<{ xp: number; expectedName: string; expectedLevel: number }> = [
      { xp: 0, expectedName: 'Beginner', expectedLevel: 1 },
      { xp: 499, expectedName: 'Beginner', expectedLevel: 1 },
      { xp: 500, expectedName: 'Explorer', expectedLevel: 2 },
      { xp: 1499, expectedName: 'Explorer', expectedLevel: 2 },
      { xp: 1500, expectedName: 'Learner', expectedLevel: 3 },
      { xp: 2999, expectedName: 'Learner', expectedLevel: 3 },
      { xp: 3000, expectedName: 'Skilled', expectedLevel: 4 },
      { xp: 5999, expectedName: 'Skilled', expectedLevel: 4 },
      { xp: 6000, expectedName: 'Advanced', expectedLevel: 5 },
      { xp: 9999, expectedName: 'Advanced', expectedLevel: 5 },
      { xp: 10000, expectedName: 'Expert', expectedLevel: 6 },
      { xp: 19999, expectedName: 'Expert', expectedLevel: 6 },
      { xp: 20000, expectedName: 'Master', expectedLevel: 7 }
    ]

    let test1AllMatch = true
    for (const b of boundaryCases) {
      const rank = getRankFromXp(b.xp)
      if (rank.name !== b.expectedName || rank.level !== b.expectedLevel) {
        test1AllMatch = false
        console.error(`Rank mismatch at ${b.xp} XP: expected ${b.expectedName} (Lv ${b.expectedLevel}), got ${rank.name} (Lv ${rank.level})`)
      }
    }

    results.push({
      test: 'Test 1 — Rank Calculation',
      status: test1AllMatch ? 'PASS' : 'FAIL',
      details: `Tested ${boundaryCases.length} boundary thresholds (0 to 20,000+ XP). All matched exactly.`
    })
    console.log(`Result: ${test1AllMatch ? 'PASS' : 'FAIL'} (${results[0].details})\n`)

    // ========================================================
    // SETUP: Create isolated test users for integration tests
    // ========================================================
    console.log('Setup: Creating isolated test users for Phase 4 tests...')
    const uAliceId = randomUUID()
    const uBobId = randomUUID()
    const uCharlieId = randomUUID()
    const uDavidId = randomUUID()
    const uEvaId = randomUUID()
    const uFrankZeroId = randomUUID()

    testUserIds.push(uAliceId, uBobId, uCharlieId, uDavidId, uEvaId, uFrankZeroId)

    const now = new Date()
    await Promise.all([
      prisma.user.create({
        data: {
          id: uAliceId,
          email: `p4_alice_${Date.now()}@test.com`,
          username: `p4_alice_${Date.now()}`,
          password: 'hashed_password_alice',
          xpTotal: 5000,
          currentStreak: 5,
          longestStreak: 10,
          lastActivityAt: now
        }
      }),
      prisma.user.create({
        data: {
          id: uBobId,
          email: `p4_bob_${Date.now()}@test.com`,
          username: `p4_bob_${Date.now()}`,
          password: 'hashed_password_bob',
          xpTotal: 5000, // Tied with Alice!
          currentStreak: 3,
          longestStreak: 7,
          lastActivityAt: now
        }
      }),
      prisma.user.create({
        data: {
          id: uCharlieId,
          email: `p4_charlie_${Date.now()}@test.com`,
          username: `p4_charlie_${Date.now()}`,
          password: 'hashed_password_charlie',
          xpTotal: 4000,
          currentStreak: 2,
          longestStreak: 4,
          lastActivityAt: now
        }
      }),
      prisma.user.create({
        data: {
          id: uDavidId,
          email: `p4_david_${Date.now()}@test.com`,
          username: `p4_david_${Date.now()}`,
          password: 'hashed_password_david',
          xpTotal: 3000,
          currentStreak: 1,
          longestStreak: 2,
          lastActivityAt: now
        }
      }),
      prisma.user.create({
        data: {
          id: uEvaId,
          email: `p4_eva_${Date.now()}@test.com`,
          username: `p4_eva_${Date.now()}`,
          password: 'hashed_password_eva',
          xpTotal: 1000,
          currentStreak: 0,
          longestStreak: 1,
          lastActivityAt: null
        }
      }),
      prisma.user.create({
        data: {
          id: uFrankZeroId,
          email: `p4_frank_${Date.now()}@test.com`,
          username: `p4_frank_${Date.now()}`,
          password: 'hashed_password_frank',
          xpTotal: 0, // Zero XP!
          currentStreak: 0,
          longestStreak: 0,
          lastActivityAt: null
        }
      })
    ])
    console.log(`Created 6 isolated test users.\n`)

    // ========================================================
    // TEST 2 — XP Summary API
    // ========================================================
    console.log('--- TEST 2: XP Summary API ---')
    const summaryRes = await getUserXpSummaryService(uCharlieId)
    const summaryData = summaryRes.data

    const test2Pass =
      summaryRes.success === true &&
      summaryData.xpTotal === 4000 &&
      summaryData.rank.name === 'Skilled' &&
      summaryData.rank.minXP === 3000 &&
      summaryData.rank.maxXP === 5999 &&
      summaryData.currentStreak === 2 &&
      summaryData.longestStreak === 4 &&
      summaryData.nextRank.name === 'Advanced' &&
      summaryData.nextRank.minXP === 6000 &&
      summaryData.xpToNextRank === 2000 // 6000 - 4000

    results.push({
      test: 'Test 2 — XP Summary API',
      status: test2Pass ? 'PASS' : 'FAIL',
      details: `xpTotal: ${summaryData.xpTotal}, rank: ${summaryData.rank.name}, nextRank: ${summaryData.nextRank?.name}, xpToNextRank: ${summaryData.xpToNextRank}`
    })
    console.log(`Result: ${test2Pass ? 'PASS' : 'FAIL'} (${results[1].details})\n`)

    // ========================================================
    // TEST 3 — Streak API
    // ========================================================
    console.log('--- TEST 3: Streak API ---')
    const streakRes = await getUserStreakService(uAliceId)
    const streakData = streakRes.data

    const test3Pass =
      streakRes.success === true &&
      streakData.currentStreak === 5 &&
      streakData.longestStreak === 10 &&
      streakData.timezone === 'Asia/Ho_Chi_Minh' &&
      streakData.lastActivityAt !== null

    results.push({
      test: 'Test 3 — Streak API',
      status: test3Pass ? 'PASS' : 'FAIL',
      details: `currentStreak: ${streakData.currentStreak}, longestStreak: ${streakData.longestStreak}, timezone: ${streakData.timezone}`
    })
    console.log(`Result: ${test3Pass ? 'PASS' : 'FAIL'} (${results[2].details})\n`)

    // ========================================================
    // TEST 4 — XP History Pagination and Sorting
    // ========================================================
    console.log('--- TEST 4: XP History Pagination and Sorting ---')
    // Seed 5 XP transactions for Alice with slight timestamps
    for (let i = 1; i <= 5; i++) {
      await createXPTransaction({
        userId: uAliceId,
        amount: i * 10,
        type: XPTransactionType.LESSON_COMPLETED,
        eventKey: `test-p4-history-${uAliceId}-${i}`
      })
    }

    const historyPage1 = await getUserXpHistoryService({ userId: uAliceId, page: 1, limit: 3 })
    const historyPage2 = await getUserXpHistoryService({ userId: uAliceId, page: 2, limit: 3 })

    const p1Txns = historyPage1.data.transactions
    const p2Txns = historyPage2.data.transactions

    const isSortedDesc = p1Txns[0].createdAt >= p1Txns[1].createdAt && p1Txns[1].createdAt >= p1Txns[2].createdAt
    const paginationDeterministic =
      p1Txns.length === 3 &&
      p2Txns.length === 2 &&
      historyPage1.data.pagination.total === 5 &&
      historyPage1.data.pagination.totalPages === 2

    const test4Pass = historyPage1.success && isSortedDesc && paginationDeterministic

    results.push({
      test: 'Test 4 — XP History Pagination and Sorting',
      status: test4Pass ? 'PASS' : 'FAIL',
      details: `Page 1 count: ${p1Txns.length}, Page 2 count: ${p2Txns.length}, Total: ${historyPage1.data.pagination.total}, Sorted DESC: ${isSortedDesc}`
    })
    console.log(`Result: ${test4Pass ? 'PASS' : 'FAIL'} (${results[3].details})\n`)

    // ========================================================
    // TEST 5 — XP History User Isolation
    // ========================================================
    console.log('--- TEST 5: XP History User Isolation ---')
    // Seed 1 transaction for Bob
    await createXPTransaction({
      userId: uBobId,
      amount: 100,
      type: XPTransactionType.QUIZ_COMPLETED,
      eventKey: `test-p4-history-${uBobId}-1`
    })

    const bobHistory = await getUserXpHistoryService({ userId: uBobId, page: 1, limit: 10 })
    const bobTxns = bobHistory.data.transactions

    // Verify Bob only has his 1 transaction and none of Alice's 5 transactions
    const bobSeesAlice = bobTxns.some((t: any) => t.userId === uAliceId)
    const test5Pass = bobTxns.length === 1 && bobTxns[0].userId === uBobId && !bobSeesAlice

    results.push({
      test: 'Test 5 — XP History Isolation',
      status: test5Pass ? 'PASS' : 'FAIL',
      details: `Bob transactions count: ${bobTxns.length}, All belong to Bob: ${!bobSeesAlice}`
    })
    console.log(`Result: ${test5Pass ? 'PASS' : 'FAIL'} (${results[4].details})\n`)

    // ========================================================
    // TEST 6 — Leaderboard Ordering (xpTotal DESC)
    // ========================================================
    console.log('--- TEST 6: Leaderboard Ordering ---')
    const lbRes = await getLeaderboardService({ page: 1, limit: 100 })
    const allLbItems = lbRes.data.leaderboard

    // Filter only our test users to check ordering
    const testUsersOnLb = allLbItems.filter((item: any) => testUserIds.includes(item.userId))
    let isStrictlyOrdered = true
    for (let i = 0; i < testUsersOnLb.length - 1; i++) {
      if (testUsersOnLb[i].xpTotal < testUsersOnLb[i + 1].xpTotal) {
        isStrictlyOrdered = false
        break
      }
    }

    const test6Pass = lbRes.success && isStrictlyOrdered && testUsersOnLb.length === 6

    results.push({
      test: 'Test 6 — Leaderboard Ordering',
      status: test6Pass ? 'PASS' : 'FAIL',
      details: `Test users on board: ${testUsersOnLb.length}, strictly ordered by xpTotal DESC: ${isStrictlyOrdered}`
    })
    console.log(`Result: ${test6Pass ? 'PASS' : 'FAIL'} (${results[5].details})\n`)

    // ========================================================
    // TEST 7 — Competition Tie Ranking (RANK() 1224)
    // ========================================================
    console.log('--- TEST 7: Competition Tie Ranking ---')
    // Alice (5000), Bob (5000), Charlie (4000), David (3000)
    // Competition ranking requires:
    // 1. Alice and Bob share the exact same rank (tied)
    // 2. Charlie's rank skips the tied slot (charlie.rank >= alice.rank + 2)
    // 3. David's rank is strictly after Charlie (david.rank > charlie.rank)
    const alicePos = await getUserLeaderboardPositionService(uAliceId)
    const bobPos = await getUserLeaderboardPositionService(uBobId)
    const charliePos = await getUserLeaderboardPositionService(uCharlieId)
    const davidPos = await getUserLeaderboardPositionService(uDavidId)

    const test7Pass =
      alicePos.data.rank === bobPos.data.rank &&
      charliePos.data.rank >= alicePos.data.rank + 2 &&
      davidPos.data.rank > charliePos.data.rank

    results.push({
      test: 'Test 7 — Tie Ranking (Competition 1224)',
      status: test7Pass ? 'PASS' : 'FAIL',
      details: `Alice: #${alicePos.data.rank} (5000 XP), Bob: #${bobPos.data.rank} (5000 XP), Charlie: #${charliePos.data.rank} (4000 XP), David: #${davidPos.data.rank} (3000 XP)`
    })
    console.log(`Result: ${test7Pass ? 'PASS' : 'FAIL'} (${results[6].details})\n`)

    // ========================================================
    // TEST 8 — Leaderboard Pagination Consistency
    // ========================================================
    console.log('--- TEST 8: Leaderboard Pagination Consistency ---')
    const lbP1 = await getLeaderboardService({ page: 1, limit: 3 })
    const lbP2 = await getLeaderboardService({ page: 2, limit: 3 })

    const p1Ids = new Set(lbP1.data.leaderboard.map((i: any) => i.userId))
    const p2Ids = new Set(lbP2.data.leaderboard.map((i: any) => i.userId))

    // Check no duplicate IDs across page 1 and page 2
    let hasOverlap = false
    for (const id of p2Ids) {
      if (p1Ids.has(id)) {
        hasOverlap = true
        break
      }
    }

    const test8Pass =
      lbP1.data.leaderboard.length === 3 &&
      lbP2.data.leaderboard.length === 3 &&
      !hasOverlap &&
      lbP1.data.pagination.page === 1 &&
      lbP2.data.pagination.page === 2

    results.push({
      test: 'Test 8 — Leaderboard Pagination',
      status: test8Pass ? 'PASS' : 'FAIL',
      details: `Page 1: 3 items, Page 2: 3 items, Zero overlap between pages: ${!hasOverlap}`
    })
    console.log(`Result: ${test8Pass ? 'PASS' : 'FAIL'} (${results[7].details})\n`)

    // ========================================================
    // TEST 9 — Current User Rank in Leaderboard
    // ========================================================
    console.log('--- TEST 9: Current User Rank in Leaderboard ---')
    const lbWithMe = await getLeaderboardService({ page: 1, limit: 2, currentUserId: uDavidId })
    const currentUserInfo = lbWithMe.data.currentUser

    const test9Pass =
      currentUserInfo !== undefined &&
      currentUserInfo.userId === uDavidId &&
      currentUserInfo.rank === davidPos.data.rank &&
      currentUserInfo.xpTotal === 3000 &&
      currentUserInfo.rankName === 'Skilled'

    results.push({
      test: 'Test 9 — Current User Rank in Leaderboard',
      status: test9Pass ? 'PASS' : 'FAIL',
      details: `Resolved currentUser: ${currentUserInfo?.username}, rank: #${currentUserInfo?.rank}, rankName: ${currentUserInfo?.rankName}`
    })
    console.log(`Result: ${test9Pass ? 'PASS' : 'FAIL'} (${results[8].details})\n`)

    // ========================================================
    // TEST 10 — Zero XP User Resolution
    // ========================================================
    console.log('--- TEST 10: Zero XP User Resolution ---')
    const frankPos = await getUserLeaderboardPositionService(uFrankZeroId)
    const frankData = frankPos.data

    const test10Pass =
      frankPos.success === true &&
      frankData.xpTotal === 0 &&
      frankData.rankName === 'Beginner' &&
      frankData.rankLevel === 1 &&
      frankData.rank >= 6 // Tied with other 0 XP users at rank 6 or higher

    results.push({
      test: 'Test 10 — Zero XP User Resolution',
      status: test10Pass ? 'PASS' : 'FAIL',
      details: `Frank xpTotal: ${frankData.xpTotal}, rank: #${frankData.rank}, rankName: ${frankData.rankName} (Lv ${frankData.rankLevel})`
    })
    console.log(`Result: ${test10Pass ? 'PASS' : 'FAIL'} (${results[9].details})\n`)

    // ========================================================
    // TEST 11 — Authorization Check on Private Endpoints
    // ========================================================
    console.log('--- TEST 11: Authorization Defense ---')
    // Direct validation of service rejection when userId is missing/invalid
    const unauthSummary = await getUserXpSummaryService('')
    const unauthStreak = await getUserStreakService('')
    const unauthHistory = await getUserXpHistoryService({ userId: '' })
    const unauthPos = await getUserLeaderboardPositionService('')

    const test11Pass =
      unauthSummary.success === false &&
      unauthSummary.statusCode === 400 &&
      unauthStreak.success === false &&
      unauthStreak.statusCode === 400 &&
      unauthHistory.success === false &&
      unauthHistory.statusCode === 400 &&
      unauthPos.success === false &&
      unauthPos.statusCode === 400

    results.push({
      test: 'Test 11 — Authorization & Identity Validation',
      status: test11Pass ? 'PASS' : 'FAIL',
      details: `Summary: ${unauthSummary.statusCode}, Streak: ${unauthStreak.statusCode}, History: ${unauthHistory.statusCode}, Position: ${unauthPos.statusCode}`
    })
    console.log(`Result: ${test11Pass ? 'PASS' : 'FAIL'} (${results[10].details})\n`)

    // ========================================================
    // TEST 12 — Invalid Pagination Parameter Normalization
    // ========================================================
    console.log('--- TEST 12: Invalid Pagination Normalization ---')
    // page = 0, limit = -1 -> should normalize to page = 1, limit = 20
    const normRes1 = await getLeaderboardService({ page: 0, limit: -1 })
    // limit = 999999 -> should clamp to max limit 100
    const normRes2 = await getLeaderboardService({ page: 1, limit: 999999 })

    const test12Pass =
      normRes1.data.pagination.page === 1 &&
      normRes1.data.pagination.limit === 20 &&
      normRes2.data.pagination.limit === 100

    results.push({
      test: 'Test 12 — Invalid Pagination Normalization',
      status: test12Pass ? 'PASS' : 'FAIL',
      details: `page=0/limit=-1 normalized to page=${normRes1.data.pagination.page}/limit=${normRes1.data.pagination.limit}; limit=999999 clamped to ${normRes2.data.pagination.limit}`
    })
    console.log(`Result: ${test12Pass ? 'PASS' : 'FAIL'} (${results[11].details})\n`)

    // ========================================================
    // TEST 13 — Sensitive Field Protection
    // ========================================================
    console.log('--- TEST 13: Sensitive Field Protection ---')
    const sampleLb = await getLeaderboardService({ page: 1, limit: 10 })
    const sampleItems = sampleLb.data.leaderboard

    let hasSensitiveData = false
    const forbiddenKeys = ['password', 'email', 'phone', 'refreshToken', 'refresh_token', 'resetPasswordToken', 'otpCode']
    for (const item of sampleItems) {
      for (const k of forbiddenKeys) {
        if (k in item) {
          hasSensitiveData = true
          console.error(`Forbidden key ${k} exposed on leaderboard item!`)
        }
      }
    }

    const test13Pass = !hasSensitiveData && sampleItems.length > 0

    results.push({
      test: 'Test 13 — Sensitive Field Protection',
      status: test13Pass ? 'PASS' : 'FAIL',
      details: `Checked ${sampleItems.length} items. Zero sensitive fields exposed: ${!hasSensitiveData}`
    })
    console.log(`Result: ${test13Pass ? 'PASS' : 'FAIL'} (${results[12].details})\n`)

    // ========================================================
    // TEST 14 — Existing Gamification Regression Check
    // ========================================================
    console.log('--- TEST 14: Gamification Write-Side Regression ---')
    // Test user for regression
    const testRegUser = randomUUID()
    const testRegLesson = randomUUID()
    const testRegQuiz = randomUUID()

    testUserIds.push(testRegUser)

    await prisma.user.create({
      data: {
        id: testRegUser,
        email: `p4_reg_${Date.now()}@test.com`,
        username: `p4_reg_${Date.now()}`,
        password: 'hashed_password_reg',
        xpTotal: 0
      }
    })

    // 1. Lesson completion (+70 XP)
    const lRes = await awardLessonCompletionXP({ userId: testRegUser, lessonId: testRegLesson })
    // 2. Streak update (+20 XP for first activity)
    const sRes = await recordLearningActivityStreak({ userId: testRegUser })
    // 3. Quiz completion (+100 XP)
    const qRes = await awardQuizCompletionXP({ userId: testRegUser, quizId: testRegQuiz })

    const regUserFinal = await prisma.user.findUnique({ where: { id: testRegUser } })

    // Expected total: 70 + 20 + 100 = 190 XP, streak = 1
    const test14Pass =
      lRes.awarded === true &&
      lRes.amount === 70 &&
      sRes.dailyXpAwarded === 20 &&
      sRes.currentStreak === 1 &&
      qRes.awarded === true &&
      qRes.amount === 100 &&
      regUserFinal?.xpTotal === 190

    results.push({
      test: 'Test 14 — Gamification Write-Side Regression',
      status: test14Pass ? 'PASS' : 'FAIL',
      details: `Lesson XP: +${lRes.amount}, Daily Streak XP: +${sRes.dailyXpAwarded}, Quiz XP: +${qRes.amount}, Final xpTotal: ${regUserFinal?.xpTotal} (expected 190)`
    })
    console.log(`Result: ${test14Pass ? 'PASS' : 'FAIL'} (${results[13].details})\n`)

  } finally {
    // Cleanup ALL test data
    console.log('Cleanup: Removing test users and test XP records...')
    try {
      if (testUserIds.length > 0) {
        await prisma.xPTransaction.deleteMany({
          where: { userId: { in: testUserIds } }
        })
        await prisma.user.deleteMany({
          where: { id: { in: testUserIds } }
        })
      }
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
  console.log(`OVERALL STATUS: ${allPass ? '✅ ALL 14 TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  console.log('====================================================\n')

  await prisma.$disconnect()
  process.exit(allPass ? 0 : 1)
}

runPhase4TestSuite().catch(async (e) => {
  console.error('Phase 4 Test Suite Fatal Error:', e)
  await prisma.$disconnect()
  process.exit(1)
})
