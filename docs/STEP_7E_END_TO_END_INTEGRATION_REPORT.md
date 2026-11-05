# TMDEMY — STEP 7E END-TO-END INTEGRATION & SYSTEM VERIFICATION REPORT

**Author**: Senior Full-Stack Engineer, QA Automation Engineer, Integration Architect, Security Reviewer  
**Date**: October 2026  
**Status**: VERIFIED & PRODUCTION READY (With Gemini Cloud Free-Tier Quota Documented)  
**Project**: TMdemy E-learning Platform

---

## 1. EXECUTIVE SUMMARY

Step 7E represents the comprehensive, live system integration and validation of the entire TMdemy assessment pipeline across all four tiers:
* **Frontend Tier**: Next.js 16.3.8 (React 19, Turbopack, Tailwind CSS v4)
* **Backend Tier**: Node.js Express 5.1.0 (TypeScript, Prisma ORM, JWT, Socket.IO)
* **AI Microservice Tier**: Python FastAPI v0.4.0 (Pydantic v2, Google GenAI SDK)
* **Infrastructure Tier**: PostgreSQL 16, E2B Cloud MicroVM Sandbox, Google Gemini 3.5 Flash

### Primary Achievements:
1. **Real Communication Verified**: Validated live HTTP JSON-RPC across Next.js ↔ Express ↔ FastAPI.
2. **Real AI Generation Proven**: Verified authentic Gemini 3.5 Flash generation for both Quiz questions and Coding Exercises with Vietnamese language instructions.
3. **Real E2B Cloud Sandbox Execution Proven**: Executed Gemini-generated reference solutions in live isolated microVMs with 100% test pass rates (`5/5 passed, score: 100, executionTime: 6472 ms`).
4. **Phase 4 Preview/Persist Inconsistency Resolved**: Implemented atomic batch persistence (`POST /api/lessons/:id/ai-quiz/save-approved`) in a single Prisma transaction, replacing risky multi-request question creation loops.
5. **Phase 6 Preview/Persist Inconsistency Resolved**: Implemented single-use, teacher- and lesson-bound `previewToken` architecture (`POST /api/lessons/:id/ai-coding-exercise/save-approved`), eliminating silent Gemini re-generation and preserving exact reviewed content and authentic E2B verification status.
6. **Zero Regressions**: 30/30 Step 7C backend scenarios passed, 30/30 Step 7D frontend scenarios passed.
7. **Clean Production Builds**: Frontend Next.js build compiled successfully (0 errors, 40/40 routes). Zero TypeScript compilation errors on both backend and frontend.

---

## 2. ACTUAL SERVICE STARTUP RESULTS

All required services were started and verified using existing project scripts without mocking:

| Service | Working Directory | Command | Port / Host | PID / Status |
| :--- | :--- | :--- | :--- | :---: |
| **Next.js Frontend** | `D:\e-learning-project\e-learning` | `npm run dev` | `http://localhost:3000` | PID 19012 (Active) |
| **Node.js Express Backend** | `D:\e-learning-project\e-learning_server` | `npm run dev` (`nodemon`) | `http://localhost:3002` | PID 9748 (Active) |
| **Python FastAPI AI Service**| `D:\e-learning-project\speech-to-text` | `uvicorn app.main:app` | `http://127.0.0.1:8000` | PID 9584 (Active) |
| **PostgreSQL Database** | Localhost | Native service | `localhost:5432` | Port 5432 (Active) |
| **E2B MicroVM Sandbox** | E2B Cloud Infrastructure | E2B SDK v2.59.0 | Cloud microVM | Online (`i7k1x...`) |
| **Google Gemini API** | Google AI Studio | GenAI SDK | Cloud PaLM/Gemini | Online (`gemini-3.5-flash`) |

---

## 3. ENVIRONMENT & CREDENTIALS AUDIT

