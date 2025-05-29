// Schema loader for ADLBuilder

// Create schemaLoader object and expose it to the global window object
window.schemaLoader = {
    // Current schema
    schema: null,
    
    // Load schema from server
    loadSchema: async () => {
        try {
            debug.verbose('Attempting to load schema...');
            
            // Verificar si el usuario estu00e1 autenticado
            if (!api.token.isValid()) {
                console.error('Authentication token is not valid');
                throw new Error('User not authenticated');
            }
            
            // Usar la funciu00f3n api.schema.get() para cargar el schema
            debug.verbose('Using api.schema.get() to load schema...');
            const data = await api.schema.get();
            
            debug.verbose('Schema data received:', data ? 'Data exists' : 'No data');
            schemaLoader.schema = data;
            debug.info('Schema loaded successfully');
            
            // Dispatch event for components that need to know about schema changes
            window.dispatchEvent(new CustomEvent('schema:loaded', { detail: { schema: schemaLoader.schema } }));
            
            return schemaLoader.schema;
        } catch (error) {
            console.error('Error loading schema:', error);
            app.showNotification(i18n.t('editor.schemaLoadError') || 'Error loading schema. Please try again.', 'error');
            return null;
        }
    },
    
    // Get schema property by path
    getPropertyByPath: (path) => {
        if (!schemaLoader.schema) {
            return null;
        }
        
        const parts = path.split('.');
        let current = schemaLoader.schema;
        
        for (const part of parts) {
            if (current.properties && current.properties[part]) {
                current = current.properties[part];
            } else if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current;
    },
    
    // Check if a property should be shown in basic mode
    isBasicModeProperty: (property) => {
        return property && property['x-category'] === 'custom';
    },
    
    // Get default value for a property
    getDefaultValue: (property) => {
        if (!property) {
            return null;
        }
        
        if ('default' in property) {
            return property.default;
        }
        
        // Handle different types
        switch (property.type) {
            case 'string':
                return '';
            case 'boolean':
                return false;
            case 'number':
            case 'integer':
                return 0;
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
};
