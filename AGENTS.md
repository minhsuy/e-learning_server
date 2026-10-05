# TÀI LIỆU QUY TẮC PHÁT TRIỂN VÀ MIGRATION TMDEMY (AGENTS.MD)

Tài liệu này là quy chuẩn kỹ thuật bắt buộc cao nhất cho toàn bộ kỹ sư và trợ lý AI tham gia phát triển, bảo trì và thực hiện Migration hệ thống **TMDEMY E-Learning Backend**. Mọi chỉ dẫn bên dưới có tính ràng buộc tuyệt đối, không được tự ý vi phạm hoặc suy diễn trái với các quyết định kiến trúc đã được phê duyệt.

---

# A. TỔNG QUAN DỰ ÁN & BỐI CẢNH MIGRATION

## 1. Thông tin dự án
* **Tên dự án**: TMDEMY E-Learning Backend.
* **Mục tiêu**: Hệ thống backend phục vụ nền tảng bán khóa học trực tuyến và đào tạo trực tuyến.
* **Các phân hệ nghiệp vụ chính**:
  1. Authentication & User Management.
  2. Role & Authorization (`ADMIN`, `USER`, `EXPERT`).
  3. Category Management.
  4. Course Management.
  5. Chapter & Lesson Management.
  6. Quiz & Question Management.
  7. Quiz Submission & Evaluation.
  8. Order & Checkout.
  9. Coupon Management.
  10. Enrollment Management.
  11. Progress Tracking.
  12. Certificate Generation.
  13. Favorite Course Management.
  14. Rating & Review.
  15. Comment & Comment Reaction.
  16. Chat (Conversation & Message, Realtime Socket.IO).
  17. Notification.
  18. Cron Jobs & Background Tasks.

## 2. Tech Stack mục tiêu & Phiên bản thực tế
* **Runtime**: Node.js (phiên bản ổn định theo môi trường).
* **Framework**: Express.js.
* **Ngôn ngữ**: TypeScript (chế độ strict).
* **Target Database**: PostgreSQL 16.11 (database: `tmdemy`).
* **Target ORM**: Prisma ORM 6.4.1 (Prisma Client Singleton tại `src/config/prisma.ts`).
* **Validation & Schemas**:
  * **Transport Layer (HTTP)**: Express Validator (giữ nguyên tại `src/middlewares/`).
  * **Application Layer**: Zod 3.x (Application Models tại `src/models/*.model.ts`).
* **Authentication**: JWT (Access Token, Refresh Token), bcryptjs.
* **Realtime**: Socket.IO.
* **Utilities dùng chung**: `src/utils/uuid.ts`, `src/utils/prismaError.ts`.

> [!IMPORTANT]
> **Quy tắc phụ thuộc**: Không tự ý nâng cấp, hạ cấp hoặc cài đặt package mới nếu chưa có sự phê duyệt bằng văn bản từ chủ dự án. Luôn đối chiếu phiên bản trong `package.json` trước khi sử dụng bất kỳ cú pháp thư viện nào.

## 3. Kiến trúc Database kép (Transitional Dual-Stack Architecture)
Hệ thống đang trong giai đoạn chuyển dịch cơ sở dữ liệu cuốn chiếu (phased migration):
1. **Target Database – PostgreSQL (`tmdemy`)**:
   * Quản lý thông qua **Prisma ORM**.
   * Single source of truth cho cấu trúc vật lý: `prisma/schema.prisma`.
   * Toàn bộ các module đã migration phải đọc và ghi duy nhất vào PostgreSQL qua Functional Repositories.
2. **Legacy Database – MongoDB Atlas (`e-learning`)**:
   * Quản lý thông qua **Mongoose**.
   * Đóng vai trò: Dữ liệu nguồn phục vụ đối chiếu, dữ liệu phục vụ rollback khi cần thiết, và tiếp tục phục vụ các module chưa tới lượt migration trong giai đoạn chuyển tiếp.
   * **Quy tắc bảo vệ**: Không xóa kết nối MongoDB (`src/config/dbConnect.ts`), không xóa package Mongoose và không xóa các file Mongoose Model cũ của các module chưa migration trước Phase 11.

## 4. Mục tiêu & Nguyên lý cốt lõi của Migration
* **Bản chất của nhiệm vụ**: Đây là quá trình **Database Layer & ORM Migration** (từ MongoDB/Mongoose sang PostgreSQL/Prisma).
* **Không phải là API Redesign**: Tuyệt đối không tái thiết kế API, không thay đổi cấu trúc URL, không đổi kiểu dữ liệu payload request/response của Client.
* **Zero Downtime & Zero Regression**: Giữ nguyên vẹn tính tương thích ngược với Frontend hiện hành (Next.js client) và vượt qua toàn bộ Postman Regression Collection.

## 5. Trạng thái Migration hiện tại
* **Data Migration (10 Phases dữ liệu)**: ĐÃ HOÀN THÀNH (`PASS_WITH_DOCUMENTED_EXCEPTIONS`). 120 source documents và 41 embedded documents đã được chuyển thành 161 rows trên 26 business tables PostgreSQL với 15 enums.
* **Phase 1 (Foundation & Prisma Infrastructure)**: ĐÃ HOÀN THÀNH (32/32 tests PASS). Đã thiết lập Prisma Client Singleton, UUID utilities (`src/utils/uuid.ts`), Prisma error mapper (`src/utils/prismaError.ts`), ID Mapper determinism (`scripts/migration-utils/id-mapper.ts`).
* **Phase 2 (User, Category & Authentication)**: ĐÃ HOÀN THÀNH. User, Category và Auth flows đã chuyển sang PostgreSQL/Prisma.
* **Phase 3 (Course, Chapter & Lesson)**: **IN PROGRESS (ĐÃ HOÀN THÀNH STEPS 1–4; STEPS 5–7 CHƯA THỰC HIỆN / PENDING REVIEW)**.
  * Các bước đã hoàn thành: Step 1 (Legacy Zod Models), Step 2 (Repositories Migration), Step 3 (Services Migration), Step 4 (Validators & Middlewares Migration) đã có báo cáo kỹ thuật.
  * Các bước chưa hoàn thành: Step 5 (API Test & Regression Audit), Step 6 (Final Implementation Report) và Step 7 (Approval Gate) hiện **CHƯA THỰC HIỆN / CHƯA NGHIỆM THU (PENDING / NOT VERIFIED)**.
  * **Quy tắc nghiệm thu**: Tuyệt đối không tự đánh dấu Phase 3 là COMPLETED khi Step 5 API Test Audit chưa được thực hiện và Phase chưa được nghiệm thu tại Step 7. Nếu chưa xác minh thực tế, ghi rõ `PENDING / NOT VERIFIED` thay vì tự suy đoán.
* **Các Phase tiếp theo (Phases 4 đến 11)**: Giữ nguyên trạng thái chuyển tiếp (`PENDING`), chờ kích hoạt tuần tự theo quy trình phê duyệt.

