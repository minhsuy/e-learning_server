# STEP 7C — AI ASSESSMENT BACKEND INTEGRATION REPORT

**Project**: TMdemy E-learning Platform  
**Architecture**: Node.js / Express / TypeScript / PostgreSQL / Prisma ORM / Zod / FastAPI (Python)  
**Date**: 2026-10-26  
**Status**: COMPLETED (30/30 Test Scenarios Passed, 100% Success Rate)  

---

## 1. Executive Summary

Step 7C successfully bridges the TMdemy Node.js backend with the Python FastAPI AI Assessment microservice, integrating automated assessment generation directly into the teacher course authoring workflow:
- **Step 7A Quiz Generation**: Automated multiple-choice quiz creation derived from canonical lesson transcript and summary via `POST /api/v1/quiz/generate` (Gemini 3.5 Flash).
- **Step 7B Coding Exercise Generation**: Automated programming exercise creation with execution contracts, starter code, reference solutions, and test cases via `POST /api/v1/coding-exercises/generate`.
- **E2B Sandbox Verification**: Automated isolated sandbox execution of generated reference solutions against both public and hidden test cases before teacher review.
- **Strict Revision & Submission Protection**: Full compliance with physical schema constraints—protecting existing student quiz submissions and preserving coding exercise historical submission test cases via immutable revisions.

The integration was achieved with **zero modifications** to the Python FastAPI microservice, **zero modifications** to the physical Prisma database schema, and **zero regression** across existing endpoints.

---

## 2. Existing Backend Audit

Prior to implementation, a comprehensive audit of the backend repository (`d:\e-learning-project\e-learning_server`) was performed:

| Architectural Component | Existing Implementation / Observation | Constraints & Decisions for Step 7C |
| :--- | :--- | :--- |
| **Quiz Module** | `Quiz` model has `@unique` on `lessonId`. Strictly one quiz per lesson. `Quiz` does not have a `status` or `isPublished` column. `Question.answer` stores the text of the correct option. Grading compares `question.answer === ans.selectedAnswer`. | AI quiz generation cannot create multiple quizzes per lesson. If a quiz already has student submissions (`QuizSubmission`), overwriting is strictly blocked (`409 Conflict`). If no submissions exist, overwriting requires explicit confirmation (`confirmOverwrite: true`). A `previewOnly: true` mode allows teachers to preview questions, options, and explanations without persisting to the database. |
| **Coding Exercise Module** | `CodingExercise` has `status: ExerciseStatus` (`DRAFT`, `PUBLISHED`, `ARCHIVED`) and `source: ExerciseSource` (`MANUAL`, `AI`). Versioning is managed through immutable `CodingExerciseRevision` (`version: 1, 2, ...`). Test cases belong to a specific revision. | Never bypass revision management. Reused `createCodingExerciseService` and `updateCodingExerciseService`. AI generated exercises default to `DRAFT` status and `isPublished: false`. Published exercises with submissions receive a new draft revision `v(N+1)`, preserving historical test cases and submissions. |
| **Lesson AI Content** | `Lesson` stores `transcript`, `transcriptOriginal`, `transcriptRefined`, and `summary`. Handled in Step 6.5 and Step 6.7. | Pre-resolution hierarchy: `transcriptRefined` (preferred) -> `transcriptOriginal` -> `transcript`. Summary is provided as supporting context. Generation is rejected (`400 Bad Request`) if content is missing or shorter than 50 characters. Untrusted client-supplied transcripts are rejected. |
| **E2B Code Execution** | Isolated sandbox execution implemented in `src/integrations/e2b/e2b.client.ts` with JavaScript harness (`src/services/javascriptHarness.ts`). Uses cryptographic nonces and structured output markers. | Reused the existing E2B client to execute reference solutions against public and hidden test cases. Status is marked `VERIFIED` only on 100% pass rate. Failed verification marks `FAILED` with failure details. If E2B sandbox is offline, marks `UNVERIFIED` without executing code on the Node.js host. |
| **FastAPI Client** | `src/services/aiServiceClient.service.ts` configured with `AI_SERVICE_BASE_URL` (`http://127.0.0.1:8000`) and `AI_SERVICE_API_KEY`. | Extended the client with typed Zod request/response schemas for Step 7A (`generateQuizFromAI`) and Step 7B (`generateCodingExerciseFromAI`). Added bounded timeouts, transient error classification, and retry policies. |

