#!/usr/bin/env python3
import os
import sys

# Añadir el directorio raíz al path para poder importar los módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User

def check_users():
    # Crear una sesión de base de datos
    session = Session(engine)
    
    # Consultar todos los usuarios
    users = session.query(User).all()
    
    # Mostrar información de los usuarios
    print(f'Total de usuarios: {len(users)}')
    for user in users:
        print(f'ID: {user.id}, Nombre: {user.name}, Email: {user.email}, Admin: {user.is_admin}')

if __name__ == "__main__":
    check_users()
