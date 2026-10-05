# KẾ HOẠCH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION PLAN)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES

---

## 1. NGUYÊN TẮC THỰC THI

1. **Tuân thủ phân tầng**:
   `HTTP Request` → `Router` → `Middlewares / Express Validator` → `Controller` → `Service` → `Functional Repository` → `Prisma Client` → `PostgreSQL`.
2. **Không phá vỡ các phase sau**: Áp dụng Hybrid Model Pattern cho `UserModel`.
3. **Thực hiện theo từng bước nhỏ có thể kiểm chứng (Step-by-Step Verification)**:
   Mỗi bước hoàn thành đều phải kiểm tra tính toàn vẹn (compile TypeScript không lỗi, test không vỡ).
4. **Không chạy mass update hay migration tự do**: Chỉ thực hiện các bước đã được chủ dự án phê duyệt.

---

## 2. DANH MỤC FILE TRONG QUÁ TRÌNH TRIỂN KHAI

### 2.1. File cần tạo mới:
1. `scripts/test-phase2-auth-user.ts`: Bộ automated integration test cho toàn bộ 22 endpoint và chức năng của Phase 2.
2. `scripts/migration-utils/patch-phase2-users.ts`: Script vá dữ liệu cho 7 tài khoản lịch sử (`is_verified = true`) theo quyết định D1.

### 2.2. File cần chỉnh sửa / nâng cấp:
1. `src/models/user.model.ts`: Chuyển sang Zod Application Model kết hợp Mongoose compatibility layer.
2. `src/models/category.model.ts`: Chuyển sang Zod Application Model kết hợp Mongoose compatibility layer.
3. `src/repositories/user.repository.ts`: Bổ sung các query chuyên biệt (credentials, reset token, pagination teachers, delete unverified).
4. `src/repositories/category.repository.ts`: Bổ sung kiểm tra trùng tên/slug, soft delete.
5. `src/repositories/index.ts`: Export toàn bộ các hàm mới của repositories.
6. `src/middlewares/user.middleware.ts`: Chuyển database check sang UserRepository, đổi ObjectId sang UUID.
7. `src/middlewares/admin.middleware.ts`: Đổi `.isMongoId()` sang UUID validator.
8. `src/middlewares/category.middleware.ts`: Chuyển database check sang CategoryRepository, đổi ObjectId sang UUID.
9. `src/routes/admin.route.ts`: Sửa validator tại route `DELETE /api/admin/categories/:id` sang `categoryIdValidator`.
10. `src/services/user.service.ts`: Viết lại 100% logic bằng UserRepository, Prisma và Zod schemas.
11. `src/services/category.service.ts`: Viết lại 100% logic bằng CategoryRepository, Prisma và Zod schemas.
12. `src/services/admin.service.ts`: Viết lại các hàm User (`getAllUsersService`, `getUserDetailService`, `updateUserByAdminService`, `deleteUserByAdminService`, `createTeacherService`) bằng UserRepository và Prisma.
13. `src/cronJobs/deleteUnverifiedUsers.ts`: Chuyển sang gọi UserRepository (`deleteUnverifiedUsersOlderThan`).

### 2.3. File giữ nguyên (Không sửa):
* `prisma/schema.prisma`: Đã chuẩn hóa ở Phase 1, giữ nguyên 100%.
* `src/config/prisma.ts`: Singleton Prisma Client đã hoàn thiện.
* `src/utils/uuid.ts`: Đã có sẵn `isValidUUID`, `validateRouteUUIDParam`, `withCompatId`.
* `src/utils/prismaError.ts`: Error mapper đã hoàn thiện.
* Các file Controller: `user.controller.ts`, `category.controller.ts`, `admin.controller.ts` (giữ nguyên chữ ký và cách gọi Service).
* Toàn bộ các router, service, model thuộc Phase 3–10.

---

## 3. LỘ TRÌNH TRIỂN KHAI 8 BƯỚC CHI TIẾT

