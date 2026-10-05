/**
 * TMDEMY — PHASE 2: HISTORICAL USER DATA PATCH SCRIPT (STEP 0)
 *
 * File: scripts/migration-utils/patch-phase2-users.ts
 *
 * Purpose:
 *   Handles isVerified patch for 7 historical accounts migrated from MongoDB.
 *   - 5 Approved Accounts: Trusted historical accounts with active business history (D1).
 *   - 2 Excluded Accounts: Accounts with insufficient evidence, retained as isVerified = false.
 *
 * Safety Rules:
 *   - Default mode is DRY-RUN (npx tsx scripts/migration-utils/patch-phase2-users.ts).
 *   - EXECUTE mode requires explicit flag (--execute).
 *   - Uses Prisma Client Singleton from src/config/prisma.
 *   - Transactional execution with sanity pre-checks.
 *   - Zero sensitive field exposure (password, tokens, OTP codes are NEVER selected).
 */

import { prisma } from '../../src/config/prisma'

export interface HistoricalAccountTarget {
  id: string
  expectedEmail: string
  expectedRole: string
  username: string
  classification: 'APPROVED' | 'EXCLUDED'
  reason: string
}

/**
 * Approved list of 5 trusted historical accounts (Project Owner Approved in Decisions Register D1)
 */
export const APPROVED_ACCOUNTS: HistoricalAccountTarget[] = [
  {
    id: '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
    expectedEmail: 'thaiminh0612@gmail.com',
    expectedRole: 'ADMIN',
    username: 'new_username123',
    classification: 'APPROVED',
    reason: 'Created all 3 system categories and 2 courses'
  },
  {
    id: '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
    expectedEmail: 'nab@gmail.com',
    expectedRole: 'TEACHER',
    username: 'nguyen_anh_binh',
    classification: 'APPROVED',
    reason: 'Author of 5 courses, 7 lessons, 1 comment'
  },
  {
    id: '6dd1ccd9-420b-5c6d-8322-75223e67e549',
    expectedEmail: 'teacher_cntt@gmail.com',
    expectedRole: 'TEACHER',
    username: 'teacher_cntt',
    classification: 'APPROVED',
    reason: 'Author of 1 course, 1 order, 1 enrollment'
  },
  {
    id: 'c55de839-f059-519c-8820-b16aa17fb9c3',
    expectedEmail: 'thaiminh061204@gmail.com',
    expectedRole: 'USER',
    username: 'minhsuyyyyy',
    classification: 'APPROVED',
    reason: 'Active learner: 6 orders, 3 enrollments, 4 comments, 1 rating, 2 quiz submissions'
  },
  {
    id: '02e8e13a-dab2-5fb6-a14f-933ac125edca',
    expectedEmail: 'thaiminhgotthedope@gmail.com',
    expectedRole: 'USER',
    username: 'thaiminh',
    classification: 'APPROVED',
    reason: 'Active learner: 1 order, 1 enrollment, 3 comments'
  }
]

/**
 * Excluded list of 2 accounts with insufficient activity evidence (retained as isVerified = false)
 */
export const EXCLUDED_ACCOUNTS: HistoricalAccountTarget[] = [
  {
    id: '773e6719-acb0-5750-b06d-7445812f40b3',
    expectedEmail: 'thaiminh06112@gmail.com',
    expectedRole: 'USER',
    username: 'thaiminh',
    classification: 'EXCLUDED',
    reason: '0 courses, 0 orders, 0 enrollments, 0 comments (insufficient evidence)'
  },
  {
    id: '6b760425-effa-5713-99ba-b296e6cf190d',
    expectedEmail: 'levanquang2k3.vn@gmail.com',
    expectedRole: 'USER',
    username: 'levanquang',
    classification: 'EXCLUDED',
    reason: '0 courses, 0 orders, 0 enrollments, 0 comments (insufficient evidence)'
  }
]

export const ALL_HISTORICAL_ACCOUNTS = [...APPROVED_ACCOUNTS, ...EXCLUDED_ACCOUNTS]

/**
 * Helper to mask emails for safe logging
 */
export function maskEmail(email: string): string {
  const parts = email.split('@')
  if (parts.length !== 2) return '***'
  const user = parts[0]
  const domain = parts[1]
  if (user.length <= 3) {
    return `${user.charAt(0)}***@${domain}`
  }
  return `${user.substring(0, 3)}***@${domain}`
}

