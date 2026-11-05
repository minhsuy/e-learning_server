# TMdemy Telegram Teacher Bot — TG-02A Implementation Report
## Secure Teacher Account Linking & Multi-Teacher Authorization (Backend)

**Document ID:** `TG-02A-IMPL-REPORT-001`  
**Date:** November 4, 2026  
**Status:** `COMPLETED & VERIFIED` (25/25 Tests Passed)  
**Target Systems:**  
- TMdemy Node.js Express Backend (`e-learning_server`)
- Target Database: PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
- Telegram Bot API: grammY 1.46+ long polling / webhook ready
- Migration: `20261104132752_add_telegram_teacher_linking`

---

## 1. Executive Summary & Features Implemented

The goal of **TG-02A: Secure Teacher Account Linking & Authorization** is to establish cryptographic, race-safe, and multi-tenant account binding between verified TMdemy course instructors and their personal Telegram accounts.

### 1.1 Core Deliverables
1. **Prisma Relational Models & Migration**:
   - `TelegramAccount`: Physical table `telegram_accounts` enforcing a strict 1-to-1 relationship between TMdemy `User.id` and Telegram `telegramUserId` (64-bit integer / BigInt).
   - `TelegramLinkToken`: Physical table `telegram_link_tokens` managing single-use, 15-minute lifespan tokens stored strictly as SHA-256 hashes.
2. **Authenticated Teacher REST Endpoints**:
   - `POST /api/teacher/telegram/link-token`: Generates a single-use 256-bit cryptographic link token and Telegram deep link (`https://t.me/<bot>?start=link_<token>`).
   - `GET /api/teacher/telegram/status`: Queries linking status with BigInt safely serialized to string.
   - `DELETE /api/teacher/telegram/unlink`: Revokes the Telegram binding for the authenticated teacher.
3. **Telegram Bot Commands & Interactive Flows**:
   - `/link <token>`: Validates and consumes the link token, binding the Telegram account in a single atomic transaction.
   - `/start link_<token>`: Deep-link one-click linking directly from the TMdemy web portal.
   - `/account`: Displays verified teacher profile (masked email, role, Telegram numeric ID, link timestamp) or unlinked guidance.
   - `/unlink` & `/unlink confirm`: Two-step interactive unlinking with inline keyboard buttons (`unlink_confirm`, `unlink_cancel`) and direct confirmation arguments.
   - Updated `/start`, `/help`, and `/status` to reflect the account-linking features.
4. **Reusable Bot Authorization**:
   - `requireTeacherAuth`: GrammY middleware that resolves the teacher by `ctx.from.id`, re-verifies `role === 'TEACHER'` and `status === 'ACTIVE'` in PostgreSQL, and prevents unauthorized access to future analytics.

---

## 2. Architecture & Security Decisions

```
[ TMdemy Web Teacher Portal ]
            │
            │ 1. POST /api/teacher/telegram/link-token (Bearer JWT)
            ▼
[ TMdemy Backend Service ]
   ├── Verifies User.role === 'TEACHER' and status === 'ACTIVE'
   ├── Generates 256-bit rawToken (crypto.randomBytes(32))
   ├── Computes SHA-256 hash (never stores raw token)
   ├── Sets 15-minute expiration (expiresAt)
   └── Returns { token, deepLink: "https://t.me/<bot>?start=link_<rawToken>" }
            │
            │ 2. Teacher clicks deep link or sends /link <token>
            ▼
[ Telegram Cloud Platform ] ──(Encrypted 1-on-1 Chat)──> [ grammY Bot ]
                                                               │
   ┌───────────────────────────────────────────────────────────┘
   │ 3. Atomic Linking Transaction (consumeLinkTokenAndBindService)
   ▼
[ PostgreSQL 16.11 (tmdemy) ]
   ├── 1. Find active token by tokenHash (isConsumed = false, expiresAt > now)
   ├── 2. Verify TMdemy User is ACTIVE and has TEACHER role
   ├── 3. Guard against duplicate Telegram ID linking (Unique constraint)
   ├── 4. Guard against duplicate Teacher User ID linking (Unique constraint)
   ├── 5. Mark token isConsumed = true, consumedAt = now, consumedByTelegramId = ctx.from.id
   └── 6. Insert into telegram_accounts table
```

