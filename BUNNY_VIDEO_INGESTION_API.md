# TMDEMY AI MICROSERVICE — BUNNY VIDEO INGESTION & IDEMPOTENCY API SPECIFICATION

Tài liệu đặc tả kỹ thuật chi tiết dành cho phân hệ **Secure Bunny Stream Video Ingestion, Multi-Format Media Processing & FastAPI Job Idempotency** (Step 6.6B) trong hệ thống TMdemy AI Microservice.

* **Base URL (Development)**: `http://127.0.0.1:8000`
* **Xác thực**: Header `X-API-Key: <AI_SERVICE_API_KEY>` bắt buộc trên mọi API jobs.
* **Cơ chế chống lặp (Idempotency)**: Hỗ trợ Header `Idempotency-Key` hoặc trường body `idempotencyKey` / `idempotency_key`.

---

## 1. TỔNG QUAN ENDPOINTS

| Phương thức | Đường dẫn | Header chính | Trạng thái HTTP | Mục đích |
| :---: | :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/jobs/from-media-source` | `X-API-Key`, `Idempotency-Key` (tùy chọn) | `202 Accepted` / `200 OK` | Tiếp nhận URL video/audio bảo mật từ Bunny Stream hoặc CDN tin cậy. |
| `POST` | `/api/v1/jobs/from-bunny` | `X-API-Key`, `Idempotency-Key` (tùy chọn) | `202 Accepted` / `200 OK` | **Alias** tiện ích cho endpoint `/from-media-source`. |
| `GET` | `/api/v1/jobs/{job_id}` | `X-API-Key` | `200 OK` | Polling theo dõi trạng thái và tiến độ từng giai đoạn của job. |
| `GET` | `/api/v1/jobs/{job_id}/result` | `X-API-Key` | `200 OK` / `409 Conflict` | Nhận kết quả toàn diện (`transcript`, `summary`, metadata). |

---

## 2. CHI TIẾT ENDPOINT: NẠP MEDIA TỪ XA

### `POST /api/v1/jobs/from-media-source` (hoặc `/api/v1/jobs/from-bunny`)

Tạo mới một job xử lý bài giảng từ URL bảo mật (Bunny Stream / Direct CDN), hỗ trợ Idempotency chống lặp job phân tán.

#### 2.1. Request Headers

| Header | Kiểu | Bắt buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| `X-API-Key` | string | **Có** | Khóa xác thực dịch vụ nội bộ (khớp với cấu hình `.env`). |
| `Idempotency-Key` | string | Không | Mã định danh duy nhất (UUID v4) phía client chống duplicate job khi retry mạng. Ưu tiên cao hơn trường body. |
| `Content-Type` | string | **Có** | `application/json` |

#### 2.2. Request Body Schema (`RemoteMediaJobRequest`)

Hỗ trợ đồng thời cả định dạng **camelCase** (chuẩn Node.js/TypeScript) và **snake_case** (chuẩn Python):

| Trường | Kiểu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `mediaUrl` / `media_url` | string | *(bắt buộc)* | URL HTTPS dẫn tới tệp video hoặc audio. Phải thuộc danh sách host cho phép (`BUNNY_ALLOWED_HOSTS`). |
| `sourceType` / `source_type` | string | `"bunny_stream"` | Phân loại nguồn (`"bunny_stream"` hoặc `"direct_url"`). |
| `idempotencyKey` / `idempotency_key` | string | `null` | Khóa chống lặp (fallback nếu không truyền qua Header). |
| `title` | string | `null` | Tiêu đề bài giảng (dùng đặt tiêu đề artifact transcript & summary). |
| `lessonId` / `lesson_id` | string | `null` | Mã bài học trong PostgreSQL để đối soát correlation. |
| `sourceGeneration` / `source_generation` | integer | `null` | Thế hệ AI generation của bài học để chống ghi đè stale job. |
| `sourceVideoId` / `source_video_id` | string | `null` | Mã video trên Bunny Stream (`video_id`). |
| `model` | string | `null` | Chỉ định mô hình Gemini tóm tắt (ví dụ `gemini-3.5-flash`). |

#### 2.3. Request Example

```http
POST /api/v1/jobs/from-media-source HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json
X-API-Key: test_secret_api_key
Idempotency-Key: e1a3f5b7-89c2-4f3b-9a4d-1e2f3a4b5c6d

