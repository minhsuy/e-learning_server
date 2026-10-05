# BÁO CÁO THỰC THI DI TRÚ DỊCH VỤ (SERVICE MIGRATION REPORT)
## PHASE 2 — STEP 3: USER & CATEGORY SERVICE MIGRATION
**Dự án**: TMDEMY E-Learning Backend  
**Database**: PostgreSQL 16.11 (`tmdemy`) qua Prisma ORM 6.4.1  
**Database chuyển tiếp**: MongoDB Atlas (`e-learning`)  
**Ngày thực hiện**: 02/10/2026  
**Trạng thái thực thi**: **COMPLETED — 100% SẴN SÀNG CHO BƯỚC TIẾP THEO**  
**Kết quả kiểm thử tổng hợp**: **66/66 Step 3 Tests PASS (100%) | 53/53 Step 2 Tests PASS | 39/39 Phase 1 Tests PASS | 17/17 Step 1 Tests PASS**

---

## 1. MỤC TIÊU VÀ PHẠM VI STEP 3

### 1.1. Mục tiêu
Di trú tầng business logic của 2 module nòng cốt trong Phase 2:
1. **User Service** (`src/services/user.service.ts`).
2. **Category Service** (`src/services/category.service.ts`).

Chuyển đổi toàn bộ quyền truy cập dữ liệu từ Mongoose sang Prisma Client thông qua Functional Repositories đã được xây dựng và kiểm toán độc lập tại Step 2 và Step 2.1:
$$\text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Functional Repository} \longrightarrow \text{Prisma Singleton} \longrightarrow \text{PostgreSQL}$$

