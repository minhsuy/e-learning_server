# BÁO CÁO CẬP NHẬT TÀI LIỆU API — PHÂN HỆ GAMIFICATION
**Phase**: Phase 5.5 — API Documentation (Gamification, XP, Rank, Streak, Leaderboard)  
**Thời gian hoàn thành**: 2026-10-07  
**Phạm vi tác động**: Duy nhất thư mục tài liệu `docs/api/` (`d:/e-learning/api/`) và báo cáo tiến độ `docs/progress/`.  
**Cam kết tuân thủ**:
- ✅ Không sửa đổi backend mã nguồn (`src/`).
- ✅ Không sửa đổi cơ sở dữ liệu PostgreSQL hay Prisma Schema (`prisma/`).
- ✅ Không sửa đổi giao diện frontend.
- ✅ Không document seed data (360 khóa học hay 81 demo users).
- ✅ Dừng lại ngay sau khi hoàn thành báo cáo này.

---

## 1. Danh Sách Tệp Đã Tạo & Cập Nhật

| Thao tác | Đường dẫn tệp | Mô tả nội dung |
| :---: | :--- | :--- |
| **CREATED** | `docs/progress/PHASE_5_5_GAMIFICATION_API_DOCS_REPORT.md` | Báo cáo chi tiết quá trình hoàn thiện tài liệu API Gamification |
| **UPDATED** | `docs/api/GAMIFICATION_LEADERBOARD_API.md` | Đặc tả chi tiết toàn bộ 6 HTTP endpoints read-side của Gamification, kèm quy chuẩn điểm thưởng, hệ thống danh hiệu và ghi chú tích hợp Frontend |
| **UPDATED** | `docs/api/API_INDEX.md` | Cập nhật Master Catalog: nâng tổng số REST endpoints từ **96** lên **102**, bổ sung Domain `Gamification` |
| **UPDATED** | `docs/api/API_ENUM_REFERENCE.md` | Bổ sung enum `XPTransactionType` (Database vs Application values, Event Key conventions) và Bảng tham chiếu Rank System (Levels 1–7) |
| **UPDATED** | `docs/api/USER_API.md` | Bổ sung ghi chú liên kết (cross-reference) các endpoint `/api/users/me/*` về tài liệu Gamification |

---

## 2. Danh Sách API Đã Được Document

Đã đối chiếu và tài liệu hóa 100% chuẩn xác theo triển khai thực tế tại Backend:

| # | HTTP Method | Endpoint URL | Authentication | Query Params | Mục đích & Trả về |
| :-: | :---: | :--- | :---: | :--- | :--- |
| 1 | `GET` | `/api/leaderboard` | Public / Tùy chọn Auth | `page`, `limit`, `includeMe` | Bảng xếp hạng học viên toàn cầu theo điểm XP (thuật toán thi đấu `RANK()` 1224). Hỗ trợ trả kèm thứ hạng bản thân nếu gửi Bearer token và `includeMe=true`. |
| 2 | `GET` | `/api/leaderboard/me` | Bearer JWT | Không có | Vị trí thứ hạng chính xác của người dùng hiện tại trên Leaderboard. |
| 3 | `GET` | `/api/users/me/leaderboard-position` | Bearer JWT | Không có | Alias endpoint của `/api/leaderboard/me`, phục vụ client gom nhóm theo prefix `/api/users/me/*`. |
| 4 | `GET` | `/api/users/me/xp-summary` | Bearer JWT | Không có | Tổng quan điểm XP, cấp bậc hiện tại (`rank`), cấp bậc kế tiếp (`nextRank`), và số điểm cần đạt để thăng cấp (`xpToNextRank`). |
| 5 | `GET` | `/api/users/me/streak` | Bearer JWT | Không có | Chuỗi ngày học liên tiếp (`currentStreak`), kỷ lục streak (`longestStreak`), thời điểm hoạt động cuối cùng theo múi giờ `Asia/Ho_Chi_Minh`. |
| 6 | `GET` | `/api/users/me/xp-history` | Bearer JWT | `page`, `limit`, `type` | Lịch sử các giao dịch cộng điểm XP có phân trang và hỗ trợ lọc theo loại sự kiện (`LESSON_COMPLETED`, `QUIZ_COMPLETED`, `DAILY_STREAK`). |

