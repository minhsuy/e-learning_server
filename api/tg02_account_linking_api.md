# TMdemy Telegram Teacher Bot — TG-02 Account Linking API Specification

**Version:** 1.0.0 (Account Linking & Authorization)  
**Target Audience:** Next.js Frontend Developers, Mobile Developers, Backend Engineers  
**Base URL:** `/api/teacher/telegram`  
**Authentication:** `Authorization: Bearer <accessToken>` (Role: `TEACHER`)  

---

## 1. Overview & Linking Flow

The **TMdemy Teacher Telegram Linking API** establishes a secure, 1-to-1 association between an authenticated TMdemy teacher and their personal Telegram account.

### End-to-End Linking Lifecycle
```
[ Next.js Teacher Portal ]
            │
            │ 1. Teacher clicks "Liên kết Telegram"
            │    POST /api/teacher/telegram/link-token
            ▼
[ TMdemy Backend ]
            │
            │ 2. Returns { token, deepLink, expiresAt, expiresInMinutes: 15 }
            ▼
[ Next.js Frontend ]
            │
            │ 3. Displays:
            │    - Direct CTA button: href={deepLink}
            │    - Manual token copy box: /link <token>
            │    - Starts polling: GET /api/teacher/telegram/status (every 3s)
            ▼
[ Telegram Client (Teacher) ]
            │
            │ 4. Opens Bot via Deep Link -> Sends /start link_<token>
            │    (Or manually types /link <token>)
            ▼
[ grammY Bot (Backend) ]
            │
            │ 5. Atomic transaction binds Telegram User ID to TMdemy Teacher
            │    Token consumed, TelegramAccount record created
            ▼
[ Next.js Teacher Portal (Poll detects isLinked === true) ]
            │
            │ 6. Automatically closes modal & shows "✅ Đã liên kết"
```

---

## 2. REST Endpoints Specification

### 2.1 Generate Linking Token & Deep Link
- **Method & Route:** `POST /api/teacher/telegram/link-token`
- **Access Level:** Private (`Authorization: Bearer <teacher_token>`)
- **Rate Limit:** 10 requests per 15-minute rolling window per teacher
- **Request Body:** None
- **Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "token": "4a7f9b2c8e1d5a3f7b0c9e2a4d8f1b6c3e7a9d0f2b4c8e1a5d9f3b7c0e2a4d8f",
    "deepLink": "https://t.me/tmdemy_bot?start=link_4a7f9b2c8e1d5a3f7b0c9e2a4d8f1b6c3e7a9d0f2b4c8e1a5d9f3b7c0e2a4d8f",
    "expiresAt": "2026-11-04T13:45:00.000Z",
    "expiresInMinutes": 15
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: Authenticated user does not possess `TEACHER` role.
  - `409 Conflict`: Teacher is already linked to a Telegram account (`Tài khoản Giảng viên đã được liên kết với một tài khoản Telegram. Vui lòng hủy liên kết trước khi tạo mã mới.`).
  - `429 Too Many Requests`: Rate limit exceeded.

---

### 2.2 Get Linking Status
- **Method & Route:** `GET /api/teacher/telegram/status`
- **Access Level:** Private (`Authorization: Bearer <teacher_token>`)
- **Request Body:** None
- **Response — Linked (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isLinked": true,
    "account": {
      "id": "e2f1b4a0-7c9d-4e8a-b123-456789abcdef",
      "userId": "018f3a2b-7c8d-4e9f-a012-3456789abcde",
      "telegramUserId": "123456789",
      "telegramChatId": "123456789",
      "telegramUsername": "prof_alex",
      "telegramFirstName": "Alex Rivers",
      "linkedAt": "2026-11-04T13:30:00.000Z",
      "updatedAt": "2026-11-04T13:30:00.000Z"
    }
  }
}
```
- **Response — Unlinked (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isLinked": false,
    "account": null
  }
}
```

---