## 6. Lộ trình Migration 11 Phase đã được phê duyệt (Approved Roadmap)
```text
Phase 1: Foundation & Prisma Infrastructure               [COMPLETED]
Phase 2: User, Category & Authentication                 [COMPLETED]
Phase 3: Course, Chapter & Lesson                        [IN PROGRESS - Steps 1-4 Done; Steps 5-7 Pending/Not Verified]
Phase 4: Quiz & Question                                 [PENDING]
Phase 5: Quiz Submission & Evaluation                    [PENDING]
Phase 6: Order, Coupon & Enrollment                      [PENDING]
Phase 7: Progress, Certificate, Favorite & Rating        [PENDING]
Phase 8: Comment & Comment Reaction                      [PENDING]
Phase 9: Chat (Conversation & Message, Socket.IO)        [PENDING]
Phase 10: Notification                                   [PENDING]
Phase 11: Cleanup & Mongoose Decommission                [FINAL STAGE]
```
> Không được nhảy cóc qua bất kỳ Phase nào và không được tự ý thực hiện công việc của Phase sau khi chưa hoàn thành và được nghiệm thu Phase trước.

---

# B. NGUYÊN TẮC BẤT KHẢ XÂM PHẠM (NON-NEGOTIABLE RULES)

Những nguyên tắc dưới đây có tính kỷ luật cao nhất. Bất kỳ sự vi phạm nào cũng bị coi là lỗi nghiêm trọng làm gián đoạn tiến độ dự án:

1. **Tuyệt đối không tự ý thay đổi Kiến trúc phân tầng**:
   * Không chuyển Functional Repository thành Class-based Repository.
   * Không tạo BaseRepository generic.
   * Không gọi Prisma Client trực tiếp từ Controller hoặc Middleware.
   * Không nhúng database query vào Express Validator.
2. **Đóng băng toàn diện API Contract (API Contract Freeze)**:
   * Giữ nguyên 100% endpoint URL, HTTP methods, request body format, query params, URL route params, HTTP status codes và JSON response schema.
   * Không tự ý xóa, đổi tên, thêm endpoint mới hoặc thay đổi quyền phân quyền (role authorization).
3. **Đóng băng Prisma Schema (`prisma/schema.prisma`)**:
   * Không tự ý thêm, sửa, đổi tên bảng, cột, khóa chính, khóa ngoại, quan hệ hoặc enums trong `prisma/schema.prisma`. Mọi thay đổi schema vật lý phải có văn bản phê duyệt riêng.
4. **Bảo toàn Business Logic hiện hữu**:
   * Không được cắt giảm, đơn giản hóa hoặc thay thế business logic cũ bằng implementation sơ sài.
   * Toàn bộ workflow phức tạp (tính tiền, checkout, kiểm tra coupon, tính điểm quiz, theo dõi progress, cấp chứng chỉ) phải được phản ánh đầy đủ trên Prisma.
5. **Nghiêm cấm xóa dữ liệu hoặc reset Database**:
   * Tuyệt đối không chạy `prisma migrate reset`, `drop database`, `truncate table` hoặc bất kỳ thao tác hủy dữ liệu nào trên PostgreSQL và MongoDB.
   * Không xóa hoặc sửa các bản ghi ngoại lệ lịch sử đã được phê duyệt bảo toàn (3 orphan orders, 5 dangling notification references).
6. **Đóng băng thư viện và dependencies**:
   * Không tự ý cài đặt package mới qua `npm install` hoặc `yarn add`.
   * Không tự ý cập nhật phiên bản dependencies trong `package.json`.
7. **Bảo vệ phạm vi công việc (Strict Phase Scope Protection)**:
   * Chỉ sửa đổi các file mã nguồn thuộc phạm vi Phase hiện tại và các shared dependencies thực sự cần thiết đã được phê duyệt trong Audit Report.
   * Tuyệt đối không sửa code của các module thuộc Phase tương lai.
8. **Tuân thủ quy trình cổng phê duyệt (Mandatory Approval Gate)**:
   * Sau mỗi bước Audit (Step 2) và sau mỗi Phase (Step 7), AI bắt buộc phải dừng lại, báo cáo chi tiết và chờ chủ dự án phê duyệt trước khi tiếp tục.

---

# C. TIÊU CHUẨN KIẾN TRÚC & MÃ NGUỒN (ARCHITECTURE & CODING STANDARDS)

Hệ thống áp dụng kiến trúc phân tầng đơn hướng bắt buộc:
```text
HTTP Request
  └── Router (src/routes/)
        └── Middleware & Express Validator (src/middlewares/)
              └── Controller (src/controller/)
                    └── Service (src/services/)
                          └── Functional Repository (src/repositories/)
                                └── Prisma Client Singleton (src/config/prisma.ts)
                                      └── PostgreSQL Database
```

## 1. Trách nhiệm của từng tầng
* **Router (`src/routes/*.route.ts`)**:
  * Định nghĩa HTTP endpoint, HTTP method.
  * Gắn kết middleware xác thực và validator theo đúng thứ tự.
  * Gọi function Controller tương ứng.
  * Tuyệt đối không chứa business logic, không truy vấn database.
* **Middleware (`src/middlewares/*.middleware.ts`)**:
  * Xử lý HTTP pipeline: trích xuất header, verify JWT token, kiểm tra cú pháp request bằng Express Validator.
  * Validate UUID route parameters.
  * Trả về lỗi validation thông qua `handleValidationErrors`.
  * Không chứa business logic, không kiểm tra quyền sở hữu (ownership), không truy vấn Prisma trực tiếp.
* **Controller (`src/controller/*.controller.ts`)**:
  * Function-based controller.
  * Tiếp nhận `req.body`, `req.params`, `req.query`, `req.user`.
  * Gọi Service function tương ứng, nhận kết quả và trả HTTP response (kèm status code chuẩn).
  * Không chứa business logic, không gọi Repository hoặc Prisma Client trực tiếp.
* **Service (`src/services/*.service.ts`)**:
  * Function-based service. Trung tâm của toàn bộ Business Logic.
  * Kiểm tra điều kiện nghiệp vụ: sự tồn tại (existence), tính duy nhất (uniqueness), quyền sở hữu (ownership), trạng thái tài nguyên (status transition).
  * Ứng dụng Zod Application Models tại các ranh giới input/output để bảo vệ dữ liệu.
  * Điều phối một hoặc nhiều Functional Repositories; quản lý Prisma transaction khi cần tính nguyên tử (atomicity).
  * Chuẩn hóa và serialize dữ liệu trả về cho Controller.
* **Functional Repository (`src/repositories/*.repository.ts`)**:
  * **Bắt buộc phong cách Functional thuần túy**: Export các hàm async độc lập, không dùng Class, không dùng Generic BaseRepository, không dùng từ khóa `this`.
  * Trách nhiệm duy nhất: Tương tác với PostgreSQL thông qua Prisma Client Singleton.
  * Thực hiện các thao tác CRUD, relations, Prisma Select projections, compound key lookups.
  * Luôn hỗ trợ tham số transaction client tùy chọn (`tx?: PrismaTransactionClient`).

