# TMDEMY — FRONTEND API TEST CHECKLIST

Checklist này được thiết kế để Frontend Developers và QA Engineers kiểm thử đầy đủ các kịch bản API theo từng nhóm quyền (Role-based).

---

## 1. Public Endpoints (Không cần Đăng nhập)

### 1.1. Auth & Account Recovery
- [ ] `POST /api/users/register`
  - [ ] Happy path: Đăng ký thành công tài khoản mới (Status 200).
  - [ ] Validation: Báo lỗi khi username < 3 ký tự, email sai định dạng, password < 6 ký tự hoặc confirm_password không khớp (Status 400).
  - [ ] Error case: Báo lỗi khi email đã tồn tại trong hệ thống (Status 400).
  - [ ] Response structure: Chứa `{ success: true, message: "..." }`.
- [ ] `POST /api/users/verify-otp`
  - [ ] Happy path: Xác thực email thành công với OTP 6 số (Status 200).
  - [ ] Validation: Thiếu email hoặc OTP không đúng 6 số (Status 400).
  - [ ] Error case: OTP sai hoặc đã hết hạn sau 10 phút (Status 400 / 500).
- [ ] `POST /api/users/login`
  - [ ] Happy path: Đăng nhập thành công, nhận access_token và refresh_token (Status 200).
  - [ ] Error case: Đăng nhập bằng tài khoản chưa xác thực OTP (Status 400).
  - [ ] Error case: Sai mật khẩu (Status 401: "Incorrect password").
  - [ ] Error case: Email không tồn tại (Status 400).
- [ ] `POST /api/users/forgot-password`
  - [ ] Happy path: Gửi email reset password thành công (Status 200).
  - [ ] Error case: Email không tồn tại (Status 404).
- [ ] `PUT /api/users/reset-password`
  - [ ] Happy path: Đặt lại mật khẩu mới với token hợp lệ (Status 200).
  - [ ] Error case: Token không hợp lệ hoặc đã hết hạn sau 15 phút (Status 400).
- [ ] `POST /api/users/access_token`
  - [ ] Happy path: Gửi refresh_token hợp lệ nhận access_token mới (Status 200).
  - [ ] Error case: refresh_token rỗng hoặc hết hạn (Status 401).

### 1.2. Public Course & Content Catalog
- [ ] `GET /api/courses`
  - [ ] Happy path: Lấy danh sách khóa học APPROVED (Status 200).
  - [ ] Query filters: Lọc theo category UUID, level, type, priceMin, priceMax, search, sortBy (Status 200).
  - [ ] Response structure: Chứa `courses` (Decimal prices đã convert thành Number) và `pagination`.
- [ ] `GET /api/courses/:slug`
  - [ ] Happy path: Lấy chi tiết khóa học bằng slug, view tăng 1 (Status 200).
  - [ ] Error case: Slug không tồn tại hoặc khóa học bị soft-delete (Status 404).
- [ ] `GET /api/categories`
  - [ ] Happy path: Lấy danh sách toàn bộ danh mục hoạt động (Status 200).
- [ ] `GET /api/categories/:slug`
  - [ ] Happy path: Lấy thông tin danh mục theo slug (Status 200).
  - [ ] Error case: Slug không tồn tại (Status 404).
- [ ] `GET /api/lessons/chapter/:chapterId`
  - [ ] Happy path: Lấy danh sách bài học thuộc chương (Status 200).
  - [ ] Validation: chapterId không phải UUID (Status 400).
- [ ] `GET /api/comments/lesson/:lessonId`
  - [ ] Happy path: Lấy cây bình luận phân cấp theo bài học (Status 200).
- [ ] `GET /api/ratings/course/:id`
  - [ ] Happy path: Lấy danh sách đánh giá ACTIVE của khóa học (Status 200).
- [ ] `GET /api/quiz/lesson/:lessonId`
  - [ ] Happy path: Lấy quiz của bài học (Status 200).
  - [ ] Security check: Các câu hỏi KHÔNG chứa trường `answer` (Status 200).
- [ ] `GET /api/users/profile/:id`
  - [ ] Happy path: Xem thông tin công khai của giảng viên/học viên (Status 200).
- [ ] `GET /api/users/teachers`
  - [ ] Happy path: Lấy danh sách giảng viên đang hoạt động (Status 200).

---

## 2. USER / STUDENT Endpoints (Yêu cầu Đăng nhập Học viên)

### 2.1. Account & Profile
- [ ] `GET /api/users/me`
  - [ ] Happy path: Lấy thông tin tài khoản hiện tại từ Access Token (Status 200).
  - [ ] Authentication: Không gửi token hoặc token hết hạn (Status 401).
