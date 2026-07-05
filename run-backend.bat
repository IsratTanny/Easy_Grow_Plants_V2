@echo off
rem Helper started by start-easygrow.bat. Inherits BPORT from the launcher.
title Easy Grow Backend
cd /d "%~dp0backend\core"
if "%BPORT%"=="" set "BPORT=8080"
"%~dp0venv\Scripts\python.exe" manage.py runserver 0.0.0.0:%BPORT%
echo(
echo Backend stopped. Press any key to close.
pause >nul
