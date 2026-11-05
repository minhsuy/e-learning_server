# TMDEMY — API ENUM REFERENCE

Tài liệu này tổng hợp toàn bộ các Enum thực tế được định nghĩa trong PostgreSQL (`prisma/schema.prisma`), TypeScript Type definitions (`src/types/enum.ts`) và được sử dụng trong các API endpoints của hệ thống **TMDEMY E-Learning Backend**.

---

## 1. Danh sách Enums và Domain Sử dụng

| Enum Name | Database Values (Prisma/DB) | Application Values (TypeScript/API) | Domain Sử dụng | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **UserRole** | `admin`, `user`, `teacher` | `admin`, `user`, `teacher` | Auth, User, Admin | Quyền và vai trò tài khoản trong hệ thống |
| **UserStatus** | `active`, `inactive` | `active`, `inactive` | User, Admin | Trạng thái hoạt động của tài khoản người dùng |
| **CourseStatus** | `approved`, `pending`, `rejected` | `approved`, `pending`, `rejected` | Course, Teacher, Admin, Statistics | Trạng thái kiểm duyệt và phát hành khóa học |
| **CourseLevel** | `beginner`, `intermediate`, `advanced` | `beginner`, `intermediate`, `advanced` | Course, Teacher, Admin | Trình độ đối tượng của khóa học |
| **CourseType** | `paid`, `free` | `paid`, `free` | Course, Teacher, Admin | Phân loại khóa học có phí hoặc miễn phí |
| **LessonType** | `video`, `text` | `video`, `text` | Lesson, Chapter | Định dạng nội dung bài học |
| **ECouponType** | `percentage`, `number` | `percentage`, `number` | Coupon, Order | Phương thức tính giảm giá coupon (% hoặc số tiền VND cố định) |
| **EOrderStatus** | `pending`, `completed`, `rejected` | `pending`, `completed`, `rejected` | Order, Teacher Statistics, Revenue | Trạng thái thanh toán của đơn hàng |
| **EEnrollmentStatus** | `active`, `completed`, `canceled` | `active`, `completed`, `canceled` | Enrollment, Progress, Statistics | Trạng thái ghi danh học tập của học viên |
| **CommentStatus** | `approved`, `pending`, `rejected` | `approved`, `pending`, `rejected` | Comment, Admin | Trạng thái kiểm duyệt bình luận |
| **ERatingStatus** | `active`, `inactive` | `active`, `inactive` | Rating, Course, Teacher Statistics | Trạng thái hiển thị công khai của đánh giá |
| **QuestionType** | `multiple_choice`, `fill_in_blank` | `multiple_choice`, `fill_in_blank` | Question, Quiz | Định dạng câu hỏi kiểm tra |
| **ENotificationType** | `comment`, `rating`, `order`, `message`, `system`, `course`, `lesson`, `comment_reply`, `quiz` | `COMMENT`, `RATING`, `ORDER`, `MESSAGE`, `SYSTEM`, `COURSE`, `LESSON`, `COMMENT_REPLY`, `QUIZ` | Notification | Phân loại thông báo hệ thống và người dùng |
| **EMessageType** | `text`, `image`, `file` | `text`, `image`, `file` | Chat (Conversation & Message) | Định dạng tin nhắn trong phòng chat |
| **CommentReactionType**| `like`, `dislike` | `like`, `dislike` | Comment Reaction | Loại tương tác cảm xúc đối với bình luận |
| **XPTransactionType** | `lesson_completed`, `quiz_completed`, `daily_streak` | `LESSON_COMPLETED`, `QUIZ_COMPLETED`, `DAILY_STREAK` | Gamification (XP & Streak) | Phân loại giao dịch biến động điểm kinh nghiệm XP |

---

## 2. Chi tiết từng Enum

### 2.1. UserRole
Được lưu trong PostgreSQL dạng lowercase (`admin`, `user`, `teacher`) thông qua `@map` của Prisma. Trong JWT payload và API response, role luôn được chuẩn hóa về lowercase string.
* `admin`: Quản trị viên hệ thống có toàn quyền trên users, courses, categories, coupons, orders, comments.
* `teacher`: Giảng viên tạo và quản lý khóa học, chương học, bài học, quiz, xem doanh thu và thống kê học viên của riêng mình.
* `user`: Học viên đăng ký học, mua khóa học, làm bài tập, bình luận, đánh giá.

### 2.2. UserStatus
* `active`: Tài khoản đang hoạt động bình thường.
* `inactive`: Tài khoản bị vô hiệu hóa hoặc chưa kích hoạt.

### 2.3. CourseStatus
* `approved`: Khóa học đã được Admin duyệt và hiển thị công khai trên catalog.
* `pending`: Khóa học do Teacher tạo hoặc cập nhật, đang chờ Admin duyệt.
* `rejected`: Khóa học bị Admin từ chối phê duyệt.

> [!NOTE]
> Teacher vẫn có thể xem danh sách và số liệu thống kê (`course-performance`) của các khóa học `pending` và `rejected` do chính mình sở hữu.

### 2.4. CourseLevel
* `beginner`: Khóa học nhập môn cho người mới bắt đầu.
* `intermediate`: Khóa học nâng cao dành cho học viên đã có nền tảng.
* `advanced`: Khóa học chuyên sâu / chuyên gia.

