from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    # Configuraciu00f3n base
    PROJECT_NAME: str = "ADLBuilder"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos
    SQLITE_DATABASE_URL: str = "sqlite:///./adlbuilder.db"
    
    # Autenticaciu00f3n JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 du00edas
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost", "http://localhost:8000", "http://127.0.0.1:8000", "*"]
    
    # Esquema
    SCHEMA_PATH: str = str(Path(__file__).parent.parent.parent / "schema.yaml")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
