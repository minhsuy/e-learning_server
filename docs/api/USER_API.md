# TMDEMY — USER & PROFILE API SPECIFICATION (USER_API.MD)

Tài liệu đặc tả toàn bộ các API quản lý thông tin tài khoản cá nhân, đổi mật khẩu và danh sách giảng viên công khai.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. PUT /api/users/update-me

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/users/update-me`
* **Purpose**: Cập nhật thông tin hồ sơ của người dùng hiện tại (username, avatar, phone, bio, mạng xã hội).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Headers
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "username": "minh_developer",
  "phone": "0987654321",
  "bio": "Fullstack Software Engineer passionate about React and Node.js",
  "avatar": "https://res.cloudinary.com/tmdemy/image/upload/v1/avatar.png",
  "socialLinks": {
    "facebook": "https://facebook.com/minhdev",
    "instagram": "https://instagram.com/minhdev",
    "github": "https://github.com/minhdev"
  }
}
```

### Validation Rules
* `username`: Tùy chọn, tối thiểu 3 ký tự.
* `phone`: Tùy chọn, phải là số điện thoại Việt Nam hợp lệ.
* `bio`: Tùy chọn, tối đa 200 ký tự.
* `avatar`: Tùy chọn, phải là URL hợp lệ.
* `socialLinks.facebook`: Tùy chọn, URL hợp lệ.
* `socialLinks.instagram`: Tùy chọn, URL hợp lệ.
* `socialLinks.github`: Tùy chọn, URL hợp lệ.

### Business & Authorization Rules
* `userId` trích xuất trực tiếp từ JWT Access Token (`req.user.userId`).
* Nếu `username` được thay đổi: hệ thống kiểm tra tính duy nhất (`isUsernameTaken`). Nếu username mới đã có người khác sử dụng, trả về `400 Bad Request` kèm message "Username already taken".

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
      "_id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
      "username": "minh_developer",
      "email": "student@example.com",
      "status": "ACTIVE",
      "role": "user",
      "avatar": "https://res.cloudinary.com/tmdemy/image/upload/v1/avatar.png",
      "phone": "0987654321",
      "bio": "Fullstack Software Engineer passionate about React and Node.js",
      "socialLinks": {
        "facebook": "https://facebook.com/minhdev",
        "instagram": "https://instagram.com/minhdev",
        "github": "https://github.com/minhdev"
      },
      "isVerified": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-05T12:00:00.000Z"
    }
  }
  ```

### Error Responses
* **401 Unauthorized**: Token thiếu hoặc không hợp lệ.
* **400 Bad Request**:
  * Trùng username: `{ "success": false, "message": "Username already taken" }`
  * Validation error: `{ "errors": { "avatar": "Avatar must be a valid URL" } }`
* **404 Not Found**: User không tồn tại trong database.

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/users/update-me
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "username": "minh_developer",
  "bio": "Lập trình viên đam mê chia sẻ kiến thức"
}
```

---

## 2. PUT /api/users/change-password

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/users/change-password`
* **Purpose**: Đổi mật khẩu tài khoản cho người dùng đang đăng nhập.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Headers
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "oldPassword": "CurrentPassword123",
  "password": "NewSecretPassword456",
  "confirm_password": "NewSecretPassword456"
}
```

### Validation Rules
* `oldPassword`: Bắt buộc, tối thiểu 6 ký tự.
* `password`: Bắt buộc, tối thiểu 6 ký tự.
* `confirm_password`: Bắt buộc, phải khớp chính xác với `password`.

### Business Rules
* Kiểm tra `oldPassword` khớp với mật khẩu đang lưu trong database bằng `bcrypt.compare`. Nếu không khớp, trả về `400 Bad Request`.
* Sau khi đổi mật khẩu thành công, hệ thống xóa `refreshToken = null` trong PostgreSQL để đăng xuất phiên làm việc trên các thiết bị khác.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

### Error Responses
* **400 Bad Request**:
  * Mật khẩu cũ không chính xác: `{ "success": false, "message": "Old password is incorrect" }`
  * Mật khẩu xác nhận không khớp: `{ "errors": { "confirm_password": "Passwords do not match" } }`

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/users/change-password
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "oldPassword": "CurrentPassword123",
  "password": "NewSecretPassword456",
  "confirm_password": "NewSecretPassword456"
}
```

---

## 3. GET /api/users/profile/:id

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/users/profile/:id`
* **Purpose**: Xem hồ sơ công khai của giảng viên hoặc học viên bất kỳ theo ID.
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã định danh người dùng (UUID v4) |

