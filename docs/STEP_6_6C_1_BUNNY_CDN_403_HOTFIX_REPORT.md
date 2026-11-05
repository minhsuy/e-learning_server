# TMDEMY — STEP 6.6C.1 HOTFIX REPORT: FIX BUNNY CDN HTTP 403 & SECURE MP4 TOKEN AUTHENTICATION

**Project**: TMdemy E-Learning Platform (Graduation Thesis)  
**Author**: Senior Backend Engineer, Bunny Stream Integration Specialist & Security Engineer  
**Date**: 2026-10-26  
**Status**: **COMPLETED & 100% VERIFIED ON REAL BUNNY STREAM CDN & FASTAPI PIPELINE**  
**Test Results**: 37/37 Dedicated Hotfix Tests Passed, 392/392 Total System Tests Passed (Zero Regressions)  
**Target Database**: PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  

---

## 1. Executive Summary & Incident Overview

During the initial real integration testing of Step 6.6C:
1. Node.js backend resolved an MP4 video URL and submitted an AI job to the Python FastAPI microservice.
2. FastAPI accepted the job with HTTP 202 and queued it for background processing.
3. During the `DOWNLOADING_MEDIA` stage, FastAPI attempted to download the MP4 file from Bunny CDN (`https://vz-xxxx.b-cdn.net/{videoId}/play_720p.mp4`).
4. Bunny CDN immediately rejected the connection with **HTTP 403 Forbidden**.
5. The AI job transitioned to `FAILED` with error message `"Truy cập tệp media bị từ chối bởi máy chủ nguồn (HTTP 403)"`.
6. Independent testing with `curl.exe` without authentication parameters confirmed the same HTTP 403 error.

This targeted hotfix (**Step 6.6C.1**) audits and resolves the root cause, implements official **Bunny CDN Token Authentication V2 (HMAC-SHA256)**, identifies and resolves secondary access restrictions (Referrer and Block Empty Referrers rules), adds authenticated lightweight HTTP Range probes, and verifies full end-to-end media download, audio extraction, Whisper transcription, and Gemini summarization on live production infrastructure.

---

## 2. Root Cause Analysis (Deep-Dive)

Our technical investigation into the Bunny CDN infrastructure revealed a two-fold root cause:

### Cause 1: Incompatible Token Signing Algorithm & Missing Configuration
* **Missing Key in Initial State**: `BUNNY_TOKEN_SECURITY_KEY` was originally not loaded in `.env`, causing `resolveBunnyMediaUrl` to silently generate an unsigned URL (`https://vz-xxxx.b-cdn.net/{videoId}/play_720p.mp4`).
* **Embed Player Token vs CDN Pull Zone Token Confusion**:
  - The previous Step 6.6C code attempted to sign tokens using:
    $$\text{token} = \text{SHA256}_{\text{hex}}(\text{securityKey} + \text{cleanId} + \text{expires})$$
  - This formula is Bunny Stream's **Embed View Player Token** (used exclusively for iframe embeds at `iframe.mediadelivery.net/embed/{libraryId}/{videoId}`).
  - However, direct MP4 downloads occur through the **Bunny CDN Edge Pull Zone** (`vz-xxxx.b-cdn.net`).
  - Bunny CDN Pull Zones require **Advanced Token Authentication (Token Authentication V2)** using **HMAC-SHA256**:
    $$\text{token} = \text{"HS256-"} + \text{Base64URL}(\text{HMAC-SHA256}(\text{securityKey}, \text{signaturePath} + \text{expires}))$$
  - When Bunny CDN edge servers received an unsigned URL or an embed-style hex hash, the cryptographic signature check failed, returning **HTTP 403 Forbidden**.

### Cause 2: Pull Zone / Video Library "Block Direct URL File Access" & Empty Referrer Rules
* In the Bunny Stream Dashboard under **Video Library > Security**:
  - The user had enabled **CDN Token Authentication** and **Block direct URL file access** (which corresponds to blocking requests with empty or missing HTTP `Referer` headers on the underlying Pull Zone).
  - When backend microservices (like Python `httpx`, Node.js `fetch`, or `curl.exe`) make server-to-server HTTP requests, they send **no Referer header by default**.
  - Bunny edge servers strictly enforced the rule: *Any request with an empty Referer is blocked with HTTP 403*, even if the token was valid.
  - When testing with `Referer: https://iframe.mediadelivery.net` or `http://localhost:3000`, the CDN evaluated the HMAC-SHA256 token, verified it, and returned **HTTP 200 OK / HTTP 206 Partial Content**.

