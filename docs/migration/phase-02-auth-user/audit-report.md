# BÁO CÁO KIỂM TOÁN TIỀN DI TRÚ (PRE-MIGRATION AUDIT REPORT)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES

---

## 1. TỔNG QUAN & PHẠM VI KIỂM TOÁN

* **Dự án**: TMDEMY E-Learning Backend Migration
* **Mục tiêu**: Chuyển đổi tầng Database từ MongoDB/Mongoose sang PostgreSQL 16.11 / Prisma ORM 6.4.1 cho các module User, Category và Authentication.
* **Giai đoạn**: **Phase 2 — Pre-Migration Audit** (Kiểm toán & Lập kế hoạch chi tiết trước khi code).
* **Nguyên tắc cốt lõi áp dụng**:
  1. **API Contract Freeze**: Giữ nguyên tuyệt đối 100% endpoint URL, HTTP method, status codes, request body, query params và response JSON.
  2. **ADR Application Model Design**: Giữ nguyên `src/models/`, chuyển đổi sang Zod Application Models, duy trì tương thích cho các phase chưa di trú.
  3. **Functional Repository**: Không sử dụng Class/OOP Repository, sử dụng pure functions và Prisma Client Singleton (`src/config/prisma.ts`).
  4. **Validator & Middleware Rules**: Loại bỏ toàn bộ `mongoose.Types.ObjectId.isValid` và `isMongoId()`, thay thế bằng `isValidUUID` từ `src/utils/uuid.ts`. Không truy vấn trực tiếp Mongoose Model hoặc Prisma Client trong Middleware/Validator mà phải qua Functional Repository.
  5. **Data & Schema Integrity**: Tuyệt đối không tự ý sửa database, không mass update, không sửa `prisma/schema.prisma`.

---

## 2. HIỆN TRẠNG DATABASE & ENTITIES TRONG PHẠM VI

### 2.1. PostgreSQL Target Database (`tmdemy`)
Sau 10 phase Data Migration và Phase 1 Foundation, trạng thái bảng mục tiêu hiện tại:
* Bảng `users`: **7 bản ghi** (1 ADMIN, 2 TEACHER, 4 USER).
* Bảng `categories`: **3 bản ghi** (dữ liệu danh mục gốc).
* UUID v5 Mapper: Namespace cố định `7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c` đã map nhất quán toàn bộ ID từ MongoDB.

### 2.2. Chi tiết Mô hình Thực thể Prisma vs Mongoose

#### Thực thể User
| Trường Mongoose cũ | Cột Prisma / PostgreSQL mới | Kiểu dữ liệu | Nullable / Default | Ghi chú chuyển đổi |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `id` | `UUID` | Primary Key, default UUID v4 | Cần `withCompatId` để giữ `_id` cho client |
| `username` | `username` | `VarChar(100)` | NOT NULL | Cần validate độ dài 3-30 |
| `email` | `email` | `VarChar(255)` | UNIQUE, NOT NULL | Chuẩn hóa lowercase/trim |
| `password` | `password` | `VarChar(255)` | NOT NULL | Hash bcrypt (10 rounds) |
| `status` | `status` | `UserStatus` (Enum) | Default `ACTIVE` | Enum: `ACTIVE`, `INACTIVE` |
| `role` | `role` | `UserRole` (Enum) | Default `USER` | Enum: `ADMIN`, `USER`, `TEACHER` |
| `avatar` | `avatar` | `Text / VarChar` | Default `""` | URL ảnh đại diện |
| `phone` | `phone` | `VarChar(30)` | Nullable | Định dạng số điện thoại |
| `bio` | `bio` | `Text` | Nullable | Tiểu sử người dùng |
| `socialLinks.facebook` | `socialFacebook` | `VarChar` | Default `""` (map `social_facebook`) | Flattened column trong PostgreSQL |
| `socialLinks.instagram` | `socialInstagram` | `VarChar` | Default `""` (map `social_instagram`) | Flattened column trong PostgreSQL |
| `socialLinks.github` | `socialGithub` | `VarChar` | Default `""` (map `social_github`) | Flattened column trong PostgreSQL |
| `isVerified` | `isVerified` | `Boolean` | Default `false` (map `is_verified`) | **Xem phân tích điểm dị biệt mục 4** |
| `otp_code` | `otpCode` | `VarChar(255)` | Nullable (map `otp_code`) | Hash SHA-256 OTP trước khi lưu |
| `otp_expires` | `otpExpires` | `DateTime` | Nullable (map `otp_expires`) | Thời gian hết hạn OTP (10 phút) |
| `refresh_token` | `refreshToken` | `Text` | Nullable (map `refresh_token`) | Hash SHA-256 JWT refresh token |
| `reset_password_token`| `resetPasswordToken`| `Text` | Nullable (map `reset_password_token`) | Hash SHA-256 Reset token (15 phút) |
| `reset_password_expires`| `resetPasswordExpires`| `DateTime` | Nullable (map `reset_password_expires`) | Thời gian hết hạn reset link |
| `createdAt` / `updatedAt` | `createdAt` / `updatedAt` | `DateTime` | Auto timestamp | Giữ nguyên ISO Date string |

