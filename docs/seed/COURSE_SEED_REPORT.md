# BÁO CÁO KỸ THUẬT SEED DỮ LIỆU KHÓA HỌC (COURSE SEED REPORT)
**Dự án**: TMDEMY E-Learning Backend  
**Ngày thực hiện**: 2026-10-07  
**Phân hệ**: Database Seeding — Course Catalog (360+ Courses)  
**Trạng thái**: ✅ **HOÀN THÀNH (100% SUCCESS & PASS ALL AUDIT CHECKS)**

---

## 1. Summary

| Chỉ số (Metric) | Giá trị (Value) | Ghi chú (Notes) |
| :--- | :---: | :--- |
| **Mục tiêu seed (Target)** | **360** | Khóa học mới |
| **Số lượng thực tế seed (Actual)** | **360** | Đã insert/upsert thành công |
| **Số course trước khi seed (Existing before seed)** | **10** | Dữ liệu cũ được bảo toàn 100% |
| **Số course bổ sung (Courses added)** | **360** | Không trùng lặp, không overwrite dữ liệu cũ |
| **Tổng số course sau seed (Courses after seed)** | **370** | `10 + 360 = 370` |
| **Tính lũy thừa / Idempotency** | **ĐẠT (PASS)** | Chạy lại lần 2 giữ nguyên 370 courses, 0 duplicates |

---

## 2. Teachers Distribution

Tất cả 360 khóa học được phân bổ hoàn toàn cân bằng giữa 4 Teacher IDs được chỉ định (mỗi giáo viên đúng 90 khóa học):

| # | Teacher ID | Username | Role | Số Course Đã Seed | Tỷ lệ (%) |
| :-: | :--- | :--- | :---: | :---: | :---: |
| 1 | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `teacher02` | `TEACHER` | **90** | 25.0% |
| 2 | `6dd1ccd9-420b-5c6d-8322-75223e67e549` | `teacher_cntt` | `TEACHER` | **90** | 25.0% |
| 3 | `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | `new_username123` | `ADMIN` | **90** | 25.0% |
| 4 | `c79ee551-3b2e-48ca-9105-c0669f04e6bb` | `giaovientrungquoc` | `TEACHER` | **90** | 25.0% |
| **Tổng** | — | — | — | **360** | **100%** |

---

## 3. Categories Distribution

Theo chỉ đạo của Project Owner (Phương án B), 360 khóa học được phân bổ đồng đều trên 4 danh mục hiện hữu trong PostgreSQL (mỗi danh mục đúng 90 khóa học):

| # | Category ID | Tên Danh Mục | Slug | Số Course Đã Seed | Tỷ lệ (%) |
| :-: | :--- | :--- | :--- | :---: | :---: |
| 1 | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` | Lập trình web | `lap-trinh-web` | **90** | 25.0% |
| 2 | `dddf433f-347b-5024-b70d-2398aaed3660` | Lập trình | `lap-trinh` | **90** | 25.0% |
| 3 | `2ec199fc-a7e0-531e-b79d-14b479f74853` | Khoa học dữ liệuu | `khoa-hoc-du-lieu` | **90** | 25.0% |
| 4 | `084d6053-7823-4cb8-a7e7-7dba3e6a78bf` | AI | `ai` | **90** | 25.0% |
| **Tổng** | — | — | — | **360** | **100%** |

---

## 4. Dataset Distribution

### 4.1. Phân bố Trạng thái (Status Distribution)
* **APPROVED**: **328 courses** (91.1%) — Cung cấp catalog phong phú phục vụ kiểm thử tìm kiếm, lọc, phân trang.
* **PENDING**: **24 courses** (6.7%) — Phục vụ kiểm thử quy trình duyệt bài của Admin.
* **REJECTED**: **8 courses** (2.2%) — Phục vụ kiểm thử xử lý bài bị từ chối.
*(Tổng toàn bộ DB bao gồm 10 courses cũ: 337 APPROVED, 25 PENDING, 8 REJECTED).*

### 4.2. Phân bố Cấp độ (Level Distribution)
* **BEGINNER**: **102 courses** (28.3%)
* **INTERMEDIATE**: **139 courses** (38.6%)
* **ADVANCED**: **119 courses** (33.1%)

### 4.3. Phân bố Loại khóa học (Type Distribution)
* **PAID**: **334 courses** (92.8%)
* **FREE**: **26 courses** (7.2%)

### 4.4. Phân bố Giá cả (Price & Discount Distribution)
* Khóa học `FREE`: `price = 0`, `oldPrice = 0`.
* Khóa học `PAID`: Giá dao động thực tế theo các mốc `99.000đ`, `149.000đ`, `199.000đ`, `249.000đ`, `299.000đ`, `349.000đ`, `399.000đ`, `449.000đ`, `499.000đ`, `549.000đ`, `599.000đ`, `649.000đ`, `699.000đ`, `749.000đ`, `799.000đ`, `899.000đ`, `999.000đ`.
* Nguyên tắc chiết khấu: `oldPrice >= price` được tuân thủ nghiêm ngặt 100%.

