# TMDEMY E-LEARNING BACKEND — API TESTING GUIDE
## Sổ Tay Hướng Dẫn Kiểm Thử Toàn Diện API (Phases 1 – 7)

**Dự án:** TMDEMY E-Learning Backend  
**Môi trường:** Node.js + Express.js + PostgreSQL 16 (Prisma ORM 6.4.1) + MongoDB Dual-Stack  
**Phiên bản tài liệu:** 1.0 (Bao phủ toàn diện từ Phase 1 đến Phase 7)  
**Tệp tài liệu:** `docs/migration/API_TESTING_GUIDE.md`

---

## A. THIẾT LẬP MÔI TRƯỜNG & CHUẨN BỊ (GENERAL SETUP)

### 1. Cấu hình Cơ sở (Base URL & Server Port)
* **Base URL mặc định**: `http://localhost:3002/api`
* **Server Port**: `3002` (khai báo trong `.env`: `PORT=3002`)
* **Khởi động Server**:
  ```bash
  npm run dev
  ```
* **Kiểm tra kết nối Database**:
  * PostgreSQL: `npx prisma studio` (mặc định cổng `5555`)
  * PostgreSQL Connection: `postgresql://postgres:postgres@localhost:5432/tmdemy?schema=public`

### 2. Thiết lập Biến môi trường trên Postman / Thunder Client
Khuyến nghị tạo một Environment riêng tên `TMDEMY_LOCAL` với các variables:

| Variable Name | Giá trị mẫu / Định dạng | Mô tả |
| :--- | :--- | :--- |
| `BASE_URL` | `http://localhost:3002/api` | Đường dẫn gốc API |
| `ACCESS_TOKEN` | `eyJhbGciOiJIUzI1Ni...` | Bearer Token của người dùng hiện hành |
| `USER_TOKEN` | `eyJhbGciOiJIUzI1Ni...` | Token của học viên (`role: "user"`) |
| `TEACHER_TOKEN` | `eyJhbGciOiJIUzI1Ni...` | Token của giảng viên (`role: "teacher"`) |
| `ADMIN_TOKEN` | `eyJhbGciOiJIUzI1Ni...` | Token của quản trị viên (`role: "admin"`) |
| `COURSE_UUID` | `f0dde7bb-1bf6-5602-a489-cd324132c68a` | UUID khóa học ReactJS Advanced |
| `LESSON_UUID` | `1b2e6643-0006-5e9a-a9f7-3d3078b83262` | UUID bài học Giới thiệu ReactJS |
| `QUIZ_UUID` | `69c3a379-3ba0-59db-9bca-c73bc70fe7a4` | UUID bài kiểm tra Quiz |
| `ORDER_UUID` | `88e0e401-1925-42ce-8cf9-8455702fea3c` | UUID đơn hàng mẫu |

### 3. Nguyên tắc Xác thực (Authentication & Authorization)
* Tất cả request yêu cầu đăng nhập phải gửi header:
  ```http
  Authorization: Bearer {{ACCESS_TOKEN}}
  ```
* Hệ thống phân quyền chặt chẽ dựa trên 3 Role:
  1. `user` (Học viên): Quyền học, ghi danh, nộp bài, xem tiến độ, yêu thích, đánh giá.
  2. `teacher` (Giảng viên): Quyền tạo khóa học, soạn giáo trình, tạo đề thi, quản lý đánh giá khóa học mình dạy.
  3. `admin` (Quản trị viên): Toàn quyền duyệt khóa học, quản lý danh mục, hệ thống đơn hàng, mã giảm giá và người dùng.

---

## B. BẢNG TỔNG HỢP ENDPOINTS (API SUMMARY: PHASES 1 – 7)

