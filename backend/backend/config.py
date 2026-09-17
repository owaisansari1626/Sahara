import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Sahara Mental Health API"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_FILE: str = os.getenv("DATABASE_FILE", "backend/sahara.db")
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "sahara-admin-secret-2025")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "127.0.0.1")

settings = Settings()
