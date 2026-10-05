# SỔ ĐĂNG KÝ QUYẾT ĐỊNH KIẾN TRÚC (DECISIONS REGISTER)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES
**Dự án**: TMDEMY E-Learning Backend  
**Database Đích**: PostgreSQL 16.11 (`tmdemy`) qua Prisma ORM 6.4.1  
**Mục đích**: Ghi nhận chính thức tình trạng phê duyệt, điều kiện ràng buộc, định nghĩa kỹ thuật chuẩn xác và các tiêu chí tiên quyết trước khi bước vào giai đoạn Implementation.

---

## 1. TỔNG HỢP TRẠNG THÁI CÁC QUYẾT ĐỊNH (DECISIONS SUMMARY)

| Mã | Nội dung Quyết định | Trạng thái | Ghi chú phê duyệt & Điều kiện thực thi |
| :---: | :--- | :---: | :--- |
| **D1** | **Xử lý tài khoản người dùng lịch sử (`is_verified`)** | **PHÊ DUYỆT CÓ ĐIỀU KIỆN** | • Phân loại rõ ràng: 5 tài khoản "Trusted historical accounts" được chấp thuận patch; 2 tài khoản chưa đủ bằng chứng tiếp tục giữ `isVerified = false`.<br>• Script patch mặc định `--dry-run`, chỉ chạy `--execute` khi có phê duyệt riêng.<br>• Chạy trong database transaction, có pre-check assertions, tự động abort nếu dữ liệu không khớp. |
| **D2** | **Tách biệt Mongoose Legacy Model & Zod thuần** | **PHÊ DUYỆT CÓ ĐIỀU KIỆN** | • `src/models/user.model.ts` và `category.model.ts` là Zod Application Model thuần túy.<br>• Tách Mongoose Model cũ sang `src/models/legacy/user.legacy.model.ts` với mẫu singleton an toàn phục vụ 7 services Phase 3–8.<br>• Không tạo legacy model cho Category. Giữ nguyên package Mongoose trước Phase 11. |
| **D3** | **Sửa lỗi validator tại route DELETE Category** | **ĐÃ PHÊ DUYỆT CHÍNH THỨC** | • Thay thế `courseIdValidator` bằng `categoryIdValidator` chuẩn UUID tại route `DELETE /api/admin/categories/:id`.<br>• Giữ nguyên URL, HTTP method, logic xóa mềm (`isDeleted = true`).<br>• Bổ sung integration tests cho cả UUID hợp lệ và không hợp lệ. |
| **D4** | **Tính nhất quán của User Role (Role Consistency)** | **ĐÃ PHÊ DUYỆT CHÍNH THỨC** | • Bảo toàn giá trị lowercase (`'admin'`, `'teacher'`, `'user'`) tại API Response, JWT Payload và Middleware `verifyRole.ts`.<br>• Map tương thích 2 chiều với Prisma Client Enum (`UserRole.ADMIN`, `UserRole.TEACHER`, `UserRole.USER`) tại Service/Repository Layer. |

---

## 2. CHI TIẾT TỪNG QUYẾT ĐỊNH VÀ ĐIỀU KIỆN THỰC THI

### 2.1. Quyết định D1: Xử lý 7 Tài khoản Lịch sử & Bảo vệ Cron Job

#### A. Định nghĩa phân loại kỹ thuật chuẩn xác
* **"Verified by OTP"**: Tài khoản có bằng chứng xác thực trực tiếp qua OTP code / thời gian xác thực. Trong dữ liệu MongoDB cũ, toàn bộ 7 tài khoản đều có trường `isVerified: ''` (chuỗi rỗng) và `otp_code` rỗng, do đó **không có tài khoản nào có bằng chứng xác thực trực tiếp qua OTP**.
* **"Trusted historical account" (Tài khoản lịch sử đáng tin cậy)**: Tài khoản lịch sử đã có dữ liệu hoạt động nghiệp vụ thực tế gắn liền với hệ thống (tạo Category, xuất bản Course, tạo Order, ghi nhận Enrollment, gửi Comment, làm Quiz) và được Chủ dự án chấp thuận tiếp tục sử dụng trong hệ thống mới.
* **Quy tắc tuyệt đối**: **KHÔNG ĐƯỢC** mô tả hành động mua khóa học, tạo Course hay bình luận là "bằng chứng OTP".

