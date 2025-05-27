from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

# Importar los modelos necesarios
from .token import TokenBlacklist

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)  # From schema.yaml metadata.author.name
    role = Column(String, nullable=True)  # From schema.yaml metadata.author.role
    organization = Column(String, nullable=True)  # From schema.yaml metadata.author.organization
    contact = Column(String, nullable=True)  # From schema.yaml metadata.author.contact
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Campo para identificar administradores
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assistants = relationship("Assistant", back_populates="user")
    blacklisted_tokens = relationship("TokenBlacklist", back_populates="user")