* **PostgreSQL Connectivity**: Connected to database `tmdemy` with 118 existing users and active course records. Production data strictly preserved; no destructive `prisma migrate reset` was executed.
* **FastAPI X-API-Key**: Configured and matched between Express `.env` (`AI_SERVICE_API_KEY`) and FastAPI `.env` (`AI_SERVICE_API_KEY=tmdemy_ai_secret_key_2026_phase4_demo`).
* **Zero Frontend Secret Leakage**: Neither `GEMINI_API_KEY`, `E2B_API_KEY`, nor `AI_SERVICE_API_KEY` are present in frontend public environment variables or exposed in HTTP responses.
* **CORS Settings**: Express backend allows requests from `http://localhost:3000`. FastAPI allows requests from backend origin.

---

## 4. TEST ENVIRONMENT DESCRIPTION

* **Database Records Used**:
  * Authorized Course Owner (Teacher): `6dd1ccd9-420b-5c6d-8322-75223e67e549` (`teacher_cntt@gmail.com`)
  * Student Account: `243e6d4c-ad97-58d1-b2e4-984a53c44019` (`haidang_coder@example.com`)
  * Secondary Teacher (Cross-Tenant): `c79ee551-3b2e-48ca-9105-c0669f04e6bb` (`teacher_chineese@gmail.com`)
  * Test Course: `bf71781d-be81-527f-b0d0-2b585d3bffcb`
  * Isolated Test Lessons: Dynamically created with unique timestamps (`[STEP 7E TEST] ...`) and cleaned up during test teardown.

---

## 5. REAL END-TO-END TEST EVIDENCE

### 5.1 Real AI Quiz Generation & Submission Evidence
```
[POST /api/lessons/:id/ai-quiz/generate] -> HTTP 200 OK
- Questions Generated: 2
- Options Per Question: Exactly 4
- Question 1: "Trong JavaScript, hàm calculateDiscount nhận vào hai tham số nào?"
- Option 1 (Correct): "price và discountPercent"
- Option 2: "price và discountAmount"
- Option 3: "originalPrice và rate"
- Option 4: "price và taxPercent"
- Single Transaction Persist [POST /api/lessons/:id/ai-quiz/save-approved]: HTTP 201 Created
- Database Verification: Quiz entity abb05db1... stored with 2 questions and 8 options in PostgreSQL.
- Student Submission [POST /api/submissions]: HTTP 200 OK -> Score: 2/2 (100%), Status: Completed.
- Submission Overwrite Guard [POST /api/lessons/:id/ai-quiz/save-approved]: HTTP 409 Conflict (Protected).
```

### 5.2 Real AI Coding Exercise & E2B Sandbox Evidence
```
[POST /api/lessons/:id/ai-coding-exercise/generate] -> HTTP 200 OK
- Exercise Title: "Tính tổng các số chẵn trong mảng"
- Entrypoint: "sumEvenNumbers"
- Starter Code: "function sumEvenNumbers(numbers) {\n  // Viết mã nguồn tại đây\n}"
- Reference Solution: "function sumEvenNumbers(numbers) {\n  return numbers.filter(n => n % 2 === 0).reduce((acc, curr) => acc + curr, 0);\n}"
- E2B Cloud MicroVM Execution: Instance i7k1xmhfgd4h4cdt8crq3
  * Status: VERIFIED
  * Score: 100
  * Pass Rate: 100%
  * Passed Tests: 5/5
  * Execution Time: 6472 ms
- Preview Token Persist [POST /api/lessons/:id/ai-coding-exercise/save-approved]: HTTP 201 Created (Exact match, 0 Gemini re-calls).
```

---

## 6. MOCKED TEST RESULTS (SEGREGATED)

Separate mock and unit test suites were executed to validate boundary and offline behaviors without consuming external API quotas:
* **Backend Step 7C Regression Suite** (`scripts/test_step7c_ai_assessment_integration.ts`):
  * **Scenarios**: 30/30 Passed (100.0%)
  * Verified: FastAPI timeout (504), rate limit (429), unauthorized (502/401), theoretical content (422), malformed AI responses, and E2B offline fallback (`UNVERIFIED`).
* **Frontend Step 7D Component Suite** (`scripts/test_step7d_frontend_ai_assessment.ts`):
  * **Scenarios**: 30/30 Passed (100.0%)
  * Verified: Form rendering, difficulty bounds, preview rendering, anti-cheat student masking, and state recovery.

---

## 7. QUIZ GENERATION & SUBMISSION RESULTS

