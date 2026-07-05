@echo off
setlocal
cd /d "%~dp0"
echo Creating the "Easy Grow Plants" desktop shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut((Join-Path $d 'Easy Grow Plants.lnk')); $s.TargetPath='%CD%\start-easygrow.bat'; $s.WorkingDirectory='%CD%'; $s.IconLocation='%CD%\easygrow-icon.ico'; $s.Description='Start Easy Grow Plants and open the website'; $s.Save()"
echo(
echo   Done. A green-leaf "Easy Grow Plants" icon is on your Desktop.
echo   Double-click it to start the servers and open the website.
echo(
echo   (You can also just double-click start-easygrow.bat directly.)
echo(
pause