- [ ] `PUT /api/users/update-me`
  - [ ] Happy path: Cập nhật username, bio, phone, avatar, socialLinks (Status 200).
  - [ ] Error case: Trùng username với người khác (Status 400).
- [ ] `PUT /api/users/change-password`
  - [ ] Happy path: Đổi mật khẩu thành công (Status 200).
  - [ ] Error case: Sai mật khẩu cũ (Status 400).
- [ ] `POST /api/users/logout`
  - [ ] Happy path: Đăng xuất, refresh token trong database bị xóa (Status 200).

### 2.2. Orders & Coupons
- [ ] `POST /api/coupons/use`
  - [ ] Happy path: Kiểm tra mã giảm giá hợp lệ cho khóa học (Status 200).
  - [ ] Error case: Mã không tồn tại, hết hạn hoặc không áp dụng cho khóa học này (Status 400 / 404).
- [ ] `POST /api/orders`
  - [ ] Happy path: Mua khóa học có phí (Status 200: Order PENDING).
  - [ ] Happy path Free Course: Mua khóa học miễn phí hoặc giảm 100% (Status 200: Order COMPLETED ngay, tự động ghi danh).
  - [ ] Error case: Đã mua khóa học này trước đó (Status 400: "You already enrolled in this course").
- [ ] `GET /api/orders/my`
  - [ ] Happy path: Lấy danh sách đơn hàng của bản thân (Status 200).

### 2.3. Learning & Progress
- [ ] `GET /api/enrollments/my`
  - [ ] Happy path: Lấy danh sách các khóa học đã ghi danh (Status 200).
- [ ] `GET /api/progress/:courseId`
  - [ ] Happy path: Lấy tiến độ học tập và danh sách bài học đã hoàn thành (Status 200).
- [ ] `POST /api/progress/complete`
  - [ ] Happy path: Đánh dấu hoàn thành bài học, phần trăm tiến độ tự cập nhật (Status 200).
  - [ ] Error case: Chưa ghi danh vào khóa học (Status 403).
- [ ] `POST /api/progress/uncomplete`
  - [ ] Happy path: Bỏ đánh dấu hoàn thành bài học (Status 200).
- [ ] `POST /api/submissions`
  - [ ] Happy path: Nộp bài làm Quiz, nhận kết quả điểm và trạng thái passed (Status 200).
  - [ ] Error case: Đã nộp bài quiz này trước đó (Status 400).
  - [ ] Error case: Chưa ghi danh vào khóa học (Status 403).
- [ ] `GET /api/submissions/:quizId`
  - [ ] Happy path: Học viên xem lại kết quả bài nộp của chính mình (Status 200).
- [ ] `POST /api/certificates`
  - [ ] Happy path: Đạt đủ điều kiện (tiến độ >= 70%, nộp quiz >= 60%, điểm >= 50%) -> Nhận chứng chỉ PDF (Status 200).
  - [ ] Error case: Chưa đủ tiến độ học tập hoặc chưa nộp đủ bài tập (Status 400).
  - [ ] Error case: Đã có chứng chỉ của khóa học này (Status 400).

### 2.4. Social & Interaction
- [ ] `POST /api/favorites/:id`
  - [ ] Happy path: Thêm khóa học vào danh sách yêu thích (Status 200).
  - [ ] Error case: Khóa học đã có trong favorites (Status 400).
- [ ] `DELETE /api/favorites/:id`
  - [ ] Happy path: Xóa khóa học khỏi danh sách yêu thích (Status 200).
- [ ] `GET /api/favorites`
  - [ ] Happy path: Lấy danh sách khóa học yêu thích (Status 200).
- [ ] `POST /api/comments`
  - [ ] Happy path: Đăng bình luận hoặc trả lời bình luận (Status 200).
- [ ] `PUT /api/comments/:id`
  - [ ] Happy path: Sửa bình luận của chính mình (Status 200).
  - [ ] Ownership: Sửa bình luận của người khác (Status 403).
- [ ] `DELETE /api/comments/:id`
  - [ ] Happy path: Tự xóa bình luận của mình (Status 200).
- [ ] `POST /api/comments/like/:commentId` & `/dislike/:commentId`
  - [ ] Happy path: Thả tim hoặc bỏ thích bình luận (Status 200).
- [ ] `POST /api/ratings`
  - [ ] Happy path: Đánh giá sao (1-5) cho khóa học đã ghi danh (Status 200).
  - [ ] Error case: Chưa ghi danh vào khóa học (Status 403).
  - [ ] Error case: Đã đánh giá khóa học này rồi (Status 400).
- [ ] `GET /api/notifications`
  - [ ] Happy path: Lấy danh sách thông báo của tài khoản (Status 200).
