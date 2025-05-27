from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User

# Crear una sesiu00f3n de base de datos
session = Session(engine)

# Consultar todos los usuarios
users = session.query(User).all()

# Mostrar informaciu00f3n de los usuarios
print(f'Total de usuarios: {len(users)}')
for user in users:
    print(f'ID: {user.id}, Nombre: {user.name}, Email: {user.email}, Admin: {user.is_admin}')
