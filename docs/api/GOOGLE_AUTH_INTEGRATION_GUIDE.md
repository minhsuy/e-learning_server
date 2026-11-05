# BÁO CÁO TÍNH NĂNG VÀ HƯỚNG DẪN TÍCH HỢP GOOGLE LOGIN (FRONTEND INTEGRATION GUIDE)

> **Tài liệu bàn giao chức năng**: Đăng nhập và Đăng ký tự động qua Google OAuth2 / OpenID Connect cho hệ thống **TMDEMY E-Learning Backend**.

---

## 1. TỔNG QUAN VỀ TÍNH NĂNG ĐÃ TRIỂN KHAI

Hệ thống đã triển khai hoàn tất module xác thực thông qua tài khoản Google với các chuẩn mực kỹ thuật cao nhất:

1. **Tuân thủ Kiến trúc phân tầng TMDEMY (Clean & Functional Architecture)**:
   - **Router** (`src/routes/user.route.ts`): Cung cấp 2 endpoint: `POST /api/users/google-login` và alias `POST /api/users/google`.
   - **Middleware / Validator** (`src/middlewares/user.middleware.ts`): Sử dụng `googleLoginValidator` và `handleValidationErrors` để kiểm tra tính hợp lệ của payload từ Client.
   - **Controller** (`src/controller/user.controller.ts`): `googleLoginController` tiếp nhận yêu cầu, điều phối Service và trả HTTP Response chuẩn mực.
   - **Service** (`src/services/user.service.ts`): `loginWithGoogleService` xử lý toàn bộ logic nghiệp vụ (xác thực token từ Google, kiểm tra tài khoản, đăng ký mới, cập nhật email verified, phát hành Access Token & Refresh Token).
   - **Application Model** (`src/models/user.model.ts`): Định nghĩa `googleLoginInputSchema` và type `GoogleLoginInput` thông qua Zod 3.x.
   - **Google Auth Utility** (`src/utils/googleAuth.ts`): Sử dụng API `fetch` native của Node.js để kết nối với Google OAuth servers mà không cần cài đặt thêm package ngoài (bảo vệ tuyệt đối quy tắc đóng băng dependency).

2. **Cơ chế xử lý thông minh (Smart Auth Flow)**:
   - **Người dùng mới (First-time user)**:
     - Tự động trích xuất `email`, `name`, `avatar` từ Google profile.
     - Tạo `username` an toàn (chuẩn hóa alphanumeric, kiểm tra trùng lặp và tự động gắn hậu tố nếu cần).
     - Tạo mật khẩu ngẫu nhiên độ an toàn cao (`crypto.randomBytes(32)` hashed qua `bcryptjs`) để thỏa mãn ràng buộc database.
     - Gán vai trò mặc định: `USER`, trạng thái `ACTIVE`.
     - Tự động đánh dấu `isVerified: true` (vì tài khoản Google đã được Google xác thực email).
     - Tạo tài khoản trong PostgreSQL qua Functional Repository (`addUser`).
     - Phát sinh bộ đôi `access_token` (JWT 1 giờ) và `refresh_token` (JWT 7 ngày, lưu bản băm SHA-256 vào DB).
   - **Người dùng đã tồn tại (Existing user)**:
     - Kiểm tra trạng thái: Nếu tài khoản đang bị khóa (`INACTIVE`), trả về lỗi `403 Forbidden`.
     - Nếu tài khoản trước đó đăng ký thường chưa xác thực OTP, hệ thống tự động đánh dấu `isVerified: true`.
     - Nếu tài khoản chưa có ảnh đại diện, tự động cập nhật avatar lấy từ Google.
     - Phát sinh bộ đôi token mới, cập nhật `refresh_token` vào database và đăng nhập ngay lập tức.

---

## 2. DANH SÁCH API ENDPOINTS CHO FRONTEND

| Endpoint | Method | Quyền | Mục đích |
| :--- | :--- | :--- | :--- |
| `/api/users/google-login` | `POST` | Public | Đăng nhập / Đăng ký tự động bằng Google Credentials |
| `/api/users/google` | `POST` | Public | Endpoint Alias (giữ tương thích với các frontend routes rút gọn) |

*Base URL*: `http://localhost:3002` (hoặc URL server production)

---

## 3. CHI TIẾT REQUEST & RESPONSE

### 3.1. Headers
```http
Content-Type: application/json
```

### 3.2. Request Payload (Hỗ trợ 3 cách gửi linh hoạt cho Frontend)

Backend được thiết kế để tương thích với **toàn bộ các thư viện và cơ chế đăng nhập Google phổ biến hiện nay**:

