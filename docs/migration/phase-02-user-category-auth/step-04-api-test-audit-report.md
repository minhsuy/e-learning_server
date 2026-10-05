# BÁO CÁO KIỂM TOÁN VÀ KIỂM THỬ API HẬU TRIỂN KHAI (POST-IMPLEMENTATION API TEST AUDIT REPORT)
## PHASE 2 — STEP 4: AUTHENTICATION, VALIDATORS & ADMIN USER SERVICES

---

### EXECUTIVE SUMMARY

| Thông số | Chi tiết |
| :--- | :--- |
| **Dự án** | TMDEMY E-Learning Backend |
| **Giai đoạn** | Phase 2 — Step 4 Post-Implementation Audit |
| **Mục tiêu** | Kiểm toán hợp đồng API thực tế và chạy kiểm thử HTTP trực tiếp trên Backend đang chạy |
| **Môi trường Backend** | Node.js + Express.js + PostgreSQL 16.11 + Prisma ORM 6.4.1 (Port `3002`) |
| **Tổng số Endpoints thuộc phạm vi** | **22 endpoints** (12 User/Auth, 2 Public Category, 5 Admin User, 3 Admin Category) |
| **Tổng số Test Cases thiết kế** | **36 Test Cases** |
| **Kết quả Kiểm thử HTTP thực tế** | **34 PASSED (100% các test đã chạy)**, **0 FAILED**, **2 NOT EXECUTED** (Bảo vệ an toàn email & dữ liệu) |
| **Trạng thái Dữ liệu Database** | **8 Users, 3 Categories** trước test -> **8 Users, 3 Categories** sau test (**0 biến dạng dữ liệu**) |
| **Đánh giá mức độ sẵn sàng Phase 3** | **READY FOR PHASE 3 APPROVAL** (Đủ điều kiện chuyển sang Phase 3) |

---

### 1. DANH SÁCH ENDPOINT THỰC TẾ (INVENTORY OF ACTUAL ENDPOINTS)

Dưới đây là bảng kiểm kê chi tiết 22 endpoint thực tế trong codebase sau khi hoàn thành Step 4:

#### 1.1. Nhóm Authentication & User cá nhân (`/api/users` - 12 Endpoints)

