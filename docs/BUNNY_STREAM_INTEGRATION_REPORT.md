# TMDEMY — HƯỚNG DẪN TÍCH HỢP TẢI VIDEO TRỰC TIẾP QUA BUNNY STREAM (FRONTEND INTEGRATION REPORT)

> **Tài liệu bàn giao kỹ thuật**: Dành riêng cho đội ngũ kỹ sư **Frontend (React / Next.js)** để tích hợp luồng tải video trực tiếp qua giao thức TUS (Resumable Upload) và phát video (Embed / HLS Player) với dịch vụ **Bunny Stream** trên hệ thống TMDEMY.

---

## MỤC LỤC
* [A. Tổng quan kiến trúc tải & phát video (Architecture Overview)](#a-tổng-quan-kiến-trúc)
* [B. Biến môi trường (Environment Variables)](#b-biến-môi-trường)
* [C. Đặc tả toàn bộ API Endpoints (API Documentation)](#c-đặc-tả-toàn-bộ-api-endpoints)
* [D. Hướng dẫn Frontend tải video trực tiếp với `tus-js-client`](#d-hướng-dẫn-frontend-tải-video-trực-tiếp-với-tus-js-client)
* [E. Tích hợp tạo bài học với Bunny Video (`POST /api/lessons`)](#e-tích-hợp-tạo-bài-học-với-bunny-video)
* [F. Tích hợp trình phát video học viên (Video Playback Integration)](#f-tích-hợp-trình-phát-video-học-viên)
* [G. Quản lý trạng thái xử lý Video (Status Management)](#g-quản-lý-trạng-thái-xử-lý-video)
* [H. Xóa Video (Video Deletion & Cleanup)](#h-xóa-video)
* [I. Quy trình tích hợp từng bước cho Frontend (Integration Sequence)](#i-quy-trình-tích-hợp-từng-bước)
* [J. Bảng tổng hợp API (API Summary Table)](#j-bảng-tổng-hợp-api)
* [K. Tính tương thích ngược & Ghi chú Migration (Compatibility Notes)](#k-tính-tương-thích-ngược--migration)

---

## A. TỔNG QUAN KIẾN TRÚC

Hệ thống áp dụng kiến trúc **Direct Client-to-Bunny TUS Upload**. Video kích thước lớn (hàng trăm MB đến hàng GB) **KHÔNG ĐI QUA EXPRESS BACKEND**.

```text
┌─────────────────┐       1. POST /api/videos/upload-signature        ┌──────────────────┐
│                 │ ────────────────────────────────────────────────> │                  │
│                 │ <──────────────────────────────────────────────── │  TMDEMY Backend  │
│                 │   Trả về: videoId, uploadUrl, TUS Signature       │  (Express + DB)  │
│                 │                                                   └──────────────────┘
│ Frontend Client │       2. TUS Chunk Upload (Direct Binary Stream)  ┌──────────────────┐
│ (React / Next)  │ ────────────────────────────────────────────────> │   Bunny Stream   │
│                 │ <──────────────────────────────────────────────── │   Video Storage  │
│                 │   TUS Progress (0% -> 100%), Status: Uploaded     └──────────────────┘
│                 │                                                             │
│                 │       3. POST /api/lessons { bunnyVideoId: "..." }          │
│                 │ ────────────────────────────────────────────────> (Xác thực với Bunny
│                 │ <──────────────────────────────────────────────── & Tạo Lesson DB)
└─────────────────┘
```

### Ưu điểm vượt trội của kiến trúc:
1. **Server Backend không bị nghẽn (Zero Bandwidth Bottleneck)**: Máy chủ Express chỉ làm nhiệm vụ cấp chữ ký xác thực (`upload-signature`) và liên kết metadata trong database.
2. **Khả năng tạm dừng & tiếp tục (Resumable Upload)**: Nếu học viên/giảng viên bị mất mạng giữa chừng, `tus-js-client` tự động tiếp tục tải từ byte đã tải dở mà không phải upload lại từ đầu.
3. **Mã hóa và phát luồng thích ứng (HLS Multi-bitrate Transcoding)**: Bunny Stream tự động chuyển đổi video sang các độ phân giải 360p, 480p, 720p, 1080p và phân phối qua mạng lưới CDN toàn cầu với độ trễ cực thấp.
4. **Bảo mật tuyệt đối**: `BUNNY_API_KEY` chỉ lưu tại Backend. Chữ ký TUS sinh ra chỉ có hiệu lực cho duy nhất video đó trong thời hạn 2 giờ.

---

## B. BIẾN MÔI TRƯỜNG

Các biến môi trường phục vụ Bunny Stream tại backend:

| Tên biến | Phạm vi | Mô tả | Nơi lấy trên Bunny Dashboard |
| :--- | :--- | :--- | :--- |
| `BUNNY_API_KEY` | **Backend Only** | Khóa bí mật API của Video Library | Bunny Dashboard -> *Stream* -> Chọn Library -> *API Access* -> *API Key* |
| `BUNNY_LIBRARY_ID` | **Backend Only** | Mã định danh số của Video Library | Bunny Dashboard -> *Stream* -> Chọn Library -> URL hoặc *API Access* |
| `BUNNY_CDN_HOSTNAME` | Backend / Playback | Hostname phân phối HLS / Thumbnail | Bunny Dashboard -> *Stream* -> Chọn Library -> *Pull Zone* (ví dụ: `vz-xxxx.b-cdn.net`) |
| `BUNNY_TOKEN_SECURITY_KEY` | Backend (Tùy chọn) | Khóa bảo mật ký token nhúng player | Bunny Dashboard -> *Stream* -> Chọn Library -> *Security* -> *Token Authentication* |

> [!CAUTION]
> **Quy tắc an ninh**: Phía Frontend **TUYỆT ĐỐI KHÔNG** khai báo biến môi trường chứa `BUNNY_API_KEY`. Không sử dụng prefix `NEXT_PUBLIC_BUNNY_API_KEY` hay `VITE_BUNNY_API_KEY`.

---

## C. ĐẶC TẢ TOÀN BỘ API ENDPOINTS

Base URL: `http://localhost:3002` (mặc định)

### 1. `POST /api/videos/upload-signature` — Cấp quyền tải video trực tiếp

* **Mục đích**: Khởi tạo video placeholder trên Bunny Stream và cấp chữ ký TUS dùng một lần cho Frontend tải trực tiếp.
* **Quyền hạn**: `TEACHER` (chủ sở hữu khóa học) hoặc `ADMIN`.
* **Headers**:
  ```http
  Authorization: Bearer <TEACHER_ACCESS_TOKEN>
  Content-Type: application/json
  ```
* **Request Body**:
  ```json
  {
    "title": "Bài 1.1: Khởi tạo dự án Next.js 14",
    "courseId": "6c592621-ab02-5b53-b5fd-d7059e144dca",
    "chapterId": "ce118298-1f2b-466f-b9cc-dfcd9777a1dd"
  }
  ```
  *(Trường `chapterId` là tùy chọn)*.
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Khởi tạo upload video thành công. Vui lòng tải trực tiếp lên Bunny CDN qua TUS.",
    "data": {
      "videoId": "605afb94-3652-4274-b8df-0a1c7fbefbc9",
      "libraryId": "781598",
      "uploadUrl": "https://video.bunnycdn.com/tusupload",
      "authorizationSignature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "authorizationExpire": 1776789123,
      "expiresAt": "2026-10-21T14:12:03.000Z"
    }
  }
  ```
* **Error Responses**:
  * `401 Unauthorized`: Token bị thiếu hoặc hết hạn.
  * `403 Forbidden`: Học viên (`USER`) cố tình gọi hoặc Giảng viên tải vào khóa học của giảng viên khác.
  * `404 Not Found`: Khóa học hoặc chương học không tồn tại.

---

### 2. `GET /api/videos/:videoId/status` — Tra cứu tiến độ xử lý video

* **Mục đích**: Kiểm tra video đã tải lên xong chưa và tiến độ encode (0-100%).
* **Quyền hạn**: `TEACHER` (người sở hữu video) hoặc `ADMIN`.
* **Headers**: `Authorization: Bearer <TEACHER_ACCESS_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "videoId": "605afb94-3652-4274-b8df-0a1c7fbefbc9",
      "status": "READY",
      "rawStatus": 4,
      "encodeProgress": 100,
      "duration": 485,
      "hasMP4Fallback": false,
      "thumbnailUrl": "https://vz-c5f190e7-933.b-cdn.net/605afb94-3652-4274-b8df-0a1c7fbefbc9/thumbnail.jpg"
    }
  }
  ```

---

### 3. `DELETE /api/videos/:videoId` — Xóa video khỏi Bunny Stream & Database

* **Mục đích**: Hủy và xóa video asset vĩnh viễn trên Bunny Stream khi giảng viên muốn xóa bài học hoặc upload lại.
* **Quyền hạn**: `TEACHER` (chủ sở hữu) hoặc `ADMIN`.
* **Headers**: `Authorization: Bearer <TEACHER_ACCESS_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Xóa video Bunny thành công"
  }
  ```
* **Ràng buộc an toàn**: Nếu video đang được liên kết trong nhiều hơn 1 bài học, hệ thống sẽ từ chối xóa với lỗi `400 Bad Request` để bảo vệ dữ liệu.

---

### 4. `GET /api/videos/lesson/:lessonId/playback` — Lấy thông tin phát video an toàn

* **Mục đích**: Trả về link Embed Player, link luồng HLS `.m3u8` và ảnh đại diện thumbnail để hiển thị cho học viên.
* **Quyền hạn**:
  * Học viên đã mua / ghi danh khóa học (`ACTIVE` / `COMPLETED`).
  * Hoặc bất kỳ ai nếu bài học được bật cờ học thử (`isDemo: true`).
  * Giảng viên tác giả khóa học hoặc Admin.
* **Headers**: `Authorization: Bearer <USER_ACCESS_TOKEN>`
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "lessonId": "48f10738-4f24-4f81-89e4-c5cb3556ea0b",
      "title": "Bài 1.1: Khởi tạo dự án Next.js 14",
      "slug": "bai-11-khoi-tao-du-an-nextjs-14",
      "isDemo": false,
      "type": "VIDEO",
      "duration": 485,
      "playback": {
        "videoId": "605afb94-3652-4274-b8df-0a1c7fbefbc9",
        "libraryId": "781598",
        "embedUrl": "https://iframe.mediadelivery.net/embed/781598/605afb94-3652-4274-b8df-0a1c7fbefbc9",
        "hlsUrl": "https://vz-c5f190e7-933.b-cdn.net/605afb94-3652-4274-b8df-0a1c7fbefbc9/playlist.m3u8",
        "thumbnailUrl": "https://vz-c5f190e7-933.b-cdn.net/605afb94-3652-4274-b8df-0a1c7fbefbc9/thumbnail.jpg",
        "previewUrl": "https://vz-c5f190e7-933.b-cdn.net/605afb94-3652-4274-b8df-0a1c7fbefbc9/preview.webp",
        "videoStatus": "READY"
      },
      "videoUrl": "https://vz-c5f190e7-933.b-cdn.net/605afb94-3652-4274-b8df-0a1c7fbefbc9/playlist.m3u8"
    }
  }
  ```
* **Error Response (`403 Forbidden`)**:
  ```json
  {
    "success": false,
    "message": "Bạn chưa mua hoặc chưa được cấp quyền xem bài học này"
  }
  ```

---

## D. HƯỚNG DẪN FRONTEND TẢI VIDEO TRỰC TIẾP VỚI `tus-js-client`

### Bước 1: Cài đặt thư viện trên Frontend
```bash
npm install tus-js-client
# hoặc
yarn add tus-js-client
```

### Bước 2: Tạo component React upload video trực tiếp
Dưới đây là mã nguồn TypeScript hoàn chỉnh sẵn sàng copy vào dự án Frontend:

```tsx
import React, { useState } from 'react'
import * as tus from 'tus-js-client'

interface BunnyUploadProps {
  courseId: string
  chapterId: string
  onUploadComplete: (bunnyVideoId: string) => void
}

export const BunnyDirectVideoUploader: React.FC<BunnyUploadProps> = ({
  courseId,
  chapterId,
  onUploadComplete
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [uploadInstance, setUploadInstance] = useState<tus.Upload | null>(null)

  // 1. Xử lý khi người dùng chọn file video từ máy
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setProgress(0)
      setStatusMessage('')
    }
  }

  // 2. Bắt đầu luồng tải video trực tiếp lên Bunny Stream
  const handleStartUpload = async () => {
    if (!file) {
      alert('Vui lòng chọn một file video!')
      return
    }

    try {
      setIsUploading(true)
      setStatusMessage('Đang xin cấp quyền tải video từ Backend...')

      // BƯỚC A: Gọi Backend để tạo video placeholder & lấy TUS credentials
      const token = localStorage.getItem('access_token')
      const authRes = await fetch('http://localhost:3002/api/videos/upload-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          courseId,
          chapterId
        })
      })

      const authData = await authRes.json()

      if (!authRes.ok || !authData.success) {
        throw new Error(authData.message || 'Không thể xin cấp quyền upload video')
      }

      const {
        videoId,
        libraryId,
        uploadUrl,
        authorizationSignature,
        authorizationExpire
      } = authData.data

      setStatusMessage('Đang tải video trực tiếp lên Bunny CDN...')

      // BƯỚC B: Khởi tạo tus-js-client tải trực tiếp lên Bunny TUS Endpoint
      const upload = new tus.Upload(file, {
        endpoint: uploadUrl, // 'https://video.bunnycdn.com/tusupload'
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: authorizationSignature,
          AuthorizationExpire: authorizationExpire.toString(),
          VideoId: videoId,
          LibraryId: libraryId.toString()
        },
        metadata: {
          filetype: file.type,
          title: file.name
        },
        onError: (error) => {
          console.error('Lỗi trong quá trình upload TUS:', error)
          setIsUploading(false)
          setStatusMessage(`Tải lên thất bại: ${error.message}`)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
          setProgress(percentage)
          setStatusMessage(`Đang tải lên: ${percentage}%`)
        },
        onSuccess: () => {
          setIsUploading(false)
          setProgress(100)
          setStatusMessage('Tải video lên thành công! Video đang được encode...')
          // Trả về videoId để Frontend gọi tiếp API tạo bài học
          onUploadComplete(videoId)
        }
      })

      setUploadInstance(upload)

      // Kiểm tra xem có phiên upload nào trước đó để tiếp tục không
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0])
        }
        upload.start()
      })
    } catch (err: any) {
      setIsUploading(false)
      setStatusMessage(err.message || 'Có lỗi xảy ra')
      console.error(err)
    }
  }

  // 3. Cho phép tạm dừng / tiếp tục tải
  const handlePauseResume = () => {
    if (!uploadInstance) return
    if (isUploading) {
      uploadInstance.abort()
      setIsUploading(false)
      setStatusMessage('Đã tạm dừng tải lên')
    } else {
      uploadInstance.start()
      setIsUploading(true)
      setStatusMessage('Đang tiếp tục tải lên...')
    }
  }

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm space-y-4">
      <h3 className="font-semibold text-lg">Tải Video Bài Học (Bunny Stream TUS)</h3>

      <input
        type="file"
        accept="video/mp4,video/x-m4v,video/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="file-input w-full border rounded p-2"
      />

      {file && (
        <div className="text-sm text-gray-600">
          Dung lượng: {(file.size / (1024 * 1024)).toFixed(2)} MB
        </div>
      )}

      {isUploading || progress > 0 ? (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>{statusMessage}</span>
            <span>{progress}%</span>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          onClick={handleStartUpload}
          disabled={!file || (isUploading && progress === 100)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? 'Đang tải lên...' : 'Bắt đầu tải lên'}
        </button>

        {isUploading && (
          <button
            onClick={handlePauseResume}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Tạm dừng
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## E. TÍCH HỢP TẠO BÀI HỌC VỚI BUNNY VIDEO

Sau khi sự kiện `onSuccess` của `tus-js-client` hoàn thành, Frontend nhận được `videoId` (Bunny Video GUID). Tiếp theo, Frontend gọi API tạo bài học thông thường:

* **Endpoint**: `POST /api/lessons`
* **Headers**: `Authorization: Bearer <TEACHER_ACCESS_TOKEN>`
* **Request Body**:
  ```json
  {
    "title": "Bài 1.1: Khởi tạo dự án Next.js 14",
    "course": "6c592621-ab02-5b53-b5fd-d7059e144dca",
    "chapter": "ce118298-1f2b-466f-b9cc-dfcd9777a1dd",
    "type": "video",
    "duration": 485,
    "isDemo": false,
    "content": "Nội dung tóm tắt bài học",
    "bunnyVideoId": "605afb94-3652-4274-b8df-0a1c7fbefbc9"
  }
  ```

### Các trường dữ liệu:
* **Các trường giữ nguyên 100%**: `title`, `course`, `chapter`, `type`, `duration`, `isDemo`, `content`.
* **Trường mới thêm vào**:
  * `bunnyVideoId` *(string)*: GUID của video Bunny đã tải xong ở Bước D.
* **Cơ chế thông minh của Backend**:
  * Nếu Frontend không gửi `duration` (hoặc gửi `0`), Backend **tự động lấy thời lượng video từ Bunny Stream**.
  * Nếu Frontend không gửi `videoUrl`, Backend **tự động sinh link luồng HLS `.m3u8`**.
  * Backend xác thực video thực sự đã hoàn thành tải lên trên Bunny Library (nếu video chưa upload chunk nào, backend sẽ chặn lại với lỗi `400 Bad Request`).

---

## F. TÍCH HỢP TRÌNH PHÁT VIDEO HỌC VIÊN

Khi học viên vào giao diện học tập:

### Cách 1: Sử dụng Bunny Stream Iframe Embed Player (Khuyên dùng - Đầy đủ tính năng nhất)
Bunny Embed Player tự động hỗ trợ điều chỉnh tốc độ xem, chọn độ phân giải (Auto, 360p, 720p, 1080p), bật/tắt phụ đề, và hiển thị thumbnail mượt mà:

```tsx
import React, { useEffect, useState } from 'react'

export const StudentVideoPlayer: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const [playbackData, setPlaybackData] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchPlayback = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const res = await fetch(`http://localhost:3002/api/videos/lesson/${lessonId}/playback`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await res.json()

        if (!res.ok || !result.success) {
          setError(result.message || 'Không thể xem video này')
          return
        }

        setPlaybackData(result.data)
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchPlayback()
  }, [lessonId])

  if (error) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
  }

  if (!playbackData) {
    return <div className="p-4 text-center">Đang tải video...</div>
  }

  const { playback, videoUrl } = playbackData

  // 1. Nếu là video Bunny Stream
  if (playback && playback.embedUrl) {
    return (
      <div className="relative pt-[56.25%] rounded-xl overflow-hidden shadow-lg bg-black">
        <iframe
          src={`${playback.embedUrl}?autoplay=false&preload=true&responsive=true`}
          loading="lazy"
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen={true}
        />
      </div>
    )
  }

  // 2. Dự phòng nếu là video truyền thống Cloudinary / mp4 thông thường
  if (videoUrl) {
    return (
      <div className="rounded-xl overflow-hidden shadow-lg">
        <video src={videoUrl} controls className="w-full h-auto" />
      </div>
    )
  }

  return <div>Bài học này không có video.</div>
}
```

---

## G. QUẢN LÝ TRẠNG THÁI XỬ LÝ VIDEO

Video sau khi tải lên Bunny CDN sẽ chuyển qua các trạng thái:

| Status Code | Tên trạng thái | Ý nghĩa | Hành động của Frontend |
| :---: | :--- | :--- | :--- |
| `0` | `CREATED` | Đã xin cấp phép, chưa tải file | Hiển thị nút "Bắt đầu tải lên" |
| `1` | `UPLOADING` | Đang tải file nhị phân qua TUS | Hiển thị thanh tiến trình `progress %` |
| `2`, `3` | `PROCESSING` | File đã tải xong, đang chuyển mã HLS | Hiển thị nhãn *"Đang xử lý chất lượng video (480p, 720p, 1080p)..."* |
| `4` | `READY` | Xử lý xong hoàn toàn | Cho phép phát video và gán vào bài học |
| `5`, `6` | `FAILED` | Lỗi upload hoặc lỗi chuyển mã | Hiển thị nút *"Thử tải lại"* |

Frontend có thể gọi định kỳ (polling) 3-5 giây/lần tới `GET /api/videos/:videoId/status` để cập nhật tiến độ encode (`encodeProgress: 0-100%`) cho giảng viên xem.

---

## H. XÓA VIDEO

Khi giảng viên muốn xóa bài học hoặc xóa video đã tải lên:
* Gọi: `DELETE /api/videos/:videoId`
* Headers: `Authorization: Bearer <TEACHER_ACCESS_TOKEN>`
* Hệ thống sẽ đồng thời xóa vĩnh viễn video trên Bunny Stream storage để tiết kiệm dung lượng và dọn sạch record trong database.

---

## I. QUY TRÌNH TÍCH HỢP TỪNG BƯỚC CHO FRONTEND

1. **Bước 1**: Cài đặt gói `tus-js-client`.
2. **Bước 2**: Trong modal "Tạo Bài Học Mới", khi người dùng chọn file video:
   - Gọi `POST /api/videos/upload-signature` gửi `{ title, courseId, chapterId }`.
   - Nhận về `videoId`, `uploadUrl`, `authorizationSignature`, `authorizationExpire`.
3. **Bước 3**: Khởi tạo `new tus.Upload()` với các headers và endpoint nhận được, theo dõi `onProgress` để hiển thị thanh phần trăm.
4. **Bước 4**: Khi `onSuccess` được kích hoạt, lấy `videoId` và điền vào form tạo bài học.
5. **Bước 5**: Gọi `POST /api/lessons` với payload kèm `"bunnyVideoId": videoId`.
6. **Bước 6**: Phía người học, hiển thị video qua `GET /api/videos/lesson/:lessonId/playback` và bọc trong thẻ `<iframe>` với `embedUrl`.

---

## J. BẢNG TỔNG HỢP API

| Method | Endpoint URL | Quyền hạn | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/videos/upload-signature` | Teacher (Chủ sở hữu), Admin | Cấp chữ ký xác thực TUS upload trực tiếp |
| `GET` | `/api/videos/:videoId/status` | Teacher (Chủ sở hữu), Admin | Tra cứu tiến độ encode và trạng thái video |
| `DELETE`| `/api/videos/:videoId` | Teacher (Chủ sở hữu), Admin | Xóa video vĩnh viễn khỏi Bunny và Database |
| `GET` | `/api/videos/lesson/:lessonId/playback` | Học viên đã mua, Demo, Giáo viên, Admin | Lấy URL phát video (Embed & HLS .m3u8) |
| `POST` | `/api/videos/webhook` | Bunny Webhook | Lắng nghe thông báo hoàn tất chuyển mã tự động |
| `POST` | `/api/lessons` | Teacher (Chủ sở hữu), Admin | Tạo bài học (hỗ trợ cả Bunny Video và Cloudinary) |

---

## K. TÍNH TƯƠNG THÍCH NGƯỢC & MIGRATION

1. **Khóa học cũ & Video Cloudinary cũ**: Hoạt động bình thường 100%. Nếu bài học không có `bunnyVideoId`, backend vẫn trả về trường `videoUrl` cũ và các player HTML5 cũ vẫn hoạt động mà không bị gián đoạn.
2. **Database Schema**: Các trường `bunnyVideoId` và `videoStatus` trên bảng `lessons` đều ở dạng `Nullable` (`String?`), đảm bảo toàn bộ dữ liệu lịch sử không bị ảnh hưởng.
3. **Zero Downtime**: Quá trình migration đã áp dụng thành công qua Prisma Migration `20261021191500_add_bunny_stream_video_support`.
