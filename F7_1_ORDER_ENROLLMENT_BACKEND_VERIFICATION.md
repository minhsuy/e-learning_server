# F7.1 — ORDER & ENROLLMENT BACKEND VERIFICATION REPORT

> **Execution Date/Time**: 2026-10-12  
> **Target System**: TMDEMY E-Learning Backend (Node.js / Express.js / TypeScript / PostgreSQL 16.11 / Prisma ORM 6.4.1)  
> **Scope**: Audit Only — Order, Enrollment, Course Access, Coupon, and Progress Subsystems  
> **Purpose**: Verification and Contract Baseline for Frontend Integration  

---

## 1. BACKEND STRUCTURE DISCOVERED

Dựa trên việc quét mã nguồn thực tế tại hệ thống backend TMDEMY, kiến trúc phân tầng liên quan trực tiếp đến phân hệ **Order, Enrollment, Coupon, Progress & Course Access** được tổ chức như sau:

```text
HTTP Request
  ├── Routes:
  │     ├── src/routes/order.route.ts          (/api/orders)
  │     ├── src/routes/enrollment.route.ts     (/api/enrollments)
  │     ├── src/routes/coupon.route.ts         (/api/coupons)
  │     ├── src/routes/progress.route.ts       (/api/progress)
  │     ├── src/routes/course.route.ts         (/api/courses)
  │     └── src/routes/lesson.route.ts         (/api/lessons)
  ├── Middlewares & Express Validators:
  │     ├── src/middlewares/order.middleware.ts
  │     ├── src/middlewares/coupon.middleware.ts
  │     ├── src/middlewares/progress.middleware.ts
  │     ├── src/middlewares/course.middleware.ts
  │     ├── src/middlewares/lesson.middleware.ts
  │     ├── src/middlewares/verifyToken.ts     (verifyAccessToken)
  │     └── src/middlewares/verifyRole.ts      (isAdmin, isTeacher, isTeacherOrAdmin)
  ├── Controllers:
  │     ├── src/controller/order.controller.ts
  │     ├── src/controller/enrollment.controller.ts
  │     ├── src/controller/coupon.controller.ts
  │     ├── src/controller/progress.controller.ts
  │     ├── src/controller/course.controller.ts
  │     └── src/controller/lesson.controller.ts
  ├── Services (Business Logic & Boundaries):
  │     ├── src/services/order.service.ts
  │     ├── src/services/enrollment.service.ts
  │     ├── src/services/coupon.service.ts
  │     ├── src/services/progress.service.ts
  │     ├── src/services/course.service.ts
  │     └── src/services/lesson.service.ts
  ├── Functional Repositories (Prisma Client Singleton):
  │     ├── src/repositories/order.repository.ts
  │     ├── src/repositories/enrollment.repository.ts
  │     ├── src/repositories/coupon.repository.ts
  │     ├── src/repositories/progress.repository.ts
  │     ├── src/repositories/course.repository.ts
  │     └── src/repositories/lesson.repository.ts
  ├── Zod Application Domain Models:
  │     ├── src/models/order.model.ts
  │     ├── src/models/enrollment.model.ts
  │     ├── src/models/coupon.model.ts
  │     └── src/models/progress.model.ts
  └── Database (PostgreSQL 16.11 / prisma/schema.prisma):
        ├── Table `orders`
        ├── Table `coupons` & `coupon_courses`
        ├── Table `enrollments`
        └── Table `progress`
```

---

## 2. ORDER API CONTRACT

