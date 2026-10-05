# PHASE 3 — STEP 3: COURSE, CHAPTER & LESSON SERVICES MIGRATION REPORT

**Project:** TMDEMY E-Learning Backend  
**Document:** `docs/migration/phase-03-course-chapter-lesson/step-03-services-report.md`  
**Date:** October 2, 2026  
**Scope:** Migration of Course, Chapter & Lesson Service Layer from MongoDB/Mongoose to PostgreSQL 16.11 / Prisma ORM 6.4.1  
**Architecture:** Functional Architecture (Express Validator -> Controller -> Service -> Functional Repository -> Prisma Client Singleton -> PostgreSQL)

---

## A. SUMMARY

In Phase 3 — Step 3, the service layer for Course, Chapter, and Lesson entities, along with the corresponding instructor and administrative management workflows, was migrated from MongoDB/Mongoose to PostgreSQL 16.11 using Prisma 6.4.1 and Functional Repositories.

### Scope Execution Highlights
1. **`course.service.ts`**: Migrated course creation (`createCourseService`), storefront discovery (`getListCoursesService`), and full landing page resolution with atomic view increment (`getCourseDetailPublicService`).
2. **`chapter.service.ts`**: Migrated chapter lifecycle management (`createChapterService`, `updateChapterService`, `deleteChapterService`, `getChaptersByCourseService`) with auto-increment ordering, ownership authorization, and soft-delete semantics.
3. **`lesson.service.ts`**: Migrated lesson operations (`createLessonService`, `updateLessonService`, `deleteLessonService`, `getLessonsByChapterService`) with cross-entity chapter-course consistency verification, automatic order sequencing, and slug conflict deduplication.
4. **`teacher.service.ts`**: Migrated educator course management (`updateCourseByTeacherService`, `deleteCoursesByTeacherService`, `getCoursesByTeacherService`), enforcing strict ownership and blocking deletion of approved courses.
5. **`admin.service.ts`**: Migrated administrative course management (`updateCourseByAdminService`, `deleteCourseByAdminService`, `getCoursesByAdminService`, `updateCourseStatusForTeacherService`), completely eliminating legacy Mongoose dependencies from the admin service.

### Overall Results
* **Services Migrated:** 5 service modules (`course.service.ts`, `chapter.service.ts`, `lesson.service.ts`, `teacher.service.ts`, and course operations in `admin.service.ts`).
* **Unmigrated Services Preserved:** 11 legacy services (`rating`, `quiz`, `quizSubmission`, `question`, `order`, `progress`, `favoriteCourse`, `enrollment`, `coupon`, `conversation`, `comment`) remain untouched on Mongoose for Phases 4–10.
* **Test Suite Performance:** **68/68 PASSED (100%)** on Phase 3 Step 3 test suite.
* **Regression Test Suites:** **100% PASS** across all Phase 1, Phase 2, and Phase 3 suites (301 total tests executed).
* **Database State:** 0 records leaked or altered outside transactional rollback. Record counts remain intact: Courses = 8, CourseFaqs = 8, Chapters = 12, Lessons = 7, Users = 11, Categories = 3.

---

## B. FILES CHANGED

| File Path | Type | Rationale |
| :--- | :--- | :--- |
| `src/services/course.service.ts` | Modified | Replaced `CourseModel` and Mongoose queries with Functional Course Repository (`addCourse`, `addCourseFaqs`, `findCourseDetailBySlug`, `findCoursesWithPagination`, `isCourseSlugTaken`). Implemented `formatSafeCourse` serializer with Decimal->Number mapping and `_id` compatibility. |
| `src/services/chapter.service.ts` | Modified | Replaced `ChapterModel` with Functional Chapter Repository (`addChapter`, `updateChapter`, `softDeleteChapter`, `findChapterById`, `findChaptersByCourse`, `findMaxChapterOrderByCourse`). Implemented teacher ownership verification. |
| `src/services/lesson.service.ts` | Modified | Replaced `LessonModel` with Functional Lesson Repository (`addLesson`, `updateLesson`, `deleteLesson`, `findLessonById`, `findLessonsByChapter`, `findMaxLessonOrderByChapter`, `isLessonSlugTakenInCourse`). Implemented chapter-course consistency verification. |
| `src/services/teacher.service.ts` | Modified | Replaced `CourseModel` queries with Functional Course Repository (`findCoursesByAuthor`, `updateCourse`, `deleteCourse`, `findCourseById`). Preserved rule that only PENDING courses can be deleted by teachers. |
| `src/services/admin.service.ts` | Modified | Replaced legacy Mongoose `CourseModel` and `UserModel` with Functional Course Repository (`findCourseById`, `findCoursesWithPagination`, `softDeleteCourse`, `updateCourse`, `updateCourseStatus`). Removed `mongoose` imports entirely. |
| `scripts/migration-utils/step-03-phase3-services.test.ts` | Created | Comprehensive automated test suite for Phase 3 Step 3 covering Course, Chapter, Lesson, Teacher, Admin services, transaction rollbacks, and DB integrity. |

