# TMDEMY — ORDER & CHECKOUT API SPECIFICATION (ORDER_API.MD)

Tài liệu đặc tả các API Đơn hàng (`Order`), Thanh toán (`Checkout`) và Quản trị đơn hàng.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/orders/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/orders/`
* **Purpose**: Học viên tạo đơn hàng mua khóa học (kèm áp dụng mã giảm giá `couponCode` nếu có).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Request Body
```json
{
  "courseId": "course-uuid-v4",
  "couponCode": "WELCOME20"
}
```

### Validation Rules
* `courseId`: Bắt buộc, UUID hợp lệ.
* `couponCode`: Tùy chọn, chuỗi mã giảm giá.

### Business Rules (Rất quan trọng)
1. **Kiểm tra mua trùng (Duplicate Purchase Prevention)**:
   * Nếu học viên đã có đơn hàng `COMPLETED` cho khóa học này -> trả về `400 Bad Request` ("You already enrolled in this course").
   * Nếu học viên đang có đơn hàng `PENDING` chưa xử lý cho khóa học này -> trả về `400 Bad Request` ("You already have a pending order for this course").
2. **Khóa học hợp lệ**: Khóa học phải tồn tại và chưa bị soft-delete (`isDestroyed = false`).
3. **Áp dụng Mã giảm giá (Coupon)**:
   * Nếu có `couponCode`: kiểm tra thời hạn `startDate <= now <= endDate`, trạng thái `active = true`, số lượt dùng `used < limit`, và khóa học có nằm trong danh sách áp dụng của coupon không.
   * Tính số tiền giảm `discount` (theo % hoặc số tiền cố định).
   * Tăng số lượt dùng của coupon `used = used + 1`.
4. **Xử lý Khóa học Miễn phí / Giảm 100% (`total === 0`)**:
   * Nếu `total === 0` (Khóa học `type = FREE` hoặc giảm giá 100%):
     * Đơn hàng tự động lưu với trạng thái **`COMPLETED`** ngay lập tức!
     * Hệ thống tự động tạo bản ghi **`Enrollment`** cho học viên.
     * Hệ thống tự động thêm học viên vào nhóm chat (`Conversation`) của khóa học.
     * Tăng số lượng đã bán của khóa học `sold = sold + 1`.
5. **Xử lý Khóa học Có phí (`total > 0`)**:
   * Đơn hàng được lưu với trạng thái **`PENDING`**.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Order created successfully",
    "data": {
      "id": "order-uuid-1",
      "_id": "order-uuid-1",
      "userId": "user-uuid-v4",
      "courseId": "course-uuid-v4",
      "amount": 499000,
      "discount": 100000,
      "total": 399000,
      "status": "pending",
      "course": {
        "id": "course-uuid-v4",
        "_id": "course-uuid-v4",
        "title": "Lập trình React Native",
        "price": 499000
      },
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/orders/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "courseId": "course-uuid-v4",
  "couponCode": "WELCOME20"
}
```

---

## 2. GET /api/orders/my

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/orders/my`
* **Purpose**: Học viên xem lại lịch sử các đơn hàng của chính mình (có phân trang và lọc theo trạng thái).
* **Authentication**: `Bearer JWT required`
* **Roles**: All

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang |
| `limit` | number | No | `10` | Số lượng đơn hàng mỗi trang |
| `status` | string | No | `undefined` | Lọc theo: `pending`, `completed`, `rejected` |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**: Trả về danh sách đơn hàng đã format kèm `amount`, `discount`, `total` dạng Number.

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/orders/my?page=1&limit=10
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 3. PUT /api/orders/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/orders/:id`
* **Purpose**: Quản trị viên (`ADMIN`) hoặc Giảng viên sở hữu khóa học (`TEACHER`) cập nhật trạng thái đơn hàng (ví dụ: xác nhận thanh toán `COMPLETED` hoặc hủy đơn `REJECTED`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã đơn hàng cần cập nhật |

### Request Body
```json
{
  "status": "rejected",
  "rejectedReason": "Học viên yêu cầu hủy đơn do thanh toán nhầm"
}
```

### Business Rules (Rất quan trọng)
* **Khi chuyển sang `COMPLETED`**:
  * Tự động tạo bản ghi ghi danh học tập (`Enrollment`) cho học viên (`status = ACTIVE`, `progress = 0`).
  * Tăng số lượng đã bán của khóa học (`sold = sold + 1`).
  * Tự động thêm học viên vào nhóm trò chuyện chung của khóa học (`Conversation`).
  * Gửi Notification thông báo thanh toán thành công cho học viên.
* **Khi chuyển sang `REJECTED` (Vòng đời chuẩn hóa theo BE-F9.11-006)**:
  * **Tính chất lưu vết (Data Retention)**: Bản ghi Order **KHÔNG BỊ XÓA CỨNG (NO HARD DELETE)**. Đơn hàng được bảo toàn vĩnh viễn trong PostgreSQL với trạng thái `status: "REJECTED"`, lưu thời điểm `rejectedAt` và lý do từ chối `rejectedReason` để phục vụ đối soát tài chính và kiểm toán.
  * Nếu trước đó đơn hàng từng ở trạng thái `COMPLETED`: tự động rollback số lượng đã bán (`sold = sold - 1`) và thu hồi quyền ghi danh (xóa bản ghi Enrollment tương ứng).
  * Nếu đơn hàng có sử dụng coupon: hoàn lại số lượt đã dùng của coupon (`used = max(0, used - 1)`).
  * Đơn hàng bị từ chối có thể được tra cứu lại bất cứ lúc nào qua `GET /api/orders?status=rejected`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Order rejected successfully!",
    "data": {
      "id": "order-uuid-1",
      "code": "DH-2464723",
      "amount": 499000,
      "discount": 0,
      "total": 499000,
      "status": "REJECTED",
      "rejectedReason": "Học viên yêu cầu hủy đơn do thanh toán nhầm",
      "rejectedAt": "2026-10-20T19:40:00.000Z",
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-10-20T19:40:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/orders/order-uuid-1
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
Content-Type: application/json

{
  "status": "rejected",
  "rejectedReason": "Học viên yêu cầu hủy đơn do thanh toán nhầm"
}
```

---

## 4. GET /api/orders/

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/orders/`
* **Purpose**: Lấy danh sách toàn bộ đơn hàng trong hệ thống (dành cho Admin và Giảng viên).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang |
| `limit` | number | No | `10` | Số lượng đơn hàng mỗi trang |
| `status` | string | No | `undefined` | Lọc theo trạng thái (`pending`, `completed`, `rejected`) |
| `search` | string | No | `undefined` | Tìm kiếm theo mã đơn hàng |
| `sortBy` | string | No | `"createdAt"`| Sắp xếp |

### Business & Ownership Rules
* Nếu người gọi là `ADMIN`: hiển thị tất cả đơn hàng trong toàn bộ hệ thống.
* Nếu người gọi là `TEACHER`: **chỉ hiển thị các đơn hàng mua các khóa học do chính giảng viên đó tạo** (bảo đảm cách ly dữ liệu giữa các giảng viên).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**: Trả về danh sách đơn hàng có thông tin học viên (`user`) và khóa học (`course`).

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/orders/?page=1&limit=10&status=completed
Authorization: Bearer <ADMIN_ACCESS_TOKEN>
```
