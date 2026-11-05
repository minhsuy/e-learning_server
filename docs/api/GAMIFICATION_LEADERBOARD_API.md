# GAMIFICATION & LEADERBOARD API SPECIFICATION

Tài liệu đặc tả toàn bộ các HTTP API READ-SIDE thuộc phân hệ Gamification (XP, Rank, Streak, Leaderboard) cho **TMDEMY E-Learning Backend**.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. Danh Sách Endpoint Tổng Quan

| Method | Endpoint | Quyền truy cập | Roles | Mục đích |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/leaderboard` | Public / Tùy chọn Auth | All | Bảng xếp hạng người dùng toàn cầu theo điểm XP (`RANK()` 1224) |
| `GET` | `/api/leaderboard/me` | Bearer JWT | All | Vị trí xếp hạng của người dùng hiện tại trên Leaderboard |
| `GET` | `/api/users/me/leaderboard-position` | Bearer JWT | All | Vị trí xếp hạng của người dùng hiện tại (Alias của `/api/leaderboard/me`) |
| `GET` | `/api/users/me/xp-summary` | Bearer JWT | All | Tổng quan điểm XP, Rank hiện tại, Rank tiếp theo và khoảng cách điểm |
| `GET` | `/api/users/me/streak` | Bearer JWT | All | Thông tin chuỗi ngày học liên tiếp (`currentStreak`, `longestStreak`, `Asia/Ho_Chi_Minh`) |
| `GET` | `/api/users/me/xp-history` | Bearer JWT | All | Lịch sử các giao dịch cộng điểm XP có phân trang và lọc theo loại |

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

### 2.1. GET `/api/leaderboard`

* **Method**: `GET`
* **URL**: `/api/leaderboard`
* **Mục đích**: Lấy danh sách bảng xếp hạng học viên có điểm XP cao nhất trên toàn hệ thống. Áp dụng chuẩn xếp hạng thi đấu (`Standard Competition Ranking 1224`) qua PostgreSQL Window Function `RANK() OVER (ORDER BY xp_total DESC)`.
* **Authentication**: **Public** (Không bắt buộc token).
  * Nếu Client truyền header `Authorization: Bearer <access_token>` kèm query parameter `includeMe=true`, backend sẽ bổ sung thêm object `currentUser` chứa vị trí và thông tin xếp hạng của chính người dùng đó.
* **Query Parameters**:
  * `page` *(optional, integer, mặc định: `1`)*: Số trang cần lấy (tối thiểu: 1).
  * `limit` *(optional, integer, mặc định: `20`)*: Số lượng bản ghi trên một trang (từ 1 đến 100).
  * `includeMe` *(optional, boolean, mặc định: `false`)*: Trả về object `currentUser` khi đã đăng nhập (`true` | `false`).
* **Request Body**: Không có.
* **Bảo vệ dữ liệu nhạy cảm**: Database projection loại trừ hoàn toàn `password`, `email`, `phone`, `refreshToken`, `resetPasswordToken`, `otpCode` ngay tại tầng truy vấn SQL.
* **Ví dụ Request**:
  ```http
  GET /api/leaderboard?page=1&limit=10&includeMe=true HTTP/1.1
  Host: localhost:3002
  Authorization: Bearer <access_token>
  ```
* **Ví dụ Response thành công (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched leaderboard successfully",
    "data": {
      "leaderboard": [
        {
          "rank": 1,
          "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
          "username": "khang_leaderboard_no1",
          "avatar": "https://example.com/avatar1.jpg",
          "xpTotal": 24700,
          "currentStreak": 45,
          "rankName": "Master",
          "rankLevel": 7
        },
        {
          "rank": 2,
          "userId": "13608f92-8acf-53e3-adcb-0d832e9cb1d4",
          "username": "kiet_apex_learner",
          "avatar": "",
          "xpTotal": 22740,
          "currentStreak": 43,
          "rankName": "Master",
          "rankLevel": 7
        },
        {
          "rank": 3,
          "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
          "username": "khoa_grandmaster",
          "avatar": "",
          "xpTotal": 20800,
          "currentStreak": 40,
          "rankName": "Master",
          "rankLevel": 7
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 81,
        "totalPages": 9
      },
      "currentUser": {
        "rank": 3,
        "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
        "username": "khoa_grandmaster",
        "avatar": "",
        "xpTotal": 20800,
        "currentStreak": 40,
        "rankName": "Master",
        "rankLevel": 7
      }
    }
  }
  ```
