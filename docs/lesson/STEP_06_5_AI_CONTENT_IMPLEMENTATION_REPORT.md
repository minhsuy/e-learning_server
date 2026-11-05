# TMDEMY — STEP 6.5 IMPLEMENTATION REPORT: LESSON AI TRANSCRIPT & SUMMARY STORAGE

**Date**: 2026-10-25  
**Author**: Senior Backend Architect & Prisma/PostgreSQL Specialist  
**Status**: COMPLETED & VERIFIED (62/62 Tests Passed, Zero Regression)  
**Target Database**: PostgreSQL 16.11 (`tmdemy`)  
**ORM**: Prisma ORM 6.4.1  
**Architecture Layer**: Router → Middleware → Controller → Service → Functional Repository → Prisma Client Singleton → PostgreSQL  

---

## 1. Executive Summary & Objective

Step 6.5 extends the TMdemy E-Learning Lesson module with persistent storage for AI-generated video transcripts (`transcript.md`) and lesson summaries (`summary.md`). These artifacts originate from an external FastAPI AI microservice utilizing Faster-Whisper for high-accuracy speech-to-text transcription and Google Gemini Flash for structured pedagogical summarization.

This extension provides:
1. Long-form Markdown persistence in PostgreSQL `TEXT` columns supporting Vietnamese diacritics and complex formatting.
2. An AI processing lifecycle state machine (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`) with timestamping and operational error tracking.
3. Multi-mode secure update API (`PATCH /api/lessons/:id/ai-content`) supporting both instructor Bearer JWT and server-to-server microservice API Key authentication (`x-ai-service-key`).
4. Stale AI job conflict prevention based on Bunny Stream video asset verification and timestamp monotonicity.
5. Strict anti-leak protection ensuring operational errors (`aiProcessingError`) are visible only to instructors/administrators, while remaining redacted from students.
6. Seamless backward compatibility for all existing Lesson CRUD endpoints and study views.

---

## 2. Pre-Implementation Source Code Audit

Before altering any code, a comprehensive audit was executed across all existing Lesson and streaming components:

| Component / File | Findings & Existing Architecture | Decision in Step 6.5 |
| :--- | :--- | :--- |
| `prisma/schema.prisma` | Model `Lesson` contained standard fields (`title`, `slug`, `videoUrl`, `bunnyVideoId`, `videoStatus`, `duration`, `isDemo`, `order`). No AI storage fields or status enums existed. | Added `AiProcessingStatus` enum and 5 new columns (`transcript`, `summary`, `aiProcessingStatus`, `aiProcessedAt`, `aiProcessingError`). |
| `src/models/lesson.model.ts` | Zod schemas `lessonSchema`, `lessonStudySchema`, `lessonPublicSchema`. Did not validate AI fields or input payloads. | Extended `lessonSchema` and `lessonStudySchema` (omitting error details). Added `updateLessonAiContentInputSchema` and response DTO schemas. |
| `src/repositories/lesson.repository.ts` | Pure functional repository. Projections `LESSON_PUBLIC_SELECT` and `LESSON_STUDY_SELECT` did not project AI columns. | Added `transcript`, `summary`, `aiProcessingStatus`, `aiProcessedAt` to `LESSON_STUDY_SELECT`. Created `LESSON_AI_CONTENT_SELECT` and exported `updateLessonAiContent`. |
| `src/services/lesson.service.ts` | Handled lesson CRUD and Bunny Stream video synchronization. Did not have AI update or dedicated read methods. | Implemented `updateLessonAiContentService`, `getLessonAiContentService`, and `getLessonByIdService`. Updated `formatSafeLesson` to redact errors. |
| `src/middlewares/lesson.middleware.ts` | Express Validator chains for creation and updates. | Added `updateLessonAiContentValidator`, `authenticateAiOrTeacherAdmin` (dual JWT / API Key), and `optionalAuthMiddleware`. |
| `src/controller/lesson.controller.ts` | Handled HTTP transport. Missing AI endpoints. | Added `updateLessonAiContentController`, `getLessonAiContentController`, and `getLessonByIdController`. |
| `src/routes/lesson.route.ts` | Exposed 4 endpoints (`POST /`, `PUT /:id`, `DELETE /:id`, `GET /chapter/:chapterId`). | Added 3 routes: `PATCH /:id/ai-content`, `GET /:id/ai-content`, and `GET /:id`. |
| `docs/api/LESSON_API.md` & `API_INDEX.md` | Total catalog listed 131 REST endpoints. | Documented the 3 new endpoints and updated master catalog to 134 REST endpoints. |

---

## 3. Physical Database Schema & Prisma Migration

### 3.1. Prisma Schema Changes (`prisma/schema.prisma`)

```prisma
enum AiProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED

  @@map("ai_processing_status")
}

