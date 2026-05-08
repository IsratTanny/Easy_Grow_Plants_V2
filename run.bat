@echo off
cls
echo ========================================================
echo    Easy Grow Plants - Django Application Launcher
echo ========================================================
echo.

:: Change to project directory
cd /d "%~dp0"

:: ============================================
:: STEP 1: Check Python Installation
:: ============================================
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)
echo Python found!
echo.

:: ============================================
:: STEP 2: Activate Virtual Environment
:: ============================================
echo [2/6] Activating virtual environment...
if not exist ".venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating one...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
)

call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Virtual environment activated!
echo.

:: ============================================
:: STEP 3: Install Dependencies
:: ============================================
echo [3/6] Installing/Updating dependencies...
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)
echo Dependencies installed!
echo.

:: ============================================
:: STEP 4: Run Migrations
:: ============================================
echo [4/6] Running database migrations...
python manage.py makemigrations
python manage.py migrate
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed.
    pause
    exit /b 1
)
echo Database is up to date!
echo.

:: ============================================
:: STEP 5: Import Initial Data
:: ============================================
echo [5/7] Importing plant data...
python scripts/import_plants.py
if %errorlevel% neq 0 (
    echo WARNING: Data import failed. You can run it manually later.
)
echo Data imported!
echo.

:: ============================================
:: STEP 6: Build React Frontend
:: ============================================
echo [6/8] Building React frontend...
cd frontend

:: Check if Node.js is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Node.js/npm is not installed or not in PATH.
    echo Skipping frontend build. Install Node.js to build the frontend.
    cd ..
    goto :skip_frontend
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing frontend dependencies... This may take a minute.
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies.
        cd ..
        pause
        exit /b 1
    )
)

:: Clear Vite cache to fix stale module resolution errors
if exist "node_modules\.vite" (
    echo Clearing Vite cache...
    rmdir /s /q "node_modules\.vite"
)

:: Build the frontend
echo Building production frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed. Check the output above for details.
    cd ..
    pause
    exit /b 1
)
echo Frontend built successfully!
cd ..

:skip_frontend
echo.

:: ============================================
:: STEP 7: Collect Static Files
:: ============================================
echo [7/8] Collecting static files...
python manage.py collectstatic --noinput
if %errorlevel% neq 0 (
    echo WARNING: collectstatic failed. Some images/styles may not load correctly.
)
echo Static files collected!
echo.

:: ============================================
:: STEP 8: Start Django Server (IoT Enabled)
:: ============================================
echo [8/8] Starting Django server...

:: Detect Local IPv4 Address
set LOCAL_IP=127.0.0.1
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
:: Trim leading space
set LOCAL_IP=%LOCAL_IP: =%

echo.
echo ========================================================
echo    Easy Grow Plants - System Status
echo ========================================================
echo.
echo    [1] Local URL:   http://127.0.0.1:8000
echo    [2] LAN/IoT URL: http://%LOCAL_IP%:8000
echo.
echo    IMPORTANT REMINDERS:
echo    - Arduino serverAddress: "%LOCAL_IP%"
echo    - Arduino IP in Dashboard: (check Serial Monitor)
echo    - Firewall: Ensure port 8000 is open for Python
echo.
echo    Press CTRL+C to stop the server
echo ========================================================
echo.

:: Open browser after a short delay to allow server to start
start /b "" cmd /c "timeout /t 5 >nul && start "" http://127.0.0.1:8000"

:: Run on 0.0.0.0 to allow LAN access from Arduino
python manage.py runserver 0.0.0.0:8000

:: If server stops, pause to show any error messages
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Server failed to start.
    pause
)
