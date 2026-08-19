@echo off
REM  logs.bat - Xem log truc tiep cua backend + ai-service (Ctrl+C de thoat).
cd /d "%~dp0"
docker compose -f docker-compose.dev.yml logs -f --tail 100 backend ai-service
