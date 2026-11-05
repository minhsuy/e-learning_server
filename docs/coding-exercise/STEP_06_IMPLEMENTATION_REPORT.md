# TMDEMY — STEP 6 IMPLEMENTATION REPORT
## CODING EXERCISE COMPLETION TRACKING, XP REWARDS & LEARNING PROGRESS REFINEMENT

- **Dự án**: TMdemy E-Learning Backend (Graduation Thesis)
- **Tác giả**: Senior Backend Architect, Node.js/TypeScript Engineer, Prisma/PostgreSQL Specialist
- **Mốc thực hiện**: Step 6 — Coding Exercise Completion Tracking, Dedicated XP Rewards & Learning Progress Refinement
- **Trạng thái**: **COMPLETED & FULLY VERIFIED (100% PASS)**
- **Ngày hoàn thành**: 25/10/2026
- **Môi trường Database**: PostgreSQL 16.11 (`localhost:5432/tmdemy`) qua Prisma ORM Singleton (v6.4.1)

---

## 1. EXECUTIVE SUMMARY

Trong giai đoạn Step 5 trước đây, khi học viên nộp bài làm coding exercise đạt trạng thái `ACCEPTED`, hệ thống đã vô tình kích hoạt trực tiếp hàm `markLessonCompleteService({ userId, courseId, lessonId })`. Điều này dẫn đến một lỗi nghiệp vụ nghiêm trọng: **Toàn bộ bài học (Lesson) bị đánh dấu hoàn thành tự động 100% ngay cả khi bài học đó còn chứa Video bài giảng, Bài kiểm tra Quiz hoặc nhiều Bài tập thực hành khác chưa được giải quyết**.

**Step 6** đã giải quyết triệt để vấn đề này bằng việc tái cấu trúc và phân định rạch ròi giữa hai khái niệm nghiệp vụ độc lập:
1. **Coding Exercise Completion (Hoàn thành bài tập lập trình)**: Theo dõi trạng thái hoàn thành độc lập của từng học viên trên từng bài tập cụ thể (`userId + exerciseId`), lưu trữ thực thể vật lý trong bảng `coding_exercise_completions`, ghi nhận điểm số cao nhất (`bestScore`), số lượt thử (`totalAttempts`), và cấp phần thưởng Dedicated Coding XP.
2. **Lesson Completion (Hoàn thành bài học)**: Tách rời hoàn toàn khỏi luồng nộp bài tập code. Bài học chỉ được hoàn thành khi có hành động tường minh hợp lệ từ người dùng (`POST /api/progress/complete`) hoặc thỏa mãn toàn bộ điều kiện học tập tổng thể của khóa học.

### Kết quả định lượng sau Step 6:
* **Prisma Migration**: `20261025025233_add_coding_exercise_completion_and_xp` đã được áp dụng thành công lên cơ sở dữ liệu vật lý với đầy đủ truy vấn backfill lịch sử, khóa ngoại `Cascade`, và ràng buộc duy nhất `@@unique([userId, exerciseId])`.
* **Dedicated Coding XP**: Bổ sung giá trị `coding_exercise_completed` vào enum `XPTransactionType` với chính sách thưởng chuẩn: `EASY: +30 XP`, `MEDIUM: +50 XP`, `HARD: +80 XP` cùng khóa bất biến `coding-exercise-complete:{userId}:{exerciseId}`.
* **API Endpoints**: Mở rộng từ 13 lên **15 REST Endpoints** trong phân hệ Coding Exercise (tổng toàn hệ thống TMDEMY tăng từ 129 lên **131 REST Endpoints**).
* **Kết quả kiểm thử tự động**:
  * Step 6 Test Suite (`scripts/test_step6_coding_completion_progress.ts`): **87/87 checks PASSED (100%)**.
  * Step 5 Regression Suite: **61/61 checks PASSED (100%)**.
  * Step 4 Regression Suite: **33/33 checks PASSED (100%)**.
  * Step 3 Live E2B Sandbox Regression Suite: **24/24 checks PASSED (100%)**.
  * Step 2 CRUD Regression Suite: **37/37 checks PASSED (100%)**.
  * **Tổng cộng: 242/242 kiểm thử regression đã vượt qua thành công với 0 lỗi**.

---

## 2. INITIAL SOURCE-CODE AUDIT FINDINGS

Trước khi can thiệp mã nguồn, quá trình kiểm toán toàn diện đã ghi nhận các phát hiện then chốt sau:

