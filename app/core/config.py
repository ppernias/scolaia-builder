from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno desde el archivo .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=dotenv_path)
os.environ["DOTENV_FILE"] = dotenv_path

# Mostrar las variables de entorno cargadas (solo para depuración)
logger.info(f"Cargando variables de entorno desde: {dotenv_path}")
logger.info(f"DOMAIN_NAME desde env: {os.environ.get('DOMAIN_NAME', 'No configurado')}")
logger.info(f"ADDITIONAL_CORS_ORIGINS desde env: {os.environ.get('ADDITIONAL_CORS_ORIGINS', 'No configurado')}")

class Settings(BaseSettings):
    class Config:
        env_file = dotenv_path
        case_sensitive = True
        extra = "ignore"  # Permitir campos extra en el archivo .env
    # Configuraciu00f3n base
    PROJECT_NAME: str = "ADLMaker"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos
    SQLITE_DATABASE_URL: str = "sqlite:///./adlbuilder.db"
    
    # Autenticaciu00f3n JWT
    SECRET_KEY: str = "your-secret-key-for-jwt"
    ALGORITHM: str = "HS256"
    
    # Token settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    TOKEN_ISSUER: str = "adlbuilder"
    
    # CORS y Hosts permitidos
    DOMAIN_NAME: str = os.environ.get("DOMAIN_NAME", "maker.scolaia.net")
    ALLOWED_HOSTS: str = os.environ.get("ALLOWED_HOSTS", DOMAIN_NAME)
    
    # Lista base de orígenes CORS
    _base_cors_origins: List[str] = [
        "http://localhost",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        origins = self._base_cors_origins.copy()
        
        # Add domain with https protocol
        if self.DOMAIN_NAME:
            origins.append(f"https://{self.DOMAIN_NAME}")
            
        # Add any additional origins from environment variable
        additional_origins = os.environ.get("ADDITIONAL_CORS_ORIGINS", "")
        if additional_origins:
            origins.extend([origin.strip() for origin in additional_origins.split(",")])
            
        return origins
    
    # Internationalization
    DEFAULT_LANGUAGE: str = "en"
    SUPPORTED_LANGUAGES: list = ["en", "es"]
    
    # Esquema
    SCHEMA_PATH: str = str(Path(__file__).parent.parent.parent / "schema.yaml")

settings = Settings()
