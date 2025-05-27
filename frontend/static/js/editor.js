// Editor functionality for ADLBuilder

const editor = {
    // Current editor state
    state: {
        mode: config.editor.defaultMode, // 'simple' or 'advanced'
        currentAssistant: null,
        yamlContent: '',
        isModified: false,
        validationErrors: []
    },
    
    // Initialize editor
    init: () => {
        // Set up event listeners
        editor.setupEventListeners();
    },
    
    // Load editor template
    loadEditorTemplate: () => {
        const editorPage = document.getElementById('page-editor');
        const template = document.getElementById('template-editor');
        
        editorPage.innerHTML = template.innerHTML;
        
        // Set initial mode
        const modeToggle = document.getElementById('editor-mode-toggle');
        modeToggle.checked = editor.state.mode === 'advanced';
        
        // Re-attach event listeners
        editor.setupEventListeners();
        
        // Generate form based on schema
        editor.generateForm();
    },
    
    // Set up event listeners for editor
    setupEventListeners: () => {
        // Mode toggle
        const modeToggle = document.getElementById('editor-mode-toggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', () => {
                editor.state.mode = modeToggle.checked ? 'advanced' : 'simple';
                editor.generateForm();
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
            exportButton.addEventListener('click', editor.exportYAML);
        }
        
        // Import YAML button
        const importButton = document.getElementById('import-yaml');
        if (importButton) {
            importButton.addEventListener('click', editor.importYAML);
        }
    },
    
    // Generate form based on schema
    generateForm: async () => {
        const formContainer = document.querySelector('.editor-form');
        if (!formContainer) return;
        
        // Clear form
        formContainer.innerHTML = '';
        
        try {
            // Fetch schema if not already loaded
            if (!editor.schema) {
                // For now, we'll use a simplified approach to get the schema
                // In a real implementation, this would be fetched from the backend
                const response = await fetch('/schema.yaml');
                const schemaText = await response.text();
                editor.schema = jsyaml.load(schemaText);
            }
            
            // Generate form fields based on schema
            editor.generateFormFields(formContainer, editor.schema, '', editor.state.currentAssistant || {});
            
            // Update YAML preview
            editor.updateYAMLPreview();
        } catch (error) {
            console.error('Error generating form:', error);
            formContainer.innerHTML = '<p class="error">Error loading schema. Please try again.</p>';
        }
    },
    
    // Generate form fields recursively based on schema
    generateFormFields: (container, schema, path, data) => {
        // Handle different schema types
        if (schema.type === 'object' && schema.properties) {
            // Create fieldset for object
            const fieldset = document.createElement('fieldset');
            fieldset.className = 'form-fieldset';
            
            // Add legend if path exists
            if (path) {
                const legend = document.createElement('legend');
                legend.textContent = path.split('.').pop();
                fieldset.appendChild(legend);
            }
            
            // Process each property
            Object.entries(schema.properties).forEach(([key, propSchema]) => {
                const propPath = path ? `${path}.${key}` : key;
                const propData = data && data[key] !== undefined ? data[key] : undefined;
                
                // Skip system fields in simple mode
                if (editor.state.mode === 'simple' && propSchema['x-category'] === 'system') {
                    return;
                }
                
                // Recursively generate fields
                editor.generateFormFields(fieldset, propSchema, propPath, propData);
            });
            
            container.appendChild(fieldset);
        } else if (schema.type === 'array') {
            // Create array container
            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'array-container';
            
            // Add label
            const label = document.createElement('label');
            label.textContent = path.split('.').pop();
            arrayContainer.appendChild(label);
            
            // Add array items
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'array-items';
            arrayContainer.appendChild(itemsContainer);
            
            // Add existing items
            if (Array.isArray(data)) {
                data.forEach((item, index) => {
                    editor.addArrayItem(itemsContainer, schema.items, `${path}[${index}]`, item);
                });
            }
            
            // Add button to add new item
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'btn btn-outline btn-sm';
            addButton.textContent = 'Add Item';
            addButton.addEventListener('click', () => {
                editor.addArrayItem(itemsContainer, schema.items, `${path}[${itemsContainer.children.length}]`);
            });
            arrayContainer.appendChild(addButton);
            
            container.appendChild(arrayContainer);
        } else {
            // Create field for primitive types
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'form-group';
            
            // Add label
            const label = document.createElement('label');
            label.textContent = path.split('.').pop();
            fieldContainer.appendChild(label);
            
            // Create input based on type
            let input;
            
            if (schema.enum) {
                // Select for enum
                input = document.createElement('select');
                input.id = path;
                input.name = path;
                
                // Add options
                schema.enum.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    input.appendChild(option);
                });
                
                // Set value if exists
                if (data !== undefined) {
                    input.value = data;
                }
            } else if (schema.type === 'boolean') {
                // Checkbox for boolean
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = path;
                input.name = path;
                input.checked = data === true;
            } else if (schema.type === 'string' && schema.format === 'date-time') {
                // Date-time input
                input = document.createElement('input');
                input.type = 'datetime-local';
                input.id = path;
                input.name = path;
                input.value = data || '';
            } else if (schema.type === 'string' && (path.includes('description') || path.includes('prompt'))) {
                // Textarea for longer text
                input = document.createElement('textarea');
                input.id = path;
                input.name = path;
                input.rows = 5;
                input.value = data || '';
                
                // Add character count
                const charLimit = config.editor.characterLimits[path.split('.').pop()];
                if (charLimit) {
                    const charCount = document.createElement('div');
                    charCount.className = 'character-count';
                    charCount.textContent = `${input.value.length} / ${charLimit}`;
                    
                    input.addEventListener('input', () => {
                        charCount.textContent = `${input.value.length} / ${charLimit}`;
                        if (input.value.length > charLimit) {
                            charCount.classList.add('error');
                        } else {
                            charCount.classList.remove('error');
                        }
                    });
                    
                    fieldContainer.appendChild(charCount);
                }
            } else {
                // Default to text input
                input = document.createElement('input');
                input.type = 'text';
                input.id = path;
                input.name = path;
                input.value = data !== undefined ? data : '';
            }
            
            // Add input event listener
            input.addEventListener('input', () => {
                editor.handleInputChange(path, input);
            });
            
            fieldContainer.appendChild(input);
            
            // Add help text if available
            if (schema.description) {
                const helpText = document.createElement('div');
                helpText.className = 'field-help';
                helpText.textContent = schema.description;
                fieldContainer.appendChild(helpText);
            }
            
            container.appendChild(fieldContainer);
        }
    },
    
    // Add a new array item
    addArrayItem: (container, schema, path, data) => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'array-item';
        
        // Create input based on schema
        let input;
        
        if (schema.type === 'object') {
            // Create fieldset for object
            input = document.createElement('fieldset');
            input.className = 'form-fieldset';
            
            // Process each property
            Object.entries(schema.properties).forEach(([key, propSchema]) => {
                const propPath = `${path}.${key}`;
                const propData = data && data[key] !== undefined ? data[key] : undefined;
                
                // Skip system fields in simple mode
                if (editor.state.mode === 'simple' && propSchema['x-category'] === 'system') {
                    return;
                }
                
                // Recursively generate fields
                editor.generateFormFields(input, propSchema, propPath, propData);
            });
        } else if (schema.type === 'string') {
            // Text input for string
            input = document.createElement('input');
            input.type = 'text';
            input.name = path;
            input.value = data || '';
            
            // Add input event listener
            input.addEventListener('input', () => {
                editor.handleInputChange(path, input);
            });
        } else {
            // Default input for other types
            input = document.createElement('input');
            input.type = 'text';
            input.name = path;
            input.value = data || '';
            
            // Add input event listener
            input.addEventListener('input', () => {
                editor.handleInputChange(path, input);
            });
        }
        
        itemContainer.appendChild(input);
        
        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'btn btn-outline btn-sm remove-item';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            container.removeChild(itemContainer);
            editor.updateFormData();
        });
        
        itemContainer.appendChild(removeButton);
        container.appendChild(itemContainer);
    },
    
    // Handle input change
    handleInputChange: (path, input) => {
        editor.state.isModified = true;
        
        // Update form data
        editor.updateFormData();
        
        // Update YAML preview
        editor.updateYAMLPreview();
    },
    
    // Update form data from inputs
    updateFormData: () => {
        const formData = {};
        
        // Collect all input values
        document.querySelectorAll('.editor-form input, .editor-form select, .editor-form textarea').forEach(input => {
            const path = input.name;
            if (!path) return;
            
            let value;
            
            if (input.type === 'checkbox') {
                value = input.checked;
            } else {
                value = input.value;
            }
            
            // Set value in formData
            editor.setNestedValue(formData, path, value);
        });
        
        editor.state.currentAssistant = formData;
    },
    
    // Set nested value in object using path
    setNestedValue: (obj, path, value) => {
        const parts = path.replace(/\[\d+\]/g, '.$&').split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const arrayMatch = part.match(/\[(\d+)\]/);
            
            if (arrayMatch) {
                // Handle array index
                const index = parseInt(arrayMatch[1]);
                const arrayName = parts[i - 1];
                
                if (!Array.isArray(current[arrayName])) {
                    current[arrayName] = [];
                }
                
                if (current[arrayName].length <= index) {
                    current[arrayName][index] = {};
                }
                
                current = current[arrayName][index];
            } else {
                // Handle object property
                if (!current[part]) {
                    current[part] = {};
                }
                
                current = current[part];
            }
        }
        
        // Set final value
        const lastPart = parts[parts.length - 1];
        const arrayMatch = lastPart.match(/\[(\d+)\]/);
        
        if (arrayMatch) {
            // Handle array index
            const index = parseInt(arrayMatch[1]);
            const arrayName = parts[parts.length - 2];
            
            if (!Array.isArray(current[arrayName])) {
                current[arrayName] = [];
            }
            
            current[arrayName][index] = value;
        } else {
            // Handle object property
            current[lastPart] = value;
        }
    },
    
    // Update YAML preview
    updateYAMLPreview: () => {
        const yamlOutput = document.getElementById('yaml-output');
        if (!yamlOutput) return;
        
        try {
            // Convert form data to YAML
            editor.state.yamlContent = jsyaml.dump(editor.state.currentAssistant);
            yamlOutput.textContent = editor.state.yamlContent;
            
            // Validate YAML if auto-validate is enabled
            if (config.editor.autoValidate) {
                editor.validateYAML();
            }
        } catch (error) {
            console.error('Error generating YAML:', error);
            yamlOutput.textContent = 'Error generating YAML';
        }
    },
    
    // Validate YAML against schema
    validateYAML: async () => {
        // Check if user is authenticated
        if (!auth.currentUser) {
            // User is not authenticated, don't try to validate YAML yet
            editor.state.validationErrors = [];
            return;
        }
        
        try {
            const response = await api.validate.yaml(editor.state.yamlContent);
            
            editor.state.validationErrors = response.errors || [];
            
            // Update UI with validation results
            const yamlOutput = document.getElementById('yaml-output');
            
            if (editor.state.validationErrors.length > 0) {
                yamlOutput.classList.add('error');
                
                // Show validation errors
                const errorContainer = document.querySelector('.validation-errors') || document.createElement('div');
                errorContainer.className = 'validation-errors';
                errorContainer.innerHTML = '<h4>Validation Errors:</h4><ul>' + 
                    editor.state.validationErrors.map(error => `<li>${error}</li>`).join('') + 
                    '</ul>';
                
                yamlOutput.parentNode.appendChild(errorContainer);
            } else {
                yamlOutput.classList.remove('error');
                
                // Remove validation errors
                const errorContainer = document.querySelector('.validation-errors');
                if (errorContainer) {
                    errorContainer.remove();
                }
            }
        } catch (error) {
            console.error('Validation error:', error);
            
            // Only show notification if it's not a 401 Unauthorized error and user is authenticated
            if (error.status !== 401 && auth.currentUser) {
                app.showNotification('Error al validar el YAML. Por favor, inténtalo de nuevo.', 'error');
            }
        }
    },
    
    // Save assistant
    saveAssistant: async () => {
        // Update form data
        editor.updateFormData();
        
        // Validate YAML
        await editor.validateYAML();
        
        if (editor.state.validationErrors.length > 0) {
            app.showNotification('Please fix validation errors before saving.', 'error');
            return;
        }
        
        try {
            let result;
            
            if (editor.state.currentAssistant.id) {
                // Update existing assistant
                result = await api.assistants.update(editor.state.currentAssistant.id, {
                    title: editor.state.currentAssistant.metadata.description.title,
                    yaml_content: editor.state.yamlContent,
                    is_public: editor.state.currentAssistant.metadata.visibility.is_public
                });
                
                app.showNotification('Assistant updated successfully!', 'success');
            } else {
                // Create new assistant
                result = await api.assistants.create({
                    title: editor.state.currentAssistant.metadata.description.title,
                    yaml_content: editor.state.yamlContent,
                    is_public: editor.state.currentAssistant.metadata.visibility.is_public
                });
                
                // Update current assistant with ID
                editor.state.currentAssistant.id = result.id;
                
                app.showNotification('Assistant created successfully!', 'success');
            }
            
            editor.state.isModified = false;
            
            // Trigger event for assistant saved
            window.dispatchEvent(new CustomEvent('assistant:saved', { detail: result }));
        } catch (error) {
            console.error('Error saving assistant:', error);
            app.showNotification('Error saving assistant. Please try again.', 'error');
        }
    },
    
    // Export YAML
    exportYAML: () => {
        // Update form data
        editor.updateFormData();
        
        // Create blob and download link
        const blob = new Blob([editor.state.yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editor.state.currentAssistant.metadata.description.title || 'assistant'}.yaml`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    },
    
    // Import YAML
    importYAML: () => {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.yaml,.yml';
        
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                // Read file
                const content = await file.text();
                
                // Validate YAML
                const isValid = await api.validate.yaml(content);
                
                if (!isValid.is_valid) {
                    app.showNotification('Invalid YAML file. Please check the file and try again.', 'error');
                    return;
                }
                
                // Parse YAML
                editor.state.currentAssistant = jsyaml.load(content);
                editor.state.yamlContent = content;
                
                // Regenerate form
                editor.generateForm();
                
                app.showNotification('YAML file imported successfully!', 'success');
            } catch (error) {
                console.error('Error importing YAML:', error);
                app.showNotification('Error importing YAML file. Please try again.', 'error');
            }
        });
        
        // Trigger file selection
        fileInput.click();
    },
    
    // Load assistant for editing
    loadAssistant: async (assistantId) => {
        try {
            const assistant = await api.assistants.get(assistantId);
            
            // Parse YAML content
            editor.state.currentAssistant = jsyaml.load(assistant.yaml_content);
            editor.state.currentAssistant.id = assistant.id;
            editor.state.yamlContent = assistant.yaml_content;
            
            // Regenerate form
            editor.generateForm();
            
            return assistant;
        } catch (error) {
            console.error('Error loading assistant:', error);
            app.showNotification('Error loading assistant. Please try again.', 'error');
            return null;
        }
    },
    
    // Create new assistant
    createNew: () => {
        // Reset state
        editor.state.currentAssistant = null;
        editor.state.yamlContent = '';
        editor.state.isModified = false;
        editor.state.validationErrors = [];
        
        // Load default template
        editor.loadDefaultTemplate();
    },
    
    // Load default template
    loadDefaultTemplate: async () => {
        try {
            // In a real implementation, this would load from the backend
            // For now, we'll create a minimal valid structure
            editor.state.currentAssistant = {
                metadata: {
                    author: {
                        name: auth.currentUser ? auth.currentUser.name : '',
                        role: auth.currentUser ? auth.currentUser.role : '',
                        organization: auth.currentUser ? auth.currentUser.organization : '',
                        contact: auth.currentUser ? auth.currentUser.contact : ''
                    },
                    description: {
                        title: 'New Assistant',
                        summary: '',
                        coverage: '',
                        educational_level: ['Other'],
                        use_cases: [],
                        keywords: []
                    },
                    visibility: {
                        is_public: true
                    },
                    rights: 'CC by-sa 4.0',
                    history: []
                },
                assistant_instructions: {
                    context: {
                        context_definition: [''],
                        integration_strategy: [''],
                        user_data_handling: ['']
                    },
                    style_guidelines: {
                        tone: 'professional',
                        level_of_detail: 'moderate',
                        formatting_rules: []
                    },
                    final_notes: [],
                    help_text: '',
                    role: '',
                    behavior: {
                        on_tool: '',
                        on_greeting: '',
                        on_help_command: '',
                        invalid_command_response: '',
                        unrelated_topic_response: '',
                        prompt_visibility: 'hidden'
                    },
                    capabilities: [],
                    tools: {
                        commands: {},
                        options: {},
                        decorators: {}
                    }
                }
            };
            
            // Generate form
            editor.generateForm();
        } catch (error) {
            console.error('Error loading default template:', error);
            app.showNotification('Error loading default template. Please try again.', 'error');
        }
    }
};