export interface PatchEvaluationResult {
  account: HistoricalAccountTarget
  dbRecordFound: boolean
  currentEmail?: string
  currentRole?: string
  currentStatus?: string
  currentIsVerified?: boolean
  emailMatches: boolean
  isEligibleForPatch: boolean
  plannedAction: 'PATCH_TO_TRUE' | 'RETAIN_FALSE' | 'ALREADY_TRUE' | 'ERROR_NOT_FOUND'
  notes: string
}

/**
 * Evaluate all 7 historical accounts against current PostgreSQL records
 */
export async function evaluateHistoricalAccounts(): Promise<PatchEvaluationResult[]> {
  const ids = ALL_HISTORICAL_ACCOUNTS.map((a) => a.id)

  // Query only safe fields — never query password, OTP, tokens
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      isVerified: true,
      createdAt: true
    }
  })

  const userMap = new Map(users.map((u) => [u.id, u]))
  const results: PatchEvaluationResult[] = []

  for (const target of ALL_HISTORICAL_ACCOUNTS) {
    const dbUser = userMap.get(target.id)

    if (!dbUser) {
      results.push({
        account: target,
        dbRecordFound: false,
        emailMatches: false,
        isEligibleForPatch: false,
        plannedAction: 'ERROR_NOT_FOUND',
        notes: `User with ID ${target.id} was not found in PostgreSQL database`
      })
      continue
    }

    const emailMatches = dbUser.email.toLowerCase() === target.expectedEmail.toLowerCase()

    if (!emailMatches) {
      results.push({
        account: target,
        dbRecordFound: true,
        currentEmail: dbUser.email,
        currentRole: dbUser.role,
        currentStatus: dbUser.status,
        currentIsVerified: dbUser.isVerified,
        emailMatches: false,
        isEligibleForPatch: false,
        plannedAction: 'RETAIN_FALSE',
        notes: `EMAIL MISMATCH: expected ${target.expectedEmail}, found ${dbUser.email}`
      })
      continue
    }

    if (target.classification === 'EXCLUDED') {
      results.push({
        account: target,
        dbRecordFound: true,
        currentEmail: dbUser.email,
        currentRole: dbUser.role,
        currentStatus: dbUser.status,
        currentIsVerified: dbUser.isVerified,
        emailMatches: true,
        isEligibleForPatch: false,
        plannedAction: 'RETAIN_FALSE',
        notes: `EXCLUDED per decision D1: ${target.reason}`
      })
      continue
    }

    // Target is APPROVED
    if (dbUser.isVerified) {
      results.push({
        account: target,
        dbRecordFound: true,
        currentEmail: dbUser.email,
        currentRole: dbUser.role,
        currentStatus: dbUser.status,
        currentIsVerified: true,
        emailMatches: true,
        isEligibleForPatch: false,
        plannedAction: 'ALREADY_TRUE',
        notes: 'Account is already verified. No patch needed.'
      })
    } else {
      results.push({
        account: target,
        dbRecordFound: true,
        currentEmail: dbUser.email,
        currentRole: dbUser.role,
        currentStatus: dbUser.status,
        currentIsVerified: false,
        emailMatches: true,
        isEligibleForPatch: true,
        plannedAction: 'PATCH_TO_TRUE',
        notes: `Eligible for patch: ${target.reason}`
      })
    }
  }

  return results
}

/**
 * Execute the database update within a Prisma transaction
 */
