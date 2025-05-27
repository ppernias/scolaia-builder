// Templates functionality for ADLBuilder

const templates = {
    // Current state
    state: {
        templates: [],
        loading: false,
        error: null,
        filter: {
            search: '',
            category: ''
        }
    },
    
    // Initialize templates
    init: async () => {
        // Load templates template
        templates.loadTemplatesTemplate();
        
        // Set up event listeners
        templates.setupEventListeners();
        
        // Load templates from API
        await templates.loadTemplates();
    },
    
    // Load templates template
    loadTemplatesTemplate: () => {
        const templatesPage = document.getElementById('page-templates');
        const template = document.getElementById('template-templates');
        
        if (templatesPage && template) {
            templatesPage.innerHTML = template.innerHTML;
        }
    },
    
    // Set up event listeners
    setupEventListeners: () => {
        // Template search
        const searchInput = document.getElementById('template-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                templates.state.filter.search = e.target.value.toLowerCase();
                templates.filterTemplates();
            });
        }
        
        // Template category filter
        const categorySelect = document.getElementById('template-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                templates.state.filter.category = e.target.value.toLowerCase();
                templates.filterTemplates();
            });
        }
    },
    
    // Load templates from API
    loadTemplates: async () => {
        try {
            templates.state.loading = true;
            templates.state.error = null;
            templates.renderTemplates(); // Show loading state
            
            const templatesList = await api.templates.list();
            templates.state.templates = templatesList;
            
            templates.renderTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
            templates.state.error = error.detail || 'Error loading templates';
            templates.renderTemplates(); // Show error state
        } finally {
            templates.state.loading = false;
        }
    },
    
    // Filter templates based on search and category
    filterTemplates: () => {
        const { search, category } = templates.state.filter;
        
        const filteredTemplates = templates.state.templates.filter(template => {
            // Filter by search term
            const matchesSearch = search === '' || 
                template.title.toLowerCase().includes(search) || 
                template.description.toLowerCase().includes(search);
            
            // Filter by category
            const matchesCategory = category === '' || 
                template.tags.some(tag => tag.toLowerCase() === category);
            
            return matchesSearch && matchesCategory;
        });
        
        templates.renderTemplates(filteredTemplates);
    },
    
    // Render templates list
    renderTemplates: (filteredTemplates = null) => {
        const templatesGrid = document.querySelector('.templates-grid');
        if (!templatesGrid) return;
        
        // Show loading state
        if (templates.state.loading) {
            templatesGrid.innerHTML = '<div class="loading">Loading templates...</div>';
            return;
        }
        
        // Show error state
        if (templates.state.error) {
            templatesGrid.innerHTML = `<div class="error-message">${templates.state.error}</div>`;
            return;
        }
        
        const templatesToRender = filteredTemplates || templates.state.templates;
        
        // Show empty state
        if (templatesToRender.length === 0) {
            templatesGrid.innerHTML = '<div class="empty-message">No templates found</div>';
            return;
        }
        
        // Render templates
        templatesGrid.innerHTML = templatesToRender.map(template => `
            <div class="template-card" data-id="${template.id}">
                <h3>${template.title}</h3>
                <p>${template.description}</p>
                <div class="template-tags">
                    ${template.tags.map(tag => `<span class="template-tag">${tag}</span>`).join('')}
                </div>
                <button class="btn btn-primary use-template" data-id="${template.id}">Use Template</button>
            </div>
        `).join('');
        
        // Add event listeners to template cards
        document.querySelectorAll('.use-template').forEach(button => {
            button.addEventListener('click', async (e) => {
                const templateId = e.target.dataset.id;
                await templates.useTemplate(templateId);
            });
        });
    },
    
    // Use a template
    useTemplate: async (templateId) => {
        try {
            const template = await api.templates.get(templateId);
            
            // Set template content in editor
            editor.state.yamlContent = template.content;
            editor.state.currentAssistant = null; // Reset current assistant
            editor.state.isModified = true;
            
            // Navigate to editor
            app.navigateTo('editor');
            editor.updateEditorMode();
            
            app.showNotification('Template loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading template:', error);
            app.showNotification(error.detail || 'Error loading template. Please try again.', 'error');
        }
    }
};
