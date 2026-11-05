# TMdemy Telegram Teacher Bot — TG-03A Implementation Report
## Teacher Analytics Core (Backend)

**Document ID:** `TG-03A-IMPL-REPORT-001`  
**Date:** November 4, 2026  
**Status:** `COMPLETED & VERIFIED` (38/38 Suite Tests Passed, 325/325 Regression Passed)  
**Target Systems:**  
- TMdemy Node.js Express Backend (`e-learning_server`)
- Target Database: PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
- Timezone Engine: `Asia/Ho_Chi_Minh` (UTC+07:00, strictly enforced)  
- Consumer Systems: Telegram Bot (TG-03B), Gemini Analytics (TG-04), Scheduled Reports (TG-05), Web Portal

---

## 1. Executive Summary

**TG-03A: Teacher Analytics Core** establishes a unified, reliable, multi-tenant analytics layer for course instructors on the TMdemy platform.

### Core Objectives Achieved
1. **Reuse Existing Dashboard Analytics:** Fully audited and preserved the 6 existing teacher dashboard REST endpoints (`/api/teacher/statistics/*`) and their underlying functional repository (`teacherStatistic.repository.ts`).
2. **Built Missing Analytics Capabilities:**
   - Order lifecycle analytics across `COMPLETED`, `PENDING`, and `REJECTED` statuses, with conversion rate calculation.
   - First-time new student tracking in specified reporting periods.
   - Course ranking, revenue attribution, and zero-sales course identification.
   - Timezone-aware date-range resolution in `Asia/Ho_Chi_Minh` (UTC+07:00) covering `today`, `yesterday`, `this_week`, `last_7_days`, `this_month`, `last_month`, `all_time`, and `custom`.
