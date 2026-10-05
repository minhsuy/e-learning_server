# BÁO CÁO KIỂM TOÁN ĐỘC LẬP (READ-ONLY AUDIT REPORT)
## STEP 2.1: USER & CATEGORY REPOSITORIES AUDIT
**Dự án**: TMDEMY E-Learning Backend  
**Database**: PostgreSQL 16.11 (`tmdemy`) qua Prisma ORM 6.4.1  
**Giai đoạn**: Phase 2 (User, Category & Authentication Migration)  
**Ngày thực hiện**: 02/10/2026  
**Chế độ thực thi**: **READ-ONLY AUDIT (Không chỉnh sửa source code, không thay đổi database)**  
**Kết luận sơ bộ**: **READY FOR STEP 3**

---

## 1. TỔNG QUAN VÀ PHẠM VI AUDIT

Báo cáo này là tài liệu kiểm toán kỹ thuật độc lập nhằm đánh giá toàn diện chất lượng source code, độ an toàn transaction, tính nhất quán của kiểu dữ liệu (Type Safety), rủi ro rò rỉ dữ liệu nhạy cảm, và tính tương thích kiến trúc của tầng **Functional Repositories** vừa được xây dựng tại Step 2, trước khi bước vào Step 3 (Di trú Validators & Middlewares) và Step 4 (Service Migration).

Báo cáo được thiết kế độc lập, tường minh, có đầy đủ căn cứ kỹ thuật để bất kỳ hệ thống AI hoặc Kỹ sư trưởng nào cũng có thể đọc hiểu và đánh giá trực tiếp trạng thái của codebase.

---

## 2. DANH SÁCH TẬP TIN ĐÃ KIỂM TRA TRỰC TIẾP