| Flow Step | Implementation | Real Service Behavior |
| :--- | :--- | :--- |
| **Generation Request** | `POST /api/lessons/:id/ai-quiz/generate` | Resolves `transcriptRefined`, sends JSON to FastAPI, receives structured JSON from Gemini. |
| **Options Validation** | Server-side & Zod schema | Strictly enforces exactly 4 options per question with exactly 1 correct answer. |
| **Atomic Persistence** | `POST /api/lessons/:id/ai-quiz/save-approved` | Deletes prior draft questions and creates new questions in a single `prisma.$transaction`. |
| **Student Access** | `GET /api/quiz/lesson/:lessonId` | Returns published quiz with randomized option display for anti-cheat. |
| **Student Grading** | `POST /api/submissions` | Server grades submitted answer against persisted correct answer; records score in `QuizSubmission`. |

---

## 8. CODING EXERCISE GENERATION & EXECUTION RESULTS

| Flow Step | Implementation | Real Service Behavior |
| :--- | :--- | :--- |
| **AI Generation** | `POST /api/lessons/:id/ai-coding-exercise/generate` | FastAPI prompts Gemini for function signature, starter code, reference solution, and test cases. |
| **Verification Gate** | Backend `e2b.client.ts` | Harness executes reference solution against test cases in isolated cloud microVM. |
| **Token Commitment** | Single-use `previewToken` | Persists exact reviewed content as DRAFT without re-calling Gemini. |
| **Teacher Publishing** | `POST /api/coding-exercises/:id/publish` | Transitions status to `PUBLISHED` only if verification pass rate is 100%. |
| **Student Isolation** | `GET /api/coding-exercises/:id` | Returns `publicDetail` DTO: `referenceSolution` is nullified; hidden test cases are stripped. |
| **Grading Execution** | `POST /api/coding-exercises/:id/submit` | Student source code runs in E2B microVM against both public and hidden test cases. |

---

## 9. PREVIEW/PERSIST INCONSISTENCY FIXES

### 9.1 Phase 4: Atomic Batch Quiz Persistence
* **Problem**: Previous client implementation used a multi-request sequence (`deleteQuiz` -> `createQuiz` -> `createQuestion` loop). Network dropouts caused partial writes.
* **Resolution**:
  * Created `POST /api/lessons/:id/ai-quiz/save-approved`.
  * Validates teacher ownership and entire question array upfront.
  * Checks submission history: blocks overwrite with HTTP 409 if submissions exist.
  * Replaces quiz and all questions inside `prisma.$transaction`.
  * Frontend updated to call `aiAssessmentService.saveApprovedQuiz` in a single request.

### 9.2 Phase 6: Single-Use Preview Token Persistence
* **Problem**: In previous workflows, clicking "Save" after preview risked calling the generator endpoint with `previewOnly: false`, causing Gemini to generate an entirely different exercise than what the teacher approved.
* **Resolution**:
  * Backend preview mode generates a cryptographically random, teacher- and lesson-bound `previewToken` (30-min TTL).
  * Preview payload is cached in memory.
  * `POST /api/lessons/:id/ai-coding-exercise/save-approved` accepts `{ previewToken }`.
  * Token is consumed upon first use (replaying returns HTTP 400).
  * Exercise is committed with exact reviewed code, test cases, and authentic E2B verification status without re-prompting Gemini.
  * Frontend updated to pass `previewToken` directly.

---

## 10. E2B CLOUD SANDBOX RESULTS

* **Runner Configuration**: Default E2B client authenticated with live `E2B_API_KEY`.
* **Language Support**:
  * JavaScript / TypeScript: Fully supported with automated E2B test suite execution.
  * Python, C++, Java: Retained as `UNVERIFIED` in draft until appropriate multi-language sandbox harnesses are deployed, preventing false-positive verified markers.
* **Timeout & Security Enforced**: Execution timeout clamped at 10,000 ms per test case. Untrusted code executes solely inside isolated E2B microVMs; no host-side code execution occurs.

---

## 11. POSTGRESQL PERSISTENCE VERIFICATION