## 2. Tiêu chuẩn Functional Repository & An toàn Kiểu dữ liệu
Cấu trúc mẫu chuẩn mực bắt buộc tuân thủ (sử dụng kiểu trả về chính xác từ Prisma Select thông qua `Prisma.CourseGetPayload`, tương thích hoàn toàn với Prisma ORM 6.4.1):
```typescript
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { Prisma } from '@prisma/client'

export const COURSE_PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  oldPrice: true,
  thumbnail: true,
  description: true,
  status: true,
  categoryId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true
} as const satisfies Prisma.CourseSelect

export type CoursePublicPayload = Prisma.CourseGetPayload<{
  select: typeof COURSE_PUBLIC_SELECT
}>

export const findCourseById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<CoursePublicPayload | null> => {
  const client = tx ?? prisma
  return client.course.findUnique({
    where: { id },
    select: COURSE_PUBLIC_SELECT
  })
}
```

## 3. Prisma Client Singleton (`src/config/prisma.ts`)
* Luôn import `prisma` singleton từ `src/config/prisma.ts`.
* Tuyệt đối không khởi tạo `new PrismaClient()` trong các Repository, Service hoặc Controller.
* Cấu hình singleton đã bảo vệ chống cạn kiệt connection pool khi hot-reload trong môi trường development.

## 4. Quản lý Giao dịch (Transaction Management)
* Khi một nghiệp vụ bao gồm nhiều thao tác ghi dữ liệu phụ thuộc lẫn nhau (ví dụ: tạo Order + trừ Coupon + tạo Enrollment), bắt buộc sử dụng `prisma.$transaction(async (tx) => { ... })`.
* Mọi hàm Repository liên quan phải nhận `tx: PrismaTransactionClient` và sử dụng `tx` thay cho `prisma`.

## 5. Tiêu chuẩn TypeScript & Chính sách `any` (Type Safety & Any Policy)
* Tuân thủ chế độ Strict Type toàn diện.
* **Chính sách đối với `any`**:
  * **Tuyệt đối không tạo thêm `any` mới** trong code viết mới hoặc code refactor để né tránh lỗi type checking.
  * **Tuyệt đối không ép kiểu cưỡng bức (`as any` hoặc `as unknown as Type`)** để che giấu lỗi type mismatch hay bỏ qua trình kiểm tra kiểu của TypeScript.
  * **Đối với Legacy `any` ngoài phạm vi Phase hiện tại**: Giữ nguyên trạng thái để bảo vệ tính ổn định của hệ thống chuyển tiếp, ghi nhận vào mục *Known Baseline Issues*, tuyệt đối không tự ý refactor diện rộng toàn hệ thống khi chưa tới Phase tương ứng.
  * **Khi xử lý module thuộc Phase hiện tại**: Bắt buộc ưu tiên sử dụng `unknown` kèm type guards, kiểu dữ liệu suy luận từ Zod (`z.infer`), và kiểu dữ liệu sinh tự động từ Prisma Client (`Prisma.*GetPayload`, model interfaces).
* Xử lý tường minh các trường hợp `null` và `undefined`.

## 6. Tiêu chuẩn Quản lý UUID (`src/utils/uuid.ts`)
* Các entity đã migration sang PostgreSQL dùng khóa chính UUID v4/v5.
* Luôn tái sử dụng các hàm đã kiểm thử trong `src/utils/uuid.ts`:
  * `isValidUUID(value: unknown): boolean`: Kiểm tra chuỗi UUID hợp lệ theo chuẩn RFC 4122.
  * `normalizeUUID(value: unknown, fieldName?: string): string`: Chuẩn hóa UUID về chữ thường và cắt khoảng trắng.
  * `validateUUIDParam: CustomValidator`: Dùng trong Express Validator chains.
  * `validateRouteUUIDParam(paramName?: string)`: Middleware chain tạo sẵn cho route params.
  * `withCompatId<T>(entity: T)`: Decorator tự động bổ sung alias `_id = id` cho response.
* Tuyệt đối không tạo file tiện ích UUID thứ hai trong dự án.

## 7. Xử lý Lỗi & Ánh xạ Mã lỗi Prisma (`src/utils/prismaError.ts`)
* Khi Repository hoặc Service bắt được lỗi từ database, sử dụng tiện ích `mapPrismaError(error)` để chuyển đổi sang HTTP status code và thông điệp an toàn cho client:
  * `P2002` (Unique constraint violation) -> `409 Conflict` kèm thông tin trường bị trùng.
  * `P2003` (Foreign key violation) -> `400 Bad Request` thông báo liên kết không tồn tại.
  * `P2025` (Record not found) -> `404 Not Found`.
  * `P2000` (Value too long) -> `400 Bad Request`.
  * `P2006` (Invalid field value) -> `400 Bad Request`.
  * `PrismaClientValidationError` -> `400 Bad Request`.
  * `PrismaClientInitializationError` -> `503 Service Unavailable`.
* Không để lộ chi tiết database URL, database password, tên bảng vật lý hoặc raw SQL query trong error response trả về cho client.

## 8. Serialization, Xử lý Prisma Decimal & Tương thích `_id`
* **Prisma Decimal**: Các trường số học tiền tệ (ví dụ: `price`, `oldPrice`, `discountAmount`) trong Prisma có kiểu `Decimal`. Cần serialize về `number` (sử dụng `Number(val)`) khi trả về API response để bảo toàn đúng định dạng JSON mà client mong đợi.
* **Tương thích `_id`**: Frontend cũ phụ thuộc vào trường `_id` của MongoDB. Đối với các response chi tiết entity hoặc danh sách entity, sử dụng `withCompatId()` để đồng thời cung cấp cả `id` và `_id` với cùng một giá trị UUID.

## 9. Quy tắc Thống nhất Kiến trúc Toàn cầu & Tích hợp Model (Global Architecture Consistency & Model Integration Rules)

These rules apply to ALL current and future development tasks, migration phases, and modules unless the project owner explicitly approves an exception.

### 9.1. Reuse Existing Architecture

Before implementing any new feature or module, inspect the existing project structure and relevant implementation.

You MUST:

* Reuse existing Application Models when appropriate.
* Reuse existing DTOs, Mappers and Serializers when appropriate.
* Reuse existing Functional Repository patterns.
* Reuse existing Service patterns.
* Reuse existing validation utilities and middleware.
* Reuse existing shared types and helpers.
* Follow the established architecture and naming conventions.

Do not create duplicate Models, Types, DTOs, Validators, Mappers, Utilities or abstractions when an appropriate implementation already exists.

### 9.2. Model Integration Is Mandatory

Whenever implementing a new module or modifying an existing module:

* Identify which existing Models are relevant.
* Use Zod Application Models for appropriate application data structures and Runtime Validation boundaries.
* Use Prisma-generated types for PostgreSQL database operations.
* Keep Mongoose Legacy Models isolated to modules that still use MongoDB.
* Use existing DTOs/Mappers/Serializers where applicable.
* Do not create Model files without a clear responsibility and actual usage.

Do not force every Model to be imported or runtime-parsed in every layer.

### 9.3. Architecture Consistency

