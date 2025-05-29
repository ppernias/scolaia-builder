// Configuration settings for ADLBuilder

window.config = {
    // Debug settings
    debug: false, // Set to false by default to reduce console noise
    
    // Debug levels configuration
    debugLevels: {
        error: true,    // Always show errors
        warn: true,     // Show warnings
        info: true,     // Temporarily show informational messages for debugging
        verbose: false  // Hide verbose debugging messages
    },
    
    // Configuración para proxies
    proxy: {
        enabled: true, // Habilitar soporte para proxies
        forceHttps: true, // Forzar HTTPS en las solicitudes cuando la página se carga por HTTPS
        allowInsecureTokens: true // Permitir tokens menos seguros en desarrollo
    },
    
    // Obtener la URL base con el protocolo correcto
    getBaseUrl: () => {
        if (typeof window !== 'undefined' && window.location) {
            // En producción, usar la URL completa del host actual
            const host = window.location.host;
            const protocol = window.location.protocol;
            
            // Debug info
            if (config.debug) {
                console.log(`Current host: ${host}`);
                console.log(`Current protocol: ${protocol}`);
            }
            
            // Construir la URL base
            const baseUrl = `${protocol}//${host}/api/v1`;
            if (config.debug) console.log(`Using base URL: ${baseUrl}`);
            
            return baseUrl;
        }
        return '/api/v1';
    },
    
    // API configuration
    api: {
        // La baseUrl ahora es una propiedad computada que se evaluará en tiempo de ejecución
        get baseUrl() {
            return config.getBaseUrl();
        },
        endpoints: {
            auth: {
                login: '/auth/token',
                register: '/users'
            },
            users: {
                me: '/users/me',
                update: '/users/me',
                changePassword: '/users/me/password'
            },
            assistants: {
                list: '/assistants',
                create: '/assistants',
                get: (id) => `/assistants/${id}`,
                update: (id) => `/assistants/${id}`,
                delete: (id) => `/assistants/${id}`,
                public: '/assistants/public'
            },
            templates: {
                list: '/templates',
                get: (id) => `/templates/${id}`
            },
            validate: {
                yaml: '/validate/yaml'
            },
            schema: {
                get: '/schema'
            },
            admin: {
                users: '/admin/users',
                usersCount: '/admin/users/count',
                deleteUser: (id) => `/admin/users/${id}`,
                promoteUser: (id) => `/admin/users/${id}/promote`,
                demoteUser: (id) => `/admin/users/${id}/demote`
            }
        }
    }
};
