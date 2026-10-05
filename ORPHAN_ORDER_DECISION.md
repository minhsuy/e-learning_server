# PHÂN TÍCH TÁC ĐỘNG VÀ QUYẾT ĐỊNH XỬ LÝ ĐƠN HÀNG MỒ CÔI (ORPHAN ORDER DECISION & IMPACT ANALYSIS)

> **Giai đoạn**: IMPACT ANALYSIS — DISCREPANCY #1 (ORPHAN ORDERS)  
> **Phiên bản tài liệu**: 1.0.0  
> **Ngày lập**: 2026-09-30  
> **Trạng thái thực thi**: **CHỈ PHÂN TÍCH TÁC ĐỘNG & THIẾT KẾ** (Chưa sửa schema, chưa tạo migration, chưa sửa code, MongoDB và PostgreSQL nguyên vẹn 100%).

---

## 1. CURRENT SCHEMA (TRẠNG THÁI SCHEMA HIỆN TẠI)

Trong `prisma/schema.prisma` và PostgreSQL Database `tmdemy`:

```prisma
model Order {
  id        String       @id @default(uuid()) @db.Uuid
  code      String       @unique @db.VarChar(50)
  amount    Decimal      @db.Decimal(12, 2)
  discount  Decimal      @default(0) @db.Decimal(12, 2)
  total     Decimal      @db.Decimal(12, 2)
  couponId  String?      @map("coupon_id") @db.Uuid
  courseId  String       @map("course_id") @db.Uuid
  userId    String       @map("user_id") @db.Uuid
  status    EOrderStatus @default(PENDING)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  coupon Coupon? @relation(fields: [couponId], references: [id], onDelete: SetNull)
  course Course  @relation(fields: [courseId], references: [id], onDelete: Restrict)
  user   User    @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId, courseId, status])
  @@index([courseId])
  @@map("orders")
}
```

### Đặc điểm hiện tại:
- Cột `course_id` trong PostgreSQL là `UUID NOT NULL`.
- Khóa ngoại `orders_course_id_fkey` tham chiếu `courses(id)` với ràng buộc `ON DELETE RESTRICT`.
- Index: `@@index([userId, courseId, status])` và `@@index([courseId])`.

---

## 2. ORPHAN DATA (DỮ LIỆU ĐƠN HÀNG MỒ CÔI PHÁT HIỆN TRONG MONGODB)

Qua kiểm tra trực tiếp collection `orders` và `courses` trên MongoDB Atlas, hệ thống hiện có **8 đơn hàng**, trong đó có **3 đơn hàng mồ côi** tham chiếu tới các khóa học đã bị xóa trong quá khứ:

| Mã đơn hàng (`code`) | Mongo `_id` | Trạng thái (`status`) | Tổng tiền (`total`) | `course` ObjectId tham chiếu | Trạng thái khóa học trong MongoDB |
|:---|:---|:---:|:---:|:---|:---:|
| `DH-7806607` | `68e5257e43b2786ec96458e8` | `pending` | 699,000 | `68d3f83ce710d52ff77262a3` | **KHÔNG TỒN TẠI** (Đã bị xóa) |
| `DH-2062171` | `68ebc5ce500211ca4f063445` | `pending` | 100,000 | `68ebc108e0a02fc17af9c31a` | **KHÔNG TỒN TẠI** (Đã bị xóa) |
| `DH-2714351` | `68ebc85ab800ff9b01818de5` | `completed` | 0 | `68d3f7fce710d52ff772629b` | **KHÔNG TỒN TẠI** (Đã bị xóa) |

*Ghi chú: Cả 3 đơn hàng này đều thuộc về User hợp lệ đang tồn tại trong database (`68dcf8f9e3617ec76053b4d7`).*

---

## 3. CODE IMPACT (RÀ SOÁT TOÀN DIỆN MÃ NGUỒN HIỆN TẠI)

Đã rà soát chi tiết tất cả các file mã nguồn liên quan đến `Order`:

### 3.1 `src/models/order.model.ts` (Mongoose Schema)
- Thuộc tính `course` trong Mongoose:
  ```typescript
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }
  ```
  Trong Mongoose, trường `course` **chưa từng được cấu hình `required: true`**. Về mặt bản chất NoSQL, MongoDB đã luôn cho phép lưu `order` mà không ép buộc `course` phải tồn tại hay bắt buộc.

### 3.2 `src/middlewares/order.middleware.ts` & `src/routes/order.route.ts`
- Tại `createOrderValidator` (dòng 5-10):
  ```typescript
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid Course ID')
  ```
- **Nhận định**: Ở tầng HTTP Middleware cho **API tạo đơn hàng mới**, `courseId` luôn là trường **bắt buộc (required)**. Không một client nào có thể gửi request tạo đơn hàng mà bỏ trống `courseId`.

### 3.3 `src/services/order.service.ts`

#### A. Hàm `createOrderService`:
- Dòng 20-23:
  ```typescript
  const course = await CourseModel.findById(courseId);
  if (!course) return { success: false, statusCode: 404, message: 'Course not found' };
  ```
- Dòng 53: Tính `total = course.price`.
- **Nhận định**: Đối với luồng tạo đơn hàng mới, Service luôn kiểm tra khóa học phải tồn tại trong database trước khi tạo đơn hàng.

#### B. Hàm `getMyOrdersService` (Học viên xem đơn hàng của mình):
- Dòng 154-159:
  ```typescript
  OrderModel.find(filter)
    .populate({ path: 'course', select: 'title slug image price' })
    .populate({ path: 'coupon', select: 'code value type' })
  ```
- **Nhận định**: Khi `course` là `null` (hoặc khóa học bị xóa), Mongoose trả về `course: null`. Backend không bị crash ở hàm này, nhưng **Frontend UI** nếu truy cập trực tiếp `order.course.title` mà không dùng Optional Chaining (`order.course?.title`) sẽ gặp lỗi TypeError ở giao diện người dùng.

#### C. Hàm `updateOrderStatusService` (CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG - ĐIỂM NGUY HIỂM CAO):
- Dòng 191-201:
  ```typescript
  const order = await OrderModel.findById(orderId).populate('course');
  if (role === UserRole.TEACHER) {
    const course = order.course as any;
    if (course.author.toString() !== userId) { // <-- NGUY CƠ CRASH NẾU course LÀ NULL!
      return { success: false, statusCode: 403, message: 'You are not the owner of this course' };
    }
  }
  ```
  Nếu Giáo viên gọi update đơn hàng mồ côi, `order.course` là `null`, code sẽ ném lỗi: `TypeError: Cannot read properties of null (reading 'author')`.
- Dòng 207 (Khi Reject): `CourseModel.findByIdAndUpdate(order.course, { $inc: { sold: -1 } })`. Nếu `order.course` là null, hàm gọi sai tham số.
- Dòng 225-257 (Khi Complete):
  ```typescript
  CourseModel.findByIdAndUpdate(order.course, { $inc: { sold: 1 } });
  EnrollmentModel.findOneAndUpdate({ user: order.user, course: order.course }, ...);
  ConversationModel.findOne({ course: order.course, isGroup: true });
  ```
  Các thao tác này đều phụ thuộc trực tiếp vào `order.course`.

#### D. Hàm `getOrdersService` (Admin / Teacher xem danh sách đơn hàng):
- Dòng 310-313:
  ```typescript
  if (role === UserRole.TEACHER) {
    const teacherCourses = await CourseModel.find({ author: new Types.ObjectId(userId) }).select('_id');
    filter.course = { $in: teacherCourses.map((c) => c._id) };
  }
  ```
- **Nhận định**: Giáo viên chỉ lọc các đơn hàng thuộc khóa học của mình, do đó giáo viên sẽ tự động không nhìn thấy các đơn hàng mồ côi (hoàn toàn hợp lý). Chỉ có Admin xem toàn bộ hệ thống mới thấy đơn hàng mồ côi với `course = null`.

