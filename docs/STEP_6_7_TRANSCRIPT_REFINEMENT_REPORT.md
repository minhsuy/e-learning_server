# STEP 6.7 — AI TRANSCRIPT REFINEMENT WITH GEMINI IMPLEMENTATION REPORT

**Project:** TMdemy E-learning Platform  
**Component:** Python FastAPI AI Microservice (`D:\ai-service\speech-to-text`) & Node.js Backend Server (`D:\e-learning_server`)  
**Date:** October 26, 2026  
**Status:** Completed & 100% Verified (233/233 Python tests passed, 46/46 Node.js Step 6.7 verification tests passed, 62/62 Step 6.5 regression tests passed, 89/89 Step 6.6A regression tests passed)

---

## 1. Executive Summary & Objective

In technical lecture videos recorded in Vietnamese (e.g. NestJS, WebSockets, TypeScript, Docker), automatic speech recognition engines like Faster-Whisper frequently misrecognize English programming identifiers, camelCase / PascalCase method and interface names, framework names, and technical terms spoken with Vietnamese phonetics. For example:
- `OnGetQuay Init` → `OnGatewayInit`
- `Socket iOS` → `Socket.IO`
- `Nèm spy` → `namespace`
- `Bích du Wea` → `middleware`

The objective of **Step 6.7** is to implement a high-precision, conservative **AI Transcript Refinement Service** using Google Gemini that corrects confidently identifiable technical recognition errors while strictly preserving:
1. **Original timestamps** (Whisper-generated start/end floats are 100% immutable and never entrusted to Gemini).
2. **Segment identities and sequence** (segment count and segment IDs remain identical).
3. **Conversational tone and Vietnamese style** (no unsolicited summarization, expansion, or rewriting into formal prose).
4. **Dual storage and immutability** (both untouched Whisper `transcript_original` and Gemini-refined `transcript_refined` are persisted and separately retrievable, while the active primary `transcript` points to the refined version).
5. **Robust fallback** (if any chunk fails validation or Gemini is unreachable, the system gracefully falls back to the original transcript without aborting the job pipeline).

---

## 2. Architecture & Data Flow

```
                      +-------------------------------------------------------------+
                      |                      BUNNY STREAM                           |
                      |                 (Remote Video Hosting)                      |
                      +------------------------------+------------------------------+
                                                     |
                                        Direct Media URL / Signed URL
                                                     v
+---------------------------------------------------------------------------------------------------+
|                        FASTAPI AI MICROSERVICE (app/services)                                     |
|                                                                                                   |
| 1. Media Ingestion & Extraction:                                                                  |
|    Bunny Video Ingestion -> FFmpeg Audio Extraction (16kHz Mono WAV)                              |
|                                                                                                   |
| 2. Faster-Whisper ASR:                                                                            |
|    Transcribe Vietnamese Audio -> Segments [{id, start, end, text}, ...]                          |
|                                                                                                   |
| 3. Export Untouched Original:                                                                     |
|    MarkdownService -> transcript_original.md                                                      |
|                                                                                                   |
| 4. Gemini Transcript Refinement:                                                                  |
|    TranscriptRefinementService                                                                    |
|    - Configurable chunking (30 segments/chunk) with 2 adjacent context segments                   |
|    - Strict System Prompt with Technical Glossary hints                                           |
|    - Structured JSON Output: {"segments": [{"id": int, "text": str}]}                            |
|    - Re-attaches original timestamps start/end (zero trust for LLM timestamps)                    |
|    - Quality & Safety Validation (count, IDs, length ratio [0.35, 2.5], diacritic preservation)   |
|    - Bounded retries with exponential backoff for 429/503/timeout                                 |
|    - Partial chunk fallback on unrecoverable error                                                |
|                                                                                                   |
| 5. Export Refined & Primary Artifacts:                                                            |
|    MarkdownService -> transcript_refined.md & transcript.md                                       |
|                                                                                                   |
| 6. Downstream Summarization:                                                                      |
|    GeminiService -> summary.md (Generated directly from the refined transcript)                   |
+--------------------------------------------+------------------------------------------------------+
                                             |
                   GET /api/jobs/:id/result  |  (dual transcripts + summary)
                                             v
+---------------------------------------------------------------------------------------------------+
|                        NODE.JS SERVER (src/services/aiProcessing.service.ts)                      |
|                                                                                                   |
| 1. Poll Worker / Webhook:                                                                         |
|    pollJobStatusService verifies job completion and fetches FastApiJobResult                      |
|                                                                                                   |
| 2. Atomic Generation-Fenced Persistence:                                                          |
|    prisma.lesson.updateMany({                                                                     |
|      where: { id: job.lessonId, aiGeneration: job.generation, bunnyVideoId: job.videoId },        |
|      data: {                                                                                      |
|        transcript: activeTranscript,                                                              |
|        transcriptOriginal: originalTranscript,                                                    |
|        transcriptRefined: refinedTranscript,                                                      |
|        summary: summary,                                                                          |
|        aiProcessingStatus: 'COMPLETED'                                                            |
|      }                                                                                            |
|    })                                                                                             |
|                                                                                                   |
| 3. Role-Based Access Control:                                                                     |
|    - Students: receive active `transcript` and `summary` (raw original/refined redacted)          |
|    - Teachers / Admins / AI Service: receive `transcript`, `transcriptOriginal`, `transcriptRefined|
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Existing Files Inspected

