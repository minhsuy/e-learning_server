# BÁO CÁO KỸ THUẬT: PHASE 4 — STEP 2: LEGACY ISOLATION & ZOD MODEL INTEGRATION

> **Dự án**: TMDEMY E-Learning Backend  
> **Giai đoạn**: Phase 4 — Quiz & Question Migration  
> **Bước thực hiện**: Step 2 — Legacy Model Isolation & Zod Application Model Integration  
> **Trạng thái**: **COMPLETED (41/41 TESTS PASS)**  
> **Ngày thực hiện**: 2026-10-03  

---

## 1. Executive Summary

Báo cáo này tài liệu hóa toàn diện kết quả thực hiện **Step 2: Legacy Isolation & Zod Model Integration** thuộc **Phase 4 — Quiz & Question Migration**. 

Mục tiêu cốt lõi của Step 2 đã hoàn thành 100% theo đúng các quy chuẩn kiến trúc và nguyên tắc chỉ đạo trong [AGENTS.md](file:///d:/e-learning_server/AGENTS.md):
1. **Cô lập Mongoose Legacy Models**: Di chuyển và bảo toàn toàn vẹn Mongoose schemas sang [src/models/legacy/quiz.legacy.model.ts](file:///d:/e-learning_server/src/models/legacy/quiz.legacy.model.ts) và [src/models/legacy/question.legacy.model.ts](file:///d:/e-learning_server/src/models/legacy/question.legacy.model.ts).
2. **Cập nhật Import Dependencies an toàn**: Tái định tuyến toàn bộ các consumers hiện hữu (`quizSubmission.service.ts`, `certificate.service.ts`, `quiz.service.ts`, `question.service.ts`) sang thư mục `legacy/`, bảo đảm không làm gián đoạn các luồng nghiệp vụ chưa migrate.
3. **Xây dựng Pure Zod Application Models**:
   - [src/models/quiz.model.ts](file:///d:/e-learning_server/src/models/quiz.model.ts): Pure Zod Domain Model cho Quiz kèm input/response schemas và types suy luận.
   - [src/models/question.model.ts](file:///d:/e-learning_server/src/models/question.model.ts): Pure Zod Domain Model cho Question với bảo mật chống lộ đáp án cho học viên (`questionPublicSchema` strictly omits `answer`).
   - Cả hai model tuân thủ 100% tiêu chí thuần khiết: **Không import Mongoose, không import Prisma Client, không truy vấn database**.
4. **Kiểm thử toàn diện**: Bộ test suite [scripts/migration-utils/step-02-phase4-zod-models.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-02-phase4-zod-models.test.ts) đạt kết quả **41/41 tests PASS (100%)**.
5. **Zero Premature Migration**: Không triển khai Repository, Service hay Route migration trong bước này theo đúng quy tắc phạm vi Step 2.

---

## 2. Legacy Model Isolation

Hệ thống transitional dual-stack yêu cầu Mongoose models phải được lưu giữ tại thư mục `src/models/legacy/` để tiếp tục phục vụ các module chưa migration (Phase 5–10) cho đến Phase 11 (Cleanup & Decommission).

### 2.1. File cô lập đã tạo:
* **Quiz Legacy Model**: [src/models/legacy/quiz.legacy.model.ts](file:///d:/e-learning_server/src/models/legacy/quiz.legacy.model.ts)
  - Bảo toàn Schema name `'Quiz'`.
  - Giữ nguyên cấu trúc: `title`, `duration`, `passing_grade`, `description`, `questions` (array of ObjectId), `lesson`, `created_by`, `courseId`.
  - Cập nhật định kiểu TypeScript an toàn: `_id: Types.ObjectId` (loại bỏ lỗi TS2430 baseline).
* **Question Legacy Model**: [src/models/legacy/question.legacy.model.ts](file:///d:/e-learning_server/src/models/legacy/question.legacy.model.ts)
  - Bảo toàn Schema name `'Question'`.
  - Giữ nguyên cấu trúc: `quiz`, `type`, `title`, `options` (array of string), `answer`, `points`.

---

## 3. Import Dependency Audit

Toàn bộ các file trong mã nguồn đang tham chiếu đến `quiz.model` và `question.model` đã được rà soát và cập nhật an toàn:

| File nguồn | Import cũ | Import mới sau Step 2 | Trạng thái |
| :--- | :--- | :--- | :--- |
| `src/services/quizSubmission.service.ts` | `~/models/quiz.model`<br>`~/models/question.model` | `~/models/legacy/quiz.legacy.model`<br>`~/models/legacy/question.legacy.model` | ✅ Hoạt động ổn định |
| `src/services/certificate.service.ts` | `~/models/quiz.model` | `~/models/legacy/quiz.legacy.model` | ✅ Hoạt động ổn định |
| `src/services/quiz.service.ts` | `~/models/quiz.model`<br>`~/models/question.model` | `~/models/legacy/quiz.legacy.model`<br>`~/models/legacy/question.legacy.model` | ✅ Hoạt động ổn định |
| `src/services/question.service.ts` | `~/models/question.model`<br>`~/models/quiz.model` | `~/models/legacy/question.legacy.model`<br>`~/models/legacy/quiz.legacy.model` | ✅ Hoạt động ổn định |

Kết quả: **0 file** ngoài `src/models/` còn import trực tiếp Mongoose models từ đường dẫn cũ `~/models/quiz.model` hoặc `~/models/question.model`.

---

## 4. QuizSubmission Compatibility Assessment

Theo chỉ thị pre-flight check của Project Owner, mối quan hệ giữa Quiz/Question và QuizSubmission đã được đánh giá chuyên sâu:

1. **Bản chất kỹ thuật của luồng QuizSubmission hiện tại**:
   - `QuizSubmission` (`src/models/quizSubmission.model.ts`) và `quizSubmission.service.ts` hiện tại chạy 100% trên MongoDB Atlas.
   - `submitQuizService` nhận `quizId: string` và tìm kiếm bằng `QuizModel.findById(quizId)` (Mongoose ObjectId).
   - `calculateQuizScoreService` tìm câu hỏi bằng `QuestionModel.findById(ans.question)` (Mongoose ObjectId).
2. **Khả năng tương thích giữa MongoDB và PostgreSQL**:
   - Việc chuyển Mongoose model sang `src/models/legacy/` chỉ là bước **cô lập mã nguồn**, không tạo ra cầu nối dữ liệu để Mongoose có thể truy vấn các bản ghi mới tạo trên PostgreSQL.
   - Các Quiz và Question legacy trong MongoDB vẫn tiếp tục được `QuizSubmission` phục vụ bình thường.
   - **Giới hạn tương thích**: Các Quiz và Question mới tạo trên PostgreSQL (dùng UUID) **sẽ chưa thể thực hiện nộp bài (submission)** qua API `quizSubmission` hiện tại cho đến khi Phase 5 (Quiz Submission & Evaluation Migration) được triển khai.
3. **Nguy cơ nhầm lẫn ObjectId và UUID**:
   - Không có nguy cơ xung đột dữ liệu: Mongoose tự động reject các chuỗi UUID v4 khi validate ObjectId (`CastError`).
   - Client gọi nộp bài với UUID vào endpoint cũ sẽ nhận phản hồi an toàn (`404 Quiz not found` hoặc `CastError`), không gây ghi đè hay hỏng dữ liệu MongoDB.
   - Giới hạn chuyển tiếp này là tất yếu trong kiến trúc Dual-Stack và sẽ được giải quyết triệt để tại Phase 5.

---

## 5. Question Ordering Assessment

1. **Cơ chế lưu trữ cũ trong MongoDB**:
   - MongoDB `Quiz` lưu mảng `questions: Schema.Types.ObjectId[]`. Thứ tự câu hỏi được bảo toàn tự nhiên theo thứ tự chèn trong mảng.
2. **Cấu trúc lưu trữ mục tiêu trong PostgreSQL**:
   - Trong `prisma/schema.prisma`:
     - Bảng `questions` không có cột `order`. Tuy nhiên, bảng có trường `createdAt DateTime @default(now()) @map("created_at")`.
     - Bảng con `question_options` có trường `order Int @default(0)` để bảo đảm thứ tự các lựa chọn trong câu hỏi trắc nghiệm.
3. **Kết luận và Đề xuất kỹ thuật**:
   - Thứ tự câu hỏi trong một Quiz được bảo toàn tuyệt đối bằng cách truy vấn với `orderBy: { createdAt: 'asc' }`.
   - Không cần thay đổi Prisma Schema vật lý. Việc sắp xếp theo `createdAt: 'asc'` hoàn toàn đáp ứng đúng nghiệp vụ và API contract.

---

## 6. Lesson — Quiz Unique Constraint Assessment

1. **Ràng buộc vật lý**:
   - Trong `prisma/schema.prisma`: `model Quiz { lessonId String @unique @map("lesson_id") @db.Uuid ... }`.
   - Mỗi Lesson chỉ được gắn tối đa với duy nhất 1 Quiz.
2. **Kiểm tra dữ liệu thực tế trên PostgreSQL**:
   - Bảng `quizzes` hiện có 3 bản ghi:
     * `9ef997e1-8848-4cb9-9599-4d643efb3438` → `lessonId: 9da46f1e-f3b7-4a6c-941e-355b9e15967b`
     * `b9e14796-0158-4560-a29d-47675f0a06ce` → `lessonId: 65162a86-7ae0-4d51-a9f8-b3420d43a6d7`
     * `d40087b3-c401-4475-a83a-4411130d226a` → `lessonId: 68612143-228d-4a18-be42-f8319f394982`
   - Cả 3 bản ghi đều có `lessonId` riêng biệt, không có bất kỳ sự trùng lặp nào.
3. **Kết luận**: Dữ liệu hiện tại hoàn toàn tương thích 100% với ràng buộc `@unique`. Nghiệp vụ tại Step 3/Step 4 sẽ kiểm tra tính duy nhất này trước khi tạo Quiz mới.

---

## 7. Zod Quiz Model (`src/models/quiz.model.ts`)

File [src/models/quiz.model.ts](file:///d:/e-learning_server/src/models/quiz.model.ts) được thiết kế thuần khiết (Pure Zod):

```typescript
// Base Domain Schema
export const quizSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().default(''),
  duration: z.number().int().nonnegative().default(0),
  passingGrade: z.number().int().min(0).max(100).default(0),
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  createdById: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Public Schema for Students
export const quizPublicSchema = quizSchema.pick({
  id: true,
  title: true,
  description: true,
  duration: true,
  passingGrade: true,
  lessonId: true,
  courseId: true,
  createdAt: true,
  updatedAt: true
})

// Detail Response Schema (includes nested questions)
export const quizDetailResponseSchema = quizSchema.extend({
  questions: z.array(questionPublicSchema).default([])
})

// Input Action Schemas
export const createQuizInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  duration: z.number().int().nonnegative().optional().default(0),
  passingGrade: z.number().int().min(0).max(100).optional().default(0),
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  createdById: z.string().uuid()
})

export const updateQuizInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  passingGrade: z.number().int().min(0).max(100).optional(),
  lessonId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional()
})

// Inferred Types
export type Quiz = z.infer<typeof quizSchema>
export type QuizPublic = z.infer<typeof quizPublicSchema>
export type QuizDetailResponse = z.infer<typeof quizDetailResponseSchema>
export type CreateQuizInput = z.infer<typeof createQuizInputSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizInputSchema>
```

---

## 8. Zod Question Model (`src/models/question.model.ts`)

File [src/models/question.model.ts](file:///d:/e-learning_server/src/models/question.model.ts) thiết kế hỗ trợ bảo mật chống lộ đáp án và tương thích hoàn toàn với Prisma Enum:

```typescript
// Question Type Enum & Normalization
export const QuestionTypeValues = ['multiple_choice', 'fill_in_blank'] as const

export const questionTypeSchema = z.union([
  z.enum(QuestionTypeValues),
  z.enum(['MULTIPLE_CHOICE', 'FILL_IN_BLANK']).transform((val) => {
    return val === 'MULTIPLE_CHOICE' ? ('multiple_choice' as const) : ('fill_in_blank' as const)
  })
])

// Base Domain Schema
export const questionSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  type: questionTypeSchema.default('multiple_choice'),
  title: z.string().min(1),
  options: z.array(z.string()).default([]),
  answer: z.string().min(1),
  points: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Anti-Cheat: Public Schema OMITTING answer
export const questionPublicSchema = questionSchema.omit({
  answer: true
})

// Instructor / Admin Study Schema
export const questionStudySchema = questionSchema.pick({
  id: true,
  quizId: true,
  type: true,
  title: true,
  options: true,
  answer: true,
  points: true,
  createdAt: true,
  updatedAt: true
})

// Input Action Schemas
export const createQuestionInputSchema = z
  .object({
    quizId: z.string().uuid(),
    type: questionTypeSchema.default('multiple_choice'),
    title: z.string().min(1),
    options: z.array(z.string()).optional().default([]),
    answer: z.string().min(1),
    points: z.number().int().min(1).optional().default(1)
  })
  .refine(
    (data) => {
      if (data.type === 'fill_in_blank') return true
      if (data.options && data.options.length > 0 && data.options.length < 2) return false
      return true
    },
    {
      message: 'Multiple choice questions must have at least 2 options if options are provided',
      path: ['options']
    }
  )

export const updateQuestionInputSchema = z.object({
  type: questionTypeSchema.optional(),
  title: z.string().min(1).optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1).optional(),
  points: z.number().int().min(1).optional()
})

// Inferred Types
export type Question = z.infer<typeof questionSchema>
export type QuestionPublic = z.infer<typeof questionPublicSchema>
export type QuestionStudy = z.infer<typeof questionStudySchema>
export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>
```

---

## 9. Model Integration Strategy

Các Zod Application Models đóng vai trò trung tâm trong kiến trúc phân tầng của Phase 4:

1. **Middleware / Transport Validation**:
   - Sử dụng Express Validator kết hợp UUID validator tại HTTP boundary.
2. **Controller Layer**:
   - Tiếp nhận input, chuyển tiếp vào Service Layer sử dụng các kiểu `CreateQuizInput`, `UpdateQuizInput`, `CreateQuestionInput`.
3. **Service Layer**:
   - Áp dụng các Zod Types (`Quiz`, `Question`, `QuestionPublic`, `QuizDetailResponse`) làm kiểu dữ liệu chuẩn cho Business Logic.
   - Thực thi Zod validation tại các ranh giới xử lý logic.
4. **Repository Layer (Step 3)**:
   - Sử dụng Prisma-generated types (`Prisma.QuizGetPayload`, `Prisma.QuestionGetPayload`) cho các thao tác truy vấn PostgreSQL thuần túy.
   - Không ép buộc Repository gọi `.parse()` của Zod để tránh lãng phí hiệu năng.
5. **Mapper / Serializer Layer**:
   - Thực hiện chuyển đổi tường minh giữa Prisma schema (`passingGrade`, `options` child table) và API response contract (`passing_grade`, `string[] options`, kèm `_id` qua `withCompatId`).

---

## 10. Test Results

Bộ kiểm thử [scripts/migration-utils/step-02-phase4-zod-models.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-02-phase4-zod-models.test.ts) được thực thi và xác nhận:

```text
================================================================================
  TEST SUITE: PHASE 4 STEP 2 — QUIZ & QUESTION ZOD APPLICATION MODELS & LEGACY ISOLATION
================================================================================

--- 1. QUIZ APPLICATION MODEL TESTS ---
  ✅ PASSED: quizSchema accepts valid Quiz domain object with UUIDs
  ✅ PASSED: quizSchema rejects invalid id UUID
  ✅ PASSED: quizSchema rejects MongoDB ObjectId for lessonId (must be UUID)
  ✅ PASSED: quizSchema rejects empty title
  ✅ PASSED: quizSchema requires lessonId
  ✅ PASSED: quizSchema applies default values for description (""), duration (0), passingGrade (0)
  ✅ PASSED: createQuizInputSchema accepts valid input
  ✅ PASSED: createQuizInputSchema rejects invalid data
  ✅ PASSED: updateQuizInputSchema allows partial field updates
  ✅ PASSED: quizPublicSchema successfully extracts public student fields and omits createdById
  ✅ PASSED: quizDetailResponseSchema parses nested public questions successfully

--- 2. QUESTION APPLICATION MODEL TESTS ---
  ✅ PASSED: questionSchema accepts valid Question domain object with UUIDs
  ✅ PASSED: questionTypeSchema accepts "multiple_choice"
  ✅ PASSED: questionTypeSchema accepts "fill_in_blank"
  ✅ PASSED: questionTypeSchema normalizes Prisma uppercase "MULTIPLE_CHOICE" to lowercase "multiple_choice"
  ✅ PASSED: questionTypeSchema normalizes Prisma uppercase "FILL_IN_BLANK" to lowercase "fill_in_blank"
  ✅ PASSED: questionTypeSchema rejects invalid type "essay"
  ✅ PASSED: questionTypeSchema rejects invalid type "boolean"
  ✅ PASSED: questionSchema supports fill_in_blank with empty options
  ✅ PASSED: questionSchema rejects options containing non-strings
  ✅ PASSED: questionSchema defaults points to 1
  ✅ PASSED: questionSchema rejects points < 1
  ✅ PASSED: SECURITY: questionPublicSchema strictly strips the answer field for students
  ✅ PASSED: questionStudySchema includes answer field for authorized teachers/admins
  ✅ PASSED: createQuestionInputSchema accepts valid multiple choice question
  ✅ PASSED: createQuestionInputSchema rejects multiple choice with < 2 options
  ✅ PASSED: createQuestionInputSchema accepts fill_in_blank with empty options
  ✅ PASSED: updateQuestionInputSchema accepts partial updates

--- 3. ARCHITECTURE & ISOLATION AUDIT ---
  ✅ PASSED: src/models/quiz.model.ts does NOT import mongoose
  ✅ PASSED: src/models/quiz.model.ts does NOT import @prisma/client
  ✅ PASSED: src/models/quiz.model.ts does NOT import prisma singleton
  ✅ PASSED: src/models/question.model.ts does NOT import mongoose
  ✅ PASSED: src/models/question.model.ts does NOT import @prisma/client
  ✅ PASSED: src/models/question.model.ts does NOT import prisma singleton
  ✅ PASSED: Legacy model exists at src/models/legacy/quiz.legacy.model.ts
  ✅ PASSED: Legacy model exists at src/models/legacy/question.legacy.model.ts
  ✅ PASSED: src/services/quizSubmission.service.ts imports QuizModel from legacy model
  ✅ PASSED: src/services/quizSubmission.service.ts imports QuestionModel from legacy model
  ✅ PASSED: src/services/certificate.service.ts imports QuizModel from legacy model
  ✅ PASSED: src/services/quiz.service.ts imports QuizModel from legacy model
  ✅ PASSED: src/services/question.service.ts imports QuestionModel from legacy model

================================================================================
  TOTAL TESTS: 41
  PASSED:      41
  FAILED:      0
================================================================================
```

---

## 11. TypeScript Status

- Lệnh kiểm tra: `npx tsc --noEmit`
- **Kết quả đối với Phase 4 Step 2**: Cả hai file Zod models mới và hai file legacy models biên dịch **hoàn hảo không lỗi (0 errors)**.
- **Known Baseline Issues**: Các lỗi tsc ghi nhận thuộc về các module chưa migration (comment, coupon, favoriteCourse, raing controller params, cloudinary typing trong pdfGenerator) — hoàn toàn không liên quan và không bị ảnh hưởng bởi Step 2.

---

## 12. Danh sách Files đã thay đổi / tạo mới

| File | Hành động | Mục đích |
| :--- | :--- | :--- |
| `src/models/legacy/quiz.legacy.model.ts` | Tạo mới | Cô lập Mongoose Quiz Model phục vụ các module chưa migrate |
| `src/models/legacy/question.legacy.model.ts` | Tạo mới | Cô lập Mongoose Question Model phục vụ các module chưa migrate |
| `src/models/quiz.model.ts` | Viết lại | Pure Zod Application Model cho Quiz entity |
| `src/models/question.model.ts` | Viết lại | Pure Zod Application Model cho Question entity |
| `src/services/quizSubmission.service.ts` | Sửa đổi | Cập nhật import `QuizModel` và `QuestionModel` sang `legacy/` |
| `src/services/certificate.service.ts` | Sửa đổi | Cập nhật import `QuizModel` sang `legacy/` |
| `src/services/quiz.service.ts` | Sửa đổi | Cập nhật import `QuizModel` và `QuestionModel` sang `legacy/` |
| `src/services/question.service.ts` | Sửa đổi | Cập nhật import `QuestionModel` và `QuizModel` sang `legacy/` |
| `scripts/migration-utils/step-02-phase4-zod-models.test.ts` | Tạo mới | Bộ test kiểm thử 41 kịch bản xác thực Zod & Architecture Isolation |
| `docs/migration/phase-04-quiz-question/step-02-legacy-isolation-zod-model-report.md` | Tạo mới | Báo cáo kỹ thuật chi tiết Step 2 |

---

## 13. Known Issues & Boundaries

1. **Dual-Stack QuizSubmission Boundary**:
   - `QuizSubmission` hiện chỉ tương thích với legacy MongoDB quizzes. Các quiz mới tạo trong PostgreSQL sẽ được hỗ trợ nộp bài tại Phase 5.
2. **Question Order**:
   - PostgreSQL Question không có cột `order`, sắp xếp sẽ thực hiện theo `createdAt: 'asc'`.

---

## 14. Khuyến nghị cho Step 3 (Functional Repositories Migration)

Sau khi được Project Owner phê duyệt Step 2, Step 3 sẽ triển khai các Functional Repositories:
1. Tạo `src/repositories/quiz.repository.ts`:
   - Các hàm: `findQuizById`, `findQuizByLessonId`, `findQuizzesByCourseId`, `createQuiz`, `updateQuiz`, `deleteQuiz`.
   - Hỗ trợ Prisma Select Projections (`QUIZ_PUBLIC_SELECT`, `QUIZ_DETAIL_SELECT`).
   - Hỗ trợ `tx?: PrismaTransactionClient`.
2. Tạo `src/repositories/question.repository.ts`:
   - Các hàm: `findQuestionById`, `findQuestionsByQuizId`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `deleteQuestionsByQuizId`.
   - Xử lý quan hệ bảng con `QuestionOption` (tạo/cập nhật options đồng bộ).
   - Hỗ trợ `tx?: PrismaTransactionClient`.
3. Viết test suite cho Repositories trước khi chuyển sang Step 4 (Services Migration).

---

## 15. Dừng & Chờ Phê duyệt (Stop Condition)

Step 2 đã hoàn thành trọn vẹn, vượt qua toàn bộ 41/41 tests và không vi phạm bất kỳ quy tắc nào trong AGENTS.md.
Hệ thống **dừng hoàn toàn** tại đây để Project Owner kiểm tra và phê duyệt trước khi kích hoạt Step 3.
