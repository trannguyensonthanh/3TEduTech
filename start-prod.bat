@echo off
echo Starting EduTech in Production Mode...
docker compose -f docker-compose.prod.yml up -d
pause
