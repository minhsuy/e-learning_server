# TMDEMY — STEP 3: CODE EXECUTION ENGINE TECHNICAL CONTRACT (E2B SANDBOX EDITION)

**Module**: Coding Exercise Code Execution Engine & E2B Cloud MicroVM Sandbox  
**File**: `docs/coding-exercise/STEP_03_EXECUTION_CONTRACT.md`  
**Target Consumer**: Step 4 (Student Run & Submit APIs), Step 5 (Teacher Verification Workflow)  
**Status**: APPROVED & IMPLEMENTED (MIGRATED TO E2B)  

---

## 1. Overview & Architecture

The **Code Execution Engine** is a headless, decoupled execution and evaluation service within the TMDEMY Backend. It accepts untrusted user-submitted source code, executes it inside an isolated **E2B Firecracker MicroVM cloud sandbox**, intercepts outputs through a delimiter-based JavaScript harness, evaluates actual returns against expected test outputs, and produces normalized grading metrics.

```text
TMdemy Express Backend (Trusted Host)
   │
   │  1. executeTestSuite({ sourceCode, contract, testCases, limits })
   ▼
CodeExecutionService (src/services/codeExecution.service.ts)
   │
   │  2. buildJavaScriptHarness() [Embeds 128-bit UUID Nonce & Input Args]
   ▼
JavaScript Harness Builder (src/integrations/e2b/javascriptHarness.ts)
   │
   │  3. Writes /tmp/tmdemy_<nonce>.js to Sandbox Filesystem
   ▼
E2B Execution Adapter (src/integrations/e2b/e2b.client.ts)
   │
   │  4. Runs `node /tmp/tmdemy_<nonce>.js` (Isolated MicroVM, timeoutMs)
   ▼
E2B Sandbox MicroVM (Firecracker cloud container)
   │
   │  5. Collects stdout, stderr, exitCode, executionTimeMs
   ▼
E2B Execution Adapter
   │
   │  6. Finally: sandbox.kill() [Deterministic microVM cleanup]
   ▼
Harness Output Parser (src/integrations/e2b/javascriptHarness.ts)
   │
   │  7. parseHarnessOutput(stdout, nonce) [Extracts verified JSON payload]
   ▼
Result Normalizer & Comparator (src/integrations/e2b/resultComparator.ts)
   │
   │  8. Deep Structural Comparison & Weighted Scoring
   ▼
Structured CodeExecutionResult (src/models/codeExecution.model.ts)
```

---

## 2. Function Execution Contract

The execution contract specifies the function signature expected by the exercise. It is defined in `executionContract` on the `CodingExercise` / `CodingExerciseRevision` database models.

```typescript
export interface ExecutionContractParameter {
  name: string // Valid JS identifier: ^[a-zA-Z_$][a-zA-Z0-9_$]*$
  type: string // "number", "string", "boolean", "number[]", "object", etc.
}

export interface ExecutionContract {
  functionName: string // Target function name, e.g. "sumToN"
  parameters: ExecutionContractParameter[]
  returnType: string // Expected return type, e.g. "number"
}
```

### Execution Semantics:
- The student's code is assumed to declare a function matching `functionName` (e.g. `function sumToN(n) { ... }` or `const sumToN = (n) => { ... }`).
- The test case provides an array of arguments in `input` (e.g. `[5]`).
- The harness calls `targetFn(...input)` using spread arguments.
- Grading evaluates the **actual return value** of the function, NOT `console.log()` stdout.

---

## 3. JavaScript Harness & Nonce-Delimited Protocol

The harness is constructed dynamically by `buildJavaScriptHarness(sourceCode, executionContract, testInputs)`.

### 3.1. Cryptographic Nonce Delimiters
A unique 128-bit UUID (`crypto.randomUUID()`) is generated for every single test case submission. The harness outputs its result strictly between:
```text
__TM_GRADING_RESULT_START__<nonce>__
{"success":true,"hasReturned":true,"returnValue":15,"userStdout":"..."}
__TM_GRADING_RESULT_END__<nonce>__
```
The student code running inside the sandbox cannot predict this `<nonce>`.