#### Thực thể Category
| Trường Mongoose cũ | Cột Prisma / PostgreSQL mới | Kiểu dữ liệu | Nullable / Default | Ghi chú chuyển đổi |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | `id` | `UUID` | Primary Key | Cần `withCompatId` để giữ `_id` |
| `name` | `name` | `VarChar(200)` | UNIQUE, NOT NULL | Tên danh mục |
| `slug` | `slug` | `VarChar(250)` | UNIQUE, NOT NULL | Slug kebab-case tự sinh qua slugify |
| `description` | `description` | `Text` | Nullable | Mô tả danh mục |
| `created_by` | `createdById` | `UUID` | Nullable (map `created_by_id`) | Khóa ngoại trỏ tới `users(id)` |
| `_destroy` | `isDestroyed` | `Boolean` | Default `false` (map `is_destroyed`) | Soft delete flag |
| `createdAt` / `updatedAt` | `createdAt` / `updatedAt` | `DateTime` | Auto timestamp | Timestamp |

---

## 3. KIỂM TOÁN TẤT CẢ ENDPOINTS & CHỨC NĂNG THỰC TẾ

Qua rà soát chi tiết 3 file router chính (`src/routes/user.route.ts`, `src/routes/category.route.ts`, `src/routes/admin.route.ts`) và các controller/service liên quan, Phase 2 bao gồm chính xác **22 HTTP Endpoints** và **1 Background Cron Job**:

### 3.1. Nhóm Authentication & User cá nhân (12 Endpoints)
1. `POST /api/users/register`: Đăng ký tài khoản mới, tạo mã OTP 6 số (SHA-256), gửi email kích hoạt qua Nodemailer, lưu tạm `isVerified: false`.
2. `POST /api/users/verify-otp`: Xác thực OTP kích hoạt tài khoản. Nếu đúng, kích hoạt tài khoản (`isVerified: true`), xóa mã OTP. Nếu hết hạn, xóa user và bắt đăng ký lại.
3. `POST /api/users/login`: Đăng nhập bằng email/password, kiểm tra kích hoạt (`isVerified`), sinh cặp Access Token (JWT) và Refresh Token (JWT), lưu hash refresh token vào DB.
4. `GET /api/users/me`: Lấy thông tin cá nhân của người dùng hiện tại từ Access Token (`req.user.userId`). Tuyệt đối loại trừ password, tokens, otp.
5. `POST /api/users/logout`: Đăng xuất, xóa refresh token đã lưu trong DB của người dùng hiện tại.
6. `POST /api/users/forgot-password`: Yêu cầu cấp lại mật khẩu. Sinh crypto token 32 bytes (hạn 15 phút), lưu hash token vào DB, gửi email chứa reset link.
7. `PUT /api/users/reset-password`: Đặt lại mật khẩu mới thông qua reset token và password mới.
8. `PUT /api/users/update-me`: Cập nhật thông tin profile cá nhân (`username`, `phone`, `bio`, `avatar`, `socialLinks`).
9. `PUT /api/users/change-password`: Đổi mật khẩu cá nhân khi đã đăng nhập (yêu cầu `oldPassword`, `password`, `confirm_password`). Thu hồi refresh token cũ.
10. `GET /api/users/profile/:id`: Lấy thông tin công khai của người dùng bất kỳ theo ID (UUID).
11. `GET /api/users/teachers`: Lấy danh sách giảng viên (phân trang, tìm kiếm theo tên/email, sắp xếp).
12. `POST /api/users/access_token`: Cấp mới Access Token từ Refresh Token (đối chiếu hash refresh token trong DB).

