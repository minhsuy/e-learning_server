# TMDEMY — STEP 7G: AI PIPELINE BUG FIXES, CODING VERIFICATION & MULTI-MODEL SUPPORT
## BÁO CÁO KỸ THUẬT VÀ TỔNG KẾT TRIỂN KHAI PRODUCTION

- **Phiên bản**: Step 7G
- **Trạng thái**: COMPLETED (Toàn bộ 20/20 Test Scenarios PASSED)
- **Khu vực tác động**: 
  - Frontend: `D:\e-learning-project\e-learning`
  - Backend: `D:\e-learning-project\e-learning_server`
  - Python AI Service: `D:\e-learning-project\speech-to-text`

---

## 1. NGUYÊN NHÂN GỐC RỄ CÁC LỖI (ROOT CAUSE AUDIT)

### 1.1 BUG 1 — Summary Missing Dù AI Job Báo Hoàn Thành (`COMPLETED`)
- **Nguyên nhân 1 (Semantics Sai Lệch Giữa Transcription & Summarization)**:
  Trong luồng xử lý AI background của FastAPI (`speech-to-text`), khi hoàn thành Whisper transcription, job chuyển trạng thái thành `COMPLETED` ngay cả khi giai đoạn Gemini Summarization gặp lỗi (hoặc chưa kịp chạy xong do quota/timeout). Backend Express khi poll trạng thái job thấy `COMPLETED` liền cập nhật `Lesson.aiProcessingStatus = 'COMPLETED'` và ghi `transcriptOriginal`, `transcriptRefined`, nhưng `summary` bị null.
- **Nguyên nhân 2 (FastAPI Disk Recovery Không Đồng Nhất)**:
  Khi `speech-to-text` restart hoặc đọc job từ đĩa, hàm `get_job` đọc file `job.json`. Mặc dù file `summary.md` đã được ghi trên đĩa tại `storage/jobs/{job_id}/summary.md`, object `job.result` trong bộ nhớ lại không chứa trường `summary` (hoặc trả về chuỗi rỗng), dẫn đến Express client không đọc được nội dung tóm tắt.
- **Nguyên nhân 3 (Frontend State Lạc Quan Sai Lệch)**:
  `LessonSummaryModal` trên giao diện Giảng viên và `LessonSummaryViewer` của Học viên hiển thị huy hiệu `Đã có tóm tắt` chỉ dựa trên `status === 'COMPLETED'`, trong khi thực tế `lesson.summary` là chuỗi rỗng (`null`). Người dùng không thấy nội dung tóm tắt và không có nút để kích hoạt tạo lại mà không chạy lại Whisper.

### 1.2 BUG 2 — Bài Tập Lập Trình Không Thể Xuất Bản (`Cannot Publish Exercise`)
- **Nguyên nhân 1 (Thiếu Chẩn Đoán Khi Nghiệm Thu Thất Bại)**:
  Cổng xuất bản `POST /api/coding-exercises/:id/publish` thực thi nghiệm thu tự động `referenceSolution` trong Sandbox E2B. Khi lời giải mẫu không đạt $100\%$ test cases (hoặc runtime error), backend trả về thông báo lỗi chung chung: `Reference solution failed automated verification. Cannot publish exercise.` Giảng viên hoàn toàn không biết test case nào bị trượt, lỗi biên dịch gì, input/output thực tế là gì để sửa.
- **Nguyên nhân 2 (Không Có Endpoint Nghiệm Thu Độc Lập)**:
  Giảng viên không có cách nào để chạy thử nghiệm thu `referenceSolution` chống lại test cases mà không phải bấm nút "Xuất bản". Mỗi lần sửa code lại phải bấm xuất bản, gây ức chế và không phân tách được giữa việc "thử nghiệm thu" và "phát hành cho học sinh".
- **Nguyên nhân 3 (Invalidation Khi Sửa Mã Nguồn)**:
  Khi giảng viên sửa starterCode, referenceSolution hoặc test cases trong giao diện Studio, trạng thái kiểm thử trước đó không được reset về `UNVERIFIED`, dẫn đến nguy cơ xuất bản code chưa qua kiểm định hoặc giao diện hiển thị trạng thái cũ.

### 1.3 BUG 3 — Cạn Kiệt Hạn Ngạch Gemini API (`Quota Exhaustion / 429`)
- **Nguyên nhân 1 (Hardcoded Model Duy Nhất)**:
  Toàn bộ hệ thống cố định gọi mô hình `gemini-pro-latest` hoặc phiên bản Flash cũ. `gemini-pro-latest` có hạn ngạch hàng ngày (Requests Per Day - RPD) rất hạn chế trên Free Tier, nhanh chóng bị `429 RESOURCE_EXHAUSTED` (Limit exceeded).