### 2.1. API: Tạo Order (`createOrder`)
* **Endpoint**: `POST /api/orders`
* **File tham chiếu**:
  * Route: [`src/routes/order.route.ts:L16`](file:///d:/e-learning_server/src/routes/order.route.ts#L16)
  * Middleware: [`src/middlewares/order.middleware.ts:L5-L13`](file:///d:/e-learning_server/src/middlewares/order.middleware.ts#L5-L13)
  * Controller: [`src/controller/order.controller.ts:L10-L19`](file:///d:/e-learning_server/src/controller/order.controller.ts#L10-L19) (`createOrderController`)
  * Service: [`src/services/order.service.ts:L81-L231`](file:///d:/e-learning_server/src/services/order.service.ts#L81-L231) (`createOrderService`)
* **Authentication & Authorization**: Bắt buộc `verifyAccessToken` (Bất kỳ user đã đăng nhập, không yêu cầu role cụ thể).
* **Request Body**:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "couponCode": "SALE20" // optional
  }
  ```
  *(Lưu ý: Không gửi trường `amount` hay `total`. Backend hoàn toàn tự tính giá).*
* **Cơ chế tính giá (Pricing Logic)**:
  1. Backend đọc `course.price` từ PostgreSQL (`courses` table).
  2. Nếu có `couponCode`: Backend tra cứu trong bảng `coupons` kèm điều kiện hợp lệ.
     - `PERCENTAGE`: `discount = (coursePrice * couponValue) / 100`
     - `NUMBER`: `discount = couponValue`
  3. `total = Math.max(coursePrice - discount, 0)`.
  4. Nếu `total === 0` (Khóa học miễn phí hoặc giảm 100%): Order được gán `status = COMPLETED` ngay lập tức!
  5. Nếu `total > 0`: Order được gán `status = PENDING`.
* **Điều kiện tạo Order thành công**:
  1. `courseId` là UUID hợp lệ RFC 4122.
  2. Course tồn tại trong PostgreSQL (`findCourseById`).
  3. Course không bị xóa mềm (`course.isDestroyed === false`).
  4. Course không ở trạng thái chờ duyệt (`course.status !== PENDING`).
  5. User không phải là tác giả của khóa học (`course.authorId !== userId`).
  6. User chưa sở hữu khóa học qua Order đã hoàn thành (`checkExistingCompletedOrder`).
  7. User chưa có Order ở trạng thái PENDING cho khóa học này (`checkExistingPendingOrder`).
  8. Nếu có coupon: Coupon phải active, trong thời gian hiệu lực (`startDate <= now <= endDate`), chưa hết lượt (`used < limit`), và nếu coupon giới hạn danh sách khóa học thì `courseId` phải thuộc danh sách đó.
* **Quy tắc tạo Enrollment & Sold count**:
  - **Khi Order PENDING (`total > 0`)**: **KHÔNG tạo Enrollment**, không tăng `sold`, không tăng `coupon.used`.
  - **Khi Order COMPLETED ngay (`total === 0`)**: Trong cùng 1 `prisma.$transaction`:
    - Tạo `order` (status `COMPLETED`).
    - Gọi `incrementCourseSoldCount(courseId, 1, tx)`.
    - Gọi `upsertEnrollment(userId, courseId, { progress: 0, status: 'ACTIVE' }, tx)`.
    - Gọi `incrementCouponUsed(coupon.id, 1, tx)` (nếu có coupon).
* **HTTP Status & Response JSON**:
  * **Success (HTTP 201 Created)**:
    ```json
    {
      "success": true,
      "statusCode": 201,
      "message": "Order created successfully",
      "data": {
        "id": "c8433382-29c0-556a-ad7b-8086161f2179",
        "_id": "c8433382-29c0-556a-ad7b-8086161f2179",
        "code": "DH-2451940",
        "amount": 199.99,
        "discount": 0,
        "total": 199.99,
        "status": "PENDING", // hoặc "COMPLETED" nếu total = 0
        "couponId": null,
        "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
        "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
        "createdAt": "2026-10-12T12:00:00.000Z",
        "updatedAt": "2026-10-12T12:00:00.000Z",
        "course": {
          "id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "_id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "title": "Fullstack Web Development",
          "slug": "fullstack-web-development",
          "image": "https://...",
          "price": 199.99
        },
        "coupon": null,
        "user": {
          "id": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
          "_id": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
          "username": "student1",
          "email": "student1@example.com"
        }
      }
    }
    ```
  * **Error Cases**:
    - `400 Bad Request`: "Invalid Course ID"
    - `400 Bad Request`: "Course is deleted or no longer available"
    - `400 Bad Request`: "Course is pending approval and cannot be ordered"
    - `400 Bad Request`: "You cannot buy your own course"
    - `400 Bad Request`: "You already enrolled in this course"
    - `400 Bad Request`: "You already have a pending order for this course" (kèm data order pending hiện tại)
    - `400 Bad Request`: "Coupon has not started yet" / "Coupon has expired" / "Coupon usage limit reached" / "Coupon not valid for this course"
    - `401 Unauthorized`: "Invalid user" / Token thiếu hoặc hết hạn.
    - `404 Not Found`: "Course not found" / "Coupon not found or inactive".

---

### 2.2. API: Lấy danh sách Order của Student (`getMyOrders`)
* **Endpoint**: `GET /api/orders/my`
* **File tham chiếu**:
  * Route: [`src/routes/order.route.ts:L19`](file:///d:/e-learning_server/src/routes/order.route.ts#L19)
  * Controller: [`src/controller/order.controller.ts:L23-L36`](file:///d:/e-learning_server/src/controller/order.controller.ts#L23-L36) (`getMyOrdersController`)
  * Service: [`src/services/order.service.ts:L236-L279`](file:///d:/e-learning_server/src/services/order.service.ts#L236-L279) (`getMyOrdersService`)
  * Repository: [`src/repositories/order.repository.ts:L189-L232`](file:///d:/e-learning_server/src/repositories/order.repository.ts#L189-L232) (`findMyOrders`, `countMyOrders`)
* **Authentication & Authorization**: Bắt buộc `verifyAccessToken`.
* **Query Parameters**:
  * `page` (optional, default: `1`)
  * `limit` (optional, default: `10`)
  * `status` (optional: `PENDING`, `COMPLETED`, `REJECTED`)
* **Response JSON (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched my orders successfully",
    "data": {
      "orders": [
        {
          "id": "5e4ed149-77cc-55e2-bf42-204f30a2fd22",
          "_id": "5e4ed149-77cc-55e2-bf42-204f30a2fd22",
          "code": "DH-2464723",
          "amount": 199.99,
          "discount": 0,
          "total": 199.99,
          "status": "COMPLETED",
          "couponId": null,
          "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
          "createdAt": "2026-10-12T12:00:00.000Z",
          "updatedAt": "2026-10-12T12:00:00.000Z",
          "course": {
            "id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
            "_id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
            "title": "Fullstack Web Development",
            "slug": "fullstack-web-development",
            "image": "https://...",
            "price": 199.99
          },
          "coupon": null,
          "user": {
            "id": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
            "_id": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
            "username": "student1",
            "email": "student1@example.com"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

---

### 2.3. API: Lấy chi tiết Order (`getOrderDetail`) — [AUDIT GAP: KHÔNG TỒN TẠI]
* **Kết luận kiểm tra**: **Backend KHÔNG CÓ endpoint `GET /api/orders/:id`**.
* **Bằng chứng mã nguồn**:
  - Trong [`src/routes/order.route.ts`](file:///d:/e-learning_server/src/routes/order.route.ts), chỉ có:
    - `POST /api/orders`
    - `GET /api/orders/my`
    - `PUT /api/orders/:id`
    - `GET /api/orders`
  - Function `findOrderById` trong [`src/repositories/order.repository.ts`](file:///d:/e-learning_server/src/repositories/order.repository.ts#L125) chỉ được gọi nội bộ bên trong `updateOrderStatusService`.
* **Khuyến nghị cho Frontend**: Để hiển thị thông tin 1 đơn hàng (ví dụ trang Order Success), Frontend lấy thông tin từ response trả về của `POST /api/orders` hoặc lọc từ danh sách `GET /api/orders/my`.

---

### 2.4. API: Teacher / Admin Duyệt hoặc Từ chối Order (`updateOrderStatus`)
* **Endpoint**: `PUT /api/orders/:id`
* **File tham chiếu**:
  * Route: [`src/routes/order.route.ts:L22-L29`](file:///d:/e-learning_server/src/routes/order.route.ts#L22-L29)
  * Middleware: [`src/middlewares/order.middleware.ts:L23-L37`](file:///d:/e-learning_server/src/middlewares/order.middleware.ts#L23-L37) (`updateOrderStatusValidator`)
  * Controller: [`src/controller/order.controller.ts:L39-L46`](file:///d:/e-learning_server/src/controller/order.controller.ts#L39-L46) (`updateOrderStatusController`)
  * Service: [`src/services/order.service.ts:L285-L475`](file:///d:/e-learning_server/src/services/order.service.ts#L285-L475) (`updateOrderStatusService`)
* **Authentication & Authorization**: `verifyAccessToken` + `isTeacherOrAdmin` (Role `ADMIN` hoặc `TEACHER`).
  - Nếu là `TEACHER`: Bắt buộc phải là giảng viên sở hữu khóa học (`course.authorId === userId`). Nếu không -> HTTP 403 Forbidden ("You are not the owner of this course").
* **Request Params**: `id` (Order UUID)
* **Request Body**:
  ```json
  {
    "status": "COMPLETED" // hoặc "REJECTED"
  }
  ```

#### Trường hợp Duyệt Order (`status: "COMPLETED"`):
* **Hành vi nghiệp vụ trong Transaction** ([`src/services/order.service.ts:L406-L420`](file:///d:/e-learning_server/src/services/order.service.ts#L406-L420)):
  1. Tăng lượt bán khóa học: `incrementCourseSoldCount(order.courseId, 1, tx)`.
  2. Tạo/Kích hoạt Enrollment: `upsertEnrollment(order.userId, order.courseId, { progress: 0, status: 'ACTIVE' }, tx)`.
  3. Tăng số lần sử dụng coupon (nếu order có coupon): `incrementCouponUsed(order.couponId, 1, tx)`.
  4. Cập nhật Order status thành `COMPLETED`: `updateOrderStatus(orderId, EOrderStatus.COMPLETED, tx)`.
* **Hành vi ngoài Transaction**:
  1. Tự động thêm học viên vào nhóm Chat Socket.IO của khóa học (`findCourseGroupConversation` / `addParticipant`).
  2. Bắn thông báo Push Notification tới học viên: `"Đơn hàng \"...\" của bạn đã được hoàn tất !"`.
* **Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Order completed successfully!",
    "data": {
      "id": "c8433382-29c0-556a-ad7b-8086161f2179",
      "_id": "c8433382-29c0-556a-ad7b-8086161f2179",
      "code": "DH-2451940",
      "amount": 199.99,
      "discount": 0,
      "total": 199.99,
      "status": "COMPLETED",
      "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
      "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
      "course": { ... },
      "coupon": null,
      "user": { ... }
    }
  }
  ```

#### Trường hợp Từ chối Order (`status: "REJECTED"`):
* **Hành vi nghiệp vụ ĐẶC BIỆT (Hard Delete)** ([`src/services/order.service.ts:L381-L400`](file:///d:/e-learning_server/src/services/order.service.ts#L381-L400)):
  > [!IMPORTANT]
  > **Bảo toàn cơ chế Legacy MongoDB**: Khi Order bị chuyển sang `REJECTED`, backend thực thi **XÓA BỎNG VẬT LÝ (HARD DELETE)** bản ghi Order khỏi cơ sở dữ liệu (`deleteOrderById(orderId, tx)`), đồng thời:
  > - Nếu Order trước đó đã từng `COMPLETED`: Thu hồi `sold` (`-1`), xóa Enrollment (`deleteEnrollment`), giảm `coupon.used` (`-1`).
  > - Nếu Order đang `PENDING`: Chỉ xóa bản ghi Order, không có Enrollment nào bị ảnh hưởng.
* **Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Order rejected and deleted successfully!"
  }
  ```
  *(Lưu ý: Không có trường `data` vì bản ghi Order đã bị xóa khỏi database).*
* **Hệ quả đối với Quyền học và Student UI**:
  - Học viên không được cấp quyền học (không có Enrollment).
  - Khi học viên gọi lại `GET /api/orders/my`, Order này **không còn xuất hiện** nữa.
  - Học viên hoàn toàn có thể thực hiện tạo lại Order mới cho khóa học này.

---

### 2.5. API: Teacher / Admin Lấy danh sách toàn bộ Order (`getOrders`)
* **Endpoint**: `GET /api/orders`
* **File tham chiếu**: [`src/routes/order.route.ts:L33-L40`](file:///d:/e-learning_server/src/routes/order.route.ts#L33-L40), [`src/services/order.service.ts:L480-L538`](file:///d:/e-learning_server/src/services/order.service.ts#L480-L538)
* **Role**: `TEACHER` hoặc `ADMIN`.
  - Nếu là `TEACHER`: Tự động lọc chỉ hiển thị các đơn hàng của những khóa học do giảng viên này tạo (`teacherCourseIds`).
* **Query Params**: `page`, `limit`, `search` (tìm theo mã order, tên course, username), `status` (`pending`, `completed`, `rejected`), `sortBy` (`createdAt`, `updatedAt`, `total`).

---

## 3. ENROLLMENT API CONTRACT

### 3.1. API: Lấy danh sách khóa học đã đăng ký của Student (`getMyEnrollments`)
* **Endpoint**: `GET /api/enrollments/my`
* **File tham chiếu**:
  * Route: [`src/routes/enrollment.route.ts:L16-L17`](file:///d:/e-learning_server/src/routes/enrollment.route.ts#L16-L17)
  * Controller: [`src/controller/enrollment.controller.ts:L10-L16`](file:///d:/e-learning_server/src/controller/enrollment.controller.ts#L10-L16) (`getMyEnrollmentsController`)
  * Service: [`src/services/enrollment.service.ts:L28-L43`](file:///d:/e-learning_server/src/services/enrollment.service.ts#L28-L43) (`getMyEnrollmentsService`)
  * Repository: [`src/repositories/enrollment.repository.ts:L201-L212`](file:///d:/e-learning_server/src/repositories/enrollment.repository.ts#L201-L212) (`findEnrollmentsByUserId`)
* **Authentication**: Bắt buộc `verifyAccessToken`.
* **Response JSON (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched enrolled courses successfully",
    "data": [
      {
        "id": "3acb5ff8-859b-58c9-a3b6-ff56e45ab790",
        "_id": "3acb5ff8-859b-58c9-a3b6-ff56e45ab790",
        "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
        "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
        "progress": 45,
        "status": "ACTIVE", // EEnrollmentStatus: ACTIVE | COMPLETED | CANCELED
        "enrolledAt": "2026-10-10T08:30:00.000Z",
        "completedAt": null,
        "course": {
          "id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "_id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "title": "ReactJS Advanced",
          "slug": "reactjs-advanced",
          "image": "https://...",
          "price": 199.99,
          "level": "INTERMEDIATE",
          "type": "PAID",
          "sold": 15,
          "view": 120
        }
      }
    ]
  }
  ```

---

### 3.2. Vòng đời & Ràng buộc của Enrollment
* **Enrollment được tạo trong các trường hợp nào?**
  1. Khi người dùng mua khóa học miễn phí hoặc giảm giá 100% qua `createOrderService`: Order thành công với `total === 0` $\rightarrow$ gọi `upsertEnrollment` với `progress: 0, status: 'ACTIVE'`.
  2. Khi Teacher hoặc Admin duyệt Order thủ công sang `COMPLETED` qua `updateOrderStatusService` $\rightarrow$ gọi `upsertEnrollment` với `progress: 0, status: 'ACTIVE'`.
  *(Không có API cho học viên tự gọi tạo Enrollment trực tiếp).*
* **Unique Constraint**:
  - Prisma Schema: `@@unique([userId, courseId])` trên bảng `enrollments` ([`prisma/schema.prisma:L463`](file:///d:/e-learning_server/prisma/schema.prisma#L463)).
  - Mỗi User chỉ có duy nhất 1 bản ghi Enrollment cho mỗi Course. Khi mua lại, hệ thống sử dụng `upsert` để cập nhật `enrolledAt`.
* **Trạng thái Enrollment (Enum `EEnrollmentStatus`)**:
  - `ACTIVE`: Đang theo học.
  - `COMPLETED`: Đã hoàn thành 100% số bài học (`progress === 100`).
  - `CANCELED`: Đã bị hủy (hoặc bị xóa khi kick khỏi lớp).
* **Làm thế nào xác định một Student đã có quyền học khóa học?**
  - **Không có API `GET /api/enrollments/:courseId` riêng lẻ**.
  - Student có quyền học khi tồn tại bản ghi trong bảng `enrollments` với `userId` và `courseId` tương ứng (`findEnrollmentByUserAndCourse`).
  - Phía Client xác định bằng cách:
    - Gọi `GET /api/enrollments/my` và kiểm tra xem danh sách có phần tử nào chứa `courseId` (hoặc `course.id`) khớp không.
    - Hoặc kiểm tra xem `GET /api/orders/my` có Order với `status === 'COMPLETED'` cho khóa học đó không.

---

### 3.3. API: Teacher / Admin Xóa Học viên Khỏi Lớp (`removeStudentFromCourse`)
* **Endpoint**: `DELETE /api/enrollments/course/:id/:userId`
* **File tham chiếu**: [`src/routes/enrollment.route.ts:L29-L37`](file:///d:/e-learning_server/src/routes/enrollment.route.ts#L29-L37), [`src/services/enrollment.service.ts:L112-L171`](file:///d:/e-learning_server/src/services/enrollment.service.ts#L112-L171)
* **Role**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.
* **Hành vi**: Thực hiện trong transaction: Xóa `enrollment`, giảm `course.sold` (`-1`), và xóa toàn bộ `order` liên quan của học viên đó đối với khóa học này.

---

## 4. COURSE ACCESS RULES & MATRIX

Dưới đây là ma trận quyền truy cập chi tiết được truy vết trực tiếp từ logic kiểm tra trong mã nguồn backend (`src/routes`, `src/services`):

| Trạng thái Người dùng | Xem Course Landing / Syllabus (`GET /api/courses/:slug`) | Xem Demo Lesson Content / Video | Xem Normal Lesson Content / Video (`GET /api/lessons/chapter/:chapterId`) | Gọi Progress / Hoàn thành bài học (`POST /api/progress/complete`) | Submit Quiz (`POST /api/submissions`) | Đánh giá Khóa học (`POST /api/ratings`) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Guest (Chưa đăng nhập)** | ✅ **CHO PHÉP** (Không có video/content) | ✅ **CHO PHÉP** | ⚠️ **BACKEND KHÔNG CHẶN Ở TẦNG API** (Chỉ Frontend chặn) | ❌ **401 Unauthorized** (Thiếu Token) | ❌ **401 Unauthorized** (Thiếu Token) | ❌ **401 Unauthorized** (Thiếu Token) |
| **Logged-in (Chưa đăng ký)** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ⚠️ **BACKEND KHÔNG CHẶN Ở TẦNG API** | ❌ **403 Forbidden** ("You are not enrolled in this course") | ❌ **403 Forbidden** ("You are not enrolled in this course") | ❌ **403 Forbidden** ("You are not enrolled in this course") |
| **Order PENDING** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ⚠️ **BACKEND KHÔNG CHẶN Ở TẦNG API** | ❌ **403 Forbidden** (Chưa có Enrollment) | ❌ **403 Forbidden** (Chưa có Enrollment) | ❌ **403 Forbidden** (Chưa có Enrollment) |
| **Order REJECTED** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ⚠️ **BACKEND KHÔNG CHẶN Ở TẦNG API** | ❌ **403 Forbidden** (Không có Enrollment) | ❌ **403 Forbidden** (Không có Enrollment) | ❌ **403 Forbidden** (Không có Enrollment) |
| **Enrollment ACTIVE** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** (HTTP 200) | ✅ **CHO PHÉP** (HTTP 201) | ✅ **CHO PHÉP** (HTTP 201) |
| **Enrollment COMPLETED** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** (HTTP 200) | ❌ **400 Bad Request** (Chỉ cho nộp quiz 1 lần) | ✅ **CHO PHÉP** (Nếu chưa rate) |
| **Course Author (Giảng viên tạo khóa)** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ❌ **403 Forbidden** (Nếu chưa tự enroll) | ❌ **403 Forbidden** (Nếu chưa tự enroll) | ❌ **403 Forbidden** (Không được tự rate) |
| **Admin** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ✅ **CHO PHÉP** | ❌ **403 Forbidden** (Nếu chưa có enrollment) | ❌ **403 Forbidden** (Nếu chưa có enrollment) | ❌ **403 Forbidden** (Nếu chưa có enrollment) |

### Phân tích chi tiết cơ chế bảo vệ nội dung Lesson:
1. **API Course Detail (`GET /api/courses/:slug`)**:
   - Sử dụng projection `COURSE_DETAIL_SELECT` ([`src/repositories/course.repository.ts:L129-L138`](file:///d:/e-learning_server/src/repositories/course.repository.ts#L129-L138)).
   - Chỉ trả về danh sách bài học với các trường công khai: `{ id, title, slug, duration, isDemo, order, type }`.
   - **Tuyệt đối không để lộ `videoUrl` và `content`** trong payload chi tiết khóa học.
2. **API Lấy bài học theo chương (`GET /api/lessons/chapter/:chapterId`)**:
   - Endpoint này sử dụng `LESSON_STUDY_SELECT` ([`src/repositories/lesson.repository.ts:L35-L50`](file:///d:/e-learning_server/src/repositories/lesson.repository.ts#L35-L50)) trả về đầy đủ `videoUrl` và `content`.
   - **Tuy nhiên, route này hiện KHÔNG gắn `verifyAccessToken` hay kiểm tra Enrollment**.
   - Do đó, việc ẩn nội dung với bài học thường (`isDemo: false`) và chỉ mở khi học viên đã đăng ký đang được kiểm soát bởi **Frontend UI Logic**.
3. **Các tính năng nghiệp vụ học tập (Learning Actions)**:
   - Các API tương tác thực sự như `POST /api/progress/complete`, `POST /api/submissions`, `POST /api/ratings`, `POST /api/comments` **được bảo vệ nghiêm ngặt 100% ở tầng Backend**: Bắt buộc kiểm tra `findEnrollmentByUserAndCourse(userId, courseId)`. Nếu không có enrollment, backend từ chối với **HTTP 403 Forbidden**.

---

## 5. COUPON API CONTRACT

### 5.1. API Kiểm tra & Áp dụng Coupon (`checkCoupon`)
* **Endpoint**: `POST /api/coupons/use`
  > [!WARNING]
  > **Lưu ý Endpoint**: Trong [`src/routes/coupon.route.ts:L60`](file:///d:/e-learning_server/src/routes/coupon.route.ts#L60), comment ghi `// CHECK COUPON : POST /api/coupons/check` nhưng route thực tế được đăng ký là:
  > ```typescript
  > couponRouter.post('/use', verifyAccessToken, checkCouponValidator, handleValidationErrors, checkCouponController)
  > ```
  > **Frontend bắt buộc phải gọi `POST /api/coupons/use`**, không gọi `/api/coupons/check`.
* **File tham chiếu**:
  * Route: [`src/routes/coupon.route.ts:L60`](file:///d:/e-learning_server/src/routes/coupon.route.ts#L60)
  * Middleware: [`src/middlewares/coupon.middleware.ts:L62-L69`](file:///d:/e-learning_server/src/middlewares/coupon.middleware.ts#L62-L69)
  * Controller: [`src/controller/coupon.controller.ts:L47-L51`](file:///d:/e-learning_server/src/controller/coupon.controller.ts#L47-L51)
  * Service: [`src/services/coupon.service.ts:L283-L354`](file:///d:/e-learning_server/src/services/coupon.service.ts#L283-L354) (`checkCouponService`)
* **Authentication**: Bắt buộc `verifyAccessToken`.
* **Request Body**:
  ```json
  {
    "code": "SALE20",
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a"
  }
  ```
* **Quy tắc kiểm tra hợp lệ của Coupon**:
  1. `courseId` là UUID hợp lệ.
  2. Coupon tồn tại theo `code` và `active === true`.
  3. `startDate`: Nếu có, `startDate <= now` (nếu chưa tới ngày bắt đầu $\rightarrow$ lỗi 400 "Coupon has not started yet").
  4. `endDate`: Nếu có, `endDate >= now` (nếu đã qua ngày kết thúc $\rightarrow$ lỗi 400 "Coupon has expired").
  5. `limit`: Nếu có, `used < limit` (nếu đã hết lượt $\rightarrow$ lỗi 400 "Coupon usage limit reached").
  6. Khóa học áp dụng: Nếu `coupon.courses` không rỗng, `courseId` phải nằm trong danh sách được chỉ định (nếu không $\rightarrow$ lỗi 400 "Coupon not valid for this course").
  7. Khóa học tồn tại trong database (`findCourseById`).
* **Công thức tính giảm giá**:
  ```typescript
  const coursePrice = Number(course.price)
  const couponValue = Number(coupon.value)
  let discount = 0

  if (coupon.type === 'PERCENTAGE') {
    discount = (coursePrice * couponValue) / 100
  } else {
    discount = couponValue
  }
  const finalPrice = Math.max(coursePrice - discount, 0)
  ```
* **Response JSON (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Coupon is valid",
    "data": {
      "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
      "coursePrice": 100,
      "discount": 20,
      "finalPrice": 80,
      "coupon": {
        "_id": "9ab7f90b-1b48-5f58-a8b0-074bfb524cc4",
        "id": "9ab7f90b-1b48-5f58-a8b0-074bfb524cc4",
        "title": "FullStack Mern 25%",
        "code": "SALE20",
        "type": "PERCENTAGE", // hoặc "NUMBER"
        "value": 20
      }
    }
  }
  ```

### 5.2. Có cần gửi `couponCode` khi tạo Order không?
* **CÓ**. Trong `POST /api/orders`, Frontend cần gửi:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "couponCode": "SALE20"
  }
  ```
* **Backend có tính toán lại coupon khi tạo Order không?**
  * **CÓ, BACKEND TÍNH TOÁN LẠI 100%**.
  * Backend không tin cậy bất kỳ giá tiền hoặc số tiền giảm giá nào do Frontend truyền lên.
  * Trong `createOrderService` ([`src/services/order.service.ts:L143-L178`](file:///d:/e-learning_server/src/services/order.service.ts#L143-L178)), backend thực hiện truy vấn trực tiếp lại vào database, kiểm tra toàn bộ điều kiện hợp lệ và tính toán lại `discount`, `amount`, `total`.
  * Nếu coupon không hợp lệ tại thời điểm tạo order (ví dụ vừa hết hạn hoặc vừa hết lượt), API tạo order sẽ trả về lỗi HTTP 400 tương ứng.

---

## 6. PROGRESS API CONTRACT

### 6.1. API: Đánh dấu hoàn thành bài học (`markLessonComplete`)
* **Endpoint**: `POST /api/progress/complete`
* **File tham chiếu**:
  * Route: [`src/routes/progress.route.ts:L17-L23`](file:///d:/e-learning_server/src/routes/progress.route.ts#L17-L23)
  * Controller: [`src/controller/progress.controller.ts:L9-L15`](file:///d:/e-learning_server/src/controller/progress.controller.ts#L9-L15)
  * Service: [`src/services/progress.service.ts:L23-L93`](file:///d:/e-learning_server/src/services/progress.service.ts#L23-L93)
* **Authentication**: Bắt buộc `verifyAccessToken`.
* **Request Body**:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "lessonId": "60b278f7-1793-5be8-96c6-c13980fe027f"
  }
  ```
* **Điều kiện thực hiện**:
  1. Lesson tồn tại và thuộc về `courseId`.
  2. Course tồn tại.
  3. **Học viên bắt buộc phải có Enrollment trong khóa học** (`findEnrollmentByUserAndCourse`). Nếu không có $\rightarrow$ **HTTP 403 Forbidden** ("You are not enrolled in this course").
* **Cách tính phần trăm & cập nhật**:
  1. `upsertProgress({ userId, courseId, lessonId, completed: true })`.
  2. Đếm tổng bài học: `totalLessons = await countLessons({ courseId })`.
  3. Đếm bài học đã hoàn thành: `completedLessons = await countCompletedLessons(userId, courseId)`.
  4. `percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0`.
  5. Cập nhật `enrollment.progress = percent`.
  6. **Khi nào Enrollment chuyển sang `COMPLETED`?**:
     - Khi `percent === 100`, backend tự động cập nhật `enrollment.status = COMPLETED` và gán `completedAt = new Date()`.
  7. Tự động cộng Gamification XP (`awardLessonCompletionXP`) và duy trì Streak học tập (`recordLearningActivityStreak`) nếu bài học chưa từng được hoàn thành trước đó.
* **Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lesson marked as completed",
    "data": {
      "progress": 67
    }
  }
  ```

---

### 6.2. API: Hủy đánh dấu hoàn thành bài học (`unmarkLessonComplete`)
* **Endpoint**: `POST /api/progress/uncomplete`
* **File tham chiếu**:
  * Route: [`src/routes/progress.route.ts:L26-L32`](file:///d:/e-learning_server/src/routes/progress.route.ts#L26-L32)
  * Controller: [`src/controller/progress.controller.ts:L19-L25`](file:///d:/e-learning_server/src/controller/progress.controller.ts#L19-L25)
  * Service: [`src/services/progress.service.ts:L95-L147`](file:///d:/e-learning_server/src/services/progress.service.ts#L95-L147)
* **Authentication**: Bắt buộc `verifyAccessToken`.
* **Request Body**:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "lessonId": "60b278f7-1793-5be8-96c6-c13980fe027f"
  }
  ```
* **Cơ chế Rollback trạng thái**:
  - Cập nhật `progress.completed = false`.
  - Tính lại `percent`.
  - Nếu trước đó `enrollment.status === 'COMPLETED'` và `percent < 100`, backend tự động revert trạng thái enrollment về lại `ACTIVE` và gán `completedAt = null`.
* **Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lesson unmarked as completed",
    "data": {
      "progress": 50
    }
  }
  ```

---

### 6.3. API: Lấy tiến độ học tập khóa học (`getProgressByCourse`)
* **Endpoint**: `GET /api/progress/:courseId`
* **File tham chiếu**:
  * Route: [`src/routes/progress.route.ts:L35-L41`](file:///d:/e-learning_server/src/routes/progress.route.ts#L35-L41)
  * Controller: [`src/controller/progress.controller.ts:L28-L33`](file:///d:/e-learning_server/src/controller/progress.controller.ts#L28-L33)
  * Service: [`src/services/progress.service.ts:L149-L186`](file:///d:/e-learning_server/src/services/progress.service.ts#L149-L186)
* **Authentication**: Bắt buộc `verifyAccessToken`.
* **Đặc điểm kiểm tra quyền**:
  - API này chỉ lấy danh sách bài học và map với các bản ghi hoàn thành của user.
  - **Không chặn HTTP 403 nếu user chưa enroll**: Nếu user chưa học bài nào, API trả về `percent: 0` và danh sách bài học với `completed: false`.
* **Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched course progress successfully",
    "data": {
      "totalLessons": 3,
      "completedLessons": 2,
      "percent": 67,
      "lessons": [
        {
          "_id": "60b278f7-1793-5be8-96c6-c13980fe027f",
          "id": "60b278f7-1793-5be8-96c6-c13980fe027f",
          "title": "Giới thiệu TypeScript",
          "order": 1,
          "completed": true
        },
        {
          "_id": "2d535d8f-0ac6-50a3-b86c-30fc54eeab8a",
          "id": "2d535d8f-0ac6-50a3-b86c-30fc54eeab8a",
          "title": "Cài đặt môi trường",
          "order": 2,
          "completed": true
        },
        {
          "_id": "9f5caf0c-d3e8-5c12-9680-4c7c252f82e6",
          "id": "9f5caf0c-d3e8-5c12-9680-4c7c252f82e6",
          "title": "Thực hành Type Interface",
          "order": 3,
          "completed": false
        }
      ]
    }
  }
  ```

---

## 7. TRANSACTION ANALYSIS

Hệ thống sử dụng `prisma.$transaction(async (tx) => { ... })` cho toàn bộ các thao tác ghi dữ liệu đa thực thể:

### 7.1. Phân tích chi tiết các khối giao dịch
1. **Tạo Order Miễn phí / Giảm giá 100% (`createOrderService`)**:
   - Scope transaction: `createOrder` $\rightarrow$ `incrementCourseSoldCount` $\rightarrow$ `upsertEnrollment` $\rightarrow$ `incrementCouponUsed`.
   - Đảm bảo tính nguyên tử: Nếu lỗi ở bước tạo Enrollment, Order sẽ rollback hoàn toàn; số lượt bán và lượt dùng coupon không bị tăng sai.
2. **Duyệt Order (`updateOrderStatusService` - `COMPLETED`)**:
   - Scope transaction: `incrementCourseSoldCount` $\rightarrow$ `upsertEnrollment` $\rightarrow$ `incrementCouponUsed` $\rightarrow$ `updateOrderStatus`.
   - Đồng bộ tuyệt đối giữa trạng thái đơn hàng và quyền học của học viên.
3. **Từ chối Order (`updateOrderStatusService` - `REJECTED`)**:
   - Scope transaction: Rollback `sold` (nếu từng COMPLETED) $\rightarrow$ `deleteEnrollment` $\rightarrow$ Rollback `coupon.used` $\rightarrow$ `deleteOrderById`.
   - Nếu xảy ra lỗi giữa chừng, toàn bộ thay đổi được phục hồi nguyên trạng.
4. **Xóa học viên khỏi lớp (`removeStudentFromCourseService`)**:
   - Scope transaction: `deleteEnrollment` $\rightarrow$ `incrementCourseSoldCount(-1)` $\rightarrow$ `tx.order.deleteMany({ userId, courseId })`.

### 7.2. Phân tích Duplicate Request & Race Condition
* **Duplicate Order Creation**:
  - Tại tầng Application: Backend kiểm tra `checkExistingCompletedOrder` và `checkExistingPendingOrder` trước khi gọi transaction.
  - Tại tầng Database: Bảng `orders` hiện chỉ có `@@index([userId, courseId, status])`, **chưa có unique constraint cứng trên cặp `(userId, courseId)`**. Do đó, nếu có 2 request tạo đơn gửi đến cùng 1 mili-giây, cả 2 có thể cùng vượt qua bước check trước transaction. Tuy nhiên, bảng `enrollments` có `@@unique([userId, courseId])`, nên nếu là đơn miễn phí thì request thứ 2 sẽ chạm ràng buộc unique của enrollment.
* **Coupon Limit Race Condition**:
  - Backend kiểm tra `coupon.used >= coupon.limit` ở bước đọc dữ liệu, sau đó mới gọi `incrementCouponUsed` trong transaction.
  - Nếu nhiều request đồng thời xảy ra khi `used` tiệm cận `limit`, có khả năng nhiều request cùng đọc điều kiện hợp lệ trước khi counter được tăng.
* **Idempotency Guard**:
  - Hàm `updateOrderStatusService` đã được trang bị bộ kiểm tra idempotency: Nếu đơn hàng đã ở trạng thái mục tiêu (`order.status === targetStatus`), backend dừng xử lý ngay và trả về kết quả thành công mà không chạy lại transaction hay gửi thông báo trùng lặp.

---

## 8. FRONTEND INTEGRATION GUIDE

### 8.1. API Reference Checklist cho Frontend

| Hành động UI | HTTP Method | Endpoint chính xác | Header bắt buộc | Body / Query |
|---|:---:|---|:---:|---|
| **Kiểm tra mã giảm giá** | `POST` | `/api/coupons/use` *(không gọi /check)* | `Authorization: Bearer <token>` | `{"code": "...", "courseId": "..."}` |
| **Đặt mua khóa học** | `POST` | `/api/orders` | `Authorization: Bearer <token>` | `{"courseId": "...", "couponCode": "..."}` |
| **Xem lịch sử đơn hàng của tôi** | `GET` | `/api/orders/my` | `Authorization: Bearer <token>` | Query: `page`, `limit`, `status` |
| **Xem các khóa học đã đăng ký** | `GET` | `/api/enrollments/my` | `Authorization: Bearer <token>` | Không |
| **Lấy tiến độ bài học của khóa** | `GET` | `/api/progress/:courseId` | `Authorization: Bearer <token>` | Route param: `courseId` |
| **Đánh dấu hoàn thành bài học** | `POST` | `/api/progress/complete` | `Authorization: Bearer <token>` | `{"courseId": "...", "lessonId": "..."}` |
| **Hủy hoàn thành bài học** | `POST` | `/api/progress/uncomplete` | `Authorization: Bearer <token>` | `{"courseId": "...", "lessonId": "..."}` |
| **Lấy bài học theo chương** | `GET` | `/api/lessons/chapter/:chapterId` | *(Public)* | Route param: `chapterId` |

---

### 8.2. Trình tự gọi API cho các luồng nghiệp vụ Frontend

#### Luồng 1: Thanh toán & Đăng ký Khóa học (Checkout Flow)
```text
[Frontend: Trang Checkout]
       │
       ├─► (1) [Tùy chọn] Người dùng nhập Coupon
       │         POST /api/coupons/use  {"code": "...", "courseId": "..."}
       │         └── Nhận discount, finalPrice để hiển thị UI preview
       │
       ├─► (2) Người dùng bấm "Xác nhận đặt hàng"
       │         POST /api/orders  {"courseId": "...", "couponCode": "..."}
       │
       ▼
[Nhận Response từ Backend]
       │
       ├─► Nếu `status === 'COMPLETED'` (Khóa học 0đ hoặc 100% coupon):
       │     - Backend đã tự động kích hoạt Enrollment.
       │     - Frontend hiển thị thông báo "Đăng ký thành công!"
       │     - Chuyển hướng học viên vào trang học tập (`/learning/:slug`).
       │
       └─► Nếu `status === 'PENDING'` (Khóa học có phí):
             - Frontend hiển thị trang chờ thanh toán / chuyển khoản kèm mã đơn hàng `data.code`.
             - Hướng dẫn học viên chờ Giảng viên/Admin phê duyệt.
```

#### Luồng 2: Xác định Trạng thái Đăng ký & Nút bấm trên Course Landing Page
Để hiển thị chính xác trạng thái nút bấm (ví dụ: `Mua ngay`, `Đang chờ duyệt`, `Vào học ngay`), Frontend thực hiện đối chiếu dữ liệu theo sơ đồ sau:

```text
                                [User truy cập Course Detail]
                                              │
                                     (Chưa đăng nhập?)
                                    ├── CÓ ──► Trạng thái: NOT_ENROLLED (Hiển thị "Đăng nhập để mua")
                                    └── KHÔNG
                                              │
                       Gọi song song: GET /api/enrollments/my và GET /api/orders/my
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                         ▼
            [Tìm thấy trong enrollments?]              [Tìm thấy trong orders?]
                         │                                         │
        ┌────────────────┴────────────────┐                        │
       CÓ                                KHÔNG                     │
        │                                 │                        │
        ├─► progress === 100              │                        │
        │   ==> ENROLLED_COMPLETED        │                        │
        │   (Hiển thị "Ôn tập / Nhận chứng chỉ")                   │
        │                                 │                        │
        └─► status === 'ACTIVE'           │                        │
            ==> ENROLLED_ACTIVE           │                        │
            (Hiển thị "Tiếp tục học")     ▼                        ▼
                                     [Không có Enrollment] ──► [Kiểm tra Orders]
                                                                   │
                                                ┌──────────────────┴──────────────────┐
                                                │                                     │
                                                ▼                                     ▼
                                       Order status: PENDING                Không có Order PENDING
                                       ==> PENDING                          ==> NOT_ENROLLED
                                       (Hiển thị "Đang chờ duyệt")          (Hiển thị "Mua khóa học")
```

#### Mapping 5 Trạng thái UI Khuyến nghị cho Frontend:
| Trạng thái UI | Dữ liệu Backend thực tế | Hành động của Nút bấm trên UI |
|---|---|---|
| `NOT_ENROLLED` | Không có trong `enrollments` VÀ không có Order nào ở trạng thái `PENDING` trong `orders`. *(Lưu ý: Đơn hàng bị REJECTED đã bị hard-delete nên cũng rơi vào trạng thái này).* | Hiển thị nút **"Mua khóa học"** / **"Đăng ký học"**. |
| `PENDING` | Có Order trong `GET /api/orders/my` với `status === 'PENDING'` cho `courseId` này. | Hiển thị nút **"Đơn hàng đang chờ duyệt"** (Disabled hoặc mở modal chi tiết đơn). |
| `REJECTED` | *(Ghi chú kỹ thuật: Backend xóa bỏ Order bị từ chối khỏi database)*. Nếu Frontend lưu cache mã đơn cũ, có thể hiện thông báo "Đơn hàng trước đó đã bị từ chối". Khi gọi API backend, trạng thái tự động tương đương `NOT_ENROLLED` để học viên có thể mua lại. | Cho phép học viên bấm **"Đăng ký lại"**. |
| `ENROLLED_ACTIVE` | Tìm thấy `courseId` trong `GET /api/enrollments/my` với `status === 'ACTIVE'` và `progress < 100`. | Hiển thị nút **"Tiếp tục học"** $\rightarrow$ điều hướng vào màn hình bài học. |
| `ENROLLED_COMPLETED` | Tìm thấy `courseId` trong `GET /api/enrollments/my` với `status === 'COMPLETED'` hoặc `progress === 100`. | Hiển thị nút **"Xem lại khóa học"** / **"Xem chứng chỉ"**. |

---

## 9. BACKEND GAPS (NHỮNG ĐIỂM THIẾU HOẶC LỆCH CHUẨN)

1. **Thiếu API Lấy chi tiết 1 Order (`GET /api/orders/:id`)**:
   - Hiện tại không có endpoint công khai nào để lấy chi tiết của một Order cụ thể theo ID.
   - Frontend buộc phải dựa vào payload trả về khi tạo đơn hoặc duyệt qua mảng danh sách `GET /api/orders/my`.
2. **Thiếu API Kiểm tra Enrollment theo từng khóa học (`GET /api/enrollments/check/:courseId`)**:
   - Backend không có endpoint chuyên dụng để trả về trạng thái enrollment của 1 khóa học.
   - Frontend bắt buộc phải tải toàn bộ danh sách `GET /api/enrollments/my` và thực hiện tìm kiếm ở client.
3. **Lệch URL Coupon Check**:
   - Tài liệu/comment ghi `POST /api/coupons/check`, nhưng Express router thực tế đang map vào `POST /api/coupons/use`.
4. **Hành vi Xóa cứng khi Từ chối Order (`REJECTED`)**:
   - Khi Teacher/Admin reject order, backend xóa luôn bản ghi Order khỏi PostgreSQL thay vì chỉ cập nhật cột `status = 'REJECTED'`. Điều này khiến Student không xem lại được lý do từ chối hoặc lịch sử các đơn bị hủy trong danh sách `my orders`.
5. **Thiếu Phân quyền Kiểm tra Enrollment trên `GET /api/lessons/chapter/:chapterId`**:
   - Endpoint lấy bài học theo chương hiện đang trả về toàn bộ thông tin bài học bao gồm cả `videoUrl` và `content` mà không yêu cầu token đăng nhập. Toàn bộ logic khóa bài học không phải demo hiện đang phụ thuộc vào Frontend.

---

## 10. RISKS & RECOMMENDATIONS

### 10.1. Rủi ro (Risks)
1. **Rủi ro lộ Video / Content bài học trả phí**:
   - Do `GET /api/lessons/chapter/:chapterId` công khai, nếu người dùng có hiểu biết kỹ thuật gọi trực tiếp qua Postman hoặc DevTools Network Tab, họ có thể lấy được đường dẫn video và nội dung bài học mà không cần mua khóa học.
2. **Rủi ro Race Condition khi tạo Order trùng**:
   - Thiếu ràng buộc `UNIQUE(user_id, course_id, status)` ở tầng database cho bảng `orders` có thể dẫn đến việc tạo trùng 2 order PENDING nếu người dùng double-click nhanh trong cùng mili-giây.

### 10.2. Khuyến nghị phối hợp Backend & Frontend
1. **Đối với Frontend**:
   - Đảm bảo gọi chính xác endpoint `POST /api/coupons/use` khi kiểm tra mã giảm giá.
   - Luôn sử dụng UUID chuẩn RFC 4122 cho `courseId`, `lessonId`.
   - Lưu ý rằng đơn hàng bị từ chối sẽ biến mất khỏi danh sách order; hãy xử lý UX để học viên hiểu rằng họ có thể tạo đơn đăng ký lại.
   - Thực hiện disable nút "Thanh toán" ngay sau click đầu tiên để tránh duplicate request.
2. **Đối với Backend (Đề xuất cho Phase tiếp theo / Không sửa trong Phase này)**:
   - Cân nhắc bổ sung endpoint `GET /api/orders/:id` phục vụ trang Order Confirmation.
   - Cân nhắc chuyển cơ chế REJECTED order từ Hard-delete sang Soft-status (`status = REJECTED`) để lưu vết lịch sử giao dịch minh bạch.
   - Bổ sung middleware kiểm tra enrollment hoặc lọc bỏ trường `videoUrl` / `content` trong `getLessonsByChapterService` nếu người dùng chưa enroll và bài học không phải là `isDemo`.

---

```text
Source code modified: NONE
Database modified: NONE
API modified: NONE

Status: WAITING FOR USER REVIEW
```
