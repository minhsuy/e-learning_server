# Phase 10 Migration Report: Notifications (Final Data Migration Phase)

> **Execution Date/Time**: 2026-10-01T18:32:27+07:00  
> **Duration**: 1504ms  
> **Final Verdict**: **PASS**  
> **Status**: Completed successfully with 100% data integrity, user foreign key validation, polymorphic relatedId resolution, and complete database isolation across all 26 business tables.

---

## 1. Executive Summary

| Entity / Table | MongoDB (Source) | PostgreSQL (Before) | PostgreSQL (After) | Status |
|:---|:---:|:---:|:---:|:---:|
| **notifications** | 28 | 0 | **28** | ✅ 100% MATCH |
| **Pre-migrated records** (Phase 1–9) | 133 | 133 | **133** | ✅ UNCHANGED |
| **Total database business rows** | — | **133** | **161** | ✅ EXACT MATCH (+28 rows) |

---

## 2. Environment Information

- **MongoDB Source Database**: `e-learning` (MongoDB Atlas)
- **MongoDB Connection Mode**: `READ_ONLY` (Zero writes executed)
- **PostgreSQL Target Database**: `tmdemy` (localhost:5432)
- **PostgreSQL Schema Status**: Intact, unchanged, using Prisma Client with migrations applied
- **Transaction Scope**: Single atomic transaction covering all 28 `notifications` records
- **UUID Generator**: RFC 4122 v5 namespace deterministic hashing via `scripts/migration-utils/id-mapper.ts`

---

## 3. Schema Mapping Decisions

