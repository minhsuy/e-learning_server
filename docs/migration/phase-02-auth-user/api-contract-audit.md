# KIỂM TOÁN HỢP ĐỒNG API (API CONTRACT AUDIT)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES

---

## 1. NGUYÊN TẮC BẮT BUỘC: API CONTRACT FREEZE

Tuân thủ nghiêm ngặt Quy tắc cốt lõi của dự án:
* **Không thay đổi**: Endpoint URL, HTTP Method, Request Body, Query Parameters, URL Parameters, Response JSON structure, Tên trường trong Response, HTTP Status Codes, Error Response format, Authentication & Authorization behavior.
* **Mục tiêu**: Migration Database Layer từ MongoDB sang PostgreSQL không được làm ảnh hưởng đến bất kỳ hành vi hoặc kiểm thử nào của Postman Collection và Next.js Frontend hiện hành.

---

## 2. BẢNG ĐỐI CHIẾU CHI TIẾT TẤT CẢ 22 ENDPOINTS TRONG PHẠM VI PHASE 2

### 2.1. Nhóm Authentication & User cá nhân (`/api/users`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Service | Auth & Role | Request Body / Query / Params | Success Status & Response Structure | Error Responses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `/api/users/register` | `POST` | `registerValidator`, `handleValidationErrors` | `registerController` | `registerUserService` | Public | **Body**: `{ username, email, password, confirm_password, phone?, bio?, role? }` | `200 OK`<br>`{ "success": true, "message": "Đăng ký tài khoản thành công . Vui lòng check email để xác thực !" }` | `400 Bad Request` (Email already in use / Validation error) |
| **2** | `/api/users/verify-otp` | `POST` | `verifyOtpValidator`, `handleValidationErrors` | `verifyOtpController` | `verifyOtpService` | Public | **Body**: `{ email, otp }` (otp 6 số) | `200 OK`<br>`{ "success": true, "message": "Xác thực email thành công!" }` hoặc `Tài khoản đã được xác thực trước đó` | `400 Bad Request` (OTP không đúng / hết hạn / User không tồn tại) |
| **3** | `/api/users/login` | `POST` | `loginValidator`, `handleValidationErrors` | `loginController` | `loginUserService` | Public | **Body**: `{ email, password }` | `200 OK`<br>`{ "success": true, "access_token": string, "refresh_token": string, "message": "Login successfully !" }` | `400 Bad Request` (Email/Pass thiếu, chưa kích hoạt)<br>`401 Unauthorized` (Sai mật khẩu / không tìm thấy user) |
| **4** | `/api/users/me` | `GET` | `verifyAccessToken` | `getMeController` | `getMeService` | Bearer Token (Any Role) | Không có params | `200 OK`<br>`{ "success": true, "message": "Get user info successfully !", "data": { "_id", "id", "username", "email", "status", "role", "avatar", "phone", "bio", "socialLinks": {...}, "createdAt", "updatedAt" } }` | `401 Unauthorized` (Token hết hạn / thiếu)<br>`400 Bad Request` (User không tồn tại) |
| **5** | `/api/users/logout` | `POST` | `verifyAccessToken` | `logoutController` | `logoutUserService` | Bearer Token (Any Role) | Không có params | `200 OK`<br>`{ "success": true, "message": "Logout successfully !" }` | `401 Unauthorized`<br>`404 Not Found` |
| **6** | `/api/users/forgot-password` | `POST` | `forgotPasswordValidator`, `handleValidationErrors` | `forgotPasswordController` | `forgotPasswordService` | Public | **Body**: `{ email }` | `200 OK`<br>`{ "message": "Reset password email sent  , please check your email !", "success": true }` | `400 Bad Request` (Email không đúng format/không tồn tại)<br>`404 Not Found` |
| **7** | `/api/users/reset-password` | `PUT` | `resetPasswordValidator`, `handleValidationErrors` | `resetPasswordController` | `resetPasswordService` | Public | **Body**: `{ token, password, confirm_password }` | `200 OK`<br>`{ "success": true, "message": "Password reset successfully!" }` | `400 Bad Request` (Token không hợp lệ hoặc đã hết hạn) |
| **8** | `/api/users/update-me` | `PUT` | `verifyAccessToken`, `updateMeValidator`, `handleValidationErrors` | `updateMeController` | `updateMeService` | Bearer Token (Any Role) | **Body**: `{ username?, phone?, bio?, avatar?, socialLinks?: { facebook?, instagram?, github? } }` | `200 OK`<br>`{ "success": true, "message": "Profile updated successfully", "data": { "_id", "id", "username", "phone", "bio", "avatar", "socialLinks": {...}, ... } }` | `401 Unauthorized`<br>`404 Not Found` |
| **9** | `/api/users/change-password` | `PUT` | `verifyAccessToken`, `changePasswordValidator`, `handleValidationErrors` | `changePasswordController` | `changePasswordService` | Bearer Token (Any Role) | **Body**: `{ oldPassword, password, confirm_password }` | `200 OK`<br>`{ "success": true, "message": "Password changed successfully" }` | `400 Bad Request` (Mật khẩu cũ không chính xác / xác nhận không khớp) |
| **10** | `/api/users/profile/:id` | `GET` | `getUserDetailValidator` (UUID), `handleValidationErrors` | `getUserDetailController` | `getUserDetailService` | Public | **URL Param**: `id` (UUID) | `200 OK`<br>`{ "success": true, "message": "Get user info successfully !", "data": { "_id", "id", "username", "avatar", "phone", "bio", "socialLinks": {...}, "role", "status", "createdAt" } }` | `400 Bad Request` (Invalid ID)<br>`404 Not Found` (User not found) |
| **11** | `/api/users/teachers` | `GET` | `listTeachersValidator`, `handleValidationErrors` | `getListTeachersController` | `getListTeachersService` | Public | **Query**: `page=1&limit=10&search=...&sortBy=createdAt` | `200 OK`<br>`{ "success": true, "message": "Fetched teachers successfully!", "data": { "teachers": [ { "_id", "id", "username", "avatar", "bio", "socialLinks", "createdAt" } ], "pagination": { "page", "limit", "total", "totalPages" } } }` | `400 Bad Request` |
| **12** | `/api/users/access_token` | `POST` | `verifyRefreshToken` | `getAccessTokenController` | `getAccessTokenService` | Public (Refresh Token Body) | **Body**: `{ refresh_token }` | `200 OK`<br>`{ "success": true, "access_token": string }` | `401 Unauthorized` (Token thiếu / hết hạn / bị thu hồi) |

