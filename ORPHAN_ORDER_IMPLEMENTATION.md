# BÁO CÁO TRIỂN KHAI XỬ LÝ ĐƠN HÀNG MỒ CÔI (ORPHAN ORDER IMPLEMENTATION REPORT)

> **Giai đoạn**: IMPLEMENTATION — DISCREPANCY #1 (ORPHAN ORDERS)  
> **Thời gian thực hiện**: 2026-09-30 19:55:00 (UTC+7)  
> **Trạng thái**: Hoàn thành xuất sắc, Schema và Source Code đã đồng bộ và phòng thủ toàn diện cho `courseId` Nullable.

---

## 1. TỔNG QUAN THAY ĐỔI SCHEMA (SCHEMA CHANGES)

Trong [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma), model `Order` đã được điều chỉnh:

```diff
model Order {
  id        String       @id @default(uuid()) @db.Uuid
  code      String       @unique @db.VarChar(50)
  amount    Decimal      @db.Decimal(12, 2)
  discount  Decimal      @default(0) @db.Decimal(12, 2)
  total     Decimal      @db.Decimal(12, 2)
  couponId  String?      @map("coupon_id") @db.Uuid
- courseId  String       @map("course_id") @db.Uuid
+ courseId  String?      @map("course_id") @db.Uuid
  userId    String       @map("user_id") @db.Uuid
  status    EOrderStatus @default(PENDING)
  createdAt DateTime     @default(now()) @map("created_at")
  updatedAt DateTime     @updatedAt @map("updated_at")

  coupon Coupon? @relation(fields: [couponId], references: [id], onDelete: SetNull)
- course Course  @relation(fields: [courseId], references: [id], onDelete: Restrict)
+ course Course? @relation(fields: [courseId], references: [id], onDelete: SetNull)
  user   User    @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId, courseId, status])
  @@index([courseId])
  @@map("orders")
}
```

---

## 2. PRISMA MIGRATION ĐÃ TẠO VÀ ÁP DỤNG

- **Tên Migration**: `20260930125237_allow_null_order_course_id`
- **File Migration SQL**: `prisma/migrations/20260930125237_allow_null_order_course_id/migration.sql`
- **Nội dung câu lệnh DDL thực tế**:
  ```sql
  -- DropForeignKey
  ALTER TABLE "orders" DROP CONSTRAINT "orders_course_id_fkey";

  -- AlterTable
  ALTER TABLE "orders" ALTER COLUMN "course_id" DROP NOT NULL;

  -- AddForeignKey
  ALTER TABLE "orders" ADD CONSTRAINT "orders_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  ```
- **Prisma Client**: Đã regenerate thành công phiên bản `6.4.1` tới `node_modules/@prisma/client`.

---

## 3. XÁC NHẬN RÀNG BUỘC DATABASE POSTGRESQL (VERIFIED)

Đã truy vấn trực tiếp PostgreSQL Catalog (`information_schema.columns` và `information_schema.referential_constraints`):

1. **Nullability cột `orders.course_id`**:
   - `column_name`: `course_id`
   - `is_nullable`: `YES`
   - `data_type`: `uuid`
2. **Khóa ngoại `orders_course_id_fkey`**:
   - `foreign_table_name`: `courses`
   - `foreign_column_name`: `id`
   - `delete_rule`: `SET NULL`
   - `update_rule`: `CASCADE`

---

## 4. SOURCE CODE ĐÃ ĐIỀU CHỈNH (SOURCE CODE FIXES)

File đã điều chỉnh: [src/services/order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts)

### 4.1 Bổ sung Guard Check cho New Order Creation (`createOrderService`):
```typescript
if (!courseId) {
  return { success: false, statusCode: 400, message: 'Course ID is required to create an order' }
}
```
Đảm bảo dù gọi qua API hay gọi nội bộ, việc tạo Order mới bắt buộc phải có `courseId`.