### 3.4 `src/services/enrollment.service.ts`
- Dòng 127: `OrderModel.findOneAndDelete({ course: courseId, user: targetUserId })`. Hàm này chỉ gọi khi kick học viên ra khỏi một khóa học cụ thể đang tồn tại (`courseId`), không ảnh hưởng đến đơn hàng mồ côi.

---

## 4. PROPOSED SCHEMA CHANGE (ĐỀ XUẤT THAY ĐỔI SCHEMA)

Để lưu trữ được các đơn hàng lịch sử có khóa học đã bị xóa mà không cần sinh khóa học giả, cấu trúc bảng `orders` cần chuyển đổi `course_id` sang dạng **Nullable**:

```prisma
model Order {
  id        String       @id @default(uuid()) @db.Uuid
  code      String       @unique @db.VarChar(50)
  amount    Decimal      @db.Decimal(12, 2)
  discount  Decimal      @default(0) @db.Decimal(12, 2)
  total     Decimal      @db.Decimal(12, 2)
  couponId  String?      @map("coupon_id") @db.Uuid
  courseId  String?      @map("course_id") @db.Uuid  // <-- ĐỔI THÀNH NULLABLE (String?)
  userId    String       @map("user_id") @db.Uuid
  status    EOrderStatus @default(PENDING)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  coupon Coupon? @relation(fields: [couponId], references: [id], onDelete: SetNull)
  course Course? @relation(fields: [courseId], references: [id], onDelete: SetNull) // <-- ĐỔI THÀNH OPTIONAL VÀ onDelete: SetNull
  user   User    @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId, courseId, status])
  @@index([courseId])
  @@map("orders")
}
```

### Đề xuất về `onDelete`:
- **Đề xuất: `onDelete: SetNull`**
  - **Lý do**: Khi một Course bị xóa trong tương lai, PostgreSQL sẽ tự động đặt `course_id = NULL` trên các đơn hàng liên quan thay vì chặn xóa hoặc xóa cascading đơn hàng. Điều này giúp bảo toàn vĩnh viễn dữ liệu hóa đơn, chứng từ tài chính và lịch sử thanh toán của hệ thống.

---

## 5. BUSINESS RULE (QUY TẮC NGHIỆP VỤ BẮT BUỘC)

Phải phân định tuyệt đối ranh giới giữa hai nghiệp vụ:

### Quy tắc 1: Tạo đơn hàng mới (New Order Creation)
- **Tầng API Middleware**: `createOrderValidator` bắt buộc `courseId` phải có mặt và hợp lệ (`notEmpty()`).
- **Tầng Service**: `createOrderService` bắt buộc kiểm tra `courseId` có tồn tại trong bảng `courses` và đang mở bán.
- **Cam kết nghiệp vụ**: **TUYỆT ĐỐI KHÔNG CHO PHÉP TẠO ĐƠN HÀNG MỚI MÀ KHÔNG CÓ KHÓA HỌC.** `courseId` nullable chỉ là cơ chế lưu trữ ở database để chứa dữ liệu lịch sử.

### Quy tắc 2: Đơn hàng lịch sử mồ côi (Historical Orphan Order)
- Chỉ những đơn hàng đã phát sinh trong quá khứ mà khóa học nguồn đã bị xóa khỏi hệ thống mới có `courseId = NULL`.
- Dữ liệu này được coi là **Read-Only Archive** phục vụ thống kê tài chính và kế toán.

### Quy tắc 3: Xử lý an toàn khi duyệt đơn hàng (Order Status Update Protection)
- Trong `updateOrderStatusService`: Phải thêm kiểm tra phòng thủ:
  ```typescript
  if (!order.course) {
    return {
      success: false,
      statusCode: 400,
      message: 'Cannot update status of an order whose course has been deleted'
    };
  }
  ```
  Ngăn chặn việc kích hoạt duyệt hoàn thành (`COMPLETED`) hoặc từ chối (`REJECTED`) đối với đơn hàng không còn khóa học tương ứng.

---

## 6. MIGRATION BEHAVIOR (HÀNH VI KHI CHẠY MIGRATION)

