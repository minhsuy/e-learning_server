# Phase 6 Migration Report: Orders, Coupons, CouponCourses & Enrollments

> **Execution Date/Time**: 2026-09-30T15:08:36.789Z  
> **Duration**: 3422ms  
> **Final Verdict**: **PASS**  
> **Status**: Completed successfully with 100% data integrity, orphan order preservation, and isolation.

---

## 1. Executive Summary

| Metric | MongoDB (Source) | PostgreSQL (Target Before) | PostgreSQL (Target After) | Verification Status |
|:---|:---:|:---:|:---:|:---:|
| **orders** | 8 | 0 | **8** | ✅ 100% MATCH (3 Orphans preserved) |
| **coupons** | 2 | 0 | **2** | ✅ 100% MATCH |
| **coupon_courses** | 2 (embedded) | 0 | **2** | ✅ 100% MATCH (Composite PK) |
| **enrollments** | 5 | 0 | **5** | ✅ 100% MATCH |
| **Pre-migrated records** (Phase 1–5) | 79 | 79 | **79** | ✅ UNCHANGED |
| **All other 11 tables** | 24 | 0 | **0** | ✅ STRICTLY ISOLATED |
| **Total documents / rows** | **120** | **79** | **96** | ✅ VERIFIED |

---

## 2. Environment Information

- **MongoDB Source Database**: `e-learning` (MongoDB Atlas)
- **MongoDB Connection Mode**: `READ_ONLY` (Zero writes executed)
- **PostgreSQL Target Database**: `tmdemy` (localhost:5432)
- **PostgreSQL Schema Status**: Intact, unchanged, using Prisma Client with migrations applied
- **Transaction Scope**: Single atomic transaction covering `coupons`, `coupon_courses`, `orders`, and `enrollments` inserts

---

## 3. Entities Migrated

### 3.1. Entity: `coupons`
- **Source Count**: 2 documents
- **Migrated Count**: 2 rows
- **Foreign Key Resolutions**:
  - `author_id` $\rightarrow$ `users.id`: 2/2 valid
- **Fields Preserved**:
  - `code`, `title`, `type` (`PERCENTAGE`), `value` (25), `limit` (50), `used`, `active`, `startDate`, `endDate`, `createdAt`, `updatedAt`

### 3.2. Entity: `coupon_courses`
- **Source Count**: 2 relations (trích xuất từ mảng `coupons[].courses`)
- **Migrated Count**: 2 rows
- **Composite Primary Key**: `@@id([couponId, courseId])`
  - Link 1: Coupon FS25 $\rightarrow$ Course "Fullstack MERN Project"
  - Link 2: Coupon FS255 $\rightarrow$ Course "Fullstack MERN Project"
- **FK Integrity**: 2/2 course references tồn tại hợp lệ trong `courses`.

### 3.3. Entity: `orders`
- **Source Count**: 8 documents
- **Migrated Count**: 8 rows
- **Foreign Key Resolutions**:
  - `user_id` $\rightarrow$ `users.id`: 8/8 valid
  - `course_id` $\rightarrow$ `courses.id`: 5/8 valid references, 3/8 intentional NULL orphan references
- **Orphan Orders Handling (ORPHAN_ORDER_DECISION.md)**:
  - `DH-7806607` $\rightarrow$ `courseId = NULL`
  - `DH-2062171` $\rightarrow$ `courseId = NULL`
  - `DH-2714351` $\rightarrow$ `courseId = NULL`
  - **Lý do**: Các đơn hàng lịch sử tham chiếu đến khóa học đã bị xóa ở MongoDB. Quyết định: bảo toàn lịch sử đơn hàng, gán `courseId = NULL`.

### 3.4. Entity: `enrollments`
- **Source Count**: 5 documents
- **Migrated Count**: 5 rows
- **Foreign Key Resolutions**:
  - `user_id` $\rightarrow$ `users.id`: 5/5 valid
  - `course_id` $\rightarrow$ `courses.id`: 5/5 valid
- **Unique Constraint**: `@@unique([userId, courseId])` 5/5 cặp duy nhất.
- **Fields Preserved**:
  - `progress`, `status` (`ACTIVE`), `enrolledAt`, `createdAt`, `updatedAt`

---

## 4. Deterministic UUID Mapping Verification