- [ ] `PATCH /api/notifications/read/:id`
  - [ ] Happy path: Đánh dấu thông báo đã đọc (Status 200).
- [ ] `POST /api/conversations` & `GET /api/conversations`
  - [ ] Happy path: Lấy hoặc tạo phòng chat (Status 200).
- [ ] `GET /api/messages/:conversationId`
  - [ ] Happy path: Lấy lịch sử tin nhắn phòng chat mà mình là thành viên (Status 200).
  - [ ] Authorization: Truy cập phòng chat không phải thành viên (Status 403).

---

## 3. TEACHER / EXPERT Endpoints (Yêu cầu Role TEACHER)

### 3.1. Course Management
- [ ] `POST /api/teacher/courses`
  - [ ] Happy path: Giảng viên tạo khóa học mới (Status 201: status=PENDING).
  - [ ] Role check: Học viên (role=user) gọi API (Status 403: "FORBIDDEN - Teacher role required").
- [ ] `PUT /api/teacher/courses/:id`
  - [ ] Happy path: Giảng viên cập nhật khóa học của chính mình (Status 200).
  - [ ] Ownership: Giảng viên A cập nhật khóa học của Giảng viên B (Status 403).
- [ ] `DELETE /api/teacher/courses/:id`
  - [ ] Happy path: Xóa khóa học của mình khi trạng thái là PENDING (Status 200).
  - [ ] Business rule: Xóa khóa học đã được APPROVED hoặc REJECTED (Status 403: "Only pending courses can be deleted by teacher").
- [ ] `GET /api/teacher/courses`
  - [ ] Happy path: Lấy danh sách khóa học của chính giảng viên (Status 200).

### 3.2. Curriculum & Assessment Management
- [ ] `POST /api/chapters/:courseId`
  - [ ] Happy path: Thêm chương học vào khóa học của mình (Status 201).
  - [ ] Ownership: Thêm chương vào khóa học của giảng viên khác (Status 403).
- [ ] `PUT /api/chapters/:id` & `DELETE /api/chapters/:id`
  - [ ] Happy path: Cập nhật / Xóa chương học (Status 200).
- [ ] `POST /api/lessons`
  - [ ] Happy path: Tạo bài học mới trong chương (Status 201).
  - [ ] Integrity check: Chapter không thuộc Course đã chỉ định (Status 400).
- [ ] `PUT /api/lessons/:id` & `DELETE /api/lessons/:id`
  - [ ] Happy path: Cập nhật / Xóa bài học (Status 200).
- [ ] `POST /api/quiz`
  - [ ] Happy path: Tạo bài kiểm tra cho bài học (Status 200).
  - [ ] Constraint: Bài học đã có quiz trước đó (Status 400: "Lesson already has a quiz").
- [ ] `PUT /api/quiz/:quizId` & `DELETE /api/quiz/:quizId`
  - [ ] Happy path: Cập nhật / Xóa Quiz (Status 200).
- [ ] `POST /api/questions`
  - [ ] Happy path: Tạo câu hỏi trắc nghiệm hoặc điền từ (Status 200).
- [ ] `PUT /api/questions/:questionId` & `DELETE /api/questions/:questionId`
  - [ ] Happy path: Cập nhật / Xóa câu hỏi (Status 200).
- [ ] `GET /api/submissions/teacher/:quizId`
  - [ ] Happy path: Xem tất cả bài nộp của học viên trong quiz (Status 200).
- [ ] `GET /api/submissions/teacher/analytics/:quizId`
  - [ ] Happy path: Xem phân tích phổ điểm, tỷ lệ đậu quiz (Status 200).

### 3.3. Students & Coupons Management
- [ ] `GET /api/enrollments/course/:id`
  - [ ] Happy path: Lấy danh sách học viên trong khóa học (Status 200).
- [ ] `DELETE /api/enrollments/course/:id/:userId`
  - [ ] Happy path: Kick học viên khỏi khóa học, tự động giảm sold count và xóa order (Status 200).
- [ ] `POST /api/coupons`
  - [ ] Happy path: Tạo mã giảm giá áp dụng cho các khóa học do mình sở hữu (Status 201).
  - [ ] Ownership: Áp dụng mã cho khóa học của giảng viên khác (Status 403).
- [ ] `GET /api/coupons` & `PUT /api/coupons/:id` & `DELETE /api/coupons/:id`
  - [ ] Happy path: Quản lý các coupon do giảng viên tạo (Status 200).

### 3.4. Teacher Statistics & Course Performance
- [ ] `GET /api/teacher/statistics/overview`
  - [ ] Happy path: Lấy tổng doanh thu, tổng học viên, số khóa học của giảng viên (Status 200).
