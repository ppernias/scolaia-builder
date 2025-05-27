from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.token import TokenBlacklist
from ..models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token de acceso JWT con payload enriquecido
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    now = datetime.utcnow()
    jti = secrets.token_hex(16)  # Identificador único para el token
    
    to_encode = {
        "iat": now,                      # Issued at
        "exp": expire,                   # Expiration time
        "sub": str(subject),             # Subject (user ID)
        "iss": settings.TOKEN_ISSUER,    # Issuer
        "jti": jti,                      # JWT ID (unique identifier)
        "type": "access"                 # Token type
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un refresh token JWT con payload enriquecido
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    now = datetime.utcnow()
    jti = secrets.token_hex(16)  # Identificador único para el token
    
    to_encode = {
        "iat": now,                      # Issued at
        "exp": expire,                   # Expiration time
        "sub": str(subject),             # Subject (user ID)
        "iss": settings.TOKEN_ISSUER,    # Issuer
        "jti": jti,                      # JWT ID (unique identifier)
        "type": "refresh"                # Token type
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_token_pair(subject: str) -> Dict[str, Any]:
    """
    Crea un par de tokens (access y refresh) para un usuario
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(subject, access_token_expires)
    refresh_token = create_refresh_token(subject, refresh_token_expires)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Segundos
    }

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
