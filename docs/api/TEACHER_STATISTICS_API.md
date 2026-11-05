# TMDEMY — TEACHER STATISTICS API (TEACHER_STATISTICS_API.MD)

Tài liệu đặc tả toàn diện 5 API Thống kê Dành cho Giảng viên (`Teacher Statistics`) phục vụ cho Teacher Dashboard.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

> [!IMPORTANT]
> **Quy tắc Định danh Bắt buộc (Strict Teacher Authorization)**:
> * `teacherId` **tuyệt đối KHÔNG được gửi từ Frontend** qua query params, URL params hay body.
> * `teacherId` **bắt buộc được trích xuất từ JWT Access Token**: `req.user.userId`.
> * Bất kỳ yêu cầu nào không có Bearer Token hợp lệ hoặc không có vai trò `TEACHER` (`req.user.role === 'teacher'`) đều bị từ chối với mã lỗi `401 Unauthorized` hoặc `403 Forbidden`.
> * Số liệu thống kê được cách ly 100%: Giảng viên **chỉ nhìn thấy số liệu của các khóa học do chính mình tạo ra** (`Course.authorId === teacherId`).

---

## 1. GET /api/teacher/statistics/overview

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/teacher/statistics/overview`
* **Purpose**: Cung cấp tổng quan các chỉ số KPI trọng yếu của Giảng viên (Tổng doanh thu, tổng học viên, tổng khóa học và đánh giá trung bình).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Headers
```http
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

### Request Parameters
* None (Toàn bộ tham số lấy tự động từ Token).

### Business Rules
1. **Doanh thu (`revenue`)**:
   * Chỉ tính các đơn hàng có `Order.status = COMPLETED` và thuộc các khóa học của Giảng viên.
   * `totalRevenue`: Tổng tiền thực nhận (VND) sau khi đã trừ giảm giá (`SUM(Order.total)`).
   * `completedOrders`: Tổng số đơn hàng hoàn tất (`COUNT(Order)`).
   * `averageOrderValue`: Giá trị đơn hàng trung bình (`totalRevenue / completedOrders`). Nếu `completedOrders = 0`, giá trị là `0` (không có lỗi NaN/Infinity).
2. **Học viên (`students`)**:
   * `totalStudents`: Tổng số học viên duy nhất đã từng ghi danh (`COUNT(DISTINCT userId)` trên Enrollment của giảng viên).
   * `activeStudents`: Số lượng học viên đang học (`status = ACTIVE`).
   * `completedStudents`: Số lượng học viên đã hoàn thành khóa học (`status = COMPLETED`).
3. **Khóa học (`courses`)**:
   * `total`: Tổng số khóa học chưa bị xóa mềm (`isDestroyed = false`).
   * `approved`: Số khóa học đã duyệt.
   * `pending`: Số khóa học đang chờ duyệt.
   * `rejected`: Số khóa học bị từ chối.