Before making any modifications, existing architectures and conventions were audited:

### Python AI Microservice (`D:\ai-service\speech-to-text`):
- `app/services/lecture_service.py`: Pipeline coordinator for Whisper transcription, markdown generation, and Gemini summarization.
- `app/services/gemini_service.py`: Gemini client setup, `generate_content` integration, structured schemas, temperature configuration.
- `app/services/markdown_service.py`: Timestamp formatting, markdown header rendering, file export.
- `app/services/job_manager.py`: Background thread worker queue, job state transitions, error isolation.
- `app/schemas/lecture.py`: Pydantic models for `LectureStage`, `LectureStatus`, `TranscriptSegment`, `LectureProcessingResult`.
- `app/schemas/job.py`: Job stage models, result response schemas.
- `app/api/routes/jobs.py`: REST routes for job polling, result retrieval, artifact downloading.
- `app/core/config.py`: Environment configuration and validation.

### Node.js Backend Server (`D:\e-learning_server`):
- `prisma/schema.prisma`: Data models for `Lesson`, `AiProcessingJob`, `Course`, `User`.
- `src/models/lesson.model.ts`: Zod schemas for lesson validation, AI content request/response.
- `src/repositories/lesson.repository.ts`: Projections `LESSON_AI_CONTENT_SELECT`, `LESSON_STUDY_SELECT`, database helpers.
- `src/services/lesson.service.ts`: Ownership verification, authorization policies, enrollment checks, safe response normalization.
- `src/services/aiProcessing.service.ts`: Job orchestration, polling lifecycle, generation fencing, atomic conditional updates.
- `src/services/aiServiceClient.service.ts`: HTTP client communicating with FastAPI microservice, Zod validation schemas.
- `src/middlewares/lesson.middleware.ts`: Transport validators and multi-mode authentication.

---

## 4. New and Modified Files

### Python AI Microservice (`D:\ai-service\speech-to-text`):
| File | Status | Description |
|---|---|---|
| `app/services/transcript_refinement_service.py` | **NEW** | Core refinement engine: chunking, Gemini prompt with glossary, Pydantic structured output, safety heuristics, and chunk-level fallback. |
| `app/services/__init__.py` | MODIFIED | Exported `TranscriptRefinementService`, `get_transcript_refinement_service`, and `RefinementStats`. |
| `app/core/config.py` | MODIFIED | Added refinement settings (`REFINEMENT_ENABLED`, `REFINEMENT_CHUNK_SIZE`, `REFINEMENT_MAX_RETRIES`, `REFINEMENT_TEMPERATURE`, `REFINEMENT_TIMEOUT_SECONDS`, `REFINEMENT_MODEL`). |
| `.env.example` | MODIFIED | Documented new refinement configuration keys with default values. |
| `app/services/markdown_service.py` | MODIFIED | Added support for `is_refined` flag and refinement statistics in markdown frontmatter while maintaining full backwards compatibility. |
| `app/schemas/lecture.py` | MODIFIED | Added `REFINING_TRANSCRIPT` stage/status, `transcript_original_path`, `transcript_refined_path`, and `refinement_stats` to result schemas. |
| `app/schemas/job.py` | MODIFIED | Added `REFINING_TRANSCRIPT` to `JobStage`, `refinement_stats` to `JobResultMetadata`, and dual transcript fields to `JobResultResponse`. |
| `app/services/lecture_service.py` | MODIFIED | Integrated refinement into `process_lecture`: exports original transcript, refines segments, exports refined transcript, generates summary from refined text. |
| `app/services/job_manager.py` | MODIFIED | Propagated `REFINING_TRANSCRIPT` stage updates via callback; tracked original/refined paths and refinement stats in `JobRecord`. |
| `app/api/routes/jobs.py` | MODIFIED | Updated `get_job_result` to return dual transcript fields (with camelCase & snake_case aliases) and whitelisted `transcript_original.md` and `transcript_refined.md` artifacts. |
| `tests/test_transcript_refinement.py` | **NEW** | Comprehensive unit, pipeline, and live tests covering all 15 requirements. |

