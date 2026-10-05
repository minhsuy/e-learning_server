# AUDIT & STANDARDIZATION REPORT: ZOD APPLICATION MODELS

**Project:** TMDEMY E-Learning Backend  
**Document:** `docs/migration/zod-application-model-audit.md`  
**Date:** October 2, 2026  
**Scope:** Complete Audit & Standardization of `src/models/*.model.ts`  
**Target Architecture:** Functional Architecture (Express Validator at HTTP boundary -> Controller -> Service with Zod boundary protection -> Functional Repository -> Prisma Client Singleton -> PostgreSQL 16.11)

---

## A. AUDIT SUMMARY

An exhaustive audit of all 19 files in `src/models/*.model.ts` was conducted to determine whether Zod schemas are actively used for runtime validation (`.parse()` / `.safeParse()`), used strictly for TypeScript typing (`z.infer`), imported but unused, or defined without runtime integration.

### High-Level Metrics

* **Total Models Audited:** 19 models in `src/models/`.
* **Standardized Pure Zod Application Models (PostgreSQL Stack):** 5 models
  * `user.model.ts` (Phase 2): Fully standardized with runtime validation at Service boundary (`createTeacherService`) and Repository projections.
  * `category.model.ts` (Phase 2): Standardized from orphaned legacy Mongoose model to pure Zod Application Model with runtime validation in `createCategoryService`.
  * `course.model.ts` (Phase 3 Step 1): Pure Zod Application Model; tested in Step 1 & Step 2 test suites.
  * `chapter.model.ts` (Phase 3 Step 1): Pure Zod Application Model; tested in Step 1 & Step 2 test suites.
  * `lesson.model.ts` (Phase 3 Step 1): Pure Zod Application Model; tested in Step 1 & Step 2 test suites.
* **Unmigrated Mongoose Models (MongoDB Legacy Stack):** 14 models
  * `certificate`, `comment`, `conversation`, `coupon`, `enrollment`, `favoriteCourse`, `message`, `notification`, `order`, `progress`, `question`, `quiz`, `quizSubmission`, `rating`.
  * These 14 models remain untouched to preserve backward compatibility for unmigrated modules across Phases 4–10 according to project rules.

---

## B. MODEL USAGE MATRIX

