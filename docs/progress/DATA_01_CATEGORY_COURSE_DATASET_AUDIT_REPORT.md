# DATA-01 — MULTI-DOMAIN CATEGORY & COURSE DATASET EXPANSION AUDIT REPORT

- **Project**: TMdemy E-Learning Platform (`e-learning_server`)
- **Phase**: `DATA-01` (Audit, Design, and Planning Only — Read-Only)
- **Date**: 2026-10-28
- **Environment**: Node.js, Express 5.1.0, TypeScript 5.8.3, PostgreSQL 16.11 (`tmdemy`), Prisma ORM 6.4.1
- **Execution Mode**: Strictly Read-Only Database Inspection (Zero Writes, Zero Schema Changes, Zero Package Installations)

---

## 1. Executive Summary

This report presents the findings of the **DATA-01 Read-Only Audit** of the TMdemy PostgreSQL database (`tmdemy`) and backend codebase, along with a complete architectural design for **DATA-02 (Multi-Domain Category & Course Dataset Expansion)** to support a future **Hybrid Course Recommendation System** (Content-Based Filtering via TF-IDF / Cosine Similarity / Sentence Embeddings, Collaborative Filtering, and Hybrid Ranking).

### Key Audit Findings
1. **Actual Database Counts**:
   - **Categories**: **14 total** (**13 active** with `isDestroyed = false`, **1 soft-deleted** with `isDestroyed = true`). However, only **4 categories** contain real catalog courses (`Lập trình web`, `Lập trình`, `Khoa học dữ liệuu`, `ai course`); **2 categories** are empty (`Vibe Coding`, `hardware`), **1 category** is a soft-deleted test record (`Kiem thu tao danh muc Bugfix`), and **7 categories** are automated test artifacts (`Step 5 Category ...` and `Step 6 Category ...`, each holding 1 `PENDING` test course).
   - **Courses**: **378 total** (**377 active**, **1 soft-deleted**). Status breakdown: **340 `APPROVED`** (339 active, 1 soft-deleted), **30 `PENDING`**, and **8 `REJECTED`**.
   - **Composition of the 378 Courses**:
     - **360 deterministic seeded courses** (from `prisma/seeds/course-data.ts`, 90 per core IT category).
     - **10 baseline/manual courses** (created prior to or during feature testing).
     - **8 automated test artifact courses** (`Step 5 Course for Coding Exercises` ×4, `Step 6 Course: Algorithms` ×3, `Course Hotfix 1793015610339` ×1).
2. **Critical Dataset Deficiencies Blocking Recommendation Quality**:
   - **100% Domain Concentration in IT/Programming**: All 339 active `APPROVED` catalog courses sit inside 4 IT categories. Non-IT educational domains (Design, Business, Marketing, Finance, Languages, Office Productivity, Project Management, Creative Arts, Personal Development, Health & Wellness) have **0 courses**.
   - **100% Identical Boilerplate Arrays Across All 360 Seeded Courses**: In `prisma/seeds/course-data.ts` (lines 211–227), all 360 courses were hardcoded with the **exact same 3 `requirements`**, the **exact same 4 `benefits`**, and the **exact same 2 `documents`**. Consequently, `requirements` (Prerequisites) and `benefits` (Learning Outcomes) provide **zero discriminative signal** for TF-IDF or embedding-based similarity across 95.2% of the catalog.
   - **Ultra-Short Course Descriptions**: Across all 378 courses, `description` averages **127 characters (~24 Vietnamese words)**, with a maximum of **161 characters (34 words)**. **0 courses** have a substantive multi-paragraph description (250–500 words).
   - **Sub-Domain Collapsing & Cross-Category Overlap**: The `Lập trình` category (`programming-courses.ts`) mixes 6 distinct domains—Core Programming Languages, Algorithms, Databases/SQL, DevOps/Cloud, Software Architecture, and Mobile/Cybersecurity/Game Dev—causing high cross-category TF-IDF similarity with `Lập trình web` and `Khoa học dữ liệuu`.
3. **Teacher Eligibility Findings**:
   - Out of **118 total users**, **17 users** have `role = TEACHER` (`status = ACTIVE`).
   - Only **3 users** are verified, legitimate teacher accounts (`role = TEACHER`, `status = ACTIVE`, `isVerified = true`): `teacher02`, `teacher_cntt`, and `giaovientrungquoc`.
   - The remaining **14 `TEACHER` accounts** (`isVerified = false`) are automated test fixtures (`teacher1_179284...`, `s6_t1_179289...`) created by E2E test suites.
   - Additionally, `admin_tmdemy` (`8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8`), which was previously used in `TEACHER_IDS` in `prisma/seeds/course-data.ts` and owns 94 courses, actually has **`role = ADMIN`**, not `TEACHER`. Under strict teacher-only eligibility rules, **3 verified teachers** are eligible for DATA-02 assignment.
4. **Expansion Target Summary**:
   - **Taxonomy**: Retain the 4 populated IT categories (plus existing `Vibe Coding` / `hardware` untouched) and add **16 new multi-domain categories**, forming a **20-category active catalog taxonomy** spanning Technology, Design, Business, Finance, Marketing, Productivity, Languages, Creative Arts, and Personal Development.
   - **Course Volume**: Seed **270 new high-quality courses** across the 16 new categories, bringing the database from **378 to 648 total courses** (**647 active courses**, and **360 + 270 = 630 deterministic catalog courses**), right in the center of the **600–700 course target**.

---

## 2. Current Database Overview

### 2.1 Infrastructure & Schema Discovery
- **ORM & Database**: Prisma ORM `6.4.1` connected to PostgreSQL `16.11` (`tmdemy`) via singleton `src/config/prisma.ts`.
- **Migrations**: 13 applied migrations in `prisma/migrations/` (from `20260930120320_init_postgresql` through `20261026124847_add_transcript_original_and_refined`).
- **Existing Seed Scripts**:
  - `prisma/seed.ts` & `prisma/seeds/course-data.ts` (`web-courses.ts`, `programming-courses.ts`, `data-courses.ts`, `ai-courses.ts`): Seeds 360 courses across 4 categories using deterministic UUIDv5 (`SEED_COURSE_NAMESPACE = '7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c'`).
  - `scripts/run_phase5_seed.ts` & `prisma/seeds/seed-gamification-demo.ts`: Seeds 70 demo learners, chapters/lessons/quizzes for 32 courses, 557 enrollments, 3,540 progress records, 616 quiz submissions, and 5,600 XP transactions.

### 2.2 Global Entity Counts in PostgreSQL (`tmdemy`)

| Table / Model | Total Records | Active / Valid | Soft-Deleted / Inactive | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `User` (`users`) | **118** | 118 `ACTIVE` | 0 `INACTIVE` | 1 `ADMIN`, 17 `TEACHER` (3 verified, 14 test), 100 `USER` (80 verified, 20 unverified) |
| `Category` (`categories`) | **14** | 13 (`isDestroyed=false`) | 1 (`isDestroyed=true`) | 4 core IT categories, 2 empty categories, 8 test artifact categories |
| `Course` (`courses`) | **378** | 377 (`isDestroyed=false`) | 1 (`isDestroyed=true`) | 340 `APPROVED`, 30 `PENDING`, 8 `REJECTED` |
| `Chapter` (`chapters`) | **88** | 88 (`isDestroyed=false`) | 0 | Distributed across 46 courses (332 courses have 0 chapters) |
| `Lesson` (`lessons`) | **314** | 314 | — | Distributed across 42 courses (336 courses have 0 lessons) |
| `Quiz` (`quizzes`) | **69** | 69 | — | Distributed across 35 courses |
| `CodingExercise` (`coding_exercises`) | **18** | 18 | — | Distributed across 6 courses |
| `CourseFaq` (`course_faqs`) | **10** | 10 | — | 1 FAQ each on 10 baseline courses; 0 on the 360 seeded courses |
| `Enrollment` (`enrollments`) | **591** | 591 | — | Distributed across 49 courses (329 courses have 0 enrollments) |
| `Progress` (`progress`) | **3,561** | 3,561 | — | Distributed across 37 courses |
| `Rating` (`ratings`) | **4** | 4 `ACTIVE` | 0 `INACTIVE` | Distributed across 4 courses (374 courses have 0 ratings) |
| `Order` (`orders`) | **30** | 22 `COMPLETED` | 8 `PENDING`/`REJECTED` | Distributed across 16 courses |
| `FavoriteCourse` (`favorite_courses`) | **6** | 6 | — | Distributed across 6 courses |
| `Comment` (`comments`) | **15** | 15 | — | Distributed across 2 courses |
| `Certificate` (`certificates`) | **3** | 3 | — | Distributed across 3 courses |
| `QuizSubmission` (`quiz_submissions`) | **611** | 611 | — | Generated primarily by Phase 5 gamification seed |
| `CodingSubmission` (`coding_submissions`) | **20** | 20 | — | Generated during Step 4–6 coding exercise tests |

---

## 3. Existing Category Distribution

### 3.1 Full Category Audit Table (All 14 Records)

