// Assistants functionality for ADLBuilder

const assistants = {
    // Current state
    state: {
        assistants: [],
        loading: false,
        error: null,
        filter: {
            search: '',
            sort: 'date-desc'
        }
    },
    
    // Initialize assistants
    init: async () => {
        // Load assistants template
        assistants.loadAssistantsTemplate();
        
        // Set up event listeners
        assistants.setupEventListeners();
        
        // Load assistants if user is logged in
        if (api.token.isValid()) {
            await assistants.loadAssistants();
        }
    },
    
    // Load assistants template
    loadAssistantsTemplate: () => {
        const assistantsPage = document.getElementById('page-my-assistants');
        const template = document.getElementById('template-my-assistants');
        
        if (assistantsPage && template) {
            assistantsPage.innerHTML = template.innerHTML;
        }
    },
    
    // Set up event listeners
    setupEventListeners: () => {
        // Assistant search
        const searchInput = document.getElementById('assistant-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                assistants.state.filter.search = e.target.value.toLowerCase();
                assistants.filterAssistants();
            });
        }
        
        // Assistant sort
        const sortSelect = document.getElementById('assistant-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                assistants.state.filter.sort = e.target.value;
                assistants.filterAssistants();
            });
        }
        
        // Create new assistant button
        const createButton = document.getElementById('create-new-assistant');
        if (createButton) {
            createButton.addEventListener('click', () => {
                app.navigateTo('editor');
                editor.createNew();
            });
        }
        
        // Listen for assistant updates
        window.addEventListener('assistants:update', async () => {
            await assistants.loadAssistants();
        });
        
        // Listen for login events
        window.addEventListener('auth:login', async () => {
            await assistants.loadAssistants();
        });
        
        // Listen for language change events
        window.addEventListener('i18n:languageChanged', () => {
            // Re-render assistants with new language
            assistants.renderAssistants();
            
            // Update placeholder text for search input
            const searchInput = document.getElementById('assistant-search');
            if (searchInput) {
                searchInput.placeholder = i18n.t('assistants.search.placeholder');
            }
            
            // Update sort options text
            const sortSelect = document.getElementById('assistant-sort');
            if (sortSelect) {
                Array.from(sortSelect.options).forEach(option => {
                    const key = option.getAttribute('data-i18n');
                    if (key) {
                        option.textContent = i18n.t(key);
                    }
                });
            }
        });
    },
    
    // Load assistants from API
    loadAssistants: async () => {
        if (!api.token.isValid()) return;
        
        // Resetear el estado para evitar problemas
        assistants.state.assistants = [];
        assistants.state.loading = true;
        assistants.state.error = null;
        
        // Mostrar estado de carga
        assistants.renderAssistants();
        
        try {
            // Obtener lista de asistentes
            const assistantsList = await api.assistants.list();
            
            // Actualizar estado con los asistentes obtenidos
            assistants.state.assistants = assistantsList || [];
        } catch (error) {
            // Solo registramos errores que no sean de autenticación
            if (error.status !== 401 || config.debug) {
                console.error('Error loading assistants:', error);
            }
            
            // Si es un error de autenticación, no lo mostramos al usuario
            // ya que es un comportamiento esperado cuando no hay sesión activa
            if (error.status !== 401) {
                assistants.state.error = error.detail || 'Error loading assistants';
            }
        } finally {
            assistants.state.loading = false;
            assistants.filterAssistants();
        }
    },
    
    // Filter and sort assistants
    filterAssistants: () => {
        const { search, sort } = assistants.state.filter;
        
        // Filter by search term
        let filteredAssistants = assistants.state.assistants.filter(assistant => 
            search === '' || assistant.title.toLowerCase().includes(search)
        );
        
        // Sort assistants
        filteredAssistants.sort((a, b) => {
            switch (sort) {
                case 'date-desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'date-asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'name-asc':
                    return a.title.localeCompare(b.title);
                case 'name-desc':
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });
        
        assistants.renderAssistants(filteredAssistants);
    },
    
    // Render assistants list
    renderAssistants: async (filteredAssistants = null) => {
        const assistantsList = document.querySelector('.assistants-list');
        if (!assistantsList) return;
        
        // Si estamos cargando, mostrar indicador de carga
        if (assistants.state.loading) {
            assistantsList.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>${i18n.t('assistants.loading')}</p>
                </div>
            `;
            return;
        }
        
        // Si hay un error, mostrar mensaje de error
        if (assistants.state.error) {
            assistantsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${assistants.state.error}</p>
                </div>
            `;
            return;
        }
        
        // Si no hay token válido, mostrar mensaje de no autenticado
        // Solo mostramos este mensaje si realmente no hay token válido
        // y no estamos en proceso de carga o con otro error
        if (!api.token.isValid() && !assistants.state.loading && !assistants.state.error) {
            assistantsList.innerHTML = `
                <div class="error-message">
                    <p>Not authenticated</p>
                </div>
            `;
            return;
        }
        
        const assistantsToRender = filteredAssistants || assistants.state.assistants;
        
        // Verificar si hay un elemento de depuración para mostrar el estado actual
        console.log('Estado actual:', {
            loading: assistants.state.loading,
            error: assistants.state.error,
            assistantsCount: (filteredAssistants || assistants.state.assistants).length
        });
        
        // Show empty state
        if (assistantsToRender.length === 0) {
            // Usar traducciones actualizadas cada vez que se renderiza
            assistantsList.innerHTML = `
                <div class="empty-state-container">
                    <div class="empty-state-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h2 class="empty-state-title">${i18n.t('assistants.empty.title')}</h2>
                    <p class="empty-state-description">
                        ${i18n.t('assistants.empty.description')}
                    </p>
                    <button id="create-first-assistant" class="btn btn-primary btn-lg">
                        <i class="fas fa-plus-circle"></i> ${i18n.t('assistants.empty.button')}
                    </button>
                </div>
            `;
            
            // Add event listener to create first assistant button
            const createButton = document.getElementById('create-first-assistant');
            if (createButton) {
                createButton.addEventListener('click', () => {
                    app.navigateTo('editor');
                    editor.createNew();
                });
            }
            
            return;
        }
        
        // Render assistants
        assistantsList.innerHTML = assistantsToRender.map(assistant => {
            // Extract tags from YAML content
            let tags = [];
            try {
                const yamlObj = jsyaml.load(assistant.yaml_content);
                tags = yamlObj.metadata?.tags || [];
            } catch (e) {
                console.error('Error parsing YAML:', e);
            }
            
            // Format date
            const createdDate = new Date(assistant.created_at).toLocaleDateString();
            
            return `
                <div class="assistant-card" data-id="${assistant.id}">
                    <h3>${assistant.title}</h3>
                    <div class="assistant-meta">
                        Created: ${createdDate} | 
                        ${assistant.is_public ? '<span class="public-badge">Public</span>' : '<span class="private-badge">Private</span>'}
                    </div>
                    <div class="assistant-tags">
                        ${tags.map(tag => `<span class="assistant-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="assistant-actions">
                        <button class="btn btn-primary edit-assistant" data-id="${assistant.id}">Edit</button>
                        <button class="btn btn-danger delete-assistant" data-id="${assistant.id}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners to assistant cards
        document.querySelectorAll('.edit-assistant').forEach(button => {
            button.addEventListener('click', (e) => {
                const assistantId = e.target.dataset.id;
                editor.loadAssistant(assistantId);
            });
        });
        
        document.querySelectorAll('.delete-assistant').forEach(button => {
            button.addEventListener('click', async (e) => {
                const assistantId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
                    await assistants.deleteAssistant(assistantId);
                }
            });
        });
    },
    
    // Delete assistant
    deleteAssistant: async (assistantId) => {
        try {
            await api.assistants.delete(assistantId);
            
            // Remove from state
            assistants.state.assistants = assistants.state.assistants.filter(
                assistant => assistant.id !== parseInt(assistantId)
            );
            
            // Update UI
            assistants.renderAssistants();
            
            app.showNotification('Assistant deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting assistant:', error);
            app.showNotification(error.detail || 'Error deleting assistant. Please try again.', 'error');
        }
    }
};
