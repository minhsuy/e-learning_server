# TMDEMY — STEP 4: STUDENT EXECUTION & AUTO-GRADING ARCHITECTURE

## 1. Executive Summary

This document specifies the technical architecture and execution mechanics of **Step 4: Student Run, Submit & Auto-Grading APIs** for the TMdemy E-Learning Backend.

Step 4 bridges the coding exercise management layer (Step 2) and the isolated E2B cloud execution sandbox (Step 3) into an end-to-end, cheat-resistant, production-ready assessment pipeline for students.

```
+-----------------------------------------------------------------------------------------+
|                                    STUDENT WORKFLOW                                     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [Student Client]                                                                       |
|         |                                                                               |
|         +---> POST /api/coding-exercises/:id/run    (Practice: Public tests, Ephemeral)  |
|         |                                                                               |
|         +---> POST /api/coding-exercises/:id/submit (Official: All tests, Persisted)     |
|         |                                                                               |
|         +---> GET  /api/coding-exercises/:id/submissions             (Paginated list)   |
|         |                                                                               |
|         +---> GET  /api/coding-exercises/:id/submissions/:subId      (Redacted detail)  |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Layered Architecture & Component Interaction

The Step 4 implementation strictly adheres to TMdemy's mandatory layered architecture:

```
HTTP Request
  └── Router: src/routes/codingExercise.route.ts
        └── Middlewares:
              ├── verifyAccessToken (JWT parsing & user identity)
              ├── validateRouteUUIDParam (UUID format safety)
              ├── codingExerciseRateLimit (Sliding-window abuse prevention)
              └── Zod Middlewares (runCodeZodValidator, submitCodeZodValidator)
        └── Controller: src/controller/codingExercise.controller.ts
              └── Service: src/services/codingSubmission.service.ts
                    ├── Access Authorization: verifyStudentExerciseAccess
                    ├── Engine Orchestration: executeTestSuite via codeExecution.service.ts
                    └── Functional Repositories:
                          ├── codingExercise.repository.ts
                          ├── codingSubmission.repository.ts
                          ├── course.repository.ts
                          ├── lesson.repository.ts
                          └── enrollment.repository.ts
                                └── Prisma Client Singleton (PostgreSQL 16)
```

---

## 3. Student Authorization & Course Access Model

### 3.1 Course-Lesson-Exercise Hierarchy

The real relationships in TMdemy PostgreSQL schema are:
```
User (Student) ──[Enrollment (status=ACTIVE)]──> Course
                                                   │
                                                   ├── Chapter
                                                         │
                                                         └── Lesson (isDemo: boolean)
                                                               │
                                                               └── CodingExercise (status: PUBLISHED)
                                                                     │
                                                                     └── CodingExerciseRevision (isPublished: true)
                                                                           │
                                                                           └── CodingTestCase (isHidden: boolean)
```

### 3.2 Access Verification Rules (`verifyStudentExerciseAccess`)

Before any code execution (practice or official), the system enforces:

1. **UUID Integrity**: Rejects malformed IDs immediately (`400 Bad Request`).
2. **Exercise Existence & Status**: 
   - Exercise must exist in PostgreSQL.
   - For students (`role: USER`), if `status !== 'PUBLISHED'`, the endpoint responds with **`404 Not Found`** instead of `403 Forbidden`. This strictly prevents information leakage regarding the existence of draft or unreleased exercises.
3. **Lesson Demo Exemption**:
   - If `lesson.isDemo === true`, any authenticated user is granted access without requiring a course enrollment.
4. **Course Enrollment Verification**:
   - If `lesson.isDemo === false` and `role === USER`, the student must have an `ACTIVE` enrollment in `exercise.courseId`. If not found, returns **`403 Forbidden`** (`You are not enrolled in this course`).
5. **Teacher / Admin Access**:
   - Instructors who authored the course have full access. Non-author teachers must be enrolled or accessing a demo lesson. Admins have global access.
6. **Active Revision Resolution**:
   - The exercise must have at least one revision marked `isPublished: true`. If no published revision exists, returns **`404 Not Found`** (`No published revision available for this exercise`).

---

## 4. Execution Workflow 1: RUN Code (Practice Mode)

`POST /api/coding-exercises/:id/run`

### 4.1 Characteristics
- **Ephemeral**: Never creates `CodingSubmission` or `CodingTestResult` database records.
- **Zero Progress Side-Effects**: Does not alter user course progress, certificate eligibility, or leaderboard standings.
- **Public Tests Only**: Fetches strictly public test cases (`isHidden: false`) sorted by `order ASC`.
- **Zero Public Tests Protection**: If an exercise author configured only hidden test cases, RUN returns status `NO_TEST_CASES` with `score: 0`, explicitly avoiding a misleading `ACCEPTED (100%)`.

### 4.2 RUN Execution Flow Diagram
```
Client Request
      │
      ▼
verifyAccessToken ──> 401 if missing/invalid
      │
      ▼
Rate Limiter (10 req/min) ──> 429 if exceeded
      │
      ▼
verifyStudentExerciseAccess ──> 404 (DRAFT/Archived) / 403 (No Enrollment)
      │
      ▼
