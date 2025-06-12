// Editor UI management
import { state, updateState } from './state.js';
import { actions } from './actions.js';

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

        // Save Changes button
        const saveChangesButton = document.getElementById('save-changes');
        if (saveChangesButton) {
            saveChangesButton.addEventListener('click', () => {
                debug.info('Save Changes button clicked');
                actions.updateYamlFromForm();
            });
        }

        // View YAML button
        const viewYamlButton = document.getElementById('view-yaml');
        if (viewYamlButton) {
            viewYamlButton.addEventListener('click', () => {
                debug.info('View YAML button clicked');
                ui.showYamlModal();
            });
        }

        // Import/Export buttons
        const importButton = document.getElementById('import-yaml');
        if (importButton) {
            importButton.addEventListener('click', () => ui.showYamlModal());
        }

        const exportButton = document.getElementById('export-yaml');
        if (exportButton) {
            exportButton.addEventListener('click', () => editor.exportYaml());
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
        debug.info('Showing YAML modal');
        const modal = document.getElementById('yaml-modal');
        if (modal) {
            // No actualizamos el YAML automáticamente, mostramos el YAML actual
            // El usuario debe hacer clic en "Save Changes" para actualizar el YAML
            
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
            
            // Set up close buttons
            const closeTopButton = document.getElementById('close-yaml-modal');
            if (closeTopButton) {
                closeTopButton.onclick = ui.hideYamlModal;
            }
            
            const closeBottomButton = document.getElementById('close-yaml-modal-bottom');
            if (closeBottomButton) {
                closeBottomButton.onclick = ui.hideYamlModal;
            }
            
            // Mostrar mensaje informativo sobre cómo actualizar el YAML
            const yamlOutput = document.getElementById('yaml-output');
            if (yamlOutput && !state.yamlContent) {
                yamlOutput.textContent = '# Para actualizar el YAML con los cambios del formulario, haz clic en "Save Changes" primero';
            }
        }
    },

    hideYamlModal: () => {
        debug.info('Hiding YAML modal');
        const modal = document.getElementById('yaml-modal');
        if (modal) {
            modal.classList.remove('active');
            
            // Remove event listeners to prevent memory leaks
            const closeTopButton = document.getElementById('close-yaml-modal');
            if (closeTopButton) {
                closeTopButton.onclick = null;
            }
            
            const closeBottomButton = document.getElementById('close-yaml-modal-bottom');
            if (closeBottomButton) {
                closeBottomButton.onclick = null;
            }
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
