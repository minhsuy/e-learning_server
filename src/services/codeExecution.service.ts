import {
  CodeExecutionResult,
  EXECUTION_LIMITS,
  ExecuteSingleTestCaseParams,
  ExecuteTestSuiteParams,
  SubmissionStatus,
  TestCaseExecutionResult,
  TestCaseStatus
} from '~/models/codeExecution.model'
import {
  buildJavaScriptHarness,
  parseHarnessOutput
} from '~/integrations/e2b/javascriptHarness'
import {
  defaultE2BClient,
  E2BError,
  IE2BClient
} from '~/integrations/e2b/e2b.client'
import { compareOutputs } from '~/integrations/e2b/resultComparator'

/**
 * TMDEMY — CODE EXECUTION SERVICE (E2B SANDBOX EDITION)
 * 
 * Central business service for executing untrusted JavaScript code inside an E2B cloud microVM sandbox.
 * Reusable by Student Run, Student Submit, Teacher Verification, and AI validation.
 * 
 * Key Principles:
 * - Isolated: NEVER runs student code on the Express server host.
 * - Secure: Hidden expected outputs and reference solutions are kept strictly on the backend.
 * - Resilient: Clearly differentiates infrastructure errors from student runtime/logic failures.
 */

/**
 * Normalizes time and memory resource limits within safe platform boundaries.
 */
function normalizeResourceLimits(timeLimitMs?: number, memoryLimitKb?: number) {
  const timeMs = Math.min(
    EXECUTION_LIMITS.MAX_TIME_LIMIT_MS,
    Math.max(EXECUTION_LIMITS.MIN_TIME_LIMIT_MS, timeLimitMs ?? EXECUTION_LIMITS.DEFAULT_TIME_LIMIT_MS)
  )

  const memoryKb = Math.min(
    EXECUTION_LIMITS.MAX_MEMORY_LIMIT_KB,
    Math.max(EXECUTION_LIMITS.MIN_MEMORY_LIMIT_KB, memoryLimitKb ?? EXECUTION_LIMITS.DEFAULT_MEMORY_LIMIT_KB)
  )

  return {
    timeLimitMs: timeMs,
    memoryLimitKb: memoryKb
  }
}

/**
 * In-process semaphore to bound concurrent E2B microVM executions.
 * Prevents cloud sandbox quota exhaustion and smooths traffic spikes.
 */
export class ConcurrencySemaphore {
  private active = 0
  private maxConcurrent: number
  private queue: Array<() => void> = []

  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent
  }

  async acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++
      return
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active++
        resolve()
      })
    })
  }

  release(): void {
    this.active = Math.max(0, this.active - 1)
    if (this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) next()
    }
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await task()
    } finally {
      this.release()
    }
  }

  get activeCount(): number {
    return this.active
  }

  get queueLength(): number {
    return this.queue.length
  }

  get waitingCount(): number {
    return this.queue.length
  }
}

export const globalE2BSemaphore = new ConcurrencySemaphore(5)

/**
 * Evaluates a single test case through the E2B sandbox.
 */
