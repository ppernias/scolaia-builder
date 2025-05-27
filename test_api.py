import requests
import json

# Configuración
BASE_URL = 'http://localhost:8080/api/v1'
ADMIN_EMAIL = 'admin@example.com'
ADMIN_PASSWORD = 'password'

# Función para imprimir respuestas de forma legible
def print_response(response, message=''):
    print(f"\n{message}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

# Obtener token de acceso para el administrador
def get_admin_token():
    login_data = {
        'username': ADMIN_EMAIL,
        'password': ADMIN_PASSWORD
    }
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data=login_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        print_response(response, "Error al obtener token de administrador")
        return None

# Probar endpoint de listar usuarios
def test_list_users(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print_response(response, "Listar usuarios")

# Probar endpoint de contar usuarios
def test_count_users(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{BASE_URL}/admin/users/count", headers=headers)
    print_response(response, "Contar usuarios")

# Probar creación de un usuario normal
def test_create_user():
    user_data = {
        'email': 'test@example.com',
        'password': 'password123',
        'name': 'Test User'
    }
    response = requests.post(f"{BASE_URL}/users", json=user_data)
    print_response(response, "Crear usuario normal")
    return response.json() if response.status_code == 201 else None

# Probar promoción de usuario a administrador
def test_promote_user(token, user_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.patch(f"{BASE_URL}/admin/users/{user_id}/promote", headers=headers)
    print_response(response, "Promover usuario a administrador")

# Probar degradación de usuario administrador
def test_demote_user(token, user_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.patch(f"{BASE_URL}/admin/users/{user_id}/demote", headers=headers)
    print_response(response, "Degradar usuario administrador")

# Probar eliminación de usuario
def test_delete_user(token, user_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.delete(f"{BASE_URL}/admin/users/{user_id}", headers=headers)
    print_response(response, "Eliminar usuario")

# Ejecutar pruebas
def run_tests():
    # Obtener token de administrador
    admin_token = get_admin_token()
    if not admin_token:
        print("No se pudo obtener el token de administrador. Finalizando pruebas.")
        return
    
    print(f"Token de administrador obtenido: {admin_token[:10]}...")
    
    # Probar endpoints de administración
    test_count_users(admin_token)
    test_list_users(admin_token)
    
    # Crear un usuario normal para pruebas
    new_user = test_create_user()
    if new_user and 'id' in new_user:
        user_id = new_user['id']
        
        # Probar promoción y degradación
        test_promote_user(admin_token, user_id)
        test_demote_user(admin_token, user_id)
        
        # Eliminar usuario de prueba
        test_delete_user(admin_token, user_id)
    
    print("\nPruebas completadas.")

if __name__ == "__main__":
    run_tests()
