# Handloom ERP PowerShell Development Launcher
$Host.UI.RawUI.WindowTitle = "Handloom ERP Development Launcher"
Write-Host "========================================================" -ForegroundColor Green
Write-Host "       Starting Handloom ERP Full Stack Services        " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$env:PYTHONIOENCODING = "utf-8"
$root = $PSScriptRoot

# Check PostgreSQL
Write-Host "`n[1/3] Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "    - PostgreSQL is RUNNING." -ForegroundColor Green
} else {
    Write-Host "    - Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
}

# Start Backend
Write-Host "`n[2/3] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; `$env:PYTHONIOENCODING='utf-8'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start Frontend
Write-Host "`n[3/3] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " All services have been launched!" -ForegroundColor Cyan
Write-Host ""
Write-Host " Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host " Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host " API Docs:     http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host " Default Login:" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