### 3.2. Console & Stdout Interception
To prevent student `console.log()` statements from corrupting or forging the grading protocol:
1. `process.stdout.write` and `console.log/info/warn/error` are hijacked before student code runs.
2. User output is captured into an in-memory buffer (`userStdout`) capped at `16,384` bytes (16 KB) with truncation warnings to prevent memory exhaustion attacks.
3. Only the harness runner uses the original unhooked stdout write function to output the final result payload.
4. `process.exit(code)` is overridden to throw a runtime error, preventing student code from exiting prematurely before the harness reports grading results.

### 3.3. Zero Secrets in Sandbox
**Critical Security Guarantee**: Hidden `expectedOutput` values and reference solutions are **NEVER** included in the harness code or sent to the E2B Sandbox. The sandbox only knows the student's code and the input arguments. Comparison happens exclusively on the trusted backend host.

### 3.4. Special Value Serialization
JavaScript allows values that do not natively serialize to standard JSON (`undefined`, `NaN`, `Infinity`, `-Infinity`, `BigInt`, circular objects). The harness serializes these safely:
- `undefined` $\rightarrow$ `{ "__specialType": "undefined" }`
- `NaN` $\rightarrow$ `{ "__specialType": "nan" }`
- `Infinity` $\rightarrow$ `{ "__specialType": "infinity" }`
- `-Infinity` $\rightarrow$ `{ "__specialType": "-infinity" }`
- `BigInt(123)` $\rightarrow$ `{ "__specialType": "bigint", "value": "123" }`
- Circular objects $\rightarrow$ Caught by harness `try/catch` as `TypeError` without crashing the grading protocol.

---

## 4. Output Comparison Rules (`resultComparator.ts`)

The comparator function `compareOutputs(actual, expected, options)` evaluates whether the actual return matches the expected output.

```typescript
export interface ComparisonOptions {
  floatTolerance?: number // Default: 1e-7
}

export interface ComparisonResult {
  isEqual: boolean
  reason?: string
}
```

### 4.1. Supported Types & Comparison Logic
1. **Numbers**:
   - Compares with tolerance `floatTolerance = 1e-7`.
   - `|actual - expected| <= 1e-7` $\rightarrow$ `isEqual: true`.
   - `0.1 + 0.2` strictly equals `0.3`.
   - `NaN` equals `NaN`. `Infinity` equals `Infinity`.
2. **Strings & Booleans**:
   - Strict equality (`===`).
   - Rejects type coercion: `"15"` does NOT equal `15`. `true` does NOT equal `1`.
3. **Null vs Undefined**:
   - `null === null` $\rightarrow$ true.
   - `undefined === undefined` $\rightarrow$ true.
   - `null !== undefined` $\rightarrow$ false.
4. **Arrays**:
   - Order-sensitive: `[1, 2]` does NOT equal `[2, 1]`.
   - Validates `actual.length === expected.length`.
   - Recursively compares elements index-by-index.
5. **Plain Objects**:
   - Structural deep comparison, **key insertion order independent**:
     `{ a: 1, b: 2 }` equals `{ b: 2, a: 1 }`.
   - Validates key sets match, then recursively compares values for every key.

---

## 5. E2B Sandbox Integration (`e2b.client.ts`)

The backend interfaces with the E2B Sandbox platform via the official `@e2b/sdk` (`e2b` npm package).

### 5.1. Execution Flow & MicroVM Lifecycle
1. **Sandbox Allocation**: A dedicated microVM is allocated per submission via `Sandbox.create()`.
2. **Harness Staging**: Source code with embedded nonce delimiters is written to `/tmp/tmdemy_<nonce>.js` via `sandbox.files.write()`.
3. **Command Execution**: Code is executed inside the sandbox via `sandbox.commands.run('node /tmp/tmdemy_<nonce>.js', { timeoutMs, envs: {} })`.
4. **Environment Isolation**: No backend host environment variables or API keys are injected into the sandbox command (`envs: {}`).
5. **Deterministic Cleanup**: The microVM is terminated in the `finally` block via `sandbox.kill()`, regardless of success, runtime exception, or timeout.

