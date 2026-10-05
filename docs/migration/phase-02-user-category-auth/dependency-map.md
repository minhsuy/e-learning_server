# BẢN ĐỒ PHỤ THUỘC & KẾ HOẠCH TÁCH BIỆT LEGACY MODEL
## PHASE 2: USER, CATEGORY & AUTHENTICATION SERVICES
**Dự án**: TMDEMY E-Learning Backend  
**Database Đích**: PostgreSQL 16.11 (`tmdemy`) qua Prisma ORM 6.4.1  
**Mục tiêu**: Tách biệt hoàn toàn Zod Application Model và Mongoose Legacy Model, bảo vệ 100% các Phase 3–10.

---

## 1. NGUYÊN TẮC THIẾT KẾ MÔ HÌNH LEGACY SEPARATION (QUYẾT ĐỊNH D2)

Theo chỉ thị của Chủ dự án:
1. **Tinh khiết hóa Model mới**:
   * `src/models/user.model.ts`: **CHỈ CHỨA ZOD APPLICATION MODELS**. Không nhúng Mongoose schema hay `mongoose.model()` vào file này.
   * `src/models/category.model.ts`: **CHỈ CHỨA ZOD APPLICATION MODELS**. Không nhúng Mongoose schema hay `mongoose.model()` vào file này.
2. **Khu biệt Model cũ**:
   * Duy trì Mongoose Model cũ trong thư mục riêng: `src/models/legacy/user.legacy.model.ts`.
   * Chỉ tạo Legacy Model khi có phụ thuộc thực tế. Không tạo `category.legacy.model.ts` vì không có module nào ngoài Phase 2 import `CategoryModel`.
3. **Không xóa Mongoose Model trước Phase 11**:
   * Toàn bộ Mongoose Model trong `src/models/legacy/` chỉ được phép gỡ bỏ khi toàn bộ hệ thống đã hoàn thành di trú và vượt qua toàn diện API Regression Tests.

---

## 2. MA TRẬN PHỤ THUỘC VÀ ĐIỀU CHỈNH IMPORT GRAPH

### 2.1. Kiểm toán Toàn bộ Import Graph của `UserModel`

| # | File phụ thuộc | Phase | Hiện trạng Import | Hành động trong Implementation Phase 2 | Ghi chú an toàn |
| :-: | :--- | :---: | :--- | :--- | :--- |
| 1 | `src/services/user.service.ts` | **Phase 2** | `import UserModel from '~/models/user.model'` | **Chuyển sang `user.repository.ts`** | Bỏ hoàn toàn phụ thuộc Mongoose |
| 2 | `src/services/admin.service.ts` | **Phase 2** | `import UserModel from '~/models/user.model'` | **Chuyển các hàm User sang `user.repository.ts`** | Bỏ phụ thuộc Mongoose cho User |
| 3 | `src/middlewares/user.middleware.ts` | **Phase 2** | `import UserModel from '~/models/user.model'` | **Chuyển sang `user.repository.ts`** | Bỏ phụ thuộc Mongoose |
| 4 | `src/cronJobs/deleteUnverifiedUsers.ts` | **Phase 2** | `import UserModel from '~/models/user.model'` | **Chuyển sang `user.repository.ts`** | Bỏ phụ thuộc Mongoose |
| 5 | `src/services/course.service.ts` | **Phase 3** | `import UserModel from '~/models/user.model'` | **Chuyển import sang `~/models/legacy/user.legacy.model`** | Tiếp tục chạy Mongoose queries bình thường |
| 6 | `src/services/quiz.service.ts` | **Phase 4** | `import { User } from '~/models/user.model'` | **Chuyển import sang `~/models/legacy/user.legacy.model`** | Tiếp tục chạy Mongoose queries bình thường |
| 7 | `src/services/quizSubmission.service.ts`| **Phase 5** | `import UserModel from '~/models/user.model'` | **Chuyển import sang `~/models/legacy/user.legacy.model`** | Tiếp tục chạy Mongoose queries bình thường |
| 8 | `src/services/order.service.ts` | **Phase 6** | `import UserModel from '~/models/user.model'` | **Chuyển import sang `~/models/legacy/user.legacy.model`** | Tiếp tục chạy Mongoose queries bình thường |
| 9 | `src/services/enrollment.service.ts` | **Phase 6** | `import UserModel from '~/models/user.model'` | **Chuyển import sang `~/models/legacy/user.legacy.model`** | Tiếp tục chạy Mongoose queries bình thường |
| 10| `src/services/rating.service.ts` | **Phase 7** | `import UserModel from '../models/user.model'` | **Chuyển import sang `~/models/legacy/user.legacy.model`** | Tiếp tục chạy Mongoose queries bình thường |
| 11| `src/services/comment.service.ts` | **Phase 8** | `import UserModel from '~/models/user.model'` | **Chuyển import sang `~/models/legacy/user.legacy.model`** | Tiếp tục chạy Mongoose queries bình thường |

### 2.2. Kiểm toán Import Graph của `CategoryModel`