1. **Khớp nối sai lệch tại `src/services/codingSubmission.service.ts`**:
   * Tại dòng 417-434 (phiên bản Step 5 cũ), khi `executionResult.status === SubmissionStatus.ACCEPTED`, code gọi `markLessonCompleteService({ userId, courseId, lessonId })`.
   * Lệnh này gọi trực tiếp `upsertProgress` đẩy `completed: true` vào bảng `progress`, sau đó tính lại `Enrollment.progress` thành `100%`, cập nhật `Enrollment.status = COMPLETED`, và trao `+70 XP` cho `LESSON_COMPLETED`.
   * Hậu quả: Học viên chỉ cần giải đúng 1 bài tập EASY đơn giản là khóa học nhảy vọt lên 100%, có nguy cơ được cấp Chứng chỉ tốt nghiệp trái phép dù chưa xem video và chưa làm quiz.

2. **Thiếu vắng Dedicated XP Type cho Coding Exercise**:
   * Enum `XPTransactionType` trong `prisma/schema.prisma` và `src/models/xp.model.ts` chỉ có: `LESSON_COMPLETED`, `QUIZ_COMPLETED`, `DAILY_STREAK`.
   * Việc không có loại giao dịch riêng dẫn đến sự nhầm lẫn dữ liệu kiểm toán khi trao thưởng.

3. **Thiếu bảng theo dõi hoàn thành cấp bài tập**:
   * Bảng `coding_submissions` lưu trữ toàn bộ các lần nộp (mỗi lần submit sinh 1 row), dẫn đến việc muốn xác định học viên đã hoàn thành bài tập hay chưa phải chạy `COUNT(*)` hoặc `findFirst` với trạng thái `accepted` trên hàng triệu bản ghi lịch sử, gây suy giảm hiệu năng nghiêm trọng ($O(N)$ query).

---

## 3. FINAL ARCHITECTURE & DESIGN DECISIONS

### Quyết định 1: Lựa chọn Option B — Dedicated Completion Model
* **Lý do bác bỏ Option A (Derived Completion)**:
  * Option A phải quét bảng `coding_submissions` mỗi khi cần render danh sách bài học hoặc tính tiến độ bài học. Khi số lượng submission tăng lên hàng triệu, việc tính toán động sẽ gây N+1 queries và làm chậm trang frontend.
  * Option A không cung cấp ràng buộc duy nhất ở tầng cơ sở dữ liệu (`unique constraint`), dễ dẫn đến race condition khi trao thưởng XP.
* **Lợi ích của Option B (`CodingExerciseCompletion`)**:
  * Lưu trữ thực thể vật lý với khóa phức hợp duy nhất `@@unique([userId, exerciseId])`.
  * Truy vấn kiểm tra hoàn thành với độ phức tạp $O(1)$ thông qua chỉ mục b-tree.
  * Hỗ trợ lưu trữ sẵn `firstAcceptedSubmissionId`, `bestScore`, `totalAttempts`, `xpAwarded`, và `completedAt`.
  * Cho phép truy vấn tiến độ bài tập theo lô (`findCompletionsByUserAndExerciseIds`) chỉ trong 1 truy vấn SQL duy nhất.

### Quyết định 2: Dedicated XP Transaction Enum & Idempotency Key
* Bổ sung giá trị `coding_exercise_completed` vào PostgreSQL Enum `XPTransactionType`.
* Định dạng eventKey bất biến và duy nhất tuyệt đối:
  ```
  coding-exercise-complete:{userId}:{exerciseId}
  ```
* Ràng buộc duy nhất `xp_transactions.event_key` tại mức PostgreSQL bảo vệ 100% chống lại các cuộc gọi đồng thời (Concurrent Race Conditions).

### Quyết định 3: Tách rời hoàn toàn khỏi Lesson Progress
* Xóa bỏ hoàn toàn lời gọi `markLessonCompleteService` trong luồng xử lý `submitCodeService`.
* `Enrollment.progress` không bị tác động bởi bài nộp code.
* `progress` trả về trong payload của submission chỉ mang tính phản ánh hiện trạng bài học thật sự của học viên (`lessonCompleted: false` nếu bài học chưa được hoàn thành độc lập).

---

## 4. COMPLETION TRACKING IMPLEMENTATION

