# TÀI LIỆU API REFERENCE — TMDEMY AI SERVICE

Tài liệu đặc tả toàn diện về giao diện lập trình ứng dụng RESTful API (FastAPI) của dịch vụ TMdemy AI Microservice (Speech-to-Text & Summarization).

---

## 1. Tổng quan & Base URL

- **Tên dịch vụ**: TMdemy AI Microservice
- **Phiên bản API**: `0.4.0`
- **Giao thức**: HTTP / JSON & Multipart Form Data
- **Base URL (Local Development)**: `http://127.0.0.1:8000`
- **OpenAPI Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 2. Cơ chế xác thực (Authentication)

Dịch vụ AI Microservice sử dụng cơ chế bảo mật khóa bí mật dùng chung (Shared Secret API Key). Toàn bộ endpoint xử lý bài giảng (`/api/v1/jobs/*`) đều được bảo vệ nghiêm ngặt.

### 2.1. Header xác thực bắt buộc

```http
X-API-Key: <AI_SERVICE_API_KEY>
```

> **Lưu ý bảo mật:**
> - Khóa `AI_SERVICE_API_KEY` được định nghĩa trong file `.env` của AI Service và Express Backend.
> - Đây là secret nội bộ giữa backend Node.js/Express và Python FastAPI. Khóa này **KHÁC** với `GEMINI_API_KEY`.
> - Tuyệt đối không để lộ header này tới Client/Frontend.
> - Endpoint kiểm tra sức khỏe `GET /health` là endpoint công khai duy nhất không yêu cầu header này.

---

## 3. Bảng tổng hợp Endpoints

| Phương thức | Đường dẫn | Xác thực | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | Không | Kiểm tra trạng thái service và số lượng job trong hàng đợi. |
| `POST` | `/api/v1/jobs` | **Bắt buộc** | Tải lên file video/audio qua Multipart Form và tạo job xử lý bài giảng. |
| `POST` | `/api/v1/jobs/from-media-source` | **Bắt buộc** | Nạp media từ Bunny Stream / Direct CDN với hỗ trợ Idempotency (Step 6.6B). |
| `POST` | `/api/v1/jobs/from-bunny` | **Bắt buộc** | Alias cho endpoint `/from-media-source`. |
| `POST` | `/api/v1/jobs/generate-quiz` | **Bắt buộc** | Tạo job sinh bộ câu hỏi trắc nghiệm Quiz bất đồng bộ (Step AI-05). |
| `POST` | `/api/v1/jobs/generate-coding-exercise` | **Bắt buộc** | Tạo job sinh bài tập lập trình Coding Exercise bất đồng bộ (Step AI-06). |
| `GET` | `/api/v1/jobs/{job_id}` | **Bắt buộc** | Polling kiểm tra trạng thái và giai đoạn hiện tại của job. |
| `GET` | `/api/v1/jobs/{job_id}/result` | **Bắt buộc** | Lấy toàn bộ transcript, summary, quiz và coding exercise khi job đã hoàn tất. |
| `GET` | `/api/v1/jobs/{job_id}/quiz` | **Bắt buộc** | Lấy dữ liệu Quiz JSON cấu trúc chuẩn Pydantic (Step AI-05). |
| `GET` | `/api/v1/jobs/{job_id}/coding-exercise` | **Bắt buộc** | Lấy dữ liệu Coding Exercise JSON cấu trúc chuẩn Pydantic (Step AI-06). |
| `GET` | `/api/v1/jobs/{job_id}/artifacts/{name}` | **Bắt buộc** | Tải về tệp artifact trực tiếp (`exercise.json`, `quiz.json`, `transcript.md`, `summary.md`). |
| `POST` | `/api/v1/jobs/{job_id}/retry-summary` | **Bắt buộc** | Thử lại bước tóm tắt Gemini (không chạy lại Whisper). |

