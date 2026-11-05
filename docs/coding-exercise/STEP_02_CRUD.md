# BÁO CÁO TRIỂN KHAI KỸ THUẬT — STEP 2: CODING EXERCISE CRUD & REVISION MANAGEMENT

**Dự án**: TMDEMY E-Learning Backend  
**Phân hệ**: Coding Exercise (Bài tập lập trình tự động chấm)  
**Giai đoạn**: Step 2 — CRUD, Authorization, Revision Management, Student-Safe DTOs  
**Ngày hoàn thành**: 23/10/2026  
**Trạng thái**: **HOÀN THÀNH TOÀN DIỆN (37/37 KIỂM THỬ ĐẠT)**  

---

## A. MỤC TIÊU (OBJECTIVE)

Mục tiêu của **Step 2** là hiện thực hóa toàn bộ tầng nghiệp vụ (CRUD), xác thực & phân quyền, quản lý phiên bản bất biến (Revision Versioning), và bảo vệ an toàn dữ liệu học viên cho mô hình Coding Exercise trên nền tảng TMDEMY Backend, kế thừa trực tiếp từ Database Layer đã tạo ở Step 1.

### Phạm vi thực hiện trong Step 2:
1. **CRUD APIs dành cho Giảng viên (Teacher)**: Tạo bài tập, sửa bài tập, lấy danh sách bài tập theo bài học, xem chi tiết quản lý (gồm mã nguồn mẫu & test case ẩn), lưu trữ bài tập (Soft Archive).
2. **Read APIs dành cho Học viên (Student-Safe)**: Lấy danh sách bài tập đã xuất bản (`PUBLISHED`), xem chi tiết bài tập để làm bài.
3. **Phân quyền & Kiểm soát quyền sở hữu**: Xác thực JWT (`verifyAccessToken`), kiểm tra vai trò (`isTeacherOrAdmin`), và kiểm tra quyền sở hữu khóa học (`authorId === userId`) xuyên suốt chuỗi quan hệ `Lesson → Chapter → Course`.
4. **Cơ chế Quản lý Phiên bản Bất biến (Revision Management)**:
   - Cho phép chỉnh sửa trực tiếp trên bản nháp chưa công bố và chưa có bài nộp (**Case A**).
   - Bảo toàn tuyệt đối bản revision đã xuất bản hoặc đã có bài nộp bằng cách sinh revision mới `v(N+1)` ở trạng thái nháp (**Case B**).
   - Chỉnh sửa tiếp tục trên bản nháp mới nhất mà không tạo rác revision (**Case C**).
5. **Giao dịch Cơ sở Dữ liệu Toàn vẹn (Prisma Transactions)**: Đảm bảo tính nguyên tử (Atomicity) khi tạo/cập nhật đồng thời `CodingExercise`, `CodingExerciseRevision`, và danh sách `CodingTestCase`.
6. **Student-Safe DTO Projections**: Tuyệt đối không để lộ `referenceSolution`, test cases ẩn (`isHidden = true`), hoặc nội dung bản nháp ra API của học viên.

### Giới hạn phạm vi (Không thuộc Step 2):
- Không tích hợp E2B Sandbox API (thuộc Step 3).
- Không triển khai các API nộp bài/chấm điểm `runCode` hay `submitCode` (thuộc Step 4).
- Không triển khai luồng xác minh và tự động xuất bản (Step 5).
- Không tích hợp Gemini AI sinh bài tập hay giao diện người dùng Frontend.

---

## B. TRẠNG THÁI TRIỂN KHAI (IMPLEMENTATION STATUS)

