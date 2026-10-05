# E-LEARNING BACKEND - DATABASE MIGRATION CONTEXT

## 1. Project hiện tại

Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- REST API
- JWT Authentication
- Socket.IO

Database hiện tại:
- MongoDB
- Database name: tmdemy

Mục tiêu:
- Migrate database từ MongoDB/Mongoose sang PostgreSQL/Prisma.
- Giữ nguyên business logic và API behavior nếu có thể.
- Migration theo từng bước, không rewrite toàn bộ hệ thống một lần.

## 2. Công nghệ mục tiêu

Database:
- PostgreSQL

ORM:
- Prisma

Backend:
- Node.js + Express.js

## 3. Các model MongoDB hiện tại

1. User
2. Category
3. Course
4. Chapter
5. Lesson
6. Quiz
7. Question
8. QuizSubmission
9. Order
10. Coupon
11. Enrollment
12. Progress
13. Certificate
14. Rating
15. Comment
16. FavoriteCourse
17. Conversation
18. Message
19. Notification

Lưu ý:
- Đây là danh sách cần kiểm tra lại trực tiếp từ source code.
- Không được tự giả định field/relationship nếu chưa đọc model/service tương ứng.

## 4. Các relationship quan trọng

Category
  -> Course

User/Teacher
  -> Course

Course
  -> Chapter
  -> Lesson
  -> Rating
  -> Order
  -> Enrollment
  -> FavoriteCourse

Chapter
  -> Lesson

Lesson
  -> Quiz
  -> Progress
  -> Comment

Quiz
  -> Question
  -> QuizSubmission

Question
  -> QuestionOption

User
  -> Order
  -> Enrollment
  -> Progress
  -> Rating
  -> Comment
  -> FavoriteCourse
  -> QuizSubmission
  -> Certificate
  -> Notification

Conversation
  -> Message
  -> Participants

Message
  -> Read receipts

Comment
  -> Replies
  -> Reactions

Coupon
  -> Course
  -> Order

## 5. Những thứ KHÔNG được làm trong migration

Không được:

- Xóa MongoDB.
- Xóa Mongoose ngay lập tức.
- Xóa các MongoDB models trước khi migration hoàn tất.
- Rewrite toàn bộ controller.
- Rewrite toàn bộ route.
- Thay đổi API contract nếu không cần thiết.
- Thay đổi authentication nếu không liên quan trực tiếp.
- Tự ý thay đổi business logic.
- Tự ý đổi ObjectId -> UUID trên toàn bộ code.
- Tự ý thêm/bớt bảng chỉ vì thấy "thiết kế đẹp hơn".
- Tự ý chạy destructive migration.
- Tự ý xóa dữ liệu MongoDB.

## 6. Nguyên tắc migration

Migration phải chia thành các phase:

Phase 1:
- Setup PostgreSQL
- Setup Prisma
- Kiểm tra connection

Phase 2:
- Phân tích Mongoose schemas hiện tại
- Thiết kế PostgreSQL schema
- Xác định PK/FK
- Xác định unique constraints
- Xác định indexes
- Xác định cascade/delete behavior

Phase 3:
- Tạo Prisma schema
- Tạo PostgreSQL database schema

Phase 4:
- Migrate dữ liệu MongoDB -> PostgreSQL

Phase 5:
- Refactor service/repository layer từ Mongoose -> Prisma

Phase 6:
- Testing

Phase 7:
- Chuyển hệ thống sang PostgreSQL
- Chỉ bỏ MongoDB sau khi migration ổn định

## 7. Quy tắc làm việc với AI coding

Trước khi sửa code:

1. Đọc source code hiện tại.
2. Xác định file liên quan.
3. Giải thích ngắn gọn những file sẽ thay đổi.
4. Không sửa file ngoài phạm vi cần thiết.
5. Không tự ý làm phase tiếp theo.

Khi chưa chắc về relationship hoặc business logic:
- Không được đoán.
- Hãy báo lại assumption cần xác nhận.

Khi migrate một model:
- Phải kiểm tra model.
- Service sử dụng model.
- Controller sử dụng service.
- Route liên quan.
- Các model liên quan.

## 8. Current migration status

[ ] PostgreSQL installed
[ ] PostgreSQL database created
[ ] Prisma installed
[ ] Prisma initialized
[ ] DATABASE_URL configured
[ ] PostgreSQL connection tested
[ ] Prisma schema designed
[ ] Prisma migration created
[ ] Data migrated
[ ] Services migrated
[ ] Controllers tested
[ ] API tested
[ ] MongoDB retired

## 9. Current instruction

Hiện tại chỉ thực hiện STEP đang được yêu cầu.

Không tự động chuyển sang STEP tiếp theo.

Nếu phát hiện vấn đề kiến trúc hoặc relationship chưa rõ:
STOP và báo cáo vấn đề trước khi sửa.