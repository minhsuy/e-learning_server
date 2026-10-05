# QUYẾT ĐỊNH THIẾT KẾ ÁNH XẠ ID: MONGODB OBJECTID → POSTGRESQL UUID (UUID MAPPING DECISION)

> **Giai đoạn**: DESIGN & ARCHITECTURAL REVIEW — ID MAPPING STRATEGY  
> **Phiên bản tài liệu**: 1.0.0  
> **Ngày lập**: 2026-09-30  
> **Trạng thái thực thi**: **CHỈ THIẾT KẾ & PHÂN TÍCH** (Không migrate dữ liệu, không sửa code, không thay đổi database).

---

## 1. CURRENT STRATEGY (CHIẾN LƯỢC BAN ĐẦU)

Trong tài liệu `DATA_MIGRATION_PLAN.md` (Section 4), phương án ban đầu đề xuất:
- Sử dụng thuật toán **UUID v5 (SHA-1 hash name-based)** kết hợp một Project Namespace cố định.
- Công thức: `UUIDv5(mongoObjectId, NAMESPACE)`.
- Đặc tính: Tất định (deterministic), phi trạng thái (stateless), chạy lại không lệch ID (idempotent).

---

## 2. IDENTIFIED RISKS (RỦI RO TIỀM ẨN ĐÃ PHÁT HIỆN)

### 2.1 Rủi ro xung đột ID giữa các Collection (Cross-Collection Collision)
Trong phương án ban đầu, đầu vào của hàm băm chỉ là chuỗi 24 ký tự `mongoObjectId`:
```text
toPostgresUuid('68dcf8f9e3617ec76053b4d7') -> UUID-X
```

**Vấn đề lý thuyết & thực tế**:
- Mặc dù MongoDB ObjectId được sinh bằng tổ hợp `(timestamp + machineId + pid + counter)` nên ít khi trùng trong cùng một cụm runtime, nhưng giữa **hai collection khác nhau** (ví dụ do import, backup restore, seed script, hoặc trường hợp ngẫu nhiên), hoàn toàn có thể xảy ra tình huống:
  ```text
  users._id   = 68dcf8f9e3617ec76053b4d7
  courses._id = 68dcf8f9e3617ec76053b4d7
  ```
- Nếu chỉ băm `mongoObjectId`, cả User và Course sẽ cùng nhận được `UUID-X`.
- Hậu quả: Vi phạm nguyên tắc định danh miền (Domain-Driven Identity) và có nguy cơ lỗi xung đột khóa ngoại chéo hoặc nhầm lẫn logic khi đối soát.

### 2.2 Rủi ro với các thực thể không có ObjectId riêng (Embedded Arrays & Sub-entities)
Trong MongoDB:
- `question.options`: Là mảng chuỗi `string[]` (không có `_id`).
- `comment.likes` / `comment.dislikes`: Là mảng chứa `userId`.
- `course.info.qa`: Một số document FAQ có thể thiếu `_id`.
Phương án ban đầu chưa định nghĩa cách tạo UUID tất định cho các phần tử mảng này.

---

## 3. FINAL UUID STRATEGY: ENTITY-SCOPED DETERMINISTIC UUID V5

### 3.1 Quyết định kiến trúc
Nâng cấp từ mô hình băm ObjectId thuần túy sang **Mô hình Entity-Scoped UUID v5**:

```text
PostgreSQL UUID = UUIDv5( NAMESPACE, "<entity_scope>:<canonical_id>" )
```

### 3.2 Minh chứng tính độc lập (Collision-Safe):
Cùng một `ObjectId` nhưng thuộc 2 entity khác nhau sẽ luôn sinh ra 2 UUID hoàn toàn khác nhau:
```text
users:68dcf8f9e3617ec76053b4d7    ===> 9c5b2a1e-84b2-5f72-9112-a123456789ab
courses:68dcf8f9e3617ec76053b4d7  ===> 3f8e1d2c-7b44-5a91-8843-c987654321fe
(Tuyệt đối không bao giờ trùng lặp!)
```

