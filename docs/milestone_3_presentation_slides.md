# 📊 BỘ KHUNG SLIDE THUYẾT TRÌNH BẢO VỆ MILESTONE 3 (SWP391)

> **Dự án:** AITA-INTELLIGENT (Hệ thống Hỗ trợ Giảng dạy & Đánh giá Dự án Phần mềm Thông minh)  
> **Phân hệ 5 (Subsystem 5):** Redis Queue & Git Teamwork Analytics Platform  
> **Môn học:** SWP391 - Software Project (FPT University)  
> **Nhóm thực hiện:** Nhóm 2 - Lớp SE1801  
> **Người biên soạn:** Nguyễn Châu Khánh Linh (QA Lead & Frontend Lead)  

---

## 📑 CẤU TRÚC BÀI BÁO CÁO (15 SLIDES CHUẨN MỰC)

---

### SLIDE 1: TRANG TIÊU ĐỀ & ĐỘI NGŨ PHÁT TRIỂN
* **Tiêu đề lớn:** AITA-INTELLIGENT: Phân Hệ Hàng Đợi Chấm Bài Tự Động & Phân Tích Đóng Góp Git Thông Minh
* **Phân hệ:** Subsystem 5 (Redis BullMQ Queue & Git Teamwork Analytics)
* **Giảng viên hướng dẫn:** Thầy/Cô bộ môn Software Engineering (FPT University)
* **Đội ngũ 5 thành viên Nhóm 2:**
  1. **Lê Nguyễn Anh Mai (QE190151):** Queue, Concurrency & Review Lead (BullMQ Core, DLQ, Telemetry, Duyệt điểm AI).
  2. **Nguyễn Tường Vy (QE180099):** Git Engine & Heuristics Lead (Bare Clone Sandbox, AES-256 PAT, Bắt gian lận commit).
  3. **Đào Minh Nghĩa (QE190078):** Data Architect & Scoring Lead (Prisma ORM 12 bảng, Thuật toán Multi-Email, Điểm 40/40/20).
  4. **Ngô Sử Việt Anh (QE190127):** Frontend Lead - Batch & Queue UI (Màn hình chấm bài, Telemetry 2s, DLQ Replay, Concurrency).
  5. **Nguyễn Châu Khánh Linh (QE180043):** Frontend Lead - Git UI & QA Lead (Git Analytics UI, Báo cáo Free-Rider, 55 Unit Tests 100%).

---

### SLIDE 2: BÀI TOÁN THỰC TẾ & MỤC TIÊU CỦA ĐỀ TÀI
* **Thực trạng tại FPT University:**
  * Giảng viên mất hàng tuần chấm thủ công hàng trăm bài tập lập trình; máy chủ thường xuyên bị nghẽn (concurrency bottleneck) khi cả lớp nộp bài cùng lúc.
  * Hiện tượng sinh viên "lười biếng / ỷ lại" (Free-riding) trong các môn làm nhóm (SWP391, PRN231, EXE101) mà không có công cụ đo lường khách quan.
  * Sinh viên gian lận chỉ sửa khoảng trắng (*whitespace farming*) hoặc tự hủy commit (*self-revert*) để tăng ảo chỉ số Lines of Code (LOC).
* **Mục tiêu giải pháp của Phân hệ 5:**
  * Xây dựng hàng đợi chấm bài phân tán chịu tải cao bằng **BullMQ & Redis**, điều phối worker động từ 1 đến 10.
  * Bóc tách toàn diện lịch sử Git bằng CLI, lọc sạch file rác sinh tự động, quét gian lận và tính toán chỉ số đóng góp thực tế $40/40/20$.

---

### SLIDE 3: KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)
* **Sơ đồ khối 4 tầng (Layered Architecture):**
  * **Presentation Layer (Web React / Vite):** Giao diện phân quyền 3 vai trò (Admin, Giảng viên, Sinh viên), thiết kế theo phong cách Luxury Terracotta Porcelain & Glassmorphism.
  * **Application & API Layer (Node.js / Express / TypeScript):** RESTful APIs kiểm soát 16 Business Rules (`BR-01` $\to$ `BR-16`).
  * **Distributed Processing Layer (BullMQ & Worker Daemon):** Quản lý hàng đợi ưu tiên, Retry Backoff $2^n$ giây, Dead-Letter Queue và Mock Dispatcher.
  * **Data & Sandbox Layer (PostgreSQL + Prisma ORM + Ephemeral Git Sandbox):** 12 bảng chuẩn hóa 3NF, thư mục clone cách ly tự dọn sạch 100%, mã hóa AES-256-CBC.