---

### 2.2. Nhóm Category công khai (`/api/categories`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Service | Auth & Role | Request Body / Query / Params | Success Status & Response Structure | Error Responses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **13** | `/api/categories` | `GET` | `listCategoriesValidator`, `handleValidationErrors` | `getCategoriesController` | `getCategoriesService` | Public | **Query**: `page=1&limit=20&search=...` | `200 OK`<br>`{ "success": true, "message": "Fetched categories successfully!", "data": { "categories": [ { "_id", "id", "name", "slug", "description", "createdAt" } ], "pagination": { "page", "limit", "total", "totalPages" } } }` | `400 Bad Request` |
| **14** | `/api/categories/:slug` | `GET` | `getCategoryDetailValidator`, `handleValidationErrors` | `getCategoryDetailController` | `getCategoryDetailService` | Public | **URL Param**: `slug` (kebab-case) | `200 OK`<br>`{ "success": true, "message": "Fetched category detail successfully!", "data": { "_id", "id", "name", "slug", "description", "createdAt" } }` | `404 Not Found` (Category not found) |

---

### 2.3. Nhóm Quản trị Admin: User Management (`/api/admin/users`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Service | Auth & Role | Request Body / Query / Params | Success Status & Response Structure | Error Responses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **15** | `/api/admin/users` | `GET` | `verifyAccessToken`, `isAdmin`, `getAllUsersValidator`, `handleValidationErrors` | `getAllUsersController` | `getAllUsersService` | Admin Only | **Query**: `page=1&limit=10&role=...&status=...&search=...&sortBy=createdAt` | `200 OK`<br>`{ "success": true, "message": "Fetched users successfully !", "data": { "users": [ { "_id", "id", "username", "email", "role", "status", "phone", "bio", "avatar", "socialLinks", "createdAt" } ], "pagination": { "page", "limit", "total", "totalPages" } } }` | `401 Unauthorized`<br>`403 Forbidden` |
| **16** | `/api/admin/users/:id` | `GET` | `verifyAccessToken`, `isAdmin`, `getUserDetailValidator` (UUID), `handleValidationErrors` | `getUserDetailController` | `getUserDetailService` | Admin Only | **URL Param**: `id` (UUID) | `200 OK`<br>`{ "success": true, "message": "Get user info successfully !", "data": { "_id", "id", "username", "email", "role", "status", "phone", "bio", "avatar", "socialLinks", "createdAt" } }` | `401 Unauthorized`<br>`403 Forbidden`<br>`400/404` |
| **17** | `/api/admin/users/:id` | `PUT` | `verifyAccessToken`, `isAdmin`, `updateUserByAdminValidator` (UUID), `handleValidationErrors` | `updateUserByAdminController` | `updateUserByAdminService` | Admin Only | **URL Param**: `id`<br>**Body**: `{ username?, role?, status?, phone?, bio?, avatar?, socialLinks? }` | `200 OK`<br>`{ "success": true, "message": "User updated successfully", "data": { "_id", "id", "username", "email", ... } }` | `400 Bad Request`<br>`404 Not Found`<br>`409 Conflict` (`USERNAME_CONFLICT`) |
| **18** | `/api/admin/users/:id` | `DELETE` | `verifyAccessToken`, `isAdmin`, `getUserDetailValidator` (UUID), `handleValidationErrors` | `deleteUserByAdminController` | `deleteUserByAdminService` | Admin Only | **URL Param**: `id` (UUID) | `200 OK`<br>`{ "success": true, "message": "User deleted successfully" }` | `400 Bad Request` (`SELF_DELETE_BLOCKED`)<br>`404 Not Found`<br>`409 Conflict` (`LAST_ADMIN`) |
| **19** | `/api/admin/users` | `POST` | `verifyAccessToken`, `isAdmin`, `createTeacherValidator`, `handleValidationErrors` | `createTeacherController` | `createTeacherService` | Admin Only | **Body**: `{ username, email, password, confirm_password, phone?, bio?, avatar?, socialLinks? }` (role bị cấm truyền, mặc định teacher) | `201 Created`<br>`{ "success": true, "message": "Teacher created successfully", "data": { "_id", "id", "username", "email", "role": "teacher", "status": "active", ... } }` | `400 Bad Request`<br>`409 Conflict` (`EMAIL_CONFLICT` / `USERNAME_CONFLICT`) |