#### Cách 1: Sử dụng ID Token / Credential (Khuyên dùng cho React / Next.js với `@react-oauth/google`)
Đây là chuẩn của **Google Identity Services (GIS)** hoặc `<GoogleLogin />` component. Google trả về một chuỗi JWT ID Token trong `credentialResponse.credential`:

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4N..."
}
```
*(Backend cũng chấp nhận các key tương đương: `credential`, `id_token`, hoặc `token`)*

#### Cách 2: Sử dụng Authorization Code Flow
Phù hợp khi Frontend dùng `useGoogleLogin({ flow: 'auth-code' })`:

```json
{
  "code": "4/0AdQt8q...",
  "redirectUri": "postmessage"
}
```
*(Nếu popup thì `redirectUri` mặc định là `"postmessage"`, nếu redirect thì truyền URL callback)*

#### Cách 3: Sử dụng Access Token
Phù hợp khi Frontend dùng OAuth token thông thường:

```json
{
  "accessToken": "ya29.a0AfH6SM..."
}
```

---

### 3.3. Response Mẫu

#### A. Thành công (HTTP Status: `200 OK`)
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Đăng nhập Google thành công !",
  "data": {
    "id": "eca9d49f-3873-49d0-b727-705f135ab870",
    "_id": "eca9d49f-3873-49d0-b727-705f135ab870",
    "username": "thaiminh",
    "email": "thaiminhgotthedope@gmail.com",
    "status": "ACTIVE",
    "role": "user",
    "avatar": "https://lh3.googleusercontent.com/a/ACg8ocL...",
    "phone": null,
    "bio": null,
    "isVerified": true,
    "socialLinks": {
      "facebook": "",
      "instagram": "",
      "github": ""
    },
    "createdAt": "2026-10-21T10:45:00.000Z",
    "updatedAt": "2026-10-21T10:45:00.000Z"
  },
  "user": {
    "id": "eca9d49f-3873-49d0-b727-705f135ab870",
    "_id": "eca9d49f-3873-49d0-b727-705f135ab870",
    "username": "thaiminh",
    "email": "thaiminhgotthedope@gmail.com",
    "status": "ACTIVE",
    "role": "user",
    "avatar": "https://lh3.googleusercontent.com/a/ACg8ocL...",
    "phone": null,
    "bio": null,
    "isVerified": true,
    "socialLinks": {
      "facebook": "",
      "instagram": "",
      "github": ""
    },
    "createdAt": "2026-10-21T10:45:00.000Z",
    "updatedAt": "2026-10-21T10:45:00.000Z"
  }
}
```
> [!NOTE]
> Response cung cấp cả `data` và `user` (alias của nhau), đồng thời cung cấp cả `id` và `_id` để Frontend Next.js / React có thể binding ngay lập tức mà không cần gọi thêm API `/api/users/me`.

#### B. Lỗi Validation (HTTP Status: `400 Bad Request`)
Khi Frontend không gửi bất kỳ token hay code nào:
```json
{
  "errors": {
    "": "Google credential (idToken / credential / code / accessToken) is required"
  }
}
```

#### C. Lỗi Token không hợp lệ hoặc hết hạn (HTTP Status: `400 Bad Request`)
Khi Google từ chối token:
```json
{
  "success": false,
  "message": "Google ID Token không hợp lệ hoặc đã hết hạn"
}
```

#### D. Tài khoản bị vô hiệu hóa (HTTP Status: `403 Forbidden`)
Khi người dùng bị Admin khóa tài khoản:
```json
{
  "success": false,
  "message": "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động"
}
```

---

## 4. HƯỚNG DẪN CODE MẪU CHO FRONTEND (REACT / NEXT.JS)

### 4.1. Cách Khuyên Dùng (Sử dụng `@react-oauth/google`)

#### Bước 1: Cài đặt thư viện trên Frontend
```bash
npm install @react-oauth/google
# hoặc
yarn add @react-oauth/google
```

#### Bước 2: Bọc ứng dụng trong `GoogleOAuthProvider`
Trong `App.tsx` (React) hoặc `layout.tsx` / `_app.tsx` (Next.js):

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = '390549866441-5lj602nm7k92b010eft62vi5me9u6bk6.apps.googleusercontent.com'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  )
}
```

#### Bước 3: Thêm nút bấm đăng nhập với Google (ID Token Flow)
Tạo component `GoogleLoginButton.tsx`:

```tsx
import React from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

