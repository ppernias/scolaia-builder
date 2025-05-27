from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    class Config:
        from_attributes = True

# Shared properties
class AssistantBase(BaseModel):
    title: str
    yaml_content: str
    is_public: bool = True

# Properties to receive via API on creation
class AssistantCreate(AssistantBase):
    tags: Optional[List[str]] = []

# Properties to receive via API on update
class AssistantUpdate(BaseModel):
    title: Optional[str] = None
    yaml_content: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None

# Properties shared by models stored in DB
class AssistantInDBBase(AssistantBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return via API
class Assistant(AssistantInDBBase):
    tags: List[Tag] = []

# Properties stored in DB
class AssistantInDB(AssistantInDBBase):
    pass
