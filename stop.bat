@echo off
REM ============================================================================
REM  stop.bat - Dung toan bo dich vu, GIU NGUYEN du lieu.
REM
REM  Muon dung lai rieng co so du lieu (sau khi doi db-init/V1__baseline.sql):
REM      start.bat -ResetDb    xoa volume SQL Server, giu Redis va faq-docs-dev
REM
REM  Muon xoa sach MOI THU (ke ca faq-docs-dev, khong khoi phuc duoc):
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
