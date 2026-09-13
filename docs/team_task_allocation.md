# Bảng Phân Chia Công Việc Cho 5 Thành Viên (Team Task Allocation)
> **Dự án:** AITA-INTELLIGENT (SWP391-RBL - FPT University)  
> **Phân hệ 5:** Redis Queue (BullMQ) & Git Teamwork Analytics Platform  
> **Phiên bản:** Cập nhật đồng bộ theo Đề cương 10 Tuần & 4 Cột Mốc Đánh Giá (Milestones)

---

## 👥 Danh Sách 5 Thành Viên Nhóm 2 (SWP391)
1. **QE180043 – Nguyễn Châu Khánh Linh**
2. **QE180099 – Nguyễn Tường Vy**
3. **QE190078 – Đào Minh Nghĩa**
4. **QE190127 – Ngô Sử Việt Anh**
5. **QE190151 – Lê Nguyễn Anh Mai**

---

## 1. Ma Trận Trách Nhiệm Cốt Lõi (RACI Matrix Theo 4 Milestones)

| Thành Viên / Vai Trò | Trọng Tâm Kỹ Thuật | Milestone 2 (Tuần 3-5, 20%) | Milestone 3 (Tuần 6-8, 25%) | Final Defense (Tuần 9-10, 40%) |
| :--- | :--- | :--- | :--- | :--- |
| **Thành Viên 1**<br>*(Queue & Concurrency Lead)* | BullMQ Core, Worker Daemon, Telemetry & Stress Test | Xây dựng BullMQ, Priority Queue, Retry 3 lần, DLQ, Concurrency 1-10. Chống treo hàng đợi khi bị test tải P2P. | Viết API Telemetry 2s, hoàn thiện cơ chế Replay DLQ, hỗ trợ tích hợp WebSockets/SSE. | **Stress Testing k6 (100 concurrent requests)**, tối ưu hiệu năng hàng đợi Redis. |
| **Thành Viên 2**<br>*(Git Engine & Heuristics)* | Git CLI Parser, Bare Clone Sandbox, Fraud Detection | Thiết lập môi trường chạy Git CLI, chuẩn bị cơ chế Bare Clone sandbox an toàn và mã hóa AES-256 PAT. | Lập trình Git Diff Parser, bộ lọc file rác (`node_modules`), thuật toán bắt gian lận (*whitespace & self-revert*), GitHub PR API. | Chuẩn bị dữ liệu demo bắt gian lận commit và hỗ trợ tối ưu thời gian phân tích repo Git. |
| **Thành Viên 3**<br>*(Data Architect & Scoring Engine)* | Prisma ORM, Multi-Email Matching, Scoring Formula | Quản lý Prisma schema, migrations, seed data ban đầu, API cấu hình System Settings. | Thuật toán Author Matching đa email (`@fpt` & `@gmail`), Bộ tính điểm $40/40/20$, cờ Free-Rider. | **Tối ưu Database Indexes & Redis Cache (< 100ms)**, đồng bộ dữ liệu đợt chấm lớn. |
| **Thành Viên 4**<br>*(Frontend - Batch Grading UI)* | Giao diện React/Vite: Quản lý đợt chấm & Giám sát | Dựng màn hình Submissions List, Batch Config Modal chọn độ ưu tiên, Queue Monitor Dashboard realtime. | Dựng Job Details Modal (xem stack trace), màn hình DLQ và Modal chỉnh Concurrency Worker. | Tinh chỉnh giao diện, xử lý responsive, tối ưu UX khi hàng đợi nhận số lượng lớn jobs. |
| **Thành Viên 5**<br>*(Frontend - Git UI & QA Lead)* | Giao diện React/Vite: Git Analytics & Kiểm Thử | Dựng Form nộp Git Repo, Modal nhập PAT bảo mật, màn hình Stepper 4 bước hiển thị tiến trình. | Dựng Báo cáo đóng góp %, Member Details Modal, Flagged Commits Modal. **Viết Unit Test (Vitest) $\ge 80\%$**. | **Tổng đạo diễn Demo bảo vệ trước Hội đồng** (Slide, kịch bản bắt Free-Rider, tài liệu User Manual). |

