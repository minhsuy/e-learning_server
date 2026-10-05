# ĐỐI CHIẾU HỢP ĐỒNG API TOÀN DIỆN (API CONTRACT AUDIT REVISION)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES
**Dự án**: TMDEMY E-Learning Backend  
**Nguyên tắc**: API CONTRACT FREEZE, CHÍNH XÁC SERIALIZATION RESPONSE & TÍNH NHẤT QUÁN CỦA ROLE

---

## 1. NGUYÊN TẮC SERIALIZATION DỮ LIỆU ĐẦU RA (SERIALIZATION RULES)

Thực hiện đúng chỉ đạo của Chủ dự án:
> "Không tự động áp dụng `withCompatId()` cho mọi response. Phải đối chiếu response thực tế và Postman Collection: `_id`, `id`, `socialLinks`, Decimal, Sensitive fields. Chỉ serialize những field đúng với contract cũ. Không đổi URL, method, request, response, status code hoặc nghiệp vụ nếu chưa được phê duyệt."

### 1.1. Phân loại Khóa Định danh (`_id` vs `id`) theo Từng Endpoint
* **Không dùng cơ chế tự động toàn cục**: Tuyệt đối không tự động tiêm `_id` vào mọi response của hệ thống.
* **Quy chuẩn đối chiếu thực tế**:
  1. **Nhóm Entity Objects (Cần `_id` và `id`)**:
     * Đối tượng User: Trong trường `data` của `GET /api/users/me`, `GET /api/users/profile/:id`, `PUT /api/users/update-me`, `GET /api/users/teachers`, `GET /api/admin/users`, `GET /api/admin/users/:id`, `PUT /api/admin/users/:id`, `POST /api/admin/users` (create teacher).
     * Đối tượng Category: Trong trường `data` của `GET /api/categories`, `GET /api/categories/:slug`, `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`.
     * *Hành vi*: Các entity này trả về cả `_id` (để tương thích frontend Next.js cũ) và `id` (chuẩn UUID mới).
  2. **Nhóm Response Thông báo thuần túy (Tuyệt đối không chèn `_id` hay `id`)**:
     * `POST /api/users/register`: `{ success: true, message: "..." }`
     * `POST /api/users/verify-otp`: `{ success: true, message: "..." }`
     * `POST /api/users/login`: `{ success: true, access_token: "...", refresh_token: "...", message: "..." }`
     * `POST /api/users/logout`: `{ success: true, message: "..." }`
     * `POST /api/users/forgot-password`: `{ message: "...", success: true }`
     * `PUT /api/users/reset-password`: `{ success: true, message: "..." }`
     * `PUT /api/users/change-password`: `{ success: true, message: "..." }`
     * `POST /api/users/access_token`: `{ success: true, access_token: "..." }`
     * `DELETE /api/admin/users/:id`: `{ success: true, message: "User deleted successfully" }`

### 1.2. Chuẩn hóa Cấu trúc `socialLinks`
* Trong Database PostgreSQL, thông tin mạng xã hội được lưu trữ qua 3 cột riêng biệt: `socialFacebook`, `socialInstagram`, `socialGithub`.
* Serializer tại Service Layer đảm bảo đóng gói chính xác thành object theo đúng schema cũ:
  ```json
  "socialLinks": {
    "facebook": user.socialFacebook || "",
    "instagram": user.socialInstagram || "",
    "github": user.socialGithub || ""
  }
  ```
* Nếu User không có thông tin mạng xã hội, các giá trị mặc định là chuỗi rỗng `""`. Tuyệt đối không trả về `null`, chuỗi string hay thiếu các key này.

### 1.3. Khóa Chặt Dữ liệu Nhạy cảm (Zero Sensitive Leakage)
* Các trường nhạy cảm bao gồm: `password`, `otpCode`, `otpExpires`, `refreshToken`, `resetPasswordToken`, `resetPasswordExpires`.
* Cơ chế bảo vệ 2 tầng:
  * **Tầng 1 (Database Repository)**: Các hằng số projection (`USER_PUBLIC_SELECT`, `TEACHER_PUBLIC_SELECT`) không bao giờ select các cột này từ PostgreSQL.
  * **Tầng 2 (Application Zod Schema)**: Sử dụng `userPublicSchema.parse()` tại Service để lọc sạch mọi trường ngoài danh mục cho phép trước khi gửi response ra client.

