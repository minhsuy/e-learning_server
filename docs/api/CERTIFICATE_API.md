# TMDEMY — CERTIFICATE GENERATION & VERIFICATION API (CERTIFICATE_API.MD)

Tài liệu đặc tả toàn diện API Quản lý và Xác thực Chứng chỉ Tốt nghiệp (`Certificate`) cho học viên khi hoàn thành khóa học trên nền tảng TMdemy.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/certificates

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/certificates`
* **Purpose**: Học viên yêu cầu cấp chứng chỉ sau khi hoàn thành khóa học. Backend kiểm tra toàn bộ điều kiện tốt nghiệp, tự động tính điểm tổng kết (`grade`), sinh file PDF chứng chỉ chuẩn Landscape A4 có mã QR và tiếng Việt Unicode, upload lên Cloudinary và lưu vào cơ sở dữ liệu PostgreSQL.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Học viên đã ghi danh vào khóa học)

### Request Body
```json
{
  "courseId": "course-uuid-v4"
}
```

### Validation Rules
* `courseId`: Bắt buộc, UUID hợp lệ (RFC 4122).

### Business Rules (Bắt buộc thỏa mãn đồng thời cả 5 điều kiện)
1. **Ghi danh**: Học viên bắt buộc phải có bản ghi ghi danh `Enrollment` trong khóa học.
2. **Chưa có chứng chỉ**: Chưa từng được cấp chứng chỉ cho khóa học này (ràng buộc `@@unique([userId, courseId])`). Nếu đã có -> trả `400 Bad Request` ("You already have a certificate for this course!").
3. **Tiến độ học tập**: `Enrollment.progress >= 70%`. Nếu chưa đủ 70% bài học -> trả `400 Bad Request` ("Progress is less than 70%").
4. **Tỷ lệ làm bài kiểm tra**: Khóa học phải có Quiz và học viên phải nộp bài cho ít nhất 60% số lượng Quiz có trong khóa học:
   $$\text{quizCompletionPercentage} = \frac{\text{Số quiz đã nộp}}{\text{Tổng số quiz của khóa học}} \times 100 \ge 60\%$$
   Nếu < 60% -> trả `400 Bad Request` ("Quiz submission percentage is less than 60%").
5. **Điểm tổng kết (Final Grade - EXISTING formula)**: Điểm trung bình kết hợp giữa tiến độ học tập và tỷ lệ làm bài tập phải đạt tối thiểu 50%:
   $$\text{finalScore} = \frac{\text{progress} + \text{quizCompletionPercentage}}{2} \ge 50$$
   Nếu < 50% -> trả `400 Bad Request` ("Total score is less than 50%").

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Certificate created successfully",
    "data": {
      "id": "cert-uuid-1",
      "_id": "cert-uuid-1",
      "code": "TMDEMY-CERT-2026-7844F28C",
      "userId": "user-uuid-v4",
      "courseId": "course-uuid-v4",
      "certificateUrl": "https://res.cloudinary.com/dxostp23y/raw/upload/certificates/certificate_uuid.pdf",
      "grade": 100,
      "createdAt": "2026-03-01T11:00:00.000Z",
      "updatedAt": "2026-03-01T11:00:00.000Z"
    }
  }
  ```

### Error Responses
* **400 Bad Request**:
  * Đã có chứng chỉ: `{ "success": false, "message": "You already have a certificate for this course!" }`
  * Tiến độ chưa đủ 70%: `{ "success": false, "message": "Progress is less than 70%" }`
  * Chưa nộp đủ 60% bài quiz: `{ "success": false, "message": "Quiz submission percentage is less than 60%" }`
  * Điểm tổng kết < 50: `{ "success": false, "message": "Total score is less than 50%" }`
* **404 Not Found**: Chưa ghi danh vào khóa học (`You are not enrolled in this course!`).

---

