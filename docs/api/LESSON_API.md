# TMDEMY — LESSON MANAGEMENT API (LESSON_API.MD)

Tài liệu đặc tả các API quản lý Bài học (`Lesson`) trong hệ thống.

Base URL: `{{BASE_URL}}` (Mặc định: `http://localhost:3002`)

---

## 1. POST /api/lessons/

### Method & Endpoint
* **Method**: `POST`
* **Endpoint**: `/api/lessons/`
* **Purpose**: Tạo bài học mới (Video hoặc Text) nằm trong một Chương học (`Chapter`) của một Khóa học (`Course`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Request Body
```json
{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository",
  "chapter": "chapter-uuid-v4",
  "course": "course-uuid-v4",
  "type": "video",
  "duration": 720,
  "videoUrl": "https://res.cloudinary.com/tmdemy/video/upload/v1/lesson1.mp4",
  "content": "Nội dung tóm tắt bài học và tài liệu đính kèm",
  "isDemo": false
}
```

### Validation Rules
* `title`: Bắt buộc, tối thiểu 5 ký tự.
* `chapter`: Bắt buộc, UUID hợp lệ.
* `course`: Bắt buộc, UUID hợp lệ.
* `type`: Tùy chọn, một trong `video`, `text` (mặc định: `video`).
* `duration`: Tùy chọn, số giây >= 0.
* `videoUrl`: Tùy chọn, URL hợp lệ.
* `isDemo`: Tùy chọn, boolean (`true` nếu cho phép học thử miễn phí).

### Business & Integrity Rules
* **Cross-Entity Integrity Check**: Backend kiểm tra Chương học `chapter` **bắt buộc phải thuộc về Khóa học `course`** (`chapterDoc.courseId === course`). Nếu sai trả `400 Bad Request` ("Chapter does not belong to the specified course").
* **Ownership Check**: Giảng viên (`TEACHER`) phải là tác giả của khóa học (`courseDoc.authorId === req.user.userId`). Nếu không trả `403 Forbidden`.
* **Thứ tự tự động**: Nếu không chỉ định `order`, backend tự động tính `max(order) + 1` của các bài học trong cùng một chương.
* **Thông báo cho học viên**: Sau khi tạo bài học mới, hệ thống tự động gửi Notification đến toàn bộ học viên đang ghi danh (`ACTIVE`) trong khóa học để báo có bài học mới.

### Success Response
* **HTTP Status**: `201 Created`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lesson created successfully",
    "data": {
      "id": "lesson-uuid-1",
      "_id": "lesson-uuid-1",
      "title": "Bài 2.1: Phân tích kiến trúc Functional Repository",
      "slug": "bai-21-phan-tich-kien-truc-functional-repository",
      "chapter": "chapter-uuid-v4",
      "course": "course-uuid-v4",
      "author": "teacher-uuid-v4",
      "type": "video",
      "duration": 720,
      "videoUrl": "https://res.cloudinary.com/tmdemy/video/upload/v1/lesson1.mp4",
      "content": "Nội dung tóm tắt bài học",
      "isDemo": false,
      "order": 1,
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
POST {{BASE_URL}}/api/lessons/
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository",
  "chapter": "chapter-uuid-v4",
  "course": "course-uuid-v4",
  "type": "video",
  "duration": 720,
  "videoUrl": "https://res.cloudinary.com/tmdemy/video/upload/v1/lesson1.mp4"
}
```

---

## 2. PUT /api/lessons/:id

### Method & Endpoint
* **Method**: `PUT`
* **Endpoint**: `/api/lessons/:id`
* **Purpose**: Cập nhật thông tin bài học (tiêu đề, thời lượng, videoUrl, nội dung, cờ học thử `isDemo`).
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã bài học cần sửa |

### Request Body
```json
{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository (Cập nhật)",
  "duration": 850,
  "isDemo": true
}
```

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**: Trả về dữ liệu bài học đã cập nhật kèm `chapter`, `course`, `author`.

### Raw HTTP Request
```http
PUT {{BASE_URL}}/api/lessons/lesson-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
Content-Type: application/json

{
  "title": "Bài 2.1: Phân tích kiến trúc Functional Repository (Cập nhật)",
  "isDemo": true
}
```

---

## 3. DELETE /api/lessons/:id

### Method & Endpoint
* **Method**: `DELETE`
* **Endpoint**: `/api/lessons/:id`
* **Purpose**: Xóa vĩnh viễn bài học khỏi chương học.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã bài học cần xóa |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lesson deleted successfully"
  }
  ```

### Raw HTTP Request
```http
DELETE {{BASE_URL}}/api/lessons/lesson-uuid-1
Authorization: Bearer <TEACHER_ACCESS_TOKEN>
```

---

## 4. GET /api/lessons/chapter/:chapterId

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/lessons/chapter/:chapterId`
* **Purpose**: Lấy danh sách toàn bộ các bài học thuộc về một chương học theo thứ tự tăng dần (`order ASC`).
* **Authentication**: `Public` (Không yêu cầu đăng nhập)
* **Roles**: Không yêu cầu

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `chapterId` | UUID | Yes | Mã chương học cần lấy bài |

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched lessons by chapter successfully!",
    "data": [
      {
        "id": "lesson-uuid-1",
        "_id": "lesson-uuid-1",
        "title": "Bài 1.1: Giới thiệu hệ thống",
        "slug": "bai-11-gioi-thieu-he-thong",
        "type": "video",
        "duration": 450,
        "isDemo": true,
        "order": 1,
        "chapter": "chapter-uuid",
        "course": "course-uuid"
      }
    ]
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/lessons/chapter/chapter-uuid-here
```

---

## 5. GET /api/lessons/:id

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/lessons/:id`
* **Purpose**: Lấy thông tin chi tiết bài học (bao gồm playback Bunny Stream, nội dung hướng dẫn, transcript và summary AI) dành cho học viên đã ghi danh hoặc bài học học thử (`isDemo: true`).
* **Authentication**: `Tùy chọn Bearer JWT` (Bắt buộc đăng nhập nếu bài học không phải là `isDemo`)
* **Roles**: `USER`, `TEACHER`, `ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã bài học cần xem chi tiết |

### Authorization & Access Rules
1. **Bài học học thử (`isDemo: true`)**: Cho phép người dùng vãng lai (không cần token) hoặc học viên chưa mua khóa học truy cập đầy đủ nội dung bài học.
2. **Bài học chính thức (`isDemo: false`)**:
   - Yêu cầu người dùng phải đăng nhập (`verifyAccessToken`).
   - Học viên (`USER`) bắt buộc phải có bản ghi ghi danh hợp lệ (`ACTIVE`) trong khóa học chứa bài học này. Nếu chưa mua, trả về `403 Forbidden`.
   - Giảng viên sở hữu khóa học (`authorId === userId`) và `ADMIN` luôn có toàn quyền truy cập.
3. **Anti-Leak Policy**: Trường nhạy cảm kỹ thuật `aiProcessingError` được tự động ẩn khỏi response của học viên và khách vãng lai.

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Fetched lesson detail successfully",
    "data": {
      "id": "lesson-uuid-1",
      "_id": "lesson-uuid-1",
      "title": "Bài 2.1: Phân tích kiến trúc Functional Repository",
      "slug": "bai-21-phan-tich-kien-truc-functional-repository",
      "chapter": "chapter-uuid-v4",
      "course": "course-uuid-v4",
      "author": "teacher-uuid-v4",
      "type": "VIDEO",
      "duration": 720,
      "content": "Nội dung tóm tắt bài học",
      "isDemo": false,
      "videoUrl": "https://video.bunnycdn.com/play/video-id-123/playlist.m3u8",
      "bunnyVideoId": "video-id-123",
      "videoStatus": "READY",
      "transcript": "# Bản ghi phụ đề\nChào mừng các bạn đến với TMDEMY...",
      "summary": "## Tóm tắt bài học\n1. Functional Repository pattern\n2. Zod application models...",
      "aiProcessingStatus": "COMPLETED",
      "aiProcessedAt": "2026-10-25T09:00:00.000Z",
      "playback": {
        "hlsUrl": "https://vz-xxxx.b-cdn.net/video-id-123/playlist.m3u8",
        "embedUrl": "https://iframe.mediadelivery.net/embed/xxxx/video-id-123"
      },
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-10-25T09:00:00.000Z"
    }
  }
  ```

### Raw HTTP Request
```http
GET {{BASE_URL}}/api/lessons/lesson-uuid-here
Authorization: Bearer <STUDENT_ACCESS_TOKEN>
```

---

## 6. GET /api/lessons/:id/ai-content

### Method & Endpoint
* **Method**: `GET`
* **Endpoint**: `/api/lessons/:id/ai-content`
* **Purpose**: Endpoint chuyên dụng truy xuất nội dung văn bản phụ đề (Transcript Markdown) và tóm tắt kiến thức (Summary Markdown) do AI microservice sinh ra.
* **Authentication**: `Tùy chọn Bearer JWT` hoặc `Server-to-Server x-ai-service-key`
* **Roles**: `USER` (đã ghi danh hoặc bài demo), `TEACHER`, `ADMIN`, `AI_SERVICE`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `id` | UUID | Yes | Mã bài học cần lấy nội dung AI |

### Access Rules
* Học viên có ghi danh `ACTIVE` hoặc bài học `isDemo: true` được phép đọc `transcript`, `summary`, `aiProcessingStatus`, `aiProcessedAt`.
* Trường lỗi kỹ thuật `aiProcessingError` **chỉ hiển thị** cho Giảng viên sở hữu khóa học, Admin hệ thống hoặc Service nội bộ (`x-ai-service-key`).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema (Học viên / Khách xem demo)**:
  ```json
  {
    "success": true,
    "message": "Fetched lesson AI content successfully",
    "data": {
      "id": "lesson-uuid-1",
      "transcript": "# Bản ghi phụ đề\nGiảng viên trình bày về kiến trúc phân tầng...",
      "summary": "## Tóm tắt bài học\nCác điểm kiến thức trọng tâm cần ghi nhớ...",
      "aiProcessingStatus": "COMPLETED",
      "aiProcessedAt": "2026-10-25T09:00:00.000Z"
    }
  }
  ```

* **JSON Schema (Giảng viên / Admin khi có lỗi xử lý AI)**:
  ```json
  {
    "success": true,
    "message": "Fetched lesson AI content successfully",
    "data": {
      "id": "lesson-uuid-1",
      "transcript": null,
      "summary": null,
      "aiProcessingStatus": "FAILED",
      "aiProcessedAt": null,
      "aiProcessingError": "Whisper audio decode failure: unsupported codec"
    }
  }
  ```

### Error Responses
* `401 Unauthorized`: Chưa đăng nhập và bài học không phải là demo.
* `403 Forbidden`: Học viên chưa ghi danh khóa học.
* `404 Not Found`: Không tìm thấy bài học hoặc khóa học liên quan.

---

## 7. PATCH & PUT /api/lessons/:id/ai-content

### Method & Endpoint
* **Method**: `PATCH` / `PUT`
* **Endpoint**: `/api/lessons/:id/ai-content`
* **Purpose**: Cập nhật nội dung phụ đề (`transcript`), tóm tắt (`summary`), trạng thái tiến trình AI (`aiProcessingStatus`), và ghi nhận lỗi xử lý (`aiProcessingError`). Hỗ trợ cả 2 phương thức HTTP PATCH và PUT để tương thích toàn diện với client services.
* **Authentication**:
  1. **Phương thức 1 (Giảng viên / Admin)**: `Bearer JWT` (Giảng viên phải là tác giả của khóa học).
  2. **Phương thức 2 (FastAPI Microservice Server-to-Server)**: Header `x-ai-service-key: <AI_SERVICE_API_KEY>` (Mặc định: cấu hình trong biến môi trường `AI_SERVICE_API_KEY`).
* **Roles**: `TEACHER` (Chủ khóa học), `ADMIN`, `AI_SERVICE`

### Headers
| Header | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `Authorization` | String | Tùy chọn | `Bearer <JWT_TOKEN>` (Nếu là Giảng viên hoặc Admin) |
| `x-ai-service-key` | String | Tùy chọn | API Key nội bộ giữa FastAPI và TMDEMY backend |
| `Content-Type` | String | Yes | `application/json` |

### Request Body
```json
{
  "transcript": "# Transcript\nNội dung được nhận dạng từ video bài giảng...",
  "summary": "## Tóm tắt bài học\nCác kiến thức trọng tâm...",
  "aiProcessingStatus": "COMPLETED",
  "aiProcessingError": null,
  "bunnyVideoId": "video-asset-alpha-123",
  "clientTimestamp": "2026-10-25T09:00:00.000Z"
}
```

### Body Fields
| Field | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `transcript` | String (Markdown) | No | Toàn bộ văn bản phụ đề Markdown (hỗ trợ Unicode tiếng Việt, không giới hạn độ dài) |
| `summary` | String (Markdown) | No | Bản tóm tắt bài học Markdown |
| `aiProcessingStatus` | String (Enum) | No | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `aiProcessingError` | String / Null | No | Chi tiết lỗi kỹ thuật khi trạng thái là `FAILED` |
| `bunnyVideoId` | String | No | ID video Bunny tương ứng. Dùng để chống ghi đè khi video bài học đã bị đổi |
| `clientTimestamp` | String (ISO Date) | No | Mốc thời gian job AI chạy. Dùng để chống job AI cũ ghi đè job AI mới |

### Business & Conflict Prevention Rules
1. **Ownership Authorization**:
   - Giảng viên (`TEACHER`) chỉ được cập nhật bài học trong khóa học do chính mình tạo ra (`course.authorId === userId`). Giảng viên khác bị từ chối với `403 Forbidden`.
   - Học viên (`USER`) tuyệt đối không có quyền gọi endpoint này (`403 Forbidden`).
   - `ADMIN` và `AI_SERVICE` có quyền cập nhật toàn hệ thống.
2. **State Machine Validation**:
   - Khi chuyển trạng thái sang `COMPLETED`: Bắt buộc phải có `transcript` hoặc `summary` (được gửi kèm trong payload hoặc đã có sẵn trong cơ sở dữ liệu). Nếu cả hai đều rỗng, backend trả `400 Bad Request` ("Cannot mark AI processing as COMPLETED without transcript or summary content").
   - Khi chuyển trạng thái sang `COMPLETED`: Backend tự động đặt `aiProcessedAt = new Date()` và dọn dẹp lỗi cũ `aiProcessingError = null`.
   - Khi chuyển trạng thái sang `FAILED`: Backend ghi nhận nội dung lỗi `aiProcessingError`.
3. **Stale AI Job Conflict Prevention**:
   - **Video Mismatch Guard**: Nếu payload gửi kèm `bunnyVideoId` và bài học hiện tại có `bunnyVideoId`, nếu hai giá trị khác nhau (do giảng viên đã tải lên video mới trong lúc AI đang xử lý), backend từ chối với `409 Conflict` ("Stale AI job: bunnyVideoId does not match current lesson video").
   - **Timestamp Monotonicity Guard**: Nếu payload gửi kèm `clientTimestamp` và bài học đã có `aiProcessedAt` mới hơn thời gian này, backend từ chối với `409 Conflict` ("Stale AI job: newer AI content was already processed").
4. **Partial Update Safety**: Cập nhật một trường (ví dụ chỉ cập nhật `summary`) không làm mất các trường khác (`transcript`, `title`, `duration`, `bunnyVideoId`).

### Success Response
* **HTTP Status**: `200 OK`
* **JSON Schema**:
  ```json
  {
    "success": true,
    "message": "Lesson AI content updated successfully",
    "data": {
      "id": "lesson-uuid-1",
      "transcript": "# Transcript\nNội dung được nhận dạng từ video...",
      "summary": "## Tóm tắt bài học\nCác kiến thức trọng tâm...",
      "aiProcessingStatus": "COMPLETED",
      "aiProcessedAt": "2026-10-25T09:00:00.000Z",
      "aiProcessingError": null,
      "updatedAt": "2026-10-25T09:00:00.000Z"
    }
  }
  ```

### Error Responses
| HTTP Status | Message / Reason |
| :---: | :--- |
| `400 Bad Request` | Thiếu nội dung khi chuyển sang `COMPLETED` hoặc ID không hợp lệ |
| `401 Unauthorized` | Thiếu Token / Token hết hạn hoặc sai `x-ai-service-key` |
| `403 Forbidden` | Học viên hoặc Giảng viên không sở hữu khóa học |
| `404 Not Found` | Không tìm thấy bài học |
| `409 Conflict` | Job AI bị lỗi thời (sai video ID hoặc timestamp cũ hơn nội dung hiện có) |

### Raw HTTP Requests
* **Dành cho Giảng viên**:
  ```http
  PATCH {{BASE_URL}}/api/lessons/lesson-uuid-here/ai-content
  Authorization: Bearer <TEACHER_ACCESS_TOKEN>
  Content-Type: application/json

  {
    "summary": "## Tóm tắt bài học cập nhật bởi giảng viên",
    "aiProcessingStatus": "COMPLETED"
  }
  ```

* **Dành cho FastAPI AI Microservice**:
  ```http
  PATCH {{BASE_URL}}/api/lessons/lesson-uuid-here/ai-content
  x-ai-service-key: <AI_SERVICE_API_KEY>
  Content-Type: application/json

  {
    "transcript": "# Full Transcript từ Faster-Whisper...",
    "summary": "## Full Summary từ Gemini Flash...",
    "aiProcessingStatus": "COMPLETED",
    "bunnyVideoId": "video-asset-alpha-123",
    "clientTimestamp": "2026-10-25T09:00:00.000Z"
  }
  ```

---

## 8. Hướng dẫn Tích hợp Frontend & Microservice

### 8.1. Phía Frontend (Next.js Client)
1. **Giao diện Học tập (Lesson Study Player)**:
   - Gọi `GET /api/lessons/:id`.
   - Hiển thị tab "Bản ghi phụ đề" (`transcript`) và "Tóm tắt bài học" (`summary`) bên cạnh video player.
   - Sử dụng thư viện `react-markdown` và `rehype-highlight` để render Markdown đẹp mắt, có syntax highlighting cho các đoạn mã.
2. **Trạng thái Tiến trình AI (Teacher Studio)**:
   - Khi bài học vừa tải lên video: Giảng viên bấm nút "Khởi chạy AI" (`POST /api/lessons/:id/ai-process`).
   - Theo dõi tiến trình qua `GET /api/lessons/:id/ai-process`.
   - Khi `status === 'COMPLETED'`: Phụ đề và tóm tắt tự động xuất hiện.
   - Khi `status === 'FAILED'`: Hiển thị lỗi kỹ thuật `errorMessage` và cho phép thử lại.

### 8.2. Phía AI Microservice (FastAPI Pipeline - Step 6.6B & Step 6.6C)
1. Backend Node.js phân giải trực tiếp URL MP4 tải về từ Bunny Stream (`resolveBunnyMediaUrl`) kèm chữ ký bảo mật Token Auth (TTL 4 giờ).
2. Backend gửi job xử lý media từ xa qua endpoint `POST /api/v1/jobs/from-media-source` kèm header `Idempotency-Key: <AiProcessingJob.id>`.
3. FastAPI kiểm tra idempotency, nếu trùng lặp an toàn trả về `200 OK` (hoặc `202 Accepted` cho job mới) cùng `job_id`.
4. Hàng đợi FIFO xử lý bất đồng bộ qua 7 stages:
   `QUEUED` -> `DOWNLOADING_MEDIA` -> `VALIDATING_MEDIA` -> `EXTRACTING_AUDIO` -> `TRANSCRIBING` -> `SUMMARIZING` -> `COMPLETED`.
5. Background Reconciliation Worker (`aiJobReconciliation.cron.ts`, mặc định chạy mỗi 30 giây) tự động polling trạng thái từ FastAPI và lưu kết quả vào PostgreSQL khi hoàn tất.

---

## 9. AI Job Orchestration Endpoints (Step 6.6A & Step 6.6C)

### 9.1. Khởi tạo Tiến trình AI: `POST /api/lessons/:id/ai-process`
* **Authentication**: `Bearer JWT`
* **Roles**: `TEACHER` (Chủ sở hữu khóa học), `ADMIN`
* **Mục đích**: Bắt đầu tiến trình phân giải Bunny direct media MP4 và gửi job từ xa tới FastAPI (Whisper & Gemini) cho bài học. Tự động áp dụng Generation Fencing, Distributed Idempotency Caching và Concurrency Lock.
* **Request Body**:
  ```json
  {
    "jobType": "TRANSCRIBE_AND_SUMMARIZE",
    "videoFingerprint": "sha256-hash-optional",
    "model": "gemini-2.5-flash"
  }
  ```
* **Success Response (202 Accepted)**:
  ```json
  {
    "success": true,
    "statusCode": 202,
    "message": "Đã tạo tiến trình xử lý AI thành công",
    "data": {
      "id": "job-uuid",
      "lessonId": "lesson-uuid",
      "courseId": "course-uuid",
      "requestedById": "user-uuid",
      "jobType": "TRANSCRIBE_AND_SUMMARIZE",
      "status": "QUEUED",
      "providerJobId": "fastapi-job-uuid",
      "generation": 1,
      "videoId": "bunny-guid-123",
      "currentStage": "QUEUED",
      "createdAt": "2026-10-25T12:00:00.000Z"
    }
  }
  ```

### 9.2. Lấy Trạng thái Tiến trình AI Gần nhất: `GET /api/lessons/:id/ai-process`
* **Authentication**: `Bearer JWT`
* **Roles**: `TEACHER` (Chủ sở hữu khóa học), `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Lấy tiến trình AI gần nhất thành công",
    "data": {
      "id": "job-uuid",
      "lessonId": "lesson-uuid",
      "status": "RUNNING",
      "currentStage": "TRANSCRIBING",
      "generation": 1,
      "lastPolledAt": "2026-10-25T12:01:00.000Z",
      "nextPollAt": "2026-10-25T12:01:05.000Z"
    }
  }
  ```

### 9.3. Danh sách Lịch sử Tiến trình AI: `GET /api/lessons/:id/ai-jobs`
* **Authentication**: `Bearer JWT`
* **Roles**: `TEACHER` (Chủ sở hữu khóa học), `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Lấy danh sách tiến trình AI thành công",
    "data": [
      {
        "id": "job-uuid-2",
        "jobType": "TRANSCRIBE_AND_SUMMARIZE",
        "status": "COMPLETED",
        "generation": 2
      },
      {
        "id": "job-uuid-1",
        "jobType": "TRANSCRIBE_AND_SUMMARIZE",
        "status": "STALE",
        "generation": 1
      }
    ]
  }
  ```

### 9.4. Chi tiết Tiến trình AI: `GET /api/lessons/:id/ai-jobs/:jobId`
* **Authentication**: `Bearer JWT`
* **Roles**: `TEACHER` (Chủ sở hữu khóa học), `ADMIN`

### 9.5. Kích hoạt Đồng bộ Ngay Lập tức: `POST /api/lessons/:id/ai-jobs/:jobId/poll`
* **Authentication**: `Bearer JWT`
* **Roles**: `TEACHER` (Chủ sở hữu khóa học), `ADMIN`
* **Mục đích**: Client chủ động yêu cầu server kiểm tra và cập nhật tiến độ ngay từ FastAPI.

---

## 10. AI Assessment Generation Endpoints (Step 7C)

### 10.1. Tự động sinh trắc nghiệm bằng AI: `POST /api/lessons/:id/ai-quiz/generate`
* **Authentication**: `Bearer JWT`
* **Roles**: `TEACHER` (Chủ sở hữu khóa học), `ADMIN`
* **Alias route**: `POST /api/lessons/:lessonId/ai-quiz/generate`
* **Mục đích**: Tự động sinh bài kiểm tra trắc nghiệm (Quiz) từ transcript/summary của bài học thông qua FastAPI AI microservice (Gemini 3.5 Flash).
* **Request Body**:
  ```json
  {
    "questionCount": 5,
    "difficulty": "MEDIUM",
    "teacherInstructions": "Tập trung vào kiến thức REST API methods và status codes",
    "previewOnly": false,
    "confirmOverwrite": false
  }
  ```
* **Body Fields**:
  | Field | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `questionCount` | Integer (1-20) | No | 5 | Số lượng câu hỏi cần sinh |
  | `difficulty` | Enum | No | `MEDIUM` | Độ khó: `EASY`, `MEDIUM`, `HARD` |
  | `teacherInstructions` | String (max 500) | No | - | Yêu cầu hoặc chỉ dẫn bổ sung của giảng viên |
  | `previewOnly` | Boolean | No | `false` | Nếu `true`, chỉ trả kết quả xem trước kèm explanation mà không lưu vào DB |
  | `confirmOverwrite` | Boolean | No | `false` | Bắt buộc `true` nếu bài học đã có Quiz (và Quiz đó chưa có học viên nộp bài) |

* **Success Response - Persisted (201 Created)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Đã tạo Quiz AI thành công",
    "data": {
      "id": "quiz-uuid",
      "lessonId": "lesson-uuid",
      "title": "Quiz - Giới thiệu về REST API",
      "questions": [
        {
          "id": "question-uuid-1",
          "quizId": "quiz-uuid",
          "title": "Trong kiến trúc RESTful API, phương thức HTTP nào thường dùng để tạo mới tài nguyên?",
          "answer": "POST",
          "options": [
            { "id": "option-uuid-1", "title": "POST", "questionId": "question-uuid-1" },
            { "id": "option-uuid-2", "title": "GET", "questionId": "question-uuid-1" },
            { "id": "option-uuid-3", "title": "PUT", "questionId": "question-uuid-1" },
            { "id": "option-uuid-4", "title": "DELETE", "questionId": "question-uuid-1" }
          ]
        }
      ],
      "createdAt": "2026-10-26T20:00:00.000Z",
      "updatedAt": "2026-10-26T20:00:00.000Z"
    }
  }
  ```

