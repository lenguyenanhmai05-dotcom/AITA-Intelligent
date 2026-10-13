# Bảng Phân Công Nhiệm Vụ 5 Thành Viên & Kế Hoạch Hành Động Chi Tiết
> **Dự án:** AITA-INTELLIGENT (Hệ thống Hỗ trợ Giảng dạy & Đánh giá Dự án Phần mềm Thông minh)  
> **Phân hệ 5 (Subsystem 5):** Redis Queue (BullMQ) & Git Teamwork Analytics Platform  
> **Môn học:** SWP391 - Software Project (FPT University)  
> **Phiên bản:** Cập nhật đồng bộ thực tế mã nguồn & Tối ưu hóa phân công (Thành viên 1 chủ trì toàn bộ luồng Chấm & Duyệt điểm AI)

---

## 👥 Danh Sách 5 Thành Viên Nhóm 2 (SWP391)

| STT | Mã Sinh Viên | Họ và Tên | Vai Trò Kỹ Thuật Chính | Trọng Tâm Trách Nhiệm |
| :---: | :---: | :--- | :--- | :--- |
| **1** | **QE180043** | **Nguyễn Châu Khánh Linh** | **Queue, Concurrency & Review Lead** | BullMQ Core, Worker Daemon, DLQ, Telemetry 2s & **Toàn bộ luồng Giảng viên duyệt điểm AI (`UC-04b`)** |
| **2** | **QE180099** | **Nguyễn Tường Vy** | **Git Engine & Heuristics Lead** | Git CLI Pipeline, Ephemeral Bare Clone, AES-256 PAT, Bắt gian lận commit (*whitespace & self-revert*) |
| **3** | **QE190078** | **Đào Minh Nghĩa** | **Data Architect & Scoring Lead** | Prisma ORM 12 bảng, Seed data, Thuật toán Multi-Email, Công thức 40/40/20 & Bắt Free-Rider |
| **4** | **QE190127** | **Ngô Sử Việt Anh** | **Frontend Lead (Batch & Queue UI)** | Web React: Quản lý bài nộp, Dashboard giám sát hàng đợi realtime, Màn hình DLQ Replay & Modal Concurrency |
| **5** | **QE190151** | **Lê Nguyễn Anh Mai** | **Frontend Lead (Git UI) & QA Lead** | Web React: Git Analytics UI, Báo cáo Free-Rider, Bộ Unit Test >= 80%, Tổng đạo diễn Kịch bản Demo & Slide |

---

## 🔍 1. Đánh Giá Hiện Trạng Thực Tế & Rà Soát Ranh Giới Nhiệm Vụ

Để phục vụ tốt nhất cho buổi bảo vệ **Milestone 2** và tránh việc các thành viên trong nhóm làm trùng lặp công việc của nhau:
1. **Thành viên 1 (Nguyễn Châu Khánh Linh - Bạn):** Đã làm xong phần lõi BullMQ, Worker, Retry Backoff, DLQ, Telemetry. Nay **nhận phụ trách thêm trọn gói tính năng "Giảng viên duyệt điểm sau khi AI chấm xong" (Human-in-the-Loop Review - `UC-04b`)** từ Database, API đến UI nút bấm để sẵn sàng demo thực tế trực quan trước Hội đồng.
2. **Thành viên 2 (Nguyễn Tường Vy):** Đã hoàn thành xuất sắc toàn bộ pipeline Git Sandbox, Bare Clone, mã hóa AES-256 PAT, bắt gian lận commit và GitHub PR API.
3. **Thành viên 3 (Đào Minh Nghĩa):** Không làm phần duyệt điểm nữa; tập trung 100% vào Quản trị Cơ sở dữ liệu Prisma (12 bảng 3NF), Nạp dữ liệu mẫu (`seed.ts`), Thuật toán ghép email đa nguồn (`@fpt` & `@gmail`), Bộ tính điểm $40/40/20$ và Tối ưu hóa Database/Cache < 100ms.
4. **Thành viên 4 (Ngô Sử Việt Anh):** Tập trung vào Màn hình danh sách bài nộp, Modal tạo đợt chấm (validate 3 batch), Dashboard giám sát nhịp tim 2s, Màn hình DLQ và Modal cấu hình Concurrency Worker.
5. **Thành viên 5 (Lê Nguyễn Anh Mai):** Tập trung vào Giao diện nộp Git Repo, Stepper tiến trình phân tích, Báo cáo nhóm & Cảnh báo Free-Rider, Modal bắt gian lận commit, chủ trì Bộ Unit Test $\ge 80\%$, Kịch bản demo và Slide thuyết trình.

