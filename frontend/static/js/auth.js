// Authentication handling for ADLBuilder

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
                    if (!adminButton.hasAttribute('data-event-attached')) {
                        adminButton.addEventListener('click', (e) => {
                            e.preventDefault();
                            app.navigateTo('admin');
                        });
                        adminButton.setAttribute('data-event-attached', 'true');
                    }
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
            
            // Redirect to home page
            app.navigateTo('home');
        });
        
        // Close buttons for modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            document.querySelectorAll('.modal').forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Login form submission
        document.getElementById('login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Clear previous error messages
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            
            try {
                await api.auth.login(email, password);
                auth.currentUser = await api.user.getCurrent();
                auth.updateUI(true);
                
                // Close modal and reset form
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('login-form').reset();
                
                // Trigger login event
                window.dispatchEvent(new CustomEvent('auth:login', { detail: auth.currentUser }));
            } catch (error) {
                // Display error message
                console.error('Login error:', error);
                
                // Create error element if it doesn't exist
                let errorElement = document.getElementById('login-error');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = 'login-error';
                    errorElement.className = 'error-message';
                    const loginForm = document.getElementById('login-form');
                    loginForm.insertBefore(errorElement, loginForm.firstChild);
                }
                
                // Show error message
                errorElement.textContent = error.detail || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
                errorElement.style.display = 'block';
                
                // Show notification
                app.showNotification('Error al iniciar sesión. Por favor, verifica tus credenciales.', 'error');
            }
        });
        
        // Register form submission
        document.getElementById('register-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const email = document.getElementById('register-email').value;
            const name = document.getElementById('register-name').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const role = document.getElementById('register-role').value;
            const organization = document.getElementById('register-organization').value;
            
            // Clear previous error messages
            const errorElement = document.getElementById('register-error');
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            
            // Validate passwords match
            if (password !== confirmPassword) {
                // Create error element if it doesn't exist
                let errorElement = document.getElementById('register-error');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = 'register-error';
                    errorElement.className = 'error-message';
                    const registerForm = document.getElementById('register-form');
                    registerForm.insertBefore(errorElement, registerForm.firstChild);
                }
                
                // Show error message
                errorElement.textContent = 'Las contraseñas no coinciden.';
                errorElement.style.display = 'block';
                
                app.showNotification('Las contraseñas no coinciden.', 'error');
                return;
            }
            
            try {
                console.log('Intentando registrar usuario con datos:', {
                    email,
                    name,
                    password: '********', // No mostramos la contraseu00f1a real por seguridad
                    role: role || undefined,
                    organization: organization || undefined,
                    contact: email
                });
                
                // Register user
                await api.auth.register({
                    email,
                    name,
                    password,
                    role: role || undefined,
                    organization: organization || undefined,
                    contact: email
                });
                
                // Login with new credentials
                await api.auth.login(email, password);
                auth.currentUser = await api.user.getCurrent();
                auth.updateUI(true);
                
                // Close modal and reset form
                document.getElementById('register-modal').style.display = 'none';
                document.getElementById('register-form').reset();
                
                // Trigger login event
                window.dispatchEvent(new CustomEvent('auth:login', { detail: auth.currentUser }));
                
                // Show success message
                app.showNotification('Registro exitoso!', 'success');
            } catch (error) {
                console.error('Registration error:', error);
                
                // Create error element if it doesn't exist
                let errorElement = document.getElementById('register-error');
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = 'register-error';
                    errorElement.className = 'error-message';
                    const registerForm = document.getElementById('register-form');
                    registerForm.insertBefore(errorElement, registerForm.firstChild);
                }
                
                // Determinar el mensaje de error apropiado
                let errorMessage = 'Error al registrarse. Por favor, inténtalo de nuevo.';
                
                if (error.detail) {
                    errorMessage = error.detail;
                } else if (error.data && error.data.detail) {
                    errorMessage = error.data.detail;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                // Si el error indica que el usuario ya existe
                if (errorMessage.includes('user with this email already exists') || 
                    errorMessage.includes('already exists')) {
                    errorMessage = 'Ya existe un usuario con este correo electrónico. Por favor, utiliza otro correo o inicia sesión.';
                }
                
                // Show error message
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
                
                // Show notification
                app.showNotification(errorMessage, 'error');
            }
        });
    }
};