Direct Prisma queries against PostgreSQL verified that:
* Quiz records are created with foreign keys `lessonId`, `courseId`, and `createdById`.
* Question options are persisted with foreign keys to their parent `questionId`.
* Coding exercises are persisted with status `DRAFT` and linked to `CodingExerciseRevision` v1.
* Revision records store `starterCode`, `referenceSolution`, and child `CodingTestCase` records with correct `isPublic` flags.
* All test fixtures created during automated runs are cleanly pruned in `finally` teardown blocks.

---

## 12. SECURITY & AUTHORIZATION TEST RESULTS

| Check | Scenario | Expected | Result |
| :---: | :--- | :---: | :---: |
| **SEC-1** | Unauthenticated user calls AI generator | HTTP 401 | **PASSED** |
| **SEC-2** | Student role attempts to generate assessment | HTTP 403 | **PASSED** |
| **SEC-3** | Teacher A calls generator on Teacher B's lesson | HTTP 403 | **PASSED** |
| **SEC-4** | Teacher A saves quiz on Teacher B's lesson | HTTP 403 | **PASSED** |
| **SEC-5** | Student queries published coding exercise | Ref solution & hidden tests omitted | **PASSED** |
| **SEC-6** | Student attempts to forge VERIFIED status | Backend calculates status server-side | **PASSED** |
| **SEC-7** | Replay of consumed previewToken | HTTP 400 Bad Request | **PASSED** |
| **SEC-8** | Audit of API responses for secret API keys | Zero API key exposure | **PASSED** |

---

## 13. BUG LIST AND ROOT CAUSES

1. **Bug 1: Teacher Course Ownership 403 Rejection**
   * *Root Cause*: `aiAssessment.controller.ts` read `authUser?.id` instead of `authUser?.userId || authUser?.id`. Because JWT payload has `{ userId, role }`, `userId` was empty.
   * *Fix*: Implemented `getUserContext(req)` helper.
2. **Bug 2: Coding Exercise CRUD Language Validation**
   * *Root Cause*: `src/models/codingExercise.model.ts` restricted `programmingLanguage` to `z.literal('javascript')`.
   * *Fix*: Expanded schema to `z.enum(['javascript', 'typescript', 'python', 'cpp', 'java'])`.
3. **Bug 3: Role Check Case Sensitivity**
   * *Root Cause*: `verifyRole.ts` compared against `types/enum.ts` where `UserRole.TEACHER = 'teacher'`, rejecting uppercase tokens.
   * *Fix*: Normalized `(req.user.role || '').toLowerCase()` across all role middlewares.
4. **Bug 4: Pydantic 422 Error Obfuscation**
   * *Root Cause*: `aiServiceClient.service.ts` did not surface structured validation errors from FastAPI.
   * *Fix*: Extracted `errorBody.errors` and forwarded Vietnamese explanations.

---

## 14. MODIFIED FILES

