# BIÊN BẢN NGHIỆM THU VÀ CỔNG PHÊ DUYỆT (PROJECT OWNER APPROVAL GATE)
## PHASE 3: COURSE, CHAPTER & LESSON MIGRATION

---

### 1. APPROVAL SUMMARY (TỔNG QUAN PHÊ DUYỆT)

| Thông số | Chi tiết |
| :--- | :--- |
| **Dự án** | TMDEMY E-Learning Backend |
| **Giai đoạn Migration** | **Phase 3 — Course, Chapter & Lesson Migration** |
| **Bước thực hiện** | **Step 7 — Project Owner Approval Gate** |
| **Phạm vi kỹ thuật** | Chuyển dịch toàn diện Database Layer từ MongoDB/Mongoose sang PostgreSQL 16.11 qua Prisma ORM 6.4.1 cho các thực thể: Course, Chapter, Lesson và CourseFaq |
| **Trạng thái thực thi kỹ thuật (Steps 1–6)** | **100% HOÀN TẤT & ĐẠT CHUẨN** (Step 1: PASS, Step 2: PASS, Step 3: PASS, Step 4: PASS, Step 5: PASS, Step 6: PASS) |
| **Số lượng Endpoint thẩm định** | **19 Endpoints** thực tế được mount trên Express Router |
| **Tổng số Test Hồi quy đã thực thi** | **272 / 272 Tests PASSED (100%)**, 0 Failed, 0 Skipped |
| **Kiểm thử API Trực tiếp (Live HTTP)** | **52 / 52 Test Cases PASSED (100%)** trên server chạy thật (`http://localhost:3002`) |
| **Bảo toàn Dữ liệu Database (PostgreSQL)** | Toàn vẹn 100%, 0 rò rỉ rác dữ liệu test, atomic view counter được khôi phục nguyên trạng |
| **Tính tương thích MongoDB Legacy** | Kết nối MongoDB Atlas duy trì `readyState: 1`, 0 thao tác CRUD Mongoose trên các thực thể đã migrate |
| **Đề xuất Đánh giá từ Antigravity** | **`APPROVED`** (Đủ điều kiện để Chủ dự án phê duyệt chuyển sang Phase 4) |

---

### 2. ACCEPTANCE CRITERIA CHECKLIST (BẢNG KIỂM TIÊU CHÍ NGHIỆM THU)

| STT | Tiêu chí nghiệm thu bắt buộc | Bằng chứng kiểm tra thực tế | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | **API Contract Freeze** | Giữ nguyên 100% URL, HTTP methods, headers, payload, response envelope và HTTP status codes của 19 endpoints | **ĐẠT (PASS)** |
| 2 | **Architecture Hierarchy** | Tuân thủ nghiêm ngặt Router $\rightarrow$ Middleware $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Functional Repository $\rightarrow$ Prisma Client $\rightarrow$ PostgreSQL. Không dùng Class Repository, không generic BaseRepository | **ĐẠT (PASS)** |
| 3 | **Model Integration & Reuse** | Tích hợp Zod Domain Models (`course.model.ts`, `chapter.model.ts`, `lesson.model.ts`) tại Service và Test boundaries. Phân định rõ trách nhiệm Runtime Validation vs Type-only contracts | **ĐẠT (PASS)** |
| 4 | **Prisma Physical Schema Freeze** | Giữ nguyên 100% `prisma/schema.prisma`. Không thêm/sửa/xóa bảng, cột, quan hệ hoặc enum | **ĐẠT (PASS)** |
| 5 | **Functional Repositories Purity** | 3 Functional Repositories xuất các hàm async độc lập, hỗ trợ Prisma transaction client (`tx`), định nghĩa Prisma Select Projections an toàn | **ĐẠT (PASS)** |
| 6 | **Business Logic Integrity** | Bảo toàn trọn vẹn nghiệp vụ: Teacher ownership, auto-increment order, slug uniqueness, quan hệ ràng buộc đa cấp Lesson $\rightarrow$ Chapter $\rightarrow$ Course, soft-delete, atomic view increment | **ĐẠT (PASS)** |
| 7 | **Authentication & Authorization** | Ma trận phân quyền 4 nhóm tác tử (Guest, USER, TEACHER, ADMIN) hoạt động chính xác; bảo vệ triệt để tài nguyên của giáo viên | **ĐẠT (PASS)** |
| 8 | **Database Zero-Pollution** | Không có dữ liệu test bị rò rỉ vào PostgreSQL sau kiểm thử HTTP; số lượng bản ghi cơ sở được bảo toàn | **ĐẠT (PASS)** |
| 9 | **Legacy MongoDB Safety** | MongoDB Atlas duy trì kết nối ổn định; không có thao tác ghi nhầm vào MongoDB; Mongoose models cũ được cách ly an toàn vào `src/models/legacy/` | **ĐẠT (PASS)** |
| 10 | **Full Regression Suite** | 272/272 tests vượt qua trên 5 bộ kiểm thử độc lập (Steps 1–5) | **ĐẠT (PASS)** |
| 11 | **TypeScript Cleanliness** | 0 lỗi TypeScript phát sinh trong toàn bộ mã nguồn thuộc phạm vi Phase 3 | **ĐẠT (PASS)** |