* **Success Response - Preview Only (200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Đã sinh bản xem trước Quiz AI thành công (chưa lưu cơ sở dữ liệu)",
    "data": {
      "title": "Quiz - Giới thiệu về REST API",
      "description": "Kiểm tra kiến thức về Giới thiệu về REST API",
      "language": "vi",
      "difficulty": "MEDIUM",
      "questions": [
        {
          "question": "Trong kiến trúc RESTful API, phương thức HTTP nào thường dùng để tạo mới tài nguyên?",
          "type": "SINGLE_CHOICE",
          "difficulty": "MEDIUM",
          "options": [
            { "id": "A", "text": "POST", "isCorrect": true },
            { "id": "B", "text": "GET", "isCorrect": false },
            { "id": "C", "text": "PUT", "isCorrect": false },
            { "id": "D", "text": "DELETE", "isCorrect": false }
          ],
          "correctAnswer": "POST",
          "explanation": "Phương thức POST trong HTTP chuẩn được thiết kế để tạo mới resource trên server."
        }
      ],
      "previewOnly": true,
      "warning": null,
      "metadata": {
        "modelUsed": "gemini-3.5-flash",
        "questionCount": 1
      }
    }
  }
  ```

* **Error Responses**:
  | HTTP Status | Message / Reason |
  | :---: | :--- |
  | `400 Bad Request` | Bài học chưa có nội dung phụ đề/transcript (độ dài < 50 ký tự) |
  | `401 Unauthorized` | Không có token hoặc token không hợp lệ |
  | `403 Forbidden` | Học viên gọi API hoặc Giảng viên không sở hữu khóa học này |
  | `404 Not Found` | Không tìm thấy bài học |
  | `409 Conflict` | Bài học đã có Quiz với học viên đã nộp bài (bảo vệ lịch sử chấm điểm), hoặc chưa xác nhận `confirmOverwrite` |
  | `502 / 504 Gateway Error` | FastAPI microservice hoặc Gemini gặp lỗi kết nối hoặc timeout |

---

### 10.2. Tự động sinh bài tập lập trình bằng AI: `POST /api/lessons/:id/ai-coding-exercise/generate`
* **Authentication**: `Bearer JWT`
* **Roles**: `TEACHER` (Chủ sở hữu khóa học), `ADMIN`
* **Alias route**: `POST /api/lessons/:lessonId/ai-coding-exercise/generate`
* **Mục đích**: Tự động sinh bài tập lập trình (Coding Exercise) hoàn chỉnh kèm execution contract, starter code, reference solution, test cases (public + hidden) và tự động xác thực bằng sandbox E2B.
* **Request Body**:
  ```json
  {
    "language": "javascript",
    "difficulty": "EASY",
    "teacherInstructions": "Tạo bài tập về lọc mảng các số chẵn",
    "previewOnly": false
  }
  ```
* **Body Fields**:
  | Field | Type | Required | Default | Description |
  | :--- | :---: | :---: | :---: | :--- |
  | `language` | Enum | No | `javascript` | `javascript`, `typescript`, `python`, `cpp`, `java` |
  | `difficulty` | Enum | No | `EASY` | `EASY`, `MEDIUM`, `HARD` |
  | `teacherInstructions` | String (max 500) | No | - | Chỉ dẫn thêm cho bài tập |
  | `previewOnly` | Boolean | No | `false` | Nếu `true`, chỉ trả bản xem trước kèm test case bí mật và reference solution |

* **Success Response - Persisted Draft (201 Created)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Đã tạo bài tập Coding Exercise AI dạng DRAFT thành công",
    "data": {
      "id": "exercise-uuid",
      "lessonId": "lesson-uuid",
      "courseId": "course-uuid",
      "title": "Lọc các số chẵn trong mảng",
      "slug": "loc-cac-so-chan-trong-mang-a1b2",
      "status": "DRAFT",
      "source": "AI",
      "currentRevision": {
        "id": "revision-uuid",
        "version": 1,
        "isPublished": false,
        "language": "javascript",
        "difficulty": "EASY",
        "starterCode": "function filterEvenNumbers(numbers) {\n  // Code here\n}",
        "referenceSolution": "function filterEvenNumbers(numbers) {\n  return numbers.filter(n => n % 2 === 0);\n}",
        "executionContract": {
          "entrypoint": "filterEvenNumbers",
          "parameters": [{ "name": "numbers", "type": "number[]", "position": 0 }],
          "returnType": "number[]"
        },
        "testCases": [
          {
            "id": "tc-1",
            "isPublic": true,
            "weight": 50,
            "inputs": [{ "name": "numbers", "value": [1, 2, 3, 4] }],
            "expectedOutput": [2, 4]
          },
          {
            "id": "tc-2",
            "isPublic": false,
            "weight": 50,
            "inputs": [{ "name": "numbers", "value": [7, 9, 11] }],
            "expectedOutput": []
          }
        ]
      },
      "verification": {
        "status": "VERIFIED",
        "verifiedAt": "2026-10-26T20:00:00.000Z",
        "testPassRate": 100,
        "passedCount": 2,
        "totalCount": 2,
        "details": []
      }
    }
  }
  ```