### 2.3 Unlink Telegram Account
- **Method & Route:** `DELETE /api/teacher/telegram/unlink`
- **Access Level:** Private (`Authorization: Bearer <teacher_token>`)
- **Request Body:** None
- **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Hủy liên kết tài khoản Telegram thành công"
}
```
- **Error Responses:**
  - `404 Not Found`: Teacher has no linked Telegram account.

---

## 3. Telegram Bot Commands Specification

All commands must be executed in a **private 1-on-1 chat** with the Bot.

### 3.1 `/start link_<token>` (One-Click Deep Link)
- **Description:** Consumes the deep-link token and binds the teacher's Telegram ID in a single tap.
- **Success Response (Markdown):**
```text
🎉 *LIÊN KẾT TÀI KHOẢN THÀNH CÔNG!*

Chào mừng Giảng viên: *Alex Rivers*!
• Telegram User ID: `123456789`
• Trạng thái liên kết: ✅ Đã kích hoạt

Từ bây giờ, bạn có thể sử dụng các lệnh:
• /account - Xem thông tin tài khoản đã liên kết
• /unlink - Hủy liên kết tài khoản khi cần
• /help - Xem danh sách hướng dẫn sử dụng
```

### 3.2 `/link <token>` (Manual Binding)
- **Description:** Manually consumes a 64-character hexadecimal link token.
- **Syntax:** `/link 4a7f9b2c8e1d5a3f...`
- **Error Case (Invalid / Expired / Reused):**
```text
❌ *LIÊN KẾT TÀI KHOẢN THẤT BẠI*

Mã liên kết không tồn tại, đã được sử dụng hoặc đã hết hạn (thời hạn 15 phút).
```

### 3.3 `/account` (Profile Viewer)
- **Description:** Displays the verified teacher profile attached to the caller's Telegram numeric ID.
- **Response (Linked):**
```text
👤 *THÔNG TIN TÀI KHOẢN GIẢNG VIÊN ĐÃ LIÊN KẾT*

• Giảng viên: Alex Rivers
• Email: `a***s@domain.com`
• Vai trò hệ thống: TEACHER (Teacher)
• Trạng thái tài khoản: ✅ Đang hoạt động (ACTIVE)
• Telegram User ID: `123456789`
• Thời điểm liên kết: 20:30:00 04/11/2026
```

### 3.4 `/unlink` (Account Removal)
- **Description:** Initiates secure unlinking with an interactive inline keyboard.
- **Interactive UI:**
  - Button `[ ⚠️ Xác nhận hủy liên kết ]` (Callback `unlink_confirm`)
  - Button `[ ❌ Hủy bỏ ]` (Callback `unlink_cancel`)
- **Direct confirmation alternative:** `/unlink confirm`

---

## 4. Frontend Integration Guide (Next.js / React)

### 4.1 React Hook Example (`useTeacherTelegram.ts`)
```typescript
import { useState, useEffect } from 'react'

export function useTeacherTelegram() {
  const [status, setStatus] = useState<{ isLinked: boolean; account: any } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    const res = await fetch('/api/teacher/telegram/status', {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    })
    const data = await res.json()
    if (data.success) setStatus(data.data)
  }

  const createLinkToken = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/telegram/link-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` }
      })
      return await res.json()
    } finally {
      setLoading(false)
    }
  }

  const unlink = async () => {
    const res = await fetch('/api/teacher/telegram/unlink', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    })
    const data = await res.json()
    if (data.success) fetchStatus()
    return data
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return { status, loading, fetchStatus, createLinkToken, unlink }
}
```

### 4.2 Auto-Polling During Linking Modal
While the modal with the "Mở Bot Telegram" button is open:
```typescript
useEffect(() => {
  if (!isModalOpen || status?.isLinked) return
  const interval = setInterval(async () => {
    await fetchStatus()
  }, 3000)
  return () => clearInterval(interval)
}, [isModalOpen, status?.isLinked])
```
When `status.isLinked` transitions to `true`, close the modal and display a success notification.

