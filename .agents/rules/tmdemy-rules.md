---
trigger: always_on
---

Nội dung bắt buộc:

1. Giữ nguyên toàn bộ API Contract hiện tại: endpoint URL, HTTP method, request body, query parameters, response structure và HTTP status codes.
2. Không tự ý thêm, xóa, đổi tên hoặc thiết kế lại API endpoint.
3. Postman Collection hiện tại là baseline chính thức để kiểm thử API regression.
4. Phạm vi migration là chuyển Database Layer từ MongoDB/Mongoose sang PostgreSQL/Prisma, không phải xây dựng lại hệ thống API.
5. Được phép điều chỉnh Service, Repository, Controller, Middleware và Serializer khi cần thiết để tương thích Prisma, nhưng phải duy trì API Contract.
6. Không tự ý thay đổi Prisma Schema đã được phê duyệt.
7. Nếu phát hiện API Contract cũ có lỗi hoặc có điểm không tương thích với PostgreSQL, phải phân tích, báo cáo phương án và chờ tôi phê duyệt trước khi thay đổi.
8. Không tự ý bỏ qua các chức năng hiện có hoặc thay thế bằng implementation đơn giản hơn.

Sau khi tạo, hãy xác nhận vị trí file Rule và phạm vi áp dụng. Không chỉnh sửa source code hoặc thực hiện migration trong nhiệm vụ này.
## DATABASE MIGRATION RULES – VALIDATORS & MIDDLEWARE

These rules apply to ALL migration phases from MongoDB/Mongoose to PostgreSQL/Prisma.



### 1. Validator and Middleware Migration

* Every validator and middleware within the current migration phase must be audited for MongoDB/Mongoose dependencies.
* Do not leave Mongoose Model queries inside validators or middleware when the corresponding functionality has been migrated to PostgreSQL.
* Do not directly access Prisma Client inside validators or middleware.
* When database validation is required, use the appropriate Functional Repository function.
* Do not migrate validators or middleware belonging to a different phase unless they are shared dependencies and the change is necessary for the current phase.

### 2. ObjectId to UUID

* Replace MongoDB ObjectId validation with PostgreSQL UUID validation for migrated entities.
* Do not use `mongoose.Types.ObjectId.isValid()` or `.isMongoId()` for PostgreSQL IDs.
* Reuse existing UUID utilities in `src/utils/uuid.ts`.
* Do not create duplicate UUID validation utilities.
* Ensure UUID validation is consistent across routes, validators, middleware, controllers, services and repositories.

### 3. Database Validation

For validators that check database records:

* Use Functional Repository functions instead of Mongoose Models or direct Prisma queries.
* Check the corresponding Prisma schema constraints before choosing a query method.
* Do not assume a field is unique unless the Prisma schema confirms it.
* Keep database-level unique constraints as the final protection against duplicate records and race conditions.
* Handle relevant Prisma errors, such as P2002, in the appropriate Service or error-handling layer.

### 4. API Contract Preservation

* Preserve existing endpoint URLs, HTTP methods, request body structures, validation behavior, error messages and response contracts wherever technically possible.
* Do not change validation rules merely to make Prisma implementation easier.
* Document any unavoidable behavior differences before implementing them.

### 5. Migration Documentation

For every phase, document:

* Validators audited.
* Middleware audited.
* Files modified.
* Mongoose dependencies removed.
* UUID validation changes.
* Repository functions introduced or reused.
* Remaining Mongoose dependencies outside the current phase.
* Tests performed and their results.

### 6. Scope Protection

* Only modify validators and middleware belonging to the current phase or necessary shared dependencies.
* Do not prematurely migrate modules belonging to future phases.
* Keep MongoDB/Mongoose available for modules that have not yet been migrated.
* Do not remove Mongoose dependencies globally until the final decommission phase is approved.
