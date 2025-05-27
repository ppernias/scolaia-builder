from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from ..core.database import get_db
from ..schemas.user import User, UserUpdate
from ..models.user import User as UserModel
from .auth import admin_required
from ..services.user import get_user_by_id

router = APIRouter()

@router.get("/users", response_model=List[User])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None
) -> Any:
    """Listar usuarios con paginación y búsqueda (solo administradores)"""
    query = db.query(UserModel)
    
    # Aplicar filtro de búsqueda si se proporciona
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            UserModel.name.ilike(search_term) | 
            UserModel.email.ilike(search_term)
        )
    
    # Obtener el total de usuarios para la paginación
    total = query.count()
    
    # Aplicar paginación
    users = query.offset(skip).limit(limit).all()
    
    # Agregar encabezados de paginación a la respuesta
    return users

@router.get("/users/count", response_model=dict)
async def count_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
    search: Optional[str] = None
) -> Any:
    """Obtener el número total de usuarios (solo administradores)"""
    query = db.query(UserModel)
    
    # Aplicar filtro de búsqueda si se proporciona
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            UserModel.name.ilike(search_term) | 
            UserModel.email.ilike(search_term)
        )
    
    total = query.count()
    return {"total": total}

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

@router.patch("/users/{user_id}/promote", response_model=User)
async def promote_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
) -> Any:
    """Promover un usuario a administrador (solo administradores)"""
    # No permitir que un administrador se promueva a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya eres administrador"
        )
    
    user = get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar si el usuario ya es administrador
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya es administrador"
        )
    
    # Promover al usuario a administrador
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/demote", response_model=User)
async def demote_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required)
) -> Any:
    """Quitar privilegios de administrador a un usuario (solo administradores)"""
    # No permitir que un administrador se quite privilegios a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes quitarte privilegios de administrador a ti mismo"
        )
    
    user = get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar si el usuario no es administrador
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario no es administrador"
        )
    
    # Quitar privilegios de administrador al usuario
    user.is_admin = False
    db.commit()
    db.refresh(user)
    return user