### 1.4. Đối chiếu Kiểu Dữ liệu Decimal
* Trong Phase 2 (User, Category, Authentication), **không có bất kỳ bảng dữ liệu nào chứa kiểu `Decimal`**.
* Toàn bộ giá trị số trong Category và User (như pagination `page`, `limit`, `total`) là kiểu Integer thuần túy, được parse bằng `Number()`.

---

## 2. ĐỐI CHIẾU VÀ BẢO TOÀN TÍNH NHẤT QUÁN CỦA USER ROLE (ROLE CONSISTENCY)

### 2.1. Bảng Đối chiếu Toàn diện giữa các Tầng

| Tầng hệ thống | Cú pháp / Giá trị thực tế | Ý nghĩa & Quy tắc xử lý |
| :--- | :--- | :--- |
| **PostgreSQL Raw Enum** | `'admin'`, `'teacher'`, `'user'` | Cột `role` thuộc enum `UserRole` được lưu trữ dưới dạng chuỗi thường trong PostgreSQL. |
| **Prisma Schema** | `ADMIN @map("admin")`<br>`TEACHER @map("teacher")`<br>`USER @map("user")` | Prisma mapping tự động chuyển đổi giữa enum TypeScript viết hoa (`UserRole.ADMIN`) và giá trị DB viết thường (`admin`). |
| **Mongoose Model cũ** | `enum: ['admin', 'teacher', 'user']` | Mongoose lưu và trả về giá trị lowercase. |
| **`src/types/enum.ts`** | `UserRole.ADMIN = 'admin'`<br>`UserRole.TEACHER = 'teacher'`<br>`UserRole.USER = 'user'` | Enum TypeScript ứng dụng được định nghĩa với value chuỗi thường. |
| **`verifyRole.ts` Middleware** | `req.user.role !== UserRole.ADMIN` (`'admin'`) | Middleware kiểm tra quyền dựa trên chuỗi thường `'admin'` và `'teacher'`. |
| **JWT Access Token Payload** | `{ userId: string, role: string }` | Token phải chứa `role` dạng lowercase (`'admin'`, `'teacher'`, `'user'`) để không bị `isAdmin` hay `isTeacher` từ chối (403 Forbidden). |
| **API Response Serializer** | `"role": "admin" \| "teacher" \| "user"` | Phải trả về chuỗi thường trong JSON Response theo đúng API Contract mà Frontend Next.js đang parse. |

### 2.2. Cơ chế Đồng bộ Role trong Implementation
1. **Tại Repository Layer**: Truy vấn và cập nhật database sử dụng Prisma Enum (`UserRole.ADMIN`, `UserRole.TEACHER`, `UserRole.USER`).
2. **Tại Service Layer & Serializer**:
   * Khi sinh JWT Access Token tại `loginUserService` và `getAccessTokenService`:
     ```ts
     const roleString = user.role.toLowerCase() // 'admin' | 'teacher' | 'user'
     const access_token = generateAccessToken({ userId: user.id, role: roleString })
     ```
   * Khi serialize User data trả về HTTP Response:
     ```ts
     role: user.role.toLowerCase()
     ```
3. **Tại Middleware Layer**: Giữ nguyên toàn bộ logic hiện tại của `isAdmin`, `isTeacher`, `isTeacherOrAdmin` trong `verifyRole.ts`. Tuyệt đối không thay đổi mã nguồn của middleware xác thực quyền.

---

## 3. BẢNG TRA CỨU HỢP ĐỒNG 22 ENDPOINTS VÀ SERIALIZER

