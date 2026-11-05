# BÁO CÁO KẾT QUẢ SỬA LỖI: NOTIFICATION BÀI HỌC CHO HỌC VIÊN (F7.5-B.3 FIX REPORT)

> **Dự án**: TMDEMY E-Learning Backend  
> **Nhiệm vụ**: F7.5-B.3 FIX — Lesson Notification Recipients  
> **Tài liệu kiểm toán gốc**: [docs/progress/F7_5_B3_BACKEND_LESSON_NOTIFICATION_AUDIT.md](file:///d:/e-learning_server/docs/progress/F7_5_B3_BACKEND_LESSON_NOTIFICATION_AUDIT.md)  
> **Trạng thái**: **COMPLETED — ĐÃ SỬA LỖI, TEST 100% PASS, SẴN SÀNG REVIEW**  
> **Ngày hoàn thành**: 15/10/2026  

---

## 1. TỔNG QUAN KẾT QUẢ THỰC HIỆN

Nhiệm vụ sửa lỗi người nhận thông báo bài học (`LESSON` notification) đã được thực hiện chính xác và tối thiểu theo đúng chỉ đạo phê duyệt:
1. **Phạm vi người nhận**: Mở rộng câu truy vấn danh sách học viên đã ghi danh để bao gồm cả 2 trạng thái `ACTIVE` (đang học) và `COMPLETED` (đã hoàn thành 100% các bài trước đó), chỉ loại trừ `CANCELED` (đã hủy ghi danh/hoàn tiền).
2. **Loại trừ tự gửi cho Giáo viên**: Thêm điều kiện bỏ qua `userId` của giáo viên tạo bài học nếu giáo viên đó cũng có tên trong danh sách Enrollment của khóa học (`studentId === userId`).
3. **Bảo toàn kiến trúc**:
   * Không thay đổi Prisma Schema.
   * Không thực hiện database migration.
   * Không thay đổi API contract (`POST /api/lessons` và `GET /api/notifications` giữ nguyên 100%).
   * Không ảnh hưởng đến các loại notification khác (`ORDER`, `COMMENT`, `COMMENT_REPLY`, `RATING`).
   * Giữ nguyên cơ chế Socket.IO emit và không can thiệp logic Enrollment / Progress.

---

## 2. CHI TIẾT CÁC TẬP TIN THAY ĐỔI & LOGIC TRƯỚC / SAU

### 2.1. File 1: `src/repositories/enrollment.repository.ts`

* **Vị trí**: Hàm [findActiveEnrolledUserIdsByCourseId](file:///d:/e-learning_server/src/repositories/enrollment.repository.ts#L308-L325).
* **Mục đích**: Lấy danh sách ID học viên sở hữu khóa học cần nhận thông báo khi có bài học mới.
* **Diff thay đổi**:
  ```diff
   export const findActiveEnrolledUserIdsByCourseId = async (
     courseId: string,
     tx?: PrismaTransactionClient
   ): Promise<string[]> => {
     const client = tx || prisma
     const enrollments = await client.enrollment.findMany({
       where: {
         courseId,
  -      status: EEnrollmentStatus.ACTIVE
  +      status: {
  +        in: [EEnrollmentStatus.ACTIVE, EEnrollmentStatus.COMPLETED]
  +      }
       },
       select: {
         userId: true
       }
     })
     return enrollments.map((e) => e.userId)
   }
  ```
* **Phân tích logic**:
  * **Trước**: Chỉ truy vấn `status: EEnrollmentStatus.ACTIVE`. Khi học viên đạt 100% tiến độ, trạng thái enrollment chuyển sang `COMPLETED`, khiến toàn bộ học viên hoàn thành khóa học bị bỏ sót (tại khóa TailwindCSS Masterclass là 14/19 học viên bị bỏ sót).
  * **Sau**: Truy vấn cả `ACTIVE` và `COMPLETED`. Học viên đã hoàn thành khóa học trước đó vẫn nhận được thông báo bài học mới trọn đời. Chỉ học viên có trạng thái `CANCELED` bị loại trừ.

---

### 2.2. File 2: `src/services/lesson.service.ts`

* **Vị trí**: Hàm [createLessonService](file:///d:/e-learning_server/src/services/lesson.service.ts#L133-L157).
* **Mục đích**: Bỏ qua việc gửi thông báo bài học cho chính giáo viên đang tạo bài học.
* **Diff thay đổi**:
  ```diff
     // Non-blocking notification dispatch to active enrolled students
     try {
       const enrolledUserIds = await findActiveEnrolledUserIdsByCourseId(course)
       for (const studentId of enrolledUserIds) {
  +      if (studentId === userId) {
  +        continue
  +      }
         try {
           await pushNotificationService({
             senderId: userId,
             receiverId: studentId,
             type: ENotificationType.LESSON,
             message: `Có bài học mới "${lesson.title}" trong khóa học "${courseDoc.title}"`,
             relatedId: lesson.id,
             metadata: {
               courseId: courseDoc.id,
               courseSlug: courseDoc.slug,
               lessonId: lesson.id
             }
           })
         } catch (notifErr) {
           console.warn(`[Lesson Notification Dispatch Error to student ${studentId}]:`, notifErr)
         }
       }
  ```
* **Phân tích logic**:
  * **Trước**: Nếu giáo viên tự ghi danh vào khóa học của chính mình (ví dụ để kiểm thử), giáo viên sẽ tự nhận thông báo của bài học do mình vừa tạo.
  * **Sau**: Kiểm tra `if (studentId === userId) continue;`, triệt tiêu hoàn toàn thông báo thừa cho chính tác giả.

---

## 3. KẾT QUẢ KIỂM THỬ XÁC NHẬN (VERIFICATION RESULTS)

Đã thiết lập bộ kiểm thử toàn diện tại [scripts/test_f7_5_b3_lesson_notif_fix.ts](file:///d:/e-learning_server/scripts/test_f7_5_b3_lesson_notif_fix.ts) với môi trường cô lập, bao gồm đầy đủ 3 nhóm học viên (`ACTIVE`, `COMPLETED`, `CANCELED`) và Giáo viên tạo bài học (`TEACHER`).

### 3.1. Kết quả kiểm thử bộ Fix (20/20 Tests PASS - 100%)

```text
=============================================================
🧪 TEST SUITE: F7.5-B.3 LESSON NOTIFICATION FIX VERIFICATION
=============================================================

Teacher: giaovientrungquoc (c79ee551-3b2e-48ca-9105-c0669f04e6bb)
Student ACTIVE: thaiminh (02e8e13a-dab2-5fb6-a14f-933ac125edca)
Student COMPLETED: tuan_em_do (074e1d54-703d-55e3-9cac-4ae606c70f58)
Student CANCELED: Thai Minh 02 (10a453d9-8307-4d35-a830-96dd449dd882)

--- 1. Testing findActiveEnrolledUserIdsByCourseId ---
  ✅ [PASS] Repository includes ACTIVE student
  ✅ [PASS] Repository includes COMPLETED student
  ✅ [PASS] Repository EXCLUDES CANCELED student
  ✅ [PASS] Repository returns all active/completed enrolled IDs (teacher included at repository level)
  ✅ [PASS] Repository returns exactly 3 enrolled users (ACTIVE + COMPLETED), got 3

--- 2. Testing createLessonService & Notification Dispatch ---
  ✅ [PASS] createLessonService succeeded
Total notifications generated: 2
  ✅ [PASS] ACTIVE student received notification in PostgreSQL
  ✅ [PASS] Notification metadata has correct courseId
  ✅ [PASS] Notification metadata has correct lessonId
  ✅ [PASS] COMPLETED student received notification in PostgreSQL
  ✅ [PASS] CANCELED student did NOT receive notification
  ✅ [PASS] Teacher who created lesson did NOT receive notification (self-suppression)

--- 3. Testing GET /api/notifications for Students ---
  ✅ [PASS] ACTIVE student sees new lesson notification via getNotificationsService
  ✅ [PASS] COMPLETED student sees new lesson notification via getNotificationsService
  ✅ [PASS] CANCELED student does NOT see new lesson notification via getNotificationsService

--- 4. Testing Socket.IO Realtime Events ---
  ✅ [PASS] Socket.IO emitted "new_notification" to ACTIVE student room
  ✅ [PASS] Socket.IO emitted "new_notification" to COMPLETED student room
  ✅ [PASS] Socket.IO did NOT emit event to CANCELED student room
  ✅ [PASS] Socket.IO did NOT emit event to Teacher room

--- 5. Testing Duplicate Suppression ---
  ✅ [PASS] No duplicate notifications generated (2 total === 2 unique)

--- Cleaning up temporary test data ---
Cleanup completed.

=============================================================
SUMMARY: 20 PASSED, 0 FAILED
=============================================================
```

---

## 4. KẾT QUẢ KIỂM THỬ HỒI QUY (REGRESSION TESTING)

Đã chạy lại các bộ kiểm thử tự động của hệ thống Notification để xác nhận không phát sinh hồi quy:

1. **Bộ kiểm thử Notification Enhancement** ([scripts/test_notification_enhancement.ts](file:///d:/e-learning_server/scripts/test_notification_enhancement.ts)):
   * Kết quả: **47/47 tests PASS (100%)**.
   * Toàn bộ các kiểm thử tạo thông báo bài học (`LESSON`), bình luận (`COMMENT`), phản hồi bình luận (`COMMENT_REPLY`) và tương thích ngược metadata tiếp tục vượt qua tuyệt đối.
2. **Bộ kiểm thử Phase 10 Notification Suite** ([scripts/test_phase10_suite.ts](file:///d:/e-learning_server/scripts/test_phase10_suite.ts)):
   * Kết quả: **96/96 tests PASS (100%)**.
   * Toàn bộ các kiểm thử CRUD thông báo, pagination, read/unread, websocket dispatch và data integrity đều vượt qua 100%.

---

## 5. ĐÁNH GIÁ ẢNH HƯỞNG & ĐỘ AN TOÀN (SAFETY & IMPACT ASSESSMENT)

| Tiêu chí | Đánh giá | Chi tiết |
|---|---|---|
| **Prisma Schema** | **Không đổi** | Giữ nguyên 100% `prisma/schema.prisma`. |
| **Database Migration** | **Zero Migration** | Không có migration mới nào được tạo hoặc thực thi. |
| **API Contract** | **Không đổi** | Giữ nguyên 100% URL, headers, body và response của các endpoint. |
| **Các Notification type khác** | **Zero Impact** | `ORDER`, `COMMENT`, `COMMENT_REPLY`, `RATING` đều gửi 1-1 trực tiếp tới tác giả hoặc người liên quan, hoàn toàn không gọi `findActiveEnrolledUserIdsByCourseId`. |
| **Trải nghiệm người dùng** | **Khắc phục triệt để** | Khi giáo viên tạo bài học mới qua Postman, cả học viên đang học (`ACTIVE`) và học viên đã hoàn thành khóa học trước đó (`COMPLETED`) đều nhận được thông báo qua Socket.IO và thấy đầy đủ sau khi reload website. Học viên bị hủy đơn (`CANCELED`) không bị làm phiền. |

---

## 6. KẾT LUẬN & TRẠNG THÁI DỪNG

Nhiệm vụ **F7.5-B.3 FIX** đã hoàn thành, đảm bảo:
* Mã nguồn thay đổi tối thiểu, chuẩn xác và đúng vị trí.
* Đạt 20/20 tests xác nhận mới và 143/143 tests hồi quy cũ (100% PASS).
* Không để lại dữ liệu rác trong cơ sở dữ liệu.

Trạng thái: **DỪNG LẠI, CHỜ REVIEW TỪ CHỦ DỰ ÁN.**
