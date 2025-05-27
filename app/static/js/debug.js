// Script de depuración para verificar la carga de componentes

// Función de registro condicional que solo muestra mensajes en modo debug
const debugLog = (message, ...args) => {
    if (typeof config !== 'undefined' && config.debug) {
        console.log(message, ...args);
    }
};

// Inicialización del script de depuración
debugLog('Debug script loaded');

// Verificar que los objetos principales existan
debugLog('API object:', typeof api !== 'undefined' ? 'Loaded' : 'Not loaded');
debugLog('Auth object:', typeof auth !== 'undefined' ? 'Loaded' : 'Not loaded');
debugLog('Admin object:', typeof admin !== 'undefined' ? 'Loaded' : 'Not loaded');
debugLog('App object:', typeof app !== 'undefined' ? 'Loaded' : 'Not loaded');

// Verificar el estado de autenticación
if (typeof api !== 'undefined' && typeof api.token !== 'undefined') {
    debugLog('Token valid:', api.token.isValid());
}

// Añadir un listener para cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM fully loaded');
    
    // Verificar elementos clave del DOM
    debugLog('User profile element:', document.getElementById('user-profile') ? 'Found' : 'Not found');
    debugLog('User name element:', document.getElementById('user-name') ? 'Found' : 'Not found');
    debugLog('User dropdown menu:', document.getElementById('user-dropdown-menu') ? 'Found' : 'Not found');
    debugLog('Admin panel link:', document.getElementById('admin-panel-link') ? 'Found' : 'Not found');
    
    // Verificar la página de administración
    debugLog('Admin page:', document.getElementById('page-admin') ? 'Found' : 'Not found');
});
