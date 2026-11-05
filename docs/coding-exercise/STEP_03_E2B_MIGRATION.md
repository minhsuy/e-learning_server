# BÁO CÁO KỸ THUẬT: MIGRATION EXECUTION ENGINE TỪ JUDGE0 CE SANG E2B SANDBOX

**Dự án**: TMDEMY E-Learning Backend  
**Phân hệ**: Coding Exercise (Bài tập lập trình tự động chấm)  
**Tài liệu**: `docs/coding-exercise/STEP_03_E2B_MIGRATION.md`  
**Ngày thực hiện**: 23/10/2026  
**Trạng thái**: **COMPLETED — TOÀN BỘ MOCKED TESTS VÀ LIVE E2B TESTS ĐỀU ĐẠT 100% (19/19 PASS)**  

---

## 1. TỔNG QUAN MIGRATION (OVERVIEW)

### 1.1. Bối cảnh & Lý do thay đổi
Trong Step 3 ban đầu, hệ thống thiết kế tích hợp với **Judge0 Community Edition (CE) v1.13.1**. Tuy nhiên, khi vận hành thực tế trên môi trường máy trạm Windows qua Docker Desktop (sử dụng WSL2 với cgroups v2), Judge0 CE gặp xung đột hệ thống tệp và cgroups controller, dẫn đến lỗi `Internal Error (13)` khi khởi tạo sandbox isolate.

Để đảm bảo:
- Khả năng thực thi mã nguồn độc lập, cách ly hoàn toàn và ổn định.
- Không phụ thuộc vào cụm Docker cồng kềnh (Redis + PostgreSQL + Judge0 Server + Workers).
- MicroVM cloud sandbox khởi động cực nhanh (~1.5s - 2s), tự động hủy sau khi chấm.

Chủ dự án đã quyết định di chuyển toàn bộ Execution Engine từ **Judge0 CE** sang **E2B Sandbox** (`e2b` official TypeScript SDK v2.x).

### 1.2. Mục tiêu đạt được
- Giữ nguyên 100% Business Logic, Service Interfaces (`executeSingleTestCase`, `executeTestSuite`, `verifyReferenceSolution`), Zod Models, Result Comparator, Scoring Strategy và DTOs.
- Mã nguồn học viên được ghi vào file `/tmp/tmdemy_<nonce>.js` bên trong sandbox và thực thi qua `node`, loại trừ hoàn toàn nguy cơ shell injection.
- Cơ chế `finally` bảo đảm sandbox microVM luôn được đóng (`sandbox.kill()`) sau mỗi lượt chấm hoặc khi xảy ra sự cố/timeout.
- Đã thực hiện kiểm thử thực tế với **Live E2B Cloud Sandbox thật** (100% PASS, không dùng mock).

---

## 2. DANH SÁCH FILE ĐƯỢC TẠO, SỬA, XÓA (FILES CHANGED)

### 2.1. File tạo mới:
1. `src/config/e2b.config.ts`: Cấu hình E2B (`apiKey`, `template`, `sandboxTimeoutMs`, `commandTimeoutMs`, `maxConcurrency`).
2. `src/integrations/e2b/e2b.client.ts`: Adapter giao tiếp E2B SDK, quản lý vòng đời sandbox, bắt lỗi `CommandExitError`, `TimeoutError`, và dọn dẹp file/microVM.
3. `src/integrations/e2b/javascriptHarness.ts`: Bộ đóng gói mã nguồn an toàn với nonce 128-bit, chặn `console.log` và `process.exit()`.
4. `src/integrations/e2b/resultComparator.ts`: So khớp sâu cấu trúc kết quả thực tế và kết quả kỳ vọng (sai số float $10^{-7}$).
5. `scripts/test_step3_e2b_code_execution.ts`: Bộ test suite bao quát 10 kịch bản quy chuẩn của Phase 5 (Unit tests + Live E2B tests).
6. `docs/coding-exercise/STEP_03_E2B_MIGRATION.md`: Báo cáo kỹ thuật chi tiết này.

### 2.2. File chỉnh sửa:
1. `src/services/codeExecution.service.ts`: Chuyển đổi phụ thuộc từ Judge0 sang E2B adapter (`defaultE2BClient`), tối ưu hóa thực thi theo lô (test suite) trong cùng một microVM của submission.
2. `.env`: Bổ sung bí danh chuẩn `E2B_API_KEY` và `E2B_TEMPLATE` (ánh xạ an toàn từ khóa `tmdemy-sandbox`).
3. `.env.example`: Thay thế cấu hình Judge0 CE bằng cấu hình mẫu E2B Sandbox.
4. `package.json`: Cài đặt package `e2b` (v2.59.0).

