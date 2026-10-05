# SỔ ĐĂNG KÝ RỦI RO VÀ BIỆN PHÁP PHÒNG NGỪA (RISK REGISTER)
## PHASE 2: USER, CATEGORY & AUTHENTICATION MIGRATION
**Dự án**: TMDEMY E-Learning Backend  
**Database**: PostgreSQL 16.11 (`tmdemy`) qua Prisma ORM 6.4.1  
**Mục tiêu**: Nhận diện, phân loại mức độ và thiết lập giải pháp phòng ngừa triệt để các rủi ro kỹ thuật trong quá trình di trú Phase 2.

---

## 1. MA TRẬN TỔNG HỢP RỦI RO (RISK MATRIX)

| Mã Rủi ro | Tên Rủi ro | Khả năng | Mức độ | Mức rủi ro | Trạng thái phòng ngừa |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **R-01** | Cron job xóa nhầm tài khoản lịch sử | Trung bình | Nghiêm trọng | **CAO** | **ĐÃ CÓ GIẢI PHÁP TRIỆT ĐỂ** |
| **R-02** | Patch dữ liệu người dùng ngoài ý muốn / mất tính nguyên tử | Thấp | Nghiêm trọng | **TRUNG BÌNH** | **ĐÃ CÓ GIẢI PHÁP TRIỆT ĐỂ** |
| **R-03** | Lệch định dạng chữ hoa/thường của Role gây lỗi 403 Forbidden | Cao | Nghiêm trọng | **CAO** | **ĐÃ CÓ GIẢI PHÁP TRIỆT ĐỂ** |
| **R-04** | Áp dụng `withCompatId()` tùy tiện làm sai lệch API Contract | Trung bình | Trung bình | **TRUNG BÌNH** | **ĐÃ CÓ GIẢI PHÁP TRIỆT ĐỂ** |
| **R-05** | Lỗi biên dịch hoặc runtime của Mongoose Legacy Model | Trung bình | Trung bình | **TRUNG BÌNH** | **ĐÃ CÓ GIẢI PHÁP TRIỆT ĐỂ** |
| **R-06** | Rò rỉ thông tin nhạy cảm (Password, Token, OTP) | Thấp | Nghiêm trọng | **CAO** | **ĐÃ CÓ GIẢI PHÁP TRIỆT ĐỂ** |
| **R-07** | Đứt gãy 7 services Phase 3–8 phụ thuộc UserModel cũ | Trung bình | Nghiêm trọng | **CAO** | **ĐÃ CÓ GIẢI PHÁP TRIỆT ĐỂ** |

---

## 2. PHÂN TÍCH CHI TIẾT VÀ BIỆN PHÁP PHÒNG NGỪA TỪNG RỦI RO

### R-01: Cron job xóa nhầm tài khoản lịch sử
* **Nguyên nhân gốc**:
  * Logic cũ trên MongoDB truy vấn `{ isVerified: { $ne: '' } }`. Khi di trú sang PostgreSQL, toàn bộ chuỗi rỗng `''` đã chuyển thành `isVerified: false`.
  * Nếu cron job chạy điều kiện `isVerified: false` với mốc thời gian động `new Date()`, toàn bộ tài khoản lịch sử có thể bị xóa vĩnh viễn khỏi database.
* **Biện pháp phòng ngừa bắt buộc**:
  1. Thiết lập mốc thời gian cố định: `MIGRATION_CUTOFF_DATE = new Date('2026-10-01T00:00:00.000Z')`. Không dùng `new Date()` làm mốc bảo vệ động.
  2. Bổ sung điều kiện loại trừ vai trò: `role: { notIn: [UserRole.ADMIN, UserRole.TEACHER] }`.
  3. Chỉ dọn dẹp tài khoản thỏa mãn đồng thời 3 điều kiện:
     * `isVerified === false`
     * `role === 'USER'`
     * `createdAt > MIGRATION_CUTOFF_DATE` VÀ `createdAt < Date.now() - 24h`
  4. Thực hiện integration test hồi quy chứng minh 7 tài khoản lịch sử không bị ảnh hưởng khi cron kích hoạt.

---

### R-02: Patch dữ liệu người dùng ngoài ý muốn hoặc mất tính nguyên tử
* **Nguyên nhân gốc**:
  * Chạy script patch cập nhật trực tiếp dữ liệu mà không qua xác minh, hoặc cập nhật từng bản ghi rời rạc dẫn đến trạng thái dữ liệu dở dang nếu xảy ra lỗi giữa chừng.
* **Biện pháp phòng ngừa bắt buộc**:
  1. Script `scripts/migration-utils/patch-phase2-users.ts` mặc định chạy ở chế độ **`--dry-run`**.
  2. Cờ `--execute` chỉ được kích hoạt khi có phê duyệt riêng của Chủ dự án. Tuyệt đối không tự động chạy execute trong quá trình migration.
  3. Toàn bộ thao tác cập nhật 5 tài khoản Trusted Historical Accounts được bọc trong một Prisma Transaction duy nhất (`prisma.$transaction`).
  4. Cơ chế Sanity Pre-checks: Kiểm tra chính xác 5 UUID, đúng email tương ứng và trạng thái ban đầu là `isVerified === false`. Nếu có bất kỳ điểm nào không khớp, lập tức abort và rollback.