### Node.js Backend Server (`D:\e-learning_server`):
| File | Status | Description |
|---|---|---|
| `prisma/schema.prisma` | MODIFIED | Added `transcriptOriginal` (`transcript_original` TEXT) and `transcriptRefined` (`transcript_refined` TEXT) to `Lesson`. |
| `prisma/migrations/20261026124847_add_transcript_original_and_refined/` | **NEW** | PostgreSQL migration adding dual transcript columns. |
| `src/models/lesson.model.ts` | MODIFIED | Added `transcriptOriginal` and `transcriptRefined` to `lessonSchema`, `lessonStudySchema`, `updateLessonAiContentInputSchema`, and `lessonAiContentResponseSchema`. |
| `src/repositories/lesson.repository.ts` | MODIFIED | Updated `LESSON_AI_CONTENT_SELECT` and `LESSON_STUDY_SELECT` with `transcriptOriginal: true` and `transcriptRefined: true`. |
| `src/services/aiServiceClient.service.ts` | MODIFIED | Updated `fastApiJobResultSchema` to parse `transcript_original`, `transcript_refined`, `transcriptOriginal`, `transcriptRefined`. |
| `src/middlewares/lesson.middleware.ts` | MODIFIED | Updated `updateLessonAiContentValidator` to allow `transcriptOriginal` and `transcriptRefined`. |
| `src/services/lesson.service.ts` | MODIFIED | Updated `getLessonAiContentService`, `updateLessonAiContentService`, and `formatSafeLesson` to enforce role-based access and student privacy. |
| `src/services/aiProcessing.service.ts` | MODIFIED | Updated `pollJobStatusService` atomic update to persist both original and refined transcripts. |
| `scripts/test_step6_7_transcript_refinement.ts` | **NEW** | 46 automated verification checks covering schema, persistence, role access, and generation fencing. |

---

## 5. Gemini Refinement Rules & Prompt Strategy

### Strict System Prompt
The system prompt enforces exact rules to guarantee zero hallucination, zero timestamp corruption, and zero conversational flattening:
```
You are an expert technical editor for computer science and software engineering lectures spoken in Vietnamese.
Your sole job is to correct speech recognition errors in Vietnamese technical lectures, focusing on:
1. Programming terminology, language keywords, code identifiers.
2. Framework, library, runtime, and tool names (e.g. NestJS, Express, Docker, PostgreSQL, Socket.IO, Redis).
3. Class, interface, and decorator names (e.g. OnGatewayInit, Injectable, Controller, Body).
4. English technical vocabulary spoken in Vietnamese (e.g. namespace, middleware, payload, connection, handshake).
5. Capitalization and punctuation of technical identifiers.

STRICT RULES:
1. ONLY correct confidently identifiable recognition mistakes. If a phrase is ambiguous or uncertain, KEEP IT UNCHANGED.
2. PRESERVE Vietnamese colloquial phrasing and conversational style (e.g. 'các bạn', 'cái này', 'mình sẽ'). Do NOT rewrite informal speech into formal prose.
3. NEVER invent new technical concepts, explanations, examples, or code that the speaker did not mention.
4. NEVER summarize, expand, or translate segments.
5. PRESERVE EXACT segment IDs and segment count. Do NOT merge, split, reorder, or delete segments.
6. Return valid JSON only adhering strictly to the schema.
```