---

### 2.4. Nhóm Quản trị Admin: Category Management (`/api/admin/categories`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Service | Auth & Role | Request Body / Query / Params | Success Status & Response Structure | Error Responses |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **20** | `/api/admin/categories` | `POST` | `verifyAccessToken`, `isAdmin`, `createCategoryValidator`, `handleValidationErrors` | `createCategoryController` | `createCategoryService` | Admin Only | **Body**: `{ name, slug?, description? }` | `201 Created`<br>`{ "success": true, "message": "Category created successfully!", "data": { "_id", "id", "name", "slug", "description", "createdById", "createdAt" } }` | `400 Bad Request`<br>`409 Conflict` (`SLUG_CONFLICT`) |
| **21** | `/api/admin/categories/:id` | `PUT` | `verifyAccessToken`, `isAdmin`, `updateCategoryValidator` (UUID), `handleValidationErrors` | `updateCategoryController` | `updateCategoryService` | Admin Only | **URL Param**: `id` (UUID)<br>**Body**: `{ name?, slug?, description?, _destroy? }` | `200 OK`<br>`{ "success": true, "message": "Category updated successfully!", "data": { "_id", "id", "name", "slug", "description", ... } }` | `400 Bad Request`<br>`404 Not Found`<br>`409 Conflict` (`SLUG_CONFLICT`) |
| **22** | `/api/admin/categories/:id` | `DELETE` | `verifyAccessToken`, `isAdmin`, `categoryIdValidator` (UUID), `handleValidationErrors` | `deleteCategoryController` | `deleteCategoryService` | Admin Only | **URL Param**: `id` (UUID) | `200 OK`<br>`{ "success": true, "message": "Category deleted successfully!", "data": { "_id", "id", ... } }` | `400 Bad Request` (Category already deleted)<br>`404 Not Found` |

