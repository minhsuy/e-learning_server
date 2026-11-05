# TMDEMY — AUTHENTICATION API SPECIFICATION (AUTH_API.MD)

Tài liệu đặc tả toàn bộ các API thuộc phân hệ Xác thực (Authentication) của TMDEMY backend.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/users/register

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/users/register`
* **Purpose**: Đăng ký tài khoản học viên mới vào hệ thống. Sau khi đăng ký, hệ thống gửi email chứa mã OTP 6 chữ số để xác thực tài khoản.
* **Authentication**: `Public`
* **Roles**: Không yêu cầu

### Request Parameters
* **Path Parameters**: None
* **Query Parameters**: None
* **Headers**:
  ```http
  Content-Type: application/json
  ```
* **Request Body**:
  ```json
  {
    "username": "minh_student",
    "email": "student@example.com",
    "password": "Password123",
    "confirm_password": "Password123",
    "phone": "0987654321",
    "bio": "Học viên đam mê lập trình web"
  }
  ```

### Validation Rules
* `username`: Bắt buộc, chuỗi từ 3 đến 30 ký tự.
* `email`: Bắt buộc, định dạng email hợp lệ.
* `password`: Bắt buộc, tối thiểu 6 ký tự.
* `confirm_password`: Bắt buộc, phải khớp chính xác với `password`.
* `phone`: Tùy chọn, phải là số điện thoại Việt Nam hợp lệ (`isMobilePhone('vi-VN')`).
* `bio`: Tùy chọn, tối đa 200 ký tự.

### Authorization & Security Rules
* Endpoint này chỉ đăng ký với vai trò mặc định `USER` (`UserRole.USER`), không cho phép client tự gửi quyền khác (chống Privilege Escalation).
* Mật khẩu được băm bằng `bcryptjs` với salt rounds = 10.
* Trạng thái tài khoản ban đầu: `isVerified = false`, mã OTP ngẫu nhiên 6 chữ số có hiệu lực trong 10 phút.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Đăng ký tài khoản thành công . Vui lòng check email để xác thực !"
  }
  ```

### Error Responses
* **400 Bad Request**:
  * Validation thất bại (thiếu trường, mật khẩu không khớp, username ngắn):
    ```json
    {
      "errors": {
        "confirm_password": "Passwords do not match"
      }
    }
    ```
  * Email đã tồn tại:
    ```json
    {
      "errors": {
        "email": "Email already in use"
      }
    }
    ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/users/register
Content-Type: application/json

{
  "username": "minh_student",
  "email": "student@example.com",
  "password": "Password123",
  "confirm_password": "Password123",
  "phone": "0987654321"
}
```

### Test Cases
1. **Case 1 — Success**: Gửi body hợp lệ đầy đủ -> 200 OK.
2. **Case 2 — Duplicate Email**: Gửi email đã có trong database -> 400 Bad Request kèm message "Email already in use".
3. **Case 3 — Password Mismatch**: `password` và `confirm_password` khác nhau -> 400 Bad Request.
4. **Case 4 — Invalid Phone**: `phone` sai định dạng số điện thoại Việt Nam -> 400 Bad Request.

---

## 2. POST /api/users/verify-otp

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/users/verify-otp`
* **Purpose**: Xác thực địa chỉ email của tài khoản vừa đăng ký bằng mã OTP 6 số nhận qua email.
* **Authentication**: `Public`
* **Roles**: Không yêu cầu

### Request Parameters
* **Headers**:
  ```http
  Content-Type: application/json
  ```
* **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "otp": "123456"
  }
  ```

### Validation Rules
* `email`: Bắt buộc, email hợp lệ.
* `otp`: Bắt buộc, chuỗi số đúng 6 ký tự (`isLength({ min: 6, max: 6 })`, `isNumeric()`).

### Business Rules
* Kiểm tra tài khoản trong database:
  * Nếu tài khoản đã được xác thực trước đó (`isVerified = true`): trả về thông báo tài khoản đã xác thực.
  * Nếu OTP đã hết hạn (`otpExpires < now`): backend tự động xóa tài khoản chưa xác thực khỏi database để giải phóng email và báo lỗi yêu cầu đăng ký lại.
  * Nếu mã OTP băm khớp với `user.otpCode`: cập nhật `isVerified = true` và xóa OTP.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Xác thực email thành công!"
  }
  ```

### Error Responses
* **400 Bad Request / 500**:
  * Người dùng không tồn tại: `{ "success": false, "error": "Người dùng không tồn tại" }`
  * OTP hết hạn: `{ "success": false, "error": "OTP đã hết hạn, vui lòng đăng ký lại" }`
  * Sai mã OTP: `{ "success": false, "error": "Mã OTP không đúng" }`

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/users/verify-otp
Content-Type: application/json

{
  "email": "student@example.com",
  "otp": "123456"
}
```