### 3.1. Nhóm Authentication & User cá nhân (`/api/users`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Cấu trúc Response Chuẩn xác |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `/api/users/register` | `POST` | `registerValidator`, `handleValidationErrors` | `registerController` | `200 OK`<br>`{ "success": true, "message": "Đăng ký tài khoản thành công . Vui lòng check email để xác thực !" }` |
| **2** | `/api/users/verify-otp` | `POST` | `verifyOtpValidator`, `handleValidationErrors` | `verifyOtpController` | `200 OK`<br>`{ "success": true, "message": "Xác thực email thành công!" }` |
| **3** | `/api/users/login` | `POST` | `loginValidator`, `handleValidationErrors` | `loginController` | `200 OK`<br>`{ "success": true, "access_token": "...", "refresh_token": "...", "message": "Login successfully !" }` |
| **4** | `/api/users/me` | `GET` | `verifyAccessToken` | `getMeController` | `200 OK`<br>`{ "success": true, "message": "Get user info successfully !", "data": { "_id", "id", "username", "email", "status": "active", "role": "user", "avatar", "phone", "bio", "socialLinks": {...}, "createdAt", "updatedAt" } }` |
| **5** | `/api/users/logout` | `POST` | `verifyAccessToken` | `logoutController` | `200 OK`<br>`{ "success": true, "message": "Logout successfully !" }` |
| **6** | `/api/users/forgot-password` | `POST` | `forgotPasswordValidator`, `handleValidationErrors` | `forgotPasswordController` | `200 OK`<br>`{ "message": "Reset password email sent  , please check your email !", "success": true }` |
| **7** | `/api/users/reset-password` | `PUT` | `resetPasswordValidator`, `handleValidationErrors` | `resetPasswordController` | `200 OK`<br>`{ "success": true, "message": "Password reset successfully!" }` |
| **8** | `/api/users/update-me` | `PUT` | `verifyAccessToken`, `updateMeValidator`, `handleValidationErrors` | `updateMeController` | `200 OK`<br>`{ "success": true, "message": "Profile updated successfully", "data": { "_id", "id", "username", "phone", "bio", "avatar", "socialLinks": {...}, ... } }` |
| **9** | `/api/users/change-password` | `PUT` | `verifyAccessToken`, `changePasswordValidator`, `handleValidationErrors` | `changePasswordController` | `200 OK`<br>`{ "success": true, "message": "Password changed successfully" }` |
| **10** | `/api/users/profile/:id` | `GET` | `getUserDetailValidator` (UUID), `handleValidationErrors` | `getUserDetailController` | `200 OK`<br>`{ "success": true, "message": "Get user info successfully !", "data": { "_id", "id", "username", "role": "...", "status": "active", "avatar", "bio", "socialLinks": {...}, "createdAt" } }` |
| **11** | `/api/users/teachers` | `GET` | `listTeachersValidator`, `handleValidationErrors` | `getListTeachersController` | `200 OK`<br>`{ "success": true, "message": "Fetched teachers successfully!", "data": { "teachers": [ { "_id", "id", "username", "avatar", "bio", "socialLinks": {...}, "createdAt" } ], "pagination": { "page", "limit", "total", "totalPages" } } }` |
| **12** | `/api/users/access_token` | `POST` | `verifyRefreshToken` | `getAccessTokenController` | `200 OK`<br>`{ "success": true, "access_token": "..." }` |

---

### 3.2. Nhóm Category công khai (`/api/categories`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Cấu trúc Response Chuẩn xác |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **13** | `/api/categories` | `GET` | `listCategoriesValidator`, `handleValidationErrors` | `getCategoriesController` | `200 OK`<br>`{ "success": true, "message": "Fetched categories successfully!", "data": { "categories": [ { "_id", "id", "name", "slug", "description", "createdAt" } ], "pagination": { "page", "limit", "total", "totalPages" } } }` |
| **14** | `/api/categories/:slug` | `GET` | `getCategoryDetailValidator`, `handleValidationErrors` | `getCategoryDetailController` | `200 OK`<br>`{ "success": true, "message": "Fetched category detail successfully!", "data": { "_id", "id", "name", "slug", "description", "createdAt" } }` |

