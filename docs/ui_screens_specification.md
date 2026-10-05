# Danh Sách & Quy Chuẩn Thiết Kế Giao Diện (UI/UX Specification)
> **Dự án:** AITA-INTELLIGENT (SWP391 - Phân hệ 5: Redis Queue & Teamwork Analytics)  
> **Căn cứ:** Mục 2 (Overall Functionalities) & Mục 3 (Design Specifications) trong tài liệu SRS (Trang 6–8, 28–48)

---

## 🧭 TỔNG QUAN HỆ THỐNG MÀN HÌNH

Hệ thống giao diện của Phân hệ 5 gồm:
- **8 Màn hình chính (Main Pages / Views)** có layout Sidebar + Navbar.
- **8 Cửa sổ phụ (Modals / Popups)** phục vụ xác nhận, cấu hình và xem chi tiết lỗi.
- **2 Màn hình dự phòng (Backlog - không bắt buộc ở giai đoạn đầu):** Export Report Modal & Historical Timeline.

---

## 📱 PHẦN 1: CÁC MÀN HÌNH CHÍNH (MAIN PAGES)

### 1. Màn Hình Đăng Nhập (Login Screen) - [Dùng chung: Lecturer, Student, Admin]
* **Mục đích:** Cổng đăng nhập phân quyền vào hệ thống.
* **Các thành phần giao diện cần thiết kế:**
  - Logo trường/dự án: **AITA-INTELLIGENT**.
  - Form nhập:
    - Ô nhập `Email hoặc Username` (Ví dụ: `name@fpt.edu.vn`).
    - Ô nhập `Mật khẩu` (Password box có nút ẩn/hiện mắt).
    - Nút checkbox `Remember me`.
    - Link `Quên mật khẩu? (Forgot password?)`.
  - Nút bấm chính: `Đăng nhập (Login)` (Màu xanh chủ đạo).
  - Tùy chọn đăng nhập nhanh Google SSO (nếu có).

---

### 2. Bảng Điều Khiển Trung Tâm (Main Dashboard) - [Dùng chung theo Role]
* **Mục đích:** Trung tâm điều hướng sau khi đăng nhập, hiển thị tóm tắt tình trạng hệ thống.
* **Các thành phần giao diện cần thiết kế:**
  - **Bộ 3 Thẻ chỉ số tổng quan (Metric Cards):**
    - `Active Batches`: Số đợt chấm bài đang chạy (Màu xanh dương).
    - `Dead-Letter Jobs`: Số bài bị lỗi chết cần xử lý (Màu đỏ cảnh báo).
    - `Pending Analyses`: Số kho Git đang chờ/đang phân tích (Màu vàng/cam).
  - **Khu vực Quick Navigation (Lối tắt nhanh theo vai trò):**
    - *Giảng viên (Lecturer):* Nút sang "Danh sách bài nộp", "Nộp kho Git phân tích", "Quản lý hàng đợi".
    - *Sinh viên (Student):* Nút xem "Báo cáo đóng góp nhóm của tôi".
    - *Admin:* Nút sang "Cài đặt hệ thống".
  - **Bảng hoạt động gần đây (Recent Activities):** Lịch sử các lần chấm bài hoặc phân tích repo gần nhất.

---

### 3. Màn Hình Danh Sách Bài Nộp (Submissions List Screen) - [Lecturer]
* **Mục đích:** Giảng viên chọn các bài nộp của sinh viên trong lớp để tạo đợt chấm hàng loạt (Batch Grading).
* **Các thành phần giao diện cần thiết kế:**
  - **Thanh bộ lọc (Filter Bar):**
    - `Class Filter` (Dropdown chọn lớp: SE1801, SWP391...).
    - `Status Filter` (Dropdown: Tất cả, Chưa chấm - Not graded, Đã chấm - Completed, Thất bại - Failed).
    - `Search Box`: Tìm kiếm theo tên sinh viên hoặc tiêu đề bài nộp.
    - Nút `Tìm kiếm (Search)`.
  - **Bảng dữ liệu (Data Table):**
    - Cột Checkbox ở đầu mỗi dòng (và Checkbox chọn tất cả ở Header).
    - Cột `Sinh viên (Student)`: Tên sinh viên.
    - Cột `Bài nộp (Submission)`: Tiêu đề/Mã bài tập (Assignment 3, Lab 5...).
    - Cột `Trạng thái (Status)`: Badge màu (Xám: Not graded, Xanh lá: Completed, Đỏ: Failed).
    - Cột `Thời gian nộp (Submitted at)`.
  - **Nút hành động nổi bật:** Nút `Bắt đầu chấm bài (Start grading)` (Chỉ sáng lên khi có $\ge 1$ dòng được tích chọn).

