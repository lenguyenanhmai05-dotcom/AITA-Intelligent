# 🎬 KỊCH BẢN DEMO THỰC CHIẾN BẢO VỆ MILESTONE 3 (SWP391)

> **Dự án:** AITA-INTELLIGENT (Hệ thống Hỗ trợ Giảng dạy & Đánh giá Dự án Phần mềm Thông minh)  
> **Phân hệ 5 (Subsystem 5):** Redis Queue & Git Teamwork Analytics Platform  
> **Môn học:** SWP391 - Software Project (FPT University)  
> **Người soạn thảo:** Nguyễn Châu Khánh Linh (QA Lead & Frontend Lead - Subsystem 5)  

---

## 🎯 MỤC TIÊU BUỔI BẢO VỆ MILESTONE 3 (25% TRỌNG SỐ)

1. **Chứng minh tính đúng đắn của 16 Quy tắc Nghiệp vụ (Business Rules `BR-01` $\to$ `BR-16`)**.
2. **Trình diễn luồng liên thông mượt mà (End-to-End Integration)** giữa Backend Redis Queue/BullMQ, Git Bare Sandbox và Giao diện Web React cao cấp.
3. **Thuyết phục Hội đồng bằng 3 kịch bản Demo tương tác trực tiếp trên màn chiếu**, có chuẩn bị sẵn tài khoản, dữ liệu mẫu và các tình huống kiểm thử biên.

---

## 📋 TỔNG HỢP 3 KỊCH BẢN DEMO TRỌNG TÂM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3 KỊCH BẢN DEMO MILESTONE 3                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ KỊCH BẢN 1: Hàng Đợi Ưu Tiên Chấm Bài & Giảng Viên Duyệt Điểm AI (UC-04b)    │
│  - Độ ưu tiên: Exam (100) > Assignment (50) > Practice (10)                 │
│  - Giới hạn 3 đợt chấm đồng thời (BR-02) & Nhịp tim Telemetry 2s (BR-03)   │
│  - Giảng viên thẩm định & phê duyệt điểm chính thức                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ KỊCH BẢN 2: Cơ Chế Chịu Lỗi Exponential Backoff & Dead-Letter Queue (DLQ)    │
│  - Giả lập lỗi chấm bài & Tự động thử lại 3 lần sau 2s, 4s, 8s (BR-04, 05) │
│  - Cô lập tác vụ chết vào DLQ & Kiểm toán nguyên nhân lỗi                   │
│  - Thao tác "Manual Replay" reset retry = 0 đưa job quay lại hàng đợi (06)  │
├─────────────────────────────────────────────────────────────────────────────┤
│ KỊCH BẢN 3: Phân Tích Kho Git, Bắt Gian Lận & Cảnh Báo Free-Rider           │
│  - Bare clone cách ly & Mã hóa PAT token AES-256 (BR-08)                    │
│  - Lọc rác tự sinh (BR-13) & Thuật toán bắt Whitespace/Self-revert (BR-10)   │
│  - Báo cáo đóng góp 40/40/20 (BR-11) & Ngưỡng Free-Rider động (BR-12)      │
│  - Modal chi tiết thành viên, biểu đồ Sprint-dumping & Phân trang commit   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 KỊCH BẢN 1: HÀNG ĐỢI ƯU TIÊN & GIẢNG VIÊN DUYỆT ĐIỂM AI

* **Mục đích chứng minh:** `BR-01` (Priority Queue), `BR-02` (Max 3 Batches), `BR-03` (Telemetry 2s) và `UC-04b` (Human-in-the-Loop AI Review).
* **Người thực hiện chính:** Lê Nguyễn Anh Mai (TV1) & Ngô Sử Việt Anh (TV4).
* **Tài khoản đăng nhập:** Giảng viên (`tran.quoc.bao@fpt.edu.vn` / Role: `lecturer`).

### Các bước thao tác trên màn chiếu:

1. **Bước 1.1: Chọn bài nộp tạo đợt chấm hàng loạt**
   - Truy cập vào tab **"Danh Sách Bài Nộp"** (`submissions`).
   - Sử dụng bộ lọc chọn lớp `SWP391 - SE1801`.
   - Tích chọn 5 bài nộp của sinh viên.
   - Nút hành động hiển thị: **"Bắt đầu chấm 5 bài đã chọn"** $\to$ Bấm vào nút.
2. **Bước 1.2: Cấu hình mức độ ưu tiên (`BR-01`)**
   - Modal cấu hình đợt chấm xuất hiện:
     - Nhập tên đợt: `Bài Thi Cuối Kỳ - Đợt 1`.
     - Chọn mức ưu tiên: **`Exam (Cao nhất - Trọng số 100)`**.
   - Bấm **"Xác Nhận Tạo Đợt Chấm"** $\to$ Hệ thống tự động chuyển ngay sang Dashboard Giám Sát.
3. **Bước 1.3: Giám sát nhịp tim thời gian thực 2s (`BR-03`)**
   - Tại tab **"Giám Sát Hàng Đợi"** (`queue`):
     - Chỉ cho Hội đồng thấy huy hiệu nhấp nháy xanh: `🟢 Live sync 2s`.
     - 4 thẻ chỉ số tự động cập nhật: `Waiting` $\to$ `Active` $\to$ `Completed`.
     - Bảng Jobs chi tiết hiển thị mã bài, tiến trình chạy và mức độ ưu tiên `Exam`.
4. **Bước 1.4: Thử nghiệm kiểm tra biên quy tắc `BR-02` (Tối đa 3 đợt đồng thời)**
   - Mở tab bài nộp, cố tình tạo liên tiếp Batch 2, Batch 3, rồi thử tạo Batch thứ 4.
   - Hệ thống lập tức hiển thị cảnh báo đỏ từ chối: `Mã lỗi: BR_02_LIMIT_EXCEEDED - Mỗi lớp chỉ được chạy tối đa 3 đợt chấm đồng thời`.
5. **Bước 1.5: Giảng viên thẩm định & duyệt điểm AI (`UC-04b`)**
   - Khi job hoàn tất, bấm **"Xem chi tiết"** vào một bài nộp ở trạng thái `Completed`.
   - Hiển thị đầy đủ: Điểm số AI chấm ban đầu (`10/10`), thời gian thực thi `runtimeDurationMs` và logs test case.
   - Trạng thái hiện tại: `Pending Review`.
   - Giảng viên nhập nhận xét: *"Thuật toán tối ưu, code sạch, đạt chuẩn"*.
   - Bấm nút **"Phê Duyệt (Approve)"** $\to$ Huy hiệu đổi ngay thành `Approved` màu xanh ngọc, điểm số chính thức được chốt vào Database.

---

## ⚡ KỊCH BẢN 2: CƠ CHẾ CHỊU LỖI EXPONENTIAL BACKOFF & DEAD-LETTER QUEUE (DLQ)

* **Mục đích chứng minh:** `BR-04` (Exponential Delay $2^n$), `BR-05` (Max 3 Retries), `BR-06` (DLQ Replay & Dismiss).
* **Người thực hiện chính:** Lê Nguyễn Anh Mai (TV1) & Đào Minh Nghĩa (TV3).

### Các bước thao tác trên màn chiếu:

1. **Bước 2.1: Kích hoạt tình huống giả lập lỗi (Crash / Timeout)**
   - Nạp một bài nộp chứa vòng lặp vô tận `while(true)` hoặc cố tình ngắt kết nối Sandbox.
