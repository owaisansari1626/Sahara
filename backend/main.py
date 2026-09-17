import uvicorn
from backend.config import settings

if __name__ == "__main__":
    print(f"Starting Sahara Mental Health FastAPI Server on http://{settings.HOST}:{settings.PORT}")
    print(f"Interactive API Docs available at http://{settings.HOST}:{settings.PORT}/docs")
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
