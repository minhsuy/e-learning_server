# TMdemy Telegram Teacher Bot — TG-03 Analytics API & Service Integration Specification

**Version:** 1.0.0 (Consolidated Analytics Reference)  
**Target Systems:** Telegram Bot (TG-03B), Gemini Natural Language Analytics (TG-04), Scheduled Reports (TG-05), Web Teacher Portal  
**Timezone Standard:** `Asia/Ho_Chi_Minh` (UTC+07:00, strictly enforced)  
**Currency Standard:** `VND` (Vietnamese Dong)  

---

## 1. Architecture Overview & TG-03 Integration Strategy

TG-03 establishes a dual-channel analytics architecture for TMdemy course creators:
1. **HTTP REST Channel (Existing Web Dashboard):** Consumed by the Next.js frontend via authenticated JWT tokens.
2. **In-Process Service Channel (Telegram Bot & AI):** Consumed directly in-process by the Telegram Bot (`grammY`), Gemini analytics agents, and cron jobs.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ Channel 1: Web Browser / Next.js ]                                                   │
│   └── HTTP Requests with Authorization: Bearer <JWT>                                   │
│         └── teacherRouter (/api/teacher/statistics/* & /api/teacher/telegram/*)        │
│               └── Controller Layer (teacherStatistic.controller.ts)                    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────┴────────────────────────────────────────────┐
│ [ Channel 2: Telegram Messenger (TG-03B) & Background AI/Jobs (TG-04/TG-05) ]         │
│   └── Telegram Updates (Encrypted 1-on-1 Chat)                                         │
│         └── grammY Bot (ctx.from.id)                                                   │
│               └── requireTeacherAuth / getTeacherProfileByTelegramIdService            │
│                     │                                                                  │
│                     ▼ (Verified teacherId UUID)                                        │
│               Direct In-Process Service Invocation (Zero HTTP Overhead)                │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [ Unified Analytics Core Layer (TG-03A) ]                                              │
│   ├── Date Range Parser (src/utils/analyticsDateRange.ts)                              │
│   │     └── Asia/Ho_Chi_Minh timezone, inclusive/exclusive boundaries                  │
│   ├── Teacher Analytics Service (src/services/teacherAnalytics.service.ts)             │
│   │     ├── getRevenueAnalyticsService                                                 │
│   │     ├── getOrderAnalyticsService                                                   │
│   │     ├── getStudentAnalyticsService                                                 │
│   │     ├── getCourseAnalyticsService                                                  │
│   │     └── getTeacherDashboardSummaryService                                          │
│   └── Reused Dashboard Service (src/services/teacherStatistic.service.ts)             │
│                                           │
│                                           ▼
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Repositories (teacherAnalytics.repository.ts & teacherStatistic.repository.ts)     │ │
│ │   └── PostgreSQL 16.11 via Prisma ORM 6.4.1 (Scoped by authorId = teacherId)      │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Part A: Existing Web REST Endpoints (Reused Baseline)

The following HTTP REST endpoints currently exist on the backend and are fully maintained with zero contract modifications:

### 2.1 Overview Statistics
- **Route:** `GET /api/teacher/statistics/overview`
- **Access Level:** Private (`Authorization: Bearer <token>`, Role: `TEACHER`)
- **Controller:** `getTeacherOverviewController` in [`src/controller/teacherStatistic.controller.ts`](file:///d:/e-learning-project/e-learning_server/src/controller/teacherStatistic.controller.ts)
- **Status:** `REUSED`
- **Response Structure (200 OK):**
```json
{
  "success": true,
  "message": "Fetched teacher overview statistics successfully",
  "data": {
    "courses": { "total": 12, "approved": 10, "pending": 2, "rejected": 0 },
    "students": { "totalStudents": 142, "totalEnrollments": 180, "activeStudents": 130, "completedStudents": 50 },
    "revenue": { "totalRevenue": 24500000, "totalOrders": 180, "completedOrders": 180, "averageOrderValue": 136111.11, "currency": "VND" },
    "rating": { "averageRating": 4.85, "totalReviews": 94 },
    "engagement": { "averageRating": 4.85, "totalReviews": 94, "certificatesIssued": 38 }
  }
}
```

### 2.2 Revenue Reporting
- **Route:** `GET /api/teacher/statistics/revenue`
- **Access Level:** Private (`Authorization: Bearer <token>`, Role: `TEACHER`)
- **Query Parameters:**
  - `period` (optional): `'7days' | '30days' | '12months' | 'custom'` (default: `'30days'`)
  - `startDate` (optional): `YYYY-MM-DD` (required if `period=custom`)
  - `endDate` (optional): `YYYY-MM-DD` (required if `period=custom`)
  - `courseId` (optional): UUID of a specific course owned by this teacher
- **Controller:** `getTeacherRevenueController`
- **Status:** `REUSED`

### 2.3 Course Breakdown Statistics
- **Route:** `GET /api/teacher/statistics/courses`
- **Access Level:** Private (`Authorization: Bearer <token>`, Role: `TEACHER`)
- **Query Parameters:** `page`, `limit`, `sortBy` (`revenue | students | rating | createdAt`), `order` (`asc | desc`), `status`
- **Controller:** `getTeacherCoursesStatsController`
- **Status:** `REUSED`

### 2.4 Enrollment Statistics
- **Route:** `GET /api/teacher/statistics/enrollments`
- **Access Level:** Private (`Authorization: Bearer <token>`, Role: `TEACHER`)
- **Query Parameters:** `period`, `startDate`, `endDate`, `courseId`
- **Controller:** `getTeacherEnrollmentStatsController`
- **Status:** `REUSED`

### 2.5 Telegram Account Management (From TG-02A)
| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/teacher/telegram/link-token` | `POST` | `TEACHER` | Generates a 15-min single-use linking token and deep link. |
| `/api/teacher/telegram/status` | `GET` | `TEACHER` | Returns `{ isLinked: boolean, account: ... }`. |
| `/api/teacher/telegram/unlink` | `DELETE` | `TEACHER` | Revokes the teacher's Telegram account binding. |

---

## 3. Part B: Internal Analytics Service Contracts (For TG-03B / TG-04)

These TypeScript service functions are located in [`src/services/teacherAnalytics.service.ts`](file:///d:/e-learning-project/e-learning_server/src/services/teacherAnalytics.service.ts). They are invoked in-process by passing the verified `teacherId` resolved from the Telegram User ID.

### 3.1 Date Range Specification & Options
```typescript
interface DateRangeOptions {
  period?: 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'last_month' | 'custom' | 'all_time'
  startDate?: string | Date // YYYY-MM-DD (for custom)
  endDate?: string | Date   // YYYY-MM-DD (for custom)
}
```
All dates are parsed strictly in timezone **`Asia/Ho_Chi_Minh` (UTC+07:00)**:
- `today`: 00:00:00 to 24:00:00 VN time today.
- `this_week`: Monday 00:00:00 to next Monday 00:00:00 VN time.
- `this_month`: 1st day of month 00:00:00 to 1st day of next month 00:00:00 VN time.
- Custom ranges: inclusive start, exclusive next-day end boundary.

---

### 3.2 Revenue Analytics Service: `getRevenueAnalyticsService`
```typescript
async function getRevenueAnalyticsService(
  teacherId: string,
  options?: DateRangeOptions,
  tx?: PrismaTransactionClient
): Promise<TeacherRevenueAnalytics>
```

#### Metric Definitions
- **Net Revenue (`summary.netRevenue`):** The actual paid amount after coupon discounts (`SUM(o.total)` for `status = COMPLETED`).
- **Gross Revenue (`summary.grossRevenue`):** Total face value of purchased courses before discounts (`SUM(o.amount)` = `netRevenue + totalDiscount`).
- **Total Discount (`summary.totalDiscount`):** Cumulative savings provided to students via coupons (`SUM(o.discount)`).
- **Completed Orders (`summary.completedOrders`):** Total count of completed, paid orders.
- **Average Order Value (`summary.averageOrderValue`):** `netRevenue / completedOrders`.
- **Top Courses (`topCourses`):** Up to 5 courses generating the highest revenue in the selected period.

#### Return Payload Shape
```typescript
{
  summary: {
    period: "this_month",
    periodLabel: "Tháng này",
    startDate: "2026-10-31T17:00:00.000Z", // Nov 1 00:00:00 VN
    endDate: "2026-11-30T17:00:00.000Z",   // Dec 1 00:00:00 VN
    netRevenue: 8500000,
    grossRevenue: 9200000,
    totalDiscount: 700000,
    completedOrders: 42,
    averageOrderValue: 202380.95,
    currency: "VND"
  },
  kpis: {
    allTimeRevenue: 48500000,
    todayRevenue: 400000,
    thisWeekRevenue: 2800000,
    thisMonthRevenue: 8500000,
    lastMonthRevenue: 7900000
  },
  timeline: [
    { date: "2026-11-01", revenue: 400000, orderCount: 2 },
    // ...
  ],
  byCourse: [
    { courseId: "...", title: "Khóa học React & Next.js", price: 250000, soldCount: 20, revenue: 5000000 },
    // ...
  ],
  topCourses: [ /* top 5 courses */ ]
}
```

---

### 3.3 Order Analytics Service: `getOrderAnalyticsService`
```typescript
async function getOrderAnalyticsService(
  teacherId: string,
  options?: DateRangeOptions,
  tx?: PrismaTransactionClient
): Promise<TeacherOrderAnalytics>
```

#### Metric Definitions
- **Total Orders (`summary.totalOrders`):** Total transactions created (`completed + pending + rejected`).
- **Completed Orders (`summary.completedOrders`):** Successfully paid transactions (`status = COMPLETED`).
- **Pending Orders (`summary.pendingOrders`):** Incomplete or awaiting payment (`status = PENDING`).
- **Rejected Orders (`summary.rejectedOrders`):** Cancelled, failed, or refunded orders (`status = REJECTED`).
- **Realized Revenue (`summary.realizedRevenue`):** Revenue from completed orders.
- **Pending Revenue (`summary.pendingRevenue`):** Potential revenue held in pending orders.
- **Conversion Rate (`summary.conversionRate`):** Percentage `(completedOrders / totalOrders) * 100`.

#### Return Payload Shape
```typescript
{
  summary: {
    period: "this_month",
    periodLabel: "Tháng này",
    startDate: "...",
    endDate: "...",
    totalOrders: 50,
    completedOrders: 42,
    pendingOrders: 5,
    rejectedOrders: 3,
    realizedRevenue: 8500000,
    pendingRevenue: 1000000,
    conversionRate: 84.0
  },
  allTimeTotalOrders: 240,
  timeline: [
    { date: "2026-11-01", totalOrders: 3, completed: 2, pending: 1, rejected: 0 },
    // ...
  ],
  salesByCourse: [
    {
      courseId: "...",
      title: "Khóa học React & Next.js",
      totalOrders: 22,
      completedOrders: 20,
      pendingOrders: 1,
      rejectedOrders: 1,
      realizedRevenue: 5000000
    }
  ]
}
```

---

### 3.4 Student Analytics Service: `getStudentAnalyticsService`
```typescript
async function getStudentAnalyticsService(
  teacherId: string,
  options?: DateRangeOptions,
  tx?: PrismaTransactionClient
): Promise<TeacherStudentAnalytics>
```

#### Metric Definitions
- **All-Time Unique Students (`summary.totalUniqueStudentsAllTime`):** Total distinct individuals who have ever enrolled in any course created by this teacher (`COUNT(DISTINCT user_id)`).
- **Period Unique Students (`summary.periodUniqueStudents`):** Distinct individuals who enrolled in one or more courses during the period.
- **New Students (`summary.newStudents`):** Students whose **first-ever enrollment** in any of this teacher's courses occurred within the specified date range.
- **Period Enrollments (`summary.periodEnrollments`):** Total course enrollments in the period (`active + completed + canceled`).

#### Return Payload Shape
```typescript
{
  summary: {
    period: "this_month",
    periodLabel: "Tháng này",
    startDate: "...",
    endDate: "...",
    totalUniqueStudentsAllTime: 180,
    periodUniqueStudents: 35,
    newStudents: 28,
    periodEnrollments: 42,
    activeEnrollments: 38,
    completedEnrollments: 4,
    canceledEnrollments: 0
  },
  timeline: [
    { date: "2026-11-01", enrollmentsCount: 3 }
  ],
  enrollmentsByCourse: [
    {
      courseId: "...",
      title: "Khóa học React & Next.js",
      totalEnrollments: 20,
      activeCount: 18,
      completedCount: 2,
      canceledCount: 0
    }
  ]
}
```

---

### 3.5 Course Analytics Service: `getCourseAnalyticsService`
```typescript
async function getCourseAnalyticsService(
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<TeacherCourseAnalytics>
```

#### Metric Definitions
- **Publication Breakdown:** `totalCourses`, `approvedCourses`, `pendingCourses`, `rejectedCourses`.
- **Zero-Sales Courses (`zeroSalesCourses`):** Courses owned by this teacher that have 0 completed orders.
- **Best-Selling by Revenue:** Course generating the highest all-time revenue.
- **Best-Selling by Volume:** Course with the highest count of completed units sold.

#### Return Payload Shape
```typescript
{
  summary: {
    totalCourses: 10,
    approvedCourses: 8,
    pendingCourses: 2,
    rejectedCourses: 0,
    coursesWithSalesCount: 7,
    zeroSalesCoursesCount: 3
  },
  bestSellingByRevenue: {
    id: "...",
    title: "Khóa học Lập trình Web Fullstack",
    slug: "lap-trinh-web-fullstack",
    price: 350000,
    status: "APPROVED",
    totalRevenue: 15400000,
    completedOrders: 44,
    totalStudents: 44,
    averageRating: 4.9,
    hasSales: true
  },
  bestSellingByVolume: { /* ... */ },
  courses: [ /* array of all detailed course items */ ],
  zeroSalesCourses: [ /* array of 3 zero-sales courses */ ]
}
```

---

### 3.6 Executive Dashboard Summary: `getTeacherDashboardSummaryService`
```typescript
async function getTeacherDashboardSummaryService(
  teacherId: string,
  tx?: PrismaTransactionClient
): Promise<TeacherDashboardSummary>
```

Provides a unified KPI summary across all timeframes in a single call. Ideal for Telegram `/report` or daily automated summaries.

#### Return Payload Shape
```typescript
{
  teacher: {
    id: "13608f92-8acf-53e3-adcb-0d832e9cb1d4",
    username: "Alex Rivers",
    email: "alex@example.com"
  },
  allTime: {
    totalRevenue: 48500000,
    totalOrders: 240,
    completedOrders: 210,
    uniqueStudents: 180,
    totalCourses: 10,
    averageRating: 4.85
  },
  today: {
    revenue: 400000,
    orders: 2,
    newStudents: 2
  },
  thisWeek: {
    revenue: 2800000,
    orders: 14,
    newStudents: 10
  },
  thisMonth: {
    revenue: 8500000,
    orders: 42,
    newStudents: 28
  },
  topCourse: {
    id: "...",
    title: "Khóa học Lập trình Web Fullstack",
    revenue: 15400000,
    soldCount: 44
  }
}
```

---

## 4. Part C: TG-03B Telegram Bot Integration Blueprint

In **TG-03B**, Telegram bot commands (`/revenue`, `/orders`, `/students`, `/courses`, `/report`) will invoke these analytics services directly in-process:

### 4.1 Step-by-Step Invocation Pattern
```typescript
// Example TG-03B Command Handler: /revenue
bot.command('revenue', requireTeacherAuth, async (ctx) => {
  // 1. ctx.teacherProfile was already verified and populated by requireTeacherAuth
  const teacherId = ctx.teacherProfile!.userId

  // 2. Parse period argument (e.g. /revenue today, /revenue week, /revenue month)
  const arg = (ctx.match as string)?.trim().toLowerCase()
  const period = arg === 'today' ? 'today' : arg === 'week' ? 'this_week' : 'this_month'

  // 3. Invoke TG-03A core analytics service in-process
  const analytics = await getRevenueAnalyticsService(teacherId, { period })

  // 4. Format into beautiful Vietnamese Telegram Markdown message
  const message = [
    `💰 *BÁO CÁO DOANH THU — ${analytics.summary.periodLabel.toUpperCase()}*`,
    `👨‍🏫 Giảng viên: *${ctx.teacherProfile!.username}*`,
    '',
    `• Doanh thu thực nhận (Net): *${analytics.summary.netRevenue.toLocaleString('vi-VN')} VND*`,
    `• Doanh thu gốc (Gross): ${analytics.summary.grossRevenue.toLocaleString('vi-VN')} VND`,
    `• Giảm giá qua Coupon: ${analytics.summary.totalDiscount.toLocaleString('vi-VN')} VND`,
    `• Số đơn hàng thành công: *${analytics.summary.completedOrders}*`,
    `• Giá trị trung bình/đơn: ${Math.round(analytics.summary.averageOrderValue).toLocaleString('vi-VN')} VND`,
    '',
    `🏆 *Top khóa học doanh thu cao nhất:*`,
    ...analytics.topCourses.map((c, idx) => 
      `${idx + 1}. *${c.title}*: ${c.revenue.toLocaleString('vi-VN')} VND (${c.soldCount} lượt bán)`
    ),
    '',
    `📊 *Tổng doanh thu toàn thời gian:* ${analytics.kpis.allTimeRevenue.toLocaleString('vi-VN')} VND`
  ].join('\n')

  await ctx.reply(message, { parse_mode: 'Markdown' })
})
```

### 4.2 Security & Multi-Tenant Isolation Guarantees
1. **Never Trust Client Teacher IDs:** The `teacherId` is resolved exclusively from `ctx.from.id` via `telegram_accounts` lookup in PostgreSQL.
2. **PostgreSQL Relational Scoping:** All aggregations filter strictly by `c.author_id = teacherId`. It is physically impossible for Teacher A's Telegram account to access Teacher B's sales or students.
3. **Private Chat Requirement:** Invocations in group chats continue to be blocked by `requirePrivateChat`.

---

## 5. Part D: TG-03B Telegram Analytics Command Contracts & Specifications

TG-03B introduces 5 production-grade analytics commands implemented directly over the TG-03A in-process analytics layer.

### 5.1 Command Overview & Syntax

| Command | Arguments | Default Period | Access Control | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/revenue` | `[period \| custom YYYY-MM-DD YYYY-MM-DD]` | `this_month` | `requireTeacherAuth` | Net/gross revenue, coupons, AOV, top revenue courses, KPI comparison. |
| `/orders` | `[period \| custom YYYY-MM-DD YYYY-MM-DD]` | `this_month` | `requireTeacherAuth` | Order status counts (completed, pending, rejected), conversion rate, course sales. |
| `/students` | `[period \| custom YYYY-MM-DD YYYY-MM-DD]` | `this_month` | `requireTeacherAuth` | Unique/new students, enrollment statuses (active, completed, canceled), top courses. |
| `/courses` | _(none)_ | `all_time` | `requireTeacherAuth` | Full course catalog breakdown, approval status, zero-sales courses, top performers. |
| `/report` | _(none)_ | Multi-period | `requireTeacherAuth` | Executive dashboard summary combining all-time, today, week, and month KPIs. |

### 5.2 Date Range Parameters & Aliases

Commands supporting a period argument (`/revenue`, `/orders`, `/students`) accept standard English keywords or natural Vietnamese aliases:

| Canonical Period | Vietnamese Aliases | Boundary Definition (Asia/Ho_Chi_Minh) |
| :--- | :--- | :--- |
| `today` | `hom_nay`, `homnay` | 00:00:00 to 24:00:00 Vietnam time today. |
| `yesterday` | `hom_qua`, `homqua` | 00:00:00 to 24:00:00 Vietnam time yesterday. |
| `this_week` | `tuan_nay`, `tuannay`, `tuan` | Monday 00:00:00 to next Monday 00:00:00 VN time. |
| `last_7_days` | `7_ngay_qua`, `7ngay`, `7_ngay` | Rolling 7 days before today 24:00:00 VN time. |
| `this_month` | `thang_nay`, `thangnay`, `thang` | 1st of current month to 1st of next month VN time. |
| `last_month` | `thang_truoc`, `thangtruoc` | 1st of previous month to 1st of current month VN time. |
| `all_time` | `toan_thoi_gian`, `tat_ca` | TMdemy inception (2020-01-01) to tomorrow 00:00:00 VN time. |
| `custom` | `tuy_chinh`, `tuychinh` | `custom YYYY-MM-DD YYYY-MM-DD` or `YYYY-MM-DD YYYY-MM-DD`. |

### 5.3 Telegram Response Formatting Samples

#### 1. `/revenue` Sample Response
```markdown
💰 *BÁO CÁO DOANH THU — THÁNG NÀY*
👨‍🏫 Giảng viên: *Alex Rivers*

• Doanh thu thực nhận (Net): *8.500.000 VND*
• Doanh thu gốc (Gross): 10.000.000 VND
• Giảm giá qua Coupon: 1.500.000 VND
• Đơn hàng thành công: *14* đơn
• Giá trị trung bình/đơn: 607.143 VND

🏆 *Top khóa học doanh thu cao nhất:*
1. *Lập trình Web Fullstack với Node.js & React*: 8.000.000 VND (8 lượt bán)
2. *Thiết kế cơ sở dữ liệu PostgreSQL*: 500.000 VND (1 lượt bán)

📊 *Chỉ số đối chiếu các mốc thời gian:*
• Hôm nay: 500.000 VND
• Tuần này: 2.000.000 VND
• Tháng này: 8.500.000 VND
• Toàn thời gian: *50.000.000 VND*

🕒 _Múi giờ báo cáo: Asia/Ho_Chi_Minh (UTC+7)_
```

#### 2. `/orders` Sample Response
```markdown
📦 *THỐNG KÊ ĐƠN HÀNG — THÁNG NÀY*
👨‍🏫 Giảng viên: *Alex Rivers*

• Tổng đơn hàng phát sinh: *20* đơn
• Hoàn thành: ✅ *16* đơn
• Chờ xử lý: ⏳ *3* đơn
• Đã hủy / Từ chối: ❌ *1* đơn

• Doanh thu thực nhận: *9.500.000 VND*
• Doanh thu đang chờ: 1.500.000 VND
• Tỷ lệ chuyển đổi thành công: *80.0%*

📚 *Chi tiết theo khóa học (Top phát sinh đơn):*
1. *Lập trình Web Fullstack với Node.js & React*: 10/12 đơn thành công (6.000.000 VND)

🌐 *Tổng số đơn hàng toàn thời gian:* *150* đơn

🕒 _Múi giờ báo cáo: Asia/Ho_Chi_Minh (UTC+7)_
```

#### 3. `/students` Sample Response
```markdown
👥 *THỐNG KÊ HỌC VIÊN — THÁNG NÀY*
👨‍🏫 Giảng viên: *Alex Rivers*

• Học viên có hoạt động trong kỳ: *25* người
• Học viên mới lần đầu đăng ký: 🆕 *15* người
• Lượt ghi danh trong kỳ: *30* lượt
  ├ Đang học chủ động: 📖 20
  ├ Đã hoàn thành khóa: 🎓 8
  └ Đã hủy ghi danh: ⚠️ 2

📚 *Khóa học thu hút nhiều học viên nhất:*
1. *Lập trình Web Fullstack*: 20 lượt (15 đang học, 5 hoàn thành)

🌐 *Tổng số học viên duy nhất toàn thời gian:* *120* học viên

🕒 _Múi giờ báo cáo: Asia/Ho_Chi_Minh (UTC+7)_
```

#### 4. `/courses` Sample Response
```markdown
📚 *DANH MỤC KHÓA HỌC & HIỆU QUẢ KINH DOANH*
👨‍🏫 Giảng viên: *Alex Rivers*

• Tổng số khóa học: *5* khóa
  ├ Đang hoạt động (Approved): ✅ 4
  ├ Chờ kiểm duyệt (Pending): ⏳ 1
  └ Bị từ chối (Rejected): ❌ 0

• Khóa học đã phát sinh doanh số: 🎯 *3* khóa
• Khóa học chưa có doanh thu: ⚪ *2* khóa

🌟 *Khóa học tiêu biểu:*
• Doanh thu cao nhất: *Lập trình Web Fullstack* (5.000.000 VND - 10 đơn)
• Số lượng bán nhiều nhất: *Nhập môn TypeScript* (15 đơn - 3.000.000 VND)

💡 *Khóa học cần đẩy mạnh (Chưa có lượt bán):*
• Lập trình Python Nâng Cao (300.000 VND)

🕒 _Dữ liệu được cập nhật thời gian thực từ cơ sở dữ liệu TMdemy._
```

#### 5. `/report` Sample Response
```markdown
📊 *BÁO CÁO KINH DOANH TỔNG HỢP (EXECUTIVE REPORT)*
👨‍🏫 Giảng viên: *Alex Rivers*

🌐 *Toàn thời gian (All-Time):*
• Doanh thu tích lũy: *60.000.000 VND*
• Đơn hàng thành công: *90* / 100 đơn
• Học viên độc nhất: *80* học viên
• Khóa học đã tạo: *6* khóa
• Đánh giá trung bình: ⭐ *4.85/5.0*

📅 *Diễn biến theo các kỳ gần nhất:*
• Hôm nay: *500.000 VND* | 1 đơn | +1 học viên mới
• Tuần này: *3.000.000 VND* | 5 đơn | +4 học viên mới
• Tháng này: *12.000.000 VND* | 20 đơn | +15 học viên mới

🏆 *Khóa học dẫn đầu doanh thu:*
*Lập trình Web Fullstack*
• Doanh thu mang lại: *25.000.000 VND*
• Lượt bán thành công: *40* lượt

🕒 _Thời điểm xuất báo cáo: 04/11/2026, 21:40:00 (UTC+7)_
```