| Hạng mục / Tính năng | Phân loại | Ghi chú kỹ thuật |
| :--- | :---: | :--- |
| Zod Application Models & DTOs | **IMPLEMENTED & TESTED** | `src/models/codingExercise.model.ts` với đầy đủ schemas, type inference, và contract validator |
| Functional Repository | **IMPLEMENTED & TESTED** | `src/repositories/codingExercise.repository.ts` hỗ trợ Prisma transactional client |
| Service Layer Business Logic | **IMPLEMENTED & TESTED** | `src/services/codingExercise.service.ts` xử lý toàn bộ rules A/B/C, ownership, và slug collision |
| Controller & HTTP Pipeline | **IMPLEMENTED & TESTED** | `src/controller/codingExercise.controller.ts` tuân thủ chuẩn Express Response |
| Route & Validation Middlewares | **IMPLEMENTED & TESTED** | `src/routes/codingExercise.route.ts` & `src/middlewares/codingExercise.middleware.ts` |
| Teacher CRUD Endpoints (5 APIs) | **IMPLEMENTED & TESTED** | Create, List by Lesson, Get Manage Detail, Update with Revisions, Soft Archive |
| Student-Safe Read Endpoints (2 APIs)| **IMPLEMENTED & TESTED** | List Published by Lesson, Get Published Detail (Stripped sensitive fields) |
| Kiểm tra quyền sở hữu khóa học | **IMPLEMENTED & TESTED** | Tra cứu từ `Lesson.chapter.course.authorId`, Admin vượt quyền hợp lệ |
| Quản lý phiên bản (Revision A/B/C) | **IMPLEMENTED & TESTED** | Test Case 17-22: Bản nháp v1 sửa in-place; bản xuất bản v1 giữ nguyên, sinh v2 draft |
| Bảo vệ lời giải mẫu & Test ẩn | **IMPLEMENTED & TESTED** | Test Case 15-16: Học viên không bao giờ nhận `referenceSolution` và test ẩn |
| Tích hợp E2B Sandbox Engine | **NOT IMPLEMENTED** | Nằm trong kế hoạch Step 3 |
| Student Run & Submit Execution APIs | **NOT IMPLEMENTED** | Nằm trong kế hoạch Step 4 |
| Workflow Verify & Publish Exercise | **NOT IMPLEMENTED** | Nằm trong kế hoạch Step 5 |

---

## C. DANH SÁCH FILE TẠO MỚI VÀ CHỈNH SỬA (FILES CHANGED)

### 1. File tạo mới:
1. `src/models/codingExercise.model.ts`:
   - Định nghĩa toàn bộ Zod validation schemas cho Request (Create, Update, Query params, UUID params).
   - Kiểm tra ràng buộc tương thích: số lượng tham số trong `executionContract.parameters` phải khớp chính xác với số phần tử trong mảng `input` của từng test case.
   - Định nghĩa DTO response chuẩn cho Học viên (`codingExercisePublicDetailSchema`) và Giảng viên (`codingExerciseManageDetailSchema`).
2. `src/repositories/codingExercise.repository.ts`:
   - Triển khai Functional Repository thuần túy (không class, không `this`).
   - Các hàm: `createCodingExerciseWithRevisionAndTestCases`, `findCodingExerciseById`, `findCodingExerciseWithRevisions`, `findPublishedCodingExerciseById`, `listCodingExercisesByLesson`, `listPublishedCodingExercisesByLesson`, `findRevisionById`, `findLatestRevisionByExerciseId`, `hasRevisionSubmissions`, `updateCodingExerciseMetadata`, `updateCodingExerciseRevisionAndTestCases`, `createNewRevisionWithTestCases`, `softArchiveCodingExercise`.
   - Hỗ trợ tham số tùy chọn `tx?: PrismaTransactionClient`.
3. `src/services/codingExercise.service.ts`:
   - Trung tâm xử lý toàn bộ Business Logic: Tra cứu chuỗi `Lesson → Chapter → Course`, xác thực quyền sở hữu của Giảng viên (`isCourseOwnerOrAdmin`), chống trùng slug trong bài học.
   - Hiện thực hóa logic quyết định Revision (**Case A, Case B, Case C**).
   - Đảm bảo tính nhất quán giữa `CodingExercise.courseId` và bài học cha.
4. `src/controller/codingExercise.controller.ts`:
   - Tiếp nhận HTTP requests, trích xuất thông tin người dùng từ `req.user`, gọi tầng Service, định dạng HTTP status codes chuẩn (`200`, `201`, `400`, `403`, `404`, `409`, `500`).
5. `src/middlewares/codingExercise.middleware.ts`:
   - Middleware kiểm tra cú pháp UUID cho route params (`:id`, `:lessonId`).
   - Middleware validate dữ liệu payload request body thông qua Zod schemas.
