// Editor actions
import { state, updateState } from './state.js';
import { ui } from './ui.js';
import { schema } from './schema.js';

export const actions = {
    createNew: async () => {
        try {
            console.log('Creating new assistant...');
            updateState.setCurrentAssistant(null);
            updateState.setYamlContent('');
            updateState.setModified(false);
            
            // Update UI mode
            updateState.setMode('simple');
            ui.updateModeIndicator();
            
            // Generate form
            await schema.generateForm();
            
            console.log('New assistant created successfully');
        } catch (error) {
            console.error('Error creating new assistant:', error);
            app.showNotification('Error creating new assistant. Please try again.', 'error');
        }
    },

    saveAssistant: async () => {
        try {
            console.log('Saving assistant...');
            
            // Get form data
            const formData = formGenerator.getFormData();
            
            // Generate YAML
            const yaml = jsyaml.dump(formData);
            updateState.setYamlContent(yaml);
            
            // Prepare assistant data
            const assistantData = {
                title: formData.metadata?.title || 'Untitled Assistant',
                description: formData.metadata?.description || '',
                yaml_content: yaml,
                is_public: formData.metadata?.visibility === 'public'
            };
            
            // Save to API
            let savedAssistant;
            if (state.currentAssistant?.id) {
                savedAssistant = await api.assistants.update(state.currentAssistant.id, assistantData);
            } else {
                savedAssistant = await api.assistants.create(assistantData);
            }
            
            // Update state
            updateState.setCurrentAssistant(savedAssistant);
            updateState.setModified(false);
            
            // Show success message
            app.showNotification('Assistant saved successfully!', 'success');
            
            // Trigger assistants update
            window.dispatchEvent(new Event('assistants:update'));
            
            return savedAssistant;
        } catch (error) {
            console.error('Error saving assistant:', error);
            app.showNotification(error.detail || 'Error saving assistant. Please try again.', 'error');
            throw error;
        }
    },

    loadAssistant: async (id) => {
        try {
            const assistant = await api.assistants.get(id);
            updateState.setCurrentAssistant(assistant);
            updateState.setYamlContent(assistant.yaml_content);
            updateState.setModified(false);
            
            // Update UI
            updateState.setMode('simple');
            ui.updateModeIndicator();
            
            // Navigate to editor
            app.navigateTo('editor');
            
            // Generate form
            await schema.generateForm();
        } catch (error) {
            console.error('Error loading assistant:', error);
            app.showNotification(error.detail || 'Error loading assistant. Please try again.', 'error');
        }
    },

    exportYaml: () => {
        // Create blob and download link
        const blob = new Blob([state.yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.currentAssistant?.title || 'assistant'}.yaml`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success notification
        app.showNotification('YAML exported successfully!', 'success');
    },

    importYaml: () => {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.yaml,.yml';
        
        // Add event listener
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    updateState.setYamlContent(event.target.result);
                    updateState.setModified(true);
                    updateState.setCurrentAssistant(null);
                    
                    // Update UI
                    updateState.setMode('advanced');
                    ui.updateModeIndicator();
                    app.showNotification('YAML imported successfully!', 'success');
                };
                reader.readAsText(file);
            }
        });
        
        // Trigger file dialog
        input.click();
    }
};
