# BÁO CÁO AUDIT, TÁI CẤU TRÚC VÀ CHUẨN HÓA TÀI LIỆU AGENTS.MD

**Dự án**: TMDEMY E-Learning Backend Migration  
**Tài liệu**: `docs/migration/agents-rules-audit-report.md`  
**Ngày thực hiện**: 03/10/2026  
**Mục tiêu**: Báo cáo kết quả kiểm tra toàn diện, rà soát khuyết điểm, bổ sung quy tắc còn thiếu, tái cấu trúc logic và chuẩn hóa tài liệu quy tắc phát triển & migration `AGENTS.md`.  
**Phạm vi tác động**: Duy nhất file `AGENTS.md` và file báo cáo này. Tuyệt đối không can thiệp mã nguồn, database, Prisma schema, Postman collection hay package dependencies.

---

## A. CẤU TRÚC BAN ĐẦU CỦA AGENTS.MD (ORIGINAL STRUCTURE)

Trước khi thực hiện chuẩn hóa, `AGENTS.md` bao gồm 21 phần (từ Section I đến Section XXI) với tổng cộng 2,187 dòng, được hình thành qua nhiều lần cập nhật rời rạc:

```text
Section I.     NGUYÊN TẮC THỰC HIỆN
Section II.    TỔNG QUAN DỰ ÁN TMDEMY (1. Thông tin, 2. Tech Stack, 3. Database)
Section III.   KIẾN TRÚC BACKEND BẮT BUỘC (1. Router, 2. Middleware, 3. Controller, 4. Service, 5. Repository, 6. Prisma Client)
Section IV.    APPLICATION MODEL DESIGN: ZOD + PRISMA (1. Giữ nguyên Models, 2. Phân định trách nhiệm, 3. Naming, 4. Public/Internal, 5. Select & Zod)
Section V.     GLOBAL MIDDLEWARE VÀ REQUEST VALIDATION RULES (1. Phạm vi, 2. Validation ở Middleware, 3. Cấm DB ở Validator, 4. Auth/Authz, 5. UUID, 6. API Contract, 7. Từng Module, 8. handleValidationErrors, 9. Phân định trách nhiệm)
Section VI.    USER ROUTE VÀ AUTHENTICATION FLOW (Endpoints, Middleware, Route, Flow)
Section VII.   AUTHENTICATION VÀ AUTHORIZATION MIDDLEWARE
Section VIII.  API CONTRACT FREEZE
Section IX.    MONGOOSE DECOMMISSION STRATEGY
Section X.     DATABASE MIGRATION VÀ DATA INTEGRITY (1. UUID Mapping, 2. Data Integrity)
Section XI.    PRISMA RELATIONS VÀ QUERY RULES
Section XII.   BUSINESS LOGIC VÀ TRANSACTION (1. Commerce, 2. Course, 3. Quiz, 4. Progress, 5. Comments, 6. Chat, 7. Notification)
Section XIII.  ERROR HANDLING VÀ RESPONSE
Section XIV.   SOCKET.IO, CRON JOBS VÀ MODULE PHỤ THUỘC
Section XV.    TESTING VÀ POSTMAN (1. Postman, 2. Raw Body JSON, 3. Báo cáo kết quả)
Section XVI.   MIGRATION ROADMAP ĐÃ ĐƯỢC PHÊ DUYỆT (Phase 1 đến Phase 11)
Section XVII.  QUY TRÌNH LÀM VIỆC CHO MỖI PHASE (Step 1 đến Step 7)
Section XVIII. CODE QUALITY VÀ NGUYÊN TẮC THIẾT KẾ
Section XIX.   QUY TẮC LÀM VIỆC VỚI CHỦ DỰ ÁN
Section XX.    NGUỒN TÀI LIỆU ƯU TIÊN
Section XXI.   NHIỆM VỤ SAU KHI TẠO AGENTS.MD
```

---

## B. CÁC VẤN ĐỀ ĐƯỢC PHÁT HIỆN TRONG QUÁ TRÌNH AUDIT (PROBLEMS FOUND)