* **Quy tắc An toàn & Revision**:
  1. **Trạng thái Mặc định**: Bài tập được sinh ra luôn ở trạng thái `DRAFT` và `isPublished: false`. Học viên tuyệt đối không thể nhìn thấy bài tập này cho đến khi Giảng viên duyệt và bấm Publish.
  2. **Bảo mật Test Case Bí mật & Solution**: Khi học viên truy vấn bài tập đã publish, API học viên tự động ẩn hoàn toàn `referenceSolution` và toàn bộ các test cases có `isPublic: false`.
  3. **Bảo toàn Lịch sử Submissions**: Nếu bài tập đã publish hoặc đã có học viên nộp bài trước đó, hệ thống không ghi đè mà tự động tạo bản sửa đổi mới `Revision v(N+1)` ở trạng thái draft, bảo toàn nguyên vẹn mã nguồn và kết quả chấm của các bài nộp cũ.
  4. **Xác thực Sandbox E2B**: Reference solution được thực thi trong isolated sandbox E2B. Nếu 100% test cases pass, bài tập có `verificationStatus = VERIFIED`. Nếu thất bại, trạng thái là `FAILED` kèm chi tiết lỗi để giảng viên điều chỉnh. Nếu E2B runner không khả dụng, trạng thái là `UNVERIFIED` và giảng viên phải tự kiểm tra trước khi publish.

