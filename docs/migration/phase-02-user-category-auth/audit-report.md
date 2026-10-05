# BÁO CÁO KIỂM TOÁN TIỀN DI TRÚ — HIỆU CHỈNH TOÀN DIỆN (AUDIT REVISION REPORT)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES
**Dự án**: TMDEMY E-Learning Backend  
**Database Đích**: PostgreSQL 16.11 (`tmdemy`) qua Prisma ORM 6.4.1  
**Chế độ thực thi**: STRICT READ-ONLY AUDIT & PLANNING REVISION  
**Tác giả**: Senior Backend Architect & Senior Node.js/TypeScript Engineer  
**Ngày cập nhật**: 2026-10-01  

---

## 1. TỔNG QUAN ĐIỀU HÀNH & CÁC HIỆU CHỈNH KIẾN TRÚC THEO CHỈ THỊ MỚI

Thực hiện chỉ thị mới nhất của Chủ dự án, báo cáo kiểm toán Phase 2 được hiệu chỉnh toàn diện về 3 quyết định mấu chốt:

1. **Hiệu chỉnh D1 (`is_verified` của 7 tài khoản lịch sử)**:
   * **Bãi bỏ hoàn toàn đề xuất tự động cập nhật `true` cho toàn bộ 7 tài khoản**.
   * Đã tiến hành kiểm toán sâu từng tài khoản, đối chiếu giữa dữ liệu nguồn MongoDB (qua log Phase 1 Data Migration) và hiện trạng PostgreSQL, phân tích bằng chứng xác thực thực tế (hoạt động mua khóa học, tạo nội dung, bình luận, làm bài quiz).
   * Phân loại chi tiết: Tài khoản có bằng chứng tin cậy vững chắc vs. Tài khoản chưa đủ bằng chứng cần giữ nguyên trạng thái `false`.
   * Thiết kế script vá dữ liệu có chế độ `--dry-run`, hiển thị chi tiết trước khi can thiệp.
   * Phân tích lại Cron job `deleteUnverifiedUsers.ts` để loại trừ rủi ro xóa nhầm tài khoản lịch sử.

2. **Hiệu chỉnh D2 (Tách biệt Mongoose Legacy Model)**:
   * **Không nhúng Mongoose model vào trong `src/models/*.model.ts`**.
   * `src/models/user.model.ts`: **Chỉ chứa duy nhất Zod Application Models & Inferred Types**.
   * `src/models/category.model.ts`: **Chỉ chứa duy nhất Zod Application Models & Inferred Types**.
   * Mongoose Model cũ được tách riêng sang `src/models/legacy/user.legacy.model.ts` chỉ để phục vụ 7 service chưa di trú của Phase 3–8.
   * Không tạo legacy model cho Category vì không có module nào ngoài Phase 2 import `CategoryModel`.

3. **Chấp thuận D3 (Chuẩn hóa Validator Category DELETE)**:
   * Phê duyệt sửa route `DELETE /api/admin/categories/:id`: thay thế `courseIdValidator` (lỗi từ code cũ) bằng `categoryIdValidator` chuẩn UUID.
   * Giữ nguyên 100% URL, HTTP method, nghiệp vụ xóa mềm (`isDestroyed: true`), bổ sung test case cho UUID hợp lệ và không hợp lệ.

---

## 2. ĐỐI CHIẾU VÀ ĐÁNH GIÁ BẰNG CHỨNG XÁC THỰC CỦA 7 TÀI KHOẢN LỊCH SỬ

Qua đối chiếu giữa báo cáo Data Migration Phase 1 (`PHASE_1_USERS_CATEGORIES_REPORT.md`), file ánh xạ ID v5 (`scripts/migration-logs/id_map_audit.json`) và truy vấn thực tế các bảng quan hệ trong PostgreSQL `tmdemy`:

### 2.1. Bảng Kiểm toán Chi tiết Từng Tài khoản

