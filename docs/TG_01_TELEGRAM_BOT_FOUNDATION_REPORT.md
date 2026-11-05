# TMdemy Telegram Teacher Bot — TG-01 Foundation Implementation Report
## Architectural Foundation & Telegram Bot Lifecycle Integration

**Document ID:** `TG-01-FOUNDATION-REPORT-001`  
**Date:** November 4, 2026  
**Status:** `COMPLETED`  
**Engine:** Node.js 22+ / TypeScript 5.8+ / grammY 1.46+  
**Target Systems:**  
- TMdemy Node.js Express Backend (`e-learning_server`)
- Target Database: PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
- Telegram Bot API (via long polling for development)

---

## 1. Executive Summary & Objectives

The goal of **TG-01: TMdemy Telegram Teacher Bot Foundation** is to establish a secure, robust, and non-blocking Telegram Bot infrastructure integrated into the existing TMdemy backend.

This foundation prepares the system for the multi-teacher analytics platform that will allow educators to:
1. Query sales, revenue, and payout figures for their own authored courses.
2. Monitor order statuses (successful, pending, canceled).
3. Track student enrollment progress and completion statistics.
4. Receive automated periodic (daily/weekly) business reports.

### TG-01 Scope Boundaries & Invariants
- **Non-blocking Express API**: Any failure, network timeout, or bot configuration issue must never crash or interrupt the Express REST API.
- **Strict Role & Data Isolation**: No course, order, student, or revenue data is exposed in TG-01. Account-linking and credential binding are deferred to TG-02.
- **Telegram Numeric User ID as Primary Identifier**: Identification relies exclusively on Telegram's immutable numeric 64-bit User ID (`ctx.from.id`). Telegram `@username` is explicitly treated as unverified cosmetic metadata.
- **Private Chat Enforcement**: To protect sensitive financial and student data, bot interactions are strictly constrained to 1-on-1 private conversations (`ctx.chat.type === 'private'`).
- **Secret Isolation**: `TELEGRAM_BOT_TOKEN` is kept in server environment variables and masked in logs (`maskTelegramToken`).

---

## 2. Architecture & Design Decisions

```
[ Telegram Cloud Platform ]
           │
           │  Long Polling (getUpdates / runner)
           ▼
[ TMdemy Express Backend (src/index.ts) ]
   ├── Express HTTP Server (Port 3000)
   ├── Socket.IO Realtime Engine
   ├── Background Cron Tasks
   └── Telegram Teacher Bot Service (src/telegram/bot.ts)
           │
           ├── 1. getTelegramConfig() (Safe env loading & syntax validation)
           │
           ├── 2. Error Boundary (bot.catch - isolates network & GrammyErrors)
           │
           ├── 3. requirePrivateChat Middleware (Blocks groups/supergroups)
           │
           ├── 4. Command Router
           │      ├── /start  ──> handleStartCommand (Welcome, intro, security note)
           │      ├── /help   ──> handleHelpCommand (Command list, roadmap info)
           │      └── /status ──> handleStatusCommand (System status, Telegram numeric ID)
           │
           └── 5. Default Message Fallback (handleDefaultMessage: "Chức năng hỏi đáp...")
```

### 2.1 Multi-Teacher Security Foundation
In TMdemy, courses are authored by multiple teachers with `role = TEACHER` in PostgreSQL. When teachers use Telegram:
1. **Numeric ID vs. Spoofable Username**: Telegram usernames can be changed, spoofed, transferred, or even left unset. Conversely, `ctx.from.id` is an immutable, 64-bit integer assigned by Telegram at account creation. TG-01 treats `ctx.from.id` as the future foreign key for the teacher linking table.
2. **Private Chat Requirement**: Executing commands in public groups exposes sensitive data. `requirePrivateChat` intercepts non-private messages and responds with:
   > *"⚠️ Vì lý do bảo mật dữ liệu doanh thu và thống kê khóa học, TMdemy Teacher Bot chỉ hoạt động trong tin nhắn riêng tư (1-on-1). Vui lòng nhắn tin trực tiếp với Bot."*
3. **No Premature Identity Claims**: Unverified users cannot claim a teacher identity. In TG-01, commands only provide instructional and diagnostic details.