---

## 2. Chi Tiết Nhiệm Vụ Từng Thành Viên Theo Từng Cột Mốc

---

### 👤 THÀNH VIÊN 1: Queue & Concurrency Engineer (Backend Worker & Telemetry)
*Trách nhiệm chính: Đảm bảo hàng đợi hoạt động bền bỉ, không bao giờ bị nghẽn/treo dưới tải nặng.*

- **Milestone 2 (Tuần 3–5 - Trọng số 20%):**
  - Cấu hình Redis kết nối thư viện **BullMQ** native trong `apps/api` và `apps/worker`.
  - Triển khai **Priority Queue**: `Exam (100) > Assignment (50) > Practice (10)` (`BR-01`).
  - Kiểm soát giới hạn đợt chấm: Tối đa 3 batches đồng thời/lớp (`BR-02`).
  - Lập trình **Mock Execution Dispatcher**: Đo `runtimeDurationMs` và sinh kết quả giả lập test cases.
  - Cơ chế chịu lỗi: Tự động thử lại với Exponential Backoff $2^{\text{retryCount}}$ giây (2s, 4s, 8s) (`BR-04`, `BR-05`).
  - Cơ chế **Dead-Letter Queue (DLQ)**: Quản lý các job thất bại sau 3 lần (`status = 'dead'`), lưu mã lỗi `errorClassification` và `stackTrace`.
  - **Phòng vệ P2P Testing (École 42):** Cấu hình `stalledInterval`, `lockDuration` và timeout bảo vệ để tránh việc nhóm đối thủ nạp tải nặng làm tê liệt/treo hàng đợi.

- **Milestone 3 (Tuần 6–8 - Trọng số 25%):**
  - Viết API `GET /api/grading/telemetry`: Thống kê số lượng job (`waiting`, `active`, `completed`, `failed`) phục vụ cập nhật chu kỳ 2 giây (`BR-03`).
  - Viết API xử lý DLQ: `POST /api/dlq/:id/retry` (reset retryCount về 0 - `BR-06`) và `POST /api/dlq/:id/dismiss`.
  - Lập trình tính năng **Dynamic Worker Concurrency**: Đổi số worker chạy song song (1 đến 10) tại runtime khi Admin thay đổi cài đặt (`BR-07`, `UC-05`).

- **Final Defense (Tuần 9–10 - Trọng số 40%):**
  - **Stress Testing với k6:** Viết kịch bản `stress-test.js` mô phỏng 100 requests đồng thời nạp vào hàng đợi Redis để đo throughput và latency.
  - Chụp biểu đồ kết quả stress test k6 phục vụ làm slide thuyết trình và chèn vào báo cáo.

---

### 👤 THÀNH VIÊN 2: Git Engine & Heuristics Specialist (Git CLI & Fraud Detection)
*Trách nhiệm chính: Xây dựng đường ống bóc tách kho Git an toàn và phát hiện các thủ thuật gian lận commit.*

- **Milestone 2 (Tuần 3–5 - Trọng số 20%):**
  - Lập trình module mã hóa token GitHub PAT bằng chuẩn **AES-256** trước khi lưu trữ (`BR-08`).
  - Kiểm tra ràng buộc `BR-09`: Mỗi nhóm chỉ được có tối đa 1 phân tích repo đang ở trạng thái `pending`/`cloning`.
  - Thiết lập dịch vụ `EphemeralBareCloner`: Chạy lệnh `git clone --bare` vào thư mục tạm an toàn (`scratch/clones/<uuid>`), tự động dọn sạch thư mục sau khi phân tích xong (`UC-07`).