---

## 🌟 2. Đặc Tả Nghiệp Vụ: Giảng Viên Duyệt Điểm Sau Khi AI Chấm (Human-in-the-Loop AI Review - `UC-04b`)

Hệ thống Worker thực hiện chấm tự động (chạy test cases, đo thời gian thực thi). Điểm số và trạng thái ban đầu của AI là tạm thời, bắt buộc phải có bước thẩm định của Giảng viên phụ trách lớp.

```
[Bài nộp của Sinh viên]
        │
        ▼
[BullMQ Queue & Worker] ──(AI chấm tự động)──► Trạng thái: completed
                                               Trạng thái duyệt: Pending Review
                                                       │
                                                       ▼
                                          [Giảng viên xem chi tiết]
                                          (Điểm số, logs, test cases)
                                           ┌───────────┴───────────┐
                                           ▼                       ▼
                                   [Approve / Phê duyệt]   [Reject / Từ chối]
                                   - Chốt điểm chính thức  - Bác bỏ kết quả /
                                   - Lưu nhận xét          - Gửi feedback cho SV
```

### Các Quy Tắc Nghiệp Vụ Cốt Lõi (Business Rules):
- **`BR-14` (AI Review Eligibility):** Chỉ những bài nộp có trạng thái chấm `status = 'completed'` mới được phép mở tính năng thẩm định cho giảng viên.
- **`BR-15` (Review Decision Domain):** Quyết định duyệt chỉ nhận một trong hai giá trị hợp lệ: `'approved'` (Chấp thuận) hoặc `'rejected'` (Từ chối). Bắt buộc lưu kèm nhận xét/lý do (`reviewComment`).
- **`BR-16` (Lecturer Ownership & Authorization):** Chỉ Giảng viên được phân công phụ trách lớp học tương ứng mới có quyền duyệt điểm cho bài nộp của lớp đó (Role: `lecturer` và sở hữu `classId`).

> 🎯 **Phân bổ trọng trách:** **Thành viên 1** trực tiếp đảm nhiệm toàn bộ tính năng này (từ Prisma field, Backend API `POST /api/grading/jobs/:id/review` đến giao diện nút bấm duyệt trong Job Details Modal) để đảm bảo có thể trình diễn trực tiếp ngay trong buổi báo cáo.

---

## 📋 3. Chi Tiết Kế Hoạch Hành Động Cho Từng Thành Viên

---

### 👤 THÀNH VIÊN 1: Queue, Concurrency & Review Lead (Nguyễn Châu Khánh Linh)
*(Phụ trách toàn bộ luồng Hàng đợi Chấm bài, Cơ chế Chịu lỗi & Nghiệp vụ Giảng viên Duyệt điểm)*

- **Trách nhiệm chính:** Quản trị BullMQ Queue, Worker Daemon, Chịu lỗi Exponential Backoff, DLQ, Telemetry và Tính năng Giảng viên Duyệt điểm AI (`UC-04b`).
- **Danh sách nhiệm vụ đã hoàn thành:**
  - [x] Cấu hình BullMQ Queue `grading-queue` kết nối Redis với cơ chế fallback in-memory an toàn.
  - [x] Lập trình gán độ ưu tiên: `Exam (100) > Assignment (50) > Practice (10)` (`BR-01`).
  - [x] Lập trình kiểm soát giới hạn tối đa 3 đợt chấm đồng thời trên mỗi lớp (`BR-02`).
  - [x] Lập trình Mock Execution Dispatcher giả lập thời gian chạy và kết quả test cases.
  - [x] Lập trình cơ chế Exponential Backoff tự động retry 3 lần với thời gian chờ 2s, 4s, 8s (`BR-04`, `BR-05`).
  - [x] Lập trình Dead-Letter Queue (DLQ) lưu trữ `status = 'dead'`, mã lỗi và stack trace.
  - [x] Lập trình API `GET /api/grading/telemetry` phục vụ polling nhịp tim 2 giây (`BR-03`).
  - [x] Lập trình Dynamic Worker Concurrency cho phép đổi số worker chạy song song từ 1 đến 10 (`BR-07`).

