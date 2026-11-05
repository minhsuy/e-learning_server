# TMDEMY — COUPON MANAGEMENT API (COUPON_API.MD)

Tài liệu đặc tả các API quản lý Mã giảm giá (`Coupon`) cho Giảng viên, Quản trị viên và chức năng kiểm tra mã giảm giá của học viên.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/coupons/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/coupons/`
* **Purpose**: Tạo mã giảm giá mới (theo tỷ lệ phần trăm hoặc số tiền VND).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Request Body
```json
{
  "title": "Mã khuyến mãi chào mừng hè 2026",
  "code": "SUMMER2026",
  "type": "percentage",
  "value": 20,
  "limit": 100,
  "startDate": "2026-06-01T00:00:00.000Z",
  "endDate": "2026-06-30T23:59:59.000Z",
  "active": true,
  "courses": [
    "course-uuid-1",
    "course-uuid-2"
  ]
}
```

### Validation & Business Rules
* `title`, `code`, `value`: Bắt buộc.
* `type`: `percentage` hoặc `number` (mặc định: `percentage`).
* `code`: Duy nhất trên toàn hệ thống (nếu trùng trả 400 "Coupon code already exists").
* **Teacher Ownership Rule**: Nếu người tạo là `TEACHER`:
  * Bắt buộc phải chỉ định ít nhất 1 khóa học trong `courses`.
  * Tất cả các khóa học trong `courses` **phải do chính Giảng viên đó sở hữu**. Nếu có khóa học của người khác -> trả `403 Forbidden` ("You cannot assign coupon to courses you do not own").

### Success Response
* **HTTP Status**: `201 Created`
* **JSON Schema**: Trả về thông tin coupon vừa tạo kèm `courses` và `author`.

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/coupons/
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Giảm giá 20%",
  "code": "SUMMER2026",
  "type": "percentage",
  "value": 20,
  "courses": ["course-uuid-1"]
}
```

---

## 2. POST /api/coupons/use (Check Coupon)

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/coupons/use`
* **Purpose**: Học viên kiểm tra mã giảm giá trước khi đặt hàng để biết số tiền giảm và giá cuối cùng (`finalPrice`).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Request Body
```json
{
  "code": "SUMMER2026",
  "courseId": "course-uuid-1"
}
```

### Business Rules
* Kiểm tra `code` tồn tại và `active = true`.
* Kiểm tra thời hạn: `startDate <= now <= endDate`.
* Kiểm tra giới hạn số lượt: `used < limit`.
* Kiểm tra khóa học `courseId` có nằm trong danh sách áp dụng của mã hay không.
* Tính toán số tiền giảm `discount` và `finalPrice = max(0, coursePrice - discount)`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Coupon is valid",
    "data": {
      "courseId": "course-uuid-1",
      "coursePrice": 500000,
      "discount": 100000,
      "finalPrice": 400000,
      "coupon": {
        "id": "coupon-uuid-1",
        "_id": "coupon-uuid-1",
        "title": "Giảm giá 20%",
        "code": "SUMMER2026",
        "type": "percentage",
        "value": 20
      }
    }
  }
  ```

### Error Responses
* **404 Not Found**: Mã không tồn tại hoặc đã bị vô hiệu hóa (`Coupon not found or inactive`).
* **400 Bad Request**:
  * Mã chưa đến ngày bắt đầu: `{ "success": false, "message": "Coupon has not started yet" }`
  * Mã đã hết hạn: `{ "success": false, "message": "Coupon has expired" }`
  * Mã đã hết lượt sử dụng: `{ "success": false, "message": "Coupon usage limit reached" }`
  * Mã không áp dụng cho khóa học này: `{ "success": false, "message": "Coupon not valid for this course" }`

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/coupons/use
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "code": "SUMMER2026",
  "courseId": "course-uuid-1"
}
```

---

## 3. GET /api/coupons/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/coupons/`
* **Purpose**: Lấy danh sách các mã giảm giá để quản lý.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`
* **Business Rule**: Admin xem được tất cả mã giảm giá trong hệ thống. Teacher chỉ xem được các mã do chính mình tạo (`authorId = userId`).

---

## 4. GET /api/coupons/:id

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/coupons/:id`
* **Purpose**: Xem chi tiết một mã giảm giá theo ID.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

---

## 5. PUT /api/coupons/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/coupons/:id`
* **Purpose**: Cập nhật thông tin mã giảm giá (tiêu đề, hạn dùng, trạng thái kích hoạt `active`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

---

## 6. DELETE /api/coupons/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/coupons/:id`
* **Purpose**: Xóa mã giảm giá khỏi hệ thống.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

---

## 7. GET /api/coupons/admin/statistics (BE-F9.11-005)

### Method & Endpoint
* **Method**: `GET`
* **Endpoints**:
  * Chuẩn: `/api/coupons/admin/statistics`
  * Alias: `/api/admin/coupons/statistics`
* **Purpose**: Thống kê số liệu Coupon trên toàn hệ thống cho Quản trị viên (Admin Coupon KPIs).
* **Authentication**: `Bearer JWT required`
* **Roles**: `ADMIN`

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lấy thống kê coupon thành công",
    "data": {
      "totalCoupons": 45,
      "activeCoupons": 28,
      "expiredCoupons": 12,
      "disabledCoupons": 5,
      "totalUsageCount": 1850,
      "totalDiscountAmount": 92500000
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/coupons/admin/statistics
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```

