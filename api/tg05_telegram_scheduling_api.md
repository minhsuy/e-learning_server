# TMdemy Telegram Teacher Bot — TG-05 Automated Reports & Scheduling Specification

**Version:** 5.2.0 (Hotfix: Scheduler Reliability & Safe Idempotency Lifecycle)  
**Target Systems:** Telegram Teacher Bot (`@tmdemy_bot`), Background Report Scheduler, Teacher Dashboard REST API  
**Timezone Standard:** `Asia/Ho_Chi_Minh` (UTC+07:00 calculation; strictly zero client-facing timezone footers)  
**Authentication Standard:** Bearer JWT for REST API; TG-02A verified `telegram_accounts` for Telegram Bot commands  

---

## 1. Architecture Overview

TG-05 introduces a resilient, multi-tenant scheduling and automated reporting system for TMdemy teachers. Teachers can receive automated Daily snapshots and Weekly comprehensive business performance reports directly on Telegram at their preferred times.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Teacher Interface Options               │
                  │  A. Telegram Command: /schedule                         │
                  │  B. REST API: /api/teacher/telegram/schedules           │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                         ┌──────────────────────────────────────────┐
                         │   telegramReportSchedule.service.ts      │
                         │   • Validates teacher authentication     │
                         │   • Enforces linked Telegram requirement │
                         │   • Computes nextRunAt (Asia/Ho_Chi_Minh)│
                         └─────────────────────┬────────────────────┘
                                               │
                                               ▼
                         ┌──────────────────────────────────────────┐
                         │   PostgreSQL: telegram_report_schedules  │
                         │   • teacher_id, report_type (UNIQUE)     │
                         │   • is_enabled, delivery_time, day_of_wk │
                         │   • next_run_at, last_run_at, status     │
                         └─────────────────────┬────────────────────┘
                                               │
┌──────────────────────────────────────────────┴─────────────────────────────────────────────┐
│ BACKGROUND DISPATCH ENGINE (src/jobs/telegramReportScheduler.ts - runs every 60s)          │
│                                                                                            │
│  1. Find Due: findDueSchedules(nextRunAt <= now() AND is_enabled = true)                   │
│  2. Atomic Claim: tryClaimReportDelivery(scheduleId, periodKey)                            │
│     └─ Uses @@unique([schedule_id, period_key]) in telegram_report_deliveries             │
│        (P2002 conflict ensures zero duplicate sends across workers)                        │
│  3. Content Generation:                                                                    │
│     ├─ DAILY: Today snapshot metrics (revenue, completed/pending orders, new students)     │
│     ├─ WEEKLY: Previous completed week (Mon-Sun) vs prior week comparison delta (+X%)      │
│     ├─ Fail-safe AI: Parsed observation & recommendation plain text                        │
│     │  (Never exposes raw JSON, code fences, field names, or unparsed artifacts)           │
│     └─ Strictly ZERO client-facing timezone footer lines                                   │
│  4. Delivery: bot.api.sendMessage(chatId, markdownText)                                   │
│  5. Advance nextRunAt to subsequent period (tomorrow or next week)                         │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (Prisma PostgreSQL)

### 2.1 `telegram_report_schedules`
Stores the teacher's configured schedule for each report type (`DAILY` and `WEEKLY`).

```prisma
model TelegramReportSchedule {
  id            String    @id @default(uuid()) @db.Uuid
  teacherId     String    @map("teacher_id") @db.Uuid
  reportType    String    @map("report_type") @db.VarChar(20) // 'DAILY' | 'WEEKLY'
  isEnabled     Boolean   @default(false) @map("is_enabled")
  deliveryTime  String    @default("20:00") @map("delivery_time") @db.VarChar(5) // 'HH:mm'
  dayOfWeek     Int?      @map("day_of_week") // 1 (Mon) .. 7 (Sun), null for DAILY
  timezone      String    @default("Asia/Ho_Chi_Minh") @db.VarChar(50)
  nextRunAt     DateTime? @map("next_run_at")
  lastRunAt     DateTime? @map("last_run_at")
  lastStatus    String?   @map("last_status") @db.VarChar(20) // 'SUCCESS' | 'FAILED'
  failureReason String?   @map("failure_reason") @db.Text
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  deliveries TelegramReportDelivery[]

  @@unique([teacherId, reportType])
  @@index([isEnabled, nextRunAt])
  @@index([teacherId])
  @@map("telegram_report_schedules")
}
```

