from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from ..core.database import get_db
from ..schemas.assistant import Assistant, AssistantCreate, AssistantUpdate, Tag
from ..services.assistant import (
    create_assistant, get_assistant_by_id, get_user_assistants,
    get_public_assistants, update_assistant, delete_assistant
)
from ..services.yaml_validator import validate_yaml
from ..api.deps import get_current_user
from ..models.user import User

router = APIRouter()

@router.post("/", response_model=Assistant, status_code=status.HTTP_201_CREATED)
async def create_new_assistant(
    assistant_in: AssistantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new assistant"""
    # Validate YAML content
    is_valid, errors = validate_yaml(assistant_in.yaml_content)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Invalid YAML content", "errors": errors}
        )
    
    return create_assistant(db, assistant_in=assistant_in, user_id=current_user.id)

@router.get("/", response_model=List[Assistant])
async def read_assistants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all assistants for the current user"""
    return get_user_assistants(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/public", response_model=List[Assistant])
async def read_public_assistants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """Get all public assistants"""
    return get_public_assistants(db, skip=skip, limit=limit)

@router.get("/{assistant_id}", response_model=Assistant)
async def read_assistant(
    assistant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific assistant"""
    assistant = get_assistant_by_id(db, assistant_id=assistant_id)
    if not assistant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assistant not found"
        )
    
    # Check if user has access to this assistant
    if assistant.user_id != current_user.id and not assistant.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return assistant

@router.put("/{assistant_id}", response_model=Assistant)
async def update_assistant_endpoint(
    assistant_id: int,
    assistant_in: AssistantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update an assistant"""
    # Validate YAML content if provided
    if assistant_in.yaml_content is not None:
        is_valid, errors = validate_yaml(assistant_in.yaml_content)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid YAML content", "errors": errors}
            )
    
    assistant = update_assistant(db, assistant_id=assistant_id, assistant_in=assistant_in, user_id=current_user.id)
    if not assistant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assistant not found or not enough permissions"
        )
    
    return assistant

@router.delete("/{assistant_id}")
async def delete_assistant_endpoint(
    response: Response,
    assistant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """Delete an assistant"""
    success = delete_assistant(db, assistant_id=assistant_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assistant not found or not enough permissions"
        )
    
    response.status_code = status.HTTP_204_NO_CONTENT
    return {}
