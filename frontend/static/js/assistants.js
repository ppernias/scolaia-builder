// Assistants functionality for ADLBuilder

const assistants = {
    // Current assistants state
    state: {
        assistants: [],
        filteredAssistants: [],
        sortBy: 'date-desc'
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
        
        assistantsPage.innerHTML = template.innerHTML;
    },
    
    // Set up event listeners for assistants
    setupEventListeners: () => {
        // Create new assistant button
        const createButton = document.getElementById('create-new-assistant');
        if (createButton) {
            createButton.addEventListener('click', () => {
                app.navigateTo('editor');
                editor.createNew();
            });
        }
        
        // Assistant search
        const searchInput = document.getElementById('assistant-search');
        if (searchInput) {
            searchInput.addEventListener('input', assistants.filterAssistants);
        }
        
        // Assistant sort
        const sortSelect = document.getElementById('assistant-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                assistants.state.sortBy = sortSelect.value;
                assistants.sortAssistants();
                assistants.renderAssistants();
            });
        }
        
        // Listen for assistant saved event
        window.addEventListener('assistant:saved', () => {
            assistants.loadAssistants();
        });
        
        // Listen for login/logout events
        window.addEventListener('auth:login', () => {
            assistants.loadAssistants();
        });
        
        window.addEventListener('auth:logout', () => {
            assistants.state.assistants = [];
            assistants.state.filteredAssistants = [];
            assistants.renderAssistants();
        });
    },
    
    // Load assistants from API
    loadAssistants: async () => {
        try {
            const assistantsList = await api.assistants.list();
            assistants.state.assistants = assistantsList;
            
            // Apply current sort and filter
            assistants.sortAssistants();
            assistants.filterAssistants();
        } catch (error) {
            console.error('Error loading assistants:', error);
            app.showNotification('Error loading assistants. Please try again.', 'error');
        }
    },
    
    // Sort assistants
    sortAssistants: () => {
        assistants.state.filteredAssistants = [...assistants.state.assistants];
        
        switch (assistants.state.sortBy) {
            case 'date-desc':
                assistants.state.filteredAssistants.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'date-asc':
                assistants.state.filteredAssistants.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'name-asc':
                assistants.state.filteredAssistants.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'name-desc':
                assistants.state.filteredAssistants.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }
    },
    
    // Filter assistants based on search
    filterAssistants: () => {
        const searchInput = document.getElementById('assistant-search');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        if (!searchTerm) {
            assistants.sortAssistants();
        } else {
            assistants.state.filteredAssistants = assistants.state.assistants.filter(assistant => {
                return assistant.title.toLowerCase().includes(searchTerm);
            });
            
            // Apply current sort
            switch (assistants.state.sortBy) {
                case 'date-desc':
                    assistants.state.filteredAssistants.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    break;
                case 'date-asc':
                    assistants.state.filteredAssistants.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    break;
                case 'name-asc':
                    assistants.state.filteredAssistants.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'name-desc':
                    assistants.state.filteredAssistants.sort((a, b) => b.title.localeCompare(a.title));
                    break;
            }
        }
        
        assistants.renderAssistants();
    },
    
    // Render assistants
    renderAssistants: () => {
        const assistantsList = document.querySelector('.assistants-list');
        if (!assistantsList) return;
        
        // Clear list
        assistantsList.innerHTML = '';
        
        if (assistants.state.filteredAssistants.length === 0) {
            assistantsList.innerHTML = '<p class="text-center">No assistants found.</p>';
            return;
        }
        
        // Render each assistant
        assistants.state.filteredAssistants.forEach(assistant => {
            const assistantItem = document.createElement('div');
            assistantItem.className = 'assistant-item';
            
            // Format date
            const createdDate = new Date(assistant.created_at);
            const formattedDate = createdDate.toLocaleDateString();
            
            // Assistant content
            assistantItem.innerHTML = `
                <div class="assistant-info">
                    <h3>${assistant.title}</h3>
                    <div class="assistant-meta">
                        <span>Created: ${formattedDate}</span>
                        <span class="${assistant.is_public ? 'public' : 'private'}">
                            ${assistant.is_public ? 'Public' : 'Private'}
                        </span>
                    </div>
                </div>
                <div class="assistant-actions">
                    <button class="btn btn-outline btn-sm edit-assistant" data-id="${assistant.id}">Edit</button>
                    <button class="btn btn-outline btn-sm delete-assistant" data-id="${assistant.id}">Delete</button>
                </div>
            `;
            
            // Add to list
            assistantsList.appendChild(assistantItem);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.edit-assistant').forEach(button => {
            button.addEventListener('click', () => {
                assistants.editAssistant(button.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-assistant').forEach(button => {
            button.addEventListener('click', () => {
                assistants.deleteAssistant(button.dataset.id);
            });
        });
    },
    
    // Edit assistant
    editAssistant: async (assistantId) => {
        try {
            // Navigate to editor
            app.navigateTo('editor');
            
            // Load assistant in editor
            await editor.loadAssistant(assistantId);
        } catch (error) {
            console.error('Error editing assistant:', error);
            app.showNotification('Error loading assistant for editing. Please try again.', 'error');
        }
    },
    
    // Delete assistant
    deleteAssistant: async (assistantId) => {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
            return;
        }
        
        try {
            await api.assistants.delete(assistantId);
            
            // Reload assistants
            await assistants.loadAssistants();
            
            app.showNotification('Assistant deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting assistant:', error);
            app.showNotification('Error deleting assistant. Please try again.', 'error');
        }
    }
};
