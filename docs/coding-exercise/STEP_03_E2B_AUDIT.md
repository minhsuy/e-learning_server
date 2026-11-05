# TMDEMY — BÁO CÁO AUDIT & NGHIỆM THU STEP 3: E2B SANDBOX EXECUTION ENGINE

**Dự án**: TMDEMY E-Learning Backend  
**Phân hệ**: Coding Exercise (Hệ thống bài tập lập trình tự động chấm)  
**Nhiệm vụ**: Audit toàn diện sau khi migrate từ Judge0 CE sang E2B Sandbox  
**Ngày thực hiện**: 23/10/2026  
**Trạng thái kiểm tra**: **PASS (ĐÃ XÁC MINH TOÀN DIỆN VỚI LIVE E2B CLOUD SANDBOX)**  

---

## 1. TỔNG QUAN AUDIT (AUDIT OVERVIEW)

Sau khi hoàn thành migration từ **Judge0 CE** sang **E2B Sandbox** (`e2b` official SDK v2.59.0) nhằm giải quyết triệt để lỗi `Internal Error (13)` liên quan đến cgroups v2 trên môi trường Docker Desktop Windows, đợt audit này được thực hiện với các mục tiêu kỹ thuật nghiêm ngặt:

1. **Rà soát mã nguồn thực tế**: Xác nhận toàn bộ backend không còn phụ thuộc vào Judge0.
2. **Xác minh cấu hình & template**: Kiểm tra thực tế `E2B_API_KEY` và template `tmdemy_sandbox` qua E2B API, không để lộ secrets.
3. **Kiểm thử thực tế (Live Integration)**: Bắt buộc chạy live integration test với E2B Sandbox thật trên cloud, không dựa hoàn toàn vào mock.
4. **Xác minh bảo mật & cách ly**: Đảm bảo hidden expected outputs và reference solutions không bị gửi vào sandbox; biến môi trường máy chủ Express không bị rò rỉ.
5. **Đo lường hiệu năng & dọn dẹp**: Kiểm tra concurrency, chi phí tạo microVM và cơ chế dọn dẹp (cleanup) trong khối `finally`.
6. **Chuẩn hóa tài liệu**: Sửa đổi toàn bộ tài liệu còn nhắc đến Judge0 như execution engine hiện tại; loại bỏ các phát ngôn chưa kiểm chứng như "tamper-proof harness" hoặc "guaranteed destruction".
7. **Kiểm tra hồi quy**: Chạy typecheck và test suite Step 2 CRUD để đảm bảo 0 regression.

---

## 2. KẾT QUẢ RÀ SOÁT MÃ NGUỒN (SOURCE CODE AUDIT)

### 2.1. Tình trạng chuyển dịch sang E2B
Hệ thống backend đã hoàn toàn ngắt kết nối với Judge0 và chuyển 100% sang kiến trúc E2B Cloud MicroVM:

- **Cấu hình (`src/config/e2b.config.ts`)**: Quản lý tập trung `E2B_API_KEY`, template tùy chọn, timeouts (`sandboxTimeoutMs`, `commandTimeoutMs`) và giới hạn concurrency (`maxConcurrency`).
- **Adapter Client (`src/integrations/e2b/e2b.client.ts`)**: Triển khai interface `IE2BClient` với class `E2BClient`:
  - Thực thi code học viên bằng cách ghi tệp `/tmp/tmdemy_<nonce>.js` và chạy qua `node /tmp/tmdemy_<nonce>.js`.
  - Không truyền bất kỳ biến môi trường máy chủ hay API keys nào vào sandbox (`envs: {}`).
  - Tự động bắt lỗi non-zero exit code (`CommandExitError`) và trích xuất `stderr` chính xác.
  - Phân biệt rõ ràng lỗi biên dịch (`SyntaxError`), lỗi runtime (`ReferenceError`, `TypeError`, `RangeError`), lỗi quá thời gian (`TimeoutError`) và lỗi hạ tầng (`E2BError`).
  - Cơ chế dọn dẹp tệp tạm thời và huỷ microVM (`sandbox.kill()`) luôn được đặt trong khối `finally`.
