// Editor actions
import { state, updateState } from './state.js';
import { ui } from './ui.js';
import { schema } from './schema.js';

// Función auxiliar para actualizar campos del formulario
async function updateFieldsInForm(authorData) {
    let fieldsUpdated = 0;
    let errors = 0;
    
    // Función para establecer el valor de un campo individual
    const setFieldValue = (fieldPath, value) => {
        const fieldId = `field-${fieldPath.replace(/\./g, '-')}`;
        
        // Buscar el elemento input, textarea o select directamente por ID (más preciso)
        const inputField = document.getElementById(fieldId);
        
        if (inputField) {
            // Establecer el valor según el tipo de campo
            console.log(`Actualizando campo ${fieldId} con valor: ${value}`);
            if (inputField.type === 'checkbox') {
                inputField.checked = value;
            } else {
                inputField.value = value;
            }
            
            // Disparar eventos para asegurar que la aplicación detecte el cambio
            const events = ['input', 'change'];
            events.forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                inputField.dispatchEvent(event);
            });
            
            // También actualizar el YAML directamente usando updateYamlFromForm si existe
            if (window.formGenerator && window.formGenerator.updateYamlFromForm) {
                try {
                    window.formGenerator.updateYamlFromForm(fieldPath, inputField);
                    console.log(`YAML actualizado para campo ${fieldPath}`);
                } catch (e) {
                    console.warn(`Error al actualizar YAML para ${fieldPath}:`, e);
                    errors++;
                }
            }
            
            return true;
        } else {
            // Si no encontramos por ID, intentamos con data-path como respaldo
            const alternativeField = document.querySelector(`input[data-path="${fieldPath}"], textarea[data-path="${fieldPath}"], select[data-path="${fieldPath}"]`);
            
            if (alternativeField) {
                console.log(`Campo encontrado por selector alternativo: ${fieldPath}`);
                if (alternativeField.type === 'checkbox') {
                    alternativeField.checked = value;
                } else {
                    alternativeField.value = value;
                }
                
                // Disparar eventos
                const events = ['input', 'change'];
                events.forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true });
                    alternativeField.dispatchEvent(event);
                });
                
                return true;
            } else {
                console.warn(`No se encontró el campo para: ${fieldPath} (ID: ${fieldId})`);
                errors++;
                return false;
            }
        }
    };
    
    // Establecer campos uno por uno
    for (const [key, value] of Object.entries(authorData)) {
        const fieldPath = `metadata.author.${key}`;
        if (setFieldValue(fieldPath, value)) {
            fieldsUpdated++;
        }
    }
    
    // Si no pudimos actualizar ningún campo en el primer intento, intentamos con un retraso
    if (fieldsUpdated === 0) {
        console.log('Ningún campo actualizado, intentando con retraso...');
        return new Promise(resolve => {
            setTimeout(() => {
                let delayedUpdate = 0;
                for (const [key, value] of Object.entries(authorData)) {
                    const fieldPath = `metadata.author.${key}`;
                    if (setFieldValue(fieldPath, value)) {
                        delayedUpdate++;
                    }
                }
                
                resolve({
                    success: delayedUpdate > 0,
                    count: delayedUpdate,
                    errors: errors
                });
            }, 1000);
        });
    }
    
    return {
        success: fieldsUpdated > 0,
        count: fieldsUpdated,
        errors: errors
    };
}

