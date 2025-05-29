// Schema and form management
import { state, updateState } from './state.js';
import { ui } from './ui.js';

// Wait for formGenerator to be available
const waitForFormGenerator = () => {
    return new Promise((resolve) => {
        if (window.formGenerator && typeof window.formGenerator.generateForm === 'function') {
            debug.verbose('formGenerator found with generateForm function');
            resolve(window.formGenerator);
        } else {
            debug.verbose('Waiting for formGenerator...');
            setTimeout(() => waitForFormGenerator().then(resolve), 100);
        }
    });
};

export const schema = {
    load: async () => {
        try {
            debug.verbose('Loading schema...');
            
            // Check if schema is already loaded
            if (state.schema) {
                debug.verbose('Schema already loaded, returning existing schema');
                return state.schema;
            }
            
            // Load schema using schemaLoader
            const loadedSchema = await schemaLoader.loadSchema();
            
            if (!loadedSchema) {
                throw new Error('Schema loaded but is null or undefined');
            }
            
            updateState.setSchema(loadedSchema);
            debug.info('Schema loaded successfully');
            return loadedSchema;
        } catch (error) {
            debug.error('Error loading schema:', error);
            app.showNotification(i18n.t('editor.schemaLoadError') || 'Error loading schema. Please try again.', 'error');
            return null;
        }
    },

    generateForm: async () => {
        try {
            if (!state.schema) {
                debug.verbose('Schema not loaded, loading schema...');
                await schema.load();
            }
            
            if (!state.schema) {
                throw new Error('Failed to load schema');
            }
            
            // Wait for formGenerator to be available
            debug.verbose('Waiting for formGenerator to be available...');
            const formGenerator = await waitForFormGenerator();
            debug.verbose('formGenerator is available, generating form...');
            
            // Check if there are any custom properties for simple mode
            let useAdvancedMode = state.mode === 'advanced';
            
            if (state.mode === 'simple' && state.schema && state.schema.properties) {
                const customProps = Object.entries(state.schema.properties)
                    .filter(([key, prop]) => prop['x-category'] === 'custom')
                    .map(([key]) => key);
                
                if (customProps.length === 0) {
                    debug.info('No custom properties found for simple mode, switching to advanced mode');
                    useAdvancedMode = true;
                    updateState.setMode('advanced');
                    ui.updateModeIndicator();
                }
            }
            
            // Generate form based on schema and current mode
            if (typeof formGenerator.generateForm !== 'function') {
                throw new Error(`formGenerator.generateForm is not a function. Available methods: ${Object.keys(formGenerator).join(', ')}`);
            }
            
            const formHtml = formGenerator.generateForm(state.schema, '', useAdvancedMode ? 'advanced' : state.mode);
            debug.verbose('Form HTML generated successfully');
            
            // Insert the generated form into the form container
            const formContainer = document.getElementById('editor-form-container');
            if (formContainer) {
                debug.verbose('Inserting form HTML into container');
                formContainer.innerHTML = formHtml;
                debug.verbose('Setting up form event listeners');
                formGenerator.setupFormEventListeners();
            } else {
                debug.warn('Form container not found');
            }
            
            // Update progress after form generation
            debug.verbose('Updating progress');
            await ui.updateProgress();
            debug.info('Form generated successfully');
        } catch (error) {
            debug.error('Error generating form:', error);
            app.showNotification('Error generating form. Please try again.', 'error');
        }
    }
};
