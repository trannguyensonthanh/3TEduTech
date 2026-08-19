@echo off
REM  setup-env.bat - Chay MOT LAN truoc lan khoi dong dau tien.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-env.ps1"
pause