model Lesson {
  id                 String              @id @default(uuid()) @db.Uuid
  title              String              @db.VarChar(255)
  slug               String              @db.VarChar(255)
  order              Int                 @default(0)
  duration           Int                 @default(0)
  type               LessonType          @default(VIDEO)
  content            String              @default("") @db.Text
  isDemo             Boolean             @default(false) @map("is_demo")
  videoUrl           String              @default("") @map("video_url")
  bunnyVideoId       String?             @map("bunny_video_id") @db.VarChar(100)
  videoStatus        String?             @map("video_status") @db.VarChar(50)
  
  // STEP 6.5: AI Transcript & Summary Fields
  transcript         String?             @db.Text
  summary            String?             @db.Text
  aiProcessingStatus AiProcessingStatus? @default(PENDING) @map("ai_processing_status")
  aiProcessedAt      DateTime?           @map("ai_processed_at") @db.Timestamptz(6)
  aiProcessingError  String?             @map("ai_processing_error") @db.Text

  createdAt          DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  chapterId          String              @map("chapter_id") @db.Uuid
  courseId           String              @map("course_id") @db.Uuid
  authorId           String              @map("author_id") @db.Uuid
  
  // Relations preserved identically...
}
```

### 3.2. Migration Execution

The migration was generated and applied using standard non-destructive Prisma tooling:
- **Migration Directory**: `prisma/migrations/20261025033032_add_lesson_ai_content/migration.sql`
- **Generated SQL**:
  ```sql
  -- CreateEnum
  CREATE TYPE "ai_processing_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

  -- AlterTable
  ALTER TABLE "lessons" ADD COLUMN "ai_processed_at" TIMESTAMPTZ(6),
  ADD COLUMN "ai_processing_error" TEXT,
  ADD COLUMN "ai_processing_status" "ai_processing_status" DEFAULT 'PENDING',
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "transcript" TEXT;
  ```
- **Validation**:
  - `npx prisma validate` returned: `The schema at prisma\schema.prisma is valid 🚀`.
  - Database verification showed 0 data loss, existing lesson records acquired `ai_processing_status = 'PENDING'`, and all other fields were `NULL`.

---

## 4. Architectural Implementation Details

### 4.1. Application Domain Models (`src/models/lesson.model.ts`)
Conforming to TMDEMY Zod Application Layer design:
- `lessonSchema`: Extended with nullable/optional `transcript`, `summary`, `aiProcessingStatus`, `aiProcessedAt`, `aiProcessingError`.
- `lessonStudySchema`: Includes safe AI fields (`transcript`, `summary`, `aiProcessingStatus`, `aiProcessedAt`) while omitting `aiProcessingError` to protect operational secrets from client payloads.
- `updateLessonAiContentInputSchema`:
  ```typescript
  export const updateLessonAiContentInputSchema = z.object({
    transcript: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    aiProcessingStatus: z.nativeEnum(AiProcessingStatus).optional(),
    aiProcessingError: z.string().nullable().optional(),
    bunnyVideoId: z.string().optional(),
    clientTimestamp: z.string().or(z.date()).optional()
  })
  ```

### 4.2. Functional Repository (`src/repositories/lesson.repository.ts`)
Conforming to AGENTS.md Functional Repository standards:
- `LESSON_STUDY_SELECT`: Augmented to include `transcript`, `summary`, `aiProcessingStatus`, `aiProcessedAt`.
- `LESSON_AI_CONTENT_SELECT`: Dedicated projection including primary IDs, ownership metadata, demo flag, video ID, AI contents, status, and error.
- `updateLessonAiContent`: Exported async functional mutation taking `(id, data, tx)`.

### 4.3. Business Logic & Security Services (`src/services/lesson.service.ts`)
1. **`updateLessonAiContentService`**:
   - **Validation**: Enforces UUID check and Zod schema parsing.
   - **Authorization**:
     - Internal Microservice: Authorized via role `'AI_SERVICE'`.
     - System Administrator: Authorized via role `'ADMIN'`.
     - Course Instructor: Authorized only if `course.authorId === userId`. Non-owners receive `403 Forbidden`.
     - Students: Explicitly blocked with `403 Forbidden`.
   - **Stale AI Job Conflict Protection**:
     - *Video Mismatch Guard*: If incoming `bunnyVideoId` is supplied and does not match the lesson's current `bunnyVideoId`, rejects with `409 Conflict`.
     - *Timestamp Monotonicity Guard*: If incoming `clientTimestamp` is older than existing `lesson.aiProcessedAt`, rejects with `409 Conflict`.
   - **Lifecycle State Machine**:
     - Transition to `COMPLETED`: Requires either `transcript` or `summary` (payload or pre-existing in database). If both are empty, rejects with `400 Bad Request`. Automatically sets `aiProcessedAt = new Date()` and clears stale `aiProcessingError = null`.
     - Transition to `FAILED`: Persists `aiProcessingError`.
     - Transition to `PROCESSING`: Sets status and resets stale error.
     - Transition to `PENDING`: Resets status.
   - **Partial Updates**: Preserves unmodified fields (e.g., updating only `summary` leaves `transcript`, `title`, and `duration` untouched).
2. **`getLessonAiContentService`**:
   - Checks enrollment status using `findEnrollmentByUserAndCourse(userId, courseId)`.
   - Permits access if: (a) caller is teacher owner/admin/AI service, (b) lesson has `isDemo === true`, or (c) student has `status === 'ACTIVE'` enrollment.
   - Unauthenticated visitors on non-demo lessons receive `401 Unauthorized`. Unenrolled students on non-demo lessons receive `403 Forbidden`.
   - **Anti-Leak Filter**: `aiProcessingError` is strictly deleted from student/public responses. Only teachers/admins/AI service see operational debugging details.
3. **`getLessonByIdService`**:
   - Returns full lesson detail (`LESSON_STUDY_SELECT`) with Bunny Stream playback URLs, instructional content, transcript, and summary for authorized students.

### 4.4. Transport Middleware & Router (`src/middlewares/lesson.middleware.ts`, `src/routes/lesson.route.ts`)
- **`authenticateAiOrTeacherAdmin`**:
  - Checks header `x-ai-service-key`: Matches `process.env.AI_SERVICE_API_KEY || 'tmdemy-ai-service-secret'`. If valid, binds synthetic system principal `{ userId: 'ai-microservice', role: 'AI_SERVICE' }`.
  - Fallback to JWT Bearer: Decodes token and asserts `role === 'TEACHER'` or `role === 'ADMIN'`.
- **`optionalAuthMiddleware`**:
  - Gracefully extracts JWT or AI key if provided, or passes through as anonymous for public demo access.
- **Express Route Registration**:
  - `GET  /api/lessons/:id/ai-content`: Dedicated AI content reader.
  - `PATCH /api/lessons/:id/ai-content`: Dedicated AI content writer.
  - `GET  /api/lessons/:id`: Full lesson study reader.

---

## 5. Summary of Files Created and Modified

| File Path | Action | Description |
| :--- | :---: | :--- |
| `prisma/schema.prisma` | Modified | Added `AiProcessingStatus` enum and 5 new columns on `Lesson`. |
| `prisma/migrations/20261025033032_add_lesson_ai_content/migration.sql` | Created | Applied PostgreSQL migration creating enum and altering `lessons` table. |
| `src/models/lesson.model.ts` | Modified | Added `AiProcessingStatus` enum import, domain field additions, and DTO schemas (`updateLessonAiContentInputSchema`, `lessonAiContentResponseSchema`). |
| `src/repositories/lesson.repository.ts` | Modified | Updated `LESSON_STUDY_SELECT`, added `LESSON_AI_CONTENT_SELECT`, and exported `updateLessonAiContent`. |
| `src/services/lesson.service.ts` | Modified | Implemented `updateLessonAiContentService`, `getLessonAiContentService`, `getLessonByIdService`, and updated `formatSafeLesson`. |
| `src/middlewares/lesson.middleware.ts` | Modified | Added `updateLessonAiContentValidator`, `authenticateAiOrTeacherAdmin`, and `optionalAuthMiddleware`. |
| `src/controller/lesson.controller.ts` | Modified | Added `updateLessonAiContentController`, `getLessonAiContentController`, `getLessonByIdController` with safe parameter helpers. |
| `src/routes/lesson.route.ts` | Modified | Registered 3 routes (`/:id/ai-content` GET/PATCH and `/:id` GET) with validation chains and auth handlers. |
| `scripts/test_step6_5_lesson_ai_content.ts` | Created | Complete 62-assertion automated test suite covering all 15 specification requirements. |
| `docs/api/LESSON_API.md` | Modified | Added comprehensive API documentation for endpoints 5, 6, and 7, plus Frontend & Microservice integration guide. |
| `docs/api/API_INDEX.md` | Modified | Updated master REST API count to 134 and indexed new Lesson endpoints. |
| `docs/lesson/STEP_06_5_AI_CONTENT_IMPLEMENTATION_REPORT.md` | Created | This formal technical implementation report. |

---

## 6. Automated Verification & Test Results

The automated test script `scripts/test_step6_5_lesson_ai_content.ts` was executed against the local PostgreSQL test database:

```bash
npx tsx scripts/test_step6_5_lesson_ai_content.ts
```

### Detailed Results Matrix (62/62 Checks Passed)

```text
=================================================================
STARTING TMDEMY STEP 6.5: LESSON AI TRANSCRIPT & SUMMARY SUITE
=================================================================

