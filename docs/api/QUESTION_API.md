# TMDEMY — QUESTION MANAGEMENT API (QUESTION_API.MD)

Tài liệu đặc tả các API quản lý Câu hỏi (`Question`) trong một bài kiểm tra (`Quiz`).

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

Tất cả các endpoint trong tài liệu này **BẮT BUỘC có header `Authorization: Bearer <ACCESS_TOKEN>`** và người dùng phải có vai trò `TEACHER` hoặc `ADMIN`.

---

## 1. POST /api/questions/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/questions/`
* **Purpose**: Tạo một câu hỏi mới trong bài kiểm tra (Trắc nghiệm hoặc Điền vào chỗ trống).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Request Body
```json
{
  "quiz": "quiz-uuid-v4",
  "type": "multiple_choice",
  "title": "Prisma ORM trong TMDEMY kết nối với cơ sở dữ liệu nào?",
  "options": [
    "MySQL 8.0",
    "MongoDB Atlas",
    "PostgreSQL 16",
    "SQLite 3"
  ],
  "answer": "PostgreSQL 16",
  "points": 2
}
```

### Validation Rules
* `quiz`: Bắt buộc, UUID hợp lệ của Quiz.
* `type`: Bắt buộc, một trong: `multiple_choice`, `fill_in_blank`.
* `title`: Bắt buộc, nội dung câu hỏi.
* `options`: Tùy chọn, mảng các chuỗi lựa chọn (`string[]`).
* `answer`: Bắt buộc, đáp án chính xác (dùng để chấm điểm tự động).
* `points`: Tùy chọn, điểm số của câu hỏi (mặc định: `1`).

### Business Rules
* Kiểm tra `quiz` có tồn tại trong hệ thống.
* Giảng viên (`TEACHER`) chỉ được tạo câu hỏi cho Quiz thuộc khóa học do mình sở hữu.
* Các lựa chọn `options` được lưu tự động vào bảng `QuestionOption` trong PostgreSQL.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Question created successfully",
    "data": {
      "id": "question-uuid-1",
      "_id": "question-uuid-1",
      "quiz": "quiz-uuid-v4",
      "type": "multiple_choice",
      "title": "Prisma ORM trong TMDEMY kết nối với cơ sở dữ liệu nào?",
      "options": [
        "MySQL 8.0",
        "MongoDB Atlas",
        "PostgreSQL 16",
        "SQLite 3"
      ],
      "answer": "PostgreSQL 16",
      "points": 2,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/questions/
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "quiz": "quiz-uuid-v4",
  "type": "multiple_choice",
  "title": "Prisma ORM trong TMDEMY kết nối với cơ sở dữ liệu nào?",
  "options": [
    "MySQL 8.0",
    "MongoDB Atlas",
    "PostgreSQL 16",
    "SQLite 3"
  ],
  "answer": "PostgreSQL 16",
  "points": 2
}
```

---

## 2. PUT /api/questions/:questionId

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/questions/:questionId`
* **Purpose**: Cập nhật nội dung câu hỏi, danh sách lựa chọn, đáp án đúng hoặc điểm số.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `questionId` | UUID | Yes | Mã câu hỏi cần sửa |

### Request Body
```json
{
  "title": "Prisma ORM trong TMDEMY kết nối với cơ sở dữ liệu mục tiêu nào?",
  "points": 3
}
```

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**: Trả về câu hỏi sau khi cập nhật.

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/questions/question-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "points": 3
}
```

---

## 3. DELETE /api/questions/:questionId

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/questions/:questionId`
* **Purpose**: Xóa câu hỏi khỏi bài kiểm tra.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `questionId` | UUID | Yes | Mã câu hỏi cần xóa |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Question deleted successfully"
  }
  ```

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/questions/question-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```