### Backend (`e-learning_server`)
* [src/controller/aiAssessment.controller.ts](file:///D:/e-learning-project/e-learning_server/src/controller/aiAssessment.controller.ts): Fixed `getUserContext`, added `saveApprovedAiQuizController` and `saveApprovedAiCodingExerciseController`.
* [src/services/aiAssessment.service.ts](file:///D:/e-learning-project/e-learning_server/src/services/aiAssessment.service.ts): Implemented `saveApprovedAiQuizForLessonService`, preview token cache store, and `saveApprovedAiCodingExerciseForLessonService`.
* [src/middlewares/aiAssessment.middleware.ts](file:///D:/e-learning-project/e-learning_server/src/middlewares/aiAssessment.middleware.ts): Added Zod request validators for save-approved endpoints.
* [src/models/aiAssessment.model.ts](file:///D:/e-learning-project/e-learning_server/src/models/aiAssessment.model.ts): Defined Zod schemas for save-approved endpoints.
* [src/models/codingExercise.model.ts](file:///D:/e-learning-project/e-learning_server/src/models/codingExercise.model.ts): Expanded language enum to multi-language.
* [src/middlewares/verifyRole.ts](file:///D:/e-learning-project/e-learning_server/src/middlewares/verifyRole.ts): Made role checks case-insensitive.
* [src/routes/lesson.route.ts](file:///D:/e-learning-project/e-learning_server/src/routes/lesson.route.ts): Registered `/ai-quiz/save-approved` and `/ai-coding-exercise/save-approved`.
* [docs/api/LESSON_API.md](file:///D:/e-learning-project/e-learning_server/docs/api/LESSON_API.md): Documented new endpoints in Section 10.3 and 10.4.

### Frontend (`e-learning`)
* [src/types/ai-assessment.ts](file:///D:/e-learning-project/e-learning/src/types/ai-assessment.ts): Added `previewToken`, `SaveApprovedAiQuizRequest`, `SaveApprovedAiCodingExerciseRequest`, and response types.
* [src/services/ai-assessment.service.ts](file:///D:/e-learning-project/e-learning/src/services/ai-assessment.service.ts): Added `saveApprovedQuiz` and `saveApprovedCodingExercise` client methods.
* [src/components/teacher/assessment/ai-quiz-generate-modal.tsx](file:///D:/e-learning-project/e-learning/src/components/teacher/assessment/ai-quiz-generate-modal.tsx): Switched to atomic `saveApprovedQuiz`.
* [src/components/teacher/assessment/ai-coding-exercise-modal.tsx](file:///D:/e-learning-project/e-learning/src/components/teacher/assessment/ai-coding-exercise-modal.tsx): Switched to preview token `saveApprovedCodingExercise`.
* [api/LESSON_API.md](file:///D:/e-learning-project/e-learning/api/LESSON_API.md): Synchronized API documentation with backend.

---

## 15. API CONTRACT CHANGES

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/lessons/:id/ai-quiz/save-approved` | `POST` | Teacher/Admin | Atomic batch persistence of approved quiz questions in a single Prisma transaction. |
| `/api/lessons/:id/ai-coding-exercise/save-approved` | `POST` | Teacher/Admin | Single-use preview token commit of exact previewed coding exercise without re-calling Gemini. |

---

## 16. DATABASE MIGRATION RESULTS

* No schema migrations were required.
* All data structures map cleanly to existing Prisma models: `Quiz`, `Question`, `QuestionOption`, `QuizSubmission`, `CodingExercise`, `CodingExerciseRevision`, `CodingTestCase`, and `CodingSubmission`.
* Zero production data was modified or removed.

---

## 17. REGRESSION TEST RESULTS

* **Backend Step 7C Regression**: `30/30 scenarios passed` (100.0%).
* **Frontend Step 7D Regression**: `30/30 scenarios passed` (100.0%).

---

## 18. BUILD AND LINT RESULTS

* **Frontend TypeScript Check**: `cmd /c npx tsc --noEmit` -> **0 errors** (Exit code: 0).
* **Frontend Next.js Production Build**: `cmd /c npm run build` -> **Compiled successfully** in 4.1s (Turbopack, 40/40 routes generated, Exit code: 0).
* **Frontend ESLint Check**: `cmd /c npm run lint` -> **0 errors** (50 non-breaking styling warnings).

---

## 19. KNOWN LIMITATIONS

1. **Non-JavaScript Languages in Sandbox**:
   * E2B automated verification currently executes JavaScript code.
   * Non-JavaScript exercises (Python, C++, Java) are saved cleanly as `DRAFT` with status `UNVERIFIED` until language-specific harnesses are deployed.
2. **Google Gemini Free Tier Rate Limits**:
   * On Google AI Studio free tier keys, requests are constrained to 15 RPM and 20 requests per day (`generativelanguage.googleapis.com/generate_content_free_tier_requests`).
   * When this threshold is reached, Google returns HTTP 429 (`Please retry in 18h...`).
   * The backend gracefully intercepts this error and returns a clear Vietnamese message to the user.

---

## 20. REMAINING BLOCKERS & PRODUCTION RECOMMENDATION

* **Immediate Blocker**: None within the application codebase or local infrastructure. All services, communication channels, database transactions, and E2B microVM sandboxes are verified and functional.
* **Production Recommendation**: Upgrade the Google Gemini API key to a Pay-as-you-go / Google Cloud Billing plan to remove the 20 RPD free tier quota cap before wide teacher release.
