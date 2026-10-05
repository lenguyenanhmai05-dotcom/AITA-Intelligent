# Cẩm Nang Thuyết Trình Cơ Sở Dữ Liệu (ERD Presentation Guide)
> **Dự án:** AITA-INTELLIGENT (SWP391-RBL - Đại học FPT)  
> **Phân hệ 5:** Redis Queue (BullMQ) & Git Teamwork Analytics (Anti-Free-Riding)  
> **Tài liệu phục vụ:** Thuyết trình Milestone 1, Báo cáo SRS/SDD & Bảo vệ trước Hội đồng

---

## PHẦN 1: TỔNG QUAN KIẾN TRÚC & TRIẾT LÝ THIẾT KẾ (DÙNG ĐỂ MỞ ĐẦU THUYẾT TRÌNH)

### 🎙️ Lời Mở Đầu Mẫu Khi Thuyết Trình (30 giây đầu):
> *"Kính thưa thầy/cô và các bạn, phân hệ 5 của nhóm em đảm nhận 2 trụ cột kỹ thuật then chốt: **(1) Điều phối hàng đợi chấm bài hàng loạt không nghẽn luồng bằng Redis/BullMQ** và **(2) Bóc tách kho mã nguồn Git để phát hiện gian lận và loại bỏ nạn Free-riding**.  
> Cơ sở dữ liệu của phân hệ 5 được thiết kế tuân thủ nghiêm ngặt **chuẩn hóa 3NF**, phân định rõ ràng giữa 2 phạm vi quản lý: **Phạm vi Lớp học (Class-scoped)** cho việc chấm bài cá nhân và **Phạm vi Nhóm đồ án (Team-scoped)** cho việc phân tích kho Git."*

---

## PHẦN 2: BẢNG CHI TIẾT TẤT TẦN TẬT 10 BẢNG TRONG ERD

### CỤM 1: QUẢN LÝ NGƯỜI DÙNG & LỚP HỌC (FOUNDATION)

#### 1. Bảng `USERS` (Thực thể người dùng dùng chung)
* **Mục đích:** Lưu trữ hồ sơ người dùng (Giảng viên, Sinh viên, Admin) kế thừa từ Core Subsystem, đồng thời mở rộng thông tin Git để nhận diện tác giả commit.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Định danh duy nhất của người dùng. |
  | `fullName` | VARCHAR(100) | NOT NULL | Họ và tên hiển thị trên bảng điểm và báo cáo nhóm. |
  | `email` | VARCHAR(100) | UK, NOT NULL | Email đăng nhập chính thức (thường là `@fpt.edu.vn`). |
  | `gitEmails` | TEXT | NULLABLE | **Điểm sáng:** Lưu danh sách các email phụ (như `@gmail.com`, no-reply) mà sinh viên dùng để commit code. |
  | `githubUsername`| VARCHAR(100) | NULLABLE | **Điểm sáng:** Username GitHub (ví dụ: `mai-le-05`) phục vụ việc đối chiếu người tạo Pull Request. |
  | `role` | VARCHAR(20) | NOT NULL | Phân quyền truy cập: `lecturer`, `student`, `admin`. |
* **Quan hệ:** 
  - 1 `USER` (Lecturer) dạy nhiều `CLASSES` (`1 - n`).
  - 1 `USER` (Student) tham gia nhiều `TEAM_MEMBERS` (`1 - n`).
  - 1 `USER` (Lecturer) tạo nhiều `GRADING_BATCHES` (`1 - n`).
  - 1 `USER` (Admin) cập nhật nhiều `SYSTEM_SETTINGS` (`1 - n`).

---

#### 2. Bảng `CLASSES` (Lớp học)
* **Mục đích:** Quản lý các lớp học do Giảng viên phụ trách, là đơn vị trung tâm để tổ chức chấm bài thi và phân chia nhóm sinh viên.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã lớp học duy nhất. |
  | `lecturerId` | BIGINT | FK (trỏ `users.id`) | Giảng viên sở hữu và phụ trách lớp học này. |
  | `className` | VARCHAR(100) | NOT NULL | Tên mã lớp (ví dụ: `SE1801`, `SWP391_FA26`). |