---

### 4. Màn Hình Giám Sát Hàng Đợi Thời Gian Thực (Queue Monitor Dashboard) - [Lecturer]
* **Mục đích:** Theo dõi trực tiếp tiến độ thực thi của BullMQ, tự động cập nhật mỗi 2 giây (`BR-03`).
* **Các thành phần giao diện cần thiết kế:**
  - **Dropdown chọn đợt chấm (Batch Selector):** Mặc định chọn batch mới nhất.
  - **Hàng 4 Thẻ chỉ số trạng thái (Status Metric Cards):**
    - ⏳ `Waiting` (Đang chờ - Số lượng lớn, màu xám/vàng).
    - ⚡ `Active` (Đang chấm song song - Màu xanh dương).
    - ✅ `Completed` (Đã hoàn thành - Màu xanh lá cây).
    - ❌ `Failed` (Thất bại / Chờ retry - Màu đỏ).
  - **Hộp thông báo nhịp đập:** Huy hiệu `Live sync 2s` (Có hiệu ứng chớp xanh biểu thị đang polling thời gian thực).
  - **Thanh tiến trình tổng (Overall Progress Bar):** Tỷ lệ % hoàn thành đợt chấm.
  - **Bảng chi tiết các Jobs (Jobs Data Table):**
    - Cột `Job ID` (Mã tác vụ).
    - Cột `Trạng thái (Status)`.
    - Cột `Số lần thử lại (Retry Count)` (Hiển thị `0/3`, `1/3`, `2/3`).
    - Nút/Link `Chi tiết (View details)` mở Job Details Modal.
  - Nút chuyển nhanh sang trang `Dead-Letter Queue (DLQ)`.

---

### 5. Màn Hình Quản Lý Hàng Đợi Chết (Dead-Letter Queue - DLQ Screen) - [Lecturer]
* **Mục đích:** Nơi lưu giữ các tác vụ chấm bị crash hoặc timeout sau 3 lần retry (`status = dead`) để giảng viên kiểm toán nguyên nhân lỗi.
* **Các thành phần giao diện cần thiết kế:**
  - Banner cảnh báo đầu trang: Mô tả đây là các job bị cô lập, không làm tắc nghẽn luồng xử lý chính.
  - **Bảng danh sách lỗi (DLQ Table):**
    - Cột `Job ID`.
    - Cột `Đợt chấm (Batch)`.
    - Cột `Phân loại lỗi (Error Classification)` (Ví dụ: `timeout: exceeded 30s`, `runtime error`).
    - Cột `Thao tác (Action)`: Link bấm `Xem chi tiết & Xử lý (View details)`.

---

### 6. Màn Hình Nộp Kho Git Phân Tích (Git Repo Submission Screen) - [Lecturer]
* **Mục đích:** Nhập thông tin kho GitHub của nhóm sinh viên để chuẩn bị bóc tách commit.
* **Các thành phần giao diện cần thiết kế:**
  - Dropdown `Chọn nhóm (Team)`: Danh sách các nhóm trong lớp.
  - Ô nhập `Repository URL*`: Nhập link Git (Ví dụ: `https://github.com/org/repo.git`).
  - Ô nhập `Nhánh phân tích (Branch)`: Mặc định điền sẵn `"main"`.
  - Nút gạt bật/tắt: `Kho riêng tư (Private repository)` (Mặc định: Tắt).
    - *Lưu ý:* Nếu bật Private, hệ thống sẽ tự động bật popup `PAT Auth Modal` để nhập GitHub Personal Access Token.
  - Nút bấm: `Gửi phân tích (Submit)` và nút `Hủy (Cancel)`.

---

### 7. Màn Hình Tiến Trình Bóc Tách Git (Analysis Progress Screen) - [Lecturer]
* **Mục đích:** Màn hình chuyển tiếp hiển thị sinh động tiến trình hệ thống đang xử lý repository ngầm.
* **Các thành phần giao diện cần thiết kế:**
  - **Thanh Stepper 4 bước ngang (Progress Stepper):**
    - Bước 1: 📥 `Cloning` (Đang clone repository dạng bare).
    - Bước 2: 🔍 `Parsing commits` (Đang bóc tách commit log).
    - Bước 3: 🧹 `Filtering noise` (Đang lọc sạch rác `node_modules`, lockfiles).
    - Bước 4: 📊 `Scoring` (Đang tính điểm đóng góp và xét Free-rider).
  - Dòng chữ trạng thái động bên dưới: *"Đang phân tích commit history..."*.
  - Biểu tượng xoay loading mượt mà.
  - Nút `Xem báo cáo (View report)`: Bị mờ (disabled) khi đang chạy, và sáng xanh khi Bước 4 hoàn tất thành công (`cloneStatus = 'success'`).