| Model File | Runtime Validation (`.parse()` / `.safeParse()`) | Type-only Usage (`z.infer`) | Unused / Orphaned Schemas | Current Status & Classification |
| :--- | :--- | :--- | :--- | :--- |
| **`user.model.ts`** | **YES**<br>• `createTeacherPayloadSchema.safeParse()` in `admin.service.ts`<br>• `userPublicSchema.parse()` in `user.repository.ts`<br>• `userInternalSchema.parse()` in `user.repository.ts` | **YES**<br>• `User`, `UserPublic`, `UserInternal`, `CreateTeacherPayload`, `CreateTeacherInput` | None. All schemas aligned with application layers. | **A. Runtime Validation** & **B. Type-only**<br>(Standardized & Active) |
| **`category.model.ts`** | **YES**<br>• `createCategoryInputSchema.safeParse()` in `category.service.ts` | **YES**<br>• `Category`, `CategoryPublic`, `CreateCategoryInput`, `UpdateCategoryInput` | None. Legacy Mongoose isolated to `category.legacy.model.ts`. | **A. Runtime Validation** & **B. Type-only**<br>(Standardized & Active) |
| **`course.model.ts`** | **YES (Test Suites)**<br>• Validated in `step-01-phase3-zod-models.test.ts` & `zod-models-audit.test.ts` | **YES**<br>• `Course`, `CoursePublic`, `CourseCompact`, `CreateCourseInput` | Service integration scheduled for Phase 3 Step 3. | **A. Runtime Validation (Tests)** & **B. Type-only**<br>(Ready for Phase 3 Step 3) |
| **`chapter.model.ts`** | **YES (Test Suites)**<br>• Validated in `step-01-phase3-zod-models.test.ts` & `zod-models-audit.test.ts` | **YES**<br>• `Chapter`, `ChapterPublic`, `CreateChapterInput` | Service integration scheduled for Phase 3 Step 3. | **A. Runtime Validation (Tests)** & **B. Type-only**<br>(Ready for Phase 3 Step 3) |
| **`lesson.model.ts`** | **YES (Test Suites)**<br>• Validated in `step-01-phase3-zod-models.test.ts` & `zod-models-audit.test.ts` | **YES**<br>• `Lesson`, `LessonPublic`, `CreateLessonInput` | Service integration scheduled for Phase 3 Step 3. | **A. Runtime Validation (Tests)** & **B. Type-only**<br>(Ready for Phase 3 Step 3) |
| **`certificate.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 7) |
| **`comment.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 8) |
| **`conversation.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 9) |
| **`coupon.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 6) |
| **`enrollment.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 6) |
| **`favoriteCourse.model.ts`**| **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 7) |
| **`message.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 9) |
| **`notification.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 10) |
| **`order.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 6) |
| **`progress.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 7) |
| **`question.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 4) |
| **`quiz.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 4) |
| **`quizSubmission.model.ts`**| **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 5) |
| **`rating.model.ts`** | **NO** (Legacy Mongoose) | N/A (Mongoose Document) | N/A | **Unmigrated** (Phase 7) |

---

## C. DETAILED FINDINGS

### 1. `src/models/user.model.ts`
* **Definition File:** `src/models/user.model.ts`
* **Import Locations:**
  * `src/repositories/user.repository.ts`
  * `src/services/admin.service.ts`
  * `src/types/type.d.ts`
  * `scripts/migration-utils/step-01-zod-model.test.ts`
  * `scripts/migration-utils/step-02-repositories.test.ts`
  * `scripts/migration-utils/zod-models-audit.test.ts`
* **Usage & Boundary Details:**
  * `userPublicSchema.parse(result)`: Used in `findUserPublicById` and `findUserPublicByEmail` to guarantee that output structures strictly match the public contract.
  * `userInternalSchema.parse(result)`: Used in `findUserInternalById` for internal credential operations.
  * `createTeacherPayloadSchema.safeParse(payload)`: Integrated at the entry of `createTeacherService` in `src/services/admin.service.ts`. If invalid, immediately returns `{ success: false, statusCode: 400, message: 'Invalid teacher input data', errors: ... }`.
  * `CreateTeacherInput` & `CreateTeacherPayload`: Exported and synchronized with `src/types/type.d.ts`.
* **Runtime Validation:** **ACTIVE**.
* **Integration Status:** Complete.

### 2. `src/models/category.model.ts`
* **Discovery During Audit:** Prior to this task, `src/models/category.model.ts` was an unmigrated Mongoose model that had 0 imports across the codebase (orphaned), while `category.service.ts` and `category.repository.ts` were already migrated to Prisma in Phase 2 Step 2 & Step 3.
* **Remediation Performed:**
  * Preserved legacy Mongoose schema in `src/models/legacy/category.legacy.model.ts`.
  * Rewrote `src/models/category.model.ts` as a pure Zod Application Model defining `categorySchema`, `categoryPublicSchema`, `categoryCompactSchema`, `createCategoryInputSchema`, and `updateCategoryInputSchema`.
  * Integrated `createCategoryInputSchema.safeParse(payload)` inside `createCategoryService()` in `src/services/category.service.ts`.
* **Runtime Validation:** **ACTIVE**.
* **Integration Status:** Complete.

### 3. `src/models/course.model.ts`, `src/models/chapter.model.ts`, `src/models/lesson.model.ts`
* **Definition Files:**
  * `src/models/course.model.ts`
  * `src/models/chapter.model.ts`
  * `src/models/lesson.model.ts`
* **Current Usage:**
  * Transformed to pure Zod Application Models in Phase 3 Step 1.
  * Tested extensively in `scripts/migration-utils/step-01-phase3-zod-models.test.ts`, `step-02-phase3-repositories.test.ts`, and `zod-models-audit.test.ts`.
  * In Phase 3 Step 2, repositories use Prisma Select projections (`COURSE_PUBLIC_SELECT`, `CHAPTER_PUBLIC_SELECT`, `LESSON_PUBLIC_SELECT`) aligned with these domain schemas.
* **Runtime Validation:** Fully tested at schema layer; runtime boundary validation in services will be connected in Phase 3 Step 3 (Services Migration).
* **Integration Status:** Ready for Step 3.

---

## D. `createTeacherService` IN-DEPTH AUDIT

A detailed audit of `createTeacherService()` in `src/services/admin.service.ts` was conducted to address all 6 questions:

### 1. Was `ICreateTeacherInput` inferred from a Zod schema?
* **Initial State:** **No.** `ICreateTeacherInput` was manually defined in `src/types/type.d.ts` (lines 55–69) as a raw TypeScript interface.
* **Standardized State:** We defined `createTeacherPayloadSchema` and `createTeacherInputSchema` in `src/models/user.model.ts`. In `src/types/type.d.ts`, `ICreateTeacherInput` is now explicitly aliased:
  ```ts
  import type { CreateTeacherInput } from '~/models/user.model'
  export type ICreateTeacherInput = CreateTeacherInput
  ```
  This eliminates duplicate type declarations and ensures TypeScript type safety is directly derived from Zod.

### 2. Is `payload` runtime validated?
* **At HTTP Boundary:** Express Validator (`createTeacherValidator` in `src/middlewares/admin.middleware.ts`) validates the syntax of `req.body` (e.g. checking length, email format, rejecting `role` override).
* **At Service Boundary:** Initially, `createTeacherService` did NOT validate `payload` at runtime. Now, `createTeacherService` explicitly executes:
  ```ts
  const parseResult = createTeacherPayloadSchema.safeParse(payload)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: 'Invalid teacher input data',
      errors: parseResult.error.flatten().fieldErrors
    }
  }
  ```
  Runtime validation is now active and enforced at both boundaries.

### 3. Where does validation occur?
* **Middleware (`src/middlewares/admin.middleware.ts`):** Validates incoming HTTP request syntax and rejects unwanted fields (`role`).
* **Controller (`src/controller/admin.controller.ts`):** Acts as a pure dispatcher: receives `req.body` and passes `{ payload: req.body }` to the service.
* **Service (`src/services/admin.service.ts`):** 
  * Validates payload structure and constraints via Zod `createTeacherPayloadSchema.safeParse(payload)`.
  * Verifies business conflicts (`emailConflict`, `usernameConflict`) via `findUserConflict()`.

### 4. Was there confusion between type safety and runtime validation?
* **Yes.** Relying solely on TypeScript's `payload: ICreateTeacherInput` created a false sense of security. TypeScript types are erased at compile time. Any programmatic invocation of `createTeacherService` (e.g., from cron jobs, internal services, seeders, or unit tests) could pass invalid data (e.g. empty passwords or malformed usernames) without detection.

### 5. Was there a risk of invalid data entering the Service directly?
* **Yes.** Without service boundary validation, bad input could reach `bcrypt.hash(password, 10)` or PostgreSQL queries. With `createTeacherPayloadSchema.safeParse()`, invalid data is rejected with a `400` status before any hashing or database calls occur.

### 6. Are `role`, `status`, and `isVerified` strictly controlled by business logic?
* **Yes.**
  * In `src/middlewares/admin.middleware.ts`, `body('role').not().exists()` rejects client attempts to supply a `role`.
  * In `createTeacherService`, `role`, `status`, and `isVerified` are hardcoded by system business logic:
    ```ts
    role: PrismaUserRole.TEACHER,
    status: PrismaUserStatus.ACTIVE,
    isVerified: true
    ```
  * Client payload values cannot override system roles.

---

## E. CHANGES MADE

1. **`src/models/user.model.ts`**:
   * Added `createTeacherPayloadSchema` and `createTeacherInputSchema`.
   * Exported inferred types `CreateTeacherPayload` and `CreateTeacherInput`.
2. **`src/models/legacy/category.legacy.model.ts`**:
   * Created to isolate legacy Mongoose Category model for fallback and unmigrated modules.
3. **`src/models/category.model.ts`**:
   * Replaced orphaned Mongoose code with pure Zod Application Model (`categorySchema`, `categoryPublicSchema`, `categoryCompactSchema`, `createCategoryInputSchema`, `updateCategoryInputSchema`).
4. **`src/types/type.d.ts`**:
   * Replaced manual `ICreateTeacherInput` interface with `export type ICreateTeacherInput = CreateTeacherInput`.
5. **`src/services/admin.service.ts`**:
   * Added Zod runtime validation in `createTeacherService` using `createTeacherPayloadSchema.safeParse(payload)`.
6. **`src/services/category.service.ts`**:
   * Added Zod runtime validation in `createCategoryService` using `createCategoryInputSchema.safeParse(payload)`.
7. **`scripts/migration-utils/zod-models-audit.test.ts`**:
   * Created comprehensive test suite verifying schemas, service runtime validation, and database zero-leakage.

---

## F. TEST & REGRESSION RESULTS

### 1. New Zod Application Models Audit Suite
* **Script:** `scripts/migration-utils/zod-models-audit.test.ts`
* **Command:** `cmd /c npx tsx scripts/migration-utils/zod-models-audit.test.ts`
* **Result:** **33/33 PASSED (0 FAILED)**
* **Coverage:**
  * Suite 1: User Application Model Schemas (7 tests) — PASS
  * Suite 2: Category Application Model Schemas (6 tests) — PASS
  * Suite 3: Course, Chapter & Lesson Model Schemas (3 tests) — PASS
  * Suite 4: `createTeacherService` Service Boundary Validation (8 tests) — PASS
  * Suite 5: `createCategoryService` Service Boundary Validation (4 tests) — PASS
  * Suite 6: Database State & Record Count Preservation (5 tests) — PASS

### 2. Phase 2 Step 2 Repositories Regression
* **Script:** `scripts/migration-utils/step-02-repositories.test.ts`
* **Result:** **53/53 PASSED (0 FAILED)**

### 3. Phase 2 Step 3 Services Regression
* **Script:** `scripts/migration-utils/step-03-services.test.ts`
* **Result:** **67/67 PASSED (0 FAILED)**

### 4. Phase 3 Step 1 Zod Models Regression
* **Script:** `scripts/migration-utils/step-01-phase3-zod-models.test.ts`
* **Result:** **42/42 PASSED (0 FAILED)**

### 5. Phase 3 Step 2 Repositories Regression
* **Script:** `scripts/migration-utils/step-02-phase3-repositories.test.ts`
* **Result:** **71/71 PASSED (0 FAILED)**

### 6. TypeScript Typecheck
* **Command:** `cmd /c npx tsc --noEmit`
* **Result:**
  * **0 errors** in any migrated file (`user.model.ts`, `category.model.ts`, `course.model.ts`, `chapter.model.ts`, `lesson.model.ts`, `admin.service.ts`, `category.service.ts`, `user.service.ts`, repositories, or `type.d.ts`).
  * Pre-existing TypeScript errors in unmigrated Phase 4–10 files (`comment.controller.ts`, `coupon.controller.ts`, `pdfGenerator.ts`, etc.) remain identical and isolated to those future phases.

---

## G. REMAINING ISSUES

1. **Course, Chapter, Lesson Service Integration:**
   * Schemas and repositories are fully implemented and tested.
   * Runtime service validation will be connected in Phase 3 Step 3 (`course.service.ts`, `chapter.service.ts`, `lesson.service.ts`).
2. **Unmigrated Phase 4–10 Models:**
   * 14 Mongoose models remain in `src/models/*.model.ts`. They will be migrated to Zod Application Models in their designated phases.

---

## H. FINAL VERDICT

**STATUS: READY**

* All Application Models for migrated entities (User, Category, Course, Chapter, Lesson) are pure Zod schemas completely free from Mongoose and Prisma dependencies.
* Runtime validation is active at appropriate boundaries without changing API contracts or HTTP status codes.
* All regression test suites pass with 100% success rate (266 total automated tests executed and passing across Phase 1, Phase 2, and Phase 3 suites).
