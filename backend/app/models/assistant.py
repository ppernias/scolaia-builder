from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class Assistant(Base):
    __tablename__ = "assistants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)  # From metadata.description.title
    yaml_content = Column(Text)  # Full YAML content of the assistant
    is_public = Column(Boolean, default=True)  # From metadata.visibility.is_public
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    user = relationship("User", back_populates="assistants")
    tags = relationship("AssistantTag", back_populates="assistant")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    assistants = relationship("AssistantTag", back_populates="tag")

class AssistantTag(Base):
    __tablename__ = "assistant_tags"
    
    assistant_id = Column(Integer, ForeignKey("assistants.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    
    assistant = relationship("Assistant", back_populates="tags")
    tag = relationship("Tag", back_populates="assistants")
