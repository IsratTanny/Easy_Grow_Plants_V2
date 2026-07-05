@echo off
rem Helper started by start-easygrow.bat. Inherits FPORT from the launcher.
title Easy Grow Frontend
cd /d "%~dp0frontend"
if "%FPORT%"=="" set "FPORT=5173"
call npm run dev -- --port %FPORT% --strictPort
echo(
echo Frontend stopped. Press any key to close.
pause >nul
