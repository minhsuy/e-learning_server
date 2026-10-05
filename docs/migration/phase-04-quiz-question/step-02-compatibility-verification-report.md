# BÁO CÁO KIỂM TOÁN TƯƠNG THÍCH: PHASE 4 — STEP 2 VERIFICATION & COMPATIBILITY AUDIT

> **Dự án**: TMDEMY E-Learning Backend  
> **Giai đoạn**: Phase 4 — Quiz & Question Migration  
> **Nhiệm vụ**: Step 2 Verification & Compatibility Audit  
> **Kết quả đánh giá chung**: **PASS WITH DOCUMENTED LIMITATIONS**  
> **Ngày thực hiện**: 2026-10-03  

---

## 1. API Contract Compatibility

| Tiêu chí | Trạng thái | Đánh giá kỹ thuật |
| :--- | :---: | :--- |
| **Endpoint URL & HTTP Methods** | ✅ **PASS** | Đóng băng 100% URL routes và HTTP methods của Quiz & Question. |
| **HTTP Request Payload Schema** | ✅ **PASS** | Tương thích ngược tuyệt đối với payload của client qua DTO schemas chuyên biệt. |
| **HTTP Response Structure** | ✅ **PASS** | Giữ nguyên vẹn cấu trúc JSON trả về (`success`, `message`, `data`, `statusCode`). |
| **Public vs Private Response Security** | ✅ **PASS** | Sinh viên tuyệt đối không nhận trường `answer` (`questionPublicSchema.omit({ answer: true })`). |

---

## 2. Quiz Input Mapping

Hệ thống đã phân định rõ ràng giữa **HTTP Request DTO** (giao tiếp với Client) và **Application Domain Input** (xử lý logic nội bộ):

| API Request Field (Client) | Zod Domain Input Field | Kiểu chuyển đổi | Ghi chú an ninh & Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `lesson` | `lessonId` | `string` (UUID) | Ánh xạ ID từ `req.body.lesson` sang `lessonId`. |
| `courseId` | `courseId` | `string` (UUID) | Giữ nguyên UUID khóa ngoại khóa học. |
| `title` | `title` | `string` | Tên quiz (bắt buộc, 1–255 ký tự). |
| `description` | `description` | `string` | Mô tả quiz (mặc định chuỗi rỗng `""`). |
| `duration` | `duration` | `number` (Int $\ge 0$) | Coerce từ string/number sang số nguyên phút. |
| `passing_grade` | `passingGrade` | `number` (Int 0–100) | Ánh xạ snake_case sang camelCase, bảo đảm phần trăm hợp lệ. |
| *(Không chấp nhận từ client)* | `createdById` | `string` (UUID) | **Bắt buộc trích xuất từ authenticated user** (`req.user.userId`). |

### Đánh giá `updateQuizInputSchema`:
- **API hiện tại**: `updateQuizValidator` chỉ cho phép cập nhật: `title`, `description`, `duration`, `passing_grade`.
- **Audit đối chiếu**: Schema đã được chuẩn hóa để **loại bỏ hoàn toàn** `lessonId` và `courseId` khỏi `updateQuizInputSchema`. Mối quan hệ 1-1 giữa Lesson và Quiz cùng phạm vi Course là bất biến, không thể bị sửa đổi thông qua API update.

---

## 3. Question Input Mapping

| API Request Field (Client) | Zod Domain Input Field | Kiểu chuyển đổi | Ghi chú an ninh & Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `quiz` | `quizId` | `string` (UUID) | Ánh xạ ID từ `req.body.quiz` sang `quizId`. |
| `type` | `type` | Enum normalized | Hỗ trợ `'multiple_choice'`, `'fill_in_blank'` và chuẩn hóa Prisma uppercase. |
| `title` | `title` | `string` | Tiêu đề câu hỏi. |
| `options` | `options` | `string[]` | Danh sách lựa chọn (mặc định `[]` cho `fill_in_blank`). |
| `answer` | `answer` | `string` | Đáp án đúng của câu hỏi. |
| `points` | `points` | `number` (Int $\ge 1$) | Điểm số của câu hỏi (mặc định `1`). |

---

## 4. Authenticated User Context