export const GoogleLoginButton: React.FC = () => {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await fetch('http://localhost:3002/api/users/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(result.message || 'Đăng nhập Google thất bại!')
        return
      }

      // Lưu tokens vào localStorage hoặc Cookie
      localStorage.setItem('access_token', result.access_token)
      localStorage.setItem('refresh_token', result.refresh_token)
      localStorage.setItem('user', JSON.stringify(result.user))

      alert('Đăng nhập Google thành công!')
      // Chuyển hướng người dùng về trang chủ hoặc dashboard
      window.location.href = '/'
    } catch (error) {
      console.error('Lỗi kết nối tới server:', error)
      alert('Không thể kết nối đến máy chủ!')
    }
  }

  const handleError = () => {
    console.error('Đăng nhập Google phía Client bị hủy hoặc lỗi')
  }

  return (
    <div className="flex justify-center my-4">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap // Bật tính năng Google One Tap popup mượt mà
      />
    </div>
  )
}
```

---

### 4.2. Cách 2: Tùy biến nút bấm với Hook `useGoogleLogin` (Code Flow)

Nếu Frontend muốn tự thiết kế giao diện nút bấm riêng biệt:

```tsx
import React from 'react'
import { useGoogleLogin } from '@react-oauth/google'

export const CustomGoogleLoginButton: React.FC = () => {
  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const response = await fetch('http://localhost:3002/api/users/google-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: codeResponse.code,
            redirectUri: 'postmessage'
          })
        })

        const result = await response.json()

        if (response.ok && result.success) {
          localStorage.setItem('access_token', result.access_token)
          localStorage.setItem('refresh_token', result.refresh_token)
          window.location.href = '/'
        } else {
          alert(result.message || 'Lỗi xác thực Google')
        }
      } catch (err) {
        console.error(err)
      }
    },
    onError: (errorResponse) => console.error(errorResponse)
  })

  return (
    <button
      onClick={() => login()}
      className="btn btn-outline flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm hover:bg-gray-50"
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google"
        className="w-5 h-5"
      />
      <span>Đăng nhập với Google</span>
    </button>
  )
}
```

---

## 5. THIẾT LẬP AUTHORIZATION HEADER CHO CÁC API TIẾP THEO

Sau khi nhận được `access_token`, các request tiếp theo cần được đính kèm vào Header `Authorization`:

```javascript
fetch('http://localhost:3002/api/users/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
```

Khi `access_token` hết hạn (sau 1 giờ), Frontend gọi API refresh token:
```javascript
fetch('http://localhost:3002/api/users/access_token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refresh_token')
  })
})
```

---

## 6. DANH SÁCH FILE THAY ĐỔI & THÊM MỚI

1. **`src/utils/googleAuth.ts`** *(Mới)*: Module xác thực Google Token, Auth Code, Access Token thông qua Google APIs.
2. **`src/models/user.model.ts`** *(Cập nhật)*: Bổ sung Zod Schema `googleLoginInputSchema` và type `GoogleLoginInput`.
3. **`src/middlewares/user.middleware.ts`** *(Cập nhật)*: Bổ sung `googleLoginValidator`.
4. **`src/services/user.service.ts`** *(Cập nhật)*: Bổ sung nghiệp vụ `loginWithGoogleService`.
5. **`src/controller/user.controller.ts`** *(Cập nhật)*: Bổ sung `googleLoginController`.
6. **`src/routes/user.route.ts`** *(Cập nhật)*: Đăng ký endpoint `POST /api/users/google-login` và alias `POST /api/users/google`.
7. **`docs/api/GOOGLE_AUTH_INTEGRATION_GUIDE.md`** *(Mới)*: Tài liệu kỹ thuật bàn giao cho Frontend Team.

---

## 7. KẾT QUẢ KIỂM THỬ (TEST VERIFICATION)

Hệ thống đã được kiểm thử toàn diện với kết quả:
- **Test 1 - Missing Credentials**: Trả về `400 Bad Request` kèm thông báo lỗi rõ ràng.
- **Test 2 - Invalid Google Token**: Gọi Google API xác thực và trả về `400 Bad Request` an toàn.
- **Test 3 - First-Time Google Signup**: Tự động tạo bản ghi trong bảng `User` (PostgreSQL), kích hoạt `isVerified = true`, mã hóa mật khẩu an toàn và phát hành `access_token` + `refresh_token`.
- **Test 4 - Existing User Login**: Tìm thấy người dùng hiện có theo email, kích hoạt tài khoản nếu chưa kích hoạt, phát hành tokens và đăng nhập thành công.
- **TypeScript Typecheck**: Code mới viết và refactor đạt chuẩn TypeScript strict mode, 0 lỗi kiểu dữ liệu.