---

## 3. Actual Prisma Schema Mapping

Physical schema boundaries from `prisma/schema.prisma` were strictly preserved:

### 3.1 Quiz & Question Models
```prisma
model Quiz {
  id          String           @id @default(uuid())
  lessonId    String           @unique
  title       String           @db.VarChar(255)
  lesson      Lesson           @relation(...)
  questions   Question[]
  submissions QuizSubmission[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model Question {
  id        String           @id @default(uuid())
  quizId    String
  title     String           @db.VarChar(500)
  answer    String           @db.VarChar(500) // Correct answer text
  quiz      Quiz             @relation(...)
  options   QuestionOption[]
}

model QuestionOption {
  id         String   @id @default(uuid())
  questionId String
  title      String   @db.VarChar(500)
  question   Question @relation(...)
}
```
*Note on AI-generated fields*: Python AI produces `explanation`, `difficulty`, and `sourceTimestamp`. Because `Question` does NOT have columns for these fields, they are returned in the response metadata / teacher review preview rather than inventing unapproved Prisma schema columns.

### 3.2 Coding Exercise Models
```prisma
model CodingExercise {
  id          String                   @id @default(uuid())
  lessonId    String
  courseId    String
  title       String                   @db.VarChar(255)
  slug        String                   @db.VarChar(255)
  status      ExerciseStatus           @default(DRAFT)
  source      ExerciseSource           @default(MANUAL)
  revisions   CodingExerciseRevision[]
  submissions CodingSubmission[]
}

model CodingExerciseRevision {
  id                String            @id @default(uuid())
  exerciseId        String
  version           Int
  isPublished       Boolean           @default(false)
  language          String            @db.VarChar(50)
  difficulty        ExerciseDifficulty @default(EASY)
  starterCode       String            @db.Text
  referenceSolution String?           @db.Text
  executionContract Json              @db.JsonB
  testCases         CodingTestCase[]
}
```

---

## 4. Quiz Generation Integration

### 4.1 Flow
```text
POST /api/lessons/:id/ai-quiz/generate
  └── Teacher / Admin Authorization (course.authorId === user.id)
  └── Content Resolution (Lesson transcriptRefined >= 50 chars)
  └── Submissions & Conflict Check (Quiz exists? Submissions exist?)
  └── Call FastAPI POST /api/v1/quiz/generate (Gemini 3.5 Flash)
  └── Zod Schema Runtime Validation (Single choice, exactly 4 options, exactly 1 correct)
  └── If previewOnly: true -> Return preview payload with explanations
  └── If persisted -> Prisma Transaction ($transaction):
        ├── Create Quiz record
        ├── Create Question records (answer = correct option text)
        └── Create QuestionOption records (title = option text)
  └── Return 201 Created with withCompatId() compatibility
```

### 4.2 Grading Compatibility
Grading logic in `src/services/quizSubmission.service.ts` verifies:
```typescript
const isCorrect = question.answer === ans.selectedAnswer
```
Step 7C maps the AI generated correct option string directly into `question.answer`, ensuring 100% compatibility with existing grading and XP calculations.

---

## 5. Coding Exercise Generation Integration

### 5.1 Flow
```text
POST /api/lessons/:id/ai-coding-exercise/generate
  └── Teacher / Admin Authorization
  └── Content Resolution (Transcript >= 50 chars)
  └── Call FastAPI POST /api/v1/coding-exercises/generate
  └── Zod Runtime Validation (Execution contract, starterCode, testCases)
  └── Positional Argument & Types Alignment Validation
  └── E2B Sandbox Verification (Execute reference solution in isolated VM)
  └── If previewOnly: true -> Return exercise preview + verification details
  └── If persisted:
        ├── Call createCodingExerciseService / updateCodingExerciseService
        ├── Persist as status: DRAFT, isPublished: false, source: AI
        └── Persist public & hidden test cases under Revision v1 (or v(N+1))
  └── Return 201 Created with verification metadata
```

### 5.2 Positional Argument Alignment
Step 7C verifies that every test case inputs map directly to parameter positions defined in `executionContract.parameters` (e.g. `param[0].name === inputs[0].name`).

