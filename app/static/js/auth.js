// Authentication handling for ADLMaker

const auth = {
    // Current user data
    currentUser: null,
    
    // Initialize authentication
    init: async () => {
        // Check if user is logged in
        if (api.token.isValid()) {
            try {
                // Get current user data
                auth.currentUser = await api.user.getCurrent();
                auth.updateUI(true);
                window.dispatchEvent(new CustomEvent('auth:login', { detail: auth.currentUser }));
            } catch (error) {
                // Token is invalid, log out
                api.token.remove();
                auth.updateUI(false);
            }
        } else {
            auth.updateUI(false);
        }
        
        // Set up event listeners
        auth.setupEventListeners();
    },
    
    // Update UI based on authentication status
    updateUI: (isLoggedIn) => {
        const loginButton = document.getElementById('login-button');
        const registerButton = document.getElementById('register-button');
        const userProfile = document.getElementById('user-profile');
        const userName = document.getElementById('user-name');
        const adminPanelLink = document.getElementById('admin-panel-link');
        
        if (isLoggedIn && auth.currentUser) {
            // Hide login/register buttons, show user profile
            loginButton.classList.add('hidden');
            registerButton.classList.add('hidden');
            userProfile.classList.remove('hidden');
            userName.textContent = auth.currentUser.name;
            
            // Update navigation
            document.getElementById('nav-my-assistants').classList.remove('hidden');
            
            // Check if user is admin and show admin options
            if (auth.currentUser.is_admin) {
                // Mostrar el botón de administración
                const adminButton = document.getElementById('nav-admin');
                if (adminButton) {
                    adminButton.parentElement.classList.remove('hidden');
                }
                
                // Mostrar el enlace del panel de administración en el menú desplegable
                if (adminPanelLink) {
                    adminPanelLink.classList.remove('hidden');
                }
                
                // Inicializar el módulo de administración si el usuario es administrador
                if (typeof admin !== 'undefined' && admin && typeof admin.init === 'function') {
                    // Inicializar el módulo de administración de forma segura
                    try {
                        admin.init();
                    } catch (error) {
                        console.error('Error al inicializar el módulo de administración:', error);
                    }
                }
                
                // Agregar event listener al botón de administración si no lo tiene
                if (adminButton && !adminButton.hasAttribute('data-event-attached')) {
                    adminButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        app.navigateTo('admin');
                    });
                    adminButton.setAttribute('data-event-attached', 'true');
                }
            } else {
                // Ocultar opciones de administración para usuarios no administradores
                if (adminPanelLink) {
                    adminPanelLink.classList.add('hidden');
                }
            }
        } else {
            // Show login/register buttons, hide user profile
            loginButton.classList.remove('hidden');
            registerButton.classList.remove('hidden');
            userProfile.classList.add('hidden');
            
            // Update navigation
            document.getElementById('nav-my-assistants').classList.add('hidden');
            
            // Hide admin button if it exists
            const adminButton = document.getElementById('nav-admin');
            if (adminButton) {
                adminButton.parentElement.classList.add('hidden');
            }
            
            // Ocultar el enlace del panel de administración
            if (adminPanelLink) {
                adminPanelLink.classList.add('hidden');
            }
        }
    },
    
    // Set up event listeners for authentication
    setupEventListeners: () => {
        // Login button
        document.getElementById('login-button').addEventListener('click', () => {
            document.getElementById('login-modal').style.display = 'block';
        });
        
        // Register button
        document.getElementById('register-button').addEventListener('click', () => {
            document.getElementById('register-modal').style.display = 'block';
        });
        
        // Logout button
        document.getElementById('logout-button').addEventListener('click', () => {
            api.auth.logout();
            auth.currentUser = null;
            auth.updateUI(false);
            
            // Update auth-required elements
            app.updateAuthRequiredElements();
            
            // Redirect to home page
            app.navigateTo('home');
            
            // Show notification
            app.showNotification('You have been logged out successfully.', 'info');
        });
        
        // Close buttons for modals
        document.querySelectorAll('.modal .close').forEach(closeButton => {
            closeButton.addEventListener('click', () => {
                closeButton.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            document.querySelectorAll('.modal').forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Login form submission
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                await api.auth.login(email, password);
                auth.currentUser = await api.user.getCurrent();
                auth.updateUI(true);
                
                // Update auth-required elements
                app.updateAuthRequiredElements();
                
                // Close modal
                document.getElementById('login-modal').style.display = 'none';
                
                // Show notification
                app.showNotification(i18n.t('auth.loginSuccess'), 'success');
                
                // Trigger login event
                window.dispatchEvent(new CustomEvent('auth:login', { detail: auth.currentUser }));
                
                // Redirect to my assistants page
                app.navigateTo('my-assistants');
            } catch (error) {
                // Mostrar mensaje específico según el error
                if (error.detail && error.detail === 'Incorrect email or password') {
                    app.showNotification(i18n.t('auth.incorrectCredentials'), 'error');
                } else {
                    app.showNotification(i18n.t('auth.loginError'), 'error');
                }
            }
        });
        
        // Register form submission
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const role = document.getElementById('register-role').value;
            const organization = document.getElementById('register-organization').value;
            
            // Validate passwords match
            if (password !== confirmPassword) {
                app.showNotification('Passwords do not match.', 'error');
                return;
            }
            
            try {
                // Register user
                const userData = {
                    email,
                    name,
                    password,
                    role: role || undefined,
                    organization: organization || undefined
                };
                
                await api.user.register(userData);
                
                // Log in with new credentials
                await api.auth.login(email, password);
                auth.currentUser = await api.user.getCurrent();
                auth.updateUI(true);
                
                // Close modal
                document.getElementById('register-modal').style.display = 'none';
                
                // Show notification
                app.showNotification('Registration successful!', 'success');
                
                // Trigger login event
                window.dispatchEvent(new CustomEvent('auth:login', { detail: auth.currentUser }));
            } catch (error) {
                console.error('Registration error:', error);
                app.showNotification(error.detail || 'Registration failed. Please try again.', 'error');
            }
        });
    }
};
