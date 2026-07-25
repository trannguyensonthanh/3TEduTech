@echo off
echo Starting EduTech in Development Mode...
docker compose -f docker-compose.dev.yml up --build
pause
