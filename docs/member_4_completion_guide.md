# 📘 BÁO CÁO HOÀN THIỆN NHIỆM VỤ THÀNH VIÊN 4 & TÀI LIỆU KỸ THUẬT CHI TIẾT

> **Dự án:** AITA-INTELLIGENT (Hệ thống Hỗ trợ Giảng dạy & Đánh giá Dự án Phần mềm Thông minh)  
> **Phân hệ 5 (Subsystem 5):** Redis Queue & Git Teamwork Analytics Platform  
> **Môn học:** SWP391 - Software Project (FPT University)  
> **Thành viên phụ trách:** Ngô Sử Việt Anh (MSSV: QE190127)  
> **Vai trò kỹ thuật:** **Frontend Lead (Batch Grading & Queue UI)**  

---

## 🎯 PHẦN 1: PHÂN ĐỊNH RANH GIỚI VÀ TRÁCH NHIỆM THÀNH VIÊN 4

Căn cứ theo bảng phân công `docs/team_task_allocation.md` và tài liệu SRS (Trang 28–36, 43–44), Thành viên 4 chịu trách nhiệm trực tiếp thiết kế và lập trình toàn bộ tầng Giao diện Người Dùng (Web React/Vite) cho luồng Chấm bài Hàng loạt (Batch Grading), Giám sát Hàng đợi Thời gian thực (Queue Telemetry 2s) và Quản trị Hàng đợi Chết (Dead-Letter Queue).

### Bảng phân công nhiệm vụ chi tiết:

| Nhiệm vụ | Màn hình / Modal phụ trách | Quy tắc nghiệp vụ (BR) | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Task 4.1: Quản lý Danh sách Bài nộp** | `Submissions List Screen` (Trang 28 SRS) | Lọc Class, Status, Search, Bulk Select | ✅ Hoàn thành 100% |
| **Task 4.2: Modal Cấu hình Đợt chấm** | `Batch Config Modal` (Trang 30 SRS) | `BR-01` (Priority), `BR-02` ($\le 3$ active batches) | ✅ Hoàn thành 100% |
| **Task 4.3: Dashboard Giám sát Hàng đợi** | `Queue Monitor Dashboard` (Trang 31 SRS) | `BR-03` (Live Heartbeat Polling 2s), 4 Metric Cards | ✅ Hoàn thành 100% |
| **Task 4.4: Màn hình & Modal DLQ** | `DLQ Screen & Modal` (Trang 34–36 SRS) | `BR-04`, `BR-06` (Manual Replay reset retry = 0, Dismiss) | ✅ Hoàn thành 100% |
| **Task 4.5: Cài đặt Concurrency Worker** | `Worker Concurrency Modal/Screen` (Trang 43–44 SRS) | `BR-07` (Boundary 1–10 workers runtime update) | ✅ Hoàn thành 100% |
| **Task 4.6: Tối ưu hóa UI/UX & Responsive** | Toàn bộ giao diện Web React | Dark/Light Mode, Mobile/Desktop responsive | ✅ Hoàn thành 100% |

---

## 🖥️ PHẦN 2: CHI TIẾT CÁC MÀN HÌNH VÀ TÍNH NĂNG ĐÃ TRIỂN KHAI