--- Group 1: Existing Lesson Records & Prisma Schema Integrity ---
  PASS: [Group 1] Existing lesson record is readable from PostgreSQL
  PASS: [Group 1] Newly created lesson has null transcript by default
  PASS: [Group 1] Newly created lesson has null summary by default
  PASS: [Group 1] Default aiProcessingStatus is PENDING
  PASS: [Group 1] Default aiProcessedAt is null
  PASS: [Group 1] Default aiProcessingError is null
  PASS: [Group 1] LESSON_STUDY_SELECT includes transcript
  PASS: [Group 1] LESSON_STUDY_SELECT includes summary
  PASS: [Group 1] LESSON_STUDY_SELECT includes aiProcessingStatus

--- Group 2: Markdown & Vietnamese Unicode Preservation ---
  PASS: [Group 2] Teacher owner can update AI transcript and summary
  PASS: [Group 2] Vietnamese transcript with markdown formatting stored intact
  PASS: [Group 2] Vietnamese summary with markdown formatting stored intact
  PASS: [Group 2] aiProcessingStatus set to COMPLETED
  PASS: [Group 2] aiProcessedAt timestamp populated upon COMPLETED
  PASS: [Group 2] Database verifies Vietnamese title in transcript
  PASS: [Group 2] Database verifies complex Vietnamese diacritics in transcript