4. **Đánh giá (`rating`)**:
   * Chỉ tính các đánh giá có `status = ACTIVE`.
   * `averageRating`: Điểm trung bình sao (làm tròn 2 chữ số thập phân).
   * `totalReviews`: Tổng số lượt đánh giá.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched teacher overview statistics successfully",
    "data": {
      "revenue": {
        "totalRevenue": 24500000,
        "completedOrders": 45,
        "averageOrderValue": 544444.44,
        "currency": "VND"
      },
      "students": {
        "totalStudents": 42,
        "activeStudents": 35,
        "completedStudents": 7
      },
      "courses": {
        "total": 5,
        "approved": 4,
        "pending": 1,
        "rejected": 0
      },
      "rating": {
        "averageRating": 4.85,
        "totalReviews": 38
      }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/teacher/statistics/overview
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 2. GET /api/teacher/statistics/revenue

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/teacher/statistics/revenue`
* **Purpose**: Cung cấp dữ liệu biểu đồ doanh thu theo chu kỳ thời gian (7 ngày, 30 ngày, 12 tháng hoặc khoảng ngày tùy chọn `custom`), hỗ trợ lọc theo từng khóa học cụ thể.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `period` | string | No | `"30days"` | Chu kỳ: `7days`, `30days`, `12months`, `custom` |
| `startDate`| string | Chỉ khi `period=custom` | `undefined` | Ngày bắt đầu định dạng `YYYY-MM-DD` |
| `endDate` | string | Chỉ khi `period=custom` | `undefined` | Ngày kết thúc định dạng `YYYY-MM-DD` |
| `courseId` | UUID | No | `undefined` | Lọc doanh thu của 1 khóa học duy nhất |

### Validation Rules
* `period`: Phải là một trong `7days`, `30days`, `12months`, `custom`.
* `startDate`, `endDate`: Phải theo chuẩn `YYYY-MM-DD`. `startDate` không được lớn hơn `endDate`.
* `courseId`: Phải là UUID v4 hợp lệ.

### Business & Ownership Rules
* **Ownership Check**: Nếu gửi `courseId`, backend kiểm tra khóa học đó phải thuộc sở hữu của Giảng viên. Nếu thuộc giảng viên khác -> trả về `403 Forbidden` (`You can only view revenue for your own courses`).
* **Lọc thời gian**: Với `period = custom`, backend tự động tính biên độ thời gian bao gồm trọn vẹn cả ngày kết thúc (chuyển sang `00:00:00 UTC` của ngày tiếp theo).
* **Nhóm dữ liệu**:
  * `7days`, `30days`, `custom`: Nhóm theo ngày (`DATE_TRUNC('day', ...)`), định dạng ngày `YYYY-MM-DD`.
  * `12months`: Nhóm theo tháng (`DATE_TRUNC('month', ...)`), định dạng tháng `YYYY-MM`.
* Chỉ tính các đơn hàng có `Order.status = COMPLETED`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched teacher revenue statistics successfully",
    "data": {
      "summary": {
        "totalRevenue": 15000000,
        "totalOrders": 30,
        "averageOrderValue": 500000,
        "currency": "VND"
      },
      "timeline": [
        {
          "date": "2026-02-01",
          "revenue": 1500000,
          "ordersCount": 3
        },
        {
          "date": "2026-02-02",
          "revenue": 2000000,
          "ordersCount": 4
        }
      ]
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/teacher/statistics/revenue?period=30days
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

```http
GET {{BASE_URL}}/api/teacher/statistics/revenue?period=custom&startDate=2026-01-01&endDate=2026-02-28
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 3. GET /api/teacher/statistics/courses

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/teacher/statistics/courses`
* **Purpose**: Bảng xếp hạng và hiệu suất từng khóa học của giảng viên (doanh thu, số học viên, điểm đánh giá).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang (>= 1) |
| `limit` | number | No | `10` | Số lượng khóa học mỗi trang (1-100) |
| `sortBy` | string | No | `"revenue"`| Tiêu chí xếp hạng: `revenue`, `students`, `rating`, `createdAt` |
| `order` | string | No | `"desc"` | Thứ tự sắp xếp: `asc`, `desc` |
| `status` | string | No | `undefined`| Lọc theo trạng thái: `approved`, `pending`, `rejected` |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched teacher courses statistics successfully",
    "data": {
      "courses": [
        {
          "id": "course-uuid-1",
          "_id": "course-uuid-1",
          "title": "Fullstack Next.js 15 & Node.js Architecture",
          "slug": "fullstack-nextjs-15-nodejs-architecture",
          "image": "https://res.cloudinary.com/tmdemy/course.png",
          "price": 699000,
          "status": "approved",
          "view": 1250,
          "totalStudents": 42,
          "totalRevenue": 24500000,
          "averageRating": 4.85,
          "totalReviews": 38,
          "createdAt": "2026-02-01T10:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 4,
        "totalPages": 1
      }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/teacher/statistics/courses?sortBy=revenue&order=desc
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/teacher/statistics/enrollments

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/teacher/statistics/enrollments`
* **Purpose**: Thống kê số lượng ghi danh mới theo thời gian và phân bố trạng thái học tập của học viên.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `period` | string | No | `"30days"` | Chu kỳ: `7days`, `30days`, `12months` |
| `courseId` | UUID | No | `undefined` | Lọc theo khóa học cụ thể của giảng viên |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched teacher enrollment statistics successfully",
    "data": {
      "summary": {
        "totalEnrollments": 42,
        "activeCount": 35,
        "completedCount": 7,
        "canceledCount": 0
      },
      "timeline": [
        {
          "date": "2026-02-01",
          "count": 5
        },
        {
          "date": "2026-02-02",
          "count": 3
        }
      ]
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/teacher/statistics/enrollments?period=30days
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 5. GET /api/teacher/statistics/learning

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/teacher/statistics/learning`
* **Purpose**: Thống kê tiến độ học tập trung bình, tỷ lệ hoàn thành khóa học và số chứng chỉ đã cấp cho học viên.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `courseId` | UUID | No | Lọc theo một khóa học cụ thể |

### Business Rules
* `averageProgress`: Điểm tiến độ trung bình (`AVG(Enrollment.progress)`), làm tròn 2 chữ số.
* `completionRate`: Tỷ lệ học viên hoàn thành khóa học (`(completedStudents / totalStudents) * 100`).
* `certificateRate`: Tỷ lệ học viên được cấp chứng chỉ (`(certificatesIssued / totalStudents) * 100`).
* Nếu `totalStudents = 0`: Các tỷ lệ tự động trả về `0` (an toàn tuyệt đối, không có lỗi chia cho 0).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched teacher learning statistics successfully",
    "data": {
      "totalStudents": 42,
      "averageProgress": 65.4,
      "completedStudents": 7,
      "completionRate": 16.67,
      "certificatesIssued": 6,
      "certificateRate": 14.29
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/teacher/statistics/learning
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```