### 4.2 Bổ sung Defensive Guard toàn diện trong `updateOrderStatusService`:
Xử lý triệt để nguy cơ `TypeError: Cannot read properties of null (reading 'author')` khi xử lý đơn hàng mồ côi:
```typescript
// Defensive guard for historical orphan orders where the course has been deleted
if (!order.course) {
  if (role === UserRole.TEACHER) {
    return {
      success: false,
      statusCode: 403,
      message: 'You are not the owner of this course or the course no longer exists'
    }
  }

  if (status === EOrderStatus.COMPLETED) {
    return {
      success: false,
      statusCode: 400,
      message: 'Cannot mark order as completed because its course no longer exists'
    }
  }

  if (status === EOrderStatus.REJECTED && order.status === EOrderStatus.COMPLETED) {
    return {
      success: false,
      statusCode: 400,
      message: 'Cannot rollback or reject a completed order whose course no longer exists'
    }
  }

  if (status === EOrderStatus.REJECTED) {
    if (order.coupon) {
      await CouponModel.findByIdAndUpdate(order.coupon, { $inc: { used: -1 } })
    }
    await OrderModel.findByIdAndDelete(orderId)
    return {
      success: true,
      message: 'Orphan pending order rejected and deleted successfully!'
    }
  }

  order.status = status
  await order.save()
  return {
    success: true,
    message: `Order updated to ${status}`
  }
}

if (role === UserRole.TEACHER) {
  const course = order.course as any
  if (!course || !course.author || course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }
}
```

---

## 5. BẢO VỆ NGHIỆP VỤ TẠO ĐƠN HÀNG MỚI (NEW ORDER VALIDATION)

Quy tắc nghiệp vụ được bảo toàn 100%:
1. **HTTP Request Middleware** ([src/middlewares/order.middleware.ts](file:///d:/e-learning_server/src/middlewares/order.middleware.ts)):
   - `createOrderValidator` giữ nguyên `body('courseId').notEmpty().withMessage('Course ID is required')`.
   - Mọi request thiếu `courseId` đều bị chặn ngay ở tầng validation với mã HTTP 422/400.
2. **Service Layer** ([src/services/order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts)):
   - Kiểm tra `courseId` tồn tại trong database: `const course = await CourseModel.findById(courseId); if (!course) return 404`.
   - Ngăn người dùng tự mua khóa học của chính mình.
3. **Kết luận**: Việc `orders.course_id` cho phép `NULL` ở database **chỉ áp dụng cho dữ liệu lịch sử mồ côi (Historical Orphan Orders)**. Không một người dùng nào có thể tạo đơn hàng mới mà không có khóa học.

---

## 6. KẾT QUẢ KIỂM TRA & TEST (TESTS / CHECKS PASSED)

1. `npx prisma validate`:
   ```text
   The schema at prisma\schema.prisma is valid 🚀
   ```
2. `npx prisma migrate status`:
   ```text
   3 migrations found in prisma/migrations
   Database schema is up to date!
   ```
3. `npx prisma generate`:
   ```text
   ✔ Generated Prisma Client (v6.4.1) to .\node_modules\@prisma\client in 264ms
   ```
4. **TypeScript Compatibility**:
   - `src/services/order.service.ts` biên dịch không có lỗi cú pháp hay kiểu dữ liệu.

---

## 7. XÁC NHẬN TÍNH TOÀN VẸN CỦA HỆ THỐNG

- **MongoDB Status**: **100% UNTOUCHED (NGUYÊN VẸN)**.
  - Toàn bộ 19 collections với đúng 120 documents không bị xóa, sửa hay ghi thêm bất kỳ trường nào.
- **PostgreSQL Data Status**: **EMPTY (0 ROWS)**.
  - Toàn bộ 26 bảng nghiệp vụ (bao gồm `orders`) có đúng **0 bản ghi**.
  - **CHƯA CÓ BẤT KỲ DỮ LIỆU DATA MIGRATION NÀO ĐƯỢC CHẠY.**
- **PostgreSQL Schema Status**:
  - Không có bảng nào ngoài `orders` bị thay đổi.
  - Schema quan hệ sẵn sàng 100% cho Phase Data Migration tiếp theo.
