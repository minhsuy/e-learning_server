# Phase 2 Migration Report: Courses + Course FAQs ONLY

> **Execution Date/Time**: 2026-09-30T14:51:55.144Z  
> **Duration**: 3092ms  
> **Final Verdict**: **PASS**  
> **Status**: Completed successfully with 100% data integrity and isolation.

---

## 1. Executive Summary

| Metric | MongoDB (Source) | PostgreSQL (Target Before) | PostgreSQL (Target After) | Verification Status |
|:---|:---:|:---:|:---:|:---:|
| **courses** | 8 | 0 | **8** | ✅ 100% MATCH |
| **course_faqs** | 8 | 0 | **8** | ✅ 100% MATCH |
| **users** (Phase 1) | 7 | 7 | **7** | ✅ UNCHANGED |
| **categories** (Phase 1) | 3 | 3 | **3** | ✅ UNCHANGED |
| **All other 22 tables** | 102 | 0 | **0** | ✅ STRICTLY ISOLATED |
| **Total documents / rows** | **120** | **10** | **26** | ✅ VERIFIED |

---

## 2. Environment Information

- **MongoDB Source Database**: `e-learning` (MongoDB Atlas)
- **MongoDB Connection Mode**: `READ_ONLY` (Zero writes executed)
- **PostgreSQL Target Database**: `tmdemy` (localhost:5432)
- **PostgreSQL Schema Status**: Intact, unchanged, using Prisma Client with migrations applied
- **Transaction Scope**: Single atomic transaction covering `courses` and `course_faqs` inserts

---

## 3. Entities Migrated

### 3.1. Entity: `courses`
- **Source Count**: 8 documents
- **Migrated Count**: 8 rows
- **Foreign Key Resolutions**:
  - `author_id` $\rightarrow$ `users.id`: 8/8 valid (trỏ chính xác đến các tài khoản admin/teacher đã tạo ở Phase 1)
  - `category_id` $\rightarrow$ `categories.id`: 8/8 valid (trỏ chính xác đến danh mục tương ứng đã tạo ở Phase 1)
- **Enum Normalization**:
  - `type`: `paid` (6) / `free` (2) $\rightarrow$ `CourseType.PAID` / `CourseType.FREE`
  - `status`: `approved` (7) / `pending` (1) $\rightarrow$ `CourseStatus.APPROVED` / `CourseStatus.PENDING`
  - `level`: `beginner` (4) / `intermediate` (3) / `advanced` (1) $\rightarrow$ `CourseLevel`
- **Numerical & Array Normalization**:
  - `price` & `old_price`: Chuyển đổi thành `Prisma.Decimal` tương thích `Decimal(12, 2)`
  - `requirements`, `benefits`, `techniques`, `documents`: Trích xuất từ `info` thành các mảng chuỗi PostgreSQL (`String[]`)

### 3.2. Entity: `course_faqs`
- **Source Count**: 8 embedded FAQs (trích xuất từ `info.qa`)
- **Migrated Count**: 8 rows trong bảng độc lập `course_faqs`
- **Foreign Key**: `course_faqs.course_id` $\rightarrow$ `courses.id` (100% Valid, Cascade Delete)
- **UUID Strategy**: Ánh xạ từ `qa._id` bằng `toPostgresUuid('course_faqs', qa._id)`

---

## 4. Deterministic UUID Mapping Verification

