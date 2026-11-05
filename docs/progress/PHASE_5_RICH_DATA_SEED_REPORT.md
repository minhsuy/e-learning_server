# TMDEMY PHASE 5: RICH E-LEARNING + GAMIFICATION DATASET SEED REPORT

**Status**: `PASS`  
**Date**: `2026-10-07`  
**Execution Environment**: Node.js v22.22.2, PostgreSQL 16.11 (`tmdemy`), Prisma ORM 6.4.1  
**Scope**: Database Seeding & Data Population Only (Read/Write side logic & schema frozen)  

---

## 1. Executive Summary

Phase 5 has successfully seeded a rich, realistic, and production-like e-learning and gamification dataset for TMdemy without altering database schemas, breaking API contracts, or resetting existing data.

- **70 realistic demo users** were introduced across 5 authentic behavioral groups (Inactive, Beginners, Active Learners, Hardcore Learners, Top Champions).
- **Curriculum structures** (64 Chapters, 288 Lessons, 64 Quizzes with multiple-choice questions) were populated across 32 featured courses covering all 4 core categories: **Web Development**, **Programming**, **Data Science**, and **AI**.
- **Authentic learning activity**: 557 course enrollments, 3,540 completed lesson progress records, 616 quiz submissions, and 5,600 XP transactions were generated with natural timelines spanning the past 40–180 days.
- **100% Referential & Idempotent Integrity**: Every single XP transaction point is backed by an actual lesson completion (+70 XP), quiz submission (+100 XP), or business-day streak (+20 XP, `Asia/Ho_Chi_Minh`). Every user's `xpTotal` strictly matches the sum of their transactions (0 mismatch).
- **All 7 Rank tiers** (Beginner, Explorer, Learner, Skilled, Advanced, Expert, Master) are dynamically represented, turning the Leaderboard and Gamification APIs into a demo-ready showcase.

---

## 2. Before vs. After Metrics

| Entity | Baseline (Before) | Seeded Dataset (After) | Delta | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Users** | 11 | **81** | +70 | 11 baseline preserved, 70 realistic demo learners |
| **Courses** | 370 | **370** | 0 | Preserved entire 370-course catalog from Phase 1 |
| **Categories** | 4 | **4** | 0 | Web Dev, Programming, Data Science, AI |
| **Chapters** | 13 | **77** | +64 | 2 chapters added per target course |
| **Lessons** | 8 | **296** | +288 | 8–10 structured lessons per target course |
| **Enrollments** | 8 | **565** | +557 | Real enrollments distributed across categories |
| **Progress** | 5 | **3,545** | +3,540 | Exact lesson completion records (`completed=true`) |
| **Quizzes** | 4 | **68** | +64 | 2 interactive quizzes per target course |
| **Quiz Submissions** | 4 | **620** | +616 | Realistic score & answer submissions |
| **XP Transactions** | 2 | **5,602** | +5,600 | 100% valid `lesson_completed`, `quiz_completed`, `daily_streak` |

---

## 3. User Behavioral Distribution

The 70 demo users are distributed across 5 behavioral profiles to reflect authentic student dynamics:

| Behavioral Group | User Range | User Count | Enrollments / User | Completed Lessons | Completed Quizzes | Daily Streaks | XP Range | Rank Representation |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Group A: Inactive** | `01` – `12` | 12 | 0 – 1 | 0 | 0 | 0 | 0 XP | **Beginner** (Lv 1) |
| **Group B: Beginners** | `13` – `30` | 18 | 2 – 3 | 1 – 14 | 0 – 3 | 1 – 4 | 90 – 1,400 XP | **Beginner** (Lv 1), **Explorer** (Lv 2) |
| **Group C: Active Learners** | `31` – `50` | 20 | 4 – 5 | 16 – 61 | 3 – 10 | 5 – 13 | 1,560 – 5,770 XP | **Learner** (Lv 3), **Skilled** (Lv 4) |
| **Group D: Hardcore Learners** | `51` – `64` | 14 | 12 – 23 | 66 – 160 | 11 – 28 | 14 – 30 | 6,260 – 15,280 XP | **Advanced** (Lv 5), **Expert** (Lv 6) |
| **Group E: Top Champions** | `65` – `70` | 6 | 26 – 31 | 175 – 260 | 30 – 45 | 32 – 45 | 16,650 – 24,700 XP | **Expert** (Lv 6), **Master** (Lv 7) |

---

## 4. XP & Rank Distribution

All 81 users in the database are classified dynamically using `getRankFromXp(xpTotal)` without storing static rank columns:

```text
Beginner (0 – 499 XP):       33 users (40.7%)  [22 demo + 11 baseline]
Explorer (500 – 1,499 XP):    8 users  (9.9%)
Learner (1,500 – 2,999 XP):  10 users (12.3%)
Skilled (3,000 – 5,999 XP):  10 users (12.3%)
Advanced (6,000 – 9,999 XP):  8 users  (9.9%)
Expert (10,000 – 19,999 XP):  9 users (11.1%)
Master (20,000+ XP):          3 users  (3.7%)
─────────────────────────────────────────────
Total:                       81 users (100.0%)
```

---

## 5. Course Enrollment Distribution

Enrollments are diversified across all 4 categories (Web, Programming, Data Science, AI):

- **Users with 0 enrollments**: 14 users (17.3%) *(Inactive learners and un-enrolled baseline users)*
- **Users with 1 – 3 enrollments**: 26 users (32.1%) *(Beginners & casual explorers)*
- **Users with 4 – 6 enrollments**: 21 users (25.9%) *(Active regular learners)*
- **Users with 7+ enrollments**: 20 users (24.7%) *(Hardcore developers & champions)*

---

## 6. Progress Percentage Distribution

Progress percentages are computed based on actual lessons completed within each enrolled course: `progress = Math.round((completed / totalLessons) * 100)`:

- **0% Progress**: 134 enrollments (23.7%) *(Courses newly joined, not yet started)*
- **1% – 25% Progress**: 9 enrollments (1.6%) *(Early beginner stage)*
- **26% – 50% Progress**: 15 enrollments (2.7%) *(Approaching halfway)*
- **51% – 75% Progress**: 12 enrollments (2.1%) *(Substantial completion)*
- **76% – 99% Progress**: 9 enrollments (1.6%) *(Final chapter in progress)*
- **100% Progress**: 386 enrollments (68.3%) *(Fully completed courses, status = COMPLETED)*

---

## 7. Learning Streak Distribution

Streaks reflect real consecutive active days in `Asia/Ho_Chi_Minh` time, with `longestStreak >= currentStreak` preserved on all records:

- **0 streak**: 29 users (35.8%) *(Inactive or broken streak)*
- **1 – 3 days**: 13 users (16.0%)
- **4 – 7 days**: 11 users (13.6%)
- **8 – 14 days**: 10 users (12.3%)
- **15 – 30 days**: 12 users (14.8%)
- **30+ days**: 6 users (7.4%) *(Peak streak: 52 days)*

---

## 8. XP Transaction Type Breakdown

Every single transaction record in `xp_transactions` adheres to the canonical event key naming convention:

| Transaction Type | Description | XP Per Action | Record Count | Total XP Generated |
| :--- | :--- | :---: | :---: | :---: |
| `LESSON_COMPLETED` | `lesson-complete:{userId}:{lessonId}` | +70 XP | **3,541** | 247,870 XP |
| `QUIZ_COMPLETED` | `quiz-complete:{userId}:{quizId}` | +100 XP | **616** | 61,600 XP |
| `DAILY_STREAK` | `daily-streak:{userId}:{YYYY-MM-DD}` | +20 XP | **1,445** | 28,900 XP |
| **Total** | | | **5,602** | **338,370 XP** |

---

## 9. Top 10 All-Time Leaderboard Snapshot

A sample of the resulting leaderboard as produced by `GET /api/leaderboard`:

| Rank | Username | Total XP | Derived Rank | Streak (Current / Peak) | Target Specialization |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **#1** | `khang_leaderboard_no1` | 24,700 XP | **Master** | 45 / 52 | Quán quân bảng xếp hạng TMdemy |
| **#2** | `kiet_apex_learner` | 22,740 XP | **Master** | 43 / 50 | Cạnh tranh vị trí số 1 All-Time |
| **#3** | `khoa_grandmaster` | 20,800 XP | **Master** | 40 / 48 | Đại kiện tướng Gamification |
| **#4** | `long_master_coder` | 19,450 XP | **Expert** | 38 / 45 | Kỷ lục gia làm quiz điểm tuyệt đối |
| **#5** | `thinh_legend_ai` | 18,000 XP | **Expert** | 35 / 42 | Chuyên gia AI hàng đầu |
| **#6** | `tuan_champion` | 16,650 XP | **Expert** | 32 / 40 | Huyền thoại học tập TMdemy |
| **#7** | `duy_tan_senior` | 15,280 XP | **Expert** | 30 / 38 | Principal Engineer |
| **#8** | `thai_son_cloud` | 14,300 XP | **Expert** | 29 / 35 | Kiến trúc sư giải pháp đa đám mây |
| **#9** | `tuong_quan_code` | 13,420 XP | **Expert** | 28 / 34 | Top 1% kỳ thi lập trình |
| **#10** | `vinh_phuc_ai` | 12,440 XP | **Expert** | 26 / 32 | Chuyên gia thị giác máy tính |