| # | File phụ thuộc | Phase | Hiện trạng Import | Hành động trong Implementation Phase 2 | Ghi chú an toàn |
| :-: | :--- | :---: | :--- | :--- | :--- |
| 1 | `src/services/category.service.ts` | **Phase 2** | `import CategoryModel from '~/models/category.model'` | **Chuyển sang `category.repository.ts`** | Bỏ hoàn toàn phụ thuộc Mongoose |
| 2 | `src/middlewares/category.middleware.ts`| **Phase 2** | `import CategoryModel from '~/models/category.model'` | **Chuyển sang `category.repository.ts`** | Bỏ hoàn toàn phụ thuộc Mongoose |

* **Đánh giá**: Không có bất kỳ service hay controller nào thuộc Phase 3–10 import trực tiếp `CategoryModel`.
* Trong `src/models/course.model.ts` (Phase 3), trường `category` được khai báo dạng ObjectId tham chiếu: `{ type: Schema.Types.ObjectId, ref: 'Category' }`. Mongoose chỉ cần tên chuỗi `'Category'` trong schema definition mà không cần import model instance.
* Do đó: **Không cần tạo `category.legacy.model.ts`**. `src/models/category.model.ts` được chuyển thành Zod Application Model 100% sạch sẽ.

---

## 3. CẤU TRÚC THƯ MỤC MODELS SAU KHI TRIỂN KHAI

```text
src/models/
├── legacy/                               <-- THƯ MỤC CÔ LẬP MONGOOSE LEGACY
│   └── user.legacy.model.ts              <-- Chứa Mongoose Schema & UserModel cho Phase 3–8
│
├── category.model.ts                     <-- ZOD APPLICATION MODEL (100% Pure Zod)
├── user.model.ts                         <-- ZOD APPLICATION MODEL (100% Pure Zod)
│
├── certificate.model.ts                  <-- Mongoose Model (Chờ di trú Phase 7)
├── chapter.model.ts                      <-- Mongoose Model (Chờ di trú Phase 3)
├── comment.model.ts                      <-- Mongoose Model (Chờ di trú Phase 8)
├── conversation.model.ts                 <-- Mongoose Model (Chờ di trú Phase 9)
├── coupon.model.ts                       <-- Mongoose Model (Chờ di trú Phase 6)
├── course.model.ts                       <-- Mongoose Model (Chờ di trú Phase 3)
├── enrollment.model.ts                   <-- Mongoose Model (Chờ di trú Phase 6)
├── favoriteCourse.model.ts               <-- Mongoose Model (Chờ di trú Phase 7)
├── lesson.model.ts                       <-- Mongoose Model (Chờ di trú Phase 3)
├── message.model.ts                      <-- Mongoose Model (Chờ di trú Phase 9)
├── notification.model.ts                 <-- Mongoose Model (Chờ di trú Phase 10)
├── order.model.ts                        <-- Mongoose Model (Chờ di trú Phase 6)
├── progress.model.ts                     <-- Mongoose Model (Chờ di trú Phase 7)
├── question.model.ts                     <-- Mongoose Model (Chờ di trú Phase 4)
├── quiz.model.ts                         <-- Mongoose Model (Chờ di trú Phase 4)
├── quizSubmission.model.ts               <-- Mongoose Model (Chờ di trú Phase 5)
└── rating.model.ts                       <-- Mongoose Model (Chờ di trú Phase 7)
```

---

## 4. THIẾT KẾ CỤ THỂ CÁC FILE MODEL MỚI VÀ LEGACY

### 4.1. `src/models/user.model.ts` (Zod Application Model Thuần Túy)
```typescript
import { z } from 'zod'
import { UserRole, UserStatus } from '@prisma/client'

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

export type User = z.infer<typeof userSchema>
export type UserPublic = z.infer<typeof userPublicSchema>
export type UserCompact = z.infer<typeof userCompactSchema>
export type UserInternal = z.infer<typeof userInternalSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>
```

### 4.2. `src/models/legacy/user.legacy.model.ts` (Mongoose Legacy Model)
```typescript
import mongoose, { Document, model, Schema } from 'mongoose'
import { UserRole, UserStatus } from '~/types/enum'
import { SocialLinks } from '~/types/type'

export interface User extends Document {
  username: string
  email: string
  password: string
  avatar: string
  courses: Schema.Types.ObjectId[]
  favorites: Schema.Types.ObjectId[]
  status: UserStatus
  role: UserRole
  phone: string
  bio: string
  socialLinks?: SocialLinks
  isVerified: any
  otp_code?: string
  otp_expires?: Date
  refresh_token?: string
  reset_password_token?: string
  reset_password_expires?: Date
}

const userSchema = new Schema<User>(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    status: { type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    avatar: { type: String },
    phone: { type: String },
    bio: { type: String },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
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

export const UserModel = mongoose.models.User || model<User>('User', userSchema)
export default UserModel
```

---

## 5. KẾT LUẬN

* Việc tách riêng `user.legacy.model.ts` vào `src/models/legacy/` đảm bảo:
  1. `src/models/user.model.ts` chuẩn kiến trúc 100% theo Zod Application Model.
  2. Các file Phase 3–8 chưa di trú tiếp tục compile và chạy bình thường mà không bị ảnh hưởng.
  3. Lộ trình decommission tại Phase 11 chỉ đơn giản là xóa bỏ thư mục `src/models/legacy/`.