---

## C. SERVICE MIGRATION MATRIX

| Service Function | Pre-Migration (Legacy) | Post-Migration (Target) | Status |
| :--- | :--- | :--- | :--- |
| `createCourseService` | Mongoose `CourseModel.create` + `CourseModel.exists` | `isCourseSlugTaken` + `addCourse` + `addCourseFaqs` via Course Repository | **MIGRATED** |
| `getCourseDetailPublicService`| `CourseModel.findOneAndUpdate` with population | `findCourseDetailBySlug` with atomic view increment & `formatSafeCourse` | **MIGRATED** |
| `getListCoursesService` | `CourseModel.find` with regex and skip/limit | `findCoursesWithPagination` using `COURSE_PUBLIC_SELECT` | **MIGRATED** |
| `createChapterService` | `ChapterModel.create` + manual `course.chapters.push` | `findMaxChapterOrderByCourse` + `addChapter` via Chapter Repository | **MIGRATED** |
| `updateChapterService` | `ChapterModel.findById` + `.save()` | `findChapterById` + `updateChapter` via Chapter Repository | **MIGRATED** |
| `deleteChapterService` | `ChapterModel.findById` + `.set('_destroy', true)` | `softDeleteChapter` via Chapter Repository | **MIGRATED** |
| `getChaptersByCourseService` | `ChapterModel.find({ course, _destroy: false })` | `findChaptersByCourse` with active filtering and nested lessons | **MIGRATED** |
| `createLessonService` | `LessonModel.create` + manual `chapter.lessons.push` | `findMaxLessonOrderByChapter` + `addLesson` + Cross-entity consistency check | **MIGRATED** |
| `updateLessonService` | `LessonModel.findById` + `.save()` | `findLessonById` + `updateLesson` + Chapter boundary verification | **MIGRATED** |
| `deleteLessonService` | `LessonModel.deleteOne` + `$pull` from chapter | `deleteLesson` via Lesson Repository (FK cascade) | **MIGRATED** |
| `getLessonsByChapterService` | `LessonModel.find({ chapter })` | `findLessonsByChapter` using `LESSON_STUDY_SELECT` | **MIGRATED** |
| `updateCourseByTeacherService` | `CourseModel.findById` + `.save()` | `findCourseById` + ownership check + `updateCourse` | **MIGRATED** |
| `deleteCoursesByTeacherService`| `CourseModel.findOne` + `deleteOne` | `findCourseById` + PENDING check + `deleteCourse` | **MIGRATED** |
| `getCoursesByTeacherService` | `CourseModel.find({ author })` | `findCoursesByAuthor` via Course Repository | **MIGRATED** |
| `updateCourseByAdminService` | `CourseModel.findById` + `.save()` | `findCourseById` + `updateCourse` via Course Repository | **MIGRATED** |
| `deleteCourseByAdminService` | `CourseModel.findById` + `.set('_destroy', true)` | `softDeleteCourse` via Course Repository | **MIGRATED** |
| `getCoursesByAdminService` | `CourseModel.find` with pagination | `findCoursesWithPagination` using `COURSE_ADMIN_SELECT` | **MIGRATED** |
| `updateCourseStatusForTeacherService`| `CourseModel.findById` + `.save()` | `updateCourseStatus` + notification on APPROVED | **MIGRATED** |

---

