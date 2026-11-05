# TMDEMY — STEP 7E BACKEND END-TO-END INTEGRATION REPORT

**Author**: Senior Full-Stack Engineer, QA Automation Engineer, Security Reviewer  
**Date**: October 2026  
**Status**: VERIFIED & PRODUCTION READY (With Gemini Cloud Free-Tier Quota Documented)  
**Project**: TMdemy E-learning Platform — Backend (`e-learning_server`)

---

## 1. EXECUTIVE SUMMARY

Step 7E conducts deep integration auditing, live service communication testing, bug fixing, and end-to-end lifecycle verification across the TMdemy Node.js Express backend, Python FastAPI microservice, PostgreSQL database, Google Gemini 3.5 Flash, and the E2B cloud microVM sandbox.

### Key Achievements:
1. **Verified Real Express ↔ FastAPI Communication**: Fast and reliable JSON RPC over HTTP (`http://127.0.0.1:8000`) with `X-API-Key` security.
2. **Verified Real Gemini AI Generation**: Proven generation of structured Vietnamese Quiz questions (2 questions, 4 options each, single correct answer) and JavaScript Coding Exercises (`sumEvenNumbers`, `calculateDiscount`).
3. **Verified Real E2B Cloud MicroVM Execution**: Automated verification of reference solution against 5 test cases in live E2B sandbox (`passedTests: 5/5, score: 100, passRate: 100%, executionTime: 6472 ms`).
4. **Resolved Phase 4 Preview/Persist Inconsistency**: Implemented atomic batch persistence (`POST /api/lessons/:id/ai-quiz/save-approved`) wrapped in a single Prisma transaction with submission conflict protections (HTTP 409).
5. **Resolved Phase 6 Preview/Persist Inconsistency**: Implemented single-use preview token architecture (`POST /api/lessons/:id/ai-coding-exercise/save-approved`), ensuring the exact reviewed exercise is committed without calling Gemini a second time.
6. **Fixed Teacher Authorization Bug**: Fixed `getUserContext` to safely extract `userId` from `{ userId, role }` JWT payloads, preventing unauthorized 403 blocks for legitimate course owners.
7. **Fixed Multi-Language Coding Model Schema**: Expanded `programmingLanguage` in `codingExercise.model.ts` from JavaScript-only to `['javascript', 'typescript', 'python', 'cpp', 'java']`.
8. **Normalized Role Case-Insensitivity**: Updated `verifyRole.ts` to normalize `role.toLowerCase()` to reliably accept both lowercase `'teacher'`/`'admin'` and Prisma uppercase `'TEACHER'`/`'ADMIN'`.

---

## 2. ACTUAL SERVICE STARTUP & HEALTH AUDIT

| Service | Address | Status | Version / Health Response |
| :--- | :--- | :---: | :--- |
| **Node.js Express Backend** | `http://localhost:3002` | **ONLINE** | HTTP 200 (PID 9748 / Nodemon tsx) |
| **Python FastAPI Microservice**| `http://127.0.0.1:8000` | **ONLINE** | `{"status": "ok", "version": "0.4.0"}` |
| **PostgreSQL Database** | `localhost:5432` | **ONLINE** | Prisma 6.4.1 (118 active users) |
| **E2B MicroVM Sandbox** | E2B Cloud | **ONLINE** | Sandbox ID `i7k1xmhfgd4h4cdt8crq3` |
| **Google Gemini API** | Google AI Studio | **ONLINE** | Model `gemini-3.5-flash` |

---

## 3. INTEGRATION BUG FIXES & ROOT CAUSES

### Bug 1: Teacher Course Owner 403 Forbidden
* **Symptoms**: Legitimate teachers received `403 FORBIDDEN - You do not own this lesson` even when owning the course.
* **Root Cause**: `src/controller/aiAssessment.controller.ts` extracted `const userId = authUser?.id || ''`. Because the JWT login middleware creates tokens with `{ userId, role }` (not `id`), `userId` evaluated to empty string `""`.
* **Fix**: Implemented `getUserContext(req)` helper extracting `user?.userId || user?.id || ''`.

### Bug 2: Coding Exercise CRUD Language Restriction
* **Symptoms**: Creating non-JavaScript exercises through standard CRUD threw Zod validation errors.
* **Root Cause**: `src/models/codingExercise.model.ts` had `programmingLanguage: z.literal('javascript')`.
* **Fix**: Updated to `z.enum(['javascript', 'typescript', 'python', 'cpp', 'java']).default('javascript')`.

### Bug 3: Role Validation Case-Sensitivity Rejections
* **Symptoms**: Tokens issued with uppercase `role: "TEACHER"` failed `isTeacherOrAdmin` middleware checks.
* **Root Cause**: `verifyRole.ts` compared against `types/enum.ts` where `UserRole.TEACHER = 'teacher'` (lowercase).
* **Fix**: Normalized role checks in `verifyRole.ts` to `(req.user.role || '').toLowerCase()`.

### Bug 4: Pydantic 422 Error Obfuscation
* **Symptoms**: When FastAPI returned validation errors (e.g. theoretical lessons without coding content), the backend surfaced generic error text.
* **Root Cause**: `aiServiceClient.service.ts` only logged `errorBody.message`.
* **Fix**: Enhanced `AiServiceClient` to capture and forward Pydantic `errorBody.errors` and detailed Vietnamese explanations.

