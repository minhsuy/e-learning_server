# BÁO CÁO KỸ THUẬT: PHASE 3B — QUIZ XP + STREAK INTEGRATION

**Dự án**: TMDEMY E-Learning Backend  
**Ngày thực hiện**: 2026-10-07  
**Phân hệ**: Gamification — Quiz XP, Streak Calculation & Daily Streak XP Integration  
**Trạng thái**: ✅ **PASS (HOÀN THÀNH 100% — ĐẠT TẤT CẢ 12/12 TEST CASES KIỂM ĐỊNH BẮT BUỘC)**

---

## 1. Status
```text
PASS
```

---

## 2. Files Changed / Created

### 2.1. Files Created
1. [`src/services/streak.service.ts`](file:///d:/e-learning_server/src/services/streak.service.ts) *(Tạo mới)*:
   * Business Service tính toán chuỗi ngày học liên tiếp (`currentStreak`, `longestStreak`, `lastActivityAt`).
   * Chuẩn hóa múi giờ kinh doanh: **`Asia/Ho_Chi_Minh`** (`UTC+7`) qua `getHoChiMinhDateString()` và `getDayDifference()`.
   * Hàm chuyển đổi trạng thái thuần túy: `calculateStreakTransition(...)`.
   * Ghi nhận hoạt động học tập và tự động trao thưởng `+20 XP` Daily Streak trong giao dịch nguyên tử: `recordLearningActivityStreak({ userId, activityDate? }, tx?)`.
2. [`scripts/test_phase3b_xp_streak.ts`](file:///d:/e-learning_server/scripts/test_phase3b_xp_streak.ts) *(Tạo mới)*:
   * Kịch bản kiểm thử tự động toàn diện kiểm tra cả 12 test cases bắt buộc từ Section 28 trên database PostgreSQL thực tế.

### 2.2. Files Modified
1. [`src/repositories/xp.repository.ts`](file:///d:/e-learning_server/src/repositories/xp.repository.ts) *(Cập nhật)*:
   * Bổ sung `getUserStreakInfo(userId, tx?)` truy vấn thông tin chuỗi ngày học và điểm XP của user.
   * Bổ sung `updateUserStreakAndXp(userId, data, tx?)` cập nhật nguyên tử `currentStreak`, `longestStreak`, `lastActivityAt` và tăng `xpTotal` trong 1 query duy nhất.
2. [`src/services/xp.service.ts`](file:///d:/e-learning_server/src/services/xp.service.ts) *(Cập nhật)*:
   * Bổ sung hàm tạo eventKey tất định:
     * `buildQuizCompletionEventKey(userId, quizId)`: `quiz-complete:{userId}:{quizId}`
     * `buildDailyStreakEventKey(userId, dateStr)`: `daily-streak:{userId}:{dateStr}`
   * Bổ sung `awardQuizCompletionXP({ userId, quizId }, tx?)` (+100 XP, `QUIZ_COMPLETED`).
   * Bổ sung `awardDailyStreakXP({ userId, dateStr }, tx?)` (+20 XP, `DAILY_STREAK`).
   * Áp dụng cơ chế bắt lỗi `P2002` trên `event_key UNIQUE` ngoài transaction để bảo đảm tính lũy thừa và chống xung đột tương tranh.
3. [`src/services/quizSubmission.service.ts`](file:///d:/e-learning_server/src/services/quizSubmission.service.ts) *(Cập nhật)*:
   * Tích hợp gọi `awardQuizCompletionXP` (+100 XP) và `recordLearningActivityStreak` (+20 XP nếu là hoạt động đầu tiên trong ngày) trong cùng **một transaction nguyên tử** với `createSubmissionWithAnswers`.
   * Bảo toàn 100% API response contract cũ: `{ success: true, message: 'Quiz submitted successfully', data: { submission, scoreDisplay, percentage } }`.
4. [`src/services/progress.service.ts`](file:///d:/e-learning_server/src/services/progress.service.ts) *(Cập nhật)*:
   * Tích hợp gọi `recordLearningActivityStreak({ userId })` ngay sau khi trao Lesson XP (+70 XP) khi hoàn thành bài học (`!wasAlreadyCompleted`).
   * Bảo toàn 100% API response contract cũ.
5. [`scripts/test_phase3a_xp.ts`](file:///d:/e-learning_server/scripts/test_phase3a_xp.ts) *(Cập nhật)*:
   * Cập nhật Test 7 phản ánh đúng phần thưởng bổ sung +20 Daily Streak XP cho hoạt động đầu tiên trong ngày (Tổng: +90 XP thay vì +70 XP). Cả 2 bộ test Phase 3A và 3B đều đạt 100% PASS.

---

## 3. Quiz XP

* **Định mức thưởng**:
  ```text
  QUIZ_COMPLETED = +100 XP
  ```
  Sử dụng constant `XP_REWARDS.QUIZ_COMPLETED` tập trung từ `src/models/xp.model.ts`.
* **Định dạng Event Key**:
  ```text
  quiz-complete:{userId}:{quizId}
  ```
  Ví dụ: `quiz-complete:674a3ac4-2843-47ac-8694-c37337591298:b1f3c301-4475-4081-8077-ea6549a0d810`
* **Idempotency**:
  * Ràng buộc duy nhất `event_key UNIQUE` tại bảng PostgreSQL `xp_transactions`.
  * Nếu nộp lại hoặc retry cùng sự kiện hoàn thành Quiz, hệ thống giữ nguyên điểm số, không cộng lặp lại `+100 XP`.

---

## 4. Streak System

* **Các trường dữ liệu (Bảng `users`)**:
  * `currentStreak`: Số ngày học liên tiếp hiện tại.
  * `longestStreak`: Kỷ lục chuỗi ngày học cao nhất.
  * `lastActivityAt`: Mốc thời gian ghi nhận hoạt động học tập gần nhất (lưu trữ UTC).
* **Múi giờ kinh doanh**: **`Asia/Ho_Chi_Minh`** (`UTC+7`).
  * Tất cả các mốc ngày (`YYYY-MM-DD`) và ranh giới nửa đêm (00:00:00 - 23:59:59) đều được chuẩn hóa chính xác theo `Asia/Ho_Chi_Minh`, không phụ thuộc vào timezone của máy chủ chạy ứng dụng.
* **Quy tắc chuyển đổi Streak**:
  1. *Hoạt động lần đầu*: `currentStreak = 1`, `longestStreak = 1`, `lastActivityAt = now`.
  2. *Hoạt động cùng ngày business*: `currentStreak` không đổi, `longestStreak` giữ nguyên, `lastActivityAt = now`.
  3. *Hoạt động ngày kế tiếp liên tiếp* (`diff = 1`): `currentStreak = currentStreak + 1`, `longestStreak = max(longestStreak, currentStreak)`.
  4. *Bỏ cách ngày* (`diff > 1`): `currentStreak = 1`, `longestStreak` được bảo toàn giữ nguyên giá trị cao nhất trước đó.

---

## 5. Daily Streak XP

* **Định mức thưởng**:
  ```text
  DAILY_STREAK = +20 XP
  ```
  Sử dụng constant `XP_REWARDS.DAILY_STREAK` từ `src/models/xp.model.ts`.
* **Điều kiện nhận thưởng**:
  * Chỉ trao khi học viên có **hoạt động học tập hợp lệ đầu tiên trong một ngày kinh doanh mới** (`isFirstActivityToday === true`).
  * Các hoạt động học tập tiếp theo trong cùng một ngày (học thêm bài, làm thêm quiz) không nhận thêm `+20 XP`.
* **Định dạng Event Key**:
  ```text
  daily-streak:{userId}:{YYYY-MM-DD}
  ```
  Ngày `YYYY-MM-DD` được tính chuẩn xác theo `Asia/Ho_Chi_Minh`.
  Ví dụ: `daily-streak:674a3ac4-2843-47ac-8694-c37337591298:2026-10-07`

---

## 6. Atomicity (Tính Nguyên Tử)

* Toàn bộ chuỗi thao tác:
  1. Ghi nhận `QuizSubmission` & `QuizSubmissionAnswer` (hoặc `Progress`)
  2. Tạo bản ghi `XPTransaction` (+100 XP Quiz hoặc +70 XP Lesson)
  3. Cập nhật `User.currentStreak`, `User.longestStreak`, `User.lastActivityAt`
  4. Tạo bản ghi `XPTransaction` (+20 XP Daily Streak nếu là hoạt động đầu tiên trong ngày)
  5. Tăng tổng điểm `User.xpTotal`
* Được thực thi trong **duy nhất một giao dịch cơ sở dữ liệu (`prisma.$transaction`)**.
* Nếu bất kỳ thao tác nào thất bại, toàn bộ giao dịch được **ROLLBACK** tự động, bảo đảm không bao giờ rơi vào trạng thái dữ liệu dở dang (partial state).

---

## 7. Idempotency & Concurrency Protection

* **Ràng buộc Database**: `CREATE UNIQUE INDEX "xp_transactions_event_key_key" ON "xp_transactions"("event_key")`.
* **Xử lý Tương tranh (Race Condition)**:
  * Khi có hai request gửi đồng thời cho cùng một bài Quiz hoặc cùng một ngày học, cơ sở dữ liệu từ chối request thứ hai qua mã lỗi `P2002`.
  * Service bắt lỗi `P2002` bên ngoài transaction, tự động rollback transaction xung đột và xử lý idempotent êm dịu, không trả về mã lỗi 500 cho client.

---

## 8. Test Results (Kết Quả Kiểm Thử Thực Tế)

Toàn bộ 12 test cases bắt buộc từ Section 28 đã được thực thi và xác nhận **PASS 100%**:

```text
====================================================
             TEST SUMMARY REPORT
====================================================
[PASS] Test 1 — First Quiz Completion
       Details: Awarded: true, Amount: 100, xpTotal: 100, txn: QUIZ_COMPLETED

[PASS] Test 2 — Quiz Duplicate / Retry
       Details: Awarded: false, Amount: 0, xpTotal: 100 (expected 100), txnCount: 1

[PASS] Test 3 — First Activity of Day
       Details: currentStreak: 1, longestStreak: 1, xpTotal: 120 (expected 120: +100 Quiz +20 Streak)

[PASS] Test 4 — Same Day Second Activity
       Details: currentStreak: 1 (expected 1), dailyXpAwarded: 0 (expected 0), xpTotal: 190 (expected 190)

[PASS] Test 5 — Consecutive Day
       Details: Day 1 streak: 1, Day 2 streak: 2 (expected 2), xpTotal: 40

[PASS] Test 6 — Broken Streak
       Details: currentStreak after break: 1 (expected 1), longestStreak: 2 (expected 2 preserved)

[PASS] Test 7 — Longest Streak
       Details: Peak streak: 3, streak after gap: 1 (expected 1), longest: 3 (expected 3 preserved)

[PASS] Test 8 — Timezone Boundary (Asia/Ho_Chi_Minh)
       Details: 23:59 date: 2026-10-07, 00:00 date: 2026-10-08, day diff: 1, consecutive streak: 2

[PASS] Test 9 — Concurrent Quiz Duplicate
       Details: Awarded flags: [false, true], DB txns: 1, xpTotal: 200 (was 100, expected +100)

[PASS] Test 10 — Concurrent Daily Streak
       Details: Daily XP awarded: [0, 20], DB txns: 1, xpTotal: 20 (expected 20)

[PASS] Test 11 — Transaction Rollback
       Details: Error caught: true, xpTotal before/after: 20/20, txns before/after: 1/1

[PASS] Test 12 — Lesson XP Regression
       Details: First call: awarded=true (+70 XP), Retry call: awarded=false (0 XP), xpTotal: 90
====================================================
OVERALL STATUS: ✅ ALL 12 TESTS PASSED
====================================================
```

---

## 9. Data Safety Confirmation (Bảo Toàn Cơ Sở Dữ Liệu)

Sau khi hoàn tất toàn bộ quá trình kiểm thử tự động và thực hiện cleanup các tài khoản thử nghiệm cô lập, trạng thái cơ sở dữ liệu thực tế tại PostgreSQL `tmdemy` được xác minh nguyên vẹn 100%:

| Thực thể | Trạng thái ban đầu | Trạng thái sau Phase 3B | Kết luận |
| :--- | :---: | :---: | :---: |
| `users` | 11 | 11 | ✅ Giữ nguyên vẹn |
| `courses` | 370 | 370 | ✅ Giữ nguyên vẹn |
| `categories` | 4 | 4 | ✅ Giữ nguyên vẹn |
| `lessons` | 8 | 8 | ✅ Giữ nguyên vẹn |
| `enrollments` | 8 | 8 | ✅ Giữ nguyên vẹn |
| `progress` | 5 | 5 | ✅ Giữ nguyên vẹn |
| `quiz_submissions` | 4 | 4 | ✅ Giữ nguyên vẹn |
| `xp_transactions` | 0 | 0 | ✅ Sạch sẽ, không sót dữ liệu rác |

* Không có lệnh `DROP`, `TRUNCATE`, `RESET` hay `DELETE` nào tác động lên dữ liệu nghiệp vụ hiện hữu.

---

## 10. Phase Boundary (Giới Hạn Phạm Vi Tuyệt Đối)

```text
Lesson XP:        IMPLEMENTED (+70 XP, atomic, idempotent)
Quiz XP:          IMPLEMENTED (+100 XP, atomic, idempotent)
Streak:           IMPLEMENTED (currentStreak, longestStreak, lastActivityAt, Asia/Ho_Chi_Minh)
Daily Streak XP:  IMPLEMENTED (+20 XP, first activity of day)
Leaderboard API:  NOT IMPLEMENTED (Chưa tạo leaderboard API / routes / controllers)
Frontend XP UI:   NOT MODIFIED (Không sửa mã nguồn Frontend)
API Contract:     PRESERVED (Không thay đổi JSON response payload hiện hữu)
```

---

## 11. Next Phase Recommendation

```text
PHASE 4 — LEADERBOARD API + XP/RANK READ APIs
```
Nội dung dự kiến của Phase 4:
1. Xây dựng Leaderboard Service & Controller (`src/services/leaderboard.service.ts`, `src/controller/leaderboard.controller.ts`).
2. API lấy bảng xếp hạng người dùng theo tổng điểm XP (`GET /api/leaderboard`) với phân trang và tính toán thứ hạng.
3. API lấy thông tin Gamification cá nhân (`GET /api/users/me/xp-summary`, `GET /api/users/me/streak`).
4. API lịch sử biến động điểm kinh nghiệm (`GET /api/users/me/xp-history`).
