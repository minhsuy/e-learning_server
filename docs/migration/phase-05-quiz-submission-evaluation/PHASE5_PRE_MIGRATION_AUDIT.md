# PHASE 5 — STEP 1: PRE-MIGRATION AUDIT & POSTGRESQL DATABASE VERIFICATION
## MODULE: QUIZ SUBMISSION & EVALUATION (READ-ONLY AUDIT)

**Dự án:** TMDEMY E-Learning Backend  
**Phase:** Phase 5 — Quiz Submission & Evaluation  
**Bước thực hiện:** Step 1 — Pre-Migration Technical Audit & Database Verification  
**Loại báo cáo:** Read-Only Technical Audit  
**Thời gian thực hiện:** 04/10/2026  
**Trạng thái chuẩn bị:** **READY WITH CONDITIONS — PROCEED TO APPROVAL GATE**

---

## 1. CURRENT ARCHITECTURE AUDIT

### 1.1. Hiện trạng luồng điều khiển (Current Control Flow)
Hiện tại, module Quiz Submission vẫn đang chạy hoàn toàn trên nền tảng **MongoDB / Mongoose** mặc dù các phân hệ cha (User ở Phase 2, Course/Lesson ở Phase 3, Quiz/Question ở Phase 4) đã chuyển đổi sang PostgreSQL/Prisma.

```text
HTTP Request
  └── Router: src/routes/quizSubmission.route.ts (Mount tại /api/submissions)
        └── Middleware: src/middlewares/quizSubmission.middleware.ts (Kiểm tra Types.ObjectId)
              └── Controller: src/controller/quizSubmission.controller.ts
                    └── Service: src/services/quizSubmission.service.ts
                          └── Legacy Mongoose Models:
                                ├── QuizSubmissionModel (src/models/quizSubmission.model.ts)
                                ├── QuizModel (src/models/legacy/quiz.legacy.model.ts)
                                ├── QuestionModel (src/models/legacy/question.legacy.model.ts)
                                ├── UserModel (src/models/legacy/user.legacy.model.ts)
                                ├── LessonModel (src/models/legacy/lesson.legacy.model.ts)
                                └── EnrollmentModel (src/models/enrollment.model.ts)
                                      └── MongoDB Atlas (e-learning)
```

### 1.2. Kiến trúc mục tiêu Phase 5 (Target Architecture)
Tuân thủ nghiêm ngặt tiêu chuẩn kiến trúc phân tầng đơn hướng tại `AGENTS.md`:

```text
HTTP Request
  └── Router: src/routes/quizSubmission.route.ts
        └── Middleware & Validator: src/middlewares/quizSubmission.middleware.ts (RFC 4122 UUID Validator)
              └── Controller: src/controller/quizSubmission.controller.ts (Typed Express Handlers)
                    └── Service: src/services/quizSubmission.service.ts (Business Logic, Grading, Pass/Fail)
                          └── Functional Repository: src/repositories/quizSubmission.repository.ts
                                └── Prisma Client Singleton (src/config/prisma.ts)
                                      └── PostgreSQL Database (tmdemy: quiz_submissions, quiz_submission_answers)
```

*Phân loại:* **READY**

---

## 2. MONGODB LEGACY STRUCTURE AUDIT

### 2.1. Cấu trúc Mongoose Model (`src/models/quizSubmission.model.ts`)
Tệp `src/models/quizSubmission.model.ts` hiện tại định nghĩa schema như sau:

```typescript
export interface QuizSubmission extends Document {
  _id: Schema.Types.ObjectId
  quiz: Schema.Types.ObjectId        // ref: 'Quiz'
  user: Schema.Types.ObjectId        // ref: 'User'
  answers: {
    question: Schema.Types.ObjectId  // ref: 'Question'
    selectedAnswer: string           // Schema.Types.Mixed
  }[]
  score: number                      // Điểm đạt được
  totalPoints: number                // Tổng điểm của quiz
  percentage: number                 // Tỷ lệ % (score / totalPoints * 100)
  completedAt: Date                  // Thời điểm hoàn thành
}
```