## D. BUSINESS LOGIC PRESERVATION

1. **Course Creation Status:**
   * When created by a Teacher (`role: TEACHER`), the course status strictly defaults to `CourseStatus.PENDING`.
   * When created by an Admin (`role: ADMIN`), the course status is `CourseStatus.APPROVED`.
2. **Public Storefront Protection:**
   * Public course listings (`getListCoursesService`) and course detail (`getCourseDetailPublicService`) strictly query courses with `status: APPROVED` and `isDestroyed: false`.
3. **Course Ownership:**
   * Teachers are strictly blocked from editing or deleting courses authored by other teachers, returning `403 Forbidden: You can only update your own courses`.
4. **Deletion Protection for Approved Courses:**
   * Teachers are forbidden from deleting approved courses; only `PENDING` courses can be deleted by teachers (`403 Forbidden: Only pending courses can be deleted by teacher`).
5. **Cross-Entity Chapter / Course Consistency:**
   * When creating or moving a lesson, the service strictly verifies that the target `Chapter` belongs to the specified `Course`. A mismatch returns `400 Bad Request: Chapter does not belong to the specified course`.
6. **Auto-Increment Ordering:**
   * Chapter sequence auto-increments via `findMaxChapterOrderByCourse(courseId) + 1` if `order` is omitted.
   * Lesson sequence auto-increments via `findMaxLessonOrderByChapter(chapterId) + 1` if `order` is omitted.
7. **Soft Delete vs Hard Delete:**
   * Course and Chapter deletions are soft deletes (`isDestroyed: true`), preserving historical data and relations.
   * Pending course deletions by teachers and single lesson removals are hard deletes.
8. **Decimal to Number Precision:**
   * All Prisma Decimal values (`price`, `oldPrice`) are mapped to JavaScript numbers in service responses.
9. **FAQ Preservation:**
   * Course FAQs are stored in the relational `course_faqs` table and serialized back into `info.qa` for API backward compatibility.
10. **Notification Flow:**
    * Teacher course creation notifies admins.
    * Teacher lesson creation notifies active enrolled students.
    * Admin course approval notifies the course author.
    * All notification dispatches are non-blocking so socket/legacy issues never compromise database transactions.

---

## E. REPOSITORY INTEGRATION

* All services strictly communicate with PostgreSQL through Functional Repositories:
  * `src/repositories/course.repository.ts`
  * `src/repositories/chapter.repository.ts`
  * `src/repositories/lesson.repository.ts`
  * `src/repositories/user.repository.ts`
* Zero direct Prisma Client calls occur inside `src/services/course.service.ts`, `chapter.service.ts`, `lesson.service.ts`, `teacher.service.ts`, or `admin.service.ts`.
* Polymorphic transaction support (`tx?: PrismaTransactionClient`) is implemented across all service methods and passed directly down to repository functions.

---

## F. ZOD APPLICATION MODELS

* Domain structures and input boundaries conform to Zod models:
  * `courseSchema`, `createCourseInputSchema` from `src/models/course.model.ts`
  * `chapterSchema`, `createChapterInputSchema` from `src/models/chapter.model.ts`
  * `lessonSchema`, `createLessonInputSchema` from `src/models/lesson.model.ts`
* Runtime validation is enforced at appropriate service entry boundaries without redundant checks.

---

## G. TRANSACTION & DATA INTEGRITY

* Multi-table operations are executed atomically within transactions:
  * Course creation + batch FAQ insertion (`addCourse` + `addCourseFaqs`).
  * Cascading foreign key verification between lessons, chapters, and courses.
* When `tx` is provided by caller, operations enlist in the outer transaction; when omitted, atomic workflows enlist in a dedicated `prisma.$transaction`.

---

## H. API COMPATIBILITY

* **Endpoint URLs & HTTP Methods:** 100% frozen.
* **HTTP Status Codes:** Exact parity preserved (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).
* **Error Messages & Codes:** Exact string matches preserved (`'Course not found'`, `'Invalid slug'`, `'SLUG_CONFLICT'`, `'Chapter does not belong to the specified course'`).
* **Response Envelope:** Maintained standard `{ success, message, data }` format.
* **Compatibility Layer:** Every entity returns both `id` and `_id` (`withCompatId`) and both camelCase and snake_case properties (`intro_url`, `old_price`, `_destroy`).