6. `src/routes/codingExercise.route.ts`:
   - Định nghĩa bảng định tuyến với thứ tự ưu tiên chính xác: route cụ thể `/lesson/:lessonId/public` và `/lesson/:lessonId` được khai báo trước `/:id` để tránh xung đột pattern URL trong Express.
7. `scripts/test_step2_coding_exercise_crud.ts`:
   - Bộ kịch bản kiểm thử tự động độc lập 37 bước kiểm tra toàn bộ 29 kịch bản quy định tại Mục 11 của yêu cầu.
8. `docs/coding-exercise/STEP_02_API.md`:
   - Tài liệu kỹ thuật chi tiết đặc tả 7 REST API endpoints.
9. `docs/coding-exercise/STEP_02_CRUD.md`:
   - Tài liệu báo cáo triển khai kỹ thuật này.

### 2. File chỉnh sửa:
1. `src/repositories/index.ts`:
   - Export toàn bộ các hàm từ `src/repositories/codingExercise.repository.ts`.
2. `src/routes/index.route.ts`:
   - Import và mount router `codingExerciseRouter` tại tiền tố `/api/coding-exercises`.

---

## D. CHI TIẾT CÁC API ENDPOINTS ĐÃ HIỆN THỰC

Tất cả các endpoint đều có tiền tố `/api/coding-exercises`:

| Method | Endpoint | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Teacher / Admin | Tạo bài tập mới, tự động tạo Revision v1 (`isPublished = false`) và test cases trong 1 transaction |
| `GET` | `/lesson/:lessonId` | Teacher / Admin | Lấy danh sách tất cả bài tập (Draft, Published, Archived) thuộc bài học |
| `GET` | `/:id/manage` | Teacher / Admin | Lấy thông tin quản lý toàn diện: Lời giải mẫu, test case ẩn, lịch sử tất cả revisions |
| `PUT` | `/:id` | Teacher / Admin | Cập nhật bài tập: Áp dụng cơ chế versioning bất biến (Case A/B/C) |
| `DELETE`| `/:id` | Teacher / Admin | Lưu trữ bài tập (Soft Archive) thành `ARCHIVED`, bảo toàn lịch sử bài nộp |
| `GET` | `/lesson/:lessonId/public` | Public / Student | Lấy danh sách bài tập đã xuất bản (`PUBLISHED`) của bài học |
| `GET` | `/:id` | Public / Student | Lấy chi tiết bài tập đã xuất bản để làm bài (ẩn lời giải mẫu & test ẩn) |

---

## E. KIẾN TRÚC PHÂN TẦNG (ARCHITECTURE)

Tuân thủ nghiêm ngặt mô hình kiến trúc phân tầng đơn hướng của hệ thống TMDEMY:

```text
HTTP Request
  └── Router (src/routes/codingExercise.route.ts)
        └── Middlewares (src/middlewares/codingExercise.middleware.ts & verifyToken, verifyRole)
              └── Controller (src/controller/codingExercise.controller.ts)
                    └── Service (src/services/codingExercise.service.ts)
                          └── Functional Repository (src/repositories/codingExercise.repository.ts)
                                └── Prisma Client Singleton (src/config/prisma.ts)
                                      └── PostgreSQL Database
```

### Luồng xử lý một Request điển hình (Ví dụ: `PUT /api/coding-exercises/:id`):
1. **Router**: Bắt endpoint `PUT /:id`, kích hoạt middleware `verifyAccessToken`, `isTeacherOrAdmin`, `validateExerciseIdParam`, `validateUpdateCodingExercise`.
2. **Middleware**:
   - `verifyAccessToken` giải mã JWT token, gán `req.user`.
   - `isTeacherOrAdmin` đảm bảo người dùng có vai trò `TEACHER` hoặc `ADMIN`.
   - `validateExerciseIdParam` kiểm tra format RFC 4122 UUID qua `src/utils/uuid.ts`.
   - `validateUpdateCodingExercise` thực thi Zod runtime validation trên `req.body`.
3. **Controller**:
   - Nhận payload đã validate, trích xuất `userId` và `role` từ `req.user`.
   - Gọi `updateCodingExerciseService`.
