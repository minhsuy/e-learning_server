# SCHEMA REVIEW & VALIDATION REPORT: PRISMA / POSTGRESQL VS MONGODB REALITY

> **Mục tiêu**: Đánh giá toàn diện file [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma) so với hành vi thực tế của hệ thống hiện tại trong MongoDB/Mongoose.  
> **Nguyên tắc**: Bám sát 100% bằng chứng từ source code, Mongoose models, Services và Controllers; chỉ rõ các điểm khác biệt, rủi ro tiềm ẩn và đề xuất hướng xử lý.  
> **Cam kết**: KHÔNG tự ý sửa file `schema.prisma`, KHÔNG tạo migration, KHÔNG can thiệp source code.

---

## 1. MÔ HÌNH BÀI HỌC (LESSON) & TRƯỜNG `courseId`

### Thực trạng trong Source Code
- **Trong Mongoose Model** ([src/models/lesson.model.ts](file:///d:/e-learning_server/src/models/lesson.model.ts)):
  - `chapter`: `ObjectId` (Ref: Chapter, Required)
  - `course`: `ObjectId` (Ref: Course, Required)
  - `author`: `ObjectId` (Ref: User, Required)
- **Trong Service Layer** ([src/services/lesson.service.ts](file:///d:/e-learning_server/src/services/lesson.service.ts#L30-L68)):
  - Hàm `createLessonService` nhận cả `chapter` và `course` từ payload.
  - Kiểm tra `CourseModel.findById(course)` và `ChapterModel.findById(chapter)`.
  - **LỖI HỆ THỐNG HIỆN HÀNH**: Code **KHÔNG hề kiểm tra** xem `chapter.course` có thực sự bằng `course` được truyền vào hay không!
  - Truy vấn tìm kiếm: `LessonModel.find({ chapter: chapterId })` và `LessonModel.find({ course: courseId })` được sử dụng song song ở nhiều nơi.

### Phân tích Nguy cơ & Relational Trade-off
1. **Dư thừa dữ liệu (Data Redundancy)**: Theo chuẩn chuẩn hóa 3NF, một `Lesson` thuộc về một `Chapter`, và mỗi `Chapter` đã thuộc về một `Course`. Việc lưu `courseId` trên `Lesson` là một trường khóa ngoại phi chuẩn hóa (denormalized FK).
2. **Nguy cơ Bất đồng bộ (Data Anomaly)**:
   - Tồn tại nguy cơ `Lesson.courseId != Chapter.courseId`. Nếu một bài học bị gán nhầm sang `courseId` khác với khóa học của chương cha, các câu query theo `courseId` và theo `chapterId` sẽ trả về kết quả mâu thuẫn.
3. **Đánh giá giải pháp**:
   - Nếu bỏ `courseId` trên `Lesson`: Cần JOIN qua `Chapter` để lọc bài học theo khóa học (`lessons.chapter.courseId`).
   - Nếu giữ `courseId` trên `Lesson`: Giữ nguyên tính tương thích 100% với logic Mongoose cũ và các query trực tiếp theo `courseId`, nhưng cần thêm ràng buộc ứng dụng hoặc composite foreign key.
   - **Recommendation**: Tạm thời giữ cả hai trường `chapterId` và `courseId` để tương thích với API hiện hành, nhưng ở tầng Service khi tạo Lesson bắt buộc phải validate `chapter.courseId === courseId`.

---

## 2. NỘP BÀI KIỂM TRA (QUIZ SUBMISSION) & UNIQUE CONSTRAINT

### Thực trạng trong Source Code
- **Trong Schema hiện tại**:
  ```prisma
  @@unique([quizId, userId])
  ```
- **Kiểm tra trong Service** ([src/services/quizSubmission.service.ts](file:///d:/e-learning_server/src/services/quizSubmission.service.ts#L30-L32)):
  ```ts
  const existing = await QuizSubmissionModel.findOne({ quiz: quizId, user: userId })
  if (existing) return { success: false, statusCode: 400, message: 'You have already submitted this quiz' }
  ```
- **Kiểm tra chức năng Làm lại / Retry**:
  - Toàn bộ backend **hoàn toàn không có** endpoint hay logic cho phép học viên thi lại hoặc lưu nhiều lần thi (`attempt`).
  - [src/services/certificate.service.ts](file:///d:/e-learning_server/src/services/certificate.service.ts#L44) cũng chỉ lấy duy nhất 1 bản ghi nộp bài theo từng quiz:
    ```ts
    const quizSubmission = quizSubmissions.find((submission) => submission.quiz.toString() === quiz._id.toString())
    ```

### Đánh giá Rủi ro
- Ràng buộc `@@unique([quizId, userId])` **hoàn toàn đúng với logic hiện tại của hệ thống**.
- **Cảnh báo nghiệp vụ (Business Scalability Risk)**: Nếu trong tương lai sản phẩm muốn bổ sung tính năng "Làm lại bài thi" (Retake Quiz / Multiple Attempts) hoặc "Giảng viên cho phép thi lại", ràng buộc unique này sẽ chặn đứng việc lưu submission mới.
- **Recommendation**: Nếu mục tiêu là bảo lưu logic hiện tại: Giữ `@@unique([quizId, userId])`. Nếu muốn sẵn sàng mở rộng: Bổ sung trường `attempt Int @default(1)` và đổi thành `@@unique([quizId, userId, attempt])`.

---

## 3. CÂU HỎI & ĐÁP ÁN (QUESTION / ANSWER REALITY)

### Thực trạng trong Source Code
- **Trong Mongoose Model** ([src/models/question.model.ts](file:///d:/e-learning_server/src/models/question.model.ts)):
  ```ts
  options: [{ type: String, required: true }] // Mảng plain text
  answer: { type: String, required: true }    // Plain text
  type: QuestionType (MULTIPLE_CHOICE | FILL_IN_BLANK)
  ```
- **Trong Service Chấm điểm** ([src/services/quizSubmission.service.ts](file:///d:/e-learning_server/src/services/quizSubmission.service.ts#L41-L46)):
  ```ts
  for (const ans of answers) {
    const question = await QuestionModel.findById(ans.question)
    if (question && question.answer === ans.selectedAnswer) {
      score += question.points || 1
    }
  }
  ```

### Phát hiện quan trọng
1. **`options` trong MongoDB là gì?**: Là một mảng chuỗi văn bản thuần túy (`string[]`), **hoàn toàn KHÔNG có ID** (không phải Subdocument ObjectId).
2. **`answer` lưu cái gì?**: Lưu trực tiếp chuỗi text của đáp án đúng (ví dụ: `"Hà Nội"`, `"JavaScript"`).
3. **`selectedAnswer` là gì?**: Học viên gửi lên trực tiếp chuỗi text mà họ đã chọn hoặc đã gõ vào ô điền từ.
4. **Cơ chế so khớp điểm**: Code thực hiện so sánh chuỗi trực tiếp: `question.answer === ans.selectedAnswer`.
5. **Multiple Choice có cho chọn nhiều đáp án không?**: **KHÔNG**. Logic chỉ so sánh 1 chuỗi đơn lẻ, bản chất là Single Choice (chọn 1 đáp án duy nhất).
6. **Fill-in-the-blank hoạt động thế nào?**: Hoàn toàn tương tự trắc nghiệm! Học viên gõ một chuỗi, hệ thống so sánh `===` với chuỗi `question.answer`.

### Đánh giá Prisma Schema hiện tại
- Trong `schema.prisma`, chúng ta đã thiết kế bảng `QuestionOption` có `id UUID`.
- **Vấn đề phát sinh**: Nếu frontend gửi lên chuỗi văn bản (`"Đáp án A"`) thay vì Option ID, việc so khớp sẽ gặp lệch pha trừ khi:
  - Hoặc `Question.options` được giữ dạng `String[]` (PostgreSQL `TEXT[]`) như MongoDB cũ.
  - Hoặc bảng `question_options` chỉ dùng để lưu danh sách đáp án, còn `selected_answer` vẫn lưu text.
- **Recommendation**: Cần xác nhận rõ: Giữ `options String[]` trên bảng `questions` (đơn giản, khớp 100% code cũ) hay tách bảng `question_options`.

---

## 4. QUAN HỆ CỦA QUIZ (QUIZ RELATIONSHIPS)

### Thực trạng trong Source Code
- **Trong Mongoose Model** ([src/models/quiz.model.ts](file:///d:/e-learning_server/src/models/quiz.model.ts)):
  - `lesson`: `ObjectId` (Required)
  - `courseId`: `ObjectId` (Required)
- **Trong Service** ([src/services/quiz.service.ts](file:///d:/e-learning_server/src/services/quiz.service.ts#L24)):
  - `const existingQuiz = await QuizModel.findOne({ lesson: lessonDoc._id })` -> Chặn tạo nếu đã có. Do đó, **một lesson chỉ có tối đa một quiz**. Việc đặt `@unique` trên `lessonId` là hoàn toàn chính xác.
- **Về trường `courseId` trên `Quiz`**:
  - [src/services/certificate.service.ts](file:///d:/e-learning_server/src/services/certificate.service.ts#L25) gọi trực tiếp: `const quizzes = await QuizModel.find({ courseId })`.
  - Nếu không có `courseId` trên `Quiz`, hệ thống bắt buộc phải JOIN từ `Quiz` sang `Lesson` rồi sang `Course`.
  - Tương tự như Lesson, đây là trường denormalized FK để tối ưu tốc độ đọc.

---

## 5. HÀNH VI XÓA BÌNH LUẬN (COMMENT DELETE BEHAVIOR)

### Thực trạng trong Source Code
- Trong MongoDB ([src/services/comment.service.ts](file:///d:/e-learning_server/src/services/comment.service.ts#L124)):
  ```ts
  await CommentModel.findByIdAndDelete(commentId)
  ```
- **Hành vi thực tế của MongoDB hiện tại**:
  - MongoDB **KHÔNG tự động xóa các câu trả lời con (replies)** khi bình luận cha bị xóa.
  - Các comment con có `parentId = commentId` bị bỏ rơi (orphaned comments) trong cơ sở dữ liệu.
- **Trong Prisma Schema hiện tại**:
  ```prisma
  parent Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  ```
- **Đánh giá rủi ro**:
  - Với `onDelete: Cascade`, khi xóa comment cha, PostgreSQL sẽ **tự động xóa sạch toàn bộ replies con**.
  - Đây là sự **thay đổi hành vi (Behavior Change)** so với MongoDB cũ. Tuy nhiên, thay đổi này là **hợp lý và tích cực** trong cơ sở dữ liệu quan hệ, giúp tránh rác dữ liệu mồ côi.

---

## 6. HÀNH VI XÓA NGƯỜI DÙNG (USER DELETE & CASCADE RISKS)

Trong `schema.prisma`, có nhiều quan hệ từ `User` được gán `onDelete: Cascade`. Đây là khu vực tiềm ẩn rủi ro mất dữ liệu lịch sử cao nhất:

| Quan hệ | Hiện tại trong Prisma | Thực tế Mongoose hiện tại | Đánh giá Rủi ro | Khuyến nghị |
| :--- | :--- | :--- | :--- | :--- |
| `User -> Order` | **`Restrict`** | Mongoose không xóa Order | **AN TOÀN**. Bảo vệ tuyệt đối lịch sử tài chính/doanh thu. | Giữ nguyên `Restrict` |
| `User -> Certificate` | **`Restrict`** | Mongoose không xóa Certificate | **AN TOÀN**. Chứng chỉ có giá trị pháp lý vĩnh viễn. | Giữ nguyên `Restrict` |
| `User -> Enrollment` | **`Cascade`** | Mongoose không xóa Enrollment | **NGUY HIỂM**. Nếu xóa User, toàn bộ lịch sử học tập, thời gian ghi danh của học viên sẽ bị xóa sổ, không thể thống kê báo cáo khóa học. | **Chuyển sang `Restrict`** |
| `User -> QuizSubmission`| **`Cascade`** | Mongoose không xóa Submission | **NGUY HIỂM**. Bảng điểm và bài làm của học viên bị xóa sạch. | **Chuyển sang `Restrict`** |
| `User -> Progress` | **`Cascade`** | Mongoose không xóa Progress | Trung bình. Xóa tiến độ bài học của user. | Cân nhắc `Cascade` |
| `User -> Rating` | **`Cascade`** | Mongoose không xóa Rating | Trung bình. Nếu xóa user thì đánh giá sao bị mất theo, có thể làm thay đổi điểm trung bình của khóa học. | Nên chuyển sang `SetNull` (nếu cho phép vô danh) hoặc `Restrict` |
| `User -> Comment` | **`Cascade`** | Mongoose không xóa Comment | Trung bình. Xóa tài khoản sẽ làm đứt mạch thảo luận nếu xóa cả comment. | Giữ `Cascade` hoặc gán soft-delete |
| `User -> FavoriteCourse`| **`Cascade`** | Xóa khỏi danh sách | **AN TOÀN**. Dữ liệu cá nhân tức thời. | Giữ nguyên `Cascade` |
| `User -> Notification` | **`Cascade`** | Mongoose không xóa | **AN TOÀN**. Xóa tài khoản thì xóa thông báo của họ. | Giữ nguyên `Cascade` |

> [!WARNING]
> **Điểm cần sửa gấp**: `User -> Enrollment` và `User -> QuizSubmission` không nên dùng `Cascade`. Nếu admin xóa nhầm một tài khoản, toàn bộ dữ liệu lịch sử học tập và thi cử sẽ bị xóa vĩnh viễn không thể khôi phục!

---

## 7. CUỘC TRÒ CHUYỆN & `lastMessageId` (CONVERSATION)

### Thực trạng trong Source Code
- **Trong Mongoose Model** ([src/models/conversation.model.ts](file:///d:/e-learning_server/src/models/conversation.model.ts)):
  ```ts
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }
  ```
- **Trong Service** ([src/services/message.service.ts](file:///d:/e-learning_server/src/services/message.service.ts#L24)):
  ```ts
  await ConversationModel.findByIdAndUpdate(conversationId, { lastMessage: message._id })
  ```
- **Hiện trạng trong Prisma Schema**:
  ```prisma
  lastMessageId String? @map("last_message_id") @db.Uuid
  ```
  Trường này hiện đang đứng độc lập, **chưa có Foreign Key relation** trỏ tới `Message`.

### Lý do kỹ thuật & Đề xuất
- **Nguyên nhân**: Quan hệ giữa `Conversation` và `Message` là quan hệ 2 chiều:
  - `Conversation (1) -> (N) Message` (Message thuộc về Conversation).
  - `Conversation -> (1) Message` (Tin nhắn cuối cùng).
- Nếu tạo Foreign Key cứng 2 chiều, sẽ phát sinh **Circular Dependency** (Phụ thuộc vòng): Bạn không thể tạo Conversation nếu chưa có Message, và không thể tạo Message nếu chưa có Conversation.
- **Recommendation**:
  - Giữ trường `lastMessageId` là chuỗi UUID độc lập như hiện tại, cập nhật bằng code ứng dụng.
  - HOẶC tạo quan hệ nullable 1 chiều với tên relation rõ ràng (`@relation("ConversationLastMessage")`) và không bật cascade.

---

## 8. THÔNG BÁO & TRƯỜNG ĐA HÌNH (`relatedId`)

### Thực trạng trong Source Code
- Bằng chứng từ các lệnh gọi `pushNotificationService`:
  - Từ `course.service.ts`: `relatedId = course._id`
  - Từ `lesson.service.ts`: `relatedId = lesson._id`
  - Từ `order.service.ts`: `relatedId = order._id`
  - Từ `quizSubmission.service.ts`: `relatedId = submission._id`
  - Từ `rating.service.ts`: `relatedId = rating._id`
  - Từ `comment.service.ts`: `relatedId = lesson._id`
- **Kết luận**: `relatedId` chính xác 100% là một **Polymorphic Reference** (Tham chiếu đa hình).

### Đánh giá Trade-off
- **Giải pháp 1: Giữ `relatedId String? @db.VarChar(255)` (Hiện tại đang áp dụng)**:
  - *Ưu điểm*: Đơn giản, linh hoạt tuyệt đối, không làm thay đổi cấu trúc bảng, khớp 100% với MongoDB cũ.
  - *Nhược điểm*: Không có tính toàn vẹn tham chiếu cấp Database (Database không kiểm tra được ID đó có thực sự tồn tại ở bảng Course/Lesson/Order hay không).
- **Giải pháp 2: Tách thành các khóa ngoại riêng (`courseId`, `lessonId`, `orderId`,...)**:
  - *Ưu điểm*: Có Foreign Key kiểm tra toàn vẹn dữ liệu.
  - *Nhược điểm*: Làm phình to bảng thông báo với hàng loạt cột nullable, phải sửa lại toàn bộ service push notification.
- **Recommendation**: **Giữ nguyên `relatedId String?`** như trong schema hiện tại.

---

## 9. CÁC MẢNG NỘI DUNG KHÓA HỌC (ARRAY FIELDS)

- **Các trường kiểm tra**: `requirements`, `benefits`, `techniques`, `documents`.
- **Kiểm tra trong Mongoose Schema** ([src/models/course.model.ts](file:///d:/e-learning_server/src/models/course.model.ts#L106-L117)):
  Cả 4 trường đều được định nghĩa là:
  ```ts
  type: [String]
  ```
- **Kiểm tra trong Service** ([src/services/course.service.ts](file:///d:/e-learning_server/src/services/course.service.ts#L58-L61)):
  Chỉ validate `Array.isArray(...)`.
- **Kết luận**: Đây là các mảng chuỗi đơn giản 100% (`string[]`), hoàn toàn không chứa object lồng nhau hay metadata.
- **Đánh giá Schema**: Cột `String[] @default([])` trong PostgreSQL (kiểu `TEXT[]`) là sự lựa chọn hoàn hảo, gọn nhẹ và tối ưu nhất.

---

## 10. ĐƠN HÀNG (ORDER & COURSE CARDINALITY)

### Thực trạng trong Source Code
- **Trong Mongoose Model** ([src/models/order.model.ts](file:///d:/e-learning_server/src/models/order.model.ts)):
  ```ts
  course: { type: Schema.Types.ObjectId, ref: 'Course' }
  ```
- **Trong Service** ([src/services/order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L12-L19)):
  Hàm `createOrderService` nhận trực tiếp `courseId: string` duy nhất.
- **Kết luận**: Hệ thống hiện tại áp dụng mô hình **1 Order = 1 Course** (Direct Single Course Checkout).
- Hệ thống chưa có tính năng Giỏ hàng nhiều khóa học (Multi-item Cart Order).
- **Đánh giá Schema**: Bảng `orders` có trường `courseId String @db.Uuid` là hoàn toàn chính xác với code hiện tại.

---

## 11. BẢNG TỔNG HỢP KIỂM TRA HÀNH VI XÓA (DELETE BEHAVIOR AUDIT)

| Quan hệ (Parent -> Child) | onDelete trong Schema | Hành vi thực tế MongoDB | Mức độ Rủi ro | Đề xuất khuyến nghị (Recommendation) |
| :--- | :--- | :--- | :--- | :--- |
| `User -> Order` | `Restrict` | Bỏ rơi Order (Orphaned) | An toàn | **Giữ `Restrict`** (Bảo vệ dữ liệu tài chính) |
| `Course -> Order` | `Restrict` | Bỏ rơi Order | An toàn | **Giữ `Restrict`** |
| `Coupon -> Order` | `SetNull` | Bỏ rơi Order | An toàn | **Giữ `SetNull`** |
| `User -> Certificate` | `Restrict` | Bỏ rơi Cert | An toàn | **Giữ `Restrict`** (Bảo vệ bằng cấp) |
| `Course -> Certificate` | `Restrict` | Bỏ rơi Cert | An toàn | **Giữ `Restrict`** |
| `User -> Enrollment` | `Cascade` | Bỏ rơi Enrollment | **RỦI RO CAO** | **Nên đổi sang `Restrict`** để tránh xóa mất lịch sử học viên |
| `Course -> Enrollment` | `Cascade` | Bỏ rơi Enrollment | Trung bình | Cân nhắc `Restrict` hoặc `Cascade` có điều kiện |
| `User -> QuizSubmission`| `Cascade` | Bỏ rơi Submission | **RỦI RO CAO** | **Nên đổi sang `Restrict`** để bảo vệ bảng điểm |
| `Quiz -> QuizSubmission`| `Cascade` | Bỏ rơi Submission | Trung bình | Giữ `Cascade` (xóa quiz thì xóa bài thi tương ứng) |
| `User -> Progress` | `Cascade` | Bỏ rơi Progress | Thấp | Giữ `Cascade` |
| `User -> Rating` | `Cascade` | Bỏ rơi Rating | Trung bình | Cân nhắc đổi sang `SetNull` để không làm tụt điểm rating |
| `Course -> Rating` | `Cascade` | Bỏ rơi Rating | Thấp | Giữ `Cascade` |
| `Comment -> Replies` | `Cascade` | Bỏ rơi Replies con | Khác biệt Mongo | Giữ `Cascade` (dọn dẹp cây thảo luận sạch sẽ) |
| `Course -> Chapters` | `Cascade` | Bỏ rơi Chapters | Thấp | Giữ `Cascade` |
| `Chapter -> Lessons` | `Cascade` | Bỏ rơi Lessons | Thấp | Giữ `Cascade` |
| `Lesson -> Quiz` | `Cascade` | Bỏ rơi Quiz | Thấp | Giữ `Cascade` |
| `Quiz -> Questions` | `Cascade` | Xóa bằng code (`deleteMany`) | **Khớp 100%** | Giữ `Cascade` |
| `Question -> Options` | `Cascade` | Embedded | **Khớp 100%** | Giữ `Cascade` |
| `Submission -> Answers` | `Cascade` | Embedded | **Khớp 100%** | Giữ `Cascade` |
| `Conversation -> Msgs` | `Cascade` | Bỏ rơi Messages | Trung bình | Giữ `Cascade` (xóa hội thoại xóa tin nhắn) |
| `User -> Message` | `Restrict` | Bỏ rơi Messages | An toàn | **Giữ `Restrict`** |

---

## 12. CHIẾN LƯỢC ĐỊNH DANH (ID STRATEGY & COMPATIBILITY)

### Vấn đề cốt lõi khi Mapping ID
- MongoDB `ObjectId`: Chuỗi **24 ký tự hex** (12 bytes nhị phân), ví dụ: `65f123456789abcdef012345`.
- PostgreSQL `UUID`: Chuỗi **32 ký tự hex có 4 dấu gạch ngang** (16 bytes nhị phân, tổng 36 ký tự), ví dụ: `65f12345-6789-abcd-ef01-23456789abcd`.

### Nguy cơ kỹ thuật
Nếu khai báo `@default(uuid()) @db.Uuid`, PostgreSQL sẽ **từ chối lưu trữ chuỗi 24 ký tự hex của MongoDB** vì không đúng định dạng chuẩn RFC 4122 của UUID.

### Hai kịch bản giải quyết khi Migrate dữ liệu (Step 4 & 5):
1. **Kịch bản A: Chuyển đổi sang UUID chuẩn (Đang cấu hình trong Schema)**:
   - Trong quá trình chạy script migrate dữ liệu: Sinh một bảng mapping `_mongo_id_map (mongo_id, pg_uuid)`.
   - Mỗi `ObjectId` cũ sẽ được sinh một `UUID` mới (hoặc dùng thuật toán UUIDv5 có namespace để sinh UUID tất định từ chuỗi ObjectId).
   - Tầng API response sẽ cung cấp alias `_id: record.id` để client không bị ảnh hưởng.
2. **Kịch bản B: Giữ ID dạng String 24 ký tự (Dự phòng tương thích cao)**:
   - Đổi trong schema: `id String @id @default(cuid())` hoặc `id String @id` (bỏ `@db.Uuid`).
   - Cho phép giữ nguyên xi chuỗi 24 ký tự ObjectId của MongoDB sang cột `id` kiểu `VARCHAR/TEXT` của PostgreSQL mà không cần chuyển đổi định dạng.

---

## 13. ĐỐI CHIẾU KIỂU DỮ LIỆU (DATA TYPE AUDIT)

| Kiểu trong Prisma Schema | Trường áp dụng | Mongoose Type | Nguy cơ / Cần lưu ý |
| :--- | :--- | :--- | :--- |
| `Decimal(12, 2)` | `price`, `oldPrice`, `amount`, `discount`, `total`, `value` | `Number` (Float) | **RẤT TỐT**. Tránh được lỗi sai số dấu phẩy động của MongoDB. Khi code TypeScript đọc ra sẽ là kiểu `Prisma.Decimal`, cần gọi `.toNumber()` khi trả JSON cho API cũ. |
| `Decimal(5, 2)` | `grade` (Certificate) | `Number` | Tốt, lưu điểm từ 0.00 đến 100.00. |
| `SmallInt` | `Rating.rate` | `Number` (1-5) | Tối ưu dung lượng (2 bytes), an toàn. |
| `String @db.VarChar(n)` | `title`, `email`, `slug`, `code` | `String` | Đảm bảo dữ liệu cũ không có chuỗi nào vượt quá giới hạn ký tự `n` đã đặt (ví dụ: email > 255, code > 50). |
| `Boolean` | `isVerified` | `Boolean` hoặc `''` | Dữ liệu cũ có thể chứa chuỗi rỗng `''`. Script migrate bắt buộc phải ép về `false`. |
| `String[]` | `requirements`, `benefits` | `[String]` | Hoàn toàn tương thích native PostgreSQL array. |

---

## 14. KẾT LUẬN & ĐÁNH GIÁ CUỐI CÙNG (FINAL VERDICT)

### A. SAFE (Các phần an toàn, chính xác và có thể giữ nguyên)
1. Cấu trúc toàn bộ **15 Enums** với các mapping `@map` chính xác.
2. Thiết kế quan hệ và các bảng thực thể: `users`, `categories`, `courses`, `chapters`, `lessons`, `quizzes`, `orders`, `coupons`, `progress`, `certificates`, `favorite_courses`.
3. Bảng chuẩn hóa FAQ `course_faqs`.
4. Ràng buộc 1 Order = 1 Course (`orders.courseId`).
5. Ràng buộc 1 Lesson = 1 Quiz (`quizzes.lessonId @unique`).
6. Trường đa hình `notifications.relatedId String?`.
7. Các trường mảng chuỗi `String[]` trên `courses`.
8. Hành vi `onDelete: Restrict` trên `orders` và `certificates`.

### B. NEEDS REVIEW (Cần xác nhận nghiệp vụ)
1. **`QuestionOption` vs `Question.options String[]`**:
   - Hiện tại code Mongoose so sánh trực tiếp text `question.answer === ans.selectedAnswer`. Việc tách bảng `question_options` có thể làm phức tạp hóa nghiệp vụ thi cử nếu không thay đổi API payload.
2. **`QuizSubmission @@unique([quizId, userId])`**:
   - Đang đúng với code hiện tại (1 lần thi duy nhất). Cần xác nhận xem có cần mở rộng hỗ trợ nhiều lần thi (`attempt`) trong tương lai gần hay không.
3. **`Conversation.lastMessageId`**:
   - Hiện để String UUID tự do, không có relation để tránh khóa ngoại vòng (circular FK).

### C. MUST FIX (Bắt buộc phải điều chỉnh trước khi chốt Schema)
1. **Sửa `onDelete` của `User -> Enrollment` và `User -> QuizSubmission`**:
   - **Hiện tại**: `onDelete: Cascade`.
   - **Nguy cơ**: Xóa user sẽ vô tình xóa sạch toàn bộ lịch sử ghi danh và toàn bộ bảng điểm thi cử.
   - **Bắt buộc sửa thành**: `onDelete: Restrict` để bảo vệ dữ liệu lịch sử của nền tảng đào tạo.
2. **Làm rõ chiến lược ID**:
   - Xác nhận chọn **UUID (`@db.Uuid`)** kết hợp mapping script chuyển đổi, hay chuyển sang **String ID thuần** để lưu trực tiếp chuỗi 24 hex của MongoDB.

---

### BÁO CÁO TỔNG KẾT THEO YÊU CẦU:
- **Số vấn đề SAFE**: **8 hạng mục lớn** (bao quát hầu hết cấu trúc bảng và quan hệ chính).
- **Số vấn đề NEEDS REVIEW**: **3 vấn đề** (`QuestionOption`, `Quiz attempt`, `lastMessage relation`).
- **Số vấn đề MUST FIX**: **2 vấn đề** (`onDelete: Cascade` trên lịch sử học tập/thi cử, và cơ chế chuyển đổi `ObjectId -> UUID`).

Tôi đã dừng lại tại đây và **chưa sửa bất kỳ dòng nào trong `schema.prisma`**. Xin mời bạn xem xét báo cáo và chỉ đạo hướng xử lý cho các điểm trên!
