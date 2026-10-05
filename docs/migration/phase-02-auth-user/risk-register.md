# SỔ ĐĂNG KÝ RỦI RO (RISK REGISTER)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES

---

## 1. MA TRẬN ĐÁNH GIÁ RỦI RO (RISK MATRIX)

| Mã Rủi Ro | Mô tả rủi ro | Xác suất | Tác động | Mức độ rủi ro | Trạng thái |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **R1** | **Xóa nhầm 7 tài khoản lịch sử do lệch ngữ nghĩa `isVerified`** | Cao | Nghiêm trọng | **RẤT CAO** | Cần phê duyệt phương án |
| **R2** | **Gãy build các Phase 3–10 do xóa bỏ `UserModel` Mongoose** | Cao | Nghiêm trọng | **RẤT CAO** | Đã có giải pháp Hybrid |
| **R3** | **Next.js Frontend bị vỡ giao diện do mất trường `_id` hoặc cấu trúc `socialLinks`** | Trung bình | Cao | **CAO** | Đã có giải pháp `withCompatId` |
| **R4** | **Lỗi 400 Bad Request trên toàn bộ request gửi UUID vào Validator cũ** | Rất cao | Cao | **CAO** | Đã có giải pháp UUID Validator |
| **R5** | **Rò rỉ thông tin nhạy cảm (`password`, `tokens`, `otp`) ra API Public Response** | Trung bình | Nghiêm trọng | **CAO** | Đã có giải pháp Zod Sanitization |
| **R6** | **Xóa nhầm Admin cuối cùng gây khóa hệ thống vĩnh viễn** | Thấp | Nghiêm trọng | **TRUNG BÌNH**| Đã có chốt chặn kiểm tra số lượng |
| **R7** | **Lỗi kết nối gửi email SMTP trong môi trường test làm gián đoạn luồng OTP/Reset** | Trung bình | Thấp | **THẤP** | Đã có cơ chế mock/bypass an toàn |

---

## 2. PHÂN TÍCH CHI TIẾT & BIỆN PHÁP GIẢM THIỂU RỦI RO

### R1: Nguy cơ xóa hoặc khóa 7 tài khoản lịch sử do bất nhất `isVerified`
* **Mô tả**: Trong MongoDB cũ, các tài khoản hoạt động từng mang giá trị `isVerified: ''` (chuỗi rỗng). Khi chuyển sang PostgreSQL, transformer gán giá trị mặc định `false`. Hiện 100% 7 tài khoản trong DB đều có `is_verified = false`.
* **Hậu quả nếu không xử lý**:
  1. `loginValidator` chặn đăng nhập: `if (!user.isVerified) throw new Error(...)`.
  2. Cron job `deleteUnverifiedUsers` sẽ xóa sạch 7 tài khoản (kể cả admin và teacher).
* **Biện pháp giảm thiểu (Mitigation)**:
  * Trình chủ dự án phê duyệt chạy script vá dữ liệu một lần (`patch-phase2-users.ts`) để cập nhật 7 tài khoản lịch sử sang `is_verified = true`.
  * Tạm thời tắt hoặc đặt cờ an toàn trong Cron job để không xóa các tài khoản có `role = 'ADMIN'` hoặc `role = 'TEACHER'` ngay cả khi `isVerified = false`.

---

### R2: Gãy build các module Phase 3–10 do xóa bỏ Mongoose Model sớm
* **Mô tả**: `src/models/user.model.ts` đang được import bởi 7 services chưa di trú (`course.service.ts`, `comment.service.ts`, `order.service.ts`, `enrollment.service.ts`, `rating.service.ts`, `quizSubmission.service.ts`, `quiz.service.ts`).
* **Hậu quả**: Nếu xóa file hoặc xóa export Mongoose Model, TypeScript compilation sẽ báo lỗi hàng loạt và backend không thể khởi động.
* **Biện pháp giảm thiểu (Mitigation)**:
  * Áp dụng **Hybrid Transitional Model Pattern** tại `src/models/user.model.ts`: xuất song song cả Zod Application Model (cho Phase 2) và Mongoose Model (cho các Phase sau).
  * Chạy `npx tsc --noEmit` sau khi sửa model để đảm bảo 0 lỗi biên dịch.

---

### R3: Frontend Next.js bị vỡ do khác biệt schema giữa MongoDB và PostgreSQL
* **Mô tả**:
  1. Frontend đọc `user._id` thay vì `user.id`.
  2. Frontend đọc `user.socialLinks.facebook` thay vì `user.socialFacebook`.
  3. Frontend đọc `category._destroy` thay vì `category.isDestroyed`.
