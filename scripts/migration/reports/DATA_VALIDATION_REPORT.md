# MongoDB → PostgreSQL Migration Data Validation Report

> **Mode**: READ-ONLY DRY RUN (Zero database writes executed)  
> **Timestamp**: 2026-09-30T14:38:00.202Z  
> **Verdict**: **READY_WITH_WARNINGS**

---

## 1. Execution Information

- **Execution Mode**: `READ_ONLY`
- **MongoDB Source Database**: `e-learning` (MongoDB Atlas)
- **PostgreSQL Target Database**: `tmdemy` (localhost:5432)
- **Prisma Schema Status**: Verified & Synced (`orders.course_id` is Nullable)
- **Total Source Documents Analyzed**: **120 documents** across 19 collections

---

## 2. Source Collection Counts

| MongoDB Collection | Expected Baseline | Actual Count | Status |
|:---|:---:|:---:|:---:|
| `users` | 7 | 7 | ✅ MATCH |
| `categories` | 3 | 3 | ✅ MATCH |
| `courses` | 8 | 8 | ✅ MATCH |
| `chapters` | 12 | 12 | ✅ MATCH |
| `lessons` | 7 | 7 | ✅ MATCH |
| `quizzes` | 3 | 3 | ✅ MATCH |
| `questions` | 5 | 5 | ✅ MATCH |
| `quizsubmissions` | 2 | 2 | ✅ MATCH |
| `orders` | 8 | 8 | ✅ MATCH |
| `coupons` | 2 | 2 | ✅ MATCH |
| `enrollments` | 5 | 5 | ✅ MATCH |
| `progresses` | 4 | 4 | ✅ MATCH |
| `certificates` | 1 | 1 | ✅ MATCH |
| `ratings` | 1 | 1 | ✅ MATCH |
| `favoritecourses` | 2 | 2 | ✅ MATCH |
| `comments` | 8 | 8 | ✅ MATCH |
| `conversations` | 2 | 2 | ✅ MATCH |
| `messages` | 12 | 12 | ✅ MATCH |
| `notifications` | 28 | 28 | ✅ MATCH |

---

## 3. Entity Mapping Summary

| MongoDB Collection | PostgreSQL Target Table | Source Count | Transformed / Preview Rows | Mapping Status |
|:---|:---|:---:|:---:|:---:|
| `users` | `users` | 7 | 7 | ✅ Mapped 1:1 |
| `categories` | `categories` | 3 | 3 | ✅ Mapped 1:1 |
| `courses` | `courses` | 8 | 8 | ✅ Mapped 1:1 |
| `courses.info.qa` | `course_faqs` | embedded | 8 | ✅ Normalized 1:N |
| `chapters` | `chapters` | 12 | 12 | ✅ Mapped 1:1 |
| `lessons` | `lessons` | 7 | 7 | ✅ Mapped 1:1 |
| `quizzes` | `quizzes` | 3 | 3 | ✅ Mapped 1:1 (Lesson 1-1) |
| `questions` | `questions` | 5 | 5 | ✅ Mapped 1:1 |
| `questions.options` | `question_options` | embedded | 20 | ✅ Normalized 1:N |
| `quizsubmissions` | `quiz_submissions` | 2 | 2 | ✅ Mapped 1:1 |
| `quizsubmissions.answers` | `quiz_submission_answers` | embedded | 4 | ✅ Normalized 1:N |
| `orders` | `orders` | 8 | 8 | ✅ Mapped 1:1 (3 Orphans: courseId = null) |
| `coupons` | `coupons` | 2 | 2 | ✅ Mapped 1:1 |
| `coupons.courses` | `coupon_courses` | embedded | 2 | ✅ Composite N:N |
| `enrollments` | `enrollments` | 5 | 5 | ✅ Mapped 1:1 |
| `progresses` | `progress` | 4 | 4 | ✅ Mapped 1:1 |
| `certificates` | `certificates` | 1 | 1 | ✅ Mapped 1:1 |
| `ratings` | `ratings` | 1 | 1 | ✅ Mapped 1:1 |
| `favoritecourses` | `favorite_courses` | 2 | 2 | ✅ Mapped 1:1 |
| `comments` | `comments` | 8 | 8 | ✅ Mapped 1:1 (Tree hierarchy) |
| `comments.likes/dislikes` | `comment_reactions` | embedded | 1 | ✅ Normalized 1:N |
| `conversations` | `conversations` | 2 | 2 | ✅ Mapped 1:1 |
| `conversations.participants`| `conversation_participants` | embedded | 6 | ✅ Composite N:N |
| `messages` | `messages` | 12 | 12 | ✅ Mapped 1:1 |
| `messages.readBy` | `message_reads` | embedded | 0 | ✅ Composite N:N |
| `notifications` | `notifications` | 28 | 28 | ✅ Polymorphic relatedId resolved |

