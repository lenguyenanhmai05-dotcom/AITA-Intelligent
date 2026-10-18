# 📝 BÁO CÁO TÌM HIỂU & NHẬT KÝ SỬ DỤNG AI (AI LOGS) - TUẦN 7

**Họ và tên:** Nguyễn Châu Khánh Linh  
**Mã sinh viên:** QE180043  
**Vai trò:** Thành Viên 5 – Frontend Lead (Git UI) & QA Lead  
**Phân hệ:** Subsystem 5 (Redis Queue & Git Teamwork Analytics Platform)  
**Môn học:** SWP391 – Software Project (FPT University)  

---

## I. Nhật Ký Sử Dụng AI (AI Prompt Logs - Tuần 7)

| Ngày | Prompt / Yêu Cầu Gửi Cho AI | Kết Quả / Giải Pháp AI Cung Cấp | Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| **17/10/2026** | Phân tích yêu cầu tuần 7: Tách modal chi tiết thành viên và modal cấu hình ngưỡng free-rider thành các component độc lập (`Task 15`, `Task 16`). | Đề xuất kiến trúc tách file [`MemberDetailsModal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/MemberDetailsModal.tsx) và [`FreeRidingThresholdModal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/FreeRidingThresholdModal.tsx), thiết kế giao diện Glassmorphism và gán phím tắt `Escape` chuẩn Accessibility. | Hoàn thiện Chặng 1: Component hóa UI chuyên sâu. |
| **18/10/2026** | Lập trình tính năng phân trang (Pagination) commit log và tối ưu giao diện Dark/Light mode (`Task 17`, `Task 18`). | Tích hợp bộ chọn `pageSize` (5, 10, 25, 50), các nút điều hướng (First/Prev/Next/Last), bộ đếm `1 - 5 / 12`, cố định `position: sticky` tiêu đề bảng và chuẩn hóa màu tương phản WCAG AA. | Hoàn thiện Chặng 2: Nâng cấp UX và tính năng phân trang. |
| **18/10/2026** | Thiết kế bộ Unit Test Vitest cho Exponential Backoff (`BR-04`, `BR-05`), Git Noise Filter (`BR-13`) và Regex Heuristics (`BR-10`) với vai trò QA Lead. | Viết test suite sử dụng `vi.useFakeTimers()` mô phỏng backoff 2s-4s-8s, bộ kiểm tra loại trừ lockfiles/node_modules/dist, và thuật toán regex bắt commit whitespace-only/self-revert. | Hoàn thiện Chặng 3: Unit Testing lõi thuật toán. |
| **18/10/2026** | Xây dựng test suite tính điểm đóng góp 40/40/20 (`BR-11`), phân quyền RBAC UI Gate và luồng tích hợp End-to-End (`Tasks 22-24`). | Viết test case xử lý chia cho 0 khi repo rỗng, ẩn nút cấu hình với role `student`, và kịch bản test E2E tích hợp xuyên suốt từ submit repo đến cảnh báo Free-Rider. | Hoàn thiện Chặng 3: Đảm bảo chất lượng hệ thống (QA). |
| **18/10/2026** | Tổng hợp bảng nhật ký công việc SDLC tuần 7 theo biểu mẫu Excel của FPT University. | Xuất bảng tổng hợp 24 tasks chi tiết với mã task, thời gian thực hiện, kết quả kiểm thử và trạng thái hoàn thành 100%. | Hoàn thiện Chặng 4: Thu thập minh chứng & Báo cáo SDLC. |

---

## II. Báo Cáo Chi Tiết Phần Công Việc Đảm Nhận (Tuần 7)