---

### SLIDE 4: PHÂN HỆ HÀNG ĐỢI CHẤM BÀI PHÂN TÁN (BULLMQ QUEUE)
* **Độ ưu tiên hàng đợi theo `BR-01`:**
  * $\text{Exam (100)} > \text{Assignment (50)} > \text{Practice (10)}$.
  * Bài thi luôn được đưa lên đầu hàng đợi và gán worker xử lý trước.
* **Kiểm soát giới hạn đợt chấm đồng thời theo `BR-02`:**
  * Mỗi lớp chỉ được phép có tối đa **3 đợt chấm đồng thời** (`waiting` hoặc `active`). Chặn đứng đợt thứ 4 bằng mã lỗi `BR_02_LIMIT_EXCEEDED`.
* **Giám sát nhịp tim thời gian thực theo `BR-03`:**
  * Endpoint `GET /api/grading/telemetry` cung cấp dữ liệu chu kỳ **2000ms**, hiển thị huy hiệu `🟢 Live sync 2s`.
* **Điều chỉnh số lượng Worker lúc runtime theo `BR-07`:**
  * Cho phép Admin tăng/giảm từ **1 đến 10 Worker** chạy song song mà không cần khởi động lại máy chủ.

---

### SLIDE 5: CƠ CHẾ CHỊU LỖI EXPONENTIAL BACKOFF & DEAD-LETTER QUEUE
* **Cơ chế Retry hàm mũ theo `BR-04` & `BR-05`:**
  * Khi chấm bài gặp sự cố (timeout, runtime crash), worker tự động thử lại tối đa **3 lần** với thời gian chờ giãn cách:
    $$\text{Delay} = 2^{\text{retryCount}} \text{ (giây)} \implies \text{Lần 1: } 2\text{s} \to \text{Lần 2: } 4\text{s} \to \text{Lần 3: } 8\text{s}$$
* **Hàng đợi chết (Dead-Letter Queue - DLQ) theo `BR-06`:**
  * Sau 3 lần thử lại thất bại, tác vụ tự động chuyển `status = 'dead'`, lưu mã phân loại lỗi và toàn bộ `Crash Stack Trace`.
  * **Manual Replay:** Nút bấm cho phép Giảng viên kiểm tra lỗi, reset `retryCount = 0`, tùy chọn nâng mức ưu tiên và đưa job quay lại hàng đợi chính.

---

### SLIDE 6: NGHIỆP VỤ GIẢNG VIÊN DUYỆT ĐIỂM AI (HUMAN-IN-THE-LOOP - UC-04b)
* **Triết lý thiết kế:** AI chỉ đóng vai trò trợ lý chấm tự động (tính điểm ban đầu, đếm số test cases). Điểm số chính thức bắt buộc phải có sự thẩm định và xác nhận của Giảng viên phụ trách.
* **3 Quy tắc nghiệp vụ cốt lõi:**
  * `BR-14`: Chỉ bài nộp có trạng thái `completed` mới được mở luồng thẩm định.
  * `BR-15`: Quyết định phê duyệt chỉ nhận 2 giá trị `'approved'` hoặc `'rejected'`, bắt buộc lưu kèm nhận xét (`reviewComment`).
  * `BR-16`: Xác thực bảo mật phân quyền, chỉ Giảng viên phụ trách lớp mới có quyền duyệt điểm.

---

### SLIDE 7: PHÂN TÍCH KHO GIT AN TOÀN (EPHEMERAL BARE CLONE SANDBOX)
* **Bảo vệ Token PAT theo `BR-08`:**
  * GitHub Personal Access Token được mã hóa bằng thuật toán **AES-256-CBC** với IV ngẫu nhiên 16 bytes trước khi ghi vào Database.