All new or modified code MUST follow the established architecture:

Router
→ Middleware
→ Controller
→ Service
→ Functional Repository
→ Prisma Client
→ PostgreSQL

Responsibilities:

* Middleware: HTTP-level authentication, parsing and syntactic validation.
* Controller: HTTP Request/Response handling.
* Service: business logic, authorization and business validation.
* Repository: database access only.
* Mapper/Serializer: explicit data transformation when required.

Do not move business logic into Controller, Middleware or Repository.

### 9.4. Pre-Implementation Architecture Audit

Before implementing a new feature or module:

1. Inspect relevant existing Models.
2. Inspect related Repository and Service implementations.
3. Inspect existing DTOs, Mappers and Validators.
4. Identify reusable code.
5. Identify architectural inconsistencies that directly affect the task.
6. Report the intended changes and scope.

Avoid broad refactoring unrelated to the current task.

### 9.5. Post-Implementation Consistency Audit

After implementation:

* Check whether existing Models were reused correctly.
* Check whether unnecessary duplicate files were introduced.
* Check whether new Models are actually integrated.
* Check TypeScript type safety.
* Check API Contract compatibility.
* Check whether the module follows the established architecture.
* Report remaining technical debt and unresolved inconsistencies.

### 9.6. No Automatic Architecture Expansion

Do not introduce a new architecture, abstraction, framework, ORM pattern or validation strategy without a clear technical reason and project-owner approval.

When an existing architecture is insufficient, explain the problem and propose a change before implementing it.

### 9.7. Scope and Approval

These global rules do not authorize changes outside the scope of the current task or approved migration phase.

All existing API Contract Freeze, database safety, migration boundaries, testing requirements and approval gates remain in effect.

When instructions conflict, follow the project's documented precedence rules and ask the project owner when the conflict cannot be resolved safely.

## 10. Quy tắc Bắt buộc Tái sử dụng & Tích hợp Model (Mandatory Existing Model Reuse & Integration Rules)

This is a mandatory rule for ALL new features, existing feature modifications, and refactoring tasks.

The project already contains a collection of Zod Application Models under `src/models/`.

These Models are existing architectural components, not standalone documentation or unused schema definitions.

Whenever implementing a new feature or modifying an existing module, AI MUST follow these rules:

### 10.1. Existing Model First

Before creating any new interface, type, schema, or data structure:

* Inspect the relevant existing Zod Application Models.
* Identify the Model corresponding to the entity being implemented.
* Reuse the existing Model and its inferred TypeScript types whenever appropriate.
* Do not independently redefine types that already exist in the corresponding Model.
* Do not create duplicate schemas or interfaces merely for convenience.

Examples:

* User-related functionality → inspect and reuse `user.model.ts`.
* Category-related functionality → inspect and reuse `category.model.ts`.
* Course-related functionality → inspect and reuse `course.model.ts`.
* Lesson-related functionality → inspect and reuse `lesson.model.ts`.
* Quiz-related functionality → inspect and reuse `quiz.model.ts`.

These are examples, not an exhaustive list.

### 10.2. Model Integration Across Architecture Layers

When implementing a feature, use the existing Model-derived types and validation schemas in the appropriate layers:

* Middleware / Validator: reuse Zod schemas for Runtime Validation when appropriate.
* Controller: use the established typed request and response contracts.
* Service: reuse Application Types inferred from the existing Zod Models.
* Repository: use Prisma-generated types for PostgreSQL database operations and query payloads.
* Mapper / Serializer: use explicit typed mappings between Prisma data and Application/API data when required.

Do not force every layer to import Zod directly.

The purpose is to maintain a consistent data contract across the application, not to introduce unnecessary imports or repeated validation.

### 10.3. No Parallel Model or Type Definitions

Before defining a new:

* Interface
* Type alias
* Zod schema
* DTO
* Data structure

Check whether an equivalent definition already exists.

If it exists, reuse or extend the existing definition when appropriate.

If a new definition is genuinely necessary, explain why the existing Model cannot satisfy the requirement.

Do not use `any`, duplicate interfaces, or local type definitions to bypass existing Application Models.

### 10.4. Existing Model Integration Is Part of Feature Completion

A feature is not considered architecturally complete merely because its API works.

After implementation, verify:

* Existing Models were inspected.
* Relevant Models were reused.
* Model-derived types are used in appropriate application layers.
* Prisma-generated types are used for database operations.
* No unnecessary duplicate data structures were introduced.
* Newly created Models are actually integrated into the feature.
* No existing Model was bypassed without a documented technical reason.

### 10.5. Exception Handling

If an existing Model does not represent the actual requirements:

* Explain the mismatch.
* Propose the necessary extension or modification.
* Preserve existing functionality and API compatibility.
* Do not silently create a competing Model.
* Do not change shared Models in a way that breaks other modules.

Any architectural exception must be documented in the implementation report.

### 10.6. Mandatory Pre-Implementation and Post-Implementation Checks

Before coding, identify the existing Models and types relevant to the task.

After coding, report:

* Models reused.
* Model-derived types used.
* Validation schemas reused.
* Prisma types used.
* New definitions created and their justification.
* Existing Models not used and the reason.

This requirement applies automatically to future development tasks and does not need to be repeated in individual user prompts.

All existing AGENTS.md rules, API Contract Freeze, Functional Repository Architecture, Database Safety Rules, and Phase Approval Gates remain in effect.

---

# D. ĐÓNG BĂNG API CONTRACT & TƯƠNG THÍCH NGƯỢC (API CONTRACT & BACKWARD COMPATIBILITY)

## 1. Nguyên tắc Đóng băng Tuyệt đối (Absolute API Contract Freeze)
Migration là việc thay thế động cơ lưu trữ bên dưới, không được làm thay đổi giao diện lập trình bên ngoài. Các yếu tố sau đây bị đóng băng 100%:
* **Endpoint URL**: Giữ nguyên toàn bộ đường dẫn (ví dụ: `/api/users/login`, `/api/courses/teacher/:id`).
* **HTTP Method**: Không đổi `GET` thành `POST`, không đổi `PUT` thành `PATCH` và ngược lại.
* **Request Payload**: Giữ nguyên tên trường, định dạng dữ liệu (kể cả các trường legacy snake_case như `intro_url`, `old_price`).
* **Query & Route Parameters**: Giữ nguyên tên query (`page`, `limit`, `category`, `sort`).
* **Response JSON Structure**: Giữ nguyên cấu trúc JSON bao ngoài (ví dụ: `{ success, message, data }` hoặc cấu trúc response cũ tương ứng).
* **HTTP Status Codes**: Mã lỗi 400, 401, 403, 404, 409, 500 phải được trả về đúng trong các tình huống tương đương với hành vi cũ.
* **Error Response Format**: Giữ nguyên định dạng lỗi trả về chuẩn `{ message, errors }` do `handleValidationErrors` hoặc `errorHandler` sinh ra.