1. [src/repositories/user.repository.ts](file:///d:/e-learning_server/src/repositories/user.repository.ts) (687 dòng)
2. [src/repositories/category.repository.ts](file:///d:/e-learning_server/src/repositories/category.repository.ts) (351 dòng)
3. [src/repositories/index.ts](file:///d:/e-learning_server/src/repositories/index.ts) (18 dòng)
4. [src/models/user.model.ts](file:///d:/e-learning_server/src/models/user.model.ts) (123 dòng)
5. [src/models/legacy/user.legacy.model.ts](file:///d:/e-learning_server/src/models/legacy/user.legacy.model.ts) (111 dòng)
6. [src/models/category.model.ts](file:///d:/e-learning_server/src/models/category.model.ts) (44 dòng)
7. [src/config/prisma.ts](file:///d:/e-learning_server/src/config/prisma.ts) (63 dòng)
8. [src/utils/uuid.ts](file:///d:/e-learning_server/src/utils/uuid.ts) (65 dòng)
9. [src/middlewares/user.middleware.ts](file:///d:/e-learning_server/src/middlewares/user.middleware.ts) (183 dòng)
10. [src/middlewares/admin.middleware.ts](file:///d:/e-learning_server/src/middlewares/admin.middleware.ts) (133 dòng)
11. [src/middlewares/category.middleware.ts](file:///d:/e-learning_server/src/middlewares/category.middleware.ts) (65 dòng)
12. [src/middlewares/verifyToken.ts](file:///d:/e-learning_server/src/middlewares/verifyToken.ts) (81 dòng)
13. [src/middlewares/verifyRole.ts](file:///d:/e-learning_server/src/middlewares/verifyRole.ts) (62 dòng)
14. [src/types/enum.ts](file:///d:/e-learning_server/src/types/enum.ts) (77 dòng)
15. [scripts/migration-utils/step-02-repositories.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-02-repositories.test.ts) (479 dòng)
16. [scripts/test-phase1-foundation.ts](file:///d:/e-learning_server/scripts/test-phase1-foundation.ts) (276 dòng)
17. [scripts/migration-utils/step-01-zod-model.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-01-zod-model.test.ts) (142 dòng)
18. [AGENTS.md](file:///d:/e-learning_server/AGENTS.md)
19. [docs/architecture/application-model-design.md](file:///d:/e-learning_server/docs/architecture/application-model-design.md)
20. [docs/migration/phase-02-user-category-auth/decisions-register.md](file:///d:/e-learning_server/docs/migration/phase-02-user-category-auth/decisions-register.md)
21. [docs/migration/phase-02-user-category-auth/step-02-repository-report.md](file:///d:/e-learning_server/docs/migration/phase-02-user-category-auth/step-02-repository-report.md)

---

## 3. KẾT QUẢ KIỂM TOÁN TỪNG HẠNG MỤC

### 3.1. Hạng mục A: Type Safety (An toàn kiểu dữ liệu)

#### A. Hiện trạng sử dụng `any`
Quá trình audit mã nguồn phát hiện `any` xuất hiện tại một số vị trí có chủ đích:
1. `user.repository.ts`:
   * Dòng 236 (`findUserById`): Trả về `Promise<any | null>`.
   * Dòng 283 (`findUserByEmail`): Trả về `Promise<any | null>`.
   * Dòng 314 (`findUserByUsername`): Trả về `Promise<any | null>`.
   * Dòng 329 (`findUserByEmailOrUsername`): Trả về `Promise<any | null>`.
   * Dòng 359 (`findUserWithCredentials`): Ép kiểu `as any` tại `return client.user.findUnique(...) as any`.
   * Dòng 504 (`findUsersWithPagination`): Trường `users: any[]`.
   * Dòng 588 (`findActiveTeachers`): Trường `teachers: any[]`.
2. `category.repository.ts`:
   * Dòng 147 (`findCategoryById`): Trả về `Promise<any | null>`.
   * Dòng 167 (`findCategoryBySlug`): Trả về `Promise<any | null>`.
   * Dòng 262 (`findActiveCategories`): Trả về `Promise<any[]>`.
   * Dòng 297 (`findCategoriesWithPagination`): Trường `categories: any[]`.

#### B. Phân tích nguyên nhân kỹ thuật
* Các hàm tìm kiếm nhận tham số `options?: { select?: Prisma.UserSelect; include?: Prisma.UserInclude }` có payload trả về thay đổi tùy thuộc vào cấu trúc projection mà caller truyền vào. Trong TypeScript, nếu không dùng Generic Type `Prisma.UserGetPayload<T>`, kiểu trả về bắt buộc phải dùng `any` để cho phép caller nhận dữ liệu tùy biến theo `select`.
* **Điểm sáng bảo vệ Type Safety**: Các hàm phục vụ public domain đã được gán kiểu chặt chẽ 100% bằng Zod Domain Models:
  * `findUserPublicById`: Trả về `Promise<UserPublic | null>`.
  * `findUserPublicByEmail`: Trả về `Promise<UserPublic | null>`.
  * `findUserInternalById`: Trả về `Promise<UserInternal | null>`.

#### C. Đánh giá & Khuyến nghị
* **Mức độ rủi ro**: **LOW**. Không gây lỗi runtime hoặc compile time.
* **Đề xuất cho Step 4 (Service Migration)**: Khi viết Service Layer, các service gọi `findUserById` hoặc `findUsersWithPagination` nên parse dữ liệu qua Zod Schema (`userPublicSchema.parse(user)`) hoặc sử dụng explicit typing tại Service Layer để bảo đảm type safety hoàn hảo từ Controller tới Client.

---

### 3.2. Hạng mục B: Transaction Safety (An toàn Transaction)

#### A. Cơ chế tiếp nhận Client
* Repository sử dụng type `PrismaTransactionClient` được định nghĩa chuẩn tại `src/config/prisma.ts`.
* Mọi hàm mutation đều tuân thủ nguyên tắc:
  ```typescript
  const client = tx || prisma
  ```
* **Audit kiểm tra toàn bộ Mutation**:
  * `addUser`: Sử dụng `client.user.create`.
  * `updateUser`: Sử dụng `client.user.update`.
  * `updateRefreshToken`: Sử dụng `client.user.update`.
  * `markUserAsVerified`: Sử dụng `client.user.update`.
  * `deleteUser`: Sử dụng `client.user.delete`.
  * `deleteUnverifiedUsersBeforeCutoff`: Sử dụng `client.user.deleteMany`.
  * `addCategory`: Sử dụng `client.category.create`.
  * `updateCategory`: Sử dụng `client.category.update`.
  * `softDeleteCategory`: Sử dụng `client.category.update`.
  * `restoreCategory`: Sử dụng `client.category.update`.
  * `deleteCategory`: Sử dụng `client.category.delete`.
  * **Kết quả**: **100% các hàm mutation đều tôn trọng transaction client `tx`**. Không có hàm nào tự ý gọi root `prisma` khi `tx` được truyền vào.

#### B. Cơ chế Resolve đa hình (`optionsOrTx`)
Trong `user.repository.ts` (dòng 128) và `category.repository.ts` (dòng 43), hàm helper giải quyết tham số đa hình:
```typescript
function resolveUserClientAndOptions(optionsOrTx, explicitTx) {
  if (!optionsOrTx) return { client: explicitTx || prisma }
  if ('user' in optionsOrTx) return { client: optionsOrTx as PrismaTransactionClient }
  return { client: explicitTx || prisma, options: optionsOrTx }
}
```
* **Kiểm tra rủi ro phân định**:
  * Khi truyền `(id, tx)`: `tx` là một transaction client có delegate `tx.user` $\rightarrow$ Nhận diện chính xác là Transaction Client.
  * Khi truyền `(id, { select }, tx)`: Options object chỉ có key `select` hoặc `include`, không có key `user` $\rightarrow$ Nhận diện chính xác là Options Object, và `client` nhận `explicitTx`.
  * Khi truyền `(id, undefined, tx)`: `!optionsOrTx` $\rightarrow$ Nhận diện chính xác `explicitTx`.
* **Phát hiện góc khuất (Edge-case Inspection)**:
  * Nếu một caller vô tình truyền options có cấu trúc lạ hoặc nullish, helper xử lý fallback an toàn về `explicitTx || prisma`.
  * **Đánh giá**: Cơ chế này đã bảo đảm 100% test của Phase 1 (`scripts/test-phase1-foundation.ts`) và Step 2 (`step-02-repositories.test.ts`) đều PASS trọn vẹn mà không xung đột chữ ký hàm.

---

### 3.3. Hạng mục C: Public Data & Sensitive Data Projections

#### A. Kiểm toán các hằng số Projection
Đã đối chiếu 8 Prisma Select constants với schema vật lý `prisma/schema.prisma`:

| Hằng số Projection | Tập tin | Danh sách trường được SELECT | Trạng thái bảo mật |
| :--- | :--- | :--- | :---: |
| `USER_PUBLIC_SELECT` | `user.repository.ts` | `id`, `username`, `email`, `status`, `role`, `avatar`, `phone`, `bio`, `socialFacebook`, `socialInstagram`, `socialGithub`, `isVerified`, `createdAt`, `updatedAt` | **TUYỆT ĐỐI AN TOÀN** (Không password, OTP, tokens) |
| `USER_COMPACT_SELECT` | `user.repository.ts` | `id`, `username`, `avatar`, `role` | **TUYỆT ĐỐI AN TOÀN** (Gọn gàng cho embedding) |
| `USER_ADMIN_SELECT` | `user.repository.ts` | Đầy đủ trường public cho Admin Dashboard | **AN TOÀN** (Không lộ credential) |
| `TEACHER_PUBLIC_SELECT` | `user.repository.ts` | `id`, `username`, `avatar`, `bio`, `phone`, `social*`, `createdAt` | **AN TOÀN** |
| `USER_AUTH_SELECT` | `user.repository.ts` | `id`, `username`, `email`, `password`, `status`, `role`, `isVerified`, `refreshToken` | **NỘI BỘ** (Chỉ dùng so sánh mật khẩu & verify) |
| `USER_INTERNAL_SELECT` | `user.repository.ts` | Đầy đủ credential, OTP, recovery tokens | **NỘI BỘ** (Chỉ dùng cho reset/change password) |
| `CATEGORY_PUBLIC_SELECT`| `category.repository.ts` | `id`, `name`, `slug`, `description`, `createdAt` | **TUYỆT ĐỐI AN TOÀN** (Không lộ audit flags) |
| `CATEGORY_ADMIN_SELECT` | `category.repository.ts` | `id`, `name`, `slug`, `description`, `createdById`, `isDestroyed`, `createdAt`, `updatedAt`, `createdBy` | **AN TOÀN CHO ADMIN** |

#### B. Kiểm toán Runtime Zod Parsing
* Tại `findUserPublicById` (dòng 257) và `findUserPublicByEmail` (dòng 303):
  ```typescript
  return record ? userPublicSchema.parse(record) : null
  ```
  Runtime parser `userPublicSchema.parse()` được thực thi trực tiếp, **không sử dụng type assertion `as UserPublic`** để lách validation. Bất kỳ trường không mong muốn nào sẽ bị Zod chặn lại ngay lập tức.
* Tại `findUserInternalById` (dòng 272):
  ```typescript
  return record ? userInternalSchema.parse(record) : null
  ```
  Sử dụng `userInternalSchema.parse()` đúng chuẩn kiến trúc ADR.

---

### 3.4. Hạng mục D: Username Duplicate (Hiện tượng trùng lặp Username)

#### A. Thực tế dữ liệu PostgreSQL
Trong quá trình audit và chạy kiểm thử dữ liệu thực tế, phát hiện trong database có 2 tài khoản mang username trùng lặp:
1. `773e6719-acb0-5750-b06d-7445812f40b3` (`username: 'thaiminh'`, `email: 'thaiminh06112@gmail.com'`)
2. `02e8e13a-dab2-5fb6-a14f-933ac125edca` (`username: 'thaiminh'`, `email: 'thaiminhgotthedope@gmail.com'`)

#### B. Phân tích nguyên nhân
* Trong `prisma/schema.prisma`, model `User` định nghĩa:
  ```prisma
  model User {
    id       String @id @default(uuid()) @db.Uuid
    username String @db.VarChar(100)
    email    String @unique @db.VarChar(255)
    ...
  }
  ```
  Chỉ có `email` có ràng buộc `@unique`. `username` không có ràng buộc unique ở mức database.
* Do dữ liệu lịch sử từ MongoDB chuyển sang cho phép trùng username, PostgreSQL lưu trữ cả 2 bản ghi này hoàn toàn hợp lệ.

#### C. Hành vi của Repository đối với Username trùng
* `findUserByUsername('thaiminh')`: Sử dụng `client.user.findFirst`, sẽ trả về bản ghi đầu tiên được PostgreSQL lập chỉ mục (trong trường hợp này là `773e6719-...`).
* `isUsernameTaken('thaiminh', excludeUserId)`:
  * Nếu kiểm tra với `excludeUserId = '02e8e13a-...'`, hàm đếm thấy vẫn còn user `773e6719-...'` và trả về `true` (đã bị chiếm dụng).
* `findUserConflict`: Phát hiện chính xác `usernameConflict: true` nếu một trong hai user thực hiện đổi thông tin profile mà trùng với tài khoản kia.

#### D. Đề xuất phương án xử lý cho Service Layer (Step 4)
* **Tuyệt đối KHÔNG sửa database, KHÔNG thêm `@unique` vào `prisma/schema.prisma` trong Phase 2**.
* Tại Step 4, trong `updateMeService` và `updateUserByAdminService`:
  Chỉ kích hoạt kiểm tra `isUsernameTaken` khi username gửi lên **khác với username hiện tại của chính người dùng đó** (`payload.username !== currentUser.username`). Nếu người dùng giữ nguyên username của mình, không báo lỗi conflict.

---

### 3.5. Hạng mục E: Cron Cleanup Safety (An toàn dọn dẹp tài khoản)

#### A. Kiểm toán hàm `deleteUnverifiedUsersBeforeCutoff`
```typescript
export const MIGRATION_CUTOFF_DATE = new Date('2026-10-01T00:00:00.000Z')

export const deleteUnverifiedUsersBeforeCutoff = async (
  params: {
    expireThreshold: Date
    cutoffDate?: Date
  },
  tx?: PrismaTransactionClient
): Promise<{ count: number }> => {
  const client = tx || prisma
  const cutoff = params.cutoffDate || MIGRATION_CUTOFF_DATE
  return client.user.deleteMany({
    where: {
      role: { notIn: [UserRole.ADMIN, UserRole.TEACHER] },
      isVerified: false,
      createdAt: {
        gt: cutoff,
        lt: params.expireThreshold
      }
    }
  })
}
```
* **Bảo vệ tài khoản ADMIN & TEACHER**: Điều kiện `role: { notIn: [UserRole.ADMIN, UserRole.TEACHER] }` ngăn chặn 100% nguy cơ xóa tài khoản quản trị và giảng viên.
* **Bảo vệ tài khoản lịch sử**: Mốc `MIGRATION_CUTOFF_DATE = new Date('2026-10-01T00:00:00.000Z')` là hằng số tĩnh cố định. Tất cả 7 tài khoản lịch sử đều có `createdAt < 2026-10-01`. Do có điều kiện `createdAt > cutoff`, **không một tài khoản lịch sử nào bị xóa**.

#### B. Cảnh báo quan trọng về hàm `deleteUnverifiedUsersOlderThan`
* Trong `user.repository.ts` (dòng 673), hàm `deleteUnverifiedUsersOlderThan` được giữ lại để tương thích mã nguồn cũ nhưng **KHÔNG CÓ bộ lọc bảo vệ role và cutoff date**.
* **Đề xuất cho Step 5 (Cron Job Restructuring)**:
  * Trong `src/cronJobs/deleteUnverifiedUsers.ts`, bắt buộc phải chuyển sang gọi `deleteUnverifiedUsersBeforeCutoff`.
  * Không gọi `deleteUnverifiedUsersOlderThan` trong môi trường chạy thật.

---

### 3.6. Hạng mục F: Category Repository Audit

1. **Cơ chế Soft-delete**:
   * `softDeleteCategory` cập nhật `isDestroyed: true`.
   * `restoreCategory` cập nhật `isDestroyed: false`.
   * `findActiveCategories` và `findCategoriesWithPagination` mặc định lọc `isDestroyed: false`. Danh mục đã bị xóa mềm không bao giờ xuất hiện ở public endpoints.
2. **Kiểm tra trùng Slug và Name**:
   * `isCategoryNameTaken` và `isCategorySlugTaken` hỗ trợ tham số `excludeId` giúp nghiệp vụ cập nhật danh mục không tự báo lỗi trùng lặp với chính nó.
3. **Phân trang & Tìm kiếm**:
   * `findCategoriesWithPagination` hỗ trợ search `insensitive` trên cả `name` và `description`. Trả về metadata phân trang chuẩn (`page`, `limit`, `total`, `totalPages`).
4. **Tình trạng `src/models/category.model.ts`**:
   * File này hiện là Mongoose Model vì `category.service.ts` và `category.middleware.ts` đang import.
   * `category.repository.ts` hoạt động hoàn toàn độc lập thông qua Prisma Client, không phụ thuộc vào `category.model.ts`.

---

### 3.7. Hạng mục G: Kiến trúc & Tương thích hệ thống (Architecture & Compatibility)

1. **Tuân thủ Functional Style**:
   * 100% repository functions được export trực tiếp (pure async functions).
   * Không sử dụng Class, không dùng từ khóa `this`, không kế thừa BaseRepository.
   * Không tạo singleton class instance.
2. **Phân định rõ ranh giới tầng**:
   * Repository chỉ làm nhiệm vụ tương tác cơ sở dữ liệu qua Prisma.
   * Tuyệt đối không chứa logic HTTP (`req`, `res`, HTTP status code).
   * Không chứa logic mã hóa mật khẩu bcrypt, sinh OTP hay tạo JWT token.
3. **Index & Re-export**:
   * `src/repositories/index.ts` hỗ trợ đồng thời 2 phong cách import:
     - Namespace: `import { userRepository, categoryRepository } from '~/repositories'`
     - Direct: `import { findUserById, addCategory } from '~/repositories'`
   * Không có circular dependency giữa các repositories.
4. **Tương thích Middleware hiện tại**:
   * Các middleware hiện tại (`user.middleware.ts`, `category.middleware.ts`) vẫn đang hoạt động với Mongoose cho đến khi được di trú tại Step 3.
   * Không có xung đột giữa Repositories mới và hệ thống middleware cũ.

---

## 4. KẾT QUẢ KIỂM THỬ THỰC TẾ (AUTOMATED VERIFICATION)

Toàn bộ các bộ kiểm thử tự động đã được chạy lại trực tiếp trên môi trường và ghi nhận kết quả:

| STT | Tên Bộ kiểm thử | Lệnh thực thi | Kết quả | Chi tiết kiểm chứng |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Step 2 Repositories Suite** | `npx tsx scripts/migration-utils/step-02-repositories.test.ts` | **53/53 PASS (100%)** | Toàn bộ 53 kịch bản: Projections, Single query, List, Conflicts, Mutations, Rollback. |
| 2 | **Phase 1 Foundation Suite** | `npx tsx scripts/test-phase1-foundation.ts` | **39/39 PASS (100%)** | Kiểm tra hồi quy Prisma Client, UUID utilities, Transaction CRUD, Error mapping. |
| 3 | **Step 1 Zod Model Suite** | `npx tsx scripts/migration-utils/step-01-zod-model.test.ts` | **17/17 PASS (100%)** | Zod Application Model validation & Legacy Mongoose isolation. |
| 4 | **TypeScript Compilation** | `cmd /c npx tsc --noEmit` | **0 lỗi mới** | Các module `src/repositories/` đạt 0 lỗi biên dịch TypeScript. |

---

## 5. TỔNG HỢP CÁC PHÁT HIỆN VÀ ĐÁNH GIÁ MỨC ĐỘ RỦI RO

| Mã | Vị trí phát hiện | Mô tả vấn đề | Mức độ | Đề xuất giải pháp tại Step tiếp theo |
| :---: | :--- | :--- | :---: | :--- |
| **F-01** | `user.repository.ts`<br>(dòng 673) | `deleteUnverifiedUsersOlderThan` không có bộ lọc `MIGRATION_CUTOFF_DATE` và role exclusion. | **MEDIUM** | Tại Step 5, chuyển đổi cron job sang gọi `deleteUnverifiedUsersBeforeCutoff`. Đánh dấu deprecate hàm cũ. |
| **F-02** | Database `users`<br>(tài khoản `thaiminh`) | Hai tài khoản lịch sử mang cùng username `thaiminh`. `findUserConflict` sẽ báo trùng nếu cập nhật. | **LOW** | Tại Step 4, trong `updateMeService`, bỏ qua kiểm tra trùng username nếu username gửi lên trùng với username hiện tại của chính user đó. |
| **F-03** | `user.repository.ts`<br>& `category.repository.ts` | Sử dụng kiểu trả về `any` cho các hàm dynamic select query (`findUserById`, `findAllUsers`, ...). | **LOW** | Tại Step 4, áp dụng Zod parsing hoặc explicit type mapping tại Service Layer trước khi chuyển tiếp dữ liệu lên Controller. |
| **F-04** | `category.model.ts` | Vẫn đang là Mongoose Model do `category.service.ts` và `category.middleware.ts` phụ thuộc. | **INFO** | Giữ nguyên theo đúng roadmap. Chuyển đổi đồng bộ sang Zod Model tại Step 4 khi migrate Category Service. |

---

## 6. ĐỀ XUẤT HÀNH ĐỘNG CHO STEP 3 (VALIDATORS & MIDDLEWARE MIGRATION)

Khi bước vào Step 3:
1. **Thực thi Quyết định D3**:
   * Tại `src/routes/admin.route.ts` (dòng 160), thay thế `courseIdValidator` bằng `categoryIdValidator` chuẩn UUID.
2. **Cập nhật UUID Validation**:
   * Trong `user.middleware.ts`, thay `mongoose.Types.ObjectId.isValid` bằng `isValidUUID` từ `src/utils/uuid.ts`.
   * Trong `admin.middleware.ts`, cập nhật `getUserDetailValidator` và `updateUserByAdminValidator` sang UUID.
   * Trong `category.middleware.ts`, cập nhật `categoryIdValidator` sang UUID.
3. **Loại bỏ Database Queries trong Express Validator**:
   * Tách các câu truy vấn `UserModel.findOne` và `CategoryModel.findOne` ra khỏi `.custom()` trong Middleware, sẵn sàng chuyển trách nhiệm kiểm tra sự tồn tại/duy nhất sang Service Layer ở Step 4.

---

## 7. KẾT LUẬN CUỐI CÙNG

Tầng Functional Repositories cho User và Category (`user.repository.ts`, `category.repository.ts`, `repositories/index.ts`) đã được xây dựng hoàn chỉnh, đáp ứng 100% các tiêu chí:
* Tuân thủ triệt để kiến trúc **Functional Style** và các quy định trong `AGENTS.md`.
* Bảo vệ toàn diện thông tin nhạy cảm qua mô hình **Phòng thủ Chiều sâu 2 Tuyến (Database Projections + Zod Runtime Parsing)**.
* Hỗ trợ Transaction Client an toàn tuyệt đối.
* Không có hồi quy kỹ thuật, vượt qua 100% các bộ kiểm thử tự động (109/109 tests pass tổng cộng).
* Không gây bất kỳ thay đổi nào lên database PostgreSQL hoặc MongoDB.

**TRẠNG THÁI NGHIỆM THU**: **`READY FOR STEP 3`**  
*(Sẵn sàng chuyển sang Bước 3: Di trú Validators & Middlewares sau khi Chủ dự án phê duyệt).*