Mỗi endpoint trong `docs/api/GAMIFICATION_LEADERBOARD_API.md` đều có đầy đủ:
- Method & URL
- Authentication & Roles
- Query Parameters / Body
- JSON Schema & Field Descriptions
- Pagination Schema
- Error Responses (400, 401, 404, 500)
- Ví dụ Request / Response thực tế
- Ghi chú tích hợp Frontend (Frontend Usage Notes)

---

## 3. Quy Chuẩn Giao Dịch XP (XP Transaction Reference)

Đã tài liệu hóa đầy đủ trong `API_ENUM_REFERENCE.md` và `GAMIFICATION_LEADERBOARD_API.md`:

| Loại giao dịch (DB / App) | Điểm thưởng | Điều kiện kích hoạt | Cấu trúc `eventKey` duy nhất | Cơ chế Idempotency |
| :--- | :---: | :--- | :--- | :--- |
| `lesson_completed`<br>`LESSON_COMPLETED` | **+70 XP** | Hoàn thành bài học hợp lệ lần đầu tiên | `lesson-complete:{userId}:{lessonId}` | Chỉ nhận thưởng 1 lần duy nhất trên từng bài học |
| `quiz_completed`<br>`QUIZ_COMPLETED` | **+100 XP** | Nộp bài kiểm tra Quiz hoàn tất lần đầu tiên | `quiz-complete:{userId}:{quizId}` | Chỉ nhận thưởng 1 lần duy nhất trên từng Quiz |
| `daily_streak`<br>`DAILY_STREAK` | **+20 XP** | Hoạt động học tập đầu tiên trong ngày theo múi giờ `Asia/Ho_Chi_Minh` | `daily-streak:{userId}:{YYYY-MM-DD}` | Chỉ nhận thưởng 1 lần duy nhất mỗi ngày lịch |

---

## 4. Bảng Tham Chiếu Danh Hiệu (Rank System Reference)

Được tài liệu hóa chính xác theo Application Domain Model tại `src/models/xp.model.ts`:
* Danh hiệu **không lưu cứng trong database** mà được suy luận động từ `User.xpTotal`.

| Cấp độ (Level) | Danh hiệu (Rank Name) | Điểm tối thiểu (`minXP`) | Điểm tối đa (`maxXP`) | Mô tả đối tượng học viên |
| :---: | :--- | :---: | :---: | :--- |
| **Level 1** | **Beginner** | `0` | `499` | Học viên mới bắt đầu, hoàn thành 1–4 bài học đầu tiên. |
| **Level 2** | **Explorer** | `500` | `1,499` | Học viên khám phá, bắt đầu làm quiz và tích lũy chuỗi ngày học. |
| **Level 3** | **Learner** | `1,500` | `2,999` | Học viên chăm chỉ, duy trì học tập thường xuyên. |
| **Level 4** | **Skilled** | `3,000` | `5,999` | Học viên kỹ năng tốt, hoàn thành nhiều bài học và quiz. |
| **Level 5** | **Advanced** | `6,000` | `9,999` | Học viên nâng cao, hoàn thành nhiều khóa học khó. |
| **Level 6** | **Expert** | `10,000` | `19,999` | Chuyên gia học tập, điểm tích lũy lớn, streak dài. |
| **Level 7** | **Master** | `20,000` | Không giới hạn | Bậc thầy học tập, top đầu hệ thống TMdemy. |

---

## 5. Kết Quả Kiểm Tra Tính Nhất Quán (Consistency Check)

