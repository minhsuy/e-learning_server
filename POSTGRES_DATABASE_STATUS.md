# BÁO CÁO TRẠNG THÁI DATABASE POSTGRESQL (POSTGRES DATABASE STATUS)

> **Giai đoạn**: PHASE: CREATE POSTGRESQL DATABASE SCHEMA  
> **Thời gian cập nhật**: 2026-09-30 19:25:00 (UTC+7)  
> **Trạng thái**: Hoàn thành xuất sắc, cấu trúc Database PostgreSQL đã đồng bộ toàn diện với Prisma Schema.

---

## 1. Environment (Môi trường)

- **PostgreSQL Version**: `PostgreSQL 16.11, compiled by Visual C++ build 1944, 64-bit` (chạy tại `localhost:5432`)
- **Prisma Version**: `6.4.1`
- **Database Name**: `tmdemy` (PostgreSQL Database URL: `postgresql://postgres:quangminh2004@localhost:5432/tmdemy`)
- **Database Schema**: `public`
- **MongoDB Status**: `MONGODB_URL` giữ nguyên trong `.env`, MongoDB Atlas (`e-learning`) đang hoạt động bình thường, không bị ảnh hưởng.

---

## 2. Migration (Lịch sử & Trạng thái Migration)

### Các migration đã tạo và áp dụng:
1. **`20260930120320_init_postgresql`**:
   - Khởi tạo toàn bộ 26 bảng nghiệp vụ, 15 PostgreSQL enums, indexes, foreign keys, unique constraints và trigger/default UUID.
2. **`20260930122054_finalize_restrict_rules`**:
   - Cập nhật ràng buộc `ON DELETE RESTRICT` cho 2 quan hệ lịch sử quan trọng:
     - `User -> Enrollment` (`enrollments_user_id_fkey`)
     - `User -> QuizSubmission` (`quiz_submissions_user_id_fkey`)

### Migration Status:
```text
2 migrations found in prisma/migrations
Database schema is up to date!
```

---

## 3. Tables (Toàn bộ PostgreSQL Tables đã tạo)

Tổng cộng **27 bảng** trong schema `public` (gồm 26 bảng nghiệp vụ ứng dụng + 1 bảng hệ thống `_prisma_migrations`):

| STT | Table Name | Mô tả nghiệp vụ |
|:---:|:---|:---|
| 1 | `users` | Tài khoản người dùng (Admin, Teacher, User) |
| 2 | `categories` | Danh mục khóa học |
| 3 | `courses` | Khóa học |
| 4 | `course_faqs` | FAQ của khóa học (chuẩn hóa từ mảng embedded `info.qa`) |
| 5 | `chapters` | Chương học trong khóa |
| 6 | `lessons` | Bài học trong chương |
| 7 | `quizzes` | Bài trắc nghiệm (Quan hệ 1-1 với Lesson) |
| 8 | `questions` | Câu hỏi trong Quiz |
| 9 | `question_options` | Đáp án lựa chọn của câu hỏi (chuẩn hóa từ `options[]`) |
| 10 | `quiz_submissions` | Lịch sử nộp bài trắc nghiệm của học viên |
| 11 | `quiz_submission_answers` | Chi tiết từng câu trả lời nộp bài (chuẩn hóa từ `answers[]`) |
| 12 | `orders` | Đơn hàng thanh toán |
| 13 | `coupons` | Mã giảm giá |
| 14 | `coupon_courses` | Bảng trung gian N:N giữa Coupon và Course |
| 15 | `enrollments` | Học viên đăng ký/ghi danh khóa học |
| 16 | `progress` | Tiến độ học tập từng bài học của học viên |
| 17 | `certificates` | Chứng chỉ hoàn thành khóa học |
| 18 | `ratings` | Đánh giá & nhận xét khóa học |
| 19 | `favorite_courses` | Khóa học yêu thích (Bảng trung gian N:N) |
| 20 | `comments` | Bình luận bài học dạng cây phân cấp (`parent_id`) |
| 21 | `comment_reactions` | Cảm xúc Like/Dislike bình luận (chuẩn hóa từ `likes[]`/`dislikes[]`) |
| 22 | `conversations` | Cuộc hội thoại tin nhắn |
| 23 | `conversation_participants` | Thành viên trong cuộc hội thoại (Bảng trung gian N:N) |
| 24 | `messages` | Tin nhắn chi tiết |
| 25 | `message_reads` | Trạng thái đọc tin nhắn của user (chuẩn hóa từ `readBy[]`) |
| 26 | `notifications` | Thông báo gửi tới người dùng |
| 27 | `_prisma_migrations` | Bảng nội bộ của Prisma theo dõi migration |

---

## 4. Enums (Toàn bộ 15 PostgreSQL Enums đã tạo)

Toàn bộ 15 enum kiểu native PostgreSQL đã được tạo với giá trị ánh xạ chuẩn chữ thường:

1. `UserRole`: `'admin'`, `'user'`, `'teacher'`
2. `UserStatus`: `'active'`, `'inactive'`
3. `CourseStatus`: `'approved'`, `'pending'`, `'rejected'`
4. `CourseLevel`: `'beginner'`, `'intermediate'`, `'advanced'`
5. `CourseType`: `'paid'`, `'free'`
6. `LessonType`: `'video'`, `'text'`
7. `ECouponType`: `'percentage'`, `'number'`
8. `EOrderStatus`: `'pending'`, `'completed'`, `'rejected'`
9. `EEnrollmentStatus`: `'active'`, `'completed'`, `'canceled'`
10. `CommentStatus`: `'approved'`, `'pending'`, `'rejected'`
11. `ERatingStatus`: `'active'`, `'inactive'`
12. `ENotificationType`: `'comment'`, `'rating'`, `'order'`, `'message'`, `'system'`, `'course'`, `'lesson'`, `'comment_reply'`, `'quiz'`
13. `QuestionType`: `'multiple_choice'`, `'fill_in_blank'`
14. `EMessageType`: `'text'`, `'image'`, `'file'`
15. `CommentReactionType`: `'like'`, `'dislike'`

