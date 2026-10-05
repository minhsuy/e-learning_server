# KIẾN TRÚC MÔ HÌNH DỮ LIỆU ỨNG DỤNG (APPLICATION MODEL DESIGN)
## GIỮ NGUYÊN FOLDER `src/models` + ZOD + PRISMA ORM

---

## 1. TỔNG QUAN & QUYẾT ĐỊNH KIẾN TRÚC (ADR)

* **Dự án**: TMDEMY E-Learning Backend Migration
* **Trạng thái**: ĐÃ PHÊ DUYỆT (Architecture Decision Record)
* **Bối cảnh**: Quá trình migration Database Layer từ MongoDB/Mongoose sang PostgreSQL/Prisma đã hoàn thành 10 phase Data Migration và Phase 1 (Foundation & Prisma Infrastructure).
* **Quyết định**:
  1. **Giữ nguyên thư mục** `src/models` trong cấu trúc source code backend.
  2. **Không xóa thư mục `models`** và **không đổi tên** các file model thành DTO (`*.dto.ts`).
  3. **Tái định nghĩa vai trò của `src/models`**: Chuyển đổi từ Mongoose Schemas/Models thành **Application Models sử dụng Zod**.
  4. **Phân định rõ ràng trách nhiệm**:
     * **Prisma Schema** (`prisma/schema.prisma`): Single source of truth cho **Database Models** và quan hệ dữ liệu vật lý trong PostgreSQL.
     * **Zod Models** (`src/models/*.model.ts`): Single source of truth cho **Application Domain Schemas**, contract kiểm tra cấu trúc dữ liệu nội bộ và chuẩn hóa Response Schemas.
     * **Express Validator** (`src/middlewares/*.ts`): Giữ nguyên nhiệm vụ validation HTTP Request đầu vào ở tầng Transport/Routing hiện tại, tuân thủ nguyên tắc **API Contract Freeze**.

---

## 2. QUY ƯỚC ĐẶT TÊN (NAMING CONVENTION)

Giữ nguyên 100% naming convention của các file model hiện có trong `src/models/`, đảm bảo tính quen thuộc và mạch lạc trong toàn bộ codebase:

```text
src/models/
├── category.model.ts
├── certificate.model.ts
├── chapter.model.ts
├── comment.model.ts
├── conversation.model.ts
├── coupon.model.ts
├── course.model.ts
├── enrollment.model.ts
├── favoriteCourse.model.ts
├── lesson.model.ts
├── message.model.ts
├── notification.model.ts
├── order.model.ts
├── progress.model.ts
├── question.model.ts
├── quiz.model.ts
├── quizSubmission.model.ts
├── rating.model.ts
└── user.model.ts
```

### Quy tắc đặt tên schema & type bên trong mỗi file:
1. **Zod Schemas** (camelCase kèm hậu tố `Schema`):
   * Base Schema: `<entity>Schema` (ví dụ: `userSchema`, `courseSchema`).
   * Output / Public Schema: `<entity>PublicSchema` hoặc `<entity>ResponseSchema`.
   * Input Schema: `<action><Entity>InputSchema` (ví dụ: `createUserInputSchema`, `updateCourseInputSchema`).
   * Internal Schema: `<entity>InternalSchema` (nếu cần quản lý các trường nội bộ có mã hóa/nhạy cảm).
2. **TypeScript Types** (PascalCase infer trực tiếp từ Zod):
   * `<Entity>` (ví dụ: `User`, `Course`).
   * `<Entity>Public` / `<Entity>Response` (ví dụ: `UserPublic`, `CourseResponse`).
   * `<Action><Entity>Input` (ví dụ: `CreateUserInput`, `UpdateCourseInput`).

---

## 3. VAI TRÒ MỚI CỦA `*.model.ts` (APPLICATION MODELS)

Trong kiến trúc mới, các file `src/models/*.model.ts` không còn bất kỳ liên hệ nào với Mongoose (không `new Schema()`, không `mongoose.model()`). Chúng đảm nhận các vai trò:

1. **Object Validation & Schema Modeling**:
   * Định nghĩa cấu trúc chuẩn của thực thể trong phạm vi ứng dụng (Application Level).
   * Hỗ trợ validation mạnh mẽ: định dạng UUID, định dạng chuỗi, enum, email, url, datetime.