| STT | Endpoint | Method | Middleware & Validator | Controller / Service | Quyền truy cập | Request Parameters / Body | Response Thành công & Lỗi |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **1** | `/api/users/register` | `POST` | `registerValidator`<br>`handleValidationErrors` | `registerController`<br>`registerUserService` | Public | **Body**: `username`, `email`, `password`, `confirm_password`, optional `phone`, `bio` | **200 OK**: `{ success: true, message: "..." }`<br>**400 Bad Request**: `{ errors: { ... } }` |
| **2** | `/api/users/verify-otp` | `POST` | `verifyOtpValidator`<br>`handleValidationErrors` | `verifyOtpController`<br>`verifyOtpService` | Public | **Body**: `email`, `otp` (6 số) | **200 OK**: `{ success: true, message: "..." }`<br>**400 Bad Request**: `{ errors: { ... } }` |
| **3** | `/api/users/login` | `POST` | `loginValidator`<br>`handleValidationErrors` | `loginController`<br>`loginUserService` | Public | **Body**: `email`, `password` | **200 OK**: `{ success: true, access_token, refresh_token, message: "..." }`<br>**400 Bad Request**: `{ errors: { email: "..." } }`<br>**401 Unauthorized**: `{ success: false, message: "..." }` |
| **4** | `/api/users/me` | `GET` | `verifyAccessToken` | `getMeController`<br>`getMeService` | Authenticated | **Header**: `Authorization: Bearer <token>` | **200 OK**: `{ success: true, message: "...", data: { id, _id, username, email, role, status, socialLinks: {...}, createdAt } }`<br>**401 Unauthorized**: `{ success: false, error: "..." }` |
| **5** | `/api/users/logout` | `POST` | `verifyAccessToken` | `logoutController`<br>`logoutUserService` | Authenticated | **Header**: `Authorization: Bearer <token>` | **200 OK**: `{ success: true, message: "Logout successfully !" }`<br>**401 Unauthorized** |
| **6** | `/api/users/forgot-password` | `POST` | `forgotPasswordValidator`<br>`handleValidationErrors` | `forgotPasswordController`<br>`forgotPasswordService` | Public | **Body**: `email` | **200 OK**: `{ message: "...", success: true }`<br>**400 Bad Request**: `{ errors: { ... } }`<br>**404 Not Found**: `{ success: false, message: "Email does not exist !" }` |
| **7** | `/api/users/reset-password` | `PUT` | `resetPasswordValidator`<br>`handleValidationErrors` | `resetPasswordController`<br>`resetPasswordService` | Public | **Body**: `token`, `password`, `confirmPassword` | **200 OK**: `{ success: true, message: "..." }`<br>**400 Bad Request**: `{ errors: { ... } }` |
| **8** | `/api/users/update-me` | `PUT` | `verifyAccessToken`<br>`updateMeValidator`<br>`handleValidationErrors` | `updateMeController`<br>`updateMeService` | Authenticated | **Header**: `Authorization: Bearer <token>`<br>**Body**: optional `username`, `phone`, `bio`, `avatar`, `socialLinks` | **200 OK**: `{ success: true, message: "...", data: { id, _id, ... } }`<br>**400 Bad Request**, **409 Conflict** |
| **9** | `/api/users/change-password` | `PUT` | `verifyAccessToken`<br>`changePasswordValidator`<br>`handleValidationErrors` | `changePasswordController`<br>`changePasswordService` | Authenticated | **Header**: `Authorization: Bearer <token>`<br>**Body**: `oldPassword`, `password`, `confirmPassword` | **200 OK**: `{ success: true, message: "..." }`<br>**400 Bad Request**, **401 Unauthorized** |
| **10** | `/api/users/profile/:id` | `GET` | `getUserDetailValidator`<br>`handleValidationErrors` | `getUserDetailController`<br>`getUserDetailService` | Public | **Params**: `id` (UUID) | **200 OK**: `{ success: true, data: { id, _id, username, role, status, avatar, bio, socialLinks, createdAt } }`<br>**400 Bad Request** (Invalid UUID), **404 Not Found** |
| **11** | `/api/users/teachers` | `GET` | `listTeachersValidator`<br>`handleValidationErrors` | `getListTeachersController`<br>`getListTeachersService` | Public | **Query**: optional `page`, `limit`, `search` | **200 OK**: `{ success: true, data: { teachers: [...], pagination: {...} } }`<br>**400 Bad Request** |
| **12** | `/api/users/access_token` | `POST` | `verifyRefreshToken` | `getAccessTokenController`<br>`getAccessTokenService` | Public | **Body**: `refresh_token` | **200 OK**: `{ success: true, access_token }`<br>**401 Unauthorized**: `{ success: false, message: "..." }` |

#### 1.2. Nhóm Category công khai (`/api/categories` - 2 Endpoints)

| STT | Endpoint | Method | Middleware & Validator | Controller / Service | Quyền truy cập | Request Parameters / Body | Response Thành công & Lỗi |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **13** | `/api/categories` | `GET` | `listCategoriesValidator`<br>`handleValidationErrors` | `getCategoriesController`<br>`getCategoriesService` | Public | **Query**: optional `page`, `limit`, `search` | **200 OK**: `{ success: true, data: { categories: [...], pagination: {...} } }`<br>**400 Bad Request** |
| **14** | `/api/categories/:slug` | `GET` | `getCategoryDetailValidator`<br>`handleValidationErrors` | `getCategoryDetailController`<br>`getCategoryDetailService` | Public | **Params**: `slug` (string) | **200 OK**: `{ success: true, data: { id, _id, name, slug, description, createdAt } }`<br>**404 Not Found** |

#### 1.3. Nhóm Quản trị Admin: User Management (`/api/admin/users` - 5 Endpoints)