--- Group 3: Large Markdown Content (>50KB) ---
  PASS: [Group 3] Generated large markdown content size is 155540 bytes (>50KB)
  PASS: [Group 3] Long markdown transcript (>50KB) stored successfully in PostgreSQL TEXT column
  PASS: [Group 3] PostgreSQL retrieved exact byte length without truncation

--- Group 4: Partial Updates & Field Isolation ---
  PASS: [Group 4] Partial update of summary succeeded
  PASS: [Group 4] Summary was updated to new value
  PASS: [Group 4] Existing transcript was NOT erased or mutated during partial update
  PASS: [Group 4] Existing lesson title preserved
  PASS: [Group 4] Existing lesson duration preserved
  PASS: [Group 4] Existing bunnyVideoId preserved

--- Group 5: AI Processing Lifecycle State Machine ---
  PASS: [Group 5] Status transitioned to PENDING
  PASS: [Group 5] Status transitioned to PROCESSING
  PASS: [Group 5] Status transitioned to FAILED
  PASS: [Group 5] Operational error persisted upon FAILED state
  PASS: [Group 5] Cannot mark COMPLETED without transcript or summary content (rejected with 400)
  PASS: [Group 5] Retry successfully marked COMPLETED with content
  PASS: [Group 5] Stale processing error was automatically cleared on COMPLETED
  PASS: [Group 5] aiProcessedAt recorded correctly

--- Group 6: Authorization & Security Controls ---
  PASS: [Group 6] Ordinary student cannot update AI content (403 Forbidden)
  PASS: [Group 6] Non-owner teacher cannot update AI content (403 Forbidden)
  PASS: [Group 6] Admin can update AI content (200 OK)
  PASS: [Group 6] Server-to-server AI service can update content