### 2.1 Security & Multi-Teacher Invariants
1. **Telegram Numeric ID (BigInt) vs. Username Spoofing**:
   - Telegram usernames (`@username`) are mutable, optional, and spoofable.
   - TMdemy identification relies exclusively on `ctx.from.id` (Telegram's immutable numeric 64-bit User ID).
2. **Single-Use, Hashed Tokens**:
   - Raw tokens are 64-character hexadecimal strings generated via `crypto.randomBytes(32)`.
   - The database stores only the SHA-256 hash. A database compromise does not reveal active tokens.
   - Once consumed, the token cannot be reused (`isConsumed: true`).
3. **Atomic Concurrency Protection**:
   - Token lookup, verification, token consumption, and account creation execute inside an atomic `prisma.$transaction`. Concurrent attempts to consume the same token result in exactly one success and all others failing.
4. **Private Chat Isolation**:
   - All linking, unlinking, and account commands are gated by `requirePrivateChat`. Invocations inside group chats are rejected with privacy security warnings.
5. **No Overwrite Without Unlinking**:
   - Generating a token for an already-linked teacher returns HTTP 409 Conflict.
   - An existing link cannot be overwritten silently; it must be unlinked explicitly via `/unlink` or `DELETE /api/teacher/telegram/unlink`.

---

## 3. Database Schema Changes & Migration

Migration name: `20261104132752_add_telegram_teacher_linking`

### 3.1 `telegram_accounts` Table
```sql
CREATE TABLE "telegram_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "telegram_chat_id" BIGINT NOT NULL,
    "telegram_username" VARCHAR(100),
    "telegram_first_name" VARCHAR(100),
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "telegram_accounts_user_id_key" ON "telegram_accounts"("user_id");
CREATE UNIQUE INDEX "telegram_accounts_telegram_user_id_key" ON "telegram_accounts"("telegram_user_id");
CREATE INDEX "telegram_accounts_telegram_user_id_idx" ON "telegram_accounts"("telegram_user_id");
CREATE INDEX "telegram_accounts_user_id_idx" ON "telegram_accounts"("user_id");

ALTER TABLE "telegram_accounts" ADD CONSTRAINT "telegram_accounts_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 3.2 `telegram_link_tokens` Table
```sql
CREATE TABLE "telegram_link_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_consumed" BOOLEAN NOT NULL DEFAULT false,
    "consumed_at" TIMESTAMP(3),
    "consumed_by_telegram_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_link_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "telegram_link_tokens_token_hash_key" ON "telegram_link_tokens"("token_hash");
CREATE INDEX "telegram_link_tokens_user_id_is_consumed_idx" ON "telegram_link_tokens"("user_id", "is_consumed");
CREATE INDEX "telegram_link_tokens_expires_at_is_consumed_idx" ON "telegram_link_tokens"("expires_at", "is_consumed");
CREATE INDEX "telegram_link_tokens_token_hash_idx" ON "telegram_link_tokens"("token_hash");

ALTER TABLE "telegram_link_tokens" ADD CONSTRAINT "telegram_link_tokens_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 4. Files Created & Modified

| File | Status | Description |
| :--- | :---: | :--- |
| [`prisma/schema.prisma`](file:///d:/e-learning-project/e-learning_server/prisma/schema.prisma) | **Modified** | Added `TelegramAccount` and `TelegramLinkToken` models, and relations on `User`. |
| `prisma/migrations/20261104132752_add_telegram_teacher_linking/migration.sql` | **Created** | PostgreSQL migration establishing tables, indexes, constraints, and cascading FKs. |
| [`src/models/telegramAccount.model.ts`](file:///d:/e-learning-project/e-learning_server/src/models/telegramAccount.model.ts) | **Created** | Zod schemas and TypeScript DTOs with string serialization for BigInt fields. |
| [`src/repositories/telegramAccount.repository.ts`](file:///d:/e-learning-project/e-learning_server/src/repositories/telegramAccount.repository.ts) | **Created** | Functional repository for `telegram_accounts` and `telegram_link_tokens`. |
| [`src/repositories/index.ts`](file:///d:/e-learning-project/e-learning_server/src/repositories/index.ts) | **Modified** | Re-exported `telegramAccountRepository`. |
| [`src/services/telegramTeacher.service.ts`](file:///d:/e-learning-project/e-learning_server/src/services/telegramTeacher.service.ts) | **Created** | Business logic, cryptographic token generation, atomic linking transaction, unlinking, and profile resolution. |
| [`src/controller/telegramTeacher.controller.ts`](file:///d:/e-learning-project/e-learning_server/src/controller/telegramTeacher.controller.ts) | **Created** | Express controllers for link-token generation, status check, and unlinking. |
| [`src/middlewares/telegramTeacher.middleware.ts`](file:///d:/e-learning-project/e-learning_server/src/middlewares/telegramTeacher.middleware.ts) | **Created** | In-memory rolling rate limiter for link-token requests (max 10 requests / 15 mins). |
| [`src/routes/teacher.route.ts`](file:///d:/e-learning-project/e-learning_server/src/routes/teacher.route.ts) | **Modified** | Mounted `/telegram/link-token`, `/telegram/status`, and `/telegram/unlink` on `teacherRouter`. |
| [`src/telegram/types.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/types.ts) | **Modified** | Added `teacherProfile` to `TeacherBotContext`. |
| [`src/telegram/middleware/teacherAuth.middleware.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/middleware/teacherAuth.middleware.ts) | **Created** | Reusable bot middleware verifying linked teacher status before granting access to analytics. |
| [`src/telegram/handlers/commands.handler.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/handlers/commands.handler.ts) | **Modified** | Added `/link`, `/account`, `/unlink`, deep-link `/start link_<token>`, and inline button callbacks. |
| [`src/telegram/bot.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/bot.ts) | **Modified** | Registered new bot commands and callback query handlers. |
| [`src/telegram/index.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/index.ts) | **Modified** | Re-exported `requireTeacherAuth`. |
| [`scripts/test_tg02a_linking_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg02a_linking_suite.ts) | **Created** | Automated test suite verifying all 13 required scenarios. |
| [`api/tg02_account_linking_api.md`](file:///d:/e-learning-project/e-learning_server/api/tg02_account_linking_api.md) | **Created** | Comprehensive API specification for frontend developers. |
| [`docs/api/TG02_ACCOUNT_LINKING_API.md`](file:///d:/e-learning-project/e-learning_server/docs/api/TG02_ACCOUNT_LINKING_API.md) | **Created** | Synced documentation inside central docs directory. |

---

## 5. Endpoints & Command Reference

### 5.1 REST Endpoints
| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/teacher/telegram/link-token` | `POST` | `TEACHER` | Generates a 15-minute single-use token and Telegram deep link. |
| `/api/teacher/telegram/status` | `GET` | `TEACHER` | Returns `{ isLinked: boolean, account: ... }`. |
| `/api/teacher/telegram/unlink` | `DELETE` | `TEACHER` | Unlinks the teacher's Telegram account from TMdemy. |

### 5.2 Telegram Bot Commands
| Command | Mode | Description |
| :--- | :---: | :--- |
| `/start link_<token>` | Private | Consumes deep-link token and binds account in one tap. |
| `/link <token>` | Private | Manually binds account using the 64-hex linking token. |
| `/account` | Private | Displays linked teacher username, masked email, role, and Telegram ID. |
| `/unlink` | Private | Displays confirmation dialog with inline buttons or `/unlink confirm`. |
| `/status` | Private | Shows system readiness and caller's linking state. |

---

## 6. Automated Test Results (25/25 PASS)

The test suite [`scripts/test_tg02a_linking_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg02a_linking_suite.ts) was executed via `npx.cmd tsx`:

```text
====================================================
     TG-02A: TEACHER ACCOUNT LINKING TEST SUITE     
====================================================

--- TEST 1: Valid Teacher Linking Flow ---
  ✓ [PASS] #1: Teacher successfully generated link token
  ✓ [PASS] #1: Token expiration is configured to 15 minutes
  ✓ [PASS] #1: Deep link includes start=link_<token> parameter
  ✓ [PASS] #1: consumeLinkTokenAndBindService returns success
  ✓ [PASS] #1: TelegramAccount record persisted with matching Telegram numeric ID
  ✓ [PASS] #1: Link token is marked isConsumed = true

--- TEST 2: Invalid & Expired Token Rejection ---
  ✓ [PASS] #2: Non-existent token is rejected with error message
  ✓ [PASS] #2: Expired token is rejected

--- TEST 3: Reused Token Rejection ---
  ✓ [PASS] #3: Reused token is strictly rejected

--- TEST 4: Non-Teacher Role Rejection ---
  ✓ [PASS] #4: Student account is rejected from generating Telegram link tokens (403 Forbidden)

--- TEST 5: Duplicate Telegram Account Linking Prevention ---
  ✓ [PASS] #5: Teacher 2 generates valid link token
  ✓ [PASS] #5: Attempt to link an already-linked Telegram ID to a second teacher is rejected

--- TEST 6: Duplicate TMdemy Account Linking Prevention ---
  ✓ [PASS] #6: Teacher 1 cannot generate new link token while an active Telegram account is linked (409 Conflict)

--- TEST 7: Concurrent Token Consumption Race-Safety ---
  ✓ [PASS] #7: Atomic transaction guarantees exactly one consumer succeeds and one fails under race conditions

--- TEST 8: Unauthorized REST Request Protection ---
  ✓ [PASS] #8: Request without Authorization header returns 401
  ✓ [PASS] #8: Student JWT accessing teacher Telegram status returns 403 Forbidden
  ✓ [PASS] #8: Teacher JWT receives 200 OK with isLinked: true

--- TEST 9: Cross-Teacher Isolation ---
  ✓ [PASS] #9: Teacher 1 and Teacher 2 retrieve strictly isolated Telegram account records

--- TEST 10: /account Command Handling ---
  ✓ [PASS] #10: /account for linked teacher returns teacher username and masked email
  ✓ [PASS] #10: /account for unlinked user returns unlinked advisory notice

--- TEST 11: /unlink Confirmation & Removal ---
  ✓ [PASS] #11: /unlink displays confirmation prompt with inline keyboard options
  ✓ [PASS] #11: /unlink confirm performs successful unlinking
  ✓ [PASS] #11: TelegramAccount record deleted from PostgreSQL

--- TEST 12: Group Chat Privacy Restriction ---
  ✓ [PASS] #12: /account executed in group chat is blocked with privacy warning

--- TEST 13: Backend REST Stability Offline ---
  ✓ [PASS] #13: REST link-token generation operates independently of Telegram connectivity

====================================================
RESULTS: PASSED: 25 | FAILED: 0 | BLOCKED: 0 | NOT TESTED: 0
====================================================
```

### TG-01 Regression Suite Verification
- [`scripts/test_tg01_telegram_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg01_telegram_suite.ts): **24/24 PASS** (with live `@tmdemy_bot` `getMe` verification).

---

## 7. Next Steps for TG-02B (Frontend Integration)

With the backend foundation complete and verified, the Next.js client team can proceed with **TG-02B**:
1. **Teacher Settings UI ("Telegram Analytics" Section)**:
   - Component: `<TelegramLinkingCard />`
   - Check status on mount: `GET /api/teacher/telegram/status`.
   - If unlinked:
     - Render "Liên kết tài khoản Telegram" button.
     - On click: call `POST /api/teacher/telegram/link-token`.
     - Display countdown timer (15 minutes).
     - Render "Mở Bot Telegram" primary CTA (`<a href={deepLink} target="_blank">`).
     - Display raw 64-char token with copy button for manual `/link <token>` input.
   - If linked:
     - Render badge: "✅ Đã liên kết: @username (ID: ...)".
     - Render "Hủy liên kết" button triggering confirmation modal calling `DELETE /api/teacher/telegram/unlink`.
2. **Auto-Polling on Web**:
   - Web client polls `GET /api/teacher/telegram/status` every 3 seconds while modal is open to automatically detect successful Telegram binding and update UI.

