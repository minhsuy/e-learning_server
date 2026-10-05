# PHASE 6 — ORDER PURCHASE ELIGIBILITY BUG FIX REPORT

**Project:** TMDEMY E-Learning Backend  
**Scope:** Order Creation — Course Purchase Eligibility  
**Target Database:** PostgreSQL 16.11 (`tmdemy`)  
**ORM:** Prisma 6.4.1  
**Architecture:** Functional Repository + Service + Express Validator  
**File Created:** `docs/migration/phase-06-order-coupon-enrollment/PHASE6_ORDER_ELIGIBILITY_BUGFIX_REPORT.md`  
**Execution Date:** 2026-10-04  
**Final Status:** `FIXED — ALL TESTS PASSED`

---

## 1. TỔNG QUAN VÀ NGUYÊN NHÂN GỐC (ROOT CAUSE ANALYSIS)

### 1.1. Hiện trạng phát hiện lỗi
Trước khi sửa lỗi, trong luồng tạo đơn hàng (`createOrderService` tại `src/services/order.service.ts`):
1. Service gọi `findCourseById(courseId)` từ `src/repositories/course.repository.ts`.
2. Kiểm tra `if (!course) return { statusCode: 404, message: 'Course not found' }`.
3. Kiểm tra tiếp theo:
   * Self-purchase check (`course.authorId === userId`).
   * Duplicate completed order check.
   * Duplicate pending order check.
   * Coupon validation & Price calculation.
   * Auto-enrollment logic nếu `total === 0` (miễn phí hoặc coupon 100%).

### 1.2. Root Cause
* `course.isDestroyed` (`Boolean @default(false) @map("is_destroyed")` trong PostgreSQL) hoàn toàn không được kiểm tra. Một khóa học đã bị xóa mềm (`isDestroyed = true`) vẫn có thể được học viên đặt mua hoặc nhận qua free checkout.
* `course.status` (`CourseStatus @default(PENDING)` với các giá trị `APPROVED`, `PENDING`, `REJECTED`) không được thẩm tra giá trị `CourseStatus.PENDING`. Khóa học đang chờ duyệt giảng dạy vẫn có thể được tạo đơn hàng hoặc auto-enroll.
* Đặc biệt, nhánh free checkout (`total === 0`) có thể lập tức hoàn tất đơn hàng (`status: COMPLETED`), sinh `Enrollment`, tăng `Course.sold` và cập nhật dữ liệu học viên mà không hề bị chặn bởi trạng thái xóa hoặc chưa duyệt.

---

## 2. CHI TIẾT SỬA LỖI (IMPLEMENTATION)