| Phase | Module | Method | Endpoint URL | Authentication | Phân quyền (Role) |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **Phase 2** | Auth / User | `POST` | `/api/users/register` | Public | None |
| **Phase 2** | Auth / User | `POST` | `/api/users/login` | Public | None |
| **Phase 2** | Auth / User | `POST` | `/api/users/refresh-token` | Public | None (Yêu cầu `refresh_token`) |
| **Phase 2** | Auth / User | `GET` | `/api/users/profile` | Bearer Token | `user`, `teacher`, `admin` |
| **Phase 2** | Auth / User | `PUT` | `/api/users/profile` | Bearer Token | `user`, `teacher`, `admin` |
| **Phase 2** | Category | `GET` | `/api/categories` | Public | None |
| **Phase 2** | Category | `GET` | `/api/categories/:id` | Public | None |
| **Phase 2** | Category | `POST` | `/api/categories` | Bearer Token | `admin` |
| **Phase 2** | Category | `PUT` | `/api/categories/:id` | Bearer Token | `admin` |
| **Phase 2** | Category | `DELETE` | `/api/categories/:id` | Bearer Token | `admin` |
| **Phase 3** | Course | `GET` | `/api/courses` | Public | None (Hỗ trợ query filter) |
| **Phase 3** | Course | `GET` | `/api/courses/:id` | Public | None |
| **Phase 3** | Course | `POST` | `/api/courses` | Bearer Token | `teacher`, `admin` |
| **Phase 3** | Course | `PUT` | `/api/courses/:id` | Bearer Token | `teacher` (Author), `admin` |
| **Phase 3** | Chapter | `POST` | `/api/chapters` | Bearer Token | `teacher`, `admin` |
| **Phase 3** | Chapter | `PUT` | `/api/chapters/:id` | Bearer Token | `teacher`, `admin` |
| **Phase 3** | Chapter | `DELETE` | `/api/chapters/:id` | Bearer Token | `teacher`, `admin` |
| **Phase 3** | Lesson | `POST` | `/api/lessons` | Bearer Token | `teacher`, `admin` |
| **Phase 3** | Lesson | `GET` | `/api/lessons/:id` | Bearer Token | `user` (Enrolled), `teacher`, `admin` |
| **Phase 3** | Lesson | `PUT` | `/api/lessons/:id` | Bearer Token | `teacher`, `admin` |
| **Phase 3** | Lesson | `DELETE` | `/api/lessons/:id` | Bearer Token | `teacher`, `admin` |
| **Phase 4** | Quiz | `POST` | `/api/quiz` | Bearer Token | `teacher`, `admin` |
| **Phase 4** | Quiz | `GET` | `/api/quiz/:id` | Bearer Token | Enrolled user (Public view) / Teacher |
| **Phase 4** | Quiz | `PUT` | `/api/quiz/:id` | Bearer Token | `teacher` (Author), `admin` |
| **Phase 4** | Question | `POST` | `/api/questions` | Bearer Token | `teacher`, `admin` |
| **Phase 4** | Question | `PUT` | `/api/questions/:id` | Bearer Token | `teacher`, `admin` |
| **Phase 4** | Question | `DELETE` | `/api/questions/:id` | Bearer Token | `teacher`, `admin` |
| **Phase 5** | Quiz Submission | `POST` | `/api/submissions` | Bearer Token | `user` (Enrolled) |
| **Phase 5** | Quiz Submission | `GET` | `/api/submissions/:quizId` | Bearer Token | `user` (Xem kết quả bản thân) |
| **Phase 5** | Quiz Submission | `GET` | `/api/submissions/teacher/:quizId` | Bearer Token | `teacher` (Author), `admin` |
| **Phase 6** | Order | `POST` | `/api/orders` | Bearer Token | `user` |
| **Phase 6** | Order | `GET` | `/api/orders/user` | Bearer Token | `user` |
| **Phase 6** | Order | `GET` | `/api/orders/manage` | Bearer Token | `admin` |
| **Phase 6** | Order | `GET` | `/api/orders/:id` | Bearer Token | Owner / `admin` |
| **Phase 6** | Order | `PUT` | `/api/orders/:id/status` | Bearer Token | `admin` |
| **Phase 6** | Coupon | `POST` | `/api/coupons` | Bearer Token | `admin` |
| **Phase 6** | Coupon | `GET` | `/api/coupons` | Bearer Token | `admin` |
| **Phase 6** | Coupon | `POST` | `/api/coupons/apply` | Bearer Token | `user` |
| **Phase 6** | Enrollment | `GET` | `/api/enrollments/my-courses` | Bearer Token | `user` |
| **Phase 6** | Enrollment | `GET` | `/api/enrollments/course/:courseId`| Bearer Token | `teacher` (Author), `admin` |
| **Phase 7** | Progress | `POST` | `/api/progress/complete` | Bearer Token | `user` (Enrolled) |
| **Phase 7** | Progress | `POST` | `/api/progress/uncomplete` | Bearer Token | `user` (Enrolled) |
| **Phase 7** | Progress | `GET` | `/api/progress/:courseId` | Bearer Token | `user` (Enrolled) |
| **Phase 7** | Certificate | `POST` | `/api/certificates` | Bearer Token | `user` (Enrolled & Đủ điều kiện) |
| **Phase 7** | Favorite | `POST` | `/api/favorites/:id` | Bearer Token | `user` |
| **Phase 7** | Favorite | `DELETE` | `/api/favorites/:id` | Bearer Token | `user` |
| **Phase 7** | Favorite | `GET` | `/api/favorites` | Bearer Token | `user` |
| **Phase 7** | Rating | `POST` | `/api/ratings` | Bearer Token | `user` (Enrolled) |
| **Phase 7** | Rating | `GET` | `/api/ratings/course/:id` | Public | None |
| **Phase 7** | Rating | `GET` | `/api/ratings/manage` | Bearer Token | `teacher`, `admin` |
| **Phase 7** | Rating | `PUT` | `/api/ratings/manage/:id` | Bearer Token | `teacher` (Own courses), `admin` |
| **Phase 7** | Rating | `DELETE` | `/api/ratings/manage/:id` | Bearer Token | `teacher` (Own courses), `admin` |

