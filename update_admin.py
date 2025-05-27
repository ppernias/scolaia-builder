from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User
from app.services.auth import get_password_hash

def update_admin_user():
    # Crear una sesión de base de datos
    session = Session(engine)
    
    # Buscar el usuario administrador existente
    admin = session.query(User).filter(User.email == 'admin@example.com').first()
    
    # Si existe, actualizar su contraseña y asegurarse de que sea administrador
    if admin:
        admin.hashed_password = get_password_hash('password')
        admin.is_admin = True
        session.commit()
        print('Usuario administrador actualizado correctamente')
    else:
        # Si no existe, crear un nuevo usuario administrador
        new_admin = User(
            name='Admin',
            email='admin@example.com',
            hashed_password=get_password_hash('password'),
            is_admin=True
        )
        session.add(new_admin)
        session.commit()
        print('Usuario administrador creado correctamente')

if __name__ == "__main__":
    update_admin_user()