> **Xem tài liệu chi tiết cho Bunny Video Ingestion:** [docs/BUNNY_VIDEO_INGESTION_API.md](file:///d:/ai-service/speech-to-text/docs/BUNNY_VIDEO_INGESTION_API.md)
>
> **Xem tài liệu chi tiết cho Quiz Generator:** [docs/QUIZ_GENERATION_API.md](file:///d:/ai-service/speech-to-text/docs/QUIZ_GENERATION_API.md)
>
> **Xem tài liệu chi tiết cho Coding Exercise Generator:** [docs/CODING_EXERCISE_GENERATION_API.md](file:///d:/ai-service/speech-to-text/docs/CODING_EXERCISE_GENERATION_API.md)


---

## 4. Chi tiết từng Endpoint

### 4.1. GET /health

Kiểm tra trạng thái sẵn sàng (liveness/readiness probe) của AI Service. Không kích hoạt Whisper model hay gọi Gemini API.

- **Request**: Không tham số
- **Response**: `200 OK`

```json
{
  "status": "ok",
  "service": "tmdemy-ai-service",
  "version": "0.4.0",
  "queue_size": 0
}
```

---

### 4.2. POST /api/v1/jobs

Tải lên tệp video hoặc audio để tạo job xử lý bài giảng mới theo cơ chế bất đồng bộ (Asynchronous Job).

- **Content-Type**: `multipart/form-data`
- **Headers**:
  ```http
  X-API-Key: <AI_SERVICE_API_KEY>
  ```
- **Form Parameters**:
  - `file` *(bắt buộc, binary)*: File media cần xử lý.
    - Định dạng video: `.mp4`, `.mkv`, `.webm`, `.mov`, `.avi`.
    - Định dạng audio: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`, `.wma`.
    - Giới hạn kích thước mặc định: `500MB` (cấu hình qua `MAX_UPLOAD_SIZE_MB`).
  - `title` *(tùy chọn, string)*: Tiêu đề bài giảng (dùng đặt tiêu đề tài liệu Markdown).
  - `overwrite` *(tùy chọn, boolean, mặc định: false)*: Cho phép ghi đè kết quả nếu bài giảng đã tồn tại.
  - `model` *(tùy chọn, string)*: Chỉ định model Gemini (mặc định lấy theo cấu hình `.env`).

- **Response thành công**: `202 Accepted`

```json
{
  "job_id": "314e2178a78343febc641da250b0c0d9",
  "status": "QUEUED",
  "message": "Lecture processing job accepted and queued"
}
```

- **Mã lỗi có thể gặp**:
  - `400 Bad Request`: File rỗng (0 bytes), tên file không hợp lệ hoặc đuôi mở rộng không được hỗ trợ.
  - `401 Unauthorized`: Thiếu hoặc sai `X-API-Key`.
  - `413 Request Entity Too Large`: Dung lượng file vượt quá giới hạn cấu hình.
  - `429 Too Many Requests`: Hàng đợi FIFO đang đầy (`MAX_QUEUED_JOBS`).
  - `500 Internal Server Error`: Server chưa cấu hình API Key hoặc lỗi ghi file tạm.

---

### 4.3. GET /api/v1/jobs/{job_id}

Polling theo dõi trạng thái tiến trình xử lý của job.

- **Headers**:
  ```http
  X-API-Key: <AI_SERVICE_API_KEY>
  ```
- **Path Parameters**:
  - `job_id` *(string, UUID)*: Mã định danh duy nhất của job.

- **Các trạng thái `status`**:
  - `QUEUED`: Job đang nằm trong hàng đợi chờ worker xử lý.
  - `RUNNING`: Job đang được xử lý bởi worker thread.
  - `COMPLETED`: Toàn bộ quá trình phiên âm và tóm tắt thành công.
  - `PARTIAL_SUCCESS`: Whisper và Markdown thành công; Gemini gặp sự cố (bảo tồn transcript).
  - `FAILED`: Xử lý thất bại (lỗi giải mã audio hoặc định dạng đầu vào hỏng).

- **Các giai đoạn `current_stage`**:
  - `QUEUED` ➔ `TRANSCRIBING` ➔ `EXPORTING` ➔ `SUMMARIZING` ➔ `COMPLETED` (hoặc `FAILED`).

- **Response `200 OK` (Đang chạy)**:

```json
{
  "job_id": "314e2178a78343febc641da250b0c0d9",
  "status": "RUNNING",
  "current_stage": "TRANSCRIBING",
  "created_at": "2026-10-22T13:17:46.063259+00:00",
  "started_at": "2026-10-22T13:17:47.065123+00:00",
  "finished_at": null,
  "error_message": null
}
```

- **Response `200 OK` (Hoàn thành)**:

```json
{
  "job_id": "314e2178a78343febc641da250b0c0d9",
  "status": "COMPLETED",
  "current_stage": "COMPLETED",
  "created_at": "2026-10-22T13:17:46.063259+00:00",
  "started_at": "2026-10-22T13:17:47.065123+00:00",
  "finished_at": "2026-10-22T13:21:40.125890+00:00",
  "error_message": null
}
```

- **Mã lỗi**:
  - `401 Unauthorized`: Sai hoặc thiếu API key.
  - `404 Not Found`: Không tìm thấy `job_id`.

---

### 4.4. GET /api/v1/jobs/{job_id}/result

Lấy toàn bộ nội dung transcript và summary định dạng Markdown.

- **Headers**:
  ```http
  X-API-Key: <AI_SERVICE_API_KEY>
  ```
- **Path Parameters**:
  - `job_id` *(string, UUID)*: Mã định danh job.

- **Response `200 OK` (Khi `status = COMPLETED`)**:

```json
{
  "job_id": "314e2178a78343febc641da250b0c0d9",
  "status": "COMPLETED",
  "transcript": "# Transcript — Demo Bài Giảng TypeScript\n\n## Thông tin bài giảng\n- Nguồn: test.mp4\n- Ngôn ngữ: vi\n- Thời lượng: 00:10:13\n\n## Transcript theo mốc thời gian\n**[00:00:00.66 → 00:00:04.50]**\nChào mừng các bạn đến với bài học TypeScript...\n",
  "summary": "# Tóm tắt bài học: Demo Bài Giảng TypeScript\n\n## 1. Tổng quan\nBài giảng thực hiện ôn tập các kiến thức cốt lõi về Class trong TypeScript...\n\n## 2. Các kiến thức chính\n### 2.1. Khởi tạo Class và Constructor...\n",
  "metadata": {
    "language": "vi",
    "duration_seconds": 128.45,
    "stage_durations": {
      "transcribing": 115.2,
      "exporting": 0.45,
      "summarizing": 12.8
    },
    "media_duration_seconds": null
  },
  "error_message": null
}
```

- **Response `200 OK` (Khi `status = PARTIAL_SUCCESS`)**:

```json
{
  "job_id": "314e2178a78343febc641da250b0c0d9",
  "status": "PARTIAL_SUCCESS",
  "transcript": "# Transcript — Demo Bài Giảng TypeScript...",
  "summary": null,
  "metadata": {
    "language": "vi",
    "duration_seconds": 115.65,
    "stage_durations": {
      "transcribing": 115.2,
      "exporting": 0.45
    },
    "media_duration_seconds": null
  },
  "error_message": "Dịch vụ Gemini AI tạm thời không khả dụng (503): This model is currently experiencing high demand."
}
```

- **Response `409 Conflict` (Khi job chưa hoàn tất)**:

```json
{
  "detail": {
    "message": "Job is still processing. Please continue polling status endpoint.",
    "job_id": "314e2178a78343febc641da250b0c0d9",
    "status": "RUNNING",
    "current_stage": "TRANSCRIBING"
  }
}
```

- **Mã lỗi**:
  - `401 Unauthorized`: Sai hoặc thiếu API key.
  - `403 Forbidden`: Phát hiện vi phạm an toàn đường dẫn file (path traversal).
  - `404 Not Found`: Không tìm thấy `job_id`.
  - `409 Conflict`: Job đang ở trạng thái `QUEUED` hoặc `RUNNING`.

---

### 4.5. POST /api/v1/jobs/{job_id}/retry-summary

Thực hiện lại bước tóm tắt bằng Gemini khi gặp lỗi quota hoặc sự cố kết nối, **tuyệt đối không chạy lại Whisper** (tiết kiệm 100% thời gian xử lý video và tài nguyên CPU/RAM).

- **Headers**:
  ```http
  X-API-Key: <AI_SERVICE_API_KEY>
  ```
- **Path Parameters**:
  - `job_id` *(string, UUID)*: Mã định danh job cần retry.
- **Form Data (tùy chọn)**:
  - `model` *(string)*: Tên mô hình Gemini mới nếu muốn thay đổi khi retry.

- **Response thành công**: `202 Accepted`

```json
{
  "job_id": "314e2178a78343febc641da250b0c0d9",
  "status": "QUEUED",
  "message": "Summary retry job accepted and queued"
}
```

- **Mã lỗi**:
  - `401 Unauthorized`: Sai hoặc thiếu API key.
  - `404 Not Found`: Không tìm thấy `job_id`.
  - `409 Conflict`:
    - Job đang `QUEUED` hoặc `RUNNING` (không thể retry trùng lặp).
    - Job chưa có file `transcript.md` hợp lệ để tóm tắt.
  - `429 Too Many Requests`: Hàng đợi job đang đầy.

---

## 5. Bảng mã HTTP Status Codes

| Mã HTTP | Tên chuẩn | Ý nghĩa trong hệ thống |
| :---: | :--- | :--- |
| **`200`** | `OK` | Truy vấn trạng thái, sức khỏe hoặc kết quả thành công. |
| **`202`** | `Accepted` | Tiếp nhận upload job hoặc retry-summary vào hàng đợi bất đồng bộ. |
| **`400`** | `Bad Request` | File upload rỗng (0 bytes) hoặc phần mở rộng media không được hỗ trợ. |
| **`401`** | `Unauthorized` | Thiếu hoặc sai giá trị header `X-API-Key`. |
| **`403`** | `Forbidden` | Phát hiện hành vi truy xuất file ngoài thư mục outputs an toàn. |
| **`404`** | `Not Found` | `job_id` không tồn tại trong bộ nhớ hệ thống. |
| **`409`** | `Conflict` | Yêu cầu kết quả khi job còn đang chạy, hoặc retry khi job chưa hoàn tất transcript. |
| **`413`** | `Payload Too Large` | Dung lượng file upload vượt quá `MAX_UPLOAD_SIZE_MB`. |
| **`422`** | `Unprocessable Entity`| Tham số yêu cầu sai cấu trúc hoặc kiểu dữ liệu. |
| **`429`** | `Too Many Requests`| Hàng đợi xử lý FIFO đã đầy `MAX_QUEUED_JOBS`. |
| **`500`** | `Internal Server Error`| Server chưa cấu hình API key hoặc lỗi hệ thống không mong muốn. |
| **`503`** | `Service Unavailable`| Mô hình hoặc dịch vụ phụ thuộc bên ngoài tạm thời quá tải. |

---

## 6. Hướng dẫn tích hợp từ Node.js / Express (Conceptual Client Example)

Dưới đây là mã nguồn minh họa cách Backend Express của TMdemy có thể gọi sang AI Service:

```typescript
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || "your_secret_key";

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    "X-API-Key": AI_SERVICE_API_KEY,
  },
  timeout: 60000,
});

