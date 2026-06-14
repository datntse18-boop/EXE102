@echo off
echo ====================================
echo    StudyConnect - Khoi dong server
echo ====================================
echo.

echo [1/3] Kiem tra PostgreSQL...
pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    echo  PostgreSQL chua chay! Dang khoi dong...
    net start postgresql-x64-17 2>nul
    timeout /t 3 /nobreak >nul
)
echo  PostgreSQL OK

echo [2/3] Khoi dong Backend (port 3000)...
start "StudyConnect BE" cmd /k "cd /d e:\EXE\BE && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Khoi dong Frontend (port 5173)...
start "StudyConnect FE" cmd /k "cd /d e:\EXE\FE\StudyConnect\FE && npm run dev"

echo.
echo ====================================
echo  BE: http://localhost:3000
echo  FE: http://localhost:5173
echo ====================================
echo.
pause