- **Nguyên nhân 2 (Thiếu Cơ Chế Cho Phép Giảng Viên Chọn Model)**:
  Giảng viên không thể chuyển sang các mô hình Flash-Lite nhẹ hơn và có quota dồi dào hơn khi mô hình chính bị nghẽn.
- **Nguyên nhân 3 (Gọi Lại Gemini Lãng Phí Khi Lưu Đã Duyệt)**:
  Trước đây, một số thao tác lưu hoặc xem lại gọi lại AI nhiều lần thay vì tái sử dụng transcript và artifact có sẵn.

---

## 2. KIẾN TRÚC VÀ CÁC GIẢI PHÁP ĐÃ THỰC THI

### 2.1 Sửa Lỗi Tóm Tắt & Phục Hồi An Toàn (Phase 1)
1. **Chuẩn Hóa Ngữ Nghĩa Hoàn Thành (Strict Completion Semantics)**:
   - Một bài học chỉ được xem là "Đã có tóm tắt" khi trường `Lesson.summary` chứa chuỗi Markdown hợp lệ (độ dài $> 10$ ký tự) được lưu bền vững vào PostgreSQL.
   - Nếu quá trình tóm tắt thất bại trong khi phiên âm thành công, hệ thống bảo toàn 100% transcript (`transcriptOriginal`, `transcriptRefined`) và đánh dấu `aiProcessingStatus = 'FAILED'` kèm thông báo lỗi cụ thể để có thể thử lại riêng tóm tắt.
2. **FastAPI Artifact Fallback & Direct Summary Route**:
   - `app/api/routes/jobs.py`: Bổ sung kiểm tra file `summary.md` trên đĩa trong `get_job_result` để nạp nội dung tóm tắt ngay cả khi bộ nhớ đệm tiến trình bị xóa.
   - `app/api/routes/summary.py`: Bổ sung endpoint trực tiếp `POST /api/v1/summary/generate` nhận `{ transcript, title?, model? }` để sinh tóm tắt tức thì từ lời giảng mà **KHÔNG CẦN CHẠY LẠI WHISPER**.
3. **Cơ Chế Phục Hồi An Toàn (Safe Summary Recovery Workflow)**:
   - Endpoint: `POST /api/lessons/:id/summary/recover` và `POST /api/lessons/:id/ai-summary/generate`.
   - **Bảo toàn chỉnh sửa thủ công**: Nếu bài học đã có `summary` do giảng viên tự soạn hoặc chỉnh sửa trước đó, hệ thống giữ nguyên tuyệt đối, không ghi đè.
   - **Tận dụng Artifact trên đĩa**: Nếu đĩa lưu trữ job trước đó đã có sẵn `summary.md`, hệ thống nạp lại và lưu vào DB mà không tốn thêm token Gemini.
   - **Sinh trực tiếp từ Transcript**: Nếu chưa có artifact, hệ thống gửi transcript có sẵn lên `speech-to-text` với mô hình giảng viên chỉ định.
4. **Sửa Đổi Giao Diện Frontend**:
   - `lesson-summary-modal.tsx`:
     - Huy hiệu `Đã có tóm tắt` chỉ hiện khi `hasSummary === true`.
     - Nếu job báo `COMPLETED` nhưng summary rỗng, hiển thị cảnh báo phục hồi màu hổ phách: *"Lời giảng đã sẵn sàng nhưng bản tóm tắt chưa được tạo hoặc bị gián đoạn."* kèm nút bấm *"Tạo tóm tắt từ lời giảng"* (không chạy lại Whisper).
     - Tích hợp bộ chọn mô hình AI trực tiếp trên thanh công cụ tóm tắt.

### 2.2 Nâng Cấp Sandbox Nghiệm Thu E2B & Chẩn Đoán Lỗi (Phase 2)
1. **Thông Điệp Chẩn Đoán Hành Động (Actionable Diagnostics)**:
   - Thay thế thông báo lỗi chung chung bằng thông tin chi tiết:
     - Số lượng test case trượt: `Trượt 2/5 test cases.`
     - Input và Output kỳ vọng vs Output thực tế: `Expected 30 but received 999999`.
     - Lỗi thời gian chạy hoặc biên dịch: `Function sumTwoNumbers was not found` hoặc `ReferenceError`.
