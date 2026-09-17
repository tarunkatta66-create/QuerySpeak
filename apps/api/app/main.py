from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.models.base import Base
import app.models.models  # Registers all models with Base
from app.api.v1.routers import auth, health, query

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create database tables on startup if they don't exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables initialized successfully!")
    except Exception as e:
        print(f"Error initializing database tables: {e}")
    yield

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://queryspeak-ai.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(query.router, prefix="/api/v1/query", tags=["query"])

@app.get("/")
def root():
    return {"message": "QuerySpeak API is running"}
