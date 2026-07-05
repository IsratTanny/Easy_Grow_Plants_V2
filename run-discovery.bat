@echo off
rem Helper started by start-easygrow.bat. Auto-detects Arduino devices on the LAN
rem by listening for their UDP presence broadcasts and keeping their IPs current.
title Easy Grow Device Discovery
cd /d "%~dp0backend\core"
"%~dp0venv\Scripts\python.exe" manage.py device_discovery
echo(
echo Device discovery stopped. Press any key to close.
pause >nul