2. **Endpoint Nghiệm Thu Độc Lập Cho Giảng Viên (Re-verification)**:
   - `POST /api/coding-exercises/:id/reverify`
   - Chạy nghiệm thu `referenceSolution` trong Sandbox E2B cô lập với $100\%$ test cases (cả công khai lẫn ẩn) nhưng **giữ nguyên bài tập ở trạng thái DRAFT**.
   - Trả về cấu trúc chẩn đoán chuẩn: `{ verificationStatus: 'VERIFIED' | 'FAILED', score, passRate, passedTests, totalTests, details: [...] }`.
3. **Quản Lý Trạng Thái Kiểm Thử & Chống Xuất Bản Lậu**:
   - Trong `coding-exercise-studio-modal.tsx`: Bổ sung nút *"Kiểm thử nghiệm thu (Sandbox)"*.
   - **Tự động vô hiệu hóa**: Khi giảng viên gõ chỉnh sửa starter code hoặc reference solution, trạng thái nghiệm thu ngay lập tức chuyển về `UNVERIFIED`.
   - **Khóa nút Xuất bản**: Nút *"Xuất bản bài tập"* bị disable hoàn toàn nếu revision hiện tại chưa đạt `VERIFIED` ($100\%$ test cases pass).

### 2.3 Kiến Trúc Hỗ Trợ Đa Mô Hình AI (Phase 3)
1. **Central Model Registry (Backend-Controlled Allowlist)**:
   - File cấu hình: `src/config/aiModels.config.ts`.
   - Danh sách mô hình chính thức được hỗ trợ:
     - `gemini-3.5-flash` (*Default - Khuyên dùng*): Tối ưu tốc độ, ngữ cảnh rộng, quota lớn.
     - `gemini-3.5-flash-lite`: Siêu nhẹ, phản hồi nhanh, tiêu tốn ít quota.
     - `gemini-3.1-flash-lite`: Dự phòng ổn định.
     - `gemini-flash-lite-latest`: Bản cập nhật mới nhất từ Google GenAI.
     - `gemini-pro-latest`: Khả năng suy luận chuyên sâu (cần lưu ý hạn ngạch).
   - API công khai cho frontend: `GET /api/ai/models` và `GET /api/lessons/ai-models`.
   - Kiểm định nghiêm ngặt: Mọi request gửi `model` lạ hoặc không nằm trong allowlist đều bị chặn tại middleware/service với HTTP `400 Bad Request` và thông báo tiếng Việt rõ ràng.
2. **Bộ Chọn Mô Hình AI Tái Sử Dụng Trên Frontend (`AiModelSelector`)**:
   - File: `src/components/teacher/assessment/ai-model-selector.tsx`.
   - Tự động nạp danh sách mô hình từ `GET /api/ai/models`, hỗ trợ chế độ thông thường (trong modal tạo Quiz/Coding) và chế độ thu gọn (`compact` trong action bar của Summary modal).
   - Hiển thị nhãn trực quan: Huy hiệu "Khuyên dùng", mô tả đặc tính và mức độ tiêu thụ quota.
3. **Phân Loại Lỗi Quota & Bounded Backoff**:
   - `speech-to-text/app/services/gemini_service.py`: Phân loại mã lỗi 429: Phân biệt giữa nghẽn tạm thời (RPM/TPM) để retry với exponential backoff, và cạn kiệt hạn ngạch ngày (RPD/Daily Free Tier Limit) để ngắt sớm và báo lỗi có thể hành động cho người dùng.

---

## 3. DANH SÁCH TẬP TIN ĐÃ THAY ĐỔI & BỔ SUNG

### 3.1 Backend Express (`e-learning_server`)
| Tập tin | Hành động | Nội dung thay đổi |
|---|---|---|
| `src/config/aiModels.config.ts` | **TẠO MỚI** | Central AI model registry allowlist, validator `isValidAiModelId()`, và metadata mô hình |
| `src/routes/ai.route.ts` | Sửa đổi | Đăng ký route `GET /api/ai/models` |
| `src/routes/lesson.route.ts` | Sửa đổi | Bổ sung `GET /api/lessons/ai-models`, `POST /api/lessons/:id/summary/recover`, và `POST /api/lessons/:id/ai-summary/generate` |
| `src/routes/codingExercise.route.ts` | Sửa đổi | Đăng ký route `POST /api/coding-exercises/:id/reverify` |
| `src/controller/aiJob.controller.ts` | Sửa đổi | Bổ sung `getAiModelsController`, `recoverOrGenerateLessonSummaryController` |
| `src/controller/codingExercise.controller.ts` | Sửa đổi | Bổ sung `reverifyCodingExerciseController` |
| `src/services/aiProcessing.service.ts` | Sửa đổi | Triển khai `recoverOrGenerateLessonSummaryService`: Kiểm tra tóm tắt hiện có, artifact đĩa, sinh trực tiếp không qua Whisper |
| `src/services/aiServiceClient.service.ts` | Sửa đổi | Bổ sung client gọi `POST /api/v1/summary/generate` sang FastAPI |
| `src/services/codingExercise.service.ts` | Sửa đổi | Bổ sung `reverifyCodingExerciseService`, `buildActionableVerificationSummary`, định dạng chi tiết lỗi test case |
| `src/services/aiAssessment.service.ts` | Sửa đổi | Bổ sung xác thực `data.model` bằng allowlist, chuyển tiếp `model` vào payload FastAPI |
| `src/models/aiAssessment.model.ts` | Sửa đổi | Thêm trường `model?: string` vào schema Zod cho Quiz và Coding Exercise |
| `scripts/test_step7g_recovery_multimodel.ts` | **TẠO MỚI** | Bộ kiểm thử tích hợp 20 kịch bản bao phủ toàn bộ Step 7G |