### 2.2. Nhận xét & Đánh giá cấu trúc Legacy:
1. **Mảng nhúng (Embedded Document):** Các câu trả lời (`answers`) được lưu dưới dạng mảng nhúng không chuẩn hóa bên trong document `quizsubmissions`.
2. **Kiểu dữ liệu `selectedAnswer`:** Được khai báo `Schema.Types.Mixed`, nhưng trong thực tế chạy ứng dụng luôn là `string` (chuỗi text câu trả lời).
3. **Mongoose Populate:** Legacy service phụ thuộc nặng vào:
   - `populate<{ answers: { question: any; selectedAnswer: string }[] }>('answers.question')`
   - `populate('user', 'username')`
   - `populate('quiz', 'title')`
   - `populate<{ lesson: any }>('lesson')`
4. **Vị trí file:** File này vẫn đang nằm tại `src/models/quizSubmission.model.ts`. Cần được cách ly sang `src/models/legacy/quizSubmission.legacy.model.ts` để nhường chỗ cho Zod Domain Model.

*Phân loại:* **READY**

---

## 3. POSTGRESQL CURRENT SCHEMA AUDIT

Kiểm tra trực tiếp tệp `prisma/schema.prisma` và PostgreSQL thực tế:

### 3.1. Bảng `quiz_submissions` (Model `QuizSubmission`)
* **Physical Table:** `quiz_submissions`
* **Cột & Kiểu dữ liệu:**
  * `id`: `String @id @default(uuid()) @db.Uuid` (Khóa chính UUID RFC 4122)
  * `quizId`: `String @map("quiz_id") @db.Uuid` (Khóa ngoại trỏ tới `quizzes.id`, `onDelete: Cascade`)
  * `userId`: `String @map("user_id") @db.Uuid` (Khóa ngoại trỏ tới `users.id`, `onDelete: Restrict`)
  * `score`: `Int @default(0)` (Tổng điểm đạt được)
  * `totalPoints`: `Int @default(0) @map("total_points")` (Tổng điểm tối đa của đề thi)
  * `percentage`: `Int @default(0)` (Tỷ lệ phần trăm làm đúng)
  * `completedAt`: `DateTime @default(now()) @map("completed_at")`
  * `createdAt`: `DateTime @default(now()) @map("created_at")`
  * `updatedAt`: `DateTime @updatedAt @map("updated_at")`
* **Ràng buộc duy nhất (Unique Constraint):**
  * `@@unique([quizId, userId])`: **Chặn hoàn toàn việc một học viên nộp bài nhiều lần cho cùng một Quiz.**
* **Index:** `@@index([userId])`
* **Delete Behavior:**
  * Xóa Quiz $\rightarrow$ Xóa cascade các bài làm (`onDelete: Cascade`).
  * Xóa User $\rightarrow$ Bị chặn lại nếu đã có bài làm (`onDelete: Restrict`) để bảo toàn lịch sử học tập.

### 3.2. Bảng `quiz_submission_answers` (Model `QuizSubmissionAnswer`)
* **Physical Table:** `quiz_submission_answers`
* **Cột & Kiểu dữ liệu:**
  * `id`: `String @id @default(uuid()) @db.Uuid` (Khóa chính)
  * `submissionId`: `String @map("submission_id") @db.Uuid` (Khóa ngoại trỏ tới `quiz_submissions.id`, `onDelete: Cascade`)
  * `questionId`: `String @map("question_id") @db.Uuid` (Khóa ngoại trỏ tới `questions.id`, `onDelete: Cascade`)
  * `selectedAnswer`: `String @map("selected_answer") @db.Text` (Câu trả lời học viên chọn)
  * `isCorrect`: `Boolean @default(false) @map("is_correct")` (Đánh dấu đúng/sai tự động)
* **Index:** `@@index([submissionId])`, `@@index([questionId])`
* **Delete Behavior:** Tự động xóa theo `submission` hoặc theo `question`.

