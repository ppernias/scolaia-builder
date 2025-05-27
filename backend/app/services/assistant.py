from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from ..models.assistant import Assistant, Tag, AssistantTag
from ..schemas.assistant import AssistantCreate, AssistantUpdate

def get_assistant_by_id(db: Session, assistant_id: int) -> Optional[Assistant]:
    return db.query(Assistant).filter(Assistant.id == assistant_id).first()

def get_user_assistants(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Assistant]:
    return db.query(Assistant).filter(Assistant.user_id == user_id).offset(skip).limit(limit).all()

def get_public_assistants(db: Session, skip: int = 0, limit: int = 100) -> List[Assistant]:
    return db.query(Assistant).filter(Assistant.is_public == True).offset(skip).limit(limit).all()

def get_or_create_tag(db: Session, tag_name: str) -> Tag:
    tag = db.query(Tag).filter(Tag.name == tag_name).first()
    if not tag:
        tag = Tag(name=tag_name)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag

def create_assistant(db: Session, assistant_in: AssistantCreate, user_id: int) -> Assistant:
    # Create assistant
    db_assistant = Assistant(
        user_id=user_id,
        title=assistant_in.title,
        yaml_content=assistant_in.yaml_content,
        is_public=assistant_in.is_public
    )
    db.add(db_assistant)
    db.commit()
    db.refresh(db_assistant)
    
    # Add tags
    if assistant_in.tags:
        for tag_name in assistant_in.tags:
            tag = get_or_create_tag(db, tag_name)
            db_assistant_tag = AssistantTag(assistant_id=db_assistant.id, tag_id=tag.id)
            db.add(db_assistant_tag)
        db.commit()
    
    return db_assistant

def update_assistant(db: Session, assistant_id: int, assistant_in: AssistantUpdate, user_id: int) -> Optional[Assistant]:
    db_assistant = get_assistant_by_id(db, assistant_id=assistant_id)
    
    if not db_assistant or db_assistant.user_id != user_id:
        return None
    
    update_data = assistant_in.dict(exclude_unset=True)
    
    # Update tags if provided
    if "tags" in update_data:
        tags = update_data.pop("tags")
        
        # Remove existing tags
        db.query(AssistantTag).filter(AssistantTag.assistant_id == assistant_id).delete()
        
        # Add new tags
        for tag_name in tags:
            tag = get_or_create_tag(db, tag_name)
            db_assistant_tag = AssistantTag(assistant_id=assistant_id, tag_id=tag.id)
            db.add(db_assistant_tag)
    
    # Update other fields
    for field, value in update_data.items():
        setattr(db_assistant, field, value)
    
    db.add(db_assistant)
    db.commit()
    db.refresh(db_assistant)
    return db_assistant

def delete_assistant(db: Session, assistant_id: int, user_id: int) -> bool:
    db_assistant = get_assistant_by_id(db, assistant_id=assistant_id)
    
    if not db_assistant or db_assistant.user_id != user_id:
        return False
    
    # Remove tags associations
    db.query(AssistantTag).filter(AssistantTag.assistant_id == assistant_id).delete()
    
    # Remove assistant
    db.delete(db_assistant)
    db.commit()
    return True