### 2.1. File mã nguồn đã chỉnh sửa
* **File duy nhất:** [src/services/order.service.ts](file:///d:/e-learning_server/src/services/order.service.ts)
* **Import bổ sung:** `CourseStatus` từ `@prisma/client`.

### 2.2. Vị trí và Logic kiểm tra trong `createOrderService`
Các kiểm tra đủ điều kiện bán (Purchase Eligibility) được đặt ngay sau bước kiểm tra sự tồn tại của khóa học (`Check Course Exists`) và **trước** tất cả các logic nghiệp vụ khác (tự mua, trùng đơn, mã giảm giá, tính giá, ghi đơn hàng và auto-enrollment).

```typescript
// 1. Kiểm tra tồn tại khóa học trong PostgreSQL
const course = await findCourseById(courseId)
if (!course) {
  return {
    success: false,
    statusCode: 404,
    message: 'Course not found'
  }
}

// 2. Reject destroyed / soft-deleted courses (Bảo vệ Course đã bị xóa mềm)
if (course.isDestroyed) {
  return {
    success: false,
    statusCode: 400,
    message: 'Course is deleted or no longer available'
  }
}

// 3. Reject pending approval courses (Bảo vệ Course chưa được phê duyệt)
if (course.status === CourseStatus.PENDING || String(course.status).toUpperCase() === 'PENDING') {
  return {
    success: false,
    statusCode: 400,
    message: 'Course is pending approval and cannot be ordered'
  }
}

// 4. Tiếp tục các bước kiểm tra nghiệp vụ tiếp theo...
```

### 2.3. Thứ tự xử lý hoàn chỉnh sau khi sửa lỗi (Execution Flow)
```text
Create Order Request (POST /api/orders)
         │
         ▼
Find Course in PostgreSQL (findCourseById)
         │
         ▼
[1] Check Course Exists ───────────────► If null ──► 404 Not Found
         │
         ▼
[2] Check isDestroyed ─────────────────► If true ──► 400 Bad Request (Course is deleted)
         │
         ▼
[3] Check Course.status ───────────────► If PENDING ► 400 Bad Request (Course is pending approval)
         │
         ▼
[4] Check Self Purchase ───────────────► If teacher ► 400 Bad Request (Cannot purchase own course)
         │
         ▼
[5] Check Duplicate Completed Order ───► If exists ─► 400 Bad Request (Already enrolled/purchased)
         │
         ▼
[6] Check Duplicate Pending Order ─────► If exists ─► 400 Bad Request (Pending order exists)
         │
         ▼
[7] Validate Coupon (if provided) ─────► If invalid ► 400 Bad Request (Invalid/expired coupon)
         │
         ▼
[8] Calculate Final Price (total)
         │
         ▼
[9] Create Order in PostgreSQL
         │
         ▼
Is total === 0? (Free or 100% Coupon)
    ├── NO:  Return Order (status: PENDING)
    └── YES: Complete Order (status: COMPLETED)
             Create Enrollment in PostgreSQL
             Increment Course.sold
             Increment Coupon.used (if coupon applied)
             Mirror to MongoDB (User.courses, Enrollment)
```

---

## 3. KẾT QUẢ KIỂM THỬ (TEST RESULTS)

Đã xây dựng và thực thi bộ test độc lập [scripts/test_order_eligibility.ts](file:///d:/e-learning_server/scripts/test_order_eligibility.ts) cùng bộ test tổng thể Phase 6 và API endpoints.

### 3.1. Chi tiết 9 Test Cases Bắt buộc

| Nhóm | Test Case | Kịch bản kiểm tra | Kỳ vọng | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Destroyed Course** | **Test 1** | Khóa học `isDestroyed = true`, giá > 0đ | Từ chối 400, không tạo Order, không tạo Enrollment | `statusCode: 400`, `message: 'Course is deleted or no longer available'`, không phát sinh record | **PASS** |
| | **Test 2** | Khóa học `isDestroyed = true`, giá 0đ (miễn phí) | Từ chối 400, không auto-enroll, không tăng `sold` | `statusCode: 400`, không auto-enroll | **PASS** |
| | **Test 3** | Khóa học `isDestroyed = true`, coupon giảm 100% | Từ chối 400, không auto-enroll, `Coupon.used` không đổi | `statusCode: 400`, `Coupon.used` giữ nguyên | **PASS** |
| **B. Pending Course** | **Test 4** | Khóa học `status = PENDING`, giá > 0đ | Từ chối 400, không tạo Order, không tạo Enrollment | `statusCode: 400`, `message: 'Course is pending approval and cannot be ordered'` | **PASS** |
| | **Test 5** | Khóa học `status = PENDING`, giá 0đ (miễn phí) | Từ chối 400, không tạo Enrollment | `statusCode: 400`, không tạo Enrollment | **PASS** |
| | **Test 6** | Khóa học `status = PENDING`, coupon giảm 100% | Từ chối 400, không auto-enroll, `Coupon.used` không đổi | `statusCode: 400`, không tạo Enrollment | **PASS** |
| **C. Eligible Course** | **Test 7** | Khóa học hợp lệ (`APPROVED`, `isDestroyed = false`), giá > 0đ | Tạo Order `PENDING`, thành công | `statusCode: 201`, Order được tạo, dọn dẹp an toàn sau test | **PASS** |
| | **Test 8** | Khóa học hợp lệ, giá 0đ (miễn phí) | Order `COMPLETED`, Enrollment tạo, `sold` tăng 1 | Order tự động `COMPLETED`, Enrollment sinh thành công, hoàn trả an toàn | **PASS** |
| | **Test 9** | Khóa học hợp lệ, coupon giảm 100% | Order `COMPLETED`, Enrollment tạo, `sold` tăng 1, `used` tăng 1 | Order tự động `COMPLETED`, Enrollment sinh thành công, hoàn trả an toàn | **PASS** |

### 3.2. Regression & Phối hợp toàn diện

* **Bộ test chuyên biệt [scripts/test_order_eligibility.ts](file:///d:/e-learning_server/scripts/test_order_eligibility.ts):**
  * **29/29 tests PASS (100%)**:
    * 6 test từ chối khóa học `isDestroyed` và `PENDING` ở cả 3 mức giá (>0, =0, coupon 100%).
    * 3 test kiểm tra khóa học hợp lệ với dọn dẹp dữ liệu cô lập an toàn.
    * 3 test hồi quy bảo vệ (Self-purchase rejection, Duplicate completed rejection, Teacher orphan order authorization).
    * Database safety check: số lượng Order, Enrollment, Coupon trước và sau test khớp 100%.
* **Bộ test tổng hợp Phase 6 (`scratch/test_phase6_suite.ts`):**
  * **53/53 tests PASS (100%)**: Toàn bộ luồng Order, Coupon, Enrollment và các edge-cases hoạt động ổn định.
* **Bộ test HTTP API qua Live Server (`scratch/test_api_endpoints.ts`):**
  * **14/14 tests PASS (100%)**:
    * Bao gồm test gửi request HTTP `POST /api/orders` với course `isDestroyed = true`: Server trả đúng HTTP `400 Bad Request` với JSON `{ "message": "Course is deleted or no longer available" }`.
* **Bộ test Foundation Phase 1 (`scripts/test-phase1-foundation.ts`):**
  * **39/39 tests PASS (100%)**: Không gây bất kỳ ảnh hưởng nào đến tầng nền tảng.

---

## 4. BẢO TOÀN TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU (DATABASE INTEGRITY)

* **Baseline Dữ liệu PostgreSQL (`tmdemy`):**
  * Số lượng `Order`: **13** (bảo toàn nguyên vẹn 13 bản ghi, bao gồm 3 orphan orders ngoại lệ lịch sử).
  * Số lượng `Coupon`: **2** (bảo toàn nguyên vẹn 2 bản ghi).
  * Số lượng `CouponCourse`: **2** (bảo toàn nguyên vẹn 2 bản ghi).
  * Số lượng `Enrollment`: **8** (bảo toàn nguyên vẹn 8 bản ghi).
* **Cam kết an toàn:**
  * Toàn bộ test từ chối (`isDestroyed`, `PENDING`) không thực hiện bất kỳ lệnh ghi nào vào database.
  * Các test case hợp lệ (Test 7, 8, 9) chạy trong cơ chế test fixture độc lập và được rollback/cleanup ngay lập tức, đưa database trở lại trạng thái baseline ban đầu.
  * Không chạy `prisma migrate reset`, không `drop/truncate`, không can thiệp MongoDB legacy documents.

---

## 5. TƯƠNG THÍCH API CONTRACT (API COMPATIBILITY)

| Tiêu chí | Đặc tả & Thực tế sau khi sửa |
| :--- | :--- |
| **Endpoint URL** | `POST /api/orders` (Giữ nguyên 100%) |
| **HTTP Status Code** | `400 Bad Request` khi Course bị xóa hoặc đang ở trạng thái Pending |
| **Error Message khi `isDestroyed = true`** | `Course is deleted or no longer available` |
| **Error Message khi `status = PENDING`** | `Course is pending approval and cannot be ordered` |
| **Response Format** | JSON `{ "message": "<error_message>" }` (chuẩn hóa đồng nhất qua `handleValidationErrors` / `createOrderController`) |

Không làm ảnh hưởng đến bất kỳ hành vi hoặc thông báo lỗi nào của các case khác (Self-purchase, Duplicate order, Invalid coupon, Course not found).

---

## 6. KẾT LUẬN & FINAL STATUS

Lỗi nghiệp vụ cho phép mua hoặc đăng ký miễn phí khóa học đã bị xóa mềm (`isDestroyed = true`) hoặc chưa duyệt (`status = PENDING`) đã được khắc phục triệt để tại Service Layer. Tất cả 9 kịch bản bắt buộc và các bài test hồi quy đều đạt kết quả 100% mà không gây side-effect hay thay đổi schema cơ sở dữ liệu.

**Trạng thái nghiệm thu:**
# `FIXED — ALL TESTS PASSED`
