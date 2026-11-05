# TMDEMY — CODING EXERCISE & AUTO-GRADING API SPECIFICATION (CODING_EXERCISE_API.MD)

Tài liệu đặc tả toàn diện và chuẩn xác 100% toàn bộ **15 REST API Endpoints** thuộc phân hệ **Coding Exercise & Sandbox Auto-Grading Engine** trong hệ thống TMdemy.

* **Base URL**: `http://localhost:3002` (môi trường Development) hoặc `{{BASE_URL}}`
* **Kiến trúc**: Express.js + PostgreSQL 16 (Prisma ORM Singleton) + E2B Cloud MicroVM Sandbox
* **Authentication**: Gắn Header `Authorization: Bearer <JWT_ACCESS_TOKEN>` trên tất cả các request
* **Content-Type**: `application/json`

---

## BẢNG TỔNG HỢP ROUTE CATALOG (15 ENDPOINTS)

| STT | Method | Endpoint | Quyền (Role) | Rate Limit | Mục Đích Nghiệp Vụ |
| :---: | :---: | :--- | :---: | :---: | :--- |
| **1** | `POST` | `/api/coding-exercises` | `TEACHER`, `ADMIN` | Standard | Giảng viên tạo bài tập lập trình mới (mặc định `DRAFT`, Revision v1) |
| **2** | `GET` | `/api/coding-exercises/lesson/:lessonId/public` | `USER`, `TEACHER`, `ADMIN` | Standard | Học viên lấy danh sách bài tập đã xuất bản (`PUBLISHED`) của bài học |
| **3** | `GET` | `/api/coding-exercises/lesson/:lessonId` | `TEACHER`, `ADMIN` | Standard | Giảng viên lấy toàn bộ bài tập của bài học (gồm cả Draft và Archived) |
| **4** | `GET` | `/api/coding-exercises/:id/manage` | `TEACHER`, `ADMIN` | Standard | Giảng viên xem chi tiết quản lý (gồm mã giải mẫu và test cases ẩn) |
| **5** | `POST` | `/api/coding-exercises/:id/publish` | `TEACHER`, `ADMIN` | Standard | Chạy nghiệm thu sandbox 100% lời giải mẫu và xuất bản bài tập |
| **6** | `POST` | `/api/coding-exercises/:id/unpublish` | `TEACHER`, `ADMIN` | Standard | Gỡ bài tập khỏi trạng thái xuất bản, đưa về lại `DRAFT` |
| **7** | `GET` | `/api/coding-exercises/:id` | `USER`, `TEACHER`, `ADMIN` | Standard | Học viên xem chi tiết đề bài để làm bài (Anti-cheat: ẩn giải mẫu & test ẩn) |
| **8** | `PUT` | `/api/coding-exercises/:id` | `TEACHER`, `ADMIN` | Standard | Giảng viên cập nhật bài tập (tự động tạo Revision v2 nếu đã xuất bản) |
| **9** | `DELETE`| `/api/coding-exercises/:id` | `TEACHER`, `ADMIN` | Standard | Giảng viên lưu trữ mềm (Soft Archive) bài tập lập trình |
| **10**| `POST` | `/api/coding-exercises/:id/run` | `USER`, `TEACHER`, `ADMIN` | 10 req/phút | Học viên chạy thử code với Public Test Cases (Ephemeral, KHÔNG lưu DB) |
| **11**| `POST` | `/api/coding-exercises/:id/submit` | `USER`, `TEACHER`, `ADMIN` | 5 req/phút | Nộp bài chính thức, chấm điểm Sandbox, trao Dedicated XP & Streak |
| **12**| `GET` | `/api/coding-exercises/:id/submissions` | `USER`, `TEACHER`, `ADMIN` | Standard | Lấy danh sách lịch sử nộp bài của học viên (phân trang, mới nhất trước) |
| **13**| `GET` | `/api/coding-exercises/:id/submissions/:submissionId` | `USER`, `TEACHER`, `ADMIN` | Standard | Xem chi tiết kết quả bài nộp (Anti-cheat: che giấu input/output test ẩn) |
| **14**| `GET` | `/api/coding-exercises/:id/completion` | `USER`, `TEACHER`, `ADMIN` | Standard | **Step 6**: Xem trạng thái hoàn thành bài tập, điểm cao nhất, số lần nộp và XP nhận |
| **15**| `GET` | `/api/coding-exercises/lesson/:lessonId/progress` | `USER`, `TEACHER`, `ADMIN` | Standard | **Step 6**: Xem tiến độ làm bài tập lập trình của toàn bộ bài học (số bài, %) |

---

# PHẦN 1: DÀNH CHO GIẢNG VIÊN & QUẢN TRỊ VIÊN (TEACHER / ADMIN)

## 1. POST /api/coding-exercises
Tạo bài tập lập trình mới cho một bài học. Mặc định tạo bài tập ở trạng thái `DRAFT` và tự động sinh bản sửa đổi đầu tiên (`Revision v1`) với `isPublished = false`.