### 3.3 Đáp ứng trọn vẹn 8 yêu cầu bắt buộc:
1. **Deterministic**: Cùng entity và cùng source identity luôn tạo ra đúng một UUID.
2. **Idempotent**: Chạy lại 100 lần vẫn tạo đúng UUID đó, tương thích hoàn hảo với `skipDuplicates / upsert`.
3. **Stable**: Foreign key trỏ tới cùng source entity luôn khớp 100%.
4. **Collision-safe**: Các collection khác nhau có không gian định danh (Namespace Scope) độc lập.
5. **Thứ tự độc lập**: Tính toán độc lập, không phụ thuộc collection nào migrate trước hay sau.
6. **Không cần query DB**: O(1) in-memory hashing, không tốn I/O roundtrip để lấy ID.
7. **Dễ debug & kiểm toán**: Có thể tái lập chính xác bất kỳ UUID nào từ `(entity, sourceId)`.
8. **Chuyển đổi chuẩn hóa**: Tuân thủ chuẩn RFC 4122 UUID v5.

---

## 4. NAMESPACE STRATEGY (CHIẾN LƯỢC QUẢN LÝ NAMESPACE)

### 4.1 So sánh 3 phương án quản lý Namespace

| Tiêu chí | A. Hard-code trong Utility | B. Hoàn toàn dựa vào `.env` | C. Config Constant kết hợp Optional Env Override (ĐỀ XUẤT) |
|:---|:---|:---|:---|
| **Tính ổn định qua thời gian** | Rất cao (lưu trong Git) | Kém (dễ mất file `.env` khi đổi máy) | **Tuyệt đối** (luôn có fallback cố định trong Git) |
| **Rủi ro cấu hình sai** | Không có | Cao (nếu ai đó đổi chuỗi trong `.env`, toàn bộ UUID bị thay đổi) | **Rất thấp** (mặc định chuẩn, chỉ override khi cần) |
| **Tính di động (Portability)** | Chạy ngay không cần setup | Phải cấu hình biến môi trường trước | **Chạy ngay lập tức**, không phụ thuộc môi trường |

### 4.2 Namespace cố định được chọn cho dự án
Chọn một UUID v4 duy nhất, cố định vĩnh viễn cho dự án E-Learning:
```typescript
export const PROJECT_MIGRATION_NAMESPACE = '7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c';
```
*(Được lưu trữ tập trung tại file config của module migration, kèm cơ chế `process.env.MIGRATION_UUID_NAMESPACE || PROJECT_MIGRATION_NAMESPACE`).*

---

## 5. CANONICAL INPUT FORMAT (ĐỊNH DẠNG ĐẦU VÀO CHUẨN HÓA)

Để đảm bảo không bị sai lệch do ký tự hoa/thường, khoảng trắng hay định dạng chuỗi:

### 5.1 Cấu trúc chuỗi chuẩn (Canonical String)
```text
<entity_scope>:<source_identifier>
```

### 5.2 Quy tắc định dạng (Formatting Rules)
1. **`entity_scope`**: Phải viết **chữ thường**, dùng đúng **tên bảng PostgreSQL** (plural snake_case):
   - `users`, `categories`, `courses`, `course_faqs`, `chapters`, `lessons`, `quizzes`, `questions`, `question_options`, `quiz_submissions`, `quiz_submission_answers`, `orders`, `coupons`, `enrollments`, `progress`, `certificates`, `ratings`, `favorite_courses`, `comments`, `conversations`, `messages`, `notifications`.
2. **Ký tự phân cách (Delimiter)**: Sử dụng dấu hai chấm `:`.
3. **`source_identifier`**: 
   - Với thực thể gốc có Mongo ObjectId: `doc._id.toString().trim().toLowerCase()`.
   - Với thực thể phụ thuộc mảng (sub-entities): `<parent_mongo_id>:<index_or_discriminator>`.

### 5.3 Bảng quy tắc định danh từng Entity