- **Nhiệm vụ nhận làm thêm để phục vụ thuyết trình & demo:**
  - [ ] **Database & Backend Duyệt Điểm AI (`UC-04b`):**
    - Cập nhật bảng `grading_jobs` trong `schema.prisma`: thêm `reviewStatus` (`pending` | `approved` | `rejected`), `reviewedBy` (FK `User`), `reviewedAt`, `reviewComment`.
    - Viết API `POST /api/grading/jobs/:id/review` kiểm tra `BR-14` (job phải `completed`), `BR-15` (`approved` | `rejected`), `BR-16` (xác thực giảng viên sở hữu lớp).
  - [ ] **Giao Diện Duyệt Điểm Trên Web (Tích hợp vào Job Details Modal):**
    - Hiển thị kết quả AI chấm (Điểm số, test cases passed, runtime logs).
    - Thêm panel Giảng viên thẩm định: Badge trạng thái (`Pending Review`, `Approved`, `Rejected`), ô nhập nhận xét/feedback, 2 nút bấm **"Phê Duyệt (Approve)"** và **"Từ Chối (Reject)"**.
    - Cập nhật tức thì badge trạng thái trên giao diện sau khi bấm.
  - [ ] **Kế hoạch Milestone 3 & Cuối kỳ:**
    - Stress Testing với k6: Viết kịch bản nạp tải 100 requests đồng thời đo throughput và latency.
    - Tối ưu hóa cấu hình hàng đợi BullMQ (`lockDuration`, `stalledInterval`).

---

### 👤 THÀNH VIÊN 2: Git Engine & Heuristics Lead (Nguyễn Tường Vy)
*(Đã hoàn thành toàn bộ khối lượng cốt lõi & Chuẩn bị kịch bản phân tích Git)*

- **Trách nhiệm chính:** Pipeline xử lý kho Git an toàn, bộ lọc nhiễu và thuật toán phát hiện gian lận commit.
- **Danh sách nhiệm vụ đã hoàn thành:**
  - [x] Mã hóa token GitHub PAT bằng thuật toán **AES-256-CBC** trước khi lưu trữ (`BR-08`).
  - [x] Kiểm tra ràng buộc mỗi nhóm chỉ có tối đa 1 phân tích repo đang chạy (`BR-09`).
  - [x] Thiết lập dịch vụ `EphemeralBareCloner`: clone bare vào thư mục tạm `scratch/clones/` và tự động dọn sạch sau khi xử lý xong (`UC-07`).
  - [x] Tích hợp Git CLI trích xuất commit hashes, tác giả, ngày giờ, số dòng thêm/xóa (`UC-08`).
  - [x] Viết bộ lọc loại bỏ toàn bộ file sinh tự động (`node_modules`, `dist`, `package-lock.json`...) để bảo toàn LOC sạch (`BR-13`).
  - [x] Xây dựng thuật toán bắt gian lận commit **Whitespace-only** (sửa khoảng trắng để farm LOC) (`BR-10`).
  - [x] Xây dựng thuật toán bắt gian lận commit **Self-revert** (tác giả tự hủy commit của chính mình) (`BR-10`).
  - [x] Kết nối GitHub REST API đếm chính xác số lượng Pull Requests của từng thành viên (`UC-09`).
- **Kế hoạch giai đoạn tới (Milestone 3 & Final Defense):**
  - Chuẩn bị 1 repository Git mẫu đặc biệt chứa đầy đủ các commit gian lận (whitespace farming, self-revert) phục vụ buổi demo trực tiếp trước Hội đồng.
  - Tối ưu hóa thời gian thực thi Git CLI đối với các repository có dung lượng lớn.

---

