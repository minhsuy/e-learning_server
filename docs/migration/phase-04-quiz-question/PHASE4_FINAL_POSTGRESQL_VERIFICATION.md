# PHASE 4 — FINAL POSTGRESQL MIGRATION VERIFICATION REPORT
## MODULE: QUIZ & QUESTION (READ-ONLY AUDIT)

**Dự án:** TMDEMY E-Learning Backend  
**Phase:** Phase 4 — Quiz & Question Migration  
**Loại báo cáo:** Read-Only Technical Audit & Database Verification  
**Thời gian thực hiện:** 04/10/2026  
**Trạng thái tổng thể:** **VERIFIED — FULLY MIGRATED TO PRISMA (PHASE 4 SCOPE)**

---

## 1. MỤC TIÊU & PHẠM VI KIỂM TRA

Xác minh độc lập toàn diện xem Phase 4 đã hoàn tất việc chuyển đổi toàn bộ luồng quản lý Quiz và Question từ cơ sở dữ liệu MongoDB/Mongoose sang PostgreSQL/Prisma hay chưa theo đúng các nguyên tắc bất khả xâm phạm tại `AGENTS.md` và `tmdemy-rules.md`.

### Tiêu chí phân loại:
1. **FULLY MIGRATED TO PRISMA**: Toàn bộ luồng mã nguồn, truy vấn dữ liệu, validation và lưu trữ đã chuyển đổi sang Prisma ORM và cơ sở dữ liệu PostgreSQL.
2. **LEGACY MONGOOSE DEPENDENCY (PLANNED)**: Các module/file Mongoose phụ thuộc được bảo toàn có chủ đích phục vụ cho các Phase sau (Phase 5, Phase 7) theo lộ trình chuyển đổi cuốn chiếu.
3. **NOT MIGRATED**: Các thành phần thuộc phạm vi Phase 4 nhưng vẫn còn sót truy vấn Mongoose (nếu có).
4. **NOT VERIFIED**: Các hạng mục chưa được kiểm chứng thực tế (nếu có).

---

## 2. KIỂM TRA SERVICE LAYER

