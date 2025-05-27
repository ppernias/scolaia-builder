// Configuration settings for ADLBuilder

const config = {
    // API configuration
    api: {
        baseUrl: 'http://localhost:8000/api/v1',
        endpoints: {
            auth: {
                login: '/auth/token',
                register: '/users'
            },
            users: {
                me: '/users/me',
                update: '/users/me'
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
                get: (id) => `/templates/${id}`,
                clone: (id) => `/templates/${id}/clone`
            },
            validate: {
                yaml: '/validate'
            }
        }
    },
    
    // Editor configuration
    editor: {
        defaultMode: 'simple', // 'simple' or 'advanced'
        autoValidate: true,
        characterLimits: {
            title: 100,
            summary: 500,
            context_definition: 1000,
            prompt: 2000
        }
    },
    
    // Localization (for future i18n support)
    locale: {
        default: 'en',
        supported: ['en'] // Only English for now as requested
    }
};