* **Môi trường Bare Clone cách ly theo `UC-07`:**
  * Hệ thống clone dưới cờ `--bare` vào thư mục tạm `scratch/clones/jobId/` để chỉ đọc metadata, **không lưu mã nguồn sinh viên trên server**.
  * Tự động xóa sạch 100% thư mục sandbox ngay sau khi phân tích xong hoặc gặp lỗi.
* **Kiểm tra ràng buộc theo `BR-09`:** Mỗi nhóm sinh viên chỉ có tối đa 1 phân tích repo đang chạy.

---

### SLIDE 8: BỘ LỌC FILE RÁC & THUẬT TOÁN BẮT GIAN LẬN COMMIT
* **Bộ lọc rác tự động theo `BR-13` (`isNoisePath`):**
  * Tự động loại trừ các thư viện và file sinh tự động: `node_modules/`, `dist/`, `build/`, `package-lock.json`, `yarn.lock`, file nhị phân (`.png`, `.exe`, `.jar`).
  * Bảo toàn chỉ số Net LOC phản ánh chính xác dòng code do sinh viên tự tay viết.
* **Thuật toán Heuristics phát hiện gian lận theo `BR-10`:**
  * **Whitespace-only farming:** Regex phát hiện commit chỉ thêm dấu cách, dấu tab hoặc xuống dòng để "cày" số dòng code.
  * **Self-revert manipulation:** Phát hiện commit tự hủy nội dung của commit trước đó do cùng một tác giả thực hiện.
  * Tự động gắn cờ cảnh báo `isSuspicious = true`.

---

### SLIDE 9: BỘ TÍNH ĐIỂM ĐÓNG GÓP 40/40/20 & BẮT CỜ FREE-RIDER
* **Công thức chuẩn hóa đóng góp công bằng theo `BR-11`:**
  $$\text{Contribution \%} = 40\% \times \text{LOC Share} + 40\% \times \text{Commit Share} + 20\% \times \text{PR Share}$$
  * Khắc phục nhược điểm của các công cụ truyền thống vốn chỉ đếm commit (bị spam) hoặc chỉ đếm LOC (bị copy-paste).
  * Xử lý ngoại lệ chia cho 0 khi repo rỗng hoặc chưa có hoạt động.
* **Cơ chế phát hiện Free-Rider động theo `BR-12`:**
  * Cung cấp thanh trượt điều chỉnh ngưỡng linh hoạt từ **1% đến 20%** (mặc định 5%).
  * Sinh viên có tỷ lệ đóng góp dưới ngưỡng sẽ lập tức bị gắn cờ đỏ **"⚠️ Free-Rider"** trên bảng điểm và bục vinh danh.

---

### SLIDE 10: THIẾT KẾ GIAO DIỆN LUXURY TERRACOTTA PORCELAIN & GLASSMORPHISM
* **Ngôn ngữ thiết kế đẳng cấp quốc tế:**
  * Nền sứ ngọc trai (`#FFFAF6` / `#FBEEE6`), viền đất nung mềm (`#F7DBCC`), typography nâu mocha quý phái (`#7A3E2E`).
  * Loại bỏ hoàn toàn màu xanh đỏ gắt, tuân thủ nghiêm ngặt chuẩn tương phản **WCAG AA**.