{
  "mediaUrl": "https://vz-72e819b5-c04.b-cdn.net/5f1c2b3a-4e5d-6f7a-8b9c-0d1e2f3a4b5c/original.mp4",
  "sourceType": "bunny_stream",
  "title": "Chương 3: Cấu trúc Dữ liệu Cây Nhị phân",
  "lessonId": "cm123abc456def789",
  "sourceGeneration": 1,
  "sourceVideoId": "5f1c2b3a-4e5d-6f7a-8b9c-0d1e2f3a4b5c",
  "model": "gemini-3.5-flash"
}
```

#### 2.4. Response Scenarios

##### Trường hợp 1: Tạo mới thành công (`202 Accepted`)
Lần đầu gửi request với key mới, job được đưa vào hàng đợi FIFO.

```json
{
  "job_id": "a8f10e42c3d548b886d997230113fa08",
  "status": "QUEUED",
  "message": "Media processing job accepted and queued",
  "is_replay": false,
  "idempotency_key": "e1a3f5b7-89c2-4f3b-9a4d-1e2f3a4b5c6d"
}
```

##### Trường hợp 2: Replay trùng lặp an toàn (`200 OK`)
Gửi lại request với cùng `Idempotency-Key` và cùng nội dung payload (ví dụ do client retry vì timeout). Hệ thống nhận diện được bản ghi đã đăng ký, **KHÔNG** tạo thêm job thứ hai trong hàng đợi FIFO:

```json
{
  "job_id": "a8f10e42c3d548b886d997230113fa08",
  "status": "QUEUED",
  "message": "Idempotent replay: Job đã tồn tại và đang được xử lý hoặc đã hoàn thành",
  "is_replay": true,
  "idempotency_key": "e1a3f5b7-89c2-4f3b-9a4d-1e2f3a4b5c6d"
}
```

##### Trường hợp 3: Xung đột nội dung Idempotency (`409 Conflict`)
Cùng một `Idempotency-Key` nhưng mang `mediaUrl` hoặc payload khác:

```json
{
  "detail": "Idempotency-Key 'e1a3f5b7-89c2-4f3b-9a4d-1e2f3a4b5c6d' đã được sử dụng với nội dung payload khác."
}
```

##### Trường hợp 4: Vi phạm kiểm tra SSRF (`400 Bad Request`)
URL không thuộc HTTPS, hoặc thuộc tên miền không được cấp phép, hoặc phân giải về IP nội bộ / link-local / loopback:

```json
{
  "detail": "Tên miền 'attacker-domain.com' không nằm trong danh sách máy chủ Bunny/CDN được tin cậy."
}
```

##### Trường hợp 5: Hàng đợi FIFO quá tải (`429 Too Many Requests`)
Số lượng job đang chờ trong hàng đợi vượt quá `MAX_QUEUED_JOBS`:

```json
{
  "detail": "Hàng đợi xử lý đã đầy dung lượng tối đa. Vui lòng thử lại sau."
}
```

---

## 3. VÒNG ĐỜI VÀ TIẾN ĐỘ XỬ LÝ JOB (QUEUE LIFECYCLE)

Khi job được tiếp nhận, Worker đơn luồng thực thi theo trình tự các giai đoạn (`current_stage`):

```text
       ┌──────────────┐
       │    QUEUED    │
       └──────┬───────┘
              │ (Worker bắt đầu xử lý)
              ▼
   ┌──────────────────────┐
   │  DOWNLOADING_MEDIA   │ ➔ Bounded chunked streaming (64KB chunks), đĩa tạm temp_media/{job_id}
   └──────────┬───────────┘
              │ (Tải xong, không lưu RAM)
              ▼
   ┌──────────────────────┐
   │   VALIDATING_MEDIA   │ ➔ PyAV probe: container, thời lượng, luồng âm thanh, giải mã frame đầu
   └──────────┬───────────┘
              │ (Có luồng audio hợp lệ)
              ▼
   ┌──────────────────────┐
   │   EXTRACTING_AUDIO   │ ➔ FFmpeg trích xuất 16kHz Mono PCM WAV, xóa ngay video gốc
   └──────────┬───────────┘
              │ (Âm thanh chuẩn hóa sẵn sàng)
              ▼
   ┌──────────────────────┐
   │     TRANSCRIBING     │ ➔ Faster-Whisper CPU INT8 tạo transcript bài giảng
   └──────────┬───────────┘
              │ (Gỡ băng xong)
              ▼
   ┌──────────────────────┐
   │     SUMMARIZING      │ ➔ Google Gemini AI tạo bản tóm tắt sư phạm 6 phần
   └──────────┬───────────┘
              │
              ▼
       ┌──────────────┐
       │  COMPLETED   │ ➔ Dọn sạch temp_media/{job_id}, lưu trữ transcript.md & summary.md
       └──────────────┘