* **Quan hệ:** 
  - 1 `CLASS` chứa nhiều `TEAMS` làm đồ án (`1 - n`).
  - 1 `CLASS` có nhiều đợt chấm bài `GRADING_BATCHES` (`1 - n`).

---

#### 3. Bảng `TEAMS` (Nhóm sinh viên làm đồ án)
* **Mục đích:** Lưu trữ các nhóm làm việc chung trong 1 lớp học.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã nhóm duy nhất. |
  | `classId` | BIGINT | FK (trỏ `classes.id`) | Nhóm thuộc lớp học nào. |
  | `teamName` | VARCHAR(100) | NOT NULL | Tên nhóm (ví dụ: `Group 2 - AITA`). |
* **Quan hệ:** 
  - 1 `TEAM` có nhiều thành viên `TEAM_MEMBERS` (`1 - n`).
  - 1 `TEAM` nộp các lần phân tích kho mã nguồn `GIT_REPOS` (`1 - n`).

---

#### 4. Bảng `TEAM_MEMBERS` (Bảng trung gian n - n giữa Team và User)
* **Mục đích:** Giải quyết quan hệ nhiều - nhiều giữa Sinh viên và Nhóm, xác định ai là thành viên của nhóm nào.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã định danh bản ghi. |
  | `teamId` | BIGINT | FK (trỏ `teams.id`) | Thuộc nhóm nào. |
  | `userId` | BIGINT | FK (trỏ `users.id`) | Sinh viên nào. |
* **Ràng buộc đặc biệt (UK):** Cặp `(teamId, userId)` là **Unique Constraint** (Chống lỗi logic: 1 sinh viên không thể bị add trùng 2 lần vào cùng 1 nhóm).

---

### CỤM 2: HÀNG ĐỢI CHẤM BÀI HÀNG LOẠT (BATCH GRADING - REDIS BULLMQ)

#### 5. Bảng `GRADING_BATCHES` (Đợt chấm bài hàng loạt theo Lớp)
* **Mục đích:** Quản lý một đợt chấm bài cho cả lớp do Giảng viên khởi tạo (Scope: **Class-scoped**).
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã đợt chấm duy nhất. |
  | `classId` | BIGINT | FK (trỏ `classes.id`) | Đợt chấm của lớp nào (Ràng buộc BR-02: max 3 batch active/lớp). |
  | `createdBy` | BIGINT | FK (trỏ `users.id`) | Giảng viên nào bấm nút "Start grading". |
  | `batchName` | VARCHAR(100) | NOT NULL | **Điểm quan trọng:** Tên đợt chấm hiển thị trên UI (ví dụ: `Assignment 3 - Grading`). |
  | `priority` | VARCHAR(20) | NOT NULL | Mức ưu tiên hàng đợi theo BR-01: `Exam` (100) > `Assignment` (50) > `Practice` (10). |
  | `status` | VARCHAR(20) | DEFAULT 'waiting' | Trạng thái tổng: `waiting`, `active`, `completed`, `failed`. |
  | `createdAt` | DATETIME | DEFAULT NOW() | Thời điểm tạo đợt chấm để sắp xếp lịch sử. |
* **Quan hệ:** 1 `GRADING_BATCH` chứa danh sách nhiều tác vụ chấm con `GRADING_JOBS` (`1 - n`).

---