---

### 10.3 POST /api/lessons/:id/ai-quiz/save-approved (Atomic Batch Persistence - Phase 4)

* **Alias route**: `POST /api/lessons/:lessonId/ai-quiz/save-approved`
* **Mục đích**: Lưu chính xác 100% bộ câu hỏi Quiz đã được giảng viên duyệt từ bản xem trước vào PostgreSQL trong một Prisma transaction duy nhất. Ngăn chặn triệt để rủi ro ghi một phần (partial writes), không gọi lại Gemini để tránh tình trạng câu hỏi lưu khác câu hỏi xem trước.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN` (Giảng viên phải là chủ sở hữu khóa học chứa bài học này)
* **Request Body**:
  ```json
  {
    "title": "Quiz - JavaScript Functions",
    "difficulty": "EASY",
    "confirmOverwrite": false,
    "questions": [
      {
        "question": "Hàm calculateDiscount nhận vào những tham số nào?",
        "type": "SINGLE_CHOICE",
        "difficulty": "EASY",
        "options": [
          { "id": "A", "text": "price và discountPercent", "isCorrect": true },
          { "id": "B", "text": "price và tax", "isCorrect": false },
          { "id": "C", "text": "amount và rate", "isCorrect": false },
          { "id": "D", "text": "cost và voucher", "isCorrect": false }
        ],
        "correctAnswer": "price và discountPercent",
        "explanation": "Theo bài giảng, hàm nhận vào price và discountPercent."
      }
    ]
  }
  ```
* **Success Response (201 Created / 200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Đã lưu bài Quiz với bộ câu hỏi đã duyệt thành công",
    "data": {
      "id": "quiz-uuid",
      "lessonId": "lesson-uuid",
      "title": "Quiz - JavaScript Functions",
      "questions": []
    }
  }
  ```