---

### 8. Màn Hình Báo Cáo Đóng Góp Nhóm (Team Contribution Report) - [Lecturer & Student]
* **Mục đích:** Trang "ăn tiền" nhất của đề tài: trực quan hóa sự đóng góp thực tế và vạch mặt sinh viên lười biếng.
* **Các thành phần giao diện cần thiết kế:**
  - **Dropdown chọn nhóm:** Giảng viên chọn nhóm bất kỳ; Sinh viên bị khóa cố định ở nhóm của mình.
  - **Biểu đồ phân bổ đóng góp (Contribution Bar / Pie Chart):** Cột biểu thị % đóng góp của từng thành viên trong nhóm.
  - **Bảng số liệu đóng góp chi tiết (Contribution Data Table):**
    - Cột `Thành viên (Member)`: Họ tên + Email.
    - Cột `Tỷ lệ đóng góp (% Contribution)`: Hiển thị phần trăm (Ví dụ: `42%`, `31%`, `20%`, `7%`).
    - Cột `Số lượng PR (PR count)`.
    - Cột `Cảnh báo Free-riding`: Hiển thị Badge đỏ rực **"YES - FREE RIDER"** nếu % dưới ngưỡng (mặc định < 5%), hoặc Badge xám/xanh **"NO"**.
    - Cột `Thao tác`: Link mở `Chi tiết cá nhân (View details)`.
  - Nút xem danh sách gian lận: Nút `Xem các commit đáng ngờ (View flagged commits)`.

---

### 9. Màn Hình Cài Đặt Hệ Thống (System Settings Screen) - [Admin]
* **Mục đích:** Quản trị viên điều chỉnh tham số toàn hệ thống lúc runtime mà không cần restart server.
* **Các thành phần giao diện cần thiết kế:**
  - **Mục 1: Worker Concurrency (Số worker chạy song song):**
    - Hiển thị giá trị hiện tại (Ví dụ: `5`).
    - Nút `Chỉnh sửa (Edit)`.
  - **Mục 2: Free-Riding Threshold (Ngưỡng cảnh báo Free-rider):**
    - Hiển thị giá trị hiện tại (Ví dụ: `5%`).
    - Nút `Chỉnh sửa (Edit)`.

---

## 🪟 PHẦN 2: CÁC CỬA SỔ POPUP / MODALS (8 MODALS)

### 1. Modal Cấu Hình Đợt Chấm (Batch Config Modal) - [Gắn liền trang Submissions List]
* **Hiển thị khi:** Giảng viên chọn các bài nộp và bấm "Start grading".
* **Thành phần:**
  - Ô nhập `Tên đợt chấm (Batch name*)` (Ví dụ: `Assignment 3 - Grading`).
  - Dropdown chọn `Mức ưu tiên (Priority*)`: `Exam` (Ưu tiên cao nhất) / `Assignment` / `Practice`.
  - Dòng text chỉ đọc: `Số bài đã chọn: 12 bài`.
  - Nút `Xác nhận gửi (Submit)` và nút `Hủy (Cancel)`.

---

### 2. Modal Chi Tiết Job (Job Details Modal) - [Gắn liền trang Queue Monitor]
* **Hiển thị khi:** Bấm vào một dòng job trên bảng hàng đợi.
* **Thành phần:**
  - Thông tin chỉ đọc: `Job ID`, `Trạng thái`, `Thời gian chạy (ms)`, `Số lần retry`.
  - Nếu job bị lỗi: Hiện khung nền đỏ hiển thị `Phân loại lỗi` và khung mã nguồn `Crash Stack Trace`.
  - Nút `Đóng (Close)`.

---