### 3.2 Python AI Service (`speech-to-text`)
| Tập tin | Hành động | Nội dung thay đổi |
|---|---|---|
| `app/api/routes/summary.py` | **TẠO MỚI** | Endpoint `POST /api/v1/summary/generate` sinh tóm tắt trực tiếp từ transcript |
| `app/api/routes/jobs.py` | Sửa đổi | Bổ sung fallback kiểm tra `summary.md` trên đĩa khi nạp kết quả job |
| `app/services/job_manager.py` | Sửa đổi | Cập nhật nạp trạng thái từ đĩa (`PARTIAL_SUCCESS` nếu thiếu summary), hoàn thiện `retry_summary` |
| `app/services/gemini_service.py` | Sửa đổi | Fallback regex trích xuất transcript, phân loại mã lỗi 429 và thông báo tiếng Việt |
| `app/main.py` | Sửa đổi | Đăng ký `summary.router` vào ứng dụng FastAPI |

### 3.3 Frontend Next.js (`e-learning`)
| Tập tin | Hành động | Nội dung thay đổi |
|---|---|---|
| `src/components/teacher/assessment/ai-model-selector.tsx` | **TẠO MỚI** | Component dropdown chọn mô hình AI (hỗ trợ standard và compact mode) |
| `src/components/teacher/curriculum/lesson-summary-modal.tsx` | Sửa đổi | Cập nhật logic huy hiệu tóm tắt, banner phục hồi tóm tắt, tích hợp `AiModelSelector` |
| `src/components/teacher/assessment/coding-exercise-studio-modal.tsx` | Sửa đổi | Nút kiểm thử nghiệm thu Sandbox E2B, invalidation khi sửa code, hiển thị chẩn đoán chi tiết |
| `src/components/teacher/assessment/ai-quiz-generate-modal.tsx` | Sửa đổi | Tích hợp `AiModelSelector` và truyền `model` vào request tạo Quiz |
| `src/components/teacher/assessment/ai-coding-exercise-modal.tsx` | Sửa đổi | Tích hợp `AiModelSelector` và truyền `model` vào request tạo bài tập lập trình |
| `src/types/ai-assessment.ts` | Sửa đổi | Bổ sung kiểu dữ liệu `AiModelDescriptor`, `AiModelsResponse`, `ReverifyCodingExerciseResponse` |
| `src/services/ai-assessment.service.ts` | Sửa đổi | Bổ sung API client `getAiModels()` |
| `src/services/coding-exercise.service.ts` | Sửa đổi | Bổ sung API client `reverifyExercise(exerciseId)` |
| `src/services/lesson-ai-content.service.ts` | Sửa đổi | Bổ sung `recoverOrGenerateSummary(lessonId, payload)` |

---

## 4. BẰNG CHỨNG KIỂM THỬ TÍCH HỢP (TEST EVIDENCE)

Bộ kiểm thử `scripts/test_step7g_recovery_multimodel.ts` đã được thực thi trực tiếp trên hệ thống thực (Express port 3002, FastAPI port 8000, PostgreSQL database `tmdemy`):