Khi script migration xử lý dữ liệu từ MongoDB sang PostgreSQL:

1. **Với các đơn hàng thông thường (5 đơn hàng hợp lệ)**:
   - Tra cứu `order.course` trong danh sách Course ID đã map.
   - Gán `course_id = toPostgresUuid(order.course)`.
2. **Với 3 đơn hàng mồ côi (`DH-7806607`, `DH-2062171`, `DH-2714351`)**:
   - Nhận diện `order.course` không tồn tại trong danh sách Course ID đã map.
   - Gán `course_id = null`.
   - **Bảo toàn 100% các trường còn lại**:
     - `id = toPostgresUuid(order._id)`
     - `code = order.code`
     - `amount = order.amount || order.total`
     - `discount = order.discount || 0`
     - `total = order.total`
     - `coupon_id = order.coupon ? toPostgresUuid(order.coupon) : null`
     - `user_id = toPostgresUuid(order.user)`
     - `status = order.status`
     - `created_at = new Date(order.createdAt)`
     - `updated_at = new Date(order.updatedAt)`
   - Xuất log thông báo kiểm toán:
     `[MIGRATION AUDIT] Order code ${order.code} migrated with course_id = NULL (Source course ID ${order.course} was previously deleted in MongoDB).`

---

## 7. RISKS & MITIGATION (CÁC RỦI RO VÀ GIẢI PHÁP)

| Rủi ro | Mức độ | Phạm vi ảnh hưởng | Giải pháp xử lý |
|:---|:---:|:---|:---|
| **Lỗi UI khi hiển thị lịch sử đơn hàng** | Trung bình | Frontend `getMyOrders` / `getOrders` | Đảm bảo Frontend render fallback: `order.course?.title || 'Khóa học đã ngừng cung cấp'` |
| **Crash khi Teacher update đơn hàng mồ côi** | Cao | Backend `updateOrderStatusService` | Bổ sung guard check `if (!order.course)` trước khi truy cập `order.course.author` |
| **Sai lệch thống kê doanh thu theo khóa học** | Thấp | Báo cáo doanh thu từng khóa | Khi thống kê doanh thu theo khóa học dùng `INNER JOIN`, các đơn hàng này sẽ không gộp vào khóa học nào (đúng bản chất vì khóa học đã xóa). Khi thống kê tổng doanh thu sàn dùng `SUM(total)` trên bảng `orders` thì vẫn bảo toàn 100%. |

---

## 8. REQUIRED SCHEMA CHANGES (CÁC THAY ĐỔI CẦN THỰC HIỆN KHI ĐƯỢC PHÊ DUYỆT)

Khi được sự cho phép của bạn ở bước tiếp theo, các thay đổi cụ thể sẽ gồm:

### 8.1 Thay đổi trong `prisma/schema.prisma`:
```diff
model Course {
  ...
- orders          Order[]
+ orders          Order[]
}

model Order {
  ...
  couponId  String?      @map("coupon_id") @db.Uuid
- courseId  String       @map("course_id") @db.Uuid
+ courseId  String?      @map("course_id") @db.Uuid
  userId    String       @map("user_id") @db.Uuid
  status    EOrderStatus @default(PENDING)
  ...
  coupon Coupon? @relation(fields: [couponId], references: [id], onDelete: SetNull)
- course Course  @relation(fields: [courseId], references: [id], onDelete: Restrict)
+ course Course? @relation(fields: [courseId], references: [id], onDelete: SetNull)
  user   User    @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId, courseId, status])
  @@index([courseId])
  @@map("orders")
}
```

### 8.2 Lệnh thực thi Migration Prisma:
```bash
npx prisma migrate dev --name allow_null_order_course_id
npx prisma generate
```
Lệnh này sẽ sinh file migration SQL chỉnh sửa cột:
```sql
ALTER TABLE "orders" ALTER COLUMN "course_id" DROP NOT NULL;
ALTER TABLE "orders" DROP CONSTRAINT "orders_course_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```
*(Hiện tại CHƯA chạy lệnh này, đang chờ chỉ thị tiếp theo).*
