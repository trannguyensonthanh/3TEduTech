import uvicorn
from src.config import get_settings

def start():
    """Start the AI Service with hot-reload in development."""
    settings = get_settings()
    print(f"Starting server at http://{settings.ai_service_host}:{settings.ai_service_port}")
    uvicorn.run(
        "src.main:app",
        host=settings.ai_service_host,
        port=settings.ai_service_port,
        reload=True,
    )

if __name__ == "__main__":
    start()
