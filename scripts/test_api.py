#!/usr/bin/env python3
import os
import sys
import requests
import json
import argparse

# Au00f1adir el directorio rau00edz al path para poder importar los mu00f3dulos de la aplicaciu00f3n
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def parse_arguments():
    parser = argparse.ArgumentParser(description='Prueba la API de ADLBuilder')
    parser.add_argument('--url', default='http://localhost:8080', help='URL base de la API')
    parser.add_argument('--email', default='admin@example.com', help='Email del usuario administrador')
    parser.add_argument('--password', default='password', help='Contraseu00f1a del usuario administrador')
    return parser.parse_args()

# Funciu00f3n para imprimir respuestas de forma legible
def print_response(response, message=''):
    print(f"\n{message}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

# Obtener token de acceso para el administrador
def get_admin_token(base_url, email, password):
    login_data = {
        'username': email,
        'password': password
    }
    response = requests.post(
        f"{base_url}/api/v1/auth/token",
        data=login_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        print_response(response, "Error al obtener token de administrador")
        return None

# Probar endpoint de listar usuarios
def test_list_users(base_url, token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{base_url}/api/v1/admin/users", headers=headers)
    print_response(response, "Listar usuarios")

# Probar endpoint de contar usuarios
def test_count_users(base_url, token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{base_url}/api/v1/admin/users/count", headers=headers)
    print_response(response, "Contar usuarios")

# Probar creaciu00f3n de un usuario normal
def test_create_user(base_url):
    user_data = {
        'email': 'test@example.com',
        'password': 'password123',
        'name': 'Test User'
    }
    response = requests.post(f"{base_url}/api/v1/users", json=user_data)
    print_response(response, "Crear usuario normal")
    return response.json() if response.status_code == 201 else None

# Probar promociu00f3n de usuario a administrador
def test_promote_user(base_url, token, user_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.patch(f"{base_url}/api/v1/admin/users/{user_id}/promote", headers=headers)
    print_response(response, "Promover usuario a administrador")

# Probar degradaciu00f3n de usuario administrador
def test_demote_user(base_url, token, user_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.patch(f"{base_url}/api/v1/admin/users/{user_id}/demote", headers=headers)
    print_response(response, "Degradar usuario administrador")

# Probar eliminaciu00f3n de usuario
def test_delete_user(base_url, token, user_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.delete(f"{base_url}/api/v1/admin/users/{user_id}", headers=headers)
    print_response(response, "Eliminar usuario")

# Ejecutar pruebas
def run_tests(args):
    base_url = args.url
    # Obtener token de administrador
    admin_token = get_admin_token(base_url, args.email, args.password)
    if not admin_token:
        print("No se pudo obtener el token de administrador. Finalizando pruebas.")
        return
    
    print(f"Token de administrador obtenido: {admin_token[:10]}...")
    
    # Probar endpoints de administraciu00f3n
    test_count_users(base_url, admin_token)
    test_list_users(base_url, admin_token)
    
    # Crear un usuario normal para pruebas
    new_user = test_create_user(base_url)
    if new_user and 'id' in new_user:
        user_id = new_user['id']
        
        # Probar promociu00f3n y degradaciu00f3n
        test_promote_user(base_url, admin_token, user_id)
        test_demote_user(base_url, admin_token, user_id)
        
        # Eliminar usuario de prueba
        test_delete_user(base_url, admin_token, user_id)
    
    print("\nPruebas completadas.")

if __name__ == "__main__":
    args = parse_arguments()
    run_tests(args)
