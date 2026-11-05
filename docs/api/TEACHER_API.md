# TMDEMY — TEACHER COURSE MANAGEMENT API (TEACHER_API.MD)

Tài liệu đặc tả các API dành riêng cho Giảng viên (`TEACHER`) để khởi tạo, cập nhật, xóa và liệt kê các khóa học do chính mình sở hữu.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

Tất cả các endpoint trong tài liệu này **BẮT BUỘC có header `Authorization: Bearer <TEACHER_ACCESS_TOKEN>`** và tài khoản phải có `role = teacher`.

---

## 1. POST /api/teacher/courses/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/teacher/courses/`
* **Purpose**: Giảng viên tạo khóa học mới. Khóa học được tạo sẽ tự động mang trạng thái `PENDING` (chờ Admin phê duyệt).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Headers
```http
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "title": "Lập trình React Native từ cơ bản đến nâng cao",
  "description": "Xây dựng ứng dụng di động đa nền tảng iOS & Android với React Native và Expo",
  "category": "category-uuid-v4",
  "type": "paid",
  "price": 499000,
  "old_price": 899000,
  "level": "intermediate",
  "image": "https://res.cloudinary.com/tmdemy/image/upload/v1/rn.png",
  "intro_url": "https://youtube.com/watch?v=sample",
  "info": {
    "requirements": ["Biết JavaScript cơ bản", "Đã từng làm việc với React"],
    "benefits": ["Build được app thương mại điện tử", "Hiểu sâu Native modules"],
    "qa": [
      {
        "question": "Tôi có cần máy Mac để học không?",
        "answer": "Không bắt buộc, bạn có thể dùng Expo để test trên thiết bị thật."
      }
    ]
  }
}
```

### Validation Rules
* `title`: Bắt buộc, tối thiểu 3 ký tự.
* `category`: Tùy chọn, phải là UUID hợp lệ.
* `price`: Bắt buộc nếu `type = paid`, số thực >= 0.
* `old_price`: Tùy chọn, số thực >= 0.
* `level`: Tùy chọn (`beginner`, `intermediate`, `advanced`).
* `type`: Tùy chọn (`paid`, `free`).
* `image`, `intro_url`: Tùy chọn, định dạng URL hợp lệ.
* **Cấm gửi**: `status`, `author`, `_destroy`, `rating` (nếu gửi sẽ bị chặn).

### Business & Authorization Rules
* `authorId` được gán bằng `req.user.userId` từ JWT Token.
* Trạng thái khởi tạo: `status = PENDING`.
* Hệ thống tự động bắn Notification đến các tài khoản `ADMIN` để thông báo có khóa học mới cần duyệt.
* Tự động tạo slug URL kebab-case từ tiêu đề. Nếu slug bị trùng trả về `409 Conflict` (`SLUG_CONFLICT`).

### Success Response
* **HTTP Status**: `201 Created`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Course created (pending approval)",
    "data": {
      "id": "2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
      "_id": "2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
      "title": "Lập trình React Native từ cơ bản đến nâng cao",
      "slug": "lap-trinh-react-native-tu-co-ban-den-nang-cao",
      "price": 499000,
      "old_price": 899000,
      "oldPrice": 899000,
      "status": "pending",
      "level": "intermediate",
      "type": "paid",
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/teacher/courses/
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Lập trình React Native từ cơ bản đến nâng cao",
  "price": 499000
}
```

---

## 2. PUT /api/teacher/courses/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/teacher/courses/:id`
* **Purpose**: Giảng viên cập nhật nội dung khóa học do mình sở hữu.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã khóa học cần cập nhật |

### Request Body
```json
{
  "title": "Lập trình React Native từ Zero đến Hero",
  "price": 399000,
  "description": "Cập nhật tài liệu mới nhất cho React Native 0.76"
}
```

### Business & Ownership Rules
* **Kiểm tra quyền sở hữu**: Backend đối chiếu `course.authorId === req.user.userId`.
* Nếu Giảng viên A cố tình gửi ID khóa học của Giảng viên B -> trả về `403 Forbidden` (`You can only update your own courses`).
* Giảng viên **không thể tự thay đổi `status`** (trạng thái chỉ do Admin duyệt) hoặc tự thay đổi `author`.

### Error Responses
* **403 Forbidden**: Truy cập khóa học không thuộc quyền sở hữu.
* **404 Not Found**: Khóa học không tồn tại hoặc đã bị soft-delete (`isDestroyed = true`).

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/teacher/courses/2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "price": 399000
}
```

---

## 3. DELETE /api/teacher/courses/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/teacher/courses/:id`
* **Purpose**: Giảng viên xóa khóa học của chính mình.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã khóa học cần xóa |

### Business Rules (Rất quan trọng)
* **Quy tắc bảo vệ tính toàn vẹn dữ liệu**: Giảng viên **CHỈ ĐƯỢC PHÉP XÓA KHÓA HỌC KHI ĐANG Ở TRẠNG THÁI `PENDING`**.
* Nếu khóa học đã được duyệt (`APPROVED`) hoặc đã bị từ chối (`REJECTED`): Giảng viên không thể xóa để bảo vệ lịch sử đơn hàng của học viên và số liệu thống kê. Nếu cố xóa sẽ nhận lỗi `403 Forbidden`.
* Nếu muốn xóa khóa học đã `APPROVED`, Giảng viên phải liên hệ Quản trị viên (`ADMIN`).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Course deleted successfully!"
  }
  ```

### Error Responses
* **403 Forbidden**:
  * Khóa học không ở trạng thái PENDING:
    ```json
    {
      "success": false,
      "message": "Only pending courses can be deleted by teacher"
    }
    ```
* **404 Not Found**: Khóa học không tồn tại hoặc không phải do giảng viên này tạo.

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/teacher/courses/2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/teacher/courses/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/teacher/courses/`
* **Purpose**: Lấy danh sách toàn bộ các khóa học do chính giảng viên hiện tại tạo (bao gồm cả `APPROVED`, `PENDING`, `REJECTED`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang |
| `limit` | number | No | `10` | Số lượng khóa học mỗi trang |
| `search` | string | No | `undefined` | Tìm kiếm theo tiêu đề |
| `status` | string | No | `undefined` | Lọc theo: `approved`, `pending`, `rejected` |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched courses by teacher successfully!",
    "data": {
      "courses": [
        {
          "id": "2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
          "_id": "2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
          "title": "Lập trình React Native từ cơ bản đến nâng cao",
          "slug": "lap-trinh-react-native-tu-co-ban-den-nang-cao",
          "price": 499000,
          "oldPrice": 899000,
          "status": "pending",
          "level": "intermediate",
          "view": 45,
          "sold": 0,
          "createdAt": "2026-03-01T10:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 6,
        "totalPages": 1
      }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/teacher/courses/?page=1&limit=10&status=pending
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```