* **Method**: `POST`
* **URL**: `/api/coding-exercises`
* **Headers**: `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
* **Quyền truy cập**: `TEACHER` (phải là tác giả của khóa học chứa bài học) hoặc `ADMIN`.

### Request Payload
```json
{
  "lessonId": "832a4406-9f45-5e54-9dc4-dc5b05bd10fa",
  "title": "Tính Tổng Từ 1 Đến N",
  "slug": "tinh-tong-tu-1-den-n",
  "description": "Viết hàm `sumToN(n)` nhận vào số nguyên dương $n$ và trả về tổng $1 + 2 + \\dots + n$.",
  "programmingLanguage": "javascript",
  "difficulty": "EASY",
  "starterCode": "function sumToN(n) {\n  // Viết code của bạn tại đây\n}",
  "referenceSolution": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
  "executionContract": {
    "type": "function_call",
    "functionName": "sumToN",
    "parameters": [
      { "name": "n", "type": "number" }
    ],
    "returnType": "number"
  },
  "timeLimit": 2000,
  "memoryLimit": 128000,
  "order": 1,
  "testCases": [
    {
      "input": [5],
      "expectedOutput": 15,
      "isHidden": false,
      "order": 1,
      "weight": 30,
      "explanation": "1 + 2 + 3 + 4 + 5 = 15"
    },
    {
      "input": [10],
      "expectedOutput": 55,
      "isHidden": true,
      "order": 2,
      "weight": 70,
      "explanation": "Test case ẩn kiểm tra n=10"
    }
  ]
}
```

### Response Thành Công (201 Created)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Coding exercise created successfully as DRAFT",
  "data": {
    "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "_id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "lessonId": "832a4406-9f45-5e54-9dc4-dc5b05bd10fa",
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "title": "Tính Tổng Từ 1 Đến N",
    "slug": "tinh-tong-tu-1-den-n",
    "description": "Viết hàm `sumToN(n)` nhận vào số nguyên dương $n$ và trả về tổng $1 + 2 + \\dots + n$.",
    "difficulty": "EASY",
    "programmingLanguage": "javascript",
    "status": "DRAFT",
    "order": 1,
    "currentRevision": {
      "id": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
      "version": 1,
      "isPublished": false,
      "testCasesCount": 2
    }
  }
}
```

---

## 2. GET /api/coding-exercises/lesson/:lessonId
Lấy danh sách tất cả các bài tập lập trình thuộc về một bài học dành cho Giảng viên quản lý (bao gồm các bài `DRAFT`, `PUBLISHED`, và `ARCHIVED`).

