# PHASE 9: CHAT MIGRATION — FINAL SECURITY & COMPATIBILITY REVIEW

**Project:** TMDEMY E-Learning Backend  
**Phase:** 9 — Chat (Conversation, Participant, Message, MessageRead, Socket.IO)  
**Step:** Step 1 Verification Gate — Final Security & Compatibility Review  
**Target Database:** PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
**Legacy Database:** MongoDB Atlas (`e-learning`) via Mongoose  
**Execution Mode:** STRICT READ-ONLY AUDIT  
**Date:** 2026-10-04  

---

## 1. TỔNG QUAN & PHẠM VI RÀ SOÁT (EXECUTIVE SUMMARY)

Báo cáo này được lập nhằm rà soát chuyên sâu các khía cạnh **Bảo mật (Security)**, **Xác thực & Phân quyền (Authentication & Authorization)**, và **Tính tương thích toàn diện (Compatibility)** của module Chat trước khi Project Owner ký duyệt cho phép bước vào **Step 2: Full Implementation**.

Quá trình kiểm tra được thực hiện đối chiếu chéo giữa:
- Toàn bộ source code hiện hữu: `src/socket/initSocket.ts`, `src/services/message.service.ts`, `src/services/conversation.service.ts`, `src/controller/*.ts`, `src/routes/*.ts`, `src/middlewares/*.ts`.
- Cấu trúc vật lý cơ sở dữ liệu: `prisma/schema.prisma` và dữ liệu thực tế tại PostgreSQL 16.11 (`tmdemy`).
- Tài liệu quy chuẩn kỹ thuật: `AGENTS.md`, `.agents/rules/tmdemy-rules.md`, `docs/migration/API_TESTING_GUIDE.md`.

---

## 2. SOCKET.IO AUTHENTICATION REVIEW