---

## 6. FastAPI HTTP Client Changes

Enhanced `src/services/aiServiceClient.service.ts`:
- **Zod Schemas**: Added full schemas for Step 7A and Step 7B requests and responses (`fastApiQuizGenerateResponseSchema`, `fastApiCodingExerciseGenerateResponseSchema`).
- **Synchronous & Asynchronous Support**:
  - `generateQuizFromAI(payload, { asyncMode, timeoutMs })`: Direct call with 60-second bounded timeout or job dispatch.
  - `generateCodingExerciseFromAI(payload, { asyncMode, timeoutMs })`: Direct call with 90-second bounded timeout or job dispatch.
- **Error Normalization**: Maps FastAPI 422 validation errors, 429 rate limits, and 504 timeouts into standardized application errors without exposing raw internal stack traces.

---

## 7. Lesson Content Resolution

Implemented in `resolveLessonAiContentAndAuth` (`src/services/aiAssessment.service.ts`):
1. **Validation**: UUID validity checked via RFC 4122.
2. **Authorization**:
   - `ADMIN` role is granted access across all lessons.
   - `TEACHER` must own the parent course (`course.authorId === user.id`).
   - `USER` (students) or non-owner teachers are rejected with `403 Forbidden`.
3. **Canonical Transcript Priority**:
   ```typescript
   const transcript = lesson.transcriptRefined || lesson.transcriptOriginal || lesson.transcript || ''
   ```
4. **Validation Guard**: Requires `transcript.trim().length >= 50`. Shorter transcripts return `400 Bad Request` ("Bài học chưa có nội dung phụ đề đủ dài để sinh bài đánh giá").

---

## 8. Authorization and Security

- **Student Protection**: Generation routes are protected by `authenticateToken` + `authorizeTeacherOrAdmin`.
- **Anti-Leak Policy**:
  - Students accessing published coding exercises via `GET /api/coding-exercises/lesson/:lessonId` receive only public test cases (`isPublic: true`).
  - `referenceSolution` is strictly omitted from student responses.
- **No Untrusted Execution on Host**: Generated Python/JavaScript reference solutions are executed **only** inside isolated E2B microVMs or mocked test harnesses, never on the Node.js Express process.

---

## 9. Quiz Conflict & Draft Strategy

Because `Quiz` has `lessonId` `@unique` and lacks a physical draft column:
1. **No Existing Quiz**: Creates the quiz and its questions atomically.
2. **Existing Quiz WITH Submissions**: Rejects overwrite with `409 Conflict` ("Bài học đã có Quiz và đã có học viên nộp bài. Không thể ghi đè để bảo vệ kết quả học tập").
3. **Existing Quiz WITHOUT Submissions**:
   - If `confirmOverwrite: false` -> Returns `409 Conflict` requiring explicit confirmation.
   - If `confirmOverwrite: true` -> Deletes previous quiz and creates new quiz in a single Prisma transaction.
4. **Preview Mode**: Teachers can supply `previewOnly: true` at any time to inspect questions and explanations without touching the database.

---

## 10. Coding Exercise Revision Strategy

Step 7C integrates seamlessly with the existing multi-revision engine:
- **First Generation**: Creates `CodingExercise` with `status: DRAFT`, `source: AI`, and `CodingExerciseRevision` `version: 1` (`isPublished: false`).
- **Subsequent Edits on Unpublished Draft**: Updates Revision v1 in-place.
- **Generation When Published / Has Submissions**: Calling `updateCodingExerciseService` creates a new Revision `v(N+1)` at `isPublished: false`.
- **Historical Submissions**: Submissions retain their foreign key link to `revisionId`, ensuring past code runs against the exact test cases active at submission time.

---

## 11. E2B Verification Results

Implemented `verifyReferenceSolution`:
- Creates isolated code runner using `runJavascriptCode` and `executeTestCasesInVm`.
- Runs reference solution against 100% of generated public and hidden test cases.
- **Results Handling**:
  - All tests pass: `verification.status = 'VERIFIED'` (Pass rate: 100%).
  - Any test fails or throws runtime error: `verification.status = 'FAILED'`, details returned to teacher.
  - E2B API Key missing or sandbox offline: `verification.status = 'UNVERIFIED'`, no execution on host, requires manual teacher test.