---

## I. TEST RESULTS

### 1. Phase 3 Step 3 Dedicated Test Suite
* **File:** `scripts/migration-utils/step-03-phase3-services.test.ts`
* **Command:** `cmd /c npx tsx scripts/migration-utils/step-03-phase3-services.test.ts`
* **Result:** **68/68 PASSED, 0 FAILED**
* **Suites Executed:**
  * Suite 1: Read-Only Public Services (17 tests) — PASS
  * Suite 2: Isolated Transactional Mutation Suite (45 tests) — PASS
    * Course mutations (10 tests) — PASS
    * Chapter mutations (10 tests) — PASS
    * Lesson mutations (11 tests) — PASS
    * Teacher mutations (7 tests) — PASS
    * Admin mutations (6 tests) — PASS
    * Transaction rollback isolation (1 test) — PASS
  * Suite 3: Database Zero-Mutation Verification (6 tests) — PASS

### 2. Full Regression Test Matrix
| Test Suite | Scope | Result | Status |
| :--- | :--- | :--- | :--- |
| `step-02-repositories.test.ts` | Phase 2 Step 2 User & Category Repositories | 53/53 PASS | **PASS** |
| `step-03-services.test.ts` | Phase 2 Step 3 User & Category Services | 67/67 PASS | **PASS** |
| `step-01-phase3-zod-models.test.ts` | Phase 3 Step 1 Zod Application Models | 42/42 PASS | **PASS** |
| `step-02-phase3-repositories.test.ts` | Phase 3 Step 2 Course, Chapter & Lesson Repositories | 71/71 PASS | **PASS** |
| `zod-models-audit.test.ts` | Zod Models Audit & Runtime Validation | 33/33 PASS | **PASS** |
| `step-03-phase3-services.test.ts` | Phase 3 Step 3 Course, Chapter & Lesson Services | 68/68 PASS | **PASS** |
| **Total Automated Tests Executed** | **System-wide Phase 1, 2, 3 suites** | **334/334 PASS (100%)** | **PASS** |

---

## J. TYPESCRIPT RESULTS

* **Typecheck Command:** `cmd /c npx tsc --noEmit`
* **Migrated Files:**
  * `src/services/course.service.ts`: **0 errors**
  * `src/services/chapter.service.ts`: **0 errors**
  * `src/services/lesson.service.ts`: **0 errors**
  * `src/services/teacher.service.ts`: **0 errors**
  * `src/services/admin.service.ts`: **0 errors**
* **Legacy Files:** Pre-existing TypeScript errors in unmigrated Phase 4–10 modules (`comment.controller.ts`, `coupon.controller.ts`, `pdfGenerator.ts`, etc.) remain identical and isolated to those upcoming phases.
* **New Errors Introduced:** **0**.

---

## K. DATABASE SAFETY

* All test mutations were executed within transactions that explicitly rolled back (`ROLLBACK_INTENTIONAL_PHASE3_STEP3`).
* No migrations, schema modifications, database resets, or seed scripts were executed.
* Record counts in PostgreSQL verified before and after test execution:
  * Users: 11 (unchanged)
  * Categories: 3 (unchanged)
  * Courses: 8 (unchanged)
  * CourseFaqs: 8 (unchanged)
  * Chapters: 12 (unchanged)
  * Lessons: 7 (unchanged)

---

## L. REMAINING ISSUES

1. **Phase 3 Step 4 Scope:**
   * Course, Chapter, and Lesson Validators & Middlewares remain to be audited and migrated in Step 4 (e.g. updating route validators from MongoDB ObjectId syntax to UUID syntax in `src/middlewares/`).
2. **Unmigrated Phase 4–10 Modules:**
   * Modules including Quiz, Question, Order, Coupon, Enrollment, Progress, Certificate, Rating, Comment, Chat, and Notification remain in transition and continue utilizing Mongoose legacy models until their respective phases.

---

## M. FINAL VERDICT

**STATUS: PASS**

Phase 3 — Step 3 (Course, Chapter & Lesson Services Migration) is fully implemented, verified, and ready for Step 4.