2. **Bước 2.2: Quan sát nhịp độ thử lại Exponential Backoff (`BR-04`, `BR-05`)**
   - Màn hình Queue hiển thị cột `Retry Count`:
     - Lần 1: Thất bại $\to$ Trạng thái chuyển sang chờ thử lại sau **2 giây** ($2^1$). Cột hiển thị `1/3`.
     - Lần 2: Thất bại $\to$ Trạng thái chuyển sang chờ thử lại sau **4 giây** ($2^2$). Cột hiển thị `2/3`.
     - Lần 3: Thất bại $\to$ Trạng thái chuyển sang chờ thử lại sau **8 giây** ($2^3$). Cột hiển thị `3/3`.
   - Nhấn mạnh trước Hội đồng: *"Cơ chế giãn cách thời gian giúp hệ thống không bị quá tải khi tài nguyên bên ngoài gặp sự cố tạm thời"*.
3. **Bước 2.3: Tác vụ chết bị cô lập vào Dead-Letter Queue (DLQ)**
   - Sau lần thử thứ 3 thất bại, hệ thống tự động đổi `status = 'dead'`.
   - Chuyển sang tab **"Dead-Letter Queue"** (`dlq`).
   - Job lỗi xuất hiện với phân loại lỗi: `timeout: sandbox execution exceeded 30s`.
4. **Bước 2.4: Kiểm toán nguyên nhân lỗi & Phục hồi tác vụ (`BR-06`)**
   - Bấm **"Xem chi tiết lỗi"** $\to$ Modal hiển thị toàn bộ `Crash Stack Trace` để phục vụ điều tra.
   - Bấm nút **"Manual Retry"**:
     - Modal khôi phục mở ra, cho phép chọn nâng mức ưu tiên lên `Exam` để chấm khẩn cấp.
     - Bấm **"Xác Nhận Replay"** $\to$ Hệ thống reset số lần thử lại về **`0`**, đưa job quay trở lại trạng thái `waiting` trong hàng đợi chính để worker nhận lại.

---

## 🛡️ KỊCH BẢN 3: PHÂN TÍCH KHO GIT, BẮT GIAN LẬN & CẢNH BÁO FREE-RIDER

* **Mục đích chứng minh:** `BR-08` (Mã hóa PAT), `BR-10` (Bắt commit gian lận), `BR-11` (Công thức 40/40/20), `BR-12` (Ngưỡng Free-Rider 1%–20%), `BR-13` (Lọc rác LOC).
* **Người thực hiện chính:** Nguyễn Châu Khánh Linh (TV5) & Nguyễn Tường Vy (TV2).

### Các bước thao tác trên màn chiếu:

1. **Bước 3.1: Nộp kho Git & Bảo mật mã hóa PAT (`BR-08`)**
   - Chọn tab **"Phân Tích Git Repo"** (`git`).
   - Nhập URL repository mẫu do nhóm chuẩn bị sẵn: `https://github.com/aita-demo/swp391-teamwork.git`.
   - Bật công tắc `Kho riêng tư (Private repository)` $\to$ Popup nhập Personal Access Token xuất hiện.
   - Nhập token dạng ẩn $\to$ Giải thích trước Hội đồng: *"Token được mã hóa AES-256-CBC tại backend và chỉ dùng trong RAM khi clone, tuyệt đối không lưu dạng plain text"*.
   - Bấm **"Bắt Đầu Phân Tích"**.
2. **Bước 3.2: Quan sát Stepper bóc tách 4 bước**
   - Thanh Stepper hiển thị hiệu ứng xoay lần lượt qua 4 trạng thái:
     - `Cloning`: Bare clone vào thư mục tạm `scratch/clones/`.
     - `Parsing commits`: Chạy lệnh `git log --numstat` bóc tách commit.
     - `Filtering noise`: Tự động loại bỏ các file rác `node_modules/`, `package-lock.json`, `dist/` theo `BR-13`.
     - `Scoring`: Tính điểm đóng góp và quét gian lận.