2. **Phân định Public và Private Schemas**:
   * Tách bạch dữ liệu được phép trả về cho Client (`publicSchema`) và dữ liệu nhạy cảm chỉ lưu hành nội bộ (`internalSchema`).
   * Ngăn chặn tuyệt đối việc rò rỉ các trường nhạy cảm như `password`, `otpCode`, `refreshToken`, `resetPasswordToken`.
3. **Khai báo TypeScript Types tự động thông qua `z.infer`**:
   * Loại bỏ việc phải khai báo thủ công song song giữa `interface` TypeScript và schema validation, tránh nguy cơ bất đồng bộ type (type drift).
4. **Tái sử dụng & Biến thể Schema linh hoạt**:
   * Tận dụng các phương thức có sẵn của Zod: `.pick()`, `.omit()`, `.extend()`, `.partial()` để tạo các schema chuyên biệt cho từng nghiệp vụ mà không bị lặp code.

---

## 4. TỔ CHỨC ZOD SCHEMAS & INFER TYPES (THIẾT KẾ MẪU)

### 4.1. Ví dụ mẫu chuẩn: `src/models/user.model.ts`

```typescript
import { z } from 'zod'
import { UserRole, UserStatus } from '@prisma/client'

// 1. Base Domain Schema (Phản ánh cấu trúc chuẩn của thực thể User)
export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(100),
  email: z.string().email().max(255),
  status: z.nativeEnum(UserStatus),
  role: z.nativeEnum(UserRole),
  avatar: z.string().default(''),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  socialFacebook: z.string().default(''),
  socialInstagram: z.string().default(''),
  socialGithub: z.string().default(''),
  isVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// 2. Public / Response Schema (Dữ liệu trả về cho client / API response an toàn)
export const userPublicSchema = userSchema.pick({
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialFacebook: true,
  socialInstagram: true,
  socialGithub: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
})

// 3. Compact Public Schema (Dùng khi nhúng vào dữ liệu tác giả / author của Course, Comment...)
export const userCompactSchema = userSchema.pick({
  id: true,
  username: true,
  avatar: true,
  role: true
})

// 4. Internal Schema (Chứa các trường nhạy cảm để Service xác thực)
export const userInternalSchema = userSchema.extend({
  password: z.string(),
  otpCode: z.string().nullable().optional(),
  otpExpires: z.date().nullable().optional(),
  refreshToken: z.string().nullable().optional(),
  resetPasswordToken: z.string().nullable().optional(),
  resetPasswordExpires: z.date().nullable().optional()
})

// 5. Inferred TypeScript Types
export type User = z.infer<typeof userSchema>
export type UserPublic = z.infer<typeof userPublicSchema>
export type UserCompact = z.infer<typeof userCompactSchema>
export type UserInternal = z.infer<typeof userInternalSchema>
```

### 4.2. Ví dụ mẫu chuẩn: `src/models/course.model.ts`

```typescript
import { z } from 'zod'
import { CourseStatus, CourseLevel, CourseType } from '@prisma/client'
import { userCompactSchema } from './user.model'

export const courseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(250),
  slug: z.string().max(300),
  description: z.string().nullable().optional(),
  thumbnail: z.string().default(''),
  price: z.number().nonnegative().default(0),
  status: z.nativeEnum(CourseStatus),
  level: z.nativeEnum(CourseLevel),
  type: z.nativeEnum(CourseType),
  views: z.number().int().nonnegative().default(0),
  authorId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  isDestroyed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Public Course Response kèm thông tin Author và Category
export const courseDetailResponseSchema = courseSchema.extend({
  author: userCompactSchema.optional(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string()
  }).nullable().optional()
})

export type Course = z.infer<typeof courseSchema>
export type CourseDetailResponse = z.infer<typeof courseDetailResponseSchema>
```

---

## 5. TÍCH HỢP GIỮA ZOD VÀ PRISMA SELECT