---

## 4. Foreign Key Validation

- **Critical Missing Foreign Keys**: **0** (Tất cả khóa ngoại bắt buộc đều tồn tại hợp lệ).
- **Optional/Nullable References Handled**:
  - `orders.course_id`: 3 đơn hàng tham chiếu khóa học đã bị xóa ở MongoDB $ightarrow$ Đặt `course_id = NULL` theo đúng quyết định tại `ORPHAN_ORDER_DECISION.md`.
  - `notifications.sender_id`: Các thông báo hệ thống không có sender $ightarrow$ Đặt `sender_id = NULL`.
  - `courses.category_id`: Danh mục có thể null nếu category bị gỡ $ightarrow$ Hợp lệ theo schema.

---

## 5. Orphan Records (Đơn hàng mồ côi đã nhận diện)

Phát hiện đúng **3 đơn hàng mồ côi** trong collection `orders` đã được phân tích và xử lý theo schema:

* **Order Code `DH-2714351`** (Mongo ID: `68ebc85ab800ff9b01818de5`):
  * Missing Course ID: `68d3f7fce710d52ff772629b`
  * Order Status: `completed` | Total: `0 VND`
  * Target PostgreSQL: `courseId = NULL` (PRESERVE ORDER / SET COURSE NULL)

* **Order Code `DH-7806607`** (Mongo ID: `68e5257e43b2786ec96458e8`):
  * Missing Course ID: `68d3f83ce710d52ff77262a3`
  * Order Status: `pending` | Total: `699,000 VND`
  * Target PostgreSQL: `courseId = NULL` (PRESERVE ORDER / SET COURSE NULL)

* **Order Code `DH-2062171`** (Mongo ID: `68ebc5ce500211ca4f063445`):
  * Missing Course ID: `68ebc108e0a02fc17af9c31a`
  * Order Status: `pending` | Total: `100,000 VND`
  * Target PostgreSQL: `courseId = NULL` (PRESERVE ORDER / SET COURSE NULL)

---

## 6. Unique Constraint Validation

Đã kiểm tra 12 ràng buộc Unique & Composite Unique:
1. `users(email)`: **0 duplicates** (PASS)
2. `categories(slug)`: **0 duplicates** (PASS)
3. `courses(slug)`: **0 duplicates** (PASS)
4. `orders(code)`: **0 duplicates** (PASS)
5. `coupons(code)`: **0 duplicates** (PASS)
6. `quizzes(lesson_id)`: **0 duplicates** (Quan hệ 1-1 tuyệt đối, PASS)
7. `enrollments(user_id, course_id)`: **0 duplicates** (PASS)
8. `progress(user_id, lesson_id)`: **0 duplicates** (PASS)
9. `certificates(user_id, course_id)`: **0 duplicates** (PASS)
10. `ratings(user_id, course_id)`: **0 duplicates** (PASS)
11. `favorite_courses(user_id, course_id)`: **0 duplicates** (PASS)
12. `quiz_submissions(quiz_id, user_id)`: **0 duplicates** (PASS)

---

## 7. Enum Validation

Đã đối chiếu toàn bộ các giá trị String trong MongoDB với 15 Enums của PostgreSQL:
- `UserRole` (`admin`, `user`, `teacher`): **100% Valid**
- `UserStatus` (`active`, `inactive`): **100% Valid**
- `CourseStatus` (`approved`, `pending`, `rejected`): **100% Valid**
- `CourseLevel` (`beginner`, `intermediate`, `advanced`): **100% Valid**
- `CourseType` (`paid`, `free`): **100% Valid**
- `LessonType` (`video`, `text`): **100% Valid**
- `ECouponType` (`percentage`, `number`): **100% Valid**
- `EOrderStatus` (`pending`, `completed`, `rejected`): **100% Valid**
- `ENotificationType` (9 giá trị): **100% Valid**
- **Enum Mismatches**: **0** (Không có giá trị lạ ngoài enum).

---

## 8. Nullability Validation

- Đã kiểm tra tất cả các cột `NOT NULL` theo Prisma schema:
  - `users`: `username`, `email`, `password` đều có giá trị hợp lệ.
  - `courses`: `title`, `slug`, `authorId` đều có giá trị hợp lệ.
  - `lessons`: `title`, `slug`, `order`, `chapterId`, `courseId` đều có giá trị hợp lệ.
  - `orders`: `code`, `amount`, `total`, `userId` đều có giá trị hợp lệ.
- **Nullability Errors**: **0**.

---

## 9. Sub-Entity Validation