* **Method**: `GET`
* **URL**: `/api/coding-exercises/lesson/:lessonId`
* **Quyền truy cập**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched exercises for lesson successfully",
  "data": [
    {
      "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
      "_id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
      "lessonId": "832a4406-9f45-5e54-9dc4-dc5b05bd10fa",
      "title": "Tính Tổng Từ 1 Đến N",
      "slug": "tinh-tong-tu-1-den-n",
      "difficulty": "EASY",
      "programmingLanguage": "javascript",
      "status": "DRAFT",
      "order": 1,
      "revisions": [
        {
          "id": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
          "version": 1,
          "title": "Tính Tổng Từ 1 Đến N",
          "isPublished": false,
          "createdAt": "2026-10-24T12:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

## 3. GET /api/coding-exercises/:id/manage
Lấy thông tin quản lý chi tiết bài tập lập trình, bao gồm toàn bộ danh sách test cases (cả công khai và ẩn), lời giải mẫu (`referenceSolution`), và hợp đồng thực thi.

* **Method**: `GET`
* **URL**: `/api/coding-exercises/:id/manage`
* **Quyền truy cập**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched exercise manage detail successfully",
  "data": {
    "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "lessonId": "832a4406-9f45-5e54-9dc4-dc5b05bd10fa",
    "title": "Tính Tổng Từ 1 Đến N",
    "slug": "tinh-tong-tu-1-den-n",
    "status": "DRAFT",
    "difficulty": "EASY",
    "programmingLanguage": "javascript",
    "activeRevision": {
      "id": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
      "version": 1,
      "starterCode": "function sumToN(n) {\n  // Viết code của bạn tại đây\n}",
      "referenceSolution": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
      "executionContract": {
        "functionName": "sumToN",
        "parameters": [{ "name": "n", "type": "number" }],
        "returnType": "number"
      },
      "timeLimit": 2000,
      "memoryLimit": 128000,
      "testCases": [
        {
          "id": "b1111111-2222-4333-8444-555555555555",
          "input": [5],
          "expectedOutput": 15,
          "isHidden": false,
          "order": 1,
          "weight": 30,
          "explanation": "1 + 2 + 3 + 4 + 5 = 15"
        },
        {
          "id": "b2222222-2222-4333-8444-555555555555",
          "input": [10],
          "expectedOutput": 55,
          "isHidden": true,
          "order": 2,
          "weight": 70,
          "explanation": "Test case ẩn kiểm tra n=10"
        }
      ]
    }
  }
}
```

---

## 3.1 POST /api/coding-exercises/:id/reverify (Kiểm Thử Nghiệm Thu Lời Giải Mẫu - Step 7G)
Cho phép giảng viên chạy thử nghiệm thu `referenceSolution` chống lại toàn bộ test cases trong Sandbox E2B **mà KHÔNG xuất bản** bài tập (bài tập vẫn ở trạng thái `DRAFT`).
* **Mục đích**: Chẩn đoán chi tiết khi lời giải mẫu hoặc test cases bị lỗi, giúp giảng viên khắc phục trước khi kích hoạt xuất bản.
* **Quyền truy cập**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.
* **Method**: `POST`
* **URL**: `/api/coding-exercises/:id/reverify`

### Response Khi Nghiệm Thu Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lời giải mẫu đã vượt qua 100% (2/2) bài test trong Sandbox E2B.",
  "data": {
    "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "revisionId": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
    "version": 1,
    "verificationStatus": "VERIFIED",
    "status": "VERIFIED",
    "isVerified": true,
    "score": 100,
    "passRate": 100,
    "passedTests": 2,
    "totalTests": 2,
    "details": [
      {
        "testCaseIndex": 1,
        "testCaseId": "b1111111-2222-4333-8444-555555555555",
        "passed": true,
        "status": "PASSED",
        "errorMessage": null,
        "actualOutput": 15,
        "comparisonReason": "Output matches expected value exactly",
        "executionTimeMs": 35
      }
    ]
  }
}
```

### Response Khi Nghiệm Thu Thất Bại (200 OK — Trạng thái FAILED)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lời giải mẫu không đạt: Trượt 1/2 test cases. Lỗi: Expected 55 but received 0.",
  "data": {
    "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "revisionId": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
    "version": 1,
    "verificationStatus": "FAILED",
    "status": "FAILED",
    "isVerified": false,
    "score": 50,
    "passRate": 50,
    "passedTests": 1,
    "totalTests": 2,
    "details": [
      {
        "testCaseIndex": 2,
        "testCaseId": "b2222222-2222-4333-8444-555555555555",
        "passed": false,
        "status": "WRONG_ANSWER",
        "errorMessage": "Expected 55 but received 0",
        "actualOutput": 0,
        "comparisonReason": "Mismatch",
        "executionTimeMs": 28
      }
    ]
  }
}
```

---

## 4. POST /api/coding-exercises/:id/publish (Cổng Nghiệm Thu Tự Động)
Thực thi quy trình nghiệm thu tự động bài tập lập trình trước khi cho phép học viên tiếp cận.
* **Quy tắc an toàn bất khả xâm phạm**: Hệ thống sẽ tự động chạy `referenceSolution` chống lại **100% test cases** (cả công khai và ẩn) trong E2B Cloud Sandbox.
* Nếu điểm số $< 100\%$ hoặc xảy ra lỗi biên dịch/runtime, việc xuất bản **bị từ chối ngay lập tức** với mã `400 Bad Request`.
* Nếu đạt $100\%$, hệ thống kích hoạt giao dịch nguyên tử (Atomic Transaction):
  1. Đưa các revision cũ về `isPublished = false`.
  2. Nâng revision mới nhất lên `isPublished = true`.
  3. Cập nhật trạng thái bài tập thành `PUBLISHED`.

* **Method**: `POST`
* **URL**: `/api/coding-exercises/:id/publish`
* **Quyền truy cập**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.

### Response Thành Công (200 OK — Nghiệm Thu 100%)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Exercise verified against reference solution and published successfully",
  "data": {
    "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "_id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "status": "PUBLISHED",
    "publishedRevisionId": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
    "version": 1,
    "verification": {
      "score": 100,
      "passRate": 1,
      "passedTests": 2,
      "totalTests": 2
    }
  }
}
```

### Response Thất Bại (400 Bad Request — Lời Giải Mẫu Không Đạt Chuẩn)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Reference solution failed automated verification. Cannot publish exercise.",
  "data": {
    "score": 30,
    "passRate": 0.5,
    "passedTests": 1,
    "totalTests": 2,
    "failures": [
      {
        "testCaseId": "b2222222-2222-4333-8444-555555555555",
        "order": 2,
        "weight": 70,
        "status": "FAILED",
        "actualOutput": 0,
        "expectedOutput": 55,
        "errorMessage": "Expected 55 but received 0"
      }
    ]
  }
}
```

---

## 5. POST /api/coding-exercises/:id/unpublish
Gỡ bài tập lập trình khỏi danh sách công khai của học viên, đưa trạng thái từ `PUBLISHED` về lại `DRAFT`.
* Học viên sẽ không còn nhìn thấy hoặc nộp bài được cho bài tập này.
* Toàn bộ lịch sử các bài nộp cũ của học viên được bảo toàn nguyên vẹn.
* Lời gọi API có tính lũy kế (idempotent): Nếu bài tập đã là `DRAFT`, hệ thống trả về `200 OK` ngay lập tức.

* **Method**: `POST`
* **URL**: `/api/coding-exercises/:id/unpublish`
* **Quyền truy cập**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Exercise unpublished successfully and reverted to DRAFT",
  "data": {
    "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "_id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "status": "DRAFT"
  }
}
```

---

## 6. PUT /api/coding-exercises/:id
Chỉnh sửa thông tin bài tập lập trình, nội dung đề bài, starter code, hoặc danh sách test cases.
* **Cơ chế đóng băng phiên bản (Revision Freezing)**:
  * Nếu bài tập đang là `DRAFT` và chưa có bài nộp: Cập nhật trực tiếp trên revision hiện tại.
  * Nếu bài tập đã `PUBLISHED`: Hệ thống **không ghi đè revision cũ** để bảo vệ tính toàn vẹn của các bài nộp lịch sử, mà tự động sinh một revision mới dạng nháp (`Draft Revision v{N+1}`).

* **Method**: `PUT`
* **URL**: `/api/coding-exercises/:id`
* **Quyền truy cập**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Published revision preserved. Created new draft revision v2.",
  "data": {
    "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "_id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "activeRevisionId": "8f46dc0a-f71e-55bb-0d21-10b5e9e2ff09",
    "activeVersion": 2
  }
}
```

---

## 7. DELETE /api/coding-exercises/:id
Lưu trữ mềm (Soft Archive) bài tập lập trình. Trạng thái chuyển thành `ARCHIVED`.
* Loại bỏ bài tập khỏi danh sách bài học của học viên.
* Toàn bộ dữ liệu điểm số và bài nộp cũ của học viên được lưu trữ vĩnh viễn phục vụ thống kê và chứng chỉ.

* **Method**: `DELETE`
* **URL**: `/api/coding-exercises/:id`
* **Quyền truy cập**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Coding exercise archived successfully"
}
```

