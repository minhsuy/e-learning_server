# TMDEMY — RATING & REVIEW API SPECIFICATION (RATING_API.MD)

Tài liệu đặc tả các API Đánh giá sao và Nhận xét khóa học (`Rating`).

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/ratings/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/ratings/`
* **Purpose**: Học viên đánh giá sao (1 đến 5 sao) và để lại nhận xét cho khóa học mà mình đã học.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Bắt buộc phải là học viên đã ghi danh vào khóa học)

### Request Body
```json
{
  "courseId": "course-uuid-v4",
  "rate": 5,
  "content": "Khóa học rất hay và bám sát thực tế, giảng viên hỗ trợ nhiệt tình!"
}
```

### Validation Rules
* `courseId`: Bắt buộc, UUID hợp lệ.
* `rate`: Bắt buộc, số nguyên từ 1 đến 5.
* `content`: Bắt buộc, tối thiểu 5 ký tự và tối đa 500 ký tự.

### Business & Authorization Rules
1. **Bắt buộc Ghi danh**: Học viên phải có bản ghi `Enrollment` trong khóa học. Nếu chưa mua/ghi danh -> trả `403 Forbidden` ("You are not enrolled in this course").
2. **Một đánh giá duy nhất**: Mỗi học viên chỉ được đánh giá 1 lần duy nhất cho mỗi khóa học (ràng buộc `@@unique([userId, courseId])`). Nếu đánh giá lại -> trả `400 Bad Request` ("You have already rated this course").
3. **Trạng thái ban đầu**: Đánh giá được tạo với trạng thái `ACTIVE`.
4. **Thông báo**: Hệ thống tự động gửi Notification đến Giảng viên của khóa học.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Rating created successfully",
    "data": {
      "id": "rating-uuid-1",
      "_id": "rating-uuid-1",
      "courseId": "course-uuid-v4",
      "userId": "user-uuid-v4",
      "rate": 5,
      "content": "Khóa học rất hay và bám sát thực tế!",
      "status": "ACTIVE",
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/ratings/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "courseId": "course-uuid-v4",
  "rate": 5,
  "content": "Khóa học rất chất lượng!"
}
```

---

## 2. GET /api/ratings/course/:id

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/ratings/course/:id`
* **Purpose**: Lấy toàn bộ các đánh giá công khai (`status = ACTIVE`) của một khóa học.
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã khóa học (`courseId`) |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched course ratings successfully",
    "data": [
      {
        "id": "rating-uuid-1",
        "_id": "rating-uuid-1",
        "rate": 5,
        "content": "Khóa học rất hay!",
        "user": {
          "id": "user-uuid",
          "_id": "user-uuid",
          "username": "minh_student",
          "avatar": "https://res.cloudinary.com/tmdemy/avatar.png"
        },
        "createdAt": "2026-03-01T10:00:00.000Z"
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/ratings/course/course-uuid-here
```

---

## 3. GET /api/ratings/manage/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/ratings/manage/`
* **Purpose**: Lấy danh sách đánh giá để kiểm duyệt (dành cho Admin và Giảng viên).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`
* **Business Rule**: Admin xem được đánh giá của tất cả khóa học. Giảng viên chỉ xem được đánh giá của các khóa học do chính mình tạo.

---

## 4. PUT /api/ratings/manage/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/ratings/manage/:id`
* **Purpose**: Cập nhật trạng thái hiển thị của đánh giá (`ACTIVE` hoặc `INACTIVE`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`
* **Request Body**:
  ```json
  {
    "status": "inactive"
  }
  ```

---

## 5. DELETE /api/ratings/manage/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/ratings/manage/:id`
* **Purpose**: Xóa vĩnh viễn một đánh giá vi phạm.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`