export async function executeHistoricalPatch(evaluations: PatchEvaluationResult[]): Promise<{
  success: boolean
  updatedCount: number
  updatedIds: string[]
  message: string
}> {
  const eligibleTargets = evaluations.filter((e) => e.isEligibleForPatch)

  if (eligibleTargets.length === 0) {
    return {
      success: true,
      updatedCount: 0,
      updatedIds: [],
      message: 'No eligible accounts require updating.'
    }
  }

  // Pre-check sanity assertions
  const approvedIds = new Set(APPROVED_ACCOUNTS.map((a) => a.id))
  for (const target of eligibleTargets) {
    if (!approvedIds.has(target.account.id)) {
      throw new Error(`SECURITY ALERT: Account ${target.account.id} is not in the APPROVED list! Aborting.`)
    }
    if (target.account.classification !== 'APPROVED') {
      throw new Error(`SECURITY ALERT: Account ${target.account.id} classification is not APPROVED! Aborting.`)
    }
    if (!target.emailMatches) {
      throw new Error(`SECURITY ALERT: Email mismatch for ${target.account.id}! Aborting.`)
    }
    if (target.currentIsVerified !== false) {
      throw new Error(`SECURITY ALERT: Account ${target.account.id} is not currently false! Aborting.`)
    }
  }

  // Transactional update
  const updatedIds = eligibleTargets.map((e) => e.account.id)

  const result = await prisma.$transaction(async (tx) => {
    const updateRes = await tx.user.updateMany({
      where: {
        id: { in: updatedIds },
        isVerified: false
      },
      data: {
        isVerified: true
      }
    })

    if (updateRes.count !== updatedIds.length) {
      throw new Error(
        `Transaction integrity failure: Expected to update ${updatedIds.length} records, but updated ${updateRes.count}. Rolling back!`
      )
    }

    // Verify excluded accounts were NEVER modified in transaction
    const excludedIds = EXCLUDED_ACCOUNTS.map((a) => a.id)
    const excludedUsers = await tx.user.findMany({
      where: { id: { in: excludedIds } },
      select: { id: true, isVerified: true }
    })

    for (const ex of excludedUsers) {
      if (ex.isVerified !== false) {
        throw new Error(`CRITICAL INTEGRITY FAILURE: Excluded account ${ex.id} has isVerified=true! Rolling back!`)
      }
    }

    return updateRes.count
  })

  return {
    success: true,
    updatedCount: result,
    updatedIds,
    message: `Successfully updated ${result} trusted historical accounts to isVerified = true.`
  }
}

/**
 * Main script entrypoint
 */
export async function main() {
  const isExecute = process.argv.includes('--execute')
  const isExplicitDryRun = process.argv.includes('--dry-run')

  console.log('='.repeat(80))
  console.log('  TMDEMY — PHASE 2: HISTORICAL USER DATA PATCH (STEP 0)')
  console.log('='.repeat(80))
  console.log(`Mode: ${isExecute ? '🔴 EXECUTE (LIVE WRITE)' : '🟢 DRY-RUN (READ-ONLY)'}`)
  console.log(`Execution Timestamp: ${new Date().toISOString()}`)
  console.log('-'.repeat(80))

  try {
    const evaluations = await evaluateHistoricalAccounts()

    console.log('\n[AUDIT RESULTS OF 7 HISTORICAL ACCOUNTS]:\n')
    console.table(
      evaluations.map((e, idx) => ({
        '#': idx + 1,
        UUID: e.account.id,
        Username: e.account.username,
        'Masked Email': maskEmail(e.account.expectedEmail),
        Role: e.currentRole || 'N/A',
        Classification: e.account.classification,
        'Current isVerified': e.currentIsVerified !== undefined ? e.currentIsVerified : 'NOT_FOUND',
        'Planned Action': e.plannedAction
      }))
    )

    const eligibleCount = evaluations.filter((e) => e.plannedAction === 'PATCH_TO_TRUE').length
    const excludedCount = evaluations.filter((e) => e.account.classification === 'EXCLUDED').length
    const alreadyTrueCount = evaluations.filter((e) => e.plannedAction === 'ALREADY_TRUE').length
    const errorCount = evaluations.filter((e) => e.plannedAction === 'ERROR_NOT_FOUND').length

    console.log('\n[SUMMARY STATISTICS]:')
    console.log(`  • Total Historical Accounts Evaluated: ${evaluations.length}`)
    console.log(`  • Approved Targets Eligible for Patch:  ${eligibleCount}`)
    console.log(`  • Excluded Accounts Retaining False:    ${excludedCount}`)
    console.log(`  • Accounts Already Verified:            ${alreadyTrueCount}`)
    console.log(`  • Error / Missing Records:              ${errorCount}`)

    if (!isExecute) {
      console.log('\n' + '='.repeat(80))
      console.log('  🟢 [DRY-RUN COMPLETE] NO CHANGES WERE WRITTEN TO POSTGRESQL.')
      console.log('  To apply these changes, run with explicit flag: --execute')
      console.log('='.repeat(80) + '\n')
      return
    }

    // Execute branch
    console.log('\n' + '='.repeat(80))
    console.log('  🔴 [EXECUTE MODE] APPLYING UPDATES INSIDE PRISMA TRANSACTION...')
    console.log('='.repeat(80))

    const patchResult = await executeHistoricalPatch(evaluations)
    console.log(`\n ${patchResult.message}`)
    console.log(`Updated User IDs:\n${patchResult.updatedIds.map((id) => `  - ${id}`).join('\n')}\n`)
  } catch (error: any) {
    console.error('\n❌ SCRIPT EXECUTION FAILED:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run immediately if invoked directly from CLI
if (require.main === module) {
  main()
}