4. **Service**:
   - Truy vấn bài tập hiện tại và khóa học cha qua `findCodingExerciseWithRevisions` và `findCourseById`.
   - Kiểm tra bài tập có bị `ARCHIVED` không.
   - Kiểm tra quyền sở hữu khóa học: Nếu là `TEACHER`, tác giả khóa học phải trùng với `userId`.
   - Kiểm tra tình trạng Revision:
     - Nếu revision hiện tại là DRAFT và chưa có submission: Cập nhật in-place.
     - Nếu revision đã PUBLISHED hoặc đã có submission: Tạo revision mới `v(N+1)`, sao chép cấu hình và gán test case mới.
5. **Repository**:
   - Khởi tạo transaction qua `prisma.$transaction`.
   - Cập nhật bảng `coding_exercises`, tạo hoặc cập nhật bảng `coding_exercise_revisions`, xoá/tạo lại bản ghi trong `coding_test_cases`.
6. **Prisma & Database**:
   - Thực thi các câu lệnh SQL an toàn trên PostgreSQL 16.

---

## F. CƠ CHẾ QUẢN LÝ PHIÊN BẢN (REVISION MANAGEMENT)

Bảng `CodingExerciseRevision` và quan hệ `CodingTestCase.revisionId` đóng vai trò tối quan trọng nhằm bảo vệ tính toàn vẹn của dữ liệu chấm thi lịch sử. Hệ thống áp dụng quy tắc 3 kịch bản:

### Kịch bản A: Chỉnh sửa bản nháp chưa công bố (Draft In-Place Update)
- **Điều kiện**: Revision hiện tại có `isPublished = false` và chưa có bất kỳ bài nộp (`CodingSubmission`) nào tham chiếu đến nó.
- **Hành vi**:
  - Cập nhật trực tiếp trên bản ghi revision hiện tại (`starterCode`, `referenceSolution`, `timeLimit`, `memoryLimit`,...).
  - Xóa và tạo mới toàn bộ các test cases liên thuộc revision đó trong cùng transaction.
  - Số phiên bản `version` giữ nguyên.

### Kịch bản B: Chỉnh sửa bản đã xuất bản hoặc đã có bài nộp (Immutable Snapshot & Version Bump)
- **Điều kiện**: Revision hiện tại đã có `isPublished = true` hoặc đã có ít nhất 1 bài nộp của học viên.
- **Hành vi**:
  - Không sửa đổi hoặc xóa bất kỳ dòng nào của revision cũ hay test cases cũ.
  - Tạo một revision mới với `version = N + 1`, đặt `isPublished = false`.
  - Sao chép dữ liệu mới (hoặc kế thừa từ revision cũ nếu trường đó không đổi).
  - Tạo tập test cases mới gán vào `revisionId` của version mới.
  - Các bài nộp lịch sử tiếp tục liên kết an toàn với `revisionId` cũ.

### Kịch bản C: Đã có bản nháp mới kế bên bản đã xuất bản (Draft Co-existence)
- **Điều kiện**: Bài tập đã có bản `v1` đã xuất bản, và đang có bản `v2` đang nháp.
- **Hành vi**:
  - Mọi yêu cầu chỉnh sửa tiếp theo sẽ cập nhật trực tiếp trên bản nháp `v2` (theo Kịch bản A), không tạo thêm các bản `v3`, `v4` gây phân mảnh dữ liệu.
  - Endpoints của Học viên vẫn tiếp tục đọc và phục vụ bản `v1` (bản đã xuất bản) cho đến khi bản `v2` được xác minh và xuất bản ở Step 5.

---

## G. BẢO MẬT & BẢO VỆ DỮ LIỆU (SECURITY)

1. **Bảo vệ quyền sở hữu đa cấp (Hierarchical Ownership Verification)**:
   - Hệ thống không tin tưởng bất kỳ `courseId` hay `authorId` nào gửi từ client.
   - Khi tạo bài tập, `courseId` được suy diễn nội bộ từ: `Lesson(lessonId) → Chapter(chapterId) → Course(courseId)`.
   - Giảng viên chỉ được thao tác trên bài học thuộc khóa học do chính mình tạo ra (`course.authorId === userId`). Người dùng có vai trò `ADMIN` được cấp quyền quản trị toàn hệ thống.
