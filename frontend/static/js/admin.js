// Funcionalidad de administraciu00f3n para ADLBuilder

const admin = {
    // Estado actual
    state: {
        users: [],
        loading: false,
        error: null
    },
    
    // Inicializar administraciu00f3n
    init: async () => {
        // Verificar si el usuario actual es administrador
        if (auth && auth.currentUser && auth.currentUser.is_admin) {
            // Cargar plantilla de administraciu00f3n
            admin.loadAdminTemplate();
            
            // Configurar event listeners
            admin.setupEventListeners();
            
            // Cargar usuarios
            await admin.loadUsers();
        } else {
            console.log('El usuario actual no tiene permisos de administrador. No se cargaru00e1 el panel de administraciu00f3n.');
        }
    },
    
    // Cargar plantilla de administraciu00f3n
    loadAdminTemplate: () => {
        // Crear la pu00e1gina de administraciu00f3n si no existe
        let adminPage = document.getElementById('page-admin');
        if (!adminPage) {
            adminPage = document.createElement('div');
            adminPage.id = 'page-admin';
            adminPage.className = 'page hidden';
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.appendChild(adminPage);
            } else {
                console.error('No se pudo encontrar el elemento main para agregar la pu00e1gina de administraciu00f3n');
                return;
            }
        }
        
        // Si no existe la plantilla, creu00e1mosla
        if (!document.getElementById('template-admin')) {
            const template = document.createElement('template');
            template.id = 'template-admin';
            template.innerHTML = `
                <div class="container">
                    <div class="admin-container">
                        <div class="admin-header">
                            <h2>Panel de Administraciu00f3n</h2>
                        </div>
                        <div class="admin-section">
                            <h3>Gestiu00f3n de Usuarios</h3>
                            <div class="users-filter">
                                <input type="text" id="user-search" placeholder="Buscar usuarios...">
                            </div>
                            <div class="users-list">
                                <!-- Se poblaru00e1 dinu00e1micamente -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(template);
        }
        
        // Cargar contenido de la plantilla
        const template = document.getElementById('template-admin');
        if (template && adminPage) {
            adminPage.innerHTML = template.innerHTML;
        } else {
            console.error('No se pudo encontrar la plantilla de administraciu00f3n o la pu00e1gina de administraciu00f3n');
        }
    },
    
    // Configurar event listeners
    setupEventListeners: () => {
        // Buscar usuarios
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
            searchInput.addEventListener('input', admin.filterUsers);
        }
    },
    
    // Cargar usuarios desde la API
    loadUsers: async () => {
        try {
            admin.state.loading = true;
            admin.state.error = null;
            
            const usersList = await api.admin.listUsers();
            admin.state.users = usersList;
            
            admin.renderUsers();
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            admin.state.error = error.detail || 'Error al cargar usuarios';
            app.showNotification('Error al cargar usuarios. Por favor, intu00e9ntalo de nuevo.', 'error');
        } finally {
            admin.state.loading = false;
        }
    },
    
    // Filtrar usuarios
    filterUsers: () => {
        const searchInput = document.getElementById('user-search');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        // Filtrar usuarios por nombre o email
        const filteredUsers = admin.state.users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm)
        );
        
        admin.renderUsers(filteredUsers);
    },
    
    // Renderizar lista de usuarios
    renderUsers: (users = admin.state.users) => {
        const usersList = document.querySelector('.users-list');
        if (!usersList) return;
        
        // Mostrar mensaje de carga
        if (admin.state.loading) {
            usersList.innerHTML = '<div class="loading">Cargando usuarios...</div>';
            return;
        }
        
        // Mostrar mensaje de error
        if (admin.state.error) {
            usersList.innerHTML = `<div class="error-message">${admin.state.error}</div>`;
            return;
        }
        
        // Mostrar mensaje si no hay usuarios
        if (users.length === 0) {
            usersList.innerHTML = '<div class="empty-message">No se encontraron usuarios</div>';
            return;
        }
        
        // Renderizar lista de usuarios
        usersList.innerHTML = users.map(user => `
            <div class="user-item" data-id="${user.id}">
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <div class="user-meta">
                        <span>${user.email}</span>
                        ${user.is_admin ? '<span class="admin-badge">Admin</span>' : ''}
                    </div>
                </div>
                <div class="user-actions">
                    ${!user.is_admin ? `<button class="btn btn-danger delete-user" data-id="${user.id}">Eliminar</button>` : ''}
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners a los botones de eliminar
        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', async (event) => {
                const userId = event.target.dataset.id;
                if (confirm('u00bfEstu00e1s seguro de que deseas eliminar este usuario? Esta acciu00f3n no se puede deshacer.')) {
                    await admin.deleteUser(userId);
                }
            });
        });
    },
    
    // Eliminar usuario
    deleteUser: async (userId) => {
        try {
            await api.admin.deleteUser(userId);
            
            // Actualizar lista de usuarios
            admin.state.users = admin.state.users.filter(user => user.id !== parseInt(userId));
            admin.renderUsers();
            
            app.showNotification('Usuario eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            app.showNotification(error.detail || 'Error al eliminar usuario', 'error');
        }
    }
};