### 1. Giao Diện Người Dùng & Component Hóa (Frontend Lead)
- **`MemberDetailsModal.tsx` (Task 15, 17, 18):**
  - **4 Metric Cards trực quan:** Tổng Commits, Dòng thêm (+), Dòng xóa (-), Net LOC ròng.
  - **Biểu đồ cột Sprint Pacing Timeline:** Phân tích tần suất commit theo ngày và tự động hiển thị huy hiệu cảnh báo đỏ nếu thành viên dồn >70% commit sát hạn nộp (*Sprint-dumping alert*).
  - **Bảng kiểm toán commit chi tiết:** 5 cột dữ liệu (Mã hash SHA-1 rút gọn 7 ký tự, ngày giờ, thông điệp commit, biến động LOC, trạng thái kiểm toán hợp lệ/gian lận).
  - **Phân trang Client-side:** Tùy chọn 5/10/25/50 dòng, chuyển trang mượt mà, cố định tiêu đề bảng cuộn.
  - **Design System Glassmorphism:** Hiệu ứng làm mờ `backdrop-filter: blur(8px)`, hỗ trợ trọn vẹn Dark/Light mode và song ngữ Anh - Việt.
- **`FreeRidingThresholdModal.tsx` (Task 16, 18):**
  - Thanh trượt tương tác (`range slider`) đồng bộ 2 chiều với ô nhập số (`number input`).
  - Kiểm tra ràng buộc thời gian thực quy tắc **BR-12**: Giới hạn ngưỡng trong khoảng $[1\%, 20\%]$, mặc định $5\%$. Khóa nút Lưu khi giá trị nhập ngoài khoảng.
  - Hỗ trợ đóng nhanh bằng phím `Escape` và click backdrop.

### 2. Trọng Tâm Đảm Bảo Chất Lượng & Kiểm Thử Tự Động (QA Lead)
Đã triển khai toàn diện **11 bộ test suite** với **55 test cases** đạt tỷ lệ thành công tuyệt đối **100%**:

| STT | File Test Suite | Số Test | Nội Dung Kiểm Thử Chính | Trạng Thái |
| :---: | :--- | :---: | :--- | :---: |
| 1 | `GitExponentialBackoff.test.ts` | 5 | Công thức $2^n$ giây (`BR-04`), giới hạn 3 lần retry (`BR-05`), Fake Timers, DLQ và Reset Replay (`BR-06`). | ✅ Passed |
| 2 | `GitNoiseFilter.test.ts` | 6 | Loại bỏ `node_modules`, `dist`, `package-lock.json`, file nhị phân, bảo toàn LOC thực chất (`BR-13`). | ✅ Passed |
| 3 | `GitFraudHeuristics.test.ts` | 8 | Thuật toán Regex bắt `whitespace-only` farming và `self-revert` cùng tác giả (`BR-10`). | ✅ Passed |
| 4 | `ContributionScoring.test.ts` | 7 | Công thức $40\% \text{ LOC} + 40\% \text{ Commits} + 20\% \text{ PRs}$ (`BR-11`), xử lý chia cho 0, repo rỗng. | ✅ Passed |
| 5 | `RBACAccessGate.test.tsx` | 5 | Phân quyền bảo mật: Ẩn nút cấu hình ngưỡng với `student`, mở quyền cho `lecturer` và `admin`. | ✅ Passed |
| 6 | `GitAnalyticsE2EFlow.test.tsx` | 1 | Luồng E2E: Nộp repo -> Stepper -> Báo cáo -> Xem chi tiết -> Nâng ngưỡng đổi cờ Free-Rider. | ✅ Passed |
| 7 | `MemberDetailsModal.test.tsx` | 8 | Hiển thị 4 thẻ, phân trang, sprint-dumping, Escape key, Dark mode & English localization. | ✅ Passed |
| 8 | `FreeRidingThresholdModal.test.tsx` | 5 | Xác thực ràng buộc $[1\%, 20\%]$ (`BR-12`), phím Escape, đồng bộ slider & input. | ✅ Passed |
| 9 | `GitRepoSubmissionForm.test.tsx` | 4 | Form nộp repo, toggle Private/Public, PAT authentication modal. | ✅ Passed |
| 10 | `ProgressStepper.test.tsx` | 3 | Trạng thái Stepper 4 bước (Cloning, Parsing, Scoring, Complete). | ✅ Passed |
| 11 | `FraudDetectionModals.test.tsx` | 3 | Modal hiển thị danh sách commit gian lận và lý do chi tiết. | ✅ Passed |
| **Tổng** | **11 Test Suites** | **55 Tests** | **Độ phủ toàn diện các Business Rules từ BR-04 đến BR-13** | **100% Passed** |

