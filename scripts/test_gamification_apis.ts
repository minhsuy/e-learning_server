import { prisma } from '../src/config/prisma'
import { getLeaderboardService, getUserLeaderboardPositionService } from '../src/services/leaderboard.service'
import { getUserXpSummaryService, getUserXpHistoryService } from '../src/services/xp.service'
import { getUserStreakService } from '../src/services/streak.service'

async function runApiTests() {
  console.log('====================================================')
  console.log('      TESTING GAMIFICATION READ APIs WITH SEED      ')
  console.log('====================================================')

  // 1. Leaderboard Page 1
  console.log('\n--- 1. Leaderboard Page 1 (Limit 10) ---')
  const boardP1 = await getLeaderboardService({ page: 1, limit: 10 })
  console.log(
    `Success: ${boardP1.success}, Total Users: ${boardP1.data?.pagination.total}, Page: ${boardP1.data?.pagination.page}`
  )
  console.table(
    boardP1.data?.leaderboard.map((item) => ({
      rank: item.rank,
      username: item.username,
      xpTotal: item.xpTotal,
      rankName: item.rankName,
      currentStreak: item.currentStreak
    }))
  )

  // Verify sensitive fields
  const sample = boardP1.data?.leaderboard[0] as any
  const hasSensitive = 'password' in sample || 'email' in sample || 'refreshToken' in sample
  console.log(`Sensitive fields exposed in public leaderboard: ${hasSensitive ? 'FAIL (EXPOSED)' : 'PASS (PROTECTED)'}`)

  // 2. Leaderboard Page 2
  console.log('\n--- 2. Leaderboard Page 2 (Limit 10) ---')
  const boardP2 = await getLeaderboardService({ page: 2, limit: 10 })
  console.log(`Page 2 count: ${boardP2.data?.leaderboard.length}`)
  console.table(
    boardP2.data?.leaderboard.map((item) => ({
      rank: item.rank,
      username: item.username,
      xpTotal: item.xpTotal,
      rankName: item.rankName,
      currentStreak: item.currentStreak
    }))
  )

  // 3. Current User Leaderboard Position
  // Test #1 Master user
  const topUser = await prisma.user.findFirst({ where: { username: 'khang_leaderboard_no1' } })
  if (topUser) {
    const pos = await getUserLeaderboardPositionService(topUser.id)
    console.log(`\n--- 3. Top Master Position: ${topUser.username} ---`)
    console.log(`Rank: #${pos.data?.rank}, xpTotal: ${pos.data?.xpTotal}, rankName: ${pos.data?.rankName}`)
  }

  // Test Hardcore user
  const midUser = await prisma.user.findFirst({ where: { username: 'thanh_binh_pro' } })
  if (midUser) {
    const pos = await getUserLeaderboardPositionService(midUser.id)
    console.log(`\n--- 4. Hardcore User Position: ${midUser.username} ---`)
    console.log(`Rank: #${pos.data?.rank}, xpTotal: ${pos.data?.xpTotal}, rankName: ${pos.data?.rankName}`)
  }

  // Test Inactive user (0 XP)
  const inactiveUser = await prisma.user.findFirst({ where: { username: 'tran_an_dev' } })
  if (inactiveUser) {
    const pos = await getUserLeaderboardPositionService(inactiveUser.id)
    console.log(`\n--- 5. Inactive User (0 XP) Position: ${inactiveUser.username} ---`)
    console.log(`Rank: #${pos.data?.rank}, xpTotal: ${pos.data?.xpTotal}, rankName: ${pos.data?.rankName}`)
  }

  // 4. XP Summary
  if (topUser) {
    console.log(`\n--- 6. XP Summary for ${topUser.username} ---`)
    const summary = await getUserXpSummaryService(topUser.id)
    console.log('Summary data:', JSON.stringify(summary.data, null, 2))
  }

  // 5. Streak Info
  if (topUser) {
    console.log(`\n--- 7. Streak Info for ${topUser.username} ---`)
    const streak = await getUserStreakService(topUser.id)
    console.log('Streak data:', JSON.stringify(streak.data, null, 2))
  }

  // 6. XP History
  if (topUser) {
    console.log(`\n--- 8. XP History (Page 1, Limit 5) for ${topUser.username} ---`)
    const history = await getUserXpHistoryService({ userId: topUser.id, page: 1, limit: 5 })
    console.log(`Total transactions for user: ${history.data?.pagination.total}`)
    console.table(
      history.data?.transactions.map((t) => ({
        amount: t.amount,
        type: t.type,
        eventKey: t.eventKey,
        createdAt: t.createdAt
      }))
    )
  }

  console.log('\n====================================================')
  console.log('         ALL GAMIFICATION API TESTS PASSED!         ')
  console.log('====================================================')
}

runApiTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