- **Milestone 3 (Tuần 6–8 - Trọng số 25%):**
  - **Commit Stream Log Parser:** Sử dụng Git CLI (`git rev-list`, `git log`, `git diff-tree`) để trích xuất commit hashes, tác giả, ngày giờ, số dòng thêm/xóa (`UC-08`).
  - **Dependency & Noise Sanitizer:** Lập trình bộ lọc loại bỏ toàn bộ file rác sinh tự động theo `BR-13` (`node_modules/`, `dist/`, `build/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) để chỉ giữ lại LOC thật.
  - **Commit Heuristic Auditor (Bắt gian lận commit - BR-10):**
    - Thuật toán nhận diện commit **Whitespace-only** (chỉ sửa format, thêm tab/space để farm LOC).
    - Thuật toán nhận diện commit **Self-revert** (tác giả tự hủy/revert commit liền trước của chính mình).
    - Đánh dấu cờ `isSuspicious = true` và ghi nhận `suspiciousReason` vào bảng `git_commits`.
  - **GitHub REST API Client:** Tích hợp API `/repos/{owner}/{repo}/pulls?state=all` để thống kê chính xác số PR của từng thành viên (`UC-09`).

- **Final Defense (Tuần 9–10 - Trọng số 40%):**
  - Chuẩn bị sẵn 1 repository Git đặc biệt chứa các commit gian lận (whitespace farming và self-revert) để demo bắt quả tang trực tiếp trước Hội đồng.
  - Tối ưu hóa tốc độ clone và bóc tách dữ liệu repo.

---

### 👤 THÀNH VIÊN 3: Data Architect & Scoring Engine (Database, Matching & Scoring)
*Trách nhiệm chính: Quản trị cấu trúc dữ liệu, thuật toán gom email sinh viên và công thức tính điểm đóng góp.*

- **Milestone 2 (Tuần 3–5 - Trọng số 20%):**
  - Quản trị toàn bộ 10 bảng Prisma Schema: Duy trì quan hệ khóa ngoại (FK), Transaction Integrity và chuẩn hóa 3NF để chuẩn bị cho buổi P2P Review chéo giữa các nhóm.
  - Xây dựng file `seed.ts` nạp sẵn dữ liệu mẫu (Users, Classes, Teams, Submissions) phục vụ dev và test nội bộ.
  - Xây dựng API đọc/ghi `system_settings` (`worker_concurrency`, `free_riding_threshold`).

- **Milestone 3 (Tuần 6–8 - Trọng số 25%):**
  - **Thuật Toán Author Matching Đa Email:**
    - Bóc tách và so khớp tác giả Git với `users.id` dựa trên cả email trường (`@fpt.edu.vn`), email cá nhân (`@gmail.com`) lưu trong `gitEmails` và `githubUsername`.
    - Đảm bảo 100% sinh viên dùng email cá nhân vẫn được tính điểm chính xác, không bị bỏ sót.
  - **Weighted Metric Calculator (Bộ tính điểm đóng góp):**
    - Áp dụng công thức chuẩn của môn học:
      $$\text{contributionPercentage} = 40\% \times \text{locShare} + 40\% \times \text{commitShare} + 20\% \text{prShare} \quad (\text{BR-11})$$
    - Xử lý triệt để ngoại lệ chia cho 0 nếu cả nhóm chưa có hoạt động nào (`13.1.E1`).
  - **Free-Rider Auto-Detection Job:**
    - Đọc ngưỡng cấu hình từ `system_settings` (mặc định 5%, dải 1%–20% theo `BR-12`).
    - So sánh tỷ lệ đóng góp của từng thành viên, tự động kích hoạt cờ `isFreeRiding = true` và lưu vào bảng `member_contributions`.

- **Final Defense (Tuần 9–10 - Trọng số 40%):**
  - **Tối ưu hóa Database Indexes & Redis Caching (< 100ms):**
    - Đánh Index trên các cột tìm kiếm thường xuyên: `grading_jobs(batchId, status)` và `git_commits(repoId, authorEmail)`.
    - Cache Redis cho API Telemetry và Báo cáo đóng góp để đảm bảo độ trễ phản hồi client đạt chuẩn dưới 100ms theo tiêu chí chấm điểm cuối kỳ.

---

### 👤 THÀNH VIÊN 4: Frontend Engineer - Batch Grading UI (Web React/Vite)
*Trách nhiệm chính: Xây dựng giao diện trực quan, mượt mà cho phần điều phối chấm bài và giám sát hàng đợi.*

- **Milestone 2 (Tuần 3–5 - Trọng số 20%):**
  - Xây dựng màn hình **Submissions List** (Trang 28):
    - Bộ lọc theo Lớp, Trạng thái (Not graded, Completed, Failed), ô tìm kiếm sinh viên/tiêu đề.
    - Bảng danh sách bài nộp có checkbox chọn nhiều dòng, nút "Start grading".
  - Xây dựng **Batch Config Modal** (Trang 30):
    - Nhập tên đợt chấm, chọn độ ưu tiên (Exam, Assignment, Practice).
    - Validate ràng buộc tối đa 3 đợt chấm đồng thời (`BR-02`), điều hướng sang Dashboard.
  - Xây dựng **Queue Monitor Dashboard** (Trang 31):
    - Bộ 4 thẻ chỉ số (Metric Cards): `Waiting`, `Active`, `Completed`, `Failed`.
    - Cơ chế **Auto-refresh mỗi 2 giây** gọi API Telemetry (`BR-03`).
    - Bảng hiển thị từng Job ID, trạng thái và số lần retry.

- **Milestone 3 (Tuần 6–8 - Trọng số 25%):**
  - Xây dựng **Job Details Modal** (Trang 33): Xem chi tiết thời gian chạy `runtimeDurationMs`, số lần thử lại, phân loại lỗi và crash stack trace.
  - Xây dựng màn hình & Modal **Dead-Letter Queue (DLQ)** (Trang 34, 35, 36):
    - Bảng danh sách các job bị dead.
    - Modal xem chi tiết nguyên nhân lỗi DLQ.
    - Nút "Trigger manual retry" (mở modal chọn lại priority và reset retryCount về 0 theo `BR-06`).
    - Nút "Dismiss job" để đóng job lỗi vĩnh viễn.
  - Xây dựng **Worker Concurrency Modal** (Trang 44): Giao diện cho Admin điều chỉnh số lượng worker (1–10).

- **Final Defense (Tuần 9–10 - Trọng số 40%):**
  - Kiểm thử trải nghiệm người dùng (UX/UI): Đảm bảo giao diện không giật lag khi hiển thị 100+ jobs cùng lúc.
  - Cố định lỗi giao diện (Defects) nếu có trong đợt thi UAT chéo với nhóm đối thủ.

---

### 👤 THÀNH VIÊN 5: Frontend Engineer - Git UI & QA Lead (Web React/Vite & Kiểm Thử)
*Trách nhiệm chính: Xây dựng giao diện báo cáo đóng góp, chủ trì bộ kiểm thử Unit Test $\ge 80\%$ và demo chung kết.*

- **Milestone 2 (Tuần 3–5 - Trọng số 20%):**
  - Xây dựng màn hình **Git Repo Submission** (Trang 37): Form nhập link repo GitHub, nhánh phân tích (mặc định "main"), nút bật toggle Private/Public.
  - Xây dựng **PAT Auth Modal** (Trang 38): Form nhập Personal Access Token an toàn (ẩn ký tự, thông báo quyền `repo:read`).
  - Xây dựng **Analysis Progress Screen** (Trang 39): Màn hình Stepper 4 bước sinh động: *Cloning -> Parsing commits -> Filtering noise -> Scoring*.

- **Milestone 3 (Tuần 6–8 - Trọng số 25%):**
  - Xây dựng **Team Contribution Report** (Trang 40):
    - Biểu đồ phân bổ tỷ lệ % đóng góp trực quan giữa các thành viên.
    - Bảng danh sách thành viên, số lượng PR, % đóng góp thực tế.
    - **Badge cảnh báo đỏ "Free-riding"** nổi bật cho những ai bị dưới ngưỡng.
    - Phân quyền: Giảng viên xem tất cả nhóm; Sinh viên chỉ xem nhóm của mình.
  - Xây dựng các Modal chuyên sâu (Trang 41, 42, 45):
    - **Member Details Modal**: Biểu đồ cột thể hiện tần suất commit theo ngày, bảng thống kê lines added/deleted, tổng net lines.
    - **Flagged Commits Modal**: Bảng liệt kê chi tiết các commit gian lận bị bắt (email, ngày commit, lý do).
    - **Free-Riding Threshold Modal**: Giao diện cho Admin cấu hình ngưỡng (1%–20%).
  - **Chủ trì kiểm thử chất lượng (Yêu cầu bắt buộc Milestone 3):**
    - Cấu hình **Vitest / Jest** và viết bộ **Unit Test đạt độ bao phủ $\ge 80\%$** cho toàn bộ hàm tính toán nghiệp vụ (Backoff delay, Noise filter, Heuristic regex, Scoring formula).

- **Final Defense (Tuần 9–10 - Trọng số 40% - Tổng Đạo Diễn Demo):**
  - Chuẩn bị slide báo cáo thuyết trình kiến trúc trước Hội đồng.
  - Chuẩn bị sẵn kịch bản Demo trực tiếp trên máy chiếu:
    1. Demo 1: Bấm chấm bài thi -> Hàng đợi BullMQ phân luồng ưu tiên mượt mà.
    2. Demo 2: Nộp repo có commit sửa khoảng trắng -> Hệ thống bắt quả tang trong Flagged Commits Modal.
    3. Demo 3: Hiển thị báo cáo nhóm -> Bật cờ đỏ cảnh báo sinh viên Free-Rider.
  - Biên soạn tài liệu Hướng Dẫn Sử Dụng (User Manual) đầy đủ để nộp kèm mã nguồn cuối kỳ.

---

## 3. Lộ Trình 4 Cột Mốc Thời Gian (Gantt Chart)

```mermaid
gantt
    title Kế Hoạch 10 Tuần SWP391-RBL (Subsystem 5)
    dateFormat  YYYY-MM-DD
    section Milestone 1 (15%)
    Monorepo Setup, Prisma Schema 10 bảng, Git origin/main :done, 2026-09-15, 7d
    P2P Review SRS & DB Schema, Thuyết trình Slide       :done, 2026-09-22, 5d
    section Milestone 2 (20%)
    Thành viên 1: BullMQ Core, Priority, Retry & DLQ     :active, 2026-09-27, 10d
    Thành viên 4: UI Submissions List, Batch Config & Queue Monitor :active, 2026-09-27, 10d
    P2P Testing: Chống treo hàng đợi trước bài test nhóm bạn :2026-10-07, 4d
    section Milestone 3 (25%)
    Thành viên 2: Git Bare Clone, Diff Parser, Heuristics :2026-10-11, 10d
    Thành viên 3: Multi-Email Matching, Scoring Formula  :2026-10-11, 10d
    Thành viên 5: UI Git Analytics, Báo cáo Free-Rider    :2026-10-11, 10d
    Thành viên 3 & 5: Viết Unit Test độ phủ >= 80%        :2026-10-18, 5d
    P2P UAT & Nghiệm thu hệ thống chạy thực tế            :2026-10-23, 4d
    section Final Defense (40%)
    Thành viên 1 & 3: Stress Testing k6 100 requests & Cache <100ms :2026-10-27, 5d
    Cả nhóm: Chuẩn bị 3 kịch bản Demo, Slide & Bảo vệ Hội đồng      :2026-11-01, 6d
```

---

## 4. Bảng Checklist Tự Đánh Giá Chéo (P2P Checklist Cho Cả Nhóm)

Trước mỗi buổi review hoặc nộp bài, 5 bạn hãy dùng bảng này để kiểm tra chéo lẫn nhau:

- [ ] **Code Quality:** Không còn warning/error TypeScript, chạy `npm run build` ở root thành công 100%.
- [ ] **Git Contribution:** Cả 5 thành viên đều có commits và PRs trên GitHub theo đúng nhánh tính năng cá nhân.
- [ ] **Business Rules:** Đã tuân thủ đủ 13 Business Rules (`BR-01` đến `BR-13`) đã định nghĩa trong `packages/shared`.
- [ ] **Test Coverage:** Lệnh test chạy xanh và độ bao phủ đạt tối thiểu 80%.
- [ ] **Demo Data:** Các kịch bản demo (Job ưu tiên, commit gian lận, sinh viên Free-rider) đã được nạp sẵn và hoạt động trơn tru.