| # | Category ID (UUID) | Display Name (`name`) | Slug (`slug`) | Status (`isDestroyed`) | Description (`description`) | Desc Chars | Total Courses | Active Courses | Approved (Active) | Pending (Active) | Rejected (Active) | Audit Classification |
| :-: | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | `fc5d66a4-7468-5328-a6a9-16c3a9e49881` | **Lập trình web** | `lap-trinh-web` | Active (`false`) | Danh mục các khoá học lập trình web | 35 | **95** | 95 | **87** | 6 | 2 | Core Catalog Category |
| 2 | `dddf433f-347b-5024-b70d-2398aaed3660` | **Lập trình** | `lap-trinh` | Active (`false`) | Danh mục các khóa học về lập trình web | 38 | **94** | 94 | **86** | 6 | 2 | Core Catalog Category |
| 3 | `2ec199fc-a7e0-531e-b79d-14b479f74853` | **Khoa học dữ liệuu** | `khoa-hoc-du-lieu` | Active (`false`) | Danh mục các khóa học về Data Science, Machine Learning | 55 | **90** | 90 | **82** | 6 | 2 | Core Catalog Category (Typo in `name`) |
| 4 | `084d6053-7823-4cb8-a7e7-7dba3e6a78bf` | **ai course** | `ai-course` | Active (`false`) | Danh mục các khóa học về AI | 27 | **91** | 90 (1 del) | **83** (+1 del) | 5 | 2 | Core Catalog Category (Lowercase English `name`) |
| 5 | `448fc652-4dd5-4474-aac8-5f2068cbf83e` | **Vibe Coding** | `vibe-coding` | Active (`false`) | Danh mục khóa học về Vibe Coding | 32 | **0** | 0 | **0** | 0 | 0 | Empty Niche Category |
| 6 | `264ea06c-6fd9-474a-a518-2ce39ecded66` | **hardware** | `hardware` | Active (`false`) | Courses related to hardware category | 36 | **0** | 0 | **0** | 0 | 0 | Empty Category (English) |
| 7 | `62df602e-7e8c-486d-8735-84d05c86146f` | **Kiem thu tao danh muc Bugfix** | `kiem-thu-tao-danh-muc-bugfix` | Soft-Deleted (`true`) | Mo ta kiem thu fix loi Category name is required | 48 | **0** | 0 | **0** | 0 | 0 | Soft-Deleted Test Artifact |
| 8 | `9d32771f-67e8-4b08-864d-7cbfea0208f3` | **Step 5 Category 1792845835347** | `step-5-category-1792845835347` | Active (`false`) | Step 5 Category | 15 | **1** | 1 | **0** | 1 | 0 | Automated Test Artifact |
| 9 | `030a3e73-7ed7-4269-b8fd-479110c1fda4` | **Step 5 Category 1792845863604** | `step-5-category-1792845863604` | Active (`false`) | Step 5 Category | 15 | **1** | 1 | **0** | 1 | 0 | Automated Test Artifact |
| 10 | `3f904a91-88b0-42ff-95ad-371a432d0ee7` | **Step 5 Category 1792845903273** | `step-5-category-1792845903273` | Active (`false`) | Step 5 Category | 15 | **1** | 1 | **0** | 1 | 0 | Automated Test Artifact |
| 11 | `7b4599cf-843d-4010-941a-6380c012df16` | **Step 5 Category 1792845942349** | `step-5-category-1792845942349` | Active (`false`) | Step 5 Category | 15 | **1** | 1 | **0** | 1 | 0 | Automated Test Artifact |
| 12 | `eddb30e9-ff76-4c00-ba39-d4a1b96678a2` | **Step 6 Category 1792897579436** | `step-6-cat-1792897579436` | Active (`false`) | Step 6 Category | 15 | **1** | 1 | **0** | 1 | 0 | Automated Test Artifact |
| 13 | `b69ff7cb-f9d8-47d8-9d11-909b5b4a30fb` | **Step 6 Category 1792897656271** | `step-6-cat-1792897656271` | Active (`false`) | Step 6 Category | 15 | **1** | 1 | **0** | 1 | 0 | Automated Test Artifact |
| 14 | `b6243dac-63cc-4775-98a5-03b3b58af153` | **Step 6 Category 1792897801842** | `step-6-cat-1792897801842` | Active (`false`) | Step 6 Category | 15 | **1** | 1 | **0** | 1 | 0 | Automated Test Artifact |
| — | *(Uncategorized: `categoryId = null`)* | — | — | — | — | — | **1** | 1 | **1** | 0 | 0 | `Course Hotfix 1793015610339` |
| **Total** | **14 Categories** | — | — | **13 Active / 1 Deleted** | — | — | **378** | **377** | **339** | **30** | **8** | — |

### 3.2 Category Findings & Diagnostics
1. **Overrepresented Categories**:
   - `Lập trình web` (95 courses, 25.1%), `Lập trình` (94 courses, 24.9%), `ai course` (91 courses, 24.1%), and `Khoa học dữ liệuu` (90 courses, 23.8%) account for **97.9% of all courses** and **99.7% of all `APPROVED` courses** (338/339 active approved courses).
2. **Categories with Zero Courses**:
   - **3 categories** have 0 courses: `Vibe Coding` (active), `hardware` (active), and `Kiem thu tao danh muc Bugfix` (soft-deleted).
   - Another **7 categories** (`Step 5 Category ...` and `Step 6 Category ...`) have **0 `APPROVED` courses** (each has 1 `PENDING` automated test course).
3. **Naming & Description Defects in Existing Core Categories**:
   - `Khoa học dữ liệuu` (`2ec199fc-a7e0-531e-b79d-14b479f74853`) has a trailing typo (`uu`) in its display name, though its slug `khoa-hoc-du-lieu` is clean.
   - `ai course` (`084d6053-7823-4cb8-a7e7-7dba3e6a78bf`) is lowercase English while the other 3 core categories are Vietnamese.
   - `Lập trình` (`dddf433f-347b-5024-b70d-2398aaed3660`) has the description `"Danh mục các khóa học về lập trình web"`—an exact duplicate of `Lập trình web`'s description.
4. **Semantic Overlap & Candidates for Retention / Renaming / Merging**:
   - **Retain as Core Categories**: `Lập trình web`, `Lập trình`, `Khoa học dữ liệuu`, `ai course`.
   - **Candidates for Optional Display-Name/Description Polish (Requires Approval — Not Touched by Default)**:
     - `Khoa học dữ liệuu` $\rightarrow$ display name `"Khoa học dữ liệu"` (keep slug `khoa-hoc-du-lieu`).
     - `ai course` $\rightarrow$ display name `"Trí tuệ nhân tạo (AI)"` (keep slug `ai-course` so existing frontend bookmarks/links do not break).
     - `Lập trình` $\rightarrow$ update description from `"Danh mục các khóa học về lập trình web"` to `"Danh mục các khóa học ngôn ngữ lập trình, thuật toán và phát triển phần mềm"`.
   - **Candidates for Soft-Delete / Cleanup (Requires Approval — Not Touched by Default)**:
     - The 7 `Step 5 Category ...` and `Step 6 Category ...` test artifact categories pollute `GET /api/categories` (which returns active categories ordered by `createdAt DESC`, meaning the first 7 categories returned to the frontend are `"Step 6 Category ..."` and `"Step 5 Category ..."`!).
   - **Merge Candidates**: `Vibe Coding` (0 courses) overlaps with the 2 existing "Vibe coding" courses currently placed in `Lập trình` and `ai course`.

---

## 4. Existing Course Distribution

### 4.1 Course Breakdown by Category, Level, and Type (Active Courses)

| Category Name | Active Courses | `APPROVED` | `PENDING` | `REJECTED` | `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `FREE` | `PAID` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lập trình web** | 95 | 87 | 6 | 2 | 24 | 46 | 25 | 6 | 89 |
| **Lập trình** | 94 | 86 | 6 | 2 | 28 | 35 | 31 | 8 | 86 |
| **Khoa học dữ liệuu** | 90 | 82 | 6 | 2 | 30 | 33 | 27 | 8 | 82 |
| **ai course** | 90 *(+1 del)* | 83 *(+1 del)* | 5 | 2 | 25 | 29 *(+1 del)* | 36 | 6 | 84 *(+1 del)* |
| **7× Step 5 / Step 6 Categories** | 7 | 0 | 7 | 0 | 7 | 0 | 0 | 0 | 7 |
| **Uncategorized (`categoryId = null`)** | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
| **Total Active (`isDestroyed=false`)** | **377** | **339** | **30** | **8** | **115** (30.5%) | **143** (37.9%) | **119** (31.6%) | **28** (7.4%) | **349** (92.6%) |
| **Total All (`378`)** | **378** | **340** | **30** | **8** | **115** (30.4%) | **144** (38.1%) | **119** (31.5%) | **28** (7.4%) | **350** (92.6%) |

### 4.2 Price Distribution (Active Courses)
- **Free Courses (`price = 0`)**: **38 courses** (28 with `type = FREE` + 10 baseline/test courses with `type = PAID` and `price = 0`).
- **Paid Courses (`price > 0`)**: **339 courses**, ranging from **99,000 VND** to **1,299,000 VND** (mean across all `PAID`: **371,725 VND**; mean across `price > 0`: **382,690 VND**).
- **Exact Price Tiers Used in Database**:
  - `0 VND`: 38 courses
  - `99,000 VND`: 4 courses
  - `120,000 VND`: 1 course
  - `149,000 VND`: 23 courses
  - `199,000 VND`: 41 courses
  - `249,000 VND`: 40 courses
  - `299,000 VND`: 41 courses
  - `349,000 VND`: 40 courses
  - `399,000 VND`: 33 courses
  - `449,000 VND`: 19 courses
  - `499,000 VND`: 30 courses
  - `549,000 VND`: 20 courses
  - `599,000 VND`: 13 courses
  - `649,000 VND`: 8 courses
  - `699,000 VND`: 9 courses
  - `749,000 VND`: 5 courses
  - `799,000 VND`: 5 courses
  - `899,000 VND`: 5 courses
  - `999,000 VND`: 1 course
  - `1,299,000 VND`: 1 course

### 4.3 Courses Per Author / Teacher

| Author ID (UUID) | Username | Role | Status | Verified (`isVerified`) | Total Courses | Active Courses | Approved | Pending | Rejected | Authored Lessons |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `teacher02` | `TEACHER` | `ACTIVE` | `true` | **95** | 95 | 95 | 0 | 0 | 81 |
| `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | `admin_tmdemy` | `ADMIN` | `ACTIVE` | `true` | **94** | 94 | 94 | 0 | 0 | 72 |
| `6dd1ccd9-420b-5c6d-8322-75223e67e549` | `teacher_cntt` | `TEACHER` | `ACTIVE` | `true` | **91** | 91 | 91 | 0 | 0 | 101 |
| `c79ee551-3b2e-48ca-9105-c0669f04e6bb` | `giaovientrungquoc` | `TEACHER` | `ACTIVE` | `true` | **91** | 90 (+1 del) | 59 (+1 del) | 23 | 8 | 54 |
| 7× Test Teachers (`teacher1_...`, `s6_t1_...`) | *(7 test accounts)* | `TEACHER` | `ACTIVE` | `false` | **7** (1 each) | 7 | 0 | 7 | 0 | 6 |
| 7× Test Teachers (`teacher2_...`, `s6_t2_...`) | *(7 test accounts)* | `TEACHER` | `ACTIVE` | `false` | **0** | 0 | 0 | 0 | 0 | 0 |
| **Total** | — | — | — | — | **378** | **377** | **339** | **30** | **8** | **314** |