### 2.2 `telegram_report_deliveries`
Logs delivery attempts and provides atomic PostgreSQL-backed deduplication.

```prisma
model TelegramReportDelivery {
  id                String    @id @default(uuid()) @db.Uuid
  scheduleId        String    @map("schedule_id") @db.Uuid
  teacherId         String    @map("teacher_id") @db.Uuid
  reportType        String    @map("report_type") @db.VarChar(20)
  periodKey         String    @map("period_key") @db.VarChar(100) // e.g. DAILY:2026-11-06
  status            String    @default("CLAIMED") @map("status") @db.VarChar(20) // CLAIMED | DELIVERED | FAILED
  attemptCount      Int       @default(1) @map("attempt_count")
  claimedAt         DateTime  @default(now()) @map("claimed_at")
  deliveredAt       DateTime? @map("delivered_at")
  errorMessage      String?   @map("error_message") @db.Text
  responseMessageId Int?      @map("response_message_id")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  schedule TelegramReportSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  @@unique([scheduleId, periodKey])
  @@index([teacherId, periodKey])
  @@index([status, claimedAt])
  @@map("telegram_report_deliveries")
}
```

---

## 3. Telegram Bot `/schedule` Command

Teachers manage their schedules directly in Telegram via the `/schedule` command.

### 3.1 Subcommand Reference

| Subcommand | Syntax Example | Description |
|---|---|---|
| `status` (default) | `/schedule` or `/schedule status` | Displays current Daily and Weekly schedule status, delivery times, and next run timestamps. |
| `daily on` | `/schedule daily on` | Enables Daily Report using current/default delivery time (20:00). |
| `daily off` | `/schedule daily off` | Disables Daily Report. |
| `daily <HH:mm>` | `/schedule daily 21:30` | Sets Daily Report delivery time to 21:30 and enables it. |
| `weekly on` | `/schedule weekly on` | Enables Weekly Report using current/default time (Monday 08:00). |
| `weekly off` | `/schedule weekly off` | Disables Weekly Report. |
| `weekly <day> <HH:mm>` | `/schedule weekly t2 08:00` | Sets Weekly Report to deliver on Monday (`t2`) at 08:00 and enables it. |
| `pause` | `/schedule pause` | Pauses (disables) all automated report schedules for the teacher. |

### 3.2 Supported Day of Week Aliases
- **Monday (`1`):** `1`, `t2`, `thu2`, `thuhai`, `thứ 2`, `thứ hai`, `mon`, `monday`
- **Tuesday (`2`):** `2`, `t3`, `thu3`, `thuba`, `thứ 3`, `thứ ba`, `tue`, `tuesday`
- **Wednesday (`3`):** `3`, `t4`, `thu4`, `thutu`, `thứ 4`, `thứ tư`, `wed`, `wednesday`
- **Thursday (`4`):** `4`, `t5`, `thu5`, `thunam`, `thứ 5`, `thứ năm`, `thu`, `thursday`
- **Friday (`5`):** `5`, `t6`, `thu6`, `thusau`, `thứ 6`, `thứ sáu`, `fri`, `friday`
- **Saturday (`6`):** `6`, `t7`, `thu7`, `thubay`, `thứ 7`, `thứ bảy`, `sat`, `saturday`
- **Sunday (`7`):** `7`, `cn`, `chunhat`, `chủ nhật`, `sun`, `sunday`

---

## 4. REST API Specification

All REST endpoints require `Authorization: Bearer <JWT>` with role `teacher`.