#### B. Phân loại và chỉ định xử lý 7 tài khoản lịch sử
1. **5 Tài khoản Trusted Historical Accounts được Chủ dự án chấp thuận đưa vào danh sách patch (`isVerified = true`)**:
   * `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` (`new_username123`, `ADMIN`): Đã tạo toàn bộ 3 Categories và 2 Courses hệ thống.
   * `13608f92-8acf-53e3-adcb-0d832e9cb1d4` (`nguyen_anh_binh`, `TEACHER`): Tác giả của 5 Courses, 7 Lessons, 1 Comment.
   * `6dd1ccd9-420b-5c6d-8322-75223e67e549` (`teacher_cntt`, `TEACHER`): Tác giả của 1 Course, 1 Order, 1 Enrollment.
   * `c55de839-f059-519c-8820-b16aa17fb9c3` (`minhsuyyyyy`, `USER`): Có 6 Orders, 3 Enrollments, 4 Comments, 1 Rating, 2 Quiz Submissions.
   * `02e8e13a-dab2-5fb6-a14f-933ac125edca` (`thaiminh`, `USER`): Có 1 Order, 1 Enrollment, 3 Comments.

2. **2 Tài khoản chưa đủ bằng chứng nghiệp vụ tiếp tục giữ nguyên `isVerified = false`**:
   * `773e6719-acb0-5750-b06d-7445812f40b3` (`tha***112@gmail.com`, `USER`): 0 Course, 0 Order, 0 Enrollment, 0 Comment.
   * `6b760425-effa-5713-99ba-b296e6cf190d` (`lev***vn@gmail.com`, `USER`): 0 Course, 0 Order, 0 Enrollment, 0 Comment.
   * *Hành vi*: Khi 2 tài khoản này đăng nhập, hệ thống sẽ trả về lỗi yêu cầu xác thực email theo đúng logic nghiệp vụ của `loginValidator`.

#### C. Đặc tả kỹ thuật bắt buộc của Patch Script (`patch-phase2-users.ts`)
* **Chế độ thực thi**: Mặc định chạy ở chế độ **`--dry-run`**. Chỉ hiển thị bảng tổng hợp các tài khoản dự kiến thay đổi mà không thực hiện ghi database.
* **Cờ `--execute`**: Chỉ được phép chạy khi có chỉ đạo và phê duyệt riêng bằng văn bản từ Chủ dự án. Tuyệt đối **không tự động chạy `--execute`** trong quá trình Implementation.
* **Tính nguyên tử (Transaction)**: Toàn bộ quá trình cập nhật phải được bọc trong một Prisma Transaction duy nhất (`prisma.$transaction`).
* **Kiểm tra tiền điều kiện (Sanity Pre-checks)**:
  1. Kiểm tra chính xác số lượng tài khoản đích là 5 bản ghi.
  2. Đối chiếu từng UUID phải khớp với email tương ứng trong cơ sở dữ liệu.
  3. Xác nhận trạng thái hiện tại của cả 5 tài khoản phải là `isVerified === false`.
  4. Nếu có bất kỳ sai lệch nào về UUID, email hoặc trạng thái, script phải ngay lập tức **ABORT** và rollback toàn bộ transaction.
* **Báo cáo kết quả**: Xuất chi tiết số lượng bản ghi thực tế đã cập nhật, danh sách ID và thời gian hoàn thành.

#### D. Quy tắc an toàn bảo vệ tài khoản lịch sử trong Cron Job (`deleteUnverifiedUsers.ts`)
* **Mốc thời gian bảo vệ cố định (Fixed Cutoff Date)**:
  * Thiết lập hằng số cố định: `MIGRATION_CUTOFF_DATE = new Date('2026-10-01T00:00:00.000Z')` (thời điểm chốt di trú Phase 2).
  * Tài liệu giải thích: Tất cả các tài khoản được tạo trước mốc `MIGRATION_CUTOFF_DATE` là tài khoản lịch sử được migrate từ MongoDB sang, tuyệt đối không thuộc diện xóa dọn dẹp.
  * **CẤM**: Tuyệt đối không dùng `new Date()` làm mốc bảo vệ động sinh mới trong mỗi lần cron chạy.
