// Funcionalidad de perfil de usuario para ADLMaker

const profile = {
    // Estado actual
    state: {
        loading: false,
        error: null,
        successMessage: null,
        userData: null
    },
    
    // Inicializar perfil
    init: async () => {
        console.log('Inicializando módulo de perfil...');
        
        // Verificar que auth esté disponible y el usuario esté autenticado
        if (typeof auth === 'undefined') {
            console.error('El módulo auth no está disponible');
            app.showNotification('Error al cargar el perfil: módulo de autenticación no disponible', 'error');
            return;
        }
        
        // Verificar si el usuario está autenticado
        if (auth.currentUser) {
            console.log('Usuario autenticado, cargando perfil...');
            
            // Cargar plantilla de perfil
            profile.loadProfileTemplate();
            
            // Configurar event listeners
            profile.setupEventListeners();
            
            // Cargar datos del usuario
            try {
                await profile.loadUserData();
                console.log('Datos del usuario cargados correctamente');
            } catch (error) {
                console.error('Error al cargar datos del usuario:', error);
                app.showNotification('Error al cargar datos del usuario. Por favor, intenta de nuevo.', 'error');
            }
        } else {
            console.warn('El usuario no está autenticado. No se cargará el perfil.');
            app.showNotification('Debes iniciar sesión para acceder a tu perfil', 'error');
            app.navigateTo('home');
        }
    },
    
    // Cargar plantilla de perfil
    loadProfileTemplate: () => {
        console.log('Cargando plantilla de perfil...');
        
        // Obtener la página de perfil
        const profilePage = document.getElementById('page-profile');
        if (!profilePage) {
            console.error('No se encontró la página de perfil');
            return;
        }
        
        // Crear el contenido directamente en lugar de cargarlo desde una URL
        profilePage.innerHTML = `
        <div class="container profile-container">
            <div class="profile-header">
                <h2>Mi Perfil</h2>
                <p>Administra tu información personal y configuración de cuenta</p>
            </div>
            
            <div class="profile-content">
                <form id="profile-form" class="profile-form">
                    <div class="form-group">
                        <label for="profile-email">Email (Nombre de usuario)</label>
                        <input type="email" id="profile-email" readonly>
                        <small>El email se usa como nombre de usuario y no puede ser modificado</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="profile-name">Nombre completo</label>
                        <input type="text" id="profile-name" required>
                        <small>Nombre que aparecerá como autor en tus asistentes</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="profile-role">Rol o cargo (Opcional)</label>
                        <input type="text" id="profile-role">
                        <small>Ej: Profesor, Desarrollador, Consultor...</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="profile-organization">Organización (Opcional)</label>
                        <input type="text" id="profile-organization">
                        <small>Empresa o institución a la que perteneces</small>
                    </div>
                    
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                        <button type="button" id="change-password-btn" class="btn btn-outline">Cambiar Contraseña</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal para cambiar contraseña -->
        <div id="change-password-modal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Cambiar Contraseña</h2>
                <form id="change-password-form">
                    <div class="form-group">
                        <label for="current-password">Contraseña Actual</label>
                        <input type="password" id="current-password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="new-password">Nueva Contraseña</label>
                        <input type="password" id="new-password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm-new-password">Confirmar Nueva Contraseña</label>
                        <input type="password" id="confirm-new-password" required>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">Actualizar Contraseña</button>
                    </div>
                </form>
            </div>
        </div>
        `;
        
        console.log('Plantilla de perfil cargada correctamente');
        
        // Asegurar que la página sea visible cuando se navega a ella
        profilePage.classList.remove('hidden');
        profilePage.style.display = 'block';
    },
    
    // Configurar event listeners
    setupEventListeners: () => {
        // Formulario de perfil
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await profile.updateProfile();
            });
        }
        
        // Botón para cambiar contraseña
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                const modal = document.getElementById('change-password-modal');
                if (modal) {
                    modal.style.display = 'block';
                }
            });
        }
        
        // Cerrar modal de cambio de contraseña
        const closeBtn = document.querySelector('#change-password-modal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('change-password-modal').style.display = 'none';
            });
        }
        
        // Formulario de cambio de contraseña
        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await profile.changePassword();
            });
        }
    },
    
    // Cargar datos del usuario
    loadUserData: async () => {
        try {
            profile.state.loading = true;
            profile.state.error = null;
            
            // Obtener datos actualizados del usuario
            const userData = await api.user.getCurrent();
            profile.state.userData = userData;
            
            // Llenar el formulario con los datos del usuario
            profile.fillProfileForm(userData);
            
            return userData;
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            profile.state.error = error.detail || 'Error al cargar datos del usuario';
            throw error;
        } finally {
            profile.state.loading = false;
        }
    },
    
    // Llenar el formulario con los datos del usuario
    fillProfileForm: (userData) => {
        if (!userData) return;
        
        const emailInput = document.getElementById('profile-email');
        const nameInput = document.getElementById('profile-name');
        const roleInput = document.getElementById('profile-role');
        const organizationInput = document.getElementById('profile-organization');
        
        if (emailInput) emailInput.value = userData.email || '';
        if (nameInput) nameInput.value = userData.name || '';
        if (roleInput) roleInput.value = userData.role || '';
        if (organizationInput) organizationInput.value = userData.organization || '';
    },
    
    // Actualizar perfil
    updateProfile: async () => {
        try {
            profile.state.loading = true;
            profile.state.error = null;
            profile.state.successMessage = null;
            
            // Obtener datos del formulario
            const nameInput = document.getElementById('profile-name');
            const roleInput = document.getElementById('profile-role');
            const organizationInput = document.getElementById('profile-organization');
            
            // Validar campos requeridos
            if (!nameInput.value.trim()) {
                throw new Error('El nombre es obligatorio');
            }
            
            // Preparar datos para actualizar
            const userData = {
                name: nameInput.value.trim(),
                role: roleInput.value.trim() || null,
                organization: organizationInput.value.trim() || null,
                contact: null // Usar el email como contacto (se maneja en el backend)
            };
            
            // Actualizar perfil en la API
            await api.user.updateCurrent(userData);
            
            // Actualizar datos locales
            profile.state.userData = await profile.loadUserData();
            
            // Actualizar nombre en la interfaz
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = profile.state.userData.name;
            }
            
            // Actualizar datos en auth.currentUser
            if (auth && auth.currentUser) {
                auth.currentUser = profile.state.userData;
            }
            
            profile.state.successMessage = 'Perfil actualizado correctamente';
            app.showNotification('Perfil actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            profile.state.error = error.message || error.detail || 'Error al actualizar perfil';
            app.showNotification(profile.state.error, 'error');
        } finally {
            profile.state.loading = false;
        }
    },
    
    // Cambiar contraseña
    changePassword: async () => {
        try {
            // Obtener datos del formulario
            const currentPasswordInput = document.getElementById('current-password');
            const newPasswordInput = document.getElementById('new-password');
            const confirmNewPasswordInput = document.getElementById('confirm-new-password');
            
            // Validar campos
            if (!currentPasswordInput.value || !newPasswordInput.value || !confirmNewPasswordInput.value) {
                throw new Error('Todos los campos son obligatorios');
            }
            
            if (newPasswordInput.value !== confirmNewPasswordInput.value) {
                throw new Error('Las contraseñas nuevas no coinciden');
            }
            
            // Preparar datos para actualizar
            const passwordData = {
                current_password: currentPasswordInput.value,
                new_password: newPasswordInput.value
            };
            
            // Actualizar contraseña en la API
            await api.user.changePassword(passwordData);
            
            // Cerrar modal
            document.getElementById('change-password-modal').style.display = 'none';
            
            // Limpiar formulario
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmNewPasswordInput.value = '';
            
            app.showNotification('Contraseña actualizada correctamente', 'success');
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            app.showNotification(error.detail || error.message || 'Error al cambiar contraseña', 'error');
        }
    }
};
