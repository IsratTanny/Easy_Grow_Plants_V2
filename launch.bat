@echo off
cls
echo ========================================================
echo    Easy Grow Plants - Quick Launcher
echo ========================================================

:: 1. Detect Laptop IP for Arduino reference
set LOCAL_IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo.
echo    [SYSTEM] Laptop IP: %LOCAL_IP%
echo    [SYSTEM] Starting Django Server on 0.0.0.0:8000...
echo    [SYSTEM] Target URL: http://127.0.0.1:8000
echo.

:: 2. Activate Virtual Environment (if it exists)
if exist ".venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call .venv\Scripts\activate.bat
)

:: 3. Open Microsoft Edge after a 3-second delay
:: Using start msedge specifically as requested
start /b "" cmd /c "timeout /t 3 >nul && start msedge http://127.0.0.1:8000"

:: 4. Run the Server on 0.0.0.0 to ensure Arduino can connect
python manage.py runserver 0.0.0.0:8000

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server failed to start. 
    echo Please make sure no other process is using port 8000.
    pause
)