### 4.1. Thực thể `CodingExerciseCompletion`
Định nghĩa trong `prisma/schema.prisma`:
```prisma
model CodingExerciseCompletion {
  id                         String           @id @default(uuid()) @db.Uuid
  userId                     String           @map("user_id") @db.Uuid
  exerciseId                 String           @map("exercise_id") @db.Uuid
  firstAcceptedSubmissionId String           @map("first_accepted_submission_id") @db.Uuid
  completedAt                DateTime         @default(now()) @map("completed_at")
  bestScore                  Int              @default(100) @map("best_score")
  totalAttempts              Int              @default(1) @map("total_attempts")
  xpAwarded                  Int              @default(0) @map("xp_awarded")
  createdAt                  DateTime         @default(now()) @map("created_at")
  updatedAt                  DateTime         @updatedAt @map("updated_at")

  user                    User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise                CodingExercise   @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  firstAcceptedSubmission CodingSubmission @relation(fields: [firstAcceptedSubmissionId], references: [id], onDelete: Cascade)

  @@unique([userId, exerciseId])
  @@index([userId])
  @@index([exerciseId])
  @@map("coding_exercise_completions")
}
```

### 4.2. Functional Repository (`src/repositories/codingCompletion.repository.ts`)
Tuân thủ chuẩn mực Functional Repository không class, hỗ trợ `tx?: PrismaTransactionClient`:
* `findCompletionByUserAndExercise(userId, exerciseId, tx)`: Tra cứu $O(1)$ theo khóa phức hợp `userId_exerciseId`.
* `findCompletionsByUserAndLesson(userId, lessonId, tx)`: Tra cứu toàn bộ bài hoàn thành theo bài học.
* `findCompletionsByUserAndExerciseIds(userId, exerciseIds, tx)`: Batch query theo danh sách ID để triệt tiêu lỗi N+1 queries.
* `createCodingExerciseCompletion(data, tx)`: Tạo bản ghi hoàn thành mới.
* `upsertCodingExerciseCompletion(data, tx)`: Tăng số lần thử hoặc cập nhật điểm cao nhất.

---

## 5. DATABASE SCHEMA & MIGRATION CHANGES

### 5.1. File Migration
Đã sinh và áp dụng migration tại:
`prisma/migrations/20261025025233_add_coding_exercise_completion_and_xp/migration.sql`

Nội dung SQL chính thức:
```sql
-- AlterEnum
ALTER TYPE "XPTransactionType" ADD VALUE 'coding_exercise_completed';

-- CreateTable
CREATE TABLE "coding_exercise_completions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "first_accepted_submission_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "best_score" INTEGER NOT NULL DEFAULT 100,
    "total_attempts" INTEGER NOT NULL DEFAULT 1,
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_exercise_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coding_exercise_completions_user_id_idx" ON "coding_exercise_completions"("user_id");
CREATE INDEX "coding_exercise_completions_exercise_id_idx" ON "coding_exercise_completions"("exercise_id");
CREATE UNIQUE INDEX "coding_exercise_completions_user_id_exercise_id_key" ON "coding_exercise_completions"("user_id", "exercise_id");

-- AddForeignKey
ALTER TABLE "coding_exercise_completions" ADD CONSTRAINT "coding_exercise_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coding_exercise_completions" ADD CONSTRAINT "coding_exercise_completions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "coding_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coding_exercise_completions" ADD CONSTRAINT "coding_exercise_completions_first_accepted_submission_id_fkey" FOREIGN KEY ("first_accepted_submission_id") REFERENCES "coding_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill historical completions from existing accepted submissions
INSERT INTO "coding_exercise_completions" (
    "id", "user_id", "exercise_id", "first_accepted_submission_id", "completed_at", "best_score", "total_attempts", "xp_awarded", "created_at", "updated_at"
)
SELECT
    gen_random_uuid(),
    s."user_id",
    s."exercise_id",
    s."id",
    COALESCE(s."completed_at", s."created_at"),
    s."score",
    1,
    CASE
        WHEN e."difficulty" = 'easy' THEN 30
        WHEN e."difficulty" = 'medium' THEN 50
        WHEN e."difficulty" = 'hard' THEN 80
        ELSE 30
    END,
    s."created_at",
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON ("user_id", "exercise_id") *
    FROM "coding_submissions"
    WHERE "status" = 'accepted'
    ORDER BY "user_id", "exercise_id", "created_at" ASC
) s
JOIN "coding_exercises" e ON s."exercise_id" = e."id"
ON CONFLICT ("user_id", "exercise_id") DO NOTHING;
```

---

## 6. XP & STREAK INTEGRATION

### 6.1. Bảng Điểm Thưởng Dedicated Coding XP
Định nghĩa tại `src/models/xp.model.ts`:
```typescript
export const CODING_EXERCISE_REWARDS = {
  EASY: 30,
  MEDIUM: 50,
  HARD: 80
} as const
```