* **Bảo vệ toàn vẹn**:
  * Nếu Quiz hiện tại đã có học viên nộp bài (`submissions.length > 0`), trả về HTTP `409 Conflict` (khóa ghi đè để bảo vệ kết quả học tập).
  * Nếu Quiz hiện tại chưa có bài nộp nhưng `confirmOverwrite: false`, trả về HTTP `409 Conflict` yêu cầu xác nhận ghi đè rõ ràng.

---

### 10.4 POST /api/lessons/:id/ai-coding-exercise/save-approved (Exact Preview Persistence - Phase 6)

* **Alias route**: `POST /api/lessons/:lessonId/ai-coding-exercise/save-approved`
* **Mục đích**: Lưu chính xác 100% bài tập lập trình đã duyệt từ Preview Token hoặc payload trực tiếp mà KHÔNG gọi lại Gemini lần thứ 2. Giữ nguyên starter code, reference solution, test cases và kết quả verification sandbox E2B đã nghiệm thu.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN` (Chủ sở hữu khóa học)
* **Request Body (Sử dụng Preview Token)**:
  ```json
  {
    "previewToken": "preview-token-uuid-v4",
    "confirmOverwrite": true
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Đã lưu bài tập lập trình đã duyệt (DRAFT) thành công",
    "data": {
      "id": "exercise-uuid",
      "lessonId": "lesson-uuid",
      "status": "DRAFT",
      "source": "AI",
      "revisions": [],
      "verification": {
        "status": "VERIFIED",
        "testPassRate": 100
      }
    }
  }
  ```
---

### 10.5 GET /api/ai/models & GET /api/lessons/ai-models (AI Model Registry & Allowlist - Step 7G)

* **Aliases**: `GET /api/ai/models`, `GET /api/lessons/ai-models`
* **Mục đích**: Cung cấp danh sách các mô hình Gemini AI hợp lệ, được kiểm soát tập trung bởi backend (server-controlled model allowlist). Cho phép giảng viên lựa chọn mô hình linh hoạt khi tạo tóm tắt bài học, câu hỏi trắc nghiệm hoặc bài tập lập trình để tránh nghẽn quota.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Fetched supported AI models successfully",
    "data": {
      "models": [
        {
          "id": "gemini-3.5-flash",
          "displayName": "Gemini 3.5 Flash (Khuyên dùng)",
          "provider": "google",
          "supportsSummary": true,
          "supportsQuiz": true,
          "supportsCoding": true,
          "isDefault": true,
          "description": "Tốc độ nhanh, ổn định và chi phí tối ưu nhất cho đa mục đích."
        },
        {
          "id": "gemini-3.5-flash-lite",
          "displayName": "Gemini 3.5 Flash-Lite",
          "provider": "google",
          "supportsSummary": true,
          "supportsQuiz": true,
          "supportsCoding": true,
          "isDefault": false,
          "description": "Siêu nhanh, dung lượng nhỏ gọn, quota dồi dào, lý tưởng khi hệ thống quá tải."
        },
        {
          "id": "gemini-3.1-flash-lite",
          "displayName": "Gemini 3.1 Flash-Lite",
          "provider": "google",
          "supportsSummary": true,
          "supportsQuiz": true,
          "supportsCoding": true,
          "isDefault": false,
          "description": "Phiên bản Flash-Lite dự phòng ổn định cao."
        },
        {
          "id": "gemini-flash-lite-latest",
          "displayName": "Gemini Flash-Lite Latest",
          "provider": "google",
          "supportsSummary": true,
          "supportsQuiz": true,
          "supportsCoding": true,
          "isDefault": false,
          "description": "Bản cập nhật Flash-Lite mới nhất từ Google GenAI."
        },
        {
          "id": "gemini-pro-latest",
          "displayName": "Gemini Pro Latest",
          "provider": "google",
          "supportsSummary": true,
          "supportsQuiz": true,
          "supportsCoding": true,
          "isDefault": false,
          "description": "Khả năng suy luận lập trình sâu sắc nhất (lưu ý: giới hạn hạn ngạch hàng ngày)."
        }
      ],
      "defaultModel": "gemini-3.5-flash"
    }
  }
  ```

