# TÀI LIỆU CHỐT THIẾT KẾ SCHEMA (FINAL SCHEMA DECISIONS)

> **Giai đoạn**: FINALIZE SCHEMA DESIGN (Hoàn tất chuẩn hóa Schema trước khi migrate dữ liệu)  
> **Tài liệu căn cứ**:  
> - [MIGRATION_CONTEXT.md](file:///d:/e-learning_server/MIGRATION_CONTEXT.md)  
> - [DATABASE_ANALYSIS.md](file:///d:/e-learning_server/DATABASE_ANALYSIS.md)  
> - [POSTGRES_SCHEMA_DESIGN.md](file:///d:/e-learning_server/POSTGRES_SCHEMA_DESIGN.md)  
> - [SCHEMA_REVIEW.md](file:///d:/e-learning_server/SCHEMA_REVIEW.md)  
> - [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma)  
> **Trạng thái Prisma Schema**: Đã format và validate hợp lệ (`The schema at prisma\schema.prisma is valid 🚀`).

---

## 1. CÁC QUYẾT ĐỊNH ĐÃ ĐƯỢC CHỐT (CONFIRMED DECISIONS)

### 1.1. `User -> Enrollment`: Chuyển sang `onDelete: Restrict`
- **Thay đổi**:
  ```prisma
  // model Enrollment
  user   User   @relation(fields: [userId], references: [id], onDelete: Restrict)
  ```
- **Mục tiêu & Lý do**:
  - Không cho phép hành vi xóa User làm xóa dây chuyền (cascade delete) dữ liệu ghi danh học tập (`enrollments`).
  - Bảo vệ lịch sử học viên và bằng chứng sở hữu khóa học của người học.

### 1.2. `User -> QuizSubmission`: Chuyển sang `onDelete: Restrict`
- **Thay đổi**:
  ```prisma
  // model QuizSubmission
  user    User   @relation(fields: [userId], references: [id], onDelete: Restrict)
  ```
- **Mục tiêu & Lý do**:
  - Bảo vệ tuyệt đối bảng điểm, câu trả lời bài thi và tỷ lệ làm bài của học viên.
  - Ngăn ngừa rủi ro mất mát dữ liệu học tập quan trọng khi tài khoản người dùng bị xóa.

### 1.3. `Question -> QuestionOption`: Giữ nguyên thiết kế bảng riêng
- **Quyết định**:
  - Giữ bảng chuẩn hóa `QuestionOption` (`question_options`), không chuyển thành mảng `String[]`.
  - Giữ nguyên `question.answer` dạng `String @db.Text` và semantics chuỗi đáp án hiện tại để tương thích với logic chấm điểm `===` trong code.
  - Không chuyển đổi hệ thống sang sử dụng `optionId` ở bước này.
- **Lý do**:
  - Giữ cấu trúc quan hệ chuẩn hóa 3NF trong PostgreSQL.
  - Sẵn sàng cho việc mở rộng tính năng thi cử (xáo trộn đáp án, metadata đáp án) trong tương lai.

### 1.4. `QuizSubmission`: Giữ nguyên một User chỉ submit một lần
- **Quyết định**:
  - Giữ nguyên ràng buộc:
    ```prisma
    @@unique([quizId, userId])
    ```
  - Không thêm trường `attempt` ở thời điểm hiện tại.
- **Lý do**:
  - Phù hợp 100% với logic code hiện tại của backend (`findOne({ quiz: quizId, user: userId })`).
  - Không tự ý mở rộng nghiệp vụ thi lại/retry khi chưa có yêu cầu từ sản phẩm.

### 1.5. `Conversation.lastMessageId`: Giữ dạng UUID độc lập, không tạo Foreign Key
- **Quyết định**:
  - Giữ trường `lastMessageId String? @map("last_message_id") @db.Uuid` như một trường ID độc lập, không tạo quan hệ `@relation` cứng trỏ tới `Message`.
- **Lý do**:
  - Tránh triệt để lỗi phụ thuộc vòng (Circular Dependency) giữa hai bảng `conversations` và `messages`.
  - Đảm bảo việc insert/delete tin nhắn và cuộc trò chuyện diễn ra trơn tru mà không vướng deadlock hoặc ràng buộc khóa ngoại hai chiều.

### 1.6. `ID Strategy`: PostgreSQL sử dụng UUID chuẩn
- **Quyết định**:
  - Tất cả các bảng PostgreSQL tiếp tục sử dụng:
    ```prisma
    id String @id @default(uuid()) @db.Uuid
    ```
  - Không cố ép lưu trực tiếp chuỗi 24 hex của MongoDB `ObjectId` vào cột PostgreSQL `UUID`.
  - Việc chuyển đổi và mapping `MongoDB ObjectId → PostgreSQL UUID` sẽ được thực thi trong Phase Migration Data (bằng logic script hoặc bảng ánh xạ tạm thời).
  - Không tạo bảng `_mongo_id_map` trong schema database chính thức ở bước này.

---

## 2. CÁC QUYẾT ĐỊNH TẠM HOÃN (DEFERRED DECISIONS)

Các nội dung sau không thuộc phạm vi của schema design và được hoãn lại để giải quyết trong các Phase tiếp theo:

1. **Thực thi Mapping `MongoDB ObjectId → PostgreSQL UUID`**:
   - Thuật toán và cơ chế mapping (ví dụ: in-memory map hoặc migration temp table) sẽ được cài đặt trong script migrate dữ liệu ở Phase 4.
2. **Thứ tự di chuyển dữ liệu (Data Migration Order)**:
   - Quy trình nạp dữ liệu tuần tự theo thứ tự phụ thuộc khóa ngoại (Users -> Categories -> Courses -> Chapters -> Lessons -> Quizzes -> Questions -> Options -> Submissions -> Orders -> Enrollments -> ...) sẽ được quy định cụ thể tại Step kế tiếp.
3. **Kịch bản Migration Script (Data Migration Scripts)**:
   - Các script đọc từ MongoDB Atlas và ghi vào PostgreSQL thông qua Prisma Client sẽ được viết và kiểm thử độc lập ở Phase 4.
4. **Tái cấu trúc Tầng Service & Controller (Service/Controller Refactor)**:
   - Giữ nguyên 100% code Mongoose hiện tại. Việc chuyển đổi từ Mongoose API sang Prisma Client sẽ chỉ thực hiện ở Phase 5.
5. **Chạy song song Dual-run (PostgreSQL & MongoDB Dual-run)**:
   - Chiến lược đồng bộ hoặc chạy song song để kiểm thử đối soát sẽ được quyết định tại Phase 6.
6. **Chuyển đổi Production (Production Cutover)**:
   - Kế hoạch chuyển hoàn toàn backend sang PostgreSQL và ngừng MongoDB (Phase 7) sẽ chỉ thực hiện sau khi hệ thống đã qua kiểm thử toàn diện.

---

## 3. TỔNG KẾT SCHEMA TRẠNG THÁI HIỆN TẠI

- **Tổng số Tables**: **26 Tables**
- **Tổng số Enums**: **15 Enums**
- **Kiểm tra cú pháp**: `npx prisma validate` & `npx prisma format` đều **PASS 100%**.
- **Tính toàn vẹn**:
  - Mọi quan hệ cha - con, quan hệ N - N đã được ràng buộc đúng quy chuẩn.
  - Toàn bộ dữ liệu tài chính, học tập, chứng chỉ (`orders`, `certificates`, `enrollments`, `quiz_submissions`, `courses`) đều đã được thiết lập `onDelete: Restrict` đối với quan hệ User để bảo vệ lịch sử dữ liệu một cách an toàn nhất.