### 👤 THÀNH VIÊN 3: Data Architect & Scoring Engine (Đào Minh Nghĩa)
*(Tập trung chuyên sâu vào Cơ sở dữ liệu, Ánh xạ Email sinh viên & Thuật toán điểm số)*

- **Vai trò:** Quản trị cấu trúc dữ liệu Prisma ORM 12 bảng, dữ liệu mẫu `seed.ts`, thuật toán ghép email tác giả Git và bộ tính điểm đóng góp 40/40/20.
- **Kế hoạch công việc chi tiết:**

#### Task 3.1: Quản Trị Cơ Sở Dữ Liệu Prisma ORM (12 Bảng Chuẩn Hóa 3NF)
- Quản trị toàn vẹn quan hệ khóa ngoại (FK), Index và Unique constraints trong `packages/database/prisma/schema.prisma` cho cả 12 bảng:
  1. `users`, 2. `user_git_emails`, 3. `classes`, 4. `teams`, 5. `team_members`, 6. `submissions`, 7. `grading_batches`, 8. `grading_jobs`, 9. `git_repos`, 10. `git_commits`, 11. `member_contributions`, 12. `system_settings`.
- Hoàn thiện script `seed.ts`: Nạp sẵn dữ liệu chuẩn (tài khoản Giảng viên, Sinh viên, các Lớp học, Nhóm dự án, Bài nộp mẫu) phục vụ việc chạy dev và test của cả nhóm.

#### Task 3.2: Thuật Toán Ánh Xạ Tác Giả Git Đa Email (Author Matching Engine)
- Giải quyết triệt để bài toán sinh viên FPT commit bằng email cá nhân (`@gmail.com`) thay vì email trường (`@fpt.edu.vn`).
- Lập trình module ánh xạ tự động:
  - So khớp email commit với bảng `user_git_emails`.
  - Đối chiếu `githubUsername` với tài khoản GitHub đã đăng ký.
  - Gán chính xác `userId` vào bảng `git_commits`, đảm bảo không bỏ sót bất kỳ đóng góp nào của sinh viên.

#### Task 3.3: Bộ Tính Điểm Đóng Góp 40/40/20 & Tự Động Gắn Cờ Free-Rider
- Áp dụng công thức tính tỷ lệ đóng góp chuẩn xác theo `BR-11`:
  $$\text{contributionPercentage} = 40\% \times \text{locShare} + 40\% \times \text{commitShare} + 20\% \times \text{prShare}$$
- Xử lý ngoại lệ chia cho 0 nếu cả nhóm chưa có hoạt động nào (`13.1.E1`).
- Đọc ngưỡng cấu hình từ `system_settings` (mặc định 5%, dải 1% - 20% theo `BR-12`).
- Tự động gắn cờ `isFreeRiding = true` vào bảng `member_contributions` nếu sinh viên đạt tỷ lệ dưới ngưỡng.

#### Task 3.4: Quản Trị Cài Đặt Hệ Thống (System Settings API)
- Xây dựng API đọc/ghi cài đặt hệ thống: `GET /api/system/settings` và `PATCH /api/system/settings`.
- Lưu trữ cấu hình `worker_concurrency` và `free_riding_threshold`.

#### Task 3.5: Tối Ưu Hóa Database Indexes & Redis Caching (< 100ms)
- Đánh Index trên các cột tìm kiếm thường xuyên: `grading_jobs(batchId, status)` và `git_commits(repoId, authorEmail)`.
- Cấu hình Redis Cache cho các dữ liệu báo cáo đóng góp và telemetry, đảm bảo thời gian phản hồi API đạt chuẩn dưới 100ms theo tiêu chí chấm điểm cuối kỳ.

---

### 👤 THÀNH VIÊN 4: Frontend Lead - Batch Grading & Queue UI (Ngô Sử Việt Anh)
*(Tập trung vào Giao diện Quản trị bài nộp, Đợt chấm, Giám sát hàng đợi & DLQ)*

- **Vai trò:** Xây dựng toàn bộ giao diện quản trị chấm bài hàng loạt, giám sát hàng đợi thời gian thực và quản trị Dead-Letter Queue.
- **Kế hoạch công việc chi tiết:**

