# TMdemy Telegram Teacher Bot — TG-01 API Specification

**Version:** 1.0.0 (Foundation)  
**Target Systems:** Telegram Bot API, TMdemy Node.js Backend  
**Framework:** [grammY](https://grammy.dev/) (TypeScript)  
**Primary Identifier:** Telegram Numeric User ID (`ctx.from.id`, 64-bit signed integer)  

---

## 1. Overview & Architectural Boundaries

The **TMdemy Telegram Teacher Analytics Bot** provides automated business insights and interactive analytics directly to course creators on the TMdemy platform.

In **TG-01 (Foundation)**:
- The bot communicates directly with Telegram's Long Polling API (`getUpdates`).
- No public REST endpoints are exposed to the client in TG-01.
- All commands and queries are executed within Telegram's encrypted chat transport.
- Multi-teacher privacy is preserved by enforcing 1-on-1 private conversations and prohibiting group chats.

---

## 2. Bot Configuration Specification

Configuration is managed via server environment variables:

| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `TELEGRAM_BOT_TOKEN` | string | `""` | The HTTP API Token issued by [@BotFather](https://t.me/BotFather). Format: `\d{6,12}:[A-Za-z0-9_-]{25,}`. |
| `TELEGRAM_BOT_ENABLED` | boolean | `true` (if token set) | Master switch to activate/deactivate Telegram long-polling service. |

### Configuration Rules
1. If `TELEGRAM_BOT_ENABLED="false"`, the Telegram service is completely dormant.
2. If `TELEGRAM_BOT_TOKEN` is unset or invalid, the backend logs an informational message and skips bot startup without disrupting the Express HTTP server.
3. Bot tokens are masked in logs using `maskTelegramToken()` (e.g. `123456:***xyz`).

---

## 3. Telegram Bot Commands Contract

All commands must be sent in a **private 1-on-1 chat** with the Bot.

### 3.1 `/start`
- **Description:** Sends a Vietnamese welcome message, architecture summary, and quick command guide.
- **Parameters:** None (TG-01). (In TG-02, will support deep-linking parameter `/start link_<token>`).
- **Response Format:** Markdown text.
- **Payload Details:**
  - Greet the user by `ctx.from.first_name`.
  - Explains the purpose of TMdemy Teacher Analytics Bot.
  - Lists available commands.
  - Emphasizes that future stats require verified teacher account linking.
  - Displays user's Telegram numeric ID (`ctx.from.id`).

### 3.2 `/help`
- **Description:** Provides usage instructions and command documentation.
- **Parameters:** None.
- **Response Format:** Markdown text.
- **Payload Details:**
  - Enumerates commands: `/start`, `/help`, `/status`.
  - Outlines upcoming capabilities (revenue metrics, order checks, student retention).

### 3.3 `/status`
- **Description:** Diagnostic probe reporting connectivity and identity metadata.
- **Parameters:** None.
- **Response Format:** Markdown text.
- **Payload Details:**
  - Current bot operational status (`🟢 Đang hoạt động bình thường`).
  - Security channel verification (`✅ Tin nhắn riêng tư`).
  - The caller's numeric `Telegram User ID`.
  - Server timestamp.
  - Clarification that this numeric ID will be bound to the TMdemy teacher profile in TG-02.

---

## 4. Message & Update Processing Pipeline

```
[ Incoming Telegram Update ]
             │
             ▼
   [ bot.catch Boundary ]  ──(On Error)──> Log error safely (never crash process)
             │
             ▼
   [ requirePrivateChat Middleware ]
             │
             ├── If ctx.chat.type !== 'private' ──> Reply security warning & halt
             │
             ▼ (Private Chat Verified)
   [ Extract ctx.from.id -> ctx.telegramUserId ]
             │
             ├── Is Command (/start, /help, /status)?
             │        │
             │        └── Yes ──> Execute corresponding command handler
             │
             └── Is Non-Command Text?
                      │
                      └── Yes ──> Reply: "Chức năng hỏi đáp thống kê đang được phát triển."
```

---

## 5. Security & Privacy Guarantees

### 5.1 Telegram Numeric User ID vs. Username
- **Insecure Practice:** Authenticating teachers via `@username` (e.g., `@john_teacher`). Telegram usernames can be changed freely, spoofed, transferred, or hidden completely.
- **TMdemy Standard:** Identification strictly relies on `ctx.from.id` (numeric 64-bit integer), which is immutable and unique across the Telegram ecosystem.

### 5.2 Private Chat Guard (`requirePrivateChat`)
- Group chats, supergroups, and channels are immediately blocked with:
  > *"⚠️ Vì lý do bảo mật dữ liệu doanh thu và thống kê khóa học, TMdemy Teacher Bot chỉ hoạt động trong tin nhắn riêng tư (1-on-1). Vui lòng nhắn tin trực tiếp với Bot."*
- Prevents accidental leakage of proprietary business metrics into public or group spaces.

### 5.3 Zero Data Exposure Invariant
- In TG-01, the bot has **zero access** to Course, Order, Enrollment, or Revenue tables.
- No user can claim or impersonate a teacher identity until verified in TG-02.

---

## 6. Future Account-Linking Contract (TG-02 Boundary)

In **TG-02**, teacher linking will be established through the following flow:

```
[ TMdemy Web Teacher Portal ]
            │
            │ Teacher clicks "Connect Telegram Bot"
            ▼
[ TMdemy Backend API (POST /api/teacher/telegram/link-token) ]
            │
            │ Generates cryptographically secure, 15-minute OTP / Link Token
            ▼
[ Telegram Bot (via Deep-link /start link_<token> or /link <token>) ]
            │
            │ Bot extracts:
            │ - otpToken from message
            │ - telegramUserId from ctx.from.id
            ▼
[ TMdemy Verification Service ]
            │
            ├── Validates OTP token
            ├── Verifies User role === 'TEACHER'
            └── Saves { userId, telegramUserId, linkedAt } in PostgreSQL
```

