# BÁO CÁO KỸ THUẬT: PHASE 4 — STEP 3: FUNCTIONAL REPOSITORY MIGRATION

> **Dự án**: TMDEMY E-Learning Backend  
> **Giai đoạn**: Phase 4 — Quiz & Question Migration  
> **Nhiệm vụ**: Step 3 — Functional Repository Migration  
> **Trạng thái**: **COMPLETED (40/40 TESTS PASS)**  
> **Ngày thực hiện**: 2026-10-03  

---

## 1. Executive Summary

Báo cáo này tài liệu hóa chi tiết việc triển khai tầng **Functional Repository** cho hai thực thể **Quiz** và **Question** (bao gồm bảng quan hệ con **QuestionOption**) truy vấn trực tiếp cơ sở dữ liệu **PostgreSQL (`tmdemy`)** thông qua **Prisma ORM 6.4.1**.

### Kết quả then chốt:
1. **Hoàn thành 2 Functional Repositories**:
   - [src/repositories/quiz.repository.ts](file:///d:/e-learning_server/src/repositories/quiz.repository.ts)
   - [src/repositories/question.repository.ts](file:///d:/e-learning_server/src/repositories/question.repository.ts)
2. **Tuân thủ 100% Tiêu chuẩn Kiến trúc Functional Repository (AGENTS.md)**:
   - Các hàm async độc lập, không sử dụng class, không `this`, không BaseRepository generic.
   - Sử dụng Prisma Client Singleton từ [src/config/prisma.ts](file:///d:/e-learning_server/src/config/prisma.ts).
   - Hỗ trợ đầy đủ tham số giao dịch tùy chọn `tx?: PrismaTransactionClient`.
   - **0 import Mongoose, 0 truy vấn MongoDB, 0 ép kiểu `any`**.
3. **QuestionOption Relational Mapping & Atomic Transactions**:
   - Chuyển đổi hai chiều mượt mà giữa mảng chuỗi legacy `options: string[]` và bảng quan hệ con `question_options` có thứ tự `order: number`.
   - Cập nhật atomic: Phân biệt rõ ràng giữa `options === undefined` (giữ nguyên options cũ), `options === []` (xóa sạch options), và `options = [...]` (thay thế nguyên tử trong transaction).
4. **Bảo mật Anti-Cheat tuyệt đối**:
   - Cung cấp `QUIZ_WITH_PUBLIC_QUESTIONS_SELECT` và `QUESTION_PUBLIC_SELECT` strictly loại trừ trường `answer` cho học viên.
   - Cung cấp `QUIZ_DETAIL_SELECT` và `QUESTION_STUDY_SELECT` giữ lại `answer` cho giảng viên/admin.
5. **Kiểm thử thực tế Zero-Mutation**:
   - Bộ test suite [scripts/migration-utils/step-03-phase4-repositories.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-03-phase4-repositories.test.ts) đạt **40/40 tests PASS (100%)**.
   - Mọi thao tác ghi/xóa/sửa được thực thi và kiểm chứng trên transaction thật, sau đó rollback đảm bảo số lượng bản ghi trong database PostgreSQL giữ nguyên vẹn 100%.

---

## 2. Repository Architecture

Kiến trúc luồng xử lý dữ liệu đơn hướng tuân thủ nghiêm ngặt mô hình đã duyệt:

```text
HTTP Request
  └── Router (src/routes/)
        └── Middleware & Express Validator (src/middlewares/)
              └── Controller (src/controller/)
                    └── Service (src/services/)
                          └── Functional Repository (src/repositories/)
                                └── Prisma Client Singleton (src/config/prisma.ts)
                                      └── PostgreSQL Database (tmdemy)
```

- **Functional Repository** chịu trách nhiệm duy nhất: Tương tác với PostgreSQL thông qua Prisma Client Singleton.
- Không chứa business logic, không kiểm tra quyền sở hữu người dùng (trách nhiệm của Service Layer).
- Sử dụng Prisma-generated types (`Prisma.QuizGetPayload`, `Prisma.QuestionGetPayload`) thay vì Zod types tại tầng này.

---

## 3. Quiz Repository (`src/repositories/quiz.repository.ts`)

File [src/repositories/quiz.repository.ts](file:///d:/e-learning_server/src/repositories/quiz.repository.ts) cung cấp đầy đủ các thao tác đọc và ghi cho thực thể `Quiz`:

### 3.1. Read Operations:
| Hàm | Đầu vào | Đầu ra | Mục đích |
| :--- | :--- | :--- | :--- |
| `findQuizById` | `id: string, tx?` | `Promise<Quiz \| null>` | Tìm quiz theo khóa chính UUID. |
| `findQuizByIdWithPublicQuestions` | `id: string, tx?` | `Promise<QuizWithPublicQuestionsPayload \| null>` | Lấy quiz kèm danh sách câu hỏi học viên (không có `answer`). |
| `findQuizByIdWithDetail` | `id: string, tx?` | `Promise<QuizDetailPayload \| null>` | Lấy quiz kèm danh sách câu hỏi giảng viên (có `answer`). |
| `findQuizByLessonId` | `lessonId: string, tx?` | `Promise<Quiz \| null>` | Tìm quiz theo `lessonId` (tôn trọng `@unique` constraint). |
| `findQuizByLessonIdWithPublicQuestions` | `lessonId: string, tx?` | `Promise<QuizWithPublicQuestionsPayload \| null>` | Tìm quiz theo `lessonId` kèm câu hỏi học viên. |
| `findQuizzesByCourseId` | `courseId: string, tx?` | `Promise<Quiz[]>` | Lấy danh sách quiz theo khóa học, sắp xếp `createdAt: 'asc'`. |
| `findQuizzesByCourseIdWithPublicQuestions` | `courseId: string, tx?` | `Promise<QuizWithPublicQuestionsPayload[]>` | Lấy danh sách quiz theo khóa học kèm câu hỏi học viên. |

### 3.2. Write Operations:
| Hàm | Đầu vào | Đầu ra | Mục đích |
| :--- | :--- | :--- | :--- |
| `createQuiz` | `data: Prisma.QuizUncheckedCreateInput, tx?` | `Promise<Quiz>` | Tạo mới bản ghi Quiz trên PostgreSQL. Bắt lỗi P2002 nếu trùng `lessonId`. |
| `updateQuiz` | `id: string, data: Prisma.QuizUncheckedUpdateInput, tx?` | `Promise<Quiz>` | Cập nhật scalar fields của Quiz (`title`, `duration`, `passingGrade`, `description`). |
| `deleteQuiz` | `id: string, tx?` | `Promise<Quiz>` | Xóa Quiz theo UUID. Tự động cascade xóa child questions & options. |

---

## 4. Question Repository (`src/repositories/question.repository.ts`)

File [src/repositories/question.repository.ts](file:///d:/e-learning_server/src/repositories/question.repository.ts) xử lý trọn vẹn sự chuyển dịch từ mảng chuỗi `options: string[]` sang bảng con `question_options`:

### 4.1. QuestionOption Relational Mapping
- **Khi đọc**: Các hàm query `include: { options: { orderBy: { order: 'asc' } } }`. Đồng thời cung cấp tiện ích `formatQuestionOptions(question)` để ánh xạ trả về `options: string[]` tương thích 100% với contract của Client/Service cũ.
- **Khi ghi (`createQuestion`)**: Nhận `options?: string[]`. Sử dụng nested write `options: { create: options.map((optText, index) => ({ optionText: optText, order: index })) }`.
- **Khi cập nhật (`updateQuestion`)**:
  - `options === undefined`: Giữ nguyên danh sách `options` hiện hữu.
  - `options === []`: Xóa toàn bộ `options` của câu hỏi.
  - `options = ['A', 'B', ...]`: Xóa các lựa chọn cũ và tạo lại danh sách mới với `order: 0, 1, ...` nguyên tử trong transaction.

### 4.2. Danh sách hàm:
| Hàm | Đầu vào | Đầu ra | Mục đích |
| :--- | :--- | :--- | :--- |
| `findQuestionById` | `id: string, tx?` | `Promise<QuestionWithOptionRecords \| null>` | Lấy câu hỏi kèm options theo thứ tự `order: 'asc'`. |
| `findQuestionsByQuizId` | `quizId: string, tx?` | `Promise<QuestionWithOptionRecords[]>` | Lấy câu hỏi theo Quiz ID, sắp xếp `[createdAt ASC, id ASC]`. |
| `findQuestionsByQuizIdPublic` | `quizId: string, tx?` | `Promise<QuestionPublicPayload[]>` | Lấy câu hỏi học viên theo Quiz ID (STRICTLY NO `answer`). |
| `findQuestionsByQuizIdStudy` | `quizId: string, tx?` | `Promise<QuestionStudyPayload[]>` | Lấy câu hỏi giảng viên theo Quiz ID (CÓ `answer`). |
| `createQuestion` | `data: CreateQuestionData, tx?` | `Promise<QuestionWithOptionRecords>` | Tạo câu hỏi và options đồng bộ trong transaction. |
| `updateQuestion` | `id: string, data: UpdateQuestionData, tx?` | `Promise<QuestionWithOptionRecords>` | Cập nhật câu hỏi và options nguyên tử. |
| `deleteQuestion` | `id: string, tx?` | `Promise<Question>` | Xóa câu hỏi theo UUID (cascade xóa options). |
| `deleteQuestionsByQuizId` | `quizId: string, tx?` | `Promise<Prisma.BatchPayload>` | Xóa hàng loạt câu hỏi thuộc một Quiz. |

---

## 5. Prisma Select Projections & Security Boundaries

Các hằng số Projection được định nghĩa rõ ràng với `as const satisfies Prisma.*Select`:

1. `QUIZ_PUBLIC_SELECT`: Chỉ chứa các trường công khai của Quiz.
2. `QUIZ_WITH_PUBLIC_QUESTIONS_SELECT`: Nhúng danh sách câu hỏi của Quiz nhưng **chủ động loại bỏ cột `answer`**:
   ```typescript
   questions: {
     orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
     select: {
       id: true,
       quizId: true,
       type: true,
       title: true,
       points: true,
       createdAt: true,
       updatedAt: true,
       options: {
         orderBy: { order: 'asc' },
         select: { id: true, optionText: true, order: true }
       }
     }
   }
   ```
3. `QUIZ_DETAIL_SELECT`: Nhúng danh sách câu hỏi **kèm cột `answer: true`** dành riêng cho giảng viên/admin.
4. `QUESTION_PUBLIC_SELECT`: Projection câu hỏi công khai (không có `answer`).
5. `QUESTION_STUDY_SELECT`: Projection câu hỏi quản trị (có `answer`).

---

## 6. Type Safety & Model Integration

- **Prisma-generated Types**:
  - `QuizPublicPayload = Prisma.QuizGetPayload<{ select: typeof QUIZ_PUBLIC_SELECT }>`
  - `QuizWithPublicQuestionsPayload = Prisma.QuizGetPayload<{ select: typeof QUIZ_WITH_PUBLIC_QUESTIONS_SELECT }>`
  - `QuizDetailPayload = Prisma.QuizGetPayload<{ select: typeof QUIZ_DETAIL_SELECT }>`
  - `QuestionWithOptionRecords = Prisma.QuestionGetPayload<{ include: { options: { orderBy: { order: 'asc' } } } }>`
- **Zod Application Models**: Được thiết lập từ Step 2 làm ranh giới xác thực dữ liệu tại Transport/Controller/Service layer. Repositories **không gọi `.parse()`** trên từng query nhằm tối ưu hóa hiệu năng.
- **Any Policy**: **0 `any` mới** được thêm vào hai file Repository.

---

## 7. Transaction Support

- Mọi hàm trong `quiz.repository.ts` và `question.repository.ts` đều chấp nhận tham số tùy chọn `tx?: PrismaTransactionClient`.
- Khi `tx` được truyền từ tầng Service, các thao tác sẽ tham gia vào cùng một transaction PostgreSQL chung.
- Các thao tác đa bảng phức hợp trong `question.repository.ts` (`createQuestion` với options, `updateQuestion` thay thế options) tự động khởi tạo `prisma.$transaction` nếu caller không truyền `tx`.

---

## 8. Question Ordering

- Trong PostgreSQL, bảng `questions` không có cột `order`.
- Repository áp dụng quy tắc sắp xếp tất định:
  ```typescript
  orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  ```
- Tiêu chí chính: `createdAt: 'asc'` bảo toàn thứ tự tạo câu hỏi (khớp với thứ tự chèn mảng trong MongoDB).
- Tiêu chí phụ: `id: 'asc'` đóng vai trò tie-breaker tất định khi hai câu hỏi có cùng timestamp millisecond.
- Bảng con `question_options` sắp xếp theo cột `order: 'asc'`.

---

## 9. Test Results

Bộ kiểm thử [scripts/migration-utils/step-03-phase4-repositories.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-03-phase4-repositories.test.ts) thực thi và vượt qua **40/40 tests (100% PASS)**:

```text
================================================================================
  TEST SUITE: PHASE 4 STEP 3 — FUNCTIONAL QUIZ & QUESTION REPOSITORIES
================================================================================

Initial PostgreSQL State:
  - quizzes:          3
  - questions:        5
  - question_options: 20

--- 1. ARCHITECTURE & PURITY AUDIT (8/8 PASS) ---
  ✅ PASSED: quiz.repository.ts does NOT import mongoose
  ✅ PASSED: quiz.repository.ts is functional, not class-based
  ✅ PASSED: quiz.repository.ts does not use BaseRepository
  ✅ PASSED: quiz.repository.ts imports Prisma Singleton
  ✅ PASSED: question.repository.ts does NOT import mongoose
  ✅ PASSED: question.repository.ts is functional, not class-based
  ✅ PASSED: question.repository.ts does not use BaseRepository
  ✅ PASSED: question.repository.ts imports Prisma Singleton

--- 2. READ OPERATIONS ON EXISTING DATA (12/12 PASS) ---
  ✅ PASSED: findQuizById finds existing quiz by UUID
  ✅ PASSED: findQuizById returns null for non-existent UUID
  ✅ PASSED: findQuizByLessonId finds quiz by unique lessonId
  ✅ PASSED: findQuizzesByCourseId returns quizzes for a course
  ✅ PASSED: findQuizByIdWithPublicQuestions returns public quiz
  ✅ PASSED: SECURITY: findQuizByIdWithPublicQuestions strictly omits "answer" from all questions
  ✅ PASSED: findQuizByIdWithDetail returns detail quiz
  ✅ PASSED: findQuizByIdWithDetail includes "answer" field for teachers/admins
  ✅ PASSED: findQuestionsByQuizId returns all questions for quiz
  ✅ PASSED: SECURITY: findQuestionsByQuizIdPublic returns questions strictly without "answer"
  ✅ PASSED: findQuestionsByQuizIdStudy returns questions with "answer" for instructors
  ✅ PASSED: formatQuestionOptions maps QuestionOption[] to options: string[] for legacy compatibility
  ✅ PASSED: [QuizRepo] createQuiz rejects duplicate lessonId with Prisma P2002

--- 3. MUTATION OPERATIONS IN TRANSACTION (ZERO MUTATION VERIFICATION) (16/16 PASS) ---
  ✅ PASSED: [QuizRepo] createQuiz creates record with valid UUID
  ✅ PASSED: [QuizRepo] createQuiz stores passingGrade properly
  ✅ PASSED: [QuizRepo] updateQuiz mutates scalar fields correctly
  ✅ PASSED: [QuestionRepo] createQuestion creates question with valid UUID
  ✅ PASSED: [QuestionRepo] createQuestion creates 4 child question_options
  ✅ PASSED: [QuestionRepo] createQuestion preserves 0-indexed order on options
  ✅ PASSED: [QuestionRepo] createQuestion creates fill_in_blank with 0 options
  ✅ PASSED: [QuestionRepo] updateQuestion with options === undefined preserves existing options completely
  ✅ PASSED: [QuestionRepo] updateQuestion replaces options atomically and resets order
  ✅ PASSED: [QuestionRepo] updateQuestion with options === [] deletes all existing options
  ✅ PASSED: [QuestionRepo] deleteQuestion deletes single question
  ✅ PASSED: [QuestionRepo] findQuestionById returns null for deleted question
  ✅ PASSED: [QuestionRepo] deleteQuestionsByQuizId deletes remaining questions
  ✅ PASSED: [QuizRepo] deleteQuiz deletes quiz successfully
  ✅ PASSED: [QuizRepo] findQuizById returns null after quiz deletion
  ✅ PASSED: [Isolation] Transaction rolled back cleanly — zero mutations committed

--- 4. ZERO-MUTATION POST-TEST CHECK (4/4 PASS) ---
Final Database State:
  - quizzes:          3 (initial: 3)
  - questions:        5 (initial: 5)
  - question_options: 20 (initial: 20)

  ✅ PASSED: [ZeroMutation] quizzes table count unchanged (exactly 3)
  ✅ PASSED: [ZeroMutation] questions table count unchanged (exactly 5)
  ✅ PASSED: [ZeroMutation] question_options table count unchanged (exactly 20)
================================================================================
  TOTAL TESTS: 40 | PASSED: 40 | FAILED: 0
================================================================================
```

---

## 10. TypeScript & Validation Results

- `npx prisma validate`: **PASS (The schema at prisma\schema.prisma is valid 🚀)**.
- `npx tsc --noEmit`: **0 lỗi mới**. Hai file repository mới biên dịch hoàn hảo. Các lỗi tsc hiện hữu thuộc về các module chưa migrate ngoài phạm vi Phase 4 (Comment, Coupon, PDF Generator).
- Regression check Step 2 (`step-02-phase4-zod-models.test.ts`): **42/42 tests PASS**.

---

## 11. Danh sách Files đã tạo mới / chỉnh sửa

| File | Hành động | Mục đích |
| :--- | :--- | :--- |
| `src/repositories/quiz.repository.ts` | Tạo mới | Functional Repository cho entity Quiz trên PostgreSQL |
| `src/repositories/question.repository.ts` | Tạo mới | Functional Repository cho entity Question & QuestionOption |
| `scripts/migration-utils/step-03-phase4-repositories.test.ts` | Tạo mới | Test suite 40 bài kiểm thử CRUD, transactions, projections, zero-mutation |
| `docs/migration/phase-04-quiz-question/step-03-functional-repository-report.md` | Tạo mới | Báo cáo kỹ thuật chi tiết Step 3 |

---

## 12. Known Issues & Boundaries

1. **Dual-Stack Transitional State**:
   - Hai Repositories mới được xây dựng độc lập và chưa được tích hợp vào `quiz.service.ts` hay `question.service.ts`.
   - Các Services hiện tại vẫn trỏ tới `src/models/legacy/` đảm bảo hệ thống không bị xáo trộn trước khi bước vào Step 4.
2. **Question Order**:
   - PostgreSQL chưa có cột `order` cho Question. Sắp xếp dựa trên `[createdAt ASC, id ASC]`.

---

## 13. Khuyến nghị cho Step 4 (Services Migration)

Khi chuyển sang Step 4:
1. **Refactor `src/services/quiz.service.ts`**:
   - Thay thế các lệnh gọi `QuizModel` và `QuestionModel` bằng các hàm từ `quiz.repository.ts` và `question.repository.ts`.
   - Tích hợp kiểm tra quyền sở hữu bài giảng/khóa học qua `lesson.repository.ts` và `course.repository.ts`.
   - Sử dụng `formatSafeQuiz` / serializer với `withCompatId` để đảm bảo trả về `_id` tương thích frontend.
2. **Refactor `src/services/question.service.ts`**:
   - Thay thế `QuestionModel.create/update/delete` bằng `createQuestion`, `updateQuestion`, `deleteQuestion` từ `question.repository.ts`.
   - Ánh xạ mảng `options: string[]` thông qua `formatQuestionOptions`.
3. **Cập nhật Middlewares & Validators (Step 4)**:
   - Thay thế MongoDB ObjectId validation bằng UUID validation trong `quiz.middleware.ts` và `question.middleware.ts`.

---

## 14. Stop Condition

Step 3 đã hoàn tất trọn vẹn, không vi phạm bất kỳ giới hạn phạm vi nào.
Hệ thống **dừng hoàn toàn** tại đây để Project Owner kiểm tra và phê duyệt trước khi chuyển sang Step 4.