* **Điều kiện lọc bảo vệ (Safety Query Predicates)**:
  * Không xóa bất kỳ tài khoản nào có vai trò quản trị hoặc giảng viên: `role: { notIn: [UserRole.ADMIN, UserRole.TEACHER] }`.
  * Không xóa bất kỳ tài khoản nào tạo trước mốc cố định: `createdAt: { gt: MIGRATION_CUTOFF_DATE }`.
  * Chỉ dọn dẹp các tài khoản đăng ký mới sau mốc cutoff, chưa xác thực OTP (`isVerified: false`) và đã quá hạn 24 giờ (`createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }`).
* **Kiểm thử hồi quy Cron**: Bắt buộc có kịch bản test chứng minh chạy cron job không làm mất bất kỳ tài khoản lịch sử nào (bao gồm cả 2 tài khoản đang giữ `isVerified = false`).

---

### 2.2. Quyết định D2: Tách biệt Mongoose Legacy Model & Zod Application Models

#### A. Tách biệt hoàn toàn (Pure Separation)
* `src/models/user.model.ts`: Chỉ chứa Zod Application Model. Export các Zod Schemas (`userSchema`, `userPublicSchema`, `userCompactSchema`, `userInternalSchema`, `socialLinksSchema`) và TypeScript types (`User`, `UserPublic`, `UserCompact`, `UserInternal`, `SocialLinks`). Tuyệt đối không chứa Mongoose code.
* `src/models/category.model.ts`: Chỉ chứa Zod Application Model. Export `categorySchema`, `categoryPublicSchema`, `categoryDetailSchema` và TypeScript types (`Category`, `CategoryPublic`).
* Không tạo `category.legacy.model.ts` vì không có service nào ngoài Phase 2 phụ thuộc vào `CategoryModel`.

#### B. Thiết kế Legacy Model an toàn (`src/models/legacy/user.legacy.model.ts`)
* Di chuyển toàn bộ Mongoose Schema, Interface và Model cũ của User sang `src/models/legacy/user.legacy.model.ts`.
* Áp dụng cơ chế khởi tạo an toàn tránh lỗi `OverwriteModelError` khi chạy runtime hoặc hot-reload:
  ```ts
  import mongoose, { Document, model, Schema } from 'mongoose'
  // ... (giữ nguyên User interface và userSchema cũ)
  const UserModel = mongoose.models.User || model<User>('User', userSchema)
  export default UserModel
  ```
* Kiểm tra thuộc tính schema: User Mongoose Schema cũ chỉ chứa schema fields thuần túy, không có virtuals, custom instance methods, statics hay 3rd-party plugins.

#### C. Đồ thị phụ thuộc và cập nhật Import Graph
* Đã xác định chính xác 7 services thuộc Phase 3–8 phụ thuộc vào `UserModel`:
  1. `src/services/course.service.ts` (Phase 3)
  2. `src/services/quiz.service.ts` (Phase 4)
  3. `src/services/quizSubmission.service.ts` (Phase 5)
  4. `src/services/order.service.ts` (Phase 6)
  5. `src/services/enrollment.service.ts` (Phase 6)
  6. `src/services/rating.service.ts` (Phase 7)
  7. `src/services/comment.service.ts` (Phase 8)
* Khi triển khai Implementation, 7 file này sẽ được cập nhật import:
  `import UserModel from '~/models/legacy/user.legacy.model'`
* Đảm bảo runtime module resolution và TypeScript alias path (`tsconfig.json`: `"~/*": ["src/*"]`) nhận diện chính xác đường dẫn này.
* Tuyệt đối không xóa package `mongoose` và không ngắt kết nối MongoDB trước Phase 11.

---

### 2.3. Quyết định D3: Sửa Validator Route DELETE Category

* **Tình trạng**: **ĐÃ PHÊ DUYỆT CHÍNH THỨC**.
* **Mô tả**: Route `DELETE /api/admin/categories/:id` tại file `src/routes/admin.route.ts` dòng 160 được sửa để sử dụng `categoryIdValidator` thay cho `courseIdValidator`.
* **Ràng buộc**:
  1. Giữ nguyên endpoint: `DELETE /api/admin/categories/:id`.
  2. Giữ nguyên HTTP Method: `DELETE`.
  3. Giữ nguyên nghiệp vụ xóa mềm: cập nhật cờ `isDeleted = true` trong PostgreSQL (tương đương `_destroy: true` ở code cũ).
  4. Validator sử dụng tiện ích kiểm tra UUID chuẩn RFC 4122 từ `src/utils/uuid.ts`.
  5. Bổ sung Integration Tests cho cả trường hợp UUID hợp lệ (200 OK) và UUID sai định dạng (400 Bad Request).
  6. Tuyệt đối không mở rộng thành API redesign.