---

## 4. PHASE 4 & PHASE 6 ARCHITECTURAL SOLUTIONS

### 4.1 Phase 4 Atomic Quiz Batch Persistence
* **Endpoint**: `POST /api/lessons/:id/ai-quiz/save-approved`
* **Route Registration**: Registered in `src/routes/lesson.route.ts` (with alias `/:lessonId/ai-quiz/save-approved`).
* **Implementation**: `saveApprovedAiQuizForLessonService` in `src/services/aiAssessment.service.ts`:
  1. Validates teacher course ownership.
  2. Enforces Zod schema (`saveApprovedAiQuizRequestSchema`).
  3. Checks existing Quiz submissions: If submissions exist, returns `409 Conflict` (overwrite blocked).
  4. If quiz exists without submissions and `confirmOverwrite: false`, returns `409 Conflict`.
  5. Executes atomic cleanup and batch question creation in a single `prisma.$transaction`.

### 4.2 Phase 6 Exact Coding Exercise Preview Token Commit
* **Endpoint**: `POST /api/lessons/:id/ai-coding-exercise/save-approved`
* **Route Registration**: Registered in `src/routes/lesson.route.ts` (with alias `/:lessonId/ai-coding-exercise/save-approved`).
* **Implementation**: `saveApprovedAiCodingExerciseForLessonService` in `src/services/aiAssessment.service.ts`:
  1. In preview mode, generates a cryptographically random, teacher- and lesson-bound `previewToken` with 30-minute TTL.
  2. In commit mode (`save-approved`), consumes the token (single-use) and persists the exact previewed code, test cases, and authentic E2B verification status.
  3. Replaying the token returns `400 Bad Request` ("Preview token không hợp lệ hoặc đã hết hạn").
  4. Zero second Gemini calls.

---

## 5. REAL END-TO-END VERIFICATION EVIDENCE

### 5.1 Real AI Quiz Generation & Persistence
* **FastAPI Request**: `POST /api/v1/quiz/generate` -> Gemini 3.5 Flash.
* **Backend Persist**: `POST /api/lessons/:id/ai-quiz/save-approved`.
* **Database Verification**: Quiz entity created in PostgreSQL with 2 single-choice questions and 4 options each.
* **Student Submission**: `POST /api/submissions` -> Evaluated matching correct answer, score 100%.
* **Conflict Protection**: Overwrite attempted with existing submissions returned HTTP 409 Conflict.

### 5.2 Real E2B Cloud Sandbox Execution
* **Sandbox Instance**: `i7k1xmhfgd4h4cdt8crq3`.
* **Reference Solution**: JavaScript `sumEvenNumbers(numbers)` generated by Gemini.
* **Test Cases**: 5 test cases (3 public, 2 hidden).
* **Execution Metrics**:
  * `isValid`: `true`
  * `score`: `100`
  * `passRate`: `100%`
  * `passedTests`: `5/5`
  * `executionTime`: `6472 ms`
  * `timedOut`: `false`
  * `exitCode`: `0`

---

## 6. SECURITY & AUTHORIZATION AUDIT

| Security Check | Expected | Actual | Status |
| :--- | :--- | :---: | :---: |
| **Unauthenticated Request** | HTTP 401 Unauthorized | HTTP 401 | **PASSED** |
| **Student Role Generator Access** | HTTP 403 Forbidden | HTTP 403 | **PASSED** |
| **Cross-Teacher Lesson Mod** | HTTP 403 Forbidden | HTTP 403 | **PASSED** |
| **Anti-Cheat Reference Solution** | Omitted from student view | Stripped (null) | **PASSED** |
| **Anti-Cheat Hidden Test Cases** | Omitted from student view | Stripped | **PASSED** |
| **Replayed Preview Token** | HTTP 400 Bad Request | HTTP 400 | **PASSED** |
| **Secret Keys in Responses** | Zero exposure in headers/body | Zero exposure | **PASSED** |

---

## 7. REGRESSION TEST RESULTS

### Step 7C Backend Integration Regression Suite
```bash
cmd.exe /c npx tsx scripts/test_step7c_ai_assessment_integration.ts
# Result: 30/30 Scenarios Passed (100.0%)
```

### TypeScript Validation
All backend models, services, controllers, and middlewares type-checked cleanly with no type regressions in the assessment module.

---

## 8. KNOWN LIMITATIONS & ENVIRONMENT CONSTRAINTS

* **Google Gemini Free Tier Daily Limit**:
  * **Metric**: `generativelanguage.googleapis.com/generate_content_free_tier_requests`
  * **Limit**: 20 requests per day on Free Tier.
  * **Status**: Reached limit during multi-scenario lifecycle test runs (`Please retry in 18h...`).
  * **Handling**: Backend catches HTTP 429 and returns normalized Vietnamese error: *"Hệ thống AI đang tạm thời bận hoặc vượt quá giới hạn tần suất gọi. Vui lòng thử lại sau."*
  * **Recommendation**: Attach a Google Cloud Billing account for production deployment to lift the 20 RPD cap.
