# TMDEMY — ADMIN MANAGEMENT API SPECIFICATION (ADMIN_API.MD)

Tài liệu đặc tả toàn bộ 13 API thuộc quyền Quản trị viên (`ADMIN`) quản lý người dùng, khóa học, duyệt khóa học giảng viên và danh mục hệ thống.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

Tất cả các endpoint trong tài liệu này **BẮT BUỘC có header `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`** và tài khoản phải có `role = admin`.

---

## 1. USER MANAGEMENT

### 1.1. GET /api/admin/users
* **Method**: `GET`
* **Endpoint**: `/api/admin/users`
* **Purpose**: Lấy danh sách toàn bộ người dùng trong hệ thống (Học viên, Giảng viên, Quản trị viên) có lọc theo vai trò, trạng thái, tìm kiếm và phân trang.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `page` | number | No | `1` | Số trang (>= 1) |
  | `limit` | number | No | `10` | Số lượng người dùng mỗi trang (1-100) |
  | `role` | string | No | `undefined` | Lọc theo role: `admin`, `teacher`, `user` |
  | `status` | string | No | `undefined` | Lọc theo trạng thái: `active`, `inactive` |
  | `search` | string | No | `undefined` | Tìm kiếm theo username hoặc email |
  | `sortBy` | string | No | `"createdAt"`| Sắp xếp theo: `createdAt`, `username`, `email` |
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched users successfully !",
    "data": {
      "users": [
        {
          "id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
          "_id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
          "username": "hoang_teacher",
          "email": "teacher@tmdemy.vn",
          "role": "teacher",
          "status": "active",
          "avatar": "",
          "phone": "0987654321",
          "bio": "Senior Instructor",
          "socialLinks": { "facebook": "", "instagram": "", "github": "" },
          "createdAt": "2026-02-10T08:00:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
    }
  }
  ```
* **Raw HTTP Request**:
  ```http
  GET {{BASE_URL}}/api/admin/users?page=1&limit=10&role=teacher
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  ```

---

### 1.2. GET /api/admin/users/:id
* **Method**: `GET`
* **Endpoint**: `/api/admin/users/:id`
* **Purpose**: Xem chi tiết thông tin tài khoản người dùng theo UUID.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Path Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :---: | :---: | :--- |
  | `id` | UUID | Yes | ID của người dùng cần xem |
* **Success Response (200 OK)**: Trả về object user đầy đủ thông tin an toàn kèm `socialLinks`.
* **Error Responses**:
  * 400 Bad Request: ID không phải UUID.
  * 403 Forbidden: Người dùng không phải role Admin.
  * 404 Not Found: Người dùng không tồn tại.
* **Raw HTTP Request**:
  ```http
  GET {{BASE_URL}}/api/admin/users/1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  ```

---

### 1.3. PUT /api/admin/users/:id
* **Method**: `PUT`
* **Endpoint**: `/api/admin/users/:id`
* **Purpose**: Cập nhật thông tin, vai trò (`role`) hoặc trạng thái (`status`: ACTIVE/INACTIVE) của người dùng.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "username": "hoang_updated",
    "role": "teacher",
    "status": "active",
    "phone": "0912345678",
    "bio": "Updated bio description",
    "socialLinks": {
      "facebook": "https://facebook.com/newlink"
    }
  }
  ```
* **Validation Rules**:
  * Cấm cập nhật trực tiếp `email`, `password`, `refresh_token`, `reset_password_token`.
  * Phải gửi ít nhất một trường được phép cập nhật.
  * **Chống tự khóa / tự đổi quyền (BE-F9.11-008)**: Admin KHÔNG THỂ tự khóa tài khoản của chính mình (`status: "inactive"` hoặc `locked: true`) hoặc tự giáng cấp vai trò của chính mình (`role != "admin"`). Vi phạm sẽ nhận `400 Bad Request` kèm message `"Không thể tự khóa hoặc thay đổi vai trò của chính tài khoản quản trị đang đăng nhập"` và `errorCode: "SELF_LOCK_BLOCKED"` / `"SELF_DEMOTE_BLOCKED"`.
* **Error Responses**:
  * 400 Bad Request: Gửi field cấm, input không hợp lệ, hoặc tự khóa/đổi vai trò tài khoản chính mình.
  * 409 Conflict: Trùng `username` với tài khoản khác (`USERNAME_CONFLICT`).
* **Raw HTTP Request**:
  ```http
  PUT {{BASE_URL}}/api/admin/users/1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "status": "inactive"
  }
  ```

---

### 1.4. PATCH /api/users/admin/lock/:id & PATCH /api/users/admin/role/:id
* **Method**: `PATCH`
* **Endpoints**:
  * Khóa/Mở khóa: `/api/users/admin/lock/:id` (Body: `{ "isLocked": boolean }` hoặc `{ "status": "active" | "inactive" }`)
  * Đổi vai trò: `/api/users/admin/role/:id` (Body: `{ "role": "admin" | "teacher" | "user" }`)
* **Purpose**: Endpoint chuyên biệt cho giao diện Admin User Management thao tác nhanh khóa hoặc đổi vai trò người dùng.
* **Security Guard (BE-F9.11-008)**: Backend chặn toàn diện thao tác tự khóa hoặc tự tước quyền admin với `400 Bad Request`.

---

### 1.4. DELETE /api/admin/users/:id
* **Method**: `DELETE`
* **Endpoint**: `/api/admin/users/:id`
* **Purpose**: Xóa vĩnh viễn tài khoản người dùng khỏi hệ thống.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Business Rules**:
  * **Chống tự xóa tài khoản**: Admin không được phép tự xóa tài khoản của chính mình (`SELF_DELETE_BLOCKED`, trả 400 Bad Request).
  * **Bảo vệ Admin cuối cùng**: Không thể xóa tài khoản Admin cuối cùng trong hệ thống (`LAST_ADMIN`, trả 409 Conflict).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User deleted successfully"
  }
  ```
* **Raw HTTP Request**:
  ```http
  DELETE {{BASE_URL}}/api/admin/users/1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  ```

---

### 1.5. POST /api/admin/users (Create Teacher)
* **Method**: `POST`
* **Endpoint**: `/api/admin/users`
* **Purpose**: Admin tạo trực tiếp tài khoản Giảng viên (Teacher) đã được kích hoạt sẵn (`isVerified = true`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "username": "teacher_nam",
    "email": "nam.teacher@tmdemy.vn",
    "password": "Password123",
    "confirm_password": "Password123",
    "phone": "0988776655",
    "bio": "Chuyên gia React & TypeScript",
    "socialLinks": {
      "github": "https://github.com/namteacher"
    }
  }
  ```
