@echo off
cls
echo ========================================================
echo    Easy Grow Plants - Setup Verification
echo ========================================================
echo.

cd /d "%~dp0"

echo Checking setup configuration...
echo.

:: Check 1: Virtual Environment
echo [1/6] Virtual Environment
if exist ".venv\Scripts\activate.bat" (
    echo    ✅ Virtual environment exists
) else (
    echo    ❌ Virtual environment missing - run: python -m venv .venv
)

:: Check 2: Python Dependencies
echo [2/6] Python Dependencies
if exist ".venv\Lib\site-packages\django" (
    echo    ✅ Django installed
) else (
    echo    ❌ Django not installed - run: pip install -r requirements.txt
)

:: Check 3: Frontend Build
echo [3/6] Frontend Build
if exist "frontend\dist\index.html" (
    echo    ✅ Frontend built
) else (
    echo    ❌ Frontend not built - run: cd frontend ^&^& npm run build
)
if exist "frontend\dist\assets" (
    echo    ✅ Frontend assets exist
) else (
    echo    ❌ Frontend assets missing
)

:: Check 4: Node Modules
echo [4/6] Node Modules
if exist "frontend\node_modules" (
    echo    ✅ Frontend dependencies installed
) else (
    echo    ❌ Frontend dependencies missing - run: cd frontend ^&^& npm install
)

:: Check 5: Database
echo [5/6] Database
if exist "backend\core\db.sqlite3" (
    echo    ✅ Database exists
) else (
    echo    ⚠️  Database missing - run: python manage.py migrate
)

:: Check 6: Configuration Files
echo [6/6] Configuration Files
if exist "backend\core\config\settings.py" (
    echo    ✅ Django settings exists
) else (
    echo    ❌ Django settings missing
)
if exist "frontend\vite.config.js" (
    echo    ✅ Vite config exists
) else (
    echo    ❌ Vite config missing
)

echo.
echo ========================================================
echo    Verification Complete
echo ========================================================
echo.

:: Check if everything is ready
if exist ".venv\Scripts\activate.bat" if exist "frontend\dist\index.html" (
    echo ✅ Your setup is ready!
    echo    Run: start.bat to launch the application
) else (
    echo ⚠️  Some components are missing
    echo    Run: run.bat for full setup
)

echo.
echo Detailed Information:
echo    • Backend:  backend\core\config\settings.py
echo    • Frontend: frontend\dist\
echo    • API URL:  http://127.0.0.1:8000/api/
echo    • Web URL:  http://127.0.0.1:8000/
echo.
pause