---

### 2.4. Quyết định D4: Tính Nhất Quán của User Role (Role Consistency)

Lập bảng đối chiếu toàn diện về định dạng Role giữa các tầng trong hệ thống:

| Tầng hệ thống | Cú pháp / Giá trị thực tế | Ý nghĩa & Quy tắc xử lý |
| :--- | :--- | :--- |
| **PostgreSQL Raw Enum** | `'admin'`, `'teacher'`, `'user'` | Cột `role` thuộc enum `UserRole` được lưu trữ dưới dạng chuỗi thường trong PostgreSQL. |
| **Prisma Client Schema** | `ADMIN @map("admin")`<br>`TEACHER @map("teacher")`<br>`USER @map("user")` | Prisma mapping tự động chuyển đổi giữa enum TypeScript viết hoa (`UserRole.ADMIN`) và giá trị DB viết thường (`admin`). |
| **Mongoose Model cũ** | `enum: ['admin', 'teacher', 'user']` | Mongoose lưu và trả về giá trị lowercase. |
| **`src/types/enum.ts`** | `UserRole.ADMIN = 'admin'`<br>`UserRole.TEACHER = 'teacher'`<br>`UserRole.USER = 'user'` | Enum TypeScript ứng dụng được định nghĩa với value chuỗi thường. |
| **`verifyRole.ts` Middleware** | `req.user.role !== UserRole.ADMIN` (`'admin'`) | Middleware kiểm tra quyền dựa trên chuỗi thường `'admin'` và `'teacher'`. |
| **JWT Access Token Payload** | `{ userId: string, role: string }` | Token phải chứa `role` dạng lowercase (`'admin'`, `'teacher'`, `'user'`) để không bị `isAdmin` hay `isTeacher` từ chối (403 Forbidden). |
| **API Response Serializer** | `"role": "admin" \| "teacher" \| "user"` | Phải trả về chuỗi thường trong JSON Response theo đúng API Contract mà Frontend Next.js đang parse. |

* **Quy tắc thống nhất**:
  * Tại tầng Repository: Sử dụng Prisma Enum (`UserRole.ADMIN`, `UserRole.TEACHER`, `UserRole.USER`) cho các câu lệnh query/mutation Prisma.
  * Tại tầng Service Serializer: Chuyển đổi thuộc tính `role` từ Prisma Enum sang lowercase string (`'admin'`, `'teacher'`, `'user'`) trước khi đưa vào JWT Token payload hoặc trả về HTTP Response.
  * Không thay đổi enum trong Prisma Schema, không thay đổi `verifyRole.ts`.

---

## 3. CÁC TIÊU CHÍ TIÊN QUYẾT BẮT BUỘC TRƯỚC IMPLEMENTATION (PREREQUISITES)

Quá trình Implementation Phase 2 **CHỈ ĐƯỢC PHÉP BẮT ĐẦU** khi thỏa mãn đầy đủ các điều kiện sau:

- [x] **Tiêu chí 1**: Hoàn thành kiểm toán chi tiết 22 endpoints, sơ đồ phụ thuộc, phân tích rủi ro và hợp đồng API.
- [x] **Tiêu chí 2**: Đã đối chiếu hoạt động thực tế của 7 tài khoản lịch sử và phân loại rành mạch (5 Trusted Historical Accounts được chấp thuận patch, 2 tài khoản giữ `isVerified = false`).
- [x] **Tiêu chí 3**: Đã thiết kế cấu trúc Legacy Model tách biệt an toàn tại `src/models/legacy/user.legacy.model.ts` và xác nhận đồ thị phụ thuộc của 7 services Phase 3–8.
- [x] **Tiêu chí 4**: Đã thống nhất cơ chế đồng bộ Role Casing bảo toàn tính tương thích của Middleware `verifyRole.ts` và Frontend.
- [x] **Tiêu chí 5**: Không có bất kỳ dòng code nguồn nào trong `src/` bị chỉnh sửa trong giai đoạn Audit.
- [ ] **Tiêu chí 6**: **CHỦ DỰ ÁN PHÊ DUYỆT CHÍNH THỨC SỔ ĐĂNG KÝ QUYẾT ĐỊNH VÀ KẾ HOẠCH TRIỂN KHAI HOÀN THIỆN ĐỂ BẮT ĐẦU IMPLEMENTATION.**
