from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from ..models.token import TokenBlacklist
from ..schemas.token import TokenBlacklistCreate

def add_token_to_blacklist(db: Session, token_data: TokenBlacklistCreate) -> TokenBlacklist:
    """
    Au00f1ade un token a la lista negra para revocarlo
    """
    db_token = TokenBlacklist(
        jti=token_data.jti,
        user_id=token_data.user_id,
        token_type=token_data.token_type,
        expires_at=token_data.expires_at,
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def is_token_blacklisted(db: Session, jti: str) -> bool:
    """
    Verifica si un token estu00e1 en la lista negra
    """
    return db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first() is not None

def get_blacklisted_tokens_by_user(db: Session, user_id: int) -> List[TokenBlacklist]:
    """
    Obtiene todos los tokens en lista negra de un usuario
    """
    return db.query(TokenBlacklist).filter(TokenBlacklist.user_id == user_id).all()

def clean_expired_tokens(db: Session) -> int:
    """
    Elimina los tokens expirados de la lista negra para mantener la base de datos limpia
    """
    now = datetime.utcnow()
    result = db.query(TokenBlacklist).filter(TokenBlacklist.expires_at < now).delete()
    db.commit()
    return result

def revoke_all_user_tokens(db: Session, user_id: int) -> int:
    """
    Revoca todos los tokens de un usuario (por ejemplo, al cambiar la contraseu00f1a)
    """
    result = db.query(TokenBlacklist).filter(TokenBlacklist.user_id == user_id).delete()
    db.commit()
    return result