* **Hậu quả**: Giao diện client hiển thị trống, không load được profile, không load được avatar, hoặc lỗi runtime undefined.
* **Biện pháp giảm thiểu (Mitigation)**:
  * Tích hợp hàm `withCompatId()` từ `src/utils/uuid.ts` vào tất cả dữ liệu trả về từ Service layer, luôn đảm bảo bản ghi có cả `id` và `_id`.
  * Trong Service, bóc tách và đóng gói trường `socialLinks` đúng cấu trúc object như cũ.
  * Trong Category, giữ trường alias `_destroy` khớp với `isDestroyed`.

---

### R4: Lỗi 400 Bad Request trên toàn bộ request gửi UUID vào Validator cũ
* **Mô tả**: Các validator cũ dùng `mongoose.Types.ObjectId.isValid` hoặc `.isMongoId()`. Khi frontend hoặc Postman gửi UUID (chuỗi 36 ký tự có dấu gạch ngang), validator sẽ từ chối và trả về HTTP 400.
* **Hậu quả**: Toàn bộ các API `GET /api/users/profile/:id`, `PUT /api/admin/users/:id`, `DELETE /api/admin/users/:id`, `GET /api/admin/users/:id`, `DELETE /api/admin/categories/:id` bị tê liệt.
* **Biện pháp giảm thiểu (Mitigation)**:
  * Thay thế toàn diện bằng `isValidUUID` từ `src/utils/uuid.ts`.
  * Sửa lỗi route `DELETE /api/admin/categories/:id` đang dùng nhầm `courseIdValidator`.

---

### R5: Rò rỉ thông tin nhạy cảm (`password`, `tokens`, `otp`) ra API Public Response
* **Mô tả**: Khi truy vấn User từ PostgreSQL qua Prisma, nếu không dùng `select` hoặc vô tình trả về raw record, các trường băm mật khẩu `password`, token bí mật `refreshToken`, mã OTP `otpCode`, token reset mật khẩu `resetPasswordToken` sẽ xuất hiện trong API response.
* **Hậu quả**: Lỗ hổng bảo mật nghiêm trọng (Information Disclosure).
* **Biện pháp giảm thiểu (Mitigation)**:
  * Thiết lập nguyên tắc 2 lớp phòng thủ:
    * Lớp 1 (Database Engine): Repository luôn dùng `USER_PUBLIC_SELECT` khi lấy thông tin hiển thị.
    * Lớp 2 (Application Model): Service luôn đưa dữ liệu qua `userPublicSchema.parse(user)` trước khi trả về Controller.

---

### R6: Nguy cơ xóa tài khoản Admin cuối cùng gây khóa hệ thống
* **Mô tả**: Khi gọi API `DELETE /api/admin/users/:id`, nếu xóa nhầm tài khoản Admin duy nhất, hệ thống sẽ không còn ai có quyền quản trị.
* **Biện pháp giảm thiểu (Mitigation)**:
  * Triển khai 2 chốt chặn cứng trong `deleteUserByAdminService`:
    1. Chặn tự xóa chính mình: `performedBy === id` -> trả về lỗi `400 Bad Request` (`SELF_DELETE_BLOCKED`).
    2. Chặn xóa admin cuối cùng: `countAdminsExcluding(id) === 0` -> trả về lỗi `409 Conflict` (`LAST_ADMIN`).

---

### R7: Lỗi gửi email SMTP trong môi trường test
* **Mô tả**: Khi chạy test tự động đăng ký hoặc quên mật khẩu, nếu mạng chập chờn hoặc cấu hình SMTP nodemailer bị lỗi, test suite sẽ bị treo hoặc fail.
* **Biện pháp giảm thiểu (Mitigation)**:
  * Trong test suite, bọc lời gọi gửi email hoặc kiểm tra cờ môi trường (`NODE_ENV === 'test'`) để log mock email thay vì làm fail cả transaction.

---

## 3. CÁC QUYẾT ĐỊNH CẦN CHỦ DỰ ÁN PHÊ DUYỆT TRƯỚC KHI TRIỂN KHAI

Để đảm bảo Phase 2 diễn ra an toàn và đúng mục tiêu, kính đề nghị chủ dự án xem xét và phê duyệt 3 quyết định sau:

1. **Phê duyệt Quyết định D1 (Data Patch cho `is_verified`)**:
   * Cho phép chạy 1 script migration nhỏ cập nhật `is_verified = true` cho 7 tài khoản lịch sử hiện có trong PostgreSQL, đồng thời chuẩn hóa toàn bộ backend theo kiểu dữ liệu Boolean.
2. **Phê duyệt Quyết định D2 (Mô hình Hybrid Transitional Model)**:
   * Cho phép `src/models/user.model.ts` xuất cả Zod schemas và Mongoose compatibility model để không làm gãy các Phase 3–10.
3. **Phê duyệt Quyết định D3 (Sửa lỗi validator Category DELETE)**:
   * Cho phép thay thế `courseIdValidator` tại route `DELETE /api/admin/categories/:id` bằng `categoryIdValidator` với chuẩn UUID.
