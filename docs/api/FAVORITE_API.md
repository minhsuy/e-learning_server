# TMDEMY — FAVORITE COURSE API (FAVORITE_API.MD)

Tài liệu đặc tả các API quản lý Danh sách Khóa học Yêu thích (`FavoriteCourse`) của học viên.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/favorites/:id

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/favorites/:id`
* **Purpose**: Thêm một khóa học vào danh sách yêu thích của người dùng.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã khóa học (`courseId`) |

### Business Rules
* Khóa học phải tồn tại trong database.
* Mỗi học viên chỉ có thể thêm một khóa học vào yêu thích 1 lần (ràng buộc `@@unique([userId, courseId])`). Nếu thêm lại sẽ nhận lỗi `400 Bad Request`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Course added to favorites",
    "data": {
      "id": "fav-uuid-1",
      "_id": "fav-uuid-1",
      "userId": "user-uuid",
      "courseId": "course-uuid",
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/favorites/course-uuid-here
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 2. DELETE /api/favorites/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/favorites/:id`
* **Purpose**: Xóa khóa học khỏi danh sách yêu thích.
* **Authentication**: `Bearer JWT required`
* **Roles**: All

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
    "message": "Course removed from favorites"
  }
  ```

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/favorites/course-uuid-here
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 3. GET /api/favorites/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/favorites/`
* **Purpose**: Lấy danh sách toàn bộ các khóa học yêu thích của người dùng hiện tại (có phân trang).
* **Authentication**: `Bearer JWT required`
* **Roles**: All

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang |
| `limit` | number | No | `10` | Số lượng bản ghi mỗi trang |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched favorites successfully",
    "data": {
      "favorites": [
        {
          "id": "fav-uuid-1",
          "_id": "fav-uuid-1",
          "userId": "user-uuid",
          "courseId": "course-uuid",
          "course": {
            "id": "course-uuid",
            "_id": "course-uuid",
            "title": "Fullstack Next.js 15 & Node.js",
            "price": 699000,
            "image": "https://res.cloudinary.com/tmdemy/image.jpg"
          },
          "createdAt": "2026-03-01T10:00:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/favorites/?page=1&limit=10
Authorization: Bearer <ACCESS_TOKEN>
```