### 3.3. Xác minh khái niệm `UserQuizResult`
* **Kết luận kiểm tra:** Trong `prisma/schema.prisma` và cơ sở dữ liệu vật lý PostgreSQL **KHÔNG CÓ model `UserQuizResult`**.
* **Giải thích kiến trúc:** Trong các tài liệu phân tích sơ bộ ban đầu, `UserQuizResult` là tên gọi giả định. Khi chốt thiết kế kiến trúc chuẩn tại `POSTGRES_SCHEMA_DESIGN.md` và `FINAL_SCHEMA_DECISIONS.md`, cấu trúc chính thức đã được phê duyệt là cặp thực thể quan hệ chuẩn hóa 3NF:
  1. `QuizSubmission` (`quiz_submissions`)
  2. `QuizSubmissionAnswer` (`quiz_submission_answers`)

*Phân loại:* **READY**

---

## 4. CURRENT DATABASE RECORD COUNTS & INTEGRITY (READ-ONLY AUDIT)

Đã thực thi kiểm tra read-only trực tiếp trên PostgreSQL database `tmdemy`:

### 4.1. Thống kê số lượng bản ghi thực tế
| Bảng cơ sở dữ liệu | Số lượng bản ghi (PostgreSQL) | Số lượng nguồn (MongoDB) | Trạng thái đồng bộ |
| :--- | :---: | :---: | :---: |
| `users` | **11** | 7 (Active) + 4 (Phase 2 additions) | Đồng bộ 100% |
| `courses` | **10** | 8 (Source) + 2 (Phase 3 additions) | Đồng bộ 100% |
| `lessons` | **8** | 7 (Source) + 1 (Phase 3 addition) | Đồng bộ 100% |
| `quizzes` | **4** | 3 (Source) + 1 (Phase 4 addition) | Đồng bộ 100% |
| `questions` | **6** | 5 (Source) + 1 (Phase 4 addition) | Đồng bộ 100% |
| `question_options` | **24** | 20 (Source) + 4 (Phase 4 additions)| Đồng bộ 100% |
| **`quiz_submissions`** | **2** | **2** | **Khớp 100% Data Migration** |
| **`quiz_submission_answers`** | **4** | **4** | **Khớp 100% Data Migration** |
| `enrollments` | **5** | 5 | Sẵn sàng cho Phase 6 |

### 4.2. Chi tiết 2 bản ghi QuizSubmission lịch sử trong PostgreSQL:
1. **Submission 1 (`e18994c4-b95d-5cfe-b771-0640b7daaa16`):**
   - User: `minhsuyyyyy` (`c55de839-f059-519c-8820-b16aa17fb9c3`)
   - Quiz: "Quiz 1: Introduction to JavaScript" (`d40087b3-0917-5e3c-bc44-0f36d3d8d127`)
   - Điểm: 4 / 4 (100%), Hoàn thành lúc: `2025-10-15T09:29:41.095Z`
   - Số câu trả lời: 3 answers (đều có `isCorrect: true`)
2. **Submission 2 (`f35cde15-b3a1-5bb1-af39-49fede0a7237`):**
   - User: `minhsuyyyyy` (`c55de839-f059-519c-8820-b16aa17fb9c3`)
   - Quiz: "Quiz 2: Introduction to TS" (`9ef997e1-64a1-5391-8647-7b59ddb68d36`)
   - Điểm: 1 / 1 (100%), Hoàn thành lúc: `2025-10-15T16:06:53.246Z`
   - Số câu trả lời: 1 answer (`isCorrect: true`)

### 4.3. Kiểm tra tính toàn vẹn quan hệ & Ràng buộc:
* **Duplicate `(quiz_id, user_id)`:** **0** (Thỏa mãn tuyệt đối ràng buộc duy nhất).
* **Orphan Submissions (thiếu Quiz cha):** **0**
* **Orphan Submissions (thiếu User cha):** **0**
* **Orphan Answers (thiếu Submission cha):** **0**
* **Orphan Answers (thiếu Question cha):** **0**

*Phân loại:* **READY**

---

## 5. QUIZSUBMISSION DEPENDENCIES AUDIT