export const actions = {
    // Prepare editor when navigating to editor page
    prepareEditor: async () => {
        debug.info('Preparing editor...');
        try {
            // Load editor template first
            ui.loadEditorTemplate();
            
            // Initialize editor content
            debug.verbose('Initializing editor content...');
            await schema.load();
            debug.info('Editor content initialized successfully');
        } catch (error) {
            debug.error('Error preparing editor:', error);
        }
    },

    createNew: async () => {
        try {
            debug.info('Creating new assistant...');
            console.log('createNew ejecutándose correctamente');
            
            // Reset state
            updateState.setCurrentAssistant(null);
            updateState.setYamlContent('');
            updateState.setModified(false);
            
            // Update UI mode
            updateState.setMode('simple');
            ui.updateModeIndicator();
            
            // Generate form
            await schema.generateForm();
            
            // Intentar obtener datos del usuario actual
            console.log('Verificando datos de usuario en auth.currentUser...');
            let userData = null;
            
            // Comprobar si tenemos datos de usuario disponibles
            if (window.auth && window.auth.currentUser) {
                userData = window.auth.currentUser;
                console.log('Datos de usuario encontrados en auth.currentUser:', userData);
            } else {
                console.log('No se encontraron datos en auth.currentUser');
                
                // Intentar obtener datos frescos desde la API si hay un token válido
                if (window.api && window.api.token && window.api.token.isValid()) {
                    try {
                        console.log('Intentando obtener datos actualizados desde la API...');
                        const freshUserData = await window.api.user.getCurrent();
                        if (freshUserData) {
                            console.log('Datos obtenidos correctamente desde la API:', freshUserData);
                            userData = freshUserData;
                            // Actualizar auth.currentUser para futuros usos
                            if (window.auth) {
                                window.auth.currentUser = freshUserData;
                            }
                        }
                    } catch (apiError) {
                        console.error('Error al obtener datos de usuario desde la API:', apiError);
                    }
                }
            }
            
            // Populate form with user data or ask for defaults
            try {
                // Get form data
                const formData = formGenerator.getFormData();
                
                // Check if metadata and author exist, create them if not
                if (!formData.metadata) {
                    formData.metadata = {};
                }
                if (!formData.metadata.author) {
                    formData.metadata.author = {};
                }
                
                if (userData && userData.name) {
                    // Mostrar datos del usuario y preguntar si desea cargarlos
                    const userDataStr = `Nombre: ${userData.name}\nEmail: ${userData.email || ''}\nOrganización: ${userData.organization || ''}\nRol: ${userData.role || ''}`;
                    const loadUserData = confirm(`Se encontraron datos del usuario actual.\n\n${userDataStr}\n\n¿Desea cargar estos datos en el formulario?`);
                    
                    if (loadUserData) {
                        // Usar los datos del usuario autenticado
                        const authorData = {
                            name: userData.name || '',
                            email: userData.email || '',
                            organization: userData.organization || '',
                            role: userData.role || ''
                        };
                        console.log('Cargando datos del usuario autenticado:', authorData);
                        
                        // Actualizar campos del formulario con los datos del usuario
                        const result = await updateFieldsInForm(authorData);
                        if (result.success) {
                            app.showNotification(`Datos de usuario cargados con éxito (${result.count} campos)`, 'success');
                        } else {
                            app.showNotification('No se pudieron actualizar todos los campos', 'warning');
                        }
                        
                        return; // Salimos directamente para evitar la pregunta de datos predeterminados
                    }
                }
                
                // Si no hay datos de usuario o el usuario rechazó, preguntamos por datos predeterminados
                const loadDefaultData = confirm('No se encontraron datos de usuario o fueron rechazados.\n\n¿Desea cargar datos predeterminados de autor en el formulario?');
                
                if (loadDefaultData) {
                    try {
                        // Crear objeto con datos de autor predeterminados
                        const defaultAuthorData = {
                            name: 'Usuario Prueba',
                            email: 'usuario@example.com',
                            organization: 'Scolaia',
                            role: 'Developer'
                        };
                        console.log('Cargando datos predeterminados:', defaultAuthorData);
                        
                        // Usar la función updateFieldsInForm que definimos al principio del archivo
                        const result = await updateFieldsInForm(defaultAuthorData);
                        
                        if (result.success) {
                            app.showNotification(`Datos predeterminados cargados con éxito (${result.count} campos)`, 'success');
                            
                            // Mostrar alerta para verificar que se ha completado
                            alert('Datos predeterminados cargados en el formulario:\n' + 
                                  Object.entries(defaultAuthorData).map(([k, v]) => `- ${k}: ${v}`).join('\n'));
                        } else {
                            app.showNotification('No se pudieron actualizar todos los campos', 'warning');
                        }
                    } catch (err) {
                        console.error('Error al cargar datos predeterminados:', err);
                        app.showNotification('Error al cargar datos en el formulario', 'error');
                    }
                }
            } catch (err) {
                console.error('Error al procesar datos del formulario:', err);
                app.showNotification('Error al preparar el formulario', 'error');
            }
            
            debug.info('New assistant created successfully');
        } catch (error) {
            debug.error('Error creating new assistant:', error);
            app.showNotification('Error creating new assistant. Please try again.', 'error');
        }
    },

    saveAssistant: async () => {
        try {
            debug.info('Saving assistant...');
            
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
            debug.error('Error saving assistant:', error);
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
            debug.error('Error loading assistant:', error);
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
    },
    
    // Actualizar el YAML desde el formulario sin guardar en la API
    updateYamlFromForm: () => {
        try {
            debug.info('Actualizando YAML desde el formulario...');
            
            // Get form data
            const formData = formGenerator.getFormData();
            
            // Generate YAML
            const yaml = jsyaml.dump(formData);
            updateState.setYamlContent(yaml);
            
            // Actualizar la vista previa del YAML si está visible
            if (document.getElementById('yaml-modal').classList.contains('active')) {
                ui.updateYamlPreview();
            }
            
            app.showNotification('YAML actualizado correctamente', 'success');
            return true;
        } catch (error) {
            debug.error('Error actualizando YAML desde el formulario:', error);
            app.showNotification('Error actualizando YAML. Por favor, inténtalo de nuevo.', 'error');
            return false;
        }
    }
};