### 6.2. Hàm Trao Thưởng Atomic (`src/services/xp.service.ts`)
Triển khai hàm `awardCodingExerciseCompletionXP`:
* Nhận tham số `{ userId, exerciseId, difficulty }, tx`.
* Tự động tính XP theo độ khó: `EASY -> 30`, `MEDIUM -> 50`, `HARD -> 80`.
* Sinh khóa bất biến: `buildCodingExerciseCompletionEventKey(userId, exerciseId)`.
* Thực hiện đồng thời trong Prisma Transaction:
  1. Ghi bản ghi `xPTransaction` với loại `CODING_EXERCISE_COMPLETED`.
  2. Tăng điểm nguyên tử cho `users.xp_total` (`incrementUserXp`).
* Bắt lỗi `P2002` (Unique constraint violation trên event_key) để xử lý mượt mà khi có nhiều request đồng thời, đảm bảo không bao giờ bị nhân đôi XP.

### 6.3. Tích Hợp Streak (Chuỗi Ngày Học)
* Giữ nguyên cơ chế `recordLearningActivityStreak({ userId })` theo múi giờ `Asia/Ho_Chi_Minh`.
* Lần nộp bài đạt `ACCEPTED` đầu tiên trong ngày nhận thưởng `+20 XP` chuỗi học và tăng streak lên 1 ngày.
* Các lần nộp bài tiếp theo trong cùng một ngày nhận `dailyStreakXpAwarded: 0` và streak không bị tăng ảo.

---

## 7. LESSON & COURSE PROGRESS CHANGES

### 7.1. Phân định Hoàn Toàn Tiến Độ
* Khi nộp bài đúng (`ACCEPTED`), hệ thống ghi nhận `completion` của bài tập lập trình nhưng **KHÔNG ĐỤNG CHẠM** đến bảng `progress`.
* Tiến độ khóa học (`Enrollment.progress`) giữ nguyên trạng thái thực tế của bài học (0% nếu chưa học xong bài học).
* Nút đánh dấu bài học hoàn thành (`POST /api/progress/complete`) vẫn duy trì hoạt động bình thường, trao thưởng `+70 XP` cho `LESSON_COMPLETED` khi học viên hoàn thành bài học một cách độc lập.

### 7.2. Nguyên Tắc Mẫu Số Tiến Độ Bài Học
Trong API `GET /api/coding-exercises/lesson/:lessonId/progress`:
* **Mẫu số (`totalExercises`)**: Chỉ tính các bài tập lập trình đang ở trạng thái `PUBLISHED` và có bản sửa đổi xuất bản hợp lệ (`revisions.length > 0`). Các bài tập ở trạng thái `DRAFT` hoặc `ARCHIVED` bị loại khỏi mẫu số chương trình học.
* **Tử số (`completedExercises`)**: Số lượng bài tập `PUBLISHED` mà học viên đã giải đúng (`completed === true`).
* **Tỷ lệ (`completionPercentage`)**: `Math.round((completedExercises / totalExercises) * 100)`. Nếu bài học không có bài tập nào, trả về 0%.

---

## 8. ALL FILES CREATED, MODIFIED, AND DELETED