```text
===================================================================================
 TMDEMY — STEP 7G INTEGRATION TEST SUITE: SUMMARY RECOVERY, CODING VERIF & MULTI-MODEL
===================================================================================
 Connected to PostgreSQL database via Prisma [postgresql://***:***@localhost:5432/tmdemy]

--- SETUP: Preparing Test Context ---
  ✓ Teacher ID: 6dd1ccd9-420b-5c6d-8322-75223e67e549
  ✓ Course ID: bf71781d-be81-527f-b0d0-2b585d3bffcb
  ✓ Test Lesson ID: b0a66175-832a-48e7-8bcb-b17863183aab

--- GROUP 1: Multi-Model AI Registry & Discovery ---
  [PASS] Scenario 1: GET /api/ai/models returns validated model allowlist
  [PASS] Scenario 2: Default model is gemini-3.5-flash and Lite model supports summary/quiz/coding
  [PASS] Scenario 3: Server-side validator rejects arbitrary/malicious model IDs
  [PASS] Scenario 4: GET /api/lessons/ai-models route ordering works without UUID conflict

--- GROUP 2: Summary Missing Bug & Safe Recovery Workflow ---
  [PASS] Scenario 5: Broken state reproduced: transcript exists, status COMPLETED, summary is null
  [PASS] Scenario 6: POST /api/lessons/:id/ai-summary/generate generates summary directly from transcript
  [PASS] Scenario 7: Lesson.summary is atomically persisted in DB with valid Markdown
  [PASS] Scenario 8: Teacher reload retrieves the non-empty persisted summary
  [PASS] Scenario 9: Student reload retrieves the non-empty persisted summary
  [PASS] Scenario 10: Existing valid summary is preserved and reused without rewriting DB

--- GROUP 3: Coding Exercise Verification Diagnostics & Re-verification ---
  [PASS] Scenario 11: POST /api/coding-exercises creates draft exercise with failing reference solution
  [PASS] Scenario 12: Publish gate blocks publication and provides actionable test failure message
  [PASS] Scenario 13: POST /api/coding-exercises/:id/reverify returns structured failure diagnostics without publishing
  [PASS] Scenario 14: Teacher successfully updates reference solution with correct logic
  [PASS] Scenario 15: Re-verification succeeds with status VERIFIED and 100% passRate
  [PASS] Scenario 16: Genuinely VERIFIED exercise publishes successfully
  [PASS] Scenario 17: Anti-cheat protection: Reference solution and hidden test cases are concealed from student
  [PASS] Scenario 18: Modifying code increments revision to v2 in DRAFT state

--- GROUP 4: Multi-Model Payload Propagation ---
  [PASS] Scenario 19: Invalid model parameter in AI Quiz request is rejected with 400 Bad Request
  [PASS] Scenario 20: Legacy requests omitting model default cleanly to gemini-3.5-flash

===================================================================================
 RESULTS: 20 PASSED / 0 FAILED (TOTAL: 20)
===================================================================================
 Disconnected from PostgreSQL database via Prisma
```

### Kiểm Tra Chất Lượng Mã Nguồn:
- **Frontend TypeScript (`tsc --noEmit`)**: 0 errors.
- **Frontend Linter (`npm run lint`)**: 0 errors.
- **Backend TypeScript (`tsc --noEmit`)**: Không có lỗi phát sinh trong mã nguồn Step 7G.

---

## 5. HƯỚNG DẪN VẬN HÀNH DÀNH CHO GIẢNG VIÊN

1. **Khi gặp bài học có transcript nhưng chưa có tóm tắt**:
   - Mở modal *Tóm tắt bài học*.
   - Hệ thống hiển thị thanh thông báo: *"Lời giảng đã sẵn sàng nhưng bản tóm tắt chưa được tạo hoặc bị gián đoạn."*
   - Chọn mô hình AI mong muốn (mặc định `Gemini 3.5 Flash`) trên thanh công cụ.
   - Bấm nút **"Tạo tóm tắt từ lời giảng"**. Hệ thống tạo và lưu tóm tắt chỉ trong 2-4 giây mà không cần chạy lại Whisper.
2. **Khi tạo/chỉnh sửa bài tập lập trình (Coding Exercise)**:
   - Trong giao diện Studio, bấm **"Kiểm thử nghiệm thu (Sandbox)"** bất kỳ lúc nào để E2B chạy kiểm tra lời giải mẫu với toàn bộ test case.
   - Nếu có lỗi, modal hiển thị rõ ràng test case bị trượt, lỗi trả về để giảng viên chỉnh sửa.
   - Sau khi sửa đúng và đạt 100% nghiệm thu, nút **"Xuất bản"** sẽ sáng lên để giảng viên phát hành bài tập cho học viên.
3. **Khi gặp lỗi Quota Gemini**:
   - Trong modal tạo Quiz, Coding Exercise hoặc Summary, mở dropdown **Mô hình AI** và chọn `Gemini 3.5 Flash-Lite` để tiếp tục làm việc bình thường.