| Thực thể (PostgreSQL Table) | Định dạng Canonical Input | Ví dụ đầu vào để băm UUID |
|:---|:---|:---|
| `users` | `users:<user_id>` | `users:68dcf8f9e3617ec76053b4d7` |
| `categories` | `categories:<category_id>` | `categories:68d6b6225de7c31f87236bb0` |
| `courses` | `courses:<course_id>` | `courses:68d3f862e710d52ff77262a7` |
| `course_faqs` | `course_faqs:<faq_id \|\| course_id:index>` | `course_faqs:68d3f862e710d52ff77262a8` |
| `chapters` | `chapters:<chapter_id>` | `chapters:68d74e52c6ea726291d68d68` |
| `lessons` | `lessons:<lesson_id>` | `lessons:68db38d7dd667efb615e2549` |
| `quizzes` | `quizzes:<quiz_id>` | `quizzes:68ef66bed0786b1debaceb61` |
| `questions` | `questions:<question_id>` | `questions:68efc26e56c8e188e87cd459` |
| `question_options` | `question_options:<question_id>:<index>` | `question_options:68efc26e56c8e188e87cd459:0` |
| `quiz_submissions` | `quiz_submissions:<submission_id>` | `quiz_submissions:68ef69853c8bd4c6638d55fe` |
| `quiz_submission_answers` | `quiz_submission_answers:<answer_id \|\| sub_id:q_id>` | `quiz_submission_answers:68ef69853c8bd4c6638d55ff` |
| `orders` | `orders:<order_id>` | `orders:68e5257e43b2786ec96458e8` |
| `coupons` | `coupons:<coupon_id>` | `coupons:68db532c52576f19efb3925d` |
| `enrollments` | `enrollments:<enrollment_id>` | `enrollments:68e53837d761d319a244bab6` |
| `progress` | `progress:<progress_id>` | `progress:68e49e7cd761d319a244ba65` |
| `certificates` | `certificates:<certificate_id>` | `certificates:68efcdd70f6030b1a6d87068` |
| `ratings` | `ratings:<rating_id>` | `ratings:68ebd62c7dc661dee7403afb` |
| `favorite_courses` | `favorite_courses:<favorite_id>` | `favorite_courses:68e876c519f9f799c75dd8c7` |
| `comments` | `comments:<comment_id>` | `comments:68ecccf11ad0a8e2a36f9913` |
| `conversations` | `conversations:<conversation_id>` | `conversations:68f1dcdb0052411ea7c73a5b` |
| `messages` | `messages:<message_id>` | `messages:69060bb098424643f32add67` |
| `notifications` | `notifications:<notification_id>` | `notifications:68ebd62d7dc661dee7403afe` |

*(Ghi chú: Các bảng trung gian N:N như `coupon_courses`, `conversation_participants`, `message_reads` sử dụng composite primary key trực tiếp từ 2 foreign key UUID, không cần sinh UUID riêng).*

---

## 6. MAPPING UTILITY DESIGN (THIẾT KẾ MODULE TIỆN ÍCH)

*(Chưa viết file code thực tế, dưới đây là đặc tả chữ ký API & Logic dự kiến)*:

### 6.1 TypeScript Signature
```typescript
export type MigrationEntity =
  | 'users'
  | 'categories'
  | 'courses'
  | 'course_faqs'
  | 'chapters'
  | 'lessons'
  | 'quizzes'
  | 'questions'
  | 'question_options'
  | 'quiz_submissions'
  | 'quiz_submission_answers'
  | 'orders'
  | 'coupons'
  | 'enrollments'
  | 'progress'
  | 'certificates'
  | 'ratings'
  | 'favorite_courses'
  | 'comments'
  | 'conversations'
  | 'messages'
  | 'notifications';

/**
 * Sinh UUID v5 tất định cho một thực thể cụ thể từ MongoDB ID.
 * @param entity Tên bảng PostgreSQL (phải thuộc whitelist MigrationEntity)
 * @param sourceId MongoDB ObjectId hoặc ID hợp lệ
 * @returns PostgreSQL UUID dạng canonical xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function toPostgresUuid(entity: MigrationEntity, sourceId: string | Types.ObjectId): string;

/**
 * Sinh UUID cho sub-entity có chỉ mục
 */
export function toSubEntityUuid(entity: MigrationEntity, parentId: string | Types.ObjectId, suffix: string | number): string;
```