### 2.1. `src/services/quiz.service.ts`
* **Đường dẫn file:** [`src/services/quiz.service.ts`](file:///d:/e-learning_server/src/services/quiz.service.ts)
* **Kết quả audit:**
  * **Zero Mongoose Imports:** Hoàn toàn không import `mongoose`, `QuizModel`, `QuestionModel`, hay bất kỳ legacy model nào.
  * **Zero Mongoose Queries:** Không tồn tại bất kỳ lời gọi nào tới `QuizModel.find()`, `QuizModel.findOne()`, `QuizModel.findById()`, `QuizModel.create()`, `QuizModel.findByIdAndUpdate()`, `QuizModel.findByIdAndDelete()`.
  * **Functional Repositories:** Toàn bộ truy vấn đọc/ghi đều thông qua các Functional Repository:
    * `findQuizById`, `findQuizByLessonId`, `findQuizByLessonIdWithPublicQuestions`, `createQuiz`, `updateQuiz`, `deleteQuiz` từ [`src/repositories/quiz.repository.ts`](file:///d:/e-learning_server/src/repositories/quiz.repository.ts).
    * `deleteQuestionsByQuizId` từ [`src/repositories/question.repository.ts`](file:///d:/e-learning_server/src/repositories/question.repository.ts).
    * `findLessonById` từ [`src/repositories/lesson.repository.ts`](file:///d:/e-learning_server/src/repositories/lesson.repository.ts).
    * `findCourseById` từ [`src/repositories/course.repository.ts`](file:///d:/e-learning_server/src/repositories/course.repository.ts).
  * **Transaction Client Support:** Tất cả các exported functions (`createQuizService`, `updateQuizService`, `deleteQuizService`, `getQuizzesByLessonService`) đều hỗ trợ tham số `tx?: PrismaTransactionClient`.
* **Phân loại:** **FULLY MIGRATED TO PRISMA**

### 2.2. `src/services/question.service.ts`
* **Đường dẫn file:** [`src/services/question.service.ts`](file:///d:/e-learning_server/src/services/question.service.ts)
* **Kết quả audit:**
  * **Zero Mongoose Imports:** Hoàn toàn không import Mongoose.
  * **Zero Mongoose Queries:** Không tồn tại bất kỳ thao tác CRUD Mongoose nào (`QuestionModel.find()`, `create()`, `findById()`, `updateOne()`, `delete()`, ...).
  * **Functional Repositories:** Toàn bộ truy vấn đọc/ghi thông qua:
    * `findQuestionById`, `createQuestion`, `updateQuestion`, `deleteQuestion` từ [`src/repositories/question.repository.ts`](file:///d:/e-learning_server/src/repositories/question.repository.ts).
    * `findQuizById` từ [`src/repositories/quiz.repository.ts`](file:///d:/e-learning_server/src/repositories/quiz.repository.ts).
    * `findLessonById` từ [`src/repositories/lesson.repository.ts`](file:///d:/e-learning_server/src/repositories/lesson.repository.ts).
    * `findCourseById` từ [`src/repositories/course.repository.ts`](file:///d:/e-learning_server/src/repositories/course.repository.ts).
  * **Transaction Client Support:** Toàn bộ exported functions đều hỗ trợ `tx?: PrismaTransactionClient`.
* **Phân loại:** **FULLY MIGRATED TO PRISMA**

---

## 3. KIỂM TRA REPOSITORY LAYER

### 3.1. `src/repositories/quiz.repository.ts`
* **Đường dẫn file:** [`src/repositories/quiz.repository.ts`](file:///d:/e-learning_server/src/repositories/quiz.repository.ts)
* **Kiến trúc:** Functional Repository thuần túy (async functions độc lập, không class, không generic BaseRepository, không `this`).
* **Prisma Client Singleton:** Sử dụng `prisma` từ [`src/config/prisma.ts`](file:///d:/e-learning_server/src/config/prisma.ts) hoặc `tx` khi nằm trong transaction.
* **Chi tiết thao tác PostgreSQL:**
  * `findQuizById`: `client.quiz.findUnique({ where: { id } })`
  * `findQuizByIdWithPublicQuestions`: Anti-Cheat projection (loại bỏ trường `answer`).
  * `findQuizByIdWithDetail`: Authorized projection đầy đủ câu hỏi và đáp án cho Teacher/Admin.
  * `findQuizByLessonId`: Truy vấn theo unique index `lessonId`.
  * `findQuizByLessonIdWithPublicQuestions`: Truy vấn Quiz kèm public Questions theo `lessonId`.
  * `findQuizzesByCourseId` & `findQuizzesByCourseIdWithPublicQuestions`: Truy vấn danh sách quiz theo khóa học.
  * `createQuiz`: `client.quiz.create({ data })`
  * `updateQuiz`: `client.quiz.update({ where: { id }, data })`
  * `deleteQuiz`: `client.quiz.delete({ where: { id } })`
* **Phân loại:** **FULLY MIGRATED TO PRISMA**

### 3.2. `src/repositories/question.repository.ts`
* **Đường dẫn file:** [`src/repositories/question.repository.ts`](file:///d:/e-learning_server/src/repositories/question.repository.ts)
* **Kiến trúc:** Functional Repository thuần túy, transaction-safe.
* **Quản lý QuestionOption trong PostgreSQL:**
  * QuestionOption không còn là mảng string nhúng (embedded array) của MongoDB, mà được lưu thành các bản ghi độc lập trên bảng vật lý `question_options` trong PostgreSQL (`QuestionOption` model trong `prisma/schema.prisma`).
  * Khi tạo câu hỏi (`createQuestion`): Sử dụng Prisma nested write:
    ```typescript
    options: rawOptions.length > 0
      ? {
          create: rawOptions.map((optText, index) => ({
            optionText: optText,
            order: index
          }))
        }
      : undefined
    ```
  * Khi cập nhật câu hỏi (`updateQuestion`): Xử lý chuẩn nguyên tử qua `prisma.$transaction`:
    * Xóa options cũ: `client.questionOption.deleteMany({ where: { questionId: id } })`.
    * Thêm options mới kèm thứ tự index: `client.questionOption.createMany(...)`.
    * Cập nhật bản ghi `Question` và trả về kết quả kèm options được sắp xếp theo `order: 'asc'`.
  * Khi xóa câu hỏi (`deleteQuestion`): Tận dụng cơ chế `onDelete: Cascade` tại PostgreSQL Foreign Key constraint giữa `questions` và `question_options`.
* **Phân loại:** **FULLY MIGRATED TO PRISMA**

---

## 4. KIỂM TRA LUỒNG API (END-TO-END FLOW TRACE)

Toàn bộ 7 API endpoints thuộc Phase 4 đều tuân thủ kiến trúc phân tầng đơn hướng bắt buộc:
```text
Client HTTP Request
  └── Router (src/routes/)
        └── Middleware & Validator (src/middlewares/)
              └── Controller (src/controller/)
                    └── Service (src/services/)
                          └── Functional Repository (src/repositories/)
                                └── Prisma Client Singleton (src/config/prisma.ts)
                                      └── PostgreSQL Database
```

### Trace chi tiết 7 luồng API:

#### 1. `POST /api/quiz` (Tạo Quiz mới)
* **Router:** [`src/routes/quiz.route.ts`](file:///d:/e-learning_server/src/routes/quiz.route.ts)
* **Middleware Chain:** `verifyAccessToken` $\rightarrow$ `isTeacherOrAdmin` $\rightarrow$ `createQuizValidator` (validate UUID cho `lesson` và `courseId`) $\rightarrow$ `handleValidationErrors`
* **Controller:** `createQuizController` tại [`src/controller/quiz.controller.ts`](file:///d:/e-learning_server/src/controller/quiz.controller.ts)
* **Service:** `createQuizService` tại [`src/services/quiz.service.ts`](file:///d:/e-learning_server/src/services/quiz.service.ts) (kiểm tra tồn tại Lesson, Course, quyền sở hữu Teacher, ràng buộc 1-1 Lesson-Quiz)
* **Repository:** `createQuiz` tại [`src/repositories/quiz.repository.ts`](file:///d:/e-learning_server/src/repositories/quiz.repository.ts)
* **Prisma & DB:** `prisma.quiz.create()` trên bảng `quizzes` PostgreSQL

#### 2. `PUT /api/quiz/:quizId` (Cập nhật Quiz)
* **Router:** [`src/routes/quiz.route.ts`](file:///d:/e-learning_server/src/routes/quiz.route.ts)
* **Middleware Chain:** `verifyAccessToken` $\rightarrow$ `isTeacherOrAdmin` $\rightarrow$ `updateQuizValidator` (validate UUID `quizId`) $\rightarrow$ `handleValidationErrors`
* **Controller:** `updateQuizController`
* **Service:** `updateQuizService` (kiểm tra quizId, chuỗi ownership `Quiz -> Lesson -> Course -> Author`)
* **Repository:** `updateQuiz` tại [`src/repositories/quiz.repository.ts`](file:///d:/e-learning_server/src/repositories/quiz.repository.ts)
* **Prisma & DB:** `prisma.quiz.update({ where: { id: quizId } })` trên bảng `quizzes` PostgreSQL

#### 3. `DELETE /api/quiz/:quizId` (Xóa Quiz)
* **Router:** [`src/routes/quiz.route.ts`](file:///d:/e-learning_server/src/routes/quiz.route.ts)
* **Middleware Chain:** `verifyAccessToken` $\rightarrow$ `isTeacherOrAdmin` $\rightarrow$ `quizIdValidator` $\rightarrow$ `handleValidationErrors`
* **Controller:** `deleteQuizController`
* **Service:** `deleteQuizService` (kiểm tra quyền Teacher sở hữu Course)
* **Repository:** `deleteQuestionsByQuizId` và `deleteQuiz`
* **Prisma & DB:** `prisma.question.deleteMany()` và `prisma.quiz.delete()` trên bảng `questions` và `quizzes`

#### 4. `GET /api/quiz/lesson/:lessonId` (Lấy Quiz theo Lesson cho học viên)
* **Router:** [`src/routes/quiz.route.ts`](file:///d:/e-learning_server/src/routes/quiz.route.ts)
* **Middleware Chain:** `lessonIdValidator` (validate UUID `lessonId`) $\rightarrow$ `handleValidationErrors`
* **Controller:** `getQuizzesByLessonController`
* **Service:** `getQuizzesByLessonService` (Anti-Cheat: bảo đảm loại bỏ hoàn toàn trường `answer`)
* **Repository:** `findQuizByLessonIdWithPublicQuestions` tại [`src/repositories/quiz.repository.ts`](file:///d:/e-learning_server/src/repositories/quiz.repository.ts)
* **Prisma & DB:** `prisma.quiz.findUnique()` kèm nested `questions.select` không bao gồm `answer` trên PostgreSQL

#### 5. `POST /api/questions` (Tạo Question mới)
* **Router:** [`src/routes/question.route.ts`](file:///d:/e-learning_server/src/routes/question.route.ts)
* **Middleware Chain:** `verifyAccessToken` $\rightarrow$ `isTeacherOrAdmin` $\rightarrow$ `createQuestionValidator` (validate UUID `quiz`, enum `type`, `title`, `answer`, `options`) $\rightarrow$ `handleValidationErrors`
* **Controller:** `createQuestionController` tại [`src/controller/question.controller.ts`](file:///d:/e-learning_server/src/controller/question.controller.ts)
* **Service:** `createQuestionService` tại [`src/services/question.service.ts`](file:///d:/e-learning_server/src/services/question.service.ts) (xác minh Quiz, Lesson, Course và Teacher ownership)
* **Repository:** `createQuestion` tại [`src/repositories/question.repository.ts`](file:///d:/e-learning_server/src/repositories/question.repository.ts)
* **Prisma & DB:** `prisma.question.create()` với nested `options.create` trên các bảng `questions` và `question_options`

#### 6. `PUT /api/questions/:questionId` (Cập nhật Question)
* **Router:** [`src/routes/question.route.ts`](file:///d:/e-learning_server/src/routes/question.route.ts)
* **Middleware Chain:** `verifyAccessToken` $\rightarrow$ `isTeacherOrAdmin` $\rightarrow$ `updateQuestionValidator` (validate UUID `questionId`) $\rightarrow$ `handleValidationErrors`
* **Controller:** `updateQuestionController`
* **Service:** `updateQuestionService` (kiểm tra Question, Quiz và chuỗi ownership)
* **Repository:** `updateQuestion` tại [`src/repositories/question.repository.ts`](file:///d:/e-learning_server/src/repositories/question.repository.ts)
* **Prisma & DB:** `prisma.$transaction()` thực hiện `deleteMany`, `createMany` trên `question_options` và `update` trên `questions`

#### 7. `DELETE /api/questions/:questionId` (Xóa Question)
* **Router:** [`src/routes/question.route.ts`](file:///d:/e-learning_server/src/routes/question.route.ts)
* **Middleware Chain:** `verifyAccessToken` $\rightarrow$ `isTeacherOrAdmin` $\rightarrow$ `questionIdValidator` $\rightarrow$ `handleValidationErrors`
* **Controller:** `deleteQuestionController`
* **Service:** `deleteQuestionService` (kiểm tra chuỗi sở hữu)
* **Repository:** `deleteQuestion` tại [`src/repositories/question.repository.ts`](file:///d:/e-learning_server/src/repositories/question.repository.ts)
* **Prisma & DB:** `prisma.question.delete()` (PostgreSQL FK CASCADE tự động dọn dẹp các `question_options` con)

---

## 5. KIỂM TRA LEGACY DEPENDENCIES (TRANSITIONAL ISOLATION AUDIT)

Theo nguyên tắc bất khả xâm phạm tại `AGENTS.md` (Mục A.3 & B.7), kiến trúc chuyển dịch cơ sở dữ liệu kép (Transitional Dual-Stack Architecture) yêu cầu giữ nguyên vẹn MongoDB/Mongoose cho các module chưa đến lượt migration:

| File / Component | Sử dụng Mongoose Dependency | Thuộc phạm vi Phase | Trạng thái & Kết luận |
| :--- | :--- | :---: | :--- |
| `src/services/quizSubmission.service.ts` | `QuizModel`, `QuestionModel`, `QuizSubmissionModel`, `EnrollmentModel`, `LessonModel`, `UserModel` | **Phase 5** (Quiz Submission & Evaluation) | **LEGACY MONGOOSE DEPENDENCY (PLANNED)**<br>Giữ nguyên có chủ đích. Tuyệt đối không can thiệp trong Phase 4. |
| `src/services/certificate.service.ts` | `QuizModel.find({ courseId })`, `CertificateModel`, `EnrollmentModel`, `QuizSubmissionModel` | **Phase 7** (Progress, Certificate, Favorite & Rating) | **LEGACY MONGOOSE DEPENDENCY (PLANNED)**<br>Giữ nguyên có chủ đích. Tuyệt đối không can thiệp trong Phase 4. |
| `src/models/legacy/quiz.legacy.model.ts` | Mongoose Model `Quiz` (`Schema.Types.ObjectId`) | Phục vụ Phase 5 & Phase 7 | **LEGACY MONGOOSE DEPENDENCY (PLANNED)**<br>Đã cách ly an toàn vào thư mục `legacy/`. Giữ nguyên cho tới Phase 11. |
| `src/models/legacy/question.legacy.model.ts` | Mongoose Model `Question` (`Schema.Types.ObjectId`) | Phục vụ Phase 5 | **LEGACY MONGOOSE DEPENDENCY (PLANNED)**<br>Đã cách ly an toàn vào thư mục `legacy/`. Giữ nguyên cho tới Phase 11. |

---

## 6. KIỂM TRA DATABASE POSTGRESQL (READ-ONLY AUDIT)

Đã thực hiện script kiểm tra read-only trực tiếp trên cơ sở dữ liệu PostgreSQL (`tmdemy`).

### 6.1. Thống kê số lượng bản ghi thực tế (Record Counts)
* **Bảng `quizzes`:** **4** records
* **Bảng `questions`:** **6** records
* **Bảng `question_options`:** **24** records

### 6.2. Kiểm tra Ràng buộc duy nhất (Unique Constraints)
* **Ràng buộc `quizzes.lesson_id` UNIQUE:**
  * Truy vấn: `SELECT lesson_id, count(*) FROM quizzes GROUP BY lesson_id HAVING count(*) > 1`
  * Kết quả: **0 duplicate records** $\rightarrow$ Ràng buộc 1-1 giữa Lesson và Quiz được đảm bảo 100%.

### 6.3. Kiểm tra Tính toàn vẹn Khóa ngoại (Foreign Key Integrity)
* **`quizzes.lesson_id -> lessons.id`:** **0 orphan records** (Mọi quiz đều liên kết với bài học hợp lệ).
* **`quizzes.course_id -> courses.id`:** **0 orphan records** (Mọi quiz đều liên kết với khóa học hợp lệ).
* **`quizzes.created_by_id -> users.id`:** **0 orphan records** (Mọi quiz đều liên kết với tác giả/người tạo hợp lệ).
* **`questions.quiz_id -> quizzes.id`:** **0 orphan records** (Mọi question đều liên kết với quiz cha hợp lệ).
* **`question_options.question_id -> questions.id`:** **0 orphan records** (Mọi question option đều liên kết với question cha hợp lệ).

### 6.4. Kiểm tra Quan hệ & Tính toàn vẹn Dữ liệu Options (Data Integrity)
* **Thứ tự của `question_options`:**
  * Truy vấn kiểm tra trùng lặp thứ tự: `SELECT question_id, "order", count(*) FROM question_options GROUP BY question_id, "order" HAVING count(*) > 1`
  * Kết quả: **0 duplicate pairs** $\rightarrow$ Các option luôn duy trì thứ tự `order: 0, 1, 2, 3...` chuẩn xác.
* **Quan hệ cha - con giữa Quiz, Question và QuestionOption:**
  * 100% các câu hỏi thuộc 4 Quizzes trên PostgreSQL đều tải đầy đủ danh sách options thông qua Prisma relations.

---

## 7. BẢNG PHÂN LOẠI TỔNG HỢP (FINAL CLASSIFICATION MATRIX)

| Thành phần kiểm tra | File / Resource | Phân loại | Ghi chú kỹ thuật |
| :--- | :--- | :---: | :--- |
| **Quiz Service** | `src/services/quiz.service.ts` | **FULLY MIGRATED TO PRISMA** | 100% Functional Repositories, no Mongoose |
| **Question Service** | `src/services/question.service.ts` | **FULLY MIGRATED TO PRISMA** | 100% Functional Repositories, no Mongoose |
| **Quiz Repository** | `src/repositories/quiz.repository.ts` | **FULLY MIGRATED TO PRISMA** | Pure functional, transaction client, Anti-Cheat select |
| **Question Repository** | `src/repositories/question.repository.ts` | **FULLY MIGRATED TO PRISMA** | Multi-table atomic transaction for `QuestionOption` |
| **Quiz Routes & Middleware** | `src/routes/quiz.route.ts`, `src/middlewares/quiz.middleware.ts` | **FULLY MIGRATED TO PRISMA** | Express Validator + UUID RFC 4122 check |
| **Question Routes & Middleware** | `src/routes/question.route.ts`, `src/middlewares/question.middleware.ts` | **FULLY MIGRATED TO PRISMA** | Express Validator + UUID RFC 4122 check |
| **Quiz Controllers** | `src/controller/quiz.controller.ts` | **FULLY MIGRATED TO PRISMA** | Clean delegation to services |
| **Question Controllers** | `src/controller/question.controller.ts` | **FULLY MIGRATED TO PRISMA** | Clean delegation to services |
| **PostgreSQL Database Tables** | `quizzes`, `questions`, `question_options` | **FULLY MIGRATED TO PRISMA** | 4 quizzes, 6 questions, 24 options, 0 orphan FKs |
| **Quiz Submission Service** | `src/services/quizSubmission.service.ts` | **LEGACY MONGOOSE DEPENDENCY (PLANNED)** | Dành riêng cho **Phase 5** |
| **Certificate Service** | `src/services/certificate.service.ts` | **LEGACY MONGOOSE DEPENDENCY (PLANNED)** | Dành riêng cho **Phase 7** |
| **Legacy Quiz Model** | `src/models/legacy/quiz.legacy.model.ts` | **LEGACY MONGOOSE DEPENDENCY (PLANNED)** | Phục vụ Phase 5 & Phase 7 |
| **Legacy Question Model** | `src/models/legacy/question.legacy.model.ts` | **LEGACY MONGOOSE DEPENDENCY (PLANNED)** | Phục vụ Phase 5 |

---

## 8. STOP CONDITION & KẾT LUẬN

1. **Tuân thủ Stop Condition:**
   * Không sửa mã nguồn ứng dụng (Zero code changes).
   * Không sửa Prisma Schema (Zero schema changes).
   * Không thay đổi dữ liệu cơ sở dữ liệu (Zero database mutations, 100% Read-Only audit).
   * Không thực hiện bất kỳ công việc nào của Phase 5.
2. **Trạng thái Phase 4:**
   * Toàn bộ phạm vi Phase 4 (Quiz & Question Management) đã được di chuyển thành công 100% sang PostgreSQL/Prisma.
   * Các phụ thuộc Mongoose còn lại được định vị chính xác và bảo toàn có chủ đích cho Phase 5 và Phase 7.
3. **Bước tiếp theo:**
   * Dừng công việc và bàn giao báo cáo này cho **Project Owner** xem xét, nghiệm thu Phase 4 trước khi tiến hành Phase 5.
