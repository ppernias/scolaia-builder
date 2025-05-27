// API service for ADLBuilder

const api = {
    // Authentication token management
    token: {
        get: () => localStorage.getItem('adlbuilder_token'),
        set: (token) => localStorage.setItem('adlbuilder_token', token),
        remove: () => localStorage.removeItem('adlbuilder_token'),
        isValid: () => !!localStorage.getItem('adlbuilder_token')
    },
    
    // Headers for API requests
    getHeaders: (includeAuth = true) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth && api.token.isValid()) {
            headers['Authorization'] = `Bearer ${api.token.get()}`;
        }
        
        return headers;
    },
    
    // Generic request handler
    request: async (url, method = 'GET', data = null, includeAuth = true) => {
        const options = {
            method,
            headers: api.getHeaders(includeAuth)
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            console.log(`Enviando solicitud a: ${config.api.baseUrl}${url}`, {
                method,
                headers: options.headers,
                body: options.body ? JSON.parse(options.body) : null
            });
            
            const response = await fetch(`${config.api.baseUrl}${url}`, options);
            console.log(`Respuesta recibida de: ${config.api.baseUrl}${url}`, {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries([...response.headers])
            });
            
            // Handle authentication errors
            if (response.status === 401) {
                api.token.remove();
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Authentication failed. Please log in again.');
            }
            
            // Parse response
            const contentType = response.headers.get('content-type');
            let result;
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
                console.log('Respuesta JSON:', result);
            } else {
                result = await response.text();
                console.log('Respuesta texto:', result);
            }
            
            // Handle error responses
            if (!response.ok) {
                console.error(`Error en la respuesta (${response.status}):`, result);
                throw {
                    status: response.status,
                    detail: result.detail || 'Error desconocido',
                    data: result
                };
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
            formData.append('username', email); // OAuth2 uses 'username' for email
            formData.append('password', password);
            
            const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.auth.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw error;
            }
            
            const data = await response.json();
            api.token.set(data.access_token);
            return data;
        },
        
        register: async (userData) => {
            return api.request(
                config.api.endpoints.auth.register,
                'POST',
                userData,
                false
            );
        },
        
        logout: () => {
            api.token.remove();
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
    },
    
    // User operations
    user: {
        getCurrent: async () => {
            return api.request(config.api.endpoints.users.me, 'GET');
        },
        
        update: async (userData) => {
            return api.request(config.api.endpoints.users.update, 'PUT', userData);
        }
    },
    
    // Admin operations
    admin: {
        listUsers: async () => {
            return api.request('/admin/users', 'GET');
        },
        
        deleteUser: async (userId) => {
            return api.request(`/admin/users/${userId}`, 'DELETE');
        }
    },
    
    // Assistant operations
    assistants: {
        list: async () => {
            return api.request(config.api.endpoints.assistants.list, 'GET');
        },
        
        create: async (assistantData) => {
            return api.request(config.api.endpoints.assistants.create, 'POST', assistantData);
        },
        
        get: async (id) => {
            return api.request(config.api.endpoints.assistants.get(id), 'GET');
        },
        
        update: async (id, assistantData) => {
            return api.request(config.api.endpoints.assistants.update(id), 'PUT', assistantData);
        },
        
        delete: async (id) => {
            return api.request(config.api.endpoints.assistants.delete(id), 'DELETE');
        },
        
        listPublic: async () => {
            return api.request(config.api.endpoints.assistants.public, 'GET', null, false);
        }
    },
    
    // Template operations
    templates: {
        list: async () => {
            return api.request(config.api.endpoints.templates.list, 'GET', null, false);
        },
        
        get: async (id) => {
            return api.request(config.api.endpoints.templates.get(id), 'GET', null, false);
        },
        
        clone: async (id) => {
            return api.request(config.api.endpoints.templates.clone(id), 'POST');
        }
    },
    
    // YAML validation
    validate: {
        yaml: async (yamlContent) => {
            return api.request(
                config.api.endpoints.validate.yaml,
                'POST',
                { yaml_content: yamlContent },
                false
            );
        }
    }
};
