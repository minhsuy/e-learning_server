# TMDEMY — COURSE PERFORMANCE ANALYTICS API (COURSE_PERFORMANCE_API.MD)

Tài liệu đặc tả toàn diện API Phân tích Hiệu suất Khóa học (`Course Performance Snapshot & Funnel`) dành riêng cho Giảng viên.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. GET /api/teacher/statistics/course-performance/:courseId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/teacher/statistics/course-performance/:courseId`
* **Purpose**: Cung cấp một **complete performance snapshot** chuyên sâu của một khóa học cụ thể cho Giảng viên sở hữu khóa học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`

### Headers
```http
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `courseId` | UUID | Yes | Mã khóa học cần phân tích hiệu suất |

### Validation Rules
* `courseId`: Bắt buộc, phải là UUID v4 hợp lệ (`validateCoursePerformanceParam`). Nếu không hợp lệ trả về `400 Bad Request`.

---

## 2. Authorization & Ownership Rules

```text
JWT Header
    ↓
req.user.userId (Teacher ID)
    ↓
Course.authorId
```

1. **Teacher ID không bao giờ lấy từ Client**: Luôn được giải mã an toàn từ JWT Token (`req.user.userId`).
2. **Quyền sở hữu (Ownership Check)**:
   * Nếu khóa học thuộc về một giảng viên khác:
     * **HTTP Status**: `403 Forbidden`
     * **Error Message**: `"You can only view performance of your own courses"`
3. **Trạng thái khóa học PENDING / REJECTED**:
   * Giảng viên sở hữu khóa học **VẪN CÓ QUYỀN XEM THỐNG KÊ** của các khóa học đang ở trạng thái `PENDING` hoặc `REJECTED`. Hệ thống không tự động ép các số liệu về 0 nếu trong database đã phát sinh dữ liệu thử nghiệm.
4. **Soft-Deleted Course**:
   * Nếu khóa học không tồn tại hoặc đã bị xóa mềm (`isDestroyed = true`):
     * **HTTP Status**: `404 Not Found`
     * **Error Message**: `"Course not found"`

---

## 3. Chi tiết Các Nhóm Metrics (Metrics Breakdown)

### 3.1. Course Information (`course`)
Chứa thông tin tổng quan của khóa học:
* `id`, `title`, `slug`, `image`, `price`, `oldPrice`, `status`, `level`, `type`, `view`, `sold`, `createdAt`, `updatedAt`.
* `category`: `{ id, name, slug }`.
* Giá trị Decimal được serialize thành number.

### 3.2. Revenue Metrics (`overview.revenue`)
Chỉ tính các đơn hàng có `Order.status = COMPLETED` và `Order.courseId = courseId`:
* `totalRevenue`: Tổng doanh thu thực nhận (`SUM(Order.total)`).
* `completedOrders`: Tổng số đơn hàng hoàn thành (`COUNT(Order)`).
* `totalDiscount`: Tổng số tiền giảm giá đã áp dụng (`SUM(Order.discount)`).
* `averageOrderValue`: Giá trị trung bình mỗi đơn hàng (`totalRevenue / completedOrders`). Nếu `completedOrders = 0`, giá trị là `0`.
* `currency`: `"VND"`.

### 3.3. Student Metrics (`overview.students`)
Dựa trên các bản ghi ghi danh (`Enrollment`) của khóa học:
* `totalStudents`: Tổng số học viên duy nhất (`COUNT(Enrollment)`).
* `activeStudents`: Số học viên đang học (`status = ACTIVE`).
* `completedStudents`: Số học viên đã học xong 100% (`status = COMPLETED`).
* `canceledStudents`: Số học viên bị hủy (`status = CANCELED`).
* `completionRate`: Tỷ lệ hoàn thành khóa học:
  $$\text{completionRate} = \frac{\text{completedStudents}}{\text{totalStudents}} \times 100$$
  *(Nếu `totalStudents = 0`, giá trị là `0`, làm tròn 2 chữ số).*
* `averageProgress`: Tiến độ học tập trung bình của học viên (`AVG(Enrollment.progress)`), làm tròn 2 chữ số.

### 3.4. Engagement Metrics (`overview.engagement`)
Kết hợp Đánh giá (`Rating`) và Chứng chỉ (`Certificate`):
* **Rating**: Chỉ tính các đánh giá có `Rating.status = ACTIVE`.
  * `averageRating`: Điểm đánh giá trung bình (1.0 - 5.0), làm tròn 2 chữ số.
  * `totalReviews`: Tổng số lượt đánh giá hợp lệ.
  * `ratingDistribution`: Phân bổ số lượt đánh giá theo từng mức sao, **luôn luôn đầy đủ cả 5 mức**:
    ```json
    {
      "1": 0,
      "2": 0,
      "3": 1,
      "4": 5,
      "5": 32
    }
    ```
* **Certificates**:
  * `certificatesIssued`: Số lượng chứng chỉ đã cấp cho học viên.
  * `certificateRate`: Tỷ lệ học viên được nhận chứng chỉ (`(certificatesIssued / totalStudents) * 100`).
  * `averageCertificateGrade`: Điểm tốt nghiệp trung bình ghi trên chứng chỉ (`AVG(Certificate.grade)`), làm tròn 2 chữ số.

### 3.5. Curriculum Metrics (`curriculum`)
Chỉ tính các chương học chưa bị xóa mềm (`Chapter.isDestroyed = false`):
* `totalChapters`: Tổng số chương học hợp lệ.
* `totalLessons`: Tổng số bài học thuộc các chương học hợp lệ.
* `totalDuration`: Tổng thời lượng các bài học (tính bằng giây).

### 3.6. Quiz Metrics (`quizzes`)
Tổng hợp toàn bộ các bài kiểm tra Quiz thuộc khóa học:
* **`summary`**:
  * `totalQuizzes`: Tổng số Quiz trong khóa học.
  * `totalSubmissions`: Tổng số lượt nộp bài từ học viên.
  * `averageScore`: Điểm phần trăm trung bình (`AVG(percentage)`).
  * `passRate`: Tỷ lệ đậu Quiz dựa trên điều kiện `QuizSubmission.percentage >= Quiz.passingGrade`.
* **`items`**: Danh sách chi tiết từng Quiz:
  * `quizId`, `title`, `lessonId`, `lessonTitle`, `passingGrade`, `totalQuestions`, `submissionsCount`, `averageScore`, `passCount`, `passRate`.

### 3.7. Lesson Funnel (`lessonsFunnel`)
**Đây là metric quan trọng nhất của API**. Danh sách toàn bộ bài học theo thứ tự học tập:
$$\text{Chapter.order ASC} \longrightarrow \text{Lesson.order ASC}$$

Mỗi bài học cung cấp:
* `lessonId`: ID bài học.
* `lessonTitle`: Tiêu đề bài học.
* `order`: Thứ tự bài học trong chương.
* `duration`: Thời lượng bài học (giây).
* `type`: `video` hoặc `text`.
* `isDemo`: Bài học thử miễn phí.
* `chapter`: `{ id, title, order }`.
* `hasQuiz`: Bài học có Quiz đính kèm hay không.
* `completedStudents`: Số lượng học viên đã hoàn thành bài học này (`Progress.completed = true`).
* `completionRate`: Tỷ lệ hoàn thành so với tổng số học viên (`(completedStudents / totalStudents) * 100`).
* `dropOffFromPrevious`: **Tỷ lệ sụt giảm học viên so với bài học liền trước**:
  * Đối với bài học đầu tiên của khóa học: `dropOffFromPrevious = 0`.
  * Từ bài thứ 2 trở đi:
    $$\text{dropOffFromPrevious} = \frac{\text{previousCompleted} - \text{currentCompleted}}{\text{previousCompleted}} \times 100$$
  * Nếu `previousCompleted = 0`, giá trị là `0` (không có lỗi chia cho 0).

> [!NOTE]
> **Lưu ý về bản chất Drop-off**: Đây là Funnel tỷ lệ hoàn thành bài học dựa trên sự kiện học viên click/đạt mốc hoàn thành bài học (`Progress.completed = true`). Đây KHÔNG PHẢI là video watch telemetry (thời gian xem video từng giây) vì cơ sở dữ liệu hiện tại không lưu log telemetry của video player.

---

## 4. Success Response Example (200 OK)

```json
{
  "success": true,
  "message": "Fetched course performance statistics successfully",
  "data": {
    "course": {
      "id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
      "title": "Fullstack Next.js 15 & Node.js Architecture",
      "slug": "fullstack-nextjs-15-nodejs-architecture",
      "image": "https://res.cloudinary.com/tmdemy/course.png",
      "price": 699000,
      "oldPrice": 1200000,
      "status": "approved",
      "level": "intermediate",
      "type": "paid",
      "view": 1250,
      "sold": 42,
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-15T10:00:00.000Z",
      "category": {
        "id": "cat-uuid",
        "name": "Lập trình Web",
        "slug": "lap-trinh-web"
      }
    },
    "overview": {
      "revenue": {
        "totalRevenue": 24500000,
        "completedOrders": 42,
        "totalDiscount": 4858000,
        "averageOrderValue": 583333.33,
        "currency": "VND"
      },
      "students": {
        "totalStudents": 42,
        "activeStudents": 35,
        "completedStudents": 7,
        "canceledStudents": 0,
        "completionRate": 16.67,
        "averageProgress": 65.4
      },
      "engagement": {
        "averageRating": 4.85,
        "totalReviews": 38,
        "ratingDistribution": {
          "1": 0,
          "2": 0,
          "3": 1,
          "4": 5,
          "5": 32
        },
        "certificatesIssued": 6,
        "certificateRate": 14.29,
        "averageCertificateGrade": 88.5
      }
    },
    "curriculum": {
      "totalChapters": 4,
      "totalLessons": 20,
      "totalDuration": 18450
    },
    "quizzes": {
      "summary": {
        "totalQuizzes": 4,
        "totalSubmissions": 68,
        "averageScore": 82.5,
        "passRate": 85.29
      },
      "items": [
        {
          "quizId": "quiz-uuid-1",
          "title": "Kiểm tra Chương 1: Kiến trúc tổng quan",
          "lessonId": "lesson-uuid-1",
          "lessonTitle": "Bài 1.3: Cấu trúc thư mục chuẩn",
          "passingGrade": 80,
          "totalQuestions": 5,
          "submissionsCount": 35,
          "averageScore": 86.4,
          "passCount": 31,
          "passRate": 88.57
        }
      ]
    },
    "lessonsFunnel": [
      {
        "lessonId": "lesson-uuid-1",
        "lessonTitle": "Bài 1.1: Giới thiệu hệ thống",
        "order": 1,
        "duration": 600,
        "type": "video",
        "isDemo": true,
        "chapter": {
          "id": "chap-uuid-1",
          "title": "Chương 1: Bắt đầu",
          "order": 1
        },
        "hasQuiz": false,
        "completedStudents": 42,
        "completionRate": 100,
        "dropOffFromPrevious": 0
      },
      {
        "lessonId": "lesson-uuid-2",
        "lessonTitle": "Bài 1.2: Cài đặt công cụ và Docker",
        "order": 2,
        "duration": 900,
        "type": "video",
        "isDemo": false,
        "chapter": {
          "id": "chap-uuid-1",
          "title": "Chương 1: Bắt đầu",
          "order": 1
        },
        "hasQuiz": false,
        "completedStudents": 38,
        "completionRate": 90.48,
        "dropOffFromPrevious": 9.52
      },
      {
        "lessonId": "lesson-uuid-3",
        "lessonTitle": "Bài 1.3: Cấu trúc thư mục chuẩn",
        "order": 3,
        "duration": 1200,
        "type": "video",
        "isDemo": false,
        "chapter": {
          "id": "chap-uuid-1",
          "title": "Chương 1: Bắt đầu",
          "order": 1
        },
        "hasQuiz": true,
        "completedStudents": 35,
        "completionRate": 83.33,
        "dropOffFromPrevious": 7.89
      }
    ]
  }
}
```

---

## 5. Error Responses

* **400 Bad Request**:
  * UUID khóa học sai định dạng:
    ```json
    {
      "errors": {
        "courseId": "Invalid Course ID"
      }
    }
    ```
* **401 Unauthorized**:
  * Không gửi Bearer Token hoặc Token hết hạn.
* **403 Forbidden**:
  * Người gọi không có role `teacher`.
  * Giảng viên truy cập khóa học của giảng viên khác:
    ```json
    {
      "success": false,
      "message": "You can only view performance of your own courses"
    }
    ```
* **404 Not Found**:
  * Khóa học không tồn tại trong hệ thống.
  * Khóa học đã bị xóa mềm (`isDestroyed = true`):
    ```json
    {
      "success": false,
      "message": "Course not found"
    }
    ```

---

## 6. Raw HTTP Request

```http
GET {{BASE_URL}}/api/teacher/statistics/course-performance/3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 7. Zero-Data Safe Guarantees
Khi khóa học mới tạo và chưa có bất kỳ dữ liệu đơn hàng hay học viên nào:
* `totalStudents = 0`, `completionRate = 0`, `averageProgress = 0`, `certificateRate = 0`.
* `totalRevenue = 0`, `completedOrders = 0`, `totalDiscount = 0`, `averageOrderValue = 0`.
* `averageRating = 0`, `totalReviews = 0`, `ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }`.
* `totalQuizzes = 0`, `totalSubmissions = 0`, `averageScore = 0`, `passRate = 0`, `items = []`.
* `lessonsFunnel = []` nếu chưa tạo bài học nào.
* Tuyệt đối không xảy ra các giá trị `NaN`, `null` hay `Infinity` gây crash giao diện Frontend.