#### 6. Bảng `GRADING_JOBS` (Tác vụ chấm của từng bài nộp cụ thể)
* **Mục đích:** Quản lý vòng đời thực thi, đo đạc thời gian, xử lý lỗi retry và Dead-Letter Queue (DLQ) cho từng bài nộp.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã tác vụ chấm bài. |
  | `batchId` | BIGINT | FK (trỏ `grading_batches.id`)| Thuộc đợt chấm nào. |
  | `submissionId`| BIGINT | **External Ref** | **Chuẩn Microservices:** Mã tham chiếu logic trỏ sang bài nộp bên Core Subsystem, không tạo hard constraint để giảm dính chặt. |
  | `status` | VARCHAR(20) | DEFAULT 'waiting' | Trạng thái: `waiting`, `active`, `completed`, `failed`, `dead` (quarantined vào DLQ). |
  | `retryCount` | TINYINT | DEFAULT 0 | Số lần đã retry tự động (Capped ở tối đa 3 lần theo BR-04). |
  | `runtimeDurationMs`| INT | NULLABLE | Thời gian thực thi đo bằng mili-giây (phục vụ giám sát hiệu năng). |
  | `errorClassification`| VARCHAR(100)| NULLABLE | Phân loại nguyên nhân lỗi: `timeout`, `runtime_error`, `syntax_error`... |
  | `stackTrace` | **TEXT** | NULLABLE | **Điểm sáng:** Dùng kiểu TEXT để lưu vết trọn vẹn lỗi crash chi tiết mà không bị văng lỗi tràn độ dài chuỗi (Data truncated). |
  | `dismissed` | TINYINT(1) | DEFAULT 0 | Cờ đánh dấu giảng viên đã bỏ qua/đóng job lỗi trong màn hình DLQ (`0: false`, `1: true`). |
  | `dismissedBy` | BIGINT | FK (trỏ `users.id`)| Giảng viên nào xác nhận dismiss job này. |
  | `dismissedAt` | DATETIME | NULLABLE | Thời điểm giảng viên bấm dismiss. |
  | `createdAt` | DATETIME | DEFAULT NOW() | Thời điểm job được đẩy vào Redis queue. |
  | `updatedAt` | DATETIME | ON UPDATE NOW() | Thời điểm cập nhật trạng thái gần nhất. |

---

### CỤM 3: BÓC TÁCH GIT & ĐÁNH GIÁ ĐÓNG GÓP NHÓM (TEAMWORK ANALYTICS)

#### 7. Bảng `GIT_REPOS` (Kho lưu trữ mã nguồn nộp bởi nhóm)
* **Mục đích:** Quản lý kho Git mà một nhóm nộp để phân tích đóng góp (Scope: **Team-scoped**).
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã bản ghi nộp repo. |
  | `teamId` | BIGINT | FK (trỏ `teams.id`) | Kho mã nguồn của nhóm nào (Quy tắc BR-09: chỉ 1 repo pending/cloning cùng lúc). |
  | `repoUrl` | VARCHAR(255) | NOT NULL | Đường dẫn kho Git (ví dụ: `https://github.com/org/repo.git`). |
  | `branch` | VARCHAR(50) | DEFAULT 'main' | Tên nhánh cần bóc tách lịch sử commit. |
  | `isPrivate` | TINYINT(1) | DEFAULT 0 | Cờ đánh dấu kho công khai hay riêng tư (`0: Public`, `1: Private`). |
  | `patEncrypted`| **VARCHAR(512)**| NULLABLE | **Bảo mật cao (BR-08):** Mã hóa token GitHub PAT bằng chuẩn AES-256 trước khi lưu. Tuyệt đối không lưu plaintext! |
  | `cloneStatus` | VARCHAR(20) | DEFAULT 'pending'| Trạng thái tiến trình: `pending` -> `cloning` -> `success` / `failed`. |
  | `createdAt` | DATETIME | DEFAULT NOW() | Thời điểm nộp repository. |
  | `updatedAt` | DATETIME | ON UPDATE NOW() | Thời điểm hoàn tất bóc tách hoặc gặp sự cố. |
* **Quan hệ:** 
  - 1 `GIT_REPO` bóc tách được nhiều `GIT_COMMITS` (`1 - n`).
  - 1 `GIT_REPO` tạo ra bảng kết quả đánh giá cho các thành viên `MEMBER_CONTRIBUTIONS` (`1 - n`).

---