| Sub-Entity Table | Parent Entity | Số lượng trích xuất | Phương thức sinh UUID |
|:---|:---|:---:|:---|
| `course_faqs` | `courses` | 8 | `toSubEntityUuid('course_faqs', courseId, index)` |
| `question_options` | `questions` | 20 | `toSubEntityUuid('question_options', questionId, index)` |
| `quiz_submission_answers` | `quiz_submissions` | 4 | `toSubEntityUuid('quiz_submission_answers', subId, index)` |

> ℹ️ **SUB-ENTITY ID STRATEGY: INDEX-BASED**  
> Các phần tử mảng con không có Mongo ObjectId được định danh theo công thức tất định `<entity>:<parent_id>:<index>`. Tính toán hoàn toàn cố định và không thay đổi giữa các lần chạy.

---

## 10. Notification Related ID Validation

- **Tổng số Notifications**: 28 documents
- **Phân giải Polymorphic ID**:
  - `type = 'rating'`: 1 notification $ightarrow$ Mapped sang UUID của `ratings`
  - `type = 'order'`: 14 notifications $ightarrow$ Mapped sang UUID của `orders`
  - `type = 'quiz'`: 2 notifications $ightarrow$ Mapped sang UUID của `quiz_submissions`
  - `type = 'comment'` / `comment_reply`: 11 notifications $ightarrow$ Mapped sang UUID của `comments`
- **Invalid / Broken Polymorphic References**: **0**.

---

## 11. UUID Mapping Preview (Mẫu đối chiếu)

