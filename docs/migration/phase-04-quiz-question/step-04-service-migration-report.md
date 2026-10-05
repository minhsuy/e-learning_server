# PHASE 4 — STEP 4: SERVICE MIGRATION REPORT
## MODULE: QUIZ & QUESTION SERVICE MIGRATION

**Dự án:** TMDEMY E-Learning Backend  
**Phase:** Phase 4 — Quiz & Question Migration  
**Step:** Step 4 — Service Migration  
**Thời gian thực hiện:** 03/10/2026  
**Trạng thái:** COMPLETED (READY FOR PROJECT OWNER REVIEW & STEP 5 PREPARATION)

---

## 1. EXECUTIVE SUMMARY

Trong **Step 4: Service Migration**, toàn bộ Business Logic và database operations tại hai Service cốt lõi của Phase 4:
1. `src/services/quiz.service.ts`
2. `src/services/question.service.ts`

đã được tái cấu trúc thành công từ việc truy vấn trực tiếp Mongoose sang việc ủy quyền hoàn toàn cho **Functional Repositories** (`quiz.repository.ts`, `question.repository.ts`, `lesson.repository.ts`, `course.repository.ts`) tương tác với PostgreSQL qua Prisma Client Singleton.

### Kết quả nổi bật:
* **Zero Direct Database Query trong Service**: Không còn bất kỳ query Mongoose hay Prisma trực tiếp nào trong Service layer.
* **100% Pure Functional Architecture**: Tất cả functions đều là exported async functions độc lập, không class, không generic abstraction, hỗ trợ tùy chọn tham số `tx?: PrismaTransactionClient`.
* **API Contract Freeze & Field Compatibility**: Tự động ánh xạ hai chiều giữa camelCase của Prisma (`lessonId`, `courseId`, `passingGrade`, `createdById`) và snake_case/legacy format của API (`lesson`, `passing_grade`, `courseId`, `created_by`, `_id`).
* **Bảo vệ ranh giới bảo mật (Anti-Cheat & Security)**: Trường `answer` trong Question tuyệt đối không bị rò rỉ trong các API lấy quiz dành cho học viên (`getQuizzesByLessonService`), đồng thời mảng các phương án lựa chọn được chuẩn hóa từ PostgreSQL table `QuestionOption` về dạng mảng chuỗi `options: string[]`.
* **Zero Database Mutation**: Kiểm thử toàn diện 43/43 kịch bản service với cơ chế rollback transaction, số lượng bản ghi thực tế trong PostgreSQL được bảo toàn tuyệt đối (3 quizzes, 5 questions, 20 question options).
* **Cô lập Phase nghiêm ngặt**: Không chỉnh sửa Controller, Middleware, Express Validator, Routes (dành cho Step 5); tuyệt đối không chạm vào `quizSubmission.service.ts` (Phase 5) và `certificate.service.ts` (Phase 7).

---

## 2. FILES CHANGED

| Đường dẫn file | Thao tác | Mô tả |
| :--- | :--- | :--- |
| `src/services/quiz.service.ts` | **Modified** | Chuyển đổi toàn bộ logic CRUD Quiz sang Functional Repositories, ánh xạ field `_id`, `lesson`, `passing_grade`, kiểm tra quyền tác giả khóa học. |
| `src/services/question.service.ts` | **Modified** | Chuyển đổi logic CRUD Question sang Functional Repositories, chuẩn hóa enum types, options string[], atomic options update. |
| `scripts/migration-utils/step-04-phase4-services.test.ts` | **Created** | Bộ test suite 43 kiểm thử chuyên sâu cho Service Layer (Read, Mutation, Security, Error cases, Rollback). |
| `scripts/migration-utils/step-02-phase4-zod-models.test.ts` | **Modified** | Cập nhật assertions 4.5 & 4.6 để xác nhận hai Service đã gỡ bỏ hoàn toàn legacy Mongoose models và tích hợp Repositories. |
| `docs/migration/phase-04-quiz-question/step-04-service-migration-report.md` | **Created** | Báo cáo chi tiết Step 4 phục vụ Project Owner nghiệm thu. |