- [ ] `GET /api/teacher/statistics/revenue`
  - [ ] Happy path: Lấy biểu đồ doanh thu theo period (7days, 30days, 12months, custom) (Status 200).
  - [ ] Business rule: Chỉ tính các Order có `status = COMPLETED`.
- [ ] `GET /api/teacher/statistics/courses`
  - [ ] Happy path: Lấy bảng xếp hạng khóa học theo doanh thu, học viên (Status 200).
- [ ] `GET /api/teacher/statistics/enrollments`
  - [ ] Happy path: Thống kê số lượng ghi danh và trạng thái học tập (Status 200).
- [ ] `GET /api/teacher/statistics/learning`
  - [ ] Happy path: Thống kê tỷ lệ hoàn thành khóa học và chứng chỉ (Status 200).
- [ ] `GET /api/teacher/statistics/course-performance/:courseId`
  - [ ] Happy path: Lấy snapshot toàn diện (Revenue, Students, Engagement, Ratings, Curriculum, Quizzes, Lessons Funnel) (Status 200).
  - [ ] Ownership: Giảng viên A truy cập courseId của Giảng viên B (Status 403: "You can only view performance of your own courses").
  - [ ] Destroyed course: Khóa học có `isDestroyed = true` (Status 404).
  - [ ] Zero-data safe: Khóa học không có học viên, không có order không bị lỗi chia cho 0, NaN hay Infinity (Status 200).

---

## 4. ADMIN Endpoints (Yêu cầu Role ADMIN)

### 4.1. User & Teacher Administration
- [ ] `GET /api/admin/users`
  - [ ] Happy path: Quản lý danh sách toàn bộ người dùng, lọc theo role, status, search (Status 200).
  - [ ] Role check: Tài khoản không phải ADMIN gọi API (Status 403: "FORBIDDEN - Admin role required").
- [ ] `GET /api/admin/users/:id`
  - [ ] Happy path: Xem chi tiết thông tin quản trị của người dùng (Status 200).
- [ ] `PUT /api/admin/users/:id`
  - [ ] Happy path: Cập nhật role, status (ACTIVE/INACTIVE) (Status 200).
- [ ] `DELETE /api/admin/users/:id`
  - [ ] Happy path: Xóa tài khoản người dùng (Status 200).
  - [ ] Business rule: Không thể tự xóa tài khoản của chính mình (Status 400: "Cannot delete your own account").
  - [ ] Business rule: Không thể xóa tài khoản Admin cuối cùng trong hệ thống (Status 409: "Cannot delete the last admin").
- [ ] `POST /api/admin/users`
  - [ ] Happy path: Admin tạo trực tiếp tài khoản Giảng viên (Teacher) (Status 201).

### 4.2. Course & Category Moderation
- [ ] `GET /api/admin/courses`
  - [ ] Happy path: Xem toàn bộ khóa học hệ thống (kể cả pending, rejected, destroyed) (Status 200).
- [ ] `POST /api/admin/courses`
  - [ ] Happy path: Admin tạo khóa học (Status 201: status=APPROVED ngay lập tức).
- [ ] `PUT /api/admin/courses/:id`
  - [ ] Happy path: Admin cập nhật thông tin bất kỳ khóa học nào (Status 200).
- [ ] `DELETE /api/admin/courses/:id`
  - [ ] Happy path: Admin soft-delete bất kỳ khóa học nào (Status 200).
- [ ] `PATCH /api/admin/courses/teacher/:id`
  - [ ] Happy path: Duyệt khóa học (APPROVED) hoặc Từ chối (REJECTED), tự động gửi thông báo cho Giảng viên (Status 200).
- [ ] `POST /api/admin/categories` & `PUT /api/admin/categories/:id` & `DELETE /api/admin/categories/:id`
  - [ ] Happy path: Tạo, sửa, soft-delete danh mục khóa học (Status 201 / 200).

### 4.3. Order & Comment Moderation
- [ ] `GET /api/orders`
  - [ ] Happy path: Lấy danh sách toàn bộ đơn hàng trong hệ thống (Status 200).
- [ ] `PUT /api/orders/:id`
  - [ ] Happy path: Duyệt hoàn tất đơn hàng (COMPLETED) hoặc Hủy đơn hàng (REJECTED) (Status 200).
- [ ] `DELETE /api/comments/admin/:id`
  - [ ] Happy path: Admin xóa bất kỳ bình luận vi phạm nào (Status 200).
- [ ] `PUT /api/ratings/manage/:id` & `DELETE /api/ratings/manage/:id`
  - [ ] Happy path: Ẩn/hiện hoặc xóa đánh giá vi phạm (Status 200).