Bảng phân loại các thực thể liên quan đến Phase 5:

| Thực thể (Entity) | Vai trò trong Phase 5 | Vị trí lưu trữ dữ liệu | Phương thức truy cập phê duyệt |
| :--- | :---: | :---: | :--- |
| **`QuizSubmission`** | **Phạm vi Migration chính** | PostgreSQL (`quiz_submissions`) | `quizSubmission.repository.ts` (Tạo mới) |
| **`QuizSubmissionAnswer`**| **Phạm vi Migration chính** | PostgreSQL (`quiz_submission_answers`)| `quizSubmission.repository.ts` (Tạo mới) |
| **`Quiz`** | Dependency (Đã migrate Phase 4) | PostgreSQL (`quizzes`) | `src/repositories/quiz.repository.ts` |
| **`Question`** | Dependency (Đã migrate Phase 4) | PostgreSQL (`questions`) | `src/repositories/question.repository.ts` |
| **`QuestionOption`** | Dependency (Đã migrate Phase 4) | PostgreSQL (`question_options`) | `src/repositories/question.repository.ts` |
| **`User`** | Dependency (Đã migrate Phase 2) | PostgreSQL (`users`) | `src/repositories/user.repository.ts` |
| **`Lesson` & `Course`** | Dependency (Đã migrate Phase 3) | PostgreSQL (`lessons`, `courses`) | `lesson.repository.ts`, `course.repository.ts` |
| **`Enrollment`** | Dependency (Phân hệ Phase 6) | PostgreSQL (`enrollments`) | Tái sử dụng qua helper/Prisma singleton |
| **`Notification`** | Dependency (Phân hệ Phase 10) | MongoDB (`notifications`) | Giữ nguyên qua `pushNotificationService` |
| **`Certificate`** | Downstream Consumer (Phase 7) | MongoDB (`certificates`) | Giữ nguyên Mongoose legacy import |

*Phân loại:* **READY**

---

## 6. OBJECTID $\rightarrow$ UUID COMPATIBILITY ANALYSIS

### 6.1. Rủi ro xung đột ID tại tầng Transport / HTTP Validator
* **Phát hiện:** Trong `src/middlewares/quizSubmission.middleware.ts`:
  ```typescript
  body('quizId')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .custom((value) => Types.ObjectId.isValid(value)) // LỖI NGUY HIỂM!
    .withMessage('Invalid quiz ID'),
  body('answers.*.question')
    .notEmpty()
    .withMessage('Question ID is required')
    .custom((value) => Types.ObjectId.isValid(value)) // LỖI NGUY HIỂM!
    .withMessage('Invalid question ID')
  ```
  Nếu Client gửi request lên với UUID (được sinh ra từ Phase 4 Quiz/Question), Express Validator sẽ chặn lại với lỗi `400: Invalid quiz ID` / `Invalid question ID`.
* **Giải pháp khắc phục:**
  Thay thế toàn bộ `Types.ObjectId.isValid(value)` bằng `isValidUUID(value)` từ `~/utils/uuid`.

### 6.2. Nguồn ánh xạ dữ liệu lịch sử đáng tin cậy
* Dữ liệu lịch sử đã được ánh xạ tiền định (deterministic) thông qua thuật toán UUID v5 tại `scripts/migration-utils/id-mapper.ts` với namespace cố định `7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c`.
* Danh mục ánh xạ chi tiết đã được audit và xác thực trong `scripts/migration-logs/id_map_audit.json`.
* **Khả năng tương thích ngược response:** Sử dụng decorator `withCompatId(submission)` để tự động cung cấp trường `_id = id` (UUID) cho Frontend Next.js client.

*Phân loại:* **READY WITH CONDITIONS** (Yêu cầu cập nhật Validator sang UUID)

---

## 7. EVALUATION LOGIC ANALYSIS

Phân tích mã nguồn hàm `submitQuizService` trong `src/services/quizSubmission.service.ts`:

### 7.1. Thuật toán chấm điểm hiện tại:
1. **Lấy tổng điểm đề thi (Total Points):**
   ```typescript
   let totalPoints = 0
   for (const question of quiz.questions) {
     totalPoints += question.points || 1
   }
   ```
