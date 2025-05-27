// API handling for ADLBuilder

const api = {
    // Token management
    token: {
        get: () => localStorage.getItem('token'),
        set: (token) => localStorage.setItem('token', token),
        remove: () => localStorage.removeItem('token'),
        isValid: () => {
            const token = localStorage.getItem('token');
            if (!token) return false;
            
            try {
                // Verificar si el token tiene formato JWT (xxx.yyy.zzz)
                if (!token.match(/^[\w-]+\.[\w-]+\.[\w-]+$/)) {
                    return false;
                }
                
                // Intentar decodificar la parte de payload (segunda parte)
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Verificar si el token ha expirado
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    // Token expirado, eliminarlo
                    api.token.remove();
                    return false;
                }
                
                return true;
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
            if (requiresAuth && api.token.isValid()) {
                headers['Authorization'] = `Bearer ${api.token.get()}`;
            }
            
            // Prepare request options
            const options = {
                method,
                headers,
                credentials: 'same-origin'
            };
            
            // Add body for non-GET requests
            if (method !== 'GET' && data) {
                options.body = JSON.stringify(data);
            }
            
            // Log request details for debugging
            console.log(`API Request: ${method} ${url}`);
            if (data) console.log('Request data:', data);
            
            // Make the request
            const response = await fetch(`${config.api.baseUrl}${url}`, options);
            
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
            return api.request(
                config.api.endpoints.templates.list,
                'GET',
                null,
                false
            );
        },
        
        get: async (id) => {
            return api.request(
                config.api.endpoints.templates.get(id),
                'GET',
                null,
                false
            );
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
            // Verificar si el usuario está autenticado
            if (!api.token.isValid()) {
                console.error('Authentication token is not valid');
                throw new Error('User not authenticated');
            }
            
            try {
                console.log('Attempting to load schema through API...');
                return api.request(
                    config.api.endpoints.schema.get,
                    'GET',
                    null,
                    true // Requiere autenticación
                );
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