#### Task 4.1: Màn Hình Quản Lý Bài Nộp (`Submissions List`)
- Bảng danh sách bài nộp có phân trang, hỗ trợ bộ lọc:
  - Lọc theo Lớp học (`Class`).
  - Lọc theo Trạng thái chấm (`Not graded`, `Completed`, `Failed`).
  - Ô tìm kiếm theo tên sinh viên hoặc tiêu đề bài nộp.
- Checkbox chọn từng bài nộp hoặc chọn toàn bộ.
- Nút bấm hành động: "Bắt đầu chấm đợt bài đã chọn" (Start Grading).

#### Task 4.2: Modal Cấu Hình Đợt Chấm (`Batch Config Modal`)
- Form nhập:
  - Tên đợt chấm (`batchName`).
  - Chọn độ ưu tiên: `Exam (Cao nhất)`, `Assignment (Trung bình)`, `Practice (Thấp)`.
  - Hiển thị số lượng bài nộp đã chọn.
- Kiểm tra ràng buộc `BR-02` (tối đa 3 đợt chấm đang chạy đồng thời trên mỗi lớp). Hiển thị thông báo nếu vượt ngưỡng.
- Tự động chuyển hướng sang Dashboard Giám sát sau khi bấm tạo thành công.

#### Task 4.3: Dashboard Giám Sát Hàng Đợi Thời Gian Thực (`Queue Monitor Dashboard`)
- Bộ 4 thẻ chỉ số tổng quan (Metric Cards) hiển thị sinh động:
  - `Waiting` (Chờ xử lý - Vàng)
  - `Active` (Đang chấm - Xanh dương)
  - `Completed` (Đã hoàn thành - Xanh lá)
  - `Failed` (Lỗi / Thất bại - Đỏ)
- Cơ chế **Auto-refresh mỗi 2 giây** gọi API Telemetry (`BR-03`) với hiệu ứng nhịp tim Live Heartbeat.
- Bảng danh sách Jobs chi tiết: ID bài nộp, tên sinh viên, độ ưu tiên, trạng thái, số lần thử lại (`retryCount`).

#### Task 4.4: Màn Hình & Modal Dead-Letter Queue (`DLQ Screen & Modal`)
- Bảng danh sách các job bị đưa vào hàng đợi chết (`status = 'dead'`).
- Modal xem chi tiết nguyên nhân lỗi, mã lỗi và stack trace.
- Nút **"Manual Retry"**: Mở modal cho phép chọn lại độ ưu tiên và reset số lần thử lại về 0 theo `BR-06`.
- Nút **"Dismiss Job"**: Xác nhận đóng và xóa job lỗi vĩnh viễn khỏi danh sách.

#### Task 4.5: Modal Cài Đặt Concurrency Worker Cho Quản Trị Viên
- Màn hình/Modal cho phép Admin điều chỉnh số lượng worker chạy song song (thanh trượt từ 1 đến 10 worker).
- Tích hợp gọi API cập nhật tức thì vào runtime của hệ thống (`BR-07`).

#### Task 4.6: Tối Ưu Hóa Giao Diện & Trải Nghiệm Người Dùng (UX)
- Đảm bảo giao diện mượt mà, không giật lag khi danh sách hiển thị hơn 100 jobs cùng lúc.
- Hoàn thiện responsive cho các kích thước màn hình phổ biến.

---

### 👤 THÀNH VIÊN 5: Frontend Lead - Git UI & QA Lead (Lê Nguyễn Anh Mai)
*(Tập trung vào Giao diện Git Analytics, Báo cáo Free-Rider, Bộ Unit Test >= 80% & Đạo diễn Demo)*

- **Vai trò:** Xây dựng toàn bộ giao diện phân tích Git, hiển thị biểu đồ đóng góp nhóm, chủ trì kiểm thử hệ thống (Unit Test & API Test) và đạo diễn buổi demo trước Hội đồng.
- **Kế hoạch công việc chi tiết:**

