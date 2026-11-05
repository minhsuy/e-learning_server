# TMDEMY — PUBLIC CATEGORY API (CATEGORY_API.MD)

Tài liệu đặc tả các API công khai truy vấn danh mục khóa học.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. GET /api/categories/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/categories/`
* **Purpose**: Lấy danh sách các danh mục khóa học đang hoạt động (`isDestroyed = false`) phục vụ cho thanh điều hướng (Navbar) và bộ lọc tìm kiếm.
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang |
| `limit` | number | No | `100` | Số lượng bản ghi mỗi trang |
| `search` | string | No | `undefined` | Tìm kiếm theo tên danh mục |
| `sortBy` | string | No | `"createdAt"`| Sắp xếp |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched categories successfully",
    "data": {
      "categories": [
        {
          "id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
          "_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
          "name": "Lập trình Web",
          "slug": "lap-trinh-web",
          "description": "HTML, CSS, JavaScript, React, Next.js, Node.js",
          "courseCount": 42,
          "createdAt": "2026-01-10T08:00:00.000Z"
        },
        {
          "id": "8b7c6d5e-4f3a-2b1c-0d9e-8f7a6b5c4d3e",
          "_id": "8b7c6d5e-4f3a-2b1c-0d9e-8f7a6b5c4d3e",
          "name": "Trí tuệ nhân tạo (AI)",
          "slug": "tri-tue-nhan-tao-ai",
          "description": "Machine Learning, Deep Learning, GenAI",
          "courseCount": 18,
          "createdAt": "2026-01-12T08:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 100,
        "total": 8,
        "totalPages": 1
      }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/categories/
```

---

## 2. GET /api/categories/:slug

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/categories/:slug`
* **Purpose**: Lấy thông tin chi tiết của một danh mục theo Slug URL.
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `slug` | string | Yes | Đường dẫn thân thiện của danh mục (ví dụ: `lap-trinh-web`) |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched category detail successfully",
    "data": {
      "id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
      "_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
      "name": "Lập trình Web",
      "slug": "lap-trinh-web",
      "description": "HTML, CSS, JavaScript, React, Next.js, Node.js",
      "createdAt": "2026-01-10T08:00:00.000Z",
      "updatedAt": "2026-01-10T08:00:00.000Z"
    }
  }
  ```

### Error Responses
* **404 Not Found**: Danh mục không tồn tại hoặc đã bị xóa mềm:
  ```json
  {
    "success": false,
    "message": "Category not found"
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/categories/lap-trinh-web
```