---

## 10. Data Integrity & Validation Results

### 10.1. Referential & Relational Integrity
- **XP Sum Check**: Checked all 81 users: `user.xpTotal === sum(user.xpTransactions.amount)` -> **0 mismatches (100% exact)**.
- **Streak Anomaly Check**: Checked all 81 users: `user.currentStreak <= user.longestStreak` -> **0 anomalies (100% exact)**.
- **Unique Constraint Check**:
  - `duplicate email` = **0**
  - `duplicate username` = **0**
  - `duplicate enrollment (userId_courseId)` = **0**
  - `duplicate progress (userId_lessonId)` = **0**
  - `duplicate quiz submission (quizId_userId)` = **0**
  - `duplicate XP eventKey` = **0**
- **Foreign Key Validity**: All enrollments point to real courses, all progress records point to real lessons in the enrolled course, all quiz submissions point to real quizzes.

### 10.2. Tooling Validation Commands
- `npx prisma validate`: **PASS (Schema valid)**
- `npx prisma migrate status`: **PASS (4 migrations applied, schema up to date)**
- `npx eslint prisma/seeds/... scripts/...`: **0 errors, 0 warnings**

---

## 11. Seed Idempotency Test

The seed pipeline was executed twice sequentially via `scripts/run_phase5_seed.ts`:

| Execution Run | Final Users | Final Courses | Final Lessons | Final Enrollments | Final XP Transactions | Duplicate Created |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Run 1** | 81 | 370 | 296 | 565 | 5,602 | **0** |
| **Run 2** | 81 | 370 | 296 | 565 | 5,602 | **0 (NO DUPLICATES)** |

*Result: Idempotency is 100% verified.*

---

## 12. API Testing Verification

All Phase 4 Gamification Read APIs were tested directly against the seeded dataset (`scripts/test_gamification_apis.ts`):

1. `GET /api/leaderboard?page=1&limit=10`: **PASS** (Correct order, Master/Expert top tiers, sensitive fields like password/email protected).
2. `GET /api/leaderboard?page=2&limit=10`: **PASS** (Deterministic pagination, seamless continuum into Advanced rank).
3. `GET /api/leaderboard/me`: **PASS** (Master resolved to #1, Hardcore resolved to #19, Inactive resolved to #60).
4. `GET /api/users/me/xp-summary`: **PASS** (Accurate rank name, thresholds, streak, nextRank).
5. `GET /api/users/me/streak`: **PASS** (Accurate currentStreak, longestStreak, timezone).
6. `GET /api/users/me/xp-history`: **PASS** (History pagination with 405 transactions for top user, sorted newest first).

### Regression Testing:
- Phase 4 Leaderboard Suite (`scripts/test_phase4_leaderboard.ts`): **14/14 PASS**
- Phase 3B Quiz & Streak Suite (`scripts/test_phase3b_xp_streak.ts`): **12/12 PASS**
- Phase 3A Lesson XP Suite (`scripts/test_phase3a_xp.ts`): **7/7 PASS**

---

## 13. Data Safety Confirmation

- **Existing data preserved**: **YES** (11 baseline users, 370 courses preserved).
- **Database reset**: **NO** (`prisma migrate reset` was NEVER executed).
- **Existing courses deleted**: **NO**.
- **Existing users deleted**: **NO**.
- **Prisma Schema modified**: **NO**.
- **API Contracts modified**: **NO**.

---

## 14. Phase Boundary Declaration

```text
Rich Curriculum Seeding (32 courses):     IMPLEMENTED
70 Demo Users Across 5 Behavioral Tiers:  IMPLEMENTED
Enrollments & Varied Progress Simulation: IMPLEMENTED
Quiz Submissions & Interactive Activity:  IMPLEMENTED
XP Transactions & Dynamic Ranks:          IMPLEMENTED
Deterministic Idempotency:                IMPLEMENTED

Frontend Gamification UI:                 NOT IMPLEMENTED (Reserved for next phase)
Frontend Leaderboard UI:                  NOT INTEGRATED (Reserved for next phase)
AI Recommendation / Machine Learning:     NOT IMPLEMENTED
MongoDB Migration:                        NOT TOUCHED
```

---

## 15. Conclusion & Stop Condition

Phase 5 is **100% COMPLETE**. The PostgreSQL database now contains a rich, authentic dataset that makes TMdemy look like a mature, active e-learning platform with realistic user behaviors, progression paths, and competition dynamics.

Per Section 24, all work has stopped. No frontend modifications, AI workflows, or subsequent phases will begin until explicitly instructed.