#### Task 5.1: Giao Diện Nộp Kho Git (`Git Repo Submission Screen`)
- Form nhập:
  - Chọn Nhóm sinh viên (`Team`).
  - Nhập URL repository GitHub (`https://github.com/owner/repo`).
  - Nhánh phân tích (mặc định là `"main"`).
- Nút Toggle chuyển đổi giữa Public Repo và Private Repo:
  - Nếu chọn Private: Mở **PAT Auth Modal** cho phép người dùng nhập GitHub Personal Access Token an toàn (trường password che dấu ký tự, thông báo rõ chỉ cần quyền tối thiểu `repo:read`).

#### Task 5.2: Màn Hình Tiến Trình Phân Tích Kho Git (`Analysis Progress Screen`)
- Màn hình hiển thị Stepper 4 bước sinh động theo thời gian thực:
  - *Bước 1: Cloning repository (Bare clone sandbox cách ly).*
  - *Bước 2: Parsing commits (Bóc tách lịch sử commit bằng Git CLI).*
  - *Bước 3: Filtering noise (Lọc sạch các file thư viện và rác sinh tự động).*
  - *Bước 4: Scoring & Heuristics (Tính điểm đóng góp và quét gian lận).*
- Tự động kiểm tra trạng thái và chuyển tiếp mượt mà sang Màn hình Báo cáo khi hoàn tất.

#### Task 5.3: Màn Hình Báo Cáo Đóng Góp Nhóm (`Team Contribution Report`)
- Biểu đồ phân bổ tỷ lệ % đóng góp trực quan giữa các thành viên trong nhóm.
- Bảng tổng hợp số liệu chi tiết:
  - Tên sinh viên & Avatar.
  - Số lượng Commit hợp lệ.
  - Số lượng Dòng code ròng (Net LOC = Lines Added - Lines Deleted).
  - Số lượng Pull Request đã tạo/merge.
  - Tỷ lệ phần trăm đóng góp thực tế theo công thức $40/40/20$.
  - **Huy hiệu cảnh báo đỏ nổi bật "Free-Riding"** đối với thành viên có mức đóng góp dưới ngưỡng quy định.
- Phân quyền giao diện: Giảng viên xem được báo cáo của toàn bộ các nhóm; Sinh viên chỉ xem được báo cáo nhóm của mình.

#### Task 5.4: Các Modal Phân Tích Chuyên Sâu & Cấu Hình Ngưỡng
- **Member Details Modal:** Biểu đồ cột thể hiện tần suất commit theo từng ngày trong suốt thời gian làm bài; bảng chi tiết từng commit (hash, ngày giờ, số dòng thêm/xóa).
- **Flagged Commits Modal:** Danh sách các commit bị hệ thống bắt gian lận; hiển thị rõ lý do: `Whitespace-only` hoặc `Self-revert`.
- **Free-Riding Threshold Modal:** Giao diện cho Admin điều chỉnh ngưỡng phát hiện thành viên lười biếng (từ 1% đến 20%, mặc định 5%).

#### Task 5.5: QA & Testing Lead (Đảm bảo điểm số tối đa cho đồ án SWP391)
- **Xây dựng bộ Unit Test tự động (Vitest / Jest):**
  - Viết Unit Test cho toàn bộ các hàm nghiệp vụ cốt lõi:
    - Công thức Exponential Backoff delay ($2^{\text{retryCount}}$).
    - Bộ lọc đường dẫn loại bỏ file rác (`node_modules/`, `dist/`...).
    - Biểu thức chính quy (Regex) và logic Heuristic phát hiện commit gian lận.
    - Công thức tính điểm đóng góp $40/40/20$ và xử lý ngoại lệ chia cho 0.
    - Logic thẩm định Giảng viên duyệt điểm (`BR-14`, `BR-15`, `BR-16`).
  - **Cam kết đạt độ bao phủ kiểm thử (Code Coverage) >= 80%** (Tiêu chí bắt buộc của môn học).
- **Kịch bản kiểm thử API (Postman / REST Client):**
  - Soạn sẵn Collection kiểm thử toàn diện các mã lỗi HTTP (400, 401, 403, 404, 500) và các Business Rules từ `BR-01` đến `BR-16`.