### 2.5. CourseType
* `paid`: Khóa học có thu phí (phải tạo Order thanh toán).
* `free`: Khóa học miễn phí (khi tạo Order sẽ tự động hoàn tất với giá 0 VND).

### 2.6. LessonType
* `video`: Bài học qua video streaming (`videoUrl`).
* `text`: Bài học dạng bài đọc / tài liệu (`content`).

### 2.7. ECouponType
* `percentage`: Giảm theo phần trăm giá trị khóa học (ví dụ: `20` tức là giảm 20%).
* `number`: Giảm số tiền trực tiếp bằng VND (ví dụ: `50000` tức là giảm 50.000 VND).

### 2.8. EOrderStatus
* `pending`: Đơn hàng vừa khởi tạo, đang chờ thanh toán hoặc xác nhận.
* `completed`: Đơn hàng đã thanh toán thành công. **Chỉ các đơn hàng `completed` mới được tính vào doanh thu và kích hoạt ghi danh học tập (`Enrollment`)**.
* `rejected`: Đơn hàng bị hủy hoặc từ chối thanh toán.

### 2.9. EEnrollmentStatus
* `active`: Học viên đang trong quá trình học khóa học.
* `completed`: Học viên đã hoàn thành 100% các bài học trong khóa học.
* `canceled`: Ghi danh bị hủy bỏ (ví dụ: bị giảng viên/admin gỡ khỏi khóa học).

### 2.10. ERatingStatus
* `active`: Đánh giá hợp lệ và được hiển thị công khai cho học viên.
* `inactive`: Đánh giá bị ẩn bởi giảng viên hoặc quản trị viên.

### 2.11. QuestionType
* `multiple_choice`: Câu hỏi trắc nghiệm (có danh sách các phương án trong `options`).
* `fill_in_blank`: Câu hỏi điền vào chỗ trống.

### 2.12. ENotificationType
Các loại sự kiện kích hoạt thông báo:
* `COMMENT`: Bình luận mới trong bài học.
* `COMMENT_REPLY`: Có phản hồi mới vào bình luận của người dùng.
* `RATING`: Đánh giá sao mới cho khóa học.
* `ORDER`: Đơn hàng mới phát sinh hoặc cập nhật trạng thái.
* `MESSAGE`: Tin nhắn mới trong phòng chat.
* `COURSE`: Khóa học được tạo hoặc được phê duyệt.
* `LESSON`: Bài học mới được thêm vào.
* `QUIZ`: Quiz mới hoặc học viên nộp bài quiz.
* `SYSTEM`: Thông báo chung từ hệ thống.

### 2.13. XPTransactionType
Được lưu trong PostgreSQL dạng lowercase (`lesson_completed`, `quiz_completed`, `daily_streak`) qua `@map` và quản lý dưới dạng enum uppercase tại Application Layer (`LESSON_COMPLETED`, `QUIZ_COMPLETED`, `DAILY_STREAK`).
* `LESSON_COMPLETED`: Cộng **+70 XP** khi học viên đánh dấu hoàn thành một bài học hợp lệ lần đầu tiên.
  * Định dạng Event Key: `lesson-complete:{userId}:{lessonId}`
* `QUIZ_COMPLETED`: Cộng **+100 XP** khi học viên nộp và hoàn thành một bài kiểm tra Quiz lần đầu tiên.
  * Định dạng Event Key: `quiz-complete:{userId}:{quizId}`
* `DAILY_STREAK`: Cộng **+20 XP** khi học viên thực hiện hoạt động học tập đầu tiên trong một ngày làm việc (business day).
  * Định dạng Event Key: `daily-streak:{userId}:{YYYY-MM-DD}` (theo múi giờ `Asia/Ho_Chi_Minh`)

---

## 3. Hệ Thống Danh Hiệu Gamification (Rank System Reference)

Danh hiệu người dùng **không được lưu tĩnh trong cơ sở dữ liệu** mà được suy luận động từ tổng điểm kinh nghiệm (`User.xpTotal`):

| Cấp độ (Level) | Danh hiệu (Rank Name) | Ngưỡng điểm tối thiểu (minXP) | Ngưỡng điểm tối đa (maxXP) | Mô tả & Đối tượng |
| :---: | :--- | :---: | :---: | :--- |
| **Level 1** | **Beginner** | `0` | `499` | Học viên mới bắt đầu, vừa tạo tài khoản hoặc học thử 1-4 bài. |
| **Level 2** | **Explorer** | `500` | `1,499` | Học viên khám phá, bắt đầu hoàn thành bài học và quiz đầu tiên. |
| **Level 3** | **Learner** | `1,500` | `2,999` | Học viên chăm chỉ, duy trì chuỗi học và tích lũy kiến thức đều đặn. |
| **Level 4** | **Skilled** | `3,000` | `5,999` | Học viên có kỹ năng vững vàng, hoàn thành nhiều module bài học. |
| **Level 5** | **Advanced** | `6,000` | `9,999` | Học viên nâng cao, hoàn thành nhiều khóa học và quiz độ khó cao. |
| **Level 6** | **Expert** | `10,000` | `19,999` | Chuyên gia học tập, điểm tích lũy lớn, streak dài và liên tục. |
| **Level 7** | **Master** | `20,000` | Không giới hạn | Bậc thầy học tập, top đầu bảng xếp hạng toàn hệ thống TMdemy. |