### 2.2 Lifecycle & Duplicate Prevention
Under hot-reloading dev environments (`nodemon`), Telegram bots frequently encounter HTTP 409 Conflict (`terminated by other getUpdates request; make sure that only one bot instance is running`).
- `src/telegram/bot.ts` maintains singleton flags (`isRunning`, `isStarting`, `activeBotInstance`).
- Registers graceful termination hooks on `SIGINT`, `SIGTERM`, and `SIGUSR2` (which nodemon issues upon reload).
- `stopTelegramBot()` halts polling before the process restarts or exits.

---

## 3. Files Created & Modified

| File | Status | Responsibility |
| :--- | :---: | :--- |
| [`src/config/telegram.config.ts`](file:///d:/e-learning-project/e-learning_server/src/config/telegram.config.ts) | **Created** | Strongly typed config parser, token syntax validator, secret masking utility. |
| [`src/telegram/types.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/types.ts) | **Created** | Context extensions (`TeacherBotContext`) and status structures. |
| [`src/telegram/middleware/privateChat.middleware.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/middleware/privateChat.middleware.ts) | **Created** | Enforces 1-on-1 private chat security; blocks public/supergroup access. |
| [`src/telegram/handlers/commands.handler.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/handlers/commands.handler.ts) | **Created** | Command handlers for `/start`, `/help`, and `/status` in Vietnamese. |
| [`src/telegram/handlers/message.handler.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/handlers/message.handler.ts) | **Created** | Default fallback for non-command text messages. |
| [`src/telegram/bot.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/bot.ts) | **Created** | Bot factory, error boundary, long-polling lifecycle, and shutdown hooks. |
| [`src/telegram/index.ts`](file:///d:/e-learning-project/e-learning_server/src/telegram/index.ts) | **Created** | Module barrel export. |
| [`src/index.ts`](file:///d:/e-learning-project/e-learning_server/src/index.ts) | **Modified** | Attached non-blocking `initTelegramBot()` and graceful shutdown handlers. |
| [`.env`](file:///d:/e-learning-project/e-learning_server/.env) & [`.env.example`](file:///d:/e-learning-project/e-learning_server/.env.example) | **Modified** | Added `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_ENABLED`. |
| [`scripts/test_tg01_telegram_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg01_telegram_suite.ts) | **Created** | Automated 16-scenario test suite with update interceptors and mocking. |
| [`api/tg01_telegram_bot_api.md`](file:///d:/e-learning-project/e-learning_server/api/tg01_telegram_bot_api.md) | **Created** | Technical API and command specification. |
| [`docs/TG_01_TELEGRAM_BOT_FOUNDATION_REPORT.md`](file:///d:/e-learning-project/e-learning_server/docs/TG_01_TELEGRAM_BOT_FOUNDATION_REPORT.md) | **Created** | This comprehensive foundation report. |

---

## 4. Environment Configuration

The following variables are documented in [`.env.example`](file:///d:/e-learning-project/e-learning_server/.env.example):

```env
# ==========================================
# TELEGRAM TEACHER ANALYTICS BOT (TG-01)
# ==========================================
# Telegram Bot API Token obtained from @BotFather
# Example format: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"

# Master switch to enable or disable the Telegram Bot long-polling service (true | false)
TELEGRAM_BOT_ENABLED="true"
```

### Configuration Behavior
1. **Disabled Mode**: If `TELEGRAM_BOT_ENABLED="false"`, the bot is completely skipped with an informational log. Express continues running normally.
2. **Missing Token**: If `TELEGRAM_BOT_TOKEN=""`, the bot startup is safely bypassed. Express continues running normally.
3. **Invalid Token**: If the token fails syntax validation (missing colon, malformed characters), a warning is logged with a masked token (`maskTelegramToken`), and the bot does not attempt to poll Telegram.

---

## 5. Basic Bot Commands Specification

All bot responses are in Vietnamese and formatted with Telegram Markdown:

### 5.1 `/start` — Welcome & Introduction
```text
👋 Xin chào, [Tên Giảng Viên]!
Chào mừng bạn đến với TMdemy Teacher Analytics Bot 🎓

🤖 Giới thiệu:
Đây là trợ lý phân tích và thống kê dành riêng cho Giảng viên trên nền tảng giáo dục trực tuyến TMdemy...

📋 Các lệnh hỗ trợ hiện tại:
• /start - Hiển thị lời chào và thông tin giới thiệu
• /help - Xem hướng dẫn sử dụng và danh sách lệnh
• /status - Kiểm tra trạng thái hoạt động của Bot

🔒 Lưu ý bảo mật (TG-01 Foundation):
• Telegram User ID của bạn: [123456789]
• Để bảo đảm an toàn thông tin kinh doanh, mỗi Giảng viên chỉ có quyền truy cập dữ liệu thuộc về các khóa học của chính mình.
• Tính năng liên kết và xác thực tài khoản Giảng viên TMdemy sẽ sẵn sàng trong bản cập nhật kế tiếp (TG-02).
```

### 5.2 `/help` — Command Guide
```text
📖 HƯỚNG DẪN SỬ DỤNG — TMDEMY TEACHER BOT

Danh sách các câu lệnh khả dụng:
🔹 /start - Bắt đầu tương tác với Bot và xem giới thiệu tổng quan.
🔹 /help - Xem thông tin hướng dẫn và danh sách câu lệnh hỗ trợ.
🔹 /status - Kiểm tra trạng thái kết nối và thông tin định danh Telegram.

ℹ️ Tính năng đang phát triển:
• Tra cứu doanh thu và biểu đồ bán khóa học theo thời gian.
• Xem thống kê đơn hàng thành công, đang chờ duyệt và đã hủy.
• Báo cáo tổng hợp tự động hàng ngày / hàng tuần.
```

### 5.3 `/status` — System Diagnostics & Identity Probe
```text
🟢 TRẠNG THÁI HỆ THỐNG — TMDEMY TEACHER BOT

• Trạng thái Bot: Đang hoạt động bình thường (Online)
• Nền tảng: TMdemy E-Learning Backend
• Kênh bảo mật: ✅ Tin nhắn riêng tư (An toàn)
• Telegram User ID: [123456789]
• Thời gian phản hồi: 2026-11-04T13:05:00.000Z

🛡️ Thông tin định danh:
Mã số Telegram User ID ở trên là định danh duy nhất và bất biến do Telegram cấp. Mã số này sẽ được sử dụng làm cơ sở để xác minh và liên kết an toàn với tài khoản Giảng viên TMdemy trong giai đoạn TG-02.
```

### 5.4 Regular Text Messages (Fallback)
Any text message that is not a registered command returns:
```text
Chức năng hỏi đáp thống kê đang được phát triển.
```

---

## 6. Test Results & Verification

Automated testing was executed via [`scripts/test_tg01_telegram_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg01_telegram_suite.ts) utilizing client transformers and mock updates:

```text
====================================================
       TG-01: TELEGRAM BOT FOUNDATION TEST SUITE     
====================================================

--- TEST 1: Token Syntax Validation & Sanitization ---
  ✓ [PASS] #1: Valid Telegram token format passes validation
  ✓ [PASS] #1: Token without colon fails syntax validation
  ✓ [PASS] #1: Incomplete token fails syntax validation
  ✓ [PASS] #1: Empty token fails syntax validation

--- TEST 2: Secret Masking Security ---
  ✓ [PASS] #2: maskTelegramToken sanitizes secret payload while retaining numeric prefix

--- TEST 3: /start Command Handling ---
  ✓ [PASS] #3: /start triggers exactly one outgoing response
  ✓ [PASS] #3: /start provides Vietnamese welcome, mentions TMdemy, and includes Telegram ID

--- TEST 4: /help Command Handling ---
  ✓ [PASS] #4: /help triggers exactly one outgoing response
  ✓ [PASS] #4: /help provides complete command guide with all TG-01 commands

--- TEST 5: /status Command Handling ---
  ✓ [PASS] #5: /status triggers exactly one outgoing response
  ✓ [PASS] #5: /status reports operational status, numeric Telegram ID, and private channel confirmation

--- TEST 6: Regular Message Text Fallback ---
  ✓ [PASS] #6: Regular text message receives exactly one reply
  ✓ [PASS] #6: Regular text message returns exact required fallback text: "Chức năng hỏi đáp thống kê đang được phát triển."

--- TEST 7: Security — Private Chat Restriction ---
  ✓ [PASS] #7: Group message receives security warning reply
  ✓ [PASS] #7: Group chat is blocked from command execution and receives privacy security warning

--- TEST 8: Security — Numeric Telegram User ID Extraction ---
  ✓ [PASS] #8: Numeric user ID is accurately extracted even when Telegram username is absent

--- TEST 9: Security — Zero Exposure of Sensitive Data ---
  ✓ [PASS] #9: Responses contain zero database records, revenue metrics, or token leaks

--- TEST 10: Missing Token Handling ---
[TelegramBot] TELEGRAM_BOT_TOKEN is not configured. Telegram Bot is disabled.
  ✓ [PASS] #10: initTelegramBot safely returns false when TELEGRAM_BOT_TOKEN is missing

--- TEST 11: Invalid Token Format Handling ---
[TelegramBot Warning] Invalid TELEGRAM_BOT_TOKEN syntax (not***ken). Telegram Bot will not start.
  ✓ [PASS] #11: initTelegramBot safely returns false when TELEGRAM_BOT_TOKEN has invalid format

--- TEST 12: Disabled Bot Mode Handling ---
[TelegramBot] TELEGRAM_BOT_ENABLED is false. Telegram Bot is disabled.
  ✓ [PASS] #12: initTelegramBot safely returns false when TELEGRAM_BOT_ENABLED is false

--- TEST 13: Duplicate Bot Instance Prevention ---
  ✓ [PASS] #13: isTelegramBotRunning provides deterministic running state

--- TEST 14: Express API Concurrency Verification ---
  ✓ [PASS] #14: Express HTTP server serves requests completely independently from Telegram bot status

--- TEST 15: Graceful Shutdown Verification ---
  ✓ [PASS] #15: stopTelegramBot cleanly shuts down and resets instance reference

--- TEST 16: Live Telegram API Smoke Test ---
  - [NOT TESTED] #16: Live Telegram getMe probe (No real TELEGRAM_BOT_TOKEN provided in .env)

====================================================
RESULTS: PASSED: 23 | FAILED: 0 | BLOCKED: 0 | NOT TESTED: 1
====================================================
```

### Verification Breakdown
- **PASSED: 23 tests**: Syntax verification, token masking, commands (`/start`, `/help`, `/status`), fallback text, private chat enforcement, numeric user ID extraction, zero data leakage, missing token handling, invalid token handling, disabled mode, duplicate prevention, Express API concurrency, and graceful shutdown.
- **FAILED: 0 tests**.
- **BLOCKED: 0 tests**.
- **NOT TESTED: 1 test**: Live `getMe` probe was intentionally skipped because no real production bot token was injected into the test `.env` file (preventing secret pollution).

---

## 7. Operational Runbook

### Running the Test Suite
```powershell
cd D:\e-learning-project\e-learning_server
npx tsx scripts/test_tg01_telegram_suite.ts
```

### Starting the Application with Telegram Bot
1. Acquire a token from [@BotFather](https://t.me/BotFather).
2. Set the token in `.env`:
   ```env
   TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
   TELEGRAM_BOT_ENABLED="true"
   ```
3. Start the backend:
   ```powershell
   npm run dev
   ```
4. Look for the startup log:
   ```text
   Server is running on port : http://localhost:3000
   [TelegramBot] TMdemy Teacher Bot @tmdemy_teacher_bot (ID: 123456789) started successfully via long polling.
   ```

---

## 8. Next Steps for TG-02 (Account Linking & Teacher Authorization)

With the TG-01 foundation completed, the architecture is ready for **TG-02**:
1. **Teacher Account-Linking Mechanism**:
   - Web-initiated OTP / secure short-lived token generation in teacher portal.
   - Bot command `/link <token>` allowing teachers to bind their verified `telegramUserId` to their TMdemy `User.id`.
2. **Database Integration**:
   - Store linked `telegramChatId` / `telegramUserId` in a secure linking table or user profile field.
3. **Strict Teacher Authorization**:
   - Verify that the linked user possesses the `TEACHER` role before authorizing any statistical queries.
   - Enforce course ownership boundary: `Course.authorId === teacherId`.

