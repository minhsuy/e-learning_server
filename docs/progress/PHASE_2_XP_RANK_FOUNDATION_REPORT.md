# BÁO CÁO KỸ THUẬT: PHASE 2 — XP / RANK / STREAK DATABASE FOUNDATION

**Dự án**: TMDEMY E-Learning Backend  
**Ngày thực hiện**: 2026-10-07  
**Phân hệ**: Database Foundation — Gamification (XP, Rank, Streak, XP Transaction)  
**Trạng thái**: ✅ **PASS (HOÀN THÀNH 100% — ĐẠT TẤT CẢ TIÊU CHUẨN KIỂM ĐỊNH)**

---

## 1. Phase
```text
PHASE 2 — XP / RANK / STREAK DATABASE FOUNDATION
```

---

## 2. Status
```text
PASS
```

---

## 3. Schema Changes (Thay đổi Cấu trúc Database)

### 3.1. User Model (`users` table)
Bổ sung 4 trường phục vụ lưu trữ tiến trình Gamification và Streak, hoàn toàn tương thích với các bản ghi người dùng hiện hữu:

| Tên trường (Prisma) | Tên cột (PostgreSQL) | Kiểu dữ liệu | Giá trị mặc định | Ràng buộc / Ý nghĩa |
| :--- | :--- | :--- | :---: | :--- |
| `xpTotal` | `xp_total` | `INTEGER` | `0` | Tổng điểm kinh nghiệm tích lũy |
| `currentStreak` | `current_streak` | `INTEGER` | `0` | Số ngày học liên tiếp hiện tại |
| `longestStreak` | `longest_streak` | `INTEGER` | `0` | Kỷ lục chuỗi ngày học cao nhất |
| `lastActivityAt` | `last_activity_at` | `TIMESTAMP(3)` | `NULL` | Thời điểm ghi nhận hoạt động học tập gần nhất |

Quan hệ được thêm vào `User`:
* `xpTransactions XPTransaction[]`

Chỉ mục được thêm vào `User`:
* `@@index([xpTotal])` (Hỗ trợ truy vấn Leaderboard / Xếp hạng tốc độ cao)

### 3.2. XPTransaction Model (`xp_transactions` table)
Tạo mới bảng lưu vết lịch sử giao dịch XP độc lập:

| Tên trường (Prisma) | Tên cột (PostgreSQL) | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :---: | :--- |
| `id` | `id` | `UUID` | `PRIMARY KEY` | Khóa chính UUID v4 chuẩn RFC 4122 |
| `userId` | `user_id` | `UUID` | `NOT NULL, FK` | Khóa ngoại tham chiếu `users(id)` |
| `amount` | `amount` | `INTEGER` | `NOT NULL` | Lượng XP (+70, +100, +20, hỗ trợ cả số âm nếu cần điều chỉnh) |
| `type` | `type` | `XPTransactionType` | `NOT NULL` | Phân loại nguồn sinh XP |
| `eventKey` | `event_key` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Khóa sự kiện duy nhất chống duplicate XP |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | `DEFAULT now()` | Thời điểm giao dịch XP được tạo |

### 3.3. XPTransactionType Enum
Tạo mới kiểu Enum chuẩn PostgreSQL:
```prisma
enum XPTransactionType {
  LESSON_COMPLETED @map("lesson_completed")
  QUIZ_COMPLETED   @map("quiz_completed")
  DAILY_STREAK     @map("daily_streak")
}
```

---

## 4. Constraints & Idempotency (Ràng buộc & Tính Lũy Thừa)

* **Primary Key**: `xp_transactions_pkey` trên cột `id` (UUID).
* **Foreign Key**: `xp_transactions_user_id_fkey` tham chiếu `users(id)` với `onDelete: Cascade` và `onUpdate: Cascade`.
  * *Lý do chọn CASCADE*: `XPTransaction` là dữ liệu phụ thuộc hoàn toàn vào User (lịch sử điểm của chính user đó). Khi một User bị xóa khỏi hệ thống, toàn bộ lịch sử điểm của user đó được thu hồi theo chuẩn quản trị.
* **Idempotency Guarantee (`eventKey UNIQUE`)**:
  * Ràng buộc `CREATE UNIQUE INDEX "xp_transactions_event_key_key" ON "xp_transactions"("event_key");` bảo đảm ở cấp độ Database Engine rằng **1 business event = duy nhất 1 XP transaction**.
  * Định dạng eventKey chuẩn cho Phase 3:
    * `lesson-complete:{userId}:{lessonId}`
    * `quiz-complete:{userId}:{quizId}`
    * `daily-streak:{userId}:{YYYY-MM-DD}`
  * Mọi nỗ lực ghi nhận trùng lặp từ Client/Network retry sẽ bị chặn đứng bởi vi phạm Unique Constraint (`P2002`).
* **Indexes**:
  * `users_xp_total_idx` trên `users(xp_total)` phục vụ sắp xếp bảng xếp hạng (`ORDER BY xp_total DESC`).
  * `xp_transactions_user_id_created_at_idx` trên `xp_transactions(user_id, created_at)` phục vụ truy vấn lịch sử XP theo thứ tự thời gian.
  * `xp_transactions_user_id_type_created_at_idx` trên `xp_transactions(user_id, type, created_at)` phục vụ lọc lịch sử XP theo phân loại.

---

## 5. Migration Details

