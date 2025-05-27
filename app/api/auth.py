from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Any, Optional
from jose import JWTError, jwt

from ..core.database import get_db
from ..core.config import settings
from ..schemas.token import Token, TokenPayload, TokenBlacklistCreate
from ..schemas.user import User
from ..services.auth import create_access_token, create_refresh_token, create_token_pair
from ..services.user import authenticate_user, get_user_by_id
from ..services.token import add_token_to_blacklist, is_token_blacklisted

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Dependency to get current user
async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar el token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        # Extraer datos del token
        user_id = payload.get("sub")
        token_type = payload.get("type")
        jti = payload.get("jti")
        
        # Validar datos básicos del token
        if user_id is None or jti is None:
            raise credentials_exception
            
        # Verificar que es un token de acceso, no un refresh token
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Verificar si el token está en la lista negra
        if is_token_blacklisted(db, jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Crear objeto TokenPayload con los datos del token
        token_data = TokenPayload(
            sub=user_id,
            jti=jti,
            type=token_type
        )
    except JWTError:
        raise credentials_exception
    
    # Obtener el usuario de la base de datos
    user = get_user_by_id(db, user_id=int(token_data.sub))
    if user is None:
        raise credentials_exception
    
    return user

# Dependency to get current active user
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Dependency to check if user is admin
async def admin_required(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token and refresh token for future requests
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear par de tokens (access y refresh)
    return create_token_pair(str(user.id))



@router.post("/logout")
async def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    token: str = Depends(oauth2_scheme)
) -> Any:
    """
    Revoke the current access token (logout)
    """
    try:
        # Decodificar el token actual
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        # Extraer datos del token
        jti = payload.get("jti")
        exp = payload.get("exp")
        
        if jti is None or exp is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            )
        
        # Añadir el token a la lista negra
        token_data = TokenBlacklistCreate(
            jti=jti,
            user_id=current_user.id,
            token_type="access",
            expires_at=datetime.fromtimestamp(exp)
        )
        add_token_to_blacklist(db, token_data)
        
        return {"detail": "Successfully logged out"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )

@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    refresh_token: str = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token using a valid refresh token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar el refresh token
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        # Validar que es un refresh token
        if payload.get("type") != "refresh":
            raise credentials_exception
        
        # Extraer datos del token
        user_id = payload.get("sub")
        jti = payload.get("jti")
        exp = payload.get("exp")
        
        if user_id is None or jti is None:
            raise credentials_exception
            
        # Verificar si el token está en la lista negra
        if is_token_blacklisted(db, jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verificar que el usuario existe
        user = get_user_by_id(db, user_id=int(user_id))
        if user is None:
            raise credentials_exception
            
        # Añadir el refresh token usado a la lista negra para evitar su reutilización
        token_data = TokenBlacklistCreate(
            jti=jti,
            user_id=int(user_id),
            token_type="refresh",
            expires_at=datetime.fromtimestamp(exp)
        )
        add_token_to_blacklist(db, token_data)
        
        # Generar un nuevo par de tokens
        return create_token_pair(user_id)
        
    except JWTError:
        raise credentials_exception