| Hành Động | Đường Dẫn File | Mục Đích & Nội Dung |
| :--- | :--- | :--- |
| **CREATED** | `src/repositories/codingCompletion.repository.ts` | Functional Repository cho bảng `coding_exercise_completions` ($O(1)$ query, batch query). |
| **CREATED** | `src/services/codingCompletion.service.ts` | Service xử lý lấy trạng thái hoàn thành bài tập và tiến độ lập trình của bài học. |
| **CREATED** | `prisma/migrations/20261025025233_add_coding_exercise_completion_and_xp/migration.sql` | Migration SQL vật lý thêm bảng completions, enum value, và backfill dữ liệu lịch sử. |
| **CREATED** | `scripts/test_step6_coding_completion_progress.ts` | Bộ kiểm thử tự động toàn diện Step 6 bao gồm 7 nhóm kiểm thử (87 checks). |
| **CREATED** | `docs/coding-exercise/STEP_06_IMPLEMENTATION_REPORT.md` | Báo cáo kỹ thuật triển khai Step 6. |
| **MODIFIED** | `prisma/schema.prisma` | Thêm enum `CODING_EXERCISE_COMPLETED`, quan hệ và model `CodingExerciseCompletion`. |
| **MODIFIED** | `src/models/xp.model.ts` | Bổ sung `CODING_EXERCISE_COMPLETED` và `CODING_EXERCISE_REWARDS`. |
| **MODIFIED** | `src/services/xp.service.ts` | Bổ sung hàm `awardCodingExerciseCompletionXP` và `buildCodingExerciseCompletionEventKey`. |
| **MODIFIED** | `src/services/codingSubmission.service.ts` | Xóa bỏ `markLessonCompleteService`, tích hợp `CodingExerciseCompletion` và dedicated XP. |
| **MODIFIED** | `src/controller/codingExercise.controller.ts` | Thêm `getExerciseCompletionController` và `getLessonCodingProgressController`. |
| **MODIFIED** | `src/routes/codingExercise.route.ts` | Đăng ký route `GET /:id/completion` và `GET /lesson/:lessonId/progress`. |
| **MODIFIED** | `scripts/test_step5_coding_exercise_publish_gamification.ts` | Cập nhật assertion cho chính sách tách rời bài học và 15 routes. |
| **MODIFIED** | `docs/api/CODING_EXERCISE_API.md` | Bổ sung tài liệu 2 endpoint mới, cập nhật payload submit, và hướng dẫn Frontend 10 bước. |
| **MODIFIED** | `docs/api/API_INDEX.md` | Cập nhật tổng số endpoints lên 131 và bổ sung 2 endpoints mới vào bảng danh mục. |
| **DELETED** | *Không có file nào bị xóa* | Duy trì tính toàn vẹn 100% của hệ sinh thái backend hiện tại. |

---

## 9. NEW & MODIFIED API ENDPOINTS

Hệ thống bổ sung **2 endpoint mới** và nâng cấp **1 endpoint hiện có**:

### 1. `GET /api/coding-exercises/:id/completion` (NEW)
* **Mục đích**: Lấy trạng thái hoàn thành độc lập của bài tập lập trình, điểm cao nhất, số lần thử và XP nhận được.
* **Quyền truy cập**: Học viên (chính chủ), Giảng viên chủ khóa học, Admin.

### 2. `GET /api/coding-exercises/lesson/:lessonId/progress` (NEW)
* **Mục đích**: Lấy tiến độ giải bài tập lập trình của toàn bộ bài học (danh sách từng bài, tỷ lệ % hoàn thành).
* **Quyền truy cập**: Học viên đã ghi danh (hoặc bài học demo), Giảng viên, Admin.

### 3. `POST /api/coding-exercises/:id/submit` (MODIFIED)
* **Cải tiến**:
  * Bổ sung trường `completion`: `{ exerciseCompleted: boolean, firstCompletion: boolean, completedAt: string | null }`.
  * Bổ sung trường `rewards`: `{ codingXpAwarded: number, dailyStreakXpAwarded: number, totalXpAwarded: number }`.
  * Không còn tự động đổi `progress.lessonCompleted = true` hoặc đẩy `courseProgress` lên 100%.

---

## 10. REQUEST AND RESPONSE CHANGES