### 5.1. Phân chia trách nhiệm rõ ràng
* **Prisma**: Chịu trách nhiệm truy vấn database PostgreSQL hiệu quả, sinh ra câu lệnh SQL tối ưu.
* **Prisma Select**: Đảm bảo database query chỉ đọc đúng các cột cần thiết từ PostgreSQL, tiết kiệm băng thông và bộ nhớ.
* **Zod Model**: Đảm bảo type-safety và validate cấu trúc dữ liệu trước khi xuất ra khỏi tầng Service / Controller.

### 5.2. Đồng bộ hóa giữa Prisma Select và Zod Schema
Trong tầng Repository (`src/repositories/`), định nghĩa các hằng số `Prisma.UserSelect` chuẩn khớp với các `Zod` schemas:

```typescript
import { Prisma } from '@prisma/client'

/**
 * Projection select khớp với userPublicSchema
 * Loại trừ hoàn toàn password, token, otp ở mức Database Engine
 */
export const USER_PUBLIC_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialFacebook: true,
  socialInstagram: true,
  socialGithub: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
}

/**
 * Projection select gọn cho author / avatar
 */
export const USER_COMPACT_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  avatar: true,
  role: true
}
```

Khi repository gọi Prisma:
```typescript
export const findUserPublicById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<UserPublic | null> => {
  const client = tx || prisma
  const record = await client.user.findUnique({
    where: { id },
    select: USER_PUBLIC_SELECT
  })
  return record as UserPublic | null
}
```

---

## 6. MÔ HÌNH KIẾN TRÚC & DÒNG DỮ LIỆU (DATA FLOW)

Kiến trúc thống nhất tuân thủ luồng:

```text
HTTP Request
     │
     ▼
[Express Router]
     │
     ▼
[Middlewares / Express Validator] ── (Kiểm tra request body/query, gán req.user)
     │
     ▼
[Controller] (Function-based)
     │
     ▼
[Service] (Function-based & Business Logic) ◄──► [Zod Application Models] (Schema check, sanitize)
     │
     ▼
[Functional Repository] ◄──────────────────────► [Prisma Client Singleton]
     │                                                    │
     ▼                                                    ▼
[PostgreSQL Database] ◄───────────────────────── [Generated SQL Query]
```

### Quy tắc giữa các tầng:
1. **Controller**:
   * Chỉ nhận request, điều phối gọi Service, trả response JSON với HTTP status code phù hợp.
   * **Tuyệt đối không** gọi trực tiếp Prisma Client hoặc Repository.
2. **Service**:
   * Chứa toàn bộ nghiệp vụ, mã hóa mật khẩu, kiểm tra điều kiện logic, tính toán giá, gửi email...
   * Nhận dữ liệu từ Repository, sử dụng Zod schema (`userPublicSchema.parse(rawUser)` hoặc mapping) để bảo đảm dữ liệu đầu ra đạt chuẩn hợp đồng.
3. **Repository (Functional Style)**:
   * Chứa các pure functions / async functions nhận và trả về kiểu dữ liệu thuần túy của Prisma.
   * Có thể nhận tham số `select` để tối ưu hóa truy vấn.
   * Không chứa logic xử lý HTTP (không dùng `req`, `res`).

---

## 7. QUAN HỆ GIỮA ZOD VÀ EXPRESS VALIDATOR

### 7.1. Trạng thái hiện tại: Giữ nguyên Express Validator
* Backend hiện đang có hệ thống Express Validator trong `src/middlewares/*.validator.ts`.
* **Quy tắc API Contract Freeze**: Không tự ý đập đi viết lại toàn bộ Express Validator sang Zod trong lần tái cấu trúc này.
* Express Validator tiếp tục chịu trách nhiệm validate request parameters/body đầu vào (URL params, query strings, headers, body formats).

### 7.2. Phân chia phạm vi:
| Tiêu chí | Express Validator | Zod Application Models |
| :--- | :--- | :--- |
| **Vị trí** | Middleware (`src/middlewares/`) | Domain / Entity (`src/models/`) |
| **Nhiệm vụ** | Validate HTTP Request đầu vào | Định nghĩa Schema ứng dụng, Types, Serialization |
| **Tác vụ** | Bắt lỗi 400 Bad Request ngay tại Router | Bảo vệ Domain Invariants, định dạng Output/Response |
| **Tương lai** | Có thể xem xét thay thế sau khi migration hoàn tất và được phê duyệt | Là nền tảng vĩnh viễn cho Application Layer |

