# TÀI LIỆU THIẾT KẾ SCHEMA POSTGRESQL & PRISMA (POSTGRES SCHEMA DESIGN)

> **Tài liệu phục vụ**: STEP 3 - THIẾT KẾ POSTGRESQL SCHEMA + PRISMA  
> **Nguyên tắc**: Đây là bước THIẾT KẾ (DESIGN STEP). KHÔNG migrate dữ liệu, KHÔNG sửa đổi controllers/services/routes, KHÔNG xóa Mongoose.  
> **Schema file**: [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma)  
> **Trạng thái Prisma Validation**: `VALID` (`npx prisma validate` PASS 100%).

---

## 1. TỔNG SỐ POSTGRESQL TABLES

Thiết kế bao gồm **26 Bảng (Tables)**:
- **19 Bảng ánh xạ trực tiếp từ 19 Mongoose Models**.
- **7 Bảng chuẩn hóa quan hệ (Normalized / Junction Tables)** nhằm loại bỏ các mảng nhúng (embedded arrays/subdocuments) và mảng ObjectId không chuẩn trong MongoDB.

---

## 2. MAPPING MONGODB MODEL -> POSTGRESQL TABLE

| STT | MongoDB Model (Mongoose) | PostgreSQL Table (`@@map`) | Kiểu Table | Vai trò chính |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `User` | `users` | Entity Table | Tài khoản người dùng, giáo viên, quản trị viên |
| 2 | `Category` | `categories` | Entity Table | Danh mục khóa học |
| 3 | `Course` | `courses` | Entity Table | Thông tin khóa học |
| 4 | *(Embedded in Course)* | `course_faqs` | Normalized Table | Danh sách câu hỏi thường gặp (từ `course.info.qa`) |
| 5 | `Chapter` | `chapters` | Entity Table | Chương học trong khóa |
| 6 | `Lesson` | `lessons` | Entity Table | Bài học (Video / Text) |
| 7 | `Quiz` | `quizzes` | Entity Table | Bài kiểm tra của bài học (1-1 với Lesson) |
| 8 | `Question` | `questions` | Entity Table | Câu hỏi trong Quiz |
| 9 | *(Embedded in Question)* | `question_options` | Normalized Table | Lựa chọn đáp án (từ `question.options`) |
| 10 | `QuizSubmission` | `quiz_submissions` | Entity Table | Lịch sử nộp bài quiz của học viên |
| 11 | *(Embedded in QuizSub)* | `quiz_submission_answers`| Normalized Table | Chi tiết câu trả lời (từ `quizSubmission.answers`) |
| 12 | `Order` | `orders` | Entity Table | Đơn hàng mua khóa học |
| 13 | `Coupon` | `coupons` | Entity Table | Mã giảm giá |
| 14 | *(Array in Coupon)* | `coupon_courses` | Junction Table (N:N) | Khóa học áp dụng coupon (từ `coupon.courses[]`) |
| 15 | `Enrollment` | `enrollments` | Entity Table | Ghi danh học viên vào khóa học |
| 16 | `Progress` | `progress` | Entity Table | Tiến độ hoàn thành từng bài học |
| 17 | `Certificate` | `certificates` | Entity Table | Chứng chỉ hoàn thành khóa học |
| 18 | `Rating` | `ratings` | Entity Table | Đánh giá sao & nhận xét khóa học |
| 19 | `FavoriteCourse` | `favorite_courses` | Junction Table (N:N) | Khóa học yêu thích của học viên |
| 20 | `Comment` | `comments` | Entity Table (Tree) | Bình luận bài học (phân cấp cây `parentId`) |
| 21 | *(Arrays in Comment)* | `comment_reactions` | Junction Table (N:N) | Lượt Like/Dislike (từ `likes[]`, `dislikes[]`) |
| 22 | `Conversation` | `conversations` | Entity Table | Cuộc hội thoại chat (1-1 hoặc nhóm Q&A) |
| 23 | *(Array in Conv)* | `conversation_participants`| Junction Table (N:N)| Thành viên trong cuộc trò chuyện |
| 24 | `Message` | `messages` | Entity Table | Tin nhắn trong cuộc trò chuyện |
| 25 | *(Array in Message)* | `message_reads` | Junction Table (N:N) | Đánh dấu người đã đọc (từ `message.readBy[]`) |
| 26 | `Notification` | `notifications` | Entity Table | Thông báo hệ thống gửi đến người dùng |

---