### Payload trả về từ `POST /api/coding-exercises/:id/submit` (Mẫu thực tế)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Submission graded successfully",
  "data": {
    "id": "c1111111-2222-4333-8444-555555555555",
    "_id": "c1111111-2222-4333-8444-555555555555",
    "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "revisionId": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
    "revisionVersion": 1,
    "status": "ACCEPTED",
    "score": 100,
    "maxScore": 100,
    "passedTests": 2,
    "totalTests": 2,
    "totalExecutionTimeMs": 35,
    "completedAt": "2026-10-25T09:00:00.000Z",
    "results": [ ... ],
    "completion": {
      "exerciseCompleted": true,
      "firstCompletion": true,
      "completedAt": "2026-10-25T09:00:00.000Z"
    },
    "rewards": {
      "codingXpAwarded": 30,
      "dailyStreakXpAwarded": 20,
      "totalXpAwarded": 50
    },
    "streak": {
      "currentStreak": 1,
      "longestStreak": 1,
      "dailyXpAwarded": 20,
      "isFirstActivityToday": true
    },
    "progress": {
      "courseProgress": 0,
      "lessonCompleted": false
    }
  }
}
```

---

## 11. SECURITY & AUTHORIZATION CHECKS

1. **Bảo vệ chống xem trộm tiến độ (IDOR Protection)**:
   * Trong `getExerciseCompletionService` và `getLessonCodingProgressService`, nếu một tài khoản học viên (`role === USER`) truyền tham số `targetUserId` khác với `req.user.id`, hệ thống lập tức từ chối với mã lỗi `403 Forbidden` (`"You are not authorized to view another student's completion status"`).
2. **Kiểm tra ghi danh khóa học (Enrollment Guard)**:
   * Học viên chưa ghi danh vào khóa học trả phí (`!lesson.isDemo && !enrollment`) bị chặn truy cập với `403 Forbidden`.
3. **Anti-Cheat Redaction**:
   * Các test cases ẩn (`isHidden === true`) tiếp tục được che giấu tuyệt đối cả trong bài nộp lẫn chi tiết bài tập. Học viên không bao giờ thấy `input`, `expectedOutput`, hoặc `stdout` của test ẩn.
4. **Bảo mật Lời giải mẫu (Reference Solution Privacy)**:
   * `referenceSolution` và `executionContract` chi tiết chỉ mở cho Giảng viên tác giả khóa học hoặc Admin tại endpoint `/:id/manage`.

---

## 12. CONCURRENCY & IDEMPOTENCY STRATEGY

1. **Khóa E2B Sandbox Ngoài Transaction**:
   * Tuân thủ tuyệt đối quy tắc kiến trúc: **Không bao giờ mở transaction database khi gọi Sandbox E2B**.
   * Toàn bộ quá trình chạy code trên cloud diễn ra độc lập, sau đó mới mở short transaction để lưu kết quả chấm điểm.
2. **Nguyên tử hóa Hoàn thành & Trao thưởng XP**:
   * Khi `status === ACCEPTED`, việc tạo bản ghi `CodingExerciseCompletion` và tạo `xPTransaction` được thực hiện bên trong cùng một Prisma transaction:
     ```typescript
     await prisma.$transaction(async (tx) => {
       const existing = await findCompletionByUserAndExercise(userId, exerciseId, tx)
       if (!existing) {
         await awardCodingExerciseCompletionXP({ userId, exerciseId, difficulty }, tx)
         await createCodingExerciseCompletion({ ... }, tx)
       } else {
         await tx.codingExerciseCompletion.update({ ... })
       }
     })
     ```
3. **Phòng vệ Chống Race Condition**:
   * Ràng buộc duy nhất `@@unique([userId, exerciseId])` ở mức cơ sở dữ liệu ngăn chặn việc chèn 2 bản ghi hoàn thành khi có 2 request nộp bài đồng thời.
   * Ràng buộc duy nhất trên `xp_transactions.event_key` đảm bảo tài khoản không bị cộng trùng XP dù mạng bị retry.

---

## 13. ACTUAL AUTOMATED TEST RESULTS

Lệnh thực thi:
```bash
cmd.exe /c npx tsx scripts/test_step6_coding_completion_progress.ts
```

Kết quả thực tế:
```text
=================================================================
STARTING TMDEMY STEP 6 AUTOMATED VERIFICATION SUITE
=================================================================

--- Setting Up Database Test Entities ---
Database test setup complete.

--- GROUP 1: Completion Tracking ---
  PASS: [Group 1] RUN execution succeeded
  PASS: [Group 1] RUN never creates a completion record
  PASS: [Group 1] WRONG_ANSWER submission graded
  PASS: [Group 1] Response indicates exerciseCompleted: false
  PASS: [Group 1] WRONG_ANSWER does not complete the exercise
  PASS: [Group 1] First submission accepted with 200
  PASS: [Group 1] Status is ACCEPTED
  PASS: [Group 1] Response completion.exerciseCompleted is true
  PASS: [Group 1] Response completion.firstCompletion is true
  PASS: [Group 1] Physical CodingExerciseCompletion record created
  PASS: [Group 1] Completion associated with correct userId
  PASS: [Group 1] Completion associated with correct exerciseId
  PASS: [Group 1] firstAcceptedSubmissionId matches submission ID
  PASS: [Group 1] bestScore is recorded as 100
  PASS: [Group 1] totalAttempts is initialized to 1
  PASS: [Group 1] Repeated submission accepted with 200
  PASS: [Group 1] Repeated completion.exerciseCompleted is true
  PASS: [Group 1] Repeated completion.firstCompletion is false
  PASS: [Group 1] firstAcceptedSubmissionId is preserved on repeated completion
  PASS: [Group 1] completedAt timestamp is preserved on repeated completion
  PASS: [Group 1] totalAttempts incremented to 2
  PASS: [Group 1] Student2 has no completion prior to submitting
  PASS: [Group 1] Student2 gets firstCompletion: true
  PASS: [Group 1] Student2 gets independent completion record
  PASS: [Group 1] Student1 and Student2 have distinct completion row IDs