---

# PHẦN 2: DÀNH CHO HỌC VIÊN (STUDENT WORKFLOWS)

## 8. GET /api/coding-exercises/lesson/:lessonId/public
Lấy danh sách các bài tập lập trình đã xuất bản (`PUBLISHED`) trong một bài học.

* **Method**: `GET`
* **URL**: `/api/coding-exercises/lesson/:lessonId/public`
* **Điều kiện**: Học viên đã ghi danh vào khóa học (`Enrollment.status = ACTIVE`) hoặc bài học là Demo (`lesson.isDemo = true`).

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched published coding exercises successfully",
  "data": [
    {
      "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
      "_id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
      "lessonId": "832a4406-9f45-5e54-9dc4-dc5b05bd10fa",
      "title": "Tính Tổng Từ 1 Đến N",
      "slug": "tinh-tong-tu-1-den-n",
      "difficulty": "EASY",
      "programmingLanguage": "javascript",
      "order": 1,
      "status": "PUBLISHED"
    }
  ]
}
```

---

## 9. GET /api/coding-exercises/:id
Lấy thông tin chi tiết bài tập để render giao diện Code Editor cho học viên.
* **Bảo vệ gian lận cấp độ máy chủ (Anti-Cheat Server-Side Filtering)**:
  * **Tuyệt đối ẩn `referenceSolution`**: Không bao giờ lộ lời giải chuẩn cho học viên.
  * **Lọc bỏ toàn bộ test cases ẩn (`isHidden = true`)**: Học viên chỉ nhận được các test cases mẫu (`isHidden = false`) để đọc hiểu đề bài.

* **Method**: `GET`
* **URL**: `/api/coding-exercises/:id`
* **Quyền truy cập**: Học viên đã ghi danh khóa học hoặc bài học Demo.

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched exercise details successfully",
  "data": {
    "id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "_id": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "lessonId": "832a4406-9f45-5e54-9dc4-dc5b05bd10fa",
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "title": "Tính Tổng Từ 1 Đến N",
    "slug": "tinh-tong-tu-1-den-n",
    "description": "Viết hàm `sumToN(n)` nhận vào số nguyên dương $n$ và trả về tổng $1 + 2 + \\dots + n$.",
    "difficulty": "EASY",
    "programmingLanguage": "javascript",
    "starterCode": "function sumToN(n) {\n  // Viết code của bạn tại đây\n}",
    "executionContract": {
      "functionName": "sumToN",
      "parameters": [{ "name": "n", "type": "number" }],
      "returnType": "number"
    },
    "timeLimit": 2000,
    "memoryLimit": 128000,
    "version": 1,
    "testCases": [
      {
        "id": "b1111111-2222-4333-8444-555555555555",
        "input": [5],
        "expectedOutput": 15,
        "order": 1,
        "explanation": "1 + 2 + 3 + 4 + 5 = 15"
      }
    ]
  }
}
```

---

## 10. POST /api/coding-exercises/:id/run (Chạy Thử Không Lưu DB)
Cho phép học viên chạy thử mã nguồn của mình trong Sandbox cô lập với **chỉ các Public Test Cases**.
* **Đặc tính Ephemeral**: **KHÔNG GHI DATABASE** (không tạo bản ghi `CodingSubmission` hay `CodingTestResult`).
* **Rate Limit**: Giới hạn tối đa **10 lần chạy / phút / tài khoản** (trả về `429 Too Many Requests` nếu vượt quá).

* **Method**: `POST`
* **URL**: `/api/coding-exercises/:id/run`
* **Rate Limit**: 10 req/min

