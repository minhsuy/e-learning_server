# TMDEMY — QUIZ MANAGEMENT API (QUIZ_API.MD)

Tài liệu đặc tả các API quản lý Bài kiểm tra (`Quiz`) liên kết với bài học.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

> [!NOTE]
> Lưu ý: Route của Quiz trong backend TMDEMY sử dụng định dạng **số ít**: `/api/quiz` (khác với `/api/submissions`).

---

## 1. POST /api/quiz/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/quiz/`
* **Purpose**: Tạo một bài kiểm tra trắc nghiệm (Quiz) mới cho một bài học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Request Body
```json
{
  "title": "Kiểm tra kiến thức Chương 2: Functional Repositories",
  "description": "Bài quiz gồm 5 câu hỏi đánh giá mức độ hiểu bài của học viên",
  "lesson": "lesson-uuid-v4",
  "courseId": "course-uuid-v4",
  "duration": 15,
  "passing_grade": 80
}
```

### Validation Rules
* `title`: Bắt buộc, chuỗi văn bản.
* `lesson`: Bắt buộc, UUID hợp lệ.
* `courseId`: Bắt buộc, UUID hợp lệ.
* `duration`: Tùy chọn, số phút làm bài.
* `passing_grade`: Tùy chọn, điểm phần trăm tối thiểu để vượt qua (ví dụ: `80` tức 80%).

### Business & Integrity Rules
* **1-to-1 Constraint**: Mỗi bài học (`Lesson`) **chỉ được phép có duy nhất 1 bài kiểm tra (`Quiz`)**. Nếu bài học đã có Quiz trước đó, backend trả về `400 Bad Request` ("Lesson already has a quiz").
* **Cross-Entity Integrity**: `courseId` phải khớp với khóa học chứa bài học `lesson`.
* **Ownership Check**: Giảng viên phải là tác giả của khóa học.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Quiz created successfully",
    "data": {
      "id": "quiz-uuid-1",
      "_id": "quiz-uuid-1",
      "title": "Kiểm tra kiến thức Chương 2: Functional Repositories",
      "description": "Bài quiz gồm 5 câu hỏi",
      "duration": 15,
      "passing_grade": 80,
      "lesson": "lesson-uuid-v4",
      "courseId": "course-uuid-v4",
      "created_by": "teacher-uuid-v4",
      "questions": [],
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/quiz/
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Kiểm tra kiến thức Chương 2: Functional Repositories",
  "lesson": "lesson-uuid-v4",
  "courseId": "course-uuid-v4",
  "duration": 15,
  "passing_grade": 80
}
```

---

## 2. PUT /api/quiz/:quizId

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/quiz/:quizId`
* **Purpose**: Cập nhật thông tin tiêu đề, thời lượng làm bài, điểm qua môn của Quiz.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `quizId` | UUID | Yes | Mã bài kiểm tra cần sửa |

### Request Body
```json
{
  "title": "Kiểm tra kiến thức Chương 2 (Cập nhật thời lượng)",
  "duration": 20,
  "passing_grade": 75
}
```

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**: Trả về thông tin Quiz đã cập nhật.

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/quiz/quiz-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "duration": 20
}
```

---

## 3. DELETE /api/quiz/:quizId

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/quiz/:quizId`
* **Purpose**: Xóa bài kiểm tra và toàn bộ câu hỏi con liên quan.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `quizId` | UUID | Yes | Mã bài kiểm tra cần xóa |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Quiz and its questions deleted successfully"
  }
  ```

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/quiz/quiz-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/quiz/lesson/:lessonId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/quiz/lesson/:lessonId`
* **Purpose**: Lấy thông tin bài kiểm tra và danh sách câu hỏi phục vụ học viên làm bài kiểm tra.
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `lessonId` | UUID | Yes | Mã bài học cần lấy Quiz |

### Anti-Cheat Security Rule (Bắt buộc)
* **Bảo mật tuyệt đối đáp án**: Endpoint này trả về danh sách các lựa chọn (`options`), nhưng **HOÀN TOÀN KHÔNG CÓ TRƯỜNG `answer`**.
* Học viên và Client không thể xem trước đáp án đúng bằng cách mở DevTools hay chặn request.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Quizzes fetched successfully",
    "data": [
      {
        "id": "quiz-uuid-1",
        "_id": "quiz-uuid-1",
        "title": "Kiểm tra kiến thức Chương 2",
        "description": "5 câu hỏi trắc nghiệm",
        "duration": 15,
        "passing_grade": 80,
        "lesson": "lesson-uuid-1",
        "courseId": "course-uuid-1",
        "questions": [
          {
            "id": "question-uuid-1",
            "_id": "question-uuid-1",
            "quiz": "quiz-uuid-1",
            "type": "multiple_choice",
            "title": "Hàm Repository trong kiến trúc TMDEMY có đặc điểm gì?",
            "options": [
              "Sử dụng Class kế thừa BaseRepository",
              "Sử dụng Pure Async Functions không có class hay this",
              "Gọi trực tiếp Express Request/Response",
              "Truy vấn MongoDB Mongoose Model"
            ],
            "points": 2
          }
        ]
      }
    ]
  }
  ```

### Error Responses
* **404 Not Found**: Bài học không có bài kiểm tra (`No quizzes found for this lesson`).

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/quiz/lesson/lesson-uuid-1
```