## 2. Legacy Request DTO Mapping
Khi Request Body từ client chứa các trường theo quy ước MongoDB cũ (ví dụ: `category` mang ID của danh mục, `intro_url` dạng snake_case), Controller hoặc Service có trách nhiệm chuyển đổi (mapping) có định kiểu rõ ràng sang Application Model:
```typescript
// Ví dụ mapping tường minh tại Service boundary
const createCoursePayload = {
  title: input.title,
  categoryId: input.category, // Ánh xạ từ legacy field 'category' sang 'categoryId'
  introUrl: input.intro_url,  // Ánh xạ từ legacy field 'intro_url' sang 'introUrl'
  oldPrice: input.old_price !== undefined ? Number(input.old_price) : undefined,
  price: Number(input.price),
  authorId: currentUserId
}
```
Tuyệt đối không bắt client phải sửa request body để khớp với tên cột của PostgreSQL.

## 3. Postman Collection – Thước đo Regression Baseline duy nhất
* Postman Collection hiện hữu trong dự án là **tiêu chuẩn vàng (Golden Baseline)** để kiểm chứng hồi quy toàn bộ hệ thống API.
* **Những thay đổi ĐƯỢC PHÉP trên Postman**:
  * Thay thế các giá trị ObjectId mẫu thành UUID tương ứng của dữ liệu đã migrate.
  * Cập nhật biến môi trường (`{{baseUrl}}`, `{{token}}`, `{{courseId}}`).
* **Những hành vi BỊ NGHIÊM CẤM trên Postman**:
  * Không được xóa bớt test case.
  * Không được sửa đổi các câu lệnh test assertions (ví dụ: sửa assertion mong đợi mã lỗi 400 thành 404 chỉ để test pass).
  * Không viết lại collection theo một cấu trúc API mới.

## 4. Xử lý khi phát hiện Bug hoặc Điểm bất hợp lý trong API cũ (Escalation Protocol)
Nếu trong quá trình audit hoặc implementation phát hiện API cũ có lỗi logic, validation lỏng lẻo hoặc không tương thích tự nhiên với PostgreSQL:
1. Ghi nhận chi tiết vào mục *Known Issues & Discrepancies* trong Audit Report của Phase.
2. Mô tả rõ: Hành vi cũ, hành vi mới đề xuất, nguyên nhân kỹ thuật, ảnh hưởng tới Frontend.
3. Giữ nguyên hành vi tương thích cao nhất có thể trong code.
4. Báo cáo chủ dự án và chờ văn bản chấp thuận trước khi thay đổi bất kỳ hành vi nào.

---

# E. TIÊU CHUẨN VALIDATION & MIDDLEWARE (VALIDATION & MIDDLEWARE STANDARDS)

## 1. Phân định rõ ràng: Express Validator vs Zod vs Service vs Repository

| Thành phần | Tầng phụ trách | Nhiệm vụ chính | Những gì KHÔNG ĐƯỢC làm |
| :--- | :--- | :--- | :--- |
| **Express Validator** | HTTP Transport / Middleware (`src/middlewares/`) | • Kiểm tra cú pháp request (cấu trúc, độ dài chuỗi, định dạng email, url, numeric, enum).<br>• Kiểm tra cú pháp UUID (`validateUUIDParam`).<br>• Kiểm tra required/optional và cross-field request syntax. | • **Tuyệt đối KHÔNG gọi database** (không truy vấn Prisma hay Mongoose).<br>• Không thực hiện business logic.<br>• Không kiểm tra ownership. |
| **Zod Models** | Application Domain (`src/models/*.model.ts`) | • Single source of truth cho cấu trúc Application Data.<br>• Sinh kiểu TypeScript (`z.infer`).<br>• Schema parsing (`safeParse`) tại các ranh giới Service input/output. | • Không thay thế Express Validator tại HTTP pipeline.<br>• Không dùng làm Prisma Select.<br>• Không bọc `.parse()` vô tội vạ tại mọi dòng code. |
| **Service** | Application Business (`src/services/`) | • Kiểm tra điều kiện nghiệp vụ.<br>• Kiểm tra sự tồn tại (existence) và tính duy nhất (uniqueness) qua Repository.<br>• Kiểm tra quyền sở hữu (ownership) và phân quyền nghiệp vụ.<br>• Điều phối transaction. | • Không phụ thuộc trực tiếp vào Express `req` và `res`.<br>• Không trả response trực tiếp cho client. |
| **Functional Repository** | Data Access (`src/repositories/`) | • Thực thi truy vấn PostgreSQL qua Prisma Client.<br>• Quản lý Prisma Select projections và Prisma relations. | • Không chứa validation cú pháp HTTP.<br>• Không chứa business rules hoặc quyết định nghiệp vụ. |

## 2. Khung phân loại & Ranh giới Tích hợp Zod (Zod Integration 5-Tier Framework & Boundaries)
Mọi file trong `src/models/*.model.ts` khi được audit phải được xếp vào một trong 5 mức độ:
1. **`Runtime Validation`**: Schema được sử dụng trực tiếp để validate dữ liệu tại ranh giới Service bằng `.parse()` hoặc `.safeParse()`.
2. **`Type-only Usage`**: File chỉ xuất các kiểu dữ liệu suy luận thông qua `z.infer` phục vụ type checking của TypeScript.
3. **`Imported but Unused`**: Schema hoặc type được import vào mã nguồn nhưng không có lời gọi thực tế (cần dọn dẹp).
4. **`Defined but Not Integrated`**: Schema đã được định nghĩa đầy đủ nhưng chưa tới Phase tích hợp vào Service (phải ghi nhận lý do và kế hoạch tích hợp).
5. **`Not Applicable`**: Các model Mongoose cũ của các module chưa migration (Phases 4–10) được bảo lưu nguyên trạng.

**Quy tắc xác định ranh giới (Boundary Validation Rules)**:
* **Tính hợp lệ của việc phân loại**: Cả `Runtime Validation` và `Type-only Usage` đều hoàn toàn hợp lệ tùy theo bối cảnh kỹ thuật cụ thể của từng module.
* **Không lạm dụng `.parse()`**: Không bắt buộc phải bọc `.parse()` ở tất cả các tầng một cách cơ học. Việc này gây lãng phí hiệu năng và làm rối mã nguồn không cần thiết.
* **Ranh giới trách nhiệm rõ ràng (Single Boundary Responsibility)**: Mỗi ranh giới input/output của Application phải có trách nhiệm validation rành mạch:
  * HTTP Transport input: Express Validator chịu trách nhiệm cú pháp.
  * Service Application boundary: Zod `safeParse()` kiểm tra tính hợp lệ của dữ liệu nghiệp vụ tổng hợp trước khi xử lý, hoặc Zod `parse()` kiểm tra cấu trúc dữ liệu trả về từ Repository.
* **Không validate lặp lại (No Redundant Validation)**: Tuyệt đối không validate lại dữ liệu cùng một điều kiện khi tầng trước đó đã bảo đảm tính toàn vẹn, trừ khi có chuyển đổi hình dạng dữ liệu (transformation/mapping).
* **Minh bạch mục đích Schema**: Không để bất kỳ schema nào được định nghĩa mà không có mục đích sử dụng rõ ràng. Nếu định nghĩa trước cho các phase sau, phải ghi nhận trạng thái là `Defined but Not Integrated` kèm lý do.
> Không ép thay đổi toàn bộ source code trong nhiệm vụ chuẩn hóa tài liệu này.

