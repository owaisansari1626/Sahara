from fastapi import APIRouter
from backend.config import settings

router = APIRouter()

@router.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_layer": "LangChain + Gemini 2.0 Flash"
    }