---

## 5. Constraints & Verification (Kiểm tra đặc biệt theo yêu cầu)

Đã kiểm tra trực tiếp qua PostgreSQL System Catalogs (`information_schema` và `pg_indexes`):

| Hạng mục kiểm tra | Định dạng Constraint | Kết quả kiểm tra trong PostgreSQL | Trạng thái |
|:---|:---|:---|:---:|
| **User → Enrollment** | Foreign Key `enrollments.user_id` | `delete_rule = RESTRICT` | **ĐẠT** |
| **User → QuizSubmission** | Foreign Key `quiz_submissions.user_id` | `delete_rule = RESTRICT` | **ĐẠT** |
| **Enrollment** | `UNIQUE(userId, courseId)` | Index `enrollments_user_id_course_id_key` (UNIQUE) | **ĐẠT** |
| **Progress** | `UNIQUE(userId, lessonId)` | Index `progress_user_id_lesson_id_key` (UNIQUE) | **ĐẠT** |
| **Certificate** | `UNIQUE(userId, courseId)` | Index `certificates_user_id_course_id_key` (UNIQUE) | **ĐẠT** |
| **Rating** | `UNIQUE(userId, courseId)` | Index `ratings_user_id_course_id_key` (UNIQUE) | **ĐẠT** |
| **FavoriteCourse** | `UNIQUE(userId, courseId)` | Index `favorite_courses_user_id_course_id_key` (UNIQUE) | **ĐẠT** |
| **QuizSubmission** | `UNIQUE(quizId, userId)` | Index `quiz_submissions_quiz_id_user_id_key` (UNIQUE) | **ĐẠT** |
| **CouponCourse** | Composite PK `(couponId, courseId)` | Primary Key `coupon_courses_pkey` trên `(coupon_id, course_id)` | **ĐẠT** |
| **ConversationParticipant** | Composite PK `(conversationId, userId)` | Primary Key `conversation_participants_pkey` trên `(conversation_id, user_id)` | **ĐẠT** |
| **MessageRead** | Composite PK `(messageId, userId)` | Primary Key `message_reads_pkey` trên `(message_id, user_id)` | **ĐẠT** |

---

## 6. Delete Behavior (Chiến lược xóa quan hệ)

1. **`ON DELETE RESTRICT` (Ngăn chặn xóa cascading làm mất lịch sử)**:
   - `orders.user_id` -> `users.id`
   - `orders.course_id` -> `courses.id`
   - `certificates.user_id` -> `users.id`
   - `certificates.course_id` -> `courses.id`
   - `enrollments.user_id` -> `users.id`
   - `quiz_submissions.user_id` -> `users.id`
   - `courses.author_id` -> `users.id`
   - `lessons.author_id` -> `users.id`
   - `quizzes.created_by_id` -> `users.id`
   - `messages.sender_id` -> `users.id`

2. **`ON DELETE CASCADE` (Dọn dẹp tự động các thực thể phụ thuộc hoàn toàn)**:
   - `courses` -> `chapters` -> `lessons` -> `quizzes` -> `questions` -> `question_options`
   - `quiz_submissions` -> `quiz_submission_answers`
   - `comments` -> `replies` (`parent_id`) -> `comment_reactions`
   - `conversations` -> `conversation_participants`
   - `conversations` -> `messages` -> `message_reads`
   - `coupons` -> `coupon_courses`
   - `courses` -> `course_faqs`, `coupon_courses`, `enrollments`, `progress`, `ratings`, `favorite_courses`

3. **`ON DELETE SET NULL` (Duy trì thực thể con khi thực thể cha bị gỡ)**:
   - `courses.category_id` (xóa category thì category_id về null, không mất khóa học)
   - `orders.coupon_id` (xóa coupon thì coupon_id về null, không mất đơn hàng)
   - `notifications.sender_id` (xóa user gửi thì notification giữ nguyên sender=null)

---

## 7. Validation Results (Kết quả chạy lệnh)

### 7.1 `npx prisma validate`
```text
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
The schema at prisma\schema.prisma is valid 🚀
```

### 7.2 `npx prisma migrate status`
```text
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "tmdemy", schema "public" at "localhost:5432"

2 migrations found in prisma/migrations

Database schema is up to date!
```

### 7.3 `npx prisma generate`
```text
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v6.4.1) to .\node_modules\@prisma\client in 320ms
```

---

## 8. Data Migration Status

```text
MongoDB data: NOT MIGRATED
PostgreSQL data: EMPTY
ObjectId → UUID mapping: NOT IMPLEMENTED
```

- Toàn bộ 26 bảng nghiệp vụ PostgreSQL hiện tại có đúng **0 bản ghi** (hoàn toàn trống).
- Không có bất kỳ dòng code Controller, Service, Route, Mongoose Model nào bị thay đổi.
- Hệ thống backend MongoDB vẫn giữ nguyên 100% khả năng hoạt động.