## 3. Nghiêm cấm Database Lookups trong Express Validator
* Không sử dụng `.custom(async (value) => { ... })` bên trong Express Validator để truy vấn database kiểm tra email đã tồn tại, user có tồn tại hay không, category có tồn tại hay không.
* Toàn bộ việc kiểm tra trùng lặp và kiểm tra sự tồn tại phải được đưa vào **Service**, sử dụng các hàm đọc từ **Functional Repository**.

## 4. Quản lý Middleware Xác thực (Authentication & Authorization)
* **Authentication Pipeline (`verifyAccessToken`, `verifyRefreshToken`)**:
  * Nằm tại tầng HTTP Middleware để trích xuất và xác thực chữ ký JWT.
  * Nếu quá trình xác thực cần nạp thông tin User từ database: Middleware phải gọi qua hàm Service (ví dụ: `findUserByIdService`), Service điều phối Repository. **Không gọi Prisma Client trực tiếp trong middleware**.
  * Không trả các thông tin nhạy cảm (`password`, `otpCode`, `refreshToken`) vào `req.user`.
* **Authorization & Ownership Checks**:
  * Phân quyền Role đơn giản dựa trên thông tin có sẵn trong token (`req.user.role`) có thể kiểm tra tại middleware `checkRole(['ADMIN', 'EXPERT'])`.
  * Các kiểm tra quyền sở hữu tài nguyên phức tạp (ví dụ: "Giảng viên này có phải là tác giả của khóa học này không?", "Học viên này đã mua khóa học này chưa?") **bắt buộc phải nằm ở Service layer**.

## 5. Quy tắc Chuyển dịch Middleware theo từng Phase
* Chỉ di chuyển middleware và validators thuộc phạm vi của Phase hiện tại.
* **Đối với module đã migration**:
  * Thay thế toàn bộ `mongoose.Types.ObjectId.isValid` và `.isMongoId()` bằng `validateUUIDParam` hoặc `isValidUUID` từ `src/utils/uuid.ts`.
  * Loại bỏ hoàn toàn `import mongoose from 'mongoose'`.
* **Đối với module chưa migration**:
  * Giữ nguyên vẹn validators dùng Mongoose ObjectId để đảm bảo các route chuyển tiếp vẫn hoạt động bình thường trên MongoDB.

---

# F. TIÊU CHUẨN DATABASE & MIGRATION DỮ LIỆU (DATABASE & MIGRATION STANDARDS)

## 1. Single Source of Truth cho Cấu trúc Vật lý
* `prisma/schema.prisma` là nguồn chân lý duy nhất cho cấu trúc bảng, tên cột, khóa chính, khóa ngoại, chỉ mục (indexes), quan hệ và kiểu enums trên PostgreSQL.
* Nghiêm cấm tự ý tạo migrations hoặc chỉnh sửa schema bằng tay mà không có sự đồng thuận từ chủ dự án.

## 2. Tiêu chuẩn Khóa Phức hợp (Compound Unique Keys)
Khi truy vấn hoặc cập nhật các entity có khóa phức hợp trong Prisma, bắt buộc sử dụng đúng cú pháp compound selector do Prisma sinh ra:
* `MessageRead`: `@@id([messageId, userId])` -> `where: { messageId_userId: { messageId, userId } }`
* `ConversationParticipant`: `@@id([conversationId, userId])` -> `where: { conversationId_userId: { conversationId, userId } }`
* `CouponCourse`: `@@id([couponId, courseId])` -> `where: { couponId_courseId: { couponId, courseId } }`
* `Enrollment`: `@@id([userId, courseId])` -> `where: { userId_courseId: { userId, courseId } }`
* `Progress`: `@@id([userId, lessonId])` -> `where: { userId_lessonId: { userId, lessonId } }`
* `Certificate`: `@@id([userId, courseId])` -> `where: { userId_courseId: { userId, courseId } }`
* `Rating`: `@@id([userId, courseId])` -> `where: { userId_courseId: { userId, courseId } }`
* `FavoriteCourse`: `@@id([userId, courseId])` -> `where: { userId_courseId: { userId, courseId } }`
* `QuizSubmission`: `@@id([quizId, userId])` -> `where: { quizId_userId: { quizId, userId } }`
* `CommentReaction`: `@@id([commentId, userId])` -> `where: { commentId_userId: { commentId, userId } }`
* `Lesson`: `@@unique([slug, courseId])` -> `where: { slug_courseId: { slug, courseId } }`

## 3. Bản đồ UUID v5 Chuẩn hóa (Deterministic UUID Mapping)
* Toàn bộ dữ liệu migrate từ MongoDB sang PostgreSQL sử dụng UUID v5 sinh theo thuật toán canonical deterministic:
  * **File định nghĩa**: `scripts/migration-utils/id-mapper.ts`.
  * **Namespace UUID v5**: `7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c`.
  * Định dạng canonical key: `<entity_name>:<mongo_object_id>`.
* Khi viết test cases hoặc ánh xạ dữ liệu, bắt buộc sử dụng helper `toPostgresId(entityName, mongoId)` từ module này. Tuyệt đối không sinh ngẫu nhiên UUID mới cho dữ liệu đã migrate.

## 4. Bảo tồn các Ngoại lệ Lịch sử (Historical Data Exceptions)
Các ngoại lệ sau đây đã được kiểm thử và xác nhận bảo toàn trong quá trình Data Migration, nghiêm cấm tự ý xóa bỏ:
1. **3 Orphan Orders**: Giữ nguyên trạng thái `courseId = NULL` do khóa học gốc trong dữ liệu cũ đã bị xóa.
2. **5 Dangling Polymorphic Notification References**: Giữ nguyên các tham chiếu thông báo lịch sử trỏ tới tài nguyên không còn tồn tại.
3. **Approximate Historical Timestamps**: Giữ nguyên các mốc thời gian ước lượng đối với dữ liệu cũ không có `createdAt` / `updatedAt` chi tiết.

## 5. Chiến lược Ngừng sử dụng Mongoose (Mongoose Decommission Strategy)
* Mongoose được loại bỏ theo phương pháp cuốn chiếu (phased decommissioning).
* Một Mongoose model chỉ được chuyển thành Zod model khi Phase tương ứng được triển khai.
* Thư mục `src/models/legacy/` được sử dụng để lưu trữ tạm thời các Mongoose schema cũ nếu cần tham chiếu hoặc duy trì hoạt động cho các module chưa migrate.
* **Toàn bộ Mongoose connection, Mongoose package và các legacy models sẽ chỉ được dọn dẹp triệt để tại Phase 11** sau khi 100% module nghiệp vụ đã chạy thành công trên PostgreSQL và vượt qua bài kiểm tra toàn diện.

