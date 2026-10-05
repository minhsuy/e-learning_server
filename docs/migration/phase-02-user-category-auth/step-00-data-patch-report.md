# BÁO CÁO THỰC THI STEP 0: XÂY DỰNG SCRIPT XỬ LÝ DỮ LIỆU `isVerified`
## PHASE 2: USER, CATEGORY & AUTHENTICATION MIGRATION
**Dự án**: TMDEMY E-Learning Backend  
**Database**: PostgreSQL 16.11 (`tmdemy`) qua Prisma ORM 6.4.1  
**Ngày thực hiện**: 01/10/2026  
**Trạng thái**: **HOÀN THÀNH STEP 0 (CHẾ ĐỘ READ-ONLY/DRY-RUN, DATABASE 100% AN TOÀN)**

---

## 1. CÁC TẬP TIN ĐÃ TẠO

1. **Script chính**:
   [scripts/migration-utils/patch-phase2-users.ts](file:///d:/e-learning_server/scripts/migration-utils/patch-phase2-users.ts)
   * Chứa logic đánh giá phân loại 7 tài khoản lịch sử.
   * Chế độ mặc định là **DRY-RUN** (chỉ đọc, in bảng tổng hợp, không ghi DB).
   * Chế độ **EXECUTE** bọc trong Prisma Transaction, kiểm tra điều kiện nghiêm ngặt (Sanity Pre-checks).
   * Bảo mật thông tin nhạy cảm: Tuyệt đối không select password, OTP, tokens. Tự động che email (`maskEmail`).
2. **Kịch bản kiểm thử (Test suite)**:
   [scripts/migration-utils/patch-phase2-users.test.ts](file:///d:/e-learning_server/scripts/migration-utils/patch-phase2-users.test.ts)
   * Kiểm tra tính đúng đắn của danh sách phân loại (5 approved, 2 excluded).
   * Kiểm tra hàm che email.
   * Kiểm tra tính toàn vẹn và đối chiếu thực tế với PostgreSQL ở chế độ READ-ONLY.

---

## 2. CẤU TRÚC PRISMA USER MODEL ĐÃ XÁC NHẬN

Đã đối chiếu trực tiếp với [prisma/schema.prisma](file:///d:/e-learning_server/prisma/schema.prisma):
* **Model**: `User` (Bảng `users` trong PostgreSQL).
* **Khóa chính**: `id String @id @default(uuid()) @db.Uuid`.
* **Trường `isVerified`**: `isVerified Boolean @default(false) @map("is_verified")`.
* **Trường `role`**: `role UserRole @default(USER)` (PostgreSQL enum `UserRole` với các nhãn `'admin'`, `'teacher'`, `'user'`).
* **Trường `status`**: `status UserStatus @default(ACTIVE)` (`active`, `inactive`).
* **Prisma Client**: Sử dụng Singleton từ [src/config/prisma.ts](file:///d:/e-learning_server/src/config/prisma.ts), không khởi tạo kết nối mới.

---

## 3. CƠ CHẾ HOẠT ĐỘNG CỦA DRY-RUN VÀ EXECUTE

### A. Chế độ Mặc định: DRY-RUN (Read-Only)
* Kích hoạt bằng lệnh:
  ```bash
  npx tsx scripts/migration-utils/patch-phase2-users.ts
  # hoặc
  npx tsx scripts/migration-utils/patch-phase2-users.ts --dry-run
  ```
* **Hành vi**:
  1. Kết nối PostgreSQL qua Prisma Client Singleton.
  2. Chỉ select các trường an toàn (`id`, `username`, `email`, `role`, `status`, `isVerified`, `createdAt`).
  3. Đối chiếu từng tài khoản với danh sách phê duyệt trong `decisions-register.md`.
  4. Hiển thị bảng chi tiết gồm: UUID, Username, Masked Email, Role, Phân loại, `isVerified` hiện tại, và Hành động dự kiến.
  5. Thống kê số lượng: 5 tài khoản đủ điều kiện patch, 2 tài khoản bị loại trừ.
  6. **Tuyệt đối không thực hiện bất kỳ thao tác ghi (INSERT/UPDATE/DELETE) nào vào database**.

### B. Chế độ EXECUTE (Có điều kiện bảo vệ nghiêm ngặt)
* Chỉ chạy khi có cờ tường minh:
  ```bash
  npx tsx scripts/migration-utils/patch-phase2-users.ts --execute
  ```
* **Cơ chế phòng vệ và tính nguyên tử (Transaction)**:
  1. **Sanity Pre-checks**:
     * Kiểm tra chính xác 5 UUID phải nằm trong danh sách `APPROVED_ACCOUNTS`.
     * Đối chiếu email thực tế trong DB phải khớp hoàn toàn với email dự kiến.
     * Xác nhận trạng thái hiện tại của cả 5 tài khoản phải là `isVerified === false`.
     * Nếu có bất kỳ điều kiện nào sai lệch $\rightarrow$ Ngay lập tức ném Exception và hủy bỏ (Abort).
  2. **Prisma Transaction (`prisma.$transaction`)**:
     * Cập nhật `isVerified: true` cho đúng 5 tài khoản.
     * Kiểm tra số lượng bản ghi thực tế được cập nhật: nếu `updateRes.count !== 5` $\rightarrow$ Tự động **ROLLBACK**.
     * Kiểm tra lại 2 tài khoản bị loại trừ: nếu có bất kỳ tài khoản loại trừ nào bị thay đổi $\rightarrow$ Tự động **ROLLBACK**.
  3. **Lưu ý**: Trong Step 0 này, lệnh `--execute` **KHÔNG ĐƯỢC PHÉP CHẠY** và đã được bảo vệ an toàn.

---

## 4. DANH SÁCH 5 TÀI KHOẢN ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT CẬP NHẬT

| STT | UUID (PostgreSQL) | Username | Email (Masked) | Role | Hoạt động thực tế (Bằng chứng được chấp thuận) | Hành động dự kiến |
| :---: | :--- | :--- | :--- | :---: | :--- | :---: |
| 1 | `8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8` | `new_username123` | `tha***@gmail.com` | `ADMIN` | Đã tạo toàn bộ 3 Categories và 2 Courses hệ thống | `PATCH_TO_TRUE` |
| 2 | `13608f92-8acf-53e3-adcb-0d832e9cb1d4` | `nguyen_anh_binh` | `n***@gmail.com` | `TEACHER` | Tác giả 5 Courses, 7 Lessons, 1 Comment | `PATCH_TO_TRUE` |
| 3 | `6dd1ccd9-420b-5c6d-8322-75223e67e549` | `teacher_cntt` | `tea***@gmail.com` | `TEACHER` | Tác giả 1 Course, 1 Order, 1 Enrollment | `PATCH_TO_TRUE` |
| 4 | `c55de839-f059-519c-8820-b16aa17fb9c3` | `minhsuyyyyy` | `tha***@gmail.com` | `USER` | 6 Orders, 3 Enrollments, 4 Comments, 1 Rating, 2 Quiz Submissions | `PATCH_TO_TRUE` |
| 5 | `02e8e13a-dab2-5fb6-a14f-933ac125edca` | `thaiminh` | `tha***@gmail.com` | `USER` | 1 Order, 1 Enrollment, 3 Comments | `PATCH_TO_TRUE` |

---

## 5. DANH SÁCH 2 TÀI KHOẢN BỊ LOẠI TRỪ (GIỮ NGUYÊN `isVerified = false`)

| STT | UUID (PostgreSQL) | Username | Email (Masked) | Role | Lý do loại trừ theo Quyết định D1 | Hành động |
| :---: | :--- | :--- | :--- | :---: | :--- | :---: |
| 1 | `773e6719-acb0-5750-b06d-7445812f40b3` | `thaiminh` | `tha***@gmail.com` | `USER` | 0 Course, 0 Order, 0 Enrollment, 0 Comment (Chưa đủ bằng chứng) | `RETAIN_FALSE` |
| 2 | `6b760425-effa-5713-99ba-b296e6cf190d` | `levanquang` | `lev***@gmail.com` | `USER` | 0 Course, 0 Order, 0 Enrollment, 0 Comment (Chưa đủ bằng chứng) | `RETAIN_FALSE` |

---

## 6. KẾT QUẢ KIỂM TRA TYPESCRIPT

Đã thực hiện kiểm tra kiểu tĩnh (Static Type Check) với TypeScript Compiler:
```bash
npx.cmd tsc --noEmit --skipLibCheck --target ES2023 --module NodeNext --moduleResolution NodeNext --esModuleInterop scripts/migration-utils/patch-phase2-users.ts
npx.cmd tsc --noEmit --skipLibCheck --target ES2023 --module NodeNext --moduleResolution NodeNext --esModuleInterop scripts/migration-utils/patch-phase2-users.test.ts
```
* **Kết quả**: **0 lỗi biên dịch** (Exit code 0). Cả 2 file tương thích hoàn hảo với TypeScript 5.8.3 và NodeNext module resolution.

---

## 7. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (TEST RESULTS)

Chạy test suite: `npx.cmd tsx scripts/migration-utils/patch-phase2-users.test.ts`:
```text
================================================================================
  TEST SUITE: PATCH-PHASE2-USERS (STEP 0)
================================================================================
  PASSED: APPROVED_ACCOUNTS contains exactly 5 accounts
  PASSED: EXCLUDED_ACCOUNTS contains exactly 2 accounts
  PASSED: ALL_HISTORICAL_ACCOUNTS contains exactly 7 accounts
  PASSED: Zero ID overlap between approved and excluded lists
  PASSED: All 5 approved UUIDs match decisions-register.md specification
  PASSED: All 2 excluded UUIDs match decisions-register.md specification
  PASSED: maskEmail properly formats long emails (tha***@gmail.com)
  PASSED: maskEmail properly formats short emails (n***@gmail.com)

  Evaluating live PostgreSQL records (READ-ONLY)...
  PASSED: evaluateHistoricalAccounts evaluated 7 accounts (got 7)
  PASSED: All 7 historical accounts exist in PostgreSQL database (found 7)
  PASSED: Exactly 5 accounts are classified as PATCH_TO_TRUE (got 5)
  PASSED: Exactly 2 accounts are classified as RETAIN_FALSE (got 2)
  PASSED: Database state verified: All 7 accounts remain isVerified = false (Zero writes occurred)

--------------------------------------------------------------------------------
TOTAL TESTS: 13 | PASSED: 13 | FAILED: 0
--------------------------------------------------------------------------------
```
* **Kết luận test**: Đạt **13/13 test cases passed** (100% thành công).

---

## 8. KẾT QUẢ CHẠY DRY-RUN THỰC TẾ

Chạy lệnh: `npx.cmd tsx scripts/migration-utils/patch-phase2-users.ts`:
```text
================================================================================
  TMDEMY — PHASE 2: HISTORICAL USER DATA PATCH (STEP 0)
================================================================================
Mode: 🟢 DRY-RUN (READ-ONLY)
Execution Timestamp: 2026-10-01T15:06:57.475Z
--------------------------------------------------------------------------------

[AUDIT RESULTS OF 7 HISTORICAL ACCOUNTS]:

┌─────────┬───┬────────────────────────────────────────┬───────────────────┬────────────────────┬───────────┬────────────────┬────────────────────┬─────────────────┐
│ (index) │ # │ UUID                                   │ Username          │ Masked Email       │ Role      │ Classification │ Current isVerified │ Planned Action  │
├─────────┼───┼────────────────────────────────────────┼───────────────────┼────────────────────┼───────────┼────────────────┴────────────────────┴─────────────────┤
│ 0       │ 1 │ '8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8' │ 'new_username123' │ 'tha***@gmail.com' │ 'ADMIN'   │ 'APPROVED'     │ false              │ 'PATCH_TO_TRUE' │
│ 1       │ 2 │ '13608f92-8acf-53e3-adcb-0d832e9cb1d4' │ 'nguyen_anh_binh' │ 'n***@gmail.com'   │ 'TEACHER' │ 'APPROVED'     │ false              │ 'PATCH_TO_TRUE' │
│ 2       │ 3 │ '6dd1ccd9-420b-5c6d-8322-75223e67e549' │ 'teacher_cntt'    │ 'tea***@gmail.com' │ 'TEACHER' │ 'APPROVED'     │ false              │ 'PATCH_TO_TRUE' │
│ 3       │ 4 │ 'c55de839-f059-519c-8820-b16aa17fb9c3' │ 'minhsuyyyyy'     │ 'tha***@gmail.com' │ 'USER'    │ 'APPROVED'     │ false              │ 'PATCH_TO_TRUE' │
│ 4       │ 5 │ '02e8e13a-dab2-5fb6-a14f-933ac125edca' │ 'thaiminh'        │ 'tha***@gmail.com' │ 'USER'    │ 'APPROVED'     │ false              │ 'PATCH_TO_TRUE' │
│ 5       │ 6 │ '773e6719-acb0-5750-b06d-7445812f40b3' │ 'thaiminh'        │ 'tha***@gmail.com' │ 'USER'    │ 'EXCLUDED'     │ false              │ 'RETAIN_FALSE'  │
│ 6       │ 7 │ '6b760425-effa-5713-99ba-b296e6cf190d' │ 'levanquang'      │ 'lev***@gmail.com' │ 'USER'    │ 'EXCLUDED'     │ false              │ 'RETAIN_FALSE'  │
└─────────┴───┴────────────────────────────────────────┴───────────────────┴────────────────────┴───────────┴────────────────┴────────────────────┴─────────────────┘

[SUMMARY STATISTICS]:
  • Total Historical Accounts Evaluated: 7
  • Approved Targets Eligible for Patch:  5
  • Excluded Accounts Retaining False:    2
  • Accounts Already Verified:            0
  • Error / Missing Records:              0

================================================================================
  🟢 [DRY-RUN COMPLETE] NO CHANGES WERE WRITTEN TO POSTGRESQL.
  To apply these changes, run with explicit flag: --execute
================================================================================
```

---

## 9. XÁC NHẬN DỮ LIỆU DATABASE KHÔNG BỊ THAY ĐỔI

Truy vấn kiểm tra trực tiếp PostgreSQL `tmdemy` sau khi chạy script:
```json
[
  { "id": "c55de839-f059-519c-8820-b16aa17fb9c3", "role": "USER", "isVerified": false },
  { "id": "13608f92-8acf-53e3-adcb-0d832e9cb1d4", "role": "TEACHER", "isVerified": false },
  { "id": "8eb5b1cb-9b46-5ce8-b7c2-9d0d86c893e8", "role": "ADMIN", "isVerified": false },
  { "id": "773e6719-acb0-5750-b06d-7445812f40b3", "role": "USER", "isVerified": false },
  { "id": "6dd1ccd9-420b-5c6d-8322-75223e67e549", "role": "TEACHER", "isVerified": false },
  { "id": "02e8e13a-dab2-5fb6-a14f-933ac125edca", "role": "USER", "isVerified": false },
  { "id": "6b760425-effa-5713-99ba-b296e6cf190d", "role": "USER", "isVerified": false }
]
```
* **Xác nhận**: **100% cả 7 tài khoản lịch sử vẫn giữ nguyên trạng thái `isVerified: false`**. Không có bất kỳ thay đổi nào trong cơ sở dữ liệu.

---

## 10. NHỮNG RỦI RO VÀ ĐIỀU KIỆN CHỜ XÁC NHẬN

1. **Thực thi bản vá thực tế (`--execute`)**:
   * Script đã sẵn sàng và kiểm thử an toàn tuyệt đối.
   * Để áp dụng cập nhật `isVerified: true` cho 5 tài khoản trên, cần sự phê duyệt và kích hoạt riêng từ Chủ dự án.
   * AI tuân thủ nguyên tắc không tự ý chạy execute.
2. **Kế hoạch tiếp theo (Step 1)**:
   * Sau khi Chủ dự án nghiệm thu Step 0, hệ thống sẵn sàng chuyển sang **Step 1: Tách biệt Mongoose Legacy Model sang `src/models/legacy/user.legacy.model.ts` và xây dựng Zod Application Models**.

---

**KẾT THÚC BÁO CÁO STEP 0 — CHỜ Ý KIẾN CHỦ DỰ ÁN.**