### 2.3. File đã dọn dẹp (Xóa):
1. `src/config/judge0.config.ts` (Xóa hoàn toàn, không để lại dead code).
2. `src/integrations/judge0/` (Xóa toàn bộ thư mục Judge0 cũ).
3. `scripts/test_step3_code_execution.ts` (Thay thế bằng test suite E2B).

---

## 3. KIẾN TRÚC EXECUTION ENGINE MỚI (E2B SANDBOX ARCHITECTURE)

```text
TMdemy Express Backend (Trusted Server)
   │
   │  1. executeTestSuite({ sourceCode, contract, testCases, limits })
   ▼
CodeExecutionService (src/services/codeExecution.service.ts)
   │
   │  2. buildJavaScriptHarness() [Gán Nonce 128-bit + Tham số Input]
   ▼
JavaScript Harness Builder (src/integrations/e2b/javascriptHarness.ts)
   │
   │  3. Ghi file /tmp/tmdemy_<nonce>.js vào E2B Sandbox Filesystem
   ▼
E2B Execution Adapter (src/integrations/e2b/e2b.client.ts)
   │
   │  4. Chạy lệnh: `node /tmp/tmdemy_<nonce>.js` với commandTimeoutMs
   ▼
E2B Cloud MicroVM Sandbox (Firecracker microVM, hoàn toàn biệt lập)
   │
   │  5. Thu thập stdout, stderr, exitCode, executionTimeMs
   ▼
E2B Execution Adapter
   │
   │  6. Finally: sandbox.kill() [Hủy MicroVM, giải phóng tài nguyên]
   ▼
Harness Output Parser (src/integrations/e2b/javascriptHarness.ts)
   │
   │  7. Bóc tách JSON payload giữa cặp markers khớp Nonce
   ▼
Result Comparator (src/integrations/e2b/resultComparator.ts)
   │
   │  8. So khớp sâu actual vs expected + Tính điểm trọng số
   ▼
CodeExecutionResult (Chuẩn DTO trả về cho Controller/Step 4)
```

---

## 4. CẤU HÌNH E2B API KEY & SANDBOX TEMPLATE

### 4.1. Cấu hình biến môi trường
File `.env` được cấu hình như sau:
```env
# E2B Sandbox Configuration (Coding Exercise Execution Engine)
E2B_API_KEY="e2b_6bd..."
E2B_TEMPLATE=""
E2B_SANDBOX_TIMEOUT_MS="60000"
E2B_COMMAND_TIMEOUT_MS="10000"
E2B_MAX_CONCURRENCY="2"
```

### 4.2. Xử lý Template `tmdemy_sandbox`
- **Kết quả điều tra API**: Khi truy vấn danh sách template qua endpoint `https://api.e2b.dev/templates`, tài khoản hiện tại trả về danh sách rỗng (`[]`). Giá trị cũ `tmdemy-sandbox_id=e8d60265-c00e-4f24-a251-cf5c17ad3e5a` thực chất là ID của một sandbox instance trước đó, không phải Template ID.
- **Giải pháp xử lý thông minh**: 
  - `src/config/e2b.config.ts` và `src/integrations/e2b/e2b.client.ts` được thiết kế có cơ chế **tự động fallback**: Nếu cấu hình template bị lỗi 404 (Template Not Found) hoặc để trống, adapter tự động sử dụng **Base Template chính thức của E2B** (chứa sẵn Ubuntu + Node.js v20.9.0).
  - Điều này giúp hệ thống hoạt động ngay lập tức mà không cần tạo template phức tạp, đồng thời vẫn cho phép nạp Custom Template ID bất cứ lúc nào trong tương lai.

---

## 5. CHI TIẾT LUỒNG THỰC THI (EXECUTION FLOW)

1. **Khởi tạo Sandbox**: Khi nhận yêu cầu chấm từ `executeTestSuite`, adapter mở một instance microVM mới qua `Sandbox.create({ apiKey, timeoutMs: 60000 })`.
2. **Ghi mã an toàn**: Mã bọc (harness) được ghi thành tệp riêng biệt `/tmp/tmdemy_<nonce>.js` trong microVM qua `sandbox.files.write`.
3. **Thực thi có kiểm soát**:
   - Chạy lệnh `node /tmp/tmdemy_<nonce>.js` với tham số `timeoutMs: limits.timeLimitMs` (ví dụ: 2000ms).
   - Biến môi trường rỗng (`envs: {}`), tuyệt đối không chia sẻ `process.env` của server backend.