--- GROUP 2: Dedicated XP Rewards ---
  PASS: [Group 2] EASY exercise grants exactly 30 coding XP
  PASS: [Group 2] XPTransaction created with deterministic eventKey
  PASS: [Group 2] XPTransaction amount is 30
  PASS: [Group 2] XPTransaction type is CODING_EXERCISE_COMPLETED
  PASS: [Group 2] Repeated accepted submission grants 0 coding XP
  PASS: [Group 2] MEDIUM exercise grants exactly 50 coding XP
  PASS: [Group 2] MEDIUM XPTransaction amount is 50
  PASS: [Group 2] HARD exercise grants exactly 80 coding XP
  PASS: [Group 2] HARD XPTransaction amount is 80
  PASS: [Group 2] User.xpTotal (180) equals sum of transactions (180)
  PASS: [Group 2] Concurrent submissions produced exactly 1 XPTransaction (no duplicate XP)
  PASS: [Group 2] Exactly 50 XP was awarded across concurrent submissions

--- GROUP 3: Streak Integration ---
  PASS: [Group 3] First activity today awarded 20 daily streak XP
  PASS: [Group 3] Streak is 1
  PASS: [Group 3] Subsequent activity today awarded 0 streak XP
  PASS: [Group 3] Third activity today awarded 0 streak XP
  PASS: [Group 3] Student currentStreak remains 1 (did not double)
  PASS: [Group 3] Exactly 1 daily streak transaction created for student today
  PASS: [Group 3] Streak eventKey format conforms to standard

--- GROUP 4: Progress Decoupling & Lesson Progress ---
  PASS: [Group 4] CRITICAL: Lesson is NOT marked complete after coding submissions!
  PASS: [Group 4] Enrollment progress is NOT falsely incremented to 100%
  PASS: [Group 4] Enrollment status remains ACTIVE
  PASS: [Group 4] GET completion status returns 200
  PASS: [Group 4] API reports completed: true
  PASS: [Group 4] API reports bestScore: 100
  PASS: [Group 4] API reports codingXpEarned: 30
  PASS: [Group 4] API reports totalAttempts: 2
  PASS: [Group 4] GET lesson coding progress returns 200
  PASS: [Group 4] Lesson has 3 total exercises
  PASS: [Group 4] Student1 completed 3 of 3 exercises
  PASS: [Group 4] completionPercentage is 100%
  PASS: [Group 4] Detailed exercises array contains 3 items
  PASS: [Group 4] Lesson has 3 total exercises for Student2
  PASS: [Group 4] Student2 completed 2 of 3 exercises
  PASS: [Group 4] completionPercentage is 67% (2/3)
  PASS: [Group 4] Manual markLessonCompleteService succeeds
  PASS: [Group 4] Progress record marked completed after manual completion
  PASS: [Group 4] Enrollment progress is now 100% after legitimate lesson completion
  PASS: [Group 4] Enrollment status updated to COMPLETED

--- GROUP 5: Authorization & Security ---
  PASS: [Group 5] Unenrolled student blocked from lesson progress (403)
  PASS: [Group 5] Unenrolled student blocked from exercise completion (403)
  PASS: [Group 5] Student cannot spy on another student's completion (403)
  PASS: [Group 5] Teacher can inspect enrolled student completion (200)
  PASS: [Group 5] Inspected data belongs to student1
  PASS: [Group 5] Hidden test marked isHidden: true
  PASS: [Group 5] Hidden test input is strictly redacted
  PASS: [Group 5] Hidden test expectedOutput is strictly redacted

--- GROUP 6: Revision & History ---
  PASS: [Group 6] Exercise updated with new revision
  PASS: [Group 6] Completion record preserved across revisions
  PASS: [Group 6] Original completedAt preserved
  PASS: [Group 6] Original XP awarded preserved
  PASS: [Group 6] Exercise 3 unpublished back to DRAFT
  PASS: [Group 6] Completion record preserved after unpublish
  PASS: [Group 6] XP transaction preserved after unpublish
  PASS: [Group 6] Unpublished exercise excluded from active denominator (now 2)
  PASS: [Group 6] Completed exercises among published is 2/2
  PASS: [Group 6] Progress is 100% of currently published syllabus
  PASS: [Group 6] Exercise 3 archived
  PASS: [Group 6] Historical submission for archived exercise preserved in database

