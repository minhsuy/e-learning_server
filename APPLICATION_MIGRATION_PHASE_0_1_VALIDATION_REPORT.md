  # APPLICATION MIGRATION — PHASE 0.1: MASTER PLAN VALIDATION & GAP ANALYSIS REPORT
  **Project:** E-Learning System (TMDEMY)  
  **Database Target:** PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
  **Scope:** Deep-dive code verification, schema cross-audit, frontend compatibility, payment logic analysis, and roadmap optimization  
  **Execution Mode:** STRICT READ-ONLY AUDIT  
  **Date:** 2026-10-01  

  ---

  # 1. VERIFIED FINDINGS (CÁC PHÁT HIỆN ĐÃ ĐƯỢC XÁC MINH CHÍNH XÁC)

  Sau khi đọc và đối chiếu trực tiếp mã nguồn tại `src/`, `prisma/schema.prisma` và database PostgreSQL `tmdemy`, các nhận định cốt lõi sau của Phase 0 hoàn toàn chính xác:

  1. **Hoàn toàn không có MongoDB Aggregation Pipeline**:
    - Kiểm tra ripgrep toàn bộ thư mục `src/services/` xác nhận: **0 lời gọi `.aggregate()`**, không có `$lookup`, `$facet`, `$group` phức tạp.
    - Toàn bộ nghiệp vụ truy vấn đa bảng hiện tại dựa trên `.find()`, `.populate()` và xử lý mảng trong bộ nhớ.
  2. **Hoàn toàn không có Mongoose Transactions trong mã nguồn cũ**:
    - Không tồn tại `startSession()`, `startTransaction()`, hay `abortTransaction()` trong bất kỳ file nào.
    - Các thao tác checkout đơn hàng, kích hoạt khóa học và nộp bài quiz trước đây đều thực hiện các câu lệnh ghi độc lập, có nguy cơ bất đồng bộ dữ liệu khi xảy ra lỗi giữa chừng.
  3. **Mô hình Schema Prisma 26 bảng chuẩn xác**:
    - 19 Mongoose models đã được phân rã chuẩn xác thành 26 bảng quan hệ trong PostgreSQL (các bảng quan hệ nối và thực thể con: `course_faqs`, `question_options`, `quiz_submission_answers`, `coupon_courses`, `enrollments`, `progress`, `certificates`, `ratings`, `favorite_courses`, `comment_reactions`, `conversation_participants`, `message_reads`).
  4. **Vấn đề Validation ObjectId là rào cản tức thì**:
    - 14 file middleware trong `src/middlewares/` đang sử dụng `mongoose.Types.ObjectId.isValid(value)` hoặc `Types.ObjectId.isValid(value)`.
    - Khi client gửi chuỗi UUID (36 ký tự) từ PostgreSQL, toàn bộ validator này sẽ lập tức reject request với HTTP 400.

  ---

  # 2. INCORRECT OR INCONSISTENT FINDINGS (CÁC ĐIỂM SAI LỆCH VÀ BẤT NHẤT CẦN HIỆU CHỈNH)

  Qua đối chiếu chi tiết từng dòng mã nguồn, phát hiện 3 điểm sai lệch và bất nhất nghiêm trọng giữa báo cáo Phase 0, mã nguồn Express cũ và dữ liệu PostgreSQL thực tế:

  ### 2.1. Nghịch lý ngữ nghĩa `isVerified` và dữ liệu người dùng bị vô hiệu hóa
  * **Vị trí code liên quan**:
    * `src/models/user.model.ts` (dòng 70–73): `isVerified: { type: Boolean, default: false }`
    * `src/services/user.service.ts` (dòng 39, 77, 251): Đăng ký gán `false`, OTP gán `true`, nhưng `getListTeachersService` lại lọc `{ isVerified: '' }`.
    * `src/services/admin.service.ts` (dòng 14, 180): `getAllUsersService` lọc `{ isVerified: '' }`, `createTeacher` gán `isVerified: ''`.
    * `src/middlewares/user.middleware.ts` (dòng 79–81): `loginValidator` kiểm tra `if (!user.isVerified) throw new Error('Vui lòng xác thực email...')`.
    * `src/cronJobs/deleteUnverifiedUsers.ts` (dòng 17–20): `UserModel.deleteMany({ isVerified: { $ne: '' }, createdAt: { $lt: expireTime } })`.
    * `scripts/migration/migration-transformer.ts` (dòng 84): `const isVerified = u.isVerified === true || u.isVerified === 'true'`.
  * **Nhận định trong báo cáo Phase 0**:
    * Báo cáo Phase 0 nhận định `isVerified` trong MongoDB từng là chuỗi rỗng `''` và đề xuất chuyển toàn bộ query sang `isVerified: true` (cho tài khoản kích hoạt) và `isVerified: false` (cho tài khoản chưa kích hoạt).
  * **Kết quả kiểm tra thực tế trên Database**:
    * Kiểm tra trực tiếp bảng `users` trong PostgreSQL `tmdemy` (chạy qua Node.js query):
      ```json
      [
        { "username": "minhsuyyyyy", "email": "thaiminh061204@gmail.com", "role": "USER", "isVerified": false },
        { "username": "nguyen_anh_binh", "email": "nab@gmail.com", "role": "TEACHER", "isVerified": false },
        { "username": "new_username123", "email": "thaiminh0612@gmail.com", "role": "ADMIN", "isVerified": false },
        { "username": "thaiminh", "email": "thaiminh06112@gmail.com", "role": "USER", "isVerified": false },
        { "username": "teacher_cntt", "email": "teacher_cntt@gmail.com", "role": "TEACHER", "isVerified": false },
        { "username": "thaiminh", "email": "thaiminhgotthedope@gmail.com", "role": "USER", "isVerified": false },
        { "username": "levanquang", "email": "levanquang2k3.vn@gmail.com", "role": "USER", "isVerified": false }
      ]
      ```
    * **TOÀN BỘ 7 NGƯỜI DÙNG HIỆN CÓ TRONG POSTGRESQL (BAO GỒM ADMIN VÀ TEACHERS) ĐỀU CÓ `is_verified = false`!**
  * **Nguyên nhân gốc rễ (Root Cause)**:
    * Trong MongoDB trước đây, hệ thống từng dùng chuỗi rỗng `''` để chỉ định tài khoản đã xác minh (không còn token chờ). Khi thêm chức năng OTP, lập trình viên đổi schema sang Boolean nhưng quên không cập nhật các query của Admin và Cron job.
    * Trong quá trình Data Migration Phase 1, `migration-transformer.ts` kiểm tra `u.isVerified === true || u.isVerified === 'true'`. Do 7 tài khoản nguồn có giá trị `""`, điều kiện trả về `false`.
  * **Hậu quả nếu áp dụng ngay Prisma**:
    1. `loginValidator` sẽ chặn 100% người dùng đăng nhập (`!user.isVerified` ném lỗi).
    2. `getAllUsersService` (nếu lọc `isVerified: true`) sẽ trả về 0 người dùng.
    3. **Đặc biệt nguy hiểm**: Cron job `deleteUnverifiedUsers` nếu chạy `prisma.user.deleteMany({ where: { isVerified: false, createdAt: { lt: expireTime } } })` sẽ **XÓA SẠCH TOÀN BỘ 7 NGƯỜI DÙNG LỊCH SỬ**, bao gồm tài khoản Quản trị viên và Giảng viên!
  * **Hướng xử lý đề xuất**:
    * Bổ sung một bước Data Patch ở đầu Phase 1/2 để cập nhật 7 tài khoản lịch sử sang `is_verified = true`.
    * Chuẩn hóa toàn bộ backend: `isVerified: true` (đã xác thực), `isVerified: false` (chưa xác thực).

  ---

  ### 2.2. Sai lệch danh mục API Endpoints trong Báo cáo Phase 0
  Đối chiếu chi tiết 22 file route trong `src/routes/` với Bảng API của Báo cáo Phase 0 phát hiện nhiều endpoint bị ghi sai URL, method hoặc thiếu endpoint thực tế:

  | Nghiệp vụ | Báo cáo Phase 0 ghi | Route thực tế trong mã nguồn | File Route thực tế | Ghi chú sai lệch |
  |---|---|---|---|---|
  | Đơn hàng | `POST /api/orders/checkout` | `POST /api/orders` | `src/routes/order.route.ts:16` | Route thực tế không có `/checkout` |
  | Đơn hàng của tôi | `GET /api/orders/my-orders` | `GET /api/orders/my` | `src/routes/order.route.ts:20` | Route thực tế là `/my` |
  | Áp dụng coupon | `POST /api/coupons/apply` | `POST /api/coupons/use` | `src/routes/coupon.route.ts:60` | Route thực tế là `/use` |
  | Profile người dùng | `GET /api/users/profile` | `GET /api/users/me` | `src/routes/user.route.ts:44` | Route thực tế là `/me` |
  | Cập nhật profile | `PUT /api/users/profile` | `PUT /api/users/update-me` | `src/routes/user.route.ts:59` | Route thực tế là `/update-me` |
  | Refresh token | `POST /api/users/refresh-token` | `POST /api/users/access_token` | `src/routes/user.route.ts:78` | Route thực tế là `/access_token` |
  | Tạo giảng viên (Admin) | `POST /api/admin/teachers` | `POST /api/admin/users` | `src/routes/admin.route.ts:80` | Route thực tế là `POST /api/admin/users` |
  | Duyệt khóa học (Admin) | `PUT /api/admin/courses/:id/status` | `PATCH /api/admin/courses/teacher/:id` | `src/routes/admin.route.ts:133` | Method `PATCH` và path khác |
  | Xuất chứng chỉ | `GET /api/certificates/:courseId` | `POST /api/certificates` | `src/routes/certificate.route.ts:8` | Method `POST`, nhận `{ courseId }` trong body |
  | Tiến độ học tập | `POST /api/progress` | `POST /api/progress/complete` & `/uncomplete` | `src/routes/progress.route.ts:16,24` | 2 endpoint riêng biệt |
  | Lấy bình luận | `GET /api/comments?lessonId=...` | `GET /api/comments/lesson/:lessonId` | `src/routes/comment.route.ts:31` | Param nằm trong URL path |
  | Phản ứng like/dislike | `POST /api/comments/:id/reaction` | `POST /api/comments/like/:commentId` & `/dislike/:commentId` | `src/routes/comment.route.ts:45,48` | 2 endpoint riêng biệt |
  | Đánh dấu đã đọc thông báo | `PUT /api/notifications/read` (batch) | `PATCH /api/notifications/read/:id` | `src/routes/notification.route.ts:19` | Method `PATCH`, nhận đơn lẻ theo ID |
  | Tạo chương học | `POST /api/chapters` (body courseId) | `POST /api/chapters/:courseId` | `src/routes/chapter.route.ts:17` | `courseId` nằm trong URL path |
  | Lấy bài học | `GET /api/lessons/:id` | `GET /api/lessons/chapter/:chapterId` | `src/routes/lesson.route.ts:47` | Không có endpoint lấy bài lẻ theo id |
  | Quản lý khóa học GV | Nhầm lẫn sang `/api/courses` | `POST /api/teacher/courses`, `PUT /api/teacher/courses/:id` | `src/routes/teacher.route.ts` | CRUD khóa học của GV nằm ở `/api/teacher` |

  *Các endpoint bị thiếu trong báo cáo Phase 0 cần bổ sung*:
  - `POST /api/users/logout`
  - `PUT /api/users/change-password`
  - `GET /api/users/profile/:id`
  - `GET /api/users/teachers`
  - `DELETE /api/admin/users/:id`
  - `DELETE /api/admin/courses/:id`
  - `GET /api/admin/courses`
  - `GET /api/enrollments/my`
  - `GET /api/enrollments/course/:id`
  - `DELETE /api/enrollments/course/:id/:userId`
  - `GET /api/favorites`
  - `POST /api/favorites/:id`
  - `DELETE /api/favorites/:id`
  - `DELETE /api/quiz/:quizId`
  - `GET /api/quiz/lesson/:lessonId`
  - `DELETE /api/questions/:questionId`
  - `GET /api/submissions/teacher/:quizId`
  - `GET /api/submissions/teacher/analytics/:quizId`

  ---

  ### 2.3. Lỗi Double Increment Coupon trong Logic Checkout Cũ
  * **Vị trí code liên quan**:
    * `src/services/order.service.ts` dòng 94: `coupon.used += 1; await coupon.save();` (chạy ngay khi gọi `createOrderService`).
    * `src/services/order.service.ts` dòng 282: `CouponModel.findByIdAndUpdate(order.coupon, { $inc: { used: 1 } })` (chạy tiếp khi admin/teacher chuyển order sang `COMPLETED`).
  * **Kết quả phân tích**:
    * Đối với các đơn hàng trả phí có áp dụng mã coupon, mã nguồn cũ tăng `coupon.used` **2 LẦN** (1 lần khi tạo đơn Pending, 1 lần nữa khi Admin xác nhận Completed).
    * Khi chuyển sang Prisma, cần thống nhất quy chuẩn: Chỉ tăng `coupon.used` 1 lần duy nhất trong transaction tạo đơn (hoặc hoàn tất đơn), tránh thất thoát số lượt sử dụng của người dùng.

  ---

  # 3. MISSING DEPENDENCIES (CÁC QUAN HỆ & PHỤ THUỘC BỊ BỎ SÓT)

  1. **Khóa chính phức hợp (Composite Primary Keys)**:
    - Trong Prisma schema, 3 bảng quan hệ nhiều-nhiều không có cột `id` đơn lẻ mà dùng khóa chính phức hợp:
      * `MessageRead`: `@@id([messageId, userId])`
      * `ConversationParticipant`: `@@id([conversationId, userId])`
      * `CouponCourse`: `@@id([couponId, courseId])`
    - Bất kỳ truy vấn `findUnique`, `delete`, `update` nào trên 3 bảng này trong Prisma bắt buộc phải truyền compound key:
      ```ts
      prisma.messageRead.findUnique({
        where: { messageId_userId: { messageId, userId } }
      })
      ```
  2. **Khóa Unique phức hợp (Composite Unique Constraints)**:
    - 8 bảng có ràng buộc `@@unique`:
      * `Enrollment`: `@@unique([userId, courseId])`
      * `Progress`: `@@unique([userId, lessonId])`
      * `Certificate`: `@@unique([userId, courseId])`
      * `Rating`: `@@unique([userId, courseId])`
      * `FavoriteCourse`: `@@unique([userId, courseId])`
      * `QuizSubmission`: `@@unique([quizId, userId])`
      * `CommentReaction`: `@@unique([commentId, userId])`
      * `Lesson`: `@@unique([slug, courseId])`
    - Phép upsert tiến độ học hoặc đánh giá cần sử dụng đúng tên định danh compound index do Prisma sinh ra (ví dụ: `userId_lessonId`, `userId_courseId`).
  3. **Phụ thuộc Chat Room tự động khi hoàn thành Order**:
    - Trong `order.service.ts` (dòng 289–308), khi một Order được chuyển sang `COMPLETED`, hệ thống tự động tìm hoặc tạo một `Conversation` nhóm dạng `Q&A - <Tên khóa học>` và thêm học viên vào danh sách người tham gia (`ConversationParticipant`).
    - Phase 6 (Commerce) thực tế có phụ thuộc chéo sang mô hình `Conversation` của Phase 9.

  ---

  # 4. FRONTEND COMPATIBILITY ISSUES (PHÂN TÍCH TƯƠNG THÍCH FRONTEND)

  Đã kiểm tra trực tiếp source code Next.js frontend tại `C:\Users\MINH\OneDrive\Máy tính\tmdemy`:

  ### 4.1. Kiến trúc Frontend hiện tại
  - **Framework**: Next.js 14.2.25 (App Router), React 18, TypeScript 5.
  - **Thư viện xác thực**: `@clerk/nextjs` (kết hợp với cookie và session).
  - **Phát hiện quan trọng**: Trong thư mục `src/database/` và `src/lib/actions/` của Next.js frontend, hiện có sẵn các model Mongoose và Server Actions kết nối trực tiếp đến MongoDB Atlas.
  - **Frontend phụ thuộc thuộc tính `._id`**:
    * Kiểm tra component cho thấy hàng loạt vị trí đang truy xuất trực tiếp `._id`:
      * `<Card key={certificate._id}>`
      * `<TableRow key={course._id}>`
      * `key={lecture._id}`
      * `key={lesson._id}`
      * `comment._id`
      * `author: user._id`

  ### 4.2. Rủi ro gãy vỡ khi Backend chuyển sang UUID
  1. **Mất trường `._id`**:
    - Prisma ORM trả về trường định danh là `id` (chuỗi UUID).
    - Nếu Backend Express trả JSON trực tiếp từ Prisma `{ id: "..." }` mà không có trường alias `_id`, các component React render danh sách sẽ bị lỗi `key = undefined`, dẫn đến mất khả năng render hoặc sai lệch state.
    - **Giải pháp bắt buộc**: Tại tầng Controller hoặc Service của Express, khi format dữ liệu trả về cho client, luôn map thêm `_id: entity.id` (hoặc gắn getter).
  2. **Định dạng ID từ 24 hex sang 36-char UUID**:
    - Frontend không có validator regex cứng `^[0-9a-fA-F]{24}$` trong form submission. Hầu hết các form dùng `zod` validate chuỗi không rỗng (`z.string().min(1)`).
    - Các API request từ frontend gửi ID dưới dạng chuỗi URL param sẽ tương thích tốt với UUID, miễn là backend không còn chặn bằng `ObjectId.isValid()`.
  3. **Kiểu dữ liệu Decimal**:
    - Prisma trả về các trường giá tiền (`price`, `total`, `discount`, `grade`) dưới dạng đối tượng `Decimal`.
    - Khi trả qua JSON API của Express, nếu không chuyển đổi thành số (`Number(val)`) hoặc chuỗi format, client có thể nhận đối tượng rỗng `{}` hoặc string lạ.

  ---

  # 5. CHECKOUT AND PAYMENT RISK ANALYSIS

  Đọc và kiểm tra chi tiết luồng xử lý trong `src/services/order.service.ts` và `src/services/coupon.service.ts`:

  ### 5.1. Luồng thanh toán thực tế
  1. **Không có Cổng thanh toán bên thứ ba (Third-party Payment Gateway)**:
    - Hệ thống Express hiện tại **không có webhook** của VNPay, MoMo hay Stripe.
    - Luồng thanh toán mang tính chất nội bộ / thủ công:
      * Học viên tạo đơn: `POST /api/orders` $\rightarrow$ Trạng thái `PENDING` (nếu có phí) hoặc `COMPLETED` (nếu miễn phí `total === 0`).
      * Giảng viên hoặc Admin kiểm tra chuyển khoản và gọi `PUT /api/orders/:id` với `status: 'COMPLETED'` để phê duyệt.
  2. **Điều kiện tạo Enrollment**:
    - Khóa học miễn phí (`total === 0`): `Enrollment` được tạo ngay lập tức trong `createOrderService`.
    - Khóa học trả phí: `Enrollment` chỉ được tạo khi đơn hàng chuyển sang `COMPLETED` qua `updateOrderStatusService`.
  3. **Điều kiện tăng `course.sold`**:
    - Tương tự `Enrollment`, tăng khi đơn hàng đạt trạng thái `COMPLETED`.

  ### 5.2. Các rủi ro Concurrency và Race Condition
  * **Race Condition khi áp dụng Coupon**:
    - Mã nguồn cũ kiểm tra `if (coupon.limit && coupon.used >= coupon.limit)` sau đó mới chạy `coupon.used += 1`.
    - Nếu 2 học viên cùng nhấn thanh toán tại cùng 1 giây cho 1 suất coupon cuối cùng, cả hai đều vượt qua kiểm tra limit và coupon bị sử dụng quá hạn ngạch.
  * **Chiến lược Transaction tối ưu với Prisma**:
    - Áp dụng `prisma.$transaction` tương tác (interactive transaction):
      ```ts
      await prisma.$transaction(async (tx) => {
        // 1. Kiểm tra và cập nhật coupon nguyên tử
        if (couponId) {
          const updatedCoupon = await tx.coupon.updateMany({
            where: {
              id: couponId,
              active: true,
              OR: [{ limit: null }, { used: { lt: tx.coupon.fields.limit } }]
            },
            data: { used: { increment: 1 } }
          });
          if (updatedCoupon.count === 0) {
            throw new Error('Coupon đã hết lượt sử dụng hoặc không hợp lệ');
          }
        }
        // 2. Tạo Order
        // 3. Nếu là khóa học miễn phí: Tạo Enrollment + tăng course.sold
      });
      ```
  * **Xử lý an toàn cho 3 Đơn hàng mồ côi (Historical Orphan Orders)**:
    - 3 đơn hàng `DH-2714351`, `DH-7806607`, `DH-3342004` có `course_id = NULL`.
    - Trong `updateOrderStatusService`, mã nguồn đã có đoạn guard bảo vệ:
      `if (!order.course) { ... return 'Cannot mark order as completed because its course no longer exists' }`
    - Khi viết lại bằng Prisma, quan hệ `course Course?` cho phép null và logic guard này phải được bảo toàn nguyên vẹn.

  ---

  # 6. UPDATED MIGRATION ROADMAP (LỘ TRÌNH MIGRATION TINH CHỈNH)

  Dựa trên các phát hiện thực tế:
  1. Tách công việc **Full Regression Testing** và **Mongoose Decommission** ra khỏi Phase 10 thành 2 phase chuyên biệt (Phase 11 và Phase 12).
  2. Thêm bước **Data Patch `is_verified`** vào Phase 1 để kích hoạt lại 7 tài khoản lịch sử trước khi khởi chạy auth.
  3. Điều chỉnh thứ tự các phase theo đúng quan hệ phụ thuộc thực tế của hệ thống.

  ```mermaid
  flowchart TD
      P1[Phase 1: Foundation, Universal UUID Validation & Data Patch] --> P2[Phase 2: Auth & User Management]
      P2 --> P3[Phase 3: Category & Admin Core]
      P3 --> P4[Phase 4: Course, Syllabus & Content]
      P4 --> P5[Phase 5: Quiz System & Grading]
      P4 --> P6[Phase 6: Commerce, Coupons & Orders]
      P5 & P6 --> P7[Phase 7: Progress, Ratings & Certificates]
      P4 --> P8[Phase 8: Discussions & Comments]
      P2 & P4 --> P9[Phase 9: Real-time Chat & WebSockets]
      P7 & P8 & P9 --> P10[Phase 10: Notifications & Background Automation]
      P10 --> P11[Phase 11: End-to-End Regression Testing]
      P11 --> P12[Phase 12: Mongoose Decommission & Final Cleanup]
  ```

  ### Chi tiết 12 Phase Tinh chỉnh:

  * **Phase 1: Foundation, Universal UUID Validation & Data Patch**:
    - Tạo Prisma client singleton (`src/config/prisma.ts`).
    - Xây dựng helper kiểm tra UUID chuẩn thay thế cho `ObjectId.isValid`.
    - Cập nhật lỗi Prisma trong `errorHandler.ts`.
    - **Data Patch**: Chạy script cập nhật `is_verified = true` cho 7 tài khoản người dùng lịch sử trong PostgreSQL để phục hồi quyền truy cập.
  * **Phase 2: Authentication & User Profile Management**:
    - Chuyển `user.service.ts` và `user.middleware.ts` sang Prisma.
    - Sửa logic kiểm tra `isVerified` sang Boolean chuẩn.
    - Bảo đảm trả về cả `id` và `_id` trong response.
  * **Phase 3: Category Management & Admin User Controls**:
    - Chuyển `category.service.ts` sang Prisma.
    - Chuyển các hàm quản lý người dùng, tạo giảng viên trong `admin.service.ts` sang Prisma.
  * **Phase 4: Course Management, Syllabus & Content Catalog**:
    - Chuyển `course.service.ts`, `chapter.service.ts`, `lesson.service.ts` sang Prisma.
    - Tách mảng `qa` vào bảng `course_faqs`, lưu trữ mảng PostgreSQL native text array.
  * **Phase 5: Quiz System & Automated Grading**:
    - Chuyển `quiz.service.ts`, `question.service.ts`, `quizSubmission.service.ts` sang 5 bảng quan hệ.
    - Bọc quy trình nộp và chấm điểm bài tập trong `prisma.$transaction`.
  * **Phase 6: Commerce System — Coupons, Orders & Checkout**:
    - Chuyển `coupon.service.ts` và `order.service.ts` sang Prisma.
    - Sửa lỗi double increment coupon, áp dụng atomic increment transaction.
    - Xử lý tương thích 3 đơn hàng orphan có `courseId = null`.
  * **Phase 7: Learning Progress, Ratings, Favorites & Certificates**:
    - Chuyển `progress.service.ts`, `rating.service.ts`, `favoriteCourse.service.ts`, `certificate.service.ts`.
    - Tự động sinh PDF chứng chỉ khi hoàn thành 100% tiến độ.
  * **Phase 8: Discussions, Comments & Reactions**:
    - Chuyển `comment.service.ts` sang bảng `comments` và `comment_reactions`.
    - Quản lý cây reply tự liên kết và thống kê số like/dislike.
  * **Phase 9: Real-time Communication (Chat & Socket.IO)**:
    - Chuyển `conversation.service.ts`, `message.service.ts` sang `conversations`, `conversation_participants`, `messages`, `message_reads`.
    - Đồng bộ hóa các sự kiện Socket.IO tại `src/socket/initSocket.ts`.
  * **Phase 10: Notifications & Background Automation**:
    - Chuyển `notification.service.ts` sang bảng `notifications` (bảo toàn 5 dangling historical pointers và liên kết lessonId).
    - Cập nhật cron job `deleteUnverifiedUsers.ts` sử dụng Prisma với điều kiện `isVerified: false`.
  * **Phase 11: End-to-End Regression Testing & Integration Verification**:
    - Kiểm thử toàn diện toàn bộ 21 route groups với dữ liệu thực tế trên PostgreSQL.
    - Xác nhận API contracts, status codes, JSON format và khả năng tương thích với frontend.
  * **Phase 12: Mongoose Decommission & Final Cleanup**:
    - Ngắt kết nối MongoDB cũ trong `src/index.ts`.
    - Lưu trữ hoặc gỡ bỏ các file trong `src/models/`.
    - Gỡ bỏ `mongoose` khỏi `package.json`, dọn dẹp sạch mã nguồn backend.

  ---

  # 7. FINAL RECOMMENDATIONS (KHUYẾN NGHỊ CUỐI CÙNG CHO PHASE 1)

  1. **Khôi phục trạng thái `isVerified` của 7 tài khoản lịch sử trước**:
    - Đây là công việc tiên quyết. Nếu không chạy bước cập nhật này, không tài khoản nào có thể đăng nhập hoặc xuất hiện trong danh sách của Admin.
  2. **Luôn cung cấp trường tương thích `_id` trong phản hồi JSON**:
    - Tại các controller/service trả về danh sách khóa học, bài học, bình luận, người dùng, thêm thuộc tính ảo `_id: record.id` để đảm bảo Next.js frontend hoạt động bình thường mà không cần chỉnh sửa giao diện.
  3. **Tuân thủ triệt để tính bất biến**:
    - Tuyệt đối không thay đổi `prisma/schema.prisma`. Toàn bộ các bảng, quan hệ, kiểu dữ liệu đã được kiểm chứng tương thích 100% với nghiệp vụ khi áp dụng đúng các giải pháp trong báo cáo này.