### 4.5. Phân bố Lượt xem & Lượt mua (View & Sold Distribution)
* Tự nhiên và có tương quan tỷ lệ thuận: Khóa học lượt xem cao có lượt mua cao hơn. Khóa học Pending/Rejected có lượt mua = 0.
* Toàn bộ giá trị được tính toán tất định (deterministic formula), không dùng random bất định.

---

## 5. Validation & Audit Results

| Hạng mục kiểm tra | Tiêu chuẩn | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Trùng lặp Slug (Duplicate Slugs)** | 0 trùng lặp trên toàn DB | **0 duplicate slugs** (370/370 unique) | ✅ PASS |
| **Trùng lặp ID (Duplicate IDs)** | 0 trùng lặp trên toàn DB | **0 duplicate IDs** (370/370 unique) | ✅ PASS |
| **Liên kết Giáo viên (Teacher FK)** | 100% hợp lệ | **0 orphan records** | ✅ PASS |
| **Liên kết Danh mục (Category FK)** | 100% hợp lệ | **0 orphan records** | ✅ PASS |
| **Số lượng Approved Course** | >= 300 | **337 approved courses** | ✅ PASS |
| **Độ phủ Catalog API** | Đầy đủ bộ lọc | Đã kiểm thử 14/14 test cases | ✅ PASS |

### 5.1. Kết quả Kiểm thử API (API Regression Audit)
Đã chạy bộ kiểm thử tự động gọi trực tiếp vào backend server (`http://localhost:3002/api/courses`):

1. `GET /api/courses?page=1&limit=5` $\rightarrow$ `200 OK` (5 courses, total: 337) ✅
2. `GET /api/courses?page=2&limit=5` $\rightarrow$ `200 OK` (5 courses, total: 337) ✅
3. `GET /api/courses?search=React` $\rightarrow$ `200 OK` (10 courses, total: 15) ✅
4. `GET /api/courses?category=fc5d66a4-7468-5328-a6a9-16c3a9e49881` $\rightarrow$ `200 OK` (87 courses) ✅
5. `GET /api/courses?category=084d6053-7823-4cb8-a7e7-7dba3e6a78bf` $\rightarrow$ `200 OK` (82 courses) ✅
6. `GET /api/courses?level=beginner` $\rightarrow$ `200 OK` (97 courses) ✅
7. `GET /api/courses?level=advanced` $\rightarrow$ `200 OK` (108 courses) ✅
8. `GET /api/courses?type=free` $\rightarrow$ `200 OK` (24 courses) ✅
9. `GET /api/courses?type=paid` $\rightarrow$ `200 OK` (313 courses) ✅
10. `GET /api/courses?priceMin=100000&priceMax=400000` $\rightarrow$ `200 OK` (202 courses) ✅
11. `GET /api/courses?sortBy=price` $\rightarrow$ `200 OK` (337 courses) ✅
12. `GET /api/courses/:slug` (React 19) $\rightarrow$ `200 OK` ✅
13. `GET /api/courses/:slug` (Python 0 to Expert) $\rightarrow$ `200 OK` ✅
14. `GET /api/courses/:slug` (Generative AI) $\rightarrow$ `200 OK` ✅

---

## 6. Database Safety & Integrity Confirmation

Cam kết tuân thủ tuyệt đối các quy định kỹ thuật bất khả xâm phạm:

```text
Existing courses deleted: NO
Database reset: NO
Schema modified: NO
Backend API modified: NO
Frontend modified: NO
```

* **Không reset database / Không migrate reset**: Cơ sở dữ liệu PostgreSQL `tmdemy` được bảo toàn toàn vẹn.
* **Không truncate / Không xóa course cũ**: 10 bản ghi khóa học cũ vẫn tồn tại nguyên vẹn.
* **Không can thiệp schema**: File `prisma/schema.prisma` được đóng băng hoàn toàn.
* **Không can thiệp source code API / Frontend**: Toàn bộ Controller, Service, Repository, Route, Middleware và mã nguồn Next.js không bị chỉnh sửa.

---

## 7. Cấu trúc Source Code Seed Đã Bổ Sung

* [course-data.ts](file:///d:/e-learning_server/prisma/seeds/course-data.ts): Bộ sinh và điều phối dữ liệu tất định cho 360 khóa học.
* [web-courses.ts](file:///d:/e-learning_server/prisma/seeds/web-courses.ts): 90 khóa học chuyên đề Lập trình web.
* [programming-courses.ts](file:///d:/e-learning_server/prisma/seeds/programming-courses.ts): 90 khóa học chuyên đề Lập trình & Hệ thống.
* [data-courses.ts](file:///d:/e-learning_server/prisma/seeds/data-courses.ts): 90 khóa học chuyên đề Khoa học dữ liệu & BI.
* [ai-courses.ts](file:///d:/e-learning_server/prisma/seeds/ai-courses.ts): 90 khóa học chuyên đề AI & Học sâu.
* [seed.ts](file:///d:/e-learning_server/prisma/seed.ts): Pipeline thực thi seed tự động, có xác thực điều kiện tiên quyết và cơ chế upsert lũy thừa.
