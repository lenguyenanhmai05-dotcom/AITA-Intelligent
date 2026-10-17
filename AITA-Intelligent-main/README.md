# AITA-INTELLIGENT: Subsystem 5 Monorepo
> **AI-Powered Teaching Assistant & AST Code Analytics Platform**  
> **Course:** SWP391 – Software Development Project (FPT University)  
> **Group:** Group 2  
> **Phân hệ 5:** Redis Queue (BullMQ) & Git Teamwork Analytics (Anti-Free-Riding)

---

## 📂 Cấu Trúc Monorepo (Workspace Architecture)

```
AITA_Intelligent/
├── apps/
│   ├── web/                     # Frontend: React 18 + Vite + TypeScript (Port 3000)
│   ├── api/                     # Backend REST API: Express + TypeScript + BullMQ Producer (Port 4000)
│   └── worker/                  # BullMQ Background Worker Daemon: Mock Grading & Git CLI Engine
├── packages/
│   ├── database/                # Prisma ORM: 10 bảng cơ sở dữ liệu + Multi-email author matching
│   └── shared/                  # Types, Enums, DTOs & Business Rules constants (BR-01 -> BR-13)
├── docker-compose.yml           # Docker Compose cho Redis (6379) & PostgreSQL (5432)
├── tsconfig.base.json           # Cấu hình TypeScript chuẩn gốc
├── .env.example                 # Mẫu cấu hình môi trường
└── README.md                    # Tài liệu hướng dẫn cho nhóm
```

---

## 👥 Phân Chia Công Việc 5 Thành Viên (SWP391 Nhóm 2)

Chi tiết cụ thể từng task và lộ trình milestone xem tại:  
👉 **`team_task_allocation.md`**

| Thành viên | Trách nhiệm chính | Use Cases phụ trách |
| :--- | :--- | :--- |
| **Thành viên 1** | BullMQ Architecture, Batch Grading Worker, DLQ, Dynamic Concurrency (1–10) | UC-01 -> UC-05 (BR-01 -> BR-07) |
| **Thành viên 2** | Git CLI Bare Cloner, Parser, Lọc file rác (BR-13), Bắt commit gian lận (BR-10), GitHub PR API | UC-06 -> UC-11 (BR-08 -> BR-10, BR-13) |
| **Thành viên 3** | Prisma ORM 10 bảng, Multi-Email Author Matching (@fpt + @gmail), Scoring ($40/40/20$), Free-Rider Detection | UC-12, UC-13 (BR-11, BR-12) |
| **Thành viên 4** | Frontend UI: Submissions List, Batch Config Modal, Queue Monitor Realtime (2s Polling), DLQ, Admin Settings | UI UC-01, UC-02, UC-04, UC-05 |
| **Thành viên 5** | Frontend UI: Git Submission Form, Stepper, Báo cáo đóng góp %, Member Details Modal, Flagged Commits Modal, Demo Lead | UI UC-06, UC-07, UC-12, UC-11 + QA |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Cho Thành Viên

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản `>= 20.x`
- **Git CLI**: Đã cài đặt trên máy
- **Docker Desktop** (hoặc Redis + PostgreSQL cài trực tiếp / dùng Cloud Upstash Redis & Neon/Supabase Postgres)

### 2. Cài Đặt Dependencies
Mở terminal tại thư mục gốc `AITA_Intelligent` và chạy:
```bash
npm install
```

### 3. Khởi Động Dịch Vụ Cơ Sở Dữ Liệu & Redis
Nếu máy có cài Docker:
```bash
docker compose up -d
```
*(Nếu không dùng Docker, bạn có thể cấu hình URL Redis và PostgreSQL trong file `.env`)*

### 4. Khởi Tạo Cơ Sở Dữ Liệu (Prisma)
```bash
# Tạo Prisma Client
npm run db:generate

# Đẩy schema lên database
npm run db:migrate
```

### 5. Khởi Chạy Dự Án
Bạn có thể chạy riêng từng phần hoặc chạy toàn bộ:
```bash
# Chạy Backend API (Port 4000)
npm run dev:api

# Chạy Background Worker (BullMQ Daemon)
npm run dev:worker

# Chạy Frontend Web (Port 3000)
npm run dev:web

# Hoặc chạy tất cả cùng lúc:
npm run dev
```

---

## 📌 Các Quy Tắc Nghiệp Vụ Cốt Lõi (Business Rules Summary)
- **BR-01 (Priority):** Exam (100) > Assignment (50) > Practice (10).
- **BR-02 (Batch Limit):** Tối đa 3 đợt chấm đang chạy đồng thời cho 1 lớp.
- **BR-03 (Telemetry):** Tần suất polling trạng thái tối thiểu 2 giây.
- **BR-04 & BR-05 (Fault Tolerance):** Tối đa 3 lần retry với độ trễ Exponential Backoff ($2^{\text{retryCount}}$ giây: 2s, 4s, 8s).
- **BR-06 (DLQ Replay):** Chạy lại thủ công từ DLQ sẽ đặt `retryCount = 0` và `status = 'waiting'`.
- **BR-07 (Concurrency):** Admin có thể điều chỉnh số lượng worker song song từ 1 đến 10 tại runtime.
- **BR-08 (Security):** Token GitHub PAT phải được mã hóa AES-256 trước khi lưu vào DB.
- **BR-10 (Suspicious Commits):** Cảnh báo commit chỉ sửa khoảng trắng (*whitespace-only*) hoặc tự revert commit của chính mình.
- **BR-11 (Scoring):** $\text{Contribution} = 40\% \text{ LOC} + 40\% \text{ Commits} + 20\% \text{ PRs}$.
- **BR-12 (Anti-Free-Riding):** Gắn cờ Free-Rider nếu % đóng góp thấp hơn ngưỡng (mặc định 5%, dải cấu hình 1%–20%).
- **BR-13 (Noise Sanitizing):** Loại bỏ `node_modules/`, `dist/`, `build/` và lockfiles khỏi thống kê LOC.