### 4.1 `GET /api/teacher/telegram/schedules`
Retrieves schedules and Telegram link status for the authenticated teacher.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "teacherId": "a42190aa-e04f-4372-ac7c-4297d46ee9e7",
    "isTelegramLinked": true,
    "telegramUsername": "teacher_tg",
    "daily": {
      "id": "e43b1772-23c8-479e-a0e1-4560a0a81111",
      "teacherId": "a42190aa-e04f-4372-ac7c-4297d46ee9e7",
      "reportType": "DAILY",
      "isEnabled": true,
      "deliveryTime": "20:00",
      "dayOfWeek": null,
      "timezone": "Asia/Ho_Chi_Minh",
      "nextRunAt": "2026-11-06T13:00:00.000Z",
      "lastRunAt": "2026-11-05T13:00:00.000Z",
      "lastStatus": "SUCCESS",
      "failureReason": null
    },
    "weekly": {
      "id": "f54c2883-34d9-480f-b1f2-5671b1b92222",
      "teacherId": "a42190aa-e04f-4372-ac7c-4297d46ee9e7",
      "reportType": "WEEKLY",
      "isEnabled": true,
      "deliveryTime": "08:00",
      "dayOfWeek": 1,
      "dayOfWeekLabel": "Thứ Hai",
      "timezone": "Asia/Ho_Chi_Minh",
      "nextRunAt": "2026-11-09T01:00:00.000Z",
      "lastRunAt": null,
      "lastStatus": null,
      "failureReason": null
    }
  }
}
```

### 4.2 `PUT /api/teacher/telegram/schedules/daily`
Configures or toggles the Daily Report schedule.

**Request Body:**
```json
{
  "isEnabled": true,
  "deliveryTime": "20:30"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Cập nhật lịch báo cáo hàng ngày thành công.",
  "data": {
    "id": "e43b1772-23c8-479e-a0e1-4560a0a81111",
    "teacherId": "a42190aa-e04f-4372-ac7c-4297d46ee9e7",
    "reportType": "DAILY",
    "isEnabled": true,
    "deliveryTime": "20:30",
    "nextRunAt": "2026-11-06T13:30:00.000Z"
  }
}
```

**Error `400 Bad Request` (Unlinked Telegram Account):**
```json
{
  "success": false,
  "message": "Tài khoản Giảng viên chưa liên kết Telegram. Vui lòng kết nối Telegram trước khi kích hoạt báo cáo tự động."
}
```

### 4.3 `PUT /api/teacher/telegram/schedules/weekly`
Configures or toggles the Weekly Report schedule.

**Request Body:**
```json
{
  "isEnabled": true,
  "deliveryTime": "08:00",
  "dayOfWeek": 1
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Cập nhật lịch báo cáo hàng tuần thành công.",
  "data": {
    "id": "f54c2883-34d9-480f-b1f2-5671b1b92222",
    "teacherId": "a42190aa-e04f-4372-ac7c-4297d46ee9e7",
    "reportType": "WEEKLY",
    "isEnabled": true,
    "deliveryTime": "08:00",
    "dayOfWeek": 1,
    "dayOfWeekLabel": "Thứ Hai",
    "nextRunAt": "2026-11-09T01:00:00.000Z"
  }
}
```

### 4.4 `POST /api/teacher/telegram/schedules/pause`
Pauses all automated schedules for the authenticated teacher.

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Đã tạm dừng tất cả lịch báo cáo tự động.",
  "data": {
    "pausedCount": 2
  }
}
```

---

## 5. Report Message Templates (Strict Zero Timezone Footer & Structured AI Formatting)

### 5.1 Daily Report Example
```markdown
📊 *BÁO CÁO KINH DOANH HÀNG NGÀY*
📅 Ngày: *06/11/2026*
👨‍🏫 Giảng viên: *Nguyễn Văn A*

💰 *Kết quả kinh doanh trong ngày:*
• Doanh thu thực nhận: *1.200.000 VND*
• Đơn hàng thành công: *3* đơn
• Học viên mới: *+2* học viên
• Đơn chờ xử lý: ⏳ *1* đơn (350.000 VND)

🏆 *Khóa học tiêu biểu trong ngày:*
• *Lập trình Next.js từ cơ bản đến nâng cao*: 800.000 VND (2 lượt bán)

🌐 *Tiến độ toàn thời gian:*
• Doanh thu tích lũy: *45.600.000 VND*
• Tổng đơn thành công: *82* đơn

💡 *NHẬN ĐỊNH NHANH AI*

📊 *Tình hình kinh doanh:*
Doanh số hôm nay duy trì ổn định với 3 đơn hàng thành công và 2 học viên mới.

🚀 *Đề xuất cải thiện:*
Bạn có thể xem lại mô tả khóa học hoặc hỗ trợ xử lý 1 đơn hàng đang chờ để tối ưu tỷ lệ chuyển đổi!
```

