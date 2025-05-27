from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

from ..core.database import get_db
from ..schemas.user import User, UserCreate, UserUpdate
from ..services.user import get_user_by_email, create_user, get_user_by_id, update_user
from ..api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """Register a new user"""
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    return create_user(db, user_in=user_in)

@router.get("/me", response_model=User)
async def read_current_user(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get current user"""
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update current user"""
    # Check if email is being updated and if it's already in use
    if user_in.email and user_in.email != current_user.email:
        user = get_user_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    return update_user(db, user_id=current_user.id, user_in=user_in)
