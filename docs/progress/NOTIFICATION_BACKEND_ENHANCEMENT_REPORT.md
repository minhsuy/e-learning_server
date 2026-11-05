# BÁO CÁO TIẾN ĐỘ: NÂNG CẤP NOTIFICATION METADATA CHO ĐIỀU HƯỚNG NGỮ CẢNH (NOTIFICATION_BACKEND_ENHANCEMENT_REPORT.MD)

> **Phân hệ**: TMDEMY E-Learning Backend  
> **Nhiệm vụ**: Backend Notification Enhancement — Contextual Navigation  
> **Ngày hoàn thành**: 14/10/2026  
> **Trạng thái**: **COMPLETED (HOÀN THÀNH TOÀN DIỆN & SẴN SÀNG REVIEW)**

---

## 1. STATUS
* **Trạng thái tổng thể**: `COMPLETED`
* **Prisma Migration**: Đã áp dụng an toàn `20261014135502_add_notification_metadata` vào database `tmdemy` (PostgreSQL 16.11).
* **Toàn vẹn dữ liệu**: 50 bản ghi Notification lịch sử hiện có được bảo toàn nguyên vẹn 100% (zero record loss, zero data corruption).
* **Kiểm thử tự động**:
  * Bộ kiểm thử mở rộng `scripts/test_notification_enhancement.ts`: **47/47 tests PASS (100%)**.
  * Bộ kiểm thử hồi quy `scripts/test_phase10_suite.ts`: **63/63 tests PASS (100%)**.

---

