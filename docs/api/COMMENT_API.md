# TMDEMY — COMMENT & COMMENT REACTION API (COMMENT_API.MD)

Tài liệu đặc tả các API Bình luận (`Comment`), Trả lời bình luận (Threaded replies) và Tương tác cảm xúc (`Like`/`Dislike`) trong bài học.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/comments/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/comments/`
* **Purpose**: Đăng bình luận gốc hoặc trả lời bình luận (Reply) trong bài học.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Request Body
```json
{
  "content": "Em chưa hiểu đoạn triển khai transaction client trong repository, giảng viên giải thích giúp em với ạ!",
  "lesson": "lesson-uuid-v4",
  "course": "course-uuid-v4",
  "parentId": "parent-comment-uuid"
}
```

### Validation Rules
* `content`: Bắt buộc, chuỗi từ 6 đến 500 ký tự.
* `lesson`: Bắt buộc, UUID hợp lệ.
* `course`: Bắt buộc, UUID hợp lệ.
* `parentId`: Tùy chọn, UUID hợp lệ nếu là câu trả lời cho bình luận khác.

### Business Rules
* Hỗ trợ cấu trúc lồng nhau phân cấp (Nested/Threaded comments):
  * Nếu không có `parentId`: đây là bình luận gốc (`level = 1`).
  * Nếu có `parentId`: bình luận con kế thừa `level` của bình luận cha + 1 (giới hạn tối đa 2 cấp lồng nhau).
* Nếu là câu trả lời (`parentId` tồn tại): hệ thống tự động bắn Notification đến tác giả của bình luận cha (`COMMENT_REPLY`).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Comment created successfully",
    "data": {
      "id": "comment-uuid-1",
      "_id": "comment-uuid-1",
      "content": "Nội dung bình luận...",
      "lesson": { "id": "lesson-uuid", "title": "Tên bài học" },
      "course": { "id": "course-uuid", "title": "Tên khóa học", "slug": "slug" },
      "user": { "id": "user-uuid", "username": "minh_student", "avatar": "" },
      "status": "APPROVED",
      "parentId": null,
      "level": 1,
      "likes": [],
      "dislikes": [],
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/comments/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "content": "Bài học rất chi tiết và dễ hiểu!",
  "lesson": "lesson-uuid-v4",
  "course": "course-uuid-v4"
}
```

---

## 2. GET /api/comments/lesson/:lessonId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/comments/lesson/:lessonId`
* **Purpose**: Lấy danh sách bình luận của bài học theo cây phân cấp (kèm mảng userId đã `like`/`dislike`).
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `lessonId` | UUID | Yes | Mã bài học cần lấy bình luận |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**: Trả về mảng danh sách bình luận đã serialize, mỗi comment có mảng `likes: string[]` và `dislikes: string[]`.

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/comments/lesson/lesson-uuid-here
```

---

## 3. PUT /api/comments/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/comments/:id`
* **Purpose**: Tác giả cập nhật nội dung bình luận của chính mình.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Tác giả bình luận)
* **Ownership Rule**: Người gọi phải là tác giả của bình luận (`comment.userId === req.user.userId`). Nếu không -> trả `403 Forbidden`.

---

## 4. DELETE /api/comments/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/comments/:id`
* **Purpose**: Học viên tự xóa bình luận của chính mình.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Tác giả bình luận)

---

## 5. POST /api/comments/like/:commentId

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/comments/like/:commentId`
* **Purpose**: Bày tỏ cảm xúc Thích (`LIKE`) đối với bình luận.
* **Authentication**: `Bearer JWT required`
* **Roles**: All
* **Business Rule**:
  * Nếu chưa reaction: tạo reaction `LIKE`.
  * Nếu đã `LIKE` trước đó: hủy `LIKE` (toggle off).
  * Nếu đang `DISLIKE`: chuyển thành `LIKE`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Reaction updated successfully",
    "data": {
      "commentId": "comment-uuid-1",
      "action": "liked"
    }
  }
  ```

---

## 6. POST /api/comments/dislike/:commentId

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/comments/dislike/:commentId`
* **Purpose**: Bày tỏ cảm xúc Không thích (`DISLIKE`) đối với bình luận.
* **Authentication**: `Bearer JWT required`
* **Roles**: All

---

## 7. GET /api/comments/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/comments/`
* **Purpose**: Quản lý danh sách bình luận trong hệ thống (dành cho Admin và Giảng viên).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`
* **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `page` | number | No | `1` | Số trang (>= 1) |
  | `limit` | number | No | `10` | Số lượng bình luận mỗi trang |
  | `status` | string | No | `undefined` | Lọc theo trạng thái: `"pending"`, `"approved"`, `"hidden"`, `"flagged"` |
  | `search` | string | No | `undefined` | Tìm kiếm theo nội dung bình luận |
* **Business Rule**: Admin xem toàn bộ bình luận. Giảng viên chỉ xem bình luận trong các khóa học do mình sở hữu.

---

## 8. DELETE /api/comments/admin/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/comments/admin/:id`
* **Purpose**: Quản trị viên (`ADMIN`) xóa vĩnh viễn bất kỳ bình luận vi phạm nào (và toàn bộ câu trả lời con).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`

---

## 9. DELETE /api/comments/teacher/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/comments/teacher/:id`
* **Purpose**: Giảng viên (`TEACHER`) xóa bình luận trong khóa học do mình sở hữu.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`
* **Ownership Rule**: Giảng viên phải là tác giả của khóa học chứa bình luận này. Nếu không -> trả `403 Forbidden`.

---

## 10. PATCH /api/comments/admin/:id/status (BE-F9.11-003)

### Method & Endpoint
* **Method**: `PATCH`
* **Endpoint**: `/api/comments/admin/:id/status`
* **Purpose**: Kiểm duyệt bình luận — Cho phép Admin thay đổi trạng thái bình luận sang `HIDDEN` (ẩn khỏi phòng học mà không xóa mất lịch sử) hoặc `FLAGGED`, `APPROVED`, `PENDING` kèm lý do kiểm duyệt `moderationNote`.
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`
* **Request Body**:
  ```json
  {
    "status": "HIDDEN",
    "moderationNote": "Chứa từ ngữ xúc phạm người học khác"
  }
  ```
* **Validation Rules**:
  * `status`: Bắt buộc, một trong các giá trị: `PENDING`, `APPROVED`, `HIDDEN`, `FLAGGED` (case-insensitive).
  * `moderationNote`: Tùy chọn, chuỗi văn bản ghi chú lý do kiểm duyệt.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Trạng thái bình luận đã được cập nhật thành công",
    "data": {
      "id": "cm_890",
      "_id": "cm_890",
      "content": "Nội dung bình luận...",
      "status": "HIDDEN",
      "moderationNote": "Chứa từ ngữ xúc phạm người học khác",
      "updatedAt": "2026-10-20T19:35:00.000Z"
    }
  }
  ```
* **Classroom Impact**: Khi bình luận chuyển sang `HIDDEN`, endpoint học tập `GET /api/comments/lesson/:lessonId` sẽ tự động loại bỏ bình luận này khỏi giao diện học viên. Khi Admin khôi phục lại `APPROVED`, bình luận hiển thị trở lại.