### Courses Mapping
| # | Title | Slug | MongoDB _id | PostgreSQL UUID v5 | Author UUID | Category UUID | Verification |
|:---:|:---|:---|:---|:---|:---|:---|:---:|
| 1 | Machine Learning Fundamentals | machine-learning-fundamentals | `68d3f862e710d52ff77262a7` | `88b09b74-a128-535c-a2ad-6e72e6f45652` | `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` | ✅ MATCH |
| 2 | TailwindCSS Masterclass | tailwindcss-masterclass | `68d3f7f6e710d52ff7726297` | `2d535d8f-0ac6-50a3-b86c-30fc54eeab8a` | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` | ✅ MATCH |
| 3 | Khóa học JavaScript miễn phí... | khoa-hoc-js-co-ban-2025 | `68d62da7799f7ff4e7d3a73d` | `60b278f7-1793-5be8-96c6-c13980fe027f` | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `dddf433f-347b-5024-b70d-2398aaed3660` | ✅ MATCH |
| 4 | Node.js Backend Developer | nodejs-backend-developer | `68d3f6a27891a37931bcde0e` | `bf71781d-be81-527f-b0d0-2b585d3bffcb` | `6dd1ccd9-420b-5c6d-8322-75223e67e549` | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` | ✅ MATCH |
| 5 | ReactJS Advanced - Update 2025 | advanced-javascript-concepts | `68d3f7dbe710d52ff772628f` | `f0dde7bb-1bf6-5602-a489-cd324132c68a` | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `dddf433f-347b-5024-b70d-2398aaed3660` | ✅ MATCH |
| 6 | Khóa học Frontend với Typescript | khoa-hoc-frontend-voi-typescript | `68d51b39f3189d72dc8e6bb7` | `81518947-e1f5-56f1-a296-93148b74a684` | `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` | ✅ MATCH |
| 7 | Fullstack MERN Project | fullstack-mern-project | `68d3f7eae710d52ff7726293` | `eea23666-7af0-5ec9-80c0-f30c54ee5a26` | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` | ✅ MATCH |
| 8 | Khóa học BackEnd với GO 2025 | khoa-hoc-go-co-ban-2025 | `68d636c624fab685a27c1729` | `8e6c5171-23d5-51dd-99b5-634769d84364` | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `dddf433f-347b-5024-b70d-2398aaed3660` | ✅ MATCH |

### Course FAQs Mapping
| # | Question Snippet | Parent Course UUID | FAQ MongoDB _id | PostgreSQL UUID v5 | Verification |
|:---:|:---|:---|:---|:---|:---:|
| 1 | Có dùng TensorFlow không? | `88b09b74-a128-535c-a2ad-6e72e6f45652` | `68d3f862e710d52ff77262a8` | `0a8dceb8-006b-5c06-8d04-fff693ac0b20` | ✅ MATCH |
| 2 | Khoá học có project demo không? | `2d535d8f-0ac6-50a3-b86c-30fc54eeab8a` | `68d3f7f6e710d52ff7726298` | `c0307a26-329f-57ea-bbf5-5a8c99f16447` | ✅ MATCH |
| 3 | Khóa học có phù hợp cho người... | `60b278f7-1793-5be8-96c6-c13980fe027f` | `68d6369024fab685a27c1726` | `b2b9691c-5735-51cd-bb7b-16886c6293b8` | ✅ MATCH |
| 4 | Có hướng dẫn deploy không? | `bf71781d-be81-527f-b0d0-2b585d3bffcb` | `68d3f6a27891a37931bcde0f` | `d3fe9e0a-5671-5852-8afb-c6ec8133f4cf` | ✅ MATCH |
| 5 | Khóa học có phù hợp cho người... | `f0dde7bb-1bf6-5602-a489-cd324132c68a` | `68d623b81abdf72b336d20cc` | `dc0f4b0a-2657-5f1b-94cc-d084532def14` | ✅ MATCH |
| 6 | Khoá này có deploy không? | `81518947-e1f5-56f1-a296-93148b74a684` | `68d51b39f3189d72dc8e6bb8` | `7cad05fc-3f4c-5203-bbac-801dd01aa30c` | ✅ MATCH |
| 7 | Khoá học có dự án nào thực tế? | `eea23666-7af0-5ec9-80c0-f30c54ee5a26` | `68d3f7eae710d52ff7726294` | `66d7e5e3-358b-55ab-a5e6-cd4181f0c51e` | ✅ MATCH |
| 8 | Khóa học có phù hợp cho người... | `8e6c5171-23d5-51dd-99b5-634769d84364` | `68d636c624fab685a27c172a` | `ebbecad7-322d-5929-81c0-9a02f5034869` | ✅ MATCH |

---

## 5. PostgreSQL Isolation Verification (All 26 Business Tables)

| # | PostgreSQL Table Name | Row Count Before Phase 2 | Row Count After Phase 2 | Isolation Status |
|:---:|:---|:---:|:---:|:---:|
| 1 | `users` | 7 | **7** | ✅ Unchanged (Phase 1) |
| 2 | `categories` | 3 | **3** | ✅ Unchanged (Phase 1) |
| 3 | `courses` | 0 | **8** | ✅ Migrated (Phase 2) |
| 4 | `course_faqs` | 0 | **8** | ✅ Migrated (Phase 2) |
| 5 | `chapters` | 0 | **0** | ✅ Isolated |
| 6 | `lessons` | 0 | **0** | ✅ Isolated |
| 7 | `quizzes` | 0 | **0** | ✅ Isolated |
| 8 | `questions` | 0 | **0** | ✅ Isolated |
| 9 | `question_options` | 0 | **0** | ✅ Isolated |
| 10 | `quiz_submissions` | 0 | **0** | ✅ Isolated |
| 11 | `quiz_submission_answers` | 0 | **0** | ✅ Isolated |
| 12 | `orders` | 0 | **0** | ✅ Isolated |
| 13 | `coupons` | 0 | **0** | ✅ Isolated |
| 14 | `coupon_courses` | 0 | **0** | ✅ Isolated |
| 15 | `enrollments` | 0 | **0** | ✅ Isolated |
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
- **Courses Document Count**: 8 documents (unchanged)
- **Writes Executed on MongoDB**: **0** (Strictly Read-Only)

---

## 7. Constraints & Data Integrity Verification

- **Primary Keys**: 16/16 UUID v5 values verified valid and collision-free.
- **Unique Constraints**:
  - `courses.slug`: 8 unique slug values verified.
- **Foreign Key Integrity**:
  - `courses.author_id` $\rightarrow$ `users.id`: 100% Valid.
  - `courses.category_id` $\rightarrow$ `categories.id`: 100% Valid.
  - `course_faqs.course_id` $\rightarrow$ `courses.id`: 100% Valid.
- **Nullability Checks**:
  - All NOT NULL columns in `courses` and `course_faqs` are fully satisfied.

---

## 8. Errors & Warnings

- **Critical Errors**: 0
- **Warnings**: 0

---

## 9. Final Verdict

# **PASS**

Phase 2 Migration (Courses + Course FAQs) is **100% COMPLETE and VERIFIED**.  
All requirements, isolation boundaries, safety rules, and deterministic mappings were strictly met.
