# TMdemy Backend — Certificate Implementation Audit

> **Tài liệu**: Báo cáo Kiểm tra Toàn diện Phân hệ Cấp Chứng chỉ (Certificate Implementation Audit)  
> **Dự án**: TMdemy E-Learning Backend (`e-learning_server`)  
> **Mục tiêu**: Đánh giá hiện trạng cơ sở dữ liệu, luồng nghiệp vụ, API, PDF generation, Cloudinary storage, nguyên nhân lỗi và đề xuất kiến trúc hoàn thiện  
> **Thời điểm kiểm tra**: 14/10/2026  
> **Người thực hiện**: AI Senior Backend Architect (Antigravity)  
> **Trạng thái**: AUDIT HOÀN TẤT — CHỜ REVIEW  

---

## 1. Executive Summary & Verification Matrix

Báo cáo này cung cấp cái nhìn thực tế, khách quan và chi tiết về toàn bộ hệ thống cấp chứng chỉ tốt nghiệp khóa học (`Certificate`) của TMdemy Backend. Kiểm tra được thực hiện trực tiếp trên Prisma Schema, Cơ sở dữ liệu PostgreSQL `tmdemy`, mã nguồn Express/TypeScript, tiện ích PDFKit, cấu hình Cloudinary và các bộ test tự động.

### Ma trận Trạng thái Triển khai (Implementation Status Matrix)

