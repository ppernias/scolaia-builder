from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    # Base configuration
    PROJECT_NAME: str = "ADLBuilder"
    API_V1_STR: str = "/api/v1"
    
    # Database
    SQLITE_DATABASE_URL: str = "sqlite:///./adlbuilder.db"
    
    # JWT Authentication
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost", "http://localhost:8000", "http://localhost:3000", "http://127.0.0.1:36395", "http://127.0.0.1:38215", "http://0.0.0.0:3000", "*"]
    
    # Schema
    SCHEMA_PATH: str = str(Path(__file__).parent.parent.parent / "schema.yaml")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