---

### 3.3. Nhóm Quản trị Admin: User Management (`/api/admin/users`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Cấu trúc Response Chuẩn xác |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **15** | `/api/admin/users` | `GET` | `verifyAccessToken`, `isAdmin`, `getAllUsersValidator`, `handleValidationErrors` | `getAllUsersController` | `200 OK`<br>`{ "success": true, "message": "Fetched users successfully !", "data": { "users": [ { "_id", "id", "username", "email", "role": "...", "status": "active", "phone", "bio", "avatar", "socialLinks": {...}, "createdAt" } ], "pagination": { "page", "limit", "total", "totalPages" } } }` |
| **16** | `/api/admin/users/:id` | `GET` | `verifyAccessToken`, `isAdmin`, `getUserDetailValidator` (UUID), `handleValidationErrors` | `getUserDetailController` | `200 OK`<br>`{ "success": true, "message": "Get user info successfully !", "data": { "_id", "id", "username", "email", "role": "...", "status": "active", "phone", "bio", "avatar", "socialLinks": {...}, "createdAt" } }` |
| **17** | `/api/admin/users/:id` | `PUT` | `verifyAccessToken`, `isAdmin`, `updateUserByAdminValidator` (UUID), `handleValidationErrors` | `updateUserByAdminController` | `200 OK`<br>`{ "success": true, "message": "User updated successfully", "data": { "_id", "id", "username", "email", ... } }` |
| **18** | `/api/admin/users/:id` | `DELETE` | `verifyAccessToken`, `isAdmin`, `getUserDetailValidator` (UUID), `handleValidationErrors` | `deleteUserByAdminController` | `200 OK`<br>`{ "success": true, "message": "User deleted successfully" }` |
| **19** | `/api/admin/users` | `POST` | `verifyAccessToken`, `isAdmin`, `createTeacherValidator`, `handleValidationErrors` | `createTeacherController` | `201 Created`<br>`{ "success": true, "message": "Teacher created successfully", "data": { "_id", "id", "username", "email", "role": "teacher", "status": "active", ... } }` |

---

### 3.4. Nhóm Quản trị Admin: Category Management (`/api/admin/categories`)

| STT | Endpoint | Method | Middleware & Validator | Controller | Cấu trúc Response Chuẩn xác |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **20** | `/api/admin/categories` | `POST` | `verifyAccessToken`, `isAdmin`, `createCategoryValidator`, `handleValidationErrors` | `createCategoryController` | `201 Created`<br>`{ "success": true, "message": "Category created successfully!", "data": { "_id", "id", "name", "slug", "description", "createdById", "createdAt" } }` |
| **21** | `/api/admin/categories/:id` | `PUT` | `verifyAccessToken`, `isAdmin`, `updateCategoryValidator` (UUID), `handleValidationErrors` | `updateCategoryController` | `200 OK`<br>`{ "success": true, "message": "Category updated successfully!", "data": { "_id", "id", "name", "slug", "description", ... } }` |
| **22** | `/api/admin/categories/:id` | `DELETE` | `verifyAccessToken`, `isAdmin`, **`categoryIdValidator` (UUID)**, `handleValidationErrors` | `deleteCategoryController` | `200 OK`<br>`{ "success": true, "message": "Category deleted successfully!", "data": { "_id", "id", "name", "slug", "isDestroyed": true, ... } }` |

---

## 4. KẾT LUẬN KIỂM TOÁN HỢP ĐỒNG API

* 100% hợp đồng API của Postman Collection và Next.js Frontend được bảo toàn hoàn hảo.
* Việc chuẩn hóa Role Casing bảo đảm an toàn tuyệt đối cho middleware phân quyền `verifyRole.ts` mà không phải thay đổi mã nguồn middleware.
* Phân loại serialization rành mạch ngăn ngừa triệt để lỗi tự ý chèn `_id` vào các phản hồi thông báo thuần túy.