export const executeSingleTestCase = async (
  params: ExecuteSingleTestCaseParams,
  e2bClient: IE2BClient = defaultE2BClient
): Promise<TestCaseExecutionResult> => {
  const { sourceCode, executionContract, testCase, timeLimit, memoryLimit } = params

  // 1. Validate source code size
  if (Buffer.byteLength(sourceCode, 'utf-8') > EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES) {
    return {
      testCaseId: testCase.testCaseId,
      order: testCase.order ?? 0,
      weight: testCase.weight ?? 1,
      isHidden: testCase.isHidden ?? false,
      status: 'COMPILATION_ERROR' as TestCaseStatus,
      errorMessage: `Source code exceeds maximum permitted size of ${EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES / 1024} KB`
    }
  }

  // 2. Validate function name identifier
  if (!executionContract || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(executionContract.functionName)) {
    return {
      testCaseId: testCase.testCaseId,
      order: testCase.order ?? 0,
      weight: testCase.weight ?? 1,
      isHidden: testCase.isHidden ?? false,
      status: 'INTERNAL_ERROR' as TestCaseStatus,
      errorMessage: 'Invalid execution contract: functionName is malformed or missing'
    }
  }

  const limits = normalizeResourceLimits(timeLimit, memoryLimit)

  // 3. Build tamper-proof JavaScript harness (hidden expectedOutput is NEVER included)
  const harness = buildJavaScriptHarness(
    sourceCode,
    executionContract,
    testCase.input
  )

  try {
    // 4. Execute inside E2B Sandbox microVM with bounded concurrency
    await globalE2BSemaphore.acquire()
    let e2bRes: any
    try {
      e2bRes = await e2bClient.executeJavaScript(
        harness.harnessSource,
        harness.nonce,
        { timeLimitMs: limits.timeLimitMs }
      )
    } finally {
      globalE2BSemaphore.release()
    }

    const executionTimeMs = e2bRes.executionTimeMs

    // 5. Inspect execution failure modes
    if (e2bRes.timedOut) {
      return {
        testCaseId: testCase.testCaseId,
        order: testCase.order ?? 0,
        weight: testCase.weight ?? 1,
        isHidden: testCase.isHidden ?? false,
        status: 'TIME_LIMIT_EXCEEDED' as TestCaseStatus,
        executionTimeMs,
        errorMessage: 'Time limit exceeded during execution'
      }
    }

    // Check for syntax error at parse time
    if (e2bRes.exitCode !== 0 && e2bRes.stderr && /SyntaxError/i.test(e2bRes.stderr)) {
      return {
        testCaseId: testCase.testCaseId,
        order: testCase.order ?? 0,
        weight: testCase.weight ?? 1,
        isHidden: testCase.isHidden ?? false,
        status: 'COMPILATION_ERROR' as TestCaseStatus,
        executionTimeMs,
        errorMessage: e2bRes.stderr.trim()
      }
    }

    // Check for memory limit allocation failure
    if (e2bRes.exitCode !== 0 && e2bRes.stderr && /heap out of memory|allocation failed/i.test(e2bRes.stderr)) {
      return {
        testCaseId: testCase.testCaseId,
        order: testCase.order ?? 0,
        weight: testCase.weight ?? 1,
        isHidden: testCase.isHidden ?? false,
        status: 'MEMORY_LIMIT_EXCEEDED' as TestCaseStatus,
        executionTimeMs,
        errorMessage: 'Memory limit exceeded (heap allocation failed)'
      }
    }

    // 6. Parse structured harness output using cryptographic nonce
    const payload = parseHarnessOutput(e2bRes.stdout, harness.nonce)

    if (!payload) {
      if (e2bRes.stderr) {
        return {
          testCaseId: testCase.testCaseId,
          order: testCase.order ?? 0,
          weight: testCase.weight ?? 1,
          isHidden: testCase.isHidden ?? false,
          status: 'RUNTIME_ERROR' as TestCaseStatus,
          executionTimeMs,
          errorMessage: e2bRes.stderr.trim()
        }
      }
      return {
        testCaseId: testCase.testCaseId,
        order: testCase.order ?? 0,
        weight: testCase.weight ?? 1,
        isHidden: testCase.isHidden ?? false,
        status: 'RUNTIME_ERROR' as TestCaseStatus,
        executionTimeMs,
        errorMessage: 'Process terminated without returning valid grading markers (e.g. premature termination)'
      }
    }

    // If harness caught an exception thrown inside the function
    if (payload.error) {
      const isSyntax = payload.error.name === 'SyntaxError'
      return {
        testCaseId: testCase.testCaseId,
        order: testCase.order ?? 0,
        weight: testCase.weight ?? 1,
        isHidden: testCase.isHidden ?? false,
        status: (isSyntax ? 'COMPILATION_ERROR' : 'RUNTIME_ERROR') as TestCaseStatus,
        executionTimeMs,
        stdout: payload.userStdout,
        errorMessage: `${payload.error.name}: ${payload.error.message}`
      }
    }

    // If function did not return a value
    if (!payload.hasReturned) {
      return {
        testCaseId: testCase.testCaseId,
        order: testCase.order ?? 0,
        weight: testCase.weight ?? 1,
        isHidden: testCase.isHidden ?? false,
        status: 'FAILED' as TestCaseStatus,
        executionTimeMs,
        stdout: payload.userStdout,
        errorMessage: 'Function did not return a value'
      }
    }

    // Compare actual return value against expected output
    const comparison = compareOutputs(payload.returnValue, testCase.expectedOutput)

    return {
      testCaseId: testCase.testCaseId,
      order: testCase.order ?? 0,
      weight: testCase.weight ?? 1,
      isHidden: testCase.isHidden ?? false,
      status: (comparison.isEqual ? 'PASSED' : 'FAILED') as TestCaseStatus,
      executionTimeMs,
      actualOutput: payload.returnValue,
      expectedOutput: testCase.isHidden ? undefined : testCase.expectedOutput,
      stdout: payload.userStdout,
      comparisonReason: comparison.reason
    }
  } catch (err: any) {
    const isE2BError = err instanceof E2BError
    const isTimeout = isE2BError && err.code === 'TIMEOUT_ERROR'

    return {
      testCaseId: testCase.testCaseId,
      order: testCase.order ?? 0,
      weight: testCase.weight ?? 1,
      isHidden: testCase.isHidden ?? false,
      status: (isTimeout ? 'TIME_LIMIT_EXCEEDED' : 'INTERNAL_ERROR') as TestCaseStatus,
      errorMessage: `Execution infrastructure error: ${err.message}`
    }
  }
}

