/**
 * Utilidades de depuración para la autenticación en ADLBuilder
 */
(function() {
    // Verificar si ya existe el objeto global
    if (!window.authDebug) {
        window.authDebug = {};
    }
    
    /**
     * Muestra el estado actual de autenticación
     */
    authDebug.showStatus = function() {
        const authStatus = {
            authExists: !!window.auth,
            currentUser: window.auth ? window.auth.currentUser : null,
            tokenExists: !!(window.api && window.api.token),
            tokenValid: (window.api && window.api.token) ? window.api.token.isValid() : false,
            token: (window.api && window.api.token) ? window.api.token.get() : null
        };
        
        console.log('------- ESTADO DE AUTENTICACIÓN -------');
        console.log(JSON.stringify(authStatus, null, 2));
        console.log('--------------------------------------');
        
        return authStatus;
    };
    
    /**
     * Intenta actualizar los datos del usuario desde la API
     */
    authDebug.refreshUser = async function() {
        try {
            if (!window.api || !window.api.token || !window.api.token.isValid() || !window.api.user) {
                console.log('No hay token válido o la API no está disponible');
                return false;
            }
            
            const userData = await window.api.user.getCurrent();
            console.log('Datos de usuario obtenidos:', userData);
            
            if (userData && window.auth) {
                window.auth.currentUser = userData;
                console.log('auth.currentUser actualizado correctamente');
                return true;
            } else {
                console.log('No se pudo actualizar auth.currentUser');
                return false;
            }
        } catch (error) {
            console.error('Error al refrescar datos de usuario:', error);
            return false;
        }
    };
    
    /**
     * Forzar un login con las credenciales proporcionadas
     */
    authDebug.forceLogin = async function(email, password) {
        try {
            if (!window.api || !window.api.login) {
                console.log('API no disponible');
                return false;
            }
            
            const result = await window.api.login(email, password);
            console.log('Resultado del login:', result);
            
            if (result && window.auth) {
                // Intentar obtener y actualizar los datos del usuario
                await authDebug.refreshUser();
                // Verificar estado de autenticación
                return authDebug.showStatus();
            } else {
                console.log('No se pudo completar el login');
                return false;
            }
        } catch (error) {
            console.error('Error en el login:', error);
            return false;
        }
    };
    
    // Añadir un botón de ayuda para mostrar el estado actual
    function addDebugButton() {
        // Solo si estamos en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const button = document.createElement('button');
            button.textContent = '🔍 Debug Auth';
            button.style.position = 'fixed';
            button.style.bottom = '10px';
            button.style.right = '10px';
            button.style.zIndex = '10000';
            button.style.padding = '5px 10px';
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', function() {
                const status = authDebug.showStatus();
                alert('Estado de autenticación:\n\n' + 
                      'Auth existe: ' + status.authExists + '\n' + 
                      'Usuario autenticado: ' + (status.currentUser ? 'Sí' : 'No') + '\n' +
                      'Token válido: ' + status.tokenValid);
                
                if (!status.currentUser && status.tokenValid) {
                    const refresh = confirm('¿Intentar actualizar datos de usuario desde la API?');
                    if (refresh) {
                        authDebug.refreshUser().then(success => {
                            if (success) {
                                alert('Datos actualizados correctamente');
                            } else {
                                alert('No se pudieron actualizar los datos');
                            }
                        });
                    }
                }
            });
            
            document.body.appendChild(button);
        }
    }
    
    // Agregar el botón una vez que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDebugButton);
    } else {
        addDebugButton();
    }
    
    console.log('Herramientas de depuración de autenticación cargadas. Usa authDebug.showStatus() para ver el estado actual');
})();