### Request Body
```json
{
  "sourceCode": "function sumToN(n) {\n  console.log('Input value:', n);\n  return (n * (n + 1)) / 2;\n}"
}
```

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Code executed successfully",
  "data": {
    "status": "ACCEPTED",
    "passedTests": 1,
    "totalTests": 1,
    "score": 100,
    "maxScore": 100,
    "totalExecutionTimeMs": 42,
    "results": [
      {
        "testCaseId": "b1111111-2222-4333-8444-555555555555",
        "order": 1,
        "weight": 1,
        "isHidden": false,
        "status": "PASSED",
        "executionTimeMs": 42,
        "actualOutput": 15,
        "expectedOutput": 15,
        "stdout": "Input value: 5\n",
        "errorMessage": null,
        "comparisonReason": "Output matches expected value exactly"
      }
    ],
    "compilationError": null,
    "infrastructureError": null
  }
}
```

---

## 11. POST /api/coding-exercises/:id/submit (Nộp Bài Chính Thức & Gamification)
Học viên nộp bài làm chính thức để hệ thống chấm điểm toàn diện.
* **Quy trình Chấm điểm & Bảo vệ Cơ sở dữ liệu**:
  1. Kiểm tra quyền ghi danh khóa học.
  2. Tạo bản ghi `CodingSubmission` với trạng thái `PENDING`.
  3. Gửi mã nguồn sang E2B Cloud Sandbox để chấm **toàn bộ test cases (Public + Hidden)** thông qua `ConcurrencySemaphore` (tối đa 5 microVM song song). Quá trình này diễn ra **ngoài transaction database** để tránh tắc nghẽn connection pool.
  4. Mở transaction Prisma ngắn hạn: Cập nhật điểm số, trạng thái (`ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`,...), và lưu `CodingTestResult`.
* **Tích Hợp Gamification & Chuỗi Ngày Học (Streak)**:
  * Nếu bài nộp đạt `ACCEPTED`:
    * Tự động gọi `recordLearningActivityStreak`: Cập nhật chuỗi ngày học (`currentStreak`, `longestStreak`) theo múi giờ `Asia/Ho_Chi_Minh`. Nếu là hoạt động đầu tiên trong ngày, tự động cộng **+20 XP** (`DAILY_STREAK`).
    * Tự động gọi `markLessonCompleteService`: Đánh dấu bài học hoàn thành, tính lại tỷ lệ hoàn thành khóa học (`Enrollment.progress`), cập nhật trạng thái `COMPLETED` nếu đạt 100%, và cộng **+70 XP** (`LESSON_COMPLETED`).
  * **Chống Cộng Thưởng Trùng Lặp (Strict Idempotency)**:
    * Nộp lại lần thứ 2 trong cùng ngày: Trả về `dailyXpAwarded: 0`, giữ nguyên streak, không tạo thêm dòng giao dịch XP nào.
    * Nộp bài sai (`WRONG_ANSWER`): Không cộng XP, không cập nhật tiến độ bài học.
* **Rate Limit**: Giới hạn tối đa **5 lần nộp / phút / tài khoản**.

* **Method**: `POST`
* **URL**: `/api/coding-exercises/:id/submit`
* **Rate Limit**: 5 req/min

### Request Body
```json
{
  "sourceCode": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}"
}
```

### Response Thành Công (200 OK — Lần Đầu Hoàn Thành Trong Ngày)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Submission graded successfully",
  "data": {
    "id": "c1111111-2222-4333-8444-555555555555",
    "_id": "c1111111-2222-4333-8444-555555555555",
    "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "revisionId": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
    "revisionVersion": 1,
    "status": "ACCEPTED",
    "score": 100,
    "maxScore": 100,
    "passedTests": 2,
    "totalTests": 2,
    "totalExecutionTimeMs": 35,
    "completedAt": "2026-10-25T09:00:00.000Z",
    "results": [
      {
        "testCaseId": "b1111111-2222-4333-8444-555555555555",
        "order": 1,
        "weight": 1,
        "isHidden": false,
        "status": "PASSED",
        "executionTimeMs": 35,
        "actualOutput": 15,
        "expectedOutput": 15,
        "stdout": "Calculated sum for n=5\n",
        "errorMessage": null
      },
      {
        "testCaseId": "b2222222-2222-4333-8444-555555555555",
        "order": 2,
        "weight": 1,
        "isHidden": true,
        "status": "PASSED",
        "executionTimeMs": 35
      }
    ],
    "completion": {
      "exerciseCompleted": true,
      "firstCompletion": true,
      "completedAt": "2026-10-25T09:00:00.000Z"
    },
    "rewards": {
      "codingXpAwarded": 30,
      "dailyStreakXpAwarded": 20,
      "totalXpAwarded": 50
    },
    "streak": {
      "currentStreak": 1,
      "longestStreak": 1,
      "dailyXpAwarded": 20,
      "isFirstActivityToday": true
    },
    "progress": {
      "courseProgress": 0,
      "lessonCompleted": false
    }
  }
}
```

