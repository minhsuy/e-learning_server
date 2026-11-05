# TMDEMY — STEP 7H: SIMPLIFY AI MODEL & AUTOMATE LESSON SUMMARY REPORT

## 1. Executive Summary

Step 7H simplifies the AI model architecture across the 3-tier TMdemy system (`speech-to-text` FastAPI microservice, `e-learning_server` Express/Prisma backend, and `e-learning` Next.js frontend) and automates **Lesson Summary** generation after teacher video uploads on `/teacher/courses/[id]/curriculum`.

### Key Outcomes
1. **Single Default AI Model (`gemini-3.1-flash-lite`)**:
   - Configured centrally via environment variable `GEMINI_MODEL=gemini-3.1-flash-lite` in both FastAPI (`speech-to-text/app/core/config.py`) and Express (`e-learning_server/src/config/ai.config.ts` & `src/config/aiModels.config.ts`).
   - Verified live against the Google GenAI API (`models/gemini-3.1-flash-lite`) for Lesson Summary, AI Quiz, AI Coding Exercise, and Transcript Refinement.
   - Added explicit `404` / `NOT_FOUND` validation in FastAPI (`gemini_service.py`, `summary.py`, `quiz_service.py`, `quiz_generation_service.py`, `coding_exercise_service.py`) to report clearly if the configured model is unavailable on Google GenAI rather than silently switching models.
   - Removed the multi-model selector (`ai-model-selector.tsx`) from all Teacher UI modals (`LessonSummaryModal`, `AiQuizGenerateModal`, `AiCodingExerciseModal`) and removed the redundant model listing endpoints (`GET /api/ai/models` and `GET /api/lessons/ai-models`).
2. **Automated Lesson Summary Pipeline After Video Upload**:
   - When a teacher creates or updates a Lesson with a Bunny Stream video on `/teacher/courses/[id]/curriculum`:
     1. Completes the Bunny Stream TUS upload.
     2. Waits until the Bunny video status reaches `READY` (`rawStatus === 4`) via `autoTriggerLessonAiSummaryIfNeeded` and `watchBunnyVideoUntilReady`.
     3. Automatically triggers the asynchronous AI transcription (Faster-Whisper) and summarization (`gemini-3.1-flash-lite`) pipeline without requiring a manual "Generate Summary" click.
     4. If a transcript already exists on the lesson while `summary` is missing, generates **only** the missing Summary via `POST /api/v1/summary/generate` (`recoverOrGenerateLessonSummaryService`) without rerunning Whisper.
     5. Persists the generated Markdown into `Lesson.summary` in PostgreSQL and only marks `Lesson.aiProcessingStatus = COMPLETED` when `Lesson.summary` is non-empty.
     6. Protects existing teacher-edited summaries from being overwritten by automatic jobs.
     7. Prevents duplicate jobs across concurrent upload status checks, Bunny webhooks, and lesson creation via in-memory locking (`activeLessonTriggerLocks`) and active job database checks (`findActiveAiJobByLessonId`).
     8. Refreshes the Teacher Curriculum and Summary Modal UI automatically via background polling.

---

## 2. Architecture & Modified Files

### 2.1. Python FastAPI AI Microservice (`d:\e-learning-project\speech-to-text`)
- `.env` & `app/core/config.py`:
  - Set `GEMINI_MODEL=gemini-3.1-flash-lite` as the centralized default model.
- `app/services/gemini_service.py` & `app/api/routes/summary.py`:
  - Enforced `settings.GEMINI_MODEL` (`gemini-3.1-flash-lite`), added explicit `404`/`NOT_FOUND` model availability error reporting without silent model switching, and preserved `429 RESOURCE_EXHAUSTED` quota handling.
- `app/services/quiz_service.py`, `app/services/quiz_generation_service.py`, `app/services/coding_exercise_service.py`, & `app/api/routes/coding_exercises.py`:
  - Standardized on `settings.GEMINI_MODEL` (`gemini-3.1-flash-lite`) and added explicit model availability error reporting.
- `app/schemas/job.py` & `app/api/routes/health.py`:
  - Exposed `gemini_model` in `GET /health` for operational verification.

### 2.2. Express / Prisma Backend (`d:\e-learning-project\e-learning_server`)
- `.env`, `src/config/ai.config.ts`, & `src/config/aiModels.config.ts`:
  - Centralized `GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'` and `DEFAULT_AI_MODEL_ID`.
  - Removed multi-model registry array and enforced single-model validation (`isValidAiModelId`).
- `src/routes/ai.route.ts`, `src/routes/index.route.ts`, `src/routes/lesson.route.ts`, & `src/controller/aiJob.controller.ts`:
  - Removed `GET /api/ai/models`, `GET /api/lessons/ai-models`, and `getAiModelsController`.