### 5.2 Weekly Report Example
```markdown
📊 *BÁO CÁO KINH DOANH HÀNG TUẦN*
📅 Kỳ báo cáo: *27/10/2026 - 02/11/2026*
👨‍🏫 Giảng viên: *Nguyễn Văn A*

💰 *Hiệu quả tuần qua so với tuần trước:*
• Doanh thu thực nhận: *8.500.000 VND* (🟢 +15.4% so với tuần trước)
• Đơn hàng thành công: *14* đơn (+2 đơn)
• Tỷ lệ chuyển đổi: *87.5%*
• Học viên mới đăng ký: *+11* học viên

🏆 *Top khóa học tuần qua:*
1. *NestJS & Prisma Toàn tập*: 4.500.000 VND (7 đơn)
2. *Lập trình Next.js*: 4.000.000 VND (7 đơn)

💡 *NHẬN ĐỊNH NHANH AI*

📊 *Tình hình kinh doanh:*
Tuần qua ghi nhận mức tăng trưởng doanh thu ấn tượng +15.4% với 14 đơn hàng hoàn thành.

🚀 *Đề xuất cải thiện:*
Bạn nên cân nhắc phát hành thêm coupon giảm giá cho các khóa học mới trong tuần này để duy trì đà tăng trưởng.
```

---

## 6. Frontend Integration Guide (Handoff)

This guide provides everything needed by the Next.js frontend engineering team to integrate Telegram report scheduling into the Teacher Dashboard.

### 6.1 TypeScript Types

```typescript
export type TelegramReportType = 'DAILY' | 'WEEKLY'

export interface TelegramReportScheduleItem {
  id: string
  teacherId: string
  reportType: TelegramReportType
  isEnabled: boolean
  deliveryTime: string // 'HH:mm' (e.g. '20:00')
  dayOfWeek: number | null // 1 (Mon) .. 7 (Sun), null for DAILY
  dayOfWeekLabel?: string // e.g. 'Thứ Hai'
  timezone: string // 'Asia/Ho_Chi_Minh'
  nextRunAt: string | null // ISO 8601 string or null
  lastRunAt: string | null
  lastStatus: 'SUCCESS' | 'FAILED' | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}

export interface TeacherSchedulesSummary {
  teacherId: string
  isTelegramLinked: boolean
  telegramUsername: string | null
  daily: TelegramReportScheduleItem
  weekly: TelegramReportScheduleItem
}

export interface ConfigureDailyScheduleInput {
  isEnabled?: boolean
  deliveryTime?: string // 'HH:mm' (00:00 - 23:59)
}

export interface ConfigureWeeklyScheduleInput {
  isEnabled?: boolean
  deliveryTime?: string // 'HH:mm' (00:00 - 23:59)
  dayOfWeek?: number // 1 to 7
}

export interface ScheduleApiResponse<T> {
  success: boolean
  message?: string
  data: T
}
```

