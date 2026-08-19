@echo off
REM ============================================================================
REM  stop.bat - Dung toan bo dich vu, GIU NGUYEN du lieu.
REM
REM  Muon xoa sach du lieu (chay lai migration tu dau) thi dung:
REM      start.bat -Reset
REM ============================================================================
cd /d "%~dp0"
echo Dang dung cac dich vu...
docker compose -f docker-compose.dev.yml down
echo.
echo Da dung. Du lieu SQL Server va Redis van con.
echo Khoi dong lai bang: start.bat
echo.
pause