---

## C. HƯỚNG DẪN KIỂM THỬ CHI TIẾT TỪNG API (DETAILED SPECIFICATIONS)

---

### PHÂN HỆ 1: AUTHENTICATION & USER MANAGEMENT

#### 1. Đăng ký tài khoản (Register)
* **Endpoint**: `POST {{BASE_URL}}/users/register`
* **Auth**: Không yêu cầu
* **Body (JSON)**:
  ```json
  {
    "username": "student_test_2026",
    "email": "student_test_2026@gmail.com",
    "password": "Password123@",
    "role": "user"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "c55de839-f059-519c-8820-b16aa17fb9c3",
      "_id": "c55de839-f059-519c-8820-b16aa17fb9c3",
      "email": "student_test_2026@gmail.com",
      "username": "student_test_2026",
      "role": "user"
    }
  }
  ```
* **Common Errors**: `400 Bad Request` (Email already exists / Password too weak).

#### 2. Đăng nhập hệ thống (Login)
* **Endpoint**: `POST {{BASE_URL}}/users/login`
* **Auth**: Không yêu cầu
* **Body (JSON)**:
  ```json
  {
    "email": "thaiminh061204@gmail.com",
    "password": "Password123@"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successfully",
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "eyJhbGciOiJIUzI1Ni...",
    "data": {
      "id": "c55de839-f059-519c-8820-b16aa17fb9c3",
      "email": "thaiminh061204@gmail.com",
      "role": "user"
    }
  }
  ```

---

### PHÂN HỆ 2: COURSE & LESSON MANAGEMENT

#### 3. Lấy danh sách khóa học công khai (List Courses)
* **Endpoint**: `GET {{BASE_URL}}/courses?page=1&limit=10&type=PAID`
* **Auth**: Không yêu cầu
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "courses": [
        {
          "id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "_id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "title": "ReactJS Advanced - Update 2025",
          "slug": "reactjs-advanced-update-2025",
          "price": 199000,
          "status": "approved"
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 8, "totalPages": 1 }
    }
  }
  ```

#### 4. Xem chi tiết bài học (Get Lesson Detail)
* **Endpoint**: `GET {{BASE_URL}}/lessons/{{LESSON_UUID}}`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
      "title": "Giới thiệu về ReactJS",
      "videoUrl": "https://video.tmdemy.com/react-intro.mp4",
      "isDemo": false
    }
  }
  ```
* **Common Errors**: `403 Forbidden` (Chưa ghi danh khóa học đối với bài học không phải demo).

---

### PHÂN HỆ 3: ORDER, COUPON & ENROLLMENT (PHASE 6)

#### 5. Tạo đơn hàng mua khóa học (Create Order)
* **Endpoint**: `POST {{BASE_URL}}/orders`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "courseId": "{{COURSE_UUID}}",
    "couponCode": "GIAM50"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Order created successfully",
    "data": {
      "id": "88e0e401-1925-42ce-8cf9-8455702fea3c",
      "total": 99500,
      "status": "pending"
    }
  }
  ```
* **Purchase Eligibility Rejections (Sửa lỗi Phase 6)**:
  * Khóa học bị xóa mềm: `400 Bad Request` — `{"message": "Course is deleted or no longer available"}`
  * Khóa học chưa duyệt: `400 Bad Request` — `{"message": "Course is pending approval and cannot be ordered"}`
  * Tự mua khóa học của chính mình: `400 Bad Request` — `{"message": "Cannot purchase your own course"}`

#### 6. Xem danh sách khóa học đã đăng ký (My Enrolled Courses)
* **Endpoint**: `GET {{BASE_URL}}/enrollments/my-courses`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "8e6c5171-23d5-51dd-99b5-634769d84364",
        "progress": 50,
        "status": "active",
        "course": {
          "id": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
          "title": "ReactJS Advanced - Update 2025"
        }
      }
    ]
  }
  ```

