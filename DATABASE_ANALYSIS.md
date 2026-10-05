# BÁO CÁO PHÂN TÍCH TOÀN DIỆN CƠ SỞ DỮ LIỆU HIỆN TẠI (MONGODB / MONGOOSE)
> **Tài liệu phục vụ**: Kế hoạch Migration sang PostgreSQL / Prisma ORM (STEP 2)  
> **Nguyên tắc**: Bám sát 100% bằng chứng từ source code hiện tại, không suy đoán, không can thiệp sửa đổi code.

---

## 1. DANH SÁCH MODEL (19 MONGOOSE MODELS)

Dưới đây là chi tiết toàn bộ 19 Mongoose Models được trích xuất trực tiếp từ [src/models](file:///d:/e-learning_server/src/models). Mongoose mặc định số nhiều hóa (pluralize) và viết thường tên collection trừ khi được cấu hình khác.

### 1.1. Model `User`
- **File**: [src/models/user.model.ts](file:///d:/e-learning_server/src/models/user.model.ts)
- **Collection**: `users`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK mặc định)
  - `username`: `String` (Required: `true`)
  - `email`: `String` (Required: `true`, Unique: `true`, Index ngầm do unique)
  - `password`: `String` (Required: `true`, Hashed bcrypt)
  - `status`: `String` (Enum: `UserStatus` [`active`, `inactive`], Default: `'active'`)
  - `role`: `String` (Enum: `UserRole` [`admin`, `user`, `teacher`], Default: `'user'`)
  - `avatar`: `String` (Optional, Default: `undefined`)
  - `phone`: `String` (Optional)
  - `bio`: `String` (Optional)
  - `socialLinks`: Embedded Object (Optional, `{ facebook: String (default ''), instagram: String (default ''), github: String (default '') }`)
  - `isVerified`: `Boolean` (Default: `false` trong Schema, nhưng code `createTeacherService` lưu `''` [chuỗi rỗng])
  - `otp_code`: `String` (Optional)
  - `otp_expires`: `Date` (Optional)
  - `refresh_token`: `String` (Optional, lưu chuỗi hash)
  - `reset_password_token`: `String` (Optional)
  - `reset_password_expires`: `Date` (Optional)
  - `courses`: `ObjectId[]` (Ref: `'Course'`, Default: `[]`, mảng cache khóa học đã sở hữu)
  - `favorites`: `ObjectId[]` (Ref: `'Course'`, Default: `[]`, mảng cache khóa học yêu thích)
  - `createdAt`, `updatedAt`: `Date` (Tự động sinh bởi `timestamps: true`)
- **Indexes**: Unique index trên `email`.

---

### 1.2. Model `Category`
- **File**: [src/models/category.model.ts](file:///d:/e-learning_server/src/models/category.model.ts)
- **Collection**: `categories`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `name`: `String` (Required: `true`, Unique: `true`)
  - `slug`: `String` (Required: `true`, Unique: `true`)
  - `description`: `String` (Optional)
  - `created_by`: `ObjectId` (Ref: `'User'`, Optional)
  - `_destroy`: `Boolean` (Default: `false`, cờ Soft Delete)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Unique index trên `name`, `slug`.

---

### 1.3. Model `Course`
- **File**: [src/models/course.model.ts](file:///d:/e-learning_server/src/models/course.model.ts)
- **Collection**: `courses`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `title`: `String` (Required: `true`)
  - `slug`: `String` (Required: `true`, Unique: `true`, lowercase: `true`)
  - `image`: `String` (Default: `''`)
  - `intro_url`: `String` (Default: `''`)
  - `description`: `String` (Default: `''`)
  - `price`: `Number` (Default: `0`, min: `0`)
  - `old_price`: `Number` (Default: `0`, min: `0`)
  - `type`: `String` (Enum: `CourseType` [`paid`, `free`], Default: `'paid'`)
  - `status`: `String` (Enum: `CourseStatus` [`approved`, `pending`, `rejected`], Default: `'pending'`)
  - `level`: `String` (Enum: `CourseLevel` [`beginner`, `intermediate`, `advanced`], Default: `'beginner'`)
  - `view`: `Number` (Default: `0`)
  - `sold`: `Number` (Default: `0`)
  - `category`: `ObjectId` (Ref: `'Category'`, Optional)
  - `author`: `ObjectId` (Ref: `'User'`, Optional)
  - `chapters`: `ObjectId[]` (Ref: `'Chapter'`, Default: `[]`)
  - `rating`: `ObjectId[]` (Ref: `'Rating'`, Default: `[]`)
  - `info`: Embedded Object:
    - `requirements`: `String[]` (Default: `[]`)
    - `benefits`: `String[]` (Default: `[]`)
    - `techniques`: `String[]` (Default: `[]`)
    - `documents`: `String[]` (Default: `[]`)
    - `qa`: Array of Objects `[{ question: String, answer: String }]`
  - `_destroy`: `Boolean` (Default: `false`, Soft Delete)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Unique index trên `slug`.

---

### 1.4. Model `Chapter`
- **File**: [src/models/chapter.model.ts](file:///d:/e-learning_server/src/models/chapter.model.ts)
- **Collection**: `chapters`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `title`: `String` (Required: `true`)
  - `course`: `ObjectId` (Ref: `'Course'`, Required: `true`)
  - `lessons`: `ObjectId[]` (Ref: `'Lesson'`, Default: `[]`)
  - `order`: `Number` (Default: `0`)
  - `_destroy`: `Boolean` (Default: `false`, Soft Delete)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.5. Model `Lesson`
- **File**: [src/models/lesson.model.ts](file:///d:/e-learning_server/src/models/lesson.model.ts)
- **Collection**: `lessons`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `title`: `String` (Required: `true`)
  - `slug`: `String` (Required: `true`, Unique: `true`)
  - `order`: `Number` (Default: `0`)
  - `duration`: `Number` (Default: `0`, tính theo phút hoặc giây)
  - `content`: `String` (Default: `''`)
  - `isDemo`: `Boolean` (Default: `false`)
  - `chapter`: `ObjectId` (Ref: `'Chapter'`, Required: `true`)
  - `course`: `ObjectId` (Ref: `'Course'`, Required: `true`)
  - `type`: `String` (Enum: `LessonType` [`video`, `text`], Default: `'video'`)
  - `author`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `videoUrl`: `String` (Default: `''`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Unique index trên `slug`.

---

### 1.6. Model `Quiz`
- **File**: [src/models/quiz.model.ts](file:///d:/e-learning_server/src/models/quiz.model.ts)
- **Collection**: `quizzes`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `title`: `String` (Required: `true`)
  - `duration`: `Number` (Optional)
  - `passing_grade`: `Number` (Optional)
  - `description`: `String` (Optional)
  - `lesson`: `ObjectId` (Ref: `'Lesson'`, Required: `true`)
  - `questions`: `ObjectId[]` (Ref: `'Question'`, Default: `[]`)
  - `created_by`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `courseId`: `ObjectId` (Ref: `'Course'`, Required: `true`) *(Lưu ý: tên trường là courseId)*
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.7. Model `Question`
- **File**: [src/models/question.model.ts](file:///d:/e-learning_server/src/models/question.model.ts)
- **Collection**: `questions`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `quiz`: `ObjectId` (Ref: `'Quiz'`, Required: `true`)
  - `type`: `String` (Enum: `QuestionType` [`multiple_choice`, `fill_in_blank`], Default: `'multiple_choice'`, Required: `true`)
  - `title`: `String` (Required: `true`)
  - `options`: `String[]` (Required: `true`, mảng đáp án lựa chọn)
  - `answer`: `String` (Required: `true`, đáp án đúng)
  - `points`: `Number` (Default: `1`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.8. Model `QuizSubmission`
- **File**: [src/models/quizSubmission.model.ts](file:///d:/e-learning_server/src/models/quizSubmission.model.ts)
- **Collection**: `quizsubmissions`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `quiz`: `ObjectId` (Ref: `'Quiz'`, Required: `true`)
  - `user`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `answers`: Array of Subdocuments:
    - `question`: `ObjectId` (Ref: `'Question'`, Required: `true`)
    - `selectedAnswer`: `Schema.Types.Mixed` (Required: `true`)
  - `score`: `Number` (Default: `0`)
  - `totalPoints`: `Number` (Default: `0`)
  - `percentage`: `Number` (Default: `0`)
  - `completedAt`: `Date` (Default: `Date.now`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.9. Model `Order`
- **File**: [src/models/order.model.ts](file:///d:/e-learning_server/src/models/order.model.ts)
- **Collection**: `orders`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `code`: `String` (Required: `true`, Unique: `true`)
  - `amount`: `Number` (Optional trong schema, nhưng code gán `course.price`)
  - `discount`: `Number` (Optional, Default: `0`)
  - `total`: `Number` (Optional)
  - `coupon`: `ObjectId` (Ref: `'Coupon'`, Optional)
  - `course`: `ObjectId` (Ref: `'Course'`, Optional trong schema, Required theo nghiệp vụ)
  - `user`: `ObjectId` (Ref: `'User'`, Optional trong schema, Required theo nghiệp vụ)
  - `status`: `String` (Enum: `EOrderStatus` [`pending`, `completed`, `rejected`], Default: `'pending'`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Unique index trên `code`.

---

### 1.10. Model `Coupon`
- **File**: [src/models/coupon.model.ts](file:///d:/e-learning_server/src/models/coupon.model.ts)
- **Collection**: `coupons`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `title`: `String` (Required: `true`)
  - `code`: `String` (Required: `true`, Unique: `true`)
  - `active`: `Boolean` (Default: `false`)
  - `startDate`: `Date` (Optional)
  - `endDate`: `Date` (Optional)
  - `limit`: `Number` (Optional, giới hạn số lượt dùng)
  - `used`: `Number` (Default: `0`)
  - `courses`: `ObjectId[]` (Ref: `'Course'`, Default: `[]`, danh sách khóa học áp dụng)
  - `type`: `String` (Enum: `ECouponType` [`percentage`, `number`], Default: `'percentage'`)
  - `value`: `Number` (Optional)
  - `author`: `ObjectId` (Ref: `'User'`, Optional)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Unique index trên `code`.

---

### 1.11. Model `Enrollment`
- **File**: [src/models/enrollment.model.ts](file:///d:/e-learning_server/src/models/enrollment.model.ts)
- **Collection**: `enrollments`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `user`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `course`: `ObjectId` (Ref: `'Course'`, Required: `true`)
  - `progress`: `Number` (Default: `0`, phần trăm 0 - 100)
  - `status`: `String` (Enum: `EEnrollmentStatus` [`active`, `completed`, `canceled`], Default: `'active'`)
  - `enrolledAt`: `Date` (Default: `Date.now`)
  - `completedAt`: `Date` (Optional)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.12. Model `Progress`
- **File**: [src/models/progress.model.ts](file:///d:/e-learning_server/src/models/progress.model.ts)
- **Collection**: `progresses`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `course`: `ObjectId` (Ref: `'Course'`, Optional)
  - `lesson`: `ObjectId` (Ref: `'Lesson'`, Optional)
  - `user`: `ObjectId` (Ref: `'User'`, Optional)
  - `completed`: `Boolean` (Default: `false`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.13. Model `Certificate`
- **File**: [src/models/certificate.model.ts](file:///d:/e-learning_server/src/models/certificate.model.ts)
- **Collection**: `certificates`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `user`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `course`: `ObjectId` (Ref: `'Course'`, Required: `true`)
  - `issuedAt`: `Date` (Default: `Date.now`)
  - `grade`: `Number` (Required: `true`)
  - `certificateUrl`: `String` (Optional, URL lưu trên Cloudinary)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.14. Model `Rating`
- **File**: [src/models/rating.model.ts](file:///d:/e-learning_server/src/models/rating.model.ts)
- **Collection**: `ratings`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `rate`: `Number` (Required: `true`, min: `1`, max: `5`)
  - `content`: `String` (Required: `true`, maxlength: `100`)
  - `user`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `course`: `ObjectId` (Ref: `'Course'`, Required: `true`)
  - `status`: `String` (Enum: `ERatingStatus` [`active`, `inactive`], Default: `'inactive'`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Compound Unique Index: `{ user: 1, course: 1 }`.

---

### 1.15. Model `Comment`
- **File**: [src/models/comment.model.ts](file:///d:/e-learning_server/src/models/comment.model.ts)
- **Collection**: `comments`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `content`: `String` (Required: `true`)
  - `lesson`: `ObjectId` (Ref: `'Lesson'`, Required: `true`)
  - `course`: `ObjectId` (Ref: `'Course'`, Required: `true`)
  - `user`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `status`: `String` (Enum: `CommentStatus` [`approved`, `pending`, `rejected`], Default: `'approved'`)
  - `parentId`: `ObjectId` (Ref: `'Comment'`, Default: `null`, Self-reference)
  - `level`: `Number` (Default: `0`)
  - `likes`: `ObjectId[]` (Ref: `'User'`, Default: `[]`)
  - `dislikes`: `ObjectId[]` (Ref: `'User'`, Default: `[]`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.16. Model `FavoriteCourse`
- **File**: [src/models/favoriteCourse.model.ts](file:///d:/e-learning_server/src/models/favoriteCourse.model.ts)
- **Collection**: `favoritecourses`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `user`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `course`: `ObjectId` (Ref: `'Course'`, Required: `true`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Compound Unique Index: `{ user: 1, course: 1 }`.

---

### 1.17. Model `Conversation`
- **File**: [src/models/conversation.model.ts](file:///d:/e-learning_server/src/models/conversation.model.ts)
- **Collection**: `conversations`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `participants`: `ObjectId[]` (Ref: `'User'`, Required: `true`, danh sách thành viên)
  - `isGroup`: `Boolean` (Default: `false`)
  - `name`: `String` (Optional)
  - `lastMessage`: `ObjectId` (Ref: `'Message'`, Optional)
  - `course`: `ObjectId` (Ref: `'Course'`, Optional, nhóm chat hỏi đáp khóa học)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.18. Model `Message`
- **File**: [src/models/message.model.ts](file:///d:/e-learning_server/src/models/message.model.ts)
- **Collection**: `messages`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `conversation`: `ObjectId` (Ref: `'Conversation'`, Required: `true`)
  - `sender`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `content`: `String` (Required: `true`)
  - `type`: `String` (Enum: `EMessageType` [`text`, `image`, `file`], Default: `'text'`)
  - `readBy`: `ObjectId[]` (Ref: `'User'`, Default: `[]`)
  - `isEdited`: `Boolean` (Default: `false`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

### 1.19. Model `Notification`
- **File**: [src/models/notification.model.ts](file:///d:/e-learning_server/src/models/notification.model.ts)
- **Collection**: `notifications`
- **Fields & Chi tiết**:
  - `_id`: `ObjectId` (PK)
  - `sender`: `ObjectId` (Ref: `'User'`, Optional, null nếu là hệ thống)
  - `receiver`: `ObjectId` (Ref: `'User'`, Required: `true`)
  - `type`: `String` (Enum: `ENotificationType` [`comment`, `rating`, `order`, `message`, `system`, `course`, `lesson`, `comment_reply`, `quiz`], Required: `true`)
  - `message`: `String` (Required: `true`)
  - `relatedId`: `ObjectId` (Optional, tham chiếu đa hình tới đối tượng liên quan)
  - `read`: `Boolean` (Default: `false`)
  - `createdAt`, `updatedAt`: `Date` (`timestamps: true`)
- **Indexes**: Mặc định `_id`.

---

## 2. PHÂN TÍCH QUAN HỆ (RELATIONSHIPS)

| Model A | Model B | Field liên kết | Kiểu quan hệ | Bắt buộc (Mandatory) | Delete Behavior hiện tại trong Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Category** | **Course** | `Course.category` | 1 - N | Optional (có thể null) | Khi xóa Category (`_destroy = true`), Course không bị xóa. |
| **User (Teacher)** | **Course** | `Course.author` | 1 - N | Bắt buộc | Khi Admin xóa User, không xóa Course cascade. Giáo viên chỉ xóa được course pending. |
| **Course** | **Chapter** | `Chapter.course` & `Course.chapters[]` | 1 - N | Bắt buộc | Khi Chapter xóa (`_destroy = true`), chỉ gán cờ. |
| **Chapter** | **Lesson** | `Lesson.chapter` & `Chapter.lessons[]` | 1 - N | Bắt buộc | Khi xóa Lesson: `$pull` khỏi `Chapter.lessons` và gọi `LessonModel.deleteOne()`. |
| **Course** | **Lesson** | `Lesson.course` | 1 - N | Bắt buộc | Thừa FK để query nhanh (denormalized FK). |
| **Lesson** | **Quiz** | `Quiz.lesson` | **1 - 1** | Bắt buộc | Trong [quiz.service.ts](file:///d:/e-learning_server/src/services/quiz.service.ts#L24): kiểm tra `findOne({ lesson })` -> chặn tạo > 1 quiz cho 1 lesson. Khi xóa Quiz: xóa toàn bộ questions thuộc quiz. |
| **Quiz** | **Question** | `Question.quiz` & `Quiz.questions[]` | 1 - N | Bắt buộc | Khi xóa Question: `$pull` khỏi `Quiz.questions` và `deleteOne`. Khi xóa Quiz: `QuestionModel.deleteMany({ quiz: quiz._id })`. |
| **Quiz** | **QuizSubmission** | `QuizSubmission.quiz` | 1 - N | Bắt buộc | Mỗi quiz có nhiều submission từ học viên. |
| **User** | **QuizSubmission** | `QuizSubmission.user` | 1 - N | Bắt buộc | Trong [quizSubmission.service.ts](file:///d:/e-learning_server/src/services/quizSubmission.service.ts#L30): Chặn `findOne({ quiz, user })` -> 1 user chỉ submit 1 lần / quiz. |
| **Question** | **QuizSubmissionAnswer** | `answers[].question` | 1 - N | Bắt buộc | Embedded array trong QuizSubmission. |
| **User** | **Order** | `Order.user` | 1 - N | Bắt buộc | Một user có nhiều đơn hàng. |
| **Course** | **Order** | `Order.course` | 1 - N | Bắt buộc | Khi từ chối đơn hàng: xóa Order, `$pull` Course khỏi User, giảm `Course.sold`. |
| **Coupon** | **Order** | `Order.coupon` | 1 - N | Optional (null nếu không áp mã) | Khóa ngoại có thể null. |
| **Coupon** | **Course** | `Coupon.courses[]` | **N - N** | Optional | Một coupon áp dụng cho 0, 1 hoặc nhiều khóa học. |
| **User** | **Enrollment** | `Enrollment.user` | 1 - N | Bắt buộc | Khởi tạo khi Order hoàn thành hoặc qua `upsert`. |
| **Course** | **Enrollment** | `Enrollment.course` | 1 - N | Bắt buộc | Khi kick học viên khỏi khóa: xóa `Enrollment`, xóa `Order`, giảm `sold`, `$pull` khỏi `User.courses`. |
| **User + Course** | **Enrollment** | `(user, course)` | **1 - 1 logic** | Bắt buộc | Nghiệp vụ đảm bảo 1 cặp user - course chỉ enroll 1 lần. |
| **User + Lesson** | **Progress** | `(user, lesson)` | **1 - 1 logic** | Bắt buộc | [progress.service.ts](file:///d:/e-learning_server/src/services/progress.service.ts#L21): `findOneAndUpdate({ user, course, lesson }, { upsert: true })`. |
| **User + Course** | **Certificate** | `(user, course)` | **1 - 1 logic** | Bắt buộc | [certificate.service.ts](file:///d:/e-learning_server/src/services/certificate.service.ts#L15): Chặn cấp trùng bằng `findOne({ user, course })`. |
| **User + Course** | **Rating** | `(user, course)` | **1 - 1 index** | Bắt buộc | Schema khai báo `unique: true` trên cặp `(user, course)`. Khi xóa Rating: `$pull` khỏi `Course.rating`. |
| **User + Course** | **FavoriteCourse** | `(user, course)` | **N - N** | Bắt buộc | Schema khai báo `unique: true` trên cặp `(user, course)`. |
| **User** | **Comment** | `Comment.user` | 1 - N | Bắt buộc | Một user có thể viết nhiều bình luận. |
| **Lesson** | **Comment** | `Comment.lesson` | 1 - N | Bắt buộc | Bình luận gắn vào bài học cụ thể. |
| **Course** | **Comment** | `Comment.course` | 1 - N | Bắt buộc | Khóa ngoại hỗ trợ filter phân quyền cho giáo viên. |
| **Comment** | **Comment (Reply)** | `Comment.parentId` | **Self-Ref (1 - N)** | Optional (null cho comment gốc) | Xóa comment hiện tại bằng `findByIdAndDelete(commentId)` (chưa cascade xóa comment con). |
| **Comment** | **User (Reactions)** | `likes[]`, `dislikes[]` | **N - N** | Optional | Hai mảng ObjectId lưu ID user tương tác thích/không thích. |
| **Conversation** | **User** | `participants[]` | **N - N** | Bắt buộc | Mảng ObjectId thành viên (1-1 có 2 thành viên, nhóm Q&A có giáo viên + học viên). |
| **Conversation** | **Message** | `Message.conversation` | 1 - N | Bắt buộc | Một cuộc trò chuyện chứa nhiều tin nhắn. |
| **User** | **Message** | `Message.sender` | 1 - N | Bắt buộc | Tác giả tin nhắn. |
| **Message** | **User (Read Receipts)**| `Message.readBy[]` | **N - N** | Optional | Mảng ObjectId người đã đọc tin nhắn. |
| **User** | **Notification** | `Notification.receiver` | 1 - N | Bắt buộc | Người nhận thông báo. |
| **User** | **Notification** | `Notification.sender` | 1 - N | Optional | Người kích hoạt thông báo (null nếu từ server). |

---

## 3. PHÂN TÍCH EMBEDDED DATA & ĐỀ XUẤT CHUYỂN ĐỔI

| Model & Cấu trúc Embedded | Chi tiết hiện tại | Đề xuất PostgreSQL (Table hay JSONB) | Lý do chi tiết dựa trên Business Logic |
| :--- | :--- | :--- | :--- |
| **`Course.info.qa`** | Mảng `[{ question: string, answer: string }]` | **Tách thành Table `course_faqs`** | Cần hỗ trợ admin/giáo viên CRUD từng câu hỏi FAQ, sắp xếp thứ tự hiển thị, tìm kiếm nội dung câu hỏi FAQ dễ dàng qua SQL. |
| **`Course.info` (requirements, benefits, techniques, documents)** | Các mảng `string[]` | **Giữ dạng `TEXT[]` (Array) hoặc `JSONB`** | Các thông tin này là text liệt kê tĩnh, luôn được load và update cùng lúc với Course Detail, không bao giờ cần query filter/join độc lập. Sử dụng `TEXT[]` của PostgreSQL cực kỳ gọn và tối ưu. |
| **`QuizSubmission.answers`** | Mảng `[{ question: ObjectId, selectedAnswer: Mixed }]` | **Tách thành Table `quiz_submission_answers`** | Đây là dữ liệu chấm điểm cốt lõi. Cần lưu khóa ngoại `question_id`, đáp án chọn, và kết quả đúng/sai (`is_correct`) để thống kê câu hỏi nào hay bị trả lời sai, tính điểm và audit bài thi. |
| **`Question.options`** | Mảng `string[]` (các đáp án trắc nghiệm) | **Recommendation: Tách Table `question_options` (hoặc JSONB nếu đơn giản)** | Nếu tách bảng `question_options`: mở rộng tốt cho việc xáo trộn thứ tự (shuffle), đính kèm ID đáp án. Nếu giữ `JSONB` hoặc `TEXT[]`: query đơn giản, ít bảng hơn. Khuyến nghị tách bảng để chuẩn hóa dữ liệu thi cử. |
| **`User.socialLinks`** | `{ facebook, instagram, github }` | **Flatten thành các cột trên `users` hoặc `JSONB`** | Cấu trúc cố định chỉ có 3 link, flatten thành `social_facebook`, `social_instagram`, `social_github` hoặc 1 cột `social_links JSONB`. Flatten cột giúp kiểm tra và select trực tiếp không cần cú pháp JSON. |
| **`Coupon.courses`** | Mảng `ObjectId[]` | **Tách thành Table Junction `coupon_courses`** | Quan hệ N-N kinh điển. Cần join với bảng Course để kiểm tra mã giảm giá có hợp lệ với giỏ hàng hay không bằng SQL index (`coupon_id`, `course_id`). |
| **`Conversation.participants`** | Mảng `ObjectId[]` | **Tách thành Table Junction `conversation_participants`** | Cần lưu thời điểm tham gia (`joined_at`), vai trò trong nhóm, và index phục vụ query "tìm tất cả hội thoại của user X". |
| **`Comment.likes` & `dislikes`** | 2 mảng `ObjectId[]` | **Tách thành Table `comment_reactions`** | Mảng ObjectId trong Document sẽ phình to không kiểm soát khi có hàng ngàn like (unbounded array anti-pattern). Bảng `comment_reactions (comment_id, user_id, type)` với unique constraint `(comment_id, user_id)` chặn spam like/dislike chuẩn xác tuyệt đối. |
| **`Message.readBy`** | Mảng `ObjectId[]` | **Tách Table `message_reads` hoặc dùng `last_read_message_id`** | Để biết ai đã đọc tin nhắn nào và khi nào (`read_at`). |
| **`User.courses`** | Mảng `ObjectId[]` | **LOẠI BỎ (Thay bằng JOIN `enrollments` / `orders`)** | Mảng này là dữ liệu trùng lặp (redundant cache). Trong PostgreSQL chỉ cần truy vấn qua bảng `enrollments`. |
| **`User.favorites`** | Mảng `ObjectId[]` | **LOẠI BỎ (Đã có bảng `favorite_courses`)** | Đã tồn tại model riêng `FavoriteCourseModel` có compound unique index `{ user: 1, course: 1 }`. Mảng trong `User` bị thừa hoàn toàn. |
| **`Course.chapters`, `Chapter.lessons`, `Quiz.questions`, `Course.rating`** | Các mảng `ObjectId[]` 2 chiều | **LOẠI BỎ TOÀN BỘ MẢNG** | Trong Relational DB, quan hệ cha-con được thiết lập duy nhất bằng Foreign Key ở bảng con (`chapters.course_id`, `lessons.chapter_id`, `questions.quiz_id`, `ratings.course_id`). Loại bỏ toàn bộ code `$push`/`$pull` mảng phức tạp. |

---

## 4. QUY TẮC NGHIỆP VỤ (BUSINESS CONSTRAINTS TRONG SOURCE CODE)

1. **Ghi danh khóa học (Enrollment)**:
   - Một user chỉ enroll một khóa học **1 lần duy nhất**. Bằng chứng: [order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L29-L36) chặn nếu đã có `Order` completed; [order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L226-L230) dùng `EnrollmentModel.findOneAndUpdate({ user, course }, ..., { upsert: true })`.
   - Giảng viên **không thể mua chính khóa học của mình**: [order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L25-L27) (`course.author === userId -> 400`).
2. **Đánh giá khóa học (Rating)**:
   - Học viên **phải mua/ghi danh khóa học mới được đánh giá**: [rating.service.ts](file:///d:/e-learning_server/src/services/rating.service.ts#L30-L33).
   - Mỗi học viên chỉ được đánh giá **tối đa 1 lần** trên mỗi khóa học: [rating.service.ts](file:///d:/e-learning_server/src/services/rating.service.ts#L35-L38) và Schema index unique `{ user: 1, course: 1 }`.
   - Điểm đánh giá bắt buộc từ **1 đến 5 sao**, nội dung tối đa **100 ký tự**: [rating.model.ts](file:///d:/e-learning_server/src/models/rating.model.ts#L15-L25).
3. **Số lượng Quiz trên mỗi Lesson**:
   - Mỗi Lesson chỉ có **tối đa 1 Quiz**. Bằng chứng: [quiz.service.ts](file:///d:/e-learning_server/src/services/quiz.service.ts#L24-L26): `const existingQuiz = await QuizModel.findOne({ lesson: lessonDoc._id }); if (existingQuiz) return error("Lesson already has a quiz")`.
4. **Lần nộp bài Quiz (Quiz Submission)**:
   - Mỗi học viên chỉ được submit quiz **đúng 1 lần duy nhất**. Bằng chứng: [quizSubmission.service.ts](file:///d:/e-learning_server/src/services/quizSubmission.service.ts#L30-L32): `const existing = await QuizSubmissionModel.findOne({ quiz: quizId, user: userId }); if (existing) return error("You have already submitted this quiz")`.
   - Học viên **phải enroll khóa học** chứa quiz đó thì mới được làm bài: [quizSubmission.service.ts](file:///d:/e-learning_server/src/services/quizSubmission.service.ts#L27-L29).
5. **Khóa học và Danh mục (Category)**:
   - Mỗi khóa học chỉ thuộc về **duy nhất 1 Danh mục** (`category: ObjectId` dạng single reference).
6. **Phạm vi áp dụng Coupon**:
   - Coupon có thể áp dụng cho **nhiều khóa học** (`courses: ObjectId[]`).
   - Nếu `coupon.courses.length === 0`, coupon áp dụng cho mọi khóa học.
   - Nếu `courses.length > 0`, bắt buộc khóa học đang mua phải nằm trong mảng `coupon.courses`: [order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L76-L78).
   - Coupon có kiểm tra thời hạn `startDate <= now <= endDate` và giới hạn lượt dùng `used < limit`: [order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L63-L73).
7. **Thành viên cuộc trò chuyện (Conversation)**:
   - Chat 1 - 1: Có đúng **2 participants**, không cho phép tự chat với chính mình: [conversation.service.ts](file:///d:/e-learning_server/src/services/conversation.service.ts#L49-L56).
   - Chat nhóm (Q&A Group): Gắn với 1 Course (`course: ObjectId`), gồm tác giả khóa học (Teacher) và toàn bộ học viên đã ghi danh: [conversation.service.ts](file:///d:/e-learning_server/src/services/conversation.service.ts#L28-L34). Tự động thêm học viên khi đơn hàng hoàn tất: [order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L246-L250).
8. **Phản hồi và Tương tác Bình luận (Comment)**:
   - Chỉ học viên đã mua khóa học hoặc chính giảng viên khóa học mới được comment: [comment.service.ts](file:///d:/e-learning_server/src/services/comment.service.ts#L29-L42).
   - Bình luận phân cấp cây: `level = parentComment.level + 1`: [comment.service.ts](file:///d:/e-learning_server/src/services/comment.service.ts#L50).
   - Không được like 2 lần; nếu đang dislike mà bấm like thì tự động gỡ dislike và chuyển sang like (và ngược lại): [comment.service.ts](file:///d:/e-learning_server/src/services/comment.service.ts#L259-L268).
9. **Tiến độ học (Progress)**:
   - Tiến độ ghi nhận duy nhất theo cặp `(user, lesson)`: [progress.service.ts](file:///d:/e-learning_server/src/services/progress.service.ts#L21-L25).
   - Tự động tính phần trăm hoàn thành khóa học: `round((completedLessons / totalLessons) * 100)` và cập nhật vào `Enrollment.progress`.
10. **Chứng chỉ (Certificate)**:
    - Unique theo cặp `(user, course)`: [certificate.service.ts](file:///d:/e-learning_server/src/services/certificate.service.ts#L15-L18).
    - Điều kiện cấp: Học viên phải hoàn thành tiến độ `progress >= 70%`, tỷ lệ làm quiz `quizCompletionPercentage >= 60%`, và điểm trung bình cuối cùng `finalScore >= 50%`: [certificate.service.ts](file:///d:/e-learning_server/src/services/certificate.service.ts#L21-L65).

---

## 5. PHÂN TÍCH CHIẾN LƯỢC ĐỊNH DANH (ID STRATEGY)

1. **Thực trạng sử dụng ObjectId**:
   - Toàn bộ 19 models đều dùng kiểu `Schema.Types.ObjectId` mặc định của MongoDB (24 ký tự hex).
   - Trong code TypeScript, các interface định nghĩa ID lẫn lộn giữa `_id: string`, `_id: Types.ObjectId`, và `_id: Schema.Types.ObjectId`.
2. **Nơi lưu trữ và xử lý ObjectId**:
   - Ở tầng Middleware: Hơn 15 validator đang dùng `body('...').isMongoId()` và `param('...').isMongoId()` của thư viện `express-validator`.
   - Ở tầng Service: Gọi dày đặc `Types.ObjectId.isValid(id)` và `new Types.ObjectId(id)`.
3. **Expose qua API Response**:
   - API trả về trực tiếp document của Mongoose nên trường ID trả về cho client mang tên `_id` (kiểu string 24 ký tự).
   - Các field tham chiếu populate trả về object chứa `_id` (ví dụ: `author: { _id, username, avatar }`).
4. **Phụ thuộc của Frontend**:
   - Frontend hiện tại đang đọc key `_id` từ JSON response.
   - Khi chuyển sang PostgreSQL / Prisma: Tên trường khóa chính chuẩn trong SQL là `id`. Để **không làm vỡ hợp đồng API (API contract)** với Frontend, tầng Service/Serializer có thể map `id` thành `_id` hoặc cung cấp cả hai `id` và `_id`.
5. **Khuyến nghị định danh cho PostgreSQL**:
   - Không tự động thay đổi bừa bãi.
   - Chuẩn PostgreSQL khuyến nghị dùng **UUID v4** (hoặc chuỗi **CUID / NanoID** / **UUID v7**). Nếu muốn giữ chuỗi giống MongoDB trong giai đoạn chuyển đổi dữ liệu mà không lỗi format, Prisma hỗ trợ `@default(uuid())` hoặc giữ `String` ID.

---

## 6. XÓA VÀ SOFT DELETE (CASCADE / SOFT DELETE ANALYSIS)

### 6.1. Thực trạng Soft Delete (`_destroy`)
Có 3 Model cài đặt trường `_destroy: Boolean (default: false)`:
1. **`Category`**: [category.service.ts](file:///d:/e-learning_server/src/services/category.service.ts#L65) khi xóa gán `category._destroy = true`.
2. **`Course`**: [admin.service.ts](file:///d:/e-learning_server/src/services/admin.service.ts#L259) khi Admin xóa khóa học gán `course._destroy = true`.
3. **`Chapter`**: [chapter.service.ts](file:///d:/e-learning_server/src/services/chapter.service.ts#L111) khi xóa gán `chapter._destroy = true`.

### 6.2. Thực trạng Hard Delete (`deleteOne`, `deleteMany`, `findByIdAndDelete`)
- **`Lesson`**: [lesson.service.ts](file:///d:/e-learning_server/src/services/lesson.service.ts#L152): Xóa trực tiếp khỏi DB bằng `LessonModel.deleteOne()`.
- **`Quiz`**: [quiz.service.ts](file:///d:/e-learning_server/src/services/quiz.service.ts#L98-L100): Xóa thủ công `QuestionModel.deleteMany({ quiz })` rồi `quiz.deleteOne()`.
- **`Question`**: [question.service.ts](file:///d:/e-learning_server/src/services/question.service.ts#L101): `question.deleteOne()`.
- **`Comment`**: [comment.service.ts](file:///d:/e-learning_server/src/services/comment.service.ts#L124): `CommentModel.findByIdAndDelete()`.
- **`Rating`**: [rating.service.ts](file:///d:/e-learning_server/src/services/rating.service.ts#L181): `RatingModel.findByIdAndDelete()`.
- **`Coupon`**: [coupon.service.ts](file:///d:/e-learning_server/src/services/coupon.service.ts#L106): `coupon.deleteOne()`.
- **`FavoriteCourse`**: [favoriteCourse.service.ts](file:///d:/e-learning_server/src/services/favoriteCourse.service.ts#L25): `FavoriteCourseModel.findByIdAndDelete()`.
- **`Message`**: [message.service.ts](file:///d:/e-learning_server/src/services/message.service.ts#L74): `message.deleteOne()`.
- **`User` (Admin delete)**: [admin.service.ts](file:///d:/e-learning_server/src/services/admin.service.ts#L140): `UserModel.findByIdAndDelete(id)`. **CẢNH BÁO**: Hiện tại code chưa xử lý xóa các bảng liên quan của User!
- **`Order` khi bị từ chối**: [order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts#L215): Xóa đơn hàng `findByIdAndDelete(orderId)`.

### 6.3. BẢO VỆ DỮ LIỆU LỊCH SỬ (HISTORICAL DATA - TUYỆT ĐỐI KHÔNG CASCADE DELETE)
Các bảng sau chứa thông tin pháp lý, giao dịch tài chính và lịch sử học tập, **bắt buộc dùng `ON DELETE RESTRICT`**:
- **`Order`**: Tuyệt đối không xóa khi User hoặc Course bị xóa.
- **`Enrollment`**: Dữ liệu chứng minh người học đã mua và sở hữu khóa học.
- **`Certificate`**: Chứng chỉ đã cấp có giá trị vĩnh viễn, không được cascade delete.
- **`QuizSubmission`**: Lịch sử thi và bảng điểm.

---

## 7. MẪU TRUY VẤN QUAN TRỌNG (QUERY PATTERNS TRONG CODE)

1. **Nested Populate Đa Tầng**:
   - [course.service.ts](file:///d:/e-learning_server/src/services/course.service.ts#L121-L126):
     ```ts
     .populate({ path: 'author', select: '_id username avatar role' })
     .populate({
       path: 'chapters',
       select: '_id title',
       populate: { path: 'lessons', select: 'title duration isDemo' }
     })
     ```
     -> *Trong Prisma sẽ dùng `include: { author: true, chapters: { include: { lessons: true } } }`*.
2. **Tìm kiếm bằng RegExp không phân biệt hoa thường (`$regex`, `$options: 'i'`)**:
   - Sử dụng ở hầu hết các list API (`courses`, `users`, `orders`, `comments`, `coupons`).
   - -> *Trong Prisma/PostgreSQL sẽ dùng `{ contains: search, mode: 'insensitive' }`*.
3. **Toán tử Cập nhật Mảng và Số học**:
   - `$inc`: Tăng view (`$inc: { view: 1 }`), tăng sold (`$inc: { sold: 1 }`), tăng coupon used.
   - -> *Trong Prisma dùng `{ increment: 1 }` hoặc `{ decrement: 1 }`*.
   - `$push`, `$pull`, `$addToSet`: Dùng để duy trì các mảng ID.
   - -> *Trong SQL: Hoàn toàn biến mất, thay bằng việc `INSERT`/`DELETE` bản ghi ở bảng quan hệ con*.
4. **Phân trang (Pagination Pattern)**:
   - Áp dụng chuẩn `skip = (page - 1) * limit` và `Promise.all([find().skip().limit(), countDocuments()])`.
   - -> *Trong Prisma dùng `prisma.model.findMany({ skip, take })` và `prisma.model.count()`*.
5. **Hiện trạng Transaction / Session**:
   - **Hiện tại KHÔNG CÓ BẤT KỲ Mongoose Transaction nào (`startSession`)**. Các thao tác cập nhật đồng thời ở `order.service.ts` đang gọi `Promise.all([updateUser, updateCourse, updateEnrollment])` một cách rời rạc, có rủi ro hỏng dữ liệu nếu server sập giữa chừng.
   - -> *Khi chuyển sang Prisma, BẮT BUỘC dùng `prisma.$transaction([...])`*.

---

## 8. ĐÁNH GIÁ ĐỘ KHÓ MIGRATION (MIGRATION DIFFICULTY)

### 8.1. Nhóm DỄ (EASY)
*Đặc điểm: Cấu trúc phẳng, quan hệ 1-N đơn giản, ít ràng buộc nghiệp vụ, CRUD trực tiếp.*
1. **`Category`**: Bảng danh mục đơn giản, chỉ có self/user ref đơn giản, cờ `_destroy`.
2. **`FavoriteCourse`**: Bảng trung gian thuần túy giữa User và Course với compound unique index.
3. **`Notification`**: Bảng thông báo dạng log phẳng (ngoại trừ trường đa hình `relatedId`).

### 8.2. Nhóm TRUNG BÌNH (MEDIUM)
*Đặc điểm: Có quan hệ cây đệ quy, logic kiểm tra điều kiện nhiều, tính toán toán học.*
4. **`User`**: Có nhiều trường xác thực, token, hash, nhưng cần xử lý dị thường kiểu dữ liệu `isVerified`.
5. **`Chapter`**: Quan hệ 1-N với Course và Lesson, có sắp xếp thứ tự `order`.
6. **`Lesson`**: Quan hệ với Chapter, Course, User; có slug, duration, type enum.
7. **`Question`**: Cần chuẩn hóa mảng `options: string[]`.
8. **`Rating`**: Quan hệ User-Course có ràng buộc unique, tính toán điểm trung bình `averageRating`.
9. **`Progress`**: Gắn chặt với User-Lesson và trigger tính lại % tiến độ của Enrollment.
10. **`Certificate`**: Có điều kiện tính toán điểm phức tạp trước khi cấp, tích hợp gọi PDF Cloudinary.
11. **`Coupon`**: Chứa mảng N-N với Course, có logic trừ lượt dùng `limit/used` và hạn sử dụng.

### 8.3. Nhóm KHÓ (HARD)
*Đặc điểm: Embedded data phức tạp, N-N unbounded arrays, quan hệ hai chiều, realtime socket, xử lý giao dịch tài chính.*
12. **`Course`**: Cực kỳ phức tạp do chứa embedded document `info` (qa, requirements, benefits...), mảng 2 chiều với chapters, ratings, và nhiều trạng thái duyệt bài.
13. **`Quiz` & `QuizSubmission`**: Chứa mảng subdocument `answers`, kiểu dữ liệu `selectedAnswer: Mixed`, chấm điểm tự động từ nhiều câu hỏi, yêu cầu toàn vẹn dữ liệu thi cử.
14. **`Order`**: Nghiệp vụ tài chính cốt lõi, cập nhật đồng thời nhiều bảng (Order, User, Course, Coupon, Enrollment, Conversation), bắt buộc phải tái cấu trúc với ACID `$transaction`.
15. **`Enrollment`**: Trung tâm của hệ thống, liên kết tiến độ học, cấp chứng chỉ, quyền bình luận, và phân quyền nhóm chat.
16. **`Comment`**: Cây phân cấp đệ quy vô hạn (`parentId`), đồng thời quản lý mảng `likes` và `dislikes` N-N.
17. **`Conversation` & `Message`**: Hệ sinh thái chat realtime tích hợp Socket.IO, quản lý thành viên động (auto-sync khi mua khóa học) và trạng thái đã đọc (`readBy`).

---

## 9. ĐỀ XUẤT ÁNH XẠ SANG POSTGRESQL (DESIGN PROPOSAL)

> **Lưu ý**: Đây là bản thiết kế kiến trúc đề xuất (Architectural Design Proposal), **chưa tạo file `schema.prisma`** theo đúng chỉ thị.

```
MongoDB Models (19) 
  ───► Chuẩn hóa 3NF 
  ───► PostgreSQL Tables (24 Tables: 19 core + 5 normalized/junction tables)
```

### 9.1. Bảng `users` (từ `User`)
- **PK**: `id` (`UUID` hoặc `String`)
- **Columns**: `username`, `email` (UNIQUE), `password`, `status`, `role`, `avatar`, `phone`, `bio`, `social_facebook`, `social_instagram`, `social_github`, `is_verified` (`BOOLEAN`, Default: `false`), `otp_code`, `otp_expires`, `refresh_token`, `reset_password_token`, `reset_password_expires`, `created_at`, `updated_at`.
- **Loại bỏ**: Mảng `courses[]` và `favorites[]`.

### 9.2. Bảng `categories` (từ `Category`)
- **PK**: `id` (`UUID`)
- **FK**: `created_by_id` -> `users(id)` (ON DELETE SET NULL)
- **Columns**: `name` (UNIQUE), `slug` (UNIQUE), `description`, `is_destroyed` (`BOOLEAN`, Default: `false`), `created_at`, `updated_at`.

### 9.3. Bảng `courses` (từ `Course`)
- **PK**: `id` (`UUID`)
- **FK**: `category_id` -> `categories(id)` (ON DELETE SET NULL), `author_id` -> `users(id)` (ON DELETE RESTRICT)
- **Columns**: `title`, `slug` (UNIQUE), `image`, `intro_url`, `description`, `price` (`DECIMAL(12,2)`), `old_price` (`DECIMAL(12,2)`), `type`, `status`, `level`, `view` (`INT`), `sold` (`INT`), `requirements` (`TEXT[]`), `benefits` (`TEXT[]`), `techniques` (`TEXT[]`), `documents` (`TEXT[]`), `is_destroyed` (`BOOLEAN`), `created_at`, `updated_at`.
- **Loại bỏ**: Mảng `chapters[]` và `rating[]`.

### 9.4. Bảng `course_faqs` *(Chuẩn hóa từ `course.info.qa`)*
- **PK**: `id` (`UUID`)
- **FK**: `course_id` -> `courses(id)` (ON DELETE CASCADE)
- **Columns**: `question` (`TEXT`), `answer` (`TEXT`), `order` (`INT`).

### 9.5. Bảng `chapters` (từ `Chapter`)
- **PK**: `id` (`UUID`)
- **FK**: `course_id` -> `courses(id)` (ON DELETE CASCADE)
- **Columns**: `title`, `order` (`INT`), `is_destroyed` (`BOOLEAN`), `created_at`, `updated_at`.
- **Loại bỏ**: Mảng `lessons[]`.

### 9.6. Bảng `lessons` (từ `Lesson`)
- **PK**: `id` (`UUID`)
- **FK**: `chapter_id` -> `chapters(id)` (ON DELETE CASCADE), `course_id` -> `courses(id)` (ON DELETE CASCADE), `author_id` -> `users(id)` (ON DELETE RESTRICT)
- **Columns**: `title`, `slug` (UNIQUE theo course), `order`, `duration`, `type`, `content`, `is_demo`, `video_url`, `created_at`, `updated_at`.

### 9.7. Bảng `quizzes` (từ `Quiz`)
- **PK**: `id` (`UUID`)
- **FK**: `lesson_id` -> `lessons(id)` (ON DELETE CASCADE, **UNIQUE** để đảm bảo quan hệ 1-1), `course_id` -> `courses(id)` (ON DELETE CASCADE), `created_by_id` -> `users(id)` (ON DELETE RESTRICT)
- **Columns**: `title`, `description`, `duration`, `passing_grade`, `created_at`, `updated_at`.
- **Loại bỏ**: Mảng `questions[]`.

### 9.8. Bảng `questions` (từ `Question`)
- **PK**: `id` (`UUID`)
- **FK**: `quiz_id` -> `quizzes(id)` (ON DELETE CASCADE)
- **Columns**: `type`, `title`, `answer`, `points` (`INT`, Default: 1), `created_at`, `updated_at`.

### 9.9. Bảng `question_options` *(Chuẩn hóa từ `question.options`)*
- **PK**: `id` (`UUID`)
- **FK**: `question_id` -> `questions(id)` (ON DELETE CASCADE)
- **Columns**: `option_text` (`TEXT`), `order` (`INT`).

### 9.10. Bảng `quiz_submissions` (từ `QuizSubmission`)
- **PK**: `id` (`UUID`)
- **FK**: `quiz_id` -> `quizzes(id)` (ON DELETE CASCADE), `user_id` -> `users(id)` (ON DELETE CASCADE)
- **Columns**: `score`, `total_points`, `percentage`, `completed_at`, `created_at`, `updated_at`.
- **Constraint**: `UNIQUE(quiz_id, user_id)` (1 lần nộp duy nhất theo logic code).

### 9.11. Bảng `quiz_submission_answers` *(Chuẩn hóa từ `quizSubmission.answers`)*
- **PK**: `id` (`UUID`)
- **FK**: `submission_id` -> `quiz_submissions(id)` (ON DELETE CASCADE), `question_id` -> `questions(id)` (ON DELETE CASCADE)
- **Columns**: `selected_answer` (`TEXT`), `is_correct` (`BOOLEAN`).

### 9.12. Bảng `orders` (từ `Order`)
- **PK**: `id` (`UUID`)
- **FK**: `user_id` -> `users(id)` (ON DELETE RESTRICT), `course_id` -> `courses(id)` (ON DELETE RESTRICT), `coupon_id` -> `coupons(id)` (ON DELETE SET NULL)
- **Columns**: `code` (UNIQUE), `amount` (`DECIMAL(12,2)`), `discount` (`DECIMAL(12,2)`), `total` (`DECIMAL(12,2)`), `status`, `created_at`, `updated_at`.

### 9.13. Bảng `coupons` (từ `Coupon`)
- **PK**: `id` (`UUID`)
- **FK**: `author_id` -> `users(id)` (ON DELETE SET NULL)
- **Columns**: `title`, `code` (UNIQUE), `type`, `value` (`DECIMAL(12,2)`), `limit` (`INT`), `used` (`INT`), `start_date`, `end_date`, `active` (`BOOLEAN`), `created_at`, `updated_at`.

### 9.14. Bảng `coupon_courses` *(Junction Table N-N)*
- **PK**: `(coupon_id, course_id)`
- **FK**: `coupon_id` -> `coupons(id)` (ON DELETE CASCADE), `course_id` -> `courses(id)` (ON DELETE CASCADE).

### 9.15. Bảng `enrollments` (từ `Enrollment`)
- **PK**: `id` (`UUID`)
- **FK**: `user_id` -> `users(id)` (ON DELETE CASCADE), `course_id` -> `courses(id)` (ON DELETE CASCADE)
- **Columns**: `progress` (`INT`), `status`, `enrolled_at`, `completed_at`, `created_at`, `updated_at`.
- **Constraint**: `UNIQUE(user_id, course_id)`.

### 9.16. Bảng `progress` (từ `Progress`)
- **PK**: `id` (`UUID`)
- **FK**: `user_id` -> `users(id)` (ON DELETE CASCADE), `course_id` -> `courses(id)` (ON DELETE CASCADE), `lesson_id` -> `lessons(id)` (ON DELETE CASCADE)
- **Columns**: `completed` (`BOOLEAN`), `created_at`, `updated_at`.
- **Constraint**: `UNIQUE(user_id, lesson_id)`.

### 9.17. Bảng `certificates` (từ `Certificate`)
- **PK**: `id` (`UUID`)
- **FK**: `user_id` -> `users(id)` (ON DELETE RESTRICT), `course_id` -> `courses(id)` (ON DELETE RESTRICT)
- **Columns**: `grade` (`DECIMAL(5,2)`), `certificate_url` (`TEXT`), `issued_at`, `created_at`, `updated_at`.
- **Constraint**: `UNIQUE(user_id, course_id)`.

### 9.18. Bảng `ratings` (từ `Rating`)
- **PK**: `id` (`UUID`)
- **FK**: `user_id` -> `users(id)` (ON DELETE CASCADE), `course_id` -> `courses(id)` (ON DELETE CASCADE)
- **Columns**: `rate` (`SMALLINT`), `content` (`VARCHAR(255)`), `status`, `created_at`, `updated_at`.
- **Constraint**: `UNIQUE(user_id, course_id)`.

### 9.19. Bảng `favorite_courses` (từ `FavoriteCourse`)
- **PK**: `id` (`UUID`)
- **FK**: `user_id` -> `users(id)` (ON DELETE CASCADE), `course_id` -> `courses(id)` (ON DELETE CASCADE)
- **Columns**: `created_at`.
- **Constraint**: `UNIQUE(user_id, course_id)`.

### 9.20. Bảng `comments` (từ `Comment`)
- **PK**: `id` (`UUID`)
- **FK**: `lesson_id` -> `lessons(id)` (ON DELETE CASCADE), `course_id` -> `courses(id)` (ON DELETE CASCADE), `user_id` -> `users(id)` (ON DELETE CASCADE), `parent_id` -> `comments(id)` (ON DELETE CASCADE, Self-referencing)
- **Columns**: `content` (`TEXT`), `level` (`INT`), `status`, `created_at`, `updated_at`.
- **Loại bỏ**: Mảng `likes[]` và `dislikes[]`.

### 9.21. Bảng `comment_reactions` *(Chuẩn hóa từ `comment.likes` và `dislikes`)*
- **PK**: `id` (`UUID`)
- **FK**: `comment_id` -> `comments(id)` (ON DELETE CASCADE), `user_id` -> `users(id)` (ON DELETE CASCADE)
- **Columns**: `type` (`VARCHAR(10)`, Enum: `'like'`, `'dislike'`), `created_at`.
- **Constraint**: `UNIQUE(comment_id, user_id)`.

### 9.22. Bảng `conversations` (từ `Conversation`)
- **PK**: `id` (`UUID`)
- **FK**: `course_id` -> `courses(id)` (ON DELETE CASCADE, Nullable)
- **Columns**: `is_group` (`BOOLEAN`), `name` (`VARCHAR(255)`), `last_message_id` (`UUID`, Nullable), `created_at`, `updated_at`.

### 9.23. Bảng `conversation_participants` *(Junction Table N-N)*
- **PK**: `(conversation_id, user_id)`
- **FK**: `conversation_id` -> `conversations(id)` (ON DELETE CASCADE), `user_id` -> `users(id)` (ON DELETE CASCADE)
- **Columns**: `joined_at` (`TIMESTAMPTZ`, Default: `NOW()`).

### 9.24. Bảng `messages` (từ `Message`)
- **PK**: `id` (`UUID`)
- **FK**: `conversation_id` -> `conversations(id)` (ON DELETE CASCADE), `sender_id` -> `users(id)` (ON DELETE RESTRICT)
- **Columns**: `content` (`TEXT`), `type` (`VARCHAR(20)`), `is_edited` (`BOOLEAN`), `created_at`, `updated_at`.

### 9.25. Bảng `message_reads` *(Chuẩn hóa từ `message.readBy`)*
- **PK**: `(message_id, user_id)`
- **FK**: `message_id` -> `messages(id)` (ON DELETE CASCADE), `user_id` -> `users(id)` (ON DELETE CASCADE)
- **Columns**: `read_at` (`TIMESTAMPTZ`, Default: `NOW()`).

### 9.26. Bảng `notifications` (từ `Notification`)
- **PK**: `id` (`UUID`)
- **FK**: `receiver_id` -> `users(id)` (ON DELETE CASCADE), `sender_id` -> `users(id)` (ON DELETE SET NULL)
- **Columns**: `type`, `message` (`TEXT`), `related_id` (`VARCHAR(255)`, đa hình), `is_read` (`BOOLEAN`), `created_at`, `updated_at`.

---

## 10. RỦI RO KHI MIGRATE (MIGRATION RISKS)

1. **Rủi ro Dị thường Kiểu dữ liệu (`isVerified`)**:
   - `User.isVerified` trong MongoDB chứa cả boolean `false` và string rỗng `''`. PostgreSQL ép kiểu `BOOLEAN` nghiêm ngặt (`true/false`). Nếu code hoặc cron job query `isVerified: ''`, query sẽ lỗi ngay lập tức. Cần chuẩn hóa toàn bộ dữ liệu này thành `false` trước khi migrate.
2. **Rủi ro Mất tính toàn vẹn khi chưa dùng Transaction**:
   - Khi chuyển đổi các hàm như `createOrderService` và `updateOrderStatusService` sang Prisma, nếu không đưa vào `prisma.$transaction()`, trạng thái giữa đơn hàng, số lượng bán của khóa học, lượt dùng coupon và ghi danh học viên sẽ bị lệch nếu xảy ra lỗi mạng.
3. **Rủi ro Định dạng ID giữa Backend và Frontend**:
   - Nếu đổi từ chuỗi 24 hex `ObjectId` sang `UUID` (36 ký tự có dấu gạch ngang), frontend kiểm tra regex `ObjectId` hoặc middleware `isMongoId()` sẽ chặn request. Phải cập nhật đồng bộ các middleware validator.
4. **Rủi ro Dữ liệu N-N và Mảng Unbounded**:
   - Chuyển `comment.likes[]` và `dislikes[]` sang bảng `comment_reactions` cần viết migration script lặp qua từng phần tử mảng của MongoDB để insert thành từng dòng trong bảng SQL. Nếu mảng rỗng hoặc có ID rác (ID user đã bị xóa), migration script sẽ vấp lỗi Foreign Key constraint.
5. **Rủi ro Trường Đa hình `Notification.relatedId`**:
   - Trong MongoDB, `relatedId` lưu ObjectId trỏ tới bất kỳ collection nào. Trong PostgreSQL, không thể tạo 1 Foreign Key trỏ tới nhiều bảng cùng lúc. Bắt buộc phải giữ `related_id` dạng `VARCHAR(255)` không có Foreign Key cứng.
6. **Rủi ro Kiểu số thực và Tiền tệ (`price`, `total`, `discount`)**:
   - MongoDB dùng kiểu `Number` (Double floating-point). Trong PostgreSQL bắt buộc dùng `DECIMAL(12, 2)` để tránh sai số dấu phẩy động trong giao dịch thương mại.
7. **Rủi ro Đồng bộ Tin nhắn Realtime (Socket.IO)**:
   - File [initSocket.ts](file:///d:/e-learning_server/src/socket/initSocket.ts) đang gọi trực tiếp `createMessageService`. Khi chuyển sang Prisma, tốc độ ghi và schema trả về phải đảm bảo cấu trúc object emit qua socket không bị đổi tên field khiến giao diện chat của người dùng bị lỗi hiển thị.

---

## 11. BẢNG TỔNG KẾT FINAL CHECK (FINAL CHECK TABLE)

| Model MongoDB | PostgreSQL Table Đề xuất | Primary Key | Foreign Keys chính | Quan hệ thực thể | Độ khó Migration | Rủi ro chính |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `users` | `id` (UUID) | Không | 1-N (Course, Order,...) | **MEDIUM** | Dị thường kiểu `isVerified`, hash token |
| **Category** | `categories` | `id` (UUID) | `created_by_id` | 1-N (Course) | **EASY** | Thấp |
| **Course** | `courses` | `id` (UUID) | `category_id`, `author_id` | 1-N (Chapter, Lesson), N-N | **HARD** | Embedded info, mảng chapters 2 chiều |
| *Embedded QA* | `course_faqs` | `id` (UUID) | `course_id` | 1-N (từ Course) | **MEDIUM** | Tách mảng subdocument sang bảng |
| **Chapter** | `chapters` | `id` (UUID) | `course_id` | 1-N (Lesson) | **MEDIUM** | Mảng lessons 2 chiều |
| **Lesson** | `lessons` | `id` (UUID) | `chapter_id`, `course_id`, `author_id` | 1-1 (Quiz), 1-N | **MEDIUM** | Unique slug theo course |
| **Quiz** | `quizzes` | `id` (UUID) | `lesson_id` (UQ), `course_id`, `created_by_id` | 1-1 (Lesson), 1-N (Question) | **MEDIUM** | Ràng buộc duy nhất 1 quiz/lesson |
| **Question** | `questions` | `id` (UUID) | `quiz_id` | 1-N (Option, Answer) | **MEDIUM** | Chuẩn hóa options |
| *Question Options*| `question_options`| `id` (UUID) | `question_id` | 1-N (từ Question) | **MEDIUM** | Tách mảng string sang bảng |
| **QuizSubmission**| `quiz_submissions`| `id` (UUID) | `quiz_id`, `user_id` | 1-N (SubmissionAnswer) | **HARD** | Subdocuments answers, chấm điểm |
| *Submission Ans* | `quiz_submission_answers` | `id` (UUID) | `submission_id`, `question_id` | 1-N | **HARD** | Kiểu dữ liệu Mixed ở câu trả lời |
| **Order** | `orders` | `id` (UUID) | `user_id`, `course_id`, `coupon_id` | 1-N | **HARD** | ACID Transaction, tính tiền |
| **Coupon** | `coupons` | `id` (UUID) | `author_id` | N-N (Course), 1-N (Order) | **MEDIUM** | Tách mảng courses sang junction table |
| *Coupon Courses* | `coupon_courses` | `(coupon_id, course_id)` | `coupon_id`, `course_id` | N-N Junction | **MEDIUM** | Mảng courses rỗng = all courses |
| **Enrollment** | `enrollments` | `id` (UUID) | `user_id`, `course_id` | 1-1 logic (User-Course) | **HARD** | Trung tâm phân quyền học tập |
| **Progress** | `progress` | `id` (UUID) | `user_id`, `course_id`, `lesson_id` | 1-1 logic (User-Lesson) | **MEDIUM** | Trigger tính % hoàn thành |
| **Certificate** | `certificates` | `id` (UUID) | `user_id`, `course_id` | 1-1 logic (User-Course) | **MEDIUM** | Điều kiện cấp chứng chỉ nghiêm ngặt |
| **Rating** | `ratings` | `id` (UUID) | `user_id`, `course_id` | 1-1 index (User-Course) | **MEDIUM** | Mảng rating ở Course bị gỡ bỏ |
| **FavoriteCourse**| `favorite_courses`| `id` (UUID) | `user_id`, `course_id` | N-N Junction | **EASY** | Thấp |
| **Comment** | `comments` | `id` (UUID) | `lesson_id`, `course_id`, `user_id`, `parent_id` | Self-Ref (Tree), N-N | **HARD** | Cây đệ quy, tách like/dislike |
| *Reactions* | `comment_reactions` | `id` (UUID) | `comment_id`, `user_id` | N-N Junction | **MEDIUM** | Migrate từ 2 mảng likes/dislikes |
| **Conversation** | `conversations` | `id` (UUID) | `course_id` | N-N (User), 1-N (Message) | **HARD** | Realtime socket, sync học viên |
| *Participants* | `conversation_participants` | `(conversation_id, user_id)` | `conversation_id`, `user_id` | N-N Junction | **HARD** | Migrate từ mảng participants |
| **Message** | `messages` | `id` (UUID) | `conversation_id`, `sender_id` | 1-N | **MEDIUM** | Socket realtime payload |
| *Message Reads* | `message_reads` | `(message_id, user_id)` | `message_id`, `user_id` | N-N Junction | **MEDIUM** | Migrate từ mảng readBy |
| **Notification** | `notifications` | `id` (UUID) | `receiver_id`, `sender_id` | 1-N | **EASY** | Trường đa hình related_id |