## 6. Phân hệ Ngoại vi & Non-HTTP Dependencies
Khi migrate một entity, phải rà soát toàn bộ các thành phần phụ thuộc ngoài HTTP Request/Response:
* **Socket.IO**: Các sự kiện realtime liên quan đến Chat (`conversation`, `message`) và Notification.
* **Cron Jobs**: Các tác vụ quét định kỳ (kiểm tra hạn coupon, tự động hủy đơn hàng chưa thanh toán).
* **Background Tasks**: Gửi mail xác nhận qua NodeMailer, sinh chứng chỉ PDF qua PDFGenerator.

---

# G. TIÊU CHUẨN KIỂM THỬ & CHẤT LƯỢNG (TESTING & QUALITY STANDARDS)

Mỗi Phase bắt buộc phải có đầy đủ bộ kiểm thử chứng minh tính đúng đắn trước khi nghiệm thu.

## 1. Kim tự tháp Kiểm thử (Testing Pyramid)
1. **TypeScript Type Check**: Chạy `npx tsc --noEmit` đạt 0 lỗi biên dịch.
2. **Unit Tests & Model Tests**: Kiểm thử các Zod Application Models, bảo đảm parsing đúng dữ liệu hợp lệ và từ chối dữ liệu sai lệch.
3. **Repository Tests**: Kiểm thử các hàm Functional Repository với database thực tế (thao tác CRUD, select projections, compound unique constraints, transaction rollback).
4. **Service Tests**: Kiểm thử Business Logic, tính toán tiền tệ, xử lý ngoại lệ nghiệp vụ.
5. **API Integration & Regression Tests**: Chạy Postman Collection hoặc Supertest trên các route đã migrate để bảo đảm giữ nguyên API contract và HTTP status codes.

## 2. Tiêu chuẩn Báo cáo Kết quả Kiểm thử
Khi báo cáo kết quả kiểm thử, bắt buộc phải phân định minh bạch 3 nguồn kiểm thử:
* **Automated Tests**: Các bài test tự động do AI trực tiếp chạy qua CLI (ghi rõ số lượng PASS/FAIL và thời gian thực thi).
* **Postman Integration Tests**: Kết quả chạy thực tế từ Postman Runner hoặc Newman (chỉ ghi PASS khi đã thực sự chạy).
* **Manual Verification**: Các trường hợp cần chủ dự án xác nhận trực tiếp trên giao diện Frontend hoặc công cụ quản trị.
> Tuyệt đối không được khai báo "PASS" trên các bài test chưa được thực thi.

## 3. Phân biệt Lỗi Baseline (Baseline Errors) và Lỗi Hồi quy (Regression Errors)
* **Lỗi Baseline (Legacy Baseline Errors)**: Lỗi vốn đã tồn tại trong mã nguồn MongoDB cũ từ trước khi migration (ví dụ: route thiếu validator, bug logic cũ). Cần ghi nhận vào mục *Known Baseline Issues* và báo cáo chủ dự án, không tự ý sửa đổi ngoài phạm vi.
* **Lỗi Hồi quy (Regression Errors)**: Lỗi phát sinh do quá trình chuyển đổi sang Prisma (sai lệch kiểu dữ liệu, thiếu trường response, sai status code, P2002 không được bắt). **Bắt buộc phải sửa triệt để 100% lỗi hồi quy trước khi kết thúc Phase**.

---

# H. QUY TRÌNH THỰC HIỆN PHASE & CỔNG PHÊ DUYỆT (MIGRATION WORKFLOW)

Mỗi Phase migration bắt buộc phải tuân thủ nghiêm ngặt quy trình chuẩn 7 bước (Standard 7-Step Phase Lifecycle). Tuyệt đối không được bỏ qua hoặc đảo lộn thứ tự các bước:

```text
[Step 1: Pre-Migration Audit]
        │
        ▼
[Step 2: Audit Report Creation]
        │
        ▼
[Step 3: CỔNG PHÊ DUYỆT 1 - Chủ dự án Review & Phê duyệt] ──(DỪNG & CHỜ)──┐
                                                                           │ (Được duyệt)
                                                                           ▼
                                                             [Step 4: Implementation]
                                                                           │
                                                                           ▼
                                                             [Step 5: Testing & Validation]
                                                                           │
                                                                           ▼
                                                             [Step 6: Implementation Report]
                                                                           │
                                                                           ▼
[Step 7: CỔNG PHÊ DUYỆT 2 - Nghiệm thu Phase] ───────────────(DỪNG & CHỜ KẾT THÚC)
```

## Step 1: Pre-Migration Audit (Chỉ đọc & Phân tích)
* Nghiêm cấm sửa đổi code trong bước này.
* Đọc kỹ: `AGENTS.md`, ADRs liên quan, Prisma schema, source code các file liên quan (routes, middlewares, controllers, services, repositories, models, utilities).
* Xác định toàn bộ dependency graph, các câu truy vấn Mongoose cũ cần thay thế, các API endpoints bị ảnh hưởng và các rủi ro tiềm ẩn.

## Step 2: Lập Audit Report (Báo cáo Tiền triển khai)
Tạo file báo cáo chi tiết đặt tại: `docs/migration/phase-XX-.../step-00-pre-implementation-audit-report.md` (hoặc `audit-report.md`) bao gồm:
* Hiện trạng kiến trúc và luồng dữ liệu cũ.
* Danh sách chi tiết các file dự kiến thêm mới, sửa đổi hoặc lưu trữ legacy.
* Kế hoạch chuyển đổi Mongoose -> Functional Repository + Prisma.
* Kế hoạch Application Model (Zod) và Express Validator.
* Ma trận kiểm tra API Contract.
* Danh mục rủi ro kỹ thuật (Risk Register).
* Kế hoạch kiểm thử chi tiết.

## Step 3: Cổng Phê duyệt 1 (Owner Review Gate)
* **DỪNG LẠI HOÀN TOÀN**.
* Trình bày tóm tắt kết quả audit cho chủ dự án.
* Chờ chủ dự án xem xét và phản hồi chấp thuận bằng văn bản mới được chuyển sang Step 4.

## Step 4: Triển khai Code (Implementation)
* Chỉ sửa đổi trong phạm vi các file đã được duyệt ở Step 2.
* Triển khai tuần tự:
  1. Zod Application Models tại `src/models/`.
  2. Functional Repository tại `src/repositories/`.
  3. Service Layer tại `src/services/`.
  4. Middleware & Express Validators tại `src/middlewares/`.
  5. Controller & Route adjustments nếu cần thiết để duy trì API Contract.
* Áp dụng nghiêm ngặt các quy tắc tại Mục C, D, E, F.

## Step 5: Kiểm thử Toàn diện (Testing & Verification)
* Chạy TypeScript type checking (`tsc --noEmit`).
* Chạy các bài test tự động cho Repository, Service và Model.
* Thực hiện API regression test với Postman collection.
* Xác minh tính nguyên vẹn của dữ liệu và transaction rollback.

