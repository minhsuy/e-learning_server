# BÁO CÁO KIỂM THỬ TÍCH HỢP & END-TO-END MODULE CHỨNG CHỈ (PHASE C4)
## TMDEMY E-LEARNING BACKEND — CERTIFICATE INTEGRATION & E2E TEST REPORT

- **Mã báo cáo**: `CERTIFICATE_C4_INTEGRATION_TEST_REPORT`
- **Phiên bản hệ thống**: TMdemy Backend v1.0.0
- **Phân hệ**: Certificate Module (C4 Phase)
- **Môi trường thử nghiệm**: Node.js v22.14.1 / TypeScript 5.8.3 / PostgreSQL 16.11 / Prisma ORM 6.4.1 / Cloudinary API
- **Ngày thực hiện**: 14/10/2026
- **Trạng thái**: **COMPLETED (ALL TESTS PASSED — 100%)**

---

## 1. Scope (Phạm vi công việc)

### 1.1. Phạm vi thực hiện
- Toàn bộ backend logic của phân hệ Cấp và Quản lý Chứng chỉ (`Certificate`) trên TMDEMY backend (`d:\e-learning_server`):
  - Database schema: Thêm trường `code` (`String? @unique @db.VarChar(50)`) vào `model Certificate` trong `prisma/schema.prisma` và migration chuẩn hóa.
  - PDF Generation: Nâng cấp `PDFKit` với layout Landscape A4 sang trọng (khổ ngang 841.89 x 595.28 pt), viền đôi vàng đồng/xanh navy, tích hợp font chữ Unicode chuẩn tiếng Việt (`Arial`, `Arial-Bold`), hiển thị tiếng Việt có dấu hoàn hảo không lỗi font.
  - Tích hợp mã QR: Tự động sinh ma trận QR Code (Model 2, Byte mode) trực tiếp bằng vector PDFKit, trỏ tới URL xác thực công khai của chứng chỉ.
  - Cloudinary Upload: Khắc phục lỗi lặp thư mục (`certificates/certificates/` -> `certificates/`), hỗ trợ URL động từ biến môi trường `CLOUDINARY_URL` và tự động fallback về cloud name thực tế (`dxostp23y`).
  - Business Flow & APIs: Hoàn thiện và chuẩn hóa 4 endpoints:
    1. `POST /api/certificates`: Cấp chứng chỉ theo quy trình nghiệp vụ đầy đủ.
    2. `GET /api/certificates/my`: Lấy danh sách chứng chỉ của học viên hiện tại kèm thông tin khóa học.
    3. `GET /api/certificates/course/:courseId`: Lấy chứng chỉ theo khóa học cụ thể của học viên.
    4. `GET /api/certificates/verify/:code`: Public verification endpoint — xác thực công khai, bảo mật tuyệt đối, không yêu cầu JWT, không làm lộ PII và internal IDs.
  - Kiểm thử tích hợp & E2E: Xây dựng và thực thi bộ kiểm thử toàn diện `scripts/test_certificate_c4_suite.ts` chạy trực tiếp trên PostgreSQL thực tế.

### 1.2. Giới hạn phạm vi (Scope Boundaries)
- **Frontend**: Giữ nguyên, không can thiệp mã nguồn frontend (`d:\e-learning`).
- **Phase tiếp theo**: Không bắt đầu F7.4-D hoặc các phân hệ khác.
- **Database Safety**: Không reset database, không xóa hoặc làm biến đổi dữ liệu baseline (2 chứng chỉ lịch sử đã được backfill mã code chuẩn `TMDEMY-CERT-2026-38EFECDF` và `TMDEMY-CERT-2025-700155F8`).

---

## 2. End-to-End Business Flow

Quy trình nghiệp vụ thực tế đã được kiểm thử và xác minh trên môi trường thật:

```text
Student (User)
  │
  ▼
1. Ghi danh hợp lệ (Enrollment status: ACTIVE / COMPLETED)
  │
  ▼
2. Hoàn thành điều kiện Tiến độ học tập (Progress >= 70%)
  │
  ▼
3. Khóa học có Quiz (Tổng số Quiz > 0)
  │
  ▼
4. Hoàn thành Quiz theo quy định (Tỷ lệ nộp Quiz >= 60%)
  │
  ▼
5. Tính điểm tổng kết theo công thức EXISTING (Final Grade >= 50%)
  │
  ▼
6. POST /api/certificates (Idempotent + Concurrency Protection)
  │
  ▼
7. Sinh mã chứng chỉ duy nhất: TMDEMY-CERT-YYYY-XXXXXXXX
  │
  ▼
8. PDFKit Engine tạo chứng chỉ Landscape A4:
   - Font Unicode tiếng Việt (Arial / Arial Bold)
   - Thông tin học viên, tên khóa học, điểm số, ngày cấp
   - Vector QR Code trỏ đến URL xác thực
  │
  ▼
9. Upload buffer lên Cloudinary (thư mục: certificates/)
  │
  ▼
10. Lưu bản ghi Certificate vào PostgreSQL qua Prisma Singleton
  │
  ▼
11. Học viên tra cứu: GET /api/certificates/my hoặc GET /api/certificates/course/:courseId
  │
  ▼
12. Công chúng xác thực: GET /api/certificates/verify/:code hoặc Quét mã QR
```

---

## 3. Business Test Matrix

Toàn bộ các kịch bản kiểm thử trong ma trận nghiệp vụ đã được thực thi và vượt qua 100% qua file test `scripts/test_certificate_c4_suite.ts`:

| Kịch bản kiểm thử | Dữ liệu đầu vào / Điều kiện | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **Ineligible 1** | Học viên chưa từng ghi danh vào khóa học (`Enrollment = null`) | Trả về `404 Not Found` ("You are not enrolled in this course!") | Nhận HTTP 404, thông báo lỗi chính xác | **PASS** |
| **Ineligible 2a** | Ghi danh hợp lệ nhưng `progress = 0%` (< 70%) | Trả về `400 Bad Request` ("Progress is less than 70%") | Nhận HTTP 400, thông báo lỗi chính xác | **PASS** |
| **Ineligible 2b** | Ghi danh hợp lệ nhưng `progress = 50%` (< 70%) | Trả về `400 Bad Request` ("Progress is less than 70%") | Nhận HTTP 400, thông báo lỗi chính xác | **PASS** |
| **Ineligible 3** | Đạt `progress = 100%`, nhưng khóa học chưa có bài Quiz nào | Trả về `400 Bad Request` ("This course does not have any quizzes") | Nhận HTTP 400, thông báo lỗi chính xác | **PASS** |
| **Ineligible 4** | Khóa học có Quiz nhưng học viên chưa nộp bài Quiz nào | Trả về `400 Bad Request` ("You have not submitted any quiz for this course") | Nhận HTTP 400, thông báo lỗi chính xác | **PASS** |
| **Ineligible 5** | Khóa có 2 Quiz, học viên chỉ nộp 1 bài (`50% < 60%`) | Trả về `400 Bad Request` ("Quiz submission percentage is less than 60%") | Nhận HTTP 400, thông báo lỗi chính xác | **PASS** |
| **Eligible** | Đủ điều kiện: `progress = 100%`, `quizCompletion = 100%` | Cấp chứng chỉ thành công, HTTP 200, sinh `code`, `grade`, `certificateUrl` | HTTP 200, cấp thành công mã `TMDEMY-CERT-2026-7844F28C`, grade `100` | **PASS** |
| **Duplicate POST** | Gửi tiếp yêu cầu cấp chứng chỉ cho khóa học đã được cấp | Trả về `400 Bad Request` ("You already have a certificate for this course!") | Nhận HTTP 400, từ chối cấp trùng | **PASS** |
| **Concurrent POST**| 2 requests đồng thời cùng lúc từ 1 học viên cho 1 khóa học | Duy nhất 1 request thành công, request thứ hai bị chặn bởi `(user_id, course_id)` unique constraint | 1 thành công (200), 1 từ chối (400), DB an toàn | **PASS** |
| **Query My Certs** | Gọi `GET /api/certificates/my` | Trả về danh sách chứng chỉ kèm chi tiết quan hệ khóa học (`title`, `slug`, `thumbnail`) | Trả về mảng chứa chứng chỉ kèm thông tin khóa học đầy đủ | **PASS** |
| **Query By Course**| Gọi `GET /api/certificates/course/:courseId` | Trả về chứng chỉ của khóa học đó | Trả về đúng chứng chỉ và khóa học tương ứng | **PASS** |
| **Query Unearned** | Gọi `GET /api/certificates/course/:courseId` cho khóa chưa học | Trả về `404 Not Found` | Nhận HTTP 404 ("Certificate not found for this course") | **PASS** |
| **Public Verify** | Gọi `GET /api/certificates/verify/:code` với mã hợp lệ | Trả về dữ liệu công khai đã khử định danh PII và internal IDs | Nhận HTTP 200, dữ liệu sạch, an toàn | **PASS** |
| **Verify Invalid** | Gọi `GET /api/certificates/verify/:code` với mã không tồn tại | Trả về `404 Not Found` | Nhận HTTP 404 ("Certificate not found or invalid verification code") | **PASS** |