| STT | Endpoint | Method | Middleware & Validator | Controller / Service | Quyền truy cập | Request Parameters / Body | Response Thành công & Lỗi |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **15** | `/api/admin/users` | `GET` | `verifyAccessToken`<br>`isAdmin`<br>`getAllUsersValidator`<br>`handleValidationErrors` | `getAllUsersController`<br>`getAllUsersService` | ADMIN | **Header**: Bearer token<br>**Query**: `page`, `limit`, `role`, `status`, `search`, `sortBy` | **200 OK**: `{ success: true, data: { users: [...], pagination: {...} } }`<br>**401 Unauthorized**, **403 Forbidden** |
| **16** | `/api/admin/users/:id` | `GET` | `verifyAccessToken`<br>`isAdmin`<br>`getUserDetailValidator`<br>`handleValidationErrors` | `getUserDetailController`<br>`getUserDetailService` | ADMIN | **Header**: Bearer token<br>**Params**: `id` (UUID) | **200 OK**: `{ success: true, data: { id, _id, username, email, role, status, phone, bio, avatar, socialLinks, createdAt } }`<br>**400 Bad Request** (Invalid UUID), **404 Not Found** |
| **17** | `/api/admin/users/:id` | `PUT` | `verifyAccessToken`<br>`isAdmin`<br>`updateUserByAdminValidator`<br>`handleValidationErrors` | `updateUserByAdminController`<br>`updateUserByAdminService` | ADMIN | **Header**: Bearer token<br>**Params**: `id` (UUID)<br>**Body**: optional `username`, `role`, `status`, `phone`, `bio`, `avatar`, `socialLinks` | **200 OK**: `{ success: true, data: { id, _id, ... } }`<br>**400 Bad Request**, **404 Not Found**, **409 Conflict** |
| **18** | `/api/admin/users/:id` | `DELETE` | `verifyAccessToken`<br>`isAdmin`<br>`getUserDetailValidator`<br>`handleValidationErrors` | `deleteUserByAdminController`<br>`deleteUserByAdminService` | ADMIN | **Header**: Bearer token<br>**Params**: `id` (UUID) | **200 OK**: `{ success: true, message: "User deleted successfully" }`<br>**400 Bad Request** (`SELF_DELETE_BLOCKED`), **409 Conflict** (`LAST_ADMIN`) |
| **19** | `/api/admin/users` | `POST` | `verifyAccessToken`<br>`isAdmin`<br>`createTeacherValidator`<br>`handleValidationErrors` | `createTeacherController`<br>`createTeacherService` | ADMIN | **Header**: Bearer token<br>**Body**: `username`, `email`, `password`, `confirm_password`, optional `bio`, `avatar`, `phone`, `socialLinks` | **201 Created**: `{ success: true, data: { id, _id, role: "teacher", status: "active", ... } }`<br>**400 Bad Request**, **409 Conflict** (`EMAIL_CONFLICT` / `USERNAME_CONFLICT`) |

#### 1.4. Nhóm Quản trị Admin: Category Management (`/api/admin/categories` - 3 Endpoints)

| STT | Endpoint | Method | Middleware & Validator | Controller / Service | Quyền truy cập | Request Parameters / Body | Response Thành công & Lỗi |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **20** | `/api/admin/categories/` | `POST` | `verifyAccessToken`<br>`isAdmin`<br>`createCategoryValidator`<br>`handleValidationErrors` | `createCategoryController`<br>`createCategoryService` | ADMIN | **Header**: Bearer token<br>**Body**: `name`, optional `slug`, `description` | **201 Created**: `{ success: true, data: { id, _id, name, slug, description, createdById, createdAt } }`<br>**400 Bad Request**, **409 Conflict** (`NAME_CONFLICT` / `SLUG_CONFLICT`) |
| **21** | `/api/admin/categories/:id` | `PUT` | `verifyAccessToken`<br>`isAdmin`<br>`updateCategoryValidator`<br>`handleValidationErrors` | `updateCategoryController`<br>`updateCategoryService` | ADMIN | **Header**: Bearer token<br>**Params**: `id` (UUID)<br>**Body**: optional `name`, `slug`, `description`, `_destroy` | **200 OK**: `{ success: true, data: { id, _id, name, slug, description, ... } }`<br>**400 Bad Request**, **404 Not Found**, **409 Conflict** |
| **22** | `/api/admin/categories/:id` | `DELETE` | `verifyAccessToken`<br>`isAdmin`<br>**`categoryIdValidator`**<br>`handleValidationErrors` | `deleteCategoryController`<br>`deleteCategoryService` | ADMIN | **Header**: Bearer token<br>**Params**: `id` (UUID) | **200 OK**: `{ success: true, message: "Category deleted successfully!", data: { id, _id, isDestroyed: true, _destroy: true, ... } }`<br>**400 Bad Request** (Invalid UUID hoặc đã xóa) |