* **Migration Name**: `add_xp_rank_system`
* **Migration Directory**: `prisma/migrations/20261007114016_add_xp_rank_system/migration.sql`
* **Status**: Applied successfully, database in sync.
* **Phương thức**: Non-destructive `ALTER TABLE` & `CREATE TABLE`.

---

## 6. Validation Results (Kiểm Định Công Cụ)

```text
> npx prisma validate
Environment variables loaded from .env
The schema at prisma\schema.prisma is valid 🚀

> npx prisma migrate status
Environment variables loaded from .env
Datasource "db": PostgreSQL database "tmdemy", schema "public" at "localhost:5432"
4 migrations found in prisma/migrations
Database schema is up to date!

> npx prisma generate
Environment variables loaded from .env
✔ Generated Prisma Client (v6.4.1) to .\node_modules\@prisma\client in 241ms
```

---

## 7. Data Safety Confirmation (Bảo Toàn Dữ Liệu Thực Tế)

Đã đối soát trực tiếp trên cơ sở dữ liệu PostgreSQL `tmdemy`:

```text
Existing users preserved:          YES (11/11 users nguyên vẹn)
Existing courses preserved:        YES (370/370 courses nguyên vẹn)
Existing categories preserved:     YES (4/4 categories nguyên vẹn)
Existing lessons preserved:        YES (8/8 lessons nguyên vẹn)
Existing enrollments preserved:    YES (8/8 enrollments nguyên vẹn)
Existing progress preserved:       YES (5/5 progress rows nguyên vẹn)
Existing quiz submissions:         YES (4/4 submissions nguyên vẹn)
No XP seeded:                      CONFIRMED (xp_transactions count = 0)
No streak seeded:                  CONFIRMED (current_streak = 0, longest_streak = 0 cho tất cả users)
No fake user XP:                   CONFIRMED (xp_total = 0 cho tất cả users)
No database reset:                 CONFIRMED (Zero data loss)
```

---

## 8. Business Design (Thiết Kế Định Mức Điểm & Rank)

Đã định nghĩa tập trung tại [xp.model.ts](file:///d:/e-learning_server/src/models/xp.model.ts):

* **Định mức thưởng XP (`XP_REWARDS`)**:
  * `LESSON_COMPLETED`: **+70 XP**
  * `QUIZ_COMPLETED`: **+100 XP**
  * `DAILY_STREAK`: **+20 XP**
* **Nguyên lý Rank (Derived Rank)**:
  * Tuyệt đối **không lưu rank cố định** trong bảng `users`.
  * Rank được tính toán động (dynamically derived) từ `xpTotal`:
    * `0 – 499 XP` $\rightarrow$ **Level 1: Beginner**
    * `500 – 1499 XP` $\rightarrow$ **Level 2: Explorer**
    * `1500 – 2999 XP` $\rightarrow$ **Level 3: Learner**
    * `3000 – 5999 XP` $\rightarrow$ **Level 4: Skilled**
    * `6000 – 9999 XP` $\rightarrow$ **Level 5: Advanced**
    * `10000 – 19999 XP` $\rightarrow$ **Level 6: Expert**
    * `20000+ XP` $\rightarrow$ **Level 7: Master**

---

## 9. Streak Design (Thiết Kế Chuỗi Ngày Học Liên Tiếp)

* **Các trường cốt lõi**:
  * `currentStreak`: Số ngày học liên tiếp hiện tại.
  * `longestStreak`: Chuỗi ngày học dài nhất từng đạt được.
  * `lastActivityAt`: Mốc thời gian UTC ghi nhận hoạt động học tập gần nhất.
* **Quy chuẩn Timezone**:
  * Thiết lập múi giờ kinh doanh chính thức: **`Asia/Ho_Chi_Minh`** (`UTC+7`).
  * Ở phase tích hợp sau, việc tính toán ranh giới ngày học (Day Boundary: 00:00:00 - 23:59:59) bắt buộc chuyển đổi theo `Asia/Ho_Chi_Minh`, không dựa ngầm định vào timezone của server hay máy client.

---

## 10. Phase Boundary (Giới Hạn Phạm Vi Tuyệt Đối Của Phase 2)

Tuân thủ nghiêm ngặt chỉ dẫn:
```text
XP event integration:   NOT IMPLEMENTED (Không can thiệp vào logic hoàn thành bài học)
Lesson XP reward:       NOT IMPLEMENTED (Chưa cộng điểm khi học xong)
Quiz XP reward:         NOT IMPLEMENTED (Chưa cộng điểm khi nộp quiz)
Streak calculation:     NOT IMPLEMENTED (Chưa tính streak tự động)
Leaderboard API:        NOT IMPLEMENTED (Chưa tạo route/controller BXH)
Frontend XP UI:         NOT IMPLEMENTED (Không sửa mã nguồn Frontend)
```

---

## 11. Next Phase Recommendation (Đề Xuất Phase Kế Tiếp)

```text
PHASE 3 — XP EVENT INTEGRATION & STREAK SERVICE
```
Nội dung dự kiến của Phase 3:
1. Tạo Functional Repository `src/repositories/xp.repository.ts`.
2. Tạo Business Service `src/services/xp.service.ts` (xử lý atomic transaction, eventKey idempotency, cộng `xpTotal`, cập nhật streak theo timezone `Asia/Ho_Chi_Minh`).
3. Tích hợp điểm thưởng vào luồng hoàn thành Lesson (`lesson.service.ts`).
4. Tích hợp điểm thưởng vào luồng nộp Quiz (`quizSubmission.service.ts`).
5. Xây dựng Leaderboard Service & API.