### 3.2. Nhóm Category công khai (2 Endpoints)
13. `GET /api/categories`: Lấy danh sách danh mục hoạt động (`isDestroyed: false`), hỗ trợ phân trang và tìm kiếm.
14. `GET /api/categories/:slug`: Lấy thông tin chi tiết một danh mục theo `slug` (chỉ lấy danh mục chưa bị xóa).

### 3.3. Nhóm Quản trị Admin: User Management (5 Endpoints)
15. `GET /api/admin/users`: Admin lấy danh sách toàn bộ người dùng (hỗ trợ phân trang, lọc theo `role`, `status`, tìm kiếm `username`/`email`, sắp xếp).
16. `GET /api/admin/users/:id`: Admin xem chi tiết người dùng bất kỳ theo UUID.
17. `PUT /api/admin/users/:id`: Admin cập nhật thông tin người dùng (`username`, `role`, `status`, `phone`, `bio`, `avatar`, `socialLinks`). Kiểm tra trùng lặp `username`.
18. `DELETE /api/admin/users/:id`: Admin xóa tài khoản. Chặn tự xóa chính mình (`SELF_DELETE_BLOCKED`), chặn xóa admin cuối cùng của hệ thống (`LAST_ADMIN`).
19. `POST /api/admin/users`: Admin trực tiếp tạo tài khoản Giảng viên (chỉ tạo `TEACHER`, mã hóa mật khẩu, kiểm tra trùng email/username).

### 3.4. Nhóm Quản trị Admin: Category Management (3 Endpoints)
20. `POST /api/admin/categories`: Admin tạo mới danh mục (tự sinh slug từ name nếu không truyền, kiểm tra trùng slug/name). Gán `createdById`.
21. `PUT /api/admin/categories/:id`: Admin cập nhật danh mục theo UUID (name, slug, description, _destroy).
22. `DELETE /api/admin/categories/:id`: Admin xóa mềm danh mục theo UUID (`isDestroyed: true`).

### 3.5. Background Scheduled Cron Job (1 Job)
* `src/cronJobs/deleteUnverifiedUsers.ts`: Dọn dẹp tài khoản chưa kích hoạt sau khoảng thời gian cấu hình (`UNVERIFIED_USER_EXPIRE_MINUTES`, mặc định 24h).

---

## 4. PHÂN TÍCH CHI TIẾT NGHIỆP VỤ & CÁC ĐIỂM DỊ BIỆT BẤT NHẤT

### 4.1. Vấn đề cốt lõi: Bất nhất ngữ nghĩa `isVerified`
* **Trong mã nguồn cũ (MongoDB/Mongoose)**:
  * Khi đăng ký qua OTP (`registerUserService`): gán `isVerified: false`.
  * Khi xác thực OTP thành công (`verifyOtpService`): gán `isVerified: true`.
  * Nhưng tại `admin.service.ts` (`createTeacherService`): lại gán `isVerified: ''` (chuỗi rỗng).
  * Tại `admin.service.ts` (`getAllUsersService`): bộ lọc cứng ghi `isVerified: ''`.
  * Tại `user.service.ts` (`getListTeachersService`): bộ lọc cứng ghi `role: UserRole.TEACHER, isVerified: ''`.
  * Tại `cronJobs/deleteUnverifiedUsers.ts`: điều kiện xóa là `{ isVerified: { $ne: '' }, createdAt: { $lt: expireTime } }`.