/**
 * Evaluates an entire test suite for an exercise using E2B Sandbox.
 * Allocates a single microVM for the submission to ensure clean isolation,
 * runs test cases with bounded execution, and cleanly terminates the sandbox in finally.
 */
export const executeTestSuite = async (
  params: ExecuteTestSuiteParams,
  e2bClient: IE2BClient = defaultE2BClient
): Promise<CodeExecutionResult> => {
  const { sourceCode, executionContract, testCases, timeLimit, memoryLimit, options } = params

  // 1. Guard against excessive test cases
  if (testCases.length > EXECUTION_LIMITS.MAX_TEST_CASES_COUNT) {
    return {
      status: 'INTERNAL_ERROR' as SubmissionStatus,
      passedTests: 0,
      totalTests: testCases.length,
      score: 0,
      maxScore: 100,
      totalExecutionTimeMs: 0,
      maxMemoryUsageKb: 0,
      results: [],
      infrastructureError: `Test case count (${testCases.length}) exceeds maximum limit (${EXECUTION_LIMITS.MAX_TEST_CASES_COUNT})`
    }
  }

  if (testCases.length === 0) {
    return {
      status: 'ACCEPTED' as SubmissionStatus,
      passedTests: 0,
      totalTests: 0,
      score: 100,
      maxScore: 100,
      totalExecutionTimeMs: 0,
      maxMemoryUsageKb: 0,
      results: []
    }
  }

  // 2. Validate function name identifier
  if (!executionContract || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(executionContract.functionName)) {
    return {
      status: 'INTERNAL_ERROR' as SubmissionStatus,
      passedTests: 0,
      totalTests: testCases.length,
      score: 0,
      maxScore: 100,
      totalExecutionTimeMs: 0,
      maxMemoryUsageKb: 0,
      results: [],
      infrastructureError: 'Invalid execution contract: functionName is malformed or missing'
    }
  }

  const limits = normalizeResourceLimits(timeLimit, memoryLimit)

  // 3. Build harnesses for all test cases
  const harnessItems = testCases.map((tc) => {
    const harness = buildJavaScriptHarness(sourceCode, executionContract, tc.input)
    return {
      harnessSource: harness.harnessSource,
      nonce: harness.nonce,
      timeLimitMs: limits.timeLimitMs
    }
  })

  let rawResponses: Array<{
    stdout: string
    stderr: string
    exitCode: number
    timedOut: boolean
    executionTimeMs: number
    error?: string
  }> = []

  try {
    // 4. Execute test suite inside E2B Sandbox with bounded concurrency
    await globalE2BSemaphore.acquire()
    try {
      rawResponses = await e2bClient.executeTestSuite(harnessItems, {
        stopOnFirstFailure: options?.stopOnFirstFailure
      })
    } finally {
      globalE2BSemaphore.release()
    }
  } catch (infraErr: any) {
    return {
      status: 'INTERNAL_ERROR' as SubmissionStatus,
      passedTests: 0,
      totalTests: testCases.length,
      score: 0,
      maxScore: 100,
      totalExecutionTimeMs: 0,
      maxMemoryUsageKb: 0,
      results: [],
      infrastructureError: `Execution infrastructure error: ${infraErr.message}`
    }
  }

  // 5. Evaluate results for each test case
  const results: TestCaseExecutionResult[] = []

  for (let i = 0; i < rawResponses.length; i++) {
    const tc = testCases[i]
    const harness = harnessItems[i]
    const resp = rawResponses[i]
    const executionTimeMs = resp.executionTimeMs

    if (resp.timedOut) {
      results.push({
        testCaseId: tc.testCaseId,
        order: tc.order ?? i,
        weight: tc.weight ?? 1,
        isHidden: tc.isHidden ?? false,
        status: 'TIME_LIMIT_EXCEEDED' as TestCaseStatus,
        executionTimeMs,
        errorMessage: 'Time limit exceeded during execution'
      })
      continue
    }

    if (resp.exitCode !== 0 && resp.stderr && /SyntaxError/i.test(resp.stderr)) {
      results.push({
        testCaseId: tc.testCaseId,
        order: tc.order ?? i,
        weight: tc.weight ?? 1,
        isHidden: tc.isHidden ?? false,
        status: 'COMPILATION_ERROR' as TestCaseStatus,
        executionTimeMs,
        errorMessage: resp.stderr.trim()
      })
      continue
    }

    if (resp.exitCode !== 0 && resp.stderr && /heap out of memory|allocation failed/i.test(resp.stderr)) {
      results.push({
        testCaseId: tc.testCaseId,
        order: tc.order ?? i,
        weight: tc.weight ?? 1,
        isHidden: tc.isHidden ?? false,
        status: 'MEMORY_LIMIT_EXCEEDED' as TestCaseStatus,
        executionTimeMs,
        errorMessage: 'Memory limit exceeded (heap allocation failed)'
      })
      continue
    }

    const payload = parseHarnessOutput(resp.stdout, harness.nonce)

    if (!payload) {
      results.push({
        testCaseId: tc.testCaseId,
        order: tc.order ?? i,
        weight: tc.weight ?? 1,
        isHidden: tc.isHidden ?? false,
        status: 'RUNTIME_ERROR' as TestCaseStatus,
        executionTimeMs,
        errorMessage: resp.stderr ? resp.stderr.trim() : 'Process terminated without returning valid grading markers'
      })
      continue
    }

    if (payload.error) {
      const isSyntax = payload.error.name === 'SyntaxError'
      results.push({
        testCaseId: tc.testCaseId,
        order: tc.order ?? i,
        weight: tc.weight ?? 1,
        isHidden: tc.isHidden ?? false,
        status: (isSyntax ? 'COMPILATION_ERROR' : 'RUNTIME_ERROR') as TestCaseStatus,
        executionTimeMs,
        stdout: payload.userStdout,
        errorMessage: `${payload.error.name}: ${payload.error.message}`
      })
      continue
    }

    if (!payload.hasReturned) {
      results.push({
        testCaseId: tc.testCaseId,
        order: tc.order ?? i,
        weight: tc.weight ?? 1,
        isHidden: tc.isHidden ?? false,
        status: 'FAILED' as TestCaseStatus,
        executionTimeMs,
        stdout: payload.userStdout,
        errorMessage: 'Function did not return a value'
      })
      continue
    }

    const comparison = compareOutputs(payload.returnValue, tc.expectedOutput)

    results.push({
      testCaseId: tc.testCaseId,
      order: tc.order ?? i,
      weight: tc.weight ?? 1,
      isHidden: tc.isHidden ?? false,
      status: (comparison.isEqual ? 'PASSED' : 'FAILED') as TestCaseStatus,
      executionTimeMs,
      actualOutput: payload.returnValue,
      expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
      stdout: payload.userStdout,
      comparisonReason: comparison.reason
    })
  }

  // 6. Calculate weighted scoring
  let passedWeight = 0
  let totalWeight = 0
  let totalExecutionTimeMs = 0
  let passedTests = 0

  for (const r of results) {
    const weight = r.weight || 1
    totalWeight += weight
    if (r.status === 'PASSED') {
      passedWeight += weight
      passedTests++
    }
    totalExecutionTimeMs += r.executionTimeMs || 0
  }

  const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0

  // 7. Determine aggregate submission status
  let aggregateStatus: SubmissionStatus

  const hasInternalError = results.some((r) => r.status === 'INTERNAL_ERROR')
  const hasCompilationError = results.some((r) => r.status === 'COMPILATION_ERROR')
  const hasTimeLimit = results.some((r) => r.status === 'TIME_LIMIT_EXCEEDED')
  const hasMemoryLimit = results.some((r) => r.status === 'MEMORY_LIMIT_EXCEEDED')
  const hasRuntimeError = results.some((r) => r.status === 'RUNTIME_ERROR')

  if (hasInternalError) {
    aggregateStatus = 'INTERNAL_ERROR'
  } else if (hasCompilationError) {
    aggregateStatus = 'COMPILATION_ERROR'
  } else if (passedTests === testCases.length) {
    aggregateStatus = 'ACCEPTED'
  } else if (hasTimeLimit) {
    aggregateStatus = 'TIME_LIMIT_EXCEEDED'
  } else if (hasMemoryLimit) {
    aggregateStatus = 'MEMORY_LIMIT_EXCEEDED'
  } else if (hasRuntimeError) {
    aggregateStatus = 'RUNTIME_ERROR'
  } else {
    aggregateStatus = 'WRONG_ANSWER'
  }

  const firstCompError = results.find((r) => r.status === 'COMPILATION_ERROR')
  const firstInfraError = results.find((r) => r.status === 'INTERNAL_ERROR')

  return {
    status: aggregateStatus,
    passedTests,
    totalTests: testCases.length,
    score,
    maxScore: 100,
    totalExecutionTimeMs,
    maxMemoryUsageKb: 0,
    results,
    compilationError: firstCompError?.errorMessage,
    infrastructureError: firstInfraError?.errorMessage
  }
}

/**
 * Validates a reference solution against all test cases.
 * Helper for Step 5 Teacher publishing workflow.
 */
export const verifyReferenceSolution = async (
  params: {
    sourceCode: string
    executionContract: ExecuteTestSuiteParams['executionContract']
    testCases: ExecuteTestSuiteParams['testCases']
    timeLimit?: number
    memoryLimit?: number
  },
  e2bClient: IE2BClient = defaultE2BClient
): Promise<{
  isValid: boolean
  passRate: number
  score: number
  result: CodeExecutionResult
}> => {
  const result = await executeTestSuite(
    {
      sourceCode: params.sourceCode,
      executionContract: params.executionContract,
      testCases: params.testCases,
      timeLimit: params.timeLimit,
      memoryLimit: params.memoryLimit
    },
    e2bClient
  )

  const isValid = result.status === 'ACCEPTED'
  const passRate = result.totalTests > 0 ? (result.passedTests / result.totalTests) * 100 : 0

  return {
    isValid,
    passRate,
    score: result.score,
    result
  }
}
