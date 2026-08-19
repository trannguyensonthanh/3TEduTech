@echo off
REM ============================================================================
REM  start.bat - Khoi dong toan bo he thong 3T EduTech (che do phat trien).
REM
REM  Chi la lop vo goi start.ps1. Ton tai de ban CHI CAN NHAY DUP CHUOT thay vi
REM  mo PowerShell va go lenh - va de vuot qua ExecutionPolicy mac dinh cua
REM  Windows (Restricted) ma khong phai doi cai dat he thong.
REM ============================================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
echo.
pause