Fetch Public Tests (isHidden: false)
      │
      ├── If count == 0 ──> Return { status: 'NO_TEST_CASES', score: 0, results: [] }
      │
      ▼
executeTestSuite() [E2B Cloud Sandbox]
      │
      ▼
Return Sanitized Public Results (200 OK)
[NO DATABASE WRITES PERFORMED]
```

---

## 5. Execution Workflow 2: SUBMIT Code (Official Grading)

`POST /api/coding-exercises/:id/submit`

### 5.1 Non-Negotiable Constraint: Decoupled Cloud Execution
> [!CRITICAL]
> **Database transactions must NEVER wrap E2B cloud calls.**
> Cloud sandbox execution takes 1.5–4.0 seconds. Holding an active PostgreSQL transaction open across external network calls causes connection pool exhaustion, database deadlocks, and severe latency cascading under load.

### 5.2 Four-Stage Submission Lifecycle
```
[STAGE 1: DB INSERT PENDING]
   │  - Insert CodingSubmission record (status: PENDING, score: 0)
   │  - Links submission to specific published revisionId
   │
   ▼
[STAGE 2: CLOUD EXECUTION OUTSIDE DB TRANSACTION]
   │  - Execute ALL test cases (public + hidden) inside E2B Sandbox
   │  - Sandbox microVM is deterministically terminated in `finally`
   │
   ▼
[STAGE 3: DB FINALIZE ATOMIC TRANSACTION]
   │  - Short Prisma transaction ($transaction, ~5ms):
   │      a. Update CodingSubmission (status, score, passedTests, executionTime, etc.)
   │      b. createMany CodingTestResult rows
   │
   ▼
[STAGE 4: SERVER-SIDE DTO REDACTION]
      - Project results through student safe view (strip hidden inputs/outputs/errors)
      - Return 201 Created to student
```

### 5.3 Resilience Against Infrastructure Failures
If E2B fails (e.g. `ECONNREFUSED`, E2B service outage, network partition):
- The submission status in PostgreSQL is transitioned to **`INTERNAL_ERROR`**.
- The student's code is **NEVER marked as `WRONG_ANSWER`**.
- The student is **NOT awarded a false 0% score** as if they wrote faulty logic.
- An informative, retryable error message is returned (`Grading infrastructure temporarily unavailable. Please re-submit shortly.`).

---

## 6. Anti-Cheat & Sensitive Data Redaction

### 6.1 Threat Model
Students inspect browser network tabs, devtools, and JSON responses to reverse-engineer hidden grading test cases or discover reference solutions.

### 6.2 Server-Side Projection Boundary
Redaction is enforced exclusively in the backend Service layer (`codingSubmission.service.ts`) before any payload reaches the Controller or HTTP Transport:

| Field | Public Test Case (`isHidden: false`) | Hidden Test Case (`isHidden: true`) |
| :--- | :---: | :---: |
| `testCaseId` | ✅ Returned | ✅ Returned |
| `order` | ✅ Returned | ✅ Returned |
| `weight` | ✅ Returned | ✅ Returned |
| `isHidden` | `false` | `true` |
| `status` | `PASSED` / `FAILED` | `PASSED` / `FAILED` |
| `executionTimeMs` | ✅ Returned | ✅ Returned |
| `input` | ✅ Plain JSON | ❌ **STRICTLY STRIPPED (`undefined`)** |
| `expectedOutput` | ✅ Plain JSON | ❌ **STRICTLY STRIPPED (`undefined`)** |
| `actualOutput` | ✅ Output value | ❌ **STRICTLY STRIPPED (`undefined`)** |
| `stdout` | ✅ Student console logs | ❌ **STRICTLY STRIPPED (`undefined`)** |
| `errorMessage` | ✅ Sanitized error | ❌ **STRICTLY STRIPPED (`undefined`)** |
| `comparisonReason`| ✅ Comparison diff | ❌ **STRICTLY STRIPPED (`undefined`)** |

In submission history (`GET /api/coding-exercises/:id/submissions`), `sourceCode` is omitted from the list items to optimize network payload and prevent accidental code leaks in list views.

---

## 7. Cloud Sandbox Protection & Rate Limiting

E2B cloud sandboxes consume computational credits. To protect against malicious or accidental spamming, application-level sliding-window rate limiters are applied:

1. **RUN Limiter**:
   - Limit: **10 requests per minute** per authenticated student UUID.
   - HTTP Response: `429 Too Many Requests` with `Retry-After` header.
2. **SUBMIT Limiter**:
   - Limit: **5 requests per minute** per authenticated student UUID.
   - HTTP Response: `429 Too Many Requests` with `Retry-After` header.
3. **Memory Eviction**:
   - A sliding-window bucket tracks timestamps. A background timer prunes expired entries every 2 minutes, preventing memory leaks in long-running processes.
4. **Source Code Bounds**:
   - Max source code size: **64 KB** (`EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES`).
   - Max stdout buffer: **16 KB** (`EXECUTION_LIMITS.MAX_STDOUT_CAPTURE_BYTES`).
   - Execution timeout: Default **2000 ms**, ceiling **10,000 ms**.