* **Error Responses**:
  * `400 Bad Request`:
    ```json
    {
      "success": false,
      "error": "limit must be an integer between 1 and 100"
    }
    ```
  * `500 Internal Server Error`:
    ```json
    {
      "success": false,
      "error": "Internal Server Error"
    }
    ```
* **Frontend Usage Notes**:
  * Dùng cho trang Leaderboard chính (`/leaderboard`).
  * Khi người dùng đã đăng nhập, luôn gửi `Authorization: Bearer <token>` kèm `includeMe=true` để lấy thứ hạng của chính mình cùng lúc với bảng xếp hạng, tránh việc phải gửi 2 request song song.
  * Nếu người dùng chưa đăng nhập hoặc token không hợp lệ, trường `currentUser` sẽ tự động không xuất hiện trong `data`.

---

### 2.2. GET `/api/leaderboard/me`

* **Method**: `GET`
* **URL**: `/api/leaderboard/me`
* **Mục đích**: Lấy vị trí thứ hạng chính xác của người dùng đang đăng nhập trên bảng xếp hạng toàn cầu mà không cần tải danh sách toàn bộ học viên.
* **Authentication**: **Bắt buộc đăng nhập** (`Bearer JWT`).
* **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
* **Query Parameters**: Không có.
* **Request Body**: Không có.
* **Ví dụ Request**:
  ```http
  GET /api/leaderboard/me HTTP/1.1
  Host: localhost:3002
  Authorization: Bearer <access_token>
  ```
