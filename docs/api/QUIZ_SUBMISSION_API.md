# TMDEMY — QUIZ SUBMISSION & EVALUATION API (QUIZ_SUBMISSION_API.MD)

Tài liệu đặc tả các API nộp bài kiểm tra Quiz, chấm điểm tự động, xem lại kết quả bài nộp của học viên và báo cáo phân tích hiệu suất Quiz cho Giảng viên.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

> [!NOTE]
> Router nộp bài được mount ở dạng **số nhiều**: `/api/submissions`.

---

## 1. POST /api/submissions/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/submissions/`
* **Purpose**: Học viên nộp bài làm Quiz. Backend thực hiện chấm điểm tự động, lưu bài làm và trả về kết quả chi tiết.
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Học viên đã ghi danh vào khóa học)

### Headers
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "quizId": "quiz-uuid-v4",
  "answers": [
    {
      "question": "question-uuid-1",
      "selectedAnswer": "PostgreSQL 16"
    },
    {
      "question": "question-uuid-2",
      "selectedAnswer": "Sử dụng Pure Async Functions không có class hay this"
    }
  ]
}
```

### Validation Rules
* `quizId`: Bắt buộc, UUID hợp lệ.
* `answers`: Bắt buộc, mảng tối thiểu 1 phần tử.
* `answers.*.question`: Bắt buộc, UUID hợp lệ của câu hỏi.
* `answers.*.selectedAnswer`: Bắt buộc, chuỗi đáp án học viên chọn.

### Business & Evaluation Rules
1. **Kiểm tra Ghi danh (Enrollment Check)**: Học viên bắt buộc phải có bản ghi `Enrollment` hợp lệ trong khóa học chứa Quiz này (`findEnrollmentByUserAndCourse`). Nếu chưa ghi danh -> trả về `403 Forbidden` (`You are not enrolled in this course`).
2. **Chính sách 1 lần nộp (Single Submission Policy)**: Mỗi học viên chỉ được nộp bài Quiz 1 lần duy nhất (ràng buộc `@@unique([quizId, userId])`). Nếu đã nộp trước đó -> trả về `400 Bad Request` (`You have already submitted this quiz`).
3. **Chấm điểm tự động**:
   * So sánh chính xác `selectedAnswer === question.answer`.
   * Điểm từng câu = `question.points` (nếu đúng) hoặc `0` (nếu sai).
   * Tổng điểm đạt được = tổng điểm các câu trả lời đúng.
   * Phần trăm điểm = `(score / totalMaxScore) * 100`.
   * Trạng thái Đạt (`passed`) = `percentage >= quiz.passingGrade`.
4. **Lưu trữ nguyên tử (Transaction)**: Lưu `QuizSubmission` và toàn bộ câu trả lời `QuizSubmissionAnswer[]` trong một Prisma transaction.
5. **Thông báo**: Tự động gửi Notification đến Giảng viên của khóa học thông báo có học viên nộp bài.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Quiz submitted successfully",
    "data": {
      "submissionId": "sub-uuid-1",
      "quizId": "quiz-uuid-v4",
      "userId": "user-uuid-v4",
      "score": 5,
      "percentage": 100,
      "passed": true,
      "passingGrade": 80,
      "createdAt": "2026-03-01T10:30:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/submissions/
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "quizId": "quiz-uuid-v4",
  "answers": [
    {
      "question": "question-uuid-1",
      "selectedAnswer": "PostgreSQL 16"
    }
  ]
}
```

---

## 2. GET /api/submissions/:quizId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/submissions/:quizId`
* **Purpose**: Học viên xem lại kết quả bài nộp của chính mình cho một bài Quiz (kèm danh sách câu trả lời đúng/sai).
* **Authentication**: `Bearer JWT required`
* **Roles**: All (Học viên sở hữu bài nộp)

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `quizId` | UUID | Yes | Mã bài kiểm tra cần xem kết quả |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Submission fetched successfully",
    "data": {
      "id": "sub-uuid-1",
      "_id": "sub-uuid-1",
      "quiz": "quiz-uuid-v4",
      "user": "user-uuid-v4",
      "score": 5,
      "percentage": 100,
      "passed": true,
      "answers": [
        {
          "id": "ans-uuid-1",
          "_id": "ans-uuid-1",
          "questionId": "question-uuid-1",
          "selectedAnswer": "PostgreSQL 16",
          "isCorrect": true
        }
      ],
      "createdAt": "2026-03-01T10:30:00.000Z"
    }
  }
  ```

### Error Responses
* **404 Not Found**: Học viên chưa nộp bài Quiz này:
  ```json
  {
    "success": false,
    "message": "Submission not found for this quiz and user"
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/submissions/quiz-uuid-v4
Authorization: Bearer <ACCESS_TOKEN>
```

---

## 3. GET /api/submissions/teacher/:quizId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/submissions/teacher/:quizId`
* **Purpose**: Giảng viên xem toàn bộ danh sách bài nộp của tất cả học viên trong một Quiz.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `quizId` | UUID | Yes | Mã bài kiểm tra |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Submissions fetched successfully",
    "data": [
      {
        "id": "sub-uuid-1",
        "_id": "sub-uuid-1",
        "quizId": "quiz-uuid-v4",
        "userId": "student-uuid-1",
        "user": {
          "id": "student-uuid-1",
          "_id": "student-uuid-1",
          "username": "minh_student",
          "email": "student@example.com",
          "avatar": ""
        },
        "score": 5,
        "percentage": 100,
        "passed": true,
        "createdAt": "2026-03-01T10:30:00.000Z"
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/submissions/teacher/quiz-uuid-v4
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/submissions/teacher/analytics/:quizId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/submissions/teacher/analytics/:quizId`
* **Purpose**: Giảng viên xem báo cáo thống kê phân tích hiệu suất của Quiz (tổng số lượt nộp, điểm trung bình, tỷ lệ đạt).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `quizId` | UUID | Yes | Mã bài kiểm tra |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Quiz analytics fetched successfully",
    "data": {
      "quizId": "quiz-uuid-v4",
      "totalSubmissions": 25,
      "passedCount": 22,
      "failedCount": 3,
      "passRate": 88,
      "averageScore": 4.2,
      "averagePercentage": 84,
      "passingGrade": 80
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/submissions/teacher/analytics/quiz-uuid-v4
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```
