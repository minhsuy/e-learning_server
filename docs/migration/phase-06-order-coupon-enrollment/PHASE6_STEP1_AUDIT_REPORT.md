  # BÁO CÁO AUDIT TOÀN DIỆN TRƯỚC TRIỂN KHAI — PHASE 6: ORDER, COUPON & ENROLLMENT

  > **Dự án**: TMDEMY E-Learning Backend  
  > **Giai đoạn**: Phase 6 — Order, Coupon & Enrollment Migration  
  > **Bước**: Step 1 — Pre-Implementation Audit (READ-ONLY)  
  > **Ngày thực hiện**: 2026-10-04  
  > **Target Database**: PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
  > **Source Database**: MongoDB Atlas (`e-learning`) via Mongoose 8.18.1  
  > **Trạng thái**: **COMPLETED (AUDIT ONLY — ZERO CODE/DB MODIFICATIONS)**  

  ---

  ## A. EXECUTIVE SUMMARY

  ### 1. Hiện trạng Phase 6
  Phase 6 là giai đoạn chuyển đổi Database Layer và ORM từ MongoDB/Mongoose sang PostgreSQL/Prisma cho 3 phân hệ nghiệp vụ cốt lõi:
  1. **Order Domain**: Quản lý đơn hàng, tính toán chiết khấu/tổng tiền, xử lý đơn hàng miễn phí, hoàn tất đơn hàng, từ chối đơn hàng, quản lý đơn hàng của học viên và giảng viên/admin.
  2. **Coupon Domain**: Quản lý mã giảm giá, kiểm tra tính hợp lệ (thời hạn, số lượng sử dụng, quyền hạn tác giả), liên kết mã giảm giá với từng khóa học cụ thể qua bảng liên kết chuẩn hóa `coupon_courses`.
  3. **Enrollment Domain**: Quản lý ghi danh học tập, kiểm tra quyền sở hữu khóa học, cấp quyền truy cập, theo dõi tiến độ cơ sở, danh sách học viên theo khóa học và hủy ghi danh (kick student).

  ### 2. Mức độ sẵn sàng
  * **Data Migration**: Đã hoàn thành 100% ở Data Migration Phase 6 (`PHASE_6_ORDERS_COUPONS_ENROLLMENTS_REPORT.md`). Toàn bộ 8 orders (bao gồm 3 orphan orders), 2 coupons, 2 coupon_courses và 5 enrollments đã được chuyển đổi chính xác sang PostgreSQL với quan hệ toàn vẹn.
  * **Prisma Schema**: Cấu trúc vật lý của 4 tables (`orders`, `coupons`, `coupon_courses`, `enrollments`) và 3 enums (`EOrderStatus`, `ECouponType`, `EEnrollmentStatus`) đã được đóng băng và validate hợp lệ 100%.
  * **Prisma Client & Helper Repositories**: `enrollment.repository.ts` đã được thiết lập một phần từ Phase 5 để phục vụ kiểm tra điều kiện làm Quiz (`findEnrollmentByUserAndCourse`).
  * **Source Code**: Tầng Service, Controller, Middleware và Validator của Order, Coupon và Enrollment hiện 100% đang đọc/ghi trực tiếp vào MongoDB thông qua Mongoose Models (`OrderModel`, `CouponModel`, `EnrollmentModel`).
  * **Kết luận sơ bộ**: Hệ thống **ĐỦ ĐIỀU KIỆN SẴN SÀNG CHO STEP 2 (READY FOR STEP 2)** với các lưu ý kỹ thuật và quyết định kiến trúc được ghi nhận chi tiết dưới đây.

  ---

  ## B. MONGODB / MONGOOSE AUDIT

  ### 1. Phân tích Models hiện tại

  #### 1.1. Model `Order` (`src/models/order.model.ts`)
  * **Collection**: `orders`
  * **Schema Fields**:
    * `code`: `String`, required, unique (Định dạng: `DH-${Date.now().toString().slice(6)}`)
    * `amount`: `Number`, optional trong schema, nhưng code gán `course.price`
    * `discount`: `Number`, optional, default: 0
    * `total`: `Number`, optional, tính toán = `Math.max(amount - discount, 0)`
    * `coupon`: `ObjectId`, ref: `'Coupon'`, optional
    * `course`: `ObjectId`, ref: `'Course'`, optional trong schema (hỗ trợ orphan orders)
    * `user`: `ObjectId`, ref: `'User'`, required trong code
    * `status`: `String`, enum: `EOrderStatus` (`pending`, `completed`, `rejected`), default: `'pending'`
    * `timestamps`: `createdAt`, `updatedAt`
  * **Vấn đề đặc biệt**: Có 3 đơn hàng lịch sử (`DH-7806607`, `DH-2062171`, `DH-2714351`) có `course = null` do khóa học gốc đã bị xóa trong quá khứ trên MongoDB.

  #### 1.2. Model `Coupon` (`src/models/coupon.model.ts`)
  * **Collection**: `coupons`
  * **Schema Fields**:
    * `title`: `String`, required
    * `code`: `String`, required, unique
    * `active`: `Boolean`, default: `false`
    * `startDate`: `Date`, optional
    * `endDate`: `Date`, optional
    * `limit`: `Number`, optional (giới hạn tổng lượt sử dụng)
    * `used`: `Number`, default: `0`
    * `courses`: `ObjectId[]`, ref: `'Course'`, default: `[]` (mảng ID các khóa học áp dụng; nếu rỗng = áp dụng toàn hệ thống)
    * `type`: `String`, enum: `ECouponType` (`percentage`, `number`), default: `'percentage'`
    * `value`: `Number`, giá trị chiết khấu (% hoặc số tiền)
    * `author`: `ObjectId`, ref: `'User'`, optional (người tạo mã)
    * `timestamps`: `createdAt`, `updatedAt`

  #### 1.3. Model `Enrollment` (`src/models/enrollment.model.ts`)
  * **Collection**: `enrollments`
  * **Schema Fields**:
    * `user`: `ObjectId`, ref: `'User'`, required
    * `course`: `ObjectId`, ref: `'Course'`, required
    * `progress`: `Number`, default: `0` (phần trăm hoàn thành 0-100)
    * `status`: `String`, enum: `EEnrollmentStatus` (`active`, `completed`, `canceled`), default: `'active'`
    * `enrolledAt`: `Date`, default: `Date.now`
    * `completedAt`: `Date`, optional
    * `timestamps`: `createdAt`, `updatedAt`

  ---

  ### 2. Phân tích Business Logic hiện tại

  #### 2.1. Luồng tạo đơn hàng (`createOrderService`)
  1. Nhận `userId`, `courseId`, `couponCode` (optional).
  2. Kiểm tra `courseId` tồn tại trong database (hiện gọi `CourseModel.findById(courseId)`).
  3. Ngăn người dùng tự mua khóa học của chính mình (`course.author.toString() === userId` $\rightarrow$ `400 Bad Request`).
  4. Kiểm tra xem người dùng đã sở hữu khóa học chưa (`OrderModel.findOne({ user: userId, course: courseId, status: COMPLETED })` $\rightarrow$ `400 Bad Request`).
  5. Kiểm tra đơn hàng chờ thanh toán trùng lặp (`OrderModel.findOne({ user: userId, course: courseId, status: PENDING })` $\rightarrow$ `400 Bad Request`).
  6. Kiểm tra mã giảm giá (`couponCode`):
    * Tìm coupon theo `code` và `active: true`.
    * Kiểm tra ngày bắt đầu/kết thúc so với thời điểm hiện tại.
    * Kiểm tra giới hạn số lượt dùng: `coupon.limit && coupon.used >= coupon.limit`.
    * Kiểm tra khóa học có nằm trong danh sách được áp dụng của coupon không (`coupon.courses.length > 0 && !coupon.courses.includes(courseId)`).
    * Tính toán discount (`PERCENTAGE` hay `NUMBER`) và `total = Math.max(course.price - discount, 0)`.
  7. **Free Order Handling**:
    * Nếu `total === 0` (do khóa học free 0 đồng hoặc coupon giảm 100%): trạng thái được đặt ngay thành `COMPLETED`.
    * Ngược lại: trạng thái là `PENDING`.
  8. Sinh mã đơn hàng: `orderCode = DH-${Date.now().toString().slice(6)}`.
  9. Lưu bản ghi Order.
  10. **Tự động kích hoạt khi COMPLETED (Free Order)**:
    * Cập nhật legacy MongoDB `UserModel.findByIdAndUpdate(userId, { $addToSet: { courses: courseId } })`.
    * Tăng lượt bán khóa học: `CourseModel.findByIdAndUpdate(courseId, { $inc: { sold: 1 } })`.
    * Tạo bản ghi `EnrollmentModel.create({ user, course, enrolledAt, progress: 0 })`.
  11. Gửi thông báo đến giảng viên (`pushNotificationService`).

  #### 2.2. Luồng cập nhật trạng thái đơn hàng (`updateOrderStatusService`)
  1. Dành cho Admin hoặc Teacher sở hữu khóa học.
  2. Kiểm tra Order tồn tại kèm populate Course.
  3. **Phòng thủ cho Orphan Orders (Không có course)**:
    * Teacher không được phép thao tác trên orphan order $\rightarrow$ 403.
    * Không được chuyển orphan order sang `COMPLETED` $\rightarrow$ 400.
    * Nếu chuyển sang `REJECTED`: giảm `coupon.used`, xóa Order khỏi DB $\rightarrow$ 200.
  4. Kiểm tra quyền sở hữu của Teacher: `course.author.toString() === userId`.
  5. **Xử lý trạng thái `REJECTED`**:
    * Nếu Order trước đó là `COMPLETED`: thu hồi quyền học (`user.courses`), giảm `course.sold: -1`, giảm `coupon.used: -1`.
    * Xóa bản ghi Order khỏi database (`OrderModel.findByIdAndDelete(orderId)`).
  6. **Xử lý trạng thái `COMPLETED`**:
    * Cập nhật `user.courses` (legacy).
    * Tăng `course.sold: +1`.
    * Upsert Enrollment (`EnrollmentModel.findOneAndUpdate({ user, course }, ..., { upsert: true })`).
    * Tăng `coupon.used: +1`.
    * Chuyển `order.status = COMPLETED`.
    * Tham gia hoặc tạo mới nhóm chat Q&A của khóa học (`ConversationModel`).
    * Gửi thông báo hoàn tất đơn hàng cho học viên.

  #### 2.3. Luồng kiểm tra & áp dụng mã giảm giá (`checkCouponService`)
  * Kiểm tra `code` tồn tại và hiệu lực thời gian, lượt sử dụng.
  * Kiểm tra `courseId` có nằm trong danh sách `coupon.courses` không.
  * Tính `discount` và `finalPrice`, trả về thông tin chi tiết coupon compact kèm giá sau giảm.

  #### 2.4. Luồng học viên & ghi danh (`enrollment.service.ts`)
  * `getMyEnrollmentsService`: Lấy danh sách khóa học học viên đã ghi danh, kèm thông tin chi tiết khóa học.
  * `getStudentsByCourseService`: Giảng viên hoặc Admin xem danh sách học viên theo từng khóa học (hỗ trợ phân trang và tìm kiếm theo `username`/`email`).
  * `removeStudentFromCourseService` (Kick student):
    * Kiểm tra quyền sở hữu của Teacher.
    * Xóa Enrollment.
    * Thu hồi `user.courses`, giảm `course.sold: -1`, xóa Order liên quan.

  ---

  ### 3. Phụ thuộc Mongoose trong Validators & Middlewares
  * `src/middlewares/order.middleware.ts`:
    * `createOrderValidator`: `mongoose.Types.ObjectId.isValid(value)` trên `courseId`!
    * `orderIdValidator`: `mongoose.Types.ObjectId.isValid(value)` trên `id`!
    * `updateOrderStatusValidator`: `mongoose.Types.ObjectId.isValid(value)` trên `id`!
  * `src/middlewares/coupon.middleware.ts`:
    * `createCouponValidator`: **Chứa trực tiếp truy vấn Mongoose vào database**:
      ```typescript
      const exists = await CouponModel.findOne({ code: value })
      if (exists) throw new Error('Coupon code already exists')
      ```
      *(Vi phạm nghiêm trọng quy chuẩn phân tầng kiến trúc AGENTS.md Section B.1 và Rules).*
    * `updateCouponValidator`: `mongoose.Types.ObjectId.isValid(value)` trên `id`!
    * `couponIdValidator`: `mongoose.Types.ObjectId.isValid(value)` trên `id`!
    * `checkCouponValidator`: `isMongoId()` trên `courseId`!

  ---

  ## C. POSTGRESQL SCHEMA AUDIT

  Căn cứ tệp `prisma/schema.prisma` và tài liệu phê duyệt [FINAL_SCHEMA_DECISIONS.md](file:///d:/e-learning_server/FINAL_SCHEMA_DECISIONS.md):

  ### 1. Bảng `orders`
  ```prisma
  model Order {
    id        String       @id @default(uuid()) @db.Uuid
    code      String       @unique @db.VarChar(50)
    amount    Decimal      @db.Decimal(12, 2)
    discount  Decimal      @default(0) @db.Decimal(12, 2)
    total     Decimal      @db.Decimal(12, 2)
    couponId  String?      @map("coupon_id") @db.Uuid
    courseId  String?      @map("course_id") @db.Uuid
    userId    String       @map("user_id") @db.Uuid
    status    EOrderStatus @default(PENDING)
    createdAt DateTime     @default(now()) @map("created_at")
    updatedAt DateTime     @updatedAt @map("updated_at")

    coupon Coupon? @relation(fields: [couponId], references: [id], onDelete: SetNull)
    course Course? @relation(fields: [courseId], references: [id], onDelete: SetNull)
    user   User    @relation(fields: [userId], references: [id], onDelete: Restrict)

    @@index([userId, courseId, status])
    @@index([courseId])
    @@map("orders")
  }
  ```
  * **Khóa chính**: `id` UUID v4/v5.
  * **Ràng buộc duy nhất**: `code` unique.
  * **Kiểu số thập phân**: `amount`, `discount`, `total` là `Decimal(12, 2)` $\rightarrow$ Cần convert sang `number` khi serialize ra API response.
  * **Ràng buộc xóa (onDelete)**:
    * `user`: `onDelete: Restrict` (Bảo vệ lịch sử thanh toán tài chính, tuyệt đối không cho xóa User nếu đã có đơn hàng).
    * `course`: `onDelete: SetNull` (Bảo toàn lịch sử đơn hàng khi khóa học bị xóa, giải thích cho 3 orphan orders lịch sử).
    * `coupon`: `onDelete: SetNull` (Khi coupon bị xóa, đơn hàng vẫn giữ nguyên lịch sử).
  * **Indexes**: Composite index `[userId, courseId, status]` tối ưu truy vấn kiểm tra trùng lặp đơn hàng.

  ---

  ### 2. Bảng `coupons` và `coupon_courses`
  ```prisma
  model Coupon {
    id        String      @id @default(uuid()) @db.Uuid
    title     String      @db.VarChar(255)
    code      String      @unique @db.VarChar(100)
    type      ECouponType @default(PERCENTAGE)
    value     Decimal     @db.Decimal(12, 2)
    limit     Int?
    used      Int         @default(0)
    startDate DateTime?   @map("start_date")
    endDate   DateTime?   @map("end_date")
    active    Boolean     @default(false)
    authorId  String?     @map("author_id") @db.Uuid
    createdAt DateTime    @default(now()) @map("created_at")
    updatedAt DateTime    @updatedAt @map("updated_at")

    author  User?          @relation("CouponAuthor", fields: [authorId], references: [id], onDelete: SetNull)
    orders  Order[]
    courses CouponCourse[]

    @@index([authorId])
    @@map("coupons")
  }

  model CouponCourse {
    couponId String @map("coupon_id") @db.Uuid
    courseId String @map("course_id") @db.Uuid

    coupon Coupon @relation(fields: [couponId], references: [id], onDelete: Cascade)
    course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

    @@id([couponId, courseId])
    @@map("coupon_courses")
  }
  ```
  * **Chuẩn hóa quan hệ N - N**: `coupons[].courses` (mảng ObjectId trong MongoDB) đã được chuẩn hóa thành bảng nối 3NF `coupon_courses` với khóa chính phức hợp `@@id([couponId, courseId])`.
  * **Ràng buộc xóa (onDelete)**: Cascade xóa cả hai chiều (xóa coupon thì xóa liên kết, xóa course thì xóa liên kết).
  * **Kiểu số thập phân**: `value Decimal(12, 2)` $\rightarrow$ Cần convert sang `number` khi serialize.

  ---

  ### 3. Bảng `enrollments`
  ```prisma
  model Enrollment {
    id          String            @id @default(uuid()) @db.Uuid
    userId      String            @map("user_id") @db.Uuid
    courseId    String            @map("course_id") @db.Uuid
    progress    Int               @default(0)
    status      EEnrollmentStatus @default(ACTIVE)
    enrolledAt  DateTime          @default(now()) @map("enrolled_at")
    completedAt DateTime?         @map("completed_at")
    createdAt   DateTime          @default(now()) @map("created_at")
    updatedAt   DateTime          @updatedAt @map("updated_at")

    user   User   @relation(fields: [userId], references: [id], onDelete: Restrict)
    course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

    @@unique([userId, courseId])
    @@index([courseId])
    @@map("enrollments")
  }
  ```
  * **Khóa chính**: `id` UUID v4/v5.
  * **Ràng buộc toàn vẹn quan trọng**:
    * `@@unique([userId, courseId])`: Một học viên chỉ có duy nhất một bản ghi ghi danh cho một khóa học. Ngăn chặn triệt để ghi danh trùng lặp ở tầng database.
    * `user`: `onDelete: Restrict` (Tuân thủ quyết định tại [FINAL_SCHEMA_DECISIONS.md](file:///d:/e-learning_server/FINAL_SCHEMA_DECISIONS.md) Section 1.1 — Không cho phép xóa User khi đã có dữ liệu ghi danh).
    * `course`: `onDelete: Cascade` (Khi khóa học bị hủy, các ghi danh tương ứng tự động dọn dẹp).

  ---

  ### 4. Bảng tổng hợp Enums vật lý
  | Prisma Enum Name | Database Enum Type | Giá trị (@map) | TypeScript Mapping |
  | :--- | :--- | :--- | :--- |
  | `EOrderStatus` | `EOrderStatus` | `'pending'`, `'completed'`, `'rejected'` | `EOrderStatus.PENDING`, `COMPLETED`, `REJECTED` |
  | `ECouponType` | `ECouponType` | `'percentage'`, `'number'` | `ECouponType.PERCENTAGE`, `NUMBER` |
  | `EEnrollmentStatus` | `EEnrollmentStatus` | `'active'`, `'completed'`, `'canceled'` | `EEnrollmentStatus.ACTIVE`, `COMPLETED`, `CANCELED` |

  ---

  ## D. API CONTRACT AUDIT

  Tổng hợp toàn bộ 13 endpoints thuộc phạm vi Phase 6:

  | # | Method | Endpoint | Controller | Service | Auth / Roles | Status Code |
  |:---:|:---|:---|:---|:---|:---|:---:|
  | 1 | `POST` | `/api/orders` | `createOrderController` | `createOrderService` | `verifyAccessToken` (User, Teacher, Admin) | `200` / `201` |
  | 2 | `GET` | `/api/orders/my` | `getMyOrdersController` | `getMyOrdersService` | `verifyAccessToken` (User) | `200` |
  | 3 | `PUT` | `/api/orders/:id` | `updateOrderStatusController` | `updateOrderStatusService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |
  | 4 | `GET` | `/api/orders` | `getOrdersController` | `getOrdersService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |
  | 5 | `POST` | `/api/coupons` | `createCouponController` | `createCouponService` | `verifyAccessToken`, `isTeacherOrAdmin` | `201` |
  | 6 | `PUT` | `/api/coupons/:id` | `updateCouponController` | `updateCouponService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |
  | 7 | `DELETE`| `/api/coupons/:id` | `deleteCouponController` | `deleteCouponService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |
  | 8 | `GET` | `/api/coupons` | `getCouponsController` | `getCouponsService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |
  | 9 | `GET` | `/api/coupons/:id` | `getCouponDetailController` | `getCouponDetailService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |
  | 10| `POST` | `/api/coupons/use` | `checkCouponController` | `checkCouponService` | `verifyAccessToken` (All Users) | `200` |
  | 11| `GET` | `/api/enrollments/my`| `getMyEnrollmentsController` | `getMyEnrollmentsService` | `verifyAccessToken` (All Users) | `200` |
  | 12| `GET` | `/api/enrollments/course/:id` | `getStudentsByCourseController` | `getStudentsByCourseService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |
  | 13| `DELETE`| `/api/enrollments/course/:id/:userId` | `removeStudentFromCourseController` | `removeStudentFromCourseService` | `verifyAccessToken`, `isTeacherOrAdmin` | `200` |

  ### Chi tiết Request / Response Contract & Serialization Rules

  #### 1. Đơn hàng (`Order`)
  * **Request Contract**:
    * `courseId`: UUID (thay thế ObjectId validation).
    * `couponCode`: string optional.
  * **Response Contract Compatibility**:
    * Chuyển đổi các trường Decimal (`amount`, `discount`, `total`) sang `number` qua `Number(val)`.
    * Áp dụng `withCompatId()` để trả song song cả `id` và `_id`.
    * Quan hệ `course`:
      * Với các đơn hàng bình thường: chứa `title`, `slug`, `image`, `price` (price dạng number).
      * Với 3 orphan orders: `course: null` (phải an toàn, không được crash khi truy cập thuộc tính).
    * Quan hệ `coupon`: chứa `code`, `value` (number), `type`.
    * Quan hệ `user`: chứa `username`, `email`.

  #### 2. Mã giảm giá (`Coupon`)
  * **Request Contract**:
    * `type`: `'percentage' | 'number'`.
    * `value`: float dương.
    * `courses`: array UUID các khóa học áp dụng.
  * **Response Contract Compatibility**:
    * `value`: convert Decimal sang `number`.
    * `courses`: mảng các khóa học kèm `_id` alias.
    * `author`: object người tạo (`username`, `role`).

  #### 3. Ghi danh (`Enrollment`)
  * **Response Contract Compatibility**:
    * Populate `course`: `title`, `slug`, `image`, `price` (number), `level`, `type`, `sold`, `view`.
    * Populate `user` (dành cho teacher view): `_id`, `id`, `username`, `email`, `avatar`.
    * Cấu trúc phân trang thống nhất: `{ students, pagination: { page, limit, total, totalPages } }`.

  ---

  ## E. CROSS-MODULE DEPENDENCY AUDIT

  ### 1. Bảng đối chiếu các Module phụ thuộc vào Order, Coupon & Enrollment

  | Consumer Module | File tham chiếu | Dependency hiện tại | Tình trạng Database | Giải pháp duy trì tương thích trong Phase 6 |
  | :--- | :--- | :--- | :--- | :--- |
  | **Quiz Submission** (Phase 5) | `src/services/quizSubmission.service.ts` | Gọi `findEnrollmentByUserAndCourse(userId, courseId)` | Đã migrate PostgreSQL | ✅ Đã sẵn sàng 100% qua `src/repositories/enrollment.repository.ts`. |
  | **Progress Tracking** (Phase 7) | `src/services/progress.service.ts` | `EnrollmentModel.findOneAndUpdate({ user, course }, { progress })` | Chưa migrate (MongoDB) | ⚠️ **Dual-write**: Khi Order hoàn tất, ghi vào cả PostgreSQL `enrollments` và MongoDB `EnrollmentModel`. |
  | **Certificate** (Phase 7) | `src/services/certificate.service.ts` | `EnrollmentModel.findOne({ user, course })` | Chưa migrate (MongoDB) | ⚠️ Đồng bộ bản ghi ghi danh sang MongoDB khi tạo Enrollment mới. |
  | **Rating** (Phase 7) | `src/services/rating.service.ts` | Kiểm tra điều kiện đánh giá: `user.courses.some(...)` | Chưa migrate (MongoDB) | ⚠️ Duy trì cập nhật `user.courses` trên MongoDB trong giai đoạn chuyển tiếp. |
  | **Comment** (Phase 8) | `src/services/comment.service.ts` | Kiểm tra học viên: `checkUserCourse.courses.some(...)` | Chưa migrate (MongoDB) | ⚠️ Duy trì cập nhật `user.courses` trên MongoDB trong giai đoạn chuyển tiếp. |
  | **Chat / Conversation** (Phase 9) | `src/services/conversation.service.ts` | Lấy danh sách học viên qua `EnrollmentModel.find({ course })` | Chưa migrate (MongoDB) | ⚠️ Duy trì bản ghi MongoDB Enrollment. |
  | **Lesson** (Phase 3) | `src/services/lesson.service.ts` | Lấy học viên để push thông báo bài học mới: `EnrollmentModel.find({ course, status: 'active' })` | Đã migrate Lesson sang PostgreSQL, nhưng phần push notification vẫn đọc `EnrollmentModel` | ⚠️ Cung cấp helper từ `enrollment.repository.ts` hoặc giữ đồng bộ MongoDB. |
  | **Notification** (Phase 10) | `src/services/order.service.ts` | Gọi `pushNotificationService` khi tạo và hoàn tất order | Chưa migrate (MongoDB) | ✅ Giữ nguyên hàm gọi `pushNotificationService` (không sửa nội dung notification service). |
  | **Course** (Phase 3) | `src/repositories/course.repository.ts` | Tăng/giảm biến `sold` của Course khi đơn hàng hoàn tất/hủy | Đã migrate PostgreSQL | ✅ Bổ sung hàm Functional Repository `incrementCourseSoldCount(courseId, amount, tx)` trên `course.repository.ts`. |

  ### 2. Chiến lược Dual-Stack Transitional Synchronization
  Theo quy tắc tại **AGENTS.md Section A.3** (Transitional Dual-Stack Architecture):
  * Toàn bộ các API của Phase 6 (`Order`, `Coupon`, `Enrollment`) phải đọc và ghi **chính thức vào PostgreSQL qua Functional Repositories**.
  * Đồng thời, trong các hàm Service khi phát sinh hành động ghi (`createOrder`, `completeOrder`, `removeStudent`), hệ thống sẽ thực hiện **đồng bộ dự phòng (defensive dual-write)** sang MongoDB:
    1. `UserModel.findByIdAndUpdate(userId, { $addToSet: { courses: courseId } })` (phục vụ Rating, Comment).
    2. `EnrollmentModel.findOneAndUpdate({ user, course }, ..., { upsert: true })` (phục vụ Progress, Certificate, Chat).
  * Cơ chế này đảm bảo zero regression cho các module thuộc Phase 7, 8, 9 chưa tới lượt migration.

  ---

  ## F. APPLICATION MODEL ARCHITECTURE AUDIT

  Tuân thủ nguyên tắc kiến trúc thống nhất tại [docs/architecture/application-model-design.md](file:///d:/e-learning_server/docs/architecture/application-model-design.md) và khuôn mẫu chuẩn mực của `Course` (`src/models/course.model.ts`):

  ### 1. Phân định trách nhiệm giữa các tầng (Layer Boundaries)

  ```text
  HTTP Request
    └── Router: Routes, verifyAccessToken, isTeacherOrAdmin
          └── Validator / Middleware: Cú pháp HTTP, UUID format, Express Validator chains
                └── Controller: Nhận req, gọi Service, serialize JSON response
                      └── Service: Business Logic, Zod Application Model types, Transactions, Mappers
                            └── Functional Repository: Prisma queries, Prisma payload types, tx support
                                  └── Prisma Client Singleton
                                        └── PostgreSQL Database
  ```

  ### 2. Thiết kế các Zod Application Models mới

  #### 2.1. `src/models/order.model.ts`
  * **Di dời file cũ**: Di chuyển Mongoose model hiện tại sang `src/models/legacy/order.legacy.model.ts`.
  * **Cấu trúc Zod Schemas**:
    * `orderBaseSchema`: Schema thực thể thuần túy (id, code, amount, discount, total, couponId, courseId, userId, status, createdAt, updatedAt).
    * `createOrderInputSchema`: Input schema cho `POST /api/orders` (`courseId: z.string().uuid()`, `couponCode: z.string().optional()`).
    * `updateOrderStatusInputSchema`: Input schema cho `PUT /api/orders/:id` (`status: z.nativeEnum(EOrderStatus)`).
    * `orderPublicSchema`: Trả về thông tin đơn hàng serialize an toàn (bao gồm hỗ trợ `course: null` cho orphan orders).
    * `orderWithRelationsSchema`: Chứa quan hệ nested populate (`course`, `coupon`, `user`).
    * TypeScript types suy luận: `Order`, `CreateOrderInput`, `UpdateOrderStatusInput`, `OrderPublicResponse`.

  #### 2.2. `src/models/coupon.model.ts`
  * **Di dời file cũ**: Di chuyển Mongoose model hiện tại sang `src/models/legacy/coupon.legacy.model.ts`.
  * **Cấu trúc Zod Schemas**:
    * `couponBaseSchema`: Schema thực thể thuần túy (id, title, code, type, value, limit, used, startDate, endDate, active, authorId, createdAt, updatedAt).
    * `couponCourseBaseSchema`: Schema thực thể bảng liên kết `coupon_courses`.
    * `createCouponInputSchema`: Schema tạo mã giảm giá.
    * `updateCouponInputSchema`: Schema cập nhật mã giảm giá.
    * `checkCouponInputSchema`: Schema kiểm tra mã (`code: z.string()`, `courseId: z.string().uuid()`).
    * `checkCouponResultSchema`: Kết quả kiểm tra coupon (`courseId`, `coursePrice`, `discount`, `finalPrice`, `coupon`).
    * TypeScript types suy luận: `Coupon`, `CouponCourse`, `CreateCouponInput`, `UpdateCouponInput`, `CheckCouponResult`.

  #### 2.3. `src/models/enrollment.model.ts`
  * **Di dời file cũ**: Di chuyển Mongoose model hiện tại sang `src/models/legacy/enrollment.legacy.model.ts`.
  * **Cấu trúc Zod Schemas**:
    * `enrollmentBaseSchema`: Schema thực thể thuần túy (id, userId, courseId, progress, status, enrolledAt, completedAt, createdAt, updatedAt).
    * `enrollmentPublicSchema`: Schema danh sách khóa học của học viên.
    * `enrollmentStudentSchema`: Schema học viên trong khóa học dành cho giảng viên/admin.
    * TypeScript types suy luận: `Enrollment`, `EnrollmentPublicResponse`, `EnrollmentStudentResponse`.

  ---

  ## G. DATABASE STATE — VERIFIED LIVE

  Đã kiểm tra thực tế trên cơ sở dữ liệu vật lý (Read-Only queries, không tạo hoặc sửa đổi dữ liệu):

  ### 1. PostgreSQL Database (`tmdemy` — localhost:5432)
  * **PostgreSQL Server**: 16.11 (Debian 16.11-1.pgdg120+1)
  * **Prisma ORM**: 6.4.1
  * **Số lượng bản ghi thực tế**:
    * `orders`: **8 bản ghi**
      * 5 bản ghi đầy đủ `courseId` hợp lệ.
      * 3 bản ghi Orphan Orders (`DH-7806607`, `DH-2062171`, `DH-2714351`) có `courseId = NULL` theo đúng phê duyệt bảo toàn dữ liệu lịch sử tại [ORPHAN_ORDER_DECISION.md](file:///d:/e-learning_server/ORPHAN_ORDER_DECISION.md).
    * `coupons`: **2 bản ghi** (`FS25`, `FS255`).
    * `coupon_courses`: **2 bản ghi** (khóa chính phức hợp nối với khóa học "Fullstack MERN Project").
    * `enrollments`: **5 bản ghi** (100% khớp với dữ liệu học viên).
    * `users`: 11 bản ghi.
    * `courses`: 10 bản ghi.

  ### 2. MongoDB Source Database (`e-learning` — MongoDB Atlas)
  * **Số lượng documents nguồn** (Đối chiếu từ báo cáo nghiệm thu dữ liệu [PHASE_6_ORDERS_COUPONS_ENROLLMENTS_REPORT.md](file:///d:/e-learning_server/PHASE_6_ORDERS_COUPONS_ENROLLMENTS_REPORT.md)):
    * `orders`: **8 documents**
    * `coupons`: **2 documents**
    * `coupon_courses` (embedded): **2 quan hệ**
    * `enrollments`: **5 documents**
  * **Kết quả đối soát số lượng**: **Tỷ lệ khớp 100% (8/8 orders, 2/2 coupons, 2/2 links, 5/5 enrollments)**.

  ---

  ## H. RISK ASSESSMENT

  | # | Rủi ro | Mức độ | Phân tích & Giải pháp kỹ thuật |
  |:---:|:---|:---:|:---|
  | 1 | **Decimal Serialization Mismatch** | **CRITICAL** | `Order.amount`, `Order.discount`, `Order.total`, `Coupon.value` trong Prisma là kiểu `Decimal`. Nếu trả trực tiếp ra JSON, Prisma sẽ serialize thành Object hoặc String làm hỏng Client. **Giải pháp**: Tất cả các hàm Service/Mapper phải ép kiểu tường minh `Number(val)` trước khi trả về Controller. |
  | 2 | **ObjectId vs. UUID validation trong Middlewares** | **CRITICAL** | `createOrderValidator`, `checkCouponValidator`, `orderIdValidator`, `couponIdValidator` hiện đều dùng `mongoose.Types.ObjectId.isValid` hoặc `.isMongoId()`. Gửi UUID lên sẽ bị `400 Bad Request`. **Giải pháp**: Chuyển sang `isValidUUID` từ `src/utils/uuid.ts`. |
  | 3 | **Database Query bên trong Express Validator** | **CRITICAL** | `createCouponValidator` gọi trực tiếp `CouponModel.findOne({ code })`. **Giải pháp**: Loại bỏ query trong Validator, kiểm tra tính duy nhất của mã coupon bằng Functional Repository trong Service hoặc bắt lỗi Prisma `P2002` (Unique constraint violation). |
  | 4 | **Race Condition khi sử dụng Coupon giới hạn lượt (`limit`)** | **HIGH** | Nhiều request đồng thời áp dụng cùng một coupon có thể vượt quá `coupon.limit`. **Giải pháp**: Thực hiện việc kiểm tra và cập nhật `coupon.used` trong một atomic transaction (`prisma.$transaction`). |
  | 5 | **Crash do 3 Orphan Orders khi truy cập thuộc tính Course** | **HIGH** | 3 đơn hàng `DH-7806607`, `DH-2062171`, `DH-2714351` có `courseId = NULL`. Code gọi `order.course.title` sẽ gây `TypeError: Cannot read properties of null`. **Giải pháp**: Sử dụng optional chaining `order.course?.title || null` trong tất cả serializer và kiểm tra phòng thủ như logic đã có ở `order.service.ts`. |
  | 6 | **Vi phạm ràng buộc Unique Enrollment (`userId, courseId`)** | **HIGH** | Khi có 2 đơn hàng cho cùng 1 user và 1 course được hoàn tất đồng thời. **Giải pháp**: Sử dụng `upsert` trên `enrollment.repository.ts` hoặc bắt mã lỗi Prisma `P2002`. |
  | 7 | **Hành vi xóa Order khi REJECTED vs. Cột enum `REJECTED`** | **OWNER DECISION REQUIRED** | Trong code legacy `order.service.ts`, khi đơn hàng bị chuyển trạng thái thành `REJECTED`, hệ thống thực hiện `findByIdAndDelete(orderId)` (xóa hẳn đơn hàng khỏi DB). Tuy nhiên trong Prisma schema, enum `EOrderStatus` có giá trị `REJECTED`. Xem chi tiết tại Mục J dưới đây để chốt phương án. |
  | 8 | **Đồng bộ hóa Dual-Stack cho các module chưa migrate** | **MEDIUM** | Rating, Comment, Progress, Certificate vẫn đọc MongoDB. **Giải pháp**: Thực hiện defensive dual-write sang MongoDB `user.courses` và `EnrollmentModel` sau khi ghi thành công vào PostgreSQL. |

  ---

  ## I. STEP 2 IMPLEMENTATION PLAN

  Kế hoạch triển khai Step 2 (Full Implementation — Single Pass with Internal Checkpoints):

  ```text
  Step 2.1: Chuẩn hóa Application Models (Zod Schemas & Inferred Types)
    ├── Di dời legacy Mongoose models sang src/models/legacy/
    │     ├── src/models/legacy/order.legacy.model.ts
    │     ├── src/models/legacy/coupon.legacy.model.ts
    │     └── src/models/legacy/enrollment.legacy.model.ts
    └── Tạo Zod Application Models chuẩn mực:
          ├── src/models/order.model.ts
          ├── src/models/coupon.model.ts
          └── src/models/enrollment.model.ts

  Step 2.2: Xây dựng Functional Repositories (Prisma Client Singleton)
    ├── Tạo src/repositories/order.repository.ts
    │     ├── createOrder, findOrderById, findOrderByCode
    │     ├── findMyOrders, findOrdersWithFilter, countOrdersWithFilter
    │     ├── updateOrderStatus, deleteOrderById
    │     └── checkExistingCompletedOrder, checkExistingPendingOrder
    ├── Tạo src/repositories/coupon.repository.ts
    │     ├── createCoupon, findCouponById, findCouponByCode
    │     ├── updateCoupon, deleteCouponById, listCoupons
    │     ├── incrementCouponUsed, decrementCouponUsed
    │     └── assignCoursesToCoupon, removeCoursesFromCoupon
    ├── Mở rộng src/repositories/enrollment.repository.ts
    │     ├── findEnrollmentByUserAndCourse (đã có)
    │     ├── createEnrollment, upsertEnrollment
    │     ├── findEnrollmentsByUserId, findStudentsByCourseId
    │     ├── countStudentsByCourseId, deleteEnrollment
    │     └── countEnrollmentsByCourseId (đã có)
    └── Bổ sung helper vào src/repositories/course.repository.ts
          └── incrementCourseSoldCount(courseId, amount, tx)

  Step 2.3: Chuyển đổi tầng Services sang PostgreSQL/Prisma
    ├── Migrate src/services/order.service.ts
    │     ├── Áp dụng Prisma Transaction cho createOrder & updateOrderStatus
    │     ├── Xử lý Decimal sang number, withCompatId
    │     ├── Phòng thủ an toàn cho Orphan Orders
    │     └── Dual-write đồng bộ MongoDB cho các module chưa migrate
    ├── Migrate src/services/coupon.service.ts
    │     ├── Quản lý quan hệ bảng nối coupon_courses
    │     └── Tính toán chiết khấu và serialize an toàn
    └── Migrate src/services/enrollment.service.ts
          ├── Truy vấn trực tiếp từ PostgreSQL enrollments
          └── Xử lý kick student qua transaction

  Step 2.4: Chuyển đổi Validators & Middlewares
    ├── Sửa src/middlewares/order.middleware.ts (chuyển ObjectId sang UUID validator)
    ├── Sửa src/middlewares/coupon.middleware.ts (loại bỏ query Mongoose, chuyển sang UUID)
    └── Đảm bảo tương thích ngược 100% với Express Validator pipelines

  Step 2.5: Cập nhật Controllers & Routes
    ├── src/controller/order.controller.ts
    ├── src/controller/coupon.controller.ts
    ├── src/controller/enrollment.controller.ts
    └── Kiểm tra pipeline router

  Step 2.6: Tích hợp, Test Verification & Regression Audit
    ├── Tạo test suite toàn diện kiểm thử Order, Coupon, Enrollment
    ├── Kiểm tra xử lý Decimal, UUID, Orphan Orders
    └── Đảm bảo TypeScript strictly PASS (zero error)
  ```

  ---

  ## J. OWNER DECISION REQUIRED & FINAL VERDICT

  ### Vấn đề cần Project Owner cho ý kiến (Design Decision):

  > **Vấn đề**: Hành vi khi Admin/Teacher từ chối đơn hàng (`status = REJECTED`).  
  > **Hiện trạng code cũ (MongoDB)**:  
  > Trong `order.service.ts` dòng 264: Khi cập nhật trạng thái đơn hàng thành `REJECTED`, hệ thống xóa luôn bản ghi đơn hàng khỏi database:
  > ```typescript
  > await OrderModel.findByIdAndDelete(orderId)
  > return { success: true, message: 'Order rejected and deleted successfully!' }
  > ```
  > Tuy nhiên, trong `prisma/schema.prisma`, enum `EOrderStatus` đã định nghĩa sẵn giá trị `REJECTED` (`enum EOrderStatus { PENDING, COMPLETED, REJECTED }`), và trong các hệ thống thương mại điện tử chuẩn, đơn hàng bị từ chối thường được giữ lại với trạng thái `REJECTED` để làm bằng chứng kiểm toán (Audit Trail) thay vì xóa vật lý (hard delete).
  >
  > **Đề xuất phương án**:
  > * **Phương án 1 (Bảo toàn 100% API Contract cũ - Khuyến nghị cho Migration)**: Giữ nguyên hành vi cũ: rollback các dữ liệu liên quan (`sold`, `coupon.used`, `user.courses`) và xóa bản ghi đơn hàng khỏi bảng `orders`, trả về message `'Order rejected and deleted successfully!'`. Điều này đảm bảo không làm lệch bất kỳ kịch bản test hay client behavior nào.
  > * **Phương án 2 (Audit Trail)**: Giữ lại bản ghi với `status = 'rejected'`, không xóa khỏi database. (Cần điều chỉnh message response nếu client phụ thuộc vào chuỗi text cũ).

  ---

  ### Final Readiness Verdict:
  ```text
  READY FOR STEP 2 (WITH DOCUMENTED LIMITATIONS & OWNER DECISION PENDING)
  ```

  * Tất cả các điều kiện tiên quyết về Schema, Database, Business Logic, Dependency Mapping và Model Architecture cho Phase 6 đã được xác định đầy đủ, rõ ràng và khả thi 100%.
  * Hệ thống đã sẵn sàng triển khai Step 2 ngay khi nhận được chỉ đạo và phê duyệt từ Project Owner.