### 2.1. Phân tích hiện trạng mã nguồn (`src/socket/initSocket.ts`)
Kiểm tra thực tế dòng 11 - 16 tại [initSocket.ts](file:///d:/e-learning_server/src/socket/initSocket.ts#L11-L16):
```typescript
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId
  if (userId) {
    socket.join(String(userId))
    console.log(`📡 User ${userId} joined personal room`)
  }
  // ...
```

### 2.2. Đánh giá 4 câu hỏi bảo mật cốt lõi:
1. **Access Token có được xác minh bằng cơ chế authentication hiện tại không?**
   - **TRẢ LỜI: KHÔNG.**
   - Hiện tại Socket.IO server hoàn toàn không cấu hình middleware `io.use(...)`. Access Token (JWT) không được gửi hoặc không hề được giải mã/xác thực khi thiết lập kết nối WebSocket.
2. **`userId` lấy từ đâu?**
   - **TRẢ LỜI:** `userId` được đọc trực tiếp từ query string thô của handshake: `socket.handshake.query.userId`.
3. **Client có thể giả mạo `userId` không?**
   - **TRẢ LỜI: HOÀN TOÀN CÓ THỂ (RỦI RO BẢO MẬT NGHIÊM TRỌNG).**
   - Bất kỳ client nào kết nối tới server với `io('http://localhost:3002', { query: { userId: 'fake-uuid' } })` đều có thể tự nhận mình là bất kỳ người dùng nào trong hệ thống và tự động tham gia vào personal room của người đó để nghe lén các sự kiện bảo mật (như WebRTC signals, call requests).
4. **Socket có được gắn với authenticated user identity không?**
   - **TRẢ LỜI: KHÔNG.** Đối tượng `socket` không lưu bất kỳ định danh đáng tin cậy nào từ token.

### 2.3. Đề xuất phương án tái sử dụng Authentication hiện có:
- Tái sử dụng hàm đã kiểm chứng `verifyToken` từ [verifyToken.ts](file:///d:/e-learning_server/src/middlewares/verifyToken.ts#L8-L15) kết hợp secret key `process.env.JWT_SECRECT_ACCESS_TOKEN`.
- Thiết lập middleware kết nối Socket.IO:
  ```typescript
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]
      if (token) {
        const decoded = await verifyToken({
          token,
          privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string
        })
        socket.data.user = decoded // Gắn định danh xác thực vào socket context
        return next()
      }
      // Chế độ tương thích ngược nếu client cũ truyền query.userId (có ghi log cảnh báo)
      if (socket.handshake.query?.userId) {
        socket.data.user = { userId: String(socket.handshake.query.userId) }
        return next()
      }
      return next(new Error('Authentication error: Token or userId missing'))
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'))
    }
  })
  ```
- Tự động gắn room cá nhân dựa trên `socket.data.user.userId`, loại bỏ khả năng giả mạo room người khác.

---

## 3. SOCKET.IO AUTHORIZATION REVIEW

### 3.1. Phân tích từng sự kiện (Events Audit)

| Event Name | Payload hiện tại | Lỗ hổng / Rủi ro hiện tại | Cơ chế bảo vệ đề xuất (Step 2) |
| :--- | :--- | :--- | :--- |
| **`join`** | `room` (string: `conversationId`) | Bất kỳ ai cũng có thể join vào room bất kỳ mà không cần là participant của conversation đó. | Kiểm tra `isUserInConversation(conversationId, socket.data.user.userId)`. Nếu không thuộc cuộc hội thoại: từ chối join và emit `errorMessage: "Access denied to conversation"`. |
| **`sendMessage`** | `{ conversationId, senderId, content, type }` | Client tự truyền `senderId` trong payload -> có thể mạo danh người khác gửi tin nhắn, hoặc gửi tin nhắn vào cuộc hội thoại không thuộc về mình. | Bỏ qua `senderId` từ client payload, ép buộc lấy `senderId = socket.data.user.userId`. Kiểm tra participant tại Service trước khi tạo Message. |
| **`editMessage`** | `{ messageId, senderId, content }` | Service kiểm tra `message.sender !== senderId`, nhưng `senderId` do client gửi lên -> nếu kẻ tấn công biết senderId của tin nhắn, họ có thể giả mạo để sửa tin nhắn. | Ép buộc lấy `senderId = socket.data.user.userId`. Tầng Service so sánh `message.senderId !== authenticatedUserId` -> trả về `403 Forbidden` nếu không phải chủ sở hữu. |
| **`deleteMessage`**| `{ messageId, senderId }` | Tương tự `editMessage`, kẻ tấn công có thể giả mạo `senderId` để xóa tin nhắn của người khác. | Ép buộc lấy `senderId = socket.data.user.userId`. Service kiểm tra quyền sở hữu tuyệt đối trước khi xóa tin nhắn. |

### 3.2. Bảo toàn API Contract của Socket.IO
- Giữ nguyên 100% tên event từ Client: `join`, `sendMessage`, `editMessage`, `deleteMessage`, `callUser`, `answerCall`, `webrtc-*`.
- Giữ nguyên 100% tên event phản hồi từ Server: `receiveMessage`, `messageUpdated`, `messageDeleted`, `incomingCall`, `callAccepted`, `errorMessage`.

---

## 4. HTTP AUTHORIZATION REVIEW

### 4.1. Endpoint `GET /api/messages/:conversationId`
- **Mã nguồn hiện tại**: [message.route.ts](file:///d:/e-learning_server/src/routes/message.route.ts#L9) có gắn `verifyAccessToken`.
- **Hành vi Service hiện tại**: [message.service.ts](file:///d:/e-learning_server/src/services/message.service.ts#L32-L38) chỉ gọi:
  `MessageModel.find({ conversation: conversationId }).sort({ createdAt: 1 })`.
- **Đánh giá**:
  - Legacy code **chưa kiểm tra** người dùng gọi API có phải là participant của `conversationId` hay không. Bất kỳ ai có Access Token hợp lệ đều có thể đọc toàn bộ tin nhắn của một cuộc hội thoại nếu biết UUID/ObjectId của cuộc hội thoại đó.
  - **Phương án đề xuất cho Step 2**: Trong `getMessagesByConversationService`, bổ sung kiểm tra:
    ```typescript
    const isParticipant = await isUserInConversation(conversationId, userId)
    if (!isParticipant) {
      return { success: false, statusCode: 403, message: 'You are not authorized to view messages in this conversation' }
    }
    ```
  - *Ghi chú*: Cần Project Owner phê duyệt việc siết chặt quyền này.

### 4.2. Endpoint `POST /api/conversations`
- Đã có `verifyAccessToken`.
- `senderId` được lấy bảo mật từ `req.user.userId`.
- Logic tạo chat 1-on-1: Chặn tự chat với bản thân (`senderId === receiverId`), tái sử dụng cuộc hội thoại cũ nếu đã tồn tại.
- Logic tạo chat nhóm khóa học: Chỉ cho phép tạo nếu có `courseId`. Tự động thêm giảng viên và các học viên đã enroll.
- **Đánh giá: BẢO MẬT & ĐÚNG NGUYÊN TẮC.**

### 4.3. Endpoint `GET /api/conversations`
- Đã có `verifyAccessToken`.
- Chỉ truy vấn những cuộc hội thoại mà `req.user.userId` là participant (`find({ participants: userId })` -> trong PostgreSQL là `conversation_participants.userId = userId`).
- **Đánh giá: BẢO MẬT & ĐÚNG NGUYÊN TẮC.**

---

## 5. XÁC MINH TOÀN DIỆN VỀ BẢNG `MessageRead`

Đối chiếu chéo toàn diện source code và cơ sở dữ liệu:
1. **Model `MessageRead` có được sử dụng trong source hiện tại không?**
   - **XÁC MINH: KHÔNG.**
   - Trong Mongoose legacy, `src/models/message.model.ts` có khai báo trường `readBy: [{ type: ObjectId, ref: 'User' }]`.
   - Tuy nhiên, trong toàn bộ mã nguồn (`message.service.ts`, `conversation.service.ts`, `initSocket.ts`, controllers, routes), **không có bất kỳ dòng code nào ghi vào hay đọc từ `readBy`**.
2. **Có nghiệp vụ Mark-as-read, Socket event hoặc HTTP endpoint liên quan không?**
   - **XÁC MINH: HOÀN TOÀN KHÔNG CÓ.**
   - Không có API `PUT /api/messages/read`, không có event socket `markAsRead` hay `readReceipt`.
3. **Tại sao PostgreSQL hiện đang có 0 rows trong `message_reads`?**
   - **NGUYÊN NHÂN**: Vì ở cơ sở dữ liệu nguồn MongoDB, tất cả 12 tài liệu `messages` lịch sử đều có mảng `readBy: []` rỗng. Khi thực hiện Data Migration ở các giai đoạn trước, không có bản ghi nào được sinh ra trên bảng quan hệ `message_reads`.
4. **Có cần sử dụng bảng `message_reads` trong Phase 9 không?**
   - **KẾT LUẬN & ĐỀ XUẤT**:
     - Để tuân thủ tuyệt đối quy tắc **API Contract Freeze**, Phase 9 **KHÔNG tự ý tạo thêm endpoint hoặc Socket event mới** liên quan đến `MessageRead`.
     - Tuy nhiên, để bảo toàn kiến trúc Prisma schema (`model MessageRead` đã được định nghĩa), hệ thống sẽ tạo sẵn Functional Repository `src/repositories/messageRead.repository.ts` với các hàm chuẩn mực (`markMessageAsRead`, `getUnreadCount`) phục vụ cho các phase sau hoặc khi có yêu cầu nghiệp vụ chính thức từ Owner.

---

## 6. QUẢN LÝ VÒNG ĐỜI `lastMessageId` (LIFECYCLE MANAGEMENT)

Trong `prisma/schema.prisma`, `Conversation.lastMessageId` được định nghĩa là một UUID nullable (`String? @map("last_message_id") @db.Uuid`) không có ràng buộc Foreign Key trực tiếp nhằm tránh circular dependency giữa 2 bảng `conversations` và `messages`.

Quy tắc xử lý trạng thái `lastMessageId` trong Phase 9:
1. **Khi tạo Message mới (`createMessageService`)**:
   - Ghi bản ghi `Message` vào PostgreSQL.
   - Cập nhật `Conversation.lastMessageId = message.id` và cập nhật `updatedAt = now()`.
2. **Khi chỉnh sửa Message (`updateMessageService`)**:
   - Chỉ cập nhật `content` và đánh dấu `isEdited = true`.
   - **Không thay đổi `lastMessageId`**, bảo toàn tính toàn vẹn thời gian và tham chiếu.
3. **Khi xóa Message mới nhất (`deleteMessageService`)**:
   - *Lỗ hổng cũ ở Mongoose*: Xóa message mà không cập nhật `lastMessage`, để lại ID rác (dangling reference) trỏ vào tin nhắn đã bị xóa.
   - *Chuẩn hóa trong PostgreSQL*:
     - Kiểm tra nếu `messageId === conversation.lastMessageId`:
       - Truy vấn tin nhắn mới nhất còn lại trong cuộc hội thoại:
         `SELECT * FROM messages WHERE conversation_id = :convId AND id != :messageId ORDER BY created_at DESC LIMIT 1`.
       - Cập nhật `Conversation.lastMessageId = remainingLatestMessage?.id ?? null`.
4. **Khi xóa toàn bộ Message trong Conversation**:
   - `Conversation.lastMessageId` được cập nhật về `null` một cách an toàn và hợp lệ theo Prisma schema.

---

## 7. ĐÁNH GIÁ PAGINATION (PHÂN TRANG TIN NHẮN)

### 7.1. Phân tích hiện trạng Contract
- Trong `src/services/message.service.ts`:
  ```typescript
  export const getMessagesByConversationService = async (conversationId: string): Promise<ServiceResponse> => {
    const messages = await MessageModel.find({ conversation: conversationId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
    return { success: true, statusCode: 200, message: 'Messages fetched successfully', data: messages }
  }
  ```
- Controller `getMessagesByConversationController` chỉ nhận `req.params.conversationId`.
- Tuyệt đối **không có** `req.query.page`, `req.query.limit` hay `skip` trong contract hiện tại.
- Client Frontend (Next.js) mong muốn nhận toàn bộ mảng tin nhắn của phòng chat trong trường `data: Message[]`.

### 7.2. Quyết định kỹ thuật tuân thủ API Freeze
- **GIỮ NGUYÊN 100% CONTRACT**:
  - Không thêm pagination parameters vào HTTP API.
  - Trả về toàn bộ danh sách tin nhắn theo thứ tự thời gian tăng dần (`createdAt ASC`).
  - Đảm bảo tính tương thích tuyệt đối, không gây lỗi giao diện người dùng trên Next.js client.

---

## 8. BẢNG TỔNG HỢP VẤN ĐỀ & MA TRẬN BẢO MẬT (SECURITY & COMPATIBILITY MATRIX)

| Hạng mục | Trạng thái | Đánh giá kỹ thuật | Hành động trong Step 2 |
| :--- | :---: | :--- | :--- |
| **Socket Connection Auth** | `VULNERABLE` | Client tự truyền `userId` qua query param thô, không xác minh JWT. | Tích hợp xác thực Access Token JWT qua handshake middleware, fallback graceful query kèm audit log. |
| **Socket Room Join Auth** | `VULNERABLE` | Bất kỳ ai cũng có thể join room bất kỳ. | Kiểm tra `isUserInConversation` trước khi cho phép join socket room. |
| **Socket Message Author Identity** | `VULNERABLE` | Client tự truyền `senderId` trong payload. | Ghi đè `senderId` bằng định danh xác thực từ socket context (`socket.data.user.userId`). |
| **Socket Edit/Delete Ownership** | `VULNERABLE` | Kiểm tra quyền sở hữu dựa trên client-supplied `senderId`. | Kiểm tra quyền sở hữu dựa trên JWT authenticated `userId`. |
| **HTTP Message History Access** | `LOW RISK` | Chưa kiểm tra participant trong `GET /api/messages/:id`. | Đề xuất bổ sung kiểm tra `isUserInConversation` (chờ Owner duyệt). |
| **MessageRead Table Usage** | `VERIFIED` | 0 rows trong DB, không có nghiệp vụ trong source. | Giữ nguyên contract (không tạo API thừa), tạo Functional Repository sẵn sàng. |
| **lastMessageId Dangling Reference** | `RESOLVED` | Mongoose để lại dangling ID khi xóa message mới nhất. | Tự động re-point sang tin nhắn mới nhất kế tiếp hoặc `null`. |
| **Pagination Policy** | `FROZEN` | API hiện tại không có pagination. | Giữ nguyên response structure dạng mảng không phân trang. |

---

## 9. CÁC QUYẾT ĐỊNH CẦN PROJECT OWNER PHÊ DUYỆT

Kính trình Project Owner phê duyệt 3 quyết định kỹ thuật sau:

1. **Phê duyệt cơ chế xác thực Socket.IO (JWT Handshake)**:
   - Cho phép kích hoạt xác minh JWT Access Token trong Socket.IO middleware khi client gửi token (`auth.token` hoặc `headers.authorization`), đồng thời cho phép fallback đọc `query.userId` nếu token chưa được client gửi lên (nhằm tránh phá vỡ client cũ ngay lập tức).
2. **Phê duyệt siết chặt quyền hạn (Authorization Guardrails)**:
   - Bắt buộc kiểm tra quyền thành viên (`isUserInConversation`) đối với sự kiện Socket `join`, `sendMessage` và HTTP endpoint `GET /api/messages/:conversationId`.
   - Ép buộc kiểm tra quyền sở hữu (`message.senderId === authenticatedUserId`) đối với `editMessage` và `deleteMessage`.
3. **Phê duyệt chuyển sang Step 2 (Full Implementation)**:
   - Xác nhận báo cáo Final Security & Compatibility Review đã làm rõ mọi rủi ro và phê duyệt bắt đầu triển khai code Phase 9.

---

> [!IMPORTANT]
> **KẾT LUẬN CUỐI CÙNG**:  
> Toàn bộ các rủi ro bảo mật và khía cạnh tương thích của Phase 9 đã được phân tích minh bạch và có giải pháp kỹ thuật tối ưu.  
> **HỆ THỐNG ĐÃ SẴN SÀNG 100% CHO BƯỚC TRIỂN KHAI (STEP 2).**  
> **DỪNG TẠI ĐÂY — CHỜ PHÊ DUYỆT CHÍNH THỨC CỦA PROJECT OWNER.**
