from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "QuerySpeak"
    DATABASE_URL: str
    SECRET_KEY: str
    BACKEND_CORS_ORIGINS: List[str] = ["https://query-speak.vercel.app", "http://localhost:5173"]

    class Config:
        case_sensitive = True

settings = Settings()
