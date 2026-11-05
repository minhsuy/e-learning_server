# DATA-02: DRY-RUN VALIDATION REPORT

**Date & Time**: 2026-10-28T15:06:55.093Z  
**Environment**: Development / PostgreSQL 16.11 (`tmdemy`)  
**Execution Mode**: `--dry-run` (Strict Read-Only)  
**Status**: **PASSED (ALL 4 SAFETY GATES VERIFIED)**

---

## 1. Executive Summary

A comprehensive read-only dry-run simulation of the **DATA-02 Seeding Plan** was performed against the live TMdemy PostgreSQL database. All 4 safety gates were evaluated and verified. **Zero database mutations occurred.**

| Metric | Baseline Snapshot | Post Dry-Run | Delta | Target After `--execute` |
| :--- | :--- | :--- | :--- | :--- |
| **Total Categories** | 14 | 14 | **0** | **30** (+16) |
| **Active Categories** | 13 | 13 | **0** | **22** (-7 +16 = +9) |
| **Destroyed Categories** | 1 | 1 | **0** | **8** (+7) |
| **Total Courses** | 378 | 378 | **0** | **648** (+270) |
| **Approved Active Courses** | 340 | 340 | **0** | **610** (+270) |

---

## 2. Gate Verification Details

### Gate 1: Preconditions & Approved Entity Integrity
- **Teacher Pool Verification**:
  - `teacher02` (`13608f92-8acf-53e3-adcb-0d832e9cb1d4`): Role `TEACHER`, verified (`isVerified: true`), active (`isDestroyed: false`).
  - `teacher_cntt` (`6dd1ccd9-420b-5c6d-8322-75223e67e549`): Role `TEACHER`, verified (`isVerified: true`), active (`isDestroyed: false`).
  - `giaovientrungquoc` (`c79ee551-3b2e-48ca-9105-c0669f04e6bb`): Role `TEACHER`, verified (`isVerified: true`), active (`isDestroyed: false`).
- **Category Creator Admin**: `admin_tmdemy` (`8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8`) confirmed active with role `ADMIN`.
- **Existing Categories to Normalize (3 records)**: `Khoa học dữ liệuu` (typo fix), `ai course` (display name standardize), `Lập trình` (description clarify) confirmed existing and intact.
- **Confirmed Test Categories (7 records)**: All 7 categories verified to contain only `PENDING` test courses with 0 orders, 0 ratings, and 0 active enrollments.

### Gate 2: In-Memory Dataset Compilation
- **Total Blueprints**: 270 / 270 (100% matched across 16 new categories).
- **Unique Slugs & Titles**: 0 duplicate slugs, 0 duplicate titles.
- **Description Quality**: Average 313 words per course description (min 225, max 373 words) with rich domain-specific Vietnamese curriculum.

### Gate 3: Live Collision & Constraint Audit
- **Category Slugs**: 0 collisions against live PostgreSQL database.
- **Course Slugs**: 0 collisions against live PostgreSQL database.
- **Teacher Quota Invariant**:
  - `teacher02`: exactly **90** courses assigned.
  - `teacher_cntt`: exactly **90** courses assigned.
  - `giaovientrungquoc`: exactly **90** courses assigned.

### Gate 4: Zero Mutation Invariant Audit
- Database queries executed: Strictly read-only (`count`, `findUnique`, `findMany`).
- Verified that `preSnapshot === postSnapshot` for all monitored entities.

---

## 3. Ready For Execution

The dry-run concluded successfully. Database changes are authorized to execute via:
```bash
npx.cmd tsx scripts/run_data02_seed.ts --execute
```
