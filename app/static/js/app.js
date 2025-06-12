// Main application module

// Main application functionality for ADLMaker

// Create app object and expose it to the global window object
window.app = {
    // Initialize application
    init: async () => {
        // Set up event listeners
        app.setupEventListeners();
        
        // Load jsyaml library first
        try {
            await app.loadJsYaml();
            debug.info('js-yaml loaded successfully');
        } catch (error) {
            console.error('Failed to load js-yaml:', error);
        }
        
        // Initialize components in the correct order
        // Initialize internationalization first
        i18n.init();
        
        // Then initialize other components
        auth.init();
        templates.init();
        assistants.init();
        
        // Initialize editor last since it depends on other components
        // Load editor template first if we're on the editor page
        if (window.location.hash === '#editor') {
            editor.loadEditorTemplate();
            editor.init();
        }
        
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
            setTimeout(() => {
                editor.createNew();
            }, 200);
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
                setTimeout(() => {
                    editor.createNew();
                }, 200);
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
        
        // User profile link
        const profileLink = document.getElementById('user-profile-link');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                app.navigateTo('profile');
                // Hide dropdown menu
                const dropdownMenu = document.getElementById('user-dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        }
        
        // Admin panel link
        const adminPanelLink = document.getElementById('admin-panel-link');
        if (adminPanelLink) {
            adminPanelLink.addEventListener('click', (e) => {
                e.preventDefault();
                app.navigateTo('admin');
                // Hide dropdown menu
                const dropdownMenu = document.getElementById('user-dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.add('hidden');
                }
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-name') && !e.target.closest('#user-dropdown-menu')) {
                const dropdownMenu = document.getElementById('user-dropdown-menu');
                if (dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
                    dropdownMenu.classList.add('hidden');
                }
            }
        });
    },
    
    // Navigate to a page
    navigateTo: (page) => {
        debug.info(`Navigating to page: ${page}`);
        
        // Get all pages
        const pages = document.querySelectorAll('.page');
        
        // Hide all pages
        pages.forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });
        
        // Remove active class from all nav links
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected page
        const selectedPage = document.getElementById(`page-${page}`);
        if (selectedPage) {
            selectedPage.classList.add('active');
            selectedPage.style.display = 'block';
        }
        
        // Add active class to nav link
        const navLink = document.getElementById(`nav-${page}`);
        if (navLink) {
            navLink.classList.add('active');
        }
        
        // Special handling for different pages
        if (page === 'editor') {
            debug.verbose('Navigating to editor page, preparing editor...');
            // Wait for editor module to be ready
            const waitForEditor = () => {
                return new Promise((resolve) => {
                    if (window.editor && window.editor.prepareEditor) {
                        resolve(window.editor);
                    } else {
                        setTimeout(() => waitForEditor().then(resolve), 100);
                    }
                });
            };

            // Wait for editor and prepare it
            waitForEditor().then(editor => {
                editor.loadEditorTemplate();
                editor.prepareEditor();
            }).catch(error => {
                console.error('Error loading editor:', error);
                app.showNotification('Error loading editor. Please try again.', 'error');
            });
        } else if (page === 'templates') {
            // Load templates
            templates.loadTemplates();
        } else if (page === 'my-assistants') {
            // Load assistants
            assistants.loadAssistants();
        } else if (page === 'admin') {
            // Initialize admin panel if not already initialized
            if (typeof admin !== 'undefined' && !admin.initialized) {
                admin.init();
            }
            
            // Load users list
            if (typeof admin !== 'undefined') {
                admin.loadUsers();
            }
        } else if (page === 'profile') {
            // Load user profile
            profile.init();
        }
    },
    
    // Update visibility of elements that require authentication
    updateAuthRequiredElements: () => {
        const isAuthenticated = api.token.isValid();
        debug.verbose('Updating auth-required elements. User authenticated:', isAuthenticated);
        
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
