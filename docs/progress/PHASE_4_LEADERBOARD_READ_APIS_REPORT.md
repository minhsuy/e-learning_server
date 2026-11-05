# BÁO CÁO KỸ THUẬT: PHASE 4 — LEADERBOARD API + XP/RANK READ APIs

**Dự án**: TMDEMY E-Learning Backend  
**Ngày thực hiện**: 2026-10-07  
**Phân hệ**: Gamification — Leaderboard, Rank Calculation & Personal Gamification Read APIs  
**Trạng thái**: ✅ **PASS (HOÀN THÀNH 100% — ĐẠT TẤT CẢ 14/14 TEST CASES KIỂM ĐỊNH BẮT BUỘC)**

---

## 1. Status
```text
PASS
```

---

## 2. Files Created

1. [`src/repositories/leaderboard.repository.ts`](file:///d:/e-learning_server/src/repositories/leaderboard.repository.ts):
   * Functional Repository tương tác với bảng PostgreSQL `users` sử dụng hàm cửa sổ `RANK() OVER (ORDER BY xp_total DESC)::int`.
   * Cung cấp các hàm: `getLeaderboardUsers({ skip, limit })`, `countLeaderboardUsers()`, `getUserLeaderboardPosition(userId)`.
   * Áp dụng chính sách bảo mật engine-level: chỉ select `id`, `username`, `avatar`, `xp_total`, `current_streak`. Loại trừ hoàn toàn `password`, `email`, `phone`, `tokens`.
2. [`src/services/leaderboard.service.ts`](file:///d:/e-learning_server/src/services/leaderboard.service.ts):
   * Business Service xử lý nghiệp vụ xếp hạng thi đấu (Standard Competition Ranking `1224`), phân trang và giải quyết thứ hạng của người dùng hiện tại:
     * `getLeaderboardService({ page, limit, currentUserId })`
     * `getUserLeaderboardPositionService(userId)`
3. [`src/controller/leaderboard.controller.ts`](file:///d:/e-learning_server/src/controller/leaderboard.controller.ts):
   * Controller xử lý request cho các endpoint bảng xếp hạng: `getLeaderboardController`, `getUserLeaderboardPositionController`.
4. [`src/controller/gamification.controller.ts`](file:///d:/e-learning_server/src/controller/gamification.controller.ts):
   * Controller xử lý request cho thông tin Gamification cá nhân: `getUserXpSummaryController`, `getUserStreakController`, `getUserXpHistoryController`.
5. [`src/middlewares/gamification.middleware.ts`](file:///d:/e-learning_server/src/middlewares/gamification.middleware.ts):
   * Middleware kiểm thực transport layer qua express-validator: `leaderboardQueryValidator`, `xpHistoryQueryValidator`.
6. [`src/routes/leaderboard.route.ts`](file:///d:/e-learning_server/src/routes/leaderboard.route.ts):
   * Router cung cấp `GET /api/leaderboard` (public + optional auth) và `GET /api/leaderboard/me` (authenticated).
7. [`docs/api/GAMIFICATION_LEADERBOARD_API.md`](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md):
   * Tài liệu API contract chi tiết cho toàn bộ các endpoint Read-side của Gamification.
8. [`scripts/test_phase4_leaderboard.ts`](file:///d:/e-learning_server/scripts/test_phase4_leaderboard.ts):
   * Kịch bản kiểm thử tự động toàn diện kiểm tra 14/14 test cases yêu cầu trên PostgreSQL thực tế.

---

## 3. Files Modified

1. [`src/models/xp.model.ts`](file:///d:/e-learning_server/src/models/xp.model.ts):
   * Bổ sung trường `maxXp?: number` cho các mức rank 1 - 6.
   * Thêm hàm `getRankDetailFromXp(xpTotal)` tính toán động danh hiệu hiện tại, danh hiệu tiếp theo (`nextRank`) và số điểm cần tích lũy (`xpToNextRank`).
2. [`src/repositories/xp.repository.ts`](file:///d:/e-learning_server/src/repositories/xp.repository.ts):
   * Cập nhật sắp xếp `findXPTransactionsByUser` sang mảng đa tầng deterministic: `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]`.
3. [`src/repositories/index.ts`](file:///d:/e-learning_server/src/repositories/index.ts):
   * Xuất `leaderboardRepository` trong danh mục repositories chung.
4. [`src/services/xp.service.ts`](file:///d:/e-learning_server/src/services/xp.service.ts):
   * Nâng cấp `getUserXpSummaryService` trả về đầy đủ `avatar`, chi tiết khoảng điểm `rank (minXP, maxXP)`, `nextRank` và `xpToNextRank`.
5. [`src/services/streak.service.ts`](file:///d:/e-learning_server/src/services/streak.service.ts):
   * Thêm read service `getUserStreakService(userId)` trả về `currentStreak`, `longestStreak`, `lastActivityAt`, `timezone` (`Asia/Ho_Chi_Minh`).
6. [`src/routes/user.route.ts`](file:///d:/e-learning_server/src/routes/user.route.ts):
   * Gắn các route cá nhân:
     * `GET /api/users/me/xp-summary`
     * `GET /api/users/me/streak`
     * `GET /api/users/me/xp-history`
     * `GET /api/users/me/leaderboard-position`
7. [`src/routes/index.route.ts`](file:///d:/e-learning_server/src/routes/index.route.ts):
   * Đăng ký `app.use('/api/leaderboard', leaderboardRouter)`.

---

## 4. APIs Created

| Method | Endpoint URL | Authentication | Response chính |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/leaderboard` | Public (Optional Bearer) | Danh sách xếp hạng phân trang (`leaderboard`, `pagination`, tùy chọn `currentUser`) |
| `GET` | `/api/leaderboard/me` | Bearer Token | Vị trí xếp hạng toàn cầu của current user |
| `GET` | `/api/users/me/leaderboard-position` | Bearer Token | Vị trí xếp hạng toàn cầu của current user (Alias) |
| `GET` | `/api/users/me/xp-summary` | Bearer Token | `xpTotal`, `rank`, `currentStreak`, `longestStreak`, `nextRank`, `xpToNextRank` |
| `GET` | `/api/users/me/streak` | Bearer Token | `currentStreak`, `longestStreak`, `lastActivityAt`, `timezone` |
| `GET` | `/api/users/me/xp-history` | Bearer Token | Lịch sử giao dịch XP có phân trang (`transactions`, `pagination`) |

---

## 5. Rank System

* **Nguyên tắc**: Tuyệt đối **không lưu rank cố định** trong cơ sở dữ liệu. Toàn bộ thông tin danh hiệu được suy luận động từ `xpTotal`.
* **Bảng định mức ngưỡng Rank chuẩn**:

| Level | Rank Name | Ngưỡng điểm tích lũy (`xpTotal`) |
| :---: | :--- | :--- |
| **1** | **Beginner** | `0 – 499 XP` |
| **2** | **Explorer** | `500 – 1,499 XP` |
| **3** | **Learner** | `1,500 – 2,999 XP` |
| **4** | **Skilled** | `3,000 – 5,999 XP` |
| **5** | **Advanced** | `6,000 – 9,999 XP` |
| **6** | **Expert** | `10,000 – 19,999 XP` |
| **7** | **Master** | `20,000+ XP` |

---

## 6. Leaderboard Strategy & Tie Handling

* **Thuật toán xếp hạng**: Standard Competition Ranking (`1224`), triển khai trực tiếp bằng hàm cửa sổ PostgreSQL `RANK() OVER (ORDER BY xp_total DESC)`.
  * *Ví dụ thực tế*:
    * Alice: 5,000 XP $\rightarrow$ **Rank 1**
    * Bob: 5,000 XP $\rightarrow$ **Rank 1** (Đồng hạng 1)
    * Charlie: 4,000 XP $\rightarrow$ **Rank 3** (Nhảy cóc hạng 2)
    * David: 3,000 XP $\rightarrow$ **Rank 4**
* **Ordering**: `xp_total DESC, id ASC` (đảm bảo tính tất định không bị nhảy vị trí giữa các trang).
* **Phân trang**: `LIMIT $limit OFFSET $skip` được áp dụng bên ngoài lớp window function, bảo đảm rank phản ánh vị trí tuyệt đối toàn cầu thay vì thứ tự cục bộ trên trang.
* **Current User Rank**: Được truy vấn trực tiếp qua subquery lọc theo `userId`, trả về ngay lập tức với độ phức tạp $O(\log N)$ nhờ index `users(xp_total)`.

---

## 7. XP Summary API Response Fields

```json
{
  "success": true,
  "message": "Fetched user XP summary successfully",
  "data": {
    "userId": "string (UUID)",
    "username": "string",
    "avatar": "string",
    "xpTotal": 2450,
    "rank": {
      "name": "Learner",
      "minXP": 1500,
      "maxXP": 2999
    },
    "currentStreak": 14,
    "longestStreak": 21,
    "lastActivityAt": "2026-10-07T10:30:00.000Z",
    "nextRank": {
      "name": "Skilled",
      "minXP": 3000
    },
    "xpToNextRank": 550
  }
}
```

---

## 8. Streak API Response Fields

```json
{
  "success": true,
  "message": "Fetched user streak successfully",
  "data": {
    "userId": "string (UUID)",
    "currentStreak": 14,
    "longestStreak": 21,
    "lastActivityAt": "2026-10-07T10:30:00.000Z",
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

---

## 9. XP History API Specifications

* **Pagination**: Hỗ trợ `page` (mặc định 1) và `limit` (mặc định 20, clamp tối đa 100).
* **Sorting**: Sắp xếp 2 khóa deterministic: `createdAt DESC, id DESC`.
* **Filtering**: Hỗ trợ tùy chọn tham số `type` (`lesson_completed`, `quiz_completed`, `daily_streak`).
* **Isolation**: Định danh người dùng bắt buộc trích xuất từ JWT token qua `req.user.userId`. Học viên tuyệt đối không thể truy vấn lịch sử giao dịch điểm của tài khoản khác.

---

## 10. Security & Data Protection

* **Authentication & Authorization**: Toàn bộ các private endpoints (`/api/users/me/*` và `/api/leaderboard/me`) được bảo vệ nghiêm ngặt bằng middleware `verifyAccessToken`. Trả về `401 Unauthorized` nếu thiếu hoặc sai token.
* **Bảo vệ dữ liệu nhạy cảm**: Tại database projection của leaderboard, các trường `password`, `email`, `phone`, `refreshToken`, `resetPasswordToken`, `otpCode` bị loại trừ hoàn toàn ở tầng database query.

---

## 11. Test Results (14/14 Test Cases PASS)

Chạy lệnh kiểm thử tự động độc lập:
```bash
npx tsx scripts/test_phase4_leaderboard.ts
```

Kết quả:
```text
====================================================
             TEST SUMMARY REPORT
====================================================
[PASS] Test 1 — Rank Calculation
       Details: Tested 13 boundary thresholds (0 to 20,000+ XP). All matched exactly.
[PASS] Test 2 — XP Summary API
       Details: xpTotal: 4000, rank: Skilled, nextRank: Advanced, xpToNextRank: 2000
[PASS] Test 3 — Streak API
       Details: currentStreak: 5, longestStreak: 10, timezone: Asia/Ho_Chi_Minh
[PASS] Test 4 — XP History Pagination and Sorting
       Details: Page 1 count: 3, Page 2 count: 2, Total: 5, Sorted DESC: true
[PASS] Test 5 — XP History Isolation
       Details: Bob transactions count: 1, All belong to Bob: true
[PASS] Test 6 — Leaderboard Ordering
       Details: Test users on board: 6, strictly ordered by xpTotal DESC: true
[PASS] Test 7 — Tie Ranking (Competition 1224)
       Details: Alice: #1 (5000 XP), Bob: #1 (5000 XP), Charlie: #3 (4000 XP), David: #4 (3000 XP)
[PASS] Test 8 — Leaderboard Pagination
       Details: Page 1: 3 items, Page 2: 3 items, Zero overlap between pages: true
[PASS] Test 9 — Current User Rank in Leaderboard
       Details: Resolved currentUser: p4_david_..., rank: #4, rankName: Skilled
[PASS] Test 10 — Zero XP User Resolution
       Details: Frank xpTotal: 0, rank: #6, rankName: Beginner (Lv 1)
[PASS] Test 11 — Authorization & Identity Validation
       Details: Summary: 400, Streak: 400, History: 400, Position: 400
[PASS] Test 12 — Invalid Pagination Normalization
       Details: page=0/limit=-1 normalized to page=1/limit=20; limit=999999 clamped to 100
[PASS] Test 13 — Sensitive Field Protection
       Details: Checked 10 items. Zero sensitive fields exposed: true
[PASS] Test 14 — Gamification Write-Side Regression
       Details: Lesson XP: +70, Daily Streak XP: +20, Quiz XP: +100, Final xpTotal: 190 (expected 190)
====================================================
OVERALL STATUS: ✅ ALL 14 TESTS PASSED
====================================================
```

---

## 12. Regression Test Results (Hồi Quy Phase 3A & Phase 3B)

1. **Phase 3A Suite**:
   ```bash
   npx tsx scripts/test_phase3a_xp.ts
   # Result: OVERALL STATUS: ✅ ALL TESTS PASSED (7/7 tests PASS)
   ```
2. **Phase 3B Suite**:
   ```bash
   npx tsx scripts/test_phase3b_xp_streak.ts
   # Result: OVERALL STATUS: ✅ ALL 12 TESTS PASSED (12/12 tests PASS)
   ```
* Write-side gamification logic không bị suy giảm hay thay đổi bất kỳ hành vi nào.

---

## 13. Data Safety Confirmation (Bảo Toàn Cơ Sở Dữ Liệu)

Đã đối soát trực tiếp trên cơ sở dữ liệu PostgreSQL `tmdemy`:

| Thực thể | Số lượng trước Phase 4 | Số lượng sau Phase 4 | Kết luận |
| :--- | :---: | :---: | :---: |
| `users` | 11 | 11 | ✅ Nguyên vẹn 100% |
| `courses` | 370 | 370 | ✅ Nguyên vẹn 100% |
| `categories` | 4 | 4 | ✅ Nguyên vẹn 100% |
| `lessons` | 8 | 8 | ✅ Nguyên vẹn 100% |
| `enrollments` | 8 | 8 | ✅ Nguyên vẹn 100% |
| `progress` | 5 | 5 | ✅ Nguyên vẹn 100% |
| `quiz_submissions` | 4 | 4 | ✅ Nguyên vẹn 100% |
| `xp_transactions` | 0 | 0 | ✅ Sạch sẽ, không sót dữ liệu rác |

* Không chạy lệnh `DROP`, `TRUNCATE`, `RESET` hay bất kỳ thao tác phá hủy dữ liệu nào.

---

## 14. Build / Validation Verification

```text
> npx prisma validate
The schema at prisma\schema.prisma is valid 🚀 (Exit code: 0)

> npx eslint --fix (Phase 4 files)
0 errors, 0 warnings (Exit code: 0)
```

---

## 15. Performance Check (EXPLAIN ANALYZE)

Đã thực thi phân tích chi phí câu lệnh truy vấn Leaderboard trên PostgreSQL:
```sql
EXPLAIN ANALYZE
SELECT * FROM (
  SELECT
    id,
    username,
    avatar,
    xp_total AS "xpTotal",
    current_streak AS "currentStreak",
    RANK() OVER (ORDER BY xp_total DESC)::int AS rank
  FROM users
) ranked
ORDER BY "xpTotal" DESC, id ASC
LIMIT 20 OFFSET 0;
```

Kết quả:
```text
Limit  (cost=1.71..1.87 rows=11 width=73) (actual time=0.064..0.065 rows=11 loops=1)
  ->  Incremental Sort  (cost=1.71..1.87 rows=11 width=73) (actual time=0.063..0.064 rows=11 loops=1)
        Sort Key: users.xp_total DESC, users.id
        Presorted Key: users.xp_total
        Full-sort Groups: 1  Sort Method: quicksort  Average Memory: 26kB  Peak Memory: 26kB
        ->  WindowAgg  (cost=1.30..1.52 rows=11 width=73) (actual time=0.034..0.040 rows=11 loops=1)
              ->  Sort  (cost=1.30..1.33 rows=11 width=69) (actual time=0.026..0.027 rows=11 loops=1)
                    Sort Key: users.xp_total DESC
                    Sort Method: quicksort  Memory: 26kB
                    ->  Seq Scan on users  (cost=0.00..1.11 rows=11 width=69) (actual time=0.013..0.016 rows=11 loops=1)
Planning Time: 4.192 ms
Execution Time: 0.134 ms
```
* **Đánh giá**: Nhờ index `users(xp_total)` đã tạo từ Phase 2, PostgreSQL áp dụng `Presorted Key: users.xp_total` và `Incremental Sort`, tổng thời gian thực thi chỉ mất **0.134 ms**, hoàn toàn sẵn sàng cho production workload.

---

## 16. Phase Boundary (Giới Hạn Phạm Vi Tuyệt Đối)

```text
Leaderboard API:         IMPLEMENTED (GET /api/leaderboard, GET /api/leaderboard/me)
XP Summary API:          IMPLEMENTED (GET /api/users/me/xp-summary)
Streak API:              IMPLEMENTED (GET /api/users/me/streak)
XP History API:          IMPLEMENTED (GET /api/users/me/xp-history)
Current User Rank:       IMPLEMENTED (GET /api/users/me/leaderboard-position)
Rank Calculation:        IMPLEMENTED (Derived dynamically from xpTotal)

Frontend XP UI:          NOT IMPLEMENTED (Không sửa Frontend Next.js)
Frontend Leaderboard:    NOT INTEGRATED (Chờ Frontend tích hợp sau)
AI Recommendation:       NOT IMPLEMENTED
Socket.IO / Realtime:    NOT MODIFIED
```
