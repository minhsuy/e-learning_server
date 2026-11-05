# TMDEMY — MESSAGE & REALTIME CHAT SPECIFICATION (MESSAGE_API.MD)

Tài liệu đặc tả API Lịch sử tin nhắn (REST HTTP) và Giao thức Chat thời gian thực qua **Socket.IO** (`src/socket/initSocket.ts`).

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. REST API: GET /api/messages/:conversationId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/messages/:conversationId`
* **Purpose**: Lấy danh sách toàn bộ tin nhắn trong một cuộc trò chuyện để hiển thị khi người dùng mở khung chat.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Bắt buộc phải là thành viên trong cuộc trò chuyện)

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `conversationId` | UUID | Yes | Mã cuộc trò chuyện cần lấy tin nhắn |

### Authorization & Security Rules
* Backend kiểm tra thành viên qua `isUserInConversation(conversationId, req.user.userId)`.
* Nếu người dùng không thuộc cuộc trò chuyện này -> trả về `403 Forbidden` (`You are not a participant in this conversation`).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "msg-uuid-1",
        "_id": "msg-uuid-1",
        "conversationId": "conv-uuid-1",
        "conversation": "conv-uuid-1",
        "senderId": "user-uuid-1",
        "sender": {
          "id": "user-uuid-1",
          "_id": "user-uuid-1",
          "username": "minh_student",
          "avatar": null
        },
        "content": "Thầy ơi cho em hỏi về bài 2.1 ạ",
        "type": "text",
        "isEdited": false,
        "createdAt": "2026-03-01T10:14:00.000Z",
        "updatedAt": "2026-03-01T10:14:00.000Z"
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/messages/conv-uuid-1
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 2. REALTIME SOCKET.IO SPECIFICATION

Chat trong TMDEMY sử dụng WebSocket thông qua **Socket.IO Server** (chạy chung cổng với HTTP Server tại `http://localhost:3002`).

### 2.1. Kết nối & Xác thực (Strict JWT Authentication)
Khi khởi tạo kết nối Socket.IO từ Frontend, Client **bắt buộc phải truyền Access Token**:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3002", {
  auth: {
    token: "<YOUR_ACCESS_TOKEN>" // Hoặc truyền qua header Authorization: Bearer <TOKEN>
  }
});
```

* Nếu thiếu token hoặc token hết hạn -> Socket connection bị từ chối với lỗi: `Authentication error: Access token required` / `Invalid or expired token`.
* Khi kết nối thành công: Socket tự động join vào phòng riêng của người dùng (`socket.join(String(userId))`).

---

### 2.2. Danh sách Socket Events

#### Event 1: Tham gia phòng chat (`join`)
* **Direction**: Client -> Server
* **Payload**: `conversationId` (string UUID)
* **Xử lý**: Server kiểm tra người dùng có phải là thành viên trong cuộc trò chuyện hay không trước khi cho phép vào phòng. Nếu không phải thành viên, emit `errorMessage: "Access denied to conversation"`.
* **Example**:
  ```javascript
  socket.emit("join", "conv-uuid-1");
  ```

#### Event 2: Gửi tin nhắn mới (`sendMessage`)
* **Direction**: Client -> Server
* **Payload**:
  ```json
  {
    "conversationId": "conv-uuid-1",
    "content": "Em đã hiểu bài rồi ạ, cảm ơn thầy!",
    "type": "text"
  }
  ```
  *(Các kiểu `type` hỗ trợ: `text`, `image`, `file`)*
* **Xử lý**:
  * Lưu tin nhắn vào PostgreSQL.
  * Cập nhật `lastMessageId` của conversation.
  * Phát tán event `receiveMessage` đến tất cả các thành viên đang trong phòng `conversationId`.
* **Event nhận (Server -> Client)**: `receiveMessage`
  ```json
  {
    "id": "msg-uuid-2",
    "conversationId": "conv-uuid-1",
    "sender": { "id": "uuid", "username": "minh_student" },
    "content": "Em đã hiểu bài rồi ạ, cảm ơn thầy!",
    "type": "text",
    "isEdited": false,
    "createdAt": "2026-03-01T10:20:00.000Z"
  }
  ```

#### Event 3: Chỉnh sửa tin nhắn (`editMessage`)
* **Direction**: Client -> Server
* **Payload**:
  ```json
  {
    "messageId": "msg-uuid-2",
    "content": "Nội dung sau khi sửa"
  }
  ```
* **Xử lý**: Kiểm tra người gọi phải là tác giả của tin nhắn. Cập nhật `isEdited = true` và phát tán event `messageEdited` đến phòng.

#### Event 4: Xóa tin nhắn (`deleteMessage`)
* **Direction**: Client -> Server
* **Payload**:
  ```json
  {
    "messageId": "msg-uuid-2"
  }
  ```
* **Xử lý**: Xóa tin nhắn khỏi DB, cập nhật lại `lastMessageId` của conversation và phát tán event `messageDeleted` kèm `{ messageId }`.

#### Event 5: Đang gõ văn bản (`typing` / `stopTyping`)
* **Direction**: Client -> Server
* **Payload**:
  ```json
  {
    "conversationId": "conv-uuid-1"
  }
  ```
* **Event nhận ở Client khác**: `userTyping` / `userStopTyping` kèm `{ userId, conversationId }`.