- **Tổng đạo diễn buổi Demo bảo vệ trước Hội đồng chấm thi:**
  - Chuẩn bị sẵn 3 kịch bản Demo trực tiếp trên máy chiếu:
    1. *Kịch bản 1:* Nạp bài nộp đồng loạt -> Hàng đợi BullMQ xử lý ưu tiên Bài thi (Exam) trước Bài tập (Assignment) -> Giảng viên mở modal kiểm tra kết quả AI và bấm "Approve".
    2. *Kịch bản 2:* Giả lập lỗi chấm thi -> Hệ thống tự động retry 3 lần theo khoảng cách 2s, 4s, 8s -> Job chuyển vào DLQ -> Thao tác "Manual Replay" đưa job quay lại hàng đợi.
    3. *Kịch bản 3:* Nộp link repository Git có commit sửa khoảng trắng -> Hệ thống quét ra cờ `isSuspicious = true` -> Hiển thị cảnh báo sinh viên Free-Rider trên biểu đồ đóng góp.
  - Hoàn thiện Slide thuyết trình kiến trúc hệ thống và Tài liệu Hướng Dẫn Sử Dụng (User Manual).

---

## 📊 4. Ma Trận Trách Nhiệm Chi Tiết (RACI Matrix)

*Ghi chú: **R** (Responsible - Người trực tiếp làm), **A** (Accountable - Người chịu trách nhiệm chính), **C** (Consulted - Người được tham vấn/hỗ trợ), **I** (Informed - Người nhận thông báo/kết quả)*

| Hạng Mục Nhiệm Vụ | TV1 (Linh)<br>Queue & Review Lead | TV2 (Vy)<br>Git Lead | TV3 (Nghĩa)<br>Data/Scoring | TV4 (Việt Anh)<br>Grading UI | TV5 (Mai)<br>Git UI & QA |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **BullMQ Worker & Mock Dispatcher** | **R / A** | I | C | I | I |
| **Priority Queue & Concurrency Slider** | **R / A** | I | C | R *(UI)* | I |
| **Exponential Backoff & DLQ Replay** | **R / A** | I | C | R *(UI)* | C *(Test)* |
| **Backend Giảng Viên Duyệt Điểm (`UC-04b`)** | **R / A** | I | C | I | C |
| **UI Giảng Viên Duyệt Điểm (`UC-04b`)** | **R / A** | I | I | C | C *(Test)* |
| **Bare Clone Sandbox & AES-256 PAT** | I | **R / A** | C | I | R *(UI)* |
| **Commit Parser & Heuristics Detection** | I | **R / A** | C | I | R *(UI)* |
| **Prisma Schema 12 Bảng & Seed Data** | C | C | **R / A** | I | I |
| **Author Matching & Điểm 40/40/20** | I | C | **R / A** | I | R *(UI)* |
| **Quản trị System Settings API** | C | I | **R / A** | R *(UI)* | I |
| **UI Giám Sát Hàng Đợi (Telemetry 2s)** | C | I | I | **R / A** | I |
| **UI Báo Cáo Đóng Góp & Cờ Free-Rider** | I | C | C | I | **R / A** |
| **Bộ Unit Test Coverage >= 80%** | C | C | C | C | **R / A** |
| **Kịch Bản Demo & Slide Thuyết Trình** | C | C | C | C | **R / A** |

---

## 🗓️ 5. Lộ Trình Triển Khai Chi Tiết (Tuần 3 Đến Tuần 10)

