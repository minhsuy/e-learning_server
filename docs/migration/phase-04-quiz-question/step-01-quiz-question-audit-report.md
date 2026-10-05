# BÁO CÁO KIỂM TOÁN HIỆN TRẠNG QUIZ & QUESTION (PHASE 4 — STEP 1 AUDIT REPORT)
## DỰ ÁN: TMDEMY E-LEARNING BACKEND MIGRATION
### GIAI ĐOẠN: PHASE 4 — QUIZ & QUESTION MIGRATION

---

### 1. EXECUTIVE SUMMARY (TỔNG QUAN KIỂM TOÁN)

| Thông số kiểm toán | Chi tiết đánh giá |
| :--- | :--- |
| **Dự án** | TMDEMY E-Learning Backend |
| **Phân hệ Migration** | **Phase 4 — Quiz & Question Migration** |
| **Bước thực hiện** | **Step 1 — Quiz & Question Audit** |
| **Mục tiêu kỹ thuật** | Khảo sát, kiểm toán toàn diện hiện trạng mã nguồn, cơ sở dữ liệu vật lý PostgreSQL, Mongoose Models, Zod Models, API Contracts và các ràng buộc phụ thuộc trước khi triển khai |
| **Thực thể thuộc phạm vi** | `Quiz`, `Question`, `QuestionOption` (3 bảng PostgreSQL / 2 Mongoose models) |
| **Thực thể NGOẠI PHẠM VI (Phase 5)** | `QuizSubmission`, `UserQuizResult`, `Quiz Evaluation`, `Quiz Grading` |
| **Số lượng Endpoint trong phạm vi** | **7 Endpoints** (4 Quiz endpoints tại `/api/quiz`, 3 Question endpoints tại `/api/questions`) |
| **Hiện trạng vật lý PostgreSQL (`tmdemy`)** | **3 Quizzes, 5 Questions, 20 QuestionOptions** (Đã chuyển đổi thành công trong Data Migration Phase) |
| **Hiện trạng mã nguồn tầng ứng dụng** | Đang phụ thuộc 100% vào Mongoose Models (`QuizModel`, `QuestionModel`), Express Validator kiểm tra `ObjectId` |
| **Đánh giá mức độ sẵn sàng** | **SẴN SÀNG CHO STEP 2 (LEGACY ISOLATION & MODEL INTEGRATION)** |

---

### 2. PHÂN TÍCH HIỆN TRẠNG MONGOOSE MODELS

Hiện tại, cả `Quiz` và `Question` vẫn đang được định nghĩa trực tiếp bằng Mongoose schema trong thư mục `src/models/`:

#### 2.1. Mongoose Model: `src/models/quiz.model.ts`
- **Tên Model Mongoose**: `Quiz` (collection: `quizzes`).
- **Cấu trúc trường dữ liệu**:
  * `_id`: `Schema.Types.ObjectId` (Khóa chính MongoDB).
  * `title`: `String`, `required: true`.
  * `duration`: `Number` (Thời lượng làm bài tính bằng phút).
  * `passing_grade`: `Number` (Điểm sàn để vượt qua quiz).
  * `description`: `String`.
  * `lesson`: `Schema.Types.ObjectId`, `ref: 'Lesson'`, `required: true`.
  * `questions`: `Schema.Types.ObjectId[]`, `ref: 'Question'` (Mảng chứa danh sách ID câu hỏi nhúng trong document Quiz).
  * `created_by`: `Schema.Types.ObjectId`, `ref: 'User'`, `required: true`.
  * `courseId`: `Schema.Types.ObjectId`, `ref: 'Course'`, `required: true`.
  * `timestamps`: `true` (`createdAt`, `updatedAt`).

#### 2.2. Mongoose Model: `src/models/question.model.ts`
- **Tên Model Mongoose**: `Question` (collection: `questions`).
- **Cấu trúc trường dữ liệu**:
  * `_id`: `Schema.Types.ObjectId` (Khóa chính MongoDB).
  * `quiz`: `Schema.Types.ObjectId`, `ref: 'Quiz'`, `required: true`.
  * `type`: `String`, `enum: ['multiple_choice', 'fill_in_blank']`, mặc định `multiple_choice`.
  * `title`: `String`, `required: true` (Nội dung câu hỏi).
  * `options`: `String[]`, `required: true` (Mảng chứa các lựa chọn trả lời dạng chuỗi thô).
  * `answer`: `String`, `required: true` (Đáp án chính xác).
  * `points`: `Number`, mặc định `1` (Trọng số điểm của câu hỏi).
  * `timestamps`: `true` (`createdAt`, `updatedAt`).

