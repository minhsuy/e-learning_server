# TMdemy Telegram Teacher Bot — TG-04 Gemini Analytics Integration Specification
## TG-04A: Intent Recognition | TG-04B: Analytics Execution | TG-04C: Business Insights | TG-04D: Course-Specific Analytics

**Version:** 4.0.0 (Internal Service Specification)  
**Target Systems:** Telegram Teacher Bot (`@tmdemy_bot`), Gemini AI Integration, Background Analytics  
**Timezone Standard:** `Asia/Ho_Chi_Minh` (UTC+07:00 internal calculation; zero user-facing timezone footers)  
**Module Type:** Internal TypeScript Service (Zero HTTP REST Endpoints)

---

> [!IMPORTANT]
> **Internal Service Boundary Notice:**  
> TG-04 introduces an **internal TypeScript service layer**, NOT a new HTTP REST API.  
> No REST routes or external endpoints are registered. TG-04A classifies teacher intents, TG-04B executes standard lookups, and TG-04C performs deterministic multi-period comparisons, grounded qualitative insights, and actionable recommendations in-process.

---

## 1. Architecture Overview

TG-04 integrates Google Gemini AI with TMdemy's Telegram Teacher Bot and PostgreSQL analytics core:

```
[ Teacher Telegram Message ] (e.g. "Doanh thu tháng này so với tháng trước thế nào?")
       │
       ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 1. Telegram Message Routing (src/telegram/handlers/message.handler.ts)        │
 │    • Enforce private chat (requirePrivateChat)                              │
 │    • Ignore slash commands (/revenue, /link, etc.)                          │
 │    • Check TG-01 deterministic test user fallback (ID: 777123)              │
 │    • Authenticate teacher via TG-02A (findLinkedTelegramAccount)            │
 │    • Intercept unlinked / inactive accounts with linking instructions       │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 2. TG-04A: Intent Recognition Pipeline (src/services/geminiIntent.service.ts)│
 │    • Input sanitization & Anti-DoS check (< 1000 chars, non-empty)          │
 │    • Vietnam timezone context injection (Asia/Ho_Chi_Minh, UTC+7)           │
 │    • Google Gen AI SDK dispatch (@google/genai, configured GEMINI_MODEL)    │
 │    • Strict Zod runtime validation (RawGeminiIntentOutputSchema)            │
 │    • Extracts: intent, operation, period, comparisonPeriod, comparisonMetric│
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
                      [ Strongly-Typed AnalyticsIntentResult ]
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
  status: "RECOGNIZED"           status: "AMBIGUOUS"          status: "UNSUPPORTED" / "ERROR"
         │                              │                              │
         ├──────────────────────────────┐                              ▼
         ▼                              ▼                    ┌──────────────────────┐
  [ operation: "lookup" ]     [ operation: "compare" /       │ Polite scope guide   │
         │                      "insight" / "recommendation"]│ or fallback slash    │
         ▼                              │                    │ commands menu        │
 ┌────────────────────────┐             ▼                    └──────────────────────┘
 │ 3. TG-04B Dispatcher   │    ┌────────────────────────────────────────────────────┐
 │ (analyticsDispatcher)  │    │ 4. TG-04C Insight Engine (analyticsInsight.service)│
 │ • Single period query  │    │    • Multi-period data retrieval (TG-03A services) │
 │ • Direct formatting    │    │    • Deterministic math (diff, %, zero-baseline)   │
 └───────────┬────────────┘    │    • Partial month progress awareness              │
             │                 │    • Evidence payload assembly                     │
             │                 │    • Grounded qualitative Gemini call              │
             │                 │    • Anti-hallucination verification & fallback    │
             │                 └─────────────────────────┬──────────────────────────┘
             │                                           │
             └─────────────────────┬─────────────────────┘
                                   │
                                   ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 5. Telegram Response Formatter (analyticsFormatter.ts & analyticsInsight)   │
 │    • VND currency formatting (e.g. "399.000 VND")                           │
 │    • Markdown character escaping (escapeMarkdown)                           │
 │    • Zero-state onboarding notices                                          │
 │    • Telegram < 4096 character ceiling protection                           │
 │    • MANDATORY: ZERO TIMEZONE FOOTERS (No Asia/Ho_Chi_Minh or UTC+7 in text)│
 └─────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
                       [ Reply to Teacher on Telegram ]
```