---

## 3. QUIZ SERVICE MIGRATION DETAILS

### 3.1. Các thao tác Mongoose đã được loại bỏ hoàn toàn
* `QuizModel.findOne({ lesson: lessonId }).populate({ path: 'questions', ... })` $\rightarrow$ Thay bằng `findQuizByLessonIdWithPublicQuestions(lessonId, tx)` (dùng cho student, loại trừ `answer`).
* `QuizModel.findOne({ lesson: lessonId })` $\rightarrow$ Thay bằng `findQuizByLessonId(lessonId, tx)`.
* `QuizModel.findById(id)` $\rightarrow$ Thay bằng `findQuizById(id, tx)`.
* `LessonModel.findById(lessonId)` $\rightarrow$ Thay bằng `findLessonById(lessonId, tx)`.
* `CourseModel.findById(courseId)` $\rightarrow$ Thay bằng `findCourseById(courseId, tx)`.
* `QuizModel.create({ ... })` $\rightarrow$ Thay bằng `createQuiz({ ... }, tx)`.
* `QuizModel.findByIdAndUpdate(id, { ... }, { new: true })` $\rightarrow$ Thay bằng `updateQuiz(id, { ... }, tx)`.
* `QuizModel.findByIdAndDelete(id)` & `QuestionModel.deleteMany({ quiz: id })` $\rightarrow$ Thay bằng `deleteQuestionsByQuizId(id, tx)` kết hợp `deleteQuiz(id, tx)`.

### 3.2. Bảo toàn Business Logic
1. **Kiểm tra tồn tại Lesson**: Trước khi tạo Quiz, kiểm tra xem `lessonId` có tồn tại trong hệ thống hay không bằng `findLessonById()`. Nếu không tìm thấy, trả về lỗi 404: `"Lesson not found"`.
2. **Kiểm tra quyền sở hữu khóa học (Teacher Ownership Check)**: Lấy `courseId` từ Lesson, truy vấn `findCourseById(course.id)`. Nếu `currentUser.role !== 'ADMIN'` và `course.authorId !== currentUser.id`, từ chối thao tác và trả về lỗi 403: `"You do not have permission to create a quiz for this course"`.
3. **Quy tắc 1 Lesson - 1 Quiz (Unique Lesson Constraint)**: Trước khi tạo, kiểm tra `findQuizByLessonId(lessonId)`. Nếu bài học đã có bài kiểm tra, trả về lỗi 400: `"Quiz for this lesson already exists"`.
4. **Logic Cập nhật Quiz**:
   * Kiểm tra Quiz có tồn tại qua `findQuizById(id)`.
   * Lấy Course tương ứng qua `findCourseById(quiz.courseId)`.
   * Kiểm tra quyền sở hữu (`ADMIN` hoặc tác giả khóa học).
   * Chỉ cho phép cập nhật các scalar fields: `title`, `description`, `duration`, `passingGrade`.
5. **Logic Xóa Quiz**:
   * Kiểm tra Quiz và quyền tác giả.
   * Xóa toàn bộ Questions trực thuộc trước (`deleteQuestionsByQuizId`) nhằm bảo đảm tính toàn vẹn dữ liệu, sau đó thực hiện xóa Quiz (`deleteQuiz`).

### 3.3. Field Mapping & Serialization Format
Hàm tiện ích `formatSafeQuiz` đảm bảo serialization tương thích 100% với Frontend hiện tại:
* `id` $\rightarrow$ đồng thời cung cấp `_id` thông qua `withCompatId`.
* `lessonId` $\rightarrow$ ánh xạ sang `lesson`.
* `courseId` $\rightarrow$ giữ nguyên `courseId`.
* `passingGrade` $\rightarrow$ ánh xạ sang `passing_grade`.
* `createdById` $\rightarrow$ ánh xạ sang `created_by`.
* Response từ `getQuizzesByLessonService` trả về mảng `data: [formattedQuiz]` để khớp đúng với định dạng API legacy.

