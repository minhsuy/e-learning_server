# BÁO CÁO TRIỂN KHAI MODULE ID MAPPER (UUID MAPPER IMPLEMENTATION REPORT)

> **Giai đoạn**: IMPLEMENTATION — ID MAPPER UTILITY & UNIT TESTS  
> **Thời gian thực hiện**: 2026-09-30 20:53:00 (UTC+7)  
> **Trạng thái**: Hoàn thành xuất sắc, 16/16 Unit Tests ĐẠT (PASS), 100% không đụng chạm dữ liệu hay source code ứng dụng.

---

## 1. TỔNG QUAN FILE ĐÃ TẠO

Các module tiện ích độc lập phục vụ migration được đặt tách biệt ngoài mã nguồn ứng dụng (`src/`):

1. **[scripts/migration-utils/id-mapper.ts](file:///d:/e-learning_server/scripts/migration-utils/id-mapper.ts)**:
   - Module ánh xạ ID tất định (Deterministic ID Mapper) từ MongoDB ObjectId sang PostgreSQL UUID v5.
   - Triển khai thuật toán chuẩn RFC 4122 UUID v5 bằng native Node.js `crypto` (không phụ thuộc package ngoài).
2. **[scripts/migration-utils/id-mapper.test.ts](file:///d:/e-learning_server/scripts/migration-utils/id-mapper.test.ts)**:
   - Bộ unit tests độc lập bao phủ toàn bộ Test Matrix (16 test cases).
   - Chạy hoàn toàn in-memory, tuyệt đối không kết nối hay truy vấn database.

---

## 2. API CỦA MODULE ID MAPPER

### 2.1 `toPostgresUuid(entity: MigrationEntity | string, sourceId: unknown): string`
- **Mục đích**: Chuyển đổi MongoDB ObjectId thành PostgreSQL UUID v5 theo phạm vi thực thể (Entity Scope).
- **Canonical Key**: `<entity_scope>:<normalized_source_id>` (ví dụ: `users:68dcf8f9e3617ec76053b4d7`).
- **Hỗ trợ đầu vào**: Chuỗi hex 24 ký tự hoặc MongoDB `Types.ObjectId` (tự động trích xuất qua `.toHexString()`).
- **Chuẩn hóa**: Tự động `.trim().toLowerCase()`.

### 2.2 `toSubEntityUuid(entity: MigrationEntity | string, parentId: unknown, suffix: string | number): string`
- **Mục đích**: Sinh UUID v5 cho các sub-entity không có ObjectId riêng trong MongoDB (như `question_options`, `course_faqs`).
- **Canonical Key**: `<entity_scope>:<normalized_parent_id>:<normalized_suffix>` (ví dụ: `question_options:68efc26e56c8e188e87cd459:0`).
- **Đảm bảo**: Index `0` và Index `1` luôn sinh ra hai UUID khác nhau, nhưng cùng index `0` chạy lại 100 lần luôn ra cùng một UUID.

### 2.3 `resolveNotificationRelatedId(type: string | null | undefined, relatedId: string | null | undefined): string | null`
- **Mục đích**: Phân giải trường đa hình `relatedId` trong bảng `notifications`.
- **Logic ánh xạ**:
  - `relatedId` rỗng hoặc null $\rightarrow$ trả về `null`.
  - `relatedId` không phải ObjectId 24 hex (ví dụ: mã thông báo hệ thống) $\rightarrow$ giữ nguyên chuỗi gốc.
  - `relatedId` là ObjectId 24 hex $\rightarrow$ ánh xạ chính xác theo loại thông báo:
    - `'order'` $\rightarrow$ `toPostgresUuid('orders', relatedId)`
    - `'rating'` $\rightarrow$ `toPostgresUuid('ratings', relatedId)`
    - `'quiz'` $\rightarrow$ `toPostgresUuid('quiz_submissions', relatedId)`
    - `'course'` $\rightarrow$ `toPostgresUuid('courses', relatedId)`
    - `'lesson'` $\rightarrow$ `toPostgresUuid('lessons', relatedId)`
    - `'comment'` / `'comment_reply'` $\rightarrow$ `toPostgresUuid('comments', relatedId)`
    - `'message'` $\rightarrow$ `toPostgresUuid('messages', relatedId)`
    - Các type khác $\rightarrow$ giữ nguyên chuỗi gốc.

---

## 3. PROJECT NAMESPACE & CƠ CHẾ VALIDATION

- **Project Namespace cố định**:
  ```typescript
  export const DEFAULT_PROJECT_NAMESPACE = '7b2a6f84-1d3e-4b95-a8c2-3e5f7a9d1b0c';
  ```
- **Cơ chế Environment Override (`MIGRATION_UUID_NAMESPACE`)**:
  - Nếu không thiết lập: Sử dụng `DEFAULT_PROJECT_NAMESPACE`.
  - Nếu thiết lập: Bắt buộc phải là chuỗi UUID 36 ký tự chuẩn (`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`).
  - **Không bao giờ silently fallback**: Nếu biến môi trường chứa UUID không hợp lệ, hệ thống lập tức ném lỗi `InvalidNamespaceError`.

---

## 4. DANH SÁCH ENTITY WHITELIST (22 ENTITIES)

Hệ thống bắt buộc kiểm tra whitelist nghiêm ngặt, ném lỗi `InvalidEntityError` nếu truyền tên bảng không hợp lệ:
1. `users`
2. `categories`
3. `courses`
4. `course_faqs`
5. `chapters`
6. `lessons`
7. `quizzes`
8. `questions`
9. `question_options`
10. `quiz_submissions`
11. `quiz_submission_answers`
12. `orders`
13. `coupons`
14. `enrollments`
15. `progress`
16. `certificates`
17. `ratings`
18. `favorite_courses`
19. `comments`
20. `conversations`
21. `messages`
22. `notifications`

*(Các bảng trung gian N:N `coupon_courses`, `conversation_participants`, `message_reads` sử dụng composite primary key trực tiếp từ các foreign key UUID, không có UUID riêng).*

---

## 5. CÁC LỚP LỖI TÙY BIẾN (CUSTOM ERROR CLASSES)

- `InvalidEntityError`: Báo lỗi khi tên entity không nằm trong danh sách whitelist 22 bảng.
- `MissingSourceIdError`: Báo lỗi khi `sourceId` bị null, undefined, chuỗi rỗng hoặc chỉ toàn khoảng trắng.
- `InvalidSourceIdError`: Báo lỗi khi `sourceId` không phải định dạng MongoDB ObjectId 24 ký tự hex.
- `InvalidNamespaceError`: Báo lỗi khi biến môi trường `MIGRATION_UUID_NAMESPACE` không đúng định dạng canonical UUID.

---

## 6. KẾT QUẢ KIỂM THỬ ĐƠN VỊ (UNIT TEST RESULTS)

Lệnh thực thi:
```bash
npx tsx scripts/migration-utils/id-mapper.test.ts
```

Kết quả: **16/16 TESTS ĐẠT (PASS 100%)**

```text
=============================================
 RUNNING ID MAPPER UNIT TESTS (TEST MATRIX) 
=============================================

--- Group 1: Core Test Matrix ---
  ✔ [PASS] Test 1 — Deterministic: Same entity + same ObjectId must produce the same UUID
  ✔ [PASS] Test 2 — Entity Isolation: Different entities with same ObjectId must produce different UUIDs
  ✔ [PASS] Test 3 — Different ObjectId: Different ObjectIds on same entity must produce different UUIDs
  ✔ [PASS] Test 4 — Case Normalization: Uppercase/lowercase/mixed ObjectId must produce the exact same UUID
  ✔ [PASS] Test 5 — Entity Whitelist: Non-whitelisted entity must throw InvalidEntityError
  ✔ [PASS] Test 6 — Missing Source ID: null, undefined, empty, or whitespace-only must throw MissingSourceIdError
  ✔ [PASS] Test 7 — Sub-entity Determinism: Same parent ID + same suffix must produce identical UUIDs
  ✔ [PASS] Test 8 — Sub-entity Distinct: Different suffixes under same parent must produce different UUIDs
  ✔ [PASS] Test 9 — Notification Order: type=order with valid ObjectId resolves to orders UUID
  ✔ [PASS] Test 10 — Notification Non-ObjectId: arbitrary string is preserved untouched

--- Group 2: Extended Validation & Edge Cases ---
  ✔ [PASS] Test 11 — ObjectId Object vs String: Mock Types.ObjectId object matches plain string
  ✔ [PASS] Test 12 — Whitespace trimming: Leading/trailing whitespace is trimmed before hashing
  ✔ [PASS] Test 13 — Invalid ObjectId format: Non-24 hex string throws InvalidSourceIdError
  ✔ [PASS] Test 14 — All 22 Entities: Every entity in MIGRATION_ENTITIES generates valid UUID v5
  ✔ [PASS] Test 15 — Notification Polymorphic Types: All registered types resolve to correct entity UUID
  ✔ [PASS] Test 16 — Environment Namespace Override: Valid env UUID overrides namespace, invalid throws

=============================================
 SUMMARY: 16/16 TESTS PASSED 
=============================================
```

---

## 7. KẾT QUẢ TYPECHECK & LINT

1. **TypeScript Typecheck**:
   - `tsc` kiểm tra nghiêm ngặt với cờ `--strict --esModuleInterop`: **0 errors**.
2. **ESLint / Prettier**:
   - Chạy `eslint` trên các file mới: **0 errors, 0 warnings**.

---

## 8. XÁC NHẬN TÍNH TOÀN VẸN CỦA DATABASE

- **MongoDB Status**: **100% UNTOUCHED (NGUYÊN VẸN)**.
  - Toàn bộ 19 collections với đúng 120 documents không bị thay đổi.
- **PostgreSQL Status**: **100% EMPTY (0 BUSINESS ROWS)**.
  - Toàn bộ 26 bảng nghiệp vụ PostgreSQL có đúng **0 bản ghi**.
  - **CHƯA CÓ BẤT KỲ DỮ LIỆU NÀO ĐƯỢC CHUYỂN TỪ MONGODB SANG POSTGRESQL.**
- **Mã nguồn ứng dụng (`src/`)**: Không bị thay đổi.

---

```text
UUID MAPPER IMPLEMENTATION: COMPLETE
UNIT TESTS: PASS
SCHEMA MODIFIED: NO
BUSINESS SOURCE MODIFIED: NO
DATA MIGRATED: NO
MONGODB MODIFIED: NO
POSTGRESQL BUSINESS DATA MODIFIED: NO
```
