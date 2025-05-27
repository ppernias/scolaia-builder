// Script de depuración para verificar la carga de componentes

console.log('Debug script loaded');

// Verificar que los objetos principales existan
console.log('API object:', typeof api !== 'undefined' ? 'Loaded' : 'Not loaded');
console.log('Auth object:', typeof auth !== 'undefined' ? 'Loaded' : 'Not loaded');
console.log('Admin object:', typeof admin !== 'undefined' ? 'Loaded' : 'Not loaded');
console.log('App object:', typeof app !== 'undefined' ? 'Loaded' : 'Not loaded');

// Verificar el estado de autenticación
if (typeof api !== 'undefined' && typeof api.token !== 'undefined') {
    console.log('Token valid:', api.token.isValid());
}

// Añadir un listener para cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Verificar elementos clave del DOM
    console.log('User profile element:', document.getElementById('user-profile') ? 'Found' : 'Not found');
    console.log('User name element:', document.getElementById('user-name') ? 'Found' : 'Not found');
    console.log('User dropdown menu:', document.getElementById('user-dropdown-menu') ? 'Found' : 'Not found');
    console.log('Admin panel link:', document.getElementById('admin-panel-link') ? 'Found' : 'Not found');
    
    // Verificar la página de administración
    console.log('Admin page:', document.getElementById('page-admin') ? 'Found' : 'Not found');
});
