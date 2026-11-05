# TMDEMY — CONVERSATION API SPECIFICATION (CONVERSATION_API.MD)

Tài liệu đặc tả các API khởi tạo và quản lý Cuộc trò chuyện (`Conversation`) trong hệ thống Chat (Chat riêng 1-1 và Chat nhóm khóa học).

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/conversations/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/conversations/`
* **Purpose**: Khởi tạo cuộc trò chuyện mới hoặc lấy cuộc trò chuyện đã tồn tại giữa 2 người (Private Chat) hoặc nhóm học tập của khóa học (Group Chat).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Request Body (Chat 1-1 Riêng tư)
```json
{
  "receiverId": "teacher-uuid-v4",
  "isGroup": false
}
```

### Request Body (Chat Nhóm Khóa học)
```json
{
  "isGroup": true,
  "courseId": "course-uuid-v4",
  "name": "Nhóm thảo luận: Fullstack Next.js 15"
}
```

### Business Rules
* **Idempotency (Không tạo trùng)**:
  * Với Chat 1-1: Nếu đã có cuộc trò chuyện giữa `senderId` và `receiverId`, hệ thống trả về cuộc trò chuyện hiện có thay vì tạo bản ghi mới.
  * Với Chat nhóm: Mỗi khóa học chỉ có duy nhất 1 nhóm trò chuyện (`findCourseGroupConversation`).
* **Format Response**: Tự động tính toán `displayName` và `avatar` tương ứng với đối phương (đối với chat 1-1) để frontend hiển thị ngay mà không cần xử lý thêm.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Conversation retrieved successfully",
    "data": {
      "id": "conv-uuid-1",
      "_id": "conv-uuid-1",
      "isGroup": false,
      "displayName": "hoang_teacher",
      "avatar": "https://res.cloudinary.com/tmdemy/avatar.png",
      "lastMessage": null,
      "participants": [
        {
          "id": "user-uuid-1",
          "_id": "user-uuid-1",
          "username": "minh_student",
          "avatar": null
        },
        {
          "id": "teacher-uuid-v4",
          "_id": "teacher-uuid-v4",
          "username": "hoang_teacher",
          "avatar": "https://res.cloudinary.com/tmdemy/avatar.png"
        }
      ],
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/conversations/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "receiverId": "teacher-uuid-v4",
  "isGroup": false
}
```

---

## 2. GET /api/conversations/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/conversations/`
* **Purpose**: Lấy danh sách toàn bộ các cuộc trò chuyện mà người dùng hiện tại đang tham gia (được sắp xếp theo tin nhắn mới nhất).
* **Authentication**: `Bearer JWT required`
* **Roles**: All

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched user conversations successfully",
    "data": [
      {
        "id": "conv-uuid-1",
        "_id": "conv-uuid-1",
        "isGroup": false,
        "displayName": "hoang_teacher",
        "avatar": "https://res.cloudinary.com/tmdemy/avatar.png",
        "lastMessage": {
          "id": "msg-uuid-1",
          "content": "Chào em, em có thắc mắc gì về bài học?",
          "type": "text",
          "createdAt": "2026-03-01T10:15:00.000Z"
        },
        "updatedAt": "2026-03-01T10:15:00.000Z"
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/conversations/
Authorization: Bearer <ACCESS_TOKEN>
```