---

## III. Bảng Tổng Hợp Công Việc SDLC Tuần 7 (Dành Cho File Excel)

| Mã Task | Tên Nhiệm Vụ | Hạng Mục / Chặng | Người Thực Hiện | Thời Lượng | Kết Quả Bàn Giao | Trạng Thái |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| **TASK-15** | Tách và xây dựng `MemberDetailsModal.tsx` | Chặng 1 | Nguyễn Châu Khánh Linh | 4.0h | Modal chi tiết thành viên, 4 thẻ metric, biểu đồ timeline ngày, bảng commit | **Hoàn thành** |
| **TASK-16** | Xây dựng `FreeRidingThresholdModal.tsx` | Chặng 1 | Nguyễn Châu Khánh Linh | 3.0h | Modal cấu hình ngưỡng BR-12, range slider, đồng bộ 2 chiều, validate 1%-20% | **Hoàn thành** |
| **TASK-17** | Phân trang & Virtualization commit log | Chặng 2 | Nguyễn Châu Khánh Linh | 3.5h | Bộ chọn pageSize 5/10/25/50, nút Next/Prev/First/Last, sticky header | **Hoàn thành** |
| **TASK-18** | Tối ưu hóa Dark/Light Glassmorphism | Chặng 2 | Nguyễn Châu Khánh Linh | 2.5h | Backdrop blur 8px, token tương phản WCAG AA, responsive, đa ngôn ngữ VI/EN | **Hoàn thành** |
| **TASK-19** | Unit Test Exponential Backoff & Retry | Chặng 3 | Nguyễn Châu Khánh Linh | 3.0h | Bộ test `GitExponentialBackoff.test.ts` (5 tests) với Vitest Fake Timers | **Hoàn thành** |
| **TASK-20** | Unit Test Git Noise Filtering Engine | Chặng 3 | Nguyễn Châu Khánh Linh | 2.5h | Bộ test `GitNoiseFilter.test.ts` (6 tests) lọc sạch rác theo BR-13 | **Hoàn thành** |
| **TASK-21** | Unit Test Regex Heuristic Fraud Detection | Chặng 3 | Nguyễn Châu Khánh Linh | 3.5h | Bộ test `GitFraudHeuristics.test.ts` (8 tests) bắt whitespace-only & self-revert | **Hoàn thành** |
| **TASK-22** | Unit Test 40/40/20 Contribution Scoring | Chặng 3 | Nguyễn Châu Khánh Linh | 3.0h | Bộ test `ContributionScoring.test.ts` (7 tests) xử lý ngoại lệ chia cho 0 | **Hoàn thành** |
| **TASK-23** | Unit Test Role-Based Access Control (RBAC) | Chặng 3 | Nguyễn Châu Khánh Linh | 2.5h | Bộ test `RBACAccessGate.test.tsx` (5 tests) kiểm soát quyền student vs lecturer | **Hoàn thành** |
| **TASK-24** | Unit Test End-to-End Integration Flow | Chặng 3 | Nguyễn Châu Khánh Linh | 3.5h | Bộ test `GitAnalyticsE2EFlow.test.tsx` (1 flow lớn) kiểm thử liên hoàn hệ thống | **Hoàn thành** |
| **TASK-FINAL** | Thu thập minh chứng & Đồng bộ SDLC Log | Chặng 4 | Nguyễn Châu Khánh Linh | 2.0h | Biên dịch production bundle thành công 3.03s, 55/55 tests pass, file AI log TV5 | **Hoàn thành** |