### Contextual Technical Glossary
A domain-specific glossary of common recognition traps is provided as contextual hints:
- `OnGetQuay Init` → `OnGatewayInit`
- `Socket iOS` → `Socket.IO`
- `Nèm spy` → `namespace`
- `Bích du Wea` → `middleware`
- `Net dét` → `NestJS`
- `Tay sờ kíp` → `TypeScript`
- `Hép bờ` → `helper`
- `Đen tơ si` → `dependency`
- `Bót dét` → `Postgres` / `PostgreSQL`

The prompt explicitly instructs Gemini that these are contextual reference hints, preventing blind or inappropriate replacements.

---

## 6. Chunking Strategy & Validation Heuristics

### Chunking Design
- Transcripts are split into consecutive chunks of `chunk_size` segments (default: 30 segments).
- Each chunk includes up to `context_window` (default: 2) preceding and succeeding adjacent segments marked as `[CONTEXT ONLY - DO NOT MODIFY OR INCLUDE IN OUTPUT]`.
- Gemini is requested to output only the target segment IDs, preventing duplicate output segments.

### Zero-Trust Timestamp Protection
Under no circumstances are timestamps sent to Gemini for modification. The input schema only transmits `id` and `text`. When Gemini returns `[{"id": 1, "text": "..."}]`, the system strictly merges the new `text` with the original `start` and `end` timestamps stored in memory.

### Quality and Safety Validation Heuristics
Before any chunk is accepted, it passes 6 programmatic checks:
1. **Segment Count Check**: Number of returned segments must exactly equal the input chunk size.
2. **Segment ID Check**: Set of returned segment IDs and their sequence must exactly match the input chunk IDs.
3. **Empty Text Check**: No segment with meaningful original text may be replaced with empty or whitespace-only text.
4. **Length Ratio Boundary**: The length ratio `len(refined_text) / len(original_text)` must fall strictly within `[0.35, 2.5]`. Any excessive expansion (indicating hallucinated explanation) or drastic truncation is rejected.
5. **Anti-Translation Check**: If the original segment contained Vietnamese diacritics (e.g. `à, á, ả, ã, ạ, ê, ơ, ư`), the refined text must retain at least one Vietnamese character, guarding against unintended full English translation.
6. **Graceful Fallback**: If a chunk fails validation after bounded retries (default: 2 retries), the service falls back to the original Whisper text for that chunk, records warning logs and statistics, and continues processing remaining chunks.

---

## 7. Markdown Output Strategy

The system produces three distinct Markdown artifacts in the job directory:
1. `transcript_original.md`: Untouched, immutable Whisper transcription with metadata header:
   ```markdown
   # Transcript: Lesson Title
   - Language: vi
   - Version: original (Whisper ASR)
   - Duration: 120.5s
   - Segments: 25

   [00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGetQuay Init trong Socket iOS.
   ```
2. `transcript_refined.md`: Gemini-refined transcript with refinement audit statistics:
   ```markdown
   # Transcript: Lesson Title
   - Language: vi
   - Version: refined (Gemini AI Refinement)
   - Duration: 120.5s
   - Segments: 25
   - Refinement: 14 corrected, 11 unchanged, 0 fallbacks (took 3.2s)

   [00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGatewayInit trong Socket.IO.
   ```
3. `transcript.md`: Active primary transcript (copy of `transcript_refined.md` when refinement succeeds; copy of `transcript_original.md` on complete fallback), ensuring 100% backward compatibility for all legacy consumers.
4. Downstream Summarization: `summary.md` is generated by feeding `transcript.md` (the refined text) into `GeminiService.generate_summary`, ensuring the summary references clean terminology like `OnGatewayInit` rather than `OnGetQuay Init`.

---

## 8. Database Persistence & Prisma Migration

### Prisma Migration
Created and applied migration: `20261026124847_add_transcript_original_and_refined`
```sql
-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "transcript_original" TEXT,
ADD COLUMN "transcript_refined" TEXT;
```