2. **Ngăn chặn lộ Lời giải mẫu (Reference Solution Protection)**:
   - DTO công khai của học viên (`codingExercisePublicDetailSchema`) chủ động loại bỏ trường `referenceSolution`.
   - Không sử dụng cú pháp spread `...exercise` trực tiếp mà ánh xạ tường minh từng trường.
3. **Ngăn chặn lộ Test Cases ẩn (Hidden Test Cases Protection)**:
   - Tầng Repository và Service lọc tuyệt đối `isHidden: false` khi phục vụ các truy vấn của học viên.
   - Học viên chỉ nhận được các test cases mẫu công khai để hiểu rõ đề bài.
4. **Cô lập trạng thái nháp & lưu trữ (Draft & Archive Isolation)**:
   - Các bài tập ở trạng thái `DRAFT` hoặc `ARCHIVED` hoàn toàn vô hình đối với học viên. Truy vấn trực tiếp bằng ID sẽ nhận mã lỗi `404 Not Found`.

---

## H. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (TESTING RESULTS)

Bộ kiểm thử độc lập đã được thực thi thông qua lệnh:
```bash
cmd /c npx tsx scripts/test_step2_coding_exercise_crud.ts
```

### Tổng hợp kết quả:
- **Tổng số kịch bản kiểm thử**: 37/37 assertions
- **Trạng thái**: **100% PASS (37 ĐẠT / 0 THẤT BẠI)**
- **Thời gian chạy**: ~2.5 giây

### Chi tiết các nhóm kiểm thử:

#### Nhóm 1: Kiểm thử Khởi tạo (Creation Tests — 10 checks)
- `PASS`: Giảng viên tạo bài tập hợp lệ thành công (HTTP 201 Created).
- `PASS`: Trạng thái mặc định là `DRAFT`.
- `PASS`: Tự động tạo Revision v1 với `isPublished = false`.
- `PASS`: Tạo chính xác 2 test cases thuộc revision v1.
- `PASS`: Thuộc tính `courseId` khớp với khóa học chứa bài học.
- `PASS`: Từ chối payload khi số lượng input không khớp với contract (HTTP 400).
- `PASS`: Xử lý an toàn khi trùng slug trong cùng bài học (tự động phân biệt).
- `PASS`: Vai trò Student bị từ chối khi gọi tạo bài tập (HTTP 403 Forbidden).
- `PASS`: Giảng viên không sở hữu khóa học bị từ chối tạo bài tập (HTTP 403 Forbidden).

#### Nhóm 2: Kiểm thử Đọc & Phân quyền dữ liệu (Reading Tests — 11 checks)
- `PASS`: Giảng viên lấy danh sách bài tập thuộc bài học do mình sở hữu.
- `PASS`: Giảng viên xem chi tiết quản lý bài tập (Manage View).
- `PASS`: Manage View hiển thị đầy đủ mã nguồn mẫu `referenceSolution`.
- `PASS`: Manage View hiển thị đầy đủ test cases ẩn (`isHidden = true`).
- `PASS`: Giảng viên khác bị từ chối truy cập Manage View (HTTP 403 Forbidden).
- `PASS`: Danh sách bài tập của học viên loại trừ bài tập `DRAFT`.
- `PASS`: Học viên bị từ chối khi truy cập bài tập `DRAFT` bằng ID (HTTP 404).
- `PASS`: Học viên truy cập thành công bài tập khi đã ở trạng thái `PUBLISHED`.
- `PASS`: Response của học viên hoàn toàn không chứa `referenceSolution`.
- `PASS`: Học viên chỉ nhận được test case công khai (1 public, 0 hidden).
- `PASS`: Học viên nhận đúng kết quả mong đợi của test case công khai.

