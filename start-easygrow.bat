@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Easy Grow Plants Launcher
echo(
echo   Easy Grow Plants launcher
echo   repo: %CD%
echo(

set "PY=%CD%\venv\Scripts\python.exe"
if not exist "%PY%" (
  echo [X] Python venv not found at %PY%
  echo     First-time setup ^(run once in this folder^):
  echo         python -m venv venv
  echo         venv\Scripts\pip install -r requirements.txt
  echo(
  pause
  exit /b 1
)
if not exist "%CD%\frontend\node_modules\" (
  echo [X] Frontend dependencies missing.
  echo     First-time setup:  cd frontend ^&^& npm install --legacy-peer-deps
  echo(
  pause
  exit /b 1
)

rem ---- pick free ports (backend 8000 then 8080, frontend 5173 then 5174) ----
rem Fixed backend port so the phone app + website always agree on it.
set "BPORT=8080"
set "FPORT=5173"
netstat -ano | findstr LISTENING | findstr ":5173 " >nul && set "FPORT=5174"
echo   Backend port: !BPORT!    Frontend port: !FPORT!

rem ---- align the Vite dev-proxy (/api,/media) with the chosen backend ----
> frontend\.env echo VITE_BACKEND_URL=http://127.0.0.1:!BPORT!
>> frontend\.env echo VITE_IOT_URL=http://127.0.0.1:8001

rem ---- prepare the database, seed demo content on first run ----
pushd backend\core
"%PY%" manage.py migrate --noinput >nul 2>&1
popd
if not exist "%CD%\.easygrow_seeded" (
  echo   Seeding demo data ^(first run, please wait^)...
  pushd backend\core
  "%PY%" manage.py seed_marketplace >nul 2>&1
  "%PY%" manage.py seed_demo_data >nul 2>&1
  "%PY%" manage.py create_demo_users >nul 2>&1
  popd
  > "%CD%\.easygrow_seeded" echo seeded
)

rem ---- start backend and frontend, each in its own window (helpers read the ----
rem ---- BPORT/FPORT/PY environment inherited from here) ----------------------
start "Easy Grow Backend" "%CD%\run-backend.bat"
start "Easy Grow Frontend" "%CD%\run-frontend.bat"
start "Easy Grow Device Discovery" "%CD%\run-discovery.bat"

rem ---- wait for the frontend, then open the browser ----
echo   Starting servers, please wait...
powershell -NoProfile -Command "for($i=0;$i -lt 45;$i++){try{$null=Invoke-WebRequest -UseBasicParsing ('http://localhost:!FPORT!/') -TimeoutSec 2; break}catch{Start-Sleep -Seconds 1}}"
start "" "http://localhost:!FPORT!/"

echo(
echo   ============================================================
echo    Easy Grow Plants is running!
echo      Website : http://localhost:!FPORT!/
echo      Backend : http://localhost:!BPORT!
echo      Login   : Israt Sultana / EasyGrow123!
echo      Admin   : admin / EasyGrow123!
echo   ============================================================
echo    Three windows opened (backend, frontend, device discovery).
echo    CLOSE THEM to stop everything.
echo(
pause