* **Trong PostgreSQL hiện tại**:
  * Cột `is_verified` là kiểu `BOOLEAN` (`false` hoặc `true`).
  * Toàn bộ **7 người dùng lịch sử** được migrate đều đang mang giá trị `is_verified = false` (do transformer cũ map chuỗi rỗng `""` về `false`).
* **Hậu quả nếu chuyển đổi máy móc sang Prisma**:
  1. `loginValidator` kiểm tra `if (!user.isVerified) throw new Error(...)` => **TẤT CẢ 7 TÀI KHOẢN (kể cả Admin) ĐỀU BỊ KHÓA ĐĂNG NHẬP**.
  2. `getAllUsersService` và `getListTeachersService` nếu lọc `isVerified: true` => **TRẢ VỀ DANH SÁCH RỖNG (0 kết quả)**.
  3. Cron job `deleteUnverifiedUsers` nếu xóa theo `isVerified: false` => **XÓA SẠCH SÀNH SANH 7 NGƯỜI DÙNG PRODUCTION/TEST HIỆN TẠI**.
* **Giải pháp xử lý chuẩn mực**:
  * **Tuyệt đối không chạy mass update tự động mà không xin phê duyệt**.
  * Báo cáo phương án xử lý rõ ràng (xem phần Quyết định cần phê duyệt ở mục 7):
    * **Đề xuất phê duyệt**: Thực hiện 1 script Data Patch minh bạch chuyển `is_verified = true` cho 7 tài khoản lịch sử đã xác thực.
    * Trong mã nguồn Phase 2: Chuẩn hóa toàn bộ điều kiện lọc trong Service/Repository theo chuẩn Boolean (`true` là đã kích hoạt/hợp lệ, `false` là đăng ký tạm chờ OTP).

### 4.2. Mongoose Model Dependency Leak sang các Phase sau
* `UserModel` (`src/models/user.model.ts`) hiện đang được import bởi:
  * `src/services/course.service.ts` (Phase 3)
  * `src/services/quiz.service.ts` (Phase 4)
  * `src/services/quizSubmission.service.ts` (Phase 5)
  * `src/services/order.service.ts` (Phase 6)
  * `src/services/enrollment.service.ts` (Phase 6)
  * `src/services/rating.service.ts` (Phase 7)
  * `src/services/comment.service.ts` (Phase 8)
* **Quy tắc bắt buộc**: Không được xóa Mongoose model trong `user.model.ts` khi các phase sau vẫn đang phụ thuộc.
* **Giải pháp**: Áp dụng mô hình **Hybrid Transitional Model Pattern**:
  * `src/models/user.model.ts` sẽ xuất song song:
    1. Các Zod Application Models & Inferred Types: `userSchema`, `userPublicSchema`, `userCompactSchema`, `userInternalSchema`, `User`, `UserPublic`.
    2. Xuất Mongoose Model cũ (`export const UserModel = mongoose.models.User || ...`, `export default UserModel`) để các file Phase 3–8 chưa di trú tiếp tục hoạt động mà không bị gãy build.

### 4.3. ObjectId sang UUID trong Validators & Middlewares
* Hiện tại các middleware sau đang dùng kiểm tra kiểu cũ:
  1. `src/middlewares/user.middleware.ts`: `userIdValidator` dùng `mongoose.Types.ObjectId.isValid(value)`.
  2. `src/middlewares/admin.middleware.ts`: `getUserDetailValidator` và `updateUserByAdminValidator` dùng `.isMongoId()`.
  3. `src/middlewares/category.middleware.ts`: `updateCategoryValidator` dùng `mongoose.Types.ObjectId.isValid(value)`.
  4. `src/routes/admin.route.ts` dòng 160: route `DELETE /api/admin/categories/:id` bị gán nhầm validator `courseIdValidator` (kiểm tra ObjectId với message `'Invalid course ID'`).
* **Giải pháp chuyển đổi**:
  * Thay thế toàn bộ bằng `isValidUUID` từ `src/utils/uuid.ts`.
  * Xây dựng `categoryIdValidator` chuẩn cho Category và gán đúng vào route DELETE.
  * Tách toàn bộ database lookup trong Express Validator (`UserModel.findOne({ email })`, `CategoryModel.findOne({ name })`) sang gọi thông qua Functional Repository (`findUserByEmail`, `findCategoryByName`).