### Orders Mapping
| # | Code | MongoDB _id | PostgreSQL UUID v5 | User UUID | Course UUID | Status | Total |
|:---:|:---|:---|:---|:---|:---|:---|:---|
| 1 | DH-5196135 | `68ef547cae8e26580c4f19a8` | `d1cb1f28-b9d9-54d4-8765-347e83edae80` | `6dd1ccd9-420b-5c6d-8322-75223e67e549` | `f0dde7bb-1bf6-5602-a489-cd324132c68a` | COMPLETED | 199.99 |
| 2 | DH-2714351 | `68ebc85ab800ff9b01818de5` | `9f5caf0c-d3e8-5c12-9680-4c7c252f82e6` | `c55de839-f059-519c-8820-b16aa17fb9c3` | **NULL (Orphan)** | COMPLETED | 0 |
| 3 | DH-2464723 | `68e537b09bea269a583ed9e1` | `5e4ed149-77cc-55e2-bf42-204f30a2fd22` | `c55de839-f059-519c-8820-b16aa17fb9c3` | `f0dde7bb-1bf6-5602-a489-cd324132c68a` | COMPLETED | 199.99 |
| 4 | DH-1412271 | `68f1ddc43af8d5cb1c869f20` | `f9956fbe-2c25-512c-b61d-197dd5e38b1d` | `02e8e13a-dab2-5fb6-a14f-933ac125edca` | `f0dde7bb-1bf6-5602-a489-cd324132c68a` | COMPLETED | 199.99 |
| 5 | DH-7806607 | `68e5257e43b2786ec96458e8` | `5bc2c64a-9759-5776-bc4e-693908008d91` | `c55de839-f059-519c-8820-b16aa17fb9c3` | **NULL (Orphan)** | PENDING | 699,000 |
| 6 | DH-2451940 | `68e537a39bea269a583ed9d6` | `c8433382-29c0-556a-ad7b-8086161f2179` | `c55de839-f059-519c-8820-b16aa17fb9c3` | `2d535d8f-0ac6-50a3-b86c-30fc54eeab8a` | COMPLETED | 0 |
| 7 | DH-2760785 | `68ebc888b800ff9b01818dfb` | `53831596-cdac-5662-81b5-de30ba8ea11e` | `c55de839-f059-519c-8820-b16aa17fb9c3` | `60b278f7-1793-5be8-96c6-c13980fe027f` | COMPLETED | 0 |
| 8 | DH-2062171 | `68ebc5ce500211ca4f063445` | `b6e71563-d3b3-5c37-b933-ceebc3859896` | `c55de839-f059-519c-8820-b16aa17fb9c3` | **NULL (Orphan)** | PENDING | 100,000 |

