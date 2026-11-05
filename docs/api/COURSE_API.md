# TMDEMY — PUBLIC COURSE CATALOG API (COURSE_API.MD)

Tài liệu đặc tả các API công khai phục vụ hiển thị danh sách khóa học và trang chi tiết khóa học cho khách truy cập và học viên.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. GET /api/courses/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/courses/`
* **Purpose**: Lấy danh sách khóa học công khai đã được Admin phê duyệt (`status = APPROVED`) và chưa bị xóa mềm (`isDestroyed = false`).
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang (tối thiểu 1) |
| `limit` | number | No | `10` | Số lượng bản ghi mỗi trang |
| `search` | string | No | `undefined` | Tìm kiếm theo tiêu đề khóa học |
| `category` | UUID | No | `undefined` | Lọc theo ID danh mục |
| `level` | string | No | `undefined` | Lọc theo trình độ: `beginner`, `intermediate`, `advanced` |
| `type` | string | No | `undefined` | Lọc theo loại: `paid`, `free` |
| `priceMin` | number | No | `undefined` | Lọc giá tối thiểu (VND) |
| `priceMax` | number | No | `undefined` | Lọc giá tối đa (VND) |
| `sortBy` | string | No | `"createdAt"`| Sắp xếp theo: `createdAt`, `price`, `view`, `sold` |

### Business Rules
* Khóa học ở trạng thái `PENDING` hoặc `REJECTED` **tuyệt đối không xuất hiện** trên endpoint này.
* Các trường tiền tệ `price`, `oldPrice` (Prisma Decimal) được chuyển đổi thành `number`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched courses successfully!",
    "data": {
      "courses": [
        {
          "id": "5f6e7d8c-9b0a-1e2f-3a4b-5c6d7e8f9a0b",
          "_id": "5f6e7d8c-9b0a-1e2f-3a4b-5c6d7e8f9a0b",
          "title": "Fullstack Next.js 15 & Node.js Architecture",
          "slug": "fullstack-nextjs-15-nodejs-architecture",
          "image": "https://res.cloudinary.com/tmdemy/image/upload/v1/thumbnail.jpg",
          "intro_url": "https://youtube.com/watch?v=demo",
          "description": "Xây dựng ứng dụng hoàn chỉnh từ A đến Z",
          "type": "paid",
          "status": "approved",
          "level": "intermediate",
          "price": 699000,
          "old_price": 1200000,
          "oldPrice": 1200000,
          "view": 1250,
          "sold": 84,
          "category": {
            "id": "cat-uuid",
            "_id": "cat-uuid",
            "name": "Lập trình Web",
            "slug": "lap-trinh-web"
          },
          "author": {
            "id": "teacher-uuid",
            "_id": "teacher-uuid",
            "username": "hoang_teacher",
            "avatar": "https://res.cloudinary.com/tmdemy/avatar.png"
          },
          "createdAt": "2026-02-01T10:00:00.000Z",
          "updatedAt": "2026-02-15T10:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 18,
        "totalPages": 2
      }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/courses/?page=1&limit=10&type=paid&sortBy=sold
```

---

## 2. GET /api/courses/:slug

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/courses/:slug`
* **Purpose**: Lấy thông tin chi tiết đầy đủ của khóa học theo Slug URL. Tự động tăng lượt xem (`view = view + 1`).
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `slug` | string | Yes | Đường dẫn định danh khóa học (ví dụ: `fullstack-nextjs-15`) |

### Business Rules
* Tự động tăng `view` của khóa học lên 1 đơn vị.
* Bao gồm toàn bộ:
  * `info`: Yêu cầu (`requirements`), quyền lợi (`benefits`), tài liệu (`documents`), câu hỏi thường gặp (`qa`).
  * `chapters`: Danh sách chương học và bài học con (chỉ lấy các chương chưa bị soft-delete `isDestroyed = false`).
  * `author`: Thông tin giảng viên hướng dẫn.
  * `category`: Thông tin danh mục.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched course detail successfully",
    "data": {
      "id": "5f6e7d8c-9b0a-1e2f-3a4b-5c6d7e8f9a0b",
      "_id": "5f6e7d8c-9b0a-1e2f-3a4b-5c6d7e8f9a0b",
      "title": "Fullstack Next.js 15 & Node.js Architecture",
      "slug": "fullstack-nextjs-15-nodejs-architecture",
      "price": 699000,
      "oldPrice": 1200000,
      "description": "Mô tả khóa học chi tiết",
      "info": {
        "requirements": ["Có kiến thức về JavaScript ES6+", "Biết React cơ bản"],
        "benefits": ["Tự tin xây dựng hệ thống Fullstack hoàn chỉnh", "Làm chủ kiến trúc PostgreSQL và Prisma"],
        "qa": [
          { "question": "Khóa học có bài tập thực hành không?", "answer": "Có bài tập và quiz trắc nghiệm sau mỗi bài học." }
        ]
      },
      "chapters": [
        {
          "id": "chapter-uuid-1",
          "_id": "chapter-uuid-1",
          "title": "Chương 1: Khởi động và Thiết lập môi trường",
          "order": 1,
          "lessons": [
            {
              "id": "lesson-uuid-1",
              "_id": "lesson-uuid-1",
              "title": "1.1 Giới thiệu tổng quan hệ thống",
              "duration": 600,
              "type": "video",
              "isDemo": true,
              "order": 1
            }
          ]
        }
      ],
      "view": 1251,
      "sold": 84
    }
  }
  ```

### Error Responses
* **404 Not Found**: Khóa học không tồn tại hoặc đã bị soft-delete (`isDestroyed = true`).

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/courses/fullstack-nextjs-15-nodejs-architecture
```