---

## 8. BẢO VỆ API RESPONSE (RESPONSE SANITIZATION)

1. **Bảo vệ ở tầng Database (Tuyến phòng thủ 1 - Prisma Select)**:
   * Repository mặc định sử dụng `select` chứa danh sách trường an toàn khi truy vấn người dùng hoặc dữ liệu nhạy cảm.
   * Tránh `SELECT *` đưa các trường nguy hiểm vào RAM của server.
2. **Bảo vệ ở tầng Service (Tuyến phòng thủ 2 - Zod Schema Parsing)**:
   * Trước khi Service trả dữ liệu về Controller, dữ liệu được validate hoặc sanitize qua Zod `publicSchema`.
   * Ví dụ:
     ```typescript
     // Trong Service:
     export const getUserProfileService = async (userId: string): Promise<UserPublic> => {
       const user = await findUserById(userId, { select: USER_PUBLIC_SELECT })
       if (!user) throw new NotFoundError('User not found')
       return userPublicSchema.parse(user)
     }
     ```
3. **Bảo toàn API Contract hiện tại**:
   * Tất cả response trả về client phải khớp 100% về tên trường và định dạng với Postman Collection hiện có.
   * Đảm bảo các trường ảo (virtuals cũ của Mongoose) nếu API yêu cầu thì được tính toán tường minh tại Service và đưa vào Zod Response Schema.

---

## 9. CHIẾN LƯỢC MIGRATION THEO TỪNG PHASE

Quá trình chuyển đổi từ Mongoose Models sang Zod Models được thực hiện **cuốn chiếu theo từng Phase** tương ứng với Migration Roadmap:

```text
Phase 1: Foundation & Prisma Infrastructure (Đã hoàn thành)
Phase 2: User, Category & Authentication Services
Phase 3: Course, Chapter & Lesson Services
Phase 4: Quiz & Question Services
Phase 5: Quiz Submission & Evaluation Services
Phase 6: Order, Coupon & Enrollment Services
Phase 7: Progress, Certificate, Favorite & Rating Services
Phase 8: Comment & Comment Reaction Services
Phase 9: Chat (Conversation, Message) Services
Phase 10: Notification Services
Phase 11: Cleanup & Mongoose Decommission
```

### Nguyên tắc di chuyển:
1. **Audit trước khi chuyển đổi**:
   * Rà soát Mongoose Model cũ: xác định schema fields, virtual properties, instance methods, static methods, pre/post hooks.
2. **Tách biệt và phân bổ logic**:
   * Schema & types: Chuyển sang Zod Model trong `src/models/<entity>.model.ts`.
   * Static queries: Chuyển sang Functional Repository trong `src/repositories/<entity>.repository.ts`.
   * Methods / Virtuals: Chuyển thành helper functions trong Service hoặc Mapper.
   * Hooks (ví dụ slugify, hash password): Đưa vào Service xử lý tường minh trước khi gọi Repository.
3. **Bảo vệ Scope và Phụ thuộc chéo**:
   * **Tuyệt đối không xóa Mongoose Model** khi các module của Phase sau vẫn còn import và sử dụng.
   * Chỉ chuyển đổi file model sang Zod thuần túy khi toàn bộ các Service phụ thuộc vào nó đã được chuyển sang Prisma.
   * Giữ Mongoose kết nối song song (ở chế độ read-only hoặc fallback) cho đến hết Phase 10.
   * Giai đoạn xóa bỏ hoàn toàn Mongoose (`Phase 11`) chỉ được thực hiện khi toàn bộ hệ thống đã chạy 100% trên PostgreSQL/Prisma và vượt qua toàn bộ API regression tests.

---

## 10. TỔNG KẾT & CAM KẾT TUÂN THỦ

* **File tài liệu kiến trúc**: `docs/architecture/application-model-design.md`
* **Cam kết**:
  * Không xóa folder `src/models/`
  * Không đổi tên sang `*.dto.ts`
  * Giữ nguyên API Contract và HTTP Request Validation hiện hành
  * Không sửa code nguồn, không sửa Prisma schema, không cài đặt package trong bước phê duyệt kiến trúc này.