---

## 2. Environment Configuration

All settings are read securely from backend environment variables:

| Variable Name | Required | Default / Expected | Description |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | `[Secret]` | Google AI Studio / Gemini API key. Never logged or exposed. |
| `GEMINI_MODEL` | No | `gemini-3.5-flash-lite` | Selected model. Strictly respected without silent replacement. |

### Configuration Rules
1. `GEMINI_API_KEY` is loaded through `getGeminiConfig()` in [`src/config/gemini.config.ts`](file:///d:/e-learning-project/e-learning_server/src/config/gemini.config.ts).
2. The key is masked in all system logs and diagnostics (`maskGeminiApiKey()`).
3. If the configured model is unavailable (e.g. 404 or unsupported name), the system reports the provider error explicitly instead of silently switching models.

---

## 3. Supported Analytics Operations (TG-04C)

The system supports four distinct operational modes:

| Operation | Description | Target Questions | Handled By |
| :--- | :--- | :--- | :--- |
| `lookup` | Standard single-period metric query | "Tháng này tôi kiếm được bao nhiêu tiền?", "Hôm nay có mấy đơn?" | TG-04B Dispatcher |
| `compare` | Two-period comparative calculation | "Doanh thu tháng này so với tháng trước thế nào?", "Học viên mới có tăng không?" | TG-04C Insight Service |
| `insight` | Deep business diagnostics & ranking rationale | "Phân tích tình hình kinh doanh tháng này", "Khóa học nào bán chạy nhất và tại sao?" | TG-04C Insight Service |
| `recommendation` | Grounded improvement suggestions | "Tôi nên cải thiện việc bán khóa học như thế nào?", "Làm sao tăng doanh số?" | TG-04C Insight Service |

---

## 4. Intent Recognition Schema Contract

Exported from [`src/models/analyticsIntent.model.ts`](file:///d:/e-learning-project/e-learning_server/src/models/analyticsIntent.model.ts):

```typescript
export const AnalyticsOperationSchema = z.enum([
  'lookup',
  'compare',
  'insight',
  'recommendation'
])

export const ComparisonMetricSchema = z.enum(['revenue', 'orders', 'students'])

export interface AnalyticsIntentResult {
  status: 'RECOGNIZED' | 'AMBIGUOUS' | 'UNSUPPORTED' | 'ERROR'
  intent: 'revenue' | 'orders' | 'students' | 'courses' | 'report' | 'unsupported'
  operation?: 'lookup' | 'compare' | 'insight' | 'recommendation'
  period: AnalyticsPeriod | null
  comparisonPeriod?: AnalyticsPeriod | null
  comparisonMetric?: 'revenue' | 'orders' | 'students' | null
  startDate: string | null
  endDate: string | null
  confidence: number
  rawMessage: string
  explanation?: string
  clarificationPrompt?: string
  errorMessage?: string
  modelUsed?: string
}
```

---

## 5. Deterministic Comparison Engine (`analyticsInsight.service.ts`)

All numerical math is calculated in TypeScript to prevent mathematical hallucinations:

### 1. Absolute Difference
$$\Delta = \text{Current Value} - \text{Previous Value}$$

### 2. Percentage Growth & Zero-Denominator Safety
$$\text{Percentage Change} = \begin{cases} 
0\% & \text{if } \text{Previous} = 0 \text{ and } \text{Current} = 0 \\
\text{Undefined (reported as absolute change)} & \text{if } \text{Previous} = 0 \text{ and } \text{Current} > 0 \\
\frac{\text{Current} - \text{Previous}}{\text{Previous}} \times 100 & \text{if } \text{Previous} > 0 
\end{cases}$$

### 3. Partial-Month Progress Awareness
When comparing `this_month` with `last_month` while the current month has not completed (e.g. day < 28), the engine automatically includes an objective disclaimer:
> `⚠️ Lưu ý: Tháng này hiện mới ghi nhận dữ liệu đến ngày X, so sánh với toàn bộ tháng trước mang tính chất đối chiếu tiến độ.`

---

## 6. Grounding Rules & Anti-Hallucination Architecture

1. **Evidence Payload:** The backend queries PostgreSQL via verified TG-03A services and builds a minimal JSON evidence payload containing only factual numbers.
2. **Strict Qualitative Prompting:** Gemini is instructed to act exclusively as a qualitative commentator. It is strictly forbidden from creating numbers, percentages, or unverified subjective causes (e.g., "marketing campaign succeeded", "students were thrilled").
3. **Numeric Grounding Verification:** The backend extracts all numbers from Gemini's response and verifies that they correspond to verified evidence numbers.
4. **Deterministic Fallbacks:** If Gemini times out, returns malformed JSON, or introduces ungrounded numbers, the backend discards the text and falls back to a 100% deterministic, mathematically accurate Vietnamese explanation.

### 6.1 Upstream 503 Resilience & High-Demand Handling
To ensure zero service interruption when upstream AI providers experience transient load spikes (e.g. `gemini-3.5-flash-lite` returning HTTP 503 "model is experiencing high demand"):
- **Transient Retry Mechanism:** `executeWithTransientRetry` automatically retries up to 2 times with exponential backoff on transient errors (503, 429, UNAVAILABLE, Overloaded).
- **Deterministic Pattern Intent Fallback:** `tryDeterministicIntentRecognition` extracts intents for Vietnamese comparative, insight, recommendation, revenue, orders, and student queries deterministically if upstream AI is unavailable.
- **Fail-Open Analytics Recovery:** If intent recognition returns an upstream error, `message.handler.ts` transparently attempts deterministic pattern extraction, ensuring teachers receive verified PostgreSQL analytics rather than a generic service unavailable error.

---

## 7. Mandatory Timezone Footer Removal

In accordance with project requirements, **all user-facing timezone footer lines have been removed** from all Telegram responses:

- `/revenue`, `/orders`, `/students`: Removed `'🕒 _Múi giờ báo cáo: Asia/Ho_Chi_Minh (UTC+7)_'`
- `/report`: Removed `'🕒 _Thời điểm xuất báo cáo: ... (UTC+7)_'`
- Natural-language lookup & insight messages: Contain zero timezone footer lines.
- **Internal calculations:** Continue to use `Asia/Ho_Chi_Minh` for exact calendar day and month boundaries.

---

## 8. Response Format Standards

### Example 1: Revenue Comparison (`compare`)
```text
📊 PHÂN TÍCH KINH DOANH — SO SÁNH DOANH THU
👨‍🏫 Giảng viên: Nguyen Van A

💰 Số liệu thực tế:
• Doanh thu Tháng này: 399.000 VND (1 đơn)
• Doanh thu Tháng trước: 300.000 VND (1 đơn)
• Chênh lệch: +99.000 VND (+33.0%)

⚠️ Lưu ý: Tháng này hiện mới ghi nhận dữ liệu đến ngày 5, so sánh với toàn bộ tháng trước mang tính chất đối chiếu tiến độ.

🧠 Nhận xét:
Doanh thu tháng này ghi nhận mức tăng trưởng khả quan so với tháng trước, chủ yếu nhờ vào đơn hàng giá trị tốt.

💡 Gợi ý:
Tiếp tục theo dõi các đơn hàng phát sinh trong những ngày tiếp theo để đánh giá tổng thể doanh số cả tháng.
```

### Example 2: Course Performance Diagnostics (`insight`)
```text
📚 PHÂN TÍCH KINH DOANH — HIỆU QUẢ KHÓA HỌC
👨‍🏫 Giảng viên: Nguyen Van A

📊 Hiện trạng danh mục:
• Tổng số khóa học: 3 khóa (Đã duyệt: 3)
• Khóa học đã bán được: 2 khóa
• Khóa học chưa có doanh thu: 1 khóa

🏆 Khóa học tiêu biểu:
• Doanh thu cao nhất: Lập trình React Pro (380.000 VND - 2 đơn)
• Bán chạy nhất theo số lượng: Lập trình React Pro (2 đơn)

🧠 Nhận xét:
Khóa học "Lập trình React Pro" đang dẫn đầu toàn bộ danh mục cả về doanh thu và số lượt bán, đóng góp tỷ trọng lớn nhất vào tổng thu nhập.

💡 Gợi ý:
Bạn có thể tham khảo cập nhật thêm bài tập thực hành cho khóa học này để duy trì tỷ lệ hoàn thành cao của học viên.
```

### Example 3: Improvement Advice (`recommendation`)
```text
💡 TƯ VẤN & GỢI Ý PHÁT TRIỂN KHOÁ HỌC
👨‍🏫 Giảng viên: Nguyen Van A

📊 Hiện trạng tổng quan:
• Tổng số khóa học: 3 khóa
• Khóa học đã có doanh số: 2 khóa
• Khóa học chưa có doanh thu: 1 khóa

📌 Các khóa học cần thúc đẩy doanh số:
• Lập trình Node.js Nâng cao (250.000 VND)

🧠 Đánh giá hiện trạng:
Bạn hiện có 1 khóa học chưa phát sinh lượt bán nào trong khi các khóa học còn lại đã có học viên đăng ký.

💡 Đề xuất hành động:
Bạn có thể xem xét cập nhật lại hình ảnh đại diện, tối ưu tiêu đề bài học và cân nhắc áp dụng chương trình ưu đãi hoặc coupon giảm giá cho khóa học chưa phát sinh doanh số.
```

---

## 9. Security & Multi-Tenant Guarantees

1. **Deterministic Identity Binding:** `teacherId` passed to analytics services is exclusively derived from verified PostgreSQL `telegram_accounts` records. Neither user prompts nor Gemini output can supply or modify the `teacherId`.
2. **Prompt Injection Immunity:** User attempts to request data for other teachers or inject SQL statements are neutralized before execution.
3. **Zero Financial Invention:** All financial metrics shown originate from PostgreSQL and deterministic TypeScript calculations.
4. **Private Chat Isolation:** All message processing is strictly confined to 1-on-1 private Telegram chats (`chat.type === 'private'`).

---

## 10. TG-04D: Course-Specific Analytics & Entity Recognition

TG-04D extends the natural-language pipeline with course entity recognition, secure PostgreSQL title resolution, and focused course-level financial and student analytics.

### 10.1 Extended Intent Schema Fields
```typescript
export const CourseMetricSchema = z.enum(['revenue', 'sales', 'students', 'performance'])
export type CourseMetric = z.infer<typeof CourseMetricSchema>

// In RawGeminiIntentOutputSchema & AnalyticsIntentResult:
courseName?: string | null // Extracted course title or keyword
metric?: CourseMetric | null // Target course metric
```

### 10.2 Course Entity Resolution (`courseEntityResolver.service.ts`)
1. **Teacher Catalog Scoping:** Searches strictly within courses owned by the authenticated teacher (`c.author_id = teacherId AND c.is_destroyed = false`).
2. **Matching Stages:**
   - Exact title match (case-insensitive).
   - Exact slug match.
   - Accent-insensitive exact match (using Vietnamese diacritic removal).
   - Substring containment (query in title or title in query).
   - Token intersection (all query keywords present in course title).
3. **Resolution Contract:**
   - `FOUND`: Exactly one course identified -> returns verified `{ id, title, slug, price, status }`.
   - `AMBIGUOUS`: Multiple candidates matched -> returns up to 5 candidates for clarification.
   - `NOT_FOUND`: Zero candidates matched -> returns helpful guidance without leaking other teachers' courses.

### 10.3 Course-Specific Analytics Engine (`courseSpecificAnalytics.service.ts`)
- **Period Metrics:** Calculates `realizedRevenue`, `grossRevenue`, `totalDiscount`, `completedOrders`, `pendingOrders`, `rejectedOrders`, `averageOrderValue`, `conversionRate`, `periodEnrollments`.
- **All-Time Metrics:** Provides cumulative revenue, orders, and total students as benchmark context.
- **Comparisons:** Supports multi-period comparisons (e.g., this month vs last month) via `compareCourseSpecificAnalyticsService`.
- **Zero Realized Revenue Safety:** A course with 0 completed orders in a period returns `0 VND` without falling back to all-time revenue.

### 10.4 Elimination of Listed Price vs Realized Revenue Confusion
- **Root Cause Fixed:** In `/courses` and general course recommendations, courses without sales previously displayed `(990.000 VND)` without explaining whether this was earned revenue or listed price.
- **Fix Applied:** All course prices are now explicitly prefixed as `(Giá bán: 990.000 VND)` in `/courses` and `Giá bán niêm yết: 990.000 VND` in course-specific messages.

### 10.5 Course-Specific Telegram Response Examples

#### Example 1: Specific Course Revenue Query (`last_month`)
**User:** `"Khóa học Vibe coding với Antigravity 2026 tháng trước bán được bao nhiêu tiền?"`
```text
💰 THỐNG KÊ KHÓA HỌC
👨‍🏫 Giảng viên: Nguyen Van A

📚 Khóa học: Vibe coding với Antigravity 2026
📅 Thời gian: Tháng trước

💵 Chỉ số kinh doanh trong kỳ:
• Doanh thu thực nhận: 0 VND
• Đơn hàng thành công: 0 đơn
• Giá trị trung bình/đơn: 0 VND
• Học viên mới ghi danh: 0 học viên

📌 Thông tin niêm yết & Toàn thời gian:
• Giá bán niêm yết: 449.000 VND
• Tổng doanh thu tích lũy: 4.491.000 VND
• Tổng đơn hàng tích lũy: 10 đơn
• Tổng học viên toàn thời gian: 18 học viên
```

#### Example 2: Specific Course Comparison (`this_month` vs `last_month`)
**User:** `"Khóa học React Pro tháng này so với tháng trước thế nào?"`
```text
📊 SO SÁNH HIỆU QUẢ KHÓA HỌC
👨‍🏫 Giảng viên: Nguyen Van A

📚 Khóa học: Lập trình React Pro
🎯 Chỉ số: Doanh thu thực nhận

• Tháng này: 380.000 VND
• Tháng trước: 200.000 VND
• Biến động: 📈 Tăng +90.0% (+180.000 VND)

⚠️ Lưu ý: Tháng này hiện mới ghi nhận dữ liệu đến ngày 5, so sánh với toàn bộ tháng trước mang tính chất đối chiếu tiến độ.
```

#### Example 3: Course Not Found
**User:** `"Khóa học Flutter cho tôi xem doanh thu"`
```text
📚 KHÔNG TÌM THẤY KHÓA HỌC

Không tìm thấy khóa học nào phù hợp với từ khóa "Flutter" trong danh mục giảng dạy của bạn.

💡 Gợi ý:
• Kiểm tra lại tên khóa học hoặc từ khóa tìm kiếm.
• Gõ /courses để xem toàn bộ danh mục khóa học của bạn.
```