### 1. Dư thừa Prompt Artifacts / Meta-Instructions (Misplaced Instructions)
* **Section I** (`NGUYÊN TẮC THỰC HIỆN`, dòng 1–25) và **Section XXI** (`NHIỆM VỤ SAU KHI TẠO AGENTS.MD`, dòng 2135–2187) thực chất là các đoạn chỉ dẫn từ prompt yêu cầu trợ lý AI khi sinh ra file `AGENTS.md` (ví dụ: *"Trước khi viết AGENTS.md, phải kiểm tra..."*, *"Sau khi kiểm tra codebase và tạo AGENTS.md... Xác nhận không sửa source code... ĐÂY LÀ NHIỆM VỤ TẠO TÀI LIỆU AGENTS.MD"*).
* Các nội dung này không phải là quy tắc kỹ thuật vận hành dự án TMDEMY, làm tài liệu mất tính quy chuẩn và gây nhầm lẫn về vai trò của file Rules.

### 2. Các quy tắc cốt lõi bị phân tán và trùng lặp (Duplicated & Scattered Rules)
* **Nguyên tắc bất khả xâm phạm**: Bị xé lẻ và lặp lại tại Section I, Section VIII, Section XIX và Section XXI. Các lệnh cấm như *"Không tự ý mở rộng scope"*, *"Không tự chuyển Phase"*, *"Không cài package"*, *"Không sửa Prisma schema"* xuất hiện rải rác 4–5 lần với câu từ khác nhau.
* **Express Validator vs Zod vs Service**: Xuất hiện trùng lặp ở Section III.2, Section IV.2, Section V.2, Section V.3, Section V.9 và Section VII.
* **Quy tắc Functional Repository**: Được mô tả ở Section III.5, nhắc lại ở Section XVII Step 1, và lặp lại ở Section XVIII.
* **Quy tắc UUID Validation**: Xuất hiện rời rạc ở Section V.5, Section X.1 và Section XV.1.
* **Chiến lược Decommission Mongoose**: Xuất hiện ở Section II.3, Section IX, Section XIV và Section XVI (Phase 11).
* **Kiểm thử Postman**: Xuất hiện ở Section VIII, Section XV.1 và Section XX.

### 3. Vị trí các phần bị xáo trộn, thiếu tính logic (Misplaced Sections)
* **Section VI (`USER ROUTE VÀ AUTHENTICATION FLOW`)**: Đây là thông số kỹ thuật chi tiết của riêng Phase 2 (User & Auth), nhưng lại bị đặt chen ngang vào giữa các nguyên tắc kiến trúc toàn cục (nằm giữa Section V `Global Middleware` và Section VII `Auth Middleware`, trước cả Section VIII `API Contract Freeze` và Section X `Database`).
* **Section VII (`AUTHENTICATION VÀ AUTHORIZATION MIDDLEWARE`)**: Bị tách rời khỏi Section V (`Global Middleware`) dù cùng thuộc phạm vi xử lý Middleware và lặp lại các ý về `req.user`.
* **Section XIX (`QUY TẮC LÀM VIỆC VỚI CHỦ DỰ ÁN`)** và **Section XX (`NGUỒN TÀI LIỆU ƯU TIÊN`)**: Nằm ở tận cuối tài liệu, sau cả Testing và Roadmap, trong khi thứ bậc tài liệu và quyền hạn phê duyệt là nền tảng phải được xác định ngay từ đầu.