#### Nhóm 3: Kiểm thử Cập nhật & Quản lý Phiên bản (Updating & Versioning — 8 checks)
- `PASS`: Sửa đổi bản nháp v1 in-place (Case A).
- `PASS`: Bản nháp v1 giữ nguyên số phiên bản `version = 1`.
- `PASS`: Sửa đổi bài tập đã công bố thành công (Case B).
- `PASS`: Tự động sinh revision v2 ở trạng thái nháp (`isPublished = false`).
- `PASS`: Bản revision v1 cũ vẫn ở trạng thái xuất bản và nguyên vẹn.
- `PASS`: Số lượng test cases của revision v1 cũ giữ nguyên vẹn (2 test cases).
- `PASS`: Bản ghi submission lịch sử liên kết chính xác với revision v1.
- `PASS`: Tiếp tục sửa đổi bài tập khi đã có revision v2 nháp thì cập nhật trực tiếp vào v2, không sinh thừa v3 (Case C).

#### Nhóm 4: Kiểm thử Lưu trữ (Soft Archiving — 5 checks)
- `PASS`: API lưu trữ bài tập phản hồi thành công.
- `PASS`: Trạng thái bài tập trong database chuyển thành `ARCHIVED`.
- `PASS`: Bài tập `ARCHIVED` lập tức biến mất khỏi danh sách học viên.
- `PASS`: Lịch sử bài nộp của học viên không bị xóa khi bài tập bị lưu trữ.
- `PASS`: Giảng viên không có quyền sở hữu bị từ chối lưu trữ bài tập (HTTP 403).

#### Nhóm 5: Kiểm thử Hồi quy Hệ thống (Regression Tests — 3 checks)
- `PASS`: Các truy vấn của module `Quiz` thực thi bình thường, không suy giảm tính năng.
- `PASS`: Quan hệ phân cấp của `Lesson` (`Course`, `Chapter`, `Quiz`, `CodingExercises`) hoạt động hoàn hảo.
- `PASS`: Ràng buộc tác giả khóa học của toàn hệ thống được duy trì nguyên vẹn.

---

## I. HẠN CHẾ & NỢ KỸ THUẬT (KNOWN ISSUES & TECHNICAL DEBT)

1. **Chưa có cơ chế Chấm điểm Thực thi (Step 3 & 4)**:
   - Các bài tập hiện tại mới chỉ lưu trữ cấu hình đề bài, test cases và hợp đồng thực thi (`executionContract`). Client chưa thể gửi code để sandbox thực thi.
2. **Cơ chế Khôi phục Bài tập đã Lưu trữ (Unarchive Workflow)**:
   - Step 2 triển khai thao tác lưu trữ một chiều (`DELETE /:id` chuyển thành `ARCHIVED`). Hiện tại chưa hỗ trợ API khôi phục (`RESTORE`), bài tập đã `ARCHIVED` không thể chỉnh sửa tiếp.
3. **Cơ chế Tự động Xuất bản (Publishing Gate)**:
   - Do tuân thủ nguyên tắc an toàn, Step 2 không cung cấp API xuất bản trực tiếp bằng cờ thủ công. Việc chuyển `status = PUBLISHED` và `isPublished = true` sẽ được tích hợp với E2B Sandbox ở Step 5 sau khi code mẫu vượt qua 100% test cases.

---

## J. ĐÁNH GIÁ SẴN SÀNG CHO STEP 3 (STEP 3 READINESS)

### Kết luận: **SẴN SÀNG 100% ĐỂ TRIỂN KHAI STEP 3**

- **Cơ sở dữ liệu**: Hoàn thiện toàn diện 5 mô hình và 5 enums.
- **Dữ liệu cấu hình bài tập**: Đã có đầy đủ bài tập mẫu, test cases công khai & ẩn, giới hạn tài nguyên (timeLimit, memoryLimit) và hợp đồng thực thi JSON (functionName, parameters, returnType).
- **Mức độ an toàn**: Toàn bộ hệ thống Zod models, Functional Repositories, Services và Middlewares đã được kiểm thử hồi quy đạt chuẩn 37/37.
- **Bước tiếp theo (Step 3)**:
   - Thiết lập E2B Sandbox Client kết nối tới nền tảng E2B Cloud MicroVM.
   - Xây dựng Code Wrapper Generator cho JavaScript: Tự động đóng gói `starterCode` / mã học viên cùng harness runner, nạp input từ JSON và so sánh với expectedOutput.