```text
┌───────────────────────────────────────────────────────────┐
│ Bước 0: Chạy Data Patch (Nếu được phê duyệt)             │
│        -> Vá 7 user lịch sử is_verified = true            │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 1: Zod Application Models                            │
│        -> user.model.ts, category.model.ts (Hybrid)       │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 2: Nâng cấp Functional Repositories                  │
│        -> user.repository.ts, category.repository.ts      │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 3: Di trú Validators & Middlewares                   │
│        -> user.middleware, category.middleware, UUID     │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 4: Di trú Services (Core Business Logic)             │
│        -> user.service, category.service, admin.service   │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 5: Cập nhật Background Cron Job                      │
│        -> deleteUnverifiedUsers.ts dùng UserRepository    │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 6: Kiểm tra biên dịch TypeScript (tsc --noEmit)      │
│        -> Đảm bảo không gãy type bất kỳ đâu               │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 7: Chạy Automated Integration Tests                 │
│        -> scripts/test-phase2-auth-user.ts (22 endpoints) │
└─────────────────────────────┬─────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────┐
│ Bước 8: Báo cáo kết quả & Hướng dẫn Postman Test          │
└───────────────────────────────────────────────────────────┘
```

### Bước 0: Data Patch cho 7 người dùng lịch sử (Cần phê duyệt)
* Tạo script `scripts/migration-utils/patch-phase2-users.ts`.
* Thực hiện cập nhật an toàn:
  ```typescript
  await prisma.user.updateMany({
    where: { isVerified: false },
    data: { isVerified: true }
  })
  ```
* Ghi log xác nhận trước và sau khi vá dữ liệu.

### Bước 1: Xây dựng Zod Application Models
* Cập nhật `src/models/user.model.ts`:
  * Xuất: `userSchema`, `userPublicSchema`, `userCompactSchema`, `userInternalSchema`, `socialLinksSchema`.
  * Xuất inferred types: `User`, `UserPublic`, `UserCompact`, `UserInternal`, `SocialLinks`.
  * Giữ Mongoose `UserModel` export tương thích cho Phase 3–8.
* Cập nhật `src/models/category.model.ts`:
  * Xuất: `categorySchema`, `categoryPublicSchema`, `categoryAdminSchema`.
  * Xuất inferred types: `Category`, `CategoryPublic`, `CategoryAdmin`.
  * Giữ Mongoose `CategoryModel` export tương thích.

### Bước 2: Nâng cấp Functional Repositories
* Trong `src/repositories/user.repository.ts`:
  * Bổ sung `findUserWithCredentials` (lấy kèm password).
  * Bổ sung `findUserByResetToken` (tìm user theo token hash và thời hạn).
  * Bổ sung `findTeachersWithPagination` (truy vấn danh sách giáo viên kèm phân trang).
  * Bổ sung `countAdminsExcluding` (đếm số admin còn lại).
  * Bổ sung `deleteUnverifiedUsersOlderThan` (xóa tài khoản chưa kích hoạt quá hạn).
* Trong `src/repositories/category.repository.ts`:
  * Bổ sung `findCategoryByName`.
  * Bổ sung `isCategoryNameTaken`, `isCategorySlugTaken`.
  * Bổ sung `softDeleteCategory`.
* Cập nhật `src/repositories/index.ts` để re-export.

### Bước 3: Di trú Validators & Middlewares
* Trong `src/middlewares/user.middleware.ts`:
  * Thay `UserModel.findOne({ email })` bằng `findUserByEmail` từ UserRepository.
  * Thay `mongoose.Types.ObjectId.isValid` bằng `isValidUUID` trong `userIdValidator`.
* Trong `src/middlewares/admin.middleware.ts`:
  * Thay `.isMongoId()` bằng `custom(validateUUIDParam)` cho `getUserDetailValidator` và `updateUserByAdminValidator`.
* Trong `src/middlewares/category.middleware.ts`:
  * Thay `CategoryModel.findOne({ name })` bằng `findCategoryByName`.
  * Thay `mongoose.Types.ObjectId.isValid` bằng `isValidUUID`.
  * Tạo validator mới `categoryIdValidator`.
* Trong `src/routes/admin.route.ts`:
  * Gán `categoryIdValidator` vào `adminRouter.delete('/categories/:id')`.