---

### PHÂN HỆ 4: PROGRESS, CERTIFICATE, FAVORITE & RATING (PHASE 7)

#### 7. Đánh dấu hoàn thành bài học (Complete Lesson)
* **Endpoint**: `POST {{BASE_URL}}/progress/complete`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lesson marked as completed",
    "data": {
      "progress": 75
    }
  }
  ```
* **Common Errors**:
  * `403 Forbidden`: `{"message": "You are not enrolled in this course"}`
  * `404 Not Found`: `{"message": "Lesson not found in this course"}`

#### 8. Hủy đánh dấu hoàn thành bài học (Uncomplete Lesson)
* **Endpoint**: `POST {{BASE_URL}}/progress/uncomplete`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lesson unmarked as completed",
    "data": {
      "progress": 50
    }
  }
  ```

#### 9. Lấy tiến độ toàn bộ khóa học (Get Course Progress)
* **Endpoint**: `GET {{BASE_URL}}/progress/f0dde7bb-1bf6-5602-a489-cd324132c68a`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched course progress successfully",
    "data": {
      "totalLessons": 4,
      "completedLessons": 3,
      "percent": 75,
      "lessons": [
        {
          "_id": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
          "id": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
          "title": "Giới thiệu về ReactJS",
          "order": 1,
          "completed": true
        }
      ]
    }
  }
  ```

#### 10. Yêu cầu cấp Chứng chỉ (Create Certificate)
* **Endpoint**: `POST {{BASE_URL}}/certificates`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Certificate created successfully",
    "data": {
      "id": "700155f8-c123-5929-b7d2-55a8c825f084",
      "_id": "700155f8-c123-5929-b7d2-55a8c825f084",
      "userId": "c55de839-f059-519c-8820-b16aa17fb9c3",
      "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
      "grade": 83.33,
      "certificateUrl": "https://res.cloudinary.com/dxostp23y/raw/upload/certificates/certificate_c55de839_f0dde7bb.pdf",
      "issuedAt": "2025-10-15T16:37:41.083Z"
    }
  }
  ```
* **Validation Rejections**:
  * Chưa ghi danh: `404 Not Found` — `{"message": "You are not enrolled in this course!"}`
  * Đã có chứng chỉ: `400 Bad Request` — `{"message": "You already have a certificate for this course!"}`
  * Tiến độ < 70%: `400 Bad Request` — `{"message": "Progress is less than 70%"}`
  * Bài làm quiz < 60%: `400 Bad Request` — `{"message": "Quiz submission percentage is less than 60%"}`
  * Điểm tổng < 50%: `400 Bad Request` — `{"message": "Total score is less than 50%"}`

#### 11. Thêm khóa học vào Yêu thích (Add Favorite)
* **Endpoint**: `POST {{BASE_URL}}/favorites/2d535d8f-0ac6-50a3-b86c-30fc54eeab8a`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Course added to favorites",
    "data": {
      "id": "dbcb848a-f990-5b0c-a4f1-d36a7353fed6",
      "_id": "dbcb848a-f990-5b0c-a4f1-d36a7353fed6",
      "courseId": "2d535d8f-0ac6-50a3-b86c-30fc54eeab8a"
    }
  }
  ```
* **Common Errors**: `400 Bad Request` — `{"message": "Course already in favorites"}`.

#### 12. Xóa khỏi Yêu thích (Remove Favorite)
* **Endpoint**: `DELETE {{BASE_URL}}/favorites/2d535d8f-0ac6-50a3-b86c-30fc54eeab8a`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Course removed from favorites"
  }
  ```