---

## 12. New and Modified Files

### New Files
1. `src/models/aiAssessment.model.ts`: Zod domain schemas for assessment requests, options, execution contracts, and preview responses.
2. `src/services/aiAssessment.service.ts`: Core assessment orchestration service (auth, transcript resolution, FastAPI dispatch, E2B verification, revision mapping, Prisma transactions).
3. `src/controller/aiAssessment.controller.ts`: Express controllers (`generateAiQuizController`, `generateAiCodingExerciseController`).
4. `src/middlewares/aiAssessment.middleware.ts`: Express Validator chains and UUID route parameter validation.
5. `scripts/test_step7c_ai_assessment_integration.ts`: Comprehensive 30-scenario test suite.
6. `docs/STEP_7C_AI_ASSESSMENT_BACKEND_INTEGRATION_REPORT.md`: This comprehensive technical report.

### Modified Files
1. `src/services/aiServiceClient.service.ts`: Added Step 7A/7B schemas, `generateQuizFromAI`, and `generateCodingExerciseFromAI`.
2. `src/routes/lesson.route.ts`: Registered routes:
   - `POST /api/lessons/:id/ai-quiz/generate` (and alias `:lessonId`)
   - `POST /api/lessons/:id/ai-coding-exercise/generate` (and alias `:lessonId`)
3. `docs/api/LESSON_API.md`: Documented Section 10 for AI assessment generation endpoints.
4. `docs/api/API_INDEX.md`: Updated API master table.

---

## 13. API Endpoint Documentation

### 13.1 POST `/api/lessons/:id/ai-quiz/generate`
- **Auth**: `Bearer JWT` (Role: `TEACHER`, `ADMIN`)
- **Body**:
  ```json
  {
    "questionCount": 5,
    "difficulty": "MEDIUM",
    "teacherInstructions": "Tập trung vào kiến thức HTTP verbs",
    "previewOnly": false,
    "confirmOverwrite": false
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Đã tạo Quiz AI thành công",
    "data": {
      "id": "quiz-uuid",
      "lessonId": "lesson-uuid",
      "title": "Quiz - Giới thiệu về REST API",
      "questions": [...]
    }
  }
  ```

### 13.2 POST `/api/lessons/:id/ai-coding-exercise/generate`
- **Auth**: `Bearer JWT` (Role: `TEACHER`, `ADMIN`)
- **Body**:
  ```json
  {
    "language": "javascript",
    "difficulty": "EASY",
    "teacherInstructions": "Bài tập tìm số lớn nhất",
    "previewOnly": false
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Đã tạo bài tập Coding Exercise AI dạng DRAFT thành công",
    "data": {
      "id": "exercise-uuid",
      "status": "DRAFT",
      "source": "AI",
      "currentRevision": {
        "version": 1,
        "isPublished": false,
        "testCases": [...]
      },
      "verification": {
        "status": "VERIFIED",
        "testPassRate": 100
      }
    }
  }
  ```

---

## 14. Environment Variables

Reused existing configured environment variables:
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `AI_SERVICE_BASE_URL` | Base URL of FastAPI service | `http://127.0.0.1:8000` |
| `AI_SERVICE_API_KEY` | Server-to-server security key | Configured in `.env` |
| `AI_SERVICE_TIMEOUT_MS`| Timeout for synchronous requests | `60000` |
| `E2B_API_KEY` | Sandbox runner API token | Configured in `.env` |

---

## 15. Prisma Migration Results

- **Schema Changes**: **NONE**. The physical PostgreSQL database schema (`prisma/schema.prisma`) was preserved with 100% fidelity.
- **Migrations Run**: Zero migrations required.

---

## 16. Automated Test Results

Executed test suite: `scripts/test_step7c_ai_assessment_integration.ts`