## 2. GET /api/certificates/my

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/certificates/my`
* **Purpose**: Lấy danh sách toàn bộ chứng chỉ đã đạt được của học viên hiện tại đang đăng nhập. Kèm theo thông tin tóm tắt khóa học (`title`, `slug`, `thumbnail`).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Học viên)

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Get my certificates successfully",
    "data": [
      {
        "id": "cert-uuid-1",
        "_id": "cert-uuid-1",
        "code": "TMDEMY-CERT-2026-7844F28C",
        "userId": "user-uuid-v4",
        "courseId": "course-uuid-v4",
        "certificateUrl": "https://res.cloudinary.com/dxostp23y/raw/upload/certificates/certificate_uuid.pdf",
        "grade": 100,
        "createdAt": "2026-03-01T11:00:00.000Z",
        "updatedAt": "2026-03-01T11:00:00.000Z",
        "course": {
          "id": "course-uuid-v4",
          "title": "ReactJS Advanced - Update 2025",
          "slug": "reactjs-advanced-update-2025",
          "thumbnail": "https://example.com/thumb.jpg"
        }
      }
    ]
  }
  ```

---

## 3. GET /api/certificates/course/:courseId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/certificates/course/:courseId`
* **Purpose**: Kiểm tra và lấy chứng chỉ của học viên hiện tại đối với một khóa học cụ thể.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Học viên)

### Route Parameters
* `courseId`: UUID của khóa học cần kiểm tra.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Get certificate by course successfully",
    "data": {
      "id": "cert-uuid-1",
      "_id": "cert-uuid-1",
      "code": "TMDEMY-CERT-2026-7844F28C",
      "userId": "user-uuid-v4",
      "courseId": "course-uuid-v4",
      "certificateUrl": "https://res.cloudinary.com/dxostp23y/raw/upload/certificates/certificate_uuid.pdf",
      "grade": 100,
      "createdAt": "2026-03-01T11:00:00.000Z",
      "updatedAt": "2026-03-01T11:00:00.000Z",
      "course": {
        "id": "course-uuid-v4",
        "title": "ReactJS Advanced - Update 2025",
        "slug": "reactjs-advanced-update-2025",
        "thumbnail": "https://example.com/thumb.jpg"
      }
    }
  }
  ```

### Error Response
* **404 Not Found**: Chưa có chứng chỉ cho khóa học này (`Certificate not found for this course`).

---

## 4. GET /api/certificates/verify/:code

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/certificates/verify/:code`
* **Purpose**: **Public Verification Endpoint** — Xác thực tính hợp lệ của chứng chỉ thông qua mã code công khai (hoặc quét mã QR trên chứng chỉ PDF).
* **Authentication**: **None** (Công khai, không yêu cầu JWT).
* **Route Parameters**:
  * `code`: Chuỗi mã chứng chỉ (VD: `TMDEMY-CERT-2026-7844F28C` hoặc UUID).

### Bảo mật & Quyền riêng tư (Zero Leak Security Model)
Để tuân thủ tiêu chuẩn an toàn thông tin và bảo vệ quyền riêng tư người học:
* Không yêu cầu JWT token.
* **Tuyệt đối không để lộ**: `userId`, internal database IDs, `email`, `phone`, `password`, Cloudinary secret keys hoặc thông tin tài khoản ngân hàng/order.
* **Chỉ công khai các dữ liệu đã được phép**:
  * Thông tin học viên: `name`, `avatar`.
  * Thông tin khóa học: `title`, `slug`, `thumbnail`.
  * Thông tin giảng viên: `name`.
  * Thông tin chứng chỉ: `code`, `grade`, `issueDate` (`createdAt`), `certificateUrl`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Certificate verified successfully",
    "data": {
      "code": "TMDEMY-CERT-2026-7844F28C",
      "certificateUrl": "https://res.cloudinary.com/dxostp23y/raw/upload/certificates/certificate_uuid.pdf",
      "grade": 100,
      "issueDate": "2026-03-01T11:00:00.000Z",
      "student": {
        "name": "Nguyễn Văn A",
        "avatar": "https://example.com/avatar.jpg"
      },
      "course": {
        "title": "ReactJS Advanced - Update 2025",
        "slug": "reactjs-advanced-update-2025",
        "thumbnail": "https://example.com/thumb.jpg",
        "author": {
          "name": "Giảng Viên TMDEMY"
        }
      }
    }
  }
  ```

### Error Responses
* **404 Not Found**: Mã chứng chỉ không tồn tại hoặc không hợp lệ:
  ```json
  {
    "success": false,
    "message": "Certificate not found or invalid verification code"
  }
  ```