#### 13. Xem danh sách khóa học Yêu thích (Get Favorites)
* **Endpoint**: `GET {{BASE_URL}}/favorites?page=1&limit=10`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched favorites successfully",
    "data": {
      "favorites": [
        {
          "id": "dbcb848a-f990-5b0c-a4f1-d36a7353fed6",
          "course": {
            "id": "2d535d8f-0ac6-50a3-b86c-30fc54eeab8a",
            "title": "TailwindCSS Masterclass",
            "price": 0
          }
        }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
    }
  }
  ```

#### 14. Đánh giá khóa học (Create Rating)
* **Endpoint**: `POST {{BASE_URL}}/ratings`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "rate": 5,
    "content": "Khóa học rất chi tiết và giảng viên hướng dẫn nhiệt tình!"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Rating created successfully",
    "data": {
      "id": "71139688-328f-5582-97ac-b5ea2696166b",
      "_id": "71139688-328f-5582-97ac-b5ea2696166b",
      "rate": 5,
      "content": "Khóa học rất chi tiết và giảng viên hướng dẫn nhiệt tình!",
      "status": "ACTIVE"
    }
  }
  ```
* **Common Errors**:
  * Chưa ghi danh: `403 Forbidden` — `{"message": "You are not enrolled in this course"}`
  * Đã đánh giá: `400 Bad Request` — `{"message": "You have already rated this course"}`
  * Điểm ngoài khoảng 1-5: `400 Bad Request` — `{"message": "Rate must be between 1 and 5"}`

#### 15. Xem đánh giá công khai của khóa học (Get Course Ratings)
* **Endpoint**: `GET {{BASE_URL}}/ratings/course/f0dde7bb-1bf6-5602-a489-cd324132c68a`
* **Auth**: Công khai (Không cần token)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched course ratings successfully",
    "data": {
      "averageRating": 4.5,
      "totalRatings": 2,
      "ratings": [
        {
          "_id": "71139688-328f-5582-97ac-b5ea2696166b",
          "rate": 5,
          "content": "Khóa học rất hay!",
          "user": {
            "username": "minhsuyyyyy",
            "avatar": ""
          }
        }
      ]
    }
  }
  ```

#### 16. Quản lý Đánh giá (Admin / Teacher Manage Ratings)
* **Endpoint**: `GET {{BASE_URL}}/ratings/manage?page=1&limit=10&status=ACTIVE`
* **Auth**: `Bearer {{TEACHER_TOKEN}}` hoặc `Bearer {{ADMIN_TOKEN}}`
* **Phân quyền**:
  * Giáo viên: Chỉ nhận danh sách đánh giá của các khóa học mình là tác giả.
  * Admin: Nhận toàn bộ đánh giá trong hệ thống.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched ratings successfully",
    "data": {
      "ratings": [...],
      "pagination": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
    }
  }
  ```

#### 17. Cập nhật trạng thái Đánh giá (Update Rating Status)
* **Endpoint**: `PUT {{BASE_URL}}/ratings/manage/71139688-328f-5582-97ac-b5ea2696166b`
* **Auth**: `Bearer {{TEACHER_TOKEN}}` (Chủ sở hữu khóa học) / `Bearer {{ADMIN_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "status": "INACTIVE"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Rating status updated successfully",
    "data": {
      "id": "71139688-328f-5582-97ac-b5ea2696166b",
      "status": "INACTIVE"
    }
  }
  ```

#### 18. Xóa Đánh giá (Delete Rating)
* **Endpoint**: `DELETE {{BASE_URL}}/ratings/manage/71139688-328f-5582-97ac-b5ea2696166b`
* **Auth**: `Bearer {{TEACHER_TOKEN}}` (Chủ sở hữu) / `Bearer {{ADMIN_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Rating deleted successfully"
  }
  ```

---

### PHÂN HỆ 9: BÌNH LUẬN & TƯƠNG TÁC (COMMENT & COMMENT REACTION - PHASE 8)

#### 19. Tạo Bình luận hoặc Trả lời Bình luận (Create Comment / Reply)
* **Endpoint**: `POST {{BASE_URL}}/comments`
* **Auth**: `Bearer {{STUDENT_TOKEN}}` (Đã ghi danh) / `Bearer {{TEACHER_TOKEN}}` (Chủ khóa học) / `Bearer {{ADMIN_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "content": "Bài học rất chi tiết và dễ hiểu!",
    "course": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "lesson": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
    "parentId": "fd6ded83-54e0-5807-b5af-244551274a22"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Comment created successfully",
    "data": {
      "id": "c98cb034-11e2-4646-93e3-fc7a2aec5f30",
      "_id": "c98cb034-11e2-4646-93e3-fc7a2aec5f30",
      "content": "Bài học rất chi tiết và dễ hiểu!",
      "lesson": { "id": "1b2e6643-0006-5e9a-a9f7-3d3078b83262", "_id": "1b2e6643-0006-5e9a-a9f7-3d3078b83262", "title": "Giới thiệu về ReactJS" },
      "course": { "id": "f0dde7bb-1bf6-5602-a489-cd324132c68a", "_id": "f0dde7bb-1bf6-5602-a489-cd324132c68a", "title": "ReactJS Advanced - Update 2025", "slug": "advanced-javascript-concepts" },
      "user": { "id": "13608f92-8acf-53e3-adcb-0d832e9cb1d4", "_id": "13608f92-8acf-53e3-adcb-0d832e9cb1d4", "username": "teacher02", "avatar": "" },
      "status": "APPROVED",
      "parentId": "fd6ded83-54e0-5807-b5af-244551274a22",
      "level": 1,
      "likes": [],
      "dislikes": [],
      "createdAt": "2026-10-04T13:37:38.289Z",
      "updatedAt": "2026-10-04T13:37:38.289Z"
    }
  }
  ```