---

## 4. Grade Calculation Verification

Hệ thống bảo toàn nghiêm ngặt công thức tính điểm hiện hành (**EXISTING formula**):

$$\text{finalGrade} = \frac{\text{progress} + \text{quizCompletionPercentage}}{2}$$

Trong đó:
- $\text{progress}$: Giá trị phần trăm tiến độ học tập lấy từ bản ghi `Enrollment` ($0 \le \text{progress} \le 100$).
- $\text{quizCompletionPercentage}$: Tỷ lệ hoàn thành các bài Quiz trong khóa học:
  $$\text{quizCompletionPercentage} = \frac{\text{Số Quiz đã nộp}}{\text{Tổng số Quiz trong khóa học}} \times 100$$
- Điều kiện tốt nghiệp tối thiểu: $\text{finalGrade} \ge 50\%$.

### Kiểm chứng thực tế:
- Với học viên kiểm thử: `progress = 100%`, nộp đủ 2/2 quiz (`quizCompletionPercentage = 100%`).
- Kết quả tính toán: $\frac{100 + 100}{2} = 100\%$.
- Kiểu dữ liệu lưu trong PostgreSQL: `Decimal(5, 2)`.
- Kiểu dữ liệu serialize trả về API: `number` (được convert qua `Number(cert.grade)` để bảo đảm tính tương thích với client JSON).

---

## 5. PDF Verification

Quá trình kiểm thử đã tạo trực tiếp file PDF và phân tích cấu trúc nhị phân thực tế:

1. **Khả năng mở & cấu trúc file**:
   - Header chuẩn: `%PDF-1.3`.
   - File nhị phân hợp lệ, dung lượng ~85 KB.
2. **Khổ giấy & Layout**:
   - Khổ tiêu chuẩn: **A4 Landscape** (`size: 'A4', layout: 'landscape'`, kích thước $841.89 \times 595.28$ pt).
   - Khung viền kép cao cấp: Viền ngoài màu Navy đậm (`#1e1b4b`, 3 pt) kết hợp viền trong màu Vàng Gold Hoàng gia (`#b45309`, 1.5 pt).
   - Góc trang trí vàng đồng tại 4 góc chứng chỉ.
   - Hoàn toàn **không tràn trang** (1 single page layout cố định).
3. **Hiển thị tiếng Việt Unicode**:
   - Đã nhúng 2 file font TrueType nguyên bản vào hệ thống:
     - `src/assets/fonts/Arial.ttf` (Regular)
     - `src/assets/fonts/Arial-Bold.ttf` (Bold)
   - Kiểm thử văn bản tiếng Việt có dấu: `"GIẤY CHỨNG NHẬN HOÀN THÀNH KHÓA HỌC"`, `"Chứng nhận học viên:"`, `"Đã hoàn thành xuất sắc khóa học:"`, `"Đạt kết quả chung cuộc: 100%"`.
   - Toàn bộ dấu tiếng Việt hiển thị sắc nét, không bị lỗi font, không mất ký tự.
