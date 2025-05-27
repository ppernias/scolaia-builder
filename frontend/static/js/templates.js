// Templates functionality for ADLBuilder

const templates = {
    // Current templates state
    state: {
        templates: [],
        filteredTemplates: [],
        selectedCategory: ''
    },
    
    // Initialize templates
    init: async () => {
        // Load templates template
        templates.loadTemplatesTemplate();
        
        // Set up event listeners
        templates.setupEventListeners();
        
        // Load templates if user is already authenticated
        await templates.loadTemplates();
        
        // Set up event listener for login event to load templates when user logs in
        window.addEventListener('auth:login', async () => {
            await templates.loadTemplates();
        });
    },
    
    // Load templates template
    loadTemplatesTemplate: () => {
        const templatesPage = document.getElementById('page-templates');
        const template = document.getElementById('template-templates');
        
        templatesPage.innerHTML = template.innerHTML;
    },
    
    // Set up event listeners for templates
    setupEventListeners: () => {
        // Template search
        const searchInput = document.getElementById('template-search');
        if (searchInput) {
            searchInput.addEventListener('input', templates.filterTemplates);
        }
        
        // Template category filter
        const categorySelect = document.getElementById('template-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                templates.state.selectedCategory = categorySelect.value;
                templates.filterTemplates();
            });
        }
    },
    
    // Load templates from API
    loadTemplates: async () => {
        // Check if user is authenticated
        if (!auth.currentUser) {
            // User is not authenticated, don't try to load templates yet
            templates.state.templates = [];
            templates.state.filteredTemplates = [];
            templates.renderTemplates();
            return;
        }
        
        try {
            const templatesList = await api.templates.list();
            templates.state.templates = templatesList;
            templates.state.filteredTemplates = [...templatesList];
            
            templates.renderTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
            // Only show notification if it's not a 401 Unauthorized error
            if (error.status !== 401) {
                app.showNotification('Error al cargar las plantillas. Por favor, inténtalo de nuevo.', 'error');
            }
        }
    },
    
    // Filter templates based on search and category
    filterTemplates: () => {
        const searchInput = document.getElementById('template-search');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        templates.state.filteredTemplates = templates.state.templates.filter(template => {
            // Filter by search term
            const matchesSearch = 
                template.title.toLowerCase().includes(searchTerm) ||
                template.summary.toLowerCase().includes(searchTerm) ||
                template.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
            
            // Filter by category
            const matchesCategory = 
                !templates.state.selectedCategory ||
                template.use_cases.includes(templates.state.selectedCategory);
            
            return matchesSearch && matchesCategory;
        });
        
        templates.renderTemplates();
    },
    
    // Render templates
    renderTemplates: () => {
        const templatesGrid = document.querySelector('.templates-grid');
        if (!templatesGrid) return;
        
        // Clear grid
        templatesGrid.innerHTML = '';
        
        if (templates.state.filteredTemplates.length === 0) {
            templatesGrid.innerHTML = '<p class="text-center">No templates found.</p>';
            return;
        }
        
        // Render each template
        templates.state.filteredTemplates.forEach(template => {
            const templateCard = document.createElement('div');
            templateCard.className = 'template-card';
            
            // Template content
            templateCard.innerHTML = `
                <h3>${template.title}</h3>
                <p>${template.summary}</p>
                <div class="template-tags">
                    ${template.educational_level.map(level => `<span class="template-tag">${level}</span>`).join('')}
                    ${template.use_cases.map(useCase => `<span class="template-tag">${useCase}</span>`).join('')}
                </div>
                <div class="template-actions">
                    <button class="btn btn-outline btn-sm preview-template" data-id="${template.id}">Preview</button>
                    <button class="btn btn-primary btn-sm use-template" data-id="${template.id}">Use Template</button>
                </div>
            `;
            
            // Add to grid
            templatesGrid.appendChild(templateCard);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.preview-template').forEach(button => {
            button.addEventListener('click', () => {
                templates.previewTemplate(button.dataset.id);
            });
        });
        
        document.querySelectorAll('.use-template').forEach(button => {
            button.addEventListener('click', () => {
                templates.useTemplate(button.dataset.id);
            });
        });
    },
    
    // Preview template
    previewTemplate: async (templateId) => {
        try {
            const template = await api.templates.get(templateId);
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>${template.title}</h2>
                    <div class="yaml-preview">
                        <pre>${template.yaml_content}</pre>
                    </div>
                    <div class="modal-actions mt-3">
                        <button class="btn btn-primary use-template-modal" data-id="${templateId}">Use Template</button>
                    </div>
                </div>
            `;
            
            // Add to body
            document.body.appendChild(modal);
            
            // Add event listeners
            modal.querySelector('.close').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.querySelector('.use-template-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
                templates.useTemplate(templateId);
            });
            
            // Close when clicking outside
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        } catch (error) {
            console.error('Error previewing template:', error);
            app.showNotification('Error loading template preview. Please try again.', 'error');
        }
    },
    
    // Use template
    useTemplate: async (templateId) => {
        if (!api.token.isValid()) {
            app.showNotification('Please log in to use templates.', 'warning');
            document.getElementById('login-modal').style.display = 'block';
            return;
        }
        
        try {
            // Clone template
            const assistant = await api.templates.clone(templateId);
            
            // Show success message
            app.showNotification('Template cloned successfully!', 'success');
            
            // Navigate to editor with new assistant
            app.navigateTo('editor');
            
            // Load assistant in editor
            await editor.loadAssistant(assistant.id);
        } catch (error) {
            console.error('Error using template:', error);
            app.showNotification('Error cloning template. Please try again.', 'error');
        }
    }
};