### 4. Những quy tắc còn thiếu hoặc chưa đủ chặt chẽ (Missing Rules & Ambiguities)
* **Khung phân loại tích hợp Zod (Zod Integration 5-Tier Framework)**: Chưa có phân loại rõ ràng cho từng mức độ sử dụng Zod (`Runtime Validation`, `Type-only Usage`, `Imported but Unused`, `Defined but Not Integrated`, `Not Applicable`), dẫn đến nguy cơ AI áp dụng `.parse()` một cách cơ học hoặc suy đoán sai mức độ hoàn thành.
* **Ánh xạ Request DTO cũ (Legacy Request DTO Mapping)**: Chưa có chỉ dẫn tường minh về việc xử lý các trường dữ liệu MongoDB cũ gửi lên từ Frontend (như `category` -> `categoryId`, snake_case fields `intro_url`, `old_price`).
* **Xử lý Prisma Decimal và tương thích `_id`**: Chưa có quy tắc bắt buộc về việc serialize `Decimal` sang `number` trong API response và quy tắc sử dụng decorator `withCompatId()` từ `src/utils/uuid.ts` để đồng thời cung cấp alias `_id` phục vụ Next.js frontend.
* **Postman Collection là Golden Regression Baseline**: Chưa tuyên bố dứt khoát vai trò của Postman Collection hiện tại như một baseline bất khả xâm phạm; thiếu quy định rõ ràng về những gì được phép cập nhật (UUID sample, biến môi trường) và những gì bị cấm sửa đổi (assertions, endpoint format).
* **Phân biệt Lỗi Baseline và Lỗi Hồi quy (Baseline vs Regression Errors)**: Chưa có tiêu chí phân biệt giữa lỗi vốn có trong mã nguồn cũ và lỗi do migration gây ra, dẫn đến nguy cơ AI tự ý sửa API contract khi thấy logic cũ có bug.
* **Quy trình xử lý ngoại lệ và bất hợp lý (Escalation Protocol)**: Thiếu quy trình xử lý chuẩn khi phát hiện API cũ có khiếm khuyết kỹ thuật.

---

## C. CẤU TRÚC MỚI CHUẨN HÓA CỦA AGENTS.MD (NEW STRUCTURE)

Tài liệu đã được tái cơ cấu thành 9 phần logic (Sections A đến I) theo đúng định hướng quy chuẩn chuyên nghiệp, kèm phần Phụ lục tham chiếu module cụ thể:

```text
# AGENTS.MD - TÀI LIỆU QUY TẮC PHÁT TRIỂN VÀ MIGRATION TMDEMY

A. TỔNG QUAN DỰ ÁN & BỐI CẢNH MIGRATION
   1. Thông tin dự án
   2. Tech Stack mục tiêu & Phiên bản thực tế
   3. Kiến trúc Database kép (Transitional Dual-Stack: PostgreSQL vs MongoDB)
   4. Mục tiêu & Nguyên lý cốt lõi của Migration (Database/ORM Migration, Not API Redesign)
   5. Trạng thái Migration hiện tại (Data Migration, Phase 1, Phase 2, Phase 3 Step 4)
   6. Lộ trình Migration 11 Phase đã được phê duyệt

B. NGUYÊN TẮC BẤT KHẢ XÂM PHẠM (NON-NEGOTIABLE RULES)
   1. Tuyệt đối không tự ý thay đổi Kiến trúc phân tầng
   2. Đóng băng toàn diện API Contract (API Contract Freeze)
   3. Đóng băng Prisma Schema (prisma/schema.prisma)
   4. Bảo toàn Business Logic hiện hữu
   5. Nghiêm cấm xóa dữ liệu hoặc reset Database
   6. Đóng băng thư viện và dependencies
   7. Bảo vệ phạm vi công việc (Strict Phase Scope Protection)
   8. Tuân thủ quy trình cổng phê duyệt (Mandatory Approval Gate)

C. TIÊU CHUẨN KIẾN TRÚC & MÃ NGUỒN (ARCHITECTURE & CODING STANDARDS)
   1. Trách nhiệm phân tầng đơn hướng (Router -> Middleware -> Controller -> Service -> Repository -> Prisma Singleton -> PostgreSQL)
   2. Tiêu chuẩn Functional Repository (No Classes, No BaseRepository, Transaction support)
   3. Function-Based Service & Controller Standards
   4. Prisma Client Singleton (src/config/prisma.ts)
   5. Quản lý Giao dịch (Transaction Management với PrismaTransactionClient)
   6. Tiêu chuẩn TypeScript & An toàn Kiểu dữ liệu (No any, no unsafe as)
   7. Tiêu chuẩn Quản lý UUID (src/utils/uuid.ts)
   8. Xử lý Lỗi & Ánh xạ Mã lỗi Prisma (src/utils/prismaError.ts: P2002, P2003, P2025, v.v.)
   9. Serialization, Xử lý Prisma Decimal & Tương thích _id (withCompatId)

D. ĐÓNG BĂNG API CONTRACT & TƯƠNG THÍCH NGƯỢC (API CONTRACT & BACKWARD COMPATIBILITY)
   1. Nguyên tắc Đóng băng Tuyệt đối (Endpoint, Method, Body, Query, Status, Response Schema)
   2. Legacy Request DTO Mapping (Chuyển đổi trường legacy tại Service boundary)
   3. Postman Collection – Thước đo Regression Baseline duy nhất
   4. Xử lý khi phát hiện Bug hoặc Điểm bất hợp lý trong API cũ (Escalation Protocol)

E. TIÊU CHUẨN VALIDATION & MIDDLEWARE (VALIDATION & MIDDLEWARE STANDARDS)
   1. Phân định rõ ràng: Express Validator vs Zod vs Service vs Repository
   2. Khung phân loại Tích hợp Zod (5-Tier Framework)
   3. Nghiêm cấm Database Lookups trong Express Validator
   4. Quản lý Middleware Xác thực (Authentication & Authorization)
   5. Quy tắc Chuyển dịch Middleware theo từng Phase (UUID vs ObjectId)

F. TIÊU CHUẨN DATABASE & MIGRATION DỮ LIỆU (DATABASE & MIGRATION STANDARDS)
   1. Single Source of Truth cho Cấu trúc Vật lý
   2. Tiêu chuẩn Khóa Phức hợp (Compound Unique Keys)
   3. Bản đồ UUID v5 Chuẩn hóa (Deterministic UUID Mapping & Namespace)
   4. Bảo tồn các Ngoại lệ Lịch sử (Orphan Orders, Dangling Notifications, Historical Timestamps)
   5. Chiến lược Ngừng sử dụng Mongoose (Phase 11 Decommission Strategy)
   6. Phân hệ Ngoại vi & Non-HTTP Dependencies (Socket.IO, Cron Jobs, Background Tasks)

G. TIÊU CHUẨN KIỂM THỬ & CHẤT LƯỢNG (TESTING & QUALITY STANDARDS)
   1. Kim tự tháp Kiểm thử (Type Check, Unit/Model, Repository, Service, API Regression)
   2. Tiêu chuẩn Báo cáo Kết quả Kiểm thử (Automated vs Postman vs Manual)
   3. Phân biệt Lỗi Baseline (Baseline Errors) và Lỗi Hồi quy (Regression Errors)

H. QUY TRÌNH THỰC HIỆN PHASE & CỔNG PHÊ DUYỆT (MIGRATION WORKFLOW)
   • Chu trình chuẩn 7 bước: Step 1 (Audit) -> Step 2 (Report) -> Step 3 (Cổng phê duyệt 1) -> Step 4 (Implementation) -> Step 5 (Testing) -> Step 6 (Report) -> Step 7 (Cổng phê duyệt 2)
   • Nguyên tắc dừng và không tự động nhảy Phase

I. TIÊU CHUẨN TÀI LIỆU & BÁO CÁO (DOCUMENTATION & REPORTING)
   1. Hệ thống Thứ bậc Ưu tiên của Tài liệu (Documentation Precedence Hierarchy)
   2. Quy chuẩn Lưu trữ Hồ sơ Migration
   3. Quy tắc Biên soạn Báo cáo

PHỤ LỤC: DANH MỤC THAM CHIẾU BASELINE THEO MODULE
   • Phụ lục 1: Module User & Authentication (Phase 2 Baseline)
   • Phụ lục 2: Module Course, Chapter & Lesson (Phase 3 Baseline)
```

---

## D. CHI TIẾT CÁC THAY ĐỔI ĐÃ THỰC HIỆN (CHANGES MADE)