---

## 3. POST /api/users/login

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/users/login`
* **Purpose**: Đăng nhập vào hệ thống bằng Email và Mật khẩu. Trả về JWT Access Token và Refresh Token.
* **Authentication**: `Public`
* **Roles**: Không yêu cầu

### Request Parameters
* **Headers**:
  ```http
  Content-Type: application/json
  ```
* **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "Password123"
  }
  ```

### Validation Rules
* `email`: Bắt buộc, email hợp lệ.
* `password`: Bắt buộc, tối thiểu 6 ký tự.

### Business Rules
* Kiểm tra email tồn tại trong DB.
* Bắt buộc tài khoản đã được xác thực (`isVerified === true`). Nếu chưa xác thực trả 400 Bad Request.
* So sánh bcrypt hash password.
* Sinh cặp Access Token (payload: `{ userId, role }` với role chữ thường) và Refresh Token.
* Băm `hashToken(refresh_token)` và lưu vào `users.refresh_token` trong PostgreSQL.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Login successfully !"
  }
  ```

### Error Responses
* **400 Bad Request**:
  * Email không tồn tại: `{ "errors": { "email": "Email không tồn tại" } }`
  * Chưa xác thực email: `{ "errors": { "email": "Vui lòng xác thực email trước khi đăng nhập" } }`
* **401 Unauthorized**:
  * Sai mật khẩu: `{ "success": false, "message": "Incorrect password" }`

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/users/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password123"
}
```

---

## 4. GET /api/users/me

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/users/me`
* **Purpose**: Lấy thông tin cá nhân của người dùng đang đăng nhập dựa trên token.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (`USER`, `TEACHER`, `ADMIN`)

### Headers
```http
Authorization: Bearer <ACCESS_TOKEN>
```

### Authorization Rules
* `userId` được trích xuất hoàn toàn từ JWT Access Token qua middleware `verifyAccessToken`.
* Không nhận bất kỳ tham số `userId` nào từ query/body.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Get user info successfully !",
    "data": {
      "id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
      "_id": "1b089c16-0be6-444f-9e7f-f7dcfbc3e9b1",
      "username": "minh_student",
      "email": "student@example.com",
      "status": "ACTIVE",
      "role": "user",
      "avatar": "",
      "phone": "0987654321",
      "bio": "Học viên TMDEMY",
      "socialLinks": {
        "facebook": "",
        "instagram": "",
        "github": ""
      },
      "isVerified": true,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```
> [!NOTE]
> Mật khẩu (`password`), `refreshToken`, `otpCode` và `resetPasswordToken` được loại bỏ hoàn toàn khỏi response data.

### Error Responses
* **401 Unauthorized**:
  * Thiếu header hoặc sai định dạng: `{ "success": false, "error": "Access Token is missing!" }`
  * Token hết hạn: `{ "success": false, "error": "jwt expired" }`
* **400 / 404 Not Found**:
  * Người dùng không tồn tại trong database: `{ "success": false, "message": "User not found" }`

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/users/me
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 5. POST /api/users/logout

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/users/logout`
* **Purpose**: Đăng xuất tài khoản, thu hồi và xóa Refresh Token trong database.
* **Authentication**: `Bearer JWT required`
* **Roles**: All

### Headers
```http
Authorization: Bearer <ACCESS_TOKEN>
```

### Business Rules
* Trích xuất `req.user.userId`.
* Cập nhật `users.refresh_token = null` trong PostgreSQL.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Logout successfully !"
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/users/logout
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 6. POST /api/users/forgot-password

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/users/forgot-password`
* **Purpose**: Gửi email chứa liên kết đặt lại mật khẩu cho người dùng quên mật khẩu.
* **Authentication**: `Public`
* **Roles**: Không yêu cầu

### Request Body
```json
{
  "email": "student@example.com"
}
```

### Validation Rules
* `email`: Bắt buộc, định dạng email hợp lệ.

### Business Rules
* Kiểm tra email có tồn tại trong hệ thống.
* Tạo `resetToken` ngẫu nhiên 32 bytes hex, lưu hash SHA-256 vào `users.reset_password_token` với thời hạn 15 phút.
* Gửi email chứa liên kết: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${email}`.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Reset password email sent  , please check your email !"
  }
  ```

### Error Responses
* **404 Not Found**:
  * Email không tồn tại: `{ "success": false, "message": "Email does not exist !" }`

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/users/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```

---

## 7. PUT /api/users/reset-password

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/users/reset-password`
* **Purpose**: Đặt lại mật khẩu mới thông qua `token` nhận từ email.
* **Authentication**: `Public`
* **Roles**: Không yêu cầu