### 6.2 Validation & Error Handling
1. **Kiểm tra Entity Whitelist**: Nếu truyền chuỗi entity không hợp lệ $\rightarrow$ Ném lỗi `InvalidEntityError`.
2. **Kiểm tra Source ID**: Nếu `sourceId` bị `null`, `undefined` hoặc chuỗi rỗng $\rightarrow$ Ném lỗi `MissingSourceIdError`.
3. **Chuẩn hóa chuỗi**: Tự động gọi `.trim().toLowerCase()` trước khi đưa vào hàm sinh UUID.

---

## 7. FOREIGN KEY CONSISTENCY (TÍNH NHẤT QUÁN CỦA KHÓA NGOẠI)

Khi bảng con tham chiếu bảng cha, script migration sử dụng đúng `entity` của bảng cha:

| Mối quan hệ trong MongoDB | Cách gán Khóa ngoại trong PostgreSQL |
|:---|:---|
| `Course.author` $\rightarrow$ `User._id` | `courses.author_id = toPostgresUuid('users', course.author)` |
| `Course.category` $\rightarrow$ `Category._id` | `courses.category_id = toPostgresUuid('categories', course.category)` |
| `Chapter.course` $\rightarrow$ `Course._id` | `chapters.course_id = toPostgresUuid('courses', chapter.course)` |
| `Lesson.chapter` $\rightarrow$ `Chapter._id` | `lessons.chapter_id = toPostgresUuid('chapters', lesson.chapter)` |
| `Lesson.course` $\rightarrow$ `Course._id` | `lessons.course_id = toPostgresUuid('courses', lesson.course)` |
| `Quiz.lesson` $\rightarrow$ `Lesson._id` | `quizzes.lesson_id = toPostgresUuid('lessons', quiz.lesson)` |
| `Question.quiz` $\rightarrow$ `Quiz._id` | `questions.quiz_id = toPostgresUuid('quizzes', question.quiz)` |
| `QuizSubmission.quiz` $\rightarrow$ `Quiz._id` | `quiz_submissions.quiz_id = toPostgresUuid('quizzes', submission.quiz)` |
| `QuizSubmission.user` $\rightarrow$ `User._id` | `quiz_submissions.user_id = toPostgresUuid('users', submission.user)` |
| `QuizSubmissionAnswer.question` $\rightarrow$ `Question._id` | `quiz_submission_answers.question_id = toPostgresUuid('questions', ans.question)` |
| `Order.user` $\rightarrow$ `User._id` | `orders.user_id = toPostgresUuid('users', order.user)` |
| `Order.course` $\rightarrow$ `Course._id` | `orders.course_id = courseExists ? toPostgresUuid('courses', order.course) : null` |
| `Enrollment.user` / `course` | `toPostgresUuid('users', e.user)` / `toPostgresUuid('courses', e.course)` |
| `Progress.user` / `lesson` | `toPostgresUuid('users', p.user)` / `toPostgresUuid('lessons', p.lesson)` |
| `Comment.parent` $\rightarrow$ `Comment._id` | `comments.parent_id = toPostgresUuid('comments', comment.parentId)` |
| `Message.conversation` $\rightarrow$ `Conversation._id` | `messages.conversation_id = toPostgresUuid('conversations', msg.conversation)` |
| `Notification.receiver` $\rightarrow$ `User._id` | `notifications.receiver_id = toPostgresUuid('users', notif.receiver)` |

**Đảm bảo toán học**: `courses.author_id` tính từ `toPostgresUuid('users', authorId)` sẽ **LUÔN TRÙNG KHỚP 100%** với `users.id` tính từ cùng `authorId` đó khi bảng `users` được migrate.

---

## 8. POLYMORPHIC ID ANALYSIS (`Notification.relatedId`)