* **Ví dụ Response thành công (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched user leaderboard position successfully",
    "data": {
      "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
      "username": "charlie_dev",
      "avatar": "https://example.com/avatar.jpg",
      "xpTotal": 3200,
      "rank": 15,
      "rankName": "Skilled",
      "rankLevel": 4,
      "currentStreak": 7
    }
  }
  ```
* **Error Responses**:
  * `401 Unauthorized`:
    ```json
    {
      "success": false,
      "error": "Access Token is missing!"
    }
    ```
  * `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "User not found on leaderboard"
    }
    ```
* **Frontend Usage Notes**:
  * Phù hợp cho Leaderboard Sticky Banner hoặc Widget hồ sơ cá nhân khi chỉ cần hiển thị "Hạng #15".
  * Logic và cấu trúc dữ liệu hoàn toàn tương đồng với endpoint `/api/users/me/leaderboard-position`.

---

### 2.3. GET `/api/users/me/leaderboard-position`

* **Method**: `GET`
* **URL**: `/api/users/me/leaderboard-position`
* **Mục đích**: Alias endpoint của `/api/leaderboard/me`, phục vụ các Client muốn gom nhóm toàn bộ API thông tin cá nhân dưới prefix `/api/users/me/*`.
* **Authentication**: **Bắt buộc đăng nhập** (`Bearer JWT`).
* **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
* **Query Parameters**: Không có.
* **Request Body**: Không có.
* **Ví dụ Request**:
  ```http
  GET /api/users/me/leaderboard-position HTTP/1.1
  Host: localhost:3002
  Authorization: Bearer <access_token>
  ```
* **Ví dụ Response thành công (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched user leaderboard position successfully",
    "data": {
      "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
      "username": "charlie_dev",
      "avatar": "https://example.com/avatar.jpg",
      "xpTotal": 3200,
      "rank": 15,
      "rankName": "Skilled",
      "rankLevel": 4,
      "currentStreak": 7
    }
  }
  ```
* **Error Responses**:
  * `401 Unauthorized`: Missing hoặc invalid Access Token.
  * `404 Not Found`: Người dùng không tồn tại trên hệ thống.
* **Frontend Usage Notes**:
  * Client có thể sử dụng linh hoạt giữa `/api/leaderboard/me` hoặc `/api/users/me/leaderboard-position` tùy theo kiến trúc module frontend.

---

### 2.4. GET `/api/users/me/xp-summary`

* **Method**: `GET`
* **URL**: `/api/users/me/xp-summary`
* **Mục đích**: Lấy thông tin tổng quan về điểm kinh nghiệm (XP), danh hiệu cấp bậc hiện tại (`rank`), cấp bậc kế tiếp (`nextRank`) và số điểm cần tích lũy để thăng cấp (`xpToNextRank`).
* **Authentication**: **Bắt buộc đăng nhập** (`Bearer JWT`).
* **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
* **Query Parameters**: Không có.
* **Request Body**: Không có.
* **Ví dụ Request**:
  ```http
  GET /api/users/me/xp-summary HTTP/1.1
  Host: localhost:3002
  Authorization: Bearer <access_token>
  ```
* **Ví dụ Response thành công (200 OK - Cấp bậc trung gian)**:
  ```json
  {
    "success": true,
    "message": "Fetched user XP summary successfully",
    "data": {
      "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
      "username": "charlie_dev",
      "avatar": "",
      "xpTotal": 2450,
      "rank": {
        "name": "Learner",
        "minXP": 1500,
        "maxXP": 2999
      },
      "currentStreak": 14,
      "longestStreak": 21,
      "lastActivityAt": "2026-10-07T10:30:00.000Z",
      "nextRank": {
        "name": "Skilled",
        "minXP": 3000
      },
      "xpToNextRank": 550
    }
  }
  ```
* **Ví dụ Response thành công (200 OK - Đã đạt cấp bậc cao nhất Master)**:
  ```json
  {
    "success": true,
    "message": "Fetched user XP summary successfully",
    "data": {
      "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
      "username": "khang_leaderboard_no1",
      "avatar": "https://example.com/avatar.jpg",
      "xpTotal": 24700,
      "rank": {
        "name": "Master",
        "minXP": 20000
      },
      "currentStreak": 45,
      "longestStreak": 52,
      "lastActivityAt": "2026-10-07T14:15:00.000Z",
      "nextRank": null,
      "xpToNextRank": 0
    }
  }
  ```
* **Error Responses**:
  * `401 Unauthorized`: Missing hoặc hết hạn token.
  * `404 Not Found`: `{"success": false, "message": "User not found"}`.
* **Frontend Usage Notes**:
  * Dùng cho thanh tiến trình cấp độ (Level Progress Bar) trên Top Header và Profile Dashboard.
  * Cách tính % tiến độ thăng hạng trên Frontend:
    $$\text{Progress \%} = \frac{\text{xpTotal} - \text{rank.minXP}}{\text{nextRank.minXP} - \text{rank.minXP}} \times 100$$
  * Nếu `nextRank === null`, học viên đã đạt rank cao nhất (`Master`), hiển thị tiến độ 100% hoặc huy hiệu "Max Level".

---

### 2.5. GET `/api/users/me/streak`

* **Method**: `GET`
* **URL**: `/api/users/me/streak`
* **Mục đích**: Lấy chi tiết chuỗi ngày học liên tiếp (`currentStreak`), kỷ lục chuỗi ngày học cao nhất (`longestStreak`), thời điểm hoạt động gần nhất (`lastActivityAt`) và múi giờ kinh doanh áp dụng.
* **Authentication**: **Bắt buộc đăng nhập** (`Bearer JWT`).
* **Headers**:
  ```http
  Authorization: Bearer <access_token>
  ```
* **Query Parameters**: Không có.
* **Request Body**: Không có.
* **Ví dụ Request**:
  ```http
  GET /api/users/me/streak HTTP/1.1
  Host: localhost:3002
  Authorization: Bearer <access_token>
  ```
* **Ví dụ Response thành công (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched user streak successfully",
    "data": {
      "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
      "currentStreak": 14,
      "longestStreak": 21,
      "lastActivityAt": "2026-10-07T10:30:00.000Z",
      "timezone": "Asia/Ho_Chi_Minh"
    }
  }
  ```
* **Error Responses**:
  * `401 Unauthorized`: Token không hợp lệ hoặc thiếu header.
  * `404 Not Found`: Không tìm thấy bản ghi người dùng.
* **Frontend Usage Notes**:
  * Dùng cho Streak Counter Badge (biểu tượng ngọn lửa 🔥) trên thanh điều hướng chính.
  * Múi giờ kinh doanh cố định là `Asia/Ho_Chi_Minh` (UTC+7). Mỗi ngày mới bắt đầu tính từ 00:00:00 giờ Việt Nam.

---

### 2.6. GET `/api/users/me/xp-history`

* **Method**: `GET`
* **URL**: `/api/users/me/xp-history`
* **Mục đích**: Lấy danh sách lịch sử các giao dịch cộng điểm XP (`xp_transactions`) của người dùng đang đăng nhập có phân trang và hỗ trợ lọc theo loại sự kiện.
* **Authentication**: **Bắt buộc đăng nhập** (`Bearer JWT`).
* **Query Parameters**:
  * `page` *(optional, integer, mặc định: `1`)*: Số trang cần lấy (tối thiểu: 1).
  * `limit` *(optional, integer, mặc định: `20`)*: Số bản ghi mỗi trang (1 đến 100).
  * `type` *(optional, enum)*: Lọc theo loại sự kiện biến động điểm kinh nghiệm.
    * Giá trị hợp lệ theo Express Validator: `LESSON_COMPLETED`, `QUIZ_COMPLETED`, `DAILY_STREAK`.
* **Request Body**: Không có.
* **Sắp xếp mặc định**: Luôn sắp xếp theo thời gian mới nhất lên trước (`createdAt DESC, id DESC`).
* **Cách ly dữ liệu**: Mỗi học viên chỉ có thể xem lịch sử của chính mình, đảm bảo tính bảo mật và riêng tư.
* **Ví dụ Request**:
  ```http
  GET /api/users/me/xp-history?page=1&limit=5&type=QUIZ_COMPLETED HTTP/1.1
  Host: localhost:3002
  Authorization: Bearer <access_token>
  ```
* **Ví dụ Response thành công (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched XP history successfully",
    "data": {
      "transactions": [
        {
          "id": "e46d8eb2-19f5-4201-9099-d4f57713924a",
          "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
          "amount": 100,
          "type": "QUIZ_COMPLETED",
          "eventKey": "quiz-complete:25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2:b1f3c301-4475-4081-8077-ea6549a0d810",
          "createdAt": "2026-10-07T14:30:00.000Z"
        },
        {
          "id": "674a3ac4-2843-47ac-8694-c37337591298",
          "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
          "amount": 20,
          "type": "DAILY_STREAK",
          "eventKey": "daily-streak:25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2:2026-10-07",
          "createdAt": "2026-10-07T08:15:00.000Z"
        },
        {
          "id": "3a07b719-7988-4c33-b9dc-cf9c3e981aa7",
          "userId": "25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2",
          "amount": 70,
          "type": "LESSON_COMPLETED",
          "eventKey": "lesson-complete:25f22d9a-be53-4529-b0b8-a3dd0cb9c8f2:9b1a52fc-0012-4c28-98e3-0c46a81b37e5",
          "createdAt": "2026-10-07T08:15:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 5,
        "total": 3,
        "totalPages": 1
      }
    }
  }
  ```
* **Error Responses**:
  * `400 Bad Request` (Tham số `type` sai):
    ```json
    {
      "success": false,
      "error": "Invalid XP transaction type"
    }
    ```
  * `400 Bad Request` (Tham số `limit` sai):
    ```json
    {
      "success": false,
      "error": "limit must be an integer between 1 and 100"
    }
    ```
  * `401 Unauthorized`: Missing hoặc expired Access Token.
* **Frontend Usage Notes**:
  * Dùng cho trang Nhật ký biến động điểm (`/profile/xp-history`).
  * Có thể dựng tab filter: `Tất cả` (không truyền `type`), `Bài học` (`LESSON_COMPLETED`), `Kiểm tra` (`QUIZ_COMPLETED`), `Chuyên cần` (`DAILY_STREAK`).

---

## 3. Quy Chuẩn Điểm Thưởng & Giao Dịch XP (XP Transaction Reference)

Điểm thưởng kinh nghiệm được cấp phát thông qua các hành vi học tập thực tế và được đảm bảo tính bất biến (idempotency) thông qua trường `eventKey UNIQUE` trên bảng `xp_transactions`.

| Loại giao dịch (Database / Application) | Mức điểm thưởng | Quy tắc kích hoạt | Định dạng Event Key (`eventKey`) | Tính lũy lặp lại (Idempotency) |
| :--- | :---: | :--- | :--- | :--- |
| `lesson_completed`<br>`LESSON_COMPLETED` | **+70 XP** | Học viên bấm hoàn thành một bài học hợp lệ lần đầu tiên. | `lesson-complete:{userId}:{lessonId}` | **Chỉ 1 lần duy nhất** cho mỗi cặp User - Lesson. Không cộng điểm khi hoàn thành lại. |
| `quiz_completed`<br>`QUIZ_COMPLETED` | **+100 XP** | Học viên nộp bài làm Quiz và hoàn thành lần đầu tiên. | `quiz-complete:{userId}:{quizId}` | **Chỉ 1 lần duy nhất** cho mỗi cặp User - Quiz. Không cộng điểm khi nộp lại quiz. |
| `daily_streak`<br>`DAILY_STREAK` | **+20 XP** | Hoạt động học tập đầu tiên trong ngày theo múi giờ `Asia/Ho_Chi_Minh`. | `daily-streak:{userId}:{YYYY-MM-DD}` | **Chỉ 1 lần duy nhất** mỗi ngày lịch (business day). |

---

## 4. Hệ Thống Danh Hiệu Học Viên (Rank System Reference)

Hệ thống Gamification của TMdemy áp dụng cơ chế **Dynamic Rank Derivation** (Suy luận danh hiệu động):
* Danh hiệu **không được lưu tĩnh trong cơ sở dữ liệu**.
* Được tính toán trực tiếp từ `User.xpTotal` tại thời điểm query thông qua hàm nghiệp vụ `getRankDetailFromXp(xpTotal)` tại Application Layer (`src/models/xp.model.ts`).

| Cấp độ (Level) | Danh hiệu (Rank Name) | Ngưỡng điểm tối thiểu (minXP) | Ngưỡng điểm tối đa (maxXP) | Mô tả học viên |
| :---: | :--- | :---: | :---: | :--- |
| **Level 1** | **Beginner** | `0` | `499` | Học viên mới bắt đầu, vừa tạo tài khoản hoặc học thử 1-4 bài. |
| **Level 2** | **Explorer** | `500` | `1,499` | Học viên khám phá, bắt đầu hoàn thành bài học và quiz đầu tiên. |
| **Level 3** | **Learner** | `1,500` | `2,999` | Học viên chăm chỉ, duy trì chuỗi học và tích lũy kiến thức đều đặn. |
| **Level 4** | **Skilled** | `3,000` | `5,999` | Học viên có kỹ năng vững vàng, hoàn thành nhiều module bài học. |
| **Level 5** | **Advanced** | `6,000` | `9,999` | Học viên nâng cao, hoàn thành nhiều khóa học và quiz độ khó cao. |
| **Level 6** | **Expert** | `10,000` | `19,999` | Chuyên gia học tập, điểm tích lũy lớn, streak dài và liên tục. |
| **Level 7** | **Master** | `20,000` | Không giới hạn | Bậc thầy học tập, top đầu bảng xếp hạng toàn hệ thống TMdemy. |

---

## 5. Quy Chuẩn Xử Lý Lỗi (Error Codes & Formats)

| Mã lỗi HTTP | Nguyên nhân | Cấu trúc phản hồi mẫu |
| :---: | :--- | :--- |
| `400 Bad Request` | Tham số query pagination hoặc filter không hợp lệ | `{"success": false, "error": "limit must be an integer between 1 and 100"}` hoặc `{"success": false, "error": "Invalid XP transaction type"}` |
| `401 Unauthorized` | Không có Access Token hoặc token hết hạn / không hợp lệ | `{"success": false, "error": "Access Token is missing!"}` |
| `404 Not Found` | Không tìm thấy người dùng hoặc người dùng không có trên hệ thống | `{"success": false, "message": "User not found"}` |
| `500 Server Error` | Lỗi máy chủ nội bộ hoặc gián đoạn kết nối cơ sở dữ liệu | `{"success": false, "error": "Internal Server Error"}` |

---

## 6. Ghi Chú Tích Hợp Frontend (Frontend Integration Guide)

1. **Leaderboard Tie-Breaker**:
   * Thứ hạng trên Leaderboard tuân thủ thuật toán xếp hạng thi đấu tiêu chuẩn (`RANK()` 1224). Nếu hai học viên có cùng số điểm XP, cả hai sẽ nhận cùng một thứ hạng (`rank`), và thứ hạng kế tiếp sẽ bị nhảy cách (ví dụ: hạng 1, hạng 1, hạng 3).
2. **Cập nhật Streak lạc quan (Optimistic UI)**:
   * Khi học viên hoàn thành bài học đầu tiên trong ngày, Frontend có thể hiển thị hiệu ứng chúc mừng chuỗi ngày học liên tiếp (`+20 XP Streak Bonus`) mà không cần chờ reload toàn trang.
3. **Múi giờ hoạt động**:
   * Múi giờ kinh doanh chuẩn của hệ thống là `Asia/Ho_Chi_Minh` (GMT+7). Mọi tính toán chuỗi ngày học (`daily_streak`) đều dựa trên mốc ngày tại múi giờ này.
4. **Bộ lọc lịch sử điểm (`type`)**:
   * Khi gửi request lọc lịch sử điểm XP (`GET /api/users/me/xp-history`), Client cần gửi đúng tên enum viết hoa: `LESSON_COMPLETED`, `QUIZ_COMPLETED`, hoặc `DAILY_STREAK`.