### Request Body
```json
{
  "token": "a1b2c3d4e5f6...",
  "password": "NewPassword123",
  "confirm_password": "NewPassword123"
}
```

### Validation Rules
* `password`: Bắt buộc, tối thiểu 6 ký tự.
* `confirm_password`: Bắt buộc, tối thiểu 6 ký tự, phải khớp với `password`.

### Business Rules
* Băm `token` bằng SHA-256 và tìm kiếm user có `resetPasswordToken` trùng khớp và `resetPasswordExpires >= now`.
* Mã hóa mật khẩu mới bằng `bcryptjs`.
* Đặt lại `resetPasswordToken = null`, `resetPasswordExpires = null`, `refreshToken = null` (buộc đăng nhập lại trên mọi thiết bị).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Password reset successfully!"
  }
  ```

### Error Responses
* **400 Bad Request**:
  * Token không hợp lệ hoặc đã hết hạn: `{ "success": false, "message": "Invalid or expired reset token !" }`

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/users/reset-password
Content-Type: application/json

{
  "token": "4f9d8e7c6b5a...",
  "password": "NewPassword123",
  "confirm_password": "NewPassword123"
}
```

---

## 8. POST /api/users/access_token

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/users/access_token`
* **Purpose**: Cấp mới Access Token khi token cũ hết hạn bằng Refresh Token hợp lệ.
* **Authentication**: `Refresh Token required`
* **Roles**: All

### Request Body
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Business Rules
* Middleware `verifyRefreshToken` xác minh chữ ký JWT và thời hạn `exp` của refresh token.
* Trích xuất `req.user.userId`.
* Băm `hashToken(refresh_token)` và so sánh với giá trị trong database `users.refresh_token`.
* Nếu khớp, sinh Access Token mới.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Error Responses
* **401 Unauthorized**:
  * Thiếu refresh token: `{ "success": false, "message": "Refresh token is missing" }`
  * Refresh token hết hạn: `{ "success": false, "message": "Refresh token expired" }`
  * Token đã bị thu hồi hoặc không khớp DB: `{ "success": false, "message": "Refresh token không hợp lệ hoặc đã bị thu hồi" }`

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/users/access_token
Content-Type: application/json

{
  "refresh_token": "<YOUR_REFRESH_TOKEN>"
}
```

---

## 8. POST /api/users/google-login

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/users/google-login` (hoặc alias `/api/users/google`)
* **Purpose**: Đăng nhập hoặc tự động tạo tài khoản học viên thông qua xác thực tài khoản Google (OAuth 2.0 / OpenID Connect).
* **Authentication**: `Public`
* **Roles**: Không yêu cầu

### Request Parameters
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  * **Option 1 (ID Token / Credential)**:
    ```json
    {
      "idToken": "<GOOGLE_ID_TOKEN_JWT>"
    }
    ```
  * **Option 2 (Authorization Code)**:
    ```json
    {
      "code": "<GOOGLE_AUTH_CODE>",
      "redirectUri": "postmessage"
    }
    ```
  * **Option 3 (Access Token)**:
    ```json
    {
      "accessToken": "<GOOGLE_ACCESS_TOKEN>"
    }
    ```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Đăng nhập Google thành công !",
  "data": {
    "id": "uuid",
    "_id": "uuid",
    "username": "thaiminh",
    "email": "user@gmail.com",
    "role": "user",
    "avatar": "https://lh3.googleusercontent.com/...",
    "isVerified": true
  },
  "user": {
    "id": "uuid",
    "_id": "uuid",
    "username": "thaiminh",
    "email": "user@gmail.com",
    "role": "user",
    "avatar": "https://lh3.googleusercontent.com/...",
    "isVerified": true
  }
}
```

---

## Frontend Usage Notes
1. **Lưu trữ Tokens**: Lưu `access_token` trong cookie/memory và `refresh_token` trong secure cookie hoặc localStorage.
2. **Interceptor tự động Refresh Token**: Khi bất kỳ API nào trả về `401` với `error: "jwt expired"`, Axios/Fetch interceptor nên gọi ngay `POST /api/users/access_token` rồi tự động gửi lại request ban đầu.
3. **Role Check**: Sau khi đăng nhập, `role` trong payload Access Token hoặc `GET /api/users/me` là `user`, `teacher` hoặc `admin`.
4. **Google Login**: Xem tài liệu hướng dẫn tích hợp chi tiết tại [docs/api/GOOGLE_AUTH_INTEGRATION_GUIDE.md](file:///d:/e-learning_server/docs/api/GOOGLE_AUTH_INTEGRATION_GUIDE.md).