## 2. AUDIT FINDINGS ADDRESSED
Báo cáo kiểm toán [docs/audit/NOTIFICATION_BACKEND_AUDIT.md](file:///d:/e-learning_server/docs/audit/NOTIFICATION_BACKEND_AUDIT.md) đã chỉ ra rằng việc notification chỉ lưu duy nhất một trường scalar `relatedId` khiến Frontend gặp các "điểm mù điều hướng" (Navigation Blindspots):
1. **Sự kiện `LESSON` (Giáo viên tạo bài học mới)**: Trước đây chỉ lưu `relatedId = lesson.id`, thiếu `courseId` và `courseSlug` khiến Frontend không thể dựng URL trang học `/learning/[courseId]?lessonId=[lessonId]`.  
   ➡️ **Đã giải quyết**: Bổ sung metadata `{ courseId, courseSlug, lessonId }`.
2. **Sự kiện `COMMENT` (Học viên tạo bình luận gốc)**: Trước đây chỉ lưu `relatedId = lesson.id`, không lưu `comment.id` khiến giáo viên không thể định vị bình luận mới.  
   ➡️ **Đã giải quyết**: Bổ sung metadata `{ courseId, courseSlug, lessonId, commentId }`.
3. **Sự kiện `COMMENT_REPLY` (Phản hồi bình luận)**: Trước đây chỉ lưu `relatedId = lesson.id`, không lưu `comment.id` (của reply) và không lưu `parentId` (của comment gốc), khiến Frontend không thể auto-scroll, highlight hoặc expand thread.  
   ➡️ **Đã giải quyết**: Bổ sung metadata `{ courseId, courseSlug, lessonId, commentId, parentId }`.

---

## 3. PRISMA SCHEMA CHANGES
Tại file [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma#L633-L650), trường `metadata` dạng nullable JSONB đã được bổ sung vào model `Notification`:

```diff
 model Notification {
   id         String            @id @default(uuid()) @db.Uuid
   senderId   String?           @map("sender_id") @db.Uuid
   receiverId String            @map("receiver_id") @db.Uuid
   type       ENotificationType
   message    String            @db.Text
   relatedId  String?           @map("related_id") @db.VarChar(255)
+  metadata   Json?             @map("metadata")
   isRead     Boolean           @default(false) @map("is_read")
   createdAt  DateTime          @default(now()) @map("created_at")
   updatedAt  DateTime          @updatedAt @map("updated_at")

   sender   User? @relation("NotificationSender", fields: [senderId], references: [id], onDelete: SetNull)
   receiver User  @relation("NotificationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)

   @@index([receiverId, isRead, createdAt])
   @@map("notifications")
 }
```

---

## 4. MIGRATION DETAILS
* **Tên Migration**: `20261014135502_add_notification_metadata`
* **Vị trí**: [prisma/migrations/20261014135502_add_notification_metadata/migration.sql](file:///d:/e-learning_server/prisma/migrations/20261014135502_add_notification_metadata/migration.sql)
* **Câu lệnh SQL thực thi**:
  ```sql
  -- AlterTable
  ALTER TABLE "notifications" ADD COLUMN "metadata" JSONB;
  ```
* **Tính an toàn**: Thao tác `ADD COLUMN ... JSONB` là non-destructive, không khóa bảng lâu, gán giá trị mặc định `NULL` cho tất cả các bản ghi có sẵn, không yêu cầu `migrate reset`.
* **Prisma Generate**: Đã generate thành công Prisma Client 6.4.1 tương ứng.

---

## 5. NOTIFICATION PAYLOAD TRƯỚC VÀ SAU

### 5.1. Khi Giáo viên tạo Lesson mới (`LESSON`)
* **Trước**:
  ```json
  {
    "id": "notif-uuid",
    "type": "LESSON",
    "message": "Có bài học mới \"Bài 7 : Memo trong react\" trong khóa học \"Khóa học React native cơ bản\"",
    "relatedId": "lesson-uuid-1",
    "isRead": false
  }
  ```
* **Sau**:
  ```json
  {
    "id": "notif-uuid",
    "type": "LESSON",
    "message": "Có bài học mới \"Bài 7 : Memo trong react\" trong khóa học \"Khóa học React native cơ bản\"",
    "relatedId": "lesson-uuid-1",
    "metadata": {
      "courseId": "course-uuid-1",
      "courseSlug": "khoa-hoc-react-native-co-ban",
      "lessonId": "lesson-uuid-1"
    },
    "isRead": false
  }
  ```

### 5.2. Khi Học viên bình luận bài học (`COMMENT`)
* **Trước**:
  ```json
  {
    "id": "notif-uuid",
    "type": "COMMENT",
    "message": "Học viên Minh vừa bình luận về khóa học \"Khóa học React native cơ bản\"",
    "relatedId": "lesson-uuid-1",
    "isRead": false
  }
  ```
* **Sau**:
  ```json
  {
    "id": "notif-uuid",
    "type": "COMMENT",
    "message": "Học viên Minh vừa bình luận về khóa học \"Khóa học React native cơ bản\"",
    "relatedId": "lesson-uuid-1",
    "metadata": {
      "courseId": "course-uuid-1",
      "courseSlug": "khoa-hoc-react-native-co-ban",
      "lessonId": "lesson-uuid-1",
      "commentId": "comment-uuid-root"
    },
    "isRead": false
  }
  ```

### 5.3. Khi có người trả lời bình luận (`COMMENT_REPLY`)
* **Trước**:
  ```json
  {
    "id": "notif-uuid",
    "type": "COMMENT_REPLY",
    "message": "Thầy Bình vừa trả lời bình luận của bạn: \"Bạn hãy kiểm tra lại dependency array\"",
    "relatedId": "lesson-uuid-1",
    "isRead": false
  }
  ```
* **Sau**:
  ```json
  {
    "id": "notif-uuid",
    "type": "COMMENT_REPLY",
    "message": "Thầy Bình vừa trả lời bình luận của bạn: \"Bạn hãy kiểm tra lại dependency array\"",
    "relatedId": "lesson-uuid-1",
    "metadata": {
      "courseId": "course-uuid-1",
      "courseSlug": "khoa-hoc-react-native-co-ban",
      "lessonId": "lesson-uuid-1",
      "commentId": "comment-uuid-reply",
      "parentId": "comment-uuid-root"
    },
    "isRead": false
  }
  ```

---

## 6. MAPPING MA TRẬN: `type` / `relatedId` / `metadata`

| `type` | `relatedId` | Cấu trúc `metadata` | Mục đích điều hướng phía Frontend |
| :--- | :--- | :--- | :--- |
| **`LESSON`** | `lesson.id` | `{ courseId, courseSlug, lessonId }` | Dựng trực tiếp link `/learning/:courseId?lessonId=:lessonId` hoặc `/courses/:courseSlug/learn/:lessonId` |
| **`COMMENT`** | `lesson.id` | `{ courseId, courseSlug, lessonId, commentId }` | Mở đúng bài học và auto-scroll/highlight câu hỏi mới của học viên |
| **`COMMENT_REPLY`** | `lesson.id` | `{ courseId, courseSlug, lessonId, commentId, parentId }` | Mở đúng bài học, tự động bung nhánh thảo luận `parentId`, scroll tới và highlight `commentId` |
| **`ORDER`** | `order.id` | `null` (Bảo toàn) | Xem chi tiết đơn hàng |
| **`RATING`** | `rating.id` | `null` (Bảo toàn) | Xem chi tiết đánh giá |
| **`QUIZ`** | `submission.id` | `null` (Bảo toàn) | Xem kết quả bài làm quiz |
| **`COURSE`** | `course.id` | `null` (Bảo toàn) | Xem khóa học |
| **`SYSTEM`** | `null` / string | `null` (Bảo toàn) | Thông báo chung hệ thống |

---

## 7. API RESPONSE & DTO CHANGES
Endpoint `GET /api/notifications/` trả về mảng thông báo có bổ sung trường `metadata`:
```json
{
  "id": "daf144ef-ae5b-5606-8f01-8474b20dadc5",
  "_id": "daf144ef-ae5b-5606-8f01-8474b20dadc5",
  "senderId": "user-uuid-1",
  "receiverId": "user-uuid-2",
  "receiver": "user-uuid-2",
  "sender": {
    "id": "user-uuid-1",
    "_id": "user-uuid-1",
    "username": "teacher_alex",
    "avatar": null
  },
  "type": "LESSON",
  "message": "Có bài học mới...",
  "relatedId": "lesson-uuid-1",
  "metadata": {
    "courseId": "course-uuid-1",
    "courseSlug": "khoa-hoc-react-native",
    "lessonId": "lesson-uuid-1"
  },
  "read": false,
  "isRead": false,
  "createdAt": "2026-10-14T10:00:00.000Z",
  "updatedAt": "2026-10-14T10:00:00.000Z"
}
```
*Đối với các thông báo cũ hoặc loại thông báo không có metadata, trường `metadata` trả về giá trị `null` chuẩn JSON.*

---

## 8. SOCKET.IO REALTIME PAYLOAD CHANGES
* Hàm [pushNotificationService](file:///d:/e-learning_server/src/services/notification.service.ts#L163) sử dụng chung serializer [formatNotificationResponse](file:///d:/e-learning_server/src/services/notification.service.ts#L27).
* Khi phát sự kiện realtime `new_notification`:
  ```typescript
  io.to(receiverId).emit('new_notification', formatted)
  ```
  Payload gửi qua Socket.IO đồng bộ 100% với REST API, chứa đầy đủ trường `metadata` theo thời gian thực mà không làm gãy các field cũ (`id`, `_id`, `read`, `isRead`, `type`, `message`, `relatedId`).

---

## 9. FILES CREATED & UPDATED

| STT | File | Trạng thái | Mô tả thay đổi |
| :---: | :--- | :---: | :--- |
| 1 | [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma) | `UPDATED` | Bổ sung `metadata Json? @map("metadata")` vào model `Notification`. |
| 2 | [prisma/migrations/20261014135502_add_notification_metadata/migration.sql](file:///d:/e-learning_server/prisma/migrations/20261014135502_add_notification_metadata/migration.sql) | `CREATED` | Script migration vật lý `ALTER TABLE "notifications" ADD COLUMN "metadata" JSONB`. |
| 3 | [src/models/notification.model.ts](file:///d:/e-learning_server/src/models/notification.model.ts) | `UPDATED` | Thêm trường `metadata` vào `notificationBaseSchema`, `createNotificationInputSchema`, `notificationResponseSchema`. |
| 4 | [src/repositories/notification.repository.ts](file:///d:/e-learning_server/src/repositories/notification.repository.ts) | `UPDATED` | Thêm `metadata: true` vào `NOTIFICATION_PUBLIC_SELECT` và hỗ trợ `metadata` trong hàm `createNotification`. |
| 5 | [src/services/notification.service.ts](file:///d:/e-learning_server/src/services/notification.service.ts) | `UPDATED` | Thêm `metadata` vào serializer `formatNotificationResponse` và tham số của `pushNotificationService`. |
| 6 | [src/services/lesson.service.ts](file:///d:/e-learning_server/src/services/lesson.service.ts) | `UPDATED` | Truyền `metadata: { courseId, courseSlug, lessonId }` khi phát thông báo bài học mới. |
| 7 | [src/services/comment.service.ts](file:///d:/e-learning_server/src/services/comment.service.ts) | `UPDATED` | Truyền `metadata` tương ứng khi phát thông báo `COMMENT` và `COMMENT_REPLY`. |
| 8 | [docs/api/NOTIFICATION_API.md](file:///d:/e-learning_server/docs/api/NOTIFICATION_API.md) | `UPDATED` | Cập nhật tài liệu API chi tiết về định dạng và quy cách `metadata`. |
| 9 | [scripts/test_notification_enhancement.ts](file:///d:/e-learning_server/scripts/test_notification_enhancement.ts) | `CREATED` | Bộ kiểm thử tự động chuyên sâu cho Contextual Navigation Metadata. |

---

## 10. VALIDATION RESULTS

### 10.1. Kiểm thử theo yêu cầu cụ thể (Section 7)

| Hạng mục kiểm thử | Kịch bản kiểm tra | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **LESSON: Creation & Enrolled Student** | Giáo viên tạo Lesson mới qua `createLessonService` | **PASS** | Tạo bài học thành công, `pushNotificationService` kích hoạt |
| **LESSON: Correct Receiver** | Chỉ học viên có enrollment `ACTIVE` nhận thông báo | **PASS** | Đã xác thực nhận bởi học viên enrolled |
| **LESSON: RelatedId Preservation** | `relatedId` vẫn là UUID của bài học mới | **PASS** | `relatedId === lesson.id` |
| **LESSON: Metadata Context** | Metadata chứa đủ `courseId`, `courseSlug`, `lessonId` | **PASS** | Không dùng slug/ID giả; lấy trực tiếp từ `courseDoc` & `lesson` |
| **COMMENT: Root Comment Creation** | Học viên tạo comment gốc qua `createCommentService` | **PASS** | Tạo comment thành công |
| **COMMENT: Correct Receiver** | Giảng viên sở hữu khóa học nhận thông báo | **PASS** | `receiverId === course.authorId` |
| **COMMENT: Metadata Context** | Metadata chứa đủ `courseId`, `courseSlug`, `lessonId`, `commentId` | **PASS** | Định vị chính xác bài học và bình luận mới |
| **COMMENT_REPLY: Reply Creation** | Người dùng phản hồi bình luận của người khác | **PASS** | Tạo reply comment thành công |
| **COMMENT_REPLY: Correct Receiver** | Tác giả comment cha nhận thông báo | **PASS** | `receiverId === parentComment.userId` |
| **COMMENT_REPLY: Self-Reply Exclusion** | Tự trả lời bình luận của chính mình không gửi thông báo cho mình | **PASS** | Không có thông báo gửi cho chính mình (`senderId !== receiverId`) |
| **COMMENT_REPLY: Metadata Context** | Metadata chứa đủ `courseId`, `courseSlug`, `lessonId`, `commentId`, `parentId` | **PASS** | Đầy đủ dữ liệu để Frontend expand thread, scroll và highlight |
| **REGRESSION: Non-metadata Types** | Các type `ORDER`, `RATING`, `COURSE`, `SYSTEM` hoạt động bình thường | **PASS** | Tạo và đọc bình thường, `metadata` trả về `null` |
| **REGRESSION: Historical Data** | 50 bản ghi cũ có `metadata: null` đọc bình thường | **PASS** | Serializer trả về `metadata: null` sạch sẽ |
| **REGRESSION: No Residual Pollution** | Dọn dẹp sạch sẽ sau test, số lượng bản ghi không đổi | **PASS** | Baseline 50 bản ghi trước test = 50 bản ghi sau test |
| **REGRESSION: Phase 10 Suite** | Chạy lại toàn bộ test suite Phase 10 gốc | **PASS** | **63/63 tests PASS** |

---

## 11. BACKWARD COMPATIBILITY
* **Không phá vỡ API Contract**: Trường `metadata` được bổ sung là trường tùy chọn (nullable). Các trường hiện hữu (`id`, `_id`, `senderId`, `receiverId`, `receiver`, `sender`, `type`, `message`, `relatedId`, `read`, `isRead`, `createdAt`, `updatedAt`) giữ nguyên 100% kiểu dữ liệu và cấu trúc.
* **Tương thích Client cũ**: Client cũ không đọc `metadata` vẫn hoạt động bình thường với `relatedId`. Client mới có thể đọc trường `metadata` để thực hiện điều hướng mượt mà.
* **Không làm hỏng dữ liệu cũ**: Không có migration dữ liệu cưỡng bức (zero backfill guessing); dữ liệu lịch sử được giữ nguyên giá trị `NULL`.

---

## 12. REMAINING BACKEND GAPS
1. **Loại thông báo `QUIZ`**: Hiện `relatedId` lưu `submission.id`. Trong tương lai có thể cân nhắc bổ sung metadata `{ quizId, courseId, lessonId }` khi phân hệ Quiz Submission được nghiệm thu mở rộng.
2. **Loại thông báo `RATING`**: Hiện `relatedId` lưu `rating.id`. Có thể bổ sung metadata `{ courseId, courseSlug }` khi có yêu cầu điều hướng sâu vào trang đánh giá.

---
*Báo cáo được hoàn thiện và xác nhận bởi hệ thống kiểm thử tự động TMDEMY.*