### Bước 4: Di trú Tầng Services (Business Logic & Mapping)
* Chuyển đổi `src/services/user.service.ts`:
  * `registerUserService`: dùng `addUser` với hashed password, hash OTP, `isVerified: false`. Gửi email.
  * `verifyOtpService`: dùng `findUserByEmail`, kiểm tra OTP hash, cập nhật `isVerified: true`, xóa OTP.
  * `loginUserService`: dùng `findUserWithCredentials`, so khớp bcrypt, sinh tokens, lưu hash refresh token bằng `updateUser`.
  * `getMeService`: dùng `findUserById` kèm `USER_PUBLIC_SELECT`, map `socialLinks`, wrap `withCompatId`.
  * `logoutUserService`: dùng `updateUser` xóa refresh token.
  * `forgotPasswordService`: dùng `updateUser` lưu hash reset token và expires. Gửi email.
  * `resetPasswordService`: dùng `findUserByResetToken`, băm mật khẩu mới, cập nhật qua `updateUser`.
  * `updateMeService`: dùng `updateUser`, bóc tách `socialLinks` sang các cột `social*`, map trả về `safeUser`.
  * `changePasswordService`: dùng `findUserWithCredentials`, đối chiếu mật khẩu cũ, cập nhật mật khẩu mới.
  * `getListTeachersService`: dùng `findTeachersWithPagination`, map `socialLinks` và `withCompatId`.
  * `getAccessTokenService`: đối chiếu hash refresh token, sinh access token mới.
* Chuyển đổi `src/services/category.service.ts`:
  * `createCategoryService`: slugify, kiểm tra slug qua repository, `addCategory`.
  * `deleteCategoryService`: `softDeleteCategory`.
  * `updateCategoryService`: `updateCategory`.
  * `getCategoriesService`: `findActiveCategories`, phân trang, wrap `withCompatId`.
  * `getCategoryDetailService`: `findCategoryBySlug`, wrap `withCompatId`.
* Chuyển đổi phần User trong `src/services/admin.service.ts`:
  * `getAllUsersService`: `findAllUsers`, phân trang, map `socialLinks`, wrap `withCompatId`.
  * `getUserDetailService`: `findUserById`, map `socialLinks`.
  * `updateUserByAdminService`: kiểm tra `username` trùng lặp, `updateUser`.
  * `deleteUserByAdminService`: kiểm tra self-delete, kiểm tra `countAdminsExcluding`, `deleteUser`.
  * `createTeacherService`: kiểm tra conflict email/username, `addUser` với role `TEACHER`, status `ACTIVE`, `isVerified: true`.

### Bước 5: Cập nhật Background Cron Job
* Cập nhật `src/cronJobs/deleteUnverifiedUsers.ts`:
  * Thay thế `UserModel.deleteMany` bằng hàm `deleteUnverifiedUsersOlderThan` từ `UserRepository`.
  * Ghi log chuẩn hóa số lượng bản ghi đã dọn dẹp.

### Bước 6: Kiểm tra biên dịch TypeScript
* Chạy lệnh: `npx tsc --noEmit`
* Kiểm tra toàn bộ codebase không có bất kỳ lỗi typing nào (kể cả ở các phase sau 3–10).

### Bước 7: Xây dựng & Chạy Automated Integration Tests
* Xây dựng script `scripts/test-phase2-auth-user.ts`.
* Kiểm thử tự động bao phủ toàn bộ 22 endpoint:
  1. Test Register User & OTP generation.
  2. Test Verify OTP & Account activation.
  3. Test Login (Success & Invalid Credentials & Unverified guard).
  4. Test Get Me (Authenticated profile & Sanitization check).
  5. Test Refresh Access Token flow.
  6. Test Update Profile & `socialLinks` round-trip mapping.
  7. Test Change Password & Re-login with new password.
  8. Test Forgot Password & Reset Password with token.
  9. Test Public User Profile & Get Teachers with pagination.
  10. Test Category CRUD (Create, Read list, Read detail slug, Update, Soft delete).
  11. Test Admin User Management (List users, Detail, Update role/status, Conflict checks).
  12. Test Admin Delete User safeguards (Self-delete blocked, Last admin blocked).
  13. Test Admin Create Teacher.
  14. Test Cron job delete unverified users behavior.
* Yêu cầu kết quả: **100% PASS**.

### Bước 8: Báo cáo & Hướng dẫn Postman Verification
* Lập báo cáo kết quả triển khai `PHASE_2_IMPLEMENTATION_REPORT.md`.
* Chuẩn bị Postman Guide chi tiết để chủ dự án thực hiện manual verification.
* Dừng và chờ chủ dự án nghiệm thu trước khi chuyển sang Phase 3.
