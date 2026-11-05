# TMDEMY — API DOCUMENTATION FINDINGS & DISCOVERIES

Tài liệu này ghi nhận các phát hiện kỹ thuật, điểm bất đối xứng hoặc lưu ý đặc biệt được phát hiện trong quá trình rà soát toàn bộ source code thực tế của backend TMDEMY (Routes, Middlewares, Controllers, Services, Repositories và Socket.IO).

---

## Finding 1: Đường dẫn thực tế của Comment Moderation Routes

* **Hiện trạng trong source code**:
  Trong file `src/routes/comment.route.ts`:
  ```typescript
  // commentRouter được mount tại /api/comments trong index.route.ts
  commentRouter.delete('/admin/:id', verifyAccessToken, isAdmin, commentIdValidator, handleValidationErrors, deleteCommentByAdminOrTeacherController)
  commentRouter.delete('/teacher/:id', verifyAccessToken, isTeacherOrAdmin, commentIdValidator, handleValidationErrors, deleteCommentByAdminOrTeacherController)
  ```
* **Endpoint thực tế**:
  * `DELETE /api/comments/admin/:id` (Admin xóa bình luận bất kỳ)
  * `DELETE /api/comments/teacher/:id` (Giảng viên xóa bình luận trong khóa học do mình sở hữu)
* **Lưu ý cho Frontend**: Endpoint này nằm dưới prefix `/api/comments/...`, KHÔNG phải `/api/admin/comments/:id` hay `/api/teacher/comments/:id`.

---

## Finding 2: Tạo tin nhắn Chat qua Realtime Socket.IO thay vì REST HTTP

* **Hiện trạng trong source code**:
  * File `src/controller/message.controller.ts` có chứa hàm `createMessageController`.
  * Tuy nhiên, file `src/routes/message.route.ts` **chỉ mount duy nhất 1 route REST**:
    ```typescript
    GET /api/messages/:conversationId
    ```
  * Việc gửi tin nhắn mới (`sendMessage`), sửa tin nhắn (`editMessage`), và xóa tin nhắn (`deleteMessage`) được xử lý hoàn toàn qua **Socket.IO** tại `src/socket/initSocket.ts`.
* **Lưu ý cho Frontend**:
  * Khi người dùng mở phòng chat: gọi `GET /api/messages/:conversationId` để lấy lịch sử tin nhắn ban đầu.
  * Khi gửi tin nhắn mới: emit Socket event `sendMessage` kèm payload `{ conversationId, content, type }`. Lắng nghe event `receiveMessage` để nhận tin nhắn mới theo thời gian thực.

---

## Finding 3: Prefix Route Quiz (Singular) và Submissions (Plural)

* **Hiện trạng trong source code**:
  * Router bài kiểm tra được mount ở dạng số ít: `/api/quiz` (trong `src/routes/index.route.ts`):
    * `POST /api/quiz`
    * `PUT /api/quiz/:quizId`
    * `DELETE /api/quiz/:quizId`
    * `GET /api/quiz/lesson/:lessonId`
  * Router nộp bài được mount ở dạng số nhiều: `/api/submissions`:
    * `POST /api/submissions`
    * `GET /api/submissions/:quizId`
    * `GET /api/submissions/teacher/:quizId`
    * `GET /api/submissions/teacher/analytics/:quizId`
* **Lưu ý cho Frontend**: Chú ý không nhầm lẫn giữa `/api/quiz` và `/api/quizzes`.

---

## Finding 4: Profile Public xem thông tin giảng viên & người dùng

* **Hiện trạng trong source code**:
  Trong `src/routes/user.route.ts`:
  ```typescript
  usersRouter.get('/profile/:id', getUserDetailValidator, handleValidationErrors, getUserDetailController)
  ```
  Route này **hoàn toàn Public (không yêu cầu Bearer token)** và tái sử dụng `getUserDetailService` từ `admin.service.ts` để trả về thông tin an toàn (ẩn password, refreshToken, OTP) của bất kỳ giảng viên/học viên nào theo UUID.