* **Validation Rules**:
  * Trường `role` không được gửi (endpoint này mặc định gán role `teacher`).
  * `password` và `confirm_password` tối thiểu 8 ký tự và phải trùng khớp.
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Teacher created successfully",
    "data": {
      "id": "f4c9a8b1-1234-4567-89ab-cdef01234567",
      "username": "teacher_nam",
      "email": "nam.teacher@tmdemy.vn",
      "role": "teacher",
      "status": "active"
    }
  }
  ```
* **Error Responses**:
  * 409 Conflict: Trùng email (`EMAIL_CONFLICT`) hoặc trùng username (`USERNAME_CONFLICT`).
* **Raw HTTP Request**:
  ```http
  POST {{BASE_URL}}/api/admin/users
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "username": "teacher_nam",
    "email": "nam.teacher@tmdemy.vn",
    "password": "Password123",
    "confirm_password": "Password123"
  }
  ```

---

## 2. COURSE MANAGEMENT

### 2.1. GET /api/admin/courses
* **Method**: `GET`
* **Endpoint**: `/api/admin/courses`
* **Purpose**: Lấy danh sách toàn bộ khóa học để quản lý, hỗ trợ lọc theo trạng thái (`approved`, `pending`, `rejected`), tác giả (`author`) và cờ xóa mềm (`_destroy`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Query Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :---: | :---: | :--- |
  | `page` | number | No | Số trang (mặc định 1) |
  | `limit` | number | No | Số lượng mỗi trang (mặc định 10) |
  | `status` | string | No | `approved`, `pending`, `rejected` |
  | `author` | UUID | No | Lọc theo ID giảng viên |
  | `_destroy` | boolean | No | `true` (xem khóa học đã xóa mềm), `false` |
  | `search` | string | No | Tìm kiếm theo tiêu đề |
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched all courses successfully!",
    "data": {
      "courses": [
        {
          "id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
          "_id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
          "title": "Node.js Microservices Architecture",
          "slug": "nodejs-microservices-architecture",
          "price": 799000,
          "status": "approved",
          "author": { "id": "uuid", "username": "hoang_teacher" },
          "category": { "id": "uuid", "name": "Backend Development" },
          "_destroy": false
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
    }
  }
  ```

