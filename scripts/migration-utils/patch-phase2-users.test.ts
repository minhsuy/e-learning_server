/**
 * Unit & Integration Test for Phase 2 Historical User Patch (Step 0)
 *
 * File: scripts/migration-utils/patch-phase2-users.test.ts
 *
 * Verifies:
 *   1. Approved list has exactly 5 accounts with expected UUIDs and roles.
 *   2. Excluded list has exactly 2 accounts with expected UUIDs.
 *   3. No overlap between approved and excluded lists.
 *   4. maskEmail properly masks user part of email.
 *   5. evaluateHistoricalAccounts properly identifies the 5 approved accounts and 2 excluded accounts from DB.
 *   6. Confirm that in Dry-run / Evaluation mode, NO database updates occur.
 */

import {
  APPROVED_ACCOUNTS,
  EXCLUDED_ACCOUNTS,
  ALL_HISTORICAL_ACCOUNTS,
  maskEmail,
  evaluateHistoricalAccounts
} from './patch-phase2-users'
import { prisma } from '../../src/config/prisma'

async function runTests() {
  console.log('='.repeat(80))
  console.log('  TEST SUITE: PATCH-PHASE2-USERS (STEP 0)')
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

  try {
    // Test 1: Count of approved accounts
    assert(APPROVED_ACCOUNTS.length === 5, 'APPROVED_ACCOUNTS contains exactly 5 accounts')

    // Test 2: Count of excluded accounts
    assert(EXCLUDED_ACCOUNTS.length === 2, 'EXCLUDED_ACCOUNTS contains exactly 2 accounts')

    // Test 3: Total accounts
    assert(ALL_HISTORICAL_ACCOUNTS.length === 7, 'ALL_HISTORICAL_ACCOUNTS contains exactly 7 accounts')

    // Test 4: No overlap between approved and excluded
    const approvedSet = new Set(APPROVED_ACCOUNTS.map((a) => a.id))
    const excludedOverlap = EXCLUDED_ACCOUNTS.some((a) => approvedSet.has(a.id))
    assert(!excludedOverlap, 'Zero ID overlap between approved and excluded lists')

    // Test 5: Verify expected UUIDs in approved list
    const expectedApprovedIds = [
      '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8',
      '13608f92-8acf-53e3-adcb-0d832e9cb1d4',
      '6dd1ccd9-420b-5c6d-8322-75223e67e549',
      'c55de839-f059-519c-8820-b16aa17fb9c3',
      '02e8e13a-dab2-5fb6-a14f-933ac125edca'
    ]
    const allApprovedMatch = expectedApprovedIds.every((id) => approvedSet.has(id))
    assert(allApprovedMatch, 'All 5 approved UUIDs match decisions-register.md specification')

    // Test 6: Verify expected UUIDs in excluded list
    const excludedSet = new Set(EXCLUDED_ACCOUNTS.map((a) => a.id))
    const expectedExcludedIds = [
      '773e6719-acb0-5750-b06d-7445812f40b3',
      '6b760425-effa-5713-99ba-b296e6cf190d'
    ]
    const allExcludedMatch = expectedExcludedIds.every((id) => excludedSet.has(id))
    assert(allExcludedMatch, 'All 2 excluded UUIDs match decisions-register.md specification')

    // Test 7: Email masking function
    const masked1 = maskEmail('thaiminh0612@gmail.com')
    assert(masked1 === 'tha***@gmail.com', `maskEmail properly formats long emails (${masked1})`)
    const masked2 = maskEmail('nab@gmail.com')
    assert(masked2 === 'n***@gmail.com', `maskEmail properly formats short emails (${masked2})`)

    // Test 8: Live Evaluation against PostgreSQL (READ-ONLY)
    console.log('\n  Evaluating live PostgreSQL records (READ-ONLY)...')
    const evaluations = await evaluateHistoricalAccounts()

    assert(evaluations.length === 7, `evaluateHistoricalAccounts evaluated 7 accounts (got ${evaluations.length})`)

    const foundCount = evaluations.filter((e) => e.dbRecordFound).length
    assert(foundCount === 7, `All 7 historical accounts exist in PostgreSQL database (found ${foundCount})`)

    const eligibleForPatch = evaluations.filter((e) => e.plannedAction === 'PATCH_TO_TRUE')
    assert(
      eligibleForPatch.length === 5,
      `Exactly 5 accounts are classified as PATCH_TO_TRUE (got ${eligibleForPatch.length})`
    )

    const retainedFalse = evaluations.filter((e) => e.plannedAction === 'RETAIN_FALSE')
    assert(
      retainedFalse.length === 2,
      `Exactly 2 accounts are classified as RETAIN_FALSE (got ${retainedFalse.length})`
    )

    // Test 9: Verify current database state has NOT been altered
    const dbUsersAfter = await prisma.user.findMany({
      where: { id: { in: ALL_HISTORICAL_ACCOUNTS.map((a) => a.id) } },
      select: { id: true, isVerified: true }
    })
    const anyTrue = dbUsersAfter.some((u) => u.isVerified === true)
    assert(!anyTrue, 'Database state verified: All 7 accounts remain isVerified = false (Zero writes occurred)')

    console.log('\n' + '-'.repeat(80))
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
    console.log('-'.repeat(80))

    if (failed > 0) {
      process.exit(1)
    }
  } catch (err: any) {
    console.error('Test execution failed with exception:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runTests()