| Hành động | Vị trí cũ trong AGENTS.md | Vị trí mới trong AGENTS.md | Diễn giải & Lý do kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Xóa bỏ** | Section I, Section XXI | Đã loại bỏ | Xóa bỏ các prompt meta-instructions về cách tạo file AGENTS.md, chỉ giữ lại các quy tắc dự án. |
| **Thêm mới** | Chưa có | **Mục B (Non-Negotiable Rules)** | Tập hợp toàn bộ 8 nguyên tắc bất khả xâm phạm thành một bộ quy chuẩn tập trung ngay đầu tài liệu. |
| **Thêm mới** | Rải rác | **Mục D.2, D.3, D.4** | Bổ sung quy tắc ánh xạ Legacy Request DTO, quy tắc Postman Regression Baseline, quy trình báo cáo khi phát hiện bug cũ (Escalation Protocol). |
| **Thêm mới** | Chưa có | **Mục E.2** | Bổ sung Khung phân loại Zod 5 mức độ (`Runtime Validation`, `Type-only Usage`, `Imported but Unused`, `Defined but Not Integrated`, `Not Applicable`). |
| **Thêm mới** | Rải rác | **Mục C.8, C.9** | Bổ sung tiêu chuẩn ánh xạ mã lỗi Prisma (`src/utils/prismaError.ts`), xử lý Prisma Decimal sang number, và tương thích `_id` qua `withCompatId()`. |
| **Thêm mới** | Chưa có | **Mục G.3** | Bổ sung quy tắc phân biệt rõ ràng giữa Lỗi Baseline (cũ) và Lỗi Hồi quy (mới sinh ra). |
| **Di chuyển** | Section VI | **Phụ lục 1** | Chuyển chi tiết endpoints & validators của Module User xuống Phụ lục tham chiếu để tránh làm loãng nguyên tắc kiến trúc chung. |
| **Di chuyển** | Section VII | **Mục E.4** | Gộp nội dung Authentication & Authorization Middleware vào đúng mục Tiêu chuẩn Validation & Middleware. |
| **Di chuyển** | Section XX | **Mục I.1** | Đưa hệ thống thứ bậc ưu tiên tài liệu vào đúng mục Tiêu chuẩn Tài liệu & Báo cáo. |
| **Gộp nội dung** | Section III.2, IV.2, V.2, V.3, V.9 | **Mục E.1** | Thống nhất thành một Ma trận phân định trách nhiệm duy nhất giữa Express Validator, Zod, Service và Repository. |
| **Gộp nội dung** | Section III.5, XVII, XVIII | **Mục C.2** | Chuẩn hóa quy định về Functional Repository thành một mục duy nhất kèm code mẫu chuẩn. |
| **Gộp nội dung** | Section II.3, IX, XIV, XVI | **Mục F.5** | Chuẩn hóa Chiến lược Ngừng sử dụng Mongoose (Phase 11 Decommission Strategy). |

---

## E. XÁC NHẬN MỨC ĐỘ ĐẦY ĐỦ CỦA CÁC QUY TẮC (RULE COVERAGE)

Tất cả các chủ đề bắt buộc theo yêu cầu đã được đưa vào `AGENTS.md` một cách toàn diện và chính xác:

1. **API Contract Freeze**: Đã được định nghĩa chi tiết tại Mục B.2 và Mục D.1–D.4. Khẳng định tuyệt đối việc giữ nguyên URL, method, payload, status code và JSON structure.
2. **Postman Regression Baseline**: Đã quy định rõ tại Mục D.3, xác định Postman là căn cứ duy nhất để đo lường tương thích ngược, chỉ cho phép sửa UUID mẫu và biến môi trường.
3. **Zod Application Model Integration**: Đã thiết lập khung phân loại 5 mức độ tại Mục E.2; phân định rõ ranh giới sử dụng tại Service boundaries (Mục E.1, Mục C.1); cấm dùng Zod làm Prisma Select; cấm lặp lại `.parse()` vô căn cứ.
4. **Express Validator Standards**: Đã quy định rõ tại Mục E.1, duy trì vai trò kiểm tra cú pháp request HTTP, format, độ dài, regex, enum và UUID syntax.
5. **Middleware Architecture**: Phân định rõ Middleware không gọi Prisma, không truy vấn DB trong custom validator (Mục E.3), chuyển ownership check sang Service (Mục E.4).
6. **Functional Repository & Service**: Đã chuẩn hóa quy chuẩn Functional Repository (không Class, có transaction client, export async functions) tại Mục C.1–C.2 và Function-based Service tại Mục C.1.
7. **Prisma Standards**: Nêu rõ Prisma Client Singleton tại `src/config/prisma.ts` (Mục C.4), xử lý compound unique keys (Mục F.2), mapping mã lỗi Prisma tại `src/utils/prismaError.ts` (Mục C.8).
8. **MongoDB Legacy Compatibility**: Giữ nguyên kết nối và models Mongoose cho các module chưa migrate; bảo lưu Mongoose Decommission đến Phase 11 (Mục A.3, Mục F.5).
9. **TypeScript Type Safety**: Cấm triệt để `any` và `unsafe as` (Mục C.6).
10. **Testing Standards**: Thiết lập kim tự tháp kiểm thử, phân định kết quả Automated/Postman/Manual, và tiêu chí phân biệt Baseline vs Regression (Mục G.1–G.3).
11. **Phase Approval Gate**: Quy chuẩn chu trình 7 bước bắt buộc dừng ở Step 3 và Step 7, nghiêm cấm tự ý nhảy Phase (Mục H).

