# BÁO CÁO AUDIT HỆ THỐNG NOTIFICATION BACKEND (TMDEMY)

> **Tài liệu kiểm toán kỹ thuật (Audit Only - Zero Code Changes)**  
> **Ngày thực hiện**: 14/10/2026  
> **Đối tượng rà soát**: Toàn bộ hệ thống Notification (Database Schema, Application Model, Repositories, Services, Controllers, Routes, Socket.IO và dữ liệu thực tế trong PostgreSQL).  
> **Trạng thái**: Hoàn tất rà soát - Chờ phê duyệt (Pending Review).

---

## 1. TỔNG QUAN & SCHEMAS HIỆN TẠI CỦA NOTIFICATION

### 1.1. Cấu trúc vật lý trong PostgreSQL (`prisma/schema.prisma`)
Mô hình `Notification` được định nghĩa trong PostgreSQL tại bảng `notifications` (dòng 633–649 của [schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma#L633-L649)):

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

Các giá trị của Enum `ENotificationType` (dòng 75–85):
```prisma
enum ENotificationType {
  COMMENT       @map("comment")
  RATING        @map("rating")
  ORDER         @map("order")
  MESSAGE       @map("message")
  SYSTEM        @map("system")
  COURSE        @map("course")
  LESSON        @map("lesson")
  COMMENT_REPLY @map("comment_reply")
  QUIZ          @map("quiz")
}
```

### 1.2. Application Domain Model & Zod Schemas (`src/models/notification.model.ts`)
Tại tầng ứng dụng ([notification.model.ts](file:///d:/e-learning_server/src/models/notification.model.ts)), schema xác thực bao gồm:
* `notificationBaseSchema`:
  * `id`: `z.string().uuid()`
  * `senderId`: `z.string().uuid().nullable().optional()`
  * `receiverId`: `z.string().uuid()`
  * `type`: `z.nativeEnum(ENotificationType)`
  * `message`: `z.string().min(1)`
  * `relatedId`: `z.string().max(255).nullable().optional()`
  * `isRead`: `z.boolean().default(false)`
  * `createdAt`: `z.date()`
  * `updatedAt`: `z.date()`
* `createNotificationInputSchema`: Input chỉ chấp nhận các trường cơ bản trên, không có bất kỳ trường metadata mở rộng nào.

### 1.3. API Response Payload & Serializer (`src/services/notification.service.ts`)
Hàm [formatNotificationResponse](file:///d:/e-learning_server/src/services/notification.service.ts#L27-L48) serialize dữ liệu trả về cho Client:
```typescript
{
  id: string,              // UUID v4
  _id: string,             // MongoDB compatibility alias
  senderId: string | null,
  receiverId: string,
  receiver: string,        // MongoDB compatibility alias
  sender: {
    id: string,
    _id: string,
    username: string,
    avatar: string | null
  } | null,
  type: ENotificationType,
  message: string,
  relatedId: string | null,// CHỈ DUY NHẤT 1 CHUỖI ĐỊNH DANH SCALAR
  isRead: boolean,
  read: boolean,           // MongoDB compatibility alias
  createdAt: string,
  updatedAt: string
}
```

### 1.4. Trạng thái dữ liệu thực tế trong Database PostgreSQL
Hệ thống hiện có **50 bản ghi** trong bảng `notifications` với phân bố theo `type` như sau:
* `ORDER`: 17 bản ghi
* `COMMENT`: 13 bản ghi
* `QUIZ`: 12 bản ghi
* `RATING`: 3 bản ghi
* `COURSE`: 2 bản ghi
* `COMMENT_REPLY`: 2 bản ghi
* `LESSON`: 1 bản ghi
* `MESSAGE`: 0 bản ghi (Chat hiện gửi qua realtime socket mà chưa lưu vào bảng notification)
* `SYSTEM`: 0 bản ghi

---

## 2. CÁC VỊ TRÍ TẠO NOTIFICATION TRONG BACKEND

Toàn bộ các module kích hoạt thông báo đều thông qua hàm tập trung [pushNotificationService](file:///d:/e-learning_server/src/services/notification.service.ts#L162-L218):

| Module / Service | File & Dòng | Sự kiện nghiệp vụ kích hoạt | Người gửi (`senderId`) | Người nhận (`receiverId`) |
| :--- | :--- | :--- | :--- | :--- |
| **Lesson** | [lesson.service.ts:L137](file:///d:/e-learning_server/src/services/lesson.service.ts#L137) | Giáo viên tạo bài học mới trong khóa học | Giáo viên (`userId`) | Toàn bộ học viên đã đăng ký khóa học (`active enrolled students`) |
| **Comment** | [comment.service.ts:L164](file:///d:/e-learning_server/src/services/comment.service.ts#L164) | Học viên tạo bình luận gốc trong bài học | Học viên (`userId`) | Giảng viên của khóa học (`courseDoc.authorId`) |
| **Comment Reply** | [comment.service.ts:L155](file:///d:/e-learning_server/src/services/comment.service.ts#L155) | Người dùng phản hồi (reply) một bình luận | Người phản hồi (`userId`) | Tác giả của bình luận cha (`parentComment.userId`) |
| **Course** | [course.service.ts:L239](file:///d:/e-learning_server/src/services/course.service.ts#L239) | Giáo viên tạo khóa học mới | Giáo viên (`author`) | Toàn bộ Admin trong hệ thống |
| **Course (Admin Duyệt)** | [admin.service.ts:L483](file:///d:/e-learning_server/src/services/admin.service.ts#L483) | Admin phê duyệt khóa học (`status = APPROVED`) | `null` (Hệ thống) | Giảng viên sở hữu khóa học (`course.authorId`) |
| **Quiz Submission** | [quizSubmission.service.ts:L183](file:///d:/e-learning_server/src/services/quizSubmission.service.ts#L183) | Học viên nộp bài kiểm tra trắc nghiệm | Học viên (`userId`) | Giảng viên sở hữu khóa học (`teacherId`) |
| **Rating** | [rating.service.ts:L75](file:///d:/e-learning_server/src/services/rating.service.ts#L75) | Học viên đánh giá sao khóa học | Học viên (`userId`) | Giảng viên sở hữu khóa học (`course.authorId`) |
| **Order (Tạo mới)** | [order.service.ts:L214](file:///d:/e-learning_server/src/services/order.service.ts#L214) | Học viên đặt mua khóa học thành công | Học viên (`userId`) | Giảng viên sở hữu khóa học (`course.authorId`) |
| **Order (Hoàn tất)** | [order.service.ts:L450](file:///d:/e-learning_server/src/services/order.service.ts#L450) | Đơn hàng chuyển trạng thái hoàn tất (`COMPLETED`) | `null` (Hệ thống) | Học viên mua hàng (`order.userId`) |

---

## 3. MA TRẬN MAPPING `type` → `relatedId` → THỰC THỂ THỰC TẾ

`relatedId` được thiết kế dưới dạng **Polymorphic Foreign Key mềm** (Soft reference). Dưới đây là bảng đối chiếu thực tế giữa loại thông báo, giá trị lưu trong `relatedId` và bảng cơ sở dữ liệu đích:

| `type` | Thực thể lưu vào `relatedId` | Bảng đích thực tế (`Target Table`) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `COURSE` | `course.id` | `courses` | ID của khóa học vừa tạo hoặc vừa được duyệt |
| `LESSON` | `lesson.id` | `lessons` | ID của bài học mới vừa được tạo |
| `QUIZ` | `submission.id` | `quiz_submissions` | ID bản ghi nộp bài (submission) của học viên (không phải ID của Quiz) |
| `ORDER` | `order.id` | `orders` | ID của đơn hàng vừa tạo hoặc hoàn tất |
| `RATING` | `rating.id` | `ratings` | ID của bản ghi đánh giá (không phải ID của Course) |
| `COMMENT` | `lesson.id` | `lessons` | **Lưu ID của bài học chứa bình luận** (không lưu ID của bản ghi comment) |
| `COMMENT_REPLY` | `lesson.id` | `lessons` | **Lưu ID của bài học chứa bình luận** (không lưu ID của reply comment, không lưu ID của parent comment) |
| `MESSAGE` | `message.id` | `messages` | Quy định theo mapper/schema (hiện chưa kích hoạt thông báo push) |
| `SYSTEM` | `null` hoặc custom string | Không có bảng cố định | Thông báo hệ thống |

*Quy tắc trên được xác thực đồng nhất giữa source code các Service, logic chuyển đổi ID tại [scripts/migration-utils/id-mapper.ts (L248-L268)](file:///d:/e-learning_server/scripts/migration-utils/id-mapper.ts#L248-L268) và dữ liệu đang lưu trong database PostgreSQL.*

---

## 4. PHÂN TÍCH HAI NGHIỆP VỤ TRỌNG TÂM

### 4.1. Khi giáo viên tạo Lesson mới
* **Cách thức tạo thông báo**:
  Tại [lesson.service.ts:L132-L147](file:///d:/e-learning_server/src/services/lesson.service.ts#L132-L147):
  ```typescript
  const enrolledUserIds = await findActiveEnrolledUserIdsByCourseId(course)
  for (const studentId of enrolledUserIds) {
    await pushNotificationService({
      senderId: userId,
      receiverId: studentId,
      type: ENotificationType.LESSON,
      message: `Có bài học mới "${lesson.title}" trong khóa học "${courseDoc.title}"`,
      relatedId: lesson.id
    })
  }
  ```
* **Đánh giá khả năng điều hướng của Frontend**:
  * **KHÔNG ĐỦ THÔNG TIN**:
    1. `relatedId` chỉ mang duy nhất `lesson.id` (ví dụ: `8ee197b0-7353-554b-9688-a0b8c1409dde`).
    2. Frontend hiển thị giao diện học tập (Learning screen) theo cấu trúc URL chuẩn:
       * `/learning/[courseId]?lessonId=[lessonId]` hoặc
       * `/courses/[courseSlug]/learn/[lessonId]`
    3. Vì Notification **hoàn toàn không có `courseId` hay `courseSlug`**, khi học viên click vào thông báo:
       * Frontend **không thể xây dựng được URL** để chuyển trang ngay lập tức.
       * Frontend buộc phải thực hiện thêm 1 API call ngầm (round-trip) để lấy chi tiết bài học (`GET /api/lessons/:id`) nhằm lấy được `courseId`, làm tăng độ trễ và dễ phát sinh lỗi nếu endpoint đó yêu cầu quyền hạn đặc thù hoặc chưa hỗ trợ.

---

### 4.2. Khi có người trả lời bình luận (`COMMENT_REPLY`)
* **Cách thức tạo thông báo**:
  Tại [comment.service.ts:L153-L161](file:///d:/e-learning_server/src/services/comment.service.ts#L153-L161):
  ```typescript
  if (parentId && parentComment && parentComment.userId !== userId) {
    const senderUser = await findUserById(userId)
    await pushNotificationService({
      senderId: userId,
      receiverId: parentComment.userId,
      type: ENotificationType.COMMENT_REPLY,
      message: `${senderUser?.username || 'Người dùng'} vừa trả lời bình luận của bạn: "${content}"`,
      relatedId: lesson // <-- Lưu lesson ID!
    })
  }
  ```
* **Đánh giá khả năng điều hướng của Frontend**:
  * **HOÀN TOÀN KHÔNG ĐỦ THÔNG TIN (Blind Navigation)**:
    1. **Về ngữ cảnh bài học & khóa học**:
       * `relatedId` được gán bằng `lesson` (Lesson ID).
       * Tương tự trường hợp Lesson, Notification **thiếu `courseId` / `courseSlug`**, khiến Frontend gặp khó khăn khi dựng URL trang học tập.
    2. **Về ngữ cảnh bình luận (Trọng yếu)**:
       * **KHÔNG LƯU `comment.id`** của phản hồi mới vừa tạo.
       * **KHÔNG LƯU `parentId`** của bình luận gốc được phản hồi.
    3. **Hậu quả trên giao diện người dùng (Frontend UX)**:
       * Một bài học có thể chứa hàng chục đến hàng trăm bình luận chia theo các nhánh (threads/replies).
       * Khi người dùng nhấp vào thông báo *"Người dùng B vừa trả lời bình luận của bạn"*, Frontend dù có mở được bài học thì:
         * **Không biết bình luận nào để scroll tới (Auto-scroll)**.
         * **Không biết bình luận nào để highlight màu nổi bật**.
         * **Không biết nhánh thảo luận nào đang đóng để tự động bung ra (Auto-expand thread)**.
       * Người dùng buộc phải tự lướt qua toàn bộ danh sách bình luận để tìm câu trả lời.
  * **Lưu ý với thông báo `COMMENT` (bình luận mới gửi cho giảng viên)**:
    * Cũng gặp hạn chế y hệt: `relatedId` được lưu là `lesson` (Lesson ID), không lưu `comment.id` hay `courseId`. Giảng viên nhấp vào thông báo chỉ tới được bài học mà không biết học viên vừa bình luận vào vị trí nào.

---

## 5. TỔNG HỢP CÁC TRƯỜNG HỢP FRONTEND KHÔNG THỂ ĐIỀU HƯỚNG CHÍNH XÁC

| Loại thông báo (`type`) | `relatedId` hiện tại | Thiếu hụt thông tin ngữ cảnh | Hậu quả điều hướng Frontend |
| :--- | :--- | :--- | :--- |
| **`COMMENT_REPLY`** | `lesson.id` | Thiếu `commentId` (reply), thiếu `parentId`, thiếu `courseId` | Không auto-scroll, không highlight comment, không expand thread, không có `courseId` để vào trang học |
| **`COMMENT`** | `lesson.id` | Thiếu `commentId`, thiếu `courseId` | Giảng viên không định vị được câu hỏi mới của học viên trong bài học |
| **`LESSON`** | `lesson.id` | Thiếu `courseId`, thiếu `courseSlug` | Không đủ tham số để dựng URL trang học `/learning/[courseId]` |
| **`QUIZ`** | `submission.id` | Thiếu `quizId`, thiếu `lessonId`, thiếu `courseId` | Giảng viên/Học viên không chuyển được tới bài trắc nghiệm gốc hoặc bài học chứa Quiz |
| **`RATING`** | `rating.id` | Thiếu `courseId`, thiếu `courseSlug` | Đánh giá nằm ở trang chi tiết khóa học `/courses/[courseSlug]`; không có `courseId` để điều hướng |

---

## 6. ĐỀ XUẤT CẤU TRÚC DỮ LIỆU CẦN BỔ SUNG

Để giải quyết triệt để vấn đề điều hướng mà **vẫn tuân thủ tuyệt đối quy tắc Migration (API Contract Freeze, Backward Compatibility)**, đề xuất 2 phương án kiến trúc:

### Phương án 1: Bổ sung trường `metadata` dạng JSONB (Khuyến nghị chuẩn mực nhất)
* **Ý tưởng**: Giữ nguyên `relatedId` (để không phá vỡ API contract cũ và logic hiện có), đồng thời bổ sung thêm 1 trường `metadata Json?` vào bảng `notifications`.
* **Cấu trúc trường `metadata` cho từng loại thông báo**:
  1. Với `LESSON`:
     ```json
     {
       "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
       "courseSlug": "khoa-hoc-react-native",
       "lessonId": "8ee197b0-7353-554b-9688-a0b8c1409dde",
       "lessonSlug": "bai-7-memo-trong-react"
     }
     ```
  2. Với `COMMENT_REPLY`:
     ```json
     {
       "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
       "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
       "commentId": "uuid-cua-reply-comment",
       "parentId": "uuid-cua-parent-comment"
     }
     ```
  3. Với `COMMENT`:
     ```json
     {
       "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
       "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
       "commentId": "uuid-cua-new-comment"
     }
     ```
  4. Với `QUIZ`:
     ```json
     {
       "submissionId": "a009ddaa-7638-41de-892c-9eb0b73c8556",
       "quizId": "quiz-uuid",
       "lessonId": "lesson-uuid",
       "courseId": "course-uuid"
     }
     ```
  5. Với `RATING`:
     ```json
     {
       "ratingId": "71139688-328f-5582-97ac-b5ea2696166b",
       "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
       "courseSlug": "khoa-hoc-react-native"
     }
     ```
* **Ưu điểm**:
  * Cực kỳ linh hoạt, đáp ứng được mọi loại thông báo mà không làm phình schema bằng nhiều cột `nullable`.
  * Hoàn toàn tương thích ngược 100%: Client cũ chỉ đọc `relatedId`, Client mới đọc thêm `metadata` để điều hướng mượt mà (deep linking).
* **Ràng buộc quy trình**: Do đây là thay đổi schema vật lý (`prisma/schema.prisma`), phương án này cần được chủ dự án phê duyệt chính thức trước khi áp dụng ở Phase tương ứng.

---

### Phương án 2: Bổ sung trường tính toán ở Application Layer (Zero Database Schema Change)
* **Ý tưởng**: Không sửa database `prisma/schema.prisma`. Khi gọi `GET /api/notifications`, Service tự động phân tích `type` và `relatedId` để query nhanh thông tin cha (enrich context) hoặc trả thêm `metadata` / `targetUrl` trực tiếp trong DTO serialize.
* **Ví dụ**:
  * Nếu `type === 'LESSON'`: Query lấy `courseId` từ bảng `lessons` theo `relatedId`.
  * Nếu `type === 'COMMENT' | 'COMMENT_REPLY'`: Query lấy `courseId` từ `lessonId`.
* **Ưu điểm**: Không cần chạy migration DB.
* **Nhược điểm**: Vẫn không giải quyết được việc thiếu `commentId` và `parentId` đối với `COMMENT` và `COMMENT_REPLY` vì ID này chưa từng được lưu lại lúc tạo thông báo. Do đó, phương án bổ sung dữ liệu ngay lúc ghi (Phương án 1) vẫn là giải pháp triệt để nhất.

---

## 7. KẾT LUẬN & KIẾN NGHỊ

1. Backend hiện tại lưu trữ notification rất tối giản (`id`, `senderId`, `receiverId`, `type`, `message`, `relatedId`, `isRead`).
2. Việc sử dụng duy nhất một trường `relatedId` kiểu chuỗi vô hình trung tạo ra sự mơ hồ về ngữ nghĩa và làm mất ngữ cảnh phân cấp (`Course` -> `Lesson` -> `Comment` / `ParentComment`).
3. Cả hai trường hợp giáo viên tạo Lesson mới và người dùng phản hồi bình luận **đều chưa đủ thông tin cần thiết** để Frontend xây dựng trải nghiệm điều hướng chính xác và mượt mà.
4. Đề xuất: Đưa nhiệm vụ bổ sung trường ngữ cảnh `metadata` vào kế hoạch triển khai của Phase phù hợp (Phase 10: Notification Refinement) sau khi có văn bản chấp thuận của chủ dự án.

---
*Báo cáo được khởi tạo tự động theo yêu cầu audit của dự án TMDEMY.*
