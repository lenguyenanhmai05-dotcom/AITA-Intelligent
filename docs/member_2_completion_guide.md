# 📘 BÁO CÁO HOÀN THIỆN NHIỆM VỤ THÀNH VIÊN 2 & GIẢI TRÌNH YÊU CẦU CỦA GIẢNG VIÊN

---

## 🎯 PHẦN 1: PHÂN CÔNG VÀ TRÁCH NHIỆM CỦA THÀNH VIÊN 2

> **Vai trò:** Git Engine & Heuristics Specialist  
> **Trọng tâm kỹ thuật:** Git CLI Parser, Bare Clone Sandbox, Fraud Detection

### Phân định ranh giới nhiệm vụ:

| Nhiệm vụ | Thuộc Milestone | Mô tả | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Mã hóa PAT bằng AES-256** | Milestone 2 (BR-08) | Bảo vệ token GitHub khi lưu trữ vào Database | ✅ Hoàn thành |
| **Bare Clone Sandbox** | Milestone 2 (UC-07) | Môi trường cách ly an toàn để clone repo | ✅ Hoàn thành |
| **Kiểm tra 1 pending/nhóm** | Milestone 2 (BR-09) | Mỗi nhóm chỉ được có 1 phân tích đang chạy | ✅ Hoàn thành |
| **Git Log Parser** | Milestone 3 (UC-08) | Bóc tách lịch sử commit thực tế bằng CLI | ✅ Hoàn thành |
| **Lọc file rác** | Milestone 3 (BR-13) | Bỏ qua `node_modules`, `dist`, `yarn.lock`... | ✅ Hoàn thành |
| **Bắt Whitespace-only** | Milestone 3 (BR-10) | Phát hiện commit chỉ thêm khoảng trắng | ✅ Hoàn thành |
| **Bắt Self-revert** | Milestone 3 (BR-10) | Phát hiện commit tự đảo ngược chính mình | ✅ Hoàn thành |
| **GitHub PR API** | Milestone 3 (UC-09) | Đếm số Pull Request thực tế của từng thành viên | ✅ Hoàn thành |
| **Công thức tính điểm 40/40/20** | Milestone 3 (BR-11) | Tính % đóng góp chuẩn xác theo 3 chỉ số | ✅ Hoàn thành |

---

## 👤 PHẦN 2: CHI TIẾT HOÀN THIỆN THÀNH VIÊN 2 (Git Engine Specialist)

