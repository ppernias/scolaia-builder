// Main application functionality for ADLBuilder

const app = {
    // Initialize application
    init: async () => {
        // Set up event listeners
        app.setupEventListeners();
        
        // Load jsyaml library first
        try {
            await app.loadJsYaml();
            console.log('js-yaml loaded successfully');
        } catch (error) {
            console.error('Failed to load js-yaml:', error);
        }
        
        // Initialize components
        auth.init();
        editor.init();
        templates.init();
        assistants.init();
        // No inicializamos admin.init() aquu00ed, se inicializaru00e1 cuando el usuario inicie sesiu00f3n como administrador
        
        // Load editor template
        editor.loadEditorTemplate();
    },
    
    // Set up event listeners
    setupEventListeners: () => {
        // Navigation
        document.getElementById('nav-home').addEventListener('click', (e) => {
            e.preventDefault();
            app.navigateTo('home');
        });
        
        document.getElementById('nav-editor').addEventListener('click', (e) => {
            e.preventDefault();
            app.navigateTo('editor');
            editor.createNew();
        });
        
        document.getElementById('nav-templates').addEventListener('click', (e) => {
            e.preventDefault();
            app.navigateTo('templates');
        });
        
        document.getElementById('nav-my-assistants').addEventListener('click', (e) => {
            e.preventDefault();
            if (!api.token.isValid()) {
                app.showNotification('Please log in to view your assistants.', 'warning');
                document.getElementById('login-modal').style.display = 'block';
                return;
            }
            app.navigateTo('my-assistants');
        });
        
        // Home page buttons
        document.getElementById('get-started-button').addEventListener('click', () => {
            app.navigateTo('editor');
            editor.createNew();
        });
        
        document.getElementById('explore-templates-button').addEventListener('click', () => {
            app.navigateTo('templates');
        });
        
        // Admin navigation - solo agregar el event listener si el elemento existe
        const adminNavElement = document.getElementById('nav-admin');
        if (adminNavElement) {
            adminNavElement.addEventListener('click', (e) => {
                e.preventDefault();
                app.navigateTo('admin');
            });
        }
    },
    
    // Navigate to a page
    navigateTo: (page) => {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        
        // Create admin page if it doesn't exist
        if (page === 'admin' && !document.getElementById('page-admin')) {
            const adminPage = document.createElement('div');
            adminPage.id = 'page-admin';
            adminPage.className = 'page hidden';
            document.querySelector('main').appendChild(adminPage);
        }
        
        // Show selected page
        document.getElementById(`page-${page}`).classList.remove('hidden');
        
        // Update active navigation
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        const navElement = document.getElementById(`nav-${page}`);
        if (navElement) {
            navElement.classList.add('active');
        }
    },
    
    // Show notification
    showNotification: (message, type = 'info') => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="close-notification">&times;</button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Add event listener to close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    },
    
    // Load jsyaml library
    loadJsYaml: () => {
        return new Promise((resolve, reject) => {
            // Check if jsyaml is already loaded
            if (window.jsyaml) {
                resolve(window.jsyaml);
                return;
            }
            
            // Create script element
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
            script.integrity = 'sha512-CSBhVREyzHAjAFfBlIBakjoRUKp5h7VSweP0InR/pAJyptH7peuhCsqAI/snV+TwZmXZqoUklpXp6R6wMnYf5Q==';
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';
            
            // Set up load and error handlers
            script.onload = () => resolve(window.jsyaml);
            script.onerror = () => reject(new Error('Failed to load js-yaml library'));
            
            // Add to head
            document.head.appendChild(script);
        });
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', app.init);