> **Quy Tắc Tách Rời Tiến Độ (Step 6 Progress Decoupling)**:
> 1. Hoàn thành bài tập lập trình (`ACCEPTED`) ghi nhận bản ghi `CodingExerciseCompletion`, trao dedicated XP (+30 EASY, +50 MEDIUM, +80 HARD), nhưng **TUYỆT ĐỐI KHÔNG tự động đánh dấu hoàn thành toàn bộ bài học (`lessonCompleted: false`)**.
> 2. Tiến độ khóa học `courseProgress` chỉ phản ánh các bài học thực sự hoàn thành theo quy trình chuẩn.
> 3. Nộp lại bài đã giải đúng trước đó (`firstCompletion: false`) nhận `codingXpAwarded: 0` (Idempotent).


> **Lưu ý Anti-Cheat quan trọng**: Trong mảng `results`, test case số 2 có `isHidden: true` nên các trường `input`, `expectedOutput`, `actualOutput`, `stdout`, và `errorMessage` **hoàn toàn được backend che giấu** để chống học viên hard-code đáp án.

---

## 12. GET /api/coding-exercises/:id/submissions
Lấy danh sách lịch sử nộp bài của chính học viên đối với bài tập này.
* Sắp xếp theo thời gian nộp mới nhất trước (`createdAt: desc`).
* Hỗ trợ phân trang bằng Query parameters `page` và `limit`.
* Tối ưu băng thông: Lược bỏ trường `sourceCode` lớn trong danh sách tóm tắt.