## Step 6: Lập Implementation Report (Báo cáo Nghiệm thu Kỹ thuật)
Tạo báo cáo tổng kết chi tiết tại thư mục của Phase, bao gồm:
* Danh sách chính xác các file đã tạo, sửa đổi hoặc xóa.
* Chi tiết các câu truy vấn Mongoose đã được loại bỏ hoàn toàn khỏi module.
* Minh chứng kết quả kiểm thử (test logs, số lượng test cases PASS).
* Xác nhận tính tương thích 100% của API Contract.
* Ghi nhận các điểm hạn chế đã biết (Known Limitations) và các việc cần lưu ý cho Phase sau.

## Step 7: Cổng Phê duyệt 2 (Phase Completion Approval Gate)
* **DỪNG LẠI VÀ BÁO CÁO KẾT THÚC**.
* Không tự ý bắt đầu Step 1 của Phase tiếp theo.
* Đợi chỉ đạo tiếp theo từ chủ dự án.

---

# I. TIÊU CHUẨN TÀI LIỆU & BÁO CÁO (DOCUMENTATION & REPORTING)

## 1. Hệ thống Thứ bậc Ưu tiên của Tài liệu (Documentation Precedence Hierarchy)
Khi phát sinh sự không nhất quán giữa các nguồn thông tin trong workspace, thứ tự ưu tiên áp dụng bắt buộc theo thứ bậc nghiêm ngặt sau:
1. **Chỉ thị trực tiếp mới nhất của Chủ dự án** (ưu tiên tối thượng trong mọi tình huống).
2. **Quyết định kiến trúc đã được phê duyệt (ADRs / Approved Architectural Decisions)** tại `docs/architecture/` (tránh trường hợp quy tắc chung vô tình làm thay đổi thiết kế chuyên sâu đã được chốt).
3. **Quy tắc chung trong `AGENTS.md`** (tài liệu này – khung quy chuẩn kỹ thuật nền tảng cho phát triển và migration).
4. **Postman Collection hiện hành**: Tiêu chuẩn vàng (Golden Baseline) duy nhất cho API Contract (endpoint, payload, status code, response schema).
5. **Prisma Schema (`prisma/schema.prisma`)**: Nguồn chân lý duy nhất cho cấu trúc vật lý cơ sở dữ liệu PostgreSQL (physical database structure). **Tuyệt đối không được dùng Prisma Schema để ghi đè API Contract hoặc các quyết định kiến trúc đã phê duyệt**.
6. **Mã nguồn hiện tại (Current Source Code)**: Nguồn tham chiếu hành vi nghiệp vụ thực tế (actual implementation behavior) của hệ thống trong giai đoạn chuyển tiếp.
7. **Báo cáo lịch sử của các Phase trước** tại `docs/migration/`.

## 2. Quy chuẩn Lưu trữ Hồ sơ Migration
Toàn bộ tài liệu báo cáo của từng Phase phải được lưu trữ ngăn nắp theo cấu trúc thư mục chuẩn:
```text
docs/
├── architecture/
│   └── application-model-design.md
└── migration/
    ├── agents-rules-audit-report.md
    ├── zod-application-model-audit.md
    ├── phase-02-user-category-auth/
    │   ├── audit-report.md
    │   ├── implementation-report.md
    │   ├── api-contract-audit.md
    │   ├── dependency-map.md
    │   └── risk-register.md
    └── phase-03-course-chapter-lesson/
        ├── step-00-pre-implementation-audit-report.md
        ├── step-01-legacy-zod-report.md
        ├── step-02-repository-report.md
        ├── step-03-services-report.md
        └── step-04-middleware-report.md
```

## 3. Quy tắc Biên soạn Báo cáo
* Báo cáo phải trung thực, phản ánh chính xác kết quả đo đạc từ mã nguồn và test runner.
* Luôn đính kèm đường dẫn liên kết dạng markdown đến các file mã nguồn và tài liệu tham chiếu liên quan.
* Ghi rõ thời gian thực hiện, trạng thái nghiệm thu và các câu lệnh đã chạy để kiểm chứng.

---

# PHỤ LỤC: DANH MỤC THAM CHIẾU BASELINE THEO MODULE (MODULE BASELINES)

Phụ lục này lưu trữ thông tin tham chiếu kỹ thuật cho các module đã và đang thực hiện migration, giúp các tác vụ kế tiếp dễ dàng đối soát mà không làm loãng cấu trúc quy tắc chung.

## Phụ lục 1: Module User & Authentication (Phase 2 Baseline)
* **Endpoints hiện hữu**:
  * `POST /api/users/register`: Đăng ký tài khoản người dùng mới.
  * `POST /api/users/verify-otp`: Xác thực mã OTP kích hoạt tài khoản.
  * `POST /api/users/login`: Đăng nhập, cấp Access Token & Refresh Token.
  * `GET  /api/users/me`: Lấy thông tin tài khoản hiện hành.
  * `POST /api/users/logout`: Đăng xuất và thu hồi Refresh Token.
  * `POST /api/users/forgot-password`: Yêu cầu gửi link/mã đặt lại mật khẩu.
  * `PUT  /api/users/reset-password`: Đặt lại mật khẩu mới bằng reset token.
  * `PUT  /api/users/update-me`: Cập nhật thông tin cá nhân cơ bản.
  * `PUT  /api/users/change-password`: Đổi mật khẩu tài khoản đang đăng nhập.
  * `GET  /api/users/profile/:id`: Xem hồ sơ công khai của người dùng (chú ý: sử dụng `getUserDetailValidator` từ `admin.middleware.ts`).
  * `GET  /api/users/teachers`: Lấy danh sách giảng viên.
  * `POST /api/users/access_token`: Cấp lại Access Token mới từ Refresh Token.
* **Các Validator xuất phát từ `user.middleware.ts`**:
  * `registerValidator`, `verifyOtpValidator`, `loginValidator`, `forgotPasswordValidator`, `resetPasswordValidator`, `changePasswordValidator`, `updateMeValidator`, `listTeachersValidator`, `userIdValidator`, `refreshTokenValidator`.

## Phụ lục 2: Module Course, Chapter & Lesson (Phase 3 Baseline)
* **Entities**: `Course`, `Chapter`, `Lesson`.
* **Middlewares & Validators đã migrate sang UUID**:
  * `course.middleware.ts`: `courseIdValidator`, `createCourseValidator`, `listPublicCoursesValidator`, `updateCourseValidator`, `updateCourseByAdminValidator`, `updateCourseStatusValidator`.
  * `chapter.middleware.ts`: `createChapterValidator`, `updateChapterValidator`, `chapterIdValidator`.
  * `lesson.middleware.ts`: `createLessonValidator`, `updateLessonValidator`, `chapterIdValidator`, `lessonIdValidator`.
* **Sửa lỗi định tuyến từ Step 0 Audit**:
  * `DELETE /api/chapters/:id`: Gắn `chapterIdValidator` (thay vì `courseIdValidator`).
  * `DELETE /api/lessons/:id`: Gắn `lessonIdValidator` (thay vì `chapterIdValidator`).
  * `PATCH /api/admin/courses/teacher/:id`: Gắn `updateCourseStatusValidator` (thay vì `listPublicCoursesValidator`).