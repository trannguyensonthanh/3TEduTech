@echo off
echo Stopping EduTech...
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.prod.yml down
pause