## 3. TỔNG QUAN QUAN HỆ THỰC THỂ (ER RELATIONSHIP OVERVIEW)

```
[users] ──(1:N)──► [courses] ──(1:N)──► [chapters] ──(1:N)──► [lessons] ──(1:1)──► [quizzes]
   │                   │                                                      │
   ├──(1:N)──► [orders]├──(1:N)──► [course_faqs]                             └──(1:N)──► [questions]
   ├──(1:N)──► [enrollments]                                                                │
   ├──(1:N)──► [progress]                                                        ┌──────────┴──────────┐
   ├──(1:N)──► [certificates]                                                    ▼                     ▼
   ├──(1:N)──► [ratings]                                                [question_options]   [quiz_submission_answers]
   ├──(1:N)──► [comments] (Self-ref: parent_id)                                                       ▲
   ├──(N:N)──► [favorite_courses] ◄──(N:N)── [courses]                                                │
   ├──(N:N)──► [coupon_courses]   ◄──(N:N)── [coupons] ──(1:N)──► [orders]           [quiz_submissions] ◄── [quizzes]
   ├──(N:N)──► [conversation_participants] ◄──(N:N)── [conversations] ──(1:N)──► [messages] ──(N:N)──► [message_reads]
   └──(1:N)──► [notifications]
```

---

## 4. CHIẾN LƯỢC ĐỊNH DANH (ID STRATEGY)

## ID MIGRATION STRATEGY

### 1. Phân tích hiện trạng
- Trong MongoDB, mọi entity sử dụng `ObjectId` (chuỗi 24 ký tự hex).
- Các API controllers trả về object chứa trường `_id`.
- Các middleware validator sử dụng `isMongoId()`.
- Frontend hiện đang nhận và truyền các chuỗi 24 ký tự `_id`.

### 2. Định danh trong PostgreSQL Schema
- Trong PostgreSQL, khóa chính được thiết kế chuẩn là **`UUID` (`String @id @default(uuid()) @db.Uuid`)**.
- Kiểu dữ liệu `UUID` của PostgreSQL lưu trữ 16 bytes nhị phân, cho tốc độ index B-Tree và Foreign Key join vượt trội so với VARCHAR.

### 3. Kế hoạch chuyển đổi dữ liệu (Data Migration - Phase 4)
Khi chuyển dữ liệu từ MongoDB sang PostgreSQL:
- **Phương án ánh xạ**:
  Tạo một bảng lưu ánh xạ tạm thời hoặc deterministic mapping trong migration script:
  ```sql
  CREATE TABLE _mongo_to_postgres_id_map (
      mongo_id VARCHAR(24) PRIMARY KEY,
      pg_id UUID NOT NULL,
      collection_name VARCHAR(50) NOT NULL
  );
  ```
  Mỗi `ObjectId` (24 hex) khi insert sang PostgreSQL sẽ được sinh 1 `UUIDv4` (hoặc dùng `UUIDv5` sinh theo namespace kết hợp với `mongo_id` để đảm bảo tính tất định - deterministic).
  Mọi Foreign Key liên kết trong dữ liệu cũ sẽ tra cứu qua bảng map này để đảm bảo toàn vẹn tham chiếu.

### 4. Tính tương thích với Frontend & API Contract
- **Không vỡ Frontend**: Trong giai đoạn chuyển đổi Service Layer (Phase 5), Prisma trả về trường `id`. Để đảm bảo tương thích ngược 100% với Frontend mà không phải sửa client, tầng Service/Serializer sẽ thêm thuộc tính getter/alias `_id: record.id` trong response JSON:
  ```ts
  return { ...record, _id: record.id }
  ```
- **Middleware Validator**: Ở Phase 5, các validator sẽ được nới lỏng hoặc chuyển đổi để chấp nhận cả UUID và chuỗi ID (`isUUID()`).

---

## 5. CHIẾN LƯỢC DỮ LIỆU NHÚNG (EMBEDDED DATA STRATEGY)