### 1.2. Phạm vi công việc
* **Trong phạm vi thực hiện**:
  * Di trú 100% các hàm trong [src/services/category.service.ts](file:///d:/e-learning_server/src/services/category.service.ts) sang gọi [src/repositories/category.repository.ts](file:///d:/e-learning_server/src/repositories/category.repository.ts).
  * Di trú 100% các hàm trong [src/services/user.service.ts](file:///d:/e-learning_server/src/services/user.service.ts) sang gọi [src/repositories/user.repository.ts](file:///d:/e-learning_server/src/repositories/user.repository.ts).
  * Loại bỏ hoàn toàn phụ thuộc vào Mongoose (`mongoose`, `CategoryModel`, `user.legacy.model.ts`) trong 2 file Service nói trên.
  * Tích hợp xử lý lỗi Prisma an toàn bằng [src/utils/prismaError.ts](file:///d:/e-learning_server/src/utils/prismaError.ts).
  * Bảo đảm tương thích ngược ID với frontend Next.js thông qua `withCompatId()` (`id` song song với `_id`).
  * Bảo đảm tính tương thích cờ xóa mềm Category: cung cấp cả `isDestroyed` và `_destroy: isDestroyed`.
  * Bảo đảm giá trị role trong JWT payload và public API response luôn là chuỗi thường dạng lowercase (`'admin'`, `'teacher'`, `'user'`) theo đúng Quyết định Kiến trúc D4 & Rủi ro R-03.
  * Tôn trọng lịch sử dữ liệu duplicate username `thaiminh`: chỉ kích hoạt kiểm tra trùng lặp khi người dùng cập nhật sang một username khác với username hiện tại của họ.
  * Xây dựng bộ kiểm thử tự động toàn diện [scripts/migration-utils/step-03-services.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-03-services.test.ts) chạy trong transaction cô lập với cam kết hoàn tác 100% (Zero database mutation).

* **Ngoài phạm vi (Nghiêm cấm & Đã tuân thủ)**:
  * Không chỉnh sửa [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma) hoặc chạy Prisma migration.
  * Không chạy `patch-phase2-users.ts` với cờ `--execute`.
  * Không chỉnh sửa `src/models/category.model.ts` (giữ nguyên Mongoose model để bảo vệ các module Phase 3–10 chưa migrate).
  * Không di trú Middleware / Validator trong bước này.
  * Không thay đổi API Contract (URL endpoint, HTTP method, status codes, response JSON envelope).

---

## 2. DANH SÁCH TẬP TIN ĐÃ ĐỌC (AUDITED & REFERENCED)

1. [AGENTS.md](file:///d:/e-learning_server/AGENTS.md) — Toàn bộ quy tắc cốt lõi về phân tầng, Functional style, cấm Singleton Class, API freeze.
2. [docs/architecture/application-model-design.md](file:///d:/e-learning_server/docs/architecture/application-model-design.md) — Kiến trúc Zod Application Models & Prisma Single Source of Truth.
3. [docs/migration/phase-02-user-category-auth/decisions-register.md](file:///d:/e-learning_server/docs/migration/phase-02-user-category-auth/decisions-register.md) — Quyết định D4 (Role casing), D5 (withCompatId), D6 (Conflict checks).
4. [docs/migration/phase-02-user-category-auth/step-02-repository-report.md](file:///d:/e-learning_server/docs/migration/phase-02-user-category-auth/step-02-repository-report.md) — Đặc tả API của tầng Functional Repository.
5. [docs/migration/phase-02-user-category-auth/step-02.1-repository-audit-report.md](file:///d:/e-learning_server/docs/migration/phase-02-user-category-auth/step-02.1-repository-audit-report.md) — Kết luận kiểm toán sẵn sàng cho Step 3.
6. [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma) — Mô hình thực thể PostgreSQL (`User`, `Category`, `Course`, quan hệ `CategoryCreatedBy`).
7. [src/controller/category.controller.ts](file:///d:/e-learning_server/src/controller/category.controller.ts) — Định dạng request/response kỳ vọng của Category Controller.
8. [src/controller/user.controller.ts](file:///d:/e-learning_server/src/controller/user.controller.ts) — Định dạng request/response kỳ vọng của User Controller.
9. [src/routes/category.route.ts](file:///d:/e-learning_server/src/routes/category.route.ts) — Tuyến endpoint Category.
10. [src/routes/user.route.ts](file:///d:/e-learning_server/src/routes/user.route.ts) — Tuyến endpoint User.
11. [src/utils/uuid.ts](file:///d:/e-learning_server/src/utils/uuid.ts) — Tiện ích kiểm tra cú pháp UUID và `withCompatId()`.
12. [src/utils/prismaError.ts](file:///d:/e-learning_server/src/utils/prismaError.ts) — Error mapping chuyển mã lỗi P2002, P2025 sang HTTP code.
13. [src/middlewares/errorHandler.ts](file:///d:/e-learning_server/src/middlewares/errorHandler.ts) — Express global error handling.
14. [src/middlewares/generateToken.ts](file:///d:/e-learning_server/src/middlewares/generateToken.ts) — Ký JWT token Access/Refresh.

---

## 3. DANH SÁCH TẬP TIN TẠO MỚI

1. [scripts/migration-utils/step-03-services.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-03-services.test.ts):
   * Suite kiểm thử tích hợp tự động cho toàn bộ các hàm của `CategoryService` và `UserService`.
   * Gồm 66 trường hợp kiểm thử nghiêm ngặt bao phủ cả Storefront read queries và Admin/User transactional mutations với cơ chế tự động rollback đảm bảo database không bị thay đổi.
2. [docs/migration/phase-02-user-category-auth/step-03-service-migration-report.md](file:///d:/e-learning_server/docs/migration/phase-02-user-category-auth/step-03-service-migration-report.md):
   * Báo cáo kỹ thuật chi tiết của Step 3.

---

## 4. DANH SÁCH TẬP TIN CHỈNH SỬA

1. [src/services/category.service.ts](file:///d:/e-learning_server/src/services/category.service.ts):
   * Chuyển đổi từ Mongoose `CategoryModel` sang Functional `categoryRepository`.
   * Xóa bỏ các import Mongoose.
2. [src/services/user.service.ts](file:///d:/e-learning_server/src/services/user.service.ts):
   * Chuyển đổi từ Mongoose `UserModel` sang Functional `userRepository`.
   * Xóa bỏ các import Mongoose.
   * Xử lý gửi email phi khóa (non-blocking) trong môi trường test/dev.

---

## 5. DANH SÁCH TẬP TIN XÓA
* Không có tập tin nào bị xóa trong bước này.

---

## 6. CHI TIẾT USER SERVICE MIGRATION

Toàn bộ 11 hàm dịch vụ trong [src/services/user.service.ts](file:///d:/e-learning_server/src/services/user.service.ts) đã được tái cấu trúc hoàn toàn:

| Tên Service Function | Tầng truy cập dữ liệu cũ | Tầng truy cập dữ liệu mới (Functional Repository) | Xử lý đặc thù & Bảo toàn Contract |
| :--- | :--- | :--- | :--- |
| `registerUserService` | `new UserModel(...)`, `newUser.save()` | `addUser(...)` | Mã hóa bcrypt (10 rounds); sinh OTP 6 số; băm token; role chuẩn hóa enum; gửi email welcome; trả về `withCompatId` với role lowercase. |
| `verifyOtpService` | `UserModel.findOne`, `save()`, `findByIdAndDelete` | `findUserByEmail`, `deleteUser`, `markUserAsVerified` | Băm OTP so sánh; nếu hết hạn xóa user vừa đăng ký và ném lỗi `OTP đã hết hạn, vui lòng đăng ký lại`; kích hoạt `isVerified: true` và xóa `otpCode` thông qua `markUserAsVerified`. |
| `loginUserService` | `UserModel.findOne(...)` | `findUserWithCredentials(...)` | So khớp mật khẩu với `bcrypt.compare`; sinh JWT access token với role lowercase; sinh refresh token; băm lưu DB bằng `updateRefreshToken`; trả về `{ success: true, access_token, refresh_token }`. |
| `getMeService` | `UserModel.findById(...).select(...)` | `findUserById(..., { select: USER_PUBLIC_SELECT })` | Loại bỏ 100% mật khẩu, OTP và token nhạy cảm; định dạng `socialLinks: { facebook, instagram, github }`; chuyển role sang lowercase; bổ sung `_id` compat. |
| `logoutUserService` | `UserModel.findById(...)`, `save()` | `findUserById(...)`, `updateRefreshToken(userId, null)` | Đặt `refreshToken: null` trong PostgreSQL; trả về `{ success: true, message: 'Logout successfully !' }`. |
| `forgotPasswordService` | `UserModel.findOne(...)`, `save()` | `findUserByEmail(...)`, `updateUser(...)` | Sinh token ngẫu nhiên 32 bytes; băm lưu vào `resetPasswordToken` với hạn 15 phút; gửi email reset qua Nodemailer. |
| `resetPasswordService` | `UserModel.findOne(...)`, `save()` | `findUserByResetToken(...)`, `updateUser(...)` | Tìm kiếm bằng hash token chưa hết hạn; mã hóa mật khẩu mới; đặt `null` cho `resetPasswordToken`, `resetPasswordExpires`, `refreshToken`. |
| `updateMeService` | `UserModel.findById(...)`, `save()` | `findUserById(...)`, `isUsernameTaken(...)`, `updateUser(...)` | **Đặc biệt**: Kiểm tra trùng username loại trừ chính mình (`excludeUserId`); không chặn nếu người dùng giữ nguyên username hiện tại (bảo toàn tài khoản trùng lịch sử `thaiminh`); cập nhật các trường profile và social links; trả về safe user kèm `_id`. |
| `changePasswordService` | `UserModel.findById(...).select('+password')` | `findUserById(..., { select: { id, password } })`, `updateUser(...)` | Kiểm tra mật khẩu cũ; mã hóa mật khẩu mới; thu hồi `refreshToken` cũ bằng `null`. |
| `getListTeachersService`| `UserModel.find(...)`, `countDocuments(...)` | `findActiveTeachers(...)` | Truy vấn giảng viên active, đã xác thực; phân trang và tìm kiếm text; chuẩn hóa trường `socialLinks` và `_id` compat cho từng item. |
| `getAccessTokenService` | `UserModel.findById(...)` | `findUserById(..., { select: { id, role, refreshToken } })` | So khớp hash refresh token; cấp access token mới mang role lowercase (`'user'`, `'admin'`, `'teacher'`). |

---

## 7. CHI TIẾT CATEGORY SERVICE MIGRATION

Toàn bộ 5 hàm dịch vụ trong [src/services/category.service.ts](file:///d:/e-learning_server/src/services/category.service.ts) đã được di trú sang Prisma Functional Repository:

| Tên Service Function | Tầng truy cập dữ liệu cũ | Tầng truy cập dữ liệu mới (Functional Repository) | Xử lý đặc thù & Bảo toàn Contract |
| :--- | :--- | :--- | :--- |
| `createCategoryService` | `CategoryModel.exists`, `CategoryModel.create` | `isCategorySlugTaken`, `isCategoryNameTaken`, `addCategory` | Kiểm tra tính hợp lệ của `created_by` (chấp nhận UUID và legacy ObjectId); tự động slugify; kiểm tra xung đột slug (409 `SLUG_CONFLICT`) và name (409 `NAME_CONFLICT`); kết nối `createdBy` relation; trả về `_id` và `_destroy: false`. |
| `deleteCategoryService` | `CategoryModel.findById`, `save()` | `findCategoryById`, `softDeleteCategory` | Kiểm tra UUID cú pháp; 404 nếu không tìm thấy; 400 nếu đã bị xóa (`isDestroyed == true`); gán `isDestroyed: true`; trả về dữ liệu có `_destroy: true`. |
| `updateCategoryService` | `CategoryModel.findById`, `findOne`, `save()` | `findCategoryById`, `isCategoryNameTaken`, `isCategorySlugTaken`, `updateCategory` | Kiểm tra xung đột name và slug loại trừ chính category đó (`id`); cho phép cập nhật `name`, `slug`, `description`, `isDestroyed` / `_destroy`; trả về đối tượng có `_id` và `_destroy`. |
| `getCategoriesService` | `CategoryModel.find`, `countDocuments` | `findCategoriesWithPagination` | Lọc mặc định `isDestroyed: false`; tìm kiếm theo tên/mô tả; phân trang chuẩn; đóng gói danh sách kèm `_id` và `_destroy: false` cho từng phần tử. |
| `getCategoryDetailService`| `CategoryModel.findOne` | `findCategoryBySlug` | Ẩn danh mục đã soft-delete (404); loại bỏ cờ nội bộ `isDestroyed`; trả về dữ liệu công khai kèm `_id` và `_destroy: false`. |

---

## 8. NHỮNG THAY ĐỔI TRONG LUỒNG CONTROLLER → SERVICE → REPOSITORY

```
HTTP Request
     │
     ▼
[Express Router] (src/routes/user.route.ts, src/routes/category.route.ts)
     │
     ▼
[Middleware Pipeline] (Express Validator, Verify Token, Role Checks)
     │
     ▼
[Controller Layer] (src/controller/user.controller.ts, src/controller/category.controller.ts)
     │  - Tiếp nhận req.body, req.params, req.query, req.user
     │  - Gọi hàm Service tương ứng
     ▼
[Service Layer] (src/services/user.service.ts, src/services/category.service.ts)
     │  - Đảm nhận toàn bộ Business Logic & Quy tắc nghiệp vụ
     │  - Xử lý mã hóa bcrypt, OTP, JWT payload normalization (lowercase role)
     │  - Kiểm tra điều kiện xung đột (slug, name, username uniqueness)
     │  - Map DTO: vớiCompatId(), cấu trúc socialLinks, _destroy alias
     │  - Bắt lỗi Prisma qua mapPrismaError() khi có ngoại lệ
     ▼
[Functional Repository Layer] (src/repositories/user.repository.ts, category.repository.ts)
     │  - Thực hiện Data Access thuần túy (không class, không this, pure async functions)
     │  - Áp dụng các hằng số Prisma Select (USER_PUBLIC_SELECT, CATEGORY_PUBLIC_SELECT,...)
     │  - Hỗ trợ transaction linh hoạt qua tham số tx?: PrismaTransactionClient
     ▼
[Prisma Client Singleton] (src/config/prisma.ts)
     │
     ▼
[PostgreSQL 16.11] (Database tmdemy)
```

**Các điểm cải tiến kỹ thuật trong luồng:**
1. **Controller không bị sửa đổi bất kỳ dòng code nào**: Các hàm Controller giữ nguyên 100% cách nhận input và xuất HTTP Response.
2. **Loại bỏ rò rỉ cơ sở dữ liệu lên Service**: Service không truy vấn SQL/Prisma thô mà gọi qua Repository function rõ ràng ngữ nghĩa (`findUserById`, `addCategory`).
3. **Khả năng kiểm thử cô lập hoàn hảo**: Tất cả các hàm Service đều hỗ trợ nhận tham số `tx?: PrismaTransactionClient`, cho phép bộ test tự động thực thi chuỗi mutation phức tạp bên trong transaction rồi rollback an toàn.

---

## 9. CÁC QUYẾT ĐỊNH KIẾN TRÚC ĐÃ ÁP DỤNG

1. **Quyết định D4 — Role Casing Consistency**:
   * Prisma schema lưu Enum chữ HOA (`ADMIN`, `TEACHER`, `USER`).
   * Service chủ động chuyển đổi role sang chữ thường (`role.toLowerCase()`) khi đóng gói token JWT hoặc trả về thông tin user trong API response.
   * Kết quả: Frontend và các bài test phân quyền giữ nguyên tính tương thích tuyệt đối.

2. **Quyết định D5 — `withCompatId()` Compatibility**:
   * Tất cả các thực thể trả về từ `getMeService`, `updateMeService`, `createCategoryService`, `getCategoriesService`, `getCategoryDetailService`, `getListTeachersService` đều được bọc qua tiện ích `withCompatId()`.
   * Cả 2 trường `id` (UUID chuẩn) và `_id` (alias của `id`) cùng tồn tại đồng thời, giúp Frontend Next.js không bị crash khi đọc `item._id`.

3. **Quyết định D6 — Xử lý Username trùng lặp lịch sử**:
   * Trong database hiện tại có 2 tài khoản cùng mang username `thaiminh`.
   * Nghiêm cấm đặt `@unique` vào cột `username` trong schema Prisma.
   * Trong `updateMeService`, chỉ gọi `isUsernameTaken(username, userId)` khi `username !== user.username`. Nếu người dùng cập nhật bio hoặc avatar mà không đổi username, hệ thống không báo lỗi xung đột.

4. **Category Deletion Flag Backward Compatibility**:
   * Cột vật lý PostgreSQL là `is_destroyed` (`isDestroyed`).
   * API Contract cũ sử dụng `_destroy: boolean`.
   * Service trả về đồng thời `isDestroyed: category.isDestroyed` và `_destroy: category.isDestroyed`, bảo đảm tương thích cả API mới lẫn API cũ.

---

## 10. API CONTRACT COMPATIBILITY

| Endpoint | HTTP Method | Legacy Contract Status | Migration Status sau Step 3 |
| :--- | :--- | :--- | :--- |
| `/api/users/register` | POST | 200 `{ success: true, message: '...' }` | **100% Khớp** |
| `/api/users/verify-otp` | POST | 200 `{ success: true, message: '...' }` | **100% Khớp** |
| `/api/users/login` | POST | 200 `{ success: true, access_token, refresh_token }` | **100% Khớp** |
| `/api/users/me` | GET | 200 `{ success: true, data: { id, _id, role: '...', socialLinks } }` | **100% Khớp** |
| `/api/users/logout` | POST | 200 `{ success: true, message: '...' }` | **100% Khớp** |
| `/api/users/forgot-password`| POST | 200 `{ success: true, message: '...' }` | **100% Khớp** |
| `/api/users/reset-password` | PUT | 200 `{ success: true, message: '...' }` | **100% Khớp** |
| `/api/users/update-me` | PUT | 200 `{ success: true, data: { id, _id, ... } }` | **100% Khớp** |
| `/api/users/change-password`| PUT | 200 `{ success: true, message: '...' }` | **100% Khớp** |
| `/api/users/teachers` | GET | 200 `{ success: true, data: { teachers, pagination } }` | **100% Khớp** |
| `/api/users/access_token` | POST | 200 `{ success: true, access_token }` | **100% Khớp** |
| `/api/categories` | POST | 201 `{ success: true, data: { id, _id, _destroy, ... } }` | **100% Khớp** |
| `/api/categories/:id` | DELETE | 200 `{ success: true, data: { _destroy: true, ... } }` | **100% Khớp** |
| `/api/categories/:id` | PUT | 200 `{ success: true, data: { ... } }` | **100% Khớp** |
| `/api/categories` | GET | 200 `{ success: true, data: { categories, pagination } }` | **100% Khớp** |
| `/api/categories/:slug` | GET | 200 `{ success: true, data: { id, _id, name, slug, ... } }` | **100% Khớp** |

---

## 11. NHỮNG DEPENDENCY MONGOOSE CÒN TỒN TẠI VÀ LÝ DO

1. **Các module Phase 3 — 10**:
   * `CourseModel`, `LessonModel`, `QuizModel`, `OrderModel`, `CommentModel`, `NotificationModel`,...
   * **Lý do**: Chưa đến lượt di trú theo kế hoạch tuần tự của lộ trình Phase 2 đến Phase 10.
2. **`src/models/legacy/user.legacy.model.ts`**:
   * Vẫn được sử dụng trong [src/services/admin.service.ts](file:///d:/e-learning_server/src/services/admin.service.ts) và một số module chưa di trú.
   * **Lý do**: Được cô lập có chủ đích tại Step 1 nhằm tránh gãy vỡ hệ thống khi các phase tiếp theo đang chạy.
3. **`src/models/category.model.ts`**:
   * Vẫn là Mongoose Model.
   * **Lý do**: Được tái sử dụng bởi `course.service.ts` và các module liên kết chưa di trú; sẽ được chuyển thành Zod Application Model tại phase thích hợp.
4. **Không còn bất kỳ Mongoose dependency nào trong `src/services/user.service.ts` và `src/services/category.service.ts`**.

---

## 12. KẾT QUẢ BIÊN DỊCH TYPESCRIPT

Chạy lệnh kiểm tra:
`cmd /c npx tsc --noEmit`

* **Kết quả đối với module di trú**:
  * [src/services/user.service.ts](file:///d:/e-learning_server/src/services/user.service.ts): **0 lỗi**
  * [src/services/category.service.ts](file:///d:/e-learning_server/src/services/category.service.ts): **0 lỗi**
  * [src/controller/user.controller.ts](file:///d:/e-learning_server/src/controller/user.controller.ts): **0 lỗi**
  * [src/controller/category.controller.ts](file:///d:/e-learning_server/src/controller/category.controller.ts): **0 lỗi**
* **Lỗi TypeScript còn lại trong dự án**:
  * Chỉ xuất hiện tại các file thuộc module chưa di trú (như `comment.controller.ts`, `coupon.controller.ts`, `lesson.controller.ts`, `pdfGenerator.ts`,... do `req.query` types và Cloudinary types đã tồn tại từ trước).
  * Không phát sinh bất kỳ lỗi mới nào trong phạm vi Step 3.

---

## 13. KẾT QUẢ TỪNG BỘ TEST

### 13.1. Step 3 Service Test Suite
* Lệnh: `cmd /c npx tsx scripts/migration-utils/step-03-services.test.ts`
* **Kết quả**: **66/66 PASSED (100%) | 0 FAILED**
* Bao gồm:
  * Read-only Storefront & User queries: 19 tests PASS.
  * Transactional Category mutations: 14 tests PASS (tạo mới, slug conflict, name conflict, update, soft delete, delete rejection, ẩn khỏi storefront).
  * Transactional User Authentication & Lifecycle: 29 tests PASS (đăng ký, hash OTP, xác thực OTP, đổi mật khẩu, đăng nhập sai/đúng, sinh JWT access token với role lowercase, refresh token rotation, update profile, username conflict check, forgot password, logout).
  * Transaction Rollback & Zero Database Mutation: 4 tests PASS (User count giữ nguyên 7, Category count giữ nguyên 3).

### 13.2. Step 2 Repository Regression Test Suite
* Lệnh: `cmd /c npx tsx scripts/migration-utils/step-02-repositories.test.ts`
* **Kết quả**: **53/53 PASSED (100%) | 0 FAILED**

### 13.3. Phase 1 Foundation Test Suite
* Lệnh: `cmd /c npx tsx scripts/test-phase1-foundation.ts`
* **Kết quả**: **39/39 PASSED (100%) | 0 FAILED**

### 13.4. Step 1 Zod Model Test Suite
* Lệnh: `cmd /c npx tsx scripts/migration-utils/step-01-zod-model.test.ts`
* **Kết quả**: **17/17 PASSED (100%) | 0 FAILED**

**TỔNG CỘNG TẤT CẢ CÁC BỘ TEST: 175/175 TESTS PASS (100%)**

---

## 14. NHỮNG VẤN ĐỀ CÒN TỒN TẠI

1. **Middleware vẫn đang dùng Express Validator với kiểm tra cú pháp cũ**:
   * Tầng Middleware (`user.middleware.ts`, `category.middleware.ts`) hiện chưa được di trú sang UUID validation và tách logic kiểm tra DB. Công việc này sẽ được xử lý riêng tại Step 4.
2. **Dữ liệu lịch sử 2 user `thaiminh`**:
   * Script `patch-phase2-users.ts` vẫn ở trạng thái DRY-RUN sẵn sàng, chưa kích hoạt `--execute`.

---

## 15. RỦI RO VÀ GIỚI HẠN

1. **Rủi ro mạng khi gửi Email (Nodemailer)**:
   * Nếu cấu hình Gmail SMTP trong file `.env` bị hết hạn hoặc không có kết nối internet, tiến trình gửi mail thực tế có thể chậm. Trong `user.service.ts` đã chủ động bọc khối gửi mail trong `try/catch` an toàn để không làm sập luồng đăng ký của người dùng khi gặp sự cố SMTP.
2. **Giới hạn thời gian của Prisma Interactive Transaction**:
   * Các transaction chạy nhiều hàm mã hóa bcrypt có thể tốn thời gian. Test suite đã được cấu hình rõ ràng `{ timeout: 30000 }` để bảo đảm hoàn tất an toàn.

---

## 16. CÁC CÔNG VIỆC CHƯA THỰC HIỆN
* Chưa migrate `src/middlewares/user.middleware.ts`.
* Chưa migrate `src/middlewares/category.middleware.ts`.
* Chưa migrate `src/middlewares/admin.middleware.ts`.
* Chưa chuyển đổi `category.model.ts` sang Zod Model.
* Chưa migrate các module Phase 3 (Course, Chapter, Lesson).

---

## 17. ĐỀ XUẤT CHO STEP 4

Sau khi hoàn thành Step 3 đạt chuẩn 100%, đề xuất thực hiện **Phase 2 — Step 4: Middleware & Validator Migration**:
1. Rà soát [src/middlewares/user.middleware.ts](file:///d:/e-learning_server/src/middlewares/user.middleware.ts) và [src/middlewares/category.middleware.ts](file:///d:/e-learning_server/src/middlewares/category.middleware.ts).
2. Chuyển đổi ObjectId validator sang UUID validator sử dụng [src/utils/uuid.ts](file:///d:/e-learning_server/src/utils/uuid.ts) cho các endpoint đã migrate.
3. Rút toàn bộ các thao tác database check ra khỏi custom validators trong middleware, bàn giao hoàn toàn cho Service & Repository theo đúng nguyên tắc của `AGENTS.md`.
4. Duy trì 100% cấu trúc validation error messages và HTTP status code cũ để không ảnh hưởng API regression.
5. Tạo bộ test regression cho Middleware và báo cáo kết quả.
