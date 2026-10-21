@echo off
chcp 65001 >nul
echo ========================================================
echo   🚀 AITA-INTELLIGENT: KHỞI ĐỘNG VÀ ĐỒNG BỘ DATABASE
echo ========================================================
echo.
echo [1/3] Đang khởi động Docker PostgreSQL & Redis...
docker compose up -d
if %errorlevel% neq 0 (
    echo [LỖI] Không thể kết nối Docker Desktop! Vui lòng bật ứng dụng Docker Desktop lên trước.
    pause
    exit /b %errorlevel%
)
echo.
echo [2/3] Đang nạp đầy đủ dữ liệu 13 bảng vào database (Seed Data)...
call npm run db:seed
echo.
echo [3/3] Đang mở Prisma Studio trên trình duyệt http://localhost:5555...
start http://localhost:5555
call npx prisma studio --schema=packages/database/prisma/schema.prisma
pause