### 6.2 Frontend Service Functions (Example Fetch Wrapper)

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// 1. Fetch schedules status and Telegram link
export async function getTeacherSchedules(token: string): Promise<ScheduleApiResponse<TeacherSchedulesSummary>> {
  const res = await fetch(`${BASE_URL}/teacher/telegram/schedules`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

// 2. Update Daily Report schedule
export async function updateDailySchedule(
  token: string,
  data: ConfigureDailyScheduleInput
): Promise<ScheduleApiResponse<TelegramReportScheduleItem>> {
  const res = await fetch(`${BASE_URL}/teacher/telegram/schedules/daily`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

// 3. Update Weekly Report schedule
export async function updateWeeklySchedule(
  token: string,
  data: ConfigureWeeklyScheduleInput
): Promise<ScheduleApiResponse<TelegramReportScheduleItem>> {
  const res = await fetch(`${BASE_URL}/teacher/telegram/schedules/weekly`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

// 4. Pause all schedules
export async function pauseAllSchedules(
  token: string
): Promise<ScheduleApiResponse<{ pausedCount: number }>> {
  const res = await fetch(`${BASE_URL}/teacher/telegram/schedules/pause`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}
```

### 6.3 Recommended UI Behavior & State Handling

1. **Telegram Unlinked State Banner:**
   - If `isTelegramLinked === false`:
     - Disable the toggle switches for Daily and Weekly reports.
     - Show a prominent call-to-action: *"Vui lòng liên kết tài khoản Telegram trước khi kích hoạt lịch báo cáo tự động."* with a button pointing to the account linking modal (`POST /api/teacher/telegram/link-token`).
2. **Time Input Validation (`HH:mm`):**
   - Provide a 24-hour time picker formatted strictly as `HH:mm` (e.g. `20:00`, `08:30`).
   - Validate client-side before sending to prevent unnecessary 400 Bad Request responses.
3. **Day of Week Selector (Weekly Report):**
   - Provide a dropdown or radio list with options 1–7:
     - `1`: Thứ Hai (Monday)
     - `2`: Thứ Ba (Tuesday)
     - `3`: Thứ Tư (Wednesday)
     - `4`: Thứ Năm (Thursday)
     - `5`: Thứ Sáu (Friday)
     - `6`: Thứ Bảy (Saturday)
     - `7`: Chủ Nhật (Sunday)
4. **"Tạm Dừng Tất Cả" (Pause All) Action:**
   - Add a quick action button to pause all active reports with a confirmation prompt.
   - On success, update both toggle states to `false` and clear `nextRunAt`.
5. **Next Run Timestamp Display:**
   - If `isEnabled === true` and `nextRunAt` is non-null, format the ISO date using `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })` to display: e.g. `20:00 ngày 07/11/2026`.

---

## 7. Delivery Reliability & Idempotency Lifecycle (TG-05 Hotfix)

### 7.1 Safe Claim & Idempotency Inspection (`claimOrInspectReportDelivery`)

To prevent raw unhandled Prisma `P2002` unique constraint errors and to safely handle delivery retries, the scheduler implements an inspect-and-claim lifecycle on `telegram_report_deliveries` (`scheduleId`, `periodKey`):

1. **`ALREADY_DELIVERED`:**
   - If the delivery record exists with status `DELIVERED`, the dispatch is skipped (`status: 'SKIPPED'`).
   - `nextRunAt` is strictly advanced to the subsequent period (`calculateSubsequentRunAt`).
   - Zero duplicate Telegram messages are sent.
2. **`CURRENTLY_PROCESSING`:**
   - If status is `CLAIMED` and claimed less than 5 minutes ago (`< 300,000ms`), another worker is actively dispatching. The run is skipped without advancing `nextRunAt`.
3. **`CLAIMED` (New, Retry, or Stale Recovery):**
   - If no record exists: atomically created with `status: 'CLAIMED'`, `attemptCount: 1`.
   - If previously `FAILED` and `attemptCount < 3`: atomically reclaimed with `attemptCount: increment(1)`.
   - If `CLAIMED` for `>= 5 minutes` (worker crash): atomically reclaimed with `attemptCount: increment(1)`.
4. **`MAX_RETRIES_EXCEEDED`:**
   - If `attemptCount >= 3` and delivery failed, the schedule advances to the subsequent period to prevent head-of-line blocking.

### 7.2 Schedule Recalculation on Edit (Zero False Promises)

When a teacher configures or edits their Daily or Weekly schedule via REST API or `/schedule` command:
- The system checks if the current period has already been delivered (`status === 'DELIVERED'`).
- If already delivered, `nextRunAt` is automatically calculated for the **subsequent period** (tomorrow for Daily, next week for Weekly) via `calculateSubsequentRunAt`.
- This prevents the scheduler from immediately triggering today's period, hitting a duplicate skip, and failing to deliver a promised report.

### 7.3 External Contract Preservation

- **Zero Breaking Changes:** HTTP endpoint URLs, query parameters, request/response bodies, HTTP status codes, and `/schedule` command syntax remain 100% frozen and backward-compatible.