---

### 2.2. POST /api/admin/courses
* **Method**: `POST`
* **Endpoint**: `/api/admin/courses`
* **Purpose**: Admin tạo khóa học trực tiếp. Khóa học được gán ngay trạng thái `APPROVED` (không cần qua bước kiểm duyệt).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "title": "Mastering PostgreSQL & Prisma",
    "description": "Khóa học thực chiến cơ sở dữ liệu quan hệ cho lập trình viên Backend",
    "category": "category-uuid-v4",
    "type": "paid",
    "price": 599000,
    "old_price": 999000,
    "level": "intermediate",
    "image": "https://res.cloudinary.com/tmdemy/image/upload/v1/course.jpg",
    "intro_url": "https://youtube.com/watch?v=sample",
    "info": {
      "requirements": ["Cơ bản về SQL", "Biết TypeScript"],
      "benefits": ["Thành thạo tối ưu hóa truy vấn", "Hiểu sâu Prisma ORM"],
      "qa": [
        { "question": "Khóa học có chứng chỉ không?", "answer": "Có sau khi hoàn thành 70% và đạt bài kiểm tra." }
      ]
    }
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Course created (pending approval)",
    "data": {
      "id": "uuid",
      "status": "approved"
    }
  }
  ```

---

### 2.3. PUT /api/admin/courses/:id
* **Method**: `PUT`
* **Endpoint**: `/api/admin/courses/:id`
* **Purpose**: Admin cập nhật toàn diện thông tin khóa học (tiêu đề, giá, hình ảnh, yêu cầu, trạng thái, cờ `_destroy`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**: Trả về khóa học sau khi cập nhật với giá Decimal đã chuyển đổi thành Number.

---

### 2.4. DELETE /api/admin/courses/:id
* **Method**: `DELETE`
* **Endpoint**: `/api/admin/courses/:id`
* **Purpose**: Soft-delete khóa học (đặt `isDestroyed = true`). Khóa học bị ẩn khỏi catalog học viên nhưng vẫn giữ nguyên dữ liệu lịch sử đơn hàng.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Course soft-deleted successfully (by admin)!"
  }
  ```

---

### 2.5. PATCH /api/admin/courses/teacher/:id
* **Method**: `PATCH`
* **Endpoint**: `/api/admin/courses/teacher/:id`
* **Purpose**: Phê duyệt (`approved`) hoặc Từ chối (`rejected`) khóa học của Giảng viên. Bắt buộc lưu vết `rejectionReason` khi từ chối. Hệ thống tự động gửi Push Notification đến giảng viên kèm lý do từ chối.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "status": "rejected",
    "rejectionReason": "Chất lượng âm thanh bài học 3 và 4 quá rè, thiếu tài liệu đính kèm theo quy định."
  }
  ```
* **Validation Rules**: `status` bắt buộc phải là một trong: `approved`, `pending`, `rejected`. `rejectionReason` (hoặc alias `reason`) tùy chọn kiểu string.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Course updated successfully (by teacher/admin)!",
    "data": {
      "id": "uuid",
      "status": "rejected",
      "rejectionReason": "Chất lượng âm thanh bài học 3 và 4 quá rè, thiếu tài liệu đính kèm theo quy định.",
      "updatedAt": "2026-10-20T19:30:00.000Z"
    }
  }
  ```
* **Raw HTTP Request**:
  ```http
  PATCH {{BASE_URL}}/api/admin/courses/teacher/3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f
  Authorization: Bearer <ADMIN_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "status": "rejected",
    "rejectionReason": "Chất lượng âm thanh bài học 3 và 4 quá rè, thiếu tài liệu đính kèm theo quy định."
  }
  ```

---

## 3. CATEGORY MANAGEMENT

### 3.1. POST /api/admin/categories
* **Method**: `POST`
* **Endpoint**: `/api/admin/categories/`
* **Purpose**: Tạo mới một danh mục khóa học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "name": "Trí tuệ nhân tạo (AI & Data)",
    "description": "Các khóa học Machine Learning, Deep Learning và GenAI"
  }
  ```
* **Error Responses**:
  * 409 Conflict: Trùng tên danh mục (`NAME_CONFLICT`) hoặc trùng slug (`SLUG_CONFLICT`).
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Category created successfully!",
    "data": {
      "id": "uuid",
      "name": "Trí tuệ nhân tạo (AI & Data)",
      "slug": "tri-tue-nhan-tao-ai-data"
    }
  }
  ```