#### 2.3. Mongoose Model phụ thuộc: `src/models/quizSubmission.model.ts` (Ngoại phạm vi Phase 4)
- **Tên Model**: `QuizSubmission` (collection: `quizsubmissions`).
- **Phụ thuộc**: Model này tham chiếu `quiz: ObjectId ref 'Quiz'` và `answers: [{ question: ObjectId ref 'Question', selectedAnswer }]`.
- **Ranh giới an toàn**: Phân hệ này thuộc Phase 5. Khi cô lập Mongoose Models ở Step 2, `QuizModel` và `QuestionModel` phải được lưu vào `src/models/legacy/` để `quizSubmission.service.ts` tiếp tục hoạt động mà không bị gãy kết nối runtime.

---

### 3. ĐỐI CHIẾU VỚI CẤU TRÚC VẬT LÝ POSTGRESQL (`prisma/schema.prisma`)

Trong PostgreSQL, dữ liệu đã được chuẩn hóa (normalized) theo mô hình quan hệ chặt chẽ:

```mermaid
erDiagram
    COURSES ||--o{ QUIZZES : "course_id"
    LESSONS ||--|| QUIZZES : "lesson_id (1-to-1 unique)"
    USERS ||--o{ QUIZZES : "created_by_id"
    QUIZZES ||--o{ QUESTIONS : "quiz_id (1-to-N cascade)"
    QUESTIONS ||--o{ QUESTION_OPTIONS : "question_id (1-to-N cascade)"

    QUIZZES {
        uuid id PK
        varchar_255 title
        text description
        int duration
        int passing_grade
        uuid lesson_id FK,UQ
        uuid course_id FK
        uuid created_by_id FK
        timestamp created_at
        timestamp updated_at
    }

    QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        QuestionType type
        text title
        text answer
        int points
        timestamp created_at
        timestamp updated_at
    }

    QUESTION_OPTIONS {
        uuid id PK
        uuid question_id FK
        text option_text
        int order
    }
```

#### Bảng so sánh Schema Mongoose vs PostgreSQL/Prisma:

| Thuộc tính / Khái niệm | Mongoose (MongoDB Legacy) | PostgreSQL / Prisma (Target) | Đánh giá & Lưu ý Chuyển đổi |
| :--- | :--- | :--- | :--- |
| **Khóa chính Quiz** | `_id: ObjectId` | `id: UUID @id @default(uuid())` | Dùng `withCompatId()` cung cấp cả `id` và `_id`. |
| **Quan hệ Lesson $\leftrightarrow$ Quiz** | `lesson: ObjectId` (Không có unique constraint bắt buộc ở DB) | `lessonId: UUID @unique @map("lesson_id")` | **Ràng buộc 1-1 duy nhất**: 1 bài học chỉ được có tối đa 1 Quiz. |
| **Quan hệ Course $\leftrightarrow$ Quiz** | `courseId: ObjectId` | `courseId: UUID @map("course_id")` | Khóa ngoại tham chiếu `courses(id)` kèm cascade delete. |
| **Quan hệ User $\leftrightarrow$ Quiz** | `created_by: ObjectId` | `createdById: UUID @map("created_by_id")` | Khóa ngoại tham chiếu `users(id)` (`onDelete: Restrict`). |
| **Trường `passing_grade`** | `passing_grade: Number` | `passingGrade: Int @map("passing_grade")` | Tên cột vật lý là `passing_grade`. Prisma Client dùng `passingGrade`. Response JSON phải hỗ trợ `passing_grade`. |
| **Danh sách câu hỏi trong Quiz** | Mảng ObjectId nhúng: `questions: ObjectId[]` | Quan hệ 1-N: `questions: Question[]` dựa trên `questions.quiz_id` | **Khác biệt cấu trúc lớn**: PostgreSQL không lưu mảng ID trong bảng `quizzes`. Repository phải dùng `include: { questions: true }`. |
| **Danh sách lựa chọn (Options)** | Mảng chuỗi nhúng: `options: string[]` | Bảng quan hệ riêng: `QuestionOption[]` (`question_options`) | **Cần Mapper tầng Service**: `options` trong response client là `string[]`. Khi đọc từ DB, cần map: `q.options.map(o => o.optionText)`. Khi ghi xuống DB, cần tạo các bản ghi `QuestionOption` kèm số thứ tự `order`. |
| **Loại câu hỏi (Type)** | `String` ('multiple_choice', 'fill_in_blank') | `enum QuestionType { MULTIPLE_CHOICE, FILL_IN_BLANK }` | Chuyển đổi an toàn qua mapper helper: `'multiple_choice' <-> MULTIPLE_CHOICE`. |
| **Xóa Quiz** | Gọi `QuestionModel.deleteMany({ quiz: quiz._id })` | PostgreSQL tự động Cascade Delete (`onDelete: Cascade`) | Repository có thể tận dụng DB cascade hoặc xử lý trong transaction client. |