### 5.2. E2B Error & Exit Code Mapping to Platform Enums

| Execution Event | E2B Response / Signal | `TestCaseStatus` (Prisma) | `SubmissionStatus` (Prisma) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Normal Completion** | `exitCode === 0` && Valid Delimiters | `PASSED` / `FAILED` | `ACCEPTED` / `WRONG_ANSWER` | Output evaluated via Result Comparator |
| **Timeout / Deadline** | `TimeoutError` or exit code `124` | `TIME_LIMIT_EXCEEDED` | `TIME_LIMIT_EXCEEDED` | Exceeded `commandTimeoutMs` |
| **Syntax Error** | `exitCode !== 0` && `SyntaxError` in stderr | `COMPILATION_ERROR` | `COMPILATION_ERROR` | Evaluated before code execution begins |
| **Runtime Exception** | `exitCode !== 0` && Uncaught Exception | `RUNTIME_ERROR` | `RUNTIME_ERROR` | `TypeError`, `RangeError`, `ReferenceError`, etc. |
| **Process Killed / OOM** | Process terminated by SIGKILL (`exitCode: 137`) | `MEMORY_LIMIT_EXCEEDED` / `RUNTIME_ERROR` | `MEMORY_LIMIT_EXCEEDED` / `RUNTIME_ERROR` | Memory threshold exceeded or out of memory |
| **Sandbox Failure / Network** | `E2BError` (HTTP 401, 500, network drop) | `INTERNAL_ERROR` | `INTERNAL_ERROR` | Infrastructure failure; student is never penalized |

---

## 6. Scoring Strategy & Aggregation

### 6.1. Formula
Each test case possesses an integer `weight` (default 1).
$$\text{passedWeight} = \sum_{tc \in \text{PassedTests}} tc.\text{weight}$$
$$\text{totalWeight} = \sum_{tc \in \text{AllTests}} tc.\text{weight}$$
$$\text{Score} = \text{round}\left(100 \times \frac{\text{passedWeight}}{\text{totalWeight}}\right)$$

### 6.2. Status Precedence
1. `INTERNAL_ERROR`: Triggered if E2B cloud API is unreachable or returns an infrastructure failure. (Infrastructure errors are never blamed on the student).
2. `COMPILATION_ERROR`: Triggered if student source code has a syntax error.
3. `ACCEPTED`: Triggered ONLY when 100% of test cases pass.
4. `TIME_LIMIT_EXCEEDED`: Triggered if any test case timed out.
5. `MEMORY_LIMIT_EXCEEDED`: Triggered if any test case exceeded memory.
6. `RUNTIME_ERROR`: Triggered if any test case threw an unhandled exception.
7. `WRONG_ANSWER`: Triggered if all tests finished within limits, but one or more returned wrong outputs.

---

## 7. Data Contracts & TypeScript Interfaces

### 7.1. Single Test Case Input & Result
```typescript
export interface TestCaseExecutionInput {
  testCaseId?: string
  input: unknown[]
  expectedOutput: unknown
  isHidden?: boolean
  order?: number
  weight?: number
}

export interface TestCaseExecutionResult {
  testCaseId?: string
  order: number
  weight: number
  isHidden: boolean
  status: 'PASSED' | 'FAILED' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'INTERNAL_ERROR'
  executionTimeMs?: number
  memoryUsageKb?: number
  actualOutput?: unknown
  expectedOutput?: unknown // Stripped for hidden test cases when serving students
  stdout?: string          // User console logs
  errorMessage?: string
  comparisonReason?: string
}
```

### 7.2. Aggregate Test Suite Result
```typescript
export interface CodeExecutionResult {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'INTERNAL_ERROR'
  passedTests: number
  totalTests: number
  score: number          // 0 to 100
  maxScore: number       // Always 100
  totalExecutionTimeMs: number
  maxMemoryUsageKb: number
  results: TestCaseExecutionResult[]
  compilationError?: string
  infrastructureError?: string
}
```

