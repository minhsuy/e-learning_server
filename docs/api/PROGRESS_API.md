# TMDEMY — PROGRESS TRACKING API (PROGRESS_API.MD)

Tài liệu đặc tả các API theo dõi Tiến độ học tập (`Progress`) của học viên trong khóa học.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/progress/complete

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/progress/complete`
* **Purpose**: Đánh dấu học viên đã hoàn thành một bài học cụ thể. Hệ thống tự động tính toán lại % tiến độ của toàn khóa học.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Request Body
```json
{
  "courseId": "course-uuid-v4",
  "lessonId": "lesson-uuid-v4"
}
```

### Business Rules (Auto Percentage & Completion)
1. **Kiểm tra bài học**: Bài học `lessonId` phải tồn tại và phải thuộc về khóa học `courseId`.
2. **Kiểm tra ghi danh**: Học viên bắt buộc phải có bản ghi ghi danh `Enrollment` trong khóa học.
3. **Cập nhật Progress**: Tạo hoặc cập nhật bản ghi `Progress` với `completed = true`.
4. **Tự động tính % tiến độ**:
   $$\text{percent} = \text{round}\left(\frac{\text{Tổng bài học đã hoàn thành}}{\text{Tổng số bài học của khóa học}} \times 100\right)$$
5. **Tự động hoàn thành khóa học**:
   * Nếu `percent === 100`: Tự động cập nhật `Enrollment.status = COMPLETED` và gán thời điểm hoàn thành `completedAt = now`.
   * Nếu `percent < 100`: Giữ nguyên trạng thái `Enrollment.status = ACTIVE`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lesson marked as completed",
    "data": {
      "progress": 67
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/progress/complete
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "courseId": "course-uuid-v4",
  "lessonId": "lesson-uuid-v4"
}
```

---

## 2. POST /api/progress/uncomplete

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/progress/uncomplete`
* **Purpose**: Hủy đánh dấu hoàn thành bài học (chuyển `completed = false`).
* **Authentication**: `Bearer JWT required`
* **Roles**: All

### Request Body
```json
{
  "courseId": "course-uuid-v4",
  "lessonId": "lesson-uuid-v4"
}
```

### Business Rules
* Đặt lại bản ghi `Progress` thành `completed = false`.
* Tính toán lại % tiến độ. Nếu trước đó khóa học đã `COMPLETED` mà bây giờ < 100%, trạng thái ghi danh tự động chuyển lại thành `ACTIVE` và đặt `completedAt = null`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lesson unmarked as completed",
    "data": {
      "progress": 50
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/progress/uncomplete
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "courseId": "course-uuid-v4",
  "lessonId": "lesson-uuid-v4"
}
```

---

## 3. GET /api/progress/:courseId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/progress/:courseId`
* **Purpose**: Lấy chi tiết tiến độ học tập của người dùng trong một khóa học, bao gồm danh sách tất cả các bài học và cờ trạng thái `completed: true/false` của từng bài.
* **Authentication**: `Bearer JWT required`
* **Roles**: All

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `courseId` | UUID | Yes | Mã khóa học cần xem tiến độ |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched course progress successfully",
    "data": {
      "totalLessons": 12,
      "completedLessons": 8,
      "percent": 67,
      "lessons": [
        {
          "id": "lesson-uuid-1",
          "_id": "lesson-uuid-1",
          "title": "Bài 1.1: Giới thiệu hệ thống",
          "order": 1,
          "completed": true
        },
        {
          "id": "lesson-uuid-2",
          "_id": "lesson-uuid-2",
          "title": "Bài 1.2: Cài đặt công cụ",
          "order": 2,
          "completed": true
        },
        {
          "id": "lesson-uuid-3",
          "_id": "lesson-uuid-3",
          "title": "Bài 2.1: Phân tích kiến trúc",
          "order": 3,
          "completed": false
        }
      ]
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/progress/course-uuid-v4
Authorization: Bearer <ACCESS_TOKEN>
```
