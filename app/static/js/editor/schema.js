// Schema and form management
import { state, updateState } from './state.js';
import { ui } from './ui.js';

export const schema = {
    load: async () => {
        try {
            console.log('Loading schema...');
            
            // Check if schema is already loaded
            if (state.schema) {
                console.log('Schema already loaded, returning existing schema');
                return state.schema;
            }
            
            // Load schema using schemaLoader
            const loadedSchema = await schemaLoader.loadSchema();
            
            if (!loadedSchema) {
                throw new Error('Schema loaded but is null or undefined');
            }
            
            updateState.setSchema(loadedSchema);
            console.log('Schema loaded successfully');
            return loadedSchema;
        } catch (error) {
            console.error('Error loading schema:', error);
            app.showNotification(i18n.t('editor.schemaLoadError') || 'Error loading schema. Please try again.', 'error');
            return null;
        }
    },

    generateForm: async () => {
        try {
            if (!state.schema) {
                console.log('Schema not loaded, loading schema...');
                await schema.load();
            }
            
            if (!state.schema) {
                throw new Error('Failed to load schema');
            }
            
            // Generate form using form-generator
            await formGenerator.generate(state.schema, state.mode);
            
            // Update progress after form generation
            await ui.updateProgress();
        } catch (error) {
            console.error('Error generating form:', error);
            app.showNotification('Error generating form. Please try again.', 'error');
        }
    }
};