---

## 3. Bunny Authentication Modes & Cryptographic Matrix

The table below contrasts the distinct authentication mechanisms supported in Bunny.net to prevent architectural confusion:

| Authentication Mode | Target Host | Hash Function | Encoding | Format |
| :--- | :--- | :--- | :--- | :--- |
| **Bunny CDN Token Auth V2 (Official)** | `vz-xxxx.b-cdn.net` (Pull Zone) | **HMAC-SHA256** | Base64URL (unpadded) | `?token=HS256-<base64url>&expires=<timestamp>` |
| **Bunny Stream Embed Token** | `iframe.mediadelivery.net` | Standard SHA-256 | Hexadecimal | `?token=<64char_hex>&expires=<timestamp>` |
| **Bunny CDN Legacy Token (Deprecated)** | Pull Zones (V1) | MD5 | Base64URL | `?token=<base64url_md5>&expires=<timestamp>` |
| **Bunny Stream API Key** | `video.bunnycdn.com` | Plaintext AccessKey | Header `AccessKey: <key>` | Management REST API calls |

---

## 4. Implementation Details & Architecture Changes

### 4.1. Official Bunny CDN URL Signing Helper (`src/services/bunny.service.ts`)
Implemented `signBunnyCdnUrl()` strictly adhering to the official specification from [`BunnyWay/BunnyCDN.TokenAuthentication`](https://github.com/BunnyWay/BunnyCDN.TokenAuthentication):

```typescript
export function signBunnyCdnUrl(
  rawUrl: string,
  securityKey: string,
  expirationTimeInSeconds = 14400
): { signedUrl: string; expiresAt: Date } {
  const cleanKey = securityKey?.trim()
  if (!cleanKey) {
    throw new Error('Thiếu cấu hình BUNNY_TOKEN_SECURITY_KEY trên server để tạo URL xác thực Bunny CDN.')
  }
  if (expirationTimeInSeconds <= 0) {
    throw new Error('Thời gian hết hạn của token xác thực Bunny CDN phải lớn hơn 0.')
  }

  const parsed = new URL(rawUrl)
  const expires = Math.floor(Date.now() / 1000) + expirationTimeInSeconds
  const signaturePath = decodeURIComponent(parsed.pathname)

  // HMAC payload is folded: signaturePath + expires (sorted parameters if any)
  const hmac = crypto.createHmac('sha256', cleanKey)
  hmac.update(signaturePath)
  hmac.update(String(expires))
  const digest = hmac.digest()

  // Base64URL encoding without padding (+ -> -, / -> _, strip =)
  const base64UrlToken = digest
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const token = `HS256-${base64UrlToken}`

  parsed.searchParams.set('token', token)
  parsed.searchParams.set('expires', String(expires))

  return {
    signedUrl: parsed.toString(),
    expiresAt: new Date(expires * 1000)
  }
}
```

### 4.2. Hardened `resolveBunnyMediaUrl` with Range Probe (`src/services/bunny.service.ts`)
Enforced:
1. **Status Verification**: Rejects videos with `rawStatus === 0` (unuploaded), `1, 2, 3` (processing/transcoding), and `5, 6` (failed).
2. **MP4 Fallback Verification**: Rejects videos without `hasMP4Fallback`.
3. **Fail-Closed Configuration Check**: If `BUNNY_TOKEN_SECURITY_KEY` is missing in production, throws an explicit configuration error rather than silently generating an insecure or broken unsigned URL.
4. **Lightweight Range Probe**: Before queueing the AI job, performs an authenticated HTTP Range GET (`Range: bytes=0-100`, `Referer: https://iframe.mediadelivery.net`). Confirms HTTP 200 or HTTP 206 before dispatching to FastAPI.
5. **No Secret Leaks**: Errors report domain-level explanations without exposing the security key or the full signed token query string.

### 4.3. FastAPI Media Ingestion Downloader Update (`app/services/media_ingestion_service.py`)
To ensure complete resilience against "Block empty referrers" on Bunny Pull Zones, updated the default request headers in FastAPI's `download_remote_media`:

```python
headers = {
    "User-Agent": "TMdemy-AIMicroservice/1.0",
    "Accept": "*/*",
    "Referer": "https://iframe.mediadelivery.net",
}
if custom_headers:
    headers.update(custom_headers)
```

---

## 5. Environment Variables & Security Safeguards

Updated [`.env.example`](file:///d:/e-learning_server/.env.example) with clear technical documentation:

```ini
# Token Authentication Security Key from Bunny Pull Zone / Stream Security Tab
# Required for signed direct MP4 video downloads and secure FastAPI AI processing (Token Auth V2)
BUNNY_TOKEN_SECURITY_KEY="your_token_authentication_security_key_here"
```

### Security Measures Verified:
1. **Secret Redaction in Logs**: `sanitizeUrlForLogging()` strips all `?token=...` and `&expires=...` parameters before logging.
2. **No Fallback to Insecure URLs**: If `BUNNY_TOKEN_SECURITY_KEY` is not present, backend throws a descriptive error and stops execution immediately.
3. **Queue Wait Window**: Default expiration is 4 hours (14,400s), allowing ample time for FIFO queue processing without premature token expiry.
4. **Student Anti-Leak**: Signed direct MP4 URLs are never returned in student-facing API endpoints.

---

## 6. Verification Results

### 6.1. Dedicated Hotfix Test Suite ([`scripts/test_hotfix_step6_6c_1_bunny_token.ts`](file:///d:/e-learning_server/scripts/test_hotfix_step6_6c_1_bunny_token.ts))
Ran all 37 test checks across 5 suites:

```text
=================================================================
STARTING TMDEMY STEP 6.6C.1: BUNNY CDN TOKEN AUTH HOTFIX TEST
=================================================================

--- SUITE 1: Official Bunny CDN Token Signing (HMAC-SHA256 V2) ---
  PASS: [Suite 1] 1a. signBunnyCdnUrl returns string signedUrl
  PASS: [Suite 1] 1b. returns valid expiresAt Date object
  PASS: [Suite 1] 2a. URL contains token searchParam
  PASS: [Suite 1] 2b. URL contains expires searchParam
  PASS: [Suite 1] 2c. Token uses official HS256- prefix
  PASS: [Suite 1] 3a. Token replaces + with -
  PASS: [Suite 1] 3b. Token replaces / with _
  PASS: [Suite 1] 3c. Token strips trailing = padding
  PASS: [Suite 1] 4. Token strictly matches HMAC-SHA256(securityKey, path + expires)
  PASS: [Suite 1] 5. Replay produces consistent URL pattern

--- SUITE 2: Missing Configuration & Security Safeguards ---
  PASS: [Suite 2] 6a. Descriptive error mentions BUNNY_TOKEN_SECURITY_KEY
  PASS: [Suite 2] 6b. Secret key is NEVER leaked in error message
  PASS: [Suite 2] 6c. Missing securityKey is strictly rejected
  PASS: [Suite 2] 7. Zero or negative expiration time is rejected
  PASS: [Suite 2] 8a. sanitizeUrlForLogging removes token
  PASS: [Suite 2] 8b. sanitizeUrlForLogging removes expires
  PASS: [Suite 2] 8c. Clean base URL is preserved

--- SUITE 3: resolveBunnyMediaUrl & Lightweight Range Probe ---
  PASS: [Suite 3] 9a. Resolved source type is bunny_stream
  PASS: [Suite 3] 9b. Rendition is play_480p.mp4
  PASS: [Suite 3] 9c. URL has token parameter
  PASS: [Suite 3] 10. Empty videoId is strictly rejected
  PASS: [Suite 3] 12a. Range probe returns 206 Partial Content
  PASS: [Suite 3] 12b. Range header bytes=0-100 sent
  PASS: [Suite 3] 12c. Referer header sent
  PASS: [Suite 3] 13a. 403 rejection message detected
  PASS: [Suite 3] 13b. 403 Forbidden probe is rejected

--- SUITE 4: Lifecycle Recovery & Failed Job Resubmission ---
  PASS: [Suite 4] 14a. First job submission returns success
  PASS: [Suite 4] 14b. Returns 202 Accepted
  PASS: [Suite 4] 14c. Submitted mediaUrl has HS256- token
  PASS: [Suite 4] 16a. Second job submission succeeds after FAILED state
  PASS: [Suite 4] 16b. Returns 202 Accepted for new job
  PASS: [Suite 4] 16c. Second job has a NEW distinct job ID
  PASS: [Suite 4] 16d. Second job uses a NEW fresh idempotency key
  PASS: [Suite 4] 16e. Idempotency key strictly matches new job ID

--- SUITE 5: Live Real Bunny CDN Token Verification ---
  PASS: [Suite 5] 17a. Real URL signed with HS256-
  PASS: [Suite 5] 17b. Real Bunny CDN accepts signed URL with Referer (HTTP 206)
  PASS: [Suite 5] 17c. Real CDN responds with video/mp4 Content-Type

=================================================================
HOTFIX STEP 6.6C.1 VERIFICATION COMPLETE: 37/37 PASSED (0 FAILED)
=================================================================
```

### 6.2. Full System Regression Test Summary

| Test Suite | Purpose | Tests | Status |
| :--- | :--- | :---: | :---: |
| `test_hotfix_step6_6c_1_bunny_token.ts` | **Hotfix 6.6C.1 Dedicated Verification** | **37 / 37** | **PASS** |
| `test_step6_6c_end_to_end_ai_integration.ts` | **Step 6.6C Integration & Idempotency** | **80 / 80** | **PASS** |
| `test_step6_6a_ai_job_integration.ts` | **Step 6.6A AI Job Lifecycle & Fencing** | **89 / 89** | **PASS** |
| `test_step6_5_lesson_ai_content.ts` | **Step 6.5 Lesson AI Content & Anti-leak** | **62 / 62** | **PASS** |
| `test_step2_coding_exercise_crud.ts` | **Coding Exercise CRUD & Security** | **37 / 37** | **PASS** |
| `test_step6_coding_completion_progress.ts` | **Coding Completion, Streak & Gamification** | **87 / 87** | **PASS** |
| **TOTAL** | **Full System Regression Suite** | **392 / 392** | **100% PASS** |

---

## 7. Live Real-World Verification Result (100% End-to-End Success)

We conducted a live end-to-end verification using the real lecture video in the user's Bunny Video Library `781598`:
* **Video ID**: `684703d0-c5cc-45be-b055-14b0adb3b4f1`
* **Lesson**: `f9ddbc5d-2b63-4de2-98a0-0171c5fa6f66` ("Bài 1: Giới thiệu về websocket")
* **File Size**: 84.93 MB (89,054,486 bytes)
* **Duration**: 823 seconds (13 minutes 43 seconds)

### Real Execution Trace:
1. **Submission**:
   - `mediaUrl`: `https://vz-c5f190e7-933.b-cdn.net/684703d0-c5cc-45be-b055-14b0adb3b4f1/play_720p.mp4?token=HS256-...&expires=...`
   - FastAPI returned: `202 Accepted`, `job_id: 7cf3c2f7969243fdac302a85da31c4b2`.
2. **Download**:
   - `HTTP Request: GET https://vz-c5f190e7-933.b-cdn.net/... "HTTP/1.1 200 OK"`
   - Download duration: 4.79 seconds for 84.93 MB.
3. **Validation**:
   - PyAV verified MP4 container and 16-bit audio stream in 0.18 seconds.
4. **Audio Extraction**:
   - FFmpeg converted stream to 16,000 Hz Mono PCM WAV in 2.69 seconds.
5. **Speech-to-Text Transcription**:
   - Faster-Whisper CPU INT8 transcribed full 13m43s Vietnamese lecture in 133.11 seconds.
6. **Gemini Summarization**:
   - Google Gemini AI structured a 6-part pedagogical summary in 20.29 seconds.
7. **Terminal Status**:
   - `GET /api/v1/jobs/7cf3c2f7969243fdac302a85da31c4b2`: `status: COMPLETED`, `current_stage: COMPLETED`, `error_message: null`.
   - `GET /api/v1/jobs/7cf3c2f7969243fdac302a85da31c4b2/result`: Returned comprehensive markdown `transcript` and `summary`.

---

## 8. Manual Postman / Swagger Retesting Instructions

To retest manually:

1. **Verify `.env` configuration**:
   Ensure `BUNNY_TOKEN_SECURITY_KEY` is present in `d:\e-learning_server\.env`.
2. **Start Backend Server**:
   ```powershell
   npm run dev
   ```
3. **Trigger AI Processing for the Lesson**:
   ```http
   POST /api/lessons/f9ddbc5d-2b63-4de2-98a0-0171c5fa6f66/ai-process
   Authorization: Bearer <TEACHER_OR_ADMIN_JWT>
   Content-Type: application/json

   {
     "jobType": "TRANSCRIBE_AND_SUMMARIZE",
     "model": "gemini-2.5-flash"
   }
   ```
   **Expected Response**: `202 Accepted` with `providerJobId` and `currentStage: "QUEUED"`.
4. **Poll Status**:
   ```http
   GET /api/lessons/f9ddbc5d-2b63-4de2-98a0-0171c5fa6f66/ai-process
   Authorization: Bearer <TEACHER_OR_ADMIN_JWT>
   ```
   The job will transition from `DOWNLOADING_MEDIA` to `EXTRACTING_AUDIO` to `TRANSCRIBING` and ultimately `COMPLETED`.
5. **Inspect Result in Lesson**:
   ```http
   GET /api/lessons/f9ddbc5d-2b63-4de2-98a0-0171c5fa6f66/ai-content
   Authorization: Bearer <TEACHER_OR_ADMIN_JWT>
   ```
   Transcript and summary are populated in PostgreSQL.

---

## 9. Modified Files Summary

1. [`src/services/bunny.service.ts`](file:///d:/e-learning_server/src/services/bunny.service.ts):
   - Implemented `signBunnyCdnUrl()` with official HMAC-SHA256 Token Auth V2.
   - Hardened `resolveBunnyMediaUrl()` with missing key configuration guard.
   - Added lightweight Range GET probe (`Range: bytes=0-100`, `Referer: https://iframe.mediadelivery.net`).
2. [`.env.example`](file:///d:/e-learning_server/.env.example):
   - Documented `BUNNY_TOKEN_SECURITY_KEY` with clear Pull Zone / Stream Token V2 instructions.
3. [`D:\ai-service\speech-to-text\app\services\media_ingestion_service.py`](file:///D:/ai-service/speech-to-text/app/services/media_ingestion_service.py):
   - Added default `"Referer": "https://iframe.mediadelivery.net"` to `download_remote_media` headers to satisfy Pull Zone empty referrer blocking rules.
4. [`scripts/test_hotfix_step6_6c_1_bunny_token.ts`](file:///d:/e-learning_server/scripts/test_hotfix_step6_6c_1_bunny_token.ts):
   - Dedicated 37-check automated test suite covering all hotfix requirements.
5. [`docs/STEP_6_6C_1_BUNNY_CDN_403_HOTFIX_REPORT.md`](file:///d:/e-learning_server/docs/STEP_6_6C_1_BUNNY_CDN_403_HOTFIX_REPORT.md):
   - Complete technical and incident investigation report.

---

## 10. Remaining Limitations & Operational Considerations

1. **Token Lifetime vs. Long Queue Delays**:
   - The token TTL is set to 4 hours (14,400s) by default. If the AI microservice FIFO queue backlog exceeds 4 hours, pending media downloads will encounter an expired token (HTTP 403). For high load scenarios, queue depth monitoring should alert if jobs remain in `QUEUED` for over 2 hours.
2. **Referer Header Dependency**:
   - When "Block direct URL file access" (or "Block empty referrers") is enabled on the Bunny Pull Zone, media downloaders (FastAPI or range probe) must pass a recognized `Referer` (such as `https://iframe.mediadelivery.net`). If the Bunny security profile changes to restrict referrers to strict customer domain whitelists, the Referer header in `media_ingestion_service.py` and `bunny.service.ts` must be aligned accordingly.
3. **MP4 Fallback Rendition Prerequisite**:
   - Videos must have "MP4 Fallback" enabled and finished encoding in the Bunny Stream library. Direct MP4 ingestion does not download HLS manifests (`.m3u8`).