3. **Bước 3.3: Màn hình Báo cáo Đóng góp & Bục vinh danh 3D Podium**
   - Hệ thống tự động chuyển sang trang **"Báo Cáo Đóng Góp & Free-Rider"** với giao diện **Luxury Terracotta Porcelain**:
     - Giới thiệu đồng hồ **Synergy Index 94/100 (Rất tốt)** và Biểu đồ radar năng lực 5 cực.
     - Giới thiệu 4 thẻ chỉ số: Tổng 104 commits, Net LOC ròng +8,360 dòng, Nhịp độ 14.8 commit/ngày, Nguy cơ Free-Rider 1/4.
     - **Bục vinh danh 3D Podium:**
       - #1 Quán quân MVP (Lê Nguyễn Anh Mai - 38.5%).
       - #2 Đóng góp xuất sắc (Trần Quốc Bảo - 31.0%).
       - #3 Tác giả tích cực (Phạm Hoàng Long - 26.5%).
       - #4 Cảnh báo đỏ cam (Võ Minh Trí - 4.0%): Bị hệ thống gắn cờ **`⚠️ CẦN HỖ TRỢ / Free-Rider`** vì đóng góp dưới ngưỡng quy định.
     - Rê chuột vào **Lưới nhiệt hoạt động 30 ngày (Activity Heatmap)** để kiểm tra các ngày cao điểm đạt 92 commits.
4. **Bước 3.4: Kiểm toán chi tiết & Phát hiện dồn commit (Sprint-dumping)**
   - Bấm nút **`🔍 Xem`** trên dòng sinh viên Võ Minh Trí $\to$ Modal kiểm toán mở ra.
   - Chỉ vào biểu đồ nhịp độ: Hệ thống tự động phân tích và gắn cờ cảnh báo:
     `⚠️ Cảnh báo: Dồn commit sát deadline (Sprint-dumping pattern detected)`.
   - Trình diễn bảng commit log có **phân trang Client-side**: chọn đổi từ 5 dòng sang 10 dòng, lật trang `1 - 5 / 12` mượt mà.
5. **Bước 3.5: Trình diễn điều chỉnh ngưỡng Free-Rider thời gian thực (`BR-12`)**
   - Đóng modal, nhìn lên góc phải bấm nút **`⚙️ Ngưỡng Free-Rider: 5%`**.
   - Kéo thanh trượt Range Slider từ $5\%$ lên $15\%$: Ô số tự động nhảy theo tức thì.
   - Thử nhập $25\%$ $\to$ Hệ thống báo lỗi đỏ: *"Quy tắc BR-12: Ngưỡng cảnh báo chỉ được phép từ 1% đến 20%"* và khóa nút Lưu.
   - Kéo về $10\%$ và bấm Lưu $\to$ Bảng xếp hạng cập nhật ngay tức thì, thêm thành viên bị gắn cờ Free-Rider tương ứng với ngưỡng mới.
6. **Bước 3.6: Trình diễn bộ kiểm thử tự động 55/55 Tests (QA Lead)**
   - Mở Terminal, gõ lệnh: `npx vitest run`.
   - Toàn bộ **11 test suites** chạy trong 3 giây và hiển thị kết quả **55 tests passed (100%)** màu xanh lá cây trước mắt Hội đồng để khẳng định chất lượng phần mềm đạt chuẩn công nghiệp.

---

## 🎯 DANH MỤC THIẾT BỊ & TÀI KHOẢN CẦN CHUẨN BỊ TRƯỚC BUỔI DEMO

1. **2 Máy tính chuẩn bị sẵn:**
   - 1 máy chạy màn hình Giảng viên (`tran.quoc.bao@fpt.edu.vn`).
   - 1 máy chạy màn hình Sinh viên (`mai.lna@fpt.edu.vn`).
2. **Kho Git mẫu chứa sẵn kịch bản gian lận:**
   - Tạo sẵn 1 repo trên GitHub có 4 tài khoản thành viên commit, trong đó có 1 tài khoản chỉ commit 2 dòng sửa khoảng trắng (whitespace-only) và 1 commit self-revert.
3. **Môi trường cục bộ:**
   - Chạy sẵn `npm run dev:all` để Backend và Frontend đều đã sẵn sàng, tránh tình trạng mất mạng trường khi demo.