3. **In-Process Service Architecture:** Built [`teacherAnalytics.service.ts`](file:///d:/e-learning-project/e-learning_server/src/services/teacherAnalytics.service.ts) to provide direct TypeScript service functions that the upcoming TG-03B Telegram bot commands (`/revenue`, `/orders`, `/students`, `/courses`, `/report`) can call directly in-process without HTTP network overhead.
4. **Zero Schema Migrations & Strict Data Isolation:** Reused existing PostgreSQL tables (`orders`, `courses`, `enrollments`, `ratings`, `users`) with strict relational scoping (`WHERE c.author_id = teacherId`).

---

## 2. Existing Analytics Architecture Discovered & Reused

Before implementing code, an exhaustive inspection of the existing codebase was conducted:

### 2.1 Existing Endpoints & Repositories Discovered
- **Route Definitions:** Located at [`src/routes/teacher.route.ts`](file:///d:/e-learning-project/e-learning_server/src/routes/teacher.route.ts).
- **Controllers:** Located at [`src/controller/teacherStatistic.controller.ts`](file:///d:/e-learning-project/e-learning_server/src/controller/teacherStatistic.controller.ts).
- **Services:** Located at [`src/services/teacherStatistic.service.ts`](file:///d:/e-learning-project/e-learning_server/src/services/teacherStatistic.service.ts).
- **Repositories:** Located at [`src/repositories/teacherStatistic.repository.ts`](file:///d:/e-learning-project/e-learning_server/src/repositories/teacherStatistic.repository.ts) (1,265 lines).

### 2.2 Existing Capabilities vs. TG-03A Extensions
| Capability | Existing Implementation | TG-03A Action | Final Service / Reference |
| :--- | :--- | :---: | :--- |
| **Revenue** | `getTeacherRevenueStats`: Realized revenue from completed orders over 7d/30d/12m/custom. | **Extended** | Extended with Vietnam timezone boundaries, gross vs. net, coupon discounts, revenue attribution by course, and top courses via `getRevenueAnalyticsService`. |
| **Orders** | Handled only as an order count inside `revenue` summary. No status breakdown. | **New** | Created `getOrderAnalyticsService` providing full breakdown across `COMPLETED`, `PENDING`, `REJECTED`, realized vs. pending revenue, conversion rate, and course sales. |
| **Students** | `getTeacherEnrollmentStats`: Total enrollments & recent 10 records. | **Extended** | Extended with `getStudentAnalyticsService` calculating true deduplicated unique students, first-time new students in period, and enrollment trends. |
| **Courses** | `getTeacherCoursesStats`: Pagination and basic metrics. | **Extended** | Extended with `getCourseAnalyticsService` identifying best-selling courses by revenue & volume, zero-sales courses, and status breakdown. |
| **Executive Summary** | `getTeacherOverviewMetrics`: All-time counts. | **Extended** | Extended with `getTeacherDashboardSummaryService` aggregating all-time, today, this week, and this month KPIs in a single in-process call. |

---

## 3. Exact Metric Definitions & Business Rules

| Metric Category | Field / Metric | Calculation & Business Rule | Underlying Database Fields |
| :--- | :--- | :--- | :--- |
| **Revenue** | Net Revenue | Sum of paid order totals for completed transactions (`status = COMPLETED`). | `SUM(o.total)` |
| **Revenue** | Gross Sales | Sum of original course prices before discounts. | `SUM(o.amount)` = `netRevenue + discount` |
| **Revenue** | Total Discounts | Total coupon savings granted to students. | `SUM(o.discount)` |
| **Revenue** | Average Order Value | `netRevenue / completedOrders` (0 if no completed orders). | Calculated |
| **Orders** | Total Orders | Count of all orders created for teacher's courses in period. | `COUNT(o.id)` |
| **Orders** | Completed Orders | Transactions successfully paid and fulfilled. | `COUNT(o.id) WHERE status = 'completed'` |
| **Orders** | Pending Orders | Incomplete orders awaiting payment or confirmation. | `COUNT(o.id) WHERE status = 'pending'` |
| **Orders** | Rejected Orders | Cancelled, refunded, or rejected transactions. | `COUNT(o.id) WHERE status = 'rejected'` |
| **Orders** | Realized Revenue | Net revenue received from completed orders. | `SUM(o.total) WHERE status = 'completed'` |
| **Orders** | Pending Revenue | Potential revenue held in pending orders. | `SUM(o.total) WHERE status = 'pending'` |
| **Orders** | Conversion Rate | `(completedOrders / totalOrders) * 100` | Percentage |
| **Students** | Unique Students (All-time) | Distinct users who have ever enrolled in teacher's courses. | `COUNT(DISTINCT e.user_id)` |
| **Students** | Period Unique Students | Distinct users who enrolled in teacher's courses during range. | `COUNT(DISTINCT e.user_id) in range` |
| **Students** | New Students | Distinct users whose **first-ever enrollment** occurred in range. | `MIN(e.enrolled_at) in range` |
| **Courses** | Zero-Sales Courses | Courses authored by teacher with exactly 0 completed orders. | `c.id NOT IN (completed orders)` |
| **Courses** | Best-Selling | Course with highest total revenue / highest units sold. | Ranked by `totalRevenue` & `completedOrders` |

---

## 4. Timezone Engine: `Asia/Ho_Chi_Minh` (UTC+07:00)

Located in [`src/utils/analyticsDateRange.ts`](file:///d:/e-learning-project/e-learning_server/src/utils/analyticsDateRange.ts):
- **Fixed Offset:** Vietnam observes UTC+07:00 permanently with no daylight saving time shifts.
- **Calendar Alignment:**
  - `today`: 00:00:00 to 24:00:00 VN time today.
  - `this_week`: Monday 00:00:00 to next Monday 00:00:00 VN time.
  - `this_month`: 1st day of month 00:00:00 to 1st day of next month 00:00:00 VN time.
  - `last_month`: 1st day of previous month 00:00:00 to 1st day of this month 00:00:00 VN time.
- **Conversion Math:** For any calendar date $(Y, M, D)$ in Vietnam:
  $$\text{UTC Date} = \text{Date.UTC}(Y, M, D) - (7 \times 60 \times 60 \times 1000\text{ ms})$$
- **Inclusive/Exclusive Standard:** PostgreSQL queries strictly evaluate `createdAt >= startDate AND createdAt < endDate`.

---

## 5. Security & Multi-Tenant Data Isolation

1. **Mandatory Authorization Gate:**
   Every analytics service calls [`assertTeacherAuthorization(teacherId)`](file:///d:/e-learning-project/e-learning_server/src/services/teacherAnalytics.service.ts), verifying:
   - `teacherId` is a valid RFC 4122 UUID.
   - User exists in PostgreSQL.
   - User `status === 'ACTIVE'`.
   - User `role === 'TEACHER'`.
2. **Relational Author Scoping:**
   All queries join `courses c` and enforce `WHERE c.author_id = teacherId::uuid AND c.is_destroyed = false`.
3. **No Cross-Teacher Data Leakage:**
   It is impossible for Teacher A to query orders, students, or revenues belonging to Teacher B.
4. **Parameterized SQL:**
   All raw SQL queries utilize `Prisma.sql` template tags, preventing SQL injection vulnerabilities.

---

## 6. Files Created & Modified

| File | Status | Description |
| :--- | :---: | :--- |
| [`src/utils/analyticsDateRange.ts`](file:///d:/e-learning-project/e-learning_server/src/utils/analyticsDateRange.ts) | **Created** | Timezone-aware date boundary utility for `Asia/Ho_Chi_Minh`. |
| [`src/models/teacherAnalytics.model.ts`](file:///d:/e-learning-project/e-learning_server/src/models/teacherAnalytics.model.ts) | **Created** | Zod schemas and TypeScript DTOs for revenue, orders, students, and courses. |
| [`src/repositories/teacherAnalytics.repository.ts`](file:///d:/e-learning-project/e-learning_server/src/repositories/teacherAnalytics.repository.ts) | **Created** | Functional repository with queries for order status breakdowns, new students, and course rankings. |
| [`src/repositories/index.ts`](file:///d:/e-learning-project/e-learning_server/src/repositories/index.ts) | **Modified** | Re-exported `teacherAnalyticsRepository`. |
| [`src/services/teacherAnalytics.service.ts`](file:///d:/e-learning-project/e-learning_server/src/services/teacherAnalytics.service.ts) | **Created** | High-level analytics orchestrator (`getRevenueAnalyticsService`, `getOrderAnalyticsService`, `getStudentAnalyticsService`, `getCourseAnalyticsService`, `getTeacherDashboardSummaryService`). |
| [`scripts/test_tg03a_analytics_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg03a_analytics_suite.ts) | **Created** | Automated 20-scenario test suite. |
| [`api/tg03_telegram_analytics_api.md`](file:///d:/e-learning-project/e-learning_server/api/tg03_telegram_analytics_api.md) | **Created** | Consolidated API & service integration specification. |
| [`docs/api/TG03_TELEGRAM_ANALYTICS_API.md`](file:///d:/e-learning-project/e-learning_server/docs/api/TG03_TELEGRAM_ANALYTICS_API.md) | **Created** | Synced documentation inside central project docs. |
| [`docs/TG_03A_TEACHER_ANALYTICS_CORE_REPORT.md`](file:///d:/e-learning-project/e-learning_server/docs/TG_03A_TEACHER_ANALYTICS_CORE_REPORT.md) | **Created** | This engineering implementation report. |

---

## 7. Automated Test Results

Executed via [`scripts/test_tg03a_analytics_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg03a_analytics_suite.ts):

```text
====================================================
       TG-03A: TEACHER ANALYTICS TEST SUITE         
====================================================

--- Setting up isolated test fixtures ---

--- TEST 1: Teacher With Multiple Courses ---
  ✓ [PASS] #1: Teacher A completed orders counted correctly
  ✓ [PASS] #1: Revenue broken down across multiple teacher courses

--- TEST 2: Teacher With No Courses ---
  ✓ [PASS] #2: Empty teacher catalog returns totalCourses = 0
  ✓ [PASS] #2: Empty teacher catalog returns empty courses list
  ✓ [PASS] #2: Empty teacher catalog has 0 revenue
  ✓ [PASS] #2: Empty teacher catalog has topCourse = null

--- TEST 3: Zero-Sales Courses Detection ---
  ✓ [PASS] #3: Course A3 with no sales is correctly categorized in zeroSalesCourses list
  ✓ [PASS] #3: zeroSalesCoursesCount accurately reflects courses with 0 completed orders

--- TEST 4: Completed Order Realized Revenue ---
  ✓ [PASS] #4: Course A1 realized net revenue is exactly 380,000 VND (180k + 200k) from 2 completed orders

--- TEST 5: Pending & Rejected Orders Excluded ---
  ✓ [PASS] #5: Pending orders counted in pendingOrders tally
  ✓ [PASS] #5: Rejected orders counted in rejectedOrders tally
  ✓ [PASS] #5: Realized revenue strictly excludes pending and rejected amounts

--- TEST 6: Revenue Attribution Per Course ---
  ✓ [PASS] #6: Course A2 revenue attribution is exactly 135,000 VND for 1 completed order

--- TEST 7: Multi-Teacher Data Isolation ---
  ✓ [PASS] #7: Teacher A revenue query contains no courses belonging to Teacher B
  ✓ [PASS] #7: Teacher B revenue query contains no courses belonging to Teacher A

--- TEST 8: Coupon & Discount Handling ---
  ✓ [PASS] #8: Total coupon discounts tracked and summed accurately
  ✓ [PASS] #8: Gross Revenue is mathematically equal to Net Revenue + Total Discount

--- TEST 9: Rejection & Conversion Rate ---
  ✓ [PASS] #9: Conversion rate accurately calculated from completed vs total orders

--- TEST 10: Unique Student Counting ---
  ✓ [PASS] #10: Unique students deduplicated across multiple courses

--- TEST 11: Unique Students vs Total Enrollments ---
  ✓ [PASS] #11: System correctly distinguishes total enrollments from unique individual students

--- TEST 12: Course Ranking & Top Performers ---
  ✓ [PASS] #12: Course A1 correctly identified as Best-Selling Course by Revenue
  ✓ [PASS] #12: Course A1 correctly identified as Best-Selling Course by Volume

--- TEST 13: Date Range Boundary Calculation ---
  ✓ [PASS] #13: Today range spans exactly 24 hours
  ✓ [PASS] #13: This week range spans exactly 7 days
  ✓ [PASS] #13: Last month exclusive end connects seamlessly to this month inclusive start

--- TEST 14: Asia/Ho_Chi_Minh Timezone Calculation ---
  ✓ [PASS] #14: UTC timestamp correctly translated to Vietnam local calendar components (21:30 Nov 4)
  ✓ [PASS] #14: Midnight VN time (UTC+7) translates exactly to 17:00:00 UTC previous day

--- TEST 15: Custom Date Range Validation ---
  ✓ [PASS] #15: Valid custom YYYY-MM-DD range parsed and resolved successfully
  ✓ [PASS] #15: Custom range with startDate > endDate throws validation error
  ✓ [PASS] #15: Invalid date format string throws validation error

--- TEST 16: Unauthorized Teacher Rejection ---
  ✓ [PASS] #16: Student account calling teacher analytics is rejected with authorization error
  ✓ [PASS] #16: Invalid UUID string throws validation error

--- TEST 17: Cross-Teacher Dashboard Summary Isolation ---
  ✓ [PASS] #17: Teacher identity correctly bound to authenticated context
  ✓ [PASS] #17: Teacher A and Teacher B dashboard summaries yield strictly isolated financials

--- TEST 18: Decimal Precision & Monetary Formatting ---
  ✓ [PASS] #18: Net revenue is clean JavaScript number
  ✓ [PASS] #18: Currency standard is VND

--- TEST 19: Executive Dashboard Summary KPIs ---
  ✓ [PASS] #19: Executive summary aggregates today, weekly, and monthly KPIs in a single structure

--- TEST 20: End-to-End Analytics Consistency ---
  ✓ [PASS] #20: Sum of individual course revenues strictly equals total net revenue

--- Cleaning up test fixtures ---

====================================================
RESULTS: PASSED: 38 | FAILED: 0 | BLOCKED: 0 | NOT TESTED: 0
====================================================
```

### Regression Suites Verified
- **Existing Teacher Statistics:** [`scripts/test_teacher_statistics_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_teacher_statistics_suite.ts) $\rightarrow$ **325/325 PASS** (100% success).
- **TG-02A Account Linking:** [`scripts/test_tg02a_linking_suite.ts`](file:///d:/e-learning-project/e-learning_server/scripts/test_tg02a_linking_suite.ts) $\rightarrow$ **25/25 PASS**.

---

## 8. Remaining Work & TG-03B Integration Blueprint

In **TG-03B**, the Telegram bot handlers will be implemented to expose these analytics services to teachers:
1. `/revenue [hôm nay | tuần này | tháng này]`: Calls `getRevenueAnalyticsService` and formats breakdown.
2. `/orders [hôm nay | tuần này | tháng này]`: Calls `getOrderAnalyticsService` displaying completed, pending, rejected, and conversion rate.
3. `/students`: Calls `getStudentAnalyticsService` displaying all-time unique students, new students, and enrollment progress.
4. `/courses`: Calls `getCourseAnalyticsService` displaying top sellers and zero-sales courses.
5. `/report`: Calls `getTeacherDashboardSummaryService` providing a complete executive briefing.