| Scenario | Description | Result |
| :---: | :--- | :---: |
| 1 | Teacher generates Quiz successfully | **PASS** |
| 2 | Teacher generates Coding Exercise successfully | **PASS** |
| 3 | Student cannot generate assessments (403) | **PASS** |
| 4 | Teacher cannot access another teacher's lesson (403) | **PASS** |
| 5 | Admin permissions follow existing policy (allowed on all lessons) | **PASS** |
| 6 | Missing transcript returns controlled error (400) | **PASS** |
| 7 | Missing summary uses safe fallback (proceeds with transcript only) | **PASS** |
| 8 | Malformed AI Quiz response rejected | **PASS** |
| 9 | Quiz with multiple correct answers resolved accurately | **PASS** |
| 10 | Quiz with duplicate questions rejected | **PASS** |
| 11 | Existing Quiz protected against overwrite when student submissions exist (409) | **PASS** |
| 12 | Quiz submissions preserved | **PASS** |
| 13 | Coding Exercise mapping matches Prisma schema | **PASS** |
| 14 | Coding Exercise draft creation (status DRAFT, isPublished false) | **PASS** |
| 15 | Coding Exercise revision behavior (freezes v1 with submissions, creates v2 draft) | **PASS** |
| 16 | Hidden test cases remain private from students | **PASS** |
| 17 | Reference solution remains private from students | **PASS** |
| 18 | E2B verification success (marks VERIFIED on 100% pass) | **PASS** |
| 19 | E2B verification failure (marks FAILED on failure, stays draft) | **PASS** |
| 20 | E2B unavailable fallback (marks UNVERIFIED when offline, stays draft) | **PASS** |
| 21 | FastAPI timeout handling (504) | **PASS** |
| 22 | FastAPI rate limit handling (429) | **PASS** |
| 23 | FastAPI unauthorized response handling (502/401) | **PASS** |
| 24 | FastAPI unsupported theoretical content handling | **PASS** |
| 25 | No partial database writes on failure (atomic rollback) | **PASS** |
| 26 | No duplicate persistence on retry (enforces 409 conflict protection) | **PASS** |
| 27 | Existing Quiz submission regression (scoring and grading intact) | **PASS** |
| 28 | Existing Coding Exercise submission regression | **PASS** |
| 29 | Existing Coding Exercise revision regression | **PASS** |
| 30 | Existing Lesson AI Content regression | **PASS** |

**Summary**: 30 Scenarios Tested, **30 Passed (100.0%)**, 0 Failed.

---

## 17. Regression Test Results

Existing regression test suites were run without regressions:
1. `scripts/test_step2_coding_exercise_crud.ts`: **37/37 PASSED (100%)**
2. `scripts/test_step6_5_lesson_ai_content.ts`: **62/62 PASSED (100%)**
3. `scripts/test_step7c_ai_assessment_integration.ts`: **30/30 PASSED (100%)**

---

## 18. Known Limitations

1. **Quiz Model Single-Instance Constraint**: `Quiz.lessonId` is marked `@unique` in PostgreSQL. Multiple quizzes per lesson cannot be stored simultaneously without a future approved schema migration.
2. **Quiz Explanation Omission in DB**: Because `Question` lacks an `explanation` column, question explanations generated by Gemini are only available during the preview phase or must be stored in future metadata columns if schema changes are approved.
3. **E2B Supported Languages**: Automated verification currently supports JavaScript/TypeScript via the existing code execution harness; other languages (e.g. Python, C++) remain `UNVERIFIED` until corresponding harnesses are initialized.

---

## 19. Remaining Issues

- None. All 30 required scenarios and regression suites pass cleanly.

---

## 20. Frontend Step 7D Integration Contract

For the upcoming Step 7D Frontend implementation (Teacher Studio Assessment Management):
1. **Quiz Generation UI**:
   - Provide "Generate Quiz with AI" button in Lesson Editor.
   - Allow setting `questionCount` (1-20), `difficulty` (`EASY`, `MEDIUM`, `HARD`), and optional `teacherInstructions`.
   - Provide a "Preview" step (`previewOnly: true`) displaying questions, options, correct answers, and explanations.
   - When teacher approves, call `POST /api/lessons/:id/ai-quiz/generate` with `previewOnly: false` (and `confirmOverwrite: true` if replacing an un-submitted quiz).
2. **Coding Exercise Generation UI**:
   - Provide "Generate Coding Exercise with AI" button.
   - Display verification status badge (`VERIFIED`, `FAILED`, `UNVERIFIED`) and test case details.
   - Allow teachers to review and edit starter code, reference solution, and test cases in the Draft editor before clicking "Publish".