#### 8. Bảng `GIT_COMMITS` (Lịch sử bóc tách từng commit)
* **Mục đích:** Lưu trữ toàn bộ các commit được trích xuất bằng lệnh Git CLI (`git rev-list`, `git diff-tree`), gắn cờ gian lận commit.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã định danh commit trong hệ thống. |
  | `repoId` | BIGINT | FK (trỏ `git_repos.id`)| Commit thuộc kho Git nào. |
  | `commitHash` | VARCHAR(100) | NOT NULL | Mã SHA băm duy nhất của commit trong Git. |
  | `authorEmail`| VARCHAR(100) | NOT NULL | Email tác giả ghi nhận trong Git log (dùng để so khớp với `users`). |
  | `commitDate` | DATETIME | NOT NULL | Thời điểm commit được tạo (phục vụ vẽ biểu đồ tần suất coding). |
  | `linesAdded` | INT | DEFAULT 0 | Số dòng code thêm vào (sau khi đã lọc sạch file rác theo BR-13). |
  | `linesDeleted`| INT | DEFAULT 0 | Số dòng code bị xóa. |
  | `isSuspicious`| TINYINT(1) | DEFAULT 0 | **Điểm sáng (BR-10):** Cờ đánh dấu gian lận (`1: gian lận`, loại bỏ khỏi điểm đóng góp). |
  | `suspiciousReason`| VARCHAR(100)| NULLABLE | Lý do bắt gian lận: `whitespace-only` (farm code bằng khoảng trắng) hoặc `self-revert` (tự xóa commit liền trước). |

---

#### 9. Bảng `MEMBER_CONTRIBUTIONS` (Kết quả tính điểm & phát hiện Free-Rider)
* **Mục đích:** Lưu trữ kết quả tính toán đóng góp tổng hợp của từng thành viên sau khi chạy thuật toán chấm điểm.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã bản ghi kết quả đóng góp. |
  | `repoId` | BIGINT | FK (trỏ `git_repos.id`)| Kết quả của đợt phân tích repo nào. |
  | `userId` | BIGINT | FK (trỏ `users.id`) | Sinh viên được đánh giá. |
  | `prCount` | INT | DEFAULT 0 | Số lượng Pull Requests hợp lệ lấy từ GitHub REST API. |
  | `commitCount` | **INT** | DEFAULT 0 | **Điểm sáng:** Cache sẵn tổng số commit sạch (hợp lệ) của sinh viên để render báo cáo tức thì < 10ms. |
  | `locCount` | **INT** | DEFAULT 0 | **Điểm sáng:** Cache sẵn tổng số LOC sạch (đã trừ file rác & gian lận). |
  | `contributionPercentage`| FLOAT | DEFAULT 0.0 | **Công thức chuẩn (BR-11):** $40\% \text{ LOC} + 40\% \text{ Commits} + 20\% \text{ PRs}$. |
  | `isFreeRiding`| TINYINT(1) | DEFAULT 0 | **Trọng tâm đề tài (BR-12):** Bật cờ đỏ cảnh báo sinh viên lười nếu `% đóng góp < ngưỡng quy định` (mặc định 5%). |
  | `createdAt` | DATETIME | DEFAULT NOW() | Thời điểm chốt điểm đóng góp (Snapshot phục vụ lưu vết đồ án). |
* **Ràng buộc đặc biệt (UK):** Cặp `(repoId, userId)` là **Unique Constraint** (Đảm bảo mỗi lần phân tích, 1 sinh viên chỉ có duy nhất 1 bản ghi điểm số).

---

### CỤM 4: CẤU HÌNH THAM SỐ TOÀN HỆ THỐNG (SYSTEM SETTINGS)

#### 10. Bảng `SYSTEM_SETTINGS` (Bảng tham số động)
* **Mục đích:** Lưu trữ cấu hình hệ thống dưới dạng Key-Value do Quản trị viên (Admin) thay đổi lúc runtime mà không cần restart server.
* **Các trường dữ liệu:**
  | Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ Thực Tế |
  | :--- | :--- | :--- | :--- |
  | `id` | BIGINT | PK, Auto | Mã cấu hình. |
  | `settingKey` | VARCHAR(50) | **UK, NOT NULL** | Tên khóa cấu hình: `worker_concurrency` hoặc `free_riding_threshold`. |
  | `settingValue`| VARCHAR(50) | NOT NULL | Giá trị: `1–10` cho concurrency (BR-07), `1%–20%` cho threshold (BR-12). |
  | `updatedBy` | BIGINT | FK (trỏ `users.id`)| Admin nào đã chỉnh sửa tham số này. |
  | `updatedAt` | DATETIME | ON UPDATE NOW() | Ghi nhận thời điểm cập nhật phục vụ kiểm toán hệ thống. |