4. **Mã QR Code & Đường dẫn xác thực**:
   - Được vẽ trực tiếp dưới dạng vector graphic bằng PDFKit (`doc.rect(...).fill()`), không bị vỡ hạt hay mờ khi phóng to.
   - Nội dung mã hóa trong QR Code:
     `http://localhost:3000/certificates/verify/TMDEMY-CERT-2026-7844F28C`
   - Kích thước ma trận QR: $37 \times 37$ modules (Model 2, Version 5, Byte mode, Error Correction Level L).

---

## 6. Cloudinary Verification

1. **Cấu hình & Tích hợp**:
   - Tự động phân tích chuỗi kết nối từ biến môi trường `CLOUDINARY_URL` hoặc cấu hình độc lập `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   - Fallback cloud name chính xác: `dxostp23y`.
2. **Xử lý thư mục & Khắc phục lỗi lặp (Folder Duplication Fix)**:
   - Trước khi sửa: Khi chỉ định `public_id: 'certificates/certificate_...'` và `folder: 'certificates'`, Cloudinary sinh URL lặp thư mục `certificates/certificates/...`.
   - Sau khi sửa: Tách biệt cấu hình sạch sẽ, `public_id` được sinh chính xác:
     `certificates/certificate_994c9c72-e1c9-4d6d-9146-4f154a76da74_0f2f155e-b95a-4b68-971a-11faaffe9cef`
   - URL Cloudinary trả về:
     `https://res.cloudinary.com/dxostp23y/raw/upload/v1791978523/certificates/certificate_994c9c72-e1c9-4d6d-9146-4f154a76da74_0f2f155e-b95a-4b68-971a-11faaffe9cef.pdf`
3. **Resource Type**: Sử dụng `resource_type: 'raw'` phù hợp với định dạng tài liệu PDF.

---

## 7. Public Verification Security (Bảo mật Xác thực Công khai)

Hệ thống tuân thủ mô hình **Zero Leak Security Model** cho endpoint `GET /api/certificates/verify/:code`:

| Tiêu chí bảo mật | Kết quả kiểm thử | Chi tiết đánh giá |
| :--- | :---: | :--- |
| **Không cần JWT** | **PASS** | Bất kỳ ai có mã code hoặc quét QR code đều có thể xác thực tính xác thực của chứng chỉ mà không cần tài khoản hay Access Token |
| **Mã code không dễ đoán** | **PASS** | Định dạng `TMDEMY-CERT-YYYY-XXXXXXXX` với 8 ký tự hex ngẫu nhiên sinh từ `crypto.randomBytes(4).toString('hex').toUpperCase()` ($2^{32} \approx 4.29$ tỷ tổ hợp) |
| **Không lộ internal database IDs** | **PASS** | Payload trả về đã lọc bỏ hoàn toàn `id`, `_id`, `userId`, `authorId`, `courseId`, `categoryId` |
| **Không lộ thông tin cá nhân (PII)**| **PASS** | Tuyệt đối không chứa `email`, `phone`, `password`, `refreshToken` của cả học viên lẫn giảng viên |
| **Không lộ Cloudinary secrets** | **PASS** | URL Cloudinary là đường dẫn CDN công khai, không lộ API Key, Secret hay console quản trị |
| **Dữ liệu công khai hợp lệ** | **PASS** | Chỉ bao gồm: Tên học viên, avatar học viên, tên khóa học, slug, thumbnail, tên giảng viên, mã chứng chỉ, điểm số, ngày cấp và link tải PDF |

---

## 8. Duplicate & Concurrency Tests

1. **Chống cấp trùng lặp (Double Click / Duplicate Request)**:
   - Nghiệp vụ kiểm tra sự tồn tại của chứng chỉ trước qua `findCertificateByUserAndCourse`.
   - Nếu bản ghi đã tồn tại -> lập tức từ chối với `400 Bad Request` ("You already have a certificate for this course!").
2. **Bảo vệ đồng thời (Concurrent Race Condition Protection)**:
   - Mô phỏng 2 request `POST /api/certificates` được gửi đồng thời cùng một mili-giây qua `Promise.allSettled`.
   - PostgreSQL enforce ràng buộc duy nhất ở tầng vật lý: `@@unique([userId, courseId])`.
   - Khi xảy ra xung đột đồng thời, Prisma trả mã lỗi `P2002` (Unique constraint violation), hàm Service bắt lỗi và chuyển đổi an toàn thành `400 Bad Request` ("A certificate is currently being processed or already exists for this course").
   - Kết quả: Không bao giờ xảy ra tình trạng sinh 2 chứng chỉ cho 1 khóa học.