---

### 4. KIỂM TOÁN TẦNG APPLICATION MODELS (ZOD MODELS)

- **Hiện trạng `src/models/`**:
  * Đã có Zod Domain Models cho: `user.model.ts`, `category.model.ts`, `course.model.ts`, `chapter.model.ts`, `lesson.model.ts`.
  * `src/models/quiz.model.ts` và `src/models/question.model.ts` **chưa được chuyển sang Zod** (vẫn là file Mongoose cũ).
- **Yêu cầu triển khai tại Step 2**:
  * Di chuyển 2 file cũ vào:
    - `src/models/legacy/quiz.legacy.model.ts`
    - `src/models/legacy/question.legacy.model.ts`
  * Tạo mới 2 pure Zod Application Domain Models:
    1. `src/models/quiz.model.ts`:
       - `quizSchema`: Domain model cơ sở (UUID, title, description, duration, passingGrade, lessonId, courseId, createdById, timestamps).
       - `quizPublicSchema`: Schema cho học viên làm bài (loại bỏ hoặc che giấu thông tin nhạy cảm).
       - `quizDetailResponseSchema`: Schema bao gồm danh sách câu hỏi kèm options.
       - `createQuizInputSchema`: Schema validation cho request tạo Quiz.
       - `updateQuizInputSchema`: Schema validation cho request sửa Quiz.
       - Types: `Quiz`, `QuizPublic`, `CreateQuizInput`, `UpdateQuizInput`.
    2. `src/models/question.model.ts`:
       - `questionSchema`: Domain model cơ sở (UUID, quizId, type, title, answer, points, options).
       - `questionPublicSchema`: Schema cho câu hỏi hiển thị cho học viên (**Bắt buộc che giấu trường `answer`**).
       - `questionStudySchema`: Schema đầy đủ cho giáo viên/admin soạn câu hỏi.
       - `createQuestionInputSchema`: Schema tạo câu hỏi (`quiz`, `type`, `title`, `options`, `answer`, `points`).
       - `updateQuestionInputSchema`: Schema cập nhật câu hỏi.
       - Types: `Question`, `QuestionPublic`, `CreateQuestionInput`, `UpdateQuestionInput`.

---

### 5. API CONTRACT INVENTORY (DANH SÁCH 7 ENDPOINTS THUỘC PHẠM VI)

Toàn bộ 7 endpoints sau đây được giữ nguyên 100% hợp đồng URL, HTTP method, request parameters, request body và response envelope (API Contract Freeze):

```text
src/routes/index.route.ts
  ├── app.use('/api/quiz', quizRouter)           --> 4 endpoints
  └── app.use('/api/questions', questionRouter)  --> 3 endpoints
```

#### Chi tiết 7 Endpoints trong phạm vi:

| STT | HTTP Method | Endpoint URL | Phân quyền truy cập | Request Params / Body | Response Contract Thành công | Response Lỗi |
| :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | `POST` | `/api/quiz` | TEACHER (Owner) / ADMIN | **Body**: `{ lesson: UUID, title: string, courseId: UUID, description?: string, duration?: number, passing_grade?: number }` | **200 OK** (hoặc 201): `{ success: true, message: "Quiz created successfully", data: Quiz }` | **400 Bad Request** (Lesson already has quiz), **403 Forbidden** (Not owner), **404 Not Found** (Lesson not found) |
| **2** | `PUT` | `/api/quiz/:quizId` | TEACHER (Owner) / ADMIN | **Params**: `quizId` (UUID)<br>**Body**: optional `{ title, description, duration, passing_grade }` | **200 OK**: `{ success: true, message: "Quiz updated successfully", data: Quiz }` | **400 Bad Request**, **403 Forbidden**, **404 Not Found** |
| **3** | `DELETE` | `/api/quiz/:quizId` | TEACHER (Owner) / ADMIN | **Params**: `quizId` (UUID) | **200 OK**: `{ success: true, message: "Quiz and its questions deleted successfully" }` | **403 Forbidden**, **404 Not Found** |
| **4** | `GET` | `/api/quiz/lesson/:lessonId` | Public / Enrolled Students | **Params**: `lessonId` (UUID) | **200 OK**: `{ success: true, message: "Quizzes fetched successfully", data: Quiz[] }` | **404 Not Found** (`No quizzes found for this lesson`) |
| **5** | `POST` | `/api/questions` | TEACHER (Owner) / ADMIN | **Body**: `{ quiz: UUID, type: 'multiple_choice' \| 'fill_in_blank', title: string, options?: string[], answer: string, points?: number }` | **200 OK**: `{ success: true, message: "Question created successfully", data: Question }` | **400 Bad Request**, **403 Forbidden**, **404 Not Found** |
| **6** | `PUT` | `/api/questions/:questionId` | TEACHER (Owner) / ADMIN | **Params**: `questionId` (UUID)<br>**Body**: optional `{ title, options, answer, points, type }` | **200 OK**: `{ success: true, message: "Question updated successfully", data: Question }` | **400 Bad Request**, **403 Forbidden**, **404 Not Found** |
| **7** | `DELETE` | `/api/questions/:questionId` | TEACHER (Owner) / ADMIN | **Params**: `questionId` (UUID) | **200 OK**: `{ success: true, message: "Question deleted successfully" }` | **403 Forbidden**, **404 Not Found** |