---

### 3.2. PUT /api/admin/categories/:id
* **Method**: `PUT`
* **Endpoint**: `/api/admin/categories/:id`
* **Purpose**: Cập nhật tên, slug, mô tả hoặc khôi phục danh mục đã xóa mềm.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`

---

### 3.3. DELETE /api/admin/categories/:id
* **Method**: `DELETE`
* **Endpoint**: `/api/admin/categories/:id`
* **Purpose**: Soft-delete danh mục khóa học (`isDestroyed = true`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Category deleted successfully!"
  }
  ```

---

## 4. ADMIN STATISTICS & DASHBOARD (IMPROVEMENT BE-F9.11)

### 4.1. GET /api/admin/statistics/financial (BE-F9.11-001)
* **Method**: `GET`
* **Endpoint**: `/api/admin/statistics/financial`
* **Purpose**: Thống kê tài chính & doanh thu toàn sàn cho Quản trị viên bằng Prisma Aggregate (`_sum`, `_count`), không bị giới hạn 100 giao dịch.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `timeRange` | string | No | `"all"` | Bộ lọc khoảng thời gian: `"7days"`, `"30days"`, `"1year"`, `"all"` |
  | `startDate` | string | No | `undefined` | Ngày bắt đầu (ISO date string) |
  | `endDate` | string | No | `undefined` | Ngày kết thúc (ISO date string) |
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy thống kê tài chính thành công",
    "data": {
      "grossRevenue": 154500000,
      "netRevenue": 154500000,
      "totalOrders": 1250,
      "completedOrders": 1100,
      "pendingOrders": 120,
      "rejectedOrders": 30,
      "averageOrderValue": 140454,
      "revenueByMonth": [
        { "month": "2026-08", "revenue": 45000000, "orderCount": 350 },
        { "month": "2026-09", "revenue": 52000000, "orderCount": 420 },
        { "month": "2026-10", "revenue": 57500000, "orderCount": 480 }
      ]
    }
  }
  ```

---

### 4.2. GET /api/admin/dashboard/summary (BE-F9.11-007)
* **Method**: `GET`
* **Endpoint**: `/api/admin/dashboard/summary`
* **Purpose**: API All-in-one tổng hợp toàn diện số liệu Admin Dashboard trong 1 payload duy nhất, thay thế 6 request song song.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy dữ liệu tổng quan dashboard thành công",
    "data": {
      "counts": {
        "totalUsers": 90,
        "totalStudents": 86,
        "totalTeachers": 3,
        "totalAdmins": 1,
        "totalCourses": 369,
        "pendingCourses": 23,
        "approvedCourses": 338,
        "rejectedCourses": 8,
        "totalOrders": 30,
        "pendingOrders": 9,
        "completedOrders": 21,
        "totalComments": 15
      },
      "financials": {
        "totalRevenue": 154500000,
        "conversionRate": 70.0
      },
      "pendingTasks": [
        { "type": "course_approval", "count": 23, "actionUrl": "/admin/courses?status=pending" },
        { "type": "order_fulfillment", "count": 9, "actionUrl": "/admin/orders?status=pending" }
      ],
      "recentUsers": [
        { "id": "u_1", "fullName": "Nguyen Van A", "email": "a@gmail.com", "role": "student", "createdAt": "2026-10-20T10:00:00Z" }
      ]
    }
  }
  ```

---

### 4.3. GET /api/coupons/admin/statistics & /api/admin/coupons/statistics (BE-F9.11-005)
* **Method**: `GET`
* **Endpoints**:
  * Chuẩn: `/api/coupons/admin/statistics`
  * Alias: `/api/admin/coupons/statistics`
* **Purpose**: Thống kê số lượng, trạng thái hoạt động, lượt sử dụng và tổng giá trị chiết khấu coupon toàn sàn.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy thống kê coupon thành công",
    "data": {
      "totalCoupons": 45,
      "activeCoupons": 28,
      "expiredCoupons": 12,
      "disabledCoupons": 5,
      "totalUsageCount": 1850,
      "totalDiscountAmount": 92500000
    }
  }
  ```
