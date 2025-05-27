// Editor functionality for ADLBuilder

const editor = {
    // Current state
    state: {
        mode: 'simple', // 'simple' or 'advanced'
        currentAssistant: null,
        yamlContent: '',
        isModified: false,
        schema: null
    },
    
    // Initialize editor
    init: () => {
        // Set up event listeners for editor mode toggle
        editor.setupEventListeners();
    },
    
    // Load editor template
    loadEditorTemplate: () => {
        const editorPage = document.getElementById('page-editor');
        const template = document.getElementById('template-editor');
        
        if (editorPage && template) {
            editorPage.innerHTML = template.innerHTML;
            
            // Set up event listeners for editor controls
            editor.setupEditorControls();
        }
    },
    
    // Set up event listeners
    setupEventListeners: () => {
        // Listen for login events to update editor state
        window.addEventListener('auth:login', () => {
            // If user logs in and we have a modified assistant, ask if they want to save it
            if (editor.state.isModified) {
                // TODO: Implement save prompt
            }
        });
    },
    
    // Set up editor controls
    setupEditorControls: () => {
        // Mode toggle
        const modeToggle = document.getElementById('editor-mode-toggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', () => {
                editor.state.mode = modeToggle.checked ? 'advanced' : 'simple';
                editor.updateEditorMode();
            });
        }
        
        // Save button
        const saveButton = document.getElementById('save-assistant');
        if (saveButton) {
            saveButton.addEventListener('click', editor.saveAssistant);
        }
        
        // Export YAML button
        const exportButton = document.getElementById('export-yaml');
        if (exportButton) {
            exportButton.addEventListener('click', editor.exportYaml);
        }
        
        // Import YAML button
        const importButton = document.getElementById('import-yaml');
        if (importButton) {
            importButton.addEventListener('click', editor.importYaml);
        }
    },
    
    // Update editor mode (simple/advanced)
    updateEditorMode: () => {
        const editorForm = document.querySelector('.editor-form');
        const yamlPreview = document.querySelector('.yaml-preview');
        
        if (editor.state.mode === 'simple') {
            // Simple mode: Show form, hide YAML editor
            if (editorForm) editorForm.style.display = 'block';
            if (yamlPreview) yamlPreview.style.display = 'none';
            
            // Generate form based on schema
            editor.generateForm();
        } else {
            // Advanced mode: Hide form, show YAML editor
            if (editorForm) editorForm.style.display = 'none';
            if (yamlPreview) yamlPreview.style.display = 'block';
            
            // Update YAML preview
            editor.updateYamlPreview();
        }
    },
    
    // Generate form based on schema
    generateForm: () => {
        // TODO: Implement form generation based on schema
        const editorForm = document.querySelector('.editor-form');
        if (editorForm) {
            editorForm.innerHTML = `
                <div class="form-group">
                    <label for="assistant-title">Title</label>
                    <input type="text" id="assistant-title" value="${editor.state.currentAssistant?.title || ''}">
                </div>
                <div class="form-group">
                    <label for="assistant-yaml">YAML Content</label>
                    <textarea id="assistant-yaml" rows="20">${editor.state.yamlContent || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="assistant-public">Public</label>
                    <input type="checkbox" id="assistant-public" ${editor.state.currentAssistant?.is_public ? 'checked' : ''}>
                </div>
            `;
            
            // Add event listeners to form fields
            const yamlTextarea = document.getElementById('assistant-yaml');
            if (yamlTextarea) {
                yamlTextarea.addEventListener('input', () => {
                    editor.state.yamlContent = yamlTextarea.value;
                    editor.state.isModified = true;
                    editor.updateYamlPreview();
                });
            }
        }
    },
    
    // Update YAML preview
    updateYamlPreview: () => {
        const yamlOutput = document.getElementById('yaml-output');
        if (yamlOutput) {
            yamlOutput.textContent = editor.state.yamlContent || '';
        }
    },
    
    // Create new assistant
    createNew: () => {
        editor.state.currentAssistant = null;
        editor.state.yamlContent = `metadata:
  description:
    title: New Assistant
    summary: A brief description of what this assistant does
    language: en
  author:
    name: ${auth.currentUser?.name || 'Anonymous'}
    role: ${auth.currentUser?.role || ''}
    organization: ${auth.currentUser?.organization || ''}
  visibility:
    is_public: true
  tags:
    - custom
    - example

capabilities:
  models:
    - name: gpt-4
      version: latest
  tools:
    - type: web_search
      settings:
        provider: google
    - type: code_interpreter
      settings:
        languages:
          - python
          - javascript

behavior:
  instructions: |
    You are a helpful assistant that provides clear and concise answers.
    
    Follow these guidelines:
    1. Be respectful and professional
    2. Provide accurate information
    3. Ask clarifying questions when needed
    4. Admit when you don't know something
  response_format: markdown
  conversation_starters:
    - "How can I learn more about AI?"
    - "What are the best practices for writing code?"
    - "Can you help me solve a problem?"
`;
        editor.state.isModified = false;
        
        // Update UI
        editor.updateEditorMode();
    },
    
    // Save assistant
    saveAssistant: async () => {
        if (!api.token.isValid()) {
            app.showNotification('Please log in to save assistants.', 'warning');
            document.getElementById('login-modal').style.display = 'block';
            return;
        }
        
        try {
            // Validate YAML
            const validationResult = await api.validate.yaml(editor.state.yamlContent);
            if (!validationResult.valid) {
                app.showNotification(`Invalid YAML: ${validationResult.errors.join(', ')}`, 'error');
                return;
            }
            
            // Get title from YAML content
            let title = 'New Assistant';
            try {
                const yamlObj = jsyaml.load(editor.state.yamlContent);
                title = yamlObj.metadata?.description?.title || title;
            } catch (e) {
                console.error('Error parsing YAML:', e);
            }
            
            // Prepare assistant data
            const assistantData = {
                title,
                yaml_content: editor.state.yamlContent,
                is_public: document.getElementById('assistant-public')?.checked || true
            };
            
            let result;
            if (editor.state.currentAssistant?.id) {
                // Update existing assistant
                result = await api.assistants.update(editor.state.currentAssistant.id, assistantData);
                app.showNotification('Assistant updated successfully!', 'success');
            } else {
                // Create new assistant
                result = await api.assistants.create(assistantData);
                app.showNotification('Assistant created successfully!', 'success');
            }
            
            // Update state
            editor.state.currentAssistant = result;
            editor.state.isModified = false;
            
            // Trigger event for assistant list to refresh
            window.dispatchEvent(new CustomEvent('assistants:update'));
        } catch (error) {
            console.error('Error saving assistant:', error);
            app.showNotification(error.detail || 'Error saving assistant. Please try again.', 'error');
        }
    },
    
    // Export YAML
    exportYaml: () => {
        // Create blob and download link
        const blob = new Blob([editor.state.yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editor.state.currentAssistant?.title || 'assistant'}.yaml`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Import YAML
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
                    editor.state.yamlContent = event.target.result;
                    editor.state.isModified = true;
                    editor.state.currentAssistant = null; // Reset current assistant
                    
                    // Update UI
                    editor.updateEditorMode();
                    app.showNotification('YAML imported successfully!', 'success');
                };
                reader.readAsText(file);
            }
        });
        
        // Trigger file dialog
        input.click();
    },
    
    // Load assistant by ID
    loadAssistant: async (id) => {
        try {
            const assistant = await api.assistants.get(id);
            editor.state.currentAssistant = assistant;
            editor.state.yamlContent = assistant.yaml_content;
            editor.state.isModified = false;
            
            // Update UI
            editor.updateEditorMode();
            app.navigateTo('editor');
        } catch (error) {
            console.error('Error loading assistant:', error);
            app.showNotification(error.detail || 'Error loading assistant. Please try again.', 'error');
        }
    }
};
