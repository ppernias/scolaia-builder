from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from ..core.database import Base

class TokenBlacklist(Base):
    """Modelo para almacenar tokens revocados"""
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, unique=True, index=True, nullable=False)  # JWT ID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_type = Column(String, nullable=False)  # "access" o "refresh"
    expires_at = Column(DateTime, nullable=False)
    blacklisted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relación con el usuario
    user = relationship("User", back_populates="blacklisted_tokens")
