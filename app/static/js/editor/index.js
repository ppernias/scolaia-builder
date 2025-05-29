// Main editor module
import { state, updateState } from './state.js';
import { ui } from './ui.js';
import { schema } from './schema.js';
import { actions } from './actions.js';

// Editor module
const editor = {
    // State management
    state,
    updateState,

    // Initialize editor
    init: async () => {
        console.log('Initializing editor...');
        try {
            // Load editor template
            ui.loadEditorTemplate();
            
            // Load schema
            await schema.load();
            
            // Set up form validation observer
            formGenerator.onValidationChange(() => {
                ui.updateProgress();
            });
            
            console.log('Editor initialized successfully');
        } catch (error) {
            console.error('Error initializing editor:', error);
            app.showNotification('Error initializing editor. Please try again.', 'error');
        }
    },

    // Public methods
    loadEditorTemplate: ui.loadEditorTemplate,
    createNew: actions.createNew,
    loadAssistant: actions.loadAssistant,
    saveAssistant: actions.saveAssistant,
    exportYaml: actions.exportYaml,
    importYaml: actions.importYaml,
    prepareEditor: actions.prepareEditor,
    generateForm: schema.generateForm,
    updateProgress: ui.updateProgress
};

// Export editor module
export default editor;