---

### 6. PHÂN TÍCH RỦI RO & VẤN ĐỀ KỸ THUẬT PHÁT HIỆN TRONG AUDIT

Trong quá trình audit source code, Antigravity đã phát hiện các vấn đề kỹ thuật sau cần xử lý dứt điểm trong Phase 4:

#### Vấn đề 1: Express Validator vẫn kiểm tra `Types.ObjectId.isValid`
- **Vị trí**:
  * [src/middlewares/quiz.middleware.ts:L8,L20,L31](file:///d:/e-learning_server/src/middlewares/quiz.middleware.ts#L8)
  * [src/middlewares/question.middleware.ts:L8,L23,L36](file:///d:/e-learning_server/src/middlewares/question.middleware.ts#L8)
- **Hậu quả**: Khi client gửi UUID chuẩn RFC 4122 (ví dụ: `9ef997e1-64a1-5391-8647-7b59ddb68d36`), validator Mongoose sẽ lập tức đánh dấu là lỗi cú pháp (`Invalid Lesson ID`, `Invalid Quiz ID`, `Invalid Question ID`) và trả về HTTP 400.
- **Giải pháp**: Thay thế bằng `validateRouteUUIDParam` và `isValidUUID` từ `src/utils/uuid.ts` đã chuẩn hóa tại Phase 1.

#### Vấn đề 2: Lỗi Import nhầm `lessonIdValidator` từ `comment.middleware.ts`
- **Vị trí**: [src/routes/quiz.route.ts:L12](file:///d:/e-learning_server/src/routes/quiz.route.ts#L12)
  ```typescript
  import { lessonIdValidator } from '~/middlewares/comment.middleware'
  // ...
  quizRouter.get('/lesson/:lessonId', lessonIdValidator, handleValidationErrors, getQuizzesByLessonController)
  ```
- **Hậu quả**: `comment.middleware.ts` kiểm tra `param('lessonId')` bằng `mongoose.Types.ObjectId.isValid`. Do đó, endpoint `GET /api/quiz/lesson/:lessonId` sẽ bị lỗi 400 đối với tất cả các Lesson đã migration sang PostgreSQL!
- **Giải pháp**: Chuẩn hóa validator `lessonIdParamValidator` sử dụng `validateRouteUUIDParam('lessonId')` tại `quiz.middleware.ts`.

#### Vấn đề 3: Chuyển đổi mảng `options` giữa Mongoose và PostgreSQL
- **Hậu quả**: MongoDB lưu `options: ['A', 'B', 'C']` trong Question, trong khi PostgreSQL lưu từng lựa chọn thành 1 dòng trong bảng `question_options`. Nếu trả trực tiếp Prisma model ra JSON, client sẽ nhận được mảng object `{ id, questionId, optionText, order }` thay vì mảng chuỗi, gây vỡ giao diện Frontend.
- **Giải pháp**:
  * Tầng Repository / Service phải có Serializer/Mapper:
    - Khi đọc ra: `options = q.options.map(o => o.optionText)`.
    - Khi ghi vào: Prisma nested write `options: { create: payload.options.map((text, idx) => ({ optionText: text, order: idx })) }`.

#### Vấn đề 4: Bảo mật Đáp án Câu hỏi (Security & Anti-Cheat)
- **Hậu quả**: Khi học viên gọi `GET /api/quiz/lesson/:lessonId`, nếu query trả về cả trường `answer`, học viên có thể xem trước đáp án qua DevTools Network Tab.
- **Hành vi cũ**: Legacy code đã có cơ chế bảo vệ: `.populate({ path: 'questions', select: 'title options points' })` (không select `answer`).
- **Giải pháp**: Trong `quiz.repository.ts`, định nghĩa `QUIZ_STUDY_SELECT` chỉ bao gồm `title`, `options`, `points` của câu hỏi và ẩn hoàn toàn trường `answer`.

#### Vấn đề 5: Tương thích Tên trường `passing_grade` (Snake_case vs CamelCase)
- **Hậu quả**: Database PostgreSQL dùng cột vật lý `passing_grade`, Prisma Client ánh xạ thành `passingGrade`. API client gửi và nhận `passing_grade`.
- **Giải pháp**: Xử lý mapping 2 chiều trong Service: nhận `passing_grade` từ payload và trả `passing_grade: quiz.passingGrade` trong response data.

---

### 7. KẾ HOẠCH TRIỂN KHAI CHI TIẾT PHASE 4 (STEPS 2–8)

Tuân thủ nghiêm ngặt quy trình phát triển và các cổng kiểm soát kiến trúc:

```text
[Step 1: Audit Report] (Hiện tại - Đã hoàn tất)
       │
       ▼ (Chờ Project Owner duyệt Step 1)
[Step 2: Legacy Isolation & Zod Model Integration]
       ├── Di chuyển quiz.model.ts & question.model.ts sang src/models/legacy/
       ├── Tạo pure Zod domain models: src/models/quiz.model.ts & question.model.ts
       └── Viết & chạy test cô lập: scripts/migration-utils/step-02-phase4-zod-models.test.ts
       │
       ▼
[Step 3: Functional Repositories Migration]
       ├── Tạo src/repositories/quiz.repository.ts & question.repository.ts
       ├── Định nghĩa Prisma Projections: QUIZ_PUBLIC_SELECT, QUIZ_DETAIL_SELECT, QUESTION_SELECT
       └── Viết & chạy test repo độc lập: scripts/migration-utils/step-03-phase4-repositories.test.ts
       │
       ▼
[Step 4: Services Migration]
       ├── Chuyển đổi src/services/quiz.service.ts & question.service.ts sang Prisma Repositories
       ├── Tích hợp kiểm tra ownership qua Lesson/Course, bảo vệ cascade, serialize options
       └── Viết & chạy test service: scripts/migration-utils/step-04-phase4-services.test.ts
       │
       ▼
[Step 5: Middleware, Validator, Controller & Route Integration]
       ├── Cập nhật src/middlewares/quiz.middleware.ts & question.middleware.ts sang UUID RFC 4122
       ├── Chuẩn hóa routes, controllers bảo toàn 100% API Contract Freeze
       └── Viết & chạy test validator: scripts/migration-utils/step-05-phase4-middleware.test.ts
       │
       ▼
[Step 6: Live HTTP API Test Audit]
       ├── Chạy kiểm thử HTTP thực tế trên server live (http://localhost:3002) cho toàn bộ 7 endpoints
       ├── Kiểm tra ma trận phân quyền (Guest, USER, TEACHER, ADMIN)
       └── Xác nhận database PostgreSQL zero-mutation & MongoDB không bị ghi ngoài ý muốn
       │
       ▼
[Step 7: Final Implementation Report]
       └── Lập báo cáo tổng hợp Phase 4 (Source code, Test metrics, Database status)
       │
       ▼
[Step 8: Approval Gate]
       └── Trình biên bản nghiệm thu để Project Owner xem xét và ký duyệt đóng Phase 4.
```

---

### 8. ĐIỀU KIỆN DỪNG VÀ ĐỀ XUẤT CHO PROJECT OWNER

Theo đúng quy định tại Mục IX & X trong yêu cầu nhiệm vụ:
- Antigravity đã hoàn thành trọn vẹn **Step 1 — Quiz & Question Audit**.
- **DỪNG LẠI HOÀN TOÀN** tại đây:
  * Không sửa source code.
  * Không sửa `prisma/schema.prisma`.
  * Không tạo migration mới.
  * Không thay đổi dữ liệu database.
  * Không tự ý chuyển sang Step 2.

**Kính trình Project Owner (Chủ dự án) xem xét báo cáo kiểm toán Step 1 và cho ý kiến chỉ đạo để kích hoạt Step 2 — Legacy Isolation & Model Integration.**

---
*Báo cáo kiểm toán được lập ngày 03/10/2026 bởi Antigravity.*