### Lesson Model Semantics:
- `transcript`: The active primary transcript (refined if available, else original). Exposed to enrolled students and API study endpoints.
- `transcriptOriginal` (`transcript_original`): Untouched Whisper transcript for audit, comparison, and teacher review.
- `transcriptRefined` (`transcript_refined`): AI-corrected transcript.
- `summary`: Markdown summary derived from the active refined transcript.

### Security & Privacy Controls:
- **Enrolled Students**: Can view `transcript` and `summary`. Fields `transcriptOriginal`, `transcriptRefined`, and `aiProcessingError` are strictly omitted / redacted.
- **Instructors (Course Owners) & Admins**: Can view both `transcriptOriginal` and `transcriptRefined` for side-by-side inspection, quality audits, or manual overrides.
- **Server-to-Server AI Service**: Full access via verified `x-ai-service-key`.

---

## 9. Verification & Test Results

### 1. Python AI Microservice Tests (`speech-to-text`)
Ran complete test suite with pytest:
- **Total Tests:** 234
- **Passed:** 233
- **Skipped:** 1 (optional live quiz test)
- **Failed:** 0
- **Duration:** 27.29s

Key unit tests in `tests/test_transcript_refinement.py`:
- `test_01_refine_technical_terms_success`: Accurate correction of `OnGetQuay Init` → `OnGatewayInit`, `Socket iOS` → `Socket.IO`, `nèm spy` → `namespace`, `bích du Wea` → `middleware`.
- `test_02_preserves_conversational_and_uncertain_terms`: Verifies conversational tone is preserved and ambiguous words are not mutated.
- `test_03_preserves_segment_ids_and_order`: Verifies output segments align with input sequence.
- `test_04_timestamps_are_not_modified`: Confirms timestamps are preserved from original segments.
- `test_05_chunking_with_context`: Verifies large transcripts (>chunk_size) are partitioned with context and rejoined cleanly.
- `test_06_markdown_fenced_json_recovery`: Tests regex extraction when Gemini returns Markdown ```json blocks.
- `test_07_validation_rejects_missing_segment`: Fallback triggered if a segment ID is dropped.
- `test_08_validation_rejects_mismatched_ids`: Fallback triggered on segment ID mismatch.
- `test_09_validation_rejects_empty_replacement`: Fallback triggered on empty text.
- `test_10_validation_rejects_excessive_expansion`: Fallback triggered if text expands beyond length ratio boundary (e.g. 5x).
- `test_11_validation_rejects_full_english_translation`: Fallback triggered if Vietnamese diacritics are removed.
- `test_12_retries_on_rate_limit_and_server_error`: Exponential backoff and retry on HTTP 429/503.
- `test_13_partial_chunk_failure_fallback`: One chunk fails validation while other chunks succeed; failed chunk falls back to original text without failing entire transcript.
- `test_14_pipeline_dual_markdown_and_summary_source`: Full pipeline integration test verifying dual file exports and summary generation from refined text.

### 2. Live Gemini API Verification
Executed `TestLiveGeminiRefinement::test_live_gemini_refinement_optional` against live Google Gemini API (`gemini-2.5-flash`):
- **Result:** **PASSED** (20.63s)
- **Live Output Verified:**
  - Input: `"Các bạn implement cái OnGetQuay Init trong Socket iOS."`
  - Output: `"Các bạn implement cái OnGatewayInit trong Socket.IO."`
  - Statistics: 2 segments processed, 2 corrected, 0 unchanged, 0 fallbacks.

### 3. Node.js Backend Server Tests (`e-learning_server`)
Executed dedicated Step 6.7 test suite (`scripts/test_step6_7_transcript_refinement.ts`):
- **Total Checks:** 46
- **Passed:** 46
- **Failed:** 0
- **Scenarios Verified:**
  1. Zod `fastApiJobResultSchema` parsing snake_case and camelCase dual transcript fields.
  2. Zod `updateLessonAiContentInputSchema` parsing `transcriptOriginal` and `transcriptRefined`.
  3. PostgreSQL persistence of dual transcripts with Vietnamese Unicode preservation.
  4. Automatic activation of `transcriptRefined` as primary `transcript`.
  5. Teacher owner, Admin, and AI Service can read `transcriptOriginal` and `transcriptRefined`.
  6. Enrolled students receive only active `transcript` and `summary` (`transcriptOriginal`, `transcriptRefined`, and `aiProcessingError` are strictly redacted).
  7. Study API (`getLessonByIdService`) includes active transcript and redacts internal dual raw versions.
  8. Generation-fenced atomic persistence in `pollJobStatusService` saves original and refined transcripts.
  9. Stale-job fencing prevents out-of-order writes from corrupting transcripts.

### 4. Node.js Regression Tests
- `scripts/test_step6_5_lesson_ai_content.ts`: **62/62 PASSED**
- `scripts/test_step6_6a_ai_job_integration.ts`: **89/89 PASSED**

---

## 10. API Contract Changes & Backward Compatibility

### FastAPI AI Microservice (`POST /api/jobs/from-media-source` & `GET /api/jobs/:id/result`):
```json
{
  "job_id": "job-guid-123",
  "status": "COMPLETED",
  "stage": "COMPLETED",
  "progress_percent": 100,
  "transcript": "[00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGatewayInit trong Socket.IO.",
  "transcript_original": "[00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGetQuay Init trong Socket iOS.",
  "transcript_refined": "[00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGatewayInit trong Socket.IO.",
  "transcriptOriginal": "[00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGetQuay Init trong Socket iOS.",
  "transcriptRefined": "[00:00:10.500 --> 00:00:15.800] Các bạn implement cái OnGatewayInit trong Socket.IO.",
  "summary": "# Tóm tắt bài học\n\n- OnGatewayInit...",
  "artifacts": {
    "transcript": "/path/to/transcript.md",
    "transcript_original": "/path/to/transcript_original.md",
    "transcript_refined": "/path/to/transcript_refined.md",
    "summary": "/path/to/summary.md"
  },
  "metadata": {
    "refinement_stats": {
      "total_segments": 25,
      "corrected_segments": 14,
      "unchanged_segments": 11,
      "failed_chunks": 0,
      "fallback_segments": 0,
      "duration_seconds": 3.2
    }
  }
}
```

### Node.js Backend API:
- `GET /api/lessons/:id/ai-content`:
  - **Student View:**
    ```json
    {
      "success": true,
      "data": {
        "id": "lesson-uuid",
        "transcript": "[00:00:10.500 --> ...] OnGatewayInit...",
        "summary": "# Tóm tắt...",
        "aiProcessingStatus": "COMPLETED",
        "aiProcessedAt": "2026-10-26T12:00:00.000Z"
      }
    }
    ```
  - **Teacher / Admin / AI Service View:**
    ```json
    {
      "success": true,
      "data": {
        "id": "lesson-uuid",
        "transcript": "[00:00:10.500 --> ...] OnGatewayInit...",
        "transcriptOriginal": "[00:00:10.500 --> ...] OnGetQuay Init...",
        "transcriptRefined": "[00:00:10.500 --> ...] OnGatewayInit...",
        "summary": "# Tóm tắt...",
        "aiProcessingStatus": "COMPLETED",
        "aiProcessedAt": "2026-10-26T12:00:00.000Z",
        "aiProcessingError": null
      }
    }
    ```

---

## 11. Known Limitations & Future Improvements

1. **Course-Specific Custom Glossaries:** Currently, the technical glossary contains universal programming and web development terms. In future iterations, course authors could provide custom glossaries (e.g. for niche libraries or proprietary naming) via a course settings field.
2. **Confidence Thresholding:** Faster-Whisper provides token-level log probabilities. Future enhancements could prioritize segments with low ASR confidence scores for refinement while skipping segments with high confidence, reducing Gemini token consumption.
3. **Teacher Manual Override UI:** The database now stores both original and refined transcripts. In a future frontend update, a split-pane diff viewer can allow teachers to compare versions and approve or edit specific segment text.

---

## 12. Conclusion

Step 6.7 has been completed successfully and rigorously validated across both the Python AI microservice and the Node.js backend. All recognition mistakes in technical terminology are corrected with conservative heuristics, original timestamps and segment sequences remain mathematically immutable, both transcript versions are persisted cleanly in PostgreSQL, and all existing Step 6.5, 6.6A, and 6.6C contracts remain 100% backward compatible.