/**
 * 1. Gửi video để tạo Job xử lý
 */
export async function submitLectureJob(filePath: string, lectureTitle: string): Promise<string> {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("title", lectureTitle);
  form.append("overwrite", "true");

  const response = await aiClient.post("/api/v1/jobs", form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data.job_id;
}

/**
 * 2. Polling kiểm tra trạng thái Job
 */
export async function pollJobStatus(jobId: string) {
  const response = await aiClient.get(`/api/v1/jobs/${jobId}`);
  return response.data; // { status, current_stage, finished_at, error_message }
}

/**
 * 3. Lấy kết quả khi Job COMPLETED
 */
export async function getJobResult(jobId: string) {
  const response = await aiClient.get(`/api/v1/jobs/${jobId}/result`);
  return response.data; // { transcript, summary, metadata }
}

/**
 * 4. Yêu cầu retry bước tóm tắt nếu gặp PARTIAL_SUCCESS
 */
export async function retrySummary(jobId: string) {
  const response = await aiClient.post(`/api/v1/jobs/${jobId}/retry-summary`);
  return response.data;
}
```

---

## 7. Các biện pháp bảo vệ dữ liệu & an toàn hệ thống

1. **Chống Path Traversal**: Tên tệp upload và các đường dẫn được chuẩn hóa nghiêm ngặt bằng biểu thức chính quy. Hệ thống từ chối mọi yêu cầu đọc file ngoài thư mục được chỉ định.
2. **Streaming Upload theo chunk**: Không đọc toàn bộ video vào RAM. Server ghi tệp ra đĩa theo từng khối 1MB và ngắt kết nối ngay khi vượt quá ngưỡng dung lượng.
3. **Không rò rỉ thông tin nội bộ**: Tuyệt đối không hiển thị đường dẫn tuyệt đối (`D:\...`, `C:\...`), stack trace nội bộ hay API key trong mã phản hồi HTTP.
4. **Giới hạn số lượng worker**: Chạy đơn luồng xử lý audio để tránh quá tải tài nguyên RAM (chỉ tốn ~300MB RAM trên máy 8GB).