| Entity Scope | MongoDB Source ID | Generated PostgreSQL UUID v5 |
|:---|:---|:---|
| `users` | `68dcf8f9e3617ec76053b4d7` | `c55de839-f059-519c-8820-b16aa17fb9c3` |
| `categories` | `68d6b6225de7c31f87236bb0` | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` |
| `courses` | `68d3f862e710d52ff77262a7` | `88b09b74-a128-535c-a2ad-6e72e6f45652` |
| `chapters` | `68d74e52c6ea726291d68d68` | `44408597-1975-5544-94a9-940bb1140c33` |
| `lessons` | `68db38d7dd667efb615e2549` | `1b2e6643-0006-5e9a-a9f7-3d3078b83262` |
| `quizzes` | `68ef66bed0786b1debaceb61` | `9ef997e1-64a1-5391-8647-7b59ddb68d36` |
| `questions` | `68efc26e56c8e188e87cd459` | `efac87d1-9e7d-5dca-9557-e6692b953ed4` |
| `orders` | `68e5257e43b2786ec96458e8` | `d1cb1f28-b9d9-54d4-8765-347e83edae80` |
| `enrollments` | `68e53837d761d319a244bab6` | `3acb5ff8-859b-58c9-a3b6-ff56e45ab790` |
| `comments` | `68ecccf11ad0a8e2a36f9913` | `fd6ded83-54e0-5807-b5af-244551274a22` |
| `conversations` | `68f1dcdb0052411ea7c73a5b` | `c44f9756-f63a-5e29-982e-cb647bf92ec3` |
| `messages` | `69060bb098424643f32add67` | `0cdeec55-79ec-591b-ab4b-0f8ce3b391a2` |
| `notifications` | `68ebd62d7dc661dee7403afe` | `daf144ef-ae5b-5606-8f01-8474b20dadc5` |

---

## 12. PostgreSQL-Shaped Preview (Mẫu bản ghi đã chuyển đổi)

### Sample 1: Transformed User
```json
{
  "id": "c55de839-f059-519c-8820-b16aa17fb9c3",
  "username": "minhsuyyyyy",
  "email": "thaiminh061204@gmail.com",
  "password": "$2b$10$4pjTU45VzjBudIX057lCn.qNhSCk4b7630iK.PYq8JBOdyMHpwVUS",
  "status": "active",
  "avatar": null,
  "phone": "0909345654",
  "bio": "I'm Minh suyyyy , fullstack.",
  "role": "user",
  "isVerified": false,
  "facebook": null,
  "instagram": null,
  "github": null,
  "otpCode": null,
  "otpExpires": null,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGRjZjhmOWUzNjE3ZWM3NjA1M2I0ZDciLCJpYXQiOjE3NjI1NjUxNTksImV4cCI6MTc2MzE2OTk1OX0.KGf1CnMt0WHXublD1ZxNPFOWZH71qs3qUjdSShxOiRo",
  "resetPasswordToken": null,
  "resetPasswordExpires": null,
  "createdAt": "2025-10-01T09:48:41.238Z",
  "updatedAt": "2025-11-08T01:25:59.517Z"
}
```

### Sample 2: Transformed Course
```json
{
  "id": "88b09b74-a128-535c-a2ad-6e72e6f45652",
  "title": "Machine Learning Fundamentals",
  "slug": "machine-learning-fundamentals",
  "image": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80",
  "introUrl": "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
  "description": "Khoá học ML cơ bản: supervised learning, regression, classification, sklearn.",
  "price": 1299000,
  "oldPrice": 1599000,
  "type": "paid",
  "status": "approved",
  "level": "intermediate",
  "view": 1,
  "sold": 0,
  "requirements": [
    "Python cơ bản",
    "Kiến thức toán cấp 3"
  ],
  "benefits": [
    "Hiểu supervised vs unsupervised",
    "Thực hành với scikit-learn",
    "Tự xây model ML nhỏ"
  ],
  "techniques": [],
  "documents": [],
  "isDestroyed": false,
  "authorId": "8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8",
  "categoryId": "fc5d66a4-7468-5328-a6a9-16c3a9e49881",
  "createdAt": "2025-09-24T13:55:46.660Z",
  "updatedAt": "2025-10-31T08:49:37.470Z"
}
```

### Sample 3: Transformed Orphan Order (courseId = null)
```json
{
  "id": "9f5caf0c-d3e8-5c12-9680-4c7c252f82e6",
  "code": "DH-2714351",
  "amount": 0,
  "discount": 0,
  "total": 0,
  "status": "completed",
  "userId": "c55de839-f059-519c-8820-b16aa17fb9c3",
  "courseId": null,
  "couponId": null,
  "createdAt": "2025-10-12T15:25:14.357Z",
  "updatedAt": "2025-10-12T15:25:14.357Z"
}
```

### Sample 4: Transformed Quiz Submission with Graded Answers
```json
{
  "id": "e18994c4-b95d-5cfe-b771-0640b7daaa16",
  "score": 4,
  "totalPoints": 4,
  "percentage": 100,
  "completedAt": "2025-10-15T09:29:41.095Z",
  "quizId": "d40087b3-0917-5e3c-bc44-0f36d3d8d127",
  "userId": "c55de839-f059-519c-8820-b16aa17fb9c3",
  "createdAt": "2025-10-15T09:29:41.096Z",
  "updatedAt": "2025-10-15T09:29:41.096Z"
}
```
Sub-answers with `isCorrect` computed:
```json
[
  {
    "id": "b83225c5-d311-56c6-98f0-075b8af9d3ca",
    "submissionId": "e18994c4-b95d-5cfe-b771-0640b7daaa16",
    "questionId": "ae9f84cd-eadb-5719-91d5-57986523aa5a",
    "selectedAnswer": "function myFunc() {}",
    "isCorrect": true
  },
  {
    "id": "a7090329-8861-5998-8846-61c6413b6639",
    "submissionId": "e18994c4-b95d-5cfe-b771-0640b7daaa16",
    "questionId": "efac87d1-9e7d-5dca-9557-e6692b953ed4",
    "selectedAnswer": "color",
    "isCorrect": true
  },
  {
    "id": "aa7e55b1-ad4e-5fee-8ceb-cbfd35812913",
    "submissionId": "e18994c4-b95d-5cfe-b771-0640b7daaa16",
    "questionId": "4c6c56ea-e2c4-5455-b92e-4b28c91ec15f",
    "selectedAnswer": "<ul>",
    "isCorrect": true
  }
]
```

---

## 13. Errors

- **Critical Errors**: **0**

---

## 14. Warnings

1. **Orphan Orders**: Có 3 đơn hàng tham chiếu tới các khóa học đã bị xóa ở MongoDB (`DH-7806607`, `DH-2062171`, `DH-2714351`). Đã được xử lý hợp lệ bằng `courseId = NULL` tương thích với Prisma schema `orders.course_id UUID NULL`.
2. **Special Field `isVerified`**: Trong MongoDB, một số document có `isVerified = ""` (chuỗi rỗng). Đã được chuyển đổi an toàn thành `isVerified = false` (boolean).
3. **Index-based Sub-Entities**: Các thực thể `course_faqs`, `question_options`, `quiz_submission_answers` sử dụng chỉ mục mảng `<parent_id>:<index>` để đảm bảo tính tất định và duy nhất.

---

## 15. Final Verdict

# **READY_WITH_WARNINGS**

### Kết luận:
1. **Critical Errors = 0**: Không có bất kỳ lỗi nào gây sụp đổ cấu trúc quan hệ hoặc vi phạm ràng buộc Foreign Key / Unique Constraint / Enum trong PostgreSQL.
2. **Rủi ro dữ liệu mồ côi đã được kiểm soát 100%**: 3 đơn hàng mồ côi chuyển đổi `courseId = null` thành công và hợp lệ.
3. **Audit Log đã được sinh đầy đủ**: Toàn bộ 120 ánh xạ ID đã được lưu tại `scripts/migration-logs/id_map_audit.json`.
4. **Tính toàn vẹn Database được bảo toàn tuyệt đối**:
   - MongoDB: 120 documents (Không đổi)
   - PostgreSQL: 0 business records (Không đổi)
