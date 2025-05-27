#!/usr/bin/env python3
import os
import sys
import argparse
import csv

# Au00f1adir el directorio rau00edz al path para poder importar los mu00f3dulos de la aplicaciu00f3n
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.user import User
from app.services.auth import get_password_hash

def parse_arguments():
    parser = argparse.ArgumentParser(description='Administrar usuarios de ADLBuilder')
    subparsers = parser.add_subparsers(dest='command', help='Comando a ejecutar')
    
    # Comando para actualizar/crear administrador
    admin_parser = subparsers.add_parser('admin', help='Actualizar o crear usuario administrador')
    admin_parser.add_argument('--email', default='admin@example.com', help='Email del administrador')
    admin_parser.add_argument('--password', default='password', help='Contraseu00f1a del administrador')
    admin_parser.add_argument('--name', default='Admin', help='Nombre del administrador')
    
    # Comando para importar usuarios desde CSV
    import_parser = subparsers.add_parser('import', help='Importar usuarios desde archivo CSV')
    import_parser.add_argument('--file', required=True, help='Ruta al archivo CSV')
    import_parser.add_argument('--delimiter', default=',', help='Delimitador del CSV')
    import_parser.add_argument('--default-password', default='password123', 
                              help='Contraseu00f1a por defecto para usuarios importados')
    
    # Comando para añadir un solo usuario
    user_parser = subparsers.add_parser('add', help='Añadir un nuevo usuario')
    user_parser.add_argument('--email', required=True, help='Email del usuario')
    user_parser.add_argument('--password', required=True, help='Contraseña del usuario')
    user_parser.add_argument('--name', required=True, help='Nombre del usuario')
    user_parser.add_argument('--admin', action='store_true', help='Hacer al usuario administrador')
    
    return parser.parse_args()

def update_admin_user(email, password, name):
    # Crear una sesiu00f3n de base de datos
    session = Session(engine)
    
    # Buscar el usuario administrador existente
    admin = session.query(User).filter(User.email == email).first()
    
    # Si existe, actualizar su contraseu00f1a y asegurarse de que sea administrador
    if admin:
        admin.hashed_password = get_password_hash(password)
        admin.is_admin = True
        admin.name = name
        session.commit()
        print(f'Usuario administrador {email} actualizado correctamente')
    else:
        # Si no existe, crear un nuevo usuario administrador
        new_admin = User(
            name=name,
            email=email,
            hashed_password=get_password_hash(password),
            is_admin=True
        )
        session.add(new_admin)
        session.commit()
        print(f'Usuario administrador {email} creado correctamente')

def add_user(email, password, name, is_admin=False):
    # Crear una sesiu00f3n de base de datos
    session = Session(engine)
    
    # Verificar si el usuario ya existe
    existing_user = session.query(User).filter(User.email == email).first()
    if existing_user:
        print(f'El usuario con email {email} ya existe. Saltando.')
        return False
    
    # Crear nuevo usuario
    new_user = User(
        name=name,
        email=email,
        hashed_password=get_password_hash(password),
        is_admin=is_admin
    )
    session.add(new_user)
    session.commit()
    print(f'Usuario {email} creado correctamente')
    return True

def import_users_from_csv(csv_file, delimiter, default_password):
    # Verificar que el archivo existe
    if not os.path.exists(csv_file):
        print(f'Error: El archivo {csv_file} no existe')
        return
    
    # Contar usuarios añadidos
    users_added = 0
    users_skipped = 0
    
    try:
        with open(csv_file, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file, delimiter=delimiter)
            
            # Verificar que el CSV tiene las columnas necesarias
            required_fields = ['email', 'name']
            for field in required_fields:
                if field not in reader.fieldnames:
                    print(f'Error: El archivo CSV debe tener una columna "{field}"')
                    return
            
            # Procesar cada fila
            for row in reader:
                email = row['email'].strip()
                name = row['name'].strip()
                
                # Usar contraseña del CSV si existe, o la predeterminada
                password = row.get('password', '').strip() or default_password
                
                # Determinar si es admin (opcional)
                is_admin = row.get('is_admin', '').lower() in ['true', 'yes', '1', 'si', 'sí']
                
                # Añadir usuario
                if add_user(email, password, name, is_admin):
                    users_added += 1
                else:
                    users_skipped += 1
    
    except Exception as e:
        print(f'Error al importar usuarios: {str(e)}')
        return
    
    print(f'Importación completada: {users_added} usuarios añadidos, {users_skipped} usuarios omitidos')

def main():
    args = parse_arguments()
    
    if args.command == 'admin':
        update_admin_user(args.email, args.password, args.name)
    
    elif args.command == 'import':
        import_users_from_csv(args.file, args.delimiter, args.default_password)
    
    elif args.command == 'add':
        add_user(args.email, args.password, args.name, args.admin)
    
    else:
        print("Debe especificar un comando: admin, import o add")
        print("Ejecute 'python update_admin.py -h' para más información")

if __name__ == "__main__":
    main()
