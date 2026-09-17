import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import init_db
from backend.routers import health, chat, checkins, saathis, counsellors, resources, analytics, dev_saathis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sahara.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Sahara SQLite database...")
    init_db()
    logger.info("Sahara SQLite database initialized successfully.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(checkins.router)
app.include_router(saathis.router)
app.include_router(counsellors.router)
app.include_router(resources.router)
app.include_router(analytics.router)
app.include_router(dev_saathis.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
