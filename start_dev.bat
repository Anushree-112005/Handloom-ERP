@echo off
title Handloom ERP Development Launcher
color 0A
echo ========================================================
echo        Starting Handloom ERP Full Stack Services
echo ========================================================
echo.

:: Set UTF-8 encoding
chcp 65001 >nul
set PYTHONIOENCODING=utf-8

:: Check if PostgreSQL service is running
echo [1/3] Checking PostgreSQL service...
powershell -NoProfile -ExecutionPolicy Bypass -Command "if ((Get-Service -Name postgresql-x64-18 -ErrorAction SilentlyContinue).Status -ne 'Running') { Start-Service postgresql-x64-18 -ErrorAction SilentlyContinue }"
echo     - PostgreSQL service is checked/running.

echo.
echo [2/3] Starting FastAPI Backend on http://localhost:8000...
start "Handloom ERP Backend (Port 8000)" cmd /k "cd /d %~dp0backend && set PYTHONIOENCODING=utf-8 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [3/3] Starting React Vite Frontend on http://localhost:5173...
start "Handloom ERP Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo  All services have been launched!
echo.
echo  Frontend URL: http://localhost:5173
echo  Backend API:  http://localhost:8000
echo  API Docs:     http://localhost:8000/docs
echo.
echo  Default Login:
echo    Username: admin
echo    Password: admin123
echo ========================================================
pause