---

### 3. API CONTRACT VERIFICATION (XÁC MINH HỢP ĐỒNG 19 ENDPOINTS)

Xác minh chi tiết 19 endpoints thực tế được mount trong hệ thống theo các file routes:

```text
src/routes/index.route.ts
  ├── app.use('/api/courses', courseRouter)       --> 2 endpoints
  ├── app.use('/api/teacher', teacherRouter)      --> 4 endpoints
  ├── app.use('/api/admin', adminRouter)          --> 5 endpoints (thuộc Course)
  ├── app.use('/api/chapters', chapterRouter)     --> 4 endpoints
  └── app.use('/api/lessons', lessonRouter)       --> 4 endpoints
```

| STT | Endpoint | Method | Middleware kiểm soát | Quyền truy cập | Contract Response & Compatibility |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 1 | `/api/courses` | `GET` | `listPublicCoursesValidator` | Public | Danh sách khóa học APPROVED, phân trang, lọc; serialize Decimal $\rightarrow$ Number; có alias `id` và `_id`. |
| 2 | `/api/courses/:slug` | `GET` | `getCourseDetailValidator` | Public | Chi tiết khóa học; chapters & lessons nested; FAQ chuyển từ `CourseFaq` thành `info.qa`; tăng atomic view counter. |
| 3 | `/api/teacher/courses` | `POST` | `verifyAccessToken`, `isTeacher`, `createCourseValidator` | TEACHER | Tạo khóa học mới với status mặc định `PENDING`; lưu FAQs vào PostgreSQL atomically. |
| 4 | `/api/teacher/courses/:id` | `PUT` | `verifyAccessToken`, `isTeacher`, `courseIdValidator`, `updateCourseValidator` | TEACHER (Owner) | Cập nhật thông tin khóa học; kiểm tra quyền tác giả (`course.authorId === teacherId`), trả 403 nếu không sở hữu. |
| 5 | `/api/teacher/courses/:id` | `DELETE` | `verifyAccessToken`, `isTeacher`, `courseIdValidator` | TEACHER (Owner) | Xóa khóa học; chỉ cho phép xóa khi status là `PENDING` (403 nếu APPROVED); trả 404 nếu không sở hữu (theo baseline cũ). |
| 6 | `/api/teacher/courses` | `GET` | `verifyAccessToken`, `isTeacher`, `listPublicCoursesValidator` | TEACHER | Lấy danh sách khóa học thuộc quyền sở hữu của chính giáo viên đang đăng nhập. |
| 7 | `/api/admin/courses` | `POST` | `verifyAccessToken`, `isAdmin`, `createCourseValidator` | ADMIN | Admin tạo khóa học trực tiếp; status mặc định là `APPROVED`. |
| 8 | `/api/admin/courses/:id` | `PUT` | `verifyAccessToken`, `isAdmin`, `courseIdValidator`, `updateCourseValidator` | ADMIN | Admin cập nhật bất kỳ khóa học nào trong toàn hệ thống. |
| 9 | `/api/admin/courses/:id` | `DELETE` | `verifyAccessToken`, `isAdmin`, `courseIdValidator` | ADMIN | Admin soft-delete khóa học (`isDestroyed = true`). |
| 10 | `/api/admin/courses` | `GET` | `verifyAccessToken`, `isAdmin`, `listPublicCoursesValidator` | ADMIN | Lấy danh sách toàn bộ khóa học kèm thông tin tác giả và trạng thái xóa `_destroy`. |
| 11 | `/api/admin/courses/teacher/:id` | `PATCH` | `verifyAccessToken`, `isAdmin`, `courseIdValidator`, `updateCourseStatusValidator` | ADMIN | Admin duyệt / từ chối khóa học của giáo viên; dispatch push notification bất đồng bộ không ngắt giao dịch. |
| 12 | `/api/chapters/:courseId` | `POST` | `verifyAccessToken`, `isTeacherOrAdmin`, `createChapterValidator` | TEACHER (Owner) / ADMIN | Tạo chương học mới; tự động tính `order = max + 1`; kiểm tra quyền sở hữu khóa học cha (403 nếu vi phạm). |
| 13 | `/api/chapters/:id` | `PUT` | `verifyAccessToken`, `isTeacherOrAdmin`, `chapterIdValidator`, `updateChapterValidator` | TEACHER (Owner) / ADMIN | Cập nhật tên/thứ tự chương học; kiểm tra quyền sở hữu khóa học cha. |
| 14 | `/api/chapters/:id` | `DELETE` | `verifyAccessToken`, `isTeacherOrAdmin`, `chapterIdValidator` | TEACHER (Owner) / ADMIN | Soft-delete chương học (`isDestroyed = true`); kiểm tra quyền sở hữu khóa học cha. |
| 15 | `/api/chapters/course/:id` | `GET` | `verifyAccessToken`, `isTeacherOrAdmin`, `courseIdValidator` | TEACHER / ADMIN | Lấy danh sách chương học theo khóa học (endpoint bảo vệ cho Giảng viên/Admin; người dùng công khai xem qua slug). |
| 16 | `/api/lessons` | `POST` | `verifyAccessToken`, `isTeacherOrAdmin`, `createLessonValidator` | TEACHER (Owner) / ADMIN | Tạo bài học mới; tự động tính `order = max + 1`; kiểm tra ràng buộc quan hệ: Chapter phải thuộc đúng Course (400 nếu sai). |
| 17 | `/api/lessons/:id` | `PUT` | `verifyAccessToken`, `isTeacherOrAdmin`, `lessonIdValidator`, `updateLessonValidator` | TEACHER (Owner) / ADMIN | Cập nhật bài học; chống di chuyển bài học sang Chapter thuộc Course khác (400 Integrity Guard). |
| 18 | `/api/lessons/:id` | `DELETE` | `verifyAccessToken`, `isTeacherOrAdmin`, `lessonIdValidator` | TEACHER (Owner) / ADMIN | Xóa bài học; kiểm tra quyền sở hữu khóa học cha. |
| 19 | `/api/lessons/chapter/:chapterId` | `GET` | `chapterIdValidator` | Public | Lấy danh sách bài học thuộc chương học tương ứng (công khai, chỉ cần UUID chapter hợp lệ). |