| Cấu trúc Embedded trong Mongo | Giải pháp PostgreSQL | Lý do & Biện luận kỹ thuật |
| :--- | :--- | :--- |
| `Course.info.qa` | **Tách bảng `course_faqs`** | Cần hỗ trợ giáo viên CRUD riêng từng câu hỏi FAQ, sắp xếp thứ tự (`order`), tìm kiếm nội dung câu hỏi/câu trả lời qua SQL độc lập. |
| `Course.info` (`requirements`, `benefits`, `techniques`, `documents`) | **Giữ dạng mảng `String[]` (`TEXT[]` trong Postgres)** | Dữ liệu dạng danh sách bullet points tĩnh, luôn được load và update đồng thời với thông tin khóa học, không cần quan hệ hay join độc lập. PostgreSQL hỗ trợ kiểu native `TEXT[]` tối ưu tuyệt đối. |
| `Question.options` | **Tách bảng `question_options`** | Cần hỗ trợ lưu từng đáp án trắc nghiệm, có trường thứ tự `order`, sẵn sàng cho tính năng xáo trộn (shuffle) đáp án khi làm bài thi. |
| `QuizSubmission.answers` | **Tách bảng `quiz_submission_answers`** | Dữ liệu bài làm quan trọng. Cần lưu khóa ngoại `question_id`, đáp án đã chọn `selected_answer`, và cờ `is_correct` để phân tích tỷ lệ trả lời đúng từng câu. |
| `User.socialLinks` | **Flatten thành 3 cột `social_facebook`, `social_instagram`, `social_github`** | Số lượng mạng xã hội cố định, việc flatten thành các cột độc lập giúp kiểm tra, cập nhật và index trực tiếp mà không cần cú pháp JSON lồng. |
| `Coupon.courses` | **Tách bảng junction `coupon_courses`** | Quan hệ N-N giữa mã giảm giá và khóa học. Khi kiểm tra đơn hàng, query `SELECT 1 FROM coupon_courses WHERE coupon_id = $1 AND course_id = $2` có index chạy trong O(1). |
| `Conversation.participants` | **Tách bảng junction `conversation_participants`** | Quan hệ N-N giữa cuộc trò chuyện và người dùng. Cần lưu thêm metadata `joined_at` để biết thời điểm vào nhóm chat. |
| `Comment.likes` & `dislikes` | **Tách bảng `comment_reactions`** | Mảng ObjectId trong Document là anti-pattern unbounded array. Bảng `comment_reactions` với unique `(comment_id, user_id)` chặn duplicate like/dislike và cho phép đếm lượt like bằng `COUNT(*)` cực nhanh. |
| `Message.readBy` | **Tách bảng `message_reads`** | Quản lý biên nhận đã đọc (read receipts) với `(message_id, user_id)` và thời điểm `read_at`. |
| `User.courses` & `favorites` | **LOẠI BỎ MẢNG** | Dữ liệu thừa thãi trong MongoDB. Thay thế hoàn toàn bằng việc truy vấn bảng `enrollments` và `favorite_courses`. |
| `Course.chapters`, `Chapter.lessons`, `Quiz.questions` | **LOẠI BỎ MẢNG** | Thay thế hoàn toàn bằng Foreign Key một chiều ở bảng con (`course_id`, `chapter_id`, `quiz_id`). |

---

## 6. ÁNH XẠ ENUMS (ENUM MAPPING)