---

## 9. Regression Results

Đã chạy toàn bộ bộ kiểm thử hồi quy Phase 7 (`scripts/test_phase7_suite.ts`) bao gồm 4 phân hệ liên kết:

```text
======================================================
   TMDEMY — PHASE 7 COMPREHENSIVE TEST SUITE
   Progress, Certificate, FavoriteCourse & Rating
======================================================

Baseline Database Record Counts:
- progress: 3549
- certificates: 2
- ratings: 3
- favorites: 6
- enrollments: 568
- orders: 21
- coupons: 2
- couponCourses: 2

SECTION 1: PROGRESS TESTS           ==> 10/10 PASS
SECTION 2: CERTIFICATE TESTS        ==> 7/7   PASS
SECTION 3: FAVORITE COURSE TESTS    ==> 7/7   PASS
SECTION 4: RATING TESTS             ==> 9/9   PASS
CLEANUP & DB INTEGRITY CHECKS       ==> 8/8   PASS

TOTAL TESTS: 41
PASSED:      41 (100%)
FAILED:      0
```

Toàn bộ các phân hệ liên quan (Enrollment, Progress, Quiz, Quiz Submission, Certificate) đều hoạt động ổn định và chính xác tuyệt đối.

---

## 10. Validation Results

| Hạng mục kiểm tra | Lệnh thực hiện | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **Prisma Schema & Migration** | `npx prisma migrate deploy` | **PASS** | Migration `20261014113500_add_certificate_code` áp dụng thành công |
| **Prisma Client Generation** | `npx prisma generate` | **PASS** | Prisma Client 6.4.1 đồng bộ với PostgreSQL vật lý |
| **C4 Integration Suite** | `npx tsx scripts/test_certificate_c4_suite.ts` | **PASS** | 100% kịch bản E2E thành công |
| **Phase 7 Regression Suite** | `npx tsx scripts/test_phase7_suite.ts` | **PASS** | 41/41 tests đạt 100% |
| **ESLint trên Certificate files** | `npx eslint <certificate_files>` | **PASS** | 0 errors, 0 warnings |
| **Prettier Format** | `npx prettier --check <certificate_files>`| **PASS** | 100% tuân thủ coding standards |
| **TypeScript Check (Phân hệ)** | `npx tsc --noEmit` | **PASS** | 0 errors trong các file Certificate |

---

## 11. Known Limitations (Hạn chế đã biết)

1. **Email Notification khi cấp chứng chỉ**:
   - Hiện tại hệ thống trả link PDF ngay trong response của `POST /api/certificates`. Việc tự động gửi email đính kèm hoặc thông báo Socket.IO thuộc phạm vi của hệ thống Notification tổng thể.
2. **Cloudinary Rate Limit**:
   - Quá trình upload PDF lên Cloudinary phụ thuộc vào kết nối mạng internet và hạn ngạch của gói tài khoản Cloudinary hiện tại. Trong trường hợp mạng chập chờn, đã có cơ chế bắt lỗi và trả `500 Internal Server Error` an toàn không làm hỏng dữ liệu DB.

---

## 12. Final Certificate Module Status

Phân hệ Chứng chỉ (`Certificate Module`) của TMdemy Backend:
- Đã được nâng cấp, tối ưu hóa và kiểm thử toàn diện.
- Đầy đủ 4 API tiêu chuẩn RESTful:
  1. `POST /api/certificates`
  2. `GET /api/certificates/my`
  3. `GET /api/certificates/course/:courseId`
  4. `GET /api/certificates/verify/:code`
- Đảm bảo 100% API contract, an toàn kiểu dữ liệu, bảo mật thông tin và tính tương thích ngược với hệ thống.
- **Trạng thái phân hệ**: **PRODUCTION READY (READY FOR REVIEW & PHASE CLOSURE)**.