```mermaid
gantt
    title Kế Hoạch 10 Tuần Nhóm 2 SWP391 - Phân Hệ 5
    dateFormat  YYYY-MM-DD
    section Milestone 2 (Tuần 3 - 5: 20%)
    TV1: BullMQ Core, Priority, Retry, DLQ & Luồng Duyệt Điểm AI :done, 2026-09-25, 10d
    TV2: Bare Clone Sandbox, AES-256 PAT, Noise Filter       :done, 2026-09-25, 8d
    TV3: Schema 12 bảng, Migration DB, Seed data mẫu         :active, 2026-10-03, 7d
    TV4: UI Submissions List, Batch Modal, Queue Dashboard   :active, 2026-10-03, 7d
    TV5: UI Git Submission, Stepper 4 bước, Chuẩn bị test    :active, 2026-10-03, 7d
    section Milestone 3 (Tuần 6 - 8: 25%)
    TV3: Thuật toán Matching, Tính điểm 40/40/20, Free-Rider :2026-10-10, 10d
    TV4: Hoàn thiện DLQ UI, Dynamic Concurrency Modal        :2026-10-10, 10d
    TV5: UI Báo cáo nhóm, Flagged Commits, Unit Test >=80%   :2026-10-10, 10d
    Cả nhóm: Chạy thử nghiệm liên thông toàn hệ thống        :2026-10-20, 5d
    section Final Defense (Tuần 9 - 10: 40%)
    TV1 & TV3: Stress testing k6 100 requests & Cache <100ms :2026-10-25, 5d
    TV4 & TV5: Tinh chỉnh responsive UX, Hoàn thiện tài liệu :2026-10-25, 5d
    TV5 & Cả nhóm: Tập dượt 3 kịch bản Demo trước Hội đồng  :2026-10-30, 6d
```

---

## ✅ 6. Bảng Tiêu Chí Nghiệm Thu Đồ Án (P2P Checklist Cho Cả Nhóm)

Trước khi nộp bài hoặc bước vào các buổi đánh giá chéo giữa các nhóm, cả 5 bạn cần kiểm tra lần lượt các tiêu chí sau:

- [ ] **1. Chuẩn Hóa Mã Nguồn:** Chạy lệnh `npm run build` tại thư mục gốc thành công 100%, không còn bất kỳ cảnh báo hoặc lỗi TypeScript nào.
- [ ] **2. Cơ Sở Dữ Liệu:** Đủ 12 bảng trong `packages/database/prisma/schema.prisma`, lệnh `npm run db:seed` nạp dữ liệu mẫu không phát sinh lỗi.
- [ ] **3. Phân Hệ Hàng Đợi (Queue):**
  - Tạo đợt chấm bài gán đúng độ ưu tiên `Exam (100) > Assignment (50) > Practice (10)`.
  - Giới hạn tối đa 3 đợt chấm đồng thời trên mỗi lớp hoạt động chính xác (`BR-02`).
  - Khi gặp lỗi giả lập, hệ thống tự động retry 3 lần sau 2s, 4s, 8s trước khi đưa vào DLQ.
  - Tính năng Replay DLQ reset số lần retry về 0 và đẩy job quay lại trạng thái chờ.
  - Thanh trượt điều chỉnh Concurrency hoạt động tức thì từ 1 đến 10 worker.
- [ ] **4. Nghiệp Vụ Giảng Viên Duyệt Điểm AI (`UC-04b`):**
  - Bài nộp sau khi AI chấm xong ở trạng thái `Pending Review`.
  - Giảng viên xem được đầy đủ chi tiết điểm số, test cases và nhật ký thực thi.
  - Nút bấm `Approve` và `Reject` hoạt động mượt mà, lưu đúng nhận xét và người duyệt vào cơ sở dữ liệu.
- [ ] **5. Phân Tích Kho Git & Bắt Gian Lận:**
  - Token GitHub PAT được mã hóa AES-256 an toàn trong cơ sở dữ liệu.
  - Quá trình Bare Clone diễn ra trong thư mục tạm và tự động dọn sạch 100%.
  - Bộ lọc loại trừ thành công các file rác sinh tự động (`node_modules/`, lock files...).
  - Quét ra cờ cảnh báo `isSuspicious = true` đối với các commit chỉ sửa khoảng trắng hoặc tự revert.
  - Công thức tính điểm $40/40/20$ tính toán chuẩn xác và kích hoạt cờ đỏ đối với sinh viên Free-Rider dưới ngưỡng.
- [ ] **6. Chất Lượng Kiểm Thử & Demo:**
  - Bộ Unit Test tự động (Vitest) chạy thành công với độ bao phủ đạt trên 80%.
  - Chuẩn bị sẵn tài khoản, dữ liệu và thiết bị để trình diễn mượt mà 3 kịch bản demo trước Hội đồng.
