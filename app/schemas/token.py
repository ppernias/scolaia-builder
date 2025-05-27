from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token expiration time in seconds")

class TokenPayload(BaseModel):
    sub: Optional[str] = None  # subject (user id)
    exp: Optional[int] = None  # expiration time
    iat: Optional[int] = None  # issued at
    jti: Optional[str] = None  # JWT ID
    iss: Optional[str] = None  # issuer
    type: Optional[str] = None  # token type (access or refresh)
    
class TokenBlacklistCreate(BaseModel):
    jti: str
    user_id: int
    token_type: str
    expires_at: datetime
    
class TokenBlacklistResponse(BaseModel):
    id: int
    jti: str
    user_id: int
    token_type: str
    expires_at: datetime
    blacklisted_at: datetime
    
    class Config:
        orm_mode = True