| Hạng mục kiểm tra | Thành phần Backend đối soát | Trạng thái | Ghi chú kỹ thuật |
| :--- | :--- | :---: | :--- |
| **Routes** | `src/routes/leaderboard.route.ts`<br>`src/routes/user.route.ts` | **PASS** | Đường dẫn URL, HTTP method và thứ tự middleware khớp 100%. |
| **Controllers** | `src/controller/leaderboard.controller.ts`<br>`src/controller/gamification.controller.ts` | **PASS** | Tên controller, tham số trích xuất (`req.query`, `req.user.userId`) và format phản hồi khớp 100%. |
| **Services** | `src/services/leaderboard.service.ts`<br>`src/services/xp.service.ts`<br>`src/services/streak.service.ts` | **PASS** | Logic xử lý nghiệp vụ, tính toán phân trang và cấu trúc dữ liệu trả về khớp 100%. |
| **Middlewares / Validators** | `src/middlewares/gamification.middleware.ts`<br>`src/middlewares/verifyToken.ts` | **PASS** | Express Validator chains (`leaderboardQueryValidator`, `xpHistoryQueryValidator`) và token verification khớp 100%. |
| **Response Types** | Zod Domain Model (`src/models/xp.model.ts`) | **PASS** | Các trường JSON, cấu trúc `rankDetail`, `pagination`, và `transactions` hoàn toàn đồng nhất. |
| **Data Protection** | Functional Repositories (`leaderboard.repository.ts`, `xp.repository.ts`) | **PASS** | Các trường nhạy cảm (`password`, `email`, `phone`, `refreshToken`, `resetPasswordToken`, `otpCode`) được loại trừ tuyệt đối. |

---

## 6. Ghi Nhận Khoảng Trống Triển Khai (Backend Gaps)

Trong quá trình đối soát tài liệu với backend implementation, ghi nhận 2 điểm kỹ thuật sau:

1. `[BACKEND GAP 1]` **Casing của query parameter `type` tại `GET /api/users/me/xp-history`**:
   * **Hiện trạng**: Trong PostgreSQL enum vật lý, các giá trị được lưu ở dạng lowercase (`lesson_completed`, `quiz_completed`, `daily_streak`). Tuy nhiên, `xpHistoryQueryValidator` tại `src/middlewares/gamification.middleware.ts` kiểm tra tính hợp lệ bằng `isIn(Object.values(XPTransactionType))`, vốn là mảng các giá trị uppercase (`LESSON_COMPLETED`, `QUIZ_COMPLETED`, `DAILY_STREAK`).
   * **Tác động**: Nếu Client gửi dạng lowercase (`?type=lesson_completed`), Express Validator sẽ trả về lỗi `400 Bad Request` ("Invalid XP transaction type").
   * **Hướng xử lý trong tài liệu**: Đã ghi chú rõ ràng trong tài liệu `GAMIFICATION_LEADERBOARD_API.md` để Frontend gửi đúng enum viết hoa.
   * **Khuyến nghị tương lai (khi được phép sửa code backend)**: Có thể chuyển đổi query validator sang case-insensitive hoặc hỗ trợ cả 2 định dạng để thân thiện hơn với API consumers.

2. `[BACKEND GAP 2]` **Sự tồn tại song song của 2 endpoint thứ hạng cá nhân**:
   * **Hiện trạng**: Hệ thống đồng thời cung cấp `GET /api/leaderboard/me` và `GET /api/users/me/leaderboard-position`.
   * **Tác động**: Cả hai đều gọi chung hàm `getUserLeaderboardPositionController` và trả về kết quả tương đương 100%.
   * **Đánh giá**: Đây là thiết kế alias hợp lý giúp cả 2 hướng tiếp cận routing (nhóm theo tính năng Leaderboard hay nhóm theo tài khoản User) đều hoạt động trơn tru mà không gây mâu thuẫn hay lỗi hồi quy. Đã document đầy đủ cả hai endpoint.

---

## 7. Trạng Thái Hoàn Thành

* **Mục tiêu đề ra**: Hoàn thành 100%.
* **Số tài liệu API cập nhật**: 4 files (`GAMIFICATION_LEADERBOARD_API.md`, `API_INDEX.md`, `API_ENUM_REFERENCE.md`, `USER_API.md`).
* **Tiếp tục theo chỉ thị**: **DỪNG TẠI ĐÂY**. Không tự ý chuyển sang phase tiếp theo.
