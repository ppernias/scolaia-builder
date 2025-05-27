// Main application functionality for ADLBuilder

const app = {
    // Initialize application
    init: async () => {
        // Set up event listeners
        app.setupEventListeners();
        
        // Load jsyaml library first
        try {
            await app.loadJsYaml();
            console.log('js-yaml loaded successfully');
        } catch (error) {
            console.error('Failed to load js-yaml:', error);
        }
        
        // Initialize components in the correct order
        // Initialize internationalization first
        i18n.init();
        
        // Then initialize other components
        auth.init();
        editor.init();
        templates.init();
        assistants.init();
        
        // Apply translations again after all components are initialized
        // This ensures that dynamically created content is also translated
        setTimeout(() => {
            i18n.applyTranslations();
            // Update visibility of auth-required elements
            app.updateAuthRequiredElements();
            
            // Redirigir a la página de asistentes si el usuario está autenticado
            if (api.token.isValid()) {
                app.navigateTo('my-assistants');
            }
        }, 100);
        // No inicializamos admin.init() aquí, se inicializará cuando el usuario inicie sesión como administrador
        
        // Load editor template
        editor.loadEditorTemplate();
    },
    
    // Set up event listeners
    setupEventListeners: () => {
        // Navigation
        document.getElementById('nav-home').addEventListener('click', (e) => {
            e.preventDefault();
            app.navigateTo('home');
        });
        
        document.getElementById('nav-editor').addEventListener('click', (e) => {
            e.preventDefault();
            app.navigateTo('editor');
            editor.createNew();
        });
        
        document.getElementById('nav-templates').addEventListener('click', (e) => {
            e.preventDefault();
            app.navigateTo('templates');
        });
        
        document.getElementById('nav-my-assistants').addEventListener('click', (e) => {
            e.preventDefault();
            if (!api.token.isValid()) {
                app.showNotification('Please log in to view your assistants.', 'warning');
                document.getElementById('login-modal').style.display = 'block';
                return;
            }
            app.navigateTo('my-assistants');
        });
        
        // Home page buttons
        document.getElementById('get-started-button').addEventListener('click', () => {
            const isAuthenticated = api.token.isValid();
            if (isAuthenticated) {
                app.navigateTo('editor');
                editor.createNew();
            } else {
                // Show login required message
                app.showNotification(i18n.t('auth.loginRequired'), 'warning');
                document.getElementById('login-modal').style.display = 'block';
            }
        });
        
        document.getElementById('explore-templates-button').addEventListener('click', () => {
            const isAuthenticated = api.token.isValid();
            if (isAuthenticated) {
                app.navigateTo('templates');
            } else {
                // Show login required message
                app.showNotification(i18n.t('auth.loginRequired'), 'warning');
                document.getElementById('login-modal').style.display = 'block';
            }
        });
        
        // Admin navigation - solo agregar el event listener si el elemento existe
        const adminNavElement = document.getElementById('nav-admin');
        if (adminNavElement) {
            adminNavElement.addEventListener('click', (e) => {
                e.preventDefault();
                app.navigateTo('admin');
            });
        }
        
        // User dropdown menu
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdownMenu = document.getElementById('user-dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('hidden');
                }
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-dropdown')) {
                const dropdownMenu = document.getElementById('user-dropdown-menu');
                if (dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
                    dropdownMenu.classList.add('hidden');
                }
            }
        });
        
        // User profile link
        const userProfileLink = document.getElementById('user-profile-link');
        if (userProfileLink) {
            userProfileLink.addEventListener('click', (e) => {
                e.preventDefault();
                app.navigateTo('profile');
                document.getElementById('user-dropdown-menu').classList.add('hidden');
            });
        }
        
        // Admin panel link
        const adminPanelLink = document.getElementById('admin-panel-link');
        if (adminPanelLink) {
            adminPanelLink.addEventListener('click', (e) => {
                e.preventDefault();
                app.navigateTo('admin');
                document.getElementById('user-dropdown-menu').classList.add('hidden');
            });
        }
    },
    
    // Navigate to a page
    navigateTo: (page) => {
        // Check if user is authenticated for pages that require authentication
        const authRequiredPages = ['editor', 'templates', 'my-assistants', 'admin', 'profile'];
        const isAuthenticated = api.token.isValid();
        
        if (authRequiredPages.includes(page) && !isAuthenticated) {
            console.warn(`Usuario no autenticado intentando acceder a: ${page}`);
            app.showNotification(i18n.t('auth.loginRequired'), 'warning');
            page = 'home'; // Redirect to home page
        }
        
        // Hide all pages - remove active class and add hidden class
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.classList.add('hidden');
        });
        
        // Create admin page if it doesn't exist
        if (page === 'admin') {
            if (!document.getElementById('page-admin')) {
                const adminPage = document.createElement('div');
                adminPage.id = 'page-admin';
                adminPage.className = 'page';
                document.querySelector('main').appendChild(adminPage);
            }
            
            // Inicializar el módulo de administración si el usuario es administrador
            if (auth && auth.currentUser && auth.currentUser.is_admin) {
                if (typeof admin !== 'undefined' && admin && typeof admin.init === 'function') {
                    console.log('Inicializando módulo de administración...');
                    admin.init();
                } else {
                    console.error('El módulo de administración no está disponible');
                }
            } else {
                console.warn('Usuario no autorizado intentando acceder al panel de administración');
                app.showNotification('No tienes permisos para acceder al panel de administración', 'error');
                page = 'home'; // Redirigir a la página de inicio
            }
        }
        
        // Inicializar el módulo de perfil cuando se navega a la página de perfil
        if (page === 'profile') {
            // Verificar si el usuario está autenticado
            if (auth && auth.currentUser) {
                if (typeof profile !== 'undefined' && profile && typeof profile.init === 'function') {
                    console.log('Inicializando módulo de perfil...');
                    profile.init();
                } else {
                    console.error('El módulo de perfil no está disponible');
                }
            } else {
                console.warn('Usuario no autenticado intentando acceder al perfil');
                app.showNotification('Debes iniciar sesión para acceder a tu perfil', 'error');
                page = 'home'; // Redirigir a la página de inicio
            }
        }
        
        // Show selected page - add active class and remove hidden class
        const pageElement = document.getElementById(`page-${page}`);
        if (pageElement) {
            pageElement.classList.add('active');
            pageElement.classList.remove('hidden');
            console.log(`Mostrando página: ${page}`);
        } else {
            console.error(`Página no encontrada: ${page}`);
            return;
        }
        
        // Update active navigation
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        const navElement = document.getElementById(`nav-${page}`);
        if (navElement) {
            navElement.classList.add('active');
        }
    },
    
    // Update visibility of elements that require authentication
    updateAuthRequiredElements: () => {
        const isAuthenticated = api.token.isValid();
        console.log('Updating auth-required elements. User authenticated:', isAuthenticated);
        
        // Update all elements with auth-required class
        document.querySelectorAll('.auth-required').forEach(el => {
            if (isAuthenticated) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
        
        // Update navigation items that require authentication
        document.querySelectorAll('nav a[id^=\'nav-\']:not(#nav-home)').forEach(el => {
            if (isAuthenticated) {
                el.classList.remove('disabled');
            } else {
                el.classList.add('disabled');
            }
        });
        
        // Home is always enabled
        const homeLink = document.getElementById('nav-home');
        if (homeLink) {
            homeLink.classList.remove('disabled');
        }
    },
    
    // Show notification
    showNotification: (message, type = 'info') => {
        // Contador estático para gestionar múltiples notificaciones
        if (!app.notificationCount) {
            app.notificationCount = 0;
        }
        
        // Incrementar contador para esta notificación
        const notificationId = ++app.notificationCount;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = `notification-${notificationId}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="close-notification">&times;</button>
            </div>
        `;
        
        // Calcular posición vertical basada en notificaciones existentes
        const existingNotifications = document.querySelectorAll('.notification');
        let offsetTop = 80; // Posición inicial (coincide con el CSS)
        
        if (existingNotifications.length > 0) {
            // Calcular el desplazamiento para apilar las notificaciones
            existingNotifications.forEach(notif => {
                offsetTop += notif.offsetHeight + 10; // 10px de espacio entre notificaciones
            });
        }
        
        // Aplicar posición
        notification.style.top = `${offsetTop}px`;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Add event listener to close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            removeNotification(notification);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeNotification(notification);
        }, 5000);
        
        // Función para eliminar notificación y reposicionar las demás
        function removeNotification(notif) {
            if (document.body.contains(notif)) {
                // Guardar altura para ajustar las demás notificaciones
                const height = notif.offsetHeight;
                const top = parseInt(notif.style.top, 10);
                
                // Eliminar la notificación
                document.body.removeChild(notif);
                
                // Ajustar posición de las notificaciones que están por debajo
                const remainingNotifications = document.querySelectorAll('.notification');
                remainingNotifications.forEach(remaining => {
                    const currentTop = parseInt(remaining.style.top, 10);
                    if (currentTop > top) {
                        remaining.style.top = `${currentTop - height - 10}px`;
                    }
                });
            }
        }
    },
    
    // Load jsyaml library
    loadJsYaml: () => {
        return new Promise((resolve, reject) => {
            // Check if jsyaml is already loaded
            if (window.jsyaml) {
                resolve(window.jsyaml);
                return;
            }
            
            // Create script element
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
            script.integrity = 'sha512-CSBhVREyzHAjAFfBlIBakjoRUKp5h7VSweP0InR/pAJyptH7peuhCsqAI/snV+TwZmXZqoUklpXp6R6wMnYf5Q==';
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';
            
            // Set up load and error handlers
            script.onload = () => resolve(window.jsyaml);
            script.onerror = () => reject(new Error('Failed to load js-yaml library'));
            
            // Add to head
            document.head.appendChild(script);
        });
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', app.init);