- `src/services/aiProcessing.service.ts`:
  - Implemented `autoTriggerLessonAiSummaryIfNeeded`, `watchBunnyVideoUntilReady`, and `watchAiJobUntilTerminal`.
  - Enforced readiness check (`rawStatus === 4` / `READY`) before starting AI jobs.
  - Added transcript-exists shortcut to call `recoverOrGenerateLessonSummaryService` (`POST /api/v1/summary/generate`) without rerunning Whisper.
  - Added teacher-edited summary preservation and strict `COMPLETED` semantics (requiring non-empty `Lesson.summary`).
- `src/services/lesson.service.ts` & `src/controller/video.controller.ts`:
  - Connected `createLessonService`, `updateLessonService`, `getVideoStatusController` (`GET /api/videos/:videoId/status`), and `bunnyWebhookController` (`POST /api/videos/webhook`) to `autoTriggerLessonAiSummaryIfNeeded`.
  - Ensured lessons created without a video (`type === 'TEXT'` or no `bunnyVideoId`/`videoUrl`) set `aiProcessingStatus = null` and never trigger AI processing.

### 2.3. Next.js Frontend (`d:\e-learning-project\e-learning`)
- Deleted `src/components/teacher/assessment/ai-model-selector.tsx`.
- `src/services/ai-assessment.service.ts`:
  - Removed `getAiModels()`.
- `src/components/teacher/curriculum/lesson-summary-modal.tsx`, `src/components/teacher/assessment/ai-quiz-generate-modal.tsx`, & `src/components/teacher/assessment/ai-coding-exercise-modal.tsx`:
  - Removed `AiModelSelector` dropdown and `selectedModel` state.
  - Added clear error banner and manual **Retry** button in `LessonSummaryModal`.
- `src/app/teacher/courses/[id]/curriculum/page.tsx` & `src/components/teacher/curriculum/chapter-accordion-item.tsx`:
  - Added live status badges (`Đang tóm tắt...`, `Đã có tóm tắt`, `Tóm tắt (Lỗi)`) on each lesson's Summary button and automatic background polling while any lesson in the curriculum is encoding or generating its summary.

---

## 3. End-to-End Verification Results (`scripts/verify_step7h.ts`)

All 11 automated verification checks in `e-learning_server/scripts/verify_step7h.ts` passed (`11/11 PASSED`):

| Check ID | Verification Requirement | Result | Detail |
| :--- | :--- | :---: | :--- |
| **1.1** | Backend Centralized Single Model ID | **PASS** | `DEFAULT_AI_MODEL_ID=gemini-3.1-flash-lite`, rejects non-default models (`400 Bad Request`) |
| **1.2** | FastAPI Health & Active Model | **PASS** | `status=ok`, `gemini-3.1-flash-lite` verified live on Google GenAI API |
| **2.1** | No Model Selection Dropdown or Model Endpoints Remain | **PASS** | `ai-model-selector.tsx` & `ai.route.ts` removed; 0 references in Teacher modals |
| **3.1** | Creating a Lesson Without a Video Does Not Trigger AI Processing | **PASS** | `aiJobsCount=0`, `aiProcessingStatus=null` |
| **4.1** | Creating a Lesson With a Video Automatically Triggers AI Processing | **PASS** | `jobsCreated=1`, `status=QUEUED` automatically upon lesson creation |
| **5.1** | Duplicate Upload Callbacks Do Not Create Duplicate Jobs | **PASS** | 3 concurrent `autoTriggerLessonAiSummaryIfNeeded` callbacks -> `jobsCount=1` |
| **6.1** | Summary Persisted to `Lesson.summary` via `gemini-3.1-flash-lite` (Without Rerunning Whisper When Transcript Exists) | **PASS** | `status=COMPLETED`, `summaryLength=1879` chars persisted in PostgreSQL, `whisperJobsCreated=0` |
| **6.2** | Existing Teacher-Edited Summary Protected From Overwrite | **PASS** | Auto-trigger preserves teacher's manual Markdown edits |
| **7.1** | Teacher and Student Can View the Generated Summary | **PASS** | Verified via `getLessonAiContentService` (Teacher & Student) and `getLessonByIdService` |
| **8.1** | Single Model (`gemini-3.1-flash-lite`) Works for AI Quiz | **PASS** | `statusCode=200`, generated 3 valid MCQs |
| **8.2** | Single Model (`gemini-3.1-flash-lite`) Works for AI Coding Exercise | **PASS** | `statusCode=200`, `modelUsed=gemini-3.1-flash-lite` |

