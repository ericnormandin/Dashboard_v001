# Startup script for the Crypto & Portfolio Intelligence Dashboard

Write-Host "---------------------------------------------------------" -ForegroundColor Magenta
Write-Host "    ANTIGRAVITY DASHBOARD LAUNCHER" -ForegroundColor Magenta
Write-Host "---------------------------------------------------------" -ForegroundColor Magenta

# Check and free port 8000 if occupied (handling orphaned uvicorn/python child processes)
$connections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($connections) {
    Write-Host "[!] Port 8000 is in use. Cleaning up active processes..." -ForegroundColor Yellow
    $pidsToKill = @()
    foreach ($conn in $connections) {
        if ($conn.OwningProcess -and $conn.OwningProcess -ne 0) {
            $pidsToKill += $conn.OwningProcess
        }
    }
    foreach ($parentPid in $pidsToKill) {
        $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $parentPid" -ErrorAction SilentlyContinue
        foreach ($child in $children) {
            $pidsToKill += $child.ProcessId
        }
    }
    $allPython = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue
    foreach ($py in $allPython) {
        if ($py.CommandLine -like "*spawn_main*" -and $py.CommandLine -like "*parent_pid=*") {
            if ($py.CommandLine -match "parent_pid=(\d+)") {
                $pPid = [int]$Matches[1]
                $parentExists = Get-Process -Id $pPid -ErrorAction SilentlyContinue
                if (-not $parentExists -or ($pidsToKill -contains $pPid)) {
                    Write-Host "Found orphaned python process $($py.ProcessId). Adding to cleanup." -ForegroundColor Yellow
                    $pidsToKill += $py.ProcessId
                }
            }
        }
    }
    $pidsToKill = $pidsToKill | Select-Object -Unique
    foreach ($pid in $pidsToKill) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Start backend server in a new window
Write-Host "[1/3] Starting backend FastAPI server in a new terminal..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; & .venv\Scripts\uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000" -WindowStyle Normal

# Wait for server initialization
Write-Host "[2/3] Waiting for API server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Open static frontend dashboard
Write-Host "[3/3] Opening frontend dashboard..." -ForegroundColor Green
Start-Process "frontend\index.html"

Write-Host "---------------------------------------------------------" -ForegroundColor Green
Write-Host "Dashboard launched successfully." -ForegroundColor Green
Write-Host "API Swagger documentation is available at: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "---------------------------------------------------------" -ForegroundColor Green