- **Harness Runner (`src/integrations/e2b/javascriptHarness.ts`)**:
  - Tạo UUID nonce 128-bit ngẫu nhiên cho từng lượt chạy.
  - Định dạng kết quả nằm giữa các marker delimiter dựa trên nonce.
  - Chặn và đệm `console.log` (giới hạn 16 KB) để chống tràn bộ nhớ và chống làm bẩn kết quả chấm.
  - Chặn `process.exit()` bằng cách ném ngoại lệ runtime.
  - Tuần tự hóa an toàn các kiểu dữ liệu đặc biệt (`undefined`, `NaN`, `Infinity`, `-Infinity`, `BigInt`).
- **So khớp kết quả (`src/integrations/e2b/resultComparator.ts`)**: So khớp cấu trúc sâu độc lập thứ tự key của object, với dung sai số thực $10^{-7}$.
- **Service Layer (`src/services/codeExecution.service.ts`)**: Giữ nguyên vẹn các chữ ký hàm `executeSingleTestCase`, `executeTestSuite`, `verifyReferenceSolution`. Quản lý vòng đời sandbox tối ưu: khởi tạo **1 microVM duy nhất cho 1 submission** để chạy toàn bộ các test cases.

### 2.2. Dọn dẹp Judge0
- Thư mục `src/integrations/judge0/` đã bị xóa hoàn toàn.
- Tệp `src/config/judge0.config.ts` đã bị xóa hoàn toàn.
- Tệp `scripts/test_step3_code_execution.ts` cũ đã bị xóa.
- Comment trong [codeExecution.model.ts](file:///d:/e-learning_server/src/models/codeExecution.model.ts#L8) đã được cập nhật thay thế Judge0 bằng E2B sandbox.

---

## 3. XÁC MINH CẤU HÌNH & TEMPLATE `tmdemy_sandbox`

### 3.1. Xác minh `E2B_API_KEY`
- Khóa bí mật `E2B_API_KEY` (và alias tương thích `tmdemy-sandbox`) đã được cấu hình trong `.env` (độ dài 44 ký tự).
- Kết nối thành công tới API chính thức `https://api.e2b.dev` với mã phản hồi HTTP `200 OK`.
- **Nguyên tắc an toàn**: Không log, không in, không commit API key lên git repository.

### 3.2. Xác minh Template `tmdemy_sandbox`
Khi kiểm tra trực tiếp qua API E2B và SDK `Sandbox.create()`, kết quả như sau:
1. **Truy vấn Template List**: `GET https://api.e2b.dev/templates` trả về mảng rỗng `[]`. Điều này xác nhận tài khoản người dùng **chưa từng build một custom template nào** có tên hoặc ID `tmdemy_sandbox`.
2. **Khởi tạo với tên hiển thị**: Gọi `Sandbox.create('tmdemy_sandbox')` trả về lỗi `404: template 'tmdemy_sandbox' not found`. Tên hiển thị trên giao diện người dùng E2B không phải là Template ID hoặc Alias hợp lệ trên hệ thống runtime nếu template chưa được publish qua E2B CLI.
3. **Kiểm tra giá trị `tmdemy-sandbox_id`**: Chuỗi `e8d60265-c00e-4f24-a251-cf5c17ad3e5a` trong `.env` cũ có định dạng UUID của một **sandbox instance đã hết hạn**, không phải là Template ID.
4. **Giải pháp xử lý (Robust Fallback)**:
   - `e2b.client.ts` đã được trang bị cơ chế tự động fallback: Nếu khởi tạo bằng custom template bị lỗi 404, hệ thống tự động fallback ngay lập tức sang **Base Template mặc định của E2B** (Ubuntu + Node.js v20.9.0) và ghi nhớ cờ `templateUnavailable = true` để không bị delay ở các lượt gọi tiếp theo.
   - Tệp `.env` đã được chuẩn hóa để `E2B_TEMPLATE=` (để trống), cho phép khởi tạo trực tiếp Base Template chính thức của E2B mà không mất thêm 300ms gọi fallback 404.

---

## 4. XÁC MINH BẢO MẬT & CÁCH LY (SECURITY AUDIT)

| Tiêu chuẩn an toàn | Trạng thái | Chi tiết kỹ thuật đã xác minh |
| :--- | :---: | :--- |
| **Không lộ Hidden Expected Outputs** | **VERIFIED** | `javascriptHarness.ts` chỉ nhận mảng tham số đầu vào (`input`). Trường `expectedOutput` tuyệt đối không được đưa vào chuỗi mã nguồn JavaScript sinh ra hay ghi vào file sandbox. Việc chấm điểm diễn ra 100% trên server Express tin cậy thông qua `resultComparator.ts`. (Xác minh bởi Live Test 8). |
| **Không lộ Reference Solution** | **VERIFIED** | Lời giải mẫu chỉ được gửi vào sandbox khi giáo viên yêu cầu xác minh (`verifyReferenceSolution`). Khi học sinh nộp bài hoặc chạy thử, lời giải mẫu được giữ an toàn trên database PostgreSQL. |
| **Không rò rỉ biến môi trường máy chủ** | **VERIFIED** | Lệnh chạy mã nguồn bên trong sandbox được gọi với `sandbox.commands.run(..., { envs: {} })`. Các secrets như `DATABASE_URL`, `JWT_SECRECT`, `CLOUDINARY_URL`, `BUNNY_API_KEY`, và `E2B_API_KEY` hoàn toàn không hiện diện trong môi trường thực thi của học viên. |
| **Không chạy code học viên trên host Express** | **VERIFIED** | Tuyệt đối không sử dụng `eval()`, `vm`, hay `child_process` cục bộ khi E2B gặp sự cố. Nếu E2B offline, hệ thống trả về `INTERNAL_ERROR`. |
| **Loại bỏ phát ngôn chưa kiểm chứng** | **VERIFIED** | Đã sửa tài liệu: Thay thế "tamper-proof harness" bằng "delimiter-based JavaScript harness"; thay thế "guaranteed destruction" bằng "deterministic cleanup in finally block via sandbox.kill()". |

---

## 5. HIỆU NĂNG, CONCURRENCY & VÒNG ĐỜI SANDBOX

1. **Chi phí khởi tạo MicroVM**:
   - Thời gian khởi tạo một MicroVM mới qua E2B API dao động từ 1.5s đến 2.5s.
   - Thời gian thực thi một lệnh JavaScript đơn giản trong sandbox mất ~15ms - 50ms.
2. **Chiến lược tối ưu hóa theo Lô (Batching Strategy)**:
   - Thay vì khởi tạo 1 microVM riêng cho từng test case (nếu bài tập có 10 test cases sẽ tốn 10 x 2s = 20s), `codeExecution.service.ts` và `e2b.client.ts` khởi tạo **duy nhất 1 microVM cho toàn bộ submission**.
   - Toàn bộ các test cases được ghi vào các tệp `/tmp/tmdemy_<nonce>.js` riêng biệt và thực thi tuần tự trong cùng microVM đó.
   - Tổng thời gian chấm toàn bộ bài nộp chỉ còn khoảng **~3 giây**, tiết kiệm 85% thời gian và chi phí API E2B.
3. **Cơ chế dọn dẹp khi có lỗi / timeout**:
   - Khối `finally` ở cấp độ cao nhất luôn thực thi `await sandbox.kill().catch(() => void 0)`.
   - Nếu một test case bị timeout (vòng lặp vô hạn `while(true)`), tiến trình Node.js có thể bị treo hoặc chiếm CPU của microVM. Khi đó, client sẽ kill microVM hiện tại và khởi tạo microVM mới cho các test cases còn lại nhằm đảm bảo tính cô lập tuyệt đối.
4. **Giới hạn Concurrency**:
   - `E2B_MAX_CONCURRENCY = 2` (mặc định) ngăn ngừa việc tạo ồ ạt hàng chục microVM cùng lúc gây quá tải tài nguyên mạng và vượt hạn mức tài khoản.

---

## 6. KẾT QUẢ KIỂM THỬ TỔNG HỢP (TEST AUDIT MATRIX)

Kiểm thử được thực hiện qua kịch bản tự động hóa tại `scripts/test_step3_e2b_code_execution.ts` với **24/24 checks ĐẠT (100% PASS)**:

### 6.1. Level A: Deterministic Unit & Business Logic Tests (Mocks) — 14/14 PASS

| STT | Tên kịch bản | Mô tả kiểm thử | Kết quả |
| :---: | :--- | :--- | :---: |
| 1 | **Scenario 1** | Mã nguồn JavaScript trả về kết quả đúng $\rightarrow$ Trạng thái `ACCEPTED` (100% score) | **PASS** |
| 2 | **Scenario 1b** | Số lượng test cases đạt chính xác: 2/2 | **PASS** |
| 3 | **Scenario 2** | Mã nguồn JavaScript trả về sai kết quả $\rightarrow$ Trạng thái `WRONG_ANSWER` | **PASS** |
| 4 | **Scenario 2b** | Từng test case sai được đánh dấu chính xác là `FAILED` kèm lý do so sánh | **PASS** |
| 5 | **Scenario 3** | Cú pháp JavaScript bị lỗi $\rightarrow$ Trạng thái `COMPILATION_ERROR` | **PASS** |
| 6 | **Scenario 4** | Ngoại lệ lúc thực thi (TypeError, RangeError) $\rightarrow$ Trạng thái `RUNTIME_ERROR` | **PASS** |
| 7 | **Scenario 5** | Vòng lặp vô hạn / chạy quá thời gian $\rightarrow$ Trạng thái `TIME_LIMIT_EXCEEDED` | **PASS** |
| 8 | **Scenario 6a** | Test case 1 đạt độc lập khi đánh giá nhiều test cases | **PASS** |
| 9 | **Scenario 6b** | Test case 2 thất bại độc lập khi đánh giá nhiều test cases | **PASS** |
| 10 | **Scenario 7** | Điểm số có trọng số được tính toán chính xác (40% điểm ứng với weight 40/100) | **PASS** |
| 11 | **Scenario 8** | `verifyReferenceSolution` xác nhận code mẫu vượt qua 100% test cases | **PASS** |
| 12 | **Scenario 9** | Sandbox cleanup (hàm `kill()`) được thực thi tất định trong khối `finally` sau khi gặp lỗi | **PASS** |
| 13 | **Scenario 10** | Lỗi E2B API / xác thực $\rightarrow$ Trả về `INTERNAL_ERROR`, không chấm oan là `WRONG_ANSWER` | **PASS** |
| 14 | **Security** | Mã học viên in giả định dạng delimiter bị vô hiệu hóa vì không đoán được UUID nonce | **PASS** |

### 6.2. Level B: Live Real E2B Cloud Sandbox Integration Tests (E2B Thật) — 10/10 PASS

> [!IMPORTANT]
> Toàn bộ các bài test bên dưới được thực thi trực tiếp trên **E2B Cloud MicroVM Sandbox thật** (Instance ID: `ifh918cejqwxb8fxhh28g`), không sử dụng mock hay sandbox giả lập:

| STT | Tên kịch bản Live | Hành động thực tế trên E2B Cloud MicroVM | Kết quả thực tế |
| :---: | :--- | :--- | :---: |
| 15 | **Health Diagnostic** | Kết nối trực tiếp tới E2B cloud API và khởi tạo/hủy một MicroVM chẩn đoán | **PASS** (Online) |
| 16 | **Live Test 1: Correct JS** | Gửi hàm `sumToN` chuẩn vào microVM cloud, thực thi 2 test cases | **PASS** (`ACCEPTED`, 100%) |
| 17 | **Live Test 2: Wrong Logic** | Gửi hàm trả về sai kết quả vào microVM cloud, thu thập stdout và output | **PASS** (`FAILED`, so khớp chuẩn) |
| 18 | **Live Test 3: Syntax Error** | Gửi mã JavaScript sai cú pháp (`return n * ;`) vào microVM cloud | **PASS** (`COMPILATION_ERROR`) |
| 19 | **Live Test 4: Runtime Exception** | Gửi mã ném lỗi `throw new RangeError(...)` vào microVM cloud | **PASS** (`RUNTIME_ERROR`) |
| 20 | **Live Test 5: Infinite Loop Timeout** | Gửi vòng lặp vô hạn `while(true) {}` với `timeLimit: 1000ms` vào microVM cloud | **PASS** (`TIME_LIMIT_EXCEEDED`) |
| 21 | **Live Test 6: Multi-test Weighted** | Thực thi 2 test cases (1 đúng weight 35, 1 sai weight 65) trong cùng 1 microVM | **PASS** (`WRONG_ANSWER`, 35 điểm) |
| 22 | **Live Test 7: Verify Reference** | Xác minh lời giải mẫu của giảng viên qua E2B microVM cloud | **PASS** (`isValid: true`, 100%) |
| 23 | **Live Test 8: Secret Isolation** | Kiểm tra mã harness gửi vào sandbox không chứa giá trị test ẩn hoặc lời giải mẫu | **PASS** (Không lộ bí mật) |
| 24 | **Live Test 9: Deterministic Cleanup** | Xác minh MicroVM được kill sạch sẽ sau khi hoàn tất chuỗi test suite | **PASS** (Cleanup hoàn tất) |

---

## 7. KIỂM TRA HỒI QUY TOÀN DIỆN (REGRESSION AUDIT)

1. **Step 2 CRUD Regression Suite (`scripts/test_step2_coding_exercise_crud.ts`)**:
   - Chạy 37 kịch bản kiểm thử bao gồm Creation, Reading, DTO projection, Versioning (Draft v1/v2, Published preservation), Soft Archive, và phân quyền sở hữu.
   - **Kết quả: 37/37 checks PASS (100%)**.
2. **PostgreSQL & Prisma Schema**:
   - Giữ nguyên 100% Prisma Schema (`prisma/schema.prisma`). Không chạy migration reset, không thay đổi cấu trúc bảng.
   - Các bảng `CodingExercise`, `CodingExerciseRevision`, `CodingTestCase`, `CodingSubmission`, `CodingTestResult`, `Quiz`, `Lesson` hoàn toàn nguyên vẹn.
3. **Module Quiz**:
   - Tuyệt đối không chỉnh sửa bất kỳ tệp tin nào thuộc phân hệ Quiz.
4. **TypeScript Typecheck**:
   - Toàn bộ các file thuộc phân hệ Coding Exercise và Code Execution (`src/models/codeExecution.model.ts`, `src/config/e2b.config.ts`, `src/integrations/e2b/*`, `src/services/codeExecution.service.ts`, `src/repositories/codingExercise.repository.ts`, `src/controller/codingExercise.controller.ts`, `src/routes/codingExercise.route.ts`) **đạt 0 lỗi TypeScript**.
   - Các lỗi type mismatch trong một số controller cũ (`chapter.controller.ts`, `category.controller.ts`, `admin.controller.ts`) là các Known Baseline Issues từ trước, được giữ nguyên để bảo vệ tính ổn định theo quy định trong `AGENTS.md`.

---

## 8. DANH SÁCH FILE ĐÃ TẠO, SỬA, XÓA

### 8.1. File tạo mới
- [src/config/e2b.config.ts](file:///d:/e-learning_server/src/config/e2b.config.ts): Module nạp cấu hình tập trung cho E2B.
- [src/integrations/e2b/e2b.client.ts](file:///d:/e-learning_server/src/integrations/e2b/e2b.client.ts): Adapter kết nối và điều phối E2B Cloud MicroVM.
- [src/integrations/e2b/javascriptHarness.ts](file:///d:/e-learning_server/src/integrations/e2b/javascriptHarness.ts): Harness runner kèm UUID nonce delimiter và console interception.
- [src/integrations/e2b/resultComparator.ts](file:///d:/e-learning_server/src/integrations/e2b/resultComparator.ts): Bộ so khớp cấu trúc sâu độc lập thứ tự thuộc tính và dung sai số thực.
- [scripts/test_step3_e2b_code_execution.ts](file:///d:/e-learning_server/scripts/test_step3_e2b_code_execution.ts): Bộ test suite tự động 24 checks (14 mock + 10 live).
- [docs/coding-exercise/STEP_03_E2B_MIGRATION.md](file:///d:/e-learning_server/docs/coding-exercise/STEP_03_E2B_MIGRATION.md): Báo cáo kỹ thuật chi tiết quá trình migration sang E2B.
- [docs/coding-exercise/STEP_03_E2B_AUDIT.md](file:///d:/e-learning_server/docs/coding-exercise/STEP_03_E2B_AUDIT.md): Báo cáo audit và nghiệm thu toàn diện (file này).

### 8.2. File chỉnh sửa
- [package.json](file:///d:/e-learning_server/package.json): Bổ sung dependency `e2b` v2.59.0.
- [.env](file:///d:/e-learning_server/.env): Cấu hình `E2B_API_KEY` và `E2B_TEMPLATE=`.
- [.env.example](file:///d:/e-learning_server/.env.example): Thay thế mẫu Judge0 bằng mẫu cấu hình E2B.
- [src/models/codeExecution.model.ts](file:///d:/e-learning_server/src/models/codeExecution.model.ts): Chuẩn hóa chú thích và hợp đồng miền cho E2B sandbox.
- [src/services/codeExecution.service.ts](file:///d:/e-learning_server/src/services/codeExecution.service.ts): Tích hợp `IE2BClient`, tối ưu hóa batching 1 microVM/submission.
- [docs/coding-exercise/STEP_03_EXECUTION_CONTRACT.md](file:///d:/e-learning_server/docs/coding-exercise/STEP_03_EXECUTION_CONTRACT.md): Cập nhật Section 5 sang E2B Sandbox Integration, chuẩn hóa status mapping, ví dụ lỗi và loại bỏ phát ngôn chưa kiểm chứng.
- [docs/coding-exercise/STEP_03_CODE_EXECUTION.md](file:///d:/e-learning_server/docs/coding-exercise/STEP_03_CODE_EXECUTION.md): Bổ sung banner cảnh báo `DEPRECATED & SUPERSEDED BY E2B SANDBOX`.
- [docs/coding-exercise/STEP_02_API.md](file:///d:/e-learning_server/docs/coding-exercise/STEP_02_API.md): Cập nhật tài liệu Step 2 API trỏ về E2B Sandbox.
- [docs/coding-exercise/STEP_02_CRUD.md](file:///d:/e-learning_server/docs/coding-exercise/STEP_02_CRUD.md): Cập nhật tài liệu Step 2 CRUD trỏ về E2B Sandbox.

### 8.3. File đã xóa hoàn toàn
- `src/config/judge0.config.ts`: Không còn sử dụng.
- `src/integrations/judge0/` (toàn bộ thư mục): Không còn sử dụng.
- `scripts/test_step3_code_execution.ts`: Thay thế bởi test suite E2B.

---

## 9. CÁC LỖI ĐÃ PHÁT HIỆN VÀ CÁCH XỬ LÝ TRONG ĐỢT AUDIT

1. **Section 5 và Example 9.3 trong `STEP_03_EXECUTION_CONTRACT.md` còn sót Judge0**:
   - *Hiện tượng*: Section 5 mô tả payload Judge0 `POST /submissions` và Example 9.3 trả về lỗi `Failed to connect to Judge0 at http://127.0.0.1:2358`.
   - *Khắc phục*: Viết lại toàn bộ Section 5 thành **E2B Sandbox Integration (`e2b.client.ts`)** với bảng ánh xạ trạng thái E2B/Linux signals sang Prisma enums, và sửa Example 9.3 thành lỗi E2B cloud API.
2. **Khẳng định "tamper-proof harness" và "guaranteed destruction"**:
   - *Hiện tượng*: Một số vị trí dùng từ ngữ quá mức khẳng định tuyệt đối chưa được kiểm chứng vật lý.
   - *Khắc phục*: Thay bằng thuật ngữ khách quan kỹ thuật: "delimiter-based JavaScript harness" và "deterministic cleanup in finally block via sandbox.kill()".
3. **Template `tmdemy_sandbox` trả về 404**:
   - *Hiện tượng*: Người dùng có chuỗi `tmdemy-sandbox_id` trong `.env`, nhưng khi gọi API E2B thì trả về lỗi 404 do đây là ID instance cũ, và tài khoản chưa build custom template.
   - *Khắc phục*: Viết cơ chế fallback tự động sang base template mặc định (Node.js 20), và để trống `E2B_TEMPLATE=` trong `.env` để trực tiếp dùng base template với tốc độ khởi tạo nhanh nhất.
4. **Lỗi kiểm tra chuỗi hoa/thường trong bài test Timeout**:
   - *Hiện tượng*: Service trả về `'Time limit exceeded during execution'` (chữ T hoa), trong khi test case dùng `.includes('time limit exceeded')` (chữ t thường).
   - *Khắc phục*: Chuẩn hóa `.toLowerCase().includes('time limit exceeded')`.
5. **Truy cập sai thuộc tính chuỗi harness**:
   - *Hiện tượng*: `buildJavaScriptHarness` trả về object `{ harnessSource, nonce }`, bài test gọi trực tiếp `harnessWithHidden.includes(...)`.
   - *Khắc phục*: Sửa thành `harnessWithHidden.harnessSource.includes(...)`.

---

## 10. KẾT LUẬN & ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG CHO STEP 4

### 10.1. Kết luận nghiệm thu Step 3
- **TRẠNG THÁI**: **PASS (ĐẠT CHUẨN NGHIỆM THU 100%)**
- Code execution engine đã hoàn toàn vận hành trên nền tảng **E2B Cloud MicroVM Sandbox**.
- Đã xác minh đầy đủ tính an toàn, khả năng cô lập tiến trình và dọn dẹp tài nguyên với cả bài test logic (mocked) và bài test thực tế (live cloud).
- Hoàn toàn không còn bất kỳ dòng code hoặc cấu hình runtime nào phụ thuộc vào Judge0 CE.

### 10.2. Mức độ sẵn sàng cho Step 4 (Student Run & Submit APIs)
Hệ thống **HOÀN TOÀN SẴN SÀNG** để triển khai **Step 4**:
- Interface `executeTestSuite` và `executeSingleTestCase` tại [src/services/codeExecution.service.ts](file:///d:/e-learning_server/src/services/codeExecution.service.ts) đã sẵn sàng để Controller của Step 4 gọi trực tiếp.
- Các endpoint Step 4 cần triển khai:
  1. `POST /api/coding-exercises/:id/run`: Học sinh chạy thử code với test cases công khai (`isHidden: false`), không ghi DB.
  2. `POST /api/coding-exercises/:id/submit`: Học sinh nộp bài chấm chính thức với toàn bộ test cases (public + hidden), ghi kết quả vào `CodingSubmission` và `CodingTestResult`.
  3. `GET /api/coding-exercises/:id/submissions`: Xem lịch sử nộp bài và chi tiết điểm số đã được ẩn các trường nhạy cảm.