| # | PostgreSQL UUID v5 | MongoDB Source ID | Username | Email (Masked) | Role | Status | isVerified gốc | Bằng chứng hoạt động thực tế trong Database | Đề xuất phân loại |
| :-: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **1** | `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | `68cade1dc90d6a22b6820cbc` | `new_username123` | `tha***612@gmail.com` | **ADMIN** | `ACTIVE` | `""` | Tạo toàn bộ 3 Danh mục gốc (`categories`), tác giả của 2 khóa học. Quản trị viên hệ thống. | **Bằng chứng Cực Mạnh** $\rightarrow$ Đề xuất duyệt kích hoạt (`true`) |
| **2** | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `68d3f7077891a37931bcde17` | `nguyen_anh_binh` | `na***@gmail.com` | **TEACHER** | `ACTIVE` | `""` | Tác giả của 5 khóa học, 7 bài học, 1 bình luận. Giảng viên nòng cốt của hệ thống. | **Bằng chứng Cực Mạnh** $\rightarrow$ Đề xuất duyệt kích hoạt (`true`) |
| **3** | `6dd1ccd9-420b-5c6d-8322-75223e67e549` | `68d37f121c7c07a175fd30f5` | `teacher_cntt` | `tea***ntt@gmail.com` | **TEACHER** | `ACTIVE` | `""` | Tác giả của 1 khóa học, 1 đơn hàng, 1 lượt đăng ký học. Giảng viên đã xuất bản nội dung. | **Bằng chứng Cực Mạnh** $\rightarrow$ Đề xuất duyệt kích hoạt (`true`) |
| **4** | `c55de839-f059-519c-8820-b16aa17fb9c3` | `68dcf8f9e3617ec76053b4d7` | `minhsuyyyyy` | `tha***204@gmail.com` | **USER** | `ACTIVE` | `""` | **6 đơn hàng, 3 enrollments, 4 bình luận, 1 đánh giá rating, 2 bài nộp quiz**. Học viên thực tế đang học. | **Bằng chứng Cực Mạnh** $\rightarrow$ Đề xuất duyệt kích hoạt (`true`) |
| **5** | `02e8e13a-dab2-5fb6-a14f-933ac125edca` | `68cbde2502a48312779b9252` | `thaiminh` | `tha***ope@gmail.com` | **USER** | `ACTIVE` | `""` | **1 đơn hàng, 1 enrollment, 3 bình luận**. Học viên thực tế đã hoàn thành thanh toán. | **Bằng chứng Cực Mạnh** $\rightarrow$ Đề xuất duyệt kích hoạt (`true`) |
| **6** | `773e6719-acb0-5750-b06d-7445812f40b3` | `68cbdb3372b7cc923d7f4cd2` | `thaiminh` | `tha***112@gmail.com` | **USER** | `ACTIVE` | `""` | **0 đơn hàng, 0 khóa học, 0 bình luận, 0 quiz**. Không có bất kỳ liên kết dữ liệu nào. | **KHÔNG ĐỦ BẰNG CHỨNG** $\rightarrow$ Giữ nguyên `false`, đưa vào danh sách cần xử lý |
| **7** | `6b760425-effa-5713-99ba-b296e6cf190d` | `68fd9ea4bd4da2646013d414` | `levanquang` | `lev***vn@gmail.com` | **USER** | `ACTIVE` | `""` | **0 đơn hàng, 0 khóa học, 0 bình luận, 0 quiz**. Không có bất kỳ liên kết dữ liệu nào. | **KHÔNG ĐỦ BẰNG CHỨNG** $\rightarrow$ Giữ nguyên `false`, đưa vào danh sách cần xử lý |

### 2.2. Kết luận Đề xuất Xử lý
* **Nhóm Đủ Bằng Chứng (5 tài khoản)**:
  * Gồm 1 Admin, 2 Teachers, 2 Users. Tất cả đều có bằng chứng nghiệp vụ rõ ràng (sở hữu khóa học, có đơn hàng, bình luận, nộp bài).
  * Chỉ cập nhật `is_verified = true` cho 5 tài khoản này khi có sự phê duyệt rõ ràng từ Chủ dự án.
* **Nhóm Chưa Đủ Bằng Chứng (2 tài khoản)**:
  * Gồm 2 tài khoản User (`thaiminh06112@gmail.com` và `levanquang2k3.vn@gmail.com`).
  * **Giữ nguyên trạng thái `isVerified = false`**.
  * Cần có quyết định nghiệp vụ riêng: người dùng phải kích hoạt qua OTP hoặc được Admin kích hoạt thủ công.

---

## 3. PHÂN TÍCH LẠI CRON JOB `deleteUnverifiedUsers.ts`

### 3.1. Phân tích Bản chất Logic Cũ
Trong mã nguồn cũ:
```typescript
UserModel.deleteMany({
  isVerified: { $ne: '' },
  createdAt: { $lt: expireTime }
})
```
* Điều kiện MongoDB `{ $ne: '' }` có nghĩa là: **Xóa các tài khoản có `isVerified` KHÁC chuỗi rỗng `''`**.
* Do 7 tài khoản nguồn đều mang giá trị `isVerified = ''`, trong hệ thống MongoDB cũ, **7 tài khoản này KHÔNG BAO GIỜ BỊ CRON JOB XÓA**!
* Cron job cũ chỉ nhằm xóa các tài khoản mới đăng ký qua form Register (được gán `isVerified: false`).

### 3.2. Nguy cơ khi Chuyển sang Prisma
Trong Prisma, cột `is_verified` là `Boolean`. Giá trị chuỗi rỗng đã bị map thành `false`. Nếu cron job mới viết đơn giản là:
`prisma.user.deleteMany({ where: { isVerified: false, createdAt: { lt: expireTime } } })`
$\rightarrow$ **SẼ XÓA SẠCH CẢ 2 TÀI KHOẢN CHƯA ĐỦ BẰNG CHỨNG LỊCH SỬ NÊU TRÊN**!

### 3.3. Giải pháp Bảo vệ Cốt lõi cho Cron Job Mới
Cron job mới trong `src/cronJobs/deleteUnverifiedUsers.ts` bắt buộc phải có các điều kiện phòng vệ:
1. **Chặn theo Role**: Tuyệt đối không xóa tài khoản có `role = 'ADMIN'` hoặc `role = 'TEACHER'`.
2. **Chặn theo Dữ liệu Liên kết**: Không xóa bất kỳ tài khoản nào đã có đơn hàng (`orders`), lượt học (`enrollments`), hoặc bình luận (`comments`).
3. **Chặn theo Mốc Di trú (Migration Cutoff Date)**: Chỉ dọn dẹp các tài khoản đăng ký mới **sau thời điểm migration Phase 2**. Các tài khoản lịch sử tạo trước mốc này được giữ nguyên để chờ xử lý nghiệp vụ.

---

## 4. BẢO TOÀN HỢP ĐỒNG API VÀ PHẢN HỒI (API CONTRACT INTEGRITY)

* **Serializer & Dữ liệu Trả về**:
  * Không tùy tiện thêm `_id` hoặc `id` vào tất cả response nếu contract cũ không có.
  * Với các endpoint User detail (`getMe`, `profile`, `updateMe`, `getAllUsers`), bảo toàn trường `_id` theo đúng contract Postman để tránh làm gãy Next.js Frontend.
  * Tái cấu trúc chính xác trường `socialLinks`:
    ```json
    "socialLinks": {
      "facebook": user.socialFacebook || "",
      "instagram": user.socialInstagram || "",
      "github": user.socialGithub || ""
    }
    ```
* **Bảo vệ Tuyệt đối Dữ liệu Nhạy cảm**:
  * Các trường `password`, `otpCode`, `otpExpires`, `refreshToken`, `resetPasswordToken`, `resetPasswordExpires` **KHÔNG BAO GIỜ** được xuất hiện trong JSON response ở bất kỳ endpoint nào.
  * Đảm bảo bằng 2 tầng: `USER_PUBLIC_SELECT` tại Repository và `userPublicSchema.parse()` tại Service.

---

## 5. THIẾT KẾ SCRIPT VÁ DỮ LIỆU CÓ CHẾ ĐỘ `--dry-run`

Script `scripts/migration-utils/patch-phase2-users.ts` được thiết kế chặt chẽ theo nguyên tắc an toàn:
* Mặc định chạy ở chế độ **`--dry-run`**:
  * Quét danh sách 5 tài khoản có bằng chứng xác thực đầy đủ.
  * In ra màn hình chi tiết: Source ID, Email (đã mask), Role, Bằng chứng hoạt động.
  * **Không thực hiện bất kỳ lệnh ghi nào vào PostgreSQL**.
* Chỉ khi có tham số **`--execute`** và được Chủ dự án đồng ý, script mới chạy một câu lệnh cập nhật có điều kiện chính xác:
  ```typescript
  await prisma.user.updateMany({
    where: {
      id: { in: VERIFIED_ACCOUNTS_UUIDS },
      isVerified: false
    },
    data: {
      isVerified: true
    }
  })
  ```
* Hai tài khoản không đủ bằng chứng (`773e6719...` và `6b760425...`) **tuyệt đối không nằm trong danh sách cập nhật**.

---

## 6. KẾT LUẬN & CAM KẾT READ-ONLY

Báo cáo kiểm toán hiệu chỉnh đã bám sát 100% các yêu cầu mới của Chủ dự án:
* Đã phân loại minh bạch từng tài khoản lịch sử với đầy đủ bằng chứng.
* Đã hiệu chỉnh kiến trúc Hybrid Model sang mô hình tách biệt sạch sẽ (`src/models/legacy/`).
* Đã chuẩn hóa lộ trình sửa validator Category DELETE.
* **Toàn bộ codebase vẫn đang được giữ nguyên trạng READ-ONLY**.
