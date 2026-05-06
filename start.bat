@echo off
cls
echo ========================================================
echo    Easy Grow Plants - Quick Start
echo ========================================================
echo.

:: Change to project directory
cd /d "%~dp0"

:: Kill any existing Django server processes to prevent port conflicts
echo Stopping any existing Django servers...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *runserver*" 2>nul

:: Activate virtual environment
echo Activating virtual environment...
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo ERROR: Virtual environment not found! Run run.bat first.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo    Application available at: http://127.0.0.1:8000
echo    Serving: React Frontend + Django API
echo ========================================================
echo.

:: Start Django server
python manage.py runserver 127.0.0.1:8000