### 1. Mã hóa PAT bằng AES-256-CBC (`BR-08`)
- **Vị trí code:** [`apps/api/src/controllers/gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Cơ chế:**
  - Sử dụng thư viện `crypto` chuẩn của Node.js — không cần cài thêm gói bên ngoài.
  - Tạo **IV ngẫu nhiên 16 bytes** cho mỗi lần mã hóa, đảm bảo cùng một token sẽ cho ra chuỗi mã hóa khác nhau mỗi lần.
  - Kết quả: `iv_hex:encrypted_hex` — lưu an toàn vào Database.
  - PAT được inject vào URL clone ở dạng thuần túy trong RAM, **không bao giờ ghi ra file**.
  ```typescript
  function encryptPAT(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }
  ```

### 2. Bare Clone Sandbox — Môi trường cách ly an toàn (`UC-07`)
- **Vị trí code:** [`apps/api/src/controllers/gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Nghiệp vụ:**
  - Mỗi lần phân tích tạo ra một thư mục sandbox độc lập: `scratch/clones/repo_<timestamp>/`
  - Chạy lệnh `git clone --bare` để chỉ lấy metadata Git, **không tải source code** về máy server.
  - Tự động **xóa toàn bộ sandbox** sau khi phân tích xong hoặc gặp lỗi — không để lại rác.
  - API phản hồi ngay lập tức, việc clone chạy **ngầm dưới nền** (background async job).
  ```typescript
  const sandboxDir = path.join(process.cwd(), 'scratch', 'clones', jobId);
  fs.mkdirSync(sandboxDir, { recursive: true });
  await execAsync(`git clone --bare --branch ${branch} "${cloneUrl}" "${sandboxDir}"`);
  // ...sau khi hoàn thành...
  fs.rmSync(sandboxDir, { recursive: true, force: true }); // Dọn sạch
  ```

### 3. Kiểm tra ràng buộc 1 job pending/nhóm (`BR-09`)
- **Vị trí code:** [`apps/api/src/controllers/gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Nghiệp vụ:**
  - Mỗi nhóm (`groupId`) chỉ được có **tối đa 1 phân tích đang chạy** (status là `cloning` hoặc `parsing`) tại một thời điểm.
  - Nếu vi phạm: Trả về HTTP **409 Conflict** với thông báo tiếng Việt rõ ràng.
  ```typescript
  const activeJob = Object.values(analysisStore).find(
    j => j.groupId === String(groupId) && (j.status === 'cloning' || j.status === 'parsing')
  );
  if (activeJob) return res.status(409).json({ message: 'Nhóm đang có phân tích đang chạy (BR-09)' });
  ```

### 4. Git Commit Log Parser (`UC-08`)
- **Vị trí code:** Hàm `parseGitLog()` trong [`gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Kỹ thuật:**
  - Chạy lệnh thực tế: `git -C <repoDir> log --format="COMMIT|%H|%ae|%an|%aI" --numstat`
  - Format riêng với prefix `COMMIT|` để phân biệt header commit với numstat lines.
  - Mỗi commit trích xuất đầy đủ: `hash`, `authorEmail`, `authorName`, `date`, `linesAdded`, `linesDeleted`.
  - Buffer tối đa 50MB để xử lý được repo lớn.

### 5. Bộ lọc file rác (`BR-13`) — `isNoisePath()`
- **Vị trí code:** [`gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Danh sách file/folder bị loại khỏi việc đếm LOC:**

  | Loại file | Pattern |
  |---|---|
  | Dependencies | `node_modules/` |
  | Build output | `dist/`, `build/`, `.next/`, `out/` |
  | Lock files | `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
  | Config bí mật | `.env` |
  | Assets | `*.min.js`, `*.min.css` |

### 6. Heuristic 1: Bắt Whitespace-only (`BR-10`) — `detectWhitespaceOnly()`
- **Vị trí code:** [`gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Thuật toán:**
  - Lấy toàn bộ nội dung `git show <hash>` của commit.
  - Lọc ra các dòng bắt đầu bằng `+` hoặc `-` (dòng bị thay đổi thực sự).
  - Kiểm tra nếu **100% dòng thay đổi chỉ là khoảng trắng/tab** → đánh dấu `isSuspicious = true`.
  ```typescript
  const meaningless = changedLines.filter(l => l.slice(1).trim() === '');
  return meaningless.length === changedLines.length; // true → gian lận
  ```
  - *Kịch bản bắt được:* Sinh viên mở file, ấn Enter vài lần rồi commit để tăng số dòng code.

### 7. Heuristic 2: Bắt Self-revert (`BR-10`) — `detectSelfRevert()`
- **Vị trí code:** [`gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Thuật toán:**
  - So sánh commit hiện tại với commit ngay trước đó của **cùng tác giả**.
  - Nếu số dòng thêm/xóa **đảo ngược nhau** (±2 dòng sai số) → đây là Self-revert.
  ```typescript
  if (curr.authorEmail === prev.authorEmail &&
      Math.abs(curr.linesAdded - prev.linesDeleted) <= 2 &&
      Math.abs(curr.linesDeleted - prev.linesAdded) <= 2) {
    return true; // Self-revert phát hiện!
  }
  ```
  - *Kịch bản bắt được:* Sinh viên commit thêm 50 dòng, rồi ngay sau đó `git revert` để xóa 50 dòng đó → farm 100 LOC ảo.

### 8. GitHub PR API (`UC-09`) — `fetchGitHubPRs()`
- **Vị trí code:** [`gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Endpoint GitHub được gọi:**
  ```
  GET https://api.github.com/repos/{owner}/{repo}/pulls?state=all&per_page=100
  ```
- **Tính năng:**
  - Tự động trích xuất `owner/repo` từ URL GitHub.
  - Hỗ trợ **xác thực bằng PAT** cho repo private.
  - Đếm số PR theo từng `authorLogin` và ghép vào dữ liệu đóng góp.
  - Xử lý lỗi graceful: Nếu gọi API thất bại → bỏ qua PRs, **không crash toàn bộ pipeline**.

### 9. Công thức tính điểm đóng góp 40/40/20 (`BR-11`) — `calcContribution()`
- **Vị trí code:** [`gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts)
- **Công thức chuẩn:**
  $$\text{contributionPercentage} = 40\% \times \frac{\text{LOC}}{\text{totalLOC}} + 40\% \times \frac{\text{Commits}}{\text{totalCommits}} + 20\% \times \frac{\text{PRs}}{\text{totalPRs}}$$
- **Xử lý ngoại lệ chia 0 (`13.1.E1`):** Nếu tổng là 0 thì đặt mặc định là 1 để tránh crash.
- **Kết quả:** Danh sách thành viên được sắp xếp giảm dần theo %, kèm badge màu để hiển thị trên biểu đồ.

### 10. Luồng hoàn chỉnh — `POST /api/git/analyze` → `GET /api/git/report`
```
Frontend bấm "Start Analysis"
        ↓
POST /api/git/analyze { url, branch, groupId, patToken }
        ↓
[Kiểm tra BR-09] → Reject nếu nhóm đang có job chạy
        ↓
[Mã hóa PAT AES-256] → encryptPAT()
        ↓
[Tạo Sandbox] → scratch/clones/repo_xxx/
        ↓
Phản hồi ngay: { jobId, status: "cloning" }
        ↓  (Background job tiếp tục chạy ngầm)
[git clone --bare] → Clone về sandbox
        ↓
[parseGitLog()] → Đọc toàn bộ lịch sử commit
        ↓
[isNoisePath()] → Lọc bỏ file rác khỏi LOC
        ↓
[detectWhitespaceOnly() + detectSelfRevert()] → Đánh cờ commit gian lận
        ↓
[fetchGitHubPRs()] → Lấy số PR từ GitHub API
        ↓
[calcContribution()] → Tính điểm 40/40/20
        ↓
[Xóa sandbox] → Dọn sạch thư mục tạm
        ↓
GET /api/git/report?jobId=xxx → Trả báo cáo hoàn chỉnh
```

---

## 🚀 PHẦN 3: HƯỚNG DẪN CHẠY DEMO HỆ THỐNG

Mở terminal trong thư mục `c:\SWP391_Group2\AITA-Intelligent`:

| Thành phần | Lệnh thực thi | Địa chỉ truy cập |
| :--- | :--- | :--- |
| **Giao diện Web (Frontend)** | `npm run dev:web` | [http://localhost:3000](http://localhost:3000) |
| **Máy chủ API (Backend)** | `npm run dev:api` | [http://localhost:4000](http://localhost:4000) |
| **Toàn bộ hệ thống** | `npm run dev:all` | Tất cả cùng lúc |

### Test API trực tiếp:
```bash
# Gửi yêu cầu phân tích repo
curl -X POST http://localhost:4000/api/git/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/<your-org>/aita-fraud-demo","branch":"main","groupId":2}'

# Xem báo cáo (dùng jobId trả về từ bước trên)
curl http://localhost:4000/api/git/report?jobId=repo_xxx
```

### Kịch bản Demo trước Hội đồng (Final Defense):
1. **Demo bắt Whitespace-only:** Mở repo demo, commit có commit message `refactor: clean up formatting` → Hệ thống tự động phát hiện và hiển thị trong tab **"Flagged Commits"** màu đỏ.
2. **Demo bắt Self-revert:** Repo demo có commit thêm 50 dòng, commit tiếp theo revert → Hệ thống đánh dấu cả 2 commit là `Self-revert`.
3. **Demo Free-Rider:** Tài khoản `Võ Minh Trí` chỉ có 3 commit whitespace → Hiển thị badge đỏ **"Free-riding"** trên màn hình báo cáo.

---

> [!IMPORTANT]
> **Cam kết:** Toàn bộ code của Thành Viên 2 được lưu tại file [`apps/api/src/controllers/gitController.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/controllers/gitController.ts) và [`apps/api/src/routes/gitRoutes.ts`](file:///c:/SWP391_Group2/AITA-Intelligent/apps/api/src/routes/gitRoutes.ts) — **HOÀN TOÀN ĐỘC LẬP**, không đụng chạm vào code của Thành Viên 1.


## Cập nhật Báo cáo Công việc Tích hợp (UI & API Fallback)

Phần này lưu lại 15 hạng mục công việc đã thực hiện trong quá trình tối ưu hóa Backend Git Engine và tích hợp UI (Role 5), nhằm phục vụ việc làm báo cáo SDLC:

| No. | SDLC Phase | Task / Activity | AI Tool Used | AI Output | Student's Validation / Modification | Evidence / Link | Quantitative Measure | Value Added (1-5) | Risks / Limitations Observed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **System Testing** | Analyze and Test New Public Repository (SDN Project). | Gemini | Executed Git Clone engine testing on the Backend using the URL `https://github.com/min098-ui/SDN.git`. Confirmed successful log parsing and data extraction of user `gi098`. | Provided the actual Github link for AI to test. Verified the availability of the public repository. | API `/api/git/analyze` logs | Successfully processed 1 real repository, extracted data for 1 contributor. | 4 | Analysis speed heavily depends on repository size; large repositories require safe processing timeout mechanisms. |
| **2** | **Implementation (UI)** | Add "SDN Project - Group 5" option to the UI Dropdown. | Gemini | Injected a new `<option>` tag into the dropdown. Updated the `onChange` event to automatically populate the corresponding URL for the selected group. | Instructed AI to keep the old Group 2 option and add SDN for side-by-side comparison. | `DashboardPortal.tsx` | Added 1 Option, modified 1 Event Handler. | 4 | Hardcoding options directly into the UI is not the best long-term solution (options should ideally be fetched from a Database). |
| **3** | **Bug Fixing (UI)** | Fix Accidental Overwrite of Wrong Component (Submit Assignment Dropdown). | Gemini | Detected that the replacement script targeted the wrong component. Wrote a custom `fix.js` script to restore the original dropdown and precisely target the "Project Group" dropdown. | Discovered the UI did not change as reported by AI, requested AI to re-check the source code carefully. | `fix.js` / Git Diff logs | Restored 10 lines of mistakenly deleted React JSX code. | 5 | Standard text replacement tools are prone to misalignment if React Component structures are excessively long and repetitive. |
| **4** | **DevOps / Environment** | Troubleshoot Vite Dev Server Crash (Port 5173). | Gemini | Analyzed TypeScript Error Logs (`noUnusedLocals`). Discovered the Vite server crashed silently. Automatically found an empty port and restarted the Server via Background Task. | Pressed F5 multiple times but UI didn't update, reported the freeze back to AI for investigation. | Terminal Logs (task-1956) | Restored 1 Node.js Server Environment. | 5 | When the Server crashes silently, manual command-line checks for port status are strictly required for detection. |
| **5** | **Integration (UI & State)** | Sync Dropdown `value` State with the `URL Input`. | Gemini | Bound the `value` attribute of the `<select>` tag to the `analysisGitUrl` state to ensure the Dropdown always displays the group name that matches the URL link. | Reloaded the page (F5) and tested if the Dropdown automatically jumped to the correct "SDN Project" label. | `DashboardPortal.tsx` (Select Element) | Synchronized Data Binding for 2 React States. | 5 | Forgetting to sync the initial value (Default State) causes the UI to display incorrect information relative to the actual underlying data. |
| **6** | **Integration (Data Mapping)** | Remove Mock Data and Map Real Data to the Contribution Table. | Gemini | Deleted the hardcoded array. Applied `.map()` function to parse real data from `gitReportData.teamContributions` into the table. Automatically calculated Initials and Status values. | Checked the data table, confirmed the `gi098 (80%)` row displayed accurately instead of the mock data. | `DashboardPortal.tsx` (Table `<tbody>`) | Replaced 10 hardcoded lines with Dynamic Mapping logic processing 5 data fields. | 5 | Data returned from the Backend lacked certain UI-required fields (Initials, Status color), forcing the creation of Adapter Logic on the Frontend. |
| **7** | **Refactoring (Lifecycle)** | Remove `useEffect` Auto-fetch to Prevent Data Cross-contamination. | Gemini | Deleted the `useEffect` Hook that automatically called the API upon Tab switching. Ensured data is only fetched when the user explicitly clicks "Start Analysis". | Tested switching between Group 2 and Group 5 to ensure data from different groups did not mix together. | `DashboardPortal.tsx` (Lifecycle Hooks) | Optimized 1 Component Lifecycle, eliminated 1 redundant API call. | 4 | Removing Auto-fetch ensures data safety but trades off the auto-resume functionality upon page reload (F5). |
| **8** | **Bug Fixing (Backend API)** | Fix Backend Controller Fallback Logic on Job ID Failure. | Gemini | Updated `gitController.ts`. Prevented the API from returning `analysisStore['latest']` if a specific `jobId` request fails. Automatically triggers fallback to Mock Data instead. | Tested analysis on Group 2 (broken repo) to confirm the system returns Mock Data instead of persisting the SDN data. | `gitController.ts` (API `/report`) | Modified 1 Core Logic block redirecting fallback behavior. | 5 | Using a Global `analysisStore` variable in the Backend easily leads to data leakage (Race condition) between multiple concurrent users. |
| **9** | **System Diagnostics** | Debug and Inspect Source Code using Custom Node.js Scripts. | Gemini | Wrote an inline script (`node -e`) to read the Component file and precisely locate the hardcoded data error, which basic regex search tools missed due to code formatting. | Collaborated with AI to analyze Terminal output to find the root cause of the data table not matching the progress bar. | Terminal Execution Logs | Scanned a 3800+ line Component file in seconds. | 5 | Extremely large file structures (over 3800 lines) with nested HTML make standard text search commands highly ineffective. |
| **10** | **Maintenance / Cleanup** | Clean up Workspace, delete all junk files (Temporary Scripts). | Gemini | Listed and executed PowerShell commands to cleanly delete over 15+ `.js` draft files generated by AI during the code-fixing process. | Requested AI to clean up messy `.js` files to keep the Workspace tidy in preparation for final submission. | Terminal command: `Remove-Item *.js` | Successfully deleted 20 junk files from the root directory. | 4 | Bulk deleting files via the command line requires extreme caution to avoid accidentally deleting core project configuration files (like `jest.config.js`). |
| **11** | **Integration (State Management)** | Synchronize default React states (`useState`) to prevent UI-State mismatch upon component mount. | Gemini | Initialized the default `useState` directly to the `min098-ui/SDN.git` repository to establish a single source of truth for all dependent UI elements. | Confirmed that immediately upon page load, both the visual dropdown and the hidden URL input share the exact same underlying state value. | `DashboardPortal.tsx` (useState logic) | Synchronized 1 default state impacting 2 distinct UI components. | 4 | State mismatches lead to "phantom bugs" where the user visually sees one option, but the backend processes another. |
| **12** | **Implementation (Defensive Programming)** | Implement defensive fallbacks in Data Mapping logic to prevent React rendering crashes. | Gemini | Added null-coalescing and logical OR operators (e.g., `m.commits || 0`, `m.pct || 0`) inside the `<tbody>` `.map()` function to guarantee valid rendering even if backend payload fields are missing. | Tested UI rendering with incomplete Mock Data payloads to ensure the table degrades gracefully instead of crashing the entire page. | `DashboardPortal.tsx` (Table Rendering) | Injected 5+ fallback safety checks into the dynamic UI rendering pipeline. | 5 | Missing fields in API responses can cause catastrophic "White Screen of Death" (WSOD) errors in React applications if not handled defensively. |
| **13** | **Optimization (Backend Memory Cache)** | Audit and optimize the Node.js global memory store (`analysisStore`) to prevent data pollution. | Gemini | Discovered that `analysisStore['latest']` was acting as a leaky global cache. Implemented strict conditional checks to only utilize this cache when explicitly authorized. | Sent sequential API requests with different `jobId`s to guarantee that one session's cached analysis does not leak into another user's session. | `gitController.ts` (Global variables) | Audited 1 global memory structure, eliminating 1 major data leakage vector. | 5 | In-memory caching without strict tenant or session scoping is highly vulnerable to cross-contamination in multi-user environments. |
| **14** | **Refactoring (Event Handling)** | Consolidate multiple state updates within the Dropdown's `onChange` event to optimize re-renders. | Gemini | Grouped `setAnalysisGitUrl` and `setAnalysisGitBranch` into a single synchronous block within the dropdown handler, ensuring React batches the updates efficiently. | Observed React behavior to verify that selecting a new project group triggers a single efficient render cycle instead of cascading updates. | `DashboardPortal.tsx` (Event Handlers) | Grouped 2 state setters into 1 optimized, batched event handler. | 4 | Fragmented state updates can cause intermediate, inconsistent UI states, momentarily confusing both the user and backend API calls. |
| **15** | **UI/UX Testing (Visual Rendering)** | Verify dynamic CSS styling and transition animations in the Progress Bar based on live data. | Gemini | Audited the inline CSS mapping (e.g., `width: \`${m.pct}%\``, `background: m.color`) to ensure visual components accurately scale and color-code according to the `gi098` user metrics. | Visually confirmed the progress bar animated correctly (1.2s ease transition) and stopped exactly at the 80% mark, matching the numerical data. | `DashboardPortal.tsx` (Progress Bar styles) | Validated 3 dynamic CSS bindings (Width, Color, Status Border) tied to real-time API properties. | 5 | Incorrect string interpolation in inline CSS can break layout structures, requiring strict type checking when mapping numeric data to percentage values. |
| **16** | **System Design** | Design System ERD for Git Analyzer | Gemini | Proposed 3 architectural options for Git Analyzer integration and separated Code Quality from Contribution Tracking. | Selected Option 3 (Transparency Model) for the system design diagram. | System Architecture Discussion | Defined 2 distinct analytical pipelines. | 5 | Maintaining dual pipelines increases system complexity. |
| **17** | **Implementation** | Implement Role-Based UI (Student View) | Gemini | Modified `DashboardPortal.tsx` to grant Students read-only access to basic contribution stats (LOC, PRs). | Verified that students can view the "Team Git" tab without seeing sensitive AI scores. | `DashboardPortal.tsx` | Added 1 conditional UI rendering block for Student role. | 4 | Relies on frontend validation; needs backend protection. |
| **18** | **Implementation** | Implement Role-Based UI (Lecturer View) | Gemini | Configured the Lecturer view to display AI Evaluation scores, Fraudulent Commits, and Free-rider alerts. | Verified the Lecturer dashboard correctly exposes the hidden `BR-10` alert data. | `DashboardPortal.tsx` | Added 1 conditional UI rendering block for Admin/Lecturer. | 5 | Heavy UI conditional logic can be hard to maintain. |
| **19** | **Implementation** | Develop Backend Git Clone Engine | Gemini | Wrote the async execution script in `gitController.ts` to bare clone Github repositories to the `scratch/clones` directory. | Executed the API and tested the sandbox creation. | `gitController.ts` | Successfully created sandbox directories for testing. | 4 | High disk space usage if sandbox is not cleaned up. |
| **20** | **Testing & Debugging** | Debug Git Clone Timeout Issue | Gemini | Diagnosed the 120s timeout issue caused by missing Personal Access Tokens (PAT) when cloning private repos. | Provided actual GitHub links to test the timeout and token requirements. | `gitController.ts` | Reduced debugging time for network timeout errors. | 5 | Interactive git prompts can crash the Node.js process. |
| **21** | **Implementation** | Implement UI Loading States | Gemini | Replaced hardcoded static mock data with dynamic loading messages while waiting for the Git Clone API. | Checked the UI to ensure the "Loading data from GitHub..." text is displayed. | `DashboardPortal.tsx` | Replaced 2 mock data arrays with loading UI elements. | 4 | Users might leave the page if loading takes too long. |
| **22** | **Testing & Debugging** | Implement API Error Fallback | Gemini | Handled backend clone errors (network failures/private repos) to gracefully failover to fallback data without crashing. | Tested the error handling by intentionally providing restricted Github links. | `DashboardPortal.tsx` | Handled 1 major error flow with a graceful degradation UI. | 4 | Fallback data might be mistaken for real data by users. |
| **23** | **Implementation** | Develop SWP391 "Demo Mode" | Gemini | Engineered a "Demo Mode" in the API that short-circuits the `git clone` step and directly parses the local `.git` directory. | Requested the system to show exact SWP391 data for presentation purposes. | `gitController.ts` | Reduced Git processing time from 30s to <2s. | 5 | Hardcoded logic; designed strictly for local demonstrations. |
| **24** | **Testing & Debugging** | Identify Missing Git Contributors | Gemini | Analyzed `git shortlog` outputs to discover why team members with 0 commits were completely missing from the UI. | Confirmed that 3 members had not committed to the current branch yet. | `gitController.ts` | Identified 3 missing users from the parsed git history. | 5 | Git history parsing is strictly tied to actual commit metadata. |
| **25** | **Implementation** | Map GitHub Usernames to UI | Gemini | Wrote an injection script to map exact GitHub usernames and force their display with 0% contribution. | Provided exact GitHub accounts (`khanhlinhz2k4-max`, `gi098`) for accurate mapping. | `gitController.ts` | Automatically maps and appends 3 missing members to the final report. | 4 | Requires manual mapping of emails/usernames if they change. |
| **26** | **Implementation / Coding** | Fix syntax errors in temporary codebase setup scripts | Gemini | Identified and fixed syntax errors (escaped backticks) in `remove_github.cjs` string literals. | Verified the script runs properly without throwing parser errors. | `remove_github.cjs` | Fixed 2 syntax errors in the file. | 4 | AI had to carefully inspect nested template literals to identify the exact cause of the IDE syntax error warnings. |
| **27** | **Maintenance & Refactoring** | Correct Git Analytics repo data mappings (SWP vs SDN) and remove demo bypass | Gemini | Updated `DashboardPortal.tsx` to map SWP391 to `AITA-Intelligent.git` as default. Edited `gitController.ts` to remove the local repo bypass for SDN, forcing it to clone actual remote data, and stopped forcing SWP members into SDN results. | Verified that SWP391 fetches the actual team's data, and SDN fetches real remote data (showing exactly 1 account). | `DashboardPortal.tsx`, `gitController.ts` | Refactored 3 logic conditions across frontend and backend. | 5 | AI initially had to clarify ambiguous mapping requirements between SWP and SDN before implementing the correct logic. |
| **28** | **Configuration & Identity Management** | Update system admin roles and sync Github account usernames | Gemini | Replaced `tuongvy22102004@gmail.com` with `n133vy@gmail.com` and added `khanhlinh...` to `ADMIN_EMAILS` (`App.tsx`). Updated Nghia's username to `Nghiad04052k5` in `gitController.ts`. | Confirmed that new admins have full access and Nghia's commits are accurately attributed. | `App.tsx`, `gitController.ts` | Updated 3 user identities across 2 files. | 4 | None. Straightforward configuration update. |
| **29** | **UI/UX & Security** | Implement UI access restrictions and perform workspace cleanup | Gemini | Initially implemented conditional rendering to hide the SDN option for 5 specific SWP emails. Later simplified by completely removing the SDN option. Deleted 4 obsolete temporary scripts (`.cjs`/`.js`). | Reviewed the UI to ensure only SWP391 is visible for everyone. Confirmed the project directory is clean of legacy scripts. | `DashboardPortal.tsx` | Removed 1 dropdown option and deleted 4 legacy script files. | 5 | Iterative requirement changes (first restrict, then fully remove) required multiple refactoring passes. |