* **Error Cases**:
  * `403 Forbidden`: `{"success": false, "statusCode": 403, "message": "You are not enrolled in this course"}` (Học viên chưa ghi danh).
  * `403 Forbidden`: `{"success": false, "statusCode": 403, "message": "You are not the owner of this course"}` (Giảng viên khác khóa học).
  * `404 Not Found`: `{"success": false, "statusCode": 404, "message": "Parent comment not found"}` (parentId không tồn tại).

#### 20. Lấy danh sách Bình luận theo Bài học (Get Comments by Lesson)
* **Endpoint**: `GET {{BASE_URL}}/comments/lesson/1b2e6643-0006-5e9a-a9f7-3d3078b83262`
* **Auth**: Không yêu cầu (Public)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched comments successfully",
    "data": [
      {
        "id": "c98cb034-11e2-4646-93e3-fc7a2aec5f30",
        "_id": "c98cb034-11e2-4646-93e3-fc7a2aec5f30",
        "content": "Bài học rất chi tiết và dễ hiểu!",
        "lesson": { "id": "1b2e6643-0006-5e9a-a9f7-3d3078b83262", "_id": "1b2e6643-0006-5e9a-a9f7-3d3078b83262", "title": "Giới thiệu về ReactJS" },
        "user": { "id": "13608f92-8acf-53e3-adcb-0d832e9cb1d4", "_id": "13608f92-8acf-53e3-adcb-0d832e9cb1d4", "username": "teacher02", "avatar": "" },
        "status": "APPROVED",
        "parentId": null,
        "level": 0,
        "likes": ["c55de839-f059-519c-8820-b16aa17fb9c3"],
        "dislikes": [],
        "createdAt": "2026-10-04T13:37:38.289Z",
        "updatedAt": "2026-10-04T13:37:38.289Z"
      }
    ]
  }
  ```

#### 21. Cập nhật Bình luận (Update Comment)
* **Endpoint**: `PUT {{BASE_URL}}/comments/c98cb034-11e2-4646-93e3-fc7a2aec5f30`
* **Auth**: `Bearer {{USER_TOKEN}}` (Chính chủ) / `Bearer {{ADMIN_TOKEN}}`
* **Body (JSON)**:
  ```json
  {
    "content": "Nội dung bình luận đã được chỉnh sửa"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Comment updated successfully",
    "data": {
      "id": "c98cb034-11e2-4646-93e3-fc7a2aec5f30",
      "content": "Nội dung bình luận đã được chỉnh sửa"
    }
  }
  ```
* **Error Case**:
  * `403 Forbidden`: `{"success": false, "statusCode": 403, "message": "You are not allowed to edit this comment"}`

#### 22. Xóa Bình luận của Chính mình (Delete Own Comment)
* **Endpoint**: `DELETE {{BASE_URL}}/comments/c98cb034-11e2-4646-93e3-fc7a2aec5f30`
* **Auth**: `Bearer {{USER_TOKEN}}` (Chính chủ)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```
* **Error Case**:
  * `403 Forbidden`: `{"success": false, "statusCode": 403, "message": "You are not allowed to delete this comment"}`