---

## 4. QUESTION SERVICE MIGRATION DETAILS

### 4.1. Các thao tác Mongoose đã được loại bỏ hoàn toàn
* `QuestionModel.findById(id)` $\rightarrow$ Thay bằng `findQuestionById(id, tx)`.
* `QuizModel.findById(quizId)` $\rightarrow$ Thay bằng `findQuizById(quizId, tx)`.
* `QuestionModel.create({ ... })` $\rightarrow$ Thay bằng `createQuestion({ ... }, tx)` trong `question.repository.ts`.
* `QuestionModel.findByIdAndUpdate(id, updateData, { new: true })` $\rightarrow$ Thay bằng `updateQuestion(id, updateData, tx)`.
* `QuestionModel.findByIdAndDelete(id)` $\rightarrow$ Thay bằng `deleteQuestion(id, tx)`.

### 4.2. Question Options Mapping & Cập nhật Atomicity
Trong MongoDB cũ, `options` là mảng chuỗi trực tiếp: `["A", "B", "C", "D"]`.  
Trong PostgreSQL mới, các phương án được lưu trữ trong bảng `QuestionOption` với các cột `optionText` và `order`.

**Hành vi cập nhật 3 trường hợp được bảo toàn tuyệt đối:**
1. `options === undefined`: Giữ nguyên toàn bộ options hiện có trong database, không thực hiện thay đổi nào trên quan hệ options.
2. `options === []`: Xóa sạch toàn bộ bản ghi `QuestionOption` liên kết với câu hỏi này.
3. `options: string[]` có phần tử: Xóa toàn bộ options cũ và tạo mới danh sách options với thứ tự `order` từ `0` đến `n - 1` một cách nguyên tử (atomic transaction).

### 4.3. Question Type Mapping
Ánh xạ hai chiều giữa API Contract (lowercase) và Prisma Schema (uppercase enum):
* Khi nhận vào: `multiple_choice` $\rightarrow$ `QuestionType.MULTIPLE_CHOICE`, `fill_in_blank` $\rightarrow$ `QuestionType.FILL_IN_BLANK`.
* Khi trả ra API: `MULTIPLE_CHOICE` $\rightarrow$ `"multiple_choice"`, `FILL_IN_BLANK` $\rightarrow$ `"fill_in_blank"`.

### 4.4. Định dạng Options trả về
Sử dụng `formatQuestionOptions()` của repository để chuyển đổi `QuestionOption[]` sang `string[]`, bảo đảm client nhận `options: ["A", "B", ...]` thay vì danh sách object quan hệ.

---

## 5. ZOD APPLICATION MODEL INTEGRATION

Hệ thống đã tích hợp các Zod Models đã định nghĩa tại Step 2 vào Service layer:

### 5.1. Các Schema được tích hợp
* `createQuizInputSchema` & `updateQuizInputSchema`: Xác thực các trường đầu vào cho nghiệp vụ Quiz.
* `createQuestionInputSchema` & `updateQuestionInputSchema`: Xác thực cấu trúc đầu vào của Question và danh sách options.
* `questionTypeSchema`: Chuẩn hóa enum loại câu hỏi từ client hoặc database.
* `quizPublicSchema` & `questionPublicSchema`: Bảo đảm cấu trúc dữ liệu công khai trả về cho học viên không chứa trường nhạy cảm.

### 5.2. Boundary sử dụng
* **Input Boundary**: Dữ liệu từ Controller được validate và map sang input domain types trước khi chuyển tới Functional Repositories.
* **Context Protection Boundary**: `createdById` luôn được gán từ `currentUser.id` đã được xác thực (JWT), không tin tưởng `createdById` gửi từ client body.
* **Output Boundary**: Dữ liệu trả về từ Repository được map thông qua `formatSafeQuiz` và `formatSafeQuestion` để đảm bảo tương thích API Contract.