| Hạng mục / Chức năng | Trạng thái kỹ thuật | Đánh giá thực tế |
| :--- | :---: | :--- |
| **Prisma Model `Certificate`** | `IMPLEMENTED` | Đã tồn tại bảng `certificates` trong PostgreSQL với quan hệ `User`, `Course`, khóa phụ `@@unique([userId, courseId])`. Thiếu trường số hiệu chứng chỉ (`code`), quan hệ `Enrollment` và trạng thái (`status`). |
| **Functional Repository** | `IMPLEMENTED` | File [certificate.repository.ts](file:///d:/e-learning_server/src/repositories/certificate.repository.ts) đã có các hàm CRUD cơ bản (`createCertificate`, `findCertificateByUserAndCourse`, `findCertificateById`, `findCertificatesByUserId`, `deleteCertificate`). Tuy nhiên 3/5 hàm chưa từng được Service gọi. |
| **Zod Application Domain Model** | `IMPLEMENTED` | File [certificate.model.ts](file:///d:/e-learning_server/src/models/certificate.model.ts) định nghĩa Zod schema và DTO, nhưng chưa được tích hợp vào Runtime Validation tại Service/Controller. |
| **Tạo Chứng chỉ (`POST /api/certificates`)** | `IMPLEMENTED` | Đã gắn route, middleware xác thực UUID, controller và service thẩm định điều kiện cơ bản. |
| **Truy vấn Chứng chỉ của tôi (`GET /api/certificates/my`)** | `NOT IMPLEMENTED` | Backend **chưa có endpoint này**. Học viên đổi trình duyệt / xóa cache sẽ mất quyền truy cập link PDF chứng chỉ. |
| **Truy vấn Chứng chỉ theo Khóa học (`GET .../course/:id`)** | `NOT IMPLEMENTED` | Backend **chưa có endpoint này**. Không có cách nào tra cứu chứng chỉ đã cấp cho 1 khóa học cụ thể. |
| **Truy vấn Chi tiết Chứng chỉ (`GET /api/certificates/:id`)** | `NOT IMPLEMENTED` | Backend **chưa có endpoint này**. |
| **Xác thực Chứng chỉ Công khai (`GET .../verify/:id`)** | `NOT IMPLEMENTED` | Backend **chưa có endpoint này**. |
| **API Kiểm tra Sơ bộ Điều kiện Cấp (`GET .../eligibility/:id`)** | `NOT IMPLEMENTED` | Backend **chưa có endpoint này**. Frontend phải tự ước lượng sơ bộ. |
| **Tạo PDF bằng PDFKit** | `PARTIALLY IMPLEMENTED` | Sinh được buffer PDF cơ bản nhưng thiết kế cực kỳ sơ sài, in mã UUID thô thay vì tên người/khóa học, **không hỗ trợ Unicode tiếng Việt** (dùng font Helvetica mặc định). |
| **Tích hợp Upload Cloudinary** | `PARTIALLY IMPLEMENTED` | Upload stream hoạt động nhưng bị lỗi nhân đôi thư mục (`certificates/certificates/`), fallback URL sai tên Cloud name (`tmdemy` thay vì `dxostp23y`), dùng `resource_type: raw` gây khó khăn cho việc preview/thumbnail. |
| **Xử lý Đua tranh & Trùng lặp (Concurrency)** | `IMPLEMENTED` | Chặn trùng qua `@@unique([userId, courseId])` và bắt mã lỗi Prisma `P2002`. Tuy nhiên bị leak orphan upload PDF lên Cloudinary khi xảy ra race condition. |
| **Cơ chế Khôi phục Chứng chỉ đã cấp** | `NOT IMPLEMENTED` | Khi gọi lại POST cho khóa học đã cấp chứng chỉ, backend trả về lỗi `400` nhưng **không trả lại thông tin/URL chứng chỉ cũ**, khiến học viên hoàn toàn bế tắc. |

---

## 2. Database Schema & Relations

### 2.1. Prisma Model `Certificate` (Thực tế tại `prisma/schema.prisma`)

```prisma
model Certificate {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  courseId       String   @map("course_id") @db.Uuid
  grade          Decimal  @db.Decimal(5, 2)
  certificateUrl String   @map("certificate_url") @db.Text
  issuedAt       DateTime @default(now()) @map("issued_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user   User   @relation(fields: [userId], references: [id], onDelete: Restrict)
  course Course @relation(fields: [courseId], references: [id], onDelete: Restrict)

  @@unique([userId, courseId])
  @@map("certificates")
}
```

### 2.2. Phân tích Quan hệ Vật lý và Dữ liệu Liên quan

```mermaid
erDiagram
    User ||--o{ Certificate : "has many (onDelete: Restrict)"
    Course ||--o{ Certificate : "has many (onDelete: Restrict)"
    User ||--o{ Enrollment : "enrolls"
    Course ||--o{ Enrollment : "contains"
    Course ||--o{ Chapter : "has"
    Chapter ||--o{ Lesson : "has"
    Course ||--o{ Quiz : "evaluates"
    User ||--o{ QuizSubmission : "submits"
    Quiz ||--o{ QuizSubmission : "graded by"
    User ||--o{ Progress : "tracks"
```

1. **Quan hệ trực tiếp**:
   - `user`: Khóa ngoại `userId` tham chiếu `User.id` (`onDelete: Restrict` — Bảo vệ pháp lý, không cho phép xóa user khi đã có chứng chỉ). Lưu ý: `User` model có cột `username`, `email`, `avatar` (không có cột `name`).
   - `course`: Khóa ngoại `courseId` tham chiếu `Course.id` (`onDelete: Restrict` — Không cho phép xóa khóa học khi đã cấp chứng chỉ). Lưu ý: `Course` có cột `title`, `authorId`, và quan hệ `author: User`.
2. **Quan hệ gián tiếp (Không có Foreign Key ở mức DB)**:
   - **Enrollment**: Không có trường `enrollmentId`. Logic kiểm tra ghi danh thực hiện qua truy vấn `findEnrollmentByUserAndCourse(userId, courseId)`.
   - **Progress**: Không có liên kết khóa ngoại. Tính trạng thái bài học qua bảng `enrollments.progress` hoặc bảng `progress`.
   - **Quiz & QuizSubmission**: Không có liên kết khóa ngoại. Service phải tự join hoặc query độc lập `quiz` qua `courseId`, rồi query `quiz_submissions` theo `userId` và `quizId in (...)`.
3. **Dữ liệu thực tế đang tồn tại trong PostgreSQL (`tmdemy`)**:
   - Hiện có chính xác **2 chứng chỉ** trong cơ sở dữ liệu:
     1. Chứng chỉ `38efecdf-2f66-4c6d-bbca-5cc7f3d36625`: User `thaiminh`, Khóa học `TailwindCSS Masterclass`, Điểm `100.00`, Cấp ngày 04/10/2026.
     2. Chứng chỉ `700155f8-c123-5929-b7d2-55a8c825f084`: User `Thái Quang Minh`, Khóa học `ReactJS Advanced - Update 2025`, Điểm `83.33`, Cấp ngày 15/10/2025 (dữ liệu migrate từ MongoDB).

---

## 3. PDFKit Implementation Audit

Toàn bộ logic tạo file PDF nằm tại [src/utils/pdfGenerator.ts](file:///d:/e-learning_server/src/utils/pdfGenerator.ts).

### 3.1. Mã nguồn hiện tại

```typescript
export const generateCertificatePDF = async (
  arg1: { userId: string; courseId: string; grade: number } | string,
  arg2?: string,
  arg3?: number
): Promise<string> => {
  const { userId, courseId, grade } =
    typeof arg1 === 'object'
      ? arg1
      : { userId: arg1, courseId: arg2 as string, grade: arg3 as number }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers)
      // Upload Cloudinary stream...
    })

    // Thêm nội dung vào chứng chỉ PDF
    doc.fontSize(20).text('Certificate of Completion', { align: 'center' })
    doc.fontSize(14).text(`This certifies that`, { align: 'center' })
    doc.fontSize(16).text(`User ID: ${userId} has completed the course ${courseId}`, { align: 'center' })
    doc.fontSize(12).text(`Grade: ${grade}%`, { align: 'center' })
    doc.text('Date of Issue: ' + new Date().toLocaleDateString(), { align: 'center' })

    doc.end()
  })
}
```

### 3.2. Đánh giá Chi tiết & Các Điểm Yếu Chí Mạng

1. **Vấn đề Nội dung (Content Defect)**:
   - Dòng 62 in trực tiếp: `User ID: ${userId} has completed the course ${courseId}`.
   - **Hậu quả**: Thay vì in tên học viên "Nguyễn Văn A" và tên khóa học "Lập trình ReactJS Chuyên sâu", tài liệu PDF in ra chuỗi UUID dài ngoằng:  
     `User ID: 02e8e13a-dab2-5fb6-a14f-933ac125edca has completed the course 2d535d8f-0ac6-50a3-b86c-30fc54eeab8a`.
   - Hàm `generateCertificatePDF` chỉ nhận `{ userId, courseId, grade }`, hoàn toàn không nhận `studentName`, `courseTitle`, `instructorName`, `certificateCode`.
2. **Vấn đề Font chữ & Unicode Tiếng Việt (Unicode/Font Failure)**:
   - PDFKit mặc định chỉ hỗ trợ 14 font PostScript chuẩn (Helvetica, Times-Roman, Courier). Các font này sử dụng bảng mã `WinAnsiEncoding`.
   - **Hậu quả**: Không thể hiển thị tiếng Việt có dấu. Nếu đưa chuỗi Unicode như *"Chứng chỉ Tốt nghiệp"*, *"Thái Quang Minh"* hoặc *"Khóa học Lập trình"*, PDFKit sẽ phát sinh ngoại lệ runtime `Error: Character cannot be encoded in WinAnsiEncoding` hoặc biến ký tự thành dấu `?` / ký tự vô nghĩa.
   - Mã nguồn **hoàn toàn chưa đăng ký font Unicode bên ngoài** (như Arial, Roboto, Noto Sans TTF).
3. **Vấn đề Thiết kế & Layout (Design & Aesthetics)**:
   - File PDF được tạo theo khổ dọc mặc định (Portrait A4), trong khi chuẩn mực chứng chỉ quốc tế luôn là khổ ngang (Landscape A4).
   - Không có khung viền hoa văn (border), không có watermark, không có logo TMdemy, không có con dấu, không có chữ ký của giảng viên/giám đốc đào tạo, không có mã số chứng chỉ (Certificate Serial Code).
   - Toàn bộ tài liệu chỉ là 5 dòng text đen trắng nằm trơ trọi giữa trang giấy trắng.
4. **Vấn đề Quản lý Bộ nhớ (Buffer Handling)**:
   - Việc gom `doc.on('data', buffers.push.bind(buffers))` và `Buffer.concat(buffers)` trong RAM là giải pháp an toàn, không ghi file rác xuống đĩa cứng server. Đây là điểm xử lý tốt duy nhất của file này.

---

## 4. Cloudinary Integration Audit

### 4.1. Cấu hình Môi trường

- Cấu hình trong [src/utils/pdfGenerator.ts](file:///d:/e-learning_server/src/utils/pdfGenerator.ts):
  ```typescript
  cloudinary.v2.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  })
  ```
- Biến môi trường thực tế tại `.env`:
  ```env
  CLOUDINARY_URL=cloudinary://116242874491284:mQhK02-LzSgJ5ct4Iv0Egw0FeSA@dxostp23y
  ```
  *(Cloud name thực tế: `dxostp23y`)*.

### 4.2. Phân tích Upload Stream & Thông số

```typescript
const params = {
  resource_type: 'raw' as const,
  public_id: `certificates/certificate_${userId}_${courseId}`,
  folder: 'certificates',
  format: 'pdf',
  body: pdfBuffer,
  content_type: 'application/pdf'
}
```

### 4.3. Các Lỗi Nghiêm trọng Phát hiện

1. **Lỗi Nhân đôi Thư mục (Duplicated Folder Path Bug)**:
   - Do truyền cả `folder: 'certificates'` VÀ `public_id: 'certificates/certificate_...'`.
   - Cloudinary tự động nối `folder` vào trước `public_id`, tạo ra đường dẫn:  
     `certificates/certificates/certificate_<userId>_<courseId>.pdf`.
   - Minh chứng từ Database PostgreSQL thực tế:
     `https://res.cloudinary.com/dxostp23y/raw/upload/v1791119576/certificates/certificates/certificate_02e8e13a-dab2-5fb6-a14f-933ac125edca_2d535d8f-0ac6-50a3-b86c-30fc54eeab8a.pdf`.
2. **Lỗi Tham số Thừa (`body: pdfBuffer`)**:
   - `cloudinary.v2.uploader.upload_stream(params, callback)` nhận tham số cấu hình upload trong `params`. Thuộc tính `body` không có trong Cloudinary SDK options và bị bỏ qua, dữ liệu thực tế được truyền qua `.end(pdfBuffer)`.
3. **Vấn đề `resource_type: 'raw'`**:
   - Khi upload PDF với `resource_type: 'raw'`, Cloudinary coi file là binary nhị phân thuần túy.
   - Trình duyệt khi bấm vào link raw thường tự động tải về (Download Attachment) thay vì xem trực tiếp trên tab mới.
   - Đặc biệt: `raw` **không hỗ trợ sinh ảnh thumbnail trang 1**. Nếu frontend muốn hiển thị ảnh xem trước tấm bằng chứng chỉ trên thẻ Card, Cloudinary từ chối chuyển đổi sang JPG/PNG (tính năng chỉ có khi upload với `resource_type: 'image'` format 'pdf').
4. **Lỗi Sai Tên Cloud Name khi Fallback (Fallback URL Defect)**:
   - Trong `pdfGenerator.ts` dòng 53:
     `resolve('https://res.cloudinary.com/tmdemy/raw/upload/certificates/certificate_${userId}_${courseId}.pdf')`
   - Trong `certificate.service.ts` dòng 99:
     `certificateUrl = 'https://res.cloudinary.com/tmdemy/raw/upload/certificates/certificate_${userId}_${courseId}.pdf'`
   - **Hậu quả**: Hardcode cloud name là `tmdemy`. Trong khi cloud name thật là `dxostp23y`. Nếu upload Cloudinary gặp sự cố mạng hoặc chạy offline, URL fallback lưu vào database sẽ trỏ về một Cloudinary tenant không có thật (`res.cloudinary.com/tmdemy/...`) -> Gây lỗi HTTP 404 Not Found vĩnh viễn khi người dùng truy cập.

---

## 5. Phân tích Business Rules Cấp Chứng chỉ

Toàn bộ logic đánh giá nằm trong [src/services/certificate.service.ts](file:///d:/e-learning_server/src/services/certificate.service.ts):

### 5.1. Bảng Đối chiếu 7 Điều kiện Nghiệp vụ

| STT | Quy tắc nghiệp vụ | Mã kiểm tra trong Service | Đánh giá & Rủi ro logic |
| :---: | :--- | :--- | :--- |
| **1** | **Xác thực Ghi danh (Enrollment)** | `findEnrollmentByUserAndCourse(userId, courseId)` | Chỉ kiểm tra tồn tại bản ghi. **Không kiểm tra `status !== 'CANCELED'`**. Học viên đã bị hủy ghi danh vẫn có thể được cấp chứng chỉ nếu bản ghi chưa bị xóa vật lý. |
| **2** | **Chống Cấp trùng (Anti-Duplicate)** | `findCertificateByUserAndCourse(userId, courseId)` | Kiểm tra tốt. Có hỗ trợ bẫy lỗi P2002 ở tầng cơ sở dữ liệu. |
| **3** | **Tiến độ Học tập >= 70%** | `if (enrollment.progress < 70) return 400` | Đúng yêu cầu. |
| **4** | **Khóa học Phải có Quiz** | `quizzes = await findQuizzesByCourseIdWithPublicQuestions(courseId); if (!quizzes \|\| quizzes.length === 0) return 400` | **BUG LOGIC**: Các khóa học thuần video/bài giảng không có bài test sẽ bị kẹt vĩnh viễn không thể cấp chứng chỉ (`"No quizzes found for this course!"`). |
| **5** | **Học viên Phải có Lịch sử Nộp bài** | `quizSubmissions = await prisma.quizSubmission.findMany(...); if (!quizSubmissions.length) return 400` | Bắt buộc phải có bài thi nộp. |
| **6** | **Tỷ lệ Nộp bài Quiz >= 60%** | `quizCompletionPercentage = (totalQuizzes / totalQuizzesAvailable) * 100; if (quizCompletionPercentage < 60) return 400` | **BUG LOGIC**: Đếm bất kỳ bài nộp nào (`totalQuizzes++`) kể cả học viên làm 0 điểm, không kiểm tra điều kiện vượt qua bài thi (`passingGrade`). |
| **7** | **Điểm Tổng kết >= 50%** | `finalScore = Number(((progress + quizCompletionPercentage) / 2).toFixed(2)); if (finalScore < 50) return 400` | **BUG NGHIÊM TRỌNG**: Điểm tốt nghiệp (`finalScore`) bị tính sai bản chất. |

### 5.2. Lỗ hổng Nghiêm trọng trong Công thức Tính Điểm Tốt nghiệp

Hãy xem kỹ các dòng 62–84 trong `certificate.service.ts`:
```typescript
let totalQuizMaxScore = 0
let totalQuizScore = 0
let totalQuizzes = 0
const totalQuizzesAvailable = quizzes.length

for (const quiz of quizzes) {
  const submission = quizSubmissions.find((s) => s.quizId === quiz.id)
  if (submission) {
    totalQuizMaxScore += quiz.questions ? quiz.questions.length : 0
    totalQuizScore += submission.score
    totalQuizzes++
  }
}

const quizCompletionPercentage =
  totalQuizzesAvailable > 0 ? (totalQuizzes / totalQuizzesAvailable) * 100 : 0

if (quizCompletionPercentage < 60) {
  return { success: false, statusCode: 400, message: 'Quiz submission percentage is less than 60%' }
}

const finalScore = Number(((progress + quizCompletionPercentage) / 2).toFixed(2))
```

**Phân tích sự cố**:
- Biến `totalQuizScore` và `totalQuizMaxScore` được cộng dồn ở dòng 70–71, nhưng **hoàn toàn không được sử dụng ở bất kỳ phép tính nào phía sau**!
- Công thức: `finalScore = (progress + quizCompletionPercentage) / 2`.
- Trong đó `quizCompletionPercentage` chỉ là tỷ lệ số lượng bài thi đã nộp chia cho tổng số bài thi hiện có (ví dụ: có 2 bài thi, nộp cả 2 -> 100%).
- **Hệ quả thực tế**: Một học viên hoàn thành 100% bài học (`progress = 100`) và nộp cả 2 bài thi nhưng **đều đạt 0 điểm**, thì `quizCompletionPercentage = 100%`. Điểm tốt nghiệp của học viên này vẫn ra:
  $$\text{finalScore} = \frac{100 + 100}{2} = 100.00\%$$
- Điểm in trên bằng chứng chỉ là **100 điểm tuyệt đối**, bất chấp kết quả học viên làm bài thi trắc nghiệm đúng hay sai!

---

## 6. Danh mục API Hiện có & So sánh Hợp đồng

### 6.1. Endpoint Duy nhất Hiện có: `POST /api/certificates`

- **Endpoint**: `POST /api/certificates`
- **Headers**: `Authorization: Bearer <JWT_ACCESS_TOKEN>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "courseId": "2d535d8f-0ac6-50a3-b86c-30fc54eeab8a"
  }
  ```
- **Validation**: [src/middlewares/certificate.middleware.ts](file:///d:/e-learning_server/src/middlewares/certificate.middleware.ts) kiểm tra `courseId` không rỗng và đúng chuẩn UUID v4.
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "message": "Certificate created successfully",
    "data": {
      "id": "38efecdf-2f66-4c6d-bbca-5cc7f3d36625",
      "_id": "38efecdf-2f66-4c6d-bbca-5cc7f3d36625",
      "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
      "courseId": "2d535d8f-0ac6-50a3-b86c-30fc54eeab8a",
      "certificateUrl": "https://res.cloudinary.com/dxostp23y/raw/upload/v1791119576/certificates/certificates/certificate_02e8e13a-dab2-5fb6-a14f-933ac125edca_2d535d8f-0ac6-50a3-b86c-30fc54eeab8a.pdf",
      "grade": 100,
      "issuedAt": "2026-10-04T13:12:53.312Z",
      "createdAt": "2026-10-04T13:12:53.314Z",
      "updatedAt": "2026-10-04T13:12:53.314Z"
    }
  }
  ```
- **Error Responses thực tế**:
  - `400 Bad Request`: `"Invalid courseId"` (Validation fail).
  - `400 Bad Request`: `"You already have a certificate for this course!"` (Đã cấp trước đó).
  - `400 Bad Request`: `"Progress is less than 70%"` (Chưa học đủ bài).
  - `400 Bad Request`: `"No quizzes found for this course!"` (Khóa học không có quiz).
  - `400 Bad Request`: `"No quiz submissions found for this user!"` (Chưa làm quiz).
  - `400 Bad Request`: `"Quiz submission percentage is less than 60%"` (Chưa nộp đủ 60% số quiz).
  - `400 Bad Request`: `"Total score is less than 50%"` (Điểm tổng kết < 50).
  - `404 Not Found`: `"You are not enrolled in this course!"` (Chưa mua/chưa ghi danh).

### 6.2. Các Endpoint Còn Thiếu Hoàn Toàn (Missing Backend APIs)

```text
[MISSING] GET /api/certificates/my                 -> Lấy danh sách chứng chỉ của học viên đăng nhập
[MISSING] GET /api/certificates/course/:courseId   -> Lấy chứng chỉ theo khóa học cụ thể
[MISSING] GET /api/certificates/:id                -> Lấy chi tiết chứng chỉ kèm populate User & Course
[MISSING] GET /api/certificates/verify/:id         -> Trang tra cứu/xác thực chứng chỉ công khai
[MISSING] GET /api/certificates/eligibility/:id    -> Thẩm định điều kiện tốt nghiệp trước khi ấn cấp
```

---

## 7. Transaction, Concurrency, Authorization & Khôi phục Chứng chỉ

### 7.1. Concurrency & Leakage
- **Tích cực**: Prisma unique constraint `@@unique([userId, courseId])` kết hợp try/catch bẫy mã lỗi `P2002` ngăn chặn triệt để tình trạng tạo 2 bản ghi chứng chỉ trùng lặp trong cơ sở dữ liệu khi học viên click đúp hoặc có race condition.
- **Tiêu cực**: Quá trình tạo PDF và upload Cloudinary (`generateCertificatePDF`) được thực hiện **trước** khi ghi vào PostgreSQL (`createCertificate`). Nếu 2 request đồng thời vượt qua bước kiểm tra trùng lặp ban đầu, server sẽ tốn tài nguyên upload 2 file PDF lên Cloudinary, sau đó 1 request bị `P2002` từ chối, bỏ lại file PDF rác trên Cloudinary.

### 7.2. Transaction Management
- `createCertificateService` hoàn toàn **không sử dụng Prisma Transaction (`prisma.$transaction`)**.
- Không có sự phối hợp nguyên tử giữa việc cấp chứng chỉ và việc đồng bộ trạng thái ghi danh (`Enrollment.status = COMPLETED`, `Enrollment.completedAt = now()`).

### 7.3. Authorization & Privacy
- Route `/api/certificates` được bảo vệ bởi middleware `verifyAccessToken`. `userId` được trích xuất an toàn từ payload của JWT Token (`req.user.userId`), ngăn chặn việc học viên giả mạo danh tính để xin chứng chỉ cho tài khoản khác.
- Tuy nhiên, do chưa có các API xem/tải chứng chỉ, việc phân quyền truy cập chi tiết chứng chỉ giữa Student, Teacher và Admin chưa được thiết lập.

### 7.4. Khả năng Khôi phục Chứng chỉ Đã cấp (Disaster Recovery Failure)
Đây là **nguyên nhân lớn nhất khiến tính năng này tê liệt trên giao diện người dùng**:
1. Học viên A hoàn thành khóa học và ấn "Nhận chứng chỉ".
2. Backend sinh chứng chỉ và trả về URL Cloudinary trong response của lệnh `POST /api/certificates`.
3. Nếu học viên tắt trình duyệt, chuyển máy tính, đăng xuất, xóa cache trình duyệt, hoặc bị mất kết nối mạng ngay thời điểm response trả về:
   - Học viên không thể biết được `certificateUrl` của mình là gì vì **không có API `GET /api/certificates/my`**.
   - Nếu học viên bấm lại nút "Nhận chứng chỉ" trên giao diện, Backend trả về:  
     `400 Bad Request: "You already have a certificate for this course!"`.
   - Trong response 400 này, Backend **không hề đính kèm dữ liệu chứng chỉ cũ**.
   - Kết quả: Học viên **mất vĩnh viễn** khả năng xem lại hoặc tải file PDF chứng chỉ của chính mình!

---

## 8. Trạng thái Kiểm thử (Testing Status)

### 8.1. Kiểm thử Tích hợp Backend (Backend Test Suite)

Trong file [scripts/test_phase7_suite.ts](file:///d:/e-learning_server/scripts/test_phase7_suite.ts) (Section 2, Lines 253–342):
- **Test 8 (Unenrolled)**: Trả về `404` -> **PASS**.
- **Test 9 (Progress < 70%)**: Trả về `400` -> **PASS**.
- **Test 10 (No quizzes)**: Trả về `400` -> **PASS**.
- **Test 11 (No quiz submissions)**: Trả về `400` -> **PASS**.
- **Test 12 (Quiz completion < 60%)**: Trả về `400` -> **PASS**.
- **Test 13 (Eligible user gets certificate)**: Cấp chứng chỉ thành công, điểm số serialize thành Number -> **PASS**.
- **Test 14 (Duplicate request)**: Bị từ chối với lỗi duplicate -> **PASS**.

### 8.2. Đánh giá Khách quan về Kết quả Test
- Bộ test `test_phase7_suite.ts` chỉ kiểm chứng được luồng từ chối lỗi cơ bản và việc ghi dữ liệu vào bảng `certificates`.
- Bộ test **không kiểm tra tính đúng đắn của file PDF**, không kiểm tra font chữ Unicode, không kiểm tra nội dung text trong PDF, và không kiểm tra kịch bản học viên truy xuất lại chứng chỉ sau khi đã cấp.

---

## 9. Tổng hợp Nguyên nhân Khiến Chức năng Chưa Hoàn thiện

Qua kiểm tra chuyên sâu, nguyên nhân chức năng cấp chứng chỉ trước đây chưa hoạt động đúng hoặc chưa hoàn thiện xuất phát từ 8 yếu tố cốt lõi:

1. **Thiếu hoàn toàn nhóm API Truy vấn (Read-side APIs)**:
   - Hệ thống mới chỉ có duy nhất 1 mutation `POST /api/certificates`. Thiếu `GET /api/certificates/my`, thiếu `GET /api/certificates/course/:id`, khiến Frontend buộc phải dựa vào LocalStorage tạm bợ để lưu link chứng chỉ.
2. **PDF Generator mang tính chất placeholder/thử nghiệm**:
   - `pdfGenerator.ts` chỉ in 5 dòng text đơn giản, in raw UUID (`userId`, `courseId`) thay vì tên người và tên khóa học.
   - Chưa tích hợp bất kỳ font Unicode nào, khiến việc in tiếng Việt bị lỗi hoặc crash.
3. **Lỗi Nhân đôi Thư mục Cloudinary**:
   - Khai báo sai cấu hình khiến Cloudinary tạo thư mục `certificates/certificates/`.
4. **Hardcode Fallback Cloud Name**:
   - Cố định tên cloud `tmdemy` trong code thay vì đọc biến môi trường `dxostp23y`.
5. **Sai lệch Công thức Tính Điểm Tốt nghiệp**:
   - Công thức `(progress + quizCompletionPercentage) / 2` bỏ qua hoàn toàn điểm số thực tế của học viên trong các bài quiz.
   - Khóa học không có quiz bị chặn cấp chứng chỉ vĩnh viễn.
6. **Không có Khả năng Khôi phục khi Gửi lại Request**:
   - Khi đã có chứng chỉ, request tiếp theo chỉ báo lỗi `400` mà không trả lại chứng chỉ hiện có.
7. **Hạn chế của Schema Vật lý**:
   - Bảng `certificates` không có mã chứng chỉ dạng định danh thân thiện (`code`: ví dụ `TMDEMY-2026-XXXX`).
   - Thiếu các trường metadata quan trọng (tên khóa học, tên học viên tại thời điểm cấp, tên giảng viên) để phòng trường hợp user/course bị đổi tên trong tương lai.
8. **Chưa có Đồng bộ Trạng thái Khóa học**:
   - Khi cấp chứng chỉ, hệ thống không tự động cập nhật `Enrollment.status = COMPLETED` và không bắn thông báo chúc mừng (`Notification`).

---

## 10. Đề xuất Kiến trúc Hoàn thiện (Proposed Target Architecture)

Để Frontend TMdemy có thể hiển thị chứng chỉ hoàn chỉnh với đầy đủ thông tin: **Học viên, Khóa học, Giảng viên, Kết quả, Ngày cấp, Mã chứng chỉ (Certificate Number) và PDF URL có thể xem/tải trực tiếp**, kiến trúc Backend cần được nâng cấp toàn diện theo các đề xuất kỹ thuật dưới đây.

### 10.1. Mở rộng Prisma Schema (Khi được phê duyệt Migration)

Bổ sung các trường cần thiết vào `prisma/schema.prisma` để bảo đảm tính toàn vẹn pháp lý lâu dài của bằng cấp:

```prisma
model Certificate {
  id             String   @id @default(uuid()) @db.Uuid
  code           String   @unique @db.VarChar(50) // Ví dụ: TMDEMY-CERT-2026-8921
  userId         String   @map("user_id") @db.Uuid
  courseId       String   @map("course_id") @db.Uuid
  enrollmentId   String?  @map("enrollment_id") @db.Uuid
  grade          Decimal  @db.Decimal(5, 2)
  certificateUrl String   @map("certificate_url") @db.Text
  issuedAt       DateTime @default(now()) @map("issued_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user       User        @relation(fields: [userId], references: [id], onDelete: Restrict)
  course     Course      @relation(fields: [courseId], references: [id], onDelete: Restrict)
  enrollment Enrollment? @relation(fields: [enrollmentId], references: [id], onDelete: SetNull)

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
  @@map("certificates")
}
```

> *Ghi chú tuân thủ quy tắc*: Đây là đề xuất kiến trúc cho giai đoạn nâng cấp tiếp theo, hiện tại tuyệt đối không tự ý sửa đổi file `prisma/schema.prisma`.

### 10.2. Bổ sung Bộ API Hoàn thiện cho Frontend

```text
Router: /api/certificates
  ├── POST   /                  -> Yêu cầu cấp chứng chỉ (Idempotent: Nếu đã có, trả lại 200 kèm chứng chỉ cũ)
  ├── GET    /my                -> Lấy danh sách tất cả chứng chỉ của tôi (Populate Course, Author)
  ├── GET    /course/:courseId  -> Lấy chứng chỉ của tôi cho một khóa học cụ thể
  ├── GET    /eligibility/:courseId -> Kiểm tra chi tiết 5 tiêu chí đủ điều kiện cấp (cho UI hiển thị)
  └── GET    /verify/:codeOrId  -> Xác thực chứng chỉ công khai (Không cần đăng nhập)
```

#### Dữ liệu Response Chuẩn hóa (Certificate DTO Schema):
```json
{
  "success": true,
  "data": {
    "id": "38efecdf-2f66-4c6d-bbca-5cc7f3d36625",
    "code": "TMDEMY-2026-8921",
    "grade": 85.5,
    "certificateUrl": "https://res.cloudinary.com/dxostp23y/image/upload/certificates/certificate_uuid.pdf",
    "previewImageUrl": "https://res.cloudinary.com/dxostp23y/image/upload/certificates/certificate_uuid.jpg",
    "issuedAt": "2026-10-14T10:00:00.000Z",
    "student": {
      "id": "user-uuid",
      "username": "Thái Quang Minh",
      "email": "thaiminh@example.com",
      "avatar": "https://..."
    },
    "course": {
      "id": "course-uuid",
      "title": "ReactJS Advanced - Update 2026",
      "slug": "reactjs-advanced-2026",
      "image": "https://..."
    },
    "instructor": {
      "id": "author-uuid",
      "username": "ThS. Hoàng Quốc Bảo"
    }
  }
}
```

### 10.3. Nâng cấp Tiện ích PDFKit (`pdfGenerator.ts`)

1. **Đăng ký Font Unicode Tiếng Việt**:
   - Sử dụng `doc.registerFont('Roboto-Regular', fontPath)` và `doc.registerFont('Roboto-Bold', boldFontPath)`.
   - Đảm bảo 100% hiển thị hoàn hảo dấu tiếng Việt cho tên học viên và tên khóa học.
2. **Thiết kế Khổ ngang Chuẩn Quốc tế (Landscape A4)**:
   - `new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 })`.
   - Bổ sung khung viền đôi tinh tế (Double border viền vàng/tím hoàng gia).
   - Thêm Logo TMdemy góc trên, Quốc hiệu/Tên chứng chỉ trang trọng ở giữa.
   - Thêm chữ ký số mô phỏng và con dấu xác thực của TMdemy.
   - Thêm mã định danh chứng chỉ và mã QR dẫn về link xác thực trực tuyến.
3. **Chuẩn hóa Upload Cloudinary**:
   - Sử dụng `resource_type: 'image'` với đuôi `.pdf` để Cloudinary vừa lưu trữ file PDF, vừa hỗ trợ xuất thumbnail tự động `.jpg` cho Frontend Card.
   - Bỏ `folder: 'certificates'` để tránh lỗi lặp đường dẫn `certificates/certificates/`.
   - Đọc động tên Cloud name từ `process.env` khi fallback.

### 10.4. Chuẩn hóa Logic Nghiệp vụ & Idempotency

1. **Cơ chế Idempotent (Khôi phục tự động)**:
   - Trong `createCertificateService`, nếu `findCertificateByUserAndCourse` đã tìm thấy chứng chỉ:
     Thay vì ném lỗi `400 Bad Request`, hãy trả về `200 OK` với thông báo:  
     `"Certificate already issued. Returning existing certificate"` kèm dữ liệu đầy đủ của chứng chỉ.
   - Giúp Frontend không bao giờ bị kẹt và luôn lấy lại được bằng cấp của học viên.
2. **Sửa Công thức Tính Điểm Tốt nghiệp**:
   - Nếu khóa học không có quiz: Điểm tốt nghiệp lấy theo `progress` (100%).
   - Nếu khóa học có quiz:
     $$\text{quizAverageScore} = \frac{\sum \text{submission.score}}{\sum \text{quiz.totalPoints}} \times 100$$
     $$\text{finalScore} = (\text{progress} \times 0.4) + (\text{quizAverageScore} \times 0.6)$$
     Đảm bảo phản ánh chính xác kết quả học tập và nỗ lực của học viên.

---

## 11. Kết luận & Khuyến nghị Tiếp theo

### Trạng thái Tuân thủ Giới hạn Yêu cầu
- ✅ Toàn bộ quá trình kiểm tra chỉ thực hiện **READ, INSPECT, ANALYZE và REPORT**.
- ✅ **Không sửa đổi source code**, không sửa Prisma Schema, không cài đặt package, không sửa Frontend.
- ✅ Phân định minh bạch trạng thái: `IMPLEMENTED`, `PARTIALLY IMPLEMENTED`, `NOT IMPLEMENTED` và `NOT VERIFIED`.

### Khuyến nghị Hành động
1. Chủ dự án xem xét và nghiệm thu báo cáo audit này tại `docs/progress/CERTIFICATE_BACKEND_AUDIT.md`.
2. Sau khi được phê duyệt, lập kế hoạch triển khai Phase hoàn thiện Certificate Backend theo đúng lộ trình và nguyên tắc kiểm soát của dự án.

---
> **BÁO CÁO HOÀN TẤT. DỪNG LẠI VÀ CHỜ PHÊ DUYỆT CỦA PROJECT OWNER.**