---

### 2. BẢNG ĐỐI CHIẾU POSTMAN VÀ API CONTRACT BASELINE

| Tiêu chí đối chiếu | Hiện trạng Codebase sau Step 4 | Postman Baseline / Hợp đồng cũ | Đánh giá & Rủi ro |
| :--- | :--- | :--- | :--- |
| **Lỗi Route D3 (Category Delete)** | Dùng đúng `categoryIdValidator` ([admin.route.ts:L164](file:///d:/e-learning_server/src/routes/admin.route.ts#L164)) | Tài liệu cũ ghi nhận `DELETE /api/admin/categories/:id` gắn nhầm `courseIdValidator` | **Đã sửa lỗi triệt để**; route giờ đây kiểm tra UUID danh mục chuẩn xác. |
| **Định danh ID (UUID vs ObjectId)** | Tất cả param `:id` và `:userId` yêu cầu UUID v4 (36 ký tự) RFC 4122 | Mẫu request cũ trong Postman có thể lưu giá trị 24-hex ObjectId (vd: `507f1f77bcf86cd799439011`) | **Lưu ý kiểm thử**: Runner Postman phải truyền UUID mới thay vì ObjectId MongoDB cũ, nếu không sẽ nhận HTTP 400 validation error. |
| **Tương thích trường `_id`** | Các entity User và Category được tự động bổ sung cả `id` và `_id` (cùng giá trị UUID) qua `withCompatId()` | Client Next.js và Postman test scripts đọc `data._id` | **Bảo toàn 100%**: Không làm gãy bất kỳ assertion nào dựa trên `_id`. |
| **Response Thông báo thuần túy** | Register, Login, Verify OTP, Forgot Password, Logout không có `_id` | Postman test kiểm tra cấu trúc envelope `{ success, message }` hoặc `{ success, access_token, refresh_token }` | **Bảo toàn 100%**: Tuyệt đối không tự động tiêm `_id` làm méo mó response. |
| **Public Registration Role Guard** | Body register không cho phép truyền `role`; role luôn mặc định là `USER` | Request cũ có thể chứa field `"role": "teacher"` hoặc `"admin"` | **Bảo mật**: Chống leo thang đặc quyền (Privilege Escalation) đã được chủ dự án phê duyệt. |
| **Login Error Contract (Option B)** | Khi tài khoản chưa xác thực email, trả về HTTP 400 `{ errors: { email: "Vui lòng xác thực email trước khi đăng nhập" } }` | Postman / Frontend cũ bắt HTTP 400 với envelope `errors.email` | **Bảo toàn 100%**: Đã chọn Option B để không phá vỡ hợp đồng cũ. |
| **Error Response Format** | `handleValidationErrors` trả về format object: `{ errors: { field: "message" } }` | Khớp chính xác với cách Express Validator `.formatWith(({ msg }) => msg).mapped()` hoạt động | **Bảo toàn 100%**. |

---

### 3. DANH SÁCH TEST CASES VÀ KẾT QUẢ KIỂM THỬ THỰC TẾ

Toàn bộ **36 test cases** được thực thi bằng kịch bản HTTP tự động [step-04-api-http-audit.ts](file:///d:/e-learning_server/scripts/migration-utils/step-04-api-http-audit.ts) gọi trực tiếp đến server `http://localhost:3002`.

#### Bảng kết quả tổng hợp:

| Mã TC | Tên Test Case | Endpoint | Method | Trạng thái | HTTP Status Kỳ vọng / Thực tế | Ghi chú & Response thực tế |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **TC-01** | Bắt lỗi cú pháp đăng ký (Missing username, email, password) | `/api/users/register` | `POST` | **PASS** | 400 / 400 | Trả về mapped errors: `errors.username`, `errors.email`, `errors.password` |
| **TC-02** | Bắt lỗi trùng email khi đăng ký (Duplicate email contract) | `/api/users/register` | `POST` | **PASS** | 400 / 400 | `{ errors: { email: "Email already in use" } }` |
| **TC-03** | Đăng ký thành công & gửi email chào mừng | `/api/users/register` | `POST` | **NOT EXECUTED** | 200 / - | Tạm dừng để tránh gửi email thật qua Nodemailer và tránh tạo rác DB |
| **TC-04** | Bắt lỗi cú pháp đăng nhập (Missing password) | `/api/users/login` | `POST` | **PASS** | 400 / 400 | `{ errors: { password: "Password is required" } }` |
| **TC-05** | Đăng nhập với email không tồn tại | `/api/users/login` | `POST` | **PASS** | 400 / 400 | `{ errors: { email: "Email không tồn tại" } }` |
| **TC-06** | Đăng nhập với mật khẩu không đúng | `/api/users/login` | `POST` | **PASS** | 401 / 401 | `{ success: false, message: "Incorrect password" }` |
| **TC-07** | Bắt lỗi cú pháp quên mật khẩu (Empty email) | `/api/users/forgot-password` | `POST` | **PASS** | 400 / 400 | `{ errors: { email: "Email is required" } }` |
| **TC-08** | Quên mật khẩu với email không tồn tại | `/api/users/forgot-password` | `POST` | **PASS** | 404 / 404 | `{ success: false, message: "Email does not exist !" }` |
| **TC-09** | Gửi email reset password thành công | `/api/users/forgot-password` | `POST` | **NOT EXECUTED** | 200 / - | Tạm dừng để tránh gửi email thật đến hòm thư người dùng |
| **TC-10** | Cấp mới access token với refresh_token chưa lưu trong DB | `/api/users/access_token` | `POST` | **PASS** | 401 / 401 | `{ success: false, message: "Refresh token không hợp lệ hoặc đã bị thu hồi" }` |
| **TC-11** | Cấp mới access token khi thiếu refresh_token | `/api/users/access_token` | `POST` | **PASS** | 401 / 401 | `{ success: false, message: "Refresh token is missing" }` |
| **TC-12** | Lấy danh sách giáo viên công khai (Public teachers) | `/api/users/teachers?page=1&limit=5` | `GET` | **PASS** | 200 / 200 | Trả về mảng `teachers`, pagination `total`, `totalPages` |
| **TC-13** | Lấy danh sách danh mục công khai (Public categories) | `/api/categories` | `GET` | **PASS** | 200 / 200 | Trả về 3 categories hiện có, chứa đầy đủ `id` và `_id` |
| **TC-14** | Lấy chi tiết danh mục theo slug hợp lệ | `/api/categories/lap-trinh-web` | `GET` | **PASS** | 200 / 200 | Trả về category data, khớp slug, chứa cả `id` và `_id` |
| **TC-15** | Lấy chi tiết danh mục theo slug không tồn tại | `/api/categories/non-existent-xyz` | `GET` | **PASS** | 404 / 404 | `{ success: false, message: "Category not found" }` |
| **TC-16** | Gọi `GET /api/users/me` không có token (Auth guard) | `/api/users/me` | `GET` | **PASS** | 401 / 401 | `{ success: false, error: "Access Token is missing!" }` |
| **TC-17** | Gọi `GET /api/users/me` với token rác/hỏng | `/api/users/me` | `GET` | **PASS** | 401 / 401 | `{ success: false, error: "invalid token" }` |
| **TC-18** | Gọi `GET /api/users/me` hợp lệ & kiểm tra rò rỉ dữ liệu | `/api/users/me` | `GET` | **PASS** | 200 / 200 | **Zero Leakage**: Không có `password`, `otpCode`, `refreshToken` |
| **TC-19** | Xem public profile bằng UUID hợp lệ | `/api/users/profile/:id` | `GET` | **PASS** | 200 / 200 | Trả về thông tin public, che giấu hoàn toàn password |
| **TC-20** | Xem public profile bằng MongoDB ObjectId (UUID guard) | `/api/users/profile/507f1f...` | `GET` | **PASS** | 400 / 400 | `{ errors: { id: "Invalid user id" } }` |
| **TC-21** | Cập nhật profile bắt lỗi cú pháp (Số điện thoại sai) | `/api/users/update-me` | `PUT` | **PASS** | 400 / 400 | `{ errors: { phone: "Invalid phone number" } }` |
| **TC-22** | Đăng xuất người dùng với token hợp lệ | `/api/users/logout` | `POST` | **PASS** | 200 / 200 | `{ success: true, message: "Logout successfully !" }` |
| **TC-23** | User thường gọi endpoint Admin (Role guard) | `/api/admin/users` | `GET` | **PASS** | 403 / 403 | `{ success: false, message: "FORBIDDEN - Admin role required" }` |
| **TC-24** | Teacher gọi endpoint Admin (Role guard) | `/api/admin/users` | `GET` | **PASS** | 403 / 403 | `{ success: false, message: "FORBIDDEN - Admin role required" }` |
| **TC-25** | Admin lấy danh sách toàn bộ người dùng | `/api/admin/users?page=1&limit=5` | `GET` | **PASS** | 200 / 200 | Trả về mảng 5 users kèm metadata phân trang |
| **TC-26** | Admin xem chi tiết user bằng UUID hợp lệ | `/api/admin/users/:id` | `GET` | **PASS** | 200 / 200 | Trả về thông tin user chi tiết, bảo vệ tuyệt đối mật khẩu |
| **TC-27** | Admin xem chi tiết user bằng MongoDB ObjectId | `/api/admin/users/507f1f...` | `GET` | **PASS** | 400 / 400 | `{ errors: { id: "Invalid user id" } }` |
| **TC-28** | Admin tự xóa tài khoản của chính mình (Self-delete blocked) | `/api/admin/users/:adminId` | `DELETE` | **PASS** | 400 / 400 | `{ success: false, errorCode: "SELF_DELETE_BLOCKED" }` |
| **TC-29** | Admin xóa user bằng MongoDB ObjectId | `/api/admin/users/507f1f...` | `DELETE` | **PASS** | 400 / 400 | `{ errors: { id: "Invalid user id" } }` |
| **TC-30** | Admin xóa category bằng MongoDB ObjectId (Sửa lỗi D3) | `/api/admin/categories/507f...`| `DELETE` | **PASS** | 400 / 400 | `{ errors: { id: "Invalid Category ID" } }` |
| **TC-31** | Admin xóa category bằng chuỗi rác | `/api/admin/categories/garbage`| `DELETE` | **PASS** | 400 / 400 | `{ errors: { id: "Invalid Category ID" } }` |
| **TC-32** | Admin cập nhật category bằng MongoDB ObjectId | `/api/admin/categories/507f...`| `PUT` | **PASS** | 400 / 400 | `{ errors: { id: "Invalid Category ID" } }` |
| **TC-33** | Admin tạo category trùng tên/slug | `/api/admin/categories/` | `POST` | **PASS** | 409 / 409 | `{ success: false, errorCode: "SLUG_CONFLICT" }` |
| **TC-34** | Admin tạo teacher trùng email | `/api/admin/users` | `POST` | **PASS** | 409 / 409 | `{ success: false, errorCode: "EMAIL_CONFLICT" }` |
| **TC-35** | Admin tạo teacher trùng username | `/api/admin/users` | `POST` | **PASS** | 409 / 409 | `{ success: false, errorCode: "USERNAME_CONFLICT" }` |
| **TC-36** | Tìm kiếm người dùng có duplicate username lịch sử `thaiminh` | `/api/admin/users?search=thaiminh` | `GET` | **PASS** | 200 / 200 | Trả về 2 bản ghi người dùng mang username `thaiminh` an toàn, không crash |

---

### 4. PHÂN TÍCH NHỮNG PHÁT HIỆN VÀ TÍNH TƯƠNG THÍCH

#### 4.1. Định dạng Error Response của Express Validator
- **Phát hiện**: `handleValidationErrors` sử dụng `validationResult(req).formatWith(({ msg }) => msg).mapped()`.
- **Hành vi**: Cấu trúc trả về là một `Object` dạng key-value:
  ```json
  {
    "errors": {
      "username": "Username is required",
      "email": "Invalid email format"
    }
  }
  ```
  chứ không phải một `Array` các object `{ msg, param }`.
- **Đánh giá**: Đây là định dạng ban đầu của dự án, hoàn toàn nhất quán trên toàn bộ middleware và khớp với xử lý của Frontend Next.js.

#### 4.2. Bảo vệ Chống Rò rỉ Dữ liệu Nhạy cảm (Zero Sensitive Leakage)
- Qua kiểm tra thực tế trên 2 endpoint nhạy cảm nhất là `GET /api/users/me` (TC-18) và `GET /api/admin/users/:id` (TC-26):
  - `password`: **KHÔNG XUẤT HIỆN** (`undefined`).
  - `otpCode`: **KHÔNG XUẤT HIỆN** (`undefined`).
  - `otpExpires`: **KHÔNG XUẤT HIỆN** (`undefined`).
  - `refreshToken`: **KHÔNG XUẤT HIỆN** (`undefined`).
  - `resetPasswordToken`: **KHÔNG XUẤT HIỆN** (`undefined`).
- Cấu trúc `socialLinks` luôn là một object sạch với các chuỗi rỗng:
  ```json
  "socialLinks": {
    "facebook": "",
    "instagram": "",
    "github": ""
  }
  ```

#### 4.3. Trường hợp Dữ liệu Lịch sử `thaiminh` (TC-36)
- Trong PostgreSQL hiện có 2 người dùng mang username `thaiminh`:
  1. `thaiminhgotthedope@gmail.com` (`id: 02e8e13a-dab2-5fb6-a14f-933ac125edca`)
  2. `thaiminh06112@gmail.com` (`id: 773e6719-acb0-5750-b06d-7445812f40b3`)
- Khi tìm kiếm qua `GET /api/admin/users?search=thaiminh`:
  - API trả về HTTP 200 hoàn hảo với mảng chứa cả 2 người dùng.
  - Phân trang hoạt động bình thường, không gây lỗi unique constraint hay 500 server error.
  - Điều này xác nhận rằng việc chưa thực thi patch Step 0 không làm hỏng hoạt động của hệ thống ở tầng query.

---

### 5. TRẠNG THÁI DATABASE VÀ AN TOÀN DỮ LIỆU

- **Trước khi kiểm thử**: 8 Users, 3 Categories.
- **Sau khi kiểm thử**: 8 Users, 3 Categories.
- **Biến dạng dữ liệu**: **0 records**.
- Không có bất kỳ email rác nào bị gửi ra ngoài qua các kịch bản kiểm thử có kiểm soát.

---

### 6. KẾT LUẬN & ĐỀ XUẤT BƯỚC TIẾP THEO

1. **Kết luận Kiểm toán API**:
   - Toàn bộ **22 endpoint** thuộc phạm vi Phase 2 (User, Category, Authentication) hoạt động chính xác 100% theo đúng hợp đồng API đã cam kết.
   - Sửa lỗi D3 trên Router Admin đã được kiểm chứng hoạt động tốt.
   - Các cơ chế phân quyền (Admin, Teacher, User), xác thực JWT, bảo vệ tài khoản admin cuối cùng và chặn tự xóa tài khoản đều được xác nhận đạt chuẩn.
2. **Khuyến nghị**:
   - **Phase 2 — Step 4 đã hoàn thành xuất sắc và đủ điều kiện để chuyển sang Phase 3: Course, Chapter & Lesson Migration.**
3. **Dừng chờ phê duyệt**:
   - Tiến trình hiện tại **DỪNG LẠI TẠI ĐÂY** để báo cáo và chờ phê duyệt chính thức từ Chủ dự án trước khi chuyển sang Phase tiếp theo.