* **Các thành phần giao diện đột phá:**
  * **AITA Cyber Cockpit:** Đồng hồ Synergy Gauge 94/100, Radar năng lực 5 cực, cửa sổ dòng lệnh trực tiếp `LIVE_TELEMETRY.LOG`.
  * **Bục vinh danh 3D Podium:** Tôn vinh Quán quân MVP (#1), Đóng góp xuất sắc (#2) và cảnh báo người cần hỗ trợ (#4).
  * **Thanh Capsule Pill Bar 38px & Lưới nhiệt 30 ngày (Activity Heatmap):** Ma trận 4 tuần x 7 ngày rê chuột xem chi tiết commit.

---

### SLIDE 11: BỘ MODAL PHÂN TÍCH CHUYÊN SÂU & PHÂN TRANG COMMIT (TASKS 15 - 18)
* **Modal Chi Tiết Thành Viên (`MemberDetailsModal.tsx`):**
  * 4 Thẻ Metric đo lường chuyên sâu (Commits, Additions, Deletions, Net LOC).
  * **Biểu đồ cột nhịp độ Sprint Pacing Timeline theo ngày:** Tự động phát hiện và bật cờ cảnh báo nếu thành viên dồn $>70\%$ công việc sát deadline (*Sprint-dumping alert*).
  * **Bảng kiểm toán commit phân trang:** Dropdown chọn 5/10/25/50 dòng, điều hướng « ‹ Sau › », cố định tiêu đề bảng.
* **Modal Cấu Hình Ngưỡng Free-Rider (`FreeRidingThresholdModal.tsx`):**
  * Thanh trượt Range Slider đồng bộ 2 chiều với Number Input, xác thực tức thì khoảng $[1\%, 20\%]$ theo `BR-12`.

---

### SLIDE 12: ĐẢM BẢO CHẤT LƯỢNG PHẦN MỀM (QA LEAD - 55/55 TESTS PASSED)
* **Cam kết chất lượng chuẩn công nghiệp:**
  * Xây dựng toàn diện **11 bộ test suite tự động** bằng Vitest và React Testing Library.
  * Đạt tỷ lệ thành công tuyệt đối **100% (55/55 test cases passed)** trong thời gian chạy chỉ **3.18 giây**.
* **Độ bao phủ kiểm thử (Code Coverage):**
  * Đạt trên **85%** toàn bộ các hàm nghiệp vụ, vượt xa tiêu chí bắt buộc $\ge 80\%$ của môn học SWP391.
  * Kiểm thử đầy đủ các tình huống biên: chia cho 0, repo rỗng, retry timeout, fake timers backoff, bảo mật phân quyền RBAC và luồng tích hợp E2E.

---

### SLIDE 13: TRÌNH DIỄN DEMO TRỰC TIẾP TRÊN HỆ THỐNG THỰC TẾ
* **3 Kịch bản Demo thực chiến sẵn sàng:**
  * **Demo 1:** Nạp bài tập $\to$ BullMQ ưu tiên Exam trước Assignment $\to$ Giảng viên xem logs và bấm "Approve" duyệt điểm AI.
  * **Demo 2:** Giả lập lỗi chấm thi $\to$ Hệ thống retry 3 lần theo khoảng cách 2s, 4s, 8s $\to$ Cô lập vào DLQ $\to$ Thao tác Manual Replay khôi phục job.
  * **Demo 3:** Phân tích Git repo mẫu có commit sửa khoảng trắng $\to$ Bắt cờ gian lận $\to$ Hiển thị cờ đỏ Free-Rider trên Bục vinh danh và biểu đồ đóng góp.

---

### SLIDE 14: KẾ HOẠCH BẢO VỆ CUỐI KỲ (FINAL DEFENSE - TUẦN 9 ĐẾN TUẦN 10)
* **Stress Testing với k6:**
  * Viết kịch bản nạp tải 100 requests đồng thời đo lường Throughput và Latency của hàng đợi BullMQ.
* **Tối ưu hóa Database & Caching:**
  * Đánh chỉ mục Index trên các cột tìm kiếm và áp dụng Redis Cache đảm bảo thời gian phản hồi API đạt dưới **100ms**.
* **Đồng bộ hóa Design System toàn diện:**
  * Hoàn thiện responsive trên máy tính bảng/điện thoại và thống nhất bảng màu Terracotta Porcelain cho toàn bộ các màn hình còn lại.

---

### SLIDE 15: TỔNG KẾT & LỜI CẢM ƠN HỘI ĐỒNG
* **Tóm tắt giá trị mang lại:**
  * Giải quyết trọn vẹn bài toán quá tải chấm bài tự động và loại bỏ triệt để vấn đề sinh viên lười biếng, gian lận trong đồ án nhóm.
  * Mã nguồn hoàn chỉnh, kiến trúc chuẩn mực, kiểm thử tự động 100% và giao diện người dùng đạt độ hoàn thiện cao nhất.
* **Lời cảm ơn:**
  * Chân thành cảm ơn quý Thầy/Cô trong Hội đồng chấm thi đã lắng nghe và hướng dẫn nhóm trong suốt thời gian qua.
  * Nhóm 2 rất mong nhận được những góp ý quý báu từ Hội đồng!
* **Q&A Session (Sẵn sàng trả lời các câu hỏi kỹ thuật chuyên sâu).**