---

### 4. MODEL INTEGRATION VERIFICATION (PHÂN LOẠI TRÁCH NHIỆM MODEL)

Đánh giá thực tế việc tích hợp theo [AGENTS.md](file:///d:/e-learning_server/AGENTS.md) Sections C.9 & C.10:

```text
Phân loại trách nhiệm:
1. Runtime Validation:        Được kiểm thử và thực thi tại ranh giới dữ liệu (Test Suites & Domain Guards).
2. Type-only Usage:            Được suy luận qua z.infer và sử dụng làm kiểu dữ liệu chính thức trong Service.
3. Transport Syntactic Guard: Express Validator đảm nhận tại Middleware HTTP.
4. Database Query Payload:     Prisma-generated Types đảm nhận tại Functional Repository.
```

| Entity Model File | Schemas & Types thành phần | Hình thức tích hợp thực tế | Vị trí áp dụng trong mã nguồn | Đánh giá |
| :--- | :--- | :---: | :--- | :---: |
| [src/models/course.model.ts](file:///d:/e-learning_server/src/models/course.model.ts) | `courseSchema`, `coursePublicSchema`, `courseDetailResponseSchema`, `courseFaqSchema`, `courseInfoCompatibilitySchema` | **Runtime Validation** | `scripts/migration-utils/zod-models-audit.test.ts`<br>`scripts/migration-utils/step-01-phase3-zod-models.test.ts` | **ĐẠT** |
| [src/models/course.model.ts](file:///d:/e-learning_server/src/models/course.model.ts) | `CreateCourseInput`, `UpdateCourseInput`, `CoursePublic`, `CourseDetailResponse` | **Type-only Usage** | [src/services/course.service.ts](file:///d:/e-learning_server/src/services/course.service.ts)<br>[src/services/teacher.service.ts](file:///d:/e-learning_server/src/services/teacher.service.ts) | **ĐẠT** |
| [src/models/chapter.model.ts](file:///d:/e-learning_server/src/models/chapter.model.ts) | `chapterSchema`, `chapterPublicSchema`, `chapterCompactSchema` | **Runtime Validation** | `scripts/migration-utils/zod-models-audit.test.ts` | **ĐẠT** |
| [src/models/chapter.model.ts](file:///d:/e-learning_server/src/models/chapter.model.ts) | `CreateChapterInput`, `UpdateChapterInput`, `ChapterPublic` | **Type-only Usage** | [src/services/chapter.service.ts](file:///d:/e-learning_server/src/services/chapter.service.ts) | **ĐẠT** |
| [src/models/lesson.model.ts](file:///d:/e-learning_server/src/models/lesson.model.ts) | `lessonSchema`, `lessonPublicSchema`, `lessonStudySchema`, `lessonCompactSchema` | **Runtime Validation** | `scripts/migration-utils/zod-models-audit.test.ts` | **ĐẠT** |
| [src/models/lesson.model.ts](file:///d:/e-learning_server/src/models/lesson.model.ts) | `CreateLessonInput`, `UpdateLessonInput`, `LessonPublic`, `LessonStudy` | **Type-only Usage** | [src/services/lesson.service.ts](file:///d:/e-learning_server/src/services/lesson.service.ts) | **ĐẠT** |

**Kết luận kiểm toán Model:**
- **Imported but Unused:** 0 trường hợp.
- **Defined but Not Integrated:** 0 trường hợp.
- **Duplicate Parallel Types:** 0 trường hợp.
- Hệ thống không ép buộc `.parse()` tại Repository hay Middleware, giữ đúng nguyên tắc phân tầng của dự án.

---

### 5. ARCHITECTURE VERIFICATION (KIỂM TOÁN TÍNH CHUẨN MỰC KIẾN TRÚC)

1. **Tuân thủ Kiến trúc Phân tầng Đơn hướng**:
   - Router chỉ định nghĩa URL, HTTP method và gắn middleware.
   - Middleware chỉ kiểm tra JWT và validate cú pháp HTTP. Không có query database trong Express Validator chains.
   - Controller chỉ trích xuất tham số, gọi Service và trả HTTP status code kèm JSON response.
   - Service điều phối nghiệp vụ, quản lý quyền tác giả, tính toàn vẹn quan hệ và quản lý transaction.
   - Functional Repository là tầng duy nhất giao tiếp với PostgreSQL thông qua Prisma Client.
2. **Loại trừ Hoàn toàn các Mẫu Chống Kiến trúc (Anti-Patterns)**:
   - **0 Class-based Repository**: Toàn bộ Repository files đều xuất các hàm `async` độc lập.
   - **0 BaseRepository / Generic CRUD abstraction**: Không có sự trừu tượng hóa quá mức làm mờ query semantics.
   - **0 Lời gọi Prisma Client ngoài Repository**: Controller và Middleware không chạm tới Prisma Client.
   - **Prisma Client Singleton**: Được nhập duy nhất từ [src/config/prisma.ts](file:///d:/e-learning_server/src/config/prisma.ts).

---

### 6. REGRESSION TEST EVIDENCE (BẰNG CHỨNG KIỂM THỬ HỒI QUY)

Toàn bộ 272 bài kiểm thử đã được chạy thực tế trong quá trình kiểm toán và đạt tỷ lệ thành công 100%:

```text
================================================================================
TỔNG HỢP KIỂM THỬ HỒI QUY TOÀN DIỆN PHASE 3
================================================================================
1. Step 1 (Zod Application Models Audit)     : 33 / 33  PASS [100%]
2. Step 2 (Functional Repositories Test)     : 71 / 71  PASS [100%]
3. Step 3 (Services Migration Test)          : 68 / 68  PASS [100%]
4. Step 4 (Middleware & Validators Test)     : 48 / 48  PASS [100%]
5. Step 5 (Live HTTP API Test Audit)         : 52 / 52  PASS [100%]
--------------------------------------------------------------------------------
TỔNG SỐ TEST ASSERTIONS TOÀN BỘ PHASE 3       : 272 / 272 PASS [100%]
SỐ TEST THẤT BẠI (FAILED)                    : 0
SỐ TEST BỎ QUA (SKIPPED / NOT EXECUTED)      : 0
================================================================================
```

---

### 7. DATABASE & MONGODB SAFETY (AN TOÀN CƠ SỞ DỮ LIỆU)

1. **Cơ sở dữ liệu PostgreSQL (`tmdemy`)**:
   - `prisma/schema.prisma` được đóng băng 100%, không bị sửa đổi.
   - Tuyệt đối không chạy `prisma migrate reset`, `db push --force-reset` hoặc drop database.
   - Bộ kiểm thử HTTP tự động dọn dẹp sạch toàn bộ các bản ghi thử nghiệm sinh ra (`createdCourseIds`, `createdChapterIds`, `createdLessonIds`) và khôi phục giá trị view count về baseline.
   - Ghi nhận thực tế: Các bản ghi bổ sung phát sinh thủ công qua client bên ngoài vào lúc 13:02–13:05 UTC (1 chapter 'tesstt' và 1 lesson) được bảo toàn nguyên vẹn, không bị xóa tùy tiện theo đúng Rule Section 7.
2. **Cơ sở dữ liệu MongoDB Atlas Legacy (`e-learning`)**:
   - Driver Mongoose duy trì kết nối ổn định (`readyState: 1`).
   - Các file Mongoose model cũ của Course, Chapter, Lesson được chuyển vào `src/models/legacy/` để bảo vệ khả năng đối chiếu dữ liệu lịch sử và rollback khi cần thiết.
   - Tuyệt đối không có bất kỳ thao tác ghi (insert, update, delete) nào vào MongoDB cho các thực thể đã migration.
   - Lệnh đọc `EnrollmentModel.find({ course, status: 'active' }).select('user')` tại `lesson.service.ts` là **Read-Only Dependency** phục vụ gửi thông báo cho phân hệ Enrollment (thuộc Phase 6 chưa migrate), được bọc trong khối `try/catch` non-blocking, hoàn toàn không gây ảnh hưởng đến việc tạo Lesson trên PostgreSQL.

---

### 8. TYPESCRIPT STATUS (TRẠNG THÁI BIÊN DỊCH TYPESCRIPT)

- **Mã nguồn Phase 3**: **0 lỗi TypeScript**. Toàn bộ các file Router, Middleware, Controller, Service, Repository và Application Model của Course, Chapter, Lesson, Teacher Course, Admin Course đều đạt tính an toàn kiểu dữ liệu tuyệt đối (Strict Mode).
- **Lỗi ngoài phạm vi (Known Baseline Issues)**: Các cảnh báo hiển thị khi chạy `tsc` trên toàn dự án đều nằm ở các module chưa tới lượt migration (Express params typing ở unmigrated controllers, Mongoose Document typing ở `coupon`/`quiz`, `pdfGenerator.ts` ở Phase 7). Không có can thiệp vượt phạm vi làm xáo trộn các module này.

---

### 9. KNOWN EXCEPTIONS (DANH MỤC NGOẠI LỆ ĐÃ XÁC MINH)

| STT | Ngoại lệ kỹ thuật | File liên quan | Mức độ ảnh hưởng | Lý do chấp nhận | Phạm vi xử lý tương lai |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | **Read-Only Dependency vào `EnrollmentModel`** | `src/services/lesson.service.ts` ([L134](file:///d:/e-learning_server/src/services/lesson.service.ts#L134)) | Thấp (Non-blocking) | Phân hệ Enrollment chưa migrate (thuộc Phase 6). Service cần lấy danh sách học viên active để gửi notification khi có bài học mới | Sẽ chuyển sang Prisma Query khi thực hiện Phase 6 (Order, Coupon & Enrollment) |
| 2 | **Lỗi 404 khi xóa Course không thuộc sở hữu** | `src/services/teacher.service.ts` ([L91-L93](file:///d:/e-learning_server/src/services/teacher.service.ts#L91-L93)) | Rất thấp (Contract Match) | Bảo toàn đúng hành vi gốc của MongoDB legacy (`CourseModel.findOne({ _id, author })` trả về null $\rightarrow$ 404) | Đã đối chiếu và giữ nguyên theo nguyên tắc API Contract Freeze |

---

### 10. FINAL APPROVAL DECISION (ĐỀ XUẤT PHÊ DUYỆT TỪ ANTIGRAVITY)

> **KẾT QUẢ ĐÁNH GIÁ KỸ THUẬT: `APPROVED`**
> 
> Dựa trên kết quả kiểm toán độc lập, khách quan và toàn diện từ source code, physical database, và 272 test assertions thành công:
> Antigravity xác nhận **Phase 3 (Course, Chapter & Lesson Migration)** đã hoàn thành xuất sắc 100% mục tiêu kỹ thuật, tuân thủ tuyệt đối [AGENTS.md](file:///d:/e-learning_server/AGENTS.md), bảo toàn toàn vẹn API Contract Freeze và an toàn dữ liệu trên cả PostgreSQL và MongoDB.
> 
> **Đề xuất Chủ dự án (Project Owner) chính thức phê duyệt đóng Phase 3 và cho phép kích hoạt Phase 4 (Quiz & Question Migration).**

---

### 11. PROJECT OWNER CONFIRMATION (XÁC NHẬN CỦA CHỦ DỰ ÁN)

*(Phần dành riêng cho Chủ dự án ký duyệt. Antigravity KHÔNG tự ý tick chọn).*

- [ ] **ĐỒNG Ý PHÊ DUYỆT (APPROVED)** — Xác nhận nghiệm thu hoàn thành Phase 3 và cho phép chuyển sang **Phase 4: Quiz & Question Migration**.
- [ ] **YÊU CẦU ĐIỀU CHỈNH (CHANGES REQUESTED)** — Ghi chú yêu cầu bổ sung bên dưới:

*Ghi chú của Project Owner:*
`........................................................................................................................`
`........................................................................................................................`

*Ngày ký duyệt:* `..... / ..... / 2026`

---
*Biên bản nghiệm thu được lập ngày 03/10/2026.*