---

## 6. SECURITY & ANTI-CHEAT AUDIT (ANSWER FIELD)

Bảo mật bài kiểm tra là một trong những yêu cầu nghiêm ngặt nhất của Phase 4.

| Luồng / API | Repository Function | Chứa field `answer`? | Đối tượng phục vụ |
| :--- | :--- | :--- | :--- |
| `getQuizzesByLessonService` | `findQuizByLessonIdWithPublicQuestions` | ❌ **KHÔNG** (Tuyệt đối loại trừ) | Học viên / Student |
| `createQuestionService` | `createQuestion` | ✅ Có (Chỉ cho phép Giáo viên/Admin) | Giáo viên / Admin |
| `updateQuestionService` | `updateQuestion` | ✅ Có (Chỉ cho phép Giáo viên/Admin) | Giáo viên / Admin |

**Xác minh thực tế qua Test Suite:**
* Test `SECURITY: getQuizzesByLessonService strictly does NOT leak 'answer' in any question` đã chạy và kiểm tra 100% câu hỏi trả về từ `getQuizzesByLessonService`. Không có bất kỳ câu hỏi nào để lộ trường `answer`.

---

## 7. LEGACY COMPATIBILITY & CROSS-PHASE BOUNDARIES

### 7.1. Phụ thuộc của các module chưa migrate
* `src/services/quizSubmission.service.ts`: Vẫn đang kết nối và truy vấn MongoDB thông qua `src/models/legacy/quiz.legacy.model.ts` và `src/models/legacy/question.legacy.model.ts`. File này **HOÀN TOÀN KHÔNG BỊ CHỈNH SỬA** trong Step 4.
* `src/services/certificate.service.ts`: Tiếp tục sử dụng `QuizModel` từ legacy model. File này **HOÀN TOÀN KHÔNG BỊ CHỈNH SỬA** trong Step 4.

### 7.2. Kế hoạch chuyển tiếp cho Phase 5 (Quiz Submission & Evaluation)
Trong Phase 5, module QuizSubmission sẽ được migrate sang PostgreSQL:
* Các câu hỏi và bài thi sẽ được tra cứu từ `quiz.repository.ts` và `question.repository.ts` thay cho Legacy Mongoose Models.
* Đáp án của câu hỏi phục vụ việc chấm điểm học viên sẽ sử dụng projection study (`findQuestionsByQuizIdStudy`).

---

## 8. TESTING & REGRESSION AUDIT RESULTS

### 8.1. Prisma Schema Validation
```bash
cmd /c npx prisma validate
```
* **Kết quả**: `The schema at prisma\schema.prisma is valid 🚀` (Exit Code 0).

### 8.2. TypeScript Strict Check
```bash
cmd /c npx tsc --noEmit
```
* **Kết quả**:
  * Các file thuộc Step 4 (`src/services/quiz.service.ts`, `src/services/question.service.ts`, `src/repositories/quiz.repository.ts`, `src/repositories/question.repository.ts`): **0 LỖI (0 type errors)**.
  * Các lỗi còn lại: Là các lỗi baseline cố hữu ở các Controller chưa migrate (Express `req.params.id` type mismatch `string | string[]`) sẽ được hoàn thiện tại Step 5.

### 8.3. Step 2 Zod Models Regression Test
```bash
cmd /c npx tsx scripts/migration-utils/step-02-phase4-zod-models.test.ts
```
* **Kết quả**: **44/44 tests PASS** (Exit Code 0).

### 8.4. Step 3 Functional Repositories Regression Test
```bash
cmd /c npx tsx scripts/migration-utils/step-03-phase4-repositories.test.ts
```
* **Kết quả**: **40/40 tests PASS** (Exit Code 0). Zero database mutations committed.