2. **So sánh đáp án (Grading):**
   ```typescript
   let score = 0
   for (const ans of answers) {
     const question = await findQuestionById(ans.question)
     if (question && question.answer === ans.selectedAnswer) {
       score += question.points || 1
     }
   }
   ```
3. **Tính tỷ lệ %:**
   ```typescript
   const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
   ```
4. **Đánh giá Passing Grade & Pass/Fail:**
   - Trong `prisma/schema.prisma`, model `Quiz` lưu trường `passingGrade: Int @default(0)`.
   - Kết quả đạt/không đạt được xác định qua biểu thức: `percentage >= quiz.passingGrade`.
   - Lưu trữ từng câu trả lời vào bảng `quiz_submission_answers` kèm cờ `isCorrect = (question.answer === ans.selectedAnswer)`.

### 7.2. Quy tắc bảo toàn:
* Tuyệt đối không thay đổi thuật toán so sánh chuỗi `===`.
* Không thay đổi công thức tính phần trăm làm tròn `Math.round((score / totalPoints) * 100)`.
* Giữ nguyên cấu trúc trả về: `{ submission, scoreDisplay: "${score}/${totalPoints}", percentage }`.

*Phân loại:* **READY**

---

## 8. ATTEMPT HISTORY ANALYSIS

### 8.1. Quy tắc giới hạn số lần làm bài (Attempt Policy):
* Hệ thống hiện hành áp dụng chính sách: **Mỗi học viên chỉ được làm bài kiểm tra DUY NHẤT 1 LẦN cho mỗi Quiz.**
* Logic kiểm tra trong service cũ:
  ```typescript
  const existing = await QuizSubmissionModel.findOne({ quiz: quizId, user: userId })
  if (existing) return { success: false, statusCode: 400, message: 'You have already submitted this quiz' }
  ```
* Cơ sở dữ liệu PostgreSQL bảo vệ kép bằng ràng buộc vật lý:
  ```prisma
  @@unique([quizId, userId])
  ```
* **Quyết định bảo toàn:**
  - Không tự ý thêm tính năng làm lại/retry.
  - Khi bắt được lỗi vi phạm unique constraint `P2002` từ Prisma, ánh xạ ngay thành HTTP `400 Bad Request` kèm message `'You have already submitted this quiz'`.

*Phân loại:* **READY**

---

## 9. API CONTRACT INVENTORY

Bảng đối chiếu toàn bộ 4 API endpoints thuộc phân hệ Quiz Submission:

| HTTP Method | Endpoint URL | Auth & Role | Request Body / Params | Expected Response Data | HTTP Status Codes |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **POST** | `/api/submissions` | Bearer (User) | Body: `{ quizId: UUID, answers: [{ question: UUID, selectedAnswer: string }] }` | `{ success: true, message: 'Quiz submitted successfully', data: { submission, scoreDisplay: 'X/Y', percentage } }` | `200` (OK)<br>`400` (Validation / Already submitted)<br>`403` (Not enrolled)<br>`404` (Quiz/User not found) |
| **GET** | `/api/submissions/:quizId` | Bearer (User) | Param: `:quizId` (UUID) | `{ success: true, message: 'Quiz submission fetched successfully', data: { submission: { id, _id, quiz, user, score, totalPoints, percentage, answers: [{ question: {...}, selectedAnswer, isCorrect }] } } }` | `200` (OK)<br>`400` (Invalid UUID)<br>`404` (No submission found) |
| **GET** | `/api/submissions/teacher/:quizId` | Bearer (Teacher/Admin)| Param: `:quizId` (UUID) | `{ success: true, message: 'Quiz submissions fetched successfully', data: [{ user: string, score: number, totalPoints: number, percentage: number, completedAt: string }] }` | `200` (OK)<br>`400` (Invalid UUID)<br>`403` (Forbidden)<br>`404` (No submissions found) |
| **GET** | `/api/submissions/teacher/analytics/:quizId` | Bearer (Teacher/Admin)| Param: `:quizId` (UUID) | `{ success: true, message: 'Quiz analytics fetched successfully', data: { totalStudents: number, avgScore: number, minScore: number, maxScore: number, completionRate: number } }` | `200` (OK)<br>`400` (Invalid UUID)<br>`403` (Forbidden)<br>`404` (No submissions found) |