### 3.1. MongoDB Source Schema
```typescript
interface INotification {
  _id: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;    // Ref: 'User' (nullable)
  receiver: mongoose.Types.ObjectId;  // Ref: 'User' (required)
  type: ENotificationType;            // 'order' | 'comment' | 'comment_reply' | 'quiz' | 'course' | 'lesson' | 'rating'
  message: string;
  relatedId?: mongoose.Types.ObjectId;// Polymorphic reference
  read: boolean;                      // Default: false
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2. PostgreSQL / Prisma Target Schema
```prisma
model Notification {
  id         String            @id @default(uuid()) @db.Uuid
  senderId   String?           @map("sender_id") @db.Uuid
  receiverId String            @map("receiver_id") @db.Uuid
  type       ENotificationType
  message    String            @db.Text
  relatedId  String?           @map("related_id") @db.VarChar(255)
  isRead     Boolean           @default(false) @map("is_read")
  createdAt  DateTime          @default(now()) @map("created_at")
  updatedAt  DateTime          @updatedAt @map("updated_at")

  sender   User? @relation("NotificationSender", fields: [senderId], references: [id], onDelete: SetNull)
  receiver User  @relation("NotificationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([receiverId, isRead, createdAt])
  @@map("notifications")
}
```

### 3.3. Field Mapping Details

1. `_id` $\rightarrow$ `id`: Deterministic UUID v5 via `toPostgresUuid("notifications", raw._id)`.
2. `sender` $\rightarrow$ `sender_id`: Mapped via `toPostgresUuid("users", raw.sender)` if present, else `null`. Verified against `users` table.
3. `receiver` $\rightarrow$ `receiver_id`: Foreign key mapped via `toPostgresUuid("users", raw.receiver)`. Verified against `users` table.
4. `type` $\rightarrow$ `type`: Mapped to Prisma enum `ENotificationType` (`ORDER`, `COMMENT`, `COMMENT_REPLY`, `QUIZ`, `COURSE`, `LESSON`, `RATING`).
5. `message` $\rightarrow$ `message`: Preserved 100% full text including Vietnamese accents without truncation.
6. `relatedId` $\rightarrow$ `related_id`: Resolved via `resolveNotificationRelatedId(type, relatedId)`.
7. `read` $\rightarrow$ `is_read`: Boolean preserved (`read` in Mongo $\rightarrow$ `isRead` in Prisma).
8. `createdAt` $\rightarrow$ `created_at`: Preserved UTC timestamp.
9. `updatedAt` $\rightarrow$ `updated_at`: Preserved UTC timestamp.

---

## 4. Notification Type Distribution

| Type | MongoDB Count | PostgreSQL Count | Prisma Enum Value | Percentage |
|:---|:---:|:---:|:---|:---:|
| `order` | 9 | 9 | `ENotificationType.ORDER` | 32.1% |
| `comment` | 9 | 9 | `ENotificationType.COMMENT` | 32.1% |
| `quiz` | 5 | 5 | `ENotificationType.QUIZ` | 17.9% |
| `course` | 2 | 2 | `ENotificationType.COURSE` | 7.1% |
| `lesson` | 1 | 1 | `ENotificationType.LESSON` | 3.6% |
| `comment_reply` | 1 | 1 | `ENotificationType.COMMENT_REPLY` | 3.6% |
| `rating` | 1 | 1 | `ENotificationType.RATING` | 3.6% |
| **TOTAL** | **28** | **28** | | **100%** |

*Ghi chú phân loại*:
- Phân loại thực tế từ MongoDB Atlas chứa 7 types khác nhau, phản ánh đầy đủ nghiệp vụ thông báo của hệ thống.
- Tổng số records đúng chính xác 28 documents như dự kiến ban đầu.

---

## 5. Polymorphic `relatedId` Mapping & Resolution

### Strategy Implemented
Theo phân tích nghiệp vụ và quyết định đã thống nhất:
1. **`comment` & `comment_reply`**:
   - Trong MongoDB backend (`src/services/comment.service.ts`), `pushNotificationService` truyền `lesson` ID vào `relatedId` (để khi người dùng click vào thông báo sẽ mở ngay bài học chứa bình luận).
   - Hàm `resolveNotificationRelatedId` đã được ánh xạ chuẩn xác: `comment` / `comment_reply` $\rightarrow$ `toPostgresUuid('lessons', relatedId)`.
   - Kết quả: Toàn bộ 10 comment notifications trỏ chính xác về bài học "Giới thiệu về ReactJS" trong PostgreSQL.
2. **`order`**:
   - Ánh xạ sang `orders` table. Toàn bộ 9 order notifications trỏ về các đơn hàng hợp lệ (`DH-1412271`, `DH-2714351`, `DH-5196135`, `DH-2760785`, `DH-2062171`, `DH-2464723`).
3. **`rating`**:
   - Ánh xạ sang `ratings` table. Trỏ về bản ghi rating 4 sao đã migrate từ Phase 7.
4. **`lesson`**:
   - Ánh xạ sang `lessons` table. Trỏ về bài học "Bài 7 : Memo trong react".
5. **Deleted Historical Entities**:
   - 2 `course` notifications trỏ đến course đã bị xóa trong MongoDB trước migration.
   - 3 `quiz` notifications trỏ đến quiz submissions cũ đã bị xóa trong MongoDB trước migration.
   - Giữ nguyên UUID v5 tất định tương ứng (`courses` và `quiz_submissions`) vào cột `related_id` (kiểu `VarChar(255)` không có foreign key vật lý), bảo toàn 100% dữ liệu lịch sử đối soát mà không vi phạm tính toàn vẹn của cơ sở dữ liệu.

---

## 6. Foreign Key & User Relationship Integrity

- **Receiver Foreign Key**: **28 / 28** (100% hợp lệ). Toàn bộ người nhận đều là các user đã được migrate trong Phase 1.
- **Sender Foreign Key**:
  - 23 notifications có người gửi cụ thể (`sender != null`), 100% trỏ về user hợp lệ trong PostgreSQL.
  - 5 notifications không có người gửi (`sender == null`, thông báo hệ thống / admin duyệt khóa học / hoàn tất đơn hàng), được lưu dưới dạng `senderId = null` theo đúng định nghĩa Prisma `senderId String?`.

---

## 7. Read Status & Content Preservation

- **Read Status (`read` $\rightarrow$ `is_read`)**:
  - `false` (chưa đọc): 27 notifications.
  - `true` (đã đọc): 1 notification (`68ebc1cee0a02fc17af9c33e`).
  - Tỉ lệ khớp: **100%** (28/28).
- **Nội dung thông báo (`message`)**:
  - 100% chuỗi ký tự UTF-8 tiếng Việt có dấu được bảo toàn hoàn hảo (ví dụ: *"Học viên minhsuyyyyy vừa bình luận về khóa học..."*, *"Đơn hàng "DH-1412271" của bạn đã được hoàn tất !"*, *"minhsuyyyyy vừa đánh giá khóa học... với 4 sao: "Khóa học rất hay và dễ hiểu, tôi học được nhiều kiến thức mới!""*).
  - Không có trường hợp nào bị cắt ngắn hoặc mất ký tự.

---

## 8. Functional Service Queries Verification

Các truy vấn mô phỏng theo `src/services/notification.service.ts` đã được chạy thử nghiệm trên PostgreSQL:
1. `getNotificationsService(userId)`: Truy vấn danh sách thông báo theo `receiverId` sắp xếp giảm dần theo `createdAt` thành công.
2. Filter by `type`: Truy vấn lọc theo `type: ORDER` trả về chính xác 9 records.
3. Count by `isRead`: Đếm số lượng chưa đọc trả về chính xác 27 records.

---

## 9. MongoDB Read-Only Verification

```text
MongoDB writes executed: 0
```
- Toàn bộ quá trình chỉ sử dụng `find({}).toArray()`, `sort()`, và `countDocuments()`.
- Số lượng documents trong MongoDB collection `notifications` trước và sau migration đều là **28**.

---

## 10. Database Isolation & Complete Migration Summary

### Trạng thái hoàn chỉnh của toàn bộ 26 bảng nghiệp vụ trong PostgreSQL

| Table Name | Phase | Rows Before Phase 10 | Rows After Phase 10 | Expected | Migration Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| `users` | 1 | 7 | 7 | 7 | ✅ VERIFIED |
| `categories` | 1 | 3 | 3 | 3 | ✅ VERIFIED |
| `courses` | 2 | 8 | 8 | 8 | ✅ VERIFIED |
| `course_faqs` | 2 | 8 | 8 | 8 | ✅ VERIFIED |
| `chapters` | 3 | 12 | 12 | 12 | ✅ VERIFIED |
| `lessons` | 3 | 7 | 7 | 7 | ✅ VERIFIED |
| `quizzes` | 4 | 3 | 3 | 3 | ✅ VERIFIED |
| `questions` | 4 | 5 | 5 | 5 | ✅ VERIFIED |
| `question_options` | 4 | 20 | 20 | 20 | ✅ VERIFIED |
| `quiz_submissions` | 5 | 2 | 2 | 2 | ✅ VERIFIED |
| `quiz_submission_answers` | 5 | 4 | 4 | 4 | ✅ VERIFIED |
| `orders` | 6 | 8 | 8 | 8 | ✅ VERIFIED |
| `coupons` | 6 | 2 | 2 | 2 | ✅ VERIFIED |
| `coupon_courses` | 6 | 2 | 2 | 2 | ✅ VERIFIED |
| `enrollments` | 6 | 5 | 5 | 5 | ✅ VERIFIED |
| `progress` | 7 | 4 | 4 | 4 | ✅ VERIFIED |
| `certificates` | 7 | 1 | 1 | 1 | ✅ VERIFIED |
| `ratings` | 7 | 1 | 1 | 1 | ✅ VERIFIED |
| `favorite_courses` | 7 | 2 | 2 | 2 | ✅ VERIFIED |
| `comments` | 8 | 8 | 8 | 8 | ✅ VERIFIED |
| `comment_reactions` | 8 | 1 | 1 | 1 | ✅ VERIFIED |
| `conversations` | 9 | 2 | 2 | 2 | ✅ VERIFIED |
| `conversation_participants` | 9 | 6 | 6 | 6 | ✅ VERIFIED |
| `messages` | 9 | 12 | 12 | 12 | ✅ VERIFIED |
| `message_reads` | 9 | 0 | 0 | 0 | ✅ VERIFIED |
| **`notifications`** | **10** | **0** | **28** | **28** | ✅ **MIGRATED** |
| **TOTAL BUSINESS ROWS** | | **133** | **161** | **161** | ✅ **100% COMPLETE** |

---

## 11. Errors / Warnings

- **Errors**: None.
- **Warnings**: None.
- Toàn bộ 28 notifications được chuyển đổi và insert trong 1 giao dịch duy nhất không có lỗi.

---

## 12. Security Compliance

- Không có thông tin nhạy cảm (mật khẩu, hash, JWT, token, connection string có mật khẩu) xuất hiện trong báo cáo hoặc log hệ thống.

---

## 13. Final Verdict

# **PASS**

Phase 10 đã hoàn tất xuất sắc với 28/28 notifications được chuyển đổi thành công.

---

## 14. DATA MIGRATION PROJECT COMPLETE — STRICT STOP

Toàn bộ **10 Phase** của dự án Data Migration từ MongoDB sang PostgreSQL/Prisma đã hoàn thành trọn vẹn:
- Tổng số bảng nghiệp vụ đã migrate: **26/26 bảng**.
- Tổng số bản ghi trong PostgreSQL: **161 business records**.
- Không có orphan records hoặc vi phạm khóa ngoại.
- Tất cả các phase tuân thủ nghiêm ngặt tính tất định (deterministic UUID v5) và bảo vệ MongoDB (0 writes).

**Tuân thủ yêu cầu STRICT STOP:**
- Dừng toàn bộ quá trình migration dữ liệu.
- Không tự ý chuyển sang Application Migration.
- Không thay thế code backend Mongoose sang Prisma.
- Không sửa đổi schema hoặc frontend.
- Chờ review và phê duyệt từ Tech Lead / User.
