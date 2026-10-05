# PHASE 3 — STEP 2 REPORT
## FUNCTIONAL COURSE, CHAPTER & LESSON REPOSITORIES

> **Status:** COMPLETED & VERIFIED  
> **Phase:** Phase 3 — Step 2  
> **Target Database:** PostgreSQL 16.11 (`tmdemy`) via Prisma ORM 6.4.1  
> **Target Date:** 2026-10-02  
> **Verdict:** PASS  

---

## 1. REPOSITORY FILES CREATED

Đã thiết kế và khởi tạo 3 Functional Repositories và cập nhật export tại module index:

1. **[src/repositories/course.repository.ts](file:///d:/e-learning_server/src/repositories/course.repository.ts)**: Chịu trách nhiệm truy vấn và thao tác dữ liệu bảng `courses` và `course_faqs`.
2. **[src/repositories/chapter.repository.ts](file:///d:/e-learning_server/src/repositories/chapter.repository.ts)**: Chịu trách nhiệm truy vấn và thao tác dữ liệu bảng `chapters`.
3. **[src/repositories/lesson.repository.ts](file:///d:/e-learning_server/src/repositories/lesson.repository.ts)**: Chịu trách nhiệm truy vấn và thao tác dữ liệu bảng `lessons`.
4. **[src/repositories/index.ts](file:///d:/e-learning_server/src/repositories/index.ts)**: Cập nhật xuất bản cả 2 định dạng: namespace export (`courseRepository`, `chapterRepository`, `lessonRepository`) và named function exports trực tiếp.
5. **[scripts/migration-utils/step-02-phase3-repositories.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-02-phase3-repositories.test.ts)**: Bộ kiểm thử độc lập toàn diện.

---

## 2. DANH SÁCH FUNCTION ĐÃ XÂY DỰNG

### 2.1. Course Repository (`src/repositories/course.repository.ts`)
- **Projections (Select Constants):**
  - `COURSE_PUBLIC_SELECT`: Lựa chọn các trường công khai cho danh mục khóa học (id, title, slug, image, price, oldPrice, level, type, sold, view, createdAt, author compact, category compact).
  - `COURSE_COMPACT_SELECT`: Gọn nhẹ cho liên kết đơn hàng, coupon (`id`, `title`, `slug`, `image`, `price`, `type`, `status`).
  - `COURSE_DETAIL_SELECT`: Chi tiết đầy đủ kèm tác giả, danh mục, FAQs (bảng `course_faqs`) và Chapters lồng Lessons.
  - `COURSE_ADMIN_SELECT`: Đầy đủ kèm cờ quản trị `isDestroyed`, tác giả và danh mục.
  - `COURSE_TEACHER_SELECT`: Dành cho trang quản lý của giảng viên.
- **Mutations:**
  - `addCourse(data, tx?)` / `createCourse`: Thêm mới khóa học vào PostgreSQL.
  - `updateCourse(id, data, tx?)`: Cập nhật thông tin khóa học.
  - `updateCourseStatus(id, status, tx?)`: Cập nhật trạng thái duyệt (`APPROVED`, `PENDING`, `REJECTED`).
  - `softDeleteCourse(id, tx?)`: Đánh dấu `isDestroyed = true`.
  - `restoreCourse(id, tx?)`: Khôi phục `isDestroyed = false`.
  - `deleteCourse(id, tx?)`: Xóa cứng bản ghi (Cascade đến FAQs, chapters, lessons).
  - `incrementCourseView(id, amount?, tx?)`: Tăng bộ đếm lượt xem bằng `increment`.
  - `incrementCourseSold(id, amount?, tx?)`: Tăng bộ đếm lượt bán bằng `increment`.
  - `decrementCourseSold(id, amount?, tx?)`: Giảm bộ đếm lượt bán bằng `decrement`.
- **Queries:**
  - `findCourseById(id, optionsOrTx?, tx?)`: Tìm khóa học theo UUID.
  - `findCourseBySlug(slug, optionsOrTx?, tx?)`: Tìm khóa học theo slug.
  - `findCourseDetailBySlug(slug, increaseView?, tx?)`: Tìm chi tiết khóa học, hỗ trợ tăng view tự động nguyên tử.
  - `isCourseSlugTaken(slug, excludeId?, tx?)`: Kiểm tra tính trùng lặp của slug.
  - `findCoursesWithPagination(params, tx?)`: Phân trang, tìm kiếm văn bản và bộ lọc (category, level, type, status, author, price range).
  - `findCoursesByAuthor(authorId, params?, tx?)`: Tìm các khóa học của giáo viên.
  - `countCourses(where?, tx?)`: Đếm số lượng khóa học.
- **CourseFaq Operations:**
  - `addCourseFaq(data, tx?)`: Tạo một FAQ mới gắn vào khóa học.
  - `addCourseFaqs(data[], tx?)`: Tạo nhiều FAQ cùng lúc (batch insert).
  - `findFaqsByCourseId(courseId, tx?)`: Lấy danh sách FAQ sắp xếp theo thứ tự `order: asc`.
  - `deleteFaqsByCourseId(courseId, tx?)`: Dọn dẹp toàn bộ FAQ của khóa học.

### 2.2. Chapter Repository (`src/repositories/chapter.repository.ts`)
- **Projections:**
  - `CHAPTER_PUBLIC_SELECT`: `id`, `title`, `courseId`, `order`, `createdAt`, `updatedAt`.
  - `CHAPTER_WITH_LESSONS_SELECT`: Chương học kèm danh sách bài học sắp xếp theo `order: asc`.
- **Mutations:**
  - `addChapter(data, tx?)` / `createChapter`: Tạo chương học mới.
  - `updateChapter(id, data, tx?)`: Cập nhật tiêu đề, thứ tự.
  - `softDeleteChapter(id, tx?)`: Soft delete (`isDestroyed = true`).
  - `restoreChapter(id, tx?)`: Khôi phục (`isDestroyed = false`).
  - `deleteChapter(id, tx?)`: Xóa cứng chương học.
- **Queries:**
  - `findChapterById(id, optionsOrTx?, tx?)`: Tìm chương học theo UUID.
  - `findChaptersByCourse(courseId, activeOnly?, tx?)`: Lấy các chương của khóa học kèm bài học.
  - `findMaxChapterOrderByCourse(courseId, tx?)`: Tìm giá trị `order` lớn nhất để tự động tính thứ tự kế tiếp (`order + 1`).
  - `countChapters(where?, tx?)`: Đếm số chương học.

### 2.3. Lesson Repository (`src/repositories/lesson.repository.ts`)
- **Projections:**
  - `LESSON_PUBLIC_SELECT`: Ẩn `content` và `videoUrl` để bảo vệ tài sản nội dung khóa học.
  - `LESSON_STUDY_SELECT`: Đầy đủ `content` và `videoUrl` cho học viên được phân quyền.
  - `LESSON_COMPACT_SELECT`: Thu gọn cho mục lục (`id`, `title`, `slug`, `order`, `duration`, `type`, `isDemo`).
- **Mutations:**
  - `addLesson(data, tx?)` / `createLesson`: Tạo bài học mới.
  - `updateLesson(id, data, tx?)`: Cập nhật thông tin bài học.
  - `deleteLesson(id, tx?)`: Xóa cứng bài học.
- **Queries:**
  - `findLessonById(id, optionsOrTx?, tx?)`: Tìm bài học theo UUID.
  - `findLessonBySlugAndCourse(slug, courseId, tx?)`: Tìm theo khóa phức hợp `(slug, courseId)` theo unique index.
  - `findLessonsByChapter(chapterId, optionsOrTx?, tx?)`: Danh sách bài học của một chương.
  - `findLessonsByCourse(courseId, optionsOrTx?, tx?)`: Danh sách toàn bộ bài học của một khóa học.
  - `findMaxLessonOrderByChapter(chapterId, tx?)`: Tìm giá trị `order` lớn nhất trong một chương.
  - `isLessonSlugTakenInCourse(slug, courseId, excludeId?, tx?)`: Kiểm tra tính duy nhất của slug trong cùng một khóa học.
  - `countLessons(where?, tx?)`: Đếm số bài học.

---

## 3. MAPPING REPOSITORY ↔ PRISMA MODELS

| Thực thể Logic | Prisma Model | Table Name | Khóa chính | Ràng buộc quan trọng |
|---|---|---|:---:|---|
| Course | `Course` | `courses` | UUID | `slug` (Unique), FK `authorId` → `users.id`, FK `categoryId` → `categories.id` (`onDelete: SetNull`) |
| CourseFaq | `CourseFaq` | `course_faqs` | UUID | FK `courseId` → `courses.id` (`onDelete: Cascade`), Index `[courseId, order]` |
| Chapter | `Chapter` | `chapters` | UUID | FK `courseId` → `courses.id` (`onDelete: Cascade`), Index `[courseId, order]` |
| Lesson | `Lesson` | `lessons` | UUID | `@@unique([slug, courseId])`, FK `chapterId` → `chapters.id` (`onDelete: Cascade`), FK `courseId` → `courses.id` (`onDelete: Cascade`), FK `authorId` → `users.id` (`onDelete: Restrict`) |

---

## 4. TRANSACTION SUPPORT

- Mọi mutation và query function đều hỗ trợ tham số tùy chọn `tx?: PrismaTransactionClient`.
- Sử dụng pattern chuẩn mực từ Phase 2:
  ```ts
  const client = tx || prisma
  ```
- Hàm phân giải tham số linh hoạt (`resolveCourseClientAndOptions`, `resolveChapterClientAndOptions`, `resolveLessonClientAndOptions`) cho phép truyền options (`select`, `include`) hoặc trực tiếp `tx`.
- Nếu caller (Service layer) truyền một interactive transaction client `tx`, hàm sẽ tự động tham gia vào transaction đó mà không tạo transaction mới, đảm bảo tính nguyên tử (Atomicity) và khả năng rollback 100%.

---

## 5. TYPE SAFETY VÀ GIẢI TRÌNH CÁC TRƯỜNG HỢP `any`

- **Tận dụng Type do Prisma sinh:** Các kiểu dữ liệu đầu vào như `Prisma.CourseCreateInput`, `Prisma.CourseUpdateInput`, `Prisma.ChapterCreateInput`, `Prisma.LessonCreateInput` được sử dụng chính xác.
- **Giải trình các vị trí sử dụng `any`:**
  - Trong các hàm query linh hoạt như `findCourseById(id, optionsOrTx?, tx?): Promise<any | null>`: Kiểu trả về khai báo là `any | null` vì Prisma trả về kiểu dữ liệu động tùy thuộc vào việc caller truyền `select` hay `include` nào vào `options`. Khi Service gọi, dữ liệu sẽ được parse hoặc ép kiểu an toàn thông qua Zod Application Models (`coursePublicSchema`, `courseDetailResponseSchema`, v.v.).

---

## 6. TEST RESULTS

Đã xây dựng và thực thi thành công bộ test suite độc lập cho Step 2 tại [scripts/migration-utils/step-02-phase3-repositories.test.ts](file:///d:/e-learning_server/scripts/migration-utils/step-02-phase3-repositories.test.ts):

```text
================================================================================
  TEST SUITE: PHASE 3 STEP 2 — FUNCTIONAL COURSE, CHAPTER & LESSON REPOSITORIES
================================================================================

  Initial Database State:
    - courses: 8 (expected: 8)
    - course_faqs: 8 (expected: 8)
    - chapters: 12 (expected: 12)
    - lessons: 7 (expected: 7)
    - users: 11 (expected: 11)
    - categories: 3 (expected: 3)

--- GROUP 1: Prisma Select Constants & Projections ---
  ✓ PASS: [Projections] COURSE_PUBLIC_SELECT contains storefront discovery fields
  ✓ PASS: [Projections] COURSE_PUBLIC_SELECT excludes internal isDestroyed flag
  ✓ PASS: [Projections] COURSE_PUBLIC_SELECT includes author and category relations
  ✓ PASS: [Projections] COURSE_COMPACT_SELECT is lightweight
  ✓ PASS: [Projections] COURSE_DETAIL_SELECT includes nested syllabus and faqs
  ✓ PASS: [Projections] COURSE_ADMIN_SELECT includes admin audit flags
  ✓ PASS: [Projections] CHAPTER_PUBLIC_SELECT contains chapter metadata
  ✓ PASS: [Projections] CHAPTER_WITH_LESSONS_SELECT nests lesson array
  ✓ PASS: [Projections] LESSON_PUBLIC_SELECT strictly protects premium content and video URL
  ✓ PASS: [Projections] LESSON_STUDY_SELECT provides study materials for authorized learners
  ✓ PASS: [Projections] LESSON_COMPACT_SELECT provides navigation attributes

--- GROUP 2: Query Operations on Root Prisma Client ---
  ✓ PASS: [CourseQuery] findCourseById locates course by primary UUID
  ✓ PASS: [CourseQuery] findCourseById returns null for unknown UUID
  ✓ PASS: [CourseQuery] findCourseBySlug locates course by unique slug
  ✓ PASS: [CourseQuery] findCourseDetailBySlug resolves detail with chapters
  ✓ PASS: [CourseQuery] isCourseSlugTaken returns true for existing slug
  ✓ PASS: [CourseQuery] isCourseSlugTaken returns false for available slug
  ✓ PASS: [CourseQuery] isCourseSlugTaken respects excludeId for self
  ✓ PASS: [CourseQuery] findCoursesWithPagination returns structured paginated payload
  ✓ PASS: [CourseQuery] findCoursesWithPagination filters by title search
  ✓ PASS: [CourseQuery] countCourses matches total courses in database
  ✓ PASS: [CourseQuery] findFaqsByCourseId returns FAQs array
  ✓ PASS: [ChapterQuery] findChapterById locates chapter by UUID
  ✓ PASS: [ChapterQuery] findChaptersByCourse returns chapters for course
  ✓ PASS: [ChapterQuery] findMaxChapterOrderByCourse returns valid integer order
  ✓ PASS: [ChapterQuery] countChapters matches total chapters in database
  ✓ PASS: [LessonQuery] findLessonById locates lesson by UUID
  ✓ PASS: [LessonQuery] findLessonBySlugAndCourse locates lesson by compound key
  ✓ PASS: [LessonQuery] findLessonsByChapter returns lessons
  ✓ PASS: [LessonQuery] findLessonsByCourse returns lessons
  ✓ PASS: [LessonQuery] findMaxLessonOrderByChapter returns valid integer order
  ✓ PASS: [LessonQuery] isLessonSlugTakenInCourse returns true for existing slug in course
  ✓ PASS: [LessonQuery] isLessonSlugTakenInCourse returns false for unused slug
  ✓ PASS: [LessonQuery] countLessons matches total lessons in database

--- GROUP 3: Transactional Mutation Suite (Guaranteed Rollback) ---
  ✓ PASS: [TxCourse] addCourse creates course with valid UUID
  ✓ PASS: [TxCourse] addCourse defaults status to PENDING
  ✓ PASS: [TxCourse] updateCourse mutates description
  ✓ PASS: [TxCourse] updateCourse mutates price
  ✓ PASS: [TxCourse] updateCourseStatus updates status to APPROVED
  ✓ PASS: [TxCourse] incrementCourseView atomically increments view count
  ✓ PASS: [TxCourse] incrementCourseSold atomically increments sold count
  ✓ PASS: [TxCourse] decrementCourseSold atomically decrements sold count
  ✓ PASS: [TxCourse] softDeleteCourse sets isDestroyed = true
  ✓ PASS: [TxCourse] restoreCourse sets isDestroyed = false
  ✓ PASS: [TxCourseFaq] addCourseFaq creates single FAQ linked to course
  ✓ PASS: [TxCourseFaq] addCourseFaqs inserts multiple FAQs in batch
  ✓ PASS: [TxCourseFaq] findFaqsByCourseId retrieves all 3 created FAQs
  ✓ PASS: [TxCourseFaq] deleteFaqsByCourseId purges all FAQs
  ✓ PASS: [TxChapter] addChapter creates chapter with valid UUID
  ✓ PASS: [TxChapter] addChapter sets order correctly
  ✓ PASS: [TxChapter] findMaxChapterOrderByCourse calculates max sequence in tx
  ✓ PASS: [TxChapter] updateChapter mutates chapter title
  ✓ PASS: [TxChapter] softDeleteChapter sets isDestroyed = true
  ✓ PASS: [TxChapter] restoreChapter sets isDestroyed = false
  ✓ PASS: [TxLesson] addLesson creates lesson with valid UUID
  ✓ PASS: [TxLesson] addLesson preserves boolean flags
  ✓ PASS: [TxLesson] findMaxLessonOrderByChapter calculates max sequence
  ✓ PASS: [TxLesson] updateLesson mutates duration and isDemo
  ✓ PASS: [TxLesson] deleteLesson hard deletes lesson
  ✓ PASS: [TxLesson] Deleted lesson is null in subsequent tx query
  ✓ PASS: [TxCascade] Lesson created for cascade test
  ✓ PASS: [TxCascade] deleteChapter hard deletes chapter
  ✓ PASS: [TxCascade] Lessons in deleted chapter are cascaded by PostgreSQL foreign key
  ✓ PASS: [TxCascade] deleteCourse hard deletes course and its remaining relations
  ✓ PASS: [Isolation] Transaction successfully intercepted and rolled back cleanly

--- GROUP 4: Database Zero-Mutation Verification ---
  Final Database State:
    - courses: 8 (initial: 8)
    - course_faqs: 8 (initial: 8)
    - chapters: 12 (initial: 12)
    - lessons: 7 (initial: 7)
    - users: 11 (initial: 11)
    - categories: 3 (initial: 3)

  ✓ PASS: [Isolation] Database zero-mutation assertion: courses count unchanged (8)
  ✓ PASS: [Isolation] Database zero-mutation assertion: course_faqs count unchanged (8)
  ✓ PASS: [Isolation] Database zero-mutation assertion: chapters count unchanged (12)
  ✓ PASS: [Isolation] Database zero-mutation assertion: lessons count unchanged (7)
  ✓ PASS: [Isolation] Database zero-mutation assertion: users count unchanged (11)
  ✓ PASS: [Isolation] Database zero-mutation assertion: categories count unchanged (3)
================================================================================
  STEP 2 TEST RESULTS: TOTAL: 71 | PASSED: 71 | FAILED: 0
================================================================================
```

---

## 7. REGRESSION RESULTS

Đã thực thi toàn bộ các test suite hồi quy trên toàn hệ thống:

| Test Suite | Đường dẫn file | Số tests | Kết quả | Trạng thái |
|---|---|:---:|:---:|:---:|
| **Phase 3 Step 2 Repositories** | `scripts/migration-utils/step-02-phase3-repositories.test.ts` | 71 | 71 PASS, 0 FAIL | **PASS** |
| **Phase 3 Step 1 Zod Models** | `scripts/migration-utils/step-01-phase3-zod-models.test.ts` | 42 | 42 PASS, 0 FAIL | **PASS** |
| **Phase 2 Step 1 User Zod Models** | `scripts/migration-utils/step-01-zod-model.test.ts` | 17 | 17 PASS, 0 FAIL | **PASS** |
| **Phase 2 Step 2 User & Cat Repos** | `scripts/migration-utils/step-02-repositories.test.ts` | 53 | 53 PASS, 0 FAIL | **PASS** |
| **Phase 2 Step 3 User & Cat Services**| `scripts/migration-utils/step-03-services.test.ts` | 67 | 67 PASS, 0 FAIL | **PASS** |
| **Phase 2 Step 4 Auth & Middleware** | `scripts/migration-utils/step-04-middleware-auth.test.ts` | 45 | 45 PASS, 0 FAIL | **PASS** |
| **Phase 1 Infrastructure** | `scripts/test-phase1-foundation.ts` | 39 | 39 PASS, 0 FAIL | **PASS** |
| **TỔNG CỘNG** | — | **334** | **334 PASS, 0 FAIL** | **100% PASS** |

Không có bất kỳ lỗi suy giảm chất lượng nào được ghi nhận.

---

## 8. DATABASE RECORD COUNTS TRƯỚC VÀ SAU TEST

| Bảng (Table) | Số lượng trước test | Số lượng sau test | Biến động | Kết luận |
|---|:---:|:---:|:---:|:---:|
| `courses` | 8 | 8 | 0 | Giữ nguyên tuyệt đối |
| `course_faqs` | 8 | 8 | 0 | Giữ nguyên tuyệt đối |
| `chapters` | 12 | 12 | 0 | Giữ nguyên tuyệt đối |
| `lessons` | 7 | 7 | 0 | Giữ nguyên tuyệt đối |
| `users` | 11 | 11 | 0 | Giữ nguyên tuyệt đối |
| `categories` | 3 | 3 | 0 | Giữ nguyên tuyệt đối |

---

## 9. CÁC VẤN ĐỀ PHÁT HIỆN

1. **Khóa phức hợp Lesson Unique:**
   - Trong `prisma/schema.prisma`, bài học có ràng buộc `@@unique([slug, courseId])`. Khi tìm bài học bằng `slug` và `courseId`, phải sử dụng cấu trúc `slug_courseId: { slug, courseId }`. Repository đã triển khai chính xác theo cú pháp này.
2. **Cascade Delete vật lý:**
   - Khóa học bị hard-delete sẽ tự động xóa sạch các bản ghi con `course_faqs`, `chapters` và `lessons` thông qua ràng buộc Foreign Key `onDelete: Cascade` cấp PostgreSQL. Cơ chế này đã được xác thực an toàn qua test mutation trong transaction rollback.

---

## 10. XÁC NHẬN PHẠM VI AN TOÀN

- **Mã nguồn Services:** Hoàn toàn **chưa được kết nối** với các Repository mới. Vẫn giữ nguyên 100% trạng thái hoạt động với Legacy Models.
- **Controllers, Routes, Middlewares:** Hoàn toàn **không bị chỉnh sửa**.
- **Prisma Schema (`prisma/schema.prisma`):** Hoàn toàn **không bị chỉnh sửa (0 mutation)**.
- **Database PostgreSQL & MongoDB:** Dữ liệu được bảo toàn nguyên vẹn.

---

## 11. KẾT LUẬN (FINAL VERDICT)

> **FINAL VERDICT: PASS**

- Ba Functional Repositories cho Course, Chapter, Lesson đã được hoàn thành với kiến trúc functional thuần khiết.
- Đầy đủ các phép toán truy vấn, đột biến, phân trang, lọc và bảo vệ trường nhạy cảm.
- Hỗ trợ transaction client 100%.
- Toàn bộ 334/334 tests (bao gồm 71 test mới và 263 test hồi quy) đạt kết quả PASS.
- Sẵn sàng bước vào **Phase 3 — Step 3: Course, Chapter & Lesson Services Migration** khi được phê duyệt.