---

## 8. Service API (How Step 4 Consumes the Engine)

In Step 4 (`POST /api/coding-exercises/:id/run` and `POST /api/coding-exercises/:id/submit`), controllers and services invoke `executeTestSuite` directly:

### 8.1. Example: Evaluating a Submission in Step 4
```typescript
import { executeTestSuite } from '~/services/codeExecution.service'

const executionResult = await executeTestSuite({
  sourceCode: studentCode,
  executionContract: exercise.executionContract,
  testCases: exercise.testCases.map((tc) => ({
    testCaseId: tc.id,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isHidden: tc.isHidden,
    order: tc.order,
    weight: tc.weight
  })),
  timeLimit: exercise.timeLimit,
  memoryLimit: exercise.memoryLimit,
  options: {
    maxConcurrency: 3,        // Evaluates 3 test cases concurrently
    stopOnFirstFailure: false // Evaluates all tests to compute partial score
  }
})

// executionResult.status  -> "ACCEPTED", "WRONG_ANSWER", etc.
// executionResult.score   -> 80
// executionResult.results -> Individual test case metrics
```

### 8.2. Example: Running Sample Tests (`/run`)
For the `/run` endpoint, only public test cases (`isHidden: false`) are passed:
```typescript
const runResult = await executeTestSuite({
  sourceCode: studentCode,
  executionContract: exercise.executionContract,
  testCases: publicTestCases,
  timeLimit: exercise.timeLimit,
  memoryLimit: exercise.memoryLimit
})
```

---

## 9. Example Execution Outputs

### Example 9.1: Successful Execution (`ACCEPTED`)
```json
{
  "status": "ACCEPTED",
  "passedTests": 2,
  "totalTests": 2,
  "score": 100,
  "maxScore": 100,
  "totalExecutionTimeMs": 45,
  "maxMemoryUsageKb": 18240,
  "results": [
    {
      "testCaseId": "e45ba05b-81d9-436f-bfe1-953b0f55d045",
      "order": 0,
      "weight": 30,
      "isHidden": false,
      "status": "PASSED",
      "executionTimeMs": 20,
      "memoryUsageKb": 17800,
      "actualOutput": 15,
      "expectedOutput": 15,
      "stdout": "Calculating sum for n=5\n"
    },
    {
      "testCaseId": "fc4d96ab-c2d7-4009-8488-874b5c73cbe1",
      "order": 1,
      "weight": 70,
      "isHidden": true,
      "status": "PASSED",
      "executionTimeMs": 25,
      "memoryUsageKb": 18240,
      "actualOutput": 55,
      "stdout": ""
    }
  ]
}
```

### Example 9.2: Logic Failure (`WRONG_ANSWER`)
```json
{
  "status": "WRONG_ANSWER",
  "passedTests": 1,
  "totalTests": 2,
  "score": 30,
  "maxScore": 100,
  "totalExecutionTimeMs": 38,
  "maxMemoryUsageKb": 17500,
  "results": [
    {
      "order": 0,
      "weight": 30,
      "status": "PASSED",
      "actualOutput": 1,
      "expectedOutput": 1
    },
    {
      "order": 1,
      "weight": 70,
      "status": "FAILED",
      "actualOutput": 5,
      "expectedOutput": 15,
      "comparisonReason": "Expected 15, but received 5"
    }
  ]
}
```

### Example 9.3: Infrastructure Unavailable (`INTERNAL_ERROR`)
```json
{
  "status": "INTERNAL_ERROR",
  "passedTests": 0,
  "totalTests": 2,
  "score": 0,
  "maxScore": 100,
  "totalExecutionTimeMs": 0,
  "maxMemoryUsageKb": 0,
  "results": [],
  "infrastructureError": "Execution infrastructure error: Failed to create E2B sandbox instance: 401 Unauthorized"
}
```
