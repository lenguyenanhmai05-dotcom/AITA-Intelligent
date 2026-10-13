# Bảng Phân Công Nhiệm Vụ 5 Thành Viên & Kế Hoạch Hành Động Chi Tiết
> **Dự án:** AITA-INTELLIGENT (Hệ thống Hỗ trợ Giảng dạy & Đánh giá Dự án Phần mềm Thông minh)  
> **Phân hệ 5 (Subsystem 5):** Redis Queue (BullMQ) & Git Teamwork Analytics Platform  
> **Môn học:** SWP391 - Software Project (FPT University)  
> **Phiên bản:** Cập nhật đồng bộ thực tế mã nguồn & Tích hợp quy trình Giảng viên duyệt điểm AI (Human-in-the-Loop)

---

## 👥 Danh Sách 5 Thành Viên Nhóm 2 (SWP391)

| STT | Mã Sinh Viên | Họ và Tên | Vai Trò Kỹ Thuật Chính | Trọng Tâm Trách Nhiệm |
| :---: | :---: | :--- | :--- | :--- |
| **1** | **QE180043** | **Nguyễn Châu Khánh Linh** | **Queue & Concurrency Lead** | Backend Worker, BullMQ Core, Exponential Backoff, DLQ & Telemetry |
| **2** | **QE180099** | **Nguyễn Tường Vy** | **Git Engine & Heuristics Lead** | Git CLI Pipeline, Ephemeral Bare Clone, AES-256 PAT, Bắt gian lận commit |
| **3** | **QE190078** | **Đào Minh Nghĩa** | **Data Architect & Scoring Lead** | Prisma ORM 12 bảng, Thuật toán Multi-Email, Công thức 40/40/20 & Backend Duyệt điểm AI |
| **4** | **QE190127** | **Ngô Sử Việt Anh** | **Frontend Lead (Batch & Queue)** | Web React: Quản lý bài nộp, Giám sát hàng đợi realtime, DLQ & UI Giảng viên duyệt điểm AI |
| **5** | **QE190151** | **Lê Nguyễn Anh Mai** | **Frontend Lead (Git UI) & QA Lead** | Web React: Git Analytics UI, Báo cáo Free-Rider, Bộ Unit Test >= 80%, Kịch bản Demo & Slide |

---

## 🔍 1. Đánh Giá Hiện Trạng Thực Tế & Rà Soát Ranh Giới Nhiệm Vụ

Trong quá trình triển khai mã nguồn ban đầu:
- **Thành viên 1** và **Thành viên 2** đã hoàn thành xuất sắc các module nền tảng kỹ thuật backend nặng nhất (BullMQ Worker, Mock Dispatcher, Git CLI Bare Clone, Heuristics detection).
- Do tính chất tích hợp liên thông, Thành viên 1 & 2 đã chủ động viết trước khung Controller và Route ban đầu (`gradingController.ts`, `gitController.ts`).
- Vì vậy, kế hoạch hành động dưới đây **tái cơ cấu và tối ưu hóa nhiệm vụ cho 3 Thành viên còn lại (Thành viên 3, 4, 5)**:
  1. Loại bỏ các đầu việc bị trùng lặp.
  2. Bổ sung trọn vẹn nghiệp vụ **"Giảng viên phê duyệt sau khi AI chấm xong" (Human-in-the-Loop AI Grading Review)** xuyên suốt từ Database -> API -> UI -> Testing.
  3. Phân chia khối lượng công việc cân bằng, chuẩn chỉ theo đúng tiêu chí đánh giá khắt khe của môn SWP391.

---

## 🌟 2. Đặc Tả Nghiệp Vụ Mới: Giảng Viên Duyệt Điểm Sau Khi AI Chấm (Human-in-the-Loop AI Review)

Hệ thống AI/Worker thực hiện chấm tự động (chạy test cases, đo thời gian thực thi). Tuy nhiên, kết quả của AI không được tự ý công bố ngay cho sinh viên mà bắt buộc phải qua khâu thẩm định của Giảng viên phụ trách lớp.

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
                                   - Chốt điểm chính thức  - Trả về chấm lại /
                                   - Lưu nhận xét          - Gửi feedback cho SV