*Phân loại:* **READY**

---

## 10. CERTIFICATE DEPENDENCY AUDIT (DOWNSTREAM ISOLATION)

### 10.1. Mức độ phụ thuộc của Certificate:
Trong `src/services/certificate.service.ts`:
```typescript
const quizzes = await QuizModel.find({ courseId })
const quizSubmissions = await QuizSubmissionModel.find({
  user: userId,
  quiz: { $in: quizzes.map((q) => q._id) }
})
```
Certificate Service cần tính toán điểm trung bình quiz để cấp chứng chỉ khi hoàn thành khóa học.

### 10.2. Ranh giới an toàn cho Phase 5:
* Phân hệ Certificate thuộc **Phase 7** (Progress, Certificate, Favorite & Rating).
* **Biện pháp bảo vệ:**
  1. Khi di chuyển `src/models/quizSubmission.model.ts`, tạo file tương đương tại `src/models/legacy/quizSubmission.legacy.model.ts`.
  2. Cập nhật import trong `src/services/certificate.service.ts` sang `~/models/legacy/quizSubmission.legacy.model`.
  3. Tuyệt đối không thay đổi bất kỳ business logic nào của Certificate trong Phase 5.

*Phân loại:* **READY WITH CONDITIONS**

---

## 11. MIGRATION IMPLEMENTATION PLAN (STEP-BY-STEP)

```text
Step 1: Pre-Migration Technical Audit & Database Verification [CURRENT STEP]
Step 2: Legacy Isolation & Zod Application Domain Model Creation
Step 3: Functional Repository Implementation (quizSubmission.repository.ts)
Step 4: Service Layer Refactoring & Grading Business Logic Migration
Step 5: Middleware & Express Validator Migration (UUID RFC 4122)
Step 6: End-to-End API Integration & Regression Audit
Step 7: Final Implementation Report & Approval Gate
```

### Danh mục tệp sẽ tạo mới & sửa đổi:
1. **Tạo mới:**
   - `src/models/legacy/quizSubmission.legacy.model.ts` (Sao lưu Mongoose Model cũ).
   - `src/models/quizSubmission.model.ts` (Zod Application Domain Model mới).
   - `src/repositories/quizSubmission.repository.ts` (Functional Repository tương tác PostgreSQL qua Prisma).
   - `scripts/migration-utils/step-02-phase5-zod-models.test.ts` (Unit test cho Zod Model).
   - `scripts/migration-utils/step-03-phase5-repositories.test.ts` (Unit test cho Repository).
   - `scripts/migration-utils/step-04-phase5-services.test.ts` (Unit test cho Service & Evaluation).
   - `scripts/migration-utils/step-05-phase5-http-integration.test.ts` (Integration test cho API Endpoints).
2. **Sửa đổi:**
   - `src/services/quizSubmission.service.ts` (Chuyển sang Functional Repositories, loại bỏ Mongoose).
   - `src/middlewares/quizSubmission.middleware.ts` (Thay `ObjectId.isValid` bằng `isValidUUID`).
   - `src/services/certificate.service.ts` (Cập nhật đường dẫn import `quizSubmission.legacy.model.ts`).

*Phân loại:* **READY**

---

## 12. RISKS & BLOCKERS ASSESSMENT