### Validation Rules
* `id`: Phải là UUID v4 hợp lệ. Nếu không hợp lệ trả về `400 Bad Request`.

### Business Rules
* Dữ liệu trả về chỉ chứa thông tin an toàn công khai: `id`, `username`, `email`, `role`, `status`, `avatar`, `phone`, `bio`, `socialLinks`, `createdAt`.
* Mật khẩu và token không bao giờ xuất hiện.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Get user info successfully !",
    "data": {
      "id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
      "_id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
      "username": "teacher_hoang",
      "email": "hoang.teacher@tmdemy.vn",
      "role": "teacher",
      "status": "active",
      "avatar": "https://res.cloudinary.com/tmdemy/image/upload/v1/avatar.jpg",
      "phone": "0912345678",
      "bio": "Giảng viên thâm niên 8 năm kinh nghiệm lập trình Backend",
      "socialLinks": {
        "facebook": "https://facebook.com/teacherhoang",
        "instagram": "",
        "github": "https://github.com/teacherhoang"
      },
      "createdAt": "2026-01-15T08:30:00.000Z"
    }
  }
  ```

### Error Responses
* **400 Bad Request**:
  * ID không phải UUID: `{ "errors": { "id": "Invalid user id" } }`
* **404 Not Found**:
  * Người dùng không tồn tại: `{ "success": false, "message": "User not found" }`

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/users/profile/e3b0c442-98fc-1c14-9afb-4c8996fb9242
```

---

## 4. GET /api/users/teachers

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/users/teachers`
* **Purpose**: Lấy danh sách toàn bộ các Giảng viên (Teachers) đang hoạt động trong hệ thống có phân trang và tìm kiếm.
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `page` | number | No | `1` | Số trang (tối thiểu 1) |
| `limit` | number | No | `10` | Số lượng giảng viên mỗi trang (1-100) |
| `search` | string | No | `undefined` | Từ khóa tìm kiếm theo username hoặc email |
| `sortBy` | string | No | `"createdAt"`| Trường sắp xếp |

### Validation Rules
* `page`: Số nguyên >= 1.
* `limit`: Số nguyên từ 1 đến 100.
* `search`: Chuỗi văn bản.

### Business Rules
* Chỉ lấy người dùng có `role = TEACHER` và `status = ACTIVE`.
* Không hiển thị thông tin nhạy cảm.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched teachers successfully!",
    "data": {
      "teachers": [
        {
          "id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
          "_id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
          "username": "teacher_hoang",
          "avatar": "https://res.cloudinary.com/tmdemy/image/upload/v1/avatar.jpg",
          "bio": "Chuyên gia Node.js & Cloud",
          "phone": "0912345678",
          "socialLinks": {
            "facebook": "https://facebook.com/teacherhoang",
            "instagram": "",
            "github": "https://github.com/teacherhoang"
          },
          "createdAt": "2026-01-15T08:30:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 12,
        "totalPages": 2
      }
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/users/teachers?page=1&limit=10&search=hoang
```

---

## Frontend Usage Notes
1. **Trang thông tin Giảng viên**: Dùng `GET /api/users/teachers` cho trang danh sách giảng viên (`/teachers`) và `GET /api/users/profile/:id` cho trang chi tiết giảng viên (`/teachers/:id`). Cả hai đều là Public API, không cần đăng nhập.
2. **Cập nhật thông tin**: Form cập nhật profile chỉ gửi các trường thay đổi; backend hỗ trợ cập nhật từng phần (partial update).
3. **Gamification & Điểm kinh nghiệm cá nhân**: Các endpoint quản lý tiến độ và thành tích cá nhân của học viên (`GET /api/users/me/xp-summary`, `GET /api/users/me/streak`, `GET /api/users/me/xp-history`, `GET /api/users/me/leaderboard-position`) được đặc tả chi tiết tại [GAMIFICATION_LEADERBOARD_API.md](file:///d:/e-learning_server/docs/api/GAMIFICATION_LEADERBOARD_API.md).

