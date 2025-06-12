// Dynamic form generator for ADLMaker

// Create formGenerator object
window.formGenerator = {
    // Generate form based on schema
    generateForm: (schema, parentPath = '', mode = 'simple') => {
        debug.info('Generating form with schema:', schema);
        debug.info('Mode:', mode);
        
        // Log schema properties for debugging
        if (schema && schema.properties) {
            debug.info('Schema properties:', Object.keys(schema.properties));
            
            // Check if there are any custom properties for simple mode
            if (mode === 'simple') {
                const customProps = Object.entries(schema.properties)
                    .filter(([key, prop]) => prop['x-category'] === 'custom')
                    .map(([key]) => key);
                debug.info('Custom properties for simple mode:', customProps.length ? customProps : 'None');
            }
        }
        
        if (!schema || !schema.properties) {
            debug.error('Invalid schema structure:', schema);
            return '<div class="error-message">Invalid schema structure</div>';
        }
        
        let formHtml = '';
        let hasFields = false;
        
        // Process each property in the schema
        for (const [key, property] of Object.entries(schema.properties)) {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            debug.verbose(`Processing property: ${currentPath}, type: ${property.type}, category: ${property['x-category']}`);
            
            // For objects, recursively generate form elements for their properties
            if (property.type === 'object' && property.properties) {
                // Create a section for the object
                const sectionTitle = property.title || formGenerator.formatLabel(key);
                const sectionHtml = `<div class="form-section">
                    <h3>${sectionTitle}</h3>
                    <div class="form-section-content">
                        ${formGenerator.generateForm(property, currentPath, mode)}
                    </div>
                </div>`;
                
                formHtml += sectionHtml;
                hasFields = true;
            } else {
                // Skip non-custom properties in simple mode
                if (mode === 'simple' && property['x-category'] !== 'custom') {
                    debug.verbose(`Skipping non-custom property: ${currentPath}`);
                    continue;
                }
                
                // Generate form element based on property type
                const fieldHtml = formGenerator.generateField(key, property, currentPath);
                if (fieldHtml) {
                    formHtml += fieldHtml;
                    hasFields = true;
                }
            }
        }
        
        // If no fields were generated, return a message
        if (!hasFields) {
            debug.warn('No fields were generated for the form');
            if (mode === 'simple') {
                return '<div class="info-message">No editable fields available in simple mode. Switch to advanced mode to edit all fields.</div>';
            }
        }
        
        return formHtml;
    },
    
    // Generate a form field based on property type
    generateField: (key, property, path) => {
        // Skip if property doesn't have a type
        if (!property.type) {
            return '';
        }
        
        // Get field label
        const label = property.title || formGenerator.formatLabel(key);
        
        // Generate field based on type
        switch (property.type) {
            case 'string':
                return formGenerator.generateStringField(label, path, property);
            case 'boolean':
                return formGenerator.generateBooleanField(label, path, property);
            case 'number':
            case 'integer':
                return formGenerator.generateNumberField(label, path, property);
            case 'array':
                return formGenerator.generateArrayField(label, path, property);
            case 'object':
                return formGenerator.generateObjectField(label, path, property);
            default:
                return '';
        }
    },
    
    // Format a key as a readable label
    formatLabel: (key) => {
        // Remove leading symbols like '/' or '+++'
        const cleanKey = key.replace(/^[\/+]+/, '');
        
        // Convert camelCase or snake_case to Title Case with spaces
        return cleanKey
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    },
    
    // Generate a string input field
    generateStringField: (label, path, property) => {
        const defaultValue = schemaLoader.getDefaultValue(property) || '';
        const description = property.description ? `<div class="field-description">${property.description}</div>` : '';
        const fieldId = `field-${path.replace(/\./g, '-')}`;
        
        // Use textarea for long text
        if (property.format === 'long-text' || property.format === 'markdown' || defaultValue.length > 100) {
            return `
                <div class="form-group" data-path="${path}">
                    <label for="${fieldId}">${label}</label>
                    ${description}
                    <textarea id="${fieldId}" class="form-control" rows="5" data-path="${path}">${defaultValue}</textarea>
                </div>
            `;
        }
        
        // Use regular input for short text
        return `
            <div class="form-group" data-path="${path}">
                <label for="${fieldId}">${label}</label>
                ${description}
                <input type="text" id="${fieldId}" class="form-control" value="${defaultValue}" data-path="${path}">
            </div>
        `;
    },
    
    // Generate a boolean checkbox field
    generateBooleanField: (label, path, property) => {
        const defaultValue = schemaLoader.getDefaultValue(property) || false;
        const description = property.description ? `<div class="field-description">${property.description}</div>` : '';
        const fieldId = `field-${path.replace(/\./g, '-')}`;
        
        return `
            <div class="form-group checkbox-group" data-path="${path}">
                <div class="checkbox-container">
                    <input type="checkbox" id="${fieldId}" class="form-control" ${defaultValue ? 'checked' : ''} data-path="${path}">
                    <label for="${fieldId}">${label}</label>
                </div>
                ${description}
            </div>
        `;
    },
    
    // Generate a number input field
    generateNumberField: (label, path, property) => {
        const defaultValue = schemaLoader.getDefaultValue(property) || 0;
        const description = property.description ? `<div class="field-description">${property.description}</div>` : '';
        const fieldId = `field-${path.replace(/\./g, '-')}`;
        
        return `
            <div class="form-group" data-path="${path}">
                <label for="${fieldId}">${label}</label>
                ${description}
                <input type="number" id="${fieldId}" class="form-control" value="${defaultValue}" data-path="${path}">
            </div>
        `;
    },
    
    // Generate an array field
    generateArrayField: (label, path, property) => {
        const defaultValue = schemaLoader.getDefaultValue(property) || [];
        const description = property.description ? `<div class="field-description">${property.description}</div>` : '';
        const fieldId = `field-${path.replace(/\./g, '-')}`;
        
        // For simple arrays of strings
        if (property.items && property.items.type === 'string') {
            const itemsHtml = defaultValue.map((item, index) => {
                return `
                    <div class="array-item">
                        <input type="text" class="form-control" value="${item}" data-path="${path}[${index}]">
                        <button type="button" class="btn btn-sm btn-danger remove-item" data-index="${index}">×</button>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="form-group array-group" data-path="${path}">
                    <label>${label}</label>
                    ${description}
                    <div class="array-items" id="${fieldId}-items">
                        ${itemsHtml}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline add-item" data-path="${path}">Add Item</button>
                </div>
            `;
        }
        
        // For complex arrays, we might need a different approach
        return `
            <div class="form-group" data-path="${path}">
                <label>${label}</label>
                ${description}
                <div class="complex-array-editor">
                    <textarea class="form-control" rows="5" data-path="${path}">${JSON.stringify(defaultValue, null, 2)}</textarea>
                </div>
            </div>
        `;
    },
    
    // Generate an object field
    generateObjectField: (label, path, property) => {
        // Special handling for tools section
        if (path === 'assistant_instructions.tools') {
            return formGenerator.generateToolsSection(label, path, property);
        }
        
        const description = property.description ? `<div class="field-description">${property.description}</div>` : '';
        
        // If the object has properties, generate nested form
        if (property.properties) {
            const nestedForm = formGenerator.generateForm(property, path, 'advanced'); // Always show all properties in nested objects
            
            if (nestedForm) {
                return `
                    <div class="form-group object-group" data-path="${path}">
                        <div class="object-header">
                            <label>${label}</label>
                            ${description}
                        </div>
                        <div class="object-content">
                            ${nestedForm}
                        </div>
                    </div>
                `;
            }
        }
        
        // For objects without defined properties or additionalProperties
        const defaultValue = schemaLoader.getDefaultValue(property) || {};
        const fieldId = `field-${path.replace(/\./g, '-')}`;
        
        return `
            <div class="form-group" data-path="${path}">
                <label for="${fieldId}">${label}</label>
                ${description}
                <textarea id="${fieldId}" class="form-control" rows="5" data-path="${path}">${JSON.stringify(defaultValue, null, 2)}</textarea>
            </div>
        `;
    },
    
    // Special handling for tools section
    generateToolsSection: (label, path, property) => {
        const description = property.description ? `<div class="field-description">${property.description}</div>` : '';
        
        // Create tabs for commands, options, and decorators
        return `
            <div class="form-group tools-section" data-path="${path}">
                <div class="tools-header">
                    <label>${label}</label>
                    ${description}
                </div>
                <div class="tools-tabs">
                    <div class="tab-headers">
                        <button class="tab-header active" data-tab="commands">Commands</button>
                        <button class="tab-header" data-tab="options">Options</button>
                        <button class="tab-header" data-tab="decorators">Decorators</button>
                    </div>
                    <div class="tab-content">
                        <div class="tab-pane active" id="tab-commands">
                            ${formGenerator.generateToolItems('commands', `${path}.commands`, property.properties.commands)}
                        </div>
                        <div class="tab-pane" id="tab-options">
                            ${formGenerator.generateToolItems('options', `${path}.options`, property.properties.options)}
                        </div>
                        <div class="tab-pane" id="tab-decorators">
                            ${formGenerator.generateToolItems('decorators', `${path}.decorators`, property.properties.decorators)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Generate tool items (commands, options, decorators)
    generateToolItems: (type, path, property) => {
        if (!property || !property.default) {
            return `<div class="no-items">No ${type} defined</div>`;
        }
        
        const items = property.default;
        let itemsHtml = '';
        
        // Generate HTML for each tool item
        for (const [key, item] of Object.entries(items)) {
            const itemPath = `${path}.${key}`;
            const prefix = type === 'decorators' ? '+++' : '/';
            
            itemsHtml += `
                <div class="tool-item" data-path="${itemPath}">
                    <div class="tool-header">
                        <span class="tool-prefix">${prefix}</span>
                        <span class="tool-key">${key.replace(/^[\/+]+/, '')}</span>
                        <div class="tool-actions">
                            <button type="button" class="btn btn-sm btn-danger remove-tool" data-key="${key}">Delete</button>
                        </div>
                    </div>
                    <div class="tool-content">
                        <div class="form-group">
                            <label>Display Name</label>
                            <input type="text" class="form-control" value="${item.display_name || ''}" data-path="${itemPath}.display_name">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <input type="text" class="form-control" value="${item.description || ''}" data-path="${itemPath}.description">
                        </div>
                        <div class="form-group">
                            <label>Prompt</label>
                            <textarea class="form-control" rows="3" data-path="${itemPath}.prompt">${item.prompt || ''}</textarea>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add button to create new items
        const addButton = `
            <div class="add-tool-container">
                <button type="button" class="btn btn-outline add-tool" data-type="${type}" data-path="${path}">
                    <i class="fas fa-plus"></i> Add ${type.slice(0, -1)}
                </button>
            </div>
        `;
        
        return `
            <div class="tool-items">
                ${itemsHtml}
            </div>
            ${addButton}
        `;
    },
    
    // Setup event listeners for the form
    setupFormEventListeners: () => {
        const form = document.querySelector('.editor-form');
        if (!form) return;
        
        // Handle input changes - solo marcamos como modificado pero no actualizamos el YAML
        form.addEventListener('input', (e) => {
            const target = e.target;
            const path = target.getAttribute('data-path');
            
            if (path) {
                // Solo marcamos el formulario como modificado
                editor.state.isModified = true;
            }
        });
        
        // Handle add item button clicks for arrays
        form.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-item')) {
                const path = e.target.getAttribute('data-path');
                formGenerator.addArrayItem(path);
            } else if (e.target.classList.contains('remove-item')) {
                const path = e.target.closest('[data-path]').getAttribute('data-path');
                const index = parseInt(e.target.getAttribute('data-index'));
                formGenerator.removeArrayItem(path, index);
            } else if (e.target.classList.contains('add-tool')) {
                const type = e.target.getAttribute('data-type');
                const path = e.target.getAttribute('data-path');
                formGenerator.addToolItem(type, path);
            } else if (e.target.classList.contains('remove-tool')) {
                const toolItem = e.target.closest('.tool-item');
                const path = toolItem.getAttribute('data-path');
                const key = e.target.getAttribute('data-key');
                formGenerator.removeToolItem(path, key);
            } else if (e.target.classList.contains('tab-header')) {
                // Handle tab switching
                const tabId = e.target.getAttribute('data-tab');
                formGenerator.switchTab(e.target, tabId);
            }
        });
    },
    
    // Switch between tabs in the tools section
    switchTab: (tabButton, tabId) => {
        // Remove active class from all tabs
        const tabHeaders = document.querySelectorAll('.tab-header');
        tabHeaders.forEach(header => header.classList.remove('active'));
        
        // Add active class to clicked tab
        tabButton.classList.add('active');
        
        // Hide all tab panes
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Show selected tab pane
        const selectedPane = document.getElementById(`tab-${tabId}`);
        if (selectedPane) {
            selectedPane.classList.add('active');
        }
    },
    
    // Add a new item to an array
    addArrayItem: (path) => {
        const arrayContainer = document.querySelector(`[data-path="${path}"] .array-items`);
        if (!arrayContainer) return;
        
        const items = arrayContainer.querySelectorAll('.array-item');
        const newIndex = items.length;
        
        const newItem = document.createElement('div');
        newItem.className = 'array-item';
        newItem.innerHTML = `
            <input type="text" class="form-control" value="" data-path="${path}[${newIndex}]">
            <button type="button" class="btn btn-sm btn-danger remove-item" data-index="${newIndex}">×</button>
        `;
        
        arrayContainer.appendChild(newItem);
        
        // Update YAML
        const yamlObj = jsyaml.load(editor.state.yamlContent) || {};
        const pathParts = path.split('.');
        
        let current = yamlObj;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (i === pathParts.length - 1) {
                if (!Array.isArray(current[part])) {
                    current[part] = [];
                }
                current[part].push('');
            } else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
        
        editor.state.yamlContent = jsyaml.dump(yamlObj);
        editor.state.isModified = true;
        editor.updateYamlPreview();
    },
    
    // Remove an item from an array
    removeArrayItem: (path, index) => {
        const arrayContainer = document.querySelector(`[data-path="${path}"] .array-items`);
        if (!arrayContainer) return;
        
        const items = arrayContainer.querySelectorAll('.array-item');
        if (index >= 0 && index < items.length) {
            items[index].remove();
            
            // Update indices for remaining items
            const remainingItems = arrayContainer.querySelectorAll('.array-item');
            remainingItems.forEach((item, i) => {
                const input = item.querySelector('input');
                const removeButton = item.querySelector('.remove-item');
                
                if (input) {
                    input.setAttribute('data-path', `${path}[${i}]`);
                }
                
                if (removeButton) {
                    removeButton.setAttribute('data-index', i);
                }
            });
            
            // Update YAML
            const yamlObj = jsyaml.load(editor.state.yamlContent) || {};
            const pathParts = path.split('.');
            
            let current = yamlObj;
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                if (i === pathParts.length - 1) {
                    if (Array.isArray(current[part])) {
                        current[part].splice(index, 1);
                    }
                } else {
                    if (!current[part]) {
                        return; // Path doesn't exist
                    }
                    current = current[part];
                }
            }
            
            editor.state.yamlContent = jsyaml.dump(yamlObj);
            editor.state.isModified = true;
            editor.updateYamlPreview();
        }
    },
    
    // Add a new tool item (command, option, decorator)
    addToolItem: (type, path) => {
        // Create a dialog to get the new tool key
        const prefix = type === 'decorators' ? '+++' : '/';
        const toolName = prompt(`Enter ${type.slice(0, -1)} name (without ${prefix}):`);
        
        if (!toolName) return;
        
        const key = `${prefix}${toolName}`;
        const itemPath = `${path}.${key}`;
        
        // Create new tool item in the UI
        const toolsContainer = document.querySelector(`#tab-${type} .tool-items`);
        if (!toolsContainer) return;
        
        const newItem = document.createElement('div');
        newItem.className = 'tool-item';
        newItem.setAttribute('data-path', itemPath);
        newItem.innerHTML = `
            <div class="tool-header">
                <span class="tool-prefix">${prefix}</span>
                <span class="tool-key">${toolName}</span>
                <div class="tool-actions">
                    <button type="button" class="btn btn-sm btn-danger remove-tool" data-key="${key}">Delete</button>
                </div>
            </div>
            <div class="tool-content">
                <div class="form-group">
                    <label>Display Name</label>
                    <input type="text" class="form-control" value="${toolName}" data-path="${itemPath}.display_name">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="form-control" value="" data-path="${itemPath}.description">
                </div>
                <div class="form-group">
                    <label>Prompt</label>
                    <textarea class="form-control" rows="3" data-path="${itemPath}.prompt"></textarea>
                </div>
            </div>
        `;
        
        toolsContainer.appendChild(newItem);
        
        // Update YAML
        const yamlObj = jsyaml.load(editor.state.yamlContent) || {};
        const pathParts = path.split('.');
        
        let current = yamlObj;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (i === pathParts.length - 1) {
                if (!current[part]) {
                    current[part] = {};
                }
                current[part][key] = {
                    display_name: toolName,
                    description: '',
                    prompt: ''
                };
            } else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
        
        editor.state.yamlContent = jsyaml.dump(yamlObj);
        editor.state.isModified = true;
        editor.updateYamlPreview();
    },
    
    // Remove a tool item
    removeToolItem: (path, key) => {
        const toolItem = document.querySelector(`[data-path="${path}"]`);
        if (!toolItem) return;
        
        toolItem.remove();
        
        // Update YAML
        const yamlObj = jsyaml.load(editor.state.yamlContent) || {};
        const parentPath = path.substring(0, path.lastIndexOf('.'));
        const pathParts = parentPath.split('.');
        
        let current = yamlObj;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (i === pathParts.length - 1) {
                if (current[part] && current[part][key]) {
                    delete current[part][key];
                }
            } else {
                if (!current[part]) {
                    return; // Path doesn't exist
                }
                current = current[part];
            }
        }
        
        editor.state.yamlContent = jsyaml.dump(yamlObj);
        editor.state.isModified = true;
        editor.updateYamlPreview();
    },
    
    // Update YAML content based on form changes
    // Get form data from the form
    getFormData: () => {
        debug.verbose('Getting form data from editor');
        
        // If we have YAML content, use that as the source of truth
        if (editor.state.yamlContent) {
            try {
                const yamlObj = jsyaml.load(editor.state.yamlContent);
                debug.verbose('Form data loaded from YAML content');
                return yamlObj || {};
            } catch (e) {
                debug.error('Error parsing YAML content:', e);
                return {};
            }
        }
        
        // If no YAML content, build from form elements
        const formData = {};
        const formElements = document.querySelectorAll('#editor-form-container input, #editor-form-container textarea, #editor-form-container select');
        
        formElements.forEach(element => {
            const path = element.dataset.path;
            if (!path) return;
            
            let value;
            if (element.type === 'checkbox') {
                value = element.checked;
            } else {
                value = element.value;
                
                // Try to parse JSON for complex fields
                if (element.classList.contains('complex-array-editor') || 
                    (element.parentElement && element.parentElement.classList.contains('complex-array-editor'))) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Keep as string if not valid JSON
                    }
                }
            }
            
            // Handle array items
            const arrayMatch = path.match(/(.*?)\[(\d+)\]$/);
            if (arrayMatch) {
                const arrayPath = arrayMatch[1];
                const index = parseInt(arrayMatch[2]);
                
                // Build path to array
                const pathParts = arrayPath.split('.');
                let current = formData;
                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];
                    if (i === pathParts.length - 1) {
                        if (!Array.isArray(current[part])) {
                            current[part] = [];
                        }
                        // Ensure array has enough elements
                        while (current[part].length <= index) {
                            current[part].push('');
                        }
                        current[part][index] = value;
                    } else {
                        if (!current[part]) {
                            current[part] = {};
                        }
                        current = current[part];
                    }
                }
            } else {
                // Handle regular properties
                const pathParts = path.split('.');
                let current = formData;
                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];
                    if (i === pathParts.length - 1) {
                        current[part] = value;
                    } else {
                        if (!current[part]) {
                            current[part] = {};
                        }
                        current = current[part];
                    }
                }
            }
        });
        
        debug.verbose('Form data built from form elements');
        return formData;
    },
    
    // Update YAML content based on form changes
    updateYamlFromForm: (path, inputElement) => {
        let value;
        
        // Get value based on input type
        if (inputElement.type === 'checkbox') {
            value = inputElement.checked;
        } else if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
            value = inputElement.value;
            
            // Try to parse JSON for complex fields
            if (inputElement.classList.contains('complex-array-editor') || 
                (inputElement.parentElement && inputElement.parentElement.classList.contains('complex-array-editor'))) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Keep as string if not valid JSON
                }
            }
        } else {
            return;
        }
        
        // Handle array items
        const arrayMatch = path.match(/(.*?)\[(\d+)\]$/);
        if (arrayMatch) {
            const arrayPath = arrayMatch[1];
            const index = parseInt(arrayMatch[2]);
            
            // Update YAML
            const yamlObj = jsyaml.load(editor.state.yamlContent) || {};
            const pathParts = arrayPath.split('.');
            
            let current = yamlObj;
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                if (i === pathParts.length - 1) {
                    if (!Array.isArray(current[part])) {
                        current[part] = [];
                    }
                    // Ensure array has enough elements
                    while (current[part].length <= index) {
                        current[part].push('');
                    }
                    current[part][index] = value;
                } else {
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
            }
            
            editor.state.yamlContent = jsyaml.dump(yamlObj);
            editor.state.isModified = true;
            editor.updateYamlPreview();
            return;
        }
        
        // Handle regular properties
        const yamlObj = jsyaml.load(editor.state.yamlContent) || {};
        const pathParts = path.split('.');
        
        let current = yamlObj;
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (i === pathParts.length - 1) {
                current[part] = value;
            } else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
        
        editor.state.yamlContent = jsyaml.dump(yamlObj);
        editor.state.isModified = true;
        editor.updateYamlPreview();
    }
};