```

---

## 4. POLLING VÀ LẤY KẾT QUẢ

### 4.1. Polling trạng thái: `GET /api/v1/jobs/{job_id}`

#### Request
```http
GET /api/v1/jobs/a8f10e42c3d548b886d997230113fa08 HTTP/1.1
Host: 127.0.0.1:8000
X-API-Key: test_secret_api_key
```

#### Response (`JobStatusResponse`)
```json
{
  "job_id": "a8f10e42c3d548b886d997230113fa08",
  "status": "RUNNING",
  "current_stage": "EXTRACTING_AUDIO",
  "created_at": "2026-10-25T12:00:00.000000+00:00",
  "started_at": "2026-10-25T12:00:02.150000+00:00",
  "finished_at": null,
  "error_message": null,
  "idempotency_key": "e1a3f5b7-89c2-4f3b-9a4d-1e2f3a4b5c6d"
}
```

### 4.2. Lấy kết quả hoàn chỉnh: `GET /api/v1/jobs/{job_id}/result`

Chỉ trả về khi `status` là `COMPLETED` hoặc `PARTIAL_SUCCESS`. Nếu job đang ở `QUEUED` hoặc `RUNNING`, endpoint trả về `409 Conflict`.

#### Response (`JobResultResponse`)
```json
{
  "job_id": "a8f10e42c3d548b886d997230113fa08",
  "status": "COMPLETED",
  "transcript": "# BÀI GIẢNG: CẤU TRÚC DỮ LIỆU CÂY NHỊ PHÂN\n\n[00:00:00.00 --> 00:00:05.12] Chào mừng các bạn đến với buổi học hôm nay...",
  "summary": "# TỔNG QUAN BÀI GIẢNG\n\n## 1. Các kiến thức chính...",
  "quiz": null,
  "coding_exercise": null,
  "metadata": {
    "language": "vi",
    "duration_seconds": 45.2,
    "stage_durations": {
      "downloading_media": 3.12,
      "validating_media": 0.45,
      "extracting_audio": 1.25,
      "transcribing": 25.10,
      "exporting": 0.05,
      "summarizing": 15.23
    },
    "media_duration_seconds": 180.5
  },
  "error_message": null
}
```

---

## 5. MÔ HÌNH BẢO MẬT PHÒNG THỦ SSRF & TÀI NGUYÊN

1. **Bắt buộc HTTPS**: Toàn bộ yêu cầu nạp từ xa sử dụng `http://` hoặc các scheme khác (`ftp://`, `file://`) đều bị chặn tại lớp thẩm định đầu vào.
2. **Host Allowlist**: Chỉ các máy chủ thuộc `BUNNY_ALLOWED_HOSTS` (mặc định: `*.b-cdn.net`, `video.bunnycdn.com`, `*.bunnycdn.com`) được chấp nhận.
3. **Phân giải DNS & Chặn IP**:
   - Chặn IP Loopback (`127.0.0.0/8`, `::1`).
   - Chặn IP mạng nội bộ Private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`).
   - Chặn Cloud Metadata & Link-Local IP (`169.254.169.254`, `169.254.0.0/16`, `fe80::/10`).
   - Chặn IP Multicast, Reserved và Unspecified.
4. **Kiểm tra Redirect Nghiêm ngặt**: Giới hạn tối đa 3 lần chuyển hướng HTTP (301, 302, 307, 308). Trên mỗi bước chuyển hướng, URL đích đều phải trải qua kiểm tra allowlist và phân giải IP chống DNS Rebinding.
5. **Streaming Chunked Bounded**: Tải theo khối 64KB trực tiếp ra đĩa cứng tạm thời; nếu vượt quá `MEDIA_MAX_DOWNLOAD_BYTES` (1GB), kết nối lập tức bị ngắt và tệp tạm bị xóa ngay để bảo vệ dung lượng đĩa và RAM 8GB.
6. **Che giấu Thông tin Nhạy cảm**: URL chứa query token/credentials đều được cắt lọc trước khi ghi log. Thông điệp lỗi trả về người dùng được làm sạch để không làm lộ đường dẫn nội bộ máy chủ.

---

## 6. MÃ MẪU CLIENT NODE.JS CHO BƯỚC 6.6C

Dưới đây là đoạn mã TypeScript mẫu mà Node.js Backend có thể tích hợp để nạp video Bunny Stream sang AI Microservice:

```typescript
import axios from "axios";
import { randomUUID } from "crypto";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || "your_shared_key";

export interface RemoteMediaJobPayload {
  mediaUrl: string;
  sourceType?: "bunny_stream" | "direct_url";
  lessonId?: string;
  sourceGeneration?: number;
  sourceVideoId?: string;
  title?: string;
  model?: string;
}

export async function submitBunnyMediaJob(
  payload: RemoteMediaJobPayload,
  existingIdempotencyKey?: string
) {
  const idempotencyKey = existingIdempotencyKey || randomUUID();

  const response = await axios.post(
    `${AI_SERVICE_URL}/api/v1/jobs/from-media-source`,
    payload,
    {
      headers: {
        "X-API-Key": AI_SERVICE_API_KEY,
        "Idempotency-Key": idempotencyKey,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  return {
    jobId: response.data.job_id,
    status: response.data.status,
    isReplay: response.data.is_replay,
    idempotencyKey: response.data.idempotency_key,
  };
}
```