* **Phân loại**: **PASS**
* **Nguyên tắc an ninh**: Trường `createdById` đại diện cho quyền sở hữu và phân quyền giảng viên của Quiz. Client tuyệt đối không được phép truyền trường này qua request body.
* **Cơ chế thực thi**: Hàm mapper [mapCreateQuizRequestToInput](file:///d:/e-learning_server/src/models/quiz.model.ts) bắt buộc nhận tham số `authenticatedUserId: string` và ghi đè hoàn toàn mọi thuộc tính `createdById` nếu client cố tình inject vào payload.

---

## 5. Question Ordering Assessment

* **Phân loại**: **PASS WITH DOCUMENTED LIMITATION**

### Thực trạng kỹ thuật:
1. **Trong MongoDB**: Quiz lưu mảng ObjectId `questions: ObjectId[]`. Thứ tự câu hỏi phụ thuộc vào thứ tự chèn phần tử trong mảng (tương ứng với thời điểm tạo câu hỏi).
2. **Trong PostgreSQL (`prisma/schema.prisma`)**:
   - Bảng `question_options` có cột `order Int @default(0)`.
   - Bảng `questions` **không có cột `order`**, nhưng có trường `createdAt DateTime @default(now())`.
3. **Kiểm tra dữ liệu thực tế tại PostgreSQL**:
   - 5 câu hỏi hiện có trong DB `tmdemy` đều có giá trị `createdAt` tăng dần theo đúng thứ tự chèn của mảng legacy.
   - Sắp xếp với `orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]` bảo toàn đúng thứ tự các câu hỏi hiện hành và đảm bảo tính tất định (deterministic tie-breaker).

### Giới hạn kỹ thuật ghi nhận:
- API hiện tại **không có chức năng kéo-thả hoặc sắp xếp lại câu hỏi**.
- Sắp xếp theo `createdAt: 'asc'` bảo đảm tương thích 100% với hành vi hiện tại của hệ thống.
- **Khuyến nghị tương lai**: Nếu trong tương lai có yêu cầu nghiệp vụ cho phép giảng viên thay đổi thứ tự câu hỏi trong Quiz, cần bổ sung cột `order Int @default(0)` vào bảng `questions` trong một phase nâng cấp schema riêng biệt được phê duyệt.

---

## 6. Certificate Service Dependencies

* **Phân loại**: **PASS WITH DOCUMENTED LIMITATION**

### Kết quả kiểm toán `src/services/certificate.service.ts`:
1. **Cơ sở dữ liệu truy vấn**: `certificate.service.ts` hiện tại truy vấn **100% trên MongoDB Atlas**:
   - `EnrollmentModel.findOne({ user, course })` (MongoDB)
   - `CertificateModel.findOne({ user, course })` (MongoDB)
   - `QuizModel.find({ courseId })` trỏ tới `src/models/legacy/quiz.legacy.model.ts` (MongoDB)
   - `QuizSubmissionModel.find({ user, quiz: { $in: quizzes.map(q => q._id) } })` (MongoDB)
2. **Ranh giới chuyển tiếp Dual-Stack**:
   - Module Certificate thuộc phạm vi **Phase 7 (Progress, Certificate, Favorite & Rating)**.
   - Module Quiz Submission thuộc phạm vi **Phase 5 (Quiz Submission & Evaluation)**.
   - Do đó, trong suốt Phase 4: `certificate.service.ts` vẫn phụ thuộc vào dữ liệu legacy trong MongoDB.
   - Khi Phase 5 chuyển đổi QuizSubmission sang PostgreSQL, cần thiết lập cơ chế chuyển tiếp hoặc di chuyển Certificate Service ở Phase 7 sang đọc dữ liệu từ các Functional Repositories PostgreSQL.
   - **Cam kết bảo vệ phạm vi**: Không sửa đổi mã nguồn `certificate.service.ts` trong Phase 4 Step 2.

---

## 7. Zod Validation Compatibility

| Trường dữ liệu | Quy định cũ (Mongoose & Validator) | Quy định mới (Zod Model) | Phân loại | Đánh giá |
| :--- | :--- | :--- | :---: | :--- |
| `duration` | `Number` / `isNumeric()` | `z.coerce.number().int().nonnegative()` | **Intentional Stricter** | Không chấp nhận số âm; ép kiểu an toàn cho số nguyên phút phù hợp cột `Int` của PostgreSQL. |
| `passing_grade` | `Number` / `isNumeric()` | `z.coerce.number().int().min(0).max(100)` | **Intentional Stricter** | Điểm đạt là tỷ lệ phần trăm (0–100%), phù hợp cột `Int` của PostgreSQL. |
| `points` | `Number` / default 1 | `z.coerce.number().int().min(1)` | **Existing Preserved** | Điểm số câu hỏi luôn là số nguyên $\ge 1$. |
| `title` (Quiz) | `String` / required | `z.string().min(1).max(255)` | **Existing Preserved** | Khớp giới hạn `VARCHAR(255)` của PostgreSQL. |
| `title` (Question) | `String` / required | `z.string().min(1)` | **Existing Preserved** | Khớp giới hạn `TEXT` của PostgreSQL. |
| `options` | `Array` / optional | `z.array(z.string()).optional().default([])` | **Existing Preserved** | Đã loại bỏ ràng buộc `min(2)` để giữ nguyên vẹn khả năng tiếp nhận câu hỏi nháp/1 lựa chọn như cũ. |
| `answer` | `String` / required | `z.string().min(1)` | **Existing Preserved** | Bắt buộc có đáp án khi tạo câu hỏi. |

---

## 8. Additional Tests

Đã mở rộng bộ kiểm thử [scripts/migration-utils/step-02-phase4-zod-models.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-02-phase4-zod-models.test.ts) lên **42 tests**, bổ sung đầy đủ các kịch bản kiểm tra:

1. **Mapping DTO sang Application Input**:
   - `lesson` $\rightarrow$ `lessonId`.
   - `passing_grade` $\rightarrow$ `passingGrade`.
   - `quiz` $\rightarrow$ `quizId`.
   - Coerce kiểu dữ liệu từ chuỗi HTTP sang số nguyên.
2. **Bảo mật Authenticated User**:
   - Khẳng định `createdById` luôn nhận giá trị từ authenticated session, bỏ qua dữ liệu giả mạo từ client.
3. **Tính bất biến của cấu trúc quan hệ Quiz**:
   - Khẳng định `updateQuizInputSchema` từ chối/bỏ qua `lessonId` và `courseId`.
4. **Tương thích Options**:
   - Khẳng định `createQuestionInputSchema` chấp nhận mảng lựa chọn mọi độ dài để tương thích legacy validator.
5. **Anti-Cheat Validation**:
   - Khẳng định `questionPublicSchema` không để lộ trường `answer`.

### Kết quả chạy test:
```text
================================================================================
  TEST SUITE: PHASE 4 STEP 2 — QUIZ & QUESTION ZOD APPLICATION MODELS & LEGACY ISOLATION
  WITH API CONTRACT & COMPATIBILITY VERIFICATION AUDIT
================================================================================

--- 1. QUIZ APPLICATION & TRANSPORT MODEL TESTS (11/11 PASS) ---
--- 2. QUIZ HTTP DTO & MAPPER VERIFICATION (2/2 PASS) ---
--- 3. QUESTION APPLICATION & TRANSPORT MODEL TESTS (16/16 PASS) ---
--- 4. ARCHITECTURE & ISOLATION AUDIT (13/13 PASS) ---

================================================================================
  TOTAL TESTS: 42 | PASSED: 42 | FAILED: 0
================================================================================
```

---

## 9. TypeScript Results

- Lệnh thực thi: `npx tsc --noEmit`.
- **Kết quả**: Tất cả các file Zod models, DTOs, mappers và legacy models thuộc phạm vi Phase 4 biên dịch thành công tuyệt đối (**0 lỗi type**).
- Các lỗi tsc ghi nhận chỉ thuộc về các module chưa migration (Comment, Coupon, PDF Generator) nằm ngoài phạm vi Phase 4.

---

## 10. Danh sách Files đã điều chỉnh

| File | Nội dung thay đổi |
| :--- | :--- |
| [src/models/quiz.model.ts](file:///d:/e-learning_server/src/models/quiz.model.ts) | Bổ sung HTTP DTOs (`createQuizRequestSchema`, `updateQuizRequestSchema`), mappers an toàn và khóa bất biến `lessonId`/`courseId` trong update. |
| [src/models/question.model.ts](file:///d:/e-learning_server/src/models/question.model.ts) | Bổ sung HTTP DTOs (`createQuestionRequestSchema`, `updateQuestionRequestSchema`), mappers (`quiz` $\rightarrow$ `quizId`) và chuẩn hóa validation `options`. |
| [scripts/migration-utils/step-02-phase4-zod-models.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-02-phase4-zod-models.test.ts) | Mở rộng 42 test cases kiểm tra tương thích API contract và mappers. |
| [docs/migration/phase-04-quiz-question/step-02-compatibility-verification-report.md](file:///d:/e-learning_server/docs/migration/phase-04-quiz-question/step-02-compatibility-verification-report.md) | Báo cáo kiểm toán tương thích chi tiết. |

---

## 11. Remaining Risks & Mitigation

1. **Rủi ro thứ tự câu hỏi khi tạo đồng thời**:
   - *Nguy cơ*: Nếu hai câu hỏi được tạo trong cùng 1 millisecond, `createdAt` có thể trùng nhau.
   - *Giải pháp*: Trong Repositories (Step 3), luôn áp dụng tie-breaker `orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]`.
2. **Rủi ro ranh giới Certificate Service**:
   - *Nguy cơ*: Học viên hoàn thành quiz mới trên PostgreSQL sẽ không thể cấp chứng chỉ thông qua `certificate.service.ts` cũ.
   - *Giải pháp*: Giới hạn chuyển tiếp này đã được ghi nhận vào Roadmap và sẽ được xử lý đồng bộ tại Phase 5 hoặc Phase 7.

---

## 12. Khuyến nghị cho Step 3 (Functional Repositories)

Sau khi báo cáo này được phê duyệt:
1. Xây dựng `src/repositories/quiz.repository.ts`:
   - Sử dụng Prisma Client Singleton `~/config/prisma`.
   - Áp dụng các projections chuẩn xác (`QUIZ_PUBLIC_SELECT`, `QUIZ_DETAIL_SELECT`).
   - Sắp xếp câu hỏi lồng nhau theo `orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]`.
2. Xây dựng `src/repositories/question.repository.ts`:
   - Quản lý đồng bộ giữa `Question` và các bản ghi con `QuestionOption`.
   - Sắp xếp `options` theo `orderBy: { order: 'asc' }`.
3. Kiểm thử Functional Repositories trước khi tiến hành Step 4.

---

## 13. Stop Condition

Hệ thống **dừng hoàn toàn** tại đây để Project Owner kiểm tra và phê duyệt báo cáo kiểm toán trước khi chuyển sang Step 3.