```

### Các Quy Tắc Nghiệp Vụ Cốt Lõi (Business Rules):
- **`BR-14` (AI Review Eligibility):** Chỉ những bài nộp có trạng thái chấm `status = 'completed'` mới được phép mở tính năng thẩm định cho giảng viên.
- **`BR-15` (Review Decision Domain):** Quyết định duyệt chỉ nhận một trong hai giá trị hợp lệ: `'approved'` (Chấp thuận) hoặc `'rejected'` (Từ chối). Bắt buộc lưu kèm lý do/nhận xét (`reviewComment`).
- **`BR-16` (Lecturer Ownership & Authorization):** Chỉ Giảng viên được phân công phụ trách lớp học tương ứng mới có quyền duyệt điểm cho bài nộp của lớp đó (Role: `lecturer` và sở hữu `classId`).

### Phân Bổ Trách Nhiệm Tính Năng Này Giữa 3 Thành Viên:
- **Thành viên 3 (Backend & Database):** Bổ sung trường dữ liệu vào Prisma Schema, chạy migration, viết API endpoint `POST /api/grading/jobs/:id/review` và kiểm soát chặt các ràng buộc `BR-14`, `BR-15`, `BR-16`.
- **Thành viên 4 (Frontend UI/UX):** Xây dựng bảng điều khiển duyệt điểm trên `Job Details Modal`: hiển thị kết quả AI chấm, bộ nút bấm Approve / Reject, form nhập ý kiến nhận xét của Giảng viên, cập nhật tức thì badge trạng thái.
- **Thành viên 5 (QA & Demo):** Viết kịch bản kiểm thử API/UI cho tính năng duyệt điểm, phân vai kịch bản demo trực tiếp trước Hội đồng chấm thi.

---

## 📋 3. Chi Tiết Kế Hoạch Hành Động Cho Từng Thành Viên

---

### 👤 THÀNH VIÊN 1: Queue & Concurrency Engineer
*(Đã hoàn thành phần lớn khối lượng Milestone 2 & Tiếp tục tối ưu hóa tải)*

- **Trách nhiệm chính:** Quản trị hàng đợi BullMQ, Worker Daemon, cơ chế chịu lỗi và giám sát hiệu năng.
- **Danh sách nhiệm vụ đã bàn giao:**
  - [x] Cấu hình BullMQ Queue `grading-queue` kết nối Redis với cơ chế fallback in-memory an toàn.
  - [x] Lập trình gán độ ưu tiên: `Exam (100) > Assignment (50) > Practice (10)` (`BR-01`).
  - [x] Lập trình kiểm soát giới hạn tối đa 3 đợt chấm đồng thời trên mỗi lớp (`BR-02`).
  - [x] Lập trình Mock Execution Dispatcher giả lập thời gian chạy và kết quả test cases.
  - [x] Lập trình cơ chế Exponential Backoff tự động retry 3 lần với thời gian chờ 2s, 4s, 8s (`BR-04`, `BR-05`).
  - [x] Lập trình Dead-Letter Queue (DLQ) lưu trữ `status = 'dead'`, mã lỗi và stack trace.
  - [x] Lập trình API `GET /api/grading/telemetry` phục vụ polling nhịp tim 2 giây (`BR-03`).
  - [x] Lập trình Dynamic Worker Concurrency cho phép đổi số worker chạy song song từ 1 đến 10 (`BR-07`).
- **Kế hoạch giai đoạn tới (Milestone 3 & Final Defense):**
  - **Stress Testing với k6:** Viết kịch bản nạp tải 100 requests đồng thời vào hàng đợi Redis để đo đạc độ trễ và thông lượng.
  - Tối ưu hóa cấu hình hàng đợi BullMQ (`lockDuration`, `stalledInterval`) đảm bảo hệ thống không bao giờ bị nghẽn trong các bài test đánh giá chéo (P2P Testing).

---

### 👤 THÀNH VIÊN 2: Git Engine & Heuristics Lead
*(Đã hoàn thành phần lớn khối lượng Milestone 2 & Tiếp tục hoàn thiện phân tích)*

- **Trách nhiệm chính:** Pipeline xử lý kho Git an toàn, bộ lọc nhiễu và thuật toán phát hiện gian lận commit.
- **Danh sách nhiệm vụ đã bàn giao:**
  - [x] Mã hóa mật khẩu/token GitHub PAT bằng thuật toán **AES-256-CBC** trước khi lưu trữ (`BR-08`).
  - [x] Kiểm tra ràng buộc mỗi nhóm chỉ có tối đa 1 phân tích repo đang chạy (`BR-09`).
  - [x] Thiết lập dịch vụ `EphemeralBareCloner`: clone bare vào thư mục tạm `scratch/clones/` và tự động dọn sạch sau khi xử lý xong (`UC-07`).
  - [x] Tích hợp Git CLI trích xuất commit hashes, tác giả, ngày giờ, số dòng thêm/xóa (`UC-08`).
  - [x] Viết bộ lọc loại bỏ toàn bộ file sinh tự động (`node_modules`, `dist`, `package-lock.json`...) để bảo toàn LOC sạch (`BR-13`).
  - [x] Xây dựng thuật toán bắt gian lận commit **Whitespace-only** (sửa khoảng trắng để farm LOC) (`BR-10`).
  - [x] Xây dựng thuật toán bắt gian lận commit **Self-revert** (tác giả tự hủy commit của chính mình) (`BR-10`).
  - [x] Kết nối GitHub REST API đếm chính xác số lượng Pull Requests của từng thành viên (`UC-09`).
- **Kế hoạch giai đoạn tới (Milestone 3 & Final Defense):**
  - Chuẩn bị 1 repository Git mẫu đặc biệt chứa đầy đủ các chiêu trò gian lận (whitespace farming, self-revert) phục vụ buổi demo trực tiếp trước Hội đồng.
  - Tối ưu hóa thời gian thực thi lệnh Git CLI đối với các repository có lịch sử commit lớn.

---

### 👤 THÀNH VIÊN 3: Data Architect & Scoring Engine (Kế hoạch hành động cụ thể)

- **Vai trò:** Quản trị cấu trúc dữ liệu, thuật toán ánh xạ sinh viên, công thức tính điểm đóng góp và Backend cho nghiệp vụ Giảng viên duyệt điểm.
- **Kế hoạch công việc chi tiết:**

#### Task 3.1: Quản trị Cơ sở Dữ liệu Prisma ORM (12 Bảng Chuẩn Hóa 3NF)
- Quản trị file `packages/database/prisma/schema.prisma` đảm bảo toàn vẹn quan hệ khóa ngoại (Foreign Keys), Index và Unique constraints.
- Đảm bảo 12 bảng đáp ứng chuẩn hóa 3NF:
  1. `users`: Thông tin người dùng cốt lõi.
  2. `user_git_emails`: Chuẩn hóa 1NF cho mảng email tác giả Git.
  3. `classes`: Lớp học do giảng viên quản lý.
  4. `teams`: Nhóm dự án của sinh viên trong lớp.
  5. `team_members`: Bảng liên kết nhiều-nhiều (N-N) giữa Users và Teams.
  6. `submissions`: Bài nộp của sinh viên.
  7. `grading_batches`: Đợt chấm bài theo lớp.
  8. `grading_jobs`: Tác vụ chấm trong hàng đợi BullMQ.
  9. `git_repos`: Kho Git được nộp để phân tích.
  10. `git_commits`: Chi tiết từng commit bóc tách từ kho Git.
  11. `member_contributions`: Điểm số đóng góp và cờ cảnh báo Free-Rider.
  12. `system_settings`: Cấu hình hệ thống toàn cục.
- Viết file `seed.ts` hoàn chỉnh: Khởi tạo sẵn tài khoản Giảng viên, Sinh viên, Lớp học, Nhóm, Bài nộp mẫu phục vụ việc chạy thử nghiệm mượt mà.

#### Task 3.2: Triển Khai Backend Tính Năng Giảng Viên Duyệt Điểm AI (`UC-04b`)
- Cập nhật bảng `grading_jobs` trong `schema.prisma`:
  - Thêm cột `reviewStatus`: Kiểu String, mặc định `'pending'` (`'pending'` | `'approved'` | `'rejected'`).
  - Thêm cột `reviewedBy`: Khóa ngoại liên kết tới `users.id` (Giảng viên thực hiện duyệt).
  - Thêm cột `reviewedAt`: Thời điểm giảng viên phê duyệt.
  - Thêm cột `reviewComment`: Nhận xét hoặc lý do từ chối của giảng viên.
- Xây dựng API `POST /api/grading/jobs/:id/review`:
  - Kiểm tra điều kiện `BR-14`: Job phải có `status === 'completed'`. Nếu chưa hoàn thành chấm, trả về mã lỗi HTTP 400 `BR_14_JOB_NOT_COMPLETED`.
  - Kiểm tra điều kiện `BR-15`: Quyết định gửi lên phải là `'approved'` hoặc `'rejected'`. Nếu sai, trả về HTTP 400 `BR_15_INVALID_STATUS`.
  - Kiểm tra điều kiện `BR-16`: Xác thực người thực hiện có quyền Giảng viên của lớp chứa bài nộp.
  - Cập nhật cơ sở dữ liệu và trả về kết quả thẩm định mới nhất cho giao diện.

#### Task 3.3: Thuật Toán Ánh Xạ Tác Giả Git Đa Email (Author Matching Engine)
- Sinh viên FPT thường commit bằng email cá nhân (`@gmail.com`) trong khi tài khoản trường là `@fpt.edu.vn`.
- Lập trình module ánh xạ tự động:
  - Quét email tác giả trong commit đối chiếu với bảng `user_git_emails`.
  - Đối chiếu `githubUsername` với tài khoản GitHub đã đăng ký.
  - Gán chính xác `userId` vào bảng `git_commits`, đảm bảo không bỏ sót bất kỳ đóng góp nào của sinh viên.

#### Task 3.4: Bộ Tính Điểm Đóng Góp 40/40/20 & Tự Động Bắt Free-Rider
- Áp dụng công thức tính tỷ lệ đóng góp chuẩn xác theo `BR-11`:
  $$\text{contributionPercentage} = 40\% \times \text{locShare} + 40\% \times \text{commitShare} + 20\% \times \text{prShare}$$
- Xử lý triệt để ngoại lệ chia cho 0 nếu cả nhóm chưa có hoạt động nào (`13.1.E1`).
- Đọc ngưỡng cấu hình từ `system_settings` (mặc định 5%, dải 1% - 20% theo `BR-12`).
- Tự động gắn cờ `isFreeRiding = true` vào bảng `member_contributions` nếu sinh viên đạt tỷ lệ dưới ngưỡng.

#### Task 3.5: Quản Trị Cài Đặt Hệ Thống & Tối Ưu Hiệu Năng
- Cung cấp API đọc/ghi cài đặt hệ thống: `GET /api/system/settings` và `PATCH /api/system/settings`.
- Đánh Index trên các cột truy vấn thường xuyên: `grading_jobs(batchId, status)` và `git_commits(repoId, authorEmail)`.
- Cấu hình Redis Cache cho các dữ liệu thống kê, đảm bảo thời gian phản hồi API dưới 100ms.

---

### 👤 THÀNH VIÊN 4: Frontend Engineer - Batch Grading, Queue & Review UI (Kế hoạch hành động cụ thể)

- **Vai trò:** Xây dựng toàn bộ giao diện quản trị chấm bài hàng loạt, giám sát hàng đợi thời gian thực và Giao diện Giảng viên duyệt điểm AI.
- **Kế hoạch công việc chi tiết:**

#### Task 4.1: Màn Hình Quản Lý Bài Nộp (`Submissions List`)
- Bảng danh sách bài nộp có phân trang, hỗ trợ bộ lọc:
  - Lọc theo Lớp học (`Class`).
  - Lọc theo Trạng thái chấm (`Not graded`, `Completed`, `Failed`).
  - Ô tìm kiếm theo tên sinh viên hoặc tiêu đề bài tập.
- Checkbox chọn từng dòng hoặc chọn tất cả các bài nộp.
- Nút bấm hành động nổi bật: "Bắt đầu chấm đợt bài đã chọn" (Start Grading).

#### Task 4.2: Modal Cấu Hình Đợt Chấm (`Batch Config Modal`)
- Form nhập:
  - Tên đợt chấm (`batchName`).
  - Chọn độ ưu tiên: `Exam (Cao nhất)`, `Assignment (Trung bình)`, `Practice (Thấp)`.
  - Hiển thị số lượng bài nộp đã chọn.
- Kiểm tra ràng buộc `BR-02` (tối đa 3 đợt chấm đang chạy đồng thời trên mỗi lớp). Hiển thị cảnh báo trực quan nếu vượt ngưỡng.
- Tự động điều hướng sang màn hình Dashboard Giám sát sau khi bấm tạo thành công.

#### Task 4.3: Dashboard Giám Sát Hàng Đợi Thời Gian Thực (`Queue Monitor Dashboard`)
- Bộ 4 thẻ chỉ số tổng quan (Metric Cards) hiển thị sinh động:
  - `Waiting` (Chờ xử lý - Vàng)
  - `Active` (Đang chấm - Xanh dương)
  - `Completed` (Đã hoàn thành - Xanh lá)
  - `Failed` (Lỗi / Thất bại - Đỏ)
- Cơ chế **Auto-refresh mỗi 2 giây** gọi API Telemetry (`BR-03`) với hiệu ứng nhịp tim Live Heartbeat.
- Bảng danh sách Jobs chi tiết: Hiển thị ID bài nộp, tên sinh viên, độ ưu tiên, trạng thái, số lần thử lại (`retryCount`).

#### Task 4.4: Modal Chi Tiết Job & Giao Diện Giảng Viên Duyệt Điểm AI (`UC-04b`)
- Hiển thị thông số kỹ thuật của Job:
  - Thời gian thực thi `runtimeDurationMs`.
  - Số lần thử lại (1/3, 2/3, 3/3).
  - Phân loại lỗi và khung hiển thị crash stack trace (nếu bị lỗi).
- **Khu Vực Giảng Viên Duyệt Điểm (Human-in-the-Loop Review Panel):**
  - Hiển thị Badge trạng thái duyệt hiện tại:
    - `Pending Review` (Chờ duyệt - Huy hiệu màu cam/vàng).
    - `Approved` (Đã duyệt - Huy hiệu màu xanh lá).
    - `Rejected` (Từ chối - Huy hiệu màu đỏ).
  - Khung xem kết quả AI chấm (Điểm dự kiến, tóm tắt test cases passed).
  - Khung nhập nhận xét của Giảng viên (`Lecturer Review Comment / Feedback`).
  - Hai nút hành động:
    - Nút **"Phê Duyệt (Approve)"**: Xác nhận kết quả chấm của AI, chuyển trạng thái sang `approved`.
    - Nút **"Từ Chối (Reject)"**: Bác bỏ kết quả chấm, chuyển trạng thái sang `rejected`, yêu cầu chấm lại.
  - Vô hiệu hóa nút bấm nếu Job chưa hoàn thành (`status !== 'completed'`) theo đúng quy tắc `BR-14`.

#### Task 4.5: Màn Hình Quản Lý Hàng Đợi Chết (`Dead-Letter Queue - DLQ`)
- Bảng danh sách các job bị dừng vĩnh viễn (`status = 'dead'`).
- Xem chi tiết nguyên nhân lỗi dẫn tới việc đưa vào DLQ.
- Nút **"Manual Retry"**: Mở modal cho phép chọn lại độ ưu tiên và reset số lần thử lại về 0 theo `BR-06`.
- Nút **"Dismiss Job"**: Xác nhận đóng và loại bỏ job lỗi khỏi danh sách chờ xử lý.

#### Task 4.6: Modal Cài Đặt Concurrency Worker Cho Quản Trị Viên
- Màn hình/Modal cho phép Admin điều chỉnh số lượng worker chạy song song (thanh trượt từ 1 đến 10 worker).
- Tích hợp gọi API cập nhật tức thì vào runtime của hệ thống (`BR-07`).

---

### 👤 THÀNH VIÊN 5: Frontend Engineer - Git UI & QA/Testing Lead (Kế hoạch hành động cụ thể)

- **Vai trò:** Xây dựng toàn bộ giao diện phân tích kho Git, hiển thị biểu đồ đóng góp nhóm, chủ trì kiểm thử hệ thống (Unit Test & API Test) và đạo diễn buổi demo trước Hội đồng.
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
- **Member Details Modal:**
  - Biểu đồ cột thể hiện tần suất commit theo từng ngày trong suốt thời gian làm bài.
  - Bảng chi tiết từng commit: Mã hash, ngày giờ, số dòng thêm/xóa.
- **Flagged Commits Modal (Bắt gian lận commit):**
  - Danh sách các commit bị hệ thống phát hiện hành vi bất thường.
  - Hiển thị rõ lý do: `Whitespace-only` (chỉ sửa dấu cách/format mã nguồn) hoặc `Self-revert` (tự đảo ngược commit của chính mình).
- **Free-Riding Threshold Modal:**
  - Giao diện dành riêng cho Admin điều chỉnh ngưỡng phát hiện thành viên lười biếng (từ 1% đến 20%, mặc định 5%).

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

| Hạng Mục Nhiệm Vụ | TV1 (Linh)<br>Queue Lead | TV2 (Vy)<br>Git Lead | TV3 (Nghĩa)<br>Data/Scoring | TV4 (Việt Anh)<br>Grading UI | TV5 (Mai)<br>Git UI & QA |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **BullMQ Worker & Mock Dispatcher** | **R / A** | I | C | I | I |
| **Priority Queue & Concurrency Slider** | **R / A** | I | C | R *(UI)* | I |
| **Exponential Backoff & DLQ Replay** | **R / A** | I | C | R *(UI)* | C *(Test)* |
| **Bare Clone Sandbox & AES-256 PAT** | I | **R / A** | C | I | R *(UI)* |
| **Commit Parser & Heuristics Detection** | I | **R / A** | C | I | R *(UI)* |
| **Prisma Schema 12 Bảng & Seed Data** | C | C | **R / A** | I | I |
| **Author Matching & Điểm 40/40/20** | I | C | **R / A** | I | R *(UI)* |
| **Backend Giảng Viên Duyệt Điểm (`UC-04b`)** | I | I | **R / A** | C | C |
| **Giao Diện Giảng Viên Duyệt Điểm (`UC-04b`)** | I | I | C | **R / A** | C *(Test)* |
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
    TV1: BullMQ Core, Priority, Retry & DLQ Backend       :done, 2026-09-25, 8d
    TV2: Bare Clone Sandbox, AES-256 PAT, Noise Filter     :done, 2026-09-25, 8d
    TV3: Schema 12 bảng, Migration, API Review Backend     :active, 2026-10-03, 7d
    TV4: UI Submissions List, Batch Modal, Review UI       :active, 2026-10-03, 7d
    TV5: UI Git Submission, Stepper 4 bước, Kịch bản test :active, 2026-10-03, 7d
    section Milestone 3 (Tuần 6 - 8: 25%)
    TV3: Thuật toán Matching, Tính điểm 40/40/20, Free-Rider :2026-10-10, 10d
    TV4: Hoàn thiện DLQ UI, Dynamic Concurrency Modal       :2026-10-10, 10d
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