### 4.4. Cấu trúc Response Contract & Mapping Field
* Trong Mongoose cũ, User có trường lồng nhau `socialLinks: { facebook, instagram, github }`.
* Trong Prisma schema, PostgreSQL lưu dạng cột phẳng: `socialFacebook`, `socialInstagram`, `socialGithub`.
* Client Next.js và Postman Collection đang kỳ vọng nhận cấu trúc `socialLinks` trong API response của `getMe`, `updateMe`, `getAllUsers`, `getUserDetail`.
* **Giải pháp**: Trong Zod Response Schemas và Service Layer, thực hiện map 2 chiều:
  * Khi nhận từ client: bóc tách `socialLinks.*` ghi vào `socialFacebook`, `socialInstagram`, `socialGithub`.
  * Khi trả ra response: gom các cột phẳng thành object `socialLinks` để bảo toàn 100% API Contract Freeze.
  * Tận dụng helper `withCompatId` từ `src/utils/uuid.ts` để luôn trả kèm `_id: id`, đảm bảo tương thích hoàn hảo với frontend mà không cần sửa một dòng code client nào.

---

## 5. THIẾT KẾ ZOD APPLICATION MODELS THEO ADR

### 5.1. `src/models/user.model.ts` (Thiết kế chi tiết)

```typescript
import { z } from 'zod'
import { UserRole, UserStatus } from '@prisma/client'

// 1. Social Links Schema (Khớp với client payload)
export const socialLinksSchema = z.object({
  facebook: z.string().default(''),
  instagram: z.string().default(''),
  github: z.string().default('')
}).default({})

// 2. Base User Schema (Phản ánh cấu trúc chuẩn của thực thể User trong domain)
export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(100),
  email: z.string().email().max(255),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  avatar: z.string().default(''),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  socialLinks: socialLinksSchema,
  isVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// 3. Public User Schema (Dùng cho API Response: getMe, profile, updateMe)
export const userPublicSchema = userSchema.pick({
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialLinks: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
})

// 4. Compact User Schema (Dùng làm author tóm tắt trong khóa học, bình luận)
export const userCompactSchema = userSchema.pick({
  id: true,
  username: true,
  avatar: true,
  role: true
})

// 5. Internal User Schema (Dành riêng cho Service nội bộ: Auth, Reset Password, OTP)
export const userInternalSchema = userSchema.extend({
  password: z.string(),
  otpCode: z.string().nullable().optional(),
  otpExpires: z.date().nullable().optional(),
  refreshToken: z.string().nullable().optional(),
  resetPasswordToken: z.string().nullable().optional(),
  resetPasswordExpires: z.date().nullable().optional()
})

// TypeScript Types
export type User = z.infer<typeof userSchema>
export type UserPublic = z.infer<typeof userPublicSchema>
export type UserCompact = z.infer<typeof userCompactSchema>
export type UserInternal = z.infer<typeof userInternalSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>
```

### 5.2. `src/models/category.model.ts` (Thiết kế chi tiết)

```typescript
import { z } from 'zod'

// 1. Base Category Schema
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(250),
  description: z.string().nullable().optional(),
  createdById: z.string().uuid().nullable().optional(),
  isDestroyed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// 2. Public Category Response Schema (Khớp với client getCategories & getCategoryDetail)
export const categoryPublicSchema = categorySchema.pick({
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true
})

// 3. Admin Category Detail Schema (Bao gồm cả thông tin người tạo và trạng thái xóa mềm)
export const categoryAdminSchema = categorySchema.pick({
  id: true,
  name: true,
  slug: true,
  description: true,
  createdById: true,
  isDestroyed: true,
  createdAt: true,
  updatedAt: true
})

// TypeScript Types
export type Category = z.infer<typeof categorySchema>
export type CategoryPublic = z.infer<typeof categoryPublicSchema>
export type CategoryAdmin = z.infer<typeof categoryAdminSchema>
```

---

## 6. DANH SÁCH FUNCTIONAL REPOSITORIES CẦN NÂNG CẤP