--- Group 7: Student Read Access & Anti-Leak Policy ---
  PASS: [Group 7] Enrolled student can read AI content of purchased course
  PASS: [Group 7] Enrolled student receives transcript
  PASS: [Group 7] Strict anti-leak: aiProcessingError is REDACTED from student
  PASS: [Group 7] Unenrolled student cannot read AI content of non-demo lesson (403 Forbidden)
  PASS: [Group 7] Unauthenticated caller cannot read non-demo lesson AI content (401 Unauthorized)
  PASS: [Group 7] Unenrolled student CAN read AI content of demo lesson
  PASS: [Group 7] Anonymous public caller CAN read AI content of demo lesson
  PASS: [Group 7] Teacher owner can read lesson AI content
  PASS: [Group 7] Teacher owner can view aiProcessingError for operational debugging
  PASS: [Group 7] GET /api/lessons/:id returns lesson detail for enrolled student
  PASS: [Group 7] Lesson detail includes transcript
  PASS: [Group 7] Lesson detail includes summary
  PASS: [Group 7] Lesson detail redacts aiProcessingError

--- Group 8: Stale AI Job Conflict Prevention ---
  PASS: [Group 8] Stale AI job with mismatched bunnyVideoId rejected with 409 Conflict
  PASS: [Group 8] Stale AI job with older clientTimestamp rejected with 409 Conflict

--- Group 9: Backward Compatibility of Existing Lesson APIs ---
  PASS: [Group 9] Existing createLessonService works backward-compatibly
  PASS: [Group 9] New lesson created with UUID
  PASS: [Group 9] Existing updateLessonService works backward-compatibly
  PASS: [Group 9] Lesson duration updated successfully
  PASS: [Group 9] getLessonsByChapterService works backward-compatibly
  PASS: [Group 9] Lessons by chapter returned as list
  PASS: [Group 9] Lessons list does not leak aiProcessingError

--- Group 10: Express Route Registration Audit ---
  PASS: [Group 10] PATCH /api/lessons/:id/ai-content is registered in lessonRouter
  PASS: [Group 10] GET /api/lessons/:id/ai-content is registered in lessonRouter
  PASS: [Group 10] GET /api/lessons/:id is registered in lessonRouter

--- Cleaning Up Database Fixtures ---
Test fixtures cleaned up successfully.

=================================================================
STEP 6.5 VERIFICATION COMPLETE: 62/62 PASSED (0 FAILED)
=================================================================
```

---

## 7. Regression Test Results

1. **Prisma Schema Validation**:
   ```bash
   npx prisma validate
   # Result: The schema at prisma\schema.prisma is valid 🚀 (Exit code 0)
   ```
2. **Step 6 Coding Exercise & Progress Suite**:
   ```bash
   npx tsx scripts/test_step6_coding_completion_progress.ts
   # Result: STEP 6 VERIFICATION SUMMARY: 87/87 PASSED, 0 FAILED (Exit code 0)
   ```
3. **TypeScript Compilation on Modified Lesson Files**:
   Zero TypeScript errors in `lesson.model.ts`, `lesson.repository.ts`, `lesson.service.ts`, `lesson.middleware.ts`, `lesson.controller.ts`, or `lesson.route.ts`.

---

## 8. Known Limitations & Technical Decisions

1. **Combined AI Processing Lifecycle**:
   - `AiProcessingStatus` covers both transcription and summarization as a single unified pipeline state. In the current FastAPI architecture, summarization immediately follows transcription in the same worker task.
   - *Limitation*: If transcription succeeds but summarization fails in the future, the status will be marked `FAILED`, but the partial `transcript` is still stored in PostgreSQL.
   - *Future Enhancement*: If transcription and summarization are detached into separate asynchronous microservices with independent retries, two discrete enums (`transcriptionStatus`, `summaryStatus`) can be evaluated without breaking the `PATCH /api/lessons/:id/ai-content` payload schema.
2. **Server-to-Server Authentication**:
   - Implemented via shared secret header `x-ai-service-key` backed by environment variable `AI_SERVICE_API_KEY`.
   - *Limitation*: Suitable for private internal container network or reverse-proxy protected environments.
   - *Future Enhancement*: For multi-tenant or public cloud microservice deployments, an mTLS or HMAC request signing mechanism may be added without modifying the service logic.

---

## 9. Readiness for Step 7: Automatic AI Quiz & Exercise Generation

With Step 6.5 complete, TMdemy backend has established an enterprise-grade foundation for Step 7:
1. **Direct Backend Access**: Services in Step 7 can query `findLessonById(lessonId, { select: { transcript: true, summary: true } })` to retrieve raw lesson text without relying on client-supplied text.
2. **Deterministic Inputs**: The AI Quiz Generator can use `summary` for high-level multiple choice questions and `transcript` for deep code analysis.
3. **Zero Frontend Overhead**: The Next.js frontend is decoupled from prompt engineering and text ingestion.
