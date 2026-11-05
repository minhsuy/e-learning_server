# TMDEMY — CHAPTER MANAGEMENT API (CHAPTER_API.MD)

Tài liệu đặc tả các API quản lý Chương học (`Chapter`) trong một khóa học.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

Tất cả các endpoint trong tài liệu này **BẮT BUỘC có header `Authorization: Bearer <ACCESS_TOKEN>`** và người dùng phải có vai trò `TEACHER` hoặc `ADMIN`.

---

## 1. POST /api/chapters/:courseId

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/chapters/:courseId`
* **Purpose**: Thêm một chương học mới vào khóa học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `courseId` | UUID | Yes | Mã khóa học cần thêm chương |

### Request Body
```json
{
  "title": "Chương 2: Kiến trúc Clean Architecture trong Node.js",
  "order": 2
}
```

### Validation Rules
* `courseId`: Bắt buộc, UUID hợp lệ.
* `title`: Bắt buộc, tối thiểu 3 ký tự.
* `order`: Tùy chọn, số nguyên >= 0. Nếu không gửi, hệ thống tự động tính `max(order) + 1`.

### Business & Ownership Rules
* Nếu người gọi là `TEACHER`: backend kiểm tra `course.authorId === req.user.userId`. Nếu không sở hữu khóa học -> trả về `403 Forbidden` (`You are not the owner of this course`).
* Khóa học phải tồn tại (`findCourseById`). Nếu không tồn tại trả về `404 Not Found`.

### Success Response
* **HTTP Status**: `201 Created`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Chapter created successfully!",
    "data": {
      "id": "chap-uuid-2",
      "_id": "chap-uuid-2",
      "title": "Chương 2: Kiến trúc Clean Architecture trong Node.js",
      "order": 2,
      "course": "course-uuid",
      "_destroy": false,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/chapters/course-uuid-here
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Chương 2: Kiến trúc Clean Architecture trong Node.js"
}
```

---

## 2. PUT /api/chapters/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/chapters/:id`
* **Purpose**: Cập nhật tiêu đề, số thứ tự hiển thị (`order`) hoặc cờ xóa mềm (`_destroy`) của chương học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | ID của chương học cần sửa |

### Request Body
```json
{
  "title": "Chương 2: Kiến trúc Clean Architecture & Domain-Driven Design",
  "order": 2,
  "_destroy": false
}
```

### Business Rules
* Kiểm tra quyền sở hữu khóa học chứa chương học đối với Giảng viên.
* Nếu `_destroy: true` được gửi, chương học sẽ được chuyển trạng thái xóa mềm.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Chapter updated successfully!",
    "data": {
      "id": "chap-uuid-2",
      "_id": "chap-uuid-2",
      "title": "Chương 2: Kiến trúc Clean Architecture & Domain-Driven Design",
      "order": 2,
      "course": "course-uuid",
      "_destroy": false
    }
  }
  ```

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/chapters/chap-uuid-2
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Chương 2: Kiến trúc Clean Architecture & Domain-Driven Design"
}
```

---

## 3. DELETE /api/chapters/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/chapters/:id`
* **Purpose**: Soft-delete chương học (`isDestroyed = true`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | ID của chương học cần xóa |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Chapter deleted successfully!"
  }
  ```

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/chapters/chap-uuid-2
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/chapters/course/:id

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/chapters/course/:id`
* **Purpose**: Lấy danh sách các chương học thuộc một khóa học (kèm danh sách bài học con) để phục vụ giao diện quản lý khóa học của Giảng viên / Admin.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | ID của khóa học |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched chapters by course successfully!",
    "data": [
      {
        "id": "chap-uuid-1",
        "_id": "chap-uuid-1",
        "title": "Chương 1: Giới thiệu tổng quan",
        "order": 1,
        "course": "course-uuid",
        "_destroy": false,
        "lessons": [
          {
            "id": "lesson-uuid-1",
            "_id": "lesson-uuid-1",
            "title": "Bài 1: Cài đặt công cụ",
            "duration": 450,
            "type": "video",
            "isDemo": true,
            "order": 1
          }
        ]
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/chapters/course/course-uuid-here
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```