> [!WARNING]
> **Historical Teacher Assignment Anomaly**: In `prisma/seeds/course-data.ts`, all `PENDING` (24) and `REJECTED` (8) courses in each 90-course category array were at indices `82..89`, which coincided with the 4th teacher slot (`giaovientrungquoc`). As a result, `giaovientrungquoc` received all 24 `PENDING` and all 8 `REJECTED` seeded courses, while `teacher02`, `teacher_cntt`, and `admin_tmdemy` received 100% `APPROVED` courses. Furthermore, `admin_tmdemy` has `role = ADMIN`. Both issues will be corrected in our DATA-02 teacher assignment design without modifying existing courses.

---

## 5. Metadata Completeness Audit

### 5.1 Actual Schema Mapping vs. Conceptual Metadata Fields
Inspection of `prisma/schema.prisma` (lines 280–328) and `src/models/course.model.ts` confirms the exact physical columns on `Course`:

| Conceptual Metadata | Physical `Course` Column / Relation | Prisma Type | Supported? | Current Usage & Serialization Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Title** | `title` | `String @db.VarChar(255)` | **YES** | Required, min 3 chars in Express Validator, max 255 chars |
| **Unique Slug** | `slug` | `String @unique @db.VarChar(255)` | **YES** | Unique kebab-case URL identifier |
| **Short Description** | *(Not a separate column)* | — | **NO** | Not in `schema.prisma`; currently `description` holds a 1-sentence summary |
| **Full Description** | `description` | `String @default("") @db.Text` | **YES** | Unlimited `@db.Text` in PostgreSQL; currently under-utilized (avg 127 chars) |
| **Prerequisites** | `requirements` | `String[] @default([])` | **YES** | Serialized under `course.info.requirements` in API responses |
| **Learning Outcomes** | `benefits` | `String[] @default([])` | **YES** | Serialized under `course.info.benefits` in API responses |
| **Skills / Topics** | `techniques` | `String[] @default([])` | **YES** | Serialized under `course.info.techniques` in API responses |
| **Course Documents** | `documents` | `String[] @default([])` | **YES** | Serialized under `course.info.documents` in API responses |
| **Course FAQs** | `faqs` (`CourseFaq[]`) | Relation (`question`, `answer`, `order`) | **YES** | Serialized under `course.info.qa` in API responses |
| **Difficulty Level** | `level` | `CourseLevel` (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`) | **YES** | Stored as lowercase enum in DB, serialized uppercase/lowercase via mapper |
| **Language** | *(Not in schema)* | — | **NO** | No `language` column exists on `Course` |
| **Price & Old Price** | `price`, `oldPrice` | `Decimal(12, 2)` | **YES** | Converted to `Number` in `formatSafeCourse` |
| **Course Type** | `type` | `CourseType` (`PAID`, `FREE`) | **YES** | `FREE` forces `price = 0, oldPrice = 0` in service layer |
| **Thumbnail** | `image` | `String @default("")` | **YES** | Validated via `.isURL()` in Express Validator when provided |
| **Intro Video URL** | `introUrl` | `String @default("") @map("intro_url")` | **YES** | Validated via `.isURL()` in Express Validator when provided |
| **Chapters & Lessons** | `chapters` (`Chapter[]`), `lessons` (`Lesson[]`) | Relations | **YES** | Optional at course creation; required for learning progress & duration filters |

### 5.2 Completeness Metrics Across All 378 Courses

| Metadata Check | Count (out of 378) | Percentage | Details & Root Cause |
| :--- | :---: | :---: | :--- |
| **Valid Non-Empty `title`** | **378 / 378** | 100.0% | Min: 20 chars, Max: 92 chars, Avg: 64 chars |
| **Valid Unique `slug`** | **378 / 378** | 100.0% | 0 duplicate slugs |
| **Non-Empty `description`** | **377 / 378** | 99.7% | 1 empty (`Course Hotfix 1793015610339`) |
| **`description` < 50 chars** | **10 / 378** | 2.6% | 7 Step 5/6 test courses (`22 chars`), 1 Hotfix (`0 chars`), 1 ReactJS (`34 chars`), 1 Vibe coding (`41 chars`) |
| **`description` < 150 chars** | **358 / 378** | 94.7% | Almost all courses have only a single short sentence (avg 127 chars / 24 words) |
| **`description` >= 250 chars** | **0 / 378** | **0.0%** | **Max description length in entire DB is 161 chars (34 words)** |
| **Non-Empty `image` (Thumbnail)** | **370 / 378** | 97.9% | 8 test courses have `image = ""`; 360 seeded courses cycle 16 Unsplash URLs |
| **Non-Empty `introUrl`** | **369 / 378** | 97.6% | 9 courses have `introUrl = ""`; 360 seeded courses use 1 identical YouTube URL |
| **Non-Null `categoryId`** | **377 / 378** | 99.7% | 1 course (`Course Hotfix 1793015610339`) has `categoryId = null` |
| **Non-Empty `requirements`** | **370 / 378** | 97.9% | 8 test courses have `[]`; **360 seeded courses share 1 identical array** |
| **Non-Empty `benefits`** | **370 / 378** | 97.9% | 8 test courses have `[]`; **360 seeded courses share 1 identical array** |
| **Non-Empty `techniques`** | **360 / 378** | 95.2% | All 360 seeded courses have 4–5 tech tags; all 18 non-seed courses have `[]` |
| **Non-Empty `documents`** | **360 / 378** | 95.2% | All 360 seeded courses share 1 identical 2-item array; 18 non-seed courses have `[]` |
| **Courses with `chapters` (> 0)** | **46 / 378** | 12.2% | 32 Phase-5 courses + 6 baseline courses + 8 test courses; **332 courses have 0 chapters** |
| **Courses with `lessons` (> 0)** | **42 / 378** | 11.1% | 32 Phase-5 courses + 4 baseline courses + 6 test courses; **336 courses have 0 lessons** |
| **Courses with `faqs` (> 0)** | **10 / 378** | 2.6% | Only 10 baseline courses have 1 FAQ; **368 courses have 0 FAQs** |
| **Courses with `enrollments` (> 0)** | **49 / 378** | 13.0% | 591 enrollments concentrated across 49 courses (**329 courses have 0 enrollments**) |
| **Courses with `ratings` (> 0)** | **4 / 378** | 1.1% | Only 4 courses have 1 rating each (**374 courses have 0 ratings**) |

---

## 6. Duplicate & Similarity Findings

### 6.1 Exact & Normalized Duplicates Found in Database
1. **Exact Duplicate Titles & Descriptions (Test Artifacts)**:
   - `"Step 5 Course for Coding Exercises"` appears **4 times** (IDs: `9ac56f5c...`, `657f29e4...`, `e3ca84d4...`, `dba8bf25...`), all with exact description `"Test course for Step 5"`.
   - `"Step 6 Course: Algorithms"` appears **3 times** (IDs: `590ce289...`, `9805d55c...`, `16ae4cc8...`), all with exact description `"Test course for Step 6"`.
2. **Exact Duplicate Metadata Arrays (Catalog-Wide Boilerplate)**:
   - **360 out of 378 courses (95.2%)** have the **exact same `requirements` array**:
     1. `"Máy tính cá nhân có kết nối Internet ổn định"`
     2. `"Cài đặt môi trường phát triển (VS Code / Python / Node.js)"`
     3. `"Tư duy logic và tinh thần chủ động thực hành dự án"`
   - **360 out of 378 courses (95.2%)** have the **exact same `benefits` array**:
     1. `"Nắm vững kiến thức chuyên sâu và thực chiến ngay trong công việc"`
     2. `"Sở hữu mã nguồn dự án hoàn chỉnh để đưa vào Portfolio cá nhân"`
     3. `"Cấp chứng chỉ hoàn thành khóa học có giá trị từ TMDEMY"`
     4. `"Hỗ trợ giải đáp thắc mắc chuyên môn trong quá trình học tập"`
   - **360 out of 378 courses (95.2%)** have the **exact same `documents` array**:
     1. `"Slide bài giảng chi tiết và giáo trình tóm tắt kiến thức cốt lõi"`
     2. `"Kho mã nguồn bài tập và tài liệu tham khảo chính thức trên GitHub"`
   - **3 baseline courses** (`Khóa học BackEnd với GO 2025`, `Khóa học JavaScript miễn phí từ cơ bản đến nâng cao 2029`, `Khóa học vibe coding`) also share copy-pasted React/Next.js `requirements` (`["Hiểu JavaScript ES6+", "Biết cơ bản về ReactJS"]`) and `benefits` (`["Nắm vững React Hooks nâng cao", "Xây dựng ứng dụng Next.js production-ready", "Tối ưu SEO và hiệu năng web"]`) even though one is a Go backend course!

### 6.2 High TF-IDF Cosine Similarity & Semantic Overlap Pairs
Using Vietnamese diacritic-normalized tokenization and TF-IDF Cosine Similarity over `title + description + techniques` across all 378 courses, **42 course pairs** exceeded the similarity threshold (`cosineSim >= 0.38` or `titleJaccard >= 0.50`). Excluding the Step 5/Step 6 test duplicates, the top catalog overlaps are:

| Course A (Category) | Course B (Category) | TF-IDF Cosine | Title Jaccard | Overlap Diagnosis |
| :--- | :--- | :---: | :---: | :--- |
| *Docker Từ Số 0 Đến Thực Chiến Dành Riêng Cho Web Developers* (`Lập trình web`) | *Docker và Docker Compose Thực Chiến Cho Kỹ Sư Phần Mềm* (`Lập trình`) | **0.587** | 0.143 | Cross-category duplicate topic (Docker containerization) |
| *Khóa học vibe coding* (`Lập trình`) | *Khóa học Vibe coding với Antigravity 2026* (`ai course`) | **0.546** | **0.500** | Near-duplicate baseline courses across categories |
| *Node.js Backend Developer* (`Lập trình web`) | *Xây Dựng RESTful API Chuyên Nghiệp Với Node.js, Express và TypeScript* (`Lập trình web`) | **0.508** | 0.125 | Baseline vs. Seeded course on Node.js + Express REST API |
| *Tổng Hợp Giọng Nói Tự Nhiên (Text-to-Speech - TTS) Bằng Deep Learning* (`ai course`) | *Lập Trình Trợ Lý Giọng Nói Thông Minh (Voice AI Agent) Thời Gian Thực* (`ai course`) | **0.485** | 0.118 | Closely related Speech AI courses (good for recommendation clustering) |
| *Tự Động Hóa Dashboard Power BI Bằng Ngôn Ngữ Python và R Nhúng* (`Khoa học dữ liệuu`) | *Power BI Thực Chiến: Từ Dữ Liệu Thô Đến Báo Cáo Quản Trị Đỉnh Cao* (`Khoa học dữ liệuu`) | **0.482** | 0.077 | Related Power BI progression (Intro $\rightarrow$ Advanced Automation) |
| *Swift và SwiftUI: Lập Trình Ứng Dụng iOS Cho iPhone và iPad* (`Lập trình`) | *Lập Trình iOS Thực Chiến: Xây Dựng Ứng Dụng Đọc Tin Tức Với Swift 6* (`Lập trình`) | **0.463** | 0.250 | Related iOS/Swift courses currently buried inside `Lập trình` |
| *SQL Cơ Bản Đến Nâng Cao: Viết Truy Vấn Dữ Liệu Chuyên Nghiệp* (`Lập trình`) | *SQL Chuyên Sâu Cho Phân Tích Dữ Liệu và Kho Dữ Liệu Doanh Nghiệp* (`Khoa học dữ liệuu`) | **0.462** | 0.286 | Cross-category SQL overlap |
| *Xây Dựng Pipeline CI/CD Tự Động Với GitHub Actions Cho Ứng Dụng Web* (`Lập trình web`) | *CI/CD Pipeline Thực Chiến Với GitLab CI và GitHub Actions* (`Lập trình`) | **0.442** | **0.500** | Cross-category CI/CD GitHub Actions overlap |

### 6.3 Practical Duplicate-Detection Pipeline for DATA-02
Without installing any new npm packages, DATA-02 will enforce a **4-stage deterministic duplicate gate** in TypeScript before any database transaction:
1. **Stage 1 — Exact & Slug Uniqueness Gate**: Verify `slug` and trimmed `title` against all existing DB records + all candidate seed records (`Set` lookup, $O(1)$).
2. **Stage 2 — Diacritic-Normalized Title Gate**: Normalize Vietnamese text (`NFD` decomposition, strip `[\u0300-\u036f]`, `đ -> d`, lowercase, strip punctuation) and reject any candidate with normalized title match or **Title Token Jaccard Similarity $> 0.60$** against any existing or candidate course.
3. **Stage 3 — TF-IDF Cosine Similarity Gate**: Build an in-memory TF-IDF matrix over `title + description + benefits + requirements + techniques` across all 378 existing courses + 270 new courses. Flag/reject any candidate pair with **Cosine Similarity $> 0.65$**, while targeting **intra-category similarity of $0.18 - 0.45$** (so related courses cluster naturally without being clones).
4. **Stage 4 — Boilerplate Array Uniqueness Gate**: Enforce that no two courses share identical `benefits` (Learning Outcomes) or `requirements` (Prerequisites) arrays.

---

## 7. AI-Generated Content Quality Findings

Sampling the 360 seeded courses across `web-courses.ts`, `programming-courses.ts`, `data-courses.ts`, and `ai-courses.ts` alongside the 10 baseline courses reveals specific structural strengths and weaknesses:

### 7.1 Concrete Strengths in Existing 360 Seeded Courses
- **Specific, Natural Titles**: Titles are well-crafted in Vietnamese with accurate international technical terms (e.g., *"Làm Chủ XGBoost, LightGBM và CatBoost Trong Các Cuộc Thi Kaggle"*, *"Xử Lý Dữ Liệu Tốc Độ Cao Với Polars: Kỷ Nguyên Mới Thay Thế Pandas"*). There are no numbered placeholders like `"Khóa học số 27"`.
- **Specific `techniques` Tags**: Each of the 360 courses has 4–5 relevant technology/topic tags (e.g., `['XGBoost', 'LightGBM', 'CatBoost', 'Optuna', 'Kaggle']`).

### 7.2 Concrete Quality Problems in Existing Courses
1. **Single-Sentence Telegraphic Descriptions (Formulaic Colon Pattern)**:
   - Almost all 360 seeded descriptions follow the exact same 1-sentence template: `<Hook phrase>: <comma-separated list of 3-4 subtopics>.`
   - *Concrete Example 1 (`web-courses.ts`)*: `"Thiết kế hệ thống tin nhắn tức thời: phòng chat, thông báo trạng thái online/offline, gửi tệp và tin nhắn thoại."` (112 chars, 21 words).
   - *Concrete Example 2 (`data-courses.ts`)*: `"Thay thế các phần mềm BI đắt đỏ: cài đặt Metabase trên Docker, kết nối PostgreSQL/MySQL, tạo câu hỏi trực quan và gửi thông báo Slack."` (134 chars, 23 words).
   - *Concrete Example 3 (`ai-courses.ts`)*: `"Công nghệ tạo ảnh đột phá nhất hiện nay: quy trình thêm nhiễu và khử nhiễu (DDPM), U-Net dự đoán nhiễu và Conditioning hướng dẫn tạo ảnh."` (137 chars, 26 words).
   - **Impact**: Missing target audience, missing practical project context, missing pedagogical progression, and far too brief (20–30 words) for transformer sentence embeddings or rich keyword TF-IDF.
2. **Complete Absence of Course-Specific Learning Outcomes (`benefits`) and Prerequisites (`requirements`)**:
   - Every single one of the 360 seeded courses claims the learner needs `"Cài đặt môi trường phát triển (VS Code / Python / Node.js)"`—even for courses on Figma UI Design (`web-courses.ts` #37), Looker Studio (`data-courses.ts` #21), or Agile/Scrum!
   - An `ADVANCED` course like *"Lập Trình Nhân Hệ Điều Hành Cơ Bản (OS Kernel Development) Với C và Rust"* (`programming-courses.ts` #84) has the exact same beginner prerequisite array as *"Nhập Môn HTML5 và CSS3 Từ Con Số 0"*.
3. **Mismatched / Copy-Pasted Metadata in Baseline Courses**:
   - Baseline course `"Machine Learning Fundamentals"` (`88b09b74-a128-535c-a2ad-6e72e6f45652`) is assigned to category `Lập trình web`.
   - Baseline course `"Khóa học BackEnd với GO 2025"` (`8e6c5171-23d5-51dd-99b5-634769d84364`) lists `requirements: ["Hiểu JavaScript ES6+", "Biết cơ bản về ReactJS"]` and `benefits: ["Nắm vững React Hooks nâng cao", "Xây dựng ứng dụng Next.js production-ready"]`.
   - Baseline course `"Khóa học Frontend với Typescript"` (`81518947-e1f5-56f1-a296-93148b74a684`) has `type = PAID` while `price = 0`.

---

## 8. Proposed Multi-Domain Taxonomy (20 Core Categories)

To transform TMdemy from a narrow 4-category IT catalog into a realistic, multi-domain Udemy-style learning platform without modifying or deleting any existing records, we propose **retaining the 4 existing populated IT categories** and **adding 16 new well-defined categories** across Technology, Design, Business, Finance, Marketing, Productivity, Languages, Creative Arts, and Lifestyle.

### 8.1 Comparison of Candidate Domains vs. Existing Categories

| Candidate Domain (Prompt Section 4) | Existing Category Match in DB | Strategy for DATA-02 |
| :--- | :--- | :--- |
| 1. Web Development | `Lập trình web` (`lap-trinh-web`, 95 courses) | **Retain existing** (already well-populated with 95 courses; 0 new needed) |
| 2. Software Engineering / Core Programming | `Lập trình` (`lap-trinh`, 94 courses) | **Retain existing** (already well-populated with 94 courses; 0 new needed) |
| 3. Data Science | `Khoa học dữ liệuu` (`khoa-hoc-du-lieu`, 90 courses) | **Retain existing** (already well-populated with 90 courses; 0 new needed) |
| 4. Artificial Intelligence & ML | `ai course` (`ai-course`, 91 courses) | **Retain existing** (already well-populated with 91 courses; 0 new needed) |
| 5. Mobile Development | *None* (only ~5 courses buried in `Lập trình`/`Web`) | **Create New Category #5**: `Phát triển ứng dụng di động` (`phat-trien-ung-dung-di-dong`) |
| 6. Cybersecurity | *None* (only ~4 courses buried in `Lập trình`) | **Create New Category #6**: `An ninh mạng & Bảo mật` (`an-ninh-mang-va-bao-mat`) |
| 7. Cloud Computing & DevOps | *None* ( ~15 courses buried in `Lập trình`) | **Create New Category #7**: `Điện toán đám mây & DevOps` (`dien-toan-dam-may-va-devops`) |
| 8. Database & Data Engineering | *None* (courses split across `Lập trình` & `Data`) | **Create New Category #8**: `Cơ sở dữ liệu & Kỹ thuật dữ liệu` (`co-so-du-lieu-va-ky-thuat-du-lieu`) |
| 9. UI/UX Design | *None* (0 dedicated category) | **Create New Category #9**: `Thiết kế UI/UX & Sản phẩm số` (`thiet-ke-ui-ux-va-san-pham-so`) |
| 10. Graphic Design | *None* (0 courses) | **Create New Category #10**: `Thiết kế đồ họa & Truyền thông thị giác` (`thiet-ke-do-hoa`) |
| 11. Digital Marketing | *None* (0 courses) | **Create New Category #11**: `Digital Marketing & Tăng trưởng` (`digital-marketing`) |
| 12. Business & Entrepreneurship | *None* (0 courses) | **Create New Category #12**: `Quản trị kinh doanh & Khởi nghiệp` (`quan-tri-kinh-doanh-va-khoi-nghiep`) |
| 13. Finance & Accounting | *None* (0 courses) | **Create New Category #13**: `Tài chính, Kế toán & Đầu tư` (`tai-chinh-ke-toan-va-dau-tu`) |
| 14. Project Management | *None* (0 courses) | **Create New Category #14**: `Quản lý dự án & Vận hành Agile` (`quan-ly-du-an-va-van-hanh`) |
| 15. Office Productivity | *None* (0 courses) | **Create New Category #15**: `Tin học văn phòng & Tự động hóa` (`tin-hoc-van-phong-va-tu-dong-hoa`) |
| 16. Personal Development | *None* (0 courses) | **Create New Category #16**: `Phát triển bản thân & Kỹ năng mềm` (`phat-trien-ban-than-va-ky-nang-mem`) |
| 17. Foreign Languages | *None* (0 courses) | **Create New Category #17**: `Ngoại ngữ ứng dụng & Giao tiếp quốc tế` (`ngoai-ngu-ung-dung`) |
| 18. Photography & Video Editing | *None* (0 courses) | **Create New Category #18**: `Nhiếp ảnh, Dựng phim & Sáng tạo nội dung` (`nhiep-anh-va-dung-phim`) |
| 19. Music & Creative Arts | *None* (0 courses) | **Create New Category #19**: `Âm nhạc & Nghệ thuật sáng tạo` (`am-nhac-va-nghe-thuat-sang-tao`) |
| 20. Health, Fitness & Wellness | *None* (0 courses) | **Create New Category #20**: `Sức khỏe, Thể chất & Lối sống` (`suc-khoe-the-chat-va-loi-song`) |

### 8.2 Complete 20-Category Catalog Plan & Course Targets

> [!NOTE]
> All `description` values for the 16 new categories are strictly $\le 200$ characters (between 115 and 165 characters) so they satisfy both `Category.description` (`@db.Text`) in Prisma and `.isLength({ max: 200 })` in `src/middlewares/category.middleware.ts`.

| # | Display Name (`name`) | Unique Slug (`slug`) | Main Domain | Vietnamese Description ($\le 200$ chars) | Existing Courses | Target New Courses | Final Course Count | Priority |
| :-: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| 1 | **Lập trình web** *(Existing)* | `lap-trinh-web` | Technology | Danh mục các khoá học lập trình web | 95 | **0** | **95** | Retained |
| 2 | **Lập trình** *(Existing)* | `lap-trinh` | Technology | Danh mục các khóa học về lập trình web | 94 | **0** | **94** | Retained |
| 3 | **Khoa học dữ liệuu** *(Existing)* | `khoa-hoc-du-lieu` | Data & AI | Danh mục các khóa học về Data Science, Machine Learning | 90 | **0** | **90** | Retained |
| 4 | **ai course** *(Existing)* | `ai-course` | Data & AI | Danh mục các khóa học về AI | 91 | **0** | **91** | Retained |
| 5 | **Phát triển ứng dụng di động** | `phat-trien-ung-dung-di-dong` | Technology | Xây dựng ứng dụng di động đa nền tảng và native trên iOS, Android với Flutter, React Native, SwiftUI và Kotlin. | 0 | **18** | **18** | **P1 (High)** |
| 6 | **An ninh mạng & Bảo mật** | `an-ninh-mang-va-bao-mat` | Technology | Bảo mật hệ thống, kiểm thử xâm nhập (Pentest), SOC, bảo mật ứng dụng web, đám mây và phòng chống mã độc. | 0 | **16** | **16** | **P1 (High)** |
| 7 | **Điện toán đám mây & DevOps** | `dien-toan-dam-may-va-devops` | Technology | Kiến trúc đám mây AWS, Azure, GCP, tự động hóa CI/CD, Kubernetes, Terraform, giám sát hệ thống và SRE. | 0 | **18** | **18** | **P1 (High)** |
| 8 | **Cơ sở dữ liệu & Kỹ thuật dữ liệu** | `co-so-du-lieu-va-ky-thuat-du-lieu` | Data & AI | Thiết kế cơ sở dữ liệu SQL/NoSQL, tối ưu truy vấn, xây dựng Data Pipeline, Apache Spark, Kafka và Lakehouse. | 0 | **16** | **16** | **P1 (High)** |
| 9 | **Thiết kế UI/UX & Sản phẩm số** | `thiet-ke-ui-ux-va-san-pham-so` | Design | Nghiên cứu người dùng (UX Research), thiết kế giao diện trên Figma, xây dựng Design System và Prototyping. | 0 | **20** | **20** | **P1 (High)** |
| 10 | **Thiết kế đồ họa & Truyền thông thị giác** | `thiet-ke-do-hoa` | Design | Thiết kế nhận diện thương hiệu, ấn phẩm truyền thông, minh họa kỹ thuật số với Photoshop, Illustrator, InDesign. | 0 | **16** | **16** | **P2 (Medium)** |
| 11 | **Digital Marketing & Tăng trưởng** | `digital-marketing` | Business & Marketing | Chiến lược tiếp thị số đa kênh, SEO, Google Ads, Facebook/TikTok Ads, Content Marketing, CRM và Growth Hacking. | 0 | **22** | **22** | **P1 (High)** |
| 12 | **Quản trị kinh doanh & Khởi nghiệp** | `quan-tri-kinh-doanh-va-khoi-nghiep` | Business & Marketing | Chiến lược kinh doanh, phát triển sản phẩm, xây dựng mô hình khởi nghiệp, quản trị vận hành và lãnh đạo đội ngũ. | 0 | **20** | **20** | **P1 (High)** |
| 13 | **Tài chính, Kế toán & Đầu tư** | `tai-chinh-ke-toan-va-dau-tu` | Finance & Business | Phân tích báo cáo tài chính doanh nghiệp, kế toán thực hành, lập mô hình tài chính (Financial Modeling) và đầu tư. | 0 | **18** | **18** | **P1 (High)** |
| 14 | **Quản lý dự án & Vận hành Agile** | `quan-ly-du-an-va-van-hanh` | Business & Operations | Quản trị dự án chuyên nghiệp theo chuẩn PMP, Agile, Scrum, Kanban, quản lý rủi ro với Jira và Confluence. | 0 | **16** | **16** | **P2 (Medium)** |
| 15 | **Tin học văn phòng & Tự động hóa** | `tin-hoc-van-phong-va-tu-dong-hoa` | Productivity | Làm chủ Excel nâng cao, Google Sheets, Word, PowerPoint, VBA, Power Automate và ứng dụng AI tối ưu công việc. | 0 | **18** | **18** | **P1 (High)** |
| 16 | **Phát triển bản thân & Kỹ năng mềm** | `phat-trien-ban-than-va-ky-nang-mem` | Personal Growth | Kỹ năng giao tiếp, thuyết trình trước đám đông, tư duy phản biện, đàm phán, quản lý thời gian và trí tuệ cảm xúc. | 0 | **18** | **18** | **P2 (Medium)** |
| 17 | **Ngoại ngữ ứng dụng & Giao tiếp quốc tế** | `ngoai-ngu-ung-dung` | Languages | Tiếng Anh thương mại, luyện thi IELTS/TOEIC, tiếng Nhật, tiếng Hàn, tiếng Trung giao tiếp trong môi trường làm việc. | 0 | **20** | **20** | **P1 (High)** |
| 18 | **Nhiếp ảnh, Dựng phim & Sáng tạo nội dung** | `nhiep-anh-va-dung-phim` | Creative Media | Kỹ thuật nhiếp ảnh, quay dựng video chuyên nghiệp với Premiere Pro, CapCut, DaVinci Resolve và After Effects. | 0 | **14** | **14** | **P2 (Medium)** |
| 19 | **Âm nhạc & Nghệ thuật sáng tạo** | `am-nhac-va-nghe-thuat-sang-tao` | Creative Media | Nhạc lý ứng dụng, đệm hát Guitar, Piano, sản xuất âm nhạc (Music Production), hòa âm phối khí và luyện thanh. | 0 | **10** | **10** | **P3 (Standard)** |
| 20 | **Sức khỏe, Thể chất & Lối sống** | `suc-khoe-the-chat-va-loi-song` | Lifestyle & Wellness | Dinh dưỡng khoa học, Yoga phục hồi, huấn luyện thể lực cá nhân, chăm sóc sức khỏe tinh thần và công thái học. | 0 | **10** | **10** | **P3 (Standard)** |
| — | *(Other Existing Empty / Test Categories)* | *(10 categories)* | — | Retained untouched unless cleanup is explicitly approved | 8 | **0** | **8** | Untouched |
| **Total** | **20 Core Categories** (+10 untouched) | — | **8 Macro Domains** | — | **378** | **+270** | **648** | — |

---

## 9. Recommended Course Expansion Targets

### 9.1 Justification of Target Count (+270 New Courses $\rightarrow$ 648 Total Courses)
- **Current Database Total**: **378 courses** (377 active).
- **Proposed Addition**: **+270 new courses** across 16 new categories.
- **Expected Final Total**: **648 total courses** (**647 active courses**; **630 deterministic seeded courses** = 360 existing + 270 new).
- **Why 270 New Courses (and Not Equal Quotas)**:
  1. Meets the **600–700 total courses** target cleanly without bloating niche categories with repetitive filler.
  2. Uses a **natural tiered distribution** (ranging from **10 courses** in specialized lifestyle/music domains to **20–22 courses** in high-demand career domains like UI/UX Design, Digital Marketing, Business, and Foreign Languages).
  3. **270 is an exact multiple of 3** ($270 = 3 \times 90$) and **an exact multiple of 30** ($270 = 9 \times 30$), enabling:
     - **Perfectly balanced teacher distribution**: Exactly **90 new courses per verified eligible teacher** across the 3 verified teachers (`teacher02`, `teacher_cntt`, `giaovientrungquoc`).
     - **Clean batch processing**: Exactly **9 batches of 30 courses** during DATA-02 seeding.
  4. **Rich Cross-Domain Recommendation Bridges**: Creates natural interdisciplinary bridges for hybrid recommendation experiments:
     - *Web Dev* $\leftrightarrow$ *UI/UX Design* (Figma, Design Systems, Accessibility)
     - *Data Science* $\leftrightarrow$ *Finance & Accounting* / *Digital Marketing* / *Office Productivity* (Excel, Power BI, Financial Modeling, Marketing Analytics)
     - *Software Engineering* $\leftrightarrow$ *Project Management* (Agile, Scrum, Jira, Technical Product Management)
     - *AI* $\leftrightarrow$ *Office Productivity* / *Creative Media* (AI for Office Automation, AI Video/Content Creation)

### 9.2 Difficulty Level & Course Type Distribution for the 270 New Courses
- **Difficulty (`CourseLevel`)**:
  - `BEGINNER`: **108 courses** (40.0%) — Higher beginner ratio in non-IT domains where learners frequently start from scratch.
  - `INTERMEDIATE`: **108 courses** (40.0%) — Applied career and tool-mastery courses.
  - `ADVANCED`: **54 courses** (20.0%) — Specialized professional/certification tracks (e.g., CFA/Financial Modeling, Enterprise AWS/K8s, Pentesting, PMP).
- **Pricing & Type (`CourseType`)**:
  - `FREE` (`price = 0, oldPrice = 0`): **32 courses** (11.9%, exactly 2 per new category) — Introductory gateway courses in every new category.
  - `PAID` (`price > 0, oldPrice >= price`): **238 courses** (88.1%) — Realistic Vietnamese e-learning price tiers (`149,000 VND` to `899,000 VND`) scaled by difficulty level and domain depth.

---

## 10. Existing Teacher Eligibility & Assignment Strategy

### 10.1 Audit of Teacher Representation & Ownership Rules
1. **Schema & Foreign Key Constraints (`prisma/schema.prisma`)**:
   - `Course.authorId` (`@map("author_id") @db.Uuid`) is a **required non-null foreign key** referencing `User.id` with `onDelete: Restrict`.
   - There is no separate `TeacherProfile` table; teacher metadata (`username`, `avatar`, `bio`, `socialFacebook`, `socialInstagram`, `socialGithub`, `role`, `status`, `isVerified`) lives directly on the `User` model (`users` table).
2. **Backend Authorization & Eligibility Rules**:
   - Route `POST /api/courses` is guarded by `verifyToken` and `verifyRole([UserRole.ADMIN, UserRole.TEACHER])`.
   - Teacher endpoints (`/api/teachers/...`) require `role = TEACHER` and `status = ACTIVE`.
3. **Audit of All 17 Users with `role = TEACHER` in `users` Table**:
   - **Eligible Pool (3 Verified, Active Real Teacher Accounts)**:
     1. `13608f92-8acf-53e3-adcb-0d832e9cb1d4` — `teacher02` (`role = TEACHER`, `status = ACTIVE`, `isVerified = true`, has avatar & bio, 95 existing courses).
     2. `6dd1ccd9-420b-5c6d-8322-75223e67e549` — `teacher_cntt` (`role = TEACHER`, `status = ACTIVE`, `isVerified = true`, has avatar & bio, 91 existing courses).
     3. `c79ee551-3b2e-48ca-9105-c0669f04e6bb` — `giaovientrungquoc` (`role = TEACHER`, `status = ACTIVE`, `isVerified = true`, has bio, 91 existing courses).
   - **Excluded Pool A (1 Admin Account Previously Used in `course-data.ts`)**:
     - `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` — `admin_tmdemy` has `role = ADMIN`. Per Section 6.1 (*"Only select users with a valid teacher role according to the actual schema. Do not select students or admins unless the backend explicitly supports them as course authors and this behavior is approved"*), `admin_tmdemy` is **excluded** by default from DATA-02 teacher assignment (existing 94 courses owned by `admin_tmdemy` remain untouched).
   - **Excluded Pool B (14 Unverified Test Fixture Accounts)**:
     - 14 accounts (`teacher1_179284...`, `teacher2_179284...`, `s6_t1_179289...`, `s6_t2_179289...`) have `isVerified = false`, empty bios, and timestamped test usernames created by automated test scripts. They are **excluded** from catalog seeding so test cleanup never breaks catalog courses and storefront cards never display `s6_t1_1792897579436` as an instructor.

### 10.2 Balanced Seeded Pseudo-Random Teacher Assignment Algorithm
To satisfy Section 6.1 (*"Prefer balanced random assignment rather than uncontrolled random selection... Use seeded pseudo-random selection for reproducibility"*):
1. **Eligible Teacher Array**:
   ```typescript
   export const ELIGIBLE_TEACHER_IDS = [
     '13608f92-8acf-53e3-adcb-0d832e9cb1d4', // teacher02 (TEACHER, ACTIVE, VERIFIED)
     '6dd1ccd9-420b-5c6d-8322-75223e67e549', // teacher_cntt (TEACHER, ACTIVE, VERIFIED)
     'c79ee551-3b2e-48ca-9105-c0669f04e6bb'  // giaovientrungquoc (TEACHER, ACTIVE, VERIFIED)
   ] as const
   ```
2. **Algorithm (Stratified Balanced Pool + Mulberry32 Seeded PRNG Fisher-Yates Shuffle)**:
   - **PRNG Seed String**: `"TMDEMY-DATA-02-TEACHER-ASSIGNMENT-SEED-2026"` (hashed via SHA-256 to a 32-bit unsigned integer seed `0x8f3d5b2a`).
   - For the 270 new courses, construct an exact balanced allocation array containing **90 copies of each of the 3 eligible teacher UUIDs** ($90 \times 3 = 270$), and additionally stratify within each category (for a category with $K$ courses, each teacher receives $\lfloor K/3 \rfloor$ or $\lceil K/3 \rceil$ courses, shuffled deterministically via the seeded PRNG).
3. **Projected Teacher Course Distribution (Before vs. After DATA-02)**:

| Teacher ID | Username | Role | Verified | Existing Courses | New Courses Assigned (DATA-02) | Expected Final Courses | Share of New Courses |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `teacher02` | `TEACHER` | `true` | 95 | **+90** | **185** | **33.33%** |
| `6dd1ccd9-420b-5c6d-8322-75223e67e549` | `teacher_cntt` | `TEACHER` | `true` | 91 | **+90** | **181** | **33.33%** |
| `c79ee551-3b2e-48ca-9105-c0669f04e6bb` | `giaovientrungquoc` | `TEACHER` | `true` | 91 | **+90** | **181** | **33.33%** |
| `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | `admin_tmdemy` | `ADMIN` | `true` | 94 | **0** *(Excluded: Admin)* | **94** | 0.0% |
| 14× Unverified Test Teachers | `teacher1_...`, `s6_...` | `TEACHER` | `false` | 7 | **0** *(Excluded: Unverified Test)* | **7** | 0.0% |
| **Total** | — | — | — | **378** | **+270** | **648** | **100.0%** |

---

## 11. Course Metadata Generation Standards (DATA-02 Quality Contract)

Every single one of the 270 new courses in DATA-02 must adhere to the following strict schema-aligned quality standards:

1. **Title (`Course.title`, `VarChar(255)`)**:
   - Length: **35–110 characters**.
   - Must specify the core subject, tool/methodology, and practical scope or target level in natural Vietnamese (retaining international terms like `Figma`, `Power BI`, `SEO`, `IFRS`, `PMP`, `IELTS`).
   - Zero numbered suffixes, zero exaggerated clickbait (`"siêu tốc làm giàu"`, `"tuyệt đỉnh số 1"`).
2. **Short & Full Description (`Course.description`, `Text`)**:
   - Since `Course` has a single `description` column (`@db.Text`) and no separate `shortDescription` column, we structure `Course.description` using a **two-part convention** (250–400 Vietnamese words, ~1,400–2,400 characters):
     - **Paragraph 1 (Lead Summary / Short Description, 120–200 chars)**: Concise summary of the core topic, primary learning benefit, and target learner (ideal for UI card truncation `line-clamp-2`).
     - **Paragraphs 2–4 (Substantive Full Description, 220–350 words)**: Detailed overview of core concepts, practical workflows/projects covered, real-world applicability, target audience profile, and expected career/skill transformation.
3. **Learning Outcomes (`Course.benefits`, `String[]`)**:
   - **4 to 6 course-specific, observable skill statements** per course (never generic boilerplate).
   - Must start with concrete action verbs (*"Thiết kế..."*, *"Phân tích..."*, *"Triển khai..."*, *"Xây dựng..."*, *"Đo lường..."*).
4. **Prerequisites (`Course.requirements`, `String[]`)**:
   - **2 to 4 realistic prerequisites** calibrated to `Course.level`:
     - `BEGINNER`: No prior domain experience required; specifies only relevant software/equipment (e.g., *"Máy tính cài sẵn Microsoft Excel 2019/365"*, *"Đàn Guitar thùng (Acoustic hoặc Classic) để thực hành"*).
     - `INTERMEDIATE`: Requires foundational domain knowledge (e.g., *"Đã nắm vững kiến thức kế toán đại cương hoặc nguyên lý kế toán"*).
     - `ADVANCED`: Requires concrete intermediate skills and hands-on experience (e.g., *"Tối thiểu 6 tháng kinh nghiệm vận hành hệ thống Linux và Docker cơ bản"*).
5. **Skills / Topics (`Course.techniques`, `String[]`)**:
   - **4 to 7 specific skill/topic keywords** per course (e.g., `['Financial Modeling', 'DCF Valuation', 'Excel Finance', 'Corporate Finance', 'P&L Forecast']`).
   - Acts as the primary structured feature vector for Content-Based Filtering and Hybrid Ranking.
6. **Course Documents / Deliverables (`Course.documents`, `String[]`)**:
   - **2 to 3 domain-authentic deliverables** (e.g., *"Bộ biểu mẫu Financial Model 3 báo cáo tài chính chuẩn doanh nghiệp (.xlsx)"*, *"Figma Design System UI Kit hơn 200 components"*—not `"Kho mã nguồn GitHub"` for non-coding courses!).
7. **Course FAQs (`Course.faqs` / `CourseFaq` relation)**:
   - **2 domain-specific FAQs per course** (optional/recommended in DATA-02) to enrich `course.info.qa`.
8. **Chapters & Lessons (`Chapter` / `Lesson`)**:
   - Course creation does **not** require chapters or lessons at the database or service layer (`createCourseService` creates `Course` + `CourseFaq` only).
   - **Recommendation for DATA-02**: Keep DATA-02 focused on seeding the 16 categories and 270 courses (plus optionally 2–3 outline-only `Chapter` records per course if desired), and **do not fabricate fake completed video assets or Bunny Stream IDs** (`bunnyVideoId = null`).
9. **Thumbnails (`Course.image`)**:
   - Reuse the project's existing safe, domain-neutral static URL format (curated high-availability Unsplash educational asset URLs already whitelisted by CSP/Next.js `images.remotePatterns`) grouped by domain, without scraping copyrighted third-party images.

---

## 12. Recommendation Readiness Analysis

### 12.1 Content-Based Filtering Readiness (Before vs. After DATA-02)

| Dimension | Current State (378 Courses) | Post-DATA-02 State (648 Courses) | Impact on Recommendation Algorithms |
| :--- | :--- | :--- | :--- |
| **Domain Diversity** | 4 IT categories only | **20 categories across 8 macro domains** | Enables true cross-domain vs. intra-domain negative sampling and cold-start category onboarding |
| **TF-IDF Feature Richness** | ~24 words/course in `description`; identical `benefits`/`requirements` | **250–400 words/course** + unique `benefits`, `requirements`, `techniques` | Increases unique vocabulary size by $>4\times$ and eliminates boilerplate cosine similarity inflation |
| **Sentence Embeddings (`paraphrase-multilingual-MiniLM-L12-v2` / `bge-m3`)** | Short 1-sentence descriptions saturate into a single dense IT cluster | Multi-paragraph Vietnamese + technical keyword descriptions form well-separated domain clusters | High cosine separability between unrelated domains ($\text{sim} < 0.15$) and graded similarity within related tracks ($\text{sim} \in [0.35, 0.75]$) |
| **Skill Graph / Tag Overlap (`techniques`)** | Only IT/coding tags (`React`, `Python`, `Docker`) | **350+ distinct cross-domain skill tags** (`Figma`, `SEO`, `IFRS`, `Excel`, `PMP`, `IELTS`) | Supports hybrid tag-overlap scoring and explainable recommendations (*"Vì bạn quan tâm đến Power BI & Phân tích dữ liệu"*) |

### 12.2 Collaborative Filtering Readiness & Data Sparsity Audit
Auditing existing user-course interaction tables in `tmdemy` reveals:
- **Users**: 118 total (81 with gamification/learning profiles; only ~67 users have $\ge 1$ enrollment).
- **Enrollments**: 591 total, but **concentrated entirely within 49 courses** (specifically the 32 Phase-5 courses + 17 baseline/test courses). **329 of 378 existing courses (87.0%) have 0 enrollments**.
- **Ratings**: Only **4 ratings** exist in the entire database across 4 courses (`0.009%` matrix density).
- **Orders / Favorites / Comments**: 30 orders, 6 favorites, 15 comments.
- **Matrix Sparsity Conclusion**:
  - The user-item interaction matrix ($118 \times 378$) has an enrollment density of **$1.32\%$** overall, and **$0\%$** outside the 49 courses with enrollments. For ratings, density is **$0.009\%$**.
  - **Crucial Engineering Reality**: Adding 270 new courses in DATA-02 will **not** solve Collaborative Filtering cold-start sparsity (in fact, new courses start with 0 enrollments and 0 ratings).
  - Therefore, the TMdemy Recommendation System **must** be architected as a **Content-First Hybrid Recommender**:
    1. **Primary Candidate Generation**: Content-Based Similarity (TF-IDF + Multilingual Sentence Embeddings over `title`, `description`, `techniques`, `benefits`, `category`, `level`).
    2. **Behavioral Personalization Re-Ranking**: For users with enrollments, progress, quiz submissions, or favorites, compute a user profile vector as the recency- and progress-weighted average of their interacted course vectors, combined with popularity priors (`view`, `sold`, `averageRating`) and difficulty progression rules (`BEGINNER` $\rightarrow$ `INTERMEDIATE` $\rightarrow$ `ADVANCED`).

---

## 13. Risks and Constraints

| # | Risk / Constraint | Severity | Mitigation Strategy |
| :-: | :--- | :---: | :--- |
| 1 | **`Course.status` Visibility Constraint**: Public catalog API (`GET /api/courses`) filters strictly by `status = 'approved'` and `is_destroyed = false` (`course.repository.ts` line 656). If new courses are seeded as `PENDING`, they will **not** appear in public catalog queries until approved. | **High** | Support a configurable `--status=PENDING\|APPROVED` flag in the DATA-02 seed script (defaulting to safe `PENDING` per prompt Section 9, or `APPROVED` if approved by Project Owner in Section 15). |
| 2 | **`Category.description` Length Constraint**: `category.middleware.ts` enforces `.isLength({ max: 200 })` on HTTP category creation/update. | **Medium** | Keep all 16 new category descriptions strictly $\le 200$ characters (verified: 105–165 chars). |
| 3 | **Automated Test Artifacts Polluting Public Category List**: 7 `Step 5 Category ...` and `Step 6 Category ...` records are active (`isDestroyed = false`) and appear first in `GET /api/categories` (`ORDER BY created_at DESC`). | **Medium** | New categories created in DATA-02 will have newer `createdAt` timestamps and push test categories down; optionally soft-delete the 7 test categories if approved by Project Owner. |
| 4 | **Teacher Pool Size (3 Verified Teachers)**: Only 3 verified `TEACHER` accounts exist (`teacher02`, `teacher_cntt`, `giaovientrungquoc`). | **Low** | Distribute the 270 new courses evenly (90 each) via seeded PRNG shuffle across the 3 verified teachers. |
| 5 | **Prisma Interactive Transaction Timeouts**: Upserting large batches over remote/local PostgreSQL can exceed default 5s interactive transaction timeouts. | **Medium** | Use array-based batch transactions `prisma.$transaction(chunk.map(...))` with a safe batch size of **25–30 courses per batch** (proven in `prisma/seed.ts`). |

---

## 14. DATA-02 Implementation Plan Overview

*(Full implementation-ready specifications, code structure, and templates are provided in `docs/planning/DATA_02_CATEGORY_COURSE_SEED_PLAN.md`.)*

1. **Step 1 — Pre-Flight Read-Only Verification**: Verify the 3 eligible teacher UUIDs (`role = TEACHER`, `status = ACTIVE`, `isVerified = true`) and 4 existing core categories exist before writing anything.
2. **Step 2 — Deterministic Category Seeding (16 Categories)**: Generate deterministic UUIDv5 IDs (`seed-category:<slug>`) and idempotently `upsert` the 16 new categories in a single transaction, attributing `createdById` to `admin_tmdemy` (`8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8`), matching the existing 4 core categories.
3. **Step 3 — Pre-Seed Validation & Duplicate Gate**: Run the 4-stage validation & similarity check (Zod `createCourseInputSchema`, slug/title uniqueness, normalized Jaccard $\le 0.60$, TF-IDF Cosine $\le 0.65$, non-empty unique `benefits`/`requirements`/`techniques`).
4. **Step 4 — Batch Course Upsert (9 Batches × 30 Courses = 270 Courses)**: Generate deterministic UUIDv5 IDs (`seed-course-v2:<slug>`) and execute idempotent `prisma.course.upsert` in batches of 30 inside `prisma.$transaction(...)`. Never touch existing 378 courses.
5. **Step 5 — Post-Seed Audit & Rollback Readiness**: Verify exact row counts (`14 + 16 = 30` categories, `378 + 270 = 648` courses, 0 duplicate slugs, 0 orphan FKs). Provide a deterministic rollback command that deletes only records matching the `seed-category:` and `seed-course-v2:` deterministic UUIDv5 list if rollback is ever requested.

---

## 15. Decisions Requiring User Approval Before DATA-02

Before executing **DATA-02**, please review and approve the following **5 decisions**:

1. **Decision 1 — Initial `Course.status` for the 270 New Courses**:
   - *Option A (Safe Default per Prompt Section 9)*: Seed all 270 new courses with `status = CourseStatus.PENDING` (or provide a script to promote them to `APPROVED` upon review). *Note: While `PENDING`, they will only be visible in Admin/Teacher dashboards, not on public `GET /api/courses`.*
   - *Option B (Immediate Catalog & Recommendation Visibility)*: Seed with `status = CourseStatus.APPROVED` (or a realistic mix such as ~90% `APPROVED` / ~10% `PENDING`, matching the existing 360-course seed).
2. **Decision 2 — Eligible Teacher Pool for New Course Assignment**:
   - *Recommended*: Use strictly the **3 verified active teachers** (`teacher02`, `teacher_cntt`, `giaovientrungquoc`), assigning **90 new courses each** via seeded pseudo-random shuffle, and excluding `admin_tmdemy` (`role = ADMIN`) and the 14 unverified test teacher accounts (`isVerified = false`).
3. **Decision 3 — Proposed 16 New Categories & +270 Course Target (648 Total Courses)**:
   - Confirm whether the 16 new categories (forming a 20-category active taxonomy) and the target of **+270 new courses** (bringing the database from 378 to **648 total courses**) are approved.
4. **Decision 4 — Existing Category Display-Name Typos & Test Artifact Categories**:
   - *Option A (Strict Non-Modification Default)*: Leave all 14 existing categories 100% untouched (including `"Khoa học dữ liệuu"`, `"ai course"`, and the 7 `"Step 5/6 Category ..."` test records).
   - *Option B (Targeted Hygiene)*: Fix the display name typo `"Khoa học dữ liệuu"` $\rightarrow$ `"Khoa học dữ liệu"`, capitalize `"ai course"` $\rightarrow$ `"Trí tuệ nhân tạo (AI)"` (keeping slugs unchanged), and soft-delete (`isDestroyed = true`) the 7 `"Step 5/6 Category ..."` test artifact categories so they stop appearing at the top of `GET /api/categories`.
5. **Decision 5 — Outline Chapters (`Chapter`) for New Courses**:
   - *Option A (Course Metadata Only — Recommended)*: Seed the 270 `Course` records with rich `description` (250–400 words), `benefits` (4–6 outcomes), `requirements` (2–4 prerequisites), `techniques` (4–7 skills), and `documents` (2–3 resources), without fabricating empty chapters/lessons.
   - *Option B (Course Metadata + Outline Chapters)*: Also seed 3–4 structural `Chapter` titles per new course (with 0 fabricated video lessons) so course landing pages display a curriculum syllabus outline.

---

## 16. Validation Evidence

| Verification Item | Method | Result | Status |
| :--- | :--- | :--- | :---: |
| **Database Queries Were Strictly Read-Only** | Audited via `findMany`, `count`, `groupBy` in scratch audit scripts | 0 inserts, 0 updates, 0 deletes executed | ✅ **VERIFIED (PASS)** |
| **Actual Category & Course Counts Verified** | Direct PostgreSQL query on `categories` and `courses` | 14 categories (13 active, 1 deleted); 378 courses (377 active, 1 deleted) | ✅ **VERIFIED (PASS)** |
| **Teacher Eligibility Verified Against Schema** | Queried `users` by `role`, `status`, `isVerified`, and `authoredCourses` | 3 verified active `TEACHER` accounts (`teacher02`, `teacher_cntt`, `giaovientrungquoc`) | ✅ **VERIFIED (PASS)** |
| **Proposed Metadata Fits Schema Constraints** | Cross-checked against `prisma/schema.prisma`, `category.model.ts`, `course.model.ts`, and Express Validators | `title <= 255`, `slug <= 255`, `Category.description <= 200`, `Course.description` (`Text`), `String[]` arrays | ✅ **VERIFIED (PASS)** |
| **Proposed Taxonomy Avoids Duplicates** | Checked all 16 proposed names & slugs against all 14 existing DB categories | 0 name conflicts, 0 slug conflicts | ✅ **VERIFIED (PASS)** |
| **Course Targets Numerically Consistent** | Verified category targets sum & teacher allocation sum | $\sum \text{New Courses} = 270$; $378 + 270 = 648$; $3 \times 90 = 270$ | ✅ **VERIFIED (PASS)** |
| **No Existing Data Changed** | Checked row counts and timestamps before and after audit | 14 categories, 378 courses, 118 users unchanged | ✅ **VERIFIED (PASS)** |
| **No New Dependencies Installed** | Inspected `package.json` | 0 packages added or modified | ✅ **VERIFIED (PASS)** |
| **No Migrations Executed** | Checked `prisma/migrations` | 0 migrations created or executed | ✅ **VERIFIED (PASS)** |

---

## 17. Execution Trace

1. **Project & Rule Discovery**:
   - Read `AGENTS.md`, `.agents/rules/tmdemy-rules.md`, `package.json`, `prisma/schema.prisma`, and `prisma/seed.ts`.
   - Inspected `src/models/category.model.ts`, `src/models/course.model.ts`, `src/models/user.model.ts`.
   - Inspected `src/repositories/category.repository.ts`, `src/repositories/course.repository.ts`, `src/services/category.service.ts`, `src/services/course.service.ts`, `src/middlewares/category.middleware.ts`, and `src/middlewares/course.middleware.ts`.
   - Inspected `prisma/seeds/course-data.ts`, `web-courses.ts`, `programming-courses.ts`, `data-courses.ts`, `ai-courses.ts`, `docs/seed/COURSE_SEED_REPORT.md`, and `docs/progress/PHASE_5_RICH_DATA_SEED_REPORT.md`.
2. **Read-Only Database Audit Execution**:
   - Executed read-only Prisma inspection scripts against PostgreSQL (`tmdemy`) to collect exact counts, distributions, text length statistics, array repetition signatures, TF-IDF cosine similarity pairs, and teacher eligibility metrics.
3. **Deliverable Generation**:
   - Created `docs/progress/DATA_01_CATEGORY_COURSE_DATASET_AUDIT_REPORT.md`.
   - Created `docs/planning/DATA_02_CATEGORY_COURSE_SEED_PLAN.md`.