#### 23. Thích Bình luận (Like Comment)
* **Endpoint**: `POST {{BASE_URL}}/comments/like/c98cb034-11e2-4646-93e3-fc7a2aec5f30`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Comment liked successfully",
    "data": {
      "id": "c98cb034-11e2-4646-93e3-fc7a2aec5f30",
      "likes": ["c55de839-f059-519c-8820-b16aa17fb9c3"],
      "dislikes": []
    }
  }
  ```
* **Error Case**:
  * `400 Bad Request`: `{"success": false, "statusCode": 400, "message": "You have already liked this comment"}`

#### 24. Không thích Bình luận (Dislike Comment)
* **Endpoint**: `POST {{BASE_URL}}/comments/dislike/c98cb034-11e2-4646-93e3-fc7a2aec5f30`
* **Auth**: `Bearer {{USER_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Comment disliked successfully",
    "data": {
      "id": "c98cb034-11e2-4646-93e3-fc7a2aec5f30",
      "likes": [],
      "dislikes": ["c55de839-f059-519c-8820-b16aa17fb9c3"]
    }
  }
  ```
* **Error Case**:
  * `400 Bad Request`: `{"success": false, "statusCode": 400, "message": "You have already disliked this comment"}`

#### 25. Tra cứu Bình luận Quản trị (Admin & Teacher Comments Management)
* **Endpoint**: `GET {{BASE_URL}}/comments?page=1&limit=10&courseId=f0dde7bb-1bf6-5602-a489-cd324132c68a`
* **Auth**: `Bearer {{TEACHER_TOKEN}}` (Lọc trong khóa học mình) / `Bearer {{ADMIN_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Fetched comments successfully!",
    "data": {
      "comments": [...],
      "pagination": { "page": 1, "limit": 10, "total": 8, "totalPages": 1 }
    }
  }
  ```

#### 26. Admin Xóa Bình luận (Delete Comment by Admin)
* **Endpoint**: `DELETE {{BASE_URL}}/comments/admin/c98cb034-11e2-4646-93e3-fc7a2aec5f30`
* **Auth**: `Bearer {{ADMIN_TOKEN}}`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```

#### 27. Giảng viên Xóa Bình luận thuộc Khóa học (Delete Comment by Teacher)
* **Endpoint**: `DELETE {{BASE_URL}}/comments/teacher/c98cb034-11e2-4646-93e3-fc7a2aec5f30`
* **Auth**: `Bearer {{TEACHER_TOKEN}}` (Chủ sở hữu khóa học)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```
* **Error Case**:
  * `403 Forbidden`: `{"success": false, "statusCode": 403, "message": "You are not allowed to delete this comment"}`

---

## D. RAW BODY TEST CASES (COPY-PASTE VÀO POSTMAN / THUNDER CLIENT)

Dưới đây là các payload JSON chuẩn hóa 100% cú pháp, có thể dán trực tiếp vào tab `Body -> Raw -> JSON`:

### 1. Đăng ký & Đăng nhập
```json
{
  "email": "test_user_2026@gmail.com",
  "password": "Password123@",
  "username": "user2026",
  "role": "user"
}
```

### 2. Tạo đơn hàng (Order)
```json
{
  "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
  "couponCode": ""
}
```

### 3. Đánh dấu hoàn thành bài học (Progress Complete)
```json
{
  "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
  "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262"
}
```

### 4. Bỏ đánh dấu hoàn thành bài học (Progress Uncomplete)
```json
{
  "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
  "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262"
}
```

### 5. Yêu cầu cấp chứng chỉ (Certificate Request)
```json
{
  "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a"
}
```

### 6. Tạo đánh giá khóa học (Create Rating)
```json
{
  "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
  "rate": 5,
  "content": "Bài học giải thích rất trực quan và có ví dụ thực tế rõ ràng."
}
```

### 7. Duyệt / Ẩn đánh giá (Update Rating Status)
```json
{
  "status": "ACTIVE"
}
```

---

## E. THỨ TỰ KIỂM THỬ KHUYẾN NGHỊ (RECOMMENDED TESTING ORDER)

Để tránh lỗi thiếu phụ thuộc dữ liệu (Foreign Key / Enrollment constraints), luôn thực hiện kiểm thử theo chuỗi tuần tự sau:

```text
[1. Authentication & Tokens]
     │ (Lấy ACCESS_TOKEN cho Student, Teacher, Admin)
     ▼
[2. Course Syllabus Overview]
     │ (Kiểm tra Course, Chapter, Lessons công khai)
     ▼
[3. Enrollment / Order Flow]
     │ (Tạo Order -> Hoàn tất Enrollment trong PostgreSQL)
     ▼
[4. Quiz & Submission Flow]
     │ (Làm Quiz và nộp bài để đạt tỷ lệ hoàn thành >= 60%)
     ▼
[5. Progress Tracking Flow]
     │ (Đánh dấu hoàn thành từng Lesson -> đạt tiến độ >= 70%)
     ▼
[6. Certificate Issuance]
     │ (Yêu cầu cấp Certificate -> sinh PDF và upload Cloudinary)
     ▼
[7. Favorite Management]
     │ (Thêm vào wishlist, xem danh sách, xóa khỏi wishlist)
     ▼
[8. Rating & Review Flow]
     │ (Học viên đánh giá 5 sao -> Public xem -> Teacher quản lý)
```

---

## F. LƯU Ý TƯƠNG THÍCH KỸ THUẬT (API COMPATIBILITY NOTES)

1. **Tương thích `_id` và `id`**:
   * Tất cả response JSON của các module đã migration sang PostgreSQL đều được bọc tiện ích `withCompatId()`. Client nhận đồng thời cả `id` và `_id` với cùng giá trị UUID để tương thích tuyệt đối với Frontend Next.js cũ.
2. **Prisma Decimal Serialization**:
   * Các trường tiền tệ (`price`) và điểm số (`grade`) trong PostgreSQL lưu dưới dạng Decimal để chống sai số tính toán, nhưng khi trả về API luôn được serialize thành kiểu `number` (`Number(val)`).
3. **Dual-Stack Database Behavior**:
   * Toàn bộ dữ liệu của Phase 1–7 được đọc và ghi độc lập trên PostgreSQL (`tmdemy`).
   * Riêng hệ thống Notification hiện đang ở giai đoạn chuyển tiếp (Phase 10), socket realtime và thông báo được mirror sang MongoDB một cách an toàn mà không làm ảnh hưởng đến tính toàn vẹn của nghiệp vụ chính.

---

## G. BẢNG CHECKLIST KIỂM THỬ THỦ CÔNG (MANUAL TESTING CHECKLIST)

Người kiểm thử có thể sao chép checklist này để đánh dấu tiến độ kiểm thử Postman:

- [ ] `POST /api/users/login` (Lấy Student Token)
- [ ] `POST /api/users/login` (Lấy Teacher Token)
- [ ] `POST /api/users/login` (Lấy Admin Token)
- [ ] `GET /api/courses` (Xem danh sách khóa học)
- [ ] `POST /api/orders` (Tạo đơn hàng khóa học)
- [ ] `GET /api/enrollments/my-courses` (Xác nhận học viên đã ghi danh)
- [ ] `POST /api/progress/complete` (Hoàn thành bài học)
- [ ] `GET /api/progress/:courseId` (Kiểm tra % tiến độ tăng)
- [ ] `POST /api/progress/uncomplete` (Bỏ hoàn thành, kiểm tra % giảm)
- [ ] `POST /api/certificates` (Cấp chứng chỉ, kiểm tra URL PDF)
- [ ] `POST /api/certificates` (Kiểm tra chặn cấp chứng chỉ trùng)
- [ ] `POST /api/favorites/:id` (Thêm khóa học yêu thích)
- [ ] `GET /api/favorites` (Xem danh sách yêu thích)
- [ ] `DELETE /api/favorites/:id` (Xóa khỏi danh sách yêu thích)
- [ ] `POST /api/ratings` (Gửi đánh giá 5 sao)
- [ ] `GET /api/ratings/course/:id` (Xem đánh giá công khai)
- [ ] `GET /api/ratings/manage` (Giảng viên xem đánh giá khóa học mình)
- [ ] `PUT /api/ratings/manage/:id` (Cập nhật trạng thái đánh giá)
- [ ] `DELETE /api/ratings/manage/:id` (Xóa đánh giá)
- [ ] `POST /api/comments` (Tạo bình luận / trả lời bài học)
- [ ] `GET /api/comments/lesson/:lessonId` (Xem danh sách bình luận bài học)
- [ ] `PUT /api/comments/:id` (Chỉnh sửa nội dung bình luận)
- [ ] `POST /api/comments/like/:commentId` (Thích bình luận)
- [ ] `POST /api/comments/like/:commentId` (Kiểm tra chặn like trùng)
- [ ] `POST /api/comments/dislike/:commentId` (Chuyển sang không thích bình luận)
- [ ] `POST /api/comments/dislike/:commentId` (Kiểm tra chặn dislike trùng)
- [ ] `GET /api/comments` (Giảng viên / Admin tra cứu và lọc bình luận)
- [ ] `DELETE /api/comments/:id` (Học viên xóa bình luận chính chủ)
- [ ] `DELETE /api/comments/teacher/:id` (Giảng viên xóa bình luận khóa học của mình)
- [ ] `DELETE /api/comments/admin/:id` (Admin xóa bình luận bất kỳ)