4. **Xử lý ngắt & bắt lỗi**:
   - Nếu lệnh chạy quá thời gian $\rightarrow$ E2B SDK ném `TimeoutError` $\rightarrow$ Ánh xạ thành `TIME_LIMIT_EXCEEDED`.
   - Nếu mã nguồn có lỗi cú pháp $\rightarrow$ Node.js thoát với `exitCode = 1`, `CommandExitError` chứa `stderr` có chuỗi `SyntaxError` $\rightarrow$ Ánh xạ thành `COMPILATION_ERROR`.
   - Nếu mã nguồn ném lỗi runtime $\rightarrow$ Ánh xạ thành `RUNTIME_ERROR`.
5. **So khớp kết quả**: Trích xuất kết quả giữa cặp marker `__TM_GRADING_RESULT_START__<nonce>__` và so sánh sâu với `testCase.expectedOutput`.
6. **Hủy sandbox bắt buộc**: Khối `finally` đảm bảo `await sandbox.kill()` luôn được gọi, cam kết không rò rỉ instance chạy ngầm gây tốn chi phí.

---

## 6. BẢO MẬT & CÁCH LY (SECURITY CONSIDERATIONS)

1. **Cách ly phần cứng (MicroVM Isolation)**: E2B sử dụng công nghệ ảo hóa Firecracker MicroVM. Mã nguồn của học viên chạy trong một máy ảo riêng biệt trên đám mây, hoàn toàn cách ly với host Node.js của TMdemy.
2. **Không shell injection**: Mã nguồn học viên không bao giờ được nối chuỗi trực tiếp vào lệnh bash/shell; mã được ghi trực tiếp vào tệp JS bằng API nhị phân của E2B rồi mới gọi trình thông dịch `node`.
3. **Không rò rỉ thông tin mật**: Toàn bộ secrets, database credentials, API keys của hệ thống TMdemy đều bị cô lập trên máy chủ backend; sandbox chỉ chạy duy nhất logic thuật toán của bài tập.
4. **Bảo vệ Test Ẩn**: `expectedOutput` của test case ẩn không được đưa vào sandbox; sandbox chỉ nhận `input` và trả về `actualOutput`. Việc so khớp diễn ra tại backend.
5. **Chống giả mạo stdout**: Nonce UUID ngẫu nhiên 128-bit ngăn chặn học viên tự in marker giả bằng `console.log`.

---

## 7. KẾT QUẢ KIỂM THỬ (TEST RESULTS)

Lệnh thực thi:
```bash
cmd /c npx tsx scripts/test_step3_e2b_code_execution.ts
```

### 7.1. Tổng quan:
- **Tổng số assertions**: 19/19 checks
- **Số lượng đạt (PASSED)**: 19 (100%)
- **Số lượng thất bại (FAILED)**: 0
- **Thời gian chạy**: ~21 giây (bao gồm cả khởi động microVM thật và chạy 4 bài test live trên cloud E2B).

### 7.2. Chi tiết kết quả:

#### Level A: Deterministic Unit & Business Logic Tests (14 checks)
- `PASS`: [Scenario 1] Hàm JavaScript đúng trả về `ACCEPTED` (100% score).
- `PASS`: [Scenario 1b] Số lượng test case vượt qua đạt 2/2.
- `PASS`: [Scenario 2] Hàm JavaScript sai kết quả trả về `WRONG_ANSWER`.
- `PASS`: [Scenario 2b] Từng test case sai được đánh dấu `FAILED`.
- `PASS`: [Scenario 3] Lỗi cú pháp được phát hiện và ánh xạ thành `COMPILATION_ERROR`.
- `PASS`: [Scenario 4] Ngoại lệ ném ra được bắt thành `RUNTIME_ERROR` kèm thông điệp sạch sẽ.
- `PASS`: [Scenario 5] Vòng lặp vô tận kích hoạt `TIME_LIMIT_EXCEEDED`.
- `PASS`: [Scenario 6a, 6b] Các test case được đánh giá độc lập (Test 1 PASS, Test 2 FAIL).
- `PASS`: [Scenario 7] Tính toán điểm số theo trọng số chính xác (40/100).
- `PASS`: [Scenario 8] Helper `verifyReferenceSolution` xác thực đạt 100% cho bài giải mẫu.
- `PASS`: [Scenario 9] Sandbox cleanup (`kill`) được gọi bắt buộc trong `finally`.
- `PASS`: [Scenario 10] Sự cố E2B API được bắt thành `INTERNAL_ERROR` (không ngụy tạo thành Wrong Answer).
- `PASS`: [Security 11] Vô hiệu hóa mưu toan giả mạo marker stdout nếu không có nonce server.
- `PASS`: [Regression 12] Toàn bộ quan hệ Database của CodingExercise và Quiz giữ nguyên vẹn 100%.

