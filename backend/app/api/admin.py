from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import Any, List

from ..core.database import get_db
from ..schemas.user import User
from ..models.user import User as UserModel
from ..api.deps import get_current_user
from ..services.user import get_user_by_id

router = APIRouter()

# Middleware para verificar si el usuario es administrador
def admin_required(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user

@router.get("/users", response_model=List[User])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
) -> Any:
    """Listar todos los usuarios (solo administradores)"""
    users = db.query(UserModel).all()
    return users

@router.delete("/users/{user_id}")
async def delete_user(
    response: Response,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
) -> None:
    """Eliminar un usuario (solo administradores)"""
    # No permitir que un administrador se elimine a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )
    
    user = get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    db.delete(user)
    db.commit()
    response.status_code = status.HTTP_204_NO_CONTENT
