@echo off
chcp 65001 >nul
title AITA-INTELLIGENT: MASTER RUNNER
echo ======================================================================
echo    🚀 AITA-INTELLIGENT: TRÌNH KHỞI ĐỘNG HỆ THỐNG TOÀN DIỆN
echo    Subsystem 5: Redis BullMQ Queue & Git AST Teamwork Analytics
echo ======================================================================
echo.

:: 1. Kiểm tra & Khởi động Docker Desktop
echo [1/4] Đang kiểm tra Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [THÔNG BÁO] Docker Desktop chưa mở, đang tự động khởi chạy Docker Desktop...
    if exist "C:\Users\lengu\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe" (
        start "" "C:\Users\lengu\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    ) else if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    echo Đang đợi Docker Desktop sẵn sàng (khoảng 15-20 giây)...
    :WAIT_DOCKER
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo ... đang kết nối tới Docker daemon...
        goto WAIT_DOCKER
    )
    echo [OK] Docker Desktop đã sẵn sàng!
) else (
    echo [OK] Docker Desktop đang hoạt động bình thường.
)

:: 2. Khởi động Docker Containers (PostgreSQL & Redis)
echo.
echo [2/4] Đang khởi động Docker PostgreSQL (cổng 5432) & Redis (cổng 6379)...
call docker compose up -d

:: 3. Đồng bộ và nạp dữ liệu mẫu 13 bảng
echo.
echo [3/4] Đang nạp đầy đủ dữ liệu 13 bảng vào database (Seed Data)...
call npm run db:seed

:: 4. Mở Prisma Studio & Chạy Web App
echo.
echo [4/4] Đang khởi động Prisma Studio & Toàn bộ ứng dụng AITA...
start "" cmd /c "title Prisma Studio && npx prisma studio --schema=packages/database/prisma/schema.prisma --port 5555"

:: Đợi 3 giây rồi mở trình duyệt Web
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000 && start http://localhost:5555"

echo.
echo ======================================================================
echo    ✅ TẤT CẢ DỊCH VỤ ĐÃ SẴN SÀNG!
echo    - Web App:       http://localhost:3000
echo    - Backend API:   http://localhost:4000
echo    - Prisma Studio: http://localhost:5555
echo    - PostgreSQL:    localhost:5432 (database: aita_db)
echo    - Redis:         localhost:6379
echo ======================================================================
echo.
echo Đang chạy dev server (API, Worker, Web)... Nhấn Ctrl+C để dừng.
call npm run dev
