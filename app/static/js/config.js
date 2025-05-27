// Configuration settings for ADLBuilder

const config = {
    // API configuration
    api: {
        baseUrl: '/api/v1',
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