---

## 3. CHI TIẾT ÁNH XẠ TRƯỜNG DỮ LIỆU ĐẶC THÙ (FIELD MAPPINGS)

### 3.1. Tương thích ID: `_id` song song `id`
* **Vấn đề**: Next.js Frontend và Postman Collection đã được viết với giả định dữ liệu có trường `_id`. Trong PostgreSQL/Prisma, khóa chính là `id`.
* **Giải pháp chuẩn hóa**:
  Sử dụng helper đã có tại `src/utils/uuid.ts`:
  ```typescript
  export function withCompatId<T extends { id: string }>(entity: T): T & { _id: string }
  ```
  Mọi response trả về từ Service trước khi gửi ra Client đều được wrap qua `withCompatId`. Dữ liệu sẽ đồng thời có cả `id` và `_id` mang giá trị UUID tương đương.

### 3.2. Cấu trúc `socialLinks`
* **Đầu vào (Request Body)**: Client gửi `{ socialLinks: { facebook, instagram, github } }`.
* **Tầng Database (Prisma/PostgreSQL)**: Lưu trữ tại 3 cột riêng biệt `socialFacebook`, `socialInstagram`, `socialGithub`.
* **Đầu ra (Response JSON)**: Service bóc tách 3 cột và đóng gói ngược lại thành:
  ```json
  "socialLinks": {
    "facebook": user.socialFacebook || "",
    "instagram": user.socialInstagram || "",
    "github": user.socialGithub || ""
  }
  ```
  Đảm bảo khớp 100% với JSON Schema cũ.

### 3.3. Trạng thái xóa mềm Category (`_destroy` vs `isDestroyed`)
* **Đầu vào**: Client có thể gửi `_destroy: true/false` trong PUT `/api/admin/categories/:id`.
* **Database**: Cột `is_destroyed` (`isDestroyed` trong Prisma Client).
* **Đầu ra**: Service map `_destroy: category.isDestroyed` nếu client có yêu cầu, hoặc giữ cả `isDestroyed` và `_destroy` để tương thích tối đa.

---

## 4. BẢO VỆ DỮ LIỆU NHẠY CẢM (RESPONSE SANITIZATION)

Tất cả các endpoint trả về thông tin User (`getMe`, `profile`, `updateMe`, `getAllUsers`, `getUserDetail`, `createTeacher`) **BẮT BUỘC** loại trừ hoàn toàn các trường sau khỏi JSON response:
* `password`
* `otpCode` (`otp_code`)
* `otpExpires` (`otp_expires`)
* `refreshToken` (`refresh_token`)
* `resetPasswordToken` (`reset_password_token`)
* `resetPasswordExpires` (`reset_password_expires`)

Việc loại trừ được đảm bảo 2 lớp:
1. **Lớp 1 (Database)**: Repository sử dụng `USER_PUBLIC_SELECT` để không select các cột này từ PostgreSQL.
2. **Lớp 2 (Application Model)**: Service parse qua `userPublicSchema` của Zod để loại bỏ triệt để mọi thuộc tính không mong muốn trước khi trả về Controller.
