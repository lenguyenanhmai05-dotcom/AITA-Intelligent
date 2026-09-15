# 📝 BÁO CÁO TÌM HIỂU & NHẬT KÝ SỬ DỤNG AI (AI LOGS)

**Họ và tên:** Ngô Sử Viết Anh  
**Mã sinh viên:** QE190240  
**Vai trò:** Thành Viên 4 – Frontend Engineer (Batch Grading & Queue UI - Web React/Vite)  
**Phân hệ:** Subsystem 5  

---

## I. Nhật Ký Sử Dụng AI (AI Logs)

| Ngày | Prompt / Yêu cầu gửi cho AI | Kết quả / Giải pháp AI cung cấp | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **15/09/2026** | Phân tích tài liệu yêu cầu Subsystem 5 và xác định vai trò, màn hình UI của Thành viên 4. | Liệt kê chi tiết 6 màn hình/modal (Trang 28, 30, 31, 33, 34-36, 43-44) và các quy tắc nghiệp vụ `BR-02`, `BR-03`. | Làm rõ phạm vi công việc & Requirement. |
| **15/09/2026** | Thiết kế kiến trúc UI React/Vite cho Dashboard giám sát hàng đợi và Batch Grading. | Gợi ý cấu trúc thư mục Component, custom hook `useQueuePolling` (refresh 2s), và state management cho batch selection. | Định hướng thiết kế kỹ thuật (Technical Design). |
| **15/09/2026** | Xây dựng logic UI cho Modal Cấu Hình Đợt Chấm và bắt lỗi quy tắc `BR-02`. | Viết giải pháp validate số lượng batch đang chạy ($\le 3$) và điều hướng sau khi trigger batch. | Chuẩn bị logic Code Frontend. |

---

## II. Báo Cáo Nghiên Cứu Phần Công Việc Đảm Nhận

### 1. Màn Hình & Chức Năng Phụ Trách
Xây dựng toàn bộ giao diện quản trị chấm bài hàng loạt và hệ thống giám sát hàng đợi thời gian thực, bao gồm 6 khu vực chính:
1. **Màn Hình Quản Lý Bài Nộp (`Submissions List` - Trang 28):** Bảng lọc/tìm kiếm bài nộp (*Not graded, Completed, Failed*) và checkbox chọn hàng loạt để bắt đầu chấm.
2. **Modal Cấu Hình Đợt Chấm (`Batch Config Modal` - Trang 30):** Form thiết lập độ ưu tiên đợt chấm (*Exam, Assignment, Practice*), validate quy tắc `BR-02` (tối đa 3 batch hoạt động đồng thời).
3. **Dashboard Giám Sát Hàng Đợi (`Queue Monitor Dashboard` - Trang 31):** Thẻ chỉ số (`Waiting`, `Active`, `Completed`, `Failed`), bảng danh sách Jobs và tự động gọi API Telemetry mỗi 2 giây (`BR-03`).
4. **Modal Chi Tiết Job (`Job Details Modal` - Trang 33):** Hiển thị `runtimeDurationMs`, số lần retry, phân loại lỗi và crash stack trace.
5. **Màn Hình & Modal DLQ (`DLQ Screen` - Trang 34, 35, 36):** Quản lý bài nộp bị lỗi nghiêm trọng, hỗ trợ "Trigger manual retry" (reset `retryCount`, chọn lại độ ưu tiên) hoặc "Dismiss job".
6. **Màn Hình Cài Đặt Hệ Thống (`System Settings` - Trang 43, 44):** Cấu hình `worker_concurrency` (nhập giá trị từ 1 đến 10).

### 2. Định Hướng Kỹ Thuật (Tech Stack & Architecture)
* **Framework & Styling:** React, Vite, TailwindCSS / Shadcn UI.
* **Xử lý Real-time (`BR-03`):** Cài đặt Polling 2s với React Query / `useInterval` để cập nhật trạng thái hàng đợi theo thời gian thực.
* **Tối ưu UX:** Tích hợp Debounce cho ô tìm kiếm và quản lý Bulk Selection hiệu quả.