---

### R-03: Lệch định dạng chữ hoa/thường của Role gây lỗi 403 Forbidden
* **Nguyên nhân gốc**:
  * Prisma Client trả về giá trị enum viết hoa (`UserRole.ADMIN = 'ADMIN'`).
  * Middleware `verifyRole.ts` so sánh với `UserRole` trong `src/types/enum.ts` (có giá trị viết thường: `'admin'`).
  * Nếu JWT Access Token lưu `role: 'ADMIN'`, khi giải mã `req.user.role` sẽ là `'ADMIN'`. Câu lệnh `req.user.role !== 'admin'` sẽ trả về `true` $\rightarrow$ User nhận lỗi 403 Forbidden!
* **Biện pháp phòng ngừa bắt buộc**:
  1. Lập bảng đối chiếu Role chuẩn hóa trong `decisions-register.md` và `api-contract-audit.md`.
  2. Tầng Service Serializer chuyển đổi thuộc tính `role` từ Prisma Enum sang chuỗi thường (`'admin'`, `'teacher'`, `'user'`) trước khi đưa vào JWT Token payload hoặc trả về HTTP Response.
  3. Giữ nguyên 100% logic của `verifyRole.ts` và API Contract cũ của frontend Next.js.

---

### R-04: Áp dụng `withCompatId()` tùy tiện làm sai lệch API Contract
* **Nguyên nhân gốc**:
  * Áp dụng tự động hàm chèn `_id` vào mọi response, kể cả các endpoint thông báo thuần túy (như register, login, verify-otp, forgot-password) làm thay đổi cấu trúc JSON mà Postman hoặc Frontend đang kiểm tra.
* **Biện pháp phòng ngừa bắt buộc**:
  1. Không dùng middleware toàn cục hay wrapper tự động chèn `_id`.
  2. Chỉ áp dụng serialization có trường `_id` song song với `id` cho các entity User và Category thực tế trong trường `data`.
  3. Các endpoint trả về message thông báo thuần túy giữ nguyên 100% cấu trúc cũ.

---

### R-05: Lỗi biên dịch hoặc runtime của Mongoose Legacy Model
* **Nguyên nhân gốc**:
  * Khởi tạo lại Mongoose Model trong môi trường hot-reload hoặc import chéo gây lỗi `OverwriteModelError: Cannot overwrite 'User' model once compiled`.
* **Biện pháp phòng ngừa bắt buộc**:
  1. Trong `src/models/legacy/user.legacy.model.ts`, sử dụng mẫu singleton an toàn:
     `const UserModel = mongoose.models.User || model<User>('User', userSchema)`
  2. Giữ nguyên cấu trúc schema và interface cũ, không thêm bớt trường.
  3. Kiểm tra tính toàn vẹn của TypeScript alias `~/models/legacy/user.legacy.model` qua `npx tsc --noEmit`.

---

### R-06: Rò rỉ thông tin nhạy cảm (Password, Token, OTP)
* **Nguyên nhân gốc**:
  * Truy vấn database bằng Prisma mặc định trả về toàn bộ các cột nếu không chỉ định `select`, vô tình để lộ `password`, `refreshToken`, `otpCode`, `resetPasswordToken` ra Public API.
* **Biện pháp phòng ngừa bắt buộc**:
  1. Phòng thủ 2 tầng:
     * Tuyến 1 (Database Layer): Sử dụng các hằng số `USER_PUBLIC_SELECT` chỉ chọn các cột an toàn trong `user.repository.ts`.
     * Tuyến 2 (Application Layer): Sử dụng `userPublicSchema.parse()` của Zod để loại bỏ triệt để mọi trường lạ trước khi gửi response.
  2. Tuyệt đối không trả về `req.user` chứa thông tin nhạy cảm.

---

### R-07: Đứt gãy 7 services Phase 3–8 phụ thuộc UserModel cũ
* **Nguyên nhân gốc**:
  * Khi `user.model.ts` chuyển sang Zod thuần túy, các service chưa migrate (Phase 3–8) đang gọi Mongoose methods (`UserModel.find`, `UserModel.findById`, `UserModel.countDocuments`) sẽ bị lỗi TypeScript và runtime.
* **Biện pháp phòng ngừa bắt buộc**:
  1. Đã lập bản đồ phụ thuộc chính xác 7 services trong `dependency-map.md`.
  2. Cập nhật đồng bộ import của cả 7 services này trỏ tới `~/models/legacy/user.legacy.model`.
  3. Chạy lệnh kiểm tra biên dịch `npx tsc --noEmit` đạt 0 lỗi trước khi tiến hành viết code services mới.
