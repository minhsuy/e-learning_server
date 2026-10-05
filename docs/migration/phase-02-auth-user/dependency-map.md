# BẢN ĐỒ PHỤ THUỘC (DEPENDENCY MAP)
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES

---

## 1. TỔNG QUAN

Tài liệu này xác định toàn diện mạng lưới phụ thuộc của các Mongoose Model trong phạm vi Phase 2 (`UserModel`, `CategoryModel`), phân tách rõ:
1. **Các module thuộc phạm vi Phase 2**: Có thể và bắt buộc chuyển đổi sang Functional Repository / Prisma Client ngay trong Phase 2.
2. **Các module thuộc các Phase sau (Phase 3–10)**: Chưa di trú, vẫn còn đang gọi Mongoose query trực tiếp và bắt buộc phải được bảo vệ không bị gãy (broken dependencies).
3. **Chiến lược chuyển tiếp an toàn (Safe Transition Strategy)** theo đúng ADR [application-model-design.md](file:///d:/e-learning_server/docs/architecture/application-model-design.md).

---

## 2. BẢN ĐỒ PHỤ THUỘC CỦA `UserModel`

### 2.1. Danh sách file đang import `UserModel` / `~/models/user.model`

| STT | File đường dẫn | Phase phụ trách | Hành vi truy vấn Mongoose hiện tại | Hướng xử lý tại Phase 2 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `src/services/user.service.ts` | **Phase 2** | `new UserModel()`, `.findOne()`, `.findById()`, `.findByIdAndDelete()`, `.save()` | **Chuyển đổi 100% sang `user.repository.ts` & Prisma** |
| 2 | `src/services/admin.service.ts` | **Phase 2** (User part) | `UserModel.find()`, `.countDocuments()`, `.findById()`, `.findByIdAndUpdate()`, `.create()` | **Chuyển đổi các hàm User sang `user.repository.ts` & Prisma** |
| 3 | `src/middlewares/user.middleware.ts` | **Phase 2** | `UserModel.findOne({ email })`, `Types.ObjectId.isValid` | **Chuyển đổi sang `user.repository.ts` & UUID validator** |
| 4 | `src/middlewares/admin.middleware.ts` | **Phase 2** | `param('id').isMongoId()` | **Chuyển đổi sang UUID validator** |
| 5 | `src/cronJobs/deleteUnverifiedUsers.ts`| **Phase 2** | `UserModel.deleteMany({ isVerified: { $ne: '' } })` | **Chuyển đổi sang `user.repository.ts` (`deleteMany`)** |
| 6 | `src/services/course.service.ts` | **Phase 3** | `UserModel.find({ role: 'admin' })`, `UserModel.findById(author)` | **GIỮ NGUYÊN MONGOOSE IMPORT** (chưa di trú) |
| 7 | `src/services/quiz.service.ts` | **Phase 4** | `import { User } from '~/models/user.model'` | **GIỮ NGUYÊN TƯƠNG THÍCH TYPE** (chưa di trú) |
| 8 | `src/services/quizSubmission.service.ts`| **Phase 5** | `UserModel.findById(userId).select('username')` | **GIỮ NGUYÊN MONGOOSE IMPORT** (chưa di trú) |
| 9 | `src/services/order.service.ts` | **Phase 6** | `UserModel.findByIdAndUpdate(userId, { $addToSet: { courses } })` | **GIỮ NGUYÊN MONGOOSE IMPORT** (chưa di trú) |
| 10 | `src/services/enrollment.service.ts`| **Phase 6** | `UserModel.findByIdAndUpdate(targetUserId, { $pull: { courses } })` | **GIỮ NGUYÊN MONGOOSE IMPORT** (chưa di trú) |
| 11 | `src/services/rating.service.ts` | **Phase 7** | `UserModel.findById(userId).select('courses username')` | **GIỮ NGUYÊN MONGOOSE IMPORT** (chưa di trú) |
| 12 | `src/services/comment.service.ts` | **Phase 8** | `UserModel.findById(userId).select('courses')`, `.select('username')` | **GIỮ NGUYÊN MONGOOSE IMPORT** (chưa di trú) |

### 2.2. Đánh giá rủi ro phụ thuộc chéo của `UserModel`
* Có **7 services** thuộc các Phase 3, 4, 5, 6, 7, 8 đang phụ thuộc trực tiếp vào `UserModel` của Mongoose.
* Nếu tại Phase 2 xóa bỏ Mongoose Model trong `src/models/user.model.ts` hoặc chỉ xuất Zod schema thuần túy, toàn bộ 7 service này sẽ **lập tức báo lỗi biên dịch TypeScript** và làm hỏng toàn bộ hệ thống đang chạy.
* **Kết luận**: `src/models/user.model.ts` bắt buộc phải áp dụng **Hybrid Transitional Model Pattern** (Mô hình lai chuyển tiếp).

---

## 3. BẢN ĐỒ PHỤ THUỘC CỦA `CategoryModel`

### 3.1. Danh sách file đang import `CategoryModel` / `~/models/category.model`

| STT | File đường dẫn | Phase phụ trách | Hành vi truy vấn Mongoose hiện tại | Hướng xử lý tại Phase 2 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `src/services/category.service.ts` | **Phase 2** | `CategoryModel.create()`, `.findById()`, `.findOne()`, `.exists()`, `.find()` | **Chuyển đổi 100% sang `category.repository.ts` & Prisma** |
| 2 | `src/middlewares/category.middleware.ts` | **Phase 2** | `CategoryModel.findOne({ name })`, `Types.ObjectId.isValid` | **Chuyển đổi sang `category.repository.ts` & UUID validator** |

### 3.2. Đánh giá phụ thuộc chéo của `CategoryModel`
* `CategoryModel` **KHÔNG** bị import trực tiếp bởi bất kỳ service nào thuộc Phase 3–10!
* Lưu ý: Trong `CourseModel` (Mongoose cũ), trường `category` được khai báo dạng ObjectId tham chiếu: `{ type: Schema.Types.ObjectId, ref: 'Category' }`. Mongoose chỉ cần tên model `'Category'` đã đăng ký trong mongoose registry nếu có populate.
* **Kết luận**: Phụ thuộc của Category rất gọn gàng và độc lập. Tuy nhiên để an toàn tối đa cho các lệnh populate cũ của Phase 3 (`Course`), `category.model.ts` vẫn nên duy trì đăng ký mongoose model trong registry song song với Zod Application Model.

---

## 4. CHIẾN LƯỢC CHUYỂN TIẾP AN TOÀN (HYBRID TRANSITIONAL MODEL PATTERN)

Để đáp ứng đồng thời 2 yêu cầu:
1. Đưa Zod Application Models vào `src/models/*.model.ts` làm chuẩn cho Phase 2 (như ADR quy định).
2. Không làm gãy bất kỳ import nào của các Phase 3–10 chưa di trú.

### 4.1. Kiến trúc Hybrid Model cho `src/models/user.model.ts`

```typescript
import { z } from 'zod'
import { UserRole, UserStatus } from '@prisma/client'
import mongoose, { Document, model, Schema } from 'mongoose'

// ==========================================
// 1. ZOD APPLICATION DOMAIN SCHEMAS (PHASE 2 TARGET)
// ==========================================

export const socialLinksSchema = z.object({
  facebook: z.string().default(''),
  instagram: z.string().default(''),
  github: z.string().default('')
}).default({})

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(100),
  email: z.string().email().max(255),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  avatar: z.string().default(''),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  socialLinks: socialLinksSchema,
  isVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const userPublicSchema = userSchema.pick({
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialLinks: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
})

export const userCompactSchema = userSchema.pick({
  id: true,
  username: true,
  avatar: true,
  role: true
})

export const userInternalSchema = userSchema.extend({
  password: z.string(),
  otpCode: z.string().nullable().optional(),
  otpExpires: z.date().nullable().optional(),
  refreshToken: z.string().nullable().optional(),
  resetPasswordToken: z.string().nullable().optional(),
  resetPasswordExpires: z.date().nullable().optional()
})

// Types suy diễn từ Zod
export type User = z.infer<typeof userSchema>
export type UserPublic = z.infer<typeof userPublicSchema>
export type UserCompact = z.infer<typeof userCompactSchema>
export type UserInternal = z.infer<typeof userInternalSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>

// ==========================================
// 2. MONGOOSE COMPATIBILITY LAYER (CHO PHASE 3–10)
// ==========================================

export interface MongoUserDoc extends Document {
  username: string
  email: string
  password: string
  avatar: string
  courses: Schema.Types.ObjectId[]
  favorites: Schema.Types.ObjectId[]
  status: string
  role: string
  phone: string
  bio: string
  socialLinks?: any
  isVerified: any
  otp_code?: string
  otp_expires?: Date
  refresh_token?: string
  reset_password_token?: string
  reset_password_expires?: Date
}

const legacyUserMongooseSchema = new Schema<MongoUserDoc>(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    status: { type: String, default: 'active' },
    avatar: { type: String },
    phone: { type: String },
    bio: { type: String },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    role: { type: String, default: 'user' },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      github: { type: String, default: '' }
    },
    isVerified: { type: Schema.Types.Mixed, default: false },
    otp_code: { type: String },
    otp_expires: { type: Date },
    refresh_token: { type: String },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date }
  },
  { timestamps: true }
)

export const UserModel = mongoose.models.User || model<MongoUserDoc>('User', legacyUserMongooseSchema)
export default UserModel
```

### 4.2. Lợi ích vượt trội của mô hình Hybrid
1. **Tuân thủ 100% ADR**: Giữ nguyên `src/models/user.model.ts`, cung cấp đầy đủ Zod schemas và types cho Phase 2.
2. **Không phá vỡ các phase sau**: Các lệnh import `import UserModel from '~/models/user.model'` trong Phase 3 (`course.service.ts`), Phase 6 (`order.service.ts`), v.v. vẫn hoạt động trơn tru.
3. **Lộ trình dỡ bỏ rõ ràng**: Khi đến Phase 11 (Cleanup & Mongoose Decommission), ta chỉ cần xóa phần Mongoose Compatibility Layer mà không phải điều chỉnh cấu trúc Zod Schema.

---

## 5. BẢNG MA TRẬN DÒNG DỮ LIỆU TỪNG TẦNG TẠI PHASE 2

```text
[HTTP REQUEST]
     │
     ▼
[Express Router] (user.route.ts / category.route.ts / admin.route.ts)
     │
     ▼
[Middlewares & Validators]
     ├── verifyToken / verifyRole (Access token JWT decode -> req.user)
     └── express-validator:
           ├── validateUUIDParam (thay thế isMongoId)
           └── Database existence checks:
                 ├── findUserByEmail()      [qua user.repository.ts]
                 ├── findCategoryByName()   [qua category.repository.ts]
     │
     ▼
[Controllers] (user.controller.ts / category.controller.ts / admin.controller.ts)
     │ (Chỉ nhận req, chuyển tiếp payload/query sang Service, trả response HTTP)
     ▼
[Services] (user.service.ts / category.service.ts / admin.service.ts)
     ├── Business Logic, Hashing, Token generation, Nodemailer
     ├── Mapping dữ liệu & Sanitization:
     │     ├── userPublicSchema.parse(...)
     │     ├── withCompatId(...) (gắn _id song song id)
     │     └── socialLinks <-> socialFacebook / socialInstagram / socialGithub
     │
     ▼
[Functional Repositories] (user.repository.ts / category.repository.ts)
     ├── findUserById, findUserWithCredentials, addUser, updateUser...
     ├── findActiveCategories, addCategory, updateCategory...
     └── Sử dụng USER_PUBLIC_SELECT / CATEGORY_PUBLIC_SELECT để tối ưu
     │
     ▼
[Prisma Client Singleton] (src/config/prisma.ts)
     │
     ▼
[PostgreSQL Database: tmdemy]
```

---

## 6. KẾT LUẬN

* Việc phân định rõ ràng giữa module đã di trú và module chưa di trú giúp Phase 2 tiến hành hoàn toàn độc lập, an toàn và không gây xung đột toàn cục.
* Mô hình Hybrid Transitional Model bảo đảm quá trình di trú diễn ra cuốn chiếu chính xác theo đúng Roadmap đã phê duyệt.