* **Lưu ý cho Frontend**: Có thể sử dụng trực tiếp endpoint `GET /api/users/profile/:id` để hiển thị trang thông tin Giảng viên (Teacher Profile) cho khách và học viên.

---

## Finding 5: Quy tắc chống gian lận (Anti-Cheat) trong Quiz

* **Hiện trạng trong source code**:
  Trong `src/services/quiz.service.ts` hàm `getQuizzesByLessonService`:
  ```typescript
  questions: quiz.questions.map((q) => ({
    ...withCompatId(q),
    quiz: q.quizId,
    type: q.type.toLowerCase(),
    title: q.title,
    options: q.options.map((opt) => opt.optionText),
    points: q.points
    // Tuyệt đối KHÔNG trả trường answer!
  }))
  ```
* **Ý nghĩa**: Học viên khi lấy danh sách câu hỏi chỉ nhận được nội dung câu hỏi và danh sách các lựa chọn (`options`). Đáp án đúng (`answer`) được bảo mật 100% tại database và chỉ dùng khi chấm điểm tại `POST /api/submissions`.

---

## Finding 6: Quy tắc tạo đơn hàng khóa học miễn phí (Free Course Order)

* **Hiện trạng trong source code**:
  Trong `src/services/order.service.ts` hàm `createOrderService`:
  * Nếu khóa học có `type = FREE` hoặc tổng tiền thanh toán sau khi trừ mã giảm giá bằng `0 VND` (`total === 0`):
    * Đơn hàng được tự động chuyển ngay sang trạng thái `COMPLETED`.
    * Hệ thống tự động tạo bản ghi `Enrollment` (ghi danh học viên) ngay lập tức.
    * Hệ thống tự động đưa học viên vào nhóm chat (`Conversation`) của khóa học.
* **Lưu ý cho Frontend**: Đối với các khóa học miễn phí, sau khi gọi `POST /api/orders`, Frontend không cần chuyển qua cổng thanh toán mà có thể chuyển hướng học viên vào thẳng phòng học (`/learning/:courseSlug`).

---

## Finding 7: Quy tắc Giảng viên chỉ được xóa khóa học PENDING

* **Hiện trạng trong source code**:
  Trong `src/services/teacher.service.ts` hàm `deleteCoursesByTeacherService`:
  ```typescript
  if (course.status !== CourseStatus.PENDING) {
    return { success: false, statusCode: 403, message: 'Only pending courses can be deleted by teacher' }
  }
  ```
* **Ý nghĩa**: Giảng viên chỉ có quyền xóa các khóa học đang chờ duyệt (`PENDING`). Nếu khóa học đã được Admin duyệt (`APPROVED`) hoặc bị từ chối (`REJECTED`), giảng viên không thể tự xóa để bảo vệ quyền lợi của học viên đã mua khóa học và tính toàn vẹn của lịch sử đơn hàng. Chỉ Admin mới có quyền xóa (`DELETE /api/admin/courses/:id`).

---

## Finding 8: Quy tắc Lesson Drop-off Funnel

* **Hiện trạng trong source code**:
  Trong `src/services/teacherStatistic.service.ts` hàm `getCoursePerformanceService`:
  * Drop-off của bài học đầu tiên luôn là `0%`.
  * Từ bài thứ 2 trở đi:
    $$\text{dropOffFromPrevious} = \frac{\text{previousCompleted} - \text{currentCompleted}}{\text{previousCompleted}} \times 100$$
  * Nếu `previousCompleted = 0`, giá trị là `0%` (không có lỗi chia cho 0).
  * Backend thống kê dựa trên cờ `Progress.completed = true`, KHÔNG phải là video telemetry / watch time (vì database hiện tại không lưu thời gian xem từng giây của video).