### 8.1 Hiện trạng mã nguồn
Trong [src/services/notification.service.ts](file:///d:/e-learning_server/src/services/notification.service.ts):
- `relatedId` được truyền trực tiếp khi gửi notification:
  - Khi mua khóa học: `relatedId: order._id.toString()`, `type: 'order'`
  - Khi đánh giá: `relatedId: rating._id.toString()`, `type: 'rating'`
  - Khi hoàn thành quiz: `relatedId: submission._id.toString()`, `type: 'quiz'`
  - Khi bình luận: `relatedId: comment._id.toString()`, `type: 'comment'`
- Trong MongoDB, `relatedId` là `string`.
- Trong PostgreSQL, `prisma/schema.prisma` định nghĩa:
  `relatedId String? @map("related_id") @db.VarChar(255)` (Polymorphic, không FK).

### 8.2 Quy tắc chuyển đổi ID trong Migration
Vì `Notification` có trường `type` (`ENotificationType`), ta dễ dàng xác định được `entity_scope` của `relatedId`:

```typescript
export function resolveNotificationRelatedId(type: string, relatedId?: string | null): string | null {
  if (!relatedId) return null;
  
  // Kiểm tra nếu là ObjectId 24 ký tự hex
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(relatedId);
  if (!isObjectId) return relatedId; // Chuỗi tự do giữ nguyên

  switch (type) {
    case 'order':
      return toPostgresUuid('orders', relatedId);
    case 'rating':
      return toPostgresUuid('ratings', relatedId);
    case 'quiz':
      return toPostgresUuid('quiz_submissions', relatedId);
    case 'course':
      return toPostgresUuid('courses', relatedId);
    case 'lesson':
      return toPostgresUuid('lessons', relatedId);
    case 'comment':
    case 'comment_reply':
      return toPostgresUuid('comments', relatedId);
    case 'message':
      return toPostgresUuid('messages', relatedId);
    default:
      return relatedId;
  }
}
```
**Lợi ích**: Khi client frontend truy vấn notification, ID chuyển hướng của đơn hàng hay khóa học sẽ khớp chính xác với UUID mới trong PostgreSQL, không bị gãy link điều hướng.

---

## 9. AUDIT LOG DESIGN (THIẾT KẾ FILE AUDIT LOG KIỂM TOÁN)

### 9.1 Đường dẫn và mục đích
- **Đường dẫn**: `scripts/migration-logs/id_map_audit.json`
- **Mục đích**: Là **tài liệu kiểm toán (Debugging Artifact)**, không phải là source of truth (Source of truth là thuật toán băm tất định).
- Không chứa mật khẩu, connection string hay thông tin nhạy cảm.

### 9.2 Định dạng JSON cấu trúc
```json
{
  "metadata": {
    "version": "1.0.0",
    "migrationTimestamp": "2026-09-30T13:45:00.000Z",
    "namespace": "7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c",
    "totalRecordsMapped": 120,
    "entityCounts": {
      "users": 7,
      "categories": 3,
      "courses": 8,
      "chapters": 12,
      "lessons": 7,
      "quizzes": 3,
      "questions": 5,
      "orders": 8,
      "notifications": 28
    }
  },
  "mappings": [
    {
      "sourceCollection": "users",
      "sourceId": "68dcf8f9e3617ec76053b4d7",
      "targetTable": "users",
      "targetId": "b1a2c3d4-e5f6-5a7b-8c9d-0e1f2a3b4c5d",
      "canonicalKey": "users:68dcf8f9e3617ec76053b4d7"
    }
  ]
}
```

---

## 10. IDEMPOTENCY & RETRY STRATEGY (KHẢ NĂNG CHẠY LẠI KHÔNG TRÙNG LẶP)

### 10.1 Kịch bản: Migration gặp lỗi giữa chừng
Ví dụ:
- Bước 1 (Users), Bước 2 (Categories), Bước 3 (Courses): **Thành công**.
- Bước 4 (Chapters): **Thất bại** (do rớt mạng hoặc crash).

### 10.2 Khi chạy lại (Retry):
1. **Tính bất biến của ID**:
   - Khi chạy lại Bước 1, `users` lại tính ra chính xác các UUID cũ.
   - Khi chạy Bước 3, `courses.author_id` vẫn tính ra chính xác UUID của User đó.
2. **Cơ chế chống Duplicate tại Database**:
   - Sử dụng `prisma.<entity>.createMany({ data: [...], skipDuplicates: true })`.
   - Các bản ghi đã nạp ở Bước 1, 2, 3 có cùng `id` (Primary Key) sẽ được PostgreSQL tự động bỏ qua mà không báo lỗi, tiến trình chạy tiếp ngay vào Bước 4.
3. **Cấp độ Transaction**:
   - **Transaction theo từng Phase/Collection** (`prisma.$transaction` cho mỗi phase).
   - Không transaction toàn cục 26 bảng (để tránh một lỗi nhỏ ở notification cuối cùng rollback sạch toàn bộ dữ liệu 25 bảng đã nạp thành công trước đó).

---

## 11. TEST MATRIX (DANH MỤC KIỂM THỬ TÍNH ĐÚNG ĐẮN CỦA ID MAPPING)

Trước khi chạy script migration chính thức, module ID Mapper phải vượt qua 10 test case:

| # | Test Case | Đầu vào thử nghiệm | Kết quả mong đợi |
|:---:|:---|:---|:---|
| 1 | **Deterministic** | `toPostgresUuid('users', '68dcf8f9e3617ec76053b4d7')` chạy 2 lần | Trả về 2 UUID giống hệt nhau |
| 2 | **Entity Isolation** | `toPostgresUuid('users', '68abc...')` vs `toPostgresUuid('courses', '68abc...')` | 2 UUID **phải khác nhau** |
| 3 | **Different ObjectId** | `toPostgresUuid('users', 'ID_A')` vs `toPostgresUuid('users', 'ID_B')` | 2 UUID **phải khác nhau** |
| 4 | **Case Normalization** | `toPostgresUuid('users', '68DCF8...')` vs `toPostgresUuid('users', '68dcf8...')` | Trả về UUID **giống hệt nhau** |
| 5 | **Entity Whitelist** | `toPostgresUuid('unknown_table', '68abc...')` | Ném lỗi `InvalidEntityError` |
| 6 | **Null/Empty Source ID** | `toPostgresUuid('users', '')` hoặc `null` | Ném lỗi `MissingSourceIdError` |
| 7 | **Sub-entity Determinism** | `toSubEntityUuid('question_options', 'Q_ID', 0)` | Luôn ra cùng UUID cho index 0 |
| 8 | **Sub-entity Distinct** | Index 0 vs Index 1 của cùng một câu hỏi | 2 UUID **phải khác nhau** |
| 9 | **Polymorphic Order** | `resolveNotificationRelatedId('order', '68e525...')` | Trả về đúng UUID của order |
| 10 | **Polymorphic Non-ObjectId** | `resolveNotificationRelatedId('system', 'SYSTEM_ANNOUNCEMENT')` | Giữ nguyên chuỗi gốc |

---

## 12. FINAL RECOMMENDATION (KẾT LUẬN & ĐỀ XUẤT)

1. **Khẳng định chiến lược**: Phương án **Entity-Scoped Deterministic UUID v5** là giải pháp tối ưu nhất cho bài toán này, loại bỏ triệt để rủi ro va chạm ObjectId chéo giữa các collection, đồng thời đảm bảo tính độc lập và khả năng phục hồi khi chạy lại script.
2. **Không gian lưu trữ**: Không cần tạo thêm bảng phụ `mongo_id_map` trong database PostgreSQL, giúp giữ database production hoàn toàn sạch sẽ theo đúng chuẩn Prisma schema đã thiết kế.
3. **Tiến trình tiếp theo**: Khi được người dùng phê duyệt tài liệu này, ta sẽ viết module tiện ích `id-mapper.ts` độc lập kèm bộ unit test theo đúng Test Matrix ở Mục 11 trước khi bắt đầu viết script nạp dữ liệu.

---

```text
UUID MAPPING DESIGN: COMPLETE
SCHEMA MODIFIED: NO
SOURCE CODE MODIFIED: NO
DATA MIGRATED: NO
MONGODB MODIFIED: NO
POSTGRESQL BUSINESS DATA MODIFIED: NO
```
