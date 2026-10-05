# PHASE 3 — STEP 1 REPORT
## APPLICATION MODELS & LEGACY ISOLATION (COURSE, CHAPTER, LESSON)

> **Status:** COMPLETED & VERIFIED  
> **Phase:** Phase 3 — Step 1  
> **Target Database:** PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
> **Legacy Database:** MongoDB Atlas (`e-learning`)  
> **Target Date:** 2026-10-02  
> **Verdict:** PASS  

---

## 1. EXECUTIVE SUMMARY

Thực hiện theo đúng phê duyệt sau Phase 3 Step 0 Pre-Implementation Audit, **Step 1: Application Models & Legacy Isolation** đã hoàn tất việc bóc tách toàn diện mô hình dữ liệu Mongoose cũ sang `src/models/legacy/`, đồng thời thiết lập các **Zod Application Models** thuần túy cho 3 thực thể cốt lõi:
1. **Course** ([src/models/course.model.ts](file:///d:/e-learning_server/src/models/course.model.ts))
2. **Chapter** ([src/models/chapter.model.ts](file:///d:/e-learning_server/src/models/chapter.model.ts))
3. **Lesson** ([src/models/lesson.model.ts](file:///d:/e-learning_server/src/models/lesson.model.ts))

Tất cả 16 file service hiện đang phụ thuộc vào Mongoose CourseModel, ChapterModel, LessonModel đã được cập nhật đường dẫn import sang `models/legacy/` một cách an toàn, bảo toàn 100% logic hiện hữu cho các module chưa migrate.

Bộ test suite độc lập cho Step 1 ([scripts/migration-utils/step-01-phase3-zod-models.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-01-phase3-zod-models.test.ts)) cùng toàn bộ các bộ regression test suite của Phase 2 đã chạy thành công rực rỡ với **100% PASS (224/224 test cases)**. Không có bất kỳ schema hay database record nào bị sửa đổi.

---

## 2. LEGACY MODELS ISOLATION

Ba mô hình Mongoose cũ đã được cô lập an toàn sang thư mục `src/models/legacy/`:

### 2.1. `src/models/legacy/course.legacy.model.ts`
- **Model Name:** `'Course'`
- **Bảo toàn:** 100% schema definition, fields, types, enum validators (`CourseType`, `CourseStatus`, `CourseLevel`), timestamps (`createdAt`, `updatedAt`), soft-delete flag `_destroy`, nested `info` (requirements, benefits, techniques, documents, qa).
- **TypeScript Interface:** `export interface Course extends Document` sử dụng `Types.ObjectId` thay cho `Schema.Types.ObjectId` để tương thích hoàn hảo với TypeScript strict type checking.
- **Singleton Registration:** Sử dụng pattern `(models.Course as mongoose.Model<Course>) || model<Course>('Course', courseSchema)` để tránh `OverwriteModelError`.

### 2.2. `src/models/legacy/chapter.legacy.model.ts`
- **Model Name:** `'Chapter'`
- **Bảo toàn:** 100% fields (`title`, `course`, `lessons`, `order`, `_destroy`), timestamps, model name `'Chapter'`.
- **TypeScript Interface:** `export interface Chapter extends Document`.

### 2.3. `src/models/legacy/lesson.legacy.model.ts`
- **Model Name:** `'Lesson'`
- **Bảo toàn:** 100% fields (`title`, `slug`, `chapter`, `course`, `order`, `duration`, `type`, `content`, `author`, `isDemo`, `videoUrl`), enum validator `LessonType`, timestamps.
- **TypeScript Interface:** `export interface Lesson extends Document`.

---

## 3. ZOD APPLICATION MODELS

Ba file model chính trong `src/models/` đã được chuyển đổi hoàn toàn thành **Zod Application Models** tuân thủ nghiêm ngặt ADR [docs/architecture/application-model-design.md](file:///d:/e-learning_server/docs/architecture/application-model-design.md):

### 3.1. Course (`src/models/course.model.ts`)
- **Domain Schema (`courseSchema`):**
  - Khóa chính `id`: UUID RFC 4122.
  - Các trường chuỗi: `title` (max 255), `slug` (max 255), `image`, `introUrl`, `description`.
  - Tiền tệ & Định lượng: `price` (min 0, default 0), `oldPrice` (min 0, default 0), `view` (int >= 0), `sold` (int >= 0).
  - Enums (Prisma Client Enums): `type` (`CourseType`), `status` (`CourseStatus`), `level` (`CourseLevel`).
  - Mảng chuỗi: `requirements`, `benefits`, `techniques`, `documents`.
  - Foreign Keys: `categoryId` (UUID nullable optional), `authorId` (UUID).
  - Audit: `isDestroyed` (boolean, default false), `createdAt`, `updatedAt`.
- **Nested & Compatibility Schemas:**
  - `courseFaqSchema`: Mô hình hóa bảng quan hệ `course_faqs`.
  - `courseInfoCompatibilitySchema`: Cung cấp cấu trúc tương thích ngược cho object `info: { requirements, benefits, techniques, documents, qa }`.
- **Public & Response Schemas:**
  - `coursePublicSchema`: Loại bỏ các trường nội bộ.
  - `courseCompactSchema`: Gọn nhẹ cho các module liên kết (`id`, `image`, `price`, `slug`, `status`, `title`, `type`).
  - `courseDetailResponseSchema`: Mở rộng với author compact, category compact, faqs và info.
- **Input Schemas:** `createCourseInputSchema`, `updateCourseInputSchema`, `updateCourseStatusInputSchema`.
- **Purity:** Không import Mongoose, không import PrismaClient singleton hay class, không chứa DB query.

### 3.2. Chapter (`src/models/chapter.model.ts`)
- **Domain Schema (`chapterSchema`):** `id` (UUID), `title` (max 255), `courseId` (UUID), `order` (int, default 0), `isDestroyed` (boolean), `createdAt`, `updatedAt`.
- **Public Schemas:** `chapterPublicSchema`, `chapterCompactSchema`.
- **Input Schemas:** `createChapterInputSchema`, `updateChapterInputSchema`.

### 3.3. Lesson (`src/models/lesson.model.ts`)
- **Domain Schema (`lessonSchema`):** `id` (UUID), `title` (max 255), `slug` (max 255), `chapterId` (UUID), `courseId` (UUID), `authorId` (UUID), `order` (int), `duration` (int), `type` (`LessonType`), `content`, `isDemo`, `videoUrl`, `createdAt`, `updatedAt`.
- **Phân định Public & Study Schemas:**
  - `lessonPublicSchema`: Ẩn `videoUrl` và `content` đối với người dùng chưa ghi danh.
  - `lessonStudySchema`: Giữ nguyên `videoUrl` và `content` cho phiên học tập của học viên / bài giảng demo.
  - `lessonCompactSchema`: Gọn nhẹ cho danh sách mục lục.
- **Input Schemas:** `createLessonInputSchema`, `updateLessonInputSchema`.

---

## 4. IMPORT DEPENDENCY CHANGES

Đã rà soát toàn bộ codebase và cập nhật đường dẫn import tại 16 file services:

| STT | File Service | Module liên quan | Import cũ | Import mới |
|:---:|---|---|---|---|
| 1 | `src/services/teacher.service.ts` | Teacher Course | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 2 | `src/services/rating.service.ts` | Rating | `../models/course.model` | `~/models/legacy/course.legacy.model` |
| 3 | `src/services/quizSubmission.service.ts` | Quiz Submission | `~/models/lesson.model` | `~/models/legacy/lesson.legacy.model` |
| 4 | `src/services/quiz.service.ts` | Quiz | `~/models/lesson.model`, `~/models/course.model` | `~/models/legacy/lesson.legacy.model`, `~/models/legacy/course.legacy.model` |
| 5 | `src/services/question.service.ts` | Question | `~/models/lesson.model` | `~/models/legacy/lesson.legacy.model` |
| 6 | `src/services/progress.service.ts` | Progress | `~/models/lesson.model` | `~/models/legacy/lesson.legacy.model` |
| 7 | `src/services/order.service.ts` | Order | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 8 | `src/services/lesson.service.ts` | Lesson | `~/models/lesson.model`, `~/models/course.model`, `~/models/chapter.model` | `~/models/legacy/lesson.legacy.model`, `~/models/legacy/course.legacy.model`, `~/models/legacy/chapter.legacy.model` |
| 9 | `src/services/favoriteCourse.service.ts` | Favorite | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 10 | `src/services/enrollment.service.ts` | Enrollment | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 11 | `src/services/course.service.ts` | Course | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 12 | `src/services/coupon.service.ts` | Coupon | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 13 | `src/services/conversation.service.ts` | Chat | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 14 | `src/services/comment.service.ts` | Comment | `~/models/course.model` | `~/models/legacy/course.legacy.model` |
| 15 | `src/services/chapter.service.ts` | Chapter | `~/models/chapter.model`, `~/models/course.model` | `~/models/legacy/chapter.legacy.model`, `~/models/legacy/course.legacy.model` |
| 16 | `src/services/admin.service.ts` | Admin Course | `~/models/course.model` | `~/models/legacy/course.legacy.model` |

*Kết quả kiểm tra grep sau khi cập nhật:* **0** file còn trỏ nhầm vào `src/models/(course|chapter|lesson).model` khi cần gọi Mongoose Model.

---

## 5. FILES CREATED

1. `src/models/legacy/course.legacy.model.ts`
2. `src/models/legacy/chapter.legacy.model.ts`
3. `src/models/legacy/lesson.legacy.model.ts`
4. `scripts/migration-utils/step-01-phase3-zod-models.test.ts`
5. `docs/migration/phase-03-course-chapter-lesson/step-01-legacy-zod-report.md`

---

## 6. FILES MODIFIED

1. `src/models/course.model.ts` (Zod Application Model thuần)
2. `src/models/chapter.model.ts` (Zod Application Model thuần)
3. `src/models/lesson.model.ts` (Zod Application Model thuần)
4. `src/services/teacher.service.ts` (Chuyển import legacy)
5. `src/services/rating.service.ts` (Chuyển import legacy)
6. `src/services/quizSubmission.service.ts` (Chuyển import legacy)
7. `src/services/quiz.service.ts` (Chuyển import legacy)
8. `src/services/question.service.ts` (Chuyển import legacy)
9. `src/services/progress.service.ts` (Chuyển import legacy)
10. `src/services/order.service.ts` (Chuyển import legacy)
11. `src/services/lesson.service.ts` (Chuyển import legacy)
12. `src/services/favoriteCourse.service.ts` (Chuyển import legacy)
13. `src/services/enrollment.service.ts` (Chuyển import legacy)
14. `src/services/course.service.ts` (Chuyển import legacy)
15. `src/services/coupon.service.ts` (Chuyển import legacy)
16. `src/services/conversation.service.ts` (Chuyển import legacy)
17. `src/services/comment.service.ts` (Chuyển import legacy)
18. `src/services/chapter.service.ts` (Chuyển import legacy)
19. `src/services/admin.service.ts` (Chuyển import legacy)

---

## 7. TYPESCRIPT COMPILATION RESULTS

Thực hiện biên dịch kiểm tra tĩnh: `cmd /c npx tsc --noEmit`.

- **Các file thuộc Step 1:**
  - `src/models/course.model.ts`: **0 lỗi**
  - `src/models/chapter.model.ts`: **0 lỗi**
  - `src/models/lesson.model.ts`: **0 lỗi**
  - `src/models/legacy/course.legacy.model.ts`: **0 lỗi**
  - `src/models/legacy/chapter.legacy.model.ts`: **0 lỗi**
  - `src/models/legacy/lesson.legacy.model.ts`: **0 lỗi**
  - Tất cả 16 file services được cập nhật import: **0 lỗi mới phát sinh**.
- **Các lỗi cũ ngoài phạm vi (Pre-existing errors):**
  - Lỗi `Type 'string | string[]' is not assignable to type 'string'` trong các controllers chưa migrate (`coupon.controller.ts`, `comment.controller.ts`, `notification.controller.ts`, v.v.).
  - Lỗi type inheritance cũ trong `coupon.model.ts`, `quiz.model.ts`, `quizSubmission.model.ts`.
  - Lỗi cloudinary / pdfkit trong `certificate.service.ts` và `pdfGenerator.ts`.
  *(Tất cả đều là lỗi lịch sử từ trước Phase 1 và hoàn toàn không liên quan đến Step 1 này).*

---

## 8. TEST RESULTS

Đã xây dựng và thực thi test suite hoàn chỉnh [step-01-phase3-zod-models.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-01-phase3-zod-models.test.ts):

```text
================================================================================
  TEST SUITE: PHASE 3 STEP 1 — ZOD APPLICATION MODELS & LEGACY ISOLATION
================================================================================

[1. COURSE ZOD DOMAIN SCHEMAS VALIDATION]:
  PASSED: courseSchema successfully parses valid domain Course object
  PASSED: courseSchema correctly rejects non-UUID id
  PASSED: courseSchema correctly rejects negative price
  PASSED: courseSchema correctly rejects invalid CourseType enum
  PASSED: coursePublicSchema preserves required public fields
  PASSED: courseCompactSchema contains expected keys (got: id, image, price, slug, status, title, type)
  PASSED: courseFaqSchema validates CourseFaq correctly
  PASSED: courseInfoCompatibilitySchema validates legacy nested info structure
  PASSED: courseDetailResponseSchema validates full course detail structure
  PASSED: createCourseInputSchema validates valid course creation input

[2. CHAPTER ZOD DOMAIN SCHEMAS VALIDATION]:
  PASSED: chapterSchema successfully parses valid domain Chapter object
  PASSED: chapterSchema correctly rejects non-UUID id
  PASSED: chapterPublicSchema correctly filters public fields
  PASSED: chapterCompactSchema contains exactly [id, order, title] (got: id, order, title)
  PASSED: createChapterInputSchema validates chapter creation input

[3. LESSON ZOD DOMAIN SCHEMAS VALIDATION]:
  PASSED: lessonSchema successfully parses valid domain Lesson object
  PASSED: lessonSchema rejects non-UUID courseId
  PASSED: lessonPublicSchema correctly omits videoUrl and full content
  PASSED: lessonStudySchema retains videoUrl and content for study sessions
  PASSED: lessonCompactSchema contains expected compact keys (got: duration, id, isDemo, order, slug, title, type)
  PASSED: createLessonInputSchema validates lesson creation input

[4. LEGACY MONGOOSE MODELS REGISTRATION & ISOLATION]:
  PASSED: Legacy CourseModel is defined and importable
  PASSED: Legacy CourseModel registered as 'Course' (got 'Course')
  PASSED: Legacy ChapterModel is defined and importable
  PASSED: Legacy ChapterModel registered as 'Chapter' (got 'Chapter')
  PASSED: Legacy LessonModel is defined and importable
  PASSED: Legacy LessonModel registered as 'Lesson' (got 'Lesson')
  PASSED: Legacy courseSchema preserves timestamps: true
  PASSED: Legacy chapterSchema preserves timestamps: true
  PASSED: Legacy lessonSchema preserves timestamps: true

[5. APPLICATION MODELS PURITY AUDIT]:
  PASSED: course.model.ts does NOT import from mongoose
  PASSED: course.model.ts does NOT import PrismaClient class
  PASSED: chapter.model.ts does NOT import from mongoose
  PASSED: chapter.model.ts does NOT import PrismaClient class
  PASSED: lesson.model.ts does NOT import from mongoose
  PASSED: lesson.model.ts does NOT import PrismaClient class

[6. DATABASE RECORD COUNTS INTEGRITY CHECK]:
  Current counts in PostgreSQL:
    - courses: 8 (baseline: 8)
    - course_faqs: 8 (baseline: 8)
    - chapters: 12 (baseline: 12)
    - lessons: 7 (baseline: 7)
    - users: 11 (baseline: 11 [8 migrated + 3 Phase 2 Step 4 test users])
    - categories: 3 (baseline: 3)
  PASSED: PostgreSQL courses count unchanged (exactly 8)
  PASSED: PostgreSQL course_faqs count unchanged (exactly 8)
  PASSED: PostgreSQL chapters count unchanged (exactly 12)
  PASSED: PostgreSQL lessons count unchanged (exactly 7)
  PASSED: PostgreSQL users count unchanged (exactly 11)
  PASSED: PostgreSQL categories count unchanged (exactly 3)
================================================================================
  RESULT: 42 PASSED | 0 FAILED
================================================================================
```

---

## 9. REGRESSION RESULTS

Đã chạy toàn bộ các test suite hồi quy của Phase 2:

1. **Phase 2 Step 1 (User Zod Model & Legacy User Isolation):**
   - File: `scripts/migration-utils/step-01-zod-model.test.ts`
   - Kết quả: **17/17 PASSED** (0 FAILED).
2. **Phase 2 Step 2 (Functional Repositories - User & Category):**
   - File: `scripts/migration-utils/step-02-repositories.test.ts`
   - Kết quả: **53/53 PASSED** (0 FAILED).
3. **Phase 2 Step 3 (User & Category Services):**
   - File: `scripts/migration-utils/step-03-services.test.ts`
   - Kết quả: **67/67 PASSED** (0 FAILED).
4. **Phase 2 Step 4 (Authentication, Middleware & Admin User Services):**
   - File: `scripts/migration-utils/step-04-middleware-auth.test.ts`
   - Kết quả: **45/45 PASSED** (0 FAILED).

👉 **Tổng số test hồi quy chạy lại: 182 / 182 test cases PASS 100%.**  
Không có bất kỳ sự suy giảm chất lượng (regression) nào trên hệ thống.

---

## 10. DATABASE INTEGRITY CHECK

Bảng đối chiếu số lượng bản ghi cơ sở dữ liệu PostgreSQL trước và sau Step 1:

| Thực thể (Table) | Trạng thái trước Step 1 | Trạng thái sau Step 1 | Sai lệch (Delta) | Đánh giá |
|---|:---:|:---:|:---:|:---:|
| `courses` | 8 | 8 | 0 | Giữ nguyên tuyệt đối |
| `course_faqs` | 8 | 8 | 0 | Giữ nguyên tuyệt đối |
| `chapters` | 12 | 12 | 0 | Giữ nguyên tuyệt đối |
| `lessons` | 7 | 7 | 0 | Giữ nguyên tuyệt đối |
| `users` | 11 | 11 | 0 | Giữ nguyên tuyệt đối |
| `categories` | 3 | 3 | 0 | Giữ nguyên tuyệt đối |

Khẳng định: Không có dữ liệu nào bị ghi đè, sửa đổi hoặc xóa trong quá trình thực hiện Step 1.

---

## 11. REMAINING ISSUES

- Các Services hiện tại (`course.service.ts`, `chapter.service.ts`, `lesson.service.ts`, `teacher.service.ts`, `admin.service.ts`) vẫn đang hoạt động thông qua `models/legacy/`.
- Chưa có Functional Repositories cho Course, Chapter và Lesson.
- Các vấn đề này nằm đúng lộ trình và sẽ được triển khai lần lượt tại **Step 2 (Functional Repositories)** và **Step 3 (Services Migration)**.

---

## 12. FINAL VERDICT

> **VERDICT: PASS**

- Toàn bộ Mongoose models của Course, Chapter, Lesson đã được chuyển vào `src/models/legacy/`.
- Ba file `course.model.ts`, `chapter.model.ts`, `lesson.model.ts` đã trở thành Zod Application Models chuẩn mực.
- 42/42 tests của Step 1 đạt kết quả PASS.
- 182/182 tests hồi quy đạt kết quả PASS.
- Toàn bộ kiến trúc và hợp đồng API được bảo vệ nguyên vẹn.
- Sẵn sàng bước vào **Phase 3 — Step 2: Functional Course, Chapter & Lesson Repositories**.