---

## PHẦN 3: BỘ CÂU HỎI "BẪY" THƯỜNG GẶP CỦA HỘI ĐỒNG & CÁCH TRẢ LỜI ĂN ĐIỂM TUYỆT ĐỐI

### ❓ Câu 1: *"Tại sao trong USERS lại có cả email, gitEmails và githubUsername? Sao không dùng 1 cột email cho gọn?"*
*   **Trả lời dõng dạc:**  
    > *"Dạ thưa thầy/cô, hệ thống của nhóm em tích hợp 2 cơ chế bóc tách khác nhau:  
    > - Lệnh Git CLI ở local khi bóc tách commit chỉ đọc được **Author Email** (`git log %ae`), mà thực tế sinh viên FPT hay dùng email cá nhân Gmail để commit thay vì email trường. Vì vậy `gitEmails` giúp hệ thống không bỏ sót bất kỳ commit nào của sinh viên.  
    > - Trong khi đó, GitHub REST API khi trả về danh sách Pull Request chỉ trả về **Username** (`user.login`) chứ không trả về email do chính sách bảo mật của GitHub. Nhóm em tách riêng `githubUsername` để đếm PR chính xác trong 1 câu gọi API, tránh bị nghẽn GitHub API Rate Limit ạ!"*

### ❓ Câu 2: *"Tại sao cột `submissionId` trong GRADING_JOBS không khai báo là Foreign Key (FK) trong sơ đồ này?"*
*   **Trả lời dõng dạc:**  
    > *"Dạ thưa thầy/cô, theo nguyên lý thiết kế hệ thống phân tán (Modular Monolith / Microservices), bảng `SUBMISSIONS` thuộc quyền sở hữu của Core Module (Phân hệ 1). Phân hệ 5 của nhóm em chỉ đóng vai trò là một dịch vụ hàng đợi (Queue Worker) nhận mã ID bài nộp để điều phối chấm. Việc để `submissionId` là **Logical Reference** thay vì Database-level Hard FK giúp hai phân hệ hoạt động độc lập, không bị phụ thuộc cứng vào nhau (Loose Coupling) ạ!"*

### ❓ Câu 3: *"Tại sao bảng GRADING_BATCHES lại liên kết với CLASSES chứ không phải TEAMS?"*
*   **Trả lời dõng dạc:**  
    > *"Dạ thưa thầy/cô, bài toán của Phân hệ 5 có 2 phạm vi quản lý khác nhau:  
    > - **Chấm bài thi/bài tập hàng loạt (Batch Grading)** được tổ chức theo Lớp (`CLASSES`), vì đây là các bài nộp cá nhân của sinh viên trong danh sách lớp. Quy tắc nghiệp vụ BR-02 cũng quy định 'Một lớp không quá 3 batch active'.  
    > - Chỉ có phần **Git Analytics** mới tổ chức theo Nhóm (`TEAMS`) vì kho mã nguồn đồ án là do cả nhóm cùng làm chung ạ!"*

### ❓ Câu 4: *"Tại sao trong MEMBER_CONTRIBUTIONS lại lưu cả `commitCount` và `locCount` trong khi có thể đếm từ GIT_COMMITS?"*
*   **Trả lời dõng dạc:**  
    > *"Dạ thưa thầy/cô, đây là kỹ thuật tối ưu hóa hiệu năng và lưu vết (Audit Snapshot):  
    > 1. Về hiệu năng: Bảng `git_commits` có thể chứa hàng chục ngàn dòng. Khi Giảng viên mở xem báo cáo nhóm, việc đọc sẵn `commitCount` và `locCount` giúp API phản hồi tức thì **dưới 10ms**, không cần chạy các câu lệnh `SUM()` và `COUNT()` tốn tài nguyên.  
    > 2. Về tính toàn vẹn: Khi kết thúc môn học chốt điểm, hai trường này đóng vai trò là 'Bản chụp bằng chứng' tại thời điểm chốt bài thi, sinh viên sau đó có commit thêm code thì điểm số chốt vẫn được bảo toàn nguyên vẹn ạ!"*
