# TMDEMY — NOTIFICATION API SPECIFICATION (NOTIFICATION_API.MD)

Tài liệu đặc tả các API Thông báo (`Notification`) của người dùng.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. GET /api/notifications/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/notifications/`
* **Purpose**: Lấy danh sách thông báo của người dùng hiện tại (có phân trang, sắp xếp theo mới nhất, có thể lọc theo loại sự kiện `type`).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang (tối thiểu 1) |
| `limit` | number | No | `10` | Số lượng bản ghi mỗi trang (tối đa 100) |
| `type` | string | No | `undefined` | Lọc theo loại thông báo: `COMMENT`, `RATING`, `ORDER`, `MESSAGE`, `SYSTEM`, `COURSE`, `LESSON`, `COMMENT_REPLY`, `QUIZ` |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched notifications successfully",
    "data": {
      "notifications": [
        {
          "id": "notif-uuid-1",
          "_id": "notif-uuid-1",
          "senderId": "user-uuid-1",
          "receiverId": "teacher-uuid-1",
          "sender": {
            "id": "user-uuid-1",
            "_id": "user-uuid-1",
            "username": "minh_student",
            "avatar": ""
          },
          "type": "ORDER",
          "message": "Học viên minh_student vừa đăng ký khóa học của bạn!",
          "relatedId": "order-uuid-1",
          "metadata": null,
          "isRead": false,
          "read": false,
          "createdAt": "2026-03-01T10:00:00.000Z",
          "updatedAt": "2026-03-01T10:00:00.000Z"
        },
        {
          "id": "notif-uuid-2",
          "_id": "notif-uuid-2",
          "senderId": "teacher-uuid-1",
          "receiverId": "student-uuid-1",
          "sender": {
            "id": "teacher-uuid-1",
            "_id": "teacher-uuid-1",
            "username": "teacher_alex",
            "avatar": ""
          },
          "type": "LESSON",
          "message": "Có bài học mới \"Bài 1: Giới thiệu\" trong khóa học \"React Native Master\"",
          "relatedId": "lesson-uuid-1",
          "metadata": {
            "courseId": "course-uuid-1",
            "courseSlug": "react-native-master",
            "lessonId": "lesson-uuid-1"
          },
          "isRead": false,
          "read": false,
          "createdAt": "2026-03-01T10:05:00.000Z",
          "updatedAt": "2026-03-01T10:05:00.000Z"
        },
        {
          "id": "notif-uuid-3",
          "_id": "notif-uuid-3",
          "senderId": "user-uuid-2",
          "receiverId": "user-uuid-1",
          "sender": {
            "id": "user-uuid-2",
            "_id": "user-uuid-2",
            "username": "coder_bob",
            "avatar": ""
          },
          "type": "COMMENT_REPLY",
          "message": "coder_bob vừa trả lời bình luận của bạn: \"Mình cũng bị lỗi này\"",
          "relatedId": "lesson-uuid-1",
          "metadata": {
            "courseId": "course-uuid-1",
            "courseSlug": "react-native-master",
            "lessonId": "lesson-uuid-1",
            "commentId": "reply-comment-uuid-1",
            "parentId": "parent-comment-uuid-1"
          },
          "isRead": false,
          "read": false,
          "createdAt": "2026-03-01T10:10:00.000Z",
          "updatedAt": "2026-03-01T10:10:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 5,
        "totalPages": 1
      }
    }
  }
  ```

### Contextual Navigation Metadata Specification
Trường `metadata` (JSON nullable) bổ sung thông tin định vị ngữ cảnh phục vụ Frontend:
* **`LESSON`**:
  * `courseId`: UUID của khóa học chứa bài học.
  * `courseSlug`: Đường dẫn thân thiện (slug) của khóa học.
  * `lessonId`: UUID của bài học mới.
* **`COMMENT`**:
  * `courseId`: UUID của khóa học.
  * `courseSlug`: Slug của khóa học.
  * `lessonId`: UUID của bài học.
  * `commentId`: UUID của bình luận mới vừa tạo.
* **`COMMENT_REPLY`**:
  * `courseId`: UUID của khóa học.
  * `courseSlug`: Slug của khóa học.
  * `lessonId`: UUID của bài học.
  * `commentId`: UUID của phản hồi mới vừa tạo.
  * `parentId`: UUID của bình luận cha được phản hồi.
* **Các loại khác / Dữ liệu lịch sử cũ**: Trả về `null`.

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/notifications/?page=1&limit=10
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 2. PATCH /api/notifications/read/:id

### Method & Endpoint
* **Method**: `PATCH`
* **Endpoint**: `/api/notifications/read/:id`
* **Purpose**: Đánh dấu một thông báo cụ thể là đã đọc (`isRead = true`).
* **Authentication**: `Bearer JWT required`
* **Roles**: All

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã thông báo cần đánh dấu đã đọc |

### Business & Ownership Rules
* Người dùng chỉ có quyền đánh dấu thông báo gửi cho chính mình (`notification.receiverId === req.user.userId`).
* Nếu người dùng khác cố tình cập nhật thông báo không phải của mình -> trả về `403 Forbidden` (`You are not authorized to mark this notification as read`).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Notification marked as read successfully",
    "data": {
      "id": "notif-uuid-1",
      "_id": "notif-uuid-1",
      "isRead": true,
      "read": true
    }
  }
  ```

### Raw HTTP Request
```http
PATCH {{BASE_URL}}/api/notifications/read/notif-uuid-1
Authorization: Bearer <ACCESS_TOKEN>
```
