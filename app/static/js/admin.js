// Funcionalidad de administraciu00f3n para ADLBuilder

window.admin = {
    // Estado actual
    state: {
        users: [],
        loading: false,
        error: null,
        pagination: {
            page: 0,
            limit: 10,
            total: 0,
            totalPages: 0
        },
        search: ''
    },
    
    // Inicializar administración
    init: async () => {
        debug.info('Inicializando módulo de administración');
        
        // Verificar si el usuario actual es administrador
        if (auth && auth.currentUser && auth.currentUser.is_admin) {
            debug.verbose('Usuario administrador verificado');
            
            // Cargar plantilla de administración
            admin.loadAdminTemplate();
            
            // Configurar event listeners
            admin.setupEventListeners();
            
            // Cargar usuarios
            try {
                await admin.loadUsers();
                debug.info('Usuarios cargados correctamente');
            } catch (error) {
                debug.error('Error al cargar usuarios:', error);
                app.showNotification('Error al cargar usuarios. Por favor, intenta de nuevo.', 'error');
            }
        } else {
            debug.warn('Usuario sin permisos de administrador');
            app.showNotification('No tienes permisos para acceder al panel de administración', 'error');
            app.navigateTo('home');
        }
    },
    
    // Cargar plantilla de administración
    loadAdminTemplate: () => {
        debug.verbose('Cargando plantilla de administración');
        
        // Crear la página de administración si no existe
        let adminPage = document.getElementById('page-admin');
        if (!adminPage) {
            adminPage = document.createElement('div');
            adminPage.id = 'page-admin';
            adminPage.className = 'page active';
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.appendChild(adminPage);
                debug.verbose('Página de administración creada');
            } else {
                debug.error('No se pudo encontrar el elemento main');
                return;
            }
        } else {
            // Limpiar el contenido existente
            adminPage.innerHTML = '';
            // Asegurar que la página sea visible
            adminPage.classList.add('active');
            adminPage.classList.remove('hidden');
        }
        
        // Crear el contenido directamente sin usar template
        
        // Contenedor principal
        const container = document.createElement('div');
        container.className = 'container';
        adminPage.appendChild(container);
        
        // Contenedor de administración
        const adminContainer = document.createElement('div');
        adminContainer.className = 'admin-container';
        container.appendChild(adminContainer);
        
        // Encabezado
        const adminHeader = document.createElement('div');
        adminHeader.className = 'admin-header';
        adminHeader.innerHTML = '<h2>Panel de Administración</h2>';
        adminContainer.appendChild(adminHeader);
        
        // Sección de usuarios
        const adminSection = document.createElement('div');
        adminSection.className = 'admin-section';
        adminSection.innerHTML = '<h3>Gestión de Usuarios</h3>';
        adminContainer.appendChild(adminSection);
        
        // Filtro de usuarios
        const usersFilter = document.createElement('div');
        usersFilter.className = 'users-filter';
        usersFilter.innerHTML = `
            <input type="text" id="user-search" placeholder="Buscar usuarios...">
            <button id="search-users-btn" class="btn btn-outline">Buscar</button>
        `;
        adminSection.appendChild(usersFilter);
        
        // Lista de usuarios
        const usersList = document.createElement('div');
        usersList.className = 'users-list';
        usersList.innerHTML = '<div class="loading">Cargando usuarios...</div>';
        adminSection.appendChild(usersList);
        
        // Controles de paginación
        const paginationControls = document.createElement('div');
        paginationControls.className = 'pagination-controls';
        paginationControls.innerHTML = `
            <button id="prev-page" class="btn btn-outline" disabled>Anterior</button>
            <span id="page-info">Página 1 de 1</span>
            <button id="next-page" class="btn btn-outline" disabled>Siguiente</button>
        `;
        adminSection.appendChild(paginationControls);
        
        // Asegurarse de que el panel sea visible
        adminPage.style.display = 'block';
        debug.verbose('Panel de administración creado');
    },
    
    // Configurar event listeners
    setupEventListeners: () => {
        // Buscar usuarios
        const searchInput = document.getElementById('user-search');
        const searchButton = document.getElementById('search-users-btn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    admin.state.search = searchInput.value;
                    admin.state.pagination.page = 0; // Resetear a la primera página
                    admin.loadUsers();
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                admin.state.search = searchInput ? searchInput.value : '';
                admin.state.pagination.page = 0; // Resetear a la primera página
                admin.loadUsers();
            });
        }
        
        // Paginación
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (admin.state.pagination.page > 0) {
                    admin.state.pagination.page--;
                    admin.loadUsers();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                if (admin.state.pagination.page < admin.state.pagination.totalPages - 1) {
                    admin.state.pagination.page++;
                    admin.loadUsers();
                }
            });
        }
    },
    
    // Cargar usuarios desde la API con paginación
    loadUsers: async () => {
        debug.verbose('Cargando usuarios');
        
        // Actualizar estado
        admin.state.loading = true;
        admin.state.error = null;
        
        try {
            // Obtener el total de usuarios para la paginación
            const totalUsers = await api.admin.countUsers(admin.state.search);
            
            // Calcular el total de páginas
            admin.state.pagination.total = totalUsers;
            admin.state.pagination.totalPages = Math.ceil(totalUsers / admin.state.pagination.limit);
            
            // Obtener usuarios para la página actual
            const users = await api.admin.listUsers(
                admin.state.pagination.page,
                admin.state.pagination.limit,
                admin.state.search
            );
            
            // Actualizar estado
            admin.state.users = users;
            admin.state.loading = false;
            
            // Renderizar usuarios
            admin.renderUsers();
            
            // Actualizar controles de paginación
            admin.updatePaginationControls();
        } catch (error) {
            debug.error('Error al cargar usuarios:', error);
            admin.state.error = error;
            admin.state.loading = false;
            app.showNotification('Error al cargar usuarios', 'error');
        }
    },
    
    // Actualizar controles de paginación
    updatePaginationControls: () => {
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        if (prevPageBtn) {
            prevPageBtn.disabled = admin.state.pagination.page <= 0;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = admin.state.pagination.page >= admin.state.pagination.totalPages - 1;
        }
        
        if (pageInfo) {
            const currentPage = admin.state.pagination.page + 1;
            const totalPages = Math.max(1, admin.state.pagination.totalPages);
            pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        }
    },
    
    
    // Renderizar lista de usuarios
    renderUsers: (users = admin.state.users) => {
        const usersList = document.querySelector('.users-list');
        if (!usersList) {
            debug.error('No se encontró el elemento .users-list');
            return;
        }
        
        debug.verbose('Renderizando usuarios:', users.length);
        
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
        if (!users || users.length === 0) {
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
                    ${!user.is_admin ? 
                        `<button class="btn btn-primary promote-user" data-id="${user.id}">Promover a Admin</button>
                         <button class="btn btn-danger delete-user" data-id="${user.id}">Eliminar</button>` : 
                        `<button class="btn btn-warning demote-user" data-id="${user.id}">Quitar Admin</button>`
                    }
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
        
        // Agregar event listeners a los botones de promover
        document.querySelectorAll('.promote-user').forEach(button => {
            button.addEventListener('click', async (event) => {
                const userId = event.target.dataset.id;
                if (confirm('u00bfEstu00e1s seguro de que deseas promover a este usuario a administrador?')) {
                    await admin.promoteUser(userId);
                }
            });
        });
        
        // Agregar event listeners a los botones de degradar
        document.querySelectorAll('.demote-user').forEach(button => {
            button.addEventListener('click', async (event) => {
                const userId = event.target.dataset.id;
                if (confirm('u00bfEstu00e1s seguro de que deseas quitar los privilegios de administrador a este usuario?')) {
                    await admin.demoteUser(userId);
                }
            });
        });
    },
    
    // Eliminar usuario
    deleteUser: async (userId) => {
        try {
            await api.admin.deleteUser(userId);
            
            // Recargar la lista de usuarios para mantener la paginación actualizada
            await admin.loadUsers();
            
            app.showNotification('Usuario eliminado correctamente', 'success');
        } catch (error) {
            debug.error('Error al eliminar usuario:', error);
            app.showNotification(error.detail || 'Error al eliminar usuario', 'error');
        }
    },
    
    // Promover usuario a administrador
    promoteUser: async (userId) => {
        try {
            await api.admin.promoteUser(userId);
            
            // Recargar la lista de usuarios
            await admin.loadUsers();
            
            app.showNotification('Usuario promovido a administrador correctamente', 'success');
        } catch (error) {
            debug.error('Error al promover usuario:', error);
            app.showNotification(error.detail || 'Error al promover usuario', 'error');
        }
    },
    
    // Quitar privilegios de administrador a un usuario
    demoteUser: async (userId) => {
        try {
            await api.admin.demoteUser(userId);
            
            // Recargar la lista de usuarios
            await admin.loadUsers();
            
            app.showNotification('Privilegios de administrador removidos correctamente', 'success');
        } catch (error) {
            debug.error('Error al quitar privilegios de administrador:', error);
            app.showNotification(error.detail || 'Error al quitar privilegios de administrador', 'error');
        }
    }
};