### 3. Modal Chi Tiết Lỗi DLQ (DLQ Error Details Modal) - [Gắn liền trang DLQ]
* **Hiển thị khi:** Bấm vào job trong bảng Dead-Letter Queue.
* **Thành phần:**
  - Chi tiết nguyên nhân crash gốc rễ.
  - Số lần retry đã kiệt (luôn là 3).
  - 2 Nút hành động:
    - Nút đỏ/xám: `Bỏ qua vĩnh viễn (Dismiss job)`.
    - Nút xanh: `Chạy lại thủ công (Trigger manual retry)` -> Mở tiếp Modal 4.

---

### 4. Modal Xác Nhận Chạy Lại Thủ Công (Manual Retry Modal) - [Gắn liền trang DLQ]
* **Thành phần:**
  - `Job ID` cần chạy lại.
  - Dropdown `Chọn mức ưu tiên mới (New priority)`: Cho phép đẩy lên làm Exam để chấm gấp.
  - Nút `Xác nhận chạy lại (Confirm)` (Reset retry count về 0 và đẩy lại vào Redis) và nút `Hủy`.

---

### 5. Modal Nhập Token GitHub (PAT Auth Modal) - [Gắn liền trang Git Submission]
* **Hiển thị khi:** Giảng viên bật công tắc "Private repository".
* **Thành phần:**
  - Ô nhập mật khẩu: `Personal Access Token (PAT)*` (Ký tự ẩn dạng chấm tròn `••••••••`).
  - Dòng chú thích bảo mật: *"Token cần có quyền `repo:read`. Hệ thống sẽ mã hóa AES-256 an toàn và không bao giờ hiển thị lại token này"*.
  - Nút `Lưu & Xác thực (Submit)` và nút `Hủy`.

---

### 6. Modal Chi Tiết Đóng Góp Cá Nhân (Member Details Modal) - [Gắn liền trang Báo cáo]
* **Hiển thị khi:** Giảng viên/Sinh viên bấm vào tên 1 thành viên trong báo cáo đóng góp.
* **Thành phần:**
  - Tiêu đề: Họ và tên thành viên.
  - **Biểu đồ cột tần suất (Histogram):** Số lượng commit theo từng ngày trong suốt đồ án.
  - Dòng tổng kết: `Tổng dòng code thêm (+)` / `Tổng dòng code xóa (-)` / `Tổng nét LOC sạch`.
  - Bảng danh sách các commit của cá nhân đó.

---

### 7. Modal Commit Gian Lận Bị Bắt (Flagged Commits Modal) - [Gắn liền trang Báo cáo]
* **Hiển thị khi:** Bấm nút "View flagged commits" trên trang Báo cáo.
* **Thành phần:**
  - Bảng danh sách các commit bị hệ thống phát hiện gian lận:
    - Cột `Tác giả (Author Email)`.
    - Cột `Ngày commit`.
    - Cột `Lý do bị gắn cờ (Reason)`: Hiển thị badge màu cam/đỏ `whitespace-only` (chỉ sửa format để farm LOC) hoặc `self-revert` (tự xóa commit vừa tạo).
  - Nút `Đóng`.

---

### 8. Modal Điều Chỉnh Concurrency & Threshold (Settings Modals) - [Gắn liền trang Admin Settings]
* **Thành phần Modal Concurrency:** Ô nhập số nguyên từ `1` đến `10` (BR-07), nút Lưu.
* **Thành phần Modal Threshold:** Ô nhập số % từ `1%` đến `20%` (BR-12), nút Lưu.

---

## 🎨 GỢI Ý PHONG CÁCH THIẾT KẾ ĐỂ ĐẠT ĐIỂM CAO (DESIGN TIPS)
1. **Tone màu chủ đạo:**
   - Nền: Dark Mode hiện đại (Slate/Navy `#0f172a` hoặc `#111827`) hoặc Light Mode sang trọng sạch sẽ (`#f8fafc`).
   - Màu nhấn: Xanh dương Electric Blue (`#3b82f6`) cho nút chính và trạng thái Active; Xanh Emerald (`#10b981`) cho Completed; Đỏ Crimson (`#ef4444`) cho Failed/Free-rider.
2. **Typography:** Dùng font không chân hiện đại như **Inter** hoặc **Roboto**.
3. **Hiệu ứng trực quan:**
   - Các thẻ chỉ số (Metric Cards) có viền bo góc tròn nhẹ (`rounded-xl`), đổ bóng nhẹ (`shadow-sm`) hoặc hiệu ứng kính mờ (Glassmorphism).
   - Có biểu tượng (Icons) trực quan từ thư viện **Lucide Icons** (Clock, CheckCircle, AlertTriangle, GitPullRequest, GitCommit, Users, Sliders).
