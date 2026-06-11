@echo off
REM CubeBook Quick Start Script for Windows
REM Run this to set up and start the complete application

echo.
echo ========================================
echo  CubeBook - Quick Start Setup for Windows
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python 3 is required but not installed.
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is required but not installed.
    echo Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Backend setup
echo.
echo [1/4] Setting up backend...
cd backend

if not exist "venv" (
    echo     Creating virtual environment...
    python -m venv venv
)

echo     Installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q

echo [OK] Backend ready!
echo.

REM Frontend setup
echo [2/4] Setting up frontend...
cd ..\frontend

if not exist "node_modules" (
    echo     Installing npm dependencies...
    npm install -q
)

echo [OK] Frontend ready!
echo.

REM Instructions
echo [3/4] Creating startup scripts...
cd ..

echo [OK] Setup complete!
echo.
echo ========================================
echo  To start the application:
echo ========================================
echo.
echo TERMINAL 1 - Backend:
echo   cd cubebook\backend
echo   venv\Scripts\activate.bat
echo   uvicorn app.main:app --reload --port 8000
echo.
echo TERMINAL 2 - Frontend:
echo   cd cubebook\frontend
echo   npm run dev
echo.
echo TERMINAL 3 - Seed Data (optional):
echo   cd cubebook\backend
echo   venv\Scripts\activate.bat
echo   python -m scripts.seed_data
echo.
echo ========================================
echo  Access Points:
echo ========================================
echo Frontend:      http://localhost:5173
echo API Docs:      http://localhost:8000/docs
echo API ReDoc:     http://localhost:8000/redoc
echo Database:      cubebook.db (SQLite)
echo.
echo Press any key to close...
pause >nul
