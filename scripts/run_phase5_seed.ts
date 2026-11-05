import { prisma } from '../src/config/prisma'
import { runGamificationDatasetSeed } from '../prisma/seeds/seed-gamification-demo'
import { getRankFromXp } from '../src/models/xp.model'

async function main() {
  console.log('>>> [START] EXECUTING PHASE 5 SEED PIPELINE <<<')
  const startTime = Date.now()

  // 1. Run seed
  await runGamificationDatasetSeed()
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\nSeed completed in ${duration} seconds.`)

  // 2. Perform exhaustive integrity audit
  console.log('\n--- VERIFYING DATA INTEGRITY ---')
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      xpTotal: true,
      currentStreak: true,
      longestStreak: true,
      lastActivityAt: true,
      enrollments: { select: { id: true, progress: true, status: true } },
      progress: { select: { id: true } },
      quizSubmissions: { select: { id: true } },
      xpTransactions: { select: { id: true, amount: true, type: true } }
    }
  })

  let xpMismatchCount = 0
  let streakAnomalyCount = 0

  const rankCounts: Record<string, number> = {
    Beginner: 0,
    Explorer: 0,
    Learner: 0,
    Skilled: 0,
    Advanced: 0,
    Expert: 0,
    Master: 0
  }

  const enrollmentDistribution = {
    zero: 0,
    oneToThree: 0,
    fourToSix: 0,
    sevenPlus: 0
  }

  const streakDistribution = {
    zero: 0,
    oneToThree: 0,
    fourToSeven: 0,
    eightToFourteen: 0,
    fifteenToThirty: 0,
    thirtyPlus: 0
  }

  for (const u of allUsers) {
    const sumXp = u.xpTransactions.reduce((acc, t) => acc + t.amount, 0)
    if (sumXp !== u.xpTotal) {
      console.error(`[MISMATCH] User ${u.username} (${u.id}): xpTotal=${u.xpTotal}, sum(txns)=${sumXp}`)
      xpMismatchCount++
    }

    if (u.currentStreak > u.longestStreak) {
      console.error(
        `[ANOMALY] User ${u.username}: currentStreak (${u.currentStreak}) > longestStreak (${u.longestStreak})`
      )
      streakAnomalyCount++
    }

    // Rank
    const rank = getRankFromXp(u.xpTotal).name
    rankCounts[rank] = (rankCounts[rank] || 0) + 1

    // Enrollment
    const eCount = u.enrollments.length
    if (eCount === 0) enrollmentDistribution.zero++
    else if (eCount <= 3) enrollmentDistribution.oneToThree++
    else if (eCount <= 6) enrollmentDistribution.fourToSix++
    else enrollmentDistribution.sevenPlus++

    // Streak
    const s = u.currentStreak
    if (s === 0) streakDistribution.zero++
    else if (s <= 3) streakDistribution.oneToThree++
    else if (s <= 7) streakDistribution.fourToSeven++
    else if (s <= 14) streakDistribution.eightToFourteen++
    else if (s <= 30) streakDistribution.fifteenToThirty++
    else streakDistribution.thirtyPlus++
  }

  console.log(`  ✓ XP Mismatch count: ${xpMismatchCount} (Must be 0)`)
  console.log(`  ✓ Streak Anomaly count: ${streakAnomalyCount} (Must be 0)`)

  // Progress distribution across all enrollments
  const allEnrollments = await prisma.enrollment.findMany({
    select: { progress: true, status: true }
  })
  const progressBuckets = {
    zero: 0,
    oneToTwentyFive: 0,
    twentySixToFifty: 0,
    fiftyOneToSeventyFive: 0,
    seventySixToNinetyNine: 0,
    oneHundred: 0
  }
  for (const e of allEnrollments) {
    if (e.progress === 0) progressBuckets.zero++
    else if (e.progress <= 25) progressBuckets.oneToTwentyFive++
    else if (e.progress <= 50) progressBuckets.twentySixToFifty++
    else if (e.progress <= 75) progressBuckets.fiftyOneToSeventyFive++
    else if (e.progress < 100) progressBuckets.seventySixToNinetyNine++
    else progressBuckets.oneHundred++
  }

  // Transaction type counts
  const [lessonTxnCount, quizTxnCount, streakTxnCount, totalTxnCount] = await Promise.all([
    prisma.xPTransaction.count({ where: { type: 'LESSON_COMPLETED' } }),
    prisma.xPTransaction.count({ where: { type: 'QUIZ_COMPLETED' } }),
    prisma.xPTransaction.count({ where: { type: 'DAILY_STREAK' } }),
    prisma.xPTransaction.count()
  ])

  console.log('\n--- METRICS SUMMARY ---')
  console.log('Rank Distribution:', rankCounts)
  console.log('Enrollment Distribution:', enrollmentDistribution)
  console.log('Progress Distribution:', progressBuckets)
  console.log('Streak Distribution:', streakDistribution)
  console.log('XP Transactions Breakdown:', {
    lesson_completed: lessonTxnCount,
    quiz_completed: quizTxnCount,
    daily_streak: streakTxnCount,
    total: totalTxnCount
  })

  // Show Top 10 Leaderboard preview
  const top10 = await prisma.user.findMany({
    take: 10,
    orderBy: { xpTotal: 'desc' },
    select: {
      username: true,
      xpTotal: true,
      currentStreak: true,
      longestStreak: true
    }
  })
  console.log('\n--- TOP 10 LEADERBOARD PREVIEW ---')
  top10.forEach((u, idx) => {
    const rank = getRankFromXp(u.xpTotal).name
    console.log(
      `  #${idx + 1} | ${u.username.padEnd(25)} | ${u.xpTotal.toString().padStart(6)} XP | Rank: ${rank.padEnd(10)} | Streak: ${u.currentStreak}/${u.longestStreak}`
    )
  })
}

main()
  .catch((err) => {
    console.error('Seed execution error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