--- GROUP 7: Express Router Route Registration Audit ---
Registered Coding Exercise Routes (15):
  POST   /api/coding-exercises/
  GET    /api/coding-exercises/lesson/:lessonId/public
  GET    /api/coding-exercises/lesson/:lessonId/progress
  GET    /api/coding-exercises/lesson/:lessonId
  GET    /api/coding-exercises/:id/manage
  POST   /api/coding-exercises/:id/publish
  POST   /api/coding-exercises/:id/unpublish
  POST   /api/coding-exercises/:id/run
  POST   /api/coding-exercises/:id/submit
  GET    /api/coding-exercises/:id/submissions/:submissionId
  GET    /api/coding-exercises/:id/submissions
  GET    /api/coding-exercises/:id/completion
  GET    /api/coding-exercises/:id
  PUT    /api/coding-exercises/:id
  DELETE /api/coding-exercises/:id
  PASS: [Group 7] Exactly 15 endpoints registered (found 15)
  PASS: [Group 7] GET /:id/completion is properly registered
  PASS: [Group 7] GET /lesson/:lessonId/progress is properly registered

--- Cleaning Up Database Test Fixtures ---
Cleanup finished cleanly.

=================================================================
STEP 6 VERIFICATION SUMMARY: 87/87 PASSED, 0 FAILED
=================================================================
```

---

## 14. REGRESSION TEST RESULTS

Toàn bộ các bộ kiểm thử thuộc các mốc phát triển trước đó đã được thực thi và xác nhận:

| Bộ Kiểm Thử | Lệnh Thực Thi | Kết Quả | Trạng Thái |
| :--- | :--- | :---: | :---: |
| **Step 2: CRUD & Revision** | `cmd.exe /c npx tsx scripts/test_step2_coding_exercise_crud.ts` | **37/37 PASSED** | **PASS** |
| **Step 3: Live E2B Sandbox** | `cmd.exe /c npx tsx scripts/test_step3_e2b_code_execution.ts` | **24/24 PASSED** | **PASS** |
| **Step 4: Student RUN/SUBMIT** | `cmd.exe /c npx tsx scripts/test_step4_coding_exercise_execution.ts` | **33/33 PASSED** | **PASS** |
| **Step 5: Publish & Gamification**| `cmd.exe /c npx tsx scripts/test_step5_coding_exercise_publish_gamification.ts` | **61/61 PASSED** | **PASS** |
| **Step 6: Completion & Progress**| `cmd.exe /c npx tsx scripts/test_step6_coding_completion_progress.ts` | **87/87 PASSED** | **PASS** |
| **Prisma Validation** | `cmd.exe /c npx prisma validate` | **VALID** | **PASS** |
| **Prisma Migration Status** | `cmd.exe /c npx prisma migrate status` | **10 migrations up to date** | **PASS** |
| **TypeScript Type Safety** | `cmd.exe /c npx tsc --noEmit` | **0 errors in coding modules** | **PASS** |

---

## 15. KNOWN ISSUES & LIMITATIONS

1. **Express 5 Typing Compatibility**:
   * Trình biên dịch `tsc` báo các lỗi kiểu dáng tham số `req.params: string | string[]` trên các controller cũ (`admin.controller.ts`, `chapter.controller.ts`, `lesson.controller.ts`). Đây là lỗi gốc hiện hữu của hệ thống đã được ghi nhận trong baseline rules và tuân thủ nguyên tắc không can thiệp code ngoài phạm vi task hiện tại.
2. **Khóa học không bắt buộc bài tập lập trình**:
   * Nếu khóa học không có bài tập lập trình nào, `GET /lesson/:lessonId/progress` trả về `totalExercises: 0`, `completionPercentage: 0`. Frontend cần kiểm tra `totalExercises === 0` để ẩn tab hoặc hiển thị thông báo "Bài học không có bài tập lập trình".

---

## 16. NEXT-STEP READINESS

Hệ thống backend đã hoàn toàn sẵn sàng cho quá trình tích hợp Frontend (Next.js Client):
* **API Index**: Đã cập nhật đầy đủ tại [API_INDEX.md](file:///d:/e-learning_server/docs/api/API_INDEX.md) (131 endpoints).
* **Chi tiết API & Hướng dẫn Tích hợp**: Đã tài liệu hóa chi tiết tại [CODING_EXERCISE_API.md](file:///d:/e-learning_server/docs/api/CODING_EXERCISE_API.md).
* **Database**: Schema và dữ liệu PostgreSQL hoàn toàn đồng bộ, toàn vẹn và sạch sẽ.