### Coupons Mapping
| # | Code | Title | MongoDB _id | PostgreSQL UUID v5 | Author UUID | Verification |
|:---:|:---|:---|:---|:---|:---|:---:|
| 1 | FS25 | FullStack Mern 25% | `68db532c52576f19efb3925d` | `9ab7f90b-1b48-5f58-a8b0-074bfb524cc4` | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | ✅ MATCH |
| 2 | FS255 | FullStack Mern 250% | `68db535752576f19efb39264` | `2407ef31-489a-5905-81d7-11cf88b3ea3b` | `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | ✅ MATCH |

### Enrollments Mapping
| # | User | Course | MongoDB _id | PostgreSQL UUID v5 | Progress | Status | Verification |
|:---:|:---|:---|:---|:---|:---:|:---:|:---:|
| 1 | minhsuyyyyy | TailwindCSS Masterclass | `68e537a49bea269a583ed9d8` | `3acb5ff8-859b-58c9-a3b6-ff56e45ab790` | 0% | ACTIVE | ✅ MATCH |
| 2 | minhsuyyyyy | ReactJS Advanced | `68e53837d761d319a244bab6` | `7f8e9f5c-6d7b-5ee5-9d20-612860e8ef1c` | 100% | ACTIVE | ✅ MATCH |
| 3 | minhsuyyyyy | Khóa học JS cơ bản 2025 | `68ebc888b800ff9b01818dfd` | `f8fa39bc-cc74-5fa4-93de-bd3449c97dec` | 0% | ACTIVE | ✅ MATCH |
| 4 | thaiminh | ReactJS Advanced | `68f1df6a1a2789bf18d7b7b0` | `41833870-5797-5fc1-a5cb-8a4bed7a9882` | 0% | ACTIVE | ✅ MATCH |
| 5 | teacher_cntt | ReactJS Advanced | `68ef54a21a2789bf18d7b4a0` | `ee9c2af9-dce9-5f8c-9224-2887cfb05808` | 0% | ACTIVE | ✅ MATCH |

---

## 5. PostgreSQL Isolation Verification (All 26 Business Tables)

| # | PostgreSQL Table Name | Row Count Before Phase 6 | Row Count After Phase 6 | Isolation Status |
|:---:|:---|:---:|:---:|:---:|
| 1 | `users` | 7 | **7** | ✅ Unchanged (Phase 1) |
| 2 | `categories` | 3 | **3** | ✅ Unchanged (Phase 1) |
| 3 | `courses` | 8 | **8** | ✅ Unchanged (Phase 2) |
| 4 | `course_faqs` | 8 | **8** | ✅ Unchanged (Phase 2) |
| 5 | `chapters` | 12 | **12** | ✅ Unchanged (Phase 3) |
| 6 | `lessons` | 7 | **7** | ✅ Unchanged (Phase 3) |
| 7 | `quizzes` | 3 | **3** | ✅ Unchanged (Phase 4) |
| 8 | `questions` | 5 | **5** | ✅ Unchanged (Phase 4) |
| 9 | `question_options` | 20 | **20** | ✅ Unchanged (Phase 4) |
| 10 | `quiz_submissions` | 2 | **2** | ✅ Unchanged (Phase 5) |
| 11 | `quiz_submission_answers` | 4 | **4** | ✅ Unchanged (Phase 5) |
| 12 | `orders` | 0 | **8** | ✅ Migrated (Phase 6) |
| 13 | `coupons` | 0 | **2** | ✅ Migrated (Phase 6) |
| 14 | `coupon_courses` | 0 | **2** | ✅ Migrated (Phase 6) |
| 15 | `enrollments` | 0 | **5** | ✅ Migrated (Phase 6) |
| 16 | `progress` | 0 | **0** | ✅ Isolated |
| 17 | `certificates` | 0 | **0** | ✅ Isolated |
| 18 | `ratings` | 0 | **0** | ✅ Isolated |
| 19 | `favorite_courses` | 0 | **0** | ✅ Isolated |
| 20 | `comments` | 0 | **0** | ✅ Isolated |
| 21 | `comment_reactions` | 0 | **0** | ✅ Isolated |
| 22 | `conversations` | 0 | **0** | ✅ Isolated |
| 23 | `conversation_participants` | 0 | **0** | ✅ Isolated |
| 24 | `messages` | 0 | **0** | ✅ Isolated |
| 25 | `message_reads` | 0 | **0** | ✅ Isolated |
| 26 | `notifications` | 0 | **0** | ✅ Isolated |

---

## 6. MongoDB Read-Only Verification

- **Total Collections**: 19 collections
- **Initial Document Count**: 120 documents
- **Final Document Count**: 120 documents
- **Orders Count**: 8 documents (unchanged)
- **Coupons Count**: 2 documents (unchanged)
- **Enrollments Count**: 5 documents (unchanged)
- **Writes Executed on MongoDB**: **0** (Strictly Read-Only)

---

## 7. Constraints & Data Integrity Verification

- **Primary Keys**: 15/15 UUID v5 values and 2/2 composite keys verified valid and collision-free.
- **Unique Constraints**:
  - `orders.code`: 8/8 unique order codes verified.
  - `coupons.code`: 2/2 unique coupon codes verified.
  - `enrollments(userId, courseId)`: 5/5 unique pairs verified.
  - `coupon_courses(couponId, courseId)`: 2/2 unique pairs verified.
- **Foreign Key Integrity**:
  - `orders.user_id` $\rightarrow$ `users.id`: 8/8 Valid.
  - `orders.course_id` $\rightarrow$ `courses.id`: 5/5 Valid, 3/3 Orphan set to NULL per specification.
  - `coupon_courses` $\rightarrow$ `coupons` & `courses`: 2/2 Valid.
  - `enrollments.user_id` $\rightarrow$ `users.id`: 5/5 Valid.
  - `enrollments.course_id` $\rightarrow$ `courses.id`: 5/5 Valid.

---

## 8. Errors & Warnings

- **Critical Errors**: 0
- **Warnings**: 0

---

## 9. Final Verdict

# **PASS**

Phase 6 Migration (Orders, Coupons, CouponCourses, Enrollments) is **100% COMPLETE and VERIFIED**.  
All requirements, isolation boundaries, safety rules, and deterministic mappings were strictly met.
