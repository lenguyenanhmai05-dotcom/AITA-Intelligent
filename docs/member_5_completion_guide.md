# 📘 BÁO CÁO HOÀN THIỆN NHIỆM VỤ THÀNH VIÊN 5 & TÀI LIỆU KỸ THUẬT CHI TIẾT

> **Dự án:** AITA-INTELLIGENT (Hệ thống Hỗ trợ Giảng dạy & Đánh giá Dự án Phần mềm Thông minh)  
> **Phân hệ 5 (Subsystem 5):** Redis Queue & Git Teamwork Analytics Platform  
> **Môn học:** SWP391 - Software Project (FPT University)  
> **Thành viên phụ trách:** Nguyễn Châu Khánh Linh (MSSV: QE180043)  
> **Vai trò kỹ thuật:** **Frontend Lead (Git UI) & QA Lead**  

---

## 🎯 PHẦN 1: PHÂN ĐỊNH RANH GIỚI VÀ TRÁCH NHIỆM THÀNH VIÊN 5

Căn cứ theo tài liệu phân công đồ án [`docs/team_task_allocation.md`](file:///c:/Users/Admin/AITA-Intelligent/docs/team_task_allocation.md) và tài liệu đặc tả giao diện [`docs/ui_screens_specification.md`](file:///c:/Users/Admin/AITA-Intelligent/docs/ui_screens_specification.md), Thành viên 5 chịu trách nhiệm toàn diện thiết kế và lập trình:
1. **Tầng Giao Diện Phân Tích Git (Git Analytics UI):** Màn hình nộp repo, thanh tiến trình bóc tách 4 bước, bảng điều khiển trung tâm Cyber Cockpit, bục vinh danh Podium và lưới nhiệt đóng góp 30 ngày (Activity Heatmap).
2. **Bộ Modal Chuyên Sâu & UX Tương Tác:** Modal kiểm toán thành viên chi tiết ([`MemberDetailsModal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/MemberDetailsModal.tsx)), modal cấu hình ngưỡng Free-Rider ([`FreeRidingThresholdModal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/FreeRidingThresholdModal.tsx)), modal cảnh báo commit gian lận ([`FraudDetectionModals.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/FraudDetectionModals.tsx)), bộ điều khiển phân trang Client-side và ngôn ngữ thiết kế **Luxury Terracotta Porcelain & Sunset Glass**.
3. **Trưởng Nhóm Đảm Bảo Chất Lượng (QA Lead):** Xây dựng bộ kiểm thử tự động toàn diện (11 Vitest test suites, 55 test cases đạt 100% Passed) kiểm tra toàn bộ các Business Rules từ `BR-04` đến `BR-13`, kiểm soát phân quyền RBAC và luồng tích hợp End-to-End.

### Bảng phân công nhiệm vụ chi tiết:

| Nhiệm vụ | Màn hình / Modal / Module phụ trách | Quy tắc nghiệp vụ (BR) | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Task 5.1: Giao diện Nộp Kho Git** | `GitRepoSubmissionForm.tsx` & `PATAuthModal.tsx` | `BR-08` (Mã hóa AES-256), `BR-09` (1 pending job/nhóm) | ✅ Hoàn thành 100% |
| **Task 5.2: Màn hình Tiến trình Stepper** | `ProgressStepper.tsx` & `useJobStatus.ts` | 4 bước xử lý ngầm (Cloning, Parsing, Noise, Scoring) | ✅ Hoàn thành 100% |
| **Task 5.3: Báo cáo Đóng góp Nhóm** | Tab `report` trong `DashboardPortal.tsx` | `BR-11` (Công thức 40/40/20), Bục vinh danh, Heatmap | ✅ Hoàn thành 100% |
| **Task 5.4: Bộ Modal Phân Tích & Ngưỡng** | `MemberDetailsModal.tsx` & `FreeRidingThresholdModal.tsx` | `BR-12` (Ngưỡng 1%–20%), Cảnh báo Sprint-dumping | ✅ Hoàn thành 100% |
| **Task 5.5: Phân trang & UX Glassmorphism** | Client-side Pagination (Task 17) & Design Tokens (Task 18) | WCAG AA Contrast, Theme Toggle, Đa ngôn ngữ VI/EN | ✅ Hoàn thành 100% |
| **QA Lead: Kiểm thử Tự động 100%** | 11 Test Suites (Vitest / React Testing Library) | Độ bao phủ toàn diện từ `BR-04` đến `BR-13` (55 tests) | ✅ 55/55 Passed (100%) |

---

## 🖥️ PHẦN 2: CHI TIẾT CÁC MÀN HÌNH VÀ TÍNH NĂNG ĐÃ TRIỂN KHAI

### 1. Task 5.1: Giao Diện Nộp Kho Git (`GitRepoSubmissionForm.tsx` & `PATAuthModal.tsx`)
- **Vị trí code:** [`apps/web/src/components/git-analytics/GitRepoSubmissionForm.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/GitRepoSubmissionForm.tsx)
- **Thành phần giao diện & Nghiệp vụ:**
  - **Form nhập thông tin repository:**
    - Dropdown chọn Nhóm sinh viên (`Team / Group`).
    - Ô nhập URL GitHub repository (`https://github.com/owner/repo.git`) có regex validation định dạng Git URL.
    - Ô chọn nhánh phân tích (mặc định điền sẵn `"main"`).
  - **Bảo mật Personal Access Token (PAT) theo `BR-08`:**
    - Nút gạt chuyển đổi `Kho riêng tư (Private repository)`.
    - Khi bật, popup [`PATAuthModal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/PATAuthModal.tsx) tự động xuất hiện: ô nhập mật khẩu dạng chấm tròn bảo mật `••••••••`, ghi rõ chỉ yêu cầu quyền tối thiểu `repo:read`. Token được mã hóa AES-256-CBC an toàn tại backend và không bao giờ lưu lộ thiên.
  - **Kiểm tra ràng buộc `BR-09`:** Hệ thống tự động kiểm tra mỗi nhóm chỉ được có tối đa 1 tác vụ phân tích đang chạy. Nếu vi phạm, hiển thị thông báo lỗi rõ ràng.

---

### 2. Task 5.2: Màn Hình Tiến Trình Stepper 4 Bước (`ProgressStepper.tsx`)
- **Vị trí code:** [`apps/web/src/components/git-analytics/ProgressStepper.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/ProgressStepper.tsx)
- **Thành phần & Trải nghiệm UX:**
  - **Thanh Stepper 4 bước ngang sinh động:**
    - *Bước 1: 📥 Cloning repository* (Bare clone sandbox cách ly).
    - *Bước 2: 🔍 Parsing commits* (Bóc tách commit log bằng Git CLI).
    - *Bước 3: 🧹 Filtering noise* (Lọc bỏ `node_modules`, lockfiles, dist theo `BR-13`).
    - *Bước 4: 📊 Scoring & Heuristics* (Tính điểm 40/40/20 và quét gian lận).
  - Trạng thái trực quan: Bước đang chạy có vòng xoay Loading Spinner; Bước hoàn thành chuyển sang màu xanh ngọc với dấu tích `✓`.
  - **Tự động chuyển tiếp:** Khi bước 4 hoàn tất, hệ thống tự động điều hướng mượt mà sang Màn hình Báo cáo (`activeTab = 'report'`).

---

### 3. Task 5.3: Báo Cáo Đóng Góp Nhóm & Bục Vinh Danh (Tab `report` trong `DashboardPortal.tsx`)
- **Vị trí code:** [`apps/web/src/components/DashboardPortal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/DashboardPortal.tsx#L3680-L4650)
- **Kiến trúc giao diện chia làm 3 Vùng (Regions) đẳng cấp quốc tế:**
  1. **Region 1: AITA Cyber Command Deck (HUD Cockpit):**
     - Đèn tín hiệu nhịp tim thời gian thực: Terracotta Pulse Signal.
     - Vòng cung đo chỉ số hòa hợp nhóm 180°: **Synergy Gauge 94/100 (Rất tốt)**.
     - Biểu đồ radar năng lực 5 cực (**5-Axis Competency Radar**): Commit, Net LOC, PRs, Pacing, Audit.
     - Cửa sổ nhật ký dòng lệnh trực tiếp: `LIVE_TELEMETRY.LOG` ghi nhận từng mốc bóc tách.
     - 4 Thẻ chỉ số Cyber KPI HUD:
       - *Tổng commits hợp lệ:* `104 lượt` (Đã lọc 14 commits rác).
       - *Dòng mã thực (Net LOC):* `+8,360 dòng` (Độ chuẩn xác 98.2%).
       - *Nhịp độ đóng góp:* `14.8 commits/ngày` (Không có hiện tượng sprint-dumping).
       - *Nguy cơ Free-Rider:* `1 / 4` cảnh báo đỏ cam nổi bật.
  2. **Region 2: 3D Hall of Fame Podium & Activity Heatmap:**
     - **Bục vinh danh 3D Podium Cards:**
       - Quán quân MVP (#1): Viền ánh kim vàng `#F59E0B`, huy hiệu `👑 QUÁN QUÂN (MVP)`.
       - Đóng góp xuất sắc (#2): Huy hiệu bạc `🥈 ĐÓNG GÓP XUẤT SẮC`.
       - Tác giả tích cực (#3): Huy hiệu đồng `🥉 TÁC GIẢ TÍCH CỰC`.
       - Thành viên cần chú ý (#4): Huy hiệu cảnh báo `⚠️ CẦN HỖ TRỢ`.
     - **Thanh Capsule Pill Bar 38px:** Trực quan hóa tỷ lệ phần trăm đóng góp của từng thành viên với viền ngăn cách sắc nét và hiệu ứng bóng gương phản chiếu.
     - **Lưới nhiệt hoạt động 30 ngày (Activity Heatmap Matrix):** Ma trận 4 tuần $\times$ 7 ngày (T2 $\to$ CN), 5 cấp độ màu sắc từ ít đến nhiều, hỗ trợ tooltip rê chuột xem ngày, số commit và danh sách tác giả thực hiện.
  3. **Region 3: Bảng Xếp Hạng & Ma Trận Kiểm Toán Thành Viên:**
     - Bộ nút lọc nhanh (Filter Chips): `Tất cả (4)`, `👑 MVP (1)`, `⚡ Core (2)`, `⚠️ Cần chú ý (1)`.
     - Bảng ma trận 6 cột: Thành viên (Avatar + Email), Commits, Pull Requests, Net LOC, Tỷ lệ % đóng góp (kèm thanh Micro-progress bar lồng trực tiếp), Đánh giá và Nút `🔍 Xem` chi tiết.

---

### 4. Task 5.4: Bộ Modal Phân Tích Chuyên Sâu & Cấu Hình Ngưỡng

#### A. Modal Chi Tiết Thành Viên ([`MemberDetailsModal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/MemberDetailsModal.tsx))
- **Kích hoạt:** Bấm nút `🔍 Xem` trên bảng thành viên hoặc click vào thẻ Podium bất kỳ.
- **Tính năng độc quyền:**
  - **4 Thẻ Metric lớn:** Tổng Commits, Dòng thêm `+`, Dòng xóa `-`, Net LOC ròng.
  - **Biểu đồ cột Sprint Pacing Timeline:** Biểu diễn số lượng commit theo từng ngày. Tự động tính toán tỷ lệ dồn commit và kích hoạt huy hiệu `⚠️ Cảnh báo: Dồn commit sát deadline (Sprint-dumping)` nếu thành viên dồn $>70\%$ công việc vào ngày cuối.
  - **Bảng kiểm toán commit chi tiết:** 5 cột (Mã SHA-1 rút gọn 7 ký tự, mốc thời gian, nội dung commit, biến động Net LOC và trạng thái kiểm toán `✓ Valid` / `⚠️ Flagged`).
  - **Bộ điều khiển phân trang Client-side (Task 17):**
    - Dropdown chọn số dòng: `5`, `10`, `25`, `50`.
    - Điều hướng trang: `« Trang đầu`, `‹ Trước`, `Sau ›`, `Trang cuối »`.
    - Bộ đếm thời gian thực: `1 - 5 / 12` và `1 / 3`.
    - Cố định tiêu đề bảng cuộn (`position: sticky`).

#### B. Modal Cấu Hình Ngưỡng Cảnh Báo Free-Rider ([`FreeRidingThresholdModal.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/FreeRidingThresholdModal.tsx))
- **Kích hoạt:** Bấm nút `⚙️ Ngưỡng Free-Rider: 5%` (phân quyền chỉ Giảng viên và Admin mới thấy).
- **Tính năng nghiệp vụ:**
  - Đồng bộ 2 chiều giữa **Thanh trượt tương tác (Range Slider)** và **Ô nhập số (Number Input)**.
  - **Ràng buộc quy tắc BR-12:** Giới hạn nghiêm ngặt trong khoảng $[1\%, 20\%]$, giá trị mặc định là $5\%$.
  - Hiển thị cảnh báo lỗi thời gian thực và khóa nút Lưu khi nhập giá trị ngoài biên hợp lệ.
  - Phím tắt `Escape` và click backdrop để đóng nhanh cửa sổ chuẩn Accessibility.

#### C. Modal Bắt Gian Lận Commit ([`FraudDetectionModals.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/FraudDetectionModals.tsx))
- Hiển thị danh sách các commit bị hệ thống bắt cờ `isSuspicious = true` kèm lý do chi tiết theo `BR-10`:
  - `Whitespace-only`: Sửa khoảng trắng, tab để farm chỉ số dòng mã.
  - `Self-revert`: Tác giả tự hoàn tác commit trước đó của chính mình.

---

### 5. Task 5.5: Ngôn Ngữ Thiết Kế Luxury Terracotta Porcelain & Sunset Glass
- **Màu sắc chủ đạo:**
  - Nền sứ ngọc trai: `#FFFAF6` (Light mode) và Deep Roasted Terracotta `#241411` (Dark mode).
  - Viền đất nung mềm mại: `var(--color-terracotta-200, #F7DBCC)`.
  - Typography sắc nét: Nâu Mocha quý phái `var(--color-terracotta-900, #7A3E2E)`.
  - Hiệu ứng kính mờ cao cấp: `backdrop-filter: blur(16px)`.
- **Loại bỏ triệt để hiện tượng "xanh xanh đỏ đỏ":**
  - Không sử dụng màu xanh neon hay đỏ cờ gây chói mắt. Toàn bộ các huy hiệu cảnh báo và thanh đo rủi ro đều được tinh chỉnh về dải Terracotta Amber và Muted Sunset, vừa nổi bật tính cảnh báo vừa đảm bảo sự đồng bộ sang trọng.
  - Đáp ứng trọn vẹn tiêu chuẩn tương phản quốc tế **WCAG AA**.

---

## 🧪 PHẦN 3: BỘ KIỂM THỬ TỰ ĐỘNG (QA LEAD - 55/55 TESTS PASSED)

Là **QA Lead** của dự án, Thành viên 5 đã thiết kế và thực thi toàn bộ **11 bộ test suite tự động** bằng **Vitest** và **React Testing Library**, đạt độ bao phủ toàn diện và tỷ lệ thành công **100% (55/55 tests)**:

| STT | File Test Suite | Số Test | Quy Tắc Nghiệp Vụ & Phạm Vi Kiểm Thử | Kết Quả |
| :---: | :--- | :---: | :--- | :---: |
| 1 | [`GitExponentialBackoff.test.ts`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/GitExponentialBackoff.test.ts) | 5 | Công thức $2^{\text{retryCount}}$ giây (`BR-04`), tối đa 3 lần retry (`BR-05`), cách ly DLQ và reset retry khi Replay (`BR-06`). Dùng `vi.useFakeTimers()`. | ✅ Passed |
| 2 | [`GitNoiseFilter.test.ts`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/GitNoiseFilter.test.ts) | 6 | Bộ lọc đường dẫn loại trừ `node_modules`, `dist`, `package-lock.json`, file nhị phân, bảo toàn LOC thực chất (`BR-13`). | ✅ Passed |
| 3 | [`GitFraudHeuristics.test.ts`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/GitFraudHeuristics.test.ts) | 8 | Thuật toán Regex phát hiện commit chỉ sửa khoảng trắng (*whitespace-only*) và tự hoàn tác (*self-revert*) theo `BR-10`. | ✅ Passed |
| 4 | [`ContributionScoring.test.ts`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/ContributionScoring.test.ts) | 7 | Công thức $40\% \text{ LOC} + 40\% \text{ Commits} + 20\% \text{ PRs}$ (`BR-11`), xử lý chia cho 0 khi repo rỗng, kích hoạt cờ Free-Rider (`BR-12`). | ✅ Passed |
| 5 | [`RBACAccessGate.test.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/RBACAccessGate.test.tsx) | 5 | Phân quyền bảo mật: Ẩn nút cấu hình ngưỡng với `student`, mở quyền cấu hình cho `lecturer` và `admin`. | ✅ Passed |
| 6 | [`GitAnalyticsE2EFlow.test.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/GitAnalyticsE2EFlow.test.tsx) | 1 | Luồng E2E hoàn chỉnh: Nộp repo $\to$ Stepper $\to$ Báo cáo $\to$ Modal chi tiết $\to$ Nâng ngưỡng đổi cờ Free-Rider. | ✅ Passed |
| 7 | [`MemberDetailsModal.test.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/MemberDetailsModal.test.tsx) | 8 | 4 thẻ metric, phân trang commit log (`Task 17`), cảnh báo Sprint-dumping, phím Escape, Dark mode & English localization (`Task 18`). | ✅ Passed |
| 8 | [`FreeRidingThresholdModal.test.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/FreeRidingThresholdModal.test.tsx) | 5 | Ràng buộc nghiệp vụ $[1\%, 20\%]$ (`BR-12`), đồng bộ 2 chiều slider & input, phím Escape, chặn lưu khi ngoài khoảng. | ✅ Passed |
| 9 | [`GitRepoSubmissionForm.test.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/GitRepoSubmissionForm.test.tsx) | 4 | Form nộp repo, toggle Private/Public, PAT modal authentication, submit handler. | ✅ Passed |
| 10 | [`ProgressStepper.test.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/ProgressStepper.test.tsx) | 3 | Trạng thái hiển thị 4 bước phân tích, hiệu ứng xoay loading và trạng thái hoàn thành. | ✅ Passed |
| 11 | [`FraudDetectionModals.test.tsx`](file:///c:/Users/Admin/AITA-Intelligent/apps/web/src/components/git-analytics/__tests__/FraudDetectionModals.test.tsx) | 3 | Modal hiển thị danh sách commit gian lận, lý do cảnh báo và nút đóng. | ✅ Passed |
| **Tổng** | **11 Test Suites** | **55 Tests** | **Cam kết độ bao phủ Code Coverage $\ge 80\%$ cho Phân hệ 5** | **100% Passed** |

---

## 🎬 PHẦN 4: HƯỚNG DẪN VẬN HÀNH & KỊCH BẢN DEMO BẢO VỆ ĐỒ ÁN

### 1. Lệnh Kiểm Tra Hệ Thống
```bash
# 1. Kiểm tra biên dịch TypeScript (0 lỗi)
npx tsc --noEmit -p apps/web/tsconfig.json

# 2. Chạy toàn bộ 55 Unit & Integration Tests
npx vitest run

# 3. Khởi động môi trường phát triển đầy đủ
npm run dev:all
```

### 2. Kịch Bản Demo Trực Tiếp Trước Hội Đồng (Milestone 3 & Final Defense)
1. **Bước 1: Nộp kho Git & Giám sát Stepper**
   - Đăng nhập tài khoản Giảng viên, chọn tab **"Phân Tích Git Repo"**.
   - Nhập URL repository GitHub, bật công tắc Private $\to$ Nhập PAT token an toàn trong popup.
   - Bấm **"Bắt Đầu Phân Tích"** $\to$ Quan sát Stepper 4 bước chạy lần lượt qua các trạng thái Cloning, Parsing, Filtering, Scoring.
2. **Bước 2: Trình diễn Báo cáo & Bục vinh danh**
   - Hệ thống tự động chuyển sang trang **"Báo Cáo Đóng Góp & Free-Rider"**.
   - Giới thiệu đồng hồ Synergy Gauge 94/100, Radar 5 cực và 4 thẻ Cyber HUD.
   - Chỉ rõ Bục vinh danh với Quán quân MVP (#1) và sinh viên bị cảnh báo Free-Rider (#4).
   - Rê chuột vào các ô trên **Lưới nhiệt hoạt động 30 ngày (Heatmap)** để xem chi tiết commit.
3. **Bước 3: Kiểm toán chuyên sâu & Bắt Sprint-dumping**
   - Bấm nút **`🔍 Xem`** trên dòng của sinh viên $\to$ Modal chi tiết mở ra.
   - Giới thiệu biểu đồ nhịp độ Sprint Pacing: giải thích tính năng tự động phát hiện dồn commit sát hạn nộp (*Sprint-dumping*).
   - Thao tác chuyển đổi phân trang: đổi từ 5 dòng sang 10 dòng, bấm nút `Sau ›`, `« Trang đầu`.
4. **Bước 4: Điều chỉnh ngưỡng Free-Rider thời gian thực (`BR-12`)**
   - Bấm nút **`⚙️ Ngưỡng Free-Rider: 5%`** ở góc phải màn hình.
   - Kéo thanh trượt từ $5\%$ lên $15\%$ $\to$ Thấy ô số tự động nhảy theo.
   - Thử nhập $25\%$ $\to$ Hệ thống lập tức báo lỗi đỏ và chặn lưu.
   - Bấm phím `Escape` $\to$ Cửa sổ đóng mượt mà.

---

## 📑 PHẦN 5: BẢNG TỔNG HỢP CÔNG VIỆC SDLC (DÀNH CHO FILE EXCEL BÁO CÁO FPT)

| Mã Task | Tên Nhiệm Vụ | Hạng Mục / Chặng | Thời Lượng | Kết Quả Bàn Giao | Trạng Thái |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **TASK-13** | Xây dựng Stepper tiến trình phân tích | Chặng 1 | 3.5h | Component `ProgressStepper.tsx`, 4 bước hiển thị động | **Hoàn thành** |
| **TASK-14** | Custom Hook giám sát trạng thái Job | Chặng 1 | 2.5h | Hook `useJobStatus.ts`, polling background job | **Hoàn thành** |
| **TASK-15** | Tách và xây dựng `MemberDetailsModal.tsx` | Chặng 2 | 4.0h | Modal chi tiết thành viên, 4 thẻ metric, timeline histogram | **Hoàn thành** |
| **TASK-16** | Xây dựng `FreeRidingThresholdModal.tsx` | Chặng 2 | 3.0h | Modal cấu hình ngưỡng BR-12, slider đồng bộ 2 chiều | **Hoàn thành** |
| **TASK-17** | Phân trang & Sticky Table commit log | Chặng 2 | 3.5h | Bộ chọn pageSize 5/10/25/50, nút điều hướng, sticky header | **Hoàn thành** |
| **TASK-18** | Tối ưu hóa Luxury Glassmorphism & Đa ngôn ngữ | Chặng 2 | 2.5h | Palette Terracotta Porcelain, tương phản WCAG AA, song ngữ VI/EN | **Hoàn thành** |
| **TASK-19** | Unit Test Exponential Backoff & Retry | Chặng 3 | 3.0h | Bộ test `GitExponentialBackoff.test.ts` (5 tests) với Fake Timers | **Hoàn thành** |
| **TASK-20** | Unit Test Git Noise Filtering Engine | Chặng 3 | 2.5h | Bộ test `GitNoiseFilter.test.ts` (6 tests) lọc sạch rác theo BR-13 | **Hoàn thành** |
| **TASK-21** | Unit Test Regex Heuristic Fraud Detection | Chặng 3 | 3.5h | Bộ test `GitFraudHeuristics.test.ts` (8 tests) bắt whitespace & revert | **Hoàn thành** |
| **TASK-22** | Unit Test 40/40/20 Contribution Scoring | Chặng 3 | 3.0h | Bộ test `ContributionScoring.test.ts` (7 tests) xử lý chia cho 0 | **Hoàn thành** |
| **TASK-23** | Unit Test Role-Based Access Control (RBAC) | Chặng 3 | 2.5h | Bộ test `RBACAccessGate.test.tsx` (5 tests) kiểm soát quyền student | **Hoàn thành** |
| **TASK-24** | Unit Test End-to-End Integration Flow | Chặng 3 | 3.5h | Bộ test `GitAnalyticsE2EFlow.test.tsx` (1 flow lớn) kiểm thử liên hoàn | **Hoàn thành** |
| **TASK-FINAL** | Tài liệu Báo cáo Kỹ thuật Thành viên 5 | Chặng 4 | 2.0h | File `docs/member_5_completion_guide.md`, 55/55 tests passed | **Hoàn thành** |