Tất cả các Enum được định nghĩa trong [src/types/enum.ts](file:///d:/e-learning_server/src/types/enum.ts) đã được ánh xạ chính xác sang Prisma Enums và sử dụng `@map` để giữ nguyên giá trị chữ thường (lowercase) trong Database:

1. **`UserRole`**: `ADMIN ("admin")`, `USER ("user")`, `TEACHER ("teacher")`
2. **`UserStatus`**: `ACTIVE ("active")`, `INACTIVE ("inactive")`
3. **`CourseStatus`**: `APPROVED ("approved")`, `PENDING ("pending")`, `REJECTED ("rejected")`
4. **`CourseLevel`**: `BEGINNER ("beginner")`, `INTERMEDIATE ("intermediate")`, `ADVANCED ("advanced")`
5. **`CourseType`**: `PAID ("paid")`, `FREE ("free")`
6. **`LessonType`**: `VIDEO ("video")`, `TEXT ("text")`
7. **`ECouponType`**: `PERCENTAGE ("percentage")`, `NUMBER ("number")`
8. **`EOrderStatus`**: `PENDING ("pending")`, `COMPLETED ("completed")`, `REJECTED ("rejected")`
9. **`EEnrollmentStatus`**: `ACTIVE ("active")`, `COMPLETED ("completed")`, `CANCELED ("canceled")`
10. **`CommentStatus`**: `APPROVED ("approved")`, `PENDING ("pending")`, `REJECTED ("rejected")`
11. **`ERatingStatus`**: `ACTIVE ("active")`, `INACTIVE ("inactive")`
12. **`ENotificationType`**: `COMMENT ("comment")`, `RATING ("rating")`, `ORDER ("order")`, `MESSAGE ("message")`, `SYSTEM ("system")`, `COURSE ("course")`, `LESSON ("lesson")`, `COMMENT_REPLY ("comment_reply")`, `QUIZ ("quiz")`
13. **`QuestionType`**: `MULTIPLE_CHOICE ("multiple_choice")`, `FILL_IN_BLANK ("fill_in_blank")`
14. **`EMessageType`**: `TEXT ("text")`, `IMAGE ("image")`, `FILE ("file")`
15. **`CommentReactionType`**: `LIKE ("like")`, `DISLIKE ("dislike")`

---

## 7. RÀNG BUỘC DUY NHẤT (UNIQUE CONSTRAINTS)

Bảng tổng hợp các ràng buộc Unique đã được cấu hình trong `schema.prisma` dựa trên bằng chứng nghiệp vụ:

1. `users`: `email` (Một email chỉ đăng ký 1 tài khoản).
2. `categories`: `name`, `slug` (Tên và slug danh mục không được trùng).
3. `courses`: `slug` (Slug URL của khóa học là duy nhất).
4. `lessons`: `@@unique([slug, courseId])` (Trong một khóa học, slug bài học không trùng lặp).
5. `quizzes`: `lessonId` (Mỗi bài học chỉ gắn tối đa 1 bài Quiz - Quan hệ 1-1).
6. `quiz_submissions`: `@@unique([quizId, userId])` (Mỗi học viên chỉ nộp bài 1 lần theo nghiệp vụ [quizSubmission.service.ts](file:///d:/e-learning_server/src/services/quizSubmission.service.ts#L30)).
7. `orders`: `code` (Mã đơn hàng là duy nhất).
8. `coupons`: `code` (Mã giảm giá là duy nhất).
9. `coupon_courses`: `@@id([couponId, courseId])` (Khóa học chỉ gắn vào coupon 1 lần).
10. `enrollments`: `@@unique([userId, courseId])` (Mỗi học viên chỉ enroll một khóa học 1 lần).
11. `progress`: `@@unique([userId, lessonId])` (Tiến độ học ghi nhận duy nhất theo cặp user - bài học).
12. `certificates`: `@@unique([userId, courseId])` (Mỗi học viên chỉ nhận 1 chứng chỉ trên 1 khóa học).
13. `ratings`: `@@unique([userId, courseId])` (Mỗi học viên chỉ đánh giá 1 lần trên 1 khóa học).
14. `favorite_courses`: `@@unique([userId, courseId])` (Không lưu trùng khóa học yêu thích).
15. `comment_reactions`: `@@unique([commentId, userId])` (Một người chỉ thả 1 reaction trên 1 comment).
16. `conversation_participants`: `@@id([conversationId, userId])` (Thành viên không bị trùng trong nhóm chat).
17. `message_reads`: `@@id([messageId, userId])` (Biên nhận đã đọc không bị trùng).

---

## 8. BỘ CHỈ MỤC (INDEXES STRATEGY)

Các index được tạo có chủ đích dựa trên các mẫu truy vấn thực tế trong code:

1. **`users`**:
   - `@@index([role])`: Lọc danh sách giáo viên (`role = 'teacher'`).
   - `@@index([status])`: Lọc tài khoản đang hoạt động.
   - `@@index([isVerified])`: Dành cho cron job quét người dùng chưa xác thực.
2. **`courses`**:
   - `@@index([authorId])`: Lấy danh sách khóa học của giáo viên.
   - `@@index([categoryId])`: Lọc khóa học theo danh mục.
   - `@@index([status, isDestroyed])`: Trang chủ lọc khóa học đã duyệt (`APPROVED`) và chưa xóa (`_destroy = false`).
3. **`course_faqs`**: `@@index([courseId, order])` phục vụ lấy danh sách FAQ theo thứ tự.
4. **`chapters`**: `@@index([courseId, order])` sắp xếp chương học theo thứ tự.
5. **`lessons`**: `@@index([chapterId, order])`, `@@index([courseId])` lấy bài học theo chương.
6. **`quizzes`**: `@@index([courseId])` lấy danh sách quiz của khóa học khi tính điểm chứng chỉ.
7. **`questions`**: `@@index([quizId])` lấy toàn bộ câu hỏi của quiz.
8. **`question_options`**: `@@index([questionId, order])` lấy đáp án theo thứ tự.
9. **`quiz_submissions`**: `@@index([userId])` thống kê kết quả làm bài của học viên.
10. **`orders`**:
    - `@@index([userId, courseId, status])`: Kiểm tra user đã mua khóa học hay chưa.
    - `@@index([courseId])`: Thống kê doanh thu theo khóa học.
11. **`coupons`**: `@@index([authorId])` giáo viên quản lý coupon của mình.
12. **`enrollments`**: `@@index([courseId])` lấy danh sách học viên trong khóa.
13. **`progress`**: `@@index([courseId])` đếm số bài học đã hoàn thành trong khóa.
14. **`ratings`**: `@@index([courseId, status])` tính điểm trung bình và hiển thị đánh giá khóa học.
15. **`comments`**:
    - `@@index([lessonId, status])`: Load bình luận theo bài học.
    - `@@index([courseId])`: Giáo viên quản lý bình luận trong khóa.
    - `@@index([parentId])`: Load bình luận con (reply).
16. **`messages`**: `@@index([conversationId, createdAt])` load lịch sử chat theo thời gian.
17. **`notifications`**: `@@index([receiverId, isRead, createdAt])` load thông báo người dùng theo trạng thái đọc.

---

## 9. HÀNH VI XÓA (DELETE BEHAVIOR)

| Foreign Key | Quan hệ | `onDelete` Behavior | Lý do & Căn cứ nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `categories.created_by_id` | User -> Category | **`SetNull`** | Nếu Admin tạo danh mục bị xóa, danh mục vẫn phải tồn tại cho các khóa học. |
| `courses.category_id` | Category -> Course | **`SetNull`** | Khóa học không được bị xóa mất khi danh mục bị xóa. |
| `courses.author_id` | User -> Course | **`Restrict`** | **Bảo vệ dữ liệu lịch sử**: Tuyệt đối không cho phép xóa User (Teacher) khi họ đang sở hữu khóa học có học viên theo học. |
| `course_faqs.course_id` | Course -> FAQ | **`Cascade`** | Câu hỏi FAQ phụ thuộc trực tiếp vào khóa học, xóa khóa học thì xóa FAQ. |
| `chapters.course_id` | Course -> Chapter | **`Cascade`** | Chương thuộc về khóa học. |
| `lessons.chapter_id` | Chapter -> Lesson | **`Cascade`** | Bài học thuộc về chương. |
| `lessons.course_id` | Course -> Lesson | **`Cascade`** | Bài học thuộc về khóa học. |
| `lessons.author_id` | User -> Lesson | **`Restrict`** | Không xóa giáo viên nếu bài học còn tồn tại. |
| `quizzes.lesson_id` | Lesson -> Quiz | **`Cascade`** | Xóa bài học thì xóa quiz đính kèm. |
| `quizzes.created_by_id` | User -> Quiz | **`Restrict`** | Không xóa người tạo nếu quiz còn tồn tại. |
| `questions.quiz_id` | Quiz -> Question | **`Cascade`** | Code hiện tại: [quiz.service.ts](file:///d:/e-learning_server/src/services/quiz.service.ts#L98) xóa toàn bộ câu hỏi khi xóa quiz. |
| `question_options.question_id` | Question -> Option | **`Cascade`** | Xóa câu hỏi thì xóa các đáp án của nó. |
| `quiz_submissions.quiz_id` | Quiz -> Submission | **`Cascade`** | Xóa quiz thì xóa bài nộp tương ứng. |
| `quiz_submissions.user_id` | User -> Submission | **`Cascade`** | Bài thi của user. |
| `quiz_submission_answers.submission_id` | Sub -> Ans | **`Cascade`** | Xóa bài thi thì xóa chi tiết câu trả lời. |
| `orders.user_id` | User -> Order | **`Restrict`** | **Dữ liệu tài chính**: Tuyệt đối KHÔNG xóa đơn hàng khi tài khoản bị xóa. |
| `orders.course_id` | Course -> Order | **`Restrict`** | **Dữ liệu tài chính**: Không xóa đơn hàng đã mua khóa học. |
| `orders.coupon_id` | Coupon -> Order | **`SetNull`** | Xóa mã coupon không được làm mất lịch sử đơn hàng đã dùng mã. |
| `coupons.author_id` | User -> Coupon | **`SetNull`** | Người tạo bị xóa thì coupon chuyển về null. |
| `enrollments.user_id` | User -> Enrollment | **`Cascade`** | Xóa user thì xóa ghi danh (hoặc Restrict nếu cần kiểm toán). |
| `enrollments.course_id`| Course -> Enrollment | **`Cascade`** | Xóa khóa học thì xóa ghi danh. |
| `certificates.user_id` | User -> Certificate| **`Restrict`** | **Dữ liệu chứng thực bằng cấp**: Không được tự động cascade xóa chứng chỉ. |
| `certificates.course_id`| Course -> Cert | **`Restrict`** | Không xóa chứng chỉ đã cấp cho học viên. |
| `ratings.user_id` | User -> Rating | **`Cascade`** | User bị xóa thì gỡ đánh giá. |
| `ratings.course_id` | Course -> Rating | **`Cascade`** | Khóa học bị xóa thì gỡ đánh giá. |
| `comments.parent_id` | Comment -> Reply | **`Cascade`** | Xóa bình luận cha thì xóa các câu trả lời con. |
| `messages.sender_id` | User -> Message | **`Restrict`** | Không cascade xóa tin nhắn làm vỡ cuộc trò chuyện của người còn lại. |
| `notifications.sender_id`| User -> Notif | **`SetNull`** | Người gửi bị xóa thì thông báo vẫn giữ cho người nhận. |
| `notifications.receiver_id`| User -> Notif | **`Cascade`** | Người nhận bị xóa thì xóa thông báo của họ. |

---

## 10. CÁC GIẢ ĐỊNH (ASSUMPTIONS)

1. **Giả định về ID String compatibility**:
   - Schema dùng `id String @id @default(uuid()) @db.Uuid`. Khi chuyển sang PostgreSQL, toàn bộ id mới sẽ là UUID chuẩn. Trong giai đoạn migration dữ liệu cũ, migration script sẽ tạo ánh xạ 1-1 từ ObjectId sang UUID.
2. **Giả định về giá trị Tiền tệ**:
   - `price`, `old_price`, `amount`, `discount`, `total` đều dùng kiểu `Decimal(12, 2)` (chuẩn tiền tệ, không dùng Float để tránh sai số tính toán thập phân).
3. **Giả định về Soft Delete**:
   - Các bảng `categories`, `courses`, `chapters` giữ trường `isDestroyed` (`_destroy`) để đảm bảo logic soft delete hiện tại không bị gãy.

---

## 11. CÁC ĐIỂM CHƯA CHẮC CHẮN (UNKNOWN - CẦN LƯU Ý)

1. **`Notification.relatedId` (UNKNOWN)**:
   - Trường này trong MongoDB lưu ObjectId trỏ đa hình (Polymorphic) tới 5 collection khác nhau (`Order`, `Course`, `Lesson`, `Quiz`, `Comment`).
   - Thiết kế hiện tại: Lưu `String? @map("related_id") @db.VarChar(255)` không tạo Foreign Key cứng trong database, xử lý kiểm tra tầng ứng dụng.
2. **`QuizSubmissionAnswer.selectedAnswer` (UNKNOWN)**:
   - Trong MongoDB kiểu `Schema.Types.Mixed`. Trong source code hiện tại, câu trả lời trắc nghiệm là chuỗi ký tự.
   - Thiết kế hiện tại: Lưu dạng `String @db.Text`. Nếu sau này có câu hỏi chọn nhiều đáp án dạng mảng, cần đổi sang `JSONB`.
3. **Chuẩn hóa giá trị `isVerified`**:
   - Trong MongoDB lưu cả `''` (string rỗng). Trong PostgreSQL đã quy chuẩn thành `Boolean @default(false)`. Khi import dữ liệu cũ, bất kỳ giá trị `''` nào sẽ được map thành `false`.

---

## 12. NHỮNG ĐIỂM CẦN REVIEW TRƯỚC KHI MIGRATE DỮ LIỆU (STEP 4)

1. **Kiểm tra kết nối PostgreSQL thực tế**: Xác minh thông tin `DATABASE_URL` trong [.env](file:///d:/e-learning_server/.env) kết nối thành công tới database `tmdemy`.
2. **Review bảng trung gian**: Xác nhận cấu trúc các bảng `coupon_courses`, `conversation_participants`, `comment_reactions`, `message_reads`.
3. **Chiến lược tạo bảng trên PostgreSQL**: Sẽ sử dụng `npx prisma db push` (cho giai đoạn dev) hoặc `npx prisma migrate dev` (để lưu file SQL migration chính thức).