Tại Phase 1, `src/repositories/user.repository.ts` và `src/repositories/category.repository.ts` đã được khởi tạo cơ bản. Để phục vụ trọn vẹn Phase 2, cần bổ sung các hàm truy vấn đặc thù sau (không dùng OOP/Class):

### 6.1. Bổ sung cho `user.repository.ts`:
1. `findUserWithCredentials(email: string, tx?)`: Tìm user lấy kèm password để phục vụ login / change password.
2. `findUserByResetToken(hashedToken: string, tx?)`: Tìm user có reset token hợp lệ và `resetPasswordExpires > now()`.
3. `findTeachersWithPagination(options, tx?)`: Truy vấn danh sách giáo viên có phân trang, tìm kiếm, sort.
4. `countAdminsExcluding(userId: string, tx?)`: Đếm số lượng Admin còn lại khác với `userId` để chặn xóa admin cuối cùng.
5. `deleteUnverifiedUsersOlderThan(expireDate: Date, tx?)`: Xóa các tài khoản `isVerified: false` được tạo trước thời điểm hết hạn (thay thế Mongoose trong Cron job).

### 6.2. Bổ sung cho `category.repository.ts`:
1. `findCategoryByName(name: string, tx?)`: Kiểm tra trùng tên danh mục.
2. `isCategoryNameTaken(name: string, excludeId?: string, tx?)`: Kiểm tra tên danh mục đã tồn tại khi update.
3. `isCategorySlugTaken(slug: string, excludeId?: string, tx?)`: Kiểm tra slug đã tồn tại khi update.
4. `softDeleteCategory(id: string, tx?)`: Cập nhật `isDestroyed: true`.

---

## 7. CÁC QUYẾT ĐỊNH CẦN CHỦ DỰ ÁN PHÊ DUYỆT (DECISION REGISTER)

Trước khi tiến hành sửa code trong Phase 2, cần chủ dự án phê duyệt 3 điểm mấu chốt sau:

| Mã | Nội dung cần quyết định | Phương án đề xuất | Lý do & Ảnh hưởng |
| :--- | :--- | :--- | :--- |
| **D1** | **Xử lý 7 người dùng lịch sử có `is_verified = false`** | Chạy một script migration patch cập nhật `is_verified = true` cho 7 tài khoản này trước khi chạy Phase 2. | Nếu không cập nhật, toàn bộ người dùng hiện tại sẽ không thể đăng nhập qua loginValidator và sẽ bị cron job xóa. |
| **D2** | **Cơ chế tương thích ngược cho `UserModel`** | Duy trì Mongoose Model song song dưới dạng hybrid export trong `src/models/user.model.ts`. | Các module Phase 3–8 chưa migrate vẫn đang import Mongoose UserModel. Xóa sớm sẽ gây vỡ ứng dụng. |
| **D3** | **Sửa lỗi route `DELETE /api/admin/categories/:id`** | Thay thế `courseIdValidator` (lỗi thừa hưởng từ code cũ) bằng `categoryIdValidator` (UUID). | Route cũ kiểm tra ObjectId và báo lỗi "Invalid course ID", khiến việc xóa danh mục bằng UUID luôn bị chặn 400. |

---

## 8. KẾT LUẬN KIỂM TOÁN

* **Trạng thái kiểm toán**: **HOÀN THÀNH — SẴN SÀNG TRIỂN KHAI PHASE 2 SAU KHI ĐƯỢC PHÊ DUYỆT**.
* **Đảm bảo phạm vi**: Không sửa code nguồn, không sửa database, không cài đặt package trong quá trình kiểm toán.
* **Tài liệu đính kèm**:
  1. `docs/migration/phase-02-auth-user/dependency-map.md`: Bản đồ phụ thuộc chi tiết.
  2. `docs/migration/phase-02-auth-user/api-contract-audit.md`: Bảng đối chiếu 22 endpoint.
  3. `docs/migration/phase-02-auth-user/implementation-plan.md`: Kế hoạch thực thi 8 bước.
  4. `docs/migration/phase-02-auth-user/risk-register.md`: Bảng quản trị rủi ro.