---

### 10.6 POST /api/lessons/:id/summary/recover & POST /api/lessons/:id/ai-summary/generate (Step 7G)

* **Aliases**: `POST /api/lessons/:id/summary/recover`, `POST /api/lessons/:id/ai-summary/generate`, `POST /api/lessons/:id/summary/retry`
* **Mục đích**: Phục hồi an toàn bài học bị lỗi tóm tắt rỗng dù AI job đã hoàn thành, hoặc tạo tóm tắt trực tiếp từ lời giảng hiện có mà **KHÔNG CẦN CHẠY LẠI WHISPER**.
* **Authentication**: `Bearer JWT required`
* **Roles**: `TEACHER`, `ADMIN` (Chủ sở hữu khóa học)
* **Request Body (Optional)**:
  ```json
  {
    "model": "gemini-3.5-flash-lite"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Nội dung tóm tắt bài học đã được tạo và lưu thành công.",
    "data": {
      "lesson": { "id": "lesson-uuid", "title": "Bài học" },
      "summary": "## Tóm tắt bài học\n...",
      "modelUsed": "gemini-3.5-flash-lite",
      "recoveredFromArtifact": false,
      "persisted": true,
      "durationSeconds": 3.8
    }
  }
  ```
* **Nguyên tắc bảo vệ dữ liệu**:
  * Nếu bài học đã có tóm tắt hợp lệ (đã được giảng viên chỉnh sửa), hệ thống **tuyệt đối không ghi đè** mà giữ nguyên nội dung.
  * Nếu artifact `summary.md` đã có sẵn trên đĩa từ job trước, hệ thống khôi phục ngay mà không tốn thêm token Gemini.
  * Chỉ khi `Lesson.summary` thực sự được ghi nhận non-empty Markdown vào PostgreSQL thì bài học mới chuyển trạng thái hoàn tất tóm tắt.