| # | Nguy cơ / Rủi ro tiềm ẩn | Mức độ nghiêm trọng | Kế hoạch giảm thiểu / Giải pháp kiểm soát |
| :-: | :--- | :---: | :--- |
| **1** | **Validator chặn UUID hợp lệ** | **HIGH** | Cập nhật `submitQuizValidator` trong Step 5 để dùng `isValidUUID`, ngăn chặn lỗi `400: Invalid quiz ID`. |
| **2** | **Xung đột ghi đồng thời (Race Condition)** | **MEDIUM** | Tận dụng cơ chế Prisma Transaction `$transaction` và bắt lỗi `P2002` (Unique constraint) để trả về mã `400` an toàn. |
| **3** | **Kiểm tra Enrollment trong môi trường kép** | **MEDIUM** | Cả MongoDB và PostgreSQL hiện đều có bản ghi `enrollments` đã được migrate. Tạo hàm đọc chuẩn qua `prisma.enrollment` để kiểm tra điều kiện học viên ghi danh khóa học. |
| **4** | **Phá vỡ tính tương thích ngược của Certificate** | **MEDIUM** | Duy trì `quizSubmission.legacy.model.ts` cho `certificate.service.ts` cho đến khi Phase 7 được thực thi. |
| **5** | **Thiếu trường `answer` trong public question** | **LOW** | Tầng Service dùng `findQuestionsByQuizIdStudy` để lấy đáp án phục vụ chấm điểm, nhưng khi trả kết quả cho học viên luôn ẩn hoặc chỉ trả `isCorrect`. |

*Phân loại:* **READY WITH CONDITIONS**

---

## 13. FINAL READINESS ASSESSMENT MATRIX

| STT | Hạng mục kiểm tra (Audit Dimension) | Trạng thái | Đánh giá kỹ thuật |
| :-: | :--- | :---: | :--- |
| 1 | **Current Architecture** | **READY** | Phân tầng rõ ràng, sẵn sàng chuyển đổi sang Functional Repository. |
| 2 | **MongoDB Legacy Structure** | **READY** | Cấu trúc mảng nhúng answers đã được phân tích đầy đủ. |
| 3 | **PostgreSQL Current Schema** | **READY** | 2 bảng `quiz_submissions` & `quiz_submission_answers` chuẩn 3NF đã sẵn sàng. |
| 4 | **Current Database Record Counts** | **READY** | 2 submissions, 4 answers trong PostgreSQL khớp 100% dữ liệu gốc. |
| 5 | **QuizSubmission Dependencies** | **READY** | Toàn bộ entity cha (Quiz, Question, User, Lesson, Course) đã ở PostgreSQL. |
| 6 | **ObjectId $\rightarrow$ UUID Compatibility** | **READY WITH CONDITIONS** | Cần cập nhật `submitQuizValidator` từ `ObjectId` sang `isValidUUID`. |
| 7 | **Evaluation Logic Analysis** | **READY** | Thuật toán chấm điểm, tính điểm và % đã được định vị chính xác. |
| 8 | **Attempt History Analysis** | **READY** | Ràng buộc 1 lần làm bài được đảm bảo bởi `@@unique([quizId, userId])`. |
| 9 | **API Contract Inventory** | **READY** | 4 endpoints được đối soát đầy đủ request/response contract. |
| 10 | **Certificate Dependency** | **READY WITH CONDITIONS** | Cách ly model Mongoose cũ sang `legacy/` để bảo vệ Phase 7. |
| 11 | **Migration Implementation Plan** | **READY** | Lộ trình 7 bước chi tiết, có kiểm thử cô lập từng bước. |
| 12 | **Risks & Blockers** | **READY** | 5 rủi ro đã có giải pháp kiểm soát cụ thể. |
| **TỔNG THỂ** | **PHASE 5 PRE-MIGRATION READINESS** | **READY WITH CONDITIONS** | **ĐỦ ĐIỀU KIỆN TIẾN HÀNH BƯỚC TRIỂN KHAI SAU KHI ĐƯỢC DUYỆT** |

---

## 14. STOP CONDITION CONFIRMATION

* **Zero code edits** trên toàn bộ codebase ứng dụng.
* **Zero schema edits** trên `prisma/schema.prisma`.
* **Zero database mutations** (100% Read-Only audit).
* **Phase 5 Implementation CHƯA được thực thi.**
* Dừng lại tại đây để báo cáo và chờ phê duyệt từ **Project Owner** trước khi tiến hành Step 2.