### 8.5. Step 4 Migrated Services Test Suite
```bash
cmd /c npx tsx scripts/migration-utils/step-04-phase4-services.test.ts
```
* **Kết quả**: **43/43 tests PASS** (Exit Code 0).
* **Phân bổ chi tiết 43 tests**:
  1. *Architecture & Code Purity (6 tests)*: Xác nhận không import Mongoose, không import legacy models, ủy quyền hoàn toàn cho repositories.
  2. *Read Operations & Anti-Cheat (10 tests)*: Kiểm tra lấy quiz theo lesson, kiểm tra cấu trúc mảng, field mapping (`passing_grade`, `lesson`, `_id`), kiểm tra 100% không rò rỉ `answer`.
  3. *Mutation Operations & Business Logic (24 tests)*:
     * Quiz: 404 lesson not found, 403 teacher unauthorized, 200 owner success, 400 duplicate lesson, 403 update unauthorized, 200 update success, delete cascade.
     * Question: 404 quiz not found, create MCQ with options, options string[] mapping, options === undefined preserve, options replacement, options === [] delete, delete question.
  4. *Zero-Mutation Post-Test Verification (3 tests)*:
     * `quizzes`: 3 $\rightarrow$ 3 (không đổi).
     * `questions`: 5 $\rightarrow$ 5 (không đổi).
     * `question_options`: 20 $\rightarrow$ 20 (không đổi).

---

## 9. KNOWN ISSUES & BASELINE DOCUMENTATION

1. **Controller Layer Type Mismatches (Baseline)**:  
   `src/controller/quiz.controller.ts` và `src/controller/question.controller.ts` hiện vẫn đang nhận `req.params.id` dạng `string | string[]` từ Express types và chưa tích hợp với UUID validation middleware của Phase 4. Đây là công việc được phân bổ chính xác cho **Step 5 (Validators, Middlewares & Controllers Migration)**.
2. **MongoDB / PostgreSQL Dual-Stack Boundary**:  
   Trong giai đoạn này, học viên làm bài nộp Quiz (`QuizSubmission`) vẫn tương tác qua MongoDB. Tính năng này hoạt động độc lập và sẽ được đồng bộ trong **Phase 5**.

---

## 10. API CONTRACT COMPATIBILITY CONFIRMATION

| Tiêu chí | Trạng thái | Ghi chú |
| :--- | :---: | :--- |
| **Endpoint URLs & HTTP Methods** | **Đóng băng (Freeze)** | Không thay đổi bất kỳ route nào. |
| **Request Payload Formats** | **Bảo toàn** | Hỗ trợ đầy đủ `lesson`, `passing_grade`, `courseId`, `options: string[]`. |
| **Response JSON Structures** | **Bảo toàn** | `data: [quiz]`, trường `_id` song song `id`, options dạng mảng chuỗi. |
| **HTTP Status Codes** | **Bảo toàn** | `200`, `201`, `400` (duplicate), `403` (forbidden), `404` (not found). |
| **Anti-Cheat Isolation** | **Bảo toàn** | Học viên không thể xem đáp án qua API public. |

---

## 11. STOP CONDITION & NEXT STEP RECOMMENDATION

Theo quy định bắt buộc tại **Section XV (Stop Condition)**:
* Toàn bộ mã nguồn và test suite cho **Step 4: Service Migration** đã hoàn tất và vượt qua 100% các tiêu chuẩn kỹ thuật.
* Hệ sinh thái mã nguồn đang ở trạng thái ổn định tuyệt đối (Zero mutation, zero runtime crash).
* AI dừng thực hiện tại đây, **KHÔNG tự ý chuyển sang Step 5**.
* Báo cáo này được đệ trình lên **Project Owner** để xem xét và cấp phép phê duyệt chuyển sang **Phase 4 — Step 5 (Validators, Middlewares, Controllers & Routes Migration)**.
