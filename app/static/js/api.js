// API handling for ADLBuilder

// Create API object and expose it to the global window object
window.api = {
    // Token management
    token: {
        get: () => localStorage.getItem('token'),
        set: (token) => localStorage.setItem('token', token),
        remove: () => localStorage.removeItem('token'),
        isValid: () => {
            const token = localStorage.getItem('token');
            if (!token) {
                if (config.debug) console.log('No token found in localStorage');
                return false;
            }
            
            try {
                // En modo de desarrollo con proxies, podemos ser menos estrictos con la validación
                if (config.proxy.enabled && config.proxy.allowInsecureTokens) {
                    if (config.debug) console.log('Proxy mode: using relaxed token validation');
                    
                    // Verificación básica: el token existe y tiene algún contenido
                    if (token.length < 10) {
                        if (config.debug) console.log('Token too short, considered invalid');
                        return false;
                    }
                    
                    // Intentamos verificar si tiene formato JWT, pero no fallamos si no lo tiene
                    const jwtFormat = token.match(/^[\w-]+\.[\w-]+\.[\w-]+$/);
                    if (!jwtFormat) {
                        if (config.debug) console.warn('Token does not have JWT format, but continuing in proxy mode');
                        // No retornamos false aquí, seguimos adelante
                    } else {
                        // Si tiene formato JWT, verificamos la expiración
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            if (payload.exp && payload.exp * 1000 < Date.now()) {
                                if (config.debug) console.log('Token expired, removing');
                                api.token.remove();
                                return false;
                            }
                        } catch (innerError) {
                            if (config.debug) console.warn('Could not parse JWT payload, but continuing in proxy mode:', innerError);
                            // No retornamos false aquí en modo proxy
                        }
                    }
                    
                    return true; // En modo proxy, asumimos que el token es válido si llegamos hasta aquí
                } else {
                    // Modo estricto (no proxy o proxy sin tokens inseguros)
                    if (config.debug) console.log('Using strict token validation');
                    
                    // Verificar si el token tiene formato JWT (xxx.yyy.zzz)
                    if (!token.match(/^[\w-]+\.[\w-]+\.[\w-]+$/)) {
                        if (config.debug) console.log('Token does not have JWT format');
                        return false;
                    }
                    
                    // Intentar decodificar la parte de payload (segunda parte)
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    
                    // Verificar si el token ha expirado
                    if (payload.exp && payload.exp * 1000 < Date.now()) {
                        // Token expirado, eliminarlo
                        if (config.debug) console.log('Token expired, removing');
                        api.token.remove();
                        return false;
                    }
                    
                    return true;
                }
            } catch (e) {
                // Si hay algún error al decodificar, consideramos el token inválido
                console.error('Error validating token:', e);
                return false;
            }
        }
    },
    
    // Generic request handler
    request: async (url, method = 'GET', data = null, requiresAuth = true) => {
        try {
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add authorization header if required
            if (requiresAuth) {
                if (api.token.isValid()) {
                    headers['Authorization'] = `Bearer ${api.token.get()}`;
                    if (config.debug) console.log('Added authorization header');
                } else {
                    if (config.debug) console.warn('Auth required but token is invalid or missing');
                    // En modo proxy, continuamos aunque el token no sea válido
                    if (!(config.proxy.enabled && config.proxy.allowInsecureTokens)) {
                        throw new Error('Authentication required but token is invalid');
                    } else {
                        if (config.debug) console.log('Continuing request despite invalid token (proxy mode)');
                        // Añadimos el token de todos modos en modo proxy permisivo
                        const token = api.token.get();
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                    }
                }
            }
            
            // Prepare request options
            const options = {
                method,
                headers,
                // Usar 'include' en lugar de 'same-origin' para permitir cookies en solicitudes cross-origin
                credentials: config.proxy.enabled ? 'include' : 'same-origin'
            };
            
            // Add body for non-GET requests
            if (method !== 'GET' && data) {
                options.body = JSON.stringify(data);
            }
            
            // Log request details for debugging
            if (config.debug) {
                console.log(`API Request: ${method} ${url}`);
                console.log('Request options:', options);
                if (data) console.log('Request data:', data);
            }
            
            // Construir la URL completa usando la baseUrl que ya tiene el protocolo correcto
            let fullUrl = '';
            
            // Si la URL ya es absoluta (comienza con http: o https:), usarla directamente
            if (url.startsWith('http:') || url.startsWith('https:')) {
                fullUrl = url;
            } else {
                // Si la URL es relativa, construir la URL completa con la baseUrl
                fullUrl = `${config.api.baseUrl}${url}`;
            }

            // Refuerzo: Si la página está en HTTPS, forzamos cualquier URL HTTP a HTTPS
            if (window.location.protocol === 'https:' && fullUrl.startsWith('http:')) {
                fullUrl = fullUrl.replace('http:', 'https:');
                if (config.debug) console.log('Forced HTTP URL to HTTPS:', fullUrl);
            }
            // También, si la página está en HTTPS y la URL es relativa, aseguramos que use el origin correcto
            if (window.location.protocol === 'https:' && fullUrl.startsWith('/')) {
                const origin = window.location.origin;
                if (!fullUrl.includes(origin)) {
                    fullUrl = `${origin}${fullUrl}`;
                    if (config.debug) console.log('Added origin to URL:', fullUrl);
                }
            }
            
            if (config.debug) {
                console.log('Final URL for request:', fullUrl);
                console.log('Current page protocol:', window.location.protocol);
            }
            
            // Make the request
            const response = await fetch(fullUrl, options);
            
            // Parse response
            let result;
            
            // Si el código de estado es 204 (No Content), no intentamos analizar la respuesta
            if (response.status === 204) {
                result = null;
            } else {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    result = await response.json();
                } else {
                    result = await response.text();
                }
            }
            
            // Log response for debugging
            console.log(`API Response (${response.status}):`, result);
            
            // Handle error responses
            if (!response.ok) {
                const error = {
                    status: response.status,
                    statusText: response.statusText,
                    detail: result.detail || result
                };
                
                // Solo registramos errores en la consola si no son errores de autenticaciu00f3n
                // o si estamos en modo de depuraciu00f3n
                if (response.status !== 401 || config.debug) {
                    console.error('API request failed:', error);
                }
                
                throw error;
            }
            
            return result;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // Authentication
    auth: {
        login: async (email, password) => {
            const formData = new URLSearchParams();
            formData.append('username', email); // OAuth2 uses 'username' field
            formData.append('password', password);
            
            // Usamos un enfoque que no genera errores en la consola
            // Configuramos la solicitud para que no siga redirecciones
            const controller = new AbortController();
            const signal = controller.signal;
            
            // Creamos una promesa personalizada para manejar la respuesta
            return new Promise(async (resolve, reject) => {
                try {
                    // Realizamos la solicitud con modo 'no-cors' para evitar errores en la consola
                    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.auth.login}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: formData,
                        signal: signal
                    });
                    
                    // Si la respuesta no es exitosa, manejamos el error silenciosamente
                    if (!response.ok) {
                        const errorData = await response.json();
                        return reject(errorData);
                    }
                    
                    // Si la respuesta es exitosa, procesamos los datos
                    const data = await response.json();
                    api.token.set(data.access_token);
                    resolve(data);
                } catch (error) {
                    // Si ocurre un error en la solicitud, lo rechazamos silenciosamente
                    reject({
                        detail: 'Error de conexión. Por favor, inténtalo de nuevo más tarde.'
                    });
                }
            });
        },
        
        logout: () => {
            api.token.remove();
        }
    },
    
    // User operations
    user: {
        register: async (userData) => {
            return api.request(
                config.api.endpoints.auth.register,
                'POST',
                userData,
                false
            );
        },
        
        getCurrent: async () => {
            return api.request(
                config.api.endpoints.users.me,
                'GET'
            );
        },
        
        updateCurrent: async (userData) => {
            return api.request(
                config.api.endpoints.users.update,
                'PUT',
                userData
            );
        },
        
        changePassword: async (passwordData) => {
            return api.request(
                config.api.endpoints.users.changePassword,
                'POST',
                passwordData
            );
        }
    },
    
    // Assistant operations
    assistants: {
        list: async () => {
            return api.request(
                config.api.endpoints.assistants.list,
                'GET'
            );
        },
        
        getPublic: async () => {
            return api.request(
                config.api.endpoints.assistants.public,
                'GET',
                null,
                false
            );
        },
        
        get: async (id) => {
            return api.request(
                config.api.endpoints.assistants.get(id),
                'GET'
            );
        },
        
        create: async (assistantData) => {
            return api.request(
                config.api.endpoints.assistants.create,
                'POST',
                assistantData
            );
        },
        
        update: async (id, assistantData) => {
            return api.request(
                config.api.endpoints.assistants.update(id),
                'PUT',
                assistantData
            );
        },
        
        delete: async (id) => {
            return api.request(
                config.api.endpoints.assistants.delete(id),
                'DELETE'
            );
        }
    },
    
    // Template operations
    templates: {
        list: async () => {
            if (config.debug) console.log('Loading templates list...');
            
            try {
                // Usar la URL base que ya tiene el protocolo correcto
                const endpoint = config.api.endpoints.templates.list;
                
                // Comprobar si estamos en modo de depuración
                if (config.debug) {
                    console.log(`Templates list URL: ${config.api.baseUrl}${endpoint}`);
                    console.log(`Current protocol: ${window.location.protocol}`);
                }
                
                // Usar el método request estándar que ya maneja el protocolo correctamente
                return api.request(
                    endpoint,
                    'GET',
                    null,
                    false
                );
            } catch (error) {
                console.error('Error loading templates:', error);
                throw error;
            }
        },
        
        get: async (id) => {
            if (config.debug) console.log(`Loading template with id ${id}...`);
            
            try {
                // Usar la URL base que ya tiene el protocolo correcto
                const endpoint = config.api.endpoints.templates.get(id);
                
                // Comprobar si estamos en modo de depuración
                if (config.debug) {
                    console.log(`Template URL: ${config.api.baseUrl}${endpoint}`);
                    console.log(`Current protocol: ${window.location.protocol}`);
                }
                
                // Usar el método request estándar que ya maneja el protocolo correctamente
                return api.request(
                    endpoint,
                    'GET',
                    null,
                    false
                );
            } catch (error) {
                console.error(`Error loading template ${id}:`, error);
                throw error;
            }
        }
    },
    
    // Validation operations
    validate: {
        yaml: async (content) => {
            return api.request(
                config.api.endpoints.validate.yaml,
                'POST',
                { content },
                false
            );
        }
    },
    
    // Schema operations
    schema: {
        get: async () => {
            try {
                if (config.debug) console.log('Attempting to load schema through API...');
                
                // En modo proxy, intentamos cargar el esquema incluso si la autenticación no es válida
                if (config.proxy.enabled && config.proxy.allowInsecureTokens) {
                    if (config.debug) console.log('Loading schema in proxy mode (relaxed auth)');
                    
                    try {
                        return await api.request(
                            config.api.endpoints.schema.get,
                            'GET',
                            null,
                            true // Requiere autenticación, pero en modo proxy continuará aunque el token no sea válido
                        );
                    } catch (proxyError) {
                        if (config.debug) console.warn('Error loading schema in proxy mode:', proxyError);
                        
                        // Si falla, intentamos cargar un esquema local de respaldo
                        if (config.debug) console.log('Attempting to load fallback schema...');
                        
                        // Intentar cargar el esquema desde un archivo local (schema.json)
                        try {
                            // Construir la URL para el esquema de respaldo
                            let schemaUrl = '/static/schema.json';
                            
                            // Asegurarnos de que la URL use el mismo protocolo que la página
                            if (config.proxy.enabled) {
                                const currentProtocol = window.location.protocol;
                                const baseUrl = window.location.origin;
                                schemaUrl = `${baseUrl}${schemaUrl}`;
                                if (config.debug) console.log(`Using ${currentProtocol} URL for fallback schema:`, schemaUrl);
                            }
                            
                            const fallbackResponse = await fetch(schemaUrl);
                            if (fallbackResponse.ok) {
                                const fallbackSchema = await fallbackResponse.json();
                                if (config.debug) console.log('Loaded fallback schema successfully');
                                return fallbackSchema;
                            } else {
                                throw new Error('Fallback schema not available');
                            }
                        } catch (fallbackError) {
                            if (config.debug) console.error('Failed to load fallback schema:', fallbackError);
                            
                            // Si todo falla, devolvemos un esquema mínimo para que la aplicación no se rompa
                            if (config.debug) console.log('Returning minimal schema');
                            return {
                                type: 'object',
                                properties: {
                                    metadata: {
                                        type: 'object',
                                        properties: {
                                            description: {
                                                type: 'object',
                                                properties: {
                                                    title: {
                                                        type: 'string',
                                                        'x-category': 'custom'
                                                    },
                                                    summary: {
                                                        type: 'string',
                                                        'x-category': 'custom'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            };
                        }
                    }
                } else {
                    // Modo normal (no proxy o proxy sin tokens inseguros)
                    // Verificar si el usuario está autenticado
                    if (!api.token.isValid()) {
                        console.error('Authentication token is not valid');
                        throw new Error('User not authenticated');
                    }
                    
                    return await api.request(
                        config.api.endpoints.schema.get,
                        'GET',
                        null,
                        true // Requiere autenticación
                    );
                }
            } catch (error) {
                console.error('Error loading schema through API:', error);
                throw error;
            }
        }
    },
    
    // Admin operations
    admin: {
        listUsers: async (page = 0, limit = 10, search = '') => {
            const skip = page * limit;
            const queryParams = new URLSearchParams({
                skip,
                limit,
                ...(search ? { search } : {})
            }).toString();
            
            return api.request(
                `${config.api.endpoints.admin.users}?${queryParams}`,
                'GET'
            );
        },
        
        countUsers: async (search = '') => {
            const queryParams = new URLSearchParams({
                ...(search ? { search } : {})
            }).toString();
            
            return api.request(
                `${config.api.endpoints.admin.usersCount}?${queryParams}`,
                'GET'
            );
        },
        
        deleteUser: async (id) => {
            return api.request(
                config.api.endpoints.admin.deleteUser(id),
                'DELETE'
            );
        },
        
        promoteUser: async (id) => {
            return api.request(
                config.api.endpoints.admin.promoteUser(id),
                'PATCH'
            );
        },
        
        demoteUser: async (id) => {
            return api.request(
                config.api.endpoints.admin.demoteUser(id),
                'PATCH'
            );
        }
    }
};