### 1. Task 4.1: Màn Hình Quản Lý Bài Nộp (`Submissions List`)
- **Vị trí code:** [`apps/web/src/components/DashboardPortal.tsx`](file:///c:/Users/daomi/OneDrive/Desktop/AITA-Intelligent-main/apps/web/src/components/DashboardPortal.tsx) (Tab `'submissions'`)
- **Thành phần giao diện:**
  - **Thanh công cụ lọc (Filter Bar):**
    - Lọc theo Lớp học (`Dropdown Class`): `SWP391 - SE1801`, `PRN231 - SE1803`...
    - Lọc theo Trạng thái bài nộp (`Dropdown Status`): `Tất cả`, `Chưa chấm (Not graded)`, `Đã chấm (Completed)`, `Thất bại (Failed)`.
    - Ô tìm kiếm tức thì (`Search Input`): Tìm kiếm theo tên sinh viên, mã sinh viên hoặc tiêu đề bài tập với kỹ thuật debounce mượt mà.
  - **Bảng dữ liệu bài nộp (Data Table):**
    - Cột Checkbox ở đầu mỗi dòng và Checkbox "Chọn tất cả" tại Header.
    - Huy hiệu trạng thái nhiều màu: Xám (`Not Graded`), Xanh lá (`Completed`), Đỏ (`Failed`).
    - Nút hành động nổi bật: **"Bắt đầu chấm đợt bài đã chọn (Start Grading)"** hiển thị số lượng bài đã tích (ví dụ: *Chấm 5 bài đã chọn*) và tự động disabled nếu chưa chọn bài nào.

---

### 2. Task 4.2: Modal Cấu Hình Đợt Chấm (`Batch Config Modal`)
- **Vị trí code:** [`apps/web/src/components/DashboardPortal.tsx`](file:///c:/Users/daomi/OneDrive/Desktop/AITA-Intelligent-main/apps/web/src/components/DashboardPortal.tsx) (State `isBatchModalOpen`)
- **Nghiệp vụ cốt lõi:**
  - **Gán mức độ ưu tiên theo `BR-01`:**
    - `Exam` (Bài thi kết thúc môn): Trọng số ưu tiên cao nhất ($100$).
    - `Assignment` (Bài tập lớn): Trọng số trung bình ($50$).
    - `Practice` (Bài thực hành hàng tuần): Trọng số thông thường ($10$).
  - **Kiểm tra ràng buộc `BR-02`:**
    - Mỗi lớp chỉ được phép có tối đa **3 đợt chấm đồng thời** ở trạng thái `waiting` hoặc `active`.
    - Nếu lớp đã đạt giới hạn 3 đợt, hệ thống hiển thị cảnh báo đỏ nổi bật, thông báo mã lỗi `BR_02_LIMIT_EXCEEDED` và chặn người dùng bấm gửi yêu cầu.
  - **Điều hướng tự động:** Khi tạo đợt chấm thành công (`POST /api/grading/batches`), modal tự động đóng và điều hướng người dùng ngay sang Dashboard Giám sát Hàng đợi (`activeTab = 'queue'`) để xem tiến độ thời gian thực.

---

### 3. Task 4.3: Dashboard Giám Sát Hàng Đợi Thời Gian Thực (`Queue Monitor Dashboard`)
- **Vị trí code:** [`apps/web/src/components/DashboardPortal.tsx`](file:///c:/Users/daomi/OneDrive/Desktop/AITA-Intelligent-main/apps/web/src/components/DashboardPortal.tsx) (Tab `'queue'`)
- **Cơ chế Live Heartbeat 2 giây (`BR-03`):**
  - Sử dụng React hook `useEffect` kết hợp `setInterval` tự động gọi endpoint `GET /api/grading/telemetry` mỗi đúng **2000ms**.
  - Hiển thị huy hiệu nhịp tim xanh dương nhấp nháy (`🟢 Live sync 2s`) kèm thời gian cập nhật chính xác đến từng giây.
- **Bộ 4 Thẻ Chỉ Số Trạng Thái (Status Metric Cards):**
  1. ⏳ **Waiting** (Vàng): Số lượng bài đang nằm trong hàng đợi BullMQ chờ worker tiếp nhận.
  2. ⚡ **Active** (Xanh dương): Số lượng worker đang chạy chấm song song test cases.
  3. ✅ **Completed** (Xanh lá): Số bài đã chấm xong thành công.
  4. ❌ **Failed** (Đỏ): Số bài gặp lỗi, đang trong chu kỳ retry hoặc đã chuyển vào DLQ.
- **Bảng Danh Sách Jobs Chi Tiết:**
  - Hiển thị ID Job, tên bài nộp, mức ưu tiên kèm huy hiệu màu, trạng thái hiện tại, và tiến trình số lần thử lại (`retryCount`: `0/3`, `1/3`, `2/3`).
  - Nút **"Xem chi tiết (View Details)"** mở modal xem thời gian chạy `runtimeDurationMs` và logs test case.

---

### 4. Task 4.4: Màn Hình & Modal Dead-Letter Queue (`DLQ Screen & Modal`)
- **Vị trí code:** [`apps/web/src/components/DashboardPortal.tsx`](file:///c:/Users/daomi/OneDrive/Desktop/AITA-Intelligent-main/apps/web/src/components/DashboardPortal.tsx) (Tab `'dlq'`)
- **Quản lý sự cố chấm bài:**
  - Liệt kê danh sách các tác vụ chấm bị cô lập sau khi đã thử lại đủ 3 lần theo luật Exponential Backoff (`status = 'dead'`).
  - **Modal Chi Tiết Lỗi:** Hiển thị rõ mã phân loại lỗi (`errorClassification`, ví dụ: `timeout: sandbox execution exceeded 30s`) và toàn bộ nhật ký `stackTrace`.
- **Nút hành động theo `BR-06`:**
  - 🔄 **"Manual Retry (Thử lại thủ công)":** Gọi API `POST /api/dlq/:id/retry`, reset số lần retry về **0**, cho phép chọn lại mức ưu tiên (đẩy lên `Exam` để chấm ưu tiên) và đưa job quay lại hàng đợi.
  - 🗑️ **"Dismiss Job (Đóng tác vụ)":** Gọi API `POST /api/dlq/:id/dismiss`, ghi nhận xác nhận bỏ qua lỗi và dọn sạch khỏi danh sách DLQ hiển thị.

---

### 5. Task 4.5: Modal Cài Đặt Concurrency Worker Cho Quản Trị Viên
- **Vị trí code:** [`apps/web/src/components/DashboardPortal.tsx`](file:///c:/Users/daomi/OneDrive/Desktop/AITA-Intelligent-main/apps/web/src/components/DashboardPortal.tsx) (Tab `'settings'`)
- **Nghiệp vụ `BR-07` & `UC-05`:**
  - Cung cấp thanh trượt (Slider) trực quan cho phép Quản trị viên điều chỉnh số lượng worker chạy song song từ **1 đến 10**.
  - Tích hợp kiểm tra tính hợp lệ tức thì ở phía client và gọi API `PATCH /api/system/settings` (hoặc `POST /api/settings/concurrency`).
  - Thay đổi có hiệu lực ngay lập tức tại runtime của hệ thống mà không cần khởi động lại máy chủ.

---

### 6. Task 4.6: Tối Ưu Hóa Trải Nghiệm Người Dùng (UX/UI Polish)
- **Hệ thống Design System nhất quán:**
  - Bảng màu hài hòa: Cam chủ đạo FPT (`#F97316` / Kumquat `#EA580C`), Xanh dương công nghệ (`#2563EB`), Xanh lá thành công (`#10B981`), Đỏ cảnh báo (`#EF4444`).
  - Hỗ trợ đầy đủ **Dark Mode** và **Light Mode** với nút chuyển đổi tức thì (`ThemeToggle`).
  - Đa ngôn ngữ **Tiếng Việt 🇻🇳 / English 🇬🇧** với bộ từ điển chuẩn hóa trong `translations.ts`.
  - Phân quyền giao diện theo vai trò người dùng: Giảng viên (xem toàn bộ lớp, chấm bài, duyệt điểm), Sinh viên (chỉ xem bài nộp và báo cáo nhóm của mình), Quản trị viên (quản lý cài đặt hệ thống).

---

## 🚀 PHẦN 3: HƯỚNG DẪN TRẢI NGHIỆM VÀ KIỂM THỬ TRÊN GIAO DIỆN WEB

### 1. Khởi động hệ thống
Mở terminal tại thư mục gốc của dự án:
```bash
# Khởi chạy đồng thời cả Backend API và Frontend Web
npm.cmd run dev:api
npm.cmd run dev:web
```

### 2. Kịch bản kiểm thử các tính năng Thành viên 4 trên Web:
1. **Truy cập:** Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).
2. **Đăng nhập:** Đăng nhập với tài khoản Giảng viên:
   - Email: `giangnv@fpt.edu.vn`
   - Mật khẩu: `password123`
3. **Thử nghiệm Tạo đợt chấm bài (Task 4.1 & 4.2):**
   - Bấm vào menu **"Danh sách bài nộp (Submissions)"**.
   - Tích chọn các bài nộp trong danh sách.
   - Bấm nút **"Bắt đầu chấm bài"** -> Modal cấu hình mở ra.
   - Nhập tên đợt chấm, chọn độ ưu tiên **Exam**, bấm xác nhận.
4. **Thử nghiệm Giám sát Hàng đợi (Task 4.3):**
   - Hệ thống tự động chuyển sang tab **"Giám sát hàng đợi (Queue Monitor)"**.
   - Quan sát huy hiệu `🟢 Live sync 2s` nhấp nháy cập nhật liên tục các thẻ số liệu `Waiting`, `Active`, `Completed`.
5. **Thử nghiệm Quản lý DLQ (Task 4.4):**
   - Chuyển sang menu **"Hàng đợi chết (DLQ)"**.
   - Bấm xem chi tiết bài nộp bị lỗi -> Bấm nút **"Manual Retry"** để khôi phục bài nộp về hàng đợi.
6. **Thử nghiệm Cài đặt Concurrency (Task 4.5):**
   - Chọn menu **"Cài đặt hệ thống (Settings)"**.
   - Kéo thanh trượt điều chỉnh số lượng worker (ví dụ lên 8 worker) và lưu cấu hình.