* **Method**: `GET`
* **URL**: `/api/coding-exercises/:id/submissions?page=1&limit=10`
* **Quyền truy cập**: Học viên (chỉ xem bài của mình), Giảng viên chủ khóa học, hoặc Admin.

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched submission history successfully",
  "data": {
    "items": [
      {
        "id": "c1111111-2222-4333-8444-555555555555",
        "_id": "c1111111-2222-4333-8444-555555555555",
        "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
        "revisionId": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
        "revisionVersion": 1,
        "status": "ACCEPTED",
        "score": 100,
        "maxScore": 100,
        "passedTests": 2,
        "totalTests": 2,
        "executionTime": 35,
        "createdAt": "2026-10-24T12:30:00.000Z",
        "completedAt": "2026-10-24T12:30:01.000Z"
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

## 13. GET /api/coding-exercises/:id/submissions/:submissionId
Xem chi tiết kết quả một lần nộp bài cụ thể, bao gồm toàn bộ mã nguồn nộp và chi tiết kết quả từng test case.
* **Chống tấn công IDOR**: Học viên chỉ có quyền xem bài nộp của chính mình (`submission.userId === requesterId`). Nếu cố tình nhập ID bài nộp của học viên khác, hệ thống từ chối với lỗi `403 Forbidden`.
* **Cơ chế Tự Phục Hồi Submission Bị Treo (Stale PENDING Recovery)**: Nếu bài nộp ở trạng thái `PENDING` quá 5 phút (do worker khởi động lại hoặc sandbox timeout), backend sẽ tự động chuyển trạng thái sang `INTERNAL_ERROR` kèm thông báo: `"Submission execution timed out or worker restarted"`.
* **Anti-Cheat Redaction**: Nếu người gọi là học viên, các test case ẩn tiếp tục bị ẩn thông tin chi tiết output/stdout. Nếu người gọi là Giảng viên hoặc Admin, được xem toàn bộ.

* **Method**: `GET`
* **URL**: `/api/coding-exercises/:id/submissions/:submissionId`
* **Quyền truy cập**: Chủ nhân bài nộp, Giảng viên chủ khóa học, hoặc Admin.

### Response Thành Công (200 OK — Học Viên Xem Bài Của Mình)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched submission details successfully",
  "data": {
    "id": "c1111111-2222-4333-8444-555555555555",
    "_id": "c1111111-2222-4333-8444-555555555555",
    "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "revisionId": "7a35cb9f-e60d-44aa-9c10-09a4d8d1eef8",
    "revisionVersion": 1,
    "sourceCode": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
    "language": "javascript",
    "status": "ACCEPTED",
    "score": 100,
    "maxScore": 100,
    "passedTests": 2,
    "totalTests": 2,
    "executionTime": 35,
    "memoryUsage": 0,
    "errorMessage": null,
    "createdAt": "2026-10-24T12:30:00.000Z",
    "completedAt": "2026-10-24T12:30:01.000Z",
    "results": [
      {
        "id": "d1111111-2222-4333-8444-555555555555",
        "testCaseId": "b1111111-2222-4333-8444-555555555555",
        "status": "PASSED",
        "isHidden": false,
        "order": 1,
        "weight": 1,
        "input": [5],
        "expectedOutput": 15,
        "actualOutput": 15,
        "executionTime": 35,
        "stdout": "Calculated sum for n=5\n",
        "errorMessage": null,
        "explanation": "1 + 2 + 3 + 4 + 5 = 15"
      },
      {
        "id": "d2222222-2222-4333-8444-555555555555",
        "testCaseId": "b2222222-2222-4333-8444-555555555555",
        "status": "PASSED",
        "isHidden": true,
        "order": 2,
        "weight": 1,
        "executionTime": 35
      }
    ]
  }
}
```

---

## 14. GET /api/coding-exercises/:id/completion
Xem trạng thái hoàn thành độc lập của bài tập lập trình, điểm số cao nhất, số lần nộp và điểm dedicated XP đã nhận.
* **Quyền truy cập**: Học viên (xem của bản thân), Giảng viên chủ khóa học, hoặc Admin (có thể truyền `?targetUserId=...` để kiểm tra tiến độ học viên).
* **Bảo vệ quyền riêng tư**: Học viên bị chặn `403 Forbidden` nếu cố ý nhập `targetUserId` của học viên khác.

* **Method**: `GET`
* **URL**: `/api/coding-exercises/:id/completion`
* **Headers**: `Authorization: Bearer <TOKEN>`

### Response Thành Công (200 OK — Đã Hoàn Thành)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched exercise completion status successfully",
  "data": {
    "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "userId": "0070f5b0-93fe-4649-8c11-cc16032bf6fe",
    "completed": true,
    "completedAt": "2026-10-25T09:00:00.000Z",
    "bestScore": 100,
    "totalAttempts": 3,
    "codingXpEarned": 50
  }
}
```

### Response Thành Công (200 OK — Chưa Hoàn Thành)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched exercise completion status successfully",
  "data": {
    "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
    "userId": "0070f5b0-93fe-4649-8c11-cc16032bf6fe",
    "completed": false,
    "completedAt": null,
    "bestScore": 60,
    "totalAttempts": 2,
    "codingXpEarned": 0
  }
}
```

---

## 15. GET /api/coding-exercises/lesson/:lessonId/progress
Lấy bức tranh tổng thể về tiến độ thực hành lập trình trong toàn bộ bài học, bao gồm danh sách trạng thái từng bài tập, tỷ lệ phần trăm hoàn thành bài tập của bài học.
* **Tối ưu hóa Database**: Thực hiện truy vấn theo lô (Batch query) bằng `exerciseId: { in: [...] }`, loại bỏ hoàn toàn vấn đề N+1 queries.
* **Nguyên tắc Mẫu Số**: Chỉ các bài tập đang ở trạng thái `PUBLISHED` (và có revision xuất bản hợp lệ) mới được tính vào mẫu số `totalExercises`.

* **Method**: `GET`
* **URL**: `/api/coding-exercises/lesson/:lessonId/progress`
* **Headers**: `Authorization: Bearer <TOKEN>`

### Response Thành Công (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched lesson coding progress successfully",
  "data": {
    "lessonId": "832a4406-9f45-5e54-9dc4-dc5b05bd10fa",
    "userId": "0070f5b0-93fe-4649-8c11-cc16032bf6fe",
    "totalExercises": 3,
    "completedExercises": 2,
    "completionPercentage": 67,
    "exercises": [
      {
        "exerciseId": "e3ca84d4-b8f0-4afa-be41-4883328b873f",
        "title": "Tính Tổng Từ 1 Đến N",
        "difficulty": "EASY",
        "order": 1,
        "completed": true,
        "completedAt": "2026-10-25T08:30:00.000Z",
        "bestScore": 100,
        "totalAttempts": 1,
        "xpAwarded": 30
      },
      {
        "exerciseId": "f4db95e5-c901-4b0b-cf52-5994439c9840",
        "title": "Số Fibonacci Thứ N",
        "difficulty": "MEDIUM",
        "order": 2,
        "completed": true,
        "completedAt": "2026-10-25T09:00:00.000Z",
        "bestScore": 100,
        "totalAttempts": 2,
        "xpAwarded": 50
      },
      {
        "exerciseId": "a5ec06f6-da12-4c1c-d063-6005540da951",
        "title": "Duyệt Đồ Thị Nâng Cao",
        "difficulty": "HARD",
        "order": 3,
        "completed": false,
        "completedAt": null,
        "bestScore": 0,
        "totalAttempts": 0,
        "xpAwarded": 0
      }
    ]
  }
}
```

---

# PHẦN 3: HƯỚNG DẪN TÍCH HỢP FRONTEND (NEXT.JS CLIENT)

Chi tiết 10 bước chuẩn hóa để Frontend tích hợp phân hệ Thực hành Lập trình & Gamification:

### 1. Tải danh sách bài tập của bài học
* Khi học viên chuyển sang tab "Bài tập lập trình", gọi:
  `GET /api/coding-exercises/lesson/:lessonId/public`
* Nhận danh sách bài tập đã xuất bản (`PUBLISHED`).

### 2. Hiển thị huy hiệu hoàn thành & Thanh tiến độ bài tập
* Đồng thời gọi:
  `GET /api/coding-exercises/lesson/:lessonId/progress`
* Render badge xanh lá `[Hoàn thành]` cho các bài tập có `completed === true`.
* Hiển thị widget tiến độ lập trình: `${completedExercises}/${totalExercises} bài tập (${completionPercentage}%)`.

### 3. Mở Trình soạn thảo Code (Monaco Editor / CodeMirror)
* Khi học viên chọn bài tập:
  `GET /api/coding-exercises/:id`
* Đổ `starterCode` vào Editor, hiển thị markdown `description`, độ khó (`difficulty`), và các ví dụ từ `testCases` (public).

### 4. Thực thi Chạy thử (RUN Code)
* Khi bấm nút **"Chạy Thử" (Run)**:
  `POST /api/coding-exercises/:id/run` với `{ "sourceCode": editor.getValue() }`.
* Nhận kết quả nhanh trong vài chục milliseconds mà không tạo rác trong database.

### 5. Thực thi Nộp bài chính thức (SUBMIT Code)
* Khi bấm nút **"Nộp Bài" (Submit)**:
  `POST /api/coding-exercises/:id/submit` với `{ "sourceCode": editor.getValue() }`.
* Sandbox E2B chấm điểm toàn bộ test case (gồm cả hidden test cases).

### 6. Hiển thị kết quả chấm điểm chi tiết
* Render bảng kết quả từng test case: Status (`PASSED` / `FAILED`), thời gian chạy (`executionTimeMs`), Diff giữa Actual Output và Expected Output (đối với test công khai).
* Đối với test ẩn: hiển thị thẻ `[Test Case Ẩn: Đạt/Không Đạt]`, tuyệt đối không có input/output.

### 7. Hiển thị Modal Phần Thưởng XP Dedicated
* Nếu `status === "ACCEPTED"`:
  * Đọc `response.data.rewards`:
    * `codingXpAwarded`: Điểm XP bài tập lập trình (+30 cho EASY, +50 cho MEDIUM, +80 cho HARD).
    * `dailyStreakXpAwarded`: Điểm chuỗi ngày học (+20 XP nếu là hoạt động học đầu tiên trong ngày).
    * `totalXpAwarded`: Tổng XP nhận được.
  * Hiển thị popup thăng cấp/nhận thưởng lấp lánh (Gamification reward banner).
  * Nếu nộp lại lần thứ 2 trở đi (`completion.firstCompletion === false`): hiển thị `Đã hoàn thành trước đó (0 XP)`.

### 8. Cập nhật Streak & Bảng Xếp Hạng (Leaderboard)
* Đọc `response.data.streak` để cập nhật icon lửa chuỗi ngày học trên Header (`${streak.currentStreak} ngày`).
* Khi học viên mở tab BXH, gọi `GET /api/leaderboard` để thấy điểm XP cá nhân đã tự động tăng.

### 9. Làm mới Tiến độ Bài tập Lập trình
* Sau khi giải đúng, re-fetch:
  `GET /api/coding-exercises/lesson/:lessonId/progress`
* Badge của bài tập lập trình chuyển sang xanh lá và thanh tiến độ bài tập tăng lên tương ứng.

### 10. Phân định rõ ràng: Coding Completion KHÔNG BẰNG Lesson Completion
* **Tuyệt đối không** tự động chuyển trạng thái bài học thành hoàn thành chỉ vì học viên giải xong 1 bài tập code.
* Nút **"Đánh dấu hoàn thành bài học" (Mark Lesson Complete)** vẫn giữ nguyên quyền điều khiển độc lập của học viên hoặc chỉ kích hoạt khi học viên đã học xong video lecture, làm quiz và hoàn thành các bài tập lập trình theo quy định của khóa học.

---

# PHẦN 4: DANH MỤC MÃ LỖI HTTP CHUẨN

| HTTP Status | Message Phổ Biến | Nguyên Nhân & Cách Xử Lý |
| :---: | :--- | :--- |
| `400 Bad Request` | `"Invalid Exercise ID"` / `"ID must be a valid UUID"` | Tham số ID trên đường dẫn không đúng định dạng RFC 4122 UUID. |
| `400 Bad Request` | `"Reference solution failed automated verification. Cannot publish exercise."` | Giảng viên xuất bản bài tập nhưng lời giải mẫu không vượt qua 100% test cases trong Sandbox. |
| `400 Bad Request` | `"Exercise must have at least one test case before it can be published"` | Bài tập chưa cấu hình test case nào. |
| `401 Unauthorized`| `"Unauthorized"` / `"jwt expired"` | Thiếu Access Token hoặc Token đã hết hạn. Client cần gọi refresh token. |
| `403 Forbidden`   | `"You are not enrolled in this course"` | Học viên chưa mua hoặc chưa ghi danh vào khóa học trả phí. |
| `403 Forbidden`   | `"You are not the owner of this course"` | Giảng viên cố gắng xuất bản, sửa hoặc xóa bài tập trong khóa học của giảng viên khác. |
| `403 Forbidden`   | `"You do not have permission to view this submission"` | Học viên cố gắng xem chi tiết bài nộp của học viên khác (Chặn IDOR). |
| `404 Not Found`   | `"Coding exercise not found or not published"` | Bài tập không tồn tại hoặc đang ở trạng thái `DRAFT` khi học viên truy vấn. |
| `429 Too Many Requests` | `"Too many run attempts, please try again in a minute"` | Học viên vượt quá giới hạn 10 lần Run/phút hoặc 5 lần Submit/phút. |
| `500 / 200 INTERNAL_ERROR` | `"Execution infrastructure failure"` | Lỗi kết nối Sandbox đám mây E2B (được cô lập thành `INTERNAL_ERROR`, không phạt học viên). |
