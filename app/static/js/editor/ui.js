// Editor UI management
import { state, updateState } from './state.js';

export const ui = {
    loadEditorTemplate: () => {
        console.log('Loading editor template...');
        const editorPage = document.getElementById('page-editor');
        const template = document.getElementById('template-editor');
        
        if (editorPage && template) {
            console.log('Editor page and template found, loading content...');
            editorPage.innerHTML = template.innerHTML;
            
            // Set up event listeners for editor controls
            ui.setupEditorControls();
            console.log('Editor template loaded successfully');
        } else {
            console.error('Editor page or template not found');
        }
    },

    setupEditorControls: () => {
        // Mode toggle
        const modeToggle = document.getElementById('editor-mode-toggle');
        if (modeToggle) {
            modeToggle.addEventListener('click', () => {
                const newMode = state.mode === 'simple' ? 'advanced' : 'simple';
                updateState.setMode(newMode);
                ui.updateModeIndicator();
            });
        }

        // Import/Export buttons
        const importButton = document.getElementById('import-yaml');
        if (importButton) {
            importButton.addEventListener('click', () => ui.showYamlModal());
        }

        const exportButton = document.getElementById('export-yaml');
        if (exportButton) {
            exportButton.addEventListener('click', () => ui.exportYaml());
        }
    },

    updateModeIndicator: () => {
        const modeIndicator = document.getElementById('editor-mode-indicator');
        if (modeIndicator) {
            modeIndicator.textContent = state.mode === 'simple' ? 'Simple Mode' : 'Advanced Mode';
            modeIndicator.className = `mode-indicator ${state.mode}`;
        }
    },

    updateProgress: async () => {
        const progressBar = document.getElementById('editor-progress');
        const progressText = document.getElementById('editor-progress-text');
        
        if (!progressBar || !progressText) return;
        
        // Calculate progress based on required fields
        const progress = await formGenerator.calculateProgress();
        
        // Update progress bar
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}% complete`;
        
        // Update save button state
        const saveButton = document.getElementById('save-assistant');
        if (saveButton) {
            saveButton.disabled = progress < 100;
        }
    },

    showYamlModal: () => {
        const modal = document.getElementById('yaml-modal');
        if (modal) {
            modal.classList.add('active');
            ui.updateYamlPreview();
            
            // Add escape key listener
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    ui.hideYamlModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
    },

    hideYamlModal: () => {
        const modal = document.getElementById('yaml-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    updateYamlPreview: () => {
        console.log('Updating YAML preview...');
        const yamlOutput = document.getElementById('yaml-output');
        
        if (!yamlOutput) {
            console.error('YAML output element not found');
            return;
        }
        
        if (state.yamlContent) {
            yamlOutput.textContent = state.yamlContent;
            
            // Apply syntax highlighting if available
            if (window.hljs) {
                try {
                    hljs.highlightElement(yamlOutput);
                    console.log('Applied syntax highlighting to YAML preview');
                } catch (error) {
                    console.error('Error applying syntax highlighting:', error);
                }
            }
        } else {
            yamlOutput.textContent = '# No YAML content available';
        }
    }
};