#### Level B: Live Real E2B Cloud Sandbox Integration Tests (5 checks)
- `PASS`: [LiveE2B] Kết nối và xác thực thành công với E2B Sandbox Cloud (Instance ID: `iwxxs0h2ga0ugthkmjj6i`).
- `PASS`: [LiveE2B Test 1] **Thực thi hàm JavaScript thật (`sumToN`) trên cloud microVM trả về `ACCEPTED` (100% score)**.
- `PASS`: [LiveE2B Test 2] **Thực thi hàm sai kết quả trên cloud microVM bị phát hiện chính xác (`FAILED`)**.
- `PASS`: [LiveE2B Test 3] **Thực thi mã có lỗi cú pháp trên cloud microVM bị bắt thành `COMPILATION_ERROR`**.
- `PASS`: [LiveE2B Test 4] **Thực thi mã ném lỗi `RangeError` trên cloud microVM bị bắt thành `RUNTIME_ERROR`**.

---

## 8. CÁC LỖI ĐÃ GẶP VÀ CÁCH XỬ LÝ (CHALLENGES & RESOLUTIONS)

1. **Lỗi Template Not Found (404)**:
   - *Vấn đề*: `tmdemy_sandbox` và ID trong `.env` chưa tồn tại trong danh sách custom templates của tài khoản E2B.
   - *Cách xử lý*: Xây dựng cơ chế fallback thông minh tại `src/integrations/e2b/e2b.client.ts`. Nếu template trả về 404, adapter tự động chuyển sang base template Node.js v20 của E2B, giúp hệ thống hoạt động trơn tru ngay lập tức.
2. **Xử lý `CommandExitError` của E2B SDK**:
   - *Vấn đề*: Khi mã nguồn học viên có lỗi cú pháp hoặc runtime error, Node.js thoát với `exitCode = 1`. E2B SDK ném ra ngoại lệ `CommandExitError`. Ban đầu `execErr.message` chỉ chứa chuỗi `"exit status 1"`, làm mất nội dung `SyntaxError` thực tế.
   - *Cách xử lý*: Trích xuất chính xác `execErr.stderr` và `execErr.stdout` từ đối tượng `CommandExitError`, đảm bảo thông điệp lỗi chi tiết của Node.js được chuyển tiếp đầy đủ đến bộ phân tích lỗi.

---

## 9. NHỮNG VẤN ĐỀ CÒN TỒN TẠI (REMAINING LIMITATIONS)

1. **Độ trễ khởi tạo MicroVM**:
   - Mỗi lần chạy test suite sẽ mất khoảng 1.5 - 2.5 giây để E2B cấp phát Firecracker microVM. Tuy nhiên, bên trong cùng một test suite, các test cases chạy liên tiếp trong vài chục millisecond, đảm bảo tổng thời gian chấm bài rất nhanh (~3-4 giây cho toàn bộ bài tập).
2. **Phụ thuộc vào Internet / E2B Cloud Service**:
   - Do E2B là dịch vụ cloud-hosted sandbox, máy chủ backend cần có kết nối Internet để gọi API của E2B. Nếu mất mạng, hệ thống sẽ trả về lỗi `INTERNAL_ERROR` thông báo hạ tầng không khả dụng.

---

## 10. ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG CHO STEP 4 (STEP 4 READINESS)

### Kết luận: **SẴN SÀNG 100% ĐỂ TRIỂN KHAI STEP 4 (STUDENT RUN & SUBMIT APIS)**

- Engine đã hoàn toàn ổn định, không còn bất kỳ lỗi nào liên quan đến Docker Desktop hay cgroups v2 trên Windows.
- Cung cấp đầy đủ hàm `executeTestSuite` cho endpoint `/submit` và `executeSingleTestCase` cho endpoint `/run`.
- DTO `CodeExecutionResult` tương thích 100% với các bảng `CodingSubmission` và `CodingTestResult` trong Prisma.
- Không có bất kỳ rào cản kỹ thuật nào cản trở việc triển khai Step 4.
