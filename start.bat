@echo off
cd /d "%~dp0"

echo =========================================================
echo     ANTIGRAVITY DASHBOARD LAUNCHER
echo =========================================================

echo [KILL]  Freeing port 8000...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000 " 2^>nul') do (
    taskkill /F /PID %%p >nul 2>&1
)
echo [KILL]  Port 8000 cleared.
timeout /t 1 /nobreak >nul

echo [START] Launching backend server in new window...
start "Dashboard Backend" powershell.exe -ExecutionPolicy Bypass -NoExit -Command "cd '%~dp0'; & .venv\Scripts\uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

echo [WAIT]  Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo [OPEN]  Opening frontend dashboard...
start "" "%~dp0frontend\index.html"

echo =========================================================
echo  Dashboard launched.
echo  API docs: http://127.0.0.1:8000/docs
echo =========================================================