---

## F. CÁC ĐIỂM CHƯA THỂ TỰ QUYẾT ĐỊNH (UNRESOLVED ISSUES)

Trong quá trình audit và rà soát các tài liệu liên quan, ghi nhận các điểm sau cần chủ dự án lưu ý và phê duyệt bằng quyết định riêng khi bước vào các Phase tương ứng:

1. **Xung đột tiềm ẩn về logic Coupon Usage (Phase 6)**:
   * Các báo cáo audit trước đó ghi nhận trong mã nguồn MongoDB cũ, `coupon.usedCount` có nguy cơ bị tăng (increment) 2 lần: một lần khi tạo đơn hàng (`createOrder`) và một lần nữa khi trạng thái đơn hàng chuyển sang `COMPLETED` (`checkoutOrder`).
   * *Đề xuất*: Giữ nguyên trạng thái để chủ dự án xem xét và phê duyệt phương án chuẩn hóa trong Phase 6 Pre-Implementation Audit Report.
2. **Dữ liệu phân trang cũ (Pagination response format)**:
   * Một số endpoint cũ trả về phân trang dạng `{ total, page, limit, courses }` trong khi một số endpoint khác trả về `{ count, data }`.
   * *Nguyên tắc áp dụng*: Tiếp tục duy trì đúng API contract riêng của từng endpoint theo Golden Baseline của Postman, không tự ý gộp format nếu chưa có văn bản phê duyệt.

---

## G. XÁC MINH PHẠM VI THỰC HIỆN (SCOPE VERIFICATION)

* [x] **File `AGENTS.md`**: Đã được tái cấu trúc, cập nhật và chuẩn hóa toàn bộ nội dung.
* [x] **File Báo cáo**: Đã tạo file `docs/migration/agents-rules-audit-report.md`.
* [x] **Mã nguồn (`src/`)**: 100% không bị chỉnh sửa.
* [x] **Prisma Schema (`prisma/schema.prisma`)**: 100% không bị chỉnh sửa.
* [x] **Cơ sở dữ liệu (PostgreSQL, MongoDB)**: 100% không có bất kỳ lệnh ghi/xóa/reset nào được thực thi.
* [x] **Postman Collection**: 100% không bị thay đổi.
* [x] **Dependencies (`package.json`, `package-lock.json`)**: 100% không cài đặt thêm hoặc thay đổi package nào.

---

---

## H. KẾT QUẢ VÒNG SOÁT XÉT VÀ TINH CHỈNH CUỐI CÙNG (FINAL REVIEW & REFINEMENT)

Sau khi hoàn thành tái cấu trúc ban đầu, một vòng kiểm tra và tinh chỉnh cuối cùng (Final Review) đã được thực hiện để hoàn thiện tuyệt đối các chi tiết kỹ thuật chuyên sâu theo yêu cầu của chủ dự án:

1. **Hiệu chỉnh Thứ bậc Ưu tiên Tài liệu (Section I.1)**:
   * Điều chỉnh để **Chỉ thị trực tiếp mới nhất của Chủ dự án** (Ưu tiên 1) và **Quyết định kiến trúc đã phê duyệt (ADRs)** (Ưu tiên 2) xếp trên **Quy tắc chung trong AGENTS.md** (Ưu tiên 3). Điều này loại bỏ hoàn toàn rủi ro quy tắc tổng quát vô tình ghi đè các quyết định kiến trúc cụ thể đã chốt.
   * Xác lập **Postman Collection** (Ưu tiên 4) là Golden Baseline cho API Contract, trên **Prisma Schema** (Ưu tiên 5 - nguồn chân lý cho physical DB).
   * Bổ sung quy định rõ ràng: *Tuyệt đối không được dùng Prisma Schema để ghi đè API Contract hoặc các quyết định kiến trúc đã phê duyệt*.
2. **Nâng cao Type Safety cho Functional Repository (Section C.2)**:
   * Thay thế `Partial<Course>` bằng kiểu dữ liệu suy luận chính xác từ Prisma Select: `Prisma.CourseGetPayload<{ select: typeof COURSE_PUBLIC_SELECT }>`.
   * Cập nhật ví dụ code chuẩn với cú pháp `satisfies Prisma.CourseSelect` và import `Prisma` từ `@prisma/client`, tương thích 100% với Prisma ORM 6.4.1.
3. **Chuẩn hóa Chính sách `any` trong TypeScript (Section C.5)**:
   * Phân định minh bạch: Tuyệt đối không tạo `any` mới; tuyệt đối không dùng `as any` hoặc `as unknown as Type` để che giấu lỗi.
   * Đối với Legacy `any` ngoài phạm vi Phase hiện tại: Bảo toàn nguyên trạng để giữ ổn định hệ thống chuyển tiếp, ghi nhận là Known Baseline Issues, cấm tự ý refactor diện rộng.
   * Module thuộc Phase hiện tại: Bắt buộc ưu tiên `unknown`, type guard, Zod `z.infer`, và Prisma generated types (`Prisma.*GetPayload`).
4. **Làm rõ Ranh giới Validation Zod Runtime (Section E.2)**:
   * Khẳng định cả `Runtime Validation` và `Type-only Usage` đều hợp lệ tùy theo bối cảnh.
   * Không bắt buộc `.parse()` ở mọi tầng một cách cơ học; cấm validate lặp lại cùng một dữ liệu khi tầng trước đã đảm bảo tính toàn vẹn.
   * Xác định rõ trách nhiệm validation ở từng ranh giới (Express Validator ở HTTP boundary, Zod `safeParse` ở Service boundary, Repository projection select).
   * Yêu cầu schema định nghĩa phải có mục đích sử dụng rõ ràng hoặc ghi nhận `Defined but Not Integrated` kèm lý do.
5. **Hiệu chỉnh Trạng thái Migration Phase 3 (Section A.5 & A.6)**:
   * Đối chiếu thực tế workspace: Phase 3 đã hoàn thành Steps 1–4, nhưng Step 5 (API Test & Regression Audit), Step 6 (Final Implementation Report) và Step 7 (Approval Gate) **chưa thực hiện / chưa nghiệm thu**.
   * Cập nhật chính xác trạng thái thành: `IN PROGRESS - Steps 1-4 Done; Steps 5-7 Pending/Not Verified`.
   * Bổ sung quy tắc: Tuyệt đối không tự ý đánh dấu Phase 3 là COMPLETED khi chưa vượt qua Step 5 và chưa được nghiệm thu tại Step 7.

---

## I. KẾT LUẬN

Tài liệu `AGENTS.md` hiện tại đã đạt độ hoàn thiện cao nhất, mạch lạc, không còn trùng lặp, loại bỏ hoàn toàn các prompt artifact dư thừa, thiết lập đầy đủ khung phân loại Zod, đóng băng API contract, chuẩn hóa middleware, an toàn kiểu dữ liệu Functional Repository và quy trình phê duyệt nghiêm ngặt.

Hệ thống đã sẵn sàng làm cơ sở pháp quy kỹ thuật vững chắc cho các bước triển khai tiếp theo của dự án TMDEMY.
